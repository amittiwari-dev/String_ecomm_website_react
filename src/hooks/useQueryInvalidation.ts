import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { invalidateQueries } from '@/lib/prefetch';

/**
 * Hook for managing query invalidation when data changes
 * This ensures the UI stays in sync with backend changes
 */
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateMenuData = useCallback(async () => {
    await invalidateQueries.menu(queryClient);
  }, [queryClient]);

  const invalidateContentData = useCallback(async () => {
    await invalidateQueries.content(queryClient);
  }, [queryClient]);

  const invalidateBookData = useCallback(async () => {
    await invalidateQueries.books(queryClient);
  }, [queryClient]);

  const invalidateUserData = useCallback(async () => {
    await invalidateQueries.user(queryClient);
  }, [queryClient]);

  const invalidateCategoryData = useCallback(async (categorySlug?: string) => {
    await invalidateQueries.category(queryClient, categorySlug || '');
  }, [queryClient]);

  return {
    invalidateMenuData,
    invalidateContentData,
    invalidateBookData,
    invalidateUserData,
    invalidateCategoryData,
  };
};