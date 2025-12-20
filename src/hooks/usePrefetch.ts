import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { prefetchRouteData } from '@/lib/prefetch';

/**
 * Hook for prefetching data based on route navigation
 * This improves perceived performance by loading data before it's needed
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchHomepage = useCallback(async () => {
    await prefetchRouteData.homepage(queryClient);
  }, [queryClient]);

  const prefetchBooks = useCallback(async (categorySlug?: string) => {
    await prefetchRouteData.books(queryClient, categorySlug);
  }, [queryClient]);

  const prefetchProfile = useCallback(async (token: string) => {
    await prefetchRouteData.profile(queryClient, token);
  }, [queryClient]);

  return {
    prefetchHomepage,
    prefetchBooks,
    prefetchProfile,
  };
};