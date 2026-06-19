import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Search, 
  Filter, 
  Bed, 
  ChevronRight, 
  RefreshCw, 
  X, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import client from '../../api/client';

const DEFAULT_BED_TYPES = [
  'Single Bed',
  'Double Bed',
  'Triple Bed',
  'ICU Bed',
  'Ventilator Bed'
];

const DEFAULT_ROOM_TYPES = [
  'General Ward',
  'Semi Private',
  'Private',
  'Deluxe',
  'Super Deluxe',
  'ICU',
  'NICU',
  'PICU'
];

const HospitalRoomSettings = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selection/Mode states
  // mode can be: 'view', 'add', 'edit', 'idle'
  const [mode, setMode] = useState('idle');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null); // room details for view card
  const [viewBeds, setViewBeds] = useState([]); // bed list for view card

  // Form states
  const [formRoomType, setFormRoomType] = useState('');
  const [formCustomRoomType, setFormCustomRoomType] = useState('');
  const [formTotalBeds, setFormTotalBeds] = useState(1);
  const [formBedConfigs, setFormBedConfigs] = useState([
    { bedType: 'Single Bed', customBedType: '', numberOfBeds: 1, pricePerDay: 1000, applySamePrice: true, individualPrices: [1000] }
  ]);

  // Load rooms from backend
  const loadRooms = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/rooms');
      setRooms(data);
    } catch (err) {
      toast.error('Failed to load room settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // Sync individualPrices array size when numberOfBeds or applySamePrice changes
  const updateConfigField = (index, field, value) => {
    const updated = [...formBedConfigs];
    updated[index][field] = value;

    if (field === 'numberOfBeds') {
      const bedsCount = Number(value) || 0;
      const prevPrices = updated[index].individualPrices || [];
      const defaultPrice = updated[index].pricePerDay || 0;
      
      const newPrices = [];
      for (let i = 0; i < bedsCount; i++) {
        newPrices.push(prevPrices[i] !== undefined ? prevPrices[i] : defaultPrice);
      }
      updated[index].individualPrices = newPrices;
    }

    if (field === 'pricePerDay' && updated[index].applySamePrice) {
      const bedsCount = Number(updated[index].numberOfBeds) || 0;
      updated[index].individualPrices = Array(bedsCount).fill(Number(value) || 0);
    }

    setFormBedConfigs(updated);
  };

  const updateIndividualPrice = (configIndex, priceIndex, value) => {
    const updated = [...formBedConfigs];
    updated[configIndex].individualPrices[priceIndex] = Number(value) || 0;
    setFormBedConfigs(updated);
  };

  const addBedConfigRow = () => {
    setFormBedConfigs([
      ...formBedConfigs,
      { bedType: 'Single Bed', customBedType: '', numberOfBeds: 1, pricePerDay: 1000, applySamePrice: true, individualPrices: [1000] }
    ]);
  };

  const removeBedConfigRow = (index) => {
    if (formBedConfigs.length === 1) return;
    const updated = formBedConfigs.filter((_, idx) => idx !== index);
    setFormBedConfigs(updated);
  };

  // Calculate live sum of bed configurations
  const sumConfiguredBeds = formBedConfigs.reduce((acc, curr) => acc + (Number(curr.numberOfBeds) || 0), 0);
  const isBedsCountValid = sumConfiguredBeds === Number(formTotalBeds);

  // Initialize form for adding a room
  const handleAddMode = () => {
    setMode('add');
    setSelectedRoomId(null);
    setFormRoomType('General Ward');
    setFormCustomRoomType('');
    setFormTotalBeds(1);
    setFormBedConfigs([
      { bedType: 'Single Bed', customBedType: '', numberOfBeds: 1, pricePerDay: 1000, applySamePrice: true, individualPrices: [1000] }
    ]);
  };

  // Initialize form for editing a room
  const handleEditMode = (room) => {
    setMode('edit');
    setSelectedRoomId(room._id);
    
    // Check if roomType is in our default list
    if (DEFAULT_ROOM_TYPES.includes(room.roomType)) {
      setFormRoomType(room.roomType);
      setFormCustomRoomType('');
    } else {
      setFormRoomType('Custom');
      setFormCustomRoomType(room.roomType);
    }

    setFormTotalBeds(room.totalBeds);

    // Map bed configurations
    const configs = room.bedConfigurations.map(c => {
      const isDefault = DEFAULT_BED_TYPES.includes(c.bedType);
      return {
        bedType: isDefault ? c.bedType : 'Custom',
        customBedType: isDefault ? '' : c.bedType,
        numberOfBeds: c.numberOfBeds,
        pricePerDay: c.pricePerDay,
        applySamePrice: c.applySamePrice,
        individualPrices: c.individualPrices && c.individualPrices.length > 0 
          ? c.individualPrices 
          : Array(c.numberOfBeds).fill(c.pricePerDay)
      };
    });

    setFormBedConfigs(configs);
  };

  // Handle viewing room details
  const handleViewMode = async (room) => {
    setMode('view');
    setSelectedRoomId(room._id);
    setViewDetails(room);
    setViewBeds([]);
    
    try {
      const { data } = await client.get(`/rooms/beds?roomType=${encodeURIComponent(room.roomType)}`);
      setViewBeds(data);
    } catch (err) {
      toast.error('Failed to load room beds.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isBedsCountValid) {
      toast.error(`Bed counts do not match. Expected ${formTotalBeds} beds, configured ${sumConfiguredBeds}.`);
      return;
    }

    const finalRoomType = formRoomType === 'Custom' ? formCustomRoomType : formRoomType;
    if (!finalRoomType.trim()) {
      toast.error('Room type name is required.');
      return;
    }

    // Format configs for backend
    const formattedConfigs = formBedConfigs.map(c => {
      const finalBedType = c.bedType === 'Custom' ? c.customBedType : c.bedType;
      return {
        bedType: finalBedType,
        numberOfBeds: Number(c.numberOfBeds),
        pricePerDay: Number(c.pricePerDay),
        applySamePrice: c.applySamePrice,
        individualPrices: c.applySamePrice ? [] : c.individualPrices.map(Number)
      };
    });

    // Check custom names
    if (formattedConfigs.some(c => !c.bedType.trim())) {
      toast.error('All bed type names must be filled out.');
      return;
    }

    const payload = {
      roomType: finalRoomType.trim(),
      totalBeds: Number(formTotalBeds),
      bedConfigurations: formattedConfigs
    };

    try {
      if (mode === 'add') {
        await client.post('/rooms', payload);
        toast.success('Room configuration created successfully!');
      } else {
        await client.put(`/rooms/${selectedRoomId}`, payload);
        toast.success('Room configuration updated successfully!');
      }
      setMode('idle');
      loadRooms();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Server operation failed.';
      toast.error(errorMsg);
    }
  };

  // Handle deleting room
  const handleDelete = async (roomId, roomType) => {
    if (!window.confirm(`Are you sure you want to delete all configurations for Room Type "${roomType}"? This cannot be undone.`)) {
      return;
    }

    try {
      await client.delete(`/rooms/${roomId}`);
      toast.success('Room configuration deleted successfully!');
      if (selectedRoomId === roomId) {
        setMode('idle');
      }
      loadRooms();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to delete room.';
      toast.error(errorMsg);
    }
  };

  // Filtered room list
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomType.toLowerCase().includes(search.toLowerCase()) ||
                          room.bedTypes.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || 
                          (statusFilter === 'Available' && room.availableBeds > 0) ||
                          (statusFilter === 'Full' && room.availableBeds === 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hospital Room Settings</h1>
          <p className="text-sm text-gray-500">Configure room categories, beds, and pricing details for the IPD Admission module.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadRooms} className="btn-secondary" title="Reload data">
            <RefreshCw className="h-4 w-4" />
          </button>
          {mode !== 'add' && (
            <button onClick={handleAddMode} className="btn">
              <Plus className="h-4 w-4" /> Add Room Config
            </button>
          )}
        </div>
      </div>

      {/* Main Work Area */}
      <div className="grid gap-6 lg:grid-cols-[1fr_450px]">
        
        {/* LEFT COLUMN: LIST */}
        <div className="space-y-4">
          <div className="card p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search room type, bed configuration..."
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 min-w-[150px]">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                className="input py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Available">Available Beds</option>
                <option value="Full">Full / No Available Beds</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-50/55 text-xs font-bold uppercase tracking-wider text-orange-800 border-b border-orange-100">
                    <th className="p-4">Room Type</th>
                    <th className="p-4 text-center">Beds</th>
                    <th className="p-4">Bed Configurations</th>
                    <th className="p-4">Price Range</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 text-sm">
                  {filteredRooms.map((room) => (
                    <tr 
                      key={room._id} 
                      className={`hover:bg-orange-50/20 transition-all ${selectedRoomId === room._id ? 'bg-orange-50/30 font-semibold' : ''}`}
                    >
                      <td className="p-4 font-bold text-gray-900">{room.roomType}</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 font-semibold">
                          <span className="text-gray-900" title="Total Beds">{room.totalBeds}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-green-600" title="Available Beds">{room.availableBeds}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-red-500" title="Occupied Beds">{room.occupiedBeds}</span>
                        </div>
                        <span className="block text-[10px] text-gray-400">Total/Avail/Occ</span>
                      </td>
                      <td className="p-4 text-gray-600 max-w-[200px] truncate" title={room.bedTypes}>
                        {room.bedTypes}
                      </td>
                      <td className="p-4 font-semibold text-orange-700">{room.priceRange}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold leading-tight ${
                          room.availableBeds > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {room.availableBeds > 0 ? `${room.availableBeds} Available` : 'Full'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => handleViewMode(room)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View summary card"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditMode(room)} 
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="Edit configuration"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(room._id, room.roomType)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete configuration"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRooms.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        No room configurations found.
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-orange-500 font-medium">
                        Loading rooms...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION PANEL */}
        <div>
          {mode === 'idle' && (
            <div className="card p-8 text-center border-dashed border-2 border-orange-200 bg-orange-50/10 flex flex-col items-center justify-center min-h-[400px]">
              <Bed className="h-12 w-12 text-orange-300 animate-bounce mb-3" />
              <h2 className="text-lg font-bold text-gray-800">Room Details Panel</h2>
              <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
                Select a room configuration to view details, edit beds, or create a new room configuration to start.
              </p>
              <button onClick={handleAddMode} className="btn mt-4">
                <Plus className="h-4 w-4" /> Add Room Config
              </button>
            </div>
          )}

          {/* VIEW MODE SUMMARY CARD */}
          {mode === 'view' && viewDetails && (
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-600 p-2 rounded-xl">
                    <Bed className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">{viewDetails.roomType}</h2>
                    <p className="text-xs text-gray-400">Room Summary Card</p>
                  </div>
                </div>
                <button onClick={() => setMode('idle')} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-orange-50 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-orange-50/40 rounded-xl p-3 text-center">
                  <span className="block text-xs font-bold text-gray-500 uppercase">Total Beds</span>
                  <span className="block text-2xl font-black text-gray-800 mt-1">{viewDetails.totalBeds} Beds</span>
                </div>
                <div className="bg-green-50/40 rounded-xl p-3 text-center">
                  <span className="block text-xs font-bold text-gray-500 uppercase">Available</span>
                  <span className="block text-2xl font-black text-green-600 mt-1">{viewDetails.availableBeds}</span>
                </div>
                <div className="bg-red-50/40 rounded-xl p-3 text-center">
                  <span className="block text-xs font-bold text-gray-500 uppercase">Occupied</span>
                  <span className="block text-2xl font-black text-red-500 mt-1">{viewDetails.occupiedBeds}</span>
                </div>
              </div>

              {/* Bed Type Listing */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Bed Configurations</h3>
                <div className="space-y-2">
                  {viewDetails.bedConfigurations.map((config, idx) => (
                    <div key={idx} className="flex justify-between items-center rounded-xl bg-orange-50/20 border border-orange-50 px-4 py-3">
                      <div>
                        <p className="font-bold text-gray-800">{config.bedType}</p>
                        <p className="text-xs text-gray-500">{config.numberOfBeds} {config.numberOfBeds === 1 ? 'Bed' : 'Beds'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-orange-600">₹{config.pricePerDay}/day</p>
                        <span className="text-[10px] text-gray-400">
                          {config.applySamePrice ? 'Same price for all' : 'Individual Pricing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bed Status Lists */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Generated Bed Records</h3>
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 divide-y divide-orange-50">
                  {viewBeds.map((bed) => (
                    <div key={bed._id} className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <span className="font-mono font-bold text-gray-800 text-sm block">{bed.bedNumber}</span>
                        <span className="text-gray-400 block">{bed.bedType} • ₹{bed.pricePerDay}/day</span>
                      </div>
                      <div className="text-right">
                        {bed.status === 'Occupied' ? (
                          <div>
                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold text-[10px]">Occupied</span>
                            <span className="block text-[10px] text-gray-500 mt-0.5 max-w-[100px] truncate" title={bed.patientId?.patientName}>
                              {bed.patientId?.patientName || 'Patient'}
                            </span>
                          </div>
                        ) : (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold text-[10px]">Available</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {viewBeds.length === 0 && (
                    <p className="text-gray-500 text-xs py-4 text-center">No bed records loaded.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ADD / EDIT MODE CONFIG FORM */}
          {(mode === 'add' || mode === 'edit') && (
            <form onSubmit={handleSubmit} className="card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white p-2 rounded-xl">
                    <Plus className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">{mode === 'add' ? 'Add Room Config' : 'Edit Room Config'}</h2>
                    <p className="text-xs text-gray-400">Configure beds and pricing details</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setMode('idle')} 
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-orange-50 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Room Type */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Room Type</span>
                  <select
                    className="input py-2.5"
                    value={formRoomType}
                    onChange={(e) => setFormRoomType(e.target.value)}
                  >
                    {DEFAULT_ROOM_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="Custom">Custom Room Type...</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Total Beds</span>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={formTotalBeds}
                    onChange={(e) => setFormTotalBeds(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  />
                </label>
              </div>

              {formRoomType === 'Custom' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Custom Room Type Name</span>
                  <input
                    type="text"
                    placeholder="Enter custom room type"
                    className="input"
                    value={formCustomRoomType}
                    onChange={(e) => setFormCustomRoomType(e.target.value)}
                    required
                  />
                </label>
              )}

              {/* Bed Configuration Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Bed Configurations</h3>
                  <button 
                    type="button" 
                    onClick={addBedConfigRow} 
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Bed Type
                  </button>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {formBedConfigs.map((config, configIdx) => (
                    <div key={configIdx} className="p-3 bg-orange-50/20 border border-orange-100 rounded-2xl space-y-3 relative">
                      {formBedConfigs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBedConfigRow(configIdx)}
                          className="absolute right-2 top-2 text-gray-400 hover:text-red-500 p-1 hover:bg-orange-100/50 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <div className="grid gap-2 grid-cols-2">
                        {/* Bed Type */}
                        <label className="block col-span-2">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Bed Type</span>
                          <select
                            className="input py-2 text-xs"
                            value={config.bedType}
                            onChange={(e) => updateConfigField(configIdx, 'bedType', e.target.value)}
                          >
                            {DEFAULT_BED_TYPES.map((type, idx) => (
                              <option key={`${type}-${idx}`} value={type}>{type}</option>
                            ))}
                            <option value="Custom">Custom Bed Type...</option>
                          </select>
                        </label>

                        {config.bedType === 'Custom' && (
                          <label className="block col-span-2">
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Custom Bed Name</span>
                            <input
                              type="text"
                              placeholder="e.g. Ventilator Bed"
                              className="input py-2 text-xs"
                              value={config.customBedType}
                              onChange={(e) => updateConfigField(configIdx, 'customBedType', e.target.value)}
                              required
                            />
                          </label>
                        )}

                        {/* Beds Count */}
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Bed Count</span>
                          <input
                            type="number"
                            min="1"
                            className="input py-2 text-xs"
                            value={config.numberOfBeds}
                            onChange={(e) => updateConfigField(configIdx, 'numberOfBeds', Math.max(1, parseInt(e.target.value, 10) || 0))}
                          />
                        </label>

                        {/* Base Price */}
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Price Per Day</span>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                            <input
                              type="number"
                              min="0"
                              className="input py-2 pl-7 text-xs"
                              value={config.pricePerDay}
                              onChange={(e) => updateConfigField(configIdx, 'pricePerDay', Math.max(0, parseInt(e.target.value, 10) || 0))}
                            />
                          </div>
                        </label>
                      </div>

                      {/* Same Price Checkbox */}
                      <label className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <input
                          type="checkbox"
                          checked={config.applySamePrice}
                          onChange={(e) => updateConfigField(configIdx, 'applySamePrice', e.target.checked)}
                          className="rounded text-orange-500 focus:ring-orange-200 h-3.5 w-3.5"
                        />
                        <span>Apply same price for all beds of this type</span>
                      </label>

                      {/* Individual Pricing Expandable List */}
                      {!config.applySamePrice && (
                        <div className="mt-2 p-2 bg-white rounded-xl border border-orange-100 space-y-2">
                          <p className="text-[10px] font-bold uppercase text-gray-400">Configure Individual Prices</p>
                          <div className="grid gap-1.5 grid-cols-2 max-h-[120px] overflow-y-auto">
                            {Array.from({ length: Number(config.numberOfBeds) || 0 }).map((_, idx) => (
                              <label key={idx} className="flex items-center gap-2 border border-gray-100 rounded-lg p-1 text-xs">
                                <span className="font-semibold text-gray-500 text-[10px]">Bed #{idx+1}</span>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-full bg-gray-50 border-0 focus:ring-0 p-1 text-xs rounded"
                                  value={config.individualPrices[idx] !== undefined ? config.individualPrices[idx] : config.pricePerDay}
                                  onChange={(e) => updateIndividualPrice(configIdx, idx, e.target.value)}
                                  placeholder="Price"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Status Info */}
              <div className={`p-3 rounded-2xl flex items-center justify-between text-xs font-semibold ${
                isBedsCountValid 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {isBedsCountValid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span>
                    Total: {formTotalBeds} | Configured: {sumConfiguredBeds}
                  </span>
                </div>
                {!isBedsCountValid && (
                  <span className="text-[10px] font-bold">Total configured beds must match Total Beds.</span>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-orange-100">
                <button
                  type="button"
                  onClick={() => setMode('idle')}
                  className="btn-secondary text-xs px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBedsCountValid}
                  className="btn text-xs px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default HospitalRoomSettings;
