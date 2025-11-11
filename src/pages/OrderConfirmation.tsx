import React, { useEffect, useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Check, Package, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface OrderDetails {
  id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  total: number;
  createdAt: string;
  items: Array<{ bookId: string; quantity: number }>;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  customerEmail?: string;
  customerPhone?: string;
}

const OrderConfirmation = () => {
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    // Try to get order details from location state first
    if (location.state?.orderDetails) {
      setOrderDetails(location.state.orderDetails);
      return;
    }

    // If not in location state, try to get from localStorage
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
      const { orderDetails, timestamp } = JSON.parse(savedOrder);
      const orderAge = new Date().getTime() - new Date(timestamp).getTime();
      // Only use saved order if it's less than 1 hour old
      if (orderAge < 3600000) {
        setOrderDetails(orderDetails);
      } else {
        // Clear old order data
        localStorage.removeItem('lastOrder');
      }
    }
  }, [location.state]);

  if (!orderDetails) {
    return <Navigate to="/" replace />;
  }

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

            <h1 className="text-4xl font-bold mb-4">Congratulations!</h1>
            <h2 className="text-2xl text-gray-700 mb-6">Your Order is Successfully Placed</h2>
            
            <p className="text-gray-600 mb-4 text-lg">
              Thank you for shopping with Sterling Publishers! We're excited to get your books to you.
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
                <p><span className="font-medium">Order ID:</span> #{orderDetails.id}</p>
                <p><span className="font-medium">Status:</span> {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}</p>
                <p><span className="font-medium">Date:</span> {new Date(orderDetails.createdAt).toLocaleDateString()}</p>
                <p><span className="font-medium">Total Amount:</span> ₹{orderDetails.total.toFixed(2)}</p>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Shipping Information
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>{orderDetails.shippingAddress.fullName}</p>
                <p>{orderDetails.shippingAddress.address}</p>
                <p>
                  {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zipCode}
                </p>
                <p>{orderDetails.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Delivery Timeline */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-700">
              <Clock className="h-5 w-5 mr-2" />
              Estimated Delivery
            </h2>
            <div className="space-y-2">
              <p className="text-blue-600">
                Your order is expected to arrive in 3-5 business days.
              </p>
              <p className="text-sm text-blue-500">
                Order placed {formatDistanceToNow(new Date(orderDetails.createdAt))} ago
              </p>
            </div>
          </div>

          <div className="text-center space-x-4">
            <Link to="/">
              <Button variant="outline" className="mr-4">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/contact">
              <Button>
                Need Help?
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;