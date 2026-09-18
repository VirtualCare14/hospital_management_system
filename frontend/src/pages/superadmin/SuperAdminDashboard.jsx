import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Copy, Edit, Power, Save, Trash2 } from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [editing, setEditing] = useState(null);
  const [allowDataDeletion, setAllowDataDeletion] = useState(false);
  const [allowClinicSetting, setAllowClinicSetting] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  const loadHospitals = async () => {
    const { data } = await client.get('/super-admin/hospitals');
    setHospitals(data);
  };

  useEffect(() => {
    if (user?.role === 'superadmin') loadHospitals();
  }, [user]);

  if (!user) return <Navigate to="/super-admin" replace />;
  if (user.role !== 'superadmin') return <Navigate to="/" replace />;

  const onSubmit = async (data) => {
    const payload = {
      name: data.name?.trim(),
      loginId: data.loginId?.trim().toLowerCase(),
      code: data.code?.trim().toLowerCase(),
      maxUsers: Number(data.maxUsers) || 10,
      allowDataDeletion: allowDataDeletion,
      allowClinicSetting: allowClinicSetting
    };
    if (data.password) payload.password = data.password;

    if (!payload.name || !payload.loginId || !payload.code || (!editing && !payload.password)) {
      toast.error('Please provide hospital name, login ID, unique access code and password.');
      return;
    }

    try {
      if (editing) {
        await client.put(`/super-admin/hospitals/${editing.id}`, payload);
        toast.success('Hospital updated');
      } else {
        await client.post('/super-admin/hospitals', payload);
        toast.success('Hospital created');
      }
      setEditing(null);
      setAllowDataDeletion(false);
      setAllowClinicSetting(false);
      reset({ name: '', loginId: '', code: '', password: '', maxUsers: 10 });
      loadHospitals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save hospital.');
    }
  };

  const editHospital = (hospital) => {
    setEditing(hospital);
    setValue('name', hospital.name);
    setValue('loginId', hospital.loginId);
    setValue('code', hospital.code || '');
    setValue('password', '');
    setValue('maxUsers', hospital.maxUsers || 10);
    setAllowDataDeletion(Boolean(hospital.allowDataDeletion));
    setAllowClinicSetting(Boolean(hospital.allowClinicSetting));
    setEditing(hospital);
  };

  const cancelEdit = () => {
    setEditing(null);
    setAllowDataDeletion(false);
    setAllowClinicSetting(false);
    reset({ name: '', loginId: '', code: '', password: '', maxUsers: 10 });
  };

  const updateStatus = async (hospital) => {
    await client.put(`/super-admin/hospitals/${hospital.id}`, { isActive: !hospital.isActive });
    toast.success(hospital.isActive ? 'Hospital disabled and users logged out' : 'Hospital enabled');
    loadHospitals();
  };

  const deleteHospital = async (hospital) => {
    if (!window.confirm(`Delete ${hospital.name} and all related data?`)) return;
    await client.delete(`/super-admin/hospitals/${hospital.id}`);
    toast.success('Hospital deleted');
    loadHospitals();
  };

  const copyLink = async (link) => {
    await navigator.clipboard.writeText(link);
    toast.success('Hospital login link copied');
  };

  return (
    <main className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Hospitals, login links, permissions, status, and total users.</p>
          </div>
          <button className="btn-secondary" onClick={() => logout(false)}>Logout</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="card grid gap-3 p-5 md:grid-cols-[1fr_180px_180px_180px_120px_auto]">
            <input className="input" placeholder="Hospital name" {...register('name', { required: true })} />
            <input className="input" placeholder="Hospital login ID" {...register('loginId', { required: true })} />
            <input className="input" placeholder="Unique Access Code" {...register('code', { required: true })} />
            <input className="input" type="password" placeholder={editing ? 'New password optional' : 'Password'} {...register('password', { required: !editing })} />
            <input className="input" type="number" min="1" placeholder="User Limit" {...register('maxUsers', { required: true, valueAsNumber: true })} />
            <div className="flex gap-2">
              <button className="btn flex-1" type="submit"><Save className="h-4 w-4" /> {editing ? 'Update' : 'Create'}</button>
              {editing && (
                <button type="button" onClick={cancelEdit} className="btn-secondary text-xs px-3">
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-orange-100/40 transition">
              <div>
                <span className="block font-bold text-gray-800">Allow Clinic Setting</span>
                <span className="text-xs text-gray-500 font-normal">Enables Clinic Setting menu in Admin Dashboard to set Clinic Portal ID & Password</span>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                checked={allowClinicSetting}
                onChange={(e) => setAllowClinicSetting(e.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-orange-100/40 transition">
              <div>
                <span className="block font-bold text-gray-800">Allow Delete Data Option</span>
                <span className="text-xs text-gray-500 font-normal">Enables the Delete Data menu in Admin Dashboard for database housekeeping</span>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                checked={allowDataDeletion}
                onChange={(e) => setAllowDataDeletion(e.target.checked)}
              />
            </label>
          </div>
        </form>

        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-100/70 text-xs uppercase text-orange-900">
              <tr>
                <th className="p-3">Hospital</th>
                <th className="p-3">Login ID</th>
                <th className="p-3">Access Code</th>
                <th className="p-3">Users</th>
                <th className="p-3">Permissions</th>
                <th className="p-3">Status</th>
                <th className="p-3">Link</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital) => (
                <tr key={hospital.id} className="border-t border-orange-50 hover:bg-orange-50/20 transition">
                  <td className="p-3 font-bold text-gray-900">{hospital.name}</td>
                  <td className="p-3 text-gray-600">{hospital.loginId}</td>
                  <td className="p-3 font-mono font-bold text-orange-600">{hospital.code || '-'}</td>
                  <td className="p-3 font-mono">{hospital.userCount} / {hospital.maxUsers || 10}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${hospital.allowClinicSetting ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-400'}`}>
                        Clinic: {hospital.allowClinicSetting ? 'Yes' : 'No'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${hospital.allowDataDeletion ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-400'}`}>
                        Delete: {hospital.allowDataDeletion ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${hospital.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hospital.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button className="btn-secondary text-xs" onClick={() => copyLink(hospital.loginLink)}>
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </td>
                  <td className="flex flex-wrap gap-2 p-3">
                    <button className="btn-secondary text-xs" onClick={() => editHospital(hospital)}><Edit className="h-3 w-3" /> Edit</button>
                    <button className="btn-secondary text-xs" onClick={() => updateStatus(hospital)}><Power className="h-3 w-3" /> {hospital.isActive ? 'Disable' : 'Enable'}</button>
                    <button className="btn-ghost text-xs text-red-600" onClick={() => deleteHospital(hospital)}><Trash2 className="h-3 w-3" /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default SuperAdminDashboard;
