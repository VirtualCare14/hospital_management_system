import { useState, useEffect, useRef } from 'react';
import { Printer, Download, X, Coins, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import client from '../api/client';
import { formatUhid } from '../utils/uhid';

// Convert numbers into standard Indian Currency words (e.g. "Rupees Two Hundred Only")
const amountInWords = (num) => {
  const n = Math.round(num || 0);
  if (n === 0) return 'Rupees Zero Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (val) => {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 !== 0 ? ' ' + inWords(val % 100) : '');
    if (val < 100000) return inWords(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 !== 0 ? ' ' + inWords(val % 1000) : '');
    if (val < 10000000) return inWords(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 !== 0 ? ' ' + inWords(val % 100000) : '');
    return inWords(Math.floor(val / 10000000)) + ' Crore' + (val % 10000000 !== 0 ? ' ' + inWords(val % 10000000) : '');
  };

  return `Rupees ${inWords(n)} Only`;
};

export default function AdvanceReceiptModal({ isOpen, onClose, advanceData, hospitalInfo: initialHospital }) {
  const [hospital, setHospital] = useState(initialHospital || null);
  const [withLetterhead, setWithLetterhead] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const printAreaRef = useRef(null);

  useEffect(() => {
    if (!hospital) {
      client.get('/admin/hospital-settings')
        .then((res) => {
          if (res?.data?.data || res?.data) {
            setHospital(res.data.data || res.data);
          }
        })
        .catch(() => {
          // Fallback to OT hospital-info if admin endpoint blocked
          client.get('/ipd/ot/hospital-info')
            .then(({ data }) => setHospital(data))
            .catch(() => {});
        });
    }
  }, [hospital, initialHospital]);

  if (!isOpen || !advanceData) return null;

  const advance = advanceData.advance || advanceData;
  const patient = advanceData.patient || advance.patientId || {};

  const receiptNo = advance.receiptNo || (advance._id ? `ADV-${String(advance._id).slice(-8).toUpperCase()}` : 'ADV-RECEIPT');
  const amount = Number(advance.amount || 0);
  const paymentMode = advance.paymentMode || 'Cash';
  const remarks = advance.remarks || '';
  const dateStr = advance.date || (advance.createdAt ? new Date(advance.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
  const timeStr = advance.time || (advance.createdAt ? new Date(advance.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
  const collectedBy = advance.collectedByName || advance.collectedBy?.username || 'Billing Desk';

  const patientName = patient.patientName || advance.patientName || 'Patient';
  const uhid = patient.uhid || advance.uhid || '';
  const mobile = patient.mobile || patient.patientMobile || advance.mobile || '-';
  const gender = patient.gender || advance.patientGender || '';
  const age = patient.patientAge || (patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : (advance.patientAge || ''));
  const doctorName = patient.doctorName || advance.doctorName || '';
  const ipdNumber = patient.admissionDetails?.ipdNumber || advance.ipdNumber || '';

  // Trigger browser print
  const handlePrint = () => {
    toast.success('Opening print dialog...');
    window.print();
  };

  // Export PDF with html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    const el = printAreaRef.current;
    if (!el) {
      toast.error('Receipt content container not found');
      return;
    }
    setDownloadingPdf(true);
    toast.loading('Generating Advance Receipt PDF...');
    try {
      const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Advance_Receipt_${receiptNo}_${uhid}.pdf`);
      toast.dismiss();
      toast.success('Advance Receipt downloaded');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      toast.dismiss();
      toast.error('Failed to export PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Hospital phone display string
  const phoneDisplay = Array.isArray(hospital?.phoneNumbers) && hospital.phoneNumbers.length > 0
    ? hospital.phoneNumbers.map(p => (typeof p === 'object' ? (p.name ? `${p.name}: ${p.number}` : p.number) : p)).filter(Boolean).join(', ')
    : (Array.isArray(hospital?.mobileNumbers) ? hospital.mobileNumbers.join(', ') : (hospital?.mobileNumbers || ''));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn print:p-0 print:m-0 print:static print:bg-transparent print:backdrop-blur-none print:overflow-visible print:block print:w-full print:h-auto">
      
      {/* Isolated Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          .advance-receipt-print-area,
          .advance-receipt-print-area * {
            visibility: visible !important;
          }
          .advance-receipt-print-area {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print,
          .no-print *,
          .print\\:hidden,
          .print\\:hidden * {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-orange-100 flex flex-col max-h-[94vh] overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-h-none print:w-full print:max-w-none print:overflow-visible">
        
        {/* Top Action Bar (Hidden when printing) */}
        <div className="p-4 border-b border-orange-100 bg-orange-50/30 flex items-center justify-between gap-3 no-print print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
              <Coins className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                Advance Payment Receipt
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Payment Recorded
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 font-medium font-mono">
                Receipt #{receiptNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Toggle Letterhead */}
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors shadow-2xs">
              <input
                type="checkbox"
                checked={withLetterhead}
                onChange={(e) => setWithLetterhead(e.target.checked)}
                className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>With Letterhead</span>
            </label>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              title="Print advance receipt with letterhead"
            >
              <Printer className="h-4 w-4" /> Print Receipt
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="btn-secondary text-xs py-2 px-3 rounded-xl flex items-center gap-1.5"
              title="Download receipt as PDF"
            >
              <Download className="h-4 w-4 text-orange-600" /> {downloadingPdf ? 'Exporting...' : 'PDF'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors cursor-pointer"
              title="Close receipt preview"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100/60 flex justify-center print:bg-white print:p-0 print:overflow-visible">
          
          {/* Printable Document Box */}
          <div
            ref={printAreaRef}
            id="advance-receipt-print-area"
            className="advance-receipt-print-area bg-white w-full max-w-[210mm] min-h-[148mm] p-6 sm:p-8 border border-gray-300 shadow-md text-gray-900 font-sans relative text-left leading-normal print:w-full print:max-w-none print:shadow-none print:border-none print:p-2 print:m-0"
            style={{
              fontFamily: "'Inter', Arial, sans-serif"
            }}
          >
            {/* 1. HOSPITAL LETTERHEAD HEADER */}
            {withLetterhead ? (
              hospital?.letterheadImageUrl && (!hospital?.useSystemLetterhead || hospital?.letterheadType === 'image') ? (
                <div className="mb-4 pb-2 border-b-2 border-black">
                  <img
                    src={hospital.letterheadImageUrl}
                    alt="Hospital Letterhead"
                    className="w-full object-fill block"
                    style={{ maxHeight: `${(hospital?.letterheadHeaderHeight || 4.2) * 28}px` }}
                  />
                </div>
              ) : (
                <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3.5">
                    {hospital?.logoUrl && (
                      <img
                        src={hospital.logoUrl}
                        alt="Hospital Logo"
                        className="h-16 w-16 object-contain"
                      />
                    )}
                    <div>
                      <h1 className="text-xl font-black uppercase tracking-tight text-black">
                        {hospital?.hospitalName || 'HOSPITAL NAME'}
                      </h1>
                      {hospital?.hospitalHeading && (
                        <p className="text-[11px] font-bold text-gray-700 -mt-0.5 uppercase tracking-wide">
                          {hospital.hospitalHeading}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-600 mt-0.5 max-w-sm leading-tight">
                        {hospital?.address || ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-gray-800 space-y-0.5 font-semibold shrink-0">
                    {phoneDisplay && <p>Phone: {phoneDisplay}</p>}
                    {hospital?.emailAddress && <p>Email: {hospital.emailAddress}</p>}
                    {hospital?.dlNumber && <p>DL No: {hospital.dlNumber}</p>}
                    {hospital?.website && <p>Website: {hospital.website}</p>}
                    {hospital?.gstNumber && <p>GSTIN: {hospital.gstNumber}</p>}
                  </div>
                </div>
              )
            ) : (
              <div className="h-20" /> /* Blank spacing for physical pre-printed stationery */
            )}

            {/* 2. RECEIPT TITLE */}
            <div className="text-center my-4">
              <div className="inline-block border-2 border-black px-6 py-1 rounded-sm bg-gray-50/50">
                <h2 className="text-sm font-black uppercase tracking-widest text-black">
                  ADVANCE PAYMENT RECEIPT
                </h2>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">
                Original Receipt • Patient Copy
              </p>
            </div>

            {/* 3. PATIENT & RECEIPT METADATA GRID */}
            <div className="grid grid-cols-2 gap-4 text-xs my-4">
              {/* Patient Info */}
              <div className="border border-black p-3 space-y-1 bg-white">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-black border-b border-gray-300 pb-1 mb-1.5">
                  Patient Details
                </h4>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Patient Name:</span>
                  <span className="font-black text-black">{patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">UHID:</span>
                  <span className="font-mono font-black text-black">{formatUhid(uhid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Age / Gender:</span>
                  <span className="font-semibold text-black">{age ? `${age} Yrs` : '-'} / {gender || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Mobile No:</span>
                  <span className="font-semibold text-black">{mobile}</span>
                </div>
                {doctorName && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-600">Consulting Doctor:</span>
                    <span className="font-semibold text-black">{doctorName}</span>
                  </div>
                )}
                {ipdNumber && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-600">IPD No:</span>
                    <span className="font-mono font-bold text-black">{ipdNumber}</span>
                  </div>
                )}
              </div>

              {/* Receipt Info */}
              <div className="border border-black p-3 space-y-1 bg-white">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-black border-b border-gray-300 pb-1 mb-1.5">
                  Receipt Details
                </h4>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Receipt No:</span>
                  <span className="font-mono font-black text-black">{receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Receipt Date:</span>
                  <span className="font-bold text-black">{dateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Receipt Time:</span>
                  <span className="font-bold text-black">{timeStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Payment Mode:</span>
                  <span className="font-black uppercase text-black">{paymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Collected By:</span>
                  <span className="font-semibold text-black">{collectedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Ledger Status:</span>
                  <span className="font-extrabold text-emerald-800">Unadjusted (Active)</span>
                </div>
              </div>
            </div>

            {/* 4. PAYMENT BREAKDOWN TABLE */}
            <div className="my-4">
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100 font-extrabold text-black border-b border-black">
                    <th className="border border-black p-2 text-center w-12">S.No</th>
                    <th className="border border-black p-2 text-left">Description / Particulars</th>
                    <th className="border border-black p-2 text-center w-28">Payment Mode</th>
                    <th className="border border-black p-2 text-right w-36">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2.5 text-center font-bold">1</td>
                    <td className="border border-black p-2.5">
                      <p className="font-black text-black">Advance Deposit towards Hospital Medical & Healthcare Services</p>
                      {remarks && (
                        <p className="text-[11px] text-gray-600 mt-1 italic">
                          Notes / Reference: {remarks}
                        </p>
                      )}
                    </td>
                    <td className="border border-black p-2.5 text-center font-bold uppercase">
                      {paymentMode}
                    </td>
                    <td className="border border-black p-2.5 text-right font-mono font-black text-sm">
                      ₹{amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="font-black bg-gray-50 border-t-2 border-black">
                    <td colSpan={3} className="border border-black p-2.5 text-right text-xs uppercase tracking-wider">
                      Total Advance Received:
                    </td>
                    <td className="border border-black p-2.5 text-right font-mono font-black text-base text-black">
                      ₹{amount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. AMOUNT IN WORDS BANNER */}
            <div className="border border-black p-2.5 bg-gray-50/70 text-xs my-3 flex items-start gap-2">
              <span className="font-bold uppercase tracking-wider text-gray-700 shrink-0">Amount in Words:</span>
              <span className="font-black text-black capitalize">
                {amountInWords(amount)}
              </span>
            </div>

            {/* 6. ADVANCE LEDGER DECLARATION */}
            <div className="border border-dashed border-gray-400 p-2.5 rounded text-[10px] text-gray-600 space-y-0.5 my-4">
              <p className="font-bold text-gray-800 uppercase tracking-wider">Important Notes / Terms:</p>
              <p>• This official receipt acknowledges advance deposit payment towards patient care and medical services.</p>
              <p>• The advance deposit will be automatically credited and adjusted against the final hospital bill at the time of invoice settlement/discharge.</p>
              <p>• Please preserve this receipt for final settlement reference.</p>
            </div>

            {/* 7. SIGNATURES & FOOTER */}
            <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-black text-xs">
              <div className="text-center">
                <div className="border-b border-gray-400 w-44 mx-auto mb-1"></div>
                <p className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">
                  Depositor / Patient Signature
                </p>
              </div>

              <div className="text-center">
                <div className="border-b border-gray-400 w-44 mx-auto mb-1"></div>
                <p className="font-black text-black uppercase text-[10px] tracking-wider">
                  Authorized Signatory / Cashier
                </p>
                <p className="text-[9px] text-gray-500 font-medium">
                  {collectedBy} • {new Date().toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            {/* Computer Generated Disclaimer */}
            <div className="text-center text-[9px] text-gray-400 italic mt-6 border-t border-gray-200 pt-2">
              {hospital?.invoiceFooterMessage || 'Computer generated advance receipt. Valid without signature when verified against system ledger.'}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
