import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Book } from '@/data/mockData';

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { toast } = useToast();

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: `${book.title} ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`,
    });
  };

  const handleAddToCart = () => {
    toast({
      title: "Added to cart",
      description: `${book.title} has been added to your cart.`,
    });
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Book Cover */}
        <div className="relative overflow-hidden">
          {/* Bestseller Badge */}
          {book.bestseller_rank && book.bestseller_rank <= 10 && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-accent text-accent-foreground font-bold">
                BESTSELLER
              </Badge>
            </div>
          )}
          
          <Link to={`/book/${book.slug}`}>
            <img
              src={book.images[0]}
              alt={book.title}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={handleWishlist}
          >
            <Heart 
              className={`h-4 w-4 ${isWishlisted ? 'fill-primary text-primary' : ''}`} 
            />
          </Button>

          {/* New Release Badge */}
          <div className="absolute bottom-2 left-2">
            {book.is_latest_release && (
              <Badge className="bg-primary text-primary-foreground">
                New Release
              </Badge>
            )}
          </div>
        </div>

        {/* Book Details */}
        <div className="p-4 space-y-3">
          <div>
            <Link 
              to={`/book/${book.slug}`}
              className="font-semibold line-clamp-2 hover:text-primary transition-colors"
            >
              {book.title}
            </Link>
            {book.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                {book.subtitle}
              </p>
            )}
          </div>

          {/* Authors */}
          <p className="text-sm text-muted-foreground">
            by {book.authors.map(author => author.name).join(', ')}
          </p>

          {/* Rating */}
          {book.rating && (
            <div className="flex items-center space-x-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(book.rating!) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({book.rating})
              </span>
            </div>
          )}

          {/* Format, Language, Pages */}
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground mb-2">
            <Badge variant="outline" className="text-xs">
              {book.format}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {book.language}
            </Badge>
            {book.pages && (
              <Badge variant="outline" className="text-xs">
                {book.pages} pages
              </Badge>
            )}
          </div>

          {/* ISBN & Publication Date */}
          <div className="space-y-1 text-xs text-muted-foreground mb-3">
            {book.isbn13 && (
              <p>ISBN: {book.isbn13}</p>
            )}
            <p>Published: {new Date(book.publication_date).getFullYear()}</p>
          </div>

          {/* Series Info */}
          {book.series && (
            <p className="text-xs text-primary font-medium mb-2">
              Part of: {book.series}
            </p>
          )}

          {/* Price and Actions */}
          <div className="flex items-end justify-between pt-2">
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">
                ₹{book.price}
              </div>
              <div className="text-xs text-muted-foreground">
                {book.stock_status}
              </div>
            </div>
            
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={book.stock_status === 'Out of Stock'}
              className="shrink-0"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;