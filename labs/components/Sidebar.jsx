'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Plus,
  Compass,
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
  Building,
  Receipt,
  TestTube
} from 'lucide-react';

export default function Sidebar({ mobileOpen, closeMobileSidebar }) {
  const pathname = usePathname();
  const router = useRouter();

  // Expanded state for accordion menus
  const [expandedMenus, setExpandedMenus] = useState({
    business: false,
    cases: false,
    lab: true, // Default open for lab submenus
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
      id: 'getting-started',
      label: 'Getting Started',
      icon: Compass,
      href: '/dashboard',
      isExpandable: false
    },
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
        { label: 'Overview', href: '/dashboard' },
        { label: 'Reports & Revenue', href: '/dashboard' }
      ]
    },
    {
      id: 'cases',
      label: 'Cases',
      icon: FolderOpen,
      isExpandable: true,
      subItems: [
        { label: 'All Cases', href: '/dashboard' },
        { label: 'Pending Samples', href: '/dashboard' }
      ]
    },
    {
      id: 'lab',
      label: 'Lab',
      icon: FlaskConical,
      isExpandable: true,
      subItems: [
        { label: 'Test Requests', href: '/dashboard' },
        { label: 'New Bill / Order', href: '/new-bill' },
        { label: 'Lab Admin Console', href: '/admin' }
      ]
    },
    {
      id: 'usg',
      label: 'USG',
      icon: Activity,
      isExpandable: true,
      subItems: [
        { label: 'USG Bookings', href: '/new-bill' },
        { label: 'USG Reports', href: '/dashboard' }
      ]
    },
    {
      id: 'xray',
      label: 'Digital X-ray',
      icon: Scan,
      isExpandable: true,
      subItems: [
        { label: 'X-ray Orders', href: '/new-bill' },
        { label: 'Completed Scans', href: '/dashboard' }
      ]
    },
    {
      id: 'manage',
      label: 'Manage',
      icon: Sliders,
      isExpandable: true,
      subItems: [
        { label: 'Test Catalog', href: '/admin' },
        { label: 'Referrers', href: '/new-bill' },
        { label: 'Collection Centres', href: '/new-bill' }
      ]
    }
  ];

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
          fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-[210px] bg-white border-r border-slate-200 
          flex flex-col shrink-0 transition-transform duration-200 ease-in-out overflow-y-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Top CTA: + New Bill Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              router.push('/new-bill');
              if (closeMobileSidebar) closeMobileSidebar();
            }}
            className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Bill</span>
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-2.5 py-1 space-y-0.5 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenus[item.id];
            const isActiveDirect = item.href && pathname === item.href && !item.isExpandable;

            if (!item.isExpandable) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm
                    ${isActiveDirect
                      ? 'bg-orange-50 text-orange-600 font-semibold'
                      : 'text-slate-700 hover:bg-orange-50/60 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActiveDirect ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            }

            // Accordion Item
            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-orange-50/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Submenu */}
                {isExpanded && item.subItems && (
                  <div className="pl-9 pr-2 py-0.5 space-y-0.5">
                    {item.subItems.map((sub, idx) => {
                      const isSubActive = pathname === sub.href && (item.id === 'lab' && sub.href === '/new-bill' ? pathname === '/new-bill' : false);

                      return (
                        <Link
                          key={idx}
                          href={sub.href}
                          onClick={closeMobileSidebar}
                          className={`
                            block px-2.5 py-1.5 rounded-md text-xs transition-colors
                            ${isSubActive
                              ? 'text-orange-600 font-semibold bg-orange-50/80'
                              : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/40'
                            }
                          `}
                        >
                          {sub.label}
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
        <div className="p-3 border-t border-slate-100 text-[11px] text-slate-400 font-normal">
          <div className="flex items-center justify-between">
            <span>Labs v1.2</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </aside>
    </>
  );
}
