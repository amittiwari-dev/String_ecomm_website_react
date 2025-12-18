# Design Document

## Overview

This design addresses three interconnected issues in the Sterling Publishers application by ensuring consistent data handling, proper component integration, and reliable API communication across the profile, order history, and home page features.

## Architecture

### Component Structure

```
Pages
├── MyProfile.tsx (Profile display and statistics)
├── OrderHistory.tsx (Order list with pagination)
├── OrderConfirmation.tsx (Order details view)
└── Index.tsx (Home page with book displays)

Components
├── BookCard.tsx (Reusable book display component)
└── UI Components (Skeletons, error states)

Services
├── api.ts (API service layer)
└── ProfileService, OrderService (Specialized services)

Context
├── AuthContext.tsx (Authentication state)
└── CartContext.tsx (Shopping cart state)
```

### Data Flow

1. **Profile Page Flow**
   - User navigates to /my-profile
   - ProfileService.getProfile() fetches user data
   - ProfileService.getProfileStatistics() fetches order stats
   - OrderService.getOrders() fetches recent orders
   - Data is displayed with proper error handling

2. **Order History Flow**
   - User navigates to /order-history
   - OrderService.getOrders() fetches paginated orders
   - Each order displays summary information
   - Click on order navigates to order details

3. **Home Page Flow**
   - Index.tsx fetches books from API
   - Books are normalized to internal format
   - BookCard component renders each book
   - Add to cart button uses CartContext

## Components and Interfaces

### 1. Profile Page Enhancement

**Current Issues:**
- Profile statistics may not load correctly
- Error handling could be improved
- Recent orders display may fail

**Design Solution:**
- Implement parallel data fetching with Promise.all
- Add comprehensive error boundaries
- Provide fallback values for missing data
- Enhance loading states

**Key Changes:**
```typescript
// Fetch all data in parallel
const [profileData, statisticsData, ordersData] = await Promise.all([
  ProfileService.getProfile(token),
  ProfileService.getProfileStatistics(token),
  OrderService.getOrders(token, 1).catch(() => ({ data: [] }))
]);

// Provide fallback values
const stats = {
  totalOrders: statisticsData?.totalOrders || 0,
  totalSpent: statisticsData?.totalSpent || 0,
  // ... other fields with defaults
};
```

### 2. Order History and Details

**Current Issues:**
- Order items may not display product information
- Navigation between order list and details unclear
- Missing product images and details

**Design Solution:**
- Ensure OrderService returns complete order data with items
- Add proper navigation state passing
- Display product information from order items
- Handle missing product data gracefully

**Key Changes:**
```typescript
// Order item structure
interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
}

// Display order items with product info
{order.items.map(item => (
  <div key={item.id}>
    <img src={item.product_image || '/img/book-categori/01.png'} />
    <h4>{item.product_name}</h4>
    <p>Qty: {item.quantity} × ₹{item.price}</p>
  </div>
))}
```

### 3. Home Page Book Ordering

**Current Issues:**
- Books displayed on home page may not use BookCard component
- API data format inconsistency
- Add to cart functionality may not work

**Design Solution:**
- Ensure all book displays use BookCard component
- Implement data normalization function
- Verify cart integration works correctly

**Key Changes:**
```typescript
// Data normalization
const mapApiBookToBook = (apiBook: any): Book => {
  return {
    id: apiBook.id?.toString() || '0',
    title: apiBook.product_name || 'Untitled',
    slug: apiBook.product_slug || apiBook.id?.toString(),
    price: Number(apiBook.price) || 0,
    images: [apiBook.product_image ? 
      `${API_BASE}/images/products/${apiBook.product_image}` : 
      '/img/book-categori/01.png'],
    authors: [{
      id: apiBook.author_id?.toString() || '0',
      name: apiBook.author_name || 'Unknown',
      slug: (apiBook.author_name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
      bio: ''
    }],
    // ... other required fields
  };
};

// Use BookCard consistently
{books.map(book => (
  <BookCard key={book.id} book={mapApiBookToBook(book)} />
))}
```

## Data Models

### Book Interface (Internal Format)
```typescript
interface Book {
  id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  format: 'Hardcover' | 'Paperback' | 'eBook';
  price: number;
  currency: string;
  images: string[];
  authors: Author[];
  category_id: string;
  stock_status: string;
  is_latest_release: boolean;
}
```

### API Book Format
```typescript
interface ApiBook {
  id: number;
  product_name: string;
  product_slug: string;
  product_description: string;
  product_image: string;
  price: string;
  author_name: string;
  author_id: number;
  category: { id: string; category_name: string };
  is_active: number;
}
```

### Order Response
```typescript
interface OrderResponse {
  id: string;
  order_number: string;
  status: string;
  total: number;
  items: OrderItem[];
  shipping_name: string;
  shipping_address: string;
  created_at: string;
}
```

## Error Handling

### Profile Page Errors
1. **Authentication Errors**: Redirect to login
2. **Network Errors**: Show retry button
3. **Partial Data Failures**: Display available data with warnings
4. **Missing Statistics**: Show zeros instead of errors

### Order History Errors
1. **Empty Order List**: Show "No orders yet" message
2. **Failed Order Fetch**: Display error with retry
3. **Missing Order Items**: Show order summary only
4. **Invalid Order ID**: Redirect to order history

### Home Page Errors
1. **Failed Book Fetch**: Fall back to mock data
2. **Invalid Book Data**: Skip invalid books
3. **Cart Addition Failure**: Show error toast
4. **Missing Images**: Use placeholder images

## Testing Strategy

### Unit Tests
- Test data normalization functions
- Test error handling logic
- Test component rendering with various data states

### Integration Tests
- Test profile page data loading
- Test order history pagination
- Test add to cart from home page
- Test navigation between pages

### Manual Testing Checklist
1. ✓ Profile page loads with all statistics
2. ✓ Order history displays all orders
3. ✓ Order details show complete information
4. ✓ Home page books can be added to cart
5. ✓ Error states display correctly
6. ✓ Loading states work properly
7. ✓ Navigation between pages works
8. ✓ Cart updates reflect immediately

## Implementation Notes

### Priority Order
1. Fix BookCard component and data normalization (affects all pages)
2. Fix profile page data loading
3. Fix order history and details display
4. Verify home page integration

### Key Files to Modify
- `my-react-app/src/components/BookCard.tsx` - Ensure proper data handling
- `my-react-app/src/pages/Index.tsx` - Use BookCard consistently
- `my-react-app/src/pages/MyProfile.tsx` - Improve data loading
- `my-react-app/src/pages/OrderHistory.tsx` - Fix order display
- `my-react-app/src/pages/OrderConfirmation.tsx` - Show order details
- `my-react-app/src/services/api.ts` - Ensure proper API responses

### Backward Compatibility
- Maintain existing API contracts
- Support both API and mock data formats
- Preserve existing component props
- Keep URL structure unchanged
