import { useEffect, useState, forwardRef } from 'react';
import client from '../api/client';
import { formatDate, formatDateShort } from '../utils/dateFormat';
import { t, translateClinicalText } from '../utils/prescriptionI18n';

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

const formatHospitalPhoneNumbers = (hospital) => {
  if (!hospital) return 'N/A';
  
  if (Array.isArray(hospital.phoneNumbers) && hospital.phoneNumbers.length > 0) {
    const valid = hospital.phoneNumbers.filter(p => p && p.number && String(p.number).trim().length > 0);
    if (valid.length > 0) {
      return valid.map(p => p.name ? `${p.name}: ${p.number}` : p.number).join(' | ');
    }
  }
  
  if (Array.isArray(hospital.mobileNumbers) && hospital.mobileNumbers.length > 0) {
    const valid = hospital.mobileNumbers.filter(n => n && String(n).trim().length > 0);
    if (valid.length > 0) {
      return valid.join(' | ');
    }
  }

  if (typeof hospital.mobileNumbers === 'string' && hospital.mobileNumbers.trim()) {
    return hospital.mobileNumbers.trim();
  }

  if (hospital.alternateMobileNumber) {
    return hospital.alternateMobileNumber;
  }

  return 'N/A';
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

const PatientReceipt = forwardRef(({ patient, prescription, hospitalSettings, language, mode = 'all', letterheadMode = 'auto', printOptions: propPrintOptions }, ref) => {
  const activeLang = language || prescription?.language || 'English';
  const [hospital, setHospital] = useState(hospitalSettings || null);
  const [resolvedLogo, setResolvedLogo] = useState(hospitalSettings?.logoUrl || hospitalSettings?.logo || '');
  const [resolvedLetterhead, setResolvedLetterhead] = useState(hospitalSettings?.letterheadImageUrl || '');

  const printOptions = propPrintOptions || prescription?.printOptions || patient?.printOptions || {
    printVitals: true,
    printLabTests: true,
    printSymptomHistory: true,
    printSymptomRemarks: true,
    printGeneralPastHistory: true
  };

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      let data = hospitalSettings;
      if (!data) {
        try {
          const res = await client.get('/admin/hospital-settings');
          if (res.data?.exists && res.data?.data) {
            data = res.data.data;
          }
        } catch (err) {}
      }
      if (data && isMounted) {
        setHospital(data);
        const rawLogo = data.logoUrl || data.logo || '';
        if (rawLogo) {
          setResolvedLogo(rawLogo);
          const base64 = await convertImgToBase64(rawLogo);
          if (isMounted && base64) {
            setResolvedLogo(base64);
          }
        }
        const rawLetterhead = data.letterheadImageUrl || '';
        if (rawLetterhead) {
          setResolvedLetterhead(rawLetterhead);
          const base64Lh = await convertImgToBase64(rawLetterhead);
          if (isMounted && base64Lh) {
            setResolvedLetterhead(base64Lh);
          }
        }
      }
    };
    loadSettings();
    return () => { isMounted = false; };
  }, [hospitalSettings]);

  if (!patient) return null;

  const ageFromDob = (dob) => {
    if (!dob) return '-';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const formatRegDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${formatDate(d)} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const now = new Date();
  const documentDateTime = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const isPatientSlipOnly = mode === 'patient_slip';
  const isBillReceiptOnly = mode === 'bill_receipt';
  const isRefundSlip = mode === 'refund_slip';

  // Check if uploaded photo letterhead should be shown
  let showUploadedLetterhead = false;
  if (letterheadMode === 'image') {
    showUploadedLetterhead = Boolean(resolvedLetterhead || hospital?.letterheadImageUrl);
  } else if (letterheadMode === 'system') {
    showUploadedLetterhead = false;
  } else {
    // 'auto' mode: check hospital.useSystemLetterhead (if true, don't show uploaded photo letterhead)
    const useSystem = hospital?.useSystemLetterhead !== undefined ? hospital.useSystemLetterhead : true;
    showUploadedLetterhead = !useSystem && Boolean(resolvedLetterhead || hospital?.letterheadImageUrl);
  }

  const grossFee = patient.opdFee !== undefined ? patient.opdFee : (patient.doctorId?.opdFees || 0);
  const netFee = patient.netOpdFee !== undefined ? patient.netOpdFee : grossFee;
  const rawDoctorName = patient.doctorName || patient.visitingDoctorName || patient.doctorId?.doctorName || patient.doctorId?.username || (typeof patient.doctorId === 'string' ? patient.doctorId : '-');
  const doctorNameStr = rawDoctorName === '-' ? '-' : (/^dr\.?/i.test(rawDoctorName.trim()) ? rawDoctorName.trim() : `Dr. ${rawDoctorName.trim()}`);

  const vitals = patient.demographics || prescription?.vitals || {};
  const hasVitals = vitals.weight || vitals.height || vitals.bloodPressure || vitals.temperature || vitals.pulseRate || vitals.pulse || vitals.respiratoryRate || vitals.spo2 || vitals.cvs || vitals.perAbdomen || vitals.bilateralChest;
  const isVisiting = Boolean(patient.isVisitingDoctor || patient.doctorId?.isVisitingDoctor);
  const documentTitle = isRefundSlip ? 'REFUND VOUCHER' : (isBillReceiptOnly ? 'PAYMENT RECEIPT' : (isPatientSlipOnly ? 'PATIENT SLIP' : 'PRESCRIPTION'));

  if (isRefundSlip) {
    const refundAmt = patient.refundAmount !== undefined && patient.refundAmount !== null 
      ? Number(patient.refundAmount) 
      : (patient.netOpdFee || grossFee || 0);
    const refundNo = patient.refundReceiptNo || ('REF-' + (patient.billNumber ? patient.billNumber.replace(/^[^-]+-/, '') : '000000'));
    const refundDateStr = formatRegDate(patient.refundDate || new Date());

    return (
      <div ref={ref} className="a4-receipt" style={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: 'auto',
        padding: showUploadedLetterhead ? '0 8mm 8mm 8mm' : '6mm 8mm 8mm 8mm',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        lineHeight: '1.4',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {showUploadedLetterhead ? (
          <div style={{
            width: 'calc(100% + 16mm)',
            marginLeft: '-8mm',
            marginRight: '-8mm',
            marginTop: '0',
            height: `${hospital?.letterheadHeaderHeight || 4.6}cm`,
            overflow: 'hidden',
            marginBottom: '8px',
            border: 'none',
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={resolvedLetterhead || hospital?.letterheadImageUrl}
              crossOrigin="anonymous"
              alt="Hospital Letterhead"
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', border: 'none', outline: 'none' }}
            />
          </div>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2.5px solid #000',
            paddingBottom: '14px',
            marginBottom: '14px'
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
                  {hospital?.hospitalName || 'Hospital Name'}
                </h1>
                {hospital?.hospitalHeading && (
                  <p style={{ fontSize: '11px', margin: '3px 0 0 0', color: '#4b5563', fontWeight: '500' }}>{hospital.hospitalHeading}</p>
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
              maxWidth: '400px',
              width: '100%',
              alignItems: 'flex-start'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div><strong>Address:</strong> {hospital?.address || 'Hospital Address'}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <div><strong>Contact No:</strong> {formatHospitalPhoneNumbers(hospital)}</div>
              </div>

              {(hospital?.emailAddress || hospital?.email) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <div><strong>Email ID:</strong> {hospital.emailAddress || hospital.email}</div>
                </div>
              )}

              {hospital?.website && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  <div><strong>Website:</strong> {hospital.website}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '2.5px solid #dc2626', paddingBottom: '4px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '900', margin: '0', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b91c1c' }}>
            REFUND VOUCHER / SLIP
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#4b5563', fontWeight: 'bold' }}>
            Reception OPD Consultation Fee Refund Receipt
          </p>
        </div>

        {/* Voucher Meta Info Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '4px', padding: '6px 10px', marginBottom: '8px', fontSize: '10.5px' }}>
          <div>
            <strong>Refund Voucher #:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#b91c1c' }}>{refundNo}</span>
          </div>
          <div>
            <strong>Refund Date & Time:</strong> {refundDateStr}
          </div>
          {patient.billNumber && (
            <div>
              <strong>Original Bill #:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{patient.billNumber}</span>
            </div>
          )}
        </div>

        {/* Patient Details */}
        <div style={{ marginBottom: '8px', border: '1px solid #000', borderRadius: '2px', padding: '5px 8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 0', width: '50%', lineHeight: '1.3' }}><strong>Patient Name:</strong> {patient.patientName}</td>
                <td style={{ padding: '2px 0', width: '50%', lineHeight: '1.3' }}><strong>UHID:</strong> {patient.uhid}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', lineHeight: '1.3' }}><strong>Gender / Age:</strong> {patient.gender} {patient.dob ? `(${ageFromDob(patient.dob)} yrs)` : ''}</td>
                <td style={{ padding: '2px 0', lineHeight: '1.3' }}><strong>Mobile Number:</strong> {patient.mobile || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', lineHeight: '1.3' }}><strong>Doctor Name:</strong> Dr. {doctorNameStr}</td>
                <td style={{ padding: '2px 0', lineHeight: '1.3' }}><strong>Department:</strong> {patient.department || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', lineHeight: '1.3' }}><strong>Registration #:</strong> {patient.registrationNumber || '-'}</td>
                <td style={{ padding: '2px 0', lineHeight: '1.3' }}><strong>Refund Processed By:</strong> {patient.refundedByName || 'Receptionist'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Refund Particulars Table */}
        <div style={{ marginBottom: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', border: '1px solid #000' }}>
            <thead>
              <tr style={{ backgroundColor: '#fee2e2' }}>
                <th style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'right' }}>Original Fee Paid</th>
                <th style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'right', color: '#b91c1c' }}>Refund Amount</th>
                <th style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center' }}>Refund Mode</th>
                <th style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #000' }}>
                  OPD Consultation Registration Fee - Dr. {doctorNameStr}
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>
                  ₹{Number(netFee || grossFee || 0).toFixed(2)}
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '12px', color: '#b91c1c' }}>
                  ₹{refundAmt.toFixed(2)}
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>
                  {patient.refundMode || patient.paymentMode || 'Cash'}
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center' }}>
                  <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>
                    REFUNDED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Remarks Box */}
        <div style={{ marginBottom: '8px', padding: '6px 8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '2px', fontSize: '10.5px' }}>
          <strong style={{ color: '#92400e' }}>Reason for Refund / Remarks:</strong> {patient.refundRemarks || 'Patient OPD consultation refund processed at reception.'}
        </div>

        {/* Amount in Words */}
        <div style={{ marginBottom: '16px', padding: '5px 8px', backgroundColor: '#f9f9f9', border: '1px solid #ccc', fontSize: '10.5px' }}>
          <strong>Refund Amount in Words:</strong> {amountInWords(refundAmt)}
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '35px', padding: '0 15px', fontSize: '10.5px' }}>
          <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000', paddingTop: '4px' }}>
            <strong>Patient / Receiver Signature</strong>
          </div>
          <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000', paddingTop: '4px' }}>
            <strong>Authorized Receptionist / Cashier</strong>
            <p style={{ margin: '1px 0 0 0', fontSize: '9px', color: '#666' }}>{patient.refundedByName || 'Reception Desk'}</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          position: 'relative',
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '9px',
          color: '#666',
          borderTop: '1px solid #ccc',
          paddingTop: '6px',
          pageBreakInside: 'avoid'
        }}>
          <p style={{ margin: '0' }}>This is an official hospital refund slip. Please retain this receipt for records.</p>
          <p style={{ margin: '2px 0 0 0' }}>Printed on: {documentDateTime}</p>
        </div>
      </div>
    );
  }

  if (isBillReceiptOnly) {
    return (
      <div ref={ref} className="a4-receipt" style={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: 'auto',
        padding: showUploadedLetterhead ? '0 8mm 8mm 8mm' : '6mm 8mm 8mm 8mm',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        lineHeight: '1.4',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {showUploadedLetterhead ? (
          <div style={{
            width: 'calc(100% + 16mm)',
            marginLeft: '-8mm',
            marginRight: '-8mm',
            marginTop: '0',
            height: `${hospital?.letterheadHeaderHeight || 4.6}cm`,
            overflow: 'hidden',
            marginBottom: '8px',
            border: 'none',
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={resolvedLetterhead || hospital?.letterheadImageUrl}
              crossOrigin="anonymous"
              alt="Hospital Letterhead"
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', border: 'none', outline: 'none' }}
            />
          </div>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2.5px solid #000',
            paddingBottom: '14px',
            marginBottom: '14px'
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
                  {hospital?.hospitalName || 'Hospital Name'}
                </h1>
                {hospital?.hospitalHeading && (
                  <p style={{ fontSize: '11px', margin: '3px 0 0 0', color: '#4b5563', fontWeight: '500' }}>{hospital.hospitalHeading}</p>
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
              maxWidth: '400px',
              width: '100%',
              alignItems: 'flex-start'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div><strong>Address:</strong> {hospital?.address || 'Hospital Address'}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <div><strong>Contact No:</strong> {formatHospitalPhoneNumbers(hospital)}</div>
              </div>

              {(hospital?.emailAddress || hospital?.email) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <div><strong>Email ID:</strong> {hospital.emailAddress || hospital.email}</div>
                </div>
              )}

              {hospital?.website && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  <div><strong>Website:</strong> {hospital.website}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Payment Receipt
          </h2>
        </div>

        <div style={{ marginBottom: '8px', border: '1px solid #000', borderRadius: '2px', padding: '5px 8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '1.5px 0', width: '50%', lineHeight: '1.3' }}><strong>Patient Name:</strong> {patient.patientName}</td>
                <td style={{ padding: '1.5px 0', width: '50%', lineHeight: '1.3' }}><strong>UHID:</strong> {patient.uhid}</td>
              </tr>
              <tr>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Gender / Age:</strong> {patient.gender} {patient.dob ? `(${ageFromDob(patient.dob)} yrs)` : ''}</td>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Mobile Number:</strong> {patient.mobile}</td>
              </tr>
              <tr>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Doctor Name:</strong> Dr. {doctorNameStr}</td>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Department:</strong> {patient.department || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Date / Time:</strong> {formatRegDate(patient.createdAt || patient.appointmentDate)}</td>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Registered By:</strong> <span style={{ textTransform: 'capitalize' }}>{patient.registeredBy || 'Receptionist'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', border: '1px solid #000' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'right' }}>Gross Fee</th>
                <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'right' }}>Discount</th>
                <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'right' }}>Net Amount</th>
                <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'center' }}>Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '4px 6px', border: '1px solid #000' }}>
                  OPD Consultation Fee - Dr. {doctorNameStr}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'right' }}>
                  ₹{grossFee.toFixed(2)}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'right' }}>
                  {patient.discountType === 'percent'
                    ? `${patient.discountValue || 0}% (₹${(patient.discountAmount || 0).toFixed(2)})`
                    : (patient.discountType === 'amount' && (patient.discountAmount || 0) > 0
                        ? `₹${(patient.discountAmount || 0).toFixed(2)}`
                        : '₹0.00')}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>
                  ₹{netFee.toFixed(2)}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'center' }}>
                  {(patient.paymentMode === 'Split' || patient.paymentMode === 'Split Payment') && patient.splitPayments ? (
                    <span>Split (Cash: ₹{patient.splitPayments.cash || 0}, UPI: ₹{patient.splitPayments.upi || 0})</span>
                  ) : (
                    patient.paymentMode || 'Cash'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '8px', padding: '4px 6px', backgroundColor: '#f9f9f9', border: '1px solid #ccc', fontSize: '10.5px' }}>
          <strong>Amount in Words:</strong> {amountInWords(netFee)}
        </div>

        <div style={{ 
          position: 'relative',
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '9px',
          color: '#666',
          borderTop: '1px solid #ccc',
          paddingTop: '8px',
          pageBreakInside: 'avoid'
        }}>
          <p style={{ margin: '0' }}>This is a computer-generated receipt. Thank you.</p>
          <p style={{ margin: '2px 0 0 0' }}>Printed on: {documentDateTime}</p>
        </div>
      </div>
    );
  }

  // Build Vitals / Examinations table rows matching reference format (Examinations | Value)
  const rawPulse = vitals.pulseRate ?? vitals.pulse ?? vitals.pr ?? vitals.pulse_rate;
  const pulseDisplay = (rawPulse !== undefined && rawPulse !== null && String(rawPulse).trim() !== '')
    ? (String(rawPulse).toLowerCase().includes('beat') || String(rawPulse).toLowerCase().includes('bpm')
        ? String(rawPulse).trim()
        : `${String(rawPulse).trim()} beats/min`)
    : '-';

  const rawBp = vitals.bloodPressure ?? vitals.bp ?? vitals.blood_pressure;
  const bpDisplay = (rawBp !== undefined && rawBp !== null && String(rawBp).trim() !== '')
    ? String(rawBp).trim()
    : '-';

  const rawTemp = vitals.temperature ?? vitals.temp;
  const tempDisplay = (rawTemp !== undefined && rawTemp !== null && String(rawTemp).trim() !== '')
    ? (String(rawTemp).includes('°') || String(rawTemp).toLowerCase().includes('f') || String(rawTemp).toLowerCase().includes('c')
        ? String(rawTemp).trim()
        : `${String(rawTemp).trim()} °F`)
    : '-';

  const rawRr = vitals.respiratoryRate ?? vitals.rr ?? vitals.respiratory_rate;
  const rrDisplay = (rawRr !== undefined && rawRr !== null && String(rawRr).trim() !== '')
    ? (String(rawRr).toLowerCase().includes('breath')
        ? String(rawRr).trim()
        : `${String(rawRr).trim()} breaths/min`)
    : '-';

  const rawSpo2 = vitals.spo2 ?? vitals.spO2 ?? vitals.oxygen;
  const spo2Display = (rawSpo2 !== undefined && rawSpo2 !== null && String(rawSpo2).trim() !== '')
    ? (String(rawSpo2).includes('%')
        ? String(rawSpo2).trim()
        : `${String(rawSpo2).trim()}%`)
    : '-';

  const rawWt = vitals.weight ?? vitals.wt;
  const rawHt = vitals.height ?? vitals.ht;
  const hasWt = rawWt !== undefined && rawWt !== null && String(rawWt).trim() !== '';
  const hasHt = rawHt !== undefined && rawHt !== null && String(rawHt).trim() !== '';
  const wtStr = hasWt
    ? (String(rawWt).toLowerCase().includes('kg') ? String(rawWt).trim() : `${String(rawWt).trim()} kg`)
    : null;
  const htStr = hasHt
    ? (String(rawHt).toLowerCase().includes('cm') ? String(rawHt).trim() : `${String(rawHt).trim()} cm`)
    : null;
  const wtHtDisplay = (wtStr && htStr) ? `${wtStr} / ${htStr}` : (wtStr || htStr || '-');

  const rawPallor = vitals.pallor;
  const pallorDisplay = (rawPallor !== undefined && rawPallor !== null && String(rawPallor).trim() !== '')
    ? String(rawPallor).trim()
    : '-';

  const rawEdema = vitals.edema ?? vitals.oedema;
  const edemaDisplay = (rawEdema !== undefined && rawEdema !== null && String(rawEdema).trim() !== '')
    ? String(rawEdema).trim()
    : '-';

  const rawChest = vitals.chest ?? vitals.bilateralChest ?? vitals.chestExam;
  const chestDisplay = (rawChest !== undefined && rawChest !== null && String(rawChest).trim() !== '')
    ? String(rawChest).trim()
    : '-';

  const rawCvs = vitals.cvs;
  const cvsDisplay = (rawCvs !== undefined && rawCvs !== null && String(rawCvs).trim() !== '')
    ? String(rawCvs).trim()
    : '-';

  const rawCns = vitals.cns;
  const cnsDisplay = (rawCns !== undefined && rawCns !== null && String(rawCns).trim() !== '')
    ? String(rawCns).trim()
    : '-';

  const vitalsTableRows = [
    { label: 'PULSE', value: pulseDisplay },
    { label: 'BP', value: bpDisplay },
    { label: 'TEMP', value: tempDisplay },
    { label: 'RR', value: rrDisplay },
    { label: 'SPO2', value: spo2Display },
    { label: 'WT/HT', value: wtHtDisplay },
    { label: 'PALLOR', value: pallorDisplay },
    { label: 'EDEMA', value: edemaDisplay },
    { label: 'CHEST', value: chestDisplay },
    { label: 'CVS', value: cvsDisplay },
    { label: 'CNS', value: cnsDisplay }
  ];

  const renderVitalsTable = (isCompactRightCol = false) => {
    if (printOptions.printVitals === false) return null;
    return (
      <div style={{
        marginBottom: isCompactRightCol ? '0' : '10px',
        border: '1px solid #000',
        borderRadius: '2px',
        padding: isCompactRightCol ? '5px 7px' : '6px 8px',
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        pageBreakInside: 'avoid',
        width: isCompactRightCol ? '100%' : 'auto',
        maxWidth: isCompactRightCol ? '100%' : '300px'
      }}>
        <table style={{
          borderCollapse: 'collapse',
          fontSize: '9.5px',
          lineHeight: '1.35',
          width: '100%',
          tableLayout: 'fixed'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{
                textAlign: 'left',
                padding: '2.5px 4px 3px 0',
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: '10px',
                letterSpacing: '0.4px',
                width: '52%'
              }}>
                EXAMINATIONS
              </th>
              <th style={{
                textAlign: 'left',
                padding: '2.5px 0 3px 2px',
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: '10px',
                letterSpacing: '0.4px',
                width: '48%'
              }}>
                VALUE
              </th>
            </tr>
          </thead>
          <tbody>
            {vitalsTableRows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < vitalsTableRows.length - 1 ? '1px dotted #e5e7eb' : 'none' }}>
                <td style={{
                  padding: '2.5px 4px 2.5px 0',
                  fontWeight: 'bold',
                  fontSize: '9.5px',
                  color: '#000',
                  whiteSpace: 'nowrap'
                }}>
                  {row.label}
                </td>
                <td style={{
                  padding: '2.5px 0 2.5px 2px',
                  fontSize: '9.5px',
                  color: '#000',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div ref={ref} className="a4-receipt" style={{
      width: '100%',
      maxWidth: '210mm',
      minHeight: isPatientSlipOnly ? '280mm' : 'auto',
      padding: showUploadedLetterhead ? '0 8mm 8mm 8mm' : '6mm 8mm 8mm 8mm',
      margin: '0 auto',
      marginTop: '0',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '11px',
      lineHeight: '1.4',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      {showUploadedLetterhead ? (
        <div style={{
          width: 'calc(100% + 16mm)',
          marginLeft: '-8mm',
          marginRight: '-8mm',
          marginTop: '0',
          height: `${hospital?.letterheadHeaderHeight || 4.6}cm`,
          overflow: 'hidden',
          marginBottom: '8px',
          border: 'none',
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src={resolvedLetterhead || hospital?.letterheadImageUrl}
            crossOrigin="anonymous"
            alt="Hospital Letterhead"
            style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', border: 'none', outline: 'none' }}
          />
        </div>
      ) : (
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2.5px solid #000',
        paddingBottom: '14px',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, paddingRight: '20px' }}>
          {resolvedLogo && (
            <div style={{ flexShrink: 0 }}>
              <img
                src={resolvedLogo}
                crossOrigin="anonymous"
                alt="Hospital Logo"
                style={{ maxHeight: '75px', maxWidth: '75px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#111827' }}>
              {hospital?.hospitalName || 'Hospital Name'}
            </h1>
            {hospital?.hospitalHeading && (
              <p style={{ fontSize: '11px', margin: '3px 0 0 0', color: '#4b5563', fontWeight: '500' }}>{hospital.hospitalHeading}</p>
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
          maxWidth: '400px',
          width: '100%',
          alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <div><strong>Address:</strong> {hospital?.address || 'Hospital Address'}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            <div><strong>Contact No:</strong> {formatHospitalPhoneNumbers(hospital)}</div>
          </div>

          {(hospital?.emailAddress || hospital?.email) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <div><strong>Email ID:</strong> {hospital.emailAddress || hospital.email}</div>
            </div>
          )}

          {hospital?.website && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <svg style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px', color: '#ea580c' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <div><strong>Website:</strong> {hospital.website}</div>
            </div>
          )}
        </div>
      </div>
      )}

      <h2 style={{ 
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '0 0 8px 0', 
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        borderBottom: '1px solid #000',
        paddingBottom: '3px'
      }}>
        {documentTitle}
      </h2>

            {prescription ? (
        /* TWO-COLUMN PRESCRIPTION ARCHITECTURE */
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', width: '100%', marginBottom: '8px' }}>
          {/* LEFT COLUMN: Clinical Content & Medicines */ }
          <div style={{ flex: '1 1 0%', minWidth: 0 }}>
            {/* 1. Patient Information & Appointment Details */ }
            <div style={{ marginBottom: '6px', padding: '5px 8px', border: '1px solid #000', borderRadius: '2px', backgroundColor: '#fff' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '10.5px', textDecoration: 'underline' }}>
                {t(activeLang, 'patientInfo')} & Appointment Details
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '2px' }}>
                <div style={{ width: '50%', padding: '1.5px 6px 1.5px 0', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Patient Name:</strong> {patient.patientName}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 0 1.5px 6px', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>UHID:</strong> {patient.uhid}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 6px 1.5px 0', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Gender / Age:</strong> {patient.gender} {patient.dob ? `(${ageFromDob(patient.dob)} yrs)` : ''}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 0 1.5px 6px', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Mobile Number:</strong> {patient.mobile}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 6px 1.5px 0', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Department / Speciality:</strong> {patient.department || '-'}{patient.speciality && !patient.department?.toLowerCase().includes(patient.speciality.toLowerCase()) ? ` - ${patient.speciality}` : ''}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 0 1.5px 6px', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>{isVisiting ? 'Visiting Specialist:' : 'Doctor Name:'}</strong> {doctorNameStr} {isVisiting ? '(Visiting Specialist)' : ''}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 6px 1.5px 0', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Appointment Date & Time:</strong> {formatDate(patient.appointmentDate)} {patient.slot ? `(${patient.slot})` : ''}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 0 1.5px 6px', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Registration Number:</strong> {patient.registrationNumber || '-'}
                    {patient.appointmentNumber ? ` | Token #${patient.appointmentNumber}` : ''}
                  </p>
                </div>
                {patient.address && (
                  <div style={{ width: '100%', padding: '1.5px 0 1.5px 0', boxSizing: 'border-box' }}>
                    <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                      <strong>Address:</strong> {patient.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Diagnosis & Remarks */ }
            {prescription.diagnosisRemark && printOptions.printDiagnosisRemarks !== false && (
              <div style={{ marginBottom: '6px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', fontSize: '10.5px' }}>Diagnosis & Remarks:</p>
                <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.38', whiteSpace: 'pre-line' }}>
                  {translateClinicalText(prescription.diagnosisRemark, activeLang)}
                </p>
              </div>
            )}

            {/* 3. Advice for the Patient */ }
            {prescription.patientAdvice && printOptions.printPatientAdvice !== false && (
              <div style={{ marginBottom: '6px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', fontSize: '10.5px' }}>Advice for the Patient:</p>
                <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.38', whiteSpace: 'pre-line' }}>
                  {translateClinicalText(prescription.patientAdvice, activeLang)}
                </p>
              </div>
            )}

            {/* 4. Lab Investigations & Reports */ }
            {prescription.tests && prescription.tests.length > 0 && printOptions.printLabTests !== false && (
              <div style={{ marginBottom: '6px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', fontSize: '10.5px' }}>Lab Investigations & Reports:</p>
                <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.38' }}>
                  {prescription.tests.join(', ')}
                </p>
              </div>
            )}

            {/* 5. Medicines Table with fixed table layout and auto-wrapping */ }
            {prescription.medicines && prescription.medicines.filter(m => m.medicine).length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 3px 0', fontSize: '10.5px', textDecoration: 'underline' }}>
                  {t(activeLang, 'medicines')}:
                </p>
                <table style={{
                  width: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  fontSize: '9.5px',
                  lineHeight: '1.3',
                  border: '1px solid #000',
                  boxSizing: 'border-box'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e8e8e8' }}>
                      <th style={{ padding: '3.5px 2px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '4%' }}>#</th>
                      <th style={{ padding: '3.5px 3px', border: '1px solid #000', textAlign: 'left', fontWeight: 'bold', width: '24%', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{t(activeLang, 'medicine')}</th>
                      <th style={{ padding: '3.5px 2px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '11%', overflowWrap: 'break-word', wordBreak: 'break-word' }}>Dosage Form</th>
                      <th style={{ padding: '3.5px 2px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%', overflowWrap: 'break-word', wordBreak: 'break-word' }}>Strength</th>
                      <th style={{ padding: '3.5px 2px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '7%' }}>Dose</th>
                      <th style={{ padding: '3.5px 2px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '14%', overflowWrap: 'break-word', wordBreak: 'break-word' }}>Frequency</th>
                      <th style={{ padding: '3.5px 2px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Duration</th>
                      <th style={{ padding: '3.5px 3px', border: '1px solid #000', textAlign: 'left', fontWeight: 'bold', width: '13%', overflowWrap: 'break-word', wordBreak: 'break-word' }}>Remarks</th>
                      <th style={{ padding: '3.5px 2px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '7%' }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.medicines.filter((m) => m.medicine).map((item, index) => {
                      const doseNum = parseFloat(item.dose) || 0;
                      const freqCount = (item.morning ? 1 : 0) + (item.afternoon ? 1 : 0) + (item.night ? 1 : 0);
                      const durDays = parseFloat(item.duration) || 0;
                      const calculatedQty = parseFloat((doseNum * freqCount * durDays).toFixed(2));
                      const displayQty = item.qty !== undefined ? item.qty : calculatedQty;
                      const frequencyStr = [
                        item.morning ? '1' : '0',
                        item.afternoon ? '1' : '0',
                        item.night ? '1' : '0'
                      ].join(' - ');

                      return (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f7f7f7' }}>
                          <td style={{ padding: '3px 2px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle' }}>{index + 1}</td>
                          <td style={{ padding: '3px 3px', border: '1px solid #000', verticalAlign: 'middle', fontWeight: '600', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{item.medicine}</td>
                          <td style={{ padding: '3px 2px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle', fontWeight: '500', color: '#4a5568', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{item.dosageForm || 'Tablet'}</td>
                          <td style={{ padding: '3px 2px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{item.strength || '-'}</td>
                          <td style={{ padding: '3px 2px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle' }}>{item.dose !== undefined ? item.dose : '1'}</td>
                          <td style={{ padding: '3px 2px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle', fontFamily: 'monospace', fontSize: '9px' }}>{frequencyStr}</td>
                          <td style={{ padding: '3px 2px', border: '1px solid #000', verticalAlign: 'middle', textAlign: 'center' }}>
                            {item.duration ? `${translateClinicalText(item.duration, activeLang)} days` : '-'}
                          </td>
                          <td style={{ padding: '3px 3px', border: '1px solid #000', verticalAlign: 'middle', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{translateClinicalText(item.remarks, activeLang) || '-'}</td>
                          <td style={{ padding: '3px 2px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>{displayQty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Symptoms */ }
            {prescription.symptoms && prescription.symptoms.length > 0 && (
              <div style={{ marginBottom: '6px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', fontSize: '10.5px' }}>{t(activeLang, 'symptoms')}:</p>
                {prescription.symptoms.length > 1 ? (
                  <ul style={{ margin: '2px 0 0 0', paddingLeft: '16px', listStyleType: 'disc', fontSize: '10px', lineHeight: '1.38' }}>
                    {prescription.symptoms.map((s, idx) => {
                      let str = translateClinicalText(s.symptom, activeLang);
                      if (s.durationDays) str += ` (${s.durationDays} ${s.durationUnit || 'Days'})`;
                      if (printOptions.printSymptomHistory !== false && s.pastHistory) {
                        str += ` [History: ${s.pastHistory}]`;
                      }
                      if (printOptions.printSymptomRemarks !== false && s.remarks) {
                        str += ` [Remarks: ${s.remarks}]`;
                      }
                      return <li key={idx} style={{ marginBottom: '1.5px' }}>{str}</li>;
                    })}
                  </ul>
                ) : (
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.38' }}>
                    {prescription.symptoms.map((s) => {
                      let str = translateClinicalText(s.symptom, activeLang);
                      if (s.durationDays) str += ` (${s.durationDays} ${s.durationUnit || 'Days'})`;
                      if (printOptions.printSymptomHistory !== false && s.pastHistory) {
                        str += ` [History: ${s.pastHistory}]`;
                      }
                      if (printOptions.printSymptomRemarks !== false && s.remarks) {
                        str += ` [Remarks: ${s.remarks}]`;
                      }
                      return str;
                    }).join('; ')}
                  </p>
                )}
              </div>
            )}

            {/* 7. General Past History */ }
            {prescription.pastHistory && printOptions.printGeneralPastHistory !== false && (
              <div style={{ marginBottom: '6px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', fontSize: '10.5px' }}>General Past History:</p>
                <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.38', whiteSpace: 'pre-line' }}>
                  {prescription.pastHistory}
                </p>
              </div>
            )}

            {/* 8. Follow up date */ }
            {prescription.followUpDate && (
              <div style={{ marginBottom: '6px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', fontSize: '10.5px' }}>Follow up date:</p>
                <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold' }}>
                  {formatDate(prescription.followUpDate)}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Vitals Section Aligned with Clinical Content */ }
          {printOptions.printVitals !== false && (
            <div style={{ width: '190px', flexShrink: 0 }}>
              {renderVitalsTable(true)}
            </div>
          )}
        </div>
      ) : (
        /* NON-PRESCRIPTION LAYOUT (e.g. Patient Slip / Bill Receipt) */
        <>
          <div style={{ marginBottom: '8px', padding: '6px 8px', border: '1px solid #000', borderRadius: '2px' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px', textDecoration: 'underline' }}>
              {t(activeLang, 'patientInfo')} & Appointment Details
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '2px' }}>
              <div style={{ width: '50%', padding: '1.5px 8px 1.5px 0', boxSizing: 'border-box' }}>
                <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                  <strong>Patient Name:</strong> {patient.patientName}
                </p>
              </div>
              <div style={{ width: '50%', padding: '1.5px 0 1.5px 8px', boxSizing: 'border-box' }}>
                <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                  <strong>UHID:</strong> {patient.uhid}
                </p>
              </div>
              <div style={{ width: '50%', padding: '1.5px 8px 1.5px 0', boxSizing: 'border-box' }}>
                <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                  <strong>Gender / Age:</strong> {patient.gender} {patient.dob ? `(${ageFromDob(patient.dob)} yrs)` : ''}
                </p>
              </div>
              <div style={{ width: '50%', padding: '1.5px 0 1.5px 8px', boxSizing: 'border-box' }}>
                <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                  <strong>Mobile Number:</strong> {patient.mobile}
                </p>
              </div>
              <div style={{ width: '50%', padding: '1.5px 8px 1.5px 0', boxSizing: 'border-box' }}>
                <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                  <strong>Department / Speciality:</strong> {patient.department || '-'}{patient.speciality && !patient.department?.toLowerCase().includes(patient.speciality.toLowerCase()) ? ` - ${patient.speciality}` : ''}
                </p>
              </div>
              <div style={{ width: '50%', padding: '1.5px 0 1.5px 8px', boxSizing: 'border-box' }}>
                <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                  <strong>{isVisiting ? 'Visiting Specialist:' : 'Doctor Name:'}</strong> {doctorNameStr} {isVisiting ? '(Visiting Specialist)' : ''}
                </p>
              </div>
              <div style={{ width: '50%', padding: '1.5px 8px 1.5px 0', boxSizing: 'border-box' }}>
                <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                  <strong>Appointment Date & Time:</strong> {formatDate(patient.appointmentDate)} {patient.slot ? `(${patient.slot})` : ''}
                </p>
              </div>
              <div style={{ width: '50%', padding: '1.5px 0 1.5px 8px', boxSizing: 'border-box' }}>
                <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                  <strong>Registration Number:</strong> {patient.registrationNumber || '-'}
                  {patient.appointmentNumber ? ` | Token #${patient.appointmentNumber}` : ''}
                </p>
              </div>
              {isPatientSlipOnly && (
                <div style={{ width: '50%', padding: '1.5px 8px 1.5px 0', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                    <strong>Consultation Fee:</strong> ₹{Number(netFee).toFixed(2)} ({patient.paymentStatus || 'Paid'})
                  </p>
                </div>
              )}
              {isPatientSlipOnly && patient.billNumber && (
                <div style={{ width: '50%', padding: '1.5px 0 1.5px 8px', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                    <strong>Receipt No:</strong> {patient.billNumber}
                  </p>
                </div>
              )}
              {patient.address && (
                <div style={{ width: '100%', padding: '1.5px 0 1.5px 0', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                    <strong>Address:</strong> {patient.address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {(isPatientSlipOnly || mode === 'all') && renderVitalsTable(false)}

          {!prescription && !isPatientSlipOnly && (
            <div style={{ marginBottom: '18px', padding: '10px', border: '1px solid #000', borderRadius: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontWeight: 'bold', margin: '0', fontSize: '12px', textDecoration: 'underline' }}>
                  OPD Fee & Payment Summary
                </p>
                {patient.billNumber && (
                  <p style={{ margin: '0', fontSize: '11px', fontWeight: 'bold' }}>
                    Receipt No: {patient.billNumber}
                  </p>
                )}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #000' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>Gross Fee</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>Discount</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>Net Amount</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center' }}>Payment Mode</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 8px', border: '1px solid #000' }}>
                      OPD Consultation Fee - {doctorNameStr} {isVisiting ? '(Visiting Specialist)' : ''}
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>
                      ₹{grossFee.toFixed(2)}
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>
                      {patient.discountType === 'percent'
                        ? `${patient.discountValue || 0}% (₹${(patient.discountAmount || 0).toFixed(2)})`
                        : (patient.discountType === 'amount' && (patient.discountAmount || 0) > 0
                            ? `₹${(patient.discountAmount || 0).toFixed(2)}`
                            : '₹0.00')}
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>
                      ₹{netFee.toFixed(2)}
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center' }}>
                      {(patient.paymentMode === 'Split' || patient.paymentMode === 'Split Payment') && patient.splitPayments ? (
                        <span>Split (Cash: ₹{patient.splitPayments.cash || 0}, UPI: ₹{patient.splitPayments.upi || 0})</span>
                      ) : (
                        patient.paymentMode || 'Cash'
                      )}
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', color: patient.paymentStatus === 'Not Paid' ? '#dc2626' : '#16a34a' }}>
                      {patient.paymentStatus || 'Paid'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div style={{ 
        position: isPatientSlipOnly ? 'absolute' : 'relative',
        bottom: isPatientSlipOnly ? '8mm' : 'auto',
        left: isPatientSlipOnly ? '8mm' : 'auto',
        right: isPatientSlipOnly ? '8mm' : 'auto',
        marginTop: isPatientSlipOnly ? '0' : (prescription ? '12px' : '20px'),
        textAlign: 'center', 
        fontSize: '9px', 
        color: '#666', 
        borderTop: '1px solid #ccc', 
        paddingTop: '10px',
        pageBreakInside: 'avoid'
      }}>
        <p style={{ margin: '0' }}>This is a computer-generated document. No signature required.</p>
        <p style={{ margin: '3px 0 0 0' }}>
          Generated on: {documentDateTime}
        </p>
      </div>
    </div>
  );
});

PatientReceipt.displayName = 'PatientReceipt';

export default PatientReceipt;