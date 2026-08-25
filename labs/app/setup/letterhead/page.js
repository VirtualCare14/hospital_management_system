'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';

export default function LetterheadSetup() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/setup/ratelist');
  }, [router]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm font-semibold text-slate-500">Redirecting to setup...</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
