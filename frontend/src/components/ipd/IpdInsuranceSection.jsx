import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  IndianRupee,
  Clock,
  TrendingUp,
  Send,
  Ban,
  XCircle,
  Calendar,
  Phone,
  FileCheck,
  AlertTriangle,
  User,
  Check
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDateIST } from '../../utils/dateFormat';

const preauthStatusStyles = {
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

const preauthStatusIcons = {
  'Draft': Clock,
  'Submitted': Send,
  'Queried': AlertTriangle,
  'Approved': CheckCircle2,
  'Enhancement Requested': TrendingUp,
  'Rejected': XCircle,
  'Final Authorized': ShieldCheck,
  'Settled': Check,
  'Cancelled': Ban
};

/**
 * IpdInsuranceSection
 * 
 * Displays insurance coverage & pre-authorization lifecycle information for an IPD admission.
 * Links directly to the Pre-Authorization management workflow without mutating IPD logic.
 */
const IpdInsuranceSection = ({ admission, compact = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role?.toLowerCase?.().trim?.() || '';
  const canManagePreAuth = ['admin', 'superadmin', 'tpa', 'billing', 'ipd'].includes(userRole);
  const canManagePolicies = ['admin', 'superadmin', 'tpa', 'reception', 'billing'].includes(userRole);

  const admissionId = admission?._id;
  const patient = admission?.patientId || {};
  const patientId = patient._id || (typeof admission?.patientId === 'string' ? admission?.patientId : '');

  const [policies, setPolicies] = useState([]);
  const [preAuths, setPreAuths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Policies and Pre-Auth for this patient & admission
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!patientId || !admissionId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [policiesRes, preAuthRes] = await Promise.all([
        client.get(`/tpa/patient-insurance?patientId=${patientId}`).catch(err => {
          console.warn('Patient insurance fetch error:', err);
          return { data: [] };
        }),
        client.get(`/tpa/pre-auth?ipdAdmissionId=${admissionId}`).catch(err => {
          console.warn('Pre-auth fetch error:', err);
          return { data: [] };
        })
      ]);

      // Normalize policies
      let loadedPolicies = [];
      if (Array.isArray(policiesRes.data)) {
        loadedPolicies = policiesRes.data;
      } else if (policiesRes.data?.policies && Array.isArray(policiesRes.data.policies)) {
        loadedPolicies = policiesRes.data.policies;
      }
      setPolicies(loadedPolicies);

      // Normalize pre-authorizations
      let loadedPreAuths = [];
      if (Array.isArray(preAuthRes.data)) {
        loadedPreAuths = preAuthRes.data;
      } else if (preAuthRes.data?.preAuthorizations && Array.isArray(preAuthRes.data.preAuthorizations)) {
        loadedPreAuths = preAuthRes.data.preAuthorizations;
      }
      setPreAuths(loadedPreAuths);
    } catch (err) {
      console.error('Error loading IPD insurance / pre-auth details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, admissionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy helper
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Primary active cashless policy
  const activeCashlessPolicy = policies.find(p => p.isActive) || policies[0] || null;

  // Active Pre-Authorization for this admission (if any)
  const activePreAuth = preAuths.find(pa => !['Cancelled', 'Rejected'].includes(pa.preauthStatus)) || preAuths[0] || null;

  // Loading State
  if (loading) {
    return (
      <div className="card p-5 border-orange-100 bg-white">
        <div className="flex items-center justify-between border-b border-orange-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900 text-sm md:text-base">Insurance & Cashless Details</h3>
          </div>
          <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-100 rounded w-1/3"></div>
          <div className="h-16 bg-gray-50 rounded-xl"></div>
          <div className="h-10 bg-gray-50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // View: No Insurance Policy Linked
  if (!policies || policies.length === 0) {
    return (
      <div className="card p-5 border-orange-100 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-orange-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900 text-sm md:text-base">Insurance & Cashless Coverage</h3>
          </div>
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-1 text-gray-400 hover:text-orange-600 transition-colors rounded-lg cursor-pointer"
            title="Refresh Insurance Info"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm">No Insurance Policy Linked</h4>
              <p className="text-xs text-gray-600 mt-0.5">
                This patient does not currently have any active cashless or insurance policies registered (Self-Pay / Cash Patient).
              </p>
            </div>
          </div>

          {canManagePolicies && (
            <button
              type="button"
              onClick={() => navigate(`/reception/patients/${patientId}`)}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 shrink-0 bg-white border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Link Policy in Profile</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // PreAuth Status Badge Config
  const StatusIcon = activePreAuth ? (preauthStatusIcons[activePreAuth.preauthStatus] || ShieldCheck) : ShieldCheck;
  const statusBadgeStyle = activePreAuth ? (preauthStatusStyles[activePreAuth.preauthStatus] || 'bg-gray-100 text-gray-700') : '';

  return (
    <div className="card p-5 border-orange-100 bg-white space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-orange-500" />
          <h3 className="font-extrabold text-gray-900 text-sm md:text-base">Insurance & Cashless Coverage</h3>
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {policies.length} {policies.length === 1 ? 'Policy Linked' : 'Policies Linked'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors rounded-lg cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid: Left Policy Details | Right Pre-Auth Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Active Insurance Policy Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50/60 to-white border border-orange-200/80 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 block">
                Primary Cashless Policy
              </span>
              <h4 className="font-extrabold text-gray-900 text-sm truncate flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-4 w-4 text-orange-600 shrink-0" />
                <span>{activeCashlessPolicy.insuranceCompanyId?.name || 'Insurance Company'}</span>
                {activeCashlessPolicy.insuranceCompanyId?.code && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-100 text-orange-800">
                    {activeCashlessPolicy.insuranceCompanyId.code}
                  </span>
                )}
              </h4>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
              activeCashlessPolicy.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600'
            }`}>
              {activeCashlessPolicy.isActive ? 'Active Coverage' : 'Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">TPA Provider</span>
              <span className="font-bold text-gray-800 truncate block">
                {activeCashlessPolicy.tpaId?.name ? (
                  `${activeCashlessPolicy.tpaId.name} (${activeCashlessPolicy.tpaId.code || 'TPA'})`
                ) : (
                  'Direct Insurer / In-House'
                )}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Policy Type</span>
              <span className="font-bold text-gray-800">{activeCashlessPolicy.policyType || 'Individual'}</span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Policy Number</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-gray-900 truncate">{activeCashlessPolicy.policyNumber}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeCashlessPolicy.policyNumber, 'Policy Number')}
                  className="text-gray-400 hover:text-orange-600 transition-colors p-0.5 cursor-pointer"
                  title="Copy Policy Number"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Member / Card ID</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-gray-900 truncate">{activeCashlessPolicy.memberId}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeCashlessPolicy.memberId, 'Member ID')}
                  className="text-gray-400 hover:text-orange-600 transition-colors p-0.5 cursor-pointer"
                  title="Copy Member ID"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Sum Insured</span>
              <span className="font-extrabold text-gray-900 text-sm">
                ₹{Number(activeCashlessPolicy.sumInsured || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Available Balance</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                ₹{Number(activeCashlessPolicy.availableBalance || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="col-span-2 pt-1 border-t border-orange-100 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span>Validity: {formatDateIST(activeCashlessPolicy.validFrom)} - {formatDateIST(activeCashlessPolicy.validTill)}</span>
              </span>

              {canManagePolicies && (
                <button
                  type="button"
                  onClick={() => navigate(`/reception/patients/${patientId}`)}
                  className="text-orange-600 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage Policies</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Pre-Authorization Status & Claim Breakdown */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  IPD Pre-Authorization
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {activePreAuth ? (
                    <>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${statusBadgeStyle}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span>{activePreAuth.preauthStatus}</span>
                      </span>
                      {activePreAuth.claimNumber && (
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>{activePreAuth.claimNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activePreAuth.claimNumber, 'Claim Number')}
                            className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                            title="Copy Claim Number"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>Not Initiated</span>
                    </span>
                  )}
                </div>
              </div>

              {activePreAuth && canManagePreAuth && (
                <button
                  type="button"
                  onClick={() => navigate(`/tpa/pre-auth?search=${encodeURIComponent(admission.ipdNumber || activePreAuth.claimNumber)}`)}
                  className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-orange-700 border-orange-200 hover:bg-orange-50 cursor-pointer"
                >
                  <span>Open TPA Desk</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Financial Status Summary */}
            {activePreAuth ? (
              <div className="space-y-2 mt-3">
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <div>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Requested</span>
                    <span className="font-bold text-gray-800 text-xs">
                      ₹{Number(activePreAuth.initialRequestedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Total Approved</span>
                    <span className="font-extrabold text-emerald-700 text-xs">
                      ₹{Number(activePreAuth.totalApprovedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Final Auth</span>
                    <span className="font-extrabold text-indigo-700 text-xs">
                      ₹{Number(activePreAuth.finalAuthorizedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Additional Notice for Queried / Enhancement Status */}
                {activePreAuth.preauthStatus === 'Queried' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="font-bold">TPA Query Pending Response</span>
                    </div>
                    {canManagePreAuth && (
                      <button
                        type="button"
                        onClick={() => navigate(`/tpa/pre-auth?search=${encodeURIComponent(activePreAuth.claimNumber)}`)}
                        className="text-amber-800 underline font-extrabold text-[11px] cursor-pointer"
                      >
                        Respond Now
                      </button>
                    )}
                  </div>
                )}

                {activePreAuth.preauthStatus === 'Enhancement Requested' && (
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600 shrink-0" />
                      <span className="font-bold">Enhancement Request in Progress</span>
                    </div>
                  </div>
                )}

                {activePreAuth.preauthStatus === 'Final Authorized' && (
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-950 grid grid-cols-3 gap-1 text-center font-bold">
                    <div>Co-pay: ₹{Number(activePreAuth.copayAmount || 0).toLocaleString('en-IN')}</div>
                    <div>Non-Payable: ₹{Number(activePreAuth.nonPayableAmount || 0).toLocaleString('en-IN')}</div>
                    <div className="text-emerald-700">TPA Due: ₹{Number(activePreAuth.tpaReceivableAmount || 0).toLocaleString('en-IN')}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-500 mt-3 text-center">
                <p>No active Pre-Authorization initiated for this IPD admission yet.</p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
            {!activePreAuth && canManagePreAuth && (
              <button
                type="button"
                onClick={() => navigate(`/tpa/pre-auth?patientId=${patientId}&ipdId=${admissionId}`)}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Pre-Authorization</span>
              </button>
            )}

            {activePreAuth && (
              <button
                type="button"
                onClick={() => navigate(`/tpa/pre-auth?search=${encodeURIComponent(admission.ipdNumber || activePreAuth.claimNumber)}`)}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer text-gray-700 hover:text-orange-600"
              >
                <FileCheck className="h-3.5 w-3.5 text-orange-500" />
                <span>View in Pre-Auth Workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IpdInsuranceSection;
