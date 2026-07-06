import { useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Check, X, Loader2, Download
} from 'lucide-react';
import client from '../../api/client';

const ExcelUploadView = ({ loadStats = () => {} }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [downloadingStock, setDownloadingStock] = useState(false);

  const downloadCurrentStock = async () => {
    setDownloadingStock(true);
    try {
      const { data } = await client.get('/pharmacy/inventory?limit=1000000&page=1');
      if (!data || !data.items || data.items.length === 0) {
        toast.error('No stock items found to download.');
        return;
      }

      // Format standard Excel rows matching upload headers:
      const rows = data.items.map((item, index) => {
        let expiryStr = '';
        if (item.expiry) {
          const date = new Date(item.expiry);
          if (!isNaN(date.getTime())) {
            expiryStr = date.toISOString().split('T')[0];
          }
        }
        return {
          'Sno.': item.sNo || (index + 1),
          'Item Name': item.itemName,
          'Old MRP': item.oldMrp || 0,
          'Pack': item.pack || '0',
          'MRP': item.mrp || 0,
          'Quantity': item.quantity || 0,
          'Free': item.free || 0,
          'Rate': item.rate || 0,
          'Dis': item.dis || 0,
          'Batch': item.batch,
          'Expiry': expiryStr,
          'NRate': item.nRate || 0,
          'HSN': item.hsn || '0',
          'SGST': item.sgst || 0,
          'CST': item.cst || 0,
          'Amount': item.amount || 0
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Current Stock');
      XLSX.writeFile(workbook, `pharmacy_current_stock_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Current stock downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download current stock');
    } finally {
      setDownloadingStock(false);
    }
  };

  // Parse Excel Date helper
  const parseExcelDate = (val) => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val === 'number') {
      return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    const str = String(val).trim();
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) return new Date(parsed);

    // Try parsing MM/YY or MM/YYYY or MM-YY or MM-YYYY
    const match = str.match(/^(\d{1,2})[-/](\d{2,4})$/);
    if (match) {
      const month = parseInt(match[1]) - 1;
      let year = parseInt(match[2]);
      if (year < 100) year += 2000;
      return new Date(year, month + 1, 0); // last day of that month
    }
    return new Date(); // fallback
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processUpload = async () => {
    if (!file) {
      toast.error('Please select a file first.');
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      toast.error('Invalid file format. Please upload a .xlsx or .xls file.');
      return;
    }

    setUploading(true);
    setSummary(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.evt ? evt.evt.target.result : evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet);

        if (rawRows.length === 0) {
          toast.error('The uploaded Excel sheet contains no rows.');
          setUploading(false);
          return;
        }

        // Validate Column Structure
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
        const requiredColumns = [
          'Sno.', 'Item Name', 'Old MRP', 'Pack', 'MRP', 'Quantity', 'Free', 
          'Rate', 'Dis', 'Batch', 'Expiry', 'NRate', 'HSN', 'SGST', 'CST', 'Amount'
        ];

        const normalizedHeaders = headers.map(h => String(h).trim().toLowerCase());
        const missing = [];
        requiredColumns.forEach(col => {
          if (!normalizedHeaders.includes(col.toLowerCase())) {
            missing.push(col);
          }
        });

        if (missing.length > 0) {
          toast.error(`Columns missing from Excel: ${missing.join(', ')}`);
          setUploading(false);
          return;
        }

        // Map and parse columns, ensuring defaults to 0 for missing values
        const parsedItems = rawRows.map(row => {
          const getVal = (colName, defaultVal = 0) => {
            const key = Object.keys(row).find(k => k.trim().toLowerCase() === colName.toLowerCase());
            const val = key ? row[key] : undefined;
            return val === undefined || val === null || val === "" ? defaultVal : val;
          };

          const rawExpiry = getVal('Expiry', null);
          const expiryDate = rawExpiry ? parseExcelDate(rawExpiry) : new Date();

          return {
            sNo: Number(getVal('Sno.', 0)),
            itemName: String(getVal('Item Name', '')).trim(),
            oldMrp: Number(getVal('Old MRP', 0)),
            pack: String(getVal('Pack', '0')).trim(),
            mrp: Number(getVal('MRP', 0)),
            quantity: Number(getVal('Quantity', 0)),
            free: Number(getVal('Free', 0)),
            rate: Number(getVal('Rate', 0)),
            dis: Number(getVal('Dis', 0)),
            batch: String(getVal('Batch', '')).trim(),
            expiry: expiryDate.toISOString(),
            nRate: Number(getVal('NRate', 0)),
            hsn: String(getVal('HSN', '0')).trim(),
            sgst: Number(getVal('SGST', 0)),
            cst: Number(getVal('CST', 0)),
            amount: Number(getVal('Amount', 0))
          };
        });

        const validItems = parsedItems.filter(item => item.itemName && item.batch);
        if (validItems.length === 0) {
          toast.error('No valid records found in Excel sheet.');
          setUploading(false);
          return;
        }

        // POST JSON payload to backend
        const { data: uploadRes } = await client.post('/pharmacy/inventory/upload', {
          items: validItems,
          fileName: file.name
        });

        toast.success(uploadRes.message || 'Import successful!');
        setSummary(uploadRes);
        setFile(null);
        loadStats();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error processing Excel sheet');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 animate-fade-in text-gray-700">
      {/* Upload Box */}
      <div className="md:col-span-2 space-y-4">
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`card p-8 text-center border-2 border-dashed flex flex-col items-center justify-center min-h-[300px] transition duration-200 ${
            dragActive 
              ? 'border-orange-500 bg-orange-50/50' 
              : 'border-orange-200 bg-white hover:border-orange-400'
          }`}
        >
          <FileSpreadsheet className="h-12 w-12 text-orange-400 mb-4" />
          <h3 className="font-extrabold text-gray-800 text-lg">Upload Stock Spreadsheet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Drag and drop your Excel file here, or browse files on your computer. Supports .xlsx and .xls formats.
          </p>

          <label className="btn text-xs py-2.5 px-4 mt-6 cursor-pointer">
            Browse Files
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
          </label>

          {file && (
            <div className="mt-6 p-3 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 max-w-md">
              <Check className="text-green-600 h-5 w-5 bg-green-50 rounded-full p-0.5 border border-green-200" />
              <div className="text-left">
                <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-gray-400 font-semibold">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600 ml-auto p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {file && (
            <button 
              onClick={processUpload} 
              disabled={uploading}
              className="btn text-xs py-2.5 px-6 mt-4 shadow-lg shadow-orange-500/10 cursor-pointer disabled:bg-orange-300"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing records...
                </>
              ) : 'Start Import'}
            </button>
          )}
        </div>

        {/* Upload Summary Card */}
        {summary && (
          <div className="card p-6 bg-gradient-to-br from-white to-green-50/10 border-green-100 space-y-4 shadow-lg">
            <h4 className="font-black text-green-800 text-sm flex items-center gap-2">
              <Check className="h-5 w-5 bg-green-100 text-green-700 rounded-full p-0.5" />
              Import Completed Successfully
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white border border-green-50 rounded-xl">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Rows Read</span>
                <span className="text-2xl font-black text-gray-800">{summary.totalRows}</span>
              </div>
              <div className="p-3 bg-white border border-green-50 rounded-xl">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Created / Seeded</span>
                <span className="text-2xl font-black text-green-700">{summary.created}</span>
              </div>
              <div className="p-3 bg-white border border-green-50 rounded-xl">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Duplicate Batches</span>
                <span className="text-2xl font-black text-amber-600">{summary.skipped || 0}</span>
              </div>
            </div>
            {summary.errors && summary.errors.length > 0 && (
              <div className="border-t border-green-100 pt-3">
                <p className="text-[10px] font-extrabold text-red-600 uppercase mb-2">Import Issue Log:</p>
                <div className="max-h-[100px] overflow-y-auto space-y-1 text-[10px] text-gray-500 font-semibold">
                  {summary.errors.map((e, idx) => (
                    <p key={idx}>• Row {e.row}: {e.message}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Download / Guidelines */}
      <div className="card p-6 space-y-4 bg-white border border-orange-100/55 shadow-md">
        <h4 className="font-extrabold text-gray-900 text-sm border-b border-orange-50 pb-2">Guidelines & templates</h4>
        <div className="space-y-3.5 text-xs">
          <p className="text-gray-500 leading-relaxed font-semibold">
            To ensure successful data mapping, please structure your stock spreadsheet exactly like our standard template sheet.
          </p>
          <button 
            type="button" 
            onClick={downloadCurrentStock}
            disabled={downloadingStock}
            className="btn-secondary w-full py-2.5 text-xs font-bold border-orange-200 hover:bg-orange-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {downloadingStock ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-orange-500" />
                Download Current Template
              </>
            )}
          </button>
          <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-3.5 space-y-2 text-[10px] text-gray-500 font-semibold leading-normal">
            <p className="font-extrabold text-orange-800 uppercase">Required Headers:</p>
            <p>Sno., Item Name, Old MRP, Pack, MRP, Quantity, Free, Rate, Dis, Batch, Expiry, NRate, HSN, SGST, CST, Amount</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadView;
