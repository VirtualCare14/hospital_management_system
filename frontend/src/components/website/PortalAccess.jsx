import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight, ShieldCheck, Building, Lock } from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';

export default function PortalAccess() {
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
      navigate(`/hospital/${data.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Hospital code not found in super admin records.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <section id="portal-access" className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-orange-50/30 to-white border-t border-orange-100/60">
      {/* Soft Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-orange-200/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        {/* Header Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-[#FF6A00] font-sans font-extrabold text-xs uppercase tracking-wider mb-4 shadow-2xs"
        >
          <KeyRound className="w-4 h-4" />
          <span>HOSPITAL PORTAL ACCESS GATEWAY</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display font-extrabold text-3xl sm:text-5xl text-[#101828] tracking-tight mb-4"
        >
          Enter Your <span className="bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] bg-clip-text text-transparent">Hospital Access Code</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-sans text-[#667085] text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Access your hospital's dedicated clinical modules, OPD/IPD desks, doctor queues, and departmental login portals.
        </motion.p>

        {/* Portal Access Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-white rounded-[28px] border border-orange-100 p-8 sm:p-10 shadow-[0_20px_50px_rgba(255,106,0,0.08)] relative max-w-2xl mx-auto"
        >
          <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] rounded-t-[28px]" />

          <form onSubmit={handlePortalLookup} className="space-y-6">
            <div className="text-left space-y-2">
              <label htmlFor="portalSearchCode" className="block font-sans text-xs font-bold text-[#344054] uppercase tracking-wider ml-1">
                Hospital Unique Access Code
              </label>
              <div className="relative flex items-center">
                <Building className="absolute left-4 w-5 h-5 text-gray-400" />
                <input
                  id="portalSearchCode"
                  type="text"
                  required
                  placeholder="e.g. MED-101 or CityCare"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  disabled={searching}
                  className="w-full h-[60px] pl-12 pr-4 bg-slate-50/80 border border-slate-200 rounded-[18px] text-base font-semibold text-[#101828] placeholder:text-gray-400 focus:outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-[#FF6A00]/10 transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full h-[60px] rounded-[18px] font-sans font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] hover:from-[#FF9E1A] hover:to-[#FF7C1A] shadow-[0_4px_20px_rgba(255,106,0,0.25)] hover:shadow-[0_8px_30px_rgba(255,106,0,0.35)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 text-base"
            >
              {searching ? (
                <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <span>Search & Launch Hospital Portal</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Helper Badges */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Case-Insensitive Code Lookup
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Lock className="w-4 h-4 text-amber-500" /> Enterprise Role Isolation
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
