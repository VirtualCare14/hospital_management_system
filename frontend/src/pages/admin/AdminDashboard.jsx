import { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Stethoscope,
  Users,
  Workflow,
  BadgeIndianRupee,
  CreditCard,
  Clock,
  CheckCircle,
  History,
  ClipboardList,
  Pill,
  Search,
  Calendar,
  FileText,
  User,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  X,
  Loader2
} from 'lucide-react';
import client from '../../api/client';
import { useHeader } from '../../context/HeaderContext';
import SkeletonCard from '../../components/Skeleton/SkeletonCard';
import StatCard from '../../components/StatCard.jsx';
import toast from 'react-hot-toast';

const ageFromDob = (dob) => {
  if (!dob) return '-';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

// Admin Invoice Editor component
const AdminInvoiceEditor = () => {
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [updating, setUpdating] = useState(false);

  // Search patients or invoices on typing
  useEffect(() => {
    if (patientSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await client.get(`/admin/bills/search?query=${patientSearch}`);
        setSearchResults(data || []);
      } catch (err) {
        console.error('Error searching:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearch]);

  // Load bills for selected patient or direct bill match
  const handleSelectResult = async (item) => {
    setPatientSearch('');
    setSearchResults([]);
    
    if (item.type === 'patient') {
      setSelectedPatient(item.data);
      setLoadingBills(true);
      try {
        const { data } = await client.get(`/admin/bills/patient/${item.id}`);
        setBills(data || []);
      } catch (err) {
        toast.error('Failed to load patient invoices.');
      } finally {
        setLoadingBills(false);
      }
    } else if (item.type === 'bill') {
      setSelectedPatient({
        patientName: item.billType === 'Pharmacy' ? 'Walk-in / Search Match' : 'Search Match',
        uhid: 'N/A'
      });
      setBills([item.data]);
    }
  };

  const handleOpenEdit = (bill) => {
    setEditingBill(bill);
    // Format date for datetime-local (yyyy-MM-ddThh:mm)
    const d = new Date(bill.date);
    // Adjust to local ISO string
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
    setNewDate(localISOTime);
  };

  const handleUpdateDate = async () => {
    if (!newDate) return;
    setUpdating(true);
    try {
      await client.put(`/admin/bills/${editingBill.billType}/${editingBill._id}/date`, { newDate });
      toast.success('Bill date updated successfully!');
      setEditingBill(null);
      // Reload bills
      if (selectedPatient && selectedPatient._id) {
        const { data } = await client.get(`/admin/bills/patient/${selectedPatient._id}`);
        setBills(data || []);
      } else {
        // Direct search match update local state
        const updated = { ...editingBill, date: new Date(newDate).toISOString() };
        setBills([updated]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bill date.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient & Invoice Search */}
      <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white relative">
        <h3 className="font-extrabold text-gray-800 mb-2 text-base">Edit Patient Invoice Dates</h3>
        <p className="text-xs text-gray-500 mb-4">Search for a patient by name/UHID, or search an invoice directly by Invoice/Bill number (e.g. PB-10001, INV123456).</p>
        
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-orange-400" />
          <input
            type="text"
            placeholder="Type patient name, UHID, mobile, or Invoice/Bill number to search..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="input pl-10 text-xs py-2.5"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="absolute left-5 right-5 top-[115px] z-50 bg-white border border-orange-100 rounded-xl shadow-xl max-h-[250px] overflow-y-auto divide-y divide-orange-50">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectResult(item)}
                className="w-full text-left p-3 hover:bg-orange-50/55 flex items-center justify-between text-xs transition font-semibold"
              >
                <div>
                  <p className="text-gray-900 font-bold text-sm">{item.title}</p>
                  <p className="text-gray-500 mt-0.5 font-mono">{item.subtitle}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-orange-500" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white space-y-4">
          <div className="flex justify-between items-center border-b border-orange-50 pb-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-600">Selected Patient</span>
              <h4 className="font-extrabold text-gray-855 text-sm">{selectedPatient.patientName} (UHID: {selectedPatient.uhid})</h4>
            </div>
            <button 
              type="button" 
              onClick={() => { setSelectedPatient(null); setBills([]); }} 
              className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
            >
              Deselect Patient
            </button>
          </div>

          {loadingBills ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500 inline mr-2" /> Loading invoices list...
            </div>
          ) : bills.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs font-bold">
              No bills found for this patient in the Pharmacy or Billing modules.
            </div>
          ) : (
            <div className="overflow-x-auto border border-orange-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-gray-600 font-bold uppercase border-b border-orange-100 text-[10px]">
                    <th className="p-3">Invoice / Bill Number</th>
                    <th className="p-3">Module / Type</th>
                    <th className="p-3">Current Date</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 font-semibold text-gray-700">
                  {bills.map(b => (
                    <tr key={b._id} className="hover:bg-orange-50/10 align-middle">
                      <td className="p-3 font-mono font-bold text-orange-700">{b.billNumber}</td>
                      <td className="p-3 text-gray-600">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.billType === 'Pharmacy' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {b.billType}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{new Date(b.date).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-black text-gray-800">₹{Number(b.amount).toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          b.status === 'Draft' ? 'bg-gray-100 text-gray-600' :
                          b.status === 'Cancelled' ? 'bg-red-50 text-red-650' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(b)}
                          className="px-2.5 py-1 text-[10px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 cursor-pointer"
                        >
                          Change Date
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Date Editor Modal */}
      {editingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-orange-50 pb-2.5">
              <h3 className="font-extrabold text-gray-800 text-sm">Update Bill Date</h3>
              <button type="button" onClick={() => setEditingBill(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              <p>Editing Date for invoice: <span className="font-mono font-bold text-orange-700">{editingBill.billNumber}</span></p>
              <div>
                <label className="block mb-1 font-bold text-gray-500">Invoice Date *</label>
                <input
                  type="datetime-local"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="input py-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
              <button 
                type="button" 
                onClick={() => setEditingBill(null)} 
                className="btn-secondary text-xs py-2 px-4 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleUpdateDate} 
                disabled={updating}
                className="btn text-xs py-2 px-5 font-bold cursor-pointer disabled:bg-orange-300"
              >
                {updating ? 'Saving...' : 'Update Date'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('staff'); // 'staff', 'tracking', 'summary', 'invoices'
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tracking State
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Patient Summary State
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientSummary, setPatientSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Added States for Patients List & Tracking
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedTrackingPatient, setSelectedTrackingPatient] = useState(null);
  const [patientTrackingData, setPatientTrackingData] = useState(null);
  const [trackingDetailsLoading, setTrackingDetailsLoading] = useState(false);

  // Fetch patient list when summary tab is opened
  useEffect(() => {
    if (activeTab === 'summary') {
      setPatientsLoading(true);
      client.get('/patients')
        .then((res) => {
          setPatients(res.data);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load patient list');
        })
        .finally(() => setPatientsLoading(false));
    }
  }, [activeTab]);

  // Fetch patient tracking timeline when a patient is selected for tracking
  useEffect(() => {
    if (selectedTrackingPatient) {
      setTrackingDetailsLoading(true);
      client.get(`/admin/patient-tracking/${selectedTrackingPatient._id || selectedTrackingPatient.patientId?._id || selectedTrackingPatient.patientId}`)
        .then((res) => {
          setPatientTrackingData(res.data);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load patient tracking timeline');
        })
        .finally(() => setTrackingDetailsLoading(false));
    } else {
      setPatientTrackingData(null);
    }
  }, [selectedTrackingPatient]);

  // SEO Update
  useEffect(() => {
    document.title = "Admin Dashboard | Hospital Management System";
  }, []);

  // Fetch initial staff & department data
  const loadDashboardData = useCallback(() => {
    setLoading(true);
    Promise.all([client.get('/admin/users'), client.get('/admin/departments')])
      .then(([u, d]) => {
        setUsers(u.data);
        setDepartments(d.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load dashboard data');
      })
      .finally(() => setLoading(false));

    if (activeTab === 'tracking') {
      setTrackingLoading(true);
      client.get('/admin/hospital-tracking')
        .then((res) => {
          setTrackingData(res.data);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load hospital tracking data');
        })
        .finally(() => setTrackingLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Search patients as search input changes
  useEffect(() => {
    if (patientSearch.trim().length >= 2) {
      const delayDebounce = setTimeout(() => {
        client.get(`/patients?search=${patientSearch}`)
          .then((res) => {
            setSearchResults(res.data);
          })
          .catch((err) => console.error(err));
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [patientSearch]);

  // Fetch patient summary when a patient is selected
  const handleSelectPatient = (patientId) => {
    setSelectedPatientId(patientId);
    setSearchResults([]);
    setPatientSearch('');
    setSummaryLoading(true);
    
    Promise.all([
      client.get(`/admin/patient-summary/${patientId}`),
      client.get(`/admin/patient-tracking/${patientId}`)
    ])
      .then(([summaryRes, trackingRes]) => {
        setPatientSummary(summaryRes.data);
        setPatientTrackingData(trackingRes.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load patient summary or tracking logs');
      })
      .finally(() => setSummaryLoading(false));
  };

  const doctors = users.filter((user) => user.role === 'doctor');
  
  const filteredPatients = patients.filter((p) =>
    p.patientName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.uhid?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.mobile?.includes(patientSearch)
  );

  useHeader({ onRefresh: loadDashboardData });

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex justify-end border-b border-orange-100 pb-4">
        <div className="flex bg-orange-50 p-1.5 rounded-xl border border-orange-100">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${activeTab === 'staff' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'}`}
          >
            Staff & Departments
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${activeTab === 'tracking' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'}`}
          >
            Hospital Tracking
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${activeTab === 'summary' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'}`}
          >
            Patient Summary
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${activeTab === 'invoices' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'}`}
          >
            Invoice Date Editor
          </button>
        </div>
      </div>

      {/* TAB 1: STAFF & DEPARTMENTS */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <SkeletonCard className="w-full h-36" headerHeight="1.5rem" bodyLines={2} />
                <SkeletonCard className="w-full h-36" headerHeight="1.5rem" bodyLines={2} />
                <SkeletonCard className="w-full h-36" headerHeight="1.5rem" bodyLines={2} />
                <SkeletonCard className="w-full h-36" headerHeight="1.5rem" bodyLines={2} />
              </div>

              <div className="card overflow-hidden rounded-2xl border border-orange-100 shadow-sm bg-white">
                <div className="border-b border-orange-100 p-5 bg-gradient-to-r from-orange-50/50 to-white">
                  <SkeletonCard className="w-48 h-10" headerHeight="1rem" bodyLines={1} />
                </div>
                <div className="p-5">
                  <SkeletonCard className="w-full h-72" headerHeight="1.5rem" bodyLines={6} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <StatCard icon={Users} label="Total Users" value={users.length} />
                <StatCard icon={Stethoscope} label="Doctors" value={doctors.length} />
                <StatCard icon={Building2} label="Departments" value={departments.length} />
                <StatCard icon={Workflow} label="Future Modules" value="5" />
              </div>

              <div className="card overflow-hidden rounded-2xl border border-orange-100 shadow-sm">
                <div className="border-b border-orange-100 p-5 bg-gradient-to-r from-orange-50/50 to-white">
                  <h2 className="font-bold text-gray-800 text-lg">Staff Directory & Module Access</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-orange-100/50 text-xs uppercase text-orange-950 font-bold">
                      <tr>
                        <th className="p-4">Username</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Modules Access</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-t border-orange-50/60 hover:bg-orange-50/10 transition duration-150">
                          <td className="p-4 font-semibold text-gray-900">{user.username}</td>
                          <td className="p-4 capitalize">
                            <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-semibold">
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600">{user.department || '-'}</td>
                          <td className="p-4 text-gray-600">{user.moduleAccess?.join(', ') || '-'}</td>
                          <td className="p-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {user.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: HOSPITAL TRACKING */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {trackingLoading ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SkeletonCard className="w-full h-36" headerHeight="1.5rem" bodyLines={2} />
                <SkeletonCard className="w-full h-36" headerHeight="1.5rem" bodyLines={2} />
                <SkeletonCard className="w-full h-36" headerHeight="1.5rem" bodyLines={2} />
                <SkeletonCard className="w-full h-36" headerHeight="1.5rem" bodyLines={2} />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <SkeletonCard className="w-full h-96" headerHeight="2rem" bodyLines={6} />
                <SkeletonCard className="w-full h-96" headerHeight="2rem" bodyLines={6} />
              </div>
            </div>
          ) : !trackingData ? (
            <div className="card p-8 text-center text-gray-500">
              No tracking information available.
            </div>
          ) : (
            <>
              {/* Stat Grid with Gradients */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-5 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 translate-x-3 -translate-y-3 opacity-20 transition duration-300 group-hover:scale-110">
                    <BadgeIndianRupee className="h-28 w-28" />
                  </div>
                  <p className="text-xs uppercase font-extrabold tracking-wider text-orange-100">Total Billed</p>
                  <p className="text-3xl font-black mt-2 text-white">₹{(trackingData.billing?.totalBilled || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-orange-200 mt-2 font-bold">{trackingData.billing?.billsCount} Invoices generated</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 translate-x-3 -translate-y-3 opacity-20 transition duration-300 group-hover:scale-110">
                    <CreditCard className="h-28 w-28" />
                  </div>
                  <p className="text-xs uppercase font-extrabold tracking-wider text-emerald-100">Total Revenue Paid</p>
                  <p className="text-3xl font-black mt-2 text-white">₹{(trackingData.billing?.totalPaid || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-emerald-200 mt-2 font-bold">Received in Cash/UPI/Card</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 translate-x-3 -translate-y-3 opacity-20 transition duration-300 group-hover:scale-110">
                    <Clock className="h-28 w-28" />
                  </div>
                  <p className="text-xs uppercase font-extrabold tracking-wider text-amber-100">Total Dues Pending</p>
                  <p className="text-3xl font-black mt-2 text-white">₹{(trackingData.billing?.totalDue || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-amber-200 mt-2 font-bold">Outstanding billing balances</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 translate-x-3 -translate-y-3 opacity-20 transition duration-300 group-hover:scale-110">
                    <Users className="h-28 w-28" />
                  </div>
                  <p className="text-xs uppercase font-extrabold tracking-wider text-indigo-100">Total Patients</p>
                  <p className="text-3xl font-black mt-2 text-white">{trackingData.totalPatients || 0}</p>
                  <p className="text-xs text-indigo-200 mt-2 font-bold">Unique registered UHIDs</p>
                </div>
              </div>

              {/* Treatment Going On section */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="card border border-orange-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <div className="border-b border-orange-100 p-5 bg-gradient-to-r from-orange-50/20 to-white flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-orange-500 animate-pulse" /> Patient Treatment Going On
                    </h3>
                    <span className="bg-orange-100 text-orange-800 font-extrabold px-3 py-1 rounded-full text-xs">
                      {trackingData.treatmentGoingOn?.total || 0} Active
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-orange-50/50 border border-orange-100/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase">OPD Pending</p>
                        <p className="text-xl font-black text-orange-700 mt-1">{trackingData.treatmentGoingOn?.opdCount || 0}</p>
                      </div>
                      <div className="bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase">IPD Admitted</p>
                        <p className="text-xl font-black text-indigo-700 mt-1">{trackingData.treatmentGoingOn?.ipdCount || 0}</p>
                      </div>
                      <div className="bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase">SDT Draft</p>
                        <p className="text-xl font-black text-amber-700 mt-1">{trackingData.treatmentGoingOn?.sdtCount || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                      <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Active Patient List</h4>
                      {/* Active IPD Admitted */}
                      {trackingData.treatmentGoingOn?.ipdList?.map((ipd) => (
                        <button
                          type="button"
                          onClick={() => setSelectedTrackingPatient({
                            _id: ipd.patientId?._id || ipd.patientId,
                            patientName: ipd.patientId?.patientName || 'Unknown',
                            uhid: ipd.patientId?.uhid || 'N/A'
                          })}
                          key={ipd._id}
                          className="w-full text-left border border-indigo-100 bg-indigo-50/10 p-3 rounded-xl flex items-center justify-between text-xs hover:bg-indigo-50/30 transition cursor-pointer block"
                        >
                          <div>
                            <p className="font-bold text-gray-800">{ipd.patientId?.patientName}</p>
                            <p className="text-[10px] text-gray-500">IPD: {ipd.ipdNumber} | Doctor: {ipd.doctorInCharge?.doctorName || ipd.doctorInCharge?.username}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 uppercase text-[9px]">
                            Admitted
                          </span>
                        </button>
                      ))}

                      {/* Active OPD Pending */}
                      {trackingData.treatmentGoingOn?.opdList?.map((visit) => (
                        <button
                          type="button"
                          onClick={() => setSelectedTrackingPatient({
                            _id: visit.patientId?._id || visit.patientId,
                            patientName: visit.patientId?.patientName || 'Unknown',
                            uhid: visit.patientId?.uhid || 'N/A'
                          })}
                          key={visit._id}
                          className="w-full text-left border border-orange-100 bg-orange-50/10 p-3 rounded-xl flex items-center justify-between text-xs hover:bg-orange-50/30 transition cursor-pointer block"
                        >
                          <div>
                            <p className="font-bold text-gray-800">{visit.patientId?.patientName}</p>
                            <p className="text-[10px] text-gray-500">Dept: {visit.department} | Doctor: {visit.doctorId?.doctorName || visit.doctorId?.username}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700 uppercase text-[9px]">
                            OPD Pending
                          </span>
                        </button>
                      ))}

                      {/* Active SDT Draft */}
                      {trackingData.treatmentGoingOn?.sdtList?.map((sdt) => (
                        <button
                          type="button"
                          onClick={() => setSelectedTrackingPatient({
                            _id: sdt.patientId?._id || sdt.patientId,
                            patientName: sdt.patientId?.patientName || sdt.patientName || 'Unknown',
                            uhid: sdt.patientId?.uhid || sdt.uhid || 'N/A'
                          })}
                          key={sdt._id}
                          className="w-full text-left border border-amber-100 bg-amber-50/10 p-3 rounded-xl flex items-center justify-between text-xs hover:bg-amber-50/30 transition cursor-pointer block"
                        >
                          <div>
                            <p className="font-bold text-gray-800">{sdt.patientId?.patientName || sdt.patientName}</p>
                            <p className="text-[10px] text-gray-500">Type: {sdt.treatmentType}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700 uppercase text-[9px]">
                            SDT Draft
                          </span>
                        </button>
                      ))}

                      {trackingData.treatmentGoingOn?.total === 0 && (
                        <p className="text-gray-400 text-center py-4 text-xs italic">No active treatments going on</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Treatment Done section */}
                <div className="card border border-orange-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <div className="border-b border-orange-100 p-5 bg-gradient-to-r from-orange-50/20 to-white flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" /> Patient Treatment Done
                    </h3>
                    <span className="bg-green-100 text-green-800 font-extrabold px-3 py-1 rounded-full text-xs">
                      {trackingData.treatmentDone?.total || 0} Completed
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-50/50 border border-green-100/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase">OPD Completed</p>
                        <p className="text-xl font-black text-green-700 mt-1">{trackingData.treatmentDone?.opdCount || 0}</p>
                      </div>
                      <div className="bg-teal-50/50 border border-teal-100/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase">IPD Discharged</p>
                        <p className="text-xl font-black text-teal-700 mt-1">{trackingData.treatmentDone?.ipdCount || 0}</p>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase">SDT Completed</p>
                        <p className="text-xl font-black text-emerald-700 mt-1">{trackingData.treatmentDone?.sdtCount || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                      <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Recent Completions</h4>
                      {/* Completed IPD Admitted */}
                      {trackingData.treatmentDone?.ipdList?.map((ipd) => (
                        <div key={ipd._id} className="border border-teal-100 bg-teal-50/10 p-3 rounded-xl flex items-center justify-between text-xs hover:shadow-sm transition">
                          <div>
                            <p className="font-bold text-gray-800">{ipd.patientId?.patientName}</p>
                            <p className="text-[10px] text-gray-500">IPD: {ipd.ipdNumber} | Discharged: {ipd.dischargeDate ? new Date(ipd.dischargeDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-700 uppercase text-[9px]">
                            Discharged
                          </span>
                        </div>
                      ))}

                      {/* Completed OPD Pending */}
                      {trackingData.treatmentDone?.opdList?.map((visit) => (
                        <div key={visit._id} className="border border-green-100 bg-green-50/10 p-3 rounded-xl flex items-center justify-between text-xs hover:shadow-sm transition">
                          <div>
                            <p className="font-bold text-gray-800">{visit.patientId?.patientName}</p>
                            <p className="text-[10px] text-gray-500">Dept: {visit.department} | Closed: {visit.consultationCompletedDate ? new Date(visit.consultationCompletedDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 uppercase text-[9px]">
                            OPD Completed
                          </span>
                        </div>
                      ))}

                      {/* Completed SDT Completed */}
                      {trackingData.treatmentDone?.sdtList?.map((sdt) => (
                        <div key={sdt._id} className="border border-emerald-100 bg-emerald-50/10 p-3 rounded-xl flex items-center justify-between text-xs hover:shadow-sm transition">
                          <div>
                            <p className="font-bold text-gray-800">{sdt.patientId?.patientName || sdt.patientName}</p>
                            <p className="text-[10px] text-gray-500">Type: {sdt.treatmentType} | Saved</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 uppercase text-[9px]">
                            SDT Completed
                          </span>
                        </div>
                      ))}

                      {trackingData.treatmentDone?.total === 0 && (
                        <p className="text-gray-400 text-center py-4 text-xs italic">No completions yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border border-amber-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="border-b border-amber-100 p-5 bg-gradient-to-r from-amber-50/20 to-white flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-500" /> Edited Patient Invoice Dates
                  </h3>
                  <span className="bg-amber-100 text-amber-800 font-extrabold px-3 py-1 rounded-full text-xs">
                    {trackingData.editedInvoices?.length || 0} Edited
                  </span>
                </div>
                <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
                  {trackingData.editedInvoices?.length > 0 ? (
                    trackingData.editedInvoices.map((invoice, index) => (
                      <div key={`${invoice.billId}-${invoice.timestamp || index}`} className="border border-amber-100 bg-amber-50/10 p-3 rounded-xl text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-800">{invoice.patientName}</p>
                            <p className="text-[10px] text-gray-500">UHID: {invoice.uhid} | {invoice.billType} • {invoice.billNumber}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700 uppercase text-[9px]">
                            {invoice.billType}
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] text-gray-600 space-y-1">
                          <p><span className="font-semibold text-gray-700">Edited by:</span> {invoice.performedByName || 'Unknown'}</p>
                          <p><span className="font-semibold text-gray-700">Changed on:</span> {invoice.timestamp ? new Date(invoice.timestamp).toLocaleString('en-IN') : 'N/A'}</p>
                          {invoice.remarks && <p><span className="font-semibold text-gray-700">Note:</span> {invoice.remarks}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4 text-xs italic">No edited invoice dates found</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: PATIENT SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Patient Search Input */}
          <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white relative">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Search Patient Summary</h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-orange-400" />
              <input
                type="text"
                placeholder="Search patient by Patient Name, UHID or Mobile Number..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Dropdown Results overlay */}
            {searchResults.length > 0 && (
              <div className="absolute left-5 right-5 top-[95px] z-50 bg-white border border-orange-100 rounded-xl shadow-xl max-h-[300px] overflow-y-auto divide-y divide-orange-50 mt-1">
                {searchResults.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => handleSelectPatient(p._id)}
                    className="w-full text-left p-3 hover:bg-orange-50/50 flex items-center justify-between text-xs transition font-semibold"
                  >
                    <div>
                      <p className="text-gray-900 font-bold text-sm">{p.patientName}</p>
                      <p className="text-gray-500 mt-0.5">UHID: {p.uhid} | Mob: {p.mobile}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-orange-500" />
                  </button>
                ))}
              </div>
            )}

            {patientSearch.trim().length >= 2 && searchResults.length === 0 && (
              <p className="text-xs text-gray-400 mt-2 italic">Searching patients...</p>
            )}
          </div>

          {summaryLoading ? (
            <div className="space-y-6">
              <SkeletonCard className="w-full h-24" headerHeight="1.75rem" bodyLines={2} />
              <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                <SkeletonCard className="w-full h-96" headerHeight="2rem" bodyLines={6} />
                <SkeletonCard className="w-full h-96" headerHeight="2rem" bodyLines={6} />
              </div>
            </div>
          ) : !patientSummary ? (
            <div className="card overflow-hidden rounded-2xl border border-orange-100 shadow-sm bg-white">
              <div className="border-b border-orange-100 p-5 bg-gradient-to-r from-orange-50/50 to-white">
                <h2 className="font-bold text-gray-800 text-lg">Registered Patients ({filteredPatients.length})</h2>
              </div>
              {patientsLoading ? (
                <div className="space-y-4 p-5">
                  <SkeletonCard className="w-full h-32" headerHeight="1.5rem" bodyLines={3} />
                  <SkeletonCard className="w-full h-32" headerHeight="1.5rem" bodyLines={3} />
                  <SkeletonCard className="w-full h-32" headerHeight="1.5rem" bodyLines={3} />
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic">
                  No patients found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-orange-100/50 text-xs uppercase text-orange-950 font-bold">
                      <tr>
                        <th className="p-4">UHID</th>
                        <th className="p-4">Patient Name</th>
                        <th className="p-4">Mobile</th>
                        <th className="p-4">Gender</th>
                        <th className="p-4">Category</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((p) => (
                        <tr key={p._id} className="border-t border-orange-50/60 hover:bg-orange-50/10 transition duration-150">
                          <td className="p-4 font-semibold text-orange-600">{p.uhid}</td>
                          <td className="p-4 font-bold text-gray-900">{p.patientName}</td>
                          <td className="p-4 text-gray-600">{p.mobile}</td>
                          <td className="p-4 text-gray-600">{p.gender}</td>
                          <td className="p-4 text-gray-600">{p.category || 'General'}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleSelectPatient(p._id)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition"
                            >
                              View Summary
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => {
                  setPatientSummary(null);
                  setSelectedPatientId(null);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-xl transition"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Patient List
              </button>
              
              {/* Detailed Summary Dashboard */}
              <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* Side Demographics Panel */}
                <div className="space-y-4">
                  <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white text-xs space-y-4">
                    <div className="flex flex-col items-center border-b border-orange-100 pb-4 text-center">
                      <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-2xl uppercase shadow-inner">
                        {patientSummary.patient?.patientName?.charAt(0)}
                      </div>
                      <h4 className="font-extrabold text-gray-900 mt-3 text-base">{patientSummary.patient?.patientName}</h4>
                      <span className="mt-1 font-bold text-orange-700 bg-orange-100/50 px-2.5 py-0.5 rounded-full">
                        {patientSummary.patient?.uhid}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-orange-50 pb-1.5"><span className="text-gray-400 font-bold">Age</span><span className="font-semibold text-gray-800">{ageFromDob(patientSummary.patient?.dob)} Years</span></div>
                      <div className="flex justify-between border-b border-orange-50 pb-1.5"><span className="text-gray-400 font-bold">Gender</span><span className="font-semibold text-gray-800">{patientSummary.patient?.gender}</span></div>
                      <div className="flex justify-between border-b border-orange-50 pb-1.5"><span className="text-gray-400 font-bold">Mobile</span><span className="font-semibold text-gray-800">{patientSummary.patient?.mobile}</span></div>
                      <div className="flex justify-between border-b border-orange-50 pb-1.5"><span className="text-gray-400 font-bold">Aadhaar</span><span className="font-semibold text-gray-800">{patientSummary.patient?.aadhaar}</span></div>
                      <div className="flex justify-between border-b border-orange-50 pb-1.5"><span className="text-gray-400 font-bold">Category</span><span className="font-semibold text-gray-800">{patientSummary.patient?.category || 'General'}</span></div>
                      <div className="flex justify-between pb-0.5"><span className="text-gray-400 font-bold">Visits Count</span><span className="font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">{patientSummary.visitsCount} times</span></div>
                    </div>
                  </div>
                </div>

                {/* Main Content Dashboard */}
                <div className="space-y-6">
                  {/* Patient Treatment Activity Timeline card */}
                  <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white animate-fade-in">
                    <h3 className="font-bold text-gray-800 text-base border-b border-orange-100 pb-2 mb-3 flex items-center gap-1.5">
                      <Activity className="h-4.5 w-4.5 text-orange-500 animate-pulse" /> Patient Treatment Activity Timeline
                    </h3>
                    {!patientTrackingData || patientTrackingData.length === 0 ? (
                      <p className="text-gray-400 text-center py-3 text-xs italic">No activity logs found for this patient.</p>
                    ) : (
                      <div className="relative border-l-2 border-orange-200 ml-4 pl-6 space-y-6 py-2 max-h-[300px] overflow-y-auto">
                        {patientTrackingData.map((ev, idx) => (
                          <div key={idx} className="relative">
                            {/* Timeline Dot Indicator */}
                            <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 ring-4 ring-white shadow-sm">
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            </span>
                            <div className="text-xs">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="font-extrabold text-orange-950 uppercase tracking-wider text-[10px] bg-orange-100 px-2 py-0.5 rounded-md">
                                  {ev.type}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">
                                  {ev.date} at {ev.time}
                                </span>
                              </div>
                              <h4 className="font-bold text-gray-900 mt-1.5 text-sm">{ev.activity}</h4>
                              <p className="text-gray-600 mt-1 font-semibold leading-relaxed">{ev.description}</p>
                              <div className="mt-2 text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                <span>Performed by:</span>
                                <span className="text-gray-700 bg-orange-50 px-1.5 py-0.5 rounded">{ev.performedBy}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Diagnosis aggregated */}
                  <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white">
                    <h3 className="font-bold text-gray-800 text-base border-b border-orange-100 pb-2 mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-4.5 w-4.5 text-orange-500" /> Diagnosis History
                    </h3>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto">
                      {patientSummary.diagnoses?.map((diag, index) => (
                        <div key={index} className="border-l-4 border-orange-400 bg-orange-50/10 p-3 rounded-r-xl text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-900">{diag.source}</span>
                            <span className="text-[10px] text-gray-400">{new Date(diag.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-700 mt-1 font-semibold italic">"{diag.remarks}"</p>
                          <p className="text-[10px] text-gray-400 font-bold">Clinician: {diag.doctorName}</p>
                        </div>
                      ))}
                      {patientSummary.diagnoses?.length === 0 && (
                        <p className="text-gray-400 text-center py-3 text-xs italic">No diagnoses recorded for this patient</p>
                      )}
                    </div>
                  </div>

                  {/* Treatments list */}
                  <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white">
                    <h3 className="font-bold text-gray-800 text-base border-b border-orange-100 pb-2 mb-3 flex items-center gap-1.5">
                      <Activity className="h-4.5 w-4.5 text-indigo-500" /> Treatments & Admissions
                    </h3>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto">
                      {patientSummary.treatments?.ipdAdmissions?.map((ipd) => (
                        <div key={ipd._id} className="border border-indigo-100 p-3 rounded-xl text-xs flex justify-between items-center hover:bg-indigo-50/10 transition">
                          <div>
                            <p className="font-bold text-indigo-950">IPD Admission: {ipd.ipdNumber}</p>
                            <p className="text-[10px] text-gray-500">Admitted: {new Date(ipd.admissionDate).toLocaleDateString()} | Room: {ipd.roomId?.roomName || 'N/A'} - Bed: {ipd.bedId?.bedNumber || 'N/A'}</p>
                            <p className="text-[10px] text-gray-500">In Charge: Dr. {ipd.doctorInCharge?.doctorName || ipd.doctorInCharge?.username}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${ipd.status === 'Admitted' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                            {ipd.status}
                          </span>
                        </div>
                      ))}

                      {patientSummary.treatments?.sameDayTreatments?.map((sdt) => (
                        <div key={sdt._id} className="border border-amber-100 p-3 rounded-xl text-xs flex justify-between items-center hover:bg-amber-50/10 transition">
                          <div>
                            <p className="font-bold text-amber-950">Same Day Care ({sdt.treatmentType})</p>
                            <p className="text-[10px] text-gray-500">Date: {new Date(sdt.treatmentDate).toLocaleDateString()}</p>
                            {sdt.treatmentNotes && <p className="text-[10px] text-gray-600 mt-1 italic">Notes: {sdt.treatmentNotes}</p>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${sdt.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {sdt.status}
                          </span>
                        </div>
                      ))}

                      {patientSummary.treatments?.ipdAdmissions?.length === 0 && patientSummary.treatments?.sameDayTreatments?.length === 0 && (
                        <p className="text-gray-400 text-center py-3 text-xs italic">No IPD admissions or Same Day Care records found</p>
                      )}
                    </div>
                  </div>

                  {/* Medicines with Pricing */}
                  <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white">
                    <h3 className="font-bold text-gray-800 text-base border-b border-orange-100 pb-2 mb-3 flex items-center gap-1.5">
                      <Pill className="h-4.5 w-4.5 text-emerald-500" /> Billed Medicines & Pricing
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-orange-50 bg-white">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead className="bg-orange-50 text-orange-950 uppercase font-bold">
                          <tr>
                            <th className="p-3">Medicine</th>
                            <th className="p-3">Source</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Unit Price</th>
                            <th className="p-3 text-right">Total Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientSummary.medicines?.map((med, index) => (
                            <tr key={index} className="border-t border-orange-50 hover:bg-orange-50/10">
                              <td className="p-3 font-semibold text-gray-800">{med.name}</td>
                              <td className="p-3 text-gray-500">{med.source}</td>
                              <td className="p-3 text-gray-400">{new Date(med.date).toLocaleDateString()}</td>
                              <td className="p-3 font-bold text-gray-600">{med.quantity}</td>
                              <td className="p-3 text-gray-500">₹{med.unitPrice?.toFixed(2)}</td>
                              <td className="p-3 text-right font-bold text-emerald-700">₹{med.totalPrice?.toFixed(2)}</td>
                            </tr>
                          ))}
                          {patientSummary.medicines?.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-gray-400 italic">No medicine invoices found for this patient</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Prescriptions list */}
                  <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white">
                    <h3 className="font-bold text-gray-800 text-base border-b border-orange-100 pb-2 mb-3 flex items-center gap-1.5">
                      <FileText className="h-4.5 w-4.5 text-orange-500" /> Prescriptions History
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {patientSummary.prescriptions?.map((pres) => (
                        <div key={pres._id} className="border border-orange-100 bg-orange-50/5 p-3.5 rounded-xl text-xs space-y-3">
                          <div className="flex justify-between items-center border-b border-orange-50 pb-1.5">
                            <span className="font-bold text-orange-850">Prescription from Dr. {pres.doctorId?.doctorName || pres.doctorId?.username}</span>
                            <span className="text-[10px] text-gray-400">{new Date(pres.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="space-y-2">
                            {pres.medicines?.map((med, idx) => (
                              <div key={idx} className="flex justify-between bg-white border border-orange-50/50 p-2 rounded-lg text-[11px] font-semibold text-gray-700">
                                <span className="font-bold text-gray-900">{med.medicine}</span>
                                <span>{med.duration} | {med.morning ? 'Morning ' : ''}{med.afternoon ? 'Afternoon ' : ''}{med.night ? 'Night' : ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {patientSummary.prescriptions?.length === 0 && (
                        <p className="text-gray-400 text-center py-3 text-xs italic">No prescriptions found</p>
                      )}
                    </div>
                  </div>

                  {/* Lab requests & reports */}
                  <div className="card p-5 border border-orange-100 shadow-sm rounded-2xl bg-white">
                    <h3 className="font-bold text-gray-800 text-base border-b border-orange-100 pb-2 mb-3 flex items-center gap-1.5">
                      <ClipboardList className="h-4.5 w-4.5 text-blue-500" /> Lab Tests & Results
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {patientSummary.tests?.labRequests?.map((req) => (
                        <div key={req._id} className="border border-blue-100 p-3 rounded-xl text-xs space-y-2 hover:bg-blue-50/10 transition">
                          <div className="flex justify-between">
                            <span className="font-bold text-blue-900">Lab ID: {req.labId}</span>
                            <span className="text-[10px] text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-gray-800">Tests: {req.tests?.join(', ')}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500">Ref: Dr. {req.doctorId?.doctorName || req.doctorId?.username}</span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${req.reportStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              Report: {req.reportStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                      {patientSummary.tests?.labRequests?.length === 0 && (
                        <p className="text-gray-400 text-center py-3 text-xs italic">No lab tests found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INVOICES DATE EDITOR */}
      {activeTab === 'invoices' && (
        <AdminInvoiceEditor />
      )}

      {/* Patient Tracking Timeline Modal */}
      {selectedTrackingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[85vh] border border-orange-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-orange-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-white">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-500 animate-pulse" /> Patient Treatment Activity Timeline
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Tracking logs for <span className="font-bold text-gray-800">{selectedTrackingPatient.patientName}</span> (UHID: <span className="font-bold text-orange-700 bg-orange-100/50 px-1.5 py-0.5 rounded">{selectedTrackingPatient.uhid}</span>)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrackingPatient(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-orange-50/10">
              {trackingDetailsLoading ? (
                <div className="text-center py-12 text-gray-500 font-semibold flex flex-col items-center gap-3">
                  <Activity className="h-8 w-8 text-orange-500 animate-spin" />
                  <span>Compiling patient clinical history and activity tracking logs...</span>
                </div>
              ) : !patientTrackingData || patientTrackingData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">
                  No tracking logs found for this patient.
                </div>
              ) : (
                <div className="relative border-l-2 border-orange-200 ml-4 pl-6 space-y-6 py-2">
                  {patientTrackingData.map((ev, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot Indicator */}
                      <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 ring-4 ring-white shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      <div className="text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-extrabold text-orange-950 uppercase tracking-wider text-[10px] bg-orange-100 px-2 py-0.5 rounded-md">
                            {ev.type}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            {ev.date} at {ev.time}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 mt-1.5 text-sm">{ev.activity}</h4>
                        <p className="text-gray-600 mt-1 font-semibold leading-relaxed">{ev.description}</p>
                        <div className="mt-2 text-[10px] text-gray-400 font-bold flex items-center gap-1">
                          <span>Performed by:</span>
                          <span className="text-gray-700 bg-orange-50 px-1.5 py-0.5 rounded">{ev.performedBy}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-orange-100 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTrackingPatient(null)}
                className="btn-secondary px-5 py-2 text-xs font-bold rounded-xl"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
