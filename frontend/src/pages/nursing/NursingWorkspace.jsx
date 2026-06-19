import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity, Search, User, Loader2, Eye,
  Plus, Stethoscope, CalendarDays, Phone, Clock,
  RefreshCw, Bandage, Bone, Flame, Droplets, Wind, Syringe,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const TREATMENT_ICONS = {
  'Fracture': Bone,
  'Minor Injury': Bandage,
  'Minor Stitches': Syringe,
  'Small Burns': Flame,
  'Mild Allergic Reactions': Wind,
  'Dialysis': Droplets
};

const TREATMENTS = [
  { id: 'Fracture', label: 'Fracture', icon: Bone },
  { id: 'Minor Injury', label: 'Minor Injury', icon: Bandage },
  { id: 'Minor Stitches', label: 'Minor Stitches', icon: Syringe },
  { id: 'Small Burns', label: 'Small Burns', icon: Flame },
  { id: 'Mild Allergic Reactions', label: 'Mild Allergic Reactions', icon: Wind },
  { id: 'Dialysis', label: 'Dialysis (Coming Soon)', icon: Droplets },
];

const NursingWorkspace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');
  const [patients, setPatients] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showTreatmentList, setShowTreatmentList] = useState(false);
  const [patientTreatments, setPatientTreatments] = useState([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : '';
      const { data } = await client.get(`/patients${params}`);
      setPatients(data || []);
    } catch (err) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async () => {
    setLoadingQueue(true);
    try {
      const { data } = await client.get('/nursing/treatment?status=Draft');
      setQueue(data || []);
    } catch (err) {
      toast.error('Failed to load treatment queue');
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([loadQueue(), loadPatients()]);
  };

  useEffect(() => { loadAllData(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadPatients();
  };

  const loadPatientTreatments = async (patient) => {
    setTreatmentsLoading(true);
    setSelectedPatient(patient);
    setShowTreatmentList(true);
    try {
      const { data } = await client.get(`/nursing/treatment/patient/${patient._id}`);
      setPatientTreatments(data || []);
    } catch (err) {
      toast.error('Failed to load treatments');
    } finally {
      setTreatmentsLoading(false);
    }
  };

  const handleNewTreatment = (treatmentType) => {
    if (treatmentType === 'Dialysis') {
      toast('Dialysis form will be available soon', { icon: '⏳' });
      return;
    }
    navigate(`/nursing/treatment/${selectedPatient._id}?type=${treatmentType}`);
  };

  const handleViewTreatment = (record) => {
    navigate(`/nursing/treatment/${record.patientId?._id || record.patientId}?type=${record.treatmentType}&recordId=${record._id}&view=true`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Nursing Module</h1>
          <p className="text-sm text-gray-500">Same Day Treatment - Nursing Care</p>
        </div>
        <button onClick={loadAllData} className="btn-secondary text-sm py-2 px-4">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {!showTreatmentList ? (
        <>
          {/* Tabs Menu */}
          <div className="flex bg-orange-50/50 p-1 rounded-xl border border-orange-100 w-fit mb-4">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'queue' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <Clock className="h-4 w-4" /> Same Day Treatment Queue ({queue.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <User className="h-4 w-4" /> All Patients (Lookup)
            </button>
          </div>

          {activeTab === 'queue' ? (
            /* Same Day Treatment Queue Table */
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-orange-100 bg-orange-50/30">
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><Clock className="h-5 w-5 text-orange-500" /> Same Day Treatment Queue</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                      <th className="p-3 pl-4">Patient Name</th>
                      <th className="p-3">UHID</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Age</th>
                      <th className="p-3">Treatment Type</th>
                      <th className="p-3">Assigned Date</th>
                      <th className="p-3 pr-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {loadingQueue ? (
                      <tr><td colSpan="8" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</td></tr>
                    ) : queue.length === 0 ? (
                      <tr><td colSpan="8" className="p-8 text-center text-gray-400"><Clock className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No patients in the queue</p></td></tr>
                    ) : (
                      queue.map(item => (
                        <tr key={item._id} className="hover:bg-orange-50/20">
                          <td className="p-3 pl-4 font-bold text-gray-800">{item.patientName}</td>
                          <td className="p-3 font-mono text-xs font-bold text-orange-700">{formatUhid(item.uhid)}</td>
                          <td className="p-3 text-xs">{item.mobile}</td>
                          <td className="p-3 text-xs">{item.gender}</td>
                          <td className="p-3 text-xs">{item.age ? `${item.age} years` : '-'}</td>
                          <td className="p-3 text-xs font-semibold">{item.treatmentType}</td>
                          <td className="p-3 text-xs">{new Date(item.treatmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-3 pr-4 text-center">
                            <button onClick={() => navigate(`/nursing/treatment/${item.patientId}?type=${item.treatmentType}&recordId=${item._id}`)} className="btn text-xs py-1.5 px-3">
                              <Activity className="h-3.5 w-3.5" /> Treat
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {/* Patient Search */}
              <div className="card p-4">
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input type="text" className="input pl-9 py-2.5" placeholder="Search patients by name, UHID, or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && <button type="button" onClick={() => { setSearch(''); loadPatients(); }} className="absolute right-2 top-2 p-1"><X className="h-4 w-4" /></button>}
                  </div>
                  <button type="submit" className="btn py-2.5 px-6"><Search className="h-4 w-4" /> Search</button>
                </form>
              </div>

              {/* Recent Patients Quick Access - Treatment Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {TREATMENTS.map(t => {
                  const Icon = t.icon;
                  return (
                    <div key={t.id} className="card p-4 text-center hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-orange-200" onClick={() => {
                      if (t.id === 'Dialysis') { toast('Dialysis form coming soon', { icon: '⏳' }); return; }
                      toast(`Search and select a patient first, then click "Treat".`, { icon: 'ℹ️' });
                    }}>
                      <Icon className={`h-8 w-8 mx-auto mb-1 ${t.id === 'Dialysis' ? 'text-gray-300' : 'text-orange-500'}`} />
                      <span className="block text-[10px] font-bold uppercase text-gray-600 leading-tight">{t.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Patient List */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-orange-100 bg-orange-50/30">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><User className="h-5 w-5 text-orange-500" /> All Registered Patients</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                        <th className="p-3 pl-4">Patient Name</th>
                        <th className="p-3">UHID</th>
                        <th className="p-3">Mobile</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Department</th>
                        <th className="p-3 pr-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {loading ? (
                        <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</td></tr>
                      ) : patients.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-400"><User className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No patients found</p></td></tr>
                      ) : (
                        patients.map(p => (
                          <tr key={p._id} className="hover:bg-orange-50/20">
                            <td className="p-3 pl-4 font-bold text-gray-800">{p.patientName}</td>
                            <td className="p-3 font-mono text-xs font-bold text-orange-700">{formatUhid(p.uhid)}</td>
                            <td className="p-3 text-xs">{p.mobile}</td>
                            <td className="p-3 text-xs">{p.gender}</td>
                            <td className="p-3 text-xs">{p.department || '-'}</td>
                            <td className="p-3 pr-4 text-center">
                              <button onClick={() => loadPatientTreatments(p)} className="btn text-xs py-1.5 px-3">
                                <Activity className="h-3.5 w-3.5" /> Treat
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* Patient Treatment View */
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowTreatmentList(false); setSelectedPatient(null); }} className="btn-secondary text-xs py-2 px-3">
              <RefreshCw className="h-3.5 w-3.5" /> Back to Patients
            </button>
          </div>

          {/* Patient Info */}
          <div className="card p-5 bg-gradient-to-br from-orange-50 to-white border-orange-200">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 text-white p-3 rounded-2xl">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">{selectedPatient?.patientName || 'Patient'}</h2>
                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                  <span className="font-mono font-bold text-orange-700">{formatUhid(selectedPatient?.uhid)}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedPatient?.mobile}</span>
                  <span>{selectedPatient?.gender}</span>
                  {selectedPatient?.dob && (
                    <span>{Math.floor((new Date() - new Date(selectedPatient.dob)) / (365.25 * 24 * 60 * 60 * 1000))} years</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Treatment Selection Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {TREATMENTS.filter(t => t.id !== 'Dialysis').map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => handleNewTreatment(t.id)}
                  className="card p-4 text-center hover:shadow-md transition-all border-2 border-transparent hover:border-orange-300 hover:bg-orange-50 cursor-pointer">
                  <Icon className="h-8 w-8 mx-auto mb-1 text-orange-500" />
                  <span className="block text-[10px] font-bold uppercase text-gray-700">{t.label}</span>
                </button>
              );
            })}
            <button onClick={() => toast('Dialysis form coming soon', { icon: '⏳' })}
              className="card p-4 text-center border-2 border-dashed border-gray-200 cursor-pointer hover:border-gray-300">
              <Droplets className="h-8 w-8 mx-auto mb-1 text-gray-300" />
              <span className="block text-[10px] font-bold uppercase text-gray-400">Dialysis</span>
              <span className="block text-[8px] text-amber-500">Coming Soon</span>
            </button>
          </div>

          {/* Existing Treatment Records */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-orange-100 bg-orange-50/30">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><Activity className="h-5 w-5 text-orange-500" /> Treatment History</h3>
            </div>
            {treatmentsLoading ? (
              <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</div>
            ) : patientTreatments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-bold">No treatment records found</p>
                <p className="text-xs">Select a treatment type above to create the first record</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                      <th className="p-3 pl-4">Date</th>
                      <th className="p-3">Treatment Type</th>
                      <th className="p-3">Diagnosis</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created By</th>
                      <th className="p-3 pr-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {patientTreatments.map(r => (
                      <tr key={r._id} className="hover:bg-orange-50/20">
                        <td className="p-3 pl-4 text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="p-3 font-bold text-gray-800 text-xs">{r.treatmentType}</td>
                        <td className="p-3 text-xs max-w-[200px] truncate">{r.diagnosis || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {r.status === 'Completed' ? 'Completed' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-500">{r.createdBy?.doctorName || r.createdBy?.username || '-'}</td>
                        <td className="p-3 pr-4 text-center">
                          <button onClick={() => handleViewTreatment(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NursingWorkspace;