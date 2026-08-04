import { useEffect, useRef, useState } from 'react';
import { Eye, Printer, Search, Trash2, X, Calendar, Hash, Users, FileText, Clock, Filter, ChevronDown, ChevronLeft, ChevronRight, Copy, Pencil, Save, MoreVertical, CalendarCheck, CheckCircle, History } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { useHeader } from '../../context/HeaderContext';
import PatientReceipt from '../../components/PatientReceipt';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import { formatUhid } from '../../utils/uhid';

const DEPARTMENTS = ['General', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Dermatology', 'ENT', 'Ophthalmology', 'Psychiatry'];

// Helper to generate pagination page numbers with ellipsis
const getPaginationRange = (currentPage, totalPages) => {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  let l;
  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
};

const PatientList = () => {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ previousCount: 0, todayCount: 0, upcomingCount: 0, completedCount: 0, totalFiltered: 0 });
  const [loading, setLoading] = useState(false);
  const [quickFilter, setQuickFilter] = useState('all'); // all | previous | today | upcoming | completed

  // Server-Side Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Hospital settings (for payment due display permission)
  const [receptionSeePatientDue, setReceptionSeePatientDue] = useState(false);

  useEffect(() => {
    client.get('/admin/hospital-settings')
      .then(({ data }) => {
        if (data?.exists && data?.data) {
          setReceptionSeePatientDue(Boolean(data.data.receptionSeePatientDue));
        }
      })
      .catch((err) => {
        console.error('Error fetching hospital settings in PatientList:', err);
      });
  }, []);

  // Active Action Menu
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

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterUhid, setFilterUhid] = useState('');
  const [filterRegNo, setFilterRegNo] = useState('');
  const [filterPatientName, setFilterPatientName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = Boolean(
    fromDate || toDate || filterUhid || filterRegNo || filterPatientName || filterDepartment
  );

  // Visit history modal
  const [historyModal, setHistoryModal] = useState(null); // null = closed, { uhid, patientName } = open
  const [visitHistory, setVisitHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit patient modal
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({
    patientName: '',
    mobile: '',
    aadhaar: '',
    dob: '',
    gender: 'Male',
    address: '',
    category: 'General'
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Follow Up modal
  const [followUpModal, setFollowUpModal] = useState(null);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [followUpRemarksInput, setFollowUpRemarksInput] = useState('');
  const [noFollowUpCheck, setNoFollowUpCheck] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Receipt
  const [patientDetails, setPatientDetails] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (quickFilter && quickFilter !== 'all') {
        params.filter = quickFilter;
      }
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (filterUhid) params.uhid = filterUhid;
      if (filterRegNo) params.registrationNumber = filterRegNo;
      if (filterPatientName) params.patientName = filterPatientName;
      if (filterDepartment) params.department = filterDepartment;

      const { data } = await client.get('/patients/registrations/list', { params });
      setRegistrations(data.registrations || []);
      setStats(data.stats || { previousCount: 0, todayCount: 0, upcomingCount: 0, completedCount: 0, totalFiltered: 0 });
      setTotalRecords(data.totalRecords ?? data.total ?? 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Fetch registrations error:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 whenever search filters or quickFilter change
  useEffect(() => {
    setCurrentPage(1);
  }, [quickFilter, fromDate, toDate, filterUhid, filterRegNo, filterPatientName, filterDepartment]);

  // Fetch registrations on filter, page or page size change
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRegistrations();
    }, 300);
    return () => clearTimeout(timeout);
  }, [currentPage, pageSize, quickFilter, fromDate, toDate, filterUhid, filterRegNo, filterPatientName, filterDepartment]);

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterUhid('');
    setFilterRegNo('');
    setFilterPatientName('');
    setFilterDepartment('');
  };

  const handleDeletePatient = async (patientId) => {
    const ok = window.confirm('Delete patient and all related records? This cannot be undone.');
    if (!ok) return;
    try {
      await client.delete(`/patients/${patientId}`);
      toast.success('Patient deleted successfully');
      fetchRegistrations();
    } catch (error) {
      toast.error('Error deleting patient');
    }
  };

  const openVisitHistory = async (uhid, patientName) => {
    setHistoryModal({ uhid, patientName });
    setLoadingHistory(true);
    try {
      const { data } = await client.get(`/patients/registrations/history/${encodeURIComponent(uhid)}`);
      setVisitHistory(data.visits || data || []);
    } catch (error) {
      console.error('Visit history error:', error);
      setVisitHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenEditModal = async (reg) => {
    setEditModal(reg);
    setLoadingEdit(true);
    try {
      const { data } = await client.get(`/patients/${reg.patientId}`);
      setEditForm({
        patientName: data.patientName || reg.patientName || '',
        mobile: data.mobile || reg.mobile || '',
        aadhaar: data.aadhaar || reg.aadhaar || '',
        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
        gender: data.gender || reg.gender || 'Male',
        address: data.address || '',
        category: data.category || 'General'
      });
    } catch (err) {
      setEditForm({
        patientName: reg.patientName || '',
        mobile: reg.mobile || '',
        aadhaar: reg.aadhaar || '',
        dob: '',
        gender: reg.gender || 'Male',
        address: '',
        category: 'General'
      });
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSaveEdit = async (andPrint = false) => {
    if (!editForm.patientName || !editForm.mobile || !editForm.gender) {
      toast.error('Please fill all required patient details.');
      return;
    }
    setSavingEdit(true);
    try {
      await client.put(`/patients/${editModal.patientId}`, {
        ...editForm,
        visitId: editModal._id
      });
      toast.success('Patient details updated successfully!');
      const updatedReg = {
        ...editModal,
        patientName: editForm.patientName,
        mobile: editForm.mobile,
        aadhaar: editForm.aadhaar,
        gender: editForm.gender
      };
      await fetchRegistrations();
      setEditModal(null);

      if (andPrint) {
        printPatientReceipt(updatedReg);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient details');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenFollowUpModal = (reg) => {
    setFollowUpModal(reg);
    setFollowUpDateInput(reg.followUpDate ? new Date(reg.followUpDate).toISOString().split('T')[0] : '');
    setFollowUpRemarksInput(reg.followUpRemarks || '');
    setNoFollowUpCheck(!reg.followUpDate);
  };

  const handleSaveFollowUpDate = async () => {
    if (!noFollowUpCheck && !followUpDateInput) {
      toast.error('Please select a follow-up date or check "No Follow Up"');
      return;
    }
    setSavingFollowUp(true);
    try {
      await client.put(`/patients/registrations/${followUpModal._id}/follow-up`, {
        followUpDate: noFollowUpCheck ? null : followUpDateInput,
        followUpRemarks: noFollowUpCheck ? '' : followUpRemarksInput,
        noFollowUp: noFollowUpCheck
      });
      toast.success('Follow-up date updated successfully');
      setFollowUpModal(null);
      fetchRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update follow-up date');
    } finally {
      setSavingFollowUp(false);
    }
  };

  const [printMode, setPrintMode] = useState('patient_slip');

  const openPrintModal = async (reg) => {
    try {
      const { data } = await client.get(`/patients/${reg.patientId}`);
      // Merge specific registration/visit details from reg onto patient object
      const fullDetails = {
        ...data,
        doctorId: { doctorName: reg.doctorName, username: reg.doctorName },
        department: reg.department || data.department,
        registrationNumber: reg.registrationNumber || data.registrationNumber,
        appointmentNumber: reg.appointmentNumber || data.appointmentNumber,
        appointmentDate: reg.appointmentDate || data.appointmentDate,
        slot: reg.slot || data.slot,
        opdFee: reg.opdFee !== undefined ? reg.opdFee : (data.opdFee || 0),
        discountType: reg.discountType || data.discountType || 'none',
        discountValue: reg.discountValue !== undefined ? reg.discountValue : (data.discountValue || 0),
        discountAmount: reg.discountAmount !== undefined ? reg.discountAmount : (data.discountAmount || 0),
        netOpdFee: reg.netOpdFee !== undefined ? reg.netOpdFee : (data.netOpdFee || 0),
        paymentStatus: reg.paymentStatus || data.paymentStatus || 'Paid',
        paymentMode: reg.paymentMode || data.paymentMode || 'Cash',
        billNumber: reg.billNumber || data.billNumber || null
      };
      setPatientDetails(fullDetails);
      setPrintMode('patient_slip');
      setShowReceipt(true);
    } catch (error) {
      toast.error('Error loading patient documents');
    }
  };

  const handlePrintDocument = async (modeToPrint) => {
    setPrintMode(modeToPrint);
    setTimeout(async () => {
      if (receiptRef.current) {
        try {
          const canvas = await html2canvas(receiptRef.current, {
            scale: 2, useCORS: true, backgroundColor: '#ffffff', imageTimeout: 20000
          });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.autoPrint();
          window.open(pdf.output('bloburl'), '_blank');
        } catch (error) {
          toast.error('Error printing document. Please try again.');
        }
      }
    }, 150);
  };

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFirstDayOfMonthStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const filterByToday = () => {
    const today = getTodayStr();
    setFromDate(today);
    setToDate(today);
  };

  const filterByMonth = () => {
    const firstDay = getFirstDayOfMonthStr();
    const today = getTodayStr();
    setFromDate(firstDay);
    setToDate(today);
  };

  const filterByAll = () => {
    setFromDate('');
    setToDate('');
  };

  const [hoveredBox, setHoveredBox] = useState(null);

  const todayStr = getTodayStr();
  const firstDayStr = getFirstDayOfMonthStr();

  const isTodayActive = fromDate === todayStr && toDate === todayStr;
  const isMonthActive = fromDate === firstDayStr && (toDate === todayStr || !toDate);
  const isAllActive = !fromDate && !toDate;

  useHeader({ onRefresh: fetchRegistrations });

  return (
    <div className="space-y-5">
      {/* Statistics Cards with Interactive Quick Filters */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Today's Patients Box */}
        <div
          onClick={filterByToday}
          onMouseEnter={() => setHoveredBox('today')}
          onMouseLeave={() => setHoveredBox(null)}
          style={{
            backgroundColor: (hoveredBox === 'today' || isTodayActive) ? '#f97316' : '#ffffff',
            color: (hoveredBox === 'today' || isTodayActive) ? '#ffffff' : '#111827',
            borderColor: (hoveredBox === 'today' || isTodayActive) ? '#ea580c' : '#e5e7eb'
          }}
          className="rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border"
        >
          <div
            style={{
              backgroundColor: (hoveredBox === 'today' || isTodayActive) ? 'rgba(255,255,255,0.25)' : '#ffedd5',
              color: (hoveredBox === 'today' || isTodayActive) ? '#ffffff' : '#ea580c'
            }}
            className="p-3 rounded-xl transition-colors"
          >
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p
              style={{ color: (hoveredBox === 'today' || isTodayActive) ? '#ffedd5' : '#6b7280' }}
              className="text-xs font-extrabold uppercase tracking-wider transition-colors"
            >
              Today's Patients
            </p>
            <p
              style={{ color: (hoveredBox === 'today' || isTodayActive) ? '#ffffff' : '#111827' }}
              className="text-2xl font-black transition-colors"
            >
              {stats.totalToday || 0}
            </p>
          </div>
        </div>

        {/* This Month's Patients Box */}
        <div
          onClick={filterByMonth}
          onMouseEnter={() => setHoveredBox('month')}
          onMouseLeave={() => setHoveredBox(null)}
          style={{
            backgroundColor: (hoveredBox === 'month' || isMonthActive) ? '#2563eb' : '#ffffff',
            color: (hoveredBox === 'month' || isMonthActive) ? '#ffffff' : '#111827',
            borderColor: (hoveredBox === 'month' || isMonthActive) ? '#1d4ed8' : '#e5e7eb'
          }}
          className="rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border"
        >
          <div
            style={{
              backgroundColor: (hoveredBox === 'month' || isMonthActive) ? 'rgba(255,255,255,0.25)' : '#dbeafe',
              color: (hoveredBox === 'month' || isMonthActive) ? '#ffffff' : '#2563eb'
            }}
            className="p-3 rounded-xl transition-colors"
          >
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p
              style={{ color: (hoveredBox === 'month' || isMonthActive) ? '#dbeafe' : '#6b7280' }}
              className="text-xs font-extrabold uppercase tracking-wider transition-colors"
            >
              This Month
            </p>
            <p
              style={{ color: (hoveredBox === 'month' || isMonthActive) ? '#ffffff' : '#111827' }}
              className="text-2xl font-black transition-colors"
            >
              {stats.totalMonth || 0}
            </p>
          </div>
        </div>

        {/* Total Registrations Box */}
        <div
          onClick={filterByAll}
          onMouseEnter={() => setHoveredBox('all')}
          onMouseLeave={() => setHoveredBox(null)}
          style={{
            backgroundColor: (hoveredBox === 'all' || isAllActive) ? '#059669' : '#ffffff',
            color: (hoveredBox === 'all' || isAllActive) ? '#ffffff' : '#111827',
            borderColor: (hoveredBox === 'all' || isAllActive) ? '#047857' : '#e5e7eb'
          }}
          className="rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border"
        >
          <div
            style={{
              backgroundColor: (hoveredBox === 'all' || isAllActive) ? 'rgba(255,255,255,0.25)' : '#d1fae5',
              color: (hoveredBox === 'all' || isAllActive) ? '#ffffff' : '#059669'
            }}
            className="p-3 rounded-xl transition-colors"
          >
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p
              style={{ color: (hoveredBox === 'all' || isAllActive) ? '#d1fae5' : '#6b7280' }}
              className="text-xs font-extrabold uppercase tracking-wider transition-colors"
            >
              Total Registrations
            </p>
            <p
              style={{ color: (hoveredBox === 'all' || isAllActive) ? '#ffffff' : '#111827' }}
              className="text-2xl font-black transition-colors"
            >
              {stats.totalFiltered || totalRecords || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-orange-600"
          >
            <Filter className="h-4 w-4" /> Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-700">
              Clear All Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6 border-t border-orange-100 pt-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500">From Date</label>
              <input type="date" className="input py-1.5 text-xs" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500">To Date</label>
              <input type="date" className="input py-1.5 text-xs" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500">UHID</label>
              <input className="input py-1.5 text-xs" placeholder="Search UHID" value={filterUhid} onChange={(e) => setFilterUhid(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500">Registration #</label>
              <input className="input py-1.5 text-xs" placeholder="Search Reg#" value={filterRegNo} onChange={(e) => setFilterRegNo(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500">Patient Name</label>
              <input className="input py-1.5 text-xs" placeholder="Search name" value={filterPatientName} onChange={(e) => setFilterPatientName(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500">Department</label>
              <select className="input py-1.5 text-xs" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Registrations Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-100/70 text-xs uppercase text-orange-900">
              <tr>
                <th className="p-3">Registration #</th>
                <th className="p-3">UHID</th>
                <th className="p-3">Patient Name</th>
                <th className="p-3">Reg. Date</th>
                <th className="p-3">Follow Up Date</th>
                <th className="p-3">Department</th>
                <th className="p-3">Doctor</th>
                {receptionSeePatientDue && <th className="p-3">Payment Due</th>}
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={receptionSeePatientDue ? 10 : 9} className="p-8">
                    <SkeletonTable rows={pageSize > 10 ? 10 : pageSize} columns={receptionSeePatientDue ? 10 : 9} className="w-full" />
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={receptionSeePatientDue ? 10 : 9} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Users className="h-10 w-10 text-gray-300" />
                      <p className="font-bold text-gray-600 text-sm">No patients found</p>
                      <p className="text-xs text-gray-400">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg._id} className="border-t border-orange-50">
                    <td className="p-3 font-mono font-bold text-xs text-blue-700">{reg.registrationNumber}</td>
                    <td className="p-3 font-bold text-orange-700 text-xs">{formatUhid(reg.uhid)}</td>
                    <td className="p-3">
                      <div className="font-bold text-gray-800">{reg.patientName}</div>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                        <span className="font-mono font-semibold">Mob: {reg.mobile || 'N/A'}</span>
                        {reg.aadhaar && (
                          <>
                            <span className="text-gray-300">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(reg.aadhaar);
                                toast.success('Aadhaar copied to clipboard!');
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded-md transition-colors flex items-center cursor-pointer border-none bg-transparent"
                              title={`Copy Aadhaar Number (${reg.aadhaar})`}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      {reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      <br />
                      <span className="text-gray-400 text-[10px]">
                        {reg.registrationDate ? new Date(reg.registrationDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {reg.followUpDate ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-bold text-gray-800">
                            {new Date(reg.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                            reg.followUpSource === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {reg.followUpSource === 'doctor' ? 'Doc' : 'Recp'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic font-medium">No Follow Up</span>
                      )}
                    </td>
                    <td className="p-3 text-xs">{reg.department}</td>
                    <td className="p-3 text-xs">Dr. {reg.doctorName}</td>
                    {receptionSeePatientDue && (
                      <td className="p-3 text-xs">
                        {reg.dueAmount > 0 ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-red-100 text-red-700 border border-red-200 shadow-2xs">
                            ₹{Number(reg.dueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium">₹0.00</span>
                        )}
                      </td>
                    )}
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        reg.consultationStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {reg.consultationStatus === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 relative action-menu-container">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === reg._id ? null : reg._id)}
                        className="p-1.5 hover:bg-orange-100/70 text-gray-700 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-sm flex items-center justify-center"
                        title="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === reg._id && (
                        <div className="absolute right-3 top-10 z-30 w-44 bg-white rounded-xl shadow-xl border border-orange-100 py-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenEditModal(reg);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-600" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenFollowUpModal(reg);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors"
                          >
                            <CalendarCheck className="h-3.5 w-3.5 text-orange-600" /> Follow Up Date
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              openVisitHistory(reg.uhid, reg.patientName);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors"
                          >
                            <Clock className="h-3.5 w-3.5 text-gray-500" /> History
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              openPrintModal(reg);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5 text-green-600" /> Print Documents
                          </button>
                          <div className="border-t border-orange-50 my-1"></div>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              handleDeletePatient(reg.patientId);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 text-left transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enterprise Server-Side Pagination Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          {/* Left: Rows Per Page Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="input py-1 px-2.5 text-xs font-bold w-auto border-orange-200 focus:ring-orange-500 bg-orange-50/30 rounded-lg cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Center: Showing X–Y of Z patients */}
          <div className="text-xs font-bold text-gray-700 text-center">
            {totalRecords === 0 ? (
              <span>Showing 0 of 0 patients</span>
            ) : (
              <span>
                Showing <span className="text-gray-900 font-extrabold">{((currentPage - 1) * pageSize + 1).toLocaleString()}</span>–
                <span className="text-gray-900 font-extrabold">{Math.min(currentPage * pageSize, totalRecords).toLocaleString()}</span> of{' '}
                <span className="text-orange-600 font-extrabold">{totalRecords.toLocaleString()}</span> patients
              </span>
            )}
          </div>

          {/* Right: Modern Pagination Controls */}
          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200/80 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-orange-200/80 transition-all duration-200 shadow-xs cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPaginationRange(currentPage, totalPages).map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 py-1 text-xs font-bold text-gray-400 select-none">
                      ...
                    </span>
                  );
                }
                const isActive = p === currentPage;
                return (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    disabled={loading}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 border border-orange-500'
                        : 'bg-white text-gray-700 border border-orange-200/60 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages || totalPages === 0 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200/80 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-orange-200/80 transition-all duration-200 shadow-xs cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Patient Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-orange-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-orange-100 pb-3">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg">Edit Patient Details</h2>
                <p className="text-xs text-gray-500">
                  UHID: {formatUhid(editModal.uhid)} | Reg#: {editModal.registrationNumber}
                </p>
              </div>
              <button
                onClick={() => setEditModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingEdit ? (
              <div className="p-8 text-center text-gray-400">Loading patient details...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Patient Name *</label>
                    <input
                      className="input text-xs py-2"
                      value={editForm.patientName}
                      onChange={(e) => setEditForm({ ...editForm, patientName: e.target.value })}
                      placeholder="Patient Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Mobile Number *</label>
                    <input
                      className="input text-xs py-2"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Aadhaar Number (Optional)</label>
                    <input
                      className="input text-xs py-2"
                      value={editForm.aadhaar}
                      onChange={(e) => setEditForm({ ...editForm, aadhaar: e.target.value })}
                      placeholder="12-digit Aadhaar number"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Date of Birth</label>
                    <input
                      type="date"
                      className="input text-xs py-2"
                      value={editForm.dob}
                      onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Gender *</label>
                    <select
                      className="input text-xs py-2"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Category</label>
                    <select
                      className="input text-xs py-2"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      <option value="General">General</option>
                      <option value="Staff">Staff</option>
                      <option value="EWS">EWS</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Insurance">Insurance</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Address</label>
                    <textarea
                      className="input text-xs py-2 min-h-[60px]"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Patient address"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-orange-100">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => setEditModal(null)}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-xs flex items-center gap-1 text-orange-700 border-orange-200"
                    onClick={() => handleSaveEdit(true)}
                    disabled={savingEdit}
                  >
                    <Printer className="h-3.5 w-3.5" /> Save & Print
                  </button>
                  <button
                    type="button"
                    className="btn text-xs flex items-center gap-1"
                    onClick={() => handleSaveEdit(false)}
                    disabled={savingEdit}
                  >
                    <Save className="h-3.5 w-3.5" /> {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {followUpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-orange-100 pb-3">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg">Set / Update Follow Up Date</h2>
                <p className="text-xs text-gray-500">
                  {followUpModal.patientName} — Reg#: {followUpModal.registrationNumber}
                </p>
              </div>
              <button
                onClick={() => setFollowUpModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Status Banner */}
              <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-xs">
                <span className="font-bold text-gray-500 uppercase text-[10px]">Current Status:</span>{' '}
                {followUpModal.followUpDate ? (
                  <span className="font-bold text-gray-800">
                    {new Date(followUpModal.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                    ({followUpModal.followUpSource === 'doctor' ? 'Doc-Date' : 'Recp-Date'})
                  </span>
                ) : (
                  <span className="font-bold text-gray-500 italic">No Follow Up Set</span>
                )}
              </div>

              {/* Mode Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer border p-3 rounded-xl hover:bg-orange-50/40 border-gray-200">
                  <input
                    type="radio"
                    name="followUpMode"
                    checked={!noFollowUpCheck}
                    onChange={() => setNoFollowUpCheck(false)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-xs font-bold text-gray-800">Set Follow Up Date</span>
                </label>

                {!noFollowUpCheck && (
                  <div className="pl-6 space-y-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Follow Up Date *</label>
                      <input
                        type="date"
                        className="input text-xs py-2 w-full"
                        value={followUpDateInput}
                        onChange={(e) => setFollowUpDateInput(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Remarks / Instructions</label>
                      <input
                        type="text"
                        placeholder="Enter follow-up remarks..."
                        className="input text-xs py-2 w-full"
                        value={followUpRemarksInput}
                        onChange={(e) => setFollowUpRemarksInput(e.target.value)}
                      />
                    </div>
                    {/* Quick Date Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: '+3 Days', days: 3 },
                        { label: '+7 Days', days: 7 },
                        { label: '+14 Days', days: 14 },
                        { label: '+1 Month', days: 30 }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className="px-2 py-1 bg-orange-100/80 hover:bg-orange-200 text-orange-900 rounded-lg text-[10px] font-bold transition-colors"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + item.days);
                            setFollowUpDateInput(d.toISOString().split('T')[0]);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2.5 cursor-pointer border p-3 rounded-xl hover:bg-red-50/40 border-gray-200">
                  <input
                    type="radio"
                    name="followUpMode"
                    checked={noFollowUpCheck}
                    onChange={() => {
                      setNoFollowUpCheck(true);
                      setFollowUpDateInput('');
                      setFollowUpRemarksInput('');
                    }}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs font-bold text-red-600">No Follow Up</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-orange-100">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setFollowUpModal(null)}
                  disabled={savingFollowUp}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn text-xs flex items-center gap-1"
                  onClick={handleSaveFollowUpDate}
                  disabled={savingFollowUp}
                >
                  <Save className="h-3.5 w-3.5" /> {savingFollowUp ? 'Saving...' : 'Save Follow Up'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visit History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden border border-orange-100 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center border-b border-orange-100 pb-3 mb-4">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg">Visit History</h2>
                <p className="text-sm text-gray-500">
                  {historyModal.patientName} — UHID: {formatUhid(historyModal.uhid)}
                </p>
              </div>
              <button
                onClick={() => { setHistoryModal(null); setVisitHistory([]); }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="p-8 text-center text-gray-400">Loading visit history...</div>
              ) : visitHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No visits found for this patient.</div>
              ) : (
                <div className="space-y-3">
                  {visitHistory.map((visit, idx) => (
                    <div key={visit._id} className="flex items-start gap-3 p-3 bg-orange-50/30 rounded-xl border border-orange-100">
                      <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {visit.visitNumber || idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-blue-700">{visit.registrationNumber}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            visit.consultationStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {visit.consultationStatus === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {visit.department} • Dr. {visit.doctorId?.doctorName || visit.doctorId?.username || 'N/A'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {visit.registrationDate ? new Date(visit.registrationDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                          {visit.appointmentDate && ` • Appt: ${visit.appointmentDate} ${visit.slot}`}
                        </p>
                        {visit.followUpDate && (
                          <div className="mt-2 p-2 bg-white rounded-lg border border-orange-100 text-xs flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-700">Follow-Up:</span>
                              <span className="font-extrabold text-orange-700">
                                {new Date(visit.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                visit.followUpSource === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {visit.followUpSource === 'doctor' ? 'Doctor' : 'Reception'}
                              </span>
                            </div>
                            {visit.followUpRemarks && (
                              <div className="text-gray-600 text-[11px]">
                                <strong className="text-gray-500">Remarks:</strong> {visit.followUpRemarks}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt & Patient Slip Print Modal */}
      {showReceipt && patientDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col bg-white overflow-hidden shadow-2xl rounded-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Print Patient Documents</h3>
                <p className="text-xs text-gray-500 font-medium">
                  Patient: <strong className="text-orange-700">{patientDetails.patientName}</strong> | UHID: {formatUhid(patientDetails.uhid)} | Reg#: {patientDetails.registrationNumber || 'N/A'} {patientDetails.billNumber ? `| Bill #: ${patientDetails.billNumber}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary cursor-pointer flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 px-3 py-1.5"
                  onClick={() => handlePrintDocument('patient_slip')}
                >
                  <Printer className="h-3.5 w-3.5 text-indigo-600" /> Print Patient Slip
                </button>
                <button
                  type="button"
                  className="btn cursor-pointer flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5"
                  onClick={() => handlePrintDocument('bill_receipt')}
                >
                  <Printer className="h-3.5 w-3.5" /> Print Bill Receipt
                </button>
                <button
                  type="button"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => { setShowReceipt(false); setPatientDetails(null); }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Preview Mode Tabs */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Document Preview Mode</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPrintMode('patient_slip')}
                  className={`text-xs font-bold px-3 py-1 rounded-md transition-all cursor-pointer ${
                    printMode === 'patient_slip' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Patient Slip Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('bill_receipt')}
                  className={`text-xs font-bold px-3 py-1 rounded-md transition-all cursor-pointer ${
                    printMode === 'bill_receipt' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bill Receipt Preview
                </button>
              </div>
            </div>

            {/* Scrollable Document Container */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <PatientReceipt ref={receiptRef} patient={patientDetails} mode={printMode} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;