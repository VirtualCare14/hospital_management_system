import { useState } from 'react';
import { Printer, Globe, X, Check } from 'lucide-react';
import { languages } from '../utils/options';

export default function PrintLanguageModal({ isOpen, onClose, onConfirm, initialLanguage = 'English' }) {
  const [selectedLang, setSelectedLang] = useState(initialLanguage);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedLang);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Print Language</h3>
              <p className="text-xs text-slate-500">Choose the language for the printed prescription receipt</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Options Grid */}
        <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {languages.map((langItem) => {
            const langVal = typeof langItem === 'object' ? langItem.value : langItem;
            const langLabel = typeof langItem === 'object' ? (langItem.label || langItem.value) : langItem;
            const isSelected = selectedLang === langVal;

            return (
              <button
                key={langVal}
                type="button"
                onClick={() => setSelectedLang(langVal)}
                className={`
                  p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer text-xs font-semibold
                  ${isSelected
                    ? 'border-orange-500 bg-orange-50/90 text-orange-900 ring-1 ring-orange-500/30 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/30'
                  }
                `}
              >
                <span>{langLabel}</span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Prescription</span>
          </button>
        </div>
      </div>
    </div>
  );
}
