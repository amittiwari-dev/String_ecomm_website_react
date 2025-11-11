import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Star, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "../context/CartContext";
import { BookService } from "../services/api";
import { Book } from "../data/mockData";
import { toast } from "sonner";

const DetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) {
        console.error('No book ID provided');
        toast.error('Invalid book ID');
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching details for book ID:', id);
        const [bookResponse, relatedResponse] = await Promise.all([
          BookService.getBookById(id),
          BookService.getRelatedBooks(id)
        ]);

        console.log('Book response:', bookResponse);
        if (bookResponse.data) {
          setBook(bookResponse.data);
          setRelatedBooks(relatedResponse.data || []);
        } else {
          console.error('Book not found:', bookResponse.message);
          toast.error(bookResponse.message || 'Book not found');
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
        toast.error('Failed to load book details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (book) {
      addToCart(book, quantity);
      toast.success(`${book.title} added to cart!`);
    }
  };

  return (
    <section className="py-10 bg-gray-50">
      {loading || !book ? (
        <div className="container mx-auto px-6 lg:px-20">
          <div className="grid md:grid-cols-2 gap-10 bg-white rounded-2xl shadow-lg p-6">
            <div className="animate-pulse bg-gray-200 h-[400px] rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Shop Details</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every great read starts with the right guidance.
              Reach out to us for book suggestions, order support, or any questions — we're always happy to assist you.
            </p>
          </div>
      <div className="container mx-auto px-6 lg:px-20">
        {/* MAIN BOOK SECTION */}
        <div className="grid md:grid-cols-2 gap-10 bg-white rounded-2xl shadow-lg p-6">
          {/* Left: Image */}
          <div className="flex justify-center items-center">
            <img
              src={book.images[0]?.startsWith('http') ? book.images[0] : `${window.location.origin}${book.images[0]}`}
              alt={book.title}
              className="w-[300px] h-[400px] object-cover rounded-xl shadow"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/img/book-categori/book-placeholder.png';
              }}
            />
          </div>

          {/* Right: Book Info */}
          <div>
            <h1 className="text-2xl font-semibold mb-2">{book.title}</h1>
            <p className="text-gray-600 mb-2">
              by{" "}
              {book.authors.map((author, index) => (
                <span key={author.id} className="font-medium">
                  {author.name}
                  {index < book.authors.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>

            <p className="text-yellow-500 mb-3 flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400" /> {book.rating} / 5
            </p>

            <p className={`font-semibold mb-4 ${
              book.stock_status === 'In Stock' ? 'text-green-600' : 'text-red-600'
            }`}>
              {book.stock_status}
            </p>
            <h2 className="text-xl font-bold mb-2">
              {book.currency} {book.price.toFixed(2)}
            </h2>

            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center border rounded-md">
                <button
                  className="px-3 py-2 border-r hover:bg-gray-100"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={book.stock_status === 'Out of Stock'}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2">{quantity}</span>
                <button
                  className="px-3 py-2 border-l hover:bg-gray-100"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={book.stock_status === 'Out of Stock'}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button 
                onClick={handleAddToCart} 
                className="bg-red-600 hover:bg-red-700"
                disabled={book.stock_status === 'Out of Stock'}
              >
                <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
              </Button>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <ul className="text-gray-700 space-y-1 text-sm">
              <li><strong>Language:</strong> {book.language}</li>
              <li><strong>Format:</strong> {book.format}</li>
              {book.pages && <li><strong>Pages:</strong> {book.pages}</li>}
              {book.isbn13 && <li><strong>ISBN-13:</strong> {book.isbn13}</li>}
              <li><strong>Published:</strong> {new Date(book.publication_date).toLocaleDateString()}</li>
            </ul>

            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{book.description}</p>
            </div>
          </div>
        </div>

        {/* RELATED BOOKS */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedBooks.map((related) => (
              <div
                key={related.id}
                className="bg-white p-4 rounded-xl shadow hover:shadow-md transition space-y-3"
              >
                <Link to={`/book/${related.id}`}>
                  <img
                    src={related.images[0]?.startsWith('http') ? related.images[0] : `${window.location.origin}${related.images[0]}`}
                    alt={related.title}
                    className="w-full h-56 object-cover rounded-md mb-3"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/img/book-categori/book-placeholder.png';
                    }}
                  />
                </Link>

                <Link
                  to={`/book/${related.id}`}
                  className="font-semibold line-clamp-2 hover:text-primary transition-colors"
                >
                  {related.title}
                </Link>

                <p className="text-sm text-gray-500">
                  by {related.authors[0].name}
                </p>

                {/* Rating */}
                <div className="flex items-center space-x-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(related.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-500">
                    ({related.rating})
                  </span>
                </div>

                {/* Format, Language, Pages */}
                <div className="flex flex-wrap gap-1 text-xs text-gray-500">
                  <Badge variant="outline">{related.format}</Badge>
                  <Badge variant="outline">{related.language}</Badge>
                  <Badge variant="outline">{related.pages} pages</Badge>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-red-600">
                      {related.currency} {related.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{related.stock_status}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      addToCart(related, 1);
                      toast.success(`${related.title} added to cart!`);
                    }}
                    className="shrink-0"
                    disabled={related.stock_status === 'Out of Stock'}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </section>
  );
};

export default DetailsPage;
