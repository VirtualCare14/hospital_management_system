import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search, User, Loader2, Printer, Download, Save, CheckCircle,
  X, Trash2, RefreshCw, FileText, Eye, Phone,
  Building2, CreditCard, Percent, DollarSign, Receipt, FileDown,
  ArrowLeft, Stethoscope, Pill, TestTube, BedDouble, Package, Plus, Trash, EyeOff, LayoutDashboard, History, Coins, Ban,
  MoreVertical, Pencil, Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, FileCheck, BadgeIndianRupee, Calendar, Filter, MapPin, UserCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import html2canvas from 'html2canvas';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useLocation } from 'react-router-dom';
import client from '../../api/client';
import { useHeader } from '../../context/HeaderContext';
import { formatUhid } from '../../utils/uhid';
import PaginationFooter from '../../components/PaginationFooter';

const BILL_TYPES = [
  { id: 'All', label: 'All Connected Modules', icon: FileText },
  { id: 'OPD', label: 'OPD Charges Only', icon: User },
  { id: 'Lab', label: 'Laboratory Only', icon: TestTube },
  { id: 'IPD', label: 'IPD/Bed Assignment Only', icon: BedDouble },
  { id: 'OT', label: 'OT Surgery Only', icon: CreditCard },
  { id: 'Pharmacy', label: 'Pharmacy Only', icon: Pill },
  { id: 'SameDayTreatment', label: 'Same Day Only', icon: Package }
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
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isSameDayCare = location.pathname.startsWith('/same-day-care/billing');
  const queryTab = searchParams.get('tab') || 'billing';

  // Navigation tab state: 'billing' = billing desk, 'registry' = invoice search, 'dashboard' = dashboard analysis, 'due-recovery' = due recovery
  const [activeTab, setActiveTab] = useState(queryTab);

  useEffect(() => {
    setActiveTab(queryTab);
  }, [queryTab]);

  // ==========================================
  // DUE AMOUNT RECOVERY STATE & HANDLERS
  // ==========================================
  const [duesList, setDuesList] = useState([]);
  const [loadingDues, setLoadingDues] = useState(false);
  const [duesSearch, setDuesSearch] = useState('');
  const [duesStatusFilter, setDuesStatusFilter] = useState('');
  const [dueMetrics, setDueMetrics] = useState({ totalOutstanding: 0, patientCount: 0 });

  // Due Recovery Modal State
  const [selectedBillForRecovery, setSelectedBillForRecovery] = useState(null);
  const [recoveryPaymentAmount, setRecoveryPaymentAmount] = useState('');
  const [recoveryPaymentMode, setRecoveryPaymentMode] = useState('Cash');
  const [recoveryTransactionRef, setRecoveryTransactionRef] = useState('');
  const [recoveryRemarks, setRecoveryRemarks] = useState('');
  const [recordingRecoveryPayment, setRecordingRecoveryPayment] = useState(false);

  // Due modification permission & tab state
  const [dueModificationEnabled, setDueModificationEnabled] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState('pay'); // 'pay' | 'add-item' | 'remove-item'

  // Add Due Item Form State
  const [newDueCategory, setNewDueCategory] = useState('Other');
  const [newDueName, setNewDueName] = useState('');
  const [newDuePrice, setNewDuePrice] = useState('');
  const [newDueDiscount, setNewDueDiscount] = useState('0');
  const [newDueGst, setNewDueGst] = useState('0');
  const [newDueQty, setNewDueQty] = useState('1');
  const [newDueRemarks, setNewDueRemarks] = useState('');
  const [addingDueItem, setAddingDueItem] = useState(false);

  // Remove / Waive Due State
  const [selectedItemToRemoveIndex, setSelectedItemToRemoveIndex] = useState('');
  const [waiverAmountInput, setWaiverAmountInput] = useState('');
  const [removeDueRemarks, setRemoveDueRemarks] = useState('');
  const [removingDueItem, setRemovingDueItem] = useState(false);

  const loadDuesList = async () => {
    setLoadingDues(true);
    try {
      const q = new URLSearchParams();
      if (duesSearch) q.set('search', duesSearch);
      if (duesStatusFilter) q.set('status', duesStatusFilter);

      const { data } = await client.get(`/billing/dues?${q.toString()}`);
      setDuesList(data.bills || []);
      setDueMetrics({
        totalOutstanding: data.totalOutstanding || 0,
        patientCount: data.patientCount || 0
      });
    } catch (err) {
      toast.error('Failed to load pending due list');
    } finally {
      setLoadingDues(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'due-recovery') {
      loadDuesList();
    }
  }, [activeTab, duesSearch, duesStatusFilter]);

  const fetchHospitalSettingsForBilling = useCallback(async () => {
    try {
      const { data } = await client.get('/admin/hospital-settings');
      if (data?.exists && data?.data) {
        setDueModificationEnabled(Boolean(data.data.dueModificationEnabled));
      }
    } catch (err) {
      console.error('Error loading settings in BillingPage:', err);
    }
  }, []);

  useEffect(() => {
    fetchHospitalSettingsForBilling();
  }, [fetchHospitalSettingsForBilling, activeTab]);

  const handleOpenRecoveryModal = (bill) => {
    setSelectedBillForRecovery(bill);
    setRecoveryPaymentAmount(String(bill.dueAmount || ''));
    setRecoveryPaymentMode('Cash');
    setRecoveryTransactionRef('');
    setRecoveryRemarks('');
    setRecoveryTab('pay');
    setNewDueCategory('Other');
    setNewDueName('');
    setNewDuePrice('');
    setNewDueDiscount('0');
    setNewDueGst('0');
    setNewDueQty('1');
    setNewDueRemarks('');
    setSelectedItemToRemoveIndex('');
    setWaiverAmountInput('');
    setRemoveDueRemarks('');
  };

  const handleRecordRecoveryPayment = async (e) => {
    e.preventDefault();
    if (!selectedBillForRecovery || !recoveryPaymentAmount) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const payAmt = parseFloat(recoveryPaymentAmount);
    if (isNaN(payAmt) || payAmt <= 0) {
      toast.error('Please enter a positive payment amount');
      return;
    }

    if (payAmt > selectedBillForRecovery.dueAmount) {
      toast.error(`Entered amount (₹${payAmt}) exceeds due left (₹${selectedBillForRecovery.dueAmount})`);
      return;
    }

    setRecordingRecoveryPayment(true);
    try {
      const { data } = await client.post('/billing/dues/pay', {
        billId: selectedBillForRecovery._id,
        amountPaid: payAmt,
        paymentMode: recoveryPaymentMode,
        transactionRef: recoveryTransactionRef,
        remarks: recoveryRemarks
      });
      toast.success(data.message || 'Due payment recorded successfully!');
      setSelectedBillForRecovery(null);
      loadDuesList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record due payment');
    } finally {
      setRecordingRecoveryPayment(false);
    }
  };

  const handleAddDueItem = async (e) => {
    e.preventDefault();
    if (!selectedBillForRecovery || !newDueName.trim() || !newDuePrice) {
      toast.error('Please enter description/item name and valid price');
      return;
    }

    const priceVal = parseFloat(newDuePrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      toast.error('Please enter a valid positive price');
      return;
    }

    setAddingDueItem(true);
    try {
      const { data } = await client.post('/billing/dues/add-item', {
        billId: selectedBillForRecovery._id,
        category: newDueCategory,
        name: newDueName.trim(),
        price: priceVal,
        discountAmount: parseFloat(newDueDiscount) || 0,
        gstPercentage: parseFloat(newDueGst) || 0,
        quantity: parseInt(newDueQty) || 1,
        remarks: newDueRemarks
      });
      toast.success(data.message || 'Due item added to bill successfully!');
      setSelectedBillForRecovery(data.bill);
      loadDuesList();
      setNewDueName('');
      setNewDuePrice('');
      setNewDueDiscount('0');
      setNewDueGst('0');
      setNewDueQty('1');
      setNewDueRemarks('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add due item');
    } finally {
      setAddingDueItem(false);
    }
  };

  const handleRemoveDueItem = async (e) => {
    e.preventDefault();
    if (!selectedBillForRecovery) return;

    if (selectedItemToRemoveIndex === '' && (!waiverAmountInput || parseFloat(waiverAmountInput) <= 0)) {
      toast.error('Select an item to remove or enter a valid waiver amount');
      return;
    }

    setRemovingDueItem(true);
    try {
      const { data } = await client.post('/billing/dues/remove-item', {
        billId: selectedBillForRecovery._id,
        itemIndex: selectedItemToRemoveIndex !== '' ? parseInt(selectedItemToRemoveIndex) : undefined,
        removeAmount: waiverAmountInput ? parseFloat(waiverAmountInput) : undefined,
        remarks: removeDueRemarks
      });
      toast.success(data.message || 'Due amount updated successfully!');
      setSelectedBillForRecovery(data.bill);
      loadDuesList();
      setSelectedItemToRemoveIndex('');
      setWaiverAmountInput('');
      setRemoveDueRemarks('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update due amount');
    } finally {
      setRemovingDueItem(false);
    }
  };

  const [view, setView] = useState('list'); // 'list' = search patient, 'bill' = invoice generation

  // Patient search state
  const [searchQuery, setSearchQuery] = useState('');
  const [eligiblePatients, setEligiblePatients] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Selected patient details
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItemIndexes, setSelectedItemIndexes] = useState([]);
  const [billType, setBillType] = useState(isSameDayCare ? 'SameDayTreatment' : 'All');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Invoice parameters
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [discountEnabled, setDiscountEnabled] = useState(true);
  const [discountReasonsList, setDiscountReasonsList] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [sdtPricingInBilling, setSdtPricingInBilling] = useState(true);
  const [accessDiscount, setAccessDiscount] = useState(false);
  const [directDiscountPercent, setDirectDiscountPercent] = useState(0);

  // Discount Configuration & Auto Calculations
  const [applyDiscount, setApplyDiscount] = useState(true);
  const [requestAdminDiscount, setRequestAdminDiscount] = useState(false);

  // Custom Charge / Category Item State & Modal
  const [showCustomChargeModal, setShowCustomChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [categorySelectOption, setCategorySelectOption] = useState('Procedure');
  const [customCategory, setCustomCategory] = useState('Procedure');
  const [customItemName, setCustomItemName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDiscount, setCustomDiscount] = useState('0');
  const [customGst, setCustomGst] = useState('0');
  const [customQty, setCustomQty] = useState('1');

  // Edit Line Item Modal State
  const [activePatientMenuId, setActivePatientMenuId] = useState(null);
  const [activeRowMenuIdx, setActiveRowMenuIdx] = useState(null);
  const [showEditLineItemModal, setShowEditLineItemModal] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemDiscount, setEditItemDiscount] = useState('0');
  const [editItemGst, setEditItemGst] = useState('0');
  const [editItemQty, setEditItemQty] = useState('1');

  // Payments and advances
  const [patientAdvances, setPatientAdvances] = useState([]);
  const [allPatientAdvances, setAllPatientAdvances] = useState([]);
  const [totalAdvanceAvailable, setTotalAdvanceAvailable] = useState(0);
  const [advanceToAdjust, setAdvanceToAdjust] = useState(0);
  const [paymentMode, setPaymentMode] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [customPaidAmount, setCustomPaidAmount] = useState('');
  
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
    totalIpd: 0,
    activeIpd: 0,
    totalOpd: 0,
    todayOpd: 0,
    totalDischarges: 0,
    billingPendingCount: 0,
    billsCompletedToday: 0,
    paymentReceivedToday: 0,
    outstandingToday: 0,
    paymentReceivedMonth: 0,
    paymentPendingMonth: 0,
    todayCollection: 0,
    monthlyCollection: 0,
    outstandingPayments: 0,
    discountSummary: 0,
    billCounts: { paid: 0, unpaid: 0, partiallyPaid: 0, cancelled: 0 }
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [dashStartDate, setDashStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dashEndDate, setDashEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dashFilterPreset, setDashFilterPreset] = useState('today');

  // Desk Pagination state
  const [deskPage, setDeskPage] = useState(1);
  const [deskPageSize, setDeskPageSize] = useState(20);
  const [deskTotalRecords, setDeskTotalRecords] = useState(0);
  const [deskTotalPages, setDeskTotalPages] = useState(1);

  // Registry / Search Invoices Pagination state
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [registryFilterQuery, setRegistryFilterQuery] = useState('');
  const [registryFilterStatus, setRegistryFilterStatus] = useState('');
  const [registryFilterMode, setRegistryFilterMode] = useState('');
  const [registryFromDate, setRegistryFromDate] = useState('');
  const [registryToDate, setRegistryToDate] = useState('');
  const [registryPage, setRegistryPage] = useState(1);
  const [registryPageSize, setRegistryPageSize] = useState(20);
  const [registryTotalRecords, setRegistryTotalRecords] = useState(0);
  const [registryTotalPages, setRegistryTotalPages] = useState(1);

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

  // Fetch dashboard stats with date-wise parameters
  const loadDashboardStats = async (start = dashStartDate, end = dashEndDate) => {
    setLoadingStats(true);
    try {
      const { data } = await client.get('/billing/dashboard-stats', {
        params: { startDate: start, endDate: end }
      });
      if (data) setStats(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard summaries');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleApplyDashPreset = (preset) => {
    setDashFilterPreset(preset);
    const today = new Date();
    let s = new Date();
    let e = new Date();

    if (preset === 'today') {
      s = today;
      e = today;
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      s = y;
      e = y;
    } else if (preset === 'thisMonth') {
      s = new Date(today.getFullYear(), today.getMonth(), 1);
      e = today;
    }

    const startStr = s.toISOString().split('T')[0];
    const endStr = e.toISOString().split('T')[0];
    setDashStartDate(startStr);
    setDashEndDate(endStr);
    loadDashboardStats(startStr, endStr);
  };

  // Fetch Invoices Registry
  const loadInvoicesRegistry = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const params = {
        page: registryPage,
        limit: registryPageSize
      };
      if (registryFilterQuery) params.searchQuery = registryFilterQuery;
      if (registryFilterStatus) params.status = registryFilterStatus;
      if (registryFilterMode) params.paymentMode = registryFilterMode;
      if (registryFromDate) params.fromDate = registryFromDate;
      if (registryToDate) params.toDate = registryToDate;

      const { data } = await client.get('/billing', { params });
      if (Array.isArray(data)) {
        setInvoices(data);
        setRegistryTotalRecords(data.length);
        setRegistryTotalPages(1);
      } else {
        setInvoices(data.bills || []);
        setRegistryTotalRecords(data.totalRecords || 0);
        setRegistryTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve invoices');
      setInvoices([]);
      setRegistryTotalRecords(0);
      setRegistryTotalPages(1);
    } finally {
      setLoadingInvoices(false);
    }
  }, [registryPage, registryPageSize, registryFilterQuery, registryFilterStatus, registryFilterMode, registryFromDate, registryToDate]);

  // Reset registry page on filter changes
  useEffect(() => {
    setRegistryPage(1);
  }, [registryFilterQuery, registryFilterStatus, registryFilterMode, registryFromDate, registryToDate]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats();
    } else if (activeTab === 'registry') {
      loadInvoicesRegistry();
    }
  }, [activeTab, loadInvoicesRegistry]);

  // Reset desk page on search query change
  useEffect(() => {
    setDeskPage(1);
  }, [searchQuery]);

  // Load eligible patients (debounced)
  const loadEligiblePatients = useCallback(async (search = '') => {
    setLoadingList(true);
    try {
      const params = {
        page: deskPage,
        limit: deskPageSize
      };
      if (search) params.search = search;
      if (isSameDayCare) {
        params.module = 'SameDayCare';
      }
      const { data } = await client.get('/billing/eligible-patients', { params });
      let rawList = [];
      let totRec = 0;
      let totPag = 1;

      if (Array.isArray(data)) {
        rawList = data;
        totRec = data.length;
        totPag = 1;
      } else {
        rawList = data.patients || [];
        totRec = data.totalRecords || 0;
        totPag = data.totalPages || 1;
      }

      const filtered = isSameDayCare
        ? rawList.filter(p => p.categories && p.categories.includes('SameDayTreatment'))
        : rawList.filter(p => {
            if (!p.categories || p.categories.length === 0) return false;
            const isPureSameDay = p.categories.length === 1 && p.categories[0] === 'SameDayTreatment';
            return !isPureSameDay;
          });

      setEligiblePatients(filtered);
      setDeskTotalRecords(totRec);
      setDeskTotalPages(totPag);
    } catch (err) {
      toast.error('Failed to load patients');
      console.error(err);
      setEligiblePatients([]);
      setDeskTotalRecords(0);
      setDeskTotalPages(1);
    } finally {
      setLoadingList(false);
    }
  }, [isSameDayCare, deskPage, deskPageSize]);

  useEffect(() => {
    if (view !== 'list') return;
    const timer = setTimeout(() => {
      loadEligiblePatients(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, view, loadEligiblePatients]);



  // Handle Create Bill - fetch all billable items for patient
  const mapLoadedItems = (rawItems) => {
    return (rawItems || []).map(i => {
      const mrpIncGst = i.mrpIncGst || i.price || 0;
      const totalGstPct = i.gstPercentage || ((i.cgst || 0) + (i.sgst || 0)) || 0;
      let mrpExGst = i.mrpExGst || 0;
      if (!mrpExGst && mrpIncGst > 0) {
        mrpExGst = totalGstPct > 0 ? Number((mrpIncGst / (1 + totalGstPct / 100)).toFixed(2)) : mrpIncGst;
      }
      if (!mrpExGst) mrpExGst = mrpIncGst;

      const addGst = true; // Inc GST by default (MRP)
      const activePrice = addGst ? mrpIncGst : mrpExGst;
      const gstPct = addGst ? totalGstPct : 0;
      const gstAmt = addGst ? ((mrpIncGst - mrpExGst) * i.quantity) : 0;
      const totalAmt = addGst
        ? ((mrpIncGst - (i.discountAmount || 0)) * i.quantity)
        : ((mrpExGst - (i.discountAmount || 0)) * i.quantity);

      return {
        ...i,
        addGst,
        mrpIncGst,
        mrpExGst,
        price: activePrice,
        defaultGstPercentage: totalGstPct,
        discountAmount: i.discountAmount || 0,
        gstPercentage: gstPct,
        gstAmount: Number(gstAmt.toFixed(2)),
        total: Number(totalAmt.toFixed(2))
      };
    });
  };

  const handleToggleItemGst = (idx, isChecked) => {
    setItems(prev => prev.map((itemVal, valIdx) => {
      if (valIdx === idx) {
        const mrpIncGst = itemVal.mrpIncGst || itemVal.price || 0;
        const totalGstPct = itemVal.defaultGstPercentage || (itemVal.cgst || 0) + (itemVal.sgst || 0) || 0;
        let mrpExGst = itemVal.mrpExGst || 0;
        if (!mrpExGst && mrpIncGst > 0) {
          mrpExGst = totalGstPct > 0 ? Number((mrpIncGst / (1 + totalGstPct / 100)).toFixed(2)) : mrpIncGst;
        }
        if (!mrpExGst) mrpExGst = mrpIncGst;

        const activePrice = isChecked ? mrpIncGst : mrpExGst;
        const newGstPct = isChecked ? totalGstPct : 0;
        const gstAmt = isChecked ? ((mrpIncGst - mrpExGst) * itemVal.quantity) : 0;
        const totalAmt = isChecked
          ? ((mrpIncGst - (itemVal.discountAmount || 0)) * itemVal.quantity)
          : ((mrpExGst - (itemVal.discountAmount || 0)) * itemVal.quantity);

        return {
          ...itemVal,
          addGst: isChecked,
          price: activePrice,
          gstPercentage: newGstPct,
          gstAmount: Number(gstAmt.toFixed(2)),
          total: Number(totalAmt.toFixed(2))
        };
      }
      return itemVal;
    }));
  };

  const handleSelectPatientForBilling = async (patient) => {
    setLoading(true);
    setView('bill');
    setSelectedPatient(null);
    setItems([]);
    setSelectedItemIndexes([]);
    setAdvanceToAdjust(0);
    setPaymentMode('');
    setTransactionRef('');
    setCashSplit(0);
    setUpiSplit(0);
    setCardSplit(0);
    setBillType(isSameDayCare ? 'SameDayTreatment' : 'All');
    setRequestAdminDiscount(false);
    setCustomCategory('');
    setCustomItemName('');
    setCustomPrice('');
    setCustomDiscount('0');
    setCustomGst('0');
    setCustomQty('1');

    const effectiveBillType = isSameDayCare ? 'SameDayTreatment' : 'All';
    try {
      const { data } = await client.get(`/billing/generate/${patient.uhid}?billType=${effectiveBillType}`);
      setSelectedPatient(data.patient);
      const mappedItems = mapLoadedItems(data.items);
      setItems(mappedItems);
      
      // Auto-check unpaid items by default (exclude items paid at reception)
      const initialSelectedIndices = mappedItems
        .map((item, i) => (item.paidAtReception || (item.category === 'OPD' && item.paymentStatus === 'Paid') ? null : i))
        .filter(i => i !== null);
      setSelectedItemIndexes(initialSelectedIndices);

      // Pull active unadjusted advances
      setPatientAdvances(data.activeAdvances || []);
      setTotalAdvanceAvailable(data.totalAdvance || 0);

      // Pull hospital configurations
      if (data.settings) {
        setDiscountEnabled(data.settings.discountEnabled);
        setDiscountReasonsList(data.settings.discountReasons || []);
        setApplyDiscount(true);
        setSdtPricingInBilling(data.settings.sdtPricingInBilling !== false);
        setAccessDiscount(data.settings.accessDiscount || false);
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

  const handleCreateBill = handleSelectPatientForBilling;

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
      const mappedItems = mapLoadedItems(data.items);
      setItems(mappedItems);
      const initialSelectedIndices = mappedItems
        .map((item, i) => (item.paidAtReception || (item.category === 'OPD' && item.paymentStatus === 'Paid') ? null : i))
        .filter(i => i !== null);
      setSelectedItemIndexes(initialSelectedIndices);
    } catch (err) {
      toast.error('Failed to reload items');
    } finally {
      setLoading(false);
    }
  };

  // Checkbox multi-select helpers
  const handleToggleItemCheckbox = (index) => {
    const targetItem = items[index];
    if (targetItem && (targetItem.paidAtReception || (targetItem.category === 'OPD' && targetItem.paymentStatus === 'Paid'))) {
      return; // Paid items cannot be selected for re-billing
    }
    setSelectedItemIndexes(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSelectAllCheckbox = () => {
    const selectableIndices = items
      .map((item, i) => (item.paidAtReception || (item.category === 'OPD' && item.paymentStatus === 'Paid') ? null : i))
      .filter(i => i !== null);
    if (selectableIndices.length > 0 && selectedItemIndexes.length === selectableIndices.length) {
      setSelectedItemIndexes([]);
    } else {
      setSelectedItemIndexes(selectableIndices);
    }
  };

  // Add Custom Charge Item to Invoice
  const handleAddCustomChargeItem = (e) => {
    if (e) e.preventDefault();
    if (!customItemName.trim()) {
      toast.error('Please enter description or item name');
      return;
    }
    const priceVal = parseFloat(customPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      toast.error('Please enter a valid price amount');
      return;
    }

    const effectiveCat = (categorySelectOption === 'Other / Custom' ? customCategory : categorySelectOption).trim() || 'Other';
    const discVal = Math.min(priceVal, parseFloat(customDiscount) || 0);
    const gstPct = Math.min(100, Math.max(0, parseFloat(customGst) || 0));
    const qtyVal = Math.max(1, parseInt(customQty) || 1);

    const baseAmt = (priceVal - discVal) * qtyVal;
    const gstAmt = baseAmt * (gstPct / 100);
    const totalAmt = baseAmt + gstAmt;

    const newItemObj = {
      category: effectiveCat,
      name: customItemName.trim(),
      description: customItemName.trim(),
      price: priceVal,
      discountAmount: discVal,
      gstPercentage: gstPct,
      gstAmount: Number(gstAmt.toFixed(2)),
      quantity: qtyVal,
      total: Number(totalAmt.toFixed(2)),
      isCustom: true
    };

    setItems(prev => {
      const updated = [...prev, newItemObj];
      const newIdx = updated.length - 1;
      setSelectedItemIndexes(sPrev => [...sPrev, newIdx]);
      return updated;
    });

    setCategorySelectOption('Procedure');
    setCustomCategory('Procedure');
    setCustomItemName('');
    setCustomPrice('');
    setCustomDiscount('0');
    setCustomGst('0');
    setCustomQty('1');
    setShowCustomChargeModal(false);
    toast.success(`Custom charge item "${newItemObj.name}" added to invoice!`);
  };

  const handleRemoveCustomItem = (idxToRemove) => {
    setItems(prev => prev.filter((_, i) => i !== idxToRemove));
    setSelectedItemIndexes(prev => prev.filter(i => i !== idxToRemove).map(i => (i > idxToRemove ? i - 1 : i)));
    toast.success('Custom charge item removed');
  };

  const handleOpenEditLineItemModal = (idx, item) => {
    if (!dueModificationEnabled) {
      toast.error("Line item modifications are disabled in Hospital Settings. Turn ON 'Due Amount & Line Item Modification Permission' in Hospital Settings to enable.");
      return;
    }
    setEditingItemIdx(idx);
    setEditItemDesc(item.description || item.name || '');
    setEditItemPrice(String(item.price || 0));
    setEditItemDiscount(String(item.discountAmount || 0));
    setEditItemGst(String(item.gstPercentage || 0));
    setEditItemQty(String(item.quantity || 1));
    setShowEditLineItemModal(true);
  };

  const handleSaveEditedLineItem = (e) => {
    if (e) e.preventDefault();
    if (editingItemIdx === null || editingItemIdx < 0) return;
    if (!editItemDesc.trim()) {
      toast.error('Description or item name cannot be empty');
      return;
    }
    const newPrice = Math.max(0, parseFloat(editItemPrice) || 0);
    const newDisc = Math.min(newPrice, Math.max(0, parseFloat(editItemDiscount) || 0));
    const newGstPct = Math.min(100, Math.max(0, parseFloat(editItemGst) || 0));
    const newQty = Math.max(1, parseInt(editItemQty) || 1);

    const baseAmt = (newPrice - newDisc) * newQty;
    const gstAmt = baseAmt * (newGstPct / 100);
    const totalAmt = baseAmt + gstAmt;

    setItems(prev => prev.map((itemVal, valIdx) => {
      if (valIdx === editingItemIdx) {
        return {
          ...itemVal,
          description: editItemDesc.trim(),
          name: editItemDesc.trim(),
          price: newPrice,
          mrpIncGst: newPrice,
          discountAmount: newDisc,
          gstPercentage: newGstPct,
          addGst: newGstPct > 0,
          quantity: newQty,
          gstAmount: Number(gstAmt.toFixed(2)),
          total: Number(totalAmt.toFixed(2))
        };
      }
      return itemVal;
    }));

    setShowEditLineItemModal(false);
    setEditingItemIdx(null);
    toast.success('Line item updated successfully!');
  };

  // Totals calculations based ONLY on selected checkboxes
  const selectedItems = items.filter((_, idx) => selectedItemIndexes.includes(idx));
  const baseSubtotal = selectedItems.reduce((sum, i) => sum + ((i.price - (i.discountAmount || 0)) * i.quantity), 0);
  const rowGstAmountTotal = selectedItems.reduce((sum, i) => sum + (((i.price - (i.discountAmount || 0)) * i.quantity) * ((i.gstPercentage || 0) / 100)), 0);
  const itemDiscountTotal = selectedItems.reduce((sum, i) => sum + ((i.discountAmount || 0) * i.quantity), 0);

  // Automated/Dynamic Discount Calculation (computed during render to avoid useEffect state cycles and TDZ)
  let discountPercentage = accessDiscount ? parseFloat(directDiscountPercent || 0) : 0;
  let discountReason = requestAdminDiscount ? 'Admin Discount Requested' : (accessDiscount && directDiscountPercent > 0 ? 'Direct Percentage Discount' : '');

  const percentDiscountAmount = baseSubtotal * (discountPercentage / 100);
  const discountedSubtotal = Math.max(0, baseSubtotal - percentDiscountAmount);

  const invoiceGstAmount = gstEnabled ? discountedSubtotal * (gstPercentage / 100) : 0;
  const gstAmount = rowGstAmountTotal + invoiceGstAmount;
  const discountAmount = itemDiscountTotal + percentDiscountAmount;
  const grandTotal = discountedSubtotal + gstAmount;
  const subtotal = baseSubtotal;

  // Net payable amount after adjusting patient advance
  const maxAllowedAdjustment = Math.min(totalAdvanceAvailable, grandTotal);
  const netPayable = Math.max(0, grandTotal - parseFloat(advanceToAdjust || 0));

  // Partial Payment Calculations
  const effectiveAmountPaid = customPaidAmount !== '' ? Math.max(0, Math.min(netPayable, parseFloat(customPaidAmount || 0))) : netPayable;
  const effectiveDueAmount = Number(Math.max(0, netPayable - effectiveAmountPaid).toFixed(2));
  const effectivePaymentStatus = effectiveDueAmount <= 0 ? 'Paid' : (effectiveAmountPaid > 0 ? 'Partially Paid' : 'Unpaid');

  // Validation before finalizing
  const handleSaveBill = async (finalize = false) => {
    if (!selectedPatient) { toast.error('No patient selected'); return; }
    if (selectedItems.length === 0) { toast.error('Please select at least one charge item to bill'); return; }
    
    if (finalize) {
      if (selectedPatient?.dischargeBlocked) {
        toast.error(selectedPatient.dischargeBlockReason || 'Cannot finalize bill: Patient is currently admitted in IPD / Same Day Care and has not been discharged yet.');
        return;
      }
      if (!paymentMode) {
        toast.error('Please select a payment mode before finalizing the invoice');
        return;
      }

      if (paymentMode === 'Mixed Payment') {
        const totalSplit = parseFloat(cashSplit || 0) + parseFloat(upiSplit || 0) + parseFloat(cardSplit || 0);
        if (Math.abs(totalSplit - effectiveAmountPaid) > 0.01) {
          toast.error(`Split payments total (₹${totalSplit.toFixed(2)}) must equal Amount Received Now (₹${effectiveAmountPaid.toFixed(2)})`);
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
        amountPaid: finalize ? effectiveAmountPaid : 0,
        dueAmount: finalize ? effectiveDueAmount : grandTotal,
        paymentStatus: finalize ? effectivePaymentStatus : 'Unpaid'
      };

      const { data } = await client.post('/billing', payload);
      toast.success(finalize ? `Tax Invoice generated (${effectivePaymentStatus})` : 'Draft invoice saved');
      
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
      if (selectedPatient && (selectedPatient._id === selectedAdvancePatient._id || selectedPatient.uhid === selectedAdvancePatient.uhid)) {
        loadPatientUnbilledItems(selectedPatient);
      }
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

  useHeader({ onRefresh: loadEligiblePatients });

  return (
    <div className="space-y-6">


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
                <div className="card p-4">
                  <SkeletonTable rows={4} columns={4} className="w-full" />
                </div>
              ) : eligiblePatients.length === 0 ? (
                <div className="card p-16 text-center space-y-4">
                  <Coins className="h-16 w-16 mx-auto text-orange-200" />
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-lg">No Pending Patients Found</h3>
                    <p className="text-sm text-gray-400 max-w-md mx-auto mt-1">
                      Search above for any patient. Patients will list here automatically when they have billable services (OPD, IPD Bed Assignment, OT records, Lab test charges, or Pharmacy bills).
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
                            <td className="p-4 space-y-1">
                              <span className="font-mono font-bold text-orange-700 text-xs block">{formatUhid(p.uhid)}</span>
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                {p.ipdNumber && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-extrabold bg-purple-50 text-purple-700 rounded border border-purple-200/60" title="IPD Admission Number">
                                    IPD: {p.ipdNumber}
                                  </span>
                                )}
                                {p.pidNumber && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-extrabold bg-blue-50 text-blue-700 rounded border border-blue-200/60" title="Patient Registration ID">
                                    PID: {p.pidNumber}
                                  </span>
                                )}
                                {p.otNumber && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-extrabold bg-emerald-50 text-emerald-700 rounded border border-emerald-200/60" title="Operation Theatre ID">
                                    OT: {p.otNumber}
                                  </span>
                                )}
                              </div>
                            </td>
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
                            <td className="p-4 pr-6 text-center relative action-menu-container" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePatientMenuId(activePatientMenuId === p._id ? null : p._id);
                                  }}
                                  className="p-1.5 hover:bg-orange-100/70 text-gray-700 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-2xs inline-flex items-center justify-center cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {activePatientMenuId === p._id && (
                                  <div className="absolute right-0 top-9 z-50 w-44 bg-white rounded-xl shadow-xl border border-orange-100 py-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePatientMenuId(null);
                                        handleCreateBill(p);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <FileText className="h-4 w-4 text-orange-600" /> Billing
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePatientMenuId(null);
                                        handleOpenAdvanceDrawer(p);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-bold text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <Coins className="h-4 w-4 text-emerald-600" /> Record Advance
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePatientMenuId(null);
                                        handlePrintLedgerDirectly(p);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                    >
                                      <Printer className="h-4 w-4 text-blue-600" /> Print Ledger
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationFooter
                    currentPage={deskPage}
                    pageSize={deskPageSize}
                    totalRecords={deskTotalRecords}
                    totalPages={deskTotalPages}
                    onPageChange={(p) => setDeskPage(p)}
                    onPageSizeChange={(s) => {
                      setDeskPageSize(s);
                      setDeskPage(1);
                    }}
                    loading={loadingList}
                    itemLabel="patients"
                  />
                </div>
              )}
            </div>
          ) : (
            // ===================== GENERATE BILL SCREEN =====================
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer"
                  title="Close Invoice Builder"
                >
                  <X className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Invoice Builder</h2>
                  <p className="text-xs text-gray-500">Configure parameters, select unbilled items, and apply ledger advance</p>
                </div>
              </div>

              {/* Patient Card & IPD Bed Assignment info Banner */}
              {selectedPatient && (
                <div className="bg-white p-5 rounded-2xl border border-orange-200/70 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center">
                    {/* Patient Demographics with Avatar */}
                    <div className="md:border-r md:border-orange-100 md:pr-6 flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-orange-100/70 border border-orange-200/60 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">PATIENT DEMOGRAPHICS</span>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedPatient.patientName}</h3>
                        <div className="text-xs text-gray-600 font-semibold flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="font-mono font-black text-orange-600">{formatUhid(selectedPatient.uhid)}</span>
                          <span>• {selectedPatient.gender}</span>
                          <span>• {selectedPatient.patientAge ? `${selectedPatient.patientAge} Yrs` : ''}</span>
                          <span>• {selectedPatient.mobile}</span>
                        </div>
                        {selectedPatient.address && (
                          <p className="text-[11px] text-gray-500 flex items-center gap-1 pt-0.5">
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" /> Address: {selectedPatient.address}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Billing Context */}
                    <div className="md:border-r md:border-orange-100 md:pr-6 space-y-2">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">BILLING CONTEXT</span>
                      <div className="text-xs space-y-2">
                        <div className="flex items-start gap-2 text-gray-700">
                          <UserCheck className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-400 block text-[11px]">Attending Doctor:</span>
                            <span className="font-extrabold text-gray-900">{selectedPatient.doctorName || '-'}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-400 block text-[11px]">Reg. Date:</span>
                            <span className="font-extrabold text-gray-900">{selectedPatient.registrationDate || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* IPD Bed Assignment Details */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">IPD BED ASSIGNMENT DETAILS</span>
                      <div className="flex items-start gap-2.5 text-xs text-gray-600">
                        <BedDouble className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                        {selectedPatient.admissionDetails ? (
                          <div className="space-y-0.5 font-bold">
                            <p className="text-orange-700">IPD ID: {selectedPatient.admissionDetails.ipdNumber}</p>
                            <p className="text-gray-800">Bed: {selectedPatient.admissionDetails.bedNumber} ({selectedPatient.admissionDetails.roomType})</p>
                            <p className="text-gray-500 font-normal text-[11px]">Admitted: {new Date(selectedPatient.admissionDetails.admissionDate).toLocaleDateString('en-IN')}</p>
                          </div>
                        ) : (
                          <div className="pt-0.5">
                            <p className="text-gray-500 font-medium">No active admission</p>
                            <p className="text-gray-500 font-medium">(OPD patient)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3 Action Buttons */}
                  <div className="shrink-0 xl:pl-6 xl:border-l xl:border-orange-100 flex flex-col gap-2.5 w-full xl:w-56">
                    <button
                      type="button"
                      onClick={() => setShowCustomChargeModal(true)}
                      className="w-full bg-orange-50/80 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200/80 hover:border-orange-500 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                      title="Add extra item or category to invoice"
                    >
                      <Plus className="h-4 w-4" /> Add Extra Category Item
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-orange-50/80 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200/80 hover:border-orange-500 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                      title="Open Final Payment Collection & Ledger popup"
                    >
                      <FileText className="h-4 w-4" /> Generate Invoice
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleOpenAdvanceDrawer(selectedPatient)}
                      className="w-full bg-orange-50/80 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200/80 hover:border-orange-500 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                      title="Record advance payment for this patient"
                    >
                      <CreditCard className="h-4 w-4" /> + Add Advance Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Active IPD / Same Day Care Non-Discharged Alert Banner */}
              {selectedPatient?.dischargeBlocked && (
                <div className="p-4 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border-2 border-red-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0">
                      <Ban className="h-6 w-6 text-red-600 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-red-700 tracking-wider">Final Bill Locked</span>
                        <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px]">
                          Patient Not Discharged
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-gray-900 mt-0.5">
                        {selectedPatient.dischargeBlockReason}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        You can prepare draft charges, but invoice finalization is locked until the patient is officially discharged.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="card p-4">
                  <SkeletonTable rows={5} columns={7} className="w-full" />
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
                        {billType === 'Pharmacy' && items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const anyUnchecked = items.some(i => i.addGst === false);
                              items.forEach((_, idx) => handleToggleItemGst(idx, anyUnchecked));
                            }}
                            className="text-[11px] font-bold text-orange-700 bg-white hover:bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {items.some(i => i.addGst === false) ? 'Set All to Inc GST' : 'Set All to Ex GST'}
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 font-bold border-b border-orange-100">
                              <th className="p-3 pl-4 text-center w-10">
                                <input
                                  type="checkbox"
                                  className="rounded border-orange-200 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                  checked={items.length > 0 && selectedItemIndexes.length > 0 && selectedItemIndexes.length === items.filter(i => !i.paidAtReception && !(i.category === 'OPD' && i.paymentStatus === 'Paid')).length}
                                  onChange={handleSelectAllCheckbox}
                                />
                              </th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Description</th>
                              <th className="p-3 text-right">Price</th>
                              {accessDiscount && <th className="p-3 text-right w-24">Discount (₹)</th>}
                              <th className="p-3 text-right w-36">{billType === 'Pharmacy' ? 'Add GST (CGST+SGST)' : 'GST (%)'}</th>
                              <th className="p-3 text-right">Qty</th>
                              <th className="p-3 text-right">Total</th>
                              <th className="p-3 text-center w-14 pr-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-orange-50/60">
                            {items.length === 0 ? (
                              <tr>
                                <td colSpan={accessDiscount ? 9 : 8} className="p-12 text-center text-gray-400 font-bold">
                                  No pending unbilled charges in this module.
                                </td>
                              </tr>
                            ) : (
                              items.map((item, idx) => {
                                const isChecked = selectedItemIndexes.includes(idx);
                                const isPaidAtReception = item.paidAtReception || (item.category === 'OPD' && item.paymentStatus === 'Paid');
                                return (
                                  <tr
                                    key={idx}
                                    className={`hover:bg-orange-50/10 ${isPaidAtReception ? 'bg-emerald-50/30' : (isChecked ? 'bg-orange-50/20' : '')}`}
                                    onClick={() => !isPaidAtReception && handleToggleItemCheckbox(idx)}
                                  >
                                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        className="rounded border-orange-200 text-orange-600 focus:ring-orange-500 disabled:opacity-30 cursor-pointer"
                                        checked={isChecked}
                                        disabled={isPaidAtReception}
                                        onChange={() => !isPaidAtReception && handleToggleItemCheckbox(idx)}
                                      />
                                    </td>
                                    <td className="p-3 font-mono">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-800'}`}>
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="p-3 font-bold text-gray-800 max-w-[320px]">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span>{item.description}</span>
                                        {item.category === 'OPD' && (
                                          isPaidAtReception ? (
                                            <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                              Paid at Reception ({item.paymentMode || 'Cash'})
                                            </span>
                                          ) : (
                                            <span className="text-[9px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                                              Unpaid (Pending)
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                      {isPaidAtReception ? (
                                        <span className="font-semibold text-gray-600">₹{(item.price || 0).toFixed(2)}</span>
                                      ) : (
                                        <div className="relative inline-block w-24">
                                          <span className="absolute left-1.5 top-1.5 text-gray-400 font-bold text-[10px] pointer-events-none">₹</span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="input text-xs py-0.5 pl-4 pr-1 font-mono font-bold w-full text-right bg-white border border-orange-200 rounded-lg focus:ring-1 focus:ring-orange-500 shadow-2xs"
                                            value={item.price !== undefined && item.price !== null ? item.price : ''}
                                            placeholder="0.00"
                                            title="Edit price for this item"
                                            onChange={(e) => {
                                              const newPrice = Math.max(0, parseFloat(e.target.value) || 0);
                                              setItems(prev => prev.map((itemVal, valIdx) => {
                                                if (valIdx === idx) {
                                                  const discountVal = Math.min(newPrice, itemVal.discountAmount || 0);
                                                  const qty = itemVal.quantity || 1;
                                                  const baseAmt = (newPrice - discountVal) * qty;
                                                  const gstPct = itemVal.gstPercentage || 0;
                                                  const gstAmt = itemVal.addGst !== false && gstPct > 0 ? baseAmt * (gstPct / 100) : 0;
                                                  return {
                                                    ...itemVal,
                                                    price: newPrice,
                                                    mrpIncGst: newPrice,
                                                    mrpExGst: newPrice,
                                                    discountAmount: discountVal,
                                                    gstAmount: Number(gstAmt.toFixed(2)),
                                                    total: Number((baseAmt + gstAmt).toFixed(2))
                                                  };
                                                }
                                                return itemVal;
                                              }));
                                            }}
                                          />
                                        </div>
                                      )}
                                    </td>
                                    {accessDiscount && (
                                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="relative inline-block w-20">
                                          <span className="absolute left-1.5 top-1.5 text-gray-400 font-bold text-[10px]">₹</span>
                                          <input
                                            type="number"
                                            min="0"
                                            max={item.price}
                                            className="input text-xs py-0.5 pl-4 pr-1 font-mono font-bold w-full text-right bg-white border border-orange-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                                            value={item.discountAmount || ''}
                                            onChange={(e) => {
                                              const discountVal = Math.min(item.price, parseFloat(e.target.value) || 0);
                                              setItems(prev => prev.map((itemVal, valIdx) => {
                                                if (valIdx === idx) {
                                                  const baseAmt = (itemVal.price - discountVal) * itemVal.quantity;
                                                  const gstAmt = baseAmt * ((itemVal.gstPercentage || 0) / 100);
                                                  return {
                                                    ...itemVal,
                                                    discountAmount: discountVal,
                                                    gstAmount: gstAmt,
                                                    total: baseAmt + gstAmt
                                                  };
                                                }
                                                return itemVal;
                                              }));
                                            }}
                                          />
                                        </div>
                                      </td>
                                    )}
                                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                      {billType === 'Pharmacy' || item.category === 'Medicine' ? (
                                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none bg-orange-50/50 px-2 py-1 rounded-lg border border-orange-200">
                                          <input
                                            type="checkbox"
                                            className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 cursor-pointer"
                                            checked={item.addGst !== false}
                                            onChange={(e) => handleToggleItemGst(idx, e.target.checked)}
                                          />
                                          <span className="text-[11px] font-bold text-gray-800">
                                            {item.addGst !== false
                                              ? `Price (Inc GST)`
                                              : `Price (Ex GST)`}
                                          </span>
                                        </label>
                                      ) : (
                                        <div className="relative inline-block w-20">
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            placeholder="0"
                                            className="input text-xs py-0.5 pr-4 font-mono font-bold w-full text-right bg-white border border-orange-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                                            value={item.gstPercentage || ''}
                                            onChange={(e) => {
                                              const gstVal = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                                              setItems(prev => prev.map((itemVal, valIdx) => {
                                                if (valIdx === idx) {
                                                  const discAmt = itemVal.discountAmount || 0;
                                                  const baseAmt = (itemVal.price - discAmt) * itemVal.quantity;
                                                  const gstAmt = baseAmt * (gstVal / 100);
                                                  return {
                                                    ...itemVal,
                                                    addGst: gstVal > 0,
                                                    gstPercentage: gstVal,
                                                    gstAmount: Number(gstAmt.toFixed(2)),
                                                    total: Number((baseAmt + gstAmt).toFixed(2))
                                                  };
                                                }
                                                return itemVal;
                                              }));
                                            }}
                                          />
                                          <span className="absolute right-1.5 top-1.5 text-gray-400 font-bold text-[10px] pointer-events-none">%</span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-gray-600">
                                      {item.quantity}
                                    </td>
                                    <td className="p-3 text-right font-black text-gray-900">
                                      ₹{(item.total || 0).toFixed(2)}
                                    </td>
                                    <td className="p-3 text-center pr-4 relative action-menu-container" onClick={(e) => e.stopPropagation()}>
                                      {!isPaidAtReception && (
                                        <div className="relative inline-block">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveRowMenuIdx(activeRowMenuIdx === idx ? null : idx);
                                            }}
                                            className="p-1 hover:bg-orange-100/70 text-gray-700 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-2xs inline-flex items-center justify-center cursor-pointer"
                                            title="More Actions"
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </button>

                                          {activeRowMenuIdx === idx && (
                                            <div className={`absolute right-0 ${idx >= items.length - 2 && items.length > 2 ? 'bottom-full mb-1' : 'top-9'} z-50 w-32 bg-white rounded-xl shadow-xl border border-orange-100 py-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left`}>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActiveRowMenuIdx(null);
                                                  handleOpenEditLineItemModal(idx, item);
                                                }}
                                                className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                                              >
                                                <Pencil className="h-3.5 w-3.5 text-blue-600" /> Edit Item
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
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
                        {accessDiscount ? (
                          <div className="space-y-3 bg-orange-50/20 p-2.5 rounded-lg border border-orange-100/50">
                            <div className="flex items-center justify-between text-gray-500">
                              <span>Direct Discount applied:</span>
                              <span className="font-bold text-green-700">- ₹{discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-gray-700">Discount Percent (%):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  className="input text-xs py-1 px-1.5 font-mono font-bold w-20 text-green-700 bg-white border border-orange-200 rounded-lg text-right"
                                  placeholder="0"
                                  value={directDiscountPercent || ''}
                                  onChange={(e) => setDirectDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                />
                              </div>
                              <div className="text-[10px] space-y-1 text-gray-500 border-t border-orange-100/50 pt-1">
                                <div className="flex justify-between"><span>Item discounts:</span><span className="font-bold text-gray-700">₹{itemDiscountTotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Percent discount:</span><span className="font-bold text-gray-700">₹{percentDiscountAmount.toFixed(2)}</span></div>
                              </div>
                            </div>
                          </div>
                        ) : (
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
                        )}

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
            <div className="card p-4">
              <SkeletonTable rows={5} columns={8} className="w-full" />
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
              <PaginationFooter
                currentPage={registryPage}
                pageSize={registryPageSize}
                totalRecords={registryTotalRecords}
                totalPages={registryTotalPages}
                onPageChange={(p) => setRegistryPage(p)}
                onPageSizeChange={(s) => {
                  setRegistryPageSize(s);
                  setRegistryPage(1);
                }}
                loading={loadingInvoices}
                itemLabel="invoices"
              />
            </div>
          )}
        </div>
      )}

      {/* ===================== VIEW 3: DASHBOARD ===================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">


          {/* Date-Wise Selection Filter Bar */}
          <div className="bg-white p-3.5 px-4 rounded-2xl border border-orange-200/70 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-gray-700 mr-1">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-extrabold tracking-wide uppercase text-gray-600">Date Filter:</span>
              </div>
              <div className="flex items-center gap-1 bg-orange-50/60 p-1 rounded-xl border border-orange-100">
                <button
                  type="button"
                  onClick={() => handleApplyDashPreset('today')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    dashFilterPreset === 'today' ? 'bg-orange-500 text-white shadow-xs' : 'text-orange-950 hover:bg-orange-100/60'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDashPreset('yesterday')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    dashFilterPreset === 'yesterday' ? 'bg-orange-500 text-white shadow-xs' : 'text-orange-950 hover:bg-orange-100/60'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDashPreset('thisMonth')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    dashFilterPreset === 'thisMonth' ? 'bg-orange-500 text-white shadow-xs' : 'text-orange-950 hover:bg-orange-100/60'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                <span>From</span>
                <input
                  type="date"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 outline-none"
                  value={dashStartDate}
                  onChange={(e) => {
                    setDashStartDate(e.target.value);
                    setDashFilterPreset('custom');
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                <span>To</span>
                <input
                  type="date"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 outline-none"
                  value={dashEndDate}
                  onChange={(e) => {
                    setDashEndDate(e.target.value);
                    setDashFilterPreset('custom');
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => loadDashboardStats(dashStartDate, dashEndDate)}
                className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" /> Apply Filter
              </button>
            </div>
          </div>

          {loadingStats ? (
            <div className="bg-white p-6 rounded-2xl border border-orange-100">
              <SkeletonTable rows={4} columns={4} className="w-full" />
            </div>
          ) : (
            <>
              {/* SECTION 1: OPERATIONAL & PATIENT ACTIVITY OVERVIEW (5 Cards including Today Total OPD) */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-orange-600" /> Patient Activity &amp; Billing Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Today Total OPD (Date-Wise) */}
                  <div className="bg-white p-5 rounded-2xl border-l-4 border-l-blue-600 border border-blue-200 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">Today Total OPD</span>
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-blue-950 mt-2">{stats.todayOpd || 0}</h3>
                    <p className="text-xs font-bold text-blue-700 mt-1">
                      OPD Visits ({dashStartDate === dashEndDate ? dashStartDate : `${dashStartDate} to ${dashEndDate}`})
                    </p>
                  </div>

                  {/* Total IPD */}
                  <div className="bg-white p-5 rounded-2xl border-l-4 border-l-purple-600 border border-purple-100 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">Total IPD</span>
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                        <BedDouble className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mt-2">{stats.totalIpd || 0}</h3>
                    <p className="text-xs font-bold text-purple-700 mt-1">
                      {stats.activeIpd || 0} currently admitted
                    </p>
                  </div>

                  {/* Total OPD (All Time) */}
                  <div className="bg-white p-5 rounded-2xl border-l-4 border-l-cyan-600 border border-cyan-100 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">Total OPD (All)</span>
                      <div className="p-2 bg-cyan-100 text-cyan-700 rounded-xl">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mt-2">{stats.totalOpd || 0}</h3>
                    <p className="text-xs font-semibold text-gray-600 mt-1">All OPD patient records</p>
                  </div>

                  {/* Discharge */}
                  <div className="bg-white p-5 rounded-2xl border-l-4 border-l-emerald-600 border border-emerald-100 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">Discharges</span>
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mt-2">{stats.totalDischarges || 0}</h3>
                    <p className="text-xs font-bold text-emerald-700 mt-1">Discharged IPD patients</p>
                  </div>

                  {/* Billing Pending */}
                  <div className="bg-white p-5 rounded-2xl border-l-4 border-l-amber-600 border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">Billing Pending</span>
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-amber-700 mt-2">{stats.billingPendingCount || 0}</h3>
                    <p className="text-xs font-bold text-amber-800 mt-1">Patients with unbilled charges</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TODAY'S FINANCIAL PERFORMANCE (3 Cards) */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-orange-600" /> Today's Financial &amp; Billing Performance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Bills Completed Today */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-xs hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900">Total Bills Completed Today</span>
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                        <FileCheck className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-indigo-950">{stats.billsCompletedToday || 0}</h3>
                    <p className="text-xs font-semibold text-gray-600">Finalized invoices created today</p>
                  </div>

                  {/* Total Payment Received Today */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-emerald-300 shadow-xs hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">Payment Received Today</span>
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                        <BadgeIndianRupee className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-emerald-700">₹{(stats.paymentReceivedToday || stats.todayCollection || 0).toFixed(2)}</h3>
                    <p className="text-xs font-bold text-emerald-800">Collections &amp; advances received today</p>
                  </div>

                  {/* Total Outstanding Today */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-rose-300 shadow-xs hover:shadow-md transition-shadow space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-rose-900">Total Outstanding Today</span>
                      <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-rose-700">₹{(stats.outstandingToday || 0).toFixed(2)}</h3>
                    <p className="text-xs font-bold text-rose-800">Due balance generated today</p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: MONTHLY FINANCIAL HIGHLIGHTS (2 High-Contrast Banners) */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-orange-600" /> Monthly Financial Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Payment Received for Month */}
                  <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider">Total Payment Received (Month)</span>
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-emerald-900">₹{(stats.paymentReceivedMonth || stats.monthlyCollection || 0).toFixed(2)}</h3>
                    <p className="text-xs font-semibold text-emerald-700">
                      Sum of all finalized invoice payments and advance collections this month
                    </p>
                  </div>

                  {/* Total Payment Pending for Month */}
                  <div className="bg-white border-2 border-rose-500 rounded-2xl p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-extrabold text-rose-800 tracking-wider">Total Payment Pending (Month)</span>
                      <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                        <TrendingDown className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-rose-900">₹{(stats.paymentPendingMonth || 0).toFixed(2)}</h3>
                    <p className="text-xs font-semibold text-rose-700">
                      Sum of all outstanding balances &amp; unfinalized bill amounts for this month
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: INVOICE STATUS BREAKDOWN */}
              <div className="bg-white border border-orange-200/80 rounded-2xl p-5 shadow-xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-4">Invoice Ledger Status Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="border-r border-orange-100 last:border-0 p-2">
                    <span className="text-2xl font-black text-emerald-600">{stats.billCounts.paid}</span>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mt-1">Paid Invoices</p>
                  </div>
                  <div className="border-r border-orange-100 last:border-0 p-2">
                    <span className="text-2xl font-black text-amber-600">{stats.billCounts.unpaid + stats.billCounts.partiallyPaid}</span>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mt-1">Unpaid / Dues</p>
                  </div>
                  <div className="border-r border-orange-100 last:border-0 p-2">
                    <span className="text-2xl font-black text-rose-600">{stats.billCounts.cancelled}</span>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mt-1">Cancelled Bills</p>
                  </div>
                  <div className="p-2">
                    <span className="text-2xl font-black text-orange-600">
                      {stats.billCounts.paid + stats.billCounts.unpaid + stats.billCounts.partiallyPaid}
                    </span>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mt-1">Total Active Ledger</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================== VIEW 4: DUE AMOUNT RECOVERY WORKSPACE ===================== */}
      {activeTab === 'due-recovery' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="card p-5 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent border border-red-200/60 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-red-600" />
                <h2 className="text-base font-bold text-gray-900">Due Amount Recovery Desk</h2>
              </div>
              <p className="text-xs text-gray-600 max-w-2xl">
                Search patients with pending or partial bill dues, record installment payments with automated date & time tracking, and view complete payment history timelines.
              </p>
            </div>
            <button
              onClick={loadDuesList}
              disabled={loadingDues}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingDues ? 'animate-spin text-orange-600' : ''}`} />
              Refresh Dues List
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4 border-l-4 border-l-red-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Outstanding Dues</span>
              <p className="text-2xl font-black text-red-600 mt-1">₹{dueMetrics.totalOutstanding.toFixed(2)}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-amber-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Patients with Dues</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{dueMetrics.patientCount}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-orange-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Due Invoices</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{duesList.length}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="card p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Patient Name, UHID, Mobile, Invoice No, or Bill No..."
                className="input pl-9"
                value={duesSearch}
                onChange={(e) => setDuesSearch(e.target.value)}
              />
              {duesSearch && (
                <button onClick={() => setDuesSearch('')} className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              className="input py-2 md:w-[200px]"
              value={duesStatusFilter}
              onChange={(e) => setDuesStatusFilter(e.target.value)}
            >
              <option value="">All Payment Statuses</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Dues List Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-orange-50/50 text-xs font-bold uppercase text-orange-800 border-b border-orange-100">
                    <th className="p-4">Invoice / Bill No</th>
                    <th className="p-4">Patient Name & UHID</th>
                    <th className="p-4">Bill Date</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Paid Amount</th>
                    <th className="p-4">Due Balance Left</th>
                    <th className="p-4">Payment History</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {loadingDues ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-orange-500 mb-2" />
                        Loading pending due records...
                      </td>
                    </tr>
                  ) : duesList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-400">
                        No pending patient dues found.
                      </td>
                    </tr>
                  ) : (
                    duesList.map((bill) => (
                      <tr key={bill._id} className="hover:bg-orange-50/10 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-gray-900 block text-xs">{bill.invoiceNo || bill.billNo}</span>
                          <span className="text-[10px] text-gray-400 block">{bill.billType}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-gray-900 block">{bill.patientName || bill.patientId?.patientName || 'Patient'}</span>
                          <span className="text-xs text-gray-500 block">
                            UHID: {formatUhid(bill.uhid || bill.patientId?.uhid)} • {bill.patientMobile || bill.patientId?.mobile || ''}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-medium text-gray-700">
                          {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td className="p-4 font-bold text-gray-900">₹{bill.grandTotal?.toFixed(2)}</td>
                        <td className="p-4 font-bold text-emerald-600">₹{bill.amountPaid?.toFixed(2)}</td>
                        <td className="p-4 font-extrabold text-red-600 text-base">
                          ₹{bill.dueAmount?.toFixed(2)}
                        </td>
                        <td className="p-4 text-xs">
                          {bill.payments && bill.payments.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                              <History className="h-3 w-3 text-orange-500" />
                              {bill.payments.length} Installment{bill.payments.length > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No payments yet</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenRecoveryModal(bill)}
                            className="btn py-1.5 px-3 text-xs flex items-center gap-1.5 mx-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          >
                            <Coins className="h-3.5 w-3.5" /> Recover Due
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECOVER DUE PAYMENT MODAL */}
          {selectedBillForRecovery && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="card w-full max-w-xl p-6 space-y-5 bg-white shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-lg">Recover & Manage Patient Dues</h3>
                      <p className="text-xs text-gray-500">Record installment payments or manage due items for this patient</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPrintBillObj(selectedBillForRecovery);
                        setShowPrintModal(true);
                      }}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100 cursor-pointer"
                      title="Print Updated Invoice"
                    >
                      <Printer className="h-3.5 w-3.5 text-orange-600" />
                      <span className="hidden sm:inline font-bold">Print Invoice</span>
                    </button>
                    <button
                      onClick={() => setSelectedBillForRecovery(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Patient & Invoice Summary Box */}
                <div className="bg-gradient-to-br from-orange-50/60 to-white p-4 rounded-xl border border-orange-100 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-gray-900 text-sm">
                    <span>{selectedBillForRecovery.patientName || selectedBillForRecovery.patientId?.patientName}</span>
                    <span className="font-mono text-orange-700">{selectedBillForRecovery.invoiceNo || selectedBillForRecovery.billNo}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-[11px]">
                    <span>UHID: {formatUhid(selectedBillForRecovery.uhid || selectedBillForRecovery.patientId?.uhid)}</span>
                    <span>Bill Type: {selectedBillForRecovery.billType}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-orange-100/70">
                    <div className="bg-white p-2 rounded-lg border border-orange-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Bill</span>
                      <span className="font-bold text-gray-800 text-xs">₹{selectedBillForRecovery.grandTotal?.toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-orange-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Amount Paid</span>
                      <span className="font-bold text-emerald-600 text-xs">₹{selectedBillForRecovery.amountPaid?.toFixed(2)}</span>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg border border-red-200">
                      <span className="text-[10px] text-red-600 uppercase font-extrabold block">Due Left</span>
                      <span className="font-extrabold text-red-700 text-sm">₹{selectedBillForRecovery.dueAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs if dueModificationEnabled is true */}
                {dueModificationEnabled && (
                  <div className="flex border-b border-orange-100 gap-1 text-xs font-bold bg-gray-50/80 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRecoveryTab('pay')}
                      className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        recoveryTab === 'pay'
                          ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Coins className="h-3.5 w-3.5 text-emerald-600" /> Record Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryTab('add-item')}
                      className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        recoveryTab === 'add-item'
                          ? 'bg-white text-blue-700 shadow-xs border border-blue-200/60'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5 text-blue-600" /> + Add Dues
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryTab('remove-item')}
                      className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        recoveryTab === 'remove-item'
                          ? 'bg-white text-red-700 shadow-xs border border-red-200/60'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Trash className="h-3.5 w-3.5 text-red-600" /> - Remove Dues
                    </button>
                  </div>
                )}

                {/* TAB 1: RECORD PAYMENT */}
                {recoveryTab === 'pay' && (
                  <form onSubmit={handleRecordRecoveryPayment} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                        Payment Amount to Recover (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedBillForRecovery.dueAmount}
                        className="input py-2.5 text-base font-extrabold text-gray-900 border-emerald-300 focus:border-emerald-500"
                        value={recoveryPaymentAmount}
                        onChange={(e) => setRecoveryPaymentAmount(e.target.value)}
                        placeholder="e.g. 2500"
                        required
                      />
                    </div>

                    {/* Dynamic Calculation Live Box */}
                    {recoveryPaymentAmount && !isNaN(parseFloat(recoveryPaymentAmount)) && (
                      <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-1">
                        <div className="flex justify-between text-gray-700">
                          <span>Current Due Balance:</span>
                          <span className="font-bold">₹{selectedBillForRecovery.dueAmount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Payment Received Now:</span>
                          <span>- ₹{parseFloat(recoveryPaymentAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 font-extrabold border-t border-emerald-200 pt-1 mt-1">
                          <span>Remaining Due After Payment:</span>
                          <span className={Math.max(0, selectedBillForRecovery.dueAmount - parseFloat(recoveryPaymentAmount || 0)) === 0 ? 'text-green-600 font-black' : 'text-red-600'}>
                            ₹{Math.max(0, selectedBillForRecovery.dueAmount - parseFloat(recoveryPaymentAmount || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                          Payment Mode *
                        </label>
                        <select
                          className="input py-2 text-xs font-semibold"
                          value={recoveryPaymentMode}
                          onChange={(e) => setRecoveryPaymentMode(e.target.value)}
                        >
                          {['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque', 'Insurance'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                          Transaction Ref / UTR
                        </label>
                        <input
                          type="text"
                          placeholder="Ref / Txn No."
                          className="input py-2 text-xs"
                          value={recoveryTransactionRef}
                          onChange={(e) => setRecoveryTransactionRef(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Notes / Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Installment 2 paid at counter"
                        className="input py-2 text-xs"
                        value={recoveryRemarks}
                        onChange={(e) => setRecoveryRemarks(e.target.value)}
                      />
                    </div>

                    {/* Payment History Timeline Section */}
                    {selectedBillForRecovery.payments && selectedBillForRecovery.payments.length > 0 && (
                      <div className="space-y-2 border-t border-orange-100 pt-3">
                        <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <History className="h-3.5 w-3.5 text-orange-500" /> Payment History Log ({selectedBillForRecovery.payments.length})
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {selectedBillForRecovery.payments.map((p, pIdx) => (
                            <div key={pIdx} className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-[11px] flex justify-between items-center">
                              <div>
                                <span className="font-bold text-emerald-700">Paid ₹{p.amount.toFixed(2)}</span>
                                <span className="text-gray-500 block text-[10px]">
                                  Via {p.paymentMode} {p.transactionRef ? `(${p.transactionRef})` : ''} • {p.paidAt ? new Date(p.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-400 block text-[10px]">Due Left: ₹{(p.dueAfterPayment || 0).toFixed(2)}</span>
                                {p.receivedByName && <span className="text-gray-500 font-semibold block text-[10px]">By {p.receivedByName}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 border-t border-orange-50 pt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedBillForRecovery(null)}
                        className="btn-secondary py-2 px-4 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={recordingRecoveryPayment || !recoveryPaymentAmount}
                        className="btn py-2 px-5 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {recordingRecoveryPayment ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Confirm & Record Payment
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: ADD EXTRA DUE ITEM */}
                {recoveryTab === 'add-item' && (
                  <form onSubmit={handleAddDueItem} className="space-y-4">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                      <p className="font-bold text-blue-900">Add Line Item to Patient Bill</p>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        This will add a new item directly into this patient's bill ({selectedBillForRecovery.invoiceNo || selectedBillForRecovery.billNo}) and increase the net payable due.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Category *
                        </label>
                        <select
                          className="input py-2 text-xs font-semibold"
                          value={newDueCategory}
                          onChange={(e) => setNewDueCategory(e.target.value)}
                        >
                          <option value="OPD">OPD Charges</option>
                          <option value="IPD">IPD Charge</option>
                          <option value="Lab">Lab Test</option>
                          <option value="Medicine">Medicine / Pharmacy</option>
                          <option value="Consumable">Consumable</option>
                          <option value="OT">OT Procedure</option>
                          <option value="SameDayTreatment">Same Day Treatment</option>
                          <option value="Other">Other Charges</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Description / Item Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Additional Consultation / Dressing"
                          className="input py-2 text-xs"
                          value={newDueName}
                          onChange={(e) => setNewDueName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          placeholder="0.00"
                          className="input py-2 text-xs font-bold"
                          value={newDuePrice}
                          onChange={(e) => setNewDuePrice(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Discount (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          className="input py-2 text-xs"
                          value={newDueDiscount}
                          onChange={(e) => setNewDueDiscount(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          GST (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          className="input py-2 text-xs"
                          value={newDueGst}
                          onChange={(e) => setNewDueGst(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Qty *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="input py-2 text-xs font-bold"
                          value={newDueQty}
                          onChange={(e) => setNewDueQty(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Item Total Calculation Box */}
                    {newDuePrice && !isNaN(parseFloat(newDuePrice)) && (
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs flex justify-between items-center font-bold">
                        <span className="text-gray-700">Calculated Item Total:</span>
                        <span className="text-blue-700 text-sm font-extrabold">
                          ₹{(
                            (Math.max(0, (parseFloat(newDuePrice) || 0) - (parseFloat(newDueDiscount) || 0)) * (parseInt(newDueQty) || 1)) *
                            (1 + (parseFloat(newDueGst) || 0) / 100)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Remarks / Notes
                      </label>
                      <input
                        type="text"
                        placeholder="Reason for adding due..."
                        className="input py-2 text-xs"
                        value={newDueRemarks}
                        onChange={(e) => setNewDueRemarks(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-orange-50 pt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedBillForRecovery(null)}
                        className="btn-secondary py-2 px-4 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingDueItem || !newDueName.trim() || !newDuePrice}
                        className="btn py-2 px-5 text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {addingDueItem ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Add Due to Bill
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 3: REMOVE DUES / WAIVER */}
                {recoveryTab === 'remove-item' && (
                  <form onSubmit={handleRemoveDueItem} className="space-y-4">
                    <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-xs">
                      <p className="font-bold text-red-900">Remove Item or Waive Due Amount</p>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        Select a line item to remove or enter a waiver amount to reduce the net payable due balance on this bill.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Remove Existing Line Item
                      </label>
                      <select
                        className="input py-2 text-xs font-semibold"
                        value={selectedItemToRemoveIndex}
                        onChange={(e) => {
                          setSelectedItemToRemoveIndex(e.target.value);
                          if (e.target.value !== '') setWaiverAmountInput('');
                        }}
                      >
                        <option value="">-- Or select specific item to remove --</option>
                        {(selectedBillForRecovery.items || []).map((item, idx) => (
                          <option key={idx} value={idx}>
                            [{item.category}] {item.description || item.name || 'Item'} - Qty: {item.quantity} (Total: ₹{(item.total || 0).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-center text-xs text-gray-400 font-bold uppercase tracking-wider my-1">
                      — OR —
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Waive / Remove Due Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedBillForRecovery.dueAmount}
                        placeholder="Enter amount to remove/waive..."
                        className="input py-2 text-xs font-bold"
                        value={waiverAmountInput}
                        onChange={(e) => {
                          setWaiverAmountInput(e.target.value);
                          if (e.target.value) setSelectedItemToRemoveIndex('');
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Remarks / Reason for Removal *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Discount approved by management / Item cancelled"
                        className="input py-2 text-xs"
                        value={removeDueRemarks}
                        onChange={(e) => setRemoveDueRemarks(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-orange-50 pt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedBillForRecovery(null)}
                        className="btn-secondary py-2 px-4 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={removingDueItem || (!selectedItemToRemoveIndex && !waiverAmountInput) || !removeDueRemarks.trim()}
                        className="btn py-2 px-5 text-xs flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        {removingDueItem ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash className="h-3.5 w-3.5" />
                            Confirm Removal
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* ============= MODAL 4: ADD EXTRA DUE / CATEGORY ITEM POPUP ============ */}
      {showCustomChargeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-orange-100">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-orange-600" /> Add Extra Due / Category Item
              </h3>
              <button 
                onClick={() => setShowCustomChargeModal(false)}
                className="p-1 hover:bg-orange-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddCustomChargeItem(); }} className="space-y-4">
              {/* Category selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  className="input py-2 text-xs font-bold border-orange-200 focus:ring-orange-500 mb-2 cursor-pointer"
                  value={categorySelectOption}
                  onChange={(e) => {
                    setCategorySelectOption(e.target.value);
                    if (e.target.value !== 'Other / Custom') {
                      setCustomCategory(e.target.value);
                    }
                  }}
                >
                  <option value="OPD">OPD</option>
                  <option value="IPD">IPD</option>
                  <option value="Lab">Lab</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Consumable">Consumable</option>
                  <option value="SameDayTreatment">SameDayTreatment</option>
                  <option value="BedCharge">BedCharge</option>
                  <option value="OT">OT Surgery</option>
                  <option value="Procedure">Procedure</option>
                  <option value="Nursing">Nursing Charge</option>
                  <option value="Equipment">Equipment Charge</option>
                  <option value="Registration">Registration Fee</option>
                  <option value="Other / Custom">+ Type Custom Category Name</option>
                </select>

                {categorySelectOption === 'Other / Custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom category name..."
                    className="input py-2 text-xs font-bold border-orange-200 animate-fadeIn"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                )}
              </div>

              {/* Description / Item Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Description / Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter charge description (e.g. Special Nursing, Dressing)..."
                  className="input py-2 text-xs font-bold border-orange-200"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                />
              </div>

              {/* Financial Inputs: Price, Discount, GST, Qty */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="input py-1.5 px-2.5 text-xs font-mono font-bold border-orange-200 text-right"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="input py-1.5 px-2.5 text-xs font-mono font-bold border-orange-200 text-right"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    GST (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    className="input py-1.5 px-2.5 text-xs font-mono font-bold border-orange-200 text-right"
                    value={customGst}
                    onChange={(e) => setCustomGst(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    className="input py-1.5 px-2.5 text-xs font-mono font-bold border-orange-200 text-center"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                  />
                </div>
              </div>

              {/* Calculated Total Summary Box */}
              <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-200 flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700">Calculated Charge Item Total:</span>
                <span className="text-base font-black text-orange-700">
                  ₹{((Math.max(0, (parseFloat(customPrice) || 0) - Math.min(parseFloat(customPrice) || 0, parseFloat(customDiscount) || 0))) * Math.max(1, parseInt(customQty) || 1) * (1 + Math.max(0, parseFloat(customGst) || 0) / 100)).toFixed(2)}
                </span>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex gap-2 justify-end border-t border-orange-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomChargeModal(false)}
                  className="btn-secondary py-2 px-4 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customItemName.trim() || !customPrice}
                  className="btn py-2 px-5 text-xs font-extrabold flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Item to Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* ============= MODAL 5: EDIT LINE ITEM POPUP MODAL ===================== */}
      {showEditLineItemModal && editingItemIdx !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-orange-100">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-600" /> Edit Line Item
              </h3>
              <button 
                onClick={() => { setShowEditLineItemModal(false); setEditingItemIdx(null); }}
                className="p-1 hover:bg-orange-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedLineItem} className="space-y-4">
              {/* Category Badge (Read only) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Category
                </label>
                <span className={`inline-block px-2.5 py-1 rounded text-xs font-black uppercase ${CATEGORY_COLORS[items[editingItemIdx]?.category] || 'bg-gray-100 text-gray-800'}`}>
                  {items[editingItemIdx]?.category}
                </span>
              </div>

              {/* Description / Item Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Description / Item Name *
                </label>
                <input
                  type="text"
                  required
                  className="input py-2 text-xs font-bold border-orange-200"
                  value={editItemDesc}
                  onChange={(e) => setEditItemDesc(e.target.value)}
                />
              </div>

              {/* Financial Inputs: Price, Discount, GST, Qty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="input py-1.5 px-2.5 text-xs font-mono font-bold border-orange-200 text-right"
                    value={editItemPrice}
                    onChange={(e) => setEditItemPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input py-1.5 px-2.5 text-xs font-mono font-bold border-orange-200 text-right"
                    value={editItemDiscount}
                    onChange={(e) => setEditItemDiscount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    GST (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input py-1.5 px-2.5 text-xs font-mono font-bold border-orange-200 text-right"
                    value={editItemGst}
                    onChange={(e) => setEditItemGst(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input py-1.5 px-2.5 text-xs font-mono font-bold border-orange-200 text-center"
                    value={editItemQty}
                    onChange={(e) => setEditItemQty(e.target.value)}
                  />
                </div>
              </div>

              {/* Calculated Total Summary Box */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700">Calculated Line Total:</span>
                <span className="text-base font-black text-blue-700">
                  ₹{((Math.max(0, (parseFloat(editItemPrice) || 0) - Math.min(parseFloat(editItemPrice) || 0, parseFloat(editItemDiscount) || 0))) * Math.max(1, parseInt(editItemQty) || 1) * (1 + Math.max(0, parseFloat(editItemGst) || 0) / 100)).toFixed(2)}
                </span>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex gap-2 justify-end border-t border-orange-100 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowEditLineItemModal(false); setEditingItemIdx(null); }}
                  className="btn-secondary py-2 px-4 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editItemDesc.trim() || editItemPrice === ''}
                  className="btn py-2 px-5 text-xs font-extrabold flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" /> Save Item Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ============= MODAL: FINAL PAYMENT COLLECTION & LEDGER POPUP ============ */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-orange-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-orange-600" /> Final Payment Collection &amp; Ledger
                </h3>
                {selectedPatient && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Patient: <span className="font-bold text-gray-800">{selectedPatient.patientName}</span> ({formatUhid(selectedPatient.uhid)})
                  </p>
                )}
              </div>
              <button 
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-orange-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Summary Bar */}
            <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/70 p-3 rounded-xl border border-orange-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Net Payable Amount</span>
                <span className="text-xl font-black text-orange-700">₹{netPayable.toFixed(2)}</span>
              </div>
              <div className="text-right text-xs space-y-0.5 text-gray-600">
                <p>Subtotal: <span className="font-bold">₹{subtotal.toFixed(2)}</span></p>
                <p>Advance Adjusted: <span className="font-bold text-emerald-600">₹{(advanceToAdjust || 0).toFixed(2)}</span></p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-black uppercase text-gray-600 mb-1">Select Payment Mode *</label>
                <select
                  className="input text-xs font-bold py-2.5 cursor-pointer"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="">-- Select Payment Mode --</option>
                  {PAYMENT_MODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              {/* Partial Payment Amount Received Input Box */}
              <div className="bg-gradient-to-br from-orange-50/60 to-amber-50/40 p-3.5 rounded-xl border border-orange-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                    Amount Received Now (₹)
                  </label>
                  <span className="text-[10px] font-bold text-gray-500">
                    Net Payable: ₹{netPayable.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={netPayable}
                    className="input py-2 text-sm font-extrabold text-gray-900 bg-white border-orange-300 focus:border-orange-500 flex-1"
                    placeholder={netPayable.toFixed(2)}
                    value={customPaidAmount}
                    onChange={(e) => setCustomPaidAmount(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomPaidAmount(String(netPayable))}
                    className="px-3 py-2 bg-orange-500 text-white font-extrabold text-xs rounded-lg shadow-xs hover:bg-orange-600 transition cursor-pointer"
                  >
                    Full Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomPaidAmount('0')}
                    className="px-3 py-2 bg-gray-200 text-gray-800 font-extrabold text-xs rounded-lg hover:bg-gray-300 transition cursor-pointer"
                  >
                    Unpaid / 0
                  </button>
                </div>

                {/* Live Balance Summary */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs border-t border-orange-100/80">
                  <div className="bg-white p-2 rounded-lg border border-orange-100">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Net Payable</span>
                    <span className="font-bold text-gray-900 text-xs">₹{netPayable.toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span className="text-[9px] text-emerald-700 font-bold uppercase block">Paid Now</span>
                    <span className="font-extrabold text-emerald-700 text-xs">₹{effectiveAmountPaid.toFixed(2)}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${effectiveDueAmount > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    <span className="text-[9px] uppercase font-extrabold block">Due Left</span>
                    <span className="font-extrabold text-xs">₹{effectiveDueAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Transaction reference if applicable */}
              {paymentMode && paymentMode !== 'Cash' && paymentMode !== 'Mixed Payment' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-black uppercase text-gray-600 mb-1">Transaction Ref / Cheque No / Card details</label>
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
                <label className="block text-xs font-black uppercase text-gray-600 mb-1">Notes / Remarks</label>
                <textarea
                  className="input text-xs"
                  rows={2}
                  placeholder="Add invoice notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-orange-100 flex flex-col gap-2">
              {/* Warnings if disabled */}
              {Boolean(selectedPatient?.dischargeBlocked || (selectedPatient?.admissionDetails && selectedPatient?.admissionDetails?.status !== 'Discharged')) && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-[11px] font-bold text-red-600">
                    ⚠️ Cannot Finalize Invoice: Patient is currently admitted in IPD and has not been discharged.
                  </p>
                </div>
              )}
              {!Boolean(selectedPatient?.dischargeBlocked || (selectedPatient?.admissionDetails && selectedPatient?.admissionDetails?.status !== 'Discharged')) && (subtotal <= 0 || selectedItems.length === 0) && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center font-bold">
                  <p className="text-[11px] text-amber-700">
                    ⚠️ Cannot Finalize Invoice: OPD/IPD billing subtotal is ₹0.00 or no billable items selected.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handlePrintOverviewDraft}
                className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5 border-dashed border-orange-300 text-orange-700 hover:bg-orange-50 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Patient Overview
              </button>
              {requestAdminDiscount ? (
                <button
                  onClick={async () => {
                    await handleSaveBillRequest();
                    setShowPaymentModal(false);
                  }}
                  disabled={saving}
                  className="btn text-xs py-2.5 w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" /> Submit Discount Request
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await handleSaveBill(false);
                      setShowPaymentModal(false);
                    }}
                    disabled={saving}
                    className="btn-secondary text-xs py-2.5 flex-1 cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleSaveBill(true);
                      setShowPaymentModal(false);
                    }}
                    disabled={
                      saving || 
                      Boolean(selectedPatient?.dischargeBlocked || (selectedPatient?.admissionDetails && selectedPatient?.admissionDetails?.status !== 'Discharged')) ||
                      subtotal <= 0 || 
                      selectedItems.length === 0
                    }
                    className={`btn text-xs py-2.5 flex-1 font-extrabold transition ${
                      saving || 
                      Boolean(selectedPatient?.dischargeBlocked || (selectedPatient?.admissionDetails && selectedPatient?.admissionDetails?.status !== 'Discharged')) ||
                      subtotal <= 0 || 
                      selectedItems.length === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-0'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    }`}
                    title={
                      Boolean(selectedPatient?.dischargeBlocked || (selectedPatient?.admissionDetails && selectedPatient?.admissionDetails?.status !== 'Discharged'))
                        ? 'Discharge patient from IPD first to finalize invoice'
                        : subtotal <= 0 || selectedItems.length === 0
                        ? 'Billing subtotal must be greater than zero to finalize invoice'
                        : 'Finalize invoice'
                    }
                  >
                    {saving ? 'Processing...' : 'Finalize Invoice'}
                  </button>
                </div>
              )}
            </div>
          </div>
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
      {showPrintModal && printBillObj && (() => {
        const hasItemDiscounts = (printBillObj.items || []).some(item => (item.discountAmount || 0) > 0);
        const totalItemDiscounts = (printBillObj.items || []).reduce((sum, item) => sum + ((item.discountAmount || 0) * item.quantity), 0);
        const actualGrossSubtotal = (printBillObj.items || []).reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
        const generalDiscountAmount = (printBillObj.discountAmount || 0) - totalItemDiscounts;
        const footerColSpan = hasItemDiscounts ? 8 : 6;
        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn print:static print:p-0 print:bg-transparent print:backdrop-blur-none print:overflow-visible print:z-auto">
            <div className="bg-gray-100 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col h-[90vh] print:bg-transparent print:shadow-none print:max-w-none print:w-full print:h-auto print:border-none print:rounded-none print:overflow-visible">
              
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 rounded-t-2xl print:hidden">
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
              <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-200/50 print:bg-transparent print:p-0 print:overflow-visible">
                <div
                  ref={printAreaRef}
                  className="a4-receipt bg-white shadow-lg w-[210mm] min-h-[297mm] p-10 border border-gray-300 relative text-gray-900 overflow-hidden text-left leading-normal print:w-full print:max-w-none print:shadow-none print:border-none print:p-4 print:m-0"
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
                      {hospitalInfo?.dlNumber && <p>DL No: {hospitalInfo.dlNumber}</p>}
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
                      {hasItemDiscounts ? (
                        <tr>
                          <th className="w-12 text-center">Sr No</th>
                          <th>Service Name</th>
                          <th>Category</th>
                          <th className="text-right w-12">Qty</th>
                          <th className="text-right w-20">Actual Price</th>
                          <th className="text-right w-20">Discount Price</th>
                          <th className="text-right w-20">Total Discount</th>
                          <th className="text-right w-16">GST (%)</th>
                          <th className="text-right w-20">Amount</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="w-12 text-center">Sr No</th>
                          <th>Service Name</th>
                          <th>Category</th>
                          <th className="text-right w-16">Quantity</th>
                          <th className="text-right w-20">Rate</th>
                          <th className="text-right w-20">GST (%)</th>
                          <th className="text-right w-24">Amount</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {(printBillObj.items || []).map((item, idx) => {
                        const itemDisc = item.discountAmount || 0;
                        const itemTotalDisc = itemDisc * item.quantity;
                        return hasItemDiscounts ? (
                          <tr key={idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td className="font-bold">{item.description}</td>
                            <td>{item.category}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right font-mono">₹{(item.price || 0).toFixed(2)}</td>
                            <td className="text-right font-mono text-green-700">₹{itemDisc.toFixed(2)}</td>
                            <td className="text-right font-mono text-green-700">₹{itemTotalDisc.toFixed(2)}</td>
                            <td className="text-right font-mono">{item.gstPercentage || 0}%</td>
                            <td className="text-right font-mono font-bold">₹{(item.total || 0).toFixed(2)}</td>
                          </tr>
                        ) : (
                          <tr key={idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td className="font-bold">{item.description}</td>
                            <td>{item.category}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right font-mono">₹{(item.price || 0).toFixed(2)}</td>
                            <td className="text-right font-mono">{item.gstPercentage || 0}%</td>
                            <td className="text-right font-mono font-bold">₹{(item.total || 0).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="font-bold text-[11px] font-mono">
                      {hasItemDiscounts ? (
                        <>
                          <tr>
                            <td colSpan={footerColSpan} className="text-right border-r-0">Gross Total (Before Discount):</td>
                            <td className="text-right border-l-0">₹{actualGrossSubtotal.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan={footerColSpan} className="text-right border-r-0">Item-wise Discount:</td>
                            <td className="text-right border-l-0 text-green-700">- ₹{totalItemDiscounts.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan={footerColSpan} className="text-right border-r-0">Subtotal after Item Discount:</td>
                            <td className="text-right border-l-0">₹{(printBillObj.subtotal || 0).toFixed(2)}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={footerColSpan} className="text-right border-r-0">Gross Subtotal:</td>
                          <td className="text-right border-l-0">₹{(printBillObj.subtotal || 0).toFixed(2)}</td>
                        </tr>
                      )}
                      {printBillObj.gstPercentage > 0 && (
                        <tr>
                          <td colSpan={footerColSpan} className="text-right border-r-0">GST ({printBillObj.gstPercentage}%):</td>
                          <td className="text-right border-l-0">+ ₹{(printBillObj.gstAmount || 0).toFixed(2)}</td>
                        </tr>
                      )}
                      {generalDiscountAmount > 0 && (
                        <tr>
                          <td colSpan={footerColSpan} className="text-right border-r-0">
                            {printBillObj.discountPercentage > 0 
                              ? `General Discount (${printBillObj.discountPercentage}%):` 
                              : 'General Discount:'}
                          </td>
                          <td className="text-right border-l-0 text-green-700">- ₹{generalDiscountAmount.toFixed(2)}</td>
                        </tr>
                      )}
                      {!hasItemDiscounts && printBillObj.discountAmount > 0 && (
                        <tr>
                          <td colSpan={footerColSpan} className="text-right border-r-0">Discount:</td>
                          <td className="text-right border-l-0 text-green-700">- ₹{(printBillObj.discountAmount || 0).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="text-[12px] font-black uppercase">
                        <td colSpan={footerColSpan} className="text-right border-r-0">Grand Total:</td>
                        <td className="text-right border-l-0">₹{(printBillObj.grandTotal || 0).toFixed(2)}</td>
                      </tr>

                      {printBillObj.advanceAdjusted > 0 && (
                        <tr className="text-green-700 font-bold">
                          <td colSpan={footerColSpan} className="text-right border-r-0">Advance Adjusted:</td>
                          <td className="text-right border-l-0">- ₹{(printBillObj.advanceAdjusted || 0).toFixed(2)}</td>
                        </tr>
                      )}
                      
                      <tr className="font-extrabold text-[12px] border-t border-black">
                        <td colSpan={footerColSpan} className="text-right border-r-0">Net Payable Amount:</td>
                        <td className="text-right border-l-0">
                          ₹{Math.max(0, (printBillObj.grandTotal || 0) - (printBillObj.advanceAdjusted || 0)).toFixed(2)}
                        </td>
                      </tr>

                      <tr className="font-extrabold text-emerald-800">
                        <td colSpan={footerColSpan} className="text-right border-r-0">Amount Paid / Received:</td>
                        <td className="text-right border-l-0">₹{(printBillObj.amountPaid || 0).toFixed(2)}</td>
                      </tr>

                      {(printBillObj.dueAmount || 0) > 0 && (
                        <tr className="font-black text-red-700 text-[12px]">
                          <td colSpan={footerColSpan} className="text-right border-r-0">Balance Due Outstanding:</td>
                          <td className="text-right border-l-0 font-black">₹{(printBillObj.dueAmount || 0).toFixed(2)}</td>
                        </tr>
                      )}

                      <tr className="font-extrabold uppercase text-[10px]">
                        <td colSpan={footerColSpan} className="text-right border-r-0">Payment Status:</td>
                        <td className={`text-right border-l-0 font-black ${
                          printBillObj.paymentStatus === 'Paid' ? 'text-green-700' : (printBillObj.paymentStatus === 'Partially Paid' ? 'text-amber-700' : 'text-red-700')
                        }`}>
                          {printBillObj.paymentStatus || 'Unpaid'}
                        </td>
                      </tr>
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
                          {allPatientAdvances.map((adv, aIdx) => (
                            <tr key={adv._id}>
                              <td className="text-center">{aIdx + 1}</td>
                              <td>{new Date(adv.createdAt).toLocaleString('en-IN')}</td>
                              <td className="font-bold text-gray-750">{adv.paymentMode}</td>
                              <td className="italic text-gray-500">{adv.remarks || 'No remarks'}</td>
                              <td>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  adv.isAdjusted ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-850'
                                }`}>
                                  {adv.isAdjusted ? 'Adjusted' : 'Available'}
                                </span>
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
        );
      })()}

    </div>
  );
};

export default BillingPage;