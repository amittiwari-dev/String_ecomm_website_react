# Sterling Publishers E-commerce API Documentation

## Base URL
```
https://api.sterlingpublishers.com/v1
```

## Authentication
All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## API Endpoints

### Books

#### Get All Books
- **GET** `/books`
- **Query Parameters:**
  - `category` (string, optional): Filter by category ID
  - `search` (string, optional): Search in title, description, or author name
  - `sortBy` (string, optional): 'price' | 'title' | 'rating'
  - `order` (string, optional): 'asc' | 'desc'
- **Response Format:**
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "subtitle": "string",
      "slug": "string",
      "description": "string",
      "language": "string",
      "format": "Hardcover" | "Paperback" | "eBook",
      "price": number,
      "currency": "string",
      "isbn10": "string",
      "isbn13": "string",
      "publication_date": "string",
      "pages": number,
      "stock_status": "In Stock" | "Out of Stock" | "Preorder",
      "images": ["string"],
      "authors": [
        {
          "id": "string",
          "name": "string",
          "slug": "string",
          "photo_url": "string",
          "bio": "string"
        }
      ],
      "category_id": "string",
      "tags": ["string"],
      "bestseller_rank": number,
      "is_latest_release": boolean,
      "rating": number
    }
  ],
  "status": number,
  "message": "string"
}
```

#### Get Book by ID/Slug
- **GET** `/books/:idOrSlug`
- **Response:** Same as single book object from above

#### Get Related Books
- **GET** `/books/:idOrSlug/related`
- **Response:** Array of book objects

### Cart

#### Get Cart Items
- **GET** `/cart`
- **Response Format:**
```json
{
  "data": {
    "items": [
      {
        "book": {/* book object */},
        "quantity": number
      }
    ],
    "total": number
  }
}
```

#### Add to Cart
- **POST** `/cart/add`
- **Request Body:**
```json
{
  "bookId": "string",
  "quantity": number
}
```

#### Update Cart Item
- **PUT** `/cart/update/:bookId`
- **Request Body:**
```json
{
  "quantity": number
}
```

#### Remove from Cart
- **DELETE** `/cart/remove/:bookId`

#### Clear Cart
- **DELETE** `/cart/clear`

### Orders

#### Place Order
- **POST** `/orders`
- **Request Body:**
```json
{
  "items": [
    {
      "bookId": "string",
      "quantity": number
    }
  ],
  "shippingAddress": {
    "fullName": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "paymentMethod": "string"
}
```
- **Response:**
```json
{
  "data": {
    "id": "string",
    "status": "pending" | "processing" | "shipped" | "delivered",
    "total": number,
    "createdAt": "string",
    /* ... other order details ... */
  }
}
```

#### Get Order Details
- **GET** `/orders/:orderId`

#### Get User Orders
- **GET** `/orders`

### Categories

#### Get All Categories
- **GET** `/categories`
- **Response Format:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "parent_id": "string" | null,
      "code": "string",
      "sort_order": number
    }
  ]
}
```

## Example Data Structure for Development

When developing the frontend before the backend is ready, you can use the following data structure in your mock service:

1. Create a `mockData.ts` file with interfaces and mock data:
```typescript
// Interfaces
interface Book { /* ... */ }
interface Author { /* ... */ }
interface Category { /* ... */ }

// Mock data
export const books: Book[] = [/* ... */];
export const authors: Author[] = [/* ... */];
export const categories: Category[] = [/* ... */];
```

2. Create an API service that mimics real API calls:
```typescript
// api.ts
export const BookService = {
  getAllBooks: async (filters?) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    // Filter and return mock data
  },
  
  getBookById: async (id) => {
    // Find and return book from mock data
  },
  
  // ... other methods
};
```

3. Implement proper error handling and loading states in components:
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await BookService.getAllBooks();
      // Handle response
    } catch (err) {
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

## Error Handling
All API endpoints follow this error response format:
```json
{
  "status": number,
  "message": "string",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error