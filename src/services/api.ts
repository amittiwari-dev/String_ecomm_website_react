import { Book, books } from '../data/mockData';
import { ApiError } from '../lib/errorHandler';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper function to normalize API book data to our Book interface
const normalizeApiBookToBook = (apiBook: any): Book => {
  const base = 'https://sterlingpublishers.in/publishing';
  const cover = apiBook.product_image
    ? `${base}/images/products/${apiBook.product_image}`
    : '/img/book-categori/book-placeholder.png';

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

// Book Service
export const BookService = {
  // Get all books with optional filters
  getAllBooks: async (filters?: {
    category?: string;
    search?: string;
    sortBy?: 'price' | 'title' | 'rating';
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<Book[]>> => {
    try {
      // Call real API endpoint
      const response = await fetch(`${API_BASE_URL}/new-books`);
      const data = await response.json();
      
      if (data.status === 200 && data.records) {
        // Convert API books to our Book format
        const books: Book[] = data.records.map((apiBook: any) => normalizeApiBookToBook(apiBook));
        
        // Apply filters if provided
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
      }
      
      return {
        data: [],
        status: 200,
      };
    } catch (error) {
      console.error('Failed to fetch books:', error);
      return {
        data: [],
        status: 500,
        message: 'Failed to fetch books'
      };
    }
  },

  // Get a single book by ID (frontend should always send numeric/string id)
  getBookById: async (id: string): Promise<ApiResponse<Book | null>> => {
    console.log('Fetching book with ID:', id);
    
    try {
      // First try to get all books and find the one with matching ID
      const allBooksResponse = await BookService.getAllBooks();
      const book = allBooksResponse.data.find(book => book.id === id);
      
      if (!book) {
        console.error(`Book with ID "${id}" not found`);
        return {
          data: null,
          status: 404,
          message: 'Book not found'
        };
      }

      return {
        data: book,
        status: 200
      };
    } catch (error) {
      console.error('Failed to fetch book:', error);
      return {
        data: null,
        status: 500,
        message: 'Failed to fetch book'
      };
    }
  },

  // Get featured books
  getFeaturedBooks: async (): Promise<ApiResponse<Book[]>> => {
    try {
      // Get Shirdi Sai Baba books as featured
      const response = await fetch(`${API_BASE_URL}/shirdi-sai-baba`);
      const data = await response.json();
      
      if (data.status === 200 && data.records) {
        const books: Book[] = data.records.map((apiBook: any) => normalizeApiBookToBook(apiBook));
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
      return {
        data: [],
        status: 500
      };
    }
  },

  // Get new releases
  getNewReleases: async (): Promise<ApiResponse<Book[]>> => {
    try {
      // Get new books from API
      const response = await fetch(`${API_BASE_URL}/new-books`);
      const data = await response.json();
      
      if (data.status === 200 && data.records) {
        const books: Book[] = data.records.map((apiBook: any) => normalizeApiBookToBook(apiBook)).slice(0, 8);
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
      return {
        data: [],
        status: 500
      };
    }
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
