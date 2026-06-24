import { useEffect, useState, forwardRef } from 'react';
import client from '../api/client';
import { formatDate, formatDateShort } from '../utils/dateFormat';
import { t } from '../utils/prescriptionI18n';

const PatientReceipt = forwardRef(({ patient, prescription, hospitalSettings, language }, ref) => {
  const activeLang = language || 'English';
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

  // Get the current timestamp for the document
  const now = new Date();
  const documentDateTime = now.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div ref={ref} className="a4-receipt" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '15mm 18mm',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '11px',
      lineHeight: '1.5'
    }}>
      {/* Hospital Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        paddingBottom: '15px',
        borderBottom: '2px solid #000',
        marginBottom: '18px'
      }}>
        {hospital?.logoUrl && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={hospital.logoUrl}
              alt="Hospital Logo"
              style={{ maxHeight: '70px', maxWidth: '70px' }}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {hospital?.hospitalName || 'Hospital Name'}
          </h1>
          {hospital?.hospitalHeading && (
            <p style={{ fontSize: '10px', margin: '0 0 3px 0', color: '#444' }}>{hospital.hospitalHeading}</p>
          )}
          <p style={{ fontSize: '10px', margin: '0', color: '#444' }}>
            <strong>Address:</strong> {hospital?.address || 'Hospital Address'}
          </p>
          <p style={{ fontSize: '10px', margin: '3px 0 0 0', color: '#444' }}>
            <strong>Mobile Number:</strong> {hospital?.mobileNumbers?.join(' | ') || 'Mobile Number'}
          </p>
        </div>
      </div>

      {/* Document Title */}
      <h2 style={{ 
        fontSize: '16px', 
        fontWeight: 'bold', 
        margin: '0 0 15px 0', 
        textAlign: 'center',
        textDecoration: 'underline',
        letterSpacing: '2px'
      }}>
        {t(activeLang, 'prescription')}
      </h2>

      {/* Patient Information */}
      <div style={{ marginBottom: '18px', padding: '10px', border: '1px solid #000', borderRadius: '2px' }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 8px 0', fontSize: '12px', textDecoration: 'underline' }}>
          {t(activeLang, 'patientInfo')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ width: '50%', padding: '4px 10px 4px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>{t(activeLang, 'patientInfo')}:</strong> {patient.patientName}
            </p>
          </div>
          <div style={{ width: '50%', padding: '4px 0 4px 10px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>UHID:</strong> {patient.uhid}
            </p>
          </div>
          <div style={{ width: '50%', padding: '4px 10px 4px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Gender:</strong> {patient.gender}
            </p>
          </div>
          <div style={{ width: '50%', padding: '4px 0 4px 10px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Mobile:</strong> {patient.mobile}
            </p>
          </div>
          <div style={{ width: '50%', padding: '4px 10px 4px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Date of Birth:</strong> {formatDate(patient.dob)} (Age: {ageFromDob(patient.dob)} yrs)
            </p>
          </div>
          <div style={{ width: '50%', padding: '4px 0 4px 10px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Department:</strong> {patient.department || '-'}
            </p>
          </div>
          <div style={{ width: '50%', padding: '4px 10px 4px 0', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Doctor:</strong> Dr. {patient.doctorId?.doctorName || patient.doctorId?.username || '-'}
            </p>
          </div>
          <div style={{ width: '50%', padding: '4px 0 4px 10px', boxSizing: 'border-box' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>
              <strong>Appointment Date:</strong> {formatDate(patient.appointmentDate)} {patient.slot || ''}
            </p>
          </div>
        </div>
      </div>

      {/* Prescription Section */}
      {prescription && (
        <>
          <hr style={{ margin: '18px 0', border: '1px solid #000' }} />
          
          {/* Diagnosis */}
          {prescription.diagnosisRemark && (
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '12px', textDecoration: 'underline' }}>
                {t(activeLang, 'diagnosis')}:
              </p>
              <p style={{ 
                margin: '0', 
                padding: '8px 10px', 
                border: '1px solid #000', 
                minHeight: '30px', 
                fontSize: '11px',
                lineHeight: '1.5'
              }}>
                {prescription.diagnosisRemark}
              </p>
            </div>
          )}

          {/* Medicines Table */}
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
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left', fontWeight: 'bold' }}>#</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left', fontWeight: 'bold' }}>{t(activeLang, 'medicine')}</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>{t(activeLang, 'morning')}</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>{t(activeLang, 'afternoon')}</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>{t(activeLang, 'night')}</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left', fontWeight: 'bold' }}>{t(activeLang, 'duration')}</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left', fontWeight: 'bold' }}>{t(activeLang, 'remarks')}</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.medicines.filter((m) => m.medicine).map((item, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f7f7f7' }}>
                      <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle' }}>{index + 1}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #000', verticalAlign: 'middle', fontWeight: '500' }}>{item.medicine}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle' }}>{item.morning ? '✓' : '-'}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle' }}>{item.afternoon ? '✓' : '-'}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #000', textAlign: 'center', verticalAlign: 'middle' }}>{item.night ? '✓' : '-'}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{item.duration}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{item.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Symptoms */}
          {prescription.symptoms && prescription.symptoms.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px' }}>{t(activeLang, 'symptoms')}:</p>
              <p style={{ 
                margin: '0', 
                padding: '6px 8px', 
                border: '1px solid #000', 
                fontSize: '10px',
                lineHeight: '1.5'
              }}>
                {prescription.symptoms.map((s) => s.symptom).join(', ')}
              </p>
            </div>
          )}

          {/* Follow Up */}
          {prescription.followUpDate && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px' }}>{t(activeLang, 'followUp')}:</p>
              <p style={{ 
                margin: '0', 
                padding: '6px 8px', 
                border: '1px solid #000', 
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
        marginTop: '30px', 
        textAlign: 'center', 
        fontSize: '9px', 
        color: '#666', 
        borderTop: '1px solid #ccc', 
        paddingTop: '10px' 
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