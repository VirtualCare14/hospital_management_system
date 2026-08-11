'use client';

import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  FlaskConical, 
  Building2, 
  UserCheck, 
  LogOut, 
  Activity, 
  FileText, 
  TestTube, 
  CheckCircle2, 
  Sliders, 
  Users, 
  Receipt,
  Server,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Search,
  Plus,
  Loader2,
  X,
  Edit3,
  Check,
  CalendarDays,
  User,
  Info
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Data States
  const [labRequests, setLabRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableLabTests, setAvailableLabTests] = useState([]);

  // Result Processing Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [parameterValues, setParameterValues] = useState({});
  const [reportRemarks, setReportRemarks] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  const loadDashboardData = async () => {
    setLoadingRequests(true);
    try {
      const [reqs, tests] = await Promise.all([
        api.get('/lab/requests').catch(() => []),
        api.get('/lab/tests').catch(() => [])
      ]);
      setLabRequests(Array.isArray(reqs) ? reqs : []);
      setAvailableLabTests(Array.isArray(tests) ? tests : []);
    } catch (err) {
      console.error('Failed to load lab dashboard data', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenProcessRequest = (reqItem) => {
    setSelectedRequest(reqItem);
    setReportRemarks(reqItem.report?.remarks || reqItem.report?.notes || '');
    
    // Find matching tests master to get parameters defined by admin
    const initialParams = {};
    const testNames = reqItem.tests || [];
    
    testNames.forEach(tName => {
      const matchedTest = availableLabTests.find(
        t => (t.title && t.title.toLowerCase() === tName.toLowerCase()) || (t.test && t.test.toLowerCase() === tName.toLowerCase())
      );

      if (matchedTest && Array.isArray(matchedTest.parameters)) {
        matchedTest.parameters.forEach(p => {
          // Check if report already has a saved parameter value
          const existingParam = reqItem.report?.parameters?.find(ep => ep.name === p.name);
          initialParams[p.name] = existingParam ? existingParam.value : '';
        });
      }
    });

    // Also copy existing report parameters if any
    if (Array.isArray(reqItem.report?.parameters)) {
      reqItem.report.parameters.forEach(p => {
        if (!initialParams[p.name]) initialParams[p.name] = p.value || '';
      });
    }

    setParameterValues(initialParams);
    setShowProcessModal(true);
  };

  const handleParamValueChange = (paramName, val) => {
    setParameterValues({
      ...parameterValues,
      [paramName]: val
    });
  };

  const handleSaveReport = async (statusToSet = 'completed') => {
    if (!selectedRequest) return;
    setSavingReport(true);
    try {
      const formattedParameters = Object.entries(parameterValues).map(([pName, pVal]) => {
        // Look up ref range & unit from available tests
        let refRange = '';
        let unit = '';
        availableLabTests.forEach(t => {
          if (Array.isArray(t.parameters)) {
            const found = t.parameters.find(p => p.name === pName);
            if (found) {
              refRange = found.referenceRange || '';
              unit = found.unit || '';
            }
          }
        });
        return {
          name: pName,
          value: pVal,
          referenceRange: refRange,
          unit: unit
        };
      });

      const endpoint = statusToSet === 'completed'
        ? `/lab/requests/${selectedRequest._id}/report-generate`
        : `/lab/requests/${selectedRequest._id}/report-draft`;

      await api.post(endpoint, {
        parameters: formattedParameters,
        remarks: reportRemarks,
        notes: reportRemarks
      });

      setShowProcessModal(false);
      loadDashboardData();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save test report');
    } finally {
      setSavingReport(false);
    }
  };

  const filteredRequests = labRequests.filter(r => 
    (r.patientId?.patientName && r.patientId.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.patientId?.uhid && r.patientId.uhid.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.labId && r.labId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">

        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 border border-orange-400 p-8 shadow-xl shadow-orange-500/15 text-white">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30 backdrop-blur-sm mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Laboratory Request & Result Entry
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Laboratory User Workspace
              </h2>
              <p className="text-orange-50 text-sm mt-2 max-w-2xl font-medium leading-relaxed opacity-95">
                Process doctor test requests, input parameter values defined by Lab Admin (<span className="font-bold text-white underline">ravilab</span>), and generate verified patient diagnostic reports.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin')}
                className="px-5 py-3 bg-white text-orange-600 hover:bg-orange-50 font-black rounded-xl shadow-lg text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Sliders className="w-4 h-4 text-orange-600" />
                <span>Lab Admin (Manage Tests)</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Name</span>
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 truncate">{user?.hospitalName || 'Hospital'}</p>
            <p className="text-xs font-semibold text-orange-600 mt-1">Multi-tenant Facility</p>
          </div>

          <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">User Account</span>
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 capitalize">{user?.username}</p>
            <p className="text-xs font-semibold text-amber-700 mt-1 capitalize">Role: {user?.role || 'Lab Personnel'}</p>
          </div>

          <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Tests Catalog</span>
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <TestTube className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900">{availableLabTests.length} Tests Defined</p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">Configured by Lab Admin</p>
          </div>

          <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Orders</span>
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900">{labRequests.length} Active Orders</p>
            <p className="text-xs font-semibold text-indigo-700 mt-1">Ready for result entry</p>
          </div>
        </div>

        {/* Incoming Lab Requests & Parameter Fill Section */}
        <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" /> Incoming Lab Test Requests
              </h3>
              <p className="text-xs text-slate-500 font-medium">Select a patient request to fill test parameters and generate reports</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, UHID, Lab ID..."
                className="w-full pl-9 pr-4 py-2 bg-orange-50/20 border border-orange-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-orange-50/60 text-xs font-black uppercase text-slate-600 border-b border-orange-100">
                  <th className="p-3.5 rounded-l-xl">Lab ID</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Ordered Tests</th>
                  <th className="p-3.5">Booking Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 font-medium">
                {loadingRequests ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                      <p className="text-xs text-slate-500 font-semibold mt-2">Loading test requests...</p>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">
                      <FlaskConical className="w-10 h-10 mx-auto text-orange-300 mb-2" />
                      <p className="font-bold text-slate-600">No Test Requests Pending</p>
                      <p className="text-xs mt-1">Doctor lab orders will appear here automatically.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3.5 font-mono text-xs font-bold text-orange-700">
                        {req.labId || 'LAB-REQ'}
                      </td>
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 block">{req.patientId?.patientName || 'Patient'}</span>
                        <span className="text-[11px] text-slate-500 font-medium">UHID: {req.patientId?.uhid || 'N/A'} • {req.patientId?.gender || ''} {req.patientId?.age ? `(${req.patientId.age}y)` : ''}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(req.tests) && req.tests.map((tName, i) => (
                            <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md text-xs font-extrabold border border-orange-200">
                              {tName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-xs text-slate-600">
                        {req.bookingDate ? new Date(req.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-3.5 text-xs">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          req.reportStatus === 'Completed' || req.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {req.reportStatus || req.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleOpenProcessRequest(req)}
                          className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Fill Parameters</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Parameter Entry Modal */}
      {showProcessModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-orange-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase bg-orange-100 text-orange-700 rounded-md">
                  {selectedRequest.labId}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Fill Test Parameters — {selectedRequest.patientId?.patientName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Enter test values for parameter fields defined by Lab Admin
                </p>
              </div>
              <button onClick={() => setShowProcessModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Fields Form */}
            <div className="space-y-5">
              <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Ordered Tests: </span>
                  <span className="font-bold text-slate-900">{selectedRequest.tests?.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-500">UHID: </span>
                  <span className="font-bold text-orange-700">{selectedRequest.patientId?.uhid}</span>
                </div>
              </div>

              {/* Dynamic Parameter Input Fields */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Diagnostic Parameter Results
                </h4>

                {Object.keys(parameterValues).length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>No pre-configured parameters found for these tests. You can enter remarks below or add tests in <strong className="cursor-pointer underline" onClick={() => router.push('/admin')}>Lab Admin Portal</strong>.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {Object.keys(parameterValues).map((pName) => {
                      // Find reference range & unit for helper display
                      let refRange = '';
                      let unit = '';
                      availableLabTests.forEach(t => {
                        if (Array.isArray(t.parameters)) {
                          const found = t.parameters.find(p => p.name === pName);
                          if (found) {
                            refRange = found.referenceRange || '';
                            unit = found.unit || '';
                          }
                        }
                      });

                      return (
                        <div key={pName} className="p-3 bg-white border border-orange-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                          <div className="sm:w-1/2">
                            <label className="block text-xs font-bold text-slate-800">{pName}</label>
                            {(refRange || unit) && (
                              <span className="text-[11px] text-slate-500">
                                {refRange ? `Ref: ${refRange}` : ''} {unit ? `(${unit})` : ''}
                              </span>
                            )}
                          </div>
                          <div className="sm:w-1/2">
                            <input
                              type="text"
                              placeholder={`Enter ${pName} result...`}
                              value={parameterValues[pName] || ''}
                              onChange={(e) => handleParamValueChange(pName, e.target.value)}
                              className="w-full px-3.5 py-2 bg-orange-50/20 border border-orange-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Technician Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pathologist / Lab Technician Remarks & Notes
                </label>
                <textarea
                  rows="3"
                  value={reportRemarks}
                  onChange={(e) => setReportRemarks(e.target.value)}
                  placeholder="Enter interpretation, sample condition, or lab notes..."
                  className="w-full p-3 bg-orange-50/20 border border-orange-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-orange-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingReport}
                  onClick={() => handleSaveReport('draft')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={savingReport}
                  onClick={() => handleSaveReport('completed')}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  {savingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Generate Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

