import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Printer, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderResponse } from '../services/api';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProgressiveOrderData } from '../hooks/useProgressiveOrderData';
import { ProgressiveLoading, LoadingMoreSkeleton } from '@/components/ui/progressive-loading';
import { OrderHistoryPageSkeleton } from '@/components/ui/order-skeleton';
import { OrderFiltersComponent } from './OrderFilters';
import { OrderStatisticsComponent } from './OrderStatistics';

interface ShippingAddress {
  full_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export const ProgressiveOrderHistory = () => {
  const {
    orders,
    statistics,
    isLoading,
    isLoadingMore,
    isLoadingStatistics,
    hasMore,
    error,
    filters,
    setFilters,
    refreshOrders,
    refreshStatistics,
    getOrderDetails,
    loadNextPage,
    targetRef,
  } = useProgressiveOrderData();

  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewOrder = async (orderId: string) => {
    setIsLoadingOrderDetails(true);
    try {
      const orderDetails = await getOrderDetails(orderId);
      if (orderDetails) {
        setSelectedOrder(orderDetails);
        setIsOrderModalOpen(true);
      }
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };

  const handlePrintOrder = (order: OrderResponse) => {
    // Implementation for printing order
    console.log('Print order:', order.order_number);
  };

  if (isLoading) {
    return <OrderHistoryPageSkeleton />;
  }

  return (
    <div ref={targetRef} className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Order History</h1>
            <p className="text-muted-foreground">Track and manage your book orders</p>
          </div>

          {/* Statistics */}
          <OrderStatisticsComponent
            statistics={statistics}
            isLoading={isLoadingStatistics}
            onRefresh={refreshStatistics}
          />

          {/* Filters */}
          <OrderFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters({})}
          />

          {/* Orders List */}
          <div className="space-y-4 mb-8">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                        <p>{order.items?.length || 0} items</p>
                        <p>Total: ₹{parseFloat(String(order.total)).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                        disabled={isLoadingOrderDetails}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintOrder(order)}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-6">
                  {Object.keys(filters).length > 0 
                    ? "No orders match your current filters. Try adjusting your search criteria."
                    : "You haven't placed any orders yet. Start shopping to see your orders here!"
                  }
                </p>
                <Link to="/books">
                  <Button>Browse Books</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Progressive Loading */}
          <ProgressiveLoading
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={loadNextPage}
            onRetry={loadNextPage}
            loadingComponent={<LoadingMoreSkeleton type="list" count={3} />}
          />

          {/* Order Details Modal */}
          <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                  {selectedOrder && `Order #${selectedOrder.order_number} placed on ${new Date(selectedOrder.created_at).toLocaleDateString()}`}
                </DialogDescription>
              </DialogHeader>
              
              {selectedOrder && (
                <div className="space-y-6">
                  {/* Order Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Status</h3>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <h3 className="font-semibold">Total Amount</h3>
                      <p className="text-2xl font-bold text-primary">
                        ₹{parseFloat(String(selectedOrder.total)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-4">Items Ordered</h3>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <img
                            src={item.product_image || '/img/book-categori/book-placeholder.png'}
                            alt={item.product_name}
                            className="w-16 h-20 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = '/img/book-categori/book-placeholder.png';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × ₹{parseFloat(String(item.price)).toFixed(2)}
                            </p>
                            {item.book?.category && (
                              <Badge variant="outline" className="mt-1">
                                {item.book.category}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ₹{(parseFloat(String(item.price)) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handlePrintOrder(selectedOrder)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Order
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsOrderModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};