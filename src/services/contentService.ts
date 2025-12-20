import { ApiError } from '../lib/errorHandler';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// TypeScript interfaces for content service
export type SectionType = 'hero_carousel' | 'featured_books' | 'category_grid' | 'promotional_banner';

export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
}

export interface SectionContent {
  // For hero_carousel
  slides?: HeroSlide[];
  // For featured_books
  products?: string[]; // Product IDs
  // For category_grid
  categories?: string[]; // Category IDs
  // For promotional_banner
  banner_image?: string;
  banner_title?: string;
  banner_subtitle?: string;
  banner_cta_text?: string;
  banner_cta_link?: string;
}

export interface HomepageSection {
  id: string;
  section_type: SectionType;
  title: string;
  sort_order: number;
  is_active: boolean;
  content: SectionContent;
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
  let responseData: any;
  
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
 * Content Service for fetching dynamic homepage content from Laravel backend API
 */
export const ContentService = {
  /**
   * Get all active homepage sections with configuration
   * Endpoint: GET /api/homepage-sections
   * Returns sections ordered by sort_order
   */
  getHomepageSections: async (): Promise<HomepageSection[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/homepage-sections`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<HomepageSection[]> = await handleApiResponse(response);
      
      if (data.status === 200 && data.data) {
        // Validate that all sections have required fields
        const validSections = data.data.filter(section => {
          if (!section.section_type || !section.id) {
            console.warn('Invalid section data:', section);
            return false;
          }
          return true;
        });

        return validSections;
      }

      throw new ApiError(data.message || 'Failed to fetch homepage sections', data.status || 500);
    } catch (error) {
      console.error('Failed to fetch homepage sections:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Network error while fetching homepage sections', 500);
    }
  },

  /**
   * Get a specific homepage section by ID
   * Endpoint: GET /api/homepage-sections/{id}
   */
  getHomepageSectionById: async (id: string): Promise<HomepageSection> => {
    try {
      const response = await fetch(`${API_BASE_URL}/homepage-sections/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<HomepageSection> = await handleApiResponse(response);
      
      if (data.status === 200 && data.data) {
        return data.data;
      }

      throw new ApiError(data.message || 'Failed to fetch homepage section', data.status || 500);
    } catch (error) {
      console.error(`Failed to fetch homepage section ${id}:`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Network error while fetching homepage section', 500);
    }
  },

  /**
   * Get sections by type
   * Filters homepage sections by section_type
   */
  getSectionsByType: async (sectionType: SectionType): Promise<HomepageSection[]> => {
    try {
      const allSections = await ContentService.getHomepageSections();
      return allSections.filter(section => section.section_type === sectionType);
    } catch (error) {
      console.error(`Failed to fetch sections of type ${sectionType}:`, error);
      throw error;
    }
  },
};

/**
 * Backward compatible content service class with caching
 */
class ContentServiceClass {
  private cache: { data: HomepageSection[]; timestamp: Date; expiresAt: Date } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get homepage sections with caching
   */
  async getHomepageSections(): Promise<HomepageSection[]> {
    // Check cache first
    if (this.cache && this.cache.expiresAt > new Date()) {
      return this.cache.data;
    }

    try {
      const sections = await ContentService.getHomepageSections();
      
      // Update cache
      this.cache = {
        data: sections,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_DURATION)
      };

      return sections;
    } catch (error) {
      console.error('Failed to fetch homepage sections:', error);
      throw error;
    }
  }

  /**
   * Refresh content data by clearing cache and fetching new data
   */
  async refreshContentData(): Promise<void> {
    this.cache = null;
    await this.getHomepageSections();
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

  /**
   * Get sections by type with caching
   */
  async getSectionsByType(sectionType: SectionType): Promise<HomepageSection[]> {
    const sections = await this.getHomepageSections();
    return sections.filter(section => section.section_type === sectionType);
  }
}

// Export singleton instance for backward compatibility
const contentService = new ContentServiceClass();
export { contentService };

// Export individual methods for convenience
export const { getHomepageSections, getHomepageSectionById, getSectionsByType } = ContentService;
