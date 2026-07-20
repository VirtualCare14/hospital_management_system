import { useEffect, useRef, useState } from 'react';
import { Eye, Printer, Search, Trash2, X, Calendar, Hash, Users, FileText, Clock, Filter, ChevronDown, Copy, Pencil, Save, MoreVertical, CalendarCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import client from '../../api/client';
import PatientReceipt from '../../components/PatientReceipt';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import { formatUhid } from '../../utils/uhid';

const DEPARTMENTS = ['General', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Dermatology', 'ENT', 'Ophthalmology', 'Psychiatry'];

const PatientList = () => {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ totalToday: 0, totalMonth: 0, totalFiltered: 0 });
  const [loading, setLoading] = useState(false);

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
  const [noFollowUpCheck, setNoFollowUpCheck] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Receipt
  const [patientDetails, setPatientDetails] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (filterUhid) params.uhid = filterUhid;
      if (filterRegNo) params.registrationNumber = filterRegNo;
      if (filterPatientName) params.patientName = filterPatientName;
      if (filterDepartment) params.department = filterDepartment;

      const { data } = await client.get('/patients/registrations/list', { params });
      setRegistrations(data.registrations || []);
      setStats(data.stats || { totalToday: 0, totalMonth: 0, totalFiltered: 0 });
    } catch (error) {
      console.error('Fetch registrations error:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRegistrations();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fromDate, toDate, filterUhid, filterRegNo, filterPatientName, filterDepartment]);

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
      setVisitHistory(data || []);
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

  const printPatientReceipt = async (reg) => {
    try {
      const { data } = await client.get(`/patients/${reg.patientId}`);
      // Override doctor with the specific registration's doctor
      setPatientDetails({
        ...data,
        doctorId: { doctorName: reg.doctorName, username: reg.doctorName },
        department: reg.department,
        registrationNumber: reg.registrationNumber,
        appointmentNumber: reg.appointmentNumber
      });
      setShowReceipt(true);
      setTimeout(async () => {
        if (receiptRef.current) {
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
        }
        setShowReceipt(false);
        setPatientDetails(null);
      }, 500);
    } catch (error) {
      toast.error('Error generating receipt');
    }
  };

  const hasActiveFilters = fromDate || toDate || filterUhid || filterRegNo || filterPatientName || filterDepartment;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Patient Registrations</h1>
          <p className="text-sm text-gray-500">All registrations with filters and visit history.</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Today</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalToday}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">This Month</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalMonth}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="bg-green-100 text-green-600 p-3 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">
              {hasActiveFilters ? 'Filtered Total' : 'Total Registrations'}
            </p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalFiltered}</p>
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
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8">
                    <SkeletonTable rows={4} columns={9} className="w-full" />
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr><td colSpan="9" className="p-8 text-center text-gray-400">No registrations found.</td></tr>
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
                              onClick={() => {
                                navigator.clipboard.writeText(reg.aadhaar);
                                toast.success('Aadhaar copied to clipboard!');
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer font-medium bg-transparent border-none p-0"
                              title="Copy Aadhaar Card Number"
                            >
                              <Copy className="h-3 w-3" /> Aadhaar: {reg.aadhaar}
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
                              printPatientReceipt(reg);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5 text-green-600" /> Print
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
                    <input
                      type="date"
                      className="input text-xs py-2 w-full"
                      value={followUpDateInput}
                      onChange={(e) => setFollowUpDateInput(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden receipt for printing */}
      {showReceipt && patientDetails && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <PatientReceipt ref={receiptRef} patient={patientDetails} />
        </div>
      )}
    </div>
  );
};

export default PatientList;