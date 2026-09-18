'use client';

import { useState, useRef } from 'react';
import { Printer, Save, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PatientReceipt from '../common/PatientReceipt';

export default function EditPrintRxSettingsView() {
  const receiptRef = useRef(null);

  const [printOptions, setPrintOptions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clinic_doctor_print_options');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {
      printVitals: true,
      printLabTests: true,
      printSymptomHistory: true,
      printSymptomRemarks: true,
      printGeneralPastHistory: true,
      printDiagnosisRemarks: true,
      printPatientAdvice: true
    };
  });

  const handleSaveDefaults = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clinic_doctor_print_options', JSON.stringify(printOptions));
    }
    toast.success('Doctor Print RX layout defaults saved successfully!');
  };

  const samplePatient = {
    patientName: 'Rahul Sharma',
    uhid: 'UHID-454785',
    gender: 'Male',
    dob: '1995-05-15',
    mobile: '9876543210',
    department: 'GENERAL MEDICINE',
    appointmentDate: new Date().toISOString().split('T')[0],
    slot: '11:00 AM',
    registrationNumber: 'REG-2026-88',
    demographics: {
      weight: '70',
      height: '175',
      bloodPressure: '120/80',
      temperature: '37.2',
      pulse: '74',
      spo2: '99',
      bmi: '22.9'
    }
  };

  const samplePrescription = {
    doctorName: 'Doctor',
    language: 'English',
    diagnosisRemark: 'Acute Viral Fever with mild throat infection.',
    patientAdvice: 'Drink plenty of warm fluids, rest adequately, and avoid cold food.',
    tests: ['Complete Blood Count (CBC)', 'Dengue NS1 Antigen', 'Widal Test'],
    pastHistory: 'History of seasonal allergic rhinitis. No diabetes or hypertension.',
    symptoms: [
      { symptom: 'High Fever', durationDays: '3', durationUnit: 'Days', pastHistory: 'Recurring', remarks: 'Monitored daily' },
      { symptom: 'Sore Throat', durationDays: '2', durationUnit: 'Days', pastHistory: 'None', remarks: 'Warm water gargle' }
    ],
    medicines: [
      { medicine: 'Tab. Paracetamol', dosageForm: 'Tablet', strength: '650mg', dose: '1', morning: true, afternoon: true, night: true, duration: '5', remarks: 'After food', qty: 15 },
      { medicine: 'Tab. Amoxicillin', dosageForm: 'Tablet', strength: '500mg', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food', qty: 10 },
      { medicine: 'Cough Syrup', dosageForm: 'Syrup', strength: '100ml', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: '5ml after meal', qty: 1 }
    ],
    followUpDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    followUpRemarks: 'Check temperature log & repeat CBC if fever persists'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-orange-600" /> Edit Print RX Layout & Settings
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Customize which optional sections and clinical notes appear on printed prescriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveDefaults}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Toggles */}
        <div className="lg:col-span-5 space-y-5">
          {/* Fixed core sections */}
          <div className="p-5 bg-orange-50/70 border border-orange-200/80 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-orange-600" /> Core Fixed Sections
            </h3>
            <p className="text-xs text-orange-900 leading-relaxed font-medium">
              These fundamental sections are permanently enabled on all printed prescriptions:
            </p>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-orange-200 text-xs font-bold text-orange-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Patient Demographics & UHID
              </div>
              <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-orange-200 text-xs font-bold text-orange-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Chief Complaints & Symptoms
              </div>
              <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-orange-200 text-xs font-bold text-orange-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Prescription Medicines (Digital Rx)
              </div>
              <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-orange-200 text-xs font-bold text-orange-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Follow-up Date & Instructions
              </div>
            </div>
          </div>

          {/* Optional sections */}
          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-3">
              Optional Print Sections
            </h3>

            <div className="space-y-3 text-xs font-bold text-gray-800">
              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                <span>Include Vitals & Measurements</span>
                <input
                  type="checkbox"
                  checked={printOptions.printVitals}
                  onChange={(e) => setPrintOptions({ ...printOptions, printVitals: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                <span>Include Lab Investigations & Reports</span>
                <input
                  type="checkbox"
                  checked={printOptions.printLabTests}
                  onChange={(e) => setPrintOptions({ ...printOptions, printLabTests: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                <span>Include Symptom Past History</span>
                <input
                  type="checkbox"
                  checked={printOptions.printSymptomHistory}
                  onChange={(e) => setPrintOptions({ ...printOptions, printSymptomHistory: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                <span>Include Symptom Remarks / Instructions</span>
                <input
                  type="checkbox"
                  checked={printOptions.printSymptomRemarks}
                  onChange={(e) => setPrintOptions({ ...printOptions, printSymptomRemarks: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                <span>Include General Past History</span>
                <input
                  type="checkbox"
                  checked={printOptions.printGeneralPastHistory !== false}
                  onChange={(e) => setPrintOptions({ ...printOptions, printGeneralPastHistory: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                <span>Include Diagnosis & Remarks</span>
                <input
                  type="checkbox"
                  checked={printOptions.printDiagnosisRemarks !== false}
                  onChange={(e) => setPrintOptions({ ...printOptions, printDiagnosisRemarks: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                <span>Include Patient Advice</span>
                <input
                  type="checkbox"
                  checked={printOptions.printPatientAdvice !== false}
                  onChange={(e) => setPrintOptions({ ...printOptions, printPatientAdvice: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Realtime Layout Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Printer className="w-4 h-4 text-orange-600" /> Live Layout Preview
            </h3>
            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
              Updates in Realtime
            </span>
          </div>

          <div className="bg-gray-100 border border-gray-300 rounded-2xl p-4 overflow-x-auto max-h-[720px] overflow-y-auto shadow-inner">
            <div ref={receiptRef}>
              <PatientReceipt
                patient={samplePatient}
                prescription={samplePrescription}
                printOptions={printOptions}
                language="English"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
