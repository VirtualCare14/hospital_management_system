import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Clock, Edit, RefreshCcw, Save, Trash2, UserCog, X, Eye, EyeOff, Zap, Calendar, Sliders } from 'lucide-react';
import client from '../../api/client';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import { modules, roles } from '../../utils/options';
import { generateTimeSlots } from '../../utils/timeSlots';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CreateUser = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [limitData, setLimitData] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slotGap, setSlotGap] = useState(10);
  const [fixedStart, setFixedStart] = useState('09:00');
  const [fixedEnd, setFixedEnd] = useState('18:00');
  const [availableSlots, setAvailableSlots] = useState(
    DAYS.map((day) => ({ day, startTime: '09:00', endTime: '18:00', isAvailable: day !== 'Sunday', slotGap: 10 }))
  );
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { role: 'reception', moduleAccess: ['1'] }
  });
  const role = watch('role');
  const selectedModulesRaw = watch('moduleAccess');
  const selectedModules = Array.isArray(selectedModulesRaw)
    ? selectedModulesRaw
    : selectedModulesRaw
      ? [selectedModulesRaw]
      : [];
  const isLimitReached = limitData && limitData.userCount >= limitData.maxUsers;

  const load = async () => {
    setLoading(true);
    try {
      const [userRes, deptRes, limitRes] = await Promise.all([
        client.get('/admin/users'),
        client.get('/admin/departments'),
        client.get('/admin/users/limit').catch(() => null)
      ]);
      setUsers(userRes.data);
      setDepartments(deptRes.data);
      if (limitRes) {
        setLimitData(limitRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const applyPreset24Hours = () => {
    setAvailableSlots(
      DAYS.map((day) => ({
        day,
        startTime: '00:00',
        endTime: '23:59',
        isAvailable: true,
        slotGap
      }))
    );
    toast.success(`24 Hours schedule (00:00 AM - 11:50 PM, ${slotGap} min gap) applied for all days`);
  };

  const applyPresetFixedTime = () => {
    setAvailableSlots(
      DAYS.map((day) => ({
        day,
        startTime: fixedStart,
        endTime: fixedEnd,
        isAvailable: true,
        slotGap
      }))
    );
    toast.success(`Fixed schedule (${fixedStart} to ${fixedEnd}, ${slotGap} min gap) applied for all days`);
  };

  const onSubmit = async (data) => {
    let moduleAccessRaw = data.moduleAccess;
    if (!moduleAccessRaw || moduleAccessRaw.length === 0) {
      if (data.role === 'doctor') {
        moduleAccessRaw = [2, 3];
      } else if (data.role === 'nursing') {
        moduleAccessRaw = [6];
      } else {
        moduleAccessRaw = [1];
      }
    }
    const moduleAccess = Array.isArray(moduleAccessRaw)
      ? moduleAccessRaw.map(Number)
      : [Number(moduleAccessRaw)];

    const updatedSlots = availableSlots.map(s => ({ ...s, slotGap }));

    if (editingUser) {
      const payload = { ...data, moduleAccess };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }
      if (!payload.department && editingUser.department) {
        payload.department = editingUser.department;
      }

      await client.put(`/admin/users/${editingUser._id}`, payload);
      toast.success('User updated successfully');

      // If doctor or same day care, save availability
      if ((data.role === 'doctor' || data.role === 'nursing') && updatedSlots.length > 0) {
        await client.put(`/admin/doctors/${editingUser._id}/availability`, { availableSlots: updatedSlots, slotGap });
      }
    } else {
      const res = await client.post('/admin/create-user', { ...data, moduleAccess });
      toast.success('User created successfully');

      // If doctor or same day care, save availability
      if ((data.role === 'doctor' || data.role === 'nursing') && res.data.user && updatedSlots.length > 0) {
        await client.put(`/admin/doctors/${res.data.user.id}/availability`, { availableSlots: updatedSlots, slotGap }).catch(() => {});
      }
    }

    setEditingUser(null);
    setShowAvailability(false);
    setSelectedDoctor(null);
    reset({ role: 'reception', moduleAccess: ['1'] });
    setSlotGap(10);
    setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '18:00', isAvailable: day !== 'Sunday', slotGap: 10 })));
    load();
  };

  const updateUser = async (user, payload) => {
    await client.put(`/admin/users/${user._id}`, payload);
    toast.success('User updated');
    load();
  };

  const editUser = async (user) => {
    setEditingUser(user);
    setShowAvailability(false);
    setSelectedDoctor(null);
    reset({
      username: user.username,
      password: '',
      role: user.role,
      doctorName: user.doctorName || '',
      department: user.department || '',
      mobile: user.mobile || '',
      opdFees: user.opdFees || '',
      moduleAccess: Array.isArray(user.moduleAccess) ? user.moduleAccess.map(String) : []
    });

    const gap = user.slotGap || 10;
    setSlotGap(gap);

    if (user.role === 'doctor' || user.role === 'nursing') {
      try {
        const { data } = await client.get(`/admin/doctors/${user._id}/availability`);
        if (data.availableSlots && data.availableSlots.length > 0) {
          setAvailableSlots(data.availableSlots);
        } else {
          setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '18:00', isAvailable: day !== 'Sunday', slotGap: gap })));
        }
        if (data.slotGap) setSlotGap(data.slotGap);
      } catch {
        setAvailableSlots(user.availableSlots && user.availableSlots.length > 0 ? user.availableSlots : DAYS.map((day) => ({ day, startTime: '09:00', endTime: '18:00', isAvailable: day !== 'Sunday', slotGap: gap })));
      }
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowAvailability(false);
    setSelectedDoctor(null);
    reset({ role: 'reception', moduleAccess: ['1'] });
    setSlotGap(10);
    setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '18:00', isAvailable: day !== 'Sunday', slotGap: 10 })));
  };

  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[420px_1fr] animate-fadeIn">
        <div className="space-y-4">
          <div className="card p-5">
            <SkeletonTable rows={5} columns={1} className="w-full" />
          </div>
          <div className="card p-5">
            <SkeletonTable rows={4} columns={1} className="w-full" />
          </div>
        </div>
        <div className="card p-5">
          <SkeletonTable rows={6} columns={4} className="w-full" />
        </div>
      </div>
    );
  }

  const confirmDeleteUser = (user) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const name = userToDelete.doctorName || userToDelete.username;
      await client.delete(`/admin/users/${userToDelete._id}`);
      toast.success(`User ${name} deleted successfully`);
      setUserToDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
      setUserToDelete(null);
    }
  };

  const openAvailability = async (user) => {
    setSelectedDoctor(user);
    setShowAvailability(true);
    try {
      const { data } = await client.get(`/admin/doctors/${user._id}/availability`);
      if (data.availableSlots && data.availableSlots.length > 0) {
        setAvailableSlots(data.availableSlots);
      } else {
        setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '18:00', isAvailable: day !== 'Sunday', slotGap: 10 })));
      }
      if (data.slotGap) setSlotGap(data.slotGap);
    } catch {
      setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '18:00', isAvailable: day !== 'Sunday', slotGap: 10 })));
    }
  };

  const saveAvailability = async () => {
    if (!selectedDoctor) return;
    try {
      const updatedSlots = availableSlots.map(s => ({ ...s, slotGap }));
      await client.put(`/admin/doctors/${selectedDoctor._id}/availability`, { availableSlots: updatedSlots, slotGap });
      toast.success('Availability saved successfully');
      setShowAvailability(false);
      setSelectedDoctor(null);
    } catch (error) {
      toast.error('Error saving availability');
    }
  };

  const updateSlot = (index, field, value) => {
    setAvailableSlots((prev) => prev.map((slot, i) => i === index ? { ...slot, [field]: value } : slot));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <UserCog className="text-orange-500" />
          <h1 className="text-xl font-extrabold text-gray-900">{editingUser ? 'Edit User' : 'Create User'}</h1>
        </div>

        <input className="input" placeholder="Username" disabled={Boolean(editingUser)} {...register('username', { required: 'Username is required' })} />
        {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}

        <div className="relative">
          <input
            className="input pr-10"
            placeholder={editingUser ? 'Leave blank to keep existing password' : 'Password'}
            type={showPassword ? 'text' : 'password'}
            {...register('password', { required: editingUser ? false : 'Password is required' })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-650 transition"
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}

        <select className="input font-bold" {...register('role')}>
          {roles.map((item) => <option key={item} value={item}>{item === 'nursing' ? 'same day care' : item}</option>)}
        </select>

        {(role === 'doctor' || role === 'nursing') && (
          <input 
            className="input" 
            placeholder={role === 'nursing' ? "Same Day Care Doctor / Staff Name" : "Doctor name"} 
            {...register('doctorName')} 
          />
        )}

        {(role === 'doctor' || role === 'nursing') && (
          <div className="relative">
            <input className="input pl-8" placeholder="OPD Consultation Fee (₹)" type="number" min="0" step="1" {...register('opdFees')} />
            <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
          </div>
        )}

        <select className="input" {...register('department')}>
          <option value="">Select department</option>
          {departments.map((dept) => <option key={dept._id} value={dept.departmentName}>{dept.departmentName}</option>)}
        </select>

        <input className="input" placeholder="Mobile number" {...register('mobile')} />
        
        {/* Doctor & Same Day Care Availability Configurator */}
        {(role === 'doctor' || role === 'nursing' || editingUser?.role === 'doctor' || editingUser?.role === 'nursing') && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <h3 className="text-sm font-bold text-gray-800">Available Time Slots Allocation</h3>
              </div>
              <div className="flex items-center gap-1 bg-white border border-orange-200 rounded-lg px-2 py-1 text-xs">
                <Sliders className="h-3 w-3 text-orange-500" />
                <span className="font-semibold text-gray-600">Gap:</span>
                <select 
                  value={slotGap} 
                  onChange={(e) => setSlotGap(Number(e.target.value))}
                  className="font-bold text-orange-700 bg-transparent outline-none cursor-pointer"
                >
                  <option value={5}>5 mins</option>
                  <option value={10}>10 mins</option>
                  <option value={15}>15 mins</option>
                  <option value={20}>20 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={applyPreset24Hours}
                className="flex items-center justify-center gap-1.5 p-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl shadow-sm hover:opacity-95 transition cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" /> 24 Hours (Mon-Sun)
              </button>
              <button
                type="button"
                onClick={applyPresetFixedTime}
                className="flex items-center justify-center gap-1.5 p-2 bg-white border border-orange-300 text-orange-800 rounded-xl hover:bg-orange-100 transition cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-orange-600" /> Fixed Time (All Days)
              </button>
            </div>

            {/* Fixed Time Controls */}
            <div className="flex items-center gap-2 text-xs bg-white p-2.5 rounded-xl border border-orange-200">
              <span className="text-gray-500 font-medium">Quick Apply Time:</span>
              <input 
                type="time" 
                value={fixedStart} 
                onChange={(e) => setFixedStart(e.target.value)}
                className="input text-xs py-1 px-2 w-20"
              />
              <span className="text-gray-400">to</span>
              <input 
                type="time" 
                value={fixedEnd} 
                onChange={(e) => setFixedEnd(e.target.value)}
                className="input text-xs py-1 px-2 w-20"
              />
              <button
                type="button"
                onClick={applyPresetFixedTime}
                className="ml-auto text-[11px] font-bold text-orange-600 hover:underline"
              >
                Apply
              </button>
            </div>

            {/* Weekly Schedule Days List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {availableSlots.map((slot, index) => {
                const generated = slot.isAvailable ? generateTimeSlots(slot.startTime, slot.endTime, slotGap) : [];
                return (
                  <div key={slot.day} className="p-2.5 bg-white rounded-xl border border-orange-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slot.isAvailable}
                          onChange={(e) => updateSlot(index, 'isAvailable', e.target.checked)}
                          className="rounded text-orange-500 focus:ring-orange-400"
                        />
                        <span>{slot.day}</span>
                      </label>
                      {slot.isAvailable ? (
                        <div className="flex items-center gap-1 text-xs">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                            className="input text-xs py-0.5 px-1.5 w-20"
                          />
                          <span className="text-gray-400 font-medium">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                            className="input text-xs py-0.5 px-1.5 w-20"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic font-medium">Unavailable</span>
                      )}
                    </div>

                    {slot.isAvailable && (
                      <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-1">
                        <span>{generated.length} slots ({slotGap} min gap)</span>
                        <span className="font-semibold text-orange-700">{generated[0] || ''} … {generated[generated.length - 1] || ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-2">
          {modules.map((mod) => (
            <label key={mod.id} className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white p-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                value={mod.id}
                {...register('moduleAccess')}
                checked={selectedModules.includes(String(mod.id))}
              />
              {mod.label}
            </label>
          ))}
        </div>

        <button 
          className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
          type="submit"
          disabled={!editingUser && isLimitReached}
        >
          <Save className="h-4 w-4" /> {editingUser ? 'Update User' : 'Create User'}
        </button>
        {!editingUser && isLimitReached && (
          <p className="text-xs text-red-500 font-semibold text-center mt-1">
            User creation limit reached ({limitData?.maxUsers}). Please contact Super Admin.
          </p>
        )}
        {editingUser && <button className="btn-secondary w-full cursor-pointer" type="button" onClick={cancelEdit}><X className="h-4 w-4" /> Cancel Edit</button>}
      </form>

      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="border-b border-orange-100 p-5 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">User Management</h2>
            {limitData && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
                Users: {limitData.userCount} / {limitData.maxUsers}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-orange-100/70 text-xs uppercase text-orange-900">
                <tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Department</th><th className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-orange-50">
                    <td className="p-3 font-semibold">{user.doctorName || user.username}
                      {(user.role === 'doctor' || user.role === 'nursing') && user.opdFees > 0 && (
                        <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">₹{user.opdFees}</span>
                      )}
                    </td>
                    <td className="p-3 capitalize">{user.role === 'nursing' ? 'same day care' : user.role}</td>
                    <td className="p-3">{user.department || '-'}</td>
                    <td className="flex flex-wrap gap-2 p-3">
                      <button className="btn-secondary text-xs cursor-pointer" onClick={() => updateUser(user, { isActive: !user.isActive })}>{user.isActive ? 'Disable' : 'Enable'}</button>
                      <button className="btn-secondary text-xs cursor-pointer" onClick={() => editUser(user)}><Edit className="h-3 w-3" /> Edit</button>
                      {(user.role === 'doctor' || user.role === 'nursing') && (
                        <button className="btn-secondary text-xs cursor-pointer" onClick={() => openAvailability(user)}><Clock className="h-3 w-3" /> Slots</button>
                      )}
                      <button className="btn-secondary text-xs cursor-pointer" onClick={() => updateUser(user, { password: 'password123' })}><RefreshCcw className="h-3 w-3" /> Reset</button>
                      <button className="btn-ghost text-xs text-red-600 cursor-pointer" onClick={() => confirmDeleteUser(user)}><Trash2 className="h-3 w-3" /> Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Availability Modal */}
        {showAvailability && selectedDoctor && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <h3 className="font-bold text-gray-800">
                  Availability Slots: {selectedDoctor.doctorName || selectedDoctor.username} ({selectedDoctor.role === 'nursing' ? 'Same Day Care' : 'Doctor'})
                </h3>
              </div>
              <button className="btn-ghost text-xs cursor-pointer" onClick={() => { setShowAvailability(false); setSelectedDoctor(null); }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-orange-50 p-3 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 text-xs">
                <Sliders className="h-4 w-4 text-orange-600" />
                <span className="font-bold text-gray-700">Slot Gap Interval:</span>
                <select 
                  value={slotGap} 
                  onChange={(e) => setSlotGap(Number(e.target.value))}
                  className="font-bold text-orange-700 bg-white border border-orange-200 rounded-lg px-2 py-1 outline-none"
                >
                  <option value={5}>5 mins</option>
                  <option value={10}>10 mins</option>
                  <option value={15}>15 mins</option>
                  <option value={20}>20 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={applyPreset24Hours}
                  className="px-3 py-1.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition"
                >
                  ⚡ 24 Hours (Mon-Sun)
                </button>
                <button
                  type="button"
                  onClick={applyPresetFixedTime}
                  className="px-3 py-1.5 bg-white border border-orange-300 font-bold text-orange-700 rounded-lg hover:bg-orange-100 transition"
                >
                  🕒 Apply Fixed Time
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {availableSlots.map((slot, index) => {
                const generated = slot.isAvailable ? generateTimeSlots(slot.startTime, slot.endTime, slotGap) : [];
                return (
                  <div key={slot.day} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <label className="flex items-center gap-2 min-w-[110px] font-bold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.isAvailable}
                        onChange={(e) => updateSlot(index, 'isAvailable', e.target.checked)}
                      />
                      {slot.day}
                    </label>

                    {slot.isAvailable ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                          className="input text-xs py-1 px-2 w-24"
                        />
                        <span className="text-gray-400 font-medium">to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                          className="input text-xs py-1 px-2 w-24"
                        />
                        <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-lg font-bold">
                          {generated.length} slots
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not available on this day</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn mt-4 w-full cursor-pointer" onClick={saveAvailability}><Save className="h-4 w-4" /> Save Availability</button>
          </div>
        )}

        {/* Delete User Popup Modal */}
        {userToDelete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
                <Trash2 className="h-7 w-7" />
              </div>

              <div>
                <h3 className="text-base font-black text-gray-900">Delete User Account</h3>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  Are you sure you want to delete this <span className="font-bold text-gray-900 bg-orange-100/70 px-2 py-0.5 rounded-lg border border-orange-200">{userToDelete.doctorName || userToDelete.username}</span> user?
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all w-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-200/50 w-full cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" /> OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateUser;