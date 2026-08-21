'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [showAddReferrerModal, setShowAddReferrerModal] = useState(false);
  const [newReferrerName, setNewReferrerName] = useState('');
  const [showReferrerDropdown, setShowReferrerDropdown] = useState(false);
  const [referrerSearchQuery, setReferrerSearchQuery] = useState('');

  // Collection Centre dynamic state
  const [showAddCentreModal, setShowAddCentreModal] = useState(false);
  const [newCentreName, setNewCentreName] = useState('');
  const [collectionCentres, setCollectionCentres] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hms_lab_collection_centres');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      'Main Hospital Lab',
      'North Branch Centre',
      'South Satellite Lab',
      'Home Collection Unit'
    ];
  });

  useEffect(() => {
    if (!searchParams) return;
    const manageVal = searchParams.get('manage');
    if (manageVal === 'referrers') {
      const timer = setTimeout(() => setShowAddReferrerModal(true), 0);
      return () => clearTimeout(timer);
    } else if (manageVal === 'collection-centres') {
      const timer = setTimeout(() => setShowAddCentreModal(true), 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Sample Collection Agent dynamic state
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [collectionAgents, setCollectionAgents] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hms_lab_collection_agents');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      'Self (Patient Walk-in)',
      'Rahul Kumar (Phlebotomist)',
      'Suresh Singh (Home Agent)',
      'Anjali Verma (Lab Assistant)'
    ];
  });

  // Sample referrer options matching screenshot formatting
  const [referrers, setReferrers] = useState([
    { id: '1', codeId: '1', name: 'Self' },
    { id: '2', codeId: '2', name: 'Dr. A. K. Sharma (Cardiologist)' },
    { id: '3', codeId: '3', name: 'Dr. Priya Mehta (General Physician)' },
    { id: '4', codeId: '4', name: 'Dr. Rajesh Gupta (Pathologist)' },
    { id: '5', codeId: '5', name: 'City Hospital & Diagnostic Clinic' }
  ]);

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
    const newId = String(referrers.length + 1);
    const newRef = {
      id: newId,
      codeId: newId,
      name: newReferrerName.trim()
    };
    setReferrers(prev => [...prev, newRef]);
    setCaseData(prev => ({ ...prev, referredBy: `ID: ${newRef.codeId}, ${newRef.name}` }));
    setNewReferrerName('');
    setShowAddReferrerModal(false);
  };

  const handleAddAgent = (e) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;
    const name = newAgentName.trim();
    if (!collectionAgents.includes(name)) {
      const updated = [...collectionAgents, name];
      setCollectionAgents(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hms_lab_collection_agents', JSON.stringify(updated));
      }
    }
    setCaseData(prev => ({ ...prev, sampleAgent: name }));
    setNewAgentName('');
    setShowAddAgentModal(false);
  };

  const handleAddCentre = (e) => {
    e.preventDefault();
    if (!newCentreName.trim()) return;
    const name = newCentreName.trim();
    if (!collectionCentres.includes(name)) {
      const updated = [...collectionCentres, name];
      setCollectionCentres(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hms_lab_collection_centres', JSON.stringify(updated));
      }
    }
    setCaseData(prev => ({ ...prev, collectionCentre: name }));
    setNewCentreName('');
    setShowAddCentreModal(false);
  };

  const filteredReferrers = referrers.filter(r => {
    const fullText = `ID: ${r.codeId}, ${r.name}`.toLowerCase();
    return fullText.includes(referrerSearchQuery.toLowerCase());
  });

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-800">
            * Referred By
          </label>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setShowReferrerDropdown(!showReferrerDropdown)}
                className="w-full h-9 px-3 bg-white border border-orange-400 rounded-md text-xs font-medium text-slate-800 flex items-center justify-between hover:border-orange-600 focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-xs"
              >
                <span className="truncate">{caseData.referredBy || 'ID: 1, Self'}</span>
                <span className="text-slate-400 text-[10px]">▼</span>
              </button>

              {showReferrerDropdown && (
                <div 
                  className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in"
                  onMouseLeave={() => setShowReferrerDropdown(false)}
                >
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <input
                      type="text"
                      autoFocus
                      value={referrerSearchQuery}
                      onChange={(e) => setReferrerSearchQuery(e.target.value)}
                      placeholder="Search referrer name or ID..."
                      className="w-full h-8 px-2.5 bg-white border border-orange-400 rounded-md text-xs text-slate-800 outline-none"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {filteredReferrers.length === 0 ? (
                      <div className="p-3 text-slate-400 text-center">No referrer found</div>
                    ) : (
                      filteredReferrers.map((r) => {
                        const itemText = `ID: ${r.codeId}, ${r.name}`;
                        const isSelected = caseData.referredBy === itemText;

                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setCaseData(prev => ({ ...prev, referredBy: itemText }));
                              setShowReferrerDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 transition-colors cursor-pointer ${
                              isSelected ? 'bg-orange-500 text-white font-bold' : 'hover:bg-orange-50 text-slate-800'
                            }`}
                          >
                            {itemText}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2 bg-slate-50 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReferrerDropdown(false);
                        setShowAddReferrerModal(true);
                      }}
                      className="text-orange-600 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      + add new
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddReferrerModal(true)}
              className="h-9 px-3 border border-orange-500 hover:bg-orange-50 text-orange-600 font-semibold text-xs rounded-md flex items-center gap-1 cursor-pointer shrink-0 transition-colors shadow-xs"
            >
              + Add New
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="lab-label lab-label-required mb-0">Collection Centre</label>
            <button
              type="button"
              onClick={() => setShowAddCentreModal(true)}
              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add New</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              name="collectionCentre"
              list="centre-suggestions"
              value={caseData.collectionCentre || 'Main Hospital Lab'}
              onChange={(e) => {
                const val = e.target.value;
                setCaseData(prev => ({ ...prev, collectionCentre: val }));
                if (val && !collectionCentres.includes(val)) {
                  const updated = [...collectionCentres, val];
                  setCollectionCentres(updated);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('hms_lab_collection_centres', JSON.stringify(updated));
                  }
                }
              }}
              placeholder="Select or enter collection centre..."
              className="lab-input text-xs"
            />
            <datalist id="centre-suggestions">
              {collectionCentres.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="lab-label mb-0">Sample Collection Agent</label>
            <button
              type="button"
              onClick={() => setShowAddAgentModal(true)}
              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add New</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              name="sampleAgent"
              list="agent-suggestions"
              value={caseData.sampleAgent || 'Self (Patient Walk-in)'}
              onChange={(e) => {
                const val = e.target.value;
                setCaseData(prev => ({ ...prev, sampleAgent: val }));
                if (val && !collectionAgents.includes(val)) {
                  const updated = [...collectionAgents, val];
                  setCollectionAgents(updated);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('hms_lab_collection_agents', JSON.stringify(updated));
                  }
                }
              }}
              placeholder="Select or enter agent name..."
              className="lab-input text-xs"
            />
            <datalist id="agent-suggestions">
              {collectionAgents.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

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

      {showAddAgentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-slate-800">Add New Sample Collection Agent</h3>
            <form onSubmit={handleAddAgent} className="space-y-3">
              <div>
                <label className="lab-label">Agent Name / Phlebotomist *</label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma (Phlebotomist)"
                  className="lab-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAgentModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCentreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-slate-800">Add New Collection Centre</h3>
            <form onSubmit={handleAddCentre} className="space-y-3">
              <div>
                <label className="lab-label">Centre Name *</label>
                <input
                  type="text"
                  required
                  value={newCentreName}
                  onChange={(e) => setNewCentreName(e.target.value)}
                  placeholder="e.g. West Diagnostics Branch"
                  className="lab-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCentreModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
