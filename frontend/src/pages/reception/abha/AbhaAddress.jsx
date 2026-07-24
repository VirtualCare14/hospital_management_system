import { useState, useEffect } from 'react';
import { useAbha } from '../../../context/AbhaContext';
import { getAbhaAddressSuggestions, createAbhaAddress, getAbhaProfile } from '../../../api/abhaService';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Hash, Sparkles } from 'lucide-react';

const AbhaAddress = () => {
  const { xtoken, isAuthenticated, abhaNumber } = useAbha();
  const [suggestions, setSuggestions] = useState([]);
  const [txnId, setTxnId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [preferredAddress, setPreferredAddress] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!xtoken) return;
    try {
      const res = await getAbhaProfile(xtoken);
      const data = res.data?.data || res.data;
      if (data?.preferredAbhaAddress) {
        setPreferredAddress(data.preferredAbhaAddress);
      }
    } catch (err) {
      // silent
    }
  };

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    setError(null);
    setSuccess(false);
    setSuggestions([]);
    setSelectedAddress(null);
    setTxnId(null);
    try {
      const res = await getAbhaAddressSuggestions();
      // API returns { txnId, abhaAddressList }
      const data = res.data?.data || res.data;
      const returnedTxnId = data?.txnId;
      const addressList = Array.isArray(data?.abhaAddressList) ? data.abhaAddressList : [];

      if (!returnedTxnId || addressList.length === 0) {
        setError('No ABHA address suggestions received. Please try again later.');
        setLoadingSuggestions(false);
        return;
      }

      setTxnId(returnedTxnId);
      setSuggestions(addressList);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to get suggestions';
      if (status === 401) {
        setError('Unauthorized. Please login again.');
      } else if (status === 404) {
        setError('No suggestions available at this time.');
      } else if (status === 409) {
        setError('Request conflict. Please try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleCreateAddress = async () => {
    if (!txnId || !selectedAddress) {
      toast.error('Please select an address first.');
      return;
    }
    if (!isAuthenticated || !xtoken) {
      setError('ABHA session expired. Please login again.');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await createAbhaAddress(txnId, selectedAddress, 1);
      const data = res.data?.data || res.data;

      const createdPreferred = data?.preferredAbhaAddress || selectedAddress;

      setSuccess(true);
      setPreferredAddress(createdPreferred);
      setSelectedAddress(null);
      setTxnId(null);
      setSuggestions([]);

      toast.success('ABHA Address created successfully');

      // Automatically refresh profile
      setRefreshingProfile(true);
      try {
        await getAbhaProfile(xtoken);
      } catch (err) {
        // silent refresh
      } finally {
        setRefreshingProfile(false);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create address';
      if (status === 401) {
        setError('Unauthorized. Please login again.');
      } else if (status === 400) {
        setError('Invalid request. Please try again.');
      } else if (status === 409) {
        setError('Address already exists or conflict occurred.');
      } else if (status === 404) {
        setError('Transaction expired. Please fetch suggestions again.');
      } else {
        setError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="bg-orange-100 text-orange-700 w-8 h-8 rounded-lg flex items-center justify-center">
          <Hash className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">ABHA Address</h2>
          <p className="text-[11px] text-gray-500">Create and manage your preferred ABHA address</p>
        </div>
      </div>

      {preferredAddress && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-green-800 mb-0.5">Preferred ABHA Address</p>
            <p className="text-sm font-mono font-bold text-green-700 truncate">{preferredAddress}</p>
            {abhaNumber && (
              <p className="text-[10px] text-green-600 mt-0.5">Linked to ABHA Number: {abhaNumber}</p>
            )}
          </div>
        </div>
      )}

      {!preferredAddress && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium">No preferred ABHA address set yet.</p>
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleGetSuggestions}
          disabled={loadingSuggestions}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-orange-700 hover:text-orange-800 px-4 py-2.5 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingSuggestions ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Suggestions...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Get Suggestions
            </>
          )}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Select an Address</p>
          <div className="space-y-2">
            {suggestions.map((item, idx) => {
              const addressValue = item.abhaAddress || item.address || item.value || String(item);
              const isSelected = selectedAddress === addressValue;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAddress(addressValue)}
                  disabled={creating}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-300'
                      : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-mono font-bold text-gray-800 break-all">{addressValue}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCreateAddress}
            disabled={creating || !selectedAddress}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white hover:bg-green-50 text-green-700 hover:text-green-800 px-4 py-2.5 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Address...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Create Address
              </>
            )}
          </button>
          {!selectedAddress && (
            <p className="text-[10px] text-gray-500 text-center">Please select an address to create.</p>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-xs font-medium text-red-700 break-all">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl p-3">
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs font-medium text-green-700">ABHA Address created successfully. Preferred address updated.</p>
        </div>
      )}

      {refreshingProfile && (
        <div className="flex items-center gap-2 text-[10px] text-gray-600 font-medium">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Refreshing profile...
        </div>
      )}
    </div>
  );
};

export default AbhaAddress;