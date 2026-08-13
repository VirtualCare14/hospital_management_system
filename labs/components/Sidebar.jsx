'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  LayoutDashboard,
  Briefcase,
  FolderOpen,
  FlaskConical,
  Activity,
  Scan,
  Sliders,
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Receipt,
  CalendarDays,
  Wallet,
  Bell,
  UserCheck,
  ClipboardList,
  TrendingUp,
  Download,
  Globe,
  ArrowLeftRight,
  Syringe,
  Search,
  Package,
  Layers,
  Grid,
  Database,
  AlignLeft,
  Building
} from 'lucide-react';

export default function Sidebar({ mobileOpen, closeMobileSidebar }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdminUser = user?.role === 'admin' || user?.role === 'lab_admin' || user?.role === 'superadmin';

  const currentView = searchParams.get('view');

  // Currently hovered menu id
  const [hoveredMenu, setHoveredMenu] = useState(null);

  // Manual click override expanded state
  const [expandedMenus, setExpandedMenus] = useState({
    business: false,
    cases: false,
    lab: false,
    usg: false,
    xray: false,
    manage: false
  });

  const toggleExpand = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
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
      icon: Briefcase,
      isExpandable: true,
      subItems: [
        { label: 'Daily business', icon: CalendarDays, href: '/dashboard' },
        { label: 'Expenses', icon: Wallet, href: '/dashboard' },
        { label: 'Due reports', icon: FileText, href: '/dashboard?view=due-reports' },
        { label: 'Activities', icon: Bell, href: '/dashboard' },
        { label: 'Referral business', icon: UserCheck, href: '/dashboard' },
        { label: 'Case wise report', icon: ClipboardList, href: '/dashboard' },
        { label: 'Business analysis', icon: TrendingUp, href: '/dashboard' },
        { label: 'Data export', icon: Download, href: '/dashboard' }
      ]
    },
    {
      id: 'cases',
      label: 'Cases',
      icon: FolderOpen,
      isExpandable: true,
      subItems: [
        { label: 'Bills', icon: Receipt, href: '/dashboard' },
        { label: 'Outsource cases', icon: Globe, href: '/dashboard' },
        { label: 'Ct scan cases', icon: Scan, href: '/dashboard' },
        { label: 'Patients', icon: Users, href: '/dashboard' },
        { label: 'Transactions', icon: ArrowLeftRight, href: '/dashboard' },
        { label: 'Referral Doctors', icon: UserCheck, href: '/dashboard' },
        { label: 'Agents', icon: Syringe, href: '/dashboard' }
      ]
    },
    {
      id: 'lab',
      label: 'Lab',
      icon: FlaskConical,
      isExpandable: true,
      subItems: [
        { label: "Today's reports", icon: FileText, href: '/dashboard' },
        { label: 'Search reports', icon: Search, href: '/dashboard' },
        { label: 'Test packages', icon: Package, href: '/admin' },
        { label: 'Test panels', icon: Layers, href: '/admin' },
        { label: 'Test categories', icon: Grid, href: '/admin' },
        { label: 'Test database', icon: Database, href: '/admin' },
        { label: 'Interpretations', icon: AlignLeft, href: '/admin' },
        { label: 'Test counts', icon: FlaskConical, href: '/dashboard' }
      ]
    },
    {
      id: 'usg',
      label: 'USG',
      icon: Activity,
      isExpandable: true,
      subItems: [
        { label: 'USG Bookings', icon: CalendarDays, href: '/new-bill' },
        { label: 'USG Reports', icon: FileText, href: '/dashboard' }
      ]
    },
    {
      id: 'xray',
      label: 'Digital X-ray',
      icon: Scan,
      isExpandable: true,
      subItems: [
        { label: 'X-ray Orders', icon: CalendarDays, href: '/new-bill' },
        { label: 'Completed Scans', icon: FileText, href: '/dashboard' }
      ]
    },
    {
      id: 'manage',
      label: 'Manage',
      icon: Sliders,
      isExpandable: true,
      subItems: [
        { label: 'Test Catalog', icon: Grid, href: '/admin' },
        { label: 'Referrers', icon: UserCheck, href: '/new-bill' },
        { label: 'Collection Centres', icon: Building, href: '/new-bill' }
      ]
    }
  ];

  // Helper: check if a menu contains the currently active subitem
  const hasActiveSubItem = (item) => {
    if (!item.subItems) return false;
    return item.subItems.some(sub => {
      const isDueReportsActive = sub.href.includes('view=due-reports') && currentView === 'due-reports';
      const isSubActive = isDueReportsActive || (pathname === sub.href && !currentView && (
        item.id === 'lab' && sub.href === '/new-bill' ? pathname === '/new-bill' : false
      ));
      return isSubActive;
    });
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
            const containsActive = hasActiveSubItem(item);
            const isHovered = hoveredMenu === item.id;
            
            // Expand rule:
            // 1. Hovered menu opens on hover (and closes on mouse out)
            // 2. If no menu is hovered (hoveredMenu === null), the menu holding the selected active subitem stays open!
            const isExpanded = isHovered || (hoveredMenu === null && containsActive) || (hoveredMenu === null && expandedMenus[item.id]);
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
                    containsActive && hoveredMenu === null
                      ? 'text-orange-600 bg-orange-50/60 font-bold'
                      : 'text-slate-800 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${containsActive && hoveredMenu === null ? 'text-orange-500' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Submenu */}
                {isExpanded && item.subItems && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-150 ml-5 my-0.5">
                    {item.subItems
                      .filter(sub => isAdminUser || sub.href !== '/admin')
                      .map((sub, idx) => {
                        const SubIcon = sub.icon;
                        const isDueReportsActive = sub.href.includes('view=due-reports') && currentView === 'due-reports';
                        const isSubActive = isDueReportsActive || (pathname === sub.href && !currentView && (
                          item.id === 'lab' && sub.href === '/new-bill' ? pathname === '/new-bill' : false
                        ));

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
