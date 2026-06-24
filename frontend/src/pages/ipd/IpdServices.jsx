import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  User,
  RefreshCw,
  Eye,
  Loader2,
  Users,
  Syringe,
  Pill,
  FlaskConical,
  Activity,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Bed,
  Phone,
  CalendarDays,
  Clock,
  CheckCircle,
  Filter,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';
import IpdMedicationChartContent from './IpdMedicationChartContent.jsx';

const SERVICE_CATEGORIES = [
  { id: 'consumables', label: 'Consumable Services', icon: Activity },
  { id: 'medicines', label: 'Medicines', icon: Pill },
  { id: 'lab-tests', label: 'Lab Tests', icon: FlaskConical },
  { id: 'medication-chart', label: 'Medication Chart', icon: ClipboardList },
];

const statusColors = {
  'Admitted': 'bg-red-100 text-red-800',
  'Under Observation': 'bg-yellow-100 text-yellow-800',
  'Shifted': 'bg-blue-100 text-blue-800',
  'Discharged': 'bg-gray-200 text-gray-800'
};

const IpdServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [serviceCategory, setServiceCategory] = useState('consumables');

  // Consumable states
  const [consumables, setConsumables] = useState([]);
  const [consumablesLoading, setConsumablesLoading] = useState(false);
  const [showAddConsumable, setShowAddConsumable] = useState(false);
  const [consumableForm, setConsumableForm] = useState({ serviceName: '', price: '', gst: '', quantity: '1' });
  const [consumableServicesList, setConsumableServicesList] = useState([]);

  // Medicine states
  const [medicines, setMedicines] = useState([]);
  const [medicinesLoading, setMedicinesLoading] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medicineForm, setMedicineForm] = useState({ medicineName: '', quantity: '1', unitPrice: '', gst: '', baseUnitPrice: '' });
  const [medicineSettingsList, setMedicineSettingsList] = useState([]);

  // Lab Test states
  const [labTests, setLabTests] = useState([]);
  const [labTestsLoading, setLabTestsLoading] = useState(false);
  const [showAddLabTest, setShowAddLabTest] = useState(false);
  const [labTestForm, setLabTestForm] = useState({ testName: '', testCategory: '', testPrice: '' });
  const [labTestSearch, setLabTestSearch] = useState('');
  const [availableLabTests, setAvailableLabTests] = useState([]);
  const [labTestCategoryFilter, setLabTestCategoryFilter] = useState('');
  const [labTestCategories, setLabTestCategories] = useState([]);

  // Load admitted patients
  const loadAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const { data } = await client.get(`/ipd/patients?${params.toString()}`);
      setAdmissions(data);
      setFilteredAdmissions(data);
    } catch (err) {
      toast.error('Failed to load IPD patient list');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Load admin settings
  const loadAdminSettings = useCallback(async () => {
    try {
      const { data } = await client.get('/ipd/settings');
      if (data?.consumableServices) setConsumableServicesList(data.consumableServices.filter(s => s.isActive));
      if (data?.medicines) setMedicineSettingsList(data.medicines.filter(m => m.isActive));
    } catch (err) { console.warn(err); }
  }, []);

  // Load available lab tests
  const loadAvailableLabTests = useCallback(async () => {
    try {
      const { data } = await client.get('/lab/tests');
      setAvailableLabTests(data.filter(t => t.status === 'Active'));
      const cats = [...new Set(data.filter(t => t.status === 'Active').map(t => t.category))];
      setLabTestCategories(cats);
    } catch (err) { console.warn('Could not load lab tests:', err); }
  }, []);

  useEffect(() => {
    loadAdmissions();
    loadAdminSettings();
    loadAvailableLabTests();
  }, [loadAdmissions, loadAdminSettings, loadAvailableLabTests]);

  // Load services when a patient is selected
  useEffect(() => {
    if (!selectedAdmission) return;
    loadConsumables();
    loadMedicines();
    loadLabTests();
  }, [selectedAdmission]);

  // Load consumables
  const loadConsumables = useCallback(async () => {
    if (!selectedAdmission) return;
    setConsumablesLoading(true);
    try {
      const { data } = await client.get(`/ipd/services/consumables/${selectedAdmission._id}`);
      setConsumables(data);
    } catch (err) { console.error(err); }
    finally { setConsumablesLoading(false); }
  }, [selectedAdmission]);

  // Load medicines
  const loadMedicines = useCallback(async () => {
    if (!selectedAdmission) return;
    setMedicinesLoading(true);
    try {
      const { data } = await client.get(`/ipd/services/medicines/${selectedAdmission._id}`);
      setMedicines(data);
    } catch (err) { console.error(err); }
    finally { setMedicinesLoading(false); }
  }, [selectedAdmission]);

  // Load lab tests
  const loadLabTests = useCallback(async () => {
    if (!selectedAdmission) return;
    setLabTestsLoading(true);
    try {
      const { data } = await client.get(`/ipd/services/lab-tests/${selectedAdmission._id}`);
      setLabTests(data);
    } catch (err) { console.error(err); }
    finally { setLabTestsLoading(false); }
  }, [selectedAdmission]);

  // Search filter
  useEffect(() => {
    if (!searchQuery) {
      setFilteredAdmissions(admissions);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = admissions.filter(a => {
      const patient = a.patientId || {};
      return (
        (patient.patientName || '').toLowerCase().includes(q) ||
        (patient.uhid || '').toLowerCase().includes(q) ||
        (patient.mobile || '').includes(q) ||
        (a.ipdNumber || '').toLowerCase().includes(q) ||
        (a.pidNumber || '').toLowerCase().includes(q)
      );
    });
    setFilteredAdmissions(results);
  }, [admissions, searchQuery]);

  // Consumable handlers
  const handleAddConsumable = async (e) => {
    e.preventDefault();
    const { serviceName, price, gst, quantity } = consumableForm;
    if (!serviceName || !price || !quantity) { toast.error('Service name, price, and quantity are required'); return; }
    try {
      const payload = { admissionId: selectedAdmission._id, serviceName, price: parseFloat(price), gst: parseFloat(gst || '0'), quantity: parseInt(quantity) };
      const { data } = await client.post('/ipd/services/consumables', payload);
      toast.success(data.message);
      setShowAddConsumable(false);
      setConsumableForm({ serviceName: '', price: '', gst: '', quantity: '1' });
      loadConsumables();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add consumable'); }
  };

  const handleDeleteConsumable = async (consumableId) => {
    if (!window.confirm('Delete this consumable record?')) return;
    try {
      await client.delete(`/ipd/services/consumables/${consumableId}`);
      toast.success('Consumable record deleted');
      loadConsumables();
    } catch (err) { toast.error('Failed to delete consumable'); }
  };

  // Medicine handlers
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    const { medicineName, quantity, unitPrice, gst, baseUnitPrice } = medicineForm;
    if (!medicineName || !quantity || !unitPrice) { toast.error('Medicine name, quantity, and unit price are required'); return; }
    try {
      // Ensure unitPrice sent to server includes GST if gst provided (unitPrice field already reflects GST-inclusive value)
      const payload = { admissionId: selectedAdmission._id, medicineName, quantity: parseInt(quantity), unitPrice: parseFloat(unitPrice), gst: parseFloat(gst || '0'), baseUnitPrice: parseFloat(baseUnitPrice || unitPrice) };
      const { data } = await client.post('/ipd/services/medicines', payload);
      toast.success(data.message);
      setShowAddMedicine(false);
      setMedicineForm({ medicineName: '', quantity: '1', unitPrice: '', gst: '', baseUnitPrice: '' });
      loadMedicines();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add medicine'); }
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm('Delete this medicine record?')) return;
    try {
      await client.delete(`/ipd/services/medicines/${medicineId}`);
      toast.success('Medicine record deleted');
      loadMedicines();
    } catch (err) { toast.error('Failed to delete medicine'); }
  };

  // Lab Test handlers
  const handleAddLabTest = async (e) => {
    e.preventDefault();
    const { testName, testCategory, testPrice } = labTestForm;
    if (!testName) { toast.error('Please select a lab test'); return; }
    try {
      const payload = { admissionId: selectedAdmission._id, testName, testCategory, testPrice: parseFloat(testPrice || '0') };
      const { data } = await client.post('/ipd/services/lab-tests', payload);
      toast.success(data.message);
      setShowAddLabTest(false);
      setLabTestForm({ testName: '', testCategory: '', testPrice: '' });
      loadLabTests();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add lab test'); }
  };

  const handleDeleteLabTest = async (labTestId) => {
    if (!window.confirm('Delete this lab test record?')) return;
    try {
      await client.delete(`/ipd/services/lab-tests/${labTestId}`);
      toast.success('Lab test record deleted');
      loadLabTests();
    } catch (err) { toast.error('Failed to delete lab test'); }
  };

  const handleLabTestSelect = (testName) => {
    const test = availableLabTests.find(t => t.title === testName || t.test === testName);
    setLabTestForm({
      testName,
      testCategory: test?.category || '',
      testPrice: String(test?.totalAmount || test?.basePrice || '0')
    });
  };

  const filteredLabTests = labTestSearch
    ? availableLabTests.filter(t =>
        (t.title || t.test || '').toLowerCase().includes(labTestSearch.toLowerCase()) ||
        (t.category || '').toLowerCase().includes(labTestSearch.toLowerCase())
      )
    : availableLabTests;

  const categoryFilteredLabTests = labTestCategoryFilter
    ? filteredLabTests.filter(t => t.category === labTestCategoryFilter)
    : filteredLabTests;

  const medicineTotal = medicineForm.quantity && medicineForm.unitPrice
    ? (parseInt(medicineForm.quantity) * parseFloat(medicineForm.unitPrice)).toFixed(2) : '0.00';

  // Helper to update unit price when GST changes or unit price is edited
  const applyGstToUnitPrice = (base, gstPct) => {
    const b = parseFloat(base || 0);
    const g = parseFloat(gstPct || 0);
    if (!b || !g) return String(b || 0);
    return (b * (1 + g / 100)).toFixed(2);
  };

  const reportStatusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Ready': 'bg-green-100 text-green-800',
    'Completed': 'bg-green-100 text-green-800',
    'Approved': 'bg-green-100 text-green-800'
  };

  const handleViewPatientDetails = (admission) => {
    navigate(`/ipd/patient/${admission._id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">IPD Services</h1>
          <p className="text-sm text-gray-500">Add consumable services, medicines, and lab tests to admitted patients</p>
        </div>
        <button onClick={() => { loadAdmissions(); loadAdminSettings(); loadAvailableLabTests(); }} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Patient Selection */}
      <div className="card p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, UHID, PID, IPD Number, or Mobile..."
            className="input pl-9 py-2.5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-orange-100 bg-orange-50/30">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" /> Admitted Patients
                </h3>
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  {filteredAdmissions.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-orange-50 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-gray-400" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : filteredAdmissions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm">No patients found</p>
                </div>
              ) : (
                filteredAdmissions.map((admission) => {
                  const patient = admission.patientId || {};
                  return (
                    <button
                      key={admission._id}
                      onClick={() => setSelectedAdmission(admission)}
                      className={`w-full text-left p-3 hover:bg-orange-50 transition-all ${
                        selectedAdmission?._id === admission._id ? 'bg-orange-100 border-l-4 border-orange-500' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${admission.status === 'Discharged' ? 'bg-gray-100' : 'bg-orange-100'}`}>
                          <User className={`h-4 w-4 ${admission.status === 'Discharged' ? 'text-gray-400' : 'text-orange-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{patient.patientName || 'N/A'}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{formatUhid(patient.uhid) || 'N/A'} | IPD: {admission.ipdNumber || 'N/A'}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[admission.status] || 'bg-gray-100 text-gray-700'}`}>
                          {admission.status === 'Admitted' ? <Clock className="h-2.5 w-2.5 mr-0.5" /> : null}
                          {admission.status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Service Area */}
        <div className="lg:col-span-2">
          {!selectedAdmission ? (
            <div className="card p-12 text-center">
              <Syringe className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <h3 className="font-extrabold text-gray-500 text-lg">Select a Patient</h3>
              <p className="text-sm text-gray-400 mt-1">Choose a patient from the list to add services</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Patient Header */}
              <div className="card p-4 bg-gradient-to-br from-orange-50 to-white border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 text-white p-2 rounded-xl">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-extrabold text-gray-900">{selectedAdmission.patientId?.patientName || 'Unknown'}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      <span className="font-mono font-bold text-orange-700">{formatUhid(selectedAdmission.patientId?.uhid)}</span>
                      <span>IPD: {selectedAdmission.ipdNumber}</span>
                      <span>{selectedAdmission.patientId?.gender || 'N/A'}</span>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />{selectedAdmission.patientId?.mobile || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleViewPatientDetails(selectedAdmission)} className="btn-secondary text-xs py-2 px-3">
                    <Eye className="h-3.5 w-3.5" /> View Full Details
                  </button>
                </div>
              </div>

              {/* Service Category Tabs */}
              <div className="flex gap-2 overflow-x-auto">
                {SERVICE_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setServiceCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      serviceCategory === cat.id ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-orange-200 text-gray-600 hover:bg-orange-50'
                    }`}>
                    <cat.icon className="h-4 w-4" /> {cat.label}
                  </button>
                ))}
              </div>

              {/* CONSUMABLES SECTION */}
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
                          <input list="consumable-services-ipd" className="input py-2 text-xs" placeholder="Search or select service" value={consumableForm.serviceName}
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
                          <datalist id="consumable-services-ipd">{consumableServicesList.map((s, i) => <option key={i} value={s.name} />)}</datalist>
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

              {/* MEDICINES SECTION */}
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
                          <input list="medicine-list-ipd" className="input py-2 text-xs" placeholder="Search or select medicine" value={medicineForm.medicineName}
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
                          <datalist id="medicine-list-ipd">{medicineSettingsList.map((m, i) => <option key={i} value={m.name} />)}</datalist>
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

              {/* LAB TESTS SECTION */}
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
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <input type="text" className="input pl-9 py-2 text-xs" placeholder="Search by test name or category..." value={labTestSearch} onChange={(e) => setLabTestSearch(e.target.value)} />
                            </div>
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
                              <div>
                                <span className="block text-[10px] font-bold uppercase text-blue-600">Selected Test</span>
                                <span className="font-bold text-gray-800">{labTestForm.testName}</span>
                                {labTestForm.testCategory && <span className="block text-xs text-gray-500">{labTestForm.testCategory}</span>}
                              </div>
                              <div className="text-right">
                                <span className="block text-[10px] font-bold uppercase text-blue-600">Price</span>
                                <span className="font-black text-blue-700 text-lg">₹{parseFloat(labTestForm.testPrice || '0').toFixed(2)}</span>
                              </div>
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
                      <thead><tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100"><th className="p-3 pl-4">Date</th><th className="p-3">Time</th><th className="p-3">Test Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Report Status</th><th className="p-3">Report Date</th><th className="p-3">Added By</th><th className="p-3 pr-4 text-center">Action</th></tr></thead>
                      <tbody className="divide-y divide-orange-50">
                        {labTestsLoading ? <tr><td colSpan="9" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</td></tr>
                        : labTests.length === 0 ? <tr><td colSpan="9" className="p-8 text-center text-gray-400"><FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No lab tests ordered yet</p></td></tr>
                        : labTests.map(t => (
                          <tr key={t._id} className="hover:bg-orange-50/20">
                            <td className="p-3 pl-4 text-xs">{t.date}</td><td className="p-3 text-xs">{t.time}</td>
                            <td className="p-3 font-bold text-gray-800">{t.testName}</td><td className="p-3 text-xs">{t.testCategory || '-'}</td>
                            <td className="p-3 font-bold text-green-700">₹{t.testPrice.toFixed(2)}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${reportStatusColors[t.reportStatus] || 'bg-gray-100 text-gray-700'}`}>
                                {t.reportStatus === 'Completed' || t.reportStatus === 'Approved' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {t.reportStatus}
                              </span>
                            </td>
                            <td className="p-3 text-xs">{t.reportDate || '-'}</td>
                            <td className="p-3 text-xs text-gray-500">{t.addedBy?.doctorName || t.addedBy?.username || 'N/A'}</td>
                            <td className="p-3 pr-4 text-center">
                              <button onClick={() => handleDeleteLabTest(t._id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MEDICATION CHART SECTION */}
              {serviceCategory === 'medication-chart' && (
                <IpdMedicationChartContent admissionId={selectedAdmission._id} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IpdServices;