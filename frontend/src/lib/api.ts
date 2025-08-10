import axios from 'axios';

// Configuración base de la API - más robusta
const getApiBaseUrl = () => {
  // Primero intentar la variable de entorno
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback para desarrollo
  if (typeof window !== 'undefined') {
    // En el navegador, usar la URL actual
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '3004'; // Puerto del backend
    return `${protocol}//${hostname}:${port}/api/v1`;
  }

  // Fallback final
  return 'http://localhost:3004/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Configuration:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  isBrowser: typeof window !== 'undefined'
});

// Crear instancia de axios con mejor manejo de errores
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
  // Configuración adicional para mejor manejo de errores
  validateStatus: (status) => {
    return status >= 200 && status < 300; // Solo aceptar 2xx
  },
});

console.log('🚀 API Instance created with baseURL:', API_BASE_URL);

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });

    // Agregar token de autenticación si existe
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

// Interceptor para responses con mejor manejo de JSON
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      hasData: !!response.data
    });

    // Verificar que la respuesta sea JSON válido
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

    // Manejo específico de errores de JSON
    if (error.message?.includes('JSON') || error.message?.includes('Unexpected end of JSON input')) {
      console.error('🔴 JSON Parse Error - Response might be empty or malformed');
      return Promise.reject(new Error('Error al procesar la respuesta del servidor. Intente nuevamente.'));
    }

    // Manejo de errores de red
    if (!error.response) {
      console.error('🔴 Network Error - Server might be down');
      return Promise.reject(new Error('Error de conexión. Verifique que el servidor esté funcionando.'));
    }

    // Manejo de errores HTTP
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    // Devolver mensaje de error formateado
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return Promise.reject(new Error(errorMessage));
  }
);

// Tipos de respuesta de la API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Función helper para manejar errores
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return Array.isArray(error.response.data.message)
      ? error.response.data.message.join(', ')
      : error.response.data.message;
  }
  return error.message || 'Error en la comunicación con el servidor';
};
