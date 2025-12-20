import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { PREFETCH_CONFIG, QUERY_CONFIG, RETRY_CONFIG } from './queryConfig';
import { MenuService } from '@/services/menuService';
import { ContentService } from '@/services/contentService';

/**
 * Prefetch critical data on application load
 * This improves perceived performance by loading essential data in the background
 */
export const prefetchCriticalData = async (queryClient: QueryClient): Promise<void> => {
  const prefetchPromises: Promise<void>[] = [];

  // Prefetch menu data (critical for navigation)
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.menu.menuData(),
      queryFn: MenuService.getMenuData,
      staleTime: PREFETCH_CONFIG.MENU_DATA.staleTime,
      gcTime: PREFETCH_CONFIG.MENU_DATA.gcTime,
      ...RETRY_CONFIG.CRITICAL,
    })
  );

  // Prefetch footer links (visible on every page)
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.menu.footerLinks(),
      queryFn: MenuService.getFooterLinks,
      staleTime: PREFETCH_CONFIG.FOOTER_DATA.staleTime,
      gcTime: PREFETCH_CONFIG.FOOTER_DATA.gcTime,
      ...RETRY_CONFIG.CRITICAL,
    })
  );

  // Prefetch homepage sections (likely to be visited first)
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.content.homepageSections(),
      queryFn: ContentService.getHomepageSections,
      staleTime: PREFETCH_CONFIG.HOMEPAGE_CONTENT.staleTime,
      gcTime: PREFETCH_CONFIG.HOMEPAGE_CONTENT.gcTime,
      ...RETRY_CONFIG.DEFAULT,
    })
  );

  // Execute all prefetch operations in parallel
  try {
    await Promise.allSettled(prefetchPromises);
    console.log('✅ Critical data prefetching completed');
  } catch (error) {
    // Don't throw errors for prefetching failures
    console.warn('⚠️ Some prefetch operations failed:', error);
  }
};

/**
 * Prefetch data for specific routes
 * This can be called when navigating to specific pages
 */
export const prefetchRouteData = {
  /**
   * Prefetch data for the homepage
   */
  homepage: async (queryClient: QueryClient): Promise<void> => {
    const promises: Promise<void>[] = [];

    // Homepage sections (if not already cached)
    promises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.content.homepageSections(),
        queryFn: ContentService.getHomepageSections,
        ...QUERY_CONFIG.CONTENT_DATA,
        ...RETRY_CONFIG.DEFAULT,
      })
    );

    await Promise.allSettled(promises);
  },

  /**
   * Prefetch data for the books listing page
   */
  books: async (queryClient: QueryClient, categorySlug?: string): Promise<void> => {
    const promises: Promise<void>[] = [];

    // If a specific category is provided, prefetch that category's books
    if (categorySlug) {
      const { BookService } = await import('@/services/api');
      promises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.books.byCategory(categorySlug, 1, 20),
          queryFn: () => BookService.getProductsByCategory(categorySlug, 1, 20),
          ...QUERY_CONFIG.BOOK_DATA,
          ...RETRY_CONFIG.DEFAULT,
        })
      );
    }

    await Promise.allSettled(promises);
  },

  /**
   * Prefetch data for user profile pages
   */
  profile: async (queryClient: QueryClient, token: string): Promise<void> => {
    const promises: Promise<void>[] = [];

    // User profile data
    const { ProfileService } = await import('@/services/api');
    promises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.profile(),
        queryFn: () => ProfileService.getProfile(token),
        ...QUERY_CONFIG.USER_DATA,
        ...RETRY_CONFIG.DEFAULT,
      })
    );

    await Promise.allSettled(promises);
  },
};

/**
 * Invalidate queries when data changes
 * This ensures the UI stays in sync with backend changes
 */
export const invalidateQueries = {
  /**
   * Invalidate menu-related queries
   */
  menu: async (queryClient: QueryClient): Promise<void> => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.content.homepageSections() }), // Homepage might show menu data
    ]);
  },

  /**
   * Invalidate content-related queries
   */
  content: async (queryClient: QueryClient): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
  },

  /**
   * Invalidate book/product-related queries
   */
  books: async (queryClient: QueryClient): Promise<void> => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all }), // Menu shows book counts
      queryClient.invalidateQueries({ queryKey: queryKeys.content.homepageSections() }), // Homepage might show featured books
    ]);
  },

  /**
   * Invalidate user-related queries
   */
  user: async (queryClient: QueryClient): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
  },

  /**
   * Invalidate specific category data
   */
  category: async (queryClient: QueryClient, categorySlug: string): Promise<void> => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: queryKeys.books.byCategory(categorySlug) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all }),
    ]);
  },
};

/**
 * Utility to check if data is stale and needs refetching
 */
export const isDataStale = (queryClient: QueryClient, queryKey: readonly unknown[]): boolean => {
  const query = queryClient.getQueryCache().find({ queryKey });
  if (!query) return true;
  
  const now = Date.now();
  const dataUpdatedAt = query.state.dataUpdatedAt;
  const staleTime = query.options.staleTime ?? 0;
  
  return now - dataUpdatedAt > staleTime;
};

/**
 * Utility to get cache statistics for debugging
 */
export const getCacheStats = (queryClient: QueryClient) => {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  const stats = {
    totalQueries: queries.length,
    freshQueries: 0,
    staleQueries: 0,
    errorQueries: 0,
    loadingQueries: 0,
    cacheSize: 0,
  };
  
  queries.forEach(query => {
    if (query.state.status === 'error') {
      stats.errorQueries++;
    } else if (query.state.status === 'pending') {
      stats.loadingQueries++;
    } else if (isDataStale(queryClient, query.queryKey)) {
      stats.staleQueries++;
    } else {
      stats.freshQueries++;
    }
    
    // Rough estimate of cache size (in characters)
    if (query.state.data) {
      stats.cacheSize += JSON.stringify(query.state.data).length;
    }
  });
  
  return stats;
};