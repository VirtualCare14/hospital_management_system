import { useState } from 'react';
import toast from 'react-hot-toast';
import { UserX, Send, KeyRound, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { requestDeactivateOtp, verifyDeactivateOtp } from '../../../api/abhaService';
import { useAbha } from '../../../context/AbhaContext';
import OtpFlow from './OtpFlow';

const DeactivateAbha = () => {
  const { xtoken, isAuthenticated, logoutAbha, abhaNumber } = useAbha();
  const [showConfirm, setShowConfirm] = useState(true);
  const [step, setStep] = useState(0); // 0: confirm, 1: otp, 2: success
  const [otp, setOtp] = useState('');
  const [reason, setReason] = useState('');
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputAbha, setInputAbha] = useState('');

  const handleRequestOtp = async () => {
    if (!xtoken) {
      setError('ABHA session expired. Please login again.');
      logoutAbha();
      return;
    }
    setShowInputModal(true);
  };

  const handleInputSubmit = async (abha) => {
    if (!abha || abha.length < 10) {
      setError('Please enter a valid ABHA number');
      return;
    }
    setLoading(true);
    setError(null);
    setShowInputModal(false);
    try {
      const res = await requestDeactivateOtp(xtoken, abha);
      const txn = res.data?.data?.txnId || res.data?.txnId;
      setTxnId(txn);
      setShowConfirm(false);
      setStep(1);
      toast.success('Deactivation OTP sent to your registered mobile');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send OTP';
      if (status === 401 || msg?.includes?.('token') || msg?.includes?.('X-token') || msg?.includes?.('expired')) {
        setError('ABHA session expired. Please login again.');
        logoutAbha();
      } else {
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    if (!xtoken) {
      setError('ABHA session expired. Please login again.');
      logoutAbha();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyDeactivateOtp(xtoken, txnId, otp, reason || undefined);
      setStep(2);
      toast.success('ABHA deactivated successfully');
      logoutAbha();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'OTP verification failed';
      if (status === 401 || msg?.includes?.('token') || msg?.includes?.('X-token') || msg?.includes?.('expired')) {
        setError('ABHA session expired. Please login again.');
        logoutAbha();
      } else {
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(true);
    setStep(0);
    setOtp('');
    setReason('');
    setTxnId(null);
    setError(null);
  };

  // Confirmation Dialog
  if (showConfirm) {
    return (
    <div className="max-w-3xl w-full">
        <div className="bg-white border border-red-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Deactivate ABHA Account</h2>
              <p className="text-sm text-gray-500">This is a reversible action</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700 font-medium">
              By proceeding, your ABHA account will be deactivated. You will not be able to use
              ABHA services until you reactivate your account.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-red-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                Profile operations will be disabled
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                You can reactivate your ABHA at any time
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                An OTP will be sent to your registered mobile
              </li>
            </ul>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Reason for deactivation (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              className="input min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={loading}
              className="flex-1 justify-center inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
              {loading ? 'Sending OTP...' : 'Proceed to Deactivate'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Custom ABHA Number Input Modal */}
        {showInputModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Enter ABHA Number</h3>
              <p className="text-sm text-gray-600">Please enter your ABHA number to proceed with deactivation</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={14}
                value={inputAbha}
                onChange={(e) => setInputAbha(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter ABHA number"
                className="input"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowInputModal(false); setInputAbha(''); }}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleInputSubmit(inputAbha)}
                  disabled={loading || inputAbha.length < 10}
                  className="btn flex-1 justify-center disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full">
      <OtpFlow
        steps={['Confirm Deactivation', 'Verify OTP', 'Success']}
        currentStep={step}
        error={error}
      >
        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Deactivation OTP sent to your registered mobile
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Enter OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="input text-center text-lg tracking-[0.5em] font-bold"
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowConfirm(true); setStep(0); setOtp(''); setError(null); }}
                className="btn-secondary flex-1 justify-center"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 justify-center inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {loading ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserX className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">ABHA Deactivated</h3>
            <p className="text-sm text-gray-600">
              Your ABHA account has been deactivated. You have been logged out of the ABHA session.
              You can reactivate your account later.
            </p>
          </div>
        )}
      </OtpFlow>
    </div>
  );
};

export default DeactivateAbha;