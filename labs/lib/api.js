// API Client configuration for Medora 360 Labs Portal

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
    // Default fallback for VPS / production when relative API proxy is used
    return `${origin}/api`;
  }
  
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseUrl();

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hms_token') || localStorage.getItem('lab_token');
};

export const setStoredToken = (token) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('hms_token', token);
    localStorage.setItem('lab_token', token);
  } else {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('lab_token');
  }
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('hms_user') || localStorage.getItem('lab_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (typeof window === 'undefined') return;
  if (user) {
    const str = JSON.stringify(user);
    localStorage.setItem('hms_user', str);
    localStorage.setItem('lab_user', str);
  } else {
    localStorage.removeItem('hms_user');
    localStorage.removeItem('lab_user');
  }
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('hms_token');
  localStorage.removeItem('lab_token');
  localStorage.removeItem('hms_user');
  localStorage.removeItem('lab_user');
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

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;

      // Handle session expiration
      if ((response.status === 401 || response.status === 403) && token) {
        if (typeof window !== 'undefined') {
          clearStoredAuth();
          window.dispatchEvent(new CustomEvent('lab_unauthorized', { detail: data.message }));
        }
      }

      throw error;
    }

    return data;
  } catch (error) {
    // Catch network / server down errors and format clearly
    if (error.name === 'TypeError' && (error.message?.includes('fetch') || error.message?.includes('Failed'))) {
      const customErr = new Error(`Cannot connect to backend server at ${baseUrl}. Please verify your backend server (node server.js) is running on port 5000.`);
      customErr.status = 0;
      customErr.data = { message: customErr.message };
      console.error(`API Connection Error [${endpoint}]:`, customErr.message);
      throw customErr;
    }
    console.error(`API Error [${endpoint}]:`, error.message);
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
