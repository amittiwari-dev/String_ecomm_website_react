import { useState, useEffect, useCallback } from 'react';
import { OrderService, OrderResponse, OrderStatistics } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useProgressiveLoading } from './useInfiniteScroll';

interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface UseProgressiveOrderDataReturn {
  orders: OrderResponse[];
  statistics: OrderStatistics | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingStatistics: boolean;
  hasMore: boolean;
  error: string | null;
  filters: OrderFilters;
  setFilters: (filters: OrderFilters) => void;
  refreshOrders: () => void;
  refreshStatistics: () => Promise<void>;
  getOrderDetails: (orderId: string) => Promise<OrderResponse | null>;
  loadNextPage: () => Promise<void>;
  targetRef: React.RefObject<HTMLDivElement>;
}

export const useProgressiveOrderData = (): UseProgressiveOrderDataReturn => {
  const { state: authState } = useAuth();
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({});

  // Progressive loading function
  const loadMoreOrders = useCallback(async (page: number) => {
    if (!authState.isAuthenticated || !authState.token) {
      throw new Error('Please login to view your orders');
    }

    try {
      const ordersData = await OrderService.getOrders(authState.token, page, filters);
      
      return {
        data: ordersData.data,
        hasMore: page < ordersData.last_page,
        nextPage: page + 1
      };
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
      
      // Only show toast for non-authentication errors
      if (!errorMessage.toLowerCase().includes('login') && !errorMessage.toLowerCase().includes('unauthorized')) {
        toast.error('Failed to load orders', {
          description: errorMessage,
        });
      }
      
      throw err;
    }
  }, [authState.isAuthenticated, authState.token, filters]);

  // Use progressive loading hook
  const {
    data: orders,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadNextPage,
    reset,
    targetRef
  } = useProgressiveLoading({
    loadMore: loadMoreOrders,
    initialPage: 1,
    pageSize: 10,
    enabled: authState.isAuthenticated && !!authState.token
  });

  const fetchStatistics = useCallback(async () => {
    if (!authState.isAuthenticated || !authState.token) {
      return;
    }

    try {
      setIsLoadingStatistics(true);
      const statsData = await OrderService.getOrderStatistics(authState.token);
      setStatistics(statsData);
    } catch (err) {
      console.error('Failed to fetch order statistics:', err);
      // Don't show error toast for statistics as it's not critical
    } finally {
      setIsLoadingStatistics(false);
    }
  }, [authState.isAuthenticated, authState.token]);

  const refreshOrders = useCallback(() => {
    reset();
  }, [reset]);

  const refreshStatistics = useCallback(async () => {
    await fetchStatistics();
  }, [fetchStatistics]);

  const getOrderDetails = useCallback(async (orderId: string): Promise<OrderResponse | null> => {
    if (!authState.isAuthenticated || !authState.token) {
      toast.error('Please login to view order details');
      return null;
    }

    try {
      const orderDetails = await OrderService.getOrderById(authState.token, orderId);
      return orderDetails;
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order details';
      toast.error('Failed to load order details', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => getOrderDetails(orderId),
        },
      });
      return null;
    }
  }, [authState.isAuthenticated, authState.token]);

  const handleFiltersChange = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters);
    // Reset will trigger a fresh load with new filters
    reset();
  }, [reset]);

  // Fetch statistics on mount
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      fetchStatistics();
    }
  }, [fetchStatistics, authState.isAuthenticated, authState.token]);

  // Reset when filters change
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      reset();
    }
  }, [filters, authState.isAuthenticated, authState.token, reset]);

  return {
    orders,
    statistics,
    isLoading,
    isLoadingMore,
    isLoadingStatistics,
    hasMore,
    error,
    filters,
    setFilters: handleFiltersChange,
    refreshOrders,
    refreshStatistics,
    getOrderDetails,
    loadNextPage,
    targetRef,
  };
};