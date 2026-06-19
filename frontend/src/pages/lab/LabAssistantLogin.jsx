import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FlaskConical, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LabAssistantLogin = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      if (user.role !== 'lab') {
        await logout(false);
        toast.error('Lab assistant portal requires lab credentials.');
        return;
      }
      navigate('/lab-assistant/portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100/50">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-orange-500 text-white"><FlaskConical className="h-7 w-7" /></div>
          <h1 className="text-2xl font-extrabold text-gray-900">Lab Assistant Portal</h1>
          <p className="text-sm text-gray-500">Home sample collection and status updates</p>
        </div>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Employee ID / Username</span>
          <div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input className="input" style={{paddingLeft: '44px'}} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
        </label>
        <label className="mb-6 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Password</span>
          <div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input className="input" style={{paddingLeft: '44px'}} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
        </label>
        <button className="btn w-full" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  );
};

export default LabAssistantLogin;
