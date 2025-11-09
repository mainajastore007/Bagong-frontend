import axios from 'axios';

// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const API = axios.create({
  baseURL: API_URL,
});

// Set auth token in headers
export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
}

// Refresh access token using refresh token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
      refresh: refreshToken
    });
    
    const { access, refresh: newRefresh } = response.data;
    
    // Update tokens in localStorage
    localStorage.setItem('access', access);
    if (newRefresh) {
      localStorage.setItem('refresh', newRefresh);
    }
    
    // Update authorization header
    setAuthToken(access);
    
    return access;
  } catch (error) {
    // Refresh token is invalid or expired
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = '/login';
    throw error;
  }
}

// Add request interceptor to attach token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export async function checkAdminStatus() {
  try {
    const res = await API.get('/auth/profile/');
    return res.data.is_staff || res.data.is_superuser;
  } catch {
    return false;
  }
}

export default API;
