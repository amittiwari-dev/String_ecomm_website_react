import { toast } from 'sonner';

/**
 * Standard error response from API
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Parse validation errors from 422 response
 */
export const parseValidationErrors = (errors: Record<string, string[]>): string => {
  return Object.entries(errors)
    .map(([field, messages]) => {
      const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${fieldName}: ${messages.join(', ')}`;
    })
    .join('\n');
};

/**
 * Global error handler for API calls
 * Handles different error types and provides user-friendly messages
 */
export const handleApiError = (error: unknown, showToast: boolean = true): string => {
  let errorMessage = 'An unexpected error occurred';

  // Handle ApiError instances
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        errorMessage = 'Your session has expired. Please login again.';
        // Redirect to login page
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        break;

      case 422:
        if (error.errors) {
          errorMessage = parseValidationErrors(error.errors);
        } else {
          errorMessage = error.message || 'Validation failed. Please check your input.';
        }
        break;

      case 404:
        errorMessage = error.message || 'The requested resource was not found.';
        break;

      case 500:
      case 502:
      case 503:
        errorMessage = 'Server error. Please try again later.';
        break;

      default:
        errorMessage = error.message || errorMessage;
    }
  }
  // Handle standard Error instances
  else if (error instanceof Error) {
    // Check for network errors
    if (error.message.toLowerCase().includes('network') || 
        error.message.toLowerCase().includes('fetch') ||
        error.message.toLowerCase().includes('connection')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else {
      errorMessage = error.message;
    }
  }
  // Handle string errors
  else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Show toast notification if requested
  if (showToast) {
    toast.error(errorMessage);
  }

  // Log error for debugging
  console.error('API Error:', error);

  return errorMessage;
};

/**
 * Wrapper for fetch calls with automatic error handling
 */
export const fetchWithErrorHandling = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Request failed',
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    // Handle other errors
    throw error;
  }
};

/**
 * Show success toast notification
 */
export const showSuccessToast = (message: string) => {
  toast.success(message);
};

/**
 * Show error toast notification
 */
export const showErrorToast = (message: string) => {
  toast.error(message);
};

/**
 * Show loading toast notification
 * Returns a function to dismiss the toast
 */
export const showLoadingToast = (message: string): (() => void) => {
  const toastId = toast.loading(message);
  return () => toast.dismiss(toastId);
};

/**
 * Show info toast notification
 */
export const showInfoToast = (message: string) => {
  toast.info(message);
};
