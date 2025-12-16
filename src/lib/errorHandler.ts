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
 * Enhanced error message mapping for better user experience
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Your session has expired. Please login again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'Request timeout. Please try again.',
  409: 'This action conflicts with the current state. Please refresh and try again.',
  422: 'Please check your input and correct any errors.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Our team has been notified. Please try again later.',
  502: 'Service temporarily unavailable. Please try again in a few minutes.',
  503: 'Service temporarily unavailable. Please try again in a few minutes.',
  504: 'Request timeout. Please try again.',
};

/**
 * Get user-friendly error message based on error type and status
 */
const getUserFriendlyMessage = (error: ApiError): string => {
  // Use custom message if available and user-friendly
  if (error.message && !error.message.includes('HTTP') && !error.message.includes('status')) {
    return error.message;
  }

  // Use predefined message for status code
  return ERROR_MESSAGES[error.status] || 'An unexpected error occurred. Please try again.';
};

/**
 * Enhanced global error handler for API calls
 * Handles different error types and provides user-friendly messages
 */
export const handleApiError = (error: unknown, showToast: boolean = true, context?: string): string => {
  let errorMessage = 'An unexpected error occurred';
  let shouldRedirectToLogin = false;

  // Handle ApiError instances
  if (error instanceof ApiError) {
    errorMessage = getUserFriendlyMessage(error);

    // Special handling for specific status codes
    switch (error.status) {
      case 401:
        shouldRedirectToLogin = true;
        break;

      case 422:
        if (error.errors) {
          errorMessage = parseValidationErrors(error.errors);
        }
        break;

      case 429:
        // For rate limiting, add context-specific advice
        if (context === 'login') {
          errorMessage = 'Too many login attempts. Please wait 5 minutes before trying again.';
        } else if (context === 'api') {
          errorMessage = 'You\'re making requests too quickly. Please wait a moment and try again.';
        }
        break;
    }
  }
  // Handle standard Error instances
  else if (error instanceof Error) {
    // Check for network errors
    if (error.message.toLowerCase().includes('network') || 
        error.message.toLowerCase().includes('fetch') ||
        error.message.toLowerCase().includes('connection') ||
        error.message.toLowerCase().includes('failed to fetch')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.message.toLowerCase().includes('timeout')) {
      errorMessage = 'Request timeout. Please check your connection and try again.';
    } else {
      errorMessage = error.message;
    }
  }
  // Handle string errors
  else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Handle session expiration
  if (shouldRedirectToLogin && typeof window !== 'undefined') {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Show toast before redirect
    if (showToast) {
      toast.error(errorMessage);
    }
    
    // Redirect after a short delay to allow toast to show
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
    
    return errorMessage;
  }

  // Show toast notification if requested
  if (showToast) {
    // Use different toast types based on error severity
    if (error instanceof ApiError) {
      if (error.status >= 500) {
        toast.error(errorMessage, { duration: 6000 }); // Longer duration for server errors
      } else if (error.status === 422) {
        toast.error(errorMessage, { duration: 8000 }); // Longer for validation errors
      } else {
        toast.error(errorMessage);
      }
    } else {
      toast.error(errorMessage);
    }
  }

  // Report error to global error handler
  if (typeof window !== 'undefined' && window.globalErrorHandler) {
    window.globalErrorHandler.reportApiError(error, { context });
  }

  return errorMessage;
};

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: any) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryCondition: (error) => {
    // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
    if (error instanceof ApiError) {
      return error.status >= 500 || error.status === 408 || error.status === 429;
    }
    // Retry on network errors
    return error instanceof TypeError && error.message.includes('fetch');
  }
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, config.maxDelay);
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wrapper for fetch calls with automatic error handling and retry logic
 */
export const fetchWithErrorHandling = async <T>(
  url: string,
  options?: RequestInit,
  retryConfig: Partial<RetryConfig> = {}
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Try to parse response as JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, create a generic error response
        data = { 
          message: response.ok ? 'Invalid response format' : `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      if (!response.ok) {
        const apiError = new ApiError(
          data.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data.errors
        );

        // Check if we should retry this error
        if (attempt <= config.maxRetries && config.retryCondition?.(apiError)) {
          const delay = calculateDelay(attempt, config);
          console.warn(`API call failed (attempt ${attempt}/${config.maxRetries + 1}), retrying in ${delay}ms:`, apiError.message);
          await sleep(delay);
          continue;
        }

        throw apiError;
      }

      return data;
    } catch (error) {
      lastError = error as Error;

      // If it's already an ApiError, check retry condition
      if (error instanceof ApiError) {
        if (attempt <= config.maxRetries && config.retryCondition?.(error)) {
          const delay = calculateDelay(attempt, config);
          console.warn(`API call failed (attempt ${attempt}/${config.maxRetries + 1}), retrying in ${delay}ms:`, error.message);
          await sleep(delay);
          continue;
        }
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network error. Please check your internet connection and try again.');
        
        if (attempt <= config.maxRetries && config.retryCondition?.(error)) {
          const delay = calculateDelay(attempt, config);
          console.warn(`Network error (attempt ${attempt}/${config.maxRetries + 1}), retrying in ${delay}ms`);
          await sleep(delay);
          continue;
        }
        
        throw networkError;
      }

      // For other errors, don't retry
      throw error;
    }
  }

  throw lastError!;
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
