import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Star, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast as sonnerToast } from "sonner";
import { Book } from '@/data/mockData';
import { useUrlStringState, useUrlNumberState } from '@/hooks/useUrlState';
import { AllBooksPageSkeleton } from '@/components/ui/book-skeleton';
import { ProgressiveBookGrid } from '@/components/ProgressiveBookGrid';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const mapApiBookToBook = (api: any): Book => {
  const price = Number(api.price) || 0;
  const idStr = api.id != null ? String(api.id) : (api.product_slug || '0');
  const slug = api.product_slug || idStr;
  const cover = api.product_image
    ? `http://localhost:8000/images/products/${api.product_image}`
    : '/img/book-categori/01.png';

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

const AllBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useProgressiveLoading, setUseProgressiveLoading] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const location = useLocation();
  
  // Check if we're on the latest-releases route
  const isLatestReleasesPage = location.pathname === '/latest-releases';

  // URL state for search and filters
  const [searchTerm, setSearchTerm] = useUrlStringState('search', '');
  const [sortBy, setSortBy] = useUrlStringState('sort', 'title');
  const [categoryFilter, setCategoryFilter] = useUrlStringState('category', '');
  const [minPrice, setMinPrice] = useUrlNumberState('minPrice', 0);
  const [maxPrice, setMaxPrice] = useUrlNumberState('maxPrice', 0);

  // Decode URL category parameter properly
  const decodedCategoryFilter = categoryFilter ? decodeURIComponent(categoryFilter) : '';

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // In development mode, use mock data
        if (import.meta.env.DEV) {
          // Import mock data dynamically
          const { books: mockBooks } = await import('@/data/mockData');
          setBooks(mockBooks);
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}new-books`);
        if (!response.ok) throw new Error('Failed to fetch books');

        const data = await response.json();

        if (data.status === 200 && Array.isArray(data.records)) {
          setBooks(data.records);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error(error);
        // Fallback to mock data on error
        try {
          const { books: mockBooks } = await import('@/data/mockData');
          setBooks(mockBooks);
        } catch (fallbackError) {
          toast({
            title: "Error",
            description: "Failed to load books.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [toast]);

  // Filter and sort books based on URL state
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = books;

    // Filter for latest releases if on that page
    if (isLatestReleasesPage) {
      // For latest releases, show books with is_latest_release flag or recent books
      filtered = filtered.filter(book => {
        // Check if book has is_latest_release flag
        if (book.is_latest_release === true) return true;
        
        // Or check if it's a recent book (higher ID numbers indicate newer books)
        const bookId = parseInt(book.id) || 0;
        return bookId >= 15; // Show books with ID 15 and above as latest releases
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(book => {
        // Handle both API format and mock data format
        const title = book.title || book.product_name || '';
        const description = book.description || book.product_description || '';
        const authorName = book.authors?.[0]?.name || book.author_name || '';
        
        return (
          title.toLowerCase().includes(searchLower) ||
          authorName.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by category using fixed category mapping
    if (decodedCategoryFilter) {
      filtered = filtered.filter(book => {
        // Map category filter to category IDs
        const categoryMap = {
          'Books on Shirdi Sai Baba': '2',
          'Other Religious Books': '3',
          'Coffee Table Books and Paperbacks': '4', 
          'Text Books': '5'
        };
        
        const expectedCategoryId = categoryMap[decodedCategoryFilter];
        const bookCategoryId = book.category_id || book.category?.id;
        
        // Check direct match or subcategory match
        return bookCategoryId === expectedCategoryId || 
               (bookCategoryId && bookCategoryId.startsWith(expectedCategoryId));
      });
    }

    // Filter by price range
    if (minPrice > 0 || maxPrice > 0) {
      filtered = filtered.filter(book => {
        const price = Number(book.price) || 0;
        const minCheck = minPrice > 0 ? price >= minPrice : true;
        const maxCheck = maxPrice > 0 ? price <= maxPrice : true;
        return minCheck && maxCheck;
      });
    }

    // Sort books
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          const titleA = a.title || a.product_name || '';
          const titleB = b.title || b.product_name || '';
          return titleA.localeCompare(titleB);
        case 'author':
          const authorA = a.authors?.[0]?.name || a.author_name || '';
          const authorB = b.authors?.[0]?.name || b.author_name || '';
          return authorA.localeCompare(authorB);
        case 'price-low':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'price-high':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'newest':
          const dateA = new Date(a.publication_date || 0).getTime();
          const dateB = new Date(b.publication_date || 0).getTime();
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [books, searchTerm, sortBy, decodedCategoryFilter, minPrice, maxPrice, isLatestReleasesPage]);

  // Fixed categories like Index page - no dynamic loading
  const availableCategories = useMemo(() => {
    return [
      'Books on Shirdi Sai Baba',
      'Other Religious Books', 
      'Coffee Table Books and Paperbacks',
      'Text Books'
    ];
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('title');
    setCategoryFilter('');
    setMinPrice(0);
    setMaxPrice(0);
  };

  const hasActiveFilters = searchTerm || decodedCategoryFilter || sortBy !== 'title' || minPrice > 0 || maxPrice > 0;

  if (loading) {
    return <AllBooksPageSkeleton />;
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
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books, authors, or descriptions..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="author">Author A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Category:</label>
            <Select value={categoryFilter || 'all'} onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            {decodedCategoryFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {decodedCategoryFilter}
                <button onClick={() => setCategoryFilter('')} className="ml-1 hover:bg-gray-300 rounded-full">
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

        {/* Results Count - only show when filters are active */}
        {hasActiveFilters && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {filteredAndSortedBooks.length} of {books.length} books
          </div>
        )}
      </div>

      {/* Progressive Loading Toggle */}
      <div className="text-center mb-4">
        <Button
          variant="outline"
          onClick={() => setUseProgressiveLoading(!useProgressiveLoading)}
          className="mb-4"
        >
          {useProgressiveLoading ? 'Use Standard Loading' : 'Use Progressive Loading'}
        </Button>
      </div>

      {/* Books by Categories */}
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
          {/* Show filtered books if there are active filters */}
          {hasActiveFilters ? (
            <div>
              <h2 className="text-2xl font-bold mb-6">Search Results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredAndSortedBooks.length > 0 ? (
                  filteredAndSortedBooks.map((book) => {
                    const bookData = book.title ? book : mapApiBookToBook(book);
                    
                    return (
                      <div
                        key={bookData.id}
                        className="bg-white p-4 rounded-xl shadow hover:shadow-md transition space-y-3"
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
                  <div className="col-span-full text-center py-12">
                    <p className="text-lg text-muted-foreground mb-2">No books match your current filters.</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Show only category headers when no filters are active */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {availableCategories.map((categoryName) => {
                const categoryMap = {
                  'Books on Shirdi Sai Baba': '2',
                  'Other Religious Books': '3',
                  'Coffee Table Books and Paperbacks': '4', 
                  'Text Books': '5'
                };
                
                const categoryId = categoryMap[categoryName];
                const categoryBooks = books.filter(book => {
                  const bookCategoryId = book.category_id || book.category?.id;
                  return bookCategoryId === categoryId || 
                         (book.category_id && book.category_id.startsWith(categoryId));
                });

                const bookCount = categoryBooks.length;

                return (
                  <div key={categoryName} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
                    <Link 
                      to={`/books?category=${encodeURIComponent(categoryName)}`}
                      className="block group"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                          <div className="w-8 h-8 bg-primary rounded-sm"></div>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                          {categoryName}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {bookCount} {bookCount === 1 ? 'book' : 'books'} available
                        </p>
                        <div className="text-primary font-medium text-sm group-hover:underline">
                          Browse Books →
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllBooks;
