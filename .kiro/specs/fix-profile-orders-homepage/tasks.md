# Implementation Plan

- [x] 1. Fix BookCard component data handling
  - Verify mapApiBookToBook function handles all API response formats correctly
  - Ensure proper image URL construction with fallback to placeholder
  - Verify add to cart functionality works with normalized book data
  - Test BookCard renders correctly with both API and mock data formats
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 2. Fix Home Page (Index.tsx) book display and ordering
  - Ensure all book sections use BookCard component consistently
  - Verify books from API are normalized before passing to BookCard
  - Test add to cart works for books in all sections (New & Noteworthy, Shirdi Books, etc.)
  - Verify cart context integration and success notifications
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix Profile Page data loading and display
  - Implement parallel data fetching with Promise.all for profile, statistics, and orders
  - Add proper error handling with fallback values for missing data
  - Ensure order statistics display correctly (total orders, total spent, pending orders, average order value)
  - Verify recent orders section displays correctly with proper data
  - Add retry functionality for failed data loads
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4. Fix Order History page display
  - Verify OrderService.getOrders returns complete order data with items
  - Ensure order list displays all required information (order number, date, status, total, item count)
  - Test pagination works correctly
  - Add proper error handling and loading states
  - Verify navigation to order details works
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 5. Fix Order Details (OrderConfirmation) page
  - Ensure order items display with complete product information (name, image, quantity, price)
  - Add fallback for missing product images
  - Verify shipping information and payment method display correctly
  - Test navigation from order history to order details
  - Add error handling for invalid order IDs
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 6. Verify API service layer
  - Check ProfileService.getProfile returns complete user data
  - Check ProfileService.getProfileStatistics calculates statistics correctly
  - Check OrderService.getOrders returns orders with complete item data
  - Verify data normalization functions in api.ts
  - Test error handling and retry logic
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

- [x] 7. End-to-end testing
  - Test complete user flow: login → view profile → view orders → add books to cart from home
  - Verify all error states display correctly
  - Test with both API and mock data
  - Verify cart persistence across page navigation
  - Test responsive design on mobile and desktop
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_
