'use client';

import { useRef, useState } from 'react';
import { Printer, X, Download, FileText, Receipt } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import PatientReceipt from './PatientReceipt';
import { openPdfPrintWindow, sanitizeClonedDocumentForPdf } from '@/lib/utils/pdfUtils';

export default function PrintOpdSlipModal({ patient, data, mode: initialMode = 'patient_slip', onClose }) {
  const receiptRef = useRef(null);
  const rawData = patient || data;
  const patientData = (typeof rawData?.patient === 'object' && rawData.patient !== null)
    ? rawData.patient
    : ((typeof rawData?.data?.patient === 'object' && rawData.data.patient !== null)
        ? rawData.data.patient
        : ((typeof rawData?.data === 'object' && rawData.data !== null)
            ? rawData.data
            : rawData));
  const [activeMode, setActiveMode] = useState(initialMode === 'all' ? 'patient_slip' : initialMode);
  const [hospitalSettings, setHospitalSettings] = useState(null);
  const [letterheadOption, setLetterheadOption] = useState('system');

  useEffect(() => {
    apiRequest('/admin/hospital-settings')
      .then((res) => {
        if (res?.exists && res?.data) {
          setHospitalSettings(res.data);
          if (res.data.useSystemLetterhead === false && res.data.letterheadImageUrl) {
            setLetterheadOption('image');
          } else {
            setLetterheadOption('system');
          }
        }
      })
      .catch(() => {});
  }, []);

  const handlePrint = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 20000,
        onclone: (clonedDoc) => {
          sanitizeClonedDocumentForPdf(clonedDoc);
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.autoPrint();
      const docTitle = activeMode === 'bill_receipt' ? 'OPD Payment Receipt' : 'OPD Registration Slip';
      openPdfPrintWindow(pdf, docTitle);
    } catch (error) {
      console.error('Print slip error:', error);
      toast.error('Failed to generate print document.');
    }
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 20000,
        onclone: (clonedDoc) => {
          sanitizeClonedDocumentForPdf(clonedDoc);
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const prefix = activeMode === 'bill_receipt' ? 'Receipt' : 'Slip';
      pdf.save(`${prefix}_${patientData?.uhid || 'patient'}.pdf`);
      toast.success('Downloaded PDF successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF.');
    }
  };

  if (!patientData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-transparent print:backdrop-blur-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full print:max-h-none print:overflow-visible print:bg-transparent print:p-0 print:m-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gray-50/90 gap-3 no-print print:hidden">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">
                {activeMode === 'bill_receipt' ? 'OPD Payment Receipt' : 'Patient Registration Slip'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">UHID: {patientData.uhid || '-'} • {patientData.patientName || '-'}</p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2 ml-2">
              <div className="flex items-center gap-1 p-1 bg-gray-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveMode('patient_slip')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeMode === 'patient_slip' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Patient Slip
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('bill_receipt')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeMode === 'bill_receipt' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" /> Bill Receipt
                </button>
              </div>

              {activeMode === 'patient_slip' && (
                <div className="flex items-center gap-1 p-1 bg-gray-200/70 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLetterheadOption('system')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      letterheadOption === 'system' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="System-generated hospital header"
                  >
                    ⚙️ System
                  </button>
                  <button
                    type="button"
                    onClick={() => setLetterheadOption('image')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      letterheadOption === 'image' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Uploaded photo letterhead"
                  >
                    🖼️ Photo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100/70 flex justify-center print:p-0 print:m-0 print:bg-transparent print:overflow-visible">
          <div className="shadow-lg bg-white rounded-none border-none overflow-hidden max-w-full print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-[210mm]">
            <PatientReceipt 
              ref={receiptRef} 
              patient={patientData} 
              mode={activeMode} 
              letterheadMode={letterheadOption} 
              hospitalSettings={hospitalSettings} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}


