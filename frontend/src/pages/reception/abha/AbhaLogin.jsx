import { useState } from 'react';
import toast from 'react-hot-toast';
import { LogIn, Send, KeyRound, Loader2, CheckCircle, UserCheck } from 'lucide-react';
import { requestLoginOtp, verifyLoginOtp } from '../../../api/abhaService';
import { useAbha } from '../../../context/AbhaContext';
import OtpFlow from './OtpFlow';

const AbhaLogin = () => {
  const { loginAbha } = useAbha();
  const [step, setStep] = useState(0); // 0: aadhaar input, 1: otp, 2: success
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginResult, setLoginResult] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(aadhaar)) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await requestLoginOtp(aadhaar);
      const txn = res.data?.data?.txnId || res.data?.txnId;
      setTxnId(txn);
      setStep(1);
      toast.success('OTP sent to your Aadhaar-linked mobile');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send OTP';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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
    setLoading(true);
    setError(null);
    try {
      const res = await verifyLoginOtp(txnId, otp);
      // Backend returns: { success: true, data: {...}, xtoken: "..." }
      const xtoken = res.data?.xtoken;
      const data = res.data?.data || res.data;
      const abha = data?.abhaNumber || data?.abha || data?.id || '';
      
      if (!xtoken) {
        setError('Login successful but no ABHA user token was returned. Please try again.');
        return;
      }
      
      loginAbha(xtoken, abha);
      setLoginResult(data);
      setStep(2);
      toast.success('ABHA login successful!');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'OTP verification failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setAadhaar('');
    setOtp('');
    setTxnId(null);
    setError(null);
    setLoginResult(null);
  };

  return (
    <div className="max-w-3xl w-full">
      <OtpFlow
        steps={['Enter Aadhaar', 'Verify OTP', 'Success']}
        currentStep={step}
        error={error}
      >
        {step === 0 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Aadhaar Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 12-digit Aadhaar number"
                className="input"
                disabled={loading}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-400">
                Aadhaar number used for ABHA login
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || aadhaar.length !== 12}
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
              <p className="mt-1 text-xs text-gray-400">OTP sent to your Aadhaar-linked mobile</p>
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
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">ABHA Login Successful</h3>
              <p className="text-sm text-gray-600">
                You are now authenticated. You can access profile, card, and other ABHA services.
              </p>
              {loginResult?.name && (
                <p className="mt-3 text-sm font-bold text-gray-800">{loginResult.name}</p>
              )}
            </div>
          </div>
        )}
      </OtpFlow>
    </div>
  );
};

export default AbhaLogin;