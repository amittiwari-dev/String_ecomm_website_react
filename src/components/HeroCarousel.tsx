import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getLatestReleases } from '@/data/mockData';

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const latestBooks = getLatestReleases().slice(0, 5); // Show top 5 latest releases

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % latestBooks.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [latestBooks.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + latestBooks.length) % latestBooks.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % latestBooks.length);
  };

  if (latestBooks.length === 0) return null;

  return (
    <section className="relative w-full h-[500px] overflow-hidden bg-gradient-to-r from-sterling-red-light to-white">
      <div className="container mx-auto px-4 h-full">
        <div className="relative h-full">
          {/* Slides */}
          <div className="relative h-full flex items-center">
            {latestBooks.map((book, index) => (
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
                          <Link to={`/book/${book.slug}`}>
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
            {latestBooks.map((_, index) => (
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