import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string;
  socials?: {
    website?: string;
  };
}

const AuthorCarousel = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAuthors = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // For now, show a placeholder message since we don't have an authors API endpoint
      // In a real implementation, this would fetch from an API
      setAuthors([]);
      
      toast({
        title: "Authors Section",
        description: "Author profiles will be available soon",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to fetch authors:', error);
      setError('Failed to load authors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || authors.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Featured Authors
              </h3>
              <p className="text-gray-600 mb-4">
                Author profiles and information will be available soon.
              </p>
              <Link to="/authors">
                <Button variant="outline">
                  Learn More About Our Authors
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Authors</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Meet the talented writers behind our exceptional publications
          </p>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {authors.map((author) => (
              <CarouselItem key={author.id} className="md:basis-1/2 lg:basis-1/3">
                <Card className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Link to={`/author/${author.slug}`}>
                      {/* Author Photo Placeholder */}
                      <div className="mb-4">
                        <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                          {author.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {author.name}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {author.bio}
                      </p>
                      
                      {author.socials?.website && (
                        <div className="mt-4">
                          <span className="text-xs text-primary hover:underline">
                            Visit Website →
                          </span>
                        </div>
                      )}
                    </Link>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        
        <div className="text-center mt-8">
          <Link 
            to="/authors"
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            View All Authors →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AuthorCarousel;