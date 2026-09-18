// API Client configuration for Medora 360 Clinic Portal

const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (url) {
    if (!url.endsWith('/api') && !url.endsWith('/api/')) {
      url = `${url.replace(/\/$/, '')}/api`;
    }
    return url.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:5000/api';
    }
    return 'https://api.medora360.com/api';
  }
  
  return 'https://api.medora360.com/api';
};

export const API_BASE_URL = getBaseUrl();

export const getMainPortalUrl = (hospitalId = null) => {
  let baseUrl = 'https://medora360.com';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      baseUrl = 'http://localhost:5173';
    }
  }
  if (process.env.NEXT_PUBLIC_PORTAL_URL) {
    baseUrl = process.env.NEXT_PUBLIC_PORTAL_URL.replace(/\/$/, '');
  }
  if (hospitalId) {
    return `${baseUrl}/hospital/${hospitalId}`;
  }
  return baseUrl;
};

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('clinic_token') || localStorage.getItem('hms_token');
};

export const setStoredToken = (token) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('clinic_token', token);
    localStorage.setItem('hms_token', token);
  } else {
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('hms_token');
  }
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('clinic_user') || localStorage.getItem('hms_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (typeof window === 'undefined') return;
  if (user) {
    const str = JSON.stringify(user);
    localStorage.setItem('clinic_user', str);
    localStorage.setItem('hms_user', str);
  } else {
    localStorage.removeItem('clinic_user');
    localStorage.removeItem('hms_user');
  }
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('clinic_token');
  localStorage.removeItem('hms_token');
  localStorage.removeItem('clinic_user');
  localStorage.removeItem('hms_user');
};

/**
 * Generic fetch wrapper for backend API calls
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const token = getStoredToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let reqBody = options.body;
  if (options.data !== undefined) {
    reqBody = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
  } else if (reqBody && typeof reqBody === 'object' && !(reqBody instanceof FormData)) {
    reqBody = JSON.stringify(reqBody);
  }

  const config = {
    ...options,
    body: reqBody,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;

      if ((response.status === 401 || response.status === 403) && token) {
        if (typeof window !== 'undefined') {
          clearStoredAuth();
          window.dispatchEvent(new CustomEvent('clinic_unauthorized', { detail: data.message }));
        }
      }

      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && (error.message?.includes('fetch') || error.message?.includes('Failed'))) {
      const customErr = new Error(`Cannot connect to backend API at ${url}. Please verify your backend server is running on http://localhost:5000.`);
      customErr.status = 0;
      customErr.data = { message: customErr.message };
      console.error(`API Connection Error [${endpoint}]:`, customErr.message);
      throw customErr;
    }
    
    if (error.status === 401 || error.status === 403) {
      console.warn(`API Session Warning [${endpoint}]:`, error.message);
    } else {
      console.error(`API Error [${endpoint}]:`, error.message);
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
