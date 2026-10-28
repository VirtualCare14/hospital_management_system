const fs = require('fs');
const path = require('path');

// 1. Update frontend/src/index.css
const cssPath = path.resolve(__dirname, '../../frontend/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace @page margin
css = css.replace(
  /@page\s*\{\s*size:\s*A4\s*portrait;\s*margin:\s*0mm\s*!important;\s*\}/,
  '@page {\n    size: A4 portrait;\n    margin: 8mm;\n  }'
);

// Replace html, body width
css = css.replace(
  /html,\s*body\s*\{\s*margin:\s*0\s*!important;\s*padding:\s*0\s*!important;\s*background:\s*#ffffff\s*!important;\s*width:\s*210mm\s*!important;/,
  'html, body {\n    margin: 0 !important;\n    padding: 0 !important;\n    background: #ffffff !important;\n    width: 100% !important;'
);

// Replace .a4-receipt print block
const oldReceiptPrint = /\/\*\s*6\.\s*Position printable receipts flush at top-left across the full 210mm A4 width\s*\*\/[\s\S]*?\.a4-receipt,[\s\S]*?#invoice-print-area,[\s\S]*?\.printable-area,[\s\S]*?#doctor-rx-print-container,[\s\S]*?#ipd-discharge-print-container,[\s\S]*?\.lab-receipt-print-area\s*\{[\s\S]*?width:\s*210mm\s*!important;[\s\S]*?padding:\s*0\s+8mm\s+6mm\s+8mm\s*!important;[\s\S]*?\}/;

const newReceiptPrint = `/* 6. Position printable receipts flush across the full printable width */
  .a4-receipt,
  #invoice-print-area,
  .printable-area,
  #doctor-rx-print-container,
  #ipd-discharge-print-container,
  .lab-receipt-print-area {
    display: block !important;
    visibility: visible !important;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    margin-top: 0 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    box-sizing: border-box !important;
    z-index: 999999 !important;
    page-break-after: auto !important;
    page-break-inside: auto !important;
  }`;

css = css.replace(oldReceiptPrint, newReceiptPrint);

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Successfully updated frontend/src/index.css');

// 2. Update frontend/src/components/PatientReceipt.jsx
const receiptPath = path.resolve(__dirname, '../../frontend/src/components/PatientReceipt.jsx');
let receipt = fs.readFileSync(receiptPath, 'utf8');

// Update renderVitalsTable
const vitalsStart = receipt.indexOf('const renderVitalsTable = (isCompactRightCol = false) => {');
const vitalsEnd = receipt.indexOf('  return (\r\n    <div ref={ref} className="a4-receipt"') !== -1
  ? receipt.indexOf('  return (\r\n    <div ref={ref} className="a4-receipt"')
  : receipt.indexOf('  return (\n    <div ref={ref} className="a4-receipt"');

if (vitalsStart !== -1 && vitalsEnd !== -1) {
  const newVitalsTable = `const renderVitalsTable = (isCompactRightCol = false) => {
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

`;
  receipt = receipt.substring(0, vitalsStart) + newVitalsTable + receipt.substring(vitalsEnd);
  console.log('Successfully updated renderVitalsTable');
} else {
  console.error('ERROR: Could not locate renderVitalsTable bounds:', { vitalsStart, vitalsEnd });
}

// Update prescription layout container and contents
const rxStart = receipt.indexOf('{prescription ? (');
const rxEnd = receipt.indexOf('/* NON-PRESCRIPTION LAYOUT');

if (rxStart !== -1 && rxEnd !== -1) {
  const newRxBlock = `{prescription ? (
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
                    <strong>Gender / Age:</strong> {patient.gender} {patient.dob ? \`(\${ageFromDob(patient.dob)} yrs)\` : ''}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 0 1.5px 6px', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Mobile Number:</strong> {patient.mobile}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 6px 1.5px 0', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Department / Speciality:</strong> {patient.department || '-'}{patient.speciality && !patient.department?.toLowerCase().includes(patient.speciality.toLowerCase()) ? \` - \${patient.speciality}\` : ''}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 0 1.5px 6px', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>{isVisiting ? 'Visiting Specialist:' : 'Doctor Name:'}</strong> {doctorNameStr} {isVisiting ? '(Visiting Specialist)' : ''}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 6px 1.5px 0', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Appointment Date & Time:</strong> {formatDate(patient.appointmentDate)} {patient.slot ? \`(\${patient.slot})\` : ''}
                  </p>
                </div>
                <div style={{ width: '50%', padding: '1.5px 0 1.5px 6px', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.3' }}>
                    <strong>Registration Number:</strong> {patient.registrationNumber || '-'}
                    {patient.appointmentNumber ? \` | Token #\${patient.appointmentNumber}\` : ''}
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
                            {item.duration ? \`\${translateClinicalText(item.duration, activeLang)} days\` : '-'}
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
                      if (s.durationDays) str += \` (\${s.durationDays} \${s.durationUnit || 'Days'})\`;
                      if (printOptions.printSymptomHistory !== false && s.pastHistory) {
                        str += \` [History: \${s.pastHistory}]\`;
                      }
                      if (printOptions.printSymptomRemarks !== false && s.remarks) {
                        str += \` [Remarks: \${s.remarks}]\`;
                      }
                      return <li key={idx} style={{ marginBottom: '1.5px' }}>{str}</li>;
                    })}
                  </ul>
                ) : (
                  <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.38' }}>
                    {prescription.symptoms.map((s) => {
                      let str = translateClinicalText(s.symptom, activeLang);
                      if (s.durationDays) str += \` (\${s.durationDays} \${s.durationUnit || 'Days'})\`;
                      if (printOptions.printSymptomHistory !== false && s.pastHistory) {
                        str += \` [History: \${s.pastHistory}]\`;
                      }
                      if (printOptions.printSymptomRemarks !== false && s.remarks) {
                        str += \` [Remarks: \${s.remarks}]\`;
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
        `;
  receipt = receipt.substring(0, rxStart) + newRxBlock + receipt.substring(rxEnd);
  console.log('Successfully updated two-column prescription block');
} else {
  console.error('ERROR: Could not locate rx bounds:', { rxStart, rxEnd });
}

// Update padding on main receipt container
receipt = receipt.replace(
  /padding: showUploadedLetterhead \? '0 8mm 8mm 8mm' : '5px 8mm 8mm 8mm',/,
  "padding: showUploadedLetterhead ? '0 8mm 8mm 8mm' : '6mm 8mm 8mm 8mm',"
);

// Update title spacing
receipt = receipt.replace(
  /fontSize: '13px',\s*fontWeight: 'bold',\s*margin: '0 0 6px 0',/,
  "fontSize: '14px',\n        fontWeight: 'bold',\n        margin: '0 0 8px 0',"
);

// Update footer margin
receipt = receipt.replace(
  /marginTop: isPatientSlipOnly \? '0' : \(prescription \? '6px' : '20px'\),/,
  "marginTop: isPatientSlipOnly ? '0' : (prescription ? '12px' : '20px'),"
);

fs.writeFileSync(receiptPath, receipt, 'utf8');
console.log('Successfully saved frontend/src/components/PatientReceipt.jsx');

