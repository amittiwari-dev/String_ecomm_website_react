/**
 * Utility functions for managing browser history state
 * 
 * These functions help preserve application state during navigation
 * and provide better user experience with browser back/forward buttons
 * 
 * Requirements: 2.1, 2.3
 */

import React from 'react';

export interface HistoryState {
  scrollPosition?: { x: number; y: number };
  formData?: Record<string, any>;
  filters?: Record<string, any>;
  searchTerm?: string;
  timestamp?: number;
  pageState?: any;
  pathname?: string;
  search?: string;
}

/**
 * Push state to browser history with application context
 */
export function pushStateWithContext(
  url: string,
  state: HistoryState = {},
  title?: string
) {
  const enhancedState: HistoryState = {
    ...state,
    scrollPosition: {
      x: window.scrollX,
      y: window.scrollY
    },
    timestamp: Date.now()
  };

  window.history.pushState(enhancedState, title || '', url);
}

/**
 * Replace current history state with application context
 */
export function replaceStateWithContext(
  url: string,
  state: HistoryState = {},
  title?: string
) {
  const enhancedState: HistoryState = {
    ...state,
    scrollPosition: {
      x: window.scrollX,
      y: window.scrollY
    },
    timestamp: Date.now()
  };

  window.history.replaceState(enhancedState, title || '', url);
}

/**
 * Get current history state
 */
export function getCurrentHistoryState(): HistoryState | null {
  return window.history.state;
}

/**
 * Save current page state to session storage as backup
 */
export function savePageStateToSession(
  pageKey: string,
  state: Record<string, any>
) {
  try {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    sessionStorage.setItem(`page-state-${pageKey}`, JSON.stringify(stateWithTimestamp));
  } catch (error) {
    console.warn(`Failed to save page state for ${pageKey}:`, error);
  }
}

/**
 * Restore page state from session storage
 */
export function restorePageStateFromSession(
  pageKey: string,
  maxAge: number = 30 * 60 * 1000 // 30 minutes default
): Record<string, any> | null {
  try {
    const saved = sessionStorage.getItem(`page-state-${pageKey}`);
    if (!saved) return null;

    const state = JSON.parse(saved);
    
    // Check if state is too old
    if (state.timestamp && Date.now() - state.timestamp > maxAge) {
      sessionStorage.removeItem(`page-state-${pageKey}`);
      return null;
    }

    return state;
  } catch (error) {
    console.warn(`Failed to restore page state for ${pageKey}:`, error);
    return null;
  }
}

/**
 * Clear page state from session storage
 */
export function clearPageStateFromSession(pageKey: string) {
  try {
    sessionStorage.removeItem(`page-state-${pageKey}`);
  } catch (error) {
    console.warn(`Failed to clear page state for ${pageKey}:`, error);
  }
}

/**
 * Handle browser back/forward navigation with state restoration
 */
export function setupHistoryStateHandler(
  onStateRestore: (state: HistoryState) => void
) {
  const handlePopState = (event: PopStateEvent) => {
    const state = event.state as HistoryState;
    if (state) {
      onStateRestore(state);
    }
  };

  window.addEventListener('popstate', handlePopState);
  
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
}

/**
 * Preserve scroll position across navigation
 */
export function preserveScrollPosition(key: string) {
  const currentPosition = {
    x: window.scrollX,
    y: window.scrollY
  };

  // Save to session storage
  try {
    sessionStorage.setItem(`scroll-${key}`, JSON.stringify(currentPosition));
  } catch (error) {
    console.warn(`Failed to save scroll position for ${key}:`, error);
  }

  // Also update history state if available
  if (window.history.state) {
    const newState = {
      ...window.history.state,
      scrollPosition: currentPosition
    };
    window.history.replaceState(newState, '', window.location.href);
  }
}

/**
 * Restore scroll position from storage or history state
 */
export function restoreScrollPosition(key: string, delay: number = 100) {
  setTimeout(() => {
    let position = null;

    // Try to get from history state first
    const historyState = getCurrentHistoryState();
    if (historyState?.scrollPosition) {
      position = historyState.scrollPosition;
    } else {
      // Fallback to session storage
      try {
        const saved = sessionStorage.getItem(`scroll-${key}`);
        if (saved) {
          position = JSON.parse(saved);
        }
      } catch (error) {
        console.warn(`Failed to restore scroll position for ${key}:`, error);
      }
    }

    if (position) {
      window.scrollTo(position.x, position.y);
    }
  }, delay);
}

/**
 * Enhanced page state management for complex pages
 */
export interface PageStateManager<T = Record<string, any>> {
  saveState: (state: T) => void;
  restoreState: () => T | null;
  clearState: () => void;
  getStateKey: () => string;
}

/**
 * Create a page state manager for a specific page
 */
export function createPageStateManager<T = Record<string, any>>(
  pageKey: string,
  defaultState?: T
): PageStateManager<T> {
  const getStateKey = () => `page-state-${pageKey}-${window.location.pathname}${window.location.search}`;

  const saveState = (state: T) => {
    try {
      const stateWithMeta = {
        ...state,
        _meta: {
          timestamp: Date.now(),
          url: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search
        }
      };
      
      sessionStorage.setItem(getStateKey(), JSON.stringify(stateWithMeta));
      
      // Also save to history state for browser navigation
      const currentHistoryState = getCurrentHistoryState() || {};
      const enhancedHistoryState = {
        ...currentHistoryState,
        pageState: stateWithMeta
      };
      
      window.history.replaceState(enhancedHistoryState, '', window.location.href);
    } catch (error) {
      console.warn(`Failed to save page state for ${pageKey}:`, error);
    }
  };

  const restoreState = (): T | null => {
    try {
      // Try history state first (for browser navigation)
      const historyState = getCurrentHistoryState();
      if (historyState?.pageState && !historyState.pageState._meta?.expired) {
        return historyState.pageState as T;
      }

      // Fallback to session storage
      const saved = sessionStorage.getItem(getStateKey());
      if (!saved) return defaultState || null;

      const state = JSON.parse(saved);
      
      // Check if state is too old (30 minutes)
      if (state._meta?.timestamp && Date.now() - state._meta.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem(getStateKey());
        return defaultState || null;
      }

      return state as T;
    } catch (error) {
      console.warn(`Failed to restore page state for ${pageKey}:`, error);
      return defaultState || null;
    }
  };

  const clearState = () => {
    try {
      sessionStorage.removeItem(getStateKey());
      
      // Clear from history state as well
      const currentHistoryState = getCurrentHistoryState() || {};
      if (currentHistoryState.pageState) {
        delete currentHistoryState.pageState;
        window.history.replaceState(currentHistoryState, '', window.location.href);
      }
    } catch (error) {
      console.warn(`Failed to clear page state for ${pageKey}:`, error);
    }
  };

  return {
    saveState,
    restoreState,
    clearState,
    getStateKey
  };
}

/**
 * Hook for using page state manager in React components
 */
export function usePageStateManager<T = Record<string, any>>(
  pageKey: string,
  defaultState?: T
) {
  const manager = createPageStateManager<T>(pageKey, defaultState);
  
  return {
    ...manager,
    // React-friendly methods
    useState: (initialState: T) => {
      const [state, setState] = React.useState<T>(() => {
        const restored = manager.restoreState();
        return restored || initialState;
      });

      // Auto-save state when it changes
      React.useEffect(() => {
        manager.saveState(state);
      }, [state]);

      return [state, setState] as const;
    }
  };
}