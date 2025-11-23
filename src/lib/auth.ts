// Authentication Types and Interfaces

/**
 * User interface representing authenticated user data
 */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Authentication response from API
 */
export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// Token Storage Utilities

const TOKEN_KEY = 'auth_token';

/**
 * Get authentication token from localStorage
 * @returns The stored token or null if not found
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token from localStorage:', error);
    return null;
  }
};

/**
 * Store authentication token in localStorage
 * @param token - The JWT token to store
 */
export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting token in localStorage:', error);
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from localStorage:', error);
  }
};

/**
 * Get authorization header with Bearer token
 * @returns Object with Authorization header if token exists, empty object otherwise
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Callback function to handle token expiration
 * This will be set by AuthContext to trigger logout on 401 responses
 */
let onTokenExpired: (() => void) | null = null;

/**
 * Set the callback function for token expiration
 * @param callback - Function to call when token expires (typically logout)
 */
export const setTokenExpirationHandler = (callback: () => void): void => {
  onTokenExpired = callback;
};

/**
 * Enhanced fetch wrapper that handles 401 responses globally
 * Automatically clears expired tokens and triggers logout
 * @param input - Request URL or Request object
 * @param init - Request options
 * @returns Promise with Response
 */
export const authenticatedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const response = await fetch(input, init);

  // Handle 401 Unauthorized responses (token expired or invalid)
  if (response.status === 401) {
    // Clear the expired token
    removeToken();

    // Trigger logout callback if set
    if (onTokenExpired) {
      onTokenExpired();
    }
  }

  return response;
};
