import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useToast } from '@/hooks/use-toast';
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast as sonnerToast } from "sonner";
import { Book } from '@/data/mockData';
import { useProgressiveLoading } from '@/hooks/useInfiniteScroll';
import { ProgressiveLoading, LoadingMoreSkeleton } from '@/components/ui/progressive-loading';
import { BookGridSkeleton } from '@/components/ui/book-skeleton';

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

interface ProgressiveBookGridProps {
  searchTerm?: string;
  sortBy?: string;
  categoryFilter?: string;
  minPrice?: number;
  maxPrice?: number;
  isLatestReleasesPage?: boolean;
}

export const ProgressiveBookGrid = ({
  searchTerm = '',
  sortBy = 'title',
  categoryFilter = '',
  minPrice = 0,
  maxPrice = 0,
  isLatestReleasesPage = false
}: ProgressiveBookGridProps) => {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [allBooks, setAllBooks] = useState<any[]>([]);

  // Load more books function
  const loadMoreBooks = useCallback(async (page: number) => {
    try {
      // In development mode, use mock data
      if (import.meta.env.DEV) {
        const { books: mockBooks } = await import('@/data/mockData');
        const pageSize = 12;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = mockBooks.slice(startIndex, endIndex);
        
        return {
          data: pageData,
          hasMore: endIndex < mockBooks.length,
          nextPage: page + 1
        };
      }

      const response = await fetch(`${API_BASE_URL}new-books?page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch books');

      const data = await response.json();

      if (data.status === 200 && Array.isArray(data.records)) {
        // For demo purposes, we'll simulate pagination by chunking the data
        const pageSize = 12;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = data.records.slice(startIndex, endIndex);
        
        return {
          data: pageData,
          hasMore: endIndex < data.records.length,
          nextPage: page + 1
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(error);
      // Fallback to mock data on error
      try {
        const { books: mockBooks } = await import('@/data/mockData');
        const pageSize = 12;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = mockBooks.slice(startIndex, endIndex);
        
        return {
          data: pageData,
          hasMore: endIndex < mockBooks.length,
          nextPage: page + 1
        };
      } catch (fallbackError) {
        throw new Error('Failed to load books');
      }
    }
  }, []);

  // Use progressive loading
  const {
    data: books,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadNextPage,
    targetRef
  } = useProgressiveLoading({
    loadMore: loadMoreBooks,
    initialPage: 1,
    pageSize: 12,
    enabled: true
  });

  // Store all books for filtering
  useEffect(() => {
    setAllBooks(books);
  }, [books]);

  // Filter and sort books based on props
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = allBooks;

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
    if (categoryFilter) {
      // Decode URL category parameter properly
      const decodedCategoryFilter = decodeURIComponent(categoryFilter);
      
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
  }, [allBooks, searchTerm, sortBy, categoryFilter, minPrice, maxPrice, isLatestReleasesPage]);

  if (isLoading) {
    return <BookGridSkeleton count={12} />;
  }

  return (
    <div ref={targetRef} className="space-y-8">
      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredAndSortedBooks.length > 0 ? (
          filteredAndSortedBooks.map((book) => {
            // Handle both API format and mock data format
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

                {/* Rating */}
                <div className="flex items-center space-x-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < Math.floor(bookData.rating || 4) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="text-xs text-gray-500">({bookData.rating || 4.0})</span>
                </div>

                {/* Price and Stock Status */}
                <div className="flex flex-wrap gap-1 text-xs text-gray-500">
                  <Badge variant="outline">{bookData.currency} {bookData.price}</Badge>
                  {bookData.pages && (
                    <Badge variant="outline">{bookData.pages} pages</Badge>
                  )}
                </div>

                {/* Price + Add to Cart */}
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
            <p className="text-lg text-muted-foreground mb-2">
              {allBooks.length === 0 ? 'No books available.' : 'No books match your current filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Progressive Loading Component */}
      <ProgressiveLoading
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        onLoadMore={loadNextPage}
        onRetry={loadNextPage}
        loadingComponent={<LoadingMoreSkeleton type="cards" count={4} />}
      />
    </div>
  );
};