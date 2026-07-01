import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity, Sparkles, Loader2, Bed, CheckCircle, Clock,
  User, RefreshCw, AlertCircle, X, ClipboardCheck
} from 'lucide-react';
import client from '../../api/client';

const IpdSameDayDashboard = () => {
  const navigate = useNavigate();
  
  // Admissions states
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bed allocation modal states
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [roomsList, setRoomsList] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [bedsList, setBedsList] = useState([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [allocating, setAllocating] = useState(false);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/ipd/admissions');
      // Filter only Same Day Care admissions
      const filtered = (data || []).filter(adm => adm.isSameDayCare);
      setAdmissions(filtered);
    } catch (err) {
      toast.error('Failed to load Same Day Care admissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data } = await client.get('/rooms');
      setRoomsList(data || []);
    } catch (err) {
      console.warn('Failed to load rooms list');
    }
  };

  const fetchBeds = async (roomType) => {
    try {
      const { data } = await client.get(`/rooms/beds?roomType=${encodeURIComponent(roomType)}`);
      setBedsList(data || []);
    } catch (err) {
      console.warn('Failed to load beds list');
    }
  };

  useEffect(() => {
    fetchAdmissions();
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomType) {
      fetchBeds(selectedRoomType);
    } else {
      setBedsList([]);
    }
    setSelectedBedId('');
  }, [selectedRoomType]);

  const handleOpenAllocateModal = (adm) => {
    setSelectedAdmission(adm);
    setSelectedRoomType('');
    setSelectedBedId('');
    setShowAllocateModal(true);
  };

  const handleAllocateBed = async () => {
    if (!selectedRoomType || !selectedBedId) {
      toast.error('Please select a ward and a bed');
      return;
    }
    setAllocating(true);
    try {
      const roomObj = roomsList.find(r => r.roomType === selectedRoomType);
      const payload = {
        roomId: roomObj?._id,
        bedId: selectedBedId
      };
      await client.put(`/ipd/admissions/${selectedAdmission._id}/allocate-bed`, payload);
      toast.success('Bed allocated successfully and patient admitted!');
      setShowAllocateModal(false);
      fetchAdmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate bed');
    } finally {
      setAllocating(false);
    }
  };

  const formatUhid = (uhid) => {
    if (!uhid) return '-';
    if (uhid.startsWith('UHID-')) return uhid;
    return `UHID-${uhid}`;
  };

  const ageFromDob = (dob) => {
    if (!dob) return '-';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">IPD Same Day Care</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">Manage rapid surgical inpatient admissions, short-term ward stays, and fast-track recovery tracking.</p>
        </div>
        <div className="flex gap-2 font-bold">
          <button 
            onClick={fetchAdmissions}
            className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
            title="Refresh List"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Warning/Status Alerts */}
      <div className="flex items-start gap-3 p-4 bg-orange-50/50 border border-orange-200 rounded-2xl animate-in slide-in-from-top-1">
        <Sparkles className="h-5 w-5 text-orange-600 mt-0.5 animate-pulse flex-shrink-0" />
        <div>
          <h4 className="text-xs font-extrabold text-orange-950">Under Configuration</h4>
          <p className="text-[11px] text-orange-800 leading-relaxed mt-1">
            This module section handles patients referred from the Same Day Care module. If sent without bed allocation, you can assign recovery beds below.
          </p>
        </div>
      </div>

      {/* Patient Admission List Table */}
      <div className="card overflow-hidden border border-orange-100 shadow-sm rounded-2xl bg-white">
        <div className="p-4 border-b border-orange-100 bg-orange-50/30 flex items-center justify-between">
          <h3 className="font-extrabold text-gray-900 flex items-center gap-2 text-sm">
            <Bed className="h-5 w-5 text-orange-500" /> Active Same Day Admissions ({admissions.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-55/40 text-[10px] font-bold uppercase text-gray-500 border-b border-orange-100">
              <tr className="bg-orange-50/10">
                <th className="p-3.5 pl-4">Patient Name</th>
                <th className="p-3.5">UHID</th>
                <th className="p-3.5">Doctor In Charge</th>
                <th className="p-3.5">Bed Allocation</th>
                <th className="p-3.5">Admission Date</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-500" />
                    <span>Loading admissions list...</span>
                  </td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-450">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-400" />
                    <p className="font-extrabold text-gray-500">No same day care admissions found</p>
                  </td>
                </tr>
              ) : (
                admissions.map(adm => {
                  const pat = adm.patientId || {};
                  return (
                    <tr key={adm._id} className="hover:bg-orange-50/10">
                      <td className="p-3.5 pl-4">
                        <div className="font-extrabold text-gray-900 text-xs">{pat.patientName || 'N/A'}</div>
                        <div className="text-[9px] text-gray-500 font-semibold">{pat.dob ? ageFromDob(pat.dob) : '-'} yrs / {pat.gender || '-'}</div>
                      </td>
                      <td className="p-3.5 font-mono text-[10px] font-bold text-orange-700">
                        {formatUhid(pat.uhid)}
                      </td>
                      <td className="p-3.5 text-xs text-gray-700">
                        Dr. {adm.doctorInCharge?.doctorName || adm.doctorInCharge?.username || 'N/A'}
                      </td>
                      <td className="p-3.5">
                        {adm.roomId ? (
                          <div className="text-xs">
                            <span className="font-bold text-gray-800">{adm.roomId.roomType}</span>
                            <span className="block text-[10px] text-gray-550">Bed: {adm.bedId?.bedNumber || 'N/A'}</span>
                          </div>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="h-2.5 w-2.5 mr-1" /> Pending Bed Allocation
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-gray-500">
                        {new Date(adm.admissionDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          adm.status === 'Admitted' ? 'bg-green-50 text-green-700 border-green-200' :
                          adm.status === 'Discharged' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {adm.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 text-center">
                        <div className="flex gap-2 justify-center font-bold">
                          {adm.status === 'Pending Allocation' && (
                            <button
                              onClick={() => handleOpenAllocateModal(adm)}
                              className="btn py-1.5 px-3 text-[10px] font-extrabold bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1 rounded-lg"
                            >
                              <Bed className="h-3 w-3" /> Allocate Bed
                            </button>
                          )}
                          <button
                            onClick={() => navigate('/same-day-care/ipd-patients')}
                            className="btn-secondary py-1.5 px-3 text-[10px] font-bold border-orange-200 text-orange-755 hover:bg-orange-50 flex items-center gap-1 rounded-lg"
                          >
                            <ClipboardCheck className="h-3 w-3" /> View Charts
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
      </div>

      {/* Bed Allocation Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 relative bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAllocateModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-orange-50 pb-3 mb-4">
              <Bed className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-gray-900 text-base">
                Allocate Bed: {selectedAdmission?.patientId?.patientName}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500 font-sans">Ward / Room Type</label>
                <select
                  className="input py-2 text-xs bg-white border-orange-100"
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                >
                  <option value="">Select Ward...</option>
                  {roomsList.map((room, idx) => (
                    <option key={idx} value={room.roomType}>{room.roomType} (₹{room.price}/day)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500 font-sans">Bed Number</label>
                <select
                  className="input py-2 text-xs bg-white border-orange-100"
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  disabled={!selectedRoomType}
                >
                  <option value="">Select Bed...</option>
                  {bedsList.map((bed, idx) => (
                    <option key={idx} value={bed._id} disabled={bed.status === 'Occupied'}>
                      Bed {bed.bedNumber} {bed.status === 'Occupied' ? '(Occupied)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-orange-50 font-bold">
                <button
                  onClick={() => setShowAllocateModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-bold"
                  disabled={allocating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAllocateBed}
                  className="btn flex-1 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-1.5 text-white font-extrabold"
                  disabled={allocating}
                >
                  {allocating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Allocating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirm Bed
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IpdSameDayDashboard;
