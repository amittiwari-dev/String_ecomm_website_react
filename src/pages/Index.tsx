import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import BookCard from '@/components/BookCard';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import { useState, useEffect } from 'react';
import { BookIcon, ShoppingCart, Star } from "lucide-react";

import { useToast } from '@/hooks/use-toast';
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast as sonnerToast } from "sonner";

const Index = () => {
  const [books, setBooks] = useState([]);

  // Add new category states
  const [shirdiBooks, setShirdiBooks] = useState([]);
  const [otherReligious, setOtherReligious] = useState([]);
  const [coffeeTableBooks, setCoffeeTableBooks] = useState([]);
  const [textBooks, setTextBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Debug logging
  console.log('Index component rendered');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Loading state:', loading);
  console.log('Books count:', books.length);

  const fetchCategory = async (slug) => {
    try {
      if (!API_BASE_URL) {
        console.warn(`API_BASE_URL not configured for category ${slug}, using mock data`);
        const { getBooksByCategory, getCategoriesByParent } = await import('@/data/mockData');
        
        // Map slug to category ID
        const categoryMap = {
          'books-on-shirdi-sai-baba': '2',
          'other-religious-books': '3', 
          'coffee-table-books-and-paperbacks': '4',
          'text-book': '5'
        };
        
        const categoryId = categoryMap[slug];
        if (categoryId) {
          return getBooksByCategory(categoryId).slice(0, 5);
        }
        return [];
      }

      const response = await fetch(`${API_BASE_URL}book/${slug}`);
      const data = await response.json();

      if (data.status === 200 && Array.isArray(data.records)) {
        return data.records;
      }

      return [];
    } catch (error) {
      console.warn(`Failed to fetch category ${slug}, using mock data:`, error);
      
      // Fallback to mock data
      try {
        const { getBooksByCategory } = await import('@/data/mockData');
        const categoryMap = {
          'books-on-shirdi-sai-baba': '2',
          'other-religious-books': '3', 
          'coffee-table-books-and-paperbacks': '4',
          'text-book': '5'
        };
        
        const categoryId = categoryMap[slug];
        if (categoryId) {
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

        const response = await fetch(`${API_BASE_URL}new-note`);
        if (!response.ok) throw new Error('Failed to fetch books');

        const data = await response.json();

        if (data.status === 200 && Array.isArray(data.records)) {
          setBooks(data.records);
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
