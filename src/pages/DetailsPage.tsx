import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DetailsPage = () => {
  const { id } = useParams();

  // Example static book data (replace later with API)
  const book = {
    id: 1,
    title: "Castle The Sky",
    author: "Priya Nair",
    price: 599,
    language: "English",
    format: "Hardcover",
    pages: 320,
    isbn: "978-81-234-5683-3",
    year: 2023,
    rating: 4.6,
    stock: "In Stock",
    image: "/img/book/07.png",
    description:
      "Ancient wisdom for contemporary life. Explore balance, peace, and spiritual growth through the art of mindful living.",
  };

  // Example related books
  const relatedBooks = [
    {
      id: 2,
      title: "The Time Traveler",
      author: "Dr. Rajesh Sharma",
      price: 450,
      rating: 4.8,
      format: "Hardcover",
      language: "Hindi",
      pages: 320,
      year: 2024,
      isbn: "978-81-234-5678-9",
      stock: "In Stock",
      image: "/img/book/04.png",
    },
    {
      id: 3,
      title: "Grow with Nature",
      author: "Priya Nair",
      price: 499,
      rating: 4.7,
      format: "Paperback",
      language: "English",
      pages: 280,
      year: 2023,
      isbn: "978-81-234-5699-1",
      stock: "In Stock",
      image: "/img/book/06.png",
    },
    {
      id: 4,
      title: "UX Research",
      author: "Dr. Rajesh Sharma",
      price: 899,
      rating: 4.9,
      format: "Hardcover",
      language: "English",
      pages: 420,
      year: 2024,
      isbn: "978-81-234-5681-9",
      stock: "In Stock",
      image: "/img/book/08.png",
    },
     {
      id: 4,
      title: "Predictive Analytics",
      author: "Dr. Rajesh Sharma",
      price: 900,
      rating: 4.5,
      format: "Hardcover",
      language: "English",
      pages: 320,
      year: 2025,
      isbn: "978-81-234-5681-9",
      stock: "In Stock",
      image: "/img/book/10.png",
    }
    
  ];

  const handleAddToCart = () => {
    alert(`${book.title} added to cart!`);
  };

  return (
    <section className="py-10 bg-gray-50">
        <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Shop Details</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Every great read starts with the right guidance.
Reach out to us for book suggestions, order support, or any questions — we’re always happy to assist you.
        </p>
      </div>
      <div className="container mx-auto px-6 lg:px-20">
        {/* MAIN BOOK SECTION */}
        <div className="grid md:grid-cols-2 gap-10 bg-white rounded-2xl shadow-lg p-6">
          {/* Left: Image */}
          <div className="flex justify-center items-center">
            <img
              src={book.image}
              alt={book.title}
              className="w-[300px] h-[400px] object-cover rounded-xl shadow"
            />
          </div>

          {/* Right: Book Info */}
          <div>
            <h1 className="text-2xl font-semibold mb-2">{book.title}</h1>
            <p className="text-gray-600 mb-2">
              by <span className="font-medium">{book.author}</span>
            </p>

            <p className="text-yellow-500 mb-3 flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400" /> {book.rating} / 5
            </p>

            <p className="text-green-600 font-semibold mb-4">{book.stock}</p>
            <h2 className="text-xl font-bold mb-2">₹{book.price}</h2>

            <Button onClick={handleAddToCart} className="mb-4 bg-red-600 hover:bg-red-700">
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
            </Button>

            <div className="border-t border-gray-200 my-4"></div>

            <ul className="text-gray-700 space-y-1 text-sm">
              <li><strong>Language:</strong> {book.language}</li>
              <li><strong>Format:</strong> {book.format}</li>
              <li><strong>Pages:</strong> {book.pages}</li>
              <li><strong>ISBN:</strong> {book.isbn}</li>
              <li><strong>Published:</strong> {book.year}</li>
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
                    src={related.image}
                    alt={related.title}
                    className="w-full h-56 object-cover rounded-md mb-3"
                  />
                </Link>

                <Link
                  to={`/book/${related.id}`}
                  className="font-semibold line-clamp-2 hover:text-primary transition-colors"
                >
                  {related.title}
                </Link>

                <p className="text-sm text-gray-500">by {related.author}</p>

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
                      ₹{related.price}
                    </p>
                    <p className="text-xs text-gray-400">{related.stock}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => alert(`${related.title} added to cart!`)}
                    className="shrink-0"
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
    </section>
  );
};

export default DetailsPage;
