import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  User,
  AuthState,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  getToken,
  setToken,
  removeToken,
  getAuthHeader,
  setTokenExpirationHandler,
  authenticatedFetch,
} from '../lib/auth';

// API Base URL - should match your backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Import cart sync function type
type CartSyncFunction = () => Promise<void>;

// Auth Context Type
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// Action Types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check for existing session
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
  onCartSync?: CartSyncFunction;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, onCartSync }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Login method - authenticates user and stores token
   */
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const loginData: LoginRequest = { email, password };

      const response = await authenticatedFetch(`${API_BASE_URL}login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();

      // Store token in localStorage
      setToken(data.token);

      // Update state
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: data.user,
          token: data.token,
        },
      });

      // Sync cart after successful login - ensure this completes before returning
      if (onCartSync) {
        try {
          await onCartSync();
        } catch (error) {
          console.error('Failed to sync cart after login:', error);
          // Continue even if cart sync fails - user is still logged in
        }
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  /**
   * Register method - creates new account and auto-logs in user
   */
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const registerData: RegisterRequest = {
        name,
        email,
        password,
        password_confirmation: password,
      };

      const response = await authenticatedFetch(`${API_BASE_URL}register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data: AuthResponse = await response.json();

      // Store token in localStorage
      setToken(data.token);

      // Update state (auto-login after registration)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: data.user,
          token: data.token,
        },
      });

      // Sync cart after successful registration - ensure this completes before returning
      if (onCartSync) {
        try {
          await onCartSync();
        } catch (error) {
          console.error('Failed to sync cart after registration:', error);
          // Continue even if cart sync fails - user is still registered and logged in
        }
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  /**
   * Logout method - clears token and resets state
   */
  const logout = (): void => {
    const token = getToken();

    // Call logout endpoint if token exists (fire and forget)
    if (token) {
      authenticatedFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      }).catch((error) => {
        console.error('Logout API call failed:', error);
      });
    }

    // Clear token from localStorage
    removeToken();

    // Reset state
    dispatch({ type: 'LOGOUT' });
  };

  /**
   * Check authentication - validates token on app load
   */
  const checkAuth = async (): Promise<void> => {
    const token = getToken();

    if (!token) {
      dispatch({ type: 'AUTH_FAILURE' });
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        // Token is invalid or expired
        removeToken();
        dispatch({ type: 'AUTH_FAILURE' });
        return;
      }

      const data = await response.json();

      // Token is valid, restore authenticated state
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: data.user || data,
          token,
        },
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      removeToken();
      dispatch({ type: 'AUTH_FAILURE' });
    }
  };

  // Set up token expiration handler on mount
  useEffect(() => {
    // Register logout as the handler for token expiration
    setTokenExpirationHandler(logout);

    // Check authentication on mount
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const value: AuthContextType = {
    state,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
