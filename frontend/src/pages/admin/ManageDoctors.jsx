import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, Stethoscope } from 'lucide-react';
import client from '../../api/client';
import { modules } from '../../utils/options';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { moduleAccess: ['2', '3'] }
  });

  const load = async () => {
    const [doctorRes, deptRes] = await Promise.all([
      client.get('/admin/doctors?includeInactive=true'),
      client.get('/admin/departments')
    ]);
    setDoctors(doctorRes.data);
    setDepartments(deptRes.data.filter((dept) => dept.isActive));
  };

  useEffect(() => {
    load();
  }, []);

  const createDoctor = async (data) => {
    await client.post('/admin/create-user', {
      ...data,
      role: 'doctor',
      moduleAccess: data.moduleAccess?.map(Number) || [2, 3]
    });
    toast.success('Doctor created');
    reset({ moduleAccess: ['2', '3'] });
    load();
  };

  const updateDoctor = async (doctor, payload) => {
    await client.put(`/admin/users/${doctor._id}`, payload);
    toast.success('Doctor updated');
    load();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form onSubmit={handleSubmit(createDoctor)} className="card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Stethoscope className="text-orange-500" />
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Create Doctor</h1>
            <p className="text-sm text-gray-500">Doctor credentials power consultation and prescription modules.</p>
          </div>
        </div>
        <input className="input" placeholder="Doctor Name" {...register('doctorName', { required: true })} />
        <input className="input" placeholder="Username" {...register('username', { required: true })} />
        <input className="input" type="password" placeholder="Password" {...register('password', { required: true })} />
        <select className="input" {...register('department', { required: true })}>
          <option value="">Select department</option>
          {departments.map((dept) => <option key={dept._id} value={dept.departmentName}>{dept.departmentName}</option>)}
        </select>
        <input className="input" placeholder="Mobile Number" {...register('mobile')} />
        <div className="grid gap-2">
          {modules.map((mod) => (
            <label key={mod.id} className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white p-3 text-sm">
              <input type="checkbox" value={mod.id} defaultChecked={[2, 3].includes(mod.id)} {...register('moduleAccess')} />
              {mod.label}
            </label>
          ))}
        </div>
        <button className="btn w-full" type="submit"><Save className="h-4 w-4" /> Create Doctor</button>
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-orange-100 p-5">
          <h2 className="font-bold text-gray-800">Doctor Management</h2>
          <p className="text-sm text-gray-500">Active doctors appear in patient registration, consultation, and prescription workflows.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-100/70 text-xs uppercase text-orange-900">
              <tr>
                <th className="p-3">Doctor</th>
                <th className="p-3">Department</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Modules</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor._id} className="border-t border-orange-50">
                  <td className="p-3">
                    <p className="font-bold text-gray-900">Dr. {doctor.doctorName || doctor.username}</p>
                    <p className="text-xs text-gray-500">{doctor.username}</p>
                  </td>
                  <td className="p-3">{doctor.department || '-'}</td>
                  <td className="p-3">{doctor.mobile || '-'}</td>
                  <td className="p-3">{doctor.moduleAccess?.join(', ')}</td>
                  <td className="flex flex-wrap gap-2 p-3">
                    <button className="btn-secondary text-xs" onClick={() => updateDoctor(doctor, { isActive: !doctor.isActive })}>
                      {doctor.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-secondary text-xs" onClick={() => updateDoctor(doctor, { moduleAccess: [2, 3] })}>
                      Assign 2,3
                    </button>
                    <button className="btn-secondary text-xs" onClick={() => updateDoctor(doctor, { password: 'doctor123' })}>
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageDoctors;
