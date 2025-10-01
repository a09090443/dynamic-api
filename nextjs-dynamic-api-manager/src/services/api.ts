import axios from 'axios';
import { appConfig } from '@/config/config';

const API_BASE_URL = appConfig.apiUrl;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: appConfig.apiTimeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (appConfig.debugMode) {
      console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (appConfig.debugMode) {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (appConfig.debugMode) {
      console.error('❌ API Error:', error);
    }
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.statusText;
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response received
      throw new Error('Network error - no response from server');
    } else {
      // Something else happened
      throw new Error(error.message);
    }
  }
);

export { apiClient };

// File upload helper
export const createFormData = (data: Record<string, unknown>, file?: File): FormData => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key] as string);
    }
  });
  
  if (file) {
    formData.append('file', file);
  }
  
  return formData;
};