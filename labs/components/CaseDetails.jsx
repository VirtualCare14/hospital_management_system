'use client';

import { useState } from 'react';
import { 
  Building2, 
  UserCheck, 
  Plus, 
  FlaskConical, 
  Scan, 
  Activity, 
  Heart, 
  Layers, 
  Radio, 
  Zap, 
  FileCheck2, 
  Sliders,
  ExternalLink
} from 'lucide-react';

export default function CaseDetails({ caseData, setCaseData, selectedCategory, setSelectedCategory }) {
  const [showAddReferrerModal, setShowAddReferrerModal] = useState(false);
  const [newReferrerName, setNewReferrerName] = useState('');

  // Sample referrer options
  const [referrers, setReferrers] = useState([
    { id: 'ref_1', name: 'Self / Direct Walk-in' },
    { id: 'ref_2', name: 'Dr. A. K. Sharma (Cardiologist)' },
    { id: 'ref_3', name: 'Dr. Priya Mehta (General Physician)' },
    { id: 'ref_4', name: 'Dr. Rajesh Gupta (Pathologist)' },
    { id: 'ref_5', name: 'City Hospital & Diagnostic Clinic' }
  ]);

  const collectionCentres = [
    'Main Hospital Lab',
    'North Branch Centre',
    'South Satellite Lab',
    'Home Collection Unit'
  ];

  const collectionAgents = [
    'Self (Patient Walk-in)',
    'Rahul Kumar (Phlebotomist)',
    'Suresh Singh (Home Agent)',
    'Anjali Verma (Lab Assistant)'
  ];

  const categories = [
    { id: 'LAB', label: 'LAB', icon: FlaskConical },
    { id: 'USG', label: 'USG', icon: Activity },
    { id: 'DIGITAL X-RAY', label: 'DIGITAL X-RAY', icon: Scan },
    { id: 'XRAY', label: 'XRAY', icon: Radio },
    { id: 'OUTSOURCE LAB', label: 'OUTSOURCE LAB', icon: Layers },
    { id: 'ECG', label: 'ECG', icon: Heart },
    { id: 'CT SCAN', label: 'CT SCAN', icon: Scan },
    { id: 'MRI', label: 'MRI', icon: Zap },
    { id: 'EPS', label: 'EPS', icon: Activity },
    { id: 'OPG', label: 'OPG', icon: Radio },
    { id: 'CARDIOLOGY', label: 'CARDIOLOGY', icon: Heart },
    { id: 'EEG', label: 'EEG', icon: Zap },
    { id: 'MAMMOGRAPHY', label: 'MAMMOGRAPHY', icon: Scan }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCaseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddReferrer = (e) => {
    e.preventDefault();
    if (!newReferrerName.trim()) return;
    const newRef = {
      id: `ref_${Date.now()}`,
      name: newReferrerName.trim()
    };
    setReferrers(prev => [...prev, newRef]);
    setCaseData(prev => ({ ...prev, referredBy: newRef.name }));
    setNewReferrerName('');
    setShowAddReferrerModal(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-orange-500" />
          <span>Case Details</span>
        </h2>

        <button
          type="button"
          onClick={() => setShowAddReferrerModal(true)}
          className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Manage Referrers</span>
        </button>
      </div>

      {/* Row 1: Referred By, Collection Centre, Sample Agent */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Referred By */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="lab-label lab-label-required mb-0">Referred By</label>
            <button
              type="button"
              onClick={() => setShowAddReferrerModal(true)}
              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add New</span>
            </button>
          </div>
          <select
            name="referredBy"
            value={caseData.referredBy || 'Self / Direct Walk-in'}
            onChange={handleChange}
            className="lab-input text-xs"
          >
            {referrers.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Collection Centre */}
        <div>
          <label className="lab-label lab-label-required">Collection Centre</label>
          <select
            name="collectionCentre"
            value={caseData.collectionCentre || 'Main Hospital Lab'}
            onChange={handleChange}
            className="lab-input text-xs"
          >
            {collectionCentres.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sample Collection Agent */}
        <div>
          <label className="lab-label">Sample Collection Agent</label>
          <select
            name="sampleAgent"
            value={caseData.sampleAgent || 'Self (Patient Walk-in)'}
            onChange={handleChange}
            className="lab-input text-xs"
          >
            {collectionAgents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Test / Service Category Selector */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
          Select Service Category
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer h-20
                  ${isSelected
                    ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-xs ring-1 ring-orange-500/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/40'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`} />
                <span className="text-[11px] font-semibold tracking-tight leading-tight line-clamp-1">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal for adding new referrer */}
      {showAddReferrerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-slate-800">Add New Referrer / Doctor</h3>
            <form onSubmit={handleAddReferrer} className="space-y-3">
              <div>
                <label className="lab-label">Doctor / Clinic Name</label>
                <input
                  type="text"
                  required
                  value={newReferrerName}
                  onChange={(e) => setNewReferrerName(e.target.value)}
                  placeholder="e.g. Dr. Sunita Rao"
                  className="lab-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReferrerModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Add Referrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
