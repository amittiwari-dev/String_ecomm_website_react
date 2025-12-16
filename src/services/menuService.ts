import { Category, getCategoryById, getCategoriesByParent, getBooksByCategory } from '../data/mockData';

export interface CategoryMenuItem {
  id: string;
  name: string;
  slug: string;
  bookCount: number;
  children?: CategoryMenuItem[];
  isActive: boolean;
  parent_id: string | null;
  sort_order: number;
}

export interface MenuState {
  categories: CategoryMenuItem[];
  isLoading: boolean;
  lastRefresh: Date;
  error: string | null;
}

export interface MenuCacheEntry {
  data: CategoryMenuItem[];
  timestamp: Date;
  expiresAt: Date;
}

class MenuService {
  private cache: MenuCacheEntry | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes


  /**
   * Get menu categories with book counts and caching
   */
  async getMenuCategories(): Promise<CategoryMenuItem[]> {
    // Check cache first
    if (this.cache && this.cache.expiresAt > new Date()) {
      return this.cache.data;
    }

    try {
      // Get top-level categories directly - no complex async operations
      const topLevelCategories = getCategoriesByParent(null);
      
      if (!topLevelCategories || topLevelCategories.length === 0) {
        return this.getFallbackMenu();
      }

      const menuItems: CategoryMenuItem[] = [];

      // Build menu items synchronously to avoid timing issues
      for (const category of topLevelCategories) {
        const menuItem = this.buildCategoryMenuItemSync(category);
        if (menuItem) {
          menuItems.push(menuItem);
        }
      }

      const sortedItems = menuItems.sort((a, b) => a.sort_order - b.sort_order);
      
      // Update cache
      this.cache = {
        data: sortedItems,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_DURATION)
      };

      return sortedItems;
    } catch (error) {
      console.warn('Menu service error, using fallback:', error);
      return this.getFallbackMenu();
    }
  }

  /**
   * Get fallback menu when everything fails
   */
  private getFallbackMenu(): CategoryMenuItem[] {
    return [
      {
        id: '2',
        name: 'Books on Shirdi Sai Baba',
        slug: 'shirdi-sai-baba',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 2
      },
      {
        id: '3',
        name: 'Other Religious Books',
        slug: 'other-religious',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 3
      },
      {
        id: '4',
        name: 'Coffee Table Books and Paperbacks',
        slug: 'coffee-table-paperbacks',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 4
      },
      {
        id: '5',
        name: 'Text Books',
        slug: 'textbooks',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 5
      }
    ];
  }

  /**
   * Get book count for a specific category (including subcategories) - synchronous
   */
  getCategoryBookCountSync(categoryId: string): number {
    try {
      const category = getCategoryById(categoryId);
      if (!category) {
        return 0;
      }

      // Get books directly in this category
      let bookCount = getBooksByCategory(categoryId).length;

      // Add books from subcategories
      const subcategories = getCategoriesByParent(categoryId);
      for (const subcategory of subcategories) {
        bookCount += getBooksByCategory(subcategory.id).length;
      }

      return bookCount;
    } catch (error) {
      console.error(`Error getting book count for category ${categoryId}:`, error);
      return 0;
    }
  }

  /**
   * Get book count for a specific category (including subcategories) - async wrapper
   */
  async getCategoryBookCount(categoryId: string): Promise<number> {
    return this.getCategoryBookCountSync(categoryId);
  }

  /**
   * Refresh menu data by clearing cache and fetching new data
   */
  async refreshMenuData(): Promise<void> {
    this.cache = null;
    await this.getMenuCategories();
  }

  /**
   * Get category preview books (for hover functionality)
   */
  async getCategoryPreview(categoryId: string, limit: number = 4): Promise<any[]> {
    try {
      const categoryBooks = getBooksByCategory(categoryId);
      
      // Return top books (by rating or bestseller rank)
      return categoryBooks
        .sort((a, b) => {
          // Sort by bestseller rank first, then by rating
          if (a.bestseller_rank && b.bestseller_rank) {
            return a.bestseller_rank - b.bestseller_rank;
          }
          if (a.bestseller_rank) return -1;
          if (b.bestseller_rank) return 1;
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, limit)
        .map(book => ({
          id: book.id,
          title: book.title,
          price: book.price,
          currency: book.currency,
          image: book.images[0] || '/img/book-categori/book-placeholder.png',
          authors: book.authors.map(author => author.name).join(', '),
          rating: book.rating
        }));
    } catch (error) {
      console.error(`Error getting category preview for ${categoryId}:`, error);
      return [];
    }
  }

  /**
   * Check if category should be displayed (has books or active subcategories) - synchronous
   */
  private isCategoryActiveSync(category: Category): boolean {
    // Check if category has books
    const bookCount = this.getCategoryBookCountSync(category.id);
    if (bookCount > 0) return true;

    // Check if any subcategories are active
    const subcategories = getCategoriesByParent(category.id);
    for (const subcategory of subcategories) {
      if (this.isCategoryActiveSync(subcategory)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Build category menu item with book count and children - synchronous
   */
  private buildCategoryMenuItemSync(category: Category): CategoryMenuItem | null {
    try {
      const isActive = this.isCategoryActiveSync(category);
      
      // Skip inactive categories
      if (!isActive) return null;

      const bookCount = this.getCategoryBookCountSync(category.id);
      const subcategories = getCategoriesByParent(category.id) || [];
      
      const children: CategoryMenuItem[] = [];
      for (const subcategory of subcategories) {
        try {
          const childItem = this.buildCategoryMenuItemSync(subcategory);
          if (childItem) {
            children.push(childItem);
          }
        } catch (childError) {
          console.warn(`Failed to build child menu item for ${subcategory.id}:`, childError);
          // Continue with other children
        }
      }

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        bookCount,
        children: children.length > 0 ? children : undefined,
        isActive,
        parent_id: category.parent_id,
        sort_order: category.sort_order
      };
    } catch (error) {
      console.error(`Error building category menu item for ${category.id}:`, error);
      return null;
    }
  }





  /**
   * Clear cache (useful for testing or forced refresh)
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

// Export singleton instance
const menuService = new MenuService();
export { menuService };
export default menuService;