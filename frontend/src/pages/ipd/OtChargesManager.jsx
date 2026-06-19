import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, Save, Loader2, IndianRupee, Trash2 } from 'lucide-react';
import client from '../../api/client';

const OtChargesManager = ({ otRecord, onClose, onChargesUpdated }) => {
  const [charges, setCharges] = useState(
    (otRecord?.otCharges && otRecord.otCharges.length > 0)
      ? otRecord.otCharges.map(c => ({ ...c }))
      : [{ chargeName: '', chargeAmount: '', isActive: true }]
  );
  const [saving, setSaving] = useState(false);

  const addCharge = () => {
    setCharges(prev => [...prev, { chargeName: '', chargeAmount: '', isActive: true }]);
  };

  const removeCharge = (index) => {
    if (charges.length <= 1) {
      toast.error('At least one charge entry is required');
      return;
    }
    setCharges(prev => prev.filter((_, i) => i !== index));
  };

  const updateCharge = (index, field, value) => {
    setCharges(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const calculateTotal = () => {
    return charges
      .filter(c => c.isActive && c.chargeAmount)
      .reduce((sum, c) => sum + Number(c.chargeAmount), 0);
  };

  const handleSave = async () => {
    // Validate
    const invalid = charges.some(c => !c.chargeName.trim() || !c.chargeAmount);
    if (invalid) {
      toast.error('Please fill in all charge names and amounts');
      return;
    }

    setSaving(true);
    try {
      const chargesData = charges.map(c => ({
        chargeName: c.chargeName.trim(),
        chargeAmount: Number(c.chargeAmount),
        isActive: c.isActive !== false
      }));

      const { data } = await client.put(`/ipd/ot/${otRecord._id}/charges`, {
        otCharges: chargesData
      });

      toast.success('OT charges updated successfully');
      
      if (typeof onChargesUpdated === 'function') {
        onChargesUpdated(data.record);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update charges');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-600" />
              OT Charges / Pricing
            </h2>
            <p className="text-sm text-gray-600">
              Patient: {otRecord?.patientName} | UHID: {otRecord?.uhid}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-green-200 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            Configure OT charges/pricing for this patient. These charges will be linked with the patient's 
            OT case and available throughout the OT workflow and billing.
          </div>

          {/* Charges List */}
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_120px_80px_40px] gap-3 text-xs font-bold text-gray-500 uppercase px-2">
              <div>Charge Name</div>
              <div>Amount (₹)</div>
              <div className="text-center">Active</div>
              <div></div>
            </div>

            {charges.map((charge, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_120px_80px_40px] gap-3 items-center">
                <input type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  value={charge.chargeName}
                  onChange={(e) => updateCharge(idx, 'chargeName', e.target.value)}
                  placeholder="e.g. OT Charges, Surgeon Fee, Anesthesia..."
                />
                <input type="number" min="0"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  value={charge.chargeAmount}
                  onChange={(e) => updateCharge(idx, 'chargeAmount', e.target.value)}
                  placeholder="Amount"
                />
                <div className="flex justify-center">
                  <input type="checkbox"
                    checked={charge.isActive !== false}
                    onChange={(e) => updateCharge(idx, 'isActive', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </div>
                <button onClick={() => removeCharge(idx)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Button */}
          <button onClick={addCharge}
            className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Charge
          </button>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total Charges:</span>
            <span className="text-2xl font-black text-green-700">₹{calculateTotal().toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              : <><Save className="h-4 w-4" /> Save Charges</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtChargesManager;