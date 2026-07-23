import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Loader2, DollarSign, Info, Settings, ShieldCheck, Plus, Trash2, FolderHeart, ShieldAlert } from 'lucide-react';
import client from '../../api/client';

const SameDayCareSettings = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for adding category and subservices
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubService, setNewSubService] = useState({
    categoryIndex: null,
    name: '',
    price: ''
  });

  // Investigations states
  const [expandedSubServiceKey, setExpandedSubServiceKey] = useState(null);
  const [newInv, setNewInv] = useState({ name: '', price: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/ipd/settings');
      setCategories(data.sameDayCareCategories || []);
    } catch (err) {
      toast.error('Failed to load Same Day Care settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }

    setCategories(prev => [...prev, {
      name,
      subServices: [],
      isActive: true
    }]);
    setNewCategoryName('');
    toast.success(`Category "${name}" added. Don't forget to save changes!`);
  };

  const handleDeleteCategory = (index, name) => {
    if (name.toLowerCase() === 'dialysis') {
      toast.error('Dialysis category cannot be deleted');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the category "${name}" and all of its sub-services?`)) {
      return;
    }

    setCategories(prev => prev.filter((_, i) => i !== index));
    toast.success('Category removed. Click Save to apply changes.');
  };

  const handleAddSubService = (catIndex) => {
    const name = newSubService.name.trim();
    const price = parseFloat(newSubService.price);

    if (!name) {
      toast.error('Sub-service name is required');
      return;
    }
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price >= 0');
      return;
    }

    const category = categories[catIndex];
    if (category.subServices.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Sub-service already exists in this category');
      return;
    }

    setCategories(prev => {
      const updated = [...prev];
      updated[catIndex] = {
        ...category,
        subServices: [...category.subServices, { name, price, isActive: true }]
      };
      return updated;
    });

    setNewSubService({ categoryIndex: null, name: '', price: '' });
    toast.success(`Added "${name}". Click Save to apply changes.`);
  };

  const handleDeleteSubService = (catIndex, subIndex, subName) => {
    const category = categories[catIndex];
    if (category.name.toLowerCase() === 'dialysis' && subName.toLowerCase() === 'dialysis') {
      toast.error('Dialysis sub-service cannot be deleted');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${subName}"?`)) {
      return;
    }

    setCategories(prev => {
      const updated = [...prev];
      updated[catIndex] = {
        ...category,
        subServices: category.subServices.filter((_, i) => i !== subIndex)
      };
      return updated;
    });
    toast.success('Sub-service removed. Click Save to apply changes.');
  };

  const handlePriceChange = (catIndex, subIndex, value) => {
    const price = parseFloat(value) || 0;
    setCategories(prev => {
      const updated = [...prev];
      const category = updated[catIndex];
      const subServices = [...category.subServices];
      subServices[subIndex] = { ...subServices[subIndex], price };
      updated[catIndex] = { ...category, subServices };
      return updated;
    });
  };

  const handleAddInvestigation = (catIndex, subIndex) => {
    const name = newInv.name.trim();

    if (!name) {
      toast.error('Investigation name is required');
      return;
    }

    setCategories(prev => {
      const updated = [...prev];
      const category = updated[catIndex];
      const subServices = [...category.subServices];
      const sub = { ...subServices[subIndex] };
      const investigations = Array.isArray(sub.investigations) ? [...sub.investigations] : [];
      
      if (investigations.some(i => i.name.toLowerCase() === name.toLowerCase())) {
        toast.error('Investigation already exists');
        return prev;
      }

      sub.investigations = [...investigations, { name }];
      subServices[subIndex] = sub;
      updated[catIndex] = { ...category, subServices };
      return updated;
    });

    setNewInv({ name: '', price: '' });
    toast.success('Investigation added. Click Save to apply.');
  };

  const handleDeleteInvestigation = (catIndex, subIndex, invIndex) => {
    setCategories(prev => {
      const updated = [...prev];
      const category = updated[catIndex];
      const subServices = [...category.subServices];
      const sub = { ...subServices[subIndex] };
      sub.investigations = sub.investigations.filter((_, i) => i !== invIndex);
      subServices[subIndex] = sub;
      updated[catIndex] = { ...category, subServices };
      return updated;
    });
    toast.success('Investigation removed. Click Save to apply.');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.put('/ipd/settings', { sameDayCareCategories: categories });
      toast.success('Settings and pricing updated successfully');
      loadSettings(); // Reload to refresh from database
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Same Day Care Settings</h1>
          <p className="text-sm text-gray-500">Configure services, sub-services, and pricing models for Same Day Care.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn text-sm py-2.5 px-5 flex items-center justify-center gap-2 self-start sm:self-auto font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:brightness-105 active:scale-95 transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings & Pricing
        </button>
      </div>

      {/* Guide Banner */}
      <div className="card p-5 border border-orange-100 bg-orange-50/20 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
          <Info className="h-5 w-5 text-orange-500" />
          <h2 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider">Configuration Instructions</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <div className="bg-white p-4 rounded-xl border border-orange-100/50 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-1">
              <FolderHeart className="h-4 w-4 text-orange-500" />
              1. Add Categories
            </div>
            <p className="text-gray-500 leading-relaxed font-medium">
              Create service categories like **Dentistry** or **Orthopedics** to group related care procedures.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-orange-100/50 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-1">
              <DollarSign className="h-4 w-4 text-orange-500" />
              2. Manage Sub-Services
            </div>
            <p className="text-gray-500 leading-relaxed font-medium">
              Add sub-services under each category (e.g. **Root Canal** under Dentistry) and set their base pricing.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-orange-100/50 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-1">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              3. System Protections
            </div>
            <p className="text-gray-500 leading-relaxed font-medium">
              The **Dialysis** category and sub-service are seeded by default. They cannot be deleted or renamed, but the pricing is fully editable.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start">
        {/* Left Side: Add Category Form */}
        <div className="card p-5 space-y-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center gap-2 border-b border-orange-50 pb-3">
            <FolderHeart className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wider">Create Category</h3>
          </div>
          <form onSubmit={handleAddCategory} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category Name</label>
              <input
                type="text"
                placeholder="e.g. Dentistry, Ophthalmology"
                className="input py-2.5 text-sm"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn w-full py-2.5 font-bold flex items-center justify-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Category
            </button>
          </form>
        </div>

        {/* Right Side: Category List */}
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="card p-12 text-center border-2 border-dashed border-gray-200">
              <FolderHeart className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-gray-400">No Service Categories Configured</p>
              <p className="text-xs text-gray-400 mt-1">Use the panel on the left to create your first category.</p>
            </div>
          ) : (
            categories.map((cat, catIndex) => {
              const isDialysis = cat.name.toLowerCase() === 'dialysis';
              return (
                <div
                  key={catIndex}
                  className="card overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl hover:border-orange-200 transition-all"
                >
                  {/* Category Header */}
                  <div className="p-4 bg-orange-50/30 border-b border-orange-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderHeart className="h-5 w-5 text-orange-500" />
                      <h4 className="font-extrabold text-gray-900 text-base">{cat.name}</h4>
                      {isDialysis && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-orange-800 uppercase tracking-wide">
                          System Default
                        </span>
                      )}
                    </div>
                    {!isDialysis && (
                      <button
                        onClick={() => handleDeleteCategory(catIndex, cat.name)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Subservices List */}
                  <div className="p-5 space-y-4">
                    {/* Add Sub-service input trigger inline */}
                    {newSubService.categoryIndex === catIndex ? (
                      <div className="p-4 bg-orange-50/20 border border-orange-100/50 rounded-xl space-y-3">
                        <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Add New Sub-Service</h5>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Sub-service Name"
                              className="input py-2 text-xs"
                              value={newSubService.name}
                              onChange={(e) => setNewSubService(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs font-bold text-gray-400">₹</span>
                            <input
                              type="number"
                              placeholder="Price"
                              min="0"
                              className="input py-2 pl-6 text-xs font-semibold"
                              value={newSubService.price}
                              onChange={(e) => setNewSubService(prev => ({ ...prev, price: e.target.value }))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddSubService(catIndex)}
                              className="btn text-xs py-2 px-4 flex-1 font-bold"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setNewSubService({ categoryIndex: null, name: '', price: '' })}
                              className="btn-secondary text-xs py-2 px-3 font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewSubService({ categoryIndex: catIndex, name: '', price: '' })}
                        className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 font-bold border-dashed border-2 hover:border-orange-500 hover:bg-orange-50/20 w-fit"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Sub-Service
                      </button>
                    )}

                    {/* Sub-services table */}
                    {cat.subServices.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No sub-services configured for this category.</p>
                    ) : (
                      <div className="overflow-hidden border border-orange-100/50 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-orange-50/40 text-gray-600 font-bold uppercase tracking-wider border-b border-orange-100/50">
                              <th className="p-3 pl-4">Sub-Service</th>
                              <th className="p-3 w-40">Price (₹)</th>
                              <th className="p-3 w-16 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-orange-50/50">
                            {cat.subServices.map((sub, subIndex) => {
                              const isDialysisSub = isDialysis && sub.name.toLowerCase() === 'dialysis';
                              return (
                                <tr key={subIndex} className="hover:bg-orange-50/10">
                                  <td className="p-3 pl-4 font-bold text-gray-700">
                                    <div>{sub.name}</div>
                                    {!isDialysisSub && (
                                      <div className="mt-1 font-normal">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const key = `${catIndex}-${subIndex}`;
                                            setExpandedSubServiceKey(expandedSubServiceKey === key ? null : key);
                                            setNewInv({ name: '', price: '' });
                                          }}
                                          className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                          📁 Manage Investigations ({sub.investigations?.length || 0})
                                        </button>
                                        
                                        {expandedSubServiceKey === `${catIndex}-${subIndex}` && (
                                          <div className="mt-2 p-3 bg-orange-50/30 border border-orange-100/50 rounded-xl space-y-2 max-w-sm animate-in fade-in slide-in-from-top-1 duration-150">
                                            <h6 className="text-[9px] font-black text-gray-500 uppercase tracking-wide">Investigations List</h6>
                                            
                                            {(!sub.investigations || sub.investigations.length === 0) ? (
                                              <p className="text-[10px] text-gray-400 italic">No investigations configured yet.</p>
                                            ) : (
                                              <div className="space-y-1.5">
                                                {sub.investigations.map((inv, invIdx) => (
                                                  <div key={invIdx} className="flex items-center justify-between gap-2 bg-white/85 p-1.5 rounded-lg border border-orange-100/35">
                                                    <span className="text-[10px] font-bold text-gray-700 truncate flex-1">{inv.name}</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleDeleteInvestigation(catIndex, subIndex, invIdx)}
                                                      className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {/* Add Investigation Form */}
                                            <div className="pt-2 border-t border-orange-100/50 flex gap-2">
                                              <input
                                                type="text"
                                                placeholder="Inv. Name"
                                                className="input py-1 text-[10px] flex-1 bg-white"
                                                value={newInv.name}
                                                onChange={(e) => setNewInv(prev => ({ ...prev, name: e.target.value }))}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleAddInvestigation(catIndex, subIndex)}
                                                className="btn py-1 px-2 text-[10px] font-bold flex items-center justify-center gap-0.5"
                                              >
                                                <Plus className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <div className="relative w-36">
                                      <span className="absolute left-2.5 top-2 font-bold text-gray-400">₹</span>
                                      <input
                                        type="number"
                                        min="0"
                                        className="input py-1.5 pl-6 text-xs font-bold w-full focus:bg-orange-50/30"
                                        value={sub.price}
                                        onChange={(e) => handlePriceChange(catIndex, subIndex, e.target.value)}
                                      />
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    {isDialysisSub ? (
                                      <span title="Dialysis is a protected system sub-service">
                                        <ShieldCheck className="h-4 w-4 text-orange-400 mx-auto" />
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleDeleteSubService(catIndex, subIndex, sub.name)}
                                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                                        title="Delete Subservice"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SameDayCareSettings;