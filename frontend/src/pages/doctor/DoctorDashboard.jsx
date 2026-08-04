import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Stethoscope, Users, Trash2, Send, History, Eye, ChevronLeft, ChevronRight, ClipboardEdit } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';
import { useAuth } from '../../context/AuthContext';

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

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('today'); // previous | today | upcoming | completed | pending | all
  const [counts, setCounts] = useState(null);
  const [returnNotifications, setReturnNotifications] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchReturnNotifications = useCallback(() => {
    const doctorId = user?._id || user?.id;
    if (!user || user.role !== 'doctor' || !doctorId) return;
    client.get(`/pharmacy/requests?status=Return Accepted&doctorNotifiedOfReturn=false&doctorId=${doctorId}`)
      .then(({ data }) => setReturnNotifications(data))
      .catch((err) => console.error("Error fetching return notifications:", err));
  }, [user]);

  const [missedAlerts, setMissedAlerts] = useState([]);

  const fetchMissedAlerts = useCallback(() => {
    if (!user || user.role !== 'doctor') return;
    client.get('/ipd/medication-orders/missed-alerts')
      .then(({ data }) => setMissedAlerts(data))
      .catch((err) => console.error("Error fetching missed alerts:", err));
  }, [user]);

  useEffect(() => {
    fetchReturnNotifications();
    fetchMissedAlerts();
  }, [fetchReturnNotifications, fetchMissedAlerts]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchMissedAlerts();
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchMissedAlerts]);

  const handleDismissMissedAlert = async (alertId) => {
    try {
      await client.post(`/ipd/medication-orders/missed-alerts/${alertId}/dismiss`);
      toast.success('Alert acknowledged');
      fetchMissedAlerts();
    } catch (err) {
      toast.error('Failed to dismiss alert');
    }
  };

  const handleDismissNotification = async (reqId) => {
    try {
      await client.post(`/pharmacy/requests/${reqId}/dismiss-notification`);
      toast.success('Notification acknowledged');
      fetchReturnNotifications();
    } catch (err) {
      toast.error('Failed to dismiss notification');
    }
  };

  const fetchPatients = useCallback(() => {
    client.get(`/consultation/appointments?filter=${filter}`).then(({ data }) => setPatients(data)).catch(() => setPatients([]));
    client.get('/consultation/stats').then(({ data }) => setCounts(data)).catch(() => setCounts(null));
  }, [filter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPatients();
    }, 150);

    return () => clearTimeout(timeout);
  }, [fetchPatients, search]);

  useEffect(() => {
    client.get('/consultation/stats').then(({ data }) => setCounts(data)).catch(() => setCounts(null));
  }, []);

  // Reset pagination to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const refreshAll = () => {
    fetchPatients();
    fetchReturnNotifications();
    fetchMissedAlerts();
    client.get('/consultation/stats').then(({ data }) => setCounts(data)).catch(() => setCounts(null));
  };

  const handleSendToOt = async (patient) => {
    if (!window.confirm(`Send ${patient.patientName} to OT (Operation Theatre)?`)) return;
    try {
      await client.post('/ipd/referrals', {
        patientId: patient._id,
        notes: `Referred to OT from Doctor Dashboard. Diagnosis: ${patient.diagnosisRemark || 'N/A'}`
      });
      toast.success(`${patient.patientName} has been referred to OT successfully!`);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send to OT');
    }
  };

  // Filter by search
  const filteredPatients = patients.filter(patient => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (patient.patientName && patient.patientName.toLowerCase().includes(term)) ||
      (patient.uhid && patient.uhid.toLowerCase().includes(term)) ||
      (patient.mobile && patient.mobile.includes(term))
    );
  });

  const totalRecords = filteredPatients.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const [hoveredBox, setHoveredBox] = useState(null);

  const summaryCards = [
    { key: 'all', label: 'Total Patients', value: counts?.totalPatients, activeBg: '#4f46e5', activeBorder: '#4338ca', textLight: '#e0e7ff' },
    { key: 'previous', label: 'Previous Patients', value: counts?.previousPatientsCount, activeBg: '#475569', activeBorder: '#334155', textLight: '#e2e8f0' },
    { key: 'today', label: "Today's Patients", value: counts?.todaysPatientsCount, activeBg: '#f97316', activeBorder: '#ea580c', textLight: '#ffedd5' },
    { key: 'upcoming', label: 'Upcoming Patients', value: counts?.upcomingPatientsCount, activeBg: '#d97706', activeBorder: '#b45309', textLight: '#fef3c7' }
  ];

  return (
    <div className="space-y-5">
      {/* Missed Medication Alerts */}
      {missedAlerts.map((alert) => (
        <div key={alert._id} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse mb-2">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-600 text-white font-extrabold text-xs">🚨</span>
            <div>
              <p className="text-sm font-bold text-red-900">Missed Medication Alert</p>
              <p className="text-xs text-red-700 mt-0.5">
                Patient: <span className="font-bold">{alert.patientName}</span> | 
                Medicine: <span className="font-bold">{alert.medicineName}</span> | 
                Scheduled: <span className="font-bold">{alert.scheduledTime}</span> | 
                Delay: <span className="font-bold">{alert.currentDelay}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleDismissMissedAlert(alert._id)}
            className="text-[10px] font-bold text-red-700 hover:text-red-900 hover:underline px-3 py-1.5 rounded-xl bg-red-100/50 cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      ))}

      {/* Return Notifications */}
      {returnNotifications.map((noti) => (
        <div key={noti._id} className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse mb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-green-500 text-white font-extrabold text-sm">🔔</span>
            <div>
              <p className="text-sm font-bold text-green-800">Medicines Added Back to Stock</p>
              <p className="text-xs text-green-600 font-medium">
                Unused medicines from Pharmacy Request <strong>#{noti.requestNumber}</strong> for patient <strong>{noti.patientId?.patientName}</strong> have been accepted by the pharmacy and added back to inventory stock!
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleDismissNotification(noti._id)} 
            className="text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 py-1.5 px-3 rounded-lg border border-green-300 cursor-pointer transition whitespace-nowrap"
          >
            Acknowledge & Dismiss
          </button>
        </div>
      ))}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Doctor Dashboard</h1>
          <p className="text-sm text-gray-500">All registered patients are available for consultation and prescription.</p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input"
            style={{paddingLeft: '52px'}}
            placeholder="Search UHID, mobile, patient name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {/* Eye-Catching Color & Size Animation CSS */}
      <style>{`
        @keyframes eyeCatchPulse {
          0% {
            transform: scale(1) rotate(0deg);
            color: #2563eb;
            filter: drop-shadow(0 0 3px rgba(37, 99, 235, 0.7));
          }
          20% {
            transform: scale(1.28) rotate(-6deg);
            color: #ea580c;
            filter: drop-shadow(0 0 10px rgba(234, 88, 12, 0.95));
          }
          40% {
            transform: scale(0.92) rotate(0deg);
            color: #dc2626;
            filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.85));
          }
          60% {
            transform: scale(1.24) rotate(6deg);
            color: #059669;
            filter: drop-shadow(0 0 10px rgba(5, 150, 105, 0.95));
          }
          80% {
            transform: scale(0.95) rotate(-3deg);
            color: #7c3aed;
            filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.85));
          }
          100% {
            transform: scale(1) rotate(0deg);
            color: #2563eb;
            filter: drop-shadow(0 0 3px rgba(37, 99, 235, 0.7));
          }
        }
        .eye-catcher-icon {
          animation: eyeCatchPulse 1.2s infinite ease-in-out;
        }
      `}</style>

      {/* Summary KPI Cards - Click to Filter */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const isSelected = filter === card.key;
          const isHovered = hoveredBox === card.key;
          const isActive = isSelected || isHovered;

          return (
            <div
              key={card.key}
              onClick={() => setFilter(card.key)}
              onMouseEnter={() => setHoveredBox(card.key)}
              onMouseLeave={() => setHoveredBox(null)}
              style={{
                backgroundColor: isActive ? card.activeBg : '#ffffff',
                color: isActive ? '#ffffff' : '#111827',
                borderColor: isActive ? card.activeBorder : '#e5e7eb'
              }}
              className="rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border"
            >
              <div>
                <div
                  style={{ color: isActive ? card.textLight : '#6b7280' }}
                  className="text-xs font-extrabold uppercase tracking-wider transition-colors"
                >
                  {card.label}
                </div>
                <div
                  style={{ color: isActive ? '#ffffff' : '#111827' }}
                  className="text-2xl font-black mt-1 transition-colors"
                >
                  {card.value ?? 0}
                </div>
              </div>
              {isSelected && (
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-white/25 text-white backdrop-blur-xs">
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="text-orange-500 h-5 w-5" />
            <h2 className="font-bold text-gray-800 text-lg">
              Patient List {filter && <span className="text-orange-600 font-extrabold capitalize text-base">({filter === 'all' ? 'All Patients' : filter === 'completed' ? 'Consultation Completed' : filter === 'pending' ? 'Pending OPD' : `${filter} Patients`})</span>}
            </h2>
          </div>
          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            Total Shown: <strong className="text-gray-900">{filteredPatients.length}</strong>
          </span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl shadow-sm border">
          <table className="w-full min-w-[800px] table-auto text-left text-sm bg-white">
            <thead className="sticky top-0 bg-orange-50 shadow-sm">
              <tr className="border-b">
                <th className="p-3">Patient Name</th>
                <th className="p-3">UHID</th>
                <th className="p-3">Date / Slot</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedPatients.map((patient) => (
                <tr key={patient._id} className="border-b">
                  <td className="p-3">
                    <span className="font-semibold text-gray-950 block">{patient.patientName}</span>
                    <span className="text-xs text-gray-500">{patient.mobile}</span>
                  </td>
                  <td className="p-3 font-semibold text-gray-700">{patient.uhid}</td>
                  <td className="p-3">
                    <div className="font-semibold text-gray-950">{formatDate(patient.appointmentDate)}</div>
                    <div className="text-xs text-gray-500">{patient.slot}</div>
                  </td>
                  <td className="p-3">{patient.department || 'N/A'}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        patient.consultationStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {patient.consultationStatus === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {user.role === 'admin' ? (
                        <>
                          {patient.consultationId ? (
                            <Link 
                              className="text-xs inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                              to={`/doctor/consultation/${patient._id}`}
                            >
                              <Eye className="h-3 w-3 text-indigo-600" /> View Consultation
                            </Link>
                          ) : (
                            <span className="text-xs italic text-gray-400 font-medium">Consultation Pending</span>
                          )}
                          {patient.hasPrescription && (
                            <Link 
                              className="text-xs inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 cursor-pointer"
                              to={`/doctor/prescription/${patient._id}`}
                            >
                              <FileText className="h-3 w-3 text-green-600" /> View Rx
                            </Link>
                          )}
                        </>
                      ) : (
                        <Link 
                          to={`/doctor/consultation/${patient._id}`}
                          className="relative inline-flex items-center justify-center p-1 rounded-xl cursor-pointer bg-transparent"
                          title="Open Doctor Consultation Form"
                        >
                          <ClipboardEdit className={`h-10 w-10 ${patient.consultationStatus !== 'completed' ? 'eye-catcher-icon' : 'text-emerald-600'}`} />
                        </Link>
                      )}
                      <Link className="btn-secondary text-xs text-green-600" to={`/doctor/consultation-track/${patient._id}`}><History className="h-3 w-3" /> Track</Link>
                      <button className="btn-secondary text-xs text-indigo-600" onClick={() => handleSendToOt(patient)}><Send className="h-3 w-3" /> OT</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && <tr><td colSpan={6} className="p-4 text-sm text-gray-500">No patients found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        <div className="mt-4 px-4 py-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
          {/* Left: Rows Per Page Selector */}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <span>Show:</span>
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
              disabled={currentPage === 1}
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
              disabled={currentPage >= totalPages || totalPages === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200/80 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-orange-200/80 transition-all duration-200 shadow-xs cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;