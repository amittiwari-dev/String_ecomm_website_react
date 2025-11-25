import { Book, books } from '../data/mockData';
import { ApiError, handleApiError } from '../lib/errorHandler';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Import authenticatedFetch for global 401 handling
import { authenticatedFetch } from '../lib/auth';

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
}

/**
 * Helper function to handle API responses with consistent error handling
 */
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  const responseData = await response.json();

  if (!response.ok) {
    throw new ApiError(
      responseData.message || 'Request failed',
      response.status,
      responseData.errors
    );
  }

  return responseData;
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
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}cart`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await handleApiResponse<any>(response);
      return data.cart || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Add item to cart
  addToCart: async (token: string, productId: string, quantity: number): Promise<Cart> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}cart`, {
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
      });

      const data = await handleApiResponse<any>(response);
      return data.cart || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Update cart item quantity
  updateCartItem: async (token: string, itemId: string, quantity: number): Promise<Cart> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await handleApiResponse<any>(response);
      return data.cart || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Remove item from cart
  removeCartItem: async (token: string, itemId: string): Promise<Cart> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await handleApiResponse<any>(response);
      return data.cart || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Clear cart (remove all items)
  clearCart: async (token: string): Promise<void> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}cart/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok && response.status !== 404) {
        const responseData = await response.json();
        throw new Error(responseData.message || 'Failed to clear cart');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Merge guest cart with user cart
  mergeGuestCart: async (token: string, items: GuestCartItem[]): Promise<Cart> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}cart/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const data = await handleApiResponse<any>(response);
      return data.cart || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },
};

// Order Service
export const OrderService = {
  // Create a new order
  createOrder: async (token: string, orderData: OrderData): Promise<OrderResponse> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await handleApiResponse<any>(response);
      return data.order || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Get user's orders with pagination
  getOrders: async (token: string, page: number = 1): Promise<PaginatedOrders> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}orders?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await handleApiResponse<any>(response);
      return data.orders || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Get specific order by ID
  getOrderById: async (token: string, orderId: string): Promise<OrderResponse> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await handleApiResponse<any>(response);
      return data.order || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },
};

// Profile Service
export const ProfileService = {
  // Get user profile with statistics
  getProfile: async (token: string): Promise<ProfileResponse> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await handleApiResponse<any>(response);
      return data.profile || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Update user profile
  updateProfile: async (token: string, data: ProfileData): Promise<ProfileResponse> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await handleApiResponse<any>(response);
      return responseData.profile || responseData;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
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
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });

      return await handleApiResponse<AuthResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Login an existing user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });

      return await handleApiResponse<AuthResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        // Customize 401 error message for login
        if (error.status === 401) {
          throw new ApiError('Invalid email or password', 401);
        }
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Logout the current user
  logout: async (token: string): Promise<void> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}auth/logout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (!response.ok && response.status !== 401) {
        // 401 is acceptable for logout (token might be expired)
        const responseData = await response.json();
        throw new Error(responseData.message || 'Logout failed');
      }
    } catch (error) {
      // Logout should not throw errors to the user
      // Even if the API call fails, we'll clear local state
      console.error('Logout error:', error);
    }
  },

  // Get current authenticated user
  getCurrentUser: async (token: string): Promise<User> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}auth/me`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      const data = await handleApiResponse<any>(response);
      return data.user || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },
};
