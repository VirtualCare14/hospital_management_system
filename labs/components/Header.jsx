'use client';

import { useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  HelpCircle, 
  Settings, 
  PlayCircle, 
  Bell, 
  Menu, 
  X 
} from 'lucide-react';
import Link from 'next/link';
import ProfileDropdown from './ProfileDropdown';

export default function Header({ toggleMobileSidebar }) {
  const [searchVal, setSearchVal] = useState('');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left section: Logo & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
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
            <span className="text-[10px] text-orange-600 font-semibold tracking-wide">
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
            placeholder="Search any bills, reports"
            className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15 transition-all"
          />
        </div>
      </div>

      {/* Right Section: Quick Links & Profile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Help */}
        <button
          type="button"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
          title="Help & Support"
        >
          <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
          <span>Help</span>
        </button>

        {/* Setup */}
        <button
          type="button"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
          title="System Setup"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Setup</span>
        </button>

        {/* Watch Video */}
        <button
          type="button"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer border border-orange-200/60"
          title="Watch Tutorial Video"
        >
          <PlayCircle className="w-4 h-4 text-orange-500" />
          <span>Watch Video</span>
        </button>

        {/* Notification Icon */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
