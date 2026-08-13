'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { 
  FlaskConical, 
  ShieldCheck, 
  User, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Sliders, 
  FileText, 
  Users, 
  LogOut, 
  Building2, 
  Loader2, 
  Search,
  X,
  Sparkles,
  Layers,
  Award,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';

function AdminLoginForm() {
  const { login, error, setError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      // Error set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-orange-100 rounded-3xl p-8 shadow-xl shadow-orange-500/10 max-w-md w-full">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Error</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Lab Admin ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter Lab Admin ID"
              className="w-full pl-11 pr-4 py-3 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Admin Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Authenticating Admin...</span>
            </>
          ) : (
            <>
              <span>Sign In as Lab Admin</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function LabAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tests');
  
  // Data States
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [signatories, setSignatories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Test Modal States
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [testForm, setTestForm] = useState({
    title: '',
    category: 'Hematology',
    basePrice: 500,
    taxPercentage: 0,
    description: '',
    notes: '',
    parameters: [
      { name: '', referenceRange: '', unit: '' }
    ]
  });

  // Category Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  // Signatory Modal States
  const [showSignatoryModal, setShowSignatoryModal] = useState(false);
  const [signatoryForm, setSignatoryForm] = useState({
    name: '',
    designation: 'Pathologist',
    qualification: 'MD Pathology',
    registrationNumber: ''
  });

  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      const [testsRes, categoriesRes, signatoriesRes] = await Promise.all([
        api.get('/lab/tests').catch(() => []),
        api.get('/lab/test-categories').catch(() => []),
        api.get('/lab/signatories').catch(() => [])
      ]);
      setTests(Array.isArray(testsRes) ? testsRes : []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
      setSignatories(Array.isArray(signatoriesRes) ? signatoriesRes : []);
    } catch (err) {
      console.error('Failed to load lab admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handlers for Lab Tests
  const handleOpenAddTest = () => {
    setEditingTestId(null);
    setTestForm({
      title: '',
      category: categories[0]?.name || 'Hematology',
      basePrice: 500,
      taxPercentage: 0,
      description: '',
      notes: '',
      parameters: [
        { name: 'Hemoglobin', referenceRange: '13.5 - 17.5', unit: 'g/dL' },
        { name: 'Total Leukocyte Count (TLC)', referenceRange: '4,000 - 11,000', unit: '/cu mm' }
      ]
    });
    setShowTestModal(true);
  };

  const handleOpenEditTest = (testItem) => {
    setEditingTestId(testItem._id);
    setTestForm({
      title: testItem.title || testItem.test || '',
      category: testItem.category || 'Hematology',
      basePrice: testItem.basePrice || 0,
      taxPercentage: testItem.taxPercentage || 0,
      description: testItem.description || '',
      notes: testItem.notes || '',
      parameters: Array.isArray(testItem.parameters) && testItem.parameters.length > 0
        ? testItem.parameters.map(p => ({ name: p.name || '', referenceRange: p.referenceRange || '', unit: p.unit || '' }))
        : [{ name: '', referenceRange: '', unit: '' }]
    });
    setShowTestModal(true);
  };

  const handleAddParameter = () => {
    setTestForm({
      ...testForm,
      parameters: [...testForm.parameters, { name: '', referenceRange: '', unit: '' }]
    });
  };

  const handleRemoveParameter = (index) => {
    const updated = testForm.parameters.filter((_, i) => i !== index);
    setTestForm({ ...testForm, parameters: updated });
  };

  const handleParameterChange = (index, field, value) => {
    const updated = [...testForm.parameters];
    updated[index][field] = value;
    setTestForm({ ...testForm, parameters: updated });
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    if (!testForm.title.trim()) {
      alert('Please enter a test title');
      return;
    }

    try {
      const payload = {
        title: testForm.title.trim(),
        test: testForm.title.trim(),
        category: testForm.category,
        basePrice: Number(testForm.basePrice) || 0,
        taxPercentage: Number(testForm.taxPercentage) || 0,
        description: testForm.description,
        notes: testForm.notes,
        parameters: testForm.parameters.filter(p => p.name.trim() !== '')
      };

      if (editingTestId) {
        await api.put(`/lab/tests/${editingTestId}`, payload);
      } else {
        await api.post('/lab/tests', payload);
      }

      setShowTestModal(false);
      loadAdminData();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save lab test');
    }
  };

  const handleDeleteTest = async (id) => {
    if (!confirm('Are you sure you want to delete this lab test template?')) return;
    try {
      await api.delete(`/lab/tests/${id}`);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete test');
    }
  };

  // Category Save Handler
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      await api.post('/lab/test-categories', { name: categoryName.trim() });
      setCategoryName('');
      setShowCategoryModal(false);
      loadAdminData();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save category');
    }
  };

  // Signatory Save Handler
  const handleSaveSignatory = async (e) => {
    e.preventDefault();
    if (!signatoryForm.name.trim()) return;
    try {
      await api.post('/lab/signatories', signatoryForm);
      setSignatoryForm({ name: '', designation: 'Pathologist', qualification: 'MD Pathology', registrationNumber: '' });
      setShowSignatoryModal(false);
      loadAdminData();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save signatory');
    }
  };

  const filteredTests = tests.filter(t => 
    (t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30 text-slate-900 font-sans flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 px-6 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/20 border border-orange-200">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Medora 360</h1>
                <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold tracking-wider rounded-md bg-orange-500 text-white shadow-sm">
                  Lab Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-orange-500" />
                <span className="font-semibold text-slate-700">
                  {user?.hospitalName || 'Hospital Laboratory Directory Setup'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 bg-orange-50 border border-orange-200 rounded-xl px-3.5 py-1.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-sm">
                R
              </div>
              <div className="text-left text-xs">
                <p className="font-extrabold text-slate-900">{user?.username || 'Lab Admin'}</p>
                <p className="text-orange-700 font-bold capitalize">Lab Admin</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 text-white shadow-xl shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-orange-400">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Lab Test & Parameter Designer
            </div>
            <h2 className="text-2xl font-black tracking-tight">Lab Admin Management Portal</h2>
            <p className="text-orange-50 text-xs font-medium mt-1">
              Logged in as <span className="font-extrabold underline text-white">{user?.username || 'Lab Admin'}</span> (Lab Administrator). Define test catalog, parameters, units, reference ranges, and diagnostic structures for lab users.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddTest}
              className="px-5 py-3 bg-white text-orange-600 hover:bg-orange-50 font-black rounded-xl shadow-md text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <span>Create New Lab Test</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-orange-100/60 p-1 rounded-2xl border border-orange-200 w-fit select-none">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
              activeTab === 'tests' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-700 hover:bg-orange-100'
            }`}
          >
            <FlaskConical className="w-4 h-4" /> Lab Tests Catalog ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
              activeTab === 'categories' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-700 hover:bg-orange-100'
            }`}
          >
            <Layers className="w-4 h-4" /> Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('signatories')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
              activeTab === 'signatories' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-700 hover:bg-orange-100'
            }`}
          >
            <Award className="w-4 h-4" /> Pathologists / Signatories ({signatories.length})
          </button>
        </div>

        {/* Tab 1: Lab Tests Directory */}
        {activeTab === 'tests' && (
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Configured Laboratory Tests</h3>
                <p className="text-xs text-slate-500 font-medium">Tests & fields available for lab users during report entry</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search test or category..."
                    className="w-full pl-9 pr-4 py-2 bg-orange-50/20 border border-orange-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <button
                  onClick={handleOpenAddTest}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Test
                </button>
              </div>
            </div>

            {loadingData ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FlaskConical className="w-12 h-12 mx-auto text-orange-300 mb-2" />
                <p className="font-bold text-slate-600">No Lab Tests Found</p>
                <p className="text-xs mt-1">Click "Create New Lab Test" above to define test templates & parameters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTests.map((testItem) => (
                  <div key={testItem._id} className="bg-white border border-orange-100 rounded-2xl p-5 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-orange-100 text-orange-700 border border-orange-200">
                          {testItem.category || 'General'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditTest(testItem)}
                            className="p-1.5 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors"
                            title="Edit Test"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTest(testItem._id)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Delete Test"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-black text-slate-900">{testItem.title || testItem.test}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Price: <span className="text-slate-900 font-bold">₹{testItem.basePrice || 0}</span>
                      </p>

                      {/* Parameters List Summary */}
                      <div className="mt-3 pt-3 border-t border-orange-100/80 space-y-1">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Test Parameters ({testItem.parameters?.length || 0}):
                        </p>
                        {Array.isArray(testItem.parameters) && testItem.parameters.length > 0 ? (
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {testItem.parameters.map((param, idx) => (
                              <div key={idx} className="text-xs bg-orange-50/50 p-1.5 rounded-lg border border-orange-100 flex items-center justify-between">
                                <span className="font-semibold text-slate-800">{param.name}</span>
                                <span className="text-[10px] text-slate-500">
                                  {param.referenceRange ? `Ref: ${param.referenceRange}` : ''} {param.unit ? `(${param.unit})` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs italic text-slate-400">No parameter fields defined</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-orange-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Status: <strong className="text-emerald-600">Active</strong></span>
                      <button
                        onClick={() => handleOpenEditTest(testItem)}
                        className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                      >
                        Edit Fields <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Test Categories */}
        {activeTab === 'categories' && (
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Lab Test Categories</h3>
                <p className="text-xs text-slate-500 font-medium">Group diagnostic tests under departments</p>
              </div>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div key={cat._id || cat.name} className="p-4 bg-orange-50/40 border border-orange-200 rounded-2xl flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Pathologists & Signatories */}
        {activeTab === 'signatories' && (
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Lab Signatories & Pathologists</h3>
                <p className="text-xs text-slate-500 font-medium">Authorized doctors and pathologists for report signing</p>
              </div>
              <button
                onClick={() => setShowSignatoryModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Signatory
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signatories.map((sig) => (
                <div key={sig._id} className="p-4 bg-white border border-orange-100 rounded-2xl shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-base">
                    {sig.name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{sig.name}</h4>
                    <p className="text-xs text-slate-500">{sig.designation || 'Pathologist'} • {sig.qualification || 'MD'}</p>
                    {sig.registrationNumber && <p className="text-[10px] text-orange-600 font-semibold mt-0.5">Reg: {sig.registrationNumber}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create/Edit Lab Test */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-orange-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingTestId ? 'Edit Lab Test' : 'Create New Laboratory Test'}
                </h3>
                <p className="text-xs text-slate-500">Define test parameters, normal ranges, and pricing</p>
              </div>
              <button onClick={() => setShowTestModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Test Title / Name *</label>
                  <input
                    type="text"
                    required
                    value={testForm.title}
                    onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                    placeholder="e.g. Complete Blood Count (CBC)"
                    className="w-full px-3.5 py-2.5 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={testForm.category}
                    onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.length > 0 ? (
                      categories.map(c => <option key={c._id || c.name} value={c.name}>{c.name}</option>)
                    ) : (
                      <>
                        <option value="Hematology">Hematology</option>
                        <option value="Biochemistry">Biochemistry</option>
                        <option value="Microbiology">Microbiology</option>
                        <option value="Serology">Serology</option>
                        <option value="Radiology">Radiology</option>
                        <option value="Pathology">Pathology</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    value={testForm.basePrice}
                    onChange={(e) => setTestForm({ ...testForm, basePrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tax (%)</label>
                  <input
                    type="number"
                    value={testForm.taxPercentage}
                    onChange={(e) => setTestForm({ ...testForm, taxPercentage: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Dynamic Parameter / Fields Section */}
              <div className="border-t border-orange-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Test Parameters & Fields</h4>
                    <p className="text-[11px] text-slate-500">Inputs filled by lab users during result recording</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddParameter}
                    className="px-3 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {testForm.parameters.map((param, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-orange-50/30 p-2.5 rounded-xl border border-orange-100">
                      <input
                        type="text"
                        placeholder="Parameter Name (e.g. Hemoglobin)"
                        value={param.name}
                        onChange={(e) => handleParameterChange(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Ref Range (e.g. 13.5-17.5)"
                        value={param.referenceRange}
                        onChange={(e) => handleParameterChange(idx, 'referenceRange', e.target.value)}
                        className="w-32 px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Unit (g/dL)"
                        value={param.unit}
                        onChange={(e) => handleParameterChange(idx, 'unit', e.target.value)}
                        className="w-24 px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveParameter(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-orange-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Lab Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-black text-slate-900">Add Test Category</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <input
                type="text"
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Microbiology"
                className="w-full px-3.5 py-2.5 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Signatory */}
      {showSignatoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-black text-slate-900">Add Pathologist / Signatory</h3>
            <form onSubmit={handleSaveSignatory} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Doctor Name (e.g. Dr. Ravi Verma)"
                value={signatoryForm.name}
                onChange={(e) => setSignatoryForm({ ...signatoryForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none"
              />
              <input
                type="text"
                placeholder="Designation (e.g. Senior Pathologist)"
                value={signatoryForm.designation}
                onChange={(e) => setSignatoryForm({ ...signatoryForm, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none"
              />
              <input
                type="text"
                placeholder="Qualification (e.g. MD Pathology)"
                value={signatoryForm.qualification}
                onChange={(e) => setSignatoryForm({ ...signatoryForm, qualification: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none"
              />
              <input
                type="text"
                placeholder="Registration No. (Optional)"
                value={signatoryForm.registrationNumber}
                onChange={(e) => setSignatoryForm({ ...signatoryForm, registrationNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSignatoryModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold">Save Signatory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const isLabAdmin = user?.role === 'labadmin' || user?.role === 'lab_admin' || user?.role === 'admin';

  if (!isLabAdmin) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 text-slate-900 font-sans">
        <div className="w-full max-w-md px-6 py-8 relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25 mb-4 border border-orange-200">
            <FlaskConical className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700">
            Lab Admin Portal
          </h1>
          <p className="text-orange-600 font-bold text-xs tracking-wider uppercase mt-1 flex items-center gap-1.5 mb-6">
            <ShieldCheck className="w-4 h-4 text-orange-500" /> Laboratory Admin Authentication
          </p>

          <Suspense fallback={<div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    );
  }

  return <LabAdminDashboard />;
}
