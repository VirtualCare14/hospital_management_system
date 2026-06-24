import { useEffect, useState, useCallback, Fragment } from 'react';
import { 
  Plus, Edit2, Play, CircleSlash, Activity, CheckCircle, 
  XCircle, AlertTriangle, Loader2, RefreshCw, Calendar, 
  Clock, User, Bed, FileText, Check, ChevronDown, ChevronUp,
  History, Eye, ShieldAlert, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

// Local helper to auto-detect current hospital shift based on current hour
const detectShift = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 18) return 'Afternoon';
  if (hour >= 18 && hour < 22) return 'Evening';
  return 'Night';
};

const SUGGESTED_REMARKS = [
  'Vomiting after medication',
  'Patient sleeping',
  'Medicine unavailable',
  'BP low',
  'Fever reduced',
  'Patient refused medicine',
  'Adverse reaction observed',
  'Patient stable'
];

const IpdMedicationChartContent = ({ admissionId }) => {
  const { user } = useAuth();
  
  const [admission, setAdmission] = useState(null);
  const [orders, setOrders] = useState([]);
  const [administrations, setAdministrations] = useState([]);
  const [timeline, setTimeline] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [pollingLoading, setPollingLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  // Modals state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  
  const [showAdministerModal, setShowAdministerModal] = useState(false);
  const [selectedOrderForAdmin, setSelectedOrderForAdmin] = useState(null);
  const [administerForm, setAdministerForm] = useState({
    status: 'Given',
    shift: 'Morning',
    remarks: ''
  });

  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAdminRecord, setEditingAdminRecord] = useState(null);
  const [editAdminForm, setEditAdminForm] = useState({
    status: 'Given',
    shift: 'Morning',
    remarks: ''
  });

  const isDoctorOrAdmin = user?.role === 'doctor' || user?.role === 'admin';
  const isNurseOrAdmin = user?.role === 'ipd' || user?.role === 'admin';

  // Form states
  const [orderForm, setOrderForm] = useState({
    medicineName: '',
    dose: '',
    route: 'Oral',
    frequency: 'Once daily',
    morning: false,
    afternoon: false,
    evening: false,
    night: false,
    doctorRemark: ''
  });

  const loadData = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    else setPollingLoading(true);
    
    try {
      // 1. Fetch patient admission details (for demographics header)
      const { data: patientData } = await client.get(`/ipd/patients/${admissionId}`);
      setAdmission(patientData);

      // 2. Fetch medication orders
      const { data: orderData } = await client.get(`/ipd/medication-orders/${admissionId}`);
      setOrders(orderData || []);

      // 3. Fetch all administrations
      const { data: adminData } = await client.get(`/ipd/medication-administrations/${admissionId}`);
      setAdministrations(adminData || []);

      // 4. Fetch timeline events
      const { data: timelineData } = await client.get(`/ipd/services/timeline/${admissionId}`);
      setTimeline(timelineData || []);
    } catch (err) {
      console.error('Error fetching drug chart data:', err);
    } finally {
      if (!isPolling) setLoading(false);
      else setPollingLoading(false);
    }
  }, [admissionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-Time Polling: Refresh medication data every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [loadData]);

  const handleOpenAddModal = () => {
    setEditingOrder(null);
    setOrderForm({
      medicineName: '',
      dose: '',
      route: 'Oral',
      frequency: 'Once daily',
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
      doctorRemark: ''
    });
    setShowOrderModal(true);
  };

  const handleOpenEditModal = (order) => {
    setEditingOrder(order);
    setOrderForm({
      medicineName: order.medicineName,
      dose: order.dose,
      route: order.route,
      frequency: order.frequency,
      morning: order.morning,
      afternoon: order.afternoon,
      evening: order.evening,
      night: order.night,
      doctorRemark: order.doctorRemark
    });
    setShowOrderModal(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.medicineName || !orderForm.dose || !orderForm.route || !orderForm.frequency) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingOrder) {
        await client.put(`/ipd/medication-orders/${editingOrder._id}`, orderForm);
        toast.success('Medication order updated successfully');
      } else {
        await client.post('/ipd/medication-orders', {
          ...orderForm,
          admissionId
        });
        toast.success('Medication order added successfully');
      }
      setShowOrderModal(false);
      loadData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save medication order');
    }
  };

  const handleStopOrder = async (orderId, medName) => {
    if (!window.confirm(`Are you sure you want to STOP medication order for "${medName}"?`)) return;

    try {
      await client.post(`/ipd/medication-orders/${orderId}/stop`);
      toast.success(`Stopped medication order: ${medName}`);
      loadData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to stop medication order');
    }
  };

  const handleOpenAdministerModal = (order) => {
    setSelectedOrderForAdmin(order);
    setAdministerForm({
      status: 'Given',
      shift: detectShift(),
      remarks: ''
    });
    setShowAdministerModal(true);
  };

  const handleSaveAdministration = async (e) => {
    e.preventDefault();
    try {
      await client.post(`/ipd/medication-orders/${selectedOrderForAdmin._id}/administer`, administerForm);
      toast.success('Administration logged successfully');
      setShowAdministerModal(false);
      loadData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log drug administration');
    }
  };

  const handleOpenEditAdminModal = (record) => {
    setEditingAdminRecord(record);
    setEditAdminForm({
      status: record.status,
      shift: record.shift,
      remarks: record.remarks
    });
    setShowEditAdminModal(true);
  };

  const handleUpdateAdministration = async (e) => {
    e.preventDefault();
    try {
      await client.put(`/ipd/medication-administrations/${editingAdminRecord._id}`, editAdminForm);
      toast.success('Administration record updated');
      setShowEditAdminModal(false);
      loadData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update administration record');
    }
  };

  const toggleRowExpansion = (orderId) => {
    setExpandedRows(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="font-bold">Loading medication data...</span>
        </div>
      </div>
    );
  }

  if (!admission) return null;
  const patient = admission.patientId || {};
  const age = patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';

  // Filter timeline activities to show medico-legal chart history logs
  const medicationActivities = ['Medication Ordered', 'Medication Order Updated', 'Medication Stopped', 'Medication Administered'];
  const filteredTimeline = timeline.filter(t => medicationActivities.includes(t.activity));

  return (
    <div className="space-y-6">
      {/* Real-time Indicator banner */}
      <div className="flex items-center justify-between text-xs font-semibold px-4 py-1.5 rounded-xl bg-orange-100/50 text-orange-800">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
          <span>Real-time monitoring sync active (polls every 5s)</span>
        </div>
        {pollingLoading && <span className="text-[10px] text-orange-500 animate-pulse">Syncing...</span>}
      </div>

      {/* Demographics Header Card (Shows details if rendered standalone/embedded) */}
      <div className="card p-5 bg-gradient-to-br from-orange-50/50 to-white border-orange-150">
        <div className="flex items-start gap-4">
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-3 gap-x-6 text-sm">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Patient Name</span>
              <span className="font-extrabold text-gray-900">{patient.patientName || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">UHID</span>
              <span className="font-mono font-bold text-orange-700">{formatUhid(patient.uhid) || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Gender / Age</span>
              <span className="font-semibold text-gray-800">{patient.gender || 'N/A'} / {age} yrs</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Ward / Room</span>
              <span className="font-bold text-gray-800">{admission.roomId?.roomType || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Bed / Admission Date</span>
              <span className="font-semibold text-gray-800 flex items-center gap-1">
                <Bed className="h-3.5 w-3.5 text-orange-500" />
                {admission.bedId?.bedNumber || 'N/A'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Allergy Details</span>
              <span className={`inline-block px-3 py-0.5 mt-0.5 rounded-lg text-xs font-bold border ${
                admission.allergyDetails?.toLowerCase()?.includes('no') || !admission.allergyDetails
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
              }`}>
                {admission.allergyDetails || 'No known allergies'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Admission Timestamp</span>
              <span className="font-mono text-xs font-bold text-gray-700 mt-1 block">
                {new Date(admission.admissionDate).toLocaleDateString('en-IN')} {new Date(admission.admissionDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Doctor Medication Orders Table */}
      <div className="card overflow-hidden shadow-md">
        <div className="p-4 border-b border-orange-100 bg-orange-50/20 flex items-center justify-between">
          <h3 className="font-extrabold text-orange-950 flex items-center gap-1.5">
            <Award className="h-5 w-5 text-orange-500" />
            Doctor Medication Orders Section
          </h3>
          {isDoctorOrAdmin && (
            <button 
              onClick={handleOpenAddModal} 
              className="btn py-1.5 px-3 text-xs cursor-pointer flex items-center gap-1.5 shadow-sm font-bold"
            >
              <Plus className="h-3.5 w-3.5" /> Place Order
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-orange-50/30 text-xs font-bold uppercase text-orange-900 border-b border-orange-100">
              <tr>
                <th className="p-3 w-12 text-center">S.No</th>
                <th className="p-3">Medicine Name</th>
                <th className="p-3">Dose</th>
                <th className="p-3">Route</th>
                <th className="p-3">Frequency</th>
                <th className="p-3 text-center">🌅 Morn</th>
                <th className="p-3 text-center">☀️ Aft</th>
                <th className="p-3 text-center">🌇 Eve</th>
                <th className="p-3 text-center">🌙 Night</th>
                <th className="p-3">Doctor Remark</th>
                <th className="p-3">Ordered By</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 bg-white">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-12 text-center text-gray-400 font-bold">
                    No medication orders added yet.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const isStopped = order.status === 'Stopped';
                  const isExpanded = !!expandedRows[order._id];

                  return (
                    <Fragment key={order._id}>
                      <tr 
                        className={`transition-colors hover:bg-orange-50/10 ${
                          isStopped ? 'bg-gray-50/50 text-gray-400' : 'bg-white text-gray-800'
                        }`}
                      >
                        <td className="p-3 text-center font-bold text-xs">{index + 1}</td>
                        <td className="p-3 font-extrabold text-orange-950">{order.medicineName}</td>
                        <td className="p-3 font-bold text-gray-700">{order.dose}</td>
                        <td className="p-3 text-xs">
                          <span className="px-2 py-0.5 rounded-lg bg-orange-100/50 text-orange-800 font-bold">
                            {order.route}
                          </span>
                        </td>
                        <td className="p-3 text-xs font-bold text-orange-950">{order.frequency}</td>
                        <td className="p-3 text-center">
                          {order.morning ? <Check className="h-4.5 w-4.5 text-green-600 mx-auto stroke-[3]" /> : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-3 text-center">
                          {order.afternoon ? <Check className="h-4.5 w-4.5 text-green-600 mx-auto stroke-[3]" /> : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-3 text-center">
                          {order.evening ? <Check className="h-4.5 w-4.5 text-green-600 mx-auto stroke-[3]" /> : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-3 text-center">
                          {order.night ? <Check className="h-4.5 w-4.5 text-green-600 mx-auto stroke-[3]" /> : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-3 text-xs italic font-semibold">{order.doctorRemark || '-'}</td>
                        <td className="p-3 text-xs">
                          <div className="font-bold text-gray-700">{order.doctorName}</div>
                          <div className="text-[10px] font-mono text-gray-400">{order.date} {order.time}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isStopped ? 'bg-red-150 text-red-700' : 'bg-green-150 text-green-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => toggleRowExpansion(order._id)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                              title="Administration Logs"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>

                            {/* Doctor Edits */}
                            {isDoctorOrAdmin && !isStopped && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(order)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                  title="Edit Order"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleStopOrder(order._id, order.medicineName)}
                                  className="p-1.5 text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                                  title="Stop Medication"
                                >
                                  <CircleSlash className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}

                            {/* Nurse Actions */}
                            {isNurseOrAdmin && !isStopped && (
                              <button
                                onClick={() => handleOpenAdministerModal(order)}
                                className="btn py-1 px-2 text-xs cursor-pointer shadow-sm"
                              >
                                Administer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanding individual order admin history logs */}
                      {isExpanded && (
                        <tr className="bg-orange-50/5">
                          <td colSpan={13} className="p-4 pl-12">
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-orange-100 shadow-sm max-w-4xl">
                              <h4 className="text-xs font-bold text-orange-950 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-orange-500" />
                                Nurse Administration Logs for {order.medicineName}
                              </h4>
                              
                              {order.administrations && order.administrations.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b border-gray-150 text-[10px] uppercase font-bold text-gray-500">
                                        <th className="py-2">Date / Time</th>
                                        <th className="py-2">Shift</th>
                                        <th className="py-2">Administered By</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Remarks / Notes</th>
                                        {isNurseOrAdmin && <th className="py-2 text-center">Action</th>}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {order.administrations.map((admin) => (
                                        <tr key={admin._id} className="text-gray-700 font-medium">
                                          <td className="py-2 font-mono text-gray-500">{admin.date} {admin.time}</td>
                                          <td className="py-2">{admin.shift}</td>
                                          <td className="py-2 font-bold">{admin.nurseName}</td>
                                          <td className="py-2">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                              admin.status === 'Given' || admin.status === 'Completed'
                                                ? 'bg-green-100 text-green-700' 
                                                : admin.status === 'Hold' || admin.status === 'Delayed'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                              {admin.status}
                                            </span>
                                          </td>
                                          <td className="py-2 text-gray-500 italic">{admin.remarks || '-'}</td>
                                          {isNurseOrAdmin && (
                                            <td className="py-2 text-center">
                                              <button
                                                onClick={() => handleOpenEditAdminModal(admin)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit administration log"
                                              >
                                                <Edit2 className="h-3 w-3" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No administration logs recorded yet for this medicine order.</p>
                              )}

                              {isStopped && (
                                <div className="border-t border-red-100 pt-2 flex items-center gap-1.5 text-red-700 text-xs font-semibold">
                                  <ShieldAlert className="h-4 w-4" />
                                  <span>Medication stopped by Dr. {order.stoppedByName} on {order.stoppedDate} at {order.stoppedTime}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Nurse Administration & Monitoring Table (Full Patient Logs) */}
      <div className="card overflow-hidden shadow-md border border-orange-100">
        <div className="p-4 border-b border-orange-100 bg-orange-50/20 flex items-center justify-between">
          <h3 className="font-extrabold text-orange-950 flex items-center gap-1.5">
            <Calendar className="h-5 w-5 text-orange-500" />
            Nurse Administration & Monitoring Log Table
          </h3>
          <span className="text-xs font-bold text-gray-500">
            Total Doses Logged: {administrations.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-orange-50/30 text-xs font-bold uppercase text-orange-900 border-b border-orange-100">
              <tr>
                <th className="p-3 w-12 text-center">S.No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Time</th>
                <th className="p-3">Shift</th>
                <th className="p-3">Medicine</th>
                <th className="p-3">Status</th>
                <th className="p-3">Nurse Remark</th>
                <th className="p-3 font-semibold">Nurse Name</th>
                {isNurseOrAdmin && <th className="p-3 pr-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 bg-white">
              {administrations.length === 0 ? (
                <tr>
                  <td colSpan={isNurseOrAdmin ? 9 : 8} className="p-8 text-center text-gray-400 font-bold italic">
                    No administrations recorded yet.
                  </td>
                </tr>
              ) : (
                administrations.map((admin, index) => (
                  <tr key={admin._id} className="hover:bg-orange-50/10 transition-colors">
                    <td className="p-3 text-center text-xs font-bold text-gray-400">{index + 1}</td>
                    <td className="p-3 font-mono text-xs">{admin.date}</td>
                    <td className="p-3 font-mono text-xs">{admin.time}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-lg bg-orange-100/50 text-orange-800 text-xs font-bold">
                        {admin.shift}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-orange-950">{admin.medicineName}</td>
                    <td className="p-3 text-xs">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-xs ${
                        admin.status === 'Given' || admin.status === 'Completed'
                          ? 'bg-green-100 text-green-700' 
                          : admin.status === 'Hold' || admin.status === 'Delayed'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs italic font-semibold text-gray-600">{admin.remarks || '-'}</td>
                    <td className="p-3 text-xs font-bold text-gray-800">{admin.nurseName}</td>
                    {isNurseOrAdmin && (
                      <td className="p-3 pr-4 text-center">
                        <button
                          onClick={() => handleOpenEditAdminModal(admin)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Edit Administration entry"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: IMMUTABLE AUDIT TIMELINE HISTORY SECTION */}
      <div className="card overflow-hidden shadow-md border border-orange-150">
        <div className="p-4 border-b border-orange-100 bg-orange-50/20 flex items-center justify-between">
          <h3 className="font-extrabold text-orange-950 flex items-center gap-1.5">
            <History className="h-5 w-5 text-orange-600" />
            Chart History Audit Trail
          </h3>
          <span className="text-[10px] font-bold tracking-wider uppercase bg-orange-200 text-orange-800 px-2 py-0.5 rounded">
            Medico-Legal Immutable Records
          </span>
        </div>

        <div className="p-5 max-h-[300px] overflow-y-auto space-y-4">
          {filteredTimeline.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-6">No medication log audits recorded yet.</p>
          ) : (
            <div className="relative border-l border-orange-150 pl-5 space-y-4 font-sans text-xs">
              {filteredTimeline.map((item) => (
                <div key={item._id} className="relative">
                  {/* Timeline circle dot */}
                  <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-orange-500 bg-white" />
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-gray-600">
                    <span className="font-extrabold text-gray-900">{item.description}</span>
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 sm:self-start">
                      <Clock className="h-3 w-3" />
                      {item.date} {item.time} | User: {item.performedByName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Place / Edit Medication Order (Doctor-Only validation in backend) */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-orange-100 overflow-hidden transform scale-100 transition-all">
            <div className="p-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex justify-between items-center">
              <h3 className="font-extrabold tracking-tight">
                {editingOrder ? 'Edit Medication Order' : 'Add Medication Order'}
              </h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors animate-fade-in"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveOrder} className="p-5 space-y-4">
              <div>
                <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol"
                  className="input text-sm"
                  value={orderForm.medicineName}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, medicineName: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Dose *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 mg"
                    className="input text-sm"
                    value={orderForm.dose}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, dose: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Route *</label>
                  <select
                    className="input text-sm"
                    value={orderForm.route}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, route: e.target.value }))}
                  >
                    <option value="Oral">Oral</option>
                    <option value="IV">IV</option>
                    <option value="IM">IM</option>
                    <option value="SC">SC</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Topical">Topical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Frequency *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Once daily, Twice daily, Every 8 hours"
                  className="input text-sm"
                  value={orderForm.frequency}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, frequency: e.target.value }))}
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-600 uppercase">Times Schedule</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'morning', label: '🌅 Morn' },
                    { key: 'afternoon', label: '☀️ Aft' },
                    { key: 'evening', label: '🌇 Eve' },
                    { key: 'night', label: '🌙 Night' }
                  ].map(schedule => (
                    <label 
                      key={schedule.key}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        orderForm[schedule.key]
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-orange-100 hover:bg-orange-50/50 text-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={orderForm[schedule.key]}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, [schedule.key]: e.target.checked }))}
                      />
                      <span>{schedule.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Doctor Remarks</label>
                <textarea
                  placeholder="e.g. Give after food"
                  className="input text-sm min-h-[60px]"
                  value={orderForm.doctorRemark}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, doctorRemark: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-orange-50">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="btn-secondary py-2 px-4 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn py-2 px-5 text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingOrder ? 'Update Order' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nurse Log Administration (Given/Hold/Refused/etc.) */}
      {showAdministerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-orange-100 overflow-hidden transform scale-100">
            <div className="p-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex justify-between items-center">
              <h3 className="font-extrabold tracking-tight">
                Log Medication Administration
              </h3>
              <button 
                onClick={() => setShowAdministerModal(false)}
                className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveAdministration} className="p-5 space-y-4">
              <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                <p className="text-[10px] font-bold text-orange-500 uppercase">Selected Medicine</p>
                <p className="font-extrabold text-orange-950">{selectedOrderForAdmin?.medicineName}</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Dose: {selectedOrderForAdmin?.dose} | Route: {selectedOrderForAdmin?.route}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Shift *</label>
                  <select
                    className="input text-xs py-2 bg-white"
                    value={administerForm.shift}
                    onChange={(e) => setAdministerForm(prev => ({ ...prev, shift: e.target.value }))}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Status *</label>
                  <select
                    className="input text-xs py-2 bg-white"
                    value={administerForm.status}
                    onChange={(e) => setAdministerForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Given">Given</option>
                    <option value="Not Given">Not Given</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Skipped">Skipped</option>
                    <option value="Patient Refused">Patient Refused</option>
                    <option value="Hold">Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Nurse Remarks</label>
                <textarea
                  placeholder="Type remark or select suggestion below"
                  className="input text-sm min-h-[60px] mb-2"
                  value={administerForm.remarks}
                  onChange={(e) => setAdministerForm(prev => ({ ...prev, remarks: e.target.value }))}
                />
                
                {/* Suggestions Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SUGGESTED_REMARKS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setAdministerForm(prev => ({ ...prev, remarks: chip }))}
                      className="text-[10px] font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-orange-50">
                <button
                  type="button"
                  onClick={() => setShowAdministerModal(false)}
                  className="btn-secondary py-2 px-4 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn py-2 px-5 text-xs font-bold shadow-md cursor-pointer"
                >
                  Log Administration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nurse Edit Administration Record */}
      {showEditAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-orange-100 overflow-hidden transform scale-100">
            <div className="p-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex justify-between items-center">
              <h3 className="font-extrabold tracking-tight">
                Edit Drug Administration Record
              </h3>
              <button 
                onClick={() => setShowEditAdminModal(false)}
                className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateAdministration} className="p-5 space-y-4">
              <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                <p className="text-[10px] font-bold text-orange-500 uppercase">Selected Medicine</p>
                <p className="font-extrabold text-orange-950">{editingAdminRecord?.medicineName}</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Originally Logged at: {editingAdminRecord?.date} {editingAdminRecord?.time} by {editingAdminRecord?.nurseName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Shift *</label>
                  <select
                    className="input text-xs py-2 bg-white"
                    value={editAdminForm.shift}
                    onChange={(e) => setEditAdminForm(prev => ({ ...prev, shift: e.target.value }))}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Status *</label>
                  <select
                    className="input text-xs py-2 bg-white"
                    value={editAdminForm.status}
                    onChange={(e) => setEditAdminForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Given">Given</option>
                    <option value="Not Given">Not Given</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Skipped">Skipped</option>
                    <option value="Patient Refused">Patient Refused</option>
                    <option value="Hold">Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Nurse Remarks</label>
                <textarea
                  placeholder="Type remark or select suggestion below"
                  className="input text-sm min-h-[60px] mb-2"
                  value={editAdminForm.remarks}
                  onChange={(e) => setEditAdminForm(prev => ({ ...prev, remarks: e.target.value }))}
                />
                
                {/* Suggestions Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SUGGESTED_REMARKS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setEditAdminForm(prev => ({ ...prev, remarks: chip }))}
                      className="text-[10px] font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-orange-50">
                <button
                  type="button"
                  onClick={() => setShowEditAdminModal(false)}
                  className="btn-secondary py-2 px-4 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn py-2 px-5 text-xs font-bold shadow-md cursor-pointer"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IpdMedicationChartContent;
