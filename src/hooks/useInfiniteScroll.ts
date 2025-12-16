import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  rootMargin?: string; // Intersection observer root margin
  enabled?: boolean; // Whether infinite scroll is enabled
}

interface UseInfiniteScrollReturn {
  isNearBottom: boolean;
  targetRef: React.RefObject<HTMLDivElement>;
  reset: () => void;
}

export const useInfiniteScroll = (
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn => {
  const {
    threshold = 200,
    rootMargin = '0px',
    enabled = true
  } = options;

  const [isNearBottom, setIsNearBottom] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const reset = useCallback(() => {
    setIsNearBottom(false);
  }, []);

  useEffect(() => {
    if (!enabled || !targetRef.current) {
      return;
    }

    const target = targetRef.current;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsNearBottom(true);
        }
      },
      {
        rootMargin,
        threshold: 0.1
      }
    );

    // Create a sentinel element at the bottom
    const sentinel = document.createElement('div');
    sentinel.style.height = `${threshold}px`;
    sentinel.style.position = 'absolute';
    sentinel.style.bottom = '0';
    sentinel.style.width = '100%';
    sentinel.style.pointerEvents = 'none';
    
    target.style.position = 'relative';
    target.appendChild(sentinel);

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel);
      }
    };
  }, [enabled, threshold, rootMargin]);

  return {
    isNearBottom,
    targetRef,
    reset
  };
};

// Hook for progressive data loading with infinite scroll
interface UseProgressiveLoadingOptions<T> {
  loadMore: (page: number) => Promise<{ data: T[]; hasMore: boolean; nextPage: number }>;
  initialPage?: number;
  pageSize?: number;
  enabled?: boolean;
}

interface UseProgressiveLoadingReturn<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadNextPage: () => Promise<void>;
  reset: () => void;
  targetRef: React.RefObject<HTMLDivElement>;
}

export const useProgressiveLoading = <T>(
  options: UseProgressiveLoadingOptions<T>
): UseProgressiveLoadingReturn<T> => {
  const {
    loadMore,
    initialPage = 1,
    pageSize = 10,
    enabled = true
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const { isNearBottom, targetRef, reset: resetScroll } = useInfiniteScroll({
    enabled: enabled && hasMore && !isLoadingMore
  });

  const loadNextPage = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      setError(null);

      const result = await loadMore(currentPage);
      
      setData(prevData => [...prevData, ...result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(result.nextPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more data';
      setError(errorMessage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [loadMore, currentPage, hasMore, isLoadingMore]);

  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(initialPage);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    setIsLoadingMore(false);
    resetScroll();
  }, [initialPage, resetScroll]);

  // Load initial data
  useEffect(() => {
    if (enabled && data.length === 0 && !isLoading) {
      setIsLoading(true);
      loadMore(initialPage)
        .then(result => {
          setData(result.data);
          setHasMore(result.hasMore);
          setCurrentPage(result.nextPage);
        })
        .catch(err => {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
          setError(errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [enabled, data.length, isLoading, loadMore, initialPage]);

  // Trigger load more when near bottom
  useEffect(() => {
    if (isNearBottom && enabled && hasMore && !isLoadingMore) {
      loadNextPage();
    }
  }, [isNearBottom, enabled, hasMore, isLoadingMore, loadNextPage]);

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadNextPage,
    reset,
    targetRef
  };
};