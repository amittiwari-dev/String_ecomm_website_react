/**
 * Centralized query keys for React Query
 * This ensures consistent query key usage across the application
 */

export const queryKeys = {
  // Menu and navigation data
  menu: {
    all: ['menu'] as const,
    categories: () => [...queryKeys.menu.all, 'categories'] as const,
    menuData: () => [...queryKeys.menu.all, 'menu-data'] as const,
    footerLinks: () => [...queryKeys.menu.all, 'footer-links'] as const,
  },

  // Content data
  content: {
    all: ['content'] as const,
    homepageSections: () => [...queryKeys.content.all, 'homepage-sections'] as const,
    sectionById: (id: string) => [...queryKeys.content.all, 'section', id] as const,
    sectionsByType: (type: string) => [...queryKeys.content.all, 'sections-by-type', type] as const,
  },

  // Book/Product data
  books: {
    all: ['books'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.books.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.books.all, 'detail', id] as const,
    featured: () => [...queryKeys.books.all, 'featured'] as const,
    newReleases: () => [...queryKeys.books.all, 'new-releases'] as const,
    related: (id: string) => [...queryKeys.books.all, 'related', id] as const,
    search: (query: string, filters?: Record<string, any>) => [...queryKeys.books.all, 'search', query, filters] as const,
    byCategory: (categorySlug: string, page?: number, perPage?: number) => 
      [...queryKeys.books.all, 'by-category', categorySlug, page, perPage] as const,
  },

  // User-specific data
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    orders: (page?: number, filters?: Record<string, any>) => 
      [...queryKeys.user.all, 'orders', page, filters] as const,
    orderById: (id: string) => [...queryKeys.user.all, 'order', id] as const,
    orderStatistics: () => [...queryKeys.user.all, 'order-statistics'] as const,
    cart: () => [...queryKeys.user.all, 'cart'] as const,
  },
} as const;

/**
 * Query key invalidation helpers
 * These functions help invalidate related queries when data changes
 */
export const queryInvalidation = {
  // Invalidate all menu-related queries
  invalidateMenuData: () => [
    queryKeys.menu.all,
  ],

  // Invalidate all content-related queries
  invalidateContentData: () => [
    queryKeys.content.all,
  ],

  // Invalidate all book-related queries
  invalidateBookData: () => [
    queryKeys.books.all,
  ],

  // Invalidate user-specific queries
  invalidateUserData: () => [
    queryKeys.user.all,
  ],

  // Invalidate specific category-related queries
  invalidateCategoryData: (categoryId?: string) => {
    const keys = [
      queryKeys.menu.categories(),
      queryKeys.menu.menuData(),
      queryKeys.content.homepageSections(),
    ];
    
    if (categoryId) {
      keys.push(queryKeys.books.byCategory(categoryId));
    }
    
    return keys;
  },
} as const;