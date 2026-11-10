import axios from 'axios';

// Get base URL from environment variable VITE_API_URL (Render deployment ready)
// Automatically ensures the '/api' prefix for all endpoints
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const baseURL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`;

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT token if available
axiosClient.interceptors.request.forEach?.((interceptor) => axiosClient.interceptors.request.eject(interceptor));
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle common auth and error states
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-logout'));
      }
    }
    return Promise.reject(error);
  }
);

export const checkHealth = async () => {
  const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
  const response = await fetch(`${backendUrl}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return response.json();
};

export default axiosClient;
