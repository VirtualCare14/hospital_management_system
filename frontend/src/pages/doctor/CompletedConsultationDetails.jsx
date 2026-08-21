import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Printer, X, Plus, Clock, Globe } from 'lucide-react';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PatientReceipt from '../../components/PatientReceipt';
import PrintLanguageModal from '../../components/PrintLanguageModal';
import { sanitizeClonedDocumentForPdf, openPdfPrintWindow } from '../../utils/pdfUtils';

const ageFromDob = (dob) => {
  if (!dob) return '-';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const CompletedConsultationDetails = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const receiptRef = useRef(null);
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Print Language Modal state
  const [showLangModal, setShowLangModal] = useState(false);
  const [targetRxForPrint, setTargetRxForPrint] = useState(null);
  const [activePrintLang, setActivePrintLang] = useState('English');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const { data } = await client.get(`/consultation/completed/${consultationId}`);
        setConsultation(data.consultation);
        setPatient(data.patient);
        setPrescription(data.prescription);
        setAllPrescriptions(data.allPrescriptions || (data.prescription ? [data.prescription] : []));
      } catch (error) {
        console.error('Error fetching consultation details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [consultationId]);

  const handleOpenPrintModal = (rxObj) => {
    const rxToPrint = rxObj || prescription;
    if (!rxToPrint) {
      toast.error('No prescription found to print');
      return;
    }
    setTargetRxForPrint(rxToPrint);
    setShowLangModal(true);
  };

  const handleConfirmPrintWithLanguage = async (chosenLang) => {
    setActivePrintLang(chosenLang);
    
    setTimeout(async () => {
      if (!receiptRef.current) {
        toast.error('Printable content is not available');
        return;
      }
      
      const toastId = toast.loading(`Generating PDF (${chosenLang})...`);
      try {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          imageTimeout: 20000,
          onclone: (clonedDoc) => sanitizeClonedDocumentForPdf(clonedDoc)
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        
        const padding = 5;
        pdf.addImage(imgData, 'PNG', padding, padding, width - (padding * 2), height);
        
        pdf.autoPrint();
        openPdfPrintWindow(pdf, 'Prescription / Consultation Receipt');
        toast.dismiss(toastId);
        toast.success(`Prescription Printed in ${chosenLang}!`);
      } catch (error) {
        console.error('Prescription print error:', error);
        toast.dismiss(toastId);
        toast.error('Error generating print view');
      }
    }, 300);
  };

  if (loading) {
    return <div className="card p-5">Loading consultation details...</div>;
  }

  if (!consultation || !patient) {
    return (
      <div className="card p-5">
        <p className="text-gray-500">Consultation not found</p>
      </div>
    );
  }

  const activeRx = targetRxForPrint || prescription;
  const receiptPrescription = activeRx ? {
    ...activeRx,
    diagnosisRemark: consultation.diagnosisRemark,
    symptoms: consultation.symptoms,
    followUpDate: consultation.followUpDate,
    language: activePrintLang || activeRx.language || 'English'
  } : null;

  return (
    <div className="space-y-5">
      {/* Language Selection Modal */}
      <PrintLanguageModal
        isOpen={showLangModal}
        onClose={() => setShowLangModal(false)}
        onConfirm={handleConfirmPrintWithLanguage}
        initialLanguage={targetRxForPrint?.language || 'English'}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/doctor/completed"
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg ring-1 ring-red-700/20"
          >
            <X className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Consultation Details</h1>
            <p className="text-sm text-gray-500">Completed on {formatDate(consultation.consultationCompletedDate || consultation.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {prescription && (
            <button 
              onClick={() => handleOpenPrintModal(prescription)} 
              className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="h-4 w-4" /> Print Prescription
            </button>
          )}
          <Link to={`/doctor/prescription/${patient._id}?addMore=true`} className="btn bg-green-600 hover:bg-green-700 text-white font-bold text-sm inline-flex items-center gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" /> Add Prescription
          </Link>
        </div>
      </div>

      {/* Patient Information Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="font-bold text-gray-800">Patient Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">UHID</p>
              <p className="text-sm font-bold text-orange-700">{patient.uhid}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Patient Name</p>
              <p className="text-sm font-semibold">{patient.patientName}</p>
            </div>
            {consultation?.visitId?.createdBy && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Registered By</p>
                <p className="text-sm font-bold text-orange-700 capitalize">
                  {consultation.visitId.createdBy.doctorName || consultation.visitId.createdBy.username}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Age</p>
                <p className="text-sm font-semibold">{ageFromDob(patient.dob)} years</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Gender</p>
                <p className="text-sm font-semibold">{patient.gender}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Mobile</p>
              <p className="text-sm font-semibold">{patient.mobile}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Department</p>
              <p className="text-sm font-semibold">{patient.department}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Appointment</p>
              <p className="text-sm font-semibold">{formatDate(patient.appointmentDate)} {patient.slot}</p>
            </div>
          </div>
        </div>

        {/* Consultation Details Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="font-bold text-gray-800">Consultation Details</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Consultation Date</p>
              <p className="text-sm font-semibold">{formatDate(consultation.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Completed Date</p>
              <p className="text-sm font-semibold text-green-600">
                {formatDate(consultation.consultationCompletedDate || consultation.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
              <p className="text-sm font-semibold">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                  ✓ Completed
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Follow-up Date</p>
              <p className="text-sm font-semibold">{consultation.followUpDate ? formatDate(consultation.followUpDate) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Symptoms Card */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-4">Symptoms</h2>
        <div className="space-y-3">
          {consultation.symptoms && consultation.symptoms.length > 0 ? (
            consultation.symptoms.map((symptom, index) => (
              <div key={index} className="border-l-4 border-orange-300 pl-4 py-2">
                <p className="font-semibold text-gray-800">{symptom.symptom}</p>
                <div className="grid grid-cols-2 gap-4 mt-1 text-sm text-gray-600">
                  {symptom.durationDays && (
                    <p><span className="font-semibold">Duration:</span> {symptom.durationDays} {symptom.durationUnit}</p>
                  )}
                </div>
                {symptom.pastHistory && (
                  <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Past History:</span> {symptom.pastHistory}</p>
                )}
                {symptom.remarks && (
                  <p className="text-sm text-gray-600"><span className="font-semibold">Remarks:</span> {symptom.remarks}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No symptoms recorded</p>
          )}
        </div>
      </div>

      {/* Diagnosis Card */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-4">Diagnosis & Remarks</h2>
        <p className="text-gray-700">{consultation.diagnosisRemark || '-'}</p>
      </div>

      {/* Vitals Card */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-4">Vitals</h2>
        <div className="grid gap-4 md:grid-cols-6">
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">Weight</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.weight || '-'} kg</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">Height</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.height || '-'} cm</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">Temperature</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.temperature || '-'} °C</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">Blood Pressure</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.bloodPressure || '-'}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">BMI</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.bmi || '-'}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">Drug Allergy</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.drugAllergy || '-'}</p>
          </div>
        </div>
      </div>

      {/* DATE-WISE PRESCRIPTIONS LIST */}
      {allPrescriptions && allPrescriptions.length > 0 ? (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Prescriptions Date-Wise ({allPrescriptions.length} record{allPrescriptions.length > 1 ? 's' : ''})
              </h2>
              <p className="text-xs text-gray-500">Each prescription recorded for this patient chronologically by date & time</p>
            </div>
            <Link to={`/doctor/prescription/${patient._id}?addMore=true`} className="btn bg-green-600 hover:bg-green-700 text-white font-bold text-xs inline-flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add New Prescription
            </Link>
          </div>

          <div className="space-y-4">
            {allPrescriptions.map((rx, rxIndex) => {
              const rxDateObj = new Date(rx.prescriptionDateTime || rx.createdAt);
              const formattedDateStr = `${formatDate(rxDateObj)} ${rxDateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

              return (
                <div key={rx._id || rxIndex} className="p-4 bg-orange-50/40 border border-orange-200/80 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-100 pb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">
                        {allPrescriptions.length - rxIndex}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 text-sm">{formattedDateStr}</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                            {rx.language || 'English'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Prescribed by: <strong className="text-gray-800">Dr. {rx.doctorId?.doctorName || rx.doctorId?.username || 'Doctor'}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPrintModal(rx)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Prescription</span>
                    </button>
                  </div>

                  {/* Medicines Table */}
                  <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-orange-100/70 text-orange-950 font-bold uppercase">
                        <tr>
                          <th className="p-2.5">Medicine</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5 text-center">Morning</th>
                          <th className="p-2.5 text-center">Afternoon</th>
                          <th className="p-2.5 text-center">Night</th>
                          <th className="p-2.5">Instructions & Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-50 font-medium text-gray-800">
                        {rx.medicines && rx.medicines.length > 0 ? (
                          rx.medicines.map((med, mIdx) => (
                            <tr key={mIdx}>
                              <td className="p-2.5 font-bold text-gray-900">{med.medicine}</td>
                              <td className="p-2.5">{med.duration} days</td>
                              <td className="p-2.5 text-center">{med.morning ? '✓' : '-'}</td>
                              <td className="p-2.5 text-center">{med.afternoon ? '✓' : '-'}</td>
                              <td className="p-2.5 text-center">{med.night ? '✓' : '-'}</td>
                              <td className="p-2.5 text-gray-600">{med.remarks || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="p-3 text-center text-gray-400">No medicines listed in this prescription</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Tests Card */}
      {consultation.tests && consultation.tests.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Recommended Tests</h2>
          <div className="flex flex-wrap gap-2">
            {consultation.tests.map((test, index) => (
              <span key={index} className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {test}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hidden receipt for printing */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        <PatientReceipt 
          ref={receiptRef} 
          patient={patient} 
          prescription={receiptPrescription}
        />
      </div>
    </div>
  );
};

export default CompletedConsultationDetails;

