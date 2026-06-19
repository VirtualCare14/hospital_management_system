import { useEffect, useState, forwardRef } from 'react';
import client from '../api/client';
import { formatDate, formatDateShort } from '../utils/dateFormat';

const PatientReceipt = forwardRef(({ patient, prescription, hospitalSettings }, ref) => {
  const [hospital, setHospital] = useState(null);

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

  return (
    <div ref={ref} className="a4-receipt" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '12mm 15mm',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '11px',
      lineHeight: '1.4'
    }}>
      {/* Hospital Header - Single Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        paddingBottom: '12px',
        borderBottom: '2px solid #000',
        marginBottom: '15px'
      }}>
        {hospital?.logoUrl && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={hospital.logoUrl}
              alt="Hospital Logo"
              style={{ maxHeight: '65px', maxWidth: '65px' }}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {hospital?.hospitalName || 'Hospital Name'}
          </h1>
          {hospital?.hospitalHeading && (
            <p style={{ fontSize: '10px', margin: '0 0 2px 0', color: '#333' }}>{hospital.hospitalHeading}</p>
          )}
          <p style={{ fontSize: '10px', margin: '0', color: '#333' }}>
            <strong>Address:</strong> {hospital?.address || 'Hospital Address'}
          </p>
          <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#333' }}>
            <strong>Mobile Number:</strong> {hospital?.mobileNumbers?.join(' | ') || 'Mobile Number'}
          </p>
        </div>
      </div>

      {/* Patient Information - Two Column, No Borders */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ width: '50%', padding: '3px 8px 3px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Patient Name:</strong> {patient.patientName}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 0 3px 8px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Mobile Number:</strong> {patient.mobile}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 8px 3px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Gender:</strong> {patient.gender}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 0 3px 8px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Date of Birth:</strong> {formatDate(patient.dob)} (Age: {ageFromDob(patient.dob)} yrs)
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 8px 3px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Department:</strong> {patient.department}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 0 3px 8px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Doctor:</strong> Dr. {patient.doctorId?.doctorName || patient.doctorId?.username || '-'}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 8px 3px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Appointment Number:</strong> {patient.appointmentNumber || '-'}
            </p>
          </div>
          <div style={{ width: '50%', padding: '3px 0 3px 8px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Registration Date:</strong> {formatRegDate(patient.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Prescription Section (if available) */}
      {prescription && (
        <>
          <hr style={{ margin: '15px 0', border: '1px solid #000' }} />
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0', textDecoration: 'underline' }}>
            PRESCRIPTION
          </h2>

          {/* Diagnosis */}
          {prescription.diagnosisRemark && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 3px 0', fontSize: '11px' }}>Diagnosis / Doctor's Remarks:</p>
              <p style={{ margin: '0', padding: '6px 8px', border: '1px solid #000', minHeight: '25px', fontSize: '11px' }}>
                {prescription.diagnosisRemark}
              </p>
            </div>
          )}

          {/* Medicines Table */}
          {prescription.medicines && prescription.medicines.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 3px 0', fontSize: '11px' }}>Medicines Prescribed:</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'left' }}>Medicine</th>
                    <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'center' }}>Morn</th>
                    <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'center' }}>Aft</th>
                    <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'center' }}>Night</th>
                    <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'left' }}>Duration</th>
                    <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'left' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.medicines.filter((m) => m.medicine).map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '3px 6px', border: '1px solid #000', textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #000' }}>{item.medicine}</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #000', textAlign: 'center' }}>{item.morning ? '✓' : '-'}</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #000', textAlign: 'center' }}>{item.afternoon ? '✓' : '-'}</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #000', textAlign: 'center' }}>{item.night ? '✓' : '-'}</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #000' }}>{item.duration}</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #000' }}>{item.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Symptoms */}
          {prescription.symptoms && prescription.symptoms.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 3px 0', fontSize: '11px' }}>Symptoms:</p>
              <p style={{ margin: '0', padding: '4px 6px', border: '1px solid #000', fontSize: '10px' }}>
                {prescription.symptoms.map((s) => s.symptom).join(', ')}
              </p>
            </div>
          )}

          {/* Follow Up */}
          {prescription.followUpDate && (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 3px 0', fontSize: '11px' }}>Follow-up Date:</p>
              <p style={{ margin: '0', padding: '4px 6px', border: '1px solid #000', fontSize: '10px' }}>
                {formatDate(prescription.followUpDate)}
              </p>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '9px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
        <p style={{ margin: '0' }}>This is a computer-generated document. No signature required.</p>
        <p style={{ margin: '2px 0 0 0' }}>Generated on: {new Date().toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
});

PatientReceipt.displayName = 'PatientReceipt';

export default PatientReceipt;