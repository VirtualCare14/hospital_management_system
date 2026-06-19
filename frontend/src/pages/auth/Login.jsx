import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, HeartPulse, Lock, User, Eye, EyeOff } from 'lucide-react';
import { getDefaultPathForUser, getModuleById } from '../../utils/moduleRoutes';

const Login = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const { hospitalId } = useParams();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedModule = searchParams.get('module') || 'admin';
  const module = getModuleById(selectedModule);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const user = await login(data.username, data.password, hospitalId);

      if (selectedModule === 'admin' && user.role !== 'admin') {
        await logout(false);
        toast.error('Admin module requires admin credentials.');
        return;
      }

      if (selectedModule !== 'admin' && user.role !== 'admin' && !user.moduleAccess.includes(Number(selectedModule))) {
        await logout(false);
        toast.error(`This user does not have Module ${selectedModule} access.`);
        return;
      }

      navigate(getDefaultPathForUser(user, selectedModule, hospitalId));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-orange-100/50 border border-orange-100 overflow-hidden">
        <div className="px-8 pt-6">
          <Link to={hospitalId ? `/hospital/${hospitalId}` : '/'} className="inline-flex items-center gap-2 text-sm font-bold text-orange-600">
            <ArrowLeft className="h-4 w-4" />
            All modules
          </Link>
        </div>
        {/* Header Branding */}
        <div className="p-8 pb-4 text-center">
          <div className="inline-flex bg-orange-500 text-white p-3 rounded-2xl shadow-lg shadow-orange-500/20 mb-4">
            <HeartPulse className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            {module ? `${module.title} Login` : 'Hospital Portal'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Hospital Management & EMR System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 pt-4 space-y-6">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                {...register('username', { required: 'Username is required' })}
                placeholder="Enter username"
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.username
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100'
                }`}
              />
            </div>
            {errors.username && (
              <span className="text-xs text-red-500 mt-1 block">{errors.username.message}</span>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Password is required' })}
                placeholder="Enter password"
                className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center cursor-pointer"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
