import { useState, useEffect, useCallback } from 'react';
import { OrderService, PaginatedOrders, OrderResponse, OrderStatistics } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface UseOrderDataReturn {
  orders: PaginatedOrders | null;
  statistics: OrderStatistics | null;
  isLoading: boolean;
  isLoadingStatistics: boolean;
  error: string | null;
  currentPage: number;
  filters: OrderFilters;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: OrderFilters) => void;
  refreshOrders: () => Promise<void>;
  refreshStatistics: () => Promise<void>;
  getOrderDetails: (orderId: string) => Promise<OrderResponse | null>;
}

export const useOrderData = (): UseOrderDataReturn => {
  const { state: authState } = useAuth();
  const [orders, setOrders] = useState<PaginatedOrders | null>(null);
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<OrderFilters>({});

  const fetchOrders = useCallback(async (page: number = currentPage, currentFilters: OrderFilters = filters) => {
    if (!authState.isAuthenticated || !authState.token) {
      setError('Please login to view your orders');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const ordersData = await OrderService.getOrders(authState.token, page, currentFilters);
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
      setError(errorMessage);
      
      // Only show toast for non-authentication errors
      if (!errorMessage.toLowerCase().includes('login') && !errorMessage.toLowerCase().includes('unauthorized')) {
        toast.error('Failed to load orders', {
          description: errorMessage,
          action: {
            label: 'Retry',
            onClick: () => fetchOrders(page, currentFilters),
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [authState.isAuthenticated, authState.token, currentPage, filters]);

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

  const refreshOrders = useCallback(async () => {
    await fetchOrders(currentPage, filters);
  }, [fetchOrders, currentPage, filters]);

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

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleFiltersChange = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Fetch orders when dependencies change
  useEffect(() => {
    fetchOrders(currentPage, filters);
  }, [fetchOrders, currentPage, filters]);

  // Fetch statistics on mount
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      fetchStatistics();
    }
  }, [fetchStatistics, authState.isAuthenticated, authState.token]);

  return {
    orders,
    statistics,
    isLoading,
    isLoadingStatistics,
    error,
    currentPage,
    filters,
    setCurrentPage: handlePageChange,
    setFilters: handleFiltersChange,
    refreshOrders,
    refreshStatistics,
    getOrderDetails,
  };
};