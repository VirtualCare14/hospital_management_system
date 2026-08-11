'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, FlaskConical } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 text-slate-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25 border border-orange-200">
          <FlaskConical className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mt-2" />
        <p className="text-slate-600 text-xs font-semibold">Redirecting to Medora 360 Lab Portal...</p>
      </div>
    </div>
  );
}
