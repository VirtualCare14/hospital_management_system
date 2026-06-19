import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Clock, Edit, RefreshCcw, Save, Trash2, UserCog, X } from 'lucide-react';
import client from '../../api/client';
import { modules, roles } from '../../utils/options';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CreateUser = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [limitData, setLimitData] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState(
    DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00', isAvailable: day !== 'Sunday' }))
  );
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
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
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data) => {
    let moduleAccessRaw = data.moduleAccess;
    if (!moduleAccessRaw || moduleAccessRaw.length === 0) {
      moduleAccessRaw = data.role === 'doctor' ? [2, 3] : [1];
    }
    const moduleAccess = Array.isArray(moduleAccessRaw)
      ? moduleAccessRaw.map(Number)
      : [Number(moduleAccessRaw)];

    if (editingUser) {
      const payload = { ...data, moduleAccess };
      if (!payload.password) delete payload.password;
      await client.put(`/admin/users/${editingUser._id}`, payload);
      toast.success('User updated');
      
      // If doctor, save availability
      if (data.role === 'doctor' && availableSlots.length > 0) {
        await client.put(`/admin/doctors/${editingUser._id}/availability`, { availableSlots });
      }
    } else {
      const res = await client.post('/admin/create-user', { ...data, moduleAccess });
      toast.success('User created');
      
      // If doctor, save availability
      if (data.role === 'doctor' && res.data.user && availableSlots.length > 0) {
        await client.put(`/admin/doctors/${res.data.user.id}/availability`, { availableSlots }).catch(() => {});
      }
    }
    setEditingUser(null);
    setShowAvailability(false);
    setSelectedDoctor(null);
    reset({ role: 'reception', moduleAccess: ['1'] });
    setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00', isAvailable: day !== 'Sunday' })));
    load();
  };

  const updateUser = async (user, payload) => {
    await client.put(`/admin/users/${user._id}`, payload);
    toast.success('User updated');
    load();
  };

  const editUser = (user) => {
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
      moduleAccess: user.moduleAccess?.map(String) || []
    });
    // Reset availability slots
    setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00', isAvailable: day !== 'Sunday' })));
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowAvailability(false);
    setSelectedDoctor(null);
    reset({ role: 'reception', moduleAccess: ['1'] });
    setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00', isAvailable: day !== 'Sunday' })));
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete user ${user.username}?`)) return;
    await client.delete(`/admin/users/${user._id}`);
    toast.success('User deleted');
    load();
  };

  const openAvailability = async (user) => {
    setSelectedDoctor(user);
    setShowAvailability(true);
    try {
      const { data } = await client.get(`/admin/doctors/${user._id}/availability`);
      if (data.availableSlots && data.availableSlots.length > 0) {
        setAvailableSlots(data.availableSlots);
      } else {
        setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00', isAvailable: day !== 'Sunday' })));
      }
    } catch {
      setAvailableSlots(DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00', isAvailable: day !== 'Sunday' })));
    }
  };

  const saveAvailability = async () => {
    if (!selectedDoctor) return;
    try {
      await client.put(`/admin/doctors/${selectedDoctor._id}/availability`, { availableSlots });
      toast.success('Availability saved');
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
        <input className="input" placeholder={editingUser ? 'New password optional' : 'Password'} type="password" {...register('password', { required: editingUser ? false : 'Password is required' })} />
        <select className="input" {...register('role')}>
          {roles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        {role === 'doctor' && <input className="input" placeholder="Doctor name" {...register('doctorName')} />}
        {role === 'doctor' && (
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
        
        {/* Doctor Availability Time Slots - shown when doctor role is selected */}
        {(role === 'doctor' || editingUser?.role === 'doctor') && (
          <div className="rounded-xl border border-orange-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-bold text-gray-700">Available Time Slots</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Configure weekly availability for this doctor.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableSlots.map((slot, index) => (
                <div key={slot.day} className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 min-w-[70px]">
                    <input
                      type="checkbox"
                      checked={slot.isAvailable}
                      onChange={(e) => updateSlot(index, 'isAvailable', e.target.checked)}
                    />
                    <span>{slot.day.slice(0, 3)}</span>
                  </label>
                  {slot.isAvailable && (
                    <>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                        className="input text-xs py-1 px-2 w-20"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                        className="input text-xs py-1 px-2 w-20"
                      />
                    </>
                  )}
                  {!slot.isAvailable && <span className="text-gray-400 italic">Unavailable</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-2">
          {modules.map((mod) => (
            <label key={mod.id} className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white p-3 text-sm">
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
          className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed" 
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
        {editingUser && <button className="btn-secondary w-full" type="button" onClick={cancelEdit}><X className="h-4 w-4" /> Cancel Edit</button>}
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
                          {user.role === 'doctor' && user.opdFees > 0 && (
                            <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">₹{user.opdFees}</span>
                          )}
                        </td>
                    <td className="p-3 capitalize">{user.role}</td>
                    <td className="p-3">{user.department || '-'}</td>
                    <td className="flex flex-wrap gap-2 p-3">
                      <button className="btn-secondary text-xs" onClick={() => updateUser(user, { isActive: !user.isActive })}>{user.isActive ? 'Disable' : 'Enable'}</button>
                      <button className="btn-secondary text-xs" onClick={() => editUser(user)}><Edit className="h-3 w-3" /> Edit</button>
                      {user.role === 'doctor' && (
                        <button className="btn-secondary text-xs" onClick={() => openAvailability(user)}><Clock className="h-3 w-3" /> Slots</button>
                      )}
                      <button className="btn-secondary text-xs" onClick={() => updateUser(user, { password: 'password123' })}><RefreshCcw className="h-3 w-3" /> Reset</button>
                      <button className="btn-ghost text-xs text-red-600" onClick={() => deleteUser(user)}><Trash2 className="h-3 w-3" /> Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Availability Modal */}
        {showAvailability && selectedDoctor && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <h3 className="font-bold text-gray-800">
                  Availability Slots: Dr. {selectedDoctor.doctorName || selectedDoctor.username}
                </h3>
              </div>
              <button className="btn-ghost text-xs" onClick={() => { setShowAvailability(false); setSelectedDoctor(null); }}>
                <X className="h-3 w-3" /> Close
              </button>
            </div>
            <div className="space-y-2">
              {availableSlots.map((slot, index) => (
                <div key={slot.day} className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-xl">
                  <label className="flex items-center gap-2 min-w-[90px] font-medium">
                    <input
                      type="checkbox"
                      checked={slot.isAvailable}
                      onChange={(e) => updateSlot(index, 'isAvailable', e.target.checked)}
                    />
                    {slot.day}
                  </label>
                  {slot.isAvailable ? (
                    <>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                        className="input text-xs py-1 px-2 w-24"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                        className="input text-xs py-1 px-2 w-24"
                      />
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Not available on this day</span>
                  )}
                </div>
              ))}
            </div>
            <button className="btn mt-4 w-full" onClick={saveAvailability}><Save className="h-4 w-4" /> Save Availability</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateUser;