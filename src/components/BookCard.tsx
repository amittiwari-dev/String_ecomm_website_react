import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from "../context/CartContext";
import { toast as sonnerToast } from "sonner";
import { Book } from '@/data/mockData';

// Helper to map API-shaped book to internal Book shape used across the app
const mapApiBookToBook = (api: any): Book => {
  const price = Number(api.price) || 0;
  const idStr = api.id != null ? String(api.id) : (api.product_slug || '0');
  const slug = api.product_slug || idStr;
  // Normalize API base and join with images path
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/').replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cover = api.product_image
    ? `${base}/images/products/${api.product_image}`
    : '/img/book-categori/book-placeholder.png';

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

interface ApiBook {
  id: number;
  product_name: string;
  product_description?: string;
  author_name?: string;
  product_slug?: string;
  total_pages?: number;
  price: string;
  paperback_type?: string;
  product_isbn?: string;
  edition?: string;
  product_image?: string;
  is_active: number;
  category?: { category_name: string };
  subcategory?: { sub_category_name: string };
}

interface BookCardProps {
  book: ApiBook;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

const BookCard = ({ book }: BookCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      description: `${book.product_name} ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`,
    });
  };

 

  const mapped = mapApiBookToBook(book);

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Book Cover */}
        <div className="relative overflow-hidden">
          {/* Bestseller Badge (optional example) */}
          {book.is_active === 1 && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-accent text-accent-foreground font-bold">BESTSELLER</Badge>
            </div>
          )}

          <Link to={`/book/${mapped.id}-${mapped.slug}`} state={{ book: mapped }}>
            <img
              src={mapped.images[0] || '/img/book-categori/book-placeholder.png'}
              alt={mapped.title}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = '/img/book-categori/book-placeholder.png';
              }}
            />
          </Link>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={handleWishlist}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-primary text-primary' : ''}`} />
          </Button>

          {/* New Release Badge */}
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-primary text-primary-foreground">New Release</Badge>
          </div>
        </div>

        {/* Book Details */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div>
            <Link
              to={`/book/${mapped.id}-${mapped.slug}`}
              state={{ book: mapped }}
              className="font-semibold line-clamp-2 hover:text-primary transition-colors"
            >
              {mapped.title}
            </Link>
            {book.product_description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                {book.product_description}
              </p>
            )}
          </div>

          {/* Author */}
            <p className="text-sm text-muted-foreground">by {mapped.authors?.[0]?.name || 'Unknown Author'}</p>

          {/* Rating (static demo) */}
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground">(4.5)</span>
          </div>

          {/* Format / Category / Pages */}
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground mb-2">
            {book.paperback_type && (
              <Badge variant="outline" className="text-xs">
                {book.paperback_type}
              </Badge>
            )}
            {book.category?.category_name && (
              <Badge variant="outline" className="text-xs">
                {book.category.category_name}
              </Badge>
            )}
            {book.total_pages && (
              <Badge variant="outline" className="text-xs">
                {book.total_pages} pages
              </Badge>
            )}
          </div>

          {/* ISBN & Edition */}
          <div className="space-y-1 text-xs text-muted-foreground mb-3">
            {book.product_isbn && <p>ISBN: {book.product_isbn}</p>}
            {book.edition && <p>Published: {book.edition}</p>}
          </div>

          {/* Subcategory Info */}
          {book.subcategory?.sub_category_name && (
            <p className="text-xs text-primary font-medium mb-2">
              Part of: {book.subcategory.sub_category_name}
            </p>
          )}

          {/* Price and Actions */}
          <div className="flex items-end justify-between pt-2">
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">₹{mapped.price}</div>
              <div className="text-xs text-muted-foreground">In Stock</div>
            </div>

             <div className="pt-2 flex justify-between items-center">
               
                <Button
                  size="sm"
                  onClick={() => {
                    addToCart(mapped);
                    sonnerToast.success(`${mapped.title} added to cart`);
                  }}
                  className="shrink-0"
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Add to Cart
                </Button>
              </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
