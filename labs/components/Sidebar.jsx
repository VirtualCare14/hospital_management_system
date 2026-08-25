'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  LayoutDashboard,
  TrendingUp,
  FolderKanban,
  FlaskConical,
  Activity,
  Scan,
  Sliders,
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Receipt,
  CalendarCheck,
  Wallet,
  History,
  Stethoscope,
  Building2,
  CheckSquare,
  Globe,
  ArrowLeftRight,
  Search,
  Package,
  Layers,
  LayoutGrid,
  Database,
  BarChart3,
  PenTool,
  CalendarPlus,
  FileCheck2
} from 'lucide-react';

export default function Sidebar({ mobileOpen, closeMobileSidebar }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdminUser = user?.role === 'admin' || user?.role === 'lab_admin' || user?.role === 'labadmin' || user?.role === 'superadmin';

  const currentView = searchParams.get('view');

  // Currently hovered menu id
  const [hoveredMenu, setHoveredMenu] = useState(null);

  // Manual click override expanded state - empty initially, defaults computed dynamically
  const [expandedMenus, setExpandedMenus] = useState({});
 
  // Reset overrides when pathname changes (render-time derived state update)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setExpandedMenus({});
  }

  const toggleExpand = (menuKey) => {
    setExpandedMenus(prev => {
      const item = navItems.find(i => i.id === menuKey);
      const isDefaultOpen = item ? (hasActiveSubItem(item) || hoveredMenu === menuKey) : false;
      const currentVal = prev[menuKey] !== undefined ? prev[menuKey] : isDefaultOpen;
      return {
        ...prev,
        [menuKey]: !currentVal
      };
    });
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      isExpandable: false
    },
    {
      id: 'business',
      label: 'Business',
      icon: TrendingUp,
      isExpandable: true,
      subItems: [
        { label: 'Daily business', icon: CalendarCheck, href: '/dashboard?view=daily-business' },
        { label: 'Expenses', icon: Wallet, href: '/dashboard?view=expenses' },
        { label: 'Due reports', icon: Receipt, href: '/dashboard?view=due-reports' },
        { label: 'Activities', icon: History, href: '/dashboard?view=activities' }
      ]
    },
    {
      id: 'cases',
      label: 'Cases',
      icon: FolderKanban,
      isExpandable: true,
      subItems: [
        { label: 'Bills', icon: Receipt, href: '/dashboard?view=bills' },
        { label: 'Outsource cases', icon: Globe, href: '/dashboard?view=outsource-cases' },
        { label: 'Ct scan cases', icon: Scan, href: '/dashboard?view=ct-scan-cases' },
        { label: 'Patients', icon: Users, href: '/dashboard?view=patients' },
        { label: 'Transactions', icon: ArrowLeftRight, href: '/dashboard?view=transactions' },
        { label: 'Referral Doctors', icon: Stethoscope, href: '/dashboard?view=referral-doctors' },
        { label: 'Collection Centres', icon: Building2, href: '/dashboard?view=collection-centres' }
      ]
    },
    {
      id: 'lab',
      label: 'Lab',
      icon: FlaskConical,
      isExpandable: true,
      subItems: [
        { label: "Today's reports", icon: FileCheck2, href: '/dashboard?view=todays-reports' },
        { label: 'Search reports', icon: Search, href: '/dashboard?view=search-reports' },
        { label: 'Test packages', icon: Package, href: '/admin' },
        { label: 'Test panels', icon: Layers, href: '/admin' },
        { label: 'Test categories', icon: LayoutGrid, href: '/admin' },
        { label: 'Test database', icon: Database, href: '/admin' },
        { label: 'Interpretations', icon: FileText, href: '/admin' },
        { label: 'Test counts', icon: BarChart3, href: '/dashboard?view=test-counts' },
        { label: 'Add signature', icon: PenTool, href: '/dashboard?view=signatories' },
        { label: 'Panels', icon: Sliders, href: '/setup/ratelist' },
        { label: 'Proofread', icon: CheckSquare, href: '/setup/ratelist' }
      ]
    },
    {
      id: 'usg',
      label: 'USG',
      icon: Activity,
      isExpandable: true,
      subItems: [
        { label: 'USG Bookings', icon: CalendarPlus, href: '/new-bill?service=USG' },
        { label: 'USG Reports', icon: FileText, href: '/dashboard?view=usg-reports' }
      ]
    },
    {
      id: 'xray',
      label: 'Digital X-ray',
      icon: Scan,
      isExpandable: true,
      subItems: [
        { label: 'X-ray Orders', icon: CalendarPlus, href: '/new-bill?service=X-RAY' },
        { label: 'Completed Scans', icon: FileCheck2, href: '/dashboard?view=xray-scans' }
      ]
    }
  ];

  // Helper: check if a specific subitem is currently active
  const checkSubActive = (sub) => {
    if (!sub || !sub.href) return false;
    
    if (sub.href.includes('?')) {
      const [subPath, subQueryStr] = sub.href.split('?');
      const subParams = new URLSearchParams(subQueryStr);
      const subView = subParams.get('view');
      const subService = subParams.get('service');
      const subManage = subParams.get('manage');
      
      if (subView) {
        return pathname === subPath && currentView === subView;
      }
      if (subService) {
        return pathname === subPath && searchParams.get('service') === subService;
      }
      if (subManage) {
        return pathname === subPath && searchParams.get('manage') === subManage;
      }
      return pathname === subPath && searchParams.toString() === subParams.toString();
    }
    
    // For non-query paths like /admin or /new-bill
    if (sub.href !== '/dashboard') {
      return pathname === sub.href && !currentView && !searchParams.toString();
    }
    return false;
  };

  // Helper: check if a menu contains the currently active subitem
  const hasActiveSubItem = (item) => {
    if (!item.subItems) return false;
    return item.subItems.some(sub => checkSubActive(sub));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-[235px] bg-white border-r border-slate-200 
          flex flex-col shrink-0 transition-all duration-200 ease-in-out overflow-y-auto shadow-xs
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Top CTA: + New Bill Button */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => {
              router.push('/new-bill');
              if (closeMobileSidebar) closeMobileSidebar();
            }}
            className="w-full h-11 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Bill</span>
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-1 space-y-1 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const visibleSubItems = (item.subItems || []).filter(sub => isAdminUser || (!sub.href || !sub.href.startsWith('/admin')));
            if (item.isExpandable && visibleSubItems.length === 0) return null;

            const containsActive = visibleSubItems.some(sub => checkSubActive(sub));
            // Expands if it contains the active subitem, hovered, default open lab, or user has manually toggled it
            const isHovered = hoveredMenu === item.id;
            const isDefaultOpen = containsActive;
            const isExpanded = isHovered || (expandedMenus[item.id] !== undefined ? expandedMenus[item.id] : isDefaultOpen);
            const isActiveDirect = item.href && pathname === item.href && !currentView && !item.isExpandable;

            if (!item.isExpandable) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={`
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-semibold
                    ${isActiveDirect
                      ? 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-500 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActiveDirect ? 'text-orange-500' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            }

            // Accordion Item
            return (
              <div 
                key={item.id} 
                className="space-y-0.5 group"
                onMouseEnter={() => setHoveredMenu(item.id)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors cursor-pointer ${
                    containsActive
                      ? 'text-orange-600 bg-orange-50/60 font-bold'
                      : 'text-slate-800 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${containsActive ? 'text-orange-500' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Submenu */}
                {isExpanded && visibleSubItems.length > 0 && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-150 ml-5 my-0.5">
                    {visibleSubItems.map((sub, idx) => {
                      const SubIcon = sub.icon;
                      const isSubActive = checkSubActive(sub);

                      return (
                        <Link
                          key={idx}
                          href={sub.href}
                          onClick={closeMobileSidebar}
                          className={`
                            flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
                            ${isSubActive
                              ? 'text-orange-600 font-bold bg-orange-50/90 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }
                          `}
                        >
                          {SubIcon && <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-orange-500' : 'text-slate-400'}`} />}
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer info badge */}
        <div className="p-3.5 border-t border-slate-100 text-xs text-slate-400 font-medium">
          <div className="flex items-center justify-between">
            <span>Labs v1.2</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </aside>
    </>
  );
}
