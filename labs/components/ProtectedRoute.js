'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 text-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-200 text-orange-600 shadow-lg shadow-orange-500/10">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <p className="text-slate-600 text-sm font-semibold animate-pulse">
            Connecting to Medora 360 Lab Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
