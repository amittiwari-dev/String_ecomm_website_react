import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import BookCard from '@/components/BookCard';
import { Book } from '@/data/mockData';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import { useState, useEffect } from 'react';
import { BookIcon, ShoppingCart, Star } from "lucide-react";

import { useToast } from '@/hooks/use-toast';
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast as sonnerToast } from "sonner";

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
        cover = `http://127.0.0.1:8000/storage/products/${apiBook.product_image}`;
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
  const [books, setBooks] = useState<Book[]>([]);

  // Add new category states
  const [shirdiBooks, setShirdiBooks] = useState<Book[]>([]);
  const [otherReligious, setOtherReligious] = useState<Book[]>([]);
  const [coffeeTableBooks, setCoffeeTableBooks] = useState<Book[]>([]);
  const [textBooks, setTextBooks] = useState<Book[]>([]);

  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Debug logging
  console.log('Index component rendered');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Loading state:', loading);
  console.log('Books count:', books.length);

  const fetchCategory = async (slug: string): Promise<Book[]> => {
    try {
      if (!API_BASE_URL) {
        console.warn(`API_BASE_URL not configured for category ${slug}, using mock data`);
        const { getBooksByCategory } = await import('@/data/mockData');
        
        // Map slug to category ID
        const categoryMap: Record<string, string> = {
          'books-on-shirdi-sai-baba': '2',
          'other-religious-books': '3', 
          'coffee-table-books-and-paperbacks': '4',
          'text-book': '5'
        };
        
        const categoryId = categoryMap[slug];
        if (categoryId) {
          // Mock data is already in Book format
          return getBooksByCategory(categoryId).slice(0, 5);
        }
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/book/${slug}`);
      const data = await response.json();

      if (data.status === 200 && Array.isArray(data.records)) {
        // Filter out books with invalid IDs
        const validBooks = data.records.filter((book: any) => {
          const hasValidId = book.id && book.id !== 0 && book.id !== '0';
          if (!hasValidId) {
            console.warn(`⚠️ Skipping ${slug} book with invalid ID:`, book.product_name);
          }
          return hasValidId;
        });
        
        // Normalize API books to internal Book format
        return validBooks.map((apiBook: any) => normalizeApiBook(apiBook));
      }

      return [];
    } catch (error) {
      console.warn(`Failed to fetch category ${slug}, using mock data:`, error);
      
      // Fallback to mock data
      try {
        const { getBooksByCategory } = await import('@/data/mockData');
        const categoryMap: Record<string, string> = {
          'books-on-shirdi-sai-baba': '2',
          'other-religious-books': '3', 
          'coffee-table-books-and-paperbacks': '4',
          'text-book': '5'
        };
        
        const categoryId = categoryMap[slug];
        if (categoryId) {
          // Mock data is already in Book format
          return getBooksByCategory(categoryId).slice(0, 5);
        }
      } catch (mockError) {
        console.error(`Mock data failed for ${slug}:`, mockError);
      }
      
      return [];
    }
  };

  // Fetch New & Noteworthy
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        if (!API_BASE_URL) {
          console.warn('API_BASE_URL not configured, using mock data');
          // Use mock data as fallback
          const { getLatestReleases } = await import('@/data/mockData');
          setBooks(getLatestReleases().slice(0, 8));
          return;
        }

        // Try new-books endpoint first (returns more products)
        let response = await fetch(`${API_BASE_URL}/new-books`);
        
        // If new-books fails, try new-note
        if (!response.ok) {
          console.warn('new-books endpoint failed, trying new-note...');
          response = await fetch(`${API_BASE_URL}/new-note`);
        }
        
        if (!response.ok) throw new Error('Failed to fetch books from both endpoints');

        const data = await response.json();

        if (data.status === 200 && Array.isArray(data.records)) {
          // Filter out books with invalid IDs (0 or null)
          const validBooks = data.records.filter((book: any) => {
            const hasValidId = book.id && book.id !== 0 && book.id !== '0';
            if (!hasValidId) {
              console.warn(`⚠️ Skipping book with invalid ID:`, book.product_name, book.id);
            }
            return hasValidId;
          });
          
          if (validBooks.length === 0) {
            throw new Error('No valid books found in API response');
          }
          
          // Log first book to check data structure
          if (validBooks.length > 0) {
            console.log('📚 Sample valid book from API:', validBooks[0]);
            console.log('Book ID:', validBooks[0].id, 'Type:', typeof validBooks[0].id);
          }
          
          // Normalize API books to internal Book format
          const normalizedBooks = validBooks.map((apiBook: any) => {
            const normalized = normalizeApiBook(apiBook);
            console.log(`📖 Normalized: ${normalized.title} → ID: ${normalized.id}`);
            return normalized;
          }).slice(0, 8); // Take only first 8 books
          
          setBooks(normalizedBooks);
          console.log(`✅ Loaded ${normalizedBooks.length} valid books for home page`);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('API failed, using mock data:', error);
        // Fallback to mock data
        try {
          const { getLatestReleases } = await import('@/data/mockData');
          setBooks(getLatestReleases().slice(0, 8));
        } catch (mockError) {
          console.error('Mock data also failed:', mockError);
          toast({
            title: "Error",
            description: "Failed to load books.",
            variant: "destructive",
          });
        }
      }
    };

    fetchBooks();
  }, [toast]);

  // Fetch all category sections
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Loading categories...');
        setShirdiBooks(await fetchCategory('books-on-shirdi-sai-baba'));
        setOtherReligious(await fetchCategory('other-religious-books'));
        setCoffeeTableBooks(await fetchCategory('coffee-table-books-and-paperbacks'));
        setTextBooks(await fetchCategory('text-book'));
        console.log('Categories loaded successfully');
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    console.log('Showing loading state...');
    return (
      <div className="min-h-screen bg-white">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading books...</p>
          <p className="text-xs text-gray-400 mt-2">API: {API_BASE_URL || 'Not configured'}</p>
        </div>
      </div>
    );
  }

  console.log('Rendering main content...');

  return (
    <div>
      {/* Hero Carousel */}
      <HeroCarousel />
      
      {/* New & Noteworthy Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">New & Noteworthy</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our latest releases and most popular titles
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.length > 0 ? (
              books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                No books found.
              </div>
            )}
          </div>
        </div>  
      </section>
      
      {/* Category Grid */}
      <CategoryGrid />
      
      {/* Shirdi Books */}
      <section className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-left mb-2">Books on Shirdi Sai Baba</h2>
              <div className="w-16 h-1 bg-primary"></div>
            </div>
            <Link 
              to="/books?category=shirdi-sai-baba" 
              className="text-primary hover:underline font-medium"
            >
              View All Books →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {shirdiBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Other Religious Books */}
      <section className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-left mb-2">Other Religious Books</h2>
              <div className="w-16 h-1 bg-primary"></div>
            </div>
            <Link 
              to="/books?category=other-religious" 
              className="text-primary hover:underline font-medium"
            >
              View All Books →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {otherReligious.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Coffee Table Books */}
      <section className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-left mb-2">Coffee Table Books and Paperbacks</h2>
              <div className="w-16 h-1 bg-primary"></div>
            </div>
            <Link 
              to="/books?category=coffee-table-paperbacks" 
              className="text-primary hover:underline font-medium"
            >
              View All Books →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {coffeeTableBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Text Books */}
      <section className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-left mb-2">Text Books</h2>
              <div className="w-16 h-1 bg-primary"></div>
            </div>
            <Link 
              to="/books?category=textbooks" 
              className="text-primary hover:underline font-medium"
            >
              View All Books →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {textBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Index;
