import { QueryClient } from '@tanstack/react-query';
import { getCacheStats } from './prefetch';

/**
 * Cache debugging utilities for development
 * These help monitor and debug React Query cache behavior
 */

/**
 * Log cache statistics to console
 */
export const logCacheStats = (queryClient: QueryClient): void => {
  if (import.meta.env.DEV) {
    const stats = getCacheStats(queryClient);
    console.group('🗄️ React Query Cache Statistics');
    console.log('Total Queries:', stats.totalQueries);
    console.log('Fresh Queries:', stats.freshQueries);
    console.log('Stale Queries:', stats.staleQueries);
    console.log('Error Queries:', stats.errorQueries);
    console.log('Loading Queries:', stats.loadingQueries);
    console.log('Estimated Cache Size:', `${Math.round(stats.cacheSize / 1024)} KB`);
    console.groupEnd();
  }
};

/**
 * Log all cached queries with their status
 */
export const logAllQueries = (queryClient: QueryClient): void => {
  if (import.meta.env.DEV) {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    console.group('📋 All Cached Queries');
    queries.forEach(query => {
      const key = JSON.stringify(query.queryKey);
      const status = query.state.status;
      const dataUpdatedAt = new Date(query.state.dataUpdatedAt).toLocaleTimeString();
      const staleTime = query.options.staleTime ?? 0;
      const isStale = Date.now() - query.state.dataUpdatedAt > staleTime;
      
      console.log(`${status === 'error' ? '❌' : status === 'pending' ? '⏳' : isStale ? '🟡' : '✅'} ${key}`, {
        status,
        dataUpdatedAt,
        isStale,
        staleTime: `${staleTime / 1000}s`,
      });
    });
    console.groupEnd();
  }
};

/**
 * Clear all cached data (useful for testing)
 */
export const clearAllCache = (queryClient: QueryClient): void => {
  queryClient.clear();
  console.log('🗑️ All cache cleared');
};

/**
 * Monitor cache changes (useful for debugging)
 */
export const monitorCacheChanges = (queryClient: QueryClient): (() => void) => {
  if (!import.meta.env.DEV) {
    return () => {};
  }

  const cache = queryClient.getQueryCache();
  
  const unsubscribe = cache.subscribe((event) => {
    if (event?.type === 'added') {
      console.log('➕ Query added to cache:', JSON.stringify(event.query.queryKey));
    } else if (event?.type === 'removed') {
      console.log('➖ Query removed from cache:', JSON.stringify(event.query.queryKey));
    } else if (event?.type === 'updated') {
      const status = event.query.state.status;
      const key = JSON.stringify(event.query.queryKey);
      console.log(`🔄 Query updated: ${key} (${status})`);
    }
  });

  console.log('👀 Cache monitoring started. Call the returned function to stop.');
  return unsubscribe;
};

/**
 * Get query details for debugging
 */
export const getQueryDetails = (queryClient: QueryClient, queryKey: readonly unknown[]) => {
  const query = queryClient.getQueryCache().find({ queryKey });
  
  if (!query) {
    return null;
  }

  const now = Date.now();
  const staleTime = query.options.staleTime ?? 0;
  const gcTime = query.options.gcTime ?? 0;
  
  return {
    queryKey: JSON.stringify(queryKey),
    status: query.state.status,
    dataUpdatedAt: new Date(query.state.dataUpdatedAt),
    isStale: now - query.state.dataUpdatedAt > staleTime,
    timeUntilGC: Math.max(0, query.state.dataUpdatedAt + gcTime - now),
    staleTime: staleTime / 1000,
    gcTime: gcTime / 1000,
    fetchStatus: query.state.fetchStatus,
    error: query.state.error,
    hasData: !!query.state.data,
  };
};

/**
 * Window utilities for debugging in browser console
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__reactQueryDebug = {
    logCacheStats,
    logAllQueries,
    clearAllCache,
    monitorCacheChanges,
    getQueryDetails,
  };
  
  console.log('🔧 React Query debug utilities available at window.__reactQueryDebug');
}