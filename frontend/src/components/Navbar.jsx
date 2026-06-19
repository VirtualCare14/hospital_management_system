import { useAuth } from '../context/AuthContext';
import { LogOut, User, Activity } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-orange-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        {user.role === 'doctor' && user.doctorName ? (
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            <h1 className="text-xl font-bold text-gray-800">
              Welcome, Dr. {user.doctorName}
            </h1>
            <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
              {user.department}
            </span>
          </div>
        ) : (
          <h1 className="text-xl font-bold text-gray-800">
            {user.hospitalName || 'Hospital'} Portal
          </h1>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
            <User className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {user.doctorName || user.username}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => logout(false)}
          className="flex items-center gap-2 border border-orange-100 hover:border-orange-200 text-gray-600 hover:text-orange-600 hover:bg-orange-50/50 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
