import { useEffect, useRef, useState } from 'react';
import { Eye, Printer, Search, Trash2, X, Calendar, Hash, Users, FileText, Clock, Filter, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import client from '../../api/client';
import PatientReceipt from '../../components/PatientReceipt';
import { formatUhid } from '../../utils/uhid';

const DEPARTMENTS = ['General', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Dermatology', 'ENT', 'Ophthalmology', 'Psychiatry', 'Same Day Treatment'];

const PatientList = () => {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ totalToday: 0, totalMonth: 0, totalFiltered: 0 });
  const [loading, setLoading] = useState(false);

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
                <th className="p-3">Department</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">Loading...</td></tr>
              ) : registrations.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">No registrations found.</td></tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg._id} className="border-t border-orange-50 hover:bg-orange-50/30">
                    <td className="p-3 font-mono font-bold text-xs text-blue-700">{reg.registrationNumber}</td>
                    <td className="p-3 font-bold text-orange-700 text-xs">{formatUhid(reg.uhid)}</td>
                    <td className="p-3">{reg.patientName}</td>
                    <td className="p-3 text-xs">
                      {reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      <br />
                      <span className="text-gray-400 text-[10px]">
                        {reg.registrationDate ? new Date(reg.registrationDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
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
                    <td className="flex flex-wrap gap-1 p-3">
                      <button
                        className="btn-secondary text-[10px] py-1 px-1.5"
                        onClick={() => openVisitHistory(reg.uhid, reg.patientName)}
                        title="View Visit History"
                      >
                        <Clock className="h-3 w-3" /> History
                      </button>
                      <button
                        className="btn-secondary text-[10px] py-1 px-1.5"
                        onClick={() => printPatientReceipt(reg)}
                      >
                        <Printer className="h-3 w-3" />
                      </button>
                      <button
                        className="btn-secondary text-[10px] py-1 px-1.5 text-red-600"
                        onClick={() => handleDeletePatient(reg.patientId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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