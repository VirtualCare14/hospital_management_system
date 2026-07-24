import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Loader2, User, Hash, CheckCircle, XCircle, Shield } from 'lucide-react';
import { searchAbha } from '../../../api/abhaService';

const SearchAbha = () => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(false);
    setNotFound(false);
    try {
      const res = await searchAbha(mobile);
      // Backend returns normalized response: { success: true, txnId: "...", results: [...] }
      const data = res.data?.results || res.data?.data || res.data;
      setResult(data);
      setSearched(true);
    } catch (err) {
      const resp = err.response?.data;
      const errorCode = resp?.error?.code || resp?.error?.error?.code;
      const errorMessage = resp?.error?.message || resp?.error?.error?.message || resp?.message || '';

      if (errorCode === 'ABDM-1114' || errorMessage?.toLowerCase().includes('user not found') || errorMessage?.toLowerCase().includes('no account found')) {
        setNotFound(true);
        setSearched(true);
        setResult(null);
      } else {
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage || 'Search failed'));
        setSearched(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasValidAccounts = (data) => {
    if (!data) return false;
    if (Array.isArray(data)) {
      return data.length > 0;
    }
    return false;
  };

  const renderAccount = (account, idx) => {
    if (!account.ABHANumber && !account.abhaNumber && !account.healthId && !account.id && !account.name) {
      return null;
    }
    const abhaNumber = account.ABHANumber || account.abhaNumber || account.healthId || account.id || '';
    const name = account.name || account.fullName || 'ABHA Account';
    const gender = account.gender || '';
    const kycVerified = account.kycVerified || '';
    const authMethods = account.authMethods || [];

    return (
      <div key={idx} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
            <p className="text-xs text-gray-500 font-mono">{abhaNumber}</p>
          </div>
        </div>

        <div className="space-y-2">
          {gender && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Hash className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>Gender: {gender}</span>
            </div>
          )}

          {kycVerified && (
            <div className={`flex items-center gap-2 text-xs font-medium ${kycVerified === 'true' || kycVerified === true ? 'text-green-700' : 'text-red-700'}`}>
              {kycVerified === 'true' || kycVerified === true ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>KYC Verified</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>KYC Not Verified</span>
                </>
              )}
            </div>
          )}

          {authMethods.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Shield className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-1" />
              <div className="flex flex-wrap gap-1.5">
                {authMethods.map((method, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-orange-200 bg-orange-50 text-orange-700"
                  >
                    {method.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl w-full">
      <div className="bg-white border border-orange-100 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Search ABHA Account</h2>
          <p className="text-sm text-gray-500">Search for an ABHA account by mobile number</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Mobile Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit mobile number"
                className="input pl-9"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || mobile.length !== 10}
            className="btn w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Searching...' : 'Search ABHA'}
          </button>
        </form>

        {notFound && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-amber-700">
            No ABHA account found for this mobile number.
          </div>
        )}

        {searched && !error && !notFound && result && hasValidAccounts(result) && (
          <div className="border-t border-orange-100 pt-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Search Results</h3>
            <div className="space-y-3">
              {Array.isArray(result) ? result.map((account, idx) => renderAccount(account, idx)).filter(Boolean) : renderAccount(result, 0)}
            </div>
          </div>
        )}

        {searched && !error && !notFound && result && !hasValidAccounts(result) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-amber-700">
            No ABHA account found for this mobile number.
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAbha;