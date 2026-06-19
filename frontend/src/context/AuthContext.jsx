import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Sync state with LocalStorage on startup
  useEffect(() => {
    const storedUser = localStorage.getItem('hms_user');
    const storedToken = localStorage.getItem('hms_token');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        ...parsedUser,
        role: parsedUser.role?.toLowerCase?.().trim?.()
      });
    }
    setLoading(false);
  }, []);

  const login = async (username, password, hospitalId) => {
    try {
      const response = await client.post('/auth/login', { username, password, hospitalId });
      const { token, user: userData } = response.data;
      const normalizedUser = { ...userData, role: userData.role?.toLowerCase?.().trim?.() };

      localStorage.setItem('hms_token', token);
      localStorage.setItem('hms_user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      toast.success('Logged in successfully!');
      return normalizedUser;
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      throw error;
    }
  };

  const superAdminLogin = async (username, password) => {
    try {
      const response = await client.post('/super-admin/login', { username, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('hms_token', token);
      localStorage.setItem('hms_user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Super admin logged in successfully!');
      return userData;
    } catch (error) {
      const msg = error.response?.data?.message || 'Super admin login failed.';
      toast.error(msg);
      throw error;
    }
  };

  const logout = async (forced = false) => {
    const targetHospitalId = user?.hospitalId || JSON.parse(localStorage.getItem('hms_user') || '{}')?.hospitalId;
    try {
      if (!forced) {
        // Call backend to invalidate active session
        await client.post('/auth/logout');
      }
    } catch (err) {
      console.warn('Backend logout call failed, cleaning up local state anyway:', err.message);
    } finally {
      // Clean up local storage
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      setUser(null);

      if (forced) {
        toast.error('Session expired or account disabled.', { id: 'force_logout_toast' });
      } else {
        toast.success('Logged out successfully.');
      }
      // Redirect to modules page (home) after logout
      try {
        if (user?.role === 'superadmin') {
          navigate('/super-admin');
        } else if (targetHospitalId) {
          navigate(`/hospital/${targetHospitalId}`);
        } else {
          navigate('/');
        }
      } catch (e) {
        console.error('Logout navigation failed:', e);
      }
    }
  };

  // Listen to single-device logout events triggered by api client interceptor.
  useEffect(() => {
    const handleForceLogout = () => {
      logout(true);
    };

    window.addEventListener('hms_unauthorized', handleForceLogout);
    return () => {
      window.removeEventListener('hms_unauthorized', handleForceLogout);
    };
  }, []);

  const hasAccess = (requiredModules = []) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has full access
    return requiredModules.every((mod) => user.moduleAccess.includes(mod));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, superAdminLogin, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
