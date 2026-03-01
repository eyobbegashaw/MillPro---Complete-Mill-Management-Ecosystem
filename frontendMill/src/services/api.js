import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [API] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    }

    return config;
  },
  (error) => {
    console.error('❌ [API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API] ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [API] Response Error:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          });

          const { token } = response.data;
          localStorage.setItem('token', token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
        }
      }
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    }

    // Handle 404 Not Found errors
    if (error.response?.status === 404) {
      console.warn('Resource not found:', originalRequest?.url);
    }

    // Handle 422 Validation errors
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      if (errors) {
        Object.values(errors).forEach(err => {
          toast.error(err);
        });
      }
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      toast.warning('Too many requests. Please try again later.');
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    }

    if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Helper methods for common requests
api.get = async (url, config = {}) => {
  try {
    const response = await axios.get(url, config);
    return response;
  } catch (error) {
    throw error;
  }
};

api.post = async (url, data = {}, config = {}) => {
  try {
    const response = await axios.post(url, data, config);
    return response;
  } catch (error) {
    throw error;
  }
};

api.put = async (url, data = {}, config = {}) => {
  try {
    const response = await axios.put(url, data, config);
    return response;
  } catch (error) {
    throw error;
  }
};

api.patch = async (url, data = {}, config = {}) => {
  try {
    const response = await axios.patch(url, data, config);
    return response;
  } catch (error) {
    throw error;
  }
};

api.delete = async (url, config = {}) => {
  try {
    const response = await axios.delete(url, config);
    return response;
  } catch (error) {
    throw error;
  }
};

// Upload file helper
api.upload = async (url, formData, onProgress = null) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      };
    }

    const response = await axios.post(url, formData, config);
    return response;
  } catch (error) {
    throw error;
  }
};

// Download file helper
api.download = async (url, filename) => {
  try {
    const response = await axios.get(url, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    throw error;
  }
};

// Cancel request helper
api.cancelToken = axios.CancelToken;
api.isCancel = axios.isCancel;

export default api;