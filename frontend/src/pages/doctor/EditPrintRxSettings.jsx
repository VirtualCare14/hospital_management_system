import { useState, useRef } from 'react';
import { Printer, Save, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PatientReceipt from '../../components/PatientReceipt';

const EditPrintRxSettings = () => {
  const receiptRef = useRef(null);
  
  const [printOptions, setPrintOptions] = useState(() => {
    const saved = localStorage.getItem('doctor_print_options');
    return saved ? JSON.parse(saved) : {
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
    localStorage.setItem('doctor_print_options', JSON.stringify(printOptions));
    toast.success('Doctor Print RX layout defaults saved successfully!');
  };

  // Sample Demo Data for Live Prescription Preview
  const samplePatient = {
    patientName: 'Rahul Sharma',
    uhid: 'UHID-454785',
    gender: 'Male',
    dob: '1995-05-15',
    mobile: '8949895216',
    department: 'GENERAL MEDICINE',
    appointmentDate: '2026-08-01',
    slot: '01:40 PM',
    registrationNumber: 'REG-2026-88',
    demographics: {
      weight: '70',
      height: '175',
      bloodPressure: '120/80',
      temperature: '37.2'
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
      { symptom: 'High Fever', durationDays: '3', durationUnit: 'Days', pastHistory: 'Recurring in monsoon', remarks: 'Monitored daily' },
      { symptom: 'Sore Throat', durationDays: '2', durationUnit: 'Days', pastHistory: 'None', remarks: 'Warm water gargle' }
    ],
    medicines: [
      { medicine: 'Tab. Paracetamol', dosageForm: 'Tablet', strength: '650mg', dose: '1', morning: true, afternoon: true, night: true, duration: '5', remarks: 'After food', qty: 15 },
      { medicine: 'Tab. Amoxicillin', dosageForm: 'Tablet', strength: '500mg', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food', qty: 10 },
      { medicine: 'Cough Syrup', dosageForm: 'Syrup', strength: '100ml', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: '5ml after meal', qty: 1 }
    ],
    followUpDate: '2026-08-06',
    followUpRemarks: 'Check temperature log & repeat CBC if fever persists'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Printer className="h-6 w-6 text-orange-600" /> Edit Print RX Settings & Layout
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customize default prescription print layout. Configure which optional sections appear on printed prescriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveDefaults}
          className="btn bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer shadow-md rounded-xl"
        >
          <Save className="h-4.5 w-4.5" /> Save Print RX Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Toggles & Options */}
        <div className="lg:col-span-5 space-y-5">
          {/* Mandatory Fixed Sections Card */}
          <div className="card p-5 bg-orange-50/70 border border-orange-200/80 shadow-xs space-y-3">
            <h2 className="text-sm font-black text-orange-950 uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4 w-4 text-orange-600" /> Mandatory Sections (Fixed)
            </h2>
            <p className="text-xs text-orange-900 leading-relaxed">
              These core clinical sections are permanently fixed and always printed on all prescription documents:
            </p>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-orange-200 text-xs font-extrabold text-orange-950">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Patient Details & Appointment Info
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-orange-200 text-xs font-extrabold text-orange-950">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Symptoms Name & Duration
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-orange-200 text-xs font-extrabold text-orange-950">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Prescription Medicines (Digital Rx)
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-orange-200 text-xs font-extrabold text-orange-950">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Follow-up Date & Instructions
              </div>
            </div>
          </div>

          {/* Toggleable Sections Card */}
          <div className="card p-5 bg-white border border-gray-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              Optional Print Sections
            </h2>

            <div className="space-y-3 bg-gray-50/80 p-4 border border-gray-200 rounded-xl text-sm font-extrabold text-gray-800">
              <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600">
                <span>Include Vitals & Demographics</span>
                <input
                  type="checkbox"
                  checked={printOptions.printVitals}
                  onChange={(e) => setPrintOptions({ ...printOptions, printVitals: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-5 w-5 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/80 pt-3">
                <span>Include Lab Investigations & Reports</span>
                <input
                  type="checkbox"
                  checked={printOptions.printLabTests}
                  onChange={(e) => setPrintOptions({ ...printOptions, printLabTests: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-5 w-5 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/80 pt-3">
                <span>Include Past History with Symptoms</span>
                <input
                  type="checkbox"
                  checked={printOptions.printSymptomHistory}
                  onChange={(e) => setPrintOptions({ ...printOptions, printSymptomHistory: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-5 w-5 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/80 pt-3">
                <span>Include Symptom Remarks / Instructions</span>
                <input
                  type="checkbox"
                  checked={printOptions.printSymptomRemarks}
                  onChange={(e) => setPrintOptions({ ...printOptions, printSymptomRemarks: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-5 w-5 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/80 pt-3">
                <span>Include General Past History</span>
                <input
                  type="checkbox"
                  checked={printOptions.printGeneralPastHistory !== false}
                  onChange={(e) => setPrintOptions({ ...printOptions, printGeneralPastHistory: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-5 w-5 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/80 pt-3">
                <span>Include Diagnosis & Remarks</span>
                <input
                  type="checkbox"
                  checked={printOptions.printDiagnosisRemarks !== false}
                  onChange={(e) => setPrintOptions({ ...printOptions, printDiagnosisRemarks: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-5 w-5 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none hover:text-orange-600 border-t border-gray-200/80 pt-3">
                <span>Include Advice for Patient</span>
                <input
                  type="checkbox"
                  checked={printOptions.printPatientAdvice !== false}
                  onChange={(e) => setPrintOptions({ ...printOptions, printPatientAdvice: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 h-5 w-5 cursor-pointer"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleSaveDefaults}
              className="w-full btn bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm py-3 px-5 flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xl"
            >
              <Save className="h-4.5 w-4.5" /> Save Print RX Defaults
            </button>
          </div>
        </div>

        {/* Right Column: Live Printable Prescription Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Printer className="h-4 w-4 text-orange-600" /> Live Print Layout Preview
            </h2>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              Updates in Realtime
            </span>
          </div>

          <div className="card p-4 bg-gray-100 border border-gray-300 rounded-2xl overflow-x-auto max-h-[750px] overflow-y-auto shadow-inner">
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
};

export default EditPrintRxSettings;
