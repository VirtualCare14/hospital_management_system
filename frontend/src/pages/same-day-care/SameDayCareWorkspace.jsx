import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import toast from 'react-hot-toast';
import {
  Activity, Search, User, Loader2, Eye,
  Plus, Stethoscope, CalendarDays, Phone, Clock,
  RefreshCw, Bandage, Bone, Flame, Droplets, Wind, Syringe,
  X, FolderHeart, CheckCircle, Printer, Download, PlusCircle, Trash2, ListPlus, Pill, ClipboardCheck, ShieldAlert,
  MoreVertical, CreditCard, Lock, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useHeader } from '../../context/HeaderContext';
import { formatUhid } from '../../utils/uhid';

const TREATMENT_ICONS = {
  'Fracture': Bone,
  'Minor Injury': Bandage,
  'Minor Stitches': Syringe,
  'Small Burns': Flame,
  'Mild Allergic Reactions': Wind,
  'Dialysis': Droplets
};

const TRANSLATIONS = {
  English: {
    title: "SAME DAY TREATMENT REPORT",
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
    instructions: "સૂਚનાઓ",
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

const SameDayCareWorkspace = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [patients, setPatients] = useState([]);
  const [queue, setQueue] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [queueSearch, setQueueSearch] = useState('');
  const [selectedReportDate, setSelectedReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [datewiseRecords, setDatewiseRecords] = useState([]);
  const [loadingDatewise, setLoadingDatewise] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showTreatmentList, setShowTreatmentList] = useState(false);
  const [patientTreatments, setPatientTreatments] = useState([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);
  const [followups, setFollowups] = useState([]);
  const [followUpFilterDate, setFollowUpFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [patientDateFilter, setPatientDateFilter] = useState('today'); // 'previous' | 'today' | 'upcoming' | 'all'

  // New States for completed treatments, pending treatments, hospital settings
  const [completedList, setCompletedList] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [hospitalSettings, setHospitalSettings] = useState(null);
  const [pendingSourceFilter, setPendingSourceFilter] = useState('All');
  const [completedSourceFilter, setCompletedSourceFilter] = useState('All');

  // Print Configuration Modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [printNotes, setPrintNotes] = useState(['']);
  const [printAdvice, setPrintAdvice] = useState(['']);
  const [printLanguage, setPrintLanguage] = useState('English');

  // Track Timeline Modal
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackRecord, setTrackRecord] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [trackMedAdministrations, setTrackMedAdministrations] = useState([]);
  const [actionMenuRowId, setActionMenuRowId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-menu-dropdown') && !e.target.closest('.action-menu-btn')) {
        setActionMenuRowId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const separator = search ? '&' : '?';
      const params = search ? `?search=${search}` : '';
      const { data } = await client.get(`/patients${params}${separator}sameDayCareOnly=true`);
      setPatients(data || []);
    } catch (err) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async () => {
    setLoadingQueue(true);
    try {
      const { data } = await client.get('/same-day-care/treatment?status=Draft');
      setQueue(data || []);
    } catch (err) {
      toast.error('Failed to load care queue');
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadFollowups = async (date) => {
    setLoadingFollowups(true);
    try {
      const targetDate = date || followUpFilterDate;
      const { data } = await client.get(`/same-day-care/treatment?followUpRequired=Yes&followUpDate=${targetDate}`);
      setFollowups(data || []);
    } catch (err) {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoadingFollowups(false);
    }
  };

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const { data } = await client.get('/ipd/settings');
      let cats = data.sameDayCareCategories || [];
      if (cats.length === 0) {
        cats = [
          { name: 'Fracture', subServices: [{ name: 'Fracture', price: 500, isActive: true }] },
          { name: 'Minor Injury', subServices: [{ name: 'Minor Injury', price: 300, isActive: true }] },
          { name: 'Minor Stitches', subServices: [{ name: 'Minor Stitches', price: 400, isActive: true }] },
          { name: 'Small Burns', subServices: [{ name: 'Small Burns', price: 350, isActive: true }] },
          { name: 'Mild Allergic Reactions', subServices: [{ name: 'Mild Allergic Reactions', price: 250, isActive: true }] },
          { name: 'Dialysis', subServices: [{ name: 'Dialysis', price: 2000, isActive: true }] }
        ];
      }
      setCategories(cats.filter(c => c.isActive !== false));
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadCompletedList = async () => {
    setLoadingCompleted(true);
    try {
      const { data } = await client.get('/same-day-care/treatment?status=Completed');
      setCompletedList(data || []);
    } catch (err) {
      toast.error('Failed to load completed treatments');
    } finally {
      setLoadingCompleted(false);
    }
  };

  const loadAdmissions = async () => {
    try {
      const { data } = await client.get('/ipd/admissions');
      setAdmissions(data || []);
    } catch (err) {
      console.warn('Failed to load admissions', err);
    }
  };

  const loadDatewiseRecords = async () => {
    setLoadingDatewise(true);
    try {
      const { data } = await client.get(`/same-day-care/treatment?fromDate=${selectedReportDate}&toDate=${selectedReportDate}`);
      setDatewiseRecords(data || []);
    } catch (err) {
      toast.error('Failed to load date-wise treatment records');
    } finally {
      setLoadingDatewise(false);
    }
  };

  const loadHospitalSettings = async () => {
    try {
      const { data } = await client.get('/admin/hospital-settings');
      setHospitalSettings(data?.data || data);
    } catch (err) {
      console.error('Failed to load hospital settings', err);
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadQueue(),
      loadCompletedList(),
      loadPatients(),
      loadSettings(),
      loadFollowups(),
      loadHospitalSettings(),
      loadAdmissions()
    ]);
    if (activeTab === 'datewise') {
      loadDatewiseRecords();
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (tabParam === 'completed') {
      setActiveTab('completed');
    } else if (tabParam === 'pending' || tabParam === 'queue') {
      setActiveTab('pending');
    } else if (tabParam === 'followup') {
      setActiveTab('followup');
    } else if (tabParam === 'all') {
      setActiveTab('all');
    } else if (tabParam === 'datewise') {
      setActiveTab('datewise');
    } else {
      setActiveTab('all');
    }
  }, [tabParam]);

  useEffect(() => {
    if (activeTab === 'pending' || activeTab === 'queue') {
      loadQueue();
      loadAdmissions();
    } else if (activeTab === 'completed') {
      loadCompletedList();
      loadAdmissions();
    } else if (activeTab === 'followup') {
      loadFollowups();
    } else if (activeTab === 'datewise') {
      loadDatewiseRecords();
    }
  }, [activeTab, followUpFilterDate, selectedReportDate]);

  // Notes builder functions
  const handleAddNoteField = () => setPrintNotes([...printNotes, '']);
  const handleRemoveNoteField = (index) => setPrintNotes(printNotes.filter((_, i) => i !== index));
  const handleNoteChange = (index, val) => {
    const copy = [...printNotes];
    copy[index] = val;
    setPrintNotes(copy);
  };

  const handleAddAdviceField = () => setPrintAdvice([...printAdvice, '']);
  const handleRemoveAdviceField = (index) => setPrintAdvice(printAdvice.filter((_, i) => i !== index));
  const handleAdviceChange = (index, val) => {
    const copy = [...printAdvice];
    copy[index] = val;
    setPrintAdvice(copy);
  };

  const handleOpenPrint = (record) => {
    setSelectedRecord(record);
    setPrintNotes(['']);
    setPrintAdvice(['']);
    setPrintLanguage('English');
    setShowPrintModal(true);
  };

  const handleOpenTrack = async (record) => {
    setTrackRecord(record);
    setTrackMedAdministrations([]);
    setShowTrackModal(true);
    try {
      const patientId = record.patientId?._id || record.patientId;
      const { data: admList } = await client.get('/ipd/admissions');
      const matchedAdmissions = admList.filter(adm => adm.patientId?._id === patientId);
      
      const allAdmins = [];
      for (const adm of matchedAdmissions) {
        const { data: adminLogs } = await client.get(`/ipd/medication-administrations/${adm._id}`);
        if (adminLogs && adminLogs.length > 0) {
          allAdmins.push(...adminLogs);
        }
      }
      setTrackMedAdministrations(allAdmins);
    } catch (err) {
      console.warn('Failed to load medication administrations for tracking', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPatients();
  };

  const loadPatientTreatments = async (patient) => {
    setTreatmentsLoading(true);
    setSelectedPatient(patient);
    setShowTreatmentList(true);
    try {
      const { data } = await client.get(`/same-day-care/treatment/patient/${patient._id}`);
      setPatientTreatments(data || []);
    } catch (err) {
      toast.error('Failed to load care records');
    } finally {
      setTreatmentsLoading(false);
    }
  };

  const handleNewTreatment = (treatmentType) => {
    const draftRecord = patientTreatments.find(t => t.status === 'Draft');
    const recordParam = draftRecord ? `&recordId=${draftRecord._id}` : '';

    if (treatmentType === 'Dialysis') {
      const dialRecordParam = draftRecord ? `?recordId=${draftRecord._id}` : '';
      navigate(`/same-day-care/dialysis/treatment/${selectedPatient._id}${dialRecordParam}`);
      return;
    }
    navigate(`/same-day-care/treatment/${selectedPatient._id}?type=${treatmentType}${recordParam}`);
  };

  const handleViewTreatment = (record) => {
    if (record.treatmentType === 'Dialysis') {
      navigate(`/same-day-care/dialysis/treatment/${record.patientId?._id || record.patientId}?recordId=${record._id}&view=true`);
    } else {
      navigate(`/same-day-care/treatment/${record.patientId?._id || record.patientId}?type=${record.treatmentType}&recordId=${record._id}&view=true`);
    }
  };

  const getFilteredQueue = () => {
    return queue.filter(item => {
      // Filter out records without a selected care/treatment type
      if (!item.treatmentType || item.treatmentType.trim() === '') return false;

      // 1. Filter by search
      if (queueSearch.trim()) {
        const term = queueSearch.toLowerCase();
        const matchesSearch = (
          (item.patientName && item.patientName.toLowerCase().includes(term)) ||
          (item.uhid && item.uhid.toLowerCase().includes(term)) ||
          (item.mobile && item.mobile.includes(term))
        );
        if (!matchesSearch) return false;
      }

      // 2. Filter by source
      if (pendingSourceFilter === 'Doctor' && item.source !== 'Doctor Referral') return false;
      if (pendingSourceFilter === 'Reception' && item.source !== 'Registration') return false;

      return true;
    });
  };

  const filteredQueue = getFilteredQueue();

  const activeDraftPatientIds = new Set(queue.map(q => q.patientId?._id || q.patientId));
  const completedPatientIds = new Set(completedList.map(c => c.patientId?._id || c.patientId));

  const getPatientDateCounts = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    let previous = 0;
    let todays = 0;
    let upcoming = 0;
    let all = 0;

    patients.forEach(p => {
      const hasCompleted = completedPatientIds.has(p._id);
      const hasActiveDraft = activeDraftPatientIds.has(p._id);
      if (hasCompleted && !hasActiveDraft) {
        return;
      }

      all++;
      if (!p.appointmentDate) return;
      const appDateStr = p.appointmentDate;
      if (appDateStr === todayStr) {
        todays++;
      } else if (appDateStr < todayStr) {
        previous++;
      } else if (appDateStr > todayStr) {
        upcoming++;
      }
    });

    return { previous, todays, upcoming, all };
  };

  const getFilteredPatients = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    return patients.filter(p => {
      const hasCompleted = completedPatientIds.has(p._id);
      const hasActiveDraft = activeDraftPatientIds.has(p._id);
      if (hasCompleted && !hasActiveDraft) {
        return false;
      }

      // Apply search term filter first if exists
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchesSearch = (
          (p.patientName && p.patientName.toLowerCase().includes(term)) ||
          (p.uhid && p.uhid.toLowerCase().includes(term)) ||
          (p.mobile && p.mobile.includes(term))
        );
        if (!matchesSearch) return false;
      }

      if (!p.appointmentDate) return patientDateFilter === 'all';
      const appDateStr = p.appointmentDate;
      
      if (patientDateFilter === 'today') {
        return appDateStr === todayStr;
      } else if (patientDateFilter === 'previous') {
        return appDateStr < todayStr;
      } else if (patientDateFilter === 'upcoming') {
        return appDateStr > todayStr;
      }
      return true; // 'all'
    });
  };

  const filteredPatients = getFilteredPatients();

  useHeader({ onRefresh: loadAllData });

  return (
    <div className="text-sm sm:text-base">
      <div className="no-print space-y-6">
        {!showTreatmentList ? (
        <>
          {/* Tabs Menu */}
          <div className="flex bg-orange-50/50 p-1 rounded-xl border border-orange-100 w-fit mb-4 mb-4 select-none">
            <button
              onClick={() => { setActiveTab('pending'); setSearchParams({ tab: 'pending' }); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'pending' || activeTab === 'queue' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <Clock className="h-4 w-4" /> Treatment Pending ({filteredQueue.length})
            </button>
            <button
              onClick={() => { setActiveTab('completed'); setSearchParams({ tab: 'completed' }); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'completed' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <CheckCircle className="h-4 w-4" /> Treatment Completed ({completedList.length})
            </button>
            <button
              onClick={() => { setActiveTab('followup'); setSearchParams({ tab: 'followup' }); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'followup' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <CalendarDays className="h-4 w-4" /> Scheduled Follow-ups ({followups.length})
            </button>
             <button
              onClick={() => { setActiveTab('all'); setSearchParams({ tab: 'all' }); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <User className="h-4 w-4" /> All Patients (Lookup)
            </button>
            <button
              onClick={() => { setActiveTab('datewise'); setSearchParams({ tab: 'datewise' }); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'datewise' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <Activity className="h-4 w-4" /> Date-wise Tracking
            </button>
          </div>

          {activeTab === 'pending' || activeTab === 'queue' ? (
            /* Treatment Pending Table */
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-orange-100 bg-orange-50/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><Clock className="h-5 w-5 text-orange-500" /> Treatment Pending</h3>
                  <div className="relative w-48 sm:w-64 font-medium flex items-center">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      className="input pl-9 pr-8 py-1.5 text-xs bg-white border-orange-100 rounded-lg w-full"
                      placeholder="Search pending patients..."
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                    />
                    {queueSearch && (
                      <button onClick={() => setQueueSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Source Filters */}
                <div className="flex bg-orange-100/50 p-0.5 rounded-lg border border-orange-100 w-fit select-none">
                  <button
                    onClick={() => setPendingSourceFilter('All')}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                      pendingSourceFilter === 'All' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/30'
                    }`}
                  >
                    All Pending ({filteredQueue.length})
                  </button>
                  <button
                    onClick={() => setPendingSourceFilter('Doctor')}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                      pendingSourceFilter === 'Doctor' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/30'
                    }`}
                  >
                    Doctor Referrals ({filteredQueue.filter(q => q.source === 'Doctor Referral').length})
                  </button>
                  <button
                    onClick={() => setPendingSourceFilter('Reception')}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                      pendingSourceFilter === 'Reception' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/30'
                    }`}
                  >
                    Reception ({filteredQueue.filter(q => q.source === 'Registration').length})
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                      <th className="p-3 pl-4">Patient Name</th>
                      <th className="p-3">UHID</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Age</th>
                      <th className="p-3">Care Type</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Assigned Date</th>
                      <th className="p-3 pr-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50 font-medium">
                    {loadingQueue ? (
                      <tr>
                        <td colSpan="9" className="p-8">
                          <SkeletonTable rows={5} columns={9} className="w-full" />
                        </td>
                      </tr>
                    ) : queue.filter(item => {
                      if (pendingSourceFilter === 'Doctor') return item.source === 'Doctor Referral';
                      if (pendingSourceFilter === 'Reception') return item.source === 'Registration';
                      return true;
                    }).length === 0 ? (
                      <tr><td colSpan="9" className="p-8 text-center text-gray-400"><Clock className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-400" /><p className="font-bold">No pending treatments match the filter</p></td></tr>
                    ) : (
                      queue.filter(item => {
                        if (pendingSourceFilter === 'All') return true;
                        if (pendingSourceFilter === 'Doctor') return item.source === 'Doctor Referral';
                        if (pendingSourceFilter === 'Reception') return item.source === 'Registration';
                        return true;
                      }).map(item => (
                        <tr key={item._id} className="hover:bg-orange-50/20">
                          <td className="p-3 pl-4">
                            <span className="font-bold text-gray-950 block">{item.patientName}</span>
                            <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                              {item.source === 'Doctor Referral' 
                                ? `Referred by: Dr. ${item.referredByDoctorName || 'Doctor'}` 
                                : `Registered by: ${item.createdBy?.doctorName || item.createdBy?.username || 'Receptionist'}`}
                            </span>
                            {item.referredByDoctorRemarks && (
                              <p className="text-[10px] text-gray-500 italic mt-1 max-w-xs bg-orange-50/40 p-1 rounded border border-orange-100/50">
                                Remarks: {item.referredByDoctorRemarks}
                              </p>
                            )}
                          </td>
                          <td className="p-3 font-mono text-xs font-bold text-orange-700">{formatUhid(item.uhid)}</td>
                          <td className="p-3 text-xs">{item.mobile}</td>
                          <td className="p-3 text-xs">{item.gender}</td>
                          <td className="p-3 text-xs">{item.age ? `${item.age} years` : '-'}</td>
                          <td className="p-3 text-xs font-semibold">{item.treatmentType}</td>
                          <td className="p-3 text-xs">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.source === 'Doctor Referral' 
                                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`} title={item.referredByDoctorName ? `Referred by: ${item.referredByDoctorName}` : undefined}>
                              {item.source === 'Doctor Referral' ? `Dr. Referral (${item.referredByDoctorName || 'Doc'})` : 'Registration'}
                            </span>
                            {item.assignedStaffName && (
                              <span className="block text-[9px] text-indigo-600 font-bold mt-1">
                                Assigned: {item.assignedStaffName}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-xs">{new Date(item.treatmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-3 pr-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const activeAdmission = admissions.find(adm => adm.patientId?._id === item.patientId && adm.status !== 'Discharged');
                              return (
                                <div className="relative inline-block text-left">
                                  <button
                                    type="button"
                                    onClick={() => setActionMenuRowId(actionMenuRowId === item._id ? null : item._id)}
                                    className="action-menu-btn p-1.5 hover:bg-orange-100/70 text-gray-600 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-2xs inline-flex items-center justify-center cursor-pointer"
                                    title="Actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>

                                  {actionMenuRowId === item._id && (
                                    <div className="action-menu-dropdown absolute right-0 z-50 mt-1 w-44 bg-white rounded-xl shadow-xl border border-orange-100 py-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActionMenuRowId(null);
                                          if (item.treatmentType === 'Dialysis') {
                                            navigate(`/same-day-care/dialysis/treatment/${item.patientId}?recordId=${item._id}`);
                                          } else {
                                            navigate(`/same-day-care/treatment/${item.patientId}?type=${item.treatmentType}&recordId=${item._id}`);
                                          }
                                        }}
                                        className="w-full px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                      >
                                        <Activity className="h-3.5 w-3.5 text-orange-600" /> Start Care
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { setActionMenuRowId(null); handleViewTreatment(item); }}
                                        className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                      >
                                        <Eye className="h-3.5 w-3.5 text-gray-500" /> View Details
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { setActionMenuRowId(null); handleOpenTrack(item); }}
                                        className="w-full px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                      >
                                        <Activity className="h-3.5 w-3.5 text-sky-600" /> Track Timeline
                                      </button>
                                      {activeAdmission && (
                                        <button
                                          type="button"
                                          onClick={() => { setActionMenuRowId(null); navigate(`/same-day-care/ipd-chart/${activeAdmission._id}`); }}
                                          className="w-full px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                        >
                                          <ClipboardCheck className="h-3.5 w-3.5 text-blue-600" /> Inpatient Drug Chart
                                        </button>
                                      )}
                                      <div className="border-t border-orange-100/70 my-0.5"></div>
                                      <button
                                        type="button"
                                        onClick={() => { setActionMenuRowId(null); navigate(`/billing?search=${item.uhid || item.patientName}`); }}
                                        className="w-full px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                      >
                                        <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Open Billing
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'completed' ? (
            /* Treatment Completed Table */
            <div className="card overflow-hidden border border-orange-100 bg-white">
              <div className="p-4 border-b border-orange-100 bg-orange-50/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" /> Treatment Completed
                  </h3>
                  <div className="relative w-48 sm:w-64 font-medium flex items-center">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      className="input pl-9 pr-8 py-1.5 text-xs bg-white border-orange-100 rounded-lg w-full"
                      placeholder="Search completed patients..."
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                    />
                    {queueSearch && (
                      <button onClick={() => setQueueSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Completed Source Filters */}
                <div className="flex bg-orange-100/50 p-0.5 rounded-lg border border-orange-100 w-fit select-none">
                  <button
                    onClick={() => setCompletedSourceFilter('All')}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                      completedSourceFilter === 'All' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/30'
                    }`}
                  >
                    All Completed ({completedList.length})
                  </button>
                  <button
                    onClick={() => setCompletedSourceFilter('Doctor')}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                      completedSourceFilter === 'Doctor' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/30'
                    }`}
                  >
                    Doctor Referrals ({completedList.filter(q => q.source === 'Doctor Referral').length})
                  </button>
                  <button
                    onClick={() => setCompletedSourceFilter('Reception')}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                      completedSourceFilter === 'Reception' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/30'
                    }`}
                  >
                    Reception ({completedList.filter(q => q.source === 'Registration').length})
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                      <th className="p-3 pl-4">Patient Name</th>
                      <th className="p-3">UHID</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Care Type</th>
                      <th className="p-3">Completion Date</th>
                      <th className="p-3 pr-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {loadingCompleted ? (
                      <tr>
                        <td colSpan="7" className="p-8">
                          <SkeletonTable rows={4} columns={7} className="w-full" />
                        </td>
                      </tr>
                    ) : completedList.filter(item => {
                      if (completedSourceFilter === 'Doctor' && item.source !== 'Doctor Referral') return false;
                      if (completedSourceFilter === 'Reception' && item.source !== 'Registration') return false;
                      if (queueSearch) {
                        const term = queueSearch.toLowerCase();
                        return (
                          (item.patientName || '').toLowerCase().includes(term) ||
                          (item.uhid || '').toLowerCase().includes(term) ||
                          (item.mobile || '').includes(term)
                        );
                      }
                      return true;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-400">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
                          <p className="font-bold">No completed treatments match the filter</p>
                        </td>
                      </tr>
                    ) : (
                      completedList.filter(item => {
                        if (completedSourceFilter === 'Doctor' && item.source !== 'Doctor Referral') return false;
                        if (completedSourceFilter === 'Reception' && item.source !== 'Registration') return false;
                        if (queueSearch) {
                          const term = queueSearch.toLowerCase();
                          return (
                            (item.patientName || '').toLowerCase().includes(term) ||
                            (item.uhid || '').toLowerCase().includes(term) ||
                            (item.mobile || '').includes(term)
                          );
                        }
                        return true;
                      }).map(item => (
                        <tr key={item._id} className="hover:bg-orange-50/20">
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-955 block">{item.patientName}</span>
                              {item.isBillGenerated && (
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200" title={`Invoice: ${item.billingDetails?.invoiceNo || item.billingDetails?.billNo || 'Generated'}`}>
                                  <Lock className="h-2.5 w-2.5" /> Billed
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                              {item.source === 'Doctor Referral' 
                                ? `Referred by: Dr. ${item.referredByDoctorName || 'Doctor'}` 
                                : `Registered by: ${item.createdBy?.doctorName || item.createdBy?.username || 'Receptionist'}`}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs font-bold text-orange-700">{formatUhid(item.uhid)}</td>
                          <td className="p-3 text-xs">{item.mobile}</td>
                          <td className="p-3 text-xs">{item.gender}</td>
                          <td className="p-3 text-xs font-semibold">{item.treatmentType}</td>
                          <td className="p-3 text-xs">
                            {new Date(item.updatedAt || item.treatmentDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="p-3 pr-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setActionMenuRowId(actionMenuRowId === item._id ? null : item._id)}
                                className="action-menu-btn p-1.5 hover:bg-orange-100/70 text-gray-600 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-2xs inline-flex items-center justify-center cursor-pointer"
                                title="Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {actionMenuRowId === item._id && (
                                <div className="action-menu-dropdown absolute right-0 z-50 mt-1 w-44 bg-white rounded-xl shadow-xl border border-orange-100 py-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left">
                                  <button
                                    type="button"
                                    onClick={() => { setActionMenuRowId(null); handleOpenPrint(item); }}
                                    className="w-full px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                  >
                                    <Printer className="h-3.5 w-3.5 text-orange-600" /> Print Report
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setActionMenuRowId(null); handleViewTreatment(item); }}
                                    className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-gray-500" /> View Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setActionMenuRowId(null); handleOpenTrack(item); }}
                                    className="w-full px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                  >
                                    <Activity className="h-3.5 w-3.5 text-sky-600" /> Track Timeline
                                  </button>
                                  <div className="border-t border-orange-100/70 my-0.5"></div>
                                  <button
                                    type="button"
                                    onClick={() => { setActionMenuRowId(null); navigate(`/billing?search=${item.uhid || item.patientName}`); }}
                                    className="w-full px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                  >
                                    <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Billing Desk
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'followup' ? (
            /* Follow-up Patients Queue */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="card p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-orange-50/30 to-white">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Filter Scheduled Follow-ups</h3>
                  <p className="text-xs text-gray-500">Showing patients scheduled for check-ups on this date.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">Select Date:</span>
                  <input
                    type="date"
                    className="input py-2 px-3 text-xs w-44"
                    value={followUpFilterDate}
                    onChange={(e) => setFollowUpFilterDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="p-4 border-b border-orange-100 bg-orange-50/30">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-orange-500" /> Follow-ups Queue</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                        <th className="p-3 pl-4">Patient Name</th>
                        <th className="p-3">UHID</th>
                        <th className="p-3">Mobile</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Care Type</th>
                        <th className="p-3">Next Procedure (Planned)</th>
                        <th className="p-3">Review Notes</th>
                        <th className="p-3 pr-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {loadingFollowups ? (
                        <tr>
                          <td colSpan="8" className="p-8">
                            <SkeletonTable rows={4} columns={8} className="w-full" />
                          </td>
                        </tr>
                      ) : followups.length === 0 ? (
                        <tr><td colSpan="8" className="p-8 text-center text-gray-400"><CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No follow-ups scheduled for this date</p></td></tr>
                      ) : (
                        followups.map(item => (
                          <tr key={item._id} className="hover:bg-orange-50/20">
                            <td className="p-3 pl-4">
                              <span className="font-bold text-gray-955 block">{item.patientName}</span>
                              <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                                {item.source === 'Doctor Referral' 
                                  ? `Referred by: Dr. ${item.referredByDoctorName || 'Doctor'}` 
                                  : `Registered by: ${item.createdBy?.doctorName || item.createdBy?.username || 'Receptionist'}`}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-xs font-bold text-orange-700">{formatUhid(item.uhid)}</td>
                            <td className="p-3 text-xs">{item.mobile}</td>
                            <td className="p-3 text-xs">{item.gender}</td>
                            <td className="p-3 text-xs font-semibold">{item.treatmentType}</td>
                            <td className="p-3 text-xs font-medium text-orange-700">{item.nextProcedurePlanned || 'Routine Checkup'}</td>
                            <td className="p-3 text-xs truncate max-w-[200px]" title={item.reviewNotes}>{item.reviewNotes || '-'}</td>
                            <td className="p-3 pr-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-block text-left">
                                <button
                                  type="button"
                                  onClick={() => setActionMenuRowId(actionMenuRowId === item._id ? null : item._id)}
                                  className="action-menu-btn p-1.5 hover:bg-orange-100/70 text-gray-600 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-2xs inline-flex items-center justify-center cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {actionMenuRowId === item._id && (
                                  <div className="action-menu-dropdown absolute right-0 z-50 mt-1 w-44 bg-white rounded-xl shadow-xl border border-orange-100 py-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setActionMenuRowId(null);
                                        try {
                                          const { data: pat } = await client.get(`/patients/${item.patientId?._id || item.patientId}`);
                                          loadPatientTreatments(pat);
                                        } catch (err) {
                                          toast.error("Failed to load patient details");
                                        }
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <Activity className="h-3.5 w-3.5 text-orange-600" /> Start Care
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setActionMenuRowId(null); handleViewTreatment(item); }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <Eye className="h-3.5 w-3.5 text-gray-500" /> View Details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setActionMenuRowId(null); handleOpenPrint(item); }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <Printer className="h-3.5 w-3.5 text-orange-500" /> Print Report
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setActionMenuRowId(null); handleOpenTrack(item); }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <Activity className="h-3.5 w-3.5 text-sky-600" /> Track Timeline
                                    </button>
                                    <div className="border-t border-orange-100/70 my-0.5"></div>
                                    <button
                                      type="button"
                                      onClick={() => { setActionMenuRowId(null); navigate(`/billing?search=${item.uhid || item.patientName}`); }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Billing Desk
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'datewise' ? (
            /* Date-wise treatment tracking */
            <div className="space-y-6 animate-in fade-in duration-200 font-sans">
              {/* Filter controls & Summary Stats */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between card p-4 border border-orange-100 bg-white shadow-sm rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-xl">
                    <CalendarDays className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">Selected Treatment Date</label>
                    <input
                      type="date"
                      className="input py-1.5 px-2.5 text-xs bg-white border-orange-100 rounded-lg mt-0.5 font-medium"
                      value={selectedReportDate}
                      onChange={(e) => setSelectedReportDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Summary Counter Cards */}
                <div className="flex gap-4 select-none">
                  <div className="py-2 px-4 rounded-xl bg-orange-50 border border-orange-100 text-center">
                    <span className="block text-[10px] font-bold text-orange-950 uppercase tracking-wide">Total Patients</span>
                    <span className="text-xl font-black text-orange-650">{datewiseRecords.length}</span>
                  </div>
                  <div className="py-2 px-4 rounded-xl bg-green-50 border border-green-100 text-center">
                    <span className="block text-[10px] font-bold text-green-950 uppercase tracking-wide">Completed</span>
                    <span className="text-xl font-black text-green-700">
                      {datewiseRecords.filter(r => r.status === 'Completed').length}
                    </span>
                  </div>
                  <div className="py-2 px-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
                    <span className="block text-[10px] font-bold text-amber-950 uppercase tracking-wide">Pending/Draft</span>
                    <span className="text-xl font-black text-amber-700">
                      {datewiseRecords.filter(r => r.status === 'Draft').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient details list */}
              <div className="card overflow-hidden border border-orange-100 bg-white shadow-sm rounded-2xl">
                <div className="p-4 border-b border-orange-100 bg-orange-50/30 flex items-center justify-between">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2 text-sm">
                    <Activity className="h-5 w-5 text-orange-500" /> Patient Treatment Details ({new Date(selectedReportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-orange-50/10 text-[10px] font-bold uppercase text-gray-500 border-b border-orange-100">
                      <tr>
                        <th className="p-3.5 pl-4">Patient Name</th>
                        <th className="p-3.5">UHID</th>
                        <th className="p-3.5">Mobile</th>
                        <th className="p-3.5">Gender / Age</th>
                        <th className="p-3.5">Treatment Type</th>
                        <th className="p-3.5">Doctor / Creator</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 pr-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50 font-medium text-gray-700 bg-white">
                      {loadingDatewise ? (
                        <tr>
                          <td colSpan="8" className="p-8">
                            <SkeletonTable rows={5} columns={8} className="w-full" />
                          </td>
                        </tr>
                      ) : datewiseRecords.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-12 text-center text-gray-450">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-400" />
                            <p className="font-extrabold text-gray-550">No treatments registered on this date</p>
                          </td>
                        </tr>
                      ) : (
                        datewiseRecords.map(item => (
                          <tr key={item._id} className="hover:bg-orange-50/10 transition-colors">
                            <td className="p-3.5 pl-4">
                              <span className="font-bold text-gray-955 text-xs block">{item.patientName}</span>
                              <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                                {item.source === 'Doctor Referral' 
                                  ? `Referred by: Dr. ${item.referredByDoctorName || 'Doctor'}` 
                                  : `Registered by: ${item.createdBy?.doctorName || item.createdBy?.username || 'Receptionist'}`}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-[10px] font-bold text-orange-700">{formatUhid(item.uhid)}</td>
                            <td className="p-3.5 text-xs">{item.mobile}</td>
                            <td className="p-3.5 text-xs">{item.gender} / {item.age ? `${item.age} yrs` : '-'}</td>
                            <td className="p-3.5 text-xs font-semibold text-gray-800">{item.treatmentType}</td>
                            <td className="p-3.5 text-xs">
                              {item.referredByDoctorName ? `Dr. ${item.referredByDoctorName}` : (item.createdBy?.doctorName || item.createdBy?.username || 'Staff')}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                item.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {item.status === 'Completed' ? 'Completed' : 'Draft/Pending'}
                              </span>
                            </td>
                            <td className="p-3.5 pr-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-block text-left">
                                <button
                                  type="button"
                                  onClick={() => setActionMenuRowId(actionMenuRowId === item._id ? null : item._id)}
                                  className="action-menu-btn p-1.5 hover:bg-orange-100/70 text-gray-600 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-2xs inline-flex items-center justify-center cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {actionMenuRowId === item._id && (
                                  <div className="action-menu-dropdown absolute right-0 z-50 mt-1 w-44 bg-white rounded-xl shadow-xl border border-orange-100 py-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left">
                                    <button
                                      type="button"
                                      onClick={() => { setActionMenuRowId(null); handleViewTreatment(item); }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <Eye className="h-3.5 w-3.5 text-orange-600" /> View Details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setActionMenuRowId(null); handleOpenTrack(item); }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <Activity className="h-3.5 w-3.5 text-sky-600" /> Track Timeline
                                    </button>
                                    {item.status === 'Completed' && (
                                      <button
                                        type="button"
                                        onClick={() => { setActionMenuRowId(null); handleOpenPrint(item); }}
                                        className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                      >
                                        <Printer className="h-3.5 w-3.5 text-orange-500" /> Print Report
                                      </button>
                                    )}
                                    <div className="border-t border-orange-100/70 my-0.5"></div>
                                    <button
                                      type="button"
                                      onClick={() => { setActionMenuRowId(null); navigate(`/billing?search=${item.uhid || item.patientName}`); }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Billing Desk
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Patient Search */}
              <div className="card p-4">
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative flex-1 flex items-center">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input type="text" className="input pl-10 pr-9 py-2.5 w-full" placeholder="Search patients by name, UHID, or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && <button type="button" onClick={() => { setSearch(''); loadPatients(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                  </div>
                  <button type="submit" className="btn py-2.5 px-6"><Search className="h-4 w-4" /> Search</button>
                </form>
              </div>

              {/* Recent Patients Quick Access - Treatment Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {categories.map(cat => {
                  const Icon = TREATMENT_ICONS[cat.name] || FolderHeart;
                  return (
                    <div key={cat.name} className="card p-4 text-center hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-orange-200" onClick={() => {
                      toast(`Search and select a patient first, then click "Start Care".`, { icon: 'ℹ️' });
                    }}>
                      <Icon className="h-8 w-8 mx-auto mb-1 text-orange-500" />
                      <span className="block text-[10px] font-bold uppercase text-gray-600 leading-tight">{cat.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Patient List */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-orange-100 bg-orange-50/30 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><User className="h-5 w-5 text-orange-500" /> All Registered Patients</h3>
                  
                  {/* Date Filters for Patients Lookup */}
                  <div className="flex bg-orange-100/50 p-0.5 rounded-lg border border-orange-100 w-fit select-none">
                    <button
                      type="button"
                      onClick={() => setPatientDateFilter('previous')}
                      className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded transition-all ${
                        patientDateFilter === 'previous' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-800 hover:bg-slate-100/30'
                      }`}
                    >
                      Previous ({getPatientDateCounts().previous})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientDateFilter('today')}
                      className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded transition-all ${
                        patientDateFilter === 'today' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-955 hover:bg-orange-100/30'
                      }`}
                    >
                      Today ({getPatientDateCounts().todays})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientDateFilter('upcoming')}
                      className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded transition-all ${
                        patientDateFilter === 'upcoming' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-955 hover:bg-blue-50/30'
                      }`}
                    >
                      Upcoming ({getPatientDateCounts().upcoming})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientDateFilter('all')}
                      className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded transition-all ${
                        patientDateFilter === 'all' ? 'bg-green-600 text-white shadow-sm' : 'text-green-950 hover:bg-green-100/30'
                      }`}
                    >
                      All ({getPatientDateCounts().all})
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm sm:text-base">
                    <thead>
                      <tr className="bg-gray-50 text-xs sm:text-sm font-bold uppercase text-gray-500 border-b border-orange-100">
                        <th className="p-3.5 pl-4">Patient Name</th>
                        <th className="p-3.5">UHID</th>
                        <th className="p-3.5">Mobile</th>
                        <th className="p-3.5">Gender</th>
                        <th className="p-3.5">Department</th>
                        <th className="p-3.5 pr-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="p-8">
                            <SkeletonTable rows={4} columns={6} className="w-full" />
                          </td>
                        </tr>
                      ) : filteredPatients.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-400"><User className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No patients found</p></td></tr>
                      ) : (
                        filteredPatients.map(p => (
                          <tr key={p._id} className="hover:bg-orange-50/20">
                            <td className="p-3.5 pl-4">
                              <span className="font-bold text-gray-955 text-sm sm:text-base block">{p.patientName}</span>
                              {p.registeredBy && p.registeredBy !== 'N/A' && (
                                <span className="text-xs text-gray-500 font-bold block mt-0.5">
                                  Registered by: <span className="capitalize text-orange-600">{p.registeredBy}</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-sm font-bold text-orange-700">{formatUhid(p.uhid)}</td>
                            <td className="p-3.5 text-sm">{p.mobile}</td>
                            <td className="p-3.5 text-sm">{p.gender}</td>
                            <td className="p-3.5 text-sm">{p.department || '-'}</td>
                            <td className="p-3.5 pr-4 text-center">
                              <button onClick={() => loadPatientTreatments(p)} className="btn text-sm py-1.5 px-3">
                                <Activity className="h-3.5 w-3.5" /> Start Care
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* Patient Treatment View */
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowTreatmentList(false); setSelectedPatient(null); }} className="btn-secondary text-xs py-2 px-3">
              <RefreshCw className="h-3.5 w-3.5" /> Back to Patients
            </button>
          </div>

          {/* Patient Info */}
          <div className="card p-5 bg-gradient-to-br from-orange-50 to-white border-orange-200">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 text-white p-3 rounded-2xl">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">{selectedPatient?.patientName || 'Patient'}</h2>
                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                  <span className="font-mono font-bold text-orange-700">{formatUhid(selectedPatient?.uhid)}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedPatient?.mobile}</span>
                  <span>{selectedPatient?.gender}</span>
                  {selectedPatient?.dob && (
                    <span>{Math.floor((new Date() - new Date(selectedPatient.dob)) / (365.25 * 24 * 60 * 60 * 1000))} years</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Treatment Selection Cards */}
          {(() => {
            const selectedPatientHasCompletedWithoutDraft = patientTreatments.some(t => t.status === 'Completed') && 
                                                           !patientTreatments.some(t => t.status === 'Draft');
            return (
              <>
                {selectedPatientHasCompletedWithoutDraft && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-900 font-bold text-xs select-none mb-4 animate-in fade-in duration-200">
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p>Start Care is disabled: This patient has already completed their previous treatment.</p>
                      <p className="text-[10px] text-amber-700 font-medium mt-0.5">Please register the patient again at the reception desk to initiate a new session.</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                  {categories.map((cat, catIdx) => {
                    const Icon = TREATMENT_ICONS[cat.name] || FolderHeart;
                    const isDialysis = cat.name.toLowerCase() === 'dialysis';
                    
                    return (
                      <button
                        key={catIdx}
                        disabled={selectedPatientHasCompletedWithoutDraft}
                        onClick={() => {
                          if (isDialysis) {
                            handleNewTreatment('Dialysis');
                          } else if (cat.subServices?.length === 1) {
                            handleNewTreatment(cat.subServices[0].name);
                          } else {
                            setActiveCategoryIndex(catIdx);
                          }
                        }}
                        className={`card p-4 text-center border-2 border-transparent transition-all flex flex-col justify-center items-center gap-1.5 ${
                          selectedPatientHasCompletedWithoutDraft 
                            ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100' 
                            : 'hover:shadow-md hover:border-orange-300 hover:bg-orange-50 cursor-pointer'
                        }`}
                      >
                        <Icon className="h-8 w-8 text-orange-500" />
                        <span className="block text-[10px] font-bold uppercase text-gray-700 leading-tight">
                          {cat.name}
                        </span>
                        {cat.subServices?.length > 1 && (
                          <span className="block text-[8px] font-bold text-orange-600 bg-orange-100/50 px-1.5 py-0.5 rounded-full uppercase">
                            {cat.subServices.length} options
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {/* Existing Treatment Records */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-orange-100 bg-orange-50/30">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><Activity className="h-5 w-5 text-orange-500" /> Treatment History</h3>
            </div>
            {treatmentsLoading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                      <th className="p-3 pl-4">Date</th>
                      <th className="p-3">Care Type</th>
                      <th className="p-3">Diagnosis</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created By</th>
                      <th className="p-3 pr-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    <tr>
                      <td colSpan="6" className="p-8">
                        <SkeletonTable rows={4} columns={6} className="w-full" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : patientTreatments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-bold">No treatment records found</p>
                <p className="text-xs">Select a treatment type above to create the first record</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                      <th className="p-3 pl-4">Date</th>
                      <th className="p-3">Care Type</th>
                      <th className="p-3">Diagnosis</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created By</th>
                      <th className="p-3 pr-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {patientTreatments.map(r => (
                      <tr key={r._id} className="hover:bg-orange-50/20">
                        <td className="p-3 pl-4 text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="p-3 font-bold text-gray-800 text-xs">{r.treatmentType}</td>
                        <td className="p-3 text-xs max-w-[200px] truncate">{r.diagnosis || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {r.status === 'Completed' ? 'Completed' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-500">{r.createdBy?.doctorName || r.createdBy?.username || '-'}</td>
                        <td className="p-3 pr-4 text-center flex items-center justify-center gap-2">
                          <button onClick={() => handleViewTreatment(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {r.status === 'Draft' && (
                            <button
                              onClick={() => {
                                if (r.treatmentType === 'Dialysis') {
                                  navigate(`/same-day-care/dialysis/treatment/${r.patientId?._id || r.patientId}?recordId=${r._id}`);
                                } else {
                                  navigate(`/same-day-care/treatment/${r.patientId?._id || r.patientId}?type=${r.treatmentType}&recordId=${r._id}`);
                                }
                              }}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                              title="Resume / Start Care"
                            >
                              <Activity className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeCategoryIndex !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 relative bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setActiveCategoryIndex(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 border-b border-orange-50 pb-3 mb-4">
              <FolderHeart className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-gray-900 text-base">
                Select Service: {categories[activeCategoryIndex]?.name}
              </h3>
            </div>
            <div className="space-y-2">
              {categories[activeCategoryIndex]?.subServices
                ?.filter(s => s.isActive !== false)
                .map((sub, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => {
                      handleNewTreatment(sub.name);
                      setActiveCategoryIndex(null);
                    }}
                    className="w-full text-left p-3.5 border border-gray-100 hover:border-orange-300 hover:bg-orange-50/30 rounded-xl font-bold text-gray-800 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>{sub.name}</span>
                    <span className="text-orange-600 text-sm">₹{sub.price}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Dynamic Report Print Area (Only visible during print) */}
      {selectedRecord && (
        <div id="sdt-print-area" className="hidden print:block bg-white text-black p-8 font-sans text-xs max-w-[210mm] mx-auto min-h-[297mm]">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              aside, header, nav, .no-print {
                display: none !important;
              }
              html, body {
                background: white !important;
                background-color: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              div:not(#sdt-print-area):not(#sdt-print-area *):not(.no-print),
              main:not(#sdt-print-area):not(#sdt-print-area *):not(.no-print),
              section:not(#sdt-print-area):not(#sdt-print-area *):not(.no-print) {
                display: block !important;
                position: static !important;
                overflow: visible !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                width: auto !important;
                min-width: 0 !important;
                max-width: none !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                background: transparent !important;
              }
              #sdt-print-area {
                display: block !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 20mm !important;
                box-sizing: border-box !important;
                background: white !important;
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
              <div className="text-[10px] text-gray-400 mt-1">Date: {new Date(selectedRecord.treatmentDate).toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          {/* Patient Info Grid */}
          <div className="border border-gray-800 rounded-lg p-3 mb-6">
            <h3 className="font-bold uppercase text-[11px] mb-2 border-b border-gray-300 pb-1 text-gray-700">
              {TRANSLATIONS[printLanguage]?.patientDetails || 'Patient Details'}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <div><strong>{TRANSLATIONS[printLanguage]?.patientName || 'Patient Name'}:</strong> {selectedRecord.patientName}</div>
              <div><strong>{TRANSLATIONS[printLanguage]?.uhid || 'UHID'}:</strong> {formatUhid(selectedRecord.uhid)}</div>
              <div><strong>{TRANSLATIONS[printLanguage]?.ageGender || 'Age / Gender'}:</strong> {selectedRecord.age} yrs / {selectedRecord.gender}</div>
              <div><strong>{TRANSLATIONS[printLanguage]?.mobile || 'Mobile'}:</strong> {selectedRecord.mobile}</div>
              <div><strong>{TRANSLATIONS[printLanguage]?.date || 'Date'}:</strong> {new Date(selectedRecord.treatmentDate).toLocaleDateString('en-IN')}</div>
              <div><strong>{TRANSLATIONS[printLanguage]?.procedure || 'Procedure'}:</strong> {selectedRecord.treatmentType}</div>
              <div className="col-span-2"><strong>Registered / Referred By:</strong> {selectedRecord.source === 'Doctor Referral' ? `Dr. Referral (${selectedRecord.referredByDoctorName || 'Doctor'})` : `Registration (${selectedRecord.createdBy?.doctorName || selectedRecord.createdBy?.username || 'Receptionist'})`}</div>
            </div>
          </div>

          {/* Clinical Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold uppercase text-[11px] mb-1.5 border-b border-gray-300 pb-0.5 text-gray-700">
                {TRANSLATIONS[printLanguage]?.diagnosis || 'Diagnosis'}
              </h3>
              <p className="font-semibold text-gray-900">{selectedRecord.diagnosis || 'N/A'}</p>
            </div>

            {/* Vitals Summary */}
            {selectedRecord.vitals && (
              <div>
                <h3 className="font-bold uppercase text-[11px] mb-1.5 border-b border-gray-300 pb-0.5 text-gray-700">Vitals</h3>
                <div className="grid grid-cols-5 gap-2 text-[10px]">
                  <div><strong>BP:</strong> {selectedRecord.vitals.bloodPressure || 'N/A'}</div>
                  <div><strong>Pulse:</strong> {selectedRecord.vitals.pulse ? `${selectedRecord.vitals.pulse} bpm` : 'N/A'}</div>
                  <div><strong>Temp:</strong> {selectedRecord.vitals.temperature ? `${selectedRecord.vitals.temperature} °C` : 'N/A'}</div>
                  <div><strong>Height:</strong> {selectedRecord.vitals.height ? `${selectedRecord.vitals.height} cm` : 'N/A'}</div>
                  <div><strong>Weight:</strong> {selectedRecord.vitals.weight ? `${selectedRecord.vitals.weight} kg` : 'N/A'}</div>
                </div>
              </div>
            )}

            {/* Prescription Table */}
            {selectedRecord.prescriptionMedicines && selectedRecord.prescriptionMedicines.filter(item => item.itemType === 'Medicine').length > 0 && (
              <div>
                <h3 className="font-bold uppercase text-[11px] mb-1.5 border-b border-gray-300 pb-0.5 text-gray-700">
                  {TRANSLATIONS[printLanguage]?.prescription || 'Rx Prescription'}
                </h3>
                <table className="w-full text-left border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300 font-bold text-[10px]">
                      <th className="p-1.5 border-r border-gray-300">{TRANSLATIONS[printLanguage]?.medicineName || 'Medicine Name'}</th>
                      <th className="p-1.5 border-r border-gray-300">Dosage Form</th>
                      <th className="p-1.5 border-r border-gray-300">Strength</th>
                      <th className="p-1.5 border-r border-gray-300">Dose</th>
                      <th className="p-1.5 border-r border-gray-300">{TRANSLATIONS[printLanguage]?.frequency || 'Frequency'}</th>
                      <th className="p-1.5 border-r border-gray-300">{TRANSLATIONS[printLanguage]?.duration || 'Duration'}</th>
                      <th className="p-1.5 border-r border-gray-300">Remarks</th>
                      <th className="p-1.5 text-center">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 text-[10px]">
                    {selectedRecord.prescriptionMedicines
                      .filter(item => item.itemType === 'Medicine')
                      .map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 border-r border-gray-300 font-bold">{item.medicineName}</td>
                          <td className="p-1.5 border-r border-gray-300">{item.dosageForm || 'Tablet'}</td>
                          <td className="p-1.5 border-r border-gray-300">{item.strength || '-'}</td>
                          <td className="p-1.5 border-r border-gray-300">{item.dose !== undefined ? item.dose : '1'}</td>
                          <td className="p-1.5 border-r border-gray-300 font-mono">
                            {item.frequency || [item.morning ? '1' : '0', item.afternoon ? '1' : '0', item.night ? '1' : '0'].join(' - ')}
                          </td>
                          <td className="p-1.5 border-r border-gray-300">{item.duration ? `${item.duration} Days` : '-'}</td>
                          <td className="p-1.5 border-r border-gray-300 italic">{item.remarks || item.instructions || '-'}</td>
                          <td className="p-1.5 text-center font-bold">{item.qty !== undefined ? item.qty : '-'}</td>
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
                    <li key={idx} className="text-gray-800">{note}</li>
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
                    <li key={idx} className="text-gray-800">{adv}</li>
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
      )}

      {/* Print settings Modal */}
      {showPrintModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
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
                Configure Report Print: {selectedRecord.patientName}
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Language Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Select Print Language</label>
                <select
                  value={printLanguage}
                  onChange={(e) => setPrintLanguage(e.target.value)}
                  className="input py-2 text-xs"
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
                        className="input py-1.5 text-xs flex-1"
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
                        className="input py-1.5 text-xs flex-1"
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
                className="btn py-2 px-5 text-xs font-bold flex items-center gap-1 bg-orange-500 hover:bg-orange-600"
              >
                <Printer className="h-4 w-4" /> Generate & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Timeline Modal */}
      {showTrackModal && trackRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-xl p-6 relative bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowTrackModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2 border-b border-orange-50 pb-3 mb-4">
              <Activity className="h-5 w-5 text-orange-500 animate-pulse" />
              <h3 className="font-extrabold text-gray-900 text-base">
                Clinical Care Journey Tracker
              </h3>
            </div>

            {/* Patient card details */}
            <div className="p-3.5 bg-orange-50/50 border border-orange-100 rounded-xl mb-6 text-xs text-gray-700 grid grid-cols-2 gap-2">
              <div><strong>Patient Name:</strong> {trackRecord.patientName}</div>
              <div><strong>UHID:</strong> {formatUhid(trackRecord.uhid)}</div>
              <div><strong>Age / Gender:</strong> {trackRecord.age} yrs / {trackRecord.gender}</div>
              <div><strong>Mobile:</strong> {trackRecord.mobile}</div>
            </div>

            {/* Timeline component mapping auditTrail */}
            <div className="relative pl-6 border-l-2 border-orange-100 space-y-6 max-h-[50vh] overflow-y-auto pr-2">
              {(() => {
                const unifiedTimeline = [
                  ...(trackRecord.auditTrail || []).map(log => ({
                    date: new Date(log.timestamp),
                    type: 'audit',
                    log
                  })),
                  ...(trackMedAdministrations || []).map(log => ({
                    date: new Date(log.createdAt),
                    type: 'medication',
                    log
                  }))
                ];
                unifiedTimeline.sort((a, b) => a.date - b.date);

                if (unifiedTimeline.length > 0) {
                  return unifiedTimeline.map((item, idx) => {
                    if (item.type === 'audit') {
                      const log = item.log;
                      let badgeBg = 'bg-blue-500';
                      if (log.action === 'Add') badgeBg = 'bg-green-500';
                      if (log.action === 'Status Change') badgeBg = 'bg-purple-500';
                      if (log.action === 'Delete') badgeBg = 'bg-red-500';
                      
                      return (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[31px] top-1 ${badgeBg} text-white rounded-full p-1 border-4 border-white shadow-sm`}>
                            <Activity className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-gray-900 text-xs">
                                {idx + 1}. Action: {log.action}
                              </h4>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded uppercase">
                                {log.performedByRole || 'Staff'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium font-mono">
                              {new Date(log.timestamp).toLocaleString('en-IN')} 
                              {log.ipAddress && ` | IP: ${log.ipAddress}`}
                            </p>
                            <p className="text-xs text-gray-700 mt-1 font-semibold">
                              Performed by: <span className="text-orange-700">{log.performedByName}</span>
                            </p>
                            {log.remarks && (
                              <p className="text-[11px] text-gray-500 italic mt-0.5 bg-gray-50 p-1.5 rounded border border-gray-100">
                                {log.remarks}
                              </p>
                            )}
                            
                            {/* Changed Fields list */}
                            {log.changedFields && log.changedFields.length > 0 && (
                              <div className="mt-2 space-y-1 bg-amber-50/30 border border-amber-100/50 rounded-lg p-2">
                                <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider mb-1">Modified Fields:</p>
                                <div className="divide-y divide-amber-100/50 text-[10px]">
                                  {log.changedFields.map((field, fIdx) => (
                                    <div key={fIdx} className="py-1 first:pt-0 last:pb-0 grid grid-cols-3 gap-2">
                                      <div className="font-mono font-bold text-gray-605">{field.fieldName}</div>
                                      <div className="text-red-600 line-through truncate text-left" title={field.oldValue}>
                                        Was: {field.oldValue}
                                      </div>
                                      <div className="text-green-700 font-bold truncate text-left" title={field.newValue}>
                                        Now: {field.newValue}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      const log = item.log;
                      return (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[31px] top-1 bg-blue-600 text-white rounded-full p-1 border-4 border-white shadow-sm">
                            <Pill className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-blue-900 text-xs">
                                {idx + 1}. Medication Administered: {log.medicineName}
                              </h4>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded uppercase">
                                Nurse Log
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium font-mono">
                              {new Date(log.createdAt).toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-700 mt-1 font-semibold">
                              Administered by: <span className="text-orange-700">{log.nurseName}</span>
                            </p>
                            <div className="mt-1.5 space-y-1 bg-blue-50/30 border border-blue-100/50 rounded-lg p-2 text-[10px]">
                              <div><strong>Status:</strong> <span className={log.status === 'Given' ? 'text-green-700 font-bold' : 'text-red-600'}>{log.status}</span></div>
                              <div><strong>Shift:</strong> {log.shift}</div>
                              {log.remarks && <div><strong>Remarks:</strong> <span className="italic text-gray-500">{log.remarks}</span></div>}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  });
                } else {
                  return (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 bg-green-500 text-white rounded-full p-1 border-4 border-white shadow-sm">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-700 text-xs">Record Finalized</h4>
                        <p className="text-[11px] text-gray-400">Created by: {trackRecord.createdBy?.doctorName || trackRecord.createdBy?.username || 'Staff'}</p>
                        <p className="text-[11px] text-gray-400">Completion Date: {new Date(trackRecord.updatedAt || trackRecord.treatmentDate).toLocaleDateString('en-IN')}</p>
                        <div className="mt-2 text-xs italic text-gray-400">No advanced audit trail logs recorded for this record.</div>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            <div className="flex justify-end border-t border-orange-50 pt-4 mt-6">
              <button
                onClick={() => setShowTrackModal(false)}
                className="btn py-2 px-6 text-xs font-bold"
              >
                Close journey tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SameDayCareWorkspace;