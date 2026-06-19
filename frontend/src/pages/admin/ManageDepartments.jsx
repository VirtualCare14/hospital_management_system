import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Building2, Plus } from 'lucide-react';
import client from '../../api/client';

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const { register, handleSubmit, reset } = useForm();

  const load = async () => {
    const { data } = await client.get('/admin/departments');
    setDepartments(data);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async ({ departmentName }) => {
    await client.post('/admin/departments', { departmentName });
    toast.success('Department added');
    reset();
    load();
  };

  const toggle = async (dept) => {
    await client.put(`/admin/departments/${dept._id}`, { isActive: !dept.isActive });
    toast.success('Department updated');
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Building2 className="text-orange-500" />
          <h1 className="text-xl font-extrabold text-gray-900">Departments</h1>
        </div>
        <input className="input" placeholder="Department name" {...register('departmentName', { required: true })} />
        <button className="btn w-full" type="submit"><Plus className="h-4 w-4" /> Add Department</button>
      </form>
      <div className="card divide-y divide-orange-50">
        {departments.map((dept) => (
          <div key={dept._id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-bold text-gray-800">{dept.departmentName}</p>
              <p className="text-sm text-gray-500">{dept.isActive ? 'Active' : 'Inactive'}</p>
            </div>
            <button className="btn-secondary" onClick={() => toggle(dept)}>{dept.isActive ? 'Disable' : 'Enable'}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageDepartments;
