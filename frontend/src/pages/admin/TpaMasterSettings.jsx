import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Building2,
  Plus,
  Edit3,
  Trash2,
  Search,
  X,
  Loader2,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  Clock,
  Percent,
  Save,
  AlertTriangle,
  Layers,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import PaginationFooter from '../../components/PaginationFooter';

const PAYER_TYPES = [
  'Private',
  'Public PSU',
  'Standalone Health',
  'Government Scheme',
  'Corporate Trust'
];

const TpaMasterSettings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Active Tab: 'insurers' | 'tpas'
  const [activeTab, setActiveTab] = useState('insurers');

  // ==========================================
  // TAB 1: INSURANCE COMPANIES STATE
  // ==========================================
  const [insurers, setInsurers] = useState([]);
  const [loadingInsurers, setLoadingInsurers] = useState(false);
  const [insurerSearch, setInsurerSearch] = useState('');
  const [insurerPayerType, setInsurerPayerType] = useState('');
  const [insurerStatus, setInsurerStatus] = useState('');
  const [insurerPage, setInsurerPage] = useState(1);
  const [insurerPageSize, setInsurerPageSize] = useState(20);
  const [insurerTotalRecords, setInsurerTotalRecords] = useState(0);
  const [insurerTotalPages, setInsurerTotalPages] = useState(1);

  // Insurer Modal & Form
  const [showInsurerModal, setShowInsurerModal] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState(null);
  const [viewingInsurer, setViewingInsurer] = useState(null);
  const [savingInsurer, setSavingInsurer] = useState(false);
  const [insurerForm, setInsurerForm] = useState({
    name: '',
    code: '',
    payerType: 'Private',
    tollFreeNumber: '',
    claimEmail: '',
    cashlessEmail: '',
    portalUrl: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    panNumber: '',
    hasInHouseTpa: false,
    settlementTatDays: 30,
    notes: ''
  });

  // ==========================================
  // TAB 2: TPA PROVIDERS STATE
  // ==========================================
  const [tpas, setTpas] = useState([]);
  const [loadingTpas, setLoadingTpas] = useState(false);
  const [tpaSearch, setTpaSearch] = useState('');
  const [tpaInsurerFilter, setTpaInsurerFilter] = useState('');
  const [tpaStatus, setTpaStatus] = useState('');
  const [tpaPage, setTpaPage] = useState(1);
  const [tpaPageSize, setTpaPageSize] = useState(20);
  const [tpaTotalRecords, setTpaTotalRecords] = useState(0);
  const [tpaTotalPages, setTpaTotalPages] = useState(1);

  // Active Insurance Companies for TPA Association dropdown/multiselect
  const [activeInsurersList, setActiveInsurersList] = useState([]);

  // TPA Modal & Form
  const [showTpaModal, setShowTpaModal] = useState(false);
  const [editingTpa, setEditingTpa] = useState(null);
  const [viewingTpa, setViewingTpa] = useState(null);
  const [savingTpa, setSavingTpa] = useState(false);
  const [tpaForm, setTpaForm] = useState({
    name: '',
    code: '',
    irdaiLicenseNo: '',
    associatedInsurers: [],
    contactPerson: '',
    contactPhone: '',
    preauthEmail: '',
    claimsEmail: '',
    portalUrl: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    preauthTatHours: 6,
    discountRatePercentage: 0,
    notes: ''
  });

  // ==========================================
  // DATA LOADERS
  // ==========================================
  const loadInsurers = useCallback(async () => {
    setLoadingInsurers(true);
    try {
      const params = new URLSearchParams();
      if (insurerSearch.trim()) params.append('search', insurerSearch.trim());
      if (insurerPayerType) params.append('payerType', insurerPayerType);
      if (insurerStatus) params.append('status', insurerStatus);
      params.append('page', insurerPage);
      params.append('limit', insurerPageSize);

      const { data } = await client.get(`/tpa/insurance-companies?${params.toString()}`);
      if (data && data.insuranceCompanies) {
        setInsurers(data.insuranceCompanies);
        setInsurerTotalRecords(data.totalRecords || 0);
        setInsurerTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setInsurers(data);
        setInsurerTotalRecords(data.length);
        setInsurerTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load insurance companies:', err);
      toast.error('Failed to load insurance companies');
    } finally {
      setLoadingInsurers(false);
    }
  }, [insurerSearch, insurerPayerType, insurerStatus, insurerPage, insurerPageSize]);

  const loadActiveInsurersList = useCallback(async () => {
    try {
      const { data } = await client.get('/tpa/insurance-companies/active');
      setActiveInsurersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load active insurance list:', err);
    }
  }, []);

  const loadTpas = useCallback(async () => {
    setLoadingTpas(true);
    try {
      const params = new URLSearchParams();
      if (tpaSearch.trim()) params.append('search', tpaSearch.trim());
      if (tpaInsurerFilter) params.append('insurerId', tpaInsurerFilter);
      if (tpaStatus) params.append('status', tpaStatus);
      params.append('page', tpaPage);
      params.append('limit', tpaPageSize);

      const { data } = await client.get(`/tpa/providers?${params.toString()}`);
      if (data && data.tpaProviders) {
        setTpas(data.tpaProviders);
        setTpaTotalRecords(data.totalRecords || 0);
        setTpaTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setTpas(data);
        setTpaTotalRecords(data.length);
        setTpaTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load TPAs:', err);
      toast.error('Failed to load TPAs');
    } finally {
      setLoadingTpas(false);
    }
  }, [tpaSearch, tpaInsurerFilter, tpaStatus, tpaPage, tpaPageSize]);

  // Initial and reactive effects
  useEffect(() => {
    if (activeTab === 'insurers') {
      loadInsurers();
    } else if (activeTab === 'tpas') {
      loadTpas();
      loadActiveInsurersList();
    }
  }, [activeTab, loadInsurers, loadTpas, loadActiveInsurersList]);

  // ==========================================
  // TAB 1: INSURANCE COMPANY CRUD HANDLERS
  // ==========================================
  const handleOpenCreateInsurer = () => {
    setEditingInsurer(null);
    setViewingInsurer(null);
    setInsurerForm({
      name: '',
      code: '',
      payerType: 'Private',
      tollFreeNumber: '',
      claimEmail: '',
      cashlessEmail: '',
      portalUrl: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstin: '',
      panNumber: '',
      hasInHouseTpa: false,
      settlementTatDays: 30,
      notes: ''
    });
    setShowInsurerModal(true);
  };

  const handleOpenEditInsurer = (item) => {
    setEditingInsurer(item);
    setViewingInsurer(null);
    setInsurerForm({
      name: item.name || '',
      code: item.code || '',
      payerType: item.payerType || 'Private',
      tollFreeNumber: item.tollFreeNumber || '',
      claimEmail: item.claimEmail || '',
      cashlessEmail: item.cashlessEmail || '',
      portalUrl: item.portalUrl || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      pincode: item.pincode || '',
      gstin: item.gstin || '',
      panNumber: item.panNumber || '',
      hasInHouseTpa: Boolean(item.hasInHouseTpa),
      settlementTatDays: item.settlementTatDays || 30,
      notes: item.notes || ''
    });
    setShowInsurerModal(true);
  };

  const handleOpenViewInsurer = (item) => {
    setViewingInsurer(item);
    setEditingInsurer(null);
    setShowInsurerModal(true);
  };

  const handleSaveInsurer = async (e) => {
    e.preventDefault();
    if (!insurerForm.name.trim()) {
      toast.error('Insurance Company Name is required');
      return;
    }

    setSavingInsurer(true);
    try {
      const payload = {
        ...insurerForm,
        name: insurerForm.name.trim(),
        code: insurerForm.code.trim() || undefined,
        settlementTatDays: Number(insurerForm.settlementTatDays) || 30
      };

      if (editingInsurer) {
        await client.put(`/tpa/insurance-companies/${editingInsurer._id}`, payload);
        toast.success('Insurance Company updated successfully');
      } else {
        await client.post('/tpa/insurance-companies', payload);
        toast.success('Insurance Company added successfully');
      }

      setShowInsurerModal(false);
      loadInsurers();
      loadActiveInsurersList();
    } catch (err) {
      console.error('Save Insurer Error:', err);
      toast.error(err.response?.data?.message || 'Failed to save insurance company');
    } finally {
      setSavingInsurer(false);
    }
  };

  const handleToggleInsurerStatus = async (item) => {
    try {
      const { data } = await client.patch(`/tpa/insurance-companies/${item._id}/status`, {
        isActive: !item.isActive
      });
      toast.success(data.message || `Insurance company ${!item.isActive ? 'activated' : 'deactivated'}`);
      loadInsurers();
      loadActiveInsurersList();
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteInsurer = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await client.delete(`/tpa/insurance-companies/${item._id}`);
      toast.success('Insurance company deleted successfully');
      loadInsurers();
      loadActiveInsurersList();
    } catch (err) {
      console.error('Delete Insurer Error:', err);
      const msg = err.response?.data?.message || 'Failed to delete insurance company';
      toast.error(msg, { duration: 5000 });
    }
  };

  // ==========================================
  // TAB 2: TPA PROVIDER CRUD HANDLERS
  // ==========================================
  const handleOpenCreateTpa = () => {
    setEditingTpa(null);
    setViewingTpa(null);
    setTpaForm({
      name: '',
      code: '',
      irdaiLicenseNo: '',
      associatedInsurers: [],
      contactPerson: '',
      contactPhone: '',
      preauthEmail: '',
      claimsEmail: '',
      portalUrl: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      preauthTatHours: 6,
      discountRatePercentage: 0,
      notes: ''
    });
    setShowTpaModal(true);
  };

  const handleOpenEditTpa = (item) => {
    setEditingTpa(item);
    setViewingTpa(null);
    const existingInsurerIds = (item.associatedInsurers || []).map(ins =>
      typeof ins === 'object' ? ins._id : ins
    );

    setTpaForm({
      name: item.name || '',
      code: item.code || '',
      irdaiLicenseNo: item.irdaiLicenseNo || '',
      associatedInsurers: existingInsurerIds,
      contactPerson: item.contactPerson || '',
      contactPhone: item.contactPhone || '',
      preauthEmail: item.preauthEmail || '',
      claimsEmail: item.claimsEmail || '',
      portalUrl: item.portalUrl || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      pincode: item.pincode || '',
      preauthTatHours: item.preauthTatHours || 6,
      discountRatePercentage: item.discountRatePercentage || 0,
      notes: item.notes || ''
    });
    setShowTpaModal(true);
  };

  const handleOpenViewTpa = (item) => {
    setViewingTpa(item);
    setEditingTpa(null);
    setShowTpaModal(true);
  };

  const handleSaveTpa = async (e) => {
    e.preventDefault();
    if (!tpaForm.name.trim()) {
      toast.error('TPA Name is required');
      return;
    }
    if (!tpaForm.contactPhone.trim()) {
      toast.error('Contact Phone is required');
      return;
    }
    if (!tpaForm.preauthEmail.trim()) {
      toast.error('Pre-authorization Email is required');
      return;
    }

    setSavingTpa(true);
    try {
      const payload = {
        ...tpaForm,
        name: tpaForm.name.trim(),
        code: tpaForm.code.trim() || undefined,
        contactPhone: tpaForm.contactPhone.trim(),
        preauthEmail: tpaForm.preauthEmail.trim(),
        preauthTatHours: Number(tpaForm.preauthTatHours) || 6,
        discountRatePercentage: Number(tpaForm.discountRatePercentage) || 0
      };

      if (editingTpa) {
        await client.put(`/tpa/providers/${editingTpa._id}`, payload);
        toast.success('TPA Provider updated successfully');
      } else {
        await client.post('/tpa/providers', payload);
        toast.success('TPA Provider created successfully');
      }

      setShowTpaModal(false);
      loadTpas();
    } catch (err) {
      console.error('Save TPA Error:', err);
      toast.error(err.response?.data?.message || 'Failed to save TPA Provider');
    } finally {
      setSavingTpa(false);
    }
  };

  const handleToggleTpaStatus = async (item) => {
    try {
      const { data } = await client.patch(`/tpa/providers/${item._id}/status`, {
        isActive: !item.isActive
      });
      toast.success(data.message || `TPA ${!item.isActive ? 'activated' : 'deactivated'}`);
      loadTpas();
    } catch (err) {
      console.error('Toggle TPA status error:', err);
      toast.error(err.response?.data?.message || 'Failed to update TPA status');
    }
  };

  const handleDeleteTpa = async (item) => {
    if (!window.confirm(`Are you sure you want to delete TPA "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await client.delete(`/tpa/providers/${item._id}`);
      toast.success('TPA Provider deleted successfully');
      loadTpas();
    } catch (err) {
      console.error('Delete TPA Error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete TPA Provider');
    }
  };

  const toggleInsurerAssociation = (insurerId) => {
    setTpaForm(prev => {
      const exists = prev.associatedInsurers.includes(insurerId);
      if (exists) {
        return {
          ...prev,
          associatedInsurers: prev.associatedInsurers.filter(id => id !== insurerId)
        };
      } else {
        return {
          ...prev,
          associatedInsurers: [...prev.associatedInsurers, insurerId]
        };
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl text-white shadow-md shadow-orange-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                TPA & Insurance Master
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                Configure Insurance Companies, TPAs (Third Party Administrators), and Cashless Pre-Auth settings
              </p>
            </div>
          </div>
        </div>

        <div>
          {activeTab === 'insurers' ? (
            <button
              type="button"
              onClick={handleOpenCreateInsurer}
              className="btn text-sm py-2.5 px-4 flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Insurance Company
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateTpa}
              className="btn text-sm py-2.5 px-4 flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add TPA Provider
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-orange-100 bg-white rounded-t-2xl px-2 pt-2 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('insurers')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2.5 cursor-pointer rounded-t-xl ${
            activeTab === 'insurers'
              ? 'border-orange-500 text-orange-600 bg-orange-50/50'
              : 'border-transparent text-gray-500 hover:text-orange-600 hover:bg-orange-50/20'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Insurance Companies</span>
          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold">
            {insurerTotalRecords}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tpas')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2.5 cursor-pointer rounded-t-xl ${
            activeTab === 'tpas'
              ? 'border-orange-500 text-orange-600 bg-orange-50/50'
              : 'border-transparent text-gray-500 hover:text-orange-600 hover:bg-orange-50/20'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>TPA Providers</span>
          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold">
            {tpaTotalRecords}
          </span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: INSURANCE COMPANIES VIEW                                  */}
      {/* ================================================================ */}
      {activeTab === 'insurers' && (
        <div className="space-y-4">
          {/* Filters Card */}
          <div className="card p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="input pl-9 py-2.5 text-sm"
                  placeholder="Search by Name, Code, Email, Toll-free, City..."
                  value={insurerSearch}
                  onChange={(e) => {
                    setInsurerSearch(e.target.value);
                    setInsurerPage(1);
                  }}
                />
                {insurerSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setInsurerSearch('');
                      setInsurerPage(1);
                    }}
                    className="absolute right-2.5 top-2.5 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Payer Type Filter */}
              <div>
                <select
                  className="input py-2.5 text-sm cursor-pointer"
                  value={insurerPayerType}
                  onChange={(e) => {
                    setInsurerPayerType(e.target.value);
                    setInsurerPage(1);
                  }}
                >
                  <option value="">All Payer Types</option>
                  {PAYER_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter & Refresh */}
              <div className="flex gap-2">
                <select
                  className="input py-2.5 text-sm flex-1 cursor-pointer"
                  value={insurerStatus}
                  onChange={(e) => {
                    setInsurerStatus(e.target.value);
                    setInsurerPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                <button
                  type="button"
                  onClick={loadInsurers}
                  className="btn-secondary py-2.5 px-3 cursor-pointer"
                  title="Refresh Table"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingInsurers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Insurance Companies Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                    <th className="p-3.5 pl-4">Company Code</th>
                    <th className="p-3.5">Company Name & Type</th>
                    <th className="p-3.5">Cashless & Claims Contact</th>
                    <th className="p-3.5">TPA Mode & TAT</th>
                    <th className="p-3.5">City / Location</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {loadingInsurers ? (
                    <tr>
                      <td colSpan="7" className="p-6">
                        <SkeletonTable rows={4} columns={7} className="w-full" />
                      </td>
                    </tr>
                  ) : insurers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center text-gray-400">
                        <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40 text-orange-400" />
                        <p className="font-bold text-gray-700">No insurance companies found</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {insurerSearch || insurerPayerType || insurerStatus
                            ? 'Try clearing your filters to see more results'
                            : 'Click "Add Insurance Company" to create your first insurer master record'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    insurers.map(company => (
                      <tr key={company._id} className="hover:bg-orange-50/20 transition-colors">
                        {/* Code */}
                        <td className="p-3.5 pl-4 font-mono font-bold text-orange-700 whitespace-nowrap">
                          {company.code}
                        </td>

                        {/* Name & Payer Type */}
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900 leading-snug">{company.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-900 border border-amber-200/60">
                              {company.payerType}
                            </span>
                            {company.portalUrl && (
                              <a
                                href={company.portalUrl.startsWith('http') ? company.portalUrl : `https://${company.portalUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                                title="Open Insurer Portal"
                              >
                                Portal <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="p-3.5 text-xs text-gray-600 space-y-0.5">
                          {company.cashlessEmail && (
                            <div className="flex items-center gap-1 text-gray-700 truncate max-w-[220px]" title={`Cashless: ${company.cashlessEmail}`}>
                              <Mail className="h-3 w-3 text-orange-500 shrink-0" />
                              <span className="truncate">{company.cashlessEmail}</span>
                            </div>
                          )}
                          {company.tollFreeNumber && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                              <span>{company.tollFreeNumber}</span>
                            </div>
                          )}
                          {!company.cashlessEmail && !company.tollFreeNumber && (
                            <span className="text-gray-400 italic">No contact details</span>
                          )}
                        </td>

                        {/* TPA Mode & TAT */}
                        <td className="p-3.5 text-xs">
                          {company.hasInHouseTpa ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <Layers className="h-2.5 w-2.5" /> In-House TPA
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">Via Empanelled TPAs</span>
                          )}
                          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>TAT: {company.settlementTatDays || 30} days</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="p-3.5 text-xs text-gray-600">
                          {company.city ? (
                            <div>
                              <span className="font-semibold text-gray-800">{company.city}</span>
                              {company.state ? <span className="text-gray-500">, {company.state}</span> : ''}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleInsurerStatus(company)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                              company.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Click to toggle Active/Inactive status"
                          >
                            {company.isActive ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-gray-400" />
                            )}
                            {company.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 pr-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenViewInsurer(company)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditInsurer(company)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Edit Insurance Company"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteInsurer(company)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Delete Insurance Company"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <PaginationFooter
              currentPage={insurerPage}
              pageSize={insurerPageSize}
              totalRecords={insurerTotalRecords}
              totalPages={insurerTotalPages}
              onPageChange={(page) => setInsurerPage(page)}
              onPageSizeChange={(size) => {
                setInsurerPageSize(size);
                setInsurerPage(1);
              }}
              loading={loadingInsurers}
              itemLabel="insurance companies"
            />
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: TPA PROVIDERS VIEW                                        */}
      {/* ================================================================ */}
      {activeTab === 'tpas' && (
        <div className="space-y-4">
          {/* Filters Card */}
          <div className="card p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="input pl-9 py-2.5 text-sm"
                  placeholder="Search by TPA Name, Code, Phone, Email, License..."
                  value={tpaSearch}
                  onChange={(e) => {
                    setTpaSearch(e.target.value);
                    setTpaPage(1);
                  }}
                />
                {tpaSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setTpaSearch('');
                      setTpaPage(1);
                    }}
                    className="absolute right-2.5 top-2.5 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Insurer Filter */}
              <div>
                <select
                  className="input py-2.5 text-sm cursor-pointer"
                  value={tpaInsurerFilter}
                  onChange={(e) => {
                    setTpaInsurerFilter(e.target.value);
                    setTpaPage(1);
                  }}
                >
                  <option value="">All Associated Insurers</option>
                  {activeInsurersList.map(ins => (
                    <option key={ins._id} value={ins._id}>
                      {ins.name} ({ins.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter & Refresh */}
              <div className="flex gap-2">
                <select
                  className="input py-2.5 text-sm flex-1 cursor-pointer"
                  value={tpaStatus}
                  onChange={(e) => {
                    setTpaStatus(e.target.value);
                    setTpaPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                <button
                  type="button"
                  onClick={loadTpas}
                  className="btn-secondary py-2.5 px-3 cursor-pointer"
                  title="Refresh Table"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingTpas ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* TPA Providers Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                    <th className="p-3.5 pl-4">TPA Code</th>
                    <th className="p-3.5">TPA Provider Name</th>
                    <th className="p-3.5">Pre-Auth Contact</th>
                    <th className="p-3.5">Associated Insurers</th>
                    <th className="p-3.5">TAT & Discount</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {loadingTpas ? (
                    <tr>
                      <td colSpan="7" className="p-6">
                        <SkeletonTable rows={4} columns={7} className="w-full" />
                      </td>
                    </tr>
                  ) : tpas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center text-gray-400">
                        <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-40 text-orange-400" />
                        <p className="font-bold text-gray-700">No TPA providers found</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {tpaSearch || tpaInsurerFilter || tpaStatus
                            ? 'Try clearing your filters to see more results'
                            : 'Click "Add TPA Provider" to configure your first Third Party Administrator'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    tpas.map(tpa => (
                      <tr key={tpa._id} className="hover:bg-orange-50/20 transition-colors">
                        {/* Code & IRDAI */}
                        <td className="p-3.5 pl-4 font-mono font-bold text-orange-700 whitespace-nowrap">
                          <div>{tpa.code}</div>
                          {tpa.irdaiLicenseNo && (
                            <div className="text-[10px] text-gray-500 font-sans">
                              Lic: {tpa.irdaiLicenseNo}
                            </div>
                          )}
                        </td>

                        {/* Name & Portal */}
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900 leading-snug">{tpa.name}</div>
                          {tpa.contactPerson && (
                            <div className="text-xs text-gray-500">Contact: {tpa.contactPerson}</div>
                          )}
                          {tpa.portalUrl && (
                            <a
                              href={tpa.portalUrl.startsWith('http') ? tpa.portalUrl : `https://${tpa.portalUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 mt-0.5"
                            >
                              TPA Portal <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </td>

                        {/* Pre-Auth Contact */}
                        <td className="p-3.5 text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
                            <Phone className="h-3 w-3 text-green-600 shrink-0" />
                            <span>{tpa.contactPhone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600 truncate max-w-[200px]" title={tpa.preauthEmail}>
                            <Mail className="h-3 w-3 text-orange-500 shrink-0" />
                            <span className="truncate">{tpa.preauthEmail}</span>
                          </div>
                        </td>

                        {/* Associated Insurers */}
                        <td className="p-3.5 text-xs">
                          {tpa.associatedInsurers && tpa.associatedInsurers.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {tpa.associatedInsurers.slice(0, 3).map(ins => (
                                <span
                                  key={typeof ins === 'object' ? ins._id : ins}
                                  className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100 truncate max-w-[120px]"
                                  title={typeof ins === 'object' ? ins.name : 'Insurer'}
                                >
                                  {typeof ins === 'object' ? ins.name : 'Insurer'}
                                </span>
                              ))}
                              {tpa.associatedInsurers.length > 3 && (
                                <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700">
                                  +{tpa.associatedInsurers.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">None linked</span>
                          )}
                        </td>

                        {/* TAT & Discount */}
                        <td className="p-3.5 text-xs space-y-1">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                            <span>Pre-auth TAT: <strong>{tpa.preauthTatHours || 6}h</strong></span>
                          </div>
                          {Number(tpa.discountRatePercentage) > 0 ? (
                            <div className="flex items-center gap-1 text-green-700 font-semibold">
                              <Percent className="h-3 w-3 text-green-600 shrink-0" />
                              <span>{tpa.discountRatePercentage}% Discount</span>
                            </div>
                          ) : null}
                        </td>

                        {/* Status Toggle */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleTpaStatus(tpa)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                              tpa.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Click to toggle Active/Inactive status"
                          >
                            {tpa.isActive ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-gray-400" />
                            )}
                            {tpa.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 pr-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenViewTpa(tpa)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditTpa(tpa)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Edit TPA Provider"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTpa(tpa)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Delete TPA Provider"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <PaginationFooter
              currentPage={tpaPage}
              pageSize={tpaPageSize}
              totalRecords={tpaTotalRecords}
              totalPages={tpaTotalPages}
              onPageChange={(page) => setTpaPage(page)}
              onPageSizeChange={(size) => {
                setTpaPageSize(size);
                setTpaPage(1);
              }}
              loading={loadingTpas}
              itemLabel="TPA providers"
            />
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 1: INSURANCE COMPANY CREATE / EDIT / VIEW MODAL            */}
      {/* ================================================================ */}
      {showInsurerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setShowInsurerModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-3xl my-8 border border-orange-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-orange-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900">
                    {viewingInsurer
                      ? 'Insurance Company Details'
                      : editingInsurer
                      ? 'Edit Insurance Company'
                      : 'Add New Insurance Company'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {viewingInsurer
                      ? 'Detailed master record for this insurer'
                      : 'Define insurer details for cashless processing and claim tracking'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInsurerModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Read-Only View Mode */}
            {viewingInsurer ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/30 p-4 rounded-2xl border border-orange-100">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Company Name</span>
                    <span className="font-bold text-gray-900 text-base">{viewingInsurer.name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Company Code</span>
                    <span className="font-mono font-bold text-orange-700">{viewingInsurer.code}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Payer Type</span>
                    <span className="font-semibold text-gray-800">{viewingInsurer.payerType}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">TPA Handling</span>
                    <span className="font-semibold text-gray-800">
                      {viewingInsurer.hasInHouseTpa ? 'In-House TPA Desk' : 'External Empanelled TPAs'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Cashless Pre-Auth Email</span>
                    <span className="font-medium text-gray-800">{viewingInsurer.cashlessEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Claims Settlement Email</span>
                    <span className="font-medium text-gray-800">{viewingInsurer.claimEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Toll-Free Helpline</span>
                    <span className="font-medium text-gray-800">{viewingInsurer.tollFreeNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Settlement TAT</span>
                    <span className="font-medium text-gray-800">{viewingInsurer.settlementTatDays || 30} Days</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">GSTIN</span>
                    <span className="font-mono text-gray-800">{viewingInsurer.gstin || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">PAN Number</span>
                    <span className="font-mono text-gray-800">{viewingInsurer.panNumber || 'N/A'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Address / Location</span>
                    <span className="text-gray-800">
                      {[viewingInsurer.address, viewingInsurer.city, viewingInsurer.state, viewingInsurer.pincode]
                        .filter(Boolean)
                        .join(', ') || 'N/A'}
                    </span>
                  </div>
                  {viewingInsurer.notes && (
                    <div className="md:col-span-2">
                      <span className="block text-[10px] font-bold uppercase text-gray-400">Notes / Remarks</span>
                      <span className="text-gray-800 whitespace-pre-wrap">{viewingInsurer.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-orange-100">
                  <button
                    type="button"
                    onClick={() => setShowInsurerModal(false)}
                    className="btn-secondary text-sm py-2.5 px-5 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Create / Edit Form */
              <form onSubmit={handleSaveInsurer} className="space-y-4">
                {/* Section: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Insurance Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input py-2.5 text-sm"
                      placeholder="e.g. Star Health & Allied Insurance Co Ltd"
                      value={insurerForm.name}
                      onChange={(e) => setInsurerForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Company Code (Optional)
                    </label>
                    <input
                      type="text"
                      className="input py-2.5 text-sm font-mono uppercase"
                      placeholder={editingInsurer ? 'Code' : 'Auto-generated if blank (e.g. INS-1001)'}
                      value={insurerForm.code}
                      onChange={(e) => setInsurerForm(p => ({ ...p, code: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Payer Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input py-2.5 text-sm cursor-pointer"
                      value={insurerForm.payerType}
                      onChange={(e) => setInsurerForm(p => ({ ...p, payerType: e.target.value }))}
                    >
                      {PAYER_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section: Communication */}
                <div className="border-t border-orange-100 pt-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-2.5">
                    Contact & Communication
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Cashless Authorization Email
                      </label>
                      <input
                        type="email"
                        className="input py-2 text-sm"
                        placeholder="e.g. cashless@starhealth.in"
                        value={insurerForm.cashlessEmail}
                        onChange={(e) => setInsurerForm(p => ({ ...p, cashlessEmail: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Claims Settlement Email
                      </label>
                      <input
                        type="email"
                        className="input py-2 text-sm"
                        placeholder="e.g. claims@starhealth.in"
                        value={insurerForm.claimEmail}
                        onChange={(e) => setInsurerForm(p => ({ ...p, claimEmail: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Toll-Free Helpline
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. 1800-425-2255"
                        value={insurerForm.tollFreeNumber}
                        onChange={(e) => setInsurerForm(p => ({ ...p, tollFreeNumber: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Insurer Web Portal URL
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. https://provider.starhealth.in"
                        value={insurerForm.portalUrl}
                        onChange={(e) => setInsurerForm(p => ({ ...p, portalUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Operational Settings */}
                <div className="border-t border-orange-100 pt-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-2.5">
                    Operations & Tax Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Settlement TAT (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input py-2 text-sm"
                        value={insurerForm.settlementTatDays}
                        onChange={(e) => setInsurerForm(p => ({ ...p, settlementTatDays: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        GSTIN
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm font-mono uppercase"
                        placeholder="e.g. 27AAAAA0000A1Z5"
                        value={insurerForm.gstin}
                        onChange={(e) => setInsurerForm(p => ({ ...p, gstin: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm font-mono uppercase"
                        placeholder="e.g. AAACA0000A"
                        value={insurerForm.panNumber}
                        onChange={(e) => setInsurerForm(p => ({ ...p, panNumber: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasInHouseTpaCheckbox"
                      checked={insurerForm.hasInHouseTpa}
                      onChange={(e) => setInsurerForm(p => ({ ...p, hasInHouseTpa: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 cursor-pointer"
                    />
                    <label htmlFor="hasInHouseTpaCheckbox" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                      Has Dedicated In-House TPA Desk (Direct Hospital Empanelment without external TPA)
                    </label>
                  </div>
                </div>

                {/* Section: Address & Notes */}
                <div className="border-t border-orange-100 pt-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-2.5">
                    Address & Notes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Registered Address
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="Office address, Building, Street..."
                        value={insurerForm.address}
                        onChange={(e) => setInsurerForm(p => ({ ...p, address: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        City
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. Mumbai"
                        value={insurerForm.city}
                        onChange={(e) => setInsurerForm(p => ({ ...p, city: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        State
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. Maharashtra"
                        value={insurerForm.state}
                        onChange={(e) => setInsurerForm(p => ({ ...p, state: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Pincode
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. 400001"
                        value={insurerForm.pincode}
                        onChange={(e) => setInsurerForm(p => ({ ...p, pincode: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Internal Notes / Escalation Contacts
                      </label>
                      <textarea
                        className="input py-2 text-sm min-h-[60px] resize-y"
                        placeholder="Optional internal remarks or special instructions..."
                        value={insurerForm.notes}
                        onChange={(e) => setInsurerForm(p => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end gap-2 pt-4 border-t border-orange-100">
                  <button
                    type="button"
                    onClick={() => setShowInsurerModal(false)}
                    className="btn-secondary text-sm py-2.5 px-4 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingInsurer}
                    className="btn text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer"
                  >
                    {savingInsurer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingInsurer ? 'Update Insurance Company' : 'Create Insurance Company'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 2: TPA PROVIDER CREATE / EDIT / VIEW MODAL                 */}
      {/* ================================================================ */}
      {showTpaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setShowTpaModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-3xl my-8 border border-orange-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-orange-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900">
                    {viewingTpa
                      ? 'TPA Provider Details'
                      : editingTpa
                      ? 'Edit TPA Provider'
                      : 'Add New TPA Provider'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {viewingTpa
                      ? 'Detailed master record for this TPA provider'
                      : 'Configure TPA contact details, TAT expectations, and linked insurers'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTpaModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Read-Only View Mode */}
            {viewingTpa ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/30 p-4 rounded-2xl border border-orange-100">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">TPA Name</span>
                    <span className="font-bold text-gray-900 text-base">{viewingTpa.name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">TPA Code</span>
                    <span className="font-mono font-bold text-orange-700">{viewingTpa.code}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">IRDAI License No</span>
                    <span className="font-medium text-gray-800">{viewingTpa.irdaiLicenseNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Pre-Auth TAT</span>
                    <span className="font-medium text-gray-800">{viewingTpa.preauthTatHours || 6} Hours</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Contact Phone</span>
                    <span className="font-semibold text-gray-900">{viewingTpa.contactPhone}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Pre-Authorization Email</span>
                    <span className="font-medium text-gray-800">{viewingTpa.preauthEmail}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Claims Settlement Email</span>
                    <span className="font-medium text-gray-800">{viewingTpa.claimsEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Contact Person</span>
                    <span className="font-medium text-gray-800">{viewingTpa.contactPerson || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Agreed Discount Rate</span>
                    <span className="font-semibold text-green-700">{viewingTpa.discountRatePercentage || 0}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Web Portal URL</span>
                    <span className="text-gray-800">
                      {viewingTpa.portalUrl ? (
                        <a
                          href={viewingTpa.portalUrl.startsWith('http') ? viewingTpa.portalUrl : `https://${viewingTpa.portalUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          {viewingTpa.portalUrl} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Associated Insurance Companies</span>
                    {viewingTpa.associatedInsurers && viewingTpa.associatedInsurers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {viewingTpa.associatedInsurers.map(ins => (
                          <span
                            key={typeof ins === 'object' ? ins._id : ins}
                            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100"
                          >
                            {typeof ins === 'object' ? `${ins.name} (${ins.code})` : 'Insurer'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No insurance companies linked</span>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Address / Location</span>
                    <span className="text-gray-800">
                      {[viewingTpa.address, viewingTpa.city, viewingTpa.state, viewingTpa.pincode]
                        .filter(Boolean)
                        .join(', ') || 'N/A'}
                    </span>
                  </div>
                  {viewingTpa.notes && (
                    <div className="md:col-span-2">
                      <span className="block text-[10px] font-bold uppercase text-gray-400">Notes / Remarks</span>
                      <span className="text-gray-800 whitespace-pre-wrap">{viewingTpa.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-orange-100">
                  <button
                    type="button"
                    onClick={() => setShowTpaModal(false)}
                    className="btn-secondary text-sm py-2.5 px-5 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Create / Edit Form */
              <form onSubmit={handleSaveTpa} className="space-y-4">
                {/* Section: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      TPA Provider Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input py-2.5 text-sm"
                      placeholder="e.g. Medi Assist Healthcare Services"
                      value={tpaForm.name}
                      onChange={(e) => setTpaForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      TPA Code (Optional)
                    </label>
                    <input
                      type="text"
                      className="input py-2.5 text-sm font-mono uppercase"
                      placeholder={editingTpa ? 'Code' : 'Auto-generated if blank (e.g. TPA-1001)'}
                      value={tpaForm.code}
                      onChange={(e) => setTpaForm(p => ({ ...p, code: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      IRDAI License No
                    </label>
                    <input
                      type="text"
                      className="input py-2.5 text-sm font-mono uppercase"
                      placeholder="e.g. IRDAI/TPA/003"
                      value={tpaForm.irdaiLicenseNo}
                      onChange={(e) => setTpaForm(p => ({ ...p, irdaiLicenseNo: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Section: Pre-Auth & Contact Communication */}
                <div className="border-t border-orange-100 pt-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-2.5">
                    Pre-Auth & Contact Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Contact Phone / Helpdesk <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="input py-2 text-sm"
                        placeholder="e.g. 022-61001000"
                        value={tpaForm.contactPhone}
                        onChange={(e) => setTpaForm(p => ({ ...p, contactPhone: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Pre-Authorization Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        className="input py-2 text-sm"
                        placeholder="e.g. preauth@mediassist.in"
                        value={tpaForm.preauthEmail}
                        onChange={(e) => setTpaForm(p => ({ ...p, preauthEmail: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Claims Settlement Email
                      </label>
                      <input
                        type="email"
                        className="input py-2 text-sm"
                        placeholder="e.g. claims@mediassist.in"
                        value={tpaForm.claimsEmail}
                        onChange={(e) => setTpaForm(p => ({ ...p, claimsEmail: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Contact Person Name
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. Relationship Manager"
                        value={tpaForm.contactPerson}
                        onChange={(e) => setTpaForm(p => ({ ...p, contactPerson: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        TPA Web Portal URL
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. https://portal.mediassist.in"
                        value={tpaForm.portalUrl}
                        onChange={(e) => setTpaForm(p => ({ ...p, portalUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Associated Insurers Multi-Select */}
                <div className="border-t border-orange-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600">
                      Associated Insurance Companies ({tpaForm.associatedInsurers.length} selected)
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      Select which insurers this TPA services
                    </span>
                  </div>

                  {activeInsurersList.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>No active insurance companies registered yet. Create active insurers in Tab 1 first.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 border border-orange-100 rounded-2xl bg-orange-50/20 custom-scrollbar">
                      {activeInsurersList.map(insurer => {
                        const isChecked = tpaForm.associatedInsurers.includes(insurer._id);
                        return (
                          <label
                            key={insurer._id}
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border transition-all select-none ${
                              isChecked
                                ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleInsurerAssociation(insurer._id)}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-orange-600 cursor-pointer"
                            />
                            <span className="font-semibold truncate" title={insurer.name}>
                              {insurer.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section: SLA & Commercials */}
                <div className="border-t border-orange-100 pt-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-2.5">
                    SLA & Commercials
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Pre-Authorization Expected TAT (Hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input py-2 text-sm"
                        value={tpaForm.preauthTatHours}
                        onChange={(e) => setTpaForm(p => ({ ...p, preauthTatHours: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Agreed Hospital Discount Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="input py-2 text-sm"
                        value={tpaForm.discountRatePercentage}
                        onChange={(e) => setTpaForm(p => ({ ...p, discountRatePercentage: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Address & Notes */}
                <div className="border-t border-orange-100 pt-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-2.5">
                    Address & Notes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Office Address
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="Branch / Regional office address..."
                        value={tpaForm.address}
                        onChange={(e) => setTpaForm(p => ({ ...p, address: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        City
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. Bangalore"
                        value={tpaForm.city}
                        onChange={(e) => setTpaForm(p => ({ ...p, city: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        State
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. Karnataka"
                        value={tpaForm.state}
                        onChange={(e) => setTpaForm(p => ({ ...p, state: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Pincode
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder="e.g. 560001"
                        value={tpaForm.pincode}
                        onChange={(e) => setTpaForm(p => ({ ...p, pincode: e.target.value }))}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Internal Notes / SLA Exceptions
                      </label>
                      <textarea
                        className="input py-2 text-sm min-h-[60px] resize-y"
                        placeholder="Optional internal remarks..."
                        value={tpaForm.notes}
                        onChange={(e) => setTpaForm(p => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end gap-2 pt-4 border-t border-orange-100">
                  <button
                    type="button"
                    onClick={() => setShowTpaModal(false)}
                    className="btn-secondary text-sm py-2.5 px-4 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTpa}
                    className="btn text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer"
                  >
                    {savingTpa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingTpa ? 'Update TPA Provider' : 'Create TPA Provider'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TpaMasterSettings;
