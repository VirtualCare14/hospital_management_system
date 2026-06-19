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
      maxUsers: Number(data.maxUsers) || 10
    };
    if (data.password) payload.password = data.password;

    if (!payload.name || !payload.loginId || (!editing && !payload.password)) {
      toast.error('Please provide hospital name, login ID and password.');
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
      reset({ name: '', loginId: '', password: '', maxUsers: 10 });
      loadHospitals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save hospital.');
    }
  };

  const editHospital = (hospital) => {
    setEditing(hospital);
    setValue('name', hospital.name);
    setValue('loginId', hospital.loginId);
    setValue('password', '');
    setValue('maxUsers', hospital.maxUsers || 10);
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
            <p className="text-sm text-gray-500">Hospitals, login links, status, and total users.</p>
          </div>
          <button className="btn-secondary" onClick={() => logout(false)}>Logout</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card grid gap-3 p-5 md:grid-cols-[1fr_200px_200px_120px_auto]">
          <input className="input" placeholder="Hospital name" {...register('name', { required: true })} />
          <input className="input" placeholder="Hospital login ID" {...register('loginId', { required: true })} />
          <input className="input" type="password" placeholder={editing ? 'New password optional' : 'Password'} {...register('password', { required: !editing })} />
          <input className="input" type="number" min="1" placeholder="User Limit" {...register('maxUsers', { required: true, valueAsNumber: true })} />
          <button className="btn" type="submit"><Save className="h-4 w-4" /> {editing ? 'Update' : 'Create'}</button>
        </form>

        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-100/70 text-xs uppercase text-orange-900">
              <tr>
                <th className="p-3">Hospital</th>
                <th className="p-3">Login ID</th>
                <th className="p-3">Users</th>
                <th className="p-3">Status</th>
                <th className="p-3">Link</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital) => (
                <tr key={hospital.id} className="border-t border-orange-50">
                  <td className="p-3 font-bold">{hospital.name}</td>
                  <td className="p-3">{hospital.loginId}</td>
                  <td className="p-3 font-mono">{hospital.userCount} / {hospital.maxUsers || 10}</td>
                  <td className="p-3">{hospital.isActive ? 'Active' : 'Disabled'}</td>
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
