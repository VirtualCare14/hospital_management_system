'use client';

import { useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { openPdfPrintWindow, sanitizeClonedDocumentForPdf } from '@/lib/utils/pdfUtils';

export default function PrintRxModal({ patient, prescription, onClose }) {
  const receiptRef = useRef(null);

  const handlePrint = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
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
      openPdfPrintWindow(pdf, 'Prescription (Rx)');
    } catch (error) {
      console.error('Print Rx error:', error);
      toast.error('Failed to generate prescription PDF.');
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
        windowWidth: 1024,
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
      pdf.save(`Rx_${patient?.uhid || 'patient'}.pdf`);
      toast.success('Downloaded prescription PDF');
    } catch (error) {
      console.error('Download Rx error:', error);
      toast.error('Failed to download PDF.');
    }
  };

  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Doctor Prescription (Rx)
            </h3>
            <p className="text-xs text-gray-500 font-medium">UHID: {patient.uhid} • {patient.patientName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Rx
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/90 flex justify-center">
          <div className="shadow-2xl bg-white rounded-sm overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }}>
            <PatientReceipt
              ref={receiptRef}
              patient={patient}
              prescription={prescription}
              mode="all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
