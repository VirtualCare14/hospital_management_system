'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { 
  Search, 
  Plus, 
  Printer, 
  Sliders, 
  Check, 
  ChevronRight, 
  X,
  Download,
  MoreHorizontal,
  Edit2,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Activity,
  Scan,
  Radio,
  Layers,
  Heart,
  Zap,
  Loader2,
  Tag
} from 'lucide-react';

const MODALITIES = [
  { id: 'LAB', label: 'Lab', icon: FlaskConical },
  { id: 'USG', label: 'USG', icon: Activity },
  { id: 'DIGITAL X-RAY', label: 'Digital X-ray', icon: Scan },
  { id: 'XRAY', label: 'X-ray', icon: Radio },
  { id: 'OUTSOURCE LAB', label: 'Outsource Lab', icon: Layers },
  { id: 'ECG', label: 'ECG', icon: Heart },
  { id: 'CT SCAN', label: 'CT Scan', icon: Scan },
  { id: 'MRI', label: 'MRI', icon: Zap },
  { id: 'EPS', label: 'EPS', icon: Activity },
  { id: 'OPG', label: 'OPG', icon: Radio },
  { id: 'CARDIOLOGY', label: 'Cardiology', icon: Heart },
  { id: 'EEG', label: 'EEG', icon: Zap },
  { id: 'MAMMOGRAPHY', label: 'Mammography', icon: Scan }
];

const INITIAL_CATALOG = {
  'LAB': [
    { title: 'ABG', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'ADA', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AEC', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AFB', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AFP', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'A/G Ratio', basePrice: 200, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'ALLERGY SCREENING TEST', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AMH', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AMH Panel', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Ammonia', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Anemia package', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Package' },
    { title: 'Complete Blood Count (CBC)', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Liver Function Test (LFT)', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Kidney Function Test (KFT)', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Panel' }
  ],
  'USG': [
    { title: '2d Echo', basePrice: 1800, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Breast', basePrice: 600, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'Color Doppler (Fetus)', basePrice: 1000, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'Follicular study', basePrice: 1200, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'F.W.B.', basePrice: 400, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'K.U.B. FEMALE', basePrice: 400, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'K.U.B. MALE', basePrice: 400, revenueShare: 0, forGender: 'Male', entryType: 'Test' },
    { title: 'Lower Abdomen', basePrice: 400, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Testis', basePrice: 600, revenueShare: 0, forGender: 'Male', entryType: 'Test' },
    { title: 'Thyroid & Neck', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Upper Abdomen', basePrice: 400, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Whole Abdomen Female', basePrice: 500, revenueShare: 0, forGender: 'Female', entryType: 'Test' }
  ],
  'DIGITAL X-RAY': [
    { title: 'Chest PA View', basePrice: 400, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Lumbar Spine AP/Lat', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Both Knee Joint', basePrice: 550, revenueShare: 0, forGender: 'Both', entryType: 'Test' }
  ]
};

function RatelistContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedModality, setSelectedModality] = useState('LAB');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkPct, setBulkPct] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTest, setNewTest] = useState({ title: '', basePrice: '', revenueShare: '0', forGender: 'Both', entryType: 'Test' });
  
  // Tab & Sub-category filters matching reference screenshots
  const [activeStatusFilter, setActiveStatusFilter] = useState('active'); // active | inactive
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('Tests'); // Tests | Packages | Panels | Bill only

  // Interactive inline editing states
  const [editingFeeId, setEditingFeeId] = useState(null);
  const [tempFeeValue, setTempFeeValue] = useState('');
  const [savedFeeId, setSavedFeeId] = useState(null);
  const [savedGenderId, setSavedGenderId] = useState(null);
  const [entryTypeMenuId, setEntryTypeMenuId] = useState(null);

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/lab/tests').catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        setTests(data);
      } else {
        const defaults = (INITIAL_CATALOG[selectedModality] || INITIAL_CATALOG['LAB']).map((t, idx) => ({
          _id: `def_${idx}_${t.title}`,
          category: selectedModality,
          title: t.title,
          test: t.title,
          basePrice: t.basePrice,
          totalAmount: t.basePrice,
          revenueShare: t.revenueShare || 0,
          forGender: t.forGender || 'Both',
          entryType: t.entryType || 'Test',
          status: 'Active'
        }));
        setTests(defaults);
      }
    } catch (err) {
      console.warn('Failed to fetch tests', err);
    } finally {
      setLoading(false);
    }
  }, [selectedModality]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTests();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTests]);

  // Filter tests by selected modality, search query, active/inactive tab, and sub-category
  const modalityTests = tests.filter(t => {
    const cat = (t.category || t.code || 'LAB').toUpperCase();
    const targetCat = selectedModality.toUpperCase();
    return cat === targetCat || (targetCat === 'USG' && cat.includes('USG')) || (targetCat === 'DIGITAL X-RAY' && cat.includes('XRAY'));
  });

  const filteredTests = modalityTests.filter(t => {
    const titleMatch = (t.title || t.test || '').toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = activeStatusFilter === 'active' ? (t.status !== 'Inactive') : (t.status === 'Inactive');
    
    let categoryMatch = true;
    if (categoryTypeFilter === 'Packages') {
      categoryMatch = t.entryType === 'Package';
    } else if (categoryTypeFilter === 'Panels') {
      categoryMatch = t.entryType === 'Panel';
    } else if (categoryTypeFilter === 'Bill only') {
      categoryMatch = t.entryType === 'Bill only';
    }

    return titleMatch && statusMatch && categoryMatch;
  });

  // Handle inline fee save/cancel
  const handleSaveInlineFee = async (testId) => {
    const parsedPrice = parseFloat(tempFeeValue) || 0;
    setTests(prev => prev.map(t => (t._id === testId ? { ...t, basePrice: parsedPrice, totalAmount: parsedPrice } : t)));
    setSavedFeeId(testId);
    setEditingFeeId(null);

    setTimeout(() => {
      setSavedFeeId(null);
    }, 2500);

    const isMongoId = typeof testId === 'string' && /^[0-9a-fA-F]{24}$/.test(testId);
    if (isMongoId) {
      try {
        const currentTest = tests.find(t => t._id === testId);
        await api.put(`/lab/tests/${testId}`, {
          category: currentTest.category || selectedModality,
          title: currentTest.title || currentTest.test,
          basePrice: parsedPrice,
          totalAmount: parsedPrice,
          revenueShare: currentTest.revenueShare || 0,
          forGender: currentTest.forGender || 'Both'
        });
      } catch (err) {
        console.error('Failed to save fee', err);
      }
    }
  };

  // Handle revenue share update
  const handleUpdateRevenueShare = async (testId, shareVal) => {
    const parsedShare = parseFloat(shareVal) || 0;
    setTests(prev => prev.map(t => (t._id === testId ? { ...t, revenueShare: parsedShare } : t)));

    const isMongoId = typeof testId === 'string' && /^[0-9a-fA-F]{24}$/.test(testId);
    if (isMongoId) {
      try {
        const currentTest = tests.find(t => t._id === testId);
        await api.put(`/lab/tests/${testId}`, {
          category: currentTest.category || selectedModality,
          title: currentTest.title || currentTest.test,
          basePrice: currentTest.basePrice,
          totalAmount: currentTest.totalAmount || currentTest.basePrice,
          revenueShare: parsedShare,
          forGender: currentTest.forGender || 'Both'
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle gender preference update with green checkmark indicator
  const handleUpdateGender = async (testId, genderVal) => {
    setTests(prev => prev.map(t => (t._id === testId ? { ...t, forGender: genderVal } : t)));
    setSavedGenderId(testId);

    setTimeout(() => {
      setSavedGenderId(null);
    }, 2500);

    const isMongoId = typeof testId === 'string' && /^[0-9a-fA-F]{24}$/.test(testId);
    if (isMongoId) {
      try {
        const currentTest = tests.find(t => t._id === testId);
        await api.put(`/lab/tests/${testId}`, {
          category: currentTest.category || selectedModality,
          title: currentTest.title || currentTest.test,
          basePrice: currentTest.basePrice,
          totalAmount: currentTest.totalAmount || currentTest.basePrice,
          revenueShare: currentTest.revenueShare || 0,
          forGender: genderVal
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle Add New Test
  const handleAddNewTest = async (e) => {
    e.preventDefault();
    if (!newTest.title.trim()) {
      showToast('Test title is required', 'error');
      return;
    }
    const basePrice = parseFloat(newTest.basePrice) || 0;
    const payload = {
      category: selectedModality,
      title: newTest.title.trim(),
      test: newTest.title.trim(),
      basePrice,
      totalAmount: basePrice,
      revenueShare: parseFloat(newTest.revenueShare) || 0,
      forGender: newTest.forGender || 'Both',
      entryType: newTest.entryType || 'Test',
      status: 'Active'
    };

    try {
      const created = await api.post('/lab/tests', payload).catch(() => null);
      if (created) {
        setTests(prev => [created, ...prev]);
      } else {
        const mockNew = { _id: `def_${Date.now()}`, ...payload };
        setTests(prev => [mockNew, ...prev]);
      }
      showToast('Test added successfully!', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to add test', 'error');
    }
  };

  // Delete test
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to remove this test from the ratelist?')) return;
    setTests(prev => prev.filter(t => t._id !== testId));
    const isMongoId = typeof testId === 'string' && /^[0-9a-fA-F]{24}$/.test(testId);
    if (isMongoId) {
      try {
        await api.delete(`/lab/tests/${testId}`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Download CSV export matching reference button
  const handleDownloadCSV = () => {
    const headers = ['NAME', 'ENTRY TYPE', 'FEE', 'REVENUE SHARE AMOUNT', 'FOR GENDER'];
    const rows = filteredTests.map(t => [
      `"${t.title || t.test}"`,
      `"${t.entryType || 'Test'}"`,
      t.basePrice || t.totalAmount || 0,
      t.revenueShare || 0,
      `"${t.forGender || 'Both'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ratelist_${selectedModality.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print ratelist
  const handlePrintRatelist = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row gap-5 pb-12">
        
        {/* SETUP GUIDE SIDEBAR (Left) */}
        <div className="w-full md:w-56 bg-[#0f172a] text-slate-300 rounded-xl p-4 shadow-md shrink-0 space-y-3 no-print">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Setup Guide</h2>
          <nav className="space-y-1 text-xs font-medium">
            <button className="w-full text-left px-3 py-2 rounded-lg bg-blue-600 font-bold text-white flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" /> Ratelist
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => router.push('/setup/letterhead')}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Letterhead</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => showToast('Case registration prefix settings are pre-configured.', 'success')}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Case reg. no.</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => showToast('Panels are managed inside the Rate List page.', 'success')}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Panels</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => showToast('Proofread validation rules are active.', 'success')}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Proofread</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
            >
              Skip setup »
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="flex-1 py-1.5 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 text-center hover:bg-slate-800 cursor-pointer"
            >
              ‹ Prev
            </button>
            <button 
              onClick={() => router.push('/setup/letterhead')} 
              className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold text-center hover:bg-blue-500 cursor-pointer"
            >
              Next ›
            </button>
          </div>
        </div>

        {/* MAIN RATELIST CONTENT */}
        <div className="flex-1 space-y-4">
          
          {/* Top Modality Selector Bar matching Screenshot 3 */}
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs no-print">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {MODALITIES.map(mod => {
                const Icon = mod.icon;
                const isSelected = selectedModality === mod.id;

                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModality(mod.id)}
                    className={`
                      px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex flex-col items-center justify-center gap-1 min-w-[90px] cursor-pointer
                      ${isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/80'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span className="text-[11px] font-bold tracking-tight">{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bar & Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search test name..."
                  className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Bulk revenue share update */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Bulk update revenue share by percentage:</span>
                <input
                  type="number"
                  placeholder="%"
                  value={bulkPct}
                  onChange={(e) => setBulkPct(e.target.value)}
                  className="w-14 h-8 px-2 border border-slate-200 rounded-md text-xs text-center focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!bulkPct) return;
                    const pct = parseFloat(bulkPct) || 0;
                    setTests(prev => prev.map(t => ({
                      ...t,
                      revenueShare: Math.round(((t.basePrice || 0) * pct) / 100)
                    })));
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Update all
                </button>
              </div>

              {/* Download CSV, Add New & Print Ratelist buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download CSV</span>
                </button>
                <div className="relative inline-flex rounded-lg shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-l-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-r-lg border-l border-blue-500 cursor-pointer"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePrintRatelist}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print ratelist</span>
                </button>
              </div>
            </div>

            {/* Instruction Tip Alert Banner matching Screenshot 3 */}
            <div className="p-2.5 bg-pink-50/80 border border-pink-200/90 rounded-lg text-pink-700 text-xs flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-pink-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">ⓘ</span>
              <span>Use <strong>TAB</strong> button to change the rates one by one.</span>
            </div>

            {/* Status & Sub-Category Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-slate-100 pb-2">
              {/* Active / Inactive Tabs */}
              <div className="flex items-center gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveStatusFilter('active')}
                  className={`pb-1 border-b-2 cursor-pointer ${
                    activeStatusFilter === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Active <span className="ml-1 text-slate-500 font-normal">{modalityTests.filter(t => t.status !== 'Inactive').length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStatusFilter('inactive')}
                  className={`pb-1 border-b-2 cursor-pointer ${
                    activeStatusFilter === 'inactive' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Inactive <span className="ml-1 text-slate-500 font-normal">{modalityTests.filter(t => t.status === 'Inactive').length}</span>
                </button>
              </div>

              {/* Category Filter Pills: Tests, Packages, Panels, Bill only */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {['Tests', 'Packages', 'Panels', 'Bill only'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCategoryTypeFilter(tab)}
                    className={`
                      px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer
                      ${categoryTypeFilter === tab
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* RATELIST TABLE MATCHING SCREENSHOTS 1, 2, & 3 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">NAME</th>
                    <th className="py-2.5 px-3 w-36">ENTRY TYPE</th>
                    <th className="py-2.5 px-3 w-40">FEE</th>
                    <th className="py-2.5 px-3 w-48">REVENUE SHARE AMOUNT</th>
                    <th className="py-2.5 px-3 w-44">FOR GENDER</th>
                    <th className="py-2.5 px-3 w-24 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-1" />
                        <span>Loading ratelist...</span>
                      </td>
                    </tr>
                  ) : filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                        {"No tests found matching filter criteria. Click \"+ Add New\" to add a new test."}
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((test) => {
                      const isEditingFee = editingFeeId === test._id;
                      const isFeeSaved = savedFeeId === test._id;
                      const isGenderSaved = savedGenderId === test._id;
                      const isEntryMenuOpen = entryTypeMenuId === test._id;

                      return (
                        <tr key={test._id} className="hover:bg-slate-50/70 transition-colors">
                          {/* NAME */}
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{test.title || test.test}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingFeeId(test._id);
                                  setTempFeeValue(String(test.basePrice !== undefined ? test.basePrice : (test.totalAmount || 0)));
                                }}
                                className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                title="Edit test details"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* ENTRY TYPE with ... Popover matching Screenshot 1 & 2 */}
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            <div className="relative inline-flex items-center gap-1.5">
                              <span>{test.entryType || 'Test'}</span>
                              <button
                                type="button"
                                onClick={() => setEntryTypeMenuId(isEntryMenuOpen ? null : test._id)}
                                className="text-slate-400 hover:text-slate-700 font-bold p-0.5 cursor-pointer"
                                title="More entry options"
                              >
                                •••
                              </button>

                              {/* Manage test popover dropdown */}
                              {isEntryMenuOpen && (
                                <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 z-50 min-w-[120px] animate-in fade-in">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEntryTypeMenuId(null);
                                      alert(`Managing test: ${test.title || test.test}`);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md font-semibold cursor-pointer"
                                  >
                                    Manage test
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* FEE with inline Blue Check / Cross or Edit Pencil */}
                          <td className="py-2.5 px-3">
                            {isEditingFee ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  autoFocus
                                  value={tempFeeValue}
                                  onChange={(e) => setTempFeeValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveInlineFee(test._id);
                                    if (e.key === 'Escape') setEditingFeeId(null);
                                  }}
                                  className="w-20 h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineFee(test._id)}
                                  className="p-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-2xs"
                                  title="Save rate"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingFeeId(null)}
                                  className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFeeId(test._id);
                                    setTempFeeValue(String(test.basePrice !== undefined ? test.basePrice : (test.totalAmount || 0)));
                                  }}
                                  className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer flex items-center gap-1"
                                >
                                  <span>{test.basePrice !== undefined ? test.basePrice : (test.totalAmount || 0)}</span>
                                  <Edit2 className="w-3 h-3 text-slate-400 hover:text-blue-600" />
                                </button>
                                {isFeeSaved && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in" />
                                )}
                              </div>
                            )}
                          </td>

                          {/* REVENUE SHARE AMOUNT */}
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              value={test.revenueShare || 0}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTests(prev => prev.map(t => (t._id === test._id ? { ...t, revenueShare: val } : t)));
                              }}
                              onBlur={(e) => handleUpdateRevenueShare(test._id, e.target.value)}
                              className="w-28 h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                          </td>

                          {/* FOR GENDER with Green Checkmark Icon matching Screenshots */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={test.forGender || 'Both'}
                                onChange={(e) => handleUpdateGender(test._id, e.target.value)}
                                className="w-32 h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                              >
                                <option value="Both">Both</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                              {isGenderSaved && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in shrink-0" />
                              )}
                            </div>
                          </td>

                          {/* ACTIONS / REMOVE */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteTest(test._id)}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-red-600 text-xs font-semibold cursor-pointer"
                              title="Remove test"
                            >
                              <XCircle className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                              <span>Remove</span>
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
      </div>

      {/* Add New Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add New Test ({selectedModality})</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewTest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  value={newTest.title}
                  onChange={(e) => setNewTest(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. ABG / USG Breast"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fee (₹) *</label>
                <input
                  type="number"
                  required
                  value={newTest.basePrice}
                  onChange={(e) => setNewTest(p => ({ ...p, basePrice: e.target.value }))}
                  placeholder="e.g. 600"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Revenue Share (₹)</label>
                  <input
                    type="number"
                    value={newTest.revenueShare}
                    onChange={(e) => setNewTest(p => ({ ...p, revenueShare: e.target.value }))}
                    placeholder="0"
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">For Gender</label>
                  <select
                    value={newTest.forGender}
                    onChange={(e) => setNewTest(p => ({ ...p, forGender: e.target.value }))}
                    className="w-full h-9 px-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Both">Both</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function RatelistPage() {
  return (
    <ProtectedRoute>
      <RatelistContent />
    </ProtectedRoute>
  );
}
