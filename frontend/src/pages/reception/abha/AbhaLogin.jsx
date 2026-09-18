import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Send, KeyRound, Loader2, UserCheck, RotateCcw, AlertCircle, Fingerprint, Hash, AtSign } from 'lucide-react';
import { requestLoginOtp, verifyLoginOtp } from '../../../api/abhaService';
import { useAbha } from '../../../context/AbhaContext';
import OtpFlow from './OtpFlow';

const AbhaLogin = () => {
  const { loginAbha } = useAbha();
  const [step, setStep] = useState(0); // 0: input, 1: otp, 2: success
  const [loginMethod, setLoginMethod] = useState('aadhaar'); // 'aadhaar' | 'abha-number' | 'abha-address'
  const [loginId, setLoginId] = useState('');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [error, setError] = useState(null);
  const [loginResult, setLoginResult] = useState(null);

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

  const getMethodConfig = (method) => {
    switch (method) {
      case 'abha-number':
        return {
          loginHint: 'abha-number',
          otpSystem: 'aadhaar',
          scope: ['abha-login', 'aadhaar-verify'],
          label: 'ABHA Number',
          placeholder: 'Enter 14-digit ABHA Number',
          helpText: '14-digit ABHA Number (OTP will be sent to linked Aadhaar/Mobile)'
        };
      case 'abha-address':
        return {
          loginHint: 'abha-address',
          otpSystem: 'abdm',
          scope: ['abha-login', 'mobile-verify'],
          label: 'ABHA Address',
          placeholder: 'Enter ABHA Address (e.g., user@abdm)',
          helpText: 'Preferred ABHA Address (OTP will be sent to linked Mobile)'
        };
      case 'aadhaar':
      default:
        return {
          loginHint: 'aadhaar',
          otpSystem: 'aadhaar',
          scope: ['abha-login', 'aadhaar-verify'],
          label: 'Aadhaar Number',
          placeholder: 'Enter 12-digit Aadhaar number',
          helpText: '12-digit Aadhaar number used for ABHA login'
        };
    }
  };

  const handleMethodChange = (method) => {
    setLoginMethod(method);
    setLoginId('');
    setError(null);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    const cleanLoginId = loginId.trim();

    if (loginMethod === 'aadhaar' && !/^\d{12}$/.test(cleanLoginId.replace(/\D/g, ''))) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (loginMethod === 'abha-number' && cleanLoginId.replace(/\D/g, '').length !== 14) {
      setError('Please enter a valid 14-digit ABHA number');
      return;
    }
    if (loginMethod === 'abha-address' && cleanLoginId.length < 3) {
      setError('Please enter a valid ABHA address (e.g. user@abdm)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const config = getMethodConfig(loginMethod);
      const res = await requestLoginOtp({
        loginId: cleanLoginId,
        loginHint: config.loginHint,
        otpSystem: config.otpSystem,
        scope: config.scope
      });

      const txn = res.data?.data?.txnId || res.data?.txnId;
      setTxnId(txn);
      setResendTimer(60);
      setResendAttempts(0);
      setStep(1);
      toast.success('OTP sent successfully');
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
      const config = getMethodConfig(loginMethod);
      const res = await requestLoginOtp({
        loginId: loginId.trim(),
        loginHint: config.loginHint,
        otpSystem: config.otpSystem,
        scope: config.scope
      });

      const txn = res.data?.data?.txnId || res.data?.txnId;
      if (txn) setTxnId(txn);
      setResendAttempts((prev) => prev + 1);
      setResendTimer(60);
      setOtp('');
      toast.success('New OTP sent successfully');
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
      const config = getMethodConfig(loginMethod);
      const res = await verifyLoginOtp({
        txnId,
        otp,
        scope: config.scope
      });

      const resData = res.data?.data || res.data;

      // Handle incorrect OTP when API returns 200 OK with authResult: "failed"
      if (res.data?.authResult === 'failed' || resData?.authResult === 'failed') {
        setError(res.data?.message || resData?.message || 'OTP did not match, please try again');
        return;
      }

      // Backend returns: { success: true, data: {...}, xtoken: "..." }
      const xtoken = res.data?.xtoken || resData?.token || resData?.jwt;
      const data = resData;
      const abha = data?.abhaNumber || data?.ABHANumber || data?.healthIdNumber || data?.abha || data?.id || '';

      if (!xtoken) {
        setError('Login successful but no ABHA user token was returned. Please try again.');
        return;
      }

      loginAbha(xtoken, abha);
      setLoginResult(data);
      setStep(2);
      toast.success('ABHA login successful!');
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
    setLoginMethod('aadhaar');
    setLoginId('');
    setOtp('');
    setTxnId(null);
    setResendTimer(0);
    setResendAttempts(0);
    setError(null);
    setLoginResult(null);
  };

  const currentConfig = getMethodConfig(loginMethod);

  const isInputValid = () => {
    const clean = loginId.trim();
    if (loginMethod === 'aadhaar') return clean.replace(/\D/g, '').length === 12;
    if (loginMethod === 'abha-number') return clean.replace(/\D/g, '').length === 14;
    if (loginMethod === 'abha-address') return clean.length >= 3;
    return false;
  };

  return (
    <div className="max-w-3xl w-full">
      <OtpFlow
        steps={['Select Method', 'Verify OTP', 'Success']}
        currentStep={step}
        error={error}
      >
        {step === 0 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            {/* Login Method Selector */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Choose Login Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleMethodChange('aadhaar')}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    loginMethod === 'aadhaar'
                      ? 'border-orange-500 bg-orange-50/70 text-orange-900 font-bold ring-1 ring-orange-400'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/20'
                  }`}
                >
                  <Fingerprint className={`h-4 w-4 ${loginMethod === 'aadhaar' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className="text-xs">Aadhaar Number</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMethodChange('abha-number')}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    loginMethod === 'abha-number'
                      ? 'border-orange-500 bg-orange-50/70 text-orange-900 font-bold ring-1 ring-orange-400'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/20'
                  }`}
                >
                  <Hash className={`h-4 w-4 ${loginMethod === 'abha-number' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className="text-xs">ABHA Number</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMethodChange('abha-address')}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    loginMethod === 'abha-address'
                      ? 'border-orange-500 bg-orange-50/70 text-orange-900 font-bold ring-1 ring-orange-400'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/20'
                  }`}
                >
                  <AtSign className={`h-4 w-4 ${loginMethod === 'abha-address' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className="text-xs">ABHA Address</span>
                </button>
              </div>
            </div>

            {/* Dynamic Input Field */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                {currentConfig.label}
              </label>
              <input
                type="text"
                inputMode={loginMethod === 'abha-address' ? 'text' : 'numeric'}
                maxLength={loginMethod === 'aadhaar' ? 12 : loginMethod === 'abha-number' ? 14 : 50}
                value={loginId}
                onChange={(e) => {
                  const val = e.target.value;
                  setLoginId(loginMethod === 'abha-address' ? val : val.replace(/\D/g, ''));
                }}
                placeholder={currentConfig.placeholder}
                className="input font-mono"
                disabled={loading}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-400">
                {currentConfig.helpText}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !isInputValid()}
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
              <p className="mt-1 text-xs text-gray-400">
                {loginMethod === 'abha-address' ? 'OTP sent to your registered mobile' : 'OTP sent to your Aadhaar-linked mobile'}
              </p>
            </div>

            {/* Resend OTP Section */}
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
            <button
              type="button"
              onClick={handleReset}
              className="btn w-full justify-center"
            >
              Login Another User
            </button>
          </div>
        )}
      </OtpFlow>
    </div>
  );
};

export default AbhaLogin;