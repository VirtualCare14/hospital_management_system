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
  Truck
} from 'lucide-react';

const Sidebar = () => {
  const { user, hasAccess } = useAuth();
  const location = useLocation();
  const currentLabSection = new URLSearchParams(location.search).get('section') || 'dashboard';
  const currentPharmacySection = new URLSearchParams(location.search).get('section') || 'dashboard';

  if (!user) return null;

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Management', icon: UserPlus },
    { to: '/admin/departments', label: 'Manage Depts', icon: FolderHeart },
    { to: '/admin/hospital-settings', label: 'Hospital Settings', icon: Settings },
    { to: '/admin/room-settings', label: 'IPD Administration', icon: Bed },
    { to: '/admin/consumable-services', label: 'Consumable Services', icon: Package },
    { to: '/admin/medicine-settings', label: 'Medicine Settings', icon: Pill },
    { to: '/admin/ot-settings', label: 'OT Settings', icon: Scissors },
  ];

  const receptionLinks = [
    { to: '/reception/register', label: 'Register Patient', icon: ClipboardList },
    { to: '/reception/patients', label: 'Patient List', icon: Users },
  ];

  const doctorLinks = [
    { to: '/doctor', label: 'Doctor Dashboard', icon: Activity },
    { to: '/doctor/patients', label: 'All Patients', icon: Users },
    { to: '/doctor/completed', label: 'Completed Consultations', icon: CheckCircle },
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
    { to: '/pharmacy?section=new-bill', section: 'new-bill', label: 'New Bill', icon: BadgeIndianRupee },
    { to: '/pharmacy?section=walk-in-billing', section: 'walk-in-billing', label: 'Walk-in Billing', icon: Plus },
    { to: '/pharmacy?section=sales-history', section: 'sales-history', label: 'Sales History', icon: FileText },
    { to: '/pharmacy?section=sales-return', section: 'sales-return', label: 'Sales Return', icon: RotateCcw },
    { to: '/pharmacy?section=requests', section: 'requests', label: 'Doctor Requests', icon: Activity },
    { to: '/pharmacy?section=inventory', section: 'inventory', label: 'Inventory', icon: Package },
    { to: '/pharmacy?section=excel-upload', section: 'excel-upload', label: 'Excel Upload / Purchase', icon: Upload },
    { to: '/pharmacy?section=supplier-management', section: 'supplier-management', label: 'Suppliers', icon: Truck },
    { to: '/pharmacy?section=billing-reports', section: 'billing-reports', label: 'Reports', icon: BarChart3 },
    { to: '/pharmacy?section=gst-reports', section: 'gst-reports', label: 'GST Reports', icon: Percent },
    { to: '/pharmacy?section=expiry', section: 'expiry', label: 'Expiry Medicines', icon: CalendarDays },
    { to: '/pharmacy?section=out-of-stock', section: 'out-of-stock', label: 'Out of Stock', icon: AlertTriangle },
    { to: '/pharmacy?section=billing-settings', section: 'billing-settings', label: 'Settings', icon: Settings },
  ];

  const activeStyle = "flex items-center gap-3 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all duration-300";
  const inactiveStyle = "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300";
  const activeSubStyle = "flex items-center gap-3 rounded-xl bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700 transition-all duration-300 ml-5";
  const inactiveSubStyle = "flex items-center gap-3 rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-300 ml-5";

  return (
    <aside className="w-64 bg-white border-r border-orange-100 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-orange-100 flex items-center gap-3">
        <div className="bg-orange-500 text-white p-2 rounded-xl">
          <HeartPulse className="h-6 w-6 animate-pulse" />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 text-lg leading-tight">{user.hospitalName || 'Hospital'}</h2>
          <span className="text-xs text-orange-500 font-semibold tracking-wider uppercase">EMR PORTAL</span>
        </div>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NavLink to="/" className={inactiveStyle}>
          <LayoutDashboard className="h-5 w-5" />
          Module Home
        </NavLink>
        {/* Admin Links - only for admin role */}
        {user.role === 'admin' && (
          <div>
            <span className="px-4 text-xs font-bold text-orange-400 uppercase tracking-widest block mb-2">Administration</span>
            <div className="space-y-1">
              {adminLinks.map((link) => (
                <NavLink 
                  key={link.to} 
                  to={link.to} 
                  end={link.to === '/admin'}
                  className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Reception Links (Module 1) */}
        {hasAccess([1]) && (
          <div className={user.role === 'admin' ? "mt-6" : ""}>
            <span className="px-4 text-xs font-bold text-orange-400 uppercase tracking-widest block mb-2">Patient Services</span>
            <div className="space-y-1">
              {receptionLinks.map((link) => (
                <NavLink 
                  key={link.to} 
                  to={link.to} 
                  end={link.to === '/reception/register'}
                  className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Links (Module 2 & 3) */}
        {hasAccess([2]) && (
          <div className="mt-6">
            <span className="px-4 text-xs font-bold text-orange-400 uppercase tracking-widest block mb-2">Clinical Portal</span>
            <div className="space-y-1">
              {doctorLinks.map((link) => (
                <NavLink 
                  key={link.to} 
                  to={link.to} 
                  end={link.to === '/doctor'}
                  className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
        {hasAccess([4]) && (
          <div className="mt-6">
            <span className="px-4 text-xs font-bold text-orange-400 uppercase tracking-widest block mb-2">Diagnostics</span>
            <NavLink to="/lab" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <FlaskConical className="h-5 w-5" />
              Lab Module
            </NavLink>
            <div className="mt-2 space-y-1">
              {labLinks.map((link) => (
                <NavLink 
                  key={link.to}
                  to={link.to}
                  className={() => currentLabSection === link.section ? activeSubStyle : inactiveSubStyle}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
        {hasAccess([5]) && (
          <div className="mt-6">
            <span className="px-4 text-xs font-bold text-orange-400 uppercase tracking-widest block mb-2">Inpatient Services</span>
            <div className="space-y-1">
              <NavLink to="/ipd/admission" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                <Bed className="h-5 w-5" />
                IPD Admission
              </NavLink>
              <NavLink to="/ipd/patients" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                <Users className="h-5 w-5" />
                Patient List
              </NavLink>
              <NavLink to="/ipd/services" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                <Syringe className="h-5 w-5" />
                Services
              </NavLink>
              <NavLink to="/ipd/ot-management" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                <CalendarDays className="h-5 w-5" />
                OT Management
              </NavLink>
            </div>
          </div>
        )}
        {hasAccess([6]) && (
          <div className="mt-6">
            <span className="px-4 text-xs font-bold text-orange-400 uppercase tracking-widest block mb-2">Nursing</span>
            <div className="space-y-1">
              <NavLink to="/nursing" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                <Bandage className="h-5 w-5" />
                Same Day Treatment
              </NavLink>
            </div>
          </div>
        )}
        {hasAccess([7]) && (
          <div className="mt-6">
            <span className="px-4 text-xs font-bold text-orange-400 uppercase tracking-widest block mb-2">Pharmacy</span>
            <NavLink to="/pharmacy" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
              <Pill className="h-5 w-5" />
              Pharmacy Workspace
            </NavLink>
            <div className="mt-2 space-y-1">
              {pharmacyLinks.map((link) => (
                <NavLink 
                  key={link.to}
                  to={link.to}
                  className={() => currentPharmacySection === link.section ? activeSubStyle : inactiveSubStyle}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Status Card */}
      <div className="p-4 border-t border-orange-100 bg-orange-50/30 m-4 rounded-xl">
        <p className="text-xs text-gray-500 font-medium">Logged in as</p>
        <p className="text-sm font-bold text-gray-800 truncate">{user.username}</p>
        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">
          {user.role}
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
