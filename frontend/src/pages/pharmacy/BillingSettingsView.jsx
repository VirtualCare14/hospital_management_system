import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  Settings, Loader2, Check, Search, Trash2, Save, X, 
  ChevronLeft, ChevronRight, Package, Percent, FileText, FileSpreadsheet, Plus
} from 'lucide-react';
import client from '../../api/client';
import ExcelUploadView from './ExcelUploadView';

const BillingSettingsView = ({ isAdmin = false }) => {
  const [activeSubTab, setActiveSubTab] = useState('parameters'); // 'parameters' | 'medicines' | 'excel-upload'

  // Parameters States
  const [gstEnabled, setGstEnabled] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [loadingParams, setLoadingParams] = useState(false);
  const [savingParams, setSavingParams] = useState(false);

  // Medicine Management States
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [edits, setEdits] = useState({});
  const [savingItemId, setSavingItemId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    itemName: '',
    batch: '',
    pack: '0',
    mrp: 0,
    quantity: 0,
    rate: 0,
    dis: 0,
    expiry: '',
    hsn: '0',
    sgst: 0,
    cst: 0
  });

  // Fetch Parameters Configuration
  const fetchSettings = useCallback(async () => {
    setLoadingParams(true);
    try {
      const { data } = await client.get('/pharmacy/billing/settings');
      setGstEnabled(data.gstEnabled);
      setEmailAddress(data.emailAddress || '');
      setGstNumber(data.gstNumber || '');
      setTermsAndConditions(data.termsAndConditions || '');
      setThankYouMessage(data.thankYouMessage || '');
    } catch (err) {
      toast.error('Failed to load pharmacy settings');
    } finally {
      setLoadingParams(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save Parameters
  const handleSubmitSettings = async (e) => {
    e.preventDefault();
    setSavingParams(true);
    try {
      await client.put('/pharmacy/billing/settings', {
        gstEnabled,
        emailAddress,
        gstNumber,
        termsAndConditions,
        thankYouMessage
      });
      toast.success('Pharmacy settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings changes');
    } finally {
      setSavingParams(false);
    }
  };

  // Fetch Inventory for Medicine Management
  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const { data } = await client.get(
        `/pharmacy/inventory?search=${encodeURIComponent(searchQuery)}&page=${page}&limit=20`
      );
      setInventoryItems(data.items || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to search medicines');
    } finally {
      setLoadingInventory(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    if (activeSubTab === 'medicines') {
      fetchInventory();
    }
  }, [fetchInventory, activeSubTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInventory();
  };

  // Track field changes for inline edit
  const handleFieldChange = (itemId, field, val) => {
    setEdits(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val
      }
    }));
  };

  const getFieldValue = (item, field) => {
    if (edits[item._id] && edits[item._id][field] !== undefined) {
      return edits[item._id][field];
    }
    if (field === 'expiry') {
      return item.expiry ? new Date(item.expiry).toISOString().split('T')[0] : '';
    }
    return item[field] ?? '';
  };

  // Save Inline Changes
  const handleSaveItem = async (item) => {
    const itemEdits = edits[item._id];
    if (!itemEdits || Object.keys(itemEdits).length === 0) {
      toast.error('No changes to save.');
      return;
    }
    setSavingItemId(item._id);
    try {
      const qty = itemEdits.quantity !== undefined ? Number(itemEdits.quantity) : item.quantity;
      const rate = itemEdits.rate !== undefined ? Number(itemEdits.rate) : item.rate;
      const finalAmount = qty * rate;

      await client.put(`/pharmacy/inventory/${item._id}`, {
        ...itemEdits,
        amount: finalAmount
      });
      toast.success('Medicine updated successfully!');
      
      // Update item locally
      setInventoryItems(prev => prev.map(it => {
        if (it._id === item._id) {
          return {
            ...it,
            ...itemEdits,
            amount: finalAmount
          };
        }
        return it;
      }));

      // Clear local edits state for this item
      setEdits(prev => {
        const copy = { ...prev };
        delete copy[item._id];
        return copy;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update medicine');
    } finally {
      setSavingItemId(null);
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this medicine batch from the inventory? This cannot be undone.')) {
      return;
    }
    setDeletingItemId(itemId);
    try {
      await client.delete(`/pharmacy/inventory/${itemId}`);
      toast.success('Medicine deleted from inventory successfully!');
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete medicine');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleAddMedChange = (field, val) => {
    setNewMed(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    if (!newMed.itemName.trim() || !newMed.batch.trim() || !newMed.expiry) {
      toast.error('Item Name, Batch, and Expiry Date are required.');
      return;
    }

    setSavingItemId('new'); // mock loading state
    try {
      await client.post('/pharmacy/inventory', newMed);
      toast.success('Medicine added successfully to stock!');
      // Reset form
      setNewMed({
        itemName: '',
        batch: '',
        pack: '0',
        mrp: 0,
        quantity: 0,
        rate: 0,
        dis: 0,
        expiry: '',
        hsn: '0',
        sgst: 0,
        cst: 0
      });
      setShowAddForm(false);
      // Refresh list
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add medicine to inventory');
    } finally {
      setSavingItemId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-700 w-full max-w-none">
      {/* Sub Tabs */}
      <div className="flex border-b border-orange-100 gap-1.5 select-none">
        <button 
          onClick={() => setActiveSubTab('parameters')}
          className={`px-4.5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'parameters' 
              ? 'border-orange-500 text-orange-655 font-extrabold' 
              : 'border-transparent text-gray-500 hover:text-gray-750'
          }`}
        >
          <Settings className="h-4 w-4" />
          Billing & Tax Parameters
        </button>
        <button 
          onClick={() => setActiveSubTab('medicines')}
          className={`px-4.5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'medicines' 
              ? 'border-orange-500 text-orange-655 font-extrabold' 
              : 'border-transparent text-gray-500 hover:text-gray-750'
          }`}
        >
          <Package className="h-4 w-4" />
          Manage Medicines (Search / Edit / Delete)
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveSubTab('excel-upload')}
            className={`px-4.5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'excel-upload' 
                ? 'border-orange-500 text-orange-655 font-extrabold' 
                : 'border-transparent text-gray-500 hover:text-gray-750'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel Upload / Purchase
          </button>
        )}
      </div>

      {/* PARAMETERS CONFIGURATION PANEL */}
      {activeSubTab === 'parameters' && (
        <div className="max-w-2xl animate-fade-in">
          <div className="card p-6 bg-white border border-orange-100 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-orange-50 pb-2">
              <Settings className="text-orange-500 h-5 w-5" />
              <h3 className="font-extrabold text-gray-900 text-sm">Configure Pharmacy Billing & Tax Parameters</h3>
            </div>

            {loadingParams ? (
              <div className="py-12 text-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500 inline mr-1" /> Loading configurations...
              </div>
            ) : (
              <form onSubmit={handleSubmitSettings} className="space-y-4 text-xs">
                {/* GST Config Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-orange-50/20 border border-orange-100 rounded-2xl">
                  <div>
                    <p className="font-extrabold text-gray-800">GST Invoice Calculations</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">When disabled, item tax rates are ignored during bill calculations.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setGstEnabled(!gstEnabled)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-350 focus:outline-none cursor-pointer ${
                      gstEnabled ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                      gstEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}></span>
                  </button>
                </div>

                {/* Email and GSTIN inputs */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold text-gray-555">Pharmacy GSTIN Number</label>
                    <input 
                      type="text" 
                      disabled={!gstEnabled}
                      className="input py-2 text-xs font-mono uppercase" 
                      placeholder="e.g. 27AAAAA1111A1Z1"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-gray-555">Support Email Address</label>
                    <input 
                      type="email" 
                      className="input py-2 text-xs" 
                      placeholder="e.g. pharmacy@hospital.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="mb-1 block font-bold text-gray-555">Custom Invoice Terms & Conditions</label>
                  <textarea 
                    className="input py-2 text-xs h-[80px] whitespace-pre-line leading-relaxed" 
                    placeholder="Write invoice guidelines (e.g. Medicines once sold cannot be returned after 7 days)..."
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                  />
                </div>

                {/* Thank you message */}
                <div>
                  <label className="mb-1 block font-bold text-gray-555">A4 Invoice Footnote (Thank you message)</label>
                  <input 
                    type="text" 
                    className="input py-2 text-xs" 
                    placeholder="e.g. Thank you for choosing our pharmacy! Get well soon."
                    value={thankYouMessage}
                    onChange={(e) => setThankYouMessage(e.target.value)}
                  />
                </div>

                <div className="flex justify-end border-t border-orange-50 pt-4">
                  <button 
                    type="submit" 
                    disabled={savingParams}
                    className="btn py-2 px-6 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:bg-orange-300"
                  >
                    {savingParams ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save Settings Configuration
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MEDICINE MANAGEMENT PANEL */}
      {activeSubTab === 'medicines' && (
        <div className="space-y-4 animate-fade-in">
          {/* Search Box */}
          <div className="card p-5 bg-white border border-orange-100 shadow-md">
            <form onSubmit={handleSearchSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by medicine name or batch code to edit..." 
                  className="input pl-10 text-sm py-2.5" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={loadingInventory}
                className="btn py-2.5 px-6 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {loadingInventory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search Stock'}
              </button>
              <button 
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn py-2.5 px-6 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0"
              >
                <Plus className="h-4 w-4" /> Add Medicine
              </button>
            </form>
          </div>

          {/* Add Medicine Form Card */}
          {showAddForm && (
            <div className="card p-6 bg-white border border-orange-100 shadow-lg animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-orange-50 pb-2">
                <h4 className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5">
                  <Package className="text-orange-500 h-4.5 w-4.5" />
                  Add New Medicine to Stock
                </h4>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <form onSubmit={handleCreateMedicine} className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 text-xs">
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-bold text-gray-550">Item Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="input py-2 text-xs" 
                    placeholder="e.g. Paracetamol 650"
                    value={newMed.itemName}
                    onChange={(e) => handleAddMedChange('itemName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-550">Batch *</label>
                  <input 
                    type="text" 
                    required 
                    className="input py-2 text-xs font-mono uppercase" 
                    placeholder="e.g. B123"
                    value={newMed.batch}
                    onChange={(e) => handleAddMedChange('batch', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">Pack</label>
                  <input 
                    type="text" 
                    className="input py-2 text-xs" 
                    placeholder="e.g. 10 Tab"
                    value={newMed.pack}
                    onChange={(e) => handleAddMedChange('pack', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">MRP (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input py-2 text-xs" 
                    value={newMed.mrp || ''}
                    onChange={(e) => handleAddMedChange('mrp', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">Qty</label>
                  <input 
                    type="number" 
                    className="input py-2 text-xs" 
                    value={newMed.quantity || ''}
                    onChange={(e) => handleAddMedChange('quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">Rate (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input py-2 text-xs" 
                    value={newMed.rate || ''}
                    onChange={(e) => handleAddMedChange('rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">Disc%</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="input py-2 text-xs" 
                    value={newMed.dis || ''}
                    onChange={(e) => handleAddMedChange('dis', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">Expiry Date *</label>
                  <input 
                    type="date" 
                    required 
                    className="input py-2 text-xs" 
                    value={newMed.expiry}
                    onChange={(e) => handleAddMedChange('expiry', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">HSN</label>
                  <input 
                    type="text" 
                    className="input py-2 text-xs" 
                    value={newMed.hsn}
                    onChange={(e) => handleAddMedChange('hsn', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">SGST%</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="input py-2 text-xs" 
                    value={newMed.sgst || ''}
                    onChange={(e) => handleAddMedChange('sgst', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-555">CST%</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="input py-2 text-xs" 
                    value={newMed.cst || ''}
                    onChange={(e) => handleAddMedChange('cst', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-full flex justify-end gap-2 border-t border-orange-50 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    className="btn-secondary py-2 px-4 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={savingItemId === 'new'}
                    className="btn py-2 px-5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {savingItemId === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Add to Stock
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Medicines Management Table */}
          <div className="card bg-white border border-orange-100 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1850px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-[10px] font-extrabold uppercase text-gray-600 border-b border-orange-100 select-none">
                    <th className="p-3 pl-4 w-[240px]">Item Name</th>
                    <th className="p-3 w-[150px]">Batch</th>
                    <th className="p-3 w-[110px]">Pack</th>
                    <th className="p-3 w-[110px]">MRP (₹)</th>
                    <th className="p-3 w-[100px]">Qty</th>
                    <th className="p-3 w-[130px]">Rate (₹)</th>
                    <th className="p-3 w-[90px]">Disc%</th>
                    <th className="p-3 w-[160px]">Expiry</th>
                    <th className="p-3 w-[110px]">HSN</th>
                    <th className="p-3 w-[90px]">SGST%</th>
                    <th className="p-3 w-[90px]">CST%</th>
                    <th className="p-3 pr-4 text-center w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 font-medium text-gray-700">
                  {loadingInventory ? (
                    <tr>
                      <td colSpan="12" className="p-10 text-center text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500 mb-2" />
                        <p className="font-bold">Fetching inventory details...</p>
                      </td>
                    </tr>
                  ) : inventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="p-10 text-center text-gray-400 font-bold">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
                        No inventory medicines found matching your search.
                      </td>
                    </tr>
                  ) : (
                    inventoryItems.map((item) => {
                      const isSaving = savingItemId === item._id;
                      const isDeleting = deletingItemId === item._id;
                      const hasLocalEdits = edits[item._id] && Object.keys(edits[item._id]).length > 0;

                      return (
                        <tr key={item._id} className="hover:bg-orange-55/20 transition align-middle">
                          {/* Item Name */}
                          <td className="p-2 pl-4">
                            <input 
                              type="text" 
                              className="input py-1 px-1.5 text-xs bg-gray-50 border-orange-50 focus:bg-white w-[220px]" 
                              value={getFieldValue(item, 'itemName')}
                              onChange={(e) => handleFieldChange(item._id, 'itemName', e.target.value)}
                            />
                          </td>
                          {/* Batch */}
                          <td className="p-2">
                            <input 
                              type="text" 
                              className="input py-1 px-1.5 text-xs bg-gray-50 border-orange-50 font-mono focus:bg-white w-[130px]" 
                              value={getFieldValue(item, 'batch')}
                              onChange={(e) => handleFieldChange(item._id, 'batch', e.target.value)}
                            />
                          </td>
                          {/* Pack */}
                          <td className="p-2">
                            <input 
                              type="text" 
                              className="input py-1 px-1 text-xs text-center bg-gray-50 border-orange-50 focus:bg-white w-[90px]" 
                              value={getFieldValue(item, 'pack')}
                              onChange={(e) => handleFieldChange(item._id, 'pack', e.target.value)}
                            />
                          </td>
                          {/* MRP */}
                          <td className="p-2">
                            <input 
                              type="number" 
                              step="0.01"
                              className="input py-1 px-1 text-xs text-center bg-gray-50 border-orange-50 focus:bg-white w-[90px]" 
                              value={getFieldValue(item, 'mrp')}
                              onChange={(e) => handleFieldChange(item._id, 'mrp', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          {/* Qty */}
                          <td className="p-2">
                            <input 
                              type="number" 
                              className="input py-1 px-1 text-xs text-center bg-gray-50 border-orange-50 focus:bg-white w-[80px]" 
                              value={getFieldValue(item, 'quantity')}
                              onChange={(e) => handleFieldChange(item._id, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          {/* Rate */}
                          <td className="p-2">
                            <input 
                              type="number" 
                              step="0.01"
                              className="input py-1 px-1 text-xs text-center bg-gray-50 border-orange-50 focus:bg-white w-[110px]" 
                              value={getFieldValue(item, 'rate')}
                              onChange={(e) => handleFieldChange(item._id, 'rate', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          {/* Discount */}
                          <td className="p-2">
                            <input 
                              type="number" 
                              className="input py-1 px-1 text-xs text-center bg-gray-50 border-orange-50 focus:bg-white w-[70px]" 
                              value={getFieldValue(item, 'dis')}
                              onChange={(e) => handleFieldChange(item._id, 'dis', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          {/* Expiry */}
                          <td className="p-2">
                            <input 
                              type="date" 
                              className="input py-1 px-1.5 text-xs bg-gray-50 border-orange-50 focus:bg-white w-[140px]" 
                              value={getFieldValue(item, 'expiry')}
                              onChange={(e) => handleFieldChange(item._id, 'expiry', e.target.value)}
                            />
                          </td>
                          {/* HSN */}
                          <td className="p-2">
                            <input 
                              type="text" 
                              className="input py-1 px-1 text-xs text-center bg-gray-50 border-orange-50 focus:bg-white w-[90px]" 
                              value={getFieldValue(item, 'hsn')}
                              onChange={(e) => handleFieldChange(item._id, 'hsn', e.target.value)}
                            />
                          </td>
                          {/* SGST */}
                          <td className="p-2">
                            <input 
                              type="number" 
                              className="input py-1 px-1 text-xs text-center bg-gray-50 border-orange-50 focus:bg-white w-[70px]" 
                              value={getFieldValue(item, 'sgst')}
                              onChange={(e) => handleFieldChange(item._id, 'sgst', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          {/* CST */}
                          <td className="p-2">
                            <input 
                              type="number" 
                              className="input py-1 px-1 text-xs text-center bg-gray-50 border-orange-50 focus:bg-white w-[70px]" 
                              value={getFieldValue(item, 'cst')}
                              onChange={(e) => handleFieldChange(item._id, 'cst', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          {/* Actions */}
                          <td className="p-2 pr-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleSaveItem(item)}
                                disabled={isSaving || !hasLocalEdits}
                                className={`p-1.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                                  hasLocalEdits 
                                    ? 'bg-green-500 text-white border-green-500 hover:bg-green-600 shadow-sm shadow-green-500/10'
                                    : 'bg-gray-50 text-gray-400 border-gray-250 opacity-40 cursor-not-allowed'
                                }`}
                                title="Save Row Changes"
                              >
                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteItem(item._id)}
                                disabled={isDeleting}
                                className="p-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white rounded-xl transition flex items-center justify-center cursor-pointer"
                                title="Delete Medicine"
                              >
                                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="p-4 border-t border-orange-50 flex items-center justify-between text-xs font-semibold text-gray-500 select-none bg-orange-50/10">
                <span>Showing Page {page} of {pages} ({total} medicines)</span>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1} 
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-orange-200 hover:bg-orange-50 disabled:opacity-50 disabled:hover:bg-white flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPage(p => Math.min(pages, p + 1))} 
                    disabled={page === pages} 
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-orange-200 hover:bg-orange-50 disabled:opacity-50 disabled:hover:bg-white flex items-center gap-1 cursor-pointer"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXCEL UPLOAD PANEL */}
      {isAdmin && activeSubTab === 'excel-upload' && (
        <div className="animate-fade-in">
          <ExcelUploadView />
        </div>
      )}
    </div>
  );
};

export default BillingSettingsView;
