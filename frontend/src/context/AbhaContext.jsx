import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AbhaContext = createContext(null);

export const AbhaProvider = ({ children }) => {
  const [xtoken, setXtoken] = useState(null);
  const [abhaNumber, setAbhaNumber] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);

  const loginAbha = useCallback((token, abha) => {
    setXtoken(token);
    setAbhaNumber(abha || null);
    setIsAuthenticated(true);
  }, []);

  const logoutAbha = useCallback(() => {
    setXtoken(null);
    setAbhaNumber(null);
    setIsAuthenticated(false);
    setProfile(null);
  }, []);

  const updateProfile = useCallback((data) => {
    setProfile(data);
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
  }, []);

  // Listen for hospital portal logout — clear ABHA session as well
  useEffect(() => {
    const handleForceLogout = () => {
      setXtoken(null);
      setAbhaNumber(null);
      setIsAuthenticated(false);
      setProfile(null);
    };

    window.addEventListener('abha_force_logout', handleForceLogout);
    return () => window.removeEventListener('abha_force_logout', handleForceLogout);
  }, []);

  return (
    <AbhaContext.Provider value={{
      xtoken,
      abhaNumber,
      isAuthenticated,
      profile,
      loginAbha,
      logoutAbha,
      updateProfile,
      clearProfile
    }}>
      {children}
    </AbhaContext.Provider>
  );
};

export const useAbha = () => {
  const context = useContext(AbhaContext);
  if (!context) {
    throw new Error('useAbha must be used within an AbhaProvider');
  }
  return context;
};