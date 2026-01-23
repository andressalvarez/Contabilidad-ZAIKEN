import axios, { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  isRetryable: boolean;
}

/**
 * Handles API errors and returns user-friendly error messages
 * @param error - The error object from axios or other sources
 * @returns ApiError object with message and metadata
 */
export function handleApiError(error: unknown): ApiError {
  // Check if it's an Axios error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    // Network/timeout errors (retryable)
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ERR_NETWORK') {
      return {
        message: 'Tiempo de espera agotado. Por favor intente nuevamente.',
        code: axiosError.code,
        isRetryable: true,
      };
    }

    if (!axiosError.response) {
      return {
        message: 'Error de conexión. Verifique su conexión a internet.',
        code: 'NETWORK_ERROR',
        isRetryable: true,
      };
    }

    const status = axiosError.response.status;
    const responseData = axiosError.response.data;

    // Authentication errors (not retryable)
    if (status === 401) {
      return {
        message: 'Sesión expirada. Por favor inicie sesión nuevamente.',
        status,
        code: 'UNAUTHORIZED',
        isRetryable: false,
      };
    }

    // Authorization errors (not retryable)
    if (status === 403) {
      return {
        message: 'No tiene permisos para realizar esta acción.',
        status,
        code: 'FORBIDDEN',
        isRetryable: false,
      };
    }

    // Validation errors (not retryable)
    if (status === 400) {
      const message = responseData?.message || responseData?.error || 'Datos inválidos. Verifique los campos.';
      return {
        message: typeof message === 'string' ? message : 'Datos inválidos. Verifique los campos.',
        status,
        code: 'VALIDATION_ERROR',
        isRetryable: false,
      };
    }

    // Not found errors (not retryable)
    if (status === 404) {
      return {
        message: responseData?.message || 'Recurso no encontrado.',
        status,
        code: 'NOT_FOUND',
        isRetryable: false,
      };
    }

    // Conflict errors (not retryable)
    if (status === 409) {
      return {
        message: responseData?.message || 'Conflicto: el recurso ya existe o está en uso.',
        status,
        code: 'CONFLICT',
        isRetryable: false,
      };
    }

    // Server errors (retryable)
    if (status >= 500) {
      return {
        message: 'Error del servidor. Por favor intente nuevamente.',
        status,
        code: 'SERVER_ERROR',
        isRetryable: true,
      };
    }

    // Other errors
    return {
      message: responseData?.message || 'Ocurrió un error inesperado.',
      status,
      code: 'UNKNOWN_ERROR',
      isRetryable: false,
    };
  }

  // Handle regular Error objects
  if (error instanceof Error) {
    return {
      message: error.message || 'Error inesperado',
      code: 'GENERIC_ERROR',
      isRetryable: false,
    };
  }

  // Handle unknown error types
  return {
    message: 'Error inesperado. Por favor contacte al soporte.',
    code: 'UNKNOWN',
    isRetryable: false,
  };
}

/**
 * Gets a simple error message string from an error object
 * @param error - The error object
 * @returns User-friendly error message string
 */
export function getErrorMessage(error: unknown): string {
  return handleApiError(error).message;
}

/**
 * Checks if an error is retryable (network/server errors)
 * @param error - The error object
 * @returns true if the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return handleApiError(error).isRetryable;
}

/**
 * Checks if an error is an authentication error
 * @param error - The error object
 * @returns true if the error is authentication-related
 */
export function isAuthError(error: unknown): boolean {
  const apiError = handleApiError(error);
  return apiError.status === 401 || apiError.code === 'UNAUTHORIZED';
}
