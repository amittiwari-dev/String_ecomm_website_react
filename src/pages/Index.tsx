import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import BookCard from '@/components/BookCard';
import { deduplicateBooks, filterInvalidBooks } from '@/utils/deduplication';
import { ContentService, HomepageSection, SectionType } from '@/services/contentService';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { BookGridSkeleton } from '@/components/ui/book-skeleton';
import { 
  HomepageLoadingSkeleton, 
  ProgressiveSectionSkeleton,
  HeroCarouselSkeleton,
  FeaturedBooksSkeleton,
  CategoryGridSkeleton,
  PromotionalBannerSkeleton
} from '@/components/ui/homepage-skeleton';
import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Link } from "react-router-dom";
import { getApiErrorMessage, validateApiConfig, logError } from '@/utils/environment';
import { queryKeys } from '@/lib/queryKeys';
import { QUERY_CONFIG, RETRY_CONFIG } from '@/lib/queryConfig';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Section component mapping for different section types
const sectionComponents: Record<SectionType, React.ComponentType<{ section: HomepageSection }>> = {
  hero_carousel: ({ section }) => <HeroCarousel />,
  featured_books: ({ section }) => <FeaturedBooksSection section={section} />,
  category_grid: ({ section }) => <CategoryGrid />,
  promotional_banner: ({ section }) => <PromotionalBannerSection section={section} />,
};

// Loading skeleton for homepage sections with smooth animations
const HomepageSectionSkeleton = ({ sectionType }: { sectionType: SectionType }) => {
  return (
    <div className="animate-in fade-in-0 duration-500">
      <ProgressiveSectionSkeleton sectionType={sectionType} />
    </div>
  );
};

// Error component for failed section loading
const SectionErrorFallback = ({ 
  error, 
  onRetry, 
  sectionType 
}: { 
  error: Error; 
  onRetry: () => void; 
  sectionType?: SectionType;
}) => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="text-center bg-red-50 border border-red-200 rounded-lg p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Failed to load {sectionType ? sectionType.replace('_', ' ') : 'section'}
        </h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  </section>
);

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

// Featured Books Section Component
const FeaturedBooksSection = ({ section }: { section: HomepageSection }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFeaturedBooks = async () => {
    try {
      setError(null);
      
      // Validate API configuration
      const apiConfig = validateApiConfig();
      if (!apiConfig.isValid) {
        throw new Error(apiConfig.error || 'API configuration error');
      }

      // Use the product IDs from section content if available
      const productIds = section.content.products || [];
      
      if (productIds.length > 0) {
        // Fetch specific products by IDs
        // This would require an API endpoint that accepts multiple IDs
        // For now, fall back to the existing new books endpoint
      }
      
      // Try multiple endpoints for featured books
      let response = await fetch(`${API_BASE_URL}/new-books`);
      
      if (!response.ok) {
        response = await fetch(`${API_BASE_URL}/new-note`);
      }
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      if (data.status === 200 && Array.isArray(data.records)) {
        const normalizedBooks = data.records.map((apiBook: any) => normalizeApiBook(apiBook));
        const validBooks = filterInvalidBooks(normalizedBooks);
        const uniqueBooks = deduplicateBooks(validBooks);
        setBooks(uniqueBooks.slice(0, 8));
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error);
      logError('Failed to fetch featured books', error);
      
      setError(errorMessage);
      toast({
        title: "Failed to Load Featured Books",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedBooks();
  }, [section, toast]);

  if (loading) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <FeaturedBooksSkeleton />
      </div>
    );
  }

  if (error && books.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Failed to Load Featured Books
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchFeaturedBooks}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-top-2 duration-500">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {section.title || 'New & Noteworthy'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our latest releases and most popular titles
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.length > 0 ? (
            books.map((book, index) => (
              <div 
                key={book.id}
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <BookCard book={book} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 animate-in fade-in-0 duration-300">
              No books found.
            </div>
          )}
        </div>
      </div>  
    </section>
  );
};

// Promotional Banner Section Component
const PromotionalBannerSection = ({ section }: { section: HomepageSection }) => {
  const content = section.content;
  
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div 
          className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-white p-8 md:p-12"
          style={content.banner_image ? { 
            backgroundImage: `url(${content.banner_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          {content.banner_image && (
            <div className="absolute inset-0 bg-black/40"></div>
          )}
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            {content.banner_title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {content.banner_title}
              </h2>
            )}
            {content.banner_subtitle && (
              <p className="text-lg md:text-xl mb-6 opacity-90">
                {content.banner_subtitle}
              </p>
            )}
            {content.banner_cta_text && content.banner_cta_link && (
              <Link
                to={content.banner_cta_link}
                className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                {content.banner_cta_text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Helper function to normalize API book data to internal Book format
const normalizeApiBook = (apiBook: any): Book => {
  // Handle both string and number prices
  const price = typeof apiBook.price === 'string' ? parseFloat(apiBook.price) : Number(apiBook.price) || 0;
  
  // Handle ID - MUST be a valid numeric ID from the database
  // Never use slug as ID - it won't work with the backend
  const idStr = apiBook.id != null ? String(apiBook.id) : '0';
  
  // Handle slug
  const slug = apiBook.product_slug || apiBook.slug || idStr;
  
  // Handle image URL - check if it's a full URL or just filename
  let cover = '/img/book-categori/book-placeholder.png';
  
  if (apiBook.product_image) {
    // If product_image is already a full URL, use it as is
    if (apiBook.product_image.startsWith('http://') || apiBook.product_image.startsWith('https://')) {
      cover = apiBook.product_image;
    } else {
      // Otherwise, construct the URL
      // For local: http://127.0.0.1:8000/storage/products/image.jpg
      // For production: https://sterlingpublishers.in/publishing/images/products/image.jpg
      const isLocal = API_BASE_URL?.includes('localhost') || API_BASE_URL?.includes('127.0.0.1');
      
      if (isLocal) {
        // Local development - Laravel storage path
        cover = `http://127.0.0.1:8000/images/products/${apiBook.product_image}`;
      } else {
        // Production
        cover = `https://sterlingpublishers.in/publishing/images/products/${apiBook.product_image}`;
      }
    }
  } else if (apiBook.images && Array.isArray(apiBook.images) && apiBook.images.length > 0) {
    cover = apiBook.images[0];
  }
  
  console.log(`🖼️ Image URL for ${apiBook.product_name}: ${cover}`);

  // Handle author data
  let authors = [];
  if (apiBook.authors && Array.isArray(apiBook.authors) && apiBook.authors.length > 0) {
    authors = apiBook.authors;
  } else if (apiBook.author_name || apiBook.author_id) {
    authors = [{
      id: apiBook.author_id ? String(apiBook.author_id) : `a-${idStr}`,
      name: apiBook.author_name || 'Unknown',
      slug: (apiBook.author_name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
      bio: ''
    }];
  } else {
    authors = [{
      id: `a-${idStr}`,
      name: 'Unknown',
      slug: 'unknown',
      bio: ''
    }];
  }

  // Handle category_id
  let categoryId = '0';
  if (apiBook.category_id) {
    categoryId = String(apiBook.category_id);
  } else if (apiBook.category && apiBook.category.id) {
    categoryId = String(apiBook.category.id);
  }

  // Handle stock status
  let stockStatus: 'In Stock' | 'Out of Stock' | 'Preorder' = 'In Stock';
  if (apiBook.stock_status) {
    stockStatus = apiBook.stock_status;
  } else if (apiBook.is_active !== undefined) {
    stockStatus = apiBook.is_active === 1 || apiBook.is_active === true ? 'In Stock' : 'Out of Stock';
  }

  return {
    id: idStr,
    title: apiBook.product_name || apiBook.title || 'Untitled',
    subtitle: apiBook.subtitle || undefined,
    slug,
    description: apiBook.product_description || apiBook.description || '',
    language: apiBook.language || 'English',
    format: (apiBook.paperback_type || apiBook.format || 'Paperback') as any,
    price,
    currency: apiBook.currency || 'INR',
    publication_date: apiBook.publication_date || new Date().toISOString(),
    pages: apiBook.total_pages || apiBook.pages || undefined,
    stock_status: stockStatus,
    images: [cover],
    authors,
    category_id: categoryId,
    tags: apiBook.tags || [],
    is_latest_release: !!apiBook.is_latest_release,
    isbn10: apiBook.product_isbn || apiBook.isbn10 || undefined,
    isbn13: apiBook.isbn13 || undefined,
    rating: apiBook.rating || undefined,
  } as Book;
};

const Index = () => {
  const { toast } = useToast();

  // Fetch homepage sections using React Query with optimized caching
  const {
    data: sections,
    isLoading,
    error,
    refetch
  } = useQuery<HomepageSection[], Error>({
    queryKey: queryKeys.content.homepageSections(),
    queryFn: ContentService.getHomepageSections,
    ...QUERY_CONFIG.CONTENT_DATA,
    ...RETRY_CONFIG.DEFAULT,
  });

  // Handle errors with toast
  useEffect(() => {
    if (error) {
      console.error('Failed to fetch homepage sections:', error);
      toast({
        title: "Error",
        description: "Failed to load homepage content. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Debug logging
  console.log('Index component rendered');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Loading state:', isLoading);
  console.log('Sections:', sections);

  // Loading state with progressive skeleton loading
  if (isLoading) {
    console.log('Showing loading state...');
    return (
      <div className="min-h-screen bg-white">
        <HomepageLoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('Homepage sections error:', error);
    return (
      <div className="min-h-screen bg-white">
        <SectionErrorFallback 
          error={error as Error} 
          onRetry={() => refetch()} 
        />
      </div>
    );
  }

  // Filter active sections and sort by sort_order
  const activeSections = Array.isArray(sections) 
    ? sections
        .filter(section => section.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];

  console.log('Rendering dynamic sections:', activeSections.length);

  return (
    <div>
      {activeSections.length > 0 ? (
        activeSections.map((section) => {
          const SectionComponent = sectionComponents[section.section_type];
          
          if (!SectionComponent) {
            console.warn(`No component found for section type: ${section.section_type}`);
            return (
              <section key={section.id} className="py-16">
                <div className="container mx-auto px-4">
                  <div className="text-center text-gray-500">
                    <p>Unsupported section type: {section.section_type}</p>
                  </div>
                </div>
              </section>
            );
          }

          return (
            <div 
              key={section.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-700"
              style={{ animationDelay: `${activeSections.indexOf(section) * 200}ms` }}
            >
              <SectionComponent section={section} />
            </div>
          );
        })
      ) : (
        // Fallback content when no sections are configured
        <div className="min-h-screen bg-white">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Welcome to Sterling Publishers</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your trusted source for quality books and publications
              </p>
              <Link 
                to="/books" 
                className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Browse Our Catalog
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
