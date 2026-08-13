'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Fixed Header */}
      <Header toggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex w-full">
        <Sidebar
          mobileOpen={mobileOpen}
          closeMobileSidebar={() => setMobileOpen(false)}
        />

        <main className="flex-1 p-4 md:p-6 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
