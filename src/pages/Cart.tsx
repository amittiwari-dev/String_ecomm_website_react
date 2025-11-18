import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '../context/CartContext';
import { cn } from '@/lib/utils';

// When integrating with Laravel API, you'll need these endpoints:
// GET /api/cart - Get cart items
// POST /api/cart/add - Add item to cart
// PUT /api/cart/update/{id} - Update cart item quantity
// DELETE /api/cart/remove/{id} - Remove item from cart
// GET /api/cart/count - Get cart items count
// DELETE /api/cart/clear - Clear cart

const CartPage = () => {
  const { state: cart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  // Optional: Fetch cart data from API on component mount
  useEffect(() => {
    // Example API call:
    // const fetchCart = async () => {
    //   try {
    //     const response = await fetch('/api/cart');
    //     const data = await response.json();
    //     // Update cart state with data
    //   } catch (error) {
    //     console.error('Error fetching cart:', error);
    //   }
    // };
    // fetchCart();
  }, []);

  // Handler for updating quantity
  const handleUpdateQuantity = async (bookId: string, newQuantity: number) => {
    try {
      // API call example:
      // await fetch(`/api/cart/update/${bookId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ quantity: newQuantity })
      // });
      updateQuantity(bookId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  // Handler for removing item
  const handleRemoveItem = async (bookId: string) => {
    try {
      // API call example:
      // await fetch(`/api/cart/remove/${bookId}`, {
      //   method: 'DELETE'
      // });
      removeFromCart(bookId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Handler for checkout
  const handleCheckout = () => {
    // You might want to validate cart or user session here
    navigate('/checkout');
  };

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">
          Browse our collection and find your next favorite book!
        </p>
        <Link to="/">
          <Button className="bg-red-600 hover:bg-red-700">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.book.id}
              className="flex gap-4 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              {/* Book Image */}
              <Link to={`/book/${item.book.id}-${item.book.slug}`} className="shrink-0">
                <img
                  src={item.book.images[0]}
                  alt={item.book.title}
                  className="w-24 h-32 object-cover rounded hover:opacity-80 transition-opacity"
                />
              </Link>

              <div className="flex-1">
                {/* Title and Remove Button */}
                <div className="flex justify-between">
                  <div>
                    <Link
                      to={`/book/${item.book.id}-${item.book.slug}`}
                      className="font-semibold hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.book.title}
                    </Link>
                    <p className="text-sm text-gray-600">
                      by {item.book.authors[0].name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.book.id)}
                    className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Book Details */}
                <div className="mt-2 text-sm text-gray-600">
                  <p>Format: {item.book.format}</p>
                  <p>Language: {item.book.language}</p>
                  <p>Stock: {item.book.stock_status}</p>
                </div>

                {/* Quantity Controls and Price */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.book.id, Math.max(1, item.quantity - 1))}
                      className={cn(
                        "p-2 rounded-full hover:bg-gray-100 transition-colors",
                        item.quantity <= 1 && "text-gray-400 cursor-not-allowed"
                      )}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.book.id, item.quantity + 1)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {item.book.currency} {(item.book.price * item.quantity).toFixed(2)}
                    </p>
                    {/* Display sale badge or original price if needed */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({cart.items.length} items)</span>
                <span>{cart.items[0]?.book.currency} {cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              {/* Add discount field if implementing coupons */}
              {/* <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600">- ₹0.00</span>
              </div> */}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <div className="flex justify-between font-semibold text-lg mb-6">
              <span>Total</span>
              <span>{cart.items[0]?.book.currency} {cart.total.toFixed(2)}</span>
            </div>

            {/* API Integration Note:
            Before proceeding to checkout, you might want to:
            1. Verify stock availability
            2. Check user authentication
            3. Validate cart items
            4. Get shipping options
            Example API endpoint: POST /api/cart/validate */}
            <Button 
              onClick={handleCheckout}
              className="w-full bg-red-600 hover:bg-red-700 mb-3"
            >
              Proceed to Checkout
            </Button>

            <Link to="/">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>

            {/* Optional: Show shipping information */}
            <p className="text-xs text-gray-500 mt-4 text-center">
              Free shipping on all orders. <br />
              Estimated delivery: 3-5 business days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;