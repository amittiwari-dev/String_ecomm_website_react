import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { OrderService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'cash_on_delivery']),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const { state: cart, clearCart, syncCart } = useCart();
  const { state: authState } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderProcessing, setOrderProcessing] = useState(false);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'credit_card',
    },
  });

  // Check authentication on page load
  useEffect(() => {
    // Check if user is authenticated
    if (!authState.isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    // Cart is already loaded by CartContext, no need to fetch again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Redirect to cart if cart is empty after loading (but not during order processing)
  useEffect(() => {
    // Give cart some time to load from localStorage before checking
    const timer = setTimeout(() => {
      if (!cart.isLoading && cart.items.length === 0 && !orderProcessing) {
        console.log('🚨 Cart is empty after loading, redirecting to cart page');
        console.log('Cart state:', { isLoading: cart.isLoading, itemCount: cart.items.length, orderProcessing });
        toast.error('Your cart is empty');
        navigate('/cart');
      }
    }, 2000); // Wait 2 seconds for cart to load

    return () => clearTimeout(timer);
  }, [cart.isLoading, cart.items.length, navigate, orderProcessing]);

  useEffect(() => {
    // Calculate order total including taxes and shipping
    const subtotal = cart.items.reduce((sum, item) => sum + (item.book.price * item.quantity), 0);
    const shippingCost = subtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + shippingCost + tax;
    setOrderTotal(total);
  }, [cart.items]);

  const onSubmit = async (data: CheckoutForm) => {
    if (isSubmitting) return;
    
    console.log('🔍 Starting order submission...');
    console.log('Auth state:', { isAuthenticated: authState.isAuthenticated, hasToken: !!authState.token });
    console.log('Cart state:', { itemCount: cart.items.length, total: cart.total });
    
    // Validate user is authenticated
    if (!authState.isAuthenticated || !authState.token) {
      console.log('❌ User not authenticated');
      toast.error('Please login to complete checkout');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    // Validate cart is not empty
    if (cart.items.length === 0) {
      console.log('❌ Cart is empty');
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }
    
    setIsSubmitting(true);
    setOrderProcessing(true); // Prevent cart empty redirect during order processing
    const loadingToastId = toast.loading('Preparing your order...');

    try {
      console.log('📝 Syncing cart with backend...');
      
      // CRITICAL: Sync cart with API BEFORE creating order
      // This ensures the backend has all cart items before checking
      toast.loading('Syncing cart...', { id: loadingToastId });
      await syncCart();
      
      // Wait a moment to ensure sync completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Cart synced successfully');
      
      // Prepare order data for API - use flat structure matching backend expectations
      const orderData = {
        shipping_name: data.fullName,
        shipping_email: data.email,
        shipping_phone: data.phone,
        shipping_address: data.address,
        shipping_city: data.city,
        shipping_state: data.state,
        shipping_zip: data.zipCode,
        shipping_country: data.country,
        payment_method: data.paymentMethod,
      };

      console.log('📦 Order data prepared:', orderData);
      console.log('🚀 Calling OrderService.createOrder...');

      // Update loading message
      toast.loading('Creating your order...', { id: loadingToastId });

      // Call API to create order
      const order = await OrderService.createOrder(authState.token, orderData);
      
      console.log('✅ Order created successfully:', order);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      toast.success('🎉 Order placed successfully!', {
        description: `Order #${order.order_number} has been confirmed!`,
        duration: 5000,
      });
      
      form.reset();
      
      console.log('🎯 Navigating to order confirmation...');
      
      // Navigate to order confirmation page with order details first
      navigate('/order-confirmation', { 
        state: { 
          orderId: order.id,
          orderNumber: order.order_number,
          order: order
        },
        replace: true // Prevent going back to checkout
      });
      
      // Clear the cart after navigation (with a small delay to ensure navigation completes)
      setTimeout(() => {
        console.log('🗑️ Clearing cart after successful order and navigation...');
        clearCart();
      }, 100);
    } catch (error) {
      console.error('❌ Error placing order:', error);
      toast.dismiss(loadingToastId);
      
      // Handle different error types
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order';
      
      console.log('Error message:', errorMessage);
      
      // Check if it's a validation error (422)
      if (errorMessage.includes(':')) {
        // Display validation errors
        toast.error('Please check your information', {
          description: errorMessage,
          duration: 7000,
        });
      } else if (errorMessage.includes('Session expired') || errorMessage.includes('login')) {
        // Handle authentication errors
        toast.error('Session expired', {
          description: 'Please login again to continue',
          duration: 5000,
        });
        navigate('/login', { state: { from: '/checkout' } });
      } else if (errorMessage.includes('cart is empty') || errorMessage.includes('Cart is empty')) {
        // Handle empty cart error - this means sync failed
        toast.error('Unable to process order', {
          description: 'Your cart could not be synced. Please try adding items again.',
          duration: 5000,
        });
        setOrderProcessing(false); // Allow redirect
        navigate('/cart');
      } else {
        // Generic error
        toast.error('Failed to place order', {
          description: errorMessage || 'There was a problem processing your order. Please try again.',
          duration: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
      // Keep orderProcessing true to prevent redirect until navigation completes
      // It will be reset when component unmounts or user navigates away
    }
  };

  // Show loading state while fetching cart
  if (cart.isLoading) {
    return (
      <>
        <Toaster 
          position="top-center"
          expand={true}
          richColors
        />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Loading your cart...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // This check is now handled in useEffect with redirect
  if (cart.items.length === 0) {
    return null;
  }

  return (
    <>
      <Toaster 
        position="top-center"
        expand={true}
        richColors
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.book.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.book.images[0]}
                        alt={item.book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{item.book.title}</p>
                        <p className="text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">{item.book.currency} {(item.book.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{cart.total > 1000 ? 'Free' : '₹50.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (5%)</span>
                    <span>₹{(cart.total * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>₹{orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Street Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="credit_card" id="credit_card" />
                            <Label htmlFor="credit_card">Credit Card</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="debit_card" id="debit_card" />
                            <Label htmlFor="debit_card">Debit Card</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="paypal" id="paypal" />
                            <Label htmlFor="paypal">PayPal</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                            <Label htmlFor="cash_on_delivery">Cash on Delivery</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.book.id} className="flex gap-4">
                    <img
                      src={item.book.images[0]}
                      alt={item.book.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-medium">{item.book.title}</h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold">
                        {item.book.currency} {(item.book.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>
                      {cart.items[0]?.book.currency} {cart.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between font-semibold mt-4">
                    <span>Total</span>
                    <span>
                      {cart.items[0]?.book.currency} {cart.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Checkout;