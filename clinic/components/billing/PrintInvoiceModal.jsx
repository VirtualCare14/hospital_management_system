'use client';

import { useState, useRef, useEffect } from 'react';
import { Printer, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import { openPdfPrintWindow } from '@/lib/utils/pdfUtils';

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

export default function PrintInvoiceModal({ bill, onClose }) {
  const printRef = useRef(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);

  useEffect(() => {
    apiRequest('/admin/hospital-settings')
      .then((res) => {
        if (res?.exists && res?.data) setHospitalInfo(res.data);
      })
      .catch(() => {});
  }, []);

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        imageTimeout: 20000
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.autoPrint();
      openPdfPrintWindow(pdf, `Invoice_${bill?.billNumber || 'bill'}`);
    } catch (error) {
      console.error('Print invoice error:', error);
      toast.error('Failed to generate invoice printout');
    }
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        imageTimeout: 20000
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${bill?.billNumber || 'bill'}.pdf`);
      toast.success('Downloaded invoice PDF');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  if (!bill) return null;

  const items = bill.items || [];
  const totalAmount = bill.totalAmount || 0;
  const discount = bill.discount || 0;
  const netAmount = bill.netAmount !== undefined ? bill.netAmount : (totalAmount - discount);
  const paidAmount = bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentStatus === 'Paid' ? netAmount : 0);
  const dueAmount = bill.dueAmount !== undefined ? bill.dueAmount : Math.max(0, netAmount - paidAmount);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div>
            <h3 className="text-base font-bold text-gray-900">Tax Invoice / Bill Preview</h3>
            <p className="text-xs text-gray-500 font-medium">Invoice No: {bill.billNumber || '-'} • UHID: {formatUhid(bill.uhid)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" /> Print Out
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100/70 flex justify-center">
          <div
            ref={printRef}
            className="bg-white shadow-lg w-[210mm] min-h-[290mm] p-8 border border-gray-200 text-gray-900 leading-normal text-xs"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            {/* Header / Hospital Branding */}
            <div className="border-b-2 border-black pb-4 flex justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                {hospitalInfo?.logoUrl && (
                  <img
                    src={hospitalInfo.logoUrl}
                    alt="Logo"
                    className="h-16 w-16 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">{hospitalInfo?.hospitalName || 'CLINIC / HOSPITAL'}</h1>
                  {hospitalInfo?.hospitalHeading && <p className="text-[11px] font-bold text-gray-600">{hospitalInfo.hospitalHeading}</p>}
                  <p className="text-[10px] text-gray-600 mt-1 max-w-sm">{hospitalInfo?.address || ''}</p>
                </div>
              </div>
              <div className="text-right text-[10px] text-gray-700 space-y-0.5 font-semibold">
                {hospitalInfo?.mobileNumbers && <p>Contact: {Array.isArray(hospitalInfo.mobileNumbers) ? hospitalInfo.mobileNumbers.join(', ') : hospitalInfo.mobileNumbers}</p>}
                {hospitalInfo?.emailAddress && <p>Email: {hospitalInfo.emailAddress}</p>}
                {hospitalInfo?.gstNumber && <p>GSTIN: {hospitalInfo.gstNumber}</p>}
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-4">
              <h2 className="text-sm font-black uppercase tracking-widest border-b border-black w-fit mx-auto pb-0.5">
                TAX INVOICE
              </h2>
            </div>

            {/* Patient & Bill Meta Information */}
            <div className="grid grid-cols-2 gap-4 text-[11px] mb-4">
              <div className="space-y-1 p-3 rounded border border-black">
                <h3 className="font-extrabold text-xs border-b border-black pb-1 uppercase">Patient Details</h3>
                <p><strong>Name:</strong> {bill.patientName}</p>
                <p><strong>UHID:</strong> {formatUhid(bill.uhid)}</p>
                <p><strong>Gender / Age:</strong> {bill.patientGender || '-'} / {bill.patientAge ? `${bill.patientAge} yrs` : '-'}</p>
                <p><strong>Mobile:</strong> {bill.patientMobile || bill.mobile || '-'}</p>
              </div>

              <div className="space-y-1 p-3 rounded border border-black">
                <h3 className="font-extrabold text-xs border-b border-black pb-1 uppercase">Invoice Details</h3>
                <p><strong>Invoice No:</strong> <span className="font-bold">{bill.billNumber}</span></p>
                <p><strong>Date & Time:</strong> {formatDate(bill.createdAt || bill.date || new Date())}</p>
                <p><strong>Payment Mode:</strong> {bill.paymentMode || 'Cash'}</p>
                <p><strong>Status:</strong> <span className="font-bold uppercase">{bill.paymentStatus || 'Paid'}</span></p>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full border-collapse border border-black text-[11px] mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-center w-8">#</th>
                  <th className="border border-black p-2 text-left">Item / Service Description</th>
                  <th className="border border-black p-2 text-center w-16">Category</th>
                  <th className="border border-black p-2 text-center w-12">Qty</th>
                  <th className="border border-black p-2 text-right w-20">Rate (₹)</th>
                  <th className="border border-black p-2 text-right w-20">Discount (₹)</th>
                  <th className="border border-black p-2 text-right w-24">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-black p-3 text-center text-gray-500">
                      Standard Consultation / Service Charges
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const price = item.price || item.unitPrice || 0;
                    const qty = item.qty || item.quantity || 1;
                    const disc = item.discount || 0;
                    const lineTotal = item.amount !== undefined ? item.amount : (price * qty - disc);
                    return (
                      <tr key={idx}>
                        <td className="border border-black p-2 text-center">{idx + 1}</td>
                        <td className="border border-black p-2 font-semibold">{item.name || item.description || 'Service'}</td>
                        <td className="border border-black p-2 text-center">{item.category || 'OPD'}</td>
                        <td className="border border-black p-2 text-center">{qty}</td>
                        <td className="border border-black p-2 text-right">₹{Number(price).toFixed(2)}</td>
                        <td className="border border-black p-2 text-right">₹{Number(disc).toFixed(2)}</td>
                        <td className="border border-black p-2 text-right font-bold">₹{Number(lineTotal).toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Calculations Summary */}
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex-1 p-3 bg-gray-50 border border-black text-[11px]">
                <p><strong>Amount in Words:</strong></p>
                <p className="italic font-bold text-gray-800 mt-1">{amountInWords(netAmount)}</p>
              </div>

              <div className="w-64 border border-black p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Gross Total:</span>
                  <span className="font-bold">₹{Number(totalAmount).toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-₹{Number(discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm border-t border-black pt-1">
                  <span>Net Payable:</span>
                  <span>₹{Number(netAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Paid Amount:</span>
                  <span className="font-bold">₹{Number(paidAmount).toFixed(2)}</span>
                </div>
                {dueAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold border-t border-dashed border-black pt-1">
                    <span>Balance Due:</span>
                    <span>₹{Number(dueAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-500 flex justify-between items-end">
              <div>
                <p>Computer Generated Invoice</p>
                <p>Thank you for choosing our clinic</p>
              </div>
              <div className="text-right">
                <div className="h-10"></div>
                <p className="border-t border-black px-4 pt-1 font-bold text-gray-900">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
