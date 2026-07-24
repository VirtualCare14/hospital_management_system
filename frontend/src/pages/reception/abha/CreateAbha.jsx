import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Fingerprint, Send, KeyRound, CheckCircle, Loader2, UserCheck, Copy } from 'lucide-react';
import { requestAadhaarOtp, verifyAadhaarOtp } from '../../../api/abhaService';
import OtpFlow from './OtpFlow';

const CreateAbha = () => {
  const [step, setStep] = useState(0); // 0: aadhaar input, 1: otp input, 2: success
  const [aadhaar, setAadhaar] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const otpRefs = useRef([]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(aadhaar)) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await requestAadhaarOtp(aadhaar);
      const txn = res.data?.data?.txnId || res.data?.txnId;
      setTxnId(txn);
      setStep(1);
      toast.success('OTP sent to your registered mobile');
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
      const res = await verifyAadhaarOtp(txnId, otp, mobile);
      const data = res.data?.data || res.data;
      setResult(data);
      setStep(2);
      toast.success('ABHA created successfully!');
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
    setMobile('');
    setOtp('');
    setTxnId(null);
    setError(null);
    setResult(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!'));
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
              <p className="mt-1 text-xs text-gray-400">12-digit Aadhaar number linked to Aadhaar</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Mobile Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit mobile number"
                className="input"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-400">This will be linked to your new ABHA</p>
            </div>
            <button
              type="submit"
              disabled={loading || aadhaar.length !== 12 || mobile.length !== 10}
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
                {loading ? 'Verifying...' : 'Verify & Create ABHA'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && result && (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">ABHA Created Successfully!</h3>
              <div className="space-y-2 mt-4">
                {result.abhaNumber && (
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-green-100">
                    <div className="text-left">
                      <span className="text-xs text-gray-500 font-medium">ABHA Number</span>
                      <p className="text-sm font-bold text-gray-800 font-mono">{result.abhaNumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.abhaNumber)}
                      className="text-orange-500 hover:text-orange-600 p-1"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {result.name && (
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-green-100">
                    <div className="text-left">
                      <span className="text-xs text-gray-500 font-medium">Name</span>
                      <p className="text-sm font-bold text-gray-800">{result.name}</p>
                    </div>
                  </div>
                )}
                {result.mobile && (
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-green-100">
                    <div className="text-left">
                      <span className="text-xs text-gray-500 font-medium">Mobile</span>
                      <p className="text-sm font-bold text-gray-800">{result.mobile}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="btn w-full justify-center"
            >
              Create Another ABHA
            </button>
          </div>
        )}
      </OtpFlow>
    </div>
  );
};

export default CreateAbha;