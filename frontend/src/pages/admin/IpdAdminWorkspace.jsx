import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Bed, 
  Activity, 
  Stethoscope, 
  Settings, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Search, 
  Filter, 
  Clock, 
  ChevronRight, 
  RefreshCw, 
  X, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import client from '../../api/client';

const DEFAULT_BED_TYPES = [
  'Single Bed',
  'Double Bed',
  'Triple Bed',
  'ICU Bed',
  'Ventilator Bed',
  'Electric Bed',
  'Pediatric Bed'
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

const IpdAdminWorkspace = () => {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms', 'beds', 'dashboard', 'doctors', 'settings', 'reports'
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tabs master loaders
  const loadData = () => {
    loadRooms();
    loadBeds();
    loadDoctors();
    loadSettings();
    loadReports();
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // TAB 1: ROOM CONFIGURATIONS
  // ==========================================
  const [roomSearch, setRoomSearch] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('');
  const [roomMode, setRoomMode] = useState('idle'); // 'view', 'add', 'edit', 'idle'
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  
  // Room form states
  const [formRoomType, setFormRoomType] = useState('General Ward');
  const [formCustomRoomType, setFormCustomRoomType] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTotalBeds, setFormTotalBeds] = useState(1);
  const [formBedConfigs, setFormBedConfigs] = useState([
    { bedType: 'Single Bed', customBedType: '', numberOfBeds: 1, pricePerDay: 1000, applySamePrice: true, individualPrices: [1000] }
  ]);

  const loadRooms = async () => {
    try {
      const { data } = await client.get('/rooms');
      setRooms(data);
    } catch (err) {
      toast.error('Failed to load rooms.');
    }
  };

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

      // Also update bed codes array
      const prevCodes = updated[index].bedCodes || [];
      const newCodes = [];
      for (let i = 0; i < bedsCount; i++) {
        newCodes.push(prevCodes[i] !== undefined ? prevCodes[i] : '');
      }
      updated[index].bedCodes = newCodes;
    }

    if (field === 'pricePerDay' && updated[index].applySamePrice) {
      const bedsCount = Number(updated[index].numberOfBeds) || 0;
      updated[index].individualPrices = Array(bedsCount).fill(Number(value) || 0);
    }

    setFormBedConfigs(updated);
  };

  const updateBedCode = (configIndex, codeIndex, value) => {
    const updated = [...formBedConfigs];
    updated[configIndex].bedCodes[codeIndex] = value;
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
      { bedType: 'Single Bed', customBedType: '', numberOfBeds: 1, pricePerDay: 1000, applySamePrice: true, individualPrices: [1000], bedCodes: [''] }
    ]);
  };

  const removeBedConfigRow = (index) => {
    if (formBedConfigs.length === 1) return;
    setFormBedConfigs(formBedConfigs.filter((_, idx) => idx !== index));
  };

  const sumConfiguredBeds = formBedConfigs.reduce((acc, curr) => acc + (Number(curr.numberOfBeds) || 0), 0);
  const isBedsCountValid = sumConfiguredBeds === Number(formTotalBeds);

  const handleAddRoomMode = () => {
    setRoomMode('add');
    setSelectedRoomId(null);
    setFormRoomType('General Ward');
    setFormCustomRoomType('');
    setFormDescription('');
    setFormTotalBeds(1);
    setFormBedConfigs([
      { bedType: 'Single Bed', customBedType: '', numberOfBeds: 1, pricePerDay: 1000, applySamePrice: true, individualPrices: [1000], bedCodes: [''] }
    ]);
  };

  const handleEditRoomMode = (room) => {
    setRoomMode('edit');
    setSelectedRoomId(room._id);
    
    if (DEFAULT_ROOM_TYPES.includes(room.roomType)) {
      setFormRoomType(room.roomType);
      setFormCustomRoomType('');
    } else {
      setFormRoomType('Custom');
      setFormCustomRoomType(room.roomType);
    }

    setFormDescription(room.description || '');
    setFormTotalBeds(room.totalBeds);

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
          : Array(c.numberOfBeds).fill(c.pricePerDay),
        bedCodes: c.bedCodes && c.bedCodes.length > 0 
          ? c.bedCodes 
          : Array(c.numberOfBeds).fill('')
      };
    });

    setFormBedConfigs(configs);
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();

    if (!isBedsCountValid) {
      toast.error(`Bed counts mismatch. Total: ${formTotalBeds}, configured: ${sumConfiguredBeds}.`);
      return;
    }

    const finalRoomType = formRoomType === 'Custom' ? formCustomRoomType : formRoomType;
    if (!finalRoomType.trim()) {
      toast.error('Room type name is required.');
      return;
    }

    const formattedConfigs = formBedConfigs.map(c => {
      const finalBedType = c.bedType === 'Custom' ? c.customBedType : c.bedType;
      return {
        bedType: finalBedType,
        numberOfBeds: Number(c.numberOfBeds),
        pricePerDay: Number(c.pricePerDay),
        applySamePrice: c.applySamePrice,
        individualPrices: c.applySamePrice ? [] : c.individualPrices.map(Number),
        bedCodes: c.bedCodes || []
      };
    });

    if (formattedConfigs.some(c => !c.bedType.trim())) {
      toast.error('All bed type names must be filled out.');
      return;
    }

    const payload = {
      roomType: finalRoomType.trim(),
      description: formDescription.trim(),
      totalBeds: Number(formTotalBeds),
      bedConfigurations: formattedConfigs
    };

    try {
      if (roomMode === 'add') {
        await client.post('/rooms', payload);
        toast.success('Room created successfully!');
      } else {
        await client.put(`/rooms/${selectedRoomId}`, payload);
        toast.success('Room updated successfully!');
      }
      setRoomMode('idle');
      loadRooms();
      loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Server operation failed.');
    }
  };

  const handleDeleteRoom = async (roomId, roomType) => {
    if (!window.confirm(`Delete configuration for Room Type "${roomType}"? Expired or occupied beds will restrict deletion.`)) {
      return;
    }
    try {
      await client.delete(`/rooms/${roomId}`);
      toast.success('Room deleted successfully!');
      setRoomMode('idle');
      loadRooms();
      loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deletion failed.');
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomType.toLowerCase().includes(roomSearch.toLowerCase()) ||
                          room.bedTypes.toLowerCase().includes(roomSearch.toLowerCase());
    const matchesStatus = roomStatusFilter === '' || 
                          (roomStatusFilter === 'Available' && room.availableBeds > 0) ||
                          (roomStatusFilter === 'Full' && room.availableBeds === 0);
    return matchesSearch && matchesStatus;
  });

  // ==========================================
  // TAB 2: BED MANAGEMENT
  // ==========================================
  const [beds, setBeds] = useState([]);
  const [bedSearch, setBedSearch] = useState('');
  const [bedStatusFilter, setBedStatusFilter] = useState('');
  const [editingBed, setEditingBed] = useState(null);
  const [editBedStatus, setEditBedStatus] = useState('');
  const [editBedResPatient, setEditBedResPatient] = useState('');
  const [editBedMaintNotes, setEditBedMaintNotes] = useState('');

  const loadBeds = async () => {
    try {
      const { data } = await client.get('/rooms/all-beds');
      setBeds(data);
    } catch (err) {
      toast.error('Failed to load beds.');
    }
  };

  const handleEditBedStatus = (bed) => {
    setEditingBed(bed);
    setEditBedStatus(bed.status);
    setEditBedResPatient(bed.reservedFor || '');
    setEditBedMaintNotes(bed.maintenanceNotes || '');
  };

  const submitBedStatusUpdate = async (e) => {
    e.preventDefault();
    if (!editingBed) return;

    try {
      await client.put(`/rooms/beds/${editingBed._id}/status`, {
        status: editBedStatus,
        reservedFor: editBedStatus === 'Reserved' ? editBedResPatient : undefined,
        maintenanceNotes: editBedStatus === 'Maintenance' ? editBedMaintNotes : undefined
      });
      toast.success('Bed status updated successfully!');
      setEditingBed(null);
      loadBeds();
      loadRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update bed status.');
    }
  };

  const filteredBeds = beds.filter(bed => {
    const matchesSearch = bed.bedNumber.toLowerCase().includes(bedSearch.toLowerCase()) ||
                          (bed.roomId?.roomType || '').toLowerCase().includes(bedSearch.toLowerCase()) ||
                          bed.bedType.toLowerCase().includes(bedSearch.toLowerCase()) ||
                          (bed.patientId?.patientName || '').toLowerCase().includes(bedSearch.toLowerCase());
    const matchesStatus = bedStatusFilter === '' || bed.status === bedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // ==========================================
  // TAB 3: BED OCCUPANCY DASHBOARD
  // ==========================================
  const totalBedsCount = beds.length;
  const availBedsCount = beds.filter(b => b.status === 'Available').length;
  const occBedsCount = beds.filter(b => b.status === 'Occupied').length;
  const resBedsCount = beds.filter(b => b.status === 'Reserved').length;
  const maintBedsCount = beds.filter(b => b.status === 'Maintenance').length;
  
  const occupancyPercentage = totalBedsCount > 0 
    ? Math.round((occBedsCount / totalBedsCount) * 100) 
    : 0;

  // Filter stats by Room Type and Bed Type
  const [dashRoomFilter, setDashRoomFilter] = useState('');
  const [dashBedTypeFilter, setDashBedTypeFilter] = useState('');

  const filteredDashBeds = beds.filter(b => {
    const matchesRoom = !dashRoomFilter || b.roomId?.roomType === dashRoomFilter;
    const matchesBed = !dashBedTypeFilter || b.bedType === dashBedTypeFilter;
    return matchesRoom && matchesBed;
  });

  // Room occupancy rates aggregation
  const roomOccupancyStats = [];
  const uniqueRooms = [...new Set(beds.map(b => b.roomId?.roomType).filter(Boolean))];
  uniqueRooms.forEach(roomType => {
    const roomBeds = beds.filter(b => b.roomId?.roomType === roomType);
    const capacity = roomBeds.length;
    const occupied = roomBeds.filter(b => b.status === 'Occupied').length;
    const rate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
    roomOccupancyStats.push({ roomType, capacity, occupied, rate });
  });

  // Bed type counts
  const bedTypeStats = [];
  const uniqueBedTypes = [...new Set(beds.map(b => b.bedType).filter(Boolean))];
  uniqueBedTypes.forEach(bedType => {
    const typeBeds = beds.filter(b => b.bedType === bedType);
    const total = typeBeds.length;
    const occupied = typeBeds.filter(b => b.status === 'Occupied').length;
    bedTypeStats.push({ bedType, total, occupied });
  });

  // ==========================================
  // TAB 4: DOCTOR ASSIGNMENT CONFIG
  // ==========================================
  const [doctorsList, setDoctorsList] = useState([]);
  const [docSearch, setDocSearch] = useState('');
  const [docDeptFilter, setDocDeptFilter] = useState('');
  const [docStatusFilter, setDocStatusFilter] = useState('');
  const [editingDocId, setEditingDocId] = useState(null);
  const [docSpecInput, setDocSpecInput] = useState('');

  const loadDoctors = async () => {
    try {
      const { data } = await client.get('/admin/doctors?includeInactive=true');
      setDoctorsList(data);
    } catch (err) {
      toast.error('Failed to load doctors.');
    }
  };

  const handleEditDocSpec = (doc) => {
    setEditingDocId(doc._id);
    setDocSpecInput(doc.specialization || '');
  };

  const saveDocSpecialization = async (docId) => {
    try {
      await client.put(`/admin/users/${docId}`, { specialization: docSpecInput });
      toast.success('Specialization saved successfully!');
      setEditingDocId(null);
      loadDoctors();
    } catch (err) {
      toast.error('Failed to save specialization.');
    }
  };

  const filteredDoctors = doctorsList.filter(doc => {
    const name = doc.doctorName || doc.username || '';
    const matchesSearch = name.toLowerCase().includes(docSearch.toLowerCase()) ||
                          (doc.specialization || '').toLowerCase().includes(docSearch.toLowerCase());
    const matchesDept = !docDeptFilter || doc.department === docDeptFilter;
    const matchesStatus = docStatusFilter === '' || 
                          (docStatusFilter === 'Active' && doc.isActive) ||
                          (docStatusFilter === 'Inactive' && !doc.isActive);
    return matchesSearch && matchesDept && matchesStatus;
  });

  // ==========================================
  // TAB 5: IPD / PID & ADMISSION SETTINGS
  // ==========================================
  const [ipdPrefix, setIpdPrefix] = useState('IPD');
  const [ipdStartNum, setIpdStartNum] = useState(1);
  const [pidPrefix, setPidPrefix] = useState('PID');
  const [pidStartNum, setPidStartNum] = useState(1);
  const [reservationTime, setReservationTime] = useState(15);
  const [statusesList, setStatusesList] = useState([]);
  const [newStatusInput, setNewStatusInput] = useState('');

  const loadSettings = async () => {
    try {
      const { data } = await client.get('/ipd/settings');
      setIpdPrefix(data.ipdPrefix);
      setIpdStartNum(data.ipdStartNumber);
      setPidPrefix(data.pidPrefix);
      setPidStartNum(data.pidStartNumber);
      setReservationTime(data.reservationTimeout);
      setStatusesList(data.admissionStatuses);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const addStatusOption = () => {
    if (!newStatusInput.trim()) return;
    if (statusesList.includes(newStatusInput.trim())) {
      toast.error('Status option already exists.');
      return;
    }
    setStatusesList([...statusesList, newStatusInput.trim()]);
    setNewStatusInput('');
  };

  const removeStatusOption = (status) => {
    if (statusesList.length === 1) {
      toast.error('At least one status option is required.');
      return;
    }
    setStatusesList(statusesList.filter(s => s !== status));
  };

  const saveAllSettings = async () => {
    try {
      await client.put('/ipd/settings', {
        ipdPrefix,
        ipdStartNumber: ipdStartNum,
        pidPrefix,
        pidStartNumber: pidStartNum,
        admissionStatuses: statusesList,
        reservationTimeout: reservationTime
      });
      toast.success('IPD Configurations saved successfully!');
      loadSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings.');
    }
  };

  // Preview Code generators
  const previewYear = new Date().getFullYear();
  const previewIpd = `${ipdPrefix}${previewYear}${String(ipdStartNum).padStart(6, '0')}`;
  const previewPid = `${pidPrefix}${String(pidStartNum).padStart(6, '0')}`;

  // ==========================================
  // TAB 6: REPORTS
  // ==========================================
  const [utilizationData, setUtilizationData] = useState([]);
  const [statsData, setStatsData] = useState({ daily: [], monthly: [], yearly: [] });
  const [revenueData, setRevenueData] = useState({ totalRevenue: 0, roomRevenue: [], bedTypeRevenue: [] });
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  const loadReports = async () => {
    try {
      const q = (reportStartDate || reportEndDate) 
        ? `?startDate=${reportStartDate}&endDate=${reportEndDate}` 
        : '';
      
      const { data: util } = await client.get('/ipd/reports/utilization');
      setUtilizationData(util);

      const { data: stats } = await client.get(`/ipd/reports/admission-stats${q}`);
      setStatsData(stats);

      const { data: rev } = await client.get(`/ipd/reports/revenue${q}`);
      setRevenueData(rev);
    } catch (err) {
      console.error('Failed to load report data:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab, reportStartDate, reportEndDate]);

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">IPD Master Administration</h1>
          <p className="text-sm text-gray-500">Configure rooms, beds, sequential codes, doctor assignments, and track utilization reports.</p>
        </div>
        <button onClick={loadData} className="btn-secondary" title="Sync dashboard data">
          <RefreshCw className="h-4 w-4" /> Refresh System
        </button>
      </div>

      {/* Workspace Tabs Header */}
      <div className="flex flex-wrap border-b border-orange-100 gap-1 text-sm bg-white p-2 rounded-2xl shadow-sm border border-orange-50">
        {[
          { id: 'rooms', label: 'Room Configurations', icon: Building2 },
          { id: 'beds', label: 'Bed Management', icon: Bed },
          { id: 'dashboard', label: 'Occupancy Dashboard', icon: Activity },
          { id: 'doctors', label: 'Doctor Assignment', icon: Stethoscope },
          { id: 'settings', label: 'Admission Settings', icon: Settings },
          { id: 'reports', label: 'Master Reports', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT MODULES */}
      <div className="min-h-[400px]">

        {/* ==================== TAB 1: ROOMS ==================== */}
        {activeTab === 'rooms' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_450px]">
            {/* List */}
            <div className="space-y-4">
              <div className="card p-4 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    className="input pl-9"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                  />
                </div>
                <select
                  className="input py-2 md:w-[160px]"
                  value={roomStatusFilter}
                  onChange={(e) => setRoomStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Available">Available Beds</option>
                  <option value="Full">Full</option>
                </select>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-orange-50/50 text-xs font-bold uppercase text-orange-800 border-b border-orange-100">
                      <th className="p-4">Room Type</th>
                      <th className="p-4">Description</th>
                      <th className="p-4 text-center">Beds</th>
                      <th className="p-4">Bed Configurations</th>
                      <th className="p-4">Price Range</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50 text-sm">
                    {filteredRooms.map(room => (
                      <tr key={room._id} className={`hover:bg-orange-50/10 ${selectedRoomId === room._id ? 'bg-orange-50/20' : ''}`}>
                        <td className="p-4 font-bold text-gray-900">{room.roomType}</td>
                        <td className="p-4 text-gray-500 text-xs max-w-[150px] truncate" title={room.description}>
                          {room.description || 'No description'}
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-gray-900">{room.totalBeds}</span>
                          <span className="text-gray-400 font-normal block text-[10px]">
                            {room.availableBeds} Avail / {room.occupiedBeds} Occ
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 text-xs max-w-[200px] truncate" title={room.bedTypes}>
                          {room.bedTypes}
                        </td>
                        <td className="p-4 font-semibold text-orange-700">{room.priceRange}</td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button 
                              onClick={() => handleEditRoomMode(room)} 
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                              title="Edit config"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteRoom(room._id, room.roomType)} 
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete config"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRooms.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500">No rooms configured.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Room Config Panel */}
            <div>
              {roomMode === 'idle' ? (
                <div className="card p-8 text-center border-dashed border-2 border-orange-200 bg-orange-50/5 flex flex-col items-center justify-center min-h-[350px]">
                  <Building2 className="h-10 w-10 text-orange-300 mb-2" />
                  <h2 className="text-md font-bold text-gray-800">Room Settings Editor</h2>
                  <p className="mt-1 text-xs text-gray-400 max-w-xs mx-auto">
                    Select a room config to modify, or click Add Room to define capacities and base charges.
                  </p>
                  <button onClick={handleAddRoomMode} className="btn mt-4 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Room Config
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRoomSubmit} className="card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-orange-50 pb-2">
                    <h2 className="font-extrabold text-gray-900 text-lg">
                      {roomMode === 'add' ? 'New Room Type' : 'Edit Room Settings'}
                    </h2>
                    <button type="button" onClick={() => setRoomMode('idle')} className="text-gray-400 hover:text-gray-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Room Type */}
                  <div className="grid gap-3 grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Room Type</span>
                      <select
                        className="input py-2 text-xs"
                        value={formRoomType}
                        onChange={(e) => setFormRoomType(e.target.value)}
                      >
                        {DEFAULT_ROOM_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                        <option value="Custom">Custom...</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Total Beds</span>
                      <input
                        type="number"
                        min="1"
                        className="input py-2 text-xs"
                        value={formTotalBeds}
                        onChange={(e) => setFormTotalBeds(Math.max(1, parseInt(e.target.value, 10) || 0))}
                      />
                    </label>
                  </div>

                  {formRoomType === 'Custom' && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Custom Room Name</span>
                      <input
                        type="text"
                        placeholder="e.g. Executive Deluxe"
                        className="input py-2 text-xs"
                        value={formCustomRoomType}
                        onChange={(e) => setFormCustomRoomType(e.target.value)}
                        required
                      />
                    </label>
                  )}

                  {/* Description */}
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Description / Amenities</span>
                    <textarea
                      placeholder="e.g. AC Room, Sofa, LED TV, Fridge, Reclining Bed"
                      className="input py-2 text-xs min-h-[50px]"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </label>

                  {/* Bed configuration section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold border-b border-orange-50 pb-1">
                      <span className="text-gray-500 uppercase tracking-wide">Bed Groupings</span>
                      <button type="button" onClick={addBedConfigRow} className="text-orange-600 flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Add Bed Type
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                      {formBedConfigs.map((config, idx) => (
                        <div key={idx} className="bg-orange-50/20 border border-orange-50 p-2.5 rounded-xl relative space-y-2">
                          {formBedConfigs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBedConfigRow(idx)}
                              className="absolute right-1.5 top-1.5 text-gray-400 hover:text-red-500 p-0.5 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <div className="grid gap-2 grid-cols-2">
                            <label className="block col-span-2">
                              <span className="mb-0.5 block text-[10px] font-semibold text-gray-500 uppercase">Bed Type</span>
                              <select
                                className="input py-1.5 text-[11px]"
                                value={config.bedType}
                                onChange={(e) => updateConfigField(idx, 'bedType', e.target.value)}
                              >
                                {DEFAULT_BED_TYPES.map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>)}
                                <option value="Custom">Custom...</option>
                              </select>
                            </label>

                            {config.bedType === 'Custom' && (
                              <label className="block col-span-2">
                                <span className="mb-0.5 block text-[10px] font-semibold text-gray-500 uppercase">Custom Bed Name</span>
                                <input
                                  type="text"
                                  placeholder="e.g. Electric Bed"
                                  className="input py-1.5 text-[11px]"
                                  value={config.customBedType}
                                  onChange={(e) => updateConfigField(idx, 'customBedType', e.target.value)}
                                  required
                                />
                              </label>
                            )}

                            <label className="block">
                              <span className="mb-0.5 block text-[10px] font-semibold text-gray-500 uppercase">Quantity</span>
                              <input
                                type="number"
                                min="1"
                                className="input py-1.5 text-[11px]"
                                value={config.numberOfBeds}
                                onChange={(e) => updateConfigField(idx, 'numberOfBeds', Math.max(1, parseInt(e.target.value, 10) || 0))}
                              />
                            </label>

                            <label className="block">
                              <span className="mb-0.5 block text-[10px] font-semibold text-gray-500 uppercase">Charge/Day</span>
                              <input
                                type="number"
                                min="0"
                                className="input py-1.5 text-[11px]"
                                value={config.pricePerDay}
                                onChange={(e) => updateConfigField(idx, 'pricePerDay', Math.max(0, parseInt(e.target.value, 10) || 0))}
                              />
                            </label>
                          </div>

                          <label className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <input
                              type="checkbox"
                              checked={config.applySamePrice}
                              onChange={(e) => updateConfigField(idx, 'applySamePrice', e.target.checked)}
                              className="rounded border-orange-200 text-orange-500 focus:ring-orange-200 h-3 w-3"
                            />
                            <span>Apply same price for all beds of this type</span>
                          </label>

                          {/* Bed Codes Section */}
                          <div className="mt-1 p-2 bg-white rounded-lg border border-orange-50 space-y-1">
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">Bed Codes (Optional - leave blank for auto-generation)</span>
                            <div className="grid gap-1 grid-cols-2 max-h-[100px] overflow-y-auto">
                              {Array.from({ length: Number(config.numberOfBeds) || 0 }).map((_, bIdx) => (
                                <label key={bIdx} className="flex items-center gap-1 text-[10px] bg-gray-50 p-0.5 rounded">
                                  <span className="text-gray-400">#{(bIdx + 1)}</span>
                                  <input
                                    type="text"
                                    placeholder={`e.g. ${formRoomType === 'Custom' ? formCustomRoomType : formRoomType}-${bIdx + 1}`}
                                    className="w-full bg-transparent border-0 p-0 text-[10px] focus:ring-0"
                                    value={(config.bedCodes && config.bedCodes[bIdx]) || ''}
                                    onChange={(e) => updateBedCode(idx, bIdx, e.target.value)}
                                  />
                                </label>
                              ))}
                            </div>
                            <p className="text-[8px] text-gray-400">If left blank, bed codes will be auto-generated (e.g. ICU-S-001)</p>
                          </div>

                          {!config.applySamePrice && (
                            <div className="mt-1 p-2 bg-white rounded-lg border border-orange-50 space-y-1">
                              <span className="text-[9px] font-bold text-gray-400 block uppercase">Price allocation</span>
                              <div className="grid gap-1 grid-cols-2 max-h-[80px] overflow-y-auto">
                                {Array.from({ length: Number(config.numberOfBeds) || 0 }).map((_, bIdx) => (
                                  <label key={bIdx} className="flex items-center gap-1 text-[10px] bg-gray-50 p-0.5 rounded">
                                    <span className="text-gray-400">#{(bIdx + 1)}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      className="w-full bg-transparent border-0 p-0 text-[10px] focus:ring-0"
                                      value={config.individualPrices[bIdx] !== undefined ? config.individualPrices[bIdx] : config.pricePerDay}
                                      onChange={(e) => updateIndividualPrice(idx, bIdx, e.target.value)}
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

                  {/* Bed check alert banner */}
                  <div className={`p-2.5 rounded-xl text-xs flex justify-between font-bold ${
                    isBedsCountValid 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    <span>Beds Total/Config: {formTotalBeds} / {sumConfiguredBeds}</span>
                    {!isBedsCountValid && <span className="text-[10px] font-medium">Counts must match.</span>}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-orange-50 pt-2">
                    <button type="button" onClick={() => setRoomMode('idle')} className="btn-secondary py-1.5 px-3 text-xs">Cancel</button>
                    <button type="submit" disabled={!isBedsCountValid} className="btn py-1.5 px-4 text-xs disabled:opacity-50">Save Room</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: BED MANAGEMENT ==================== */}
        {activeTab === 'beds' && (
          <div className="space-y-4">
            <div className="card p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Bed Number, Room Type, Bed Type, or Patient Name..."
                  className="input pl-9"
                  value={bedSearch}
                  onChange={(e) => setBedSearch(e.target.value)}
                />
              </div>
              <select
                className="input py-2 md:w-[180px]"
                value={bedStatusFilter}
                onChange={(e) => setBedStatusFilter(e.target.value)}
              >
                <option value="">All Bed Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Reserved">Reserved</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Bed List */}
              <div className="card overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-orange-50/50 text-xs font-bold uppercase text-orange-800 border-b border-orange-100">
                      <th className="p-4">Bed Number</th>
                      <th className="p-4">Room Type</th>
                      <th className="p-4">Bed Type</th>
                      <th className="p-4">Daily Charge</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Current Occupant</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50 text-sm">
                    {filteredBeds.map(bed => (
                      <tr key={bed._id} className="hover:bg-orange-50/10">
                        <td className="p-4 font-mono font-bold text-gray-800">{bed.bedNumber}</td>
                        <td className="p-4 font-semibold text-gray-900">{bed.roomId?.roomType || 'N/A'}</td>
                        <td className="p-4 text-gray-600">{bed.bedType}</td>
                        <td className="p-4 font-bold text-orange-700">₹{bed.pricePerDay}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            bed.status === 'Available' ? 'bg-green-100 text-green-800' :
                            bed.status === 'Occupied' ? 'bg-red-100 text-red-800' :
                            bed.status === 'Reserved' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bed.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs">
                          {bed.status === 'Occupied' ? (
                            <div>
                              <p className="font-bold text-gray-900">{bed.patientId?.patientName}</p>
                              <span className="font-mono text-orange-700 text-[10px] block font-semibold">{bed.patientId?.uhid}</span>
                            </div>
                          ) : bed.status === 'Reserved' ? (
                            <span className="text-blue-600 block max-w-[120px] truncate" title={bed.reservedFor}>
                              Reserved: {bed.reservedFor || 'Pending'}
                            </span>
                          ) : bed.status === 'Maintenance' ? (
                            <span className="text-yellow-600 block max-w-[120px] truncate font-semibold" title={bed.maintenanceNotes}>
                              Notes: {bed.maintenanceNotes || 'Maintenance'}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleEditBedStatus(bed)}
                            className="btn-secondary text-xs px-2.5 py-1"
                            disabled={bed.status === 'Occupied'}
                            title={bed.status === 'Occupied' ? 'Occupied beds status must be managed via admission/discharge' : 'Update status'}
                          >
                            Change Status
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredBeds.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-500">No beds found matching filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Status Editor Panel */}
              <div>
                {editingBed ? (
                  <form onSubmit={submitBedStatusUpdate} className="card p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-orange-50 pb-2">
                      <h2 className="font-bold text-gray-900 text-md">Status Change: {editingBed.bedNumber}</h2>
                      <button type="button" onClick={() => setEditingBed(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Set Bed Status</span>
                      <select
                        className="input py-2 text-xs"
                        value={editBedStatus}
                        onChange={(e) => setEditBedStatus(e.target.value)}
                      >
                        <option value="Available">Available</option>
                        <option value="Reserved">Reserved / Hold</option>
                        <option value="Maintenance">Maintenance / Blocked</option>
                      </select>
                    </label>

                    {editBedStatus === 'Reserved' && (
                      <label className="block animate-fadeIn">
                        <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Reserved For Patient Name</span>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          className="input py-2 text-xs"
                          value={editBedResPatient}
                          onChange={(e) => setEditBedResPatient(e.target.value)}
                          required
                        />
                      </label>
                    )}

                    {editBedStatus === 'Maintenance' && (
                      <label className="block animate-fadeIn">
                        <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Maintenance Reason</span>
                        <textarea
                          placeholder="e.g. Cleaning, Bed repair, Wall paint..."
                          className="input py-2 text-xs min-h-[60px]"
                          value={editBedMaintNotes}
                          onChange={(e) => setEditBedMaintNotes(e.target.value)}
                          required
                        />
                      </label>
                    )}

                    <div className="flex gap-2 justify-end border-t border-orange-50 pt-2">
                      <button type="button" onClick={() => setEditingBed(null)} className="btn-secondary py-1 px-3 text-xs">Cancel</button>
                      <button type="submit" className="btn py-1 px-4 text-xs">Update Status</button>
                    </div>
                  </form>
                ) : (
                  <div className="card p-6 text-center border-dashed border-2 border-orange-200 bg-orange-50/5 flex flex-col items-center justify-center min-h-[200px]">
                    <Bed className="h-8 w-8 text-orange-300 mb-1" />
                    <span className="text-xs font-bold text-gray-700">Bed Status Manager</span>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">
                      Select "Change Status" on any unoccupied bed to toggle hold reservations or schedule maintenance.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: OCCUPANCY DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Dashboard Cards Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              {[
                { label: 'Total Beds', count: totalBedsCount, color: 'text-gray-800 bg-gray-50' },
                { label: 'Available', count: availBedsCount, color: 'text-green-700 bg-green-50' },
                { label: 'Occupied', count: occBedsCount, color: 'text-red-700 bg-red-50' },
                { label: 'Reserved', count: resBedsCount, color: 'text-blue-700 bg-blue-50' },
                { label: 'Maintenance', count: maintBedsCount, color: 'text-yellow-700 bg-yellow-50' }
              ].map((card, idx) => (
                <div key={idx} className="card p-4 text-center">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">{card.label}</span>
                  <span className={`inline-block mt-2 text-3xl font-black rounded-2xl px-4 py-1 ${card.color}`}>
                    {card.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Dashboard Analytics Section */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Circular Occupancy Meter */}
              <div className="card p-5 flex flex-col items-center justify-center text-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Total Bed Occupancy Rate</h3>
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" className="stroke-orange-50 fill-none" strokeWidth="12" />
                    <circle cx="64" cy="64" r="54" className="stroke-orange-500 fill-none transition-all duration-1000" strokeWidth="12"
                            strokeDasharray="339.3" strokeDashoffset={339.3 - (339.3 * occupancyPercentage) / 100} />
                  </svg>
                  <span className="text-3xl font-black text-gray-800">{occupancyPercentage}%</span>
                </div>
                <span className="text-xs text-gray-400 mt-4 font-bold">{occBedsCount} of {totalBedsCount} Beds currently occupied</span>
              </div>

              {/* Room-wise Occupancy horizontal bars */}
              <div className="card p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Room-wise Occupancy Rate</h3>
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {roomOccupancyStats.map(stat => (
                    <div key={stat.roomType} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>{stat.roomType}</span>
                        <span>{stat.occupied} / {stat.capacity} Beds ({stat.rate}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                        <div className="bg-orange-500 h-full" style={{ width: `${stat.rate}%` }}></div>
                      </div>
                    </div>
                  ))}
                  {roomOccupancyStats.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No rooms loaded.</p>}
                </div>
              </div>

              {/* Bed Type occupancy breakdown */}
              <div className="card p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Bed Type Breakdown</h3>
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {bedTypeStats.map(stat => {
                    const rate = stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0;
                    return (
                      <div key={stat.bedType} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>{stat.bedType}</span>
                          <span>{stat.occupied} / {stat.total} ({rate}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-orange-500 h-full" style={{ width: `${rate}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {bedTypeStats.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No bed configurations configured.</p>}
                </div>
              </div>
            </div>

            {/* Occupancy Filters & Beds list */}
            <div className="card p-5 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-orange-50 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                  <Filter className="h-4 w-4" /> Live Ward Search & Filter
                </h3>
                <div className="flex gap-2 w-full md:w-auto">
                  <select
                    className="input py-1.5 text-xs"
                    value={dashRoomFilter}
                    onChange={(e) => setDashRoomFilter(e.target.value)}
                  >
                    <option value="">All Rooms</option>
                    {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select
                    className="input py-1.5 text-xs"
                    value={dashBedTypeFilter}
                    onChange={(e) => setDashBedTypeFilter(e.target.value)}
                  >
                    <option value="">All Bed Types</option>
                    {uniqueBedTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Dynamic Grid Layout of Beds */}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 max-h-[300px] overflow-y-auto pr-1">
                {filteredDashBeds.map(bed => {
                  let cardColor = 'border-green-200 bg-green-50/25 text-green-800';
                  if (bed.status === 'Occupied') cardColor = 'border-red-200 bg-red-50/25 text-red-800';
                  if (bed.status === 'Reserved') cardColor = 'border-blue-200 bg-blue-50/25 text-blue-800';
                  if (bed.status === 'Maintenance') cardColor = 'border-yellow-200 bg-yellow-50/25 text-yellow-800';

                  return (
                    <div key={bed._id} className={`border rounded-xl p-3 text-center text-xs transition hover:shadow-sm ${cardColor}`}>
                      <span className="font-mono font-bold text-sm block">{bed.bedNumber}</span>
                      <span className="block font-medium mt-1 truncate">{bed.roomId?.roomType}</span>
                      <span className="block font-semibold mt-0.5 text-[10px] text-gray-400">{bed.bedType}</span>
                      <span className="block text-[9px] font-black uppercase mt-2 tracking-wide">{bed.status}</span>
                    </div>
                  );
                })}
                {filteredDashBeds.length === 0 && (
                  <p className="col-span-full text-xs text-gray-500 py-6 text-center">No beds match filter conditions.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: DOCTORS ==================== */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <div className="card p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by doctor name or specialization..."
                  className="input pl-9"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="input py-2 text-xs min-w-[150px]"
                  value={docDeptFilter}
                  onChange={(e) => setDocDeptFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {[...new Set(doctorsList.map(d => d.department).filter(Boolean))].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  className="input py-2 text-xs min-w-[140px]"
                  value={docStatusFilter}
                  onChange={(e) => setDocStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-50/50 text-xs font-bold uppercase text-orange-800 border-b border-orange-100">
                    <th className="p-4">Doctor Name</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Specialization</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 text-sm">
                  {filteredDoctors.map(doc => (
                    <tr key={doc._id} className="hover:bg-orange-50/10">
                      <td className="p-4 font-bold text-gray-900">Dr. {doc.doctorName || doc.username}</td>
                      <td className="p-4 font-semibold text-orange-700">{doc.department || 'N/A'}</td>
                      <td className="p-4">
                        {editingDocId === doc._id ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              className="input py-1 text-xs"
                              value={docSpecInput}
                              onChange={(e) => setDocSpecInput(e.target.value)}
                              placeholder="e.g. Cardiologist"
                            />
                            <button
                              onClick={() => saveDocSpecialization(doc._id)}
                              className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-600 italic">
                            {doc.specialization || 'Not configured'}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold leading-none ${
                          doc.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {doc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {editingDocId !== doc._id && (
                          <button
                            onClick={() => handleEditDocSpec(doc)}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            Edit Specialization
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredDoctors.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">No doctors found matching criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* sequential numbering settings */}
            <div className="card p-6 space-y-4 h-fit">
              <h2 className="font-extrabold text-gray-900 text-lg border-b border-orange-50 pb-2">IPD / PID Sequential Numbering</h2>
              
              <div className="p-3 bg-orange-50/20 border border-orange-50 rounded-2xl space-y-3">
                <h3 className="text-xs font-black uppercase text-orange-600">IPD Admission Code Schema</h3>
                <div className="grid gap-3 grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Prefix</span>
                    <input
                      type="text"
                      className="input py-2 text-xs"
                      value={ipdPrefix}
                      onChange={(e) => setIpdPrefix(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Starting Seq</span>
                    <input
                      type="number"
                      min="1"
                      className="input py-2 text-xs"
                      value={ipdStartNum}
                      onChange={(e) => setIpdStartNum(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </label>
                </div>
                <div className="text-xs text-gray-400 font-semibold pt-1">
                  Prefix + Year + Seq code preview: <span className="font-mono font-bold text-gray-900">{previewIpd}</span>
                </div>
              </div>

              <div className="p-3 bg-orange-50/20 border border-orange-50 rounded-2xl space-y-3">
                <h3 className="text-xs font-black uppercase text-orange-600">PID Admission Number Schema</h3>
                <div className="grid gap-3 grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Prefix</span>
                    <input
                      type="text"
                      className="input py-2 text-xs"
                      value={pidPrefix}
                      onChange={(e) => setPidPrefix(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">Starting Seq</span>
                    <input
                      type="number"
                      min="1"
                      className="input py-2 text-xs"
                      value={pidStartNum}
                      onChange={(e) => setPidStartNum(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </label>
                </div>
                <div className="text-xs text-gray-400 font-semibold pt-1">
                  Prefix + Seq code preview: <span className="font-mono font-bold text-gray-900">{previewPid}</span>
                </div>
              </div>

              {/* Reservation settings */}
              <label className="block p-3 bg-orange-50/20 border border-orange-50 rounded-2xl">
                <span className="mb-1 block text-xs font-bold text-gray-500 uppercase">Bed Reservation Timeout (Minutes)</span>
                <input
                  type="number"
                  min="1"
                  className="input py-2 text-xs"
                  value={reservationTime}
                  onChange={(e) => setReservationTime(Math.max(1, parseInt(e.target.value, 10) || 15))}
                />
                <span className="block text-[10px] text-gray-400 mt-1">
                  Reserved beds automatically revert to Available if admission is not completed within this timeframe.
                </span>
              </label>

              <button onClick={saveAllSettings} className="btn w-full">
                <Save className="h-4 w-4" /> Save Configuration Settings
              </button>
            </div>

            {/* Custom statuses configuration */}
            <div className="card p-6 space-y-4">
              <h2 className="font-extrabold text-gray-900 text-lg border-b border-orange-50 pb-2">Custom Admission Statuses</h2>
              <p className="text-xs text-gray-500">
                Configure patient statuses that can be toggled inside IPD Admission registration workflows.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Under Observation"
                  className="input py-2 text-xs"
                  value={newStatusInput}
                  onChange={(e) => setNewStatusInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addStatusOption()}
                />
                <button onClick={addStatusOption} className="btn text-xs px-4">
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {statusesList.map((status, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-orange-50/20 border border-orange-50 px-3 py-2 rounded-xl text-xs font-semibold">
                    <span>{status}</span>
                    <button
                      type="button"
                      onClick={() => removeStatusOption(status)}
                      className="text-red-500 p-1 hover:bg-orange-100/50 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {statusesList.length === 0 && (
                  <p className="text-xs text-gray-400 py-4 text-center">No statuses configured.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 6: REPORTS ==================== */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Reports Date Filter Panel */}
            <div className="card p-4 flex flex-col md:flex-row items-center gap-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="h-4 w-4" /> Report Filters
              </span>
              <div className="flex gap-2 items-center w-full md:w-auto">
                <input
                  type="date"
                  className="input py-1.5 text-xs text-gray-600"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="date"
                  className="input py-1.5 text-xs text-gray-600"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* utilization reports section */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Room utilization */}
              <div className="card p-5 space-y-4">
                <h3 className="text-md font-extrabold text-gray-900 border-b border-orange-50 pb-2 flex items-center justify-between">
                  <span>Room Utilization Report</span>
                  <span className="text-xs text-orange-500 font-bold">Live Stats</span>
                </h3>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-orange-50/50 text-[10px] font-bold uppercase text-orange-800 border-b border-orange-50">
                        <th className="p-2">Room Type</th>
                        <th className="p-2 text-center">Capacity</th>
                        <th className="p-2 text-center">Occupied</th>
                        <th className="p-2 text-center">Available</th>
                        <th className="p-2 text-right">Occupancy Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50 text-gray-700">
                      {utilizationData.map(d => (
                        <tr key={d.roomId} className="hover:bg-orange-50/5">
                          <td className="p-2 font-bold text-gray-900">{d.roomType}</td>
                          <td className="p-2 text-center font-semibold">{d.capacity}</td>
                          <td className="p-2 text-center text-red-500 font-bold">{d.occupied}</td>
                          <td className="p-2 text-center text-green-600 font-semibold">{d.available}</td>
                          <td className="p-2 text-right font-extrabold text-orange-700">{d.occupancyPercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* revenue report */}
              <div className="card p-5 space-y-4">
                <h3 className="text-md font-extrabold text-gray-900 border-b border-orange-50 pb-2 flex justify-between items-center">
                  <span>IPD Revenue Summary</span>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-xl text-xs font-black shadow-md shadow-orange-500/20">
                    Total: ₹{revenueData.totalRevenue}
                  </span>
                </h3>
                <div className="grid gap-4 grid-cols-2 text-xs">
                  {/* Room revenue list */}
                  <div className="space-y-2 bg-orange-50/10 p-3 rounded-2xl border border-orange-50">
                    <span className="block text-[10px] font-black uppercase text-orange-600 border-b border-orange-50 pb-1">Room Category Revenue</span>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {revenueData.roomRevenue.map(item => (
                        <div key={item.name} className="flex justify-between items-center text-gray-700">
                          <span className="font-semibold">{item.name}</span>
                          <span className="font-bold">₹{item.value}</span>
                        </div>
                      ))}
                      {revenueData.roomRevenue.length === 0 && <span className="text-gray-400 italic block py-2 text-center">No revenue earned</span>}
                    </div>
                  </div>

                  {/* Bed type revenue list */}
                  <div className="space-y-2 bg-orange-50/10 p-3 rounded-2xl border border-orange-50">
                    <span className="block text-[10px] font-black uppercase text-orange-600 border-b border-orange-50 pb-1">Bed Type Revenue</span>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {revenueData.bedTypeRevenue.map(item => (
                        <div key={item.name} className="flex justify-between items-center text-gray-700">
                          <span className="font-semibold">{item.name}</span>
                          <span className="font-bold">₹{item.value}</span>
                        </div>
                      ))}
                      {revenueData.bedTypeRevenue.length === 0 && <span className="text-gray-400 italic block py-2 text-center">No revenue earned</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admission Stats lists */}
            <div className="card p-5 space-y-4">
              <h3 className="text-md font-extrabold text-gray-900 border-b border-orange-50 pb-2 flex justify-between items-center">
                <span>Admission Timeline Reports</span>
                <span className="text-xs text-gray-500 font-medium">Volumetric admissions</span>
              </h3>

              {/* Statistics timeline grid */}
              <div className="grid gap-6 md:grid-cols-3 text-xs">
                {/* Daily Admissions List */}
                <div className="space-y-2 p-3 bg-orange-50/10 border border-orange-50 rounded-2xl">
                  <span className="block text-[10px] font-black uppercase text-orange-600 border-b border-orange-50 pb-1 flex justify-between">
                    <span>Daily Admission Counts</span>
                    <TrendingUp className="h-3 w-3" />
                  </span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {statsData.daily.map(d => (
                      <div key={d.label} className="flex justify-between items-center text-gray-700">
                        <span className="font-semibold">{d.label}</span>
                        <span className="font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">{d.count}</span>
                      </div>
                    ))}
                    {statsData.daily.length === 0 && <span className="text-gray-400 italic block py-2 text-center">No daily admissions</span>}
                  </div>
                </div>

                {/* Monthly Admissions List */}
                <div className="space-y-2 p-3 bg-orange-50/10 border border-orange-50 rounded-2xl">
                  <span className="block text-[10px] font-black uppercase text-orange-600 border-b border-orange-50 pb-1 flex justify-between">
                    <span>Monthly Admission Counts</span>
                    <TrendingUp className="h-3 w-3" />
                  </span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {statsData.monthly.map(d => (
                      <div key={d.label} className="flex justify-between items-center text-gray-700">
                        <span className="font-semibold">{d.label}</span>
                        <span className="font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">{d.count}</span>
                      </div>
                    ))}
                    {statsData.monthly.length === 0 && <span className="text-gray-400 italic block py-2 text-center">No monthly admissions</span>}
                  </div>
                </div>

                {/* Yearly Admissions List */}
                <div className="space-y-2 p-3 bg-orange-50/10 border border-orange-50 rounded-2xl">
                  <span className="block text-[10px] font-black uppercase text-orange-600 border-b border-orange-50 pb-1 flex justify-between">
                    <span>Yearly Admission Counts</span>
                    <TrendingUp className="h-3 w-3" />
                  </span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {statsData.yearly.map(d => (
                      <div key={d.label} className="flex justify-between items-center text-gray-700">
                        <span className="font-semibold">{d.label}</span>
                        <span className="font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">{d.count}</span>
                      </div>
                    ))}
                    {statsData.yearly.length === 0 && <span className="text-gray-400 italic block py-2 text-center">No yearly admissions</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default IpdAdminWorkspace;
