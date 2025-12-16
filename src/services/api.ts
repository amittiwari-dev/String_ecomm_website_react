import { Book, books } from '../data/mockData';
import { ApiError } from '../lib/errorHandler';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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

// Book Service
export const BookService = {
  // Get all books with optional filters
  getAllBooks: async (filters?: {
    category?: string;
    search?: string;
    sortBy?: 'price' | 'title' | 'rating';
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<Book[]>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

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
          }
          return filters.order === 'desc' ? -comparison : comparison;
        });
      }
    }

    return {
      data: filteredBooks,
      status: 200,
    };
  },

  // Get a single book by ID (frontend should always send numeric/string id)
  getBookById: async (id: string): Promise<ApiResponse<Book | null>> => {
    console.log('Fetching book with ID:', id);
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200)); // Realistic delay
    const book = books.find(book => book.id === id);
    
    if (!book) {
      console.error(`Book with ID "${id}" not found`);
      return {
        data: null,
        status: 404,
        message: 'Book not found'
      };
    }

    // Ensure all required fields are present
    if (!book.images || book.images.length === 0) {
      book.images = ['/img/book-categori/book-placeholder.png'];
    }

    return {
      data: book,
      status: 200
    };
  },

  // Get featured books
  getFeaturedBooks: async (): Promise<ApiResponse<Book[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const featuredBooks = books
      .filter(book => book.bestseller_rank !== undefined)
      .sort((a, b) => (a.bestseller_rank || 0) - (b.bestseller_rank || 0))
      .slice(0, 6);

    return {
      data: featuredBooks,
      status: 200
    };
  },

  // Get new releases
  getNewReleases: async (): Promise<ApiResponse<Book[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newReleases = books
      .filter(book => book.is_latest_release)
      .slice(0, 8);

    return {
      data: newReleases,
      status: 200
    };
  },

  // Get related books by ID
  getRelatedBooks: async (id: string): Promise<ApiResponse<Book[]>> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200)); // Realistic delay
    const book = books.find(book => book.id === id);
    if (!book) {
      console.error(`Cannot find related books - book with ID "${id}" not found`);
      return {
        data: [],
        status: 404,
        message: 'Book not found'
      };
    }

    // First try to find books in same category
    let relatedBooks = books
      .filter(b => b.id !== book.id && b.category_id === book.category_id)
      .slice(0, 4);
    
    // If we don't have enough related books, add some bestsellers
    if (relatedBooks.length < 4) {
      const additionalBooks = books
        .filter(b => b.id !== book.id && b.category_id !== book.category_id && b.bestseller_rank !== undefined)
        .sort((a, b) => (a.bestseller_rank || 0) - (b.bestseller_rank || 0))
        .slice(0, 4 - relatedBooks.length);
      
      relatedBooks = [...relatedBooks, ...additionalBooks];
    }

    // Ensure images for all related books
    relatedBooks = relatedBooks.map(book => ({
      ...book,
      images: book.images?.length > 0 ? book.images : ['/img/book-categori/book-placeholder.png']
    }));

    return {
      data: relatedBooks,
      status: 200
    };
  }
};

// Cart Service
export const CartService = {
  // Get current user's cart
  getCart: async (token: string): Promise<Cart> => {
    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
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

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}cart`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    return data.cart || data;
  },

  // Add item to cart
  addToCart: async (token: string, productId: string, quantity: number): Promise<Cart> => {
    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
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

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}cart`, {
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

    return data.cart || data;
  },

  // Update cart item quantity
  updateCartItem: async (token: string, itemId: string, quantity: number): Promise<Cart> => {
    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 250));
      
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

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}cart/${itemId}`, {
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
    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
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

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}cart/${itemId}`, {
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
      await authenticatedFetchWithRetry<any>(`${API_BASE_URL}cart/clear`, {
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
    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate order processing
      
      const orderId = Date.now().toString();
      return {
        id: orderId,
        order_number: `ORD-2024-${orderId.slice(-3)}`,
        user_id: '1',
        status: 'pending',
        total: 1299.00,
        subtotal: 1199.00,
        tax: 100.00,
        shipping_cost: 0,
        shipping_name: orderData.shipping_name,
        shipping_email: orderData.shipping_email,
        shipping_phone: orderData.shipping_phone,
        shipping_address: orderData.shipping_address,
        shipping_city: orderData.shipping_city,
        shipping_state: orderData.shipping_state,
        shipping_zip: orderData.shipping_zip,
        shipping_country: orderData.shipping_country,
        payment_method: orderData.payment_method,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [
          {
            id: '1',
            order_id: orderId,
            product_id: '1',
            product_name: 'Sample Book',
            product_image: '/img/book/01.png',
            quantity: 1,
            price: 450.00
          }
        ]
      };
    }

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderData),
    }, ORDER_RETRY_CONFIG);

    return data.order || data;
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
    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const mockOrders: OrderResponse[] = [
        {
          id: '1',
          order_number: 'ORD-2024-001',
          user_id: '1',
          status: 'delivered',
          total: 1299.00,
          subtotal: 1199.00,
          tax: 100.00,
          shipping_cost: 0,
          shipping_name: 'Test User',
          shipping_email: 'test@example.com',
          shipping_phone: '+91 9876543210',
          shipping_address: '123 Test Street',
          shipping_city: 'Test City',
          shipping_state: 'Test State',
          shipping_zip: '123456',
          shipping_country: 'India',
          payment_method: 'credit-card',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-16T14:20:00Z',
          items: [
            {
              id: '1',
              order_id: '1',
              product_id: '1',
              product_name: 'Shirdi Sai Baba Ki Divya Leela',
              product_image: '/img/book/01.png',
              quantity: 2,
              price: 450.00
            },
            {
              id: '2',
              order_id: '1',
              product_id: '4',
              product_name: 'The Thousand Names of Vishnu',
              product_image: '/img/book/04.png',
              quantity: 1,
              price: 399.00
            }
          ]
        },
        {
          id: '2',
          order_number: 'ORD-2024-002',
          user_id: '1',
          status: 'processing',
          total: 849.00,
          subtotal: 799.00,
          tax: 50.00,
          shipping_cost: 0,
          shipping_name: 'Test User',
          shipping_email: 'test@example.com',
          shipping_phone: '+91 9876543210',
          shipping_address: '123 Test Street',
          shipping_city: 'Test City',
          shipping_state: 'Test State',
          shipping_zip: '123456',
          shipping_country: 'India',
          payment_method: 'upi',
          created_at: '2024-01-20T15:45:00Z',
          updated_at: '2024-01-20T15:45:00Z',
          items: [
            {
              id: '3',
              order_id: '2',
              product_id: '6',
              product_name: 'Yoga for Modern Living',
              product_image: '/img/book/06.png',
              quantity: 1,
              price: 599.00
            },
            {
              id: '4',
              order_id: '2',
              product_id: '2',
              product_name: 'Sai Charitra Mala',
              product_image: '/img/book/02.png',
              quantity: 1,
              price: 299.00
            }
          ]
        }
      ];

      return {
        data: mockOrders,
        current_page: page,
        last_page: 1,
        per_page: 10,
        total: mockOrders.length
      };
    }

    const params = new URLSearchParams({ page: page.toString() });
    
    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
    }

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}orders?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }, READ_RETRY_CONFIG);

    return data.orders || data;
  },

  // Get specific order by ID
  getOrderById: async (token: string, orderId: string): Promise<OrderResponse> => {
    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockOrderDetails: OrderResponse = {
        id: orderId,
        order_number: `ORD-2024-00${orderId}`,
        user_id: '1',
        status: orderId === '1' ? 'delivered' : 'processing',
        total: orderId === '1' ? 1299.00 : 849.00,
        subtotal: orderId === '1' ? 1199.00 : 799.00,
        tax: orderId === '1' ? 100.00 : 50.00,
        shipping_cost: 0,
        shipping_name: 'Test User',
        shipping_email: 'test@example.com',
        shipping_phone: '+91 9876543210',
        shipping_address: '123 Test Street',
        shipping_city: 'Test City',
        shipping_state: 'Test State',
        shipping_zip: '123456',
        shipping_country: 'India',
        payment_method: orderId === '1' ? 'credit-card' : 'upi',
        created_at: orderId === '1' ? '2024-01-15T10:30:00Z' : '2024-01-20T15:45:00Z',
        updated_at: orderId === '1' ? '2024-01-16T14:20:00Z' : '2024-01-20T15:45:00Z',
        items: orderId === '1' ? [
          {
            id: '1',
            order_id: '1',
            product_id: '1',
            product_name: 'Shirdi Sai Baba Ki Divya Leela',
            product_image: '/img/book/01.png',
            quantity: 2,
            price: 450.00
          },
          {
            id: '2',
            order_id: '1',
            product_id: '4',
            product_name: 'The Thousand Names of Vishnu',
            product_image: '/img/book/04.png',
            quantity: 1,
            price: 399.00
          }
        ] : [
          {
            id: '3',
            order_id: '2',
            product_id: '6',
            product_name: 'Yoga for Modern Living',
            product_image: '/img/book/06.png',
            quantity: 1,
            price: 599.00
          },
          {
            id: '4',
            order_id: '2',
            product_id: '2',
            product_name: 'Sai Charitra Mala',
            product_image: '/img/book/02.png',
            quantity: 1,
            price: 299.00
          }
        ]
      };

      return mockOrderDetails;
    }

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }, READ_RETRY_CONFIG);

    return data.order || data;
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

    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        total_orders: 2,
        total_spent: 2148.00,
        pending_orders: 1,
        average_order_value: 1074.00,
        member_since: '2023-12-01T00:00:00Z',
        favorite_categories: ['Books on Shirdi Sai Baba', 'Other Religious Books'],
        created_at: '2023-12-01T00:00:00Z'
      };
    }

    const data = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }, READ_RETRY_CONFIG);

    const profile = data.profile || data;
    
    // Enhance profile with calculated statistics
    const enhancedProfile = {
      ...profile,
      average_order_value: profile.total_orders > 0 ? (profile.total_spent || 0) / profile.total_orders : 0,
      member_since: profile.created_at || new Date().toISOString(),
      favorite_categories: profile.favorite_categories || [],
    };

    return enhancedProfile;
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

    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: '1',
        name: data.name,
        email: data.email,
        total_orders: 2,
        total_spent: 2148.00,
        pending_orders: 1,
        average_order_value: 1074.00,
        member_since: '2023-12-01T00:00:00Z',
        favorite_categories: ['Books on Shirdi Sai Baba', 'Other Religious Books'],
        created_at: '2023-12-01T00:00:00Z'
      };
    }

    const responseData = await authenticatedFetchWithRetry<any>(`${API_BASE_URL}profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    }, {
      maxRetries: 1, // Don't retry profile updates multiple times
    });

    return responseData.profile || responseData;
  },

  // Get profile statistics
  getProfileStatistics: async (token: string): Promise<ProfileStatistics> => {
    if (!token) {
      throw new Error('Authentication required. Please log in to view statistics.');
    }

    // Mock data for development
    if (import.meta.env.DEV) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        totalOrders: 2,
        totalSpent: 2148.00,
        pendingOrders: 1,
        averageOrderValue: 1074.00,
        memberSince: '2023-12-01T00:00:00Z',
        favoriteCategories: ['Books on Shirdi Sai Baba', 'Other Religious Books', 'Coffee Table Books'],
        lastOrderDate: '2024-01-20T15:45:00Z'
      };
    }

    try {
      const profile = await ProfileService.getProfile(token);
      const orders = await OrderService.getOrders(token, 1);
      
      // Calculate favorite categories from order history
      const categoryCount: Record<string, number> = {};
      orders.data.forEach(order => {
        order.items?.forEach(item => {
          if (item.book?.category) {
            categoryCount[item.book.category] = (categoryCount[item.book.category] || 0) + 1;
          }
        });
      });

      const favoriteCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      const lastOrderDate = orders.data.length > 0 
        ? orders.data[0].created_at 
        : undefined;

      return {
        totalOrders: profile.total_orders || 0,
        totalSpent: profile.total_spent || 0,
        pendingOrders: profile.pending_orders || 0,
        averageOrderValue: profile.average_order_value || 0,
        memberSince: profile.member_since || profile.created_at || new Date().toISOString(),
        favoriteCategories,
        lastOrderDate,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to load profile statistics.');
    }
  },
};

// Search Service
export const SearchService = {
  searchBooks: async (query: string): Promise<ApiResponse<Book[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const searchResults = books.filter(book => {
      const searchLower = query.toLowerCase();
      return (
        book.title.toLowerCase().includes(searchLower) ||
        book.description.toLowerCase().includes(searchLower) ||
        book.authors.some(author => 
          author.name.toLowerCase().includes(searchLower)
        ) ||
        book.tags.some(tag => 
          tag.toLowerCase().includes(searchLower)
        )
      );
    });

    return {
      data: searchResults,
      status: 200
    };
  }
};

// Authentication Service
export const AuthService = {
  // Register a new user
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return await authenticatedFetchWithRetry<AuthResponse>(`${API_BASE_URL}auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
    }, {
      maxRetries: 1, // Don't retry registration multiple times
    });
  },

  // Login an existing user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      return await authenticatedFetchWithRetry<AuthResponse>(`${API_BASE_URL}auth/login`, {
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
