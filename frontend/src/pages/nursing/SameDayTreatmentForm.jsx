import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Save, CheckCircle, Clock, User,
  Phone, CalendarDays, Eye, Printer, Download,
  Bandage, Bone, Flame, Wind, Syringe, Droplets, Plus, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const TREATMENT_META = {
  'Fracture': { icon: Bone, color: 'text-orange-500', bg: 'bg-orange-50' },
  'Minor Injury': { icon: Bandage, color: 'text-blue-500', bg: 'bg-blue-50' },
  'Minor Stitches': { icon: Syringe, color: 'text-purple-500', bg: 'bg-purple-50' },
  'Small Burns': { icon: Flame, color: 'text-red-500', bg: 'bg-red-50' },
  'Mild Allergic Reactions': { icon: Wind, color: 'text-green-500', bg: 'bg-green-50' },
  'Dialysis': { icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50' }
};

const SameDayTreatmentForm = () => {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const treatmentType = searchParams.get('type') || '';
  const recordId = searchParams.get('recordId');
  const viewMode = searchParams.get('view') === 'true';

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const meta = TREATMENT_META[treatmentType] || TREATMENT_META['Fracture'];
  const Icon = meta.icon;

  const [form, setForm] = useState({
    patientId: patientId || '',
    treatmentType: treatmentType,
    treatmentDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    treatmentNotes: '',
    prescription: '',
    followUpRequired: '',
    followUpDate: '',
    status: 'Draft'
  });

  const [items, setItems] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ itemType: '', itemName: '', quantity: 1, price: 0 });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: patientData } = await client.get(`/patients/${patientId}`);
        setPatient(patientData);

        if (recordId) {
          const { data: recData } = await client.get(`/nursing/treatment/${recordId}`);
          setRecord(recData);
          setForm({
            patientId: patientId,
            treatmentType: recData.treatmentType,
            treatmentDate: recData.treatmentDate ? new Date(recData.treatmentDate).toISOString().split('T')[0] : '',
            diagnosis: recData.diagnosis || '',
            treatmentNotes: recData.treatmentNotes || '',
            prescription: recData.prescription || '',
            followUpRequired: recData.followUpRequired || '',
            followUpDate: recData.followUpDate ? new Date(recData.followUpDate).toISOString().split('T')[0] : '',
            status: recData.status || 'Draft'
          });
          
          // Load items for this treatment
          const { data: itemsData } = await client.get(`/nursing/treatment/${recordId}/items`);
          setItems(itemsData || []);
        }
      } catch {
        toast.error('Failed to load patient data');
        navigate('/nursing');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patientId, recordId, navigate]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.diagnosis?.trim()) errors.diagnosis = 'Diagnosis is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (customStatus = null) => {
    if (!validate()) { toast.error('Please fill diagnosis'); return; }
    setSaving(true);
    try {
      const finalStatus = customStatus || form.status;
      const payload = {
        ...form,
        status: finalStatus,
        patientId,
        patientName: form.patientName || patient?.patientName || '',
        uhid: patient?.uhid || '',
        mobile: patient?.mobile || '',
        gender: patient?.gender || '',
        age: patient?.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : '',
        treatmentDate: form.treatmentDate ? new Date(form.treatmentDate) : new Date(),
        followUpDate: form.followUpDate ? new Date(form.followUpDate) : null
      };

      if (record?._id) {
        await client.put(`/nursing/treatment/${record._id}`, payload);
        toast.success(finalStatus === 'Completed' ? 'Treatment completed and sent to billing' : 'Treatment record updated');
      } else {
        const { data } = await client.post('/nursing/treatment', payload);
        toast.success(finalStatus === 'Completed' ? 'Treatment completed and sent to billing' : 'Treatment record saved');
        navigate(`/nursing/treatment/${patientId}?type=${treatmentType}&recordId=${data.record._id}`, { replace: true });
      }
      
      if (finalStatus === 'Completed') {
        navigate('/nursing');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => { window.print(); };
  const handleDownloadPdf = () => { toast.success('Use browser Print → Save as PDF'); window.print(); };

  const handleAddItem = async () => {
    if (!newItem.itemType || !newItem.itemName || !newItem.quantity || !newItem.price) {
      toast.error('All item fields are required');
      return;
    }
    if (!recordId) {
      toast.error('Save treatment record first');
      return;
    }
    try {
      const { data } = await client.post(`/nursing/treatment/${recordId}/items`, {
        itemType: newItem.itemType,
        itemName: newItem.itemName,
        quantity: parseInt(newItem.quantity),
        price: parseFloat(newItem.price)
      });
      setItems(data.record.items || []);
      setNewItem({ itemType: '', itemName: '', quantity: 1, price: 0 });
      setShowAddItem(false);
      toast.success('Item added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!recordId) return;
    if (!window.confirm('Remove this item?')) return;
    try {
      const { data } = await client.delete(`/nursing/treatment/${recordId}/items/${itemId}`);
      setItems(data.record.items || []);
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const inputClass = (field) =>
    `input py-2.5 text-sm ${validationErrors[field] ? 'border-red-400 ring-1 ring-red-200' : ''} ${viewMode ? 'bg-gray-50' : ''}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-bold">Loading...</span>
        </div>
      </div>
    );
  }

  const treatmentLabel = treatmentType || 'Treatment';

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header - Hidden when printing */}
      <div className="no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/nursing')} className="p-2 rounded-xl hover:bg-orange-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Icon className={`h-6 w-6 ${meta.color}`} />
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{treatmentLabel} Treatment Form</h1>
            </div>
            <p className="text-sm text-gray-500">Nursing Module - Same Day Treatment</p>
          </div>
          <div className="flex items-center gap-2">
            {form.status === 'Completed' ? (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3" /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3" /> Draft
              </span>
            )}
          </div>
        </div>

        {!viewMode && form.status !== 'Completed' && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => handleSave()} disabled={saving} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button onClick={() => handleSave('Completed')} disabled={saving} className="btn text-sm py-2.5 px-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Complete Treatment
            </button>
            <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
              <Eye className="h-4 w-4" /> {showPreview ? 'Hide Preview' : 'View Report'}
            </button>
          </div>
        )}

        {viewMode && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={handlePrint} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={handleDownloadPdf} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Patient Info Card */}
      <div className={`card p-5 ${meta.bg} border-l-4 border-l-orange-400`}>
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 text-white p-3 rounded-2xl">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">{patient?.patientName || form.patientName}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
              <span className="font-mono font-bold text-orange-700">{formatUhid(patient?.uhid)}</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{patient?.mobile}</span>
              <span>{patient?.gender}</span>
              {patient?.dob && (
                <span>{Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))} years</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Treatment Details */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <Icon className={`h-5 w-5 ${meta.color}`} />
            <h3 className="font-extrabold text-gray-900">{treatmentLabel} - Treatment Details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Treatment Date</label>
              <input type="date" className="input py-2.5 text-sm" value={form.treatmentDate}
                readOnly={viewMode} onChange={(e) => handleChange('treatmentDate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <textarea className={`${inputClass('diagnosis')} min-h-[100px] resize-y`} value={form.diagnosis}
              readOnly={viewMode} onChange={(e) => handleChange('diagnosis', e.target.value)}
              placeholder={`Enter ${treatmentLabel.toLowerCase()} diagnosis...`} />
            {validationErrors.diagnosis && <p className="text-xs text-red-500 mt-1">{validationErrors.diagnosis}</p>}
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Treatment Notes</label>
            <textarea className="input py-2.5 text-sm min-h-[120px] resize-y" value={form.treatmentNotes}
              readOnly={viewMode} onChange={(e) => handleChange('treatmentNotes', e.target.value)}
              placeholder={`Describe the ${treatmentLabel.toLowerCase()} treatment provided...`} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Prescription</label>
            <textarea className="input py-2.5 text-sm min-h-[80px] resize-y" value={form.prescription}
              readOnly={viewMode} onChange={(e) => handleChange('prescription', e.target.value)}
              placeholder="Medication prescribed (if any)..." />
          </div>
        </div>

        {/* Follow Up */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Follow Up</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Follow Up Required</label>
              <select className="input py-2.5 text-sm" value={form.followUpRequired}
                disabled={viewMode} onChange={(e) => handleChange('followUpRequired', e.target.value)}>
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {form.followUpRequired === 'Yes' && (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Follow Up Date</label>
                <input type="date" className="input py-2.5 text-sm" value={form.followUpDate}
                  readOnly={viewMode} onChange={(e) => handleChange('followUpDate', e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* Billing Items */}
        {recordId && (
          <div className="card p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-orange-500" />
                <h3 className="font-extrabold text-gray-900">Consumables & Services</h3>
              </div>
              {!viewMode && (
                <button onClick={() => setShowAddItem(!showAddItem)} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Add Item
                </button>
              )}
            </div>

            {showAddItem && (
              <div className="border-l-4 border-l-orange-400 bg-orange-50 p-4 rounded-r-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Item Type</label>
                    <select className="input py-2.5 text-sm" value={newItem.itemType} 
                      onChange={(e) => setNewItem({ ...newItem, itemType: e.target.value })}>
                      <option value="">Select Type</option>
                      <option value="Consumable">Consumable</option>
                      <option value="Lab Test">Lab Test</option>
                      <option value="Medicine">Medicine</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Item Name</label>
                    <input type="text" className="input py-2.5 text-sm" placeholder="e.g., Bandages, X-ray"
                      value={newItem.itemName} onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Quantity</label>
                    <input type="number" className="input py-2.5 text-sm" min="1"
                      value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Price</label>
                    <input type="number" className="input py-2.5 text-sm" min="0" step="0.01"
                      value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddItem} className="btn-primary text-xs py-2 px-4 flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Add Item
                  </button>
                  <button onClick={() => { setShowAddItem(false); setNewItem({ itemType: '', itemName: '', quantity: 1, price: 0 }); }} 
                    className="btn-secondary text-xs py-2 px-4">Cancel</button>
                </div>
              </div>
            )}

            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-orange-50 border-b border-orange-200">
                      <th className="text-left p-3 font-bold text-gray-700">Type</th>
                      <th className="text-left p-3 font-bold text-gray-700">Item Name</th>
                      <th className="text-center p-3 font-bold text-gray-700">Qty</th>
                      <th className="text-right p-3 font-bold text-gray-700">Price</th>
                      <th className="text-right p-3 font-bold text-gray-700">Total</th>
                      {!viewMode && <th className="text-center p-3 font-bold text-gray-700">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 text-gray-600">{item.itemType}</td>
                        <td className="p-3 text-gray-900 font-semibold">{item.itemName}</td>
                        <td className="p-3 text-center text-gray-600">{item.quantity}</td>
                        <td className="p-3 text-right text-gray-700">₹{item.price?.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-orange-600">₹{(item.quantity * item.price).toFixed(2)}</td>
                        {!viewMode && (
                          <td className="p-3 text-center">
                            <button onClick={() => handleRemoveItem(item._id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-orange-50 font-bold">
                      <td colSpan={4} className="p-3 text-right">Total:</td>
                      <td className="p-3 text-right text-orange-700">₹{items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No items added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Print-only Report */}
      <div className="hidden print:block">
        <div className="p-8 text-gray-900">
          <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center">
            <h1 className="text-xl font-black">SAME DAY TREATMENT REPORT</h1>
            <h2 className="text-lg font-bold mt-1">{treatmentLabel}</h2>
          </div>
          <div className="border border-gray-800 rounded-lg mb-4 p-4">
            <h3 className="font-bold text-sm mb-2">Patient Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-bold">Name:</span> {patient?.patientName || form.patientName}</div>
              <div><span className="font-bold">UHID:</span> {formatUhid(patient?.uhid)}</div>
              <div><span className="font-bold">Mobile:</span> {patient?.mobile}</div>
              <div><span className="font-bold">Gender:</span> {patient?.gender}</div>
            </div>
          </div>
          <div className="border border-gray-800 rounded-lg mb-4 p-4">
            <h3 className="font-bold text-sm mb-2">Treatment Details</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-bold">Date:</span> {form.treatmentDate ? new Date(form.treatmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</div>
              <div><span className="font-bold">Diagnosis:</span><p className="mt-1 whitespace-pre-wrap">{form.diagnosis || '-'}</p></div>
              <div><span className="font-bold">Treatment Notes:</span><p className="mt-1 whitespace-pre-wrap">{form.treatmentNotes || '-'}</p></div>
              <div><span className="font-bold">Prescription:</span><p className="mt-1 whitespace-pre-wrap">{form.prescription || '-'}</p></div>
              <div><span className="font-bold">Follow Up:</span> {form.followUpRequired || '-'} {form.followUpDate ? `(${new Date(form.followUpDate).toLocaleDateString()})` : ''}</div>
            </div>
          </div>
          <div className="border-t-2 border-gray-800 pt-4 mt-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-gray-500">Generated By</p><p className="font-bold">{user?.doctorName || user?.username || '-'}</p></div>
              <div className="text-center"><p className="text-xs text-gray-500 mb-8">Doctor's Signature</p><div className="border-t border-gray-400 pt-1"><p className="text-xs text-gray-500">Authorized Signatory</p></div></div>
              <div className="text-right"><div className="inline-block border border-gray-400 px-4 py-1"><p className="text-xs font-bold">HOSPITAL SEAL</p></div></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media print { body { background: white; font-size: 12pt; } .no-print { display: none !important; } .print\\:block { display: block !important; } .card { border: 1px solid #ddd !important; box-shadow: none !important; } @page { margin: 15mm; } }`}</style>
    </div>
  );
};

export default SameDayTreatmentForm;