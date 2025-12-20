import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, Star, Search, X, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast as sonnerToast } from "sonner";
import { useUrlStringState, useUrlNumberState } from '@/hooks/useUrlState';
import { AllBooksPageSkeleton } from '@/components/ui/book-skeleton';
import { ProgressiveBookGrid } from '@/components/ProgressiveBookGrid';
import { 
  FilterLoadingIndicator, 
  FilteringBookGridSkeleton, 
  SmoothLoadingTransition,
  SearchLoadingSpinner,
  CategoryFilterSkeleton,
  ResultsCountSkeleton
} from '@/components/ui/filter-loading';
import { deduplicateBooks, filterInvalidBooks } from '@/utils/deduplication';
import { getApiErrorMessage, validateApiConfig, logError } from '@/utils/environment';
import { BookService, BookFilters } from '@/services/api';
import { MenuService } from '@/services/menuService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Book interface for type safety
interface Book {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  language: string;
  format: 'Hardcover' | 'Paperback' | 'eBook';
  price: number;
  currency: string;
  isbn10?: string;
  isbn13?: string;
  publication_date: string;
  pages?: number;
  stock_status: 'In Stock' | 'Out of Stock' | 'Preorder';
  images: string[];
  authors: Array<{
    id: string;
    name: string;
    slug: string;
    bio: string;
  }>;
  category_id: string;
  tags: string[];
  is_latest_release: boolean;
  rating?: number;
}

const mapApiBookToBook = (api: any): Book => {
  const price = Number(api.price) || 0;
  const idStr = api.id != null ? String(api.id) : (api.product_slug || '0');
  const slug = api.product_slug || idStr;
  
  // Handle image URL - check if it's a full URL or just filename
  let cover = '/img/book-categori/book-placeholder.png';
  
  if (api.product_image) {
    // If product_image is already a full URL, use it as is
    if (api.product_image.startsWith('http://') || api.product_image.startsWith('https://')) {
      cover = api.product_image;
    } else {
      // Otherwise, construct the URL based on environment
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocal) {
        // Local development - Laravel storage path
        cover = `http://127.0.0.1:8000/images/products/${api.product_image}`;
      } else {
        // Production
        cover = `https://sterlingpublishers.in/publishing/images/products/${api.product_image}`;
      }
    }
  }

  return {
    id: idStr,
    title: api.product_name || api.title || 'Untitled',
    subtitle: api.subtitle || undefined,
    slug,
    description: api.product_description || '',
    language: api.language || 'English',
    format: (api.paperback_type as any) || 'Paperback',
    price,
    currency: api.currency || 'INR',
    publication_date: api.publication_date || new Date().toISOString(),
    pages: api.total_pages || undefined,
    stock_status: api.is_active === 1 ? 'In Stock' : 'Out of Stock',
    images: [cover],
    authors: [
      {
        id: api.author_id ? String(api.author_id) : `a-${idStr}`,
        name: api.author_name || 'Unknown',
        slug: (api.author_name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
        bio: ''
      }
    ],
    category_id: api.category?.id || '0',
    tags: api.tags || [],
    is_latest_release: !!api.is_latest_release,
  } as Book;
};

// Interface for category filter options
interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  book_count: number;
  children?: CategoryOption[];
}

const AllBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useProgressiveLoading, setUseProgressiveLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const location = useLocation();
  
  // Check if we're on the latest-releases route
  const isLatestReleasesPage = location.pathname === '/latest-releases';

  // URL state for search and filters
  const [searchTerm, setSearchTerm] = useUrlStringState('search', '');
  const [sortBy, setSortBy] = useUrlStringState('sort', 'product_name');
  const [categoryFilter, setCategoryFilter] = useUrlStringState('category', '');
  const [subcategoryFilter, setSubcategoryFilter] = useUrlStringState('subcategory', '');
  const [minPrice, setMinPrice] = useUrlNumberState('minPrice', 0);
  const [maxPrice, setMaxPrice] = useUrlNumberState('maxPrice', 0);

  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch available categories with book counts from current inventory
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('🔄 Fetching categories from API...');
      
      const response = await MenuService.getCategories();
      
      // Transform API response to our CategoryOption format
      const categories: CategoryOption[] = response.map((category: any) => ({
        id: category.id.toString(),
        name: category.name || category.category_name,
        slug: category.slug || category.category_slug,
        book_count: category.book_count || category.products_count || 0,
        children: category.children?.map((child: any) => ({
          id: child.id.toString(),
          name: child.name || child.sub_category_name,
          slug: child.slug || child.sub_category_slug,
          book_count: child.book_count || child.products_count || 0
        })).filter((child: CategoryOption) => child.book_count > 0) || [] // Only include subcategories with books
      }));
      
      // Only show categories that have books (either directly or through subcategories)
      const categoriesWithBooks = categories.filter(cat => {
        const hasDirectBooks = cat.book_count > 0;
        const hasSubcategoryBooks = cat.children && cat.children.length > 0 && 
          cat.children.some(sub => sub.book_count > 0);
        return hasDirectBooks || hasSubcategoryBooks;
      });
      
      setAvailableCategories(categoriesWithBooks);
      console.log(`✅ Loaded ${categoriesWithBooks.length} categories with books from current inventory`);
      
      // Log category details for debugging
      categoriesWithBooks.forEach(cat => {
        console.log(`📚 ${cat.name}: ${cat.book_count} books, ${cat.children?.length || 0} subcategories`);
      });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback to empty array - don't show error for categories
      setAvailableCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch books with current filters
  const fetchBooks = async (resetPage = false) => {
    try {
      setError(null);
      setIsSearching(true);
      
      if (resetPage) {
        setCurrentPage(1);
      }
      
      // Build filters object for API
      const apiFilters: any = {
        page: resetPage ? 1 : currentPage,
        per_page: 1000
      };
      
      // Add search term if present
      if (searchTerm.trim()) {
        apiFilters.search = searchTerm.trim();
      }
      
      // Add category filter if present
      if (categoryFilter) {
        apiFilters.category = categoryFilter;
      }
      
      // Add subcategory filter if present
      if (subcategoryFilter) {
        apiFilters.subcategory = subcategoryFilter;
      }
      
      // For latest releases page, set category to latest-releases
      if (isLatestReleasesPage) {
        apiFilters.category = 'latest-releases';
      }
      
      // Add price range filters
      if (minPrice > 0) {
        apiFilters.min_price = minPrice;
      }
      if (maxPrice > 0) {
        apiFilters.max_price = maxPrice;
      }
      
      // Add sorting - map frontend sort options to API fields
      if (sortBy) {
        switch (sortBy) {
          case 'title':
            apiFilters.sort = 'product_name';
            apiFilters.order = 'asc';
            break;
          case 'author':
            apiFilters.sort = 'author_name';
            apiFilters.order = 'asc';
            break;
          case 'price-low':
            apiFilters.sort = 'price';
            apiFilters.order = 'asc';
            break;
          case 'price-high':
            apiFilters.sort = 'price';
            apiFilters.order = 'desc';
            break;
          case 'newest':
            apiFilters.sort = 'created_at';
            apiFilters.order = 'desc';
            break;
          default:
            apiFilters.sort = 'product_name';
            apiFilters.order = 'asc';
        }
      }

      console.log('🔄 Fetching books with API filters:', apiFilters);
      
      // Use the enhanced products API endpoint directly
      const params = new URLSearchParams();
      Object.entries(apiFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.status === 200 && data.data) {
        // Normalize API books to internal Book format
        const normalizedBooks = data.data.map((apiBook: any) => mapApiBookToBook(apiBook));
        
        // Validate - filter out books with invalid IDs
        const validBooks = filterInvalidBooks(normalizedBooks);
        
        // Deduplicate - remove any duplicate entries
        const uniqueBooks = deduplicateBooks(validBooks);
        
        // No need for client-side filtering - backend handles it
        setBooks(uniqueBooks);
        setTotalResults(data.meta?.total || uniqueBooks.length);
        console.log(`✅ Loaded ${uniqueBooks.length} books (${data.meta?.total || 'unknown'} total)`);
      } else {
        // Handle empty results
        setBooks([]);
        setTotalResults(0);
        console.log('📭 No books found matching current filters');
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error);
      logError('Failed to fetch books', error);
      
      setError(errorMessage);
      setBooks([]);
      setTotalResults(0);
      
      toast({
        title: "Failed to Load Books",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Initial load - fetch categories and books
  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, [retryCount]);

  // Debounced search function to avoid too many API calls
  const debouncedFetchBooks = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (resetPage = false) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchBooks(resetPage);
        }, searchTerm ? 500 : 0); // 500ms delay for search, immediate for other filters
      };
    })(),
    [searchTerm, sortBy, categoryFilter, subcategoryFilter, minPrice, maxPrice, isLatestReleasesPage, currentPage]
  );

  // Refetch books when filters change
  useEffect(() => {
    if (!loading) { // Don't refetch during initial load
      debouncedFetchBooks(true); // Reset to page 1 when filters change
    }
  }, [searchTerm, sortBy, categoryFilter, subcategoryFilter, minPrice, maxPrice, isLatestReleasesPage]);

  // Get subcategories for selected category
  const availableSubcategories = useMemo(() => {
    if (!categoryFilter) return [];
    
    const selectedCategory = availableCategories.find(cat => cat.slug === categoryFilter);
    return selectedCategory?.children || [];
  }, [categoryFilter, availableCategories]);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('product_name');
    setCategoryFilter('');
    setSubcategoryFilter('');
    setMinPrice(0);
    setMaxPrice(0);
  };

  const hasActiveFilters = searchTerm || categoryFilter || subcategoryFilter || sortBy !== 'product_name' || minPrice > 0 || maxPrice > 0;

  const handleRetry = () => {
    setLoading(true);
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return <AllBooksPageSkeleton />;
  }

  // Error state with retry functionality
  if (error && books.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Load Books
            </h3>
            <p className="text-red-600 mb-2">{error}</p>
            {hasActiveFilters && (
              <p className="text-sm text-red-500 mb-4">
                This error occurred while searching with your current filters. 
                You can try clearing filters or retrying the search.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={handleRetry}
                className="inline-flex items-center gap-2"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="secondary"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          {isLatestReleasesPage ? 'Latest Releases' : 'Our Books'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {isLatestReleasesPage 
            ? 'Discover our newest publications and recent releases.' 
            : 'Browse our spiritual and religious categories.'
          }
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4" hidden>
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books, authors, or descriptions..."
            className="pl-10 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isSearching && searchTerm && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <SearchLoadingSpinner />
            </div>
          )}
          {searchTerm && !isSearching && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 justify-center items-center">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_name">Title A-Z</SelectItem>
                <SelectItem value="author">Author A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          {categoriesLoading ? (
            <CategoryFilterSkeleton />
          ) : (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Category:</label>
              <Select 
                value={categoryFilter || 'all'} 
                onValueChange={(value) => {
                  setCategoryFilter(value === 'all' ? '' : value);
                  setSubcategoryFilter(''); // Clear subcategory when category changes
                }}
                disabled={categoriesLoading}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map(category => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.name} ({category.book_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subcategory Filter - only show if category is selected */}
          {categoryFilter && availableSubcategories.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Subcategory:</label>
              <Select value={subcategoryFilter || 'all'} onValueChange={(value) => setSubcategoryFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {availableSubcategories.map(subcategory => (
                    <SelectItem key={subcategory.slug} value={subcategory.slug}>
                      {subcategory.name} ({subcategory.book_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Price:</label>
            <Input
              type="number"
              placeholder="Min ₹"
              className="w-20"
              value={minPrice || ''}
              onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max ₹"
              className="w-20"
              value={maxPrice || ''}
              onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 justify-center">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:bg-gray-300 rounded-full">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {categoryFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {availableCategories.find(cat => cat.slug === categoryFilter)?.name || categoryFilter}
                <button onClick={() => setCategoryFilter('')} className="ml-1 hover:bg-gray-300 rounded-full">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {subcategoryFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Subcategory: {availableSubcategories.find(sub => sub.slug === subcategoryFilter)?.name || subcategoryFilter}
                <button onClick={() => setSubcategoryFilter('')} className="ml-1 hover:bg-gray-300 rounded-full">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(minPrice > 0 || maxPrice > 0) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Price: ₹{minPrice || 0} - ₹{maxPrice || '∞'}
                <button onClick={() => { setMinPrice(0); setMaxPrice(0); }} className="ml-1 hover:bg-gray-300 rounded-full">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results Count and Loading State */}
        <div className="text-center text-sm text-muted-foreground">
          {isSearching ? (
            <FilterLoadingIndicator 
              message={`Searching${searchTerm ? ` for "${searchTerm}"` : ''}...`} 
            />
          ) : hasActiveFilters ? (
            <div className="space-y-1 animate-in fade-in-0 duration-300">
              <div>
                Showing {books.length} {books.length === 1 ? 'result' : 'results'}
                {totalResults > books.length && ` of ${totalResults} total`}
              </div>
              {searchTerm && (
                <div className="text-xs">
                  Search results for: <span className="font-medium">"{searchTerm}"</span>
                </div>
              )}
            </div>
          ) : (
            <span className="animate-in fade-in-0 duration-300">
              {totalResults} books available in our catalog
            </span>
          )}
        </div>
      </div>

      {/* Progressive Loading Toggle */}
      <div className="text-center mb-4" hidden>
        <Button
          variant="outline"
          onClick={() => setUseProgressiveLoading(!useProgressiveLoading)}
          className="mb-4"
        >
          {useProgressiveLoading ? 'Use Standard Loading' : 'Use Progressive Loading'}
        </Button>
      </div>

      {/* Books Display */}
      {useProgressiveLoading ? (
        <ProgressiveBookGrid
          searchTerm={searchTerm}
          sortBy={sortBy}
          categoryFilter={categoryFilter}
          minPrice={minPrice}
          maxPrice={maxPrice}
          isLatestReleasesPage={isLatestReleasesPage}
        />
      ) : (
        <div className="space-y-16">
          {/* Show filtered books if there are active filters or if we have books */}
          {hasActiveFilters || books.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                {hasActiveFilters ? 'Search Results' : (isLatestReleasesPage ? 'Latest Releases' : 'All Books')}
              </h2>
              <SmoothLoadingTransition
                isLoading={isSearching}
                loadingSkeleton={<FilteringBookGridSkeleton count={books.length || 8} />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {books.length > 0 ? (
                    books.map((book, index) => {
                      const bookData = book.title ? book : mapApiBookToBook(book);
                      
                      return (
                        <div
                          key={bookData.id}
                          className="bg-white p-4 rounded-xl shadow hover:shadow-md transition space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                        <Link to={`/book/${bookData.slug}`} state={{ book: bookData }}>
                          <img
                            src={bookData.images?.[0] || "/img/book-categori/01.png"}
                            alt={bookData.title}
                            className="w-full h-56 object-cover rounded-md mb-3"
                            onError={(e) => {
                              e.currentTarget.src = '/img/book-categori/01.png';
                            }}
                          />
                        </Link>

                        <Link
                          to={`/book/${bookData.slug}`}
                          state={{ book: bookData }}
                          className="font-semibold line-clamp-2 hover:text-primary transition-colors"
                        >
                          {bookData.title}
                        </Link>

                        <p className="text-sm text-gray-500">by {bookData.authors?.[0]?.name || 'Unknown Author'}</p>

                        <div className="flex items-center space-x-1 text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < Math.floor(bookData.rating || 4) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="text-xs text-gray-500">({bookData.rating || 4.0})</span>
                        </div>

                        <div className="flex flex-wrap gap-1 text-xs text-gray-500">
                          <Badge variant="outline">{bookData.currency} {bookData.price}</Badge>
                          {bookData.pages && (
                            <Badge variant="outline">{bookData.pages} pages</Badge>
                          )}
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                          <div>
                            <p className="text-lg font-bold text-red-600">₹{parseFloat(String(bookData.price)).toFixed(2)}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              addToCart(bookData);
                              sonnerToast.success(`${bookData.title} added to cart`);
                            }}
                            className="shrink-0"
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Add to Cart
                          </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-12 animate-in fade-in-0 duration-500">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      {hasActiveFilters ? 'No books match your current filters' : 'No books found'}
                    </h3>
                    <div className="text-sm text-muted-foreground mb-4 space-y-1">
                      {hasActiveFilters ? (
                        <>
                          <p>We couldn't find any books matching your search criteria:</p>
                          <div className="flex flex-wrap gap-2 justify-center mt-2">
                            {searchTerm && (
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                Search: "{searchTerm}"
                              </span>
                            )}
                            {categoryFilter && (
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                Category: {availableCategories.find(cat => cat.slug === categoryFilter)?.name || categoryFilter}
                              </span>
                            )}
                            {subcategoryFilter && (
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                Subcategory: {availableSubcategories.find(sub => sub.slug === subcategoryFilter)?.name || subcategoryFilter}
                              </span>
                            )}
                            {(minPrice > 0 || maxPrice > 0) && (
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                Price: ₹{minPrice || 0} - ₹{maxPrice || '∞'}
                              </span>
                            )}
                          </div>
                          <p className="mt-3">Try adjusting your search criteria or browse our categories below.</p>
                        </>
                      ) : (
                        <p>Please try again later or contact support if this problem persists.</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear all filters
                        </Button>
                      )}
                      <Button variant="default" asChild>
                        <Link to="/books">Browse all categories</Link>
                      </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SmoothLoadingTransition>
            </div>
          ) : (
            /* Show category overview when no filters are active and no books loaded */
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">Browse by Category</h2>
              <p className="text-center text-muted-foreground mb-8">
                Explore our collection organized by categories. Each category shows the current number of available books.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {categoriesLoading ? (
                  // Show loading skeletons for categories
                  [...Array(4)].map((_, index) => (
                    <div 
                      key={index} 
                      className="bg-white p-6 rounded-xl shadow animate-pulse animate-in fade-in-0 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
                      </div>
                    </div>
                  ))
                ) : availableCategories.length > 0 ? (
                  availableCategories.map((category, index) => (
                    <div 
                      key={category.slug} 
                      className="bg-white p-6 rounded-xl shadow hover:shadow-md transition animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <button 
                        onClick={() => setCategoryFilter(category.slug)}
                        className="block w-full group text-left"
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <div className="w-8 h-8 bg-primary rounded-sm"></div>
                          </div>
                          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {category.book_count} {category.book_count === 1 ? 'book' : 'books'} available
                          </p>
                          {category.children && category.children.length > 0 && (
                            <p className="text-xs text-muted-foreground mb-4">
                              {category.children.length} subcategories
                            </p>
                          )}
                          <div className="text-primary font-medium text-sm group-hover:underline">
                            Browse Books →
                          </div>
                        </div>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 animate-in fade-in-0 duration-500">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground mb-2">No categories available</p>
                    <p className="text-sm text-muted-foreground">
                      Categories will appear here once books are added to the catalog.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllBooks;
