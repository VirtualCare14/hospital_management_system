import { useState } from 'react';
import { useAbha } from '../../../context/AbhaContext';
import {
  Fingerprint,
  LogIn,
  Search,
  UserCircle,
  CreditCard,
  QrCode,
  Smartphone,
  Mail,
  UserX,
  Trash2,
  Shield,
  RefreshCw,
  ChevronRight,
  HeartPulse,
  Lock,
  LogOut,
  CheckCircle,
  IdCard,
  AlertCircle
} from 'lucide-react';
import CreateAbha from './CreateAbha';
import AbhaLogin from './AbhaLogin';
import SearchAbha from './SearchAbha';
import AbhaProfile from './AbhaProfile';
import AbhaCard from './AbhaCard';
import AbhaQrCode from './AbhaQrCode';
import UpdateMobile from './UpdateMobile';
import UpdateEmail from './UpdateEmail';
import DeactivateAbha from './DeactivateAbha';

const FeatureCard = ({ icon: Icon, title, description, onClick, disabled, badge }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`relative group w-full text-left p-4 rounded-xl border transition-all duration-300 ${
      disabled
        ? 'border-gray-100 bg-gray-50/50 opacity-50 cursor-not-allowed'
        : 'border-orange-100 bg-white hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50 cursor-pointer'
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
      disabled ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition-colors'
    }`}>
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="text-sm font-bold text-gray-800 mb-1 leading-tight">{title}</h3>
    <p className="text-[11px] text-gray-500 leading-tight">{description}</p>
    {badge && (
      <span className={`absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
        badge === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
      }`}>
        {badge}
      </span>
    )}
    {!disabled && (
      <ChevronRight className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-orange-300 group-hover:text-orange-500 transition-colors" />
    )}
  </button>
);

const SectionCard = ({ title, icon: Icon, children, accent }) => (
  <div className={`rounded-xl border overflow-hidden ${
    accent === 'green' ? 'border-green-200 bg-white' :
    accent === 'blue' ? 'border-blue-200 bg-white' :
    accent === 'purple' ? 'border-purple-200 bg-white' :
    accent === 'red' ? 'border-red-200 bg-white' :
    'border-orange-100 bg-white'
  }`}>
    <div className={`px-4 py-3 border-b ${
      accent === 'green' ? 'border-green-100 bg-gradient-to-r from-green-50 to-emerald-50' :
      accent === 'blue' ? 'border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50' :
      accent === 'purple' ? 'border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50' :
      accent === 'red' ? 'border-red-100 bg-gradient-to-r from-red-50 to-rose-50' :
      'border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          accent === 'green' ? 'bg-green-200 text-green-700' :
          accent === 'blue' ? 'bg-blue-200 text-blue-700' :
          accent === 'purple' ? 'bg-purple-200 text-purple-700' :
          accent === 'red' ? 'bg-red-200 text-red-700' :
          'bg-orange-200 text-orange-700'
        }`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>
    </div>
    <div className="p-3 space-y-2">
      {children}
    </div>
  </div>
);

const AbhaDashboard = () => {
  const { isAuthenticated, abhaNumber, logoutAbha } = useAbha();
  const [activeView, setActiveView] = useState(null);

  const views = {
    create: { title: 'Create ABHA', component: CreateAbha },
    login: { title: 'ABHA Login', component: AbhaLogin },
    search: { title: 'Search ABHA', component: SearchAbha },
    profile: { title: 'ABHA Profile', component: AbhaProfile },
    card: { title: 'ABHA Card', component: AbhaCard },
    qrcode: { title: 'QR Code', component: AbhaQrCode },
    mobile: { title: 'Update Mobile', component: UpdateMobile },
    email: { title: 'Update Email', component: UpdateEmail },
    deactivate: { title: 'Deactivate ABHA', component: DeactivateAbha },
  };

  const ActiveComponent = activeView ? views[activeView]?.component : null;

  const handleLogoutAbha = () => {
    logoutAbha();
    setActiveView(null);
  };

  if (ActiveComponent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView(null)}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            ← Back to ABHA Services
          </button>
        </div>
        <ActiveComponent />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-orange-500 text-white p-2 rounded-xl">
              <HeartPulse className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">ABHA Services</h1>
          </div>
          <p className="text-sm text-gray-500 ml-11">
            Ayushman Bharat Health Account — Milestone 1
          </p>
        </div>
        {isAuthenticated && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            ABHA Authenticated
          </span>
        )}
      </div>

      {/* === TOP ROW: 3 Sections side by side === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 1. ABHA Enrollment */}
        <SectionCard title="ABHA Enrollment" icon={Fingerprint} accent="orange">
          <FeatureCard
            icon={Fingerprint}
            title="Create ABHA via Aadhaar"
            description="Enroll using your Aadhaar to get a new ABHA number"
            onClick={() => setActiveView('create')}
          />
        </SectionCard>

        {/* 2. ABHA Access — shows login card OR session card */}
        <SectionCard title="ABHA Access" icon={LogIn} accent="blue">
          {isAuthenticated ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-green-800">ABHA Session Active</p>
                  {abhaNumber && (
                    <p className="text-[10px] text-green-600 font-mono truncate">{abhaNumber}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogoutAbha}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 px-3 py-2 text-xs font-bold transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout ABHA
              </button>
              <div className="text-[10px] text-green-600/70 text-center">
                ABHA session is active for patient operations
              </div>
            </div>
          ) : (
            <>
              <FeatureCard
                icon={LogIn}
                title="Login to ABHA"
                description="Sign in to your existing ABHA account"
                onClick={() => setActiveView('login')}
              />
              <FeatureCard
                icon={Search}
                title="Search ABHA"
                description="Find ABHA account by mobile number"
                onClick={() => setActiveView('search')}
              />
            </>
          )}
        </SectionCard>

        {/* 3. ABHA Profile */}
        <SectionCard title="ABHA Profile" icon={UserCircle} accent="purple">
          <FeatureCard
            icon={UserCircle}
            title="View Profile"
            description="View your ABHA profile details"
            onClick={() => setActiveView('profile')}
            disabled={!isAuthenticated}
            badge={!isAuthenticated ? 'Login Required' : null}
          />
          <div className={!isAuthenticated ? 'opacity-40 pointer-events-none' : ''}>
            <FeatureCard
              icon={CreditCard}
              title="View ABHA Card"
              description="View or download your ABHA card"
              onClick={() => setActiveView('card')}
              disabled={!isAuthenticated}
            />
          </div>
          <div className={!isAuthenticated ? 'opacity-40 pointer-events-none' : ''}>
            <FeatureCard
              icon={QrCode}
              title="View QR Code"
              description="View your ABHA QR code image"
              onClick={() => setActiveView('qrcode')}
              disabled={!isAuthenticated}
            />
          </div>
          {!isAuthenticated && (
            <div className="flex items-center gap-1.5 text-[10px] text-orange-500 font-medium pt-1">
              <Lock className="h-3 w-3" />
              Login to unlock profile features
            </div>
          )}
        </SectionCard>
      </div>

      {/* === AUTHENTICATED SECTIONS (visible only after login) === */}
      {isAuthenticated && (
        <div className="space-y-6">
          {/* Profile Management */}
          <SectionCard title="Profile Management" icon={Smartphone} accent="green">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FeatureCard
                icon={Smartphone}
                title="Update Mobile"
                description="Change registered mobile number"
                onClick={() => setActiveView('mobile')}
              />
              <FeatureCard
                icon={Mail}
                title="Update Email"
                description="Change registered email address"
                onClick={() => setActiveView('email')}
              />
            </div>
          </SectionCard>

          {/* Account Management */}
          <SectionCard title="Account Management" icon={UserX} accent="red">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <FeatureCard
                icon={UserX}
                title="Deactivate ABHA"
                description="Deactivate your ABHA account temporarily"
                onClick={() => setActiveView('deactivate')}
              />
              <FeatureCard
                icon={RefreshCw}
                title="Reactivate ABHA"
                description="Reactivate a deactivated ABHA account"
                onClick={() => {}}
                disabled={true}
                badge="Coming Soon"
              />
              <FeatureCard
                icon={Trash2}
                title="Delete ABHA"
                description="Permanently delete ABHA account"
                onClick={() => {}}
                disabled={true}
                badge="Coming Soon"
              />
            </div>
          </SectionCard>

          {/* Footer Info */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-0.5">Secure ABDM Integration</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  All operations are routed through our secure backend. Aadhaar and OTPs are encrypted end-to-end.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* When not authenticated — show CTA */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-orange-500 shrink-0" />
            <p className="text-sm text-gray-600">
              Login to ABHA to access Profile Management, ABHA Card, QR Code, and Account Management features.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbhaDashboard;