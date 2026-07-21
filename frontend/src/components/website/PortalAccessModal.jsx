import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowRight, X, Building, ShieldCheck, Lock } from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';

export default function PortalAccessModal({ isOpen, onClose }) {
  const [searchCode, setSearchCode] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const handlePortalLookup = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast.error('Please enter a hospital unique access code');
      return;
    }
    setSearching(true);
    try {
      const { data } = await client.get(`/auth/hospital-lookup?code=${encodeURIComponent(searchCode.trim())}`);
      toast.success(`Redirecting to ${data.name} Portal...`);
      onClose();
      navigate(`/hospital/${data.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Hospital code not found in super admin records.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white rounded-[28px] border border-orange-100 p-6 sm:p-8 shadow-2xl shadow-slate-900/20 z-10 overflow-hidden"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[#FF8A00] to-[#FF6A00]" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 text-[#FF6A00] flex items-center justify-center mx-auto mb-3 shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="font-display font-extrabold text-2xl text-[#101828] tracking-tight">
                Hospital Portal Access
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#667085] mt-1">
                Enter your hospital access code provided by super admin
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePortalLookup} className="space-y-4">
              <div>
                <label htmlFor="modalAccessCode" className="block font-sans text-xs font-bold text-[#344054] uppercase tracking-wider mb-2 ml-1">
                  Hospital Access Code
                </label>
                <div className="relative flex items-center">
                  <Building className="absolute left-4 w-5 h-5 text-gray-400" />
                  <input
                    id="modalAccessCode"
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter hospital access code..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    disabled={searching}
                    className="w-full h-[54px] pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[16px] text-sm font-semibold text-[#101828] placeholder:text-gray-400 focus:outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-[#FF6A00]/10 transition-all duration-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full h-[54px] rounded-[16px] font-sans font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] hover:from-[#FF9E1A] hover:to-[#FF7C1A] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 text-sm"
              >
                {searching ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <span>Search & Launch Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Information */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Case-insensitive
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" /> Secure Portal Session
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
