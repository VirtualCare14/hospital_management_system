import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Loader2, DollarSign } from 'lucide-react';
import client from '../../api/client';

const TREATMENTS = [
  { id: 'Fracture', label: 'Fracture' },
  { id: 'Minor Injury', label: 'Minor Injury' },
  { id: 'Minor Stitches', label: 'Minor Stitches' },
  { id: 'Small Burns', label: 'Small Burns' },
  { id: 'Mild Allergic Reactions', label: 'Mild Allergic Reactions' },
  { id: 'Dialysis', label: 'Dialysis' }
];

const SameDayTreatmentSettings = () => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/ipd/settings');
      const savedPrices = data.sameDayTreatmentPrices || [];
      const priceMap = {};
      TREATMENTS.forEach(t => {
        const saved = savedPrices.find(p => p.name === t.id);
        priceMap[t.id] = saved ? saved.price : getDefaultPrice(t.id);
      });
      setPrices(priceMap);
    } catch (err) {
      toast.error('Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPrice = (name) => {
    const defaults = { 'Fracture': 500, 'Minor Injury': 300, 'Minor Stitches': 400, 'Small Burns': 350, 'Mild Allergic Reactions': 250, 'Dialysis': 2000 };
    return defaults[name] || 0;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sameDayTreatmentPrices = TREATMENTS.map(t => ({
        name: t.id,
        price: Number(prices[t.id]) || 0,
        isActive: true
      }));
      await client.put('/ipd/settings', { sameDayTreatmentPrices });
      toast.success('Treatment prices saved');
    } catch (err) {
      toast.error('Failed to save prices');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Same Day Treatment Pricing</h1>
          <p className="text-sm text-gray-500">Set pricing for nursing treatments (nursing staff cannot see prices)</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn text-sm py-2.5 px-4 flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Prices
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TREATMENTS.map(t => (
          <div key={t.id} className="card p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-gray-900">{t.label}</h3>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                className="input pl-8 py-2.5 text-lg font-bold"
                value={prices[t.id] || ''}
                onChange={(e) => setPrices(p => ({ ...p, [t.id]: e.target.value }))}
              />
            </div>
            {t.id === 'Dialysis' && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">Placeholder - Form will be provided later</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SameDayTreatmentSettings;