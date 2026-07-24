import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FolderHeart,
  ClipboardList,
  FlaskConical,
  Activity,
  MapPin,
  History,
  FileText,
  Settings,
  BadgeIndianRupee,
  HeartPulse,
  CheckCircle,
  Bed,
  Package,
  Pill,
  Syringe,
  Scissors,
  CalendarDays,
  Bandage,
  Upload,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  Plus,
  Percent,
  Truck,
  Droplets,
  Clock,
  DoorOpen,
  Trash2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  CalendarCheck,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

const Sidebar = () => {
  const { user, hasAccess } = useAuth();
  const location = useLocation();
  const currentLabSection = new URLSearchParams(location.search).get('section') || 'dashboard';
  const currentPharmacySection = new URLSearchParams(location.search).get('section') || 'dashboard';
  
  const [billingExpanded, setBillingExpanded] = useState(
    currentPharmacySection === 'new-bill' || currentPharmacySection === 'walk-in-billing'
  );

  // Dynamic Sidebar State (Pinned / Hover / Auto-collapse)
  const [isPinned, setIsPinned] = useState(() => {
    return localStorage.getItem('sidebar_pinned') === 'true';
  });
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isPinned || isHovered;

  const togglePin = () => {
    setIsPinned(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_pinned', String(next));
      return next;
    });
  };

  const handleOptionClick = () => {
    if (!isPinned) {
      setIsHovered(false);
    }
  };

  if (!user) return null;

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Management', icon: UserPlus },
    { to: '/admin/departments', label: 'Manage Depts', icon: FolderHeart },
    { to: '/admin/hospital-settings', label: 'Hospital Settings', icon: Settings },
    { to: '/admin/room-settings', label: 'IPD Administration', icon: Bed },
    { to: '/admin/consumable-services', label: 'Consumable Services', icon: Package },
    { to: '/admin/ot-settings', label: 'OT Settings', icon: Scissors },
    { to: '/admin/same-day-care', label: 'Same Day Care Settings', icon: Bandage },
    { to: '/admin/pharmacy-settings', label: 'Pharmacy Settings', icon: Settings },
    { to: '/admin/delete-data', label: 'Delete Data', icon: Trash2 },
  ];

  const receptionLinks = [
    { to: '/reception/register', label: 'Register Patient', icon: ClipboardList },
    { to: '/reception/patients', label: 'Patient List', icon: Users },
    { to: '/reception/follow-ups', label: 'Patient Follow-Ups Tracking', icon: CalendarCheck },
  ];

  const doctorLinks = [
    { to: '/doctor', label: 'Doctor Dashboard', icon: Activity },
    { to: '/doctor/patients', label: 'All Patients', icon: Users },
    { to: '/doctor/ipd-patients', label: 'IPD Patients', icon: Bed },
    { to: '/doctor/ot-patients', label: 'OT Patients', icon: Scissors },
    { to: '/doctor/completed', label: 'Completed Consultations', icon: CheckCircle },
    { to: '/doctor/discharge-requests', label: 'Discharge Requests', icon: DoorOpen },
  ];

  const labLinks = [
    { to: '/lab?section=dashboard', section: 'dashboard', label: 'Dashboard', icon: Activity },
    { to: '/lab?section=tracking', section: 'tracking', label: 'Patient Tracking', icon: MapPin },
    { to: '/lab?section=history', section: 'history', label: 'Patient History', icon: History },
    { to: '/lab?section=reports', section: 'reports', label: 'Reports', icon: FileText },
    { to: '/lab?section=settings', section: 'settings', label: 'Lab Settings', icon: Settings },
    { to: '/lab?section=billing', section: 'billing', label: 'Billing', icon: BadgeIndianRupee },
  ];

  const pharmacyLinks = [
    { to: '/pharmacy?section=dashboard', section: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pharmacy?section=opd-prescriptions', section: 'opd-prescriptions', label: 'OPD Prescriptions', icon: ClipboardList },
    { section: 'billing-group', label: 'Billing', icon: BadgeIndianRupee },
    { to: '/pharmacy?section=sales-history', section: 'sales-history', label: 'Sales History', icon: FileText },
    { to: '/pharmacy?section=sales-return', section: 'sales-return', label: 'Sales Return', icon: RotateCcw },
    { to: '/pharmacy?section=requests', section: 'requests', label: 'IPD Patient Requests', icon: Activity },
    { to: '/pharmacy?section=inventory', section: 'inventory', label: 'Inventory', icon: Package },
    { to: '/pharmacy?section=excel-upload', section: 'excel-upload', label: 'Excel Upload', icon: Upload },
    { to: '/pharmacy?section=supplier-management', section: 'supplier-management', label: 'Suppliers', icon: Truck },
    { to: '/pharmacy?section=purchase-entry', section: 'purchase-entry', label: 'Purchase Entry (GRN)', icon: Plus },
    { to: '/pharmacy?section=purchase-history', section: 'purchase-history', label: 'Purchase History', icon: History },
    { to: '/pharmacy?section=billing-reports', section: 'billing-reports', label: 'Reports', icon: BarChart3 },
    { to: '/pharmacy?section=gst-reports', section: 'gst-reports', label: 'GST Reports', icon: Percent },
    { to: '/pharmacy?section=expiry', section: 'expiry', label: 'Expiry Medicines', icon: CalendarDays },
    { to: '/pharmacy?section=out-of-stock', section: 'out-of-stock', label: 'Out of Stock', icon: AlertTriangle },
    { to: '/pharmacy?section=billing-settings', section: 'billing-settings', label: 'Pharmacy Settings', icon: Settings },
  ];

  const getLinkClass = (isActive, isSub = false) => {
    if (!isExpanded) {
      return isActive
        ? "flex items-center justify-center h-11 w-11 mx-auto rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/25 transition-all duration-200 cursor-pointer"
        : "flex items-center justify-center h-11 w-11 mx-auto rounded-xl text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer";
    }

    if (isSub) {
      return isActive
        ? "flex items-center gap-3 rounded-xl bg-orange-100 px-3.5 py-2.5 text-xs md:text-sm font-semibold text-orange-700 transition-all duration-200 ml-4 cursor-pointer"
        : "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 ml-4 cursor-pointer";
    }

    return isActive
      ? "flex items-center gap-3 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all duration-200 cursor-pointer"
      : "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 cursor-pointer";
  };

  const renderSectionHeader = (title) => {
    if (isExpanded) {
      return (
        <span className="px-3.5 text-[11px] font-bold text-orange-400 uppercase tracking-widest block mb-2 mt-4">
          {title}
        </span>
      );
    }
    return <div className="my-3 border-t border-orange-100/60" />;
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white border-r border-orange-100 flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 shadow-xl md:shadow-none select-none ${
        isExpanded ? 'w-64' : 'w-[76px]'
      }`}
    >
      {/* Brand Header & Toggle Pin Button */}
      <div className={`p-4 border-b border-orange-100 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} h-[72px] shrink-0`}>
        {isExpanded ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-orange-500 text-white p-2 rounded-xl shrink-0 shadow-sm">
              <HeartPulse className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-800 text-sm leading-tight truncate">{user.hospitalName || 'Hospital'}</h2>
              <span className="text-[10px] text-orange-500 font-bold tracking-wider uppercase block truncate">EMR PORTAL</span>
            </div>
          </div>
        ) : (
          <div className="bg-orange-500 text-white p-2 rounded-xl shrink-0 shadow-sm" title={user.hospitalName || 'Hospital'}>
            <HeartPulse className="h-5 w-5 animate-pulse" />
          </div>
        )}

        <button
          type="button"
          onClick={togglePin}
          className={`p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer ${!isExpanded ? 'hidden' : ''}`}
          title={isPinned ? "Unpin Sidebar (Auto-collapse on mouse leave)" : "Pin Sidebar (Keep expanded)"}
        >
          {isPinned ? <PanelLeftClose className="h-5 w-5 text-orange-600" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <NavLink
          to="/"
          onClick={handleOptionClick}
          title="Module Home"
          className={({ isActive }) => getLinkClass(isActive)}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {isExpanded && <span className="truncate">Module Home</span>}
        </NavLink>

        {/* Admin Links - only for admin role */}
        {user.role === 'admin' && (
          <div>
            {renderSectionHeader('Administration')}
            <div className="space-y-1">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/admin'}
                  onClick={handleOptionClick}
                  title={link.label}
                  className={({ isActive }) => getLinkClass(isActive)}
                >
                  <link.icon className="h-5 w-5 shrink-0" />
                  {isExpanded && <span className="truncate">{link.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Reception Links (Module 1) */}
        {hasAccess([1]) && (
          <div>
            {renderSectionHeader('Patient Services')}
            <div className="space-y-1">
              {receptionLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/reception/register'}
                  onClick={handleOptionClick}
                  title={link.label}
                  className={({ isActive }) => getLinkClass(isActive)}
                >
                  <link.icon className="h-5 w-5 shrink-0" />
                  {isExpanded && <span className="truncate">{link.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Links (Module 2 & 3) */}
        {hasAccess([2]) && (
          <div>
            {renderSectionHeader('Clinical Portal')}
            <div className="space-y-1">
              {doctorLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/doctor'}
                  onClick={handleOptionClick}
                  title={link.label}
                  className={({ isActive }) => getLinkClass(isActive)}
                >
                  <link.icon className="h-5 w-5 shrink-0" />
                  {isExpanded && <span className="truncate">{link.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Lab Links (Module 4) */}
        {hasAccess([4]) && (
          <div>
            {renderSectionHeader('Diagnostics')}
            <NavLink
              to="/lab"
              onClick={handleOptionClick}
              title="Lab Module"
              className={({ isActive }) => getLinkClass(isActive)}
            >
              <FlaskConical className="h-5 w-5 shrink-0" />
              {isExpanded && <span className="truncate">Lab Module</span>}
            </NavLink>
            <div className="mt-1 space-y-1">
              {labLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={handleOptionClick}
                  title={link.label}
                  className={() => getLinkClass(currentLabSection === link.section, true)}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  {isExpanded && <span className="truncate">{link.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* IPD Links (Module 5) */}
        {hasAccess([5]) && (
          <div>
            {renderSectionHeader('Inpatient Services')}
            <div className="space-y-1">
              <NavLink
                to="/ipd/admission"
                onClick={handleOptionClick}
                title="IPD Admission"
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <Bed className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">IPD Admission</span>}
              </NavLink>
              <NavLink
                to="/ipd/patients"
                onClick={handleOptionClick}
                title="Patient List"
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <Users className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">Patient List</span>}
              </NavLink>
              <NavLink
                to="/ipd/services"
                onClick={handleOptionClick}
                title="Services"
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <Syringe className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">Services</span>}
              </NavLink>
              <NavLink
                to="/ipd/ot-management"
                onClick={handleOptionClick}
                title="OT Management"
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <CalendarDays className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">OT Management</span>}
              </NavLink>
              <NavLink
                to="/ipd/same-day"
                onClick={handleOptionClick}
                title="IPD Same Day"
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <Activity className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">IPD Same Day</span>}
              </NavLink>
              <NavLink
                to="/ipd/discharged-patients"
                onClick={handleOptionClick}
                title="Discharged Patients"
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <DoorOpen className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">Discharged Patients</span>}
              </NavLink>
            </div>
          </div>
        )}

        {/* Same Day Care Links (Module 6) */}
        {hasAccess([6]) && (
          <div>
            {renderSectionHeader('Day Care')}
            <div className="space-y-1">
              <NavLink
                to="/same-day-care?tab=all"
                onClick={handleOptionClick}
                title="All Patients (Lookup)"
                className={() => getLinkClass(window.location.search.includes('tab=all') || (location.pathname === '/same-day-care' && !window.location.search.includes('tab=')))}
              >
                <Users className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">All Patients (Lookup)</span>}
              </NavLink>
              <NavLink
                to="/same-day-care?tab=pending"
                onClick={handleOptionClick}
                title="Treatment Pending"
                className={() => getLinkClass(window.location.search.includes('tab=pending'))}
              >
                <Clock className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">Treatment Pending</span>}
              </NavLink>
              <NavLink
                to="/same-day-care?tab=completed"
                onClick={handleOptionClick}
                title="Treatment Completed"
                className={() => getLinkClass(window.location.search.includes('tab=completed'))}
              >
                <CheckCircle className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">Treatment Completed</span>}
              </NavLink>
              <NavLink
                to="/same-day-care/dialysis"
                onClick={handleOptionClick}
                title="Dialysis Management"
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <Droplets className="h-5 w-5 shrink-0 text-sky-500" />
                {isExpanded && <span className="truncate">Dialysis Management</span>}
              </NavLink>
              <NavLink
                to="/same-day-care/discharge-requests"
                onClick={handleOptionClick}
                title="Discharge Requests"
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <DoorOpen className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">Discharge Requests</span>}
              </NavLink>
              <NavLink
                to="/same-day-care/billing"
                onClick={handleOptionClick}
                title="Same day billing"
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <BadgeIndianRupee className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">Same day billing</span>}
              </NavLink>
            </div>
          </div>
        )}

        {/* Pharmacy Links (Module 7) */}
        {hasAccess([7]) && (
          <div>
            {renderSectionHeader('Pharmacy')}
            <NavLink
              to="/pharmacy"
              onClick={handleOptionClick}
              title="Pharmacy Workspace"
              className={({ isActive }) => getLinkClass(isActive)}
            >
              <Pill className="h-5 w-5 shrink-0" />
              {isExpanded && <span className="truncate">Pharmacy Workspace</span>}
            </NavLink>
            <div className="mt-1 space-y-1">
              {pharmacyLinks.map((link) => {
                if (link.section === 'billing-group') {
                  const isChildActive = currentPharmacySection === 'new-bill' || currentPharmacySection === 'walk-in-billing';
                  return (
                    <div key="billing-group" className="space-y-1">
                      {isExpanded ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setBillingExpanded(!billingExpanded)}
                            className={`w-full text-left cursor-pointer flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 ${
                              isChildActive
                                ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500 pl-3'
                                : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                            }`}
                          >
                            <span className="flex items-center gap-3 min-w-0">
                              <link.icon className="h-5 w-5 shrink-0" />
                              <span className="truncate">{link.label}</span>
                            </span>
                            <span>
                              {billingExpanded ? (
                                <ChevronDown className="h-4 w-4 text-orange-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                            </span>
                          </button>

                          {billingExpanded && (
                            <div className="ml-4 pl-3 border-l border-orange-200 space-y-1 mt-1">
                              <NavLink
                                to="/pharmacy?section=new-bill"
                                onClick={handleOptionClick}
                                title="OPD Bill"
                                className={() =>
                                  currentPharmacySection === 'new-bill'
                                    ? "flex items-center gap-2.5 rounded-lg py-1.5 px-3 text-xs font-bold text-orange-600 bg-orange-50 transition-all duration-200 cursor-pointer"
                                    : "flex items-center gap-2.5 rounded-lg py-1.5 px-3 text-xs text-gray-500 hover:text-orange-600 transition-all duration-200 cursor-pointer"
                                }
                              >
                                <BadgeIndianRupee className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">OPD Bill</span>
                              </NavLink>
                              <NavLink
                                to="/pharmacy?section=walk-in-billing"
                                onClick={handleOptionClick}
                                title="Walk-in Bill"
                                className={() =>
                                  currentPharmacySection === 'walk-in-billing'
                                    ? "flex items-center gap-2.5 rounded-lg py-1.5 px-3 text-xs font-bold text-orange-600 bg-orange-50 transition-all duration-200 cursor-pointer"
                                    : "flex items-center gap-2.5 rounded-lg py-1.5 px-3 text-xs text-gray-500 hover:text-orange-600 transition-all duration-200 cursor-pointer"
                                }
                              >
                                <Plus className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">Walk-in Bill</span>
                              </NavLink>
                            </div>
                          )}
                        </>
                      ) : (
                        <NavLink
                          to="/pharmacy?section=new-bill"
                          onClick={handleOptionClick}
                          title="Pharmacy Billing"
                          className={() => getLinkClass(isChildActive)}
                        >
                          <BadgeIndianRupee className="h-5 w-5 shrink-0" />
                        </NavLink>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={handleOptionClick}
                    title={link.label}
                    className={() => getLinkClass(currentPharmacySection === link.section, true)}
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    {isExpanded && <span className="truncate">{link.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Billing Links (Module 8) */}
        {hasAccess([8]) && (
          <div>
            {renderSectionHeader('Billing Desk')}
            <NavLink
              to="/module/8?tab=billing"
              onClick={handleOptionClick}
              title="OPD/IPD Billing Desk"
              className={({ isActive }) => getLinkClass(isActive && window.location.search.includes('tab=billing'))}
            >
              <CreditCard className="h-5 w-5 shrink-0" />
              {isExpanded && <span className="truncate">OPD/IPD Billing Desk</span>}
            </NavLink>
            <div className="mt-1 space-y-1">
              <NavLink
                to="/module/8?tab=registry"
                onClick={handleOptionClick}
                title="Invoice Registry"
                className={() => getLinkClass(window.location.search.includes('tab=registry'), true)}
              >
                <FileText className="h-4 w-4 shrink-0" />
                {isExpanded && <span className="truncate">Invoice Registry</span>}
              </NavLink>
              <NavLink
                to="/module/8?tab=dashboard"
                onClick={handleOptionClick}
                title="Billing Dashboard"
                className={() => getLinkClass(window.location.search.includes('tab=dashboard'), true)}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                {isExpanded && <span className="truncate">Billing Dashboard</span>}
              </NavLink>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
