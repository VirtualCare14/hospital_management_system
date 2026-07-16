import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Check, X, Loader2, Download, Trash2, AlertTriangle, List, Eye, History, CheckCircle
} from 'lucide-react';
import client from '../../api/client';

const ExcelUploadView = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'history'
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [downloadingStock, setDownloadingStock] = useState(false);

  // Preview & Edit states
  const [previewItems, setPreviewItems] = useState([]);
  const [originalTotalRows, setOriginalTotalRows] = useState(0);
  const [validationLogs, setValidationLogs] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submittingImport, setSubmittingImport] = useState(false);

  // Import history states
  const [importHistory, setImportHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryLog, setSelectedHistoryLog] = useState(null);

  // Fetch active suppliers for mapping
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const { data } = await client.get('/pharmacy/suppliers');
        setSuppliers(data.filter(s => s.status === 'Active'));
      } catch (err) {
        toast.error('Failed to load suppliers dropdown.');
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch import logs history
  const fetchImportHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data } = await client.get('/pharmacy/inventory/upload-history');
      setImportHistory(data);
    } catch (err) {
      toast.error('Failed to load excel import logs history.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchImportHistory();
    }
  }, [activeTab, fetchImportHistory]);

  const downloadCurrentStock = async () => {
    setDownloadingStock(true);
    try {
      const { data } = await client.get('/pharmacy/inventory?limit=1000000&page=1');
      if (!data || !data.items || data.items.length === 0) {
        toast.error('No stock items found to download.');
        return;
      }

      const rows = data.items.map((item, index) => {
        let expiryStr = '';
        if (item.expiry) {
          const date = new Date(item.expiry);
          if (!isNaN(date.getTime())) {
            expiryStr = date.toISOString().split('T')[0];
          }
        }
        return {
          'S.No': item.sNo || (index + 1),
          'Medicine Name': item.itemName,
          'Description': item.description || '',
          'Dosage Form': item.dosageForm || '',
          'Pack Type': item.packType || '',
          'Units / Pack': item.unitsPerPack || 1,
          'Quantity (Packs)': item.quantityPacks || 0,
          'Batch No': item.batch,
          'Expiry Date': expiryStr,
          'Rate (Ex GST)': item.rateExGst || 0,
          'Per Unit Rate': item.perUnitRate || 0,
          'SGST %': item.sgst || 0,
          'CGST %': item.cgst || 0,
          'MRP (Inc GST)': item.mrp || 0,
          'Per Unit MRP (Inc GST)': item.perUnitRateWithGst || 0,
          'HSN Code': item.hsn || '0',
          'Amount (Ex GST)': (item.rateExGst || 0) * (item.quantityPacks || 0),
          'Amount (Inc GST)': (item.mrp || 0) * (item.quantityPacks || 0),
          'Threshold Medicine Number': item.thresholdMedicineNumber || 10
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Current Stock');
      XLSX.writeFile(workbook, `pharmacy_current_stock_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Current stock template downloaded successfully!');
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

    const match = str.match(/^(\d{1,2})[-/](\d{2,4})$/);
    if (match) {
      const month = parseInt(match[1]) - 1;
      let year = parseInt(match[2]);
      if (year < 100) year += 2000;
      return new Date(year, month + 1, 0); // last day of that month
    }
    return new Date();
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
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      parseFile(e.target.files[0]);
    }
  };

  // Read and parse Excel file on client side
  const parseFile = (selectedFile) => {
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      toast.error('Invalid format. Please upload a valid .xlsx or .xls file.');
      setFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet);

        if (rawRows.length === 0) {
          toast.error('The uploaded file contains no data rows.');
          setFile(null);
          return;
        }

        // Validate Column Structure
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
        const requiredColumns = [
          'Medicine Name', 'Pack Type', 'Units / Pack', 'Quantity (Packs)', 'Batch No', 'Expiry Date', 'Rate (Ex GST)', 'SGST %', 'CGST %', 'MRP (Inc GST)', 'Threshold Medicine Number'
        ];

        const normalizedHeaders = headers.map(h => String(h).trim().toLowerCase());
        const missing = [];
        requiredColumns.forEach(col => {
          if (!normalizedHeaders.includes(col.toLowerCase())) {
            missing.push(col);
          }
        });

        if (missing.length > 0) {
          toast.error(`Required columns missing in Excel: ${missing.join(', ')}`);
          setFile(null);
          return;
        }

        setOriginalTotalRows(rawRows.length);
        const logs = [];
        const parsed = [];

        rawRows.forEach((row, idx) => {
          const getVal = (colName, defaultVal = 0) => {
            const key = Object.keys(row).find(k => k.trim().toLowerCase() === colName.toLowerCase());
            const val = key ? row[key] : undefined;
            return val === undefined || val === null || val === "" ? defaultVal : val;
          };

          const sNoVal = getVal('S.No', idx + 1);
          const itemName = String(getVal('Medicine Name', '')).trim();
          const description = String(getVal('Description', '')).trim();
          const dosageForm = String(getVal('Dosage Form', '')).trim();
          const packType = String(getVal('Pack Type', '')).trim();
          const unitsPerPack = Number(getVal('Units / Pack', 1));
          const quantityPacks = Number(getVal('Quantity (Packs)', 0));
          const batch = String(getVal('Batch No', '')).trim();
          const rawExpiry = getVal('Expiry Date', null);
          const rateExGst = Number(getVal('Rate (Ex GST)', 0));
          const sgst = Number(getVal('SGST %', 0));
          const cgst = Number(getVal('CGST %', 0));
          const mrpInput = Number(getVal('MRP (Inc GST)', 0));
          const hsn = String(getVal('HSN Code', '0')).trim();
          const thresholdMedicineNumber = Number(getVal('Threshold Medicine Number', 10));

          // Check required row inputs
          if (!itemName && !batch) {
            logs.push(`Row ${idx + 1}: Ignored empty row.`);
            return;
          }

          let hasError = false;

          if (!itemName) {
            logs.push(`Row ${idx + 1}: Skipped because 'Medicine Name' is required.`);
            hasError = true;
          }
          if (!packType) {
            logs.push(`Row ${idx + 1}: Skipped because 'Pack Type' is required.`);
            hasError = true;
          }
          if (isNaN(unitsPerPack) || unitsPerPack <= 0) {
            logs.push(`Row ${idx + 1}: Skipped because 'Units / Pack' must be greater than zero.`);
            hasError = true;
          }
          if (isNaN(quantityPacks) || quantityPacks <= 0) {
            logs.push(`Row ${idx + 1}: Skipped because 'Quantity (Packs)' must be greater than zero.`);
            hasError = true;
          }
          if (!batch) {
            logs.push(`Row ${idx + 1}: Skipped because 'Batch No' is required.`);
            hasError = true;
          }
          if (!rawExpiry) {
            logs.push(`Row ${idx + 1}: Skipped because 'Expiry Date' is required.`);
            hasError = true;
          }
          if (isNaN(rateExGst) || rateExGst < 0) {
            logs.push(`Row ${idx + 1}: Skipped because 'Rate (Ex GST)' cannot be negative.`);
            hasError = true;
          }
          if (isNaN(sgst) || isNaN(cgst)) {
            logs.push(`Row ${idx + 1}: Skipped because 'SGST %' and 'CGST %' must be valid numeric values.`);
            hasError = true;
          }
          
          let mrp = mrpInput;
          if (!mrp) {
            mrp = rateExGst * (1 + ((sgst + cgst) / 100));
          }

          if (isNaN(mrp) || mrp < rateExGst) {
            logs.push(`Row ${idx + 1} (${itemName}): Skipped because 'MRP (Inc GST)' cannot be less than 'Rate (Ex GST)'.`);
            hasError = true;
          }
          if (isNaN(thresholdMedicineNumber) || thresholdMedicineNumber < 0) {
            logs.push(`Row ${idx + 1} (${itemName}): Skipped because 'Threshold Medicine Number' cannot be negative.`);
            hasError = true;
          }

          const expiryDate = rawExpiry ? parseExcelDate(rawExpiry) : null;
          if (rawExpiry && isNaN(expiryDate.getTime())) {
            logs.push(`Row ${idx + 1} (${itemName}): Skipped because 'Expiry Date' format is invalid.`);
            hasError = true;
          }

          if (hasError) return;

          const expiryStr = expiryDate.toISOString().split('T')[0];

          // Auto-calculate values for preview
          const computedPerUnitRate = rateExGst / unitsPerPack;
          const computedPerUnitRateWithGst = mrp / unitsPerPack;
          const amountExGst = rateExGst * quantityPacks;
          const amountIncGst = mrp * quantityPacks;
          const amount = amountIncGst;

          parsed.push({
            sNo: Number(sNoVal) || (idx + 1),
            itemName,
            description,
            dosageForm,
            packType,
            unitsPerPack,
            quantityPacks,
            batch,
            expiry: expiryStr,
            rateExGst,
            perUnitRate: computedPerUnitRate,
            sgst,
            cgst,
            mrp,
            perUnitRateWithGst: computedPerUnitRateWithGst,
            hsn,
            amountExGst,
            amountIncGst,
            thresholdMedicineNumber,
            amount
          });
        });

        if (parsed.length === 0) {
          toast.error('No valid rows could be imported.');
          setFile(null);
          return;
        }

        setPreviewItems(parsed);
        setValidationLogs(logs);
        toast.success(`Excel file parsed. Previewing ${parsed.length} rows.`);
      } catch (err) {
        console.error(err);
        toast.error('Error reading the excel spreadsheet.');
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handlePreviewChange = (idx, field, val) => {
    const updated = [...previewItems];
    updated[idx][field] = val;

    const qtyPacks = Number(updated[idx].quantityPacks) || 0;
    const unitsPerPack = Number(updated[idx].unitsPerPack) || 1;
    const rateExGst = Number(updated[idx].rateExGst) || 0;
    const sgst = Number(updated[idx].sgst) || 0;
    const cgst = Number(updated[idx].cgst) || 0;

    if (field === 'rateExGst' || field === 'sgst' || field === 'cgst') {
      updated[idx].mrp = rateExGst * (1 + ((sgst + cgst) / 100));
    }

    const mrp = Number(updated[idx].mrp) || 0;

    updated[idx].perUnitRate = rateExGst / unitsPerPack;
    updated[idx].perUnitRateWithGst = mrp / unitsPerPack;
    updated[idx].amountExGst = rateExGst * qtyPacks;
    updated[idx].amountIncGst = mrp * qtyPacks;
    updated[idx].amount = updated[idx].amountIncGst;

    setPreviewItems(updated);
  };

  const handleDeletePreviewRow = (idx) => {
    setPreviewItems(previewItems.filter((_, i) => i !== idx));
    setValidationLogs([...validationLogs, `Deleted row index ${idx + 1} from preview.`]);
  };

  const handleConfirmImport = async () => {
    if (previewItems.length === 0) {
      toast.error('No rows to import.');
      return;
    }

    setSubmittingImport(true);
    const failedCount = originalTotalRows - previewItems.length;

    try {
      const { data } = await client.post('/pharmacy/inventory/upload', {
        items: previewItems,
        fileName: file ? file.name : 'Excel Upload',
        totalRows: originalTotalRows,
        failedRowsCount: failedCount,
        importLog: validationLogs,
        supplierId: selectedSupplierId || null
      });

      toast.success(data.message || 'Import successful and stock updated!');
      // Reset states
      setPreviewItems([]);
      setFile(null);
      setValidationLogs([]);
      setSelectedSupplierId('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error executing confirmation import.');
    } finally {
      setSubmittingImport(false);
    }
  };

  const tabClass = (active) =>
    `px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition ${
      active ? 'bg-orange-500 text-white' : 'bg-orange-50 hover:bg-orange-100 text-orange-700'
    }`;

  return (
    <div className="space-y-6">
      
      {/* Workspace Tabs */}
      <div className="flex gap-2.5 pb-2.5 border-b border-orange-50">
        <button type="button" className={tabClass(activeTab === 'upload')} onClick={() => setActiveTab('upload')}>
          Excel Import Workspace
        </button>
        <button type="button" className={tabClass(activeTab === 'history')} onClick={() => setActiveTab('history')}>
          Import History Logs
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div className="grid gap-6 lg:grid-cols-4 animate-fade-in text-gray-700">
          
          {/* Main Upload / Preview space */}
          <div className="lg:col-span-3 space-y-4">
            
            {previewItems.length === 0 ? (
              // Drag and drop zone
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`card p-8 text-center border-2 border-dashed flex flex-col items-center justify-center min-h-[320px] transition duration-200 ${
                  dragActive 
                    ? 'border-orange-500 bg-orange-50/50' 
                    : 'border-orange-200 bg-white hover:border-orange-400'
                }`}
              >
                <FileSpreadsheet className="h-14 w-14 text-orange-400 mb-4" />
                <h3 className="font-extrabold text-gray-800 text-base">Import Stock Invoice Spreadsheet</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Drag & drop your Excel file here, or browse files on your computer. Supports .xlsx and .xls formats.
                </p>

                <label className="btn text-xs py-2.5 px-5 mt-6 cursor-pointer">
                  Browse Files
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            ) : (
              // Edit preview mode
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-orange-50/20 p-4 rounded-2xl border border-orange-100/50 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-4 py-1">
                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase">Valid Rows</span>
                        <span className="text-sm font-black text-green-700">{previewItems.length}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase">Skipped / Empty</span>
                        <span className="text-sm font-black text-amber-600">{originalTotalRows - previewItems.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setPreviewItems([]); setFile(null); setValidationLogs([]); }}
                      className="btn-secondary py-2 px-4 text-xs font-bold cursor-pointer"
                    >
                      Clear File
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={submittingImport}
                      className="btn py-2 px-5 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:bg-orange-300 shadow-md shadow-orange-500/10"
                    >
                      {submittingImport ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Confirm & Import Inventory
                    </button>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="overflow-x-auto border border-orange-100 rounded-2xl bg-white shadow-sm max-h-[500px]">
                  <table className="w-full text-left text-[11px] min-w-[2100px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-[10px] font-bold uppercase text-gray-600 border-b border-orange-100 sticky top-0 z-10">
                        <th className="p-3 pl-4 w-[160px]">Medicine Name *</th>
                        <th className="p-3 w-[150px]">Description</th>
                        <th className="p-3 w-[100px]">Dosage Form</th>
                        <th className="p-3 w-[100px]">Pack Type</th>
                        <th className="p-3 w-[80px]">Units/Pack *</th>
                        <th className="p-3 w-[85px]">Qty (Packs) *</th>
                        <th className="p-3 w-[110px]">Batch No *</th>
                        <th className="p-3 w-[110px]">Expiry *</th>
                        <th className="p-3 w-[95px]">Rate (Ex GST)</th>
                        <th className="p-3 w-[90px]">Per Unit Rate</th>
                        <th className="p-3 w-[80px]">SGST %</th>
                        <th className="p-3 w-[80px]">CGST %</th>
                        <th className="p-3 w-[100px]">MRP (Inc GST)</th>
                        <th className="p-3 w-[105px]">Per Unit MRP (Inc GST)</th>
                        <th className="p-3 w-[95px]">HSN Code</th>
                        <th className="p-3 w-[95px] text-right">Amount (Ex GST)</th>
                        <th className="p-3 w-[95px] text-right">Amount (Inc GST)</th>
                        <th className="p-3 w-[80px] text-center">Threshold</th>
                        <th className="p-3 text-center w-[50px]">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50 font-semibold text-gray-700">
                      {previewItems.map((it, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/10 align-middle">
                          <td className="p-1.5 pl-4">
                            <input
                              type="text"
                              className="input py-1.5 px-2 text-[11px] font-semibold border-orange-150"
                              required
                              value={it.itemName}
                              onChange={(e) => handlePreviewChange(idx, 'itemName', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className="input py-1.5 px-2 text-[11px] border-orange-150"
                              value={it.description}
                              onChange={(e) => handlePreviewChange(idx, 'description', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className="input py-1.5 px-2 text-[11px] border-orange-150 text-center"
                              value={it.dosageForm}
                              onChange={(e) => handlePreviewChange(idx, 'dosageForm', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className="input py-1.5 px-2 text-[11px] border-orange-150 text-center"
                              value={it.packType}
                              onChange={(e) => handlePreviewChange(idx, 'packType', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              className="input py-1.5 px-2 text-[11px] border-orange-150 text-center"
                              required
                              value={it.unitsPerPack}
                              onChange={(e) => handlePreviewChange(idx, 'unitsPerPack', parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              className="input py-1.5 px-2 text-[11px] text-center border-orange-150 font-bold"
                              required
                              value={it.quantityPacks}
                              onChange={(e) => handlePreviewChange(idx, 'quantityPacks', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className="input py-1.5 px-2 text-[11px] font-mono border-orange-150"
                              required
                              value={it.batch}
                              onChange={(e) => handlePreviewChange(idx, 'batch', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="date"
                              className="input py-1.5 px-2 text-[11px] border-orange-150"
                              required
                              value={it.expiry}
                              onChange={(e) => handlePreviewChange(idx, 'expiry', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.01"
                              className="input py-1.5 px-2 text-[11px] text-right border-orange-150 font-bold"
                              value={it.rateExGst}
                              onChange={(e) => handlePreviewChange(idx, 'rateExGst', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-1.5 text-right font-mono text-gray-500 pr-2">
                            ₹{it.perUnitRate.toFixed(4)}
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.1"
                              className="input py-1.5 px-2 text-[11px] text-center border-orange-150"
                              value={it.sgst}
                              onChange={(e) => handlePreviewChange(idx, 'sgst', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.1"
                              className="input py-1.5 px-2 text-[11px] text-center border-orange-150"
                              value={it.cgst}
                              onChange={(e) => handlePreviewChange(idx, 'cgst', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.01"
                              className="input py-1.5 px-2 text-[11px] text-right border-orange-150 font-bold"
                              value={it.mrp}
                              onChange={(e) => handlePreviewChange(idx, 'mrp', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-1.5 text-right font-mono text-green-700 pr-2">
                            ₹{it.perUnitRateWithGst.toFixed(4)}
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className="input py-1.5 px-2 text-[11px] text-center font-mono border-orange-150"
                              value={it.hsn}
                              onChange={(e) => handlePreviewChange(idx, 'hsn', e.target.value)}
                            />
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold text-gray-700 pr-2">
                            ₹{(it.amountExGst || 0).toFixed(2)}
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold text-green-800 pr-2">
                            ₹{(it.amountIncGst || 0).toFixed(2)}
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              className="input py-1.5 px-2 text-[11px] text-center border-orange-150"
                              value={it.thresholdMedicineNumber}
                              onChange={(e) => handlePreviewChange(idx, 'thresholdMedicineNumber', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePreviewRow(idx)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Validation Logs panel & Templates */}
          <div className="space-y-4">
            
            {/* Logs box */}
            {validationLogs.length > 0 && (
              <div className="card p-5 bg-orange-50/20 border border-orange-100 shadow-sm space-y-3 max-h-[220px] overflow-y-auto">
                <h4 className="font-extrabold text-orange-800 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Import validation Log
                </h4>
                <div className="space-y-1.5 text-[10px] text-gray-500 font-semibold font-mono leading-relaxed">
                  {validationLogs.map((log, i) => (
                    <p key={i}>• {log}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-5 space-y-4 bg-white border border-orange-100 shadow-sm text-xs font-semibold">
              <h4 className="font-extrabold text-gray-900 text-xs border-b border-orange-50 pb-2">Spreadsheet template</h4>
              <p className="text-gray-500 leading-relaxed">
                Download the current stock ledger spreadsheet to serve as an import template matching the column mapping structure.
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
                    Downloading Template...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 text-orange-500" />
                    Download Stock Template
                  </>
                )}
              </button>
              <div className="bg-orange-50/30 border border-orange-100 rounded-2xl p-4 text-[10px] text-gray-500 font-semibold leading-normal space-y-2">
                <p className="font-black text-orange-850 uppercase">Mapped headers:</p>
                <p className="font-mono">S.No, Medicine Name, Description, Dosage Form, Pack Type, Units / Pack, Quantity (Packs), Batch No, Expiry Date, Rate (Ex GST), Per Unit Rate, SGST %, CGST %, MRP (Inc GST), Per Unit MRP (Inc GST), HSN Code, Amount (Ex GST), Amount (Inc GST), Threshold Medicine Number</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Import History Tab
        <div className="space-y-4 animate-fade-in text-gray-700">
          <div className="card overflow-hidden bg-white border border-orange-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                    <th className="p-3.5 pl-4">Upload Date</th>
                    <th className="p-3.5">File Name</th>
                    <th className="p-3.5">Uploaded By</th>
                    <th className="p-3.5 text-center">Total Rows</th>
                    <th className="p-3.5 text-center text-green-700">Imported</th>
                    <th className="p-3.5 text-center text-red-500">Failed</th>
                    <th className="p-3.5">GRN Invoice Reference</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 pr-4 text-center">Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 font-semibold text-gray-700">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin text-orange-500 inline mr-2" /> Loading import logs history...
                      </td>
                    </tr>
                  ) : importHistory.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-400 font-bold">
                        No excel import records logged.
                      </td>
                    </tr>
                  ) : (
                    importHistory.map(h => (
                      <tr key={h._id} className="hover:bg-orange-50/10">
                        <td className="p-3.5 pl-4 text-gray-500">{new Date(h.createdAt).toLocaleString('en-GB')}</td>
                        <td className="p-3.5 font-bold text-gray-800">{h.fileName}</td>
                        <td className="p-3.5 font-medium text-gray-550">{h.uploadedBy?.username || 'Staff'}</td>
                        <td className="p-3.5 text-center font-bold">{h.totalRows}</td>
                        <td className="p-3.5 text-center text-green-700 font-bold">{h.successfulRows}</td>
                        <td className="p-3.5 text-center text-red-500 font-bold">{h.failedRows}</td>
                        <td className="p-3.5 font-mono text-orange-700 font-bold">{h.purchaseInvoiceCreated || '-'}</td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-black uppercase ${
                            h.status === 'Completed' ? 'bg-green-50 border border-green-200 text-green-700' :
                            h.status === 'Partial' ? 'bg-yellow-50 border border-yellow-200 text-yellow-750' :
                            'bg-red-50 border border-red-200 text-red-750'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryLog(h)}
                            disabled={!h.importLog || h.importLog.length === 0}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-xl transition cursor-pointer disabled:text-gray-300 disabled:hover:bg-transparent"
                            title="View log details"
                          >
                            <List className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import logs modal details */}
          {selectedHistoryLog && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-orange-50 pb-2.5">
                  <h3 className="font-black text-gray-800 text-sm flex items-center gap-1.5">
                    <Eye className="text-orange-500 h-4.5 w-4.5" />
                    Validation Log details
                  </h3>
                  <button type="button" onClick={() => setSelectedHistoryLog(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4 bg-orange-50/20 border border-orange-100 rounded-2xl max-h-[300px] overflow-y-auto space-y-2 text-xs font-mono font-semibold text-gray-600 leading-normal">
                  {selectedHistoryLog.importLog && selectedHistoryLog.importLog.length > 0 ? (
                    selectedHistoryLog.importLog.map((log, idx) => (
                      <p key={idx}>• {log}</p>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-center font-sans font-medium py-4">No validation log entries recorded.</p>
                  )}
                </div>

                <div className="flex justify-end border-t border-orange-50 pt-3">
                  <button type="button" onClick={() => setSelectedHistoryLog(null)} className="btn text-xs py-2 px-5 font-bold cursor-pointer">
                    Close Logs
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelUploadView;
