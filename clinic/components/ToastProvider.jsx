'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#ffffff',
          color: '#1e293b',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #ffedd5',
          fontSize: '13px',
          fontWeight: 600,
        },
      }}
    />
  );
}
