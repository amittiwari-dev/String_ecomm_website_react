import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errorHandler';

/**
 * Query configuration constants for different types of data
 */
export const QUERY_CONFIG = {
  // Menu and navigation data - cached for longer periods as it changes infrequently
  MENU_DATA: {
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour - data stays in cache for 1 hour
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: false, // Don't refetch if data is still fresh
    refetchOnReconnect: true, // Refetch when network reconnects
  },

  // Footer data - similar to menu data
  FOOTER_DATA: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    refetchOnReconnect: true,
  },

  // Content data - moderate caching as it may change more frequently
  CONTENT_DATA: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    refetchOnReconnect: true,
  },

  // Book/Product data - shorter cache as inventory changes
  BOOK_DATA: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false, // Don't refetch books on focus to avoid unnecessary requests
    refetchOnMount: false,
    refetchOnReconnect: true,
  },

  // User-specific data - fresh data preferred
  USER_DATA: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Always get fresh user data when returning to tab
    refetchOnMount: true, // Always refetch user data on mount
    refetchOnReconnect: true,
  },

  // Search results - very short cache as results may change quickly
  SEARCH_DATA: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
} as const;

/**
 * Retry configuration for different types of operations
 */
export const RETRY_CONFIG = {
  // Default retry configuration
  DEFAULT: {
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // More aggressive retry for critical data (menu, content)
  CRITICAL: {
    retry: (failureCount: number, error: unknown) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Retry up to 3 times for critical data
      return failureCount < 3;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // Conservative retry for user actions (cart, orders)
  USER_ACTION: {
    retry: (failureCount: number, error: unknown) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        // Don't retry on any 4xx errors for user actions
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Only retry once for user actions
      return failureCount < 1;
    },
    retryDelay: (attemptIndex: number) => Math.min(1500 * 2 ** attemptIndex, 10000),
  },
} as const;

/**
 * Create and configure the QueryClient with optimized settings
 */
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default configuration for all queries
        staleTime: 2 * 60 * 1000, // 2 minutes default
        gcTime: 15 * 60 * 1000, // 15 minutes default (renamed from cacheTime in v5)
        refetchOnWindowFocus: true,
        refetchOnMount: false,
        refetchOnReconnect: true,
        
        // Apply default retry configuration
        ...RETRY_CONFIG.DEFAULT,
        
        // Network mode configuration
        networkMode: 'online', // Only run queries when online
        
        // Error handling
        throwOnError: false, // Don't throw errors globally, handle them in components
      },
      mutations: {
        // Default configuration for mutations
        ...RETRY_CONFIG.USER_ACTION,
        
        // Network mode for mutations
        networkMode: 'online',
        
        // Error handling for mutations
        throwOnError: false,
      },
    },
  });
};

/**
 * Prefetch configuration for critical data
 */
export const PREFETCH_CONFIG = {
  // Menu data should be prefetched on app load
  MENU_DATA: {
    staleTime: QUERY_CONFIG.MENU_DATA.staleTime,
    gcTime: QUERY_CONFIG.MENU_DATA.gcTime,
  },
  
  // Footer data should be prefetched on app load
  FOOTER_DATA: {
    staleTime: QUERY_CONFIG.FOOTER_DATA.staleTime,
    gcTime: QUERY_CONFIG.FOOTER_DATA.gcTime,
  },
  
  // Homepage content should be prefetched
  HOMEPAGE_CONTENT: {
    staleTime: QUERY_CONFIG.CONTENT_DATA.staleTime,
    gcTime: QUERY_CONFIG.CONTENT_DATA.gcTime,
  },
} as const;

/**
 * Query key patterns for invalidation
 */
export const INVALIDATION_PATTERNS = {
  // When menu data changes, invalidate these patterns
  MENU_CHANGE: [
    ['menu'],
    ['content', 'homepage-sections'], // Homepage might show menu-related content
  ],
  
  // When content changes, invalidate these patterns
  CONTENT_CHANGE: [
    ['content'],
  ],
  
  // When product data changes, invalidate these patterns
  PRODUCT_CHANGE: [
    ['books'],
    ['menu'], // Menu shows product counts
    ['content'], // Homepage might show featured products
  ],
  
  // When user data changes, invalidate these patterns
  USER_CHANGE: [
    ['user'],
  ],
} as const;