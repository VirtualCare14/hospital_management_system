import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Stethoscope, Users, Trash2, Send, History, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';
import { useAuth } from '../../context/AuthContext';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('today'); // previous | today | upcoming | completed
  const [counts, setCounts] = useState(null);
  const [returnNotifications, setReturnNotifications] = useState([]);

  const fetchReturnNotifications = useCallback(() => {
    if (!user || user.role !== 'doctor') return;
    client.get(`/pharmacy/requests?status=Return Accepted&doctorNotifiedOfReturn=false&doctorId=${user._id}`)
      .then(({ data }) => setReturnNotifications(data))
      .catch((err) => console.error("Error fetching return notifications:", err));
  }, [user]);

  useEffect(() => {
    fetchReturnNotifications();
  }, [fetchReturnNotifications]);

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

  const refreshAll = () => {
    fetchPatients();
    fetchReturnNotifications();
    client.get('/consultation/stats').then(({ data }) => setCounts(data)).catch(() => setCounts(null));
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete patient and related records? This cannot be undone.');
    if (!ok) return;
    await client.delete(`/patients/${id}`);
    refreshAll();
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

  return (
    <div className="space-y-5">
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[{
          label: 'Total Patients', value: counts?.totalPatients
        }, {
          label: 'Previous Patients', value: counts?.previousPatientsCount
        }, {
          label: "Today's Patients", value: counts?.todaysPatientsCount
        }, {
          label: 'Upcoming Patients', value: counts?.upcomingPatientsCount
        }, {
          label: 'Consultation Completed', value: counts?.consultationCompletedCount
        }, {
          label: 'Pending OPD', value: counts?.pendingOpdCount
        }].map((card, idx) => (
          <div key={idx} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-2xl font-bold">{card.value ?? '-'}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Users className="text-orange-500" />
            <h2 className="font-bold text-gray-800">Patient List</h2>
          </div>
          <div className="flex gap-2 bg-orange-50/50 p-1.5 rounded-2xl border border-orange-100/50 flex-wrap">
            <button 
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                filter === 'previous' 
                  ? 'bg-slate-600 text-white shadow-md shadow-slate-600/20' 
                  : 'text-gray-600 hover:bg-slate-100 hover:text-slate-800'
              }`} 
              onClick={() => setFilter('previous')}
            >
              Previous
            </button>
            <button 
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                filter === 'today' 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'text-gray-600 hover:bg-orange-100/50 hover:text-orange-700'
              }`} 
              onClick={() => setFilter('today')}
            >
              Today
            </button>
            <button 
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                filter === 'upcoming' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`} 
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                filter === 'completed' 
                  ? 'bg-green-600 text-white shadow-md shadow-green-600/20' 
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`} 
              onClick={() => setFilter('completed')}
            >
              Completed Consultation
            </button>
          </div>
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
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="border-b">
                  <td className="p-3 font-semibold">{patient.patientName}</td>
                  <td className="p-3">{patient.uhid}</td>
                  <td className="p-3">{formatDate(patient.appointmentDate)} {patient.slot ? `(${patient.slot})` : ''}</td>
                  <td className="p-3">{patient.department}</td>
                  <td className="p-3">
                    {patient.consultationStatus === 'completed' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Completed</span>
                    ) : patient.slot === 'Follow-up' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Follow-up</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Pending</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {filter === 'completed' && patient.consultationId ? (
                        <Link className="btn-secondary text-xs inline-flex items-center gap-1 text-green-600 font-bold" to={`/doctor/completed/${patient.consultationId}`}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      ) : (
                        <>
                          <Link className="btn-secondary text-xs" to={`/doctor/consultation/${patient._id}`}><Stethoscope className="h-3 w-3" /> Consult</Link>
                          <Link className="btn text-xs" to={`/doctor/prescription/${patient._id}`}><FileText className="h-3 w-3" /> Rx</Link>
                        </>
                      )}
                      <Link className="btn-secondary text-xs text-green-600" to={`/doctor/consultation-track/${patient._id}`}><History className="h-3 w-3" /> Track</Link>
                      <button className="btn-secondary text-xs text-indigo-600" onClick={() => handleSendToOt(patient)}><Send className="h-3 w-3" /> OT</button>
                      <button className="btn-ghost text-red-600" onClick={() => handleDelete(patient._id)} title="Delete Patient"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && <tr><td colSpan={6} className="p-4 text-sm text-gray-500">No patients found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;