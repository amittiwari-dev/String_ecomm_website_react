import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { QUERY_CONFIG } from '@/lib/queryConfig';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  authors: Array<{
    id: string;
    name: string;
  }>;
}

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { toast } = useToast();

  // Use React Query to fetch featured books
  const { 
    data: booksResponse, 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: queryKeys.books.featured(),
    queryFn: BookService.getFeaturedBooks,
    ...QUERY_CONFIG.CONTENT_DATA,
  });

  const books = booksResponse?.data?.slice(0, 5) || [];

  useEffect(() => {
    if (books.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % books.length);
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [books.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + books.length) % books.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % books.length);
  };

  if (loading) {
    return (
      <section className="relative w-full h-[500px] overflow-hidden bg-gradient-to-r from-primary/10 to-white animate-in fade-in-0 duration-500">
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded w-96 mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-64 mx-auto"></div>
              <div className="h-10 bg-gray-200 rounded w-32 mx-auto"></div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Loading featured books...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || books.length === 0) {
    return (
      <section className="relative w-full h-[500px] overflow-hidden bg-gradient-to-r from-primary/10 to-white">
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Unable to Load Featured Books
                </h3>
                <p className="text-red-600 mb-4">
                  {error instanceof Error ? error.message : 'Failed to load featured books'}
                </p>
                <Button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Sterling Publishers</h1>
                <p className="text-xl text-muted-foreground mb-8">Discover our collection of quality books</p>
                <Button asChild>
                  <Link to="/books">Browse Books</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[500px] overflow-hidden bg-gradient-to-r from-sterling-red-light to-white">
      <div className="container mx-auto px-4 h-full">
        <div className="relative h-full">
          {/* Slides */}
          <div className="relative h-full flex items-center">
            {books.map((book, index) => (
              <div
                key={book.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="grid md:grid-cols-2 gap-8 h-full items-center">
                  {/* Content */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                        {book.title}
                      </h1>
                      {book.subtitle && (
                        <p className="text-xl text-muted-foreground">
                          {book.subtitle}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {book.description.substring(0, 200)}...
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">By</span>
                      <span className="font-medium">
                        {book.authors.map(author => author.name).join(', ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-3xl font-bold text-primary">
                        ₹{book.price}
                      </div>
                      <div className="flex space-x-3">
                        <Button asChild>
                          <Link to={`/book/${book.id}-${book.slug}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button variant="outline">
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Book Cover */}
                  <div className="flex justify-center">
                    <Card className="w-64 shadow-2xl">
                      <CardContent className="p-0">
                        <img
                          src={book.images[0]}
                          alt={book.title}
                          className="w-full h-80 object-cover rounded-lg"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
            {books.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-primary' : 'bg-white/50'
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;