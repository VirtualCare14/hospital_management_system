'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Search, Printer, Download, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Filter, X,
  ArrowLeft, CreditCard, CheckCircle2, AlertCircle,
  Receipt, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import PrintInvoiceModal from './PrintInvoiceModal';

export default function InvoiceRegistryView({ onNavigate }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedBillForPrint, setSelectedBillForPrint] = useState(null);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await apiRequest('/billing', { params });
      setBills(res.bills || res.data || []);
      setTotalRecords(res.totalRecords ?? res.total ?? (res.bills ? res.bills.length : 0));
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Fetch invoices error:', err);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, fromDate, toDate]);

  useEffect(() => {
    const timer = setTimeout(fetchBills, 300);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, search, statusFilter, fromDate, toDate]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Invoice Registry & Completed Bills</h2>
            <p className="text-xs text-gray-500 font-medium">Archive of all generated invoices, payment status & reprints</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('billing-desk')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" /> Billing Desk / New Bill
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Bill No, UHID, Patient Name, Mobile..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partially Paid</option>
              <option value="Pending">Unpaid / Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
              title="From Date"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
              title="To Date"
            />
            <button
              type="button"
              onClick={fetchBills}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Invoice No / Date</th>
                <th className="py-3.5 px-4">Patient / UHID</th>
                <th className="py-3.5 px-4 text-right">Net Amount</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4 text-right">Due Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading invoices...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="font-bold text-gray-700">No invoice records found</p>
                    <p className="text-[11px] text-gray-400">Completed bills and finalized invoices will be listed here.</p>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                  const billNumberDisplay = bill.invoiceNo || bill.billNo || bill.billNumber || 'INV-DRAFT';
                  const total = bill.grandTotal !== undefined ? bill.grandTotal : (bill.netAmount !== undefined ? bill.netAmount : (bill.totalAmount || bill.subtotal || 0));
                  const paid = bill.amountPaid !== undefined ? bill.amountPaid : (bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentStatus === 'Paid' ? total : 0));
                  const due = bill.dueAmount !== undefined ? bill.dueAmount : Math.max(0, total - paid);
                  const isPaid = bill.paymentStatus === 'Paid' || due === 0;
                  const isPartial = (bill.paymentStatus === 'Partial' || bill.paymentStatus === 'Partially Paid') && due > 0 && paid > 0;

                  return (
                    <tr key={bill._id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-gray-900 block font-mono">{billNumberDisplay}</span>
                        <span className="text-[11px] text-gray-500">{formatDate(bill.createdAt || bill.date || new Date())}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-orange-600 block font-mono">{formatUhid(bill.uhid)}</span>
                        <span className="font-bold text-gray-900">{bill.patientName || 'Patient'}</span>
                        {bill.doctorName && (
                          <span className="text-[10px] text-gray-400 block">Dr. {bill.doctorName}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-gray-900">
                        ₹{Number(total).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        ₹{Number(paid).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-red-600">
                        {due > 0 ? `₹${Number(due).toFixed(2)}` : '₹0.00'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isPartial
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {bill.paymentStatus || (isPaid ? 'Paid' : 'Unpaid')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBillForPrint({
                            ...bill,
                            billNumber: billNumberDisplay,
                            totalAmount: total,
                            paidAmount: paid,
                            dueAmount: due
                          })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-bold border border-orange-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print / View
                        </button>
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
              Page {currentPage} of {totalPages} ({totalRecords} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
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

      {selectedBillForPrint && (
        <PrintInvoiceModal
          bill={selectedBillForPrint}
          onClose={() => setSelectedBillForPrint(null)}
        />
      )}
    </div>
  );
}
