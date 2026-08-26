'use client';

import { useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  Settings, 
  Bell, 
  Menu, 
  X,
  Sliders,
  FileText,
  Building2,
  ArrowLeft,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../context/AuthContext';
import { getMainPortalUrl } from '../lib/api';

export default function Header({ toggleMobileSidebar }) {
  const { user } = useAuth();
  const isAdminUser = user?.role === 'admin' || user?.role === 'lab_admin' || user?.role === 'labadmin' || user?.role === 'superadmin';
  const [searchVal, setSearchVal] = useState('');
  const [showSetupMenu, setShowSetupMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-orange-100/80 h-16 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left section: Logo & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-orange-600 focus:outline-none transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/30 group-hover:bg-orange-600 transition-colors">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 leading-none tracking-tight">
              Labs
            </span>
            <span className="text-[10px] text-orange-600 font-semibold tracking-wide mt-0.5">
              MANAGEMENT SYSTEM
            </span>
          </div>
        </Link>
      </div>

      {/* Center/Left: Search Bar */}
      <div className="hidden sm:flex items-center flex-1 max-w-md ml-6 mr-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search any bills, reports, patients..."
            className="w-full h-9 pl-9 pr-4 bg-orange-50/40 border border-orange-200/70 rounded-xl text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15 transition-all"
          />
        </div>
      </div>

      {/* Right Section: Quick Links & Profile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Setup Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSetupMenu(!showSetupMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer border border-transparent hover:border-orange-200/60"
            title="System Setup"
          >
            <Settings className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
            <span>Setup</span>
          </button>

          {showSetupMenu && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-white border border-orange-100 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95"
              onMouseLeave={() => setShowSetupMenu(false)}
            >
              <div className="px-3.5 py-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100">
                Setup Menu
              </div>
              <Link 
                href="/setup/ratelist" 
                onClick={() => setShowSetupMenu(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <Sliders className="w-4 h-4 text-orange-500" />
                <span>Ratelist & Tests</span>
              </Link>
              <Link 
                href="/setup/ratelist?tab=packages" 
                onClick={() => setShowSetupMenu(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Health Packages</span>
              </Link>
              {isAdminUser && (
                <>
                  <Link 
                    href="/admin?tab=casereg" 
                    onClick={() => setShowSetupMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Case reg. no.</span>
                  </Link>
                  <Link 
                    href="/admin?tab=panels" 
                    onClick={() => setShowSetupMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    <FlaskConical className="w-4 h-4 text-slate-400" />
                    <span>Panels & Categories</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* All Modules Button */}
        <a
          href={getMainPortalUrl(user?.hospitalId)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100/80 border border-orange-200/70 transition-colors cursor-pointer"
          title="Return to Main Hospital Portal (All Modules)"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Modules</span>
        </a>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
