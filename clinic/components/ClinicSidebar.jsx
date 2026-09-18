'use client';

import { useState } from 'react';
import {
  ClipboardList,
  Users,
  CalendarCheck,
  Stethoscope,
  Activity,
  CheckCircle,
  Printer,
  CreditCard,
  FileText,
  BadgeIndianRupee,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ClinicSidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('clinic_sidebar_pinned') === 'true';
    }
    return true;
  });
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isPinned || isHovered;

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('clinic_sidebar_pinned', String(next));
      }
      return next;
    });
  };

  const handleOptionClick = (tabKey) => {
    setActiveTab(tabKey);
    if (!isPinned) {
      setIsHovered(false);
    }
  };

  const sections = [
    {
      id: 'reception',
      title: 'Reception',
      items: [
        { id: 'reception-register', label: 'Register Patient', icon: ClipboardList },
        { id: 'reception-patients', label: 'Patient List', icon: Users },
        { id: 'reception-followups', label: 'Patient Follow-ups', icon: CalendarCheck },
      ],
    },
    {
      id: 'prescription',
      title: 'Prescription',
      items: [
        { id: 'doctor-dashboard', label: 'Doctor Dashboard', icon: Activity },
        { id: 'doctor-patients', label: 'All Patients', icon: Stethoscope },
        { id: 'doctor-completed', label: 'Completed Consultations', icon: CheckCircle },
        { id: 'doctor-edit-print-rx', label: 'Edit Print Rx', icon: Printer },
      ],
    },
    {
      id: 'billing',
      title: 'Billing Dashboard',
      items: [
        { id: 'billing-desk', label: 'Billing Desk', icon: CreditCard },
        { id: 'billing-registry', label: 'Invoice Registry', icon: FileText },
        { id: 'billing-due-recovery', label: 'Due Amount Recovery', icon: BadgeIndianRupee },
      ],
    },
  ];

  const getLinkClass = (isActive) => {
    if (!isExpanded) {
      return isActive
        ? 'flex items-center justify-center h-11 w-11 mx-auto rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/25 transition-all duration-200 cursor-pointer'
        : 'flex items-center justify-center h-11 w-11 mx-auto rounded-xl text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer';
    }

    return isActive
      ? 'flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all duration-200 cursor-pointer'
      : 'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer';
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white border-r border-orange-100 flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 shadow-xl md:shadow-none select-none shrink-0 ${
        isExpanded ? 'w-64' : 'w-[74px]'
      }`}
    >
      {/* Brand Header */}
      <div className={`p-4 border-b border-orange-100 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} h-[72px] shrink-0`}>
        {isExpanded ? (
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="Medora 360 Logo" className="h-9 w-9 object-contain shrink-0 rounded-full shadow-xs" />
            <div className="min-w-0">
              <h2 className="font-extrabold text-gray-900 text-sm leading-tight truncate">
                {user?.hospitalName || 'Clinic Portal'}
              </h2>
              <span className="text-[10px] text-orange-600 font-extrabold tracking-wider uppercase block truncate">
                CLINIC WORKSPACE
              </span>
            </div>
          </div>
        ) : (
          <img src="/logo.png" alt="Medora 360 Logo" className="h-8 w-8 object-contain shrink-0 rounded-full shadow-xs" title={user?.hospitalName || 'Clinic'} />
        )}

        <button
          type="button"
          onClick={togglePin}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer ${!isExpanded ? 'hidden' : ''}`}
          title={isPinned ? 'Unpin Sidebar (Auto-collapse)' : 'Pin Sidebar (Keep expanded)'}
        >
          {isPinned ? <PanelLeftClose className="h-4.5 w-4.5 text-orange-600" /> : <PanelLeftOpen className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            {isExpanded ? (
              <span className="px-3.5 text-[11px] font-black text-orange-400 uppercase tracking-widest block mb-1.5">
                {section.title}
              </span>
            ) : (
              <div className="my-2 border-t border-orange-100/60" />
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOptionClick(item.id)}
                    title={item.label}
                    className={`w-full text-left ${getLinkClass(isActive)}`}
                  >
                    <IconComponent className="h-4.5 w-4.5 shrink-0" />
                    {isExpanded && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer Profile & Sign Out */}
      <div className="p-3 border-t border-orange-100 bg-orange-50/20 shrink-0">
        {isExpanded ? (
          <div className="flex items-center justify-between px-2 py-1">
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.username}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.doctorName || 'Clinic Doctor'}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center h-10 w-10 mx-auto text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
