'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard, Search, UserCheck, Plus, Trash2, Save,
  Printer, IndianRupee, RefreshCw, X, Tag, FileText, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import PrintInvoiceModal from './PrintInvoiceModal';

export default function BillingDeskView({ onNavigate }) {
  const [patientSearch, setPatientSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Invoice Form State
  const [items, setItems] = useState([
    { name: 'OPD Consultation Fee', category: 'OPD', price: 500, qty: 1, discount: 0 }
  ]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success Modal
  const [generatedBill, setGeneratedBill] = useState(null);

  // Quick lookup
  const handleSearchPatient = async (e) => {
    e?.preventDefault();
    if (!patientSearch.trim()) return;
    setSearching(true);
    try {
      const res = await apiRequest('/patients/lookup', {
        params: {
          uhid: /^UHID|PID/i.test(patientSearch) || /^\d+$/.test(patientSearch) ? patientSearch : undefined,
          mobile: /^\d{10}$/.test(patientSearch) ? patientSearch : undefined,
          name: !/^\d+$/.test(patientSearch) ? patientSearch : undefined
        }
      });
      if (res?.found && res?.patient) {
        setSelectedPatient(res.patient);
        toast.success(`Patient selected: ${res.patient.patientName}`);
      } else {
        toast.error('No matching patient found');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const addItemRow = () => {
    setItems([...items, { name: '', category: 'OPD', price: 0, qty: 1, discount: 0 }]);
  };

  const removeItemRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  // Computations
  const itemsSubtotal = items.reduce((sum, item) => {
    const p = parseFloat(item.price) || 0;
    const q = parseFloat(item.qty) || 1;
    const d = parseFloat(item.discount) || 0;
    return sum + (p * q - d);
  }, 0);

  const totalDiscount = (parseFloat(overallDiscount) || 0) + items.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
  const grossTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseFloat(item.qty) || 1), 0);
  const netPayable = Math.max(0, itemsSubtotal - (parseFloat(overallDiscount) || 0));

  const effectivePaidAmount = paymentStatus === 'Paid'
    ? netPayable
    : (parseFloat(paidAmountInput) || 0);

  const dueAmount = Math.max(0, netPayable - effectivePaidAmount);

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      return toast.error('Please search and select a patient first');
    }

    const validItems = items.filter(it => it.name && it.name.trim());
    if (validItems.length === 0) {
      return toast.error('Please add at least one billed service item');
    }

    setSubmitting(true);
    try {
      const payload = {
        uhid: selectedPatient.uhid,
        patientName: selectedPatient.patientName,
        patientGender: selectedPatient.gender,
        patientAge: selectedPatient.dob ? Math.abs(new Date(Date.now() - new Date(selectedPatient.dob).getTime()).getUTCFullYear() - 1970) : undefined,
        patientMobile: selectedPatient.mobile,
        items: validItems.map(it => ({
          name: it.name,
          category: it.category || 'OPD',
          price: parseFloat(it.price) || 0,
          qty: parseFloat(it.qty) || 1,
          discount: parseFloat(it.discount) || 0,
          amount: (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 1) - (parseFloat(it.discount) || 0)
        })),
        totalAmount: grossTotal,
        discount: totalDiscount,
        netAmount: netPayable,
        paidAmount: effectivePaidAmount,
        dueAmount: dueAmount,
        paymentMode: paymentMode,
        paymentStatus: dueAmount === 0 ? 'Paid' : (effectivePaidAmount > 0 ? 'Partial' : 'Pending'),
        notes: notes || undefined
      };

      const res = await apiRequest('/billing', {
        method: 'POST',
        data: payload
      });

      toast.success('Invoice generated successfully!');
      setGeneratedBill(res.bill || { ...payload, billNumber: res.billNumber || `INV-${Date.now().toString().slice(-6)}` });

      // Reset
      setSelectedPatient(null);
      setPatientSearch('');
      setItems([{ name: 'OPD Consultation Fee', category: 'OPD', price: 500, qty: 1, discount: 0 }]);
      setOverallDiscount(0);
      setPaidAmountInput('');
      setNotes('');
    } catch (err) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Billing Desk & Invoice Builder</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Generate itemized patient invoices, apply concessions & process payments</p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('billing-registry')}
              className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Invoice Registry
            </button>
          )}
        </div>
      </div>

      {/* 1. Patient Selection Box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <User className="w-4 h-4 text-orange-600" />
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Patient Selection</h3>
        </div>

        <form onSubmit={handleSearchPatient} className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Enter Patient UHID, Mobile, or Name..."
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
          >
            {searching ? 'Finding...' : 'Lookup'}
          </button>
        </form>

        {selectedPatient && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-emerald-950">
                  {selectedPatient.patientName} <span className="text-emerald-700 font-mono">({formatUhid(selectedPatient.uhid)})</span>
                </p>
                <p className="text-[11px] text-emerald-800 font-medium">
                  {selectedPatient.gender} • Mobile: {selectedPatient.mobile} • Last Dept: {selectedPatient.department || 'General'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPatient(null)}
              className="text-xs font-bold text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white"
            >
              Change Patient
            </button>
          </div>
        )}
      </div>

      {/* 2. Line Items Builder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Billable Items / Services</h3>
          </div>
          <button
            type="button"
            onClick={addItemRow}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Service Line
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-gray-700 font-bold text-[11px]">
              <tr>
                <th className="p-2.5">Service / Charge Item</th>
                <th className="p-2.5 w-32">Category</th>
                <th className="p-2.5 w-24">Rate (₹)</th>
                <th className="p-2.5 w-20">Qty</th>
                <th className="p-2.5 w-24">Discount (₹)</th>
                <th className="p-2.5 w-28 text-right">Line Total (₹)</th>
                <th className="p-2.5 w-12 text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => {
                const lineTotal = (parseFloat(item.price) || 0) * (parseFloat(item.qty) || 1) - (parseFloat(item.discount) || 0);
                return (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Item name (e.g. Doctor Consultation, Blood Test, Dressing)"
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(idx, 'category', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
                      >
                        <option value="OPD">OPD</option>
                        <option value="Lab">Laboratory</option>
                        <option value="Procedure">Procedure</option>
                        <option value="Pharmacy">Medicine</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(idx, 'price', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateItem(idx, 'discount', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-right"
                      />
                    </td>
                    <td className="p-2 text-right font-black text-gray-900">
                      ₹{lineTotal.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        disabled={items.length === 1}
                        onClick={() => removeItemRow(idx)}
                        className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Payment & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-gray-100">
          <div className="md:col-span-7 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="NetBanking">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                >
                  <option value="Paid">Fully Paid</option>
                  <option value="Partial">Partial Payment</option>
                  <option value="Pending">Unpaid (Total Due)</option>
                </select>
              </div>
            </div>

            {paymentStatus === 'Partial' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount Collected Now (₹)</label>
                <input
                  type="number"
                  placeholder="Enter partial amount"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Invoice Notes / Remarks</label>
              <textarea
                rows={2}
                placeholder="Optional notes printed on invoice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
              />
            </div>
          </div>

          {/* Totals Summary Panel */}
          <div className="md:col-span-5 bg-gray-50/80 p-5 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex justify-between text-xs font-bold text-gray-600">
              <span>Gross Total:</span>
              <span>₹{grossTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>Additional Concession (₹):</span>
              <input
                type="number"
                value={overallDiscount}
                onChange={(e) => setOverallDiscount(e.target.value)}
                className="w-24 px-2 py-1 bg-white border border-gray-200 rounded text-right font-bold"
              />
            </div>

            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>Net Payable:</span>
              <span className="text-orange-600">₹{netPayable.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs font-bold text-emerald-700">
              <span>Amount Paid:</span>
              <span>₹{effectivePaidAmount.toFixed(2)}</span>
            </div>

            {dueAmount > 0 && (
              <div className="flex justify-between text-xs font-black text-red-600 pt-1 border-t border-dashed border-gray-300">
                <span>Balance Due:</span>
                <span>₹{dueAmount.toFixed(2)}</span>
              </div>
            )}

            <button
              type="button"
              disabled={submitting || !selectedPatient}
              onClick={handleGenerateInvoice}
              className="w-full mt-3 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Generate & Print Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Invoice Modal */}
      {generatedBill && (
        <PrintInvoiceModal
          bill={generatedBill}
          onClose={() => setGeneratedBill(null)}
        />
      )}
    </div>
  );
}
