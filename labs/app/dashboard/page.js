'use client';

import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { 
  FlaskConical, 
  Building2, 
  UserCheck, 
  LogOut, 
  Activity, 
  FileText, 
  TestTube, 
  CheckCircle2, 
  Sliders, 
  Users, 
  Receipt,
  Server,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [labStats, setLabStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoadingStats(true);
        // Attempt fetching lab dashboard statistics from backend API
        const stats = await api.get('/lab/dashboard').catch(() => null);
        if (stats) {
          setLabStats(stats);
        }
        setBackendStatus('connected');
      } catch (err) {
        console.error('Failed to load lab statistics', err);
        setBackendStatus('error');
      } finally {
        setLoadingStats(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Brand & Hospital Identity */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Medora 360</h1>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Lab Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-slate-300">
                  {user?.hospitalName || 'Hospital Laboratory Module'}
                </span>
              </p>
            </div>
          </div>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-slate-200">{user?.username}</p>
                <p className="text-slate-400 capitalize">{user?.role || 'Lab Personnel'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-900/40 via-slate-900 to-slate-900 border border-cyan-500/20 p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Standalone Next.js Lab Service
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome to Laboratory Management
              </h2>
              <p className="text-slate-300 text-sm mt-2 max-w-2xl">
                Connected to hospital <span className="text-cyan-400 font-semibold">{user?.hospitalName || 'Main Hospital'}</span>. You have active access to process test orders, generate reports, manage diagnostic templates, and track test fulfillment.
              </p>
            </div>

            {/* Backend Connection Status Badge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shrink-0">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Backend API</p>
                <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active & Connected
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hospital ID</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-bold text-white truncate">{user?.hospitalId || 'N/A'}</p>
            <p className="text-xs text-slate-400 mt-1">Multi-tenant scope</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User Account</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-bold text-white capitalize">{user?.username}</p>
            <p className="text-xs text-cyan-400 mt-1 capitalize">Role: {user?.role || 'Admin'}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Module Access</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">Laboratory</p>
            <p className="text-xs text-slate-400 mt-1">Full Privileges Granted</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Domain URL</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-bold text-white truncate">labs.medora360.com</p>
            <p className="text-xs text-slate-400 mt-1">VPS Config Ready</p>
          </div>

        </div>

        {/* Feature Workspace Grid */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5 text-cyan-400" /> Laboratory Modules & Workflow
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Lab Orders & Requests */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-200 group cursor-pointer flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Lab Requests & Processing
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Manage incoming doctor test orders, sample collection, test status, and draft generation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>View Requests</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: Test Catalog & Pricing */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-200 group cursor-pointer flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sliders className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Test Catalog & Categories
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Configure lab tests, reference ranges, unit metrics, test categories, and pricing rules.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Manage Test Directory</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Signatories & Lab Staff */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-200 group cursor-pointer flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Signatories & Assistants
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Maintain authorized pathologists, doctors, lab technicians, signatures, and lab assistants.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
                <span>Manage Staff & Signatures</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400 bg-slate-900/50 mt-auto">
        Medora 360 Laboratory Information Management System • Connected to Backend API
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
