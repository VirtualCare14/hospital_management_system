import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Send, KeyRound, Loader2, UserCheck, Copy, ShieldCheck, RotateCcw, AlertCircle } from 'lucide-react';
import { requestAadhaarOtp, verifyAadhaarOtp } from '../../../api/abhaService';
import OtpFlow from './OtpFlow';

const CreateAbha = () => {
  const [step, setStep] = useState(0); // 0: aadhaar input, 1: otp input, 2: success
  const [hasConsented, setHasConsented] = useState(false);
  const [aadhaar, setAadhaar] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [linkedPatient, setLinkedPatient] = useState(null);

  // Countdown timer for OTP resend (60 seconds)
  useEffect(() => {
    let interval = null;
    if (step === 1 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!hasConsented) {
      setError('Please provide consent to ABDM terms before proceeding');
      return;
    }
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
      setResendTimer(60);
      setResendAttempts(0);
      setStep(1);
      toast.success('OTP sent to your registered mobile');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to send OTP';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendAttempts >= 2 || resending || loading) return;
    setResending(true);
    setError(null);
    try {
      const res = await requestAadhaarOtp(aadhaar);
      const txn = res.data?.data?.txnId || res.data?.txnId;
      if (txn) {
        setTxnId(txn);
      }
      setResendAttempts((prev) => prev + 1);
      setResendTimer(60);
      setOtp('');
      toast.success('New OTP sent to your registered mobile number');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to resend OTP';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (loading || resending) return;
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
      if (res.data?.patient) {
        setLinkedPatient(res.data.patient);
      }
      setStep(2);
      toast.success('ABHA created and saved to Medora Patient database!');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.response?.data?.error ||
        err.message ||
        'OTP verification failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setHasConsented(false);
    setAadhaar('');
    setMobile('');
    setOtp('');
    setTxnId(null);
    setResendTimer(0);
    setResendAttempts(0);
    setError(null);
    setResult(null);
    setLinkedPatient(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!'));
  };

  // CRT_ABHA_113: Extract ABHANumber from various response formats
  const ABHANumber =
    result?.ABHAProfile?.ABHANumber ||
    result?.ABHANumber ||
    result?.abhaNumber ||
    result?.healthIdNumber ||
    result?.response?.ABHANumber ||
    result?.response?.abhaNumber ||
    linkedPatient?.abhaNumber ||
    '';

  return (
    <div className="max-w-3xl w-full">
      <OtpFlow
        steps={['Enter Aadhaar', 'Verify OTP', 'Success']}
        currentStep={step}
        error={error}
      >
        {step === 0 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            {/* CRT_ABHA_102: Mandatory ABDM Consent Collection */}
            <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-4 transition-all">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="abdm-consent"
                  checked={hasConsented}
                  onChange={(e) => {
                    setHasConsented(e.target.checked);
                    if (error) setError(null);
                  }}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                />
                <label htmlFor="abdm-consent" className="text-xs text-gray-700 leading-relaxed cursor-pointer select-none">
                  <span className="font-bold text-gray-900 block mb-1">
                    I consent to ABDM terms for ABHA creation.
                  </span>
                  I hereby declare that I voluntarily share my Aadhaar number and demographic details for the purpose of creating an Ayushman Bharat Health Account (ABHA) in compliance with ABDM guidelines and data privacy regulations.
                </label>
              </div>
            </div>

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
                placeholder={hasConsented ? "Enter 12-digit Aadhaar number" : "Please check consent above to enable"}
                className={`input ${!hasConsented ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : ''}`}
                disabled={loading || !hasConsented}
                autoFocus={hasConsented}
              />
              <p className="mt-1 text-xs text-gray-400">
                {hasConsented ? '12-digit Aadhaar number linked to Aadhaar' : 'Consent is required to enter Aadhaar number'}
              </p>
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
                placeholder={hasConsented ? "Enter 10-digit mobile number" : "Please check consent above to enable"}
                className={`input ${!hasConsented ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : ''}`}
                disabled={loading || !hasConsented}
              />
              <p className="mt-1 text-xs text-gray-400">This will be linked to your new ABHA</p>
            </div>

            <button
              type="submit"
              disabled={loading || !hasConsented || aadhaar.length !== 12 || mobile.length !== 10}
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
                disabled={loading || resending}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-400">OTP sent to your Aadhaar-linked mobile</p>
            </div>

            {/* CRT_ABHA_106: Resend OTP and Timer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div className="text-gray-600">
                {resendAttempts >= 2 ? (
                  <span className="text-amber-700 font-medium flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    Maximum OTP resend attempts reached. Please start over or try again later.
                  </span>
                ) : resendTimer > 0 ? (
                  <span>
                    Resend OTP in <strong className="text-orange-600 font-mono">{resendTimer}s</strong> ({2 - resendAttempts} attempt{2 - resendAttempts === 1 ? '' : 's'} remaining)
                  </span>
                ) : (
                  <span className="text-gray-700">
                    Didn't receive the OTP? ({2 - resendAttempts} attempt{2 - resendAttempts === 1 ? '' : 's'} remaining)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || resendAttempts >= 2 || resending || loading}
                className="font-bold text-orange-600 hover:text-orange-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Resending OTP...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(0); setOtp(''); setError(null); }}
                className="btn-secondary flex-1 justify-center"
                disabled={loading || resending}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || resending || otp.length !== 6}
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

              {/* CRT_ABHA_113: Prominent ABHA Number Display */}
              {ABHANumber && (
                <div className="my-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl p-4 shadow-md shadow-orange-500/10 text-left">
                  <div className="flex items-center justify-between text-xs font-semibold text-orange-100 uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      ABDM Ayushman Bharat Health Account
                    </span>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-orange-100 font-medium">Your ABHA Number is: {ABHANumber}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xl sm:text-2xl font-extrabold font-mono tracking-wider text-white">
                      {ABHANumber}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ABHANumber)}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                      title="Copy ABHA Number"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-4">
                {linkedPatient?.uhid && (
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-orange-200 bg-orange-50/50">
                    <div className="text-left">
                      <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">Medora Patient UHID (Saved in Database)</span>
                      <p className="text-sm font-bold text-gray-900 font-mono">{linkedPatient.uhid}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(linkedPatient.uhid)}
                      className="text-orange-500 hover:text-orange-600 p-1"
                      title="Copy UHID"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {ABHANumber && (
                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-green-100">
                    <div className="text-left">
                      <span className="text-xs text-gray-500 font-medium">ABHA Number</span>
                      <p className="text-sm font-bold text-gray-800 font-mono">{ABHANumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ABHANumber)}
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