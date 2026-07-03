import { useEffect, useState, useCallback } from 'react';
import { 
  Activity, 
  Pill, 
  FlaskConical, 
  ClipboardList, 
  Clock, 
  User, 
  RefreshCw, 
  Search,
  Calendar,
  AlertCircle
} from 'lucide-react';
import client from '../../api/client';

const IpdServicesTracker = ({ admissionId }) => {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('all-summary');
  
  // Data States
  const [consumables, setConsumables] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [administrations, setAdministrations] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        consumableRes, 
        medicineRes, 
        labTestRes, 
        adminRes, 
        timelineRes
      ] = await Promise.all([
        client.get(`/ipd/services/consumables/${admissionId}`).catch(() => ({ data: [] })),
        client.get(`/ipd/services/medicines/${admissionId}`).catch(() => ({ data: [] })),
        client.get(`/ipd/services/lab-tests/${admissionId}`).catch(() => ({ data: [] })),
        client.get(`/ipd/medication-administrations/${admissionId}`).catch(() => ({ data: [] })),
        client.get(`/ipd/services/timeline/${admissionId}`).catch(() => ({ data: [] }))
      ]);

      setConsumables(consumableRes.data || []);
      setMedicines(medicineRes.data || []);
      setLabTests(labTestRes.data || []);
      setAdministrations(adminRes.data || []);
      setTimeline(timelineRes.data || []);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    } finally {
      setLoading(false);
    }
  }, [admissionId]);

  useEffect(() => {
    if (admissionId) {
      fetchData();
    }
  }, [admissionId, fetchData]);

  // Combine items into a chronological log
  const getChronologicalActivities = () => {
    const activities = [];

    consumables.forEach(c => {
      activities.push({
        type: 'consumable',
        name: c.serviceName,
        details: `Quantity: ${c.quantity}`,
        performedBy: c.addedBy?.doctorName || c.addedBy?.username || 'Staff',
        date: c.date,
        time: c.time,
        timestamp: new Date(`${c.date}T${c.time || '00:00'}`)
      });
    });

    medicines.forEach(m => {
      activities.push({
        type: 'medicine',
        name: m.medicineName,
        details: `Administered Quantity: ${m.quantity}`,
        performedBy: m.addedBy?.doctorName || m.addedBy?.username || 'Staff',
        date: m.date,
        time: m.time,
        timestamp: new Date(`${m.date}T${m.time || '00:00'}`)
      });
    });

    labTests.forEach(l => {
      activities.push({
        type: 'lab-test',
        name: l.testName,
        details: `Category: ${l.testCategory} | Status: ${l.reportStatus}`,
        performedBy: l.addedBy?.doctorName || l.addedBy?.username || 'Staff',
        date: l.date,
        time: l.time || '00:00',
        timestamp: new Date(`${l.date}T${l.time || '00:00'}`)
      });
    });

    administrations.forEach(a => {
      const performedName = a.administeredBy?.doctorName || a.administeredBy?.username || 'Staff';
      activities.push({
        type: 'medication-chart',
        name: `${a.medicineName} (${a.dose || 'N/A'})`,
        details: `Medication Chart Slot: ${a.slotName || 'N/A'} | Status: ${a.status} | Remarks: ${a.remarks || 'None'}`,
        performedBy: performedName,
        date: a.date,
        time: a.time,
        timestamp: new Date(`${a.date}T${a.time || '00:00'}`)
      });
    });

    // Sort by timestamp descending
    return activities.sort((a, b) => b.timestamp - a.timestamp);
  };

  const chronologicalActivities = getChronologicalActivities();

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="card p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Patient Services Tracker Dashboard
          </h2>
          <p className="text-xs opacity-90 mt-0.5">Comprehensive chronological auditing of consumables, tests, medicines, and drug charts.</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="btn-secondary py-1.5 px-3 bg-white/20 text-white hover:bg-white/30 border-none text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="card p-12 text-center text-gray-500 font-medium">
          <RefreshCw className="h-6 w-6 animate-spin text-orange-500 mx-auto mb-2" />
          Loading patient tracker details...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns - Detailed Category Auditing */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Auditing Navigation Subtabs */}
            <div className="flex gap-2 border-b border-orange-100 pb-2 overflow-x-auto">
              <button 
                onClick={() => setActiveSubTab('all-summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'all-summary' ? 'bg-orange-100 text-orange-800' : 'text-gray-500 hover:bg-orange-50'}`}
              >
                Category Summary
              </button>
              <button 
                onClick={() => setActiveSubTab('medicines')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'medicines' ? 'bg-orange-100 text-orange-800 font-black' : 'text-gray-500 hover:bg-orange-50'}`}
              >
                Medicines Administered ({medicines.length})
              </button>
              <button 
                onClick={() => setActiveSubTab('med-chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'med-chart' ? 'bg-orange-100 text-orange-800' : 'text-gray-500 hover:bg-orange-50'}`}
              >
                Medication Chart Logs ({administrations.length})
              </button>
              <button 
                onClick={() => setActiveSubTab('consumables')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'consumables' ? 'bg-orange-100 text-orange-800' : 'text-gray-500 hover:bg-orange-50'}`}
              >
                Consumables Used ({consumables.length})
              </button>
              <button 
                onClick={() => setActiveSubTab('lab-tests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'lab-tests' ? 'bg-orange-100 text-orange-800' : 'text-gray-500 hover:bg-orange-50'}`}
              >
                Lab Tests Ordered ({labTests.length})
              </button>
            </div>

            {/* Content Renders */}

            {activeSubTab === 'all-summary' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 border border-orange-100 bg-white space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="font-bold uppercase tracking-wider">Medicines Given</span>
                    <Pill className="text-orange-500 h-4 w-4" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{medicines.length}</div>
                  <p className="text-[10px] text-gray-400">Total doses administered from ward stocks.</p>
                </div>

                <div className="card p-4 border border-orange-100 bg-white space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="font-bold uppercase tracking-wider">Drug Chart Logs</span>
                    <ClipboardList className="text-blue-500 h-4 w-4" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{administrations.length}</div>
                  <p className="text-[10px] text-gray-400">Chart slots confirmed or skipped by nursing staff.</p>
                </div>

                <div className="card p-4 border border-orange-100 bg-white space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="font-bold uppercase tracking-wider">Consumables Used</span>
                    <Activity className="text-green-500 h-4 w-4" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{consumables.length}</div>
                  <p className="text-[10px] text-gray-400">Billed consumable items / procedural kits added.</p>
                </div>

                <div className="card p-4 border border-orange-100 bg-white space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="font-bold uppercase tracking-wider">Lab Tests</span>
                    <FlaskConical className="text-purple-500 h-4 w-4" />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{labTests.length}</div>
                  <p className="text-[10px] text-gray-400">Laboratory test orders submitted for execution.</p>
                </div>
              </div>
            )}

            {activeSubTab === 'medicines' && (
              <div className="card overflow-hidden bg-white border border-orange-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-orange-50/50 font-bold uppercase text-gray-500 border-b border-orange-100 text-[10px]">
                        <th className="p-3 pl-4">Date/Time</th>
                        <th className="p-3">Medicine Name</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Administered By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {medicines.length === 0 ? (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-400 italic">No administered medicines recorded.</td></tr>
                      ) : (
                        medicines.map((m, idx) => (
                          <tr key={idx} className="hover:bg-orange-50/10">
                            <td className="p-3 pl-4 font-semibold text-gray-500">{m.date} | {m.time || 'N/A'}</td>
                            <td className="p-3 font-bold text-gray-800">{m.medicineName}</td>
                            <td className="p-3 font-mono font-bold text-orange-700">{m.quantity}</td>
                            <td className="p-3 text-gray-600 font-semibold">
                              <span className="inline-flex items-center gap-1"><User className="h-3 w-3 text-orange-500" /> {m.addedBy?.doctorName || m.addedBy?.username || 'Staff'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSubTab === 'med-chart' && (
              <div className="card overflow-hidden bg-white border border-orange-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-orange-50/50 font-bold uppercase text-gray-500 border-b border-orange-100 text-[10px]">
                        <th className="p-3 pl-4">Date/Time</th>
                        <th className="p-3">Medicine Name</th>
                        <th className="p-3">Slot</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Confirmed By</th>
                        <th className="p-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {administrations.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-400 italic">No medication chart logs recorded.</td></tr>
                      ) : (
                        administrations.map((a, idx) => (
                          <tr key={idx} className="hover:bg-orange-50/10">
                            <td className="p-3 pl-4 font-semibold text-gray-500">{a.date} | {a.time || 'N/A'}</td>
                            <td className="p-3 font-bold text-gray-855">{a.medicineName} {a.dose && `(${a.dose})`}</td>
                            <td className="p-3 font-semibold text-blue-700 uppercase">{a.slotName}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                                a.status === 'Given' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="p-3 text-gray-600 font-semibold">
                              <span className="inline-flex items-center gap-1"><User className="h-3 w-3 text-blue-500" /> {a.administeredBy?.doctorName || a.administeredBy?.username || 'Staff'}</span>
                            </td>
                            <td className="p-3 text-gray-400 italic font-medium">{a.remarks || 'None'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSubTab === 'consumables' && (
              <div className="card overflow-hidden bg-white border border-orange-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-orange-50/50 font-bold uppercase text-gray-500 border-b border-orange-100 text-[10px]">
                        <th className="p-3 pl-4">Date/Time</th>
                        <th className="p-3">Service Name</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Billed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {consumables.length === 0 ? (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-400 italic">No consumable logs recorded.</td></tr>
                      ) : (
                        consumables.map((c, idx) => (
                          <tr key={idx} className="hover:bg-orange-50/10">
                            <td className="p-3 pl-4 font-semibold text-gray-500">{c.date} | {c.time || 'N/A'}</td>
                            <td className="p-3 font-bold text-gray-800">{c.serviceName}</td>
                            <td className="p-3 font-mono font-bold text-green-700">{c.quantity}</td>
                            <td className="p-3 text-gray-600 font-semibold">
                              <span className="inline-flex items-center gap-1"><User className="h-3 w-3 text-green-500" /> {c.addedBy?.doctorName || c.addedBy?.username || 'Staff'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSubTab === 'lab-tests' && (
              <div className="card overflow-hidden bg-white border border-orange-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-orange-50/50 font-bold uppercase text-gray-500 border-b border-orange-100 text-[10px]">
                        <th className="p-3 pl-4">Date</th>
                        <th className="p-3">Test Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Ordered By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {labTests.length === 0 ? (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic">No laboratory tests recorded.</td></tr>
                      ) : (
                        labTests.map((l, idx) => (
                          <tr key={idx} className="hover:bg-orange-50/10">
                            <td className="p-3 pl-4 font-semibold text-gray-500">{l.date}</td>
                            <td className="p-3 font-bold text-gray-800">{l.testName}</td>
                            <td className="p-3 font-semibold text-purple-700">{l.testCategory}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-800 border border-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                {l.reportStatus}
                              </span>
                            </td>
                            <td className="p-3 text-gray-600 font-semibold">
                              <span className="inline-flex items-center gap-1"><User className="h-3 w-3 text-purple-500" /> {l.addedBy?.doctorName || l.addedBy?.username || 'Staff'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Right Column - Chronological Activity Log */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Unified Service Timeline
            </h3>
            
            <div className="card p-4 bg-white border border-orange-100 max-h-[60vh] overflow-y-auto space-y-4 shadow-sm">
              {chronologicalActivities.length === 0 ? (
                <div className="text-center text-gray-400 italic text-xs py-8">
                  <AlertCircle className="h-6 w-6 mx-auto mb-1 opacity-40 text-orange-500" />
                  No events logged on the timeline yet.
                </div>
              ) : (
                <div className="relative border-l border-orange-200 pl-4 space-y-6">
                  {chronologicalActivities.map((act, index) => {
                    const Icon = act.type === 'medicine' ? Pill :
                                 act.type === 'medication-chart' ? ClipboardList :
                                 act.type === 'lab-test' ? FlaskConical : Activity;
                    const color = act.type === 'medicine' ? 'text-orange-500 bg-orange-50 border-orange-100' :
                                  act.type === 'medication-chart' ? 'text-blue-500 bg-blue-50 border-blue-100' :
                                  act.type === 'lab-test' ? 'text-purple-500 bg-purple-50 border-purple-100' :
                                  'text-green-500 bg-green-50 border-green-100';
                    return (
                      <div key={index} className="relative space-y-1">
                        {/* Timeline Node Icon */}
                        <span className={`absolute -left-[27px] top-0 rounded-full border p-1 shadow-sm ${color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-xs text-gray-900">{act.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {act.date} {act.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">{act.details}</p>
                        <p className="text-[10px] text-gray-400 font-bold">Logged by: {act.performedBy}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default IpdServicesTracker;
