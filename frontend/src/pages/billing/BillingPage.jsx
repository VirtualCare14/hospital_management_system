import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search, User, Loader2, Printer, Download, Save, CheckCircle,
  X, Trash2, RefreshCw, FileText, Eye, Phone,
  Building2, CreditCard, Percent, DollarSign, Receipt, FileDown,
  ArrowLeft, Stethoscope, Pill, TestTube, BedDouble, Package, Plus, Trash, EyeOff, LayoutDashboard, History, Coins, Ban
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const BILL_TYPES = [
  { id: 'All', label: 'All Connected Modules', icon: FileText },
  { id: 'OPD', label: 'OPD Charges Only', icon: User },
  { id: 'Lab', label: 'Laboratory Only', icon: TestTube },
  { id: 'IPD', label: 'IPD/Bed Stay Only', icon: BedDouble },
  { id: 'OT', label: 'OT Surgery Only', icon: CreditCard },
  { id: 'Pharmacy', label: 'Pharmacy Only', icon: Pill }
];

const CATEGORY_COLORS = {
  'OPD': 'bg-blue-50 text-blue-700 border border-blue-200',
  'IPD': 'bg-red-50 text-red-700 border border-red-200',
  'Lab': 'bg-purple-50 text-purple-700 border border-purple-200',
  'Medicine': 'bg-green-50 text-green-700 border border-green-200',
  'Consumable': 'bg-orange-50 text-orange-700 border border-orange-200',
  'SameDayTreatment': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'BedCharge': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  'OT': 'bg-pink-50 text-pink-700 border border-pink-200',
  'Other': 'bg-gray-50 text-gray-700 border border-gray-200'
};

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque', 'Insurance', 'Mixed Payment'];

const BillingPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Navigation tab state: 'billing' = billing desk, 'registry' = invoice search, 'dashboard' = dashboard analysis
  const [activeTab, setActiveTab] = useState('billing');
  const [view, setView] = useState('list'); // 'list' = search patient, 'bill' = invoice generation

  // Patient search state
  const [searchQuery, setSearchQuery] = useState('');
  const [eligiblePatients, setEligiblePatients] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Selected patient details
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItemIndexes, setSelectedItemIndexes] = useState([]);
  const [billType, setBillType] = useState('All');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Invoice parameters
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [discountEnabled, setDiscountEnabled] = useState(true);
  const [discountReasonsList, setDiscountReasonsList] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [sdtPricingInBilling, setSdtPricingInBilling] = useState(true);

  // Discount Configuration & Auto Calculations
  const [applyDiscount, setApplyDiscount] = useState(true);
  const [requestAdminDiscount, setRequestAdminDiscount] = useState(false);

  // Payments and advances
  const [patientAdvances, setPatientAdvances] = useState([]);
  const [allPatientAdvances, setAllPatientAdvances] = useState([]);
  const [totalAdvanceAvailable, setTotalAdvanceAvailable] = useState(0);
  const [advanceToAdjust, setAdvanceToAdjust] = useState(0);
  const [paymentMode, setPaymentMode] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  
  // Mixed payment splits
  const [cashSplit, setCashSplit] = useState(0);
  const [upiSplit, setUpiSplit] = useState(0);
  const [cardSplit, setCardSplit] = useState(0);

  // Active records
  const [currentBill, setCurrentBill] = useState(null);
  const [pastBills, setPastBills] = useState([]);
  const [hospitalInfo, setHospitalInfo] = useState(null);

  // Advance Payment Modal Drawer
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmountInput, setAdvanceAmountInput] = useState('');
  const [advanceModeInput, setAdvanceModeInput] = useState('Cash');
  const [advanceRemarksInput, setAdvanceRemarksInput] = useState('');
  const [savingAdvance, setSavingAdvance] = useState(false);
  const [selectedAdvancePatient, setSelectedAdvancePatient] = useState(null);

  // Dashboard Stats
  const [stats, setStats] = useState({
    todayCollection: 0,
    monthlyCollection: 0,
    outstandingPayments: 0,
    discountSummary: 0,
    billCounts: { paid: 0, unpaid: 0, partiallyPaid: 0, cancelled: 0 }
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Registry / Search Invoices
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [registryFilterQuery, setRegistryFilterQuery] = useState('');
  const [registryFilterStatus, setRegistryFilterStatus] = useState('');
  const [registryFilterMode, setRegistryFilterMode] = useState('');
  const [registryFromDate, setRegistryFromDate] = useState('');
  const [registryToDate, setRegistryToDate] = useState('');

  // Print Preview Dialog Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printBillObj, setPrintBillObj] = useState(null);
  const [printLayoutTab, setPrintLayoutTab] = useState('invoice'); // 'invoice' or 'summary'
  const printAreaRef = useRef(null);

  // Cancellation Modal Dialog
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [cancelBillId, setCancelBillId] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Load hospital information for header
  useEffect(() => {
    client.get('/ipd/ot/hospital-info')
      .then(({ data }) => setHospitalInfo(data))
      .catch(() => {});
  }, []);

  // Fetch dashboard stats
  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const { data } = await client.get('/billing/dashboard-stats');
      if (data) setStats(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard summaries');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Invoices Registry
  const loadInvoicesRegistry = async () => {
    setLoadingInvoices(true);
    try {
      const params = {};
      if (registryFilterQuery) params.searchQuery = registryFilterQuery;
      if (registryFilterStatus) params.status = registryFilterStatus;
      if (registryFilterMode) params.paymentMode = registryFilterMode;
      if (registryFromDate) params.fromDate = registryFromDate;
      if (registryToDate) params.toDate = registryToDate;

      const { data } = await client.get('/billing', { params });
      setInvoices(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve invoices');
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats();
    } else if (activeTab === 'registry') {
      loadInvoicesRegistry();
    }
  }, [activeTab, registryFilterStatus, registryFilterMode, registryFromDate, registryToDate]);

  // Load eligible patients (debounced)
  const loadEligiblePatients = useCallback(async (search = '') => {
    setLoadingList(true);
    try {
      const params = search ? { search } : {};
      const { data } = await client.get('/billing/eligible-patients', { params });
      setEligiblePatients(data || []);
    } catch (err) {
      toast.error('Failed to load patients');
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (view !== 'list') return;
    const timer = setTimeout(() => {
      loadEligiblePatients(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, view, loadEligiblePatients]);



  // Handle Create Bill - fetch all billable items for patient
  const handleCreateBill = async (patient) => {
    setSelectedPatient(patient);
    setView('bill');
    setLoading(true);
    setItems([]);
    setSelectedItemIndexes([]);
    setCurrentBill(null);
    setGstEnabled(false);
    setGstPercentage(0);
    setRemarks('');
    setPaymentMode('');
    setTransactionRef('');
    setAdvanceToAdjust(0);
    setCashSplit(0);
    setUpiSplit(0);
    setCardSplit(0);
    setBillType('All');
    setRequestAdminDiscount(false);

    try {
      const { data } = await client.get(`/billing/generate/${patient.uhid}?billType=All`);
      setSelectedPatient(data.patient);
      setItems(data.items || []);
      
      // Auto-check all items by default
      setSelectedItemIndexes(data.items ? data.items.map((_, i) => i) : []);

      // Pull active unadjusted advances
      setPatientAdvances(data.activeAdvances || []);
      setTotalAdvanceAvailable(data.totalAdvance || 0);

      // Pull hospital configurations
      if (data.settings) {
        setDiscountEnabled(data.settings.discountEnabled);
        setDiscountReasonsList(data.settings.discountReasons || []);
        setApplyDiscount(true);
        setSdtPricingInBilling(data.settings.sdtPricingInBilling !== false);
      }

      // Load past bills
      try {
        const billsRes = await client.get(`/billing/patient/${patient.uhid}`);
        setPastBills(billsRes.data || []);
      } catch {
        setPastBills([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load billable items');
      setView('list');
    } finally {
      setLoading(false);
    }
  };

  // Reload items when bill type changes
  const handleBillTypeChange = async (newType) => {
    if (!selectedPatient) return;
    setBillType(newType);
    setLoading(true);
    setItems([]);
    setSelectedItemIndexes([]);
    setAdvanceToAdjust(0);

    try {
      const { data } = await client.get(`/billing/generate/${selectedPatient.uhid}?billType=${newType}`);
      setItems(data.items || []);
      setSelectedItemIndexes(data.items ? data.items.map((_, i) => i) : []);
    } catch (err) {
      toast.error('Failed to reload items');
    } finally {
      setLoading(false);
    }
  };

  // Checkbox multi-select helpers
  const handleToggleItemCheckbox = (index) => {
    setSelectedItemIndexes(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSelectAllCheckbox = () => {
    if (selectedItemIndexes.length === items.length) {
      setSelectedItemIndexes([]);
    } else {
      setSelectedItemIndexes(items.map((_, i) => i));
    }
  };

  // Totals calculations based ONLY on selected checkboxes
  const selectedItems = items.filter((_, idx) => selectedItemIndexes.includes(idx));
  const subtotal = selectedItems.reduce((sum, i) => sum + i.total, 0);

  // Automated/Dynamic Discount Calculation (computed during render to avoid useEffect state cycles and TDZ)
  let discountPercentage = 0;
  let discountReason = requestAdminDiscount ? 'Admin Discount Requested' : '';

  const gstAmount = gstEnabled ? subtotal * (gstPercentage / 100) : 0;
  const discountAmount = 0;
  const grandTotal = subtotal + gstAmount;

  // Net payable amount after adjusting patient advance
  const maxAllowedAdjustment = Math.min(totalAdvanceAvailable, grandTotal);
  const netPayable = Math.max(0, grandTotal - parseFloat(advanceToAdjust || 0));

  // Validation before finalizing
  const handleSaveBill = async (finalize = false) => {
    if (!selectedPatient) { toast.error('No patient selected'); return; }
    if (selectedItems.length === 0) { toast.error('Please select at least one charge item to bill'); return; }
    
    if (finalize) {
      if (!paymentMode) {
        toast.error('Please select a payment mode before finalizing the invoice');
        return;
      }

      if (paymentMode === 'Mixed Payment') {
        const totalSplit = parseFloat(cashSplit || 0) + parseFloat(upiSplit || 0) + parseFloat(cardSplit || 0);
        if (Math.abs(totalSplit - netPayable) > 0.01) {
          toast.error(`Split payments total (₹${totalSplit.toFixed(2)}) must equal Net Payable Amount (₹${netPayable.toFixed(2)})`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        patientId: selectedPatient._id,
        uhid: selectedPatient.uhid,
        patientName: selectedPatient.patientName,
        patientMobile: selectedPatient.mobile,
        patientGender: selectedPatient.gender,
        patientAge: selectedPatient.patientAge,
        doctorName: selectedPatient.doctorName || 'General Staff',
        billType,
        items: selectedItems,
        gstPercentage: gstEnabled ? gstPercentage : 0,
        discountPercentage: discountEnabled ? discountPercentage : 0,
        discountReason: discountReason,
        remarks: remarks,
        status: finalize ? 'Final' : 'Draft',
        
        // Financial Ledger fields
        paymentMode: paymentMode,
        transactionRef: transactionRef,
        mixedPayments: paymentMode === 'Mixed Payment' ? [
          { method: 'Cash', amount: parseFloat(cashSplit || 0) },
          { method: 'UPI', amount: parseFloat(upiSplit || 0) },
          { method: 'Card', amount: parseFloat(cardSplit || 0) }
        ] : [],
        advanceAdjusted: parseFloat(advanceToAdjust || 0),
        amountPaid: finalize ? netPayable : 0,
        dueAmount: finalize ? 0 : grandTotal,
        paymentStatus: finalize ? 'Paid' : 'Unpaid'
      };

      const { data } = await client.post('/billing', payload);
      toast.success(finalize ? 'Tax Invoice generated and finalized' : 'Draft invoice saved');
      
      if (finalize) {
        // Automatically trigger Print Dialog with layout
        setPrintBillObj(data.bill);
        setPrintLayoutTab('invoice');
        setShowPrintModal(true);
        handleBackToList();
      } else {
        handleBackToList();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  // Open cancel dialog
  const promptCancelBill = (billId) => {
    setCancelBillId(billId);
    setCancelRemarks('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelRemarks.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }
    setCancelling(true);
    try {
      await client.put(`/billing/cancel/${cancelBillId}`, { remarks: cancelRemarks });
      toast.success('Invoice cancelled and advances reverted');
      setShowCancelModal(false);
      if (activeTab === 'dashboard') loadDashboardStats();
      if (activeTab === 'registry') loadInvoicesRegistry();
    } catch (err) {
      toast.error('Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  // Open print details modal
  const handleOpenPrintPreview = async (bill) => {
    setPrintBillObj(bill);
    setPrintLayoutTab('invoice');
    setShowPrintModal(true);
    try {
      const { data } = await client.get(`/billing/generate/${bill.uhid}?billType=All`);
      setSelectedPatient(data.patient);
      // Fetch all advances to get complete payment history
      const advRes = await client.get(`/billing/advance/${bill.uhid}`);
      setAllPatientAdvances(advRes.data || []);
    } catch (err) {
      console.error('Failed to fetch patient details for print preview:', err);
    }
  };

  // Print trigger
  const handlePrintAction = () => {
    toast.success('Opening print dialog...');
    window.print();
  };

  // PDF Generation matching print output
  const handleDownloadPDF = async () => {
    try {
      const element = printAreaRef.current;
      if (!element) { toast.error('Bill content container not found'); return; }

      toast.loading('Generating A4 PDF...');
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 Width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`HMS_Invoice_${printBillObj?.invoiceNo || printBillObj?.billNo}.pdf`);
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error('Failed to export PDF');
    }
  };

  const handleSaveBillRequest = async () => {
    if (!selectedPatient) { toast.error('No patient selected'); return; }
    if (selectedItems.length === 0) { toast.error('Please select at least one charge item to bill'); return; }

    setSaving(true);
    try {
      const payload = {
        patientId: selectedPatient._id,
        uhid: selectedPatient.uhid,
        patientName: selectedPatient.patientName,
        patientMobile: selectedPatient.mobile,
        patientGender: selectedPatient.gender,
        patientAge: selectedPatient.patientAge,
        doctorName: selectedPatient.doctorName || 'General Staff',
        billType,
        items: selectedItems,
        gstPercentage: gstEnabled ? gstPercentage : 0,
        discountPercentage: 0,
        discountReason: 'Discount Requested',
        remarks: remarks,
        status: 'Draft',
        discountRequestStatus: 'Pending',
        paymentMode: paymentMode || 'Cash',
        transactionRef: transactionRef,
        mixedPayments: paymentMode === 'Mixed Payment' ? [
          { method: 'Cash', amount: parseFloat(cashSplit || 0) },
          { method: 'UPI', amount: parseFloat(upiSplit || 0) },
          { method: 'Card', amount: parseFloat(cardSplit || 0) }
        ] : [],
        advanceAdjusted: parseFloat(advanceToAdjust || 0),
        amountPaid: 0,
        dueAmount: grandTotal,
        paymentStatus: 'Unpaid'
      };

      await client.post('/billing', payload);
      toast.success('Discount request submitted to Admin successfully');
      handleBackToList();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit discount request');
    } finally {
      setSaving(false);
    }
  };

  // Advance Payments drawers
  const handleOpenAdvanceDrawer = (patient) => {
    setSelectedAdvancePatient(patient);
    setAdvanceAmountInput('');
    setAdvanceRemarksInput('');
    setAdvanceModeInput('Cash');
    setShowAdvanceModal(true);
  };

  const handleSaveAdvancePayment = async () => {
    if (!advanceAmountInput || parseFloat(advanceAmountInput) <= 0) {
      toast.error('Please enter a valid advance amount');
      return;
    }
    setSavingAdvance(true);
    try {
      const now = new Date();
      const localDate = now.toLocaleDateString('sv-SE'); // returns 'YYYY-MM-DD'
      const localTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

      await client.post('/billing/advance', {
        patientId: selectedAdvancePatient._id,
        uhid: selectedAdvancePatient.uhid,
        amount: parseFloat(advanceAmountInput),
        paymentMode: advanceModeInput,
        remarks: advanceRemarksInput,
        date: localDate,
        time: localTime
      });
      toast.success('Advance payment recorded successfully');
      setShowAdvanceModal(false);
      loadEligiblePatients(searchQuery);
    } catch (err) {
      toast.error('Failed to record advance');
    } finally {
      setSavingAdvance(false);
    }
  };

  const handlePrintOverviewDraft = async () => {
    if (!selectedPatient) return;
    if (selectedItems.length === 0) {
      toast.error('Please select at least one charge item to show in overview');
      return;
    }

    try {
      // Fetch all advances to get complete payment history
      const { data } = await client.get(`/billing/advance/${selectedPatient.uhid}`);
      setAllPatientAdvances(data || []);
    } catch (err) {
      console.error('Failed to load complete advance history', err);
      setAllPatientAdvances([]);
    }

    const tempBill = {
      billNo: 'DRAFT-OVERVIEW',
      invoiceNo: 'DRAFT-OVERVIEW',
      patientName: selectedPatient.patientName,
      uhid: selectedPatient.uhid,
      patientMobile: selectedPatient.mobile,
      patientGender: selectedPatient.gender,
      patientAge: selectedPatient.patientAge,
      doctorName: selectedPatient.doctorName || 'General Staff',
      createdAt: new Date(),
      items: selectedItems,
      subtotal: subtotal,
      gstPercentage: gstEnabled ? gstPercentage : 0,
      gstAmount: gstAmount,
      discountPercentage: discountPercentage,
      discountAmount: discountAmount,
      grandTotal: grandTotal,
      advanceAdjusted: parseFloat(advanceToAdjust || 0),
      amountPaid: 0,
      dueAmount: netPayable,
      paymentMode: paymentMode || 'N/A',
      transactionRef: transactionRef,
      remarks: remarks,
      status: 'Draft Overview',
      createdBy: { username: user?.username || 'Billing Staff' }
    };

    setPrintBillObj(tempBill);
    setPrintLayoutTab('summary');
    setShowPrintModal(true);
  };

  const handlePrintLedgerDirectly = async (patient) => {
    setLoadingList(true);
    try {
      const { data } = await client.get(`/billing/generate/${patient.uhid}?billType=All`);
      const selectedItems = data.items || [];
      const subtotal = selectedItems.reduce((sum, i) => sum + i.total, 0);

      // Automated/Dynamic Discount Calculation
      let discountPercentage = 0;
      if (data.settings?.discountEnabled && data.patient && subtotal > 0) {
        discountPercentage = parseFloat((data.patient.discountPercentage || 0).toFixed(2));
      }
      const discountAmount = subtotal * (discountPercentage / 100);
      const grandTotal = subtotal - discountAmount;
      const totalAdvanceAvailable = data.totalAdvance || 0;
      const advanceAdjusted = Math.min(totalAdvanceAvailable, grandTotal);

      // Fetch all advances to get complete payment history
      const advRes = await client.get(`/billing/advance/${patient.uhid}`);
      setAllPatientAdvances(advRes.data || []);

      const tempBill = {
        billNo: 'LEDGER-SUMMARY',
        invoiceNo: 'LEDGER-SUMMARY',
        patientName: data.patient.patientName,
        uhid: data.patient.uhid,
        patientMobile: data.patient.mobile,
        patientGender: data.patient.gender,
        patientAge: data.patient.patientAge,
        doctorName: data.patient.doctorName || 'General Staff',
        createdAt: new Date(),
        items: selectedItems,
        subtotal: subtotal,
        gstPercentage: 0,
        gstAmount: 0,
        discountPercentage: discountPercentage,
        discountAmount: discountAmount,
        grandTotal: grandTotal,
        advanceAdjusted: advanceAdjusted,
        amountPaid: 0,
        dueAmount: Math.max(0, grandTotal - advanceAdjusted),
        paymentMode: 'N/A',
        transactionRef: '',
        remarks: 'Direct ledger print from billing desk',
        status: 'Ledger Summary',
        createdBy: { username: user?.username || 'Billing Staff' }
      };

      setPrintBillObj(tempBill);
      setPrintLayoutTab('summary');
      setShowPrintModal(true);
    } catch (err) {
      toast.error('Failed to compile patient ledger');
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedPatient(null);
    setItems([]);
    setSelectedItemIndexes([]);
    setPastBills([]);
    setCurrentBill(null);
  };

  // ===================== RENDER VIEWS =====================

  return (
    <div className="space-y-6 print:hidden">
      
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-orange-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-7 w-7 text-orange-500" /> Hospital Billing Desk
          </h1>
          <p className="text-sm text-gray-500">Generate consolidated invoices, patient ledgers, and manage payments</p>
        </div>
        
        {/* Workspace views selector */}
        {view === 'list' && (
          <div className="flex bg-orange-50/50 p-1 rounded-xl border border-orange-100 w-fit">
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'billing' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <Receipt className="h-4 w-4" /> Billing desk
            </button>
            <button
              onClick={() => setActiveTab('registry')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'registry' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <History className="h-4 w-4" /> Invoice Registry
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'dashboard' ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-950 hover:bg-orange-100/50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </button>
          </div>
        )}
      </div>

      {/* ===================== VIEW 1: BILLING WORKSPACE ===================== */}
      {activeTab === 'billing' && (
        <>
          {view === 'list' ? (
            <div className="space-y-6">
              {/* Patient Selection Desk */}
              <div className="card p-5 bg-gradient-to-br from-orange-50/20 to-white">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-10 py-3"
                      placeholder="Search patient by UHID, Name, or Mobile number to generate bill..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button onClick={() => loadEligiblePatients(searchQuery)} disabled={loadingList} className="btn px-6 py-3">
                    {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
                  </button>
                </div>
              </div>

              {loadingList ? (
                <div className="flex flex-col items-center justify-center p-16 card">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <span className="mt-3 text-sm text-gray-500 font-bold">Scanning hospital databases...</span>
                </div>
              ) : eligiblePatients.length === 0 ? (
                <div className="card p-16 text-center space-y-4">
                  <Coins className="h-16 w-16 mx-auto text-orange-200" />
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-lg">No Pending Patients Found</h3>
                    <p className="text-sm text-gray-400 max-w-md mx-auto mt-1">
                      Search above for any patient. Patients will list here automatically when they have billable services (OPD, IPD stay, OT records, Lab test charges, or Pharmacy bills).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="p-4 border-b border-orange-100 bg-orange-50/20 flex items-center justify-between">
                    <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <User className="h-5 w-5 text-orange-500" /> Patients with Pending Services ({eligiblePatients.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50/80 text-xs font-bold uppercase text-gray-500 border-b border-orange-100">
                          <th className="p-4 pl-6">Patient Details</th>
                          <th className="p-4">UHID</th>
                          <th className="p-4">Contact</th>
                          <th className="p-4">Pending Modules</th>
                          <th className="p-4 text-right">Sum Unbilled</th>
                          <th className="p-4 pr-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-50/60">
                        {eligiblePatients.map((p) => (
                          <tr key={p._id} className="hover:bg-orange-50/10 transition-colors">
                            <td className="p-4 pl-6">
                              <div>
                                <span className="font-extrabold text-gray-900">{p.patientName}</span>
                                <div className="text-[10px] text-gray-400 mt-0.5">{p.gender} • {p.patientAge ? `${p.patientAge} years` : 'Age N/A'}</div>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-orange-700 text-xs">{formatUhid(p.uhid)}</td>
                            <td className="p-4 text-xs text-gray-600">{p.mobile}</td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {(p.categories || []).map(cat => (
                                  <span key={cat} className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[9px] font-black uppercase ${CATEGORY_COLORS[cat] || 'bg-gray-100'}`}>
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-black text-orange-600">₹{(p.totalPendingAmount || 0).toFixed(2)}</span>
                            </td>
                            <td className="p-4 pr-6">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenAdvanceDrawer(p)}
                                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Record Advance
                                </button>
                                <button
                                  onClick={() => handleCreateBill(p)}
                                  className="btn text-xs py-1.5 px-3 flex items-center gap-1"
                                >
                                  <FileText className="h-3.5 w-3.5" /> Generate Invoice
                                </button>
                                <button
                                  onClick={() => handlePrintLedgerDirectly(p)}
                                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 border-dashed border-orange-300 text-orange-700 hover:bg-orange-50"
                                >
                                  <Printer className="h-3.5 w-3.5" /> Print Ledger
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ===================== GENERATE BILL SCREEN =====================
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <button onClick={handleBackToList} className="p-2 hover:bg-orange-50 rounded-lg transition-colors">
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Invoice Builder</h2>
                  <p className="text-xs text-gray-500">Configure parameters, select unbilled items, and apply ledger advance</p>
                </div>
              </div>

              {/* Patient Card & IPD stay info */}
              {selectedPatient && (
                <div className="card p-5 bg-gradient-to-br from-orange-50/30 to-white border border-orange-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 border-r border-orange-100/50 pr-4">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Patient Demographics</span>
                    <h3 className="text-lg font-black text-gray-900 mt-1">{selectedPatient.patientName}</h3>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                      <span className="font-mono font-bold text-orange-700">{formatUhid(selectedPatient.uhid)}</span>
                      <span>• {selectedPatient.gender}</span>
                      <span>• {selectedPatient.patientAge ? `${selectedPatient.patientAge} Yrs` : ''}</span>
                      <span>• {selectedPatient.mobile}</span>
                    </div>
                    {selectedPatient.address && <p className="text-[10px] text-gray-400 mt-1">Address: {selectedPatient.address}</p>}
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Billing Context</span>
                    <div className="text-xs text-gray-700 space-y-1 mt-1">
                      <p><span className="text-gray-400">Attending Doctor:</span> <span className="font-bold">{selectedPatient.doctorName}</span></p>
                      <p><span className="text-gray-400">Reg. Date:</span> {selectedPatient.registrationDate || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">IPD Bed Stay Details</span>
                    {selectedPatient.admissionDetails ? (
                      <div className="text-xs text-gray-700 space-y-0.5 mt-1 font-semibold">
                        <p className="text-orange-700">IPD ID: {selectedPatient.admissionDetails.ipdNumber}</p>
                        <p>Bed: {selectedPatient.admissionDetails.bedNumber} ({selectedPatient.admissionDetails.roomType})</p>
                        <p>Admitted: {new Date(selectedPatient.admissionDetails.admissionDate).toLocaleDateString('en-IN')}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">No active admission (OPD patient)</p>
                    )}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="card p-16 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <span className="mt-3 text-xs text-gray-500 font-bold">Consolidating charges across hospital modules...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Items Table Checkbox Selector (Col-span 2) */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Bill Category Tabs */}
                    <div className="card p-2 flex gap-1.5 overflow-x-auto bg-gray-50/50">
                      {BILL_TYPES.map(bt => (
                        <button
                          key={bt.id}
                          onClick={() => handleBillTypeChange(bt.id)}
                          className={`flex items-center gap-1 text-xs font-bold py-2 px-3 rounded-lg transition-all shrink-0 ${
                            billType === bt.id ? 'bg-white text-orange-700 shadow-sm border border-orange-200' : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <bt.icon className="h-3.5 w-3.5" /> {bt.label}
                        </button>
                      ))}
                    </div>

                    <div className="card overflow-hidden">
                      <div className="p-4 border-b border-orange-100 bg-orange-50/20 flex items-center justify-between">
                        <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                          <Receipt className="h-4.5 w-4.5 text-orange-500" /> Select Charges to Invoice ({selectedItemIndexes.length} selected)
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 font-bold border-b border-orange-100">
                              <th className="p-3 pl-4 text-center w-10">
                                <input
                                  type="checkbox"
                                  className="rounded border-orange-200 text-orange-600 focus:ring-orange-500"
                                  checked={items.length > 0 && selectedItemIndexes.length === items.length}
                                  onChange={handleSelectAllCheckbox}
                                />
                              </th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Description</th>
                              <th className="p-3 text-right">Price</th>
                              <th className="p-3 text-right">Qty</th>
                              <th className="p-3 text-right pr-4">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-orange-50/60">
                            {items.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="p-12 text-center text-gray-400 font-bold">
                                  No pending unbilled charges in this module.
                                </td>
                              </tr>
                            ) : (
                              items.map((item, idx) => {
                                const isChecked = selectedItemIndexes.includes(idx);
                                return (
                                  <tr
                                    key={idx}
                                    className={`hover:bg-orange-50/10 cursor-pointer ${isChecked ? 'bg-orange-50/20' : ''}`}
                                    onClick={() => handleToggleItemCheckbox(idx)}
                                  >
                                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        className="rounded border-orange-200 text-orange-600 focus:ring-orange-500"
                                        checked={isChecked}
                                        onChange={() => handleToggleItemCheckbox(idx)}
                                      />
                                    </td>
                                    <td className="p-3 font-mono">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-800'}`}>
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="p-3 font-bold text-gray-800 max-w-[280px] truncate">{item.description}</td>
                                    <td className="p-3 text-right font-semibold text-gray-600">
                                      {item.category === 'SameDayTreatment' && sdtPricingInBilling ? (
                                        <div className="relative inline-block w-24" onClick={(e) => e.stopPropagation()}>
                                          <span className="absolute left-1.5 top-1 text-gray-400 font-bold">₹</span>
                                          <input
                                            type="number"
                                            min="0"
                                            className="input text-xs py-0.5 pl-4 pr-1 font-mono font-bold w-full text-right bg-white border border-orange-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                                            value={item.price}
                                            onChange={(e) => {
                                              const newPrice = parseFloat(e.target.value) || 0;
                                              setItems(prev => prev.map((itemVal, valIdx) => {
                                                if (valIdx === idx) {
                                                  return {
                                                    ...itemVal,
                                                    price: newPrice,
                                                    total: newPrice * itemVal.quantity
                                                  };
                                                }
                                                return itemVal;
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : (
                                        `₹${(item.price || 0).toFixed(2)}`
                                      )}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-gray-600">{item.quantity}</td>
                                    <td className="p-3 text-right font-black text-gray-900 pr-4">₹{(item.total || 0).toFixed(2)}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Payment side desk (Col-span 1) */}
                  <div className="space-y-6">
                    <div className="card p-5 space-y-4">
                      <h4 className="font-extrabold text-gray-900 text-sm border-b border-orange-100 pb-2">Financial Breakdown</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-gray-500"><span>Gross Subtotal:</span><span className="font-bold text-gray-800">₹{subtotal.toFixed(2)}</span></div>
                        
                        {/* GST Configuration (Toggled by cashier) */}
                        <div className="bg-orange-50/10 p-2.5 rounded-lg border border-orange-100/50 space-y-1.5">
                          <div className="flex justify-between text-gray-500 items-center">
                            <span>GST ({gstPercentage}%):</span>
                            <span className="font-bold text-blue-700">+ ₹{gstAmount.toFixed(2)}</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="checkbox"
                                id="apply-gst-toggle"
                                className="rounded border-orange-200 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                                checked={gstEnabled}
                                onChange={(e) => {
                                  setGstEnabled(e.target.checked);
                                  setGstPercentage(e.target.checked ? 18 : 0);
                                }}
                              />
                              <label htmlFor="apply-gst-toggle" className="text-[11px] font-bold text-gray-700 cursor-pointer">
                                Apply GST on Invoice
                              </label>
                            </div>
                            {gstEnabled && (
                              <div className="flex items-center gap-2 mt-1.5 animate-fadeIn">
                                <span className="text-[10px] text-gray-500 shrink-0">GST Rate:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  className="input text-xs py-1 px-1.5 font-mono font-bold w-16 text-blue-700 bg-white"
                                  placeholder="18"
                                  value={gstPercentage}
                                  onChange={(e) => setGstPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                />
                                <span className="text-[10px] text-gray-500">%</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Discount Manager */}
                        <div className="space-y-3 bg-orange-50/20 p-2.5 rounded-lg border border-orange-100/50">
                          <div className="flex items-center justify-between text-gray-500">
                            <span>Discount (Pending Admin):</span>
                            <span className="font-bold text-gray-600">₹0.00</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="checkbox"
                                id="request-discount-toggle"
                                className="rounded border-orange-200 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                                checked={requestAdminDiscount}
                                onChange={(e) => setRequestAdminDiscount(e.target.checked)}
                              />
                              <label htmlFor="request-discount-toggle" className="text-[11px] font-bold text-gray-700 cursor-pointer">
                                Request Admin Discount
                              </label>
                            </div>
                            {requestAdminDiscount && (
                              <div className="text-[10px] space-y-1 text-gray-600 leading-normal">
                                <p className="font-bold text-orange-600">Admin discount will be calculated from the subtotal.</p>
                                <p>Subtotal: <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span></p>
                                <p>{gstEnabled ? `GST (${gstPercentage}%) will be recalculated on the discounted subtotal.` : 'GST is not applied, so discount subtracts directly from the total.'}</p>
                                <p className="text-orange-600">This invoice will be sent as a draft and finalized once Admin approves the percentage.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Grand Total */}
                        <div className="border-t border-orange-100 pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                          <span>Grand Total:</span>
                          <span className="font-extrabold text-gray-900 text-base">₹{grandTotal.toFixed(2)}</span>
                        </div>

                        {/* Patient Advance Adjustment Ledger */}
                        {totalAdvanceAvailable > 0 && (
                          <div className="bg-green-50/30 border border-green-200/50 p-3 rounded-xl space-y-2 mt-3">
                            <div className="flex justify-between text-[11px] font-bold text-green-800">
                              <span>Available Patient Advance:</span>
                              <span>₹{totalAdvanceAvailable.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 shrink-0">Adjust Amount:</span>
                              <input
                                type="number"
                                min="0"
                                max={maxAllowedAdjustment}
                                step="1"
                                className="input text-xs py-1 px-2 font-bold font-mono text-green-700 bg-white"
                                placeholder="0.00"
                                value={advanceToAdjust}
                                onChange={(e) => setAdvanceToAdjust(Math.min(maxAllowedAdjustment, Math.max(0, parseFloat(e.target.value) || 0)))}
                              />
                            </div>
                            <p className="text-[9px] text-gray-400">Advance adjustment reduces payable amount, but does not display as charge on Standard Tax Invoice.</p>
                          </div>
                        )}

                        {/* Net Payable Amount */}
                        <div className="border-t-2 border-dashed border-orange-200 pt-3 flex justify-between items-center text-base font-black">
                          <span className="text-orange-950">Net Payable Amount:</span>
                          <span className="text-orange-600 text-lg">₹{netPayable.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Final Payment Mode selector */}
                    <div className="card p-5 space-y-4">
                      <h4 className="font-extrabold text-gray-900 text-sm border-b border-orange-100 pb-2">Final Payment Mode</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Select Mode</label>
                          <select
                            className="input text-xs font-bold py-2.5"
                            value={paymentMode}
                            onChange={(e) => setPaymentMode(e.target.value)}
                          >
                            <option value="">-- Select Payment Mode --</option>
                            {PAYMENT_MODES.map(mode => (
                              <option key={mode} value={mode}>{mode}</option>
                            ))}
                          </select>
                        </div>

                        {/* Transaction reference if applicable */}
                        {paymentMode && paymentMode !== 'Cash' && paymentMode !== 'Mixed Payment' && (
                          <div className="animate-fadeIn">
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Transaction Ref / Cheque No / Card details</label>
                            <input
                              className="input text-xs py-2 font-mono"
                              placeholder="Reference Number..."
                              value={transactionRef}
                              onChange={(e) => setTransactionRef(e.target.value)}
                            />
                          </div>
                        )}

                        {/* Mixed payment splits */}
                        {paymentMode === 'Mixed Payment' && (
                          <div className="bg-orange-50/20 p-3 rounded-lg border border-orange-100 space-y-2 animate-fadeIn">
                            <span className="text-[10px] text-gray-400 font-bold block mb-1">Enter Splits (Must sum to ₹{netPayable.toFixed(2)})</span>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[9px] text-gray-400 uppercase font-black">Cash</label>
                                <input
                                  type="number"
                                  min="0"
                                  className="input text-xs py-1 px-1.5 font-mono font-bold"
                                  value={cashSplit}
                                  onChange={(e) => setCashSplit(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-400 uppercase font-black">UPI</label>
                                <input
                                  type="number"
                                  min="0"
                                  className="input text-xs py-1 px-1.5 font-mono font-bold"
                                  value={upiSplit}
                                  onChange={(e) => setUpiSplit(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-400 uppercase font-black">Card</label>
                                <input
                                  type="number"
                                  min="0"
                                  className="input text-xs py-1 px-1.5 font-mono font-bold"
                                  value={cardSplit}
                                  onChange={(e) => setCardSplit(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Notes / Remarks</label>
                          <textarea
                            className="input text-xs"
                            rows={2}
                            placeholder="Add invoice notes..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={handlePrintOverviewDraft}
                          className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5 border-dashed border-orange-300 text-orange-700 hover:bg-orange-50"
                        >
                          <Printer className="h-4 w-4" /> Print Patient Overview
                        </button>
                        {requestAdminDiscount ? (
                          <button
                            onClick={handleSaveBillRequest}
                            disabled={saving}
                            className="btn text-xs py-2.5 w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold flex items-center justify-center gap-1.5"
                          >
                            <Save className="h-4 w-4" /> Submit Discount Request
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveBill(false)}
                              disabled={saving}
                              className="btn-secondary text-xs py-2.5 flex-1"
                            >
                              {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button
                              onClick={() => handleSaveBill(true)}
                              disabled={saving}
                              className="btn text-xs py-2.5 flex-1"
                            >
                              {saving ? 'Processing...' : 'Finalize Invoice'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===================== VIEW 2: INVOICE REGISTRY ===================== */}
      {activeTab === 'registry' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filters Registry panel */}
          <div className="card p-5 bg-gradient-to-br from-orange-50/10 to-white grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                className="input pl-10"
                placeholder="Search by Patient, UHID, Invoice No..."
                value={registryFilterQuery}
                onChange={(e) => setRegistryFilterQuery(e.target.value)}
              />
            </div>
            
            <select
              className="input text-xs"
              value={registryFilterStatus}
              onChange={(e) => setRegistryFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Final">Finalized</option>
              <option value="Draft">Drafts</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              className="input text-xs"
              value={registryFilterMode}
              onChange={(e) => setRegistryFilterMode(e.target.value)}
            >
              <option value="">All Payments</option>
              {PAYMENT_MODES.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>

            <button onClick={loadInvoicesRegistry} className="btn py-2.5 px-4">
              Apply Filters
            </button>

            <div className="md:col-span-2 flex items-center gap-2">
              <span className="text-xs text-gray-400 shrink-0">From Date:</span>
              <input type="date" className="input py-2 text-xs" value={registryFromDate} onChange={(e) => setRegistryFromDate(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <span className="text-xs text-gray-400 shrink-0">To Date:</span>
              <input type="date" className="input py-2 text-xs" value={registryToDate} onChange={(e) => setRegistryToDate(e.target.value)} />
            </div>
            <button
              onClick={() => {
                setRegistryFilterQuery('');
                setRegistryFilterStatus('');
                setRegistryFilterMode('');
                setRegistryFromDate('');
                setRegistryToDate('');
              }}
              className="btn-secondary py-2 text-xs"
            >
              Reset Filters
            </button>
          </div>

          {/* Invoices List */}
          {loadingInvoices ? (
            <div className="flex flex-col items-center justify-center p-16 card">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="mt-2 text-xs text-gray-500 font-bold">Scanning billing records...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="card p-16 text-center text-gray-400 font-bold">
              No matching invoices found in registry.
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-bold border-b border-orange-100">
                      <th className="p-3 pl-4">Invoice No</th>
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">UHID</th>
                      <th className="p-3">Finalized Date</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 pr-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50/60 font-semibold">
                    {invoices.map(bill => (
                      <tr key={bill._id} className="hover:bg-orange-50/10">
                        <td className="p-3 pl-4 font-mono font-bold text-orange-700">{bill.invoiceNo || bill.billNo}</td>
                        <td className="p-3 font-extrabold text-gray-900">{bill.patientName}</td>
                        <td className="p-3 font-mono text-xs">{formatUhid(bill.uhid)}</td>
                        <td className="p-3 text-gray-600">{new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="p-3 text-gray-600">{bill.paymentMode || 'N/A'}</td>
                        <td className="p-3 text-right font-black text-gray-800">₹{(bill.grandTotal || 0).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                            bill.status === 'Cancelled'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : bill.status === 'Final'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="p-3 pr-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenPrintPreview(bill)}
                              className="btn-secondary text-[10px] py-1 px-2 flex items-center gap-1"
                              title="Print Invoice / Summary"
                            >
                              <Eye className="h-3 w-3" /> View Printout
                            </button>
                            {bill.status === 'Final' && isAdmin && (
                              <button
                                onClick={() => promptCancelBill(bill._id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Cancel Invoice"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== VIEW 3: DASHBOARD ===================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {loadingStats ? (
            <div className="flex flex-col items-center justify-center p-16 card">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="mt-2 text-xs text-gray-500 font-bold">Scanning ledger totals...</span>
            </div>
          ) : (
            <>
              {/* Stats Counters Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white space-y-2 shadow-md">
                  <span className="text-[10px] uppercase font-bold text-orange-100 tracking-wider">Today's Collections</span>
                  <h3 className="text-2xl font-black">₹{stats.todayCollection.toFixed(2)}</h3>
                  <p className="text-[10px] text-orange-100">Sum of finalized invoices today</p>
                </div>
                
                <div className="card p-5 bg-white border border-orange-100 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Monthly Collections</span>
                  <h3 className="text-2xl font-black text-gray-900">₹{stats.monthlyCollection.toFixed(2)}</h3>
                  <p className="text-[10px] text-gray-400">Sum of transactions this month</p>
                </div>

                <div className="card p-5 bg-white border border-orange-100 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Outstanding Dues</span>
                  <h3 className="text-2xl font-black text-red-600">₹{stats.outstandingPayments.toFixed(2)}</h3>
                  <p className="text-[10px] text-gray-400">Sum of unfinalized balances</p>
                </div>

                <div className="card p-5 bg-white border border-orange-100 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Discounts Granted Today</span>
                  <h3 className="text-2xl font-black text-orange-600">₹{stats.discountSummary.toFixed(2)}</h3>
                  <p className="text-[10px] text-gray-400">Sum of discounts applied today</p>
                </div>
              </div>

              {/* Status Analysis Counts */}
              <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="border-r border-orange-100 last:border-0 p-2">
                  <span className="text-2xl font-black text-green-600">{stats.billCounts.paid}</span>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Paid Invoices</p>
                </div>
                <div className="border-r border-orange-100 last:border-0 p-2">
                  <span className="text-2xl font-black text-yellow-600">{stats.billCounts.unpaid + stats.billCounts.partiallyPaid}</span>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Unpaid / Drafts</p>
                </div>
                <div className="border-r border-orange-100 last:border-0 p-2">
                  <span className="text-2xl font-black text-red-500">{stats.billCounts.cancelled}</span>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Cancelled Bills</p>
                </div>
                <div className="p-2">
                  <span className="text-2xl font-black text-orange-600">
                    {stats.billCounts.paid + stats.billCounts.unpaid + stats.billCounts.partiallyPaid}
                  </span>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Total Active Ledger</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ===================== MODAL 1: RECORD ADVANCE DIALOG ===================== */}
      {showAdvanceModal && selectedAdvancePatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-orange-100">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-1.5">
                <Coins className="h-5 w-5 text-orange-500" /> Record Patient Advance
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-semibold text-gray-800">
              <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 grid grid-cols-2 gap-2 text-[11px]">
                <div className="col-span-2 border-b border-orange-100 pb-1 mb-1">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Patient Details</p>
                  <h4 className="font-extrabold text-gray-900 mt-0.5">{selectedAdvancePatient.patientName}</h4>
                  <p className="font-mono text-orange-700 mt-0.5">{formatUhid(selectedAdvancePatient.uhid)}</p>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider">Date (Auto-Detected)</span>
                  <span className="font-extrabold text-gray-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider">Time (Auto-Detected)</span>
                  <span className="font-extrabold text-gray-900">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 mb-1">Advance Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  className="input py-2.5 font-bold font-mono text-orange-700"
                  placeholder="Enter amount in ₹..."
                  value={advanceAmountInput}
                  onChange={(e) => setAdvanceAmountInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 mb-1">Payment Mode *</label>
                <select
                  className="input py-2.5"
                  value={advanceModeInput}
                  onChange={(e) => setAdvanceModeInput(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 mb-1">Remarks / Ledger Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Add reference notes..."
                  value={advanceRemarksInput}
                  onChange={(e) => setAdvanceRemarksInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-orange-100 pt-3">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="btn-secondary py-2.5 px-4 text-xs"
                disabled={savingAdvance}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdvancePayment}
                disabled={savingAdvance || !advanceAmountInput}
                className="btn py-2.5 px-4 text-xs"
              >
                {savingAdvance ? 'Recording...' : 'Submit Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* ===================== MODAL 2: CANCEL BILL DIALOG ===================== */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-red-100">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <h3 className="text-base font-extrabold text-red-800 flex items-center gap-1.5">
                <Ban className="h-5 w-5" /> Cancel Finalized Invoice
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                Cancelling this invoice will mark it permanently as <span className="font-bold text-red-600">Cancelled</span>. Any applied patient advance adjustments associated with this invoice will automatically revert to <span className="font-bold text-green-600">Available</span> status.
              </p>
              
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Cancellation Reason *</label>
                <textarea
                  className="input text-xs"
                  rows={3}
                  placeholder="Enter cancellation reason for audit trails..."
                  value={cancelRemarks}
                  onChange={(e) => setCancelRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary py-2.5 px-4 text-xs"
                disabled={cancelling}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling || !cancelRemarks.trim()}
                className="btn py-2.5 px-4 text-xs bg-red-600 hover:bg-red-700"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ===================== MODAL 3: PRINT PREVIEW DRAWER ===================== */}
      {showPrintModal && printBillObj && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-gray-100 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-orange-500" />
                <div>
                  <h3 className="font-black text-gray-900 text-sm">Invoice No: {printBillObj.invoiceNo || printBillObj.billNo}</h3>
                  <p className="text-[10px] text-gray-500">Select formatting layout before printing or exporting</p>
                </div>
              </div>

              {/* Layout Switcher tabs */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 w-fit text-xs font-bold">
                <button
                  onClick={() => setPrintLayoutTab('invoice')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    printLayoutTab === 'invoice' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  Standard Tax Invoice
                </button>
                <button
                  onClick={() => setPrintLayoutTab('summary')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    printLayoutTab === 'summary' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  Bill Summary Ledger
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleDownloadPDF} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>
                <button onClick={handlePrintAction} className="btn py-2 px-4 text-xs flex items-center gap-1">
                  <Printer className="h-3.5 w-3.5" /> Print Out
                </button>
                <button onClick={() => setShowPrintModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full">
                  <X className="h-4.5 w-4.5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Print Area Preview Container */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-200/50">
              <div
                ref={printAreaRef}
                className="bg-white shadow-lg w-[210mm] min-h-[297mm] p-10 border border-gray-300 relative text-gray-900 overflow-hidden text-left leading-normal"
                id="invoice-print-area"
              >
                {/* Printout stylesheet rules */}
                <style>{`
                  #invoice-print-area {
                    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                    color: #000000 !important;
                    background-color: #ffffff !important;
                  }
                  #invoice-print-area * {
                    color: #000000 !important;
                    border-color: #000000 !important;
                  }
                  #invoice-print-area table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                  }
                  #invoice-print-area th {
                    border: 1px solid #000000;
                    padding: 8px 10px;
                    font-weight: 800;
                    text-align: left;
                    font-size: 11px;
                    background-color: transparent !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  #invoice-print-area td {
                    border: 1px solid #000000;
                    padding: 8px 10px;
                    font-size: 11px;
                  }
                  #invoice-print-area .meta-label {
                    font-weight: 800;
                  }
                  #invoice-print-area .logo-grayscale {
                    filter: grayscale(100%) !important;
                    -webkit-filter: grayscale(100%) !important;
                  }
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #invoice-print-area, #invoice-print-area * {
                      visibility: visible;
                      color: #000000 !important;
                      background-color: transparent !important;
                      background: none !important;
                      box-shadow: none !important;
                    }
                    #invoice-print-area {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100% !important;
                      border: none !important;
                      box-shadow: none !important;
                      padding: 10mm !important;
                      margin: 0 !important;
                    }
                  }
                `}</style>

                {/* Hospital Header */}
                <div className="border-b-2 border-black pb-4 flex justify-between items-start gap-4">
                  <div className="flex items-center gap-4">
                    {hospitalInfo?.logoUrl && (
                      <img
                        src={hospitalInfo.logoUrl}
                        alt="Hospital Logo"
                        className="h-16 w-16 object-contain logo-grayscale"
                      />
                    )}
                    <div>
                      <h1 className="text-xl font-black uppercase tracking-tight">{hospitalInfo?.hospitalName || 'HOSPITAL NAME'}</h1>
                      {hospitalInfo?.hospitalHeading && <p className="text-[10px] font-bold text-gray-600 -mt-0.5">{hospitalInfo.hospitalHeading}</p>}
                      <p className="text-[10px] text-gray-600 mt-1 max-w-sm">{hospitalInfo?.address || ''}</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-gray-700 space-y-0.5 font-semibold">
                    {hospitalInfo?.phoneNumbers?.length > 0 && <p>Phone: {hospitalInfo.phoneNumbers.join(', ')}</p>}
                    {hospitalInfo?.emailAddress && <p>Email: {hospitalInfo.emailAddress}</p>}
                    {hospitalInfo?.website && <p>Website: {hospitalInfo.website}</p>}
                    {hospitalInfo?.gstNumber && <p>GSTIN: {hospitalInfo.gstNumber}</p>}
                  </div>
                </div>

                {/* Invoice Title */}
                <div className="text-center my-6">
                  <h2 className="text-base font-black uppercase tracking-widest border-b border-black w-fit mx-auto pb-0.5">
                    {printLayoutTab === 'invoice' ? 'TAX INVOICE' : 'BILL SUMMARY LEDGER'}
                  </h2>
                  {printBillObj.status === 'Cancelled' && (
                    <div className="text-red-600 text-xs font-black mt-1 uppercase border-2 border-red-600 px-3 py-1 rounded w-fit mx-auto animate-pulse">
                      Cancelled Invoice
                    </div>
                  )}
                </div>

                {/* Patient & Invoice Meta Information Block */}
                <div className="grid grid-cols-2 gap-6 text-[11px] mb-6">
                  <div className="space-y-1 p-3 rounded border border-gray-300">
                    <h3 className="font-extrabold text-xs border-b border-gray-300 pb-1 uppercase">Patient Details</h3>
                    <p><span className="meta-label">Patient Name:</span> {printBillObj.patientName}</p>
                    <p><span className="meta-label">UHID:</span> <span className="font-mono">{formatUhid(printBillObj.uhid)}</span></p>
                    <p><span className="meta-label">Age / Gender:</span> {printBillObj.patientAge ? `${printBillObj.patientAge} Years` : 'N/A'} / {printBillObj.patientGender}</p>
                    <p><span className="meta-label">Mobile:</span> {printBillObj.patientMobile || '-'}</p>
                  </div>
                  
                  <div className="space-y-1 p-3 rounded border border-gray-300">
                    <h3 className="font-extrabold text-xs border-b border-gray-300 pb-1 uppercase">Invoice Metadata</h3>
                    <p><span className="meta-label">Invoice No:</span> <span className="font-mono font-bold">{printBillObj.invoiceNo || printBillObj.billNo}</span></p>
                    <p><span className="meta-label">Date & Time:</span> {new Date(printBillObj.createdAt).toLocaleString('en-IN')}</p>
                    <p><span className="meta-label">Consulting Doctor:</span> {printBillObj.doctorName || selectedPatient?.doctorName || 'General Staff'}</p>
                    {selectedPatient?.admissionDetails?.ipdNumber && (
                      <p><span className="meta-label">IPD Number:</span> {selectedPatient.admissionDetails.ipdNumber}</p>
                    )}
                  </div>
                </div>

                {/* Charges Table */}
                <table>
                  <thead>
                    <tr>
                      <th className="w-12 text-center">Sr No</th>
                      <th>Service Name</th>
                      <th>Category</th>
                      <th className="text-right w-16">Quantity</th>
                      <th className="text-right w-20">Rate</th>
                      <th className="text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(printBillObj.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td className="font-bold">{item.description}</td>
                        <td>{item.category}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right font-mono">₹{(item.price || 0).toFixed(2)}</td>
                        <td className="text-right font-mono font-bold">₹{(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-bold text-[11px] font-mono">
                    <tr>
                      <td colSpan="5" className="text-right border-r-0">Gross Subtotal:</td>
                      <td className="text-right border-l-0">₹{(printBillObj.subtotal || 0).toFixed(2)}</td>
                    </tr>
                    {printBillObj.gstPercentage > 0 && (
                      <tr>
                        <td colSpan="5" className="text-right border-r-0">GST ({printBillObj.gstPercentage}%):</td>
                        <td className="text-right border-l-0">+ ₹{(printBillObj.gstAmount || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    {printBillObj.discountPercentage > 0 && (
                      <tr>
                        <td colSpan="5" className="text-right border-r-0">Discount ({printBillObj.discountPercentage}%):</td>
                        <td className="text-right border-l-0">- ₹{(printBillObj.discountAmount || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="text-[12px] font-black uppercase">
                      <td colSpan="5" className="text-right border-r-0">Grand Total:</td>
                      <td className="text-right border-l-0">₹{(printBillObj.grandTotal || 0).toFixed(2)}</td>
                    </tr>

                    {/* LAYOUT DIFFERENCE: SUMMARY LEDGER DETAILS */}
                    {printLayoutTab === 'summary' && (
                      <>
                        {printBillObj.advanceAdjusted > 0 && (
                          <tr className="text-green-700">
                            <td colSpan="5" className="text-right border-r-0">Advance Adjusted:</td>
                            <td className="text-right border-l-0">- ₹{(printBillObj.advanceAdjusted || 0).toFixed(2)}</td>
                          </tr>
                        )}
                        <tr className="text-blue-700">
                          <td colSpan="5" className="text-right border-r-0">Amount Paid In Invoice:</td>
                          <td className="text-right border-l-0">₹{(printBillObj.amountPaid || 0).toFixed(2)}</td>
                        </tr>
                        {printBillObj.dueAmount > 0 && (
                          <tr className="text-red-600">
                            <td colSpan="5" className="text-right border-r-0">Balance Due Outstanding:</td>
                            <td className="text-right border-l-0 font-black">₹{(printBillObj.dueAmount || 0).toFixed(2)}</td>
                          </tr>
                        )}
                      </>
                    )}
                  </tfoot>
                </table>

                {/* Complete Advance Payments Table shown only in Bill Summary */}
                {printLayoutTab === 'summary' && allPatientAdvances.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-extrabold uppercase text-xs border-b border-black pb-1 mb-2">Advance Payments Ledger</h4>
                    <table>
                      <thead>
                        <tr>
                          <th className="text-center w-12">Sr No</th>
                          <th>Date & Time</th>
                          <th>Payment Mode</th>
                          <th>Remarks</th>
                          <th>Status</th>
                          <th className="text-right w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPatientAdvances.map((adv, idx) => (
                          <tr key={adv._id || idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td>
                              {adv.date ? new Date(adv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''} {adv.time || ''}
                            </td>
                            <td>{adv.paymentMode}</td>
                            <td className="italic">{adv.remarks || '-'}</td>
                            <td className="font-bold">
                              {adv.isAdjusted ? (
                                <span className="text-gray-500">Adjusted</span>
                              ) : (
                                <span className="text-green-700">Available</span>
                              )}
                            </td>
                            <td className="text-right font-mono font-bold">₹{(adv.amount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="font-bold font-mono text-[11px]">
                        <tr>
                          <td colSpan="5" className="text-right border-r-0">Total Advance Collected:</td>
                          <td className="text-right border-l-0">
                            ₹{allPatientAdvances.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Additional payment history shown only in Bill Summary */}
                {printLayoutTab === 'summary' && (
                  <div className="mt-6 text-[10px] space-y-2 border border-gray-300 p-3 rounded">
                    <h4 className="font-extrabold uppercase text-xs border-b border-gray-200 pb-1">Payment & Adjustment History</h4>
                    <p><span className="font-bold">Payment Mode:</span> {printBillObj.paymentMode || 'N/A'}</p>
                    {printBillObj.transactionRef && <p><span className="font-bold">Transaction Ref:</span> {printBillObj.transactionRef}</p>}
                    {printBillObj.paymentMode === 'Mixed Payment' && printBillObj.mixedPayments?.length > 0 && (
                      <p>
                        <span className="font-bold">Mixed Payment Split:</span>{' '}
                        {printBillObj.mixedPayments.map(p => `${p.method}: ₹${p.amount.toFixed(2)}`).join(' | ')}
                      </p>
                    )}
                    {printBillObj.remarks && <p><span className="font-bold">Invoice Remarks:</span> {printBillObj.remarks}</p>}
                  </div>
                )}

                {/* Footer Declaration */}
                {hospitalInfo?.invoiceFooterMessage ? (
                  <p className="text-[10px] text-gray-500 italic mt-8 text-center">{hospitalInfo.invoiceFooterMessage}</p>
                ) : (
                  <p className="text-[9px] text-gray-400 italic mt-8 text-center">Computer generated document. Signature not required unless manual stamp is present.</p>
                )}

                {/* Bottom Signatures Block */}
                <div className="mt-12 border-t border-gray-300 pt-6">
                  <div className="grid grid-cols-3 gap-4 text-[10px] text-center font-bold">
                    <div className="text-left">
                      <p className="text-gray-400 text-[9px] uppercase font-black mb-6">Prepared By</p>
                      <p className="text-gray-800">{printBillObj.createdBy?.doctorName || printBillObj.createdBy?.username || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[9px] uppercase font-black mb-6">Patient Signature</p>
                      <div className="border-b border-gray-300 w-3/4 mx-auto mt-6"></div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-[9px] uppercase font-black mb-6">Authorized Stamp & Sign</p>
                      <div className="border-b border-gray-300 w-3/4 ml-auto mt-6"></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default BillingPage;