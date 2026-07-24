import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import toast from 'react-hot-toast';
import BillingSettingsView from './BillingSettingsView';
import ExcelUploadView from './ExcelUploadView';
import {
  Pill,
  Search,
  CalendarDays,
  Loader2,
  X,
  RefreshCw,
  Package,
  Upload,
  AlertTriangle,
  AlertCircle,
  Download,
  Check,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  ClipboardList,
  Eye,
  CheckCircle,
  User,
  Truck,
  Activity,
  List,
  RotateCcw,
  Percent,
  BarChart3,
  Plus,
  Settings,
  DollarSign,
  BadgeIndianRupee,
  Printer,
  Trash2,
  Edit,
  History,
  FileText,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useHeader } from '../../context/HeaderContext';
import * as XLSX from 'xlsx';
import { createPortal } from 'react-dom';
import './PharmacyInvoicePrint.css';

// Color Helper for stock status
const getStatusDetails = (qty, expiryDateStr, threshold = 10) => {
  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const isExpired = expiryDate <= today;
  const isNearExpiry = expiryDate > today && expiryDate <= thirtyDaysLater;
  const isLow = qty <= threshold;

  if (isExpired) {
    if (isLow) {
      return {
        label: 'Expired & Low Stock',
        colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
        badgeColor: 'bg-blue-500',
        textClass: 'text-blue-700 font-extrabold',
        code: 'Blue'
      };
    }
    return {
      label: 'Expired',
      colorClass: 'bg-red-100 text-red-800 border-red-200',
      badgeColor: 'bg-red-500',
      textClass: 'text-red-700 font-extrabold',
      code: 'Red'
    };
  }

  if (isNearExpiry) {
    if (isLow) {
      return {
        label: 'Near Expiry & Low Stock',
        colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
        badgeColor: 'bg-blue-500',
        textClass: 'text-blue-700 font-extrabold',
        code: 'Blue'
      };
    }
    return {
      label: 'Near Expiry Warning',
      colorClass: 'bg-orange-100 text-orange-800 border-orange-200',
      badgeColor: 'bg-orange-500',
      textClass: 'text-orange-700 font-bold',
      code: 'Orange'
    };
  }

  if (isLow) {
    return {
      label: 'Low Stock Warning',
      colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      badgeColor: 'bg-yellow-500',
      textClass: 'text-yellow-700 font-bold',
      code: 'Yellow'
    };
  }

  return {
    label: 'Valid & Stable',
    colorClass: 'bg-green-100 text-green-800 border-green-200',
    badgeColor: 'bg-green-500',
    textClass: 'text-green-700 font-bold',
    code: 'Green'
  };
};

const PharmacyWorkspace = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSection = searchParams.get('section') || 'dashboard';

  // State
  const [stats, setStats] = useState({ totalItems: 0, outOfStockCount: 0, expiryWarningCount: 0, expiredCount: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const [billingStats, setBillingStats] = useState({ totalBills: 0, totalRevenue: 0, totalMedicinesSold: 0, totalGSTCollected: 0 });
  const [billingStatsLoading, setBillingStatsLoading] = useState(false);

  // Stats Loader
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await client.get('/pharmacy/inventory/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadBillingStats = useCallback(async () => {
    setBillingStatsLoading(true);
    try {
      const { data } = await client.get('/pharmacy/billing/dashboard');
      setBillingStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBillingStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadBillingStats();
  }, [loadStats, loadBillingStats, currentSection]);

  const changeSection = (sectionName) => {
    setSearchParams({ section: sectionName });
  };

  useHeader({ 
    onRefresh: () => { loadStats(); loadBillingStats(); } 
  });

  return (
    <div className="space-y-6">

      {/* Render selected view */}
      {currentSection === 'dashboard' && (
        <DashboardView 
          changeSection={changeSection} 
          stats={stats} 
          statsLoading={statsLoading} 
          billingStats={billingStats} 
          billingStatsLoading={billingStatsLoading} 
        />
      )}
      {currentSection === 'opd-prescriptions' && (
        <OpdPrescriptionsView 
          changeSection={changeSection} 
          setSelectedPrescription={setSelectedPrescription} 
        />
      )}
      {currentSection === 'new-bill' && (
        <NewBillView 
          selectedPrescription={selectedPrescription} 
          clearPrescription={() => setSelectedPrescription(null)} 
        />
      )}
      {currentSection === 'walk-in-billing' && (
        <NewBillView 
          isWalkIn={true} 
          selectedPrescription={null} 
          clearPrescription={() => {}} 
        />
      )}
      {currentSection === 'sales-history' && <SalesHistoryView />}
      {currentSection === 'sales-return' && <SalesReturnView />}
      {currentSection === 'requests' && <RequestsView />}
      {currentSection === 'inventory' && <InventoryView />}
      {currentSection === 'excel-upload' && <ExcelUploadView loadStats={loadStats} />}
      {currentSection === 'supplier-management' && <SupplierManagementView />}
      {currentSection === 'purchase-entry' && <PurchaseEntryView />}
      {currentSection === 'purchase-history' && <PurchaseHistoryView />}
      {currentSection === 'billing-reports' && <BillingReportsView />}
      {currentSection === 'gst-reports' && <GstReportsView />}
      {currentSection === 'expiry' && <ExpiryMedicinesView />}
      {currentSection === 'out-of-stock' && <OutOfStockView />}
      {currentSection === 'billing-settings' && <BillingSettingsView isAdmin={false} />}
    </div>
  );
};

// ==================== DASHBOARD VIEW ====================
const DashboardView = ({ changeSection }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await client.get('/pharmacy/analytics/dashboard');
      setData(res);
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin text-orange-550 inline mr-2" /> Loading dashboard analytics...
      </div>
    );
  }

  const summary = data?.summary || {};
  const graphs = data?.graphs || {};

  return (
    <div className="space-y-6 animate-fade-in text-gray-700">
      
      {/* Dynamic Alerts Banner */}
      {(summary.lowStock > 0 || summary.expired > 0 || summary.expiringSoon > 0 || summary.pendingSupplierPayments > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-4 flex flex-col gap-2.5 text-xs text-red-800">
          <div className="flex items-center gap-2 font-black">
            <AlertCircle className="h-5 w-5 text-red-650" />
            <span>CRITICAL PHARMACY ALERTS</span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4 font-semibold">
            {summary.lowStock > 0 && (
              <div className="bg-white/65 p-2.5 rounded-xl border border-red-100 flex justify-between items-center">
                <span>⚠️ Low Stock Items</span>
                <span className="font-black font-mono text-red-650 bg-red-100 px-2 py-0.5 rounded-md">{summary.lowStock}</span>
              </div>
            )}
            {summary.expired > 0 && (
              <div className="bg-white/65 p-2.5 rounded-xl border border-red-100 flex justify-between items-center">
                <span>🚫 Expired Batches</span>
                <span className="font-black font-mono text-red-650 bg-red-100 px-2 py-0.5 rounded-md">{summary.expired}</span>
              </div>
            )}
            {summary.expiringSoon > 0 && (
              <div className="bg-white/65 p-2.5 rounded-xl border border-red-100 flex justify-between items-center">
                <span>⏳ Expiring Soon (90d)</span>
                <span className="font-black font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">{summary.expiringSoon}</span>
              </div>
            )}
            {summary.pendingSupplierPayments > 0 && (
              <div className="bg-white/65 p-2.5 rounded-xl border border-red-100 flex justify-between items-center">
                <span>💸 Outstanding Bills</span>
                <span className="font-black font-mono text-red-650 bg-red-100 px-2 py-0.5 rounded-md">₹{summary.pendingSupplierPayments.toFixed(0)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main KPI Summary Widgets */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 text-xs">
        {/* Today's Sales */}
        <div className="card p-5 bg-gradient-to-br from-white to-green-50/10 border-green-100 shadow-sm cursor-pointer hover:-translate-y-0.5 transition duration-300" onClick={() => changeSection('sales')}>
          <span className="text-[10px] uppercase font-bold text-gray-400">Today's Sales</span>
          <h3 className="text-2xl font-black text-green-700 mt-1">₹{(summary.todaySales || 0).toFixed(2)}</h3>
          <p className="text-[10px] text-gray-400 mt-2">Monthly: <span className="font-bold text-gray-700">₹{(summary.monthlySales || 0).toFixed(0)}</span></p>
        </div>
        {/* Today's Purchases */}
        <div className="card p-5 bg-gradient-to-br from-white to-blue-50/10 border-blue-100 shadow-sm cursor-pointer hover:-translate-y-0.5 transition duration-300" onClick={() => changeSection('purchases')}>
          <span className="text-[10px] uppercase font-bold text-gray-400">Today's Purchases</span>
          <h3 className="text-2xl font-black text-blue-700 mt-1">₹{(summary.todayPurchase || 0).toFixed(2)}</h3>
          <p className="text-[10px] text-gray-400 mt-2">Monthly: <span className="font-bold text-gray-700">₹{(summary.monthlyPurchase || 0).toFixed(0)}</span></p>
        </div>
        {/* Stock Value Ex GST */}
        <div className="card p-5 bg-gradient-to-br from-white to-amber-50/10 border-amber-100 shadow-sm cursor-pointer hover:-translate-y-0.5 transition duration-300" onClick={() => changeSection('inventory')}>
          <span className="text-[10px] uppercase font-bold text-gray-400">Stock Value (Ex GST)</span>
          <h3 className="text-2xl font-black text-amber-700 mt-1">₹{(summary.totalExGst || 0).toFixed(2)}</h3>
          <p className="text-[10px] text-gray-400 mt-2">Medicines: <span className="font-bold text-gray-700">{summary.totalMedicines || 0}</span></p>
        </div>
        {/* Stock Value Inc GST */}
        <div className="card p-5 bg-gradient-to-br from-white to-orange-50/10 border-orange-100 shadow-sm cursor-pointer hover:-translate-y-0.5 transition duration-300" onClick={() => changeSection('inventory')}>
          <span className="text-[10px] uppercase font-bold text-gray-400">Stock Value (Inc GST)</span>
          <h3 className="text-2xl font-black text-orange-700 mt-1">₹{(summary.totalIncGst || 0).toFixed(2)}</h3>
          <p className="text-[10px] text-gray-400 mt-2">Medicines: <span className="font-bold text-gray-700">{summary.totalMedicines || 0}</span></p>
        </div>
        {/* Outstanding supplier balances */}
        <div className="card p-5 bg-gradient-to-br from-white to-red-50/10 border-red-100 shadow-sm cursor-pointer hover:-translate-y-0.5 transition duration-300" onClick={() => changeSection('purchases')}>
          <span className="text-[10px] uppercase font-bold text-gray-400">Supplier Outstanding</span>
          <h3 className="text-2xl font-black text-red-750 mt-1">₹{(summary.pendingSupplierPayments || 0).toFixed(2)}</h3>
          <p className="text-[10px] text-gray-400 mt-2">Active Suppliers: <span className="font-bold text-gray-700">{summary.totalSuppliers || 0}</span></p>
        </div>
      </div>

      {/* Grid count stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-xs font-bold text-gray-500">
        <div className="p-3.5 bg-white border border-orange-100 rounded-2xl text-center shadow-sm">
          <span className="text-gray-400 font-bold block text-[10px] uppercase">Purchase Invoices</span>
          <span className="text-lg font-black text-gray-800 font-mono mt-1 block">{summary.totalPurchaseInvoices}</span>
        </div>
        <div className="p-3.5 bg-white border border-orange-100 rounded-2xl text-center shadow-sm">
          <span className="text-gray-400 font-bold block text-[10px] uppercase">Sales Invoices</span>
          <span className="text-lg font-black text-gray-800 font-mono mt-1 block">{summary.totalSalesInvoices}</span>
        </div>
        <div className="p-3.5 bg-white border border-orange-100 rounded-2xl text-center shadow-sm cursor-pointer" onClick={() => changeSection('inventory')}>
          <span className="text-gray-400 font-bold block text-[10px] uppercase">Low Stock Limit</span>
          <span className="text-lg font-black text-red-500 font-mono mt-1 block">{summary.lowStock}</span>
        </div>
        <div className="p-3.5 bg-white border border-orange-100 rounded-2xl text-center shadow-sm cursor-pointer" onClick={() => changeSection('inventory')}>
          <span className="text-gray-400 font-bold block text-[10px] uppercase">Expired Items</span>
          <span className="text-lg font-black text-red-750 font-mono mt-1 block">{summary.expired}</span>
        </div>
      </div>

      {/* Visual Analytics graphs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Selling Medicines */}
        <div className="card p-5 space-y-4 bg-white border border-orange-100 shadow-sm">
          <h4 className="font-extrabold text-gray-800 text-xs border-b border-orange-50 pb-2 flex items-center gap-1.5">
            <TrendingUp className="text-green-600 h-4.5 w-4.5" /> Top Selling Medicines (Units)
          </h4>
          <div className="space-y-3">
            {graphs.topSellingMeds?.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center font-bold">No sales logged.</p>
            ) : (
              graphs.topSellingMeds?.map((med, idx) => {
                const maxVal = Math.max(...graphs.topSellingMeds.map(m => m.totalQty));
                const pct = maxVal > 0 ? (med.totalQty / maxVal) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>{med._id}</span>
                      <span className="font-mono text-orange-700">{med.totalQty} Units</span>
                    </div>
                    <div className="w-full bg-orange-50 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Purchased Medicines */}
        <div className="card p-5 space-y-4 bg-white border border-orange-100 shadow-sm">
          <h4 className="font-extrabold text-gray-800 text-xs border-b border-orange-50 pb-2 flex items-center gap-1.5">
            <Package className="text-indigo-650 h-4.5 w-4.5" /> Top Purchased Medicines (Units)
          </h4>
          <div className="space-y-3">
            {graphs.topPurchasedMeds?.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center font-bold">No purchases logged.</p>
            ) : (
              graphs.topPurchasedMeds?.map((med, idx) => {
                const maxVal = Math.max(...graphs.topPurchasedMeds.map(m => m.totalQty));
                const pct = maxVal > 0 ? (med.totalQty / maxVal) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>{med._id}</span>
                      <span className="font-mono text-indigo-700">{med.totalQty} Units</span>
                    </div>
                    <div className="w-full bg-indigo-50 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-400 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Supplier Purchase share */}
        <div className="card p-5 space-y-4 bg-white border border-orange-100 shadow-sm md:col-span-2">
          <h4 className="font-extrabold text-gray-800 text-xs border-b border-orange-50 pb-2 flex items-center gap-1.5">
            <Truck className="text-orange-500 h-4.5 w-4.5" /> Supplier Procurement Share (₹ Value)
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2.5">
              {graphs.supplierPurchases?.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center font-bold">No supplier purchases logged.</p>
              ) : (
                graphs.supplierPurchases?.slice(0, 5).map((sup, idx) => {
                  const totalSum = graphs.supplierPurchases.reduce((acc, s) => acc + s.totalPurchases, 0);
                  const pct = totalSum > 0 ? (sup.totalPurchases / totalSum) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-gray-700">
                        <span>{sup.supplierName}</span>
                        <span className="font-mono text-gray-850">₹{sup.totalPurchases.toFixed(0)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-orange-50/50 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex flex-col justify-center items-center p-4 bg-orange-50/10 rounded-2xl border border-orange-100/50 text-xs text-gray-500 text-center">
              <span className="font-bold text-[10px] uppercase">Procurement Ledger Total</span>
              <span className="text-xl font-black text-orange-700 font-mono mt-1">₹{graphs.supplierPurchases?.reduce((acc, s) => acc + s.totalPurchases, 0).toFixed(0)}</span>
              <span className="text-[10px] text-gray-400 font-medium mt-1">Total aggregated purchase cost</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== INVENTORY VIEW ====================
const InventoryView = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedMedForHistory, setSelectedMedForHistory] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('itemName');
  const [sortOrder, setSortOrder] = useState('asc');

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        search,
        status,
        sortBy,
        sortOrder
      });
      const { data } = await client.get(`/pharmacy/inventory?${params.toString()}`);
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Reset page when search or status filters change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilter = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleDownloadStock = async () => {
    const toastId = toast.loading('Preparing stock file for download...');
    try {
      const params = new URLSearchParams({
        limit: 1000000,
        page: 1,
        search,
        status,
        sortBy,
        sortOrder
      });
      const { data } = await client.get(`/pharmacy/inventory?${params.toString()}`);
      const itemsToExport = data.items || [];

      if (itemsToExport.length === 0) {
        toast.error('No inventory items to export.', { id: toastId });
        return;
      }

      // Map raw db items to a clean format for Excel columns
      const formatted = itemsToExport.map((item, idx) => ({
        'S.No': item.sNo || idx + 1,
        'Medicine Name': item.itemName,
        'Description': item.description || '',
        'Dosage Form': item.dosageForm || '',
        'Pack Type': item.packType || '',
        'Units per Pack': item.unitsPerPack,
        'Available Units': item.quantityUnits,
        'Available Packs': item.quantityPacks,
        'Batch No': item.batch,
        'Expiry Date': item.expiry ? new Date(item.expiry).toLocaleDateString('en-GB') : '',
        'Rate Ex GST (Pack)': item.rateExGst,
        'Per Unit Rate': item.perUnitRate,
        'SGST %': item.sgst,
        'CGST %': item.cgst,
        'MRP Inc GST (Pack)': item.mrp,
        'HSN Code': item.hsn || '',
        'Threshold Qty': item.thresholdMedicineNumber
      }));

      const worksheet = XLSX.utils.json_to_sheet(formatted);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Inventory');
      XLSX.writeFile(workbook, `Pharmacy_Stock_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Stock inventory downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download stock inventory.', { id: toastId });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters Card */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Item Name or Batch..." 
              className="input pl-9 text-sm py-2.5" 
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-bold text-gray-550 mr-1.5">Filters:</span>
              {[
                { label: 'All', code: '' },
                { label: 'Green', code: 'Green' },
                { label: 'Yellow', code: 'Yellow' },
                { label: 'Red', code: 'Red' },
                { label: 'Blue', code: 'Blue' },
                { label: 'Orange', code: 'Orange' }
              ].map(f => (
                <button 
                  key={f.label} 
                  onClick={() => handleStatusFilter(f.code)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                    status === f.code 
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
                      : 'bg-orange-50/30 text-gray-700 border-orange-100 hover:bg-orange-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-550">Sort By:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                  setPage(1);
                }}
                className="input py-1.5 px-3 text-xs font-semibold w-[180px] bg-white border-orange-100 focus:border-orange-500 rounded-xl"
              >
                <option value="itemName-asc">Alphabetical (A-Z)</option>
                <option value="itemName-desc">Alphabetical (Z-A)</option>
                <option value="createdAt-desc">Date Added (Newest)</option>
                <option value="createdAt-asc">Date Added (Oldest)</option>
                <option value="sNo-asc">Serial Number (Asc)</option>
                <option value="sNo-desc">Serial Number (Desc)</option>
                <option value="quantity-desc">Quantity (High-Low)</option>
                <option value="quantity-asc">Quantity (Low-High)</option>
                <option value="expiry-asc">Expiry Date (Soonest)</option>
                <option value="expiry-desc">Expiry Date (Latest)</option>
              </select>
            </div>

            <button
              onClick={handleDownloadStock}
              className="btn py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-green-600 to-emerald-605 text-white border-0 shadow-sm hover:from-green-700 hover:to-emerald-700 transition-all rounded-xl"
            >
              <FileSpreadsheet className="h-4 w-4" /> Download Stock
            </button>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-[10px] font-bold uppercase text-gray-600 border-b border-orange-100 select-none">
                <th onClick={() => toggleSort('sNo')} className="p-3 pl-4 cursor-pointer hover:text-orange-600 transition">
                  Sno. {sortBy === 'sNo' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => toggleSort('itemName')} className="p-3 cursor-pointer hover:text-orange-600 transition">
                  Medicine {sortBy === 'itemName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="p-3">Description</th>
                <th className="p-3">Dosage Form</th>
                <th className="p-3">Pack Type</th>
                <th className="p-3 text-center">Units/Pack</th>
                <th onClick={() => toggleSort('quantity')} className="p-3 cursor-pointer hover:text-orange-600 transition">
                  Qty (Units / Packs) {sortBy === 'quantity' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="p-3">Batch</th>
                <th onClick={() => toggleSort('expiry')} className="p-3 cursor-pointer hover:text-orange-600 transition">
                  Expiry {sortBy === 'expiry' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="p-3 text-right">Rates (Pack / Unit)</th>
                <th className="p-3 text-center">GST (SGST/CGST)</th>
                <th className="p-3 text-right">MRP (Pack / Unit)</th>
                <th className="p-3">HSN Code</th>
                <th className="p-3 text-center">Threshold</th>
                <th className="p-3 text-right">Total Valuation</th>
                <th className="p-3 pr-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="16" className="p-8">
                    <SkeletonTable rows={5} columns={16} className="w-full" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="16" className="p-8 text-center text-gray-400">
                    <Pill className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
                    <p className="font-bold">No medicines found</p>
                    <p className="text-xs">Upload an Excel sheet or refine search filters.</p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const stat = getStatusDetails(item.quantityUnits, item.expiry, item.thresholdMedicineNumber);
                  return (
                    <tr key={item._id} className="hover:bg-orange-50/10 transition align-middle">
                      <td className="p-3 pl-4 font-bold text-gray-400">{item.sNo || idx + 1}</td>
                      <td className="p-3 font-bold text-orange-655 hover:underline cursor-pointer" onClick={() => setSelectedMedForHistory(item.itemName)}>{item.itemName}</td>
                      <td className="p-3 text-gray-500 max-w-[150px] truncate" title={item.description}>{item.description || '-'}</td>
                      <td className="p-3 text-gray-650 font-semibold">{item.dosageForm || '-'}</td>
                      <td className="p-3 text-gray-650 font-semibold">{item.packType || '-'}</td>
                      <td className="p-3 text-center font-bold text-gray-600">{item.unitsPerPack}</td>
                      <td className={`p-3 font-bold ${stat.textClass}`}>
                        <div>{item.quantityUnits} Units</div>
                        <div className="text-[10px] text-gray-400 font-normal">{item.quantityPacks} Packs</div>
                      </td>
                      <td className="p-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-xs border border-gray-200">{item.batch}</span></td>
                      <td className="p-3 font-semibold text-gray-600">{new Date(item.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</td>
                      <td className="p-3 text-right font-semibold">
                        <div className="text-gray-800">₹{item.rateExGst.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-450">Unit: ₹{item.perUnitRate.toFixed(2)}</div>
                      </td>
                      <td className="p-3 text-center text-[10px] text-gray-500 font-semibold">
                        SGST: {item.sgst}%
                        <div className="text-gray-400">CGST: {item.cgst}%</div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs font-bold text-green-700">₹{item.mrp.toFixed(2)}</div>
                        <div className="text-[10px] text-green-600">Unit: ₹{item.perUnitRateWithGst.toFixed(2)}</div>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-gray-500">{item.hsn || '-'}</td>
                      <td className="p-3 text-center font-bold text-orange-700 bg-orange-50/50 rounded-xl">{item.thresholdMedicineNumber}</td>
                      <td className="p-3 font-bold text-gray-900 text-right">₹{item.amount.toFixed(2)}</td>
                      <td className="p-3 pr-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${stat.colorClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${stat.badgeColor}`}></span>
                          {stat.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Foot */}
        {pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-orange-100 bg-orange-50/20">
            <span className="text-xs text-gray-500">
              Showing Page <b>{page}</b> of <b>{pages}</b> (Total {total} records)
            </span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1} 
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-orange-200 hover:bg-orange-50 disabled:opacity-50 disabled:hover:bg-white flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))} 
                disabled={page === pages} 
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-orange-200 hover:bg-orange-50 disabled:opacity-50 disabled:hover:bg-white flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      {selectedMedForHistory && (
        <MedicineHistoryModal
          itemName={selectedMedForHistory}
          onClose={() => setSelectedMedForHistory(null)}
        />
      )}
    </div>
  );
};




// ==================== EXPIRY MEDICINES VIEW ====================
const ExpiryMedicinesView = () => {
  const [activeTab, setActiveTab] = useState('near'); // near | expired
  const [expired, setExpired] = useState([]);
  const [nearExpiry, setNearExpiry] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadExpiryData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/pharmacy/inventory/expiry');
      setExpired(data.expired || []);
      setNearExpiry(data.nearExpiry || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load expiry warning lists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpiryData();
  }, [loadExpiryData]);

  // Expiry details calculation
  const getDaysRemainingStr = (expiryDateStr) => {
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-red-600 font-extrabold">
          Expired {Math.abs(diffDays)} days ago
        </span>
      );
    } else if (diffDays === 0) {
      return <span className="text-red-500 font-black">Expires today!</span>;
    } else {
      return (
        <span className="text-orange-600 font-bold">
          Expiring in {diffDays} days
        </span>
      );
    }
  };

  const currentList = activeTab === 'near' ? nearExpiry : expired;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Expiry Tabs */}
      <div className="flex border-b border-orange-200 gap-1.5">
        <button 
          onClick={() => setActiveTab('near')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'near' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Near Expiry Medicines (Next 30 Days)
          {nearExpiry.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px]">
              {nearExpiry.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'expired' 
              ? 'border-red-500 text-red-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Expired Medicines
          {expired.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px]">
              {expired.length}
            </span>
          )}
        </button>
      </div>

      {/* List Card */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3 pl-4">Item Name</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3 pr-4">Days Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8">
                    <SkeletonTable rows={4} columns={5} className="w-full" />
                  </td>
                </tr>
              ) : currentList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    <Check className="h-8 w-8 mx-auto mb-2 text-green-500 bg-green-50 border border-green-200 rounded-full p-1.5" />
                    <p className="font-bold">No medicines found in this list</p>
                    <p className="text-xs">Congratulations, your pharmacy is in top shape!</p>
                  </td>
                </tr>
              ) : (
                currentList.map(item => (
                  <tr key={item._id} className="hover:bg-orange-50/10">
                    <td className="p-3 pl-4 font-bold text-gray-800">{item.itemName}</td>
                    <td className="p-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-xs border border-gray-200">{item.batch}</span></td>
                    <td className="p-3 font-bold text-gray-800">{item.quantity}</td>
                    <td className="p-3 font-semibold text-gray-600">{new Date(item.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</td>
                    <td className="p-3 pr-4">{getDaysRemainingStr(item.expiry)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== OUT OF STOCK VIEW ====================
const OutOfStockView = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOutOfStock = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/pharmacy/inventory/out-of-stock');
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load out of stock list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOutOfStock();
  }, [loadOutOfStock]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4 bg-yellow-50 border-yellow-100 flex items-center gap-3">
        <AlertTriangle className="text-yellow-600 h-6 w-6" />
        <div className="text-xs">
          <p className="font-bold text-yellow-800">Dynamic Out of Stock & Low Stock Alert</p>
          <p className="text-yellow-600 font-semibold mt-0.5">Medicines in this list have fallen below their configured safety threshold and should be reordered immediately.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3 pl-4">Item Name</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3 text-red-600">Current Qty (Units)</th>
                <th className="p-3 text-yellow-700">Safety Threshold</th>
                <th className="p-3">MRP</th>
                <th className="p-3 pr-4">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8">
                    <SkeletonTable rows={4} columns={6} className="w-full" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <Check className="h-8 w-8 mx-auto mb-2 text-green-500 bg-green-50 border border-green-200 rounded-full p-1.5" />
                    <p className="font-bold">No out of stock medicines</p>
                    <p className="text-xs">All medicines are currently above their configured safety stock thresholds.</p>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item._id} className="hover:bg-orange-50/10">
                    <td className="p-3 pl-4 font-bold text-gray-800">{item.itemName}</td>
                    <td className="p-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-xs border border-gray-200">{item.batch}</span></td>
                    <td className="p-3 font-extrabold text-red-655">{item.quantityUnits}</td>
                    <td className="p-3 font-extrabold text-yellow-600">{item.thresholdMedicineNumber}</td>
                    <td className="p-3 font-bold text-gray-700">₹{item.mrp.toFixed(2)}</td>
                    <td className="p-3 pr-4 font-semibold text-gray-600">{new Date(item.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== DOCTOR REQUESTS VIEW ====================
const RequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'pending-requirements'
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Verification state / approval state when processing a request
  const [reviewItems, setReviewItems] = useState([]); // Array of { itemName, approvedQty, batch, isRejected }
  const [batchesMap, setBatchesMap] = useState({}); // Mapping of itemName -> Array of batches in inventory
  const [remarks, setRemarks] = useState('');
  const [issuedTo, setIssuedTo] = useState('Nurse');
  const [verifyReturnItems, setVerifyReturnItems] = useState([]); // Array of { itemName, returnAccepted }
  const [remainingItems, setRemainingItems] = useState([]); // Array of { itemName, batch }

  // Action loading states
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await client.get(`/pharmacy/requests?${params.toString()}`);
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Load batches for review or remaining items when selectedRequest changes
  useEffect(() => {
    if (!selectedRequest) return;
    
    // Initialize review items state or return verification state
    if (selectedRequest.status === 'Pending') {
      const initialReview = selectedRequest.items.map(item => ({
        itemName: item.itemName,
        requestedQty: item.requestedQty,
        approvedQty: item.requestedQty,
        batch: item.isCustom ? 'CUSTOM' : '',
        isRejected: false,
        isCustom: item.isCustom || false,
        isAvailable: true,
        unitPrice: '',
        gst: ''
      }));
      setReviewItems(initialReview);
      setRemarks('');

      // Fetch batches for standard items only
      selectedRequest.items.forEach(item => {
        if (!item.isCustom) {
          fetchBatchesForItem(item.itemName);
        }
      });
    } else if (selectedRequest.status === 'Return Sent' || selectedRequest.status === 'Return Requested') {
      const initialReturns = selectedRequest.items
        .filter(item => item.returnedQty > 0)
        .map(item => ({
          itemName: item.itemName,
          returnedQty: item.returnedQty,
          returnAccepted: true
        }));
      setVerifyReturnItems(initialReturns);
      setRemarks('');
    } else if (['Partially Approved', 'Issued', 'Return Accepted', 'Return Rejected'].includes(selectedRequest.status)) {
      const initialRemaining = selectedRequest.items
        .filter(item => item.pendingQty > 0)
        .map(item => ({
          itemName: item.itemName,
          pendingQty: item.pendingQty,
          batch: item.batch || ''
        }));
      setRemainingItems(initialRemaining);

      // Fetch batches for pending items
      initialRemaining.forEach(item => {
        if (!item.isCustom) {
          fetchBatchesForItem(item.itemName);
        }
      });
    }
  }, [selectedRequest]);

  const fetchBatchesForItem = async (itemName) => {
    try {
      const { data } = await client.get(`/pharmacy/inventory?limit=50&search=${encodeURIComponent(itemName)}`);
      // Exact matching case-insensitive
      const matches = data.items.filter(it => it.itemName.toLowerCase() === itemName.toLowerCase() && it.quantity > 0);
      setBatchesMap(prev => ({ ...prev, [itemName]: matches }));
    } catch (e) {
      console.error("Failed to fetch batches for", itemName, e);
    }
  };

  const handleReviewSubmit = async () => {
    // Validate batches for approved items
    for (const item of reviewItems) {
      if (!item.isRejected && item.isAvailable !== false && item.approvedQty > 0) {
        if (!item.isCustom && !item.batch) {
          toast.error(`Please select a batch for ${item.itemName}`);
          return;
        }
        if (item.isCustom && (!item.unitPrice || parseFloat(item.unitPrice) < 0)) {
          toast.error(`Please enter a valid price for custom item ${item.itemName}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await client.put(`/pharmacy/requests/${selectedRequest._id}/review`, {
        items: reviewItems,
        remarks
      });
      toast.success('Request reviewed and approved successfully');
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueSubmit = async () => {
    if (!issuedTo) {
      toast.error('Please specify who you are issuing stock to.');
      return;
    }
    setSubmitting(true);
    try {
      await client.post(`/pharmacy/requests/${selectedRequest._id}/issue`, {
        issuedTo,
        remarks
      });
      toast.success('Stock items issued successfully!');
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyReturnSubmit = async () => {
    setSubmitting(true);
    try {
      await client.post(`/pharmacy/requests/${selectedRequest._id}/return-received`, {
        items: verifyReturnItems,
        remarks
      });
      toast.success('Returns verified and stock updated!');
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify returns');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueRemainingSubmit = async () => {
    // Validate batches
    for (const item of remainingItems) {
      if (item.pendingQty > 0 && !item.batch) {
        toast.error(`Please select a batch for pending item ${item.itemName}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await client.post(`/pharmacy/requests/${selectedRequest._id}/issue-remaining`, {
        items: remainingItems
      });
      toast.success('Remaining pending items issued successfully!');
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue remaining quantities');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSubmit = async () => {
    setSubmitting(true);
    try {
      await client.post(`/pharmacy/requests/${selectedRequest._id}/complete`);
      toast.success('Request marked completed. Billing updated!');
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete request');
    } finally {
      setSubmitting(false);
    }
  };

  // Group all pending items across all requests (grouped by itemName)
  const getPendingRequirements = () => {
    const requirements = {};
    requests.forEach(req => {
      // only active/non-completed requests
      if (!['Completed', 'Rejected'].includes(req.status)) {
        req.items.forEach(item => {
          if (item.pendingQty > 0) {
            if (!requirements[item.itemName]) {
              requirements[item.itemName] = {
                itemName: item.itemName,
                totalPendingQty: 0,
                affectedRequests: []
              };
            }
            requirements[item.itemName].totalPendingQty += item.pendingQty;
            requirements[item.itemName].affectedRequests.push({
              requestNumber: req.requestNumber,
              pendingQty: item.pendingQty,
              patientName: req.patientId?.patientName || 'Unknown',
              admissionId: req.admissionId?._id
            });
          }
        });
      }
    });
    return Object.values(requirements);
  };

  const pendingRequirements = getPendingRequirements();

  return (
    <div className="space-y-6 animate-fade-in text-gray-700">
      {/* Tab bar */}
      <div className="flex border-b border-orange-200 gap-1.5">
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'list' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Doctor Requests List
          {requests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px]">
              {requests.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('pending-requirements')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'pending-requirements' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Stock Requirements
          {pendingRequirements.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px]">
              {pendingRequirements.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card p-5 space-y-4 bg-white">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by Request #, Procedure or Patient..." 
                  className="input pl-9 text-sm py-2.5" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full md:w-[200px]">
                <select 
                  className="input text-sm py-2.5"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Partially Approved">Partially Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Issued">Issued</option>
                  <option value="Return Requested">Return Requested</option>
                  <option value="Return Accepted">Return Accepted</option>
                  <option value="Return Rejected">Return Rejected</option>
                  <option value="Remaining Items Issued">Remaining Items Issued</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <button 
                onClick={loadRequests}
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 hover:bg-orange-50 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* List Table */}
          <div className="card overflow-hidden bg-white shadow-sm border border-orange-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                    <th className="p-3.5 pl-4">Request #</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Procedure</th>
                    <th className="p-3.5">Requested By</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="p-8">
                        <SkeletonTable rows={4} columns={7} className="w-full" />
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">
                        <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
                        <p className="font-bold">No requests found</p>
                        <p className="text-xs">Select a different status or filter query.</p>
                      </td>
                    </tr>
                  ) : (
                    requests.map(req => (
                      <tr key={req._id} className="hover:bg-orange-50/10 transition">
                        <td className="p-3.5 pl-4 font-mono font-bold text-orange-700">{req.requestNumber}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-gray-800">{req.patientId?.patientName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            UHID: {req.patientId?.uhid ? req.patientId.uhid.replace(/^UHID-/, '') : 'N/A'} | IPD: {req.admissionId?.ipdNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-gray-800">{req.procedureName}</td>
                        <td className="p-3.5 text-xs text-gray-655">
                          Dr. {req.doctorId?.doctorName || req.doctorId?.username}
                        </td>
                        <td className="p-3.5 text-xs text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            req.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                            req.status === 'Partially Approved' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            req.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                            req.status === 'Issued' || req.status === 'Sent' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            req.status === 'Received' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                            req.status === 'Return Sent' || req.status === 'Return Requested' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            req.status === 'Return Received' || req.status === 'Return Accepted' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                            req.status === 'Return Rejected' ? 'bg-pink-100 text-pink-800 border-pink-200' :
                            req.status === 'Remaining Items Issued' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-4 text-center">
                          <button 
                            onClick={() => setSelectedRequest(req)}
                            className="btn py-1.5 px-3 text-xs flex items-center gap-1 mx-auto cursor-pointer shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" /> View & Process
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pending-requirements' && (
        <div className="space-y-4">
          <div className="card p-4 bg-red-50 border border-red-100 text-red-800 flex items-center gap-3">
            <AlertTriangle className="text-red-500 h-6 w-6" />
            <div className="text-xs">
              <p className="font-bold">Pending Stock Requirements Summary</p>
              <p className="mt-0.5">This list shows items requested by doctors that could not be approved due to stock shortages. Restock these items to satisfy active patient requirements.</p>
            </div>
          </div>

          <div className="card overflow-hidden bg-white shadow-sm border border-orange-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                    <th className="p-3.5 pl-4">Item Name</th>
                    <th className="p-3.5 text-red-700">Total Pending Qty</th>
                    <th className="p-3.5 pr-4">Affected Active Requests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {pendingRequirements.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-gray-400">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 bg-green-50 border border-green-200 rounded-full p-1.5" />
                        <p className="font-bold">No pending requirements</p>
                        <p className="text-xs">All active requests have been fully stocked and approved.</p>
                      </td>
                    </tr>
                  ) : (
                    pendingRequirements.map((reqItem, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/10">
                        <td className="p-3.5 pl-4 font-bold text-gray-800">{reqItem.itemName}</td>
                        <td className="p-3.5 font-extrabold text-red-600">{reqItem.totalPendingQty}</td>
                        <td className="p-3.5 pr-4 text-xs">
                          <div className="space-y-1">
                            {reqItem.affectedRequests.map((aff, i) => (
                              <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-1.5 px-2.5 flex items-center justify-between">
                                <span>
                                  Request <b>{aff.requestNumber}</b> ({aff.patientName})
                                </span>
                                <span className="font-bold text-orange-600 font-mono">Qty: {aff.pendingQty}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Details & Process Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full border border-orange-100 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-orange-50 pb-3">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  <ClipboardList className="text-orange-500 h-5 w-5" />
                  Process Doctor Request: {selectedRequest.requestNumber}
                </h2>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  Procedure: {selectedRequest.procedureName}
                </p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Patient & Doctor Information */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-orange-50/20 border border-orange-100 p-4 rounded-2xl text-xs text-gray-700">
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400">Patient Name</span>
                <span className="font-bold text-gray-900 text-sm">{selectedRequest.patientId?.patientName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400">UHID / Admission ID</span>
                <span className="font-mono font-bold text-orange-700">
                  {selectedRequest.patientId?.uhid ? selectedRequest.patientId.uhid.replace(/^UHID-/, '') : 'N/A'} / {selectedRequest.admissionId?.ipdNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400">Consultant / Doctor</span>
                <span className="font-bold text-gray-800">Dr. {selectedRequest.doctorId?.doctorName || selectedRequest.doctorId?.username}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400">Request Date</span>
                <span className="font-semibold text-gray-600">
                  {new Date(selectedRequest.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400">Current Status</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-orange-100 text-orange-850 font-bold border border-orange-200">
                  {selectedRequest.status}
                </span>
              </div>
              {selectedRequest.issuedTo && (
                <div>
                  <span className="block text-[10px] font-bold uppercase text-gray-400">Issued To</span>
                  <span className="font-bold text-gray-800">{selectedRequest.issuedTo}</span>
                </div>
              )}
            </div>

            {/* Action forms based on status */}
            
            {/* Case: Pending - Pharmacist reviews the quantities & matches batches */}
            {selectedRequest.status === 'Pending' && (
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 bg-yellow-50/50 p-3.5 rounded-r-2xl text-xs text-yellow-800">
                  <p className="font-bold">Review & Approve Form</p>
                  <p className="mt-0.5">Approve or reject requested items. Match each approved item to a valid inventory batch with available stock.</p>
                </div>

                <div className="overflow-x-auto border border-orange-100 rounded-2xl">
                  <table className="w-full text-left text-xs text-gray-700">
                    <thead>
                      <tr className="bg-orange-50/30 text-[10px] uppercase font-bold text-gray-500 border-b border-orange-100">
                        <th className="p-3 pl-4">Item Name</th>
                        <th className="p-3">Req Qty</th>
                        <th className="p-3 w-[120px]">Approve Qty</th>
                        <th className="p-3 w-[220px]">Select Batch</th>
                        <th className="p-3 pr-4 text-center">Reject</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {reviewItems.map((item, idx) => (
                        <tr key={idx} className={`hover:bg-orange-50/10 ${item.isRejected || item.isAvailable === false ? 'bg-red-50/25 opacity-70' : ''}`}>
                          <td className="p-3 pl-4 font-bold text-gray-800">
                            {item.itemName}
                            {item.isCustom && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-black text-purple-700 uppercase tracking-wider">
                                Custom Item
                              </span>
                            )}
                            <span className="block text-[9px] font-semibold text-gray-400">
                              {item.isCustom 
                                ? 'Custom request - Set price details' 
                                : (batchesMap[item.itemName]?.length ? `${batchesMap[item.itemName].length} batch(es) found` : 'No available stock in inventory')}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-gray-600">{item.requestedQty}</td>
                          <td className="p-3">
                            <input 
                              type="number" 
                              min="0"
                              max={item.requestedQty}
                              disabled={item.isRejected || item.isAvailable === false}
                              className="input py-1 px-1.5 text-center text-xs w-[80px]"
                              value={item.approvedQty}
                              onChange={(e) => {
                                const val = Math.min(item.requestedQty, Math.max(0, parseInt(e.target.value) || 0));
                                const updated = [...reviewItems];
                                updated[idx].approvedQty = val;
                                setReviewItems(updated);
                              }}
                            />
                          </td>
                          <td className="p-3">
                            {item.isCustom ? (
                              <div className="flex gap-2">
                                <div className="w-[100px]">
                                  <input 
                                    type="number" 
                                    placeholder="Unit Price"
                                    disabled={item.isRejected || item.isAvailable === false}
                                    className="input py-1 px-1.5 text-xs font-semibold"
                                    value={item.unitPrice}
                                    onChange={(e) => {
                                      const updated = [...reviewItems];
                                      updated[idx].unitPrice = e.target.value;
                                      setReviewItems(updated);
                                    }}
                                  />
                                </div>
                                <div className="w-[85px]">
                                  <input 
                                    type="number" 
                                    placeholder="GST %"
                                    disabled={item.isRejected || item.isAvailable === false}
                                    className="input py-1 px-1.5 text-xs font-semibold"
                                    value={item.gst}
                                    onChange={(e) => {
                                      const updated = [...reviewItems];
                                      updated[idx].gst = e.target.value;
                                      setReviewItems(updated);
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <select
                                disabled={item.isRejected}
                                className="input py-1 text-xs font-semibold"
                                value={item.batch}
                                onChange={(e) => {
                                  const updated = [...reviewItems];
                                  updated[idx].batch = e.target.value;
                                  setReviewItems(updated);
                                }}
                              >
                                <option value="">-- Match Batch --</option>
                                {batchesMap[item.itemName]?.map(b => (
                                  <option key={b.batch} value={b.batch}>
                                    {b.batch} (Qty: {b.quantity} | mrp: ₹{b.mrp})
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="p-3 pr-4 text-center">
                            <div className="flex items-center justify-center gap-4">
                              <label className="flex items-center gap-1 font-semibold text-[10px] text-gray-500 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={item.isRejected}
                                  className="rounded border-orange-200 text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const updated = [...reviewItems];
                                    updated[idx].isRejected = checked;
                                    if (checked) {
                                      updated[idx].approvedQty = 0;
                                      updated[idx].batch = '';
                                    } else {
                                      updated[idx].approvedQty = item.requestedQty;
                                      if (item.isCustom) updated[idx].batch = 'CUSTOM';
                                    }
                                    setReviewItems(updated);
                                  }}
                                />
                                Reject
                              </label>

                              {item.isCustom && (
                                <label className="flex items-center gap-1 font-semibold text-[10px] text-red-500 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={item.isAvailable === false}
                                    className="rounded border-red-200 text-red-500 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      const updated = [...reviewItems];
                                      updated[idx].isAvailable = !checked;
                                      if (checked) {
                                        updated[idx].approvedQty = 0;
                                        updated[idx].batch = '';
                                      } else {
                                        updated[idx].approvedQty = item.requestedQty;
                                        updated[idx].batch = 'CUSTOM';
                                      }
                                      setReviewItems(updated);
                                    }}
                                  />
                                  Not Available
                                </label>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Remarks / Status Notes</label>
                  <textarea 
                    className="input py-2 text-xs h-[60px]"
                    placeholder="Enter review remarks (e.g. partial stock issued)..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
                  <button 
                    onClick={handleReviewSubmit}
                    disabled={submitting}
                    className="btn py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer disabled:bg-orange-300 shadow-md"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save Review & Approval
                  </button>
                </div>
              </div>
            )}

            {/* Case: Approved or Partially Approved - Issue Stock items to hospital staff */}
            {(selectedRequest.status === 'Approved' || selectedRequest.status === 'Partially Approved') && selectedRequest.items.some(it => it.approvedQty > 0 && it.issuedQty === 0) && (
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 bg-blue-50/50 p-3.5 rounded-r-2xl text-xs text-blue-800">
                  <p className="font-bold">Issue Approved Items Form</p>
                  <p className="mt-0.5">Deduct approved items from inventory stock batches and hand them over to the requesting clinic staff.</p>
                </div>

                {/* Items Summary to be Issued */}
                <div className="overflow-x-auto border border-orange-100 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs text-gray-700">
                    <thead>
                      <tr className="bg-orange-50/30 text-[10px] uppercase font-bold text-gray-500 border-b border-orange-100">
                        <th className="p-2.5 pl-4">Item Name</th>
                        <th className="p-2.5">Requested Qty</th>
                        <th className="p-2.5 text-green-700">Approved Qty</th>
                        <th className="p-2.5 text-blue-700">Batch Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {selectedRequest.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/10">
                          <td className="p-2.5 pl-4 font-bold text-gray-805">{it.itemName}</td>
                          <td className="p-2.5 text-gray-500 font-semibold">{it.requestedQty}</td>
                          <td className="p-2.5 font-bold text-green-705">{it.approvedQty || 0}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-700">{it.batch || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-500">Issued To (Staff Member Category) *</label>
                    <select 
                      className="input py-2 text-xs"
                      value={issuedTo}
                      onChange={(e) => setIssuedTo(e.target.value)}
                    >
                      <option value="Nurse">Nurse</option>
                      <option value="Doctor">Doctor</option>
                      <option value="OT Staff">OT Staff</option>
                      <option value="Department">Department</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-500">Remarks</label>
                    <input 
                      type="text" 
                      className="input py-2 text-xs"
                      placeholder="Optional delivery details..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
                  <button 
                    onClick={handleIssueSubmit}
                    disabled={submitting}
                    className="btn py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer disabled:bg-orange-300 shadow-md"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    Confirm Stock Issuance & Send
                  </button>
                </div>
              </div>
            )}

            {/* Case: Return Requested - Pharmacist verifies doctor returns */}
            {(selectedRequest.status === 'Return Requested' || selectedRequest.status === 'Return Sent') && (
              <div className="space-y-4">
                <div className="border-l-4 border-purple-500 bg-purple-50/50 p-3.5 rounded-r-2xl text-xs text-purple-800">
                  <p className="font-bold">Verify Returned Items Form</p>
                  <p className="mt-0.5">Confirm receipt of unused items from procedure. Accepted returns increase inventory stock levels automatically. Rejected returns are labeled as wasted/damaged.</p>
                </div>

                <div className="overflow-x-auto border border-orange-100 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs text-gray-700">
                    <thead>
                      <tr className="bg-orange-50/30 text-[10px] uppercase font-bold text-gray-500 border-b border-orange-100">
                        <th className="p-2.5 pl-4">Item Name</th>
                        <th className="p-2.5">Issued Qty</th>
                        <th className="p-2.5 text-purple-700">Returned (Unused) Qty</th>
                        <th className="p-2.5 pr-4 text-center w-[120px]">Accept Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {verifyReturnItems.map((item, idx) => {
                        const original = selectedRequest.items.find(it => it.itemName.toLowerCase() === item.itemName.toLowerCase());
                        return (
                          <tr key={idx} className="hover:bg-orange-50/10">
                            <td className="p-2.5 pl-4 font-bold text-gray-850">{item.itemName}</td>
                            <td className="p-2.5 text-gray-600 font-semibold">{original?.issuedQty || 0}</td>
                            <td className="p-2.5 font-bold text-purple-700">{item.returnedQty}</td>
                            <td className="p-2.5 pr-4 text-center">
                              <input 
                                type="checkbox"
                                checked={item.returnAccepted}
                                className="rounded border-orange-200 text-orange-500 focus:ring-orange-500 h-4 w-4"
                                onChange={(e) => {
                                  const updated = [...verifyReturnItems];
                                  updated[idx].returnAccepted = e.target.checked;
                                  setVerifyReturnItems(updated);
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Remarks</label>
                  <input 
                    type="text" 
                    className="input py-2 text-xs"
                    placeholder="Enter return notes..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
                  <button 
                    onClick={handleVerifyReturnSubmit}
                    disabled={submitting}
                    className="btn py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer disabled:bg-orange-300 shadow-md"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save Return Verification
                  </button>
                </div>
              </div>
            )}

            {/* Case: Fulfill Remaining Stock (if applicable and has pending quantities) */}
            {['Partially Approved', 'Issued', 'Return Accepted', 'Return Rejected'].includes(selectedRequest.status) && selectedRequest.items.some(it => it.pendingQty > 0) && (
              <div className="space-y-4 border-t border-dashed border-orange-100 pt-6">
                <div className="border-l-4 border-orange-500 bg-orange-50/50 p-3.5 rounded-r-2xl text-xs text-orange-850">
                  <p className="font-bold">Issue Remaining Pending Stock (Replenished Items)</p>
                  <p className="mt-0.5">Use this form to issue the remaining quantities that were pending stock replenishment.</p>
                </div>

                <div className="overflow-x-auto border border-orange-100 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs text-gray-700">
                    <thead>
                      <tr className="bg-orange-50/30 text-[10px] uppercase font-bold text-gray-500 border-b border-orange-100">
                        <th className="p-2.5 pl-4">Item Name</th>
                        <th className="p-2.5">Issued Qty So Far</th>
                        <th className="p-2.5 text-red-700">Pending Qty</th>
                        <th className="p-2.5 w-[240px]">Select Replenished Batch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {remainingItems.map((item, idx) => {
                        const original = selectedRequest.items.find(it => it.itemName.toLowerCase() === item.itemName.toLowerCase());
                        return (
                          <tr key={idx} className="hover:bg-orange-50/10">
                            <td className="p-2.5 pl-4 font-bold text-gray-805">{item.itemName}</td>
                            <td className="p-2.5 text-gray-600 font-semibold">{original?.issuedQty || 0}</td>
                            <td className="p-2.5 font-bold text-red-650">{item.pendingQty}</td>
                            <td className="p-2.5">
                              <select
                                className="input py-1 text-xs"
                                value={item.batch}
                                onChange={(e) => {
                                  const updated = [...remainingItems];
                                  updated[idx].batch = e.target.value;
                                  setRemainingItems(updated);
                                }}
                              >
                                <option value="">-- Match Replenished Batch --</option>
                                {batchesMap[item.itemName]?.map(b => (
                                  <option key={b.batch} value={b.batch}>
                                    {b.batch} (Qty: {b.quantity} | mrp: ₹{b.mrp})
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2">
                  <button 
                    onClick={handleIssueRemainingSubmit}
                    disabled={submitting}
                    className="btn py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-orange-500 to-amber-500 disabled:from-orange-300 shadow-md"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Fulfill Pending Items
                  </button>
                </div>
              </div>
            )}

            {/* Case: Complete transaction and push billing (if consumption is recorded and returns verified) */}
            {['Issued', 'Return Accepted', 'Return Rejected', 'Remaining Items Issued'].includes(selectedRequest.status) && (
              <div className="space-y-4 border-t border-orange-100 pt-6">
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold">Final Patient Billing Posting</p>
                    <p className="mt-0.5">Consumption record is locked. You can now complete the transaction. This will generate patient pharmacy billing records automatically inside the IPD Medicine tracker.</p>
                  </div>
                  <button 
                    onClick={handleCompleteSubmit}
                    disabled={submitting}
                    className="btn bg-green-600 hover:bg-green-700 text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer disabled:bg-green-400 shrink-0 shadow-md shadow-green-500/10"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Complete & Post Bill
                  </button>
                </div>
              </div>
            )}

            {/* Show Request Items Breakdown for completed/other statuses */}
            {!['Pending'].includes(selectedRequest.status) && (
              <div className="space-y-3">
                <h4 className="font-bold text-gray-805 text-sm">Requested Items Status</h4>
                <div className="overflow-x-auto border border-orange-100 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs text-gray-700">
                    <thead>
                      <tr className="bg-orange-50/20 text-[10px] uppercase font-bold text-gray-500 border-b border-orange-100">
                        <th className="p-2.5 pl-4">Item Name</th>
                        <th className="p-2.5">Requested</th>
                        <th className="p-2.5">Approved</th>
                        <th className="p-2.5">Issued</th>
                        <th className="p-2.5">Used</th>
                        <th className="p-2.5">Returned</th>
                        <th className="p-2.5">Damaged</th>
                        <th className="p-2.5 text-red-600">Pending</th>
                        <th className="p-2.5 text-gray-400">Rejected</th>
                        <th className="p-2.5 pr-4">Batch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {selectedRequest.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/10">
                          <td className="p-2.5 pl-4 font-bold text-gray-805">{it.itemName}</td>
                          <td className="p-2.5 font-semibold text-gray-500">{it.requestedQty}</td>
                          <td className="p-2.5 font-bold text-green-700">{it.approvedQty || 0}</td>
                          <td className="p-2.5 font-bold text-blue-700">{it.issuedQty || 0}</td>
                          <td className="p-2.5 font-bold text-indigo-700">{it.usedQty || 0}</td>
                          <td className="p-2.5 font-bold text-teal-700">{it.returnedQty || 0}</td>
                          <td className="p-2.5 font-bold text-pink-700">{it.damagedQty || 0}</td>
                          <td className="p-2.5 font-bold text-red-600">{it.pendingQty || 0}</td>
                          <td className="p-2.5 font-semibold text-gray-400">{it.rejectedQty || 0}</td>
                          <td className="p-2.5 pr-4 font-mono font-bold text-gray-500">{it.batch || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Timeline */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-805 text-sm">Chronological Audit Trail</h4>
              <div className="relative border-l-2 border-orange-100 pl-4 space-y-4">
                {selectedRequest.auditTrail.map((log, idx) => (
                  <div key={idx} className="relative text-xs">
                    <span className="absolute -left-[22px] top-1 bg-orange-500 h-2.5 w-2.5 rounded-full border border-white"></span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-850">{log.action}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ({new Date(log.timestamp).toLocaleString('en-IN')})
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">by {log.performedByName}</p>
                    {log.remarks && <p className="text-gray-500 mt-1 italic">{log.remarks}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Close buttons */}
            <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== OPD PRESCRIPTIONS VIEW ====================
const OpdPrescriptionsView = ({ changeSection, setSelectedPrescription }) => {
  const [search, setSearch] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/pharmacy/billing/prescriptions?search=${encodeURIComponent(search)}`);
      setPrescriptions(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to search prescriptions');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleSelectPrescription = (pres) => {
    setSelectedPrescription(pres);
    changeSection('new-bill');
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-700">
      <div className="card p-5 space-y-4">
        <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
          <Search className="text-orange-500 h-4.5 w-4.5" />
          Search OPD Prescriptions
        </h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by UHID, Patient Name, Mobile or OPD Reg Number..." 
              className="input pl-9 text-sm py-2.5" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPrescriptions()}
            />
          </div>
          <button 
            onClick={fetchPrescriptions}
            className="btn py-2.5 px-6 text-xs flex items-center gap-1.5 cursor-pointer font-bold shadow-md shadow-orange-500/10"
          >
            Search
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500 mb-2" />
            Searching prescriptions...
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-gray-400">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-orange-500 opacity-55" />
            <p className="font-bold text-gray-600">No prescriptions found</p>
            <p className="text-xs max-w-sm mx-auto mt-1">Please make sure the doctor has completed the consultation and prescribed medicines in the OPD module.</p>
          </div>
        ) : (
          prescriptions.map((pres) => (
            <div 
              key={pres._id} 
              className="card p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-orange-100/50 bg-gradient-to-br from-white to-orange-50/10"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-orange-50 pb-3">
                  <div>
                    <h4 className="font-black text-gray-800 text-base">{pres.patientDetails?.patientName}</h4>
                    <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      UHID: {pres.patientDetails?.uhid ? pres.patientDetails.uhid.replace(/^UHID-/, '') : 'N/A'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-55 px-2 py-0.5 rounded">
                    {pres.patientDetails?.gender || 'N/A'}, {pres.patientDetails?.age || 'N/A'} yrs
                  </span>
                </div>

                {/* Info Table */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Consulting Doctor</span>
                    <span className="font-bold text-gray-850">Dr. {pres.doctorName}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">OPD Reg Number</span>
                    <span className="font-mono font-bold text-gray-700">{pres.opdRegistrationNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Prescription Date</span>
                    <span className="font-semibold text-gray-655">{new Date(pres.consultationDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Medicines List */}
                <div className="space-y-2 border-t border-orange-50 pt-3">
                  <h5 className="font-extrabold text-[10px] text-orange-500 uppercase tracking-wider">Prescribed Medicines ({pres.prescriptionDetails.medicines.length})</h5>
                  <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-orange-50/30">
                    {pres.prescriptionDetails.medicines.map((med, idx) => (
                      <div key={idx} className="text-xs pt-1.5 first:pt-0">
                        <div className="font-bold text-gray-855">
                          {med.medicine || med.medicineName} {med.strength && `(${med.strength})`}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Form: {med.dosageForm || 'Tablet'} | Dose: {med.dose || med.dosage || '1'} | Dur: {med.duration || '-'} | Freq: {med.morning !== undefined ? `${med.morning ? '1' : '0'}-${med.afternoon ? '1' : '0'}-${med.night ? '1' : '0'}` : (med.frequency || '-')} | Qty: {med.qty !== undefined ? med.qty : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleSelectPrescription(pres)}
                className="btn py-2 px-4 text-xs font-bold w-full mt-6 shadow-md shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" /> Load & Bill Prescription
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ==================== NEW BILL VIEW ====================
const NewBillView = ({ isWalkIn = false, selectedPrescription = null, clearPrescription = () => {} }) => {
  const [settings, setSettings] = useState({ gstEnabled: true });
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Patient / Customer details
  const [patientDetails, setPatientDetails] = useState({ name: '', mobile: '', age: '', gender: '' });
  
  // Medicine Search & Add
  const [medQuery, setMedQuery] = useState('');
  const [medResults, setMedResults] = useState([]);
  const [searchingMeds, setSearchingMeds] = useState(false);
  const [billItems, setBillItems] = useState([]);

  // Billing calculation states
  const [discountPercent, setDiscountPercent] = useState(0); 
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [mixedPayments, setMixedPayments] = useState({ Cash: 0, UPI: 0, Card: 0, BankTransfer: 0 });
  const [paidAmount, setPaidAmount] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Printing State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printedBillId, setPrintedBillId] = useState(null);

  // Load Settings
  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const { data } = await client.get('/pharmacy/billing/settings');
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // GST Mode: 'none' (Without GST), 'default' (With Default GST), 'custom' (With Custom GST %)
  const [gstMode, setGstMode] = useState('default');
  const [customGstRate, setCustomGstRate] = useState(18);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setGstMode(settings.gstEnabled ? 'default' : 'none');
    }
  }, [settings]);

  // Load prescription if provided
  useEffect(() => {
    if (selectedPrescription) {
      setPatientDetails({
        name: selectedPrescription.patientDetails?.patientName || '',
        mobile: selectedPrescription.patientDetails?.mobile || '',
        age: selectedPrescription.patientDetails?.age || '',
        gender: selectedPrescription.patientDetails?.gender || ''
      });
      
      // Auto pre-load prescription medicines
      preLoadPrescriptionMeds(selectedPrescription.prescriptionDetails?.medicines || []);
    } else {
      setPatientDetails({ name: '', mobile: '', age: '', gender: '' });
      setBillItems([]);
    }
  }, [selectedPrescription]);

  const preLoadPrescriptionMeds = async (medList) => {
    const loadedItems = [];
    const isExpired = (expiryStr) => {
      if (!expiryStr) return false;
      const expiryDate = new Date(expiryStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiryDate <= today;
    };

    for (const med of medList) {
      const medName = med.medicine || med.medicineName;
      if (!medName) continue;

      try {
        const { data } = await client.get(`/pharmacy/inventory?limit=5&search=${encodeURIComponent(medName)}`);
        const stockItems = data.items.filter(it => 
          it.itemName.toLowerCase() === medName.toLowerCase() && 
          (it.quantityUnits || it.quantity) > 0 &&
          !isExpired(it.expiry)
        );

        const presQty = parseFloat(med.qty) !== undefined && !isNaN(parseFloat(med.qty)) ? parseFloat(med.qty) : 1;

        if (stockItems.length > 0) {
          const stock = stockItems[0];
          const unitsPerPack = stock.unitsPerPack || 1;
          const availableQtyUnits = stock.quantityUnits || stock.quantity || 0;
          
          // Calculate packs required for the prescription quantity (med.qty)
          // Billed item.quantity is in packs
          const billQty = unitsPerPack > 0 ? (presQty / unitsPerPack) : presQty;
          const maxAvailablePacks = unitsPerPack > 0 ? (availableQtyUnits / unitsPerPack) : availableQtyUnits;
          const finalQty = Math.max(0.001, parseFloat(Math.min(billQty, maxAvailablePacks).toFixed(3)));

          loadedItems.push({
            itemName: stock.itemName,
            batch: stock.batch,
            expiry: stock.expiry,
            packType: stock.packType || '',
            unitsPerPack: unitsPerPack,
            quantity: finalQty,
            mrp: stock.mrp || 0,
            discount: 0,
            sgst: stock.sgst || 0,
            cgst: stock.cgst || 0,
            rateExGst: stock.rateExGst || 0,
            perUnitRate: stock.perUnitRate || 0,
            perUnitRateWithGst: stock.perUnitRateWithGst || 0,
            availableQtyUnits: availableQtyUnits,
            pack: stock.pack || stock.packType || '0'
          });
        } else {
          loadedItems.push({
            itemName: medName,
            batch: 'NO_STOCK',
            expiry: '',
            packType: '',
            unitsPerPack: 1,
            quantity: presQty,
            mrp: 0,
            discount: 0,
            sgst: 0,
            cgst: 0,
            rateExGst: 0,
            perUnitRate: 0,
            perUnitRateWithGst: 0,
            availableQtyUnits: 0,
            pack: 'N/A'
          });
          toast.error(`No available unexpired stock for prescribed medicine: ${medName}`);
        }
      } catch (err) {
        console.error(err);
      }
    }
    setBillItems(loadedItems);
  };

  // Autocomplete medicine search
  useEffect(() => {
    if (!medQuery.trim()) {
      setMedResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingMeds(true);
      try {
        const { data } = await client.get(`/pharmacy/inventory?limit=10&search=${encodeURIComponent(medQuery)}`);
        setMedResults(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingMeds(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [medQuery]);

  const addMedicineToBill = (stockItem) => {
    const isExpired = (expiryStr) => {
      if (!expiryStr) return false;
      const expiryDate = new Date(expiryStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiryDate <= today;
    };
    if (isExpired(stockItem.expiry)) {
      toast.error("Cannot bill expired medicine.");
      return;
    }

    const unitsPerPack = stockItem.unitsPerPack || 1;
    const availableQtyUnits = stockItem.quantityUnits || stockItem.quantity || 0;

    const existingIdx = billItems.findIndex(it => it.itemName.toLowerCase() === stockItem.itemName.toLowerCase() && it.batch === stockItem.batch);
    if (existingIdx > -1) {
      const updated = [...billItems];
      const newQty = updated[existingIdx].quantity + 1;
      const unitsSold = Math.round(newQty * unitsPerPack);
      if (unitsSold > availableQtyUnits) {
        toast.error('Cannot add more than available stock.');
        return;
      }
      updated[existingIdx].quantity = newQty;
      updated[existingIdx].customRateExGst = undefined;
      setBillItems(updated);
    } else {
      if (availableQtyUnits <= 0) {
        toast.error('Selected batch is out of stock.');
        return;
      }
      setBillItems([
        ...billItems,
        {
          itemName: stockItem.itemName,
          batch: stockItem.batch,
          expiry: stockItem.expiry,
          packType: stockItem.packType || '',
          unitsPerPack: unitsPerPack,
          quantity: 1,
          mrp: stockItem.mrp || 0,
          discount: 0,
          discountType: 'percentage',
          sgst: stockItem.sgst || 0,
          cgst: stockItem.cgst || 0,
          rateExGst: stockItem.rateExGst || 0,
          perUnitRate: stockItem.perUnitRate || 0,
          perUnitRateWithGst: stockItem.perUnitRateWithGst || 0,
          availableQtyUnits: availableQtyUnits,
          pack: stockItem.pack || stockItem.packType || '0'
        }
      ]);
    }
    setMedQuery('');
    setMedResults([]);
  };

  const handleRemoveItem = (idx) => {
    setBillItems(billItems.filter((_, i) => i !== idx));
  };

  const handleQtyChange = (idx, val) => {
    const qty = Math.max(0, parseFloat(val) || 0);
    const updated = [...billItems];
    updated[idx].quantity = qty;
    updated[idx].customRateExGst = undefined;
    setBillItems(updated);
  };

  const handleDiscountChange = (idx, val) => {
    const disc = Math.max(0, parseFloat(val) || 0);
    const updated = [...billItems];
    updated[idx].discount = disc;
    setBillItems(updated);
  };

  const handleDiscountTypeChange = (idx, type) => {
    const updated = [...billItems];
    updated[idx].discountType = type;
    updated[idx].discount = 0;
    setBillItems(updated);
  };

  const handleCustomRateExGstChange = (idx, val) => {
    const rate = Math.max(0, parseFloat(val) || 0);
    const updated = [...billItems];
    updated[idx].customRateExGst = rate;
    setBillItems(updated);
  };

  const handleCustomSgstChange = (idx, val) => {
    const rate = Math.min(100, Math.max(0, parseFloat(val) || 0));
    const updated = [...billItems];
    updated[idx].sgst = rate;
    setBillItems(updated);
  };

  const handleCustomCgstChange = (idx, val) => {
    const rate = Math.min(100, Math.max(0, parseFloat(val) || 0));
    const updated = [...billItems];
    updated[idx].cgst = rate;
    setBillItems(updated);
  };

  // Perform Calculations
  const calculateBillTotals = () => {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    let grandTotal = 0;

    const itemsCalculated = billItems.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const unitsPerPack = parseInt(item.unitsPerPack) || 1;
      const totalUnits = Math.round(qty * unitsPerPack);
      
      const perUnitRate = parseFloat(item.perUnitRate) || 0;
      const perUnitRateWithGst = parseFloat(item.perUnitRateWithGst) || 0;

      // Base Rate Ex GST calculation
      let baseRateExGst = totalUnits * perUnitRate;
      if (gstMode === 'custom' && item.customRateExGst !== undefined) {
        baseRateExGst = item.customRateExGst;
      }

      // GST Rates
      let sgstRate = 0;
      let cgstRate = 0;
      if (gstMode === 'default') {
        sgstRate = parseFloat(item.sgst) || 0;
        cgstRate = parseFloat(item.cgst) || 0;
      } else if (gstMode === 'custom') {
        sgstRate = parseFloat(item.sgst) || 0;
        cgstRate = parseFloat(item.cgst) || 0;
      }

      const gstRate = sgstRate + cgstRate;

      // Row MRP (Inc GST) - calculated forward from base rate ex gst using SGST% + CGST%
      let rowMrp = baseRateExGst * (1 + gstRate / 100);
      if (gstMode === 'none') {
        rowMrp = baseRateExGst;
      }

      // Discount (percentage or amount) applied to rowMrp
      const discVal = parseFloat(item.discount) || 0;
      let discountAmount = 0;
      let discPercent = 0;
      if (item.discountType === 'amount') {
        discountAmount = Math.min(rowMrp, discVal);
        discPercent = rowMrp > 0 ? (discountAmount / rowMrp) * 100 : 0;
      } else {
        discPercent = Math.min(100, discVal);
        discountAmount = rowMrp * (discPercent / 100);
      }

      // Row Total (Net payable inclusive of GST)
      const rowTotal = rowMrp - discountAmount;

      // Back-calculate taxable base and GST amount from net total
      let taxableAmount = rowTotal;
      let gstAmt = 0;
      if (gstMode !== 'none') {
        taxableAmount = rowTotal / (1 + gstRate / 100);
        gstAmt = rowTotal - taxableAmount;
      }

      // Accumulators
      if (gstMode === 'none') {
        subTotal += baseRateExGst;
      } else {
        subTotal += rowMrp;
      }
      totalDiscount += discountAmount;
      totalGst += gstAmt;
      grandTotal += rowTotal;

      const savedUnitPrice = gstMode === 'none' ? perUnitRate : (totalUnits > 0 ? (rowMrp / totalUnits) : perUnitRateWithGst);
      const unitRateExGst = totalUnits > 0 ? (baseRateExGst / totalUnits) : perUnitRate;

      return {
        ...item,
        unitPrice: savedUnitPrice,
        gstPercentage: gstRate,
        gstAmount: gstAmt,
        amount: rowTotal,
        discountPercentageCalculated: discPercent,
        discountAmount,
        unitRateExGst,
        
        totalUnits,
        baseRateExGst,
        rowMrp,
        sgstRate,
        cgstRate
      };
    });

    return {
      itemsCalculated,
      subTotal,
      discount: totalDiscount,
      gstAmount: totalGst,
      grandTotal
    };
  };

  const totals = calculateBillTotals();

  // Payment method and status sync
  useEffect(() => {
    if (paymentMethod !== 'Mixed Payment') {
      setPaidAmount(totals.grandTotal);
    } else {
      const sum = Object.values(mixedPayments).reduce((s, a) => s + (parseFloat(a) || 0), 0);
      setPaidAmount(sum);
    }
  }, [paymentMethod, totals.grandTotal, mixedPayments]);

  const handleMixedPaymentChange = (method, val) => {
    const updated = { ...mixedPayments, [method]: Math.max(0, parseFloat(val) || 0) };
    setMixedPayments(updated);
  };

  const getPaymentStatus = () => {
    if (paidAmount >= totals.grandTotal) return 'Paid';
    if (paidAmount > 0) return 'Partially Paid';
    return 'Unpaid';
  };

  const paymentStatus = getPaymentStatus();

  const handleSaveBill = async () => {
    if (billItems.length === 0) {
      toast.error('Please add at least one medicine.');
      return;
    }

    const isExpired = (expiryStr) => {
      if (!expiryStr) return false;
      const expiryDate = new Date(expiryStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiryDate <= today;
    };

    for (const item of billItems) {
      if (item.batch === 'NO_STOCK') {
        toast.error(`Please resolve missing stock for ${item.itemName}`);
        return;
      }
      if (isNaN(item.quantity) || item.quantity <= 0) {
        toast.error(`Please enter a valid positive quantity for ${item.itemName}`);
        return;
      }
      if (isExpired(item.expiry)) {
        toast.error(`Cannot bill expired medicine: ${item.itemName} (Batch: ${item.batch})`);
        return;
      }
      const unitsPerPack = item.unitsPerPack || 1;
      const unitsSoldExact = item.quantity * unitsPerPack;
      if (Math.abs(unitsSoldExact - Math.round(unitsSoldExact)) > 1e-5) {
        toast.error(`Invalid quantity for ${item.itemName}. Quantity must correspond to whole units (e.g. multiples of ${(1 / unitsPerPack).toFixed(3)}).`);
        return;
      }
      const unitsSold = Math.round(unitsSoldExact);
      if (unitsSold > item.availableQtyUnits) {
        toast.error(`Insufficient stock for ${item.itemName}. Available: ${item.availableQtyUnits} units, Requested: ${unitsSold} units`);
        return;
      }
      if (gstMode === 'custom') {
        if (item.sgst < 0 || item.sgst > 100 || item.cgst < 0 || item.cgst > 100) {
          toast.error(`Please enter valid GST percentages (0-100) for ${item.itemName}`);
          return;
        }
      }
    }

    if (!isWalkIn && !selectedPrescription) {
      toast.error('Invalid OPD prescription flow. Please select an OPD Prescription first.');
      return;
    }

    if (isWalkIn && (!patientDetails.name || !patientDetails.mobile)) {
      toast.error('Please enter walk-in customer name and mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        prescriptionId: selectedPrescription?._id || null,
        patientId: selectedPrescription?.patientDetails?._id || null,
        customerDetails: isWalkIn ? {
          name: patientDetails.name,
          mobile: patientDetails.mobile,
          age: parseInt(patientDetails.age) || null,
          gender: patientDetails.gender
        } : null,
        doctorId: selectedPrescription?.patientId ? selectedPrescription.doctorId?._id : null,
        doctorName: selectedPrescription ? selectedPrescription.doctorName : 'Walk-in Consultation',
        items: totals.itemsCalculated.map(it => ({
          ...it,
          discount: it.discountPercentageCalculated,
          discountType: it.discountType,
          discountValue: it.discount,
          unitRateExGst: it.unitRateExGst,
          baseRateExGst: it.customRateExGst !== undefined ? it.customRateExGst : it.baseRateExGst,
          sgst: it.sgstRate,
          cgst: it.cgstRate
        })),
        subTotal: totals.subTotal,
        discount: totals.discount,
        gstAmount: totals.gstAmount,
        grandTotal: totals.grandTotal,
        paidAmount,
        paymentMethod,
        mixedPayments: paymentMethod === 'Mixed Payment' ? Object.entries(mixedPayments).map(([method, amount]) => ({ method, amount })) : [],
        paymentStatus,
        remarks
      };

      const { data } = await client.post('/pharmacy/billing/bills', payload);
      toast.success('Bill generated and inventory updated successfully!');
      
      // Clear states
      setBillItems([]);
      setPatientDetails({ name: '', mobile: '', age: '', gender: '' });
      clearPrescription();
      setRemarks('');

      // Open Print Modal
      setPrintedBillId(data.bill._id);
      setShowPrintModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-700">
      
      {/* Top Row: Patient Info (2/3 width) and GST Settings (1/3 width) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Patient header info */}
        <div className="md:col-span-2 card p-6 bg-gradient-to-br from-white to-orange-50/10 border-orange-100 space-y-4">
          <div className="flex justify-between items-center border-b border-orange-50 pb-2">
            <h3 className="font-extrabold text-gray-805 text-sm flex items-center gap-2">
              <User className="text-orange-500 h-4.5 w-4.5" />
              {isWalkIn ? 'Walk-in Customer Details' : 'OPD Patient Information'}
            </h3>
            {!isWalkIn && selectedPrescription && (
              <button 
                onClick={clearPrescription}
                className="text-xs font-bold text-red-500 hover:text-red-750 flex items-center gap-1 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> Clear Prescription
              </button>
            )}
          </div>

          {isWalkIn ? (
            <div className="grid gap-4 sm:grid-cols-4 text-xs">
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-gray-550">Customer Name *</label>
                <input 
                  type="text" 
                  className="input py-2 text-xs" 
                  placeholder="e.g. Rahul Sharma"
                  value={patientDetails.name}
                  onChange={(e) => setPatientDetails({ ...patientDetails, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-550">Mobile Number *</label>
                <input 
                  type="text" 
                  className="input py-2 text-xs" 
                  placeholder="e.g. 9876543210"
                  value={patientDetails.mobile}
                  onChange={(e) => setPatientDetails({ ...patientDetails, mobile: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-550">Age / Gender</label>
                <div className="flex gap-1">
                  <input 
                    type="number" 
                    placeholder="Age" 
                    className="input py-2 text-xs w-[60px]" 
                    value={patientDetails.age}
                    onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                  />
                  <select 
                    className="input py-2 text-xs"
                    value={patientDetails.gender}
                    onChange={(e) => setPatientDetails({ ...patientDetails, gender: e.target.value })}
                  >
                    <option value="">Sex</option>
                    <option value="Male">M</option>
                    <option value="Female">F</option>
                    <option value="Other">O</option>
                  </select>
                </div>
              </div>
            </div>
          ) : selectedPrescription ? (
            <div className="grid gap-4 sm:grid-cols-4 text-xs">
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400">Patient Name</span>
                <span className="font-extrabold text-gray-905 text-sm">{selectedPrescription.patientDetails?.patientName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400">UHID / OPD Reg #</span>
                <span className="font-mono font-bold text-orange-700 bg-orange-50/50 px-2 py-0.5 rounded border border-orange-100">
                  {selectedPrescription.patientDetails?.uhid ? selectedPrescription.patientDetails.uhid.replace(/^UHID-/, '') : 'N/A'} / {selectedPrescription.opdRegistrationNumber}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400">Prescribing Doctor</span>
                <span className="font-bold text-gray-800">Dr. {selectedPrescription.doctorName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400">Gender, Age</span>
                <span className="font-semibold text-gray-750">
                  {selectedPrescription.patientDetails?.gender || 'N/A'}, {selectedPrescription.patientDetails?.age || 'N/A'} Yrs
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-orange-200 text-center rounded-2xl text-xs text-orange-655 bg-orange-50/20 font-semibold">
              No prescription loaded. Go to the OPD Prescriptions tab to fetch doctor orders, or switch to Walk-in Billing.
            </div>
          )}
        </div>

        {/* GST Options Panel */}
        <div className="card p-5 bg-white border border-orange-100/70 flex flex-col justify-between space-y-3">
          <div className="text-xs">
            <p className="font-extrabold text-gray-805">GST Invoice Settings</p>
            <p className="text-[10px] text-gray-450 font-semibold mt-0.5">Toggle tax calculations for this specific bill.</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setGstMode('none')}
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold border transition text-left ${
                gstMode === 'none'
                  ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/10'
                  : 'bg-red-50/10 text-red-650 border-red-100 hover:bg-red-50/30'
              }`}
            >
              Without GST (No Tax)
            </button>
            <button
              type="button"
              onClick={() => setGstMode('default')}
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold border transition text-left ${
                gstMode === 'default'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/10'
                  : 'bg-orange-50/10 text-orange-655 border-orange-100 hover:bg-orange-50/30'
              }`}
            >
              With Default GST (Inventory Rates)
            </button>
            <button
              type="button"
              onClick={() => setGstMode('custom')}
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold border transition text-left ${
                gstMode === 'custom'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                  : 'bg-indigo-50/10 text-indigo-655 border-indigo-100 hover:bg-indigo-50/30'
              }`}
            >
              With Custom GST %
            </button>
          </div>

          {/* Custom GST Input Field */}
          {gstMode === 'custom' && (
            <div className="p-2.5 bg-indigo-50/30 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs animate-fade-in mt-2">
              <span className="font-extrabold text-indigo-950 text-[10px]">Custom GST:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input py-1 px-2 text-center text-xs w-[60px] border-indigo-200 focus:border-indigo-500"
                  value={customGstRate}
                  onChange={(e) => setCustomGstRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                />
                <span className="font-bold text-indigo-955">%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle Row: Medicine Search Box (Full Width) */}
      <div className="card p-5 space-y-4 bg-white border border-orange-100/70">
        <div className="relative">
          <label className="text-xs font-bold text-gray-500 mb-1.5 block">Search & Add Medicines from Inventory</label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Type medicine name or batch code..." 
              className="input pl-10 text-sm py-3" 
              value={medQuery}
              onChange={(e) => setMedQuery(e.target.value)}
            />
          </div>
          
          {/* Search results dropdown */}
          {medQuery.trim() && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-orange-100 shadow-2xl rounded-2xl overflow-hidden divide-y divide-orange-50 max-h-[300px] overflow-y-auto">
              {searchingMeds ? (
                <div className="p-4 text-xs text-center text-gray-400 flex justify-center items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> Searching database...
                </div>
              ) : medResults.length === 0 ? (
                <div className="p-4 text-xs text-center text-gray-400 font-bold">
                  No matching medicines in stock.
                </div>
              ) : (
                medResults.map(item => (
                  <div 
                    key={item._id}
                    onClick={() => addMedicineToBill(item)}
                    className="p-3 text-xs flex justify-between items-center hover:bg-orange-50/50 cursor-pointer transition"
                  >
                    <div>
                      <span className="font-extrabold text-gray-805">{item.itemName}</span>
                      <span className="ml-2 font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        Batch: {item.batch}
                      </span>
                      <span className="ml-2 text-[10px] text-gray-500">Pack: {item.pack}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-green-700">₹{item.mrp.toFixed(2)}</span>
                      <span className={`text-[10px] font-bold ${item.quantity < 50 ? 'text-red-500' : 'text-gray-400'}`}>
                        Stock: {item.quantity} units
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Medicines Added Table (Full Width) */}
      <div className="card overflow-hidden bg-white border border-orange-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100 select-none">
                <th className="p-3 pl-4 w-[50px]">Sno.</th>
                <th className="p-3">Medicine Name</th>
                <th className="p-3">Batch</th>
                <th className="p-3">Expiry</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 w-[100px] text-center">Quantity</th>
                <th className="p-3 text-right">MRP(ex gst)</th>
                {gstMode !== 'none' && (
                  <>
                    <th className="p-3 text-center">CGST %</th>
                    <th className="p-3 text-center">SGST %</th>
                    <th className="p-3 text-right">MRP(Inc gst)</th>
                  </>
                )}
                <th className="p-3 w-[170px] text-center">Discount</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 pr-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {billItems.length === 0 ? (
                <tr>
                  <td colSpan={gstMode !== 'none' ? 14 : 11} className="p-8 text-center text-gray-400">
                    <Pill className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
                    <p className="font-bold text-gray-600">No items added to invoice yet</p>
                    <p className="text-[10px]">Search medicines above to build invoice.</p>
                  </td>
                </tr>
              ) : (
                totals.itemsCalculated.map((item, idx) => {
                  const rowGst = item.gstPercentage;
                  const formattedExpiry = item.expiry ? new Date(item.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }) : '-';

                  return (
                    <tr key={idx} className="hover:bg-orange-50/10">
                      <td className="p-3 pl-4 font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-gray-805">
                        {item.itemName}
                      </td>
                      <td className="p-3">
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                          item.batch === 'NO_STOCK' 
                            ? 'bg-red-50 text-red-650 border-red-100 font-bold' 
                            : 'bg-gray-50 text-gray-700 border-gray-100'
                        }`}>
                          {item.batch}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-gray-600">{formattedExpiry}</td>
                      <td className={`p-3 text-center font-semibold ${item.availableQtyUnits < 50 ? 'text-red-655 font-bold' : 'text-gray-500'}`}>
                        {item.availableQtyUnits} Units
                        <div className="text-[9px] text-gray-400 font-normal">({(item.availableQtyUnits / item.unitsPerPack).toFixed(1)} Packs)</div>
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          step="any"
                          min="0.001"
                          max={item.availableQtyUnits / item.unitsPerPack}
                          className="input py-1 px-1 text-center text-xs w-[80px]"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, e.target.value)}
                        />
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-805">
                        {gstMode === 'custom' ? (
                          <input 
                            type="number" 
                            step="0.01"
                            min="0"
                            className="input py-1 px-1 text-right text-xs w-[80px] border-indigo-200 focus:border-indigo-500"
                            value={item.customRateExGst !== undefined ? item.customRateExGst : item.baseRateExGst}
                            onChange={(e) => handleCustomRateExGstChange(idx, e.target.value)}
                          />
                        ) : (
                          <span>₹{(item.unitRateExGst * item.unitsPerPack).toFixed(2)}</span>
                        )}
                      </td>
                      {gstMode !== 'none' && (
                        <>
                          <td className="p-3 text-center font-semibold">
                            {gstMode === 'custom' ? (
                              <input 
                                type="number" 
                                step="0.1"
                                min="0"
                                max="100"
                                className="input py-1 px-1 text-center text-xs w-[50px] border-indigo-200 focus:border-indigo-500"
                                value={item.cgst}
                                onChange={(e) => handleCustomCgstChange(idx, e.target.value)}
                              />
                            ) : (
                              <span>{item.cgst}%</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-semibold">
                            {gstMode === 'custom' ? (
                              <input 
                                type="number" 
                                step="0.1"
                                min="0"
                                max="100"
                                className="input py-1 px-1 text-center text-xs w-[50px] border-indigo-200 focus:border-indigo-500"
                                value={item.sgst}
                                onChange={(e) => handleCustomSgstChange(idx, e.target.value)}
                              />
                            ) : (
                              <span>{item.sgst}%</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-800">
                            ₹{(item.unitPrice * item.unitsPerPack).toFixed(2)}
                            {gstMode !== 'none' && (
                              <div className="text-[9px] text-gray-400 font-normal">(Tax: ₹{item.gstAmount.toFixed(2)})</div>
                            )}
                          </td>
                        </>
                      )}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input 
                            type="number" 
                            min="0"
                            className="input py-1 px-1 text-center text-xs w-[80px]"
                            value={item.discount}
                            onChange={(e) => handleDiscountChange(idx, e.target.value)}
                          />
                          <select
                            className="input py-1 px-1 text-center text-xs w-[50px] bg-gray-50 border-gray-200"
                            value={item.discountType || 'percentage'}
                            onChange={(e) => handleDiscountTypeChange(idx, e.target.value)}
                          >
                            <option value="percentage">%</option>
                            <option value="amount">₹</option>
                          </select>
                        </div>
                        {item.discountType === 'amount' ? (
                          item.discount > 0 && (
                            <div className="text-[10px] text-red-500 font-semibold mt-0.5">
                              ({item.discountPercentageCalculated?.toFixed(1) || '0'}%)
                            </div>
                          )
                        ) : (
                          item.discountAmount > 0 && (
                            <div className="text-[10px] text-red-500 font-semibold mt-0.5">
                              -₹{item.discountAmount.toFixed(2)}
                            </div>
                          )
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-gray-950">₹{item.amount.toFixed(2)}</td>
                      <td className="p-3 pr-4 text-center">
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Bottom Summary & Checkout Row: responsive 3 columns */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        
        {/* Billing Guide Details */}
        <div className="card p-6 bg-gray-50 border border-orange-100 flex flex-col justify-center text-xs space-y-3.5">
          <h4 className="font-extrabold text-gray-900 text-sm border-b border-orange-100 pb-2 uppercase tracking-wider">
            Billing Guide
          </h4>
          <ul className="list-disc list-inside space-y-2 text-gray-655 font-semibold leading-relaxed">
            <li>Deduction uses unit stock quantities.</li>
            <li>Select <span className="text-orange-600">%</span> or <span className="text-orange-600">₹</span> for item discounts.</li>
            <li>Default GST mode pulls rates from inventory.</li>
            <li>Custom GST allows custom rates and custom Ex-GST base rates.</li>
          </ul>
        </div>

        {/* Calculations summary card */}
        <div className="card p-6 bg-gradient-to-br from-white to-orange-50/10 border-orange-100 flex flex-col justify-between space-y-4">
          <h4 className="font-extrabold text-gray-950 text-sm border-b border-orange-55 pb-2">
            Invoice Summary
          </h4>
          
          <div className="space-y-3 text-xs flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center text-gray-500 font-semibold">
              <span>Sub-Total (MRP Total)</span>
              <span className="font-bold">₹{totals.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-500 font-semibold">
              <span>Item Discounts</span>
              <span className="font-bold text-red-655">- ₹{totals.discount.toFixed(2)}</span>
            </div>
            {gstMode !== 'none' && (
              <div className="flex justify-between items-center text-gray-550 font-semibold">
                <span>GST Tax (Added)</span>
                <span className="font-mono">₹{totals.gstAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-orange-100 pt-3 text-sm text-gray-900 font-black mt-2">
              <span>Grand Total</span>
              <span className="text-lg text-green-700">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payments details */}
        <div className="card p-6 space-y-4 bg-white border border-orange-100 flex flex-col justify-between">
          <h4 className="font-extrabold text-gray-955 text-sm border-b border-orange-100 pb-2 flex items-center gap-1.5">
            <BadgeIndianRupee className="text-orange-500 h-4.5 w-4.5" />
            Payment Settlement
          </h4>

          <div className="space-y-3.5 text-xs flex-1 flex flex-col justify-center">
            <div>
              <label className="mb-1 block font-bold text-gray-500">Payment Method</label>
              <select 
                className="input py-2 text-xs"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Card Swipe</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mixed Payment">Mixed Payment (Split)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-gray-500">Remarks (Optional)</label>
              <input 
                type="text" 
                placeholder="Enter remarks for this bill..." 
                className="input py-2 text-xs"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            {paymentMethod === 'Mixed Payment' ? (
              <div className="space-y-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="font-bold text-gray-555 text-[10px] uppercase">Split Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500">Cash (₹)</label>
                    <input 
                      type="number" 
                      className="input py-1 text-xs" 
                      value={mixedPayments.Cash}
                      onChange={(e) => handleMixedPaymentChange('Cash', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">UPI (₹)</label>
                    <input 
                      type="number" 
                      className="input py-1 text-xs" 
                      value={mixedPayments.UPI}
                      onChange={(e) => handleMixedPaymentChange('UPI', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Card (₹)</label>
                    <input 
                      type="number" 
                      className="input py-1 text-xs" 
                      value={mixedPayments.Card}
                      onChange={(e) => handleMixedPaymentChange('Card', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Bank (₹)</label>
                    <input 
                      type="number" 
                      className="input py-1 text-xs" 
                      value={mixedPayments.BankTransfer}
                      onChange={(e) => handleMixedPaymentChange('BankTransfer', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-green-50/50 p-2.5 rounded-xl border border-green-100">
                <span className="font-bold text-green-850 uppercase text-[10px]">Auto Amount Paid</span>
                <span className="font-bold text-green-700 text-sm">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-orange-50 pt-3">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Paid Amount</span>
                <span className="text-sm font-black text-gray-805">₹{paidAmount.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Due Balance</span>
                <span className={`text-sm font-black ${totals.grandTotal - paidAmount > 0.01 ? 'text-red-655 font-mono' : 'text-green-755'}`}>
                  ₹{Math.max(0, totals.grandTotal - paidAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-850 p-2 rounded-lg border border-orange-100">
              <span>Calculated Status:</span>
              <span>{paymentStatus}</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleSaveBill}
            disabled={submitting}
            className="btn py-3 px-5 text-sm font-bold w-full shadow-lg shadow-orange-500/10 cursor-pointer disabled:bg-orange-300 flex items-center justify-center gap-1.5 mt-4"
          >
            {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Check className="h-4.5 w-4.5" />}
            Generate Bill & Print
          </button>
        </div>
      </div>

      {/* A4 Invoice print modal trigger */}
      {showPrintModal && printedBillId && (
        <InvoicePrintModal billId={printedBillId} onClose={() => { setShowPrintModal(false); setPrintedBillId(null); }} />
      )}
    </div>
  );
};

const InvoicePrintModal = ({ billId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const { data: res } = await client.get(`/pharmacy/billing/bills/${billId}`);
        setData(res);
      } catch (err) {
        toast.error('Failed to load invoice print details');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceDetails();
  }, [billId]);

  useEffect(() => {
    document.body.classList.add('printing-pharmacy-invoice');
    return () => {
      document.body.classList.remove('printing-pharmacy-invoice');
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:static print:bg-transparent no-print-backdrop">
      <div className="bg-white rounded-3xl p-6 max-w-4xl w-full border border-orange-100 shadow-2xl print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full print:static max-h-[95vh] overflow-y-auto print:overflow-visible flex flex-col justify-between">
        
        {/* Modal controls - hidden during printing */}
        <div className="flex justify-between items-center border-b border-orange-50 pb-3 mb-4 print:hidden">
          <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
            <Printer className="text-orange-500 h-4.5 w-4.5" />
            A4 Invoice Print Preview
          </h3>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handlePrint}
              className="btn text-xs py-1.5 px-4 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" /> Print Invoice
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-1.5 px-4 font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Print Layout Area */}
        {loading ? (
          <div className="py-20 text-center flex-1 flex flex-col justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs text-gray-400 mt-2 font-bold">Loading print template...</p>
          </div>
        ) : !data ? (
          <div className="py-20 text-center text-red-500 font-bold flex-1">
            Failed to load invoice data.
          </div>
        ) : (
          <div id="print-area" className="p-6 text-gray-850 font-sans print:p-0">
            {/* Invoice Header */}
            <div className="grid grid-cols-2 border-b border-gray-300 pb-5 mb-5 items-start">
              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-tight">
                  {data.hospitalSettings?.hospitalName || 'HOSPITAL MEDICAL CENTRE'}
                </h1>
                <p className="text-xs text-gray-550 mt-1 whitespace-pre-line max-w-md">
                  {data.hospitalSettings?.address || 'Hospital Address details'}
                </p>
                <p className="text-xs text-gray-550 mt-1 font-semibold">
                  Phone: {data.hospitalSettings?.mobileNumbers?.join(', ') || data.hospitalSettings?.phoneNumber || 'N/A'} | Email: {data.pharmacySetting?.emailAddress || data.hospitalSettings?.emailAddress || 'N/A'}
                </p>
                {data.hospitalSettings?.dlNumber && (
                  <p className="text-xs text-gray-550 mt-1 font-semibold">
                    DL No: {data.hospitalSettings.dlNumber}
                  </p>
                )}
                {data.pharmacySetting?.gstNumber && (
                  <p className="text-[10px] font-mono font-bold text-gray-700 bg-gray-50 border border-gray-150 inline-block px-2 py-0.5 mt-2 rounded">
                    Pharmacy GSTIN: {data.pharmacySetting.gstNumber}
                  </p>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-xl font-extrabold text-orange-600 tracking-wider">PHARMACY INVOICE</h2>
                <div className="mt-4 text-xs space-y-1">
                  <div>
                    <span className="text-gray-450 uppercase font-bold text-[10px]">Invoice No: </span>
                    <span className="font-mono font-bold text-gray-900 text-sm">{data.bill.billNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-450 uppercase font-bold text-[10px]">Bill Date: </span>
                    <span className="font-semibold">{new Date(data.bill.billDate).toLocaleString('en-IN')}</span>
                  </div>
                  {data.bill.prescriptionId && (
                    <div>
                      <span className="text-gray-450 uppercase font-bold text-[10px]">Prescription ID: </span>
                      <span className="font-mono text-gray-655 font-bold">{String(data.bill.prescriptionId).slice(-6).toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Patient & Doctor details */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-200 p-4 rounded-2xl text-xs mb-6">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Billed To</h3>
                {data.bill.patientId ? (
                  <div className="space-y-1">
                    <p className="font-extrabold text-gray-900">{data.bill.patientId.patientName}</p>
                    <p className="text-gray-500 font-mono text-[10px]">UHID: {data.bill.patientId.uhid}</p>
                    <p className="text-gray-500">Gender/Age: {data.bill.patientId.gender}, {data.bill.patientId.dob ? Math.floor((new Date() - new Date(data.bill.patientId.dob)) / 31557600000) : 'N/A'} yrs</p>
                    <p className="text-gray-500">Mob: {data.bill.patientId.mobile}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-extrabold text-gray-900">{data.bill.customerDetails?.name || 'Walk-in Customer'}</p>
                    <p className="text-gray-500">Mob: {data.bill.customerDetails?.mobile || 'N/A'}</p>
                    {data.bill.customerDetails?.age && (
                      <p className="text-gray-500">Age/Sex: {data.bill.customerDetails.age} yrs / {data.bill.customerDetails.gender || 'N/A'}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Referral / Doctor</h3>
                <p className="font-extrabold text-gray-900">Dr. {data.bill.doctorName || 'Walk-in / Direct Referral'}</p>
                {data.bill.doctorId?.department && (
                  <p className="text-gray-500">Dept: {data.bill.doctorId.department}</p>
                )}
                <div className="mt-4 pt-2 border-t border-gray-200/50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mr-2">Payment Status:</span>
                  <span className={`font-bold uppercase ${data.bill.paymentStatus === 'Paid' ? 'text-green-700' : 'text-red-600'}`}>
                    {data.bill.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Medicines details Table */}
            <table className="w-full text-left text-xs mb-6 border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-[10px] font-bold uppercase text-gray-500 bg-gray-50">
                  <th className="p-2.5">SNo.</th>
                  <th className="p-2.5">Medicine Details</th>
                  <th className="p-2.5">Batch</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">MRP(ex gst)</th>
                  <th className="p-2.5 text-center">CGST</th>
                  <th className="p-2.5 text-center">SGST</th>
                  <th className="p-2.5 text-right">MRP(Inc gst)</th>
                  <th className="p-2.5 text-right">Discount</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.bill.items.map((item, idx) => {
                  const itemGst = item.gstPercentage || 0;
                  const sgstPercent = item.sgst !== undefined ? item.sgst : (data.pharmacySetting?.gstEnabled ? itemGst / 2 : 0);
                  const cgstPercent = item.cgst !== undefined ? item.cgst : (data.pharmacySetting?.gstEnabled ? itemGst / 2 : 0);
                  const unitPrice = item.unitPrice || 0;
                  const unitRateExGst = item.unitRateExGst !== undefined 
                    ? item.unitRateExGst 
                    : (unitPrice / (1 + itemGst / 100));
                  const baseRateExGst = item.baseRateExGst !== undefined 
                    ? item.baseRateExGst 
                    : (unitRateExGst * (item.quantity - item.returnedQty) * (item.unitsPerPack || 1));
                  const packMrpExGst = unitRateExGst * (item.unitsPerPack || 1);
                  const packMrpIncGst = unitPrice * (item.unitsPerPack || 1);

                  const discVal = item.discountValue !== undefined ? item.discountValue : item.discount;
                  const discType = item.discountType || 'percentage';
                  let discountStr = '';
                  
                  if (discVal > 0) {
                    if (discType === 'amount') {
                      discountStr = `₹${discVal.toFixed(2)}`;
                    } else {
                      discountStr = `${discVal}%`;
                    }
                  }

                  return (
                    <tr key={idx} className="align-middle">
                      <td className="p-2.5 font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-2.5">
                        <span className={`font-extrabold text-gray-900 ${item.returnedQty === item.quantity ? 'line-through text-red-500' : ''}`}>
                          {item.itemName}
                        </span>
                        {item.returnedQty === item.quantity && (
                          <span className="text-[9px] font-black uppercase text-red-600 bg-red-50 border border-red-200 px-1 py-0.5 rounded ml-2">
                            Fully Returned
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-gray-655 font-bold">{item.batch}</td>
                      <td className="p-2.5 text-center font-bold">
                        <div>{item.quantity - item.returnedQty}</div>
                        {item.returnedQty > 0 && (
                          <div className="text-[9px] font-black text-red-655 uppercase">Ret: {item.returnedQty}</div>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-semibold">₹{packMrpExGst.toFixed(2)}</td>
                      <td className="p-2.5 text-center font-semibold">{cgstPercent}%</td>
                      <td className="p-2.5 text-center font-semibold">{sgstPercent}%</td>
                      <td className="p-2.5 text-right font-semibold">₹{packMrpIncGst.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-semibold">{discountStr || '-'}</td>
                      <td className="p-2.5 text-right font-bold text-gray-950">₹{item.amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Calculations and payment info */}
            <div className="grid grid-cols-2 items-start gap-8 mb-8">
              <div className="space-y-4">
                {data.bill.paymentMethod === 'Mixed Payment' && data.bill.mixedPayments?.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-[10px]">
                    <p className="font-extrabold text-gray-550 uppercase tracking-wide border-b border-gray-200 pb-1 mb-1">Mixed Payment Split</p>
                    <div className="grid grid-cols-2 gap-1 font-semibold text-gray-755">
                      {data.bill.mixedPayments.map((p, i) => (
                        <div key={i} className="flex justify-between pr-2">
                          <span>{p.method}:</span>
                          <span className="font-bold">₹{p.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.pharmacySetting?.termsAndConditions && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-450 uppercase mb-1">Terms & Conditions</h4>
                    <p className="text-[10px] text-gray-500 whitespace-pre-line leading-relaxed italic">{data.pharmacySetting.termsAndConditions}</p>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 space-y-2.5 text-xs text-gray-755">
                <div className="flex justify-between items-center text-gray-500 font-semibold">
                  <span>Gross Total (MRP)</span>
                  <span className="font-bold">₹{data.bill.subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500 font-semibold border-b border-gray-200 pb-2">
                  <span>Total Discount Given</span>
                  <span className="font-bold text-red-600">- ₹{(data.bill.discount || 0).toFixed(2)}</span>
                </div>
                {data.pharmacySetting?.gstEnabled && (
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold">
                    <span>GST Tax Summary</span>
                    <span className="font-mono">₹{data.bill.gstAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black text-gray-900 border-t border-gray-300 pt-2">
                  <span>Grand Total (Net)</span>
                  <span className="text-green-700 text-base">₹{data.bill.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-655 font-bold border-t border-gray-200/50 pt-2">
                  <span>Amount Paid</span>
                  <span>₹{data.bill.paidAmount.toFixed(2)}</span>
                </div>
                {data.bill.balanceAmount > 0.01 && (
                  <div className="flex justify-between items-center text-red-650 font-black">
                    <span>Balance Due Amount</span>
                    <span>₹{data.bill.balanceAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Thank You message */}
            <div className="text-center border-t border-gray-200 pt-6 mt-12 print-footer">
              <p className="text-xs font-bold text-orange-600">Thank you for visiting! Wishing you a speedy recovery.</p>
              <p className="text-[9px] text-gray-450 mt-1 uppercase font-semibold">Billed By: {data.bill.createdBy?.username || data.bill.createdBy || 'Pharmacy Staff'} | COMPUTER GENERATED INVOICE - NO SIGNATURE REQUIRED</p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ==================== SALES HISTORY VIEW ====================
const SalesHistoryView = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (paymentStatus) params.append('paymentStatus', paymentStatus);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const { data } = await client.get(`/pharmacy/billing/bills?${params.toString()}`);
      setBills(data);
    } catch (err) {
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  }, [search, paymentStatus, fromDate, toDate]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handlePrintTrigger = (billId) => {
    setSelectedBillId(billId);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-4 animate-fade-in text-gray-700">
      
      {/* Search Filters */}
      <div className="card p-5 space-y-4 bg-white">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Bill #, Patient Name, Mob or Doctor..." 
              className="input pl-9 text-sm py-2.5" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <select 
                className="input py-2.5 text-xs font-semibold"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="">Payment: All</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <input 
                type="date" 
                className="input py-2 text-xs font-semibold" 
                title="From Date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <input 
                type="date" 
                className="input py-2 text-xs font-semibold" 
                title="To Date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button 
              type="button"
              onClick={fetchBills}
              className="btn py-2.5 text-xs font-bold hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="card overflow-hidden bg-white shadow-sm border border-orange-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700 border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3.5 pl-4">Bill No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Doctor</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-right">Paid Amt</th>
                <th className="p-3.5 text-right">Balance</th>
                <th className="p-3.5 text-center">Method</th>
                <th className="p-3.5 text-center">Payment</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-left">Remarks</th>
                <th className="p-3.5 pr-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="12" className="p-8 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-550 inline mr-2" /> Loading invoices...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="12" className="p-8 text-center text-gray-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
                    <p className="font-bold">No sales records found</p>
                    <p className="text-xs">Adjust search parameters or generate new bills.</p>
                  </td>
                </tr>
              ) : (
                bills.map(b => (
                  <tr key={b._id} className="hover:bg-orange-50/10 transition align-middle">
                    <td className="p-3.5 pl-4 font-mono font-bold text-orange-700">{b.billNumber}</td>
                    <td className="p-3.5 text-xs text-gray-500">
                      {new Date(b.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-gray-800">{b.patientId?.patientName || b.customerDetails?.name || 'Walk-in Customer'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {b.patientId ? `UHID: ${b.patientId.uhid.replace(/^UHID-/, '')}` : `Mob: ${b.customerDetails?.mobile || 'N/A'}`}
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-gray-655 font-semibold">
                      {b.doctorName || 'Walk-in / Direct'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-gray-850">₹{b.grandTotal.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-bold text-green-700">₹{b.paidAmount.toFixed(2)}</td>
                    <td className={`p-3.5 text-right font-bold ${b.balanceAmount > 0.01 ? 'text-red-600' : 'text-green-700'}`}>
                      ₹{b.balanceAmount.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center font-bold text-[10px] text-gray-500">{b.paymentMethod}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        b.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' :
                        b.paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        b.status === 'Active' ? 'bg-green-50 text-green-755 border-green-150' :
                        b.status === 'Returned' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        'bg-orange-100 text-orange-800 border-orange-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-gray-500 max-w-[150px] truncate" title={b.remarks || ''}>
                      {b.remarks || '-'}
                    </td>
                    <td className="p-3.5 pr-4 text-center">
                      <button 
                        type="button"
                        onClick={() => handlePrintTrigger(b._id)}
                        className="btn py-1.5 px-3 text-xs flex items-center gap-1 mx-auto cursor-pointer shadow-sm"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPrintModal && selectedBillId && (
        <InvoicePrintModal billId={selectedBillId} onClose={() => { setShowPrintModal(false); setSelectedBillId(null); }} />
      )}
    </div>
  );
};

// ==================== SALES RETURN VIEW ====================
const SalesReturnView = () => {
  const [billNumber, setBillNumber] = useState('');
  const [foundBill, setFoundBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [returnItems, setReturnItems] = useState([]); 
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLookupBill = async () => {
    if (!billNumber.trim()) {
      toast.error('Please enter a bill number');
      return;
    }
    setLoading(true);
    setFoundBill(null);
    setReturnItems([]);
    try {
      const { data } = await client.get(`/pharmacy/billing/bills?search=${encodeURIComponent(billNumber)}`);
      // Find exact bill number match
      const match = data.find(b => b.billNumber.toLowerCase() === billNumber.trim().toLowerCase());
      if (!match) {
        toast.error(`Invoice ${billNumber} not found.`);
        return;
      }
      
      // Load full details including populate
      const { data: details } = await client.get(`/pharmacy/billing/bills/${match._id}`);
      setFoundBill(details.bill);

      // Initialize returnable quantities
      const initial = details.bill.items
        .filter(it => it.quantity - (it.returnedQty || 0) > 0)
        .map(it => ({
          itemName: it.itemName,
          batch: it.batch,
          maxReturnable: it.quantity - (it.returnedQty || 0),
          quantity: 0,
          returnAccepted: true
        }));

      setReturnItems(initial);
    } catch (err) {
      toast.error('Error searching invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (idx, val) => {
    const qty = Math.max(0, parseFloat(val) || 0);
    const item = returnItems[idx];
    if (qty > item.maxReturnable + 1e-9) {
      toast.error(`Cannot return more than purchased or already-returned quantity: ${item.maxReturnable} packs`);
      return;
    }
    const updated = [...returnItems];
    updated[idx].quantity = qty;
    setReturnItems(updated);
  };

  const handleToggleAccepted = (idx, checked) => {
    const updated = [...returnItems];
    updated[idx].returnAccepted = checked;
    setReturnItems(updated);
  };

  const handleSubmitReturn = async () => {
    const activeReturns = returnItems.filter(it => it.quantity > 0);
    if (activeReturns.length === 0) {
      toast.error('Please enter return quantities for at least one item');
      return;
    }

    setSubmitting(true);
    try {
      await client.post(`/pharmacy/billing/bills/${foundBill._id}/returns`, {
        items: activeReturns,
        remarks
      });
      toast.success('Return processing successful! Inventory stocks updated.');
      
      // Reset
      setFoundBill(null);
      setReturnItems([]);
      setRemarks('');
      setBillNumber('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process sales return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-700">
      
      {/* Lookup Card */}
      <div className="card p-5 space-y-4">
        <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
          <RotateCcw className="text-orange-500 h-4.5 w-4.5" />
          Process Customer Sales Return / Refund
        </h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Enter Pharmacy Invoice Number (e.g. PB-10001)..." 
              className="input pl-9 text-sm py-2.5 font-mono uppercase font-bold" 
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookupBill()}
            />
          </div>
          <button 
            type="button"
            onClick={handleLookupBill}
            disabled={loading}
            className="btn py-2.5 px-6 text-xs flex items-center gap-1.5 cursor-pointer font-bold shadow-md"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup Invoice'}
          </button>
        </div>
      </div>

      {foundBill && (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          
          <div className="space-y-6">
            {/* Bill summary info */}
            <div className="card p-6 bg-gradient-to-br from-white to-orange-50/10 border-orange-100 space-y-4">
              <h4 className="font-black text-gray-900 text-sm border-b border-orange-50 pb-2 uppercase tracking-wide">
                Invoice Information
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Bill Number / Date</span>
                  <span className="font-mono font-bold text-orange-700 text-sm">{foundBill.billNumber}</span>
                  <span className="block text-gray-500 font-semibold">{new Date(foundBill.billDate).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Customer Name</span>
                  <span className="font-bold text-gray-805">
                    {foundBill.patientId?.patientName || foundBill.customerDetails?.name || 'Walk-in Customer'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Grand Invoice Total</span>
                  <span className="text-base font-black text-green-700">₹{foundBill.grandTotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">Current Refund Status</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-850 border border-orange-200 font-bold">
                    {foundBill.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Returns History Logs */}
            <div className="card p-6 space-y-3.5 bg-white">
              <div className="border-b border-orange-50 pb-2">
                <h4 className="font-black text-gray-900 text-xs uppercase tracking-wider">
                  Returns History
                </h4>
              </div>
              {(() => {
                const returnLogs = foundBill.auditTrail?.filter(log => log.action === 'Returns Processed') || [];
                return returnLogs.length === 0 ? (
                  <p className="text-[10px] text-gray-400 font-bold italic">
                    No previous return logs found for this invoice.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {returnLogs.map((log, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-orange-100 bg-orange-50/10 text-[10px] space-y-1">
                        <div className="flex justify-between items-center text-gray-500 font-semibold">
                          <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                          <span className="font-bold text-orange-600">{log.performedByName}</span>
                        </div>
                        <p className="text-gray-700 font-bold leading-relaxed">{log.remarks}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Returns Table & processing form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Returns table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                      <th className="p-3 pl-4">Item Name</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3 text-center">Remaining Returnable</th>
                      <th className="p-3 w-[110px]">Return Qty</th>
                      <th className="p-3 pr-4 text-center">Restock (Accept Stock)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {returnItems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-400 font-bold">
                          All items on this invoice have already been returned.
                        </td>
                      </tr>
                    ) : (
                      returnItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/10 align-middle">
                          <td className="p-3 pl-4 font-bold text-gray-805">{item.itemName}</td>
                          <td className="p-3 font-mono font-bold text-gray-550">{item.batch}</td>
                          <td className="p-3 text-center font-bold text-gray-600">{item.maxReturnable} packs</td>
                          <td className="p-3">
                            <input 
                              type="number" 
                              step="any"
                              min="0"
                              max={item.maxReturnable}
                              className="input py-1 px-1.5 text-center text-xs w-[70px]"
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                            />
                          </td>
                          <td className="p-3 pr-4 text-center">
                            <input 
                              type="checkbox"
                              checked={item.returnAccepted}
                              className="rounded border-orange-200 text-orange-500 focus:ring-orange-500 h-4 w-4"
                              onChange={(e) => handleToggleAccepted(idx, e.target.checked)}
                            />
                            <span className="ml-1 text-[9px] text-gray-400 font-semibold block sm:inline">
                              {item.returnAccepted ? '(Restock)' : '(Discard/Waste)'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Remarks and Save */}
            {returnItems.length > 0 && (
              <div className="card p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Refund Remarks / Reason *</label>
                  <textarea 
                    className="input py-2 text-xs h-[70px]"
                    placeholder="Enter details about why this refund/return is being processed..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                <div className="flex justify-end border-t border-orange-50 pt-4">
                  <button 
                    type="button"
                    onClick={handleSubmitReturn}
                    disabled={submitting}
                    className="btn py-2 px-6 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:bg-orange-300"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Confirm Refund & Restock
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== WORKSPACE STYLING HELPER ====================
const tabClass = (active) =>
  `px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all duration-300 ${
    active
      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
      : 'bg-white hover:bg-orange-50 text-gray-600 border border-orange-100'
  }`;

// ==================== BILLING WORKSPACE ====================
const BillingWorkspace = ({ selectedPrescription, setSelectedPrescription }) => {
  const [mode, setMode] = useState('opd'); // 'opd', 'walk-in', 'ipd', 'manual'

  useEffect(() => {
    if (selectedPrescription) {
      setMode('manual');
    }
  }, [selectedPrescription]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2.5 pb-2 border-b border-orange-50">
        <button type="button" className={tabClass(mode === 'opd')} onClick={() => { setMode('opd'); setSelectedPrescription(null); }}>
          OPD Prescription
        </button>
        <button type="button" className={tabClass(mode === 'walk-in')} onClick={() => { setMode('walk-in'); setSelectedPrescription(null); }}>
          Walk-in Customer
        </button>
        <button type="button" className={tabClass(mode === 'ipd')} onClick={() => { setMode('ipd'); setSelectedPrescription(null); }}>
          IPD Requests
        </button>
        <button type="button" className={tabClass(mode === 'manual')} onClick={() => setMode('manual')}>
          Manual Bill
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
        {mode === 'opd' && (
          <OpdPrescriptionsView
            changeSection={() => setMode('manual')}
            setSelectedPrescription={setSelectedPrescription}
          />
        )}
        {mode === 'walk-in' && (
          <NewBillView isWalkIn={true} selectedPrescription={null} clearPrescription={() => {}} />
        )}
        {mode === 'ipd' && <RequestsView />}
        {mode === 'manual' && (
          <NewBillView
            selectedPrescription={selectedPrescription}
            clearPrescription={() => setSelectedPrescription(null)}
          />
        )}
      </div>
    </div>
  );
};

// ==================== INVENTORY WORKSPACE ====================
const InventoryWorkspace = () => {
  const [tab, setTab] = useState('stock'); // 'stock', 'expiry', 'out-of-stock', 'adjustment', 'ledger'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2.5 pb-2 border-b border-orange-50">
        <button type="button" className={tabClass(tab === 'stock')} onClick={() => setTab('stock')}>
          Current Stock
        </button>
        <button type="button" className={tabClass(tab === 'expiry')} onClick={() => setTab('expiry')}>
          Expiry Warnings
        </button>
        <button type="button" className={tabClass(tab === 'out-of-stock')} onClick={() => setTab('out-of-stock')}>
          Out of Stock
        </button>
        <button type="button" className={tabClass(tab === 'adjustment')} onClick={() => setTab('adjustment')}>
          Stock Adjustment
        </button>
        <button type="button" className={tabClass(tab === 'ledger')} onClick={() => setTab('ledger')}>
          Stock Ledger
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
        {tab === 'stock' && <InventoryView />}
        {tab === 'expiry' && <ExpiryMedicinesView />}
        {tab === 'out-of-stock' && <OutOfStockView />}
        {tab === 'adjustment' && <StockAdjustmentView />}
        {tab === 'ledger' && <StockLedgerView />}
      </div>
    </div>
  );
};

// ==================== PURCHASES WORKSPACE ====================
const PurchasesWorkspace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('history'); // 'entry', 'history', 'suppliers', 'import'

  const editId = searchParams.get('editId');

  useEffect(() => {
    if (editId) {
      setTab('entry');
    }
  }, [editId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2.5 pb-2 border-b border-orange-50">
        <button type="button" className={tabClass(tab === 'history')} onClick={() => { setTab('history'); setSearchParams({ section: 'purchases' }); }}>
          Purchase History
        </button>
        <button type="button" className={tabClass(tab === 'entry')} onClick={() => setTab('entry')}>
          {editId ? 'Edit Purchase Invoice' : 'Purchase Entry (GRN)'}
        </button>
        <button type="button" className={tabClass(tab === 'suppliers')} onClick={() => { setTab('suppliers'); setSearchParams({ section: 'purchases' }); }}>
          Suppliers
        </button>
        <button type="button" className={tabClass(tab === 'import')} onClick={() => { setTab('import'); setSearchParams({ section: 'purchases' }); }}>
          Excel Import
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
        {tab === 'entry' && <PurchaseEntryView editId={editId} onSaveComplete={() => setTab('history')} />}
        {tab === 'history' && <PurchaseHistoryView onEditClick={(id) => setSearchParams({ section: 'purchases', editId: id })} />}
        {tab === 'suppliers' && <SupplierManagementView />}
        {tab === 'import' && <ExcelUploadView />}
      </div>
    </div>
  );
};

// ==================== SALES WORKSPACE ====================
const SalesWorkspace = () => {
  const [tab, setTab] = useState('history'); // 'history', 'return'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2.5 pb-2 border-b border-orange-50">
        <button type="button" className={tabClass(tab === 'history')} onClick={() => setTab('history')}>
          Sales History
        </button>
        <button type="button" className={tabClass(tab === 'return')} onClick={() => setTab('return')}>
          Sales Return
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
        {tab === 'history' && <SalesHistoryView />}
        {tab === 'return' && <SalesReturnView />}
      </div>
    </div>
  );
};

// ==================== REPORTS WORKSPACE ====================
const ReportsWorkspace = () => {
  const [reportType, setReportType] = useState('purchase');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState('');
  const [itemName, setItemName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('');

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data } = await client.get('/pharmacy/suppliers');
        setSuppliers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSuppliers();
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setRecords([]);
    try {
      const params = new URLSearchParams({
        reportType,
        fromDate,
        toDate,
        supplierId,
        itemName,
        patientName,
        doctorName,
        paymentMode
      });
      const { data } = await client.get(`/pharmacy/reports?${params.toString()}`);
      setRecords(data);
    } catch (err) {
      toast.error('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }, [reportType, fromDate, toDate, supplierId, itemName, patientName, doctorName, paymentMode]);

  const exportExcel = () => {
    if (records.length === 0) {
      toast.error('No data available to export.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Output');
    XLSX.writeFile(workbook, `pharmacy_${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Spreadsheet report downloaded successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs text-gray-700">
      
      {/* Filtering Options card */}
      <div className="card p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="mb-1 block font-bold text-gray-550">Choose Report Type *</label>
            <select
              className="input py-2 text-xs font-semibold"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="purchase">Purchase Report (GRNs)</option>
              <option value="purchase-return">Purchase Return Report</option>
              <option value="sales">Sales & Revenue Report</option>
              <option value="sales-return">Sales Returns Report</option>
              <option value="inventory">Current Inventory Stock</option>
              <option value="expiry">Expiry Warnings Ledger</option>
              <option value="out-of-stock">Out of Stock Ledger</option>
              <option value="stock-adjustment">Stock Adjustments Log</option>
              <option value="supplier-outstanding">Supplier Outstanding Balances</option>
              <option value="profit">Sales Profit Margins Analysis</option>
              <option value="gst">GST Tax Liability Summary</option>
              <option value="patient">Patient Sales Summary</option>
              <option value="doctor">Prescription Sales (Doctor-wise)</option>
              <option value="ipd">IPD Dispenses Report</option>
              <option value="walk-in">Walk-in Customer Sales</option>
              <option value="stock-ledger">Stock Movements Ledger</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-gray-550">From Date</label>
            <input type="date" className="input py-2 text-xs" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block font-bold text-gray-550">To Date</label>
            <input type="date" className="input py-2 text-xs" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className="flex items-end gap-2">
            <button type="button" onClick={loadReport} className="btn flex-1 py-2 px-4 text-xs font-bold cursor-pointer">
              Generate Report
            </button>
          </div>
        </div>

        {/* Dynamic Filters depending on chosen type */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 border-t border-orange-50 pt-3">
          {(reportType === 'purchase' || reportType === 'supplier-outstanding' || reportType === 'stock-ledger') && (
            <div>
              <label className="mb-1 block font-bold text-gray-550">Filter by Supplier</label>
              <select className="input py-2 text-xs" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">-- All Suppliers --</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {(reportType === 'inventory' || reportType === 'expiry' || reportType === 'profit' || reportType === 'stock-ledger') && (
            <div>
              <label className="mb-1 block font-bold text-gray-550">Filter by Medicine Name</label>
              <input type="text" className="input py-2 text-xs" placeholder="e.g. Paracetamol" value={itemName} onChange={(e) => setItemName(e.target.value)} />
            </div>
          )}

          {(reportType === 'sales' || reportType === 'patient') && (
            <div>
              <label className="mb-1 block font-bold text-gray-555">Filter by Patient Name</label>
              <input type="text" className="input py-2 text-xs" placeholder="e.g. John Doe" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
            </div>
          )}

          {reportType === 'doctor' && (
            <div>
              <label className="mb-1 block font-bold text-gray-555">Filter by Doctor Name</label>
              <input type="text" className="input py-2 text-xs" placeholder="e.g. Dr. Roy" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
            </div>
          )}

          {reportType === 'sales' && (
            <div>
              <label className="mb-1 block font-bold text-gray-550">Payment Mode</label>
              <select className="input py-2 text-xs" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option value="">-- All Modes --</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Report results grid */}
      <div className="card overflow-hidden bg-white border border-orange-100 shadow-sm print:border-none print:shadow-none">
        <div className="flex justify-between items-center p-4 border-b border-orange-50 print:hidden">
          <span className="font-extrabold text-gray-800 text-xs">Report Results Ledger ({records.length} records)</span>
          <div className="flex gap-2">
            <button type="button" onClick={exportExcel} className="btn-secondary py-1.5 px-3.5 text-xs font-bold border-orange-200 hover:bg-orange-50 flex items-center gap-1.5 cursor-pointer">
              <Download className="h-4 w-4 text-orange-500" /> Export Excel
            </button>
            <button type="button" onClick={handlePrint} className="btn py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Printer className="h-4 w-4" /> Print Document
            </button>
          </div>
        </div>

        <div className="overflow-x-auto p-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-orange-50/30 text-xs font-bold text-gray-600 border-b border-orange-100">
                <th className="p-3 pl-4">Sno.</th>
                {reportType === 'purchase' && (
                  <>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Invoice Date</th>
                    <th className="p-3 text-right">Grand Total (₹)</th>
                    <th className="p-3 text-right">Paid (₹)</th>
                    <th className="p-3 text-right">Pending (₹)</th>
                    <th className="p-3 text-center">Status</th>
                  </>
                )}
                {reportType === 'purchase-return' && (
                  <>
                    <th className="p-3">Return Ref</th>
                    <th className="p-3">Invoice Ref</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Reason</th>
                  </>
                )}
                {(reportType === 'sales' || reportType === 'sales-return' || reportType === 'walk-in' || reportType === 'ipd' || reportType === 'patient' || reportType === 'doctor') && (
                  <>
                    <th className="p-3">Bill No</th>
                    <th className="p-3">Patient / Customer</th>
                    <th className="p-3">Bill Date</th>
                    <th className="p-3 text-center">Payment Mode</th>
                    <th className="p-3 text-right">Total Amount (₹)</th>
                    <th className="p-3">Prescribing Doctor</th>
                    <th className="p-3 text-left">Remarks</th>
                    <th className="p-3 text-center">Status</th>
                  </>
                )}
                {(reportType === 'inventory' || reportType === 'current-stock' || reportType === 'expiry' || reportType === 'out-of-stock') && (
                  <>
                    <th className="p-3">Medicine Name</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3">Expiry</th>
                    <th className="p-3 text-center">Pack</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">MRP (₹)</th>
                    <th className="p-3 text-right">Purchase Rate (₹)</th>
                    <th className="p-3">Supplier</th>
                  </>
                )}
                {reportType === 'stock-adjustment' && (
                  <>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-center">Type</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3">Approved By</th>
                  </>
                )}
                {reportType === 'supplier-outstanding' && (
                  <>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3 text-right">Total Outstanding Balance (₹)</th>
                  </>
                )}
                {reportType === 'profit' && (
                  <>
                    <th className="p-3">Bill Ref</th>
                    <th className="p-3">Medicine</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">MRP (₹)</th>
                    <th className="p-3 text-right">Purchase Rate (₹)</th>
                    <th className="p-3 text-right">Discount (₹)</th>
                    <th className="p-3 text-right">GST (₹)</th>
                    <th className="p-3 text-right text-green-700">Gross Sale (₹)</th>
                    <th className="p-3 text-right text-indigo-650">Net Profit (₹)</th>
                    <th className="p-3 text-right">Profit %</th>
                  </>
                )}
                {reportType === 'gst' && (
                  <>
                    <th className="p-3 text-right">Sales Tax Output (₹)</th>
                    <th className="p-3 text-right">Purchase CGST Input (₹)</th>
                    <th className="p-3 text-right">Purchase SGST Input (₹)</th>
                    <th className="p-3 text-right">Purchase IGST Input (₹)</th>
                    <th className="p-3 text-right text-purple-750 font-black">Net GST Liability (₹)</th>
                  </>
                )}
                {reportType === 'stock-ledger' && (
                  <>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3 text-center">Opening</th>
                    <th className="p-3 text-center">In / Out</th>
                    <th className="p-3 text-center">Closing</th>
                    <th className="p-3 text-center">Type</th>
                    <th className="p-3">Remarks / User</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 font-semibold text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="12" className="p-8 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-550 inline mr-2" /> Generating report table...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="12" className="p-8 text-center text-gray-400 font-bold">No records found matching filters.</td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/10">
                    <td className="p-2.5 pl-4 font-bold text-gray-400">{idx + 1}</td>
                    {reportType === 'purchase' && (
                      <>
                        <td className="p-2.5 font-mono font-bold text-orange-700">{r.purchaseInvoiceNumber}</td>
                        <td className="p-2.5 font-bold text-gray-800">{r.supplierId?.name || r.supplierName || 'Direct Purchase'}</td>
                        <td className="p-2.5 text-gray-500">{new Date(r.invoiceDate).toLocaleDateString('en-GB')}</td>
                        <td className="p-2.5 text-right font-black text-gray-850">₹{r.totalAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-green-700">₹{r.paidAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-red-650">₹{r.pendingAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            r.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' :
                            r.paymentStatus === 'Partially Paid' ? 'bg-yellow-50 text-yellow-750' : 'bg-red-50 text-red-750'
                          }`}>{r.paymentStatus}</span>
                        </td>
                      </>
                    )}
                    {reportType === 'purchase-return' && (
                      <>
                        <td className="p-2.5 font-mono font-bold text-orange-700">{r.invoiceNumber}-RET</td>
                        <td className="p-2.5 font-mono text-gray-655">{r.invoiceNumber}</td>
                        <td className="p-2.5 font-bold text-gray-800">{r.supplierId?.name || r.supplierName || 'Direct Purchase'}</td>
                        <td className="p-2.5 text-gray-500">{new Date(r.returnDate || r.createdAt).toLocaleDateString('en-GB')}</td>
                        <td className="p-2.5 text-gray-600">{r.reason}</td>
                      </>
                    )}
                    {(reportType === 'sales' || reportType === 'sales-return' || reportType === 'walk-in' || reportType === 'ipd' || reportType === 'patient' || reportType === 'doctor') && (
                      <>
                        <td className="p-2.5 font-mono font-bold text-orange-700">{r.billNumber}</td>
                        <td className="p-2.5 font-bold text-gray-800">{r.customerDetails?.name || r.patientId?.name || 'Walk-in'}</td>
                        <td className="p-2.5 text-gray-500">{new Date(r.billDate).toLocaleDateString('en-GB')}</td>
                        <td className="p-2.5 text-center">{r.paymentMethod}</td>
                        <td className="p-2.5 text-right font-black text-gray-850">₹{r.grandTotal.toFixed(2)}</td>
                        <td className="p-2.5 text-gray-600 font-semibold">{r.doctorName || 'Self / Hospital'}</td>
                        <td className="p-2.5 text-xs text-gray-500 max-w-[150px] truncate" title={r.remarks || ''}>
                          {r.remarks || '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            r.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-750'
                          }`}>{r.status}</span>
                        </td>
                      </>
                    )}
                    {(reportType === 'inventory' || reportType === 'current-stock' || reportType === 'expiry' || reportType === 'out-of-stock') && (
                      <>
                        <td className="p-2.5 font-bold text-gray-800">{r.itemName}</td>
                        <td className="p-2.5 font-mono text-gray-650 bg-gray-50 border border-gray-100 rounded px-1.5">{r.batch}</td>
                        <td className="p-2.5 text-gray-500">{new Date(r.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</td>
                        <td className="p-2.5 text-center">{r.pack}</td>
                        <td className="p-2.5 text-center font-bold text-orange-700">{r.quantity}</td>
                        <td className="p-2.5 text-right font-mono">₹{r.mrp.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono">₹{r.rate.toFixed(2)}</td>
                        <td className="p-2.5 text-gray-550">{r.supplierId?.name || r.supplierName || 'Excel upload'}</td>
                      </>
                    )}
                    {reportType === 'stock-adjustment' && (
                      <>
                        <td className="p-2.5 font-bold text-gray-800">{r.itemName}</td>
                        <td className="p-2.5 font-mono text-gray-650">{r.batch}</td>
                        <td className="p-2.5 text-center font-bold">{r.quantity}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            r.type === 'Increase' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-750'
                          }`}>{r.type}</span>
                        </td>
                        <td className="p-2.5 text-gray-600">{r.reason}</td>
                        <td className="p-2.5 text-gray-500">{r.remarks || '-'}</td>
                        <td className="p-2.5 text-gray-600 font-bold">{r.approvedBy}</td>
                      </>
                    )}
                    {reportType === 'supplier-outstanding' && (
                      <>
                        <td className="p-2.5 font-bold text-gray-800">{r.name}</td>
                        <td className="p-2.5 font-mono text-orange-700">{r.code}</td>
                        <td className="p-2.5 font-mono text-gray-500">{r.gstin || '-'}</td>
                        <td className="p-2.5 text-right font-black text-red-650 font-mono">₹{r.outstandingAmount.toFixed(2)}</td>
                      </>
                    )}
                    {reportType === 'profit' && (
                      <>
                        <td className="p-2.5 font-mono font-bold text-gray-500">{r.billNumber}</td>
                        <td className="p-2.5 font-bold text-gray-800">{r.itemName}</td>
                        <td className="p-2.5 text-center font-bold">{r.quantity}</td>
                        <td className="p-2.5 text-right font-mono">₹{r.sellingPrice.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono">₹{r.purchaseRate.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-red-650">₹{r.discount.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-gray-500">₹{r.gstAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-green-700 font-bold font-mono">₹{r.netSale.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-indigo-650 font-black font-mono">₹{r.grossProfit.toFixed(2)}</td>
                        <td className={`p-2.5 text-right font-bold font-mono ${r.profitPercent > 0 ? 'text-green-700' : 'text-red-500'}`}>{r.profitPercent.toFixed(1)}%</td>
                      </>
                    )}
                    {reportType === 'gst' && (
                      <>
                        <td className="p-2.5 text-right font-bold text-green-700">₹{r.salesGstAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-gray-500">₹{r.purchaseCGST.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-gray-500">₹{r.purchaseSGST.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-gray-500">₹{r.purchaseIGST.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-black text-purple-750 font-mono text-sm">₹{r.netGstLiability.toFixed(2)}</td>
                      </>
                    )}
                    {reportType === 'stock-ledger' && (
                      <>
                        <td className="p-2.5 text-gray-400">{new Date(r.timestamp).toLocaleDateString('en-GB')}</td>
                        <td className="p-2.5 font-bold text-gray-800">{r.itemName}</td>
                        <td className="p-2.5 font-mono text-gray-650 bg-gray-50 px-1 py-0.5 rounded">{r.batch}</td>
                        <td className="p-2.5 text-center text-gray-500">{r.previousStock}</td>
                        <td className={`p-2.5 text-center font-black ${r.quantity > 0 ? 'text-green-700' : 'text-red-650'}`}>
                          {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
                        </td>
                        <td className="p-2.5 text-center font-bold text-gray-850">{r.newStock}</td>
                        <td className="p-2.5 text-center">
                          <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{r.type}</span>
                        </td>
                        <td className="p-2.5 text-gray-500 max-w-[200px] truncate" title={r.remarks}>{r.remarks}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== SETTINGS WORKSPACE ====================
const SettingsWorkspace = () => {
  const [tab, setTab] = useState('billing'); // 'billing', 'audit'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2.5 pb-2 border-b border-orange-50">
        <button type="button" className={tabClass(tab === 'billing')} onClick={() => setTab('billing')}>
          Pharmacy Settings
        </button>
        <button type="button" className={tabClass(tab === 'audit')} onClick={() => setTab('audit')}>
          System Audit Logs
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
        {tab === 'billing' && <BillingSettingsView isAdmin={false} />}
        {tab === 'audit' && <AuditLogsView />}
      </div>
    </div>
  );
};

// ==================== LIVE SUPPLIER MANAGEMENT VIEW ====================
const SupplierManagementView = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', contactPerson: '', mobile: '', email: '', gstin: '', drugLicenseNumber: '',
    address: '', city: '', state: '', pincode: '', paymentTerms: '', openingBalance: 0, notes: '', status: 'Active'
  });
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/pharmacy/suppliers?search=${encodeURIComponent(search)}`);
      setSuppliers(data);
    } catch (err) {
      toast.error('Failed to load suppliers list.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile) {
      toast.error('Supplier Name and Mobile Number are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await client.put(`/pharmacy/suppliers/${form._id}`, form);
        toast.success('Supplier updated successfully!');
      } else {
        await client.post('/pharmacy/suppliers', form);
        toast.success('Supplier registered successfully!');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (supp) => {
    setForm({ ...supp });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleToggleStatus = async (id) => {
    if (window.confirm('Are you sure you want to change this supplier status?')) {
      try {
        await client.delete(`/pharmacy/suppliers/${id}`);
        toast.success('Supplier status updated.');
        fetchSuppliers();
      } catch (err) {
        toast.error('Error changing supplier status.');
      }
    }
  };

  const openAddModal = () => {
    setForm({
      name: '', contactPerson: '', mobile: '', email: '', gstin: '', drugLicenseNumber: '',
      address: '', city: '', state: '', pincode: '', paymentTerms: '', openingBalance: 0, notes: '', status: 'Active'
    });
    setIsEdit(false);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            className="input pl-10 py-2.5 text-xs font-semibold"
            placeholder="Search suppliers by name/code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3.5 top-3 text-orange-400 h-4 w-4" />
        </div>
        <button type="button" onClick={openAddModal} className="btn py-2 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" /> Register Supplier
        </button>
      </div>

      <div className="card overflow-hidden bg-white border border-orange-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3.5 pl-4">Code</th>
                <th className="p-3.5">Supplier Name</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">Mobile</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5">City / State</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-550 inline mr-2" /> Loading supplier records...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400 font-bold">
                    No suppliers registered.
                  </td>
                </tr>
              ) : (
                suppliers.map(s => (
                  <tr key={s._id} className="hover:bg-orange-50/10">
                    <td className="p-3.5 pl-4 font-mono font-bold text-orange-700">{s.code}</td>
                    <td className="p-3.5 font-bold text-gray-800">{s.name}</td>
                    <td className="p-3.5 font-semibold text-gray-600">{s.contactPerson || '-'}</td>
                    <td className="p-3.5 font-mono font-bold text-gray-700">{s.mobile}</td>
                    <td className="p-3.5 font-mono text-gray-550 font-semibold">{s.gstin || '-'}</td>
                    <td className="p-3.5 font-semibold text-gray-550">{s.city ? `${s.city}, ${s.state || ''}` : '-'}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                        s.status === 'Active' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-750'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-center flex items-center justify-center gap-1.5">
                      <button type="button" onClick={() => handleEdit(s)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-xl transition cursor-pointer" title="Edit supplier details">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleToggleStatus(s._id)} className={`p-1.5 rounded-xl transition cursor-pointer ${
                        s.status === 'Active' ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                      }`} title={s.status === 'Active' ? 'Mark Inactive' : 'Mark Active'}>
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 max-w-lg w-full border border-orange-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-orange-50 pb-2.5">
              <h3 className="font-black text-gray-800 text-sm flex items-center gap-1.5">
                <Truck className="text-orange-500 h-4.5 w-4.5" />
                {isEdit ? 'Update Supplier Details' : 'Register New Supplier'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-gray-550">Supplier / Company Name *</label>
                <input type="text" className="input py-2 text-xs" required placeholder="e.g. Cipla Healthcare" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-550">Contact Person Name</label>
                <input type="text" className="input py-2 text-xs" placeholder="e.g. Anil Mehta" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-555">Mobile Number *</label>
                <input type="text" className="input py-2 text-xs" required placeholder="e.g. 9811223344" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-550">Email Address</label>
                <input type="email" className="input py-2 text-xs" placeholder="e.g. supplier@domain.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-555">GSTIN / Tax ID</label>
                <input type="text" className="input py-2 text-xs font-mono uppercase" placeholder="27AAAAA1111A1Z1" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-550">Drug License Number</label>
                <input type="text" className="input py-2 text-xs uppercase" placeholder="DL-12345/20B" value={form.drugLicenseNumber} onChange={(e) => setForm({ ...form, drugLicenseNumber: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-550">Payment Terms</label>
                <input type="text" className="input py-2 text-xs" placeholder="e.g. Net 30, Cash on Delivery" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-gray-550">Street Address</label>
                <input type="text" className="input py-2 text-xs" placeholder="Office/Warehouse street location" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-555">City</label>
                <input type="text" className="input py-2 text-xs" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-555">State</label>
                <input type="text" className="input py-2 text-xs" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-555">Pincode</label>
                <input type="text" className="input py-2 text-xs" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-555">Opening Balance (₹)</label>
                <input type="number" step="0.01" className="input py-2 text-xs" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-gray-550">Special Notes</label>
                <textarea className="input py-2 text-xs h-[50px]" placeholder="Supplier specific instructions..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs py-2.5 px-5 font-bold cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn text-xs py-2.5 px-6 font-bold shadow-md shadow-orange-500/10 cursor-pointer disabled:bg-orange-300">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? 'Save Changes' : 'Register')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ==================== MANUAL PURCHASE ENTRY (GRN) ====================
const PurchaseEntryView = ({ editId = null, onSaveComplete }) => {
  const [, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const formatDateToMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${month}/${year}`;
  };

  const formatMMYYYYToDate = (mmYYYYStr) => {
    if (!mmYYYYStr) return '';
    const parts = mmYYYYStr.split('/');
    if (parts.length !== 2) return '';
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return '';
    const monthStr = String(month).padStart(2, '0');
    return `${year}-${monthStr}-02`;
  };

  // States
  const [isDirectPurchase, setIsDirectPurchase] = useState(false);
  const [header, setHeader] = useState({
    purchaseInvoiceNumber: '', supplierId: '', supplierName: '', invoiceDate: new Date().toISOString().split('T')[0],
    receiveDate: new Date().toISOString().split('T')[0], paymentType: 'Cash', dueDate: '', notes: ''
  });
  const [items, setItems] = useState([]);
  const [medQuery, setMedQuery] = useState('');
  const [medResults, setMedResults] = useState([]);
  const [searchingMeds, setSearchingMeds] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);

  // Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [activeItem, setActiveItem] = useState({
    itemName: '', description: '', dosageForm: '', packType: '', unitsPerPack: 1, quantity: 0,
    batch: '', expiry: '', purchaseRateExGst: 0, sellingRateExGst: 0, discountPercent: 0,
    cgst: 0, sgst: 0, hsn: '0'
  });

  // Fetch active suppliers list
  useEffect(() => {
    const fetchActiveSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const { data } = await client.get('/pharmacy/suppliers');
        setSuppliers(data.filter(s => s.status === 'Active'));
      } catch (err) {
        toast.error('Failed to load supplier dropdown.');
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchActiveSuppliers();
  }, []);

  // Fetch details if Edit Mode is triggered
  useEffect(() => {
    if (editId) {
      const fetchPurchaseInfo = async () => {
        setLoadingDetails(true);
        try {
          const { data } = await client.get(`/pharmacy/purchases/${editId}`);
          setHeader({
            purchaseInvoiceNumber: data.purchaseInvoiceNumber || '',
            supplierId: data.supplierId?._id || data.supplierId || '',
            supplierName: data.supplierName || '',
            invoiceDate: data.invoiceDate ? data.invoiceDate.split('T')[0] : '',
            receiveDate: data.receiveDate ? data.receiveDate.split('T')[0] : '',
            paymentType: data.paymentType || 'Cash',
            dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
            notes: data.notes || ''
          });
          setIsDirectPurchase(!data.supplierId);
          setItems(data.items.map(it => ({
            itemName: it.itemName,
            description: it.description || '',
            dosageForm: it.dosageForm || '',
            packType: it.packType || it.pack || '',
            unitsPerPack: it.unitsPerPack || 1,
            quantity: it.quantity,
            batch: it.batch,
            expiry: it.expiry ? it.expiry.split('T')[0] : '',
            purchaseRateExGst: it.purchaseRateExGst || it.rate || 0,
            sellingRateExGst: it.sellingRateExGst || 0,
            discountPercent: it.discountPercent || 0,
            discountAmount: it.discountAmount || 0,
            sgst: it.sgst || 0,
            cgst: it.cgst || 0,
            hsn: it.hsn || '0',
            totalAmount: it.totalAmount || 0,
            returnedQty: it.returnedQty || 0,
            sellingCgst: it.sellingCgst !== undefined ? it.sellingCgst : it.cgst || 0,
            sellingSgst: it.sellingSgst !== undefined ? it.sellingSgst : it.sgst || 0,
            thresholdMedicineNumber: it.thresholdMedicineNumber !== undefined ? it.thresholdMedicineNumber : 10
          })));
          setPaidAmount(data.paidAmount || 0);
        } catch (err) {
          toast.error('Error fetching purchase details for edit.');
        } finally {
          setLoadingDetails(false);
        }
      };
      fetchPurchaseInfo();
    }
  }, [editId]);

  // Autocomplete query search
  useEffect(() => {
    if (!medQuery.trim()) {
      setMedResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingMeds(true);
      try {
        const { data } = await client.get(`/pharmacy/inventory?limit=10&search=${encodeURIComponent(medQuery)}`);
        setMedResults(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingMeds(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [medQuery]);

  // Excel template downloader
  const downloadPurchaseTemplate = () => {
    const headers = [
      [
        'Medicine Name', 'Description', 'Dosage Form', 'Pack Type', 'Unit/Pack', 'Qty (Packs)', 'Batch No', 'Expiry Date',
        'Purchase Rate Ex GST', 'Selling Rate Ex GST', 'Discount %', 'HSN', 'CGST %', 'SGST %',
        'Selling CGST %', 'Selling SGST %', 'purchase rate (Inc gst)', 'MRP (Inc gst)', 'Low Stock Threshold'
      ]
    ];
    const sampleRows = [
      [
        'Paracetamol 650mg', 'Pain reliever and fever reducer', 'Tablet', 'strip', 10, 50, 'BATCH-1234', '2027-12-31',
        12.50, 18.00, 2, '30049011', 6, 6,
        6, 6, 14.00, 20.16, 10
      ]
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...sampleRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Line Items');
    XLSX.writeFile(workbook, `pharmacy_purchase_template.xlsx`);
  };

  // Excel loader
  const handlePurchaseExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      toast.error('Invalid format. Please upload a valid .xlsx or .xls file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          toast.error('The uploaded sheet is empty.');
          return;
        }

        const mappedItems = rows.map((row) => {
          const getValue = (aliases) => {
            const keys = Object.keys(row);
            for (const alias of aliases) {
              const matchedKey = keys.find(k => k.trim().toLowerCase() === alias.toLowerCase());
              if (matchedKey !== undefined) return row[matchedKey];
            }
            return null;
          };

          const itemName = String(getValue(['Medicine Name', 'itemName', 'name']) || '').trim();
          const description = String(getValue(['Description', 'description']) || '').trim();
          const dosageForm = String(getValue(['Dosage Form', 'dosageForm']) || '').trim();
          const packType = String(getValue(['Pack Type', 'packType', 'pack']) || '').trim();
          const unitsPerPack = parseInt(getValue(['Unit/Pack', 'unitsPerPack'])) || 1;
          const quantity = parseFloat(getValue(['Qty (Packs)', 'quantity', 'qty'])) || 0;
          const batch = String(getValue(['Batch No', 'batch']) || '').trim();
          
          let expiryRaw = getValue(['Expiry Date', 'expiry']);
          let expiry = '';
          if (expiryRaw) {
            if (typeof expiryRaw === 'number') {
              const utc_days = Math.floor(expiryRaw - 25569);
              const date = new Date(utc_days * 86400 * 1000);
              expiry = date.toISOString().split('T')[0];
            } else {
              const parsedDate = new Date(expiryRaw);
              if (!isNaN(parsedDate.getTime())) {
                expiry = parsedDate.toISOString().split('T')[0];
              } else {
                expiry = String(expiryRaw).trim();
              }
            }
          }

          const cgst = parseFloat(getValue(['CGST %', 'cgst'])) || 0;
          const sgst = parseFloat(getValue(['SGST %', 'sgst'])) || 0;

          const sellingCgstVal = getValue(['Selling CGST %', 'sellingCgst']);
          const sellingSgstVal = getValue(['Selling SGST %', 'sellingSgst']);
          const sellingCgst = sellingCgstVal !== null && sellingCgstVal !== undefined && !isNaN(parseFloat(sellingCgstVal)) ? parseFloat(sellingCgstVal) : cgst;
          const sellingSgst = sellingSgstVal !== null && sellingSgstVal !== undefined && !isNaN(parseFloat(sellingSgstVal)) ? parseFloat(sellingSgstVal) : sgst;

          let purchaseRateExGst = parseFloat(getValue(['Purchase Rate Ex GST', 'purchaseRateExGst', 'rate'])) || 0;
          const purchaseRateIncGstVal = getValue(['purchase rate (Inc gst)', 'purchaseRateIncGst']);
          if (!purchaseRateExGst && purchaseRateIncGstVal !== null && purchaseRateIncGstVal !== undefined && !isNaN(parseFloat(purchaseRateIncGstVal))) {
            const incGst = parseFloat(purchaseRateIncGstVal) || 0;
            purchaseRateExGst = incGst / (1 + (cgst + sgst) / 100);
          }

          let sellingRateExGst = parseFloat(getValue(['Selling Rate Ex GST', 'sellingRateExGst'])) || 0;
          const mrpIncGstVal = getValue(['MRP (Inc gst)', 'mrp']);
          if (!sellingRateExGst && mrpIncGstVal !== null && mrpIncGstVal !== undefined && !isNaN(parseFloat(mrpIncGstVal))) {
            const mrpVal = parseFloat(mrpIncGstVal) || 0;
            sellingRateExGst = mrpVal / (1 + (sellingCgst + sellingSgst) / 100);
          }

          const discountPercent = parseFloat(getValue(['Discount %', 'discountPercent'])) || 0;
          const hsn = String(getValue(['HSN', 'hsn']) || '0').trim();

          const thresholdVal = getValue(['Low Stock Threshold', 'thresholdMedicineNumber', 'threshold']);
          const thresholdMedicineNumber = thresholdVal !== null && thresholdVal !== undefined && !isNaN(parseInt(thresholdVal)) ? parseInt(thresholdVal) : 10;

          const isSameGstAsPurchase = Number(sellingCgst) === Number(cgst) && Number(sellingSgst) === Number(sgst);

          const gross = quantity * purchaseRateExGst;
          const discountAmount = gross * (discountPercent / 100);
          const taxable = gross - discountAmount;
          const gstPct = cgst + sgst;
          const totalAmount = taxable * (1 + gstPct / 100);

          return {
            itemName,
            description,
            dosageForm,
            packType,
            unitsPerPack,
            quantity,
            batch,
            expiry,
            purchaseRateExGst,
            sellingRateExGst,
            discountPercent,
            discountAmount,
            cgst,
            sgst,
            hsn,
            totalAmount,
            sellingCgst,
            sellingSgst,
            thresholdMedicineNumber,
            isSameGstAsPurchase
          };
        });

        const validItems = mappedItems.filter(it => it.itemName);
        if (validItems.length === 0) {
          toast.error('No valid rows found containing a medicine name.');
          return;
        }

        setItems(prev => [...prev, ...validItems]);
        toast.success(`Successfully loaded ${validItems.length} line items from Excel.`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse the Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // clear input
  };

  const handleOpenAddModal = () => {
    setEditingItemIdx(null);
    setActiveItem({
      itemName: '', description: '', dosageForm: '', packType: '', unitsPerPack: 1, quantity: 0,
      batch: '', expiry: '', purchaseRateExGst: 0, sellingRateExGst: 0, discountPercent: 0,
      cgst: 0, sgst: 0, hsn: '0', sellingCgst: 0, sellingSgst: 0, isSameGstAsPurchase: true,
      thresholdMedicineNumber: 10
    });
    setMedQuery('');
    setMedResults([]);
    setShowItemModal(true);
  };

  const handleOpenEditModal = (idx) => {
    setEditingItemIdx(idx);
    const it = items[idx];
    const isSameGst = (it.sellingCgst === undefined || Number(it.sellingCgst) === Number(it.cgst)) && 
                      (it.sellingSgst === undefined || Number(it.sellingSgst) === Number(it.sgst));
    setActiveItem({
      ...it,
      sellingCgst: it.sellingCgst !== undefined ? it.sellingCgst : it.cgst,
      sellingSgst: it.sellingSgst !== undefined ? it.sellingSgst : it.sgst,
      isSameGstAsPurchase: isSameGst,
      thresholdMedicineNumber: it.thresholdMedicineNumber !== undefined ? it.thresholdMedicineNumber : 10
    });
    setMedQuery('');
    setMedResults([]);
    setShowItemModal(true);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // Perform overall total sum calculations
  const subTotal = items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.purchaseRateExGst || 0)), 0);
  const totalDiscount = items.reduce((sum, it) => sum + (Number(it.discountAmount) || 0), 0);
  const totalGst = items.reduce((sum, it) => {
    const taxable = (Number(it.quantity) * Number(it.purchaseRateExGst || 0)) - (Number(it.discountAmount) || 0);
    const gstPct = (Number(it.sgst) || 0) + (Number(it.cgst) || 0);
    return sum + (taxable * gstPct / 100);
  }, 0);
  const grandTotal = subTotal - totalDiscount + totalGst;
  const pendingAmount = Math.max(0, grandTotal - paidAmount);

  const saveModalItem = (e) => {
    e.preventDefault();
    if (!activeItem.itemName || !activeItem.batch || !activeItem.expiry || Number(activeItem.quantity) <= 0) {
      toast.error('Please fill in Medicine Name, Batch No, Expiry Date and a valid Quantity.');
      return;
    }

    const qty = Number(activeItem.quantity) || 0;
    const purchaseRateExGst = Number(activeItem.purchaseRateExGst) || 0;
    const discPct = Number(activeItem.discountPercent) || 0;
    const sgstPct = Number(activeItem.sgst) || 0;
    const cgstPct = Number(activeItem.cgst) || 0;

    const gross = qty * purchaseRateExGst;
    const discAmt = gross * (discPct / 100);
    const taxable = gross - discAmt;
    const gstPct = sgstPct + cgstPct;
    const gstAmt = taxable * (gstPct / 100);

    const updatedItem = {
      ...activeItem,
      discountAmount: discAmt,
      totalAmount: taxable + gstAmt
    };

    if (editingItemIdx !== null) {
      const updated = [...items];
      updated[editingItemIdx] = updatedItem;
      setItems(updated);
    } else {
      setItems([...items, updatedItem]);
    }

    setShowItemModal(false);
    setEditingItemIdx(null);
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();

    const hasSupplier = isDirectPurchase ? !!header.supplierName : !!header.supplierId;
    if (!header.purchaseInvoiceNumber || !hasSupplier) {
      toast.error('Please input the Invoice Number and Supplier details.');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one medicine line item.');
      return;
    }

    const invalidRow = items.find(it => !it.itemName || !it.batch || !it.expiry || it.quantity <= 0);
    if (invalidRow) {
      toast.error('All rows must contain medicine name, batch, a valid expiry date, and quantity > 0.');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...header,
      supplierId: isDirectPurchase ? '' : header.supplierId,
      supplierName: isDirectPurchase ? header.supplierName.trim() : '',
      items: items.map(it => ({
        ...it,
        expiry: it.expiry
      })),
      totalAmount: grandTotal,
      paidAmount,
      pendingAmount
    };

    try {
      if (editId) {
        await client.put(`/pharmacy/purchases/${editId}`, payload);
        toast.success('Purchase GRN updated and stock synchronized successfully.');
      } else {
        await client.post('/pharmacy/purchases', payload);
        toast.success('Purchase GRN saved and stock added to inventory successfully.');
      }
      setSearchParams({ section: 'purchases' });
      onSaveComplete();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing purchase GRN.');
    } finally {
      setSubmitting(false);
    }
  };

  // Live modal item calculations preview
  const modalGross = (Number(activeItem.quantity) || 0) * (Number(activeItem.purchaseRateExGst) || 0);
  const modalDiscAmt = modalGross * ((Number(activeItem.discountPercent) || 0) / 100);
  const modalTaxable = modalGross - modalDiscAmt;
  const modalGstAmt = modalTaxable * (((Number(activeItem.cgst) || 0) + (Number(activeItem.sgst) || 0)) / 100);
  const modalTotal = modalTaxable + modalGstAmt;
  const modalMrpIncGst = (Number(activeItem.sellingRateExGst) || 0) * (1 + ((Number(activeItem.cgst) || 0) + (Number(activeItem.sgst) || 0)) / 100);

  if (loadingDetails) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500 inline mr-2" /> Loading invoice details...
      </div>
    );
  }

  return (
    <form onSubmit={handleSavePurchase} className="space-y-6">
      
      {/* Invoice Header details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-orange-50/20 p-5 rounded-2xl border border-orange-100/50">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-bold text-gray-555">Supplier *</label>
            <label className="inline-flex items-center gap-1 text-[10px] text-orange-600 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDirectPurchase}
                onChange={(e) => {
                  setIsDirectPurchase(e.target.checked);
                  setHeader({ ...header, supplierId: '', supplierName: '' });
                }}
                className="rounded border-orange-355 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
              />
              Skip Selection
            </label>
          </div>
          {isDirectPurchase ? (
            <input
              type="text"
              required
              className="input py-2 text-xs font-semibold border-orange-355"
              placeholder="Enter Supplier Name..."
              value={header.supplierName || ''}
              onChange={(e) => setHeader({ ...header, supplierName: e.target.value })}
            />
          ) : (
            <select
              className="input py-2 text-xs font-semibold"
              required
              value={header.supplierId || ''}
              onChange={(e) => setHeader({ ...header, supplierId: e.target.value })}
            >
              <option value="">-- Choose Supplier --</option>
              {loadingSuppliers ? (
                <option disabled>Loading supplier entries...</option>
              ) : (
                suppliers.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)
              )}
            </select>
          )}
        </div>
        <div>
          <label className="mb-1 block font-bold text-gray-555">Purchase Invoice Number *</label>
          <input
            type="text"
            className="input py-2 text-xs font-mono font-bold"
            required
            placeholder="e.g. INV-10029"
            value={header.purchaseInvoiceNumber || ''}
            onChange={(e) => setHeader({ ...header, purchaseInvoiceNumber: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block font-bold text-gray-550">Invoice Date *</label>
          <input
            type="date"
            className="input py-2 text-xs font-semibold"
            required
            value={header.invoiceDate || ''}
            onChange={(e) => setHeader({ ...header, invoiceDate: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block font-bold text-gray-550">Receive Date *</label>
          <input
            type="date"
            className="input py-2 text-xs font-semibold"
            required
            value={header.receiveDate || ''}
            onChange={(e) => setHeader({ ...header, receiveDate: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block font-bold text-gray-555">Payment Mode</label>
          <select
            className="input py-2 text-xs font-semibold"
            value={header.paymentType || 'Cash'}
            onChange={(e) => setHeader({ ...header, paymentType: e.target.value })}
          >
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block font-bold text-gray-555">Payment Due Date (if Credit)</label>
          <input
            type="date"
            className="input py-2 text-xs font-semibold"
            value={header.dueDate || ''}
            onChange={(e) => setHeader({ ...header, dueDate: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block font-bold text-gray-555">Invoice Notes</label>
          <input
            type="text"
            className="input py-2 text-xs"
            placeholder="e.g. Received intact, fridge items kept cold"
            value={header.notes || ''}
            onChange={(e) => setHeader({ ...header, notes: e.target.value })}
          />
        </div>
      </div>

      {/* Excel Upload and Bulk Mappings before item entries */}
      <div className="bg-orange-50/10 p-5 rounded-2xl border border-orange-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100/50 rounded-xl text-orange-600">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h5 className="font-extrabold text-gray-800">Bulk Upload Purchase Line Items</h5>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Quickly import a large number of medicine lines via spreadsheet</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadPurchaseTemplate}
            className="btn-secondary py-2 px-4 text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer border-orange-200 hover:bg-orange-50/50"
          >
            <Download className="h-3.5 w-3.5" /> Download Standard Excel
          </button>
          <label className="btn py-2 px-4 text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10">
            <Upload className="h-3.5 w-3.5" /> Upload Purchase Excel
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handlePurchaseExcelUpload} />
          </label>
        </div>
      </div>

      {/* Invoice Items list */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center border-b border-orange-100 pb-2">
          <h4 className="font-extrabold text-gray-800 text-xs flex items-center gap-1.5">
            <Package className="text-orange-500 h-4.5 w-4.5" /> Purchase Medicine Line Items
          </h4>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn py-2 px-4 text-[10px] font-bold flex items-center gap-1 cursor-pointer animate-pulse"
          >
            <Plus className="h-3.5 w-3.5" /> Add Medicine Line
          </button>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-orange-200/50 rounded-2xl p-8 text-center text-gray-400 bg-white">
            <Package className="h-10 w-10 mx-auto text-orange-300 mb-2" />
            <p className="text-[11px] font-extrabold">No medicine line items added yet.</p>
            <p className="text-[10px] text-gray-400 mt-1">Upload an Excel sheet or click the "Add Medicine Line" button above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-orange-100 rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-[10px] font-extrabold uppercase text-gray-600 border-b border-orange-100">
                  <th className="p-3 pl-4 w-[50px]">S.No</th>
                  <th className="p-3">Medicine Name & Details</th>
                  <th className="p-3 w-[100px]">Batch No</th>
                  <th className="p-3 w-[100px]">Expiry Date</th>
                  <th className="p-3 w-[100px] text-center">Pack Info</th>
                  <th className="p-3 w-[80px] text-center">Qty (Packs)</th>
                  <th className="p-3 w-[110px] text-right">Purchase Ex GST</th>
                  <th className="p-3 w-[110px] text-right">Selling Ex GST</th>
                  <th className="p-3 w-[90px] text-center">Taxes %</th>
                  <th className="p-3 text-right pr-4 w-[110px]">Total (₹)</th>
                  <th className="p-3 text-center w-[80px] print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 font-semibold text-gray-700">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/10 align-middle">
                    <td className="p-3 pl-4 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-extrabold text-gray-800">{it.itemName}</div>
                      {it.description && <div className="text-[10px] text-gray-400 font-normal">{it.description}</div>}
                      {it.dosageForm && <span className="inline-block text-[9px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-md font-bold mt-1">{it.dosageForm}</span>}
                    </td>
                    <td className="p-3 font-mono text-gray-650">{it.batch}</td>
                    <td className="p-3 text-gray-500 font-bold">{it.expiry}</td>
                    <td className="p-3 text-center text-gray-650">
                      <div>{it.packType || '0'}</div>
                      <div className="text-[9px] text-gray-400 font-bold">({it.unitsPerPack} units/pack)</div>
                    </td>
                    <td className="p-3 text-center font-black text-gray-800">{it.quantity}</td>
                    <td className="p-3 text-right font-mono font-bold">₹{Number(it.purchaseRateExGst).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-gray-650">₹{Number(it.sellingRateExGst).toFixed(2)}</td>
                    <td className="p-3 text-center font-mono text-gray-500">
                      <div>CGST: {it.cgst}%</div>
                      <div>SGST: {it.sgst}%</div>
                    </td>
                    <td className="p-3 text-right pr-4 font-mono font-black text-gray-800">
                      ₹{Number(it.totalAmount).toFixed(2)}
                    </td>
                    <td className="p-3 text-center print:hidden">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(idx)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-xl transition cursor-pointer"
                          title="Edit row details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Totals calculation and Saving */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-t border-orange-50 pt-5 text-xs">
        <div className="w-full md:max-w-md bg-orange-50/20 p-5 rounded-2xl border border-orange-100/50 space-y-3.5">
          <h4 className="font-extrabold text-gray-800 text-xs border-b border-orange-100 pb-1 flex items-center gap-1.5">
            <DollarSign className="text-orange-500 h-4.5 w-4.5" /> Receipt & Settlement
          </h4>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-555">Amount Paid (₹)</span>
            <input
              type="number"
              step="0.01"
              className="input py-2 text-right font-black max-w-[150px]"
              value={paidAmount || ''}
              onChange={(e) => setPaidAmount(Math.min(grandTotal, Math.max(0, parseFloat(e.target.value) || 0)))}
            />
          </div>
          <div className="flex justify-between items-center text-gray-650 font-bold border-t border-orange-50 pt-2.5">
            <span>Pending Balance</span>
            <span className="font-black font-mono text-red-650 text-sm">₹{pendingAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="w-full md:max-w-sm bg-gradient-to-br from-white to-orange-50/5 p-6 rounded-3xl border border-orange-100 space-y-3 shadow-sm font-semibold text-gray-600">
          <div className="flex justify-between">
            <span>Gross Subtotal:</span>
            <span className="font-mono font-bold text-gray-800">₹{subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-700">
            <span>Item Discounts:</span>
            <span>- ₹{totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax GST Total:</span>
            <span className="font-mono font-bold text-gray-800">₹{totalGst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-orange-100 pt-3 text-gray-800 font-extrabold">
            <span className="text-sm">Invoice Grand Total:</span>
            <span className="text-base text-orange-700 font-black font-mono">₹{grandTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => { setSearchParams({ section: 'purchases' }); if (onSaveComplete) onSaveComplete(); }}
              className="btn-secondary py-2.5 px-6 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn py-2.5 px-6 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:bg-orange-300 shadow-md shadow-orange-500/10"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {editId ? 'Apply Invoice Edit' : 'Verify & Save GRN'}
            </button>
          </div>
        </div>
      </div>

      {/* Dialog Form Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-orange-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative text-xs">
            <div className="flex justify-between items-center border-b border-orange-50 pb-2.5">
              <h3 className="font-black text-gray-800 text-sm flex items-center gap-1.5">
                <Plus className="text-orange-500 h-5 w-5" />
                {editingItemIdx !== null ? 'Edit Medicine Line Item' : 'Add Medicine Line Item'}
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column: General Medicine Info */}
              <div className="space-y-3.5">
                <div className="relative">
                  <label className="block font-bold text-gray-550 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    className="input py-2 text-xs font-semibold border-orange-200"
                    required
                    placeholder="Type or search name..."
                    value={activeItem.itemName || ''}
                    onChange={(e) => {
                      setActiveItem({ ...activeItem, itemName: e.target.value });
                      setMedQuery(e.target.value);
                    }}
                  />
                  {medQuery && (
                    <div className="absolute left-0 right-0 z-50 bg-white border border-orange-150 rounded-2xl shadow-xl max-h-[150px] overflow-y-auto mt-1 p-1">
                      {searchingMeds ? (
                        <div className="p-2 text-center text-gray-400 text-[10px]">
                          <Loader2 className="h-4.5 w-4.5 animate-spin text-orange-500 inline mr-2" /> Searching...
                        </div>
                      ) : medResults.length === 0 ? (
                        <div className="p-2 text-center text-gray-400 text-[10px] font-bold">
                          No match found. Free text allowed.
                        </div>
                      ) : (
                        medResults.map(stock => (
                          <button
                            key={stock._id}
                            type="button"
                            onClick={() => {
                              setActiveItem({
                                ...activeItem,
                                itemName: stock.itemName,
                                description: stock.description || '',
                                dosageForm: stock.dosageForm || '',
                                packType: stock.packType || stock.pack || '',
                                unitsPerPack: stock.unitsPerPack || 1,
                                hsn: stock.hsn || '0',
                                sgst: stock.sgst || 0,
                                cgst: stock.cgst || stock.cst || 0,
                                sellingCgst: stock.cgst || stock.cst || 0,
                                sellingSgst: stock.sgst || 0,
                                isSameGstAsPurchase: true,
                                sellingRateExGst: stock.rateExGst || stock.rate || 0,
                                thresholdMedicineNumber: stock.thresholdMedicineNumber !== undefined ? stock.thresholdMedicineNumber : 10
                              });
                              setMedQuery('');
                              setMedResults([]);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-orange-50 rounded-xl text-[10px] text-gray-700 flex justify-between font-medium cursor-pointer"
                          >
                            <span>{stock.itemName} (Pack: {stock.packType || stock.pack})</span>
                            <span className="font-mono text-orange-700 font-bold bg-orange-50 px-1.5 py-0.5 rounded-md">Batch: {stock.batch} | Qty: {stock.quantity}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-gray-555 mb-1">Description</label>
                  <input
                    type="text"
                    className="input py-2 text-xs border-orange-200"
                    placeholder="e.g. Pain reliever and fever reducer"
                    value={activeItem.description || ''}
                    onChange={(e) => setActiveItem({ ...activeItem, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-550 mb-1">Dosage Form</label>
                  <input
                    type="text"
                    className="input py-2 text-xs border-orange-200"
                    placeholder="e.g. Tablet"
                    value={activeItem.dosageForm || ''}
                    onChange={(e) => setActiveItem({ ...activeItem, dosageForm: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-555 mb-1">Pack Type</label>
                  <input
                    type="text"
                    className="input py-2 text-xs border-orange-200"
                    placeholder="e.g. strip, bottle"
                    value={activeItem.packType || ''}
                    onChange={(e) => setActiveItem({ ...activeItem, packType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-550 mb-1">Unit/Pack *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input py-2 text-xs border-orange-200 font-bold"
                    value={activeItem.unitsPerPack || 1}
                    onChange={(e) => setActiveItem({ ...activeItem, unitsPerPack: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-550 mb-1">Low Stock Threshold (Units) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="input py-2 text-xs border-orange-200 font-bold"
                    value={activeItem.thresholdMedicineNumber !== undefined ? activeItem.thresholdMedicineNumber : 10}
                    onChange={(e) => setActiveItem({ ...activeItem, thresholdMedicineNumber: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-550 mb-1">HSN Code</label>
                  <input
                    type="text"
                    className="input py-2 text-xs font-mono border-orange-200"
                    value={activeItem.hsn || ''}
                    onChange={(e) => setActiveItem({ ...activeItem, hsn: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Pricing, Quantities and Taxes */}
              <div className="space-y-3.5">
                <div>
                  <label className="block font-bold text-gray-555 mb-1">Batch No *</label>
                  <input
                    type="text"
                    required
                    className="input py-2 text-xs font-mono border-orange-200"
                    placeholder="e.g. B-39"
                    value={activeItem.batch || ''}
                    onChange={(e) => setActiveItem({ ...activeItem, batch: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-550 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    className="input py-2 text-xs border-orange-200 font-semibold"
                    value={activeItem.expiry || ''}
                    onChange={(e) => setActiveItem({ ...activeItem, expiry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-550 mb-1">Qty (Packs) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input py-2 text-xs border-orange-200 font-bold"
                    value={activeItem.quantity || ''}
                    onChange={(e) => setActiveItem({ ...activeItem, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-555 mb-1">Purchase Rate Ex GST (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="input py-2 text-xs border-orange-200 font-bold"
                    value={activeItem.purchaseRateExGst || ''}
                    onChange={(e) => setActiveItem({ ...activeItem, purchaseRateExGst: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-550 mb-1">Selling Rate Ex GST (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="input py-2 text-xs border-orange-200 font-bold"
                    value={activeItem.sellingRateExGst || ''}
                    onChange={(e) => setActiveItem({ ...activeItem, sellingRateExGst: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-[10px] text-gray-555 mb-1">Dis %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input py-2 text-xs border-orange-200 text-center"
                      value={activeItem.discountPercent || ''}
                      onChange={(e) => setActiveItem({ ...activeItem, discountPercent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[10px] text-gray-550 mb-1">CGST %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input py-2 text-xs border-orange-200 text-center"
                      value={activeItem.cgst || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setActiveItem(prev => ({
                          ...prev,
                          cgst: val,
                          sellingCgst: prev.isSameGstAsPurchase ? val : prev.sellingCgst
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[10px] text-gray-555 mb-1">SGST %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input py-2 text-xs border-orange-200 text-center"
                      value={activeItem.sgst || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setActiveItem(prev => ({
                          ...prev,
                          sgst: val,
                          sellingSgst: prev.isSameGstAsPurchase ? val : prev.sellingSgst
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="border-t border-orange-100 pt-3 space-y-3">
                  <label className="flex items-center gap-2 font-bold text-gray-555 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-orange-355 text-orange-600 focus:ring-orange-500 h-4 w-4"
                      checked={activeItem.isSameGstAsPurchase || false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setActiveItem(prev => ({
                          ...prev,
                          isSameGstAsPurchase: checked,
                          sellingCgst: checked ? prev.cgst : prev.sellingCgst,
                          sellingSgst: checked ? prev.sgst : prev.sellingSgst
                        }));
                      }}
                    />
                    Selling GST Same as Purchase GST
                  </label>

                  {!activeItem.isSameGstAsPurchase && (
                    <div className="grid grid-cols-2 gap-2 bg-orange-50/10 p-3 rounded-xl border border-orange-100">
                      <div>
                        <label className="block font-bold text-[10px] text-gray-550 mb-1">Selling CGST %</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input py-2 text-xs border-orange-200 text-center font-bold"
                          value={activeItem.sellingCgst || ''}
                          onChange={(e) => setActiveItem({ ...activeItem, sellingCgst: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[10px] text-gray-550 mb-1">Selling SGST %</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input py-2 text-xs border-orange-200 text-center font-bold"
                          value={activeItem.sellingSgst || ''}
                          onChange={(e) => setActiveItem({ ...activeItem, sellingSgst: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Real-time calculated values summary preview */}
            <div className="bg-orange-50/20 p-4 rounded-2xl border border-orange-100 flex flex-wrap justify-between gap-4 font-bold text-gray-555 text-[10px] mt-4">
              <div>
                <span className="block text-gray-400">GROSS AMOUNT</span>
                <span className="text-xs font-black text-gray-800">₹{modalGross.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-gray-400">DISCOUNT ({activeItem.discountPercent}%)</span>
                <span className="text-xs font-black text-red-500">- ₹{modalDiscAmt.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-gray-400">TAX (CGST+SGST)</span>
                <span className="text-xs font-black text-gray-800">₹{modalGstAmt.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-gray-400">SELLING MRP (INC GST)</span>
                <span className="text-xs font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">₹{modalMrpIncGst.toFixed(2)}</span>
              </div>
              <div className="border-l border-orange-100 pl-4">
                <span className="block text-gray-400 uppercase text-orange-600">LINE ITEM TOTAL</span>
                <span className="text-sm font-black text-orange-700">₹{modalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-orange-50 pt-3">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="btn-secondary py-2.5 px-6 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveModalItem}
                className="btn py-2.5 px-6 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10"
              >
                <CheckCircle className="h-4 w-4" /> Save Line Item
              </button>
            </div>
          </div>
        </div>
      )}

    </form>
  );
};
const PurchaseHistoryView = ({ onEditClick }) => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals view states
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  // Return forms
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/pharmacy/purchases?search=${encodeURIComponent(search)}&fromDate=${fromDate}&toDate=${toDate}`;
      const { data } = await client.get(url);
      setPurchases(data);
    } catch (err) {
      toast.error('Failed to load purchase history records.');
    } finally {
      setLoading(false);
    }
  }, [search, fromDate, toDate]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Open detail preview modal
  const handleViewDetails = (p) => {
    setSelectedPurchase(p);
    setShowDetailModal(true);
  };

  // Open return modal
  const handleOpenReturnModal = (p) => {
    setSelectedPurchase(p);
    setReturnReason('');
    setReturnItems(p.items.map(it => ({
      itemName: it.itemName,
      batch: it.batch,
      expiry: it.expiry,
      purchasedQty: it.quantity,
      returnedQty: it.returnedQty || 0,
      qtyToReturn: 0,
      rate: it.rate,
      mrp: it.mrp,
      cgst: it.cgst || 0,
      sgst: it.sgst || 0,
      igst: it.igst || 0,
      discountPercent: it.discountPercent || 0
    })));
    setShowReturnModal(true);
  };

  const handleReturnQtyChange = (idx, val) => {
    const updated = [...returnItems];
    const item = updated[idx];
    const maxReturnable = item.purchasedQty - item.returnedQty;
    const qty = Math.min(maxReturnable, Math.max(0, parseInt(val) || 0));
    updated[idx].qtyToReturn = qty;
    setReturnItems(updated);
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();

    if (!returnReason.trim()) {
      toast.error('Please input a reason for the purchase return.');
      return;
    }

    const itemsToSend = returnItems.filter(it => it.qtyToReturn > 0).map(it => ({
      itemName: it.itemName,
      batch: it.batch,
      quantityReturned: it.qtyToReturn
    }));

    if (itemsToSend.length === 0) {
      toast.error('Please specify return quantities greater than 0 for at least one item.');
      return;
    }

    setSubmittingReturn(true);
    try {
      await client.post(`/pharmacy/purchases/${selectedPurchase._id}/returns`, {
        reason: returnReason.trim(),
        itemsReturned: itemsToSend
      });
      toast.success('Purchase return processed successfully. Stock updated.');
      setShowReturnModal(false);
      fetchPurchases();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing purchase return.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const triggerA4Print = (p) => {
    // We add clean print styling classes to body and call browser print
    setSelectedPurchase(p);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-4">
      {/* Search filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-orange-50/10 p-4 rounded-2xl border border-orange-100/50">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            className="input pl-10 py-2 text-xs font-semibold"
            placeholder="Search by Invoice / Supplier / Receiver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3.5 top-2.5 text-orange-400 h-4 w-4" />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center text-xs">
          <span className="font-bold text-gray-500">Date Filter:</span>
          <input
            type="date"
            className="input py-1.5 text-xs font-semibold max-w-[130px]"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span className="text-gray-400 font-bold">to</span>
          <input
            type="date"
            className="input py-1.5 text-xs font-semibold max-w-[130px]"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-red-500 font-bold hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* History table */}
      <div className="card overflow-hidden bg-white border border-orange-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3.5 pl-4">Invoice No</th>
                <th className="p-3.5">Supplier Name</th>
                <th className="p-3.5">Invoice Date</th>
                <th className="p-3.5 text-right">Total (₹)</th>
                <th className="p-3.5 text-right text-green-700">Paid (₹)</th>
                <th className="p-3.5 text-right text-red-650">Pending (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Received By</th>
                <th className="p-3.5 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 font-semibold text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500 inline mr-2" /> Loading purchase records...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-400 font-bold">
                    No purchase invoices logged in selected range.
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p._id} className="hover:bg-orange-50/10">
                    <td className="p-3.5 pl-4 font-mono font-bold text-orange-700">{p.purchaseInvoiceNumber}</td>
                    <td className="p-3.5 font-bold text-gray-800">{p.supplierId?.name || p.supplierName || 'Direct Purchase'}</td>
                    <td className="p-3.5 text-gray-500">{new Date(p.invoiceDate).toLocaleDateString('en-GB')}</td>
                    <td className="p-3.5 text-right font-black text-gray-800">₹{p.totalAmount.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-bold text-green-700">₹{p.paidAmount.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-bold text-red-650">₹{p.pendingAmount.toFixed(2)}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        p.purchaseStatus === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                        p.purchaseStatus === 'Returned' ? 'bg-red-50 text-red-750 border border-red-200' :
                        'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        {p.purchaseStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-550">{p.receivedBy}</td>
                    <td className="p-3.5 pr-4 text-center flex items-center justify-center gap-1">
                      <button type="button" onClick={() => handleViewDetails(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer" title="View details">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => triggerA4Print(p)} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-xl transition cursor-pointer" title="Print GRN">
                        <Printer className="h-4 w-4" />
                      </button>
                      {p.purchaseStatus !== 'Returned' && (
                        <button type="button" onClick={() => onEditClick(p._id)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-xl transition cursor-pointer" title="Edit invoice details">
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {p.purchaseStatus !== 'Returned' && (
                        <button type="button" onClick={() => handleOpenReturnModal(p)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer" title="Return items to supplier">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail overlay Modal */}
      {showDetailModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full border border-orange-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-orange-50 pb-2.5">
              <h3 className="font-black text-gray-800 text-sm flex items-center gap-1.5">
                <FileText className="text-orange-500 h-4.5 w-4.5" />
                GRN Details - Invoice: {selectedPurchase.purchaseInvoiceNumber}
              </h3>
              <button type="button" onClick={() => { setShowDetailModal(false); setSelectedPurchase(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] font-semibold text-gray-550 bg-orange-50/10 p-4 rounded-xl">
              <div>
                <span className="block font-bold text-gray-400">SUPPLIER:</span>
                <span className="text-gray-800 text-xs font-extrabold">{selectedPurchase.supplierId?.name || selectedPurchase.supplierName || 'Direct Purchase'}</span>
                {selectedPurchase.supplierId?.code && <span className="block font-mono text-[10px]">({selectedPurchase.supplierId.code})</span>}
              </div>
              <div>
                <span className="block font-bold text-gray-400">INVOICE DATE:</span>
                <span className="text-gray-800 font-bold">{new Date(selectedPurchase.invoiceDate).toLocaleDateString('en-GB')}</span>
              </div>
              <div>
                <span className="block font-bold text-gray-400">PAYMENT TERMS:</span>
                <span className="text-gray-800 font-black">{selectedPurchase.paymentType}</span>
              </div>
            </div>

            <div className="border border-orange-50 rounded-xl overflow-hidden text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-orange-50/30 font-bold text-gray-500 border-b border-orange-50">
                    <th className="p-2.5 pl-3">Medicine Name</th>
                    <th className="p-2.5">Batch</th>
                    <th className="p-2.5">Expiry</th>
                    <th className="p-2.5 text-center">Pack Type</th>
                    <th className="p-2.5 text-center">Units/Pack</th>
                    <th className="p-2.5 text-center">Qty (Packs)</th>
                    <th className="p-2.5 text-right">Purchase Rate Ex GST (₹)</th>
                    <th className="p-2.5 text-right">Selling Rate Ex GST (₹)</th>
                    <th className="p-2.5 text-center">CGST %</th>
                    <th className="p-2.5 text-center">SGST %</th>
                    <th className="p-2.5 text-right pr-3">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 text-gray-700 font-medium">
                  {selectedPurchase.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/5">
                      <td className="p-2.5 pl-3 font-bold text-gray-800">
                        <div>{it.itemName}</div>
                        {it.description && <div className="text-[9px] text-gray-400 font-normal">{it.description}</div>}
                      </td>
                      <td className="p-2.5 font-mono text-gray-650">{it.batch}</td>
                      <td className="p-2.5 text-gray-500">{new Date(it.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</td>
                      <td className="p-2.5 text-center">{it.packType || it.pack || '0'}</td>
                      <td className="p-2.5 text-center">{it.unitsPerPack || 1}</td>
                      <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                      <td className="p-2.5 text-right font-mono">₹{(it.purchaseRateExGst || it.rate || 0).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono">₹{(it.sellingRateExGst || 0).toFixed(2)}</td>
                      <td className="p-2.5 text-center font-mono">{(it.cgst || 0).toFixed(0)}%</td>
                      <td className="p-2.5 text-center font-mono">{(it.sgst || 0).toFixed(0)}%</td>
                      <td className="p-2.5 text-right pr-3 font-mono font-bold text-gray-800">₹{it.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end text-[11px] font-semibold text-gray-550 gap-6 border-t border-orange-50 pt-3.5">
              <div className="space-y-1.5 text-right min-w-[200px]">
                <div className="flex justify-between">
                  <span>Grand Total:</span>
                  <span className="font-black text-gray-800">₹{selectedPurchase.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Paid:</span>
                  <span className="font-extrabold">₹{selectedPurchase.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-650 font-bold border-t border-orange-50 pt-1.5">
                  <span>Pending:</span>
                  <span className="font-black">₹{selectedPurchase.pendingAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <SupplierPaymentSection purchase={selectedPurchase} onPaymentLogged={() => {
              fetchPurchases();
              client.get(`/pharmacy/purchases/${selectedPurchase._id}`).then(res => {
                setSelectedPurchase(res.data);
              });
            }} />

            <div className="flex justify-end gap-2 border-t border-orange-50 pt-3">
              <button type="button" onClick={() => triggerA4Print(selectedPurchase)} className="btn-secondary text-xs py-2 px-5 font-bold flex items-center gap-1.5 cursor-pointer">
                <Printer className="h-4 w-4" /> Print GRN Document
              </button>
              <button type="button" onClick={() => { setShowDetailModal(false); setSelectedPurchase(null); }} className="btn text-xs py-2 px-5 font-bold cursor-pointer">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmitReturn} className="bg-white rounded-3xl p-6 max-w-3xl w-full border border-orange-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-orange-50 pb-2.5">
              <h3 className="font-black text-red-650 text-sm flex items-center gap-1.5">
                <RotateCcw className="h-4.5 w-4.5" />
                Deduct & Return Items - Invoice: {selectedPurchase.purchaseInvoiceNumber}
              </h3>
              <button type="button" onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block font-bold text-gray-550 text-xs">Return Reason / Memo *</label>
              <input
                type="text"
                className="input py-2 text-xs"
                required
                placeholder="e.g. Near expiry items, Damaged packaging, Rate difference"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>

            <div className="border border-orange-50 rounded-xl overflow-hidden text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-orange-50/30 font-bold text-gray-500 border-b border-orange-50">
                    <th className="p-2.5 pl-3">Medicine</th>
                    <th className="p-2.5">Batch</th>
                    <th className="p-2.5 text-center">Purchased Qty</th>
                    <th className="p-2.5 text-center">Already Returned</th>
                    <th className="p-2.5 text-center w-[120px]">Qty to Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 text-gray-700 font-medium">
                  {returnItems.map((it, idx) => {
                    const maxReturn = it.purchasedQty - it.returnedQty;
                    return (
                      <tr key={idx} className="hover:bg-orange-50/5 align-middle">
                        <td className="p-2.5 pl-3 font-bold text-gray-800">{it.itemName}</td>
                        <td className="p-2.5 font-mono text-gray-650">{it.batch}</td>
                        <td className="p-2.5 text-center">{it.purchasedQty}</td>
                        <td className="p-2.5 text-center text-red-500 font-bold">{it.returnedQty}</td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxReturn}
                            disabled={maxReturn <= 0}
                            className="input py-1 text-center font-bold max-w-[80px]"
                            placeholder="0"
                            value={it.qtyToReturn || ''}
                            onChange={(e) => handleReturnQtyChange(idx, e.target.value)}
                          />
                          <span className="block text-[9px] text-gray-400 font-semibold mt-0.5">Max: {maxReturn}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
              <button type="button" onClick={() => setShowReturnModal(false)} className="btn-secondary text-xs py-2 px-5 font-bold cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={submittingReturn} className="btn bg-red-600 hover:bg-red-750 text-white text-xs py-2.5 px-6 font-bold shadow-md cursor-pointer disabled:bg-orange-300">
                {submittingReturn ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirm Return & Adjust Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* A4 Print layout container hidden from screen, visible during browser printing */}
      {selectedPurchase && (
        <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:p-8 text-[11px] font-semibold text-gray-700">
          <div className="border-b border-orange-200 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase">GOODS RECEIVED NOTE (GRN)</h2>
              <span className="text-xs font-mono font-bold text-orange-700">Invoice: {selectedPurchase.purchaseInvoiceNumber}</span>
            </div>
            <div className="text-right">
              <h3 className="font-extrabold text-sm">{user?.hospitalName || 'Hospital Management System'}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Date Printed: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="block font-black text-gray-400 text-[9px] uppercase">Supplier Details:</span>
              <p className="font-black text-gray-800 mt-0.5">{selectedPurchase.supplierId?.name || selectedPurchase.supplierName || 'Direct Purchase'}</p>
              {selectedPurchase.supplierId?.code && <p className="font-mono text-[10px] mt-0.5">Code: {selectedPurchase.supplierId.code}</p>}
              {selectedPurchase.supplierId?.gstin && <p className="font-mono text-[10px] mt-0.5">GSTIN: {selectedPurchase.supplierId.gstin}</p>}
            </div>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="block font-black text-gray-400 text-[9px] uppercase">Settlement Details:</span>
              <p className="mt-0.5">Invoice Date: <span className="font-black text-gray-800">{new Date(selectedPurchase.invoiceDate).toLocaleDateString('en-GB')}</span></p>
              <p className="mt-0.5">Received Date: <span className="font-black text-gray-800">{new Date(selectedPurchase.receiveDate).toLocaleDateString('en-GB')}</span></p>
              <p className="mt-0.5">Payment Type: <span className="font-black text-gray-800">{selectedPurchase.paymentType}</span></p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 font-bold text-gray-500 border-b border-gray-200 text-[10px]">
                  <th className="p-2 pl-3">Item Name</th>
                  <th className="p-2">Batch</th>
                  <th className="p-2">Expiry</th>
                  <th className="p-2 text-center">Pack Type</th>
                  <th className="p-2 text-center">Units/Pack</th>
                  <th className="p-2 text-center">Qty (Packs)</th>
                  <th className="p-2 text-right">Purchase Rate Ex GST (₹)</th>
                  <th className="p-2 text-right">Selling Rate Ex GST (₹)</th>
                  <th className="p-2 text-center">CGST %</th>
                  <th className="p-2 text-center">SGST %</th>
                  <th className="p-2 text-right pr-3">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700 text-[10px]">
                {selectedPurchase.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 pl-3 font-bold text-gray-800">
                      <div>{it.itemName}</div>
                      {it.description && <div className="text-[8px] text-gray-400 font-normal">{it.description}</div>}
                    </td>
                    <td className="p-2 font-mono text-gray-655">{it.batch}</td>
                    <td className="p-2 text-gray-500">{new Date(it.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</td>
                    <td className="p-2 text-center">{it.packType || it.pack || '0'}</td>
                    <td className="p-2 text-center">{it.unitsPerPack || 1}</td>
                    <td className="p-2 text-center font-bold">{it.quantity}</td>
                    <td className="p-2 text-right font-mono">₹{(it.purchaseRateExGst || it.rate || 0).toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">₹{(it.sellingRateExGst || 0).toFixed(2)}</td>
                    <td className="p-2 text-center font-mono">{(it.cgst || 0).toFixed(0)}%</td>
                    <td className="p-2 text-center font-mono">{(it.sgst || 0).toFixed(0)}%</td>
                    <td className="p-2 text-right pr-3 font-mono font-bold text-gray-800">₹{it.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-start border-t border-gray-200 pt-4">
            <div>
              <span className="block font-bold text-gray-400 text-[9px] uppercase">Notes:</span>
              <p className="text-[10px] text-gray-500 italic">{selectedPurchase.notes || 'No invoice notes recorded.'}</p>
              <p className="text-[10px] text-gray-600 mt-2 font-bold">Received By: {selectedPurchase.receivedBy}</p>
            </div>
            <div className="space-y-1 text-right min-w-[200px]">
              <div className="flex justify-between">
                <span>Grand Total:</span>
                <span className="font-black text-gray-850">₹{selectedPurchase.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-bold">
                <span>Amount Paid:</span>
                <span>₹{selectedPurchase.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-650 font-bold border-t border-gray-200 pt-1.5">
                <span>Balance Pending:</span>
                <span className="font-black">₹{selectedPurchase.pendingAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-20 text-[10px] font-bold text-gray-400">
            <div className="text-center w-[150px] border-t border-gray-300 pt-2">
              Pharmacist Signature
            </div>
            <div className="text-center w-[150px] border-t border-gray-300 pt-2">
              Store Manager Verify
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BillingReportsView = () => {
  const [reportType, setReportType] = useState('sales'); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      const { data: res } = await client.get(`/pharmacy/billing/reports?reportType=${reportType}`);
      setData(res);
    } catch (err) {
      toast.error('Failed to fetch report analytics');
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return (
    <div className="space-y-6 animate-fade-in text-gray-700">
      
      {/* Report selector tabs */}
      <div className="flex border-b border-orange-200 gap-1.5">
        {[
          { label: 'Sales Reports & Analytics', code: 'sales', icon: BarChart3 },
          { label: 'Financial & Tax Audits', code: 'financial', icon: BadgeIndianRupee },
          { label: 'Inventory Stocks & Movements', code: 'inventory', icon: Package }
        ].map(tab => (
          <button 
            key={tab.code}
            onClick={() => setReportType(tab.code)}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              reportType === tab.code 
                ? 'border-orange-500 text-orange-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500 mb-2" />
          <p className="text-xs text-gray-400 font-bold">Compiling analytics reports...</p>
        </div>
      ) : !data ? (
        <div className="py-20 text-center text-gray-400 font-bold">
          No data available.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Sales Report Type */}
          {reportType === 'sales' && (
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Daily Sales Card */}
              <div className="card p-5 space-y-3.5 bg-white">
                <h4 className="font-extrabold text-gray-800 text-sm border-b border-orange-50 pb-2">
                  Daily Sales History (Last 30 Days)
                </h4>
                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                  {data.dailySales?.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center font-semibold">No daily sales logged yet.</p>
                  ) : (
                    data.dailySales?.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-orange-50/30 last:border-0 font-semibold text-gray-700">
                        <span>{new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span className="font-bold text-green-700">₹{d.amount.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Selling Medicines */}
              <div className="card p-5 space-y-3.5 bg-white">
                <h4 className="font-extrabold text-gray-800 text-sm border-b border-orange-50 pb-2">
                  Top Selling Medicines (By Unit volume)
                </h4>
                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                  {data.medicineSales?.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center font-semibold">No medicine sales registered yet.</p>
                  ) : (
                    data.medicineSales?.map((m, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-orange-50/30 last:border-0 font-semibold text-gray-700">
                        <div>
                          <p className="font-extrabold text-gray-805">{m.medicine}</p>
                          <span className="text-[10px] text-gray-400 font-semibold">Sold: {m.quantity} units</span>
                        </div>
                        <span className="font-bold text-green-700">₹{m.revenue.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Monthly Sales Performance */}
              <div className="card p-5 space-y-3.5 bg-white">
                <h4 className="font-extrabold text-gray-800 text-sm border-b border-orange-50 pb-2">
                  Monthly Performance Ledger
                </h4>
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {data.monthlySales?.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center font-semibold">No monthly performance available.</p>
                  ) : (
                    data.monthlySales?.map((m, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-orange-50/30 last:border-0 font-bold text-gray-755">
                        <span>{new Date(m.month + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                        <span className="text-green-700">₹{m.amount.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Doctor Referral Sales */}
              <div className="card p-5 space-y-3.5 bg-white">
                <h4 className="font-extrabold text-gray-800 text-sm border-b border-orange-50 pb-2">
                  Sales by Referring Consultant
                </h4>
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {data.doctorSales?.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center font-semibold">No referral records.</p>
                  ) : (
                    data.doctorSales?.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-orange-50/30 last:border-0 font-semibold text-gray-700">
                        <span>{d.doctor}</span>
                        <span className="font-bold text-green-700">₹{d.amount.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Financial Report Type */}
          {reportType === 'financial' && (
            <div className="space-y-6">
              
              {/* Outstanding Balance Dues */}
              <div className="card p-5 space-y-4 bg-white border border-orange-100">
                <h4 className="font-black text-red-750 text-sm border-b border-red-50 pb-2 flex items-center gap-2">
                  <AlertTriangle className="text-red-500 h-4.5 w-4.5" />
                  Outstanding Customer / Patient Balances
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-red-50/30 text-gray-600 font-bold border-b border-red-100">
                        <th className="p-2.5 pl-3">Bill No</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Customer Name</th>
                        <th className="p-2.5 text-right">Invoice Sum</th>
                        <th className="p-2.5 text-right text-green-700">Paid So Far</th>
                        <th className="p-2.5 text-right text-red-600">Balance Due</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50/40">
                      {data.outstandingPayments?.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-gray-400 font-bold">
                            No active outstanding balances. All accounts cleared!
                          </td>
                        </tr>
                      ) : (
                        data.outstandingPayments?.map((o, idx) => (
                          <tr key={idx} className="hover:bg-red-50/10 align-middle">
                            <td className="p-2.5 pl-3 font-mono font-bold text-orange-700">{o.billNumber}</td>
                            <td className="p-2.5 text-[10px] text-gray-500">{new Date(o.date).toLocaleDateString('en-IN')}</td>
                            <td className="p-2.5 font-bold text-gray-800">{o.customerName}</td>
                            <td className="p-2.5 text-right font-bold text-gray-700">₹{o.grandTotal.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-bold text-green-700">₹{o.paidAmount.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-black text-red-655 font-mono">₹{o.balanceAmount.toFixed(2)}</td>
                            <td className="p-2.5 text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 uppercase">
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mini ledger logs */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="card p-5 space-y-3 bg-white">
                  <h4 className="font-extrabold text-gray-800 text-sm border-b border-orange-50 pb-2">
                    Recent Tax Receipts (GST Collection)
                  </h4>
                  <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 text-xs">
                    {data.gstReport?.length === 0 ? (
                      <p className="text-gray-400 py-6 text-center font-semibold">No tax receipts.</p>
                    ) : (
                      data.gstReport?.map((g, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-orange-50/30 last:border-0 font-bold">
                          <span>{g.billNumber} <span className="text-[10px] font-normal text-gray-400 ml-1">({new Date(g.date).toLocaleDateString('en-IN')})</span></span>
                          <span className="text-purple-700 font-mono">₹{g.amount.toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="card p-5 space-y-3 bg-white">
                  <h4 className="font-extrabold text-gray-800 text-sm border-b border-orange-50 pb-2">
                    Recent Invoice Discounts Extended
                  </h4>
                  <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 text-xs">
                    {data.discountReport?.length === 0 ? (
                      <p className="text-gray-400 py-6 text-center font-semibold">No invoice discounts recorded.</p>
                    ) : (
                      data.discountReport?.map((g, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-orange-50/30 last:border-0 font-bold">
                          <span>{g.billNumber} <span className="text-[10px] font-normal text-gray-400 ml-1">({new Date(g.date).toLocaleDateString('en-IN')})</span></span>
                          <span className="text-red-650">₹{g.amount.toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Report Type */}
          {reportType === 'inventory' && (
            <div className="space-y-6">
              
              {/* Critical safety stock levels */}
              <div className="card p-5 space-y-3.5 bg-white border border-orange-100">
                <h4 className="font-extrabold text-gray-800 text-sm border-b border-orange-50 pb-2 flex items-center gap-1.5">
                  <AlertTriangle className="text-yellow-600 h-4.5 w-4.5" />
                  Inventory Low-Stock Warning List
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 max-h-[220px] overflow-y-auto pr-1">
                  {data.lowStock?.length === 0 ? (
                    <p className="col-span-full text-xs text-gray-400 py-6 text-center font-semibold">All inventory item counts are safe (above 50 units).</p>
                  ) : (
                    data.lowStock?.map((it, i) => (
                      <div key={i} className="p-3 bg-yellow-50/50 border border-yellow-100 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-gray-800">{it.itemName}</p>
                          <span className="text-[9px] text-gray-400 font-mono">Batch: {it.batch}</span>
                        </div>
                        <span className="font-black text-red-655 font-mono">{it.quantity} Left</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fast / Slow Moving Medicines */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="card p-5 space-y-3.5 bg-white">
                  <h4 className="font-extrabold text-gray-800 text-sm border-b border-orange-50 pb-2 text-green-800">
                    Fast Moving Stocks (Highest volume sales)
                  </h4>
                  <div className="space-y-2 text-xs">
                    {data.fastMoving?.length === 0 ? (
                      <p className="text-gray-400 py-6 text-center font-semibold">No records yet.</p>
                    ) : (
                      data.fastMoving?.map((f, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-orange-55/30 last:border-0 font-semibold text-gray-700">
                          <span>{f.medicine}</span>
                          <span className="font-black text-green-700 bg-green-50 px-2 py-0.5 rounded font-mono">{f.quantity} units sold</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="card p-5 space-y-3.5 bg-white">
                  <h4 className="font-extrabold text-gray-800 text-sm border-b border-orange-50 pb-2 text-orange-850">
                    Slow Moving Stocks (Lowest volume sales)
                  </h4>
                  <div className="space-y-2 text-xs">
                    {data.slowMoving?.length === 0 ? (
                      <p className="text-gray-400 py-6 text-center font-semibold">No records yet.</p>
                    ) : (
                      data.slowMoving?.map((f, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-orange-55/30 last:border-0 font-semibold text-gray-700">
                          <span>{f.medicine}</span>
                          <span className="font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded font-mono">{f.quantity} units sold</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Movement History log */}
              <div className="card p-5 space-y-4 bg-white border border-orange-100">
                <h4 className="font-extrabold text-gray-855 text-sm border-b border-orange-50 pb-2">
                  Inventory Stock Movement History Logs (Last 50 entries)
                </h4>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-orange-50/30 text-gray-600 font-bold border-b border-orange-100">
                        <th className="p-2.5 pl-3">Timestamp</th>
                        <th className="p-2.5">Medicine Name</th>
                        <th className="p-2.5">Batch</th>
                        <th className="p-2.5 text-center">Movement Type</th>
                        <th className="p-2.5 text-right">Adjustment Qty</th>
                        <th className="p-2.5 text-right">Stock (Before &rarr; After)</th>
                        <th className="p-2.5 pr-3">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {data.movements?.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-gray-400 font-bold">
                            No inventory movement adjustments logged yet.
                          </td>
                        </tr>
                      ) : (
                        data.movements?.map((m, idx) => (
                          <tr key={idx} className="hover:bg-orange-50/10 align-middle">
                            <td className="p-2.5 pl-3 text-[10px] text-gray-400 font-semibold">
                              {new Date(m.timestamp).toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 font-bold text-gray-800">{m.itemName}</td>
                            <td className="p-2.5 font-mono text-gray-500 font-bold">{m.batch}</td>
                            <td className="p-2.5 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                                m.type === 'Excel Upload' ? 'bg-green-100 text-green-800 border-green-200' :
                                m.type === 'Sale' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                m.type === 'Sales Return' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                                {m.type}
                              </span>
                            </td>
                            <td className={`p-2.5 text-right font-black ${m.quantity > 0 ? 'text-green-700' : m.quantity < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                            </td>
                            <td className="p-2.5 text-right font-mono text-[10px] text-gray-450 font-semibold">
                              {m.previousStock} &rarr; {m.newStock}
                            </td>
                            <td className="p-2.5 pr-3 font-semibold text-gray-655">
                              {m.performedBy?.username || 'System'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== GST REPORTS VIEW ====================
const GstReportsView = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchGstLedger = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await client.get('/pharmacy/billing/reports?reportType=financial');
      setData(res.gstReport || []);
    } catch (err) {
      toast.error('Failed to load GST reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGstLedger();
  }, [fetchGstLedger]);

  const handleDownloadExcel = () => {
    if (data.length === 0) {
      toast.error('No tax records to export.');
      return;
    }

    const filtered = data.filter(g => {
      const gDate = new Date(g.date);
      if (fromDate && gDate < new Date(fromDate)) return false;
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59, 999);
        if (gDate > tDate) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      toast.error('No matching records in date range.');
      return;
    }

    // Prepare rows for excel output
    const rows = filtered.map((g, idx) => {
      const cgst = g.amount / 2;
      const sgst = g.amount / 2;
      const totalTax = g.amount;
      return {
        'SNo.': idx + 1,
        'Bill Number': g.billNumber,
        'Billing Date': g.date,
        'CGST Collection (₹)': cgst.toFixed(2),
        'SGST Collection (₹)': sgst.toFixed(2),
        'Total GST Collected (₹)': totalTax.toFixed(2)
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GST tax ledger');
    XLSX.writeFile(workbook, `GST_TAX_REPORT_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('GST tax ledger downloaded successfully.');
  };

  const filteredData = data.filter(g => {
    const gDate = new Date(g.date);
    if (fromDate && gDate < new Date(fromDate)) return false;
    if (toDate) {
      const tDate = new Date(toDate);
      tDate.setHours(23, 59, 59, 999);
      if (gDate > tDate) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in text-gray-700">
      
      {/* Search filters */}
      <div className="card p-5 space-y-4 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className="text-xs font-bold text-gray-500">Date Range:</span>
            <input 
              type="date" 
              className="input py-2 text-xs font-semibold" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="text-xs text-gray-400 font-bold">to</span>
            <input 
              type="date" 
              className="input py-2 text-xs font-semibold" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button 
            type="button"
            onClick={handleDownloadExcel}
            className="btn-secondary py-2.5 px-5 text-xs font-bold flex items-center gap-1.5 border-orange-200 hover:bg-orange-50 cursor-pointer"
          >
            <Download className="h-4 w-4 text-orange-500" /> Export Excel Sheet
          </button>
        </div>
      </div>

      {/* Tax Ledger table */}
      <div className="card overflow-hidden bg-white shadow-sm border border-orange-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3.5 pl-4">Sno.</th>
                <th className="p-3.5">Invoice Bill No</th>
                <th className="p-3.5">Billing Date</th>
                <th className="p-3.5 text-right">CGST Ledger (50%)</th>
                <th className="p-3.5 text-right">SGST Ledger (50%)</th>
                <th className="p-3.5 text-right text-purple-700">Total GST Collection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500 inline mr-2" /> Loading ledger details...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400 font-bold">
                    No tax collections logged in selected range.
                  </td>
                </tr>
              ) : (
                filteredData.map((g, idx) => {
                  const cgst = g.amount / 2;
                  const sgst = g.amount / 2;
                  return (
                    <tr key={idx} className="hover:bg-orange-50/10 align-middle">
                      <td className="p-3.5 pl-4 font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-3.5 font-mono font-bold text-orange-700">{g.billNumber}</td>
                      <td className="p-3.5 text-gray-500 font-semibold">{new Date(g.date).toLocaleDateString('en-GB')}</td>
                      <td className="p-3.5 text-right font-bold text-gray-600">₹{cgst.toFixed(2)}</td>
                      <td className="p-3.5 text-right font-bold text-gray-600">₹{sgst.toFixed(2)}</td>
                      <td className="p-3.5 text-right font-black text-purple-750 font-mono">₹{g.amount.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== MEDICINE HISTORY LEDGER MODAL ====================
const MedicineHistoryModal = ({ itemName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (!itemName) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [batchesRes, ledgerRes] = await Promise.all([
          client.get(`/pharmacy/inventory?limit=100&search=${encodeURIComponent(itemName)}`),
          client.get(`/pharmacy/reports?reportType=stock-ledger&itemName=${encodeURIComponent(itemName)}`)
        ]);

        const batches = batchesRes.data.items || [];
        const ledger = ledgerRes.data || [];
        
        const currentQty = batches.reduce((sum, b) => sum + b.quantity, 0);
        
        const totalPurchased = ledger.filter(l => l.type === 'Purchase' || l.type === 'Excel Upload')
          .reduce((sum, l) => sum + Math.abs(l.quantity), 0);
          
        const totalSold = ledger.filter(l => l.type === 'Sale')
          .reduce((sum, l) => sum + Math.abs(l.quantity), 0);
          
        const totalReturned = ledger.filter(l => l.type === 'Sales Return' || l.type === 'Purchase Return')
          .reduce((sum, l) => sum + Math.abs(l.quantity), 0);

        setDetails({
          batches,
          ledger,
          currentQty,
          totalPurchased,
          totalSold,
          totalReturned
        });
      } catch (err) {
        toast.error('Failed to load medicine history ledger.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [itemName]);

  if (!itemName) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-4xl w-full border border-orange-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs text-gray-700">
        <div className="flex justify-between items-center border-b border-orange-50 pb-2.5">
          <h3 className="font-black text-gray-800 text-sm flex items-center gap-1.5">
            <Pill className="text-orange-500 h-4.5 w-4.5" />
            Medicine History Log: {itemName}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500 inline mr-2" /> Loading ledger history details...
          </div>
        ) : !details ? (
          <div className="p-4 text-center text-gray-400 font-bold">Failed to load history data.</div>
        ) : (
          <div className="space-y-4">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
              <div className="p-3 bg-orange-50/20 border border-orange-100 rounded-xl">
                <span className="text-[10px] text-gray-400 block uppercase">Current Stock</span>
                <span className="text-sm font-black text-orange-700 mt-1 block">{details.currentQty} Units</span>
              </div>
              <div className="p-3 bg-green-50/20 border border-green-100 rounded-xl">
                <span className="text-[10px] text-gray-400 block uppercase">Total Purchased</span>
                <span className="text-sm font-black text-green-700 mt-1 block">{details.totalPurchased} Units</span>
              </div>
              <div className="p-3 bg-blue-50/20 border border-blue-100 rounded-xl">
                <span className="text-[10px] text-gray-400 block uppercase">Total Sold</span>
                <span className="text-sm font-black text-blue-700 mt-1 block">{details.totalSold} Units</span>
              </div>
              <div className="p-3 bg-red-50/20 border border-red-100 rounded-xl">
                <span className="text-[10px] text-gray-400 block uppercase">Total Returned</span>
                <span className="text-sm font-black text-red-750 mt-1 block">{details.totalReturned} Units</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-gray-800 text-xs border-b border-orange-100 pb-1">Available Batches & Expiry</h4>
              <div className="overflow-x-auto border border-orange-50 rounded-xl bg-white">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-orange-50/20 font-bold text-gray-555 border-b border-orange-50">
                      <th className="p-2 pl-3">Batch No</th>
                      <th className="p-2">Expiry</th>
                      <th className="p-2 text-center">Available Qty</th>
                      <th className="p-2 text-right">mrp (Ex gst)</th>
                      <th className="p-2 text-right">mrp (Inc gst)</th>
                      <th className="p-2 text-right">purchase rate (Inc gst)</th>
                      <th className="p-2 text-right">purchase rate (Ex gst)</th>
                      <th className="p-2 pr-3">Supplier Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50 text-gray-700 font-semibold">
                    {details.batches.map((b, i) => (
                      <tr key={i} className="hover:bg-orange-50/5">
                        <td className="p-2 pl-3 font-mono font-bold text-orange-700">{b.batch}</td>
                        <td className="p-2 text-gray-555">{new Date(b.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</td>
                        <td className="p-2 text-center font-bold">{b.quantity}</td>
                        <td className="p-2 text-right font-mono">₹{(b.mrpExGst || b.rateExGst || 0).toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">₹{(b.mrp || 0).toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">₹{(b.purchaseRateIncGst || 0).toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">₹{(b.purchaseRateExGst || 0).toFixed(2)}</td>
                        <td className="p-2 pr-3 text-gray-550">
                          {b.supplierName || b.supplierId?.name || 'Excel Upload / System'}
                          {b.purchaseInvoiceNumber ? ` (Inv: ${b.purchaseInvoiceNumber})` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-gray-800 text-xs border-b border-orange-100 pb-1">Chronological Movement Ledger</h4>
              <div className="overflow-x-auto border border-orange-50 rounded-xl bg-white max-h-[220px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-orange-50/20 font-bold text-gray-500 border-b border-orange-50 sticky top-0">
                      <th className="p-2 pl-3">Date</th>
                      <th className="p-2">Batch</th>
                      <th className="p-2 text-center">Movement Qty</th>
                      <th className="p-2">Movement Type</th>
                      <th className="p-2">Remarks</th>
                      <th className="p-2 pr-3">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50 text-gray-700 font-semibold">
                    {details.ledger.map((l, i) => (
                      <tr key={i} className="hover:bg-orange-50/5 align-middle">
                        <td className="p-2 pl-3 text-gray-500">{new Date(l.timestamp).toLocaleDateString('en-GB')}</td>
                        <td className="p-2 font-mono text-gray-600">{l.batch}</td>
                        <td className={`p-2 text-center font-black ${l.quantity > 0 ? 'text-green-700' : 'text-red-650'}`}>
                          {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
                        </td>
                        <td className="p-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            l.type === 'Purchase' || l.type === 'Excel Upload' ? 'bg-green-50 text-green-700' :
                            l.type === 'Sale' ? 'bg-blue-50 text-blue-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>{l.type}</span>
                        </td>
                        <td className="p-2 text-gray-550 max-w-[200px] truncate" title={l.remarks}>{l.remarks || '-'}</td>
                        <td className="p-2 pr-3 text-gray-500 font-bold">{l.performedBy?.username || 'Staff'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end border-t border-orange-50 pt-3">
          <button type="button" onClick={onClose} className="btn text-xs py-2 px-5 font-bold cursor-pointer">
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== STOCK ADJUSTMENT VIEW ====================
const StockAdjustmentView = () => {
  const [form, setForm] = useState({ itemName: '', batch: '', quantity: 0, type: 'Decrease', reason: 'Damage', remarks: '', approvedBy: '' });
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await client.get(`/pharmacy/inventory?limit=10&search=${encodeURIComponent(query)}`);
        setSearchResults(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectMed = async (name) => {
    setForm(prev => ({ ...prev, itemName: name, batch: '' }));
    setQuery(name);
    setShowResults(false);
    setLoadingBatches(true);
    try {
      const { data } = await client.get(`/pharmacy/inventory?limit=100&search=${encodeURIComponent(name)}`);
      setBatches(data.items.filter(item => item.itemName.toLowerCase() === name.toLowerCase()));
    } catch (err) {
      toast.error('Failed to load batches.');
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemName || !form.batch || !form.quantity || form.quantity <= 0 || !form.reason) {
      toast.error('Please fill all required stock adjustment fields.');
      return;
    }

    setSubmitting(true);
    try {
      await client.post('/pharmacy/adjustments', form);
      toast.success('Physical stock adjustment recorded and ledger synchronized!');
      setForm({ itemName: '', batch: '', quantity: 0, type: 'Decrease', reason: 'Damage', remarks: '', approvedBy: '' });
      setQuery('');
      setBatches([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl text-xs text-gray-700">
      <div className="bg-orange-50/10 p-5 border border-orange-100 rounded-3xl space-y-4">
        <h4 className="font-extrabold text-gray-800 text-xs border-b border-orange-100 pb-2 flex items-center gap-1.5">
          <AlertCircle className="text-orange-500 h-4.5 w-4.5" /> Adjust Physical Stock Inventory
        </h4>

        <div className="relative">
          <label className="mb-1 block font-bold text-gray-550">Select Medicine *</label>
          <input
            type="text"
            className="input py-2 text-xs font-semibold"
            required
            placeholder="Type medicine name to search..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
          />
          {showResults && query && (
            <div className="absolute left-0 right-0 z-40 bg-white border border-orange-150 rounded-2xl shadow-xl max-h-[150px] overflow-y-auto mt-1 p-1">
              {searching ? (
                <div className="p-2 text-center text-gray-400 text-[10px]">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-2 text-center text-gray-400 text-[10px] font-bold">No match found.</div>
              ) : (
                searchResults.map(item => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleSelectMed(item.itemName)}
                    className="w-full text-left px-3 py-1.5 hover:bg-orange-50 rounded-xl text-[10px] text-gray-700 font-bold block cursor-pointer"
                  >
                    {item.itemName} (Pack: {item.pack})
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-bold text-gray-550">Target Batch *</label>
            <select
              className="input py-2 text-xs font-semibold"
              required
              disabled={loadingBatches || batches.length === 0}
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
            >
              <option value="">-- Choose Batch --</option>
              {batches.map(b => (
                <option key={b._id} value={b.batch}>
                  {b.batch} (Avail Qty: {b.quantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-bold text-gray-550">Adjustment Type *</label>
            <select
              className="input py-2 text-xs font-semibold"
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="Decrease">Deduct Stock (Breakage/Loss/Expired)</option>
              <option value="Increase">Add Stock (Manual Increase)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-bold text-gray-555">Quantity to Adjust *</label>
            <input
              type="number"
              min="1"
              className="input py-2 text-xs font-bold"
              required
              value={form.quantity || ''}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-gray-555">Primary Reason *</label>
            <select
              className="input py-2 text-xs font-semibold"
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            >
              <option value="Damage">Damage / Packaging Broken</option>
              <option value="Expiry">Expired Disposal</option>
              <option value="Lost">Lost / Discrepancy</option>
              <option value="Audit Adjustment">Physical Audit Correction</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-bold text-gray-550">Remarks</label>
            <input
              type="text"
              className="input py-2 text-xs"
              placeholder="e.g. Discarded under supervision"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-gray-550">Approved By Staff *</label>
            <input
              type="text"
              className="input py-2 text-xs font-bold"
              required
              placeholder="e.g. Dr. Roy or Store Head"
              value={form.approvedBy}
              onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn py-2.5 px-6 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:bg-orange-300 shadow-md shadow-orange-500/10"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Apply Stock Adjustment
        </button>
      </div>
    </form>
  );
};

// ==================== STOCK LEDGER VIEW ====================
const StockLedgerView = () => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/pharmacy/reports?reportType=stock-ledger&itemName=${encodeURIComponent(search)}&fromDate=${fromDate}&toDate=${toDate}`;
      const { data } = await client.get(url);
      setLedger(data);
    } catch (err) {
      toast.error('Failed to load stock ledger logs.');
    } finally {
      setLoading(false);
    }
  }, [search, fromDate, toDate]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  return (
    <div className="space-y-4 text-xs text-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-orange-50/10 p-4 border border-orange-100 rounded-2xl">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            className="input pl-9 py-2 text-xs font-semibold"
            placeholder="Search by Medicine Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-orange-400" />
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          <span className="font-bold text-gray-550">Dates:</span>
          <input
            type="date"
            className="input py-1.5 text-xs max-w-[130px]"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span className="text-gray-400 font-bold">to</span>
          <input
            type="date"
            className="input py-1.5 text-xs max-w-[130px]"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-orange-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3 pl-4">Date</th>
                <th className="p-3">Medicine</th>
                <th className="p-3">Batch</th>
                <th className="p-3 text-center">Opening Stock</th>
                <th className="p-3 text-center">Stock In</th>
                <th className="p-3 text-center">Stock Out</th>
                <th className="p-3 text-center">Closing Stock</th>
                <th className="p-3 text-center">Transaction Type</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 pr-4">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 font-semibold text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-550 inline mr-2" /> Loading ledger records...
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-400 font-bold">
                    No stock movements recorded in selected range.
                  </td>
                </tr>
              ) : (
                ledger.map((l, i) => (
                  <tr key={i} className="hover:bg-orange-50/10">
                    <td className="p-3 pl-4 text-gray-500">{new Date(l.timestamp).toLocaleString('en-GB')}</td>
                    <td className="p-3 font-bold text-gray-800">{l.itemName}</td>
                    <td className="p-3"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono text-[10px]">{l.batch}</span></td>
                    <td className="p-3 text-center font-bold text-gray-500">{l.previousStock}</td>
                    <td className="p-3 text-center font-bold text-green-700">{l.quantity > 0 ? `+${l.quantity}` : '-'}</td>
                    <td className="p-3 text-center font-bold text-red-650">{l.quantity < 0 ? Math.abs(l.quantity) : '-'}</td>
                    <td className="p-3 text-center font-bold text-gray-850">{l.newStock}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        l.type === 'Purchase' || l.type === 'Excel Upload' ? 'bg-green-50 text-green-700' :
                        l.type === 'Sale' ? 'bg-blue-50 text-blue-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{l.type}</span>
                    </td>
                    <td className="p-3 text-gray-550 max-w-[200px] truncate" title={l.remarks}>{l.remarks || '-'}</td>
                    <td className="p-3 pr-4 font-bold text-gray-600">{l.performedBy?.username || 'Staff'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== SYSTEM AUDIT LOGS VIEW ====================
const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/pharmacy/audit-logs');
      setLogs(data);
    } catch (err) {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-4 text-xs text-gray-700 animate-fade-in">
      <div className="flex justify-between items-center border-b border-orange-100 pb-2">
        <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
          <ShieldAlert className="text-orange-500 h-4.5 w-4.5" />
          Pharmacy Inventory Audit Trail Logs
        </h3>
        <button type="button" onClick={fetchLogs} className="btn py-1.5 px-4 text-xs font-bold cursor-pointer">
          Refresh Logs
        </button>
      </div>

      <div className="card overflow-hidden bg-white border border-orange-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3.5 pl-4">Timestamp</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Module</th>
                <th className="p-3.5">Old State</th>
                <th className="p-3.5">New State</th>
                <th className="p-3.5 pr-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 font-semibold text-gray-600">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-550 inline mr-2" /> Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400 font-bold">
                    No audit records logged.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-orange-50/10">
                    <td className="p-3.5 pl-4 text-gray-400">{new Date(log.createdAt).toLocaleString('en-GB')}</td>
                    <td className="p-3.5 font-bold text-gray-800">{log.username}</td>
                    <td className="p-3.5 uppercase text-[10px] font-black text-gray-500">{log.role}</td>
                    <td className="p-3.5 text-orange-700 font-black">{log.action}</td>
                    <td className="p-3.5 font-bold text-gray-500">{log.module}</td>
                    <td className="p-3.5 font-mono text-[10px] text-red-650">{log.oldValue || '-'}</td>
                    <td className="p-3.5 font-mono text-[10px] text-green-700">{log.newValue || '-'}</td>
                    <td className="p-3.5 pr-4 font-mono text-gray-400 text-[10px]">{log.ipAddress || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== LIVE SUPPLIER PAYMENTS HISTORY LEDGER ====================
const SupplierPaymentSection = ({ purchase, onPaymentLogged }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ amountPaid: 0, paymentMode: 'Cash', referenceNumber: '', transactionId: '', notes: '', paymentDate: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/pharmacy/purchases/${purchase._id}/payments`);
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [purchase._id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.amountPaid <= 0) {
      toast.error('Payment amount must be greater than 0.');
      return;
    }
    setSubmitting(true);
    try {
      await client.post(`/pharmacy/purchases/${purchase._id}/payments`, form);
      toast.success('Supplier payment logged successfully!');
      setShowModal(false);
      setForm({ amountPaid: 0, paymentMode: 'Cash', referenceNumber: '', transactionId: '', notes: '', paymentDate: new Date().toISOString().split('T')[0] });
      fetchPayments();
      if (onPaymentLogged) onPaymentLogged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFinanceOrAdmin = user?.role === 'admin' || user?.role === 'finance/admin' || user?.role === 'store manager';

  return (
    <div className="space-y-3.5 border-t border-orange-50 pt-4 text-[11px]">
      <div className="flex justify-between items-center">
        <h4 className="font-extrabold text-gray-800 text-xs flex items-center gap-1.5">
          <DollarSign className="text-orange-500 h-4.5 w-4.5" /> Supplier Payments History Ledger
        </h4>
        {purchase.pendingAmount > 0 && isFinanceOrAdmin && (
          <button
            type="button"
            onClick={() => { setForm(prev => ({ ...prev, amountPaid: purchase.pendingAmount })); setShowModal(true); }}
            className="btn py-1 px-3 text-[10px] font-bold cursor-pointer"
          >
            Record Bill Payment
          </button>
        )}
      </div>

      <div className="border border-orange-50 rounded-xl overflow-hidden bg-white max-h-[150px] overflow-y-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-orange-50/20 font-bold text-gray-500 border-b border-orange-50">
              <th className="p-2 pl-3">Date</th>
              <th className="p-2 text-right">Amount Paid</th>
              <th className="p-2 text-center">Payment Mode</th>
              <th className="p-2">Transaction ID / Ref</th>
              <th className="p-2">Notes</th>
              <th className="p-2 pr-3">Logged By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-50 text-gray-700 font-semibold">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-400">Loading payments...</td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-400 italic">No payments logged against this purchase invoice yet.</td>
              </tr>
            ) : (
              payments.map((pay, i) => (
                <tr key={i} className="hover:bg-orange-50/5">
                  <td className="p-2 text-gray-500 pl-3">{new Date(pay.paymentDate).toLocaleDateString('en-GB')}</td>
                  <td className="p-2 text-right font-black font-mono text-gray-800">₹{pay.amountPaid.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{pay.paymentMode}</span>
                  </td>
                  <td className="p-2 font-mono text-gray-555">{pay.transactionId || pay.referenceNumber || '-'}</td>
                  <td className="p-2 text-gray-500">{pay.notes || '-'}</td>
                  <td className="p-2 pr-3 text-gray-600 font-bold">{pay.createdBy?.username || 'Staff'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 max-w-sm w-full border border-orange-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-orange-50 pb-2.5">
              <h3 className="font-black text-gray-800 text-xs flex items-center gap-1.5">
                <DollarSign className="text-orange-500 h-4.5 w-4.5" />
                Record Supplier Payment
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold text-gray-555">Amount Paid (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={purchase.pendingAmount}
                  className="input py-2 text-xs font-black text-right"
                  required
                  value={form.amountPaid || ''}
                  onChange={(e) => setForm({ ...form, amountPaid: Math.min(purchase.pendingAmount, parseFloat(e.target.value) || 0) })}
                />
                <span className="block text-[9px] text-gray-400 mt-0.5">Max outstanding: ₹{purchase.pendingAmount.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-bold text-gray-550">Payment Mode *</label>
                  <select
                    className="input py-2 text-xs font-semibold"
                    required
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-550">Payment Date *</label>
                  <input
                    type="date"
                    className="input py-2 text-xs font-semibold"
                    required
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-550">Transaction ID</label>
                <input
                  type="text"
                  className="input py-2 text-xs font-mono"
                  placeholder="e.g. TXN-102930129"
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-555">Reference / Cheque Number</label>
                <input
                  type="text"
                  className="input py-2 text-xs font-mono"
                  placeholder="e.g. CHQ-928123"
                  value={form.referenceNumber}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-550">Notes</label>
                <input
                  type="text"
                  className="input py-2 text-xs"
                  placeholder="Payment notes/memo..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-orange-50 pt-3">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs py-2 px-4 font-bold cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn text-xs py-2 px-5 font-bold cursor-pointer disabled:bg-orange-300">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PharmacyWorkspace;