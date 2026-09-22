'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Search, UserCheck, Plus, Trash2, Save,
  Printer, IndianRupee, RefreshCw, X, Tag, FileText, User,
  ArrowLeft, CheckCircle2, Clock, Activity, Stethoscope,
  Pill, TestTube, ChevronRight, AlertCircle, Receipt,
  Users, Check, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import PrintInvoiceModal from './PrintInvoiceModal';

const CATEGORY_STYLES = {
  'Consultation Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'OPD': 'bg-blue-50 text-blue-700 border-blue-200',
  'Lab': 'bg-purple-50 text-purple-700 border-purple-200',
  'Medicine': 'bg-teal-50 text-teal-700 border-teal-200',
  'Procedure': 'bg-amber-50 text-amber-700 border-amber-200',
  'Consumable': 'bg-orange-50 text-orange-700 border-orange-200',
  'Other': 'bg-gray-50 text-gray-700 border-gray-200'
};

export default function BillingDeskView({ onNavigate }) {
  // View mode: 'queue' (Eligible patients ready for billing) | 'builder' (Itemized invoice generation)
  const [view, setView] = useState('queue');

  // Queue & Search State
  const [patientSearch, setPatientSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [eligiblePatients, setEligiblePatients] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [searchingWalkIn, setSearchingWalkIn] = useState(false);
  const [walkInSearch, setWalkInSearch] = useState('');

  // Selected Patient for Invoice
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatientItems, setLoadingPatientItems] = useState(false);

  // Invoice Form State
  const [items, setItems] = useState([
    { name: 'OPD Consultation Fee', category: 'OPD', price: 500, qty: 1, discount: 0, sourceId: null, sourceModel: null }
  ]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Generated Invoice for Print Modal
  const [generatedBill, setGeneratedBill] = useState(null);

  // Fetch Queue of Eligible Patients
  const loadEligiblePatients = useCallback(async (query = '') => {
    setLoadingQueue(true);
    try {
      const [res, billsRes] = await Promise.all([
        apiRequest('/billing/eligible-patients', {
          params: {
            search: query || undefined,
            module: 'OPD',
            limit: 50
          }
        }),
        apiRequest('/billing', {
          params: { limit: 200 }
        }).catch(() => ({ bills: [] }))
      ]);

      const list = Array.isArray(res) ? res : (res?.patients || []);
      const bills = Array.isArray(billsRes) ? billsRes : (billsRes?.bills || billsRes?.data || []);

      const billedPatientIds = new Set();
      const billedUhids = new Set();
      bills.forEach(b => {
        if (b.status !== 'Cancelled') {
          if (b.patientId) billedPatientIds.add(String(b.patientId._id || b.patientId));
          if (b.uhid) billedUhids.add(String(b.uhid));
        }
      });

      // Exclude patients whose bill has already been created unless they have new unbilled pending charges
      const unbilledPatients = list.filter(p => {
        const hasCreatedBill = billedPatientIds.has(String(p._id)) || billedUhids.has(String(p.uhid)) || p.hasFinalBill;
        if (hasCreatedBill) {
          const pending = Number(p.totalPendingAmount) || 0;
          if (pending <= 0) return false;
          if (!p.categories || p.categories.length === 0 || (p.categories.length === 1 && p.categories[0] === 'General Billing')) {
            return false;
          }
        }
        return true;
      });

      setEligiblePatients(unbilledPatients);
    } catch (err) {
      console.error('Failed to load eligible billing patients:', err);
      toast.error('Could not load billing queue');
      setEligiblePatients([]);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  // Debounced search on queue
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEligiblePatients(patientSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, loadEligiblePatients]);

  // Load Patient and their billable services to start billing
  const handleSelectPatientForBilling = async (patient) => {
    setSelectedPatient(patient);
    setLoadingPatientItems(true);
    setView('builder');

    try {
      const [billData, rxList] = await Promise.all([
        apiRequest(`/billing/generate/${patient.uhid}`).catch(() => null),
        apiRequest(`/prescription/${patient._id}`).catch(() => null)
      ]);

      let loadedItems = [];

      if (billData && billData.items && billData.items.length > 0) {
        loadedItems = billData.items.map(i => ({
          name: i.description || i.name || 'Service Charge',
          category: i.category || 'OPD',
          price: parseFloat(i.price) || (i.category === 'Medicine' ? 50 : 0),
          qty: parseFloat(i.quantity) || 1,
          discount: parseFloat(i.discount) || 0,
          sourceId: i.sourceId || null,
          sourceModel: i.sourceModel || null
        }));
      }

      // Check if medicine items were returned by billData
      const hasMedicineInBill = loadedItems.some(i => i.category === 'Medicine');
      if (!hasMedicineInBill && Array.isArray(rxList) && rxList.length > 0) {
        // Fallback: Populate prescribed medicines from latest prescription if not already in billData
        const latestRx = rxList[0];
        if (latestRx && latestRx.medicines && latestRx.medicines.length > 0) {
          latestRx.medicines.forEach(m => {
            const medName = (m.medicine || m.name || m.medicineName || '').trim();
            if (medName) {
              const qty = Number(m.qty) || (m.duration ? (parseInt(m.duration) || 5) * ((m.morning?1:0)+(m.afternoon?1:0)+(m.night?1:0) || 1) : 1);
              loadedItems.push({
                name: `${medName}${m.dosageForm ? ` (${m.dosageForm})` : ''}`,
                category: 'Medicine',
                price: m.price || 50,
                qty: qty > 0 ? qty : 1,
                discount: 0,
                sourceId: latestRx._id,
                sourceModel: 'Prescription'
              });
            }
          });
        }
      }

      if (loadedItems.length === 0) {
        // Fallback default item
        loadedItems = [
          {
            name: `OPD Consultation Fee${patient.doctorName ? ` - Dr. ${patient.doctorName}` : ''}`,
            category: 'OPD',
            price: 500,
            qty: 1,
            discount: 0,
            sourceId: null,
            sourceModel: null
          }
        ];
      }

      setItems(loadedItems);
      setOverallDiscount(0);
      setPaidAmountInput('');
      setPaymentMode('Cash');
      setPaymentStatus('Paid');
      setNotes('');
    } catch (err) {
      console.warn('Could not auto-generate items from server, using default:', err);
      setItems([
        {
          name: `OPD Consultation Fee${patient.doctorName ? ` - Dr. ${patient.doctorName}` : ''}`,
          category: 'OPD',
          price: 500,
          qty: 1,
          discount: 0,
          sourceId: null,
          sourceModel: null
        }
      ]);
    } finally {
      setLoadingPatientItems(false);
    }
  };

  // Direct Walk-In / UHID Search Lookup
  const handleWalkInSearch = async (e) => {
    e?.preventDefault();
    if (!walkInSearch.trim()) return;
    setSearchingWalkIn(true);
    try {
      const res = await apiRequest('/patients/lookup', {
        params: {
          uhid: /^UHID|PID/i.test(walkInSearch) || /^\d+$/.test(walkInSearch) ? walkInSearch : undefined,
          mobile: /^\d{10}$/.test(walkInSearch) ? walkInSearch : undefined,
          name: !/^\d+$/.test(walkInSearch) ? walkInSearch : undefined
        }
      });
      if (res?.found && res?.patient) {
        toast.success(`Found patient: ${res.patient.patientName}`);
        handleSelectPatientForBilling(res.patient);
        setWalkInSearch('');
      } else {
        toast.error('No patient found with this UHID or phone number');
      }
    } catch (err) {
      toast.error('Patient lookup failed');
    } finally {
      setSearchingWalkIn(false);
    }
  };

  // Item Table Handlers
  const addItemRow = () => {
    setItems([...items, { name: '', category: 'OPD', price: 0, qty: 1, discount: 0, sourceId: null, sourceModel: null }]);
  };

  const removeItemRow = (idx) => {
    if (items.length === 1) {
      setItems([{ name: '', category: 'OPD', price: 0, qty: 1, discount: 0, sourceId: null, sourceModel: null }]);
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  // Calculations
  const grossTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseFloat(item.qty) || 1), 0);
  const itemsLineDiscount = items.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
  const totalDiscount = (parseFloat(overallDiscount) || 0) + itemsLineDiscount;
  const netPayable = Math.max(0, grossTotal - totalDiscount);

  const effectivePaidAmount = paymentStatus === 'Paid'
    ? netPayable
    : (paymentStatus === 'Unpaid' ? 0 : (parseFloat(paidAmountInput) || 0));

  const dueAmount = Math.max(0, netPayable - effectivePaidAmount);

  // Generate and Finalize Invoice
  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      return toast.error('Please select a patient first');
    }

    const validItems = items.filter(it => it.name && it.name.trim());
    if (validItems.length === 0) {
      return toast.error('Please enter at least one billable item');
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatient._id,
        uhid: selectedPatient.uhid,
        patientName: selectedPatient.patientName,
        patientGender: selectedPatient.gender,
        patientAge: selectedPatient.patientAge || (selectedPatient.dob ? Math.abs(new Date(Date.now() - new Date(selectedPatient.dob).getTime()).getUTCFullYear() - 1970) : undefined),
        patientMobile: selectedPatient.mobile,
        doctorName: selectedPatient.doctorName || selectedPatient.doctorId?.doctorName || selectedPatient.doctorId?.username || '',
        billType: 'OPD',
        status: 'Final',
        items: validItems.map(it => ({
          name: it.name,
          category: it.category || 'OPD',
          price: parseFloat(it.price) || 0,
          quantity: parseFloat(it.qty) || 1,
          discountAmount: parseFloat(it.discount) || 0,
          total: (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 1) - (parseFloat(it.discount) || 0),
          sourceId: it.sourceId || undefined,
          sourceModel: it.sourceModel || undefined
        })),
        subtotal: grossTotal,
        discountPercentage: 0,
        discountAmount: totalDiscount,
        grandTotal: netPayable,
        amountPaid: effectivePaidAmount,
        dueAmount: dueAmount,
        paymentMode: paymentMode || 'Cash',
        paymentStatus: dueAmount === 0 ? 'Paid' : (effectivePaidAmount > 0 ? 'Partially Paid' : 'Unpaid'),
        remarks: notes || ''
      };

      const res = await apiRequest('/billing', {
        method: 'POST',
        data: payload
      });

      toast.success('Invoice generated successfully!');
      setEligiblePatients(prev => prev.filter(p => p._id !== selectedPatient._id && p.uhid !== selectedPatient.uhid));
      setGeneratedBill(res.bill || {
        ...payload,
        billNumber: res.bill?.invoiceNo || res.billNumber || `INV-${Date.now().toString().slice(-6)}`
      });

      // Reload queue
      loadEligiblePatients(patientSearch);
    } catch (err) {
      toast.error(err.message || 'Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePrintModal = () => {
    setGeneratedBill(null);
    setSelectedPatient(null);
    setView('queue');
  };

  // Filtered patients in queue
  const filteredPatients = eligiblePatients.filter(p => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'CONSULTATION') return p.categories?.includes('Consultation Completed') || p.categories?.includes('OPD');
    if (categoryFilter === 'LAB') return p.categories?.includes('Lab');
    if (categoryFilter === 'MEDICINE') return p.categories?.includes('Medicine');
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Billing Desk & Patient Queue</h2>
            <p className="text-xs text-gray-500 font-medium">Create invoices for completed consultations, lab investigations & clinic services</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {view === 'builder' && (
            <button
              type="button"
              onClick={() => { setView('queue'); setSelectedPatient(null); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
            </button>
          )}

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('billing-registry')}
              className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Invoice Registry
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: PATIENT QUEUE (Eligible Patients for Billing) */}
      {view === 'queue' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Patients Ready for Billing</p>
                <p className="text-xl font-black text-gray-900">{eligiblePatients.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Consultations Ready</p>
                <p className="text-xl font-black text-gray-900">
                  {eligiblePatients.filter(p => p.categories?.includes('Consultation Completed') || p.categories?.includes('OPD')).length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Billing Queue Status</p>
                <p className="text-xs font-bold text-purple-700 mt-1">Live Sync Active</p>
              </div>
            </div>
          </div>

          {/* Search, Filter & Walk-in Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Live Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search queue by Patient Name, UHID, Mobile..."
                  className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    categoryFilter === 'ALL'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({eligiblePatients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('CONSULTATION')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    categoryFilter === 'CONSULTATION'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Consultations
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('LAB')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    categoryFilter === 'LAB'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Lab Tests
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('MEDICINE')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    categoryFilter === 'MEDICINE'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pharmacy / Rx
                </button>
                <button
                  type="button"
                  onClick={() => loadEligiblePatients(patientSearch)}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingQueue ? 'animate-spin text-orange-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Walk-in / Direct UHID Lookup Card */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold">Looking for a direct patient or walk-in?</span>
              </div>
              <form onSubmit={handleWalkInSearch} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={walkInSearch}
                  onChange={(e) => setWalkInSearch(e.target.value)}
                  placeholder="Enter UHID, Mobile, or Name..."
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={searchingWalkIn}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {searchingWalkIn ? 'Searching...' : 'Lookup & Bill'}
                </button>
              </form>
            </div>
          </div>

          {/* Patient Queue Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Patients Ready For Billing</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Click &quot;Create Bill&quot; on any patient to auto-populate consultation charges and generate invoice</p>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                {filteredPatients.length} Patients in Queue
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">UHID</th>
                    <th className="p-3.5">Mobile</th>
                    <th className="p-3.5">Gender / Age</th>
                    <th className="p-3.5">Billable Services</th>
                    <th className="p-3.5 text-right">Est. Pending</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingQueue ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
                          <span>Loading eligible patients queue...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 space-y-2">
                        <Users className="w-8 h-8 mx-auto text-gray-300" />
                        <p className="font-bold text-gray-700">No patients waiting in billing queue</p>
                        <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                          Patients with completed doctor consultations or clinic visits will appear here automatically. You can also use the lookup above to bill any patient.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => {
                      const categories = patient.categories || ['OPD'];
                      return (
                        <tr key={patient._id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="p-3.5 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-[11px]">
                                {patient.patientName?.charAt(0)?.toUpperCase() || 'P'}
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-900">{patient.patientName}</p>
                                {patient.pidNumber && (
                                  <p className="text-[10px] text-gray-400 font-mono">Reg: {patient.pidNumber}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-orange-600">
                            {formatUhid(patient.uhid)}
                          </td>
                          <td className="p-3.5 text-gray-600 font-medium">
                            {patient.mobile || '-'}
                          </td>
                          <td className="p-3.5 text-gray-600">
                            {patient.gender || '-'} {patient.patientAge ? `(${patient.patientAge}y)` : ''}
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1">
                              {categories.map((cat, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${CATEGORY_STYLES[cat] || CATEGORY_STYLES['Other']}`}
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-black text-gray-900">
                            {patient.totalPendingAmount > 0 ? (
                              <span className="text-orange-600">₹{Number(patient.totalPendingAmount).toFixed(2)}</span>
                            ) : (
                              <span className="text-gray-400 font-normal">₹0.00</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectPatientForBilling(patient)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Create Bill
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INVOICE BUILDER (Itemized Line Items & Settlement) */}
      {view === 'builder' && (
        <div className="space-y-6">
          {/* Patient Banner */}
          {selectedPatient && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-gray-900">{selectedPatient.patientName}</h3>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded font-mono">
                      {formatUhid(selectedPatient.uhid)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {selectedPatient.gender || 'Patient'} • Age: {selectedPatient.patientAge ? `${selectedPatient.patientAge}y` : (selectedPatient.dob ? `${Math.abs(new Date(Date.now() - new Date(selectedPatient.dob).getTime()).getUTCFullYear() - 1970)}y` : '-')} • Mobile: {selectedPatient.mobile || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setView('queue'); setSelectedPatient(null); }}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Change Patient
                </button>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
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

            {loadingPatientItems ? (
              <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
                <span>Loading completed consultation charges & tests...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-bold text-[11px]">
                    <tr>
                      <th className="p-2.5">Service / Charge Item</th>
                      <th className="p-2.5 w-32">Category</th>
                      <th className="p-2.5 w-24 text-right">Rate (₹)</th>
                      <th className="p-2.5 w-20 text-center">Qty</th>
                      <th className="p-2.5 w-24 text-right">Discount (₹)</th>
                      <th className="p-2.5 w-28 text-right">Line Total (₹)</th>
                      <th className="p-2.5 w-12 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => {
                      const p = parseFloat(item.price) || 0;
                      const q = parseFloat(item.qty) || 1;
                      const d = parseFloat(item.discount) || 0;
                      const lineTotal = Math.max(0, p * q - d);

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(idx, 'name', e.target.value)}
                              placeholder="e.g. OPD Consultation Fee, CBC Test..."
                              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.category || 'OPD'}
                              onChange={(e) => updateItem(idx, 'category', e.target.value)}
                              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            >
                              <option value="OPD">OPD</option>
                              <option value="Lab">Lab</option>
                              <option value="Medicine">Medicine</option>
                              <option value="Procedure">Procedure</option>
                              <option value="Consumable">Consumable</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) => updateItem(idx, 'price', e.target.value)}
                              className="w-full px-2 py-1.5 text-right bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                              className="w-full px-2 py-1.5 text-center bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateItem(idx, 'discount', e.target.value)}
                              className="w-full px-2 py-1.5 text-right bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2 text-right font-black text-gray-900">
                            ₹{lineTotal.toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Settlement & Payment Options */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Payment Details Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Card">Debit / Credit Card</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Paid">Fully Paid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Unpaid">Unpaid / On Credit</option>
                    </select>
                  </div>
                </div>

                {paymentStatus === 'Partially Paid' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Amount Paid Now (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={netPayable}
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      placeholder={`Enter amount up to ₹${netPayable.toFixed(2)}`}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Invoice Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes printed on invoice..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Financial Summary Calculation Card */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Gross Total:</span>
                  <span className="font-bold text-gray-900">₹{grossTotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Additional Concession (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={overallDiscount}
                    onChange={(e) => setOverallDiscount(e.target.value)}
                    className="w-24 px-2 py-1 text-right bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
                  />
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-xs text-red-600">
                    <span>Total Discount:</span>
                    <span className="font-bold">-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                  <span className="text-sm font-black text-gray-900">Net Payable:</span>
                  <span className="text-lg font-black text-orange-600">₹{netPayable.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs text-emerald-700 font-bold">
                  <span>Amount Paid:</span>
                  <span>₹{effectivePaidAmount.toFixed(2)}</span>
                </div>

                {dueAmount > 0 && (
                  <div className="flex justify-between text-xs text-red-600 font-black border-t border-dashed border-gray-300 pt-2">
                    <span>Balance Due:</span>
                    <span>₹{dueAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleGenerateInvoice}
                    disabled={submitting || !selectedPatient}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Invoice...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Generate & Print Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Print Preview Modal */}
      {generatedBill && (
        <PrintInvoiceModal
          bill={generatedBill}
          onClose={handleClosePrintModal}
        />
      )}
    </div>
  );
}
