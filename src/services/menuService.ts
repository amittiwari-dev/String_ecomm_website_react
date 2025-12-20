import { ApiError } from '../lib/errorHandler';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// TypeScript interfaces for menu service
export interface CategoryMenuItem {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  book_count: number;
  children?: CategoryMenuItem[];
}

export interface FooterLink {
  id: string;
  title: string;
  url: string;
  is_external: boolean;
  sort_order: number;
}

export interface FooterLinks {
  quick_links: FooterLink[];
  categories: FooterLink[];
  contact: FooterLink[];
}

// API response interface
interface ApiResponse<T> {
  status: number;
  data: T;
  message?: string;
  error?: string;
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
 * Menu Service for fetching dynamic menu data from Laravel backend API
 */
export const MenuService = {
  /**
   * Get all active categories with subcategories and book counts
   * Endpoint: GET /api/categories
   */
  getCategories: async (): Promise<CategoryMenuItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<CategoryMenuItem[]> = await handleApiResponse(response);
      
      if (data.status === 200 && data.data) {
        return data.data;
      }

      throw new ApiError(data.message || 'Failed to fetch categories', data.status || 500);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Network error while fetching categories', 500);
    }
  },

  /**
   * Get optimized menu data specifically for mega menu rendering
   * Endpoint: GET /api/menu-data
   */
  getMenuData: async (): Promise<CategoryMenuItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu-data`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<CategoryMenuItem[]> = await handleApiResponse(response);
      
      if (data.status === 200 && data.data) {
        return data.data;
      }

      throw new ApiError(data.message || 'Failed to fetch menu data', data.status || 500);
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Network error while fetching menu data', 500);
    }
  },

  /**
   * Get footer links organized by section
   * Endpoint: GET /api/footer-links
   */
  getFooterLinks: async (): Promise<FooterLinks> => {
    try {
      const response = await fetch(`${API_BASE_URL}/footer-links`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<FooterLinks> = await handleApiResponse(response);
      
      if (data.status === 200 && data.data) {
        // Ensure all expected sections exist, even if empty
        const footerLinks: FooterLinks = {
          quick_links: data.data.quick_links || [],
          categories: data.data.categories || [],
          contact: data.data.contact || [],
        };
        
        return footerLinks;
      }

      throw new ApiError(data.message || 'Failed to fetch footer links', data.status || 500);
    } catch (error) {
      console.error('Failed to fetch footer links:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Network error while fetching footer links', 500);
    }
  },
};

// Additional interfaces for backward compatibility
export interface MenuState {
  categories: CategoryMenuItem[];
  isLoading: boolean;
  lastRefresh: Date;
  error: string | null;
}

/**
 * Backward compatible menu service class for existing hooks
 */
class MenuServiceClass {
  private cache: { data: CategoryMenuItem[]; timestamp: Date; expiresAt: Date } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get menu categories with caching (backward compatible method)
   */
  async getMenuCategories(): Promise<CategoryMenuItem[]> {
    // Check cache first
    if (this.cache && this.cache.expiresAt > new Date()) {
      return this.cache.data;
    }

    try {
      const categories = await MenuService.getMenuData();
      
      // Update cache
      this.cache = {
        data: categories,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_DURATION)
      };

      return categories;
    } catch (error) {
      console.error('Failed to fetch menu categories:', error);
      throw error;
    }
  }

  /**
   * Refresh menu data by clearing cache and fetching new data
   */
  async refreshMenuData(): Promise<void> {
    this.cache = null;
    await this.getMenuCategories();
  }

  /**
   * Get category preview books (placeholder implementation)
   * Note: This functionality will need to be implemented with a proper API endpoint
   */
  async getCategoryPreview(categoryId: string, limit: number = 4): Promise<any[]> {
    // For now, return empty array as this requires a separate API endpoint
    // This can be implemented later when the backend provides category preview endpoints
    console.warn('getCategoryPreview not yet implemented with API - returning empty array');
    return [];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { hasCache: boolean; isExpired: boolean; lastRefresh?: Date } {
    if (!this.cache) {
      return { hasCache: false, isExpired: false };
    }

    return {
      hasCache: true,
      isExpired: this.cache.expiresAt <= new Date(),
      lastRefresh: this.cache.timestamp
    };
  }
}

// Export singleton instance for backward compatibility
const menuService = new MenuServiceClass();
export { menuService };

// Export individual methods for convenience
export const { getCategories, getMenuData, getFooterLinks } = MenuService;