'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser, clearStoredAuth } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth from localStorage on client load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getStoredToken();
      const savedUser = getStoredUser();

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);

        try {
          // Verify with backend session
          const res = await api.get('/auth/verify');
          if (res && res.valid && res.user) {
            setUser(res.user);
            setStoredUser(res.user);
          }
        } catch (err) {
          console.warn('Session verification notice:', err.message);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Listen for unauthorized events
  useEffect(() => {
    const handleUnauthorized = (e) => {
      clearStoredAuth();
      setUser(null);
      setToken(null);
      setError(e.detail || 'Session expired. Please log in again.');
    };

    window.addEventListener('clinic_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('clinic_unauthorized', handleUnauthorized);
  }, []);

  const login = async (username, password, hospitalCode = null) => {
    setError(null);
    try {
      let resolvedHospitalId = null;
      if (hospitalCode && hospitalCode.trim()) {
        try {
          const lookup = await api.get(`/auth/hospital-lookup?code=${encodeURIComponent(hospitalCode.trim())}`);
          if (lookup && lookup.id) {
            resolvedHospitalId = lookup.id;
          }
        } catch (lookupErr) {
          throw new Error('Hospital Access Code not found.');
        }
      }

      const payload = {
        username: username.trim().toLowerCase(),
        password
      };
      if (resolvedHospitalId) {
        payload.hospitalId = resolvedHospitalId;
      }

      const res = await api.post('/auth/login', payload);
      const { token: jwtToken, user: userData } = res;

      if (!jwtToken || !userData) {
        throw new Error('Invalid authentication response from server.');
      }

      setStoredToken(jwtToken);
      setStoredUser(userData);
      setToken(jwtToken);
      setUser(userData);

      return userData;
    } catch (err) {
      const msg = err.data?.message || err.message || 'Login failed. Please check your Clinic ID and password.';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
      // Clean up locally regardless
    }
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        setError,
        login,
        logout,
        isAuthenticated: !!user && !!token
      }}
    >
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

export default AuthContext;
