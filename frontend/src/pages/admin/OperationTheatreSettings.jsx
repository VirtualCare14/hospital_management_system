import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Edit3, Trash2, Search, X, Loader2, Building2,
  CheckCircle, RefreshCw, IndianRupee, Save, Eye, FileText
} from 'lucide-react';
import client from '../../api/client';
import TemplateEditor from '../../components/TemplateEditor';

const OperationTheatreSettings = () => {
  const [activeTab, setActiveTab] = useState('theatres'); // 'theatres' or 'templates'

  // Operation Theatres State
  const [ots, setOts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOt, setEditingOt] = useState(null);
  const [form, setForm] = useState({ otName: '', description: '', location: '' });
  const [saving, setSaving] = useState(false);

  // OT Charges/Pricing Templates
  const [showChargesModal, setShowChargesModal] = useState(false);
  const [selectedOtForCharges, setSelectedOtForCharges] = useState(null);
  const [otPatients, setOtPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientCharges, setPatientCharges] = useState([]);
  const [savingCharges, setSavingCharges] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Consultation Templates State
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ templateName: '', templateHeading: '', content: '', isActive: true });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadOts = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : '';
      const { data } = await client.get(`/ipd/ot-management${params}`);
      setOts(data);
    } catch (err) {
      toast.error('Failed to load OTs');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const { data } = await client.get('/ipd/ot-templates');
      setTemplates(data);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'theatres') {
      loadOts();
    } else {
      loadTemplates();
    }
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadOts();
  };

  const openCreate = () => {
    setEditingOt(null);
    setForm({ otName: '', description: '', location: '' });
    setShowForm(true);
  };

  const openEdit = (ot) => {
    setEditingOt(ot);
    setForm({ otName: ot.otName, description: ot.description || '', location: ot.location || '' });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.otName.trim()) { toast.error('OT Name is required'); return; }
    setSaving(true);
    try {
      if (editingOt) {
        await client.put(`/ipd/ot-management/${editingOt._id}`, form);
        toast.success('OT updated');
      } else {
        await client.post('/ipd/ot-management', form);
        toast.success('OT created');
      }
      setShowForm(false);
      loadOts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ot) => {
    if (!window.confirm(`Delete ${ot.otCode} - ${ot.otName}?`)) return;
    try {
      await client.delete(`/ipd/ot-management/${ot._id}`);
      toast.success('OT deleted');
      loadOts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete OT');
    }
  };

  // Consultation Templates CRUD handlers
  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ templateName: '', templateHeading: '', content: '', isActive: true });
    setShowTemplateForm(true);
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      templateName: template.templateName,
      templateHeading: template.templateHeading,
      content: template.content,
      isActive: template.isActive
    });
    setShowTemplateForm(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.templateName.trim()) { toast.error('Template Name is required'); return; }
    if (!templateForm.templateHeading.trim()) { toast.error('Template Heading is required'); return; }
    if (!templateForm.content.trim()) { toast.error('Template Content is required'); return; }

    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        await client.put(`/ipd/ot-templates/${editingTemplate._id}`, templateForm);
        toast.success('Template updated successfully');
      } else {
        await client.post('/ipd/ot-templates', templateForm);
        toast.success('Template created successfully');
      }
      setShowTemplateForm(false);
      loadTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Delete template "${template.templateName}"?`)) return;
    try {
      await client.delete(`/ipd/ot-templates/${template._id}`);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const toggleTemplateActive = async (template) => {
    try {
      await client.put(`/ipd/ot-templates/${template._id}`, { isActive: !template.isActive });
      toast.success(`Template ${!template.isActive ? 'activated' : 'deactivated'}`);
      loadTemplates();
    } catch (err) {
      toast.error('Failed to update template status');
    }
  };

  // Open charges modal for a specific OT
  const openCharges = async (ot) => {
    setSelectedOtForCharges(ot);
    setSelectedPatient(null);
    setPatientCharges([{ chargeName: '', chargeAmount: '', isActive: true }]);
    setShowChargesModal(true);

    // Load patients with OT records for this OT
    setLoadingPatients(true);
    try {
      const { data: bookings } = await client.get(`/ipd/ot-management/bookings?otId=${ot._id}`);
      setOtPatients(bookings || []);
    } catch (err) {
      console.error('Failed to load OT patients:', err);
      setOtPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Load charges for selected patient
  const loadPatientCharges = async (booking) => {
    if (!booking?.otRecordId?._id && !booking?.otRecordId) {
      toast.error('No OT record found for this booking');
      return;
    }
    const otRecordId = booking.otRecordId?._id || booking.otRecordId;
    setSelectedPatient(booking);
    try {
      const { data: record } = await client.get(`/ipd/ot/${otRecordId}/full`);
      if (record.otCharges && record.otCharges.length > 0) {
        setPatientCharges(record.otCharges.map(c => ({ ...c })));
      } else {
        setPatientCharges([{ chargeName: '', chargeAmount: '', isActive: true }]);
      }
    } catch (err) {
      console.error('Failed to load patient charges:', err);
      setPatientCharges([{ chargeName: '', chargeAmount: '', isActive: true }]);
    }
  };

  const addCharge = () => {
    setPatientCharges(prev => [...prev, { chargeName: '', chargeAmount: '', isActive: true }]);
  };

  const removeCharge = (index) => {
    if (patientCharges.length <= 1) return;
    setPatientCharges(prev => prev.filter((_, i) => i !== index));
  };

  const updateCharge = (index, field, value) => {
    setPatientCharges(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const calculateTotal = () => {
    return patientCharges
      .filter(c => c.isActive !== false && c.chargeAmount)
      .reduce((sum, c) => sum + Number(c.chargeAmount), 0);
  };

  const handleSaveCharges = async () => {
    const invalid = patientCharges.some(c => !c.chargeName.trim() || !c.chargeAmount);
    if (invalid) {
      toast.error('Please fill in all charge names and amounts');
      return;
    }
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    const otRecordId = selectedPatient.otRecordId?._id || selectedPatient.otRecordId;
    if (!otRecordId) {
      toast.error('No OT record found');
      return;
    }

    setSavingCharges(true);
    try {
      await client.put(`/ipd/ot/${otRecordId}/charges`, {
        otCharges: patientCharges.map(c => ({
          chargeName: c.chargeName.trim(),
          chargeAmount: Number(c.chargeAmount),
          isActive: c.isActive !== false
        }))
      });
      toast.success('OT charges updated successfully for this patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save charges');
    } finally {
      setSavingCharges(false);
    }
  };

  const statusBadge = (status) => {
    const colors = { 'Active': 'bg-green-100 text-green-800', 'Inactive': 'bg-gray-100 text-gray-600' };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  const availabilityBadge = (status) => {
    const colors = { 'Available': 'bg-green-100 text-green-800', 'Occupied': 'bg-red-100 text-red-800', 'Maintenance': 'bg-yellow-100 text-yellow-800' };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Operation Theatre Settings</h1>
          <p className="text-sm text-gray-500">Configure and manage operation theatres, templates, & patient pricing</p>
        </div>
        {activeTab === 'theatres' ? (
          <button onClick={openCreate} className="btn text-sm py-2.5 px-4 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add OT
          </button>
        ) : (
          <button onClick={openCreateTemplate} className="btn text-sm py-2.5 px-4 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Template
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-orange-100">
        <button
          onClick={() => setActiveTab('theatres')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'theatres'
              ? 'border-orange-500 text-orange-950 bg-orange-50/20'
              : 'border-transparent text-gray-500 hover:text-orange-950 hover:bg-orange-50/10'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Operation Theatres
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-orange-500 text-orange-950 bg-orange-50/20'
              : 'border-transparent text-gray-500 hover:text-orange-950 hover:bg-orange-50/10'
          }`}
        >
          <FileText className="h-4 w-4" />
          Consultation Templates
        </button>
      </div>

      {/* Tab Contents: Theatres */}
      {activeTab === 'theatres' && (
        <>
          {/* Search */}
          <div className="card p-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" className="input pl-9 py-2.5" placeholder="Search by OT Code or Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button type="button" onClick={() => { setSearch(''); loadOts(); }} className="absolute right-2 top-2 p-1"><X className="h-4 w-4" /></button>}
              </div>
              <button type="submit" className="btn py-2.5 px-6"><Search className="h-4 w-4" /> Search</button>
              <button type="button" onClick={loadOts} className="btn-secondary py-2.5 px-4"><RefreshCw className="h-4 w-4" /></button>
            </form>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                    <th className="p-3 pl-4">OT Code</th>
                    <th className="p-3">OT Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Availability</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Total Bookings</th>
                    <th className="p-3 pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {loading ? (
                    <tr><td colSpan="7" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...</td></tr>
                  ) : ots.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-400"><Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="font-bold">No operation theatres found</p></td></tr>
                  ) : (
                    ots.map(ot => (
                      <tr key={ot._id} className="hover:bg-orange-50/20">
                        <td className="p-3 pl-4 font-mono font-bold text-orange-700">{ot.otCode}</td>
                        <td className="p-3 font-bold text-gray-800">{ot.otName}</td>
                        <td className="p-3">{statusBadge(ot.status)}</td>
                        <td className="p-3">{availabilityBadge(ot.availabilityStatus)}</td>
                        <td className="p-3 text-xs text-gray-500">{ot.location || '-'}</td>
                        <td className="p-3 text-xs font-bold">{ot.totalBookings || 0}</td>
                        <td className="p-3 pr-4">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => openCharges(ot)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Set Pricing"><IndianRupee className="h-3.5 w-3.5" /></button>
                            <button onClick={() => openEdit(ot)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(ot)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {ots.length > 0 && <div className="p-3 border-t border-orange-100 bg-orange-50/20 text-xs text-gray-500 text-center">Total OTs: {ots.length}</div>}
          </div>
        </>
      )}

      {/* Tab Contents: Consultation Templates */}
      {activeTab === 'templates' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                  <th className="p-3 pl-4">Template Name</th>
                  <th className="p-3">Heading / Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Updated</th>
                  <th className="p-3 pr-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {loadingTemplates ? (
                  <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading templates...</td></tr>
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-400" />
                      <p className="font-bold">No consultation templates found</p>
                      <button onClick={openCreateTemplate} className="mt-2 text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer">
                        Create Your First Template
                      </button>
                    </td>
                  </tr>
                ) : (
                  templates.map(template => (
                    <tr key={template._id} className="hover:bg-orange-50/20">
                      <td className="p-3 pl-4 font-bold text-gray-800">{template.templateName}</td>
                      <td className="p-3 text-xs text-gray-600 truncate max-w-[200px]" title={template.templateHeading}>
                        {template.templateHeading}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleTemplateActive(template)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors cursor-pointer ${
                            template.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {template.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {new Date(template.updatedAt).toLocaleDateString('en-IN', {
                          dateStyle: 'medium'
                        })}
                      </td>
                      <td className="p-3 pr-4">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => openEditTemplate(template)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer" title="Edit Template">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTemplate(template)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer" title="Delete Template">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {templates.length > 0 && <div className="p-3 border-t border-orange-100 bg-orange-50/20 text-xs text-gray-500 text-center">Total Templates: {templates.length}</div>}
        </div>
      )}

      {/* Forms and Modals */}
      {/* OT Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900">{editingOt ? 'Edit OT' : 'Add New OT'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">OT Code</label>
                <input className="input py-2.5 text-sm bg-gray-50" value={editingOt?.otCode || 'Auto-generated'} readOnly />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">OT Name <span className="text-red-500">*</span></label>
                <input className="input py-2.5 text-sm" value={form.otName} onChange={(e) => setForm(p => ({ ...p, otName: e.target.value }))} placeholder="e.g. Main Operation Theatre" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Description</label>
                <textarea className="input py-2.5 text-sm min-h-[60px] resize-y" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Location / Floor</label>
                <input className="input py-2.5 text-sm" value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Ground Floor" />
              </div>
              {editingOt && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Status</label>
                  <select className="input py-2.5 text-sm" value={editingOt.status} onChange={(e) => setEditingOt(p => ({ ...p, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2.5 px-4">Cancel</button>
                <button type="submit" disabled={saving} className="btn text-sm py-2.5 px-4">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin inline" /> : null}
                  {editingOt ? 'Update OT' : 'Create OT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consultation Template CRUD Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto" onClick={() => setShowTemplateForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  {editingTemplate ? 'Edit Consultation Template' : 'Add Consultation Template'}
                </h3>
                <p className="text-xs text-gray-500">Create standard consent forms and consultation summaries using variables</p>
              </div>
              <button onClick={() => setShowTemplateForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input py-2.5 text-sm"
                    value={templateForm.templateName}
                    onChange={(e) => setTemplateForm(p => ({ ...p, templateName: e.target.value }))}
                    placeholder="e.g. Surgery Informed Consent"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Internal name used for managing templates</p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Template Heading / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input py-2.5 text-sm"
                    value={templateForm.templateHeading}
                    onChange={(e) => setTemplateForm(p => ({ ...p, templateHeading: e.target.value }))}
                    placeholder="e.g. Informed Consent for Surgery and Anaesthesia"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Heading displayed at the top of the printed form</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Rich Text Content Editor <span className="text-red-500">*</span>
                </label>
                <TemplateEditor
                  value={templateForm.content}
                  onChange={(val) => setTemplateForm(p => ({ ...p, content: val }))}
                  placeholder="Draft your consent form here. Use the buttons below to insert placeholders that auto-populate patient info."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveTemplate"
                  checked={templateForm.isActive}
                  onChange={(e) => setTemplateForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500"
                />
                <label htmlFor="isActiveTemplate" className="text-xs font-bold text-gray-600 uppercase tracking-wide cursor-pointer select-none">
                  Make Template Active & Available in Workflows
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowTemplateForm(false)} className="btn-secondary text-sm py-2.5 px-4 cursor-pointer">Cancel</button>
                <button type="submit" disabled={savingTemplate} className="btn text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer">
                  {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingTemplate ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Charges Modal */}
      {showChargesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowChargesModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                  OT Pricing - {selectedOtForCharges?.otCode}
                </h3>
                <p className="text-xs text-gray-500">Set charges/pricing for patients in this OT</p>
              </div>
              <button onClick={() => setShowChargesModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>

            {/* Patient Selection */}
            <div className="mb-4">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Select Patient</label>
              {loadingPatients ? (
                <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading patients...</div>
              ) : otPatients.length === 0 ? (
                <p className="text-sm text-gray-400">No patients booked in this OT yet</p>
              ) : (
                <select className="input py-2.5 text-sm"
                  value={selectedPatient?._id || ''}
                  onChange={(e) => {
                    const booking = otPatients.find(b => b._id === e.target.value);
                    if (booking) loadPatientCharges(booking);
                  }}>
                  <option value="">Choose a patient...</option>
                  {otPatients.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.patientId?.patientName || 'Unknown'} ({b.patientId?.uhid || 'N/A'}) - {b.surgeryDate?.slice(0,10)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedPatient && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
                  <p className="font-semibold text-blue-800">{selectedPatient.patientId?.patientName}</p>
                  <p className="text-xs text-blue-600">UHID: {selectedPatient.patientId?.uhid} | Surgery: {selectedPatient.surgeryDate?.slice(0,10)}</p>
                </div>

                {/* Charges List */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-[1fr_120px_80px_40px] gap-3 text-xs font-bold text-gray-500 uppercase px-2">
                    <div>Charge Name</div>
                    <div>Amount (₹)</div>
                    <div className="text-center">Active</div>
                    <div></div>
                  </div>
                  {patientCharges.map((charge, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_120px_80px_40px] gap-3 items-center">
                      <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                        value={charge.chargeName} onChange={(e) => updateCharge(idx, 'chargeName', e.target.value)}
                        placeholder="e.g. OT Charges, Surgeon Fee..." />
                      <input type="number" min="0" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                        value={charge.chargeAmount} onChange={(e) => updateCharge(idx, 'chargeAmount', e.target.value)}
                        placeholder="Amount" />
                      <div className="flex justify-center">
                        <input type="checkbox" checked={charge.isActive !== false}
                          onChange={(e) => updateCharge(idx, 'isActive', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-green-600" />
                      </div>
                      <button onClick={() => removeCharge(idx)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={addCharge} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 mb-4">
                  <Plus className="h-4 w-4" /> Add Charge
                </button>

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">Total Charges:</span>
                  <span className="text-2xl font-black text-green-700">₹{calculateTotal().toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowChargesModal(false)} className="btn-secondary text-sm py-2.5 px-4">Close</button>
                  <button onClick={handleSaveCharges} disabled={savingCharges}
                    className="btn text-sm py-2.5 px-4 flex items-center gap-2">
                    {savingCharges ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Charges
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationTheatreSettings;