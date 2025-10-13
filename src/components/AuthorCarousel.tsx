import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { authors } from '@/data/mockData';

const AuthorCarousel = () => {
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