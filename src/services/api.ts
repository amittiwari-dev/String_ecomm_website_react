import { Book, books } from '../data/mockData';

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

// Order Service Interfaces
interface OrderDetails {
  items: Array<{ bookId: string; quantity: number }>;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

interface Order extends OrderDetails {
  id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  total: number;
  createdAt: string;
}

export const OrderService = {
  // Place a new order
  placeOrder: async (orderDetails: OrderDetails): Promise<ApiResponse<Order>> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate total
    const total = orderDetails.items.reduce((sum, item) => {
      const book = books.find(b => b.id === item.bookId);
      return sum + (book?.price || 0) * item.quantity;
    }, 0);

    const order: Order = {
      ...orderDetails,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      total,
      createdAt: new Date().toISOString()
    };

    return {
      data: order,
      status: 200,
      message: 'Order placed successfully'
    };
  }
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

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Import authenticatedFetch for global 401 handling
import { authenticatedFetch } from '../lib/auth';

// Authentication Service
export const AuthService = {
  // Register a new user
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle validation errors or other errors
        if (response.status === 422 && responseData.errors) {
          // Format validation errors
          const errorMessages = Object.entries(responseData.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          throw new Error(errorMessages);
        }
        throw new Error(responseData.message || 'Registration failed');
      }

      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Login an existing user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          throw new Error('Invalid email or password');
        }
        if (response.status === 422 && responseData.errors) {
          // Format validation errors
          const errorMessages = Object.entries(responseData.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          throw new Error(errorMessages);
        }
        throw new Error(responseData.message || 'Login failed');
      }

      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },

  // Logout the current user
  logout: async (token: string): Promise<void> => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/logout`, {
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
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(responseData.message || 'Failed to fetch user data');
      }

      return responseData.user || responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  },
};
