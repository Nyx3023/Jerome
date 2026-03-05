import axios from 'axios';

// Base URL for all requests (override via Vite env)
// Prefer same-origin in dev so Vite proxy can forward /api requests to the backend.
// If VITE_API_URL is set, use it; otherwise default to the current origin.
axios.defaults.baseURL = import.meta.env?.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// Add a request interceptor
axios.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
let isRedirectingToLogin = false;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (error) {
        console.error('Failed to clear auth storage:', error);
      }
      if (typeof window !== 'undefined') {
        const alreadyOnLogin = window.location.pathname === '/login';
        if (!alreadyOnLogin && !isRedirectingToLogin) {
          isRedirectingToLogin = true;
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axios; 
