import { useState, useEffect } from 'react';
import { BookIcon, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast as sonnerToast } from "sonner";
import { Book } from '@/data/mockData';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const mapApiBookToBook = (api: any): Book => {
  const price = Number(api.price) || 0;
  const idStr = api.id != null ? String(api.id) : (api.product_slug || '0');
  const slug = api.product_slug || idStr;
  const cover = api.product_image
    ? `http://localhost:8000/images/products/${api.product_image}`
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

const AllBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}new-books`);
        if (!response.ok) throw new Error('Failed to fetch books');

        const data = await response.json();

        if (data.status === 200 && Array.isArray(data.records)) {
          setBooks(data.records);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to load books.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [toast]);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading books...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Latest Releases Books</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our extensive collection of books across various genres and authors.
        </p>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {books.length > 0 ? (
          books.map((book) => {
            const mapped = mapApiBookToBook(book);
            return (
              <div
                key={mapped.id}
                className="bg-white p-4 rounded-xl shadow hover:shadow-md transition space-y-3"
              >
                <Link to={`/book/${mapped.id}-${mapped.slug}`} state={{ book: mapped }}>
                  <img
                    src={mapped.images[0] || "/img/book-categori/book-placeholder.png"}
                    alt={mapped.title}
                    className="w-full h-56 object-cover rounded-md mb-3"
                    onError={(e) => {
                      e.currentTarget.src = '/img/book-categori/book-placeholder.png';
                    }}
                  />
                </Link>

                <Link
                  to={`/book/${mapped.id}-${mapped.slug}`}
                  state={{ book: mapped }}
                  className="font-semibold line-clamp-2 hover:text-primary transition-colors"
                >
                  {mapped.title}
                </Link>

                <p className="text-sm text-gray-500">by {mapped.authors?.[0]?.name || 'Unknown Author'}</p>

                {/* Rating */}
                <div className="flex items-center space-x-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="text-xs text-gray-500">(4.0)</span>
                </div>

                {/* Category, Subcategory, Pages */}
                <div className="flex flex-wrap gap-1 text-xs text-gray-500">
                  {book.category?.category_name && (
                    <Badge variant="outline">{book.category.category_name}</Badge>
                  )}
                  {book.subcategory?.sub_category_name && (
                    <Badge variant="outline">{book.subcategory.sub_category_name}</Badge>
                  )}
                  {book.total_pages > 0 && (
                    <Badge variant="outline">{book.total_pages} pages</Badge>
                  )}
                </div>

                {/* Price + Add to Cart */}
                <div className="pt-2 flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-red-600">₹{parseFloat(String(mapped.price)).toFixed(2)}</p>
                  </div>
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
            );
          })
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No books found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBooks;
