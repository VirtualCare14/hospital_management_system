'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Search, Eye, Printer, Calendar, Users, Filter, ChevronLeft, ChevronRight,
  UserCheck, RefreshCw, X, FileText, Phone, Stethoscope, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import PrintOpdSlipModal from '../common/PrintOpdSlipModal';

export default function PatientListView({ onNavigate }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickFilter, setQuickFilter] = useState('all'); // all | today | previous | upcoming
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ previousCount: 0, todayCount: 0, upcomingCount: 0, totalFiltered: 0 });

  // Filter fields
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  // Modals
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [printMode, setPrintMode] = useState('patient_slip');
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [historyModalPatient, setHistoryModalPatient] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load Departments
  useEffect(() => {
    apiRequest('/admin/departments')
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data.filter(d => d.isActive !== false));
      })
      .catch(() => {});
  }, []);

  // Fetch Registrations
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (quickFilter !== 'all') params.filter = quickFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (department) params.department = department;
      if (searchTerm) {
        if (/^UHID|PID/i.test(searchTerm) || /^\d+$/.test(searchTerm)) {
          params.uhid = searchTerm;
        } else {
          params.patientName = searchTerm;
        }
      }

      const res = await apiRequest('/patients/registrations/list', { params });
      setRegistrations(res.registrations || []);
      setStats(res.stats || { previousCount: 0, todayCount: 0, upcomingCount: 0, totalFiltered: 0 });
      setTotalRecords(res.totalRecords ?? res.total ?? 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Fetch error:', err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [quickFilter, searchTerm, fromDate, toDate, department]);

  useEffect(() => {
    const timer = setTimeout(fetchRegistrations, 300);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, quickFilter, searchTerm, fromDate, toDate, department]);

  // Open Visit History
  const openHistory = async (patient) => {
    setHistoryModalPatient(patient);
    setLoadingHistory(true);
    try {
      const res = await apiRequest(`/patients/registrations/history/${encodeURIComponent(patient.uhid)}`);
      setPatientVisits(res.visits || res || []);
    } catch (err) {
      toast.error('Failed to load visit history');
      setPatientVisits([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Stats & Actions */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Patient Registry</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Manage patient records, print slips and view consultation tracks</p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('reception-register')}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-xs"
            >
              + Register New Patient
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl">
            {[
              { id: 'all', label: 'All Patients' },
              { id: 'today', label: `Today (${stats.todayCount || 0})` },
              { id: 'upcoming', label: `Upcoming (${stats.upcomingCount || 0})` },
              { id: 'previous', label: `Past (${stats.previousCount || 0})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setQuickFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  quickFilter === tab.id
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by UHID, Name, Mobile..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Date & Department Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">UHID / Patient</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Doctor & Dept</th>
                <th className="py-3.5 px-4">Date & Slot</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading patients...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No patient records found.
                  </td>
                </tr>
              ) : (
                registrations.map((patient) => {
                  const docName = patient.doctorId?.doctorName || patient.doctorId?.username || 'Doctor';
                  return (
                    <tr key={patient._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-orange-600 block">{formatUhid(patient.uhid)}</span>
                        <span className="font-bold text-gray-900">{patient.patientName}</span>
                        <span className="text-[11px] text-gray-500 block">{patient.gender} • {patient.category || 'General'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-gray-800 font-bold">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {patient.mobile || '-'}
                        </div>
                        {patient.address && <span className="text-[11px] text-gray-500 block truncate max-w-[150px]">{patient.address}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">Dr. {docName}</span>
                        <span className="text-[11px] text-gray-500">{patient.department || '-'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-800 block">{formatDate(patient.appointmentDate)}</span>
                        <span className="text-[11px] text-gray-500">{patient.slot || 'Walk-in'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          patient.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {patient.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          patient.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {patient.paymentStatus || 'Paid'} (₹{patient.netOpdFee || patient.opdFee || 0})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setPrintMode('patient_slip');
                              setShowSlipModal(true);
                            }}
                            title="Print OPD Slip"
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer border border-orange-200"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setPrintMode('bill_receipt');
                              setShowSlipModal(true);
                            }}
                            title="Print Payment Receipt"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openHistory(patient)}
                            title="View History / Visits"
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border border-gray-200"
                          >
                            <Eye className="w-4 h-4" />
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs font-bold text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-700 px-2">Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slip Modal */}
      {showSlipModal && selectedPatient && (
        <PrintOpdSlipModal
          patient={selectedPatient}
          mode={printMode}
          onClose={() => {
            setShowSlipModal(false);
            setSelectedPatient(null);
          }}
        />
      )}

      {/* History Modal */}
      {historyModalPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Visit History</h3>
                <p className="text-xs text-gray-500">UHID: {historyModalPatient.uhid} • {historyModalPatient.patientName}</p>
              </div>
              <button
                onClick={() => setHistoryModalPatient(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {loadingHistory ? (
                <div className="py-8 text-center text-gray-400">Loading visit history...</div>
              ) : patientVisits.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No prior visits found for this patient.</div>
              ) : (
                patientVisits.map((visit, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-gray-900">Visit #{visit.visitNumber || idx + 1}</span>
                      <span className="text-gray-500 font-bold">{formatDate(visit.appointmentDate || visit.createdAt)}</span>
                    </div>
                    <p className="text-gray-700"><strong>Doctor:</strong> Dr. {visit.doctorId?.doctorName || visit.doctorId?.username || '-'}</p>
                    <p className="text-gray-700"><strong>Department:</strong> {visit.department || '-'}</p>
                    <p className="text-gray-700"><strong>Status:</strong> <span className="font-bold text-orange-600">{visit.status || 'Pending'}</span></p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
