'use client';

import { useState, useEffect } from 'react';
import {
  Stethoscope, Users, CheckCircle2, Clock, Calendar,
  Search, RefreshCw, Printer, Eye, ChevronRight, Activity, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import ConsultationModal from './ConsultationModal';
import PrintRxModal from './PrintRxModal';

export default function DoctorDashboardView({ onNavigate }) {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ todayCount: 0, pendingCount: 0, completedCount: 0, totalCount: 0 });
  const [filter, setFilter] = useState('today'); // today | pending | completed | all
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Active consultation / print modals
  const [consultingPatient, setConsultingPatient] = useState(null);
  const [printRxPatient, setPrintRxPatient] = useState(null);
  const [printRxData, setPrintRxData] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/consultation/appointments?filter=${filter}`);
      setPatients(Array.isArray(res) ? res : res?.appointments || []);
      const statsRes = await apiRequest('/consultation/stats');
      if (statsRes) setStats(statsRes);
    } catch (err) {
      console.error('Fetch doctor queue error:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const filteredPatients = patients.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (p.patientName && p.patientName.toLowerCase().includes(term)) ||
      (p.uhid && String(p.uhid).toLowerCase().includes(term)) ||
      (p.mobile && String(p.mobile).includes(term))
    );
  });

  const handleConsultationSuccess = (patient, prescriptionData) => {
    fetchQueue();
    // Open Print Rx Modal immediately
    setPrintRxPatient(patient);
    setPrintRxData(prescriptionData);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Doctor Stats */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Doctor Consultation Desk</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Manage OPD queue, conduct clinical consults, prescribe digital Rx</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-orange-50 border border-orange-200 rounded-xl text-center">
            <span className="text-[10px] uppercase tracking-wider text-orange-600 font-bold block">Today's Queue</span>
            <span className="text-base font-black text-orange-700">{stats.todayCount || 0}</span>
          </div>
          <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold block">Waiting / Pending</span>
            <span className="text-base font-black text-blue-700">{stats.pendingCount || 0}</span>
          </div>
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold block">Completed</span>
            <span className="text-base font-black text-emerald-700">{stats.completedCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl">
          {[
            { id: 'today', label: `Today's Appointments` },
            { id: 'pending', label: 'Pending Consultations' },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All Cases' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, UHID, mobile..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">UHID / Patient</th>
                <th className="py-3.5 px-4">Gender & Age</th>
                <th className="py-3.5 px-4">Doctor & Dept</th>
                <th className="py-3.5 px-4">Date & Slot</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading patient queue...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No patients currently in this queue.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const docName = patient.doctorId?.doctorName || patient.doctorId?.username || 'Doctor';
                  const isCompleted = patient.status === 'Completed';

                  return (
                    <tr key={patient._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-orange-600 block">{formatUhid(patient.uhid)}</span>
                        <span className="font-bold text-gray-900">{patient.patientName}</span>
                        <span className="text-[11px] text-gray-500 block">{patient.mobile || '-'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-800">{patient.gender}</span>
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
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {patient.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setConsultingPatient(patient)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            {isCompleted ? 'Edit Rx / Consult' : 'Start Consult'}
                          </button>

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await apiRequest(`/consultation/${patient._id}`);
                                  setPrintRxPatient(patient);
                                  setPrintRxData({
                                    ...(res?.consultation || {}),
                                    medicines: res?.prescription?.medicines || []
                                  });
                                } catch (err) {
                                  toast.error('Failed to load prescription');
                                }
                              }}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg border border-orange-200 transition-colors cursor-pointer"
                              title="Print Rx"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consultation Modal */}
      {consultingPatient && (
        <ConsultationModal
          patient={consultingPatient}
          onClose={() => setConsultingPatient(null)}
          onSuccess={handleConsultationSuccess}
        />
      )}

      {/* Print Rx Modal */}
      {printRxPatient && (
        <PrintRxModal
          patient={printRxPatient}
          prescription={printRxData}
          onClose={() => {
            setPrintRxPatient(null);
            setPrintRxData(null);
          }}
        />
      )}
    </div>
  );
}
