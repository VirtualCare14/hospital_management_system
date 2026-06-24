import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CalendarDays,
  Clock,
  Stethoscope,
  Bed,
  Building2,
  CreditCard,
  Syringe,
  Pill,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  UserCircle,
  Activity,
  FlaskConical,
  FileText,
  Eye,
  Printer,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  List,
  DollarSign,
  Search,
  Filter,
  X,
  Scissors,
  Edit3,
  DoorOpen,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';
import IpdMedicationChartContent from './IpdMedicationChartContent.jsx';

const TABS = [
  { id: 'patient-info', label: 'Patient Info', icon: User },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'services', label: 'Services', icon: Syringe },
  { id: 'pharmacy-requests', label: 'Pharmacy Requests', icon: Pill },
  { id: 'ot-records', label: 'OT Records', icon: Scissors },
  { id: 'discharge-records', label: 'Discharge Records', icon: DoorOpen },
  { id: 'timeline', label: 'Timeline', icon: List },
];

const SERVICE_CATEGORIES = [
  { id: 'consumables', label: 'Consumable Services', icon: Activity },
  { id: 'medicines', label: 'Medicines', icon: Pill },
  { id: 'lab-tests', label: 'Lab Tests', icon: FlaskConical },
  { id: 'medication-chart', label: 'Medication Chart', icon: ClipboardList },
];

const reportStatusColors = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Ready': 'bg-green-100 text-green-800',
  'Completed': 'bg-green-100 text-green-800',
  'Approved': 'bg-green-100 text-green-800'
};

const IpdPatientDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'patient-info');

  const [serviceCategory, setServiceCategory] = useState('consumables');
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [consumables, setConsumables] = useState([]);
  const [consumablesLoading, setConsumablesLoading] = useState(false);
  const [showAddConsumable, setShowAddConsumable] = useState(false);
  const [consumableForm, setConsumableForm] = useState({ serviceName: '', price: '', gst: '', quantity: '1' });
  const [medicines, setMedicines] = useState([]);
  const [medicinesLoading, setMedicinesLoading] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medicineForm, setMedicineForm] = useState({ medicineName: '', quantity: '1', unitPrice: '', gst: '', baseUnitPrice: '' });
  const [labTests, setLabTests] = useState([]);
  const [labTestsLoading, setLabTestsLoading] = useState(false);
  const [showAddLabTest, setShowAddLabTest] = useState(false);
  const [labTestForm, setLabTestForm] = useState({ testName: '', testCategory: '', testPrice: '' });
  const [labTestSearch, setLabTestSearch] = useState('');
  const [availableLabTests, setAvailableLabTests] = useState([]);
  const [labTestCategoryFilter, setLabTestCategoryFilter] = useState('');
  const [labTestCategories, setLabTestCategories] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [otRecords, setOtRecords] = useState([]);
  const [otRecordsLoading, setOtRecordsLoading] = useState(false);
  const [otHospitalInfo, setOtHospitalInfo] = useState(null);
  const [dischargeRecords, setDischargeRecords] = useState([]);
  const [dischargeRecordsLoading, setDischargeRecordsLoading] = useState(false);
  const [consumableServicesList, setConsumableServicesList] = useState([]);
  const [medicineSettingsList, setMedicineSettingsList] = useState([]);

  // Pharmacy Requests Phase 2 State
  const [pharmacyRequests, setPharmacyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showAddRequest, setShowAddRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({ procedureName: '', items: [] });
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [pharmacyMedsList, setPharmacyMedsList] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [consumeForm, setConsumeForm] = useState([]);

  const loadAdmission = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/ipd/patients/${id}`);
      setAdmission(data);
    } catch (err) {
      toast.error('Failed to load patient details');
      navigate('/ipd/patients');
    } finally { setLoading(false); }
  }, [id, navigate]);

  const loadConsumables = useCallback(async () => {
    setConsumablesLoading(true);
    try { const { data } = await client.get(`/ipd/services/consumables/${id}`); setConsumables(data); }
    catch (err) { console.error(err); } finally { setConsumablesLoading(false); }
  }, [id]);

  const loadMedicines = useCallback(async () => {
    setMedicinesLoading(true);
    try { const { data } = await client.get(`/ipd/services/medicines/${id}`); setMedicines(data); }
    catch (err) { console.error(err); } finally { setMedicinesLoading(false); }
  }, [id]);

  const loadLabTests = useCallback(async () => {
    setLabTestsLoading(true);
    try { const { data } = await client.get(`/ipd/services/lab-tests/${id}`); setLabTests(data); }
    catch (err) { console.error(err); } finally { setLabTestsLoading(false); }
  }, [id]);

  const loadBilling = useCallback(async () => {
    setBillingLoading(true);
    try { const { data } = await client.get(`/ipd/services/billing/${id}`); setBillingSummary(data); }
    catch (err) { console.error(err); } finally { setBillingLoading(false); }
  }, [id]);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try { const { data } = await client.get(`/ipd/services/dashboard/${id}`); setDashboard(data); }
    catch (err) { console.error(err); } finally { setDashboardLoading(false); }
  }, [id]);

  const loadTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try { const { data } = await client.get(`/ipd/services/timeline/${id}`); setTimeline(data); }
    catch (err) { console.error(err); } finally { setTimelineLoading(false); }
  }, [id]);

  const loadOtRecords = useCallback(async () => {
    setOtRecordsLoading(true);
    try { const { data } = await client.get(`/ipd/ot/admission/${id}`); setOtRecords(data); }
    catch (err) { console.error(err); } finally { setOtRecordsLoading(false); }
  }, [id]);

  const loadDischargeRecords = useCallback(async () => {
    setDischargeRecordsLoading(true);
    try { const { data } = await client.get(`/ipd/discharge/admission/${id}`); setDischargeRecords(data); }
    catch (err) { console.error(err); } finally { setDischargeRecordsLoading(false); }
  }, [id]);

  const loadOtHospitalInfo = useCallback(async () => {
    try { const { data } = await client.get('/ipd/ot/hospital-info'); setOtHospitalInfo(data); }
    catch (err) { console.warn(err); }
  }, []);

  const loadPharmacyRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const { data } = await client.get(`/pharmacy/requests?admissionId=${id}`);
      setPharmacyRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  }, [id]);

  const loadPharmacyMeds = useCallback(async () => {
    try {
      const { data } = await client.get('/pharmacy/inventory?limit=1000');
      const uniqueNames = [...new Set(data.items.map(item => item.itemName))];
      setPharmacyMedsList(uniqueNames);
    } catch (err) {
      console.warn('Could not load pharmacy inventory for searching:', err.message);
    }
  }, []);

  const loadAdminSettings = useCallback(async () => {
    try {
      const { data } = await client.get('/ipd/settings');
      if (data?.consumableServices) setConsumableServicesList(data.consumableServices.filter(s => s.isActive));
      if (data?.medicines) setMedicineSettingsList(data.medicines.filter(m => m.isActive));
    } catch (err) { console.warn(err); }
  }, []);

  const loadAvailableLabTests = useCallback(async () => {
    try {
      const { data } = await client.get('/lab/tests');
      setAvailableLabTests(data.filter(t => t.status === 'Active'));
      const cats = [...new Set(data.filter(t => t.status === 'Active').map(t => t.category))];
      setLabTestCategories(cats);
    } catch (err) { console.warn('Could not load lab tests:', err); }
  }, []);

  useEffect(() => {
    loadAdmission();
    loadAdminSettings();
    loadAvailableLabTests();
    loadOtHospitalInfo();
    loadDischargeRecords();
  }, [loadAdmission, loadAdminSettings, loadAvailableLabTests, loadOtHospitalInfo, loadDischargeRecords]);

  useEffect(() => {
    if (activeTab === 'services') { loadConsumables(); loadMedicines(); loadLabTests(); }
    if (activeTab === 'billing') { loadBilling(); loadConsumables(); loadMedicines(); loadLabTests(); }
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'timeline') loadTimeline();
    if (activeTab === 'ot-records') loadOtRecords();
    if (activeTab === 'discharge-records') loadDischargeRecords();
    if (activeTab === 'pharmacy-requests') loadPharmacyRequests();
  }, [activeTab, loadConsumables, loadMedicines, loadLabTests, loadBilling, loadDashboard, loadTimeline, loadOtRecords, loadDischargeRecords, loadPharmacyRequests]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (activeTab === 'patient-info') params.delete('tab');
    else params.set('tab', activeTab);
    setSearchParams(params, { replace: true });
  }, [activeTab, setSearchParams, searchParams]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) setActiveTab(tabParam);
  }, []);

  const handleAddConsumable = async (e) => {
    e.preventDefault();
    const { serviceName, price, gst, quantity } = consumableForm;
    if (!serviceName || !price || !quantity) { toast.error('Service name, price, and quantity are required'); return; }
    try {
      const payload = { admissionId: id, serviceName, price: parseFloat(price), gst: parseFloat(gst || '0'), quantity: parseInt(quantity) };
      const { data } = await client.post('/ipd/services/consumables', payload);
      toast.success(data.message);
      setShowAddConsumable(false);
      setConsumableForm({ serviceName: '', price: '', gst: '', quantity: '1' });
      loadConsumables(); loadBilling(); loadDashboard();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add consumable'); }
  };

  const handleDeleteConsumable = async (consumableId) => {
    if (!window.confirm('Delete this consumable record?')) return;
    try {
      await client.delete(`/ipd/services/consumables/${consumableId}`);
      toast.success('Consumable record deleted');
      loadConsumables(); loadBilling(); loadDashboard();
    } catch (err) { toast.error('Failed to delete consumable'); }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    const { medicineName, quantity, unitPrice, gst, baseUnitPrice } = medicineForm;
    if (!medicineName || !quantity || !unitPrice) { toast.error('Medicine name, quantity, and unit price are required'); return; }
    try {
      const payload = { admissionId: id, medicineName, quantity: parseInt(quantity), unitPrice: parseFloat(unitPrice), gst: parseFloat(gst || '0'), baseUnitPrice: parseFloat(baseUnitPrice || unitPrice) };
      const { data } = await client.post('/ipd/services/medicines', payload);
      toast.success(data.message);
      setShowAddMedicine(false);
      setMedicineForm({ medicineName: '', quantity: '1', unitPrice: '', gst: '', baseUnitPrice: '' });
      loadMedicines(); loadBilling(); loadDashboard();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add medicine'); }
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm('Delete this medicine record?')) return;
    try {
      await client.delete(`/ipd/services/medicines/${medicineId}`);
      toast.success('Medicine record deleted');
      loadMedicines(); loadBilling(); loadDashboard();
    } catch (err) { toast.error('Failed to delete medicine'); }
  };

  const handleAddLabTest = async (e) => {
    e.preventDefault();
    const { testName, testCategory, testPrice } = labTestForm;
    if (!testName) { toast.error('Please select a lab test'); return; }
    try {
      const payload = { admissionId: id, testName, testCategory, testPrice: parseFloat(testPrice || '0') };
      const { data } = await client.post('/ipd/services/lab-tests', payload);
      toast.success(data.message);
      setShowAddLabTest(false);
      setLabTestForm({ testName: '', testCategory: '', testPrice: '' });
      loadLabTests(); loadBilling(); loadDashboard();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add lab test'); }
  };

  const handleDeleteLabTest = async (labTestId) => {
    if (!window.confirm('Delete this lab test record?')) return;
    try {
      await client.delete(`/ipd/services/lab-tests/${labTestId}`);
      toast.success('Lab test record deleted');
      loadLabTests(); loadBilling(); loadDashboard();
    } catch (err) { toast.error('Failed to delete lab test'); }
  };

  const handleLabTestSelect = (testName) => {
    const test = availableLabTests.find(t => t.title === testName || t.test === testName);
    setLabTestForm({ testName, testCategory: test?.category || '', testPrice: String(test?.totalAmount || test?.basePrice || '0') });
  };

  const filteredLabTests = labTestSearch
    ? availableLabTests.filter(t => (t.title || t.test || '').toLowerCase().includes(labTestSearch.toLowerCase()) || (t.category || '').toLowerCase().includes(labTestSearch.toLowerCase()))
    : availableLabTests;

  const categoryFilteredLabTests = labTestCategoryFilter ? filteredLabTests.filter(t => t.category === labTestCategoryFilter) : filteredLabTests;

  const medicineTotal = medicineForm.quantity && medicineForm.unitPrice
    ? (parseInt(medicineForm.quantity) * parseFloat(medicineForm.unitPrice)).toFixed(2) : '0.00';

  const applyGstToUnitPrice = (base, gstPct) => {
    const b = parseFloat(base || 0);
    const g = parseFloat(gstPct || 0);
    if (!b || !g) return String(b || 0);
    return (b * (1 + g / 100)).toFixed(2);
  };

  const handleOpenConsumeModal = (reqItem) => {
    setShowConsumeModal(reqItem);
    const parsed = reqItem.items.map(it => ({
      itemName: it.itemName,
      issuedQty: it.issuedQty || 0,
      usedQty: it.issuedQty || 0,
      unusedQty: 0,
      damagedQty: 0
    }));
    setConsumeForm(parsed);
  };

  const getTimelineIcon = (activity) => {
    const iconMap = {
      'Admission Created': UserCircle, 'Bed Allocated': Bed, 'Admitted': UserCircle,
      'Service Added': Activity, 'Medicine Added': Pill, 'Lab Test Ordered': FlaskConical,
      'Lab Report Generated': FileText, 'Discharged': XCircle,
      'OT Record Created': Scissors, 'OT Record Updated': Scissors, 'OT Record Completed': CheckCircle,
    };
    return iconMap[activity] || Activity;
  };

  const sanitizeTimelineDescription = (description) => {
    if (!description) return description;
    return description
      .replace(/= ₹[\d,]+\.\d{2}/g, '')
      .replace(/\(₹[\d,]+\.\d{2}\)/g, '')
      .replace(/₹[\d,]+\.\d{2}/g, '')
      .trim();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-bold">Loading patient details...</span>
        </div>
      </div>
    );
  }

  if (!admission) return null;

  const patient = admission.patientId || {};
  const patientAge = patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  const statusColors = { 'Admitted': 'bg-red-100 text-red-800', 'Under Observation': 'bg-yellow-100 text-yellow-800', 'Shifted': 'bg-blue-100 text-blue-800', 'Discharged': 'bg-gray-200 text-gray-800' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/ipd/patients')} className="p-2 rounded-xl hover:bg-orange-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Patient Details</h1>
          <p className="text-sm text-gray-500">IPD: {admission.ipdNumber} | PID: {admission.pidNumber}</p>
        </div>
        <button onClick={loadAdmission} className="btn-secondary text-xs py-2 px-3">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Patient Profile Header */}
      <div className="card p-5 bg-gradient-to-br from-orange-50 to-white border-orange-200">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="bg-orange-500 text-white p-3 rounded-2xl">
            <UserCircle className="h-10 w-10" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h2 className="text-xl font-extrabold text-gray-900 truncate">{patient.patientName || 'Unknown Patient'}</h2>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold leading-tight w-fit ${statusColors[admission.status] || 'bg-gray-100 text-gray-700'}`}>{admission.status}</span>
                {admission.otStatus === 'In Progress' && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black tracking-wider uppercase bg-red-100 text-red-700 animate-pulse border border-red-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                    OT is going on
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
              <span className="font-mono font-bold text-orange-700">{formatUhid(patient.uhid)}</span>
              <span>•</span><span>{patient.gender || 'N/A'}</span>
              {patientAge && (<><span>•</span><span>{patientAge} years</span></>)}
              <span>•</span>
              <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-400" />{patient.mobile || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-orange-200 gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Patient Info */}
      {activeTab === 'patient-info' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3"><User className="h-5 w-5 text-orange-500" /><h3 className="font-extrabold text-gray-900">Patient Information</h3></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">Patient Name</span><span className="font-bold text-gray-800">{patient.patientName || 'N/A'}</span></div>
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">UHID</span><span className="font-mono font-bold text-orange-700">{formatUhid(patient.uhid) || 'N/A'}</span></div>
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">PID</span><span className="font-mono font-bold text-gray-800">{admission.pidNumber || 'N/A'}</span></div>
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">IPD Number</span><span className="font-mono font-bold text-gray-800">{admission.ipdNumber || 'N/A'}</span></div>
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">Age</span><span className="font-bold text-gray-800">{patientAge || 'N/A'} years</span></div>
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">Gender</span><span className="font-bold text-gray-800">{patient.gender || 'N/A'}</span></div>
              <div className="col-span-2"><span className="block text-[10px] font-bold uppercase text-gray-400">Mobile Number</span><div className="flex items-center gap-1 font-bold text-gray-800"><Phone className="h-3.5 w-3.5 text-gray-400" />{patient.mobile || 'N/A'}</div></div>
              <div className="col-span-2"><span className="block text-[10px] font-bold uppercase text-gray-400">Address</span><div className="flex items-start gap-1 font-bold text-gray-800"><MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" /><span>{patient.address || 'N/A'}</span></div></div>
            </div>
          </div>
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3"><Clock className="h-5 w-5 text-orange-500" /><h3 className="font-extrabold text-gray-900">Admission Information</h3></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2"><span className="block text-[10px] font-bold uppercase text-gray-400">Admission Date</span><div className="flex items-center gap-1 font-bold text-gray-800"><CalendarDays className="h-3.5 w-3.5 text-gray-400" />{new Date(admission.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>
              <div className="col-span-2"><span className="block text-[10px] font-bold uppercase text-gray-400">Admission Time</span><div className="flex items-center gap-1 font-bold text-gray-800"><Clock className="h-3.5 w-3.5 text-gray-400" />{new Date(admission.admissionDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div></div>
              <div className="col-span-2"><span className="block text-[10px] font-bold uppercase text-gray-400">Referred Doctor</span><div className="flex items-center gap-1 font-bold text-gray-800"><Stethoscope className="h-3.5 w-3.5 text-gray-400" />Dr. {admission.referredDoctor?.doctorName || admission.referredDoctor?.username || 'N/A'}</div></div>
              <div className="col-span-2"><span className="block text-[10px] font-bold uppercase text-gray-400">Consultant Doctor</span><div className="flex items-center gap-1 font-bold text-gray-800"><Stethoscope className="h-3.5 w-3.5 text-gray-400" />Dr. {admission.doctorInCharge?.doctorName || admission.doctorInCharge?.username || 'N/A'}</div></div>
              <div className="col-span-2"><span className="block text-[10px] font-bold uppercase text-gray-400">Provisional Diagnosis</span><span className="font-bold text-gray-800 block mt-1 p-2 bg-orange-50 rounded-lg">{admission.provisionalDiagnosis || 'No diagnosis recorded'}</span></div>
            </div>
          </div>
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3"><Bed className="h-5 w-5 text-orange-500" /><h3 className="font-extrabold text-gray-900">Bed Information</h3></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">Room Type</span><div className="flex items-center gap-1 font-bold text-gray-800"><Building2 className="h-3.5 w-3.5 text-gray-400" />{admission.roomId?.roomType || 'N/A'}</div></div>
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">Bed Type</span><span className="font-bold text-gray-800">{admission.bedId?.bedType || 'N/A'}</span></div>
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">Bed Number</span><span className="font-mono font-bold text-gray-800">{admission.bedId?.bedNumber || 'N/A'}</span></div>
            </div>
          </div>
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3"><UserCircle className="h-5 w-5 text-orange-500" /><h3 className="font-extrabold text-gray-900">Guardian Information</h3></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2"><span className="block text-[10px] font-bold uppercase text-gray-400">Guardian Name</span><span className="font-bold text-gray-800">{admission.guardianName || 'N/A'}</span></div>
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">Relation</span><span className="font-bold text-gray-800">{admission.guardianRelation || 'N/A'}</span></div>
              <div><span className="block text-[10px] font-bold uppercase text-gray-400">Mobile Number</span><div className="flex items-center gap-1 font-bold text-gray-800"><Phone className="h-3.5 w-3.5 text-gray-400" />{admission.guardianMobile || 'N/A'}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {dashboardLoading ? (<div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
          ) : dashboard ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="card p-4 text-center bg-blue-50 border-blue-100">
                  <Activity className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <span className="block text-2xl font-black text-blue-700">{dashboard.counts.consumables}</span>
                  <span className="text-[10px] font-bold uppercase text-blue-500">Services</span>
                </div>
                <div className="card p-4 text-center bg-green-50 border-green-100">
                  <Pill className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <span className="block text-2xl font-black text-green-700">{dashboard.counts.medicines}</span>
                  <span className="text-[10px] font-bold uppercase text-green-500">Medicines</span>
                </div>
                <div className="card p-4 text-center bg-purple-50 border-purple-100">
                  <FlaskConical className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                  <span className="block text-2xl font-black text-purple-700">{dashboard.counts.labTests}</span>
                  <span className="text-[10px] font-bold uppercase text-purple-500">Lab Tests</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 border-yellow-200"><div className="flex items-center justify-between"><div><span className="block text-[10px] font-bold uppercase text-yellow-600">Pending Reports</span><span className="text-3xl font-black text-yellow-700">{dashboard.counts.pendingReports}</span></div><AlertCircle className="h-8 w-8 text-yellow-400" /></div></div>
                <div className="card p-4 border-green-200"><div className="flex items-center justify-between"><div><span className="block text-[10px] font-bold uppercase text-green-600">Completed Reports</span><span className="text-3xl font-black text-green-700">{dashboard.counts.completedReports}</span></div><CheckCircle className="h-8 w-8 text-green-400" /></div></div>
              </div>
              <div className="card p-5 space-y-3">
                <h3 className="font-extrabold text-gray-900">Admission Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><span className="block text-[10px] font-bold uppercase text-gray-400">IPD Number</span><span className="font-bold">{dashboard.admission.ipdNumber}</span></div>
                  <div><span className="block text-[10px] font-bold uppercase text-gray-400">Status</span><span className="font-bold">{dashboard.admission.status}</span></div>
                  <div><span className="block text-[10px] font-bold uppercase text-gray-400">Days Admitted</span><span className="font-bold">{dashboard.admission.daysAdmitted}</span></div>
                  <div><span className="block text-[10px] font-bold uppercase text-gray-400">Room / Bed</span><span className="font-bold">{dashboard.bed.roomType} / {dashboard.bed.bedNumber}</span></div>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center text-gray-400"><BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="font-bold">Unable to load dashboard</p></div>
          )}
        </div>
      )}

      {/* TAB: Services */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto">
            {SERVICE_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setServiceCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${serviceCategory === cat.id ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-orange-200 text-gray-600 hover:bg-orange-50'}`}>
                <cat.icon className="h-4 w-4" /> {cat.label}
              </button>
            ))}
          </div>

          {serviceCategory === 'consumables' && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-orange-50/30">
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><Activity className="h-5 w-5 text-orange-500" /> Consumable Services</h3>
                <button onClick={() => setShowAddConsumable(!showAddConsumable)} className="btn text-xs py-2 px-3"><Plus className="h-3.5 w-3.5" /> Add Service</button>
              </div>
              {showAddConsumable && (
                <div className="p-4 border-b border-orange-100 bg-orange-50/20">
                  <form onSubmit={handleAddConsumable} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Service Name</label>
                      <input list="consumable-services" className="input py-2 text-xs" placeholder="Search or select service" value={consumableForm.serviceName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConsumableForm(p => {
                            const m = consumableServicesList.find(s => s.name === val);
                            return {
                              ...p,
                              serviceName: val,
                              price: m ? String(m.price || '0') : '',
                              gst: m ? String(m.gst || '0') : ''
                            };
                          });
                        }} />
                      <datalist id="consumable-services">{consumableServicesList.map((s, i) => <option key={i} value={s.name} />)}</datalist>
                    </div>
                    <div><label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Qty</label><input type="number" min="1" className="input py-2 text-xs" value={consumableForm.quantity} onChange={(e) => setConsumableForm(p => ({ ...p, quantity: e.target.value }))} /></div>
                    <div className="col-span-full flex justify-end gap-2"><button type="button" onClick={() => { setShowAddConsumable(false); setConsumableForm({ serviceName: '', price: '', gst: '', quantity: '1' }); }} className="btn-secondary text-xs py-2 px-4">Cancel</button><button type="submit" className="btn text-xs py-2 px-4"><Plus className="h-3.5 w-3.5" /> Add</button></div>
                  </form>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100"><th className="p-3 pl-4">Date</th><th className="p-3">Time</th><th className="p-3">Service Name</th><th className="p-3">Qty</th><th className="p-3">Added By</th><th className="p-3 pr-4 text-center">Action</th></tr></thead>
                  <tbody className="divide-y divide-orange-50">
                    {consumablesLoading ? <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</td></tr>
                    : consumables.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-gray-400"><Activity className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No consumable services added yet</p></td></tr>
                    : consumables.map(c => (
                      <tr key={c._id} className="hover:bg-orange-50/20">
                        <td className="p-3 pl-4 text-xs">{c.date}</td><td className="p-3 text-xs">{c.time}</td>
                        <td className="p-3 font-bold text-gray-800">{c.serviceName}</td><td className="p-3">{c.quantity}</td>
                        <td className="p-3 text-xs text-gray-500">{c.addedBy?.doctorName || c.addedBy?.username || 'N/A'}</td>
                        <td className="p-3 pr-4 text-center"><button onClick={() => handleDeleteConsumable(c._id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {serviceCategory === 'medicines' && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-orange-50/30">
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><Pill className="h-5 w-5 text-orange-500" /> Medicines</h3>
                <button onClick={() => setShowAddMedicine(!showAddMedicine)} className="btn text-xs py-2 px-3"><Plus className="h-3.5 w-3.5" /> Add Medicine</button>
              </div>
              {showAddMedicine && (
                <div className="p-4 border-b border-orange-100 bg-orange-50/20">
                  <form onSubmit={handleAddMedicine} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Medicine Name</label>
                      <input list="medicine-list" className="input py-2 text-xs" placeholder="Search or select medicine" value={medicineForm.medicineName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMedicineForm(p => {
                            const m = medicineSettingsList.find(med => med.name === val);
                            return {
                              ...p,
                              medicineName: val,
                              unitPrice: m ? String(m.price || '0') : '',
                              gst: m ? String(m.gst || '0') : '',
                              baseUnitPrice: m ? String(m.price || '0') : ''
                            };
                          });
                        }} />
                      <datalist id="medicine-list">{medicineSettingsList.map((m, i) => <option key={i} value={m.name} />)}</datalist>
                    </div>
                    <div><label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Quantity</label><input type="number" min="1" className="input py-2 text-xs" value={medicineForm.quantity} onChange={(e) => setMedicineForm(p => ({ ...p, quantity: e.target.value }))} /></div>
                    <div className="col-span-full flex items-center justify-between">
                      <div className="text-sm"><span className="text-gray-500">Total: </span><span className="font-extrabold text-green-700">₹{medicineTotal}</span></div>
                      <div className="flex gap-2"><button type="button" onClick={() => { setShowAddMedicine(false); setMedicineForm({ medicineName: '', quantity: '1', unitPrice: '' }); }} className="btn-secondary text-xs py-2 px-4">Cancel</button><button type="submit" className="btn text-xs py-2 px-4"><Plus className="h-3.5 w-3.5" /> Add</button></div>
                    </div>
                  </form>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100"><th className="p-3 pl-4">Date</th><th className="p-3">Time</th><th className="p-3">Medicine Name</th><th className="p-3">Qty</th><th className="p-3">Added By</th><th className="p-3 pr-4 text-center">Action</th></tr></thead>
                  <tbody className="divide-y divide-orange-50">
                    {medicinesLoading ? <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</td></tr>
                    : medicines.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-gray-400"><Pill className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No medicines added yet</p></td></tr>
                    : medicines.map(m => (
                      <tr key={m._id} className="hover:bg-orange-50/20">
                        <td className="p-3 pl-4 text-xs">{m.date}</td><td className="p-3 text-xs">{m.time}</td>
                        <td className="p-3 font-bold text-gray-800">{m.medicineName}</td><td className="p-3">{m.quantity}</td>
                        <td className="p-3 text-xs text-gray-500">{m.addedBy?.doctorName || m.addedBy?.username || 'N/A'}</td>
                        <td className="p-3 pr-4 text-center"><button onClick={() => handleDeleteMedicine(m._id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {serviceCategory === 'lab-tests' && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-orange-50/30">
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><FlaskConical className="h-5 w-5 text-orange-500" /> Lab Tests</h3>
                <button onClick={() => setShowAddLabTest(!showAddLabTest)} className="btn text-xs py-2 px-3"><Plus className="h-3.5 w-3.5" /> Add Lab Test</button>
              </div>
              {showAddLabTest && (
                <div className="p-4 border-b border-orange-100 bg-orange-50/20">
                  <form onSubmit={handleAddLabTest} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Search & Select Lab Test</label>
                        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input type="text" className="input pl-9 py-2 text-xs" placeholder="Search by test name or category..." value={labTestSearch} onChange={(e) => setLabTestSearch(e.target.value)} /></div>
                        {labTestSearch && categoryFilteredLabTests.length > 0 && (
                          <div className="mt-1 border border-orange-200 rounded-xl max-h-[200px] overflow-y-auto bg-white shadow-lg divide-y divide-orange-50">
                            {categoryFilteredLabTests.slice(0, 20).map(t => (
                              <button key={t._id} type="button" onClick={() => { handleLabTestSelect(t.title || t.test); setLabTestSearch(''); }}
                                className="w-full text-left p-2.5 hover:bg-orange-50 text-xs flex justify-between items-center">
                                <div><p className="font-bold text-gray-800">{t.title || t.test}</p><p className="text-gray-400 text-[10px]">{t.category}</p></div>
                                <span className="font-bold text-green-700">₹{(t.totalAmount || t.basePrice || 0).toFixed(2)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Category</label>
                        <select className="input py-2 text-xs" value={labTestCategoryFilter} onChange={(e) => setLabTestCategoryFilter(e.target.value)}>
                          <option value="">All Categories</option>
                          {labTestCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    {labTestForm.testName && (
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
                        <div className="flex items-center justify-between">
                          <div><span className="block text-[10px] font-bold uppercase text-blue-600">Selected Test</span><span className="font-bold text-gray-800">{labTestForm.testName}</span>{labTestForm.testCategory && <span className="block text-xs text-gray-500">{labTestForm.testCategory}</span>}</div>
                          <div className="text-right"><span className="block text-[10px] font-bold uppercase text-blue-600">Price</span><span className="font-black text-blue-700 text-lg">₹{parseFloat(labTestForm.testPrice || '0').toFixed(2)}</span></div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setShowAddLabTest(false); setLabTestForm({ testName: '', testCategory: '', testPrice: '' }); }} className="btn-secondary text-xs py-2 px-4">Cancel</button>
                      <button type="submit" disabled={!labTestForm.testName} className="btn text-xs py-2 px-4"><Plus className="h-3.5 w-3.5" /> Order Lab Test</button>
                    </div>
                  </form>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100"><th className="p-3 pl-4">Date</th><th className="p-3">Time</th><th className="p-3">Test Name</th><th className="p-3">Category</th><th className="p-3">Report Status</th><th className="p-3">Report Date</th><th className="p-3">Added By</th><th className="p-3 pr-4 text-center">Action</th></tr></thead>
                  <tbody className="divide-y divide-orange-50">
                    {labTestsLoading ? <tr><td colSpan="8" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</td></tr>
                    : labTests.length === 0 ? <tr><td colSpan="8" className="p-8 text-center text-gray-400"><FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No lab tests ordered yet</p></td></tr>
                    : labTests.map(t => (
                      <tr key={t._id} className="hover:bg-orange-50/20">
                        <td className="p-3 pl-4 text-xs">{t.date}</td><td className="p-3 text-xs">{t.time}</td>
                        <td className="p-3 font-bold text-gray-800">{t.testName}</td><td className="p-3 text-xs">{t.testCategory || '-'}</td>
                        <td className="p-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${reportStatusColors[t.reportStatus] || 'bg-gray-100 text-gray-700'}`}>{t.reportStatus === 'Completed' || t.reportStatus === 'Approved' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{t.reportStatus}</span></td>
                        <td className="p-3 text-xs">{t.reportDate || '-'}</td>
                        <td className="p-3 text-xs text-gray-500">{t.addedBy?.doctorName || t.addedBy?.username || 'N/A'}</td>
                        <td className="p-3 pr-4 text-center">
                          <div className="flex justify-center gap-1">
                            {t.labRequestId && (t.reportStatus === 'Completed' || t.reportStatus === 'Approved') && (
                              <a href={`/lab?section=tracking&requestId=${t.labRequestId?._id || t.labRequestId}`} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg" title="View Report"><Eye className="h-3.5 w-3.5" /></a>
                            )}
                            <button onClick={() => handleDeleteLabTest(t._id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {serviceCategory === 'medication-chart' && (
            <IpdMedicationChartContent admissionId={id} />
          )}
        </div>
      )}

      {/* TAB: Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><CreditCard className="h-5 w-5 text-orange-500" /> Complete Billing Summary</h3>
              <p className="text-xs text-gray-500 mt-1">Room: {admission.roomId?.roomType} | Bed: {admission.bedId?.bedNumber} | Days: {billingSummary?.daysAdmitted || 0}</p>
            </div>
            {billingLoading ? (<div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> Loading billing...</div>
            ) : billingSummary ? (
              <div className="p-5 space-y-6">
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-blue-800"><Building2 className="h-4 w-4 inline mr-1" /> Room Charges</h4><span className="font-black text-blue-700 text-xl">₹{billingSummary.roomCharges.toFixed(2)}</span></div>
                  <div className="text-xs text-blue-600">{admission.roomId?.roomType} | ₹{billingSummary.bedPricePerDay}/day × {billingSummary.daysAdmitted} day(s)</div>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-green-800"><Activity className="h-4 w-4 inline mr-1" /> Consumable Charges</h4><span className="font-black text-green-700 text-xl">₹{billingSummary.consumableCharges.toFixed(2)}</span></div>
                  {billingSummary.consumableDetails?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="text-green-600 border-b border-green-200"><th className="p-1 text-left">Date</th><th className="p-1 text-left">Service</th><th className="p-1 text-right">Qty</th><th className="p-1 text-right">Price</th><th className="p-1 text-right">GST</th><th className="p-1 text-right">Total</th></tr></thead>
                        <tbody>{billingSummary.consumableDetails.map((c, i) => (<tr key={i} className="border-b border-green-100"><td className="p-1">{c.date}</td><td className="p-1 font-bold">{c.serviceName}</td><td className="p-1 text-right">{c.quantity}</td><td className="p-1 text-right">₹{c.price.toFixed(2)}</td><td className="p-1 text-right">{c.gst}%</td><td className="p-1 text-right font-bold">₹{c.totalAmount.toFixed(2)}</td></tr>))}</tbody>
                        <tfoot><tr className="font-bold text-green-700"><td colSpan="5" className="p-1 text-right">Subtotal (excl. GST):</td><td className="p-1 text-right">₹{billingSummary.consumableSubtotal?.toFixed(2)}</td></tr>
                        <tr className="font-bold text-green-700"><td colSpan="5" className="p-1 text-right">GST Amount:</td><td className="p-1 text-right">₹{billingSummary.consumableGST?.toFixed(2)}</td></tr></tfoot>
                      </table>
                    </div>
                  )}
                </div>
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-amber-800"><Pill className="h-4 w-4 inline mr-1" /> Medicine Charges</h4><span className="font-black text-amber-700 text-xl">₹{billingSummary.medicineCharges.toFixed(2)}</span></div>
                  {billingSummary.medicineDetails?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="text-amber-600 border-b border-amber-200"><th className="p-1 text-left">Date</th><th className="p-1 text-left">Medicine</th><th className="p-1 text-right">Qty</th><th className="p-1 text-right">Unit Price</th><th className="p-1 text-right">Total</th></tr></thead>
                        <tbody>{billingSummary.medicineDetails.map((m, i) => (<tr key={i} className="border-b border-amber-100"><td className="p-1">{m.date}</td><td className="p-1 font-bold">{m.medicineName}</td><td className="p-1 text-right">{m.quantity}</td><td className="p-1 text-right">₹{m.unitPrice.toFixed(2)}</td><td className="p-1 text-right font-bold">₹{m.totalAmount.toFixed(2)}</td></tr>))}</tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                  <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-purple-800"><FlaskConical className="h-4 w-4 inline mr-1" /> Lab Charges</h4><span className="font-black text-purple-700 text-xl">₹{billingSummary.labCharges.toFixed(2)}</span></div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white">
                  <div className="flex justify-between items-center">
                    <div><span className="block text-[10px] font-bold uppercase text-white/80">Grand Total</span><span className="text-3xl font-black">₹{billingSummary.grandTotal.toFixed(2)}</span></div>
                    <CreditCard className="h-10 w-10 text-white/30" />
                  </div>
                </div>
                <button onClick={() => { loadBilling(); loadConsumables(); loadMedicines(); loadLabTests(); }} className="btn-secondary text-xs py-2 px-4 w-fit"><RefreshCw className="h-3.5 w-3.5" /> Refresh Billing</button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400"><CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="font-bold">Unable to load billing</p></div>
            )}
          </div>
        </div>
      )}

      {/* TAB: OT Records */}
      {activeTab === 'ot-records' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><Scissors className="h-5 w-5 text-indigo-500" /> OT Records</h3>
              <button onClick={() => navigate(`/ipd/ot/${id}`)} className="btn text-xs py-2 px-3 flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> New OT Record</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100"><th className="p-3 pl-4">Surgery Date</th><th className="p-3">Surgeon Name</th><th className="p-3">Procedure</th><th className="p-3">Created Date</th><th className="p-3">Status</th><th className="p-3 pr-4 text-center">Actions</th></tr></thead>
                <tbody className="divide-y divide-orange-50">
                  {otRecordsLoading ? (<tr><td colSpan="6" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</td></tr>
                  ) : otRecords.length === 0 ? (<tr><td colSpan="6" className="p-8 text-center text-gray-400"><Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No OT records found</p><p className="text-xs">Click "New OT Record" to create the first operative report</p></td></tr>
                  ) : (
                    otRecords.map(record => (
                      <tr key={record._id} className="hover:bg-indigo-50/20">
                        <td className="p-3 pl-4 text-xs font-bold text-gray-800">{record.dateOfSurgery ? new Date(record.dateOfSurgery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                        <td className="p-3 text-xs">{record.surgeon || '-'}</td>
                        <td className="p-3 text-xs max-w-[200px] truncate">{record.proceduresPerformed || '-'}</td>
                        <td className="p-3 text-xs text-gray-500">{new Date(record.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="p-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${record.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.status === 'Completed' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{record.status}</span></td>
                        <td className="p-3 pr-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => navigate(`/ipd/ot/${id}?otId=${record._id}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye className="h-3.5 w-3.5" /></button>
                            <button onClick={() => navigate(`/ipd/ot/${id}?otId=${record._id}`)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { navigate(`/ipd/ot/${id}?otId=${record._id}`); setTimeout(() => window.print(), 1500); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Print"><Printer className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { navigate(`/ipd/ot/${id}?otId=${record._id}`); setTimeout(() => { toast.success('Use browser Print → Save as PDF'); window.print(); }, 1500); }} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="Download PDF"><Download className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {otRecords.length > 0 && (<div className="p-3 border-t border-orange-100 bg-orange-50/20 text-xs text-gray-500 text-center">Total OT Records: {otRecords.length}</div>)}
          </div>
        </div>
      )}

      {/* TAB: Discharge Records */}
      {activeTab === 'discharge-records' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><DoorOpen className="h-5 w-5 text-red-500" /> Discharge Records</h3>
              {admission.status !== 'Discharged' && (
                <button onClick={() => navigate(`/ipd/discharge/${id}`)} className="btn text-xs py-2 px-3 flex items-center gap-1 bg-red-600 hover:bg-red-700"><DoorOpen className="h-3.5 w-3.5" /> Discharge Patient</button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100"><th className="p-3 pl-4">Discharge Date</th><th className="p-3">Discharge Status</th><th className="p-3">Discharge Reason</th><th className="p-3">Consultant Doctor</th><th className="p-3">Created Date</th><th className="p-3 pr-4 text-center">Actions</th></tr></thead>
                <tbody className="divide-y divide-orange-50">
                  {dischargeRecordsLoading ? (<tr><td colSpan="6" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</td></tr>
                  ) : dischargeRecords.length === 0 ? (<tr><td colSpan="6" className="p-8 text-center text-gray-400"><DoorOpen className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No discharge records found</p><p className="text-xs">Discharge records will appear here after patient is discharged</p></td></tr>
                  ) : (
                    dischargeRecords.map(record => (
                      <tr key={record._id} className="hover:bg-red-50/20">
                        <td className="p-3 pl-4 text-xs font-bold text-gray-800">{record.dischargeDate ? new Date(record.dischargeDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                        <td className="p-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${record.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.status === 'Completed' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{record.status}</span></td>
                        <td className="p-3 text-xs">{record.dischargeReason === 'Other' ? record.otherDischargeReason : record.dischargeReason || '-'}</td>
                        <td className="p-3 text-xs">{[record.dischargingPhysicianTitle, record.dischargingPhysicianFirstName, record.dischargingPhysicianLastName].filter(Boolean).join(' ') || '-'}</td>
                        <td className="p-3 text-xs text-gray-500">{new Date(record.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="p-3 pr-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => navigate(`/ipd/discharge/${id}?dischargeId=${record._id}&view=true`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { navigate(`/ipd/discharge/${id}?dischargeId=${record._id}&view=true`); setTimeout(() => window.print(), 1500); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Print"><Printer className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { navigate(`/ipd/discharge/${id}?dischargeId=${record._id}&view=true`); setTimeout(() => { toast.success('Use browser Print → Save as PDF'); window.print(); }, 1500); }} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="Download PDF"><Download className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {dischargeRecords.length > 0 && (<div className="p-3 border-t border-orange-100 bg-orange-50/20 text-xs text-gray-500 text-center">Total Discharge Records: {dischargeRecords.length}</div>)}
          </div>
        </div>
      )}

      {/* TAB: Timeline */}
      {activeTab === 'timeline' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-orange-100 bg-orange-50/30">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><List className="h-5 w-5 text-orange-500" /> Patient Service Timeline</h3>
            <p className="text-xs text-gray-500 mt-1">Complete activity history for this admission</p>
          </div>
          {timelineLoading ? (<div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> Loading timeline...</div>
          ) : timeline.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <List className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="font-bold">No activity recorded yet</p>
              <p className="text-xs">Activities will appear as services are added</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-orange-200"></div>
                <div className="space-y-6">
                  {timeline.map((entry, idx) => {
                    const Icon = getTimelineIcon(entry.activity);
                    return (
                      <div key={idx} className="relative flex gap-4 pl-0">
                        <div className="relative z-10 flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center"><Icon className="h-5 w-5 text-orange-600" /></div>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-2"><span className="font-extrabold text-gray-900 text-sm">{entry.activity}</span><span className="text-[10px] text-gray-400 font-mono">{entry.date} {entry.time}</span></div>
                          <p className="text-xs text-gray-600 mt-0.5">{sanitizeTimelineDescription(entry.description)}</p>
                          {entry.performedByName && <p className="text-[10px] text-gray-400 mt-0.5">by {entry.performedByName}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* TAB: Pharmacy Requests */}
      {activeTab === 'pharmacy-requests' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <Pill className="text-orange-500 h-5 w-5" />
                Pharmacy Requests
              </h3>
              <p className="text-xs text-gray-500">Submit, track, and manage procedure stock requests</p>
            </div>
            {/* Create Request button - only for doctor/admin role */}
            {(user.role === 'doctor' || user.role === 'admin') && (
              <button 
                onClick={() => {
                  setShowAddRequest(true);
                  setRequestForm({ procedureName: '', items: [] });
                }} 
                className="btn text-xs py-2 px-3 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Create Request
              </button>
            )}
          </div>

          {/* List of Requests */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                    <th className="p-3 pl-4">Request #</th>
                    <th className="p-3">Procedure Name</th>
                    <th className="p-3">Requested By</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {requestsLoading ? (
                    <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2 text-orange-500" /> Loading requests...</td></tr>
                  ) : pharmacyRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400">
                        <Pill className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
                        <p className="font-bold">No requests submitted yet</p>
                      </td>
                    </tr>
                  ) : (
                    pharmacyRequests.map(reqItem => (
                      <tr key={reqItem._id} className="hover:bg-orange-50/10">
                        <td className="p-3 pl-4 font-mono font-bold text-orange-700">{reqItem.requestNumber}</td>
                        <td className="p-3 font-bold text-gray-800">{reqItem.procedureName}</td>
                        <td className="p-3 text-xs">Dr. {reqItem.doctorId?.doctorName || reqItem.doctorId?.username}</td>
                        <td className="p-3 text-xs text-gray-500">{new Date(reqItem.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            reqItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            reqItem.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                            reqItem.status === 'Partially Approved' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            reqItem.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                            reqItem.status === 'Issued' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            reqItem.status === 'Return Requested' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            reqItem.status === 'Return Accepted' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                            reqItem.status === 'Return Rejected' ? 'bg-pink-100 text-pink-800 border-pink-200' :
                            reqItem.status === 'Remaining Items Issued' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {reqItem.status}
                          </span>
                        </td>
                        <td className="p-3 pr-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setSelectedRequest(reqItem)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1 border border-blue-100 bg-white shadow-sm cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" /> Details
                            </button>
                            {(reqItem.status === 'Issued' || reqItem.status === 'Remaining Items Issued') && (
                              <button 
                                onClick={() => handleOpenConsumeModal(reqItem)}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-bold flex items-center gap-1 border border-orange-100 bg-white shadow-sm cursor-pointer"
                              >
                                <Syringe className="h-3.5 w-3.5" /> Record Consumption
                              </button>
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

          {/* Details Modal */}
          {selectedRequest && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-3xl w-full border border-orange-100 shadow-2xl max-h-[85vh] overflow-y-auto space-y-6">
                <div className="flex justify-between items-center border-b border-orange-50 pb-3">
                  <div>
                    <h2 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                      <Pill className="text-orange-500 h-5 w-5" />
                      Request {selectedRequest.requestNumber} Details
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">Procedure: {selectedRequest.procedureName}</p>
                  </div>
                  <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg cursor-pointer"><X className="h-5 w-5" /></button>
                </div>

                {/* Items Status Summary */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 text-sm">Requested Items</h4>
                  <div className="overflow-x-auto border border-orange-100 rounded-2xl">
                    <table className="w-full text-left text-xs text-gray-700">
                      <thead>
                        <tr className="bg-orange-50/50 text-[10px] uppercase font-bold text-gray-500 border-b border-orange-100">
                          <th className="p-2.5 pl-4">Item Name</th>
                          <th className="p-2.5">Requested Qty</th>
                          <th className="p-2.5">Approved Qty</th>
                          <th className="p-2.5">Pending Qty</th>
                          <th className="p-2.5">Rejected Qty</th>
                          <th className="p-2.5">Issued Qty</th>
                          <th className="p-2.5">Used Qty</th>
                          <th className="p-2.5">Returned Qty</th>
                          <th className="p-2.5">Damaged Qty</th>
                          <th className="p-2.5 pr-4">Batch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-50">
                        {selectedRequest.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-orange-50/10">
                            <td className="p-2.5 pl-4 font-bold text-gray-800">{it.itemName}</td>
                            <td className="p-2.5 font-semibold text-gray-600">{it.requestedQty}</td>
                            <td className="p-2.5 font-bold text-green-700">{it.approvedQty || 0}</td>
                            <td className="p-2.5 font-bold text-orange-600">{it.pendingQty || 0}</td>
                            <td className="p-2.5 font-bold text-red-500">{it.rejectedQty || 0}</td>
                            <td className="p-2.5 font-bold text-blue-700">{it.issuedQty || 0}</td>
                            <td className="p-2.5 font-bold text-indigo-700">{it.usedQty || 0}</td>
                            <td className="p-2.5 font-bold text-teal-700">{it.returnedQty || 0}</td>
                            <td className="p-2.5 font-bold text-pink-700">{it.damagedQty || 0}</td>
                            <td className="p-2.5 pr-4 font-mono font-bold text-gray-500">{it.batch || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Remarks */}
                {selectedRequest.remarks && (
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-gray-600">
                    <span className="font-bold block mb-1 text-orange-800">Pharmacy Remarks</span>
                    {selectedRequest.remarks}
                  </div>
                )}

                {/* Audit Trail */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 text-sm">Chronological Audit Trail</h4>
                  <div className="relative border-l-2 border-orange-100 pl-4 space-y-4">
                    {selectedRequest.auditTrail.map((log, idx) => (
                      <div key={idx} className="relative text-xs">
                        <span className="absolute -left-[22px] top-1 bg-orange-500 h-2.5 w-2.5 rounded-full border border-white"></span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{log.action}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({new Date(log.timestamp).toLocaleString()})</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">by {log.performedByName}</p>
                        {log.remarks && <p className="text-gray-500 mt-1 italic">{log.remarks}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
                  <button onClick={() => setSelectedRequest(null)} className="btn-secondary text-xs py-2 px-4 cursor-pointer">Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Create Request Modal */}
          {showAddRequest && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-orange-100 shadow-2xl space-y-5">
                <div className="flex justify-between items-center border-b border-orange-50 pb-3">
                  <h2 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                    <Plus className="text-orange-500 h-5 w-5" />
                    Create Pharmacy Request
                  </h2>
                  <button onClick={() => setShowAddRequest(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg cursor-pointer"><X className="h-5 w-5" /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Procedure Name *</label>
                    <input 
                      type="text" 
                      className="input py-2 text-sm" 
                      placeholder="e.g. Appendectomy, Daily Dressing" 
                      value={requestForm.procedureName}
                      onChange={(e) => setRequestForm(p => ({ ...p, procedureName: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Add Item Form */}
                  <div className="p-3.5 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-3">
                    <span className="block text-xs font-bold text-orange-800">Add Item to Request</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="mb-0.5 block text-[10px] uppercase font-bold text-gray-400">Item Name</label>
                        <input 
                          type="text" 
                          list="search-meds-datalist"
                          className="input py-1.5 text-xs"
                          placeholder="Type or search medicine"
                          value={searchItemQuery}
                          onChange={(e) => setSearchItemQuery(e.target.value)}
                        />
                        <datalist id="search-meds-datalist">
                          {pharmacyMedsList.map((m, i) => <option key={i} value={m} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] uppercase font-bold text-gray-400">Qty</label>
                        <input 
                          type="number" 
                          id="add-item-qty"
                          min="1" 
                          defaultValue="1"
                          className="input py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const qtyInput = document.getElementById('add-item-qty');
                        const qty = parseInt(qtyInput?.value) || 1;
                        if (!searchItemQuery.trim()) {
                          toast.error("Medicine name is required");
                          return;
                        }
                        if (requestForm.items.some(i => i.itemName.toLowerCase() === searchItemQuery.trim().toLowerCase())) {
                          toast.error("Item already added to request");
                          return;
                        }
                        setRequestForm(p => ({
                          ...p,
                          items: [...p.items, { itemName: searchItemQuery.trim(), requestedQty: qty }]
                        }));
                        setSearchItemQuery('');
                        if (qtyInput) qtyInput.value = "1";
                      }}
                      className="btn text-[10px] py-1.5 px-3 bg-orange-500 hover:bg-orange-600 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Item
                    </button>
                  </div>

                  {/* Added Items List */}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-gray-500">Request Items List</span>
                    {requestForm.items.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center p-4 border border-dashed border-orange-100 rounded-2xl">No items added yet</p>
                    ) : (
                      <div className="max-h-[150px] overflow-y-auto border border-orange-100 rounded-2xl divide-y divide-orange-50 bg-white">
                        {requestForm.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 px-3 text-xs">
                            <span className="font-bold text-gray-800">{item.itemName}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 font-mono">Qty: {item.requestedQty}</span>
                              <button 
                                onClick={() => {
                                  setRequestForm(p => ({
                                    ...p,
                                    items: p.items.filter((_, i) => i !== idx)
                                  }));
                                }}
                                className="text-red-500 hover:bg-red-50 p-1 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
                    <button type="button" onClick={() => setShowAddRequest(false)} className="btn-secondary text-xs py-2 px-4 cursor-pointer">Cancel</button>
                    <button 
                      onClick={async () => {
                        if (!requestForm.procedureName.trim()) {
                          toast.error('Procedure name is required');
                          return;
                        }
                        if (requestForm.items.length === 0) {
                          toast.error('Please add at least one item');
                          return;
                        }
                        try {
                          await client.post('/pharmacy/requests', {
                            admissionId: id,
                            procedureName: requestForm.procedureName,
                            items: requestForm.items
                          });
                          toast.success('Pharmacy request submitted successfully');
                          setShowAddRequest(false);
                          loadPharmacyRequests();
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to submit request');
                        }
                      }}
                      className="btn text-xs py-2 px-4 cursor-pointer"
                    >
                      Submit Request
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Record Consumption Modal */}
          {showConsumeModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-orange-100 shadow-2xl max-h-[85vh] overflow-y-auto space-y-5">
                <div className="flex justify-between items-center border-b border-orange-50 pb-3">
                  <div>
                    <h2 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                      <Syringe className="text-orange-500 h-5 w-5" />
                      Record Consumption: {showConsumeModal.requestNumber}
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">Input used, unused, and wasted quantities</p>
                  </div>
                  <button onClick={() => setShowConsumeModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg cursor-pointer"><X className="h-5 w-5" /></button>
                </div>

                <div className="space-y-4">
                  <div className="overflow-x-auto border border-orange-100 rounded-2xl bg-white">
                    <table className="w-full text-left text-xs text-gray-700">
                      <thead>
                        <tr className="bg-orange-50/50 text-[10px] uppercase font-bold text-gray-500 border-b border-orange-100">
                          <th className="p-2.5 pl-4">Item Name</th>
                          <th className="p-2.5">Issued Qty</th>
                          <th className="p-2.5 w-[80px]">Used Qty</th>
                          <th className="p-2.5 w-[80px]">Unused (Return)</th>
                          <th className="p-2.5 w-[80px] pr-4">Damaged/Wasted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-50">
                        {consumeForm.map((item, idx) => (
                          <tr key={idx} className="hover:bg-orange-50/10">
                            <td className="p-2.5 pl-4 font-bold text-gray-800">{item.itemName}</td>
                            <td className="p-2.5 font-bold text-blue-700">{item.issuedQty}</td>
                            <td className="p-2.5">
                              <input 
                                type="number" 
                                min="0" 
                                max={item.issuedQty}
                                className="input py-1 px-1.5 text-center text-xs w-[70px]"
                                value={item.usedQty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  const updated = [...consumeForm];
                                  updated[idx].usedQty = val;
                                  setConsumeForm(updated);
                                }}
                              />
                            </td>
                            <td className="p-2.5">
                              <input 
                                type="number" 
                                min="0" 
                                max={item.issuedQty}
                                className="input py-1 px-1.5 text-center text-xs w-[70px]"
                                value={item.unusedQty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  const updated = [...consumeForm];
                                  updated[idx].unusedQty = val;
                                  setConsumeForm(updated);
                                }}
                              />
                            </td>
                            <td className="p-2.5 pr-4">
                              <input 
                                type="number" 
                                min="0" 
                                max={item.issuedQty}
                                className="input py-1 px-1.5 text-center text-xs w-[70px]"
                                value={item.damagedQty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  const updated = [...consumeForm];
                                  updated[idx].damagedQty = val;
                                  setConsumeForm(updated);
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
                    <button type="button" onClick={() => setShowConsumeModal(false)} className="btn-secondary text-xs py-2 px-4 cursor-pointer">Cancel</button>
                    <button 
                      onClick={async () => {
                        // Validate sums
                        for (const item of consumeForm) {
                          if (item.usedQty + item.unusedQty + item.damagedQty !== item.issuedQty) {
                            toast.error(`Quantity mismatch for ${item.itemName}. Sum of Used + Unused + Damaged must equal ${item.issuedQty}`);
                            return;
                          }
                        }

                        try {
                          await client.post(`/pharmacy/requests/${showConsumeModal._id}/consume`, {
                            items: consumeForm
                          });
                          toast.success('Consumption recorded successfully!');
                          setShowConsumeModal(false);
                          loadPharmacyRequests();
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to record consumption');
                        }
                      }}
                      className="btn text-xs py-2 px-4 cursor-pointer"
                    >
                      Save Consumption
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IpdPatientDetails;