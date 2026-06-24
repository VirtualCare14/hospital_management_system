import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, CheckCircle, Clock, AlertCircle, CalendarDays,
  Loader2, RefreshCw, Scissors, Eye, Printer, Download, X,
  ArrowRight, Edit
} from 'lucide-react';
import client from '../../api/client';
import OtSchedulingModal from './OtSchedulingModal';

const IpdOtDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [history, setHistory] = useState({ previous: [], current: [], upcoming: [] });
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('day');
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  // Scheduling modal states
  const [selectedOtRecord, setSelectedOtRecord] = useState(null);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState(null);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);

  const handleEditSchedule = async (booking) => {
    try {
      const recordId = booking.otRecordId?._id || booking.otRecordId;
      if (!recordId) {
        toast.error('No associated OT record found');
        return;
      }
      const { data } = await client.get(`/ipd/ot/${recordId}/full`);
      setSelectedOtRecord(data);
      setSelectedAdmissionId(booking.admissionId?._id || booking.admissionId);
      setShowSchedulingModal(true);
    } catch (err) {
      toast.error('Failed to load OT record details');
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/ipd/ot-management/dashboard');
      setDashboard(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const params = viewDate ? `?date=${viewDate}` : '';
      const { data } = await client.get(`/ipd/ot-management/bookings${params}`);
      setBookings(data);
    } catch (err) { console.error(err); }
    finally { setBookingsLoading(false); }
  };

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { loadBookings(); }, [viewDate]);

  const loadPatients = async () => {
    setPatientsLoading(true);
    try {
      const { data } = await client.get('/ipd/patients');
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => { loadPatients(); }, []);

  // Load all bookings for history summary
  useEffect(() => {
    const loadAll = async () => {
      try {
        const { data } = await client.get('/ipd/ot-management/bookings');
        setAllBookings(data);
        const today = new Date();
        today.setHours(0,0,0,0);
        const prev = [];
        const curr = [];
        const upc = [];
        data.forEach(b => {
          const sd = new Date(b.surgeryDate);
          sd.setHours(0,0,0,0);
          if (b.status === 'Completed' || sd < today) prev.push(b);
          else if (sd.getTime() === today.getTime()) curr.push(b);
          else upc.push(b);
        });
        setHistory({ previous: prev, current: curr, upcoming: upc });
      } catch (err) { console.error('Failed to load bookings for history', err); }
    };
    loadAll();
  }, []);

  const getWeekDates = () => {
    const today = new Date(viewDate);
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(start.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const getMonthDates = () => {
    const d = new Date(viewDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(year, month, i).toISOString().split('T')[0]);
    }
    return dates;
  };

  const statusBadge = (status) => {
    const colors = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">OT Management Dashboard</h1>
          <p className="text-sm text-gray-500">Monitor and manage operation theatres</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/ipd/ot-management/calendar')} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Calendar View
          </button>
          <button onClick={loadDashboard} className="btn-secondary text-sm py-2 px-4"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Dashboard Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : dashboard ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card p-4 text-center bg-blue-50 border-blue-100">
            <Building2 className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <span className="block text-2xl font-black text-blue-700">{dashboard.totalOTs}</span>
            <span className="text-[10px] font-bold uppercase text-blue-500">Total OTs</span>
          </div>
          <div className="card p-4 text-center bg-green-50 border-green-100">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <span className="block text-2xl font-black text-green-700">{dashboard.availableOTs}</span>
            <span className="text-[10px] font-bold uppercase text-green-500">Available</span>
          </div>
          <div className="card p-4 text-center bg-red-50 border-red-100">
            <Clock className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <span className="block text-2xl font-black text-red-700">{dashboard.occupiedOTs}</span>
            <span className="text-[10px] font-bold uppercase text-red-500">Occupied</span>
          </div>
          <div className="card p-4 text-center bg-purple-50 border-purple-100">
            <Scissors className="h-6 w-6 text-purple-500 mx-auto mb-1" />
            <span className="block text-2xl font-black text-purple-700">{dashboard.todaysSurgeries}</span>
            <span className="text-[10px] font-bold uppercase text-purple-500">Today</span>
          </div>
          <div className="card p-4 text-center bg-amber-50 border-amber-100">
            <CalendarDays className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <span className="block text-2xl font-black text-amber-700">{dashboard.upcomingSurgeries}</span>
            <span className="text-[10px] font-bold uppercase text-amber-500">Upcoming</span>
          </div>
          <div className="card p-4 text-center bg-emerald-50 border-emerald-100">
            <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
            <span className="block text-2xl font-black text-emerald-700">{dashboard.completedSurgeries}</span>
            <span className="text-[10px] font-bold uppercase text-emerald-500">Completed</span>
          </div>
        </div>
      ) : null}

      {/* Quick OT Flow Access */}
      {allBookings.length > 0 && (
        <div className="card p-4">
          <h3 className="font-extrabold text-gray-900 mb-3 flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-orange-500" />
            OT Flow - Patient Quick Access
          </h3>
          <p className="text-xs text-gray-500 mb-3">Click on a patient below to open their OT workflow directly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {allBookings
              .filter(b => b.status !== 'Cancelled')
              .slice(0, 12)
              .map(b => (
                <button
                  key={b._id}
                  onClick={() => navigate(`/ipd/ot-flow/${b.admissionId?._id || b.admissionId}`)}
                  className="text-left p-3 rounded-xl border-2 border-orange-100 bg-orange-50/50 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <div className="font-bold text-sm text-gray-900 truncate">{b.patientId?.patientName || 'Unknown'}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {b.admissionId?.ipdNumber || '-'} • {b.otId?.otCode || '-'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {b.surgeryDate?.slice(0,10)} • {b.startTime} - {b.endTime}
                  </div>
                  <div className="mt-2">
                    {statusBadge(b.status)}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Date Navigation */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d.toISOString().split('T')[0]); }} className="btn-secondary text-xs py-1.5 px-3">Prev</button>
            <input type="date" className="input py-1.5 text-xs w-40" value={viewDate} onChange={(e) => setViewDate(e.target.value)} />
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d.toISOString().split('T')[0]); }} className="btn-secondary text-xs py-1.5 px-3">Next</button>
          </div>
          <button onClick={() => setViewDate(new Date().toISOString().split('T')[0])} className="btn-secondary text-xs py-1.5 px-3">Today</button>
          <div className="ml-auto flex gap-1">
            {['day', 'week', 'month'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`text-xs py-1.5 px-3 rounded-lg font-bold uppercase ${viewMode === mode ? 'bg-orange-500 text-white' : 'btn-secondary'}`}>{mode}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-orange-100 bg-orange-50/30">
          <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            {viewMode === 'day' ? 'Daily Schedule' : viewMode === 'week' ? 'Weekly Schedule' : 'Monthly Schedule'}
          </h3>
        </div>
        {bookingsLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                  <th className="p-3 pl-4">Time</th>
                  <th className="p-3">OT</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Surgeon</th>
                  <th className="p-3">Procedure</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {bookings.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400"><CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No surgeries scheduled for this date</p></td></tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b._id} className="hover:bg-orange-50/20">
                      <td className="p-3 pl-4 text-xs font-bold">{b.startTime} - {b.endTime}</td>
                      <td className="p-3"><span className="font-mono font-bold text-orange-700">{b.otId?.otCode}</span><span className="block text-[10px] text-gray-500">{b.otId?.otName}</span></td>
                      <td className="p-3 font-bold text-gray-800 text-xs">{b.patientId?.patientName || '-'}<span className="block text-[10px] text-gray-400 font-mono">{b.admissionId?.ipdNumber}</span></td>
                      <td className="p-3 text-xs">{b.otRecordId?.surgeon || '-'}</td>
                      <td className="p-3 text-xs max-w-[150px] truncate">{b.otRecordId?.proceduresPerformed || '-'}</td>
                      <td className="p-3">{statusBadge(b.status)}</td>
                       <td className="p-3 pr-4">
                         <div className="flex justify-center gap-1">
                           {b.admissionId && (
                             <>
                               <button onClick={() => navigate(`/ipd/ot-flow/${b.admissionId._id || b.admissionId}`)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="OT Flow"><ArrowRight className="h-3.5 w-3.5" /></button>
                               <button onClick={() => navigate(`/ipd/ot/${b.admissionId._id}?otId=${b.otRecordId?._id || ''}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View OT Record"><Eye className="h-3.5 w-3.5" /></button>
                               <button onClick={() => handleEditSchedule(b)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit Schedule"><Edit className="h-3.5 w-3.5" /></button>
                             </>
                           )}
                         </div>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* abc Section - Patient List with OT Action */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-orange-100 bg-orange-50/30">
          <h3 className="font-extrabold text-gray-900">abc</h3>
        </div>
        {patientsLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading patients...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                  <th className="p-3 pl-4">Patient</th>
                  <th className="p-3">UHID</th>
                  <th className="p-3">PID / IPD No.</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {patients.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400"><p className="font-bold">No patients found</p></td></tr>
                ) : (
                  patients
                    .filter(p => p.status !== 'Discharged')
                    .slice(0, 10)
                    .map((admission) => {
                      const patient = admission.patientId || {};
                      return (
                      <tr key={admission._id} className="hover:bg-orange-50/20">
                        <td className="p-3 pl-4">
                          <span className="font-bold text-gray-900">{patient.patientName || 'N/A'}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-orange-700 text-xs font-bold">
                            {patient.uhid ? `UHID-${String(patient.uhid).slice(-6)}` : 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-xs font-bold text-gray-700">{admission.pidNumber || 'N/A'}</span>
                          <span className="block text-[10px] text-gray-400">IPD: {admission.ipdNumber || 'N/A'}</span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            admission.status === 'Admitted' ? 'bg-red-100 text-red-800' :
                            admission.status === 'Under Observation' ? 'bg-yellow-100 text-yellow-800' :
                            admission.status === 'Shifted' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {admission.status || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 pr-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => navigate(`/ipd/ot-flow/${admission._id}`)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                              title="OT Flow"
                            >
                              <Scissors className="h-4 w-4" />
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
        )}
      </div>

      {/* History Section */}
      <div className="card p-4">
        <h3 className="font-extrabold text-gray-900 mb-3">History & Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg">
            <h4 className="font-bold text-sm mb-2">Previous (Completed)</h4>
            {history.previous.slice(0,6).map(b => (
              <div key={b._id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0">
                <div>
                  <div className="font-bold">{b.patientId?.patientName || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{b.surgeryDate?.slice(0,10)} • {b.otId?.otCode}</div>
                </div>
                  <div className="flex flex-col items-end">
                    <button onClick={() => navigate(`/ipd/patient/${b.admissionId?._id || b.admissionId}?tab=ot-records`)} className="text-xs text-blue-600">Patient</button>
                    <button onClick={() => navigate(`/ipd/ot-flow/${b.admissionId?._id || b.admissionId}`)} className="text-xs text-orange-600 font-bold">OT Flow</button>
                    <button onClick={() => navigate(`/ipd/ot/${b.admissionId?._id || b.admissionId}?otId=${b.otRecordId?._id || ''}`)} className="text-xs text-gray-600">OT</button>
                  </div>
              </div>
            ))}
          </div>

          <div className="p-3 border rounded-lg">
            <h4 className="font-bold text-sm mb-2">Current (Today)</h4>
            {history.current.slice(0,6).map(b => (
              <div key={b._id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0">
                <div>
                  <div className="font-bold">{b.patientId?.patientName || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{b.startTime} - {b.endTime} • {b.otId?.otCode}</div>
                </div>
                  <div className="flex flex-col items-end">
                    <button onClick={() => navigate(`/ipd/patient/${b.admissionId?._id || b.admissionId}?tab=ot-records`)} className="text-xs text-blue-600">Patient</button>
                    <button onClick={() => navigate(`/ipd/ot-flow/${b.admissionId?._id || b.admissionId}`)} className="text-xs text-orange-600 font-bold">OT Flow</button>
                    <button onClick={() => navigate(`/ipd/ot/${b.admissionId?._id || b.admissionId}?otId=${b.otRecordId?._id || ''}`)} className="text-xs text-gray-600">OT</button>
                  </div>
              </div>
            ))}
          </div>

          <div className="p-3 border rounded-lg">
            <h4 className="font-bold text-sm mb-2">Upcoming</h4>
            {history.upcoming.slice(0,6).map(b => (
              <div key={b._id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0">
                <div>
                  <div className="font-bold">{b.patientId?.patientName || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{b.surgeryDate?.slice(0,10)} • {b.otId?.otCode}</div>
                </div>
                  <div className="flex flex-col items-end">
                    <button onClick={() => navigate(`/ipd/patient/${b.admissionId?._id || b.admissionId}?tab=ot-records`)} className="text-xs text-blue-600">Patient</button>
                    <button onClick={() => navigate(`/ipd/ot-flow/${b.admissionId?._id || b.admissionId}`)} className="text-xs text-orange-600 font-bold">OT Flow</button>
                    <button onClick={() => navigate(`/ipd/ot/${b.admissionId?._id || b.admissionId}?otId=${b.otRecordId?._id || ''}`)} className="text-xs text-gray-600">OT</button>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSchedulingModal && selectedOtRecord && (
        <OtSchedulingModal
          otRecord={selectedOtRecord}
          admissionId={selectedAdmissionId}
          onClose={() => {
            setShowSchedulingModal(false);
            setSelectedOtRecord(null);
            setSelectedAdmissionId(null);
          }}
          onScheduleSuccess={() => {
            loadBookings();
            loadDashboard();
          }}
        />
      )}
    </div>
  );
};

export default IpdOtDashboard;