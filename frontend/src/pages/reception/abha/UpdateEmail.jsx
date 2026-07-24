import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Send, KeyRound, Loader2, CheckCircle } from 'lucide-react';
import { requestEmailVerification, verifyEmail } from '../../../api/abhaService';
import { useAbha } from '../../../context/AbhaContext';
import OtpFlow from './OtpFlow';

const UpdateEmail = () => {
  const { xtoken, isAuthenticated, logoutAbha } = useAbha();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateEmail = (val) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(val);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
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
      const res = await requestEmailVerification(xtoken, email);
      const txn = res.data?.data?.txnId || res.data?.txnId;
      setTxnId(txn);
      setStep(1);
      toast.success('Verification OTP sent to your email');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send verification';
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
      // Backend verify-email requires: txnId, otp, email
      await verifyEmail(xtoken, txnId, otp, email);
      setStep(2);
      toast.success('Email updated successfully!');
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

  const handleReset = () => {
    setStep(0);
    setEmail('');
    setOtp('');
    setTxnId(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl w-full">
      <OtpFlow
        steps={['Enter New Email', 'Verify OTP', 'Success']}
        currentStep={step}
        error={error}
      >
        {step === 0 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                New Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter new email address"
                  className="input pl-9"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">This will replace your current registered email</p>
            </div>
            <button
              type="submit"
              disabled={loading || !validateEmail(email)}
              className="btn w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
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
              <p className="mt-1 text-xs text-gray-400">
                OTP sent to <span className="font-bold text-orange-600">{email}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(0); setOtp(''); setError(null); }}
                className="btn-secondary flex-1 justify-center"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {loading ? 'Verifying...' : 'Verify & Update'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Email Updated Successfully!</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your ABHA email has been updated to <span className="font-bold">{email}</span>
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="btn justify-center"
            >
              Update Another Email
            </button>
          </div>
        )}
      </OtpFlow>
    </div>
  );
};

export default UpdateEmail;