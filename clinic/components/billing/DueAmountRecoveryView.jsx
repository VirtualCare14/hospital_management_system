'use client';

import { useState, useEffect } from 'react';
import {
  Coins, Search, IndianRupee, RefreshCw, X,
  Save, CheckCircle2, AlertTriangle, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import PrintInvoiceModal from './PrintInvoiceModal';

export default function DueAmountRecoveryView() {
  const [duesList, setDuesList] = useState([]);
  const [metrics, setMetrics] = useState({ totalOutstanding: 0, patientCount: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Collect Payment Modal
  const [selectedBillForRecovery, setSelectedBillForRecovery] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Success Print
  const [printedBill, setPrintedBill] = useState(null);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/billing/dues${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setDuesList(res.bills || []);
      setMetrics({
        totalOutstanding: res.totalOutstanding || 0,
        patientCount: res.patientCount || 0
      });
    } catch (err) {
      console.error('Fetch dues error:', err);
      setDuesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchDues, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCollectModal = (bill) => {
    setSelectedBillForRecovery(bill);
    setPaymentAmount(String(bill.dueAmount || 0));
    setPaymentMode('Cash');
    setRemarks('');
  };

  const handleCollectDue = async (e) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      return toast.error('Please enter a valid payment amount');
    }
    if (amt > (selectedBillForRecovery.dueAmount || 0)) {
      return toast.error('Payment amount cannot exceed outstanding due balance');
    }

    setRecordingPayment(true);
    try {
      const res = await apiRequest('/billing/dues/pay', {
        method: 'POST',
        data: {
          billId: selectedBillForRecovery._id,
          amount: amt,
          paymentMode,
          remarks
        }
      });
      toast.success('Due payment recorded successfully!');
      setSelectedBillForRecovery(null);
      fetchDues();
      if (res.bill) {
        setPrintedBill(res.bill);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record due payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Metrics */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Due Amount Recovery & Collections</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Track outstanding patient balances and collect pending due amounts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-center">
            <span className="text-[10px] uppercase tracking-wider text-red-600 font-bold block">Total Outstanding</span>
            <span className="text-lg font-black text-red-700">₹{metrics.totalOutstanding.toFixed(2)}</span>
          </div>
          <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold block">Patients with Dues</span>
            <span className="text-lg font-black text-gray-800">{metrics.patientCount}</span>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex justify-between items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by UHID, Patient Name, Mobile..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Patient / UHID</th>
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4">Invoice Date</th>
                <th className="py-3.5 px-4">Total Net</th>
                <th className="py-3.5 px-4">Paid So Far</th>
                <th className="py-3.5 px-4">Due Balance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading dues...
                  </td>
                </tr>
              ) : duesList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    No outstanding patient dues! All accounts settled.
                  </td>
                </tr>
              ) : (
                duesList.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-orange-600 block">{formatUhid(bill.uhid)}</span>
                      <span className="font-bold text-gray-900">{bill.patientName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {bill.billNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700">
                      {formatDate(bill.createdAt || bill.date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      ₹{Number(bill.netAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      ₹{Number(bill.paidAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-black text-red-600">
                      ₹{Number(bill.dueAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenCollectModal(bill)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5" /> Collect Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {selectedBillForRecovery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Collect Due Payment</h3>
              <button
                onClick={() => setSelectedBillForRecovery(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectDue} className="p-6 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs">
                <p><strong>Patient:</strong> {selectedBillForRecovery.patientName} ({formatUhid(selectedBillForRecovery.uhid)})</p>
                <p><strong>Invoice No:</strong> {selectedBillForRecovery.billNumber}</p>
                <p className="text-red-700 font-bold"><strong>Outstanding Due:</strong> ₹{Number(selectedBillForRecovery.dueAmount || 0).toFixed(2)}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Card">Card</option>
                  <option value="NetBanking">Net Banking</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">Remarks / Transaction Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Receipt # / notes"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBillForRecovery(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs disabled:opacity-60"
                >
                  {recordingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printedBill && (
        <PrintInvoiceModal
          bill={printedBill}
          onClose={() => setPrintedBill(null)}
        />
      )}
    </div>
  );
}
