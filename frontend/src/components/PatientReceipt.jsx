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

const PatientReceipt = forwardRef(({ patient, prescription, hospitalSettings, language, mode = 'all', printOptions: propPrintOptions }, ref) => {
  const activeLang = language || prescription?.language || 'English';
  const [hospital, setHospital] = useState(null);

  const printOptions = propPrintOptions || prescription?.printOptions || patient?.printOptions || {
    printVitals: true,
    printLabTests: true,
    printSymptomHistory: true,
    printSymptomRemarks: true,
    printGeneralPastHistory: true
  };

  useEffect(() => {
    if (hospitalSettings) {
      setHospital(hospitalSettings);
    } else {
      client.get('/admin/hospital-settings').then(({ data }) => {
        if (data.exists && data.data) setHospital(data.data);
      }).catch(() => {});
    }
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

  const grossFee = patient.opdFee !== undefined ? patient.opdFee : (patient.doctorId?.opdFees || 0);
  const netFee = patient.netOpdFee !== undefined ? patient.netOpdFee : grossFee;
  const doctorNameStr = patient.doctorId?.doctorName || patient.doctorId?.username || (typeof patient.doctorId === 'string' ? patient.doctorId : '-');

  const vitals = patient.demographics || prescription?.vitals || {};
  const hasVitals = vitals.weight || vitals.height || vitals.bloodPressure || vitals.temperature;
  const documentTitle = isPatientSlipOnly ? 'OPD PATIENT SLIP' : (isBillReceiptOnly ? 'PAYMENT RECEIPT' : 'PRESCRIPTION');

  if (isBillReceiptOnly) {
    return (
      <div ref={ref} className="a4-receipt" style={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: 'auto',
        padding: '6mm 8mm 8mm 8mm',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        lineHeight: '1.4',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          borderBottom: '2.5px solid #000',
          paddingBottom: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, paddingRight: '20px' }}>
            {hospital?.logoUrl && (
              <img src={hospital.logoUrl} alt="Logo" style={{ maxHeight: '75px', maxWidth: '75px', objectFit: 'contain', flexShrink: 0 }} />
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

        <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Payment Receipt
          </h2>
        </div>

        <div style={{ marginBottom: '12px', border: '1px solid #000', borderRadius: '2px', padding: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 0', width: '50%' }}><strong>Patient Name:</strong> {patient.patientName}</td>
                <td style={{ padding: '3px 0', width: '50%' }}><strong>UHID:</strong> {patient.uhid}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0' }}><strong>Gender / Age:</strong> {patient.gender} {patient.dob ? `(${ageFromDob(patient.dob)} yrs)` : ''}</td>
                <td style={{ padding: '3px 0' }}><strong>Mobile Number:</strong> {patient.mobile}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0' }}><strong>Doctor Name:</strong> Dr. {doctorNameStr}</td>
                <td style={{ padding: '3px 0' }}><strong>Department:</strong> {patient.department || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0' }}><strong>Date / Time:</strong> {formatRegDate(patient.createdAt || patient.appointmentDate)}</td>
                <td style={{ padding: '3px 0' }}><strong>Registered By:</strong> <span style={{ textTransform: 'capitalize' }}>{patient.registeredBy || 'Receptionist'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #000' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>Gross Fee</th>
                <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>Discount</th>
                <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>Net Amount</th>
                <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center' }}>Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #000' }}>
                  OPD Consultation Fee - Dr. {doctorNameStr}
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
                  {patient.paymentMode || 'Cash'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '15px', padding: '6px 8px', backgroundColor: '#f9f9f9', border: '1px solid #ccc', fontSize: '11px' }}>
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

  return (
    <div ref={ref} className="a4-receipt" style={{
      width: '100%',
      maxWidth: '210mm',
      minHeight: 'auto',
      padding: '5px 8mm 8mm 8mm',
      margin: '5px auto 0 auto',
      marginTop: '5px',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '11px',
      lineHeight: '1.5',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        borderBottom: '2.5px solid #000',
        paddingBottom: '14px',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, paddingRight: '20px' }}>
          {hospital?.logoUrl && (
            <div style={{ flexShrink: 0 }}>
              <img
                src={hospital.logoUrl}
                alt="Hospital Logo"
                style={{ maxHeight: '75px', maxWidth: '75px', objectFit: 'contain' }}
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

      <h2 style={{ 
        fontSize: '15px', 
        fontWeight: 'bold', 
        margin: '0 0 15px 0', 
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        borderBottom: '1px solid #000',
        paddingBottom: '4px'
      }}>
        {documentTitle}
      </h2>

      <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #000', borderRadius: '2px' }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 8px 0', fontSize: '12px', textDecoration: 'underline' }}>
          {t(activeLang, 'patientInfo')} & Appointment Details
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ width: '50%', padding: '3px 10px 3px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Patient Name:</strong> {patient.patientName}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 0 3px 10px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>UHID:</strong> {patient.uhid}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 10px 3px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Gender / Age:</strong> {patient.gender} {patient.dob ? `(${ageFromDob(patient.dob)} yrs)` : ''}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 0 3px 10px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Mobile Number:</strong> {patient.mobile}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 10px 3px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Department:</strong> {patient.department || '-'}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 0 3px 10px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Doctor Name:</strong> Dr. {doctorNameStr}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 10px 3px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Appointment Date & Time:</strong> {formatDate(patient.appointmentDate)} {patient.slot ? `(${patient.slot})` : ''}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 0 3px 10px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Registration Number:</strong> {patient.registrationNumber || '-'}
            </p>
          </div>
          {patient.address && (
            <div style={{ width: '100%', padding: '3px 0 3px 0', boxSizing: 'border-box' }}>
              <p style={{ margin: '0', fontSize: '11px' }}>
                <strong>Address:</strong> {patient.address}
              </p>
            </div>
          )}
        </div>
      </div>

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
                  OPD Consultation Fee - Dr. {doctorNameStr}
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
                  {patient.paymentMode || 'Cash'}
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', color: patient.paymentStatus === 'Not Paid' ? '#dc2626' : '#16a34a' }}>
                  {patient.paymentStatus || 'Paid'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

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
              <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '12px', textDecoration: 'underline' }}>
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

      <div style={{ 
        position: 'relative',
        marginTop: '25px',
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