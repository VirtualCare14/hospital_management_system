'use client';

import { useEffect, useState, forwardRef } from 'react';
import { apiRequest } from '@/lib/api';
import { formatDate, formatDateShort } from '@/lib/utils/dateFormat';
import { t, translateClinicalText } from '@/lib/utils/prescriptionI18n';

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

const PatientReceipt = forwardRef(({ patient, prescription, hospitalSettings, language, mode = 'patient_slip', letterheadMode = 'auto', printOptions: propPrintOptions }, ref) => {
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
          const res = await apiRequest('/admin/hospital-settings');
          if (res?.exists && res?.data) {
            data = res.data;
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

  if (!patient && !prescription) return null;

  // Universal unnesting for all wrapper formats
  const raw = patient || prescription || {};
  const p = (typeof raw.patient === 'object' && raw.patient !== null)
    ? raw.patient
    : ((typeof raw.data?.patient === 'object' && raw.data?.patient !== null)
        ? raw.data.patient
        : ((typeof raw.patientId === 'object' && raw.patientId !== null)
            ? raw.patientId
            : ((typeof raw.data === 'object' && raw.data !== null)
                ? raw.data
                : raw)));

  const v = (typeof raw.visit === 'object' && raw.visit !== null)
    ? raw.visit
    : ((typeof raw.data?.visit === 'object' && raw.data?.visit !== null)
        ? raw.data.visit
        : ((typeof raw.visitId === 'object' && raw.visitId !== null)
            ? raw.visitId
            : raw));

  const ageFromDob = (dob) => {
    if (!dob) return '';
    try {
      const diff = Date.now() - new Date(dob).getTime();
      const calculated = Math.abs(new Date(diff).getUTCFullYear() - 1970);
      return !isNaN(calculated) ? `${calculated} yrs` : '';
    } catch (e) {
      return '';
    }
  };

  const patientName = p?.patientName || raw?.patientName || p?.name || raw?.name || v?.patientName || '-';
  const uhid = p?.uhid || raw?.uhid || v?.uhid || '-';
  const gender = p?.gender || raw?.gender || v?.gender || '-';
  const dob = p?.dob || raw?.dob || v?.dob || null;
  const ageDisplay = ageFromDob(dob) || (p?.age ? `${p.age} yrs` : (raw?.age ? `${raw.age} yrs` : '-'));
  const mobile = p?.mobile || raw?.mobile || v?.mobile || '-';
  const address = p?.address || raw?.address || v?.address || '';
  const department = v?.department || v?.appointmentDept || p?.department || prescription?.department || raw?.department || 'Clinic';

  const doc = v?.doctorId || raw?.doctorId || p?.doctorId || prescription?.doctorId;
  const doctorNameStr = raw?.doctorName || v?.doctorName || (typeof doc === 'object' && doc !== null ? (doc.doctorName || doc.username) : (typeof doc === 'string' && doc.trim().length > 0 && !doc.match(/^[0-9a-fA-F]{24}$/) ? doc : '-')) || '-';

  const apptDateRaw = v?.appointmentDate || v?.registrationDate || v?.createdAt || raw?.appointmentDate || raw?.registrationDate || raw?.createdAt || p?.appointmentDate || p?.createdAt;
  const slot = v?.slot || raw?.slot || p?.slot || '';
  const regNumber = v?.registrationNumber || raw?.registrationNumber || v?.appointmentNumber || raw?.appointmentNumber || v?.billNumber || raw?.billNumber || p?.registrationNumber || '-';

  // Fee resolution
  const grossFeeCandidate = v?.opdFee !== undefined && v?.opdFee !== null && Number(v?.opdFee) > 0
    ? v.opdFee
    : (p?.opdFee !== undefined && p?.opdFee !== null && Number(p?.opdFee) > 0
        ? p.opdFee
        : (raw?.opdFee !== undefined && raw?.opdFee !== null && Number(raw?.opdFee) > 0
            ? raw.opdFee
            : (typeof doc === 'object' && doc?.opdFees !== undefined ? doc.opdFees : 0)));
  const grossFee = Math.max(0, Number(grossFeeCandidate) || 0);

  const discountType = v?.discountType || p?.discountType || raw?.discountType || 'none';
  const discountValue = Number(v?.discountValue || p?.discountValue || raw?.discountValue || 0);
  const discountAmount = Number(v?.discountAmount !== undefined ? v.discountAmount : (p?.discountAmount !== undefined ? p.discountAmount : (raw?.discountAmount !== undefined ? raw.discountAmount : 0)));

  const netFeeCandidate = v?.netOpdFee !== undefined && v?.netOpdFee !== null && Number(v?.netOpdFee) > 0
    ? v.netOpdFee
    : (p?.netOpdFee !== undefined && p?.netOpdFee !== null && Number(p?.netOpdFee) > 0
        ? p.netOpdFee
        : (raw?.netOpdFee !== undefined && raw?.netOpdFee !== null && Number(raw?.netOpdFee) > 0
            ? raw.netOpdFee
            : null));
  const netFee = netFeeCandidate !== null && netFeeCandidate !== undefined ? Math.max(0, Number(netFeeCandidate) || 0) : Math.max(0, grossFee - discountAmount);

  const paymentMode = v?.paymentMode || p?.paymentMode || raw?.paymentMode || 'Cash';
  const paymentStatus = v?.paymentStatus || p?.paymentStatus || raw?.paymentStatus || 'Paid';
  const billNumber = v?.billNumber || p?.billNumber || raw?.billNumber || '';

  const vitals = v.demographics || p.demographics || raw.demographics || prescription?.vitals || {};
  const hasVitals = vitals.weight || vitals.height || vitals.bloodPressure || vitals.temperature || vitals.pulse || vitals.spo2 || vitals.bmi;

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

  const isBillReceiptOnly = mode === 'bill_receipt';
  const isPatientSlipOnly = mode === 'patient_slip';
  const isPrescription = !!prescription;

  // Check if uploaded photo letterhead should be shown
  const showUploadedLetterhead =
    letterheadMode === 'image'
      ? Boolean(resolvedLetterhead || hospital?.letterheadImageUrl)
      : letterheadMode === 'system'
        ? false
        : (!hospital?.useSystemLetterhead && Boolean(resolvedLetterhead || hospital?.letterheadImageUrl));

  // Header component shared between Slip & Receipt (Medora360 reception design)
  const renderHospitalHeader = () => {
    if (showUploadedLetterhead) {
      return (
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
      );
    }

    return (
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
    );
  };

  // ========================================================
  // VIEW 1: BILL RECEIPT / PAYMENT RECEIPT (Medora360 Format)
  // ========================================================
  if (isBillReceiptOnly && !prescription) {
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
        {renderHospitalHeader()}

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Payment Receipt
          </h2>
        </div>

        {/* Patient Details Box */}
        <div style={{ marginBottom: '8px', border: '1px solid #000', borderRadius: '2px', padding: '5px 8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '1.5px 0', width: '50%', lineHeight: '1.3' }}><strong>Patient Name:</strong> {patientName}</td>
                <td style={{ padding: '1.5px 0', width: '50%', lineHeight: '1.3' }}><strong>UHID:</strong> {uhid}</td>
              </tr>
              <tr>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Gender / Age:</strong> {gender} {ageDisplay ? `(${ageDisplay})` : ''}</td>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Mobile Number:</strong> {mobile}</td>
              </tr>
              <tr>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Doctor Name:</strong> Dr. {doctorNameStr}</td>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Department:</strong> {department}</td>
              </tr>
              <tr>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Date / Time:</strong> {apptDateRaw ? formatDate(apptDateRaw) : '-'} {slot ? `(${slot})` : ''}</td>
                <td style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Receipt No:</strong> {billNumber || regNumber}</td>
              </tr>
              {address && (
                <tr>
                  <td colSpan={2} style={{ padding: '1.5px 0', lineHeight: '1.3' }}><strong>Address:</strong> {address}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bill Items Table */}
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
                  {discountType === 'percent'
                    ? `${discountValue}% (₹${discountAmount.toFixed(2)})`
                    : (discountAmount > 0 ? `₹${discountAmount.toFixed(2)}` : '₹0.00')}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>
                  ₹{netFee.toFixed(2)}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'center' }}>
                  {paymentMode}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in Words */}
        <div style={{ marginBottom: '8px', padding: '4px 6px', backgroundColor: '#f9f9f9', border: '1px solid #ccc', fontSize: '10.5px' }}>
          <strong>Amount in Words:</strong> {amountInWords(netFee)}
        </div>

        {/* Footer */}
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

  // =========================================================
  // VIEW 2: PATIENT SLIP / OPD CONSULTATION SLIP (Medora360 Format)
  // =========================================================
  const documentTitle = isPrescription ? 'PRESCRIPTION' : 'PATIENT OPD SLIP';

  return (
    <div ref={ref} className="a4-receipt" style={{
      width: '100%',
      maxWidth: '210mm',
      minHeight: isPatientSlipOnly ? '280mm' : 'auto',
      padding: showUploadedLetterhead ? '0 8mm 8mm 8mm' : '5px 8mm 8mm 8mm',
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
      {renderHospitalHeader()}

      {/* Document Title */}
      <h2 style={{ 
        fontSize: '13px', 
        fontWeight: 'bold', 
        margin: '0 0 6px 0', 
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        borderBottom: '1px solid #000',
        paddingBottom: '3px'
      }}>
        {documentTitle}
      </h2>

      {/* Patient & Appointment Details Box */}
      <div style={{ marginBottom: '8px', padding: '6px 8px', border: '1px solid #000', borderRadius: '2px' }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px', textDecoration: 'underline' }}>
          {t(activeLang, 'patientInfo')} & Appointment Details
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '2px' }}>
          <div style={{ width: '50%', padding: '1.5px 8px 1.5px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
              <strong>Patient Name:</strong> {patientName}
            </p>
          </div>
          <div style={{ width: '50%', padding: '1.5px 0 1.5px 8px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
              <strong>UHID:</strong> {uhid}
            </p>
          </div>
          <div style={{ width: '50%', padding: '1.5px 8px 1.5px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
              <strong>Gender / Age:</strong> {gender} {ageDisplay ? `(${ageDisplay})` : ''}
            </p>
          </div>
          <div style={{ width: '50%', padding: '1.5px 0 1.5px 8px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
              <strong>Mobile Number:</strong> {mobile}
            </p>
          </div>
          <div style={{ width: '50%', padding: '1.5px 8px 1.5px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
              <strong>Department:</strong> {department}
            </p>
          </div>
          <div style={{ width: '50%', padding: '1.5px 0 1.5px 8px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
              <strong>Doctor Name:</strong> Dr. {doctorNameStr}
            </p>
          </div>
          <div style={{ width: '50%', padding: '1.5px 8px 1.5px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
              <strong>Appointment Date & Time:</strong> {apptDateRaw ? formatDate(apptDateRaw) : '-'} {slot ? `(${slot})` : ''}
            </p>
          </div>
          <div style={{ width: '50%', padding: '1.5px 0 1.5px 8px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
              <strong>Registration Number:</strong> {regNumber}
            </p>
          </div>
          {address && (
            <div style={{ width: '100%', padding: '1.5px 0 1.5px 0', boxSizing: 'border-box' }}>
              <p style={{ margin: '0', fontSize: '10.5px', lineHeight: '1.3' }}>
                <strong>Address:</strong> {address}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vitals Line */}
      {(isPatientSlipOnly || mode === 'all') && hasVitals && printOptions.printVitals !== false && (
        <div style={{ marginBottom: '12px', fontSize: '11px' }}>
          <p style={{ margin: '0', lineHeight: '1.5' }}>
            <strong>Vitals:</strong>{' '}
            {[
              vitals.weight ? `Weight: ${vitals.weight} kg` : null,
              vitals.height ? `Height: ${vitals.height} cm` : null,
              vitals.bloodPressure ? `BP: ${vitals.bloodPressure}` : null,
              vitals.temperature ? `Temp: ${vitals.temperature} °F` : null,
              vitals.bmi ? `BMI: ${vitals.bmi}` : null,
              vitals.pulse ? `Pulse: ${vitals.pulse} bpm` : null,
              vitals.spo2 ? `SpO2: ${vitals.spo2}%` : null
            ].filter(Boolean).join(' | ')}
          </p>
        </div>
      )}


      {/* Prescription Details (If Clinical Prescription Mode) */}
      {prescription && (
        <>
          <hr style={{ margin: '14px 0', border: 'none', borderTop: '1px solid #000' }} />
          
          {prescription.diagnosisRemark && printOptions.printDiagnosisRemarks !== false && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px' }}>Diagnosis & Remarks:</p>
              <p style={{ 
                margin: '0', 
                fontSize: '10px',
                lineHeight: '1.5',
                whiteSpace: 'pre-line'
              }}>
                {translateClinicalText(prescription.diagnosisRemark, activeLang)}
              </p>
            </div>
          )}

          {prescription.patientAdvice && printOptions.printPatientAdvice !== false && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px' }}>Advice for the Patient:</p>
              <p style={{ 
                margin: '0', 
                fontSize: '10px',
                lineHeight: '1.5',
                whiteSpace: 'pre-line'
              }}>
                {translateClinicalText(prescription.patientAdvice, activeLang)}
              </p>
            </div>
          )}

          {prescription.tests && prescription.tests.length > 0 && printOptions.printLabTests !== false && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px' }}>Lab Investigations & Reports:</p>
              <p style={{ 
                margin: '0', 
                fontSize: '10px',
                lineHeight: '1.5'
              }}>
                {prescription.tests.join(', ')}
              </p>
            </div>
          )}

          {prescription.medicines && prescription.medicines.filter(m => m.medicine).length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px', textDecoration: 'underline' }}>
                {t(activeLang, 'medicines')}:
              </p>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                fontSize: '10px',
                border: '1px solid #000'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#e8e8e8' }}>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left', fontWeight: 'bold', width: '4%' }}>#</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left', fontWeight: 'bold', width: '25%' }}>{t(activeLang, 'medicine')}</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>Dosage Form</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Strength</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '8%' }}>Dose</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '13%' }}>Frequency</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>Duration</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left', fontWeight: 'bold', width: '10%' }}>Remarks</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', width: '8%' }}>Qty</th>
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
                        <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle' }}>{index + 1}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #000', verticalAlign: 'middle', fontWeight: '500' }}>{item.medicine}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle', fontWeight: '500', color: '#4a5568' }}>{item.dosageForm || 'Tablet'}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle' }}>{item.strength || '-'}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle' }}>{item.dose !== undefined ? item.dose : '1'}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle', fontFamily: 'monospace' }}>{frequencyStr}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #000', verticalAlign: 'middle', textAlign: 'center' }}>
                          {item.duration ? `${translateClinicalText(item.duration, activeLang)} days` : '-'}
                        </td>
                        <td style={{ padding: '5px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{translateClinicalText(item.remarks, activeLang) || '-'}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>{displayQty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {prescription.symptoms && prescription.symptoms.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px' }}>{t(activeLang, 'symptoms')}:</p>
              {prescription.symptoms.length > 1 ? (
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', listStyleType: 'disc', fontSize: '10px', lineHeight: '1.6' }}>
                  {prescription.symptoms.map((s, idx) => {
                    let str = translateClinicalText(s.symptom, activeLang);
                    if (s.durationDays) str += ` (${s.durationDays} ${s.durationUnit || 'Days'})`;
                    if (printOptions.printSymptomHistory !== false && s.pastHistory) {
                      str += ` [History: ${s.pastHistory}]`;
                    }
                    if (printOptions.printSymptomRemarks !== false && s.remarks) {
                      str += ` [Remarks: ${s.remarks}]`;
                    }
                    return <li key={idx} style={{ marginBottom: '2px' }}>{str}</li>;
                  })}
                </ul>
              ) : (
                <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.5' }}>
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

          {prescription.pastHistory && printOptions.printGeneralPastHistory !== false && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px' }}>General Past History:</p>
              <p style={{ 
                margin: '0', 
                fontSize: '10px',
                lineHeight: '1.5',
                whiteSpace: 'pre-line'
              }}>
                {prescription.pastHistory}
              </p>
            </div>
          )}

          {prescription.followUpDate && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px' }}>Follow up date:</p>
              <p style={{ 
                margin: '0', 
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {formatDate(prescription.followUpDate)}
              </p>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{ 
        position: isPatientSlipOnly ? 'absolute' : 'relative',
        bottom: isPatientSlipOnly ? '8mm' : 'auto',
        left: isPatientSlipOnly ? '8mm' : 'auto',
        right: isPatientSlipOnly ? '8mm' : 'auto',
        marginTop: isPatientSlipOnly ? '0' : '25px',
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
