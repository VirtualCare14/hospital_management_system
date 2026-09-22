'use client';

import { useState, useRef, useEffect } from 'react';
import { Printer, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import { openPdfPrintWindow, sanitizeClonedDocumentForPdf } from '@/lib/utils/pdfUtils';

const amountInWords = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n <= 0) return 'Rupees Zero Only';
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

const convertImgToBase64 = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve('');
    if (url.startsWith('data:image/')) return resolve(url);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (err) {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
};

const formatHospitalPhoneNumbers = (hospital) => {
  if (!hospital) return '';
  if (Array.isArray(hospital.phoneNumbers) && hospital.phoneNumbers.length > 0) {
    const valid = hospital.phoneNumbers.filter(p => p && p.number && String(p.number).trim().length > 0);
    if (valid.length > 0) return valid.map(p => p.name ? `${p.name}: ${p.number}` : p.number).join(' | ');
  }
  if (Array.isArray(hospital.mobileNumbers) && hospital.mobileNumbers.length > 0) {
    const valid = hospital.mobileNumbers.filter(n => n && String(n).trim().length > 0);
    if (valid.length > 0) return valid.join(' | ');
  }
  if (typeof hospital.mobileNumbers === 'string' && hospital.mobileNumbers.trim()) {
    return hospital.mobileNumbers.trim();
  }
  if (hospital.alternateMobileNumber) {
    return hospital.alternateMobileNumber;
  }
  return '';
};

export default function PrintInvoiceModal({ bill, onClose }) {
  const printRef = useRef(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [resolvedLogo, setResolvedLogo] = useState('');

  useEffect(() => {
    let isMounted = true;
    apiRequest('/admin/hospital-settings')
      .then(async (res) => {
        if (res?.exists && res?.data && isMounted) {
          setHospitalInfo(res.data);
          const rawLogo = res.data.logoUrl || res.data.logo || '';
          if (rawLogo) {
            setResolvedLogo(rawLogo);
            const base64 = await convertImgToBase64(rawLogo);
            if (isMounted && base64) {
              setResolvedLogo(base64);
            }
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  if (!bill) return null;

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
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
      openPdfPrintWindow(pdf, `Tax_Invoice_${bill?.billNumber || bill?.invoiceNo || 'bill'}`);
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
      pdf.save(`Tax_Invoice_${bill?.billNumber || bill?.invoiceNo || 'bill'}.pdf`);
      toast.success('Downloaded invoice PDF');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const items = bill.items || [];
  const totalAmount = bill.totalAmount !== undefined ? Number(bill.totalAmount) : (bill.grandTotal !== undefined ? Number(bill.grandTotal) : Number(bill.subtotal || 0));
  const discount = bill.discount !== undefined ? Number(bill.discount) : Number(bill.discountAmount || 0);
  const gstAmount = Number(bill.gstAmount || 0);
  const netAmount = bill.netAmount !== undefined ? Number(bill.netAmount) : (bill.grandTotal !== undefined ? Number(bill.grandTotal) : (totalAmount - discount + gstAmount));
  const paidAmount = bill.paidAmount !== undefined ? Number(bill.paidAmount) : (bill.amountPaid !== undefined ? Number(bill.amountPaid) : (bill.paymentStatus === 'Paid' ? netAmount : 0));
  const dueAmount = bill.dueAmount !== undefined ? Number(bill.dueAmount) : Math.max(0, netAmount - paidAmount);
  const billNum = bill.billNumber || bill.invoiceNo || bill.billNo || 'INV-DRAFT';
  const billDate = bill.createdAt || bill.date || bill.billDate || new Date();
  const doctorName = bill.doctorName || (typeof bill.doctorId === 'object' ? (bill.doctorId?.doctorName || bill.doctorId?.username) : (typeof bill.doctorId === 'string' && !bill.doctorId.match(/^[0-9a-fA-F]{24}$/) ? bill.doctorId : ''));
  const contactPhones = formatHospitalPhoneNumbers(hospitalInfo);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/90">
          <div>
            <h3 className="text-base font-bold text-gray-900">Tax Invoice / Bill Preview</h3>
            <p className="text-xs text-gray-500 font-medium">Invoice No: {billNum} • UHID: {formatUhid(bill.uhid)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Out
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/90 flex justify-center">
          <div
            ref={printRef}
            className="a4-receipt"
            style={{
              width: '100%',
              maxWidth: '210mm',
              minHeight: '290mm',
              padding: '8mm 10mm 10mm 10mm',
              margin: '0 auto',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '11px',
              lineHeight: '1.4',
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            {/* Header / Hospital Branding */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2.5px solid #000',
              paddingBottom: '14px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, paddingRight: '20px' }}>
                {resolvedLogo && (
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src={resolvedLogo}
                      crossOrigin="anonymous"
                      alt="Logo"
                      style={{ maxHeight: '75px', maxWidth: '75px', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                )}
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#111827' }}>
                    {hospitalInfo?.hospitalName || 'CLINIC / HOSPITAL'}
                  </h1>
                  {hospitalInfo?.hospitalHeading && (
                    <p style={{ fontSize: '11px', margin: '3px 0 0 0', color: '#4b5563', fontWeight: '500' }}>
                      {hospitalInfo.hospitalHeading}
                    </p>
                  )}
                  {hospitalInfo?.address && (
                    <p style={{ fontSize: '10px', margin: '4px 0 0 0', color: '#4b5563', maxWidth: '380px', lineHeight: '1.3' }}>
                      {hospitalInfo.address}
                    </p>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                textAlign: 'left',
                fontSize: '11px',
                color: '#111827',
                lineHeight: '1.4',
                maxWidth: '380px',
                width: '100%',
                alignItems: 'flex-start'
              }}>
                {contactPhones && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    <div><strong>Contact:</strong> {contactPhones}</div>
                  </div>
                )}
                {hospitalInfo?.emailAddress && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    <div><strong>Email:</strong> {hospitalInfo.emailAddress}</div>
                  </div>
                )}
                {hospitalInfo?.gstNumber && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z"/>
                    </svg>
                    <div><strong>GSTIN:</strong> {hospitalInfo.gstNumber}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Document Title */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <h2 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                margin: '0 auto',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                borderBottom: '1px solid #000',
                paddingBottom: '3px',
                display: 'inline-block'
              }}>
                TAX INVOICE
              </h2>
              {bill.status === 'Cancelled' && (
                <div style={{
                  color: '#dc2626',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginTop: '4px',
                  textTransform: 'uppercase',
                  border: '1px solid #dc2626',
                  padding: '2px 8px',
                  display: 'inline-block'
                }}>
                  Cancelled Invoice
                </div>
              )}
            </div>

            {/* Patient & Invoice Meta Information (2 Columns) */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              {/* Patient Details Box */}
              <div style={{
                flex: 1,
                border: '1px solid #000',
                borderRadius: '2px',
                padding: '8px',
                boxSizing: 'border-box'
              }}>
                <h3 style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #000',
                  margin: '0 0 6px 0',
                  paddingBottom: '3px'
                }}>
                  Patient Details
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 0', width: '38%' }}><strong>Patient Name:</strong></td>
                      <td style={{ padding: '2px 0' }}>{bill.patientName || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}><strong>UHID:</strong></td>
                      <td style={{ padding: '2px 0' }}>{formatUhid(bill.uhid)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}><strong>Gender / Age:</strong></td>
                      <td style={{ padding: '2px 0' }}>{bill.patientGender || bill.gender || '-'} / {bill.patientAge ? `${bill.patientAge} yrs` : (bill.age ? `${bill.age} yrs` : '-')}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}><strong>Mobile:</strong></td>
                      <td style={{ padding: '2px 0' }}>{bill.patientMobile || bill.mobile || '-'}</td>
                    </tr>
                    {doctorName && (
                      <tr>
                        <td style={{ padding: '2px 0' }}><strong>Doctor:</strong></td>
                        <td style={{ padding: '2px 0' }}>Dr. {doctorName}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Invoice Details Box */}
              <div style={{
                flex: 1,
                border: '1px solid #000',
                borderRadius: '2px',
                padding: '8px',
                boxSizing: 'border-box'
              }}>
                <h3 style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #000',
                  margin: '0 0 6px 0',
                  paddingBottom: '3px'
                }}>
                  Invoice Details
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 0', width: '38%' }}><strong>Invoice No:</strong></td>
                      <td style={{ padding: '2px 0', fontWeight: 'bold' }}>{billNum}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}><strong>Date & Time:</strong></td>
                      <td style={{ padding: '2px 0' }}>{formatDate(billDate)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}><strong>Payment Mode:</strong></td>
                      <td style={{ padding: '2px 0' }}>{bill.paymentMode || 'Cash'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0' }}><strong>Payment Status:</strong></td>
                      <td style={{
                        padding: '2px 0',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        color: bill.paymentStatus === 'Paid' ? '#15803d' : (bill.paymentStatus === 'Partially Paid' ? '#b45309' : '#b91c1c')
                      }}>
                        {bill.paymentStatus || 'Paid'}
                      </td>
                    </tr>
                    {bill.department && (
                      <tr>
                        <td style={{ padding: '2px 0' }}><strong>Department:</strong></td>
                        <td style={{ padding: '2px 0' }}>{bill.department}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: '12px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11px',
                border: '1px solid #000'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', width: '30px' }}>#</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left' }}>Item / Service Description</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', width: '90px' }}>Category</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', width: '45px' }}>Qty</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', width: '75px' }}>Rate (₹)</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', width: '75px' }}>Discount (₹)</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', width: '85px' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#4b5563' }}>
                        Standard Consultation / Service Charges
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const price = Number(item.price || item.unitPrice || 0);
                      const qty = Number(item.qty || item.quantity || 1);
                      const disc = Number(item.discount || item.discountAmount || 0);
                      const lineTotal = item.amount !== undefined ? Number(item.amount) : (item.total !== undefined ? Number(item.total) : (price * qty - disc));
                      return (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>{item.name || item.description || 'Service'}</td>
                          <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'center' }}>{item.category || 'OPD'}</td>
                          <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'center' }}>{qty}</td>
                          <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right' }}>₹{price.toFixed(2)}</td>
                          <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', color: disc > 0 ? '#dc2626' : '#000' }}>
                            {disc > 0 ? `₹${disc.toFixed(2)}` : '₹0.00'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Summary Section */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '15px',
              marginBottom: '15px'
            }}>
              {/* Left Box: Amount in Words & Notes */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  padding: '8px 10px',
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #000',
                  fontSize: '11px',
                  borderRadius: '2px'
                }}>
                  <p style={{ margin: '0 0 2px 0' }}><strong>Amount in Words:</strong></p>
                  <p style={{ margin: '0', fontStyle: 'italic', fontWeight: 'bold', color: '#111827' }}>
                    {amountInWords(netAmount)}
                  </p>
                </div>

                {bill.paymentMode === 'Mixed Payment' && bill.mixedPayments && bill.mixedPayments.length > 0 && (
                  <div style={{
                    padding: '6px 10px',
                    border: '1px solid #ccc',
                    fontSize: '10px',
                    backgroundColor: '#fafafa',
                    borderRadius: '2px'
                  }}>
                    <strong>Mixed Payment Split:</strong>{' '}
                    {bill.mixedPayments.map(p => `${p.method || p.mode}: ₹${Number(p.amount || 0).toFixed(2)}`).join(' | ')}
                  </div>
                )}

                {bill.remarks && (
                  <div style={{
                    padding: '6px 10px',
                    border: '1px solid #ccc',
                    fontSize: '10px',
                    backgroundColor: '#fafafa',
                    borderRadius: '2px'
                  }}>
                    <strong>Remarks:</strong> {bill.remarks}
                  </div>
                )}
              </div>

              {/* Right Box: Totals Breakdown */}
              <div style={{
                width: '240px',
                border: '1px solid #000',
                padding: '8px 10px',
                fontSize: '11px',
                borderRadius: '2px',
                boxSizing: 'border-box'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 0' }}>Gross Total:</td>
                      <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>₹{totalAmount.toFixed(2)}</td>
                    </tr>
                    {discount > 0 && (
                      <tr style={{ color: '#dc2626' }}>
                        <td style={{ padding: '3px 0' }}>Discount:</td>
                        <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>-₹{discount.toFixed(2)}</td>
                      </tr>
                    )}
                    {gstAmount > 0 && (
                      <tr>
                        <td style={{ padding: '3px 0' }}>GST:</td>
                        <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>+₹{gstAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1.5px solid #000', fontSize: '12px' }}>
                      <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Net Payable:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold' }}>₹{netAmount.toFixed(2)}</td>
                    </tr>
                    <tr style={{ color: '#15803d' }}>
                      <td style={{ padding: '3px 0' }}>Paid Amount:</td>
                      <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>₹{paidAmount.toFixed(2)}</td>
                    </tr>
                    {dueAmount > 0 && (
                      <tr style={{ borderTop: '1px dashed #000', color: '#dc2626', fontWeight: 'bold' }}>
                        <td style={{ padding: '4px 0' }}>Balance Due:</td>
                        <td style={{ padding: '4px 0', textAlign: 'right' }}>₹{dueAmount.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer & Signatures */}
            <div style={{
              marginTop: '30px',
              paddingTop: '10px',
              borderTop: '1px solid #ccc',
              fontSize: '10px',
              color: '#4b5563',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              pageBreakInside: 'avoid'
            }}>
              <div>
                <p style={{ margin: '0' }}>Computer Generated Invoice. Signature not required.</p>
                <p style={{ margin: '2px 0 0 0' }}>Thank you for choosing our clinic.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ height: '35px' }}></div>
                <p style={{
                  margin: '0',
                  borderTop: '1px solid #000',
                  paddingTop: '4px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '140px',
                  textAlign: 'center'
                }}>
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
