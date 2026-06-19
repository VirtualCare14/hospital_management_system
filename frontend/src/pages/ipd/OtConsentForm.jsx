import { useRef, useState } from 'react';
import { formatDate } from '../../utils/dateFormat';

const OtConsentForm = ({ patient, otRecord, hospitalInfo, user, onClose, onConsentPrinted }) => {
  const printRef = useRef();
  const [patientName, setPatientName] = useState(otRecord?.patientName || patient?.patientName || '');
  const [age, setAge] = useState(otRecord?.age || '');
  const [gender, setGender] = useState(otRecord?.gender || patient?.gender || '');
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState(patient?.address || '');
  const [telephone, setTelephone] = useState(patient?.mobile || '');
  const [doctorName, setDoctorName] = useState(otRecord?.surgeon || otRecord?.consultantDoctor || '');
  const [surgicalProcedure, setSurgicalProcedure] = useState(otRecord?.proceduresPerformed || '');
  const [highRiskPoints, setHighRiskPoints] = useState('');
  const [patientSignature, setPatientSignature] = useState('');
  const [guardianSignature, setGuardianSignature] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));

  const handlePrint = () => {
    if (typeof onConsentPrinted === 'function') {
      onConsentPrinted({
        patientName, age, gender, fatherName, address, telephone,
        doctorName, surgicalProcedure, highRiskPoints,
        patientSignature, guardianSignature, witnessName,
        printedAt: new Date()
      });
    }
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <>
      <style>{`
        @media print {
          body { background: white; font-size: 12pt; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          @page { margin: 15mm; size: A4; }
          .consent-page { page-break-after: avoid; }
        }
        .consent-page {
          font-family: Arial, 'Times New Roman', serif;
          line-height: 1.6;
          color: #000;
        }
        .consent-page h1 {
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          text-decoration: underline;
          margin-bottom: 16px;
        }
        .consent-page .field-line {
          border-bottom: 1px solid #000;
          min-width: 200px;
          display: inline-block;
          padding: 0 8px;
        }
        .consent-page .print-input {
          border: none;
          border-bottom: 1px solid #000;
          background: transparent;
          font-family: inherit;
          font-size: 12pt;
          padding: 2px 8px;
          min-width: 180px;
        }
        .consent-page .print-input:focus {
          outline: none;
          border-bottom: 2px solid #f97316;
        }
        .consent-page .print-textarea {
          border: 1px solid #000;
          background: transparent;
          font-family: inherit;
          font-size: 12pt;
          padding: 4px 8px;
          width: 100%;
          min-height: 60px;
          resize: vertical;
        }
        .consent-page .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin-top: 40px;
          padding-top: 4px;
          font-size: 10pt;
          text-align: center;
        }
      `}</style>

      <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 no-print">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 p-4 flex items-center justify-between z-10 no-print">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Consent Form</h2>
              <p className="text-sm text-gray-600">
                Surgery / Medical Treatment / Anaesthesia
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="btn text-sm py-2 px-4">
                Print Consent Form
              </button>
              <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">
                Close
              </button>
            </div>
          </div>

          {/* Consent Form Content */}
          <div className="p-6">
            <div ref={printRef} className="consent-page">
              <div className="border-2 border-gray-900 p-6" style={{ minHeight: '250mm' }}>
                <h1>INFORMED CONSENT</h1>
                <h1 style={{ fontSize: '13pt', marginTop: '-8px' }}>
                  FOR SURGERY, MEDICAL TREATMENT AND ANAESTHESIA
                </h1>

                {/* Patient Details Section */}
                <div style={{ marginTop: '20px' }}>
                  <p>
                    Name of patient{' '}
                    <input type="text" className="print-input" value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      style={{ minWidth: '250px' }} />{' '}
                    Age{' '}
                    <input type="text" className="print-input" value={age}
                      onChange={(e) => setAge(e.target.value)}
                      style={{ width: '60px' }} />{' '}
                    Sex{' '}
                    <select className="print-input" value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      style={{ width: '80px' }}>
                      <option value="">--</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </p>
                  <p style={{ marginTop: '10px' }}>
                    Father's / Husband's name{' '}
                    <input type="text" className="print-input" value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      style={{ minWidth: '300px' }} />
                  </p>
                  <p style={{ marginTop: '10px' }}>
                    Complete postal address{' '}
                    <input type="text" className="print-input" value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{ minWidth: '400px' }} />
                  </p>
                  <p style={{ marginTop: '10px' }}>
                    Telephone nos.{' '}
                    <input type="text" className="print-input" value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      style={{ minWidth: '250px' }} />
                  </p>
                </div>

                {/* Consent Clauses */}
                <div style={{ marginTop: '24px', fontSize: '11pt' }}>

                  <p style={{ marginTop: '12px' }}>
                    <strong>1.</strong> We [patient and the patient party and relatives] have come to{' '}
                    <input type="text" className="print-input" placeholder="Hospital Name"
                      value={hospitalInfo?.hospitalName || ''}
                      onChange={() => {}}
                      style={{ minWidth: '250px' }} />{' '}
                    on our own will. We are fully aware that all the relevant facilities for the treatment are available over here.
                  </p>

                  <p style={{ marginTop: '12px' }}>
                    <strong>2.</strong> By signing on this informed consent form we hereby authorize Dr.{' '}
                    <input type="text" className="print-input" value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      style={{ minWidth: '250px' }} />{' '}
                    and his team to operate upon Mr. / Mrs.{' '}
                    <input type="text" className="print-input" value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      style={{ minWidth: '250px' }} />{' '}
                    the following surgical procedure:
                  </p>

                  <div style={{ marginTop: '8px', marginLeft: '40px' }}>
                    <textarea className="print-textarea" value={surgicalProcedure}
                      onChange={(e) => setSurgicalProcedure(e.target.value)}
                      placeholder="Enter surgical procedure..." />
                  </div>

                  <p style={{ marginTop: '12px' }}>
                    I / we have been explained the name of the surgery, why it is being done and what is the indication
                    of the surgery, the amount of the risk involved in it, the possibility of deterioration of the
                    condition of the patient have been explained to me / us which we fully understand and are ready
                    to go ahead with it.
                  </p>

                  <p style={{ marginTop: '12px' }}>
                    <strong>3.</strong> I hereby authorize the doctor and his team to use any appropriate technique of
                    anesthesia as they deem proper in my case.
                  </p>

                  <p style={{ marginTop: '12px' }}>
                    <strong>4.</strong> I hereby authorize the doctor to use the medications during the surgery,
                    transfuse blood [if need be]. We fully understand that if at all blood transfusion is required
                    it is our duty and responsibility to arrange the blood.
                  </p>

                  <p style={{ marginTop: '12px' }}>
                    <strong>5.</strong> We have been fully given to understand that sometimes during the surgery,
                    emergency can arise because of which extra surgery and medical treatment which is more and besides
                    the planned surgery has to be carried out. In certain cases of laparoscopic surgery at times open
                    surgery has to be carried out in view of unforeseen surgical circumstances. In such an eventuality
                    the expenditure also goes beyond the planned expenditures. I am ready for this extra risk and extra
                    expenditure [if at all required]. In cases of laparoscopic surgery, for some reason if the hospital
                    stay crosses two days, the expenditure goes beyond the planned expenditure for which I am / we are ready.
                  </p>

                  <p style={{ marginTop: '12px' }}>
                    <strong>6.</strong> I have been explained the high risk in my case because of following points:
                  </p>

                  <div style={{ marginTop: '8px', marginLeft: '40px' }}>
                    <textarea className="print-textarea" value={highRiskPoints}
                      onChange={(e) => setHighRiskPoints(e.target.value)}
                      placeholder="Enter high risk points..." />
                  </div>

                  <p style={{ marginTop: '12px' }}>
                    <strong>7.</strong> No promises have been made to me or any guarantees given to me by the doctors
                    or the hospital.
                  </p>

                  <p style={{ marginTop: '12px' }}>
                    <strong>8.</strong> I hereby solemnly affirm that I / we have fully gone through this consent form,
                    understood it in letter and spirit. Before I signed all the vacant spaces and non essential points
                    have been cut.
                  </p>
                </div>

                {/* Signature Section */}
                <div style={{ marginTop: '32px' }}>
                  <p style={{ fontStyle: 'italic', fontSize: '10pt' }}>
                    Signed after reading
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                    <div>
                      <p><strong>Patient's signature</strong></p>
                      <div className="signature-line">{patientSignature}</div>
                    </div>
                    <div>
                      <p><strong>Patient's thumb impression</strong></p>
                      <div className="signature-line" style={{ width: '120px' }}></div>
                    </div>
                  </div>

                  <p style={{ marginTop: '24px' }}>
                    Father's / Husband's signature{' '}
                    <input type="text" className="print-input" value={guardianSignature}
                      onChange={(e) => setGuardianSignature(e.target.value)}
                      style={{ minWidth: '300px' }} />
                  </p>

                  <p style={{ marginTop: '12px' }}>
                    Doctor's signature{' '}
                    <span className="field-line" style={{ width: '300px' }}>
                      {user?.doctorName || user?.username || ''}
                    </span>
                  </p>

                  <p style={{ marginTop: '16px' }}>
                    <strong>
                      In case patient is a minor or mentally compromised, guardian's signature
                    </strong>
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                    <div>
                      Witness{' '}
                      <input type="text" className="print-input" value={witnessName}
                        onChange={(e) => setWitnessName(e.target.value)}
                        style={{ minWidth: '200px' }} />
                    </div>
                    <div>
                      Date and time{' '}
                      <span className="field-line" style={{ width: '200px' }}>
                        {currentDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OtConsentForm;