'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Check, 
  TestTube, 
  Loader2, 
  X, 
  Sliders, 
  FlaskConical, 
  Activity, 
  Scan, 
  Radio, 
  Layers, 
  Heart, 
  Zap, 
  ChevronDown 
} from 'lucide-react';
import api from '../lib/api';

const CATEGORIES = [
  { id: 'LAB', label: 'LAB', title: 'Lab Investigations', icon: FlaskConical },
  { id: 'USG', label: 'USG', title: 'USG Investigations', icon: Activity },
  { id: 'DIGITAL XRAY', label: 'DIGITAL XRAY', title: 'Digital X-ray Investigations', icon: Scan },
  { id: 'XRAY', label: 'XRAY', title: 'X-ray Investigations', icon: Radio },
  { id: 'OUTSOURCE LAB', label: 'OUTSOURCE LAB', title: 'Outsource Lab Investigations', icon: Layers },
  { id: 'ECG', label: 'ECG', title: 'ECG Investigations', icon: Heart },
  { id: 'CT SCAN', label: 'CT SCAN', title: 'CT Scan Investigations', icon: Scan },
  { id: 'MRI', label: 'MRI', title: 'MRI Investigations', icon: Zap },
  { id: 'EPS', label: 'EPS', title: 'EPS Investigations', icon: Activity },
  { id: 'OPG', label: 'OPG', title: 'OPG Investigations', icon: Radio },
  { id: 'CARDIOLOGY', label: 'CARDIOLOGY', title: 'Cardiology Investigations', icon: Heart },
  { id: 'EEG', label: 'EEG', title: 'EEG Investigations', icon: Zap },
  { id: 'MAMMOGRAPHY', label: 'MAMMOGRAPHY', title: 'Mammography Investigations', icon: Scan }
];

const DEFAULT_CATALOG = {
  'LAB': [
    { id: 'abg', title: 'ABG', price: 600 },
    { id: 'ada', title: 'ADA', price: 100 },
    { id: 'aec', title: 'AEC', price: 100 },
    { id: 'afb', title: 'AFB', price: 100 },
    { id: 'afp', title: 'AFP', price: 100 },
    { id: 'cbc', title: 'Complete Blood Count (CBC)', price: 350 },
    { id: 'lft', title: 'Liver Function Test (LFT)', price: 650 },
    { id: 'kft', title: 'Kidney Function Test (KFT)', price: 600 },
    { id: 'lipid', title: 'Lipid Profile', price: 550 },
    { id: 'thyroid', title: 'Thyroid Profile', price: 500 }
  ],
  'USG': [
    { id: 'usg_echo', title: '2d Echo', price: 1800 },
    { id: 'usg_breast', title: 'Breast', price: 600 },
    { id: 'usg_doppler', title: 'Color Doppler (Fetus)', price: 1000 },
    { id: 'usg_follicular', title: 'Follicular study', price: 1200 },
    { id: 'usg_fwb', title: 'F.W.B.', price: 400 },
    { id: 'usg_kub_f', title: 'K.U.B. FEMALE', price: 400 },
    { id: 'usg_kub_m', title: 'K.U.B. MALE', price: 400 },
    { id: 'usg_lower_abd', title: 'Lower Abdomen', price: 400 },
    { id: 'usg_testis', title: 'Testis', price: 600 },
    { id: 'usg_thyroid', title: 'Thyroid & Neck', price: 600 },
    { id: 'usg_upper_abd', title: 'Upper Abdomen', price: 400 },
    { id: 'usg_whole_abd', title: 'Whole Abdomen Female', price: 500 }
  ],
  'DIGITAL XRAY': [
    { id: 'xr_chest', title: 'Chest PA View', price: 400 },
    { id: 'xr_spine', title: 'Lumbar Spine AP/Lat', price: 650 },
    { id: 'xr_knee', title: 'Both Knee Joint', price: 550 }
  ]
};

const toast = {
  success: (msg) => console.log('Notice:', msg),
  error: (msg) => alert(msg)
};

export default function ServiceSelector({ selectedServices, onToggleService, onRemoveService, onUpdateServicePrice }) {
  const router = useRouter();
  
  // Track open investigation box categories (default LAB open)
  const [openBoxes, setOpenBoxes] = useState(['LAB']);
  const [allTests, setAllTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState(CATEGORIES);
  
  // Per-box search state & dropdown open state
  const [searchState, setSearchState] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Per-box payment override state (Paid, Discount)
  const [boxPayments, setBoxPayments] = useState({
    'LAB': { paid: 0, discount: 0 },
    'USG': { paid: 0, discount: 0 },
    'DIGITAL XRAY': { paid: 0, discount: 0 }
  });

  // Modal states for Quick Add and Fee Update
  const [showAddModalFor, setShowAddModalFor] = useState(null);
  const [newTestForm, setNewTestForm] = useState({ title: '', price: '' });
  
  const [updateFeeModalTest, setUpdateFeeModalTest] = useState(null);
  const [updateFeeValue, setUpdateFeeValue] = useState('');

  // Close dropdown automatically when clicking outside or on another field
  useEffect(() => {
    if (!activeDropdown) return;

    const handleGlobalClick = (event) => {
      const isInsideSearchBox = event.target.closest?.(`.test-search-box-${activeDropdown}`);
      const isInsideDropdown = event.target.closest?.(`.test-dropdown-${activeDropdown}`);
      
      if (!isInsideSearchBox && !isInsideDropdown) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [activeDropdown]);

  // Load categories from backend
  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await api.get('/lab/test-categories').catch(() => []);
        if (Array.isArray(catRes) && catRes.length > 0) {
          const mergedMap = new Map();
          CATEGORIES.forEach(cat => {
            mergedMap.set(cat.id.toUpperCase(), cat);
          });
          catRes.forEach(cat => {
            const catName = (cat.name || cat.category || '').toUpperCase();
            if (catName && catName !== 'DIAGNOSIS' && !mergedMap.has(catName)) {
              mergedMap.set(catName, {
                id: catName,
                label: catName,
                title: `${catName} Investigations`,
                icon: FlaskConical
              });
            }
          });
          setDynamicCategories(Array.from(mergedMap.values()));
        }
      } catch (err) {
        console.warn('Error loading dynamic categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Load lab tests from backend
  useEffect(() => {
    async function loadTests() {
      setLoading(true);
      try {
        const tests = await api.get('/lab/tests').catch(() => []);
        if (Array.isArray(tests) && tests.length > 0) {
          const formatted = tests
            .filter(t => (t.category || '').toUpperCase() !== 'DIAGNOSIS')
            .map(t => ({
              id: t._id || t.id,
              title: t.title || t.test || 'Lab Test',
              category: (t.category || 'LAB').toUpperCase(),
              price: t.basePrice || t.totalAmount || t.amount || 400
            }));
          setAllTests(formatted);
        } else {
          setAllTests([]);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    loadTests();
  }, []);

  // Toggle open box section when clicking top modality tab
  const handleToggleCategoryBox = (catId) => {
    if (openBoxes.includes(catId)) {
      setOpenBoxes(openBoxes.filter(b => b !== catId));
    } else {
      setOpenBoxes([...openBoxes, catId]);
    }
  };

  const handleCloseBox = (catId) => {
    setOpenBoxes(openBoxes.filter(b => b !== catId));
  };

  // Get test catalog for a given category
  const getCatalogForCategory = (catId) => {
    return allTests.filter(t => t.category === catId || (catId === 'DIGITAL XRAY' && t.category.includes('XRAY')));
  };

  // Handle adding test from dropdown
  const handleSelectTestForBox = (test, catId) => {
    onToggleService({ ...test, category: catId });
    setSearchState(prev => ({ ...prev, [catId]: '' }));
    setActiveDropdown(null);
  };

  // Handle Quick Add New Test
  const handleQuickAddTest = async (e) => {
    e.preventDefault();
    if (!newTestForm.title.trim() || !newTestForm.price) {
      toast.error('Test title and fee are required');
      return;
    }
    const catId = showAddModalFor;
    const priceVal = parseFloat(newTestForm.price) || 0;
    
    const newObj = {
      id: `custom_${Date.now()}`,
      title: newTestForm.title.trim(),
      category: catId,
      price: priceVal
    };

    setAllTests(prev => [newObj, ...prev]);
    onToggleService(newObj);

    try {
      await api.post('/lab/tests', {
        category: catId,
        title: newTestForm.title.trim(),
        test: newTestForm.title.trim(),
        basePrice: priceVal,
        totalAmount: priceVal
      });
      toast.success(`Added ${newTestForm.title} to ${catId} ratelist`);
    } catch (err) {
      console.warn('Backend save notice', err);
    }

    setShowAddModalFor(null);
    setNewTestForm({ title: '', price: '' });
  };

  // Handle Quick Fee Update Modal
  const handleSaveFeeUpdate = async (e) => {
    e.preventDefault();
    if (!updateFeeModalTest) return;
    const newPrice = parseFloat(updateFeeValue) || 0;

    // Update in allTests
    setAllTests(prev => prev.map(t => (t.id === updateFeeModalTest.id || t.title === updateFeeModalTest.title ? { ...t, price: newPrice } : t)));
    
    // Update existing selected service price immutably via parent handler
    if (typeof onUpdateServicePrice === 'function') {
      onUpdateServicePrice(updateFeeModalTest, newPrice);
    } else {
      const match = selectedServices.find(s => s.id === updateFeeModalTest.id || s.title === updateFeeModalTest.title);
      if (match) {
        match.price = newPrice;
      }
    }

    const isValidMongoId = typeof updateFeeModalTest.id === 'string' && /^[0-9a-fA-F]{24}$/.test(updateFeeModalTest.id);

    if (isValidMongoId) {
      try {
        await api.put(`/lab/tests/${updateFeeModalTest.id}`, {
          category: updateFeeModalTest.category || 'LAB',
          title: updateFeeModalTest.title,
          basePrice: newPrice,
          totalAmount: newPrice
        });
        toast.success('Rate updated in Ratelist');
      } catch (err) {
        console.warn(err);
      }
    } else {
      toast.success(`Fee updated to ₹${newPrice}`);
    }

    setUpdateFeeModalTest(null);
  };

  return (
    <div className="space-y-6">
      {/* TOP MODALITY TABS BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Select Investigation Categories (Click to open separate investigation boxes)
        </h3>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {dynamicCategories.map((cat) => {
            const Icon = cat.icon;
            const isOpen = openBoxes.includes(cat.id);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategoryBox(cat.id)}
                className={`
                  flex flex-col items-center justify-center px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer shrink-0 min-w-[95px] h-14
                  ${isOpen
                    ? 'border-orange-500 bg-orange-500 text-white shadow-sm ring-2 ring-orange-500/30'
                    : 'border-slate-300 bg-white text-orange-600 hover:border-orange-400 hover:bg-orange-50'
                  }
                `}
              >
                <Icon className={`w-4 h-4 mb-1 ${isOpen ? 'text-white' : 'text-orange-500'}`} />
                <span className="text-[11px] font-extrabold tracking-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEPARATE INVESTIGATION BOXES */}
      {openBoxes.length === 0 ? (
        <div className="p-8 bg-white border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs">
          No investigation category selected. Click any category tab above (e.g. <strong>LAB</strong>, <strong>USG</strong>, <strong>DIGITAL XRAY</strong>) to open investigation boxes.
        </div>
      ) : (
        openBoxes.map((catId) => {
          const categoryObj = dynamicCategories.find(c => c.id === catId) || { label: catId, title: `${catId} Investigations` };
          const catalog = getCatalogForCategory(catId);
          const currentSearch = searchState[catId] || '';
          
          // Selected tests in this category box
          const boxSelectedTests = selectedServices.filter(s => {
            const sCat = (s.category || '').toUpperCase();
            if (sCat === catId) return true;
            if (catId === 'LAB' && (!sCat || sCat === 'LAB')) return true;
            return false;
          });

          // Filter catalog by search query
          const filteredCatalog = catalog.filter(t => 
            t.title.toLowerCase().includes(currentSearch.toLowerCase())
          );

          // Calculate box totals & auto-fill Paid if not manually overridden
          const boxTotal = boxSelectedTests.reduce((sum, t) => sum + Number(t.price || 0), 0);
          const currentPayment = boxPayments[catId] || { paid: boxTotal, discount: 0, isManual: false };
          const displayPaid = currentPayment.isManual ? currentPayment.paid : Math.max(0, boxTotal - Number(currentPayment.discount || 0));
          const boxDue = Math.max(0, boxTotal - Number(displayPaid) - Number(currentPayment.discount || 0));

          return (
            <div key={catId} className="bg-white border border-slate-300 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in">
              {/* Box Title Header with Close Icon */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCloseBox(catId)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Remove this category box"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{categoryObj.title}</span>
                  </h3>
                </div>
              </div>

              {/* Input Area & Payment Inputs Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Left (Cols 1-8): Auto-suggest Multi-Select Text Box */}
                <div className="md:col-span-8 space-y-2">
                  <div className="relative">
                    <div 
                      className={`min-h-[70px] w-full p-2.5 bg-white border border-slate-300 rounded-lg flex flex-wrap gap-1.5 items-center cursor-text focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 test-search-box-${catId}`}
                      onClick={() => setActiveDropdown(catId)}
                    >
                      {/* Selected test tag pills */}
                      {boxSelectedTests.map((test) => (
                        <span
                          key={test.id || test.title}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-bold text-slate-800"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveService(test);
                            }}
                            className="text-slate-500 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span>{test.title} (Rs.{test.price})</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpdateFeeModalTest(test);
                              setUpdateFeeValue(String(test.price));
                            }}
                            className="text-[10px] text-orange-600 underline font-semibold ml-1"
                            title="Edit fee"
                          >
                            Edit
                          </button>
                        </span>
                      ))}

                      {/* Search input field */}
                      <input
                        type="text"
                        value={currentSearch}
                        onChange={(e) => {
                          setSearchState(prev => ({ ...prev, [catId]: e.target.value }));
                          setActiveDropdown(catId);
                        }}
                        onFocus={() => setActiveDropdown(catId)}
                        placeholder={boxSelectedTests.length === 0 ? `Search or select ${categoryObj.label} tests...` : "Type to add more tests..."}
                        className="flex-1 min-w-[150px] bg-transparent outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 py-1"
                      />
                    </div>

                    {/* Auto-suggest Dropdown */}
                    {activeDropdown === catId && (
                      <div className={`absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in test-dropdown-${catId}`}>
                        {filteredCatalog.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">
                            {"No matching tests found. Click \"+ Add New\" below to add a custom test."}
                          </div>
                        ) : (
                          filteredCatalog.map((test) => {
                            const isSelected = boxSelectedTests.some(s => s.id === test.id || s.title === test.title);

                            return (
                              <button
                                key={test.id || test.title}
                                type="button"
                                onClick={() => handleSelectTestForBox(test, catId)}
                                className={`
                                  w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer
                                  ${isSelected ? 'bg-orange-50 text-orange-800 font-bold' : 'hover:bg-slate-50 text-slate-800 font-medium'}
                                `}
                              >
                                <span>{test.title} (Rs.{test.price})</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sub-actions Row: + Add New, Ratelist Link, Total & Due */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-3 font-semibold text-orange-600">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModalFor(catId);
                          setNewTestForm({ title: '', price: '' });
                        }}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/setup/ratelist')}
                        className="hover:underline flex items-center gap-1 cursor-pointer text-slate-600 hover:text-orange-600"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Ratelist
                      </button>
                    </div>

                    <div className="font-extrabold text-slate-800 space-x-3">
                      <span>Total: Rs. {boxTotal}</span>
                      <span>Due: Rs. {boxDue}</span>
                    </div>
                  </div>
                </div>

                {/* Right (Cols 9-12): Paid & Discount Input Fields with Labels directly above */}
                <div className="md:col-span-4 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">* Paid</label>
                    <input
                      type="number"
                      value={displayPaid}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setBoxPayments(prev => ({
                          ...prev,
                          [catId]: { ...prev[catId], paid: val, isManual: true }
                        }));
                      }}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">* Discount</label>
                    <input
                      type="number"
                      value={currentPayment.discount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setBoxPayments(prev => ({
                          ...prev,
                          [catId]: { ...prev[catId], discount: val }
                        }));
                      }}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* QUICK ADD NEW TEST MODAL */}
      {showAddModalFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add New {showAddModalFor} Test</h3>
              <button onClick={() => setShowAddModalFor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddTest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Test Title *</label>
                <input
                  type="text"
                  required
                  value={newTestForm.title}
                  onChange={(e) => setNewTestForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. ABG / USG Breast"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Test Fee (Rs.) *</label>
                <input
                  type="number"
                  required
                  value={newTestForm.price}
                  onChange={(e) => setNewTestForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="e.g. 600"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModalFor(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold"
                >
                  Add Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE FEE QUICK MODAL (Matching Screenshot 3) */}
      {updateFeeModalTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xl max-w-xl w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Update fee</h3>
              <button onClick={() => setUpdateFeeModalTest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <p>
                Fee update required. Visit{' '}
                <button 
                  onClick={() => {
                    setUpdateFeeModalTest(null);
                    router.push('/setup/ratelist');
                  }} 
                  className="text-orange-600 underline font-bold"
                >
                  usg case ratelist
                </button>{' '}
                page to update the entire ratelist.
              </p>

              <form onSubmit={handleSaveFeeUpdate} className="flex items-center gap-3 pt-2">
                <span className="font-bold text-slate-800 text-xs min-w-[100px]">{updateFeeModalTest.title}</span>
                <input
                  type="number"
                  value={updateFeeValue}
                  onChange={(e) => setUpdateFeeValue(e.target.value)}
                  className="w-36 h-9 px-3 border border-orange-500 rounded-lg text-xs font-bold text-slate-900 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Update
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
