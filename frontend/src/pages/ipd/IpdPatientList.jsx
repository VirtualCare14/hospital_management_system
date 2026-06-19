import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  User,
  RefreshCw,
  Eye,
  FileText,
  CreditCard,
  Stethoscope,
  Clock,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Building2,
  Bed,
  Phone,
  CalendarDays,
  Loader2,
  Users,
  Syringe,
  Pill,
  Scissors,
  DoorOpen,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const statusColors = {
  'Admitted': 'bg-red-100 text-red-800',
  'Under Observation': 'bg-yellow-100 text-yellow-800',
  'Shifted': 'bg-blue-100 text-blue-800',
  'Discharged': 'bg-gray-200 text-gray-800'
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold leading-tight ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
    {status !== 'Discharged' && <Clock className="h-3 w-3" />}
    {status}
  </span>
);

const IpdPatientList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    roomType: '',
    bedType: '',
    fromDate: '',
    toDate: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(15);

  // Room types and bed types for filters
  const [roomTypes, setRoomTypes] = useState([]);
  const [bedTypes, setBedTypes] = useState([]);

  const loadAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.status) params.append('status', filters.status);
      if (filters.roomType) params.append('roomType', filters.roomType);
      if (filters.bedType) params.append('bedType', filters.bedType);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const { data } = await client.get(`/ipd/patients?${params.toString()}`);
      setAdmissions(data);
      setFilteredAdmissions(data);
    } catch (err) {
      toast.error('Failed to load IPD patient list');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  const loadFilterOptions = async () => {
    try {
      const { data: rooms } = await client.get('/rooms');
      const types = [...new Set(rooms.map(r => r.roomType))];
      setRoomTypes(types);
      const bTypes = [];
      rooms.forEach(r => {
        r.bedConfigurations?.forEach(c => {
          if (!bTypes.includes(c.bedType)) bTypes.push(c.bedType);
        });
      });
      setBedTypes(bTypes);
    } catch (err) {
      console.warn('Could not load room types:', err.message);
    }
  };

  useEffect(() => {
    loadAdmissions();
    loadFilterOptions();
  }, []);

  // Re-filter when search or filters change
  useEffect(() => {
    let results = [...admissions];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(a => {
        const patient = a.patientId || {};
        return (
          (patient.patientName || '').toLowerCase().includes(q) ||
          (patient.uhid || '').toLowerCase().includes(q) ||
          (patient.mobile || '').includes(q) ||
          (a.ipdNumber || '').toLowerCase().includes(q) ||
          (a.pidNumber || '').toLowerCase().includes(q)
        );
      });
    }

    if (filters.status) {
      results = results.filter(a => a.status === filters.status);
    }
    if (filters.roomType) {
      results = results.filter(a => a.roomId?.roomType === filters.roomType);
    }
    if (filters.bedType) {
      results = results.filter(a => a.bedId?.bedType === filters.bedType);
    }
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      results = results.filter(a => new Date(a.admissionDate) >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      to.setHours(23, 59, 59, 999);
      results = results.filter(a => new Date(a.admissionDate) <= to);
    }

    setFilteredAdmissions(results);
    setCurrentPage(1);
  }, [admissions, searchQuery, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadAdmissions();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters({ status: '', roomType: '', bedType: '', fromDate: '', toDate: '' });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Pagination
  const totalPages = Math.ceil(filteredAdmissions.length / rowsPerPage);
  const paginatedData = filteredAdmissions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleViewPatient = (admission) => {
    navigate(`/ipd/patient/${admission._id}`);
  };

  const handleViewServices = (admission) => {
    navigate(`/ipd/patient/${admission._id}?tab=services`);
  };

  const handleViewBilling = (admission) => {
    navigate(`/ipd/patient/${admission._id}?tab=billing`);
  };

  const handleOpenOt = (admission) => {
    // Open OT Workflow page - starts with consultation form first, not operative report
    navigate(`/ipd/ot-flow/${admission._id}`);
  };

  const handleDischarge = (admission) => {
    if (admission.status === 'Discharged') {
      navigate(`/ipd/discharge/${admission._id}?view=true`);
    } else {
      navigate(`/ipd/discharge/${admission._id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">IPD Patient List</h1>
          <p className="text-sm text-gray-500">View and manage all admitted IPD patients</p>
        </div>
        <button onClick={loadAdmissions} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
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
          <button type="submit" className="btn py-2.5 px-6">
            <Search className="h-4 w-4" /> Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary py-2.5 px-4 ${showFilters ? 'bg-orange-50 border-orange-300' : ''}`}
          >
            <Filter className="h-4 w-4" /> Filters {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-orange-100">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Status</label>
              <select
                className="input py-2 text-xs"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Admitted">Admitted</option>
                <option value="Under Observation">Under Observation</option>
                <option value="Shifted">Shifted</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Room Type</label>
              <select
                className="input py-2 text-xs"
                value={filters.roomType}
                onChange={(e) => handleFilterChange('roomType', e.target.value)}
              >
                <option value="">All Rooms</option>
                {roomTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Bed Type</label>
              <select
                className="input py-2 text-xs"
                value={filters.bedType}
                onChange={(e) => handleFilterChange('bedType', e.target.value)}
              >
                <option value="">All Bed Types</option>
                {bedTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">From</label>
                <input
                  type="date"
                  className="input py-2 text-xs"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">To</label>
                <input
                  type="date"
                  className="input py-2 text-xs"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end col-span-full sm:col-span-1">
              <button
                type="button"
                onClick={handleClearSearch}
                className="btn-secondary py-2 text-xs w-full"
              >
                <X className="h-3 w-3" /> Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patient Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span className="font-bold">{filteredAdmissions.length}</span> patients found
          {filteredAdmissions.length !== admissions.length && (
            <span className="text-gray-400">(filtered from {admissions.length})</span>
          )}
        </div>
        {totalPages > 1 && (
          <span className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Patient Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3 pl-4">Patient</th>
                <th className="p-3">UHID</th>
                <th className="p-3">PID / IPD No.</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Consultant</th>
                <th className="p-3">Room / Bed</th>
                <th className="p-3">Admission Date</th>
                <th className="p-3">Status / Discharge Date</th>
                <th className="p-3 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading patients...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <User className="h-10 w-10" />
                      <p className="font-bold text-gray-500">No patients found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((admission) => {
                  const patient = admission.patientId || {};
                  return (
                    <tr
                      key={admission._id}
                      className={`hover:bg-orange-50/30 transition-all ${
                        admission.status === 'Discharged' ? 'bg-gray-50/40 text-gray-500' : 'bg-white'
                      }`}
                    >
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${admission.status === 'Discharged' ? 'bg-gray-100' : 'bg-orange-100'}`}>
                            <User className={`h-4 w-4 ${admission.status === 'Discharged' ? 'text-gray-400' : 'text-orange-600'}`} />
                          </div>
                          <span className={`font-bold ${admission.status === 'Discharged' ? 'text-gray-600' : 'text-gray-900'}`}>
                            {patient.patientName || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-orange-700 text-xs font-bold">
                          {formatUhid(patient.uhid) || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-xs font-bold text-gray-700">{admission.pidNumber || 'N/A'}</span>
                        <span className="block text-[10px] text-gray-400">IPD: {admission.ipdNumber || 'N/A'}</span>
                      </td>
                      <td className="p-3 text-xs">{patient.gender || 'N/A'}</td>
                      <td className="p-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {patient.mobile || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3 text-gray-400" />
                          <span>Dr. {admission.doctorInCharge?.doctorName || admission.doctorInCharge?.username || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700">{admission.roomId?.roomType || 'N/A'}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            <Bed className="h-3 w-3 inline mr-0.5" />
                            {admission.bedId?.bedNumber || 'N/A'} (₹{admission.bedId?.pricePerDay || 0}/day)
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        <CalendarDays className="h-3 w-3 inline mr-1 text-gray-400" />
                        {new Date(admission.admissionDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-start">
                          {admission.status === 'Discharged' ? (
                            <span className="text-xs text-gray-500">
                              {admission.dischargeDate
                                ? new Date(admission.dischargeDate).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })
                                : '-'
                              }
                            </span>
                          ) : (
                            <StatusBadge status={admission.status} />
                          )}
                          {admission.otStatus === 'In Progress' && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase bg-red-100 text-red-700 animate-pulse border border-red-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                              OT is going on
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 pr-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewPatient(admission)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Patient"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewServices(admission)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Open Services"
                          >
                            <Syringe className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewBilling(admission)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Billing Summary"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenOt(admission)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Open OT Form"
                          >
                            <Scissors className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDischarge(admission)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              admission.status === 'Discharged'
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title={admission.status === 'Discharged' ? 'View Discharge Summary' : 'Discharge Patient'}
                          >
                            {admission.status === 'Discharged' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <DoorOpen className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between p-4 border-t border-orange-100 bg-orange-50/20">
            <span className="text-xs text-gray-500">
              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredAdmissions.length)} of {filteredAdmissions.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                      currentPage === pageNum
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-orange-200 hover:bg-orange-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IpdPatientList;