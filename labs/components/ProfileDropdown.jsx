'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Settings, ShieldCheck, ChevronDown, ArrowLeft, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getMainPortalUrl } from '../lib/api';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const username = user?.username || user?.patientName || 'Lab User';
  const userEmail = user?.email || `${username.toLowerCase().replace(/\s+/g, '')}@example.com`;
  const userRole = user?.role || 'Lab Personnel';
  const initial = username.charAt(0).toUpperCase();
  const mainPortalUrl = getMainPortalUrl(user?.hospitalId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-orange-50/80 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
          {initial}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
            {username}
          </span>
          <span className="text-[11px] text-slate-500 capitalize leading-tight">
            {userRole}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Section */}
          <div className="px-4 py-2.5 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900 truncate">
              {username}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {userEmail}
            </p>
            {user?.hospitalName && (
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-md text-[10px] font-bold border border-orange-100">
                {user.hospitalName}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="py-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard');
              }}
              className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-600 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Lab Workspace</span>
            </button>

            {userRole === 'admin' || userRole === 'lab_admin' || userRole === 'labadmin' ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/admin');
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-600 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Lab Admin Console</span>
              </button>
            ) : null}

            {/* Back to All Modules Link */}
            <a
              href={mainPortalUrl}
              className="w-full text-left px-4 py-2 text-xs text-orange-600 hover:bg-orange-50 font-bold flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-2"
            >
              <LayoutGrid className="w-4 h-4 text-orange-500" />
              <span>All Modules (Main Portal)</span>
            </a>
          </div>

          <div className="border-t border-slate-100 pt-1.5 mt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
