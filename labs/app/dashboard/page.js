'use client';

import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  Loader2, 
  X, 
  Edit3, 
  Check, 
  Info, 
  Box as BoxIcon,
  Sliders,
  Activity,
  ArrowLeft,
  Receipt,
  FileText,
  DollarSign
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDueReportsView = searchParams.get('view') === 'due-reports';

  // Data States
  const [labRequests, setLabRequests] = useState([]);
  const [availableLabTests, setAvailableLabTests] = useState([]);
  const [labBills, setLabBills] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dueSearchQuery, setDueSearchQuery] = useState('');

  // Result Processing Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [parameterValues, setParameterValues] = useState({});
  const [reportRemarks, setReportRemarks] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  // Payment Collection Modal State
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const isAdminUser = user?.role === 'admin' || user?.role === 'lab_admin' || user?.role === 'superadmin';

  const loadDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const [reqs, tests, bills] = await Promise.all([
        api.get('/lab/requests').catch(() => []),
        api.get('/lab/tests').catch(() => []),
        api.get('/lab/bills').catch(() => [])
      ]);
      setLabRequests(Array.isArray(reqs) ? reqs : []);
      setAvailableLabTests(Array.isArray(tests) ? tests : []);
      setLabBills(Array.isArray(bills) ? bills : []);
    } catch (err) {
      console.error('Failed to load lab dashboard data', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenProcessRequest = (reqItem) => {
    setSelectedRequest(reqItem);
    setReportRemarks(reqItem.report?.remarks || reqItem.report?.notes || '');
    
    const initialParams = {};
    const testNames = reqItem.tests || [];
    
    testNames.forEach(tName => {
      const matchedTest = availableLabTests.find(
        t => (t.title && t.title.toLowerCase() === tName.toLowerCase()) || (t.test && t.test.toLowerCase() === tName.toLowerCase())
      );

      if (matchedTest && Array.isArray(matchedTest.parameters)) {
        matchedTest.parameters.forEach(p => {
          const existingParam = reqItem.report?.parameters?.find(ep => ep.name === p.name);
          initialParams[p.name] = existingParam ? existingParam.value : '';
        });
      }
    });

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

  // Payment Handling
  const handleOpenPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setPaymentAmount(bill.dueAmount || bill.totalAmount || 0);
    setPaymentMode('Cash');
    setPaymentRef('');
    setShowPaymentModal(true);
  };

  const handleReceivePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBillForPayment) return;
    setSubmittingPayment(true);
    try {
      await api.post(`/lab/bills/${selectedBillForPayment._id}/payments`, {
        amount: Number(paymentAmount),
        paymentMethod: paymentMode,
        transactionRef: paymentRef,
        remarks: 'Payment received from lab dashboard'
      });
      setShowPaymentModal(false);
      loadDashboardData();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // 1. OPD Requests that are PAID / cleared (Exclude unpaid requests until bill is paid)
  const paidInvestigationRequests = labRequests.filter(r => {
    const matchedBill = labBills.find(b => b.labRequestId === r._id || b.labId === r.labId);
    if (matchedBill && (matchedBill.dueAmount > 0 || matchedBill.paymentStatus === 'Unpaid')) {
      return false;
    }

    const search = searchQuery.toLowerCase();
    const nameMatch = r.patientId?.patientName?.toLowerCase().includes(search);
    const uhidMatch = r.patientId?.uhid?.toLowerCase().includes(search);
    const labIdMatch = r.labId?.toLowerCase().includes(search);

    return !searchQuery || nameMatch || uhidMatch || labIdMatch;
  });

  // 2. Unpaid or Partial due bills
  const dueBills = labBills.filter(b => (b.dueAmount > 0 || b.paymentStatus === 'Unpaid' || b.paymentStatus === 'Partial'));

  const filteredDueBills = dueBills.filter(b => {
    const search = dueSearchQuery.toLowerCase();
    const nameMatch = b.patientId?.patientName?.toLowerCase().includes(search);
    const uhidMatch = b.patientId?.uhid?.toLowerCase().includes(search);
    const billNoMatch = (b.billNo || b.labId)?.toLowerCase().includes(search);
    return !dueSearchQuery || nameMatch || uhidMatch || billNoMatch;
  });

  const totalDueAmount = dueBills.reduce((acc, b) => acc + (b.dueAmount || 0), 0);

  // 3. Today's transactions
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = labBills.filter(b => {
    const billDate = b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : '';
    return billDate === todayStr || (Array.isArray(b.payments) && b.payments.some(p => p.date && new Date(p.date).toISOString().split('T')[0] === todayStr));
  });

  // 4. Recent activities list
  const recentActivities = labRequests
    .filter(r => r.reportStatus === 'Completed' || r.reportStatus === 'Ready' || r.status === 'completed')
    .slice(0, 5);

  // IF DUE REPORTS VIEW IS SELECTED FROM SIDEBAR OR "VIEW ALL" ON PAYMENTS DUE
  if (isDueReportsView) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" /> Business — Due Reports
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  View and manage all outstanding patient due amounts across lab billing records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-right">
                <span className="text-[11px] text-red-600 font-semibold block uppercase">Total Pending Dues</span>
                <span className="text-lg font-black text-red-700">₹{totalDueAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={dueSearchQuery}
                onChange={(e) => setDueSearchQuery(e.target.value)}
                placeholder="Search due report by patient name, UHID, Bill/Lab ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold shrink-0">
              Showing {filteredDueBills.length} of {dueBills.length} Due Records
            </span>
          </div>

          {/* Due Reports Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                    <th className="p-4">Bill / Lab ID</th>
                    <th className="p-4">Patient Details</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-right">Paid Amount</th>
                    <th className="p-4 text-right">Due Amount</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingDashboard ? (
                    <tr>
                      <td colSpan="8" className="p-10 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                        <p className="text-xs text-slate-500 font-semibold mt-2">Loading due reports...</p>
                      </td>
                    </tr>
                  ) : filteredDueBills.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-slate-400">
                        <Check className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                        <p className="font-bold text-slate-700">No Outstanding Dues Found</p>
                        <p className="text-xs text-slate-400 mt-1">All patient dues have been fully settled.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDueBills.map((bill) => (
                      <tr key={bill._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-orange-600">
                          {bill.billNo || bill.labId || 'BILL-REQ'}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{bill.patientId?.patientName || 'Patient'}</span>
                          <span className="text-[11px] text-slate-500 font-medium">UHID: {bill.patientId?.uhid || 'N/A'} • {bill.patientId?.mobile || ''}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-600">
                          {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-800">
                          ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-semibold text-emerald-600">
                          ₹{(bill.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-black text-red-600 text-base">
                          ₹{(bill.dueAmount || bill.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-800">
                            {bill.paymentStatus || 'Unpaid'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenPaymentModal(bill)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                          >
                            Receive Payment
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Modal */}
          {showPaymentModal && selectedBillForPayment && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Receive Due Payment
                  </h3>
                  <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleReceivePaymentSubmit} className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Patient:</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedBillForPayment.patientId?.patientName}</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹)</label>
                    <input
                      type="number"
                      required
                      max={selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Max Due: ₹{selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount}
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="NetBanking">Net Banking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Transaction Ref / Txn ID (Optional)</label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. UPI-99882233"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPayment}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs flex items-center gap-1.5"
                    >
                      {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Confirm Payment</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // STANDARD 4-BOX DASHBOARD VIEW
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        
        {/* 4 Box Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* BOX 1: OPD lab investigation requests (Only show paid/cleared requests) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[340px]">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-150">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">OPD lab investigation requests</h3>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">For all time</p>
                </div>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View all
                </button>
              </div>

              {/* Search input for filtering requests */}
              <div className="mt-3 mb-3 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient, UHID, Lab ID..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Content */}
              {loadingDashboard ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium mt-2">Loading investigation requests...</p>
                </div>
              ) : paidInvestigationRequests.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <FlaskConical className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No active lab requests ready</p>
                  <p className="text-xs text-slate-400 mt-0.5">Paid OPD lab requests will appear here for parameter entry</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[220px] overflow-y-auto space-y-2 pr-1">
                  {paidInvestigationRequests.map((req) => (
                    <div 
                      key={req._id} 
                      className="p-3 bg-slate-50/80 hover:bg-orange-50/40 border border-slate-200/80 rounded-lg flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-orange-600 bg-orange-100/60 px-1.5 py-0.5 rounded">
                            {req.labId || 'LAB-REQ'}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {req.patientId?.patientName || 'Patient'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          Tests: {Array.isArray(req.tests) ? req.tests.join(', ') : 'N/A'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          UHID: {req.patientId?.uhid || 'N/A'} • {req.bookingDate ? new Date(req.bookingDate).toLocaleDateString('en-IN') : ''}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.reportStatus === 'Completed' || req.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {req.reportStatus || 'Ready for Test'}
                        </span>
                        <button
                          onClick={() => handleOpenProcessRequest(req)}
                          className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Fill Params</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BOX 2: Payments due */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[340px]">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-150">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Payments due</h3>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">For all time</p>
                </div>
                <button 
                  onClick={() => router.push('/dashboard?view=due-reports')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View all
                </button>
              </div>

              {/* Content */}
              {loadingDashboard ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                </div>
              ) : dueBills.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3 shadow-2xs">
                    <Check className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">All dues are cleared.</p>
                </div>
              ) : (
                <div className="mt-3 overflow-y-auto max-h-[230px] space-y-2 pr-1">
                  {dueBills.map((bill) => (
                    <div 
                      key={bill._id} 
                      className="p-3 bg-red-50/40 border border-red-100 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">
                            {bill.patientId?.patientName || 'Patient'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            (UHID: {bill.patientId?.uhid || 'N/A'})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Bill #{bill.billNo || bill.labId} • Total: ₹{bill.totalAmount || 0}
                        </p>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="text-xs font-extrabold text-red-600 block">
                          Due: ₹{bill.dueAmount || bill.totalAmount}
                        </span>
                        <button
                          onClick={() => handleOpenPaymentModal(bill)}
                          className="mt-1 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Receive Payment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BOX 3: Recent transactions */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[340px]">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-150">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Recent transactions</h3>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">For today</p>
                </div>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                  View all
                </button>
              </div>

              {/* Content */}
              {loadingDashboard ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                </div>
              ) : todayTransactions.length === 0 ? (
                <div>
                  <div className="text-center pt-2 pb-4">
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1">
                      <span>View all</span>
                      <span className="text-[10px]">»</span>
                    </button>
                  </div>

                  <div className="py-6 text-center flex flex-col items-center justify-center">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3 shadow-2xs">
                      <BoxIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No transactions found for today.</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Get started by adding a new case.</p>
                    
                    <button
                      onClick={() => router.push('/new-bill')}
                      className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                      <span>Add new case</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 overflow-y-auto max-h-[220px] space-y-2 pr-1">
                  {todayTransactions.map((tx) => (
                    <div key={tx._id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{tx.patientId?.patientName || 'Patient'}</span>
                        <span className="text-[10px] text-slate-500">Bill #{tx.billNo || tx.labId} • {tx.paymentStatus}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 block">₹{tx.paidAmount || tx.totalAmount}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{tx.paymentMode || 'Cash'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BOX 4: Recent activities */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[340px]">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-150">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Recent activities</h3>
                </div>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                  View all
                </button>
              </div>

              {/* Clean Activities Content */}
              {loadingDashboard ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-2 shadow-2xs">
                    <Activity className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No recent activity recorded today.</p>
                </div>
              ) : (
                <div className="mt-3 overflow-y-auto max-h-[220px] space-y-2 pr-1">
                  {recentActivities.map((act) => (
                    <div key={act._id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Report Generated: {act.patientId?.patientName}</span>
                        <span className="text-[10px] text-slate-500">Lab ID: {act.labId} • Tests: {act.tests?.join(', ')}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal for filling test parameters & generating report */}
        {showProcessModal && selectedRequest && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-orange-100 text-orange-700 rounded">
                    {selectedRequest.labId}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Fill Test Parameters — {selectedRequest.patientId?.patientName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter test values for parameter fields defined by Lab Admin
                  </p>
                </div>
                <button onClick={() => setShowProcessModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Test Fields Form */}
              <div className="space-y-5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Ordered Tests: </span>
                    <span className="font-bold text-slate-800">{selectedRequest.tests?.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">UHID: </span>
                    <span className="font-bold text-orange-600">{selectedRequest.patientId?.uhid}</span>
                  </div>
                </div>

                {/* Dynamic Parameter Input Fields */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Diagnostic Parameter Results
                  </h4>

                  {Object.keys(parameterValues).length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>No pre-configured parameters found for these tests. You can enter remarks below{isAdminUser ? <span className="cursor-pointer underline font-bold ml-1" onClick={() => router.push('/admin')}>or add parameters in Lab Admin Portal</span> : '.'}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {Object.keys(parameterValues).map((pName) => {
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
                          <div key={pName} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
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
                                className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
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
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-150 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProcessModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingReport}
                    onClick={() => handleSaveReport('draft')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={savingReport}
                    onClick={() => handleSaveReport('completed')}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {savingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for receiving due payment */}
        {showPaymentModal && selectedBillForPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Receive Due Payment
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleReceivePaymentSubmit} className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Patient:</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedBillForPayment.patientId?.patientName}</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹)</label>
                  <input
                    type="number"
                    required
                    max={selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Max Due: ₹{selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="NetBanking">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Ref / Txn ID (Optional)</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. UPI-99882233"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs flex items-center gap-1.5"
                  >
                    {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Confirm Payment</span>
                  </button>
                </div>
              </form>
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
      <Suspense fallback={
        <DashboardLayout>
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        </DashboardLayout>
      }>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
