import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Check, Package, Clock, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { OrderResponse, OrderService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface ShippingAddress {
  full_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

const OrderConfirmation = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state: authState } = useAuth();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, try to get order from location state (passed from checkout)
      if (location.state?.order) {
        setOrder(location.state.order);
        setIsLoading(false);
        return;
      }

      // If no order in state, try to get orderId from URL params
      const orderId = searchParams.get('orderId') || location.state?.orderId;
      
      if (!orderId) {
        setError('No order information found. Please provide a valid order ID.');
        setIsLoading(false);
        return;
      }

      // Check if user is authenticated
      if (!authState.isAuthenticated || !authState.token) {
        setError('Please login to view order details');
        setIsLoading(false);
        return;
      }

      // Fetch order details from API
      const orderData = await OrderService.getOrderById(authState.token, orderId);
      
      if (!orderData) {
        setError('Order not found. The order may have been deleted or you may not have permission to view it.');
        setIsLoading(false);
        return;
      }
      
      setOrder(orderData);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order details';
      setError(errorMessage);
      toast.error('Failed to load order', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [location.state, searchParams, authState.isAuthenticated, authState.token]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-gray-600">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-6 text-center">
                {error || 'We couldn\'t find the order you\'re looking for.'}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {(searchParams.get('orderId') || location.state?.orderId) && authState.isAuthenticated && (
                  <Button onClick={fetchOrderDetails} variant="outline">
                    Retry
                  </Button>
                )}
                <Link to="/">
                  <Button variant="outline">Go Home</Button>
                </Link>
                {authState.isAuthenticated ? (
                  <Link to="/orders">
                    <Button>View My Orders</Button>
                  </Link>
                ) : (
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

  // Parse shipping address - handle both JSON string and direct object
  let shippingAddress: ShippingAddress;
  try {
    if (typeof order.shipping_address === 'string' && order.shipping_address.startsWith('{')) {
      // Try to parse as JSON
      shippingAddress = JSON.parse(order.shipping_address);
    } else if (typeof order.shipping_address === 'object' && order.shipping_address !== null) {
      // Already an object
      shippingAddress = order.shipping_address as ShippingAddress;
    } else {
      // Fallback to individual shipping fields from order
      shippingAddress = {
        full_name: order.shipping_name || 'Not provided',
        address: (typeof order.shipping_address === 'string' ? order.shipping_address : '') || 'Not provided',
        city: order.shipping_city || 'Not provided',
        state: order.shipping_state || 'Not provided',
        zip_code: order.shipping_zip || 'Not provided',
        country: order.shipping_country || 'Not provided'
      };
    }
  } catch (error) {
    console.error('Failed to parse shipping address:', error);
    // Use individual fields as fallback
    shippingAddress = {
      full_name: order.shipping_name || 'Not provided',
      address: (typeof order.shipping_address === 'string' ? order.shipping_address : '') || 'Not provided',
      city: order.shipping_city || 'Not provided',
      state: order.shipping_state || 'Not provided',
      zip_code: order.shipping_zip || 'Not provided',
      country: order.shipping_country || 'Not provided'
    };
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
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

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="mb-8">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <div className="animate-bounce text-2xl mb-4">🎉</div>
            </div>

            <h1 className="text-4xl font-bold mb-4">Order Confirmed!</h1>
            <h2 className="text-2xl text-gray-700 mb-6">Thank you for your purchase</h2>
            
            <p className="text-gray-600 mb-4 text-lg">
              Your order has been successfully placed. We're excited to get your books to you!
            </p>
            <p className="text-gray-600 mb-8">
              We'll send you an email confirmation with tracking details once your order ships.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Information
              </h2>
              <div className="space-y-3 text-gray-600">
                <p><span className="font-medium">Order Number:</span> {order.order_number}</p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </p>
                <p><span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p><span className="font-medium">Items:</span> {order.items?.length || 0} item(s)</p>
                <p><span className="font-medium">Payment Method:</span> {order.payment_method ? order.payment_method.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not specified'}</p>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Shipping Information
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>{shippingAddress.full_name}</p>
                <p>{shippingAddress.address}</p>
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}
                </p>
                <p>{shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
              <>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <img
                        src={item.product_image || '/img/book-categori/01.png'}
                        alt={item.product_name || 'Product'}
                        className="w-16 h-20 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/img/book-categori/01.png';
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product_name || 'Unknown Product'}</h3>
                        <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity || 1}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          ₹{Number(item.price || 0).toFixed(2)} × {item.quantity || 1} = ₹{(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Totals */}
                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{Number(order.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>₹{Number(order.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{order.shipping_cost === 0 ? 'Free' : `₹${Number(order.shipping_cost || 0).toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>₹{Number(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items found in this order</p>
              </div>
            )}
          </div>

          {/* Delivery Timeline */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-700">
              <Clock className="h-5 w-5 mr-2" />
              What's Next?
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-blue-900">Order Confirmation</p>
                  <p className="text-sm text-blue-600">You'll receive an email confirmation shortly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-blue-900">Processing</p>
                  <p className="text-sm text-blue-600">We'll prepare your order for shipment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-blue-900">Delivery</p>
                  <p className="text-sm text-blue-600">Expected delivery in 3-5 business days</p>
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-4">
                Order placed {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="text-center space-x-4">
            <Link to="/">
              <Button variant="outline" className="mr-4">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/orders">
              <Button>
                View Order History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;