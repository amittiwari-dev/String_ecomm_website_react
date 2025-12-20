import { ApiError } from '../lib/errorHandler';

// Book interface for type safety
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  language: string;
  format: 'Hardcover' | 'Paperback' | 'eBook';
  price: number;
  currency: string;
  isbn10?: string;
  isbn13?: string;
  publication_date: string;
  pages?: number;
  stock_status: 'In Stock' | 'Out of Stock' | 'Preorder';
  images: string[];
  authors: Array<{
    id: string;
    name: string;
    slug: string;
    bio: string;
  }>;
  series?: string;
  category_id: string;
  tags: string[];
  bestseller_rank?: number;
  is_latest_release: boolean;
  rating?: number;
}

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper function to normalize API book data to our Book interface
const normalizeApiBookToBook = (apiBook: any): Book => {
  // Handle image URL - check if it's a full URL or just filename
  let cover = '/img/book-categori/book-placeholder.png';
  
  if (apiBook.product_image) {
    // If product_image is already a full URL, use it as is
    if (apiBook.product_image.startsWith('http://') || apiBook.product_image.startsWith('https://')) {
      cover = apiBook.product_image;
    } else {
      // Otherwise, construct the URL based on environment
      const isLocal = API_BASE_URL?.includes('localhost') || API_BASE_URL?.includes('127.0.0.1');
      
      if (isLocal) {
        // Local development - Laravel storage path
        cover = `http://127.0.0.1:8000/storage/products/${apiBook.product_image}`;
      } else {
        // Production
        cover = `https://sterlingpublishers.in/publishing/images/products/${apiBook.product_image}`;
      }
    }
  }

  return {
    id: apiBook.id?.toString() || '0',
    title: apiBook.product_name || 'Untitled',
    slug: apiBook.product_slug || apiBook.id?.toString() || '0',
    description: apiBook.product_description || '',
    language: 'English',
    format: apiBook.paperback_type || 'Paperback',
    price: Number(apiBook.price) || 0,
    currency: 'INR',
    isbn10: apiBook.product_isbn || undefined,
    publication_date: new Date().toISOString(),
    pages: apiBook.total_pages || undefined,
    stock_status: apiBook.is_active === 1 ? 'In Stock' : 'Out of Stock',
    images: [cover],
    authors: [
      {
        id: apiBook.author_id?.toString() || '0',
        name: apiBook.author_name || 'Unknown',
        slug: (apiBook.author_name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
        bio: ''
      }
    ],
    category_id: apiBook.category?.id?.toString() || '0',
    tags: [],
    is_latest_release: !!apiBook.is_latest_release,
    rating: undefined,
  } as Book;
};

// Import authenticatedFetch for global 401 handling
import { authenticatedFetch } from '../lib/auth';
import { fetchWithErrorHandling, RetryConfig } from '../lib/errorHandler';

// Interface for API responses
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// Cart Service Types
export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    title: string;
    price: number;
    images: string[];
    authors: Array<{ name: string }>;
  };
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
}

// Order Service Types
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
  product_image: string;
  book?: {
    category: string;
  };
}

export interface OrderData {
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  payment_method: string;
}

export interface OrderResponse {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  payment_method: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedOrders {
  data: OrderResponse[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Profile Service Types
export interface ProfileData {
  name: string;
  email: string;
}

export interface ProfileResponse extends User {
  total_orders?: number;
  total_spent?: number;
  pending_orders?: number;
  created_at?: string;
  average_order_value?: number;
  member_since?: string;
  favorite_categories?: string[];
  last_order_date?: string;
}

export interface ProfileStatistics {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  averageOrderValue: number;
  memberSince: string;
  favoriteCategories: string[];
  lastOrderDate?: string;
}

/**
 * Helper function to handle API responses with consistent error handling
 */
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  let responseData;
  
  try {
    responseData = await response.json();
  } catch (parseError) {
    // If JSON parsing fails, create a generic error response
    responseData = { 
      message: response.ok ? 'Invalid response format' : `HTTP ${response.status}: ${response.statusText}` 
    };
  }

  if (!response.ok) {
    throw new ApiError(
      responseData.message || `Request failed with status ${response.status}`,
      response.status,
      responseData.errors
    );
  }

  return responseData;
};

/**
 * Enhanced authenticated fetch with retry logic
 */
const authenticatedFetchWithRetry = async <T>(
  url: string,
  options: RequestInit = {},
  retryConfig?: Partial<RetryConfig>
): Promise<T> => {
  return fetchWithErrorHandling<T>(url, options, {
    maxRetries: 2, // Fewer retries for authenticated requests
    baseDelay: 1000,
    maxDelay: 5000,
    retryCondition: (error) => {
      // Don't retry auth errors or client errors except rate limiting
      if (error instanceof ApiError) {
        return error.status >= 500 || error.status === 429;
      }
      return error instanceof TypeError && error.message.includes('fetch');
    },
    ...retryConfig
  });
};

// Enhanced Book Service Types
export interface BookFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  sortBy?: 'price' | 'title' | 'rating' | 'date';
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface PaginatedBooks {
  data: Book[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Book Service
export const BookService = {
  // Get all books with optional filters
  getAllBooks: async (filters?: BookFilters): Promise<ApiResponse<Book[]>> => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.subcategory) params.append('subcategory', filters.subcategory);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sort', filters.sortBy);
      if (filters?.order) params.append('order', filters.order);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.per_page) params.append('per_page', filters.per_page.toString());

      // Call enhanced products API endpoint
      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
      const data = await response.json();
      
      if (data.status === 200 && data.data) {
        // Convert API books to our Book format
        const books: Book[] = data.data.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        
        return {
          data: books,
          status: 200,
        };
      }
      
      // Fallback to existing endpoint if new one doesn't exist yet
      const fallbackResponse = await fetch(`${API_BASE_URL}/new-books`);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.status === 200 && fallbackData.records) {
        // Convert API books to our Book format
        const books: Book[] = fallbackData.records.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        
        // Apply filters client-side for fallback
        let filteredBooks = [...books];
        
        if (filters) {
          if (filters.category) {
            filteredBooks = filteredBooks.filter(book => book.category_id === filters.category);
          }

          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredBooks = filteredBooks.filter(book =>
              book.title.toLowerCase().includes(searchLower) ||
              book.description.toLowerCase().includes(searchLower) ||
              book.authors.some(author => author.name.toLowerCase().includes(searchLower))
            );
          }

          if (filters.sortBy) {
            filteredBooks.sort((a, b) => {
              let comparison = 0;
              switch (filters.sortBy) {
                case 'price':
                  comparison = a.price - b.price;
                  break;
                case 'title':
                  comparison = a.title.localeCompare(b.title);
                  break;
                case 'rating':
                  comparison = (b.rating || 0) - (a.rating || 0);
                  break;
                case 'date':
                  comparison = new Date(a.publication_date).getTime() - new Date(b.publication_date).getTime();
                  break;
              }
              return filters.order === 'desc' ? -comparison : comparison;
            });
          }
        }

        return {
          data: filteredBooks,
          status: 200,
        };
      }
      
      return {
        data: [],
        status: 200,
      };
    } catch (error) {
      console.error('Failed to fetch books:', error);
      throw new ApiError('Failed to fetch books', 500);
    }
  },

  // Get a single book by ID (frontend should always send numeric/string id)
  getBookById: async (id: string): Promise<ApiResponse<Book | null>> => {
    console.log('Fetching book with ID:', id);
    
    try {
      // Try to get single product from API first
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      const data = await response.json();
      
      if (data.status === 200 && data.data) {
        const book = normalizeApiBookToBook(data.data);
        return {
          data: book,
          status: 200
        };
      }
      
      // Fallback to searching all books
      const allBooksResponse = await BookService.getAllBooks();
      const book = allBooksResponse.data.find(book => book.id === id);
      
      if (!book) {
        console.error(`Book with ID "${id}" not found`);
        throw new ApiError('Book not found', 404);
      }

      return {
        data: book,
        status: 200
      };
    } catch (error) {
      console.error('Failed to fetch book:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch book', 500);
    }
  },

  // Get featured books for homepage
  getFeaturedBooks: async (): Promise<ApiResponse<Book[]>> => {
    try {
      // Try to get featured products from API first
      const response = await fetch(`${API_BASE_URL}/products?featured=true&per_page=8`);
      const data = await response.json();
      
      if (data.status === 200 && data.data) {
        const books: Book[] = data.data.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        return {
          data: books,
          status: 200
        };
      }
      
      // Fallback to Shirdi Sai Baba books as featured
      const fallbackResponse = await fetch(`${API_BASE_URL}/shirdi-sai-baba`);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.status === 200 && fallbackData.records) {
        const books: Book[] = fallbackData.records.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        return {
          data: books,
          status: 200
        };
      }
      
      return {
        data: [],
        status: 200
      };
    } catch (error) {
      console.error('Failed to fetch featured books:', error);
      throw new ApiError('Failed to fetch featured books', 500);
    }
  },

  // Get products for homepage featured section
  getFeaturedProducts: async (): Promise<ApiResponse<Book[]>> => {
    return BookService.getFeaturedBooks();
  },

  // Get new releases
  getNewReleases: async (): Promise<ApiResponse<Book[]>> => {
    try {
      // Try enhanced products API first
      const response = await fetch(`${API_BASE_URL}/products?sort=date&order=desc&per_page=8`);
      const data = await response.json();
      
      if (data.status === 200 && data.data) {
        const books: Book[] = data.data.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        return {
          data: books,
          status: 200
        };
      }
      
      // Fallback to existing endpoint
      const fallbackResponse = await fetch(`${API_BASE_URL}/new-books`);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.status === 200 && fallbackData.records) {
        const books: Book[] = fallbackData.records.map((apiBook: any) => normalizeApiBookToBook(apiBook)).slice(0, 8);
        return {
          data: books,
          status: 200
        };
      }
      
      return {
        data: [],
        status: 200
      };
    } catch (error) {
      console.error('Failed to fetch new releases:', error);
      throw new ApiError('Failed to fetch new releases', 500);
    }
  },

  // Get related books by ID
  getRelatedBooks: async (id: string): Promise<ApiResponse<Book[]>> => {
    try {
      // Try to get related products from API first
      const response = await fetch(`${API_BASE_URL}/products/${id}/related`);
      const data = await response.json();
      
      if (data.status === 200 && data.data) {
        const books: Book[] = data.data.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        return {
          data: books,
          status: 200
        };
      }
      
      // Fallback: get the book first, then find related books
      const bookResponse = await BookService.getBookById(id);
      if (!bookResponse.data) {
        throw new ApiError('Book not found', 404);
      }
      
      const book = bookResponse.data;
      
      // Get books from same category
      const categoryBooksResponse = await BookService.getProductsByCategory(book.category_id, 1, 5);
      let relatedBooks = categoryBooksResponse.data.filter(b => b.id !== book.id).slice(0, 4);
      
      // If we don't have enough related books, get some featured books
      if (relatedBooks.length < 4) {
        const featuredResponse = await BookService.getFeaturedBooks();
        const additionalBooks = featuredResponse.data
          .filter(b => b.id !== book.id && !relatedBooks.some(rb => rb.id === b.id))
          .slice(0, 4 - relatedBooks.length);
        
        relatedBooks = [...relatedBooks, ...additionalBooks];
      }

      return {
        data: relatedBooks,
        status: 200
      };
    } catch (error) {
      console.error('Failed to fetch related books:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch related books', 500);
    }
  },

  // Search books with query and filters
  searchBooks: async (query: string, filters?: Omit<BookFilters, 'search'>): Promise<ApiResponse<Book[]>> => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('search', query);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.subcategory) params.append('subcategory', filters.subcategory);
      if (filters?.sortBy) params.append('sort', filters.sortBy);
      if (filters?.order) params.append('order', filters.order);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.per_page) params.append('per_page', filters.per_page.toString());

      // Try enhanced search API first
      const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
      const data = await response.json();
      
      if (data.status === 200 && data.data) {
        const books: Book[] = data.data.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        return {
          data: books,
          status: 200
        };
      }
      
      // Fallback to client-side search using getAllBooks
      const allBooksResponse = await BookService.getAllBooks({
        ...filters,
        search: query
      });
      
      return allBooksResponse;
    } catch (error) {
      console.error('Failed to search books:', error);
      throw new ApiError('Failed to search books', 500);
    }
  },

  // Get products by category with pagination
  getProductsByCategory: async (
    categorySlug: string, 
    page: number = 1, 
    perPage: number = 20
  ): Promise<ApiResponse<Book[]>> => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('category', categorySlug);
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      // Try enhanced products API first
      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
      const data = await response.json();
      
      if (data.status === 200 && data.data) {
        const books: Book[] = data.data.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        return {
          data: books,
          status: 200
        };
      }
      
      // Fallback to category-wise endpoint
      const fallbackResponse = await fetch(`${API_BASE_URL}/category-wise`);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.status === 200 && fallbackData.records) {
        // Filter by category and apply pagination
        const allBooks: Book[] = fallbackData.records.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        const categoryBooks = allBooks.filter(book => 
          book.category_id === categorySlug || 
          book.slug?.includes(categorySlug.toLowerCase())
        );
        
        // Apply pagination
        const startIndex = (page - 1) * perPage;
        const paginatedBooks = categoryBooks.slice(startIndex, startIndex + perPage);
        
        return {
          data: paginatedBooks,
          status: 200
        };
      }
      
      return {
        data: [],
        status: 200
      };
    } catch (error) {
      console.error('Failed to fetch products by category:', error);
      throw new ApiError('Failed to fetch products by category', 500);
    }
  }
};

// Cart Service
export const CartService = {
  // Get current user's cart
  getCart: async (token: string): Promise<Cart> => {
    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/cart`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    // Handle your live server response format
    return data.cart || data;
  },

  // Add item to cart
  addToCart: async (token: string, productId: string, quantity: number): Promise<Cart> => {
    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        quantity,
      }),
    }, {
      maxRetries: 1, // Don't retry cart additions multiple times
    });

    // Handle your live server response format
    return data.cart || data;
  },

  // Update cart item quantity
  updateCartItem: async (token: string, itemId: string, quantity: number): Promise<Cart> => {
    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/cart/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    }, {
      maxRetries: 1, // Don't retry cart updates multiple times
    });

    return data.cart || data;
  },

  // Remove item from cart
  removeCartItem: async (token: string, itemId: string): Promise<Cart> => {
    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/cart/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }, {
      maxRetries: 1, // Don't retry cart removals multiple times
    });

    return data.cart || data;
  },

  // Clear cart (remove all items)
  clearCart: async (token: string): Promise<void> => {
    try {
      await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/cart/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }, {
        maxRetries: 1,
        retryCondition: (error) => {
          // Don't retry on 404 (cart already empty)
          return error instanceof ApiError && error.status !== 404 && error.status >= 500;
        }
      });
    } catch (error) {
      // Ignore 404 errors (cart already empty)
      if (error instanceof ApiError && error.status === 404) {
        return;
      }
      throw error;
    }
  },

  // Merge guest cart with user cart
  mergeGuestCart: async (token: string, items: GuestCartItem[]): Promise<Cart> => {
    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        id: '1',
        user_id: '1',
        items: [],
        subtotal: 0,
        tax: 0,
        shipping_cost: 0,
        total: 0
      };
    }

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}cart/merge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ items }),
    }, {
      maxRetries: 1, // Don't retry cart merges multiple times
    });

    return data.cart || data;
  },
};

// Order Statistics Types
export interface OrderStatistics {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  averageOrderValue: number;
  recentOrders: OrderResponse[];
  monthlySpending: Array<{ month: string; amount: number }>;
}

// Retry configuration for different types of operations
const ORDER_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 2,
  baseDelay: 1500,
  maxDelay: 8000,
};

const READ_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
};

// Order Service
export const OrderService = {
  // Create a new order
  createOrder: async (token: string, orderData: OrderData): Promise<OrderResponse> => {
    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderData),
    }, ORDER_RETRY_CONFIG);

    // Handle your live server response format
    if (data.message === 'Order created successfully' || data.order) {
      return data.order || data;
    }
    
    throw new ApiError(data.message || 'Failed to create order', 400);
  },

  // Get user's orders with pagination and optional filters
  getOrders: async (
    token: string, 
    page: number = 1,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    }
  ): Promise<PaginatedOrders> => {
    const params = new URLSearchParams({ page: page.toString() });
    
    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
    }

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/orders?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }, READ_RETRY_CONFIG);

    // Normalize order data - ensure product images have full URLs
    const base = 'https://sterlingpublishers.in/publishing';
    const normalizedData = {
      ...data,
      data: data.data.map((order: any) => ({
        ...order,
        items: order.items?.map((item: any) => ({
          ...item,
          product_image: item.product_image 
            ? (item.product_image.startsWith('http') 
                ? item.product_image 
                : `${base}/images/products/${item.product_image}`)
            : '/img/book-categori/01.png'
        })) || []
      }))
    };

    return normalizedData;
  },

  // Get specific order by ID
  getOrderById: async (token: string, orderId: string): Promise<OrderResponse> => {
    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }, READ_RETRY_CONFIG);

    // Handle your live server response format and normalize image URLs
    const order = data.order || data;
    const base = 'https://sterlingpublishers.in/publishing';
    
    // Normalize product images in order items
    if (order.items) {
      order.items = order.items.map((item: any) => {
        // Use product_image from the item first, then fall back to product.product_image
        let imageUrl = item.product_image || item.product?.product_image;
        
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${base}/images/products/${imageUrl}`;
        } else if (!imageUrl) {
          imageUrl = '/img/book-categori/01.png';
        }
        
        return {
          ...item,
          product_image: imageUrl,
          product_name: item.product_name || item.product?.product_name || 'Unknown Product'
        };
      });
    }

    return order;
  },

  // Get order statistics
  getOrderStatistics: async (token: string): Promise<OrderStatistics> => {
    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        totalOrders: 2,
        totalSpent: 2148.00,
        pendingOrders: 1,
        averageOrderValue: 1074.00,
        recentOrders: [],
        monthlySpending: [
          { month: 'Jan 2024', amount: 2148.00 }
        ]
      };
    }

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}orders/statistics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }, READ_RETRY_CONFIG);

    return data.statistics || data;
  },
};

// Profile Service
export const ProfileService = {
  // Get user profile with statistics
  getProfile: async (token: string): Promise<ProfileResponse> => {
    if (!token) {
      throw new ApiError('Authentication required. Please log in to view your profile.', 401);
    }

    try {
      // Get user profile from profile endpoint
      const userData = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }, READ_RETRY_CONFIG);

      const user = userData.user || userData;

      // Get orders to calculate statistics
      let orderStats = {
        total_orders: 0,
        total_spent: 0,
        pending_orders: 0,
        average_order_value: 0,
        favorite_categories: [],
        last_order_date: null
      };

      try {
        const ordersData = await OrderService.getOrders(token, 1);
        if (ordersData.data && ordersData.data.length > 0) {
          orderStats.total_orders = ordersData.total || ordersData.data.length;
          orderStats.total_spent = ordersData.data.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
          orderStats.pending_orders = ordersData.data.filter((order: any) => order.status === 'pending').length;
          orderStats.average_order_value = orderStats.total_orders > 0 ? orderStats.total_spent / orderStats.total_orders : 0;
          orderStats.last_order_date = ordersData.data[0]?.created_at;
          
          // Calculate favorite categories from order items
          const categoryCount: Record<string, number> = {};
          ordersData.data.forEach((order: any) => {
            order.items?.forEach((item: any) => {
              if (item.product?.category?.name) {
                const categoryName = item.product.category.name;
                categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
              }
            });
          });
          
          orderStats.favorite_categories = Object.entries(categoryCount)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([category]) => category);
        }
      } catch (error) {
        console.warn('Failed to fetch order statistics:', error);
      }

      // Enhance profile with calculated statistics
      const enhancedProfile = {
        id: user.id?.toString() || '0',
        name: user.name || 'Unknown User',
        email: user.email || '',
        created_at: user.created_at || new Date().toISOString(),
        ...orderStats,
        member_since: user.created_at || new Date().toISOString(),
      };

      return enhancedProfile;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (token: string, data: ProfileData): Promise<ProfileResponse> => {
    if (!token) {
      throw new ApiError('Authentication required. Please log in to update your profile.', 401);
    }

    // Client-side validation
    const validationErrors: Record<string, string[]> = {};
    if (!data.name?.trim()) {
      validationErrors.name = ['Name is required'];
    }
    if (!data.email?.trim()) {
      validationErrors.email = ['Email is required'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      validationErrors.email = ['Please enter a valid email address'];
    }

    if (Object.keys(validationErrors).length > 0) {
      throw new ApiError('Please check your input and correct any errors.', 422, validationErrors);
    }

    try {
      // For now, since there's no profile update endpoint, we'll simulate success
      // In a real implementation, you would call the actual profile update API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return updated profile by fetching it again
      return await ProfileService.getProfile(token);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Get profile statistics
  getProfileStatistics: async (token: string): Promise<ProfileStatistics> => {
    if (!token) {
      throw new ApiError('Authentication required. Please log in to view statistics.', 401);
    }

    try {
      // Fetch profile and orders in parallel with individual error handling
      const [profileResult, ordersResult] = await Promise.allSettled([
        ProfileService.getProfile(token),
        OrderService.getOrders(token, 1)
      ]);

      // Get profile data or use defaults
      const profile = profileResult.status === 'fulfilled' 
        ? profileResult.value 
        : null;

      // Get orders data or use empty array
      const orders = ordersResult.status === 'fulfilled' 
        ? ordersResult.value 
        : { data: [] };
      
      // Calculate favorite categories from order history
      const categoryCount: Record<string, number> = {};
      if (orders.data && orders.data.length > 0) {
        orders.data.forEach(order => {
          order.items?.forEach(item => {
            if (item.book?.category) {
              categoryCount[item.book.category] = (categoryCount[item.book.category] || 0) + 1;
            }
          });
        });
      }

      const favoriteCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      const lastOrderDate = orders.data && orders.data.length > 0 
        ? orders.data[0].created_at 
        : undefined;

      // Return statistics with fallback values
      return {
        totalOrders: profile?.total_orders ?? 0,
        totalSpent: profile?.total_spent ?? 0,
        pendingOrders: profile?.pending_orders ?? 0,
        averageOrderValue: profile?.average_order_value ?? 0,
        memberSince: profile?.member_since ?? profile?.created_at ?? new Date().toISOString(),
        favoriteCategories,
        lastOrderDate,
      };
    } catch (error) {
      console.error('Failed to load profile statistics:', error);
      
      // Return default statistics instead of throwing
      return {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        averageOrderValue: 0,
        memberSince: new Date().toISOString(),
        favoriteCategories: [],
        lastOrderDate: undefined,
      };
    }
  },
};

// Search Service
export const SearchService = {
  searchBooks: async (query: string, filters?: Omit<BookFilters, 'search'>): Promise<ApiResponse<Book[]>> => {
    // Use the enhanced BookService.searchBooks method
    return BookService.searchBooks(query, filters);
  }
};

// Authentication Service
export const AuthService = {
  // Register a new user
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
    }, {
      maxRetries: 1, // Don't retry registration multiple times
    });

    // Handle your live server response format
    if (response.status === 200) {
      // For registration, we need to login after successful registration
      return await AuthService.login({ email: data.email, password: data.password });
    }
    
    throw new ApiError(response.msg || 'Registration failed', 400);
  },

  // Login an existing user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      }, {
        maxRetries: 1, // Don't retry login multiple times
        retryCondition: (error) => {
          // Only retry on server errors, not auth failures
          return error instanceof ApiError && error.status >= 500;
        }
      });

      // Handle your live server response format
      if (response.status === 200) {
        return {
          user: {
            id: response.user.id.toString(),
            name: response.user.name,
            email: response.user.email,
          },
          token: response.token,
          message: response.message
        };
      }
      
      throw new ApiError(response.message || 'Login failed', response.status || 401);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Customize 401 error message for login
        throw new ApiError('Invalid email or password', 401);
      }
      throw error;
    }
  },

  // Logout the current user
  logout: async (token: string): Promise<void> => {
    try {
      await authenticatedFetchWithRetry<any>(`${API_BASE_URL}auth/logout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      }, {
        maxRetries: 1,
        retryCondition: (error) => {
          // Don't retry on 401 (token expired) - that's acceptable for logout
          return error instanceof ApiError && error.status !== 401 && error.status >= 500;
        }
      });
    } catch (error) {
      // Logout should not throw errors to the user
      // Even if the API call fails, we'll clear local state
      console.warn('Logout error (non-critical):', error);
    }
  },

  // Get current authenticated user
  getCurrentUser: async (token: string): Promise<User> => {
    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    }, READ_RETRY_CONFIG);

    return data.user || data;
  },
};
