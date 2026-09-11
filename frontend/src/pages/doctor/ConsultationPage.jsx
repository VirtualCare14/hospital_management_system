import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  FlaskConical, Plus, Save, Send, Scissors, X, ShieldAlert, Stethoscope,
  History, Activity, ChevronDown, ChevronUp, FileText, Pill, Printer, Download, Eye, Copy, Clock, Trash2,
  PanelRightClose, PanelRightOpen, ClipboardList
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { durationUnits, languages } from '../../utils/options';
import { formatDate } from '../../utils/dateFormat';
import { sanitizeClonedDocumentForPdf, openPdfPrintWindow } from '../../utils/pdfUtils';
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

const ConsultationPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const receiptRef = useRef(null);

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [symptoms, setSymptoms] = useState([{ symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' }]);
  const [isVitalsEditable, setIsVitalsEditable] = useState(false);
  const [showVitalsSection, setShowVitalsSection] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSymptomIndex, setActiveSymptomIndex] = useState(null);
  const [symptomHighlightedIndex, setSymptomHighlightedIndex] = useState(-1);
  const [selectedTests, setSelectedTests] = useState([]);
  const [newTest, setNewTest] = useState('');
  const [testQuery, setTestQuery] = useState('');
  const [availableTests, setAvailableTests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sendingToIpd, setSendingToIpd] = useState(false);
  const [referralSent, setReferralSent] = useState(false);
  const [generalPastHistory, setGeneralPastHistory] = useState('');
  const [diagnosisRemark, setDiagnosisRemark] = useState('');
  const [patientAdvice, setPatientAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpRemarks, setFollowUpRemarks] = useState('');
  const [visitId, setVisitId] = useState(null);
  const [previousConsultation, setPreviousConsultation] = useState(null);
  const [latestPastPrescription, setLatestPastPrescription] = useState(null);
  const [pastPrescriptions, setPastPrescriptions] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [subServices, setSubServices] = useState([]);
  const [showSameDayModal, setShowSameDayModal] = useState(false);
  const [sdCareType, setSdCareType] = useState('');
  const [sdSelectedDocId, setSdSelectedDocId] = useState('');
  const [sdRemarks, setSdRemarks] = useState('');
  const [sdDoctors, setSdDoctors] = useState([]);
  const [loadingSdDoctors, setLoadingSdDoctors] = useState(false);

  // Referral Checkbox States
  const [sendToIpdChecked, setSendToIpdChecked] = useState(false);
  const [sendToSameDayChecked, setSendToSameDayChecked] = useState(false);
  const [referToOtChecked, setReferToOtChecked] = useState(false);

  // Prescription & Medicines States
  const [language, setLanguage] = useState('English');
  const [showPreview, setShowPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditVitalsModal, setShowEditVitalsModal] = useState(false);
  const [showEditPrintModal, setShowEditPrintModal] = useState(false);
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
  const [pharmacyMedicines, setPharmacyMedicines] = useState([]);
  const [activeMedIndex, setActiveMedIndex] = useState(null);
  const [medSuggestions, setMedSuggestions] = useState([]);
  const [medHighlightedIndex, setMedHighlightedIndex] = useState(-1);
  const [medicines, setMedicines] = useState([
    { medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food', qty: 0 }
  ]);

  const { register, handleSubmit, reset, watch } = useForm();
  const isReadOnly = Boolean(patient?.isDischarged || isSaved);

  // Fetch Pharmacy Inventory Medicines
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

  useEffect(() => {
    if (showSameDayModal) {
      setLoadingSdDoctors(true);
      client.get('/admin/doctors')
        .then(({ data }) => setSdDoctors(data || []))
        .catch(err => {
          console.error(err);
          toast.error("Failed to load Same Day Care providers list");
        })
        .finally(() => setLoadingSdDoctors(false));
    }
  }, [showSameDayModal]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [patientRes, consultationsRes, visitsRes, prescriptionRes] = await Promise.allSettled([
          client.get(`/patients/${patientId}`),
          client.get(`/consultation/${patientId}`),
          client.get(`/patients/${patientId}/visits`),
          client.get(`/prescription/${patientId}`)
        ]);

        let completedConsultation = null;
        if (consultationsRes.status === 'fulfilled' && consultationsRes.value.data?.length > 0) {
          completedConsultation = consultationsRes.value.data.find(c => c.consultationStatus === 'completed') || consultationsRes.value.data[0];
          if (completedConsultation) setPreviousConsultation(completedConsultation);
        }

        if (patientRes.status === 'fulfilled') {
          const patientObj = patientRes.value.data;
          setPatient(patientObj);
          
          const vitalsData = completedConsultation?.vitals || patientObj.demographics || {};
          reset({
            weight: vitalsData.weight || '',
            height: vitalsData.height || '',
            temperature: vitalsData.temperature || '',
            bloodPressure: vitalsData.bloodPressure || '',
            bmi: vitalsData.bmi || '',
            drugAllergy: vitalsData.drugAllergy || ''
          });
        }

        if (completedConsultation) {
          if (completedConsultation.symptoms && completedConsultation.symptoms.length > 0) {
            setSymptoms(completedConsultation.symptoms.map(s => ({
              symptom: s.symptom || '',
              durationDays: s.durationDays || '',
              durationUnit: s.durationUnit || 'Days',
              pastHistory: s.pastHistory || '',
              remarks: s.remarks || ''
            })));
          }
          if (completedConsultation.generalPastHistory) {
            setGeneralPastHistory(completedConsultation.generalPastHistory);
          }
          if (completedConsultation.diagnosisRemark) {
            setDiagnosisRemark(completedConsultation.diagnosisRemark);
          }
          if (completedConsultation.tests && completedConsultation.tests.length > 0) {
            setSelectedTests(completedConsultation.tests);
          }
          if (completedConsultation.followUpDate) {
            setFollowUpDate(completedConsultation.followUpDate);
          }
          if (completedConsultation.followUpRemarks) {
            setFollowUpRemarks(completedConsultation.followUpRemarks);
          }
        }

        if (visitsRes.status === 'fulfilled' && visitsRes.value.data?.length > 0) {
          setVisitId(visitsRes.value.data[0]._id);
        }

        if (prescriptionRes.status === 'fulfilled' && prescriptionRes.value.data) {
          const rawPx = prescriptionRes.value.data;
          const pxList = Array.isArray(rawPx) ? rawPx : (rawPx ? [rawPx] : []);
          setPastPrescriptions(pxList);

          const rxWithMeds = pxList.find(p => Array.isArray(p.medicines) && p.medicines.length > 0) || pxList[0] || null;
          setLatestPastPrescription(rxWithMeds);

          if (rxWithMeds && Array.isArray(rxWithMeds.medicines) && rxWithMeds.medicines.length > 0) {
            const formattedMeds = rxWithMeds.medicines.map(m => ({
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
            setMedicines(formattedMeds);
          }
          if (rxWithMeds?.language) {
            setLanguage(rxWithMeds.language);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patientId, reset]);

  useEffect(() => {
    Promise.allSettled([
      client.get('/lab/tests'),
      client.get('/lab/packages')
    ]).then(([testsRes, pkgsRes]) => {
      const testsData = testsRes.status === 'fulfilled' && Array.isArray(testsRes.value.data) ? testsRes.value.data : [];
      const pkgsData = pkgsRes.status === 'fulfilled' && Array.isArray(pkgsRes.value.data) ? pkgsRes.value.data : [];

      const mappedPkgs = pkgsData.filter(p => p.status !== 'Inactive').map(p => ({
        name: p.name,
        category: (p.category || 'LAB').toUpperCase(),
        isPackage: true,
        price: p.price,
        code: p.code,
        tests: p.tests || []
      }));

      const mappedTests = testsData.map(t => ({
        name: t.test || t.title,
        category: (t.category || 'LAB').toUpperCase(),
        isPackage: false,
        price: t.basePrice || t.totalAmount
      })).filter(t => Boolean(t.name));

      // Merge avoiding duplicate names
      const seen = new Set();
      const combined = [];
      [...mappedPkgs, ...mappedTests].forEach(item => {
        if (!seen.has(item.name.toLowerCase())) {
          seen.add(item.name.toLowerCase());
          combined.push(item);
        }
      });
      setAvailableTests(combined);
    }).catch(() => setAvailableTests([]));

    client.get('/ipd/settings').then(({ data }) => {
      const list = [];
      if (data?.sameDayCareCategories) {
        data.sameDayCareCategories.forEach(cat => {
          if (cat.isActive !== false) {
            cat.subServices.forEach(sub => {
              if (sub.isActive !== false) list.push(sub.name);
            });
          }
        });
      }
      setSubServices(list.length > 0 ? list : ['Fracture', 'Minor Injury', 'Minor Stitches', 'Small Burns', 'Mild Allergic Reactions', 'Dialysis']);
    }).catch(() => {
      setSubServices(['Fracture', 'Minor Injury', 'Minor Stitches', 'Small Burns', 'Mild Allergic Reactions', 'Dialysis']);
    });
  }, []);

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);

    if (field === 'medicine') {
      setActiveMedIndex(index);
      setMedHighlightedIndex(-1);
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
    setMedHighlightedIndex(-1);
  };

  const handleMedKeyDown = (e, index) => {
    if (activeMedIndex !== index || !medSuggestions || medSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMedHighlightedIndex((prevIndex) => (
        prevIndex < medSuggestions.length - 1 ? prevIndex + 1 : 0
      ));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMedHighlightedIndex((prevIndex) => (
        prevIndex > 0 ? prevIndex - 1 : medSuggestions.length - 1
      ));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (medHighlightedIndex >= 0 && medHighlightedIndex < medSuggestions.length) {
        e.preventDefault();
        selectMedicineSuggestion(medSuggestions[medHighlightedIndex], index);
      }
    } else if (e.key === 'Escape') {
      setMedSuggestions([]);
      setActiveMedIndex(null);
      setMedHighlightedIndex(-1);
    }
  };

  const toggleTiming = (index, timing) => {
    const updated = [...medicines];
    updated[index][timing] = !updated[index][timing];
    setMedicines(updated);
  };

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
    let timingsCount = 0;
    if (med.morning) timingsCount += 1;
    if (med.afternoon) timingsCount += 1;
    if (med.night) timingsCount += 1;
    if (timingsCount === 0) timingsCount = 1;
    return Math.ceil(doseNum * timingsCount * durationNum);
  };

  const addMedicineRow = () => {
    setMedicines([
      ...medicines,
      { medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food', qty: 0, customQty: '' }
    ]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length === 1) {
      setMedicines([{ medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food', qty: 0 }]);
      return;
    }
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleCopyPreviousMedicines = (rxMeds) => {
    if (!rxMeds || rxMeds.length === 0) {
      toast.error("No previous medicines found to copy");
      return;
    }
    const formatted = rxMeds.map(m => ({
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
    toast.success(`${formatted.length} previous medicine(s) pre-filled!`);
  };

  const handleContinuePreviousMedicines = () => {
    let prevMeds = [];

    // 1. Try from latestPastPrescription (object)
    if (latestPastPrescription && Array.isArray(latestPastPrescription.medicines) && latestPastPrescription.medicines.length > 0) {
      prevMeds = latestPastPrescription.medicines;
    } 
    // 2. Try from pastPrescriptions list
    else if (pastPrescriptions && pastPrescriptions.length > 0) {
      const rxMatch = pastPrescriptions.find(p => Array.isArray(p.medicines) && p.medicines.length > 0);
      if (rxMatch) {
        prevMeds = rxMatch.medicines;
      }
    }

    // 3. Try from previousConsultation
    if (!prevMeds || prevMeds.length === 0) {
      if (previousConsultation?.medicines?.length > 0) {
        prevMeds = previousConsultation.medicines;
      } else if (previousConsultation?.prescription?.medicines?.length > 0) {
        prevMeds = previousConsultation.prescription.medicines;
      }
    }

    if (!prevMeds || prevMeds.length === 0) {
      toast.error('No previous prescription medicines found for this patient.');
      return;
    }

    const formattedMeds = prevMeds.map(m => ({
      medicine: m.medicine || m.name || m.drugName || '',
      dosageForm: m.dosageForm || 'Tablet',
      strength: m.strength || '',
      dose: m.dose !== undefined && m.dose !== null ? String(m.dose) : '1',
      morning: m.morning !== undefined ? Boolean(m.morning) : true,
      afternoon: m.afternoon !== undefined ? Boolean(m.afternoon) : false,
      night: m.night !== undefined ? Boolean(m.night) : true,
      duration: m.duration !== undefined && m.duration !== null ? String(m.duration) : '5',
      remarks: m.remarks || 'After food',
      qty: m.qty || 0
    }));

    setMedicines(formattedMeds);
    toast.success(`Loaded ${formattedMeds.length} medicine(s) from previous prescription!`);
  };

  const buildPrescriptionDataForPrint = () => {
    const validMeds = medicines.filter(m => m.medicine && m.medicine.trim()).map(m => ({
      ...m,
      qty: calculateQty(m)
    }));

    const formVitals = watch();
    const mergedVitals = {
      weight: formVitals.weight || patient?.demographics?.weight || previousConsultation?.vitals?.weight,
      height: formVitals.height || patient?.demographics?.height || previousConsultation?.vitals?.height,
      temperature: formVitals.temperature || patient?.demographics?.temperature || previousConsultation?.vitals?.temperature,
      bloodPressure: formVitals.bloodPressure || patient?.demographics?.bloodPressure || previousConsultation?.vitals?.bloodPressure,
      bmi: formVitals.bmi || patient?.demographics?.bmi || previousConsultation?.vitals?.bmi,
      drugAllergy: formVitals.drugAllergy || patient?.demographics?.drugAllergy || previousConsultation?.vitals?.drugAllergy
    };

    const mergedSymptoms = [
      ...(printOptions.printPreviousHistory ? (previousConsultation?.symptoms || []) : []),
      ...symptoms.filter((item) => item.symptom).map((item) => ({ 
        symptom: item.symptom, 
        durationDays: item.durationDays || 0,
        durationUnit: item.durationUnit,
        pastHistory: item.pastHistory,
        remarks: item.remarks
      }))
    ];

    const mergedDiagnosisRemark = [
      diagnosisRemark,
      printOptions.printPreviousHistory ? previousConsultation?.diagnosisRemark : null
    ].filter(Boolean).join('\n\n');

    const mergedTests = [
      ...(printOptions.printPreviousHistory ? (previousConsultation?.tests || []) : []),
      ...selectedTests
    ];

    const mergedPastHistory = printOptions.printPreviousHistory
      ? [previousConsultation?.generalPastHistory, generalPastHistory].filter(Boolean).join('\n')
      : generalPastHistory;

    return {
      _id: 'draft-rx',
      consultationId: previousConsultation?._id || 'draft-cons',
      patientId: patient?._id,
      doctorName: user?.doctorName || user?.username || 'Doctor',
      language: typeof language === 'object' ? language.value : language,
      medicines: validMeds,
      vitals: mergedVitals,
      symptoms: mergedSymptoms,
      diagnosisRemark: mergedDiagnosisRemark,
      patientAdvice: patientAdvice,
      tests: mergedTests,
      pastHistory: mergedPastHistory,
      followUpDate: followUpDate || previousConsultation?.followUpDate,
      followUpRemarks: followUpRemarks || previousConsultation?.followUpRemarks,
      printOptions,
      createdAt: new Date().toISOString()
    };
  };

  const buildPatientDataForReceipt = () => {
    const formVitals = watch();
    const mergedVitals = {
      weight: formVitals.weight || patient?.demographics?.weight || previousConsultation?.vitals?.weight,
      height: formVitals.height || patient?.demographics?.height || previousConsultation?.vitals?.height,
      temperature: formVitals.temperature || patient?.demographics?.temperature || previousConsultation?.vitals?.temperature,
      bloodPressure: formVitals.bloodPressure || patient?.demographics?.bloodPressure || previousConsultation?.vitals?.bloodPressure,
      bmi: formVitals.bmi || patient?.demographics?.bmi || previousConsultation?.vitals?.bmi,
      drugAllergy: formVitals.drugAllergy || patient?.demographics?.drugAllergy || previousConsultation?.vitals?.drugAllergy
    };

    return {
      ...patient,
      department: patient?.department || user?.department || previousConsultation?.department || 'OPD',
      appointmentDate: patient?.appointmentDate || previousConsultation?.appointmentDate || patient?.createdAt || new Date().toISOString(),
      slot: patient?.slot || previousConsultation?.slot || '',
      registrationNumber: patient?.registrationNumber || previousConsultation?.registrationNumber || '-',
      address: patient?.address || 'Not specified',
      demographics: mergedVitals,
      doctorId: { 
        doctorName: user?.doctorName || user?.username || 'Doctor', 
        username: user?.username,
        department: user?.department || patient?.department || 'OPD'
      }
    };
  };

  const handleDirectPdfPrint = async (chosenLang) => {
    const activeLang = chosenLang || (typeof language === 'object' ? language.value : (language || 'English'));
    const toastId = toast.loading(`Generating PDF Prescription (${activeLang})...`);
    try {
      const element = receiptRef.current;
      if (!element) {
        toast.error('Print template not ready', { id: toastId });
        return;
      }
      const canvas = await html2canvas(element, {
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
      toast.success(`Prescription Printed (${activeLang})!`);
    } catch (err) {
      console.error('PDF print error:', err);
      toast.dismiss(toastId);
      toast.error('Error generating print view');
    }
  };

  const updateSymptom = async (index, field, value) => {
    const next = symptoms.map((item, idx) => idx === index ? { ...item, [field]: value } : item);
    setSymptoms(next);

    if (field === 'symptom') {
      setActiveSymptomIndex(index);
      setSymptomHighlightedIndex(-1);
      if (value && value.length >= 1) {
        try {
          const { data } = await client.get(`/consultation/symptoms/autocomplete?q=${encodeURIComponent(value)}`);
          setSuggestions(data || []);
        } catch (error) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }
  };

  const selectSuggestion = (suggestion, index) => {
    const next = symptoms.map((item, idx) => idx === index ? { ...item, symptom: suggestion } : item);
    setSymptoms(next);
    setSuggestions([]);
    setActiveSymptomIndex(null);
    setSymptomHighlightedIndex(-1);
  };

  const handleSymptomKeyDown = (e, index) => {
    if (activeSymptomIndex !== index || !suggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSymptomHighlightedIndex((prevIndex) => (
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
      ));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSymptomHighlightedIndex((prevIndex) => (
        prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
      ));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (symptomHighlightedIndex >= 0 && symptomHighlightedIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[symptomHighlightedIndex], index);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setActiveSymptomIndex(null);
      setSymptomHighlightedIndex(-1);
    }
  };

  const addSymptom = () => {
    const last = symptoms[symptoms.length - 1];
    if (symptoms.length > 0 && (!last?.symptom || !last.symptom.trim())) {
      toast.error('Please enter symptom name before adding another row.');
      return;
    }
    setSymptoms([...symptoms, { symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' }]);
  };

  const removeSymptom = (index) => {
    if (symptoms.length > 1) {
      setSymptoms(symptoms.filter((_, idx) => idx !== index));
    }
  };

  const selectTest = (test) => {
    if (!test) return;
    setSelectedTests((current) => current.includes(test) ? current : [...current, test]);
    setTestQuery('');
  };

  const removeSelectedTest = (test) => {
    setSelectedTests((current) => current.filter((item) => item !== test));
  };
  const removeTest = removeSelectedTest;

  const addTest = () => {
    if (newTest.trim()) {
      setSelectedTests((current) => [...new Set([...current, newTest.trim()])]);
      setNewTest('');
    }
  };

  const prescriptionData = latestPastPrescription;
  const handlePrescriptionAction = (action) => {
    navigate(`/doctor/prescription/${patientId}?action=${action}`);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const mergedSymptoms = [
        ...(printOptions.printPreviousHistory ? (previousConsultation?.symptoms || []) : []),
        ...symptoms.filter((item) => item.symptom).map((item) => ({ 
          symptom: item.symptom, 
          durationDays: item.durationDays || 0,
          durationUnit: item.durationUnit,
          pastHistory: item.pastHistory,
          remarks: item.remarks
        }))
      ];

      const mergedPastHistory = printOptions.printPreviousHistory
        ? [previousConsultation?.generalPastHistory, generalPastHistory].filter(Boolean).join('\n')
        : generalPastHistory;

      const mergedDiagnosisRemark = printOptions.printPreviousHistory
        ? [previousConsultation?.diagnosisRemark, diagnosisRemark].filter(Boolean).join('\n')
        : diagnosisRemark;

      const mergedVitals = {
        weight: data.weight || previousConsultation?.vitals?.weight,
        height: data.height || previousConsultation?.vitals?.height,
        temperature: data.temperature || previousConsultation?.vitals?.temperature,
        bmi: data.bmi || previousConsultation?.vitals?.bmi,
        drugAllergy: data.drugAllergy || previousConsultation?.vitals?.drugAllergy,
        bloodPressure: data.bloodPressure || previousConsultation?.vitals?.bloodPressure
      };

      const mergedTests = [
        ...(printOptions.printPreviousHistory ? (previousConsultation?.tests || []) : []),
        ...selectedTests
      ];

      const consultationPayload = {
        patientId,
        visitId,
        symptoms: mergedSymptoms,
        pastHistory: mergedPastHistory,
        diagnosisRemark: mergedDiagnosisRemark,
        vitals: mergedVitals,
        tests: mergedTests,
        sendToLab: data.sendToLab,
        followUpDate: followUpDate || previousConsultation?.followUpDate,
        followUpRemarks: followUpRemarks || previousConsultation?.followUpRemarks
      };

      const { data: consRes } = await client.post('/consultation/create', consultationPayload);

      const validMedicines = medicines.filter(m => m.medicine && m.medicine.trim());
      if (validMedicines.length > 0) {
        const rxPayload = {
          patientId,
          consultationId: consRes?.consultation?._id || consRes?._id || previousConsultation?._id,
          medicines: validMedicines.map(m => ({
            ...m,
            qty: calculateQty(m)
          })),
          language: typeof language === 'object' ? language.value : language
        };
        await client.post('/prescription/create', rxPayload);
      }

      toast.success(data.sendToLab ? 'Consultation & Prescription saved and sent to lab' : 'Consultation & Prescription saved successfully');
      navigate('/doctor');
    } catch (error) {
      console.error('Saving failed:', error);
      toast.error(error.response?.data?.message || 'Unable to save consultation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const [showLangModal, setShowLangModal] = useState(false);

  const handleSaveAndPrintClick = () => {
    setShowLangModal(true);
  };

  const handleSaveAndPrint = async (selectedLanguage) => {
    const activeLang = selectedLanguage || (typeof language === 'object' ? language.value : language) || 'English';
    setLanguage(activeLang);

    setSaving(true);
    try {
      const formValues = watch();
      const mergedSymptoms = [
        ...(printOptions.printPreviousHistory ? (previousConsultation?.symptoms || []) : []),
        ...symptoms.filter((item) => item.symptom).map((item) => ({ 
          symptom: item.symptom, 
          durationDays: item.durationDays || 0,
          durationUnit: item.durationUnit,
          pastHistory: item.pastHistory,
          remarks: item.remarks
        }))
      ];

      const mergedPastHistory = printOptions.printPreviousHistory
        ? [previousConsultation?.generalPastHistory, generalPastHistory].filter(Boolean).join('\n')
        : generalPastHistory;

      const mergedDiagnosisRemark = printOptions.printPreviousHistory
        ? [previousConsultation?.diagnosisRemark, diagnosisRemark].filter(Boolean).join('\n')
        : diagnosisRemark;

      const mergedVitals = {
        weight: formValues.weight || previousConsultation?.vitals?.weight,
        height: formValues.height || previousConsultation?.vitals?.height,
        temperature: formValues.temperature || previousConsultation?.vitals?.temperature,
        bmi: formValues.bmi || previousConsultation?.vitals?.bmi,
        drugAllergy: formValues.drugAllergy || previousConsultation?.vitals?.drugAllergy,
        bloodPressure: formValues.bloodPressure || previousConsultation?.vitals?.bloodPressure
      };

      const mergedTests = [
        ...(printOptions.printPreviousHistory ? (previousConsultation?.tests || []) : []),
        ...selectedTests
      ];

      const consultationPayload = {
        patientId,
        visitId,
        symptoms: mergedSymptoms,
        pastHistory: mergedPastHistory,
        diagnosisRemark: mergedDiagnosisRemark,
        vitals: mergedVitals,
        tests: mergedTests,
        sendToLab: formValues.sendToLab,
        followUpDate: followUpDate || previousConsultation?.followUpDate,
        followUpRemarks: followUpRemarks || previousConsultation?.followUpRemarks
      };

      const { data: consRes } = await client.post('/consultation/create', consultationPayload);

      const validMedicines = medicines.filter(m => m.medicine && m.medicine.trim());
      if (validMedicines.length > 0) {
        const rxPayload = {
          patientId,
          consultationId: consRes?.consultation?._id || consRes?._id || previousConsultation?._id,
          medicines: validMedicines.map(m => ({
            ...m,
            qty: calculateQty(m)
          })),
          language: activeLang
        };
        await client.post('/prescription/create', rxPayload);
      }

      setIsSaved(true);

      // Process selected referral module after saving
      if (sendToIpdChecked && !referralSent) {
        await handleSendToIpd();
      } else if (referToOtChecked) {
        const defaultNotes = `Referred to OT by Dr. ${user?.doctorName || user?.username || 'Doctor'}. Diagnosis: ${diagnosisRemark || 'N/A'}`;
        const customRemarks = window.prompt("Enter remarks for OT Referral:", defaultNotes);
        if (customRemarks !== null) {
          try {
            await client.post('/ipd/referrals', { patientId: patient._id, notes: customRemarks });
            toast.success(`${patient.patientName} referred to OT successfully!`);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send to OT');
          }
        }
      } else if (sendToSameDayChecked) {
        handleSendToSameDayOpen();
      }

      setShowPreview(true);
      const toastId = toast.loading(`Generating PDF Prescription (${activeLang})...`);

      setTimeout(async () => {
        try {
          const element = receiptRef.current;
          if (!element) {
            toast.error('Print template not ready', { id: toastId });
            return;
          }

          const canvas = await html2canvas(element, {
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
          toast.success(`Consultation & Prescription saved and printed (${activeLang})!`);
        } catch (printErr) {
          console.error("PDF generation failed", printErr);
          toast.dismiss(toastId);
          toast.error("Failed to generate PDF receipt");
        } finally {
          if (!sendToSameDayChecked) {
            setTimeout(() => {
              navigate('/doctor');
            }, 800);
          }
        }
      }, 350);

    } catch (error) {
      console.error('Saving failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToIpd = async () => {
    if (!patient) return;
    const defaultNotes = `Referred from OPD by Dr. ${user?.doctorName || user?.username || 'Doctor'}. Diagnosis: ${diagnosisRemark || 'N/A'}`;
    const customRemarks = window.prompt("Enter remarks for IPD Referral:", defaultNotes);
    if (customRemarks === null) return;

    setSendingToIpd(true);
    try {
      await client.post('/ipd/referrals', { patientId: patient._id, notes: customRemarks });
      toast.success(`${patient.patientName} referred to IPD successfully!`);
      setReferralSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send to IPD');
    } finally {
      setSendingToIpd(false);
    }
  };

  const handleSendToSameDayOpen = () => {
    if (!patient) return;
    setSdCareType('');
    setSdSelectedDocId('');
    setSdRemarks(`Referred to Same Day Care by Dr. ${user?.doctorName || user?.username || 'Doctor'}.`);
    setShowSameDayModal(true);
  };

  const handleSendToSameDaySubmit = async (e) => {
    e.preventDefault();
    if (!sdCareType) {
      toast.error('Please select care type');
      return;
    }
    const chosenDoc = sdDoctors.find(d => d._id === sdSelectedDocId);
    try {
      const dob = patient.dob;
      const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      await client.post('/same-day-care/treatment', {
        patientId: patient._id,
        patientName: patient.patientName,
        uhid: patient.uhid,
        mobile: patient.mobile,
        gender: patient.gender,
        age,
        treatmentType: sdCareType,
        referredByDoctorRemarks: sdRemarks,
        assignedStaffId: sdSelectedDocId || null,
        assignedStaffName: chosenDoc ? (chosenDoc.doctorName || chosenDoc.username) : '',
        status: 'Draft'
      });
      toast.success(`${patient.patientName} referred to Same Day Care (${sdCareType})!`);
      setShowSameDayModal(false);
      navigate('/doctor');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refer patient');
    }
  };

  if (loading) return <div className="card p-8 text-center font-bold text-gray-600">Loading Patient Case Record...</div>;
  if (!patient) return <div className="card p-8 text-center font-bold text-red-600">Patient records not found.</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-12" autoComplete="off">
      {/* Top Page Header Bar with Close Consultation Button */}
      <div className="card p-4 bg-white border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 rounded-2xl text-orange-600">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              Doctor Consultation & Digital Rx
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md text-xs font-extrabold">
                {patient?.uhid}
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              Patient: <strong className="text-gray-900 font-bold">{patient?.patientName}</strong> ({patient?.gender}, {patient?.mobile})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/doctor')}
            className="btn bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            title="Close digital prescription and exit consultation"
          >
            <X className="h-4 w-4" />
            <span>Close Consultation</span>
          </button>
        </div>
      </div>

      {isReadOnly && !patient?.isDischarged && (
        <div className="card p-4 border border-emerald-200 bg-emerald-50/90 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <h4 className="font-extrabold text-emerald-950 text-sm uppercase tracking-wider">Consultation & Prescription Completed (Read-Only)</h4>
              <p className="text-xs text-emerald-800 mt-0.5 font-semibold">
                This consultation has been saved & printed. Symptoms, remarks, medicines, and clinical details are now locked.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="btn-secondary bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3 flex items-center gap-1.5 rounded-xl cursor-pointer"
          >
            <Eye className="h-4 w-4" /> View RX
          </button>
        </div>
      )}

      {/* Floating Toggle Button when Side Panel is Closed */}
      {!showRightPanel && (
        <button
          type="button"
          onClick={() => setShowRightPanel(true)}
          className="fixed top-24 right-4 z-40 btn bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs py-2.5 px-4 shadow-2xl rounded-full flex items-center gap-2 border border-white/40 cursor-pointer transition-all animate-in fade-in slide-in-from-right-5"
          title="Open Patient Summary & Vitals Panel"
        >
          <PanelRightOpen className="h-4 w-4 text-white" />
          <span>Open Side Panel</span>
        </button>
      )}

      {/* Master Layout (Dynamic 12-Column or 10-Column Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (Dynamic: Full 12 Cols if Side Panel Closed, else 10 Cols) */}
        <fieldset disabled={isReadOnly} className={showRightPanel ? (isReadOnly ? 'lg:col-span-10 space-y-5 border-0 p-0 m-0 transition-all duration-300' : 'lg:col-span-10 space-y-5 border-0 p-0 m-0 transition-all duration-300') : 'lg:col-span-12 space-y-5 border-0 p-0 m-0 transition-all duration-300'}>

          {/* Follow-Up Patient Previous History Banner */}
          {previousConsultation && (
            <div className="card p-4 bg-gradient-to-r from-purple-50/70 via-white to-indigo-50/40 border border-purple-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
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
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Diagnosis / Remarks:</span>
                        <p className="text-gray-800 font-semibold bg-gray-50 p-1.5 rounded border border-gray-100">{previousConsultation.diagnosisRemark}</p>
                      </div>
                    )}
                    {previousConsultation.symptoms && previousConsultation.symptoms.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Symptoms:</span>
                        <div className="flex flex-wrap gap-1">
                          {previousConsultation.symptoms.map((s, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {s.symptom} {s.durationDays ? `(${s.durationDays} ${s.durationUnit || 'Days'})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-gray-200/70 space-y-1.5">
                    <div className="font-bold text-gray-800 flex items-center gap-1 border-b border-gray-100 pb-1">
                      <Stethoscope className="h-3.5 w-3.5 text-orange-600" /> Previous Vitals & Follow-up
                    </div>
                    {previousConsultation.vitals && (
                      <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold text-gray-700">
                        <div>WT: <span className="font-bold text-gray-900">{previousConsultation.vitals.weight || '-'} kg</span></div>
                        <div>HT: <span className="font-bold text-gray-900">{previousConsultation.vitals.height || '-'} cm</span></div>
                        <div>BP: <span className="font-bold text-gray-900">{previousConsultation.vitals.bloodPressure || '-'}</span></div>
                        <div>Temp: <span className="font-bold text-gray-900">{previousConsultation.vitals.temperature || '-'} °C</span></div>
                        <div>BMI: <span className="font-bold text-gray-900">{previousConsultation.vitals.bmi || '-'}</span></div>
                        <div>Allergy: <span className="font-bold text-red-600">{previousConsultation.vitals.drugAllergy || 'None'}</span></div>
                      </div>
                    )}
                    {previousConsultation.followUpDate && (
                      <div className="text-[11px] font-bold text-purple-700 pt-1">
                        Follow-up Date: {formatDate(previousConsultation.followUpDate)} {previousConsultation.followUpRemarks ? `(${previousConsultation.followUpRemarks})` : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isReadOnly && (
                <div className="pt-2 border-t border-purple-100/80 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs font-bold text-purple-900">Follow-up Patient Quick Action:</span>
                  <button
                    type="button"
                    onClick={handleContinuePreviousMedicines}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    title="Automatically pre-fill same medicines into current prescription form"
                  >
                    <Copy className="h-3.5 w-3.5" /> Continue Previous Medicines
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Symptoms Section */}
          <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">
              Symptoms
            </h2>

            {symptoms.map((item, index) => (
              <div key={index} className="p-3 bg-slate-50/80 rounded-xl border border-gray-200/80 space-y-2 relative">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 lg:col-span-3 relative">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Symptom Name #{index + 1}</label>
                    <input 
                      className="input w-full text-sm font-bold text-gray-900 border-gray-300" 
                      placeholder="Type symptom (e.g. Fever)..." 
                      value={item.symptom} 
                      onChange={(e) => updateSymptom(index, 'symptom', e.target.value)}
                      onFocus={() => {
                        setActiveSymptomIndex(index);
                        setSymptomHighlightedIndex(-1);
                      }}
                      onKeyDown={(e) => handleSymptomKeyDown(e, index)}
                    />
                    {activeSymptomIndex === index && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-orange-300 rounded-md shadow-lg z-20 max-h-40 overflow-y-auto">
                        {suggestions.map((suggestion, sugIdx) => (
                          <button
                            key={sugIdx}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm font-bold border-b border-orange-50 last:border-b-0 cursor-pointer transition-colors ${
                              symptomHighlightedIndex === sugIdx 
                                ? 'bg-orange-200 text-orange-950 font-black' 
                                : 'hover:bg-orange-100 text-gray-800'
                            }`}
                            onClick={() => selectSuggestion(suggestion, index)}
                            onMouseEnter={() => setSymptomHighlightedIndex(sugIdx)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-12 sm:col-span-4 lg:col-span-2">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Duration</label>
                    <input 
                      type="number"
                      min="1"
                      className="input w-full text-sm font-bold text-gray-900 border-gray-300" 
                      placeholder="e.g. 3" 
                      value={item.durationDays} 
                      onChange={(e) => updateSymptom(index, 'durationDays', e.target.value)}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-4 lg:col-span-2">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Unit</label>
                    <select 
                      className="input w-full text-sm font-bold text-gray-900 border-gray-300"
                      value={item.durationUnit || 'Days'}
                      onChange={(e) => updateSymptom(index, 'durationUnit', e.target.value)}
                    >
                      {durationUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-12 lg:col-span-3">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Past History / Notes</label>
                    <input 
                      className="input w-full text-sm font-bold text-gray-900 border-gray-300" 
                      placeholder="e.g. Recurrent since 2 months" 
                      value={item.pastHistory || ''} 
                      onChange={(e) => updateSymptom(index, 'pastHistory', e.target.value)}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-4 lg:col-span-2 flex items-end">
                    {symptoms.length > 1 && (
                      <button 
                        type="button" 
                        className="btn-secondary w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold py-2.5 flex items-center justify-center gap-1 cursor-pointer"
                        onClick={() => removeSymptom(index)}
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button" 
              className="btn-secondary text-xs font-extrabold py-2 px-3 flex items-center gap-1 text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200 cursor-pointer"
              onClick={addSymptom}
            >
              <Plus className="h-4 w-4 text-orange-600" /> Add Another Symptom
            </button>

          </section>

          {/* Row 1: General Past History AND Diagnosis / Remark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* General Past History */}
            <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" /> General Past History
                </h2>
                <textarea 
                  className="input w-full text-sm font-semibold text-gray-900 border-gray-300 h-28 resize-none" 
                  placeholder="Overall medical history, allergies, previous illnesses..." 
                  value={generalPastHistory}
                  onChange={(e) => setGeneralPastHistory(e.target.value)}
                />
              </div>
            </section>

            {/* Diagnosis / Remark */}
            <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-orange-600" /> Diagnosis / Remark
                </h2>
                <textarea
                  className="input w-full text-sm font-bold text-gray-900 border-gray-300 h-28 resize-none"
                  placeholder="Enter diagnosis or doctor notes for patient..."
                  value={diagnosisRemark}
                  onChange={(e) => setDiagnosisRemark(e.target.value)}
                />
              </div>
            </section>
          </div>

          {/* Row 2: Lab Investigations & Reports AND Advice for Patient */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Lab Investigations & Reports Box */}
            <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-orange-600" /> Lab Investigations & Reports
                  </span>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-orange-600 cursor-pointer">
                    <input type="checkbox" {...register('sendToLab')} />
                    <FlaskConical className="h-4 w-4" /> Send To Lab
                  </label>
                </h2>

                <div className="relative">
                  <input
                    className="input w-full text-sm font-bold text-gray-900 border-gray-300"
                    placeholder="Search or type custom lab test & press Enter..."
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (testQuery.trim()) {
                          selectTest(testQuery.trim());
                        }
                      }
                    }}
                  />
                  {testQuery.trim() && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-orange-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
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
                              onClick={() => selectTest(itemName)}
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
                          className="w-full text-left px-3 py-2.5 text-xs font-extrabold text-orange-700 hover:bg-orange-100 border-t border-orange-100 cursor-pointer flex items-center justify-between bg-orange-50/80"
                          onClick={() => selectTest(testQuery.trim())}
                        >
                          <span className="flex items-center gap-1.5">
                            <Plus className="h-4 w-4 text-orange-600 shrink-0" />
                            <span>Add "<strong className="underline text-orange-900">{testQuery.trim()}</strong>" as custom test</span>
                          </span>
                          <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded font-bold shrink-0">Press Enter</span>
                        </button>
                      )}
                    </div>
                  )}
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
                          <button type="button" onClick={() => removeTest(t)} className="text-orange-600 hover:text-orange-900 cursor-pointer">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Advice for Patient */}
            <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-orange-600" /> Advice for Patient
                </h2>
                <textarea
                  className="input w-full text-sm font-semibold text-gray-900 border-gray-300 h-28 resize-none"
                  placeholder="Enter advice, dietary guidelines, or special instructions for patient..."
                  value={patientAdvice}
                  onChange={(e) => setPatientAdvice(e.target.value)}
                />
              </div>
            </section>
          </div>

          {/* Section: Prescription Medicines */}
          <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-orange-600" /> Digital Rx / Prescription Medicines
              </h2>
              <button
                type="button"
                onClick={() => navigate('/doctor')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                title="Close digital prescription and return to doctor dashboard"
              >
                <X className="h-3.5 w-3.5 text-white" /> Close Prescription
              </button>
            </div>

            {/* Medicines List - Single Horizontal Flex Row */}
            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div key={index} className="p-3 bg-gradient-to-r from-orange-50/30 via-white to-blue-50/20 rounded-xl border border-orange-200/70 shadow-2xs">
                  <div className="flex flex-wrap xl:flex-nowrap items-end gap-2.5">
                    {/* 1. Medicine Name */}
                    <div className="flex-1 min-w-[200px] relative">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-xs sm:text-sm font-extrabold text-gray-800 uppercase">Medicine Name #{index + 1}</label>
                        {pharmacyMedicines.length > 0 && (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Stock Synced
                          </span>
                        )}
                      </div>
                      <input 
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300" 
                        placeholder="Type medicine name (min. 3 chars)..." 
                        value={med.medicine} 
                        onChange={(e) => updateMedicine(index, 'medicine', e.target.value)}
                        onFocus={() => {
                          setActiveMedIndex(index);
                          setMedHighlightedIndex(-1);
                        }}
                        onKeyDown={(e) => handleMedKeyDown(e, index)}
                      />
                      {activeMedIndex === index && medSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-300 rounded-md shadow-xl z-30 max-h-44 overflow-y-auto">
                          {medSuggestions.map((mObj, mIdx) => (
                            <button
                              key={mIdx}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm font-bold border-b border-blue-50 flex items-center justify-between cursor-pointer transition-colors ${
                                medHighlightedIndex === mIdx 
                                  ? 'bg-blue-100 text-blue-950 font-black' 
                                  : 'hover:bg-blue-50 text-gray-800'
                              }`}
                              onClick={() => selectMedicineSuggestion(mObj, index)}
                              onMouseEnter={() => setMedHighlightedIndex(mIdx)}
                            >
                              <span className="font-bold">{mObj.name}</span>
                              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Stock: {mObj.stock}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Form */}
                    <div className="w-28 shrink-0">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5">Form</label>
                      <select 
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300 px-1.5"
                        value={med.dosageForm}
                        onChange={(e) => updateMedicine(index, 'dosageForm', e.target.value)}
                      >
                        {['Tablet', 'Syrup', 'Injection', 'Capsule', 'Ointment', 'Eye Drops', 'Drop', 'Cream', 'Gel', 'Powder', 'Lotion', 'Spray'].map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>

                    {/* 3. Strength */}
                    <div className="w-22 shrink-0">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5">Strength</label>
                      <input 
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300"
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

                    {/* 5. Timings (M-A-N Checkboxes with Morning, Afternoon, Night) */}
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

                    {/* 6. Days */}
                    <div className="w-16 shrink-0">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-0.5 text-center">Days</label>
                      <input 
                        className="input w-full text-sm font-bold text-gray-900 border-gray-300 text-center px-1"
                        placeholder="Days"
                        type="number"
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
                          title="Qty for non-tablet forms is editable for Pharmacy billing"
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

                    {/* 9. Remove Row Action */}
                    <div className="shrink-0 pb-0.5">
                      <button 
                        type="button" 
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
                        title="Remove Row"
                        onClick={() => removeMedicineRow(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="btn-secondary text-xs sm:text-sm font-bold py-2 px-3 flex items-center gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50 cursor-pointer"
              onClick={addMedicineRow}
            >
              <Plus className="h-4 w-4" /> Add Medicine Row
            </button>

            {/* Live Inline Preview (Collapsible) */}
            {showPreview && (
              <div className="space-y-2 pt-3 border-t border-orange-100 no-print">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                    <Eye className="h-4 w-4 text-orange-600" /> Live Receipt & Digital Rx Preview
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDirectPdfPrint()}
                      className="btn bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-1 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print Rx PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      Hide Preview
                    </button>
                  </div>
                </div>
                <div className="bg-gray-100 p-4 border border-gray-300 rounded-xl overflow-x-auto max-h-[600px] overflow-y-auto">
                  <div>
                    <PatientReceipt 
                      patient={buildPatientDataForReceipt()} 
                      prescription={buildPrescriptionDataForPrint()} 
                      language={typeof language === 'object' ? language.value : language} 
                      printOptions={printOptions}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Follow-up Scheduling & Actions */}
          <section className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">
              Follow-up Scheduling & Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Follow-up Date</label>
                <input 
                  className="input w-full text-sm font-bold text-gray-900 border-gray-300" 
                  type="date" 
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Follow-up Instructions</label>
                <input 
                  className="input w-full text-sm font-bold text-gray-900 border-gray-300" 
                  placeholder="e.g. Check BP, review reports"
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                />
              </div>
            </div>

            {!patient.isDischarged && (
              <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t border-gray-100">
                {/* Action Buttons: Save & Print AND Close Digital Prescription */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black py-2.5 px-5 flex items-center gap-2 cursor-pointer shadow-md rounded-xl"
                    onClick={handleSaveAndPrintClick}
                    disabled={saving}
                  >
                    <Printer className="h-4 w-4" /> {saving ? 'Saving...' : 'Save & Print Prescription'}
                  </button>

                  <button
                    type="button"
                    className="btn bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer shadow-md rounded-xl transition-colors"
                    onClick={() => navigate('/doctor')}
                  >
                    <X className="h-4 w-4 text-white" /> Close Consultation
                  </button>
                </div>

                {/* Print Language Selection Modal */}
                <PrintLanguageModal
                  isOpen={showLangModal}
                  onClose={() => setShowLangModal(false)}
                  onConfirm={(chosenLang) => handleSaveAndPrint(chosenLang)}
                  initialLanguage={typeof language === 'object' ? language.value : (language || 'English')}
                />

                {/* Referral Checkboxes (Single Select Only - Processes on Save & Print) */}
                <div className="flex items-center gap-4 border-l border-gray-200 pl-4 py-1 flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-gray-800 cursor-pointer hover:text-indigo-600 select-none">
                    <input
                      type="checkbox"
                      checked={sendToIpdChecked || referralSent}
                      disabled={referralSent}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          setSendToIpdChecked(true);
                          setSendToSameDayChecked(false);
                          setReferToOtChecked(false);
                        } else {
                          setSendToIpdChecked(false);
                        }
                      }}
                      className="rounded-full text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                    <span>{referralSent ? '✓ Send to IPD (Referred)' : 'Send to IPD'}</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-gray-800 cursor-pointer hover:text-amber-600 select-none">
                    <input
                      type="checkbox"
                      checked={sendToSameDayChecked}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          setSendToSameDayChecked(true);
                          setSendToIpdChecked(false);
                          setReferToOtChecked(false);
                        } else {
                          setSendToSameDayChecked(false);
                        }
                      }}
                      className="rounded-full text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                    />
                    <span>Same Day Care</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-gray-800 cursor-pointer hover:text-rose-600 select-none">
                    <input
                      type="checkbox"
                      checked={referToOtChecked}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          setReferToOtChecked(true);
                          setSendToIpdChecked(false);
                          setSendToSameDayChecked(false);
                        } else {
                          setReferToOtChecked(false);
                        }
                      }}
                      className="rounded-full text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                    />
                    <span>Refer to OT</span>
                  </label>
                </div>
              </div>
            )}
          </section>

        </fieldset>

        {/* Right Column (Sticky Sidebar Panel) */}
        {showRightPanel && (
          <div className="lg:col-span-2 space-y-3.5 lg:sticky lg:top-4 transition-all duration-300 animate-in fade-in slide-in-from-right-4">
            
            {/* Card 0: Patient Info & Full Clinical Track */}
            <div className="card p-3 bg-gradient-to-b from-orange-50/90 via-white to-orange-50/50 border border-orange-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-orange-100 pb-1">
                <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider">{patient.uhid}</span>
                <div className="flex items-center gap-1.5">
                  {patient.registeredBy && (
                    <span className="text-[10px] font-bold text-gray-500">Reg: <span className="capitalize text-gray-800">{patient.registeredBy}</span></span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowRightPanel(false)}
                    className="p-0.5 text-gray-400 hover:text-orange-600 hover:bg-orange-100/60 rounded transition-colors cursor-pointer"
                    title="Close Side Panel (Full Wide View)"
                  >
                    <PanelRightClose className="h-4 w-4 text-orange-600" />
                  </button>
                </div>
              </div>
              
              <div>
                <h2 className="text-base font-black text-gray-900 leading-tight">{patient.patientName}</h2>
                <p className="text-[11px] font-semibold text-gray-600 mt-0.5">
                  {patient.gender} • {patient.mobile}
                </p>
                <p className="text-[10px] font-bold text-orange-700 mt-0.5">
                  {formatDate(patient.appointmentDate)} ({patient.slot})
                </p>
                {previousConsultation && (
                  <span className="mt-1 bg-purple-100 text-purple-800 border border-purple-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <History className="h-3 w-3" /> Follow-up Patient
                  </span>
                )}
              </div>

              <div className="pt-1.5 border-t border-orange-100">
                <Link
                  to={`/doctor/consultation-track/${patientId}`}
                  className="w-full btn-secondary bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs py-1.5 px-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs rounded-xl"
                >
                  <Activity className="h-3.5 w-3.5 text-emerald-600" />
                  Full Clinical Track
                </Link>
              </div>
            </div>

            {/* Card 1: Vitals Summary with Edit Button */}
            <div className="card p-3.5 bg-white border border-gray-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-orange-600" /> Vitals
                </span>
                {!isReadOnly && (
                  <button
                    type="button"
                    className="text-xs font-extrabold text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 cursor-pointer"
                    onClick={() => setShowEditVitalsModal(true)}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="space-y-1.5 text-xs sm:text-sm font-extrabold text-gray-800">
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-600">Weight:</span>
                  <span className="text-sm sm:text-base font-black text-gray-950">{watch('weight') || patient?.demographics?.weight || previousConsultation?.vitals?.weight || '-'} kg</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-600">Height:</span>
                  <span className="text-sm sm:text-base font-black text-gray-950">{watch('height') || patient?.demographics?.height || previousConsultation?.vitals?.height || '-'} cm</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-600">BP:</span>
                  <span className="text-sm sm:text-base font-black text-gray-950">{watch('bloodPressure') || patient?.demographics?.bloodPressure || previousConsultation?.vitals?.bloodPressure || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-600">Temp:</span>
                  <span className="text-sm sm:text-base font-black text-gray-950">{watch('temperature') || patient?.demographics?.temperature || previousConsultation?.vitals?.temperature || '-'} °C</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-600">BMI:</span>
                  <span className="text-sm sm:text-base font-black text-gray-950">{watch('bmi') || patient?.demographics?.bmi || previousConsultation?.vitals?.bmi || '-'}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-gray-600">Allergies:</span>
                  <span className="text-xs sm:text-sm font-black text-red-600 truncate max-w-[90px]">{watch('drugAllergy') || patient?.demographics?.drugAllergy || previousConsultation?.vitals?.drugAllergy || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Symptoms Summary */}
            <div className="card p-3.5 bg-white border border-gray-200/80 shadow-xs space-y-2.5">
              <div className="border-b border-gray-100 pb-2">
                <span className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-orange-600" /> Symptoms
                </span>
              </div>
              {symptoms.filter(s => s.symptom && s.symptom.trim()).length > 0 ? (
                <div className="space-y-1.5">
                  {symptoms.filter(s => s.symptom && s.symptom.trim()).map((s, idx) => (
                    <div key={idx} className="p-2 bg-orange-50/90 border border-orange-200/80 rounded-lg text-xs sm:text-sm font-black text-orange-950 flex items-center justify-between gap-1">
                      <span className="truncate max-w-[100px]">{s.symptom}</span>
                      {s.durationDays && <span className="text-xs bg-orange-200 text-orange-950 px-1.5 py-0.5 rounded-md font-black">{s.durationDays}d</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500 font-semibold italic">No symptoms added</p>
              )}
            </div>

            {/* Card 3: Preview & Actions */}
            <div className="card p-3 bg-gradient-to-b from-orange-50/80 via-white to-orange-50/40 border border-orange-200 shadow-xs space-y-2">
              <div className="border-b border-orange-100 pb-1">
                <span className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-orange-600" /> Actions
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="w-full btn-secondary bg-orange-500 hover:bg-orange-600 text-white border-orange-600 font-extrabold text-xs py-2 px-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs rounded-xl"
              >
                <Eye className="h-4 w-4" />
                View RX
              </button>

              <button
                type="button"
                onClick={() => setShowEditPrintModal(true)}
                className="w-full btn-secondary bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 font-bold text-xs py-2 px-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs rounded-xl"
                title="Configure print layout & sections for this prescription"
              >
                <Printer className="h-4 w-4 text-slate-600" />
                Edit Print
              </button>

              <button
                type="button"
                onClick={() => setShowRightPanel(false)}
                className="w-full btn-secondary bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 font-bold text-xs py-1.5 px-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs rounded-xl mt-1"
                title="Close side panel and expand main workspace to full width"
              >
                <PanelRightClose className="h-3.5 w-3.5 text-orange-600" />
                Close Side Panel
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Edit Print RX Options Modal */}
      {showEditPrintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 bg-white border border-gray-200 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-orange-600" /> Edit Print RX Layout & Options
              </h3>
              <button
                type="button"
                onClick={() => setShowEditPrintModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mandatory Fixed Sections Info */}
            <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl space-y-1.5">
              <span className="text-xs font-black text-orange-950 uppercase tracking-wider block">Mandatory Prescription Sections (Always Printed):</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white text-orange-900 border border-orange-300 px-2 py-0.5 rounded text-xs font-extrabold flex items-center gap-1">🔒 Patient Details</span>
                <span className="bg-white text-orange-900 border border-orange-300 px-2 py-0.5 rounded text-xs font-extrabold flex items-center gap-1">🔒 Symptoms Name</span>
                <span className="bg-white text-orange-900 border border-orange-300 px-2 py-0.5 rounded text-xs font-extrabold flex items-center gap-1">🔒 Diagnosis / Remarks</span>
                <span className="bg-white text-orange-900 border border-orange-300 px-2 py-0.5 rounded text-xs font-extrabold flex items-center gap-1">🔒 Medicines (Digital Rx)</span>
                <span className="bg-white text-orange-900 border border-orange-300 px-2 py-0.5 rounded text-xs font-extrabold flex items-center gap-1">🔒 Follow-up Date</span>
              </div>
            </div>

            {/* Optional / Toggleable Print Sections */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-black text-gray-900 uppercase tracking-wider block">Optional Sections to Include in Prescription:</label>
              
              <div className="space-y-2.5 bg-gray-50/80 p-3.5 border border-gray-200 rounded-xl text-sm font-extrabold text-gray-800">
                <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600">
                  <span>Include Vitals & Demographics</span>
                  <input
                    type="checkbox"
                    checked={printOptions.printVitals}
                    onChange={(e) => setPrintOptions({ ...printOptions, printVitals: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/60 pt-2">
                  <span>Include Lab Investigations & Reports</span>
                  <input
                    type="checkbox"
                    checked={printOptions.printLabTests}
                    onChange={(e) => setPrintOptions({ ...printOptions, printLabTests: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/60 pt-2">
                  <span>Include Past History with Symptoms</span>
                  <input
                    type="checkbox"
                    checked={printOptions.printSymptomHistory}
                    onChange={(e) => setPrintOptions({ ...printOptions, printSymptomHistory: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/60 pt-2">
                  <span>Include Symptom Remarks / Instructions</span>
                  <input
                    type="checkbox"
                    checked={printOptions.printSymptomRemarks}
                    onChange={(e) => setPrintOptions({ ...printOptions, printSymptomRemarks: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/60 pt-2">
                  <span>Include General Past History</span>
                  <input
                    type="checkbox"
                    checked={printOptions.printGeneralPastHistory !== false}
                    onChange={(e) => setPrintOptions({ ...printOptions, printGeneralPastHistory: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/60 pt-2">
                  <span>Include Diagnosis & Remarks</span>
                  <input
                    type="checkbox"
                    checked={printOptions.printDiagnosisRemarks !== false}
                    onChange={(e) => setPrintOptions({ ...printOptions, printDiagnosisRemarks: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/60 pt-2">
                  <span>Include Advice for Patient</span>
                  <input
                    type="checkbox"
                    checked={printOptions.printPatientAdvice !== false}
                    onChange={(e) => setPrintOptions({ ...printOptions, printPatientAdvice: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/60 pt-2">
                  <div>
                    <span className="block font-bold">Include Previous Prescription / Visit History</span>
                    <span className="text-[11px] font-normal text-gray-500 block">Print past visits & symptoms history from previous consultations</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(printOptions.printPreviousHistory)}
                    onChange={(e) => setPrintOptions({ ...printOptions, printPreviousHistory: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 h-4.5 w-4.5 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('doctor_print_options', JSON.stringify(printOptions));
                  setShowEditPrintModal(false);
                  toast.success("Print RX options applied successfully!");
                }}
                className="btn bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm py-2.5 px-5 cursor-pointer rounded-xl shadow-md"
              >
                Save & Apply Print Layout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vitals Modal */}
      {showEditVitalsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 bg-white border border-gray-200 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" /> Edit Patient Vitals
              </h3>
              <button
                type="button"
                onClick={() => setShowEditVitalsModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 space-y-0">
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Weight (kg)</label>
                <input className="input w-full text-sm font-bold text-gray-900 border-gray-300" placeholder="e.g. 70" {...register('weight')} />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Height (cm)</label>
                <input className="input w-full text-sm font-bold text-gray-900 border-gray-300" placeholder="e.g. 175" {...register('height')} />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Temp (°C)</label>
                <input className="input w-full text-sm font-bold text-gray-900 border-gray-300" placeholder="e.g. 37" {...register('temperature')} />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Blood Pressure</label>
                <input className="input w-full text-sm font-bold text-gray-900 border-gray-300" placeholder="120/80" {...register('bloodPressure')} />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">BMI</label>
                <input className="input w-full text-sm font-bold text-gray-900 border-gray-300" placeholder="e.g. 22.5" {...register('bmi')} />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-800 block mb-1">Drug Allergy</label>
                <input className="input w-full text-sm font-bold text-red-600 border-gray-300" placeholder="e.g. Penicillin" {...register('drugAllergy')} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-5 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditVitalsModal(false);
                  toast.success("Vitals updated successfully!");
                }}
                className="btn bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2 px-4 cursor-pointer rounded-xl"
              >
                Save & Close Vitals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show Preview Modal Popup */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-transparent print:backdrop-blur-none print:p-0 print:overflow-visible print:z-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-150 print:bg-transparent print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:h-auto print:overflow-visible print:p-0">
            {/* Modal Header - Hidden when printing */}
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between no-print print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-orange-400" />
                <h3 className="text-base font-extrabold">Patient Receipt & Digital Prescription Preview</h3>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                  <label>Language:</label>
                  <select 
                    className="input bg-gray-800 text-white border-gray-700 text-xs py-1 px-2 font-bold cursor-pointer"
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

                <button
                  type="button"
                  onClick={() => handleDirectPdfPrint()}
                  className="btn bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 rounded-lg cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Print Now
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Printable Receipt Preview */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/90 flex-1 flex justify-center items-start print:bg-transparent print:p-0 print:overflow-visible">
              <div className="bg-white shadow-2xl rounded-sm w-full max-w-[210mm] border border-gray-300 overflow-hidden print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:overflow-visible print:p-0">
                <PatientReceipt 
                  patient={buildPatientDataForReceipt()}
                  prescription={buildPrescriptionDataForPrint()}
                  language={typeof language === 'object' ? language.value : language}
                  printOptions={printOptions}
                />
              </div>
            </div>

            {/* Modal Footer - Hidden when printing */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between no-print print:hidden">
              <span className="text-xs font-bold text-gray-500">Live preview generated automatically from consultation data</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectPdfPrint()}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 font-bold flex items-center gap-1.5 cursor-pointer rounded-lg shadow-sm"
                >
                  <Printer className="h-4 w-4" /> Print Prescription
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="btn-secondary text-xs px-4 py-2 font-bold cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden dedicated receipt ref for html2canvas PDF generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '210mm', opacity: 1, pointerEvents: 'none', zIndex: -1000 }}>
        <PatientReceipt 
          ref={receiptRef}
          patient={buildPatientDataForReceipt()} 
          prescription={buildPrescriptionDataForPrint()} 
          language={typeof language === 'object' ? language.value : language} 
          printOptions={printOptions}
        />
      </div>

      {/* Same Day Care Modal */}
      {showSameDayModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 relative bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowSameDayModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-orange-500" />
              Refer to Same Day Care
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Select Care Type</label>
                <select
                  className="input w-full text-sm font-semibold"
                  value={sdCareType}
                  onChange={(e) => setSdCareType(e.target.value)}
                  required
                >
                  <option value="">-- Select Care Type --</option>
                  {subServices.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Assign to Provider / Doctor (Optional)</label>
                {loadingSdDoctors ? (
                  <p className="text-xs text-gray-400">Loading providers...</p>
                ) : (
                  <select
                    className="input w-full text-sm font-semibold"
                    value={sdSelectedDocId}
                    onChange={(e) => setSdSelectedDocId(e.target.value)}
                  >
                    <option value="">-- Select Provider --</option>
                    {sdDoctors.map(doc => (
                      <option key={doc._id} value={doc._id}>
                        {doc.doctorName || doc.username} ({doc.role === 'nursing' ? 'same day care' : doc.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Referral Remarks</label>
                <textarea
                  className="input w-full text-sm h-24 p-2.5 resize-none border border-gray-200 rounded-xl"
                  placeholder="Enter custom remarks..."
                  value={sdRemarks}
                  onChange={(e) => setSdRemarks(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSameDayModal(false)}
                  className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendToSameDaySubmit}
                  className="btn text-xs px-4 py-2 cursor-pointer"
                >
                  Send Referral
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ConsultationPage;