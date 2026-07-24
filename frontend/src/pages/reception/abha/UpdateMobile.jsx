import { useState } from 'react';
import toast from 'react-hot-toast';
import { Smartphone, Send, KeyRound, Loader2, CheckCircle, Phone } from 'lucide-react';
import { requestMobileOtp, verifyMobileOtp } from '../../../api/abhaService';
import { useAbha } from '../../../context/AbhaContext';
import OtpFlow from './OtpFlow';

const UpdateMobile = () => {
  const { xtoken, isAuthenticated, logoutAbha } = useAbha();
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
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
      const res = await requestMobileOtp(xtoken, mobile);
      const txn = res.data?.data?.txnId || res.data?.txnId;
      setTxnId(txn);
      setStep(1);
      toast.success('OTP sent to the new mobile number');
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
      await verifyMobileOtp(xtoken, txnId, otp);
      setStep(2);
      toast.success('Mobile number updated successfully!');
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
    setMobile('');
    setOtp('');
    setTxnId(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl w-full">
      <OtpFlow
        steps={['Enter New Mobile', 'Verify OTP', 'Success']}
        currentStep={step}
        error={error}
      >
        {step === 0 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                New Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new 10-digit mobile number"
                  className="input pl-9"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">This will replace your current registered mobile</p>
            </div>
            <button
              type="submit"
              disabled={loading || mobile.length !== 10}
              className="btn w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? 'Sending OTP...' : 'Request OTP'}
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
                OTP sent to <span className="font-bold text-orange-600">{mobile}</span>
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
              <Smartphone className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Mobile Updated Successfully!</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your ABHA mobile number has been updated to <span className="font-bold">{mobile}</span>
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="btn justify-center"
            >
              Update Another Mobile
            </button>
          </div>
        )}
      </OtpFlow>
    </div>
  );
};

export default UpdateMobile;