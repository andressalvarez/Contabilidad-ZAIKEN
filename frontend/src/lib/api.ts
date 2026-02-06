import axios from 'axios';

// Base API configuration - robust approach
const getApiBaseUrl = () => {
  // First try the environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback for development
  if (typeof window !== 'undefined') {
    // In the browser, use the current URL
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '3004'; // Backend port
    return `${protocol}//${hostname}:${port}/api/v1`;
  }

  // Final fallback
  return 'http://localhost:3004/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Configuration:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  isBrowser: typeof window !== 'undefined'
});

// Create axios instance with better error handling
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // Additional configuration for better error handling
  validateStatus: (status) => {
    return status >= 200 && status < 300; // Only accept 2xx
  },
  withCredentials: false,
});

console.log('🚀 API Instance created with baseURL:', API_BASE_URL);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });

    // Add authentication token if it exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better JSON handling
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      hasData: !!response.data
    });

    // Verify response is valid JSON
    if (response.data === null || response.data === undefined) {
      console.warn('⚠️ Empty response data');
      return response;
    }

    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      isNetworkError: !error.response,
      isJsonError: error.message?.includes('JSON')
    });

    // Specific handling for JSON errors
    if (error.message?.includes('JSON') || error.message?.includes('Unexpected end of JSON input')) {
      console.error('🔴 JSON Parse Error - Response might be empty or malformed');
      return Promise.reject(new Error('Error al procesar la respuesta del servidor. Intente nuevamente.'));
    }

    // Network error handling
    if (!error.response) {
      console.error('🔴 Network Error - Server might be down');
      return Promise.reject(new Error('Error de conexión. Verifique que el servidor esté funcionando.'));
    }

    // HTTP error handling
    if (error.response?.status === 401) {
      // Expired or invalid token - only redirect if NOT already on login/register
      localStorage.removeItem('auth_token');
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }

    // Return formatted error message
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return Promise.reject(new Error(errorMessage));
  }
);

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Helper function to handle errors
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return Array.isArray(error.response.data.message)
      ? error.response.data.message.join(', ')
      : error.response.data.message;
  }
  return error.message || 'Error en la comunicación con el servidor';
};
