 # Implementation Plan

- [x] 1. Backend Database Setup
  - Create migration for `footer_links` table with fields: id, title, url, link_section, sort_order, is_active, is_external, timestamps
  - Create migration for `homepage_sections` table with fields: id, section_type, title, content_json, sort_order, is_active, timestamps
  - Add `sort_order` column to `tbl_category` table with default value 0
  - Add `sort_order` column to `tbl_sub_category` table with default value 0
  - Add database indexes for performance: idx_section_active on footer_links, idx_active_order on homepage_sections and categories
  - _Requirements: 7.1, 7.2, 7.3, 7.6_

- [x] 2. Backend Models Creation
  - Create `FooterLink` model with fillable fields and casts for boolean fields
  - Create `HomepageSection` model with fillable fields and JSON cast for content_json
  - Update `Category` model to add `subcategories()` and `products()` relationships
  - Update `Category` model to add `scopeActive()` query scope
  - Update `SubCategory` model to add `products()` relationship
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 3. Backend Seeders for Initial Data
  - Create `FooterLinksSeeder` to populate initial footer links for quick_links, categories, and contact sections
  - Create `HomepageSectionsSeeder` to populate initial homepage sections including hero carousel and featured books
  - Update existing category seeders to include sort_order values
  - Run seeders to populate database with initial dynamic content
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Backend Menu API Endpoints
  - Create `MenuController` with `getCategories()` method that returns active categories with subcategories and book counts
  - Add `getMenuData()` method optimized for mega menu rendering with eager loading
  - Add `getFooterLinks()` method that returns footer links grouped by section
  - Implement caching for menu data with 1-hour cache duration
  - Add routes in `routes/api.php` for /api/categories, /api/menu-data, /api/footer-links
  - _Requirements: 6.1, 6.2, 6.6, 9.1_

- [x] 5. Backend Content API Endpoints
  - Create `ContentController` with `getHomepageSections()` method
  - Implement caching for homepage sections with 30-minute cache duration
  - Add route in `routes/api.php` for /api/homepage-sections
  - Return sections ordered by sort_order with only active sections
  - _Requirements: 6.3, 6.6, 9.1_

- [x] 6. Backend Enhanced Product Endpoints
  - Update `ApiController` to add `getProducts()` method with filtering, sorting, and pagination support
  - Add query parameter handling for category, subcategory, search, sort, order, page, per_page
  - Add `searchProducts()` method for full-text search across product name and description
  - Update `getProductById()` method to include related products
  - Add routes for /api/products, /api/products/{id}, /api/search
  - _Requirements: 6.4, 6.5, 6.6, 9.6_

- [x] 7. Backend Cache Invalidation
  - Add cache invalidation logic when categories are created, updated, or deleted
  - Add cache invalidation logic when footer links are modified
  - Add cache invalidation logic when homepage sections are modified
  - Add cache invalidation logic when products are modified
  - _Requirements: 9.2_

- [x] 8. Frontend Menu Service Layer
  - Create `src/services/menuService.ts` file with TypeScript interfaces for CategoryMenuItem, FooterLink, FooterLinks
  - Implement `MenuService.getCategories()` method to fetch categories from API
  - Implement `MenuService.getMenuData()` method to fetch optimized menu data
  - Implement `MenuService.getFooterLinks()` method to fetch footer links
  - Add error handling and response validation for all service methods
  - _Requirements: 1.1, 2.2, 6.1, 6.2_

- [x] 9. Frontend Content Service Layer
  - Create `src/services/contentService.ts` file with TypeScript interface for HomepageSection
  - Implement `ContentService.getHomepageSections()` method to fetch homepage sections
  - Add support for different section types: hero_carousel, featured_books, category_grid, promotional_banner
  - Add error handling and response validation
  - _Requirements: 3.2, 6.3_

- [x] 10. Frontend Enhanced Book Service
  - Update `src/services/api.ts` BookService to add `searchBooks()` method with query and filters
  - Add `getProductsByCategory()` method with category slug and pagination
  - Add `getFeaturedProducts()` method for homepage featured section
  - Update existing methods to remove mock data fallbacks in production
  - Add proper TypeScript types for all new methods
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.4_

- [x] 11. Update MegaMenu Component to Use API
  - Update `src/components/MegaMenu.tsx` to remove all static category data
  - Implement React Query `useQuery` hook to fetch menu data from MenuService
  - Add loading state with MegaMenuSkeleton component
  - Add error state with retry button
  - Render categories dynamically from API response ordered by sort_order
  - Display book counts for each category and subcategory
  - Filter out inactive categories from display
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.4_

- [x] 12. Update Footer Component to Use API
  - Update `src/components/Footer.tsx` to remove all hardcoded links
  - Implement React Query to fetch footer links from MenuService
  - Render footer sections dynamically (quick_links, categories, contact)
  - Support both internal routes and external links based on is_external flag
  - Display links ordered by sort_order within each section
  - Add loading skeleton for footer while data loads
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 13. Update Homepage to Use Dynamic Sections
  - Update `src/pages/Index.tsx` to remove static section definitions
  - Implement React Query to fetch homepage sections from ContentService
  - Create section component mapping object for different section types
  - Render sections dynamically based on section_type from API
  - Display sections ordered by sort_order
  - Filter out inactive sections
  - Add loading skeletons for each section type while data loads
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.4_

- [x] 14. Remove Mock Data Dependencies from Production
  - Update `src/pages/AllBooks.tsx` to remove mock data imports and fallbacks
  - Update `src/pages/Index.tsx` to remove mock data fallbacks
  - Update `src/pages/DetailsPage.tsx` to use only API data
  - Add environment variable check to prevent mock data in production builds
  - Display clear error messages when API is unavailable instead of using fallback data
  - Add retry buttons to error states
  - _Requirements: 4.1, 4.2, 4.3, 10.1, 10.3, 10.5, 10.6_

- [x] 15. Implement Dynamic Search and Filters
  - Update `src/pages/AllBooks.tsx` to fetch filter options from API based on current inventory
  - Implement category filter that only shows categories with active products
  - Display product counts for each filter option from API
  - Send filter selections to backend API and display filtered results
  - Implement search functionality that sends queries to backend API
  - Display "No results found" message when filters return empty results
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 16. Implement React Query Caching Strategy
  - Configure React Query with staleTime of 5 minutes for menu data
  - Configure cacheTime of 1 hour for menu and footer data
  - Enable background refetch on window focus for critical data
  - Implement prefetching for menu data on application load
  - Add query key invalidation when relevant data changes
  - _Requirements: 9.3, 9.5_

- [x] 17. Add Loading States and Skeletons
  - Create loading skeleton components for MegaMenu, Footer, and Homepage sections
  - Implement progressive loading for homepage sections
  - Add loading indicators for product listings during filtering
  - Ensure smooth transitions between loading and loaded states
  - _Requirements: 9.4_

- [ ] 18. Implement Error Handling and Retry Logic
  - Add retry logic with exponential backoff for failed API requests (max 2 retries)
  - Display user-friendly error messages for different error types (network, 404, 500)
  - Add "Retry" buttons to all error states
  - Log all API errors to browser console for debugging
  - Display maintenance message when backend is completely unavailable
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

- [x] 19. Backend Admin Endpoints for Content Management
  - Create admin routes for categories CRUD operations (create, update, delete)
  - Create admin routes for footer links CRUD operations
  - Create admin routes for homepage sections CRUD operations
  - Add validation for all admin endpoints with descriptive error messages
  - Implement authentication middleware to restrict admin endpoints to admin users
  - Add audit logging for all content changes with user identification and timestamps
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 20. Testing and Validation
  - Test mega menu displays categories from API correctly
  - Test footer links render from API with correct sections
  - Test homepage sections load dynamically with proper ordering
  - Test product listings work without mock data
  - Test search and filters use API endpoints
  - Test error states display correctly with retry functionality
  - Test loading states show appropriate skeletons
  - Test cache invalidation works when content is updated
  - Verify no mock data is used in production and also loacal remove all static data 
  - _Requirements: All requirements validation_

