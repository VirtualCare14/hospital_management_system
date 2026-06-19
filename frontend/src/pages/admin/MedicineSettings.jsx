import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Pill,
  Plus,
  Edit3,
  Trash2,
  Search,
  Eye,
  X,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Calculator,
  Package
} from 'lucide-react';
import client from '../../api/client';

const MedicineSettings = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    totalBoxPrice: '',
    gst: '',
    totalUnits: '1',
    price: '',
    description: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Auto-calculate per unit price
  useEffect(() => {
    const boxPrice = parseFloat(formData.totalBoxPrice) || 0;
    const units = parseInt(formData.totalUnits) || 1;
    const perUnitPrice = units > 0 ? (boxPrice / units).toFixed(2) : '0.00';
    setFormData(prev => ({ ...prev, price: perUnitPrice }));
  }, [formData.totalBoxPrice, formData.totalUnits]);

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/ipd/settings');
      setMedicines(data.medicines || []);
    } catch (err) {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMedicines.length / rowsPerPage);
  const paginatedMedicines = filteredMedicines.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const resetForm = () => {
    setFormData({ name: '', totalBoxPrice: '', gst: '', totalUnits: '1', price: '', description: '' });
  };

  const handleAdd = () => {
    setModalMode('add');
    setSelectedMedicine(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (medicine, index) => {
    setModalMode('edit');
    setSelectedMedicine({ ...medicine, _index: index });
    setFormData({
      name: medicine.name,
      totalBoxPrice: String(medicine.totalBoxPrice || ''),
      gst: String(medicine.gst || ''),
      totalUnits: String(medicine.totalUnits || '1'),
      price: String(medicine.price || '0'),
      description: medicine.description || ''
    });
    setShowModal(true);
  };

  const handleView = (medicine) => {
    setModalMode('view');
    setSelectedMedicine(medicine);
    setShowModal(true);
  };

  const handleToggleActive = async (medicine, index) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], isActive: !updated[index].isActive };
    try {
      await client.put('/ipd/settings', { medicines: updated });
      toast.success(`Medicine ${updated[index].isActive ? 'activated' : 'deactivated'}`);
      setMedicines(updated);
    } catch (err) {
      toast.error('Failed to update medicine status');
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Delete this medicine? This action cannot be undone.')) return;
    const updated = medicines.filter((_, i) => i !== index);
    try {
      await client.put('/ipd/settings', { medicines: updated });
      toast.success('Medicine deleted successfully');
      setMedicines(updated);
    } catch (err) {
      toast.error('Failed to delete medicine');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Medicine name is required');
      return;
    }

    const newMedicine = {
      name: formData.name.trim(),
      totalBoxPrice: parseFloat(formData.totalBoxPrice || '0'),
      totalUnits: parseInt(formData.totalUnits) || 1,
      price: parseFloat(formData.price || '0'),
      gst: parseFloat(formData.gst || '0'),
      description: formData.description.trim()
    };

    let updated;
    if (modalMode === 'add') {
      updated = [...medicines, { ...newMedicine, isActive: true }];
    } else {
      updated = medicines.map((m, i) =>
        i === selectedMedicine._index ? { ...m, ...newMedicine } : m
      );
    }

    try {
      await client.put('/ipd/settings', { medicines: updated });
      toast.success(modalMode === 'add' ? 'Medicine added successfully' : 'Medicine updated successfully');
      setShowModal(false);
      setMedicines(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save medicine');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Medicine Settings</h1>
          <p className="text-sm text-gray-500">Manage medicines used in IPD and Pharmacy modules</p>
        </div>
        <button onClick={handleAdd} className="btn">
          <Plus className="h-4 w-4" /> Add Medicine
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search medicines by name..."
            className="input pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Medicines Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3 pl-4">Medicine Name</th>
                <th className="p-3">Box Price</th>
                <th className="p-3">Total Units</th>
                <th className="p-3">Per Unit Price</th>
                <th className="p-3">GST %</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...
                  </td>
                </tr>
              ) : paginatedMedicines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold">No medicines found</p>
                    <p className="text-xs">Add your first medicine</p>
                  </td>
                </tr>
              ) : (
                paginatedMedicines.map((medicine, idx) => {
                  const realIndex = medicines.indexOf(medicine);
                  return (
                    <tr key={idx} className="hover:bg-orange-50/20">
                      <td className="p-3 pl-4 font-bold text-gray-800">{medicine.name}</td>
                      <td className="p-3 font-bold text-gray-700">₹{(medicine.totalBoxPrice || 0).toFixed(2)}</td>
                      <td className="p-3">{medicine.totalUnits || 1}</td>
                      <td className="p-3 font-bold text-green-700">₹{medicine.price.toFixed(2)}</td>
                      <td className="p-3">{medicine.gst ? `${medicine.gst}%` : '-'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          medicine.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {medicine.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 pr-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleView(medicine)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEdit(medicine, realIndex)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="Edit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleToggleActive(medicine, realIndex)} className={`p-1.5 rounded-lg ${medicine.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`} title={medicine.isActive ? 'Deactivate' : 'Activate'}>
                            {medicine.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          <button onClick={() => handleDelete(realIndex)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between p-4 border-t border-orange-100 bg-orange-50/20">
            <span className="text-xs text-gray-500">
              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredMedicines.length)} of {filteredMedicines.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-50 disabled:opacity-50">Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border ${currentPage === pageNum ? 'bg-orange-500 text-white border-orange-500' : 'border-orange-200 hover:bg-orange-50'}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit/View Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-orange-100 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-orange-50 pb-3">
              <h2 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <Pill className="text-orange-500 h-5 w-5" />
                {modalMode === 'add' ? 'Add Medicine' : modalMode === 'edit' ? 'Edit Medicine' : 'Medicine Details'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === 'view' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Medicine Name</span>
                    <span className="font-bold text-gray-800">{selectedMedicine.name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Total Box Price</span>
                    <span className="font-bold text-gray-700">₹{(selectedMedicine.totalBoxPrice || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Total Units</span>
                    <span className="font-bold text-gray-800">{selectedMedicine.totalUnits || 1}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Per Unit Price</span>
                    <span className="font-bold text-green-700">₹{selectedMedicine.price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">GST</span>
                    <span className="font-bold text-gray-800">{selectedMedicine.gst ? `${selectedMedicine.gst}%` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Status</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${selectedMedicine.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {selectedMedicine.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Description</span>
                    <span className="text-gray-800">{selectedMedicine.description || 'No description'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Medicine Name *</label>
                  <input
                    type="text"
                    className="input py-2.5"
                    placeholder="e.g. Paracetamol 500mg"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Total Box Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input py-2.5"
                      placeholder="500"
                      value={formData.totalBoxPrice}
                      onChange={(e) => setFormData(p => ({ ...p, totalBoxPrice: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Total Number of Units</label>
                    <input
                      type="number"
                      min="1"
                      className="input py-2.5"
                      placeholder="10"
                      value={formData.totalUnits}
                      onChange={(e) => setFormData(p => ({ ...p, totalUnits: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Auto-calculated Per Unit Price */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-green-600">Per Unit Price (Auto Calculated)</span>
                        <span className="text-2xl font-black text-green-700">₹{formData.price}</span>
                      </div>
                    </div>
                    <Package className="h-8 w-8 text-green-300" />
                  </div>
                  {formData.totalBoxPrice && formData.totalUnits && parseFloat(formData.totalBoxPrice) > 0 && (
                    <p className="text-[10px] text-green-500 mt-1">
                      ₹{parseFloat(formData.totalBoxPrice).toFixed(2)} ÷ {parseInt(formData.totalUnits)} units = ₹{formData.price}/unit
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">GST (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="input py-2.5"
                      placeholder="e.g. 18"
                      value={formData.gst}
                      onChange={(e) => setFormData(p => ({ ...p, gst: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Description (Optional)</label>
                  <textarea
                    className="input py-2.5 min-h-[80px]"
                    placeholder="Medicine description..."
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs py-2.5 px-4">Cancel</button>
                  <button type="submit" className="btn text-xs py-2.5 px-4">
                    <Save className="h-4 w-4" /> {modalMode === 'add' ? 'Add Medicine' : 'Update Medicine'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineSettings;