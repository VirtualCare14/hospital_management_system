'use client';

import { useEffect } from 'react';
import { 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  Loader2, 
  IndianRupee,
  Sparkles
} from 'lucide-react';

export default function PaymentDetails({
  selectedServices,
  paymentData,
  setPaymentData,
  onRemoveService,
  onCreateBill,
  submitting
}) {
  const totalAmount = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const discountPercent = Number(paymentData.discountPercent) || 0;
  const discountAmount = (totalAmount * discountPercent) / 100;
  const netTotal = Math.max(0, totalAmount - discountAmount);

  // Auto-fill amountReceived with netTotal whenever total amount or discount changes (unless manually edited)
  useEffect(() => {
    if (!paymentData.isManualAmountReceived) {
      setPaymentData(prev => ({
        ...prev,
        amountReceived: String(netTotal)
      }));
    }
  }, [netTotal, paymentData.isManualAmountReceived, setPaymentData]);

  const amountReceived = paymentData.amountReceived !== undefined && paymentData.amountReceived !== '' 
    ? Number(paymentData.amountReceived) 
    : netTotal;
  const balance = Math.max(0, netTotal - amountReceived);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'amountReceived' ? { isManualAmountReceived: true } : {})
    }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-orange-500" />
          <span>Payment Details</span>
        </h2>
        <span className="text-xs text-slate-500">
          {selectedServices.length} Test(s) Selected
        </span>
      </div>

      {/* Selected Services Summary Table */}
      {selectedServices.length > 0 && (
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Selected Tests & Services
          </p>
          <div className="divide-y divide-slate-200/60 max-h-40 overflow-y-auto pr-1">
            {selectedServices.map((s, idx) => (
              <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{s.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({s.code || 'LAB'})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900">₹{s.price}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveService(s)}
                    className="text-slate-400 hover:text-red-500 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Structure for Calculations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Numeric inputs & calculation */}
        <div className="space-y-3">
          {/* Total */}
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-600">Total</span>
            <span className="text-sm font-bold text-slate-900">₹{totalAmount.toFixed(2)}</span>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <label className="text-xs font-medium text-slate-600">Discount (%)</label>
            <div className="w-32 relative">
              <input
                type="number"
                name="discountPercent"
                min="0"
                max="100"
                value={paymentData.discountPercent || ''}
                onChange={handleChange}
                placeholder="0"
                className="lab-input text-right pr-7 h-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* Amount Received */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <label className="text-xs font-medium text-slate-600">Amount Received</label>
            <div className="w-32 relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                name="amountReceived"
                min="0"
                value={paymentData.amountReceived || ''}
                onChange={handleChange}
                placeholder="0.00"
                className="lab-input text-right pl-6 h-8 font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Balance — Visually Prominent */}
          <div className="flex items-center justify-between py-2.5 px-3 bg-orange-50/80 border border-orange-200 rounded-lg">
            <span className="text-xs font-bold text-orange-900 uppercase tracking-wide">
              Balance Due
            </span>
            <span className={`text-base font-extrabold ${balance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
              ₹{balance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right Column: Payment Mode & Remarks */}
        <div className="space-y-3">
          {/* Payment Mode */}
          <div>
            <label className="lab-label lab-label-required">Payment Mode</label>
            <select
              name="paymentMode"
              value={paymentData.paymentMode || 'Cash'}
              onChange={handleChange}
              className="lab-input text-xs font-medium"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="lab-label">Remarks / Payment Notes</label>
            <textarea
              name="remarks"
              rows="3"
              value={paymentData.remarks || ''}
              onChange={handleChange}
              placeholder="Enter reference ID, transaction notes, or lab remarks..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Bottom CTA Button: Create Bill */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
        <button
          type="button"
          disabled={submitting || selectedServices.length === 0}
          onClick={onCreateBill}
          className={`
            h-11 px-8 rounded-lg font-semibold text-sm text-white flex items-center gap-2 shadow-md transition-all cursor-pointer
            ${selectedServices.length === 0
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 active:scale-[0.99]'
            }
          `}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Bill...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Bill</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
