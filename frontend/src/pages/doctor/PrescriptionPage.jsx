import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Plus, Save, Printer, Download, Trash2, ShieldAlert, FileText, Eye, Check,
  History, ChevronDown, ChevronUp, Copy, Stethoscope, Pill, Calendar, Clock, ArrowRight, Activity
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { languages } from '../../utils/options';
import { formatDate } from '../../utils/dateFormat';
import { sanitizePatientName, formatUhid } from '../../utils/uhid';
import { sanitizeClonedDocumentForPdf } from '../../utils/pdfUtils';
import { translateClinicalText } from '../../utils/prescriptionI18n';
import PatientReceipt from '../../components/PatientReceipt';
import PrintLanguageModal from '../../components/PrintLanguageModal';

const calculateQty = (med) => {
  const m = med.morning ? 1 : 0;
  const a = med.afternoon ? 1 : 0;
  const n = med.night ? 1 : 0;
  const perDay = (m + a + n) * (parseFloat(med.dose) || 1);
  const dur = parseInt(med.duration) || 0;
  return Math.ceil(perDay * dur);
};

const PrescriptionPage = () => {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const addMoreMode = searchParams.get('addMore') === 'true';
  const navigate = useNavigate();
  const { user } = useAuth();
  const receiptRef = useRef(null);

  const [patient, setPatient] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [previousPrescription, setPreviousPrescription] = useState(null);
  const [allConsultations, setAllConsultations] = useState([]);
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('English');
  const [printOptions, setPrintOptions] = useState(() => {
    const saved = localStorage.getItem('doctor_print_options');
    return saved ? JSON.parse(saved) : {
      printVitals: true,
      printLabTests: true,
      printSymptomHistory: true,
      printSymptomRemarks: true,
      printGeneralPastHistory: true,
      printDiagnosisRemarks: true,
      printPatientAdvice: true,
      printPreviousHistory: false
    };
  });

  const [medicines, setMedicines] = useState([
    { medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food', qty: 0 }
  ]);

  const [pharmacyMedicines, setPharmacyMedicines] = useState([]);
  const [activeMedIndex, setActiveMedIndex] = useState(null);
  const [medSuggestions, setMedSuggestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // 1. Fetch Pharmacy Inventory Medicines
  useEffect(() => {
    const fetchPharmacyMedicines = async () => {
      try {
        const { data } = await client.get('/pharmacy/inventory?limit=5000');
        const items = data.items || [];
        const medicineStockMap = {};
        items.forEach(item => {
          const name = String(item.itemName || '').trim();
          const qty = parseInt(item.quantity) || 0;
          if (name) {
            medicineStockMap[name] = (medicineStockMap[name] || 0) + qty;
          }
        });
        const groupedArray = Object.keys(medicineStockMap).map(name => ({
          name,
          stock: medicineStockMap[name]
        }));
        setPharmacyMedicines(groupedArray);
      } catch (err) {
        console.error("Failed to load pharmacy medicines", err);
      }
    };
    fetchPharmacyMedicines();
  }, []);

  // 2. Load Patient, Consultation, Prescriptions, and Full Clinical History
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [patientRes, consultationRes, prescriptionRes, historyRes] = await Promise.allSettled([
          client.get(`/patients/${patientId}`),
          client.get(`/consultation/${patientId}`),
          client.get(`/prescription/${patientId}`),
          client.get(`/consultation/patient/${patientId}/all`)
        ]);

        if (patientRes.status === 'fulfilled') {
          setPatient(patientRes.value.data);
        }

        if (consultationRes.status === 'fulfilled' && consultationRes.value.data?.length > 0) {
          const latestCons = consultationRes.value.data[0];
          setConsultation(latestCons);
        }

        if (prescriptionRes.status === 'fulfilled' && prescriptionRes.value.data) {
          const rawRx = prescriptionRes.value.data;
          const rxList = Array.isArray(rawRx) ? rawRx : (rawRx ? [rawRx] : []);
          setAllPrescriptions(rxList);

          const prevRx = rxList.find(p => Array.isArray(p.medicines) && p.medicines.length > 0) || rxList[0] || null;
          setPreviousPrescription(prevRx);

          if (addMoreMode && prevRx && prevRx.medicines && prevRx.medicines.length > 0) {
            const formatted = prevRx.medicines.map(m => ({
              medicine: m.medicine || '',
              dosageForm: m.dosageForm || 'Tablet',
              strength: m.strength || '',
              dose: m.dose || '1',
              morning: m.morning !== undefined ? m.morning : true,
              afternoon: m.afternoon !== undefined ? m.afternoon : false,
              night: m.night !== undefined ? m.night : true,
              duration: String(m.duration || '5'),
              remarks: m.remarks || 'After food',
              qty: m.qty || 0
            }));
            setMedicines(formatted);
          }
        }

        if (historyRes.status === 'fulfilled' && historyRes.value.data) {
          setAllConsultations(historyRes.value.data.consultations || []);
          setAllPrescriptions(historyRes.value.data.prescriptions || []);
        }
      } catch (err) {
        console.error('Error loading prescription page data:', err);
        toast.error('Failed to load patient or prescription data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patientId, addMoreMode]);

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);

    if (field === 'medicine') {
      setActiveMedIndex(index);
      if (value && value.trim().length >= 3) {
        const query = value.toLowerCase().trim();
        const matches = pharmacyMedicines.filter(m => m.name.toLowerCase().includes(query)).slice(0, 10);
        setMedSuggestions(matches);
      } else {
        setMedSuggestions([]);
      }
    }
  };

  const selectMedicineSuggestion = (medObj, index) => {
    const updated = [...medicines];
    updated[index].medicine = medObj.name;
    setMedicines(updated);
    setMedSuggestions([]);
    setActiveMedIndex(null);
  };

  const toggleTiming = (index, timing) => {
    const updated = [...medicines];
    updated[index][timing] = !updated[index][timing];
    setMedicines(updated);
  };

  const addMedicineRow = () => {
    setMedicines([
      ...medicines,
      { medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food', qty: 0 }
    ]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length === 1) {
      toast.error("At least one medicine is required");
      return;
    }
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const buildPrescriptionDataForPrint = () => {
    const validMeds = medicines.filter(m => m.medicine && m.medicine.trim()).map(m => ({
      ...m,
      qty: calculateQty(m)
    }));

    return {
      _id: previousPrescription?._id || 'draft-rx',
      consultationId: consultation?._id,
      patientId: patient?._id,
      doctorName: user?.doctorName || user?.username || 'Doctor',
      language,
      medicines: validMeds,
      vitals: consultation?.vitals || patient?.demographics,
      symptoms: consultation?.symptoms || [],
      diagnosisRemark: consultation?.diagnosisRemark || '',
      tests: consultation?.tests || [],
      followUpDate: consultation?.followUpDate,
      followUpRemarks: consultation?.followUpRemarks,
      createdAt: new Date().toISOString()
    };
  };

  const handleSavePrescription = async (navigateOnSuccess = true) => {
    const validMedicines = medicines.filter(m => m.medicine && m.medicine.trim());
    if (validMedicines.length === 0) {
      toast.error("Please add at least one valid medicine name");
      return null;
    }

    setSaving(true);
    try {
      const payload = {
        patientId,
        consultationId: consultation?._id,
        medicines: validMedicines.map(m => ({
          ...m,
          qty: calculateQty(m)
        })),
        language
      };

      const { data } = await client.post('/prescription/create', payload);
      toast.success("Prescription saved successfully!");
      if (navigateOnSuccess) {
        navigate('/doctor');
      }
      return data;
    } catch (err) {
      console.error("Failed to save prescription", err);
      toast.error(err.response?.data?.message || "Failed to save prescription");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const [showLangModal, setShowLangModal] = useState(false);

  const handleSaveAndPrintClick = () => {
    setShowLangModal(true);
  };

  const executeSaveAndPrint = async (selectedLanguage) => {
    if (selectedLanguage) {
      setLanguage(selectedLanguage);
    }

    // Allow state to update
    setTimeout(async () => {
      const savedRx = await handleSavePrescription(false);
      if (!savedRx && !previousPrescription) return;

      toast.loading(`Generating PDF Receipt (${selectedLanguage || language})...`, { id: 'pdf-toast' });
      setShowPreview(true);

      setTimeout(async () => {
        try {
          const element = receiptRef.current;
          if (!element) {
            toast.error("Print template not ready", { id: 'pdf-toast' });
            return;
          }

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            onclone: (clonedDoc) => sanitizeClonedDocumentForPdf(clonedDoc)
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfPageHeight = pdf.internal.pageSize.getHeight();
          const imgHeight = (canvas.height * pdfWidth) / canvas.width;

          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfPageHeight;

          while (heightLeft >= 5) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfPageHeight;
          }

          pdf.autoPrint();
          window.open(pdf.output('bloburl'), '_blank');
          toast.success(`Prescription Printed in ${selectedLanguage || language}!`, { id: 'pdf-toast' });
        } catch (err) {
          console.error("PDF printing failed", err);
          toast.error("Failed to generate PDF receipt", { id: 'pdf-toast' });
        }
      }, 500);
    }, 150);
  };

  const handleCopyPreviousMedicines = (rxMeds) => {
    let medsToCopy = rxMeds;
    if (!medsToCopy || !Array.isArray(medsToCopy) || medsToCopy.length === 0) {
      if (previousPrescription && Array.isArray(previousPrescription.medicines) && previousPrescription.medicines.length > 0) {
        medsToCopy = previousPrescription.medicines;
      } else if (allPrescriptions && allPrescriptions.length > 0) {
        const found = allPrescriptions.find(p => Array.isArray(p.medicines) && p.medicines.length > 0);
        if (found) medsToCopy = found.medicines;
      }
    }

    if (!medsToCopy || medsToCopy.length === 0) {
      toast.error("No previous medicines found to copy");
      return;
    }
    const formatted = medsToCopy.map(m => ({
      medicine: m.medicine || m.name || m.drugName || '',
      dosageForm: m.dosageForm || 'Tablet',
      strength: m.strength || '',
      dose: m.dose || '1',
      morning: m.morning !== undefined ? m.morning : true,
      afternoon: m.afternoon !== undefined ? m.afternoon : false,
      night: m.night !== undefined ? m.night : true,
      duration: String(m.duration || '5'),
      remarks: m.remarks || 'After food',
      qty: m.qty || 0
    }));
    setMedicines(formatted);
    toast.success(`${formatted.length} previous medicine(s) pre-filled into prescription!`);
  };

  if (loading) return <div className="card p-8 text-center font-bold text-gray-600">Loading Digital Rx Form...</div>;
  if (!patient) return <div className="card p-8 text-center font-bold text-red-600">Patient record not found.</div>;

  const isFollowUpPatient = allConsultations.length > 0 || allPrescriptions.length > 0 || patient.slot === 'Follow-up' || consultation?.followUpDate;
  const latestPastConsultation = allConsultations.find(c => c._id !== consultation?._id) || allConsultations[0] || consultation;
  const latestPastPrescription = previousPrescription || (allPrescriptions.length > 0 ? allPrescriptions[0] : null);

  return (
    <div className="space-y-5 pb-12" autoComplete="off">
      {patient.isDischarged && (
        <div className="card p-4 border border-red-200 bg-red-50/80 flex items-center gap-3">
          <ShieldAlert className="text-red-600 h-6 w-6 shrink-0" />
          <div>
            <h4 className="font-extrabold text-red-800 text-sm uppercase tracking-wider">Patient is Discharged</h4>
            <p className="text-xs text-red-700 mt-0.5 font-semibold">
              This patient has been discharged. OPD case record is read-only.
            </p>
          </div>
        </div>
      )}

      {/* Patient Header Banner */}
      <div className="card p-5 bg-gradient-to-r from-orange-50/80 via-white to-blue-50/40 border border-orange-200/70 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wide">
              <span>{patient.uhid}</span>
              {patient.registeredBy && (
                <span className="text-gray-400 font-semibold">• Reg By: <span className="capitalize text-gray-700">{patient.registeredBy}</span></span>
              )}
              {isFollowUpPatient && (
                <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <History className="h-3 w-3" /> Follow-up Patient
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-1">{patient.patientName}</h1>
            <p className="text-sm font-semibold text-gray-600 mt-0.5">
              {patient.gender} • {patient.mobile} • <span className="text-orange-700 font-bold">{formatDate(patient.appointmentDate)} ({patient.slot})</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/doctor/consultation-track/${patientId}`}
              className="btn-secondary text-xs font-bold py-2 px-3 flex items-center gap-1.5 cursor-pointer"
              title="View full timeline"
            >
              <Activity className="h-4 w-4 text-emerald-600" />
              Full Clinical Track
            </Link>
          </div>
        </div>
      </div>

      {/* Follow-Up Patient Previous Medical History Section */}
      {isFollowUpPatient && (
        <div className="card p-5 bg-gradient-to-r from-purple-50/60 via-white to-indigo-50/40 border border-purple-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  Follow-up Patient History & Previous Clinical Record
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {allConsultations.length} Consultation(s) • {allPrescriptions.length} Prescription(s) recorded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {latestPastPrescription?.medicines?.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleCopyPreviousMedicines(latestPastPrescription.medicines)}
                  className="btn bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Import previous medicines into current prescription form"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Import Previous Medicines
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                className="p-1.5 rounded-lg border border-purple-200 bg-white text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                title={showHistoryPanel ? "Hide history" : "Show history"}
              >
                {showHistoryPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {showHistoryPanel && (
            <div className="space-y-4 text-xs">
              {/* Previous Vitals Bar */}
              {latestPastConsultation?.vitals && (
                <div className="p-3 bg-white/90 rounded-xl border border-purple-100 shadow-2xs space-y-1.5">
                  <div className="text-[11px] font-black uppercase text-purple-800 flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" /> Recorded Vitals (Last Visit)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-gray-700 font-semibold">
                    <div>Weight: <span className="font-bold text-gray-900">{latestPastConsultation.vitals.weight || '-'} kg</span></div>
                    <div>Height: <span className="font-bold text-gray-900">{latestPastConsultation.vitals.height || '-'} cm</span></div>
                    <div>Temp: <span className="font-bold text-gray-900">{latestPastConsultation.vitals.temperature || '-'} °C</span></div>
                    <div>BP: <span className="font-bold text-gray-900">{latestPastConsultation.vitals.bloodPressure || '-'}</span></div>
                    <div>BMI: <span className="font-bold text-gray-900">{latestPastConsultation.vitals.bmi || '-'}</span></div>
                    <div>Allergy: <span className="font-bold text-red-600">{latestPastConsultation.vitals.drugAllergy || 'None'}</span></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clinical Notes & Diagnosis */}
                <div className="p-3.5 bg-white rounded-xl border border-gray-200/80 space-y-2">
                  <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    Previous Diagnosis & Symptoms
                  </h4>

                  {latestPastConsultation ? (
                    <div className="space-y-2 text-gray-700">
                      {latestPastConsultation.diagnosisRemark && (
                        <div>
                          <span className="font-bold text-gray-900 block text-[11px] uppercase text-gray-500">Diagnosis / Remarks:</span>
                          <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-100 mt-0.5">{latestPastConsultation.diagnosisRemark}</p>
                        </div>
                      )}

                      {latestPastConsultation.symptoms && latestPastConsultation.symptoms.length > 0 && (
                        <div>
                          <span className="font-bold text-gray-900 block text-[11px] uppercase text-gray-500 mb-1">Chief Complaints:</span>
                          <div className="flex flex-wrap gap-1">
                            {latestPastConsultation.symptoms.map((s, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                                {s.symptom} {s.durationDays ? `(${s.durationDays} ${s.durationUnit || 'Days'})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {latestPastConsultation.generalPastHistory && (
                        <div>
                          <span className="font-bold text-gray-900 block text-[11px] uppercase text-gray-500">General Past History:</span>
                          <p className="font-medium text-gray-700">{latestPastConsultation.generalPastHistory}</p>
                        </div>
                      )}

                      {latestPastConsultation.followUpDate && (
                        <div className="pt-1 text-[11px] font-bold text-purple-700 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Scheduled Follow-up: {formatDate(latestPastConsultation.followUpDate)} {latestPastConsultation.followUpRemarks ? `(${latestPastConsultation.followUpRemarks})` : ''}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No previous consultation diagnosis recorded.</p>
                  )}
                </div>

                {/* Previously Prescribed Medicines */}
                <div className="p-3.5 bg-white rounded-xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="h-3.5 w-3.5 text-purple-600" />
                      Previously Prescribed Medicines
                    </h4>
                    {latestPastPrescription?.createdAt && (
                      <span className="text-[10px] text-gray-500 font-semibold">
                        {formatDate(latestPastPrescription.createdAt)}
                      </span>
                    )}
                  </div>

                  {latestPastPrescription && latestPastPrescription.medicines && latestPastPrescription.medicines.length > 0 ? (
                    <div className="space-y-1.5">
                      {latestPastPrescription.medicines.map((m, idx) => {
                        const timingStr = [m.morning && 'M', m.afternoon && 'A', m.night && 'N'].filter(Boolean).join('-');
                        return (
                          <div key={idx} className="p-2 bg-purple-50/50 rounded-lg border border-purple-100 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-extrabold text-gray-900 block">{m.medicine} <span className="text-gray-500 text-[11px] font-normal">({m.dosageForm || 'Tablet'} {m.strength})</span></span>
                              <span className="text-[10px] font-bold text-purple-700 block">
                                Timing: {timingStr || '1-0-1'} • Dose: {m.dose || '1'} • Duration: {m.duration || '5'} days
                              </span>
                              {m.remarks && <span className="text-[10px] text-gray-500 italic block">{m.remarks}</span>}
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCopyPreviousMedicines(latestPastPrescription.medicines)}
                          className="text-[11px] font-extrabold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" /> Pre-fill these medicines into Rx form ➔
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No previous digital prescriptions found.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prescription Medicines Form */}
      <div className="card p-5 bg-white border border-orange-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-orange-100 pb-3">
          <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Digital Rx / Prescription Medicines
          </h2>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600">Print Language:</label>
            <select 
              className="input text-xs font-bold text-gray-800 py-1 cursor-pointer"
              value={typeof language === 'object' ? language.value : language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((lang) => {
                const val = typeof lang === 'object' ? lang.value : lang;
                const lbl = typeof lang === 'object' ? (lang.label || lang.value) : lang;
                return (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Medicines List */}
        <div className="space-y-3">
          {medicines.map((med, index) => (
            <div key={index} className="p-3 bg-gradient-to-r from-orange-50/40 via-white to-blue-50/30 rounded-xl border border-orange-200/70 space-y-2 relative shadow-2xs">
              {/* Row 1: Medicine Autocomplete & Stock */}
              <div className="relative">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase">Medicine Name #{index + 1}</label>
                  {pharmacyMedicines.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Pharmacy Stock Synced
                    </span>
                  )}
                </div>
                <input 
                  className="input w-full text-xs font-bold text-gray-900" 
                  placeholder="Type medicine name (e.g. Paracetamol 500mg)..." 
                  value={med.medicine} 
                  onChange={(e) => updateMedicine(index, 'medicine', e.target.value)}
                  onFocus={() => setActiveMedIndex(index)}
                />
                {activeMedIndex === index && medSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-300 rounded-md shadow-xl z-30 max-h-44 overflow-y-auto">
                    {medSuggestions.map((mObj, mIdx) => (
                      <button
                        key={mIdx}
                        type="button"
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-xs font-semibold border-b border-blue-50 flex items-center justify-between cursor-pointer"
                        onClick={() => selectMedicineSuggestion(mObj, index)}
                      >
                        <span className="font-bold text-gray-800">{mObj.name}</span>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Stock: {mObj.stock}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 2: Form, Strength, Dose */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Form</label>
                  <select 
                    className="input w-full text-xs font-semibold"
                    value={med.dosageForm}
                    onChange={(e) => updateMedicine(index, 'dosageForm', e.target.value)}
                  >
                    {['Tablet', 'Syrup', 'Injection', 'Capsule', 'Ointment', 'Eye Drops', 'Drop', 'Cream', 'Gel', 'Powder', 'Lotion', 'Spray'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Strength</label>
                  <input 
                    className="input w-full text-xs font-semibold"
                    placeholder="500mg"
                    value={med.strength}
                    onChange={(e) => updateMedicine(index, 'strength', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Dose</label>
                  <input 
                    className="input w-full text-xs font-semibold"
                    placeholder="1"
                    value={med.dose}
                    onChange={(e) => updateMedicine(index, 'dose', e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Timings (M/A/N) & Duration & Instructions */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Timings (M-A-N)</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleTiming(index, 'morning')}
                      className={`flex-1 text-xs font-black py-1 rounded-md border transition-all cursor-pointer ${
                        med.morning ? 'bg-orange-500 text-white border-orange-600 shadow-2xs' : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                    >
                      M
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTiming(index, 'afternoon')}
                      className={`flex-1 text-xs font-black py-1 rounded-md border transition-all cursor-pointer ${
                        med.afternoon ? 'bg-orange-500 text-white border-orange-600 shadow-2xs' : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTiming(index, 'night')}
                      className={`flex-1 text-xs font-black py-1 rounded-md border transition-all cursor-pointer ${
                        med.night ? 'bg-orange-500 text-white border-orange-600 shadow-2xs' : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                    >
                      N
                    </button>
                  </div>
                </div>

                <div className="col-span-3">
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Days</label>
                  <input 
                    className="input w-full text-xs font-semibold"
                    placeholder="Days"
                    type="number"
                    value={med.duration}
                    onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                  />
                </div>

                <div className="col-span-4">
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Total Qty</label>
                  <div className="input w-full text-xs font-black text-gray-900 bg-gray-100 flex items-center justify-center">
                    {calculateQty(med)} units
                  </div>
                </div>
              </div>

              <div>
                <input 
                  className="input w-full text-xs"
                  placeholder="Special Instructions / Remarks (e.g. After food)..."
                  value={med.remarks}
                  onChange={(e) => updateMedicine(index, 'remarks', e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="button" 
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  onClick={() => removeMedicineRow(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove Item
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          type="button" 
          className="btn-secondary w-full py-2 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          onClick={addMedicineRow}
        >
          <Plus className="h-4 w-4 text-orange-600" /> Add Another Medicine
        </button>
      </div>

      {/* Save & Print Action Buttons */}
      <div className="card p-5 bg-white border border-gray-200/80 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            className="btn w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold py-3 text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
            onClick={() => handleSavePrescription(true)}
            disabled={saving || patient.isDischarged}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Digital Prescription'}
          </button>

          <button
            type="button"
            className="btn w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold py-3 text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
            onClick={handleSaveAndPrintClick}
            disabled={saving || patient.isDischarged}
          >
            <Printer className="h-4 w-4" />
            Save & Print Receipt (PDF)
          </button>
        </div>

        {/* Print Language Selector Modal */}
        <PrintLanguageModal
          isOpen={showLangModal}
          onClose={() => setShowLangModal(false)}
          onConfirm={(chosenLang) => executeSaveAndPrint(chosenLang)}
          initialLanguage={language || 'English'}
        />

        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
          <button
            type="button"
            className="text-xs font-bold text-gray-600 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-3.5 w-3.5" />
            {showPreview ? 'Hide Print Preview' : 'Show Print Preview'}
          </button>
          <Link to={`/doctor/consultation/${patientId}`} className="text-xs font-bold text-orange-600 hover:underline">
            ← Back to Consultation Form
          </Link>
        </div>
      </div>

      {/* Printable Receipt Preview */}
      {showPreview && (
        <div className="card p-4 bg-gray-50 border border-gray-200 shadow-inner space-y-2">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">A4 Printable Receipt Preview</h3>
          <div className="bg-white p-3 border border-gray-300 rounded shadow-xs overflow-x-auto">
            <div ref={receiptRef}>
              <PatientReceipt patient={patient} prescription={buildPrescriptionDataForPrint()} printOptions={printOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable ref if preview is closed */}
      {!showPreview && (
        <div className="hidden">
          <div ref={receiptRef}>
            <PatientReceipt patient={patient} prescription={buildPrescriptionDataForPrint()} printOptions={printOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionPage;