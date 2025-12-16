import { useState, useEffect, useCallback, useRef } from 'react';
import { menuService, CategoryMenuItem, MenuState } from '../services/menuService';
import { ApiError } from '../lib/errorHandler';

export interface UseMenuDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  retryOnError?: boolean;
  maxRetries?: number;
}

export interface UseMenuDataReturn {
  menuState: MenuState;
  refreshMenu: () => Promise<void>;
  getCategoryPreview: (categoryId: string, limit?: number) => Promise<any[]>;
  clearError: () => void;
  isRefreshing: boolean;
}

const DEFAULT_OPTIONS: UseMenuDataOptions = {
  autoRefresh: false,
  refreshInterval: 10 * 60 * 1000, // 10 minutes
  retryOnError: false, // Disable retry to prevent issues
  maxRetries: 1
};

/**
 * Custom hook for managing menu data state
 */
export const useMenuData = (options: UseMenuDataOptions = {}): UseMenuDataReturn => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [menuState, setMenuState] = useState<MenuState>({
    categories: [],
    isLoading: true,
    lastRefresh: new Date(),
    error: null
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const retryCountRef = useRef(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  /**
   * Load menu categories
   */
  const loadMenuCategories = useCallback(async (isRetry: boolean = false) => {
    if (!mountedRef.current) return;

    try {
      if (!isRetry) {
        setMenuState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      const categories = await menuService.getMenuCategories();
      
      if (!mountedRef.current) return;

      setMenuState({
        categories,
        isLoading: false,
        lastRefresh: new Date(),
        error: null
      });

      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      if (!mountedRef.current) return;

      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load menu categories';

      console.error('Error loading menu categories:', error);

      // Handle retries
      if (opts.retryOnError && retryCountRef.current < (opts.maxRetries || 3)) {
        retryCountRef.current++;
        console.log(`Retrying menu load (attempt ${retryCountRef.current})`);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
        setTimeout(() => loadMenuCategories(true), delay);
        return;
      }

      setMenuState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [opts.retryOnError, opts.maxRetries]);

  /**
   * Refresh menu data
   */
  const refreshMenu = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsRefreshing(true);
    try {
      await menuService.refreshMenuData();
      await loadMenuCategories();
    } catch (error) {
      console.error('Error refreshing menu:', error);
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [loadMenuCategories]);

  /**
   * Get category preview data
   */
  const getCategoryPreview = useCallback(async (categoryId: string, limit?: number) => {
    try {
      return await menuService.getCategoryPreview(categoryId, limit);
    } catch (error) {
      console.error(`Error getting category preview for ${categoryId}:`, error);
      return [];
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setMenuState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Setup auto-refresh if enabled
   */
  useEffect(() => {
    if (opts.autoRefresh && opts.refreshInterval) {
      refreshIntervalRef.current = setInterval(() => {
        if (mountedRef.current && !menuState.isLoading && !isRefreshing) {
          refreshMenu();
        }
      }, opts.refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [opts.autoRefresh, opts.refreshInterval, menuState.isLoading, isRefreshing, refreshMenu]);

  /**
   * Initial load with timeout fallback
   */
  useEffect(() => {
    loadMenuCategories();
    
    // Emergency fallback - if loading takes too long, show error
    const timeoutId = setTimeout(() => {
      if (menuState.isLoading && !menuState.error) {
        setMenuState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Menu loading timeout - using fallback'
        }));
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeoutId);
  }, [loadMenuCategories]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    menuState,
    refreshMenu,
    getCategoryPreview,
    clearError,
    isRefreshing
  };
};

/**
 * Hook for getting a specific category's data
 */
export const useCategoryData = (categoryId: string) => {
  const { menuState } = useMenuData();
  
  const findCategory = useCallback((categories: CategoryMenuItem[], id: string): CategoryMenuItem | null => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.children) {
        const found = findCategory(category.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const category = findCategory(menuState.categories, categoryId);
  
  return {
    category,
    isLoading: menuState.isLoading,
    error: menuState.error
  };
};

/**
 * Hook for getting top-level categories only
 */
export const useTopLevelCategories = () => {
  const { menuState, refreshMenu, clearError, isRefreshing } = useMenuData();
  
  return {
    categories: menuState.categories,
    isLoading: menuState.isLoading,
    error: menuState.error,
    lastRefresh: menuState.lastRefresh,
    refreshMenu,
    clearError,
    isRefreshing
  };
};

/**
 * Hook for category preview functionality
 */
export const useCategoryPreview = () => {
  const [previewData, setPreviewData] = useState<{ [categoryId: string]: any[] }>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(new Set());

  const loadPreview = useCallback(async (categoryId: string, limit?: number) => {
    if (previewData[categoryId] || loadingPreviews.has(categoryId)) {
      return previewData[categoryId] || [];
    }

    setLoadingPreviews(prev => new Set(prev).add(categoryId));

    try {
      const preview = await menuService.getCategoryPreview(categoryId, limit);
      setPreviewData(prev => ({ ...prev, [categoryId]: preview }));
      return preview;
    } catch (error) {
      console.error(`Error loading preview for category ${categoryId}:`, error);
      return [];
    } finally {
      setLoadingPreviews(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    }
  }, [previewData, loadingPreviews]);

  const clearPreview = useCallback((categoryId: string) => {
    setPreviewData(prev => {
      const newData = { ...prev };
      delete newData[categoryId];
      return newData;
    });
  }, []);

  const clearAllPreviews = useCallback(() => {
    setPreviewData({});
  }, []);

  return {
    previewData,
    loadingPreviews,
    loadPreview,
    clearPreview,
    clearAllPreviews
  };
};

export default useMenuData;