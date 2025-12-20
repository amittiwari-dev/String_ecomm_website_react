/**
 * Environment utilities for handling production vs development behavior
 */

export const IS_PRODUCTION = import.meta.env.PROD;
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Prevent mock data usage in production builds
 * This function should be called at the start of any component that might use mock data
 */
export const preventMockDataInProduction = (): void => {
  if (IS_PRODUCTION) {
    console.error('❌ CRITICAL ERROR: Attempted to use mock data in production build!');
    throw new Error('Mock data is not available in production builds. Please ensure all API endpoints are properly configured.');
  }
};

/**
 * Get appropriate error message for API failures
 */
export const getApiErrorMessage = (error: unknown): string => {
  const baseMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  if (IS_PRODUCTION) {
    // In production, show user-friendly messages
    if (baseMessage.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (baseMessage.includes('404')) {
      return 'The requested content was not found.';
    }
    if (baseMessage.includes('500')) {
      return 'Server error. Please try again later.';
    }
    return 'Service temporarily unavailable. Please try again.';
  }
  
  // In development, show detailed error messages
  return `Development mode: ${baseMessage}`;
};

/**
 * Log error with appropriate level based on environment
 */
export const logError = (message: string, error?: unknown): void => {
  if (IS_DEVELOPMENT) {
    console.error(`[DEV] ${message}`, error);
  } else {
    // In production, log less verbose errors
    console.error(message);
  }
};

/**
 * Validate API configuration
 */
export const validateApiConfig = (): { isValid: boolean; error?: string } => {
  if (!API_BASE_URL) {
    return {
      isValid: false,
      error: IS_PRODUCTION 
        ? 'Service configuration error' 
        : 'VITE_API_BASE_URL environment variable is not set'
    };
  }
  
  try {
    new URL(API_BASE_URL);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: IS_PRODUCTION 
        ? 'Service configuration error' 
        : 'VITE_API_BASE_URL is not a valid URL'
    };
  }
};

