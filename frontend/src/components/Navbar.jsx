import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  ChevronDown, 
  RotateCw, 
  BedDouble, 
  Receipt, 
  Pill, 
  TestTube, 
  Stethoscope, 
  Building2, 
  Users, 
  Activity 
} from 'lucide-react';
import { useHeader } from '../context/HeaderContext';

const getModuleIcon = (pathname, title) => {
  const t = (title || '').toLowerCase();
  const p = (pathname || '').toLowerCase();
  if (p.includes('/ipd') || t.includes('ipd') || t.includes('admission') || t.includes('bed')) return BedDouble;
  if (p.includes('/billing') || t.includes('billing')) return Receipt;
  if (p.includes('/pharmacy') || t.includes('pharmacy')) return Pill;
  if (p.includes('/lab') || t.includes('lab') || t.includes('diagnostic')) return TestTube;
  if (p.includes('/doctor') || t.includes('doctor') || t.includes('consultation')) return Stethoscope;
  if (p.includes('/admin') || t.includes('admin') || t.includes('setting')) return Building2;
  if (p.includes('/reception') || t.includes('patient')) return Users;
  return Activity;
};

const getModuleCategory = (pathname) => {
  const p = (pathname || '').toLowerCase();
  if (p.includes('/ipd')) return 'IPD MANAGEMENT';
  if (p.includes('/billing')) return 'BILLING & INVOICING';
  if (p.includes('/pharmacy')) return 'PHARMACY & INVENTORY';
  if (p.includes('/lab')) return 'LAB DIAGNOSTICS';
  if (p.includes('/doctor')) return 'DOCTOR CONSULTATION';
  if (p.includes('/reception')) return 'RECEPTION & EMR';
  if (p.includes('/same-day-care')) return 'SAME DAY CARE';
  if (p.includes('/admin')) return 'ADMINISTRATION';
  return 'MEDORA360 HEALTHCARE';
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const headerContext = useHeader();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  const roleDisplay = location.pathname.startsWith('/same-day-care') && user.role === 'nursing' ? 'doctor' : user.role;
  const userName = user.doctorName || user.username || 'User';
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const title = headerContext?.title || 'IPD Inpatient Admissions';
  const ModuleIcon = getModuleIcon(location.pathname, title);
  const moduleCategory = getModuleCategory(location.pathname);

  return (
    <div className="px-3 sm:px-4 md:px-5 lg:px-8 pt-3 sm:pt-4 pb-1 relative z-30">
      <header className="w-full min-h-[76px] sm:min-h-[88px] md:min-h-[96px] bg-gradient-to-r from-white via-orange-50/20 to-amber-50/10 rounded-[20px] border border-orange-500/10 p-3 sm:p-4 md:px-6 md:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative shadow-[0_10px_30px_rgba(15,23,42,0.06)] animate-in fade-in slide-in-from-top-3 duration-300">
        
        {/* Background Decorations Container */}
        <div className="absolute inset-0 rounded-[20px] overflow-hidden pointer-events-none">
          <div className="absolute -left-8 -top-8 w-48 h-48 bg-gradient-to-br from-orange-400/15 via-amber-300/5 to-transparent rounded-full blur-2xl" />
          <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(#F97316_1px,transparent_1px)] [background-size:14px_14px] opacity-[0.04]" />
          <div className="absolute left-5 bottom-2 text-orange-400/15 font-mono text-[9px] select-none tracking-[5px]">
            + + + +
          </div>
        </div>

        {/* Left Section: Asymmetric Visual Anchor (Icon Card + Heading) */}
        <div className="flex items-center gap-4.5 z-10 relative">
          {/* Compact Floating Icon Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500/15 rounded-[16px] blur-lg group-hover:blur-xl transition-all duration-300" />
            <div className="w-[54px] h-[54px] md:w-[60px] md:h-[60px] rounded-[16px] bg-white border border-orange-500/15 shadow-[0_10px_24px_rgba(249,115,22,0.12)] flex items-center justify-center shrink-0 relative z-10 group-hover:-translate-y-0.5 transition-transform duration-300">
              <ModuleIcon className="h-6 w-6 md:h-7 md:w-7 text-[#F97316]" />
            </div>
          </div>

          {/* Title & Badge */}
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100/80 border border-orange-200/50 text-[#F97316] text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
              <span>{moduleCategory}</span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-[26px] font-[800] text-[#0F172A] tracking-tight leading-snug font-sans truncate max-w-xl pb-[2px]">
              {title}
            </h1>
          </div>
        </div>

        {/* Right Section: Action Controls (Refresh + Profile) */}
        <div className="z-20 relative flex items-center gap-3 self-end md:self-auto" ref={dropdownRef}>
          {/* Compact Refresh Button */}
          <button
            type="button"
            onClick={headerContext?.handleRefresh}
            className="flex items-center gap-2 h-[42px] px-4 rounded-full border border-orange-200/80 bg-white hover:bg-orange-50/80 text-orange-700 text-xs font-semibold transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow cursor-pointer active:scale-95 focus:outline-none shrink-0"
            title="Refresh Page Data"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#F97316]" />
            <span className="font-semibold text-orange-700">Refresh</span>
          </button>

          {/* Compact User Profile Pill Trigger */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 h-[46px] px-3 pr-3.5 rounded-full border border-orange-200/80 bg-white hover:bg-orange-50/80 hover:border-orange-300 transition-all duration-300 shadow-sm focus:outline-none cursor-pointer hover:shadow"
          >
            {/* Avatar circle */}
            <div className="h-[36px] w-[36px] rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-black tracking-wider shadow-[0_3px_8px_rgba(249,115,22,0.3)] shrink-0">
              {initials || <User className="h-4 w-4 text-white" />}
            </div>
            
            <div className="hidden sm:flex flex-col text-left mr-0.5 py-0.5">
              <span className="text-xs md:text-sm font-bold text-[#0F172A] leading-snug truncate max-w-[160px] pb-[1px]">
                {userName}
              </span>
              <span className="text-[10px] md:text-xs text-[#64748B] font-medium capitalize leading-none">
                {roleDisplay}
              </span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Popover */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2.5 w-64 bg-white border border-orange-100 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right">
              {/* Header info section */}
              <div className="p-3.5 flex items-center gap-3 bg-orange-50/20">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-black tracking-wider shadow-sm shrink-0">
                  {initials || <User className="h-4 w-4 text-white" />}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-bold text-[#0F172A] leading-tight truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-[#64748B] font-medium capitalize mt-0.5">
                    Role: {roleDisplay}
                  </p>
                  {user.email && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Logout button area */}
              <div className="p-2 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50/60 transition-all duration-200 text-left cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0 text-red-500" />
                  Logout Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-2xl max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-200">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-base font-black text-gray-900">Logout Confirmation</h3>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Are you sure you want to logout from account
              </p>
              
              <div className="flex gap-3 justify-center mt-6">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all w-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout(false);
                  }}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-red-200/50 w-full cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default Navbar;
