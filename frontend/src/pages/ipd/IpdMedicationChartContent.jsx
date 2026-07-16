import { useEffect, useState, useCallback, Fragment } from 'react';
import { 
  Plus, Edit2, Play, CircleSlash, Activity, CheckCircle, 
  XCircle, AlertTriangle, Loader2, RefreshCw, Calendar, 
  Clock, User, Bed, FileText, Check, ChevronDown, ChevronUp,
  History, Eye, ShieldAlert, Award, Settings
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

const parseTimeStr = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  let hours = 0;
  let minutes = 0;
  if (match) {
    hours = parseInt(match[1]);
    minutes = parseInt(match[2]);
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
    }
  } else {
    const parts = timeStr.split(':');
    hours = parseInt(parts[0]) || 0;
    minutes = parseInt(parts[1]) || 0;
  }
  return { hours, minutes };
};

const getSchedulesForOrder = (order) => {
  const list = [];
  if (!order.startDate) return list;
  
  const startD = new Date(order.startDate);
  const endD = new Date(order.endDate || order.startDate);
  
  if (order.scheduleType === 'One-Time') {
    list.push({
      date: order.startDate,
      time: order.startTime || '09:00 AM'
    });
    return list;
  }
  
  if (order.scheduleType === 'Every X Hours') {
    const interval = order.hourlyInterval || 4;
    const startT = order.startTime || '08:00 AM';
    const { hours, minutes } = parseTimeStr(startT);
    
    const current = new Date(startD);
    current.setHours(hours, minutes, 0, 0);
    
    const endLimit = new Date(endD);
    endLimit.setHours(hours, minutes, 0, 0);
    
    while (current <= endLimit) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const hr = current.getHours();
      const min = String(current.getMinutes()).padStart(2, '0');
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const displayH = hr % 12 === 0 ? 12 : hr % 12;
      const displayHStr = String(displayH).padStart(2, '0');
      const timeStr = `${displayHStr}:${min} ${ampm}`;
      
      list.push({ date: dateStr, time: timeStr });
      current.setHours(current.getHours() + interval);
    }
    return list;
  }
  
  const temp = new Date(startD);
  temp.setHours(0, 0, 0, 0);
  const limit = new Date(endD);
  limit.setHours(0, 0, 0, 0);
  
  const dailyTimes = [];
  if (order.scheduleType === 'Custom Time') {
    const times = order.customTimes || [];
    dailyTimes.push(...times.sort((a, b) => {
      const ta = parseTimeStr(a);
      const tb = parseTimeStr(b);
      return (ta.hours * 60 + ta.minutes) - (tb.hours * 60 + tb.minutes);
    }));
  } else {
    if (order.morning) dailyTimes.push('08:00 AM');
    if (order.afternoon) dailyTimes.push('02:00 PM');
    if (order.evening) dailyTimes.push('06:00 PM');
    if (order.night) dailyTimes.push('10:00 PM');
  }
  
  while (temp <= limit) {
    const year = temp.getFullYear();
    const month = String(temp.getMonth() + 1).padStart(2, '0');
    const day = String(temp.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    dailyTimes.forEach(time => {
      list.push({ date: dateStr, time });
    });
    
    temp.setDate(temp.getDate() + 1);
  }
  
  return list;
};

const getScheduledTimesForOrder = (order) => {
  if (order.scheduleType === 'Every X Hours') {
    const times = [];
    const { hours: startHour, minutes: startMinute } = parseTimeStr(order.startTime || '08:00 AM');
    const interval = order.hourlyInterval || 4;
    for (let i = 0; i < 24; i += interval) {
      const h = (startHour + i) % 24;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayMin = String(startMinute).padStart(2, '0');
      const displayHStr = String(displayH).padStart(2, '0');
      times.push(`${displayHStr}:${displayMin} ${ampm}`);
    }
    return times.sort((a, b) => {
      const ta = parseTimeStr(a);
      const tb = parseTimeStr(b);
      return (ta.hours * 60 + ta.minutes) - (tb.hours * 60 + tb.minutes);
    });
  } else if (order.scheduleType === 'One-Time') {
    return [order.startTime || '09:00 AM'];
  } else {
    const times = [];
    if (order.morning) times.push('08:00 AM');
    if (order.afternoon) times.push('02:00 PM');
    if (order.evening) times.push('06:00 PM');
    if (order.night) times.push('10:00 PM');
    return times;
  }
};

const isOrderCompleted = (order, now = new Date()) => {
  if (order.status === 'Stopped' || order.status === 'Completed') return order.status === 'Completed';
  if (!order.endDate) return false;
  const endD = new Date(order.endDate);
  endD.setHours(23, 59, 59, 999);
  return now > endD;
};

const mapTimeToShift = (timeStr) => {
  const { hours } = parseTimeStr(timeStr);
  if (hours >= 6 && hours < 12) return 'Morning';
  if (hours >= 12 && hours < 18) return 'Afternoon';
  if (hours >= 18 && hours < 22) return 'Evening';
  return 'Night';
};

const mapShiftToTime = (shift) => {
  if (shift === 'Morning') return '08:00 AM';
  if (shift === 'Afternoon') return '02:00 PM';
  if (shift === 'Evening') return '06:00 PM';
  if (shift === 'Night') return '10:00 PM';
  return '';
};

const calculateDoseStatus = (slotDate, scheduledTimeStr, administrations = [], settings = {}, now = new Date()) => {
  const gracePeriod = settings.medicationGracePeriod || 30;
  const missedThreshold = settings.medicationMissedThreshold || 60;
  
  const admin = administrations.find(a => 
    a.date === slotDate && 
    (a.scheduledTime === scheduledTimeStr || (a.shift && mapShiftToTime(a.shift) === scheduledTimeStr))
  );
  
  if (admin) {
    if (admin.status !== 'Given' && admin.status !== 'On Time' && admin.status !== 'Delayed') {
      return { status: admin.status, admin };
    }
    
    const { hours: schH, minutes: schM } = parseTimeStr(scheduledTimeStr);
    const { hours: actH, minutes: actM } = parseTimeStr(admin.time);
    
    const schDate = new Date(`${slotDate}T00:00:00`);
    schDate.setHours(schH, schM, 0, 0);
    
    const actDate = new Date(`${admin.date}T00:00:00`);
    actDate.setHours(actH, actM, 0, 0);
    
    const delayMins = Math.round((actDate.getTime() - schDate.getTime()) / (60 * 1000));
    
    if (delayMins <= gracePeriod) {
      return { status: 'On Time', admin, delayMins };
    } else if (delayMins <= missedThreshold) {
      return { status: 'Delayed', admin, delayMins };
    } else {
      return { status: 'Missed Dose', admin, delayMins };
    }
  }
  
  const { hours: schH, minutes: schM } = parseTimeStr(scheduledTimeStr);
  const schDate = new Date(`${slotDate}T00:00:00`);
  schDate.setHours(schH, schM, 0, 0);
  
  const delayMs = now.getTime() - schDate.getTime();
  const delayMins = Math.round(delayMs / (60 * 1000));
  
  if (now < schDate) {
    const minsToDue = Math.round((schDate.getTime() - now.getTime()) / (60 * 1000));
    if (minsToDue <= 30) {
      return { status: 'Due Soon', delayMins };
    }
    return { status: 'Not Due Yet', delayMins };
  } else {
    if (delayMins <= missedThreshold) {
      return { status: 'Overdue', delayMins };
    }
    return { status: 'Missed Dose', delayMins };
  }
};

const getOrderTodayStatus = (order, administrations = [], settings = {}, now = new Date()) => {
  if (order.status === 'Stopped') return 'Discontinued';
  if (order.status === 'Completed') return 'Completed';
  
  const todayStr = now.toISOString().split('T')[0];
  const schedules = getSchedulesForOrder(order);
  const todaySchedules = schedules.filter(s => s.date === todayStr);
  
  if (todaySchedules.length === 0) return 'Not Due Yet';
  
  let maxUrgency = -1;
  let overallStatus = 'Not Due Yet';
  
  todaySchedules.forEach(slot => {
    const { status } = calculateDoseStatus(slot.date, slot.time, administrations, settings, now);
    let urgency = 0;
    if (status === 'Missed Dose') urgency = 5;
    else if (status === 'Overdue') urgency = 4;
    else if (status === 'Due Soon') urgency = 3;
    else if (status === 'On Time' || status === 'Delayed' || status === 'Given') urgency = 2;
    else if (status === 'Patient Refused' || status === 'Hold' || status === 'Skipped') urgency = 1;
    
    if (urgency > maxUrgency) {
      maxUrgency = urgency;
      overallStatus = status;
    }
  });
  
  return overallStatus;
};

const calculateNextDueTime = (order, administrations = [], settings = {}, now = new Date()) => {
  if (order.status === 'Stopped') return 'Discontinued';
  if (order.status === 'Completed') return 'Completed';
  
  const schedules = getSchedulesForOrder(order);
  const futureSchedules = schedules.filter(slot => {
    const { hours, minutes } = parseTimeStr(slot.time);
    const schDate = new Date(`${slot.date}T00:00:00`);
    schDate.setHours(hours, minutes, 0, 0);
    return schDate > now;
  });
  
  if (futureSchedules.length > 0) {
    const nextSlot = futureSchedules[0];
    const dateObj = new Date(nextSlot.date);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString('en-IN', { month: 'short' });
    return `${day} ${month} ${nextSlot.time}`;
  }
  
  return 'N/A';
};

const IpdMedicationChartContent = ({ admissionId }) => {
  const { user } = useAuth();
  
  const [admission, setAdmission] = useState(null);
  const [orders, setOrders] = useState([]);
  const [administrations, setAdministrations] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [hospitalSettings, setHospitalSettings] = useState({ medicationGracePeriod: 30, medicationMissedThreshold: 60 });
  
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
    remarks: '',
    scheduledTime: ''
  });

  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAdminRecord, setEditingAdminRecord] = useState(null);
  const [editAdminForm, setEditAdminForm] = useState({
    status: 'Given',
    shift: 'Morning',
    remarks: ''
  });

  const isDischarged = admission?.status === 'Discharged';
  const isDoctorOrAdmin = (user?.role === 'doctor' || user?.role === 'admin') && !isDischarged;
  const isNurseOrAdmin = (user?.role === 'ipd' || user?.role === 'admin' || user?.role === 'nursing') && !isDischarged;

  const [pharmacyMedicines, setPharmacyMedicines] = useState([]);
  useEffect(() => {
    const fetchPharmacyMedicines = async () => {
      try {
        const { data } = await client.get('/pharmacy/inventory?limit=5000');
        const items = data.items || [];
        const uniqueNames = Array.from(new Set(items.map(item => item.itemName))).sort();
        setPharmacyMedicines(uniqueNames);
      } catch (err) {
        console.warn('Failed to fetch pharmacy inventory:', err);
      }
    };
    fetchPharmacyMedicines();
  }, []);

  // Form states
  const [orderForm, setOrderForm] = useState({
    medicineName: '',
    dose: '',
    route: 'Oral',
    frequency: 'Once Daily (OD)',
    morning: false,
    afternoon: false,
    evening: false,
    night: false,
    doctorRemark: '',
    scheduleType: 'Fixed Shift',
    hourlyInterval: 4,
    startTime: '08:00 AM',
    customTimesStr: '',
    startDate: new Date().toISOString().split('T')[0],
    duration: '3 Days',
    endDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    })()
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

      // 5. Fetch settings
      try {
        const { data: settingsRes } = await client.get('/admin/hospital-settings');
        if (settingsRes && settingsRes.exists && settingsRes.data) {
          setHospitalSettings(settingsRes.data);
        }
      } catch (err) {
        console.warn('Could not load hospital settings:', err);
      }
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

  const calculateEndDate = (startDateStr, durationStr) => {
    if (!startDateStr) return '';
    const date = new Date(startDateStr);
    let days = 0;
    if (durationStr === '3 Days') days = 3;
    else if (durationStr === '5 Days') days = 5;
    else if (durationStr === '7 Days') days = 7;
    else if (durationStr === '10 Days') days = 10;
    else if (durationStr === '14 Days') days = 14;
    else if (durationStr === '30 Days') days = 30;
    else return '';
    
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const handleStartDateChange = (val) => {
    setOrderForm(prev => {
      const updated = { ...prev, startDate: val };
      if (prev.duration && prev.duration !== 'Custom') {
        updated.endDate = calculateEndDate(val, prev.duration);
      }
      return updated;
    });
  };

  const handleDurationChange = (val) => {
    setOrderForm(prev => {
      const updated = { ...prev, duration: val };
      if (val !== 'Custom') {
        updated.endDate = calculateEndDate(prev.startDate, val);
      }
      return updated;
    });
  };

  const handleFrequencyChange = (freq) => {
    setOrderForm(prev => {
      const updated = { ...prev, frequency: freq };
      
      if (freq === 'Once (STAT)') {
        updated.scheduleType = 'One-Time';
        updated.startTime = '09:00 AM';
        updated.morning = false;
        updated.afternoon = false;
        updated.evening = false;
        updated.night = false;
      } else if (freq.startsWith('Every ') && freq.endsWith(' Hours')) {
        updated.scheduleType = 'Every X Hours';
        const hoursMatch = freq.match(/Every (\d+) Hours/);
        updated.hourlyInterval = hoursMatch ? Number(hoursMatch[1]) : 4;
        updated.startTime = '08:00 AM';
        updated.morning = false;
        updated.afternoon = false;
        updated.evening = false;
        updated.night = false;
      } else if (freq === 'SOS (As Needed)') {
        updated.scheduleType = 'Custom Time';
        updated.customTimesStr = '08:00 AM';
        updated.morning = false;
        updated.afternoon = false;
        updated.evening = false;
        updated.night = false;
      } else if (freq === 'Once Daily (OD)') {
        updated.scheduleType = 'Fixed Shift';
        updated.morning = true;
        updated.afternoon = false;
        updated.evening = false;
        updated.night = false;
      } else if (freq === 'Twice Daily (BD)') {
        updated.scheduleType = 'Fixed Shift';
        updated.morning = true;
        updated.afternoon = false;
        updated.evening = false;
        updated.night = true;
      } else if (freq === 'Three Times Daily (TDS)') {
        updated.scheduleType = 'Fixed Shift';
        updated.morning = true;
        updated.afternoon = true;
        updated.evening = false;
        updated.night = true;
      } else if (freq === 'Four Times Daily (QID)') {
        updated.scheduleType = 'Fixed Shift';
        updated.morning = true;
        updated.afternoon = true;
        updated.evening = true;
        updated.night = true;
      } else if (freq === 'Custom') {
        // Leave to manual editing
      }
      
      return updated;
    });
  };

  const handleOpenAddModal = () => {
    setEditingOrder(null);
    setOrderForm({
      medicineName: '',
      dose: '',
      route: 'Oral',
      frequency: 'Once Daily (OD)',
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
      doctorRemark: '',
      scheduleType: 'Fixed Shift',
      hourlyInterval: 4,
      startTime: '08:00 AM',
      customTimesStr: '',
      startDate: new Date().toISOString().split('T')[0],
      duration: '3 Days',
      endDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().split('T')[0];
      })()
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
      doctorRemark: order.doctorRemark,
      scheduleType: order.scheduleType || 'Fixed Shift',
      hourlyInterval: order.hourlyInterval || 4,
      startTime: order.startTime || '08:00 AM',
      customTimesStr: order.customTimes ? order.customTimes.join(', ') : '',
      startDate: order.startDate || new Date().toISOString().split('T')[0],
      duration: order.duration || 'Custom',
      endDate: order.endDate || ''
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
      const payload = {
        ...orderForm,
        customTimes: orderForm.customTimesStr 
          ? orderForm.customTimesStr.split(',').map(t => t.trim()).filter(Boolean)
          : []
      };
      if (editingOrder) {
        await client.put(`/ipd/medication-orders/${editingOrder._id}`, payload);
        toast.success('Medication order updated successfully');
      } else {
        await client.post('/ipd/medication-orders', {
          ...payload,
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
    const times = getScheduledTimesForOrder(order);
    
    let autoSlot = '';
    const todayStr = new Date().toISOString().split('T')[0];
    for (const t of times) {
      const hasAdmin = administrations.some(a => a.orderId === order._id && a.date === todayStr && (a.scheduledTime === t || (a.shift && mapShiftToTime(a.shift) === t)));
      if (!hasAdmin) {
        autoSlot = t;
        break;
      }
    }
    if (!autoSlot && times.length > 0) {
      autoSlot = times[0];
    }

    setAdministerForm({
      status: 'Given',
      shift: autoSlot ? mapTimeToShift(autoSlot) : detectShift(),
      remarks: '',
      scheduledTime: autoSlot
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

  const activeOrders = orders.filter(order => order.status === 'Active' && !isOrderCompleted(order));
  const historyOrders = orders.filter(order => order.status === 'Stopped' || order.status === 'Completed' || isOrderCompleted(order));

  const getTrackedDoses = () => {
    const list = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    orders.forEach(order => {
      if (order.status === 'Stopped' || order.status === 'Completed' || isOrderCompleted(order, now)) return;
      const schedules = getSchedulesForOrder(order);
      const todaySchedules = schedules.filter(s => s.date === todayStr);
      todaySchedules.forEach(slot => {
        const { status, delayMins } = calculateDoseStatus(slot.date, slot.time, order.administrations || [], hospitalSettings, now);
        list.push({
          orderId: order._id,
          medicineName: order.medicineName,
          scheduledTime: slot.time,
          status,
          delayMins
        });
      });
    });
    const urgency = { 'Missed Dose': 4, 'Overdue': 3, 'Due Soon': 2, 'Not Due Yet': 1, 'On Time': 0, 'Delayed': 0 };
    return list.sort((a, b) => (urgency[b.status] || 0) - (urgency[a.status] || 0));
  };

  const getTodayCounters = () => {
    let completed = 0;
    let dueSoon = 0;
    let overdue = 0;
    let missed = 0;
    let total = 0;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    orders.forEach(order => {
      if (order.status === 'Stopped' || order.status === 'Completed' || isOrderCompleted(order, now)) return;
      const schedules = getSchedulesForOrder(order);
      const todaySchedules = schedules.filter(s => s.date === todayStr);
      
      todaySchedules.forEach(slot => {
        total++;
        const { status } = calculateDoseStatus(slot.date, slot.time, order.administrations || [], hospitalSettings, now);
        if (status === 'On Time' || status === 'Delayed' || status === 'Given') completed++;
        else if (status === 'Due Soon') dueSoon++;
        else if (status === 'Overdue') overdue++;
        else if (status === 'Missed Dose') missed++;
      });
    });
    
    return { total, completed, dueSoon, overdue, missed };
  };

  const getAdminSlotPreview = () => {
    if (!selectedOrderForAdmin || !administerForm.scheduledTime) return null;
    const t = administerForm.scheduledTime;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const { hours: schH, minutes: schM } = parseTimeStr(t);
    const now = new Date();
    const schDate = new Date(`${todayStr}T00:00:00`);
    schDate.setHours(schH, schM, 0, 0);
    
    const delayMins = Math.round((now.getTime() - schDate.getTime()) / (60 * 1000));
    const grace = hospitalSettings.medicationGracePeriod || 30;
    const threshold = hospitalSettings.medicationMissedThreshold || 60;
    
    let previewStatus = 'On Time';
    let delayStr = 'None';
    let warning = '';
    
    if (delayMins > 0) {
      const delayHours = Math.floor(delayMins / 60);
      const delayRemainingMins = delayMins % 60;
      delayStr = delayHours > 0 ? `${delayHours}h ${delayRemainingMins}m` : `${delayRemainingMins}m`;
      
      if (delayMins <= grace) {
        previewStatus = 'On Time';
      } else if (delayMins <= threshold) {
        previewStatus = 'Delayed';
        warning = `⚠️ Warning: Administering this medication ${delayStr} after scheduled time will be logged as DELAYED.`;
      } else {
        previewStatus = 'Missed Dose';
        warning = `🚨 Warning: Administering this medication ${delayStr} after scheduled time will be logged as MISSED DOSE.`;
      }
    }
    
    return {
      scheduledTime: t,
      currentTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      delayStr,
      previewStatus,
      warning
    };
  };

  const getTimelineColorClass = (item) => {
    const type = item.metadata?.type;
    const status = item.metadata?.status;
    
    if (type === 'order_added') return { dot: 'border-blue-500 bg-blue-500', text: 'text-blue-800 bg-blue-50' };
    if (type === 'order_changed') return { dot: 'border-purple-500 bg-purple-500', text: 'text-purple-800 bg-purple-50' };
    if (type === 'order_stopped') return { dot: 'border-gray-500 bg-gray-500', text: 'text-gray-800 bg-gray-50' };
    
    if (type === 'administration') {
      if (status === 'On Time' || status === 'Given') return { dot: 'border-green-500 bg-green-500', text: 'text-green-800 bg-green-50' };
      if (status === 'Delayed') return { dot: 'border-orange-500 bg-orange-500', text: 'text-orange-800 bg-orange-50' };
      if (status === 'Missed Dose') return { dot: 'border-red-500 bg-red-500', text: 'text-red-800 bg-red-50' };
    }
    
    return { dot: 'border-orange-500 bg-white', text: 'text-gray-700 bg-gray-50' };
  };

  const medicationActivities = ['Medication Ordered', 'Medication Order Updated', 'Medication Stopped', 'Medication Administered', 'Medication Missed'];
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

      {/* Missed Medication Red Alerts for Doctor */}
      {(() => {
        const missedDoses = getTrackedDoses().filter(d => d.status === 'Missed Dose');
        if (missedDoses.length === 0) return null;
        return (
          <div className="space-y-2">
            {missedDoses.map((d, idx) => (
              <div key={idx} className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-2xl flex items-start gap-3 shadow-md animate-pulse">
                <span className="text-lg">🚨</span>
                <div className="flex-1">
                  <span className="font-extrabold uppercase text-[9px] tracking-wider bg-red-650 text-white px-2 py-0.5 rounded mr-2">Missed Medication</span>
                  <span className="font-bold text-red-950">{d.medicineName}</span> scheduled for <span className="font-bold">{d.scheduledTime}</span> was missed today!
                  <div className="text-xs text-red-700 mt-1">
                    Current Delay: {d.delayMins > 0 ? `${Math.floor(d.delayMins / 60)}h ${d.delayMins % 60}m` : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Demographics Header Card (Shows details if rendered standalone/embedded) */}
      <div className="card p-5 bg-gradient-to-br from-orange-50/50 to-white border border-orange-150 rounded-2xl">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Main Charts & Audit trail (3/4 width) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Dashboard Summary Cards */}
          {(() => {
            const stats = getTodayCounters();
            return (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                <div className="p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-center">
                  <span className="block text-[9px] uppercase font-extrabold tracking-wider text-gray-450">Today's Total</span>
                  <span className="block text-xl font-black text-gray-800 mt-1">{stats.total}</span>
                </div>
                <div className="p-3 bg-green-50/55 border border-green-150 rounded-xl text-center">
                  <span className="block text-[9px] uppercase font-extrabold tracking-wider text-green-600">Completed</span>
                  <span className="block text-xl font-black text-green-700 mt-1">{stats.completed}</span>
                </div>
                <div className="p-3 bg-amber-50/60 border border-amber-150 rounded-xl text-center">
                  <span className="block text-[9px] uppercase font-extrabold tracking-wider text-amber-600">Due Soon</span>
                  <span className="block text-xl font-black text-amber-700 mt-1">{stats.dueSoon}</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-center animate-pulse">
                  <span className="block text-[9px] uppercase font-extrabold tracking-wider text-red-650">Overdue</span>
                  <span className="block text-xl font-black text-red-700 mt-1">{stats.overdue}</span>
                </div>
                <div className="p-3 bg-red-950 text-white rounded-xl text-center animate-pulse">
                  <span className="block text-[9px] uppercase font-extrabold tracking-wider text-red-200">Missed</span>
                  <span className="block text-xl font-black text-white mt-1">{stats.missed}</span>
                </div>
              </div>
            );
          })()}

          {/* SECTION 1: Doctor Medication Orders Table */}
          <div className="card overflow-hidden shadow-md rounded-2xl">
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
                    <th className="p-3">Prescribed Period</th>
                    <th className="p-3">Schedule Type</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Next Due</th>
                    <th className="p-3">Doctor Remark</th>
                    <th className="p-3">Ordered By</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 bg-white">
                  {activeOrders.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-12 text-center text-gray-400 font-bold">
                        No active medication orders added yet.
                      </td>
                    </tr>
                  ) : (
                    activeOrders.map((order, index) => {
                      const isStopped = order.status === 'Stopped';
                      const isExpanded = !!expandedRows[order._id];
                      const todayStatus = getOrderTodayStatus(order, order.administrations || [], hospitalSettings);

                      const rowBgClass = 
                        isStopped ? 'bg-gray-100/50 text-gray-400' :
                        todayStatus === 'Missed Dose' ? 'bg-red-50/50 hover:bg-red-50 text-gray-800' :
                        todayStatus === 'Overdue' ? 'bg-red-50/30 hover:bg-red-50/50 text-gray-850' :
                        todayStatus === 'Due Soon' ? 'bg-amber-50/30 hover:bg-amber-50/50 text-gray-850' :
                        todayStatus === 'On Time' || todayStatus === 'Delayed' || todayStatus === 'Given' ? 'bg-green-55/10 hover:bg-green-55/20 text-gray-850' :
                        'bg-white hover:bg-orange-50/10 text-gray-800';

                      return (
                        <Fragment key={order._id}>
                          <tr 
                            id={`row-${order._id}`}
                            className={`transition-colors border-b border-orange-50 ${rowBgClass}`}
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
                            <td className="p-3 text-xs">
                              <div className="font-semibold text-gray-700">{order.startDate} to {order.endDate || order.startDate}</div>
                              <div className="text-[10px] text-gray-400 font-bold">{order.duration || 'One-Time'}</div>
                            </td>
                            <td className="p-3 text-xs font-bold text-gray-600">{order.scheduleType || 'Fixed Shift'}</td>
                            <td className="p-3 text-xs font-semibold text-gray-700">
                              {(!order.scheduleType || order.scheduleType === 'Fixed Shift') && (
                                <div className="flex gap-1 flex-wrap">
                                  {order.morning && <span className="bg-orange-100/60 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Morn</span>}
                                  {order.afternoon && <span className="bg-orange-100/60 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Aft</span>}
                                  {order.evening && <span className="bg-orange-100/60 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Eve</span>}
                                  {order.night && <span className="bg-orange-100/60 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Night</span>}
                                </div>
                              )}
                              {order.scheduleType === 'Every X Hours' && (
                                <span>Every {order.hourlyInterval} hrs (Start: {order.startTime})</span>
                              )}
                              {order.scheduleType === 'Custom Time' && (
                                <span className="truncate max-w-[120px] block" title={order.customTimes?.join(', ')}>
                                  {order.customTimes?.join(', ')}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-xs font-mono font-black text-orange-800">
                              {calculateNextDueTime(order, order.administrations || [], hospitalSettings)}
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
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
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
                                            <th className="py-2">Scheduled Slot</th>
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
                                              <td className="py-2 font-mono">{admin.date} {admin.time}</td>
                                              <td className="py-2 font-semibold text-orange-950">{admin.scheduledTime || '-'}</td>
                                              <td className="py-2">{admin.shift}</td>
                                              <td className="py-2 font-semibold">{admin.nurseName}</td>
                                              <td className="py-2">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                  admin.status === 'Given' || admin.status === 'On Time'
                                                    ? 'bg-green-150 text-green-700'
                                                    : admin.status === 'Delayed'
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

          {/* Historical Medication Orders Section */}
          <div className="card overflow-hidden shadow-md rounded-2xl border border-gray-200 mt-6 bg-gray-50/30">
            <div className="p-4 border-b border-gray-200 bg-gray-100/50 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-800 flex items-center gap-1.5">
                <Clock className="h-5 w-5 text-gray-500" />
                Medication History (Discontinued & Completed)
              </h3>
              <span className="text-xs font-bold text-gray-500">
                Total Historical Orders: {historyOrders.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-100/60 text-xs font-bold uppercase text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-12 text-center">S.No</th>
                    <th className="p-3">Medicine Name</th>
                    <th className="p-3">Dose</th>
                    <th className="p-3">Route</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Prescribed Period</th>
                    <th className="p-3">Schedule Type</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Doctor Remark</th>
                    <th className="p-3">Ordered By</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 pr-4 text-center">Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white text-gray-500">
                  {historyOrders.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-gray-400 font-semibold italic">
                        No stopped or completed medication orders.
                      </td>
                    </tr>
                  ) : (
                    historyOrders.map((order, index) => {
                      const isStopped = order.status === 'Stopped';
                      const isExpanded = !!expandedRows[order._id];

                      return (
                        <Fragment key={order._id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-3 text-center font-bold text-xs">{index + 1}</td>
                            <td className="p-3 font-extrabold text-gray-700">{order.medicineName}</td>
                            <td className="p-3 font-bold text-gray-600">{order.dose}</td>
                            <td className="p-3 text-xs">
                              <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-bold">
                                {order.route}
                              </span>
                            </td>
                            <td className="p-3 text-xs font-bold text-gray-700">{order.frequency}</td>
                            <td className="p-3 text-xs">
                              <div className="font-semibold text-gray-600">{order.startDate} to {order.endDate || order.startDate}</div>
                              <div className="text-[10px] text-gray-400 font-bold">{order.duration || 'One-Time'}</div>
                            </td>
                            <td className="p-3 text-xs font-bold text-gray-500">{order.scheduleType || 'Fixed Shift'}</td>
                            <td className="p-3 text-xs font-semibold text-gray-600">
                              {(!order.scheduleType || order.scheduleType === 'Fixed Shift') && (
                                <div className="flex gap-1 flex-wrap">
                                  {order.morning && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">Morn</span>}
                                  {order.afternoon && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">Aft</span>}
                                  {order.evening && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">Eve</span>}
                                  {order.night && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">Night</span>}
                                </div>
                              )}
                              {order.scheduleType === 'Every X Hours' && (
                                <span>Every {order.hourlyInterval} hrs (Start: {order.startTime})</span>
                              )}
                              {order.scheduleType === 'Custom Time' && (
                                <span className="truncate max-w-[120px] block" title={order.customTimes?.join(', ')}>
                                  {order.customTimes?.join(', ')}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-xs italic font-semibold">{order.doctorRemark || '-'}</td>
                            <td className="p-3 text-xs">
                              <div className="font-bold text-gray-600">{order.doctorName}</div>
                              <div className="text-[10px] font-mono text-gray-400">{order.date} {order.time}</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isStopped ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {isStopped ? 'Stopped' : 'Completed'}
                              </span>
                            </td>
                            <td className="p-3 pr-4 text-center">
                              <button
                                onClick={() => toggleRowExpansion(order._id)}
                                className="p-1.5 text-gray-500 hover:bg-gray-150 rounded-lg cursor-pointer"
                                title="Administration Logs"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanding individual order admin history logs */}
                          {isExpanded && (
                            <tr className="bg-gray-50/10">
                              <td colSpan={12} className="p-4 pl-12">
                                <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm max-w-4xl">
                                  <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                                    Nurse Administration Logs for {order.medicineName}
                                  </h4>
                                  
                                  {order.administrations && order.administrations.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                          <tr className="border-b border-gray-150 text-[10px] uppercase font-bold text-gray-500">
                                            <th className="py-2">Date / Time</th>
                                            <th className="py-2">Scheduled Slot</th>
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
                                              <td className="py-2 font-mono">{admin.date} {admin.time}</td>
                                              <td className="py-2 font-semibold text-gray-600">{admin.scheduledTime || '-'}</td>
                                              <td className="py-2">{admin.shift}</td>
                                              <td className="py-2 font-semibold">{admin.nurseName}</td>
                                              <td className="py-2">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                  admin.status === 'Given' || admin.status === 'On Time'
                                                    ? 'bg-green-100 text-green-700'
                                                    : admin.status === 'Delayed'
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
          <div className="card overflow-hidden shadow-md border border-orange-100 rounded-2xl">
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
                    <th className="p-3">Scheduled Slot</th>
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
                      <td colSpan={isNurseOrAdmin ? 10 : 9} className="p-8 text-center text-gray-400 font-bold italic">
                        No administrations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    administrations.map((admin, index) => (
                      <tr key={admin._id} className="hover:bg-orange-50/10 transition-colors">
                        <td className="p-3 text-center text-xs font-bold text-gray-400">{index + 1}</td>
                        <td className="p-3 font-mono text-xs">{admin.date}</td>
                        <td className="p-3 font-mono text-xs">{admin.time}</td>
                        <td className="p-3 font-bold font-mono text-xs">{admin.scheduledTime || '-'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-lg bg-orange-100/50 text-orange-800 text-xs font-bold">
                            {admin.shift}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-orange-950">{admin.medicineName}</td>
                        <td className="p-3 text-xs">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-xs ${
                            admin.status === 'Given' || admin.status === 'Completed' || admin.status === 'On Time'
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
          <div className="card overflow-hidden shadow-md border border-orange-150 rounded-2xl">
            <div className="p-4 border-b border-orange-100 bg-orange-50/20 flex items-center justify-between">
              <h3 className="font-extrabold text-orange-950 flex items-center gap-1.5">
                <History className="h-5 w-5 text-orange-600" />
                Chart History Audit Trail
              </h3>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-orange-200 text-orange-800 px-2 py-0.5 rounded">
                Medico-Legal Immutable Records
              </span>
            </div>

            <div className="p-5 max-h-[400px] overflow-y-auto space-y-4">
              {filteredTimeline.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">No medication log audits recorded yet.</p>
              ) : (
                <div className="relative border-l border-orange-150 pl-5 space-y-4 font-sans text-xs">
                  {filteredTimeline.map((item) => {
                    const colors = getTimelineColorClass(item);
                    const hasMeta = !!item.metadata;
                    
                    return (
                      <div key={item._id} className="relative">
                        <span className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${colors.dot}`} />
                        <div className={`p-3 rounded-xl border border-gray-100 ${colors.text} space-y-1.5`}>
                          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                            <span className="font-black text-xs uppercase flex items-center gap-1.5">
                              {hasMeta ? item.metadata.status || item.activity : item.activity}
                            </span>
                            <span className="text-[9px] font-mono opacity-70 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.date} {item.time}
                            </span>
                          </div>
                          
                          {hasMeta ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1.5 border-t border-black/5 font-medium">
                              <div>
                                <span className="block text-[8px] uppercase font-extrabold opacity-60">Medicine</span>
                                <span className="font-extrabold">{item.metadata.medicineName}</span>
                              </div>
                              {item.metadata.scheduledTime && (
                                <div>
                                  <span className="block text-[8px] uppercase font-extrabold opacity-60">Scheduled Time</span>
                                  <span className="font-bold">{item.metadata.scheduledTime}</span>
                                </div>
                              )}
                              {item.metadata.actualTime && (
                                <div>
                                  <span className="block text-[8px] uppercase font-extrabold opacity-60">Actual Administered</span>
                                  <span className="font-bold">{item.metadata.actualTime}</span>
                                </div>
                              )}
                              {item.metadata.delayStr && (
                                <div>
                                  <span className="block text-[8px] uppercase font-extrabold opacity-60">Delay Duration</span>
                                  <span className="font-bold">{item.metadata.delayStr}</span>
                                </div>
                              )}
                              <div>
                                <span className="block text-[8px] uppercase font-extrabold opacity-60">Staff Signature</span>
                                <span className="font-bold">{item.performedByName}</span>
                              </div>
                              {item.metadata.remarks && (
                                <div className="col-span-full">
                                  <span className="block text-[8px] uppercase font-extrabold opacity-60">Remarks</span>
                                  <span className="font-bold italic">{item.metadata.remarks}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs font-semibold text-gray-700">{item.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Medication Due Tracker sticky sidebar panel (1/4 width) */}
        <div className="lg:col-span-1">
          <div className="card border border-orange-100 p-4 bg-white shadow-md lg:sticky lg:top-4 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-orange-950 flex items-center gap-1.5 border-b border-orange-100 pb-3 mb-2 text-xs uppercase tracking-wider">
              <Clock className="h-4 w-4 text-orange-600" />
              Medication Due Tracker
            </h3>
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {getTrackedDoses().length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">No doses scheduled for today.</p>
              ) : (
                getTrackedDoses().map((d, idx) => {
                  const bgClass = 
                    d.status === 'Missed Dose' ? 'bg-red-950/10 border-red-200 text-red-950' :
                    d.status === 'Overdue' ? 'bg-red-50 border-red-250 text-red-700' :
                    d.status === 'Due Soon' ? 'bg-amber-50 border-amber-250 text-amber-800' :
                    d.status === 'On Time' || d.status === 'Delayed' || d.status === 'Given' ? 'bg-green-50 border-green-200 text-green-700' :
                    'bg-gray-50 border-gray-200 text-gray-500';
                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        const el = document.getElementById(`row-${d.orderId}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer hover:shadow transition-all flex flex-col gap-1 ${bgClass}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold truncate max-w-[120px]">{d.medicineName}</span>
                        <span className="font-black font-mono text-[9px]">{d.scheduledTime}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] mt-0.5">
                        <span className="uppercase font-black text-[8px]">{d.status}</span>
                        {d.delayMins > 0 && <span>Delay: {d.delayMins}m</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
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
                  list="medication-order-medicines"
                  placeholder="e.g. Paracetamol"
                  className="input text-sm"
                  value={orderForm.medicineName}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, medicineName: e.target.value }))}
                />
                <datalist id="medication-order-medicines">
                  {pharmacyMedicines
                    .filter(med => {
                      const query = (orderForm.medicineName || '').trim().toLowerCase();
                      if (!query) return false;
                      return med.toLowerCase().includes(query);
                    })
                    .map((med, idx) => (
                      <option key={idx} value={med} />
                    ))}
                </datalist>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="input text-sm"
                    value={orderForm.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Start Time {
                    (orderForm.scheduleType === 'Every X Hours' || orderForm.scheduleType === 'Custom Time' || orderForm.scheduleType === 'One-Time') ? '*' : '(Optional)'
                  }</label>
                  <input
                    type="text"
                    required={orderForm.scheduleType === 'Every X Hours' || orderForm.scheduleType === 'Custom Time' || orderForm.scheduleType === 'One-Time'}
                    placeholder="e.g. 08:00 AM"
                    className="input text-sm"
                    value={orderForm.startTime}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
              </div>

              {orderForm.scheduleType !== 'One-Time' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Duration Prescribed</label>
                    <select
                      className="input text-xs py-2 bg-white"
                      value={orderForm.duration}
                      onChange={(e) => handleDurationChange(e.target.value)}
                    >
                      <option value="3 Days">3 Days</option>
                      <option value="5 Days">5 Days</option>
                      <option value="7 Days">7 Days</option>
                      <option value="10 Days">10 Days</option>
                      <option value="14 Days">14 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="Custom">Custom (Specify Date)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">End Date *</label>
                    <input
                      type="date"
                      required
                      disabled={orderForm.duration !== 'Custom'}
                      className="input text-sm disabled:bg-gray-50 disabled:text-gray-400"
                      value={orderForm.endDate}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Frequency *</label>
                <select
                  className="input text-sm bg-white"
                  required
                  value={orderForm.frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                >
                  <option value="Once (STAT)">Once (STAT)</option>
                  <option value="Once Daily (OD)">Once Daily (OD)</option>
                  <option value="Twice Daily (BD)">Twice Daily (BD)</option>
                  <option value="Three Times Daily (TDS)">Three Times Daily (TDS)</option>
                  <option value="Four Times Daily (QID)">Four Times Daily (QID)</option>
                  <option value="Every 2 Hours">Every 2 Hours</option>
                  <option value="Every 4 Hours">Every 4 Hours</option>
                  <option value="Every 6 Hours">Every 6 Hours</option>
                  <option value="Every 8 Hours">Every 8 Hours</option>
                  <option value="Every 12 Hours">Every 12 Hours</option>
                  <option value="Every 24 Hours">Every 24 Hours</option>
                  <option value="SOS (As Needed)">SOS (As Needed)</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Schedule Type *</label>
                <select
                  className="input text-xs py-2 bg-white"
                  value={orderForm.scheduleType}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, scheduleType: e.target.value }))}
                >
                  <option value="Fixed Shift">Option 1 – Fixed Shift</option>
                  <option value="Every X Hours">Option 2 – Every X Hours</option>
                  <option value="Custom Time">Option 3 – Custom Time</option>
                  <option value="One-Time">Option 4 – One-Time (STAT)</option>
                </select>
              </div>

              {orderForm.scheduleType === 'Fixed Shift' && (
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-gray-600 uppercase">Fixed Shift Options</label>
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
              )}

              {orderForm.scheduleType === 'Every X Hours' && (
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Interval *</label>
                  <select
                    className="input text-xs py-2 bg-white"
                    value={orderForm.hourlyInterval}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, hourlyInterval: Number(e.target.value) }))}
                  >
                    <option value="2">Every 2 Hours</option>
                    <option value="3">Every 3 Hours</option>
                    <option value="4">Every 4 Hours</option>
                    <option value="6">Every 6 Hours</option>
                    <option value="8">Every 8 Hours</option>
                    <option value="12">Every 12 Hours</option>
                    <option value="24">Every 24 Hours</option>
                  </select>
                </div>
              )}

              {orderForm.scheduleType === 'Custom Time' && (
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Custom Times *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 06:30 AM, 11:30 AM, 04:30 PM, 09:30 PM"
                    className="input text-sm"
                    value={orderForm.customTimesStr}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, customTimesStr: e.target.value }))}
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Enter one or multiple times separated by commas (format: HH:MM AM/PM).
                  </span>
                </div>
              )}

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
                <div className="col-span-2">
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Scheduled Time Slot *</label>
                  <select
                    className="input text-xs py-2 bg-white"
                    required
                    value={administerForm.scheduledTime}
                    onChange={(e) => {
                      const timeVal = e.target.value;
                      setAdministerForm(prev => ({
                        ...prev,
                        scheduledTime: timeVal,
                        shift: mapTimeToShift(timeVal)
                      }));
                    }}
                  >
                    <option value="">-- Select Time Slot --</option>
                    {getScheduledTimesForOrder(selectedOrderForAdmin).map((t, idx) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const administered = administrations.some(a => a.orderId === selectedOrderForAdmin._id && a.date === todayStr && (a.scheduledTime === t || (a.shift && mapShiftToTime(a.shift) === t)));
                      return (
                        <option key={idx} value={t} disabled={administered}>
                          {t} {administered ? '(Administered)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Shift *</label>
                  <select
                    className="input text-xs py-2 bg-white animate-fade-in"
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
                    className="input text-xs py-2 bg-white animate-fade-in"
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

              {administerForm.scheduledTime && (
                (() => {
                  const preview = getAdminSlotPreview();
                  if (!preview) return null;
                  return (
                    <div className="bg-orange-50/30 p-3 rounded-xl border border-orange-100/50 space-y-1.5 text-xs font-semibold text-gray-700">
                      <div className="flex justify-between">
                        <span>Scheduled Slot:</span>
                        <span className="font-extrabold text-orange-950">{preview.scheduledTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Time:</span>
                        <span className="font-extrabold text-gray-900">{preview.currentTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Delay:</span>
                        <span className="font-extrabold text-gray-900">{preview.delayStr}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-orange-200">
                        <span>Status Preview:</span>
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase text-white ${
                          preview.previewStatus === 'On Time' ? 'bg-green-600' :
                          preview.previewStatus === 'Delayed' ? 'bg-orange-500' : 'bg-red-600'
                        }`}>
                          {preview.previewStatus}
                        </span>
                      </div>
                      {preview.warning && (
                        <div className="text-[10px] font-bold text-red-650 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-2">
                          {preview.warning}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

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
