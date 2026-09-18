'use client';

import { useState, useEffect } from 'react';
import {
  Stethoscope, Plus, Trash2, Save, X, Activity, Pill,
  FileText, Calendar, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';

export default function ConsultationModal({ patient, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Clinical state
  const [vitals, setVitals] = useState({
    bloodPressure: patient?.demographics?.bloodPressure || '',
    pulse: patient?.demographics?.pulse || '',
    temperature: patient?.demographics?.temperature || '',
    weight: patient?.demographics?.weight || '',
    height: patient?.demographics?.height || '',
    spo2: patient?.demographics?.spo2 || '',
    bmi: patient?.demographics?.bmi || ''
  });

  const [symptoms, setSymptoms] = useState([
    { symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' }
  ]);

  const [diagnosisRemark, setDiagnosisRemark] = useState('');
  const [patientAdvice, setPatientAdvice] = useState('');
  const [pastHistory, setPastHistory] = useState('');
  const [tests, setTests] = useState([]);
  const [testInput, setTestInput] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpRemarks, setFollowUpRemarks] = useState('');

  // Medicines state
  const [medicines, setMedicines] = useState([
    { medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food' }
  ]);

  // Load past consultation data if available
  useEffect(() => {
    if (!patient?._id) return;
    setLoading(true);
    apiRequest(`/consultation/${patient._id}`)
      .then((data) => {
        if (data?.consultation) {
          const c = data.consultation;
          if (c.vitals) setVitals(prev => ({ ...prev, ...c.vitals }));
          if (c.symptoms && c.symptoms.length > 0) setSymptoms(c.symptoms);
          if (c.diagnosisRemark) setDiagnosisRemark(c.diagnosisRemark);
          if (c.patientAdvice) setPatientAdvice(c.patientAdvice);
          if (c.pastHistory) setPastHistory(c.pastHistory);
          if (c.tests && c.tests.length > 0) setTests(c.tests);
          if (c.followUpDate) setFollowUpDate(new Date(c.followUpDate).toISOString().split('T')[0]);
          if (c.followUpRemarks) setFollowUpRemarks(c.followUpRemarks);
        }
        if (data?.prescription?.medicines && data.prescription.medicines.length > 0) {
          setMedicines(data.prescription.medicines);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patient]);

  // Vitals BMI calc
  useEffect(() => {
    const h = parseFloat(vitals.height);
    const w = parseFloat(vitals.weight);
    if (h > 0 && w > 0) {
      const meter = h / 100;
      const bmiVal = (w / (meter * meter)).toFixed(1);
      setVitals(v => ({ ...v, bmi: bmiVal }));
    }
  }, [vitals.height, vitals.weight]);

  const addSymptomRow = () => {
    setSymptoms([...symptoms, { symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' }]);
  };

  const removeSymptomRow = (index) => {
    if (symptoms.length === 1) return;
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const updateSymptom = (index, field, value) => {
    const updated = [...symptoms];
    updated[index][field] = value;
    setSymptoms(updated);
  };

  const addMedicineRow = () => {
    setMedicines([...medicines, { medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '5', remarks: 'After food' }]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addTest = (e) => {
    e?.preventDefault();
    if (!testInput.trim()) return;
    if (!tests.includes(testInput.trim())) {
      setTests([...tests, testInput.trim()]);
    }
    setTestInput('');
  };

  const removeTest = (test) => {
    setTests(tests.filter(t => t !== test));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validSymptoms = symptoms.filter(s => s.symptom && s.symptom.trim());
    const validMedicines = medicines.filter(m => m.medicine && m.medicine.trim());

    if (validSymptoms.length === 0 && !diagnosisRemark.trim() && validMedicines.length === 0) {
      return toast.error('Please enter at least symptoms, diagnosis, or prescription medicines');
    }

    setSubmitting(true);
    try {
      const consPayload = {
        patientId: patient._id,
        visitId: patient.visitId || patient._id,
        vitals,
        symptoms: validSymptoms,
        diagnosisRemark,
        patientAdvice,
        pastHistory,
        tests,
        followUpDate: followUpDate || undefined,
        followUpRemarks: followUpRemarks || undefined
      };

      const consRes = await apiRequest('/consultation/create', {
        method: 'POST',
        data: consPayload
      });

      let savedPrescription = null;
      if (validMedicines.length > 0) {
        const rxPayload = {
          patientId: patient._id,
          consultationId: consRes?.consultation?._id || consRes?._id,
          medicines: validMedicines.map(m => {
            const doseNum = parseFloat(m.dose) || 1;
            const freqCount = (m.morning ? 1 : 0) + (m.afternoon ? 1 : 0) + (m.night ? 1 : 0);
            const durDays = parseFloat(m.duration) || 1;
            const qty = parseFloat((doseNum * freqCount * durDays).toFixed(2));
            return { ...m, qty: m.qty || qty };
          }),
          language: 'English'
        };
        const rxRes = await apiRequest('/prescription/create', {
          method: 'POST',
          data: rxPayload
        });
        savedPrescription = rxRes?.prescription || rxPayload;
      }

      toast.success('Consultation & Prescription saved successfully!');
      if (onSuccess) {
        onSuccess(patient, {
          ...consPayload,
          medicines: validMedicines
        });
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save consultation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-gray-900">{patient.patientName}</h3>
                <span className="text-xs font-bold text-orange-600 bg-orange-100/80 px-2.5 py-0.5 rounded-full">
                  {formatUhid(patient.uhid)}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {patient.gender} • {patient.mobile} • Dept: {patient.department || 'General'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Vitals Section */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-gray-800 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-orange-600" /> Patient Vitals
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">BP (mmHg)</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  placeholder="72"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="70"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Height (cm)</label>
                <input
                  type="number"
                  placeholder="172"
                  value={vitals.height}
                  onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  placeholder="99"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">BMI</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto"
                  value={vitals.bmi}
                  className="w-full px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* 2. Chief Complaints / Symptoms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider">Chief Complaints / Symptoms</span>
              <button
                type="button"
                onClick={addSymptomRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Symptom
              </button>
            </div>

            <div className="space-y-2">
              {symptoms.map((sym, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="e.g. Fever, Cough, Headache"
                      value={sym.symptom}
                      onChange={(e) => updateSymptom(idx, 'symptom', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Duration"
                      value={sym.durationDays}
                      onChange={(e) => updateSymptom(idx, 'durationDays', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={sym.durationUnit}
                      onChange={(e) => updateSymptom(idx, 'durationUnit', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                    >
                      <option value="Days">Days</option>
                      <option value="Weeks">Weeks</option>
                      <option value="Months">Months</option>
                      <option value="Years">Years</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Remarks / Note"
                      value={sym.remarks}
                      onChange={(e) => updateSymptom(idx, 'remarks', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      disabled={symptoms.length === 1}
                      onClick={() => removeSymptomRow(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Prescription Medicines Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-orange-600" /> Digital Rx (Medicines)
              </span>
              <button
                type="button"
                onClick={addMedicineRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Medicine Name</th>
                    <th className="py-2.5 px-3">Form</th>
                    <th className="py-2.5 px-3">Strength</th>
                    <th className="py-2.5 px-3">Dose</th>
                    <th className="py-2.5 px-3 text-center">Timing (M-A-N)</th>
                    <th className="py-2.5 px-3">Duration (Days)</th>
                    <th className="py-2.5 px-3">Remarks / Advice</th>
                    <th className="py-2.5 px-2 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {medicines.map((med, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-2 w-48">
                        <input
                          type="text"
                          placeholder="Medicine name"
                          value={med.medicine}
                          onChange={(e) => updateMedicine(idx, 'medicine', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </td>
                      <td className="p-2 w-28">
                        <select
                          value={med.dosageForm}
                          onChange={(e) => updateMedicine(idx, 'dosageForm', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
                        >
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Injection">Injection</option>
                          <option value="Ointment">Ointment</option>
                          <option value="Drops">Drops</option>
                        </select>
                      </td>
                      <td className="p-2 w-24">
                        <input
                          type="text"
                          placeholder="500mg"
                          value={med.strength}
                          onChange={(e) => updateMedicine(idx, 'strength', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800"
                        />
                      </td>
                      <td className="p-2 w-16">
                        <input
                          type="text"
                          value={med.dose}
                          onChange={(e) => updateMedicine(idx, 'dose', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center font-bold"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                          <label className="inline-flex items-center gap-0.5 text-[11px] font-bold">
                            <input
                              type="checkbox"
                              checked={med.morning}
                              onChange={(e) => updateMedicine(idx, 'morning', e.target.checked)}
                              className="rounded text-orange-600"
                            /> M
                          </label>
                          <span className="text-gray-300">-</span>
                          <label className="inline-flex items-center gap-0.5 text-[11px] font-bold">
                            <input
                              type="checkbox"
                              checked={med.afternoon}
                              onChange={(e) => updateMedicine(idx, 'afternoon', e.target.checked)}
                              className="rounded text-orange-600"
                            /> A
                          </label>
                          <span className="text-gray-300">-</span>
                          <label className="inline-flex items-center gap-0.5 text-[11px] font-bold">
                            <input
                              type="checkbox"
                              checked={med.night}
                              onChange={(e) => updateMedicine(idx, 'night', e.target.checked)}
                              className="rounded text-orange-600"
                            /> N
                          </label>
                        </div>
                      </td>
                      <td className="p-2 w-20">
                        <input
                          type="number"
                          value={med.duration}
                          onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="e.g. After food"
                          value={med.remarks}
                          onChange={(e) => updateMedicine(idx, 'remarks', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          disabled={medicines.length === 1}
                          onClick={() => removeMedicineRow(idx)}
                          className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Diagnosis & Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                Diagnosis & Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Doctor's clinical diagnosis and assessment..."
                value={diagnosisRemark}
                onChange={(e) => setDiagnosisRemark(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                Patient Advice & Diet Instructions
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Drink plenty of warm water, rest for 3 days, avoid oily food..."
                value={patientAdvice}
                onChange={(e) => setPatientAdvice(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* 5. Lab Tests & Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                Lab Investigations
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Complete Blood Count (CBC), Urine Routine"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTest(); } }}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                />
                <button
                  type="button"
                  onClick={addTest}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 rounded-xl"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tests.map((t, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-xs font-bold">
                    {t}
                    <button type="button" onClick={() => removeTest(t)} className="text-orange-600 hover:text-orange-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                Follow-up Date & Instructions
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                />
                <input
                  type="text"
                  placeholder="Follow-up note (e.g. Come with CBC report)"
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Prescription & Complete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
