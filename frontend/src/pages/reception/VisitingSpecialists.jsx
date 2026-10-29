import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Plus,
  Search,
  Calendar,
  Clock,
  IndianRupee,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  CalendarDays,
  UserCheck,
  Building2,
  FileText,
  X,
  Filter,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';

const SLOT_DURATION_OPTIONS = [10, 15, 20, 30, 45, 60];

const VisitingSpecialists = () => {
  const navigate = useNavigate();

  // State
  const [schedules, setSchedules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    doctorName: '',
    department: '',
    speciality: '',
    visitDates: [],
    startTime: '10:00',
    endTime: '14:00',
    slotDuration: 15,
    consultationFee: 500,
    status: 'Active',
    notes: ''
  });
  const [newDateInput, setNewDateInput] = useState('');

  // Fetch Departments from Master
  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const { data } = await client.get('/admin/departments');
      const activeOnly = data.filter((d) => d.isActive);
      setDepartments(activeOnly);
    } catch (err) {
      console.error('Failed to load departments', err);
      toast.error('Failed to load department master');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Fetch Schedules
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept !== 'all') params.department = selectedDept;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedDateFilter) params.date = selectedDateFilter;

      const { data } = await client.get('/reception/visiting-schedules', { params });
      setSchedules(data || []);
    } catch (err) {
      console.error('Failed to load visiting schedules', err);
      toast.error('Failed to load visiting specialist schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedDept, selectedStatus, selectedDateFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSchedule(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      doctorName: '',
      department: departments[0]?.departmentName || '',
      speciality: '',
      visitDates: [today],
      startTime: '10:00',
      endTime: '14:00',
      slotDuration: 15,
      consultationFee: 500,
      status: 'Active',
      notes: ''
    });
    setNewDateInput('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      doctorName: schedule.doctorName || '',
      department: schedule.department || '',
      speciality: schedule.speciality || '',
      visitDates: Array.isArray(schedule.visitDates) ? [...schedule.visitDates] : [],
      startTime: schedule.startTime || '10:00',
      endTime: schedule.endTime || '14:00',
      slotDuration: schedule.slotDuration || 15,
      consultationFee: schedule.consultationFee !== undefined ? schedule.consultationFee : 500,
      status: schedule.status || 'Active',
      notes: schedule.notes || ''
    });
    setNewDateInput('');
    setIsModalOpen(true);
  };

  // Add a date to visitDates in form
  const handleAddDate = () => {
    if (!newDateInput) return;
    if (formData.visitDates.includes(newDateInput)) {
      toast.error('Date already added to schedule');
      return;
    }
    const updated = [...formData.visitDates, newDateInput].sort();
    setFormData((prev) => ({ ...prev, visitDates: updated }));
    setNewDateInput('');
  };

  // Remove a date from visitDates in form
  const handleRemoveDate = (dateToRemove) => {
    if (formData.visitDates.length <= 1) {
      toast.error('At least one visit date must remain in the schedule');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      visitDates: prev.visitDates.filter((d) => d !== dateToRemove)
    }));
  };

  // Submit Schedule (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.doctorName.trim()) {
      toast.error('Doctor display name is required');
      return;
    }
    if (!formData.department.trim()) {
      toast.error('Please select a department from Department Master');
      return;
    }
    if (formData.visitDates.length === 0) {
      toast.error('At least one visit date is required');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Start time and end time are required');
      return;
    }

    const [sH, sM] = formData.startTime.split(':').map(Number);
    const [eH, eM] = formData.endTime.split(':').map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;
    if (startMins >= endMins) {
      toast.error('Start time must be earlier than end time');
      return;
    }
    if (formData.slotDuration > (endMins - startMins)) {
      toast.error('Slot duration cannot exceed total visiting hours');
      return;
    }
    if (formData.consultationFee < 0) {
      toast.error('Consultation fee cannot be negative');
      return;
    }

    try {
      setSubmitting(true);
      if (editingSchedule) {
        await client.put(`/reception/visiting-schedules/${editingSchedule._id}`, formData);
        toast.success('Visiting specialist schedule updated successfully');
      } else {
        await client.post('/reception/visiting-schedules', formData);
        toast.success('Visiting specialist schedule created successfully');
      }
      setIsModalOpen(false);
      fetchSchedules();
    } catch (err) {
      console.error('Schedule save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async (schedule) => {
    if (schedule.totalBooked > 0) {
      toast.error(
        `Cannot delete: ${schedule.totalBooked} appointment(s) already booked. Change status to 'Cancelled' or 'Completed' instead to preserve records.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the schedule for Dr. ${schedule.doctorName}?`
    );
    if (!confirmed) return;

    try {
      await client.delete(`/reception/visiting-schedules/${schedule._id}`);
      toast.success('Visiting schedule deleted successfully');
      fetchSchedules();
    } catch (err) {
      console.error('Delete schedule error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete schedule');
    }
  };

  // Quick Status Toggle
  const handleStatusChange = async (schedule, newStatus) => {
    try {
      await client.put(`/reception/visiting-schedules/${schedule._id}`, { status: newStatus });
      toast.success(`Schedule status changed to ${newStatus}`);
      fetchSchedules();
    } catch (err) {
      console.error('Status change error:', err);
      toast.error('Failed to change status');
    }
  };

  // Filtered schedules for search
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchSearch =
        searchTerm === '' ||
        s.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.speciality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [schedules, searchTerm]);

  // Quick Stats
  const stats = useMemo(() => {
    const total = schedules.length;
    const active = schedules.filter((s) => s.status === 'Active').length;
    const totalBookings = schedules.reduce((acc, curr) => acc + (curr.totalBooked || 0), 0);
    return { total, active, totalBookings };
  }, [schedules]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Visiting Specialists</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                  Super Speciality OPD
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage visiting doctors, configure date-specific appointment slots, and streamline super speciality OPD registration
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-orange-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Specialist Schedule</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/40 p-4 rounded-xl border border-orange-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-700 uppercase tracking-wider">Total Schedules</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-200/60 text-orange-700 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Active Specialists</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-200/60 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/40 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Total Booked Visits</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBookings}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-200/60 text-blue-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by doctor or speciality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none pr-8 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.departmentName}>
                  {d.departmentName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none pr-8 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Completed">Completed Only</option>
              <option value="Cancelled">Cancelled Only</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {selectedDateFilter && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter('')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Clear date filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading visiting specialist schedules...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700">No visiting specialist schedules found</p>
            <p className="text-sm text-gray-400 mt-1">
              Create a schedule to enable visiting doctors for Super Speciality OPD bookings.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-sm rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Schedule</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Specialist & Speciality</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Scheduled Visit Dates</th>
                  <th className="px-6 py-4">Timings & Slots</th>
                  <th className="px-6 py-4">Consultation Fee</th>
                  <th className="px-6 py-4">Bookings</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-normal">
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule._id} className="hover:bg-orange-50/30 transition-colors">
                    {/* Doctor Name & Speciality */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-base flex items-center gap-1.5">
                          Dr. {schedule.doctorName}
                        </span>
                        {schedule.speciality ? (
                          <span className="text-xs text-orange-700 font-medium mt-0.5">
                            {schedule.speciality}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic mt-0.5">Visiting Specialist</span>
                        )}
                        <span className="inline-block mt-1 text-[11px] font-mono text-gray-400">
                          (No user account)
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 font-medium text-xs rounded-lg">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {schedule.department}
                      </span>
                    </td>

                    {/* Visit Dates */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {schedule.visitDates && schedule.visitDates.length > 0 ? (
                          schedule.visitDates.map((dateStr) => (
                            <span
                              key={dateStr}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200/60 rounded-md text-xs font-mono font-medium"
                            >
                              <Calendar className="w-3 h-3 text-orange-500" />
                              {dateStr}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No dates set</span>
                        )}
                      </div>
                    </td>

                    {/* Timings */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-800">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        <span className="text-xs text-gray-500">
                          {schedule.slotDuration} mins / slot
                        </span>
                      </div>
                    </td>

                    {/* Fee */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900 inline-flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 text-gray-500" />
                        {schedule.consultationFee}
                      </span>
                    </td>

                    {/* Bookings */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          schedule.totalBooked > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {schedule.totalBooked} booked
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <select
                        value={schedule.status}
                        onChange={(e) => handleStatusChange(schedule, e.target.value)}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                          schedule.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : schedule.status === 'Completed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {schedule.status === 'Active' && (
                          <button
                            onClick={() =>
                              navigate(
                                `/reception/register?specialistId=${schedule._id}&dept=${encodeURIComponent(
                                  schedule.department
                                )}`
                              )
                            }
                            title="Register Patient for this Specialist"
                            className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(schedule)}
                          title="Edit Schedule"
                          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule)}
                          title={
                            schedule.totalBooked > 0
                              ? 'Cannot delete schedule with booked appointments'
                              : 'Delete Schedule'
                          }
                          disabled={schedule.totalBooked > 0}
                          className={`p-1.5 rounded-lg transition-colors ${
                            schedule.totalBooked > 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingSchedule ? 'Edit Visiting Specialist Schedule' : 'New Specialist Schedule'}
                  </h3>
                  <p className="text-xs text-gray-500">Super Speciality OPD Visiting Doctor</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              {/* Doctor Name & Speciality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Doctor Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arvind Mehta, MD"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    No doctor user account will be created.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="" disabled>
                      Select Department...
                    </option>
                    {departments.map((d) => (
                      <option key={d._id} value={d.departmentName}>
                        {d.departmentName}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Selected from Department Master
                  </span>
                </div>
              </div>

              {/* Speciality Free Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Speciality <span className="text-gray-400 font-normal">(Optional Free Text)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interventional Cardiology, Pediatric Neurology"
                  value={formData.speciality}
                  onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Descriptive clinical speciality. This does not alter the global Department Master.
                </span>
              </div>

              {/* Scheduled Visit Dates (Multi-Date Picker) */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Scheduled Visit Dates <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    {formData.visitDates.length} date(s) selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={newDateInput}
                    onChange={(e) => setNewDateInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDate}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Date</span>
                  </button>
                </div>

                {/* Date Pills */}
                <div className="flex flex-wrap gap-2 pt-1 min-h-[36px]">
                  {formData.visitDates.map((dateStr) => (
                    <span
                      key={dateStr}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-orange-200 text-orange-900 rounded-lg text-xs font-mono font-medium shadow-xs"
                    >
                      <Calendar className="w-3 h-3 text-orange-500" />
                      {dateStr}
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(dateStr)}
                        className="text-gray-400 hover:text-red-500 ml-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {formData.visitDates.length === 0 && (
                    <span className="text-xs text-rose-500 italic">
                      Please pick at least one date for this visiting doctor schedule.
                    </span>
                  )}
                </div>
              </div>

              {/* Timings, Duration, Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Slot Duration
                  </label>
                  <select
                    value={formData.slotDuration}
                    onChange={(e) => setFormData({ ...formData, slotDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {SLOT_DURATION_OPTIONS.map((mins) => (
                      <option key={mins} value={mins}>
                        {mins} minutes
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                  />
                </div>
              </div>

              {/* Status and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Schedule Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                  >
                    <option value="Active">Active (Accepting Bookings)</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Specialist Notes / Room Info <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 104, bring previous MRI/CT scans"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-orange-500/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitingSpecialists;
