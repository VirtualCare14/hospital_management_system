import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Building2,
  Plus,
  Edit3,
  Search,
  X,
  RefreshCw,
  ExternalLink,
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
  Bed,
  Stethoscope,
  Filter,
  FileCheck,
  AlertCircle,
  ClipboardCheck,
  Truck,
  Trash2,
  Paperclip,
  UploadCloud,
  DollarSign,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import PaginationFooter from '../../components/PaginationFooter';
import { formatUhid } from '../../utils/uhid';

const CLAIM_STATUS_OPTIONS = [
  'Draft',
  'Documents Pending',
  'Ready for Submission',
  'Submitted',
  'Under Query',
  'Query Responded',
  'Approved',
  'Partially Settled',
  'Settled',
  'Rejected',
  'Cancelled'
];

const SUBMISSION_TYPES = [
  'TPA Portal',
  'Physical Courier',
  'Email',
  'In-Person Desk'
];

const DOCUMENT_CATEGORIES = [
  'Identity',
  'Policy',
  'PreAuth',
  'Clinical',
  'Discharge',
  'Lab',
  'Pharmacy',
  'Billing',
  'ClaimForm',
  'Other'
];

const statusBadgeStyles = {
  'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
  'Documents Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Ready for Submission': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Submitted': 'bg-blue-50 text-blue-700 border-blue-200',
  'Under Query': 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
  'Query Responded': 'bg-purple-50 text-purple-700 border-purple-200',
  'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Partially Settled': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Settled': 'bg-teal-50 text-teal-800 border-teal-200 font-bold',
  'Rejected': 'bg-red-50 text-red-700 border-red-200',
  'Cancelled': 'bg-gray-200 text-gray-700 border-gray-300'
};

const statusIcons = {
  'Draft': Clock,
  'Documents Pending': AlertTriangle,
  'Ready for Submission': CheckCircle2,
  'Submitted': Send,
  'Under Query': AlertCircle,
  'Query Responded': MessageSquare,
  'Approved': CheckCircle2,
  'Partially Settled': TrendingUp,
  'Settled': Check,
  'Rejected': XCircle,
  'Cancelled': Ban
};

const ClaimsManagement = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || '';
  const initialIpdId = searchParams.get('ipdId') || '';

  const userRole = user?.role?.toLowerCase?.().trim?.() || '';
  const isAdminOrTpa = ['admin', 'superadmin', 'tpa'].includes(userRole);
  const canCreateOrEditDraft = ['admin', 'superadmin', 'tpa', 'billing'].includes(userRole);
  const canSettle = ['admin', 'superadmin', 'tpa', 'billing'].includes(userRole);
  const canManageDocs = ['admin', 'superadmin', 'tpa', 'billing'].includes(userRole);

  // List State
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedInsurerId, setSelectedInsurerId] = useState('');
  const [selectedTpaId, setSelectedTpaId] = useState('');
  const [selectedSubmissionType, setSelectedSubmissionType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Masters & Lookups
  const [activeInsurers, setActiveInsurers] = useState([]);
  const [activeTpas, setActiveTpas] = useState([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDraftModal, setShowEditDraftModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showRespondQueryModal, setShowRespondQueryModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPartialSettleModal, setShowPartialSettleModal] = useState(false);
  const [showFinalSettleModal, setShowFinalSettleModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);

  // Active Context Record
  const [activeRecord, setActiveRecord] = useState(null);
  const [activeQueryItem, setActiveQueryItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Detail Modal Tab
  const [viewTab, setViewTab] = useState('overview');

  // 1. Fetch Masters
  const fetchMasters = useCallback(async () => {
    try {
      const [insurersRes, tpasRes] = await Promise.all([
        client.get('/tpa/insurance-companies/active'),
        client.get('/tpa/providers/active')
      ]);
      setActiveInsurers(Array.isArray(insurersRes.data) ? insurersRes.data : []);
      setActiveTpas(Array.isArray(tpasRes.data) ? tpasRes.data : []);
    } catch (err) {
      console.error('Error fetching TPA masters:', err);
    }
  }, []);

  // 2. Fetch Claims List
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize
      };
      if (search.trim()) params.search = search.trim();
      if (selectedStatus) params.status = selectedStatus;
      if (selectedInsurerId) params.insuranceCompanyId = selectedInsurerId;
      if (selectedTpaId) params.tpaId = selectedTpaId;
      if (selectedSubmissionType) params.submissionType = selectedSubmissionType;
      if (initialPatientId) params.patientId = initialPatientId;
      if (initialIpdId) params.ipdAdmissionId = initialIpdId;

      const { data } = await client.get('/tpa/claims', { params });
      if (data && Array.isArray(data.records)) {
        setRecords(data.records);
        setTotalRecords(data.pagination?.totalRecords || data.records.length);
        setTotalPages(data.pagination?.totalPages || 1);
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
      console.error('Error fetching claims:', err);
      toast.error('Failed to load TPA claims.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedStatus, selectedInsurerId, selectedTpaId, selectedSubmissionType, initialPatientId, initialIpdId]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Key metrics calculated dynamically from records and loaded data
  const metrics = useMemo(() => {
    const total = totalRecords;
    const draftCount = records.filter(r => r.status === 'Draft').length;
    const docsPendingCount = records.filter(r => r.status === 'Documents Pending').length;
    const readyCount = records.filter(r => r.status === 'Ready for Submission').length;
    const submittedCount = records.filter(r => r.status === 'Submitted').length;
    const underQueryCount = records.filter(r => r.status === 'Under Query').length;
    const approvedCount = records.filter(r => r.status === 'Approved').length;
    const partialCount = records.filter(r => r.status === 'Partially Settled').length;
    const settledCount = records.filter(r => r.status === 'Settled').length;
    const rejectedCount = records.filter(r => r.status === 'Rejected').length;

    const totalClaimed = records.reduce((sum, r) => sum + (Number(r.claimedAmount) || 0), 0);
    const totalSettled = records.reduce((sum, r) => sum + (Number(r.settledAmount) || 0), 0);

    return {
      total,
      draftCount,
      docsPendingCount,
      readyCount,
      submittedCount,
      underQueryCount,
      approvedCount,
      partialCount,
      settledCount,
      rejectedCount,
      totalClaimed,
      totalSettled
    };
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
      const { data } = await client.get(`/tpa/claims/${record._id}`);
      setActiveRecord(data);
      setViewTab('overview');
      setShowViewModal(true);
    } catch (err) {
      console.error('Error fetching claim details:', err);
      setActiveRecord(record);
      setViewTab('overview');
      setShowViewModal(true);
    }
  };

  // Refresh active record in view modal after changes
  const refreshActiveRecord = async (claimId) => {
    try {
      const { data } = await client.get(`/tpa/claims/${claimId}`);
      setActiveRecord(data);
    } catch (err) {
      console.error('Error refreshing active claim:', err);
    }
  };

  // ====================================================================
  //                         ACTION DISPATCHERS
  // ====================================================================

  // Transition: Draft -> Documents Pending
  const handleMarkDocumentsPending = async (record) => {
    if (!window.confirm(`Mark claim "${record.claimNumber}" as Documents Pending?`)) return;
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/claims/${record._id}/documents-pending`);
      toast.success(data.message || 'Claim marked as Documents Pending.');
      fetchClaims();
    } catch (err) {
      console.error('Mark docs pending error:', err);
      toast.error(err.response?.data?.message || 'Failed to update claim status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Transition: Draft/Docs Pending -> Ready for Submission
  const handleMarkReadyForSubmission = async (record) => {
    if (!window.confirm(`Mark claim "${record.claimNumber}" as Ready for Submission?`)) return;
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/claims/${record._id}/ready-for-submission`);
      toast.success(data.message || 'Claim is now Ready for Submission.');
      fetchClaims();
    } catch (err) {
      console.error('Mark ready for submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to update claim status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Transition: Ready for Submission -> Submitted
  const handleSubmitClaim = async (submissionData) => {
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/claims/${activeRecord._id}/submit`, submissionData);
      toast.success(data.message || 'Claim submitted successfully!');
      setShowSubmitModal(false);
      fetchClaims();
    } catch (err) {
      console.error('Submit claim error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit claim.');
    } finally {
      setActionLoading(false);
    }
  };

  // Log TPA Query (Submitted -> Under Query)
  const handleSaveQuery = async (queryText, queryDate, queryDocUrl) => {
    if (!queryText?.trim()) {
      toast.error('Query text is required.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.post(`/tpa/claims/${activeRecord._id}/query`, {
        queryText: queryText.trim(),
        queryDate: queryDate || new Date(),
        queryDocUrl: queryDocUrl?.trim() || ''
      });
      toast.success(data.message || 'TPA Query logged successfully. Claim is now Under Query.');
      setShowQueryModal(false);
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Add query error:', err);
      toast.error(err.response?.data?.message || 'Failed to log query.');
    } finally {
      setActionLoading(false);
    }
  };

  // Respond to TPA Query (Under Query -> Query Responded)
  const handleSaveQueryResponse = async (responseText, responseDate, responseDocUrl) => {
    if (!responseText?.trim()) {
      toast.error('Response text is required.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/claims/${activeRecord._id}/query/${activeQueryItem._id}/respond`, {
        responseText: responseText.trim(),
        responseDate: responseDate || new Date(),
        responseDocUrl: responseDocUrl?.trim() || ''
      });
      toast.success(data.message || 'Query response saved. Status updated to Query Responded.');
      setShowRespondQueryModal(false);
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Respond query error:', err);
      toast.error(err.response?.data?.message || 'Failed to respond to query.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Claim (Submitted/Query Responded -> Approved)
  const handleApproveClaim = async (finalAuthorizedAmount, claimedAmount) => {
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/claims/${activeRecord._id}/approve`, {
        finalAuthorizedAmount: Number(finalAuthorizedAmount) || 0,
        claimedAmount: Number(claimedAmount) || 0
      });
      toast.success(data.message || 'Claim approved successfully!');
      setShowApproveModal(false);
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Approve claim error:', err);
      toast.error(err.response?.data?.message || 'Failed to approve claim.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Claim (Terminal: -> Rejected)
  const handleRejectClaim = async () => {
    if (!window.confirm(`Are you sure you want to REJECT claim "${activeRecord.claimNumber}"? This is a permanent terminal status.`)) return;
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/claims/${activeRecord._id}/reject`);
      toast.success(data.message || 'Claim marked as Rejected.');
      setShowRejectModal(false);
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Reject claim error:', err);
      toast.error(err.response?.data?.message || 'Failed to reject claim.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Claim (Terminal: -> Cancelled)
  const handleCancelClaim = async () => {
    if (!window.confirm(`Are you sure you want to CANCEL claim "${activeRecord.claimNumber}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/claims/${activeRecord._id}/cancel`);
      toast.success(data.message || 'Claim cancelled.');
      setShowCancelModal(false);
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Cancel claim error:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel claim.');
    } finally {
      setActionLoading(false);
    }
  };

  // Partial Settlement (Approved -> Partially Settled)
  const handlePartialSettleClaim = async (formData) => {
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/claims/${activeRecord._id}/partially-settle`, formData);
      toast.success(data.message || 'Partial settlement recorded successfully.');
      setShowPartialSettleModal(false);
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Partial settle error:', err);
      toast.error(err.response?.data?.message || 'Failed to record partial settlement.');
    } finally {
      setActionLoading(false);
    }
  };

  // Final Settlement (Approved/Partially Settled -> Settled)
  const handleFinalSettleClaim = async (formData) => {
    setActionLoading(true);
    try {
      const { data } = await client.patch(`/tpa/claims/${activeRecord._id}/settle`, formData);
      toast.success(data.message || 'Claim marked as fully Settled.');
      setShowFinalSettleModal(false);
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Final settle error:', err);
      toast.error(err.response?.data?.message || 'Failed to record settlement.');
    } finally {
      setActionLoading(false);
    }
  };

  // Upload Claim Document (Cloudinary Base64)
  const handleUploadClaimDocument = async (uploadPayload) => {
    setActionLoading(true);
    try {
      const { data } = await client.post(`/tpa/claims/${activeRecord._id}/documents/upload`, uploadPayload);
      toast.success(data.message || 'Document uploaded successfully to Cloudinary.');
      setShowAddDocModal(false);
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Upload document error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload claim document.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Add Document Metadata (Fallback / Metadata Only)
  const handleAddDocumentMetadata = async (docData) => {
    if (!docData.title?.trim() || !docData.fileUrl?.trim()) {
      toast.error('Document title and file URL are required.');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await client.post(`/tpa/claims/${activeRecord._id}/documents`, docData);
      toast.success(data.message || 'Document metadata attached.');
      setShowAddDocModal(false);
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Add document error:', err);
      toast.error(err.response?.data?.message || 'Failed to add document metadata.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Document (Cloudinary Asset + Metadata)
  const handleDeleteDocumentMetadata = async (documentId) => {
    if (!window.confirm('Remove this document from the claim dossier and cloud storage?')) return;
    setActionLoading(true);
    try {
      const { data } = await client.delete(`/tpa/claims/${activeRecord._id}/documents/${documentId}`);
      toast.success(data.message || 'Document removed successfully.');
      fetchClaims();
      if (showViewModal) refreshActiveRecord(activeRecord._id);
    } catch (err) {
      console.error('Delete document error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete document.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="card p-5 bg-white border border-orange-100 shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-2xs">
              <ClipboardCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  TPA Claims & Document Submission Desk
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                  {totalRecords} Total Claims
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Post-discharge claim dossiers, submission logistics, TPA query resolution, and financial settlement reconciliation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchClaims}
              disabled={loading}
              className="p-2.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-gray-200"
              title="Refresh Records"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
            {canCreateOrEditDraft && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary text-xs font-bold py-2.5 px-4 shadow-sm flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Create Claim Dossier
              </button>
            )}
          </div>
        </div>

        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-orange-50">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Claims</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">{metrics.total}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Docs / Draft</p>
            <p className="text-lg font-black text-amber-900 mt-0.5">{metrics.draftCount + metrics.docsPendingCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Ready / Submitted</p>
            <p className="text-lg font-black text-indigo-900 mt-0.5">{metrics.readyCount + metrics.submittedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Under Query</p>
            <p className="text-lg font-black text-rose-900 mt-0.5">{metrics.underQueryCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Approved</p>
            <p className="text-lg font-black text-emerald-900 mt-0.5">{metrics.approvedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200">
            <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Settled (₹)</p>
            <p className="text-lg font-black text-teal-900 mt-0.5">
              ₹{metrics.totalSettled.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="card p-4 bg-white border border-orange-100 shadow-sm rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Claim #, Portal ID, Tracking #, UTR, Patient..."
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
              <option value="">-- All Statuses --</option>
              {CLAIM_STATUS_OPTIONS.map((st) => (
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
              <option value="">-- All Insurers --</option>
              {activeInsurers.map((ins) => (
                <option key={ins._id} value={ins._id}>
                  {ins.name} ({ins.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSubmissionType}
              onChange={(e) => {
                setSelectedSubmissionType(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs font-medium rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">-- Submission Mode --</option>
              {SUBMISSION_TYPES.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Claims Table */}
      <div className="card overflow-hidden bg-white border border-orange-100 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-orange-50/60 border-b border-orange-100 text-gray-700 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="p-3.5">Claim # & Mode</th>
                <th className="p-3.5">Patient & IPD</th>
                <th className="p-3.5">Insurer & TPA</th>
                <th className="p-3.5">Hospital Bill</th>
                <th className="p-3.5">Claimed</th>
                <th className="p-3.5">Approved (Final)</th>
                <th className="p-3.5">Settled</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-6">
                    <SkeletonTable rows={5} columns={9} />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-1">
                        <ClipboardCheck className="h-6 w-6 stroke-[2]" />
                      </div>
                      <p className="font-extrabold text-gray-800 text-sm">No TPA Claims Found</p>
                      <p className="text-xs text-gray-500 max-w-sm">
                        Create a post-discharge claim dossier with billing and pre-authorization references.
                      </p>
                      {canCreateOrEditDraft && (
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(true)}
                          className="btn btn-primary text-xs font-bold mt-3 py-2 px-4 inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Create Claim Dossier
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const StatusIcon = statusIcons[r.status] || HelpCircle;
                  const statusStyle = statusBadgeStyles[r.status] || 'bg-gray-100 text-gray-700';

                  return (
                    <tr key={r._id} className="hover:bg-orange-50/30 transition-colors">
                      {/* Claim Number & Submission Type */}
                      <td className="p-3.5 align-top">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-gray-900 text-xs">{r.claimNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(r.claimNumber, 'Claim Number')}
                            className="text-gray-400 hover:text-orange-600 p-0.5 rounded"
                            title="Copy Claim Number"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                          <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                            {r.submissionType || 'TPA Portal'}
                          </span>
                        </div>
                        {r.portalClaimId && (
                          <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                            Portal ID: {r.portalClaimId}
                          </div>
                        )}
                        {r.trackingNumber && (
                          <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                            AWB: {r.trackingNumber}
                          </div>
                        )}
                      </td>

                      {/* Patient & IPD Details */}
                      <td className="p-3.5 align-top">
                        <p className="font-bold text-gray-900">{r.patientId?.patientName || 'Unknown Patient'}</p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          {formatUhid(r.patientId?.uhid)} • {r.patientId?.gender || '-'}
                        </p>
                        <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                          IPD: <span className="font-semibold text-gray-800">{r.ipdAdmissionId?.ipdNumber || 'N/A'}</span>
                        </p>
                      </td>

                      {/* Insurer & TPA */}
                      <td className="p-3.5 align-top">
                        <p className="font-bold text-gray-900">{r.insuranceCompanyId?.name}</p>
                        <p className="text-[11px] text-gray-600">
                          {r.tpaId ? `TPA: ${r.tpaId.name}` : <span className="text-gray-400 italic">In-House</span>}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                          Pol: {r.patientInsuranceId?.policyNumber || 'N/A'}
                        </p>
                      </td>

                      {/* Hospital Bill */}
                      <td className="p-3.5 align-top font-mono text-gray-800 font-semibold">
                        ₹{Number(r.totalHospitalBill || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Claimed Amount */}
                      <td className="p-3.5 align-top font-mono text-gray-900 font-bold">
                        ₹{Number(r.claimedAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Approved Amount (using finalAuthorizedAmount backend field) */}
                      <td className="p-3.5 align-top font-mono text-emerald-700 font-bold">
                        ₹{Number(r.finalAuthorizedAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Settled Amount */}
                      <td className="p-3.5 align-top font-mono text-teal-800 font-extrabold">
                        ₹{Number(r.settledAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${statusStyle}`}>
                          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                          {r.status}
                        </span>
                        {r.queryHistory?.some(q => q.status === 'Open') && (
                          <span className="block mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Action: Open Query
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {/* 1. View Button (Always visible) */}
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(r)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Full Claim Dossier"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* 2. DRAFT & DOCS PENDING: Edit */}
                          {['Draft', 'Documents Pending'].includes(r.status) && canCreateOrEditDraft && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecord(r);
                                setShowEditDraftModal(true);
                              }}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                              title="Edit Claim"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}

                          {/* 3. DRAFT: Mark Docs Pending */}
                          {r.status === 'Draft' && canCreateOrEditDraft && (
                            <button
                              type="button"
                              onClick={() => handleMarkDocumentsPending(r)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Mark Documents Pending"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          )}

                          {/* 4. DRAFT / DOCS PENDING: Mark Ready for Submission */}
                          {['Draft', 'Documents Pending'].includes(r.status) && isAdminOrTpa && (
                            <button
                              type="button"
                              onClick={() => handleMarkReadyForSubmission(r)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Mark Ready for Submission"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* 5. READY FOR SUBMISSION: Submit */}
                          {r.status === 'Ready for Submission' && isAdminOrTpa && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecord(r);
                                setShowSubmitModal(true);
                              }}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-bold"
                              title="Submit Claim to TPA"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}

                          {/* 6. SUBMITTED / QUERY RESPONDED: Add Query */}
                          {['Submitted', 'Query Responded'].includes(r.status) && isAdminOrTpa && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecord(r);
                                setShowQueryModal(true);
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Log TPA Query"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}

                          {/* 7. UNDER QUERY: Respond Query */}
                          {r.status === 'Under Query' && isAdminOrTpa && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecord(r);
                                const openQuery = r.queryHistory?.find(q => q.status === 'Open') || r.queryHistory?.[0];
                                setActiveQueryItem(openQuery);
                                setShowRespondQueryModal(true);
                              }}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors font-bold"
                              title="Respond to Open Query"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}

                          {/* 8. SUBMITTED / QUERY RESPONDED: Approve */}
                          {['Submitted', 'Query Responded'].includes(r.status) && isAdminOrTpa && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecord(r);
                                setShowApproveModal(true);
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Approve / Sanction Claim"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* 9. APPROVED / PARTIALLY SETTLED: Settle */}
                          {['Approved', 'Partially Settled'].includes(r.status) && canSettle && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecord(r);
                                setShowFinalSettleModal(true);
                              }}
                              className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 transition-colors"
                              title="Record Settlement"
                            >
                              <IndianRupee className="h-4 w-4" />
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

        {/* Pagination Footer */}
        {totalRecords > 0 && (
          <div className="p-3 border-t border-orange-50 bg-gray-50/50">
            <PaginationFooter
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/*                       CREATE CLAIM MODAL                             */}
      {/* ==================================================================== */}
      {showCreateModal && (
        <CreateClaimModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchClaims();
          }}
          activeInsurers={activeInsurers}
          activeTpas={activeTpas}
        />
      )}

      {/* ==================================================================== */}
      {/*                     EDIT DRAFT CLAIM MODAL                           */}
      {/* ==================================================================== */}
      {showEditDraftModal && activeRecord && (
        <EditDraftClaimModal
          claim={activeRecord}
          onClose={() => {
            setShowEditDraftModal(false);
            setActiveRecord(null);
          }}
          onSuccess={() => {
            setShowEditDraftModal(false);
            fetchClaims();
          }}
          activeInsurers={activeInsurers}
          activeTpas={activeTpas}
        />
      )}

      {/* ==================================================================== */}
      {/*                     VIEW CLAIM DETAILS MODAL                         */}
      {/* ==================================================================== */}
      {showViewModal && activeRecord && (
        <ViewClaimDetailsModal
          claim={activeRecord}
          viewTab={viewTab}
          setViewTab={setViewTab}
          onClose={() => {
            setShowViewModal(false);
            setActiveRecord(null);
          }}
          onRefresh={() => refreshActiveRecord(activeRecord._id)}
          isAdminOrTpa={isAdminOrTpa}
          canSettle={canSettle}
          canManageDocs={canManageDocs}
          onOpenSubmit={() => setShowSubmitModal(true)}
          onOpenQuery={() => setShowQueryModal(true)}
          onOpenRespondQuery={(queryItem) => {
            setActiveQueryItem(queryItem);
            setShowRespondQueryModal(true);
          }}
          onOpenApprove={() => setShowApproveModal(true)}
          onOpenReject={() => setShowRejectModal(true)}
          onOpenCancel={() => setShowCancelModal(true)}
          onOpenPartialSettle={() => setShowPartialSettleModal(true)}
          onOpenFinalSettle={() => setShowFinalSettleModal(true)}
          onOpenAddDoc={() => setShowAddDocModal(true)}
          onDeleteDoc={handleDeleteDocumentMetadata}
        />
      )}

      {/* ==================================================================== */}
      {/*                      SUBMIT CLAIM MODAL                              */}
      {/* ==================================================================== */}
      {showSubmitModal && activeRecord && (
        <SubmitClaimModal
          claim={activeRecord}
          loading={actionLoading}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmitClaim}
        />
      )}

      {/* ==================================================================== */}
      {/*                       ADD QUERY MODAL                                */}
      {/* ==================================================================== */}
      {showQueryModal && activeRecord && (
        <AddQueryModal
          claim={activeRecord}
          loading={actionLoading}
          onClose={() => setShowQueryModal(false)}
          onSubmit={handleSaveQuery}
        />
      )}

      {/* ==================================================================== */}
      {/*                     RESPOND QUERY MODAL                              */}
      {/* ==================================================================== */}
      {showRespondQueryModal && activeRecord && activeQueryItem && (
        <RespondQueryModal
          claim={activeRecord}
          queryItem={activeQueryItem}
          loading={actionLoading}
          onClose={() => {
            setShowRespondQueryModal(false);
            setActiveQueryItem(null);
          }}
          onSubmit={handleSaveQueryResponse}
        />
      )}

      {/* ==================================================================== */}
      {/*                      APPROVE CLAIM MODAL                             */}
      {/* ==================================================================== */}
      {showApproveModal && activeRecord && (
        <ApproveClaimModal
          claim={activeRecord}
          loading={actionLoading}
          onClose={() => setShowApproveModal(false)}
          onSubmit={handleApproveClaim}
        />
      )}

      {/* ==================================================================== */}
      {/*                   PARTIAL SETTLEMENT MODAL                           */}
      {/* ==================================================================== */}
      {showPartialSettleModal && activeRecord && (
        <SettlementModal
          isPartial={true}
          claim={activeRecord}
          loading={actionLoading}
          onClose={() => setShowPartialSettleModal(false)}
          onSubmit={handlePartialSettleClaim}
        />
      )}

      {/* ==================================================================== */}
      {/*                    FINAL SETTLEMENT MODAL                            */}
      {/* ==================================================================== */}
      {showFinalSettleModal && activeRecord && (
        <SettlementModal
          isPartial={false}
          claim={activeRecord}
          loading={actionLoading}
          onClose={() => setShowFinalSettleModal(false)}
          onSubmit={handleFinalSettleClaim}
        />
      )}

      {/* ==================================================================== */}
      {/*                   UPLOAD / ADD DOCUMENT MODAL                        */}
      {/* ==================================================================== */}
      {showAddDocModal && activeRecord && (
        <UploadDocumentModal
          claim={activeRecord}
          loading={actionLoading}
          onClose={() => setShowAddDocModal(false)}
          onUpload={handleUploadClaimDocument}
          onSubmitMetadata={handleAddDocumentMetadata}
        />
      )}
    </div>
  );
};

// ====================================================================
//                   MODAL COMPONENT DEFINITIONS
// ====================================================================

// 1. CREATE CLAIM MODAL
const CreateClaimModal = ({ onClose, onSuccess, activeInsurers, activeTpas }) => {
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [ipdAdmissions, setIpdAdmissions] = useState([]);
  const [patientPolicies, setPatientPolicies] = useState([]);
  const [preAuths, setPreAuths] = useState([]);

  const [formData, setFormData] = useState({
    patientId: '',
    ipdAdmissionId: '',
    patientInsuranceId: '',
    insuranceCompanyId: '',
    tpaId: '',
    preAuthorizationId: '',
    billingId: '',
    claimNumber: '',
    portalClaimId: '',
    totalHospitalBill: 0,
    finalAuthorizedAmount: 0,
    claimedAmount: 0,
    nonPayableAmount: 0,
    copayAmount: 0,
    deductibleAmount: 0,
    submissionType: 'TPA Portal'
  });

  const [submitting, setSubmitting] = useState(false);

  // Search Patient
  const handleSearchPatient = async () => {
    if (!patientSearch.trim()) return;
    setSearching(true);
    try {
      const { data } = await client.get(`/patients?search=${encodeURIComponent(patientSearch.trim())}&limit=5`);
      setSearchResults(Array.isArray(data) ? data : data.patients || []);
    } catch (err) {
      console.error('Patient search error:', err);
      toast.error('Failed to search patients.');
    } finally {
      setSearching(false);
    }
  };

  // On Patient Select: Load IPD admissions & registered insurance policies
  const handleSelectPatient = async (p) => {
    setSelectedPatient(p);
    setFormData(prev => ({ ...prev, patientId: p._id }));
    setSearchResults([]);

    try {
      const [ipdRes, polRes, preAuthRes] = await Promise.all([
        client.get(`/ipd/patients?patientId=${p._id}`),
        client.get(`/tpa/patient-insurance?patientId=${p._id}`),
        client.get(`/tpa/pre-auth?patientId=${p._id}`)
      ]);

      const admissions = Array.isArray(ipdRes.data) ? ipdRes.data : ipdRes.data?.admissions || [];
      const policies = Array.isArray(polRes.data) ? polRes.data : polRes.data?.patientInsurances || [];
      const preAuthList = Array.isArray(preAuthRes.data) ? preAuthRes.data : preAuthRes.data?.preAuthorizations || [];

      setIpdAdmissions(admissions);
      setPatientPolicies(policies);
      setPreAuths(preAuthList);

      if (admissions.length > 0) {
        setFormData(prev => ({ ...prev, ipdAdmissionId: admissions[0]._id }));
      }
      if (policies.length > 0) {
        const defaultPol = policies[0];
        setFormData(prev => ({
          ...prev,
          patientInsuranceId: defaultPol._id,
          insuranceCompanyId: defaultPol.insuranceCompanyId?._id || defaultPol.insuranceCompanyId,
          tpaId: defaultPol.tpaId?._id || defaultPol.tpaId || ''
        }));
      }
      if (preAuthList.length > 0) {
        const defaultPreAuth = preAuthList[0];
        setFormData(prev => ({
          ...prev,
          preAuthorizationId: defaultPreAuth._id,
          claimNumber: prev.claimNumber || defaultPreAuth.claimNumber || '',
          finalAuthorizedAmount: defaultPreAuth.finalAuthorizedAmount || defaultPreAuth.totalApprovedAmount || 0,
          claimedAmount: defaultPreAuth.finalAuthorizedAmount || defaultPreAuth.totalApprovedAmount || 0
        }));
      }
    } catch (err) {
      console.error('Error loading patient context:', err);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.ipdAdmissionId || !formData.patientInsuranceId || !formData.insuranceCompanyId) {
      toast.error('Patient, IPD Admission, Insurance Policy, and Insurance Company are required.');
      return;
    }
    if (!formData.claimNumber?.trim()) {
      toast.error('Claim Number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        totalHospitalBill: Number(formData.totalHospitalBill) || 0,
        finalAuthorizedAmount: Number(formData.finalAuthorizedAmount) || 0,
        claimedAmount: Number(formData.claimedAmount) || 0,
        nonPayableAmount: Number(formData.nonPayableAmount) || 0, // Strictly manual entry
        copayAmount: Number(formData.copayAmount) || 0,
        deductibleAmount: Number(formData.deductibleAmount) || 0
      };

      if (!payload.tpaId) delete payload.tpaId;
      if (!payload.preAuthorizationId) delete payload.preAuthorizationId;
      if (!payload.billingId) delete payload.billingId;

      await client.post('/tpa/claims', payload);
      toast.success('TPA Claim dossier created in Draft status!');
      onSuccess();
    } catch (err) {
      console.error('Create claim error:', err);
      toast.error(err.response?.data?.message || 'Failed to create claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-orange-100 overflow-hidden my-8">
        <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            <h2 className="font-extrabold text-sm">Create New TPA Claim Dossier</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* 1. Patient Selection */}
          {!selectedPatient ? (
            <div className="space-y-2 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
              <label className="text-xs font-bold text-gray-700 block">1. Search & Select Patient *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter UHID, Name, or Mobile..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleSearchPatient}
                  disabled={searching}
                  className="btn btn-primary text-xs px-3 shrink-0"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white mt-2 max-h-36 overflow-y-auto">
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => handleSelectPatient(p)}
                      className="p-2 hover:bg-orange-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{p.patientName}</span>
                        <span className="text-gray-500 ml-2 font-mono">{formatUhid(p.uhid)}</span>
                      </div>
                      <span className="text-[11px] text-orange-600 font-semibold">Select</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-900 text-xs">{selectedPatient.patientName}</p>
                <p className="text-[11px] text-emerald-700 font-mono">
                  {formatUhid(selectedPatient.uhid)} • {selectedPatient.mobile}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                Change
              </button>
            </div>
          )}

          {/* 2. Link IPD Admission */}
          {selectedPatient && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">2. IPD Admission *</label>
                <select
                  required
                  value={formData.ipdAdmissionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, ipdAdmissionId: e.target.value }))}
                  className="w-full text-xs p-2 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="">-- Select Admission --</option>
                  {ipdAdmissions.map((adm) => (
                    <option key={adm._id} value={adm._id}>
                      {adm.ipdNumber} ({new Date(adm.admissionDate).toLocaleDateString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">3. Insurance Policy *</label>
                <select
                  required
                  value={formData.patientInsuranceId}
                  onChange={(e) => {
                    const pol = patientPolicies.find(p => p._id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      patientInsuranceId: e.target.value,
                      insuranceCompanyId: pol?.insuranceCompanyId?._id || pol?.insuranceCompanyId || '',
                      tpaId: pol?.tpaId?._id || pol?.tpaId || ''
                    }));
                  }}
                  className="w-full text-xs p-2 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="">-- Select Policy --</option>
                  {patientPolicies.map((pol) => (
                    <option key={pol._id} value={pol._id}>
                      {pol.insuranceCompanyId?.name || 'Insurer'} - Pol: {pol.policyNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 3. Link Pre-Auth & Claim Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Claim Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. CLM-2026-9041"
                value={formData.claimNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, claimNumber: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Submission Mode</label>
              <select
                value={formData.submissionType}
                onChange={(e) => setFormData(prev => ({ ...prev, submissionType: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 bg-white"
              >
                {SUBMISSION_TYPES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Financial Summary Snapshot */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Financial Snapshot</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Total Hospital Bill (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalHospitalBill}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalHospitalBill: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Final Authorized (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.finalAuthorizedAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, finalAuthorizedAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono text-emerald-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Claimed Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.claimedAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, claimedAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Non-Payable (Manual) (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.nonPayableAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, nonPayableAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono text-amber-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Co-pay Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.copayAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, copayAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Deductible (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.deductibleAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, deductibleAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPatient}
              className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5 shadow-sm"
            >
              {submitting ? 'Creating...' : 'Create Claim Dossier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. EDIT DRAFT CLAIM MODAL
const EditDraftClaimModal = ({ claim, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    claimNumber: claim.claimNumber || '',
    portalClaimId: claim.portalClaimId || '',
    totalHospitalBill: claim.totalHospitalBill || 0,
    finalAuthorizedAmount: claim.finalAuthorizedAmount || 0,
    claimedAmount: claim.claimedAmount || 0,
    nonPayableAmount: claim.nonPayableAmount || 0,
    copayAmount: claim.copayAmount || 0,
    deductibleAmount: claim.deductibleAmount || 0,
    submissionType: claim.submissionType || 'TPA Portal',
    courierName: claim.courierName || '',
    trackingNumber: claim.trackingNumber || '',
    acknowledgmentDocUrl: claim.acknowledgmentDocUrl || ''
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put(`/tpa/claims/${claim._id}`, formData);
      toast.success('Claim details updated successfully.');
      onSuccess();
    } catch (err) {
      console.error('Update claim error:', err);
      toast.error(err.response?.data?.message || 'Failed to update claim.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-orange-100 overflow-hidden my-8">
        <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            <h2 className="font-extrabold text-sm">Edit Claim Dossier ({claim.status})</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Claim Number *</label>
              <input
                type="text"
                required
                value={formData.claimNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, claimNumber: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Submission Mode</label>
              <select
                value={formData.submissionType}
                onChange={(e) => setFormData(prev => ({ ...prev, submissionType: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 bg-white"
              >
                {SUBMISSION_TYPES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Financial Snapshot</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Hospital Bill (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalHospitalBill}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalHospitalBill: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Final Authorized (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.finalAuthorizedAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, finalAuthorizedAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono text-emerald-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Claimed Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.claimedAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, claimedAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Non-Payable (Manual) (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.nonPayableAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, nonPayableAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono text-amber-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Co-pay (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.copayAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, copayAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Deductible (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.deductibleAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, deductibleAmount: e.target.value }))}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5 shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. VIEW FULL CLAIM DETAILS MODAL
const ViewClaimDetailsModal = ({
  claim,
  viewTab,
  setViewTab,
  onClose,
  onRefresh,
  isAdminOrTpa,
  canSettle,
  canManageDocs,
  onOpenSubmit,
  onOpenQuery,
  onOpenRespondQuery,
  onOpenApprove,
  onOpenReject,
  onOpenCancel,
  onOpenPartialSettle,
  onOpenFinalSettle,
  onOpenAddDoc,
  onDeleteDoc
}) => {
  const StatusIcon = statusIcons[claim.status] || HelpCircle;
  const statusStyle = statusBadgeStyles[claim.status] || 'bg-gray-100 text-gray-700';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-orange-100 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-orange-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm font-mono tracking-wide">{claim.claimNumber}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusStyle}`}>
                  {claim.status}
                </span>
              </div>
              <p className="text-[11px] text-white/90">
                {claim.patientId?.patientName} • IPD: {claim.ipdAdmissionId?.ipdNumber || 'N/A'} • Insurer: {claim.insuranceCompanyId?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-orange-100 bg-orange-50/40 px-4 pt-2 gap-2 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Patient', icon: User },
            { id: 'financials', label: 'Financial Summary', icon: IndianRupee },
            { id: 'submission', label: 'Submission & Courier', icon: Truck },
            { id: 'documents', label: `Documents (${claim.documents?.length || 0})`, icon: Paperclip },
            { id: 'queries', label: `Queries (${claim.queryHistory?.length || 0})`, icon: MessageSquare },
            { id: 'settlement', label: 'Settlement Reconciliation', icon: Receipt }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setViewTab(t.id)}
              className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                viewTab === t.id
                  ? 'border-orange-500 text-orange-600 bg-white rounded-t-lg'
                  : 'border-transparent text-gray-600 hover:text-orange-600'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* TAB 1: OVERVIEW & PATIENT */}
          {viewTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Card */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">A. Patient & Admission</p>
                  <p className="font-bold text-gray-900 text-sm">{claim.patientId?.patientName}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1 border-t border-gray-200">
                    <div>
                      <span className="text-gray-400 block">UHID</span>
                      <span className="font-mono font-semibold text-gray-800">{formatUhid(claim.patientId?.uhid)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">IPD Number</span>
                      <span className="font-mono font-semibold text-gray-800">{claim.ipdAdmissionId?.ipdNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Gender / Blood</span>
                      <span className="font-semibold text-gray-800">{claim.patientId?.gender} • {claim.patientId?.bloodGroup || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Mobile</span>
                      <span className="font-semibold text-gray-800">{claim.patientId?.mobile || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Insurer Card */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">B. Insurance & TPA</p>
                  <p className="font-bold text-gray-900 text-sm">{claim.insuranceCompanyId?.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1 border-t border-gray-200">
                    <div>
                      <span className="text-gray-400 block">TPA Provider</span>
                      <span className="font-semibold text-gray-800">{claim.tpaId?.name || 'In-House'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Policy Number</span>
                      <span className="font-mono font-semibold text-gray-800">{claim.patientInsuranceId?.policyNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Member / Card ID</span>
                      <span className="font-mono font-semibold text-gray-800">{claim.patientInsuranceId?.memberId || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Sum Insured</span>
                      <span className="font-mono font-semibold text-gray-800">
                        ₹{Number(claim.patientInsuranceId?.sumInsured || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-Authorization Link */}
              {claim.preAuthorizationId && (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-blue-900 block">Linked Pre-Authorization</span>
                    <span className="text-blue-700 font-mono">
                      Claim #: {claim.preAuthorizationId.claimNumber} • Status: {claim.preAuthorizationId.preauthStatus}
                    </span>
                  </div>
                  <div className="font-mono font-extrabold text-blue-950">
                    Auth: ₹{Number(claim.preAuthorizationId.finalAuthorizedAmount || claim.preAuthorizationId.totalApprovedAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FINANCIALS */}
          {viewTab === 'financials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Hospital Bill</span>
                  <span className="text-base font-mono font-extrabold text-gray-900">
                    ₹{Number(claim.totalHospitalBill || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Claimed Amount</span>
                  <span className="text-base font-mono font-extrabold text-blue-950">
                    ₹{Number(claim.claimedAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Approved (Final)</span>
                  <span className="text-base font-mono font-extrabold text-emerald-800">
                    ₹{Number(claim.finalAuthorizedAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <span className="text-[10px] font-bold text-teal-700 uppercase block">Settled Amount</span>
                  <span className="text-base font-mono font-extrabold text-teal-900">
                    ₹{Number(claim.settledAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Patient Deductions & Co-pay</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Non-Payable (Manual)</span>
                    <span className="font-mono font-bold text-amber-800">
                      ₹{Number(claim.nonPayableAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Co-Pay</span>
                    <span className="font-mono font-bold text-gray-800">
                      ₹{Number(claim.copayAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Deductible</span>
                    <span className="font-mono font-bold text-gray-800">
                      ₹{Number(claim.deductibleAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBMISSION */}
          {viewTab === 'submission' && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Submission & Logistics</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block">Submission Mode</span>
                  <span className="font-bold text-gray-800">{claim.submissionType || 'TPA Portal'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Submission Date</span>
                  <span className="font-semibold text-gray-800">
                    {claim.submissionDate ? new Date(claim.submissionDate).toLocaleDateString('en-IN') : 'Not Submitted'}
                  </span>
                </div>
                {claim.portalClaimId && (
                  <div>
                    <span className="text-gray-400 block">Portal Claim ID</span>
                    <span className="font-mono font-bold text-gray-800">{claim.portalClaimId}</span>
                  </div>
                )}
                {claim.courierName && (
                  <div>
                    <span className="text-gray-400 block">Courier Name</span>
                    <span className="font-semibold text-gray-800">{claim.courierName}</span>
                  </div>
                )}
                {claim.trackingNumber && (
                  <div>
                    <span className="text-gray-400 block">Tracking / AWB #</span>
                    <span className="font-mono font-bold text-gray-800">{claim.trackingNumber}</span>
                  </div>
                )}
                {claim.dispatchDate && (
                  <div>
                    <span className="text-gray-400 block">Dispatch Date</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(claim.dispatchDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {viewTab === 'documents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Document Checklist</p>
                {canManageDocs && !['Settled', 'Cancelled', 'Rejected'].includes(claim.status) && (
                  <button
                    type="button"
                    onClick={onOpenAddDoc}
                    className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-2xs"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Upload Document
                  </button>
                )}
              </div>

              {(!claim.documents || claim.documents.length === 0) ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-2">
                  <Paperclip className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-500">No documents attached to this claim.</p>
                  {canManageDocs && !['Settled', 'Cancelled', 'Rejected'].includes(claim.status) && (
                    <button
                      type="button"
                      onClick={onOpenAddDoc}
                      className="btn btn-primary text-xs font-bold py-1.5 px-3 inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      Upload First Document
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white overflow-hidden">
                  {claim.documents.map((doc) => (
                    <div key={doc._id} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                          {doc.category}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-gray-900">{doc.title}</p>
                            {doc.cloudinaryPublicId && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200">
                                Cloud
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {doc.fileName || 'document.pdf'}
                            {doc.fileType ? ` • ${doc.fileType}` : ''}
                            {doc.uploadedAt ? ` • ${new Date(doc.uploadedAt).toLocaleDateString('en-IN')}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 font-bold text-[11px]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </a>
                        )}
                        {canManageDocs && !['Settled', 'Cancelled', 'Rejected'].includes(claim.status) && (
                          <button
                            type="button"
                            onClick={() => onDeleteDoc(doc._id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Remove Document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: QUERIES */}
          {viewTab === 'queries' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">TPA Query History</p>
                {isAdminOrTpa && ['Submitted', 'Query Responded'].includes(claim.status) && (
                  <button
                    type="button"
                    onClick={onOpenQuery}
                    className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Log Query
                  </button>
                )}
              </div>

              {(!claim.queryHistory || claim.queryHistory.length === 0) ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">No queries logged against this claim.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {claim.queryHistory.map((q, idx) => (
                    <div
                      key={q._id || idx}
                      className={`p-3.5 rounded-xl border ${
                        q.status === 'Open' ? 'border-rose-200 bg-rose-50/40' : 'border-gray-200 bg-gray-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase font-mono">
                          Query #{idx + 1} • {new Date(q.queryDate).toLocaleDateString('en-IN')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            q.status === 'Open' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-800">{q.queryText}</p>

                      {q.responseText ? (
                        <div className="mt-2.5 pt-2 border-t border-gray-200/80 bg-white/70 p-2.5 rounded-lg">
                          <p className="text-[10px] font-bold text-purple-700 uppercase">Hospital Response</p>
                          <p className="text-xs text-gray-800 mt-0.5">{q.responseText}</p>
                          <span className="text-[10px] text-gray-400 block mt-1">
                            Responded: {new Date(q.responseDate).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        q.status === 'Open' && isAdminOrTpa && (
                          <button
                            type="button"
                            onClick={() => onOpenRespondQuery(q)}
                            className="mt-2.5 btn btn-primary text-xs py-1 px-3 inline-flex items-center gap-1"
                          >
                            <Send className="h-3 w-3" />
                            Respond Now
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SETTLEMENT */}
          {viewTab === 'settlement' && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Settlement & UTR Tracking</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block">Settled Amount</span>
                  <span className="font-mono font-bold text-teal-800">
                    ₹{Number(claim.settledAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">TDS Deducted</span>
                  <span className="font-mono font-semibold text-gray-700">
                    ₹{Number(claim.tdsDeducted || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Disallowed Amount</span>
                  <span className="font-mono font-semibold text-rose-700">
                    ₹{Number(claim.disallowedAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Net Received</span>
                  <span className="font-mono font-bold text-gray-900">
                    ₹{Number(claim.netReceivedAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Settlement Ref</span>
                  <span className="font-mono font-semibold text-gray-800">{claim.settlementRef || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">UTR Number</span>
                  <span className="font-mono font-semibold text-gray-800">{claim.utrNumber || '-'}</span>
                </div>
              </div>
              {claim.settlementRemarks && (
                <div className="pt-2 border-t border-gray-200 text-xs">
                  <span className="text-gray-400 block">Remarks</span>
                  <span className="text-gray-700">{claim.settlementRemarks}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions Footer based on State Machine */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Terminal state indicators */}
            {['Settled', 'Rejected', 'Cancelled'].includes(claim.status) ? (
              <span className="text-xs text-gray-500 font-semibold italic">
                Claim is in closed terminal status ({claim.status}).
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Ready for Submission -> Submit */}
            {claim.status === 'Ready for Submission' && isAdminOrTpa && (
              <button
                type="button"
                onClick={onOpenSubmit}
                className="btn btn-primary text-xs py-2 px-3.5 font-bold flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Claim
              </button>
            )}

            {/* Submitted / Query Responded -> Approve */}
            {['Submitted', 'Query Responded'].includes(claim.status) && isAdminOrTpa && (
              <button
                type="button"
                onClick={onOpenApprove}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3.5 font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve / Sanction
              </button>
            )}

            {/* Approved / Partially Settled -> Partial & Final Settle */}
            {['Approved', 'Partially Settled'].includes(claim.status) && canSettle && (
              <>
                <button
                  type="button"
                  onClick={onOpenPartialSettle}
                  className="btn bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-2 px-3 font-bold"
                >
                  Partial Settle
                </button>
                <button
                  type="button"
                  onClick={onOpenFinalSettle}
                  className="btn bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 px-3.5 font-bold flex items-center gap-1"
                >
                  <IndianRupee className="h-3.5 w-3.5" />
                  Final Settle
                </button>
              </>
            )}

            {/* Non-terminal cancellation */}
            {!['Settled', 'Rejected', 'Cancelled'].includes(claim.status) && isAdminOrTpa && (
              <button
                type="button"
                onClick={onOpenCancel}
                className="btn btn-secondary text-rose-600 hover:bg-rose-50 text-xs py-2 px-3"
              >
                Cancel Claim
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs py-2 px-4"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. SUBMIT CLAIM MODAL
const SubmitClaimModal = ({ claim, loading, onClose, onSubmit }) => {
  const [submissionType, setSubmissionType] = useState(claim.submissionType || 'TPA Portal');
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [portalClaimId, setPortalClaimId] = useState(claim.portalClaimId || '');
  const [courierName, setCourierName] = useState(claim.courierName || '');
  const [trackingNumber, setTrackingNumber] = useState(claim.trackingNumber || '');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [acknowledgmentDocUrl, setAcknowledgmentDocUrl] = useState(claim.acknowledgmentDocUrl || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      submissionType,
      submissionDate,
      portalClaimId,
      courierName,
      trackingNumber,
      dispatchDate,
      acknowledgmentDocUrl
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-orange-100 overflow-hidden">
        <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            <h2 className="font-extrabold text-sm">Submit Claim to TPA</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Submission Mode *</label>
            <select
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-300 bg-white"
            >
              {SUBMISSION_TYPES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Submission Date *</label>
            <input
              type="date"
              required
              value={submissionDate}
              onChange={(e) => setSubmissionDate(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-300"
            />
          </div>

          {submissionType === 'TPA Portal' && (
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Portal Claim ID / Reference</label>
              <input
                type="text"
                placeholder="e.g. MED-PRT-8921"
                value={portalClaimId}
                onChange={(e) => setPortalClaimId(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono"
              />
            </div>
          )}

          {submissionType === 'Physical Courier' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Courier Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blue Dart, DTDC"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-gray-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Tracking / AWB Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7481920391"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Dispatch Date</label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-gray-300"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary text-xs px-4 py-2 font-bold">
              {loading ? 'Submitting...' : 'Confirm Submission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 5. ADD QUERY MODAL
const AddQueryModal = ({ claim, loading, onClose, onSubmit }) => {
  const [queryText, setQueryText] = useState('');
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split('T')[0]);
  const [queryDocUrl, setQueryDocUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(queryText, queryDate, queryDocUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-orange-100 overflow-hidden">
        <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="font-extrabold text-sm">Log TPA Query</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Query Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Enter TPA query details or requested documents..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-300"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Query Date</label>
            <input
              type="date"
              value={queryDate}
              onChange={(e) => setQueryDate(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-300"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Query Letter / Doc URL (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={queryDocUrl}
              onChange={(e) => setQueryDocUrl(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary text-xs px-4 py-2 font-bold">
              {loading ? 'Saving...' : 'Log Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 6. RESPOND QUERY MODAL
const RespondQueryModal = ({ claim, queryItem, loading, onClose, onSubmit }) => {
  const [responseText, setResponseText] = useState('');
  const [responseDate, setResponseDate] = useState(new Date().toISOString().split('T')[0]);
  const [responseDocUrl, setResponseDocUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(responseText, responseDate, responseDocUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-orange-100 overflow-hidden">
        <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            <h2 className="font-extrabold text-sm">Respond to TPA Query</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs">
            <p className="font-bold text-rose-900">Query:</p>
            <p className="text-rose-800 mt-0.5">{queryItem.queryText}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Hospital Response *</label>
            <textarea
              required
              rows={3}
              placeholder="Enter response details / clarification provided to TPA..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-300"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Response Document URL (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={responseDocUrl}
              onChange={(e) => setResponseDocUrl(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary text-xs px-4 py-2 font-bold">
              {loading ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 7. APPROVE CLAIM MODAL
const ApproveClaimModal = ({ claim, loading, onClose, onSubmit }) => {
  const [finalAuthorizedAmount, setFinalAuthorizedAmount] = useState(
    claim.finalAuthorizedAmount || claim.claimedAmount || claim.totalHospitalBill || 0
  );
  const [claimedAmount, setClaimedAmount] = useState(claim.claimedAmount || claim.totalHospitalBill || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(finalAuthorizedAmount, claimedAmount);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-orange-100 overflow-hidden">
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="font-extrabold text-sm">Approve / Sanction Claim</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Final Approved / Authorized Amount (₹) *</label>
            <input
              type="number"
              min="0"
              required
              value={finalAuthorizedAmount}
              onChange={(e) => setFinalAuthorizedAmount(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono font-bold text-emerald-800"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Claimed Amount (₹)</label>
            <input
              type="number"
              min="0"
              value={claimedAmount}
              onChange={(e) => setClaimedAmount(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 font-bold">
              {loading ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 8. SETTLEMENT MODAL (PARTIAL & FINAL)
const SettlementModal = ({ isPartial, claim, loading, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    settledAmount: claim.settledAmount || claim.finalAuthorizedAmount || 0,
    tdsDeducted: claim.tdsDeducted || 0,
    disallowedAmount: claim.disallowedAmount || 0,
    netReceivedAmount: claim.netReceivedAmount || (claim.finalAuthorizedAmount || 0),
    settlementRef: claim.settlementRef || '',
    utrNumber: claim.utrNumber || '',
    settlementDate: new Date().toISOString().split('T')[0],
    settlementRemarks: claim.settlementRemarks || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      settledAmount: Number(formData.settledAmount) || 0,
      tdsDeducted: Number(formData.tdsDeducted) || 0,
      disallowedAmount: Number(formData.disallowedAmount) || 0,
      netReceivedAmount: Number(formData.netReceivedAmount) || 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-orange-100 overflow-hidden">
        <div className={`p-4 ${isPartial ? 'bg-cyan-600' : 'bg-teal-700'} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            <h2 className="font-extrabold text-sm">
              {isPartial ? 'Record Partial Settlement' : 'Final Settlement & Close Claim'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Settled Amount (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.settledAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, settledAmount: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Net Received (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.netReceivedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, netReceivedAmount: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono font-bold text-teal-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">TDS Deducted (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.tdsDeducted}
                onChange={(e) => setFormData(prev => ({ ...prev, tdsDeducted: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Disallowed Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.disallowedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, disallowedAmount: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono text-rose-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Settlement Reference</label>
              <input
                type="text"
                placeholder="e.g. SET-8921"
                value={formData.settlementRef}
                onChange={(e) => setFormData(prev => ({ ...prev, settlementRef: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">UTR / Transaction #</label>
              <input
                type="text"
                placeholder="e.g. HDFC91823910"
                value={formData.utrNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, utrNumber: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-300 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Settlement Date</label>
            <input
              type="date"
              value={formData.settlementDate}
              onChange={(e) => setFormData(prev => ({ ...prev, settlementDate: e.target.value }))}
              className="w-full text-xs p-2 rounded-xl border border-gray-300"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Remarks</label>
            <textarea
              rows={2}
              placeholder="Enter payment confirmation or deduction notes..."
              value={formData.settlementRemarks}
              onChange={(e) => setFormData(prev => ({ ...prev, settlementRemarks: e.target.value }))}
              className="w-full text-xs p-2 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn ${isPartial ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-teal-700 hover:bg-teal-800'} text-white text-xs px-4 py-2 font-bold`}
            >
              {loading ? 'Saving...' : 'Record Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 9. UPLOAD / ADD DOCUMENT MODAL
const UploadDocumentModal = ({ claim, loading, onClose, onUpload, onSubmitMetadata }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [category, setCategory] = useState('Discharge');
  const [title, setTitle] = useState('');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Manual URL Metadata State
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('pdf');

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

  const validateAndSetFile = (file) => {
    setFileError('');
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const err = `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 20 MB limit.`;
      setFileError(err);
      toast.error(err);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const err = 'Invalid file type. Allowed formats: PDF, JPG, PNG, WEBP.';
      setFileError(err);
      toast.error(err);
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Document title is required.');
      return;
    }

    if (activeTab === 'upload') {
      if (!selectedFile) {
        toast.error('Please select a file to upload.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await onUpload({
            fileData: reader.result,
            category,
            title: title.trim(),
            fileName: selectedFile.name
          });
        } catch (err) {
          // Keep modal open and file selected on error
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read file from disk.');
      };
      reader.readAsDataURL(selectedFile);
    } else {
      if (!fileUrl.trim()) {
        toast.error('File URL is required for metadata attachment.');
        return;
      }
      onSubmitMetadata({
        category,
        title: title.trim(),
        fileUrl: fileUrl.trim(),
        fileName: fileName.trim() || undefined,
        fileType
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-orange-100 overflow-hidden">
        <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5" />
            <div>
              <h2 className="font-extrabold text-sm">Upload Claim Document</h2>
              <p className="text-[11px] text-orange-100 font-mono">Claim #{claim.claimNumber}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="text-white/80 hover:text-white disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Upload File (Cloudinary)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'url'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            External URL (Metadata Only)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Category */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Document Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-orange-500"
            >
              {DOCUMENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Final Discharge Summary, Investigation Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500"
            />
          </div>

          {activeTab === 'upload' ? (
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Select File (Max 20MB) *</label>
              
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-orange-500 bg-orange-50/50'
                      : 'border-gray-300 hover:border-orange-400 bg-gray-50/50'
                  }`}
                  onClick={() => document.getElementById('claim-file-input').click()}
                >
                  <input
                    id="claim-file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <UploadCloud className="h-8 w-8 text-orange-500 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-gray-800">
                    Click to browse or drag & drop file here
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Allowed: <span className="font-semibold text-gray-700">PDF, JPG, PNG, WEBP</span> (Max 20 MB)
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-700 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setSelectedFile(null);
                      setFileError('');
                    }}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg shrink-0 disabled:opacity-50"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {fileError && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fileError}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">File URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">File Name</label>
                  <input
                    type="text"
                    placeholder="summary.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">File Type</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="pdf">PDF</option>
                    <option value="image/jpeg">JPG / JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (activeTab === 'upload' && !selectedFile)}
              className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {activeTab === 'upload' ? 'Uploading to Cloud...' : 'Saving...'}
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  {activeTab === 'upload' ? 'Upload Document' : 'Attach Metadata'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimsManagement;
