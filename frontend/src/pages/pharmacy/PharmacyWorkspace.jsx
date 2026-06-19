import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import * as XLSX from 'xlsx';
import './PharmacyInvoicePrint.css';

// Color Helper for stock status
const getStatusDetails = (qty, expiryDateStr) => {
  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const isExpired = expiryDate <= today;
  const isNearExpiry = expiryDate > today && expiryDate <= thirtyDaysLater;

  if (isExpired) {
    if (qty < 50) {
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
    if (qty < 50) {
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

  if (qty < 50) {
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

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Pill className="text-orange-500 h-8 w-8" />
            Pharmacy Manager
          </h1>
          <p className="text-sm text-gray-500">
            OPD Prescriptions, Walk-in Billing, GST Invoicing, Sales Return, Inventory Control, and Reporting Dashboards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block bg-orange-100 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
            Hospital: {user?.hospitalName || 'HMS'}
          </span>
          <button 
            onClick={() => { loadStats(); loadBillingStats(); }} 
            className="p-2.5 bg-white border border-orange-200 hover:bg-orange-50 text-orange-600 rounded-xl transition shadow-sm"
            title="Refresh statistics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

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
      {currentSection === 'billing-reports' && <BillingReportsView />}
      {currentSection === 'gst-reports' && <GstReportsView />}
      {currentSection === 'expiry' && <ExpiryMedicinesView />}
      {currentSection === 'out-of-stock' && <OutOfStockView />}
      {currentSection === 'billing-settings' && <BillingSettingsView />}
    </div>
  );
};

// ==================== DASHBOARD VIEW ====================
const DashboardView = ({ changeSection, stats, statsLoading, billingStats, billingStatsLoading }) => {
  return (
    <div className="space-y-8 animate-fade-in text-gray-700">
      
      {/* Billing Stats Section */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2 border-b border-orange-100 pb-2">
          <BadgeIndianRupee className="text-orange-500 h-4.5 w-4.5" />
          Today's Sales & Revenue Summary
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Today's Bills */}
          <div 
            onClick={() => changeSection('sales-history')}
            className="card p-6 cursor-pointer hover:border-indigo-300 hover:shadow-indigo-100/50 hover:-translate-y-0.5 transition duration-300 group bg-gradient-to-br from-white to-indigo-50/20"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Today's Invoices</p>
                <h3 className="text-3xl font-black text-gray-800 mt-2">
                  {billingStatsLoading ? <Loader2 className="h-7 w-7 animate-spin text-indigo-550" /> : billingStats?.totalBills || 0}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition duration-300">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-indigo-650 mt-4">View sales log &rarr;</p>
          </div>

          {/* Total Revenue */}
          <div 
            onClick={() => changeSection('billing-reports')}
            className="card p-6 cursor-pointer hover:border-green-300 hover:shadow-green-100/50 hover:-translate-y-0.5 transition duration-300 group bg-gradient-to-br from-white to-green-50/20"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Today's Revenue</p>
                <h3 className="text-3xl font-black text-green-700 mt-2">
                  ₹{billingStatsLoading ? <Loader2 className="h-7 w-7 animate-spin text-green-550" /> : (billingStats?.totalRevenue || 0).toFixed(2)}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-2xl text-green-600 group-hover:bg-green-500 group-hover:text-white transition duration-300">
                <BadgeIndianRupee className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-green-650 mt-4">View revenue reports &rarr;</p>
          </div>

          {/* Medicines Sold */}
          <div 
            className="card p-6 hover:-translate-y-0.5 transition duration-300 group bg-gradient-to-br from-white to-orange-50/20 border-orange-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Units Sold</p>
                <h3 className="text-3xl font-black text-gray-800 mt-2">
                  {billingStatsLoading ? <Loader2 className="h-7 w-7 animate-spin text-orange-550" /> : billingStats?.totalMedicinesSold || 0}
                </h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition duration-300">
                <Pill className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-orange-650 mt-4 font-mono">Medicines issued today</p>
          </div>

          {/* GST Collected */}
          <div 
            onClick={() => changeSection('gst-reports')}
            className="card p-6 cursor-pointer hover:border-purple-300 hover:shadow-purple-100/50 hover:-translate-y-0.5 transition duration-300 group bg-gradient-to-br from-white to-purple-50/20"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">GST Collected</p>
                <h3 className="text-3xl font-black text-purple-700 mt-2">
                  ₹{billingStatsLoading ? <Loader2 className="h-7 w-7 animate-spin text-purple-550" /> : (billingStats?.totalGSTCollected || 0).toFixed(2)}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition duration-300">
                <Percent className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-purple-650 mt-4 font-mono">View tax reports &rarr;</p>
          </div>
        </div>
      </div>

      {/* Inventory Stats Section */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2 border-b border-orange-100 pb-2">
          <Package className="text-orange-500 h-4.5 w-4.5" />
          Real-time Inventory & Stock Levels
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Items */}
          <div 
            onClick={() => changeSection('inventory')}
            className="card p-6 cursor-pointer hover:border-green-300 hover:shadow-green-100/50 hover:-translate-y-0.5 transition duration-300 group bg-gradient-to-br from-white to-green-50/20"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Items</p>
                <h3 className="text-3xl font-black text-gray-800 mt-2">
                  {statsLoading ? <Loader2 className="h-7 w-7 animate-spin text-green-500" /> : stats.totalItems}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-2xl text-green-600 group-hover:bg-green-500 group-hover:text-white transition duration-300">
                <Layers className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-green-600 mt-4">View complete inventory &rarr;</p>
          </div>

          {/* Out of Stock */}
          <div 
            onClick={() => changeSection('out-of-stock')}
            className="card p-6 cursor-pointer hover:border-yellow-300 hover:shadow-yellow-100/50 hover:-translate-y-0.5 transition duration-300 group bg-gradient-to-br from-white to-yellow-50/20"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Out of Stock</p>
                <h3 className="text-3xl font-black text-gray-800 mt-2">
                  {statsLoading ? <Loader2 className="h-7 w-7 animate-spin text-yellow-500" /> : stats.outOfStockCount}
                </h3>
              </div>
              <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition duration-300">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-yellow-600 mt-4">Quantity less than 50 &rarr;</p>
          </div>

          {/* Expiry Warning */}
          <div 
            onClick={() => changeSection('expiry')}
            className="card p-6 cursor-pointer hover:border-orange-300 hover:shadow-orange-100/50 hover:-translate-y-0.5 transition duration-300 group bg-gradient-to-br from-white to-orange-50/20"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Expiry Warnings</p>
                <h3 className="text-3xl font-black text-gray-800 mt-2">
                  {statsLoading ? <Loader2 className="h-7 w-7 animate-spin text-orange-550" /> : stats.expiryWarningCount}
                </h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition duration-300">
                <CalendarDays className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-orange-600 mt-4">Expiring within 30 days &rarr;</p>
          </div>

          {/* Expired */}
          <div 
            onClick={() => changeSection('expiry')}
            className="card p-6 cursor-pointer hover:border-red-300 hover:shadow-red-100/50 hover:-translate-y-0.5 transition duration-300 group bg-gradient-to-br from-white to-red-50/20"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Expired Medicines</p>
                <h3 className="text-3xl font-black text-gray-800 mt-2 text-red-650 font-mono">
                  {statsLoading ? <Loader2 className="h-7 w-7 animate-spin text-red-500" /> : stats.expiredCount}
                </h3>
              </div>
              <div className="p-3 bg-red-50 rounded-2xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition duration-300">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-red-650 mt-4">Already expired items &rarr;</p>
          </div>
        </div>
      </div>

      {/* Color Coding Rules Quick Reference */}
      <div className="card p-6 space-y-4">
        <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
          <AlertTriangle className="text-orange-500 h-4.5 w-4.5" />
          Color Coding System Reference
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-semibold text-gray-700">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
            <div>
              <p className="text-xs font-bold text-green-800">Green (Valid)</p>
              <p className="text-[10px] text-gray-500">Qty &ge; 50, not expired</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
            <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
            <div>
              <p className="text-xs font-bold text-yellow-800">Yellow (Low Stock)</p>
              <p className="text-[10px] text-gray-500">Qty &lt; 50, not expired</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            <div>
              <p className="text-xs font-bold text-red-800">Red (Expired)</p>
              <p className="text-[10px] text-gray-500">Expiry date passed</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <span className="h-3 w-3 rounded-full bg-blue-500"></span>
            <div>
              <p className="text-xs font-bold text-blue-800">Blue (Critical Alert)</p>
              <p className="text-[10px] text-gray-500">Expired/Near Expiry AND Qty &lt; 50</p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-black">Stock Up via Excel Sheets</h3>
          <p className="text-xs text-orange-50 opacity-90 max-w-xl">
            Quickly bulk-import your medicine inventory, pricing, batch codes, and expiry schedules. Our system processes duplicate checks and handles empty inputs automatically.
          </p>
        </div>
        <button 
          onClick={() => changeSection('excel-upload')} 
          className="bg-white hover:bg-orange-50 text-orange-600 font-bold px-6 py-3 rounded-2xl shadow-md transition whitespace-nowrap flex items-center gap-2 text-sm"
        >
          <Upload className="h-4 w-4" /> Go to Excel Upload
        </button>
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters Card */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Item Name or Batch..." 
              className="input pl-9 text-sm py-2.5" 
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-bold text-gray-500 mr-1.5">Filters:</span>
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
        </div>
      </div>

      {/* Items Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100 select-none">
                <th className="p-3 pl-4">Sno.</th>
                <th onClick={() => toggleSort('itemName')} className="p-3 cursor-pointer hover:text-orange-600 transition">
                  Item Name {sortBy === 'itemName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="p-3">Batch</th>
                <th onClick={() => toggleSort('quantity')} className="p-3 cursor-pointer hover:text-orange-600 transition">
                  Qty {sortBy === 'quantity' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => toggleSort('expiry')} className="p-3 cursor-pointer hover:text-orange-600 transition">
                  Expiry {sortBy === 'expiry' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="p-3">Pack</th>
                <th className="p-3">MRP / Rate</th>
                <th className="p-3">GST Details</th>
                <th className="p-3">Amount</th>
                <th className="p-3 pr-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2 text-orange-500" /> Loading inventory...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-400">
                    <Pill className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
                    <p className="font-bold">No medicines found</p>
                    <p className="text-xs">Upload an Excel sheet or refine search filters.</p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const stat = getStatusDetails(item.quantity, item.expiry);
                  return (
                    <tr key={item._id} className="hover:bg-orange-50/10 transition">
                      <td className="p-3 pl-4 font-bold text-gray-400">{item.sNo || idx + 1}</td>
                      <td className="p-3 font-bold text-gray-800">{item.itemName}</td>
                      <td className="p-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-xs border border-gray-200">{item.batch}</span></td>
                      <td className={`p-3 font-bold ${stat.textClass}`}>{item.quantity} {item.free > 0 && <span className="text-[10px] text-orange-500">(+{item.free} Free)</span>}</td>
                      <td className="p-3 font-semibold text-gray-600">{new Date(item.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</td>
                      <td className="p-3 text-xs text-gray-500">{item.pack}</td>
                      <td className="p-3">
                        <div className="text-xs font-bold text-green-700">₹{item.mrp.toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">MRP</span></div>
                        <div className="text-[10px] text-gray-500">Rate: ₹{item.rate.toFixed(2)}</div>
                      </td>
                      <td className="p-3 text-xs">
                        <span className="block text-[10px] text-gray-400">HSN: {item.hsn}</span>
                        <span>S:{item.sgst}% | C:{item.cst}%</span>
                      </td>
                      <td className="p-3 font-bold text-gray-800">₹{item.amount.toFixed(2)}</td>
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
    </div>
  );
};

// ==================== EXCEL UPLOAD VIEW ====================
const ExcelUploadView = ({ loadStats }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Parse Excel Date helper
  const parseExcelDate = (val) => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val === 'number') {
      return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    const str = String(val).trim();
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) return new Date(parsed);

    // Try parsing MM/YY or MM/YYYY or MM-YY or MM-YYYY
    const match = str.match(/^(\d{1,2})[-/](\d{2,4})$/);
    if (match) {
      const month = parseInt(match[1]) - 1;
      let year = parseInt(match[2]);
      if (year < 100) year += 2000;
      return new Date(year, month + 1, 0); // last day of that month
    }
    return new Date(); // fallback
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processUpload = async () => {
    if (!file) {
      toast.error('Please select a file first.');
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      toast.error('Invalid file format. Please upload a .xlsx or .xls file.');
      return;
    }

    setUploading(true);
    setSummary(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.evt ? evt.evt.target.result : evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet);

        if (rawRows.length === 0) {
          toast.error('The uploaded Excel sheet contains no rows.');
          setUploading(false);
          return;
        }

        // Validate Column Structure
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
        const requiredColumns = [
          'Sno.', 'Item Name', 'Old MRP', 'Pack', 'MRP', 'Quantity', 'Free', 
          'Rate', 'Dis', 'Batch', 'Expiry', 'NRate', 'HSN', 'SGST', 'CST', 'Amount'
        ];

        const normalizedHeaders = headers.map(h => String(h).trim().toLowerCase());
        const missing = [];
        requiredColumns.forEach(col => {
          if (!normalizedHeaders.includes(col.toLowerCase())) {
            missing.push(col);
          }
        });

        if (missing.length > 0) {
          toast.error(`Columns missing from Excel: ${missing.join(', ')}`);
          setUploading(false);
          return;
        }

        // Map and parse columns, ensuring defaults to 0 for missing values
        const parsedItems = rawRows.map(row => {
          const getVal = (colName, defaultVal = 0) => {
            const key = Object.keys(row).find(k => k.trim().toLowerCase() === colName.toLowerCase());
            const val = key ? row[key] : undefined;
            return val === undefined || val === null || val === "" ? defaultVal : val;
          };

          const rawExpiry = getVal('Expiry', null);
          const expiryDate = rawExpiry ? parseExcelDate(rawExpiry) : new Date();

          return {
            sNo: Number(getVal('Sno.', 0)),
            itemName: String(getVal('Item Name', '')).trim(),
            oldMrp: Number(getVal('Old MRP', 0)),
            pack: String(getVal('Pack', '0')).trim(),
            mrp: Number(getVal('MRP', 0)),
            quantity: Number(getVal('Quantity', 0)),
            free: Number(getVal('Free', 0)),
            rate: Number(getVal('Rate', 0)),
            dis: Number(getVal('Dis', 0)),
            batch: String(getVal('Batch', '')).trim(),
            expiry: expiryDate.toISOString(),
            nRate: Number(getVal('NRate', 0)),
            hsn: String(getVal('HSN', '0')).trim(),
            sgst: Number(getVal('SGST', 0)),
            cst: Number(getVal('CST', 0)),
            amount: Number(getVal('Amount', 0))
          };
        });

        const validItems = parsedItems.filter(item => item.itemName && item.batch);
        if (validItems.length === 0) {
          toast.error('No valid records found in Excel sheet.');
          setUploading(false);
          return;
        }

        // POST JSON payload to backend
        const { data: uploadRes } = await client.post('/pharmacy/inventory/upload', {
          items: validItems,
          fileName: file.name
        });

        toast.success(uploadRes.message || 'Import successful!');
        setSummary(uploadRes);
        setFile(null);
        loadStats();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error processing Excel sheet');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
      {/* Upload Box */}
      <div className="md:col-span-2 space-y-4">
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`card p-8 text-center border-2 border-dashed flex flex-col items-center justify-center min-h-[300px] transition duration-200 ${
            dragActive 
              ? 'border-orange-500 bg-orange-50/50' 
              : 'border-orange-200 bg-white hover:border-orange-400'
          }`}
        >
          <FileSpreadsheet className="h-12 w-12 text-orange-400 mb-4" />
          <h3 className="font-extrabold text-gray-800 text-lg">Upload Stock Spreadsheet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Drag and drop your Excel file here, or browse files on your computer. Supports .xlsx and .xls formats.
          </p>

          <label className="btn text-xs py-2.5 px-4 mt-6 cursor-pointer">
            Browse Files
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
          </label>

          {file && (
            <div className="mt-6 p-3 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 max-w-md">
              <Check className="text-green-600 h-5 w-5 bg-green-50 rounded-full p-0.5 border border-green-200" />
              <div className="text-left">
                <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-gray-400 font-semibold">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600 ml-auto p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {file && (
            <button 
              onClick={processUpload} 
              disabled={uploading}
              className="btn text-xs py-2.5 px-6 mt-4 shadow-lg shadow-orange-500/10 cursor-pointer disabled:bg-orange-300"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing records...
                </>
              ) : 'Start Import'}
            </button>
          )}
        </div>

        {/* Upload Summary Card */}
        {summary && (
          <div className="card p-6 bg-gradient-to-br from-white to-green-50/10 border-green-100 space-y-4 shadow-lg">
            <h4 className="font-black text-green-800 text-sm flex items-center gap-2">
              <Check className="h-5 w-5 bg-green-100 text-green-700 rounded-full p-0.5" />
              Import Completed Successfully
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white border border-green-50 rounded-xl">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Rows Read</span>
                <span className="text-2xl font-black text-gray-800">{summary.totalRows}</span>
              </div>
              <div className="p-3 bg-white border border-green-50 rounded-xl">
                <span className="block text-[10px] font-bold text-green-600 uppercase">New Items</span>
                <span className="text-2xl font-black text-green-700">{summary.insertedCount}</span>
              </div>
              <div className="p-3 bg-white border border-green-50 rounded-xl">
                <span className="block text-[10px] font-bold text-blue-600 uppercase">Updated</span>
                <span className="text-2xl font-black text-blue-700">{summary.updatedCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Excel Sheet Instructions */}
      <div className="space-y-4">
        {/* Template Downloads */}
        <div className="card p-5 space-y-4">
          <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
            <Download className="text-orange-500 h-4.5 w-4.5" />
            Download Excel Template
          </h4>
          <p className="text-xs text-gray-500">
            Download our standard formatted Excel template to populate your records before importing. Do not change the column headers.
          </p>
          <a 
            href="/sample_inventory.xlsx" 
            download="sample_inventory.xlsx"
            className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-2 w-full hover:bg-orange-50/50"
          >
            <Download className="h-4 w-4" /> Download Sample File
          </a>
        </div>

        {/* Required Columns */}
        <div className="card p-5 space-y-3">
          <h4 className="font-extrabold text-gray-800 text-sm">Required Format Columns</h4>
          <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4 font-semibold">
            <li><b>Sno.</b>: Row sequence number</li>
            <li><b>Item Name</b>: Brand or generic name</li>
            <li><b>Pack</b>: Strip size (e.g. 10 Tab, 1 Bottle)</li>
            <li><b>MRP</b>: Maximum Retail Price (Number)</li>
            <li><b>Quantity</b>: Number of items (Integer)</li>
            <li><b>Free</b>: Promotional free items count</li>
            <li><b>Rate</b>: Purchase cost per unit</li>
            <li><b>Batch</b>: Unique manufacturing batch ID</li>
            <li><b>Expiry</b>: Expiry date (MM/YYYY or DD/MM/YYYY)</li>
            <li><b>HSN</b>: Harmonized System Nomenclature</li>
            <li><b>SGST / CST</b>: Tax percentages</li>
            <li><b>Amount</b>: Rate * Quantity total cost</li>
          </ul>
        </div>
      </div>
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
                  <td colSpan="5" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2 text-orange-500" /> Loading details...</td>
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
                    <td className="p-3 font-semibold text-gray-600">{new Date(item.expiry).toLocaleDateString('en-GB')}</td>
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
          <p className="font-bold text-yellow-800">Out of Stock Alert Limit: 50 units</p>
          <p className="text-yellow-600 font-semibold mt-0.5">Medicines in this list should be reordered immediately to avoid stock shortages.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3 pl-4">Item Name</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3 text-yellow-700">Current Quantity</th>
                <th className="p-3">MRP</th>
                <th className="p-3 pr-4">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2 text-orange-500" /> Loading out of stock details...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    <Check className="h-8 w-8 mx-auto mb-2 text-green-500 bg-green-50 border border-green-200 rounded-full p-1.5" />
                    <p className="font-bold">No out of stock medicines</p>
                    <p className="text-xs">All medicines are currently above the safety stock limit of 50.</p>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item._id} className="hover:bg-orange-50/10">
                    <td className="p-3 pl-4 font-bold text-gray-800">{item.itemName}</td>
                    <td className="p-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-xs border border-gray-200">{item.batch}</span></td>
                    <td className="p-3 font-extrabold text-yellow-600">{item.quantity}</td>
                    <td className="p-3 font-bold text-gray-700">₹{item.mrp.toFixed(2)}</td>
                    <td className="p-3 pr-4 font-semibold text-gray-600">{new Date(item.expiry).toLocaleDateString('en-GB')}</td>
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
        batch: '',
        isRejected: false
      }));
      setReviewItems(initialReview);
      setRemarks('');

      // Fetch batches for each item
      selectedRequest.items.forEach(item => {
        fetchBatchesForItem(item.itemName);
      });
    } else if (selectedRequest.status === 'Return Requested') {
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
        fetchBatchesForItem(item.itemName);
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
      if (!item.isRejected && item.approvedQty > 0 && !item.batch) {
        toast.error(`Please select a batch for ${item.itemName}`);
        return;
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
      await client.post(`/pharmacy/requests/${selectedRequest._id}/verify-return`, {
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
                      <td colSpan="7" className="p-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500 inline mr-2" />
                        Loading doctor requests...
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
                            req.status === 'Issued' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            req.status === 'Return Requested' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            req.status === 'Return Accepted' ? 'bg-teal-100 text-teal-800 border-teal-200' :
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
                        <tr key={idx} className={`hover:bg-orange-50/10 ${item.isRejected ? 'bg-red-50/20' : ''}`}>
                          <td className="p-3 pl-4 font-bold text-gray-800">
                            {item.itemName}
                            <span className="block text-[9px] font-semibold text-gray-400">
                              {batchesMap[item.itemName]?.length ? `${batchesMap[item.itemName].length} batch(es) found` : 'No available stock in inventory'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-gray-600">{item.requestedQty}</td>
                          <td className="p-3">
                            <input 
                              type="number" 
                              min="0"
                              max={item.requestedQty}
                              disabled={item.isRejected}
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
                          </td>
                          <td className="p-3 pr-4 text-center">
                            <input 
                              type="checkbox"
                              checked={item.isRejected}
                              className="rounded border-orange-200 text-orange-500 focus:ring-orange-500 h-4 w-4"
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const updated = [...reviewItems];
                                updated[idx].isRejected = checked;
                                if (checked) {
                                  updated[idx].approvedQty = 0;
                                  updated[idx].batch = '';
                                } else {
                                  updated[idx].approvedQty = item.requestedQty;
                                }
                                setReviewItems(updated);
                              }}
                            />
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
                    Confirm Stock Issuance
                  </button>
                </div>
              </div>
            )}

            {/* Case: Return Requested - Pharmacist verifies doctor returns */}
            {selectedRequest.status === 'Return Requested' && (
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
                        <div className="font-bold text-gray-855">{med.medicineName}</div>
                        <div className="text-[10px] text-gray-500">
                          {med.dosage} | {med.duration} | {med.frequency}
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
    for (const med of medList) {
      try {
        const { data } = await client.get(`/pharmacy/inventory?limit=5&search=${encodeURIComponent(med.medicineName)}`);
        // Find exact or closest match batch in stock
        const stockItems = data.items.filter(it => it.itemName.toLowerCase() === med.medicineName.toLowerCase() && it.quantity > 0);
        if (stockItems.length > 0) {
          // Select first batch with available quantity
          const stock = stockItems[0];
          loadedItems.push({
            itemName: stock.itemName,
            batch: stock.batch,
            quantity: 1,
            mrp: stock.mrp,
            discount: 0,
            sgst: stock.sgst || 0,
            cst: stock.cst || 0,
            availableQty: stock.quantity,
            pack: stock.pack
          });
        } else {
          // Stock empty fallback
          loadedItems.push({
            itemName: med.medicineName,
            batch: 'NO_STOCK',
            quantity: 1,
            mrp: 0,
            discount: 0,
            sgst: 0,
            cst: 0,
            availableQty: 0,
            pack: 'N/A'
          });
          toast.error(`No available stock for prescribed medicine: ${med.medicineName}`);
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
    // Check if item-batch already added
    const existingIdx = billItems.findIndex(it => it.itemName.toLowerCase() === stockItem.itemName.toLowerCase() && it.batch === stockItem.batch);
    if (existingIdx > -1) {
      const updated = [...billItems];
      if (updated[existingIdx].quantity + 1 > stockItem.quantity) {
        toast.error('Cannot add more than available stock.');
        return;
      }
      updated[existingIdx].quantity += 1;
      setBillItems(updated);
    } else {
      if (stockItem.quantity <= 0) {
        toast.error('Selected batch is out of stock.');
        return;
      }
      setBillItems([
        ...billItems,
        {
          itemName: stockItem.itemName,
          batch: stockItem.batch,
          quantity: 1,
          mrp: stockItem.mrp,
          discount: 0,
          sgst: stockItem.sgst || 0,
          cst: stockItem.cst || 0,
          availableQty: stockItem.quantity,
          pack: stockItem.pack
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
    const qty = Math.max(0, parseInt(val) || 0);
    const item = billItems[idx];
    if (qty > item.availableQty) {
      toast.error(`Cannot exceed available stock of ${item.availableQty} units`);
      return;
    }
    const updated = [...billItems];
    updated[idx].quantity = qty;
    setBillItems(updated);
  };

  const handleDiscountChange = (idx, val) => {
    const disc = Math.min(100, Math.max(0, parseFloat(val) || 0));
    const updated = [...billItems];
    updated[idx].discount = disc;
    setBillItems(updated);
  };

  // Perform Calculations
  const calculateBillTotals = () => {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    let grandTotal = 0;

    const itemsCalculated = billItems.map(item => {
      const qty = item.quantity;
      const unitMrp = item.mrp;
      
      const itemSubtotal = unitMrp * qty;
      const itemDiscount = itemSubtotal * (item.discount / 100);
      const itemNetAfterDiscount = itemSubtotal - itemDiscount;

      // Reverse GST calculation: unit price is inclusive of GST.
      let gstAmt = 0;
      let gstRate = 0;
      if (gstMode === 'default') {
        gstRate = item.sgst + item.cst;
      } else if (gstMode === 'custom') {
        gstRate = parseFloat(customGstRate) || 0;
      }

      if (gstMode !== 'none') {
        const taxableVal = itemNetAfterDiscount / (1 + gstRate / 100);
        gstAmt = itemNetAfterDiscount - taxableVal;
      }

      subTotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalGst += gstAmt;
      grandTotal += itemNetAfterDiscount;

      return {
        ...item,
        unitPrice: item.mrp,
        gstPercentage: gstRate,
        gstAmount: gstAmt,
        amount: itemNetAfterDiscount
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
    if (billItems.some(it => it.batch === 'NO_STOCK' || it.quantity <= 0)) {
      toast.error('Please resolve missing stock and enter valid quantities.');
      return;
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
        items: totals.itemsCalculated,
        subTotal: totals.subTotal,
        discount: totals.discount,
        gstAmount: totals.gstAmount,
        grandTotal: totals.grandTotal,
        paidAmount,
        paymentMethod,
        mixedPayments: paymentMethod === 'Mixed Payment' ? Object.entries(mixedPayments).map(([method, amount]) => ({ method, amount })) : [],
        paymentStatus
      };

      const { data } = await client.post('/pharmacy/billing/bills', payload);
      toast.success('Bill generated and inventory updated successfully!');
      
      // Clear states
      setBillItems([]);
      setPatientDetails({ name: '', mobile: '', age: '', gender: '' });
      clearPrescription();
      
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
    <div className="grid gap-6 lg:grid-cols-3 animate-fade-in text-gray-700">
      {/* Items & details */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Patient header info */}
        <div className="card p-6 bg-gradient-to-br from-white to-orange-50/10 border-orange-100 space-y-4">
          <div className="flex justify-between items-center border-b border-orange-50 pb-2">
            <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
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
                <span className="font-extrabold text-gray-900 text-sm">{selectedPrescription.patientDetails?.patientName}</span>
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
        <div className="card p-5 bg-white border border-orange-100/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-extrabold text-gray-800">GST Invoice Settings</p>
              <p className="text-[10px] text-gray-450 font-semibold mt-0.5">Toggle tax calculations for this specific bill.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGstMode('none')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                  gstMode === 'custom'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                    : 'bg-indigo-50/10 text-indigo-655 border-indigo-100 hover:bg-indigo-50/30'
                }`}
              >
                With Custom GST %
              </button>
            </div>
          </div>

          {/* Custom GST Input Field */}
          {gstMode === 'custom' && (
            <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
              <div>
                <span className="font-extrabold text-indigo-950">Specify Custom GST Percentage</span>
                <span className="block text-[10px] text-indigo-505 font-semibold mt-0.5">This rate will be applied uniformly to all medicines on this bill.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input py-1.5 px-2.5 text-center text-xs w-[80px] border-indigo-200 focus:border-indigo-500"
                  value={customGstRate}
                  onChange={(e) => setCustomGstRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                />
                <span className="font-bold text-indigo-950 text-sm">%</span>
              </div>
            </div>
          )}
        </div>

        {/* Medicine Autocomplete Search Box */}
        <div className="card p-5 space-y-4">
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Search & Add Medicines from Inventory</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Type medicine name or batch code..." 
                className="input pl-9 text-sm py-2.5" 
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

        {/* Medicines Added Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100 select-none">
                  <th className="p-3 pl-4">Sno.</th>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 w-[95px]">Qty</th>
                  <th className="p-3">MRP</th>
                  <th className="p-3 w-[85px]">Disc%</th>
                  {gstMode !== 'none' && <th className="p-3">GST%</th>}
                  <th className="p-3">Net Amt</th>
                  <th className="p-3 pr-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {billItems.length === 0 ? (
                  <tr>
                    <td colSpan={gstMode !== 'none' ? 10 : 9} className="p-8 text-center text-gray-400">
                      <Pill className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
                      <p className="font-bold text-gray-600">No items added to invoice yet</p>
                      <p className="text-[10px]">Search medicines above to build invoice.</p>
                    </td>
                  </tr>
                ) : (
                  billItems.map((item, idx) => {
                    const rowGst = gstMode === 'custom' ? customGstRate : (gstMode === 'default' ? (item.sgst + item.cst) : 0);
                    const rowSub = item.mrp * item.quantity;
                    const rowDisc = rowSub * (item.discount / 100);
                    const rowNet = rowSub - rowDisc;

                    return (
                      <tr key={idx} className="hover:bg-orange-50/10">
                        <td className="p-3 pl-4 font-bold text-gray-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-gray-800">
                          {item.itemName}
                          <span className="block text-[9px] text-gray-400 font-semibold">{item.pack}</span>
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
                        <td className={`p-3 font-semibold ${item.availableQty < 50 ? 'text-red-655 font-bold' : 'text-gray-500'}`}>
                          {item.availableQty}
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            min="1"
                            max={item.availableQty}
                            className="input py-1 px-1.5 text-center text-xs w-[65px]"
                            value={item.quantity}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                          />
                        </td>
                        <td className="p-3 font-bold text-gray-800">₹{item.mrp.toFixed(2)}</td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            className="input py-1 px-1 text-center text-xs w-[55px]"
                            value={item.discount}
                            onChange={(e) => handleDiscountChange(idx, e.target.value)}
                          />
                        </td>
                        {gstMode !== 'none' && (
                          <td className="p-3 text-[10px] text-gray-500 font-semibold">
                            {rowGst}%
                            <span className="block text-[9px] text-gray-405">
                              (₹{(rowNet - (rowNet / (1 + rowGst / 100))).toFixed(2)})
                            </span>
                          </td>
                        )}
                        <td className="p-3 font-bold text-gray-950">₹{rowNet.toFixed(2)}</td>
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
      </div>

      {/* Bill summary & checkout */}
      <div className="space-y-6">
        
        {/* Calculations summary card */}
        <div className="card p-6 bg-gradient-to-br from-white to-orange-50/10 border-orange-100 space-y-4">
          <h4 className="font-extrabold text-gray-950 text-sm border-b border-orange-50 pb-2">
            Invoice Summary
          </h4>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-gray-500 font-semibold">
              <span>Sub-Total (MRP Total)</span>
              <span className="font-bold">₹{totals.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-500 font-semibold">
              <span>Item Discounts</span>
              <span className="font-bold text-red-655">- ₹{totals.discount.toFixed(2)}</span>
            </div>
            {gstMode !== 'none' && (
              <div className="flex justify-between items-center text-gray-400 font-semibold">
                <span>Inclusive GST Tax</span>
                <span className="font-mono">₹{totals.gstAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-orange-50 pt-2 text-sm text-gray-900 font-black">
              <span>Grand Total</span>
              <span className="text-lg text-green-700">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payments details */}
        <div className="card p-6 space-y-4 bg-white">
          <h4 className="font-extrabold text-gray-950 text-sm border-b border-orange-50 pb-2 flex items-center gap-1.5">
            <BadgeIndianRupee className="text-orange-500 h-4.5 w-4.5" />
            Payment Settlement
          </h4>

          <div className="space-y-3.5 text-xs">
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

            {paymentMethod === 'Mixed Payment' ? (
              <div className="space-y-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="font-bold text-gray-500 text-[10px] uppercase">Split Details</p>
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
                <span className="font-bold text-green-800 uppercase text-[10px]">Auto Amount Paid</span>
                <span className="font-bold text-green-700 text-sm">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-orange-50 pt-3">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Paid Amount</span>
                <span className="text-sm font-black text-gray-800">₹{paidAmount.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Due Balance</span>
                <span className={`text-sm font-black ${totals.grandTotal - paidAmount > 0.01 ? 'text-red-650 font-mono' : 'text-green-755'}`}>
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

// ==================== INVOICE PRINT MODAL ====================
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

  const handlePrint = () => {
    window.print();
  };

  return (
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
                <p className="text-xs text-gray-500 mt-1 font-semibold">
                  Phone: {data.hospitalSettings?.phoneNumber || 'N/A'} | Email: {data.pharmacySetting?.emailAddress || data.hospitalSettings?.emailAddress || 'N/A'}
                </p>
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
                  <th className="p-2.5 text-right">MRP (Unit)</th>
                  <th className="p-2.5 text-center">Disc %</th>
                  {data.pharmacySetting?.gstEnabled && (
                    <>
                      <th className="p-2.5 text-center">GST %</th>
                      <th className="p-2.5 text-right">GST Amt</th>
                    </>
                  )}
                  <th className="p-2.5 text-right">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.bill.items.map((item, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="p-2.5 font-bold text-gray-400">{idx + 1}</td>
                    <td className="p-2.5">
                      <span className="font-extrabold text-gray-900">{item.itemName}</span>
                      {item.pack && <span className="text-[10px] text-gray-400 ml-1.5 font-semibold">({item.pack})</span>}
                    </td>
                    <td className="p-2.5 font-mono text-gray-655 font-bold">{item.batch}</td>
                    <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                    <td className="p-2.5 text-right font-semibold">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="p-2.5 text-center font-semibold">{item.discount || 0}%</td>
                    {data.pharmacySetting?.gstEnabled && (
                      <>
                        <td className="p-2.5 text-center font-semibold">{item.gstPercentage || 0}%</td>
                        <td className="p-2.5 text-right font-semibold">₹{(item.gstAmount || 0).toFixed(2)}</td>
                      </>
                    )}
                    <td className="p-2.5 text-right font-bold text-gray-950">₹{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
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
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                    <span>Inclusive GST Tax Summary</span>
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
            <div className="text-center border-t border-gray-200 pt-6 mt-12">
              <p className="text-xs font-bold text-orange-600">{data.pharmacySetting?.thankYouMessage || 'Thank you for your visit!'}</p>
              <p className="text-[9px] text-gray-450 mt-1 uppercase font-semibold">Computer Generated Invoice - No Signature Required</p>
            </div>
          </div>
        )}
      </div>
    </div>
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
                <th className="p-3.5 pr-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500 inline mr-2" /> Loading invoices...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-gray-400">
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
    const qty = Math.max(0, parseInt(val) || 0);
    const item = returnItems[idx];
    if (qty > item.maxReturnable) {
      toast.error(`Cannot return more than purchased or already-returned quantity: ${item.maxReturnable} units`);
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
                          <td className="p-3 font-mono font-bold text-gray-500">{item.batch}</td>
                          <td className="p-3 text-center font-bold text-gray-600">{item.maxReturnable} units</td>
                          <td className="p-3">
                            <input 
                              type="number" 
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

// ==================== SUPPLIER MANAGEMENT VIEW ====================
const SupplierManagementView = () => {
  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('pharmacy_suppliers');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Cipla Healthcare India', contact: 'Anil Mehta', mobile: '9822334455', email: 'cipla@healthcare.com', gstin: '27AAAAA1111A1Z1', address: 'Bandra West, Mumbai' },
      { id: 2, name: 'Sun Pharmaceutical Industries', contact: 'Vikram Shah', mobile: '9811223344', email: 'sunpharma@sun.com', gstin: '27BBBBB2222B2Z2', address: 'Vadodara, Gujarat' }
    ];
  });

  const [form, setForm] = useState({ name: '', contact: '', mobile: '', email: '', gstin: '', address: '' });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('pharmacy_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  const handleSaveSupplier = (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile) {
      toast.error('Name and Mobile number are required.');
      return;
    }
    const newSupp = {
      id: Date.now(),
      ...form
    };
    setSuppliers([...suppliers, newSupp]);
    setForm({ name: '', contact: '', mobile: '', email: '', gstin: '', address: '' });
    setShowAddModal(false);
    toast.success('Supplier profile added successfully!');
  };

  const handleDeleteSupplier = (id) => {
    if (window.confirm('Are you sure you want to remove this supplier profile?')) {
      setSuppliers(suppliers.filter(s => s.id !== id));
      toast.success('Supplier removed.');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-gray-700">
      
      {/* Header and trigger */}
      <div className="flex justify-between items-center border-b border-orange-100 pb-2">
        <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
          <Truck className="text-orange-500 h-4.5 w-4.5" />
          Active Medicine & Stock Suppliers
        </h3>
        <button 
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn py-1.5 px-4 text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add New Supplier
        </button>
      </div>

      {/* Suppliers Table */}
      <div className="card overflow-hidden bg-white border border-orange-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3 pl-4">Supplier Name</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Email</th>
                <th className="p-3">GSTIN</th>
                <th className="p-3">Address</th>
                <th className="p-3 pr-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-orange-50/10">
                  <td className="p-3 pl-4 font-bold text-gray-800">{s.name}</td>
                  <td className="p-3 font-semibold text-gray-600">{s.contact}</td>
                  <td className="p-3 font-mono font-bold text-gray-700">{s.mobile}</td>
                  <td className="p-3 text-gray-500">{s.email || '-'}</td>
                  <td className="p-3 font-mono text-gray-550 font-bold">{s.gstin || '-'}</td>
                  <td className="p-3 text-xs text-gray-500">{s.address || '-'}</td>
                  <td className="p-3 pr-4 text-center">
                    <button 
                      type="button"
                      onClick={() => handleDeleteSupplier(s.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveSupplier}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-orange-50 pb-2">
              <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5">
                <Truck className="text-orange-500 h-4.5 w-4.5" />
                Register New Supplier
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold text-gray-550">Supplier / Company Name *</label>
                <input 
                  type="text" 
                  className="input py-2 text-xs" 
                  required
                  placeholder="e.g. Cipla Ltd."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-bold text-gray-550">Contact Person</label>
                  <input 
                    type="text" 
                    className="input py-2 text-xs" 
                    placeholder="e.g. Anil Mehta"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">Mobile Number *</label>
                  <input 
                    type="text" 
                    className="input py-2 text-xs" 
                    required
                    placeholder="e.g. 9811223344"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-bold text-gray-550">Email Address</label>
                  <input 
                    type="email" 
                    className="input py-2 text-xs" 
                    placeholder="cipla@co.in"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">GSTIN / Tax ID</label>
                  <input 
                    type="text" 
                    className="input py-2 text-xs font-mono uppercase" 
                    placeholder="27AAAAA1111A1Z1"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-gray-550">Office Address</label>
                <textarea 
                  className="input py-2 text-xs h-[50px]" 
                  placeholder="Supplier physical office address details..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="btn-secondary text-xs py-2 px-4 font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn text-xs py-2 px-5 font-bold shadow-md shadow-orange-500/10 cursor-pointer"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ==================== PHARMACY REPORTS VIEW ====================
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

// ==================== PHARMACY SETTINGS VIEW ====================
const BillingSettingsView = () => {
  const [gstEnabled, setGstEnabled] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/pharmacy/billing/settings');
      setGstEnabled(data.gstEnabled);
      setEmailAddress(data.emailAddress || '');
      setGstNumber(data.gstNumber || '');
      setTermsAndConditions(data.termsAndConditions || '');
      setThankYouMessage(data.thankYouMessage || '');
    } catch (err) {
      toast.error('Failed to load pharmacy settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmitSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put('/pharmacy/billing/settings', {
        gstEnabled,
        emailAddress,
        gstNumber,
        termsAndConditions,
        thankYouMessage
      });
      toast.success('Pharmacy settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in text-gray-700">
      <div className="card p-6 bg-white border border-orange-100 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-orange-50 pb-2">
          <Settings className="text-orange-500 h-5 w-5" />
          <h3 className="font-extrabold text-gray-900 text-sm">Configure Pharmacy billing & Tax Parameters</h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500 inline mr-1" /> Loading configurations...
          </div>
        ) : (
          <form onSubmit={handleSubmitSettings} className="space-y-4 text-xs">
            
            {/* GST Config Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-orange-50/20 border border-orange-100 rounded-2xl">
              <div>
                <p className="font-extrabold text-gray-800">GST Invoice Calculations</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">When disabled, item tax rates are ignored during bill calculations.</p>
              </div>
              <button 
                type="button"
                onClick={() => setGstEnabled(!gstEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-350 focus:outline-none cursor-pointer ${
                  gstEnabled ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                  gstEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}></span>
              </button>
            </div>

            {/* Email and GSTIN inputs */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-gray-550">Pharmacy GSTIN Number</label>
                <input 
                  type="text" 
                  disabled={!gstEnabled}
                  className="input py-2 text-xs font-mono uppercase" 
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-gray-550">Support Email Address</label>
                <input 
                  type="email" 
                  className="input py-2 text-xs" 
                  placeholder="e.g. pharmacy@hospital.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="mb-1 block font-bold text-gray-550">Custom Invoice Terms & Conditions</label>
              <textarea 
                className="input py-2 text-xs h-[80px] whitespace-pre-line leading-relaxed" 
                placeholder="Write invoice guidelines (e.g. Medicines once sold cannot be returned after 7 days)..."
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
              />
            </div>

            {/* Thank you message */}
            <div>
              <label className="mb-1 block font-bold text-gray-550">A4 Invoice Footnote (Thank you message)</label>
              <input 
                type="text" 
                className="input py-2 text-xs" 
                placeholder="e.g. Thank you for choosing our pharmacy! Get well soon."
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
              />
            </div>

            <div className="flex justify-end border-t border-orange-50 pt-4">
              <button 
                type="submit" 
                disabled={saving}
                className="btn py-2 px-6 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:bg-orange-300"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Settings Configuration
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PharmacyWorkspace;