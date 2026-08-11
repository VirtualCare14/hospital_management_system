'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Check, TestTube, Loader2, Info } from 'lucide-react';
import api from '../lib/api';

export default function ServiceSelector({ selectedCategory, selectedServices, onToggleService }) {
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Fallback catalog by category if API returns empty
  const fallbackCatalog = {
    'LAB': [
      { id: 't_cbc', title: 'Complete Blood Count (CBC)', code: 'CBC', price: 350 },
      { id: 't_lft', title: 'Liver Function Test (LFT)', code: 'LFT', price: 650 },
      { id: 't_kft', title: 'Kidney Function Test (KFT)', code: 'KFT', price: 600 },
      { id: 't_lipid', title: 'Lipid Profile', code: 'LIPID', price: 550 },
      { id: 't_thyroid', title: 'Thyroid Profile (T3, T4, TSH)', code: 'THYROID', price: 500 },
      { id: 't_hba1c', title: 'HbA1c (Glycated Hemoglobin)', code: 'HBA1C', price: 450 },
      { id: 't_fbs', title: 'Fasting Blood Sugar (FBS)', code: 'FBS', price: 100 },
      { id: 't_urine', title: 'Urine Routine & Microscopy', code: 'URINE', price: 150 }
    ],
    'USG': [
      { id: 'usg_abd', title: 'USG Whole Abdomen & Pelvis', code: 'USG-ABD', price: 1200 },
      { id: 'usg_obs', title: 'USG Obstetrics (Fetal Well-being)', code: 'USG-OBS', price: 1000 },
      { id: 'usg_kua', title: 'USG KUB (Kidney, Ureter, Bladder)', code: 'USG-KUB', price: 850 },
      { id: 'usg_thyroid', title: 'USG Thyroid & Neck', code: 'USG-THY', price: 1100 }
    ],
    'DIGITAL X-RAY': [
      { id: 'xray_chest', title: 'Digital Chest X-Ray (PA View)', code: 'XR-CHEST', price: 400 },
      { id: 'xray_spine', title: 'Digital Lumbar Spine X-Ray (AP/Lat)', code: 'XR-SPINE', price: 650 },
      { id: 'xray_knee', title: 'Digital Both Knee X-Ray', code: 'XR-KNEE', price: 550 }
    ],
    'ECG': [
      { id: 'ecg_12', title: '12-Lead ECG with Interpretation', code: 'ECG-12', price: 300 }
    ],
    'CT SCAN': [
      { id: 'ct_head', title: 'CT Head / Brain Plain', code: 'CT-HEAD', price: 2200 },
      { id: 'ct_chest', title: 'HRCT Chest', code: 'CT-CHEST', price: 3500 }
    ]
  };

  useEffect(() => {
    async function loadTests() {
      setLoading(true);
      try {
        const tests = await api.get('/lab/tests').catch(() => []);
        if (Array.isArray(tests) && tests.length > 0) {
          const formatted = tests.map(t => ({
            id: t._id || t.id,
            title: t.title || t.test || 'Lab Test',
            code: t.code || t.category || 'LAB',
            price: t.amount || t.price || 400,
            category: t.category || 'LAB'
          }));
          setAvailableTests(formatted);
        } else {
          setAvailableTests(fallbackCatalog[selectedCategory] || fallbackCatalog['LAB']);
        }
      } catch (err) {
        setAvailableTests(fallbackCatalog[selectedCategory] || fallbackCatalog['LAB']);
      } finally {
        setLoading(false);
      }
    }
    loadTests();
  }, [selectedCategory]);

  const currentList = (availableTests.length > 0 ? availableTests : (fallbackCatalog[selectedCategory] || fallbackCatalog['LAB']))
    .filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || t.code?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <TestTube className="w-4 h-4 text-orange-500" />
            <span>Select Tests for Category: <strong className="text-orange-600 font-bold">{selectedCategory}</strong></span>
          </h3>
          <p className="text-xs text-slate-500">Click a test to add/remove it from the current bill summary</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${selectedCategory} tests...`}
            className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500 mb-1" />
          <span className="text-xs">Loading available tests...</span>
        </div>
      ) : currentList.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs">
          No matching tests found for "{selectedCategory}". You can type a custom test name below.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {currentList.map((test) => {
            const isSelected = selectedServices.some(s => s.id === test.id || s.title === test.title);

            return (
              <div
                key={test.id || test.title}
                onClick={() => onToggleService(test)}
                className={`
                  p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-2
                  ${isSelected
                    ? 'border-orange-500 bg-orange-50/90 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/30'
                  }
                `}
              >
                <div className="space-y-0.5">
                  <p className={`text-xs font-semibold ${isSelected ? 'text-orange-900' : 'text-slate-800'}`}>
                    {test.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Code: <span className="font-mono">{test.code || 'LAB'}</span>
                  </p>
                  <p className="text-xs font-bold text-slate-900 pt-1">
                    ₹{test.price}
                  </p>
                </div>

                <div className={`
                  w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs mt-0.5
                  ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}
                `}>
                  {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
