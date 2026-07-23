import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Save, CheckCircle, Clock, User,
  Phone, CalendarDays, Eye, Printer, Download,
  Bandage, Bone, Flame, Wind, Syringe, Droplets, Plus, Trash2,
  ShieldAlert, Sparkles, UploadCloud, PlusCircle, Check, X, FileText, Activity, ListPlus
} from 'lucide-react';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const TREATMENT_META = {
  'Fracture': { icon: Bone, color: 'text-orange-500', bg: 'bg-orange-50' },
  'Minor Injury': { icon: Bandage, color: 'text-blue-500', bg: 'bg-blue-50' },
  'Minor Stitches': { icon: Syringe, color: 'text-purple-500', bg: 'bg-purple-50' },
  'Small Burns': { icon: Flame, color: 'text-red-500', bg: 'bg-red-50' },
  'Mild Allergic Reactions': { icon: Wind, color: 'text-green-500', bg: 'bg-green-50' },
  'Dialysis': { icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50' }
};

const TRANSLATIONS = {
  English: {
    title: "SAME DAY TREATMENT CLINICAL RECORD",
    patientDetails: "Patient Details",
    patientName: "Patient Name",
    uhid: "UHID",
    ageGender: "Age / Gender",
    mobile: "Mobile Number",
    date: "Treatment Date",
    procedure: "Procedure / Care Type",
    prescription: "Rx Prescription",
    medicineName: "Medicine Name",
    dosage: "Dosage",
    frequency: "Frequency",
    duration: "Duration",
    instructions: "Instructions",
    type: "Type",
    importantNotes: "Important Notes",
    adviceNotes: "Advice Notes",
    signatureLine: "Consultant Signature",
    clinicianSignature: "Clinician Signature"
  },
  Hindi: {
    title: "डे केयर - उपचार रिपोर्ट",
    patientDetails: "मरीज का विवरण",
    patientName: "मरीज का नाम",
    uhid: "यूएचआईडी (UHID)",
    ageGender: "उम्र / लिंग",
    mobile: "मोबाइल नंबर",
    date: "उपचार की तिथि",
    procedure: "प्रक्रिया / देखभाल का प्रकार",
    prescription: "पर्चे (प्रिस्क्रिप्शन)",
    medicineName: "दवा का नाम",
    dosage: "खुराक",
    frequency: "आवृत्ति",
    duration: "अवधि",
    instructions: "निर्देश",
    type: "प्रकार",
    importantNotes: "महत्वपूर्ण निर्देश",
    adviceNotes: "परामर्श नोट",
    signatureLine: "परामर्शदाता के हस्ताक्षर",
    clinicianSignature: "चिकित्सक के हस्ताक्षर"
  },
  Tamil: {
    title: "ஒரே நாள் சிகிச்சை அறிக்கை",
    patientDetails: "நோயாளி விவரங்கள்",
    patientName: "நோயாளி பெயர்",
    uhid: "யுஹிட் (UHID)",
    ageGender: "வயது / பாலினம்",
    mobile: "கைபேசி எண்",
    date: "சிகிச்சை தேதி",
    procedure: "சிகிச்சை வகை",
    prescription: "மருந்து சீட்டு (Rx)",
    medicineName: "மருந்து பெயர்",
    dosage: "அளவு",
    frequency: "அதிர்வெண்",
    duration: "கால அளவு",
    instructions: "அறிவுறுத்தல்கள்",
    type: "வகை",
    importantNotes: "முக்கிய குறிப்புகள்",
    adviceNotes: "அறிவுரை குறிப்புகள்",
    signatureLine: "ஆலோசகர் கையொப்பம்",
    clinicianSignature: "மருத்துவர் கையொப்பம்"
  },
  Gujarati: {
    title: "સેમ ડે સારવાર અહેવાલ",
    patientDetails: "દર્દીની વિગતો",
    patientName: "દર્દીનું નામ",
    uhid: "યુએચઆઈડી (UHID)",
    ageGender: "ઉંમર / જાતિ",
    mobile: "મોબાઈલ નંબર",
    date: "સારવાર તારીખ",
    procedure: "પ્રક્રિયા / સારવારનો પ્રકાર",
    prescription: "પ્રિસ્ક્રિપ્શન (Rx)",
    medicineName: "દવાનું નામ",
    dosage: "ડોઝ",
    frequency: "આવર્તન",
    duration: "સમયગાળો",
    instructions: "સૂચનાઓ",
    type: "પ્રકાર",
    importantNotes: "મહત્વપૂર્ણ નોંધો",
    adviceNotes: "સલાહ નોંધો",
    signatureLine: "કન્સલ્ટન્ટ સહી",
    clinicianSignature: "ક્લินિશિયન સહી"
  },
  Punjabi: {
    title: "ਸੇਮ ਡੇਅ ਇਲਾਜ ਰਿਪੋਰਟ",
    patientDetails: "ਮਰੀਜ਼ ਦੇ ਵੇਰਵੇ",
    patientName: "ਮਰੀਜ਼ ਦਾ ਨਾਮ",
    uhid: "ਯੂ.ਐਚ.ਆਈ.ਡੀ (UHID)",
    ageGender: "ਉਮਰ / ਲਿੰਗ",
    mobile: "ਮੋਬਾਈਲ ਨੰਬਰ",
    date: "ਇਲਾਜ ਦੀ ਮਿਤੀ",
    procedure: "ਪ੍ਰਕਿਰਿਆ / ਦੇਖਭਾਲ ਦੀ ਕਿਸਮ",
    prescription: "ਪਰਚੀ (Rx)",
    medicineName: "ਦਵਾਈ ਦਾ ਨਾਮ",
    dosage: "ਖ਼ੁਰਾਕ",
    frequency: "ਵਾਰਵਾਰਤਾ",
    duration: "ਸਮਾਂ",
    instructions: "ਹਦਾਇਤਾਂ",
    type: "ਕਿਸਮ",
    importantNotes: "ਮਹੱਤਵਪੂਰਨ ਨੋਟਸ",
    adviceNotes: "ਸਲਾਹ ਨੋਟਸ",
    signatureLine: "ਸਲਾਹਕਾਰ ਦੇ ਦਸਤਖਤ",
    clinicianSignature: "ਕਲੀਨੀਸ਼ੀਅਨ ਦੇ ਦਸਤਖਤ"
  }
};

const SameDayCareForm = () => {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const treatmentType = searchParams.get('type') || '';
  const recordId = searchParams.get('recordId');
  const viewModeParam = searchParams.get('view') === 'true';

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Locking/Editing confirmation states
  const [isLockedState, setIsLockedState] = useState(!!recordId);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);

  // Print & Hospital Settings State
  const [hospitalSettings, setHospitalSettings] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printLanguage, setPrintLanguage] = useState('English');
  const [printNotes, setPrintNotes] = useState(['']);
  const [printAdvice, setPrintAdvice] = useState(['']);

  // Autocomplete medicine & consumables states
  const [pharmacyInventory, setPharmacyInventory] = useState([]);
  const [medQuery, setMedQuery] = useState('');
  const [showMedSuggestions, setShowMedSuggestions] = useState(false);
  const [consumablesList, setConsumablesList] = useState([]);

  // Investigations & Settings
  const [availableInvestigations, setAvailableInvestigations] = useState([]);

  // IPD Referral Modal States
  const [showIpdModal, setShowIpdModal] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [bedsList, setBedsList] = useState([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [skipBedAllocation, setSkipBedAllocation] = useState(false);
  const [hasActiveIpd, setHasActiveIpd] = useState(false);
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().substring(0, 16));
  const [admissionStatus, setAdmissionStatus] = useState('Admitted');
  const [admittingPatient, setAdmittingPatient] = useState(false);

  const [form, setForm] = useState({
    patientId: patientId || '',
    treatmentType: treatmentType,
    treatmentDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    treatmentNotes: '',
    prescription: '',
    followUpRequired: 'No',
    followUpDate: '',
    reviewNotes: '',
    nextProcedurePlanned: '',
    status: 'Draft',

    // Clinical Details
    chiefComplaint: '',
    presentIllness: '',
    clinicalFindings: '',
    medicalHistory: '',
    surgicalHistory: '',
    drugAllergies: '',
    vitals: {
      bloodPressure: '',
      pulse: '',
      temperature: '',
      height: '',
      weight: '',
      bmi: ''
    },
    selectedInvestigations: [],
    attachments: [],

    // Treatment details
    treatmentPlan: '',
    procedure: '',
    productsMedicinesUsed: '',
    procedureNotes: '',
    anaesthesiaUsed: 'No',
    anaesthesiaType: '',
    complications: '',
    prescriptionMedicines: []
  });

  const [isUnlocked, setIsUnlocked] = useState(false);
  const viewMode = viewModeParam && !isUnlocked;

  const isCompleted = form.status === 'Completed';
  const isLocked = (isLockedState || isCompleted || viewModeParam) && !isUnlocked;
  const setIsLocked = setIsLockedState;

  // Current prescription item helper state
  const [prescItem, setPrescItem] = useState({
    itemType: 'Medicine',
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    route: '',
    instructions: ''
  });

  const calculateBmi = (w, h) => {
    const weightVal = parseFloat(w);
    const heightVal = parseFloat(h);
    if (!isNaN(weightVal) && !isNaN(heightVal) && heightVal > 0) {
      const heightInMeters = heightVal / 100;
      const bmiVal = weightVal / (heightInMeters * heightInMeters);
      return parseFloat(bmiVal.toFixed(2));
    }
    return '';
  };

  const handleVitalChange = (field, value) => {
    setForm(prev => {
      const updatedVitals = { ...prev.vitals, [field]: value };
      if (field === 'weight' || field === 'height') {
        updatedVitals.bmi = calculateBmi(updatedVitals.weight, updatedVitals.height);
      }
      return { ...prev, vitals: updatedVitals };
    });
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Base64 file attachments
  const handleAttachmentUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          {
            name: file.name,
            url: reader.result,
            uploadedAt: new Date().toISOString()
          }
        ]
      }));
      toast.success(`Attached "${file.name}" successfully`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (idx) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx)
    }));
  };

  const handleInvestigationToggle = (name) => {
    setForm(prev => {
      let selected = [...prev.selectedInvestigations];
      if (name === 'Not Required') {
        if (selected.includes('Not Required')) {
          selected = [];
        } else {
          selected = ['Not Required'];
        }
      } else {
        selected = selected.filter(x => x !== 'Not Required');
        if (selected.includes(name)) {
          selected = selected.filter(x => x !== name);
        } else {
          selected.push(name);
        }
      }
      return { ...prev, selectedInvestigations: selected };
    });
  };

  // Prescription additions
  const addPrescriptionItem = () => {
    if (!prescItem.medicineName.trim()) {
      toast.error('Please enter or select a medicine/consumable name');
      return;
    }
    setForm(prev => ({
      ...prev,
      prescriptionMedicines: [...prev.prescriptionMedicines, { ...prescItem }]
    }));
    setPrescItem({
      itemType: 'Medicine',
      medicineName: '',
      dosage: '',
      frequency: '',
      duration: '',
      route: '',
      instructions: ''
    });
    setMedQuery('');
  };

  const removePrescriptionItem = (idx) => {
    setForm(prev => ({
      ...prev,
      prescriptionMedicines: prev.prescriptionMedicines.filter((_, i) => i !== idx)
    }));
  };

  const handleAddNoteField = () => setPrintNotes(prev => [...prev, '']);
  const handleNoteChange = (idx, val) => {
    setPrintNotes(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };
  const handleRemoveNoteField = (idx) => setPrintNotes(prev => prev.filter((_, i) => i !== idx));

  const handleAddAdviceField = () => setPrintAdvice(prev => [...prev, '']);
  const handleAdviceChange = (idx, val) => {
    setPrintAdvice(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };
  const handleRemoveAdviceField = (idx) => setPrintAdvice(prev => prev.filter((_, i) => i !== idx));

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: patientData } = await client.get(`/patients/${patientId}`);
        setPatient(patientData);

        try {
          const { data: ipdAdmissions } = await client.get('/ipd/admissions');
          const active = ipdAdmissions.some(adm => adm.patientId?._id === patientId && adm.status !== 'Discharged');
          setHasActiveIpd(active);
        } catch (ipdErr) {
          console.warn('Failed to check active IPD status', ipdErr);
        }

        try {
          const { data: settingsRes } = await client.get('/admin/hospital-settings');
          if (settingsRes && settingsRes.exists) {
            setHospitalSettings(settingsRes.data);
          }
        } catch (settingsErr) {
          console.warn('Failed to load settings', settingsErr);
        }

        let currentType = treatmentType;

        if (recordId) {
          const { data: recData } = await client.get(`/same-day-care/treatment/${recordId}`);
          setRecord(recData);
          currentType = recData.treatmentType;
          
          setForm({
            patientId: patientId,
            treatmentType: recData.treatmentType,
            treatmentDate: recData.treatmentDate ? new Date(recData.treatmentDate).toISOString().split('T')[0] : '',
            diagnosis: recData.diagnosis || '',
            treatmentNotes: recData.treatmentNotes || '',
            prescription: recData.prescription || '',
            followUpRequired: recData.followUpRequired || 'No',
            followUpDate: recData.followUpDate ? new Date(recData.followUpDate).toISOString().split('T')[0] : '',
            reviewNotes: recData.reviewNotes || '',
            nextProcedurePlanned: recData.nextProcedurePlanned || '',
            status: recData.status || 'Draft',
            
            // Phase 3 details
            chiefComplaint: recData.chiefComplaint || '',
            presentIllness: recData.presentIllness || '',
            clinicalFindings: recData.clinicalFindings || '',
            medicalHistory: recData.medicalHistory || '',
            surgicalHistory: recData.surgicalHistory || '',
            drugAllergies: recData.drugAllergies || '',
            vitals: {
              bloodPressure: recData.vitals?.bloodPressure || '',
              pulse: recData.vitals?.pulse || '',
              temperature: recData.vitals?.temperature || '',
              height: recData.vitals?.height || '',
              weight: recData.vitals?.weight || '',
              bmi: recData.vitals?.bmi || ''
            },
            selectedInvestigations: recData.selectedInvestigations || [],
            attachments: recData.attachments || [],
            treatmentPlan: recData.treatmentPlan || '',
            procedure: recData.procedure || '',
            productsMedicinesUsed: recData.productsMedicinesUsed || '',
            procedureNotes: recData.procedureNotes || '',
            anaesthesiaUsed: recData.anaesthesiaUsed || 'No',
            anaesthesiaType: recData.anaesthesiaType || '',
            complications: recData.complications || '',
            prescriptionMedicines: recData.prescriptionMedicines || []
          });
          if (searchParams.get('print') === 'true') {
            setShowPrintModal(true);
          }
        }

        // Fetch settings to extract investigations for currentType
        try {
          const { data: settings } = await client.get('/ipd/settings');
          const cats = settings.sameDayCareCategories || [];
          if (cats.length > 0 && currentType) {
            let found = [];
            for (const cat of cats) {
              const sub = cat.subServices.find(s => s.name.toLowerCase() === currentType.toLowerCase());
              if (sub && sub.investigations) {
                found = sub.investigations;
                break;
              }
            }
            setAvailableInvestigations(found);
          }
          if (settings.consumableServices) {
            setConsumablesList(settings.consumableServices.filter(c => c.isActive));
          }
        } catch (settingsErr) {
          console.warn('Failed to load settings', settingsErr);
        }

        // Fetch medicines for autocomplete
        try {
          const { data: pharmacyData } = await client.get('/pharmacy/inventory?limit=2000');
          const items = Array.isArray(pharmacyData) ? pharmacyData : (pharmacyData?.items || []);
          setPharmacyInventory(items);
        } catch (pharmacyErr) {
          console.warn('Failed to load pharmacy items', pharmacyErr);
        }
      } catch {
        toast.error('Failed to load patient data');
        navigate('/same-day-care');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patientId, recordId, navigate]);

  // Load Rooms list for IPD admissions modal
  useEffect(() => {
    if (showIpdModal) {
      client.get('/rooms').then(({ data }) => {
        setRoomsList(data || []);
        if (data.length > 0) setSelectedRoomType(data[0].roomType);
      });
      client.get('/admin/doctors').then(({ data }) => setDoctorsList(data || []));
    }
  }, [showIpdModal]);

  // Fetch beds when IPD Room Type is chosen
  useEffect(() => {
    if (showIpdModal && selectedRoomType) {
      client.get(`/rooms/beds?roomType=${encodeURIComponent(selectedRoomType)}`)
        .then(({ data }) => {
          setBedsList(data || []);
          setSelectedBedId('');
        });
    }
  }, [selectedRoomType, showIpdModal]);

  const handleSave = async (completionStatus) => {
    const statusToSave = completionStatus || form.status;
    
    // Validations
    const errors = {};
    if (!form.diagnosis?.trim()) errors.diagnosis = 'Diagnosis is required';
    if (form.followUpRequired === 'Yes' && !form.followUpDate) {
      errors.followUpDate = 'Follow up date is required';
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix clinical errors on form.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, status: statusToSave };
      if (recordId) {
        await client.put(`/same-day-care/treatment/${recordId}`, payload);
        toast.success(`Care record updated as ${statusToSave}`);
        setIsLocked(true);
        setIsUnlocked(false);
        if (statusToSave === 'Completed') {
          setShowPrintModal(true);
        }
      } else {
        const { data } = await client.post('/same-day-care/treatment', payload);
        toast.success(`Care record created as ${statusToSave}`);
        if (statusToSave === 'Completed') {
          navigate(`/same-day-care/treatment/${patientId}?type=${treatmentType}&recordId=${data.record._id}&print=true`);
        } else {
          navigate(`/same-day-care/treatment/${patientId}?type=${treatmentType}&recordId=${data.record._id}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save care details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToIpdClick = () => {
    if (hasActiveIpd) {
      toast.error('Patient is already in IPD module.');
      return;
    }
    setShowIpdModal(true);
  };

  const handleSendToIpd = async () => {
    if (!selectedDoctorId) {
      toast.error('Select doctor in charge.');
      return;
    }
    if (!skipBedAllocation && (!selectedRoomType || !selectedBedId)) {
      toast.error('Select room type and bed, or select "Skip Bed Allocation".');
      return;
    }
    setAdmittingPatient(true);
    try {
      const roomObj = roomsList.find(r => r.roomType === selectedRoomType);
      const admitPayload = {
        patientId,
        roomId: skipBedAllocation ? null : roomObj?._id,
        bedId: skipBedAllocation ? null : selectedBedId,
        doctorInCharge: selectedDoctorId,
        status: skipBedAllocation ? 'Pending Allocation' : admissionStatus,
        admissionDate: admissionDate,
        isSameDayCare: true
      };
      await client.post('/ipd/admit', admitPayload);
      toast.success(skipBedAllocation ? 'Patient sent to IPD Same Day Care. Bed allocation pending.' : 'Patient admitted to IPD. Medication charts unlocked!');
      setShowIpdModal(false);
      if (skipBedAllocation) {
        navigate('/ipd/same-day');
      } else {
        navigate('/same-day-care/ipd-patients');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete admission');
    } finally {
      setAdmittingPatient(false);
    }
  };

  const handlePrint = () => { window.print(); };

  const ageFromDob = (dob) => {
    if (!dob) return '-';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-5xl">
          <SkeletonTable rows={6} columns={6} className="w-full" />
        </div>
      </div>
    );
  }

  const meta = TREATMENT_META[treatmentType] || { icon: Syringe, color: 'text-orange-500', bg: 'bg-orange-50' };
  const Icon = meta.icon;
  // Filter medicines suggestions
  const filteredMeds = medQuery.trim()
    ? pharmacyInventory.filter(item => 
        item.itemName?.toLowerCase().includes(medQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div className="space-y-6 print:space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="no-print flex items-center justify-between border-b border-orange-50 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/same-day-care')} className="p-2 rounded-xl hover:bg-orange-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Icon className={`h-6 w-6 ${meta.color}`} />
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {treatmentType || 'Clinical'} Procedure Form
              </h1>
            </div>
            <p className="text-xs text-gray-500">Same Day Care Unit</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold bg-green-100 text-green-800 border border-green-200">
              <CheckCircle className="h-3.5 w-3.5" /> Clinical Entry Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <Clock className="h-3.5 w-3.5" /> Working Draft
            </span>
          )}
        </div>
      </div>

      {/* Warning/Status Alerts */}
      {isLocked && (
        <div className="no-print flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                {isCompleted ? 'Clinical Record is Completed (Finalized)' : 'Clinical Record is Locked'}
              </p>
              <p className="text-[10px] text-amber-700">Inputs are protected. Confirm changes to make edits.</p>
            </div>
          </div>
          <button
            onClick={() => setShowEditConfirmModal(true)}
            className="btn py-1.5 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white font-extrabold"
          >
            Confirm Edit
          </button>
        </div>
      )}

      {/* Referral Remarks Alert */}
      {record?.referredByDoctorRemarks && (
        <div className="flex flex-col gap-2 p-4 bg-orange-50 border border-orange-200 rounded-2xl animate-in fade-in slide-in-from-top-1 shadow-sm no-print">
          <div className="flex items-start gap-2.5">
            <Activity className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="w-full">
              <p className="text-xs font-black text-orange-950 uppercase tracking-wide">
                OPD Doctor Referral Remarks
              </p>
              <p className="text-xs text-gray-700 font-semibold mt-1 bg-white/70 p-2.5 rounded-xl border border-orange-100 italic">
                "{record.referredByDoctorRemarks}"
              </p>
              {record.assignedStaffName && (
                <p className="text-[10px] text-orange-700 font-bold mt-2">
                  Assigned Clinician: <span className="underline">{record.assignedStaffName}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Header Block */}
      <div className={`card p-5 ${meta.bg} border border-orange-100 shadow-sm rounded-2xl relative overflow-hidden`}>
        <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
          <User className="h-32 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-4 items-center">
          <div className="md:col-span-2 flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-sm border border-orange-100">
              <User className="h-9 w-9 text-orange-500" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-orange-600/80 tracking-widest leading-none">Inpatient Care Sheet</span>
              <h2 className="text-xl font-extrabold text-gray-900 mt-0.5 leading-none">{patient?.patientName || form.patientName}</h2>
              <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-gray-500 flex-wrap">
                <span className="font-mono font-bold text-orange-700 bg-orange-100/50 px-2 py-0.5 rounded-full">{formatUhid(patient?.uhid)}</span>
                <span>•</span>
                <span>{patient?.gender} / {patient?.dob ? ageFromDob(patient.dob) : form.age} years</span>
                {patient?.registeredBy && patient.registeredBy !== 'N/A' && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-gray-600">Registered by: <span className="capitalize text-orange-600">{patient.registeredBy}</span></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs space-y-1.5">
            <p className="flex items-center gap-1.5 text-gray-600">
              <Phone className="h-3.5 w-3.5 text-orange-400" /> {patient?.mobile || '-'}
            </p>
            <p className="text-gray-500 truncate" title={patient?.address}>
              <strong className="text-gray-700">Address:</strong> {patient?.address || '-'}
            </p>
          </div>

          <div className="text-xs space-y-1 bg-white/40 p-3 rounded-xl border border-orange-100/20">
            <p className="text-gray-500">
              <strong className="text-gray-700">Admission Queue Source:</strong>
            </p>
            <span className="inline-flex items-center gap-1 font-bold text-orange-850">
              <Activity className="h-3.5 w-3.5" />
              {record?.source === 'Doctor Referral' 
                ? `Dr. Referral (${record.referredByDoctorName || 'Consultant'})` 
                : `Registration Desk (${record?.createdBy?.doctorName || record?.createdBy?.username || patient?.registeredBy || 'Receptionist'})`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Clinical Entry Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Section: Clinical Assessment & Vitals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assessment Fields */}
          <div className="card p-6 space-y-5 rounded-2xl">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
              <FileText className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-gray-900">Clinical Assessment</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Chief Complaint</label>
                <textarea
                  className="input min-h-[70px] text-xs resize-none"
                  value={form.chiefComplaint}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                  placeholder="Describe patient chief complaints..."
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">History of Present Illness</label>
                <textarea
                  className="input min-h-[70px] text-xs resize-none"
                  value={form.presentIllness}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('presentIllness', e.target.value)}
                  placeholder="History of current sickness..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Diagnosis Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`input min-h-[70px] text-xs resize-none ${validationErrors.diagnosis ? 'border-red-400 focus:border-red-500' : ''}`}
                  value={form.diagnosis}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('diagnosis', e.target.value)}
                  placeholder="Primary clinical diagnosis..."
                />
                {validationErrors.diagnosis && <p className="text-[10px] text-red-500 mt-1">{validationErrors.diagnosis}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Clinical Findings & Remarks</label>
                <textarea
                  className="input min-h-[60px] text-xs resize-none"
                  value={form.clinicalFindings}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('clinicalFindings', e.target.value)}
                  placeholder="Observed symptoms and medical checks findings..."
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Medical History</label>
                <textarea
                  className="input min-h-[60px] text-xs resize-none"
                  value={form.medicalHistory}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('medicalHistory', e.target.value)}
                  placeholder="Chronic conditions, diabetes, hypertension..."
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Surgical History</label>
                <textarea
                  className="input min-h-[60px] text-xs resize-none"
                  value={form.surgicalHistory}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('surgicalHistory', e.target.value)}
                  placeholder="Past surgical history details..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 text-red-600">Drug Allergies & Contraindications</label>
                <input
                  type="text"
                  className="input py-2 text-xs text-red-800 bg-red-50/20 focus:bg-white"
                  value={form.drugAllergies}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('drugAllergies', e.target.value)}
                  placeholder="Drug allergies (e.g., penicillin, sulfa drugs)"
                />
              </div>
            </div>
          </div>

          {/* Vitals Form Block */}
          <div className="card p-6 space-y-4 rounded-2xl">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
              <Activity className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-gray-900">Vitals & Anthropometry</h3>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              <div>
                <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Blood Pressure</label>
                <input
                  type="text"
                  placeholder="systolic/diastolic"
                  className="input py-2 text-xs"
                  value={form.vitals.bloodPressure}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Pulse (bpm)</label>
                <input
                  type="number"
                  placeholder="72"
                  className="input py-2 text-xs"
                  value={form.vitals.pulse}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleVitalChange('pulse', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="37"
                  className="input py-2 text-xs"
                  value={form.vitals.temperature}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleVitalChange('temperature', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Height (cm)</label>
                <input
                  type="number"
                  placeholder="175"
                  className="input py-2 text-xs"
                  value={form.vitals.height}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleVitalChange('height', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="70"
                  className="input py-2 text-xs"
                  value={form.vitals.weight}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleVitalChange('weight', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">BMI (Auto)</label>
                <input
                  type="text"
                  className="input py-2 text-xs bg-gray-50 font-extrabold text-orange-700"
                  value={form.vitals.bmi}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Surgical & Treatment Block */}
          <div className="card p-6 space-y-4 rounded-2xl">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
              <Syringe className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-gray-900">Treatment Plan & Surgical Notes</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Planned Procedure</label>
                <input
                  type="text"
                  className="input py-2 text-xs"
                  value={form.procedure}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('procedure', e.target.value)}
                  placeholder="Name of procedure/surgery..."
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Treatment Plan Summary</label>
                <input
                  type="text"
                  className="input py-2 text-xs"
                  value={form.treatmentPlan}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('treatmentPlan', e.target.value)}
                  placeholder="Primary treatment strategy..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Surgical / Procedure Notes</label>
                <textarea
                  className="input min-h-[90px] text-xs resize-none"
                  value={form.procedureNotes}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('procedureNotes', e.target.value)}
                  placeholder="Enter detailed intra-operative procedure details..."
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Anaesthesia Administered?</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="anaesthesia"
                      value="Yes"
                      checked={form.anaesthesiaUsed === 'Yes'}
                      disabled={viewMode || isLocked}
                      onChange={() => handleChange('anaesthesiaUsed', 'Yes')}
                    /> Yes
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="anaesthesia"
                      value="No"
                      checked={form.anaesthesiaUsed === 'No'}
                      disabled={viewMode || isLocked}
                      onChange={() => handleChange('anaesthesiaUsed', 'No')}
                    /> No (Not Applicable)
                  </label>
                </div>
              </div>

              {form.anaesthesiaUsed === 'Yes' && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 animate-in fade-in slide-in-from-left-1">Anaesthesia Type / Agent</label>
                  <input
                    type="text"
                    className="input py-2 text-xs animate-in fade-in slide-in-from-left-1"
                    value={form.anaesthesiaType}
                    readOnly={viewMode || isLocked}
                    onChange={(e) => handleChange('anaesthesiaType', e.target.value)}
                    placeholder="Local, Block, Sedation..."
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 text-red-600">Complications (if any)</label>
                <textarea
                  className="input min-h-[50px] text-xs resize-none"
                  value={form.complications}
                  readOnly={viewMode || isLocked}
                  onChange={(e) => handleChange('complications', e.target.value)}
                  placeholder="Record procedural complications or enter N/A..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Checklist, Uploads, and Followup */}
        <div className="space-y-6">
          {/* Investigations Checkbox Panel */}
          {/* Investigations Checkbox Panel */}
          <div className="card p-5 space-y-3 rounded-2xl bg-orange-50/10 border-orange-100">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-2">
              <Sparkles className="h-4.5 w-4.5 text-orange-500" />
              <h4 className="font-extrabold text-gray-900 text-sm">Investigations</h4>
            </div>
            <p className="text-[10px] text-gray-500">Check the items completed in today's care visit.</p>
            <div className="space-y-2">
              {availableInvestigations.map((inv, idx) => (
                <label key={idx} className="flex items-start gap-2 text-xs font-semibold text-gray-700 bg-white p-2.5 rounded-xl border border-orange-50 hover:border-orange-200 transition-colors shadow-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.selectedInvestigations.includes(inv.name)}
                    disabled={viewMode || isLocked}
                    onChange={() => handleInvestigationToggle(inv.name)}
                  />
                  <span>{inv.name}</span>
                </label>
              ))}

              <label className="flex items-start gap-2 text-xs font-semibold text-gray-700 bg-white p-2.5 rounded-xl border border-orange-50 hover:border-orange-200 transition-colors shadow-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.selectedInvestigations.includes('Others')}
                  disabled={viewMode || isLocked}
                  onChange={() => handleInvestigationToggle('Others')}
                />
                <span>Others</span>
              </label>

              <label className="flex items-start gap-2 text-xs font-semibold text-gray-700 bg-white p-2.5 rounded-xl border border-orange-50 hover:border-orange-200 transition-colors shadow-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.selectedInvestigations.includes('Not Required')}
                  disabled={viewMode || isLocked}
                  onChange={() => handleInvestigationToggle('Not Required')}
                />
                <span>Not Required</span>
              </label>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="card p-5 space-y-3 rounded-2xl">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-2">
              <UploadCloud className="h-4.5 w-4.5 text-orange-500" />
              <h4 className="font-extrabold text-gray-900 text-sm">Radiology & Attachments</h4>
            </div>
            <p className="text-[10px] text-gray-500">Upload reports, clinical pictures, X-rays, or PDF scans.</p>
            
            {/* File uploader input */}
            {!(viewMode || isLocked) && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-orange-300 hover:bg-orange-50/10 transition-all">
                <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-[11px] font-bold text-gray-600">Choose File to Attach</span>
                <span className="text-[8px] text-gray-400">PNG, JPG, PDF limit 5MB</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleAttachmentUpload}
                  accept="image/*,.pdf"
                />
              </label>
            )}

            {/* List of uploaded files */}
            {form.attachments.length > 0 ? (
              <div className="space-y-2 pt-1">
                {form.attachments.map((file, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate flex-1">
                        <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <a href={file.url} download={file.name} className="text-[10px] font-bold text-gray-700 hover:underline truncate" target="_blank" rel="noopener noreferrer">
                          {file.name}
                        </a>
                      </div>
                      {!(viewMode || isLocked) && (
                        <button
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    
                    {/* Image Preview */}
                    {(/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.url) || file.url?.startsWith('data:image')) && (
                      <div className="mt-1">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="max-h-32 w-full object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(file.url, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic text-center py-2">No attachments uploaded yet</p>
            )}
          </div>

          {/* Follow-up Section */}
          <div className="card p-5 space-y-4 rounded-2xl border-l-4 border-l-orange-400 bg-orange-50/10">
            <div className="flex items-center gap-2 border-b border-orange-100/50 pb-2">
              <CalendarDays className="h-4.5 w-4.5 text-orange-500" />
              <h4 className="font-extrabold text-gray-900 text-sm">Follow-up Schedule</h4>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Follow Up Required?</label>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="followUpRequired"
                    value="Yes"
                    checked={form.followUpRequired === 'Yes'}
                    disabled={viewMode || isLocked}
                    onChange={() => handleChange('followUpRequired', 'Yes')}
                  /> Yes
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="followUpRequired"
                    value="No"
                    checked={form.followUpRequired === 'No'}
                    disabled={viewMode || isLocked}
                    onChange={() => handleChange('followUpRequired', 'No')}
                  /> No (Not Applicable)
                </label>
              </div>
            </div>

            {form.followUpRequired === 'Yes' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                    Follow Up Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`input py-2 text-xs ${validationErrors.followUpDate ? 'border-red-400' : ''}`}
                    value={form.followUpDate}
                    readOnly={viewMode || isLocked}
                    onChange={(e) => handleChange('followUpDate', e.target.value)}
                  />
                  {validationErrors.followUpDate && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.followUpDate}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Review Notes / Objectives</label>
                  <textarea
                    className="input min-h-[50px] text-xs resize-none"
                    value={form.reviewNotes}
                    readOnly={viewMode || isLocked}
                    onChange={(e) => handleChange('reviewNotes', e.target.value)}
                    placeholder="Key checks planned on follow-up..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Planned Next Procedure</label>
                  <input
                    type="text"
                    className="input py-2 text-xs"
                    value={form.nextProcedurePlanned}
                    readOnly={viewMode || isLocked}
                    onChange={(e) => handleChange('nextProcedurePlanned', e.target.value)}
                    placeholder="Next scheduled procedural service (e.g. Stitches Removal)..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pharmacy Prescription Table Block */}
      <div className="card p-6 space-y-4 rounded-2xl">
        <div className="flex items-center justify-between border-b border-orange-100 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Rx Pharmacy Prescriptions & Consumables</h3>
          </div>
        </div>

        {/* Entry Drawer */}
        {!(viewMode || isLocked) && (
          <div className="p-4 bg-orange-50/20 border border-orange-100/50 rounded-2xl grid gap-4 md:grid-cols-7 items-end relative z-10">
            <div className="md:col-span-2">
              <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Item Selection Type</label>
              <div className="flex items-center gap-4 py-1.5">
                <label className="flex items-center gap-1 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="itemSelectionType"
                    checked={prescItem.itemType === 'Medicine'}
                    onChange={() => {
                      setPrescItem(prev => ({ ...prev, itemType: 'Medicine', medicineName: '' }));
                      setMedQuery('');
                    }}
                  /> Medicine
                </label>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="itemSelectionType"
                    checked={prescItem.itemType === 'Consumable'}
                    onChange={() => {
                      setPrescItem(prev => ({ ...prev, itemType: 'Consumable', medicineName: '' }));
                    }}
                  /> Consumable
                </label>
              </div>
            </div>

            <div className="md:col-span-2 relative">
              <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Name</label>
              {prescItem.itemType === 'Medicine' ? (
                <>
                  <input
                    type="text"
                    placeholder="Search Pharmacy stock..."
                    className="input py-2 text-xs"
                    value={medQuery}
                    onChange={(e) => {
                      setMedQuery(e.target.value);
                      setPrescItem(prev => ({ ...prev, medicineName: e.target.value }));
                      setShowMedSuggestions(true);
                    }}
                    onFocus={() => setShowMedSuggestions(true)}
                  />
                  {showMedSuggestions && filteredMeds.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-xl z-50 overflow-hidden divide-y divide-gray-50 animate-in fade-in slide-in-from-top-1 duration-100">
                      {filteredMeds.map((med, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPrescItem(prev => ({ ...prev, medicineName: med.itemName }));
                            setMedQuery(med.itemName);
                            setShowMedSuggestions(false);
                          }}
                          className="w-full text-left p-2.5 hover:bg-orange-50/30 text-xs font-semibold text-gray-700 flex justify-between"
                        >
                          <span>{med.itemName}</span>
                          <span className="text-[10px] text-gray-400 font-medium">Qty: {med.quantity}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showMedSuggestions && medQuery.trim() && filteredMeds.length === 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-xl z-50 p-3 text-center text-xs italic text-gray-400">
                      No stock matches found
                    </div>
                  )}
                </>
              ) : (
                <select
                  className="input py-2 text-xs bg-white"
                  value={prescItem.medicineName}
                  onChange={(e) => setPrescItem(prev => ({ ...prev, medicineName: e.target.value }))}
                >
                  <option value="">Select consumable...</option>
                  {consumablesList.map((cons, idx) => (
                    <option key={idx} value={cons.name}>{cons.name} (₹{cons.price})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Dosage</label>
              <input
                type="text"
                placeholder="e.g. 500mg"
                className="input py-2 text-xs"
                value={prescItem.dosage}
                onChange={(e) => setPrescItem(prev => ({ ...prev, dosage: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Frequency</label>
              <input
                type="text"
                placeholder="e.g. 1-0-1"
                className="input py-2 text-xs"
                value={prescItem.frequency}
                onChange={(e) => setPrescItem(prev => ({ ...prev, frequency: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Duration</label>
              <input
                type="text"
                placeholder="e.g. 5 Days"
                className="input py-2 text-xs"
                value={prescItem.duration}
                onChange={(e) => setPrescItem(prev => ({ ...prev, duration: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Route</label>
              <input
                type="text"
                placeholder="e.g. Oral"
                className="input py-2 text-xs"
                value={prescItem.route}
                onChange={(e) => setPrescItem(prev => ({ ...prev, route: e.target.value }))}
              />
            </div>

            <div className="md:col-span-6">
              <label className="mb-1 block text-[9px] font-bold uppercase text-gray-500">Instructions</label>
              <input
                type="text"
                placeholder="e.g. Take after food"
                className="input py-2 text-xs"
                value={prescItem.instructions}
                onChange={(e) => setPrescItem(prev => ({ ...prev, instructions: e.target.value }))}
              />
            </div>

            <button
              type="button"
              onClick={addPrescriptionItem}
              className="btn py-2 text-xs font-bold w-full flex items-center justify-center gap-1 bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        )}

        {/* Prescription table */}
        {form.prescriptionMedicines && form.prescriptionMedicines.length > 0 ? (
          <div className="overflow-x-auto border border-gray-100 rounded-xl mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-orange-50/50 border-b border-orange-100 text-gray-600 font-bold uppercase tracking-wider">
                  <th className="p-3 pl-4">Type</th>
                  <th className="p-3">Medicine / Consumable Name</th>
                  <th className="p-3">Dosage</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Instructions</th>
                  {!(viewMode || isLocked) && <th className="p-3 w-16 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {form.prescriptionMedicines.map((item, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/10">
                    <td className="p-3 pl-4 text-[10px]">
                      <span className={`inline-flex px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wide ${
                        item.itemType === 'Consumable' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.itemType}
                      </span>
                    </td>
                    <td className="p-3 text-gray-900 font-extrabold">{item.medicineName}</td>
                    <td className="p-3 text-gray-600">{item.dosage || '-'}</td>
                    <td className="p-3 text-gray-600">{item.frequency || '-'}</td>
                    <td className="p-3 text-gray-600">{item.duration || '-'}</td>
                    <td className="p-3 text-gray-600">{item.route || '-'}</td>
                    <td className="p-3 text-gray-500 font-normal italic">{item.instructions || '-'}</td>
                    {!(viewMode || isLocked) && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removePrescriptionItem(idx)}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-6">No prescription medicines or consumables added yet.</p>
        )}
      </div>

      {/* Action Buttons Block */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 border-t border-orange-100 pt-6">
        <div className="flex gap-2 font-bold">
          {isCompleted && (
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="btn py-2.5 px-6 text-sm flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <Printer className="h-4.5 w-4.5" />
              Print Treatment Report
            </button>
          )}
          {!(viewMode || isLocked) && (
            <>
              <button
                onClick={() => handleSave('Draft')}
                disabled={saving}
                className="btn-secondary py-2.5 px-6 text-sm flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </button>
              <button
                onClick={() => handleSave('Completed')}
                disabled={saving}
                className="btn py-2.5 px-6 text-sm flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Complete Clinical Entry
              </button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSendToIpdClick}
            className={`btn py-2.5 px-6 text-sm flex items-center gap-2 text-white font-bold transition-all ${
              hasActiveIpd 
                ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-60' 
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            Send to IPD Admission
          </button>
        </div>
      </div>

      {/* Confirmation Warning Popup for Unlock/Edit */}
      {showEditConfirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 relative bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900">Unlock Clinical Record?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Warning: You are about to unlock this Same Day Care sheet for edits. Once unlocked, ensure all overwritten data remains clinically correct.
              </p>
              <div className="flex gap-3 w-full pt-4">
                <button
                  onClick={() => setShowEditConfirmModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsLockedState(false);
                    setIsUnlocked(true);
                    setShowEditConfirmModal(false);
                    toast.success('Clinical entries unlocked for edits');
                  }}
                  className="btn flex-1 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Unlock & Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IPD Referrals / Admit Drawer Popup Modal */}
      {showIpdModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 relative bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowIpdModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-orange-50 pb-3 mb-4">
              <Activity className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-gray-900 text-base">
                Refer & Admit to IPD (Bed Allocation)
              </h3>
            </div>

            <div className="space-y-4">
              {/* Skip Bed Allocation Checkbox */}
              <div className="flex items-center gap-2 bg-orange-50/30 p-3 rounded-xl border border-orange-100/50">
                <input
                  type="checkbox"
                  id="skipBedAllocation"
                  className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4 border-orange-200 cursor-pointer"
                  checked={skipBedAllocation}
                  onChange={(e) => setSkipBedAllocation(e.target.checked)}
                />
                <label htmlFor="skipBedAllocation" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                  Skip Bed Allocation (Allocate Later in IPD Same Day)
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Ward / Room Type</label>
                  <select
                    className="input py-2 text-xs bg-white"
                    value={selectedRoomType}
                    onChange={(e) => setSelectedRoomType(e.target.value)}
                    disabled={skipBedAllocation}
                  >
                    <option value="">Select Ward...</option>
                    {roomsList.map((room, idx) => (
                      <option key={idx} value={room.roomType}>{room.roomType} (₹{room.price}/day)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Bed Number</label>
                  <select
                    className="input py-2 text-xs bg-white"
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    disabled={skipBedAllocation || !selectedRoomType}
                  >
                    <option value="">Select Bed...</option>
                    {bedsList.map((bed, idx) => (
                      <option key={idx} value={bed._id} disabled={bed.status === 'Occupied'}>
                        Bed {bed.bedNumber} {bed.status === 'Occupied' ? '(Occupied)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Doctor In Charge</label>
                  <select
                    className="input py-2 text-xs bg-white"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                  >
                    <option value="">Select doctor...</option>
                    {doctorsList.map((doc, idx) => (
                      <option key={idx} value={doc._id}>Dr. {doc.doctorName || doc.username}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Admission Date-Time</label>
                  <input
                    type="datetime-local"
                    className="input py-2 text-xs"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Admission Status</label>
                  <select
                    className="input py-2 text-xs bg-white"
                    value={admissionStatus}
                    onChange={(e) => setAdmissionStatus(e.target.value)}
                  >
                    <option value="Admitted">Admitted</option>
                    <option value="Under Observation">Under Observation</option>
                    <option value="Shifted">Shifted</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-orange-50">
                <button
                  onClick={() => setShowIpdModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-bold"
                  disabled={admittingPatient}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToIpd}
                  className="btn flex-1 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-1.5"
                  disabled={admittingPatient}
                >
                  {admittingPatient ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing Admission...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Admit Patient
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print settings Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none no-print">
          <div className="card w-full max-w-2xl p-6 relative bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 border-b border-orange-50 pb-3 mb-4">
              <Printer className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-gray-900 text-base">
                Configure Report Print: {patient?.patientName || form.patientName}
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Language Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Select Print Language</label>
                <select
                  value={printLanguage}
                  onChange={(e) => setPrintLanguage(e.target.value)}
                  className="input py-2 text-xs bg-white text-gray-700 font-semibold border-orange-100"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Punjabi">Punjabi</option>
                </select>
              </div>

              {/* Important Notes dynamic list */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase text-gray-500">Important Notes</label>
                  <button
                    onClick={handleAddNoteField}
                    className="text-[10px] text-orange-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <ListPlus className="h-3 w-3" /> + Add Note
                  </button>
                </div>
                <div className="space-y-2">
                  {printNotes.map((note, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder={`Important note ${idx + 1}`}
                        value={note}
                        onChange={(e) => handleNoteChange(idx, e.target.value)}
                        className="input py-1.5 text-xs flex-1 border-orange-100"
                      />
                      {printNotes.length > 1 && (
                        <button
                          onClick={() => handleRemoveNoteField(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice Notes dynamic list */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase text-gray-500">Advice Notes</label>
                  <button
                    onClick={handleAddAdviceField}
                    className="text-[10px] text-orange-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <ListPlus className="h-3 w-3" /> + Add Advice
                  </button>
                </div>
                <div className="space-y-2">
                  {printAdvice.map((adv, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder={`Advice note ${idx + 1}`}
                        value={adv}
                        onChange={(e) => handleAdviceChange(idx, e.target.value)}
                        className="input py-1.5 text-xs flex-1 border-orange-100"
                      />
                      {printAdvice.length > 1 && (
                        <button
                          onClick={() => handleRemoveAdviceField(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-orange-50 pt-4 mt-6">
              <button
                onClick={() => setShowPrintModal(false)}
                className="btn-secondary py-2 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setTimeout(() => {
                    window.print();
                  }, 300);
                }}
                className="btn py-2 px-5 text-xs font-bold flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold"
              >
                <Printer className="h-4 w-4" /> Generate & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Report Print Area (Only visible during print) */}
      <div id="sdt-print-area" className="hidden print:block bg-white text-black p-8 font-sans text-xs max-w-[210mm] mx-auto min-h-[297mm]">
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #sdt-print-area, #sdt-print-area * {
              visibility: visible !important;
            }
            #sdt-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              display: block !important;
            }
          }
        `}</style>
        
        {/* Letterhead Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
          <div className="flex items-center gap-3">
            {hospitalSettings?.logoUrl ? (
              <img src={hospitalSettings.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
            ) : (
              <div className="h-14 w-14 bg-gray-200 border border-gray-400 rounded-xl flex items-center justify-center font-bold text-lg">H</div>
            )}
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight">{hospitalSettings?.hospitalName || user?.hospitalName || 'HOSPITAL'}</h1>
              <p className="text-[10px] text-gray-500 leading-tight max-w-sm mt-0.5">{hospitalSettings?.address}</p>
              <p className="text-[10px] text-gray-500 leading-tight">Ph: {hospitalSettings?.mobileNumbers?.join(', ') || hospitalSettings?.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-orange-700">
              {TRANSLATIONS[printLanguage]?.title || 'TREATMENT REPORT'}
            </h2>
            <div className="text-[10px] text-gray-400 mt-1">Date: {new Date(form.treatmentDate).toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        {/* Patient Info Grid */}
        <div className="border border-gray-800 rounded-lg p-3 mb-6">
          <h3 className="font-bold uppercase text-[11px] mb-2 border-b border-gray-300 pb-1 text-gray-700">
            {TRANSLATIONS[printLanguage]?.patientDetails || 'Patient Details'}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px]">
            <div><strong>{TRANSLATIONS[printLanguage]?.patientName || 'Patient Name'}:</strong> {patient?.patientName || form.patientName}</div>
            <div><strong>{TRANSLATIONS[printLanguage]?.uhid || 'UHID'}:</strong> {formatUhid(patient?.uhid || form.uhid)}</div>
            <div><strong>{TRANSLATIONS[printLanguage]?.ageGender || 'Age / Gender'}:</strong> {patient?.dob ? ageFromDob(patient.dob) : form.age} yrs / {patient?.gender || form.gender}</div>
            <div><strong>{TRANSLATIONS[printLanguage]?.mobile || 'Mobile'}:</strong> {patient?.mobile || form.mobile}</div>
            <div><strong>{TRANSLATIONS[printLanguage]?.date || 'Date'}:</strong> {new Date(form.treatmentDate).toLocaleDateString('en-IN')}</div>
            <div><strong>{TRANSLATIONS[printLanguage]?.procedure || 'Procedure'}:</strong> {form.treatmentType}</div>
            <div className="col-span-2"><strong>Registered / Referred By:</strong> {record?.source === 'Doctor Referral' ? `Dr. Referral (${record.referredByDoctorName || 'Doctor'})` : `Registration (${record?.createdBy?.doctorName || record?.createdBy?.username || patient?.registeredBy || 'Receptionist'})`}</div>
          </div>
        </div>

        {/* Clinical Details */}
        <div className="space-y-4">
          <div>
            <h3 className="font-bold uppercase text-[11px] mb-1.5 border-b border-gray-300 pb-0.5 text-gray-700">
              {TRANSLATIONS[printLanguage]?.diagnosis || 'Diagnosis'}
            </h3>
            <p className="font-semibold text-gray-900">{form.diagnosis || 'N/A'}</p>
          </div>

          {/* Vitals Summary */}
          {form.vitals && (
            <div>
              <h3 className="font-bold uppercase text-[11px] mb-1.5 border-b border-gray-300 pb-0.5 text-gray-700">Vitals</h3>
              <div className="grid grid-cols-5 gap-2 text-[10px]">
                <div><strong>BP:</strong> {form.vitals.bloodPressure || 'N/A'}</div>
                <div><strong>Pulse:</strong> {form.vitals.pulse ? `${form.vitals.pulse} bpm` : 'N/A'}</div>
                <div><strong>Temp:</strong> {form.vitals.temperature ? `${form.vitals.temperature} °C` : 'N/A'}</div>
                <div><strong>Height:</strong> {form.vitals.height ? `${form.vitals.height} cm` : 'N/A'}</div>
                <div><strong>Weight:</strong> {form.vitals.weight ? `${form.vitals.weight} kg` : 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Prescription Table */}
          {form.prescriptionMedicines && form.prescriptionMedicines.filter(item => item.itemType === 'Medicine').length > 0 && (
            <div>
              <h3 className="font-bold uppercase text-[11px] mb-1.5 border-b border-gray-300 pb-0.5 text-gray-700">
                {TRANSLATIONS[printLanguage]?.prescription || 'Rx Prescription'}
              </h3>
              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-bold text-[10px]">
                    <th className="p-1.5 border-r border-gray-300">{TRANSLATIONS[printLanguage]?.medicineName || 'Medicine Name'}</th>
                    <th className="p-1.5 border-r border-gray-300">{TRANSLATIONS[printLanguage]?.dosage || 'Dosage'}</th>
                    <th className="p-1.5 border-r border-gray-300">{TRANSLATIONS[printLanguage]?.frequency || 'Frequency'}</th>
                    <th className="p-1.5 border-r border-gray-300">{TRANSLATIONS[printLanguage]?.duration || 'Duration'}</th>
                    <th className="p-1.5 border-r border-gray-300">Route</th>
                    <th className="p-1.5">{TRANSLATIONS[printLanguage]?.instructions || 'Instructions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 text-[10px]">
                  {form.prescriptionMedicines
                    .filter(item => item.itemType === 'Medicine')
                    .map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 border-r border-gray-300 font-bold">{item.medicineName}</td>
                        <td className="p-1.5 border-r border-gray-300">{item.dosage || '-'}</td>
                        <td className="p-1.5 border-r border-gray-300">{item.frequency || '-'}</td>
                        <td className="p-1.5 border-r border-gray-300">{item.duration || '-'}</td>
                        <td className="p-1.5 border-r border-gray-300">{item.route || '-'}</td>
                        <td className="p-1.5 italic">{item.instructions || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Important Notes */}
          {printNotes.some(n => n.trim() !== '') && (
            <div>
              <h3 className="font-bold uppercase text-[11px] mb-1.5 border-b border-gray-300 pb-0.5 text-gray-700">
                {TRANSLATIONS[printLanguage]?.importantNotes || 'Important Notes'}
              </h3>
              <ul className="list-disc pl-4 space-y-1">
                {printNotes.filter(n => n.trim() !== '').map((note, idx) => (
                  <li key={idx} className="text-gray-855 text-[10px]">{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Advice Notes */}
          {printAdvice.some(a => a.trim() !== '') && (
            <div>
              <h3 className="font-bold uppercase text-[11px] mb-1.5 border-b border-gray-300 pb-0.5 text-gray-700">
                {TRANSLATIONS[printLanguage]?.adviceNotes || 'Advice Notes'}
              </h3>
              <ul className="list-disc pl-4 space-y-1">
                {printAdvice.filter(a => a.trim() !== '').map((adv, idx) => (
                  <li key={idx} className="text-gray-855 text-[10px]">{adv}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Signature Block */}
        <div className="mt-20 flex justify-between text-[10px] pt-8 border-t border-dashed border-gray-300">
          <div>
            <p>____________________________________</p>
            <p className="font-bold text-center mt-1">{TRANSLATIONS[printLanguage]?.clinicianSignature || 'Clinician Signature'}</p>
          </div>
          <div>
            <p>____________________________________</p>
            <p className="font-bold text-center mt-1">{TRANSLATIONS[printLanguage]?.signatureLine || 'Consultant Signature'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SameDayCareForm;