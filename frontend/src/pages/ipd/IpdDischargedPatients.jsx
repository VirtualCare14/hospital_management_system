import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  User,
  RefreshCw,
  Eye,
  Stethoscope,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Bed,
  Phone,
  CalendarDays,
  Users,
  Syringe,
  CheckCircle,
  DoorOpen,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHeader } from '../../context/HeaderContext';
import client from '../../api/client';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import PaginationFooter from '../../components/PaginationFooter';
import { formatUhid } from '../../utils/uhid';
import { formatDateIST } from '../../utils/dateFormat';

const IpdDischargedPatients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    roomType: '',
    bedType: '',
    fromDate: '',
    toDate: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Room types and bed types for filters
  const [roomTypes, setRoomTypes] = useState([]);
  const [bedTypes, setBedTypes] = useState([]);

  const loadAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('status', 'Discharged'); // Exclusively fetch discharged patients
      if (filters.roomType) params.append('roomType', filters.roomType);
      if (filters.bedType) params.append('bedType', filters.bedType);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      params.append('page', currentPage);
      params.append('limit', pageSize);

      const { data } = await client.get(`/ipd/patients?${params.toString()}`);
      if (Array.isArray(data)) {
        setAdmissions(data);
        setFilteredAdmissions(data);
        setTotalRecords(data.length);
        setTotalPages(1);
      } else {
        setAdmissions(data.admissions || []);
        setFilteredAdmissions(data.admissions || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load discharged patient list');
      setAdmissions([]);
      setFilteredAdmissions([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, currentPage, pageSize]);

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
    setFilters({ roomType: '', bedType: '', fromDate: '', toDate: '' });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewPatient = (admission) => {
    navigate(`/ipd/patient/${admission._id}`);
  };

  const handleViewServices = (admission) => {
    navigate(`/ipd/patient/${admission._id}?tab=services`);
  };

  const handleDischarge = (admission) => {
    navigate(`/ipd/discharge/${admission._id}?view=true`);
  };

  useHeader({ onRefresh: loadAdmissions });

  return (
    <div className="space-y-6">
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
                <th className="p-3">Last Assigned Room / Bed</th>
                <th className="p-3">Admission Date</th>
                <th className="p-3">Discharge Date</th>
                <th className="p-3 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8">
                    <SkeletonTable rows={4} columns={10} className="w-full" />
                  </td>
                </tr>
              ) : filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <User className="h-10 w-10" />
                      <p className="font-bold text-gray-500">No discharged patients found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdmissions.map((admission) => {
                  const patient = admission.patientId || {};
                  return (
                    <tr
                      key={admission._id}
                      className="hover:bg-orange-50/30 transition-all bg-gray-50/40 text-gray-500"
                    >
                      <td className="p-3 pl-4">
                        <button
                          type="button"
                          onClick={() => handleViewPatient(admission)}
                          className="flex items-center gap-2 text-left group bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                          title="Click to view full patient details"
                        >
                          <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors">
                            <User className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                          </div>
                          <span className="font-bold text-gray-600 group-hover:text-orange-600 group-hover:underline transition-colors">
                            {patient.patientName || 'N/A'}
                          </span>
                        </button>
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
                        {admission.roomId ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700">{admission.roomId.roomType}</span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              <Bed className="h-3 w-3 inline mr-0.5 text-gray-400" />
                              {admission.bedId?.bedNumber || 'N/A'} ({admission.bedId?.bedType})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        <CalendarDays className="h-3 w-3 inline mr-1 text-gray-400" />
                        {formatDateIST(admission.admissionDate)}
                      </td>
                      <td className="p-3 text-xs">
                        <CalendarDays className="h-3 w-3 inline mr-1 text-gray-400" />
                        {admission.dischargeDate
                          ? formatDateIST(admission.dischargeDate)
                          : '-'
                        }
                      </td>
                      <td className="p-3 pr-4 text-center relative action-menu-container">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === admission._id ? null : admission._id);
                          }}
                          className="p-1.5 hover:bg-orange-100/70 text-gray-700 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-sm inline-flex items-center justify-center cursor-pointer"
                          title="Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === admission._id && (
                          <div className="absolute right-3 top-10 z-30 w-48 bg-white rounded-2xl shadow-xl border border-orange-100 py-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleViewPatient(admission);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600" /> View Details
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleViewServices(admission);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                            >
                              <Syringe className="h-3.5 w-3.5 text-purple-600" /> IPD Services
                            </button>

                            <div className="border-t border-orange-50 my-1"></div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleDischarge(admission);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" /> Discharge Summary
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={totalRecords}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setCurrentPage(1);
          }}
          loading={loading}
          itemLabel="patients"
        />
      </div>
    </div>
  );
};

export default IpdDischargedPatients;
