import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Search,
  Eye,
  X,
  Save,
  RefreshCw,
  Loader2,
  DollarSign,
  Percent,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
  AlertTriangle
} from 'lucide-react';
import client from '../../api/client';

const ConsumableServiceSettings = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedService, setSelectedService] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    gst: '',
    description: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/ipd/settings');
      setServices(data.consumableServices || []);
    } catch (err) {
      toast.error('Failed to load consumable services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredServices.length / rowsPerPage);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const resetForm = () => {
    setFormData({ name: '', price: '', gst: '', description: '' });
  };

  const handleAdd = () => {
    setModalMode('add');
    setSelectedService(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (service, index) => {
    setModalMode('edit');
    setSelectedService({ ...service, _index: index });
    setFormData({
      name: service.name,
      price: String(service.price),
      gst: String(service.gst || ''),
      description: service.description || ''
    });
    setShowModal(true);
  };

  const handleView = (service) => {
    setModalMode('view');
    setSelectedService(service);
    setShowModal(true);
  };

  const handleToggleActive = async (service, index) => {
    const updated = [...services];
    updated[index] = { ...updated[index], isActive: !updated[index].isActive };
    try {
      await client.put('/ipd/settings', { consumableServices: updated });
      toast.success(`Service ${updated[index].isActive ? 'activated' : 'deactivated'}`);
      setServices(updated);
    } catch (err) {
      toast.error('Failed to update service status');
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Delete this consumable service? This action cannot be undone.')) return;
    const updated = services.filter((_, i) => i !== index);
    try {
      await client.put('/ipd/settings', { consumableServices: updated });
      toast.success('Service deleted successfully');
      setServices(updated);
    } catch (err) {
      toast.error('Failed to delete service');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      toast.error('Service name and price are required');
      return;
    }

    const newService = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      gst: parseFloat(formData.gst || '0'),
      description: formData.description.trim()
    };

    let updated;
    if (modalMode === 'add') {
      updated = [...services, { ...newService, isActive: true }];
    } else {
      updated = services.map((s, i) =>
        i === selectedService._index ? { ...s, ...newService } : s
      );
    }

    try {
      await client.put('/ipd/settings', { consumableServices: updated });
      toast.success(modalMode === 'add' ? 'Service added successfully' : 'Service updated successfully');
      setShowModal(false);
      setServices(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Consumable Service Settings</h1>
          <p className="text-sm text-gray-500">Manage consumable services used in IPD patient billing</p>
        </div>
        <button onClick={handleAdd} className="btn">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search services by name..."
            className="input pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Services Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase text-gray-600 border-b border-orange-100">
                <th className="p-3 pl-4">Service Name</th>
                <th className="p-3">Price</th>
                <th className="p-3">GST %</th>
                <th className="p-3">Status</th>
                <th className="p-3">Description</th>
                <th className="p-3 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...
                  </td>
                </tr>
              ) : paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold">No services found</p>
                    <p className="text-xs">Add your first consumable service</p>
                  </td>
                </tr>
              ) : (
                paginatedServices.map((service, idx) => {
                  const realIndex = services.indexOf(service);
                  return (
                    <tr key={idx} className="hover:bg-orange-50/20">
                      <td className="p-3 pl-4 font-bold text-gray-800">{service.name}</td>
                      <td className="p-3 font-bold text-green-700">₹{service.price.toFixed(2)}</td>
                      <td className="p-3">{service.gst ? `${service.gst}%` : '-'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-500 max-w-[200px] truncate">
                        {service.description || '-'}
                      </td>
                      <td className="p-3 pr-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleView(service)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEdit(service, realIndex)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="Edit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleToggleActive(service, realIndex)} className={`p-1.5 rounded-lg ${service.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`} title={service.isActive ? 'Deactivate' : 'Activate'}>
                            {service.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
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
              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredServices.length)} of {filteredServices.length}
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
                <Package className="text-orange-500 h-5 w-5" />
                {modalMode === 'add' ? 'Add Service' : modalMode === 'edit' ? 'Edit Service' : 'Service Details'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === 'view' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Service Name</span>
                    <span className="font-bold text-gray-800">{selectedService.name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Price</span>
                    <span className="font-bold text-green-700">₹{selectedService.price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">GST</span>
                    <span className="font-bold text-gray-800">{selectedService.gst ? `${selectedService.gst}%` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Status</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${selectedService.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {selectedService.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Description</span>
                    <span className="text-gray-800">{selectedService.description || 'No description'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Service Name *</label>
                  <input
                    type="text"
                    className="input py-2.5"
                    placeholder="e.g. Syringe, Bandage, PPE Kit"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input py-2.5"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                      required
                    />
                  </div>
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
                    placeholder="Describe the service..."
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs py-2.5 px-4">Cancel</button>
                  <button type="submit" className="btn text-xs py-2.5 px-4">
                    <Save className="h-4 w-4" /> {modalMode === 'add' ? 'Add Service' : 'Update Service'}
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

export default ConsumableServiceSettings;