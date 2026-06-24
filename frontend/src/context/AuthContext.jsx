import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const sessionCheckIntervalRef = useRef(null);

  // Sync state with LocalStorage on startup and verify session with backend
  useEffect(() => {
    const storedUser = localStorage.getItem('hms_user');
    const storedToken = localStorage.getItem('hms_token');

    const verifyInitialSession = async () => {
      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            role: parsedUser.role?.toLowerCase?.().trim?.()
          });

          // Check session with backend (except for superadmin)
          if (parsedUser.role !== 'superadmin') {
            const response = await client.get('/auth/verify');
            if (response.data && response.data.user) {
              const normalizedUser = {
                ...response.data.user,
                role: response.data.user.role?.toLowerCase?.().trim?.()
              };
              setUser(normalizedUser);
              localStorage.setItem('hms_user', JSON.stringify(normalizedUser));
            }
          }
        } catch (error) {
          console.error('Session verification failed on load:', error);
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem('hms_token');
            localStorage.removeItem('hms_user');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    verifyInitialSession();
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
    // Clear interval immediately to avoid in-flight verify requests
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }

    const targetHospitalId = user?.hospitalId || JSON.parse(localStorage.getItem('hms_user') || '{}')?.hospitalId;
    const isSuperAdmin = user?.role === 'superadmin' || JSON.parse(localStorage.getItem('hms_user') || '{}')?.role === 'superadmin';
    try {
      if (!forced) {
        // Extract token and clear it from localStorage immediately so in-flight verify check
        // responses are ignored, but use it to make the backend logout call explicitly.
        const token = localStorage.getItem('hms_token');
        if (token) {
          localStorage.removeItem('hms_token');
          await client.post('/auth/logout', {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        }
      }
    } catch (err) {
      console.warn('Backend logout call failed, cleaning up local state anyway:', err.message);
    } finally {
      if (forced) {
        toast.error('Session expired or account disabled.', { id: 'force_logout_toast' });
      } else {
        toast.success('Logged out successfully.');
      }

      // Redirect first to avoid ProtectedRoute overriding navigation
      try {
        if (isSuperAdmin) {
          navigate('/super-admin');
        } else if (targetHospitalId) {
          navigate(`/hospital/${targetHospitalId}`);
        } else {
          navigate('/');
        }
      } catch (e) {
        console.error('Logout navigation failed:', e);
      }

      // Clean up local storage and state in the next tick
      setTimeout(() => {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
        setUser(null);
      }, 0);
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

  // Periodic session check to log out inactive tabs if logged in elsewhere
  useEffect(() => {
    if (!user || user.role === 'superadmin') return;

    sessionCheckIntervalRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('hms_token');
        if (!token) return; // Do not check if token was cleared during logout
        await client.get('/auth/verify');
      } catch (error) {
        // Suppress warning if token was cleared during a logout transition
        if (localStorage.getItem('hms_token')) {
          console.warn('Periodic session check failed:', error.message);
        }
        // The axios interceptor handles logging out and dispatching hms_unauthorized
      }
    }, 15000); // 15 seconds

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [user]);

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
