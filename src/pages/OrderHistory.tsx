import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderResponse, OrderService, PaginatedOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShippingAddress {
  full_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

const OrderHistory = () => {
  const { state: authState } = useAuth();
  const [orders, setOrders] = useState<PaginatedOrders | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!authState.isAuthenticated || !authState.token) {
          setError('Please login to view your orders');
          setIsLoading(false);
          return;
        }

        // Fetch orders from API
        const ordersData = await OrderService.getOrders(authState.token, currentPage);
        setOrders(ordersData);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
        setError(errorMessage);
        toast.error('Failed to load orders', {
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [authState.isAuthenticated, authState.token, currentPage]);

  const handleViewOrderDetails = async (orderId: string) => {
    try {
      setIsLoadingOrderDetails(true);
      
      if (!authState.token) {
        toast.error('Please login to view order details');
        return;
      }

      const orderDetails = await OrderService.getOrderById(authState.token, orderId);
      setSelectedOrder(orderDetails);
      setIsDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order details';
      toast.error('Failed to load order details', {
        description: errorMessage,
      });
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };

  const handlePrintOrder = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handlePageChange = (newPage: number) => {
    if (orders && newPage >= 1 && newPage <= orders.last_page) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Show loading state with skeleton loaders
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96 mb-8" />
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Unable to Load Orders</h2>
              <p className="text-gray-600 mb-6 text-center">{error}</p>
              <div className="space-x-4">
                <Link to="/">
                  <Button variant="outline">Go Home</Button>
                </Link>
                {!authState.isAuthenticated && (
                  <Link to="/login">
                    <Button>Login</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!orders || orders.data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Order History</h1>
            <div className="bg-white rounded-2xl shadow-sm p-12">
              <div className="flex flex-col items-center justify-center">
                <Package className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
                <p className="text-gray-600 mb-6 text-center">
                  You haven't placed any orders yet. Start shopping to see your order history here.
                </p>
                <Link to="/">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Order History</h1>
            <p className="text-gray-600">
              View and track all your orders in one place
            </p>
          </div>

          <div className="space-y-4">
            {orders.data.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        Order #{order.order_number}
                      </h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p>
                        <span className="font-medium">Items:</span>{' '}
                        {order.items?.length || 0} item(s)
                      </p>
                      <p>
                        <span className="font-medium">Total:</span>{' '}
                        <span className="text-lg font-bold text-gray-900">
                          ₹{order.total.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewOrderDetails(order.id)}
                      disabled={isLoadingOrderDetails}
                    >
                      {isLoadingOrderDetails ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'View Details'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {orders.last_page > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: orders.last_page }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === orders.last_page ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === orders.last_page}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            Showing page {orders.current_page} of {orders.last_page} ({orders.total} total orders)
          </div>
        </div>
      </div>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onPrint={handlePrintOrder}
        getStatusColor={getStatusColor}
      />
    </div>
  );
};

// Order Details Dialog Component
interface OrderDetailsDialogProps {
  order: OrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  getStatusColor: (status: string) => string;
}

const OrderDetailsDialog = ({
  order,
  isOpen,
  onClose,
  onPrint,
  getStatusColor,
}: OrderDetailsDialogProps) => {
  if (!order) return null;

  // Build shipping address from flat fields
  const shippingAddress: ShippingAddress = {
    full_name: order.shipping_name || 'N/A',
    address: order.shipping_address || 'N/A',
    city: order.shipping_city || 'N/A',
    state: order.shipping_state || 'N/A',
    zip_code: order.shipping_zip || 'N/A',
    country: order.shipping_country || 'N/A',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Order Details</DialogTitle>
          <DialogDescription>
            Order #{order.order_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status and Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Order Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <p>
                  <span className="text-gray-600">Date:</span>{' '}
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p>
                  <span className="text-gray-600">Payment Method:</span>{' '}
                  {order.payment_method
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Shipping Address</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{shippingAddress.full_name}</p>
                <p className="text-gray-600">{shippingAddress.address}</p>
                <p className="text-gray-600">
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}
                </p>
                <p className="text-gray-600">{shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-16 h-20 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/img/book-categori/book-placeholder.png';
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ₹{item.price.toFixed(2)} × {item.quantity} = ₹
                      {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>₹{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>
                  {order.shipping_cost === 0 ? 'Free' : `₹${order.shipping_cost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onPrint}>
              Print Order
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderHistory;
