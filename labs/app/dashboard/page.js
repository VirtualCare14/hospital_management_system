'use client';

import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardLayout from '../../components/DashboardLayout';
import LabBillReceipt from '../../components/LabBillReceipt';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  Loader2, 
  X, 
  Edit3, 
  Check, 
  Info, 
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Printer,
  Eye,
  ArrowLeft,
  FileText,
  Sparkles,
  ExternalLink,
  MoreHorizontal,
  User,
  UserCheck,
  Trash2,
  Receipt,
  Wallet,
  Save,
  Bell,
  Activity,
  Clock,
  CalendarDays,
  Layers,
  Filter,
  RefreshCw,
  TrendingUp,
  Tag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Users,
  Phone,
  MapPin,
  Calendar,
  UserPlus,
  ArrowUpDown,
  HeartPulse,
  History,
  Smartphone,
  ShieldCheck,
  Mail,
  Building,
  HelpCircle
} from 'lucide-react';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const STANDARD_MORPHOLOGY_TEMPLATES = {
  'RBC Morphology': [
    'Normocytic normochromic red cells with normal morphology.',
    'Microcytic hypochromic red blood cells with mild to moderate anisopoikilocytosis.',
    'Macrocytic RBCs with occasional ovalocytes and target cells.',
    'Dimorphic red cell picture with both normocytic and microcytic populations.'
  ],
  'WBC Morphology': [
    'Total and differential counts are within normal limits. Normal mature morphology.',
    'Neutrophilic leukocytosis with mild toxic granulation.',
    'Lymphocytosis with reactive morphology.',
    'Leukopenia with normal cell morphology. No immature or atypical cells seen.'
  ],
  'Platelet Morphology': [
    'Adequate in number on smear examination. Normal morphology and clump formation.',
    'Reduced on smear (Thrombocytopenia). Platelet morphology appears normal.',
    'Abundant in number (Thrombocytosis) with normal granularity and clump formation.',
    'Giant platelets seen occasionally.'
  ]
};

const WIDAL_DEFAULT_ANTIGENS = [
  'S TYPHI "O"',
  'S TYPHI "H"',
  'S PARATYPHI "AH"',
  'S PARATYPHI "BH"'
];

const WIDAL_SLIDE_DILUTIONS = ['1/20', '1/40', '1/80', '1/160', '1/320'];
const WIDAL_TUBE_DILUTIONS = ['1:30', '1:60', '1:120', '1:240', '1:480'];

const WIDAL_SLIDE_GRID = {
  'S TYPHI "O"': { '1/20': '+', '1/40': '+', '1/80': '+', '1/160': '-', '1/320': '-' },
  'S TYPHI "H"': { '1/20': '+', '1/40': '+', '1/80': '+', '1/160': '-', '1/320': '-' },
  'S PARATYPHI "AH"': { '1/20': '+', '1/40': '+', '1/80': '-', '1/160': '-', '1/320': '-' },
  'S PARATYPHI "BH"': { '1/20': '+', '1/40': '+', '1/80': '-', '1/160': '-', '1/320': '-' }
};

const WIDAL_TUBE_GRID = {
  'S TYPHI "O"': { '1:30': '+', '1:60': '+', '1:120': '+', '1:240': '-', '1:480': '-' },
  'S TYPHI "H"': { '1:30': '+', '1:60': '+', '1:120': '+', '1:240': '-', '1:480': '-' },
  'S PARATYPHI "AH"': { '1:30': '+', '1:60': '+', '1:120': '-', '1:240': '-', '1:480': '-' },
  'S PARATYPHI "BH"': { '1:30': '+', '1:60': '+', '1:120': '-', '1:240': '-', '1:480': '-' }
};

const getWidalDilutions = (testName = '') => {
  return String(testName).toLowerCase().includes('tube') ? WIDAL_TUBE_DILUTIONS : WIDAL_SLIDE_DILUTIONS;
};

const getWidalDefaultGrid = (testName = '') => {
  return String(testName).toLowerCase().includes('tube') ? WIDAL_TUBE_GRID : WIDAL_SLIDE_GRID;
};

const getWidalNote = (testName = '') => {
  const isTube = String(testName).toLowerCase().includes('tube');
  const cutoff = isTube ? '1:120' : '1:80';
  return `Antibody titre of ${cutoff} or higher suggests infection. A marked rise in the titre to one serotype to (above ${cutoff}) or paired sample collected at 5 to 7 days interval is regarded as diagnostically significant. However persons who have received TAB vaccine may show high titre of antibodies to each of the salmonellae.`;
};

const getWidalGridFromParams = (paramVals, testName = '') => {
  const fallback = getWidalDefaultGrid(testName);
  if (!paramVals) return fallback;
  if (paramVals['widal_matrix_json']) {
    try {
      const parsed = typeof paramVals['widal_matrix_json'] === 'string' 
        ? JSON.parse(paramVals['widal_matrix_json']) 
        : paramVals['widal_matrix_json'];
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
  }
  return fallback;
};

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const isDueReportsView = searchParams.get('view') === 'due-reports';
  const isTodaysReportsView = searchParams.get('view') === 'todays-reports';
  const isSearchReportsView = searchParams.get('view') === 'search-reports';
  const isSignatoriesView = searchParams.get('view') === 'signatories';
  const isActivitiesView = searchParams.get('view') === 'activities';
  const isPatientsView = searchParams.get('view') === 'patients';
  const isReferralDoctorsView = searchParams.get('view') === 'referral-doctors';
  const isCollectionCentresView = searchParams.get('view') === 'collection-centres';
  const isDailyBusinessView = searchParams.get('view') === 'daily-business';

  // Daily Business View States (Matching Reference Layout)
  const [dailyBusinessDate, setDailyBusinessDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyBusinessTab, setDailyBusinessTab] = useState('transactions'); // 'transactions' | 'bills' | 'expenses'
  const [dailyBusinessSearch, setDailyBusinessSearch] = useState('');
  const [showPrevDayBills, setShowPrevDayBills] = useState(false);
  const [dailyBusinessCashier, setDailyBusinessCashier] = useState('all');
  const [showIncomeSplit, setShowIncomeSplit] = useState(true);
  const [showAddCashierModal, setShowAddCashierModal] = useState(false);
  const [newCashierName, setNewCashierName] = useState('');
  const [cashiersList, setCashiersList] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hms_lab_cashiers');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return ['Ravi Shukla', 'Reception Desk', 'Lab Cashier 1', 'Dr. Rajesh Gupta'];
  });
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Lab Reagents & Supplies',
    amount: '',
    paymentMethod: 'Cash',
    paidTo: '',
    notes: ''
  });
  const [labExpensesList, setLabExpensesList] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hms_lab_expenses_data');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  // Activities & Audit Trail Filter States
  const [activityDuration, setActivityDuration] = useState('past_7_days');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('all'); // 'all' | 'requests' | 'samples' | 'results' | 'reports' | 'billing'
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activitySourceFilter, setActivitySourceFilter] = useState('all'); // 'all' | 'OPD' | 'IPD' | 'Direct'

  // Patients Directory Filter States
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientGenderFilter, setPatientGenderFilter] = useState('all'); // 'all' | 'Male' | 'Female'
  const [patientDuesFilter, setPatientDuesFilter] = useState('all'); // 'all' | 'dues' | 'paid'
  const [patientSourceFilter, setPatientSourceFilter] = useState('all'); // 'all' | 'OPD' | 'IPD' | 'Direct'
  const [patientSortBy, setPatientSortBy] = useState('latest'); // 'latest' | 'name_asc' | 'name_desc' | 'most_tests' | 'highest_due'
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [registeredPatients, setRegisteredPatients] = useState([]);

  // Referral Doctors Management States (Synced with "Referred by" in New Bill)
  const [referralDoctors, setReferralDoctors] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hms_lab_referrers');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      { id: '1', codeId: '1', name: 'Self', specialty: 'Direct Walk-in', phone: '', hospital: 'In-house Lab', commission: '0%' },
      { id: '2', codeId: '2', name: 'Dr. A. K. Sharma (Cardiologist)', specialty: 'Cardiologist', phone: '9876543210', hospital: 'City Heart Clinic', commission: '10%' },
      { id: '3', codeId: '3', name: 'Dr. Priya Mehta (General Physician)', specialty: 'General Physician', phone: '9876543211', hospital: 'Apollo Clinic', commission: '10%' },
      { id: '4', codeId: '4', name: 'Dr. Rajesh Gupta (Pathologist)', specialty: 'Pathologist', phone: '9876543212', hospital: 'Main Hospital', commission: '0%' },
      { id: '5', codeId: '5', name: 'City Hospital & Diagnostic Clinic', specialty: 'Diagnostic Referral', phone: '9876543213', hospital: 'City Hospital', commission: '15%' }
    ];
  });
  const [refDocSearchQuery, setRefDocSearchQuery] = useState('');
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [docForm, setDocForm] = useState({
    name: '',
    specialty: '',
    phone: '',
    hospital: '',
    commission: '10%'
  });

  // Collection Centres Management States (Synced with "Collection Centre" in New Bill)
  const [collectionCentresList, setCollectionCentresList] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hms_lab_collection_centres');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((item, idx) => {
              if (typeof item === 'string') {
                return {
                  id: String(idx + 1),
                  code: `CC-${String(idx + 1).padStart(2, '0')}`,
                  name: item,
                  address: idx === 0 ? 'Main Hospital Premises' : 'Branch Location',
                  phone: '9876543210',
                  incharge: 'Lab Supervisor',
                  status: 'Active'
                };
              }
              return item;
            });
          }
        } catch (e) {}
      }
    }
    return [
      { id: '1', code: 'CC-01', name: 'Main Hospital Lab', address: 'Main Hospital Premises', phone: '9876543210', incharge: 'Dr. Rajesh Gupta', status: 'Active' },
      { id: '2', code: 'CC-02', name: 'North Branch Centre', address: 'Sector 14, North City', phone: '9876543211', incharge: 'Suresh Phlebotomist', status: 'Active' },
      { id: '3', code: 'CC-03', name: 'South Satellite Lab', address: 'South Extension Market', phone: '9876543212', incharge: 'Anjali Assistant', status: 'Active' },
      { id: '4', code: 'CC-04', name: 'Home Collection Unit', address: 'Mobile Field Vans', phone: '9876543213', incharge: 'Rahul Logistics', status: 'Active' }
    ];
  });
  const [centreSearchQuery, setCentreSearchQuery] = useState('');
  const [showAddCentreModal, setShowAddCentreModal] = useState(false);
  const [editingCentreId, setEditingCentreId] = useState(null);
  const [centreForm, setCentreForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    incharge: '',
    status: 'Active'
  });

  // Morphology template picker state
  const [activeMorphologyTemplatePicker, setActiveMorphologyTemplatePicker] = useState('');

  // Data States
  const [labRequests, setLabRequests] = useState([]);
  const [availableLabTests, setAvailableLabTests] = useState([]);
  const [labBills, setLabBills] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Controls & Filters (Today's Reports)
  const [searchInPage, setSearchInPage] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState('new'); // 'all' | 'new' | 'create_bill' | 'in_progress' | 'final' | 'signed_off'
  const [sortOrder, setSortOrder] = useState('oldest');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [dueSearchQuery, setDueSearchQuery] = useState('');
  const [reportsCurrentPage, setReportsCurrentPage] = useState(1);
  const [reportsPageSize, setReportsPageSize] = useState(10);

  // Signatories State
  const [signatories, setSignatories] = useState([]);
  const [selectedSignatoryId, setSelectedSignatoryId] = useState('');
  const [loadingSignatories, setLoadingSignatories] = useState(false);
  const [signatoryForm, setSignatoryForm] = useState({
    name: '',
    designation: '',
    qualification: '',
    signatureImageUrl: ''
  });
  const [editingSignatoryId, setEditingSignatoryId] = useState(null);
  const [savingSignatory, setSavingSignatory] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);

  // Search Lab Reports View Filter States
  const [searchDuration, setSearchDuration] = useState('past_7_days');
  const [searchPatientName, setSearchPatientName] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');
  const [searchReferredBy, setSearchReferredBy] = useState('all');
  const [searchRegNo, setSearchRegNo] = useState('');
  const [searchDailyCaseNo, setSearchDailyCaseNo] = useState('');
  const [searchUhid, setSearchUhid] = useState('');
  const [searchSelectedTest, setSearchSelectedTest] = useState('all');
  const [showAllFilters, setShowAllFilters] = useState(true);

  // Result Processing Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [parameterValues, setParameterValues] = useState({});
  const [reportRemarks, setReportRemarks] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  // New Full Page Report Entry View States
  const [showReportEntryView, setShowReportEntryView] = useState(false);
  const [reportNotes, setReportNotes] = useState('');
  const [reportAdvice, setReportAdvice] = useState('');
  const [reportInterpretation, setReportInterpretation] = useState('');
  const [parameterRemarks, setParameterRemarks] = useState({});
  const [expandedRemarks, setExpandedRemarks] = useState({});
  const [showRuleModalParam, setShowRuleModalParam] = useState('');
  const [ruleModalRules, setRuleModalRules] = useState([]);
  const [showReportEntryTab, setShowReportEntryTab] = useState(''); // 'notes' | 'remarks' | 'advice' | 'interpretation'
  const [selectedReportTestFilter, setSelectedReportTestFilter] = useState('all'); // 'all' or specific test name
  const [datesInfo, setDatesInfo] = useState({
    collectedDate: '',
    collectedTime: '',
    receivedDate: '',
    receivedTime: '',
    reportedDate: '',
    reportedTime: ''
  });

  // Value Predefined Choices States
  const [activeValueOptionsDropdown, setActiveValueOptionsDropdown] = useState(''); // parameter name
  const [activePlusMenu, setActivePlusMenu] = useState(''); // parameter name for add options/remark menu
  const [newValueOptionText, setNewValueOptionText] = useState('');
  const [newValueOptionAbnormal, setNewValueOptionAbnormal] = useState(false);
  const [editingValueOptionIdx, setEditingValueOptionIdx] = useState(null);

  // Bill Receipt View Modal
  const [viewingReceiptData, setViewingReceiptData] = useState(null);

  // Lab Report Printing States
  const [showReportPrintModal, setShowReportPrintModal] = useState(false);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(null);
  const [printModalTestFilter, setPrintModalTestFilter] = useState('all');
  const [showReportSavedModal, setShowReportSavedModal] = useState(false);
  const [savedReportRequest, setSavedReportRequest] = useState(null);

  // Field Edit Mode & Interpretation Printing States
  const [isEditLayoutMode, setIsEditLayoutMode] = useState(false);
  const [skippedParameters, setSkippedParameters] = useState({});
  const [customFieldDisplayNames, setCustomFieldDisplayNames] = useState({});
  const [printInterpretation, setPrintInterpretation] = useState(true);

  // Payment Collection Modal State
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [hospitalSettings, setHospitalSettings] = useState(null);

  const isAdminUser = user?.role === 'admin' || user?.role === 'lab_admin' || user?.role === 'labadmin' || user?.role === 'superadmin';

  const parseDateStr = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date();
    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePreviousDay = () => {
    const current = parseDateStr(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(formatDate(current));
  };

  const handleNextDay = () => {
    const current = parseDateStr(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(formatDate(current));
  };

  const loadSignatories = async () => {
    setLoadingSignatories(true);
    try {
      const res = await api.get('/lab/signatories');
      setSignatories(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSignatories(false);
    }
  };

  const handleSaveSignatory = async (e) => {
    e.preventDefault();
    if (!signatoryForm.name.trim() || !signatoryForm.designation.trim()) {
      alert('Doctor / Pathologist name and designation are required');
      return;
    }

    setSavingSignatory(true);
    try {
      if (editingSignatoryId) {
        await api.put(`/lab/signatories/${editingSignatoryId}`, signatoryForm);
      } else {
        await api.post('/lab/signatories', signatoryForm);
      }
      setSignatoryForm({ name: '', designation: '', qualification: '', signatureImageUrl: '' });
      setEditingSignatoryId(null);
      loadSignatories();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save signatory');
    } finally {
      setSavingSignatory(false);
    }
  };

  const handleEditSignatory = (sig) => {
    setEditingSignatoryId(sig._id);
    setSignatoryForm({
      name: sig.name || '',
      designation: sig.designation || '',
      qualification: sig.qualification || '',
      signatureImageUrl: sig.signatureImageUrl || ''
    });
  };

  const handleDeleteSignatory = async (sigId) => {
    if (!confirm('Are you sure you want to remove this signatory?')) return;
    try {
      await api.delete(`/lab/signatories/${sigId}`);
      loadSignatories();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to delete signatory');
    }
  };

  const handleSaveReferralDoctor = (e) => {
    e.preventDefault();
    if (!docForm.name.trim()) {
      showToast('Doctor / Referrer name is required', 'error');
      return;
    }

    if (editingDocId) {
      const updated = referralDoctors.map(d => d.id === editingDocId ? { ...d, ...docForm, name: docForm.name.trim() } : d);
      setReferralDoctors(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hms_lab_referrers', JSON.stringify(updated));
      }
      showToast('Referral doctor updated successfully!', 'success');
    } else {
      const newId = String(referralDoctors.length + 1);
      const newDoc = {
        id: newId,
        codeId: newId,
        name: docForm.name.trim(),
        specialty: docForm.specialty.trim() || 'Referral Doctor',
        phone: docForm.phone.trim(),
        hospital: docForm.hospital.trim() || 'Associated Clinic',
        commission: docForm.commission.trim() || '10%'
      };
      const updated = [...referralDoctors, newDoc];
      setReferralDoctors(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hms_lab_referrers', JSON.stringify(updated));
      }
      showToast(`Referral doctor "${newDoc.name}" added to bill generation options!`, 'success');
    }

    setDocForm({ name: '', specialty: '', phone: '', hospital: '', commission: '10%' });
    setEditingDocId(null);
    setShowAddDocModal(false);
  };

  const handleEditReferralDoctor = (doc) => {
    setEditingDocId(doc.id);
    setDocForm({
      name: doc.name || '',
      specialty: doc.specialty || '',
      phone: doc.phone || '',
      hospital: doc.hospital || '',
      commission: doc.commission || '10%'
    });
    setShowAddDocModal(true);
  };

  const handleDeleteReferralDoctor = (docId) => {
    const docToDelete = referralDoctors.find(d => d.id === docId);
    if (!docToDelete) return;
    if (docToDelete.name === 'Self') {
      showToast('Default "Self" referral source cannot be removed.', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to remove "${docToDelete.name}" from referral doctors? It will no longer appear in Referred by when generating bills.`)) return;

    const updated = referralDoctors.filter(d => d.id !== docId);
    setReferralDoctors(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hms_lab_referrers', JSON.stringify(updated));
    }
    showToast(`Referral doctor "${docToDelete.name}" removed from bill generation.`, 'success');
  };

  const handleSaveCentre = (e) => {
    e.preventDefault();
    if (!centreForm.name.trim()) {
      showToast('Collection centre name is required', 'error');
      return;
    }

    if (editingCentreId) {
      const updated = collectionCentresList.map(c => c.id === editingCentreId ? { ...c, ...centreForm, name: centreForm.name.trim() } : c);
      setCollectionCentresList(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hms_lab_collection_centres', JSON.stringify(updated));
      }
      showToast('Collection centre updated successfully!', 'success');
    } else {
      const newId = String(collectionCentresList.length + 1);
      const newCentre = {
        id: newId,
        code: centreForm.code.trim() || `CC-${String(collectionCentresList.length + 1).padStart(2, '0')}`,
        name: centreForm.name.trim(),
        address: centreForm.address.trim() || 'Hospital Branch Location',
        phone: centreForm.phone.trim() || '',
        incharge: centreForm.incharge.trim() || 'Center Supervisor',
        status: centreForm.status || 'Active'
      };
      const updated = [...collectionCentresList, newCentre];
      setCollectionCentresList(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hms_lab_collection_centres', JSON.stringify(updated));
      }
      showToast(`Collection centre "${newCentre.name}" added successfully!`, 'success');
    }

    setCentreForm({ name: '', code: '', address: '', phone: '', incharge: '', status: 'Active' });
    setEditingCentreId(null);
    setShowAddCentreModal(false);
  };

  const handleEditCentre = (centre) => {
    setEditingCentreId(centre.id);
    setCentreForm({
      name: centre.name || '',
      code: centre.code || '',
      address: centre.address || '',
      phone: centre.phone || '',
      incharge: centre.incharge || '',
      status: centre.status || 'Active'
    });
    setShowAddCentreModal(true);
  };

  const handleDeleteCentre = (centreId) => {
    const centreToDelete = collectionCentresList.find(c => c.id === centreId);
    if (!centreToDelete) return;
    if (centreToDelete.name === 'Main Hospital Lab') {
      showToast('Primary "Main Hospital Lab" cannot be deleted.', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to delete collection centre "${centreToDelete.name}"?`)) return;

    const updated = collectionCentresList.filter(c => c.id !== centreId);
    setCollectionCentresList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hms_lab_collection_centres', JSON.stringify(updated));
    }
    showToast(`Collection centre "${centreToDelete.name}" removed.`, 'success');
  };

  // Daily Business Cashier & Expense Handlers
  const handleSaveCashier = (e) => {
    e.preventDefault();
    if (!newCashierName.trim()) return;
    const name = newCashierName.trim();
    if (!cashiersList.includes(name)) {
      const updated = [...cashiersList, name];
      setCashiersList(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hms_lab_cashiers', JSON.stringify(updated));
      }
      showToast(`Cashier "${name}" added successfully!`, 'success');
    }
    setNewCashierName('');
    setShowAddCashierModal(false);
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.title.trim() || !expenseForm.amount) {
      showToast('Title and Amount are required for expenses', 'error');
      return;
    }
    const newExp = {
      id: String(Date.now()),
      title: expenseForm.title.trim(),
      category: expenseForm.category || 'Lab Reagents & Supplies',
      amount: parseFloat(expenseForm.amount) || 0,
      paymentMethod: expenseForm.paymentMethod || 'Cash',
      paidTo: expenseForm.paidTo.trim() || 'Vendor',
      notes: expenseForm.notes.trim() || '',
      date: dailyBusinessDate,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      recordedBy: user?.name || user?.username || 'Admin'
    };
    const updated = [newExp, ...labExpensesList];
    setLabExpensesList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hms_lab_expenses_data', JSON.stringify(updated));
    }
    showToast(`Expense ₹${newExp.amount} recorded successfully!`, 'success');
    setExpenseForm({ title: '', category: 'Lab Reagents & Supplies', amount: '', paymentMethod: 'Cash', paidTo: '', notes: '' });
    setShowAddExpenseModal(false);
  };

  const handleDeleteExpense = (expId) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    const updated = labExpensesList.filter(e => e.id !== expId);
    setLabExpensesList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hms_lab_expenses_data', JSON.stringify(updated));
    }
    showToast('Expense record deleted', 'success');
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 400 * 1024) {
      showToast('Signature image size should not exceed 400kb', 'error');
      return;
    }

    setUploadingSign(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        const res = await api.post('/lab/upload-image', {
          imageData: base64Data,
          image: base64Data,
          folder: 'hms/lab-signatures'
        });
        const finalUrl = res?.url || res?.data?.url || base64Data;
        setSignatoryForm(prev => ({ ...prev, signatureImageUrl: finalUrl }));
        showToast('Signature uploaded successfully!', 'success');
      } catch (err) {
        console.error('Signature upload error, using local base64 fallback:', err);
        if (reader.result) {
          setSignatoryForm(prev => ({ ...prev, signatureImageUrl: reader.result }));
          showToast('Signature loaded successfully!', 'success');
        } else {
          showToast(err.data?.message || err.message || 'Image upload failed', 'error');
        }
      } finally {
        setUploadingSign(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const findMatchedTest = (testName) => {
    if (!testName) return null;
    const query = String(testName).toLowerCase();
    const queryNorm = query.replace(/[^a-z0-9]/g, '');

    const found = availableLabTests.find(t => {
      const tTitle = String(t.title || '').toLowerCase();
      const tTest = String(t.test || '').toLowerCase();
      const titleNorm = tTitle.replace(/[^a-z0-9]/g, '');
      const testNorm = tTest.replace(/[^a-z0-9]/g, '');

      // Direct normalized matches
      if (titleNorm === queryNorm || testNorm === queryNorm) return true;
      if (titleNorm && queryNorm && (titleNorm.includes(queryNorm) || queryNorm.includes(titleNorm))) return true;
      if (testNorm && queryNorm && (testNorm.includes(queryNorm) || queryNorm.includes(testNorm))) return true;

      // Word-based subset match
      const getWords = (str) => str.split(/[^a-z0-9]+/g).filter(w => w.length > 1);
      const qWords = getWords(query);
      const tWords = getWords(tTitle);
      const testWords = getWords(tTest);
      
      if (qWords.length > 0) {
        if (tWords.length > 0) {
          const allQInT = qWords.every(w => tWords.includes(w));
          const allTInQ = tWords.every(w => qWords.includes(w));
          if (allQInT || allTInQ) return true;
        }
        if (testWords.length > 0) {
          const allQInTest = qWords.every(w => testWords.includes(w));
          const allTestInQ = testWords.every(w => qWords.includes(w));
          if (allQInTest || allTestInQ) return true;
        }
      }

      return false;
    });

    if (found && Array.isArray(found.parameters) && found.parameters.length > 0) {
      return found;
    }

    // Built-in fallback template for PCOD / PCOS if parameters are missing from DB
    if (queryNorm === 'pcod' || queryNorm.includes('pcod') || queryNorm === 'pcos' || queryNorm.includes('polycysticovarian')) {
      return {
        _id: found?._id || 'built_in_pcod',
        title: found?.title || 'PCOD',
        test: found?.test || 'PCOD',
        category: 'LAB',
        department: 'ENDOCRINOLOGY',
        parameters: [
          {
            name: 'Progesterone',
            displayName: 'Progesterone',
            unit: 'ng/mL',
            referenceRange: 'Follicular: 0.1 - 0.9 | Luteal: 1.8 - 23.9 | Postmenopausal: < 0.2',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Prolactin',
            displayName: 'Prolactin',
            unit: 'ng/mL',
            referenceRange: '< 15 ng/mL (Non-pregnant: 4.8 - 23.3)',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Luteinising Hormone, LH',
            displayName: 'Luteinising Hormone, LH',
            unit: 'mIU/mL',
            referenceRange: 'Follicular: 2.4 - 12.6 | Ovulatory: 14.0 - 95.6 | Luteal: 1.0 - 11.4',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Follicle Stimulating Hormone, FSH',
            displayName: 'Follicle Stimulating Hormone, FSH',
            unit: 'mIU/mL',
            referenceRange: 'Follicular: 3.5 - 12.5 | Ovulatory: 4.7 - 21.5 | Luteal: 1.7 - 7.7',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Random Blood Sugar',
            displayName: 'Random Blood Sugar',
            unit: 'mg/dl',
            referenceRange: '70 - 140',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Estradiol',
            displayName: 'Estradiol',
            unit: 'pg/mL',
            referenceRange: 'Follicular: 12.5 - 166.0 | Ovulatory: 85.8 - 498.0 | Luteal: 43.8 - 211.0',
            fieldType: 'Number',
            gender: 'Both'
          }
        ]
      };
    }

    // Built-in fallback template for AMH Panel / AMH Fertility Profile
    if (queryNorm === 'amhpanel' || queryNorm.includes('amhpanel') || (queryNorm.includes('amh') && queryNorm.includes('panel')) || queryNorm.includes('amhprofile')) {
      return {
        _id: found?._id || 'built_in_amh_panel',
        title: found?.title || 'AMH PANEL',
        test: found?.test || 'AMH PANEL',
        category: 'LAB',
        department: 'BIOCHEMISTRY',
        parameters: [
          {
            name: 'ANTI MULLERIAN HORMONE',
            displayName: 'ANTI MULLERIAN HORMONE',
            unit: 'ng/mL',
            referenceRange: '< 0.50 Poor | 0.50 - 1.0 Limited | 1.00 - 3.50 Optimal | > 3.50 High/PCOS',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Serum thyroxine, T4',
            displayName: 'Serum thyroxine, T4',
            unit: 'ng/mL',
            referenceRange: '52 - 127',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Thyroid-Stimulating Hormone, TSH',
            displayName: 'Thyroid-Stimulating Hormone, TSH',
            unit: 'µIU/mL',
            referenceRange: '0.3 - 4.5',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Prolactin',
            displayName: 'Prolactin',
            unit: 'ng/mL',
            referenceRange: '< 15 ng/mL',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Luteinising Hormone, LH',
            displayName: 'Luteinising Hormone, LH',
            unit: 'mIU/mL',
            referenceRange: 'Follicular: 2.4 - 12.6 | Ovulatory: 14.0 - 95.6 | Luteal: 1.0 - 11.4',
            fieldType: 'Text',
            gender: 'Both'
          },
          {
            name: 'Follicle Stimulating Hormone, FSH',
            displayName: 'Follicle Stimulating Hormone, FSH',
            unit: 'mIU/mL',
            referenceRange: 'Follicular: 3.5 - 12.5 | Ovulatory: 4.7 - 21.5 | Luteal: 1.7 - 7.7',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Estradiol',
            displayName: 'Estradiol',
            unit: 'pg/mL',
            referenceRange: 'Follicular: 12.5 - 166.0 | Ovulatory: 85.8 - 498.0 | Luteal: 43.8 - 211.0',
            fieldType: 'Number',
            gender: 'Both'
          }
        ]
      };
    }

    // Built-in fallback template for single AMH test
    if (queryNorm === 'amh' || queryNorm === 'antimullerianhormone' || queryNorm.includes('antimullerian')) {
      return {
        _id: found?._id || 'built_in_amh',
        title: found?.title || 'AMH (Anti Mullerian Hormone)',
        test: found?.test || 'AMH (Anti Mullerian Hormone)',
        category: 'LAB',
        department: 'BIOCHEMISTRY',
        parameters: [
          {
            name: 'AMH(Anti Mullerian Hormone)',
            displayName: 'AMH (Anti Mullerian Hormone)',
            unit: 'ng/mL',
            referenceRange: '< 0.50 Poor | 0.50 - 1.0 Limited | 1.00 - 3.50 Optimal | > 3.50 High/PCOS',
            fieldType: 'Number',
            gender: 'Both'
          }
        ]
      };
    }

    // Built-in fallback template for eGFR (Estimated Glomerular Filtration Rate)
    if (queryNorm === 'egfr' || queryNorm.includes('egfr') || queryNorm.includes('glomerularfiltrationrate') || queryNorm.includes('estimatedglomerular')) {
      return {
        _id: found?._id || 'built_in_egfr',
        title: found?.title || 'Estimated Glomerular Filtration Rate (eGFR)',
        test: found?.test || 'eGFR',
        category: 'LAB',
        department: 'BIOCHEMISTRY',
        interpretation: `Estimated Glomerular Filtration Rate (eGFR) is calculated using the standardized CKD-EPI (2021) equation based on serum creatinine, age, and sex for kidney function and CKD staging:

• Stage G1 (Normal / High): eGFR >= 90 mL/min/1.73m²
• Stage G2 (Mildly Decreased): eGFR 60 - 89 mL/min/1.73m²
• Stage G3a (Mild-to-Moderately Decreased): eGFR 45 - 59 mL/min/1.73m²
• Stage G3b (Moderately-to-Severely Decreased): eGFR 30 - 44 mL/min/1.73m²
• Stage G4 (Severely Decreased): eGFR 15 - 29 mL/min/1.73m²
• Stage G5 (Kidney Failure / ESRD): eGFR < 15 mL/min/1.73m²

Clinical Note:
1. Persistent eGFR < 60 mL/min/1.73m² for >= 3 months confirms Chronic Kidney Disease (CKD).
2. eGFR >= 60 mL/min/1.73m² without urine albuminuria does not constitute CKD.`,
        parameters: [
          {
            name: 'Serum Creatinine',
            displayName: 'Serum Creatinine',
            unit: 'mg/dL',
            referenceRange: '0.7 - 1.3',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'eGFR',
            displayName: 'eGFR (CKD-EPI 2021)',
            unit: 'mL/min/1.73m²',
            referenceRange: '>= 90 Normal | 60 - 89 Mild | 45 - 59 Moderate | 30 - 44 Severe | < 15 Failure',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'eGFR Category',
            displayName: 'eGFR Category',
            unit: '',
            referenceRange: 'G1 - G5',
            fieldType: 'Text',
            gender: 'Both'
          }
        ]
      };
    }

    // Built-in fallback template for Oral Glucose Challenge Test (OGCT / GCT)
    if (queryNorm === 'gct' || queryNorm === 'ogct' || queryNorm.includes('glucosechallenge') || queryNorm.includes('oralglucosechallenge') || queryNorm.includes('challengetest')) {
      return {
        _id: found?._id || 'built_in_ogct',
        title: found?.title || 'Oral Glucose Challenge Test (OGCT / GCT)',
        test: found?.test || 'OGCT',
        category: 'LAB',
        department: 'BIOCHEMISTRY',
        interpretation: `Clinical Significance:
The Oral Glucose Challenge Test (OGCT / GCT) is a standard screening test for Gestational Diabetes Mellitus (GDM), typically performed between 24 and 28 weeks of gestation in pregnant women. Plasma glucose is measured following oral administration of a 75g (or 50g) glucose load.

Reference Ranges & Screening Cut-offs:
• Fasting Plasma Glucose : 70 – 99 mg/dL
• 1-Hour Plasma Glucose (< 140 mg/dL Normal | 140 - 199 mg/dL Positive/Impaired | ≥ 200 mg/dL GDM)
• 2-Hour Plasma Glucose (75g DIPSI) (< 140 mg/dL Normal | ≥ 140 mg/dL Diagnostic of GDM)

Clinical Interpretation:
• Plasma Glucose < 140 mg/dL : Negative screen (GDM unlikely).
• Plasma Glucose 140 – 199 mg/dL : Positive screen (Impaired gestational glucose tolerance; warrants follow-up diagnostic OGTT / DIPSI criteria).
• Plasma Glucose ≥ 200 mg/dL : Highly suggestive of Gestational Diabetes Mellitus.`,
        parameters: [
          {
            name: 'Fasting Plasma Glucose (FPG)',
            displayName: 'Fasting Plasma Glucose (FPG)',
            unit: 'mg/dL',
            referenceRange: '70 - 99',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: [
              { value: 'Normal (< 100 mg/dL)', isAbnormal: false },
              { value: 'Impaired Fasting Glucose (100 - 125 mg/dL)', isAbnormal: true },
              { value: 'Diabetes Mellitus (≥ 126 mg/dL)', isAbnormal: true }
            ]
          },
          {
            name: 'Oral Glucose Challenge Test (OGCT) - 1 Hour',
            displayName: 'Oral Glucose Challenge Test (OGCT) - 1 Hour (75g)',
            unit: 'mg/dL',
            referenceRange: '< 140 Normal | 140 - 199 Positive | ≥ 200 GDM',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative (< 140 mg/dL)', isAbnormal: false },
              { value: 'Positive / Impaired (140 - 199 mg/dL)', isAbnormal: true },
              { value: 'GDM Highly Suggestive (≥ 200 mg/dL)', isAbnormal: true }
            ]
          },
          {
            name: 'Oral Glucose Challenge Test (OGCT) - 2 Hours',
            displayName: 'Oral Glucose Challenge Test (OGCT) - 2 Hours (75g DIPSI)',
            unit: 'mg/dL',
            referenceRange: '< 140 Normal | ≥ 140 Diagnostic of GDM',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: [
              { value: 'Normal (< 140 mg/dL)', isAbnormal: false },
              { value: 'Diagnostic of GDM (≥ 140 mg/dL)', isAbnormal: true }
            ]
          },
          {
            name: 'Screening Result / Impression',
            displayName: 'Screening Result / Impression',
            unit: '',
            referenceRange: 'Negative / Normal',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative (< 140 mg/dL)', isAbnormal: false },
              { value: 'Positive Screen (140 - 199 mg/dL)', isAbnormal: true },
              { value: 'Gestational Diabetes Mellitus (≥ 200 mg/dL)', isAbnormal: true },
              { value: 'Normal Glucose Tolerance', isAbnormal: false },
              { value: 'Impaired Glucose Tolerance (IGT)', isAbnormal: true }
            ]
          }
        ]
      };
    }

    // Built-in fallback template for Oral Glucose Tolerance Test (OGTT / GTT)
    if (queryNorm === 'gtt' || queryNorm === 'ogtt' || queryNorm.includes('glucosetolerance') || queryNorm.includes('oralglucosetolerance') || queryNorm.includes('tolerancetest')) {
      return {
        _id: found?._id || 'built_in_ogtt',
        title: found?.title || 'Oral Glucose Tolerance Test (OGTT / GTT)',
        test: found?.test || 'OGTT',
        category: 'LAB',
        department: 'BIOCHEMISTRY',
        interpretation: `Standard WHO / ADA 75g Oral Glucose Tolerance Test (OGTT):
• Normal: Fasting < 100 mg/dL and 2-Hour < 140 mg/dL
• Impaired Fasting Glucose (IFG): Fasting 100 - 125 mg/dL
• Impaired Glucose Tolerance (IGT): 2-Hour 140 - 199 mg/dL
• Diabetes Mellitus: Fasting ≥ 126 mg/dL or 2-Hour ≥ 200 mg/dL`,
        parameters: [
          {
            name: 'Fasting Plasma Glucose (0 hr)',
            displayName: 'Fasting Plasma Glucose (0 hr)',
            unit: 'mg/dL',
            referenceRange: '70 - 99',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: [
              { value: 'Normal (< 100 mg/dL)', isAbnormal: false },
              { value: 'Impaired (100 - 125 mg/dL)', isAbnormal: true },
              { value: 'Diabetic (≥ 126 mg/dL)', isAbnormal: true }
            ]
          },
          {
            name: 'Plasma Glucose - 1/2 Hour (30 mins)',
            displayName: 'Plasma Glucose - 1/2 Hour (30 mins)',
            unit: 'mg/dL',
            referenceRange: '110 - 170',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Plasma Glucose - 1 Hour (60 mins)',
            displayName: 'Plasma Glucose - 1 Hour (60 mins)',
            unit: 'mg/dL',
            referenceRange: '120 - 170',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Plasma Glucose - 1.5 Hours (90 mins)',
            displayName: 'Plasma Glucose - 1.5 Hours (90 mins)',
            unit: 'mg/dL',
            referenceRange: '100 - 140',
            fieldType: 'Number',
            gender: 'Both'
          },
          {
            name: 'Plasma Glucose - 2 Hours (120 mins)',
            displayName: 'Plasma Glucose - 2 Hours (120 mins)',
            unit: 'mg/dL',
            referenceRange: '< 140 Normal | 140 - 199 IGT | ≥ 200 Diabetic',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: [
              { value: 'Normal (< 140 mg/dL)', isAbnormal: false },
              { value: 'Impaired Glucose Tolerance (140 - 199 mg/dL)', isAbnormal: true },
              { value: 'Diabetes Mellitus (≥ 200 mg/dL)', isAbnormal: true }
            ]
          },
          {
            name: 'Urine Sugar (Fasting / 1 Hr / 2 Hr)',
            displayName: 'Urine Sugar',
            unit: '',
            referenceRange: 'Nil / Absent',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Nil', isAbnormal: false },
              { value: 'Trace', isAbnormal: true },
              { value: '+ (Present)', isAbnormal: true },
              { value: '++ (Moderate)', isAbnormal: true },
              { value: '+++ (Heavy)', isAbnormal: true }
            ]
          },
          {
            name: 'Impression / Clinical Diagnosis',
            displayName: 'Impression / Clinical Diagnosis',
            unit: '',
            referenceRange: 'Normal Glucose Tolerance',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Normal Glucose Tolerance (NGT)', isAbnormal: false },
              { value: 'Impaired Fasting Glucose (IFG)', isAbnormal: true },
              { value: 'Impaired Glucose Tolerance (IGT)', isAbnormal: true },
              { value: 'Diabetes Mellitus (DM)', isAbnormal: true },
              { value: 'Gestational Diabetes Mellitus (GDM)', isAbnormal: true }
            ]
          }
        ]
      };
    }

    return found || null;
  };

  const handlePrintReport = (reportData, filterTest = 'all') => {
    if (!reportData) return;
    const patient = reportData.patientId || {};
    let ageStr = '—';
    if (patient.age) {
      ageStr = `${patient.age} YRS`;
    } else if (patient.dob) {
      const birthDate = new Date(patient.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      ageStr = `${calculatedAge} YRS`;
    }

    let genderStr = '—';
    if (patient.gender) {
      genderStr = String(patient.gender).toLowerCase().startsWith('f') ? 'F' : 'M';
    }

    const testList = Array.isArray(reportData.tests) 
      ? reportData.tests 
      : (typeof reportData.tests === 'string' 
          ? reportData.tests.split(',').map(t => t.trim()).filter(Boolean) 
          : []);
    
    // Determine tests to print (print all separately, or print single selected test)
    const testsToPrint = (filterTest && filterTest !== 'all')
      ? testList.filter(t => t.toLowerCase() === filterTest.toLowerCase())
      : (testList.length > 0 ? testList : ['LAB INVESTIGATION']);
    
    const formatDateTime = (dateVal, timeVal, fallbackObj) => {
      let d = '';
      let t = '';
      if (dateVal) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateVal).trim())) {
          const [yy, mm, dd] = String(dateVal).trim().split('-');
          d = `${dd}/${mm}/${yy}`;
        } else {
          const parsed = new Date(dateVal);
          d = !isNaN(parsed.getTime()) ? parsed.toLocaleDateString('en-GB') : String(dateVal);
        }
      } else if (fallbackObj) {
        d = new Date(fallbackObj).toLocaleDateString('en-GB');
      }

      if (timeVal) {
        if (String(timeVal).includes(':')) {
          const [h, m] = String(timeVal).trim().split(':');
          let hour = parseInt(h, 10);
          const min = m ? m.slice(0, 2) : '00';
          if (!isNaN(hour)) {
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            t = `${String(hour).padStart(2, '0')}:${min} ${ampm}`;
          } else {
            t = String(timeVal);
          }
        } else {
          t = String(timeVal);
        }
      } else if (fallbackObj) {
        t = new Date(fallbackObj).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }

      if (d && t) return `${d} ${t}`;
      if (d) return d;
      return '—';
    };

    const reqDate = reportData.createdAt ? new Date(reportData.createdAt) : new Date();
    const updDate = reportData.updatedAt ? new Date(reportData.updatedAt) : reqDate;

    const regDateStr = reportData.createdAt 
      ? new Date(reportData.createdAt).toLocaleDateString('en-GB') + ' ' + new Date(reportData.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : formatDateTime('', '', reqDate);

    const collectedDateStr = formatDateTime(
      reportData.report?.collectedDate || reportData.collectedDate || datesInfo.collectedDate,
      reportData.report?.collectedTime || reportData.collectedTime || datesInfo.collectedTime,
      reqDate
    );

    const receivedDateStr = formatDateTime(
      reportData.report?.receivedDate || reportData.receivedDate || datesInfo.receivedDate,
      reportData.report?.receivedTime || reportData.receivedTime || datesInfo.receivedTime,
      reqDate
    );

    const reportDateStr = (reportData.report?.reportedDate || reportData.reportedDate)
      ? formatDateTime(
          reportData.report?.reportedDate || reportData.reportedDate,
          reportData.report?.reportedTime || reportData.reportedTime,
          updDate
        )
      : (reportData.updatedAt
          ? new Date(reportData.updatedAt).toLocaleDateString('en-GB') + ' ' + new Date(reportData.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : formatDateTime('', '', updDate));

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      showToast('Popup blocker prevented opening the print window. Please allow popups for this site.', 'error');
      return;
    }

    const formatInterpretationToHtml = (text) => {
      if (!text) return '';
      const lines = text.split('\n');
      let result = '';
      let inTable = false;
      let tableRows = [];

      const flushTable = () => {
        if (tableRows.length > 0) {
          result += `<table style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5px; border: 1px solid #475569;">`;
          tableRows.forEach((row, rIdx) => {
            const isHeader = rIdx === 0;
            const cellTag = isHeader ? 'th' : 'td';
            const bg = isHeader ? 'background-color: #f8fafc; font-weight: 800;' : '';
            result += `<tr>`;
            row.forEach((cell, cIdx) => {
              const firstColBold = (!isHeader && cIdx === 0) ? 'font-weight: 800; color: #0f172a;' : '';
              result += `<${cellTag} style="border: 1px solid #475569; padding: 4px 8px; text-align: left; ${bg} ${firstColBold}">${cell.trim()}</${cellTag}>`;
            });
            result += `</tr>`;
          });
          result += `</table>`;
          tableRows = [];
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('|')) {
          const isSeparator = line.replace(/[\s|:-]/g, '').length === 0;
          if (!isSeparator) {
            const rawCells = line.split('|').map(c => c.trim());
            const cleanedCells = rawCells.filter((c, idx) => {
              if ((idx === 0 || idx === rawCells.length - 1) && c === '') return false;
              return true;
            });
            tableRows.push(cleanedCells.length > 0 ? cleanedCells : rawCells);
            inTable = true;
          }
        } else {
          if (inTable) {
            flushTable();
            inTable = false;
          }
          if (line.trim()) {
            const isBold = line.trim().endsWith(':') || line.trim().startsWith('Clinical Notes:') || line.trim().startsWith('Possible causes');
            result += `<div style="margin-bottom: 3px; font-weight: ${isBold ? 'bold' : 'normal'}; color: ${isBold ? '#0f172a' : '#334155'}; font-size: 10px;">${line}</div>`;
          } else {
            result += `<div style="height: 4px;"></div>`;
          }
        }
      }
      if (inTable) {
        flushTable();
      }
      return result;
    };
    
    // Complete Hospital Details from Admin Settings
    const hospName = hospitalSettings?.hospitalName || user?.hospitalName || user?.hospital?.name || 'Aman Hospital';
    const hospHeading = hospitalSettings?.hospitalHeading || '';
    const hospAddress = hospitalSettings?.address || '';
    
    const contactNumbers = [];
    if (Array.isArray(hospitalSettings?.mobileNumbers)) {
      hospitalSettings.mobileNumbers.forEach(n => {
        if (n && typeof n === 'string' && n.trim()) contactNumbers.push(n.trim());
      });
    }
    if (Array.isArray(hospitalSettings?.phoneNumbers)) {
      hospitalSettings.phoneNumbers.forEach(p => {
        const num = typeof p === 'object' ? p.number : p;
        const namePrefix = typeof p === 'object' && p.name ? `${p.name}: ` : '';
        if (num && String(num).trim()) contactNumbers.push(`${namePrefix}${String(num).trim()}`);
      });
    }
    if (hospitalSettings?.alternateMobileNumber && hospitalSettings.alternateMobileNumber.trim()) {
      contactNumbers.push(hospitalSettings.alternateMobileNumber.trim());
    }

    const hospEmail = hospitalSettings?.emailAddress || '';
    const hospWebsite = hospitalSettings?.website || '';
    const hospReg = hospitalSettings?.registrationNumber || '';
    const hospGst = hospitalSettings?.gstNumber || '';
    const hospLogo = hospitalSettings?.logoUrl || '';

    let letterheadHtml = '';
    if (hospitalSettings?.letterheadImageUrl) {
      letterheadHtml = `
        <div style="height: ${hospitalSettings.letterheadHeaderHeight || 4.6}cm; width: 100%; overflow: hidden; margin-bottom: 12px;">
          <img src="${hospitalSettings.letterheadImageUrl}" style="width: 100%; height: 100%; object-fit: fill;" />
        </div>
      `;
    } else {
      letterheadHtml = `
        <div style="width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; font-family: sans-serif;">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${hospLogo ? `<img src="${hospLogo}" style="width: 60px; height: 60px; object-fit: contain;" />` : `<div style="width: 60px; height: 60px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #94a3b8; font-size: 11px;">LOGO</div>`}
            <div style="text-align: left;">
              <h1 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.2;">${hospName}</h1>
              ${hospHeading ? `<p style="font-size: 11px; font-weight: bold; color: #ea580c; margin: 2px 0 0 0;">${hospHeading}</p>` : ''}
              ${hospAddress ? `<p style="font-size: 9.5px; color: #475569; margin: 3px 0 0 0; max-width: 420px; font-weight: 600; line-height: 1.3;">${hospAddress}</p>` : ''}
              ${(hospReg || hospGst) ? `<p style="font-size: 8.5px; color: #64748b; margin: 2px 0 0 0; font-weight: bold;">${hospReg ? `Reg No: ${hospReg}` : ''}${hospReg && hospGst ? ' | ' : ''}${hospGst ? `GSTIN: ${hospGst}` : ''}</p>` : ''}
            </div>
          </div>
          <div style="text-align: right; font-size: 9.5px; color: #475569; line-height: 1.4;">
            ${contactNumbers.length > 0 ? `<p style="font-weight: 800; color: #0f172a; margin: 0;">📞 ${contactNumbers.join(', ')}</p>` : ''}
            ${hospEmail ? `<p style="margin: 2px 0 0 0; font-weight: 600;">✉ ${hospEmail}</p>` : ''}
            ${hospWebsite ? `<p style="margin: 2px 0 0 0; font-weight: 600; color: #2563eb;">🌐 ${hospWebsite}</p>` : ''}
          </div>
        </div>
      `;
    }

    const patientDemographicsHtml = `
      <div class="grid-container" style="display: grid; grid-template-columns: repeat(12, 1fr); border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-top: 8px; gap: 12px; font-size: 11px;">
        <div class="col-6" style="grid-column: span 6; line-height: 1.6;">
          <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">${patient.patientName || 'Patient'}</div>
          <div class="row-flex" style="display: flex;">
            <span class="label" style="width: 32%; color: #64748b; font-weight: bold;">Age / Sex</span>
            <span class="value" style="width: 68%; color: #0f172a; font-weight: 900;">: ${ageStr} / ${genderStr}</span>
          </div>
          <div class="row-flex" style="display: flex;">
            <span class="label" style="width: 32%; color: #64748b; font-weight: bold;">Referred by</span>
            <span class="value" style="width: 68%; color: #0f172a; font-weight: 900;">: ${reportData.remarks || 'Self'}</span>
          </div>
          <div class="row-flex" style="display: flex;">
            <span class="label" style="width: 32%; color: #64748b; font-weight: bold;">Reg. no.</span>
            <span class="value" style="width: 68%; color: #0f172a; font-weight: 900;">: ${reportData.labId ? (reportData.labId.startsWith('#') ? reportData.labId : `#${reportData.labId}`) : '—'}</span>
          </div>
        </div>
        <div class="col-6" style="grid-column: span 6; display: flex; flex-direction: column; align-items: flex-end; line-height: 1.6;">
          <div style="width: 100%; max-width: 260px;">
            <div class="row-flex" style="display: flex;">
              <span class="label text-right pr-2" style="width: 42%; text-align: right; padding-right: 8px; color: #64748b; font-weight: bold;">Registered</span>
              <span class="value" style="width: 58%; color: #0f172a; font-weight: 900;">: ${regDateStr}</span>
            </div>
            <div class="row-flex" style="display: flex;">
              <span class="label text-right pr-2" style="width: 42%; text-align: right; padding-right: 8px; color: #64748b; font-weight: bold;">Collected</span>
              <span class="value" style="width: 58%; color: #0f172a; font-weight: 900;">: ${collectedDateStr}</span>
            </div>
            <div class="row-flex" style="display: flex;">
              <span class="label text-right pr-2" style="width: 42%; text-align: right; padding-right: 8px; color: #64748b; font-weight: bold;">Received</span>
              <span class="value" style="width: 58%; color: #0f172a; font-weight: 900;">: ${receivedDateStr}</span>
            </div>
            <div class="row-flex" style="display: flex;">
              <span class="label text-right pr-2" style="width: 42%; text-align: right; padding-right: 8px; color: #64748b; font-weight: bold;">Reported</span>
              <span class="value" style="width: 58%; color: #0f172a; font-weight: 900;">: ${reportDateStr}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const reportSignatory = (reportData.report?.signatoryId && typeof reportData.report.signatoryId === 'object' && reportData.report.signatoryId.name)
      ? reportData.report.signatoryId
      : (signatories.find(s => s._id === (reportData.report?.signatoryId || reportData.signatoryId || selectedSignatoryId)) || (signatories.length > 0 ? signatories[0] : null));

    const signatoryHtml = reportSignatory ? `
      <div class="signatory-box" style="display: flex; justify-content: flex-end; margin-top: 36px; padding-top: 16px; text-align: right; font-size: 11px; page-break-inside: avoid; break-inside: avoid; clear: both;">
        <div style="display: inline-block; text-align: center; min-width: 160px; padding-top: 4px;">
          ${reportSignatory.signatureImageUrl ? `<img class="signature-img" src="${reportSignatory.signatureImageUrl}" style="max-height: 48px; max-width: 150px; object-fit: contain; margin-bottom: 6px; display: block; margin-left: auto; margin-right: auto;" />` : ''}
          <b style="font-size: 11px; color: #0f172a; display: block;">${reportSignatory.name}</b>
          <span style="font-size: 10px; color: #475569; display: block; margin-top: 2px;">${reportSignatory.designation}</span>
        </div>
      </div>
    ` : '';

    // Build pages HTML - ONE PAGE PER LAB TEST SEPARATELY!
    let allPagesHtml = '';
    const patientGender = String(patient.gender || '').trim().toLowerCase();
    const isFemalePatient = patientGender.startsWith('f');
    const isMalePatient = patientGender.startsWith('m');

    testsToPrint.forEach((tName) => {
      const matchedTest = findMatchedTest(tName);
      const rawParams = matchedTest && Array.isArray(matchedTest.parameters) ? matchedTest.parameters : [];
      const genderFiltered = rawParams.filter(p => {
        const pGender = String(p.gender || 'both').trim().toLowerCase();
        if (pGender === 'both' || !pGender || pGender === 'all') return true;
        if (pGender === 'male' || pGender === 'm') return isMalePatient || !patientGender;
        if (pGender === 'female' || pGender === 'f') return isFemalePatient || !patientGender;
        return true;
      });
      const testParams = genderFiltered.length > 0 ? genderFiltered : rawParams;

      let rowsHtml = '';
      if (String(tName || '').toLowerCase().includes('widal')) {
        const dilutions = getWidalDilutions(tName);
        let widalGrid = getWidalDefaultGrid(tName);
        const widalJsonParam = reportData.report?.parameters?.find(rp => rp.name === 'widal_matrix_json');
        if (widalJsonParam && widalJsonParam.value) {
          try {
            widalGrid = typeof widalJsonParam.value === 'string' ? JSON.parse(widalJsonParam.value) : widalJsonParam.value;
          } catch(e) {}
        }
        const widalCommentParam = reportData.report?.parameters?.find(rp => rp.name === 'widal_comment' || rp.name === 'Result' || rp.name === 'Comment');
        let widalCommentVal = widalCommentParam?.value ? widalCommentParam.value.replace(/^WIDAL TEST\s*/i, '').trim() : 'POSITIVE';
        if (!widalCommentVal) widalCommentVal = 'POSITIVE';
        const noteText = getWidalNote(tName);

        rowsHtml += `
          <tr>
            <td colspan="4" style="padding: 10px 16px; border-bottom: 1px solid #cbd5e1;">
              <p style="font-size: 11px; font-weight: 600; color: #334155; margin: 0 0 8px 0;">Tube agglutination test for Salmonella group of organisms reveal following titers.</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #94a3b8; text-align: center; margin-bottom: 12px;">
                <thead>
                  <tr style="background: #f1f5f9; border-bottom: 1px solid #94a3b8;">
                    <th style="padding: 6px 8px; border-right: 1px solid #cbd5e1; text-align: left; font-size: 10px;">Antigens / Dilutions</th>
                    ${dilutions.map(d => `<th style="padding: 6px 8px; border-right: 1px solid #cbd5e1; font-size: 10px; font-weight: 800;">${d}</th>`).join('')}
                    <th style="padding: 6px 8px; font-size: 10px; font-weight: 800;">Result</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.keys(widalGrid).map(antigen => {
                    const posDils = dilutions.filter(d => (widalGrid[antigen]?.[d] || '').includes('+'));
                    const highestTiter = posDils.length > 0 ? posDils[posDils.length - 1] : 'Non-Reactive';
                    const displayVal = highestTiter !== 'Non-Reactive' 
                      ? (highestTiter.startsWith('1:') ? `${highestTiter} (+)` : `1:${highestTiter.replace('1/', '')} (+)`) 
                      : 'Non-Reactive';
                    return `
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; text-align: left; font-weight: bold; color: #0f172a;">${antigen}</td>
                        ${dilutions.map(d => `<td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; color: ${widalGrid[antigen]?.[d]?.includes('+') ? '#ea580c; font-weight: 900;' : '#64748b;'}">${widalGrid[antigen]?.[d] || '—'}</td>`).join('')}
                        <td style="padding: 5px 8px; font-weight: 900; color: ${displayVal !== 'Non-Reactive' ? '#ea580c' : '#059669'}">${displayVal}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              <div style="font-size: 10.5px; font-weight: bold; color: #0f172a; margin-bottom: 6px;">
                Comment: <span style="color: #ea580c; font-weight: 900;">WIDAL TEST ${widalCommentVal}</span>
              </div>
              <div style="font-size: 9.5px; color: #64748b; font-style: italic; line-height: 1.4;">
                ${noteText}
              </div>
            </td>
          </tr>
        `;
      } else {
        let lastGroup = null;
        testParams.forEach(p => {
          if (p.group && p.group !== lastGroup) {
            lastGroup = p.group;
            rowsHtml += `
              <tr style="background: #f1f5f9;">
                <td colspan="4" style="padding: 5px 16px; font-weight: 800; text-transform: uppercase; color: #334155; font-size: 10px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                  ${p.group}
                </td>
              </tr>
            `;
          }

          const existingParam = reportData.report?.parameters?.find(ep => ep.name === p.name);
          const pVal = existingParam ? existingParam.value : '—';
          const pRemark = existingParam ? existingParam.remarks : '';
          const isAbnormal = existingParam?.isAbnormal || false;

          let refDisplay = '—';
          if (p.referenceRange) {
            refDisplay = p.referenceRange;
          } else if (p.normalRange) {
            refDisplay = p.normalRange;
          } else if (p.min !== undefined && p.max !== undefined) {
            refDisplay = `${p.min} - ${p.max}`;
          }

          rowsHtml += `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 16px; font-weight: 600; color: #1e293b;">
                ${p.name}
                ${pRemark ? `<div style="font-size: 9px; color: #64748b; font-style: italic; font-weight: normal; margin-top: 2px;">Note: ${pRemark}</div>` : ''}
              </td>
              <td style="padding: 6px 16px; font-weight: 800; color: ${isAbnormal ? '#dc2626' : '#0f172a'};">
                ${pVal || '—'}
              </td>
              <td style="padding: 6px 16px; color: #64748b;">
                ${p.unit || '—'}
              </td>
              <td style="padding: 6px 16px; color: #64748b;">
                ${refDisplay}
              </td>
            </tr>
          `;
        });
      }

      const testInterpretation = matchedTest?.interpretation || reportData.report?.interpretation || '';
      const hasInterpretation = testInterpretation && testInterpretation.trim() !== '' && printInterpretation && reportData.printInterpretation !== false;

      allPagesHtml += `
        <div class="report-page">
          <div class="container">
            <table class="report-wrapper-table">
              <thead>
                <tr>
                  <th>
                    ${letterheadHtml}
                    ${patientDemographicsHtml}
                    <div style="text-align: center; margin: 12px 0 10px 0; border-bottom: 2px solid #0f172a; padding-bottom: 6px;">
                      <h3 style="font-size: 13px; font-weight: 900; letter-spacing: 1px; color: #0f172a; margin: 0; text-transform: uppercase;">
                        ${matchedTest?.department || reportData.category || 'DEPARTMENT OF PATHOLOGY'}
                      </h3>
                      <div style="font-size: 11px; font-weight: 800; color: #ea580c; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${tName}
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="table-box">
                      <table>
                        <thead>
                          <tr>
                            <th style="width: 40%;">TEST</th>
                            <th style="width: 20%;">VALUE</th>
                            <th style="width: 20%;">UNIT</th>
                            <th style="width: 20%;">REFERENCE</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${rowsHtml}
                        </tbody>
                      </table>
                    </div>

                    ${reportData.report?.notes ? `<div class="italic-box"><b>Notes:</b> ${reportData.report.notes}</div>` : ''}
                    ${reportData.report?.remarks ? `<div class="italic-box"><b>Remarks:</b> ${reportData.report.remarks}</div>` : ''}
                    ${reportData.report?.advice ? `<div class="italic-box"><b>Advice:</b> ${reportData.report.advice}</div>` : ''}
                    
                    ${hasInterpretation ? `
                      <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px; page-break-inside: avoid; break-inside: avoid;">
                        <h4 style="font-size: 11px; font-weight: 900; margin: 0 0 6px 0; text-transform: uppercase;">Interpretation</h4>
                        <div style="font-size: 10px; line-height: 1.5; color: #334155;">${formatInterpretationToHtml(testInterpretation)}</div>
                      </div>
                    ` : ''}

                    ${signatoryHtml}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Lab Report - ${patient.patientName || 'Patient'}</title>
          <style>
            @page { margin: 0; size: A4; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #1e293b;
            }
            .report-page {
              page-break-after: always !important;
              break-after: page !important;
              min-height: 100vh;
              box-sizing: border-box;
              background: #ffffff;
            }
            .report-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .container {
              padding: 0 24px 24px 24px;
              padding-top: ${hospitalSettings?.letterheadImageUrl ? `${hospitalSettings.letterheadHeaderHeight || 0}cm` : '10px'};
              padding-bottom: ${hospitalSettings?.letterheadImageUrl ? `${hospitalSettings.letterheadFooterHeight || 0}cm` : '10px'};
              max-width: 800px;
              margin: 0 auto;
              box-sizing: border-box;
            }
            .table-box {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              overflow: hidden;
              margin-top: 12px;
            }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th {
              background: #f1f5f9;
              padding: 9px 16px;
              font-weight: 800;
              text-align: left;
              color: #1e293b;
              border-bottom: 2px solid #cbd5e1;
            }
            td { text-align: left; }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(12, 1fr);
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-top: 8px;
              gap: 12px;
              font-size: 11px;
            }
            .col-6 { grid-column: span 6; }
            .row-flex { display: flex; line-height: 1.6; }
            .label { width: 32%; color: #64748b; font-weight: bold; }
            .value { width: 68%; color: #0f172a; font-weight: 900; }
            .text-right { text-align: right; }
            .pr-2 { padding-right: 8px; }
            .italic-box { font-style: italic; font-size: 10.5px; color: #475569; margin-top: 10px; }
            .signatory-box { font-size: 11px; }
            .signature-img {
              max-height: 48px;
              max-width: 150px;
              object-fit: contain;
              margin-bottom: 6px;
              display: block;
              margin-left: auto;
              margin-right: auto;
            }
            .report-wrapper-table { width: 100%; border-collapse: collapse; border: none; }
            .report-wrapper-table > thead { display: table-header-group; }
            .report-wrapper-table > tbody { display: table-row-group; }
            .report-wrapper-table > thead > tr > th { border: none; padding: 0; text-align: left; font-weight: normal; }
            .report-wrapper-table > tbody > tr > td { border: none; padding: 0; }
            .table-box table tr { page-break-inside: avoid; break-inside: avoid; }
          </style>
        </head>
        <body>
          ${allPagesHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const loadDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const [reqs, tests, bills, settingsRes, regRes] = await Promise.all([
        api.get('/lab/requests').catch(() => []),
        api.get('/lab/tests').catch(() => []),
        api.get('/lab/bills').catch(() => []),
        api.get('/admin/hospital-settings').catch(() => null),
        api.get('/patients/registrations/list').catch(() => [])
      ]);
      setLabRequests(Array.isArray(reqs) ? reqs : []);
      setAvailableLabTests(Array.isArray(tests) ? tests : []);
      setLabBills(Array.isArray(bills) ? bills : []);
      const patList = Array.isArray(regRes) ? regRes : (regRes?.registrations || []);
      setRegisteredPatients(patList);
      if (settingsRes && (settingsRes.data || settingsRes.hospitalName)) {
        setHospitalSettings(settingsRes.data || settingsRes);
      }
      loadSignatories();
    } catch (err) {
      console.error('Failed to load lab dashboard data', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Formats lab request data into Today's Reports row objects
  const rawReportsList = (labRequests.length > 0 ? labRequests : [
    {
      _id: 'req_demo_1072',
      labId: '1072',
      category: 'L1',
      createdAt: new Date().toISOString(),
      patientId: { patientName: 'Mr. Ravi Shukla', age: 25, gender: 'Male', uhid: 'UH1072', mobile: '8949895216' },
      remarks: 'Referred by: Self',
      tests: ['Dengue IgG'],
      collectionType: 'Main',
      reportStatus: 'New',
      status: 'pending'
    }
  ]).map((req, idx) => {
    const matchedBill = labBills.find(b => b.labRequestId === req._id || b.labId === req.labId);
    const dateObj = req.createdAt ? new Date(req.createdAt) : new Date();
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const hasValidBill = Boolean(
      (matchedBill && (matchedBill.paidAmount > 0 || matchedBill.paymentStatus === 'Paid' || matchedBill.paymentStatus === 'Partial' || (Array.isArray(matchedBill.payments) && matchedBill.payments.length > 0))) ||
      (req.billingRecord && (req.billingRecord.paidAmount > 0 || req.billingRecord.paymentStatus === 'Paid' || req.billingRecord.paymentStatus === 'Partial' || (Array.isArray(req.billingRecord.payments) && req.billingRecord.payments.length > 0)))
    );

    const needsBill = !hasValidBill && req.reportStatus !== 'Completed' && req.reportStatus !== 'Signed off' && req.reportStatus !== 'Draft' && req.reportStatus !== 'In progress';

    let statusTag = 'New';
    let statusCategory = 'new';

    const reportStatusLower = String(req.reportStatus || '').toLowerCase();
    const statusLower = String(req.status || '').toLowerCase();

    if (reportStatusLower === 'completed' || reportStatusLower === 'final' || statusLower === 'completed') {
      statusTag = 'Final';
      statusCategory = 'final';
    } else if (reportStatusLower === 'signed off' || reportStatusLower === 'signed_off') {
      statusTag = 'Signed off';
      statusCategory = 'signed_off';
    } else if (
      reportStatusLower === 'draft' ||
      reportStatusLower === 'in progress' ||
      reportStatusLower === 'in_progress' ||
      statusLower === 'testing_in_progress' ||
      (req.report && (Array.isArray(req.report.parameters) && req.report.parameters.length > 0))
    ) {
      statusTag = 'In progress';
      statusCategory = 'in_progress';
    } else if (needsBill) {
      statusTag = 'Create bill';
      statusCategory = 'create_bill';
    } else {
      statusTag = 'New';
      statusCategory = 'new';
    }

    const regNo = req.labId ? (req.labId.startsWith('#') ? req.labId : `#${req.labId}`) : `#1072`;
    const modBadge = req.category || 'L1';
    const pName = req.patientId?.patientName || 'Mr. Ravi Shukla';
    const ageVal = req.patientId?.age || 25;
    const genderVal = req.patientId?.gender?.[0]?.toUpperCase() || 'M';
    const ageSexStr = `${ageVal} YRS/${genderVal}`;

    let refBy = 'Self';
    if (req.remarks && req.remarks.includes('Referred by:')) {
      refBy = req.remarks.split('Referred by:')[1].trim();
    }

    const testsStr = Array.isArray(req.tests) ? req.tests.join(', ') : (req.tests || 'Dengue IgG');
    const ccVal = req.collectionType || 'Main';
    const dateStr = dateObj.toLocaleDateString('en-GB'); // "19/08/2026"

    // Determine request origin (OPD / IPD / Direct Walk-in)
    let source = 'OPD';
    if (req.remarks && req.remarks.toLowerCase().includes('ipd')) {
      source = 'IPD';
    } else if (Array.isArray(req.statusHistory) && req.statusHistory.some(sh => sh.notes && sh.notes.toLowerCase().includes('ipd'))) {
      source = 'IPD';
    } else if (req.doctorId?.department || (req.patientId && req.patientId.department) || (Array.isArray(req.statusHistory) && req.statusHistory.some(sh => sh.notes && sh.notes.toLowerCase().includes('lab request created')))) {
      source = 'OPD';
    } else if (matchedBill && matchedBill.paidAmount > 0 && !req.isOpd) {
      source = 'Direct';
    } else {
      source = 'OPD';
    }

    const isOpdOrIpd = source === 'OPD' || source === 'IPD' || needsBill;

    return {
      id: req._id,
      regNo,
      modBadge,
      time: timeStr,
      dateStr,
      createdAtDate: dateObj,
      patientName: pName,
      ageSex: ageSexStr,
      mobile: req.patientId?.mobile || '8949895216',
      referredBy: refBy,
      tests: testsStr,
      cc: ccVal,
      status: statusTag,
      statusCategory,
      needsBill,
      source,
      isOpdOrIpd,
      rawRequest: req,
      rawBill: matchedBill
    };
  });

  const reportsForSelectedDate = rawReportsList.filter(item => item.dateStr === selectedDate);

  // Filter list based on search and active tab filter (Today's Reports)
  const filteredReports = reportsForSelectedDate.filter(item => {
    const q = searchInPage.toLowerCase();
    const matchesSearch = !q || (
      item.regNo.toLowerCase().includes(q) ||
      item.patientName.toLowerCase().includes(q) ||
      item.tests.toLowerCase().includes(q) ||
      item.referredBy.toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    if (activeTabFilter === 'all') return true;
    if (activeTabFilter === 'new') return item.statusCategory === 'new';
    if (activeTabFilter === 'create_bill') return item.statusCategory === 'create_bill';
    if (activeTabFilter === 'in_progress') return item.statusCategory === 'in_progress';
    if (activeTabFilter === 'final') return item.statusCategory === 'final';
    if (activeTabFilter === 'signed_off') return item.statusCategory === 'signed_off';
    return true;
  });

  const countAll = reportsForSelectedDate.length;
  const countNew = reportsForSelectedDate.filter(r => r.statusCategory === 'new').length;
  const countCreateBill = reportsForSelectedDate.filter(r => r.statusCategory === 'create_bill').length;
  const countInProgress = reportsForSelectedDate.filter(r => r.statusCategory === 'in_progress').length;
  const countFinal = reportsForSelectedDate.filter(r => r.statusCategory === 'final').length;
  const countSignedOff = reportsForSelectedDate.filter(r => r.statusCategory === 'signed_off').length;

  // Sorted and Paginated Today's Reports
  const sortedReports = React.useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const timeA = a.createdAtDate ? a.createdAtDate.getTime() : 0;
      const timeB = b.createdAtDate ? b.createdAtDate.getTime() : 0;
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [filteredReports, sortOrder]);

  const totalReportPages = Math.max(1, Math.ceil(sortedReports.length / reportsPageSize));
  const safeReportPage = Math.min(Math.max(reportsCurrentPage, 1), totalReportPages);
  const paginatedReports = sortedReports.slice((safeReportPage - 1) * reportsPageSize, safeReportPage * reportsPageSize);

  // Search Lab Reports filtered list
  const searchFilteredReports = rawReportsList.filter(item => {
    // 1. Patient Name filter
    if (searchPatientName && !item.patientName.toLowerCase().includes(searchPatientName.toLowerCase())) {
      return false;
    }
    // 2. Status filter
    if (searchStatus && searchStatus !== 'all') {
      if (searchStatus === 'new' && item.statusCategory !== 'new') return false;
      if (searchStatus === 'create_bill' && item.statusCategory !== 'create_bill') return false;
      if (searchStatus === 'in_progress' && item.statusCategory !== 'in_progress') return false;
      if (searchStatus === 'final' && item.statusCategory !== 'final') return false;
      if (searchStatus === 'signed_off' && item.statusCategory !== 'signed_off') return false;
    }
    // 3. Referred by filter
    if (searchReferredBy && searchReferredBy !== 'all' && !item.referredBy.toLowerCase().includes(searchReferredBy.toLowerCase())) {
      return false;
    }
    // 4. Reg No filter
    if (searchRegNo && !item.regNo.toLowerCase().includes(searchRegNo.toLowerCase())) {
      return false;
    }
    // 5. Daily case no filter
    if (searchDailyCaseNo && !item.regNo.toLowerCase().includes(searchDailyCaseNo.toLowerCase())) {
      return false;
    }
    // 6. UHID filter
    if (searchUhid) {
      const u = item.rawRequest?.patientId?.uhid || item.rawBill?.patientId?.uhid || '';
      if (!u.toLowerCase().includes(searchUhid.toLowerCase())) return false;
    }
    // 7. Test filter
    if (searchSelectedTest && searchSelectedTest !== 'all') {
      if (!item.tests.toLowerCase().includes(searchSelectedTest.toLowerCase())) return false;
    }
    // 8. Duration filter
    if (searchDuration && searchDuration !== 'all') {
      const now = new Date();
      const itemDate = item.createdAtDate || new Date();
      
      if (searchDuration === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (itemDate < startOfToday) return false;
      } else if (searchDuration === 'yesterday') {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (itemDate < startOfYesterday || itemDate >= endOfYesterday) return false;
      } else if (searchDuration === 'past_7_days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < sevenDaysAgo) return false;
      } else if (searchDuration === 'past_30_days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (itemDate < thirtyDaysAgo) return false;
      } else if (searchDuration === 'this_month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (itemDate < startOfMonth) return false;
      } else if (searchDuration === 'last_month') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        if (itemDate < startOfLastMonth || itemDate > endOfLastMonth) return false;
      }
    }
    return true;
  });

  const getDurationDateRangeStr = (dur) => {
    const now = new Date();
    const formatDate = (d) => {
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    if (dur === 'today') {
      return `${formatDate(now)} to ${formatDate(now)}`;
    } else if (dur === 'yesterday') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return `${formatDate(yesterday)} to ${formatDate(yesterday)}`;
    } else if (dur === 'past_7_days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${formatDate(sevenDaysAgo)} to ${formatDate(now)}`;
    } else if (dur === 'past_30_days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `${formatDate(thirtyDaysAgo)} to ${formatDate(now)}`;
    } else if (dur === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return `${formatDate(startOfMonth)} to ${formatDate(now)}`;
    } else if (dur === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return `${formatDate(startOfLastMonth)} to ${formatDate(endOfLastMonth)}`;
    }
    return 'All time';
  };

  const handleClearSearchFilters = () => {
    setSearchDuration('past_7_days');
    setSearchPatientName('');
    setSearchStatus('all');
    setSearchReferredBy('all');
    setSearchRegNo('');
    setSearchDailyCaseNo('');
    setSearchUhid('');
    setSearchSelectedTest('all');
  };

  const formatTimeAgo = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return dateObj.toLocaleDateString('en-GB');
  };

  // Compile Comprehensive Chronological Lab Activities and Audit Trail
  const allLabActivities = React.useMemo(() => {
    const events = [];

    labRequests.forEach((req) => {
      const pName = req.patientId?.patientName || 'Patient';
      const ageVal = req.patientId?.age || '';
      const genderVal = req.patientId?.gender?.[0]?.toUpperCase() || '';
      const ageSexStr = ageVal ? `${ageVal} YRS${genderVal ? `/${genderVal}` : ''}` : '';
      const uhid = req.patientId?.uhid || 'N/A';
      const mobile = req.patientId?.mobile || '';
      const labId = req.labId ? (req.labId.startsWith('#') ? req.labId : `#${req.labId}`) : 'N/A';
      const testsStr = Array.isArray(req.tests) ? req.tests.join(', ') : (req.tests || 'Diagnostic Tests');

      let refBy = 'Self';
      if (req.remarks && req.remarks.includes('Referred by:')) {
        refBy = req.remarks.split('Referred by:')[1].trim();
      }

      let source = 'OPD';
      if (req.remarks && req.remarks.toLowerCase().includes('ipd')) {
        source = 'IPD';
      } else if (Array.isArray(req.statusHistory) && req.statusHistory.some(sh => sh.notes && sh.notes.toLowerCase().includes('ipd'))) {
        source = 'IPD';
      } else if (req.doctorId?.department || (req.patientId && req.patientId.department)) {
        source = 'OPD';
      } else {
        source = 'Direct';
      }

      const createdDate = req.createdAt ? new Date(req.createdAt) : (req.bookingDate ? new Date(req.bookingDate) : new Date());

      // 1. Order / Request Created
      events.push({
        id: `req-created-${req._id}`,
        category: 'requests',
        categoryLabel: 'Order Created',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
        iconName: 'Plus',
        action: 'Lab Request Booked',
        title: `Test order created for ${testsStr}`,
        description: `New lab request registered for ${pName} (${ageSexStr || 'Patient'}). Source: ${source}. Referred by: ${refBy}.`,
        patientName: pName,
        ageSex: ageSexStr,
        uhid,
        mobile,
        labId,
        tests: testsStr,
        source,
        referredBy: refBy,
        timestamp: createdDate,
        performedBy: req.doctorId?.doctorName || req.doctorId?.username || refBy || 'Reception / Desk',
        performedRole: 'Doctor / Recommender',
        rawRequest: req
      });

      // 2. Sample Collection
      if (
        req.sampleStatus === 'Sample Collected' || 
        req.sampleStatus === 'Sample Submitted' ||
        req.report?.collectedAt ||
        req.collectionDate
      ) {
        const sampleDate = new Date(req.report?.collectedAt || req.collectionDate || req.updatedAt || createdDate);
        const colBy = req.report?.collectedByName || req.collectedByName || req.assignedAssistantId?.doctorName || req.assignedAssistantId?.username || 'Lab Phlebotomist';
        events.push({
          id: `req-sample-${req._id}`,
          category: 'samples',
          categoryLabel: 'Sample Collected',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          dotColor: 'bg-amber-500',
          iconName: 'FlaskConical',
          action: 'Specimen / Sample Collected',
          title: `Sample collected for ${testsStr}`,
          description: `Diagnostic biological sample collected via ${req.collectionType || 'Lab Visit'}. Processing initiated.`,
          patientName: pName,
          ageSex: ageSexStr,
          uhid,
          mobile,
          labId,
          tests: testsStr,
          source,
          referredBy: refBy,
          timestamp: sampleDate,
          performedBy: colBy,
          performedRole: 'Phlebotomist / Technician',
          rawRequest: req
        });
      }

      // 3. Results Entry / Testing In Progress
      const hasParameters = Array.isArray(req.report?.parameters) && req.report.parameters.length > 0;
      if (
        hasParameters ||
        req.reportStatus === 'In Progress' ||
        req.status === 'testing_in_progress' ||
        req.report?.interpretation ||
        req.report?.remarks
      ) {
        const resultsDate = new Date(req.report?.updatedAt || req.updatedAt || createdDate);
        const paramCount = req.report?.parameters?.length || 0;
        events.push({
          id: `req-results-${req._id}`,
          category: 'results',
          categoryLabel: 'Results Entered',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          dotColor: 'bg-indigo-500',
          iconName: 'Edit3',
          action: 'Test Parameters Recorded',
          title: `${paramCount > 0 ? `${paramCount} parameter value(s) recorded` : 'Diagnostic results drafted'} for ${testsStr}`,
          description: `Parameters, reference ranges, and observations updated.${req.report?.remarks ? ` Remarks: "${req.report.remarks}"` : ''}`,
          patientName: pName,
          ageSex: ageSexStr,
          uhid,
          mobile,
          labId,
          tests: testsStr,
          source,
          referredBy: refBy,
          timestamp: resultsDate,
          performedBy: req.report?.updatedBy?.doctorName || req.report?.updatedBy?.username || 'Lab Technician',
          performedRole: 'Lab Technician',
          rawRequest: req
        });
      }

      // 4. Report Finalized / Completed
      const isFinal = req.reportStatus === 'Completed' || req.reportStatus === 'Final' || req.reportStatus === 'Signed off' || req.status === 'completed';
      if (isFinal) {
        const finalDate = new Date(req.report?.completionDate || req.report?.generatedAt || req.updatedAt || createdDate);
        events.push({
          id: `req-final-${req._id}`,
          category: 'reports',
          categoryLabel: 'Report Finalized',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dotColor: 'bg-emerald-500',
          iconName: 'Check',
          action: 'Lab Report Finalized & Ready',
          title: `Diagnostic report finalized for ${testsStr}`,
          description: `All investigative parameters verified and marked complete. Ready for patient print and delivery.`,
          patientName: pName,
          ageSex: ageSexStr,
          uhid,
          mobile,
          labId,
          tests: testsStr,
          source,
          referredBy: refBy,
          timestamp: finalDate,
          performedBy: req.report?.generatedBy?.doctorName || req.report?.signatoryId?.name || 'Pathologist',
          performedRole: 'Pathologist',
          rawRequest: req
        });
      }

      // 5. Signed Off by Authorized Signatory
      if (req.reportStatus === 'Signed off' || req.report?.signatoryId) {
        const signDate = new Date(req.report?.reportedDate || req.report?.completionDate || req.updatedAt || createdDate);
        const sigObj = (req.report?.signatoryId && typeof req.report.signatoryId === 'object' && req.report.signatoryId.name)
          ? req.report.signatoryId
          : signatories.find(s => s._id === req.report?.signatoryId);
        
        events.push({
          id: `req-signoff-${req._id}`,
          category: 'reports',
          categoryLabel: 'Report Signed Off',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          dotColor: 'bg-purple-500',
          iconName: 'UserCheck',
          action: 'Clinical Sign-off Stamp Applied',
          title: `Report authorized & digitally stamped for ${testsStr}`,
          description: `Authorized by ${sigObj?.name || 'Doctor'} (${sigObj?.designation || 'Consultant Pathologist'}). Clinical approval granted.`,
          patientName: pName,
          ageSex: ageSexStr,
          uhid,
          mobile,
          labId,
          tests: testsStr,
          source,
          referredBy: refBy,
          timestamp: signDate,
          performedBy: sigObj?.name || 'Authorized Pathologist',
          performedRole: sigObj?.designation || 'Consultant Pathologist',
          rawRequest: req
        });
      }
    });

    // 6. Billing & Payment Transactions
    labBills.forEach((bill) => {
      const pName = bill.patientId?.patientName || 'Patient';
      const uhid = bill.patientId?.uhid || 'N/A';
      const mobile = bill.patientId?.mobile || '';
      const billNo = bill.billNo || bill.labId || 'BILL';
      const billCreatedDate = bill.createdAt ? new Date(bill.createdAt) : new Date();

      // Bill generation event
      events.push({
        id: `bill-created-${bill._id}`,
        category: 'billing',
        categoryLabel: 'Bill Generated',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        dotColor: 'bg-orange-500',
        iconName: 'Receipt',
        action: 'Lab Bill / Invoice Created',
        title: `Bill #${billNo} generated: ₹${(bill.totalAmount || 0).toLocaleString('en-IN')}`,
        description: `Invoice raised for ${pName}. Total: ₹${(bill.totalAmount || 0).toLocaleString('en-IN')}, Paid: ₹${(bill.paidAmount || 0).toLocaleString('en-IN')}, Due: ₹${(bill.dueAmount || 0).toLocaleString('en-IN')}. Status: ${bill.paymentStatus || 'Unpaid'}.`,
        patientName: pName,
        uhid,
        mobile,
        labId: billNo,
        amount: bill.totalAmount || 0,
        timestamp: billCreatedDate,
        performedBy: bill.doctorId?.doctorName || bill.doctorId?.username || 'Billing Desk',
        performedRole: 'Billing Desk',
        rawBill: bill
      });

      // Individual payment events
      if (Array.isArray(bill.payments) && bill.payments.length > 0) {
        bill.payments.forEach((payment, pIdx) => {
          const payDate = payment.date ? new Date(payment.date) : (bill.updatedAt ? new Date(bill.updatedAt) : billCreatedDate);
          events.push({
            id: `bill-payment-${bill._id}-${pIdx}`,
            category: 'billing',
            categoryLabel: 'Payment Received',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            dotColor: 'bg-emerald-600',
            iconName: 'Wallet',
            action: `Payment Received (${payment.paymentMethod || 'Cash'})`,
            title: `₹${(payment.amount || 0).toLocaleString('en-IN')} received for Bill #${billNo}`,
            description: `Payment of ₹${(payment.amount || 0).toLocaleString('en-IN')} collected via ${payment.paymentMethod || 'Cash'}${payment.transactionRef ? ` (Ref: ${payment.transactionRef})` : ''}.${payment.remarks ? ` Note: ${payment.remarks}` : ''}`,
            patientName: pName,
            uhid,
            mobile,
            labId: billNo,
            amount: payment.amount || 0,
            timestamp: payDate,
            performedBy: payment.receivedByName || payment.receivedBy?.doctorName || payment.receivedBy?.username || 'Cashier',
            performedRole: 'Cashier / Finance',
            rawBill: bill
          });
        });
      } else if (bill.paidAmount > 0) {
        const payDate = bill.updatedAt ? new Date(bill.updatedAt) : billCreatedDate;
        events.push({
          id: `bill-paid-${bill._id}`,
          category: 'billing',
          categoryLabel: 'Payment Received',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dotColor: 'bg-emerald-600',
          iconName: 'Wallet',
          action: `Payment Received (${bill.paymentMethod || 'Cash'})`,
          title: `₹${(bill.paidAmount || 0).toLocaleString('en-IN')} received for Bill #${billNo}`,
          description: `Payment of ₹${(bill.paidAmount || 0).toLocaleString('en-IN')} collected. Status: ${bill.paymentStatus || 'Paid'}.`,
          patientName: pName,
          uhid,
          mobile,
          labId: billNo,
          amount: bill.paidAmount || 0,
          timestamp: payDate,
          performedBy: bill.paymentReceivedBy?.doctorName || 'Cashier',
          performedRole: 'Cashier',
          rawBill: bill
        });
      }
    });

    // Sort newest to oldest
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [labRequests, labBills, signatories]);

  // Filtered Lab Activities List
  const filteredLabActivities = React.useMemo(() => {
    return allLabActivities.filter(item => {
      // 1. Search Query filter
      if (activitySearchQuery) {
        const q = activitySearchQuery.toLowerCase();
        const matches = (
          item.patientName.toLowerCase().includes(q) ||
          item.uhid.toLowerCase().includes(q) ||
          item.labId.toLowerCase().includes(q) ||
          (item.tests && item.tests.toLowerCase().includes(q)) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.performedBy.toLowerCase().includes(q) ||
          item.action.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      // 2. Category Filter
      if (activityCategoryFilter !== 'all') {
        if (item.category !== activityCategoryFilter) return false;
      }

      // 3. Source Filter
      if (activitySourceFilter !== 'all') {
        if (item.source && item.source !== activitySourceFilter) return false;
      }

      // 4. Duration Filter
      if (activityDuration && activityDuration !== 'all') {
        const now = new Date();
        const itemDate = item.timestamp;

        if (activityDuration === 'today') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (itemDate < startOfToday) return false;
        } else if (activityDuration === 'yesterday') {
          const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (itemDate < startOfYesterday || itemDate >= endOfYesterday) return false;
        } else if (activityDuration === 'past_7_days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < sevenDaysAgo) return false;
        } else if (activityDuration === 'past_30_days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < thirtyDaysAgo) return false;
        } else if (activityDuration === 'this_month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (itemDate < startOfMonth) return false;
        } else if (activityDuration === 'last_month') {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          if (itemDate < startOfLastMonth || itemDate > endOfLastMonth) return false;
        }
      }

      return true;
    });
  }, [allLabActivities, activitySearchQuery, activityCategoryFilter, activitySourceFilter, activityDuration]);

  // Compile Comprehensive Unified Lab Patient Profiles Directory
  const allLabPatients = React.useMemo(() => {
    const patientMap = new Map();

    const getOrCreatePatient = (patientObj, fallbackSource = 'Direct') => {
      if (!patientObj) return null;
      const rawUhid = patientObj.uhid ? String(patientObj.uhid).trim() : '';
      const rawMobile = patientObj.mobile ? String(patientObj.mobile).trim() : '';
      const rawName = patientObj.patientName ? String(patientObj.patientName).trim() : 'Patient';

      const key = rawUhid && rawUhid !== 'N/A'
        ? `uhid:${rawUhid.toLowerCase()}`
        : (rawMobile ? `mob:${rawMobile}_${rawName.toLowerCase()}` : `id:${patientObj._id || rawName.toLowerCase()}`);

      if (!patientMap.has(key)) {
        patientMap.set(key, {
          id: key,
          patientId: patientObj._id || null,
          patientName: rawName,
          uhid: rawUhid || 'N/A',
          age: patientObj.age || (patientObj.demographics?.age) || '',
          gender: patientObj.gender || (patientObj.demographics?.gender) || 'Male',
          mobile: rawMobile || patientObj.mobileNumber || 'N/A',
          guardianName: patientObj.guardianName || patientObj.fatherName || patientObj.demographics?.guardianName || '',
          address: patientObj.address || patientObj.demographics?.address || '',
          city: patientObj.city || patientObj.demographics?.city || '',
          bloodGroup: patientObj.bloodGroup || '',
          source: fallbackSource,
          latestVisitDate: null,
          testsSet: new Set(),
          requests: [],
          bills: [],
          totalBilledAmount: 0,
          totalPaidAmount: 0,
          totalDueAmount: 0,
          latestReportStatus: 'New'
        });
      }
      return patientMap.get(key);
    };

    // 1. Process all lab requests
    labRequests.forEach((req) => {
      const pObj = req.patientId;
      if (!pObj) return;

      let reqSource = 'OPD';
      if (req.remarks && req.remarks.toLowerCase().includes('ipd')) {
        reqSource = 'IPD';
      } else if (Array.isArray(req.statusHistory) && req.statusHistory.some(sh => sh.notes && sh.notes.toLowerCase().includes('ipd'))) {
        reqSource = 'IPD';
      } else if (req.doctorId?.department || (pObj && pObj.department)) {
        reqSource = 'OPD';
      } else {
        reqSource = 'Direct';
      }

      const pEntry = getOrCreatePatient(pObj, reqSource);
      if (!pEntry) return;

      pEntry.requests.push(req);
      pEntry.source = reqSource;

      // Extract tests
      if (Array.isArray(req.tests)) {
        req.tests.forEach(t => { if (t) pEntry.testsSet.add(t); });
      } else if (typeof req.tests === 'string' && req.tests) {
        pEntry.testsSet.add(req.tests);
      }

      const reqDate = req.createdAt ? new Date(req.createdAt) : (req.bookingDate ? new Date(req.bookingDate) : new Date());
      if (!pEntry.latestVisitDate || reqDate > pEntry.latestVisitDate) {
        pEntry.latestVisitDate = reqDate;
        pEntry.latestReportStatus = req.reportStatus || req.status || 'New';
      }
    });

    // 2. Process all lab bills
    labBills.forEach((bill) => {
      const pObj = bill.patientId;
      if (!pObj) return;

      const pEntry = getOrCreatePatient(pObj, 'Direct');
      if (!pEntry) return;

      pEntry.bills.push(bill);
      pEntry.totalBilledAmount += (bill.totalAmount || 0);
      pEntry.totalPaidAmount += (bill.paidAmount || 0);
      pEntry.totalDueAmount += (bill.dueAmount || 0);

      if (Array.isArray(bill.tests)) {
        bill.tests.forEach(t => {
          const tName = typeof t === 'string' ? t : (t.testName || t.name);
          if (tName) pEntry.testsSet.add(tName);
        });
      }

      const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date();
      if (!pEntry.latestVisitDate || billDate > pEntry.latestVisitDate) {
        pEntry.latestVisitDate = billDate;
      }
    });

    // 3. Process general registered patients if available
    registeredPatients.forEach((reg) => {
      const pObj = reg.patientId || reg;
      if (!pObj) return;
      getOrCreatePatient(pObj, reg.department || 'OPD');
    });

    // Convert map to array and finalize fields
    const list = Array.from(patientMap.values()).map(p => {
      const allTests = Array.from(p.testsSet);
      return {
        ...p,
        allTestsList: allTests,
        testsSummary: allTests.length > 0 ? allTests.join(', ') : 'Diagnostic Investigations',
        totalTestsCount: allTests.length,
        totalOrdersCount: p.requests.length,
        totalBillsCount: p.bills.length,
        latestVisitDate: p.latestVisitDate || new Date(),
        paymentStatus: p.totalDueAmount > 0 
          ? (p.totalPaidAmount > 0 ? 'Partial' : 'Unpaid')
          : (p.totalBilledAmount > 0 ? 'Paid' : 'Settled')
      };
    });

    // Default sort by latest visit
    return list.sort((a, b) => b.latestVisitDate.getTime() - a.latestVisitDate.getTime());
  }, [labRequests, labBills, registeredPatients]);

  // Filtered and Sorted Patients List
  const filteredLabPatients = React.useMemo(() => {
    let result = allLabPatients.filter(patient => {
      // 1. Search Query filter (Patient Name, UHID, Mobile, Address, Tests, Guardian)
      if (patientSearchQuery) {
        const q = patientSearchQuery.toLowerCase().trim();
        const matches = (
          patient.patientName.toLowerCase().includes(q) ||
          patient.uhid.toLowerCase().includes(q) ||
          patient.mobile.toLowerCase().includes(q) ||
          patient.guardianName.toLowerCase().includes(q) ||
          patient.address.toLowerCase().includes(q) ||
          patient.city.toLowerCase().includes(q) ||
          patient.testsSummary.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      // 2. Gender filter
      if (patientGenderFilter !== 'all') {
        const pGen = (patient.gender || '').toLowerCase();
        if (patientGenderFilter.toLowerCase() === 'male' && !pGen.startsWith('m')) return false;
        if (patientGenderFilter.toLowerCase() === 'female' && !pGen.startsWith('f')) return false;
      }

      // 3. Dues filter
      if (patientDuesFilter !== 'all') {
        if (patientDuesFilter === 'dues' && patient.totalDueAmount <= 0) return false;
        if (patientDuesFilter === 'paid' && patient.totalDueAmount > 0) return false;
      }

      // 4. Source filter
      if (patientSourceFilter !== 'all') {
        if (patient.source !== patientSourceFilter) return false;
      }

      return true;
    });

    // Sorting
    if (patientSortBy === 'name_asc') {
      result.sort((a, b) => a.patientName.localeCompare(b.patientName));
    } else if (patientSortBy === 'name_desc') {
      result.sort((a, b) => b.patientName.localeCompare(a.patientName));
    } else if (patientSortBy === 'most_tests') {
      result.sort((a, b) => b.totalTestsCount - a.totalTestsCount);
    } else if (patientSortBy === 'highest_due') {
      result.sort((a, b) => b.totalDueAmount - a.totalDueAmount);
    } else {
      // latest
      result.sort((a, b) => b.latestVisitDate.getTime() - a.latestVisitDate.getTime());
    }

    return result;
  }, [allLabPatients, patientSearchQuery, patientGenderFilter, patientDuesFilter, patientSourceFilter, patientSortBy]);

  // Filtered Referral Doctors List
  const filteredReferralDoctors = React.useMemo(() => {
    if (!refDocSearchQuery) return referralDoctors;
    const q = refDocSearchQuery.toLowerCase().trim();
    return referralDoctors.filter(doc => (
      doc.name.toLowerCase().includes(q) ||
      (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
      (doc.hospital && doc.hospital.toLowerCase().includes(q)) ||
      (doc.phone && doc.phone.includes(q)) ||
      (doc.codeId && doc.codeId.includes(q))
    ));
  }, [referralDoctors, refDocSearchQuery]);

  // Filtered Collection Centres List
  const filteredCollectionCentres = React.useMemo(() => {
    if (!centreSearchQuery) return collectionCentresList;
    const q = centreSearchQuery.toLowerCase().trim();
    return collectionCentresList.filter(c => (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.incharge && c.incharge.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    ));
  }, [collectionCentresList, centreSearchQuery]);

  // Daily Business Data Computation (Exact Reference Layout Match)
  const dailyBusinessData = React.useMemo(() => {
    const targetDateStr = dailyBusinessDate; // 'YYYY-MM-DD'
    const dayTransactions = [];
    const dayBills = [];

    labBills.forEach((bill, billIdx) => {
      const bDate = bill.createdAt ? new Date(bill.createdAt) : new Date();
      const bDateStr = bDate.toISOString().split('T')[0];
      const isDateMatch = !targetDateStr || bDateStr === targetDateStr;

      if (isDateMatch || showPrevDayBills) {
        dayBills.push(bill);

        const pName = bill.patientId?.patientName || 'Patient';
        const regNo = bill.labId ? (bill.labId.startsWith('#') ? bill.labId : `#${bill.labId}`) : `#${1300 + billIdx}`;
        let refBy = bill.referredBy || 'Self';
        if (bill.remarks?.includes('Referred by:')) {
          refBy = bill.remarks.split('Referred by:')[1].trim();
        }
        const timeStr = bDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = bDate.toLocaleDateString('en-GB');
        const dcn = `L${billIdx + 1}`;
        const cc = bill.collectionCentre ? (bill.collectionCentre.length > 10 ? bill.collectionCentre.slice(0, 10) : bill.collectionCentre) : 'Main';
        const receivedBy = bill.receivedBy || cashiersList[0] || 'Ravi Shukla';
        const method = (bill.paymentMode || 'cash').toLowerCase();

        // 1. Initial payment transaction
        if ((bill.paidAmount || 0) > 0) {
          dayTransactions.push({
            id: String(39414000 + billIdx * 7 + 1),
            regNo,
            patientName: pName,
            referredBy: refBy,
            date: dateStr,
            time: timeStr,
            dcn,
            cc,
            amount: bill.paidAmount || 0,
            method,
            receivedBy,
            rawBill: bill,
            rawDate: bDate
          });
        }

        // 2. Extra payment history items if any
        if (Array.isArray(bill.paymentHistory)) {
          bill.paymentHistory.forEach((ph, pIdx) => {
            const phDate = ph.date ? new Date(ph.date) : bDate;
            const phDateStr = phDate.toISOString().split('T')[0];
            if (!targetDateStr || phDateStr === targetDateStr || showPrevDayBills) {
              dayTransactions.push({
                id: String(39414500 + billIdx * 10 + pIdx),
                regNo,
                patientName: pName,
                referredBy: refBy,
                date: phDate.toLocaleDateString('en-GB'),
                time: phDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                dcn,
                cc,
                amount: ph.amount || 0,
                method: (ph.mode || ph.paymentMode || 'cash').toLowerCase(),
                receivedBy: ph.receivedBy || receivedBy,
                rawBill: bill,
                rawDate: phDate
              });
            }
          });
        }
      }
    });

    // Compute Income Totals
    const totalIncome = dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const cashIncome = dayTransactions.filter(t => t.method.includes('cash')).reduce((sum, t) => sum + (t.amount || 0), 0);
    const cardIncome = dayTransactions.filter(t => t.method.includes('card')).reduce((sum, t) => sum + (t.amount || 0), 0);
    const upiIncome = dayTransactions.filter(t => t.method.includes('upi') || t.method.includes('online') || t.method.includes('gpay')).reduce((sum, t) => sum + (t.amount || 0), 0);
    const insuranceIncome = dayTransactions.filter(t => t.method.includes('insur') || t.method.includes('tpa')).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Expenses for this date
    const dayExpenses = labExpensesList.filter(e => !targetDateStr || e.date === targetDateStr);
    const totalExpenses = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netIncome = totalIncome - totalExpenses;

    // Filter transactions by search and cashier
    let filteredTransactions = [...dayTransactions];
    if (dailyBusinessCashier !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.receivedBy.toLowerCase() === dailyBusinessCashier.toLowerCase());
    }
    if (dailyBusinessSearch) {
      const q = dailyBusinessSearch.toLowerCase().trim();
      filteredTransactions = filteredTransactions.filter(t => (
        t.patientName.toLowerCase().includes(q) ||
        t.regNo.toLowerCase().includes(q) ||
        t.id.includes(q) ||
        t.referredBy.toLowerCase().includes(q) ||
        t.method.toLowerCase().includes(q) ||
        t.receivedBy.toLowerCase().includes(q) ||
        t.cc.toLowerCase().includes(q)
      ));
    }

    return {
      dayTransactions,
      filteredTransactions,
      dayBills,
      dayExpenses,
      totalIncome,
      cashIncome,
      cardIncome,
      upiIncome,
      insuranceIncome,
      totalExpenses,
      netIncome
    };
  }, [labBills, dailyBusinessDate, showPrevDayBills, dailyBusinessCashier, dailyBusinessSearch, labExpensesList, cashiersList]);

  const availableReferrers = Array.from(new Set(rawReportsList.map(r => r.referredBy).filter(Boolean)));

  const handleOpenProcessRequest = (reqItem) => {
    setSelectedRequest(reqItem);
    const currentSigId = reqItem.report?.signatoryId?._id || reqItem.report?.signatoryId || (signatories.length > 0 ? signatories[0]._id : '');
    setSelectedSignatoryId(currentSigId);
    setReportRemarks(reqItem.report?.remarks || '');
    setReportNotes(reqItem.report?.notes || '');
    setReportAdvice(reqItem.report?.advice || '');
    setReportInterpretation(reqItem.report?.interpretation || '');
    setShowReportEntryTab('');
    setSelectedReportTestFilter('all');
    setIsEditLayoutMode(false);
    setSkippedParameters({});
    setCustomFieldDisplayNames({});
    setPrintInterpretation(reqItem.report?.printInterpretation !== false);

    const initialParams = {};
    const initialRemarks = {};
    const testNames = Array.isArray(reqItem.tests) 
      ? reqItem.tests 
      : (typeof reqItem.tests === 'string' 
          ? reqItem.tests.split(',').map(t => t.trim()) 
          : []);
    
    const normalizeString = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    let defaultInterpretation = '';

    testNames.forEach(tName => {
      const tNameNorm = normalizeString(tName);
      const matchedTest = findMatchedTest(tName);

      if (matchedTest) {
        if (matchedTest.interpretation) {
          defaultInterpretation = matchedTest.interpretation;
        }

        if (matchedTest && Array.isArray(matchedTest.parameters)) {
          matchedTest.parameters.forEach(p => {
            const existingParam = reqItem.report?.parameters?.find(ep => ep.name === p.name);
            initialParams[p.name] = existingParam ? existingParam.value : '';
            initialRemarks[p.name] = existingParam ? (existingParam.remarks || '') : '';
          });
        }
      }
    });

    setReportInterpretation(reqItem.report?.interpretation || defaultInterpretation || '');

    if (Array.isArray(reqItem.report?.parameters)) {
      reqItem.report.parameters.forEach(p => {
        if (!initialParams[p.name]) {
          initialParams[p.name] = p.value || '';
        }
        if (!initialRemarks[p.name]) {
          initialRemarks[p.name] = p.remarks || '';
        }
      });
    }

    // Initialize Widal matrix data if Widal test is present
    const widalTestName = testNames.find(t => normalizeString(t).includes('widal'));
    if (widalTestName) {
      const isTube = normalizeString(widalTestName).includes('tube');
      const defaultGrid = getWidalDefaultGrid(widalTestName);
      if (!initialParams['widal_matrix_json']) {
        initialParams['widal_matrix_json'] = JSON.stringify(defaultGrid);
      }
      if (!initialParams['widal_comment']) {
        initialParams['widal_comment'] = initialParams['Result'] || initialParams['Comment'] || 'POSITIVE';
      }
      const typhiDefault = isTube ? '1:120 (+)' : '1:80 (+)';
      const paratyphiDefault = isTube ? '1:60 (+)' : '1:40 (+)';
      if (!initialParams['S TYPHI "O"'] && !initialParams["Salmonella Typhi 'O'"]) {
        initialParams['S TYPHI "O"'] = typhiDefault;
        initialParams["Salmonella Typhi 'O'"] = typhiDefault;
      }
      if (!initialParams['S TYPHI "H"'] && !initialParams["Salmonella Typhi 'H'"]) {
        initialParams['S TYPHI "H"'] = typhiDefault;
        initialParams["Salmonella Typhi 'H'"] = typhiDefault;
      }
      if (!initialParams['S PARATYPHI "AH"'] && !initialParams["Salmonella Typhi 'AH'"]) {
        initialParams['S PARATYPHI "AH"'] = paratyphiDefault;
        initialParams["Salmonella Typhi 'AH'"] = paratyphiDefault;
      }
      if (!initialParams['S PARATYPHI "BH"'] && !initialParams["Salmonella Typhi 'BH'"]) {
        initialParams['S PARATYPHI "BH"'] = paratyphiDefault;
        initialParams["Salmonella Typhi 'BH'"] = paratyphiDefault;
      }
      if (!initialParams['Result']) {
        initialParams['Result'] = 'WIDAL TEST POSITIVE';
      }
    }

    const reqDate = reqItem.createdAt ? new Date(reqItem.createdAt) : new Date();
    const formatD = (d) => d.toISOString().split('T')[0];
    const formatT = (d) => d.toTimeString().slice(0, 5);

    setDatesInfo({
      collectedDate: reqItem.report?.collectedDate ? formatD(new Date(reqItem.report.collectedDate)) : formatD(reqDate),
      collectedTime: reqItem.report?.collectedTime || formatT(reqDate),
      receivedDate: reqItem.report?.receivedDate ? formatD(new Date(reqItem.report.receivedDate)) : formatD(reqDate),
      receivedTime: reqItem.report?.receivedTime || formatT(reqDate),
      reportedDate: reqItem.report?.reportedDate ? formatD(new Date(reqItem.report.reportedDate)) : formatD(reqDate),
      reportedTime: reqItem.report?.reportedTime || formatT(reqDate)
    });

    setParameterValues(initialParams);
    setParameterRemarks(initialRemarks);
    
    const initialExpanded = {};
    Object.entries(initialRemarks).forEach(([pName, pRem]) => {
      if (pRem) initialExpanded[pName] = true;
    });
    setExpandedRemarks(initialExpanded);

    setShowReportEntryView(true);
    setShowProcessModal(false);
  };

  const handleWidalCellUpdate = (antigen, dilution, val, testName = '') => {
    const currentGrid = getWidalGridFromParams(parameterValues, testName);
    const updatedGrid = {
      ...currentGrid,
      [antigen]: {
        ...(currentGrid[antigen] || {}),
        [dilution]: val
      }
    };
    const jsonStr = JSON.stringify(updatedGrid);

    // Calculate summary value for this antigen
    const dilutionsList = getWidalDilutions(testName);
    const posDils = dilutionsList.filter(d => (updatedGrid[antigen]?.[d] || '').includes('+'));
    const highestTiter = posDils.length > 0 ? posDils[posDils.length - 1] : 'Non-Reactive';
    const displayVal = highestTiter !== 'Non-Reactive' 
      ? (highestTiter.startsWith('1:') ? `${highestTiter} (+)` : `1:${highestTiter.replace('1/', '')} (+)`) 
      : 'Non-Reactive';

    const shortAntigen = antigen.replace('S TYPHI ', '').replace('S PARATYPHI ', '').replace(/"/g, '');
    const longName = `Salmonella Typhi '${shortAntigen}'`;

    setParameterValues(prev => ({
      ...prev,
      widal_matrix_json: jsonStr,
      [antigen]: displayVal,
      [longName]: displayVal
    }));
  };

  const handleWidalCommentUpdate = (commentVal) => {
    const cleanVal = String(commentVal || '').replace(/^WIDAL TEST\s*/i, '').trim();
    setParameterValues(prev => ({
      ...prev,
      widal_comment: cleanVal,
      Result: `WIDAL TEST ${cleanVal}`
    }));
  };

  const handleToggleBold = (paramName) => {
    const el = document.getElementById(`morphology-editor-${paramName}`);
    const currentVal = parameterValues[paramName] || '';
    if (!el) {
      handleParamValueChange(paramName, currentVal ? `${currentVal} <b></b>` : '<b></b>');
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start !== undefined && end !== undefined && start !== end) {
      const selected = currentVal.substring(start, end);
      const before = currentVal.substring(0, start);
      const after = currentVal.substring(end);
      const isBold = (selected.startsWith('<b>') && selected.endsWith('</b>')) || (selected.startsWith('**') && selected.endsWith('**'));
      const unwrapped = isBold 
        ? (selected.startsWith('<b>') ? selected.slice(3, -4) : selected.slice(2, -2))
        : `<b>${selected}</b>`;
      handleParamValueChange(paramName, before + unwrapped + after);
    } else {
      handleParamValueChange(paramName, currentVal ? `${currentVal} <b>bold text</b>` : '<b>bold text</b>');
    }
  };

  const handleSaveMorphologyAsDefault = (paramName) => {
    const val = parameterValues[paramName] || '';
    if (!val.trim()) {
      showToast('Please enter some text before saving as default template.', 'info');
      return;
    }
    try {
      localStorage.setItem(`lab_morphology_default_${paramName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, val);
      showToast(`Default template saved for ${paramName}!`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const getParamFormula = (paramName, testParamObj) => {
    if (testParamObj?.formula) return testParamObj.formula;
    const name = String(paramName || '').trim().toLowerCase();
    const group = String(testParamObj?.group || '').trim().toLowerCase();
    
    // MCV
    if (name.includes('mean corpuscular volume') || name === 'mcv') {
      return 'Formula: MCV = (Hct * 10) / RBC in millions';
    }
    // MCH
    if ((name.includes('mean cell haemoglobin') || name.includes('mean cell hemoglobin')) && !name.includes('mchc') && !name.includes('con')) {
      return 'Formula: MCH = (Hb * 10) / RBC in millions';
    }
    // MCHC
    if (name.includes('mchc') || name.includes('mean cell haemoglobin con') || name.includes('mean cell hemoglobin con')) {
      return 'Formula: MCHC = (Hb * 100) / Hct';
    }
    // Absolute Counts
    if (name.includes('absolute neutrophil') || (name.includes('neutrophil') && (name.includes('absolute') || group.includes('absolute')))) {
      return 'Formula: (TLC * Neutrophil percent / 1000)';
    }
    if (name.includes('absolute lymphocyte') || (name.includes('lymphocyte') && (name.includes('absolute') || group.includes('absolute')))) {
      return 'Formula: (TLC * Lymphocyte percent / 1000)';
    }
    if (name.includes('absolute eosinophil') || (name.includes('eosinophil') && (name.includes('absolute') || group.includes('absolute')))) {
      return 'Formula: (TLC * Eosinophils percent / 1000)';
    }
    if (name.includes('absolute monocyte') || (name.includes('monocyte') && (name.includes('absolute') || group.includes('absolute')))) {
      return 'Formula: (TLC * Monocytes percent / 1000)';
    }
    if (name.includes('absolute basophil') || (name.includes('basophil') && (name.includes('absolute') || group.includes('absolute')))) {
      return 'Formula: (TLC * Basophils percent / 1000)';
    }
    // NLR
    if (name.includes('neutrophil lymphocyte ratio') || name === 'nlr') {
      return 'Formula: Neutrophil Lymphocyte Ratio (NLR) = Absolute Neutrophil count / absolute Lymphocyte count';
    }
    // INR
    if (name.includes('inr') || name.includes('international normalized ratio')) {
      return 'Formula: INR = (Patient PT / Control PT)^ISI';
    }
    // LFT Formulas
    if (name.includes('bilirubin') && (name.includes('indirect') || name.includes('unconjugated'))) {
      return 'Formula: Serum Bilirubin (Indirect) = Serum Bilirubin (Total) - Serum Bilirubin (Direct)';
    }
    if ((name.includes('sgot') && name.includes('sgpt')) || name.includes('ast/alt') || name.includes('sgot/sgpt')) {
      return 'Formula: SGOT/SGPT = SGOT (AST) / SGPT (ALT)';
    }
    if (name === 'globulin' || (name.includes('globulin') && !name.includes('ratio') && !name.includes('a/g'))) {
      return 'Formula: Globulin = Serum Protein - Serum Albumin';
    }
    if (name.includes('a/g ratio') || name.includes('albumin/globulin') || name === 'a/g') {
      return 'Formula: A/G Ratio = Serum Albumin / Globulin';
    }
    // KFT Formulas
    if (name === 'bun' || (name.includes('blood urea nitrogen') && !name.includes('ratio')) || (name.includes('bun') && !name.includes('ratio') && !name.includes('creatinine'))) {
      return 'Formula: BUN = Serum Urea × 0.466';
    }
    if (name.includes('urea') && name.includes('creatinine') && name.includes('ratio') && !name.includes('bun')) {
      return 'Formula: Urea/Creatinine Ratio = Serum Urea / Serum Creatinine';
    }
    if (name.includes('bun') && name.includes('creatinine') && name.includes('ratio')) {
      return 'Formula: BUN/Creatinine Ratio = BUN / Serum Creatinine';
    }
    if (name === 'egfr' || (name.includes('egfr') && !name.includes('category'))) {
      return 'Formula: eGFR = CKD-EPI(Serum Creatinine, Age, Sex)';
    }
    if (name.includes('egfr') && name.includes('category')) {
      return 'Formula: eGFR Category = Category based on eGFR result';
    }
    // Iron Studies Formulas
    if (name === 'uibc' || (name.includes('uibc') && !name.includes('tibc'))) {
      return 'Formula: UIBC = TIBC − Serum Iron';
    }
    if (name.includes('transferrin saturation') || name === 'tsat' || name.includes('transferrin sat')) {
      return 'Formula: Transferrin Saturation (%) = (Serum Iron ÷ TIBC) × 100';
    }
    // RBC Indices Formulas
    if (name === 'mcv' || (name.includes('mcv') && !name.includes('mch'))) {
      return 'Formula: MCV (fL) = (Hematocrit % × 10) ÷ RBC Count';
    }
    if (name === 'mch' || (name.includes('mch') && !name.includes('mchc') && !name.includes('mcv'))) {
      return 'Formula: MCH (pg) = (Hemoglobin × 10) ÷ RBC Count';
    }
    if (name === 'mchc' || name.includes('mchc')) {
      return 'Formula: MCHC (g/dL) = (Hemoglobin ÷ Hematocrit %) × 100';
    }
    // UPCR Formula
    if (name.includes('urine protein') && name.includes('creatinine') && name.includes('ratio')) {
      return 'Formula: Urine Protein Creatinine Ratio = Urine for Protein ÷ Urine for creatinine';
    }
    return '';
  };

  const handleParamValueChange = (paramName, val) => {
    const updated = {
      ...parameterValues,
      [paramName]: val
    };

    // Helper to find numeric value by parameter name keywords
    const getNumVal = (keywords, excludeKeywords = []) => {
      for (const [k, v] of Object.entries(updated)) {
        const kLower = k.trim().toLowerCase();
        if (excludeKeywords.some(ex => kLower.includes(ex.toLowerCase()))) continue;
        if (keywords.some(kw => kLower === kw.toLowerCase() || kLower.includes(kw.toLowerCase()))) {
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            const parsed = parseFloat(String(v).replace(/,/g, ''));
            if (!isNaN(parsed) && parsed >= 0) return parsed;
          }
        }
      }
      return null;
    };

    // Helper to find parameter key
    const findKey = (keywords, excludeKeywords = []) => {
      return Object.keys(updated).find(k => {
        const kl = k.trim().toLowerCase();
        if (excludeKeywords.some(ex => kl.includes(ex.toLowerCase()))) return false;
        return keywords.some(kw => kl === kw.toLowerCase() || kl.includes(kw.toLowerCase()));
      });
    };

    const hbVal = getNumVal(['Hemoglobin', 'Hb', 'Haemoglobin']);
    const rbcVal = getNumVal(['Total RBC Count', 'RBC Count', 'Total RBC', 'RBC']);
    const hctVal = getNumVal(['Hematocrit Value, Hct', 'Hematocrit Value', 'Hematocrit', 'Hct', 'PCV']);
    const tlcVal = getNumVal(['Total Leukocyte Count', 'TLC', 'Total WBC', 'WBC Count']);

    const neutPercent = getNumVal(['Neutrophils', 'Neutrophil'], ['absolute', 'ratio', 'nlr']);
    const lymphPercent = getNumVal(['Lymphocyte', 'Lymphocytes'], ['absolute', 'ratio', 'nlr']);
    const eosPercent = getNumVal(['Eosinophils', 'Eosinophil'], ['absolute', 'ratio', 'nlr']);
    const monoPercent = getNumVal(['Monocytes', 'Monocyte'], ['absolute', 'ratio', 'nlr']);
    const basoPercent = getNumVal(['Basophils', 'Basophil'], ['absolute', 'ratio', 'nlr']);

    // MCV = (Hct * 10) / RBC in millions
    const mcvKey = findKey(['mean corpuscular volume', 'mcv']);
    if (mcvKey && paramName !== mcvKey) {
      if (hctVal !== null && rbcVal !== null && rbcVal > 0) {
        const calculated = ((hctVal * 10) / rbcVal).toFixed(1);
        updated[mcvKey] = String(calculated);
      }
    }

    // MCH = (Hb * 10) / RBC in millions
    const mchKey = findKey(['mean cell haemoglobin', 'mean cell hemoglobin', 'mch'], ['mchc', 'con']);
    if (mchKey && paramName !== mchKey) {
      if (hbVal !== null && rbcVal !== null && rbcVal > 0) {
        const calculated = ((hbVal * 10) / rbcVal).toFixed(1);
        updated[mchKey] = String(calculated);
      }
    }

    // MCHC = (Hb * 100) / Hct
    const mchcKey = findKey(['mchc', 'mean cell haemoglobin con', 'mean cell hemoglobin con']);
    if (mchcKey && paramName !== mchcKey) {
      if (hbVal !== null && hctVal !== null && hctVal > 0) {
        const calculated = ((hbVal * 100) / hctVal).toFixed(1);
        updated[mchcKey] = String(calculated);
      }
    }

    // Absolute counts: (TLC * percent / 1000) or if TLC in full units (>= 100): TLC * percent / 100000
    if (tlcVal !== null && tlcVal > 0) {
      const tlcBase = tlcVal >= 100 ? tlcVal / 1000 : tlcVal; // Normalize TLC to thousands (e.g. 8000 -> 8.0)

      // Absolute Neutrophils
      const absNeutKey = findKey(['absolute neutrophils', 'absolute neutrophil']);
      if (absNeutKey && paramName !== absNeutKey && neutPercent !== null) {
        const calculated = ((tlcBase * neutPercent) / 100).toFixed(2);
        updated[absNeutKey] = String(calculated);
      }

      // Absolute Lymphocytes
      const absLymphKey = findKey(['absolute lymphocytes', 'absolute lymphocyte']);
      if (absLymphKey && paramName !== absLymphKey && lymphPercent !== null) {
        const calculated = ((tlcBase * lymphPercent) / 100).toFixed(2);
        updated[absLymphKey] = String(calculated);
      }

      // Absolute Eosinophils
      const absEosKey = findKey(['absolute eosinophils', 'absolute eosinophil']);
      if (absEosKey && paramName !== absEosKey && eosPercent !== null) {
        const calculated = ((tlcBase * eosPercent) / 100).toFixed(2);
        updated[absEosKey] = String(calculated);
      }

      // Absolute Monocytes
      const absMonoKey = findKey(['absolute monocytes', 'absolute monocyte']);
      if (absMonoKey && paramName !== absMonoKey && monoPercent !== null) {
        const calculated = ((tlcBase * monoPercent) / 100).toFixed(2);
        updated[absMonoKey] = String(calculated);
      }

      // Absolute Basophils
      const absBasoKey = findKey(['absolute basophils', 'absolute basophil']);
      if (absBasoKey && paramName !== absBasoKey && basoPercent !== null) {
        const calculated = ((tlcBase * basoPercent) / 100).toFixed(2);
        updated[absBasoKey] = String(calculated);
      }
    }

    // Neutrophil Lymphocyte Ratio (NLR)
    const nlrKey = findKey(['neutrophil lymphocyte ratio', 'nlr']);
    if (nlrKey && paramName !== nlrKey) {
      let absN = getNumVal(['absolute neutrophil', 'absolute neutrophils']);
      let absL = getNumVal(['absolute lymphocyte', 'absolute lymphocytes']);
      if ((absN === null || absL === null || absL === 0) && neutPercent !== null && lymphPercent !== null && lymphPercent > 0) {
        absN = neutPercent;
        absL = lymphPercent;
      }
      if (absN !== null && absL !== null && absL > 0) {
        const calculated = (absN / absL).toFixed(2);
        updated[nlrKey] = String(calculated);
      }
    }

    // INR Calculation: INR = (Patient PT / Control PT)^ISI
    const inrKey = findKey(['inr value', 'inr']);
    if (inrKey && paramName !== inrKey) {
      const ptPatientVal = getNumVal(['pt patient', 'prothrombin time patient', 'patient pt', 'patient value']);
      const ptControlVal = getNumVal(['pt control', 'prothrombin time control', 'control pt', 'control value']);
      const isiVal = getNumVal(['isi', 'international sensitivity index']);

      if (ptPatientVal !== null && ptControlVal !== null && ptControlVal > 0) {
        const isi = (isiVal !== null && isiVal > 0) ? isiVal : 1.0;
        const calculatedInr = Math.pow(ptPatientVal / ptControlVal, isi).toFixed(2);
        updated[inrKey] = String(calculatedInr);
      }
    }

    // Serum Bilirubin (Indirect) = Serum Bilirubin (Total) - Serum Bilirubin (Direct)
    const indirectBilirubinKey = findKey(['serum bilirubin (indirect)', 'indirect bilirubin', 'bilirubin (indirect)']);
    if (indirectBilirubinKey && paramName !== indirectBilirubinKey) {
      const totalBilirubin = getNumVal(['serum bilirubin (total)', 'total bilirubin', 'bilirubin total']);
      const directBilirubin = getNumVal(['serum bilirubin (direct)', 'direct bilirubin', 'bilirubin direct']);
      if (totalBilirubin !== null && directBilirubin !== null) {
        const calculated = Math.max(0, totalBilirubin - directBilirubin).toFixed(2);
        updated[indirectBilirubinKey] = String(calculated);
      }
    }

    // SGOT/SGPT = SGOT (AST) / SGPT (ALT)
    const sgotSgptKey = findKey(['sgot/sgpt', 'ast/alt', 'sgot / sgpt']);
    if (sgotSgptKey && paramName !== sgotSgptKey) {
      const sgot = getNumVal(['sgot (ast)', 'sgot', 'ast']);
      const sgpt = getNumVal(['sgpt (alt)', 'sgpt', 'alt']);
      if (sgot !== null && sgpt !== null && sgpt > 0) {
        const calculated = (sgot / sgpt).toFixed(2);
        updated[sgotSgptKey] = String(calculated);
      }
    }

    // Globulin = Serum Protein - Serum Albumin
    const globulinKey = findKey(['globulin'], ['ratio', 'a/g']);
    if (globulinKey && paramName !== globulinKey) {
      const totalProtein = getNumVal(['serum protein', 'total protein', 'protein']);
      const albumin = getNumVal(['serum albumin', 'albumin'], ['ratio', 'a/g']);
      if (totalProtein !== null && albumin !== null) {
        const calculated = Math.max(0, totalProtein - albumin).toFixed(2);
        updated[globulinKey] = String(calculated);
      }
    }

    // A/G Ratio = Serum Albumin / Globulin
    const agRatioKey = findKey(['a/g ratio', 'albumin globulin ratio', 'a/g']);
    if (agRatioKey && paramName !== agRatioKey) {
      const albumin = getNumVal(['serum albumin', 'albumin'], ['ratio', 'a/g']);
      let globulin = getNumVal(['globulin'], ['ratio', 'a/g']);
      if (globulin === null) {
        const totalProtein = getNumVal(['serum protein', 'total protein', 'protein']);
        if (totalProtein !== null && albumin !== null) {
          globulin = totalProtein - albumin;
        }
      }
      if (albumin !== null && globulin !== null && globulin > 0) {
        const calculated = (albumin / globulin).toFixed(2);
        updated[agRatioKey] = String(calculated);
      }
    }

    // 1. BUN = Serum Urea * 0.466
    const bunKey = findKey(['bun', 'blood urea nitrogen'], ['ratio', 'creatinine']);
    const ureaVal = getNumVal(['serum urea', 'urea'], ['ratio', 'bun', 'creatinine']);
    const creatVal = getNumVal(['serum creatinine', 'creatinine'], ['ratio', 'urea', 'bun']);

    let currentBunVal = getNumVal(['bun', 'blood urea nitrogen'], ['ratio', 'creatinine']);
    if (bunKey && paramName !== bunKey) {
      if (ureaVal !== null && ureaVal >= 0) {
        const calculatedBun = (ureaVal * 0.466).toFixed(1);
        updated[bunKey] = String(calculatedBun);
        currentBunVal = parseFloat(calculatedBun);
      }
    }

    // 2. Urea / Creatinine Ratio = Serum Urea / Serum Creatinine
    const ureaCreatRatioKey = findKey(['urea / creatinine ratio', 'urea/creatinine ratio', 'urea creatinine ratio'], ['bun']);
    if (ureaCreatRatioKey && paramName !== ureaCreatRatioKey) {
      if (ureaVal !== null && creatVal !== null && creatVal > 0) {
        const calculated = (ureaVal / creatVal).toFixed(2);
        updated[ureaCreatRatioKey] = String(calculated);
      }
    }

    // 3. BUN / Creatinine Ratio = BUN / Serum Creatinine
    const bunCreatRatioKey = findKey(['bun / creatinine ratio', 'bun/creatinine ratio', 'bun creatinine ratio']);
    if (bunCreatRatioKey && paramName !== bunCreatRatioKey) {
      const activeBun = currentBunVal !== null ? currentBunVal : (ureaVal !== null ? ureaVal * 0.466 : null);
      if (activeBun !== null && creatVal !== null && creatVal > 0) {
        const calculated = (activeBun / creatVal).toFixed(2);
        updated[bunCreatRatioKey] = String(calculated);
      }
    }

    // 4. eGFR = CKD-EPI(Serum Creatinine, Age, Sex)
    const egfrKey = findKey(['egfr'], ['category']);
    const egfrCategoryKey = findKey(['egfr category', 'egfr stage']);
    if (creatVal !== null && creatVal > 0) {
      let patientAge = 45;
      let patientGender = 'Male';

      const rawAge = selectedRequest?.patientId?.age || selectedRequest?.patientAge;
      if (rawAge) {
        const parsedAge = parseInt(String(rawAge).replace(/\D/g, ''), 10);
        if (!isNaN(parsedAge) && parsedAge > 0 && parsedAge < 125) {
          patientAge = parsedAge;
        }
      }

      const rawGender = selectedRequest?.patientId?.gender || selectedRequest?.patientGender;
      if (rawGender && String(rawGender).toLowerCase().startsWith('f')) {
        patientGender = 'Female';
      }

      const isFemale = patientGender === 'Female';
      const kappa = isFemale ? 0.7 : 0.9;
      const alpha = isFemale ? -0.241 : -0.302;
      const genderMult = isFemale ? 1.012 : 1.0;
      const scr = creatVal;

      // CKD-EPI 2021 Formula
      const egfrValue = 142 * Math.pow(Math.min(scr / kappa, 1), alpha) * Math.pow(Math.max(scr / kappa, 1), -1.200) * Math.pow(0.9938, patientAge) * genderMult;
      const roundedEgfr = Math.round(egfrValue);

      if (egfrKey && paramName !== egfrKey) {
        updated[egfrKey] = String(roundedEgfr);
      }

      // 5. eGFR Category based on eGFR value
      if (egfrCategoryKey && paramName !== egfrCategoryKey) {
        let catStr = '';
        if (roundedEgfr >= 90) {
          catStr = 'G1 (Normal or high: >= 90)';
        } else if (roundedEgfr >= 60) {
          catStr = 'G2 (Mildly decreased: 60-89)';
        } else if (roundedEgfr >= 45) {
          catStr = 'G3a (Mildly to moderately decreased: 45-59)';
        } else if (roundedEgfr >= 30) {
          catStr = 'G3b (Moderately to severely decreased: 30-44)';
        } else if (roundedEgfr >= 15) {
          catStr = 'G4 (Severely decreased: 15-29)';
        } else {
          catStr = 'G5 (Kidney failure: < 15)';
        }
        updated[egfrCategoryKey] = catStr;
      }
    }

    // Iron Studies Calculations
    // 1. UIBC = TIBC - Iron
    const uibcKey = findKey(['uibc'], ['tibc']);
    const tibcVal = getNumVal(['total iron binding capacity', 'tibc'], ['uibc']);
    const ironVal = getNumVal(['iron', 'serum iron'], ['tibc', 'uibc', 'binding', 'saturation']);

    if (uibcKey && paramName !== uibcKey) {
      if (tibcVal !== null && ironVal !== null) {
        const calculated = Math.max(0, tibcVal - ironVal).toFixed(1);
        updated[uibcKey] = String(calculated);
      }
    }

    // 2. Transferrin Saturation (%) = (Iron / TIBC) * 100
    const tsatKey = findKey(['transferrin saturation', 'transferrin sat', 'tsat']);
    if (tsatKey && paramName !== tsatKey) {
      if (ironVal !== null && tibcVal !== null && tibcVal > 0) {
        const calculated = ((ironVal / tibcVal) * 100).toFixed(1);
        updated[tsatKey] = String(calculated);
      }
    }

    // RBC Indices Calculations (MCV, MCH, MCHC)
    const hbVal = getNumVal(['hemoglobin (hb)', 'hemoglobin', 'hb'], ['ratio', 'binding']);
    const rbcVal = getNumVal(['rbc count', 'rbc', 'total rbc count'], ['ratio', 'morphology']);
    const pcvVal = getNumVal(['hematocrit (pcv)', 'hematocrit', 'pcv'], ['ratio']);

    const mcvKey = findKey(['mcv', 'mean corpuscular volume'], ['mch', 'mchc']);
    if (mcvKey && paramName !== mcvKey) {
      if (pcvVal !== null && rbcVal !== null && rbcVal > 0) {
        const calculated = ((pcvVal * 10) / rbcVal).toFixed(1);
        updated[mcvKey] = String(calculated);
      }
    }

    const mchKey = findKey(['mch', 'mean corpuscular hemoglobin'], ['mchc', 'mcv']);
    if (mchKey && paramName !== mchKey) {
      if (hbVal !== null && rbcVal !== null && rbcVal > 0) {
        const calculated = ((hbVal * 10) / rbcVal).toFixed(1);
        updated[mchKey] = String(calculated);
      }
    }

    const mchcKey = findKey(['mchc', 'mean corpuscular hemoglobin concentration'], ['mcv', 'mch ']);
    if (mchcKey && paramName !== mchcKey) {
      if (hbVal !== null && pcvVal !== null && pcvVal > 0) {
        const calculated = ((hbVal / pcvVal) * 100).toFixed(1);
        updated[mchcKey] = String(calculated);
      }
    }

    // UPCR: Urine Protein Creatinine Ratio = Urine for Protein / Urine for creatinine
    const upcrKey = findKey(['urine protein creatinine ratio', 'urine protein/creatinine ratio', 'upcr']);
    if (upcrKey && paramName !== upcrKey) {
      const uProt = getNumVal(['urine for protein', 'urine protein'], ['ratio', 'creatinine']);
      const uCreat = getNumVal(['urine for creatinine', 'urine creatinine'], ['ratio', 'protein']);
      if (uProt !== null && uCreat !== null && uCreat > 0) {
        const calculated = (uProt / uCreat).toFixed(2);
        updated[upcrKey] = String(calculated);
      }
    }

    setParameterValues(updated);
  };

  const handleSaveReport = async (statusToSet = 'completed') => {
    if (!selectedRequest) return;
    setSavingReport(true);
    try {
      const testNames = Array.isArray(selectedRequest.tests) 
        ? selectedRequest.tests 
        : (typeof selectedRequest.tests === 'string' 
            ? selectedRequest.tests.split(',').map(t => t.trim()) 
            : []);

      const normalizeString = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const widalTestName = testNames.find(t => normalizeString(t).includes('widal'));

      const activeParamValues = { ...parameterValues };

      // Ensure Widal test parameters are populated if it's a Widal test
      if (widalTestName) {
        const isTube = normalizeString(widalTestName).includes('tube');
        const grid = getWidalGridFromParams(activeParamValues, widalTestName);
        const comment = activeParamValues['widal_comment'] || 'POSITIVE';
        activeParamValues['widal_matrix_json'] = JSON.stringify(grid);
        activeParamValues['widal_comment'] = comment;
        activeParamValues['Result'] = `WIDAL TEST ${comment}`;
        
        const dilutionsList = getWidalDilutions(widalTestName);
        WIDAL_DEFAULT_ANTIGENS.forEach(antigen => {
          if (!activeParamValues[antigen] || activeParamValues[antigen] === '') {
            const posDils = dilutionsList.filter(d => (grid[antigen]?.[d] || '').includes('+'));
            const highestTiter = posDils.length > 0 ? posDils[posDils.length - 1] : 'Non-Reactive';
            const displayVal = highestTiter !== 'Non-Reactive' 
              ? (highestTiter.startsWith('1:') ? `${highestTiter} (+)` : `1:${highestTiter.replace('1/', '')} (+)`) 
              : 'Non-Reactive';
            activeParamValues[antigen] = displayVal;
          }
        });
      }

      const formattedParameters = Object.entries(activeParamValues)
        .filter(([pName, pVal]) => !skippedParameters[pName] && pVal !== undefined && pVal !== null)
        .map(([pName, pVal]) => {
          let refRange = '';
          let unit = '';
          let refRules = [];
          let valOptions = [];
          let paramGroup = '';
          let paramDisplayName = '';
          availableLabTests.forEach(t => {
            if (Array.isArray(t.parameters)) {
              const found = t.parameters.find(p => p.name === pName);
              if (found) {
                refRange = found.referenceRange || '';
                unit = found.unit || '';
                refRules = found.referenceRules || [];
                valOptions = found.valueOptions || [];
                paramGroup = found.group || '';
                paramDisplayName = found.displayName || '';
              }
            }
          });
          return {
            name: pName,
            value: pVal !== '' ? pVal : '-',
            referenceRange: refRange,
            unit: unit,
            remarks: parameterRemarks[pName] || '',
            referenceRules: refRules,
            valueOptions: valOptions,
            group: paramGroup,
            displayName: customFieldDisplayNames[pName] || paramDisplayName || pName
          };
        });

      const payload = {
        parameters: formattedParameters,
        remarks: reportRemarks,
        notes: reportNotes,
        advice: reportAdvice,
        interpretation: reportInterpretation,
        printInterpretation: printInterpretation,
        signatoryId: selectedSignatoryId || (signatories.length > 0 ? signatories[0]._id : undefined),
        collectedDate: datesInfo.collectedDate,
        collectedTime: datesInfo.collectedTime,
        receivedDate: datesInfo.receivedDate,
        receivedTime: datesInfo.receivedTime,
        reportedDate: datesInfo.reportedDate,
        reportedTime: datesInfo.reportedTime
      };

      if (statusToSet === 'signed_off' || statusToSet === 'completed') {
        payload.reportStatus = 'Signed off';
      }

      const endpoint = (statusToSet === 'completed' || statusToSet === 'signed_off')
        ? `/lab/requests/${selectedRequest._id}/report-generate`
        : `/lab/requests/${selectedRequest._id}/report-draft`;

      const response = await api.post(endpoint, payload);

      setShowReportEntryView(false);
      setSelectedRequest(null);
      loadDashboardData();

      if (statusToSet === 'signed_off' || statusToSet === 'completed') {
        const fullRequest = response.data || response;
        setSavedReportRequest(fullRequest);
        setShowReportSavedModal(true);
      } else {
        showToast('Report draft saved successfully!', 'success');
      }
    } catch (err) {
      showToast(err.data?.message || err.message || 'Failed to save test report', 'error');
    } finally {
      setSavingReport(false);
    }
  };

  // Opens Bill Receipt preview modal matching Screenshot 1
  const handleOpenReceiptView = (report) => {
    const rawBill = report.rawBill;
    const testList = report.tests ? report.tests.split(',').map((t, idx) => ({ sno: idx + 1, name: t.trim(), amount: 100 })) : [{ sno: 1, name: 'Dengue IgG', amount: 100 }];
    const totalAmt = rawBill?.totalAmount || 100;
    const paidAmt = rawBill?.paidAmount || totalAmt;

    setViewingReceiptData({
      billNo: report.regNo.replace('#', ''),
      categoryBadge: report.modBadge || 'L1',
      patientName: report.patientName,
      ageSex: report.ageSex,
      mobileNumber: report.mobile || '8949895216',
      referredBy: report.referredBy,
      date: report.date || new Date().toLocaleDateString('en-GB'),
      receivedBy: report.patientName,
      investigations: testList,
      totalAmount: totalAmt,
      amountPaid: paidAmt
    });
  };

  // Payment Handling
  const handleOpenPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setPaymentAmount(bill.dueAmount || bill.totalAmount || 0);
    setPaymentMode('Cash');
    setPaymentRef('');
    setShowPaymentModal(true);
  };

  const handleReceivePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBillForPayment) return;
    setSubmittingPayment(true);
    try {
      await api.post(`/lab/bills/${selectedBillForPayment._id}/payments`, {
        amount: Number(paymentAmount),
        paymentMethod: paymentMode,
        transactionRef: paymentRef,
        remarks: 'Payment received from lab dashboard'
      });
      setShowPaymentModal(false);
      loadDashboardData();
      showToast('Payment recorded successfully!', 'success');
    } catch (err) {
      showToast(err.data?.message || err.message || 'Failed to record payment', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCreateBillFromOpd = (report) => {
    const req = report.rawRequest || {};
    const p = req.patientId || {};
    const fullPName = p.patientName || report.patientName || '';
    const nameParts = fullPName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const testsStr = Array.isArray(req.tests) ? req.tests.join(',') : (report.tests || '');
    
    const query = new URLSearchParams({
      patientId: p._id || '',
      requestId: req._id || report.id || '',
      labId: req.labId || report.regNo.replace('#', '') || '',
      uhid: p.uhid || '',
      firstName: firstName,
      lastName: lastName,
      mobile: p.mobile || report.mobile || '',
      gender: p.gender || 'Male',
      age: String(p.age || 25),
      tests: testsStr,
      ref: report.referredBy || 'OPD Doctor'
    }).toString();

    router.push(`/new-bill?${query}`);
  };

  // Unpaid due bills for Business view
  const dueBills = labBills.filter(b => (b.dueAmount > 0 || b.paymentStatus === 'Unpaid' || b.paymentStatus === 'Partial'));
  const filteredDueBills = dueBills.filter(b => {
    const search = dueSearchQuery.toLowerCase();
    const nameMatch = b.patientId?.patientName?.toLowerCase().includes(search);
    const uhidMatch = b.patientId?.uhid?.toLowerCase().includes(search);
    const billNoMatch = (b.billNo || b.labId)?.toLowerCase().includes(search);
    return !dueSearchQuery || nameMatch || uhidMatch || billNoMatch;
  });
  const totalDueAmount = dueBills.reduce((acc, b) => acc + (b.dueAmount || 0), 0);

  const renderSharedModals = () => {
    return (
      <>
        {/* Report Saved Options Modal (Print/Preview/Download) */}
        {showReportSavedModal && savedReportRequest && (
          <div className="fixed inset-0 z-55 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Report Saved Successfully</h3>
                <p className="text-[11px] text-slate-500 font-medium">The test report has been signed off and locked. What would you like to do next?</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportSavedModal(false);
                    handlePrintReport(savedReportRequest);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  🖨 Print / Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportSavedModal(false);
                    // Preview report modal (which is showReportPrintModal)
                    handleOpenReportPrint(savedReportRequest);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                >
                  👁 Preview Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportSavedModal(false);
                    setSavedReportRequest(null);
                  }}
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close & Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lab Report Print View Modal matching user screenshot */}
        {showReportPrintModal && selectedReportForPrint && (() => {
          const matchedBill = labBills.find(b => b.labRequestId === selectedReportForPrint._id || b.labId === selectedReportForPrint.labId);
          const patient = selectedReportForPrint.patientId || {};
          let ageStr = '—';
          if (patient.age) {
            ageStr = `${patient.age} YRS`;
          } else if (patient.dob) {
            const birthDate = new Date(patient.dob);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              calculatedAge--;
            }
            ageStr = `${calculatedAge} YRS`;
          }

          let genderStr = '—';
          if (patient.gender) {
            genderStr = String(patient.gender).toLowerCase().startsWith('f') ? 'F' : 'M';
          }

          const testList = Array.isArray(selectedReportForPrint.tests) 
            ? selectedReportForPrint.tests 
            : (typeof selectedReportForPrint.tests === 'string' 
                ? selectedReportForPrint.tests.split(',').map(t => t.trim()) 
                : []);
          
          const formatDateTime = (dateVal, timeVal, fallbackObj) => {
            let d = '';
            let t = '';
            if (dateVal) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateVal).trim())) {
                const [yy, mm, dd] = String(dateVal).trim().split('-');
                d = `${dd}/${mm}/${yy}`;
              } else {
                const parsed = new Date(dateVal);
                d = !isNaN(parsed.getTime()) ? parsed.toLocaleDateString('en-GB') : String(dateVal);
              }
            } else if (fallbackObj) {
              d = new Date(fallbackObj).toLocaleDateString('en-GB');
            }

            if (timeVal) {
              if (String(timeVal).includes(':')) {
                const [h, m] = String(timeVal).trim().split(':');
                let hour = parseInt(h, 10);
                const min = m ? m.slice(0, 2) : '00';
                if (!isNaN(hour)) {
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  hour = hour % 12 || 12;
                  t = `${String(hour).padStart(2, '0')}:${min} ${ampm}`;
                } else {
                  t = String(timeVal);
                }
              } else {
                t = String(timeVal);
              }
            } else if (fallbackObj) {
              t = new Date(fallbackObj).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }

            if (d && t) return `${d} ${t}`;
            if (d) return d;
            return '—';
          };

          const reqDate = selectedReportForPrint.createdAt ? new Date(selectedReportForPrint.createdAt) : new Date();
          const updDate = selectedReportForPrint.updatedAt ? new Date(selectedReportForPrint.updatedAt) : reqDate;

          const regDateStr = selectedReportForPrint.createdAt 
            ? new Date(selectedReportForPrint.createdAt).toLocaleDateString('en-GB') + ' ' + new Date(selectedReportForPrint.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : formatDateTime('', '', reqDate);

          const collectedDateStr = formatDateTime(
            selectedReportForPrint.report?.collectedDate || selectedReportForPrint.collectedDate || datesInfo.collectedDate,
            selectedReportForPrint.report?.collectedTime || selectedReportForPrint.collectedTime || datesInfo.collectedTime,
            reqDate
          );

          const receivedDateStr = formatDateTime(
            selectedReportForPrint.report?.receivedDate || selectedReportForPrint.receivedDate || datesInfo.receivedDate,
            selectedReportForPrint.report?.receivedTime || selectedReportForPrint.receivedTime || datesInfo.receivedTime,
            reqDate
          );

          const reportDateStr = (selectedReportForPrint.report?.reportedDate || selectedReportForPrint.reportedDate)
            ? formatDateTime(
                selectedReportForPrint.report?.reportedDate || selectedReportForPrint.reportedDate,
                selectedReportForPrint.report?.reportedTime || selectedReportForPrint.reportedTime,
                updDate
              )
            : (selectedReportForPrint.updatedAt 
                ? new Date(selectedReportForPrint.updatedAt).toLocaleDateString('en-GB') + ' ' + new Date(selectedReportForPrint.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : formatDateTime('', '', updDate));

          return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 md:p-8 print:p-0 print:bg-white print:static print:block animate-in fade-in duration-200">
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  .no-print {
                    display: none !important;
                  }
                  body {
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  .print-area,
                  .print-area * {
                    visibility: visible !important;
                  }
                  .print-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    display: block !important;
                    position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; display: block !important; border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 24px 24px 24px !important;
                    padding-top: ${hospitalSettings?.letterheadImageUrl ? `${hospitalSettings.letterheadHeaderHeight || 0}cm` : '5px'} !important;
                    padding-bottom: ${hospitalSettings?.letterheadImageUrl ? `${hospitalSettings.letterheadFooterHeight || 0}cm` : '0px'} !important;
                  }
                }
              `}} />

              {/* Header Action bar - Hidden on print */}
              <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md mb-4 no-print">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-800 mr-1">Lab Report Preview:</span>
                  {testList.length > 1 && (
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setPrintModalTestFilter('all')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${printModalTestFilter === 'all' ? 'bg-orange-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        All Tests ({testList.length} Pages)
                      </button>
                      {testList.map((tName, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPrintModalTestFilter(tName)}
                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${printModalTestFilter === tName ? 'bg-orange-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          {tName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 select-none bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors">
                    <input type="checkbox" checked={printInterpretation} onChange={(e) => setPrintInterpretation(e.target.checked)} className="rounded text-blue-600 cursor-pointer w-3.5 h-3.5" />
                    <span>Print Interpretation</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePrintReport(selectedReportForPrint, printModalTestFilter)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🖨</span>
                    <span>Print {printModalTestFilter === 'all' && testList.length > 1 ? `All (${testList.length} Pages)` : 'Report'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowReportPrintModal(false); setSelectedReportForPrint(null); }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Area - renders each test as a distinct page */}
              {(() => {
                const testsForModal = (printModalTestFilter && printModalTestFilter !== 'all')
                  ? testList.filter(t => t.toLowerCase() === printModalTestFilter.toLowerCase())
                  : (testList.length > 0 ? testList : ['LAB INVESTIGATION']);

                const hospName = hospitalSettings?.hospitalName || user?.hospitalName || user?.hospital?.name || 'Aman Hospital';
                const hospHeading = hospitalSettings?.hospitalHeading || '';
                const hospAddress = hospitalSettings?.address || '';
                
                const contactNumbers = [];
                if (Array.isArray(hospitalSettings?.mobileNumbers)) {
                  hospitalSettings.mobileNumbers.forEach(n => { if (n && typeof n === 'string' && n.trim()) contactNumbers.push(n.trim()); });
                }
                if (Array.isArray(hospitalSettings?.phoneNumbers)) {
                  hospitalSettings.phoneNumbers.forEach(p => {
                    const num = typeof p === 'object' ? p.number : p;
                    const namePrefix = typeof p === 'object' && p.name ? `${p.name}: ` : '';
                    if (num && String(num).trim()) contactNumbers.push(`${namePrefix}${String(num).trim()}`);
                  });
                }
                if (hospitalSettings?.alternateMobileNumber && hospitalSettings.alternateMobileNumber.trim()) {
                  contactNumbers.push(hospitalSettings.alternateMobileNumber.trim());
                }

                const hospEmail = hospitalSettings?.emailAddress || '';
                const hospWebsite = hospitalSettings?.website || '';
                const hospReg = hospitalSettings?.registrationNumber || '';
                const hospGst = hospitalSettings?.gstNumber || '';
                const hospLogo = hospitalSettings?.logoUrl || '';

                const sig = (selectedReportForPrint.report?.signatoryId && typeof selectedReportForPrint.report.signatoryId === 'object' && selectedReportForPrint.report.signatoryId.name)
                  ? selectedReportForPrint.report.signatoryId
                  : (signatories.find(s => s._id === (selectedReportForPrint.report?.signatoryId || selectedReportForPrint.signatoryId || selectedSignatoryId)) || (signatories.length > 0 ? signatories[0] : null));

                return (
                  <div className="space-y-8 w-full max-w-4xl">
                    {testsForModal.map((tName, tIdx) => {
                      const matchedTest = findMatchedTest(tName);
                      const rawParams = matchedTest && Array.isArray(matchedTest.parameters) ? matchedTest.parameters : [];
                      const patientGender = String(patient.gender || '').trim().toLowerCase();
                      const isFemalePatient = patientGender.startsWith('f');
                      const isMalePatient = patientGender.startsWith('m');
                      const genderFiltered = rawParams.filter(p => {
                        const pGender = String(p.gender || 'both').trim().toLowerCase();
                        if (pGender === 'both' || !pGender || pGender === 'all') return true;
                        if (pGender === 'male' || pGender === 'm') return isMalePatient || !patientGender;
                        if (pGender === 'female' || pGender === 'f') return isFemalePatient || !patientGender;
                        return true;
                      });
                      const testParams = genderFiltered.length > 0 ? genderFiltered : rawParams;
                      const testInterpretation = matchedTest?.interpretation || selectedReportForPrint.report?.interpretation || '';
                      const hasInterpretation = testInterpretation && testInterpretation.trim() !== '' && printInterpretation && selectedReportForPrint.printInterpretation !== false;

                      return (
                        <div key={tIdx} className="print-area w-full bg-white border border-slate-300 rounded-xl p-8 pt-4 shadow-xl space-y-5 text-xs text-slate-800 font-sans print:shadow-none print:border-0 print:p-0">
                          {testsForModal.length > 1 && (
                            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg text-orange-800 text-[11px] font-bold no-print mb-2">
                              <span>📄 Page {tIdx + 1} of {testsForModal.length}</span>
                              <span className="uppercase">{tName}</span>
                            </div>
                          )}

                          {hospitalSettings?.letterheadImageUrl ? (
                            <div style={{ height: `${hospitalSettings.letterheadHeaderHeight || 4.6}cm` }} className="w-full overflow-hidden mb-3">
                              <img src={hospitalSettings.letterheadImageUrl} alt="Letterhead Header" className="w-full h-full object-fill" />
                            </div>
                          ) : (
                            <div className="w-full border-b-2 border-slate-900 pb-3 mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-3.5">
                                {hospLogo ? (
                                  <img src={hospLogo} alt="Logo" className="w-14 h-14 object-contain" />
                                ) : (
                                  <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-400 text-[11px]">LOGO</div>
                                )}
                                <div className="text-left">
                                  <h1 className="text-lg font-black text-slate-900 leading-tight">{hospName}</h1>
                                  {hospHeading && <p className="text-[11px] font-bold text-orange-600 mt-0.5">{hospHeading}</p>}
                                  {hospAddress && <p className="text-[9.5px] text-slate-600 font-medium max-w-md mt-0.5">{hospAddress}</p>}
                                  {(hospReg || hospGst) && (
                                    <p className="text-[8.5px] text-slate-500 font-bold mt-0.5">
                                      {hospReg && `Reg No: ${hospReg}`}{hospReg && hospGst && ' | '}{hospGst && `GSTIN: ${hospGst}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-[9.5px] text-slate-600 space-y-0.5">
                                {contactNumbers.length > 0 && <p className="font-extrabold text-slate-900">📞 {contactNumbers.join(', ')}</p>}
                                {hospEmail && <p className="font-medium">✉ {hospEmail}</p>}
                                {hospWebsite && <p className="font-medium text-blue-600">🌐 {hospWebsite}</p>}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-12 border-b-2 border-slate-800 pb-3 items-start gap-4 text-[11px]">
                            <div className="col-span-6 space-y-1 text-slate-800">
                              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">{patient.patientName || 'Patient'}</h2>
                              <div className="grid grid-cols-12 leading-relaxed">
                                <span className="col-span-4 font-bold text-slate-500">Age / Sex</span>
                                <span className="col-span-8 font-black text-slate-900">: {ageStr} / {genderStr}</span>
                                <span className="col-span-4 font-bold text-slate-500">Referred by</span>
                                <span className="col-span-8 font-black text-slate-900">: {selectedReportForPrint.remarks || 'Self'}</span>
                                <span className="col-span-4 font-bold text-slate-500">Reg. no.</span>
                                <span className="col-span-8 font-black text-slate-900">: {selectedReportForPrint.labId ? (selectedReportForPrint.labId.startsWith('#') ? selectedReportForPrint.labId : `#${selectedReportForPrint.labId}`) : '—'}</span>
                              </div>
                            </div>
                            <div className="col-span-6 flex flex-col items-end justify-start text-[11px]">
                              <div className="w-full max-w-xs grid grid-cols-12 leading-relaxed text-slate-700 font-bold">
                                <span className="col-span-5 text-right pr-2">Registered</span>
                                <span className="col-span-7 text-slate-900 font-extrabold">: {regDateStr}</span>
                                <span className="col-span-5 text-right pr-2">Collected</span>
                                <span className="col-span-7 text-slate-900 font-extrabold">: {collectedDateStr}</span>
                                <span className="col-span-5 text-right pr-2">Received</span>
                                <span className="col-span-7 text-slate-900 font-extrabold">: {receivedDateStr}</span>
                                <span className="col-span-5 text-right pr-2">Reported</span>
                                <span className="col-span-7 text-slate-900 font-extrabold">: {reportDateStr}</span>
                              </div>
                            </div>
                          </div>

                          <div className="py-2 flex flex-col items-center justify-center border-b border-slate-200 text-center">
                            <h3 className="text-xs font-black tracking-widest text-slate-900 border-b-2 border-slate-900 pb-0.5 uppercase">{matchedTest?.department || selectedReportForPrint.category || 'DEPARTMENT OF PATHOLOGY'}</h3>
                            <div className="text-[11px] font-extrabold text-orange-600 mt-1 uppercase tracking-wide">{tName}</div>
                          </div>

                          <div className="border border-slate-300 rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse text-[11px] leading-relaxed">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-300 text-slate-800 font-extrabold uppercase text-[10px]">
                                  <th className="py-2 px-4 w-2/5">TEST</th>
                                  <th className="py-2 px-4 w-1/5">VALUE</th>
                                  <th className="py-2 px-4 w-1/5">UNIT</th>
                                  <th className="py-2 px-4 w-1/5">REFERENCE</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {String(tName || '').toLowerCase().includes('widal') ? (
                                  <tr>
                                    <td colSpan="4" className="p-4 bg-white">
                                      <p className="text-[11px] font-semibold text-slate-700 mb-2">Tube agglutination test for Salmonella group of organisms reveal following titers.</p>
                                      {(() => {
                                        const dilutions = getWidalDilutions(tName);
                                        let widalGrid = getWidalDefaultGrid(tName);
                                        const widalParam = selectedReportForPrint.report?.parameters?.find(rp => rp.name === 'widal_matrix_json');
                                        if (widalParam && widalParam.value) { try { widalGrid = typeof widalParam.value === 'string' ? JSON.parse(widalParam.value) : widalParam.value; } catch(e) {} }
                                        const commentParam = selectedReportForPrint.report?.parameters?.find(rp => rp.name === 'widal_comment' || rp.name === 'Result' || rp.name === 'Comment');
                                        let commentVal = commentParam?.value ? commentParam.value.replace(/^WIDAL TEST\s*/i, '').trim() : 'POSITIVE';
                                        if (!commentVal) commentVal = 'POSITIVE';
                                        return (
                                          <div className="space-y-2.5">
                                            <table className="w-full border-collapse border border-slate-400 text-center text-[10.5px]">
                                              <thead>
                                                <tr className="bg-slate-100/80 border-b border-slate-400 font-extrabold text-slate-800">
                                                  <th className="py-1.5 px-3 text-left border border-slate-300 w-1/4">Antigen</th>
                                                  {dilutions.map((dil) => <th key={dil} className="py-1.5 px-2 border border-slate-300 w-[15%]">{dil}</th>)}
                                                  <th className="py-1.5 px-3 border border-slate-300 w-1/4">Result</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {Object.keys(widalGrid).map((antigen) => {
                                                  const posDils = dilutions.filter(d => (widalGrid[antigen]?.[d] || '').includes('+'));
                                                  const highestTiter = posDils.length > 0 ? posDils[posDils.length - 1] : 'Non-Reactive';
                                                  const displayVal = highestTiter !== 'Non-Reactive' ? (highestTiter.startsWith('1:') ? `${highestTiter} (+)` : `1:${highestTiter.replace('1/', '')} (+)`) : 'Non-Reactive';
                                                  return (
                                                    <tr key={antigen} className="border-b border-slate-200">
                                                      <td className="py-1.5 px-3 border border-slate-300 text-left font-bold text-slate-900">{antigen}</td>
                                                      {dilutions.map((dil) => <td key={dil} className={`py-1.5 px-2 border border-slate-300 ${widalGrid[antigen]?.[dil]?.includes('+') ? 'text-orange-600 font-black' : 'text-slate-600'}`}>{widalGrid[antigen]?.[dil] || '—'}</td>)}
                                                      <td className={`py-1.5 px-3 border border-slate-300 font-black ${displayVal !== 'Non-Reactive' ? 'text-orange-600' : 'text-emerald-700'}`}>{displayVal}</td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                            <div className="text-xs font-bold text-slate-900">Comment: <span className="text-orange-600 font-black">WIDAL TEST {commentVal}</span></div>
                                            <div className="text-[10px] text-slate-500 italic leading-relaxed">{getWidalNote(tName)}</div>
                                          </div>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                ) : (
                                  (() => {
                                    let lastGroup = null;
                                    return testParams.map((p, pIdx) => {
                                      const rVal = selectedReportForPrint.report?.parameters?.find(rp => rp.name === p.name);
                                      const valText = rVal ? rVal.value : '';
                                      const isBad = isOutOfRange(p.name, valText) || (rVal && rVal.isAbnormal);
                                      const isGroupHeaderNeeded = p.group && p.group !== lastGroup;
                                      if (p.group) lastGroup = p.group;
                                      let refDisplay = p.referenceRange || p.normalRange || (p.min !== undefined && p.max !== undefined ? `${p.min} - ${p.max}` : '—');
                                      return (
                                        <React.Fragment key={pIdx}>
                                          {isGroupHeaderNeeded && (
                                            <tr className="bg-slate-100/70 border-t border-slate-200">
                                              <td colSpan="4" className="py-1 px-4 font-black text-slate-800 uppercase text-[10px] tracking-wide">{p.group}</td>
                                            </tr>
                                          )}
                                          <tr className="hover:bg-slate-50/30 transition-colors">
                                            <td className="py-2 px-4 font-bold text-slate-800">{p.displayName || p.name}{rVal?.remarks && <div className="text-[9px] text-slate-500 font-normal italic">Note: {rVal.remarks}</div>}</td>
                                            <td className={`py-2 px-4 ${isBad ? 'font-black text-red-600 text-sm' : 'font-bold text-slate-900'}`}>{valText || '—'}</td>
                                            <td className="py-2 px-4 text-slate-500 font-medium">{p.unit || '—'}</td>
                                            <td className="py-2 px-4 text-slate-600 font-medium whitespace-pre-wrap">{refDisplay}</td>
                                          </tr>
                                        </React.Fragment>
                                      );
                                    });
                                  })()
                                )}
                              </tbody>
                            </table>
                          </div>

                          {(selectedReportForPrint.report?.notes || selectedReportForPrint.report?.remarks || selectedReportForPrint.report?.advice) && (
                            <div className="grid grid-cols-12 gap-y-1.5 pt-3 text-[11px] leading-relaxed border-t border-slate-200">
                              {selectedReportForPrint.report?.notes && <><span className="col-span-2 font-black text-slate-900 italic">Notes</span><span className="col-span-10 font-bold text-slate-800 italic">: {selectedReportForPrint.report.notes}</span></>}
                              {selectedReportForPrint.report?.remarks && <><span className="col-span-2 font-black text-slate-900 italic">Remarks</span><span className="col-span-10 font-bold text-slate-800 italic">: {selectedReportForPrint.report.remarks}</span></>}
                              {selectedReportForPrint.report?.advice && <><span className="col-span-2 font-black text-slate-900 italic">Advice</span><span className="col-span-10 font-bold text-slate-800 italic">: {selectedReportForPrint.report.advice}</span></>}
                            </div>
                          )}

                          {hasInterpretation && (
                            <div className="pt-3 border-t border-slate-200 text-[11px] leading-relaxed">
                              <h4 className="font-extrabold text-slate-900 mb-1 uppercase tracking-wide">Interpretation:</h4>
                              <div className="text-slate-800 space-y-2 [&_table]:w-full [&_table]:border-collapse [&_table]:my-2.5 [&_th]:border [&_th]:border-slate-300 [&_th]:p-1.5 [&_th]:bg-slate-50 [&_th]:font-bold [&_td]:border [&_td]:border-slate-300 [&_td]:p-1.5 leading-normal" dangerouslySetInnerHTML={{ __html: testInterpretation }} />
                            </div>
                          )}

                          {sig && (
                            <div className="mt-8 pt-4 flex justify-end">
                              <div className="text-center min-w-[160px] space-y-1">
                                {sig.signatureImageUrl && <img src={sig.signatureImageUrl} alt="Doctor Signature" className="max-h-12 max-w-[150px] object-contain mx-auto mb-1.5" />}
                                <div className="font-extrabold text-slate-900 text-xs">{sig.name}</div>
                                <div className="text-[10px] text-slate-500 font-semibold">{sig.designation}</div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-center pt-4">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">~~~ End of report ~~~</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* Modal for filling test parameters & generating report */}
        {showProcessModal && selectedRequest && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Process Lab Request
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter test values for parameter fields defined by Lab Admin
                  </p>
                </div>
                <button onClick={() => setShowProcessModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Test Fields Form */}
              <div className="space-y-5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Ordered Tests: </span>
                    <span className="font-bold text-slate-800">{selectedRequest.tests?.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">UHID: </span>
                    <span className="font-bold text-orange-600">{selectedRequest.patientId?.uhid}</span>
                  </div>
                </div>

                {/* Dynamic Parameter Input Fields */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Diagnostic Parameter Results
                  </h4>

                  {Object.keys(parameterValues).length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>No pre-configured parameters found for these tests. You can enter remarks below{isAdminUser ? <span className="cursor-pointer underline font-bold ml-1" onClick={() => router.push('/admin')}>or add parameters in Lab Admin Portal</span> : '.'}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {Object.keys(parameterValues).map((pName) => {
                        let refRange = '';
                        let unit = '';
                        availableLabTests.forEach(t => {
                          if (Array.isArray(t.parameters)) {
                            const found = t.parameters.find(p => p.name === pName);
                            if (found) {
                              refRange = found.referenceRange || '';
                              unit = found.unit || '';
                            }
                          }
                        });

                        return (
                          <div key={pName} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="sm:w-1/2">
                              <label className="block text-xs font-bold text-slate-800">{pName}</label>
                              {(refRange || unit) && (
                                <span className="text-[11px] text-slate-500">
                                  {refRange ? `Ref: ${refRange}` : ''} {unit ? `(${unit})` : ''}
                                </span>
                              )}
                            </div>
                            <div className="sm:w-1/2">
                              <input
                                type="text"
                                placeholder={`Enter ${pName} result...`}
                                value={parameterValues[pName] || ''}
                                onChange={(e) => handleParamValueChange(pName, e.target.value)}
                                className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Technician Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Report Remarks & Notes</label>
                  <textarea
                    rows="3"
                    value={reportRemarks}
                    onChange={(e) => setReportRemarks(e.target.value)}
                    placeholder="Enter technician remarks, clinical notes, or observations..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => handleSaveReport('draft')}
                    disabled={savingReport}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveReport('completed')}
                    disabled={savingReport}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {savingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Complete & Generate Report</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal for Viewing & Printing Bill Receipt matching Screenshot 1 */}
        {viewingReceiptData && (
          <LabBillReceipt
            billData={viewingReceiptData}
            onClose={() => setViewingReceiptData(null)}
          />
        )}

        {/* Modal for Payment Collection */}
        {showPaymentModal && selectedBillForPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900">Record Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleReceivePaymentSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1 text-slate-500">Patient Name</label>
                  <span className="block text-sm font-bold text-slate-800">{selectedBillForPayment.patientId?.patientName || 'Patient'}</span>
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Due Amount (₹)</label>
                  <span className="block text-base font-black text-red-600">₹{(selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Amount Received (₹)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Transaction Reference No (Optional)</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="UPI Transaction ID / Card Ref ID..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-900 focus:bg-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Record Payment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  };

  const [showSignOffDropdown, setShowSignOffDropdown] = useState(false);

  const handleDateChange = (field, val) => {
    setDatesInfo(prev => ({ ...prev, [field]: val }));
  };

  const getValueRangeStatus = (paramName, valueStr) => {
    if (!valueStr) return null;

    // A. Check if the value matches any predefined option marked as Abnormal
    let foundAbnormalMatch = false;
    availableLabTests.forEach(t => {
      if (Array.isArray(t.parameters)) {
        const found = t.parameters.find(p => p.name === paramName);
        if (found && Array.isArray(found.valueOptions)) {
          const matchOpt = found.valueOptions.find(o => String(o.value).trim() === String(valueStr).trim());
          if (matchOpt && matchOpt.isAbnormal) {
            foundAbnormalMatch = true;
          }
        }
      }
    });
    if (foundAbnormalMatch) return 'H';

    if (isNaN(valueStr)) return null;
    const value = parseFloat(valueStr);
    
    let rules = [];
    let defaultRange = '';
    availableLabTests.forEach(t => {
      if (Array.isArray(t.parameters)) {
        const found = t.parameters.find(p => p.name === paramName);
        if (found) {
          rules = found.referenceRules || [];
          defaultRange = found.referenceRange || '';
        }
      }
    });

    const rawGender = selectedRequest?.patientId?.gender || 'Male';
    const pGender = (rawGender.toLowerCase().startsWith('f') || rawGender.toLowerCase().startsWith('w')) ? 'Female' : 'Male';
    const pAge = Number(selectedRequest?.patientId?.age) || 30;

    const matchRule = rules.find(r => {
      const sexMatch = !r.sex || r.sex === 'Any' || r.sex.toLowerCase() === pGender.toLowerCase();
      if (!sexMatch) return false;

      let minYears = Number(r.minAge) || 0;
      if (r.minAgeUnit === 'Months') minYears = minYears / 12;
      if (r.minAgeUnit === 'Days') minYears = minYears / 365;

      let maxYears = Number(r.maxAge) || 100;
      if (r.maxAgeUnit === 'Months') maxYears = maxYears / 12;
      if (r.maxAgeUnit === 'Days') maxYears = maxYears / 365;

      return pAge >= minYears && pAge <= maxYears;
    });

    if (matchRule) {
      const lower = parseFloat(matchRule.lowerValue);
      const upper = parseFloat(matchRule.upperValue);
      if (!isNaN(lower) && value < lower) return 'L';
      if (!isNaN(upper) && value > upper) return 'H';
      return null;
    }

    if (defaultRange) {
      const cleanRange = defaultRange.replace(/[–—−]/g, '-').replace(/\s+/g, ' ');
      
      // Parse gender-specific string ranges like "Male: ~13.8–17.2; Female: ~12.1–15.1"
      if (defaultRange.toLowerCase().includes('male') || defaultRange.toLowerCase().includes('female')) {
        const isMale = pGender.toLowerCase() === 'male';
        const maleMatch = defaultRange.match(/male:\s*~?([-+]?[0-9]*\.?[0-9]+)\s*[-–—−]\s*([-+]?[0-9]*\.?[0-9]+)/i);
        const femaleMatch = defaultRange.match(/female:\s*~?([-+]?[0-9]*\.?[0-9]+)\s*[-–—−]\s*([-+]?[0-9]*\.?[0-9]+)/i);
        
        if (isMale && maleMatch) {
          const ml = parseFloat(maleMatch[1]);
          const mu = parseFloat(maleMatch[2]);
          if (value < ml) return 'L';
          if (value > mu) return 'H';
          return null;
        } else if (!isMale && femaleMatch) {
          const fl = parseFloat(femaleMatch[1]);
          const fu = parseFloat(femaleMatch[2]);
          if (value < fl) return 'L';
          if (value > fu) return 'H';
          return null;
        }
      }

      // Fallback: standard numeric range parser
      const numbers = cleanRange.match(/[-+]?[0-9]*\.?[0-9]+/g);
      if (numbers && numbers.length >= 2) {
        const lower = parseFloat(numbers[0]);
        const upper = parseFloat(numbers[1]);
        if (!isNaN(lower) && !isNaN(upper)) {
          if (value < lower) return 'L';
          if (value > upper) return 'H';
          return null;
        }
      }
    }

    return null;
  };

  const isOutOfRange = (paramName, valueStr) => {
    return getValueRangeStatus(paramName, valueStr) !== null;
  };

  const handleUpdateParameterRules = async (paramName, updatedRules) => {
    const matchedTest = availableLabTests.find(t => 
      Array.isArray(t.parameters) && t.parameters.some(p => p.name === paramName)
    );
    if (!matchedTest) return;

    const updatedParameters = matchedTest.parameters.map(p => {
      if (p.name === paramName) {
        const defaultDisplay = updatedRules.map(r => {
          let str = '';
          if (r.sex && r.sex !== 'Any') str += `${r.sex}: `;
          if (r.lowerValue || r.upperValue) {
            str += `${r.lowerValue || '0'} – ${r.upperValue || 'N/A'}`;
          }
          return str;
        }).filter(Boolean).join('; ') || 'As per lab standards';

        return {
          ...p,
          referenceRules: updatedRules,
          referenceRange: updatedRules[0]?.displayedValue || defaultDisplay
        };
      }
      return p;
    });

    try {
      const res = await api.put(`/lab/tests/${matchedTest._id}`, {
        category: matchedTest.category || 'LAB',
        title: matchedTest.title,
        parameters: updatedParameters
      });
      setAvailableLabTests(prev => prev.map(t => t._id === matchedTest._id || t.title === matchedTest.title ? res : t));
      setShowRuleModalParam('');
      alert('Reference range rules updated successfully!');
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to update reference rules');
    }
  };

  const handleSaveValueOption = async (paramName) => {
    if (!newValueOptionText.trim()) return;

    const matchedTest = availableLabTests.find(t => 
      Array.isArray(t.parameters) && t.parameters.some(p => p.name === paramName)
    );
    if (!matchedTest) return;

    const updatedParameters = matchedTest.parameters.map(p => {
      if (p.name === paramName) {
        const options = Array.isArray(p.valueOptions) ? [...p.valueOptions] : [];
        if (editingValueOptionIdx !== null) {
          options[editingValueOptionIdx] = {
            value: newValueOptionText.trim(),
            isAbnormal: newValueOptionAbnormal
          };
        } else {
          options.push({
            value: newValueOptionText.trim(),
            isAbnormal: newValueOptionAbnormal
          });
        }
        return {
          ...p,
          valueOptions: options
        };
      }
      return p;
    });

    try {
      const res = await api.put(`/lab/tests/${matchedTest._id}`, {
        category: matchedTest.category || 'LAB',
        title: matchedTest.title,
        parameters: updatedParameters
      });
      setAvailableLabTests(prev => prev.map(t => t._id === matchedTest._id || t.title === matchedTest.title ? res : t));
      setNewValueOptionText('');
      setNewValueOptionAbnormal(false);
      setEditingValueOptionIdx(null);
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save value choice');
    }
  };

  const handleDeleteValueOption = async (paramName, idxToDelete) => {
    const matchedTest = availableLabTests.find(t => 
      Array.isArray(t.parameters) && t.parameters.some(p => p.name === paramName)
    );
    if (!matchedTest) return;

    const updatedParameters = matchedTest.parameters.map(p => {
      if (p.name === paramName) {
        const options = Array.isArray(p.valueOptions) ? p.valueOptions.filter((_, idx) => idx !== idxToDelete) : [];
        return {
          ...p,
          valueOptions: options
        };
      }
      return p;
    });

    try {
      const res = await api.put(`/lab/tests/${matchedTest._id}`, {
        category: matchedTest.category || 'LAB',
        title: matchedTest.title,
        parameters: updatedParameters
      });
      setAvailableLabTests(prev => prev.map(t => t._id === matchedTest._id || t.title === matchedTest.title ? res : t));
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to delete value choice');
    }
  };

  const handleSaveInterpretationToTemplate = async () => {
    const testNames = Array.isArray(selectedRequest?.tests) 
      ? selectedRequest.tests 
      : (typeof selectedRequest?.tests === 'string' 
          ? selectedRequest.tests.split(',').map(t => t.trim()) 
          : []);
          
    const normalizeString = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let matchedTest = null;
    testNames.forEach(tName => {
      const tNameNorm = normalizeString(tName);
      const found = availableLabTests.find(t => {
        const titleNorm = normalizeString(t.title);
        const testNorm = normalizeString(t.test);
        return titleNorm === tNameNorm || testNorm === tNameNorm || (titleNorm && titleNorm.includes(tNameNorm)) || (tNameNorm && tNameNorm.includes(titleNorm));
      });
      if (found) matchedTest = found;
    });

    if (!matchedTest) {
      alert('Could not resolve current investigation test template to save interpretation.');
      return;
    }

    try {
      const res = await api.put(`/lab/tests/${matchedTest._id}`, {
        category: matchedTest.category || 'LAB',
        title: matchedTest.title,
        interpretation: reportInterpretation
      });
      setAvailableLabTests(prev => prev.map(t => t._id === matchedTest._id || t.title === matchedTest.title ? res : t));
      alert('Interpretation saved as default for future reports!');
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save default interpretation');
    }
  };

  const handleOpenReportPrint = (reqItem, liveData = null) => {
    setSelectedReportForPrint(liveData || reqItem);
    setShowReportPrintModal(true);
  };

  const handlePreviewCurrentReport = () => {
    if (!selectedRequest) return;
    const testNames = Array.isArray(selectedRequest.tests) 
      ? selectedRequest.tests 
      : (typeof selectedRequest.tests === 'string' 
          ? selectedRequest.tests.split(',').map(t => t.trim()) 
          : []);

    const normalizeString = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const widalTestName = testNames.find(t => normalizeString(t).includes('widal'));
    const activeParamValues = { ...parameterValues };

    if (widalTestName) {
      const grid = getWidalGridFromParams(activeParamValues, widalTestName);
      const comment = activeParamValues['widal_comment'] || 'POSITIVE';
      activeParamValues['widal_matrix_json'] = JSON.stringify(grid);
      activeParamValues['widal_comment'] = comment;
      activeParamValues['Result'] = `WIDAL TEST ${comment}`;
      
      const dilutionsList = getWidalDilutions(widalTestName);
      WIDAL_DEFAULT_ANTIGENS.forEach(antigen => {
        if (!activeParamValues[antigen] || activeParamValues[antigen] === '') {
          const posDils = dilutionsList.filter(d => (grid[antigen]?.[d] || '').includes('+'));
          const highestTiter = posDils.length > 0 ? posDils[posDils.length - 1] : 'Non-Reactive';
          const displayVal = highestTiter !== 'Non-Reactive' 
            ? (highestTiter.startsWith('1:') ? `${highestTiter} (+)` : `1:${highestTiter.replace('1/', '')} (+)`) 
            : 'Non-Reactive';
          activeParamValues[antigen] = displayVal;
        }
      });
    }

    const previewParams = Object.entries(activeParamValues)
      .filter(([pName]) => !skippedParameters[pName])
      .map(([pName, pVal]) => ({
        name: pName,
        displayName: customFieldDisplayNames[pName] || pName,
        value: pVal !== '' ? pVal : '-',
        remarks: parameterRemarks[pName] || ''
      }));

    const liveData = {
      ...selectedRequest,
      report: {
        ...(selectedRequest.report || {}),
        parameters: previewParams,
        interpretation: reportInterpretation,
        remarks: reportRemarks,
        notes: reportNotes,
        advice: reportAdvice,
        signatoryId: signatories.find(s => s._id === selectedSignatoryId) || selectedRequest.report?.signatoryId || (signatories.length > 0 ? signatories[0] : null),
        collectedDate: datesInfo.collectedDate,
        collectedTime: datesInfo.collectedTime,
        receivedDate: datesInfo.receivedDate,
        receivedTime: datesInfo.receivedTime,
        reportedDate: datesInfo.reportedDate,
        reportedTime: datesInfo.reportedTime
      },
      printInterpretation: printInterpretation
    };
    handleOpenReportPrint(selectedRequest, liveData);
  };

  const renderReportEntryView = () => {
    const matchedBill = labBills.find(b => b.labRequestId === selectedRequest._id || b.labId === selectedRequest.labId);
    const regDateStr = selectedRequest.createdAt 
      ? new Date(selectedRequest.createdAt).toLocaleDateString('en-GB') + ' ' + new Date(selectedRequest.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '';

    const testNames = Array.isArray(selectedRequest.tests) 
      ? selectedRequest.tests 
      : (typeof selectedRequest.tests === 'string' 
          ? selectedRequest.tests.split(',').map(t => t.trim()) 
          : []);

    const badgeCategory = selectedRequest.category || 'LAB';
    const patientGender = selectedRequest.patientId?.gender || 'Male';

    return (
      <DashboardLayout>
        <div className="space-y-6 pb-16 bg-white min-h-screen">
          {/* HEADER ROUTING / BREADCRUMB */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReportEntryView(false);
                  setSelectedRequest(null);
                }}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Lab report
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500">
                    Reg no. {selectedRequest.labId} | {badgeCategory}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    patientGender.toLowerCase() === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {patientGender} 👤
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-600 text-white shadow-2xs">
                    Status: {selectedRequest.reportStatus || 'New'}
                  </span>
                </div>
              </div>
            </div>
            {/* Top Right Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSignOffDropdown(!showSignOffDropdown)}
                  className="h-8 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
                {showSignOffDropdown && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignOffDropdown(false);
                        if (matchedBill) handleOpenReceiptView({ rawBill: matchedBill, regNo: selectedRequest.labId, patientName: selectedRequest.patientId?.patientName, ageSex: `${selectedRequest.patientId?.age} YRS/${selectedRequest.patientId?.gender?.[0]}`, referredBy: selectedRequest.remarks || 'Self', tests: testNames.join(', ') });
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      View bill
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignOffDropdown(false);
                        router.push(`/new-bill?patientId=${selectedRequest.patientId?._id || ''}&labId=${selectedRequest.labId || ''}`);
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Modify case
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignOffDropdown(false);
                        handlePreviewCurrentReport();
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      <span>🖨️</span>
                      <span>Browse print</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Layout Button */}
              <button 
                type="button" 
                onClick={() => setIsEditLayoutMode(!isEditLayoutMode)}
                className={`h-8 px-3.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs ${
                  isEditLayoutMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 ring-2 ring-blue-200'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
                title={isEditLayoutMode ? 'Click to finish editing fields' : 'Click to edit field names or skip fields from print'}
              >
                <span>{isEditLayoutMode ? '✓' : '✏️'}</span>
                <span>{isEditLayoutMode ? 'Done Editing' : 'Edit'}</span>
              </button>

              {/* View / Preview Button */}
              <button
                type="button"
                onClick={handlePreviewCurrentReport}
                className="h-8 px-3.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
                title="Preview report with current live entered values"
              >
                <span>👁️</span>
                <span>View</span>
              </button>
            </div>
          </div>

          {/* PATIENT INFO CARD PANEL */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left 5 Cols: Details */}
            <div className="md:col-span-5 grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
              <span className="text-slate-500 font-semibold">Patient Name:</span>
              <span className="font-bold text-slate-800">{selectedRequest.patientId?.patientName || 'Mr. Ravi 2'}</span>
              <span className="text-slate-500 font-semibold">Age / Sex:</span>
              <span className="font-bold text-slate-800">{selectedRequest.patientId?.age || 28} YRS / {selectedRequest.patientId?.gender?.[0] || 'M'}</span>
              <span className="text-slate-500 font-semibold">Referred By:</span>
              <span className="font-bold text-slate-800">{selectedRequest.remarks?.replace('Referred by:', '') || 'Self'}</span>
              <span className="text-slate-500 font-semibold">Reg. no.</span>
              <span className="font-bold text-slate-800">{selectedRequest.labId}</span>
            </div>

            {/* Middle 5 Cols: Registration & Collection Timings */}
            <div className="md:col-span-5 grid grid-cols-1 gap-y-2.5 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-24 text-slate-500">Registered on:</span>
                <span className="text-slate-800 flex items-center gap-1 font-bold">
                  <span>✏️</span>
                  <span>{regDateStr}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-slate-500">Collected on:</span>
                <input
                  type="date"
                  value={datesInfo.collectedDate}
                  onChange={(e) => handleDateChange('collectedDate', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
                <input
                  type="time"
                  value={datesInfo.collectedTime}
                  onChange={(e) => handleDateChange('collectedTime', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-slate-500">Received on:</span>
                <input
                  type="date"
                  value={datesInfo.receivedDate}
                  onChange={(e) => handleDateChange('receivedDate', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
                <input
                  type="time"
                  value={datesInfo.receivedTime}
                  onChange={(e) => handleDateChange('receivedTime', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-slate-500">Reported on:</span>
                <input
                  type="date"
                  value={datesInfo.reportedDate}
                  onChange={(e) => handleDateChange('reportedDate', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
                <input
                  type="time"
                  value={datesInfo.reportedTime}
                  onChange={(e) => handleDateChange('reportedTime', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
            </div>

            {/* Right 2 Cols: Barcode representation */}
            <div className="md:col-span-2 flex flex-col items-center justify-center border-l border-slate-100 pl-4 py-2">
              <div className="flex items-center gap-[2px] h-9">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className={`w-[2px] h-full bg-slate-900 ${i % 3 === 0 ? 'w-[4px]' : (i % 5 === 0 ? 'w-[1px]' : '')}`} />
                ))}
              </div>
              <span className="text-[10px] font-mono tracking-wider text-slate-500 mt-1">{selectedRequest.labId}</span>
            </div>
          </div>

          {/* LARGE MODALITY TITLE & TEST NAME */}
          <div className="text-center py-2.5 border-b border-slate-200 relative">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">
              {(() => {
                const firstTest = testNames.length > 0 ? findMatchedTest(testNames[0]) : null;
                return firstTest?.department || (badgeCategory === 'LAB' ? 'BIOCHEMISTRY' : badgeCategory);
              })()}
            </h2>
            {testNames.length > 0 && (
              <p className="text-sm font-extrabold text-slate-700 mt-0.5 uppercase tracking-wider">
                {testNames.join(', ')}
              </p>
            )}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <select className="h-8 px-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 cursor-pointer">
                <option>Reorder</option>
              </select>
              <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Edit Mode Alert Banner */}
          {isEditLayoutMode && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🛠️</span>
                <span>
                  <b>Field Edit Mode Active:</b> You can rename field display names directly and check/uncheck fields to skip them from this report & print.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditLayoutMode(false)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Done Editing
              </button>
            </div>
          )}

          {/* TABLE OF PARAMETERS RESULTS ENTRY */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {/* Multi-Test Selector Tabs when patient has multiple tests */}
            {testNames.length > 1 && (
              <div className="flex items-center gap-1.5 p-3 bg-orange-50/40 border-b border-orange-100/80 overflow-x-auto">
                <span className="text-[11px] font-extrabold text-orange-950 uppercase tracking-wider mr-1 shrink-0">
                  Tests on Bill ({testNames.length}):
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedReportTestFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedReportTestFilter === 'all'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-orange-50 border border-orange-200/80'
                  }`}
                >
                  All Tests ({testNames.length})
                </button>
                {testNames.map((tName) => (
                  <button
                    key={tName}
                    type="button"
                    onClick={() => setSelectedReportTestFilter(tName)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      selectedReportTestFilter === tName
                        ? 'bg-orange-500 text-white shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-orange-50 border border-orange-200/80'
                    }`}
                  >
                    {tName}
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5 w-2/5">TEST</th>
                    <th className="py-3 px-5 w-1/4">VALUE</th>
                    <th className="py-3 px-5 w-1/8">UNIT</th>
                    <th className="py-3 px-5 w-1/4">
                      <div className="flex items-center justify-between">
                        <span>REFERENCE</span>
                        <div className="flex items-center gap-3 font-semibold normal-case text-slate-500 text-[10px]">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded text-orange-500 cursor-pointer" />
                            <span>Print ready</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" className="rounded text-orange-500 cursor-pointer" />
                            <span>Page break after (PDF only)</span>
                          </label>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testNames.filter(t => selectedReportTestFilter === 'all' || t === selectedReportTestFilter).map((tName) => {
                    const matchedTest = findMatchedTest(tName);
                    const params = matchedTest?.parameters || [];

                    return (
                      <React.Fragment key={tName}>
                        {/* Test Group Header Checked Row */}
                        <tr className="bg-slate-50/70 border-t border-slate-200/80">
                          <td colSpan="4" className="py-2.5 px-5 font-bold text-slate-900 text-xs flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked className="rounded text-orange-500 cursor-pointer" />
                              <span className="font-extrabold text-orange-950 uppercase">{tName}</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              {params.length} parameters
                            </span>
                          </td>
                        </tr>

                        {String(tName || '').toLowerCase().includes('widal') ? (
                          <tr>
                            <td colSpan="4" className="p-4 bg-white">
                              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                                {/* Top Description Header */}
                                <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex flex-wrap items-center justify-between gap-2">
                                  <span>Tube agglutination test for Salmonella group of organisms reveal following titers.</span>
                                  <span className="text-[11px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                                    💡 Tip: Click + / - to set result or edit cell directly
                                  </span>
                                </div>

                                {/* Table Matrix */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 font-black text-[11px]">
                                        <th className="py-2.5 px-4 text-left w-1/4 border-r border-slate-200">Antigen</th>
                                        {getWidalDilutions(tName).map((dil) => (
                                          <th key={dil} className="py-2.5 px-3 text-center w-[15%] border-r border-slate-200 last:border-r-0">
                                            {dil}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                      {WIDAL_DEFAULT_ANTIGENS.map((antigen) => {
                                        const currentGrid = getWidalGridFromParams(parameterValues, tName);
                                        return (
                                          <tr key={antigen} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-2.5 px-4 font-extrabold text-slate-900 border-r border-slate-200">
                                              {antigen}
                                            </td>
                                            {getWidalDilutions(tName).map((dil) => {
                                              const cellVal = currentGrid[antigen]?.[dil] || '-';
                                              const isPos = cellVal === '+' || String(cellVal).includes('+');
                                              return (
                                                <td key={dil} className="py-2 px-2 text-center border-r border-slate-200 last:border-r-0">
                                                  <div className="flex items-center justify-center gap-1.5">
                                                    <input
                                                      type="text"
                                                      value={cellVal}
                                                      onChange={(e) => handleWidalCellUpdate(antigen, dil, e.target.value, tName)}
                                                      className={`w-10 h-7 text-center font-extrabold rounded border text-xs outline-none focus:ring-1 focus:ring-blue-500 ${
                                                        isPos ? 'bg-red-50 text-red-700 border-red-300' : 'bg-slate-50 text-slate-700 border-slate-200'
                                                      }`}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => handleWidalCellUpdate(antigen, dil, isPos ? '-' : '+', tName)}
                                                      className={`w-6 h-7 rounded font-black text-xs cursor-pointer border flex items-center justify-center transition-colors ${
                                                        isPos ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                                      }`}
                                                      title="Toggle +/-"
                                                    >
                                                      {isPos ? '-' : '+'}
                                                    </button>
                                                  </div>
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Comment Bar */}
                                <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700">Comment:</span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleWidalCommentUpdate('POSITIVE')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer border transition-colors ${
                                          (parameterValues['widal_comment'] || 'POSITIVE') === 'POSITIVE'
                                            ? 'bg-red-600 text-white border-red-700 shadow-xs'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                        }`}
                                      >
                                        POSITIVE
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleWidalCommentUpdate('NEGATIVE')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer border transition-colors ${
                                          (parameterValues['widal_comment'] || 'POSITIVE') === 'NEGATIVE'
                                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                        }`}
                                      >
                                        NEGATIVE
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={parameterValues['widal_comment'] || 'POSITIVE'}
                                      onChange={(e) => handleWidalCommentUpdate(e.target.value)}
                                      placeholder="e.g. POSITIVE or NEGATIVE"
                                      className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500 w-44"
                                    />
                                  </div>
                                  <div className="text-xs font-bold text-slate-600">
                                    Final Comment: <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">WIDAL TEST {parameterValues['widal_comment'] || 'POSITIVE'}</span>
                                  </div>
                                </div>
                                {/* Clinical Note */}
                                <div className="p-3.5 bg-white border-t border-slate-200 text-[11px] leading-relaxed text-slate-600">
                                  <p>
                                    <span className="font-bold text-slate-800">Note: </span>
                                    {getWidalNote(tName)}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            const patientGender = String(selectedRequest?.patientId?.gender || selectedRequest?.patientGender || '').trim().toLowerCase();
                            const isFemalePatient = patientGender.startsWith('f');
                            const isMalePatient = patientGender.startsWith('m');

                            const genderFiltered = (params || []).filter((p) => {
                              const pGender = String(p.gender || 'both').trim().toLowerCase();
                              if (pGender === 'both' || !pGender || pGender === 'all') return true;
                              if (pGender === 'male' || pGender === 'm') return isMalePatient || !patientGender;
                              if (pGender === 'female' || pGender === 'f') return isFemalePatient || !patientGender;
                              return true;
                            });

                            const displayParams = genderFiltered.length > 0 ? genderFiltered : (params || []);

                            return displayParams.map((p, pIdx, filteredArr) => {
                            const isBad = isOutOfRange(p.name, parameterValues[p.name]);
                            const isRemarksExpanded = expandedRemarks[p.name];
                            const hasRefRangeOrRules = (p.referenceRange && p.referenceRange.trim().length > 0 && !p.referenceRange.toLowerCase().includes('standards') && !p.referenceRange.toLowerCase().includes('as per')) || (Array.isArray(p.referenceRules) && p.referenceRules.length > 0);
                            const formulaInfo = getParamFormula(p.name, p);
                            const isGroupHeaderNeeded = p.group && (pIdx === 0 || filteredArr[pIdx - 1]?.group !== p.group);
                            const isMorphologyParam = p.fieldType === 'RichText' || p.fieldType === 'Multiline' || (p.group && p.group.toLowerCase().includes('morphology')) || p.name.toLowerCase().includes('morphology');

                            return (
                              <React.Fragment key={p.name}>
                                {isGroupHeaderNeeded && (
                                  <tr className="bg-slate-50/70 border-t border-slate-100">
                                    <td colSpan="4" className="py-2 px-5 pl-8 font-bold text-slate-800 text-xs">
                                      <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" defaultChecked className="rounded text-orange-500 cursor-pointer" />
                                        <span className="text-slate-900 font-extrabold">{p.group}</span>
                                      </label>
                                    </td>
                                  </tr>
                                )}
                                <tr className={`hover:bg-slate-50/30 transition-colors ${skippedParameters[p.name] ? 'opacity-50 bg-slate-50/50' : ''}`}>
                                  {/* TEST NAME */}
                                  <td className={`py-3 px-5 font-bold text-slate-700 ${p.group ? 'pl-16 text-slate-600' : 'pl-10'} ${isMorphologyParam ? 'align-top pt-4' : ''}`}>
                                    {isEditLayoutMode ? (
                                      <div className="flex flex-col gap-1.5 max-w-sm">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={customFieldDisplayNames[p.name] !== undefined ? customFieldDisplayNames[p.name] : (p.displayName || p.name)}
                                            onChange={(e) => setCustomFieldDisplayNames(prev => ({ ...prev, [p.name]: e.target.value }))}
                                            className="h-8 px-2.5 bg-blue-50/60 border border-blue-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 w-full"
                                            placeholder="Field Display Name..."
                                            title="Edit field name for this report"
                                          />
                                        </div>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold select-none text-slate-600">
                                          <input
                                            type="checkbox"
                                            checked={!skippedParameters[p.name]}
                                            onChange={(e) => setSkippedParameters(prev => ({ ...prev, [p.name]: !e.target.checked }))}
                                            className="rounded text-blue-600 cursor-pointer"
                                          />
                                          <span className={skippedParameters[p.name] ? 'text-red-500 font-extrabold' : 'text-emerald-700 font-bold'}>
                                            {skippedParameters[p.name] ? '✕ Skipped (Won’t fill or print)' : '✓ Included in Report & Print'}
                                          </span>
                                        </label>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className={skippedParameters[p.name] ? 'line-through text-slate-400' : ''}>
                                          {customFieldDisplayNames[p.name] || p.displayName || p.name}
                                        </span>
                                        {skippedParameters[p.name] && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                            Skipped
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>

                                  {/* VALUE INPUT */}
                                  <td className="py-3 px-5">
                                    {isMorphologyParam ? (
                                      <div className="flex items-start gap-2 w-full">
                                        <div className="flex-1 border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                        {/* Editor Toolbar with Bold Button */}
                                        <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => handleToggleBold(p.name)}
                                              className="w-6 h-6 rounded flex items-center justify-center font-black text-xs text-slate-900 hover:bg-slate-200 border border-slate-300 bg-white cursor-pointer shadow-2xs"
                                              title="Bold text"
                                            >
                                              B
                                            </button>
                                          </div>
                                        </div>

                                        {/* Multiline observation textarea */}
                                        <div className="p-2.5 bg-white">
                                          <textarea
                                            id={`morphology-editor-${p.name}`}
                                            rows={3}
                                            value={parameterValues[p.name] || ''}
                                            onChange={(e) => handleParamValueChange(p.name, e.target.value)}
                                            placeholder="Enter morphology observations..."
                                            className="w-full text-xs font-medium text-slate-800 outline-none resize-y border-none bg-transparent min-h-[60px]"
                                          />
                                        </div>

                                        {/* Editor Bottom Actions */}
                                        <div className="bg-slate-50/70 border-t border-slate-200/80 px-3 py-1.5 flex items-center justify-between text-[11px]">
                                          <div className="flex items-center gap-4">
                                            <div className="relative">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (activeMorphologyTemplatePicker === p.name) {
                                                    setActiveMorphologyTemplatePicker('');
                                                  } else {
                                                    setActiveMorphologyTemplatePicker(p.name);
                                                  }
                                                }}
                                                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer select-none"
                                              >
                                                <span className="font-black text-xs">⊕</span>
                                                <span>Add template</span>
                                              </button>

                                              {/* Template Dropdown Selector */}
                                              {activeMorphologyTemplatePicker === p.name && (
                                                <div className="absolute left-0 bottom-full mb-1 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 text-xs">
                                                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5">
                                                    <span className="font-bold text-slate-800">Select Template</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => setActiveMorphologyTemplatePicker('')}
                                                      className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                                                    >
                                                      ✕
                                                    </button>
                                                  </div>
                                                  <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {(STANDARD_MORPHOLOGY_TEMPLATES[p.displayName || p.name] || STANDARD_MORPHOLOGY_TEMPLATES['RBC Morphology']).map((tpl, tIdx) => (
                                                      <button
                                                        key={tIdx}
                                                        type="button"
                                                        onClick={() => {
                                                          handleParamValueChange(p.name, tpl);
                                                          setActiveMorphologyTemplatePicker('');
                                                        }}
                                                        className="w-full text-left p-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-900 transition-colors cursor-pointer text-[11px] leading-snug border border-transparent hover:border-blue-100"
                                                      >
                                                        {tpl}
                                                      </button>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => handleSaveMorphologyAsDefault(p.name)}
                                              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer select-none"
                                            >
                                              <Save className="w-3 h-3" />
                                              <span>Save as default</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Plus Menu */}
                                      <div className="relative pt-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (activePlusMenu === p.name) {
                                              setActivePlusMenu('');
                                            } else {
                                              setActivePlusMenu(p.name);
                                              setActiveValueOptionsDropdown('');
                                            }
                                          }}
                                          className="w-6 h-6 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 font-extrabold cursor-pointer shrink-0"
                                          title="Add remark"
                                        >
                                          +
                                        </button>

                                        {activePlusMenu === p.name && (
                                          <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 text-xs font-semibold text-slate-700 space-y-0.5 animate-in fade-in slide-in-from-top-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setExpandedRemarks({ ...expandedRemarks, [p.name]: true });
                                                setActivePlusMenu('');
                                              }}
                                              className="w-full px-2.5 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer text-slate-800"
                                            >
                                              <span>💬</span>
                                              <span>Add remark</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 w-full">
                                      {(() => {
                                        const status = getValueRangeStatus(p.name, parameterValues[p.name]);
                                        if (!status) return null;
                                        return (
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider animate-in zoom-in-50 duration-150 shrink-0 ${
                                            status === 'H' 
                                              ? 'bg-red-100 text-red-700 border border-red-200' 
                                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                                          }`}>
                                            {status}
                                          </span>
                                        );
                                      })()}
                                      {formulaInfo && (
                                        <div className="relative group shrink-0">
                                          <span className="w-5 h-5 flex items-center justify-center rounded border border-blue-400 bg-blue-50 text-blue-700 font-serif font-black text-xs cursor-help select-none shadow-2xs">
                                            ƒ
                                          </span>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl animate-in fade-in zoom-in-95 pointer-events-none">
                                            {formulaInfo}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                          </div>
                                        </div>
                                      )}
                                      <div className="relative flex-1">
                                        <div className="relative">
                                          <input
                                            type="text"
                                            value={parameterValues[p.name] || ''}
                                            onChange={(e) => handleParamValueChange(p.name, e.target.value)}
                                            onClick={() => {
                                              const hasOpts = (p.valueOptions || []).length > 0;
                                              if (!hasOpts && hasRefRangeOrRules) return;
                                              if (activeValueOptionsDropdown === p.name) {
                                                setActiveValueOptionsDropdown('');
                                              } else {
                                                setActiveValueOptionsDropdown(p.name);
                                                setNewValueOptionText('');
                                                setNewValueOptionAbnormal(false);
                                                setEditingValueOptionIdx(null);
                                              }
                                            }}
                                            placeholder="Value..."
                                            className={`w-full px-3.5 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white border cursor-pointer ${
                                              isBad 
                                                ? 'border-red-500 bg-red-50 text-red-600 font-black focus:ring-red-500' 
                                                : formulaInfo
                                                  ? 'border-amber-400 bg-amber-50/20 text-slate-900 focus:border-amber-500'
                                                  : 'border-slate-200 bg-slate-50 text-slate-800'
                                            }`}
                                          />
                                          {((p.valueOptions || []).length > 0 || !hasRefRangeOrRules) && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (activeValueOptionsDropdown === p.name) {
                                                  setActiveValueOptionsDropdown('');
                                                } else {
                                                  setActiveValueOptionsDropdown(p.name);
                                                  setNewValueOptionText('');
                                                  setNewValueOptionAbnormal(false);
                                                  setEditingValueOptionIdx(null);
                                                }
                                              }}
                                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                                              title="Select from value options"
                                            >
                                              ▼
                                            </button>
                                          )}
                                        </div>

                                        {/* VALUE CHOICE CONFIG DROPDOWN CARD OVERLAY */}
                                        {activeValueOptionsDropdown === p.name && (
                                          <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 z-40 text-xs font-semibold text-slate-700 space-y-3">
                                            
                                            {/* Predefined Choices List */}
                                            <div className="max-h-32 overflow-y-auto divide-y divide-slate-100">
                                              {(p.valueOptions || []).length === 0 ? (
                                                <div className="text-[10px] text-slate-400 py-1 font-medium">No options configured. Add one below.</div>
                                              ) : (
                                                (p.valueOptions || []).map((opt, oIdx) => (
                                                  <div key={oIdx} className="flex items-center justify-between py-1.5 hover:bg-slate-50 rounded px-1 transition-colors">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        handleParamValueChange(p.name, opt.value);
                                                        setActiveValueOptionsDropdown('');
                                                      }}
                                                      className="flex-1 text-left font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                      <span>{opt.value}</span>
                                                      {opt.isAbnormal && (
                                                        <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-600 font-extrabold text-[8px] tracking-wide uppercase">
                                                          Abnormal
                                                        </span>
                                                      )}
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setNewValueOptionText(opt.value);
                                                          setNewValueOptionAbnormal(opt.isAbnormal);
                                                          setEditingValueOptionIdx(oIdx);
                                                        }}
                                                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                                                        title="Edit Option"
                                                      >
                                                        📝
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleDeleteValueOption(p.name, oIdx)}
                                                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                                                        title="Delete Option"
                                                      >
                                                        🗑
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))
                                              )}
                                            </div>

                                            {/* Add Option Input Row */}
                                            <div className="border-t border-slate-100 pt-2 space-y-2">
                                              <input
                                                type="text"
                                                value={newValueOptionText}
                                                onChange={(e) => setNewValueOptionText(e.target.value)}
                                                placeholder="Enter choice value..."
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-400"
                                              />
                                              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-600">
                                                <input
                                                  type="checkbox"
                                                  checked={newValueOptionAbnormal}
                                                  onChange={(e) => setNewValueOptionAbnormal(e.target.checked)}
                                                  className="rounded text-red-500 cursor-pointer focus:ring-red-500"
                                                />
                                                <span>Abnormal</span>
                                              </label>
                                            </div>

                                            {/* Card Footer Actions */}
                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setActiveValueOptionsDropdown('');
                                                  setNewValueOptionText('');
                                                  setNewValueOptionAbnormal(false);
                                                  setEditingValueOptionIdx(null);
                                                }}
                                                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleSaveValueOption(p.name)}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                              >
                                                Save
                                              </button>
                                            </div>

                                          </div>
                                        )}
                                      </div>

                                      {/* Unified Plus Action Menu Card */}
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (activePlusMenu === p.name) {
                                              setActivePlusMenu('');
                                            } else {
                                              setActivePlusMenu(p.name);
                                              setActiveValueOptionsDropdown('');
                                            }
                                          }}
                                          className="w-6 h-6 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 font-extrabold cursor-pointer shrink-0"
                                          title="Add remarks / choices menu"
                                        >
                                          +
                                        </button>

                                        {activePlusMenu === p.name && (
                                          <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 text-xs font-semibold text-slate-700 space-y-0.5 animate-in fade-in slide-in-from-top-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setExpandedRemarks({ ...expandedRemarks, [p.name]: true });
                                                setActivePlusMenu('');
                                              }}
                                              className="w-full px-2.5 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer text-slate-800"
                                            >
                                              <span>💬</span>
                                              <span>Add remark</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveValueOptionsDropdown(p.name);
                                                setActivePlusMenu('');
                                                setNewValueOptionText('');
                                                setNewValueOptionAbnormal(false);
                                                setEditingValueOptionIdx(null);
                                              }}
                                              className="w-full px-2.5 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer text-slate-800 border-t border-slate-100/80"
                                            >
                                              <span>⚙️</span>
                                              <span>Add value choices</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* UNIT */}
                                <td className={`py-3 px-5 font-semibold text-slate-500 ${isMorphologyParam ? 'align-top pt-4' : ''}`}>
                                  {p.unit || '—'}
                                </td>

                                {/* REFERENCE RANGE CONFIG */}
                                <td className={`py-3 px-5 font-bold text-slate-700 ${isMorphologyParam ? 'align-top pt-4' : ''}`}>
                                  {isMorphologyParam ? (
                                    <span>{p.referenceRange || '—'}</span>
                                  ) : (
                                    <div className="flex items-center justify-between gap-2">
                                      <span>{p.referenceRange || 'As per standards'}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowRuleModalParam(p.name);
                                          setRuleModalRules(p.referenceRules || []);
                                        }}
                                        className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white font-extrabold hover:bg-slate-800 cursor-pointer shrink-0"
                                        title="Configure reference rules"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            {isRemarksExpanded && (
                              <tr className="bg-slate-50/20 border-b border-slate-100">
                                <td colSpan="4" className="py-2 px-10">
                                  <div className="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-lg border border-slate-200 animate-in slide-in-from-top-1 duration-150">
                                    <span className="text-[10px] text-slate-500 font-bold italic whitespace-nowrap">Remarks (optional):</span>
                                    <input
                                      type="text"
                                      value={parameterRemarks[p.name] || ''}
                                      onChange={(e) => setParameterRemarks({ ...parameterRemarks, [p.name]: e.target.value })}
                                      placeholder="Enter optional remarks for this parameter..."
                                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-400 shadow-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setParameterRemarks({ ...parameterRemarks, [p.name]: '' });
                                        setExpandedRemarks({ ...expandedRemarks, [p.name]: false });
                                      }}
                                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 border border-transparent hover:border-red-200 cursor-pointer transition-colors"
                                      title="Clear remarks"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      });
                    })())}
                    </React.Fragment>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* LOWER SECTION: TECHNICIAN INPUTS / EXPANSIONS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowReportEntryTab(showReportEntryTab === 'notes' ? '' : 'notes')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  showReportEntryTab === 'notes' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>+ Notes</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportEntryTab(showReportEntryTab === 'remarks' ? '' : 'remarks')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  showReportEntryTab === 'remarks' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>+ Remarks</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportEntryTab(showReportEntryTab === 'advice' ? '' : 'advice')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  showReportEntryTab === 'advice' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>+ Advice</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportEntryTab(showReportEntryTab === 'interpretation' ? '' : 'interpretation')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  showReportEntryTab === 'interpretation' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>+ Add Interpretation</span>
              </button>
            </div>

            {/* Expansion Textareas */}
            {showReportEntryTab === 'notes' && (
              <div className="space-y-1 animate-in fade-in duration-100">
                <label className="block text-xs font-bold text-slate-700">Technician Notes</label>
                <textarea
                  rows="2"
                  value={reportNotes}
                  onChange={(e) => {
                    setReportNotes(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500 overflow-hidden min-h-[60px]"
                />
              </div>
            )}
            {showReportEntryTab === 'remarks' && (
              <div className="space-y-1 animate-in fade-in duration-100">
                <label className="block text-xs font-bold text-slate-700">Remarks</label>
                <textarea
                  rows="2"
                  value={reportRemarks}
                  onChange={(e) => {
                    setReportRemarks(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500 overflow-hidden min-h-[60px]"
                />
              </div>
            )}
            {showReportEntryTab === 'advice' && (
              <div className="space-y-1 animate-in fade-in duration-100">
                <label className="block text-xs font-bold text-slate-700">Advice</label>
                <textarea
                  rows="2"
                  value={reportAdvice}
                  onChange={(e) => {
                    setReportAdvice(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500 overflow-hidden min-h-[60px]"
                />
              </div>
            )}
            {showReportEntryTab === 'interpretation' && (
              <div className="space-y-3 animate-in fade-in duration-100 border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">Interpretation</label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Use <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Shift</kbd> + <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Enter</kbd> key to go to new line.
                  </span>
                </div>

                {/* Pink library tip banner */}
                <div className="flex items-center gap-2 px-3 py-2 bg-pink-50 border border-pink-100 rounded-lg text-pink-700 text-[10px] font-bold">
                  <span>📖</span>
                  <span>You can now copy interpretations from Library to update.</span>
                  <span className="bg-pink-200 text-pink-800 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
                </div>

                {/* Editor Toolbar Simulator */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  <div className="flex flex-wrap items-center gap-2.5 p-2 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded cursor-pointer text-[10px]">Paragraph ▾</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded cursor-pointer text-[10px]">12pt ▾</span>
                    <span className="w-px h-4 bg-slate-200"></span>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('report-interpretation-textarea');
                        if (!el) {
                          setReportInterpretation(reportInterpretation ? `${reportInterpretation} <b></b>` : '<b></b>');
                          return;
                        }
                        const start = el.selectionStart;
                        const end = el.selectionEnd;
                        if (start !== undefined && end !== undefined && start !== end) {
                          const selected = reportInterpretation.substring(start, end);
                          const before = reportInterpretation.substring(0, start);
                          const after = reportInterpretation.substring(end);
                          setReportInterpretation(before + `<b>${selected}</b>` + after);
                        } else {
                          setReportInterpretation(reportInterpretation ? `${reportInterpretation} <b>bold text</b>` : '<b>bold text</b>');
                        }
                      }}
                      className="px-2 py-0.5 hover:bg-slate-200 bg-white border border-slate-300 rounded font-black text-xs cursor-pointer shadow-2xs"
                      title="Bold"
                    >
                      B
                    </button>
                    
                    {/* Table Dropdown Menu */}
                    <div className="relative inline-block text-left group">
                      <button
                        type="button"
                        className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-xs font-bold cursor-pointer shadow-2xs flex items-center gap-1"
                        title="Table Tools"
                      >
                        <span>田</span>
                        <span>Table ▾</span>
                      </button>
                      <div className="hidden group-hover:block absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 text-[11px] font-semibold text-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            const glucoseTable = `<table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 33.3%;">Fasting Glucose</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 33.3%;">2 hours PP Glucose</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 33.3%;">Diagnosis</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">&lt;100</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">&lt;140</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Normal</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">100 to 125</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">140 to 199</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Pre Diabetes</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">&gt;126</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">&gt;200</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Diabetes</td>
    </tr>
  </tbody>
</table>`;
                            setReportInterpretation(reportInterpretation ? `${reportInterpretation}\n${glucoseTable}` : glucoseTable);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer"
                        >
                          ➕ Insert Diabetes Diagnosis Table (3x3)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const causesTable = `<table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 25%;"></th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 37.5%;">High</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 37.5%;">Low</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">RBC, Hb, or HCT</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Dehydration, polycythemia, shock, chronic hypoxia</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Anemia, thalassemia, and other hemoglobinopathies</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">MCV</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Macrocytic anemia, liver disease</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Microcytic anemia</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">WBC</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Acute stress, infection, malignancies</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Sepsis, marrow hypoplasia</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">Platelets</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Risk of thrombosis</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Risk of bleeding</td>
    </tr>
  </tbody>
</table>`;
                            setReportInterpretation(reportInterpretation ? `${reportInterpretation}\n${causesTable}` : causesTable);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer"
                        >
                          ➕ Insert Abnormal Causes Table
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const blankTable = `<table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px;">Header 1</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px;">Header 2</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px;">Header 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Cell 1</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Cell 2</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Cell 3</td>
    </tr>
  </tbody>
</table>`;
                            setReportInterpretation(reportInterpretation ? `${reportInterpretation}\n${blankTable}` : blankTable);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer"
                        >
                          ➕ Insert Blank 3x2 Table
                        </button>
                      </div>
                    </div>

                    <span className="w-px h-4 bg-slate-200"></span>
                    <button
                      type="button"
                      onClick={() => setReportInterpretation(reportInterpretation ? `<p style="text-align: left;">${reportInterpretation}</p>` : '')}
                      className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                      title="Align Left"
                    >
                      ≡
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportInterpretation(reportInterpretation ? `<p style="text-align: center;">${reportInterpretation}</p>` : '')}
                      className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                      title="Align Center"
                    >
                      ≡
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportInterpretation(reportInterpretation ? `<p style="text-align: right;">${reportInterpretation}</p>` : '')}
                      className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                      title="Align Right"
                    >
                      ≡
                    </button>
                  </div>
                  <textarea
                    id="report-interpretation-textarea"
                    rows={8}
                    value={reportInterpretation}
                    onChange={(e) => setReportInterpretation(e.target.value)}
                    placeholder="Enter default clinical interpretation findings here..."
                    className="w-full p-4 bg-white text-xs font-mono text-slate-800 outline-none resize-y min-h-[160px] focus:bg-white"
                  />
                  {reportInterpretation && (
                    <div className="bg-slate-50/90 border-t border-slate-200 p-3 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Formatted Live Preview:</span>
                      <div
                        className="bg-white p-3 rounded-lg border border-slate-200 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:p-1.5 [&_th]:bg-slate-50 [&_th]:font-bold [&_td]:border [&_td]:border-slate-300 [&_td]:p-1.5 leading-normal"
                        dangerouslySetInnerHTML={{ __html: reportInterpretation }}
                      />
                    </div>
                  )}
                  <div className="bg-slate-50 border-t border-slate-200 px-3 py-1 flex items-center justify-between text-[9px] text-slate-500 font-bold">
                    <span>P &gt; STRONG</span>
                    <span>Ready</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 font-bold">
                  For best results use formatting options available in the editor. Use clear formatting when you copy paste text.
                </p>

                {/* Actions Row */}
                {/* Actions Row */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveInterpretationToTemplate();
                      setShowReportEntryTab('');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportEntryTab('')}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportInterpretation('');
                      setShowReportEntryTab('');
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                  <label className="ml-auto flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 select-none bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={printInterpretation}
                      onChange={(e) => setPrintInterpretation(e.target.checked)}
                      className="rounded text-blue-600 cursor-pointer w-4 h-4"
                    />
                    <span>Print interpretation in report</span>
                  </label>
                </div>
              </div>
            )}

            {/* Formatted Interpretations View Card */}
            {reportInterpretation && reportInterpretation.trim() !== '' && showReportEntryTab !== 'interpretation' && (
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-xs">Interpretations</span>
                    <button
                      type="button"
                      onClick={() => setShowReportEntryTab('interpretation')}
                      className="px-2 py-0.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </button>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 select-none bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={printInterpretation}
                      onChange={(e) => setPrintInterpretation(e.target.checked)}
                      className="rounded text-blue-600 cursor-pointer w-3.5 h-3.5"
                    />
                    <span>Print in report</span>
                  </label>
                </div>
                <div>
                  {(() => {
                    const text = reportInterpretation || '';
                    const trimmed = text.trim();
                    if (trimmed.includes('<table') || trimmed.includes('<p>') || trimmed.includes('<strong>') || trimmed.includes('<b>') || trimmed.includes('<br')) {
                      return (
                        <div
                          className="text-slate-800 space-y-2 [&_table]:w-full [&_table]:border-collapse [&_table]:my-2.5 [&_th]:border [&_th]:border-slate-300 [&_th]:p-1.5 [&_th]:bg-slate-50 [&_th]:font-bold [&_td]:border [&_td]:border-slate-300 [&_td]:p-1.5 leading-normal text-xs"
                          dangerouslySetInnerHTML={{ __html: text }}
                        />
                      );
                    }

                    const lines = text.split('\n');
                    const elements = [];
                    let inTable = false;
                    let tableRows = [];

                    const flushTable = (k) => {
                      if (tableRows.length > 0) {
                        elements.push(
                          <div key={`table-${k}`} className="my-2.5 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse border border-slate-300">
                              <thead>
                                {tableRows.slice(0, 1).map((row, rIdx) => (
                                  <tr key={rIdx} className="bg-slate-50 border-b border-slate-300">
                                    {row.map((cell, cIdx) => (
                                      <th key={cIdx} className="py-1.5 px-3 border border-slate-300 font-bold text-slate-900 text-[11px]">
                                        {cell}
                                      </th>
                                    ))}
                                  </tr>
                                ))}
                              </thead>
                              <tbody>
                                {tableRows.slice(1).map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-slate-50/50">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className={`py-1.5 px-3 border border-slate-300 text-[11px] ${cIdx === 0 ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                        tableRows = [];
                      }
                    };

                    lines.forEach((line, idx) => {
                      if (line.includes('|')) {
                        const isSeparator = line.replace(/[\s|:-]/g, '').length === 0;
                        if (!isSeparator) {
                          const rawCells = line.split('|').map(c => c.trim());
                          const cleanedCells = rawCells.filter((c, cIdx) => {
                            if ((cIdx === 0 || cIdx === rawCells.length - 1) && c === '') return false;
                            return true;
                          });
                          tableRows.push(cleanedCells.length > 0 ? cleanedCells : rawCells);
                          inTable = true;
                        }
                      } else {
                        if (inTable) {
                          flushTable(idx);
                          inTable = false;
                        }
                        const trimmedLine = line.trim();
                        if (trimmedLine) {
                          const isHeading = [
                            'LFT Interpretation',
                            'Test Significance',
                            'Clinical Notes',
                            'Possible causes of abnormal parameters',
                            'Peripheral Blood Smear',
                            'Physiological basis',
                            'Comments'
                          ].some(h => trimmedLine.toLowerCase() === h.toLowerCase());

                          const hasColonPrefix = trimmedLine.includes(':') && (
                            trimmedLine.toLowerCase().startsWith('increased in:') ||
                            trimmedLine.toLowerCase().startsWith('clinical notes:') ||
                            trimmedLine.toLowerCase().startsWith('notes:') ||
                            trimmedLine.toLowerCase().startsWith('interpretation:')
                          );
                          const hasDashPrefix = trimmedLine.includes(' - ') && (
                            trimmedLine.toLowerCase().startsWith('rbcs -') ||
                            trimmedLine.toLowerCase().startsWith('wbcs -') ||
                            trimmedLine.toLowerCase().startsWith('platelets -') ||
                            trimmedLine.toLowerCase().startsWith('impression -')
                          );

                          if (isHeading) {
                            elements.push(
                              <h5 key={`h-${idx}`} className="font-bold text-slate-900 text-xs mt-3 mb-1">
                                {trimmedLine}
                              </h5>
                            );
                          } else if (hasColonPrefix) {
                            const colonIdx = trimmedLine.indexOf(':');
                            const label = trimmedLine.substring(0, colonIdx + 1);
                            const val = trimmedLine.substring(colonIdx + 1);
                            elements.push(
                              <p key={`p-${idx}`} className="text-xs text-slate-700 leading-relaxed my-1">
                                <strong className="font-bold text-slate-900">{label}</strong>
                                {val}
                              </p>
                            );
                          } else if (hasDashPrefix) {
                            const dashIdx = trimmedLine.indexOf(' - ');
                            const label = trimmedLine.substring(0, dashIdx);
                            const val = trimmedLine.substring(dashIdx);
                            elements.push(
                              <p key={`p-${idx}`} className="text-xs text-slate-700 leading-relaxed my-1">
                                <strong className="font-bold text-slate-900">{label}</strong>
                                {val}
                              </p>
                            );
                          } else {
                            elements.push(
                              <p key={`p-${idx}`} className="text-xs text-slate-700 leading-relaxed my-1">
                                {trimmedLine}
                              </p>
                            );
                          }
                        }
                      }
                    });

                    if (inTable) {
                      flushTable('end');
                    }

                    return <div className="space-y-1">{elements}</div>;
                  })()}
                </div>
              </div>
            )}

            {/* More Details Remarks field (always visible at bottom) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">More details</label>
              <textarea
                rows="3"
                value={reportRemarks}
                onChange={(e) => {
                  setReportRemarks(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.max(e.target.scrollHeight, 70)}px`;
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.max(e.target.scrollHeight, 70)}px`;
                }}
                placeholder="Remarks details..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 overflow-hidden min-h-[70px]"
              />
            </div>

            {/* Authorized Signatory Configuration on Report */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" /> Authorized Signatory
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Select the doctor / pathologist whose signature stamp, name, and designation will show at the bottom right of the report.</p>
                </div>
                {signatories.length > 0 && (
                  <select
                    value={selectedSignatoryId}
                    onChange={(e) => setSelectedSignatoryId(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                  >
                    {signatories.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} — {s.designation}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Signatory Info Box */}
              {(() => {
                const activeSig = signatories.find(s => s._id === selectedSignatoryId) || (signatories.length > 0 ? signatories[0] : null);
                if (!activeSig) {
                  return (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between">
                      <span>No authorized signatories found. Please configure a signatory profile to display signature stamp and name on reports.</span>
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard?view=signatories')}
                        className="underline font-bold text-blue-600 cursor-pointer ml-2 whitespace-nowrap"
                      >
                        + Add Signatory
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-100 shrink-0">
                        {activeSig.name?.[0] || 'D'}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs leading-tight">{activeSig.name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">{activeSig.designation}</div>
                      </div>
                    </div>
                    {activeSig.signatureImageUrl ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-600 font-extrabold">✓ Stamp Attached</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeSig.signatureImageUrl} alt="Signature Preview" className="h-9 max-w-[100px] object-contain border border-slate-100 rounded bg-slate-50 p-1" />
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium italic">No stamp image</span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ACTION BUTTONS FOOTER BAR */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6">
            {/* Left Back Button */}
            <button
              type="button"
              onClick={() => {
                setShowReportEntryView(false);
                setSelectedRequest(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
            >
              Back
            </button>
            {/* Right Buttons */}
            <div className="flex items-center gap-3">
              {/* Sign off Dropdown Group */}
              <div className="flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => handleSaveReport('signed_off')}
                  disabled={savingReport}
                  className="px-4 py-2 text-xs font-bold border-r border-blue-500 cursor-pointer flex items-center gap-1.5"
                >
                  {savingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>✒️</span>}
                  <span>Sign off</span>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSignOffDropdown(!showSignOffDropdown)}
                    className="p-2 hover:bg-blue-800 text-white cursor-pointer h-full"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showSignOffDropdown && (
                    <div className="absolute right-0 bottom-full mb-2 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignOffDropdown(false);
                          if (matchedBill) {
                            handleOpenReceiptView({
                              rawBill: matchedBill,
                              regNo: selectedRequest.labId,
                              patientName: selectedRequest.patientId?.patientName,
                              ageSex: `${selectedRequest.patientId?.age} YRS/${selectedRequest.patientId?.gender?.[0]}`,
                              referredBy: selectedRequest.remarks || 'Self',
                              tests: testNames.join(', ')
                            });
                          } else {
                            alert('No billing record associated with this request.');
                          }
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-b border-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View bill</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignOffDropdown(false);
                          router.push(`/new-bill?patientId=${selectedRequest.patientId?._id || ''}&labId=${selectedRequest.labId || ''}`);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-b border-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Modify case</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignOffDropdown(false);
                          handleOpenReportPrint(selectedRequest);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Browse print</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Button */}
              <button
                type="button"
                onClick={() => handleSaveReport('completed')}
                disabled={savingReport}
                className="px-5 py-2 bg-orange-100 hover:bg-orange-200 border border-orange-200 text-orange-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                {savingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>✓</span>}
                <span>Final</span>
              </button>

              {/* Save Only (Draft) */}
              <button
                type="button"
                onClick={() => handleSaveReport('draft')}
                disabled={savingReport}
                className="px-5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Save only
              </button>
            </div>
          </div>

          {/* NORMAL VALUE REFERENCE RULES CONFIGURATION MODAL */}
          {showRuleModalParam && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Normal value - {showRuleModalParam}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRuleModalParam('')}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-4 text-xs">
                  {/* Select Type Row */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Select type</label>
                    <select className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg font-bold text-slate-800 outline-none cursor-pointer text-xs h-[30px]">
                      <option>Numeric range</option>
                    </select>
                  </div>

                  {/* Yellow Alert Box */}
                  <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-lg text-amber-800 flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-amber-800">Missing normal values:</span>
                    <span className="text-[10px] text-amber-700 font-semibold pl-2">• Male: 0 days - 100 yrs</span>
                    <span className="text-[10px] text-amber-700 font-semibold pl-2">• Female: 0 days - 100 yrs</span>
                  </div>

                  {/* Rules list */}
                  <div className="space-y-1.5">
                    {ruleModalRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-3 w-full py-2 border-b border-slate-100 last:border-0">
                        {/* Remove Rule Row Button (trash bin icon) */}
                        <button
                          type="button"
                          onClick={() => {
                            setRuleModalRules(ruleModalRules.filter((_, rIdx) => rIdx !== idx));
                          }}
                          className="text-slate-400 hover:text-red-500 cursor-pointer pt-4"
                          title="Remove rule row"
                        >
                          🗑
                        </button>

                        {/* Sex */}
                        <div className="w-24">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Sex</label>
                          <select
                            value={rule.sex || 'Any'}
                            onChange={(e) => {
                              const list = [...ruleModalRules];
                              list[idx].sex = e.target.value;
                              setRuleModalRules(list);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded outline-none font-bold text-slate-800 cursor-pointer"
                          >
                            <option value="Any">Any</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        {/* Min Age */}
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Min. age</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={rule.minAge ?? 0}
                              onChange={(e) => {
                                const list = [...ruleModalRules];
                                list[idx].minAge = parseInt(e.target.value) || 0;
                                setRuleModalRules(list);
                              }}
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-l-lg outline-none font-bold text-slate-800 text-xs h-[30px]"
                            />
                            <select
                              value={rule.minAgeUnit || 'Years'}
                              onChange={(e) => {
                                const list = [...ruleModalRules];
                                list[idx].minAgeUnit = e.target.value;
                                setRuleModalRules(list);
                              }}
                              className="px-2 py-1 border-y border-r border-slate-300 bg-slate-50 rounded-r-lg text-[11px] font-bold text-slate-600 outline-none cursor-pointer h-[30px]"
                            >
                              <option value="Days">Days</option>
                              <option value="Months">Months</option>
                              <option value="Years">Years</option>
                            </select>
                          </div>
                        </div>

                        {/* Max Age */}
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Max. age</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={rule.maxAge ?? 100}
                              onChange={(e) => {
                                const list = [...ruleModalRules];
                                list[idx].maxAge = parseInt(e.target.value) || 100;
                                setRuleModalRules(list);
                              }}
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-l-lg outline-none font-bold text-slate-800 text-xs h-[30px]"
                            />
                            <select
                              value={rule.maxAgeUnit || 'Years'}
                              onChange={(e) => {
                                const list = [...ruleModalRules];
                                list[idx].maxAgeUnit = e.target.value;
                                setRuleModalRules(list);
                              }}
                              className="px-2 py-1 border-y border-r border-slate-300 bg-slate-50 rounded-r-lg text-[11px] font-bold text-slate-600 outline-none cursor-pointer h-[30px]"
                            >
                              <option value="Days">Days</option>
                              <option value="Months">Months</option>
                              <option value="Years">Years</option>
                            </select>
                          </div>
                        </div>

                        {/* Lower value */}
                        <div className="w-24">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Lower value</label>
                          <input
                            type="text"
                            value={rule.lowerValue || ''}
                            onChange={(e) => {
                              const list = [...ruleModalRules];
                              list[idx].lowerValue = e.target.value;
                              setRuleModalRules(list);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg outline-none font-bold text-slate-800 text-xs h-[30px]"
                          />
                        </div>

                        {/* Upper value */}
                        <div className="w-24">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Upper value</label>
                          <input
                            type="text"
                            value={rule.upperValue || ''}
                            onChange={(e) => {
                              const list = [...ruleModalRules];
                              list[idx].upperValue = e.target.value;
                              setRuleModalRules(list);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg outline-none font-bold text-slate-800 text-xs h-[30px]"
                          />
                        </div>

                        {/* Displayed value */}
                        <div className="w-32">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Displayed in report as</label>
                          <div className="flex items-center gap-1.5 pt-1.5 text-xs text-slate-800">
                            <span className="font-extrabold">{rule.displayedValue || '-'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const val = prompt("Enter custom display range text:", rule.displayedValue || `${rule.lowerValue || '0'} – ${rule.upperValue || 'N/A'}`);
                                if (val !== null) {
                                  const list = [...ruleModalRules];
                                  list[idx].displayedValue = val;
                                  setRuleModalRules(list);
                                }
                              }}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
                              title="Edit display string"
                            >
                              📝
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add more button */}
                  <button
                    type="button"
                    onClick={() => {
                      setRuleModalRules([...ruleModalRules, {
                        sex: 'Any',
                        minAge: 0,
                        minAgeUnit: 'Years',
                        maxAge: 100,
                        maxAgeUnit: 'Years',
                        lowerValue: '',
                        upperValue: '',
                        displayedValue: ''
                      }]);
                    }}
                    className="px-3.5 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add more</span>
                  </button>

                  {/* Modal Footer buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowRuleModalParam('')}
                      className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateParameterRules(showRuleModalParam, ruleModalRules)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer shadow-xs"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  };

  if (showReportEntryView && selectedRequest) {
    return renderReportEntryView();
  }

  if (isSearchReportsView) {
    return (
      <DashboardLayout>
        <div className="space-y-4 pb-12 bg-white min-h-screen">
          
          {/* TITLE */}
          <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">
              Search lab reports
            </h1>
          </div>

          {/* FILTERS FORM MATCHING IMAGE 2 */}
          <div className="space-y-3 pt-1">
            {/* ROW 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold text-slate-700">
              
              {/* Duration (?) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <span>Duration</span>
                  <span className="text-slate-400 cursor-help" title="Select filter duration">ⓘ</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={searchDuration}
                    onChange={(e) => setSearchDuration(e.target.value)}
                    className="w-32 h-8 px-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="past_7_days">Past 7 days</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="past_30_days">Past 30 days</option>
                    <option value="this_month">This month</option>
                    <option value="last_month">Last month</option>
                    <option value="all">All time</option>
                  </select>
                  <div className="flex-1 h-8 px-2 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-1 text-[11px] text-slate-600 font-medium whitespace-nowrap overflow-hidden">
                    <span className="text-slate-400">📅</span>
                    <span className="truncate">{getDurationDateRangeStr(searchDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Patient first name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Patient first name</label>
                <input
                  type="text"
                  value={searchPatientName}
                  onChange={(e) => setSearchPatientName(e.target.value)}
                  placeholder=""
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Status</label>
                <select
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Select status</option>
                  <option value="new">New</option>
                  <option value="create_bill">Create bill</option>
                  <option value="in_progress">In progress</option>
                  <option value="final">Final</option>
                  <option value="signed_off">Signed off</option>
                </select>
              </div>

              {/* Referred by */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Referred by</label>
                <select
                  value={searchReferredBy}
                  onChange={(e) => setSearchReferredBy(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Select referrer</option>
                  <option value="Self">Self</option>
                  {availableReferrers.filter(r => r !== 'Self').map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end text-xs font-semibold text-slate-700">
              
              {/* Reg. no. */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Reg. no.</label>
                <input
                  type="text"
                  value={searchRegNo}
                  onChange={(e) => setSearchRegNo(e.target.value)}
                  placeholder=""
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Daily case no. */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Daily case no.</label>
                <input
                  type="text"
                  value={searchDailyCaseNo}
                  onChange={(e) => setSearchDailyCaseNo(e.target.value)}
                  placeholder=""
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* UHID */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">UHID</label>
                <input
                  type="text"
                  value={searchUhid}
                  onChange={(e) => setSearchUhid(e.target.value)}
                  placeholder=""
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Buttons: Show all filters / Search / Clear */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setShowAllFilters(!showAllFilters)}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer whitespace-nowrap"
                >
                  {showAllFilters ? 'Hide filters ^' : 'Show all filters v'}
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearSearchFilters}
                  className="h-8 px-3 text-slate-600 hover:text-slate-900 rounded-md text-xs font-semibold cursor-pointer hover:bg-slate-100"
                >
                  Clear
                </button>
              </div>

            </div>

            {/* ROW 3 (Expanded / Additional filters) */}
            {showAllFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs font-semibold text-slate-700">
                {/* Select test */}
                <div className="space-y-1">
                  <select
                    value={searchSelectedTest}
                    onChange={(e) => setSearchSelectedTest(e.target.value)}
                    className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">Select test</option>
                    {availableLabTests.map((t, idx) => (
                      <option key={t._id || idx} value={t.title || t.test}>
                        {t.title || t.test}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* TABLE OF SEARCH RESULTS MATCHING IMAGE 2 */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">REG. NO.</th>
                    <th className="py-3 px-4">DATE/TIME</th>
                    <th className="py-3 px-4">PATIENT</th>
                    <th className="py-3 px-4">REFERRED BY</th>
                    <th className="py-3 px-4">TESTS</th>
                    <th className="py-3 px-4">CC</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {loadingDashboard ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500 mb-1" />
                        <span>Loading search reports...</span>
                      </td>
                    </tr>
                  ) : searchFilteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                        No lab reports match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    searchFilteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* REG. NO. */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{report.regNo}</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">{report.modBadge}</div>
                        </td>

                        {/* DATE/TIME */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{report.dateStr}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{report.time}</div>
                        </td>

                        {/* PATIENT */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{report.patientName}</div>
                          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            <span>{report.ageSex}</span>
                            <span className="text-slate-400 text-[10px]">A ▾</span>
                          </div>
                        </td>

                        {/* REFERRED BY */}
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {report.referredBy}
                        </td>

                        {/* TESTS */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {report.tests}
                        </td>

                        {/* CC */}
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {report.cc}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-4">
                          {report.statusCategory === 'final' ? (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white shadow-2xs">
                              Final
                            </span>
                          ) : report.statusCategory === 'in_progress' ? (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white shadow-2xs">
                              In progress
                            </span>
                          ) : report.statusCategory === 'create_bill' ? (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-orange-500 text-white shadow-2xs">
                              Create bill
                            </span>
                          ) : report.statusCategory === 'signed_off' ? (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-600 text-white shadow-2xs">
                              Signed off
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                              New
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 font-semibold text-xs text-blue-600">
                            {report.statusCategory === 'create_bill' ? (
                              <button
                                type="button"
                                onClick={() => handleCreateBillFromOpd(report)}
                                className="hover:underline flex items-center gap-1 cursor-pointer text-orange-600 font-bold"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Create bill</span>
                              </button>
                            ) : (report.statusCategory === 'final' || report.statusCategory === 'signed_off') ? (
                              <button
                                type="button"
                                onClick={() => handleOpenReportPrint(report.rawRequest)}
                                className="hover:underline flex items-center gap-1 cursor-pointer text-emerald-700 font-bold"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print report</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenProcessRequest(report.rawRequest)}
                                className="hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Enter results</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => (report.statusCategory === 'final' || report.statusCategory === 'signed_off') ? handleOpenReportPrint(report.rawRequest) : handleOpenReceiptView(report)}
                              className="hover:underline flex items-center gap-1 cursor-pointer text-slate-700 hover:text-blue-600"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{(report.statusCategory === 'final' || report.statusCategory === 'signed_off') ? 'View report' : 'View'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptView(report)}
                              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
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
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF AUTHORIZED SIGNATURES VIEW IS SELECTED
  if (isSignatoriesView) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" /> Authorized Signatories
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure doctors, pathologists, and specialists authorized to review and sign lab reports
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSignatoryId(null);
                setSignatoryForm({ name: '', designation: '', qualification: '', signatureImageUrl: '' });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Signatory</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side: Signatory Form Card */}
            <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingSignatoryId ? 'Edit Signatory Profile' : 'Create Signatory Profile'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Specify credentials and upload signature stamp</p>
              </div>

              <form onSubmit={handleSaveSignatory} className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Doctor / Pathologist Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={signatoryForm.name}
                    onChange={(e) => setSignatoryForm({ ...signatoryForm, name: e.target.value })}
                    placeholder="e.g. Dr. Satish Kumar"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Designation / Role <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={signatoryForm.designation}
                    onChange={(e) => setSignatoryForm({ ...signatoryForm, designation: e.target.value })}
                    placeholder="e.g. Consultant Pathologist"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">Signature Stamp Image</label>
                  <div className="relative w-44 h-24 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl flex flex-col items-center justify-center overflow-hidden">
                    {uploadingSign ? (
                      <div className="flex flex-col items-center gap-1">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-[10px] text-slate-400 font-bold">Uploading...</span>
                      </div>
                    ) : signatoryForm.signatureImageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={signatoryForm.signatureImageUrl}
                          alt="Signature Preview"
                          className="w-full h-full object-contain p-2"
                        />
                        <button
                          type="button"
                          onClick={() => setSignatoryForm({ ...signatoryForm, signatureImageUrl: '' })}
                          className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg border border-red-200 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 text-center p-2 gap-1">
                        <UserCheck className="w-6 h-6 text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-400">No Image Uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSignatureUpload}
                      className="hidden" 
                      id="signatory-file-picker" 
                    />
                    <label 
                      htmlFor="signatory-file-picker"
                      className="inline-block px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold cursor-pointer transition-all border border-blue-200/50"
                    >
                      Choose Signature File
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium">Supported file formats: jpeg, jpg, png (Max 200kb)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  {editingSignatoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSignatoryId(null);
                        setSignatoryForm({ name: '', designation: '', qualification: '', signatureImageUrl: '' });
                      }}
                      className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingSignatory}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                  >
                    {savingSignatory ? 'Saving...' : editingSignatoryId ? 'Update Profile' : 'Save Signatory'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side: Active Signatories Directory Grid */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Signatories Directory</h3>
                <span className="text-xs text-slate-500 font-semibold">{signatories.length} Active Profiles</span>
              </div>

              {loadingSignatories ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold mt-2">Loading signatory list...</p>
                </div>
              ) : signatories.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700 text-xs">No Authorized Signatories Found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Please add a signatory profile using the left config card.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {signatories.map((sig) => (
                    <div
                      key={sig._id}
                      className="border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-2xs transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm shrink-0 border border-blue-100">
                          {sig.name?.[0] || 'D'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm truncate leading-tight">{sig.name}</h4>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">{sig.designation}</p>
                          <p className="text-[11px] text-slate-400 font-medium truncate">{sig.qualification}</p>
                        </div>
                      </div>

                      {sig.signatureImageUrl && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center bg-slate-50/50 rounded-xl p-2 h-14">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sig.signatureImageUrl}
                            alt="Signature image"
                            className="max-h-full object-contain"
                          />
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-150 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleEditSignatory(sig)}
                          className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSignatory(sig._id)}
                          className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF ACTIVITIES & AUDIT TRAIL VIEW IS SELECTED
  if (isActivitiesView) {
    const totalActivitiesCount = allLabActivities.length;
    const requestsCount = allLabActivities.filter(a => a.category === 'requests').length;
    const samplesCount = allLabActivities.filter(a => a.category === 'samples').length;
    const resultsCount = allLabActivities.filter(a => a.category === 'results').length;
    const reportsCount = allLabActivities.filter(a => a.category === 'reports').length;
    const billingCount = allLabActivities.filter(a => a.category === 'billing').length;

    const totalBilled = labBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalCollected = labBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);

    return (
      <DashboardLayout>
        <div className="space-y-6 pb-12 bg-slate-50/50 min-h-screen">
          
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" /> Activities & Audit Trails
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                    <span>★</span>
                    <span>Tracking of lab module</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Chronological trail of lab working — test bookings, sample collections, parameter entries, diagnostic reports, and payments.
                </p>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => loadDashboardData()}
                className="px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                title="Refresh activities list"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loadingDashboard ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/new-bill')}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Request / Bill</span>
              </button>
            </div>
          </div>

          {/* TOP METRICS SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Activities */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Activities</span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalActivitiesCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">Tracked across entire lab module</p>
            </div>

            {/* Card 2: Test Orders */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Test Orders</span>
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-700">{requestsCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">OPD, IPD & Direct Walk-in</p>
            </div>

            {/* Card 3: Samples & Results */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Samples & Testing</span>
                <FlaskConical className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-700">{samplesCount + resultsCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">{samplesCount} collected • {resultsCount} tested</p>
            </div>

            {/* Card 4: Reports & Sign Offs */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Reports Finalized</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">{reportsCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">Verified & Sign-off stamped</p>
            </div>

            {/* Card 5: Billed Collections */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Billed & Payments</span>
                <Wallet className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-800">₹{totalCollected.toLocaleString('en-IN')}</div>
              <p className="text-[10px] text-slate-400 font-semibold">{billingCount} transaction records</p>
            </div>
          </div>

          {/* CONTROLS & FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            {/* Search & Selectors Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs font-semibold text-slate-700">
              
              {/* Search Bar */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={activitySearchQuery}
                  onChange={(e) => setActivitySearchQuery(e.target.value)}
                  placeholder="Search activities by patient, UHID, Lab ID, test name, doctor, ref..."
                  className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                {activitySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setActivitySearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Duration Selector */}
              <div className="md:col-span-4 flex items-center gap-1.5">
                <select
                  value={activityDuration}
                  onChange={(e) => setActivityDuration(e.target.value)}
                  className="h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="past_7_days">Past 7 days</option>
                  <option value="past_30_days">Past 30 days</option>
                  <option value="this_month">This month</option>
                  <option value="last_month">Last month</option>
                  <option value="all">All time</option>
                </select>
                <div className="flex-1 h-9 px-2.5 bg-slate-100/70 border border-slate-200 rounded-xl flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold truncate">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{getDurationDateRangeStr(activityDuration)}</span>
                </div>
              </div>

              {/* Source Filter (OPD / IPD / Direct) */}
              <div className="md:col-span-2">
                <select
                  value={activitySourceFilter}
                  onChange={(e) => setActivitySourceFilter(e.target.value)}
                  className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Sources</option>
                  <option value="OPD">OPD Orders</option>
                  <option value="IPD">IPD Orders</option>
                  <option value="Direct">Direct / Walk-in</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="md:col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActivitySearchQuery('');
                    setActivityCategoryFilter('all');
                    setActivitySourceFilter('all');
                    setActivityDuration('past_7_days');
                  }}
                  className="w-full h-9 px-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Reset all filters"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs with Counters */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              {[
                { key: 'all', label: 'All Activities', count: totalActivitiesCount, color: 'text-blue-700 bg-blue-50' },
                { key: 'requests', label: 'Orders & Requests', count: requestsCount, color: 'text-blue-700 bg-blue-50' },
                { key: 'samples', label: 'Sample Collections', count: samplesCount, color: 'text-amber-700 bg-amber-50' },
                { key: 'results', label: 'Results & Testing', count: resultsCount, color: 'text-indigo-700 bg-indigo-50' },
                { key: 'reports', label: 'Reports & Sign Offs', count: reportsCount, color: 'text-emerald-700 bg-emerald-50' },
                { key: 'billing', label: 'Billing & Payments', count: billingCount, color: 'text-purple-700 bg-purple-50' }
              ].map((tab) => {
                const isActive = activityCategoryFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActivityCategoryFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}

              <div className="ml-auto text-xs text-slate-400 font-semibold">
                Showing <strong className="text-slate-800">{filteredLabActivities.length}</strong> of {totalActivitiesCount} activities
              </div>
            </div>
          </div>

          {/* MAIN ACTIVITIES TIMELINE LIST */}
          <div className="space-y-3">
            {loadingDashboard ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Loading lab activity logs & audit trails...</p>
                <p className="text-xs text-slate-400 mt-1">Please wait while the system synchronizes all lab records.</p>
              </div>
            ) : filteredLabActivities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">No lab activities match your filters</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Try changing your search keywords, duration filter, or category tab to view other audit trail records.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActivitySearchQuery('');
                    setActivityCategoryFilter('all');
                    setActivitySourceFilter('all');
                    setActivityDuration('all');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  View All Lab Activities
                </button>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {filteredLabActivities.map((item) => {
                  const dateFormatted = item.timestamp.toLocaleDateString('en-GB');
                  const timeFormatted = item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const timeAgoStr = formatTimeAgo(item.timestamp);

                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline Dot & Icon */}
                      <div className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-white ${item.dotColor || 'bg-blue-500'}`}>
                        {item.category === 'requests' && <Plus className="w-3 h-3" />}
                        {item.category === 'samples' && <FlaskConical className="w-3 h-3" />}
                        {item.category === 'results' && <Edit3 className="w-3 h-3" />}
                        {item.category === 'reports' && <Check className="w-3 h-3" />}
                        {item.category === 'billing' && <Receipt className="w-3 h-3" />}
                      </div>

                      {/* Main Event Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all p-4 sm:p-5 space-y-3">
                        
                        {/* Header Row: Badges & Timestamp */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Category Badge */}
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border ${item.badgeColor}`}>
                              {item.categoryLabel}
                            </span>
                            
                            {/* Reg / Lab ID Pill */}
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 font-mono">
                              {item.labId}
                            </span>

                            {/* Source Badge */}
                            {item.source && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                item.source === 'IPD' ? 'bg-purple-100 text-purple-800' :
                                item.source === 'OPD' ? 'bg-blue-100 text-blue-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.source}
                              </span>
                            )}
                          </div>

                          {/* Date & Relative Time */}
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{dateFormatted}, {timeFormatted}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                              {timeAgoStr}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Details Pill Grid */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                          {/* Patient */}
                          <div className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1.5 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Patient: <strong className="text-slate-900">{item.patientName}</strong> {item.ageSex ? `(${item.ageSex})` : ''}</span>
                          </div>

                          {/* UHID */}
                          {item.uhid && item.uhid !== 'N/A' && (
                            <div className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 font-medium">
                              <span>UHID: <strong className="text-slate-900">{item.uhid}</strong></span>
                            </div>
                          )}

                          {/* Performed By */}
                          <div className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 font-medium flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Action By: <strong className="text-slate-900">{item.performedBy}</strong></span>
                          </div>

                          {/* Amount if Billing */}
                          {item.amount !== undefined && item.amount > 0 && (
                            <div className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold">
                              <span>Amount: ₹{item.amount.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <span>Audit Action:</span>
                            <span className="font-bold text-slate-700">{item.action}</span>
                          </div>

                          {/* Interactive Shortcuts */}
                          <div className="flex items-center gap-2 text-xs font-bold">
                            {/* If Lab Request Item */}
                            {item.rawRequest && (
                              <>
                                {(item.rawRequest.reportStatus === 'Completed' || item.rawRequest.reportStatus === 'Final' || item.rawRequest.reportStatus === 'Signed off') ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReportPrint(item.rawRequest)}
                                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>Print Report</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReportPrint(item.rawRequest)}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View Report</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProcessRequest(item.rawRequest)}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Enter Results</span>
                                  </button>
                                )}

                                {item.rawRequest.billingRecord && (
                                  <button
                                    type="button"
                                    onClick={() => setViewingReceiptData(item.rawRequest.billingRecord)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>View Bill</span>
                                  </button>
                                )}
                              </>
                            )}

                            {/* If Billing Item */}
                            {item.rawBill && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setViewingReceiptData(item.rawBill)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>View Receipt</span>
                                </button>

                                {(item.rawBill.dueAmount || 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentModal(item.rawBill)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                                  >
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>Receive Due (₹{(item.rawBill.dueAmount || 0).toLocaleString('en-IN')})</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF PATIENTS DIRECTORY VIEW IS SELECTED FROM SIDEBAR
  if (isPatientsView) {
    const totalPatientsCount = allLabPatients.length;
    const maleCount = allLabPatients.filter(p => (p.gender || '').toLowerCase().startsWith('m')).length;
    const femaleCount = allLabPatients.filter(p => (p.gender || '').toLowerCase().startsWith('f')).length;
    const otherCount = totalPatientsCount - maleCount - femaleCount;
    const totalTestsCount = allLabPatients.reduce((sum, p) => sum + p.totalTestsCount, 0);
    const totalDuePatientsCount = allLabPatients.filter(p => p.totalDueAmount > 0).length;
    const totalOutstandingDue = allLabPatients.reduce((sum, p) => sum + p.totalDueAmount, 0);
    const totalCollectedRevenue = allLabPatients.reduce((sum, p) => sum + p.totalPaidAmount, 0);

    return (
      <DashboardLayout>
        <div className="space-y-6 pb-12 bg-slate-50/50 min-h-screen">
          
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" /> Patients Directory & Lab Profiles
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                    <span>★</span>
                    <span>Lab Patients</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Comprehensive directory of all patients who have come for lab investigations — demographic details, test history, and billing records.
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => loadDashboardData()}
                className="px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                title="Refresh patient list"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loadingDashboard ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/new-bill')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Patient / Test</span>
              </button>
            </div>
          </div>

          {/* TOP METRICS SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Patients */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Patients</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalPatientsCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">Registered in lab system</p>
            </div>

            {/* Card 2: Gender Demographics */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Demographics</span>
                <UserCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-lg font-black text-indigo-900 mt-1">
                {maleCount} <span className="text-xs font-semibold text-slate-400">Male</span> • {femaleCount} <span className="text-xs font-semibold text-slate-400">Female</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">{otherCount > 0 ? `${otherCount} Other • ` : ''}Gender distribution</p>
            </div>

            {/* Card 3: Tests Conducted */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Tests Ordered</span>
                <FlaskConical className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-700">{totalTestsCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">Across all patient visits</p>
            </div>

            {/* Card 4: Outstanding Dues */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Pending Dues</span>
                <Receipt className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-black text-red-700">₹{totalOutstandingDue.toLocaleString('en-IN')}</div>
              <p className="text-[10px] text-slate-400 font-semibold">{totalDuePatientsCount} patients have pending dues</p>
            </div>

            {/* Card 5: Total Revenue */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Revenue Paid</span>
                <Wallet className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-700">₹{totalCollectedRevenue.toLocaleString('en-IN')}</div>
              <p className="text-[10px] text-slate-400 font-semibold">Lifetime lab collections</p>
            </div>
          </div>

          {/* CONTROLS & FILTER TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs font-semibold text-slate-700">
              
              {/* Search Bar */}
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  placeholder="Search by Patient Name, UHID, Mobile, City, Guardian, Tests..."
                  className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                {patientSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPatientSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Gender Filter */}
              <div className="md:col-span-2">
                <select
                  value={patientGenderFilter}
                  onChange={(e) => setPatientGenderFilter(e.target.value)}
                  className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Dues Filter */}
              <div className="md:col-span-2">
                <select
                  value={patientDuesFilter}
                  onChange={(e) => setPatientDuesFilter(e.target.value)}
                  className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="dues">With Outstanding Dues</option>
                  <option value="paid">Fully Settled / Paid</option>
                </select>
              </div>

              {/* Source Filter */}
              <div className="md:col-span-2">
                <select
                  value={patientSourceFilter}
                  onChange={(e) => setPatientSourceFilter(e.target.value)}
                  className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Sources</option>
                  <option value="OPD">OPD Referral</option>
                  <option value="IPD">IPD Sample</option>
                  <option value="Direct">Direct / Walk-in</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="md:col-span-2 flex items-center gap-1.5">
                <select
                  value={patientSortBy}
                  onChange={(e) => setPatientSortBy(e.target.value)}
                  className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="latest">Sort: Last Visited</option>
                  <option value="name_asc">Sort: Name (A-Z)</option>
                  <option value="name_desc">Sort: Name (Z-A)</option>
                  <option value="most_tests">Sort: Most Tests</option>
                  <option value="highest_due">Sort: Highest Due</option>
                </select>
              </div>

            </div>

            {/* Status counts & active filter reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Showing <strong className="text-slate-900 font-bold">{filteredLabPatients.length}</strong> of {totalPatientsCount} registered lab patients
              </span>

              {(patientSearchQuery || patientGenderFilter !== 'all' || patientDuesFilter !== 'all' || patientSourceFilter !== 'all' || patientSortBy !== 'latest') && (
                <button
                  type="button"
                  onClick={() => {
                    setPatientSearchQuery('');
                    setPatientGenderFilter('all');
                    setPatientDuesFilter('all');
                    setPatientSourceFilter('all');
                    setPatientSortBy('latest');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* MAIN PATIENTS TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="p-4">Patient Profile</th>
                    <th className="p-4">UHID & Contact</th>
                    <th className="p-4">Source & Address</th>
                    <th className="p-4">Lab Tests History</th>
                    <th className="p-4">Last Visit</th>
                    <th className="p-4 text-right">Billing & Dues</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingDashboard ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center">
                        <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto" />
                        <p className="text-xs text-slate-500 font-bold mt-2">Loading patients directory...</p>
                      </td>
                    </tr>
                  ) : filteredLabPatients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">No Patients Found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLabPatients.map((patient) => {
                      const genderInitial = (patient.gender || 'M').charAt(0).toUpperCase();
                      const ageDisplay = patient.age ? `${patient.age} Y` : '';
                      const isMale = genderInitial === 'M';

                      return (
                        <tr key={patient.id} className="hover:bg-blue-50/30 transition-colors">
                          
                          {/* 1. Patient Profile */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Avatar Icon */}
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isMale ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-pink-100 text-pink-700 border border-pink-200'
                              }`}>
                                {patient.patientName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-sm truncate">{patient.patientName}</span>
                                  {patient.bloodGroup && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                                      {patient.bloodGroup}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                  {ageDisplay ? `${ageDisplay} / ` : ''}{patient.gender || 'Male'}
                                  {patient.guardianName ? ` • S/o, D/o: ${patient.guardianName}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. UHID & Contact */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">
                                {patient.uhid}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{patient.mobile}</span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Source & Address */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-block ${
                                patient.source === 'IPD' ? 'bg-purple-100 text-purple-800' :
                                patient.source === 'OPD' ? 'bg-blue-100 text-blue-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {patient.source}
                              </span>
                              <div className="text-xs text-slate-500 font-medium truncate max-w-[160px]">
                                {patient.city || patient.address || '—'}
                              </div>
                            </div>
                          </td>

                          {/* 4. Lab Tests History */}
                          <td className="p-4">
                            <div className="space-y-1 max-w-[240px]">
                              <p className="text-xs font-semibold text-slate-800 line-clamp-1" title={patient.testsSummary}>
                                {patient.testsSummary}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-bold">
                                  {patient.totalOrdersCount} orders ({patient.totalTestsCount} tests)
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 5. Last Visit */}
                          <td className="p-4 text-xs text-slate-600">
                            <span className="font-bold text-slate-800 block">
                              {patient.latestVisitDate.toLocaleDateString('en-GB')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatTimeAgo(patient.latestVisitDate)}
                            </span>
                          </td>

                          {/* 6. Billing & Dues */}
                          <td className="p-4 text-right">
                            <div className="space-y-0.5">
                              {patient.totalDueAmount > 0 ? (
                                <>
                                  <span className="font-black text-red-600 text-sm block">
                                    Due: ₹{patient.totalDueAmount.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium block">
                                    Paid: ₹{patient.totalPaidAmount.toLocaleString('en-IN')}
                                  </span>
                                </>
                              ) : patient.totalBilledAmount > 0 ? (
                                <>
                                  <span className="font-bold text-emerald-700 text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 inline-block">
                                    Fully Paid
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                                    ₹{patient.totalPaidAmount.toLocaleString('en-IN')}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">No Bills Raised</span>
                              )}
                            </div>
                          </td>

                          {/* 7. Action Buttons */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View Full History & Profile Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedPatientForHistory(patient)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="View full lab history & tests"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lab Profile</span>
                              </button>

                              {/* Direct payment if due */}
                              {patient.totalDueAmount > 0 && patient.bills.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const unpaidBill = patient.bills.find(b => (b.dueAmount || 0) > 0) || patient.bills[0];
                                    handleOpenPaymentModal(unpaidBill);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                  title="Receive outstanding due"
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PATIENT FULL PROFILE & LAB HISTORY MODAL */}
          {selectedPatientForHistory && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                
                {/* Modal Top Header Banner */}
                <div className="bg-slate-900 text-white p-6 relative">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForHistory(null)}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                        {selectedPatientForHistory.patientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-white">{selectedPatientForHistory.patientName}</h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            {selectedPatientForHistory.uhid}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-1">
                          {selectedPatientForHistory.age ? `${selectedPatientForHistory.age} YRS • ` : ''}
                          {selectedPatientForHistory.gender} • Mobile: <strong className="text-white">{selectedPatientForHistory.mobile}</strong>
                          {selectedPatientForHistory.bloodGroup ? ` • Blood Group: ${selectedPatientForHistory.bloodGroup}` : ''}
                        </p>
                        {selectedPatientForHistory.address && (
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {selectedPatientForHistory.address} {selectedPatientForHistory.city ? `(${selectedPatientForHistory.city})` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary Badges */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-right">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Lifetime Billed</span>
                        <span className="text-sm font-bold text-white">₹{selectedPatientForHistory.totalBilledAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={`px-3.5 py-2 rounded-xl border text-right ${
                        selectedPatientForHistory.totalDueAmount > 0
                          ? 'bg-red-500/20 border-red-500/30 text-red-300'
                          : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                      }`}>
                        <span className="text-[10px] font-bold block uppercase">
                          {selectedPatientForHistory.totalDueAmount > 0 ? 'Due Balance' : 'Status'}
                        </span>
                        <span className="text-sm font-black">
                          {selectedPatientForHistory.totalDueAmount > 0 
                            ? `₹${selectedPatientForHistory.totalDueAmount.toLocaleString('en-IN')}` 
                            : 'Fully Paid'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Body with History */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  
                  {/* Section 1: Lab Test Orders & Reports History */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-blue-600" />
                      <span>Lab Test Requests & Diagnostic Reports ({selectedPatientForHistory.requests.length})</span>
                    </h3>

                    {selectedPatientForHistory.requests.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                        No direct lab request orders recorded for this patient yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedPatientForHistory.requests.map((req) => {
                          const reqDateStr = req.createdAt 
                            ? new Date(req.createdAt).toLocaleDateString('en-GB') 
                            : (req.bookingDate ? new Date(req.bookingDate).toLocaleDateString('en-GB') : '—');
                          const isFinal = req.reportStatus === 'Completed' || req.reportStatus === 'Final' || req.reportStatus === 'Signed off';

                          return (
                            <div key={req._id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    {req.labId ? (req.labId.startsWith('#') ? req.labId : `#${req.labId}`) : 'REQ'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-900">
                                    {Array.isArray(req.tests) ? req.tests.join(', ') : (req.tests || 'Diagnostic Tests')}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                    isFinal ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {req.reportStatus || req.status || 'New'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  Booked on: <strong>{reqDateStr}</strong>
                                  {req.doctorId?.doctorName ? ` • Doctor: ${req.doctorId.doctorName}` : ''}
                                  {req.sampleStatus ? ` • Sample: ${req.sampleStatus}` : ''}
                                </p>
                              </div>

                              {/* Action Buttons for this request */}
                              <div className="flex items-center gap-2 shrink-0">
                                {isFinal ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReportPrint(req)}
                                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>Print Report</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReportPrint(req)}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View Report</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProcessRequest(req)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Enter Results</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Invoices & Billing History */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-purple-600" />
                      <span>Lab Invoices & Payment Transactions ({selectedPatientForHistory.bills.length})</span>
                    </h3>

                    {selectedPatientForHistory.bills.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                        No billing records generated for this patient yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedPatientForHistory.bills.map((bill) => {
                          const billDateStr = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-GB') : '—';
                          const hasDue = (bill.dueAmount || 0) > 0;

                          return (
                            <div key={bill._id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                    {bill.billNo || bill.labId || 'BILL'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-900">
                                    Total: ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                    hasDue ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {bill.paymentStatus || (hasDue ? 'Unpaid' : 'Paid')}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  Date: <strong>{billDateStr}</strong> • Paid: <strong className="text-emerald-700">₹{(bill.paidAmount || 0).toLocaleString('en-IN')}</strong>
                                  {hasDue && ` • Due: `}<strong className="text-red-600">{hasDue ? `₹${(bill.dueAmount || 0).toLocaleString('en-IN')}` : ''}</strong>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewingReceiptData(bill)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>View Receipt</span>
                                </button>

                                {hasDue && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentModal(bill)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  >
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>Receive Due</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => router.push('/new-bill')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Book New Lab Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPatientForHistory(null)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF REFERRAL DOCTORS VIEW IS SELECTED FROM SIDEBAR
  if (isReferralDoctorsView) {
    const totalDoctorsCount = referralDoctors.length;
    const activeDoctorsCount = referralDoctors.filter(d => d.name !== 'Self').length;

    // Calculate total tests referred across all doctors
    const getReferredCount = (docName) => {
      if (!docName) return 0;
      return labRequests.filter(r => {
        const refText = r.remarks?.includes('Referred by:') ? r.remarks.split('Referred by:')[1].trim() : (r.doctorId?.doctorName || '');
        return refText.toLowerCase().includes(docName.toLowerCase()) || docName.toLowerCase().includes(refText.toLowerCase());
      }).length;
    };

    return (
      <DashboardLayout>
        <div className="space-y-6 pb-12 bg-slate-50/50 min-h-screen">
          
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-600" /> Referral Doctors & Clinics
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1">
                    <span>★</span>
                    <span>Referred By Options</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Manage the doctors and healthcare providers that appear in the &quot;Referred by&quot; dropdown when booking tests and generating new lab bills.
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingDocId(null);
                  setDocForm({ name: '', specialty: '', phone: '', hospital: '', commission: '10%' });
                  setShowAddDocModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Referral Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/new-bill')}
                className="px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span>+ New Bill</span>
              </button>
            </div>
          </div>

          {/* TOP METRICS SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Card 1: Total Referral Sources */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Referrers</span>
                <UserCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalDoctorsCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">Available in New Bill selection</p>
            </div>

            {/* Card 2: External Doctors */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Active Doctors</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-700">{activeDoctorsCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">External doctors & clinics</p>
            </div>

            {/* Card 3: Total Tests Referred */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Referred Cases</span>
                <FlaskConical className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-700">{labRequests.length}</div>
              <p className="text-[10px] text-slate-400 font-semibold">Orders tracked to referrers</p>
            </div>

            {/* Card 4: Two-Way Synchronization */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Sync Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-sm font-black text-emerald-700 mt-1 flex items-center gap-1">
                <span>● 100% Synchronized</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">Instantly updates &quot;Referred by&quot;</p>
            </div>
          </div>

          {/* CONTROLS & SEARCH BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={refDocSearchQuery}
                onChange={(e) => setRefDocSearchQuery(e.target.value)}
                placeholder="Search referral doctor by name, specialty, clinic/hospital, or phone..."
                className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              {refDocSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRefDocSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-900 font-bold">{filteredReferralDoctors.length}</strong> of {totalDoctorsCount} Referral Doctors
              </span>
            </div>
          </div>

          {/* REFERRAL DOCTORS TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="p-4">Code / ID</th>
                    <th className="p-4">Doctor / Clinic Name</th>
                    <th className="p-4">Specialty / Department</th>
                    <th className="p-4">Hospital / Clinic</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4 text-center">Cases Referred</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredReferralDoctors.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center text-slate-400">
                        <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">No Referral Doctors Found</p>
                        <p className="text-xs text-slate-400 mt-1">Click &quot;+ Add Referral Doctor&quot; to register a new doctor.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReferralDoctors.map((doc) => {
                      const isSelf = doc.name === 'Self';
                      const referredCount = getReferredCount(doc.name);

                      return (
                        <tr key={doc.id} className="hover:bg-indigo-50/20 transition-colors">
                          {/* 1. Code / ID */}
                          <td className="p-4 font-mono text-xs font-bold text-indigo-700">
                            <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              ID: {doc.codeId || doc.id}
                            </span>
                          </td>

                          {/* 2. Doctor Name */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isSelf ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}>
                                {doc.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block text-sm">{doc.name}</span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {isSelf ? 'Default Walk-in' : 'External / OPD Referrer'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Specialty */}
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                              {doc.specialty || 'General'}
                            </span>
                          </td>

                          {/* 4. Hospital / Clinic */}
                          <td className="p-4 text-xs text-slate-600">
                            {doc.hospital || '—'}
                          </td>

                          {/* 5. Contact Phone */}
                          <td className="p-4 text-xs text-slate-600">
                            {doc.phone ? (
                              <span className="flex items-center gap-1 font-mono font-medium text-slate-700">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {doc.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* 6. Cases Referred */}
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                              {referredCount} cases
                            </span>
                          </td>

                          {/* 7. Action Buttons */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditReferralDoctor(doc)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg cursor-pointer transition-colors"
                                title="Edit Doctor Details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReferralDoctor(doc.id)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                                  title="Remove Doctor"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADD / EDIT REFERRAL DOCTOR MODAL */}
          {showAddDocModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingDocId ? 'Edit Referral Doctor' : 'Add New Referral Doctor'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDocModal(false);
                      setEditingDocId(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSaveReferralDoctor} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                  
                  {/* Doctor Name */}
                  <div className="space-y-1">
                    <label className="block">
                      * Doctor / Clinic Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={docForm.name}
                      onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                      placeholder="e.g. Dr. Rajiv Kapoor (Orthopedic) or City Clinic"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 font-normal">This name will appear in the &quot;Referred by&quot; dropdown in New Bill.</p>
                  </div>

                  {/* Specialty */}
                  <div className="space-y-1">
                    <label className="block">Specialty / Qualification</label>
                    <input
                      type="text"
                      value={docForm.specialty}
                      onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })}
                      placeholder="e.g. Cardiologist, MD Medicine, General Physician"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Hospital / Clinic */}
                  <div className="space-y-1">
                    <label className="block">Hospital / Clinic Affiliation</label>
                    <input
                      type="text"
                      value={docForm.hospital}
                      onChange={(e) => setDocForm({ ...docForm, hospital: e.target.value })}
                      placeholder="e.g. Apollo Hospital, City Clinic, In-house"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="block">Contact Mobile Number</label>
                    <input
                      type="tel"
                      value={docForm.phone}
                      onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Commission % */}
                  <div className="space-y-1">
                    <label className="block">Referral Incentive / Commission %</label>
                    <input
                      type="text"
                      value={docForm.commission}
                      onChange={(e) => setDocForm({ ...docForm, commission: e.target.value })}
                      placeholder="e.g. 10%"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddDocModal(false);
                        setEditingDocId(null);
                      }}
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                    >
                      {editingDocId ? 'Update Doctor' : 'Save & Add Doctor'}
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}

        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF COLLECTION CENTRES VIEW IS SELECTED FROM SIDEBAR
  if (isCollectionCentresView) {
    const totalCentresCount = collectionCentresList.length;
    const activeCentresCount = collectionCentresList.filter(c => c.status === 'Active').length;

    return (
      <DashboardLayout>
        <div className="space-y-6 pb-12 bg-slate-50/50 min-h-screen">
          
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Building className="w-5 h-5 text-amber-600" /> Collection Centres & Branches
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                    <span>★</span>
                    <span>Collection Centers</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Add, edit, and manage sample collection branches, satellite centers, and lab locations used when generating new bills.
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingCentreId(null);
                  setCentreForm({ name: '', code: '', address: '', phone: '', incharge: '', status: 'Active' });
                  setShowAddCentreModal(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Collection Centre</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/new-bill')}
                className="px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span>+ New Bill</span>
              </button>
            </div>
          </div>

          {/* TOP METRICS SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Card 1: Total Centres */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Centres</span>
                <Building className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalCentresCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">Available for test collection</p>
            </div>

            {/* Card 2: Active Centres */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Active Centres</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-700">{activeCentresCount}</div>
              <p className="text-[10px] text-slate-400 font-semibold">Operational branches</p>
            </div>

            {/* Card 3: Main Lab Location */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Primary Center</span>
                <FlaskConical className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-sm font-black text-slate-900 truncate mt-1">Main Hospital Lab</div>
              <p className="text-[10px] text-slate-400 font-semibold">Central processing facility</p>
            </div>

            {/* Card 4: Synchronization Status */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Sync Status</span>
                <Layers className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-sm font-black text-emerald-700 mt-1 flex items-center gap-1">
                <span>● 100% Synchronized</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">Instantly updates New Bill dropdown</p>
            </div>
          </div>

          {/* CONTROLS & SEARCH BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={centreSearchQuery}
                onChange={(e) => setCentreSearchQuery(e.target.value)}
                placeholder="Search collection centre by name, code, address, incharge, or phone..."
                className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
              {centreSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCentreSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-900 font-bold">{filteredCollectionCentres.length}</strong> of {totalCentresCount} Collection Centres
              </span>
            </div>
          </div>

          {/* COLLECTION CENTRES TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="p-4">Centre Code</th>
                    <th className="p-4">Collection Centre Name</th>
                    <th className="p-4">Location / Address</th>
                    <th className="p-4">Incharge / Supervisor</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCollectionCentres.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center text-slate-400">
                        <Building className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">No Collection Centres Found</p>
                        <p className="text-xs text-slate-400 mt-1">Click &quot;+ Add Collection Centre&quot; to add a new center.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCollectionCentres.map((centre) => {
                      const isMain = centre.name === 'Main Hospital Lab';

                      return (
                        <tr key={centre.id} className="hover:bg-amber-50/20 transition-colors">
                          {/* 1. Code */}
                          <td className="p-4 font-mono text-xs font-bold text-amber-700">
                            <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              {centre.code || `CC-${centre.id}`}
                            </span>
                          </td>

                          {/* 2. Centre Name */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isMain ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>
                                <Building className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block text-sm">{centre.name}</span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {isMain ? 'Primary Central Lab' : 'Branch Collection Hub'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Address */}
                          <td className="p-4 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{centre.address || '—'}</span>
                            </div>
                          </td>

                          {/* 4. Incharge */}
                          <td className="p-4 text-xs text-slate-700 font-semibold">
                            {centre.incharge || '—'}
                          </td>

                          {/* 5. Phone */}
                          <td className="p-4 text-xs text-slate-600">
                            {centre.phone ? (
                              <span className="flex items-center gap-1 font-mono font-medium text-slate-700">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {centre.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* 6. Status */}
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              centre.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {centre.status || 'Active'}
                            </span>
                          </td>

                          {/* 7. Action Buttons */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleEditCentre(centre)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-amber-600 rounded-lg cursor-pointer transition-colors"
                                title="Edit Collection Centre"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              {/* Delete Button */}
                              {!isMain && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCentre(centre.id)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Collection Centre"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADD / EDIT COLLECTION CENTRE MODAL */}
          {showAddCentreModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingCentreId ? 'Edit Collection Centre' : 'Add New Collection Centre'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCentreModal(false);
                      setEditingCentreId(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSaveCentre} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                  
                  {/* Centre Name */}
                  <div className="space-y-1">
                    <label className="block">
                      * Collection Centre Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={centreForm.name}
                      onChange={(e) => setCentreForm({ ...centreForm, name: e.target.value })}
                      placeholder="e.g. North City Collection Branch"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-400 font-normal">This name appears in the Collection Centre dropdown in New Bill.</p>
                  </div>

                  {/* Centre Code */}
                  <div className="space-y-1">
                    <label className="block">Centre Code / Identifier</label>
                    <input
                      type="text"
                      value={centreForm.code}
                      onChange={(e) => setCentreForm({ ...centreForm, code: e.target.value })}
                      placeholder="e.g. CC-05"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="block">Address / Location Details</label>
                    <input
                      type="text"
                      value={centreForm.address}
                      onChange={(e) => setCentreForm({ ...centreForm, address: e.target.value })}
                      placeholder="e.g. Plot 12, Sector 14, Main Road"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Incharge / Supervisor */}
                  <div className="space-y-1">
                    <label className="block">Centre Incharge / Supervisor</label>
                    <input
                      type="text"
                      value={centreForm.incharge}
                      onChange={(e) => setCentreForm({ ...centreForm, incharge: e.target.value })}
                      placeholder="e.g. Dr. Amit Sharma / Phlebotomist"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block">Contact Mobile Number</label>
                    <input
                      type="tel"
                      value={centreForm.phone}
                      onChange={(e) => setCentreForm({ ...centreForm, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="block">Operating Status</label>
                    <select
                      value={centreForm.status}
                      onChange={(e) => setCentreForm({ ...centreForm, status: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCentreModal(false);
                        setEditingCentreId(null);
                      }}
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                    >
                      {editingCentreId ? 'Update Centre' : 'Save & Add Centre'}
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}

        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF DAILY BUSINESS VIEW IS SELECTED FROM SIDEBAR OR MAIN DASHBOARD
  if (isDailyBusinessView) {
    const {
      dayTransactions,
      filteredTransactions,
      dayBills,
      dayExpenses,
      totalIncome,
      cashIncome,
      cardIncome,
      upiIncome,
      insuranceIncome,
      totalExpenses,
      netIncome
    } = dailyBusinessData;

    const handleDailyPrevDay = () => {
      const d = new Date(dailyBusinessDate);
      d.setDate(d.getDate() - 1);
      setDailyBusinessDate(d.toISOString().split('T')[0]);
    };

    const handleDailyNextDay = () => {
      const d = new Date(dailyBusinessDate);
      d.setDate(d.getDate() + 1);
      setDailyBusinessDate(d.toISOString().split('T')[0]);
    };

    const formattedSelectedDate = new Date(dailyBusinessDate).toLocaleDateString('en-GB');

    return (
      <DashboardLayout>
        <div className="space-y-4 pb-12 bg-slate-50/50 min-h-screen text-slate-800">
          
          {/* 1. TOP HEADER & ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Daily business
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Business Report</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard?view=todays-reports')}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <span>Monthly Overview <span className="text-[10px] font-bold text-blue-600">(BETA)</span></span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => showToast('Daily business report emailed to administrator', 'success')}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* 2. DATE SELECTOR BAR */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDailyPrevDay}
              className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center cursor-pointer shadow-2xs"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative inline-flex items-center">
              <input
                type="date"
                value={dailyBusinessDate}
                onChange={(e) => setDailyBusinessDate(e.target.value)}
                className="h-8 px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs cursor-pointer outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleDailyNextDay}
              className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center cursor-pointer shadow-2xs"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setDailyBusinessDate(new Date().toISOString().split('T')[0])}
              className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* 3. FINANCIAL SUMMARY EQUATION CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            
            {/* Main Equation Box */}
            <div className="lg:col-span-9 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              
              {/* Equation Line */}
              <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 text-xs font-semibold">
                
                {/* Total Income */}
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Total Income</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-slate-900">
                      Rs.{totalIncome.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowIncomeSplit(!showIncomeSplit)}
                      className="p-0.5 rounded hover:bg-slate-100 text-slate-400 cursor-pointer"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showIncomeSplit ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                <span className="text-slate-300 text-base font-light">+</span>

                {/* Total collection charge */}
                <div>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    Total collection charge <HelpCircle className="w-3 h-3 text-slate-300" />
                  </span>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">Rs.0</div>
                </div>

                <span className="text-slate-300 text-base font-light">-</span>

                {/* Expenses */}
                <div>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    Expenses <HelpCircle className="w-3 h-3 text-slate-300" />
                  </span>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    Rs.{totalExpenses.toLocaleString('en-IN')}
                  </div>
                </div>

                <span className="text-slate-300 text-base font-light">=</span>

                {/* Net Income */}
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Net income</span>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    Rs.{netIncome.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Date stamp & Today badge */}
                <div className="border-l border-slate-200 pl-4 py-0.5 text-right hidden sm:block">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-[11px] text-slate-400 font-medium">Date -</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      Today
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, {formattedSelectedDate}
                  </span>
                </div>

              </div>

              {/* Collapsible Income Split */}
              {showIncomeSplit && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Total Income split
                  </span>
                  <div className="flex flex-wrap items-center gap-6 text-xs">
                    
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Cash</span>
                        <strong className="text-xs text-slate-900 font-bold">Rs.{cashIncome.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Card</span>
                        <strong className="text-xs text-slate-900 font-bold">Rs.{cardIncome.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">UPI</span>
                        <strong className="text-xs text-slate-900 font-bold">Rs.{upiIncome.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Insurance</span>
                        <strong className="text-xs text-slate-900 font-bold">Rs.{insuranceIncome.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Right Help Box */}
            <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2.5 text-xs text-slate-600 font-medium">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>How collection charges work?</span>
            </div>

          </div>

          {/* 4. TABS NAVIGATION */}
          <div className="flex items-center gap-6 border-b border-slate-200 pt-2 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setDailyBusinessTab('transactions')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                dailyBusinessTab === 'transactions'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Transactions</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                dailyBusinessTab === 'transactions' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {dayTransactions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDailyBusinessTab('bills')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                dailyBusinessTab === 'bills'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Bills</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                dailyBusinessTab === 'bills' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {dayBills.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDailyBusinessTab('expenses')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                dailyBusinessTab === 'expenses'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Expenses</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                dailyBusinessTab === 'expenses' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {dayExpenses.length}
              </span>
            </button>
          </div>

          {/* 5. TOOLBAR & CASHIER CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              
              {/* Search in page */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dailyBusinessSearch}
                  onChange={(e) => setDailyBusinessSearch(e.target.value)}
                  placeholder="Search in page"
                  className="w-full h-8 pl-8 pr-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              {/* Previous day bills toggle */}
              <button
                type="button"
                onClick={() => setShowPrevDayBills(!showPrevDayBills)}
                className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
                  showPrevDayBills 
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' 
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3 h-3 text-slate-500" />
                <span>Previous day bills</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  {showPrevDayBills ? dayBills.length : 0}
                </span>
              </button>
            </div>

            {/* Cashier Filter & Add Cashier */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <select
                  value={dailyBusinessCashier}
                  onChange={(e) => setDailyBusinessCashier(e.target.value)}
                  className="h-8 pl-2.5 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs outline-none cursor-pointer focus:border-blue-500 appearance-none"
                >
                  <option value="all">All Cashiers : Rs.{totalIncome.toLocaleString('en-IN')}</option>
                  {cashiersList.map((cName) => (
                    <option key={cName} value={cName}>
                      {cName} : Rs.{totalIncome.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={() => setShowAddCashierModal(true)}
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add cashier</span>
              </button>

              {dailyBusinessTab === 'expenses' && (
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(true)}
                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record Expense</span>
                </button>
              )}
            </div>
          </div>

          {/* 6. TAB CONTENT: TRANSACTIONS TABLE */}
          {dailyBusinessTab === 'transactions' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      <th className="py-3 px-3.5">ID</th>
                      <th className="py-3 px-3.5">REG. NO.</th>
                      <th className="py-3 px-3.5">PATIENT NAME</th>
                      <th className="py-3 px-3.5">REFERRED BY</th>
                      <th className="py-3 px-3.5">DATE</th>
                      <th className="py-3 px-3.5">TIME</th>
                      <th className="py-3 px-3.5">DCN <span title="Daily Case Number">ⓘ</span></th>
                      <th className="py-3 px-3.5">CC <span title="Collection Centre">ⓘ</span></th>
                      <th className="py-3 px-3.5">AMOUNT</th>
                      <th className="py-3 px-3.5">METHOD</th>
                      <th className="py-3 px-3.5">RECEIVED BY</th>
                      <th className="py-3 px-3.5 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="p-12 text-center text-slate-400">
                          <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-slate-700">No Transactions Recorded</p>
                          <p className="text-xs text-slate-400 mt-1">No payment collections found for {formattedSelectedDate}.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors text-slate-700">
                          {/* ID */}
                          <td className="py-2.5 px-3.5 font-mono text-slate-600 text-xs">
                            {tx.id}
                          </td>

                          {/* REG. NO. */}
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">
                            {tx.regNo}
                          </td>

                          {/* PATIENT NAME */}
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                            {tx.patientName}
                          </td>

                          {/* REFERRED BY */}
                          <td className="py-2.5 px-3.5 text-slate-600">
                            {tx.referredBy}
                          </td>

                          {/* DATE */}
                          <td className="py-2.5 px-3.5 text-slate-600">
                            {tx.date}
                          </td>

                          {/* TIME */}
                          <td className="py-2.5 px-3.5 text-slate-600">
                            {tx.time}
                          </td>

                          {/* DCN */}
                          <td className="py-2.5 px-3.5 font-bold text-slate-800">
                            {tx.dcn}
                          </td>

                          {/* CC */}
                          <td className="py-2.5 px-3.5 text-slate-700">
                            {tx.cc}
                          </td>

                          {/* AMOUNT */}
                          <td className="py-2.5 px-3.5 font-black text-emerald-600 whitespace-nowrap">
                            + Rs.{tx.amount.toLocaleString('en-IN')}
                          </td>

                          {/* METHOD */}
                          <td className="py-2.5 px-3.5 uppercase text-[11px] font-bold text-slate-600">
                            {tx.method}
                          </td>

                          {/* RECEIVED BY */}
                          <td className="py-2.5 px-3.5 text-slate-800 font-medium">
                            {tx.receivedBy}
                          </td>

                          {/* ACTION */}
                          <td className="py-2.5 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingReceiptData(tx.rawBill)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs inline-flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View bill</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. TAB CONTENT: BILLS TABLE */}
          {dailyBusinessTab === 'bills' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      <th className="py-3 px-3.5">BILL / LAB ID</th>
                      <th className="py-3 px-3.5">PATIENT NAME</th>
                      <th className="py-3 px-3.5">INVESTIGATIONS</th>
                      <th className="py-3 px-3.5">DATE & TIME</th>
                      <th className="py-3 px-3.5 text-right">TOTAL</th>
                      <th className="py-3 px-3.5 text-right">PAID</th>
                      <th className="py-3 px-3.5 text-right">DUE</th>
                      <th className="py-3 px-3.5 text-center">STATUS</th>
                      <th className="py-3 px-3.5 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {dayBills.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-12 text-center text-slate-400">
                          No bills generated on {formattedSelectedDate}.
                        </td>
                      </tr>
                    ) : (
                      dayBills.map((b) => {
                        const bDate = b.createdAt ? new Date(b.createdAt) : new Date();
                        const isDue = (b.dueAmount || 0) > 0;
                        const testsSummary = Array.isArray(b.tests) 
                          ? b.tests.map(t => typeof t === 'string' ? t : (t.testName || t.name)).join(', ')
                          : (b.tests || 'Lab Tests');

                        return (
                          <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3.5 font-mono font-bold text-blue-700">
                              {b.billNo || b.labId || 'BILL'}
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-slate-900">
                              {b.patientId?.patientName || 'Patient'}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-600 max-w-[200px] truncate" title={testsSummary}>
                              {testsSummary}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-600">
                              {bDate.toLocaleDateString('en-GB')} {bDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">
                              Rs.{(b.totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-bold text-emerald-700">
                              Rs.{(b.paidAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-bold text-red-600">
                              Rs.{(b.dueAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                isDue ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {b.paymentStatus || (isDue ? 'Unpaid' : 'Paid')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => setViewingReceiptData(b)}
                                className="text-blue-600 hover:text-blue-800 font-bold text-xs inline-flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View bill</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. TAB CONTENT: EXPENSES TABLE */}
          {dailyBusinessTab === 'expenses' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      <th className="py-3 px-3.5">EXPENSE TITLE</th>
                      <th className="py-3 px-3.5">CATEGORY</th>
                      <th className="py-3 px-3.5">PAID TO / VENDOR</th>
                      <th className="py-3 px-3.5">TIME</th>
                      <th className="py-3 px-3.5">METHOD</th>
                      <th className="py-3 px-3.5 text-right">AMOUNT</th>
                      <th className="py-3 px-3.5 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {dayExpenses.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-12 text-center text-slate-400">
                          <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-slate-700">No Expenses Recorded</p>
                          <p className="text-xs text-slate-400 mt-1">Click &quot;+ Record Expense&quot; to log daily lab operational expenses.</p>
                        </td>
                      </tr>
                    ) : (
                      dayExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">
                            {exp.title}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700">
                            {exp.paidTo}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600">
                            {exp.time}
                          </td>
                          <td className="py-2.5 px-3.5 uppercase text-[11px] font-bold text-slate-600">
                            {exp.paymentMethod}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-red-600">
                            - Rs.{exp.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADD CASHIER MODAL */}
          {showAddCashierModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-600" /> Add New Cashier
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCashierModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveCashier} className="space-y-3 text-xs font-semibold text-slate-700">
                  <div>
                    <label className="block mb-1">Cashier / Staff Name</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newCashierName}
                      onChange={(e) => setNewCashierName(e.target.value)}
                      placeholder="e.g. Suresh Phlebotomist"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCashierModal(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                    >
                      Save Cashier
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* RECORD EXPENSE MODAL */}
          {showAddExpenseModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600" /> Record Lab Expense
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddExpenseModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveExpense} className="space-y-3 text-xs font-semibold text-slate-700">
                  <div>
                    <label className="block mb-1">Expense Title / Item</label>
                    <input
                      type="text"
                      required
                      value={expenseForm.title}
                      onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                      placeholder="e.g. CBC Reagent Pack / Test Tubes"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1">Amount (Rs.)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        placeholder="e.g. 1500"
                        className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Payment Method</label>
                      <select
                        value={expenseForm.paymentMethod}
                        onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                        className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Net Banking">Net Banking</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1">Paid To / Vendor Name</label>
                    <input
                      type="text"
                      value={expenseForm.paidTo}
                      onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                      placeholder="e.g. MedSupply Diagnostic Solutions"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExpenseModal(false)}
                      className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      Save Expense
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF DUE REPORTS VIEW IS SELECTED FROM SIDEBAR
  if (isDueReportsView) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" /> Business — Due Reports
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  View and manage all outstanding patient due amounts across lab billing records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-right">
                <span className="text-[11px] text-red-600 font-semibold block uppercase">Total Pending Dues</span>
                <span className="text-lg font-black text-red-700">₹{totalDueAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={dueSearchQuery}
                onChange={(e) => setDueSearchQuery(e.target.value)}
                placeholder="Search due report by patient name, UHID, Bill/Lab ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold shrink-0">
              Showing {filteredDueBills.length} of {dueBills.length} Due Records
            </span>
          </div>

          {/* Due Reports Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                    <th className="p-4">Bill / Lab ID</th>
                    <th className="p-4">Patient Details</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-right">Paid Amount</th>
                    <th className="p-4 text-right">Due Amount</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingDashboard ? (
                    <tr>
                      <td colSpan="8" className="p-10 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                        <p className="text-xs text-slate-500 font-semibold mt-2">Loading due reports...</p>
                      </td>
                    </tr>
                  ) : filteredDueBills.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-slate-400">
                        <Check className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                        <p className="font-bold text-slate-700">No Outstanding Dues Found</p>
                        <p className="text-xs text-slate-400 mt-1">All patient dues have been fully settled.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDueBills.map((bill) => (
                      <tr key={bill._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-orange-600">
                          {bill.billNo || bill.labId || 'BILL-REQ'}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{bill.patientId?.patientName || 'Patient'}</span>
                          <span className="text-[11px] text-slate-500 font-medium">UHID: {bill.patientId?.uhid || 'N/A'} • {bill.patientId?.mobile || ''}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-600">
                          {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-800">
                          ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-semibold text-emerald-600">
                          ₹{(bill.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-black text-red-600 text-base">
                          ₹{(bill.dueAmount || bill.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-800">
                            {bill.paymentStatus || 'Unpaid'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenPaymentModal(bill)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                          >
                            Receive Payment
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF TODAY'S REPORTS VIEW IS SELECTED
  if (isTodaysReportsView) {
    return (
      <DashboardLayout>
        <div className="space-y-4 pb-12 bg-slate-50/50 min-h-screen">
          
          {/* TITLE ROW */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {selectedDate === new Date().toLocaleDateString('en-GB') ? 'Reports for today' : `Reports for ${selectedDate}`}
            </h1>
            <a
              href="#recent-changes"
              onClick={(e) => { e.preventDefault(); }}
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>✨ Recent changes</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* CONTROLS & FILTERS ROW */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            {/* Left Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search in page */}
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInPage}
                  onChange={(e) => setSearchInPage(e.target.value)}
                  placeholder="Search in page"
                  className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Date Navigation */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg h-8 px-1">
                <button 
                  type="button"
                  onClick={handlePreviousDay}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                  title="Previous day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-700">
                  <span className="text-slate-400">📅</span>
                  <span>{selectedDate}</span>
                </div>
                <button 
                  type="button"
                  onClick={handleNextDay}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                  title="Next day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Go to Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="h-8 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>
              </div>

              {/* Stats Button */}
              <button
                type="button"
                className="h-8 px-3 border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Stats</span>
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span>Sort by:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="h-8 px-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-800 outline-none cursor-pointer"
                >
                  <option value="oldest">Oldest first</option>
                  <option value="newest">Newest first</option>
                </select>
              </div>
            </div>
          </div>

          {/* STATUS TABS & PRINTED COUNTER ROW */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTabFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'all'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>All</span>
                <span className="px-1.5 py-0.2 bg-slate-200/80 rounded-full text-[10px] font-bold">{countAll}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('new')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'new'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>New</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'new' ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>{countNew}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('create_bill')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'create_bill'
                    ? 'bg-orange-100 text-orange-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Create bill</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'create_bill' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
                }`}>{countCreateBill}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'in_progress'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>In progress</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>{countInProgress}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('final')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'final'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Final</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'final' ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>{countFinal}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('signed_off')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'signed_off'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Signed off</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'signed_off' ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>{countSignedOff}</span>
              </button>
            </div>

            {/* Printed Counter on Right */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>0/{filteredReports.length} Printed</span>
            </div>
          </div>

          {/* REPORTS TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">REG. NO.</th>
                    <th className="py-3 px-4">DATE/TIME</th>
                    <th className="py-3 px-4">PATIENT</th>
                    <th className="py-3 px-4">REFERRED BY</th>
                    <th className="py-3 px-4">TESTS</th>
                    <th className="py-3 px-4">CC</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {loadingDashboard ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500 mb-1" />
                        <span>Loading reports...</span>
                      </td>
                    </tr>
                  ) : sortedReports.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                        No reports match the current filter or date.
                      </td>
                    </tr>
                  ) : (
                    paginatedReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* REG. NO. */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{report.regNo}</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">{report.modBadge}</div>
                        </td>

                        {/* DATE/TIME */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{report.dateStr}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{report.time}</div>
                        </td>

                        {/* PATIENT */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{report.patientName}</div>
                          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            <span>{report.ageSex}</span>
                            <User className="w-3 h-3 text-slate-400" />
                            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                        </td>

                        {/* REFERRED BY */}
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {report.referredBy}
                        </td>

                        {/* TESTS */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {report.tests}
                        </td>

                        {/* CC */}
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {report.cc}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-4">
                          {report.statusCategory === 'create_bill' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                              Create bill
                            </span>
                          ) : report.statusCategory === 'in_progress' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              In progress
                            </span>
                          ) : report.statusCategory === 'final' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Final
                            </span>
                          ) : report.statusCategory === 'signed_off' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Signed off
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                              New
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 font-semibold text-xs text-blue-600">
                            {report.statusCategory === 'create_bill' ? (
                              <button
                                type="button"
                                onClick={() => handleCreateBillFromOpd(report)}
                                className="hover:underline flex items-center gap-1 cursor-pointer text-orange-600 font-bold"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Create bill</span>
                              </button>
                            ) : (report.statusCategory === 'final' || report.statusCategory === 'signed_off') ? (
                              <button
                                type="button"
                                onClick={() => handleOpenReportPrint(report.rawRequest)}
                                className="hover:underline flex items-center gap-1 cursor-pointer text-emerald-700 font-bold"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Browse print</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenProcessRequest(report.rawRequest)}
                                className="hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Enter results</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => (report.statusCategory === 'final' || report.statusCategory === 'signed_off') ? handleOpenReportPrint(report.rawRequest) : handleOpenReceiptView(report)}
                              className="hover:underline flex items-center gap-1 cursor-pointer text-slate-700 hover:text-blue-600"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{(report.statusCategory === 'final' || report.statusCategory === 'signed_off') ? 'View report' : 'View bill'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptView(report)}
                              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION TOOLBAR */}
            {sortedReports.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50/80 border-t border-slate-200 text-xs font-semibold text-slate-600">
                {/* Left: Range Info */}
                <div className="flex items-center gap-3">
                  <span>
                    Showing <strong className="text-slate-900 font-bold">{(safeReportPage - 1) * reportsPageSize + 1}</strong> to <strong className="text-slate-900 font-bold">{Math.min(safeReportPage * reportsPageSize, sortedReports.length)}</strong> of <strong className="text-slate-900 font-bold">{sortedReports.length}</strong> reports
                  </span>

                  {/* Rows per page selector */}
                  <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                    <span className="text-[11px] text-slate-500">Per page:</span>
                    <select
                      value={reportsPageSize}
                      onChange={(e) => {
                        setReportsPageSize(Number(e.target.value));
                        setReportsCurrentPage(1);
                      }}
                      className="h-7 px-2 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Right: Page Navigation Controls */}
                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <button
                    type="button"
                    disabled={safeReportPage <= 1}
                    onClick={() => setReportsCurrentPage(1)}
                    className="h-7 px-2 border border-slate-200 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors cursor-pointer shadow-2xs"
                    title="First page"
                  >
                    «
                  </button>

                  {/* Prev Page */}
                  <button
                    type="button"
                    disabled={safeReportPage <= 1}
                    onClick={() => setReportsCurrentPage(prev => Math.max(1, prev - 1))}
                    className="h-7 px-2.5 border border-slate-200 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Previous page"
                  >
                    ‹ Prev
                  </button>

                  {/* Numbered Page Buttons */}
                  <div className="flex items-center gap-1 px-1">
                    {(() => {
                      const pages = [];
                      const maxButtons = 5;
                      let startPage = Math.max(1, safeReportPage - Math.floor(maxButtons / 2));
                      let endPage = Math.min(totalReportPages, startPage + maxButtons - 1);
                      if (endPage - startPage + 1 < maxButtons) {
                        startPage = Math.max(1, endPage - maxButtons + 1);
                      }
                      for (let p = startPage; p <= endPage; p++) {
                        pages.push(
                          <button
                            key={p}
                            type="button"
                            onClick={() => setReportsCurrentPage(p)}
                            className={`h-7 min-w-[28px] px-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                              safeReportPage === p
                                ? 'bg-blue-600 text-white border border-blue-600'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      }
                      return pages;
                    })()}
                  </div>

                  {/* Next Page */}
                  <button
                    type="button"
                    disabled={safeReportPage >= totalReportPages}
                    onClick={() => setReportsCurrentPage(prev => Math.min(totalReportPages, prev + 1))}
                    className="h-7 px-2.5 border border-slate-200 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Next page"
                  >
                    Next ›
                  </button>

                  {/* Last Page */}
                  <button
                    type="button"
                    disabled={safeReportPage >= totalReportPages}
                    onClick={() => setReportsCurrentPage(totalReportPages)}
                    className="h-7 px-2 border border-slate-200 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Last page"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // MAIN DASHBOARD VIEW
  return (
    <DashboardLayout>
      <div className="space-y-5 pb-12 bg-slate-50/50 min-h-screen">
        
        {/* HEADER TITLE */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Welcome back. Here is your daily lab performance and request summary.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/new-bill')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Bill</span>
          </button>
        </div>

        {/* TOP DASHBOARD CARDS - MATCHING REFERENCE DESIGN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 items-stretch">
          
          {/* CARD 1: Payments due */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px] min-h-[230px]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Payments due</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">For all time</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard?view=due-reports')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Content / Empty State */}
            <div className="my-auto py-3">
              {filteredDueBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-md bg-slate-100/90 flex items-center justify-center text-slate-500 mb-2">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">All dues are cleared.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-100 pb-1.5">
                    <span>Pending: {filteredDueBills.length} Patient(s)</span>
                    <span className="font-extrabold text-red-600">Total ₹{totalDueAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {filteredDueBills.slice(0, 2).map((bill) => (
                    <div key={bill._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{bill.patientId?.patientName || 'Patient'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Bill #{bill.billNo || bill.labId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-red-600">₹{(bill.dueAmount || bill.totalAmount || 0).toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(bill)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: Recent transactions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px] min-h-[230px]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Recent transactions</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">For today</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard?view=todays-reports')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Top center View all link matching screenshot */}
            <div className="text-center -mt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard?view=todays-reports')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-0.5"
              >
                <span>View all</span>
                <span>»</span>
              </button>
            </div>

            {/* Content / Empty State */}
            <div className="my-auto py-2">
              {labBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-md bg-slate-100/90 flex items-center justify-center text-slate-400 mb-2">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No transactions found for today.</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 mb-2.5">Get started by adding a new case.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/new-bill')}
                    className="px-3 py-1 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add new case</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {labBills.slice(0, 2).map((bill) => (
                    <div key={bill._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{bill.patientId?.patientName || 'Patient'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">#{bill.billNo || bill.labId} • {bill.paymentMethod || 'Cash'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 block">₹{(bill.paidAmount || bill.totalAmount || 0).toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{bill.paymentStatus || 'Paid'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: Recent activities (Tracking of lab module) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px] min-h-[230px]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Recent activities</h2>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100/80 text-amber-800 inline-flex items-center gap-1">
                    <span>★</span>
                    <span>Tracking of lab module</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard?view=activities')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Lab Module Activity Feed */}
            <div className="my-auto py-2">
              {allLabActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-2">
                  <Activity className="w-5 h-5 text-slate-300 mb-1" />
                  <p className="text-xs font-bold text-slate-700">No recent lab activities</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Test orders and updates will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allLabActivities.slice(0, 2).map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => router.push('/dashboard?view=activities')}
                      className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-100 transition-colors text-xs cursor-pointer"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.dotColor || 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">
                          {item.patientName} <span className="font-normal text-slate-500">({item.tests || item.title})</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">
                          {item.labId} • <span className="font-semibold text-slate-700">{item.action}</span> • {item.performedBy}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD 4: Lab request (Orders from OPD & IPD modules) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px] min-h-[230px]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Lab request</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Orders from OPD & IPD modules</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/new-bill')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                + New request
              </button>
            </div>

            {/* Recent OPD / IPD Requests Overview */}
            <div className="my-auto py-2">
              {rawReportsList.filter(item => item.isOpdOrIpd).length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-2">
                  <div className="w-8 h-8 rounded-md bg-slate-100/90 flex items-center justify-center text-slate-400 mb-1.5">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No OPD / IPD lab orders</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Orders placed from OPD or IPD will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rawReportsList
                    .filter(item => item.isOpdOrIpd)
                    .slice(0, 2)
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{item.patientName}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              item.source === 'IPD' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>{item.source || 'OPD'} • {item.regNo}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{item.tests}</span>
                        </div>
                        {item.statusCategory === 'create_bill' ? (
                          <button
                            type="button"
                            onClick={() => handleCreateBillFromOpd(item)}
                            className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-md cursor-pointer shrink-0 shadow-2xs"
                          >
                            Create bill
                          </button>
                        ) : (item.statusCategory === 'final' || item.statusCategory === 'signed_off') ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReportPrint(item.rawRequest)}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md cursor-pointer shrink-0"
                          >
                            View report
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenProcessRequest(item.rawRequest)}
                            className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md cursor-pointer shrink-0"
                          >
                            Enter results
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {renderSharedModals()}

    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
