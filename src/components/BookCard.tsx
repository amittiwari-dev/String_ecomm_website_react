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
  // Handle both string and number prices
  const price = typeof api.price === 'string' ? parseFloat(api.price) : Number(api.price) || 0;
  
  // Handle ID - could be number or string
  const idStr = api.id != null ? String(api.id) : (api.product_slug || '0');
  
  // Handle slug
  const slug = api.product_slug || api.slug || idStr;
  
  // Use the correct base URL for images with proper fallback
  const base = 'https://sterlingpublishers.in/publishing';
  let cover = '/img/book-categori/book-placeholder.png';
  
  if (api.product_image) {
    cover = `${base}/images/products/${api.product_image}`;
  } else if (api.images && Array.isArray(api.images) && api.images.length > 0) {
    // Handle case where book already has images array
    cover = api.images[0];
  }

  // Handle author data - could be in different formats
  let authors = [];
  if (api.authors && Array.isArray(api.authors) && api.authors.length > 0) {
    // Already has authors array
    authors = api.authors;
  } else if (api.author_name || api.author_id) {
    // Has author_name and/or author_id
    authors = [{
      id: api.author_id ? String(api.author_id) : `a-${idStr}`,
      name: api.author_name || 'Unknown',
      slug: (api.author_name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
      bio: ''
    }];
  } else {
    // No author data
    authors = [{
      id: `a-${idStr}`,
      name: 'Unknown',
      slug: 'unknown',
      bio: ''
    }];
  }

  // Handle category_id - could be nested or direct
  let categoryId = '0';
  if (api.category_id) {
    categoryId = String(api.category_id);
  } else if (api.category && api.category.id) {
    categoryId = String(api.category.id);
  }

  // Handle stock status
  let stockStatus: 'In Stock' | 'Out of Stock' | 'Preorder' = 'In Stock';
  if (api.stock_status) {
    stockStatus = api.stock_status;
  } else if (api.is_active !== undefined) {
    stockStatus = api.is_active === 1 || api.is_active === true ? 'In Stock' : 'Out of Stock';
  }

  return {
    id: idStr,
    title: api.product_name || api.title || 'Untitled',
    subtitle: api.subtitle || undefined,
    slug,
    description: api.product_description || api.description || '',
    language: api.language || 'English',
    format: (api.paperback_type || api.format || 'Paperback') as any,
    price,
    currency: api.currency || 'INR',
    publication_date: api.publication_date || new Date().toISOString(),
    pages: api.total_pages || api.pages || undefined,
    stock_status: stockStatus,
    images: [cover],
    authors,
    category_id: categoryId,
    tags: api.tags || [],
    is_latest_release: !!api.is_latest_release,
    isbn10: api.product_isbn || api.isbn10 || undefined,
    isbn13: api.isbn13 || undefined,
    rating: api.rating || undefined,
  } as Book;
};

// API Book interface - flexible to handle various API response formats
interface ApiBook {
  id?: number | string;
  product_name?: string;
  title?: string;
  product_description?: string;
  description?: string;
  author_name?: string;
  author_id?: number | string;
  authors?: any[];
  product_slug?: string;
  slug?: string;
  total_pages?: number;
  pages?: number;
  price: string | number;
  paperback_type?: string;
  format?: string;
  product_isbn?: string;
  isbn10?: string;
  isbn13?: string;
  edition?: string;
  product_image?: string;
  images?: string[];
  is_active?: number | boolean;
  stock_status?: 'In Stock' | 'Out of Stock' | 'Preorder';
  category?: { id?: string | number; category_name?: string };
  category_id?: string | number;
  subcategory?: { sub_category_name?: string };
  language?: string;
  currency?: string;
  publication_date?: string;
  tags?: string[];
  is_latest_release?: boolean;
  rating?: number;
  subtitle?: string;
}

interface BookCardProps {
  book: ApiBook | Book;
}

const BookCard = ({ book }: BookCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Normalize the book data to internal format
  const mapped = mapApiBookToBook(book);

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      description: `${mapped.title} ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`,
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!imageError) {
      setImageError(true);
      e.currentTarget.src = '/img/book-categori/book-placeholder.png';
    }
  };

  const handleAddToCart = () => {
    try {
      addToCart(mapped);
      sonnerToast.success(`${mapped.title} added to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      sonnerToast.error('Failed to add to cart. Please try again.');
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Book Cover */}
        <div className="relative overflow-hidden">
          {/* Bestseller Badge (optional example) */}
          {mapped.stock_status === 'In Stock' && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-accent text-accent-foreground font-bold">BESTSELLER</Badge>
            </div>
          )}

          <Link to={`/book/${mapped.id}-${mapped.slug}`} state={{ book: mapped }}>
            <img
              src={mapped.images[0] || '/img/book-categori/book-placeholder.png'}
              alt={mapped.title}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
              loading="lazy"
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
            {mapped.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                {mapped.description}
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
            {mapped.format && (
              <Badge variant="outline" className="text-xs">
                {mapped.format}
              </Badge>
            )}
            {(book as any).category?.category_name && (
              <Badge variant="outline" className="text-xs">
                {(book as any).category.category_name}
              </Badge>
            )}
            {mapped.pages && (
              <Badge variant="outline" className="text-xs">
                {mapped.pages} pages
              </Badge>
            )}
          </div>

          {/* ISBN & Edition */}
          <div className="space-y-1 text-xs text-muted-foreground mb-3">
            {mapped.isbn10 && <p>ISBN: {mapped.isbn10}</p>}
            {(book as any).edition && <p>Published: {(book as any).edition}</p>}
          </div>

          {/* Subcategory Info */}
          {(book as any).subcategory?.sub_category_name && (
            <p className="text-xs text-primary font-medium mb-2">
              Part of: {(book as any).subcategory.sub_category_name}
            </p>
          )}

          {/* Price and Actions */}
          <div className="flex items-end justify-between pt-2">
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">₹{mapped.price.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{mapped.stock_status}</div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="shrink-0"
                disabled={mapped.stock_status === 'Out of Stock'}
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
