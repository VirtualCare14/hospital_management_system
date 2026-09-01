'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api, { getStoredToken, setStoredToken, getStoredUser, setStoredUser, clearStoredAuth } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // Verify session with backend API
  const verifySession = useCallback(async () => {
    const existingToken = getStoredToken();
    const existingUser = getStoredUser();

    if (!existingToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return false;
    }

    setToken(existingToken);
    if (existingUser) {
      setUser(existingUser);
    }

    try {
      const response = await api.get('/auth/verify');
      if (response && response.user) {
        const verifiedUser = {
          ...response.user,
          role: response.user.role?.toLowerCase?.().trim?.()
        };
        setUser(verifiedUser);
        setStoredUser(verifiedUser);
        return true;
      }
    } catch (err) {
      console.warn('Lab Portal: Session verification failed', err.message);
      // Clear invalid session
      clearStoredAuth();
      setUser(null);
      setToken(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check URL parameters for bridged authentication from main HMS portal
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get('token');
        const queryUser = urlParams.get('user');
        if (queryToken) {
          setStoredToken(queryToken);
          if (queryUser) {
            try {
              const parsedUser = JSON.parse(decodeURIComponent(queryUser));
              setStoredUser(parsedUser);
            } catch (e) {
              // fallback
            }
          }
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      } catch (e) {
        console.warn('URL token check failed:', e);
      }
    }

    const timer = setTimeout(() => {
      verifySession();
    }, 0);
    return () => clearTimeout(timer);
  }, [verifySession]);

  // Handle unauthorized event dispatched by API client
  useEffect(() => {
    const handleUnauthorized = (e) => {
      clearStoredAuth();
      setUser(null);
      setToken(null);
      if (pathname !== '/login') {
        router.push('/login?expired=1');
      }
    };

    window.addEventListener('lab_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('lab_unauthorized', handleUnauthorized);
  }, [pathname, router]);

  // Login handler
  const login = async (username, password, hospitalCode = null) => {
    setError(null);
    try {
      let hospitalId = null;
      
      // If hospitalCode is supplied, perform lookup first
      if (hospitalCode && hospitalCode.trim()) {
        try {
          const hospitalInfo = await api.get(`/auth/hospital-lookup?code=${encodeURIComponent(hospitalCode.trim())}`);
          if (hospitalInfo && hospitalInfo.id) {
            hospitalId = hospitalInfo.id;
          }
        } catch (lookupErr) {
          const msg = lookupErr.data?.message || 'Hospital code not found. Please verify code.';
          setError(msg);
          throw new Error(msg);
        }
      }

      const response = await api.post('/auth/login', {
        username,
        password,
        ...(hospitalId ? { hospitalId } : {})
      });

      if (!response.token || !response.user) {
        throw new Error('Invalid authentication response from backend server');
      }

      const normalizedUser = {
        ...response.user,
        role: response.user.role?.toLowerCase?.().trim?.()
      };

      setStoredToken(response.token);
      setStoredUser(normalizedUser);
      
      setToken(response.token);
      setUser(normalizedUser);

      if (response.token) {
        router.push('/dashboard');
      }
      return normalizedUser;
    } catch (err) {
      const msg = err.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout', {}).catch(() => {});
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearStoredAuth();
      setUser(null);
      setToken(null);
      router.push('/login');
    }
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
        verifySession,
        isAuthenticated: Boolean(user && token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
