import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Clock, Edit, RefreshCcw, Save, Trash2, UserCog, X, Eye, EyeOff } from 'lucide-react';
import client from '../../api/client';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import { modules, roles } from '../../utils/options';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CreateUser = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [limitData, setLimitData] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState(
    DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00', isAvailable: day !== 'Sunday' }))
  );
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
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

    if (editingUser) {
      const payload = { ...data, moduleAccess };
      if (!payload.password) delete payload.password;
      await client.put(`/admin/users/${editingUser._id}`, payload);
      toast.success('User updated');
      
      // If doctor or same day care, save availability
      if ((data.role === 'doctor' || data.role === 'nursing') && availableSlots.length > 0) {
        await client.put(`/admin/doctors/${editingUser._id}/availability`, { availableSlots });
      }
    } else {
      const res = await client.post('/admin/create-user', { ...data, moduleAccess });
      toast.success('User created');
      
      // If doctor or same day care, save availability
      if ((data.role === 'doctor' || data.role === 'nursing') && res.data.user && availableSlots.length > 0) {
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
        <div className="relative">
          <input
            className="input pr-10"
            placeholder={editingUser ? 'New password optional' : 'Password'}
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
            placeholder={role === 'nursing' ? "Same Day Care Doctor Name" : "Doctor name"} 
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
        
        {/* Doctor Availability Time Slots - shown when doctor or same day care role is selected */}
        {(role === 'doctor' || role === 'nursing' || editingUser?.role === 'doctor' || editingUser?.role === 'nursing') && (
          <div className="rounded-xl border border-orange-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-bold text-gray-700">Available Time Slots</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Configure weekly availability.</p>
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
                          {(user.role === 'doctor' || user.role === 'nursing') && user.opdFees > 0 && (
                            <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">₹{user.opdFees}</span>
                          )}
                        </td>
                    <td className="p-3 capitalize">{user.role === 'nursing' ? 'same day care' : user.role}</td>
                    <td className="p-3">{user.department || '-'}</td>
                    <td className="flex flex-wrap gap-2 p-3">
                      <button className="btn-secondary text-xs" onClick={() => updateUser(user, { isActive: !user.isActive })}>{user.isActive ? 'Disable' : 'Enable'}</button>
                      <button className="btn-secondary text-xs" onClick={() => editUser(user)}><Edit className="h-3 w-3" /> Edit</button>
                      {user.role === 'doctor' && (
                        <button className="btn-secondary text-xs" onClick={() => openAvailability(user)}><Clock className="h-3 w-3" /> Slots</button>
                      )}
                      <button className="btn-secondary text-xs" onClick={() => updateUser(user, { password: 'password123' })}><RefreshCcw className="h-3 w-3" /> Reset</button>
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