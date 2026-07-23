import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Droplets, Search, User, Loader2, Eye,
  Plus, CalendarDays, Phone, Clock, FileText,
  RefreshCw, Trash2, Filter, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const DialysisWorkspace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('records'); // 'records' or 'patients'
  
  // Records state
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  
  // Patients lookup state
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  // Search & Filter parameters
  const [searchVal, setSearchVal] = useState(''); // Patient search (Name, UHID, Mobile)
  const [physicianName, setPhysicianName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Lookup patient search query
  const [patientLookupSearch, setPatientLookupSearch] = useState('');

  // Role permissions checks
  const canCreate = ['admin', 'doctor', 'nursing'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      const params = new URLSearchParams();
      if (searchVal) params.append('search', searchVal);
      if (physicianName) params.append('physicianName', physicianName);
      if (statusFilter) params.append('status', statusFilter);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const { data } = await client.get(`/same-day-care/dialysis/records?${params.toString()}`);
      setRecords(data || []);
    } catch (err) {
      toast.error('Failed to load dialysis records');
    } finally {
      setLoadingRecords(false);
    }
  };

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const url = patientLookupSearch 
        ? `/same-day-care/dialysis/patients?search=${encodeURIComponent(patientLookupSearch)}`
        : '/same-day-care/dialysis/patients';
      const { data } = await client.get(url);
      setPatients(data || []);
    } catch (err) {
      toast.error('Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'records') {
      loadRecords();
    } else {
      loadPatients();
    }
  }, [activeTab]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadRecords();
  };

  const handleClearFilters = () => {
    setSearchVal('');
    setPhysicianName('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setTimeout(() => loadRecords(), 0);
  };

  const handlePatientSearchSubmit = (e) => {
    e.preventDefault();
    loadPatients();
  };

  const handleDeleteRecord = async (id, patientName) => {
    if (!window.confirm(`Are you sure you want to delete the dialysis record of ${patientName}?`)) {
      return;
    }
    try {
      await client.delete(`/same-day-care/dialysis/record/${id}`);
      toast.success('Record deleted successfully');
      loadRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 text-white p-2.5 rounded-2xl shadow-md shadow-sky-500/20">
            <Droplets className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dialysis Management</h1>
            <p className="text-sm text-gray-500">Individual Dialysis Records & Clinical Tracking</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'records' ? (
            <button onClick={loadRecords} className="btn-secondary text-sm py-2 px-4 font-bold flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh List
            </button>
          ) : (
            <button onClick={loadPatients} className="btn-secondary text-sm py-2 px-4 font-bold flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh Patients
            </button>
          )}
          {canCreate && activeTab !== 'patients' && (
            <button onClick={() => setActiveTab('patients')} className="btn text-sm py-2 px-4 font-bold flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Dialysis Record
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-orange-50/50 p-1 rounded-xl border border-orange-100 w-fit">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'records' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
          }`}
        >
          <FileText className="h-4 w-4" /> Previous Dialysis Records
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'patients' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
          }`}
        >
          <User className="h-4 w-4" /> Patients Lookup (Create New)
        </button>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* Filters Form */}
          <div className="card p-5 border border-orange-100">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-orange-500" /> Search & Filters
            </h3>
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Patient Details</label>
                <input
                  type="text"
                  className="input py-2 text-xs"
                  placeholder="Name, UHID, or Mobile"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Physician Name</label>
                <input
                  type="text"
                  className="input py-2 text-xs"
                  placeholder="Doctor name"
                  value={physicianName}
                  onChange={(e) => setPhysicianName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Status</label>
                <select
                  className="input py-2 text-xs"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  className="input py-1.5 text-xs"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  className="input py-1.5 text-xs"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2 items-end">
                <button type="submit" className="btn py-2 px-4 text-xs font-bold flex-1">
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn-secondary py-2 px-3 text-xs font-bold"
                  title="Clear Filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Records Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-orange-100 bg-orange-50/30">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-sky-500" /> Dialysis Record History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                    <th className="p-3 pl-4">Record Date</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">UHID</th>
                    <th className="p-3">Physician</th>
                    <th className="p-3 text-center">Sessions</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {loadingRecords ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center">
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-orange-500" /> Loading dialysis records...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">
                        <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50 text-sky-400 animate-pulse" />
                        <p className="font-bold">No dialysis records found</p>
                        <p className="text-xs">Adjust your search filters or start a new record.</p>
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => (
                      <tr key={rec._id} className="hover:bg-orange-50/20">
                        <td className="p-3 pl-4 text-xs font-semibold text-gray-700">
                          {new Date(rec.treatmentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-gray-955 block">{rec.patientName}</span>
                          <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                            {rec.source === 'Doctor Referral' 
                              ? `Referred by: Dr. ${rec.referredByDoctorName || 'Doctor'}` 
                              : `Registered by: ${rec.createdBy?.doctorName || rec.createdBy?.username || 'Receptionist'}`}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs font-bold text-orange-700">{formatUhid(rec.uhid)}</td>
                        <td className="p-3 text-xs">
                          <div>{rec.physicianName || 'N/A'}</div>
                          <div className="text-[10px] text-gray-400">{rec.physicianContact}</div>
                        </td>
                        <td className="p-3 text-center font-bold text-xs text-sky-600">
                          {rec.dialysisSessions?.length || 0}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            rec.status === 'Completed' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-250'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/same-day-care/dialysis/treatment/${rec.patientId}?recordId=${rec._id}&view=true`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          
                          {canCreate && (
                            <button
                              onClick={() => navigate(`/same-day-care/dialysis/treatment/${rec.patientId}?recordId=${rec._id}`)}
                              className="btn-secondary text-xs py-1 px-2.5 font-semibold"
                              title="Edit Record"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteRecord(rec._id, rec.patientName)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Patient Selection Lookup */
        <>
          <div className="card p-4 border border-orange-100">
            <form onSubmit={handlePatientSearchSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="input pl-9 py-2.5 text-sm"
                  placeholder="Search patients by name, UHID, or mobile..."
                  value={patientLookupSearch}
                  onChange={(e) => setPatientLookupSearch(e.target.value)}
                />
                {patientLookupSearch && (
                  <button
                    type="button"
                    onClick={() => { setPatientLookupSearch(''); setTimeout(() => loadPatients(), 0); }}
                    className="absolute right-2 top-2.5 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button type="submit" className="btn py-2.5 px-6 flex items-center gap-2 text-sm font-bold">
                <Search className="h-4 w-4" /> Search
              </button>
            </form>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-orange-100 bg-orange-50/30">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" /> All Registered Patients
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                    <th className="p-3 pl-4">Patient Name</th>
                    <th className="p-3">UHID</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Date of Birth</th>
                    <th className="p-3 pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {loadingPatients ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center">
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-orange-500" /> Loading patients database...
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-bold">No patients found</p>
                        <p className="text-xs">Try a different search query or register the patient at reception first.</p>
                      </td>
                    </tr>
                  ) : (
                    patients.map((p) => (
                      <tr key={p._id} className="hover:bg-orange-50/20">
                        <td className="p-3 pl-4">
                          <span className="font-bold text-gray-955 block">{p.patientName}</span>
                          {p.registeredBy && p.registeredBy !== 'N/A' && (
                            <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                              Registered by: <span className="capitalize text-orange-600">{p.registeredBy}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs font-bold text-orange-700">{formatUhid(p.uhid)}</td>
                        <td className="p-3 text-xs">{p.mobile}</td>
                        <td className="p-3 text-xs">{p.gender}</td>
                        <td className="p-3 text-xs">
                          {p.dob ? new Date(p.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-3 pr-4 text-center">
                          <button
                            onClick={() => navigate(`/same-day-care/dialysis/treatment/${p._id}`)}
                            className="btn text-xs py-1.5 px-3 flex items-center gap-1 mx-auto"
                          >
                            <Plus className="h-3.5 w-3.5" /> Start Dialysis Record
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
    </div>
  );
};

export default DialysisWorkspace;
