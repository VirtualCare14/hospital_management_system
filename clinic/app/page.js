'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import ClinicSidebar from '../components/ClinicSidebar';
import {
  Stethoscope, LogOut, Activity, Clock
} from 'lucide-react';

// Reception Views
import RegisterPatientView from '../components/reception/RegisterPatientView';
import PatientListView from '../components/reception/PatientListView';
import PatientFollowupsView from '../components/reception/PatientFollowupsView';

// Prescription Views
import DoctorDashboardView from '../components/prescription/DoctorDashboardView';
import DoctorPatientsView from '../components/prescription/DoctorPatientsView';
import CompletedConsultationsView from '../components/prescription/CompletedConsultationsView';
import EditPrintRxSettingsView from '../components/prescription/EditPrintRxSettingsView';

// Billing Views
import BillingDeskView from '../components/billing/BillingDeskView';
import InvoiceRegistryView from '../components/billing/InvoiceRegistryView';
import DueAmountRecoveryView from '../components/billing/DueAmountRecoveryView';

export default function ClinicDashboardPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('reception-register');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading Clinic Portal...</p>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      // Reception
      case 'reception-register':
        return <RegisterPatientView onNavigate={setActiveTab} />;
      case 'reception-patients':
        return <PatientListView onNavigate={setActiveTab} />;
      case 'reception-followups':
        return <PatientFollowupsView onNavigate={setActiveTab} />;

      // Prescription
      case 'doctor-dashboard':
        return <DoctorDashboardView onNavigate={setActiveTab} />;
      case 'doctor-patients':
        return <DoctorPatientsView onNavigate={setActiveTab} />;
      case 'doctor-completed':
        return <CompletedConsultationsView onNavigate={setActiveTab} />;
      case 'doctor-edit-print-rx':
        return <EditPrintRxSettingsView onNavigate={setActiveTab} />;

      // Billing
      case 'billing-desk':
        return <BillingDeskView onNavigate={setActiveTab} />;
      case 'billing-registry':
        return <InvoiceRegistryView onNavigate={setActiveTab} />;
      case 'billing-due-recovery':
        return <DueAmountRecoveryView onNavigate={setActiveTab} />;

      default:
        return <RegisterPatientView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex text-slate-900 font-sans">
      {/* Sidebar with Reception, Prescription, and Billing sections */}
      <ClinicSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-orange-100/80 sticky top-0 z-30 shadow-xs h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                  {user?.hospitalName || 'Clinic Workspace'}
                </h1>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                  Clinic Portal
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">ID: {user?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentTime && (
              <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>{currentTime}</span>
              </div>
            )}

            <button
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Workspace View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
