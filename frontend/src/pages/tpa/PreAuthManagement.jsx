import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Building2,
  Plus,
  Edit3,
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
  Clock,
  Send,
  MessageSquare,
  TrendingUp,
  Ban,
  Check,
  HelpCircle,
  ChevronDown,
  Bed,
  Stethoscope,
  Filter,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import PaginationFooter from '../../components/PaginationFooter';
import { formatUhid } from '../../utils/uhid';

const STATUS_OPTIONS = [
  'Draft',
  'Submitted',
  'Queried',
  'Approved',
  'Enhancement Requested',
  'Rejected',
  'Final Authorized',
  'Settled',
  'Cancelled'
];

const statusBadgeStyles = {
  'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
  'Submitted': 'bg-blue-100 text-blue-800 border-blue-200',
  'Queried': 'bg-amber-100 text-amber-800 border-amber-200',
  'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Enhancement Requested': 'bg-purple-100 text-purple-800 border-purple-200',
  'Rejected': 'bg-red-100 text-red-800 border-red-200',
  'Final Authorized': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Settled': 'bg-teal-100 text-teal-800 border-teal-200',
  'Cancelled': 'bg-rose-100 text-rose-800 border-rose-200'
};

const statusIcons = {
  'Draft': Clock,
  'Submitted': Send,
  'Queried': AlertCircle,
  'Approved': CheckCircle2,
  'Enhancement Requested': TrendingUp,
  'Rejected': XCircle,
  'Final Authorized': ShieldCheck,
  'Settled': Check,
  'Cancelled': Ban
};

const PreAuthManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || '';
  const initialIpdId = searchParams.get('ipdId') || '';

  const userRole = user?.role?.toLowerCase?.().trim?.() || '';
  const isAdminOrTpa = ['admin', 'superadmin', 'tpa'].includes(userRole);
  const canCreate = ['admin', 'superadmin', 'tpa', 'billing', 'ipd'].includes(userRole);
  const canSettle = ['admin', 'superadmin', 'tpa', 'billing'].includes(userRole);

  // List State
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedInsurerId, setSelectedInsurerId] = useState('');
  const [selectedTpaId, setSelectedTpaId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Masters
  const [activeInsurers, setActiveInsurers] = useState([]);
  const [activeTpas, setActiveTpas] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDraftModal, setShowEditDraftModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showRespondQueryModal, setShowRespondQueryModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  const [showApproveEnhancementModal, setShowApproveEnhancementModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFinalAuthModal, setShowFinalAuthModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Selected Active Record for Modals
  const [activeRecord, setActiveRecord] = useState(null);
  const [activeQueryItem, setActiveQueryItem] = useState(null);
  const [activeEnhancementItem, setActiveEnhancementItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch Master Lookups
  const fetchMasters = useCallback(async () => {
    try {
      const [insurersRes, tpasRes, docsRes] = await Promise.all([
        client.get('/tpa/insurance-companies/active'),
        client.get('/tpa/providers/active'),
        client.get('/admin/doctors').catch(() => ({ data: [] }))
      ]);
      setActiveInsurers(Array.isArray(insurersRes.data) ? insurersRes.data : []);
      setActiveTpas(Array.isArray(tpasRes.data) ? tpasRes.data : []);
      setDoctorsList(Array.isArray(docsRes.data) ? docsRes.data : []);
    } catch (err) {
      console.error('Error fetching master lookups:', err);
    }
  }, []);

  // 2. Fetch Pre-Authorizations
  const fetchPreAuths = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize
      };
      if (search.trim()) params.search = search.trim();
      if (selectedStatus) params.preauthStatus = selectedStatus;
      if (selectedInsurerId) params.insuranceCompanyId = selectedInsurerId;
      if (selectedTpaId) params.tpaId = selectedTpaId;
      if (initialPatientId) params.patientId = initialPatientId;
      if (initialIpdId) params.ipdAdmissionId = initialIpdId;

      const { data } = await client.get('/tpa/pre-auth', { params });
      if (data && Array.isArray(data.preAuthorizations)) {
        setRecords(data.preAuthorizations);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setRecords(data);
        setTotalRecords(data.length);
        setTotalPages(1);
      } else {
        setRecords([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching pre-authorizations:', err);
      toast.error('Failed to load Pre-Authorizations.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedStatus, selectedInsurerId, selectedTpaId, initialPatientId, initialIpdId]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchPreAuths();
  }, [fetchPreAuths]);

  // Key metrics summary
  const metrics = useMemo(() => {
    const total = totalRecords;
    const pendingCount = records.filter(r => ['Submitted', 'Queried', 'Enhancement Requested'].includes(r.preauthStatus)).length;
    const approvedCount = records.filter(r => ['Approved', 'Final Authorized'].includes(r.preauthStatus)).length;
    const settledCount = records.filter(r => r.preauthStatus === 'Settled').length;
    const totalApprovedSum = records.reduce((sum, r) => sum + (Number(r.totalApprovedAmount) || 0), 0);

    return { total, pendingCount, approvedCount, settledCount, totalApprovedSum };
  }, [records, totalRecords]);

  // Copy helper
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Open Full Details View
  const handleOpenViewModal = async (record) => {
    try {
      const { data } = await client.get(`/tpa/pre-auth/${record._id}`);
      setActiveRecord(data);
      setShowViewModal(true);
    } catch (err) {
      console.error('Error fetching pre-auth details:', err);
      setActiveRecord(record);
      setShowViewModal(true);
    }
  };

  // ====================================================================
  //                         ACTION HANDLERS
  // ====================================================================

  // 1. Submit Draft Pre-Auth
  const handleSubmitPreAuth = async (record) => {
    if (!window.confirm(`Submit claim "${record.claimNumber}" to ${record.insuranceCompanyId?.name || 'Insurer'}?`)) return;
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/pre-auth/${record._id}/submit`, {});
      toast.success(data.message || 'Pre-Authorization submitted successfully!');
      fetchPreAuths();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit pre-authorization.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Add Query Submit
  const handleSaveQuery = async (queryText, queryDocUrl) => {
    if (!queryText.trim()) {
      toast.error('Query text is required.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.post(`/tpa/pre-auth/${activeRecord._id}/query`, {
        queryText: queryText.trim(),
        queryDocUrl: queryDocUrl.trim()
      });
      toast.success(data.message || 'TPA Query recorded successfully.');
      setShowQueryModal(false);
      fetchPreAuths();
    } catch (err) {
      console.error('Add query error:', err);
      toast.error(err.response?.data?.message || 'Failed to log TPA query.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Respond Query Submit
  const handleSaveQueryResponse = async (responseText, responseDocUrl) => {
    if (!responseText.trim()) {
      toast.error('Response text is required.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/pre-auth/${activeRecord._id}/query/${activeQueryItem._id}/respond`, {
        responseText: responseText.trim(),
        responseDocUrl: responseDocUrl.trim()
      });
      toast.success(data.message || 'Response to query saved successfully.');
      setShowRespondQueryModal(false);
      fetchPreAuths();
    } catch (err) {
      console.error('Respond query error:', err);
      toast.error(err.response?.data?.message || 'Failed to respond to query.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Initial Approval Submit
  const handleApproveInitial = async (approvedAmount, tpaApprovalLetterUrl, claimNumber, notes) => {
    if (approvedAmount === '' || Number(approvedAmount) < 0) {
      toast.error('Please enter a valid approved amount (>= 0).');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/pre-auth/${activeRecord._id}/approve`, {
        approvedAmount: Number(approvedAmount),
        tpaApprovalLetterUrl: tpaApprovalLetterUrl?.trim() || '',
        claimNumber: claimNumber?.trim() || '',
        notes: notes?.trim() || ''
      });
      toast.success(data.message || 'Pre-Authorization approved successfully!');
      setShowApproveModal(false);
      fetchPreAuths();
    } catch (err) {
      console.error('Approve initial error:', err);
      toast.error(err.response?.data?.message || 'Failed to approve pre-authorization.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Request Enhancement Submit
  const handleSaveEnhancementRequest = async (requestedAmount, remarks) => {
    if (!requestedAmount || Number(requestedAmount) <= 0) {
      toast.error('Requested enhancement amount must be greater than 0.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.post(`/tpa/pre-auth/${activeRecord._id}/enhancement`, {
        requestedAmount: Number(requestedAmount),
        remarks: remarks?.trim() || ''
      });
      toast.success(data.message || 'Enhancement requested successfully!');
      setShowEnhancementModal(false);
      fetchPreAuths();
    } catch (err) {
      console.error('Request enhancement error:', err);
      toast.error(err.response?.data?.message || 'Failed to request enhancement.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Approve Enhancement Submit
  const handleApproveEnhancement = async (approvedAmount, remarks) => {
    if (approvedAmount === '' || Number(approvedAmount) < 0) {
      toast.error('Please enter a valid approved amount (>= 0).');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/pre-auth/${activeRecord._id}/enhancement/${activeEnhancementItem._id}/approve`, {
        approvedAmount: Number(approvedAmount),
        remarks: remarks?.trim() || ''
      });
      toast.success(data.message || 'Enhancement approved successfully!');
      setShowApproveEnhancementModal(false);
      fetchPreAuths();
    } catch (err) {
      console.error('Approve enhancement error:', err);
      toast.error(err.response?.data?.message || 'Failed to approve enhancement.');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Reject Pre-Auth Submit
  const handleRejectPreAuth = async (rejectionReason, denialLetterUrl) => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/pre-auth/${activeRecord._id}/reject`, {
        rejectionReason: rejectionReason.trim(),
        denialLetterUrl: denialLetterUrl?.trim() || ''
      });
      toast.success(data.message || 'Pre-Authorization marked as Rejected.');
      setShowRejectModal(false);
      fetchPreAuths();
    } catch (err) {
      console.error('Reject pre-auth error:', err);
      toast.error(err.response?.data?.message || 'Failed to reject pre-authorization.');
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Final Authorize Submit
  const handleFinalAuthorize = async (formData) => {
    if (formData.finalAuthorizedAmount === '' || Number(formData.finalAuthorizedAmount) < 0) {
      toast.error('Final authorized amount is required and must be non-negative.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/pre-auth/${activeRecord._id}/final-authorize`, {
        finalAuthorizedAmount: Number(formData.finalAuthorizedAmount),
        copayPercentage: Number(formData.copayPercentage) || 0,
        copayAmount: Number(formData.copayAmount) || 0,
        deductibleAmount: Number(formData.deductibleAmount) || 0,
        nonPayableAmount: Number(formData.nonPayableAmount) || 0, // Manual non-payable entry as specified
        patientPayableAmount: Number(formData.patientPayableAmount) || 0,
        tpaReceivableAmount: Number(formData.tpaReceivableAmount) || Number(formData.finalAuthorizedAmount),
        finalAuthLetterUrl: formData.finalAuthLetterUrl?.trim() || '',
        notes: formData.notes?.trim() || ''
      });
      toast.success(data.message || 'Final Authorization completed successfully!');
      setShowFinalAuthModal(false);
      fetchPreAuths();
    } catch (err) {
      console.error('Final authorize error:', err);
      toast.error(err.response?.data?.message || 'Failed to perform final authorization.');
    } finally {
      setActionLoading(false);
    }
  };

  // 9. Settle Claim Submit
  const handleSettleClaim = async (settledAmount, settlementRef, utrNumber, tdsDeducted, settledAt, notes) => {
    if (settledAmount === '' || Number(settledAmount) < 0) {
      toast.error('Settled amount is required and must be non-negative.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/pre-auth/${activeRecord._id}/settle`, {
        settledAmount: Number(settledAmount),
        settlementRef: settlementRef?.trim() || '',
        utrNumber: utrNumber?.trim() || '',
        tdsDeducted: Number(tdsDeducted) || 0,
        settledAt: settledAt || new Date(),
        notes: notes?.trim() || ''
      });
      toast.success(data.message || 'Claim marked as Settled successfully!');
      setShowSettleModal(false);
      fetchPreAuths();
    } catch (err) {
      console.error('Settle claim error:', err);
      toast.error(err.response?.data?.message || 'Failed to settle claim.');
    } finally {
      setActionLoading(false);
    }
  };

  // 10. Cancel Pre-Auth Submit
  const handleCancelPreAuth = async (cancellationReason) => {
    if (!cancellationReason.trim()) {
      toast.error('Cancellation reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/pre-auth/${activeRecord._id}/cancel`, {
        cancellationReason: cancellationReason.trim()
      });
      toast.success(data.message || 'Pre-Authorization cancelled successfully.');
      setShowCancelModal(false);
      fetchPreAuths();
    } catch (err) {
      console.error('Cancel pre-auth error:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel pre-authorization.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card p-5 bg-white border border-orange-100 shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-2xs">
              <FileCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Cashless Pre-Authorization Desk
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                  {totalRecords} Claims
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage IPD cashless insurance approvals, TPA queries, enhancement requests, and discharge authorizations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPreAuths}
              disabled={loading}
              className="p-2.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-gray-200"
              title="Refresh Records"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary text-xs font-bold py-2.5 px-4 shadow-sm flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                New Pre-Auth Request
              </button>
            )}
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5 pt-4 border-t border-orange-50">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Claims</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{metrics.total}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Action Needed / Queries</p>
            <p className="text-xl font-black text-amber-900 mt-0.5">{metrics.pendingCount}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Approved / Authorized</p>
            <p className="text-xl font-black text-emerald-900 mt-0.5">{metrics.approvedCount}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80">
            <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Settled Claims</p>
            <p className="text-xl font-black text-teal-900 mt-0.5">{metrics.settledCount}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 col-span-2 md:col-span-1">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Total Approved (₹)</p>
            <p className="text-xl font-black text-blue-950 mt-0.5">
              ₹{metrics.totalApprovedSum.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 bg-white border border-orange-100 shadow-sm rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Patient, UHID, Claim #, IPD #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-50/50"
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

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs font-medium rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">-- All Pre-Auth Statuses --</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedInsurerId}
              onChange={(e) => {
                setSelectedInsurerId(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs font-medium rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">-- All Insurance Companies --</option>
              {activeInsurers.map((ins) => (
                <option key={ins._id} value={ins._id}>
                  {ins.name} ({ins.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTpaId}
              onChange={(e) => {
                setSelectedTpaId(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs font-medium rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">-- All TPA Providers --</option>
              {activeTpas.map((tpa) => (
                <option key={tpa._id} value={tpa._id}>
                  {tpa.name} ({tpa.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden bg-white border border-orange-100 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-orange-50/60 border-b border-orange-100 text-gray-700 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="p-3.5">Claim & IPD</th>
                <th className="p-3.5">Patient Details</th>
                <th className="p-3.5">Insurer & TPA</th>
                <th className="p-3.5">Provisional Diagnosis</th>
                <th className="p-3.5">Sanction / Limits</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <SkeletonTable rows={4} columns={7} />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-1">
                        <ShieldCheck className="h-6 w-6 stroke-[2]" />
                      </div>
                      <p className="font-extrabold text-gray-800 text-sm">No Pre-Authorization Claims Found</p>
                      <p className="text-xs text-gray-500 max-w-sm">
                        Create a cashless pre-authorization request for an admitted IPD patient with an active policy.
                      </p>
                      {canCreate && (
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(true)}
                          className="btn btn-primary text-xs font-bold mt-3 py-2 px-4 inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="h-4 w-4" />
                          New Pre-Auth Request
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const StatusIcon = statusIcons[r.preauthStatus] || HelpCircle;
                  const statusStyle = statusBadgeStyles[r.preauthStatus] || 'bg-gray-100 text-gray-700';

                  return (
                    <tr key={r._id} className="hover:bg-orange-50/30 transition-colors">
                      {/* Claim & IPD */}
                      <td className="p-3.5 align-top">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-gray-900 text-xs">{r.claimNumber || 'PENDING'}</span>
                          {r.claimNumber && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(r.claimNumber, 'Claim Number')}
                              className="text-gray-400 hover:text-orange-600 p-0.5 rounded"
                              title="Copy Claim Number"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          IPD: <span className="font-semibold text-gray-700">{r.ipdAdmissionId?.ipdNumber || 'N/A'}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        </div>
                      </td>

                      {/* Patient Details */}
                      <td className="p-3.5 align-top">
                        <p className="font-bold text-gray-900">{r.patientId?.patientName || 'Unknown Patient'}</p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          {formatUhid(r.patientId?.uhid)} • {r.patientId?.gender || '-'}
                        </p>
                        {r.patientId?.mobile && (
                          <p className="text-[11px] text-gray-500">{r.patientId.mobile}</p>
                        )}
                      </td>

                      {/* Insurer & TPA */}
                      <td className="p-3.5 align-top">
                        <p className="font-bold text-gray-900">{r.insuranceCompanyId?.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {r.tpaId ? (
                            <span className="text-gray-700 font-medium">TPA: {r.tpaId.name}</span>
                          ) : (
                            <span className="text-gray-400 italic">In-House Claim</span>
                          )}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                          Pol: {r.patientInsuranceId?.policyNumber || 'N/A'}
                        </p>
                      </td>

                      {/* Clinical / Diagnosis */}
                      <td className="p-3.5 align-top max-w-xs">
                        <p className="text-gray-800 font-medium line-clamp-2">
                          {r.diagnosis || r.ipdAdmissionId?.provisionalDiagnosis || 'No provisional diagnosis'}
                        </p>
                        {r.doctorInCharge && (
                          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <Stethoscope className="h-3 w-3 text-gray-400" />
                            Dr. {r.doctorInCharge.doctorName || r.doctorInCharge.username}
                          </p>
                        )}
                      </td>

                      {/* Sanction Limits */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500">Req:</span>
                            <span className="font-mono font-bold text-gray-800">
                              ₹{Number(r.initialRequestedAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500">Total Appr:</span>
                            <span className="font-mono font-extrabold text-emerald-700">
                              ₹{Number(r.totalApprovedAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {r.finalAuthorizedAmount > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-indigo-900 font-bold border-t border-gray-100 pt-0.5">
                              <span>Final:</span>
                              <span className="font-mono">
                                ₹{Number(r.finalAuthorizedAmount).toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${statusStyle}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {r.preauthStatus}
                        </span>
                        {r.queryHistory?.some(q => q.status === 'Open') && (
                          <span className="block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Action: Open Query
                          </span>
                        )}
                      </td>

                      {/* Context-Aware Actions */}
                      <td className="p-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1. View Button (Always visible) */}
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(r)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* 2. DRAFT Actions */}
                          {r.preauthStatus === 'Draft' && isAdminOrTpa && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(r);
                                  setShowEditDraftModal(true);
                                }}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                title="Edit Draft"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSubmitPreAuth(r)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                                title="Submit to TPA"
                              >
                                <Send className="h-3 w-3" />
                                Submit
                              </button>
                            </>
                          )}

                          {/* 3. SUBMITTED Actions */}
                          {r.preauthStatus === 'Submitted' && isAdminOrTpa && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(r);
                                  setShowQueryModal(true);
                                }}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200"
                                title="Log TPA Query"
                              >
                                Query
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(r);
                                  setShowApproveModal(true);
                                }}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                                title="Approve Initial Sanction"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(r);
                                  setShowRejectModal(true);
                                }}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {/* 4. QUERIED Actions */}
                          {r.preauthStatus === 'Queried' && (
                            <>
                              {r.queryHistory?.some(q => q.status === 'Open') && isAdminOrTpa && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveRecord(r);
                                    const openQ = r.queryHistory.find(q => q.status === 'Open');
                                    setActiveQueryItem(openQ);
                                    setShowRespondQueryModal(true);
                                  }}
                                  className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 animate-pulse"
                                  title="Respond to Query"
                                >
                                  Respond Query
                                </button>
                              )}
                              {isAdminOrTpa && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveRecord(r);
                                    setShowApproveModal(true);
                                  }}
                                  className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                                  title="Approve Sanction"
                                >
                                  Approve
                                </button>
                              )}
                            </>
                          )}

                          {/* 5. APPROVED Actions */}
                          {r.preauthStatus === 'Approved' && isAdminOrTpa && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(r);
                                  setShowEnhancementModal(true);
                                }}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-900 hover:bg-purple-200 flex items-center gap-1"
                                title="Request Enhancement"
                              >
                                <TrendingUp className="h-3 w-3" />
                                Enhance
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(r);
                                  setShowFinalAuthModal(true);
                                }}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                                title="Final Authorization at Discharge"
                              >
                                Final Auth
                              </button>
                            </>
                          )}

                          {/* 6. ENHANCEMENT REQUESTED Actions */}
                          {r.preauthStatus === 'Enhancement Requested' && isAdminOrTpa && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(r);
                                  const reqEnh = r.enhancementHistory?.slice().reverse().find(e => e.status === 'Requested');
                                  setActiveEnhancementItem(reqEnh);
                                  setShowApproveEnhancementModal(true);
                                }}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700"
                                title="Approve Enhancement"
                              >
                                Approve Enhancement
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(r);
                                  setShowRejectModal(true);
                                }}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {/* 7. FINAL AUTHORIZED Actions */}
                          {r.preauthStatus === 'Final Authorized' && canSettle && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecord(r);
                                setShowSettleModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-2xs"
                              title="Mark Claim Settled"
                            >
                              Settle Claim
                            </button>
                          )}

                          {/* Cancel button (allowed from non-terminal states) */}
                          {!['Settled', 'Rejected', 'Cancelled'].includes(r.preauthStatus) && isAdminOrTpa && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecord(r);
                                setShowCancelModal(true);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Cancel Pre-Authorization"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {records.length > 0 && (
          <PaginationFooter
            currentPage={page}
            pageSize={pageSize}
            totalRecords={totalRecords}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* ========================================================= */}
      {/*              CREATE PRE-AUTH MODAL (STEPPED)              */}
      {/* ========================================================= */}
      {showCreateModal && (
        <CreatePreAuthModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPreAuths();
          }}
          activeInsurers={activeInsurers}
          activeTpas={activeTpas}
          doctorsList={doctorsList}
        />
      )}

      {/* ========================================================= */}
      {/*              EDIT DRAFT PRE-AUTH MODAL                    */}
      {/* ========================================================= */}
      {showEditDraftModal && activeRecord && (
        <EditDraftPreAuthModal
          record={activeRecord}
          onClose={() => setShowEditDraftModal(false)}
          onSuccess={() => {
            setShowEditDraftModal(false);
            fetchPreAuths();
          }}
          doctorsList={doctorsList}
        />
      )}

      {/* ========================================================= */}
      {/*              FULL DETAILS VIEW MODAL / DRAWER             */}
      {/* ========================================================= */}
      {showViewModal && activeRecord && (
        <ViewPreAuthDetailsModal
          record={activeRecord}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {/* ========================================================= */}
      {/*                   LOG TPA QUERY MODAL                     */}
      {/* ========================================================= */}
      {showQueryModal && activeRecord && (
        <SimpleInputModal
          title="Log TPA Query"
          subtitle={`Add incoming query from ${activeRecord.insuranceCompanyId?.name || 'TPA'}`}
          icon={AlertCircle}
          iconColor="text-amber-600 bg-amber-100"
          fields={[
            { name: 'queryText', label: 'Query Description / Information Needed', type: 'textarea', required: true },
            { name: 'queryDocUrl', label: 'Query Document / Letter URL', type: 'text', placeholder: 'https://...' }
          ]}
          submitLabel="Save Query"
          submitClass="btn btn-primary bg-amber-600 hover:bg-amber-700"
          onClose={() => setShowQueryModal(false)}
          onSubmit={(vals) => handleSaveQuery(vals.queryText, vals.queryDocUrl || '')}
          loading={actionLoading}
        />
      )}

      {/* ========================================================= */}
      {/*                RESPOND TO TPA QUERY MODAL                 */}
      {/* ========================================================= */}
      {showRespondQueryModal && activeRecord && activeQueryItem && (
        <SimpleInputModal
          title="Respond to TPA Query"
          subtitle={`Query: "${activeQueryItem.queryText}"`}
          icon={Send}
          iconColor="text-blue-600 bg-blue-100"
          fields={[
            { name: 'responseText', label: 'Hospital Response / Clarification', type: 'textarea', required: true },
            { name: 'responseDocUrl', label: 'Supporting Document URL', type: 'text', placeholder: 'https://...' }
          ]}
          submitLabel="Submit Response & Resume Submission"
          submitClass="btn btn-primary bg-blue-600 hover:bg-blue-700"
          onClose={() => setShowRespondQueryModal(false)}
          onSubmit={(vals) => handleSaveQueryResponse(vals.responseText, vals.responseDocUrl || '')}
          loading={actionLoading}
        />
      )}

      {/* ========================================================= */}
      {/*              INITIAL APPROVAL SANCTION MODAL              */}
      {/* ========================================================= */}
      {showApproveModal && activeRecord && (
        <SimpleInputModal
          title="Approve Initial Pre-Authorization"
          subtitle={`Requested Amount: ₹${Number(activeRecord.initialRequestedAmount || 0).toLocaleString('en-IN')}`}
          icon={CheckCircle2}
          iconColor="text-emerald-600 bg-emerald-100"
          fields={[
            {
              name: 'approvedAmount',
              label: 'Approved Sanction Amount (₹)',
              type: 'number',
              required: true,
              defaultValue: String(activeRecord.initialRequestedAmount || '')
            },
            {
              name: 'claimNumber',
              label: 'TPA Pre-Auth / Claim Reference Number',
              type: 'text',
              defaultValue: activeRecord.claimNumber || ''
            },
            {
              name: 'tpaApprovalLetterUrl',
              label: 'Approval Letter / Sanction PDF URL',
              type: 'text',
              placeholder: 'https://...'
            },
            {
              name: 'notes',
              label: 'Approval Notes / Deductions / Remarks',
              type: 'textarea'
            }
          ]}
          submitLabel="Confirm Sanction Approval"
          submitClass="btn btn-primary bg-emerald-600 hover:bg-emerald-700"
          onClose={() => setShowApproveModal(false)}
          onSubmit={(vals) =>
            handleApproveInitial(vals.approvedAmount, vals.tpaApprovalLetterUrl, vals.claimNumber, vals.notes)
          }
          loading={actionLoading}
        />
      )}

      {/* ========================================================= */}
      {/*               REQUEST ENHANCEMENT MODAL                   */}
      {/* ========================================================= */}
      {showEnhancementModal && activeRecord && (
        <SimpleInputModal
          title="Request Coverage Enhancement"
          subtitle={`Current Approved: ₹${Number(activeRecord.totalApprovedAmount || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          iconColor="text-purple-600 bg-purple-100"
          fields={[
            {
              name: 'requestedAmount',
              label: 'Additional Enhancement Amount (₹)',
              type: 'number',
              required: true,
              placeholder: 'e.g. 25000'
            },
            {
              name: 'remarks',
              label: 'Medical Justification / Reason for Enhancement',
              type: 'textarea',
              placeholder: 'e.g. Extended ICU stay, additional procedure or consumables needed'
            }
          ]}
          submitLabel="Submit Enhancement Request"
          submitClass="btn btn-primary bg-purple-600 hover:bg-purple-700"
          onClose={() => setShowEnhancementModal(false)}
          onSubmit={(vals) => handleSaveEnhancementRequest(vals.requestedAmount, vals.remarks)}
          loading={actionLoading}
        />
      )}

      {/* ========================================================= */}
      {/*               APPROVE ENHANCEMENT MODAL                   */}
      {/* ========================================================= */}
      {showApproveEnhancementModal && activeRecord && activeEnhancementItem && (
        <SimpleInputModal
          title="Approve Enhancement Request"
          subtitle={`Requested Additional Amount: ₹${Number(activeEnhancementItem.requestedAmount || 0).toLocaleString('en-IN')}`}
          icon={CheckCircle2}
          iconColor="text-purple-600 bg-purple-100"
          fields={[
            {
              name: 'approvedAmount',
              label: 'Sanctioned Enhancement Amount (₹)',
              type: 'number',
              required: true,
              defaultValue: String(activeEnhancementItem.requestedAmount || '')
            },
            {
              name: 'remarks',
              label: 'Approval Remarks',
              type: 'textarea',
              defaultValue: activeEnhancementItem.remarks || ''
            }
          ]}
          submitLabel="Approve Enhancement & Update Sanction"
          submitClass="btn btn-primary bg-purple-600 hover:bg-purple-700"
          onClose={() => setShowApproveEnhancementModal(false)}
          onSubmit={(vals) => handleApproveEnhancement(vals.approvedAmount, vals.remarks)}
          loading={actionLoading}
        />
      )}

      {/* ========================================================= */}
      {/*              FINAL AUTHORIZATION MODAL                    */}
      {/* ========================================================= */}
      {showFinalAuthModal && activeRecord && (
        <FinalAuthorizeModal
          record={activeRecord}
          onClose={() => setShowFinalAuthModal(false)}
          onSubmit={handleFinalAuthorize}
          loading={actionLoading}
        />
      )}

      {/* ========================================================= */}
      {/*                  SETTLE CLAIM MODAL                       */}
      {/* ========================================================= */}
      {showSettleModal && activeRecord && (
        <SimpleInputModal
          title="Mark Pre-Authorization Claim Settled"
          subtitle={`Final Authorized Amount: ₹${Number(activeRecord.finalAuthorizedAmount || 0).toLocaleString('en-IN')}`}
          icon={Check}
          iconColor="text-teal-600 bg-teal-100"
          fields={[
            {
              name: 'settledAmount',
              label: 'Received Settled Amount (₹)',
              type: 'number',
              required: true,
              defaultValue: String(activeRecord.tpaReceivableAmount || activeRecord.finalAuthorizedAmount || '')
            },
            {
              name: 'utrNumber',
              label: 'Bank UTR / Transaction Reference Number',
              type: 'text',
              placeholder: 'e.g. UTR-HDFC-98219481'
            },
            {
              name: 'settlementRef',
              label: 'TPA Settlement Batch / Letter Reference',
              type: 'text',
              placeholder: 'e.g. SETTLE-2026-OCT-09'
            },
            {
              name: 'tdsDeducted',
              label: 'TDS Deducted (₹)',
              type: 'number',
              defaultValue: '0'
            },
            {
              name: 'notes',
              label: 'Settlement Notes / Remarks',
              type: 'textarea'
            }
          ]}
          submitLabel="Confirm Claim Settlement"
          submitClass="btn btn-primary bg-teal-600 hover:bg-teal-700"
          onClose={() => setShowSettleModal(false)}
          onSubmit={(vals) =>
            handleSettleClaim(vals.settledAmount, vals.settlementRef, vals.utrNumber, vals.tdsDeducted, new Date(), vals.notes)
          }
          loading={actionLoading}
        />
      )}

      {/* ========================================================= */}
      {/*                  REJECT CLAIM MODAL                       */}
      {/* ========================================================= */}
      {showRejectModal && activeRecord && (
        <SimpleInputModal
          title="Reject Pre-Authorization"
          subtitle={`Claim: ${activeRecord.claimNumber || activeRecord._id}`}
          icon={XCircle}
          iconColor="text-red-600 bg-red-100"
          fields={[
            {
              name: 'rejectionReason',
              label: 'Rejection Reason / TPA Denial Grounds',
              type: 'textarea',
              required: true,
              placeholder: 'Enter reason stated by TPA/Insurer...'
            },
            {
              name: 'denialLetterUrl',
              label: 'Denial Letter / Rejection PDF URL',
              type: 'text',
              placeholder: 'https://...'
            }
          ]}
          submitLabel="Confirm Rejection"
          submitClass="btn btn-error"
          onClose={() => setShowRejectModal(false)}
          onSubmit={(vals) => handleRejectPreAuth(vals.rejectionReason, vals.denialLetterUrl)}
          loading={actionLoading}
        />
      )}

      {/* ========================================================= */}
      {/*                  CANCEL CLAIM MODAL                       */}
      {/* ========================================================= */}
      {showCancelModal && activeRecord && (
        <SimpleInputModal
          title="Cancel Pre-Authorization"
          subtitle={`Claim: ${activeRecord.claimNumber || activeRecord._id}`}
          icon={Ban}
          iconColor="text-rose-600 bg-rose-100"
          fields={[
            {
              name: 'cancellationReason',
              label: 'Cancellation Reason',
              type: 'textarea',
              required: true,
              placeholder: 'e.g. Patient opted for cash payment, admission cancelled, policy inactive'
            }
          ]}
          submitLabel="Confirm Cancellation"
          submitClass="btn btn-error"
          onClose={() => setShowCancelModal(false)}
          onSubmit={(vals) => handleCancelPreAuth(vals.cancellationReason)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

// ====================================================================
//            SUBCOMPONENT 1: CREATE PRE-AUTH STEPPED MODAL
// ====================================================================
const CreatePreAuthModal = ({ onClose, onSuccess, activeInsurers, activeTpas, doctorsList }) => {
  const [step, setStep] = useState(1); // 1: Patient & Admission, 2: Policy, 3: Clinical & Financial
  const [loadingAdmissions, setLoadingAdmissions] = useState(false);
  const [admissions, setAdmissions] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [patientPolicies, setPatientPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const [formData, setFormData] = useState({
    claimNumber: '',
    initialRequestedAmount: '',
    diagnosis: '',
    treatmentPlan: '',
    estimatedStayDays: '3',
    doctorInCharge: '',
    preauthFormUrl: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Load Active IPD Admissions
  useEffect(() => {
    setLoadingAdmissions(true);
    client
      .get('/ipd/admissions')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setAdmissions(list.filter(a => a.status === 'Admitted' || a.status === 'Under Observation'));
      })
      .catch((err) => {
        console.error('Error fetching IPD admissions:', err);
        toast.error('Failed to load active IPD admissions.');
      })
      .finally(() => setLoadingAdmissions(false));
  }, []);

  // When an admission is selected, load that patient's insurance policies
  const handleSelectAdmission = async (admission) => {
    setSelectedAdmission(admission);
    setSelectedPolicy(null);
    setFormData((prev) => ({
      ...prev,
      diagnosis: admission.provisionalDiagnosis || '',
      doctorInCharge: admission.doctorInCharge?._id || admission.doctorInCharge || ''
    }));

    const pId = admission.patientId?._id || admission.patientId;
    if (!pId) return;

    setLoadingPolicies(true);
    try {
      const { data } = await client.get('/tpa/patient-insurance', {
        params: { patientId: pId }
      });
      const list = Array.isArray(data) ? data : (data?.patientInsurances || []);
      setPatientPolicies(list.filter(p => p.isActive));
      setStep(2);
    } catch (err) {
      console.error('Error fetching patient policies:', err);
      toast.error('Failed to load patient insurance policies.');
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleSelectPolicy = (policy) => {
    setSelectedPolicy(policy);
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmission || !selectedPolicy) {
      toast.error('Please select both an IPD admission and an active insurance policy.');
      return;
    }
    if (!formData.initialRequestedAmount || Number(formData.initialRequestedAmount) <= 0) {
      toast.error('Initial requested amount must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: selectedAdmission.patientId?._id || selectedAdmission.patientId,
        ipdAdmissionId: selectedAdmission._id,
        patientInsuranceId: selectedPolicy._id,
        insuranceCompanyId: selectedPolicy.insuranceCompanyId?._id || selectedPolicy.insuranceCompanyId,
        tpaId: selectedPolicy.tpaId?._id || selectedPolicy.tpaId || null,
        claimNumber: formData.claimNumber?.trim() || '',
        initialRequestedAmount: Number(formData.initialRequestedAmount),
        diagnosis: formData.diagnosis?.trim() || '',
        treatmentPlan: formData.treatmentPlan?.trim() || '',
        estimatedStayDays: Number(formData.estimatedStayDays) || 0,
        doctorInCharge: formData.doctorInCharge || undefined,
        preauthFormUrl: formData.preauthFormUrl?.trim() || '',
        notes: formData.notes?.trim() || ''
      };

      const { data } = await client.post('/tpa/pre-auth', payload);
      toast.success('Pre-Authorization draft created successfully!');
      onSuccess(data);
    } catch (err) {
      console.error('Create pre-auth error:', err);
      const msg = err.response?.data?.message || 'Failed to create Pre-Authorization.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-orange-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-orange-100 bg-orange-50/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">New Cashless Pre-Authorization</h3>
              <p className="text-xs text-gray-500">Step {step} of 3: {step === 1 ? 'Select IPD Admission' : step === 2 ? 'Select Insurance Policy' : 'Clinical & Financial Details'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="grid grid-cols-3 border-b border-gray-100 text-center text-xs font-bold">
          <div className={`py-2 border-b-2 ${step >= 1 ? 'border-orange-600 text-orange-600 bg-orange-50/20' : 'border-transparent text-gray-400'}`}>
            1. IPD Admission
          </div>
          <div className={`py-2 border-b-2 ${step >= 2 ? 'border-orange-600 text-orange-600 bg-orange-50/20' : 'border-transparent text-gray-400'}`}>
            2. Policy Selection
          </div>
          <div className={`py-2 border-b-2 ${step >= 3 ? 'border-orange-600 text-orange-600 bg-orange-50/20' : 'border-transparent text-gray-400'}`}>
            3. Sanction Details
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {/* STEP 1: Select IPD Admission */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="font-bold text-gray-700">Select an active admitted patient for cashless pre-authorization:</p>
              {loadingAdmissions ? (
                <SkeletonTable rows={3} columns={3} />
              ) : admissions.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-gray-50 border border-gray-200">
                  <Bed className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-gray-700">No Active IPD Admissions Found</p>
                  <p className="text-xs text-gray-500 mt-1">Pre-authorization requires an active admitted patient.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {admissions.map((adm) => (
                    <div
                      key={adm._id}
                      onClick={() => handleSelectAdmission(adm)}
                      className="p-3 rounded-xl border border-gray-200 hover:border-orange-500 hover:bg-orange-50/30 cursor-pointer transition-all flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900">{adm.patientId?.patientName || 'Patient'}</span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                            IPD: {adm.ipdNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          UHID: {formatUhid(adm.patientId?.uhid)} • Mob: {adm.patientId?.mobile || '-'}
                        </p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Diag: <span className="font-medium">{adm.provisionalDiagnosis || 'N/A'}</span>
                        </p>
                      </div>
                      <button type="button" className="btn btn-secondary text-xs py-1 px-3">
                        Select →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Insurance Policy */}
          {step === 2 && selectedAdmission && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-gray-900">{selectedAdmission.patientId?.patientName}</p>
                  <p className="text-[11px] text-gray-600 font-mono">IPD: {selectedAdmission.ipdNumber} • UHID: {formatUhid(selectedAdmission.patientId?.uhid)}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-orange-600 font-bold hover:underline">
                  Change Patient
                </button>
              </div>

              <p className="font-bold text-gray-700">Select active cashless policy for this admission (One primary policy per admission):</p>

              {loadingPolicies ? (
                <SkeletonTable rows={2} columns={3} />
              ) : patientPolicies.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
                  <ShieldCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-gray-800">No Active Insurance Policy Registered</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    This patient has no registered insurance policy. Please register a policy in Patient Details before initiating cashless pre-auth.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {patientPolicies.map((pol) => (
                    <div
                      key={pol._id}
                      onClick={() => handleSelectPolicy(pol)}
                      className="p-3.5 rounded-xl border border-gray-200 hover:border-orange-500 hover:bg-orange-50/30 cursor-pointer transition-all flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900">{pol.insuranceCompanyId?.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {pol.policyType}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-mono mt-1">
                          Pol #: <span className="font-bold">{pol.policyNumber}</span> • Member ID: {pol.memberId}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                          Sum Insured: ₹{Number(pol.sumInsured || 0).toLocaleString('en-IN')} (Available: ₹{Number(pol.availableBalance || 0).toLocaleString('en-IN')})
                        </p>
                      </div>
                      <button type="button" className="btn btn-secondary text-xs py-1 px-3">
                        Use Policy →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Sanction Request & Clinical Details */}
          {step === 3 && selectedAdmission && selectedPolicy && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Summary of Selection */}
              <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Patient & IPD</span>
                  <p className="font-bold text-gray-900">{selectedAdmission.patientId?.patientName} ({selectedAdmission.ipdNumber})</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Insurance & TPA</span>
                  <p className="font-bold text-gray-900">{selectedPolicy.insuranceCompanyId?.name} {selectedPolicy.tpaId ? `(TPA: ${selectedPolicy.tpaId.name})` : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Initial Requested Sanction Amount (₹) <span className="text-red-600 font-black">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={formData.initialRequestedAmount}
                    onChange={(e) => setFormData({ ...formData, initialRequestedAmount: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Claim / Pre-Auth Number <span className="text-gray-400 font-normal">(Auto-generated if empty)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated (e.g. CLM-IPD-1001)"
                    value={formData.claimNumber}
                    onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-mono text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Provisional Diagnosis / Ailment</label>
                <input
                  type="text"
                  placeholder="e.g. Acute Appendicitis / Dengue with Thrombocytopenia"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Expected Length of Stay (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedStayDays}
                    onChange={(e) => setFormData({ ...formData, estimatedStayDays: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Treating Doctor</label>
                  <select
                    value={formData.doctorInCharge}
                    onChange={(e) => setFormData({ ...formData, doctorInCharge: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 bg-white text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctorsList.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.doctorName || doc.username} {doc.department ? `(${doc.department})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Treatment Plan / Proposed Procedure</label>
                <textarea
                  rows={2}
                  placeholder="Planned surgery, conservative medical management, investigations..."
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Pre-Authorization Form / Doc URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://storage... or document link"
                  value={formData.preauthFormUrl}
                  onChange={(e) => setFormData({ ...formData, preauthFormUrl: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary text-xs py-2 px-4">
                  ← Back to Policy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs font-bold py-2 px-5 shadow-sm inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Draft Pre-Auth
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ====================================================================
//            SUBCOMPONENT 2: EDIT DRAFT PRE-AUTH MODAL
// ====================================================================
const EditDraftPreAuthModal = ({ record, onClose, onSuccess, doctorsList }) => {
  const [formData, setFormData] = useState({
    claimNumber: record.claimNumber || '',
    initialRequestedAmount: record.initialRequestedAmount || '',
    diagnosis: record.diagnosis || '',
    treatmentPlan: record.treatmentPlan || '',
    estimatedStayDays: record.estimatedStayDays || '',
    doctorInCharge: record.doctorInCharge?._id || record.doctorInCharge || '',
    preauthFormUrl: record.preauthFormUrl || '',
    notes: record.notes || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        claimNumber: formData.claimNumber?.trim(),
        initialRequestedAmount: Number(formData.initialRequestedAmount) || 0,
        diagnosis: formData.diagnosis?.trim(),
        treatmentPlan: formData.treatmentPlan?.trim(),
        estimatedStayDays: Number(formData.estimatedStayDays) || 0,
        doctorInCharge: formData.doctorInCharge || undefined,
        preauthFormUrl: formData.preauthFormUrl?.trim(),
        notes: formData.notes?.trim()
      };

      const { data } = await client.put(`/tpa/pre-auth/${record._id}`, payload);
      toast.success('Draft Pre-Authorization updated successfully!');
      onSuccess(data);
    } catch (err) {
      console.error('Update draft error:', err);
      toast.error(err.response?.data?.message || 'Failed to update draft pre-authorization.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-orange-100 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-orange-100 bg-orange-50/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Edit3 className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Edit Draft Pre-Authorization</h3>
              <p className="text-xs text-gray-500 font-mono">Claim: {record.claimNumber}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Requested Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.initialRequestedAmount}
                onChange={(e) => setFormData({ ...formData, initialRequestedAmount: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-2.5 font-bold text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-800 mb-1">Claim Number</label>
              <input
                type="text"
                value={formData.claimNumber}
                onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-2.5 font-mono text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">Diagnosis</label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Stay Days</label>
              <input
                type="number"
                min="0"
                value={formData.estimatedStayDays}
                onChange={(e) => setFormData({ ...formData, estimatedStayDays: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-800 mb-1">Doctor</label>
              <select
                value={formData.doctorInCharge}
                onChange={(e) => setFormData({ ...formData, doctorInCharge: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-2.5 bg-white text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                <option value="">-- Select Doctor --</option>
                {doctorsList.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.doctorName || doc.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">Treatment Plan</label>
            <textarea
              rows={2}
              value={formData.treatmentPlan}
              onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary text-xs font-bold py-2 px-5">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ====================================================================
//            SUBCOMPONENT 3: FINAL AUTHORIZATION MODAL
// ====================================================================
const FinalAuthorizeModal = ({ record, onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({
    finalAuthorizedAmount: record.totalApprovedAmount || '',
    copayPercentage: record.copayPercentage || '0',
    copayAmount: record.copayAmount || '0',
    deductibleAmount: record.deductibleAmount || '0',
    nonPayableAmount: record.nonPayableAmount || '0', // Manual entry
    patientPayableAmount: record.patientPayableAmount || '0',
    tpaReceivableAmount: record.totalApprovedAmount || '',
    finalAuthLetterUrl: record.finalAuthLetterUrl || '',
    notes: record.notes || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-indigo-100 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-indigo-100 bg-indigo-50/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Final Authorization at Discharge</h3>
              <p className="text-xs text-gray-500 font-mono">Claim: {record.claimNumber} • Approved Total: ₹{Number(record.totalApprovedAmount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <label className="block font-extrabold text-indigo-950 mb-1">
              Final Authorized Amount by TPA (₹) <span className="text-red-600 font-black">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              name="finalAuthorizedAmount"
              value={form.finalAuthorizedAmount}
              onChange={handleChange}
              className="w-full rounded-xl border border-indigo-300 p-2.5 font-black text-sm text-indigo-950 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Co-Pay Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                name="copayPercentage"
                value={form.copayPercentage}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-800 mb-1">Co-Pay Amount (₹)</label>
              <input
                type="number"
                min="0"
                name="copayAmount"
                value={form.copayAmount}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                Non-Payable Amount (₹) <span className="text-amber-700 font-bold">(Manual Entry)</span>
              </label>
              <input
                type="number"
                min="0"
                name="nonPayableAmount"
                value={form.nonPayableAmount}
                onChange={handleChange}
                className="w-full rounded-xl border border-amber-300 p-2 text-xs font-bold text-amber-950 focus:outline-none focus:border-amber-500 bg-amber-50/20"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-800 mb-1">Deductibles (₹)</label>
              <input
                type="number"
                min="0"
                name="deductibleAmount"
                value={form.deductibleAmount}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Patient Payable Amount (₹)</label>
              <input
                type="number"
                min="0"
                name="patientPayableAmount"
                value={form.patientPayableAmount}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 p-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-800 mb-1">TPA Receivable Amount (₹)</label>
              <input
                type="number"
                min="0"
                name="tpaReceivableAmount"
                value={form.tpaReceivableAmount}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 p-2 text-xs font-bold text-emerald-700 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">Final Authorization Letter URL</label>
            <input
              type="text"
              name="finalAuthLetterUrl"
              placeholder="https://..."
              value={form.finalAuthLetterUrl}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-xs font-bold py-2 px-5">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Final Authorization
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ====================================================================
//            SUBCOMPONENT 4: VIEW FULL DETAILS MODAL
// ====================================================================
const ViewPreAuthDetailsModal = ({ record, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-orange-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-orange-100 bg-orange-50/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <FileCheck className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-base">Claim: {record.claimNumber}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeStyles[record.preauthStatus] || 'bg-gray-100'}`}>
                  {record.preauthStatus}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">ID: {record._id}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Patient & IPD info */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Patient Details</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{record.patientId?.patientName}</p>
              <p className="text-gray-600 font-mono">UHID: {formatUhid(record.patientId?.uhid)} • {record.patientId?.gender}</p>
              <p className="text-gray-500">Mob: {record.patientId?.mobile || '-'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400">IPD Admission</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">IPD #{record.ipdAdmissionId?.ipdNumber}</p>
              <p className="text-gray-600">Admitted: {record.ipdAdmissionId?.admissionDate ? new Date(record.ipdAdmissionId.admissionDate).toLocaleDateString('en-IN') : '-'}</p>
              <p className="text-gray-500">Status: {record.ipdAdmissionId?.status || 'Admitted'}</p>
            </div>
          </div>

          {/* Insurer & TPA */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-orange-50/50 border border-orange-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-700">Insurance Company</span>
              <p className="font-extrabold text-gray-900 mt-0.5">{record.insuranceCompanyId?.name}</p>
              <p className="text-gray-600 font-mono text-[11px]">Code: {record.insuranceCompanyId?.code}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-700">TPA Provider</span>
              <p className="font-extrabold text-gray-900 mt-0.5">{record.tpaId?.name || 'In-House / Direct'}</p>
              {record.tpaId?.code && <p className="text-gray-600 font-mono text-[11px]">Code: {record.tpaId.code}</p>}
            </div>
          </div>

          {/* Clinical */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Clinical Information</span>
            <p className="text-gray-900 font-semibold">Diagnosis: <span className="font-normal text-gray-700">{record.diagnosis || 'None'}</span></p>
            {record.treatmentPlan && (
              <p className="text-gray-900 font-semibold">Plan: <span className="font-normal text-gray-700">{record.treatmentPlan}</span></p>
            )}
            <p className="text-gray-500">
              Stay: {record.estimatedStayDays || 0} days • Doctor: Dr. {record.doctorInCharge?.doctorName || record.doctorInCharge?.username || 'Attending'}
            </p>
          </div>

          {/* Financial Totals */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Requested</span>
              <p className="font-mono font-black text-blue-950 text-sm mt-0.5">₹{Number(record.initialRequestedAmount || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Approved</span>
              <p className="font-mono font-black text-emerald-950 text-sm mt-0.5">₹{Number(record.totalApprovedAmount || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Final Authorized</span>
              <p className="font-mono font-black text-indigo-950 text-sm mt-0.5">₹{Number(record.finalAuthorizedAmount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Discharge Financial Breakdown (if final auth exists) */}
          {record.finalAuthorizedAmount > 0 && (
            <div className="p-3 rounded-xl bg-indigo-50/30 border border-indigo-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-indigo-900 block">Discharge Financial Breakdown</span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div><span className="text-gray-500">Co-Pay:</span> <span className="font-bold">₹{record.copayAmount} ({record.copayPercentage}%)</span></div>
                <div><span className="text-gray-500">Deductibles:</span> <span className="font-bold">₹{record.deductibleAmount}</span></div>
                <div><span className="text-amber-800 font-semibold">Non-Payable:</span> <span className="font-bold text-amber-900">₹{record.nonPayableAmount}</span></div>
                <div><span className="text-gray-500">Patient Due:</span> <span className="font-bold text-gray-900">₹{record.patientPayableAmount}</span></div>
                <div><span className="text-emerald-700 font-semibold">TPA Due:</span> <span className="font-bold text-emerald-800">₹{record.tpaReceivableAmount}</span></div>
              </div>
            </div>
          )}

          {/* Query History */}
          {record.queryHistory && record.queryHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">TPA Query Thread ({record.queryHistory.length})</span>
              <div className="space-y-2">
                {record.queryHistory.map((q, idx) => (
                  <div key={q._id || idx} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950">Query #{idx + 1}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${q.status === 'Open' ? 'bg-amber-200 text-amber-900' : 'bg-green-100 text-green-800'}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-gray-800">{q.queryText}</p>
                    {q.responseText && (
                      <div className="p-2 rounded bg-white border border-amber-100 text-gray-700">
                        <span className="text-[10px] font-bold text-blue-700 block">Hospital Response:</span>
                        {q.responseText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhancement History */}
          {record.enhancementHistory && record.enhancementHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] uppercase font-bold text-purple-800 block">Enhancement History ({record.enhancementHistory.length})</span>
              <div className="space-y-2">
                {record.enhancementHistory.map((e, idx) => (
                  <div key={e._id || idx} className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-purple-950">Requested: ₹{Number(e.requestedAmount).toLocaleString('en-IN')}</p>
                      {e.remarks && <p className="text-[11px] text-gray-600">{e.remarks}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-200 text-purple-900'}`}>
                        {e.status}
                      </span>
                      {e.approvedAmount > 0 && (
                        <p className="font-bold text-emerald-700 text-xs mt-0.5">Appr: ₹{Number(e.approvedAmount).toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settlement info if settled */}
          {record.preauthStatus === 'Settled' && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-800 block">Settlement Confirmation</span>
              <p className="font-bold text-teal-950 text-sm">Settled Amount: ₹{Number(record.settledAmount).toLocaleString('en-IN')}</p>
              <p className="text-gray-700">UTR: <span className="font-mono font-bold">{record.utrNumber || 'N/A'}</span></p>
              {record.settlementRef && <p className="text-gray-600">Ref: {record.settlementRef}</p>}
            </div>
          )}

          {/* Rejection / Cancellation note if applicable */}
          {record.rejectionReason && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <span className="text-[10px] uppercase font-bold text-red-700 block">Rejection Reason</span>
              <p className="text-red-900 font-medium mt-0.5">{record.rejectionReason}</p>
            </div>
          )}
          {record.cancellationReason && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Cancellation Reason</span>
              <p className="text-rose-900 font-medium mt-0.5">{record.cancellationReason}</p>
            </div>
          )}

          {/* Document Links */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {record.preauthFormUrl && (
              <a href={record.preauthFormUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Pre-Auth Form
              </a>
            )}
            {record.tpaApprovalLetterUrl && (
              <a href={record.tpaApprovalLetterUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Approval Letter
              </a>
            )}
            {record.finalAuthLetterUrl && (
              <a href={record.finalAuthLetterUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Final Auth Letter
              </a>
            )}
            {record.denialLetterUrl && (
              <a href={record.denialLetterUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-red-600">
                <ExternalLink className="h-3 w-3" /> Denial Letter
              </a>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary text-xs font-bold py-2 px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
//            SUBCOMPONENT 5: REUSABLE SIMPLE INPUT MODAL
// ====================================================================
const SimpleInputModal = ({ title, subtitle, icon: Icon, iconColor = '', fields = [], submitLabel = 'Submit', submitClass = 'btn btn-primary', onClose, onSubmit, loading }) => {
  const [formValues, setFormValues] = useState(() => {
    const init = {};
    fields.forEach(f => {
      init[f.name] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    return init;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconColor || 'bg-orange-100 text-orange-600'}`}>
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block font-bold text-gray-800 mb-1">
                {f.label} {f.required && <span className="text-red-600 font-black">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  required={f.required}
                  rows={f.rows || 3}
                  placeholder={f.placeholder}
                  value={formValues[f.name] || ''}
                  onChange={(e) => setFormValues({ ...formValues, [f.name]: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  required={f.required}
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  value={formValues[f.name] || ''}
                  onChange={(e) => setFormValues({ ...formValues, [f.name]: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              )}
            </div>
          ))}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" disabled={loading} className={`${submitClass} text-xs font-bold py-2 px-5 inline-flex items-center gap-1.5`}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreAuthManagement;
