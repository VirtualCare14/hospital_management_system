'use client';

import DoctorConsultationView from './DoctorConsultationView';

export default function ConsultationModal({ patient, onClose, onSuccess }) {
  if (!patient) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[96vh] overflow-y-auto border border-gray-200 p-4">
        <DoctorConsultationView patient={patient} onBack={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
