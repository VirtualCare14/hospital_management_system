import axios from 'axios';

const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL;
  if (url) {
    if (!url.endsWith('/api') && !url.endsWith('/api/')) {
      url = `${url.replace(/\/$/, '')}/api`;
    }
    return url;
  }
  return typeof window !== 'undefined' && window.location.origin.includes('localhost')
    ? 'http://localhost:5000/api'
    : '/api';
};

const client = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach authentication token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to intercept session failures
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginAttempt = error.config?.url?.includes('/auth/login');
    const status = error.response?.status;
    const message = error.response?.data?.message || '';

    const hasToken = Boolean(localStorage.getItem('hms_token'));

    const shouldForceLogout = !isLoginAttempt && hasToken && (
      status === 401 ||
      (status === 403 && (
        message.includes('Account is disabled') ||
        message.includes('Hospital account is disabled') ||
        message.includes('Session expired') ||
        message.includes('Logged in from another device')
      ))
    );

    if (shouldForceLogout) {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      window.dispatchEvent(new Event('hms_unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default client;
