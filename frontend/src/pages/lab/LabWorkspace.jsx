import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatUhid, sanitizePatientName } from '../../utils/uhid';
import { sanitizeClonedDocumentForPdf } from '../../utils/pdfUtils';
import {
  Activity,
  BadgeIndianRupee,
  CheckCircle,
  ClipboardList,
  Eye,
  FileText,
  History,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  UserCheck,
  Users,
  X,
  Download,
  Unlock,
  Printer,
  Calendar,
  AlertCircle,
  Clock,
  TrendingUp,
  PlusCircle,
  CheckSquare,
  FilePlus
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DiagnosisTemplateDesigner from './DiagnosisTemplateDesigner.jsx';
import DiagnosisDynamicReport from './DiagnosisDynamicReport.jsx';

const sampleStatuses = ['Not Collected', 'Home Sample Assigned', 'On The Way To Patient', 'Sample Collected', 'On The Way To Lab', 'Sample Submitted', 'Closed'];
const reportStatuses = ['Pending', 'In Progress', 'Ready', 'Completed', 'Delivered', 'Closed'];
const cancellationReasons = ['Patient Not Interested', 'Patient Chose Another Lab', 'Duplicate Booking', 'Invalid Request', 'Other'];
const units = ['g/dL', 'million/uL', 'cells/uL', 'lakh/uL', 'x10^3/uL', 'mg/dL', '%', 'mmol/L', 'U/L', 'uIU/mL', 'ng/mL', 'pg/mL'];
const presetCategories = ['Blood Tests', 'Blood Sugar Tests', 'Lipid Profile', 'Liver Function Test', 'Kidney Function Test (KFT / RFT)', 'Infection Tests', 'Thyroid Test', 'Cardiac Markers (Heart tests)'];
const DIAGNOSIS_CATEGORY_NAME = 'Diagnosis';

const blankTest = { category: 'Blood Tests', test: '', title: '', description: '', notes: '', basePrice: 0, taxPercentage: 0, totalAmount: 0, isManualTotal: false, parameters: [], signatoryId: '' };
const blankProfile = { name: '', address: '', mobile: '', alternateMobile: '', email: '', website: '', logoUrl: '', reportHeader: '', reportFooter: '', isActive: true };
const blankSignatory = { name: '', designation: '', qualification: '', signatureImageUrl: '', cloudinaryPublicId: '', isActive: true };
const blankAssistant = { employeeId: '', name: '', mobile: '', username: '', password: '', workRole: '', status: 'Active' };

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN') : '-';
const labelize = (value) => value?.replaceAll('_', ' ') || '-';
const assistantName = (request) => request.assignedAssistantId?.doctorName || request.assignedAssistantId?.username || '-';

const ageFromDob = (dob) => {
  if (!dob) return '-';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const badgeClass = (value) => {
  if (['Closed', 'Delivered', 'Ready', 'Completed'].includes(value)) return 'bg-emerald-50 text-emerald-700';
  if (['Sample Collected', 'Sample Submitted', 'In Progress'].includes(value)) return 'bg-blue-50 text-blue-700';
  if (['Home Sample Assigned', 'On The Way To Patient', 'On The Way To Lab'].includes(value)) return 'bg-amber-50 text-amber-700';
  return 'bg-gray-100 text-gray-700';
};

const readDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const Field = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
    {children}
  </label>
);

const EmptyState = ({ title }) => (
  <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/50 p-8 text-center text-sm font-semibold text-gray-500">{title}</div>
);

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const SearchableDropdown = ({
  value,
  options,
  onSelect,
  getLabel = (item) => item?.name || item || '',
  renderOption,
  placeholder = 'Search...',
  createLabel,
  onCreate,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const selectedLabel = value || '';
  const searchText = open ? query : selectedLabel;
  const filtered = options.filter((option) => getLabel(option).toLowerCase().includes(searchText.toLowerCase()));
  const hasExact = options.some((option) => normalizeKey(getLabel(option)) === normalizeKey(searchText));
  const canCreate = onCreate && searchText.trim() && !hasExact;

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="input"
          style={{paddingLeft: '52px'}}
          disabled={disabled}
          value={searchText}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
      </div>
      {open && !disabled && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-orange-100 bg-white p-1 shadow-xl">
          {filtered.map((option) => (
            <button
              key={option._id || getLabel(option)}
              type="button"
              className="flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-orange-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(option);
                setOpen(false);
                setQuery('');
              }}
            >
              {renderOption ? renderOption(option) : <span className="font-bold text-gray-800">{getLabel(option)}</span>}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-2 text-xs font-semibold text-gray-400">No matches found.</p>}
          {canCreate && (
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-2 rounded-md border border-dashed border-orange-200 px-3 py-2 text-left text-sm font-bold text-orange-700 hover:bg-orange-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onCreate(searchText.trim());
                setOpen(false);
                setQuery('');
              }}
            >
              <Plus className="h-4 w-4" />
              {createLabel(searchText.trim())}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const RichToolbar = ({ value, onChange }) => {
  const apply = (tag) => {
    const selected = window.getSelection?.().toString();
    if (!selected) return;
    onChange(value.replace(selected, `<${tag}>${selected}</${tag}>`));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => apply('strong')}>B</button>
        <button type="button" className="btn-secondary px-3 py-2 text-xs italic" onClick={() => apply('em')}>I</button>
        <button type="button" className="btn-secondary px-3 py-2 text-xs underline" onClick={() => apply('u')}>U</button>
        <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => onChange(`${value}<ul><li>New point</li></ul>`)}>Bullets</button>
      </div>
      <textarea className="input min-h-28" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
};

const LabWorkspace = () => {
  const { user } = useAuth();
  const location = useLocation();
  const querySection = new URLSearchParams(location.search).get('section');
  const validSections = ['dashboard', 'tracking', 'history', 'reports', 'settings', 'billing'];
  const [section, setSection] = useState(validSections.includes(querySection) ? querySection : 'dashboard');
  const [settingsTab, setSettingsTab] = useState('tests');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({});
  const [requests, setRequests] = useState([]);
  const [tests, setTests] = useState([]);
  const [testCategories, setTestCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [signatories, setSignatories] = useState([]);
  const [assistants, setAssistants] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [sampleFilter, setSampleFilter] = useState('');
  const [reportFilter, setReportFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [historyRecords, setHistoryRecords] = useState([]);
  const [expandedLabId, setExpandedLabId] = useState(null);
  
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [templateTest, setTemplateTest] = useState(null);
  const [diagnosisTemplate, setDiagnosisTemplate] = useState(null);
  const [diagnosisTemplateLoading, setDiagnosisTemplateLoading] = useState(false);
  const [testForm, setTestForm] = useState(blankTest);
  const [profileForm, setProfileForm] = useState(blankProfile);
  const [signatoryForm, setSignatoryForm] = useState(blankSignatory);
  const [assistantForm, setAssistantForm] = useState(blankAssistant);

  // Advanced Dashboard & Direct Request States
  const [dashboardFilter, setDashboardFilter] = useState('all');
  const [dashboardStartDate, setDashboardStartDate] = useState('');
  const [dashboardEndDate, setDashboardEndDate] = useState('');

  const [directPatientSearchQuery, setDirectPatientSearchQuery] = useState('');
  const [searchedPatients, setSearchedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [directTests, setDirectTests] = useState([]);
  const [directCollectionType, setDirectCollectionType] = useState('Lab Visit');
  const [directRemarks, setDirectRemarks] = useState('');
  const [recommendedTests, setRecommendedTests] = useState([]);
  const [consultationInfo, setConsultationInfo] = useState(null);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTestTitle, setSelectedTestTitle] = useState('');
  
  // Billing Module States
  const [bills, setBills] = useState([]);
  const [activeBill, setActiveBill] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'Cash', transactionRef: '', remarks: '' });
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  
  const reportPrintRef = useRef(null);
  const billPrintRef = useRef(null);

  const captureElementAsPdf = async (element) => {
    if (!element) {
      throw new Error('Printable document is not available');
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
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    return pdf;
  };

  const waitForReportRef = async (timeout = 1200) => {
    const start = Date.now();
    while (!reportPrintRef.current && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!reportPrintRef.current) {
      throw new Error('Printable report element did not mount in time');
    }
    return reportPrintRef.current;
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stats, reqs, testData, categoryData, profileData, signatoryData, assistantData, historyData, billsData] = await Promise.all([
        client.get('/lab/dashboard'),
        client.get('/lab/requests'),
        client.get('/lab/tests'),
        client.get('/lab/test-categories'),
        client.get('/lab/profiles'),
        client.get('/lab/signatories'),
        client.get('/lab/assistants?limit=50'),
        client.get('/lab/history'),
        client.get('/lab/bills')
      ]);
      setDashboard(stats.data);
      setRequests(reqs.data);
      setTests(testData.data);
      setTestCategories(categoryData.data);
      setProfiles(profileData.data);
      setSignatories(signatoryData.data);
      setAssistants(assistantData.data);
      setHistoryRecords(historyData.data);
      setBills(billsData.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load lab module');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const sectionParam = new URLSearchParams(location.search).get('section');
    if (sectionParam && validSections.includes(sectionParam)) {
      setSection((current) => current !== sectionParam ? sectionParam : current);
    } else {
      setSection((current) => current !== 'dashboard' ? 'dashboard' : current);
    }
  }, [location.search]);

  const fetchDashboardData = async () => {
    try {
      let statsUrl = '/lab/dashboard';
      let reqsUrl = '/lab/requests';
      const params = [];
      const reqQueryParts = [];

      if (dashboardFilter !== 'all') {
        params.push(`filter=${dashboardFilter}`);
        if (dashboardFilter === 'custom') {
          if (dashboardStartDate) {
            params.push(`startDate=${dashboardStartDate}`);
            reqQueryParts.push(`startDate=${new Date(dashboardStartDate).toISOString()}`);
          }
          if (dashboardEndDate) {
            params.push(`endDate=${dashboardEndDate}`);
            const end = new Date(dashboardEndDate);
            end.setHours(23, 59, 59, 999);
            reqQueryParts.push(`endDate=${end.toISOString()}`);
          }
        } else {
          const now = new Date();
          let startVal = '';
          if (dashboardFilter === 'today') {
            startVal = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          } else if (dashboardFilter === 'week') {
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            startVal = startOfWeek.toISOString();
          } else if (dashboardFilter === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            startVal = startOfMonth.toISOString();
          }
          if (startVal) {
            reqQueryParts.push(`startDate=${startVal}`);
          }
        }
      }

      const queryStr = params.length ? `?${params.join('&')}` : '';
      const reqQueryStr = reqQueryParts.length ? `?${reqQueryParts.join('&')}` : '';

      const [stats, reqs, billsData] = await Promise.all([
        client.get(`${statsUrl}${queryStr}`),
        client.get(`${reqsUrl}${reqQueryStr}`),
        client.get(`/lab/bills${reqQueryStr}`)
      ]);
      setDashboard(stats.data);
      setRequests(reqs.data);
      setBills(billsData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchDashboardData();
    }
  }, [dashboardFilter, dashboardStartDate, dashboardEndDate]);

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map();
    presetCategories.forEach((name) => categoryMap.set(normalizeKey(name), { name }));
    testCategories.forEach((category) => categoryMap.set(normalizeKey(category.name), category));
    tests.forEach((test) => {
      if (test.category) categoryMap.set(normalizeKey(test.category), { name: test.category });
    });
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [testCategories, tests]);

  const testsForCategory = useMemo(() => {
    if (!testForm.category) return tests;
    return tests.filter((test) => normalizeKey(test.category) === normalizeKey(testForm.category));
  }, [tests, testForm.category]);

  const selectedTestRecord = useMemo(() => {
    return tests.find((test) => normalizeKey(test.category) === normalizeKey(testForm.category) && normalizeKey(test.test) === normalizeKey(testForm.test));
  }, [tests, testForm.category, testForm.test]);

  const testByTitle = useMemo(() => {
    const lookup = new Map();
    tests.forEach((test) => lookup.set(normalizeKey(test.title), test));
    return lookup;
  }, [tests]);

  const calculatedTestTotal = useMemo(() => {
    const base = Number(testForm.basePrice) || 0;
    const tax = Number(testForm.taxPercentage) || 0;
    return Number((base + ((base * tax) / 100)).toFixed(2));
  }, [testForm.basePrice, testForm.taxPercentage]);

  const selectCategoryForForm = (category) => {
    const name = category?.name || category || '';
    setTestForm((current) => ({ ...current, category: name, test: '', title: '' }));
  };

  const selectTestForForm = (test) => {
    setTestForm({
      ...blankTest,
      ...test,
      category: test.category,
      test: test.test,
      title: test.title || test.test,
      totalAmount: test.totalAmount ?? test.basePrice ?? 0
    });
  };

  const createCategory = async (name) => {
    const existing = categoryOptions.find((category) => normalizeKey(category.name) === normalizeKey(name));
    if (existing) {
      selectCategoryForForm(existing);
      return existing;
    }

    try {
      const res = await client.post('/lab/test-categories', { name });
      setTestCategories((current) => [...current, res.data]);
      setTestForm((current) => ({ ...current, category: res.data.name, test: '', title: '' }));
      toast.success('Category created');
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create category');
      return null;
    }
  };

  const createTestForCategory = async (testName, categoryName = testForm.category, addToDirectRequest = false) => {
    const category = String(categoryName || '').trim();
    const name = String(testName || '').trim();
    if (!category) {
      toast.error('Select a category first.');
      return null;
    }
    if (!name) return null;

    const existing = tests.find((test) => normalizeKey(test.category) === normalizeKey(category) && normalizeKey(test.test) === normalizeKey(name));
    if (existing) {
      if (addToDirectRequest) handleAddAdditionalTest(existing.title);
      else selectTestForForm(existing);
      return existing;
    }

    try {
      const isDiagnosis = normalizeKey(category) === normalizeKey(DIAGNOSIS_CATEGORY_NAME);
      const res = await client.post('/lab/tests', {
        category,
        test: name,
        title: name,
        description: '',
        notes: '',
        basePrice: 0,
        taxPercentage: 0,
        // Diagnosis tests don't use parameter-based machine results (they use the Diagnosis Template Designer).
        parameters: isDiagnosis ? [] : [{ name: 'Result', description: '', referenceRange: 'As per lab standards', unit: 'N/A', status: 'Active' }],
        status: 'Active'
      });
      setTests((current) => [...current, res.data].sort((a, b) => a.category.localeCompare(b.category) || a.test.localeCompare(b.test)));
      if (addToDirectRequest) handleAddAdditionalTest(res.data.title);
      else selectTestForForm(res.data);
      toast.success('Test created');
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create test');
      return null;
    }
  };

  const handlePatientSearch = async (query) => {
    if (!query.trim()) return;
    setIsSearchingPatients(true);
    try {
      const res = await client.get(`/patients?search=${encodeURIComponent(query)}`);
      setSearchedPatients(res.data);
      if (res.data.length === 0) {
        toast.error('No patients found.');
      }
    } catch (err) {
      toast.error('Error searching patients');
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSearchedPatients([]);
    try {
      const res = await client.get(`/lab/patients/${patient._id}/recommended-tests`);
      setRecommendedTests(res.data.recommendedTests || []);
      setConsultationInfo(res.data.consultation || null);
      setDirectTests(res.data.recommendedTests || []);
    } catch (err) {
      console.error('Error fetching recommended tests', err);
    }
  };

  const handleAddAdditionalTest = (testTitle) => {
    if (!testTitle) return;
    if (directTests.some((test) => normalizeKey(test) === normalizeKey(testTitle))) {
      toast.error('Test is already added.');
      return;
    }
    setDirectTests([...directTests, testTitle]);
  };

  const handleRemoveDirectTest = (testTitle) => {
    setDirectTests(directTests.filter(t => t !== testTitle));
  };

  const handleCreateDirectRequest = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please search and select a patient first.');
      return;
    }
    if (directTests.length === 0) {
      toast.error('Please select at least one test.');
      return;
    }
    try {
      const res = await client.post('/lab/requests/direct', {
        patientId: selectedPatient._id,
        tests: directTests,
        collectionType: directCollectionType,
        remarks: directRemarks
      });
      toast.success(res.data.message || 'Lab requests created successfully!');
      setModal(null);
      setSelectedPatient(null);
      setDirectTests([]);
      setDirectRemarks('');
      setDirectCollectionType('Lab Visit');
      setRecommendedTests([]);
      setConsultationInfo(null);
      setDirectPatientSearchQuery('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating lab request');
    }
  };

  const handleReceivePayment = async (e) => {
    if (e) e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    try {
      const res = await client.post(`/lab/bills/${activeBill._id}/payments`, {
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        transactionRef: paymentForm.transactionRef,
        remarks: paymentForm.remarks
      });
      toast.success('Payment received successfully!');
      setActiveBill(res.data);
      setPaymentForm({ amount: '', paymentMethod: 'Cash', transactionRef: '', remarks: '' });
      setModal('viewBill');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing payment.');
    }
  };

  const downloadBillPdf = async (bill) => {
    try {
      const pdf = await captureElementAsPdf(billPrintRef.current);
      const filename = `${bill.labId || 'bill'}_Bill.pdf`;
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Bill PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Error generating PDF. Please try again.');
    }
  };

  const printBill = async (bill) => {
    try {
      const pdf = await captureElementAsPdf(billPrintRef.current);
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch (error) {
      console.error('PDF print error:', error);
      toast.error('Error opening print window. Please try again.');
    }
  };

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const haystack = [
      request.labId,
      request.patientId?.uhid,
      request.patientId?.patientName,
      request.patientId?.mobile,
      request.tests?.join(' ')
    ].join(' ').toLowerCase();
    
    const matchesText = haystack.includes(search.toLowerCase());
    const matchesSample = !sampleFilter || request.sampleStatus === sampleFilter;
    
    let matchesReport = true;
    if (reportFilter) {
      if (reportFilter === 'Pending') {
        matchesReport = ['Pending', 'In Progress'].includes(request.reportStatus);
      } else if (reportFilter === 'Completed') {
        matchesReport = ['Completed', 'Ready'].includes(request.reportStatus);
      } else {
        matchesReport = request.reportStatus === reportFilter;
      }
    }

    let matchesDate = true;
    if (startDate || endDate) {
      const reqDate = new Date(request.createdAt);
      reqDate.setHours(0, 0, 0, 0);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (reqDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (reqDate > end) matchesDate = false;
      }
    }
    
    return matchesText && matchesSample && matchesReport && matchesDate;
  }), [requests, search, sampleFilter, reportFilter, startDate, endDate]);

  const filteredBills = useMemo(() => bills.filter((bill) => {
    const haystack = [
      bill.billNo,
      bill.labId,
      bill.patientId?.uhid,
      bill.patientId?.patientName,
      bill.patientId?.mobile,
      bill.testDetails?.map(t => t.name).join(' ')
    ].join(' ').toLowerCase();

    const matchesText = haystack.includes(search.toLowerCase());
    const matchesStatus = !paymentStatusFilter || bill.paymentStatus === paymentStatusFilter;

    let matchesDate = true;
    if (startDate || endDate) {
      const billDate = new Date(bill.createdAt);
      billDate.setHours(0, 0, 0, 0);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (billDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (billDate > end) matchesDate = false;
      }
    }

    return matchesText && matchesStatus && matchesDate;
  }), [bills, search, paymentStatusFilter, startDate, endDate]);

  const pagedBills = filteredBills.slice((paymentPage - 1) * 10, paymentPage * 10);
  const paymentPageCount = Math.max(Math.ceil(filteredBills.length / 10), 1);

  const pagedRequests = filteredRequests.slice((page - 1) * 10, page * 10);
  const pageCount = Math.max(Math.ceil(filteredRequests.length / 10), 1);

  const recentRequestsList = useMemo(() => {
    return requests.slice(0, 5);
  }, [requests]);

  const recentReportsList = useMemo(() => {
    return requests.filter(r => ['Completed', 'Ready', 'Delivered'].includes(r.reportStatus)).slice(0, 5);
  }, [requests]);

  const alerts = useMemo(() => {
    const list = [];
    const pendingCount = requests.filter(r => ['Not Collected', 'Home Sample Assigned', 'On The Way To Patient'].includes(r.sampleStatus)).length;
    if (pendingCount > 0) {
      list.push({
        id: 'pending-samples',
        type: 'warning',
        title: `${pendingCount} Sample Collections Pending`,
        message: 'Ensure walk-in collections are attended and home sample kits are prepared.'
      });
    }

    const delayedHome = requests.filter(r => 
      r.collectionType === 'Home Sample Collection' && 
      ['Home Sample Assigned', 'On The Way To Patient'].includes(r.sampleStatus) &&
      (Date.now() - new Date(r.createdAt).getTime()) > 4 * 60 * 60 * 1000
    );
    if (delayedHome.length > 0) {
      list.push({
        id: 'delayed-home',
        type: 'error',
        title: `${delayedHome.length} Home Sample Visits Delayed`,
        message: 'Assigned visits are taking longer than 4 hours. Contact assistants.'
      });
    }

    const readyReports = requests.filter(r => ['Completed', 'Ready'].includes(r.reportStatus)).length;
    if (readyReports > 0) {
      list.push({
        id: 'ready-reports',
        type: 'info',
        title: `${readyReports} Reports Ready for Delivery`,
        message: 'Patient reports are verified and locked. Send notifications.'
      });
    }

    const newHomeRequests = requests.filter(r => 
      r.collectionType === 'Home Sample Collection' && 
      r.sampleStatus === 'Home Sample Assigned' &&
      (Date.now() - new Date(r.createdAt).getTime()) < 24 * 60 * 60 * 1000
    ).length;
    if (newHomeRequests > 0) {
      list.push({
        id: 'new-home-reqs',
        type: 'success',
        title: `${newHomeRequests} New Home Sample Bookings`,
        message: 'New home collection visits registered in the last 24 hours.'
      });
    }

    return list;
  }, [requests]);

  const pendingTasks = useMemo(() => {
    return {
      pendingCollection: requests.filter(r => ['Not Collected', 'Home Sample Assigned', 'On The Way To Patient'].includes(r.sampleStatus)).length,
      pendingReports: requests.filter(r => ['Sample Collected', 'Sample Submitted'].includes(r.sampleStatus) && ['Pending', 'In Progress'].includes(r.reportStatus)).length,
      pendingHomeVisits: requests.filter(r => r.collectionType === 'Home Sample Collection' && ['Home Sample Assigned', 'On The Way To Patient', 'Sample Collected', 'On The Way To Lab'].includes(r.sampleStatus)).length,
      reportsReady: requests.filter(r => ['Completed', 'Ready'].includes(r.reportStatus)).length,
      closedRequests: requests.filter(r => r.sampleStatus === 'Closed' || r.reportStatus === 'Closed').length
    };
  }, [requests]);

  const homeUpdates = useMemo(() => {
    const homeRequests = requests.filter(r => r.collectionType === 'Home Sample Collection');
    return homeRequests.map(req => {
      const latestUpdate = req.statusHistory?.[req.statusHistory.length - 1] || {};
      return {
        labId: req.labId,
        uhid: req.patientId?.uhid,
        patientName: req.patientId?.patientName,
        assistantName: latestUpdate.assistantName || req.assignedAssistantId?.doctorName || req.assignedAssistantId?.username || 'Unassigned',
        status: req.sampleStatus,
        updatedTime: latestUpdate.updatedAt ? new Date(latestUpdate.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : formatDate(req.updatedAt || req.createdAt)
      };
    }).slice(0, 5);
  }, [requests]);

  const assistantActivities = useMemo(() => {
    const activities = [];
    requests.forEach(req => {
      (req.statusHistory || []).forEach(history => {
        if (history.assistantName && history.assistantName !== 'System') {
          activities.push({
            assistantName: history.assistantName,
            action: history.status,
            labId: req.labId,
            time: new Date(history.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            dateTime: new Date(history.updatedAt)
          });
        }
      });
    });
    return activities.sort((a, b) => b.dateTime - a.dateTime).slice(0, 6);
  }, [requests]);

  const dailyRequests = useMemo(() => {
    const counts = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      counts[dateString] = 0;
    }
    requests.forEach(req => {
      const dateString = new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (counts[dateString] !== undefined) {
        counts[dateString]++;
      }
    });
    return Object.entries(counts).map(([date, count]) => ({ label: date, value: count }));
  }, [requests]);

  const sampleStats = useMemo(() => {
    const counts = { 'Collected/Submitted': 0, 'Pending': 0 };
    requests.forEach(req => {
      if (['Sample Collected', 'Sample Submitted'].includes(req.sampleStatus)) {
        counts['Collected/Submitted']++;
      } else {
        counts['Pending']++;
      }
    });
    return counts;
  }, [requests]);

  const reportStats = useMemo(() => {
    const counts = { Pending: 0, 'In Progress': 0, Completed: 0, Delivered: 0 };
    requests.forEach(req => {
      if (['Completed', 'Ready'].includes(req.reportStatus)) counts.Completed++;
      else if (req.reportStatus === 'In Progress') counts['In Progress']++;
      else if (req.reportStatus === 'Delivered') counts.Delivered++;
      else counts.Pending++;
    });
    return counts;
  }, [requests]);

  const topTests = useMemo(() => {
    const counts = {};
    requests.forEach(req => {
      (req.tests || []).forEach(testName => {
        counts[testName] = (counts[testName] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [requests]);

  const openModal = (type, request = null) => {
    setActiveRequest(request ? JSON.parse(JSON.stringify(request)) : null);
    setModal(type);
  };

  const openDiagnosisTemplate = (test) => {
    setTemplateTest(test);
    setModal('diagnosisTemplate');
  };

  const updateRequest = async (request, payload, success = 'Request updated') => {
    await client.put(`/lab/requests/${request._id}`, payload);
    toast.success(success);
    setModal(null);
    setActiveRequest(null);
    loadAll();
  };

  const saveTest = async (event) => {
    event.preventDefault();
    try {
      await client[testForm._id ? 'put' : 'post'](testForm._id ? `/lab/tests/${testForm._id}` : '/lab/tests', {
        ...testForm,
        title: testForm.title || testForm.test,
        totalAmount: calculatedTestTotal,
        isManualTotal: false
      });
      toast.success('Lab test saved');
      setTestForm(blankTest);
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save lab test');
    }
  };

  const uploadImageToCloudinary = async (file, folder) => {
    if (!file) return null;
    try {
      const dataUrl = await readDataUrl(file);
      const { data } = await client.post('/lab/upload-image', {
        imageData: dataUrl,
        folder
      });
      toast.success('Image uploaded successfully');
      return data.url;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image to Cloudinary');
      console.error('Cloudinary upload error:', error);
      return null;
    }
  };

  const uploadImagesToCloudinaryMeta = async (files, folder = 'hms/diagnosis-reports') => {
    if (!files?.length) return [];
    const results = [];
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const dataUrl = await readDataUrl(file);
      // eslint-disable-next-line no-await-in-loop
      const { data } = await client.post('/lab/upload-image', { imageData: dataUrl, folder });
      if (data?.url) results.push({ url: data.url, publicId: data.publicId });
    }
    toast.success('Images uploaded successfully');
    return results;
  };

  const deleteCloudinaryImageByPublicId = async (publicId) => {
    if (!publicId) return;
    try {
      await client.post('/lab/delete-image', { publicId });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete image');
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const res = await client[profileForm._id ? 'put' : 'post'](profileForm._id ? `/lab/profiles/${profileForm._id}` : '/lab/profiles', profileForm);
      toast.success('Lab details saved');
      setProfileForm({ ...res.data, logoImageData: '' });
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save lab details');
    }
  };

  const saveSignatory = async (event) => {
    event.preventDefault();
    try {
      const res = await client[signatoryForm._id ? 'put' : 'post'](signatoryForm._id ? `/lab/signatories/${signatoryForm._id}` : '/lab/signatories', signatoryForm);
      toast.success('Signatory saved');
      setSignatoryForm({ ...res.data, signatureImageData: '' });
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save signatory');
    }
  };

  const saveAssistant = async (event) => {
    event.preventDefault();
    try {
      await client[assistantForm._id ? 'put' : 'post'](assistantForm._id ? `/lab/assistants/${assistantForm._id}` : '/lab/assistants', assistantForm);
      toast.success('Lab assistant saved');
      setAssistantForm(blankAssistant);
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save assistant');
    }
  };

  const removeItem = async (url, label) => {
    if (!window.confirm(`Delete ${label}?`)) return;
    await client.delete(url);
    toast.success(`${label} deleted`);
    loadAll();
  };

  const activeTestMaster = useMemo(() => {
    if (!activeRequest) return null;
    const testName = activeRequest.tests?.[0];
    if (!testName) return null;
    return (
      tests.find((t) => normalizeKey(t.title) === normalizeKey(testName))
      || tests.find((t) => normalizeKey(t.test) === normalizeKey(testName))
      || null
    );
  }, [activeRequest, tests]);

  const isDiagnosisReport = Boolean(
    activeTestMaster && normalizeKey(activeTestMaster.category) === normalizeKey(DIAGNOSIS_CATEGORY_NAME)
  );

  useEffect(() => {
    if (!activeRequest) return;
    if (!['report', 'viewReport'].includes(modal)) return;

    if (!isDiagnosisReport) {
      setDiagnosisTemplate(null);
      setDiagnosisTemplateLoading(false);
      return;
    }

    if (!activeTestMaster?._id) return;

    setDiagnosisTemplateLoading(true);
    client
      .get(`/lab/diagnosis-templates/test/${activeTestMaster._id}`)
      .then((res) => {
        setDiagnosisTemplate(res.data || null);
        setActiveRequest((prev) => {
          if (!prev) return prev;
          const report = prev.report || {};
          const nextReport = { ...report };
          if (!nextReport.dynamicFields) nextReport.dynamicFields = {};
          if (res.data?._id && !nextReport.dynamicTemplateId) nextReport.dynamicTemplateId = res.data._id;
          return { ...prev, report: nextReport };
        });
      })
      .catch((error) => {
        setDiagnosisTemplate(null);
        toast.error(error.response?.data?.message || 'Unable to load diagnosis template');
      })
      .finally(() => setDiagnosisTemplateLoading(false));
  }, [activeRequest?._id, activeTestMaster?._id, isDiagnosisReport, modal]);

  const reportParameters = activeRequest ? (
    isDiagnosisReport
      ? []
      : (
        activeRequest.report?.parameters?.length
          ? activeRequest.report.parameters
          : tests.find((test) => test.title === activeRequest.tests?.[0])?.parameters?.map((param) => ({ name: param.name, value: '', referenceRange: param.referenceRange, unit: param.unit })) || []
      )
  ) : [];

  const updateParameterValue = (index, value) => {
    const updated = [...reportParameters];
    updated[index].value = value;
    setActiveRequest({
      ...activeRequest,
      report: {
        ...(activeRequest.report || {}),
        parameters: updated
      }
    });
  };

  const handleSaveDraft = async (e, closeAfter = false) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        notes: activeRequest.report?.notes || '',
        remarks: activeRequest.report?.remarks || '',
        interpretation: activeRequest.report?.interpretation || '',
        parameters: reportParameters,
        signatoryId: activeRequest.report?.signatoryId || ''
      };
      if (isDiagnosisReport) {
        payload.dynamicFields = activeRequest.report?.dynamicFields || {};
        payload.dynamicTemplateId = activeRequest.report?.dynamicTemplateId || diagnosisTemplate?._id || '';
      }

      const res = await client.post(`/lab/requests/${activeRequest._id}/report-draft`, payload);
      toast.success('Report draft saved successfully');
      if (closeAfter) {
        setModal(null);
        setActiveRequest(null);
      } else {
        setActiveRequest(res.data);
      }
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving draft');
    }
  };

  const handleGenerateReport = async () => {
    if (!activeRequest.report?.signatoryId) {
      toast.error('Please select an authorized signatory');
      return;
    }
    
    const params = reportParameters;
    if (isDiagnosisReport) {
      if (diagnosisTemplateLoading) {
        toast.error('Loading diagnosis template...');
        return;
      }
      if (!diagnosisTemplate?._id) {
        toast.error('No diagnosis template configured for this test. Please set it in Lab Settings.');
        return;
      }
    } else {
      if (!params || params.length === 0) {
        toast.error('Test parameters are missing. Configure parameters in Lab Settings > Report Builder.');
        return;
      }
      
      for (const param of params) {
        if (param.value === undefined || param.value === null || param.value.toString().trim() === '') {
          toast.error(`Please enter result value for parameter: ${param.name}`);
          return;
        }
      }
    }
    
    if (!window.confirm('Are you sure you want to generate the final report? This will lock the report from accidental modification.')) {
      return;
    }
    
    try {
      const payload = {
        notes: activeRequest.report?.notes || '',
        remarks: activeRequest.report?.remarks || '',
        interpretation: activeRequest.report?.interpretation || '',
        parameters: params,
        signatoryId: activeRequest.report?.signatoryId || ''
      };
      if (isDiagnosisReport) {
        payload.dynamicFields = activeRequest.report?.dynamicFields || {};
        payload.dynamicTemplateId = activeRequest.report?.dynamicTemplateId || diagnosisTemplate?._id || '';
      }
      const res = await client.post(`/lab/requests/${activeRequest._id}/report-generate`, payload);
      toast.success('Report generated and saved to Patient History!');
      setActiveRequest(res.data);
      setModal('viewReport');
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error generating report');
    }
  };

  const handleUnlockReport = async () => {
    if (!window.confirm('Are you sure you want to unlock this report?')) {
      return;
    }
    try {
      const res = await client.post(`/lab/requests/${activeRequest._id}/report-unlock`);
      toast.success('Report unlocked successfully');
      setActiveRequest(res.data);
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error unlocking report');
    }
  };

  const handleMarkDelivered = async () => {
    try {
      const res = await client.post(`/lab/requests/${activeRequest._id}/report-deliver`);
      toast.success('Report marked as delivered');
      setActiveRequest(res.data);
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error marking as delivered');
    }
  };

  const handleMarkCollected = async (request) => {
    if (!window.confirm('Are you sure the patient has collected the report?')) {
      return;
    }
    try {
      const res = await client.post(`/lab/requests/${request._id}/report-collect`);
      toast.success('✓ Report marked as collected. Statuses updated.');
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error marking report as collected');
    }
  };

  const printReport = async (request) => {
    try {
      openModal('viewReport', request);
      await waitForReportRef();
      const pdf = await captureElementAsPdf(reportPrintRef.current);
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch (error) {
      console.error('PDF print error:', error);
      toast.error('Error opening print window. Please try again.');
    }
  };

  const downloadPdf = async (request) => {
    try {
      if (!reportPrintRef.current) {
        openModal('viewReport', request);
        await waitForReportRef();
      }
      const pdf = await captureElementAsPdf(reportPrintRef.current);
      const patientName = sanitizePatientName(request.patientId?.patientName || 'Patient');
      const filename = `${patientName}_${request.labId || 'report'}.pdf`;
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Error generating PDF. Please try again.');
    }
  };

  const saveAndPrintReport = async (e) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        notes: activeRequest.report?.notes || '',
        remarks: activeRequest.report?.remarks || '',
        interpretation: activeRequest.report?.interpretation || '',
        parameters: reportParameters,
        signatoryId: activeRequest.report?.signatoryId || ''
      };
      if (isDiagnosisReport) {
        payload.dynamicFields = activeRequest.report?.dynamicFields || {};
        payload.dynamicTemplateId = activeRequest.report?.dynamicTemplateId || diagnosisTemplate?._id || '';
      }

      const res = await client.post(`/lab/requests/${activeRequest._id}/report-draft`, payload);
      toast.success('Report draft auto-saved');
      loadAll();

      const updatedRequest = res.data;
      openModal('viewReport', updatedRequest);
      await waitForReportRef();
      const pdf = await captureElementAsPdf(reportPrintRef.current);
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Save and Print Error:', error);
      toast.error('Error saving or printing report');
    }
  };

  const saveAndDownloadReport = async (e) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        notes: activeRequest.report?.notes || '',
        remarks: activeRequest.report?.remarks || '',
        interpretation: activeRequest.report?.interpretation || '',
        parameters: reportParameters,
        signatoryId: activeRequest.report?.signatoryId || ''
      };
      if (isDiagnosisReport) {
        payload.dynamicFields = activeRequest.report?.dynamicFields || {};
        payload.dynamicTemplateId = activeRequest.report?.dynamicTemplateId || diagnosisTemplate?._id || '';
      }

      const res = await client.post(`/lab/requests/${activeRequest._id}/report-draft`, payload);
      toast.success('Report draft auto-saved');
      loadAll();

      const updatedRequest = res.data;
      openModal('viewReport', updatedRequest);
      await waitForReportRef();
      const pdf = await captureElementAsPdf(reportPrintRef.current);
      const patientName = sanitizePatientName(updatedRequest.patientId?.patientName || 'Patient');
      const filename = `${patientName}_${updatedRequest.labId || 'report'}.pdf`;
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Save and Download Error:', error);
      toast.error('Error saving or downloading report');
    }
  };

  const requestTable = (rows, { compact = false } = {}) => (
    <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead className="bg-orange-100/70 text-xs uppercase text-orange-900">
          <tr>
            <th className="p-3">Lab ID</th>
            <th className="p-3">UHID / Patient</th>
            <th className="p-3">Test Name</th>
            <th className="p-3">Collection Type</th>
            <th className="p-3">Sample Status</th>
            <th className="p-3">Report Status</th>
            <th className="p-3">Assistant</th>
            <th className="p-3">Created</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="p-5 text-center text-gray-500" colSpan={9}>No lab tracking records found.</td></tr>
          ) : rows.map((request) => (
            <tr key={request._id} className="border-t border-orange-50 align-top">
              <td className="p-3 font-extrabold text-orange-700">{request.labId || 'Generating...'}</td>
              <td className="p-3">
                <p className="font-bold text-gray-900">{formatUhid(request.patientId?.uhid)}</p>
                <p className="text-xs text-gray-600">{request.patientId?.patientName}</p>
                <p className="text-xs text-gray-500">{request.patientId?.mobile}</p>
              </td>
              <td className="p-3">{request.tests?.join(', ')}</td>
              <td className="p-3">
                <p className="font-semibold">{request.collectionType}</p>
                <p className="text-xs text-gray-500">{request.collectionTime || request.patientId?.slot || 'Time not set'}</p>
              </td>
              <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${badgeClass(request.sampleStatus)}`}>{request.sampleStatus || 'Not Collected'}</span></td>
              <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${badgeClass(request.reportStatus)}`}>{request.reportStatus || 'Pending'}</span></td>
              <td className="p-3">
                <p>{assistantName(request)}</p>
                <p className="text-xs text-gray-500">{request.assignedAt ? `Assigned ${formatDate(request.assignedAt)}` : ''}</p>
              </td>
              <td className="p-3">{formatDate(request.createdAt)}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary px-3 py-2 text-xs" onClick={() => openModal('timeline', request)}><History className="h-3 w-3" /> Timeline</button>
                  {!compact && <button className="btn-secondary px-3 py-2 text-xs" onClick={() => openModal('remarks', request)}><Pencil className="h-3 w-3" /> Remarks</button>}
                  {!compact && <button className="btn-secondary px-3 py-2 text-xs" onClick={() => openModal('assign', request)}><UserCheck className="h-3 w-3" /> Assign</button>}
                  {!compact && !request.assignedAssistantId && <button className="btn-secondary px-3 py-2 text-xs" onClick={() => openModal('collect', request)}><CheckCircle className="h-3 w-3" /> Collect</button>}
                  {!compact && !request.assignedAssistantId && <button className="btn-secondary px-3 py-2 text-xs" onClick={() => openModal('future', request)}>Future</button>}
                  
                  {['Sample Collected', 'Sample Submitted'].includes(request.sampleStatus) ? (
                    <button className="btn-secondary px-3 py-2 text-xs text-orange-700 border-orange-200 hover:bg-orange-50" onClick={() => openModal('report', request)}>
                      <FileText className="h-3 w-3" /> {request.reportStatus === 'Pending' ? 'Create Report' : 'Edit Report'}
                    </button>
                  ) : (
                    <button className="btn-secondary px-3 py-2 text-xs opacity-50 cursor-not-allowed" onClick={() => toast.error('Sample collection is pending.')}>
                      <FileText className="h-3 w-3" /> Create Report
                    </button>
                  )}

                  {['Completed', 'Delivered'].includes(request.reportStatus) && (
                    <button className="btn-secondary px-3 py-2 text-xs" onClick={() => openModal('viewReport', request)}><Eye className="h-3 w-3" /> View</button>
                  )}
                  {!compact && <button className="btn-secondary px-3 py-2 text-xs" onClick={() => openModal('close', request)}><X className="h-3 w-3" /> Close</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const dailyRequestsChart = () => {
    const maxVal = Math.max(...dailyRequests.map(d => d.value), 1);
    const height = 140;
    const width = 320;
    const padding = 30;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const barWidth = dailyRequests.length ? (chartWidth / dailyRequests.length) - 8 : 10;
    
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-orange-500" /> Daily Lab Requests</h3>
        {dailyRequests.length === 0 ? (
          <EmptyState title="No data available" />
        ) : (
          <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-h-[140px]">
              {[0, 0.5, 1].map((ratio, index) => {
                const y = padding + chartHeight * (1 - ratio);
                return (
                  <line key={index} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f3f4f6" strokeWidth={1} strokeDasharray="3 3" />
                );
              })}
              {dailyRequests.map((d, i) => {
                const barHeight = (d.value / maxVal) * chartHeight;
                const x = padding + i * (chartWidth / dailyRequests.length) + 4;
                const y = height - padding - barHeight;
                return (
                  <g key={i} className="group">
                    <title>{`${d.label}: ${d.value} requests`}</title>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={3}
                      fill="url(#barGradient)"
                      className="transition duration-300 hover:fill-orange-600"
                    />
                    <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#6b7280">{d.value}</text>
                    <text x={x + barWidth / 2} y={height - padding + 15} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#9ca3af">{d.label}</text>
                  </g>
                );
              })}
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ffedd5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </div>
    );
  };

  const sampleCollectionChart = () => {
    const total = (sampleStats['Collected/Submitted'] + sampleStats['Pending']) || 1;
    const collectedPct = Math.round((sampleStats['Collected/Submitted'] / total) * 100);
    const pendingPct = Math.round((sampleStats['Pending'] / total) * 100);

    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><CheckSquare className="h-4 w-4 text-emerald-500" /> Sample Collection Status</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
              <span>Collected or Submitted</span>
              <span>{sampleStats['Collected/Submitted']} ({collectedPct}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${collectedPct}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
              <span>Pending Collection</span>
              <span>{sampleStats['Pending']} ({pendingPct}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${pendingPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const reportStatusChart = () => {
    const total = (reportStats.Pending + reportStats['In Progress'] + reportStats.Completed + reportStats.Delivered) || 1;
    const items = [
      { label: 'Pending', count: reportStats.Pending, color: 'bg-gray-400' },
      { label: 'In Progress', count: reportStats['In Progress'], color: 'bg-blue-500' },
      { label: 'Completed', count: reportStats.Completed, color: 'bg-emerald-500' },
      { label: 'Delivered', count: reportStats.Delivered, color: 'bg-teal-500' }
    ];

    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><FileText className="h-4 w-4 text-indigo-500" /> Report Generation Status</h3>
        <div className="space-y-2">
          {items.map(item => {
            const pct = Math.round((item.count / total) * 100);
            return (
              <div key={item.label}>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>{item.label}</span>
                  <span>{item.count} ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const homeSampleRequestsChart = () => {
    const homeCount = requests.filter(r => r.collectionType === 'Home Sample Collection').length;
    const walkInCount = requests.filter(r => r.collectionType !== 'Home Sample Collection').length;
    const total = (homeCount + walkInCount) || 1;
    const homePct = Math.round((homeCount / total) * 100);
    const walkInPct = Math.round((walkInCount / total) * 100);

    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-purple-500" /> Home vs. Walk-In Requests</h3>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <span className="w-3 h-3 rounded-full bg-purple-500 block"></span>
              <span>Home ({homeCount})</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <span className="w-3 h-3 rounded-full bg-orange-400 block"></span>
              <span>Walk-In ({walkInCount})</span>
            </div>
          </div>
          <div className="relative flex justify-center">
            <svg viewBox="0 0 36 36" className="w-20 h-20">
              <path className="text-orange-100" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-purple-500" strokeDasharray={`${homePct}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black text-purple-800">{homePct}%</span>
              <span className="text-[7px] uppercase font-bold text-gray-400">Home</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const mostPerformedTestsChart = () => {
    const maxVal = topTests.length ? Math.max(...topTests.map(t => t.count), 1) : 1;
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><ClipboardList className="h-4 w-4 text-orange-500" /> Most Performed Tests</h3>
        {topTests.length === 0 ? (
          <EmptyState title="No data available" />
        ) : (
          <div className="space-y-3">
            {topTests.map((t, idx) => {
               const pct = Math.round((t.count / maxVal) * 100);
               return (
                 <div key={idx} className="space-y-1">
                   <div className="flex justify-between text-xs font-bold text-gray-700">
                     <span className="truncate max-w-[200px]">{t.name}</span>
                     <span>{t.count} times</span>
                   </div>
                   <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
                     <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                   </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-5">
      
      {/* Summary Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {[
          { label: 'Total Lab Requests', value: dashboard.totalRequests, icon: ClipboardList, desc: 'Total Lab IDs generated', color: 'border-orange-200 text-orange-600 bg-orange-50/40' },
          { label: 'Total Patients', value: dashboard.totalPatients, icon: Users, desc: 'Unique Patient UHIDs', color: 'border-blue-200 text-blue-600 bg-blue-50/40' },
          { label: 'Sample Collected', value: dashboard.totalSampleCollected, icon: CheckSquare, desc: 'Collected or Submitted', color: 'border-emerald-200 text-emerald-600 bg-emerald-50/40' },
          { label: 'Pending Collection', value: dashboard.pendingSampleCollection, icon: Clock, desc: 'Awaiting collection/transit', color: 'border-amber-200 text-amber-600 bg-amber-50/40' },
          { label: 'Reports Generated', value: dashboard.totalReportsGenerated, icon: FileText, desc: 'Ready for delivery', color: 'border-indigo-200 text-indigo-600 bg-indigo-50/40' },
          { label: 'Reports Delivered', value: dashboard.totalReportsDelivered, icon: CheckCircle, desc: 'Handed over to patient', color: 'border-teal-200 text-teal-600 bg-teal-50/40' },
          { label: 'Closed Requests', value: dashboard.closedRequests, icon: X, desc: 'Cancelled or terminated', color: 'border-rose-200 text-rose-600 bg-rose-50/40' },
          { label: 'Home Sample Requests', value: dashboard.homeSampleRequests, icon: MapPin, desc: 'Home visits registered', color: 'border-purple-200 text-purple-600 bg-purple-50/40' }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-xl border p-4 bg-white shadow-sm hover:shadow-md transition duration-200 flex items-start justify-between relative overflow-hidden group`}>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
                <p className="text-3xl font-black text-gray-900">{card.value ?? 0}</p>
                <p className="text-[10px] font-medium text-gray-400">{card.desc}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${card.color} transition duration-200 group-hover:scale-105`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Panel */}
      <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-orange-500" /> Quick Actions
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'New Lab Request', icon: PlusCircle, action: () => openModal('directRequest'), color: 'hover:bg-orange-50 hover:text-orange-700 border-orange-100 hover:border-orange-200' },
            { label: 'Search Patient', icon: Search, action: () => { setSection('history'); }, color: 'hover:bg-blue-50 hover:text-blue-700 border-blue-100 hover:border-blue-200' },
            { label: 'Create Report', icon: FilePlus, action: () => { setSection('reports'); setReportFilter('Pending'); }, color: 'hover:bg-indigo-50 hover:text-indigo-700 border-indigo-100 hover:border-indigo-200' },
            { label: 'Patient History', icon: History, action: () => { setSection('history'); }, color: 'hover:bg-purple-50 hover:text-purple-700 border-purple-100 hover:border-purple-200' },
            { label: 'View Billing', icon: BadgeIndianRupee, action: () => { setSection('billing'); }, color: 'hover:bg-emerald-50 hover:text-emerald-700 border-emerald-100 hover:border-emerald-200' },
            { label: 'Home Requests', icon: MapPin, action: () => { setSection('tracking'); setSampleFilter('Home Sample Assigned'); }, color: 'hover:bg-amber-50 hover:text-amber-700 border-amber-100 hover:border-amber-200' }
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.action}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center font-bold text-gray-700 bg-white transition duration-200 hover:shadow-sm ${action.color} text-xs gap-2`}
              >
                <Icon className="h-5 w-5" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left (Tables, Charts) vs Right (Filters, Alerts, Timelines) */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        
        {/* Left Side: Charts & Tables */}
        <div className="space-y-5">
          {/* Charts Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {dailyRequestsChart()}
            {mostPerformedTestsChart()}
            {sampleCollectionChart()}
            {reportStatusChart()}
            <div className="sm:col-span-2">
              {homeSampleRequestsChart()}
            </div>
          </div>

          {/* Recent Lab Requests */}
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <ClipboardList className="h-4.5 w-4.5 text-orange-500" /> Recent Lab Requests
            </h2>
            <div className="overflow-x-auto rounded-lg border border-orange-50">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-orange-50 text-orange-950 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2.5">Lab ID</th>
                    <th className="p-2.5">UHID / Patient</th>
                    <th className="p-2.5">Test Name</th>
                    <th className="p-2.5">Sample Status</th>
                    <th className="p-2.5">Report Status</th>
                    <th className="p-2.5">Created Date</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequestsList.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-400 italic">No recent requests.</td></tr>
                  ) : recentRequestsList.map((req) => (
                    <tr key={req._id} className="border-t border-orange-50 align-middle">
                      <td className="p-2.5 font-black text-orange-700">{req.labId}</td>
                      <td className="p-2.5">
                        <p className="font-bold text-gray-800">{formatUhid(req.patientId?.uhid)}</p>
                        <p className="text-gray-500">{req.patientId?.patientName}</p>
                      </td>
                      <td className="p-2.5 font-semibold text-gray-700">{req.tests?.join(', ')}</td>
                      <td className="p-2.5">
                        <span className={`rounded-full px-2 py-0.5 font-bold text-[9px] ${badgeClass(req.sampleStatus)}`}>{req.sampleStatus}</span>
                      </td>
                      <td className="p-2.5">
                        <span className={`rounded-full px-2 py-0.5 font-bold text-[9px] ${badgeClass(req.reportStatus)}`}>{req.reportStatus}</span>
                      </td>
                      <td className="p-2.5 text-gray-500">{formatDate(req.createdAt)}</td>
                      <td className="p-2.5 text-right space-x-1 shrink-0">
                        <button className="btn-secondary py-1 px-2 text-[10px]" onClick={() => openModal('timeline', req)}>Track</button>
                        {['Sample Collected', 'Sample Submitted'].includes(req.sampleStatus) ? (
                          <button className="btn-secondary py-1 px-2 text-[10px] text-orange-700 border-orange-200" onClick={() => openModal('report', req)}>Report</button>
                        ) : (
                          <button className="btn-secondary py-1 px-2 text-[10px] opacity-40 cursor-not-allowed" onClick={() => toast.error('Sample collection pending.')}>Report</button>
                        )}
                        {['Completed', 'Delivered'].includes(req.reportStatus) && (
                          <button className="btn-secondary py-1 px-2 text-[10px]" onClick={() => openModal('viewReport', req)}>View</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-orange-500" /> Recently Generated Reports
            </h2>
            <div className="overflow-x-auto rounded-lg border border-orange-50">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-orange-50 text-orange-950 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2.5">Lab ID</th>
                    <th className="p-2.5">UHID / Patient</th>
                    <th className="p-2.5">Test Name</th>
                    <th className="p-2.5">Generated Date</th>
                    <th className="p-2.5">Report Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReportsList.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-400 italic">No recent reports generated.</td></tr>
                  ) : recentReportsList.map((req) => (
                    <tr key={req._id} className="border-t border-orange-50 align-middle">
                      <td className="p-2.5 font-black text-orange-700">{req.labId}</td>
                      <td className="p-2.5">
                        <p className="font-bold text-gray-800">{formatUhid(req.patientId?.uhid)}</p>
                        <p className="text-gray-500">{req.patientId?.patientName}</p>
                      </td>
                      <td className="p-2.5 font-semibold text-gray-700">{req.tests?.join(', ')}</td>
                      <td className="p-2.5 text-gray-500">{formatDate(req.report?.generatedAt || req.createdAt)}</td>
                      <td className="p-2.5">
                        <span className={`rounded-full px-2 py-0.5 font-bold text-[9px] ${badgeClass(req.reportStatus)}`}>{req.reportStatus}</span>
                      </td>
                      <td className="p-2.5 text-right space-x-1">
                        <button className="btn-secondary py-1 px-2 text-[10px]" onClick={() => openModal('viewReport', req)}>View Report</button>
                        <button className="btn py-1 px-2 text-[10px]" onClick={() => { setActiveRequest(req); setTimeout(() => downloadPdf(req), 100); }}>Download PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Filters, Alerts, Pending, Activity Updates */}
        <div className="space-y-4">
          
          {/* Dashboard Filters */}
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Dashboard Date Range</h3>
            <div className="space-y-2">
              <select
                className="input text-xs"
                value={dashboardFilter}
                onChange={(e) => {
                  setDashboardFilter(e.target.value);
                  if (e.target.value !== 'custom') {
                    setDashboardStartDate('');
                    setDashboardEndDate('');
                  }
                }}
              >
                <option value="all">All-Time Statistics</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Date Range</option>
              </select>

              {dashboardFilter === 'custom' && (
                <div className="grid gap-2 grid-cols-2 mt-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Start Date</span>
                    <input type="date" className="input text-xs py-1" value={dashboardStartDate} onChange={(e) => setDashboardStartDate(e.target.value)} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">End Date</span>
                    <input type="date" className="input text-xs py-1" value={dashboardEndDate} onChange={(e) => setDashboardEndDate(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Alerts & Notifications */}
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Alerts & Notifications</h3>
            {alerts.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No active system alerts.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => {
                  let colorClass = 'bg-blue-50 border-blue-200 text-blue-800';
                  if (alert.type === 'warning') colorClass = 'bg-amber-50 border-amber-200 text-amber-800';
                  if (alert.type === 'error') colorClass = 'bg-rose-50 border-rose-200 text-rose-800';
                  if (alert.type === 'success') colorClass = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                  return (
                    <div key={alert.id} className={`p-3 rounded-lg border text-xs leading-relaxed ${colorClass}`}>
                      <p className="font-extrabold flex items-center gap-1">{alert.title}</p>
                      <p className="text-[10px] mt-0.5 opacity-80">{alert.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Tasks Panel */}
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Pending Tasks</h3>
            <div className="space-y-2 text-xs font-semibold text-gray-700">
              {[
                { label: 'Pending Sample Collections', val: pendingTasks.pendingCollection, color: 'text-amber-600 bg-amber-50' },
                { label: 'Pending Reports to Generate', val: pendingTasks.pendingReports, color: 'text-blue-600 bg-blue-50' },
                { label: 'Pending Home Sample Visits', val: pendingTasks.pendingHomeVisits, color: 'text-purple-600 bg-purple-50' },
                { label: 'Reports Ready for Collection', val: pendingTasks.reportsReady, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Closed Requests (All Time)', val: pendingTasks.closedRequests, color: 'text-gray-500 bg-gray-50' }
              ].map((task, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded border border-orange-50 hover:bg-orange-50/20 transition">
                  <span>{task.label}</span>
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${task.color}`}>{task.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Home Sample Tracking Updates */}
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Home Sample Updates</h3>
            {homeUpdates.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No recent home collection updates.</p>
            ) : (
              <div className="space-y-2">
                {homeUpdates.map((update, i) => (
                  <div key={i} className="border border-orange-50 rounded-lg p-2.5 space-y-1 bg-gray-50/30 text-xs">
                    <div className="flex justify-between">
                      <span className="font-extrabold text-orange-700">{update.labId}</span>
                      <span className="text-[10px] font-bold text-gray-400">{update.updatedTime}</span>
                    </div>
                    <p className="font-bold text-gray-800">{update.patientName} <span className="font-normal text-gray-400">({formatUhid(update.uhid)})</span></p>
                    <p className="text-[10px] text-gray-500">Assistant: <span className="font-bold">{update.assistantName}</span></p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${update.status === 'Sample Collected' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                      <span className="font-extrabold text-[10px] text-gray-600">{update.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lab Assistant Activity */}
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Lab Assistant Activity</h3>
            {assistantActivities.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No assistant updates logged.</p>
            ) : (
              <div className="relative pl-3 border-l border-orange-100 space-y-3 text-xs">
                {assistantActivities.map((act, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[16.5px] top-1.5 block h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                    <div className="flex justify-between items-start">
                      <p className="font-extrabold text-gray-900 leading-tight">{act.assistantName}</p>
                      <span className="text-[9px] text-gray-400 font-bold ml-2 shrink-0">{act.time}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-0.5">{act.action} <span className="font-bold text-orange-600">{act.labId}</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );

  const renderTrackingFilters = () => (
    <div className="flex flex-col gap-3 rounded-lg border border-orange-100 bg-white p-3 md:flex-row md:items-center">
      <select className="input md:w-56" value={sampleFilter} onChange={(event) => { setSampleFilter(event.target.value); setPage(1); }}>
        <option value="">All Sample Status</option>
        {sampleStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select className="input md:w-56" value={reportFilter} onChange={(event) => { setReportFilter(event.target.value); setPage(1); }}>
        <option value="">All Report Status</option>
        {reportStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <div className="ml-auto flex items-center gap-2 text-sm font-semibold text-gray-500">
        <button className="btn-secondary px-3 py-2 text-xs" disabled={page === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Prev</button>
        Page {page} / {pageCount}
        <button className="btn-secondary px-3 py-2 text-xs" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>Next</button>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-orange-100 bg-white p-3 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-3 w-full items-center">
          <select className="input max-w-xs" value={reportFilter} onChange={(e) => { setReportFilter(e.target.value); setPage(1); }}>
            <option value="">All Report Statuses</option>
            <option value="Pending">Pending Reports</option>
            <option value="Completed">Completed Reports</option>
            <option value="Delivered">Delivered Reports</option>
          </select>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">From:</span>
            <input type="date" className="input py-1.5 text-sm" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            <span className="text-xs font-bold text-gray-500">To:</span>
            <input type="date" className="input py-1.5 text-sm" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
          </div>
          
          <div className="ml-auto flex items-center gap-2 text-sm font-semibold text-gray-500">
            <button className="btn-secondary px-3 py-2 text-xs" disabled={page === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Prev</button>
            Page {page} / {pageCount}
            <button className="btn-secondary px-3 py-2 text-xs" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>Next</button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-orange-100/70 text-xs uppercase text-orange-900">
            <tr>
              <th className="p-3">Lab ID</th>
              <th className="p-3">UHID</th>
              <th className="p-3">Patient Name</th>
              <th className="p-3">Test Name</th>
              <th className="p-3">Sample Status</th>
              <th className="p-3">Report Status</th>
              <th className="p-3">Created Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedRequests.length === 0 ? (
              <tr><td className="p-5 text-center text-gray-500" colSpan={8}>No reports found matching selection.</td></tr>
            ) : pagedRequests.map((request) => (
              <tr key={request._id} className="border-t border-orange-50 align-top">
                <td className="p-3 font-extrabold text-orange-700">{request.labId || 'Generating...'}</td>
                <td className="p-3 font-bold text-gray-900">{formatUhid(request.patientId?.uhid)}</td>
                <td className="p-3">{request.patientId?.patientName}</td>
                <td className="p-3">{request.tests?.join(', ')}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${badgeClass(request.sampleStatus)}`}>
                    {request.sampleStatus || 'Not Collected'}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${badgeClass(request.reportStatus)}`}>
                    {request.reportStatus || 'Pending'}
                  </span>
                </td>
                <td className="p-3">{formatDate(request.createdAt)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {/* Create Report / Edit Report action */}
                    {['Sample Collected', 'Sample Submitted'].includes(request.sampleStatus) ? (
                      request.reportStatus !== 'Completed' && request.reportStatus !== 'Delivered' ? (
                        <button className="btn-secondary px-3 py-1.5 text-xs text-orange-700 border-orange-200 hover:bg-orange-50" onClick={() => openModal('report', request)}>
                          <Pencil className="h-3 w-3" /> {request.reportStatus === 'In Progress' ? 'Edit Report' : 'Create Report'}
                        </button>
                      ) : (
                        <button className="btn-secondary px-3 py-1.5 text-xs bg-gray-50 text-gray-500 border-gray-200" onClick={() => openModal('report', request)}>
                          <Eye className="h-3 w-3" /> View Draft
                        </button>
                      )
                    ) : (
                      <button className="btn-secondary px-3 py-1.5 text-xs opacity-50 cursor-not-allowed border-gray-200" onClick={() => toast.error('Sample collection is pending.')}>
                        <Pencil className="h-3 w-3" /> Create Report
                      </button>
                    )}
                    
                    {/* View action (only if generated/completed) */}
                    {['Completed', 'Delivered'].includes(request.reportStatus) && (
                      <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => openModal('viewReport', request)}>
                        <Eye className="h-3 w-3" /> View
                      </button>
                    )}
                    
                    {/* Download PDF action */}
                    {['Completed', 'Delivered'].includes(request.reportStatus) && (
                      <button className="btn px-3 py-1.5 text-xs flex items-center gap-1" onClick={() => { setActiveRequest(request); setTimeout(() => downloadPdf(request), 100); }}>
                        <Download className="h-3 w-3" /> PDF
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const groupedHistory = useMemo(() => {
    const groups = {};
    requests.forEach((req) => {
      const pid = req.patientId?.uhid;
      if (!pid) return;

      const haystack = [
        req.labId,
        req.patientId?.uhid,
        req.patientId?.patientName,
        req.patientId?.mobile,
        req.tests?.join(' ')
      ].join(' ').toLowerCase();
      
      const matchesText = haystack.includes(search.toLowerCase());
      
      let matchesSampleFilter = true;
      if (sampleFilter === 'Sample Collected') {
        matchesSampleFilter = ['Sample Collected', 'Sample Submitted', 'testing_in_progress', 'completed', 'delivered', 'report_ready'].includes(req.sampleStatus) || ['Sample Collected', 'Sample Submitted'].includes(req.sampleStatus) || req.report?.completionDate;
      }
      
      let matchesReportFilter = true;
      if (reportFilter === 'Report Generated') {
        matchesReportFilter = ['Completed', 'Ready', 'Delivered'].includes(req.reportStatus);
      } else if (reportFilter === 'Report Delivered') {
        matchesReportFilter = ['Delivered'].includes(req.reportStatus);
      }
      
      let matchesDate = true;
      if (startDate || endDate) {
        const reqDate = new Date(req.createdAt);
        reqDate.setHours(0, 0, 0, 0);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (reqDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (reqDate > end) matchesDate = false;
        }
      }

      if (!matchesText || !matchesSampleFilter || !matchesReportFilter || !matchesDate) return;

      if (!groups[pid]) {
        groups[pid] = {
          patient: req.patientId,
          requests: []
        };
      }
      groups[pid].requests.push(req);
    });
    return Object.values(groups);
  }, [requests, search, sampleFilter, reportFilter, startDate, endDate]);

  const renderHistory = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-lg border border-orange-100 bg-white p-3 md:flex-row md:items-center justify-between">
          <div>
            <p className="font-bold text-gray-800 text-lg">Patient Medical Report History</p>
            <p className="text-xs text-gray-500">Search and view patient diagnostics grouped by UHID.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="input max-w-xs text-sm" value={sampleFilter} onChange={(e) => setSampleFilter(e.target.value)}>
              <option value="">All Sample Statuses</option>
              <option value="Sample Collected">Sample Collected</option>
            </select>
            <select className="input max-w-xs text-sm" value={reportFilter} onChange={(e) => setReportFilter(e.target.value)}>
              <option value="">All Report Statuses</option>
              <option value="Report Generated">Report Generated</option>
              <option value="Report Delivered">Report Delivered</option>
            </select>
          </div>
        </div>

        {groupedHistory.length === 0 ? (
          <EmptyState title="No patient report history found matching search criteria." />
        ) : (
          groupedHistory.map((group) => {
            const patient = group.patient;
            return (
              <div key={patient?._id} className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
                <div className="bg-orange-50/50 p-4 border-b border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded font-extrabold tracking-wider">UHID: {formatUhid(patient?.uhid)}</span>
                    <h3 className="text-xl font-extrabold text-gray-900 mt-1">{patient?.patientName}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-gray-600">
                    <div><p className="text-gray-400 font-bold uppercase">Age</p><p className="font-extrabold text-gray-800">{ageFromDob(patient?.dob)} Yrs</p></div>
                    <div><p className="text-gray-400 font-bold uppercase">Gender</p><p className="font-extrabold text-gray-800">{patient?.gender}</p></div>
                    <div><p className="text-gray-400 font-bold uppercase">Mobile</p><p className="font-extrabold text-gray-800">{patient?.mobile}</p></div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {group.requests.map((request) => {
                    const isExpanded = expandedLabId === request.labId;
                    
                    const requestCreatedTime = new Date(request.createdAt).toLocaleString('en-IN');
                    const sampleCollectedTime = request.collectionDate ? `${formatDate(request.collectionDate)} ${request.collectionTime || ''}` : null;
                    const reportGeneratedTime = request.report?.generatedAt ? `${formatDate(request.report.generatedAt)} ${request.report.completionTime || ''}` : null;
                    const reportCollectedTime = request.report?.collectedAt ? `${formatDate(request.report.collectedAt)} ${request.report.collectedTime || ''}` : null;

                    const friendlyCollectionType = request.collectionType === 'Home Sample Collection' ? 'Home Collection' : 'Walk-In Collection';

                    return (
                      <div key={request._id} className="rounded-lg border border-orange-100 overflow-hidden">
                        <div
                          className="p-3 bg-gray-50/50 hover:bg-orange-50/20 cursor-pointer flex flex-wrap justify-between items-center gap-3 transition"
                          onClick={() => setExpandedLabId(isExpanded ? null : request.labId)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-orange-700">{request.labId}</span>
                            <span className="text-gray-400">|</span>
                            <span className="font-bold text-gray-800">{request.tests?.join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`rounded-full px-2 py-0.5 font-bold ${badgeClass(request.reportStatus)}`}>
                              Report: {request.reportStatus}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 font-bold ${request.report?.collectionStatus === 'Collected' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              Collection: {request.report?.collectionStatus || 'Not Collected'}
                            </span>
                            <span className="text-gray-400 font-extrabold text-lg select-none ml-1">{isExpanded ? '−' : '+'}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 bg-white border-t border-orange-100 space-y-5">
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs border border-orange-50 p-3 rounded-lg bg-orange-50/10">
                              <div><p className="text-gray-400 font-bold uppercase">Lab ID</p><p className="font-extrabold text-gray-800">{request.labId}</p></div>
                              <div><p className="text-gray-400 font-bold uppercase">Test Category</p><p className="font-extrabold text-gray-800">{tests.find(t => t.title === request.tests?.[0])?.category || 'General'}</p></div>
                              <div><p className="text-gray-400 font-bold uppercase">Test Name</p><p className="font-extrabold text-gray-800">{request.tests?.join(', ')}</p></div>
                              <div><p className="text-gray-400 font-bold uppercase">Collection Type</p><p className="font-extrabold text-gray-800">{friendlyCollectionType}</p></div>
                              <div><p className="text-gray-400 font-bold uppercase">Assigned Assistant</p><p className="font-extrabold text-gray-800">{assistantName(request)}</p></div>
                              <div><p className="text-gray-400 font-bold uppercase">Sample Status</p><p className="font-extrabold text-gray-800">{request.sampleStatus || 'Not Collected'}</p></div>
                              <div><p className="text-gray-400 font-bold uppercase">Report Status</p><p className="font-extrabold text-gray-800">{request.reportStatus || 'Pending'}</p></div>
                              <div><p className="text-gray-400 font-bold uppercase">Remarks</p><p className="font-extrabold text-gray-800">{request.remarks || 'No remarks'}</p></div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                              <div className="space-y-4">
                                <h4 className="font-bold text-gray-800 border-b border-orange-100 pb-1 text-sm">Diagnostic Workflow Timeline</h4>
                                <div className="pl-4 border-l-2 border-orange-200 space-y-4 relative text-xs">
                                  <div className="relative">
                                    <span className="absolute -left-[21px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white font-bold">1</span>
                                    <p className="font-bold text-gray-900">Request Created</p>
                                    <p className="text-gray-500">{requestCreatedTime}</p>
                                  </div>

                                  <div className="relative">
                                    <span className={`absolute -left-[21px] top-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white font-bold ${sampleCollectedTime ? 'bg-orange-500' : 'bg-gray-300'}`}>2</span>
                                    <p className={`font-bold ${sampleCollectedTime ? 'text-gray-900' : 'text-gray-400'}`}>Sample Collected</p>
                                    {sampleCollectedTime ? (
                                      <>
                                        <p className="text-gray-500">{sampleCollectedTime}</p>
                                        <p className="text-[10px] text-gray-400 font-semibold">Collected By: {request.collectedByName || 'Staff'}</p>
                                      </>
                                    ) : (
                                      <p className="text-gray-400 italic">Pending Collection</p>
                                    )}
                                  </div>

                                  <div className="relative">
                                    <span className={`absolute -left-[21px] top-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white font-bold ${reportGeneratedTime ? 'bg-orange-500' : 'bg-gray-300'}`}>3</span>
                                    <p className={`font-bold ${reportGeneratedTime ? 'text-gray-900' : 'text-gray-400'}`}>Report Generated</p>
                                    {reportGeneratedTime ? (
                                      <>
                                        <p className="text-gray-500">{reportGeneratedTime}</p>
                                        <p className="text-[10px] text-gray-400 font-semibold">Generated By: {request.report?.generatedBy?.username || request.report?.generatedBy || 'Lab Staff'}</p>
                                      </>
                                    ) : (
                                      <p className="text-gray-400 italic">Pending Lab Entry</p>
                                    )}
                                  </div>

                                  <div className="relative">
                                    <span className={`absolute -left-[21px] top-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white font-bold ${reportCollectedTime ? 'bg-orange-500' : 'bg-gray-300'}`}>4</span>
                                    <p className={`font-bold ${reportCollectedTime ? 'text-gray-900' : 'text-gray-400'}`}>Report Collected</p>
                                    {reportCollectedTime ? (
                                      <>
                                        <p className="text-gray-500">{reportCollectedTime}</p>
                                        <p className="text-[10px] text-gray-400 font-semibold">Collected By: {request.report?.collectedBy?.username || request.report?.collectedBy || 'Billing Desk'}</p>
                                      </>
                                    ) : (
                                      <p className="text-gray-400 italic">Pending Collection</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="font-bold text-gray-800 border-b border-orange-100 pb-1 text-sm">Actions & Reports</h4>
                                <div className="space-y-3">
                                  <div className="rounded-lg bg-orange-50/50 p-3 border border-orange-100 text-xs">
                                    <p className="font-bold text-gray-700">Report Collection Status:</p>
                                    <p className="mt-1 font-semibold text-orange-900 text-sm">{request.report?.collectionStatus || 'Not Collected'}</p>
                                    {request.report?.collectedAt && (
                                      <p className="text-[10px] text-gray-400 mt-1">Collected on {formatDate(request.report.collectedAt)} at {request.report.collectedTime}</p>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {['Completed', 'Delivered'].includes(request.reportStatus) && (
                                      <>
                                        <button className="btn flex items-center gap-1.5 py-1.5 px-3 text-xs" onClick={() => openModal('viewReport', request)}>
                                          <Eye className="h-3.5 w-3.5" /> View Report
                                        </button>
                                        <button className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs" onClick={() => { setActiveRequest(request); setTimeout(() => downloadPdf(request), 100); }}>
                                          <Download className="h-3.5 w-3.5" /> Download PDF
                                        </button>
                                        <button className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs" onClick={() => printReport(request)}>
                                          Print Report
                                        </button>
                                      </>
                                    )}

                                    {['Completed', 'Delivered'].includes(request.reportStatus) && request.report?.collectionStatus !== 'Collected' && (
                                      <button className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 py-1.5 px-3 text-xs border-emerald-600 ml-auto" onClick={() => handleMarkCollected(request)}>
                                        <CheckCircle className="h-3.5 w-3.5" /> Mark As Collected
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {[
            ['tests', 'Test Management'],
            ['profile', 'Lab Details'],
            ['signatories', 'Signatories'],
            ['assistants', 'Assistants'],
            ['builder', 'Report Builder'],
            ['reports', 'View Reports']
          ].map(([id, label]) => (
            <button key={id} className={settingsTab === id ? 'btn px-3 py-2 text-sm' : 'btn-secondary px-3 py-2 text-sm'} onClick={() => setSettingsTab(id)}>{label}</button>
          ))}
        </div>
        {settingsTab === 'builder' && normalizeKey(testForm.category) === normalizeKey(DIAGNOSIS_CATEGORY_NAME) && selectedTestRecord && (
          <button
            type="button"
            className="btn-secondary px-3 py-2 text-xs text-orange-700 border-orange-200 hover:bg-orange-50"
            onClick={() => openDiagnosisTemplate(selectedTestRecord)}
          >
            <FileText className="h-3 w-3" /> Manage Report Structure
          </button>
        )}
      </div>
      {settingsTab === 'tests' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-3">
            {tests.length === 0 ? <EmptyState title="No tests configured yet." /> : tests.map((test) => (
              <div key={test._id} className="rounded-lg border border-orange-100 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase text-orange-500">{test.category}</p>
                        {normalizeKey(test.category) === normalizeKey(DIAGNOSIS_CATEGORY_NAME) && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-xs px-2 py-0.5 font-semibold text-gray-700">System</span>
                        )}
                      </div>
                      <h3 className="text-lg font-extrabold text-gray-900">{test.test}</h3>
                      <p className="text-sm text-gray-600 mb-1">{test.title}</p>
                      <p className="text-sm text-gray-500">{test.parameters?.length || 0} parameters | {money(test.totalAmount)}</p>
                    </div>
                  <div className="flex gap-2">
                    {(user?.role === 'admin' || user?.role === 'lab' || user?.moduleAccess?.includes(4)) && normalizeKey(test.category) === normalizeKey(DIAGNOSIS_CATEGORY_NAME) && (
                      <button className="btn-secondary px-3 py-2 text-xs text-orange-700 border-orange-200 hover:bg-orange-50" onClick={() => openDiagnosisTemplate(test)}>
                        <FileText className="h-3 w-3" /> Manage Report Template
                      </button>
                    )}
                    <button className="btn-secondary px-3 py-2 text-xs" onClick={() => setTestForm(test)}><Pencil className="h-3 w-3" /> Edit</button>
                    <button className="btn-secondary px-3 py-2 text-xs" onClick={() => removeItem(`/lab/tests/${test._id}`, 'test')}><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={saveTest} className="space-y-3 rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
            <h2 className="font-extrabold text-gray-900">{testForm._id ? 'Edit Test' : 'Create Test'}</h2>
            <Field label="Test Category">
              <SearchableDropdown
                value={testForm.category}
                options={categoryOptions}
                getLabel={(category) => category.name}
                placeholder="Search category..."
                onSelect={selectCategoryForForm}
                onCreate={createCategory}
                createLabel={(name) => `+ Create new category "${name}"`}
              />
              {normalizeKey(testForm.category) === normalizeKey(DIAGNOSIS_CATEGORY_NAME) && (
                <p className="text-xs text-gray-500 mt-1">System category — default diagnosis tests are preloaded and editable.</p>
              )}
            </Field>
            <Field label="Test Name">
              <SearchableDropdown
                value={testForm.test}
                options={testsForCategory}
                getLabel={(test) => test.test}
                placeholder={testForm.category ? 'Search test...' : 'Select category first'}
                disabled={!testForm.category}
                onSelect={selectTestForForm}
                onCreate={(name) => createTestForCategory(name)}
                createLabel={(name) => `+ Create new test "${name}"`}
                renderOption={(test) => (
                  <div>
                    <p className="font-bold text-gray-900">{test.test}</p>
                    <p className="text-xs font-semibold text-gray-500">{test.category} | {money(test.totalAmount)}</p>
                  </div>
                )}
              />
            </Field>
            <Field label="Test Title"><input className="input" value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} required /></Field>
            <Field label="Authorized Signatory">
              <SearchableDropdown
                value={signatories.find(s => s._id === testForm.signatoryId)?.name || ''}
                options={signatories}
                getLabel={(s) => s.name}
                placeholder="Search signatory..."
                onSelect={(s) => setTestForm({ ...testForm, signatoryId: s._id })}
                renderOption={(s) => (
                  <div>
                    <p className="font-bold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.designation}</p>
                  </div>
                )}
              />
            </Field>
            <Field label="Description"><RichToolbar value={testForm.description} onChange={(description) => setTestForm({ ...testForm, description })} /></Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Base Price"><input className="input" type="number" value={testForm.basePrice} onChange={(e) => setTestForm({ ...testForm, basePrice: e.target.value })} /></Field>
              <Field label="Tax %"><input className="input" type="number" value={testForm.taxPercentage} onChange={(e) => setTestForm({ ...testForm, taxPercentage: e.target.value })} /></Field>
              <Field label="Total Amount"><input className="input bg-gray-50 font-bold text-gray-800" type="number" value={calculatedTestTotal} readOnly /></Field>
            </div>
            <button className="btn w-full" type="submit"><Save className="h-4 w-4" /> Save Test</button>
          </form>
        </div>
      )}
      {settingsTab === 'profile' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          <div className="space-y-3">{profiles.length === 0 ? <EmptyState title="No lab details added." /> : profiles.map((profile) => (
            <div key={profile._id} className="rounded-lg border border-orange-100 bg-white p-4">
              <div className="flex justify-between gap-3">
                <div><h3 className="font-extrabold text-gray-900">{profile.name}</h3><p className="text-sm text-gray-500">{profile.address}</p><p className="text-sm text-gray-500">{profile.mobile} | {profile.email}</p></div>
                <button className="btn-secondary px-3 py-2 text-xs" onClick={() => setProfileForm(profile)}><Pencil className="h-3 w-3" /> Edit</button>
              </div>
            </div>
          ))}</div>
          <form onSubmit={saveProfile} className="space-y-3 rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
            <h2 className="font-extrabold text-gray-900">Lab / Hospital Details</h2>
            <Field label="Name"><input className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required /></Field>
            <Field label="Address"><textarea className="input" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} required /></Field>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Mobile"><input className="input" value={profileForm.mobile} onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })} required /></Field><Field label="Alternate Mobile"><input className="input" value={profileForm.alternateMobile} onChange={(e) => setProfileForm({ ...profileForm, alternateMobile: e.target.value })} /></Field></div>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Email"><input className="input" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required /></Field><Field label="Website"><input className="input" value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} /></Field></div>
            <Field label="Logo URL"><input className="input" value={profileForm.logoUrl} onChange={(e) => setProfileForm({ ...profileForm, logoUrl: e.target.value })} /></Field>
            <Field label="Upload Logo">
              <div
                className="rounded-lg border border-dashed border-orange-300 bg-orange-50 p-3 text-sm text-gray-600"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  const url = await uploadImageToCloudinary(file, 'hms/lab-logos');
                  if (url) setProfileForm({ ...profileForm, logoUrl: url });
                }}
              >
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImageToCloudinary(file, 'hms/lab-logos');
                    if (url) setProfileForm({ ...profileForm, logoUrl: url });
                  }}
                />
                <p className="mt-2 text-xs text-gray-500">Drag & drop an image here or browse to upload. URL fills automatically.</p>
              </div>
            </Field>
            <Field label="Report Header"><textarea className="input" value={profileForm.reportHeader} onChange={(e) => setProfileForm({ ...profileForm, reportHeader: e.target.value })} /></Field>
            <Field label="Report Footer"><textarea className="input" value={profileForm.reportFooter} onChange={(e) => setProfileForm({ ...profileForm, reportFooter: e.target.value })} /></Field>
            <button className="btn w-full" type="submit"><Save className="h-4 w-4" /> Save Details</button>
          </form>
        </div>
      )}
      {settingsTab === 'signatories' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-3">{signatories.length === 0 ? <EmptyState title="No authorized signatories added." /> : signatories.map((person) => (
            <div key={person._id} className="rounded-lg border border-orange-100 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="font-extrabold text-gray-900">{person.name}</h3><p className="text-sm text-gray-500">{person.designation} | {person.qualification}</p></div>
                <div className="flex gap-2"><button className="btn-secondary px-3 py-2 text-xs" onClick={() => setSignatoryForm(person)}><Pencil className="h-3 w-3" /> Edit</button><button className="btn-secondary px-3 py-2 text-xs" onClick={() => removeItem(`/lab/signatories/${person._id}`, 'signatory')}><Trash2 className="h-3 w-3" /> Delete</button></div>
              </div>
            </div>
          ))}</div>
          <form onSubmit={saveSignatory} className="space-y-3 rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
            <h2 className="font-extrabold text-gray-900">Authorized Signatory</h2>
            <Field label="Name"><input className="input" value={signatoryForm.name} onChange={(e) => setSignatoryForm({ ...signatoryForm, name: e.target.value })} required /></Field>
            <Field label="Designation"><input className="input" value={signatoryForm.designation} onChange={(e) => setSignatoryForm({ ...signatoryForm, designation: e.target.value })} required /></Field>
            <Field label="Qualification"><input className="input" value={signatoryForm.qualification} onChange={(e) => setSignatoryForm({ ...signatoryForm, qualification: e.target.value })} required /></Field>
            <Field label="Cloudinary Signature URL"><input className="input" value={signatoryForm.signatureImageUrl} onChange={(e) => setSignatoryForm({ ...signatoryForm, signatureImageUrl: e.target.value })} /></Field>
            <Field label="Upload Signature">
              <div
                className="rounded-lg border border-dashed border-orange-300 bg-orange-50 p-3 text-sm text-gray-600"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  const url = await uploadImageToCloudinary(file, 'hms/lab-signatures');
                  if (url) setSignatoryForm({ ...signatoryForm, signatureImageUrl: url });
                }}
              >
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImageToCloudinary(file, 'hms/lab-signatures');
                    if (url) setSignatoryForm({ ...signatoryForm, signatureImageUrl: url });
                  }}
                />
                <p className="mt-2 text-xs text-gray-500">Drag & drop an image here or browse to upload. URL fills automatically.</p>
              </div>
            </Field>
            <button className="btn w-full" type="submit"><Save className="h-4 w-4" /> Save Signatory</button>
          </form>
        </div>
      )}
      {settingsTab === 'assistants' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-3">{assistants.items.length === 0 ? <EmptyState title="No lab assistants added." /> : assistants.items.map((assistant) => (
            <div key={assistant._id} className="rounded-lg border border-orange-100 bg-white p-4">
              <div className="flex justify-between gap-3">
                <div><h3 className="font-extrabold text-gray-900">{assistant.name}</h3><p className="text-sm text-gray-500">{assistant.employeeId} | {assistant.workRole}</p><p className="text-xs text-gray-500">{assistant.userId?.username} | {assistant.mobile}</p></div>
                <button className="btn-secondary px-3 py-2 text-xs" onClick={() => setAssistantForm({ ...assistant, username: assistant.userId?.username || '', password: '' })}><Pencil className="h-3 w-3" /> Edit</button>
              </div>
            </div>
          ))}</div>
          <form onSubmit={saveAssistant} className="space-y-3 rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
            <h2 className="font-extrabold text-gray-900">Lab Assistant</h2>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Employee ID"><input className="input" value={assistantForm.employeeId} onChange={(e) => setAssistantForm({ ...assistantForm, employeeId: e.target.value })} required /></Field><Field label="Status"><select className="input" value={assistantForm.status} onChange={(e) => setAssistantForm({ ...assistantForm, status: e.target.value })}><option>Active</option><option>Inactive</option></select></Field></div>
            <Field label="Name"><input className="input" value={assistantForm.name} onChange={(e) => setAssistantForm({ ...assistantForm, name: e.target.value })} required /></Field>
            <Field label="Mobile"><input className="input" value={assistantForm.mobile} onChange={(e) => setAssistantForm({ ...assistantForm, mobile: e.target.value })} required /></Field>
            <Field label="Username / Login ID"><input className="input" value={assistantForm.username} onChange={(e) => setAssistantForm({ ...assistantForm, username: e.target.value })} required /></Field>
            <Field label="Password"><input className="input" type="password" value={assistantForm.password} onChange={(e) => setAssistantForm({ ...assistantForm, password: e.target.value })} placeholder={assistantForm._id ? 'Leave blank to keep existing' : 'Defaults to employee ID'} /></Field>
            <Field label="Work Role"><input className="input" value={assistantForm.workRole} onChange={(e) => setAssistantForm({ ...assistantForm, workRole: e.target.value })} required /></Field>
            <button className="btn w-full" type="submit"><UserCheck className="h-4 w-4" /> Save Assistant</button>
          </form>
        </div>
      )}
      {settingsTab === 'builder' && (
        <form onSubmit={saveTest} className="space-y-4 rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-extrabold text-gray-900">Dynamic Report Builder</h2>
              {normalizeKey(testForm.category) === normalizeKey(DIAGNOSIS_CATEGORY_NAME) && selectedTestRecord && (
                <p className="text-sm text-gray-500">Manage the report structure for this diagnosis test from here.</p>
              )}
            </div>
            {(user?.role === 'admin' || user?.role === 'lab' || user?.moduleAccess?.includes(4)) && normalizeKey(testForm.category) === normalizeKey(DIAGNOSIS_CATEGORY_NAME) && selectedTestRecord && (
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-xs text-orange-700 border-orange-200 hover:bg-orange-50"
                onClick={() => openDiagnosisTemplate(selectedTestRecord)}
              >
                <FileText className="h-3 w-3" /> Manage Report Template
              </button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
            <Field label="Category">
              <SearchableDropdown
                value={testForm.category}
                options={categoryOptions}
                getLabel={(category) => category.name}
                placeholder="Search category..."
                onSelect={selectCategoryForForm}
                onCreate={createCategory}
                createLabel={(name) => `+ Create new category "${name}"`}
              />
            </Field>
            <Field label="Test">
              <SearchableDropdown
                value={testForm.test}
                options={testsForCategory}
                getLabel={(test) => test.test}
                placeholder={testForm.category ? 'Search test...' : 'Select category first'}
                disabled={!testForm.category}
                onSelect={selectTestForForm}
                onCreate={(name) => createTestForCategory(name)}
                createLabel={(name) => `+ Create new test "${name}"`}
                renderOption={(test) => (
                  <div>
                    <p className="font-bold text-gray-900">{test.test}</p>
                    <p className="text-xs font-semibold text-gray-500">{money(test.totalAmount)} | {test.parameters?.length || 0} parameters</p>
                  </div>
                )}
              />
            </Field>
            <Field label="Test Price"><input className="input bg-gray-50 font-bold text-gray-800" value={money(selectedTestRecord?.totalAmount ?? calculatedTestTotal)} readOnly /></Field>
          </div>
          <div className="space-y-3">
            {testForm.parameters.map((param, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-orange-100 p-3 md:grid-cols-5">
                <input className="input" placeholder="Parameter" value={param.name} onChange={(e) => setTestForm({ ...testForm, parameters: testForm.parameters.map((item, i) => i === index ? { ...item, name: e.target.value } : item) })} />
                <input className="input" placeholder="Reference range" value={param.referenceRange} onChange={(e) => setTestForm({ ...testForm, parameters: testForm.parameters.map((item, i) => i === index ? { ...item, referenceRange: e.target.value } : item) })} />
                <input className="input" list="unit-list" placeholder="Unit" value={param.unit} onChange={(e) => setTestForm({ ...testForm, parameters: testForm.parameters.map((item, i) => i === index ? { ...item, unit: e.target.value } : item) })} />
                <select className="input" value={param.status || 'Active'} onChange={(e) => setTestForm({ ...testForm, parameters: testForm.parameters.map((item, i) => i === index ? { ...item, status: e.target.value } : item) })}><option>Active</option><option>Inactive</option></select>
                <button type="button" className="btn-secondary" onClick={() => setTestForm({ ...testForm, parameters: testForm.parameters.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <datalist id="unit-list">{units.map((unit) => <option key={unit} value={unit} />)}</datalist>
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={() => setTestForm({ ...testForm, parameters: [...testForm.parameters, { name: '', description: '', referenceRange: '', unit: '', status: 'Active' }] })}><Plus className="h-4 w-4" /> Add Parameter</button><button className="btn" type="submit"><Save className="h-4 w-4" /> Save Structure</button></div>
        </form>
      )}
      {settingsTab === 'reports' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
            <h2 className="font-extrabold text-gray-900 mb-4">View Lab Reports</h2>
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Select Test Category</label>
                  <SearchableDropdown
                    value={selectedCategory}
                    options={[{ name: '' }, ...categoryOptions]}
                    getLabel={(category) => category.name || 'All Categories'}
                    placeholder="Search category..."
                    onSelect={(category) => {
                      setSelectedCategory(category.name || '');
                      setSelectedTestTitle('');
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Select Test</label>
                  <SearchableDropdown
                    value={selectedTestTitle}
                    options={[{ title: '', test: 'All Tests' }, ...tests.filter(t => !selectedCategory || normalizeKey(t.category) === normalizeKey(selectedCategory))]}
                    getLabel={(test) => test.title || test.test}
                    placeholder="Search test..."
                    onSelect={(test) => setSelectedTestTitle(test.title || '')}
                    renderOption={(test) => (
                      <div>
                        <p className="font-bold text-gray-900">{test.test}</p>
                        {test.category && <p className="text-xs font-semibold text-gray-500">{test.category} | {money(test.totalAmount)}</p>}
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
            <h3 className="font-extrabold text-gray-900 mb-4">Lab Reports</h3>
            {historyRecords.length === 0 ? (
              <EmptyState title="No reports found." />
            ) : (
              <div className="space-y-3">
                {historyRecords
                  .filter(record => {
                    if (selectedCategory && record.testCategory !== selectedCategory) return false;
                    if (selectedTestTitle && record.testName !== selectedTestTitle) return false;
                    return true;
                  })
                  .map((record) => (
                    <div key={record._id} className="rounded-lg border border-orange-100 p-4 hover:shadow-md transition-shadow">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div>
                          <p className="text-xs font-bold uppercase text-orange-500">UHID</p>
                          <p className="font-extrabold text-gray-900">{formatUhid(record.uhid) || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-orange-500">Patient Name</p>
                          <p className="font-extrabold text-gray-900">{record.patientId?.patientName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-orange-500">Test Category</p>
                          <p className="font-extrabold text-gray-900">{record.testCategory || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-orange-500">Test</p>
                          <p className="font-extrabold text-gray-900">{record.testName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3 mt-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-500">Lab ID</p>
                          <p className="text-sm text-gray-700">{record.labId || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-500">Generated Date</p>
                          <p className="text-sm text-gray-700">{formatDate(record.generatedDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-500">Generated By</p>
                          <p className="text-sm text-gray-700">{record.generatedByName || 'N/A'}</p>
                        </div>
                      </div>
                      {record.reportData?.remarks && (
                        <div className="mt-3 pt-3 border-t border-orange-100">
                          <p className="text-xs font-bold uppercase text-gray-500">Remarks</p>
                          <p className="text-sm text-gray-700">{record.reportData.remarks}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderModal = () => {
    if (!modal) return null;
    if (!['directRequest', 'viewBill', 'receivePayment', 'diagnosisTemplate'].includes(modal) && !activeRequest) return null;
    
    // Check if report creation is disabled
    const isSampleReady = activeRequest ? ['Sample Collected', 'Sample Submitted'].includes(activeRequest.sampleStatus) : false;
    
    const isFullWidth = modal === 'diagnosisTemplate';
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className={`max-h-[90vh] w-full ${isFullWidth ? 'max-w-7xl' : 'max-w-4xl'} overflow-y-auto rounded-lg bg-white p-5 shadow-xl`}>
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-orange-100 pb-3">
            {modal === 'directRequest' ? (
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Direct Lab Test Assignment</h2>
                <p className="text-sm text-gray-500">Create new lab requests and assign tests directly to patients.</p>
              </div>
            ) : modal === 'diagnosisTemplate' ? (
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Diagnosis Report Template Designer</h2>
                <p className="text-sm text-gray-500">{templateTest?.test || templateTest?.title || 'Diagnosis Test'}</p>
              </div>
            ) : ['viewBill', 'receivePayment'].includes(modal) ? (
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">{activeBill?.billNo} | Lab ID: {activeBill?.labId}</h2>
                <p className="text-sm text-gray-500">{activeBill?.patientId?.patientName} | UHID: {formatUhid(activeBill?.patientId?.uhid)}</p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">{activeRequest?.labId} | UHID: {formatUhid(activeRequest?.patientId?.uhid)}</h2>
                <p className="text-sm text-gray-500">{activeRequest?.patientId?.patientName} | {activeRequest?.tests?.join(', ')}</p>
              </div>
            )}
            <button className="btn-secondary px-3 py-2" onClick={() => { setModal(null); setActiveRequest(null); setActiveBill(null); setSelectedPatient(null); setDirectTests([]); setTemplateTest(null); }}><X className="h-4 w-4" /></button>
          </div>

          {modal === 'diagnosisTemplate' && (
            <DiagnosisTemplateDesigner
              test={templateTest}
              labProfile={profiles[0]}
              onSaved={loadAll}
              onClose={() => {
                setModal(null);
                setTemplateTest(null);
              }}
            />
          )}

          {modal === 'timeline' && (
            <div className="space-y-3">
              {(activeRequest.statusHistory || []).length === 0 ? <EmptyState title="No timeline entries yet." /> : activeRequest.statusHistory.map((item, index) => (
                <div key={index} className="rounded-lg border border-orange-100 p-3">
                  <p className="font-bold capitalize text-gray-900">{labelize(item.status)}</p>
                  <p className="text-xs text-gray-500">{formatDate(item.updatedAt)} | {item.assistantName || 'System'}</p>
                  {item.notes && <p className="mt-1 text-sm text-gray-600">{item.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {modal === 'remarks' && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); updateRequest(activeRequest, { remarks: activeRequest.remarks }, 'Remarks saved'); }}>
              <Field label="Test Remarks"><textarea className="input min-h-28" value={activeRequest.remarks || ''} onChange={(e) => setActiveRequest({ ...activeRequest, remarks: e.target.value })} placeholder="Fasting Required, Urgent Test, Repeat Test Required" /></Field>
              <button className="btn" type="submit"><Save className="h-4 w-4" /> Save Remarks</button>
            </form>
          )}

          {modal === 'assign' && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); updateRequest(activeRequest, { assignedAssistantId: activeRequest.assignedAssistantIdValue, notes: activeRequest.assignmentNotes }, 'Assistant assigned'); }}>
              <Field label="Lab Assistant"><select className="input" value={activeRequest.assignedAssistantIdValue || activeRequest.assignedAssistantId?._id || ''} onChange={(e) => setActiveRequest({ ...activeRequest, assignedAssistantIdValue: e.target.value })} required><option value="">Select assistant</option>{assistants.items.map((assistant) => <option key={assistant._id} value={assistant.userId?._id}>{assistant.name} ({assistant.employeeId})</option>)}</select></Field>
              <Field label="Assignment Remarks"><textarea className="input" value={activeRequest.assignmentNotes || ''} onChange={(e) => setActiveRequest({ ...activeRequest, assignmentNotes: e.target.value })} /></Field>
              <button className="btn" type="submit"><UserCheck className="h-4 w-4" /> Assign</button>
            </form>
          )}

          {modal === 'collect' && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); updateRequest(activeRequest, { markCollectedNow: true, collectionDate: activeRequest.collectionDate, collectionTime: activeRequest.collectionTime, notes: activeRequest.collectionNotes }, 'Sample collected'); }}>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Collection Date"><input className="input" type="date" value={activeRequest.collectionDate?.slice?.(0, 10) || new Date().toISOString().slice(0, 10)} onChange={(e) => setActiveRequest({ ...activeRequest, collectionDate: e.target.value })} /></Field><Field label="Collection Time"><input className="input" type="time" value={activeRequest.collectionTime || ''} onChange={(e) => setActiveRequest({ ...activeRequest, collectionTime: e.target.value })} /></Field></div>
              <Field label="Collected By"><input className="input" value={activeRequest.collectedByName || 'Current User'} onChange={(e) => setActiveRequest({ ...activeRequest, collectedByName: e.target.value })} /></Field>
              <Field label="Remarks"><textarea className="input" value={activeRequest.collectionNotes || ''} onChange={(e) => setActiveRequest({ ...activeRequest, collectionNotes: e.target.value })} /></Field>
              <button className="btn" type="submit"><CheckCircle className="h-4 w-4" /> Save Collection</button>
            </form>
          )}

          {modal === 'future' && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); updateRequest(activeRequest, { sampleStatus: 'Not Collected', reportStatus: 'Pending', expectedCollectionDate: activeRequest.expectedCollectionDate, remarks: activeRequest.remarks, notes: activeRequest.remarks }, 'Future collection saved'); }}>
              <Field label="Expected Collection Date"><input className="input" type="date" value={activeRequest.expectedCollectionDate?.slice?.(0, 10) || ''} onChange={(e) => setActiveRequest({ ...activeRequest, expectedCollectionDate: e.target.value })} required /></Field>
              <Field label="Remarks"><textarea className="input" value={activeRequest.remarks || ''} onChange={(e) => setActiveRequest({ ...activeRequest, remarks: e.target.value })} placeholder="Sample To Be Collected Tomorrow" /></Field>
              <button className="btn" type="submit"><Save className="h-4 w-4" /> Save Future Collection</button>
            </form>
          )}

          {modal === 'close' && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); updateRequest(activeRequest, { cancellationReason: activeRequest.cancellationReason, cancellationRemarks: activeRequest.cancellationRemarks }, 'Request closed'); }}>
              <Field label="Cancellation Reason"><select className="input" value={activeRequest.cancellationReason || ''} onChange={(e) => setActiveRequest({ ...activeRequest, cancellationReason: e.target.value })} required><option value="">Select reason</option>{cancellationReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></Field>
              <Field label="Remarks"><textarea className="input" value={activeRequest.cancellationRemarks || ''} onChange={(e) => setActiveRequest({ ...activeRequest, cancellationRemarks: e.target.value })} required /></Field>
              <button className="btn" type="submit"><X className="h-4 w-4" /> Close Request</button>
            </form>
          )}

          {modal === 'report' && (
            !isSampleReady ? (
              <div className="space-y-4 text-center p-6 bg-orange-50/50 rounded-lg border border-orange-200">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <X className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Report Creation Disabled</h3>
                <p className="text-sm font-semibold text-gray-600">Sample collection is pending.</p>
                <button className="btn mt-2" onClick={() => { setModal(null); setActiveRequest(null); }}>Close</button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => handleSaveDraft(e, false)}>
                {activeRequest.report?.isLocked && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 flex justify-between items-center font-bold">
                    <span>This report is locked. Ask an admin to unlock it.</span>
                    {user?.role === 'admin' && (
                      <button type="button" className="btn-secondary bg-white text-red-700 border-red-300 hover:bg-red-50 py-1.5 px-3 flex items-center gap-1" onClick={handleUnlockReport}>
                        <Unlock className="h-3.5 w-3.5" /> Unlock Report
                      </button>
                    )}
                  </div>
                )}

                {/* Read Only Patient Demographics & Test Details */}
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 rounded-lg bg-orange-50/60 p-4 border border-orange-100 text-xs">
                  <div><p className="text-gray-500 font-bold">UHID</p><p className="font-extrabold text-gray-900">{formatUhid(activeRequest.patientId?.uhid)}</p></div>
                  <div><p className="text-gray-500 font-bold">Lab ID</p><p className="font-extrabold text-orange-700">{activeRequest.labId}</p></div>
                  <div><p className="text-gray-500 font-bold">Patient Name</p><p className="font-extrabold text-gray-900">{activeRequest.patientId?.patientName}</p></div>
                  <div><p className="text-gray-500 font-bold">Age / Gender</p><p className="font-extrabold text-gray-900">{ageFromDob(activeRequest.patientId?.dob)} Yrs / {activeRequest.patientId?.gender}</p></div>
                  <div><p className="text-gray-500 font-bold">Mobile</p><p className="font-extrabold text-gray-900">{activeRequest.patientId?.mobile}</p></div>
                  <div><p className="text-gray-500 font-bold">Ref. Doctor</p><p className="font-extrabold text-gray-900">Dr. {activeRequest.doctorId?.doctorName || activeRequest.doctorId?.username}</p></div>
                  <div><p className="text-gray-500 font-bold">Test Category</p><p className="font-extrabold text-gray-900">{tests.find(t => t.title === activeRequest.tests?.[0])?.category || 'General'}</p></div>
                  <div><p className="text-gray-500 font-bold">Test Name</p><p className="font-extrabold text-gray-900">{activeRequest.tests?.join(', ')}</p></div>
                  <div><p className="text-gray-500 font-bold">Collection Date</p><p className="font-extrabold text-gray-900">{formatDate(activeRequest.collectionDate || activeRequest.createdAt)} {activeRequest.collectionTime}</p></div>
                  <div><p className="text-gray-500 font-bold">Collection Type</p><p className="font-extrabold text-gray-900">{activeRequest.collectionType}</p></div>
                </div>

                {/* Parameters Table / Diagnosis Dynamic Fields */}
                {isDiagnosisReport ? (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-bold text-gray-800 border-b border-orange-100 pb-1">Diagnosis Report Fields</h3>
                      {!diagnosisTemplateLoading && !diagnosisTemplate?._id && !activeRequest.report?.isLocked && (user?.role === 'admin' || user?.role === 'lab' || user?.moduleAccess?.includes(4)) && (
                        <button
                          type="button"
                          className="btn-secondary px-3 py-2 text-xs text-orange-700 border-orange-200 hover:bg-orange-50"
                          onClick={() => openDiagnosisTemplate(activeTestMaster)}
                        >
                          <FileText className="h-3 w-3" /> Create Report Structure
                        </button>
                      )}
                    </div>
                    {diagnosisTemplateLoading ? (
                      <EmptyState title="Loading diagnosis template..." />
                    ) : (
                      <DiagnosisDynamicReport
                        template={diagnosisTemplate}
                        value={activeRequest.report?.dynamicFields || {}}
                        onChange={(next) => setActiveRequest({ ...activeRequest, report: { ...(activeRequest.report || {}), dynamicFields: next } })}
                        disabled={activeRequest.report?.isLocked}
                        onUploadImages={(files) => uploadImagesToCloudinaryMeta(files, 'hms/diagnosis-reports')}
                        onDeleteImage={deleteCloudinaryImageByPublicId}
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-800 border-b border-orange-100 pb-1">Test Parameters Results</h3>
                    {reportParameters.length === 0 ? (
                      <EmptyState title="No parameters configured for this test. Configure parameters in Lab Settings > Report Builder." />
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-orange-100">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-orange-100 text-orange-900 text-xs uppercase font-bold">
                            <tr>
                              <th className="p-3">Parameter Name</th>
                              <th className="p-3">Result Value</th>
                              <th className="p-3">Reference Range</th>
                              <th className="p-3">Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportParameters.map((param, index) => (
                              <tr key={index} className="border-t border-orange-50 align-middle">
                                <td className="p-3 font-semibold text-gray-700">{param.name}</td>
                                <td className="p-3">
                                  <input
                                    className="input py-1.5"
                                    placeholder="Enter machine result"
                                    value={param.value || ''}
                                    onChange={(e) => updateParameterValue(index, e.target.value)}
                                    required
                                    disabled={activeRequest.report?.isLocked}
                                  />
                                </td>
                                <td className="p-3 text-gray-500">{param.referenceRange || 'N/A'}</td>
                                <td className="p-3 text-gray-500 font-semibold">{param.unit || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Remarks">
                    <textarea
                      className="input min-h-20"
                      placeholder="Special observations or instructions"
                      value={activeRequest.report?.remarks || ''}
                      onChange={(e) => setActiveRequest({ ...activeRequest, report: { ...(activeRequest.report || {}), remarks: e.target.value } })}
                      disabled={activeRequest.report?.isLocked}
                    />
                  </Field>
                  <Field label="Clinical Notes">
                    <textarea
                      className="input min-h-20"
                      placeholder="Doctor's notes"
                      value={activeRequest.report?.notes || ''}
                      onChange={(e) => setActiveRequest({ ...activeRequest, report: { ...(activeRequest.report || {}), notes: e.target.value } })}
                      disabled={activeRequest.report?.isLocked}
                    />
                  </Field>
                </div>
                
                <Field label="Clinical Interpretation">
                  <textarea
                    className="input min-h-20"
                    placeholder="Provide diagnostic interpretation"
                    value={activeRequest.report?.interpretation || ''}
                    onChange={(e) => setActiveRequest({ ...activeRequest, report: { ...(activeRequest.report || {}), interpretation: e.target.value } })}
                    disabled={activeRequest.report?.isLocked}
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Authorized Signatory">
                    <select
                      className="input"
                      value={activeRequest.report?.signatoryId || ''}
                      onChange={(e) => setActiveRequest({ ...activeRequest, report: { ...(activeRequest.report || {}), signatoryId: e.target.value } })}
                      required
                      disabled={activeRequest.report?.isLocked}
                    >
                      <option value="">Select signatory</option>
                      {signatories.map((person) => <option key={person._id} value={person._id}>{person.name} - {person.designation}</option>)}
                    </select>
                  </Field>
                </div>

                {activeRequest.report?.generatedAt && (
                  <div className="text-xs text-gray-500 border-t border-orange-100 pt-3">
                    <p>Report Generated By: {activeRequest.report.generatedBy?.username || activeRequest.report.generatedBy || 'System'} on {formatDate(activeRequest.report.generatedAt)}</p>
                    {activeRequest.report.updatedAt && (
                      <p>Last Updated By: {activeRequest.report.updatedBy?.username || activeRequest.report.updatedBy || 'System'} on {formatDate(activeRequest.report.updatedAt)}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-orange-100 pt-4">
                  <button className="btn-secondary" type="button" onClick={() => { setModal(null); setActiveRequest(null); }}>Cancel</button>
                  {!activeRequest.report?.isLocked && (
                    <>
                      <button className="btn-secondary" type="submit">Save Draft</button>
                      <button className="btn-secondary bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100" type="button" onClick={(e) => handleSaveDraft(e, true)}>Save & Close</button>
                      <button className="btn-secondary bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 flex items-center gap-1" type="button" onClick={saveAndDownloadReport}>
                        <Download className="h-3.5 w-3.5" /> Download Draft
                      </button>
                      <button className="btn-secondary bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 flex items-center gap-1" type="button" onClick={saveAndPrintReport}>
                        <Printer className="h-3.5 w-3.5" /> Print Draft
                      </button>
                      <button className="btn ml-auto" type="button" onClick={handleGenerateReport}>Generate Report</button>
                    </>
                  )}
                  {activeRequest.report?.isLocked && (
                    <button className="btn-secondary ml-auto" type="button" onClick={() => openModal('viewReport', activeRequest)}>Preview Report</button>
                  )}
                </div>
              </form>
            )
          )}

          {modal === 'viewReport' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-end border-b border-orange-100 pb-3">
                <button className="btn-secondary flex items-center gap-1.5" onClick={() => printReport(activeRequest)}>
                  <Printer className="h-4 w-4" /> Print Report
                </button>
                <button className="btn flex items-center gap-1.5" onClick={() => downloadPdf(activeRequest)}>
                  <Download className="h-4 w-4" /> Download PDF
                </button>
                {activeRequest.reportStatus === 'Completed' && (
                  <button className="btn-secondary text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={handleMarkDelivered}>
                    Mark As Delivered
                  </button>
                )}
                {activeRequest.report?.isLocked && user?.role === 'admin' && (
                  <button className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1" onClick={handleUnlockReport}>
                    <Unlock className="h-4 w-4" /> Unlock Report
                  </button>
                )}
              </div>

              {/* Printable Laboratory Layout */}
              <div className="border border-orange-200 rounded-xl bg-orange-50/20 p-4 max-h-[60vh] overflow-y-auto">
                <div ref={reportPrintRef} className="mx-auto bg-white p-8 text-gray-800 shadow" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
                  {/* Hospital/Lab Info */}
                  <div className="flex items-center justify-between border-b-2 border-orange-500 pb-4 mb-6">
                    {profiles[0]?.logoUrl ? (
                      <img src={profiles[0].logoUrl} crossOrigin="anonymous" alt="Logo" className="h-16 w-16 object-contain rounded" />
                    ) : (
                      <div className="h-16 w-16 bg-orange-100 flex items-center justify-center rounded font-bold text-orange-600">LAB</div>
                    )}
                    <div className="text-right">
                      <h2 className="text-2xl font-extrabold text-gray-900">{profiles[0]?.name || user?.hospitalName || 'Clinical Laboratory'}</h2>
                      <p className="text-xs text-gray-500 max-w-sm ml-auto">{profiles[0]?.address || '123 Health Ave, Medical District'}</p>
                      <p className="text-xs text-gray-600 font-bold">Contact: {profiles[0]?.mobile || '9999999999'}</p>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="grid grid-cols-2 gap-4 border border-orange-100 rounded-lg p-4 mb-6 bg-orange-50/30 text-xs">
                    <div>
                      <p className="mb-1"><span className="font-bold text-gray-500">UHID:</span> <span className="font-bold text-gray-900">{formatUhid(activeRequest.patientId?.uhid)}</span></p>
                      <p className="mb-1"><span className="font-bold text-gray-500">Patient Name:</span> <span className="font-bold text-gray-900">{activeRequest.patientId?.patientName}</span></p>
                      <p className="mb-1"><span className="font-bold text-gray-500">Age / Gender:</span> <span className="font-bold text-gray-900">{ageFromDob(activeRequest.patientId?.dob)} Yrs / {activeRequest.patientId?.gender}</span></p>
                      <p><span className="font-bold text-gray-500">Mobile:</span> <span className="font-bold text-gray-900">{activeRequest.patientId?.mobile}</span></p>
                    </div>
                    <div>
                      <p className="mb-1"><span className="font-bold text-gray-500">Lab ID:</span> <span className="font-extrabold text-orange-700">{activeRequest.labId}</span></p>
                      <p className="mb-1"><span className="font-bold text-gray-500">Ref. Doctor:</span> <span className="font-bold text-gray-900">Dr. {activeRequest.doctorId?.doctorName || activeRequest.doctorId?.username}</span></p>
                      <p className="mb-1"><span className="font-bold text-gray-500">Collection Date:</span> <span className="font-bold text-gray-900">{formatDate(activeRequest.collectionDate || activeRequest.createdAt)} {activeRequest.collectionTime}</span></p>
                      <p><span className="font-bold text-gray-500">Collection Type:</span> <span className="font-bold text-gray-900">{activeRequest.collectionType}</span></p>
                    </div>
                  </div>

                  {/* Test Name */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-orange-900 bg-orange-100/70 px-3 py-2 rounded">
                      Test: {activeRequest.tests?.join(', ')} ({tests.find(t => t.title === activeRequest.tests?.[0])?.category || 'General'})
                    </h3>
                  </div>

                  {/* Parameters Table / Diagnosis Dynamic Fields */}
                  {isDiagnosisReport ? (
                    <div className="mb-6">
                      {diagnosisTemplateLoading ? (
                        <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/50 p-6 text-center text-xs font-semibold text-gray-500">
                          Loading diagnosis template...
                        </div>
                      ) : (
                        <DiagnosisDynamicReport
                          template={diagnosisTemplate}
                          value={activeRequest.report?.dynamicFields || {}}
                          disabled
                        />
                      )}
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs mb-6 border-collapse">
                      <thead>
                        <tr className="border-b-2 border-orange-200 bg-orange-50 text-orange-950">
                          <th className="p-3 font-bold">Parameter Name</th>
                          <th className="p-3 font-bold text-center">Result</th>
                          <th className="p-3 font-bold text-center">Reference Range</th>
                          <th className="p-3 font-bold text-center">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportParameters.map((param, index) => (
                          <tr key={index} className="border-b border-orange-50">
                            <td className="p-3 font-semibold text-gray-800">{param.name}</td>
                            <td className="p-3 text-center font-bold text-orange-800">{param.value || '-'}</td>
                            <td className="p-3 text-center text-gray-600">{param.referenceRange || 'N/A'}</td>
                            <td className="p-3 text-center text-gray-600 font-medium">{param.unit || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Remarks / Notes */}
                  <div className="grid grid-cols-1 gap-3 mb-8 text-xs border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                    {activeRequest.report?.remarks && (
                      <div>
                        <p className="font-bold text-gray-700">Remarks:</p>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">{activeRequest.report.remarks}</p>
                      </div>
                    )}
                    {activeRequest.report?.notes && (
                      <div>
                        <p className="font-bold text-gray-700">Notes:</p>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">{activeRequest.report.notes}</p>
                      </div>
                    )}
                    {activeRequest.report?.interpretation && (
                      <div>
                        <p className="font-bold text-gray-700">Clinical Interpretation:</p>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">{activeRequest.report.interpretation}</p>
                      </div>
                    )}
                  </div>

                  {/* Signatures */}
                  <div className="mt-8 border-t border-gray-100 pt-6 flex justify-between items-end">
                    <div className="text-xs text-gray-500">
                      <p>Report Generated: {formatDate(activeRequest.report?.generatedAt)} {activeRequest.report?.completionTime}</p>
                      {activeRequest.report?.deliveryDate && (
                        <p className="mt-1">Report Delivered: {formatDate(activeRequest.report.deliveryDate)} {activeRequest.report.deliveryTime}</p>
                      )}
                      {activeRequest.report?.collectionStatus === 'Collected' && (
                        <p className="mt-1 font-bold text-emerald-700">Report Collected: {formatDate(activeRequest.report.collectedAt)} {activeRequest.report.collectedTime}</p>
                      )}
                    </div>
                    {activeRequest.report?.signatoryId && (
                      <div className="text-right text-xs">
                        {activeRequest.report.signatoryId.signatureImageUrl && (
                          <div className="mb-1 flex justify-end">
                            <img src={activeRequest.report.signatoryId.signatureImageUrl} crossOrigin="anonymous" alt="Signature" className="h-12 max-w-40 object-contain" />
                          </div>
                        )}
                        <p className="font-bold text-gray-900">{activeRequest.report.signatoryId.name}</p>
                        <p className="text-gray-500">{activeRequest.report.signatoryId.designation}</p>
                        <p className="text-gray-400 font-semibold">{activeRequest.report.signatoryId.qualification}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {modal === 'viewBill' && activeBill && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-end border-b border-orange-100 pb-3">
                <button
                  type="button"
                  className="btn flex items-center gap-1.5 font-bold"
                  onClick={() => downloadBillPdf(activeBill)}
                >
                  <Download className="h-4 w-4" /> Download PDF
                </button>
                <button
                  type="button"
                  className="btn-secondary flex items-center gap-1.5 font-bold"
                  onClick={() => printBill(activeBill)}
                >
                  Print Bill
                </button>
                {activeBill.paymentStatus !== 'Paid' && (
                  <button
                    type="button"
                    className="btn bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white flex items-center gap-1.5 font-bold"
                    onClick={() => setModal('receivePayment')}
                  >
                    <BadgeIndianRupee className="h-4 w-4" /> Receive Payment
                  </button>
                )}
              </div>

              {/* Scrollable invoice container */}
              <div className="border border-orange-200 rounded-xl bg-orange-50/20 p-4 max-h-[60vh] overflow-y-auto">
                <div ref={billPrintRef} className="mx-auto bg-white p-8 text-gray-800 shadow" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
                  {/* Hospital logo / details */}
                  <div className="flex items-center justify-between border-b-2 border-orange-500 pb-4 mb-6">
                    {profiles[0]?.logoUrl ? (
                      <img src={profiles[0].logoUrl} crossOrigin="anonymous" alt="Logo" className="h-16 w-16 object-contain rounded" />
                    ) : (
                      <div className="h-16 w-16 bg-orange-100 flex items-center justify-center rounded font-bold text-orange-600">LAB</div>
                    )}
                    <div className="text-right">
                      <h2 className="text-2xl font-extrabold text-gray-900">{profiles[0]?.name || user?.hospitalName || 'Clinical Laboratory'}</h2>
                      <p className="text-xs text-gray-500 max-w-sm ml-auto">{profiles[0]?.address || '123 Health Ave, Medical District'}</p>
                      <p className="text-xs text-gray-600 font-bold">Contact: {profiles[0]?.mobile || '9999999999'}</p>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h1 className="text-xl font-black text-gray-900 tracking-wide uppercase">Diagnostics Invoice</h1>
                    <p className="text-xs text-gray-500">Bill No: {activeBill.billNo}</p>
                  </div>

                  {/* Demographics */}
                  <div className="grid grid-cols-2 gap-4 border border-orange-100 rounded-lg p-4 mb-6 bg-orange-50/30 text-xs">
                    <div>
                      <p className="mb-1"><span className="font-bold text-gray-500">UHID:</span> <span className="font-bold text-gray-900">{formatUhid(activeBill.patientId?.uhid)}</span></p>
                      <p className="mb-1"><span className="font-bold text-gray-500">Patient Name:</span> <span className="font-bold text-gray-900">{activeBill.patientId?.patientName}</span></p>
                      <p className="mb-1"><span className="font-bold text-gray-500">Age / Gender:</span> <span className="font-bold text-gray-900">{ageFromDob(activeBill.patientId?.dob)} Yrs / {activeBill.patientId?.gender}</span></p>
                      <p><span className="font-bold text-gray-500">Mobile:</span> <span className="font-bold text-gray-900">{activeBill.patientId?.mobile}</span></p>
                    </div>
                    <div>
                      <p className="mb-1"><span className="font-bold text-gray-500">Lab ID:</span> <span className="font-extrabold text-orange-700">{activeBill.labId}</span></p>
                      <p className="mb-1"><span className="font-bold text-gray-500">Bill Date:</span> <span className="font-bold text-gray-900">{formatDate(activeBill.createdAt)}</span></p>
                      <p className="mb-1"><span className="font-bold text-gray-500">Ref. Doctor:</span> <span className="font-bold text-gray-900">Dr. {activeBill.doctorId?.doctorName || activeBill.doctorId?.username}</span></p>
                      <p><span className="font-bold text-gray-500">Payment Status:</span> <span className={`font-bold uppercase ${activeBill.paymentStatus === 'Paid' ? 'text-emerald-700' : activeBill.paymentStatus === 'Partial' ? 'text-amber-700' : 'text-rose-700'}`}>{activeBill.paymentStatus}</span></p>
                    </div>
                  </div>

                  {/* Tests List */}
                  <table className="w-full text-left text-xs mb-6 border-collapse">
                    <thead>
                      <tr className="border-b-2 border-orange-200 bg-orange-50 text-orange-950">
                        <th className="p-3 font-bold">Test/Profile Name</th>
                        <th className="p-3 font-bold">Category</th>
                        <th className="p-3 font-bold text-right">Base Price</th>
                        <th className="p-3 font-bold text-right">Tax (%)</th>
                        <th className="p-3 font-bold text-right">Tax Amt</th>
                        <th className="p-3 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeBill.testDetails || []).map((test, index) => (
                        <tr key={index} className="border-b border-orange-50">
                          <td className="p-3 font-semibold text-gray-800">{test.name}</td>
                          <td className="p-3 text-gray-600">{test.category}</td>
                          <td className="p-3 text-right text-gray-600">{money(test.basePrice)}</td>
                          <td className="p-3 text-right text-gray-600">{test.taxPercentage}%</td>
                          <td className="p-3 text-right text-gray-600">{money(test.taxAmount)}</td>
                          <td className="p-3 text-right font-bold text-gray-800">{money(test.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end mb-6">
                    <div className="w-64 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-500"><span className="font-medium">Subtotal (Base):</span><span>{money(activeBill.baseAmount)}</span></div>
                      <div className="flex justify-between text-gray-500"><span className="font-medium">Total Tax Amount:</span><span>{money(activeBill.taxAmount)}</span></div>
                      <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900 text-sm"><span>Grand Total:</span><span>{money(activeBill.totalAmount)}</span></div>
                      <div className="flex justify-between text-emerald-700 font-bold"><span>Total Paid:</span><span>{money(activeBill.paidAmount)}</span></div>
                      <div className="flex justify-between border-t border-double border-gray-300 pt-1.5 text-rose-700 font-extrabold text-sm"><span>Balance Due:</span><span>{money(activeBill.dueAmount)}</span></div>
                    </div>
                  </div>

                  {/* Payments Transaction List */}
                  <div className="space-y-2 border-t border-gray-100 pt-6">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Installment Transaction History</h3>
                    {(activeBill.payments || []).length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic font-semibold">No payments received for this invoice yet.</p>
                    ) : (
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase">
                            <th className="pb-2">Date & Time</th>
                            <th className="pb-2 text-right">Amount Paid</th>
                            <th className="pb-2">Method</th>
                            <th className="pb-2">Transaction Ref</th>
                            <th className="pb-2">Received By</th>
                            <th className="pb-2">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeBill.payments.map((pmt, idx) => (
                            <tr key={idx} className="border-b border-gray-100 py-1">
                              <td className="py-2 text-gray-600 font-semibold">{formatDate(pmt.date)} {pmt.time}</td>
                              <td className="py-2 text-right font-bold text-emerald-700">{money(pmt.amount)}</td>
                              <td className="py-2 font-medium text-gray-700">{pmt.paymentMethod}</td>
                              <td className="py-2 text-gray-500">{pmt.transactionRef || '-'}</td>
                              <td className="py-2 text-gray-600">{pmt.receivedByName}</td>
                              <td className="py-2 text-gray-500">{pmt.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="mt-12 border-t border-gray-100 pt-6 flex justify-between items-end text-[10px] text-gray-400 font-semibold">
                    <div>
                      <p>Invoice generated via Hospital Information System</p>
                      <p>This is a computer generated document, no signature required.</p>
                    </div>
                    <div className="text-right">
                      <div className="h-10"></div>
                      <p className="font-bold text-gray-700 border-t border-gray-200 pt-1 w-32 inline-block text-center">Cashier Desk</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {modal === 'receivePayment' && activeBill && (
            <form className="space-y-4 text-left font-semibold" onSubmit={handleReceivePayment}>
              <div className="grid gap-3 sm:grid-cols-3 rounded-lg border border-orange-100 bg-orange-50/10 p-4 text-xs font-semibold">
                <div>
                  <p className="text-gray-500 font-bold uppercase">Total Amount</p>
                  <p className="text-base font-black text-gray-900 mt-0.5">{money(activeBill.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold uppercase">Total Paid</p>
                  <p className="text-base font-black text-emerald-700 mt-0.5">{money(activeBill.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold uppercase">Remaining Due</p>
                  <p className="text-base font-black text-rose-700 mt-0.5">{money(activeBill.dueAmount)}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Amount to Receive (Rs.)">
                  <input
                    className="input text-sm font-semibold"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={activeBill.dueAmount}
                    placeholder={`Max: ${activeBill.dueAmount}`}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    <span>Installment payments are supported.</span>
                    <button
                      type="button"
                      className="text-orange-600 font-bold hover:underline"
                      onClick={() => setPaymentForm({ ...paymentForm, amount: activeBill.dueAmount.toString() })}
                    >
                      Pay Full Due
                    </button>
                  </div>
                </Field>

                <Field label="Payment Method">
                  <select
                    className="input text-sm font-semibold"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Transaction Reference No.">
                  <input
                    className="input text-sm font-semibold"
                    placeholder="E.g., UPI Transaction ID, Card Txn Ref"
                    value={paymentForm.transactionRef}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                  />
                </Field>

                <Field label="Remarks">
                  <input
                    className="input text-sm font-semibold"
                    placeholder="Optional details, e.g. paid by relative"
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-2 border-t border-orange-100 pt-4 mt-2">
                <button
                  type="button"
                  className="btn-secondary text-xs font-bold"
                  onClick={() => {
                    setModal('viewBill');
                    setPaymentForm({ amount: '', paymentMethod: 'Cash', transactionRef: '', remarks: '' });
                  }}
                >
                  Back to Bill
                </button>
                <button
                  type="submit"
                  className="btn text-xs px-5 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white font-bold"
                >
                  Process Receipt
                </button>
              </div>
            </form>
          )}

          {modal === 'directRequest' && (
            <div className="space-y-5 text-left">
              {/* Patient Search Section */}
              <div className="space-y-2 border border-orange-100 rounded-lg p-4 bg-orange-50/20">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-900">1. Search & Select Patient</h3>
                <div className="flex gap-2">
                  <input
                    className="input text-sm"
                    placeholder="Enter Patient UHID, Name, or Mobile Number..."
                    value={directPatientSearchQuery}
                    onChange={(e) => setDirectPatientSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch(directPatientSearchQuery)}
                  />
                  <button
                    type="button"
                    className="btn px-4 flex items-center gap-1.5"
                    onClick={() => handlePatientSearch(directPatientSearchQuery)}
                    disabled={isSearchingPatients}
                  >
                    {isSearchingPatients ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span>Search</span>
                  </button>
                </div>

                {searchedPatients.length > 0 && (
                  <div className="mt-2 border border-orange-100 bg-white rounded-lg max-h-48 overflow-y-auto divide-y divide-orange-50 text-xs">
                    {searchedPatients.map((patient) => (
                      <div
                        key={patient._id}
                        onClick={() => handleSelectPatient(patient)}
                        className="p-3 hover:bg-orange-50/40 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <p className="font-bold text-gray-800">{patient.patientName} ({patient.gender})</p>
                          <p className="text-[10px] text-gray-500">UHID: <span className="font-bold">{formatUhid(patient.uhid)}</span> | Mobile: {patient.mobile}</p>
                        </div>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Patient Demographics Card */}
              {selectedPatient && (
                <div className="space-y-4 text-left">
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 rounded-lg border border-orange-100 bg-white p-4 text-xs relative shadow-sm">
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-gray-400 hover:text-rose-600 transition"
                      onClick={() => setSelectedPatient(null)}
                      title="Clear selection"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div>
                      <p className="text-gray-400 font-bold uppercase text-[9px]">UHID</p>
                      <p className="font-extrabold text-gray-800">{formatUhid(selectedPatient.uhid)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase text-[9px]">Patient Name</p>
                      <p className="font-extrabold text-gray-900">{selectedPatient.patientName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase text-[9px]">Age / Gender</p>
                      <p className="font-extrabold text-gray-800">{ageFromDob(selectedPatient.dob)} Yrs / {selectedPatient.gender}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase text-[9px]">Mobile Number</p>
                      <p className="font-extrabold text-gray-800">{selectedPatient.mobile}</p>
                    </div>
                  </div>

                  {/* Doctor Consultation Recommended Tests */}
                  {consultationInfo && (
                    <div className="border border-indigo-100 bg-indigo-50/30 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold uppercase text-indigo-900 tracking-wider">Doctor Recommended Tests</h4>
                          <p className="text-[10px] text-indigo-500 font-medium">Prescribed by Dr. {consultationInfo.doctorName} ({consultationInfo.department})</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn-secondary bg-white py-1 px-2.5 text-[10px] text-indigo-700 border-indigo-200"
                            onClick={() => setDirectTests(recommendedTests)}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            className="btn-secondary bg-white py-1 px-2.5 text-[10px] text-gray-600 border-gray-200"
                            onClick={() => setDirectTests([])}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {recommendedTests.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No recommended tests in their latest consultation.</p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {recommendedTests.map((test) => {
                            const isChecked = directTests.includes(test);
                            return (
                              <label key={test} className="flex items-center gap-2 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-800 cursor-pointer shadow-sm hover:border-indigo-300 select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setDirectTests(directTests.filter(t => t !== test));
                                    } else {
                                      setDirectTests([...directTests, test]);
                                    }
                                  }}
                                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{test}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Additional Tests Section */}
                  <div className="border border-orange-100 rounded-lg p-4 bg-orange-50/10 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-orange-900 tracking-wider">2. Add Tests / Request Items</h4>
                    
                    <div className="grid gap-3 md:grid-cols-3 items-end">
                      <Field label="Test Category">
                        <SearchableDropdown
                          value={selectedCategory}
                          options={categoryOptions}
                          getLabel={(category) => category.name}
                          placeholder="Search category..."
                          onSelect={(category) => {
                            setSelectedCategory(category.name);
                            setSelectedTestTitle('');
                          }}
                          onCreate={async (name) => {
                            const category = await createCategory(name);
                            if (category) setSelectedCategory(category.name);
                          }}
                          createLabel={(name) => `+ Create new category "${name}"`}
                        />
                      </Field>
                      <Field label="Test Title">
                        <SearchableDropdown
                          value={selectedTestTitle}
                          options={tests.filter(t => normalizeKey(t.category) === normalizeKey(selectedCategory))}
                          getLabel={(test) => test.title}
                          placeholder={selectedCategory ? 'Search test...' : 'Select category first'}
                          disabled={!selectedCategory}
                          onSelect={(test) => setSelectedTestTitle(test.title)}
                          onCreate={(name) => createTestForCategory(name, selectedCategory, true)}
                          createLabel={(name) => `+ Create new test "${name}"`}
                          renderOption={(test) => (
                            <div>
                              <p className="font-bold text-gray-900">{test.title}</p>
                              <p className="text-xs font-semibold text-gray-500">{test.category} | {money(test.totalAmount)}</p>
                            </div>
                          )}
                        />
                      </Field>
                      <button
                        type="button"
                        className="btn py-2 text-xs flex items-center justify-center gap-1"
                        onClick={() => {
                          handleAddAdditionalTest(selectedTestTitle);
                          setSelectedTestTitle('');
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Test</span>
                      </button>
                    </div>

                    {/* Selected Tests List */}
                    <div className="space-y-2 pt-2 border-t border-orange-100/50">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Selected Tests for Assignment:</p>
                      {directTests.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No tests selected yet. Add or select doctor recommendations.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {directTests.map((testTitle) => {
                            const master = testByTitle.get(normalizeKey(testTitle));
                            return (
                            <div key={testTitle} className="bg-orange-100 text-orange-800 text-xs font-bold py-1.5 px-3 rounded-full flex items-center gap-1.5 border border-orange-200">
                              {master?.category && <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-orange-700">{master.category}</span>}
                              <span>{testTitle}</span>
                              <button
                                type="button"
                                className="text-orange-600 hover:text-rose-600 font-extrabold focus:outline-none"
                                onClick={() => handleRemoveDirectTest(testTitle)}
                              >
                                &times;
                              </button>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Settings Form */}
                  <form className="space-y-4" onSubmit={handleCreateDirectRequest}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Collection Type">
                        <select
                          className="input text-xs"
                          value={directCollectionType}
                          onChange={(e) => setDirectCollectionType(e.target.value)}
                        >
                          <option value="Lab Visit">Lab Visit (Walk-in)</option>
                          <option value="Home Sample Collection">Home Sample Collection</option>
                        </select>
                      </Field>
                    </div>

                    <Field label="Remarks / Booking Notes">
                      <textarea
                        className="input min-h-20 text-xs"
                        placeholder="E.g. urgent delivery, fasting sample, preferred collection times..."
                        value={directRemarks}
                        onChange={(e) => setDirectRemarks(e.target.value)}
                      />
                    </Field>

                    <div className="flex justify-end gap-2 border-t border-orange-100 pt-4">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => {
                          setModal(null);
                          setSelectedPatient(null);
                          setDirectTests([]);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn text-xs px-5"
                        disabled={directTests.length === 0}
                      >
                        Create Lab Request(s)
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBilling = () => {
    const billingBadgeClass = (status) => {
      if (status === 'Paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (status === 'Partial') return 'bg-amber-50 text-amber-700 border-amber-200';
      return 'bg-rose-50 text-rose-700 border-rose-200';
    };

    return (
      <div className="space-y-4">
        {/* Billing Filters */}
        <div className="flex flex-col gap-3 rounded-lg border border-orange-100 bg-white p-3 md:flex-row md:items-center">
          <select
            className="input md:w-56 text-xs font-semibold"
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setPaymentPage(1); }}
          >
            <option value="">All Payment Statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
          </select>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">From:</span>
            <input type="date" className="input py-1.5 text-xs font-semibold" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPaymentPage(1); }} />
            <span className="text-xs font-bold text-gray-500">To:</span>
            <input type="date" className="input py-1.5 text-xs font-semibold" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPaymentPage(1); }} />
          </div>
          
          <div className="ml-auto flex items-center gap-2 text-sm font-semibold text-gray-500">
            <button className="btn-secondary px-3 py-2 text-xs font-bold" disabled={paymentPage === 1} onClick={() => setPaymentPage((value) => Math.max(value - 1, 1))}>Prev</button>
            <span className="text-xs font-bold text-gray-600">Page {paymentPage} / {paymentPageCount}</span>
            <button className="btn-secondary px-3 py-2 text-xs font-bold" disabled={paymentPage === paymentPageCount} onClick={() => setPaymentPage((value) => Math.min(value + 1, paymentPageCount))}>Next</button>
          </div>
        </div>

        {/* Bills Data Grid Table */}
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-orange-100/70 text-xs uppercase text-orange-950">
              <tr>
                <th className="p-3 font-bold">Bill No</th>
                <th className="p-3 font-bold">Lab ID</th>
                <th className="p-3 font-bold">UHID</th>
                <th className="p-3 font-bold">Patient Name</th>
                <th className="p-3 font-bold">Test Name(s)</th>
                <th className="p-3 text-right font-bold">Total</th>
                <th className="p-3 text-right font-bold">Paid</th>
                <th className="p-3 text-right font-bold">Due</th>
                <th className="p-3 text-center font-bold">Status</th>
                <th className="p-3 font-bold">Billing Date</th>
                <th className="p-3 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedBills.length === 0 ? (
                <tr><td className="p-5 text-center text-gray-500 font-semibold" colSpan={11}>No billing records found matching criteria.</td></tr>
              ) : pagedBills.map((bill) => (
                <tr key={bill._id} className="border-t border-orange-50 align-middle hover:bg-orange-50/10 transition">
                  <td className="p-3 font-bold text-gray-900">{bill.billNo}</td>
                  <td className="p-3 font-extrabold text-orange-700">{bill.labId}</td>
                  <td className="p-3 font-bold text-gray-900">{bill.patientId?.uhid}</td>
                  <td className="p-3">
                    <p className="font-bold text-gray-950">{bill.patientId?.patientName}</p>
                    <p className="text-xs text-gray-500 font-semibold">{bill.patientId?.mobile}</p>
                  </td>
                  <td className="p-3 max-w-[200px] truncate font-medium text-gray-700" title={bill.testDetails?.map(t => t.name).join(', ')}>
                    {bill.testDetails?.map(t => t.name).join(', ')}
                  </td>
                  <td className="p-3 text-right font-bold text-gray-950">{money(bill.totalAmount)}</td>
                  <td className="p-3 text-right text-emerald-700 font-extrabold">{money(bill.paidAmount)}</td>
                  <td className="p-3 text-right text-rose-700 font-extrabold">{money(bill.dueAmount)}</td>
                  <td className="p-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold border ${billingBadgeClass(bill.paymentStatus)}`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500 font-bold">{formatDate(bill.createdAt)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="btn-secondary px-2 py-1.5 text-xs flex items-center gap-1 font-bold text-orange-800 border-orange-200 hover:bg-orange-50"
                        onClick={() => { setActiveBill(bill); setModal('viewBill'); }}
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                      {bill.paymentStatus !== 'Paid' && (
                        <button
                          className="btn px-2 py-1.5 text-xs flex items-center gap-1 font-bold bg-orange-500 hover:bg-orange-600 border-orange-500 text-white"
                          onClick={() => { setActiveBill(bill); setModal('receivePayment'); }}
                        >
                          <BadgeIndianRupee className="h-3 w-3" /> Pay
                        </button>
                      )}
                      <button
                        className="btn-secondary px-2 py-1.5 text-xs flex items-center gap-1 font-bold border-gray-300 text-gray-700 hover:bg-gray-100"
                        onClick={() => { setActiveBill(bill); setTimeout(() => printBill(bill), 100); }}
                      >
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'tracking', label: 'Patient Tracking', icon: MapPin },
    { id: 'history', label: 'Patient History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Lab Settings', icon: Settings },
    { id: 'billing', label: 'Billing', icon: BadgeIndianRupee }
  ];

  const title = sidebarItems.find((item) => item.id === section)?.label;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h1 className="text-2xl font-extrabold text-gray-900">{title}</h1><p className="text-sm text-gray-500">Tracking is based on unique Lab IDs while UHID remains the patient grouping key.</p></div>
        <div className="relative w-full lg:w-96"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input className="input" style={{paddingLeft: '52px'}} placeholder="Search UHID, Lab ID, patient, mobile" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
      </div>
      <div className="space-y-4">
        <main className="space-y-4">
          {loading ? <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-white p-6 font-bold text-orange-600"><Loader2 className="h-5 w-5 animate-spin" /> Loading lab module</div> : (
            <>
              {['requests', 'tracking', 'reports'].includes(section) && renderTrackingFilters()}
              {section === 'dashboard' && renderDashboard()}
              {section === 'requests' && requestTable(pagedRequests)}
              {section === 'tracking' && requestTable(pagedRequests)}
              {section === 'history' && renderHistory()}
              {section === 'reports' && renderReports()}
              {section === 'settings' && renderSettings()}
              {section === 'billing' && renderBilling()}
            </>
          )}
        </main>
      </div>
      {renderModal()}
    </div>
  );
};

export default LabWorkspace;
