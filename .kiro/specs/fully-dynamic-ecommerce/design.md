# Design Document

## Overview

This design transforms the React eCommerce application from a static, mock-data-driven system into a fully dynamic, production-ready platform. All data will flow through REST APIs from the Laravel backend, eliminating hardcoded categories, menu items, footer links, and product data. The architecture follows API-first principles to support current web needs and future mobile applications.

## Architecture

### Current State Analysis

**Problems Identified:**
1. **Hardcoded Categories**: MegaMenu.tsx contains static category definitions
2. **Static Footer**: Footer.tsx has hardcoded links and sections
3. **Mock Data Dependency**: Pages use mockData.ts even when API is available
4. **Limited Backend APIs**: Only 4 endpoints exist (shirdi-sai-baba, new-books, category-wise, new-note)
5. **No Content Management**: No way to update homepage sections without code changes
6. **No Admin Endpoints**: Backend lacks CRUD operations for categories and content

### Target Architecture

**Three-Tier Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │   Services   │     │
│  │ (Index, All  │  │ (MegaMenu,   │  │ (API calls)  │     │
│  │  Books, etc) │  │  Footer)     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                   Laravel Backend API                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Controllers  │  │   Models     │  │  Middleware  │     │
│  │ (API, Admin) │  │ (Category,   │  │  (Auth,      │     │
│  │              │  │  Product)    │  │   Cache)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    MySQL Database                           │
│  categories | products | footer_links | homepage_sections   │
│  subcategories | users | orders | cart                      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Backend API Endpoints

#### Category & Menu Endpoints


**GET /api/categories**
- Returns all active categories with subcategories and book counts
- Response format:
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "name": "Religious Books",
      "slug": "religious-books",
      "parent_id": null,
      "sort_order": 1,
      "is_active": true,
      "book_count": 45,
      "children": [
        {
          "id": 2,
          "name": "Shirdi Sai Baba",
          "slug": "shirdi-sai-baba",
          "parent_id": 1,
          "sort_order": 1,
          "is_active": true,
          "book_count": 12
        }
      ]
    }
  ]
}
```

**GET /api/menu-data**
- Optimized endpoint specifically for mega menu rendering
- Includes only active categories with book counts
- Cached for 1 hour

#### Footer Content Endpoints

**GET /api/footer-links**
- Returns all active footer links organized by section
- Response format:
```json
{
  "status": 200,
  "data": {
    "quick_links": [
      {
        "id": 1,
        "title": "Latest Releases",
        "url": "/latest-releases",
        "is_external": false,
        "sort_order": 1
      }
    ],
    "categories": [...],
    "contact": [...]
  }
}
```

#### Homepage Content Endpoints

**GET /api/homepage-sections**
- Returns all active homepage sections with configuration
- Response format:
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "section_type": "hero_carousel",
      "title": "Featured Books",
      "sort_order": 1,
      "is_active": true,
      "content": {
        "slides": [
          {
            "image": "/img/hero/hero-bg-1.jpg",
            "title": "Discover Spiritual Wisdom",
            "subtitle": "Books on Shirdi Sai Baba",
            "cta_text": "Explore Now",
            "cta_link": "/books?category=shirdi-sai-baba"
          }
        ]
      }
    }
  ]
}
```

#### Product Endpoints (Enhanced)

**GET /api/products**
- Enhanced with filtering, sorting, and pagination
- Query parameters:
  - `category`: Filter by category slug
  - `subcategory`: Filter by subcategory slug
  - `search`: Search query
  - `sort`: Sort field (price, title, date)
  - `order`: Sort order (asc, desc)
  - `page`: Page number
  - `per_page`: Items per page (default 20)
- Response format:
```json
{
  "status": 200,
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 95
  }
}
```

**GET /api/products/{id}**
- Returns single product with full details
- Includes related products

**GET /api/search**
- Full-text search across products
- Returns matching products with relevance scoring

### 2. Frontend Service Layer

#### MenuService (New)


**File: `src/services/menuService.ts`**

```typescript
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

export const MenuService = {
  getCategories: async (): Promise<CategoryMenuItem[]> => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    const data = await response.json();
    return data.data;
  },
  
  getMenuData: async (): Promise<CategoryMenuItem[]> => {
    const response = await fetch(`${API_BASE_URL}/menu-data`);
    const data = await response.json();
    return data.data;
  },
  
  getFooterLinks: async (): Promise<FooterLinks> => {
    const response = await fetch(`${API_BASE_URL}/footer-links`);
    const data = await response.json();
    return data.data;
  }
};
```

#### ContentService (New)

**File: `src/services/contentService.ts`**

```typescript
export interface HomepageSection {
  id: string;
  section_type: 'hero_carousel' | 'featured_books' | 'category_grid' | 'promotional_banner';
  title: string;
  sort_order: number;
  is_active: boolean;
  content: any; // JSON content specific to section type
}

export const ContentService = {
  getHomepageSections: async (): Promise<HomepageSection[]> => {
    const response = await fetch(`${API_BASE_URL}/homepage-sections`);
    const data = await response.json();
    return data.data;
  }
};
```

#### Enhanced BookService

**Update: `src/services/api.ts`**

Add new methods to BookService:
- `searchBooks(query, filters)` - Full search with filters
- `getProductsByCategory(categorySlug, page)` - Paginated category products
- `getFeaturedProducts()` - Homepage featured products

### 3. Frontend Components Updates

#### MegaMenu Component

**File: `src/components/MegaMenu.tsx`**

**Changes:**
- Remove all static category data
- Use React Query to fetch menu data
- Display loading skeleton while fetching
- Show error state with retry button
- Render categories dynamically from API response

**Implementation Pattern:**
```typescript
const MegaMenu = () => {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['menu-data'],
    queryFn: MenuService.getMenuData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });

  if (isLoading) return <MegaMenuSkeleton />;
  if (error) return <MegaMenuError onRetry={refetch} />;
  
  return (
    <div className="mega-menu">
      {categories?.map(category => (
        <CategoryColumn key={category.id} category={category} />
      ))}
    </div>
  );
};
```

#### Footer Component

**File: `src/components/Footer.tsx`**

**Changes:**
- Remove all hardcoded links
- Fetch footer links from API
- Render sections dynamically
- Support external and internal links

#### Homepage (Index.tsx)

**File: `src/pages/Index.tsx`**

**Changes:**
- Remove static section definitions
- Fetch homepage sections from API
- Render sections dynamically based on section_type
- Support multiple section types with component mapping

**Section Component Mapping:**
```typescript
const sectionComponents = {
  hero_carousel: HeroCarousel,
  featured_books: FeaturedBooksGrid,
  category_grid: CategoryGrid,
  promotional_banner: PromotionalBanner,
};
```

### 4. Backend Database Schema

#### New Tables

**footer_links table:**
```sql
CREATE TABLE footer_links (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  link_section ENUM('quick_links', 'categories', 'contact') NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_external BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section_active (link_section, is_active, sort_order)
);
```

**homepage_sections table:**
```sql
CREATE TABLE homepage_sections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  content_json JSON NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_order (is_active, sort_order)
);
```

#### Enhanced Existing Tables

**categories table updates:**
```sql
ALTER TABLE tbl_category 
ADD COLUMN sort_order INT DEFAULT 0 AFTER category_slug,
ADD INDEX idx_active_order (is_active, sort_order);
```

**subcategories table updates:**
```sql
ALTER TABLE tbl_sub_category
ADD COLUMN sort_order INT DEFAULT 0 AFTER sub_category_slug,
ADD INDEX idx_parent_active (category_id, is_active, sort_order);
```

### 5. Backend Controllers

#### MenuController (New)

**File: `app/Http/Controllers/MenuController.php`**


```php
class MenuController extends Controller
{
    public function getCategories()
    {
        $categories = Category::with(['subcategories' => function($query) {
            $query->where('is_active', 1)
                  ->orderBy('sort_order')
                  ->withCount('products');
        }])
        ->where('is_active', 1)
        ->whereNull('parent_id')
        ->orderBy('sort_order')
        ->withCount('products')
        ->get();

        return response()->json([
            'status' => 200,
            'data' => $categories
        ]);
    }

    public function getFooterLinks()
    {
        $links = FooterLink::where('is_active', 1)
            ->orderBy('sort_order')
            ->get()
            ->groupBy('link_section');

        return response()->json([
            'status' => 200,
            'data' => $links
        ]);
    }
}
```

#### ContentController (New)

**File: `app/Http/Controllers/ContentController.php`**

```php
class ContentController extends Controller
{
    public function getHomepageSections()
    {
        $sections = HomepageSection::where('is_active', 1)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => $sections
        ]);
    }
}
```

#### Enhanced ApiController

**File: `app/Http/Controllers/ApiController.php`**

Add new methods:
- `getProducts()` - With filtering, sorting, pagination
- `searchProducts()` - Full-text search
- `getProductById()` - Single product details

### 6. Backend Models

#### FooterLink Model (New)

**File: `app/Models/FooterLink.php`**

```php
class FooterLink extends Model
{
    protected $fillable = [
        'title', 'url', 'link_section', 'sort_order', 
        'is_active', 'is_external'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_external' => 'boolean',
    ];
}
```

#### HomepageSection Model (New)

**File: `app/Models/HomepageSection.php`**

```php
class HomepageSection extends Model
{
    protected $fillable = [
        'section_type', 'title', 'content_json', 
        'sort_order', 'is_active'
    ];

    protected $casts = [
        'content_json' => 'array',
        'is_active' => 'boolean',
    ];
}
```

#### Enhanced Category Model

Add relationships and scopes:
```php
public function subcategories()
{
    return $this->hasMany(SubCategory::class, 'category_id');
}

public function products()
{
    return $this->hasMany(Product::class, 'category_id');
}

public function scopeActive($query)
{
    return $query->where('is_active', 1);
}
```

## Data Models

### Frontend TypeScript Interfaces

**CategoryMenuItem:**
```typescript
interface CategoryMenuItem {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  book_count: number;
  children?: CategoryMenuItem[];
}
```

**FooterLink:**
```typescript
interface FooterLink {
  id: string;
  title: string;
  url: string;
  is_external: boolean;
  sort_order: number;
}
```

**HomepageSection:**
```typescript
interface HomepageSection {
  id: string;
  section_type: 'hero_carousel' | 'featured_books' | 'category_grid' | 'promotional_banner';
  title: string;
  sort_order: number;
  is_active: boolean;
  content: {
    // Type-specific content
    slides?: Array<{
      image: string;
      title: string;
      subtitle: string;
      cta_text: string;
      cta_link: string;
    }>;
    products?: string[]; // Product IDs
    categories?: string[]; // Category IDs
  };
}
```

## Error Handling

### API Error Responses

**Standard Error Format:**
```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "title": ["The title field is required"]
  }
}
```

### Frontend Error Handling Strategy

1. **Network Errors**: Display "Connection failed" with retry button
2. **404 Errors**: Display "Content not found" message
3. **500 Errors**: Display "Server error" with retry button
4. **Validation Errors**: Display field-specific error messages

### No Fallback Data in Production

- Remove all mock data imports from production build
- Use environment variable to control mock data availability
- Display clear error messages instead of falling back to static data

## Testing Strategy

### Backend API Testing

1. **Unit Tests**: Test each controller method
2. **Integration Tests**: Test API endpoints with database
3. **Seeder Tests**: Verify seeders populate correct data

### Frontend Testing

1. **Component Tests**: Test dynamic rendering with mock API responses
2. **Integration Tests**: Test full data flow from API to UI
3. **E2E Tests**: Test user journeys with real API

### Manual Testing Checklist

- [ ] Mega menu displays categories from API
- [ ] Footer links render from API
- [ ] Homepage sections load dynamically
- [ ] Product listings work without mock data
- [ ] Search and filters use API
- [ ] Error states display correctly
- [ ] Loading states show skeletons
- [ ] Cache invalidation works
- [ ] Admin panel CRUD operations work

## Performance Considerations

### Caching Strategy

**Backend (Laravel):**
- Cache menu data for 1 hour
- Cache footer links for 1 hour
- Cache homepage sections for 30 minutes
- Invalidate on content updates

**Frontend (React Query):**
- Stale time: 5 minutes
- Cache time: 1 hour
- Background refetch on window focus

### Optimization Techniques

1. **Lazy Loading**: Load homepage sections progressively
2. **Prefetching**: Prefetch menu data on app load
3. **Pagination**: Limit product listings to 20 per page
4. **Image Optimization**: Use responsive images with lazy loading
5. **Code Splitting**: Split admin components from public components

## Migration Strategy

### Phase 1: Backend Setup
1. Create new database tables
2. Add migrations for table updates
3. Create seeders for initial data
4. Implement new API endpoints
5. Test API endpoints

### Phase 2: Frontend Updates
1. Create new service files
2. Update MegaMenu component
3. Update Footer component
4. Update Homepage component
5. Remove mock data dependencies

### Phase 3: Testing & Deployment
1. Run comprehensive tests
2. Deploy backend changes
3. Deploy frontend changes
4. Monitor for errors
5. Optimize based on metrics

## Security Considerations

1. **API Authentication**: Use Laravel Sanctum for admin endpoints
2. **Input Validation**: Validate all inputs on backend
3. **SQL Injection**: Use Eloquent ORM to prevent SQL injection
4. **XSS Protection**: Sanitize content before rendering
5. **CORS Configuration**: Configure CORS for frontend domain
6. **Rate Limiting**: Implement rate limiting on API endpoints

