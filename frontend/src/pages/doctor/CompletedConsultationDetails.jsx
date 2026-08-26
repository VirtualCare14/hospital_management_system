import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Printer, X, Plus, Clock, Globe, FlaskConical, Eye, CheckCircle2, AlertCircle, Sparkles, Building2, Check, Download, ShieldCheck, Microscope } from 'lucide-react';
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
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lab Report Modal state
  const [selectedReportForView, setSelectedReportForView] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const reportPrintRef = useRef(null);

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
        setLabRequests(data.labRequests || []);
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

  const handleOpenLabReport = (labReq) => {
    setSelectedReportForView(labReq);
    setShowReportModal(true);
  };

  const handlePrintLabReport = async () => {
    if (!reportPrintRef.current) {
      toast.error('Lab report content not available for printing');
      return;
    }
    const toastId = toast.loading('Generating Lab Report PDF...');
    try {
      const canvas = await html2canvas(reportPrintRef.current, {
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
      openPdfPrintWindow(pdf, `Lab_Report_${selectedReportForView?.labId || 'Document'}`);
      toast.dismiss(toastId);
      toast.success('Lab Report opened for printing!');
    } catch (err) {
      console.error('Lab report print error:', err);
      toast.dismiss(toastId);
      toast.error('Error generating print view');
    }
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

      {/* LAB INVESTIGATIONS & DIAGNOSTIC REPORTS SECTION */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-orange-600" />
              Laboratory Investigations & Reports ({labRequests.length})
            </h2>
            <p className="text-xs text-gray-500">
              Lab diagnostic orders, specimen collection status, and finalized laboratory reports
            </p>
          </div>
        </div>

        {labRequests.length > 0 ? (
          <div className="space-y-3">
            {labRequests.map((reqItem, rIdx) => {
              const isFinal = reqItem.reportStatus === 'Ready' || 
                reqItem.reportStatus === 'Completed' || 
                reqItem.reportStatus === 'Signed off' || 
                reqItem.status === 'report_ready' || 
                reqItem.status === 'completed' || 
                (reqItem.report?.parameters && reqItem.report.parameters.length > 0);

              const reqDate = reqItem.createdAt ? new Date(reqItem.createdAt) : new Date();

              return (
                <div key={reqItem._id || rIdx} className="p-4 bg-white border border-orange-200/80 rounded-2xl shadow-xs hover:border-orange-300 transition duration-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isFinal ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        <FlaskConical className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-sm tracking-tight">
                            {reqItem.labId || `LAB-${String(reqItem._id).substring(18).toUpperCase()}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            • {formatDate(reqDate)} {reqDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Collection: <strong className="text-gray-700">{reqItem.collectionType || 'Lab Visit'}</strong> ({reqItem.sampleStatus || 'Sample Pending'})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center">
                      {isFinal ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Report Final
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenLabReport(reqItem)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shadow-orange-500/20 active:scale-[0.98] transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Lab Report</span>
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                          <Clock className="h-3.5 w-3.5 text-amber-600 animate-spin" />
                          {reqItem.reportStatus || 'Testing In Progress'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tests tags */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500 mr-1 uppercase">Tests:</span>
                    {(reqItem.tests || []).map((tName, tIdx) => (
                      <span key={tIdx} className="px-2.5 py-0.5 bg-orange-50 text-orange-800 border border-orange-200/70 rounded-md text-xs font-semibold">
                        {tName}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-orange-50/30 rounded-2xl border border-dashed border-orange-200 text-center space-y-2">
            <Microscope className="h-8 w-8 text-orange-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">No laboratory test orders recorded yet</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Any diagnostic tests ordered by the doctor or created directly at the lab portal will appear here once processed.
            </p>
          </div>
        )}
      </div>

      {/* Tests Card (Recommended during consultation) */}
      {consultation.tests && consultation.tests.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-3">Consultation Prescribed Tests</h2>
          <div className="flex flex-wrap gap-2">
            {consultation.tests.map((test, index) => (
              <span key={index} className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {test}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* LAB REPORT DETAILS MODAL */}
      {showReportModal && selectedReportForView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-orange-100 overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <FlaskConical className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Laboratory Diagnostic Report</h3>
                  <p className="text-xs text-orange-100 font-medium">
                    Lab ID: <span className="font-bold text-white">{selectedReportForView.labId || 'N/A'}</span> • {selectedReportForView.reportStatus || 'Completed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintLabReport}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Report Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6" ref={reportPrintRef}>
              {/* Patient & Report Meta Header */}
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-[10px]">Patient UHID</span>
                  <span className="font-extrabold text-orange-700 text-sm">{patient.uhid}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-[10px]">Patient Name</span>
                  <span className="font-bold text-gray-900 text-sm">{patient.patientName}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-[10px]">Age / Gender</span>
                  <span className="font-semibold text-gray-800">{ageFromDob(patient.dob)} YRS / {patient.gender || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-[10px]">Referred By / Doctor</span>
                  <span className="font-semibold text-gray-800">Dr. {selectedReportForView.doctorId?.doctorName || selectedReportForView.doctorId?.username || user?.doctorName || 'Doctor'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-[10px]">Booking Date</span>
                  <span className="font-medium text-gray-700">{formatDate(selectedReportForView.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-[10px]">Sample Specimen</span>
                  <span className="font-medium text-gray-700">{selectedReportForView.collectionType || 'Blood Serum'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-[10px]">Collection Status</span>
                  <span className="font-bold text-emerald-700">{selectedReportForView.sampleStatus || 'Collected'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-[10px]">Reported Date</span>
                  <span className="font-bold text-purple-700">{formatDate(selectedReportForView.report?.generatedAt || selectedReportForView.updatedAt || new Date())}</span>
                </div>
              </div>

              {/* Parameter Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  Investigation Findings & Parameter Results
                </h4>
                
                <div className="overflow-x-auto rounded-xl border border-orange-200/80 bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-orange-100/70 text-orange-950 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Test Parameter</th>
                        <th className="p-3">Result Value</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Reference Range</th>
                        <th className="p-3">Interpretation / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50 font-medium text-gray-800">
                      {selectedReportForView.report?.parameters && selectedReportForView.report.parameters.length > 0 ? (
                        selectedReportForView.report.parameters.map((param, pIdx) => {
                          const isAbnormal = param.isAbnormal || param.valueOptions?.some(v => v.value === param.value && v.isAbnormal);

                          return (
                            <tr key={pIdx} className={isAbnormal ? 'bg-amber-50/50' : 'hover:bg-orange-50/20'}>
                              <td className="p-3 font-bold text-gray-900">
                                {param.displayName || param.name || `Parameter ${pIdx + 1}`}
                              </td>
                              <td className="p-3">
                                <span className={`font-black text-sm ${isAbnormal ? 'text-amber-700 underline decoration-amber-500' : 'text-gray-900'}`}>
                                  {param.value || '—'}
                                </span>
                              </td>
                              <td className="p-3 text-gray-600">{param.unit || '—'}</td>
                              <td className="p-3 text-gray-600 font-mono text-[11px]">{param.referenceRange || '—'}</td>
                              <td className="p-3">
                                {isAbnormal ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                    Out of range
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                                    Normal
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-500">
                            Tests reported: <strong>{(selectedReportForView.tests || []).join(', ') || 'Standard Lab Panel'}</strong>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interpretation / Clinical Notes */}
              {(selectedReportForView.report?.interpretation || selectedReportForView.report?.notes || selectedReportForView.remarks) && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-1.5">
                  <span className="font-bold text-gray-800 uppercase text-[11px] block">
                    Clinical Notes & Diagnostic Interpretation:
                  </span>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {selectedReportForView.report?.interpretation || selectedReportForView.report?.notes || selectedReportForView.remarks}
                  </p>
                </div>
              )}

              {/* Verification & Signatory Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Report verified by Diagnostic Pathology Department</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-800 block">
                    {selectedReportForView.report?.signatoryId?.name || 'Authorized Lab Signatory'}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {selectedReportForView.report?.signatoryId?.designation || 'Consultant Pathologist'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Medora 360 Laboratory Information System</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintLabReport}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
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

