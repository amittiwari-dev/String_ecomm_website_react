# Implementation Plan

## Backend Implementation

- [x] 1. Create database schema and models
  - Create migration for `carts` table with user_id foreign key
  - Create migration for `cart_items` table with cart_id and product_id foreign keys
  - Create migration for `orders` table with all order fields (order_number, status, totals, shipping info)
  - Create migration for `order_items` table with order_id and product_id foreign keys
  - Create Cart model with relationships to User and CartItem
  - Create CartItem model with relationships to Cart and Product
  - Create Order model with relationships to User and OrderItem
  - Create OrderItem model with relationships to Order and Product
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 2. Implement Cart API endpoints
  - [x] 2.1 Create CartController with authentication middleware
    - Create CartController class
    - Apply Sanctum auth middleware to all routes
    - _Requirements: 1.1, 8.1, 8.2, 8.3, 8.4, 8.10_
  
  - [x] 2.2 Implement GET /api/cart endpoint
    - Fetch or create cart for authenticated user
    - Load cart items with product details
    - Calculate subtotal, tax, shipping, and total
    - Return formatted cart response
    - _Requirements: 1.2, 8.2_
  
  - [x] 2.3 Implement POST /api/cart endpoint
    - Validate product_id and quantity in request
    - Check if product exists and is active
    - Create cart if user doesn't have one
    - Add item to cart or update quantity if exists
    - Snapshot current product price
    - Return updated cart
    - _Requirements: 1.1, 8.1_
  
  - [x] 2.4 Implement PUT /api/cart/{itemId} endpoint
    - Validate cart item belongs to user
    - Validate quantity is positive integer
    - Update cart item quantity
    - Return updated cart
    - _Requirements: 1.3, 8.3_
  
  - [x] 2.5 Implement DELETE /api/cart/{itemId} endpoint
    - Validate cart item belongs to user
    - Delete cart item
    - Return updated cart
    - _Requirements: 1.4, 8.4_
  
  - [x] 2.6 Implement POST /api/cart/merge endpoint
    - Accept array of guest cart items
    - Validate all product IDs exist
    - Merge quantities for duplicate items
    - Add new items to user cart
    - Return merged cart
    - _Requirements: 2.3, 2.5_

- [-] 3. Implement Order API endpoints
  - [x] 3.1 Create OrderController with authentication middleware
    - Create OrderController class
    - Apply Sanctum auth middleware to all routes
    - _Requirements: 3.1, 8.5, 8.6, 8.7, 8.10_
  
  - [x] 3.2 Implement POST /api/orders endpoint
    - Validate shipping address and payment method
    - Fetch user's cart and validate not empty
    - Generate unique order number (ORD-YYYYMMDD-####)
    - Create order record with totals and shipping info
    - Create order items from cart items (snapshot product data)
    - Clear user's cart after successful order creation
    - Return order details with order number
    - _Requirements: 3.1, 3.2, 4.4, 4.5, 8.5_
  
  - [x] 3.3 Implement GET /api/orders endpoint
    - Fetch user's orders with pagination
    - Include item count for each order
    - Order by created_at descending
    - Return paginated order list
    - _Requirements: 3.3, 8.6_
  
  - [x] 3.4 Implement GET /api/orders/{id} endpoint
    - Validate order belongs to authenticated user
    - Fetch order with all items and product details
    - Return complete order information
    - _Requirements: 3.5, 8.7_

- [-] 4. Implement Profile API endpoints
  - [x] 4.1 Create ProfileController with authentication middleware
    - Create ProfileController class
    - Apply Sanctum auth middleware to all routes
    - _Requirements: 5.1, 8.8, 8.9, 8.10_
  
  - [x] 4.2 Implement GET /api/profile endpoint
    - Fetch authenticated user data
    - Calculate order statistics (total orders, total spent, pending orders)
    - Return user profile with stats
    - _Requirements: 5.1, 5.2, 8.8_
  
  - [ ] 4.3 Implement PUT /api/profile endpoint
    - Validate name and email fields
    - Check email uniqueness if changed
    - Update user record
    - Return updated user data
    - _Requirements: 5.3, 5.4, 5.5, 8.9_

- [x] 5. Configure API routes and CORS
  - Add cart routes to api.php with auth:sanctum middleware
  - Add order routes to api.php with auth:sanctum middleware
  - Add profile routes to api.php with auth:sanctum middleware
  - Configure CORS in config/cors.php to allow frontend domain
  - Set supports_credentials to true for authenticated requests
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

- [ ]* 6. Create backend tests
  - Write feature tests for all Cart API endpoints
  - Write feature tests for all Order API endpoints
  - Write feature tests for all Profile API endpoints
  - Test authorization (users can only access their own data)
  - Test validation errors return proper 422 responses
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.3, 3.5, 5.1, 5.3_

## Frontend Implementation

- [x] 7. Create API service modules
  - [x] 7.1 Create CartService in api.ts
    - Implement getCart() method with authenticated fetch
    - Implement addToCart(productId, quantity) method
    - Implement updateCartItem(itemId, quantity) method
    - Implement removeCartItem(itemId) method
    - Implement clearCart() method
    - Implement mergeGuestCart(items) method
    - Add proper error handling and response parsing
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 6.1_
  
  - [x] 7.2 Create OrderService in api.ts
    - Implement createOrder(orderData) method with shipping and payment info
    - Implement getOrders(page) method with pagination
    - Implement getOrderById(orderId) method
    - Add proper error handling and response parsing
    - _Requirements: 3.1, 3.3, 3.5, 6.1_
  
  - [x] 7.3 Create ProfileService in api.ts
    - Implement getProfile() method
    - Implement updateProfile(data) method
    - Add proper error handling and response parsing
    - _Requirements: 5.1, 5.3, 6.1_

- [x] 8. Update CartContext for API integration
  - [x] 8.1 Add API integration state management
    - Add isLoading, error, and isSynced to CartState
    - Add setLoading, setError, and setSynced actions to reducer
    - Update reducer to handle API response data format
    - _Requirements: 1.1, 1.2, 6.5_
  
  - [x] 8.2 Implement fetchCart method
    - Check if user is authenticated
    - Call CartService.getCart() if authenticated
    - Update cart state with API response
    - Handle loading and error states
    - _Requirements: 1.2, 7.3_
  
  - [x] 8.3 Update addToCart method
    - Check if user is authenticated
    - If authenticated, call CartService.addToCart() and update state
    - If guest, use existing localStorage logic
    - Show success toast notification
    - Handle errors with rollback and error message
    - _Requirements: 1.1, 6.4_
  
  - [x] 8.4 Update removeFromCart method
    - Check if user is authenticated
    - If authenticated, call CartService.removeCartItem() and update state
    - If guest, use existing localStorage logic
    - Handle errors with rollback and error message
    - _Requirements: 1.4, 6.4_
  
  - [x] 8.5 Update updateQuantity method
    - Check if user is authenticated
    - If authenticated, call CartService.updateCartItem() and update state
    - If guest, use existing localStorage logic
    - Handle errors with rollback and error message
    - _Requirements: 1.3, 6.4_
  
  - [x] 8.6 Implement syncCart method for guest cart merge
    - Get guest cart items from localStorage
    - Call CartService.mergeGuestCart() with guest items
    - Update cart state with merged cart from API
    - Clear localStorage cart
    - Call this method in AuthContext after successful login/register
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1_
  
  - [x] 8.7 Add useEffect to fetch cart on mount
    - Check if user is authenticated on component mount
    - Call fetchCart() if authenticated
    - _Requirements: 1.2, 7.3_

- [x] 9. Update Checkout page for API integration
  - [x] 9.1 Fetch fresh cart data on page load
    - Call CartContext.fetchCart() when checkout page mounts
    - Display loading state while fetching
    - Redirect to cart page if cart is empty
    - _Requirements: 4.1, 4.2_
  
  - [x] 9.2 Implement checkout form submission
    - Validate all form fields (shipping address, payment method)
    - Call OrderService.createOrder() with form data and cart items
    - Handle loading state during submission
    - Display validation errors if API returns 422
    - On success, clear cart and redirect to order confirmation page
    - On error, display error message and allow retry
    - _Requirements: 4.3, 4.4, 4.5, 6.1, 6.2_

- [x] 10. Create Order Confirmation page
  - Create OrderConfirmation component
  - Fetch order details using orderId from URL params
  - Display order number, status, items, totals, and shipping address
  - Show success message and next steps
  - Provide link to order history page
  - _Requirements: 3.2, 4.5_

- [x] 11. Create Order History page
  - [x] 11.1 Create OrderHistory component
    - Fetch orders using OrderService.getOrders()
    - Display orders in a list with order number, date, status, total
    - Implement pagination controls
    - Show loading state while fetching
    - Display empty state if no orders
    - _Requirements: 3.3, 3.4_
  
  - [x] 11.2 Add order status badges
    - Create status badge component with color coding
    - Display appropriate badge for each order status
    - _Requirements: 3.4_
  
  - [x] 11.3 Implement order details modal or page
    - Create OrderDetails component
    - Fetch order details using OrderService.getOrderById()
    - Display complete order information with items
    - Show shipping address and payment method
    - Provide print order option
    - _Requirements: 3.5_

- [x] 12. Update Profile page for API integration
  - [x] 12.1 Fetch and display user profile
    - Call ProfileService.getProfile() on page mount
    - Display user name, email, and join date
    - Show order statistics (total orders, total spent, pending orders)
    - Display loading state while fetching
    - _Requirements: 5.1, 5.2_
  
  - [x] 12.2 Implement profile edit functionality
    - Create edit mode toggle for profile form
    - Allow editing name and email fields
    - Validate form fields before submission
    - Call ProfileService.updateProfile() on submit
    - Display success message on successful update
    - Display field-specific errors if validation fails
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [x] 12.3 Add order history section to profile
    - Display recent orders (last 5) in profile page
    - Provide "View All Orders" link to order history page
    - _Requirements: 3.3, 5.2_

- [x] 13. Implement error handling and user feedback
  - [x] 13.1 Add global error handler for API calls
    - Create error handling utility function
    - Handle 401 errors by redirecting to login
    - Handle 422 errors by parsing validation messages
    - Handle 500 errors with generic message
    - Handle network errors with connection message
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 13.2 Add toast notifications for operations
    - Install and configure toast library (react-hot-toast or sonner)
    - Show success toast when cart operations succeed
    - Show error toast when operations fail
    - Show loading toast for long-running operations
    - _Requirements: 6.4, 6.5_
  
  - [x] 13.3 Add loading indicators
    - Add spinner to cart page while fetching
    - Add button loading state during cart operations
    - Add skeleton loaders for order history
    - Add loading overlay for checkout submission
    - _Requirements: 6.5_

- [x] 14. Update authentication flow for cart sync
  - Modify login success handler in AuthContext to call CartContext.syncCart()
  - Modify register success handler in AuthContext to call CartContext.syncCart()
  - Ensure cart syncs before redirecting after login
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1_

- [x] 15. Add navigation and routing
  - Add "My Orders" link to user menu in Header
  - Add "My Profile" link to user menu in Header
  - Create routes for OrderHistory, OrderDetails, and updated Profile pages
  - Update Cart page to use new API-integrated CartContext
  - _Requirements: 3.3, 3.5, 5.1_

- [ ]* 16. Create frontend tests
  - Write unit tests for CartService, OrderService, ProfileService
  - Write integration tests for CartContext with mocked API
  - Write integration tests for checkout flow
  - Write integration tests for guest cart merge on login
  - Test error handling and retry logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 3.1, 3.3, 5.1, 6.1_

## Integration and Testing

- [ ] 17. End-to-end integration testing
  - Test complete flow: browse → add to cart → checkout → order confirmation
  - Test guest cart preservation through registration
  - Test cart synchronization across browser tabs
  - Test order history and order details viewing
  - Test profile update functionality
  - Verify cart clears after successful order
  - Test error scenarios (network failure, invalid data, expired session)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.3, 3.5, 4.4, 4.5, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_
