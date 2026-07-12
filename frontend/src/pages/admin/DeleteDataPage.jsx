import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Loader2, Search, Trash2, ShieldAlert } from 'lucide-react';
import client from '../../api/client';

const DeleteDataPage = () => {
  const [deleteDataEnabled, setDeleteDataEnabled] = useState(false);
  const [loadingPermission, setLoadingPermission] = useState(true);
  const [activeCategory, setActiveCategory] = useState('patient'); // 'patient', 'pharmacy', 'billing', 'prescription'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const categories = [
    { id: 'patient', label: 'Patient & All History', desc: 'Deletes patient, visits, bills, and prescriptions.' },
    { id: 'pharmacy', label: 'Pharmacy Invoices', desc: 'Deletes single pharmacy billing invoice.' },
    { id: 'billing', label: 'Billing Invoices', desc: 'Deletes single general billing invoice.' },
    { id: 'prescription', label: 'OPD Prescriptions', desc: 'Deletes single patient prescription record.' }
  ];

  const placeholders = {
    patient: "Search patient by name, UHID, or mobile number...",
    pharmacy: "Search pharmacy invoice by bill number (e.g. PB-10001)...",
    billing: "Search general billing invoice by invoice number (e.g. INV123456)...",
    prescription: "Search prescription by ID or patient name..."
  };

  const loadDeletePermission = useCallback(async () => {
    setLoadingPermission(true);
    try {
      const { data } = await client.get('/admin/delete-data/permission');
      setDeleteDataEnabled(Boolean(data?.enabled));
    } catch (err) {
      console.error('Failed to load delete permission', err);
      setDeleteDataEnabled(false);
    } finally {
      setLoadingPermission(false);
    }
  }, []);

  useEffect(() => {
    loadDeletePermission();
  }, [loadDeletePermission]);

  useEffect(() => {
    if (!searchQuery.trim() || !deleteDataEnabled) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const { data } = await client.get(
          `/admin/delete-data/search?query=${encodeURIComponent(searchQuery)}&category=${activeCategory}`
        );
        setSearchResults(data || []);
      } catch (err) {
        console.error('Failed to search deletion items', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, activeCategory, deleteDataEnabled]);

  const handleDeleteItem = async (item) => {
    const confirmMsg =
      activeCategory === 'patient'
        ? `Delete Patient "${item.title}" and ALL associated records (Visits, Invoices, Prescriptions)? This is IRREVERSIBLE!`
        : activeCategory === 'pharmacy'
        ? `Delete Pharmacy Invoice "${item.title}"? This is IRREVERSIBLE!`
        : activeCategory === 'billing'
        ? `Delete General Billing Invoice "${item.title}"? This is IRREVERSIBLE!`
        : `Delete Patient Prescription "${item.title}"? This is IRREVERSIBLE!`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(item.id);
    try {
      if (activeCategory === 'patient') {
        await client.post('/admin/delete-data/patient', { patientId: item.id });
      } else if (activeCategory === 'pharmacy') {
        await client.delete(`/admin/delete-data/pharmacy-bill/${item.id}`);
      } else if (activeCategory === 'billing') {
        await client.delete(`/admin/delete-data/billing-invoice/${item.id}`);
      } else if (activeCategory === 'prescription') {
        await client.delete(`/admin/delete-data/prescription/${item.id}`);
      }

      toast.success('Selected record has been permanently deleted.');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete selected item.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Delete Data</h1>
        <p className="text-sm text-gray-500">Manage irreversible patient and invoice data deletion for this hospital.</p>
      </div>

      {loadingPermission ? (
        <div className="card flex items-center justify-center gap-2 p-8 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
          Checking permission...
        </div>
      ) : !deleteDataEnabled ? (
        <div className="card border border-orange-100 bg-white p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500" />
            <div>
              <h2 className="text-sm font-bold text-gray-800">Delete Data is not enabled for this hospital</h2>
              <p className="mt-1 text-sm text-gray-500">Ask the super admin to enable this option for the hospital before using it.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`p-4 text-left border rounded-2xl transition duration-150 relative cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-red-50/40 border-red-500 shadow-sm ring-1 ring-red-500'
                    : 'bg-white border-orange-100 hover:border-red-200'
                }`}
              >
                <span className={`block font-extrabold text-xs uppercase ${activeCategory === cat.id ? 'text-red-700' : 'text-gray-500'}`}>
                  {cat.label}
                </span>
                <span className="block mt-1 text-[10px] text-gray-400 font-semibold leading-relaxed">
                  {cat.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Search Card */}
          <div className="card border border-red-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-800 capitalize">Delete {activeCategory} Record</h2>
                <p className="mt-1 text-sm text-gray-500">Search and permanently delete records. This is restricted and cannot be undone.</p>
              </div>
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase text-red-700 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Restricted
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholders[activeCategory]}
                className="input pl-10 py-3 text-sm font-semibold border-orange-200 focus:border-red-500 focus:ring-red-100"
              />
            </div>

            {searching && (
              <p className="text-xs text-gray-400 italic">Searching database...</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 rounded-xl border border-red-100 bg-red-50/40 p-3">
                {searchResults.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-white px-3 py-2.5 text-xs font-semibold">
                    <div>
                      <p className="font-bold text-gray-800">{item.title}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{item.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteItem(item)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black text-red-700 hover:bg-red-100 disabled:opacity-60 flex items-center gap-1 cursor-pointer"
                    >
                      {deletingId === item.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-2">No matching records found in this category.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteDataPage;
