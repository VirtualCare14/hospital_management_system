'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Stethoscope, Plus, Trash2, Save, X, Activity, Pill,
  FileText, Calendar, Clock, AlertCircle, RefreshCw, Printer,
  Eye, Copy, History, FlaskConical, ClipboardList, PanelRightClose,
  PanelRightOpen, CheckCircle2, ChevronUp, ChevronDown, Download, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import { openPdfPrintWindow, sanitizeClonedDocumentForPdf } from '@/lib/utils/pdfUtils';
import PatientReceipt from '../common/PatientReceipt';
import PrintLanguageModal from '../common/PrintLanguageModal';
import {
  buildPrescriptionWhatsAppUrl,
  navigateWhatsAppShareWindow,
  openWhatsAppShareWindow
} from '../../../../shared/prescriptionWhatsApp.js';

const durationUnits = ['Days', 'Weeks', 'Months', 'Years', 'Hours'];

const commonSymptomsList = [
  'Fever', 'High Fever', 'Cough', 'Dry Cough', 'Productive Cough',
  'Cold & Runny Nose', 'Sore Throat', 'Headache', 'Severe Migraine',
  'Body Ache', 'Weakness & Fatigue', 'Chest Pain', 'Shortness of Breath',
  'Abdominal Pain', 'Acidity & Heartburn', 'Nausea & Vomiting', 'Loose Stools / Diarrhea',
  'Constipation', 'Loss of Appetite', 'Joint Pain', 'Back Pain',
  'Dizziness / Vertigo', 'Skin Rash / Itching', 'Burning Micturition'
];

const commonLabTests = [
  'Complete Blood Count (CBC)', 'Lipid Profile', 'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)', 'Blood Sugar Fasting (FBS)', 'Blood Sugar Post Prandial (PPBS)',
  'HbA1c (Glycated Hemoglobin)', 'Urine Routine & Microscopic', 'Thyroid Profile (T3, T4, TSH)',
  'Serum Creatinine & Urea', 'Serum Uric Acid', 'Dengue NS1 Antigen & IgG/IgM',
  'Widal Test (Typhoid)', 'Chest X-Ray (PA View)', 'ECG (12 Lead)', 'Ultrasound Whole Abdomen'
];

const commonMedicinesList = [
  { name: 'Tab. Paracetamol 650mg', dosageForm: 'Tablet', strength: '650mg', dose: '1', remarks: 'After food', stock: 120 },
  { name: 'Tab. Amoxicillin & Clavulanate 625mg (Augmentin)', dosageForm: 'Tablet', strength: '625mg', dose: '1', remarks: 'After meal', stock: 85 },
  { name: 'Tab. Pantoprazole 40mg (Pan-40)', dosageForm: 'Tablet', strength: '40mg', dose: '1', remarks: 'Before breakfast', stock: 150 },
  { name: 'Tab. Azithromycin 500mg (Azee)', dosageForm: 'Tablet', strength: '500mg', dose: '1', remarks: 'Once daily after food', stock: 60 },
  { name: 'Tab. Cetirizine 10mg', dosageForm: 'Tablet', strength: '10mg', dose: '1', remarks: 'At bedtime', stock: 200 },
  { name: 'Tab. Montelukast + Levocetirizine (Montair LC)', dosageForm: 'Tablet', strength: '10mg+5mg', dose: '1', remarks: 'At night after food', stock: 95 },
  { name: 'Tab. Aceclofenac + Paracetamol (Zerodol-P)', dosageForm: 'Tablet', strength: '100mg+325mg', dose: '1', remarks: 'After food', stock: 110 },
  { name: 'Tab. Ofloxacin + Ornidazole (O2)', dosageForm: 'Tablet', strength: '200mg+500mg', dose: '1', remarks: 'After food', stock: 75 },
  { name: 'Tab. Telmisartan 40mg (Telma)', dosageForm: 'Tablet', strength: '40mg', dose: '1', remarks: 'Morning after food', stock: 90 },
  { name: 'Tab. Metformin 500mg (Glycomet)', dosageForm: 'Tablet', strength: '500mg', dose: '1', remarks: 'After meals', stock: 130 },
  { name: 'Syrup Ascoril-D (Cough Syrup)', dosageForm: 'Syrup', strength: '100ml', dose: '1', remarks: '5ml thrice daily', stock: 45 },
  { name: 'Syrup Gelusil Antacid', dosageForm: 'Syrup', strength: '200ml', dose: '1', remarks: '10ml after food', stock: 50 },
  { name: 'Eye Drop Moxifloxacin 0.5% (Vigamox)', dosageForm: 'Eye Drops', strength: '5ml', dose: '1', remarks: '1 drop in affected eye', stock: 30 },
  { name: 'Ointment Betadine (Povidone Iodine 5%)', dosageForm: 'Ointment', strength: '20g', dose: '1', remarks: 'Apply on wound twice daily', stock: 40 }
];

export default function DoctorConsultationView({ patient, onBack, onSuccess, onNavigate }) {
  const receiptRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Vitals State
  const [vitals, setVitals] = useState({
    weight: patient?.demographics?.weight || '',
    height: patient?.demographics?.height || '',
    bloodPressure: patient?.demographics?.bloodPressure || '',
    temperature: patient?.demographics?.temperature || '',
    pulse: patient?.demographics?.pulse || '',
    spo2: patient?.demographics?.spo2 || '',
    bmi: patient?.demographics?.bmi || '',
    drugAllergy: patient?.demographics?.drugAllergy || ''
  });
  const [isEditingVitals, setIsEditingVitals] = useState(false);

  // Symptoms State
  const [symptoms, setSymptoms] = useState([
    { symptom: '', durationDays: '3', durationUnit: 'Days', pastHistory: '', remarks: '' }
  ]);
  const [activeSymptomIndex, setActiveSymptomIndex] = useState(null);
  const [symptomSuggestions, setSymptomSuggestions] = useState([]);

  // Clinical Notes & History
  const [generalPastHistory, setGeneralPastHistory] = useState('');
  const [diagnosisRemark, setDiagnosisRemark] = useState('');
  const [patientAdvice, setPatientAdvice] = useState('');

  // Lab Tests State
  const [availableTests, setAvailableTests] = useState(commonLabTests.map(name => ({ name, category: 'LAB', isPackage: false })));
  const [selectedTests, setSelectedTests] = useState([]);
  const [testQuery, setTestQuery] = useState('');
  const [sendToLab, setSendToLab] = useState(true);

  // Medicines State
  const [medicines, setMedicines] = useState([
    {
      medicine: '',
      dosageForm: 'Tablet',
      strength: '500mg',
      dose: '1',
      morning: true,
      afternoon: false,
      night: true,
      duration: '5',
      remarks: 'After food',
      qty: 0,
      customQty: ''
    }
  ]);
  const [activeMedIndex, setActiveMedIndex] = useState(null);
  const [medSuggestions, setMedSuggestions] = useState([]);

  // Follow-up State
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpRemarks, setFollowUpRemarks] = useState('');

  // Past Consultation / History
  const [previousConsultation, setPreviousConsultation] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Print Preview & Language Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [language, setLanguage] = useState('English');

  // Print options
  const [printOptions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clinic_doctor_print_options');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {
      printVitals: true,
      printLabTests: true,
      printSymptomHistory: true,
      printSymptomRemarks: true,
      printGeneralPastHistory: true,
      printDiagnosisRemarks: true,
      printPatientAdvice: true
    };
  });

  // Calculate BMI
  useEffect(() => {
    const h = parseFloat(vitals.height);
    const w = parseFloat(vitals.weight);
    if (h > 0 && w > 0) {
      const meter = h / 100;
      const bmiVal = (w / (meter * meter)).toFixed(1);
      setVitals(prev => ({ ...prev, bmi: bmiVal }));
    }
  }, [vitals.height, vitals.weight]);

  // Load existing or previous consultation
  useEffect(() => {
    if (!patient?._id) return;
    setLoading(true);
    apiRequest(`/consultation/${patient._id}`)
      .then((data) => {
        if (data?.consultation) {
          const c = data.consultation;
          if (c.vitals) setVitals(prev => ({ ...prev, ...c.vitals }));
          if (c.symptoms && c.symptoms.length > 0) setSymptoms(c.symptoms);
          if (c.pastHistory) setGeneralPastHistory(c.pastHistory);
          if (c.diagnosisRemark) setDiagnosisRemark(c.diagnosisRemark);
          if (c.patientAdvice) setPatientAdvice(c.patientAdvice);
          if (c.tests && c.tests.length > 0) setSelectedTests(c.tests);
          if (c.followUpDate) setFollowUpDate(new Date(c.followUpDate).toISOString().split('T')[0]);
          if (c.followUpRemarks) setFollowUpRemarks(c.followUpRemarks);
          setPreviousConsultation(c);
        }
        if (data?.prescription?.medicines && data.prescription.medicines.length > 0) {
          setMedicines(data.prescription.medicines);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patient]);

  // Fetch Lab Tests and Packages
  useEffect(() => {
    Promise.allSettled([
      apiRequest('/lab/tests'),
      apiRequest('/lab/packages')
    ]).then(([testsRes, pkgsRes]) => {
      const testsData = testsRes.status === 'fulfilled' && Array.isArray(testsRes.value)
        ? testsRes.value
        : (testsRes.status === 'fulfilled' && Array.isArray(testsRes.value?.data) ? testsRes.value.data : []);
      const pkgsData = pkgsRes.status === 'fulfilled' && Array.isArray(pkgsRes.value)
        ? pkgsRes.value
        : (pkgsRes.status === 'fulfilled' && Array.isArray(pkgsRes.value?.data) ? pkgsRes.value.data : []);

      const mappedPkgs = pkgsData.filter(p => p.status !== 'Inactive').map(p => ({
        name: p.name,
        category: (p.category || 'LAB').toUpperCase(),
        isPackage: true,
        price: p.price,
        code: p.code,
        tests: p.tests || []
      }));

      const mappedTests = testsData.map(t => ({
        name: t.test || t.title || t.name,
        category: (t.category || 'LAB').toUpperCase(),
        isPackage: false,
        price: t.basePrice || t.totalAmount || t.price
      })).filter(t => Boolean(t.name));

      const seen = new Set();
      const combined = [];
      [...mappedPkgs, ...mappedTests].forEach(item => {
        if (item.name && !seen.has(item.name.toLowerCase())) {
          seen.add(item.name.toLowerCase());
          combined.push(item);
        }
      });
      commonLabTests.forEach(name => {
        if (!seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          combined.push({ name, category: 'LAB', isPackage: false });
        }
      });
      if (combined.length > 0) {
        setAvailableTests(combined);
      }
    }).catch(() => {});
  }, []);

  // Calculate Quantity for Medicines
  const calculateQty = (med) => {
    if (!med) return 0;
    const isTablet = String(med.dosageForm || 'Tablet').toLowerCase() === 'tablet';
    if (!isTablet) {
      if (med.customQty !== undefined && med.customQty !== '') {
        return parseInt(med.customQty) || 0;
      }
      return parseInt(med.qty) || 1;
    }
    const doseNum = parseFloat(med.dose) || 1;
    const durationNum = parseInt(med.duration) || 1;
    let timingsCount = (med.morning ? 1 : 0) + (med.afternoon ? 1 : 0) + (med.night ? 1 : 0);
    if (timingsCount === 0) timingsCount = 1;
    return Math.ceil(doseNum * timingsCount * durationNum);
  };

  // Symptoms Handlers
  const updateSymptom = (index, field, value) => {
    const updated = [...symptoms];
    updated[index][field] = value;
    setSymptoms(updated);

    if (field === 'symptom') {
      setActiveSymptomIndex(index);
      if (value && value.trim().length >= 1) {
        const query = value.toLowerCase().trim();
        const matches = commonSymptomsList.filter(s => s.toLowerCase().includes(query)).slice(0, 8);
        setSymptomSuggestions(matches);
      } else {
        setSymptomSuggestions([]);
      }
    }
  };

  const selectSymptomSuggestion = (sug, index) => {
    const updated = [...symptoms];
    updated[index].symptom = sug;
    setSymptoms(updated);
    setSymptomSuggestions([]);
    setActiveSymptomIndex(null);
  };

  const addSymptom = () => {
    setSymptoms([
      ...symptoms,
      { symptom: '', durationDays: '3', durationUnit: 'Days', pastHistory: '', remarks: '' }
    ]);
  };

  const removeSymptom = (index) => {
    if (symptoms.length === 1) {
      setSymptoms([{ symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' }]);
      return;
    }
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  // Lab Tests Handlers
  const addTest = (testName) => {
    const name = testName.trim();
    if (!name) return;
    if (!selectedTests.includes(name)) {
      setSelectedTests([...selectedTests, name]);
    }
    setTestQuery('');
  };

  const removeTest = (testName) => {
    setSelectedTests(selectedTests.filter(t => t !== testName));
  };

  // Medicine Handlers
  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);

    if (field === 'medicine') {
      setActiveMedIndex(index);
      if (value && value.trim().length >= 2) {
        const query = value.toLowerCase().trim();
        const matches = commonMedicinesList.filter(m => m.name.toLowerCase().includes(query)).slice(0, 8);
        setMedSuggestions(matches);
      } else {
        setMedSuggestions([]);
      }
    }
  };

  const selectMedSuggestion = (medObj, index) => {
    const updated = [...medicines];
    updated[index].medicine = medObj.name;
    if (medObj.dosageForm) updated[index].dosageForm = medObj.dosageForm;
    if (medObj.strength) updated[index].strength = medObj.strength;
    if (medObj.remarks) updated[index].remarks = medObj.remarks;
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
      {
        medicine: '',
        dosageForm: 'Tablet',
        strength: '500mg',
        dose: '1',
        morning: true,
        afternoon: false,
        night: true,
        duration: '5',
        remarks: 'After food',
        qty: 0,
        customQty: ''
      }
    ]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length === 1) {
      setMedicines([{ medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food', qty: 0 }]);
      return;
    }
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleContinuePreviousMedicines = () => {
    if (previousConsultation?.medicines && previousConsultation.medicines.length > 0) {
      setMedicines(previousConsultation.medicines);
      toast.success('Previous prescription medicines loaded!');
    } else {
      toast.error('No previous prescription medicines found.');
    }
  };

  // Submit Consultation & Prescription
  const handleSaveAndPrint = async (activeLang = 'English', whatsappShare = null) => {
    const validSymptoms = symptoms.filter(s => s.symptom && s.symptom.trim());
    const validMedicines = medicines.filter(m => m.medicine && m.medicine.trim());

    if (validSymptoms.length === 0 && !diagnosisRemark.trim() && validMedicines.length === 0) {
      toast.error('Please enter at least symptoms, diagnosis, or prescription medicines');
      return;
    }

    setSaving(true);
    try {
      const consPayload = {
        patientId: patient._id,
        visitId: patient.visitId || patient._id,
        symptoms: validSymptoms,
        pastHistory: generalPastHistory,
        diagnosisRemark,
        patientAdvice,
        vitals,
        tests: selectedTests,
        sendToLab,
        followUpDate: followUpDate || undefined,
        followUpRemarks: followUpRemarks || undefined
      };

      const consRes = await apiRequest('/consultation/create', {
        method: 'POST',
        data: consPayload
      });

      let savedRx = null;
      if (validMedicines.length > 0) {
        const rxPayload = {
          patientId: patient._id,
          consultationId: consRes?.consultation?._id || consRes?._id || previousConsultation?._id,
          medicines: validMedicines.map(m => ({
            ...m,
            qty: calculateQty(m)
          })),
          language: activeLang
        };

        const rxRes = await apiRequest('/prescription/create', {
          method: 'POST',
          data: rxPayload
        });
        savedRx = rxRes?.prescription || rxPayload;
      }

      toast.success('Consultation & Prescription saved successfully!');

      if (whatsappShare) {
        navigateWhatsAppShareWindow(whatsappShare.url);
        toast.success('WhatsApp opened. Review the prescription and tap Send.');
        if (onSuccess) onSuccess(patient, { ...consPayload, medicines: validMedicines });
        if (onBack) onBack();
        return;
      }

      if (receiptRef.current) {
        const toastId = toast.loading(`Generating Printable Prescription (${activeLang})...`);
        setTimeout(async () => {
          try {
            const canvas = await html2canvas(receiptRef.current, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff',
              windowWidth: 1024,
              imageTimeout: 20000,
              onclone: (clonedDoc) => {
                sanitizeClonedDocumentForPdf(clonedDoc);
              }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;
            pdf.addImage(imgData, 'PNG', 5, 5, width - 10, height);
            pdf.autoPrint();
            openPdfPrintWindow(pdf, 'Doctor Prescription Slip');
            toast.dismiss(toastId);
            toast.success('Prescription printed successfully!');
          } catch (printErr) {
            console.error('Print generation failed', printErr);
            toast.dismiss(toastId);
            toast.error('Could not generate PDF print');
          } finally {
            if (onSuccess) onSuccess(patient, { ...consPayload, medicines: validMedicines });
            if (onBack) onBack();
          }
        }, 400);
      } else {
        if (onSuccess) onSuccess(patient, { ...consPayload, medicines: validMedicines });
        if (onBack) onBack();
      }
    } catch (err) {
      console.error('Failed to save consultation:', err);
      toast.error(err.message || 'Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndShareWhatsApp = () => {
    const validMedicines = medicines.filter(m => m.medicine && m.medicine.trim());
    if (validMedicines.length === 0) {
      toast.error('Add at least one medicine before sharing a prescription');
      return;
    }

    let whatsappUrl;
    try {
      whatsappUrl = buildPrescriptionWhatsAppUrl({
        phone: patient?.mobile,
        patientName: patient?.patientName,
        doctorName: patient?.doctorId?.doctorName || patient?.doctorId?.username || 'Doctor',
        prescription: {
          diagnosisRemark,
          patientAdvice,
          medicines: validMedicines,
          followUpDate,
          followUpRemarks,
          createdAt: new Date().toISOString()
        }
      });
    } catch (err) {
      toast.error(err.message);
      return;
    }

    const whatsappWindow = openWhatsAppShareWindow();
    if (!whatsappWindow) {
      toast.error('Allow pop-ups to open WhatsApp and share the prescription.');
      return;
    }

    handleSaveAndPrint(language, { window: whatsappWindow, url: whatsappUrl });
  };

  const receiptPatientData = {
    ...patient,
    demographics: vitals
  };

  const receiptPrescriptionData = {
    doctorName: patient.doctorId?.doctorName || patient.doctorId?.username || 'Doctor',
    language,
    diagnosisRemark,
    patientAdvice,
    tests: selectedTests,
    pastHistory: generalPastHistory,
    symptoms: symptoms.filter(s => s.symptom),
    medicines: medicines.filter(m => m.medicine).map(m => ({ ...m, qty: calculateQty(m) })),
    followUpDate,
    followUpRemarks
  };

  const handleClose = () => {
    if (onBack) onBack();
    else if (onNavigate) onNavigate('doctor-dashboard');
  };

  return (
    <div className="w-full space-y-5 pb-12 animate-in fade-in duration-200">
      
      {/* Top Page Header Bar with Close Consultation Button */}
      <div className="card p-4 bg-white border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 rounded-2xl text-orange-600 shadow-xs">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              Doctor Consultation & Digital Rx
              <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-lg text-xs font-extrabold border border-orange-200">
                {formatUhid(patient?.uhid)}
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Patient: <strong className="text-gray-900 font-bold">{patient?.patientName}</strong> ({patient?.gender}, {patient?.mobile}) • {patient?.department || 'Clinic'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!showRightPanel && (
            <button
              type="button"
              onClick={() => setShowRightPanel(true)}
              className="btn bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-extrabold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
              title="Open Patient Summary & Vitals Panel"
            >
              <PanelRightOpen className="h-4 w-4 text-orange-600" />
              <span>Open Side Panel</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="btn bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            title="Close digital prescription and exit consultation"
          >
            <X className="h-4 w-4" />
            <span>Close Consultation</span>
          </button>
        </div>
      </div>

      {/* Floating Toggle Button when Side Panel is Closed */}
      {!showRightPanel && (
        <button
          type="button"
          onClick={() => setShowRightPanel(true)}
          className="fixed top-24 right-5 z-40 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs py-2.5 px-4 shadow-xl rounded-full flex items-center gap-2 border border-white/40 cursor-pointer transition-all animate-in fade-in slide-in-from-right-5"
          title="Open Patient Summary & Vitals Panel"
        >
          <PanelRightOpen className="h-4 w-4 text-white" />
          <span>Open Side Panel</span>
        </button>
      )}

      {/* Dynamic 12-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
        
        {/* Left Column (10 Cols or 12 Cols if Side Panel is closed) */}
        <div className={`${showRightPanel ? 'lg:col-span-9 xl:col-span-10' : 'lg:col-span-12'} space-y-5 transition-all duration-300 w-full`}>
          
          {/* Follow-up Summary Banner */}
          {previousConsultation && (
            <div className="card p-4 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/50 border border-purple-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg text-purple-700">
                    <History className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    Follow-up Patient - Previous Consultation Summary
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1 text-purple-700 hover:bg-purple-100/60 rounded-md transition-colors cursor-pointer"
                >
                  {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {showHistory && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-gray-200/70 space-y-1.5">
                    <div className="font-bold text-gray-800 flex items-center gap-1 border-b border-gray-100 pb-1">
                      <FileText className="h-3.5 w-3.5 text-purple-600" /> Previous Clinical Notes
                    </div>
                    {previousConsultation.diagnosisRemark && (
                      <p className="text-gray-800 font-semibold bg-gray-50 p-1.5 rounded border border-gray-100">
                        {previousConsultation.diagnosisRemark}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-gray-200/70 space-y-1.5">
                    <div className="font-bold text-gray-800 flex items-center gap-1 border-b border-gray-100 pb-1">
                      <Stethoscope className="h-3.5 w-3.5 text-orange-600" /> Previous Vitals
                    </div>
                    {previousConsultation.vitals && (
                      <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold text-gray-700">
                        <div>WT: <span className="font-bold text-gray-900">{previousConsultation.vitals.weight || '-'} kg</span></div>
                        <div>HT: <span className="font-bold text-gray-900">{previousConsultation.vitals.height || '-'} cm</span></div>
                        <div>BP: <span className="font-bold text-gray-900">{previousConsultation.vitals.bloodPressure || '-'}</span></div>
                        <div>Temp: <span className="font-bold text-gray-900">{previousConsultation.vitals.temperature || '-'} °F</span></div>
                        <div>BMI: <span className="font-bold text-gray-900">{previousConsultation.vitals.bmi || '-'}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-purple-100 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-bold text-purple-900">Follow-up Patient Quick Action:</span>
                <button
                  type="button"
                  onClick={handleContinuePreviousMedicines}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Copy className="h-3.5 w-3.5" /> Continue Previous Medicines
                </button>
              </div>
            </div>
          )}

          {/* 1. Symptoms Section */}
          <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" /> Symptoms
              </h2>
              <button
                type="button"
                onClick={addSymptom}
                className="btn-secondary text-xs font-extrabold py-2 px-3 flex items-center gap-1 text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200 cursor-pointer rounded-xl"
              >
                <Plus className="h-4 w-4 text-orange-600" /> Add Another Symptom
              </button>
            </div>

            <div className="space-y-3">
              {symptoms.map((item, index) => (
                <div key={index} className="p-3 bg-slate-50/80 rounded-xl border border-gray-200/80 space-y-2 relative">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* Symptom Name */}
                    <div className="col-span-12 lg:col-span-4 relative">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">
                        Symptom Name #{index + 1}
                      </label>
                      <input
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300"
                        placeholder="Type symptom (e.g. Fever, Cough)..."
                        value={item.symptom}
                        onChange={(e) => updateSymptom(index, 'symptom', e.target.value)}
                        onFocus={() => setActiveSymptomIndex(index)}
                      />
                      {activeSymptomIndex === index && symptomSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-orange-300 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                          {symptomSuggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm font-bold border-b border-orange-50 last:border-b-0 hover:bg-orange-50 text-gray-800 cursor-pointer"
                              onClick={() => selectSymptomSuggestion(sug, index)}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Duration</label>
                      <input
                        type="number"
                        min="1"
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300 text-center"
                        placeholder="e.g. 3"
                        value={item.durationDays}
                        onChange={(e) => updateSymptom(index, 'durationDays', e.target.value)}
                      />
                    </div>

                    {/* Unit */}
                    <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Unit</label>
                      <select
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300 cursor-pointer"
                        value={item.durationUnit || 'Days'}
                        onChange={(e) => updateSymptom(index, 'durationUnit', e.target.value)}
                      >
                        {durationUnits.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div className="col-span-10 sm:col-span-5 lg:col-span-3">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Past History / Notes</label>
                      <input
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300"
                        placeholder="e.g. Recurrent since 2 months"
                        value={item.pastHistory || ''}
                        onChange={(e) => updateSymptom(index, 'pastHistory', e.target.value)}
                      />
                    </div>

                    {/* Remove */}
                    <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex items-end justify-center pt-5">
                      {symptoms.length > 1 && (
                        <button
                          type="button"
                          className="btn-secondary w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold py-2.5 flex items-center justify-center gap-1 cursor-pointer"
                          title="Remove Symptom"
                          onClick={() => removeSymptom(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Past History AND Diagnosis (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-3">
              <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" /> General Past History
              </h2>
              <textarea
                className="input w-full text-sm font-semibold text-gray-900 border-gray-300 h-28 resize-none"
                placeholder="Overall medical history, allergies, previous illnesses..."
                value={generalPastHistory}
                onChange={(e) => setGeneralPastHistory(e.target.value)}
              />
            </section>

            <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-3">
              <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-orange-600" /> Diagnosis / Remark
              </h2>
              <textarea
                className="input w-full text-sm font-bold text-gray-900 border-gray-300 h-28 resize-none"
                placeholder="Enter diagnosis or doctor notes for patient..."
                value={diagnosisRemark}
                onChange={(e) => setDiagnosisRemark(e.target.value)}
              />
            </section>
          </div>

          {/* 3. Lab Investigations AND Advice for Patient (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-orange-600" /> Lab Investigations & Reports
                  </h2>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-orange-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendToLab}
                      onChange={(e) => setSendToLab(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                    />
                    <FlaskConical className="h-4 w-4" />
                    <span>Send To Lab</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className="input w-full text-sm font-bold text-gray-900 border-gray-300"
                      placeholder="Search or type custom lab test & press Enter..."
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (testQuery.trim()) {
                            addTest(testQuery.trim());
                          }
                        }
                      }}
                    />

                    {testQuery.trim() && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-orange-300 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                        {/* Filtered existing tests & packages */}
                        {availableTests
                          .filter((item) => {
                            const name = typeof item === 'string' ? item : item.name;
                            return name.toLowerCase().includes(testQuery.toLowerCase()) && !selectedTests.includes(name);
                          })
                          .slice(0, 10)
                          .map((item) => {
                            const itemName = typeof item === 'string' ? item : item.name;
                            const isPkg = typeof item === 'object' && item.isPackage;
                            const cat = typeof item === 'object' ? item.category : 'LAB';
                            const price = typeof item === 'object' ? item.price : null;
                            const included = typeof item === 'object' && Array.isArray(item.tests) ? item.tests : [];

                            return (
                              <button
                                key={itemName}
                                type="button"
                                className="w-full text-left px-3 py-2 text-xs font-bold text-gray-800 hover:bg-orange-50 border-b border-gray-50 last:border-b-0 cursor-pointer flex items-center justify-between"
                                onClick={() => addTest(itemName)}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    {isPkg && (
                                      <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase">
                                        PACKAGE
                                      </span>
                                    )}
                                    <span className="font-extrabold text-gray-900 text-xs">{itemName}</span>
                                    {price !== null && price !== undefined && (
                                      <span className="text-gray-500 text-[11px] font-bold">
                                        (₹{price})
                                      </span>
                                    )}
                                  </div>
                                  {isPkg && included.length > 0 && (
                                    <span className="text-[10px] text-gray-500 font-normal mt-0.5">
                                      Includes: {included.map(t => t.testName || t.name || t.title).join(', ')}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                                  {cat || 'LAB'}
                                </span>
                              </button>
                            );
                          })}

                        {/* Custom Lab Test Add Option */}
                        {!selectedTests.includes(testQuery.trim()) && (
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2.5 text-xs font-extrabold text-orange-700 hover:bg-orange-100 border-t border-orange-100 cursor-pointer flex items-center justify-between bg-orange-50/90"
                            onClick={() => addTest(testQuery.trim())}
                          >
                            <span className="flex items-center gap-1.5">
                              <Plus className="h-4 w-4 text-orange-600 shrink-0" />
                              <span>Add "<strong className="underline text-orange-900">{testQuery.trim()}</strong>" as custom test</span>
                            </span>
                            <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded font-bold shrink-0">Press Enter or Click</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (testQuery.trim()) {
                        addTest(testQuery.trim());
                      }
                    }}
                    className="btn-secondary text-xs font-extrabold px-3.5 py-2 text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-300 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>

                {selectedTests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedTests.map((t) => {
                      const matchedItem = availableTests.find(item => (typeof item === 'object' ? item.name : item).toLowerCase() === t.toLowerCase());
                      const isPkg = matchedItem && typeof matchedItem === 'object' && matchedItem.isPackage;
                      return (
                        <span key={t} className="bg-orange-100 text-orange-950 px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border border-orange-200">
                          {isPkg && (
                            <span className="bg-orange-500 text-white text-[8px] font-black px-1 py-0.2 rounded uppercase">
                              PKG
                            </span>
                          )}
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => removeTest(t)}
                            className="text-orange-600 hover:text-orange-900 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-3">
              <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-600" /> Advice for Patient
              </h2>
              <textarea
                className="input w-full text-sm font-semibold text-gray-900 border-gray-300 h-28 resize-none"
                placeholder="Enter advice, dietary guidelines, or special instructions for patient..."
                value={patientAdvice}
                onChange={(e) => setPatientAdvice(e.target.value)}
              />
            </section>
          </div>

          {/* 4. Digital Rx / Prescription Medicines */}
          <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-orange-600" /> Digital Rx / Prescription Medicines
              </h2>
              <button
                type="button"
                onClick={addMedicineRow}
                className="btn-secondary text-xs sm:text-sm font-bold py-2 px-3 flex items-center gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-orange-600" /> Add Medicine Row
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-r from-orange-50/30 via-white to-blue-50/20 rounded-xl border border-orange-200/70 shadow-2xs"
                >
                  <div className="flex flex-wrap xl:flex-nowrap items-end gap-2.5">
                    
                    {/* 1. Medicine Name */}
                    <div className="flex-1 min-w-[200px] relative">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-xs sm:text-sm font-extrabold text-gray-800 uppercase">Medicine Name #{index + 1}</label>
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Stock Synced
                        </span>
                      </div>
                      <input
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300"
                        placeholder="Type medicine name (min. 3 chars)..."
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
                              className="w-full text-left px-3 py-2 text-sm font-bold border-b border-blue-50 flex items-center justify-between hover:bg-blue-50 text-gray-800 cursor-pointer"
                              onClick={() => selectMedSuggestion(mObj, index)}
                            >
                              <span className="font-bold">{mObj.name}</span>
                              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                Stock: {mObj.stock}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Dosage Form */}
                    <div className="w-28 shrink-0">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5">Form</label>
                      <select
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300 px-1.5"
                        value={med.dosageForm}
                        onChange={(e) => updateMedicine(index, 'dosageForm', e.target.value)}
                      >
                        {['Tablet', 'Syrup', 'Injection', 'Capsule', 'Ointment', 'Eye Drops', 'Drop', 'Cream', 'Gel', 'Powder', 'Lotion', 'Spray'].map(f => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Strength */}
                    <div className="w-22 shrink-0">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5">Strength</label>
                      <input
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300 text-center"
                        placeholder="500mg"
                        value={med.strength}
                        onChange={(e) => updateMedicine(index, 'strength', e.target.value)}
                      />
                    </div>

                    {/* 4. Dose */}
                    <div className="w-16 shrink-0">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5 text-center">Dose</label>
                      <input
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300 text-center px-1"
                        placeholder="1"
                        value={med.dose}
                        onChange={(e) => updateMedicine(index, 'dose', e.target.value)}
                      />
                    </div>

                    {/* 5. Timings (M-A-N) */}
                    <div className="shrink-0">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5">Timing (M-A-N)</label>
                      <div className="flex items-center justify-between gap-2 py-1.5 px-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold">
                        <label className="flex items-center gap-1 cursor-pointer select-none text-gray-900 hover:text-orange-600">
                          <input
                            type="checkbox"
                            checked={med.morning}
                            onChange={() => toggleTiming(index, 'morning')}
                            className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="text-xs sm:text-sm font-extrabold">Morning</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-gray-900 hover:text-orange-600">
                          <input
                            type="checkbox"
                            checked={med.afternoon}
                            onChange={() => toggleTiming(index, 'afternoon')}
                            className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="text-xs sm:text-sm font-extrabold">Afternoon</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-gray-900 hover:text-orange-600">
                          <input
                            type="checkbox"
                            checked={med.night}
                            onChange={() => toggleTiming(index, 'night')}
                            className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="text-xs sm:text-sm font-extrabold">Night</span>
                        </label>
                      </div>
                    </div>

                    {/* 6. Duration (Days) */}
                    <div className="w-16 shrink-0">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5 text-center">Days</label>
                      <input
                        type="number"
                        min="1"
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300 text-center px-1"
                        placeholder="5"
                        value={med.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      />
                    </div>

                    {/* 7. Total Qty */}
                    <div className="w-18 shrink-0">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5 text-center">Qty</label>
                      {String(med.dosageForm || 'Tablet').toLowerCase() === 'tablet' ? (
                        <div
                          className="input w-full text-sm font-black text-gray-950 bg-gray-100 border-gray-300 flex items-center justify-center py-2 px-1 text-center cursor-not-allowed select-none"
                          title="Tablet quantity is automatically calculated"
                        >
                          {calculateQty(med)}
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          className="input w-full text-sm font-black text-blue-900 bg-blue-50/80 border-blue-300 focus:border-blue-500 text-center px-1"
                          placeholder="Qty"
                          value={med.customQty !== undefined && med.customQty !== '' ? med.customQty : (med.qty || 1)}
                          onChange={(e) => updateMedicine(index, 'customQty', e.target.value)}
                        />
                      )}
                    </div>

                    {/* 8. Instructions / Remarks */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5">Special Instructions / Remarks</label>
                      <input
                        className="input w-full text-sm font-semibold text-gray-900 border-gray-300"
                        placeholder="e.g. Take after food with warm water"
                        value={med.remarks}
                        onChange={(e) => updateMedicine(index, 'remarks', e.target.value)}
                      />
                    </div>

                    {/* 9. Remove Row */}
                    <div className="shrink-0 pb-0.5">
                      <button
                        type="button"
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
                        title="Remove Medicine"
                        onClick={() => removeMedicineRow(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Follow-up Scheduling & Actions */}
          <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">
              Follow-up Scheduling & Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Follow-up Date</label>
                <input
                  type="date"
                  className="input w-full text-sm font-bold text-gray-900 border-gray-300"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Follow-up Instructions</label>
                <input
                  className="input w-full text-sm font-bold text-gray-900 border-gray-300"
                  placeholder="e.g. Check BP, review blood reports"
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                />
              </div>
            </div>

            {/* Standard Doctor Action Buttons */}
            <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowLangModal(true)}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black py-2.5 px-5 flex items-center gap-2 cursor-pointer shadow-md rounded-xl disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" /> {saving ? 'Saving...' : 'Save & Print Prescription'}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAndShareWhatsApp}
                  className="btn bg-green-600 hover:bg-green-700 text-white text-sm font-black py-2.5 px-5 flex items-center gap-2 cursor-pointer shadow-md rounded-xl disabled:opacity-50"
                >
                  <MessageCircle className="h-4 w-4" /> Save & Share via WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="btn bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer shadow-md rounded-xl transition-colors"
                >
                  <X className="h-4 w-4 text-white" /> Close Consultation
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* Right Sticky Summary Sidebar (2 Columns) */}
        {showRightPanel && (
          <div className="lg:col-span-3 xl:col-span-2 space-y-3.5 lg:sticky lg:top-4 transition-all duration-300 w-full">
            
            {/* Card 0: Patient Info */}
            <div className="card p-3 bg-gradient-to-b from-orange-50/90 via-white to-orange-50/50 border border-orange-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-orange-100 pb-1">
                <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider">{formatUhid(patient?.uhid)}</span>
                <button
                  type="button"
                  onClick={() => setShowRightPanel(false)}
                  className="p-0.5 text-gray-400 hover:text-orange-600 rounded transition-colors cursor-pointer"
                  title="Hide Side Panel"
                >
                  <PanelRightClose className="h-4 w-4 text-orange-600" />
                </button>
              </div>
              
              <div>
                <h2 className="text-base font-black text-gray-900 leading-tight">{patient?.patientName}</h2>
                <p className="text-[11px] font-semibold text-gray-600 mt-0.5">
                  {patient?.gender} • {patient?.mobile}
                </p>
                <p className="text-[10px] font-bold text-orange-700 mt-0.5">
                  {formatDate(patient?.appointmentDate)} ({patient?.slot || 'Walk-in'})
                </p>
                {previousConsultation && (
                  <span className="mt-1 bg-purple-100 text-purple-800 border border-purple-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <History className="h-3 w-3" /> Follow-up Patient
                  </span>
                )}
              </div>
            </div>

            {/* Card 1: Vitals Summary with Edit Toggle */}
            <div className="card p-3.5 bg-white border border-gray-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-orange-600" /> Vitals
                </span>
                <button
                  type="button"
                  className="text-xs font-extrabold text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 cursor-pointer"
                  onClick={() => setIsEditingVitals(!isEditingVitals)}
                >
                  {isEditingVitals ? 'Done' : 'Edit'}
                </button>
              </div>

              {isEditingVitals ? (
                <div className="space-y-1.5 text-xs font-bold">
                  <div>
                    <label className="text-[10px] text-gray-500">Weight (kg)</label>
                    <input
                      type="number"
                      value={vitals.weight}
                      onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      className="input w-full px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Height (cm)</label>
                    <input
                      type="number"
                      value={vitals.height}
                      onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                      className="input w-full px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">BP (mmHg)</label>
                    <input
                      value={vitals.bloodPressure}
                      onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                      className="input w-full px-2 py-1 text-xs"
                      placeholder="120/80"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Temp (°F)</label>
                    <input
                      value={vitals.temperature}
                      onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                      className="input w-full px-2 py-1 text-xs"
                      placeholder="98.6"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Pulse (bpm)</label>
                    <input
                      value={vitals.pulse}
                      onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                      className="input w-full px-2 py-1 text-xs"
                      placeholder="72"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">SpO2 (%)</label>
                    <input
                      value={vitals.spo2}
                      onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                      className="input w-full px-2 py-1 text-xs"
                      placeholder="99"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs sm:text-sm font-extrabold text-gray-800">
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-black text-gray-950">{vitals.weight || '-'} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-600">Height:</span>
                    <span className="font-black text-gray-950">{vitals.height || '-'} cm</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-600">BP:</span>
                    <span className="font-black text-gray-950">{vitals.bloodPressure || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-600">Temp:</span>
                    <span className="font-black text-gray-950">{vitals.temperature || '-'} °F</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-600">Pulse:</span>
                    <span className="font-black text-gray-950">{vitals.pulse || '-'} bpm</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-600">SpO2:</span>
                    <span className="font-black text-gray-950">{vitals.spo2 || '-'} %</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">BMI:</span>
                    <span className="font-black text-orange-600">{vitals.bmi || '-'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Symptoms Summary */}
            <div className="card p-3.5 bg-white border border-gray-200/80 shadow-xs space-y-2.5">
              <div className="border-b border-gray-100 pb-2">
                <span className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-orange-600" /> Symptoms ({symptoms.filter(s => s.symptom).length})
                </span>
              </div>
              <div className="space-y-1">
                {symptoms.filter(s => s.symptom).map((s, idx) => (
                  <div key={idx} className="text-xs font-bold text-gray-800 bg-orange-50/60 px-2.5 py-1.5 rounded-lg border border-orange-100">
                    {s.symptom} <span className="text-[10px] text-gray-500 font-semibold">({s.durationDays} {s.durationUnit})</span>
                  </div>
                ))}
                {symptoms.filter(s => s.symptom).length === 0 && (
                  <span className="text-xs text-gray-400 italic">None entered</span>
                )}
              </div>
            </div>

            {/* Card 3: Prescription Print & Preview Actions */}
            <div className="card p-3.5 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/60 border border-orange-200/80 shadow-xs space-y-2.5">
              <div className="border-b border-orange-100 pb-2">
                <span className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="h-4 w-4 text-orange-600" /> Print & Preview Rx
                </span>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowLangModal(true)}
                  className="w-full btn bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Printer className="h-4 w-4" /> Print Rx PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full btn-secondary bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5 text-orange-600" /> Preview Prescription
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Hidden Receipt for Direct PDF Generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '210mm', minHeight: '297mm', background: '#ffffff', zIndex: -9999, pointerEvents: 'none' }}>
        <div ref={receiptRef} style={{ width: '210mm', minHeight: '297mm', background: '#ffffff' }}>
          <PatientReceipt
            patient={receiptPatientData}
            prescription={receiptPrescriptionData}
            language={language}
            printOptions={printOptions}
          />
        </div>
      </div>

      {/* Prescription Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:m-0 print:static print:bg-transparent print:backdrop-blur-none">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full print:max-h-none print:overflow-visible print:bg-transparent print:p-0 print:m-0">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gray-50/90 no-print print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-black text-gray-900">Prescription Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setShowLangModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Rx
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/90 flex justify-center print:p-0 print:m-0 print:bg-transparent print:overflow-visible">
              <div className="shadow-2xl bg-white rounded-none border-none overflow-hidden print:shadow-none print:border-none print:rounded-none" style={{ width: '210mm', minHeight: '297mm' }}>
                <PatientReceipt
                  patient={receiptPatientData}
                  prescription={receiptPrescriptionData}
                  language={language}
                  printOptions={printOptions}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      <PrintLanguageModal
        isOpen={showLangModal}
        onClose={() => setShowLangModal(false)}
        onConfirm={(chosenLang) => {
          setLanguage(chosenLang);
          handleSaveAndPrint(chosenLang);
        }}
        initialLanguage={language}
      />
    </div>
  );
}
