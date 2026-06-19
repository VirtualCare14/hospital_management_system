import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SuperAdminLogin = () => {
  const { superAdminLogin } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await superAdminLogin(data.username, data.password);
      navigate('/super-admin/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-orange-50 p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card w-full max-w-md space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-500 p-3 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Super Admin</h1>
            <p className="text-sm text-gray-500">Create and manage hospital accounts.</p>
          </div>
        </div>
        <input className="input" placeholder="Login ID" {...register('username', { required: true })} />
        <input className="input" type="password" placeholder="Password" {...register('password', { required: true })} />
        <button className="btn w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </main>
  );
};

export default SuperAdminLogin;
