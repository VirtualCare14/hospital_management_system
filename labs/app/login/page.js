'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { FlaskConical, Building2, User, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const { login, isAuthenticated, error, setError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalCode, setHospitalCode] = useState('');
  const [showCodeField, setShowCodeField] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    setSessionExpired(false);
    try {
      await login(username, password, showCodeField ? hospitalCode : null);
    } catch (err) {
      // Error handled inside AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50">
      {/* Alerts */}
      {sessionExpired && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold">Session Expired</p>
            <p className="text-xs opacity-90">Your session has timed out or logged in elsewhere. Please sign in again.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Error</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Username / Email / Mobile
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter lab user ID"
              className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Hospital Code Option Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowCodeField(!showCodeField)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 transition-colors focus:outline-none"
          >
            <Building2 className="w-3.5 h-3.5" />
            {showCodeField ? '- Remove Hospital Code' : '+ Specify Hospital Access Code (Optional)'}
          </button>

          {showCodeField && (
            <div className="mt-3 animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Hospital Unique Code
              </label>
              <input
                type="text"
                value={hospitalCode}
                onChange={(e) => setHospitalCode(e.target.value)}
                placeholder="e.g. CITYHOSP-01"
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Directly targets a specific hospital instance if your account spans multiple facilities.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Laboratory</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Footer note */}
      <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400">
          Connected with Medora 360 Admin Backend.
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Need help? Contact your hospital administrator.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md px-6 py-8 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 mb-4 border border-white/20">
            <FlaskConical className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Medora 360
          </h1>
          <p className="text-cyan-400 font-medium text-sm tracking-wider uppercase mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Dedicated Laboratory Portal
          </p>
          <span className="text-xs text-slate-400 mt-1">labs.medora360.com</span>
        </div>

        {/* Suspense wrapped login form */}
        <Suspense fallback={
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-400">
          © 2026 Medora 360 Diagnostic Systems. All rights reserved.
        </div>
      </div>
    </div>
  );
}
