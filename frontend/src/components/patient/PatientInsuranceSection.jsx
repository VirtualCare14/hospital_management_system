import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  FileText,
  User,
  CreditCard,
  Briefcase,
  Layers,
  ArrowRight,
  Clock
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import SkeletonTable from '../Skeleton/SkeletonTable';

const POLICY_TYPES = [
  'Individual',
  'Family Floater',
  'Corporate / Group',
  'Government Scheme'
];

const RELATIONSHIPS = [
  'Self',
  'Spouse',
  'Child',
  'Parent',
  'Other'
];

const INITIAL_FORM_STATE = {
  insuranceCompanyId: '',
  tpaId: '',
  policyNumber: '',
  memberId: '',
  policyType: 'Individual',
  primaryInsuredName: '',
  relationshipToPatient: 'Self',
  corporateName: '',
  employeeId: '',
  sumInsured: '',
  availableBalance: '',
  validFrom: '',
  validTill: '',
  cardImageUrl: '',
  cardImagePublicId: '',
  notes: ''
};

const PatientInsuranceSection = ({ patientId, patientName, onPolicyChange }) => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase?.().trim?.() || '';
  const canEdit = ['admin', 'superadmin', 'tpa', 'reception', 'billing', 'ipd'].includes(userRole);
  const canDelete = ['admin', 'superadmin'].includes(userRole);

  // Policy listing state
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive

  // Master dropdowns state
  const [activeInsurers, setActiveInsurers] = useState([]);
  const [activeTpas, setActiveTpas] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [viewingPolicy, setViewingPolicy] = useState(null);
  const [policyToDelete, setPolicyToDelete] = useState(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});

  // 1. Fetch Masters for Dropdowns
  const fetchMasters = useCallback(async () => {
    setLoadingMasters(true);
    try {
      const [insurersRes, tpasRes] = await Promise.all([
        client.get('/tpa/insurance-companies/active'),
        client.get('/tpa/providers/active')
      ]);
      setActiveInsurers(Array.isArray(insurersRes.data) ? insurersRes.data : []);
      setActiveTpas(Array.isArray(tpasRes.data) ? tpasRes.data : []);
    } catch (err) {
      console.error('Error loading TPA masters in PatientInsuranceSection:', err);
      toast.error('Failed to load active insurance companies and TPAs.');
    } finally {
      setLoadingMasters(false);
    }
  }, []);

  // 2. Fetch Policies for Patient
  const fetchPolicies = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const { data } = await client.get('/tpa/patient-insurance', {
        params: { patientId }
      });
      const list = Array.isArray(data) ? data : (data?.patientInsurances || []);
      setPolicies(list);
      if (onPolicyChange) onPolicyChange(list);
    } catch (err) {
      console.error('Error fetching patient insurance policies:', err);
      toast.error('Failed to load patient insurance policies.');
    } finally {
      setLoading(false);
    }
  }, [patientId, onPolicyChange]);

  useEffect(() => {
    if (patientId) {
      fetchPolicies();
      fetchMasters();
    }
  }, [patientId, fetchPolicies, fetchMasters]);

  // Filtered policies list
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      if (statusFilter === 'active' && !p.isActive) return false;
      if (statusFilter === 'inactive' && p.isActive) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const companyName = p.insuranceCompanyId?.name?.toLowerCase() || '';
      const companyCode = p.insuranceCompanyId?.code?.toLowerCase() || '';
      const tpaName = p.tpaId?.name?.toLowerCase() || '';
      const policyNum = p.policyNumber?.toLowerCase() || '';
      const memberId = p.memberId?.toLowerCase() || '';
      const primaryName = p.primaryInsuredName?.toLowerCase() || '';
      const corpName = p.corporateName?.toLowerCase() || '';

      return (
        companyName.includes(q) ||
        companyCode.includes(q) ||
        tpaName.includes(q) ||
        policyNum.includes(q) ||
        memberId.includes(q) ||
        primaryName.includes(q) ||
        corpName.includes(q)
      );
    });
  }, [policies, search, statusFilter]);

  // Metric computations
  const metrics = useMemo(() => {
    const total = policies.length;
    const active = policies.filter((p) => p.isActive);
    const totalSumInsured = active.reduce((sum, p) => sum + (Number(p.sumInsured) || 0), 0);
    const totalAvailable = active.reduce((sum, p) => sum + (Number(p.availableBalance) || 0), 0);

    return {
      total,
      activeCount: active.length,
      totalSumInsured,
      totalAvailable
    };
  }, [policies]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingPolicy(null);
    setFormData({
      ...INITIAL_FORM_STATE,
      primaryInsuredName: patientName || ''
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      insuranceCompanyId: policy.insuranceCompanyId?._id || policy.insuranceCompanyId || '',
      tpaId: policy.tpaId?._id || policy.tpaId || '',
      policyNumber: policy.policyNumber || '',
      memberId: policy.memberId || '',
      policyType: policy.policyType || 'Individual',
      primaryInsuredName: policy.primaryInsuredName || '',
      relationshipToPatient: policy.relationshipToPatient || 'Self',
      corporateName: policy.corporateName || '',
      employeeId: policy.employeeId || '',
      sumInsured: policy.sumInsured !== undefined ? String(policy.sumInsured) : '0',
      availableBalance: policy.availableBalance !== undefined ? String(policy.availableBalance) : '0',
      validFrom: policy.validFrom ? new Date(policy.validFrom).toISOString().split('T')[0] : '',
      validTill: policy.validTill ? new Date(policy.validTill).toISOString().split('T')[0] : '',
      cardImageUrl: policy.cardImageUrl || '',
      cardImagePublicId: policy.cardImagePublicId || '',
      notes: policy.notes || ''
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  // Form Field Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      // Auto-set available balance if sum insured is changed during create
      if (name === 'sumInsured' && !editingPolicy && (!prev.availableBalance || prev.availableBalance === prev.sumInsured)) {
        updated.availableBalance = val;
      }
      return updated;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Client-Side Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.insuranceCompanyId) {
      errors.insuranceCompanyId = 'Please select an Insurance Company.';
    }
    if (!formData.policyNumber.trim()) {
      errors.policyNumber = 'Policy Number is required.';
    }
    if (!formData.memberId.trim()) {
      errors.memberId = 'Member / TPA Card ID is required.';
    }
    if (!formData.validFrom) {
      errors.validFrom = 'Valid From date is required.';
    }
    if (!formData.validTill) {
      errors.validTill = 'Valid Till date is required.';
    }
    if (formData.validFrom && formData.validTill) {
      const fromDate = new Date(formData.validFrom);
      const tillDate = new Date(formData.validTill);
      if (tillDate < fromDate) {
        errors.validTill = 'Valid Till date cannot be earlier than Valid From date.';
      }
    }
    if (formData.sumInsured !== '' && Number(formData.sumInsured) < 0) {
      errors.sumInsured = 'Sum Insured must be non-negative.';
    }
    if (formData.availableBalance !== '' && Number(formData.availableBalance) < 0) {
      errors.availableBalance = 'Available Balance must be non-negative.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create / Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please resolve all validation errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        patientId,
        insuranceCompanyId: formData.insuranceCompanyId,
        tpaId: formData.tpaId ? formData.tpaId : null,
        policyNumber: formData.policyNumber.trim(),
        memberId: formData.memberId.trim(),
        policyType: formData.policyType,
        primaryInsuredName: formData.primaryInsuredName.trim() || patientName || '',
        relationshipToPatient: formData.relationshipToPatient,
        corporateName: formData.corporateName.trim(),
        employeeId: formData.employeeId.trim(),
        sumInsured: Number(formData.sumInsured) || 0,
        availableBalance: formData.availableBalance !== '' ? Number(formData.availableBalance) : Number(formData.sumInsured) || 0,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : null,
        validTill: formData.validTill ? new Date(formData.validTill) : null,
        cardImageUrl: formData.cardImageUrl.trim(),
        cardImagePublicId: formData.cardImagePublicId.trim(),
        notes: formData.notes.trim()
      };

      if (editingPolicy) {
        const { data } = await client.put(`/tpa/patient-insurance/${editingPolicy._id}`, payload);
        toast.success('Insurance policy updated successfully!');
        setPolicies((prev) => prev.map((p) => (p._id === editingPolicy._id ? data : p)));
      } else {
        const { data } = await client.post('/tpa/patient-insurance', payload);
        toast.success('New insurance policy added successfully!');
        setPolicies((prev) => [data, ...prev]);
      }

      setShowFormModal(false);
      setEditingPolicy(null);
      setFormData(INITIAL_FORM_STATE);
    } catch (err) {
      console.error('Save Patient Insurance Error:', err);
      const msg = err.response?.data?.message || 'Failed to save patient insurance policy.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Status (Active / Inactive)
  const handleToggleStatus = async (policy) => {
    const newStatus = !policy.isActive;
    try {
      const { data } = await client.patch(`/tpa/patient-insurance/${policy._id}/status`, {
        isActive: newStatus
      });
      toast.success(data.message || `Policy ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      setPolicies((prev) =>
        prev.map((p) => (p._id === policy._id ? { ...p, isActive: newStatus } : p))
      );
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error(err.response?.data?.message || 'Failed to update policy status.');
    }
  };

  // Delete Policy
  const confirmDeletePolicy = async () => {
    if (!policyToDelete) return;
    setDeleting(true);
    setDeleteErrorMsg('');
    try {
      await client.delete(`/tpa/patient-insurance/${policyToDelete._id}`);
      toast.success('Insurance policy deleted successfully.');
      setPolicies((prev) => prev.filter((p) => p._id !== policyToDelete._id));
      setPolicyToDelete(null);
    } catch (err) {
      console.error('Delete policy error:', err);
      const msg = err.response?.data?.message || 'Failed to delete insurance policy.';
      setDeleteErrorMsg(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="card p-5 space-y-5 border border-orange-100 shadow-sm bg-white rounded-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-orange-50 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-100/80 flex items-center justify-center text-orange-600 shadow-2xs">
            <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Insurance Policies & Cashless Coverage
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                {policies.length} {policies.length === 1 ? 'Policy' : 'Policies'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Cashless health insurance records, TPA master links, and real-time sum insured balance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPolicies}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-gray-200"
            title="Refresh Policies"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn btn-primary text-xs font-bold py-2 px-4 shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Add Policy
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      {policies.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-orange-50/80 to-amber-50/40 border border-orange-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Policies</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{metrics.total}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-100">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Coverage</p>
            <p className="text-xl font-black text-emerald-900 mt-0.5">{metrics.activeCount}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-100">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Total Sum Insured</p>
            <p className="text-xl font-black text-blue-950 mt-0.5">
              ₹{metrics.totalSumInsured.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-50/80 to-pink-50/40 border border-purple-100">
            <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Available Balance</p>
            <p className="text-xl font-black text-purple-950 mt-0.5">
              ₹{metrics.totalAvailable.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {/* Search & Status Filter Bar */}
      {policies.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company, TPA, policy #, member ID, insured name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-50/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              All ({policies.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'hover:text-emerald-700'
              }`}
            >
              Active ({policies.filter((p) => p.isActive).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-gray-700 shadow-2xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              Inactive ({policies.filter((p) => !p.isActive).length})
            </button>
          </div>
        </div>
      )}

      {/* Policy List / Table View */}
      {loading ? (
        <SkeletonTable rows={3} columns={6} className="w-full" />
      ) : filteredPolicies.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-3 shadow-2xs">
            <ShieldCheck className="h-6 w-6 stroke-[2]" />
          </div>
          <h3 className="text-sm font-extrabold text-gray-900">
            {policies.length === 0 ? 'No Insurance Policies Registered' : 'No matching policies found'}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            {policies.length === 0
              ? 'Add the patient’s insurance policy to enable cashless IPD admissions and seamless pre-authorization workflow.'
              : 'Try clearing your search query or adjusting status filters.'}
          </p>
          {policies.length === 0 && canEdit && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn btn-primary text-xs font-bold mt-4 py-2 px-4 shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add First Insurance Policy
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-1 lg:grid-cols-2">
          {filteredPolicies.map((policy) => {
            const isExpired = policy.validTill && new Date(policy.validTill) < new Date();
            const balancePercent =
              policy.sumInsured > 0
                ? Math.min(100, Math.round(((policy.availableBalance || 0) / policy.sumInsured) * 100))
                : 0;

            return (
              <div
                key={policy._id}
                className={`relative rounded-2xl border p-4.5 transition-all shadow-2xs hover:shadow-md ${
                  policy.isActive
                    ? 'border-orange-200/80 bg-gradient-to-br from-white via-orange-50/20 to-white'
                    : 'border-gray-200 bg-gray-50/60 opacity-85'
                }`}
              >
                {/* Card Top: Insurer, TPA, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-gray-900 text-sm">
                        {policy.insuranceCompanyId?.name || 'Unknown Insurer'}
                      </span>
                      {policy.insuranceCompanyId?.code && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          {policy.insuranceCompanyId.code}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {policy.policyType || 'Individual'}
                      </span>
                    </div>

                    {policy.tpaId ? (
                      <p className="text-xs text-gray-600 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span>TPA:</span>
                        <span className="font-semibold text-gray-800">{policy.tpaId.name}</span>
                        {policy.tpaId.code && (
                          <span className="font-mono text-[9px] text-gray-500 font-bold">({policy.tpaId.code})</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        In-House / Direct Claim
                      </p>
                    )}
                  </div>

                  {/* Status Toggle & Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleToggleStatus(policy)}
                      className={`inline-flex items-center gap-1 px-2 py-0.8 rounded-full text-[11px] font-bold transition-all ${
                        policy.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80 cursor-pointer'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300/80 cursor-pointer'
                      } ${!canEdit ? 'cursor-default' : ''}`}
                      title={canEdit ? 'Click to toggle active status' : 'Policy status'}
                    >
                      {policy.isActive ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-gray-500" />
                          Inactive
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Policy Identification Block */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl bg-gray-50/80 p-2.5 border border-gray-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">
                      Policy Number
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono font-bold text-gray-900 truncate">{policy.policyNumber}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(policy.policyNumber, 'Policy Number')}
                        className="text-gray-400 hover:text-orange-600 p-0.5 rounded transition-colors"
                        title="Copy Policy Number"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">
                      Member / Card ID
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono font-bold text-gray-900 truncate">{policy.memberId}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(policy.memberId, 'Member ID')}
                        className="text-gray-400 hover:text-orange-600 p-0.5 rounded transition-colors"
                        title="Copy Member ID"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Insured Person & Validity */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span>Insured:</span>
                    <span className="font-semibold text-gray-800">
                      {policy.primaryInsuredName || patientName || 'Patient'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">({policy.relationshipToPatient})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className={isExpired ? 'text-red-600 font-bold' : 'text-gray-700 font-medium'}>
                      {policy.validFrom ? new Date(policy.validFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      {' → '}
                      {policy.validTill ? new Date(policy.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                    {isExpired && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                        Expired
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial Coverage Meter */}
                <div className="mt-3.5 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Available:</span>
                      <span className="font-black text-emerald-700">
                        ₹{Number(policy.availableBalance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Sum Insured:</span>
                      <span className="font-bold text-gray-800">
                        ₹{Number(policy.sumInsured || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        balancePercent > 50
                          ? 'bg-emerald-500'
                          : balancePercent > 20
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${balancePercent}%` }}
                    />
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {policy.cardImageUrl ? (
                      <a
                        href={policy.cardImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        View Card
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No Card Uploaded</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingPolicy(policy)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="View Full Policy Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(policy)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                        title="Edit Policy"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteErrorMsg('');
                          setPolicyToDelete(policy);
                        }}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Policy"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/*                ADD / EDIT POLICY MODAL                    */}
      {/* ========================================================= */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-orange-100 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-orange-100 bg-orange-50/40">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    {editingPolicy ? 'Edit Insurance Policy' : 'Add Patient Insurance Policy'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Patient: <span className="font-bold text-gray-800">{patientName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* SECTION 1: Insurer & TPA */}
              <div>
                <h4 className="text-[11px] font-black uppercase text-orange-600 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  1. Insurer & TPA Master Selection
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Insurance Company <span className="text-red-600 font-black">*</span>
                    </label>
                    <select
                      name="insuranceCompanyId"
                      value={formData.insuranceCompanyId}
                      onChange={handleChange}
                      disabled={loadingMasters}
                      className={`w-full rounded-xl border p-2.5 bg-white text-xs focus:outline-none focus:ring-1 ${
                        formErrors.insuranceCompanyId
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      }`}
                    >
                      <option value="">-- Select Insurance Company --</option>
                      {activeInsurers.map((ins) => (
                        <option key={ins._id} value={ins._id}>
                          {ins.name} ({ins.code}) — {ins.payerType}
                        </option>
                      ))}
                    </select>
                    {formErrors.insuranceCompanyId && (
                      <p className="text-[11px] text-red-600 font-bold mt-1">{formErrors.insuranceCompanyId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      TPA Provider <span className="text-gray-400 font-normal">(Optional if in-house)</span>
                    </label>
                    <select
                      name="tpaId"
                      value={formData.tpaId}
                      onChange={handleChange}
                      disabled={loadingMasters}
                      className="w-full rounded-xl border border-gray-300 p-2.5 bg-white text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="">-- In-House / Direct Insurer Claim --</option>
                      {activeTpas.map((tpa) => (
                        <option key={tpa._id} value={tpa._id}>
                          {tpa.name} ({tpa.code}) {tpa.preauthTatHours ? `• ${tpa.preauthTatHours}h TAT` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Policy & Identification */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-[11px] font-black uppercase text-orange-600 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  2. Policy Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Policy Number <span className="text-red-600 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      name="policyNumber"
                      placeholder="e.g. POL-98472910"
                      value={formData.policyNumber}
                      onChange={handleChange}
                      className={`w-full rounded-xl border p-2.5 font-mono text-xs focus:outline-none focus:ring-1 ${
                        formErrors.policyNumber
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      }`}
                    />
                    {formErrors.policyNumber && (
                      <p className="text-[11px] text-red-600 font-bold mt-1">{formErrors.policyNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Member / Card ID <span className="text-red-600 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      name="memberId"
                      placeholder="e.g. MEM-102948"
                      value={formData.memberId}
                      onChange={handleChange}
                      className={`w-full rounded-xl border p-2.5 font-mono text-xs focus:outline-none focus:ring-1 ${
                        formErrors.memberId
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      }`}
                    />
                    {formErrors.memberId && (
                      <p className="text-[11px] text-red-600 font-bold mt-1">{formErrors.memberId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">Policy Type</label>
                    <select
                      name="policyType"
                      value={formData.policyType}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 p-2.5 bg-white text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      {POLICY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Primary Insured & Relationship */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">Primary Insured Name</label>
                    <input
                      type="text"
                      name="primaryInsuredName"
                      placeholder="Primary policy holder name"
                      value={formData.primaryInsuredName}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">Relationship to Patient</label>
                    <select
                      name="relationshipToPatient"
                      value={formData.relationshipToPatient}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 p-2.5 bg-white text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Corporate Details (Conditional if Corporate or always available) */}
                {formData.policyType === 'Corporate / Group' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div>
                      <label className="block font-bold text-blue-900 mb-1">Corporate Employer Name</label>
                      <input
                        type="text"
                        name="corporateName"
                        placeholder="e.g. Infosys / TCS / Govt Dept"
                        value={formData.corporateName}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-blue-200 p-2.5 bg-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-blue-900 mb-1">Employee ID</label>
                      <input
                        type="text"
                        name="employeeId"
                        placeholder="e.g. EMP-99882"
                        value={formData.employeeId}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-blue-200 p-2.5 bg-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: Financial Coverage & Validity */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-[11px] font-black uppercase text-orange-600 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5" />
                  3. Coverage Limits & Validity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">Sum Insured (₹)</label>
                    <input
                      type="number"
                      name="sumInsured"
                      placeholder="0"
                      min="0"
                      value={formData.sumInsured}
                      onChange={handleChange}
                      className={`w-full rounded-xl border p-2.5 text-xs font-bold focus:outline-none focus:ring-1 ${
                        formErrors.sumInsured
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      }`}
                    />
                    {formErrors.sumInsured && (
                      <p className="text-[11px] text-red-600 font-bold mt-1">{formErrors.sumInsured}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">Available Balance (₹)</label>
                    <input
                      type="number"
                      name="availableBalance"
                      placeholder="0"
                      min="0"
                      value={formData.availableBalance}
                      onChange={handleChange}
                      className={`w-full rounded-xl border p-2.5 text-xs font-bold text-emerald-700 focus:outline-none focus:ring-1 ${
                        formErrors.availableBalance
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      }`}
                    />
                    {formErrors.availableBalance && (
                      <p className="text-[11px] text-red-600 font-bold mt-1">{formErrors.availableBalance}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Valid From <span className="text-red-600 font-black">*</span>
                    </label>
                    <input
                      type="date"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleChange}
                      className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-1 ${
                        formErrors.validFrom
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      }`}
                    />
                    {formErrors.validFrom && (
                      <p className="text-[11px] text-red-600 font-bold mt-1">{formErrors.validFrom}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Valid Till <span className="text-red-600 font-black">*</span>
                    </label>
                    <input
                      type="date"
                      name="validTill"
                      value={formData.validTill}
                      onChange={handleChange}
                      className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-1 ${
                        formErrors.validTill
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                      }`}
                    />
                    {formErrors.validTill && (
                      <p className="text-[11px] text-red-600 font-bold mt-1">{formErrors.validTill}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: Card Document & Notes */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-[11px] font-black uppercase text-orange-600 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  4. Card Document URL & Notes
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Insurance Card Image / PDF URL <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="cardImageUrl"
                      placeholder="https://storage... or document link"
                      value={formData.cardImageUrl}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">Notes / Policy Terms</label>
                    <textarea
                      name="notes"
                      rows={2}
                      placeholder="Special policy clauses, room rent cap, copay terms..."
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  disabled={saving}
                  className="btn-secondary text-xs font-bold py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary text-xs font-bold py-2 px-5 shadow-sm inline-flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingPolicy ? 'Update Policy' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/*               VIEW POLICY DETAILS MODAL                   */}
      {/* ========================================================= */}
      {viewingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-orange-100 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-orange-100 bg-orange-50/40">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Policy Details</h3>
                  <p className="text-xs text-gray-500 font-mono">ID: {viewingPolicy._id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPolicy(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="rounded-xl bg-orange-50/50 p-3.5 border border-orange-100">
                <span className="text-[10px] font-black uppercase text-orange-700 tracking-wider block">
                  Insurance Provider
                </span>
                <p className="text-base font-extrabold text-gray-900 mt-0.5">
                  {viewingPolicy.insuranceCompanyId?.name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {viewingPolicy.insuranceCompanyId?.code && (
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-gray-700 border border-gray-200">
                      Code: {viewingPolicy.insuranceCompanyId.code}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {viewingPolicy.insuranceCompanyId?.payerType || 'Private'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      viewingPolicy.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {viewingPolicy.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {viewingPolicy.tpaId && (
                <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block">
                    Third Party Administrator (TPA)
                  </span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingPolicy.tpaId.name}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Code: <span className="font-mono font-bold">{viewingPolicy.tpaId.code}</span>
                    {viewingPolicy.tpaId.preauthEmail && ` • Email: ${viewingPolicy.tpaId.preauthEmail}`}
                    {viewingPolicy.tpaId.contactPhone && ` • Phone: ${viewingPolicy.tpaId.contactPhone}`}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Policy Number</span>
                  <p className="font-mono font-bold text-gray-900 text-xs mt-0.5">{viewingPolicy.policyNumber}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Member / Card ID</span>
                  <p className="font-mono font-bold text-gray-900 text-xs mt-0.5">{viewingPolicy.memberId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Policy Type</span>
                  <p className="font-bold text-gray-900 text-xs mt-0.5">{viewingPolicy.policyType}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Primary Insured</span>
                  <p className="font-bold text-gray-900 text-xs mt-0.5">
                    {viewingPolicy.primaryInsuredName} ({viewingPolicy.relationshipToPatient})
                  </p>
                </div>
              </div>

              {viewingPolicy.corporateName && (
                <div className="rounded-xl bg-blue-50/60 p-3 border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Corporate Coverage</span>
                  <p className="font-bold text-blue-950 text-xs mt-0.5">
                    {viewingPolicy.corporateName} {viewingPolicy.employeeId && `(Emp ID: ${viewingPolicy.employeeId})`}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-blue-50/50 p-3 border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Sum Insured</span>
                  <p className="font-black text-blue-950 text-sm mt-0.5">
                    ₹{Number(viewingPolicy.sumInsured || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Available Balance</span>
                  <p className="font-black text-emerald-950 text-sm mt-0.5">
                    ₹{Number(viewingPolicy.availableBalance || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Validity Period</span>
                <p className="font-semibold text-gray-800 text-xs mt-0.5">
                  {viewingPolicy.validFrom ? new Date(viewingPolicy.validFrom).toLocaleDateString('en-IN') : 'N/A'}
                  {' → '}
                  {viewingPolicy.validTill ? new Date(viewingPolicy.validTill).toLocaleDateString('en-IN') : 'N/A'}
                </p>
              </div>

              {viewingPolicy.notes && (
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Notes</span>
                  <p className="text-gray-700 text-xs mt-0.5 whitespace-pre-wrap">{viewingPolicy.notes}</p>
                </div>
              )}

              {viewingPolicy.cardImageUrl && (
                <div className="pt-1">
                  <a
                    href={viewingPolicy.cardImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary w-full text-center text-xs font-bold py-2.5 inline-flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Insurance Card Image
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingPolicy(null)}
                className="btn-secondary text-xs font-bold py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/*             DELETE CONFIRMATION MODAL                     */}
      {/* ========================================================= */}
      {policyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-red-100 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-gray-900 text-base">Delete Insurance Policy</h3>
                <p className="text-xs text-gray-500">
                  Are you sure you want to delete policy{' '}
                  <span className="font-mono font-bold text-gray-800">{policyToDelete.policyNumber}</span> (
                  {policyToDelete.insuranceCompanyId?.name})?
                </p>
              </div>
            </div>

            {deleteErrorMsg && (
              <div className="rounded-xl bg-red-50 p-3 border border-red-200 text-xs text-red-800 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  Cannot Delete Referenced Policy
                </p>
                <p className="text-[11px] leading-relaxed">{deleteErrorMsg}</p>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleStatus(policyToDelete);
                    setPolicyToDelete(null);
                  }}
                  className="btn btn-primary text-xs font-bold py-1.5 px-3 w-full justify-center mt-1"
                >
                  Deactivate Policy Instead
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setPolicyToDelete(null);
                  setDeleteErrorMsg('');
                }}
                className="btn-secondary text-xs font-bold py-2 px-4"
              >
                Cancel
              </button>
              {!deleteErrorMsg && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDeletePolicy}
                  className="btn btn-error text-xs font-bold py-2 px-4 inline-flex items-center gap-1.5 shadow-sm"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientInsuranceSection;
