import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Users, GraduationCap, Heart, AlertCircle, RefreshCw, Star, ShoppingCart } from 'lucide-react';
import { CategoryGridSkeleton } from '@/components/ui/category-skeleton';
import { MenuService } from '@/services/menuService';
import { BookService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { toast as sonnerToast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  book_count?: number;
}

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
  category_id: string;
  rating?: number;
}

interface CategoryWithBooks {
  category: Category;
  books: Book[];
  loading: boolean;
}

const CategoryGrid = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesWithBooks, setCategoriesWithBooks] = useState<CategoryWithBooks[]>([]);
  const { toast } = useToast();
  const { addToCart } = useCart();

  const fetchCategoriesAndBooks = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Fetch all categories first
      const categoriesResponse = await MenuService.getCategories();
      const mainCategories = categoriesResponse.filter(cat => 
        !cat.parent_id && cat.name !== 'Latest Releases'
      ).sort((a, b) => a.sort_order - b.sort_order);
      
      setCategories(mainCategories);
      setLoading(false);
      
      // Get categories that have books
      const categoriesWithBooksData = mainCategories.filter(cat => cat.book_count > 0);
      
      // Initialize categories with empty books
      const initialData: CategoryWithBooks[] = categoriesWithBooksData.map(category => ({
        category,
        books: [],
        loading: true
      }));
      
      setCategoriesWithBooks(initialData);
      
      // Fetch books for each category that has books
      for (let i = 0; i < categoriesWithBooksData.length; i++) {
        const category = categoriesWithBooksData[i];
        try {
          const booksResponse = await BookService.getProductsByCategory(category.slug, 1, 4);
          
          setCategoriesWithBooks(prev => prev.map((item, index) => 
            index === i ? { ...item, books: booksResponse.data, loading: false } : item
          ));
        } catch (bookError) {
          console.error(`Failed to fetch books for category ${category.name}:`, bookError);
          setCategoriesWithBooks(prev => prev.map((item, index) => 
            index === i ? { ...item, books: [], loading: false } : item
          ));
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndBooks();
  }, []);
  
  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.toLowerCase().includes('sai') || categoryName.toLowerCase().includes('religious')) {
      return Heart;
    }
    if (categoryName.toLowerCase().includes('text') || categoryName.toLowerCase().includes('education')) {
      return GraduationCap;
    }
    if (categoryName.toLowerCase().includes('children')) {
      return Users;
    }
    return BookOpen;
  };

  const handleAddToCart = (book: Book) => {
    try {
      addToCart(book);
      sonnerToast.success(`${book.title} added to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      sonnerToast.error('Failed to add to cart. Please try again.');
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our comprehensive collection organized by your areas of interest
            </p>
          </div>
          <CategoryGridSkeleton count={8} />
        </div>
      </section>
    );
  }

  if (error && categories.length === 0) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Unable to Load Categories
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                onClick={fetchCategoriesAndBooks}
                className="inline-flex items-center gap-2"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* All Categories Grid - Old Style */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our comprehensive collection organized by your areas of interest
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const IconComponent = getCategoryIcon(category.name);
              
              return (
                <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                  <CardContent className="p-6 text-center">
                    <Link to={`/books?category=${encodeURIComponent(category.slug)}`}>
                      <div className="mb-4">
                        <IconComponent className="h-12 w-12 text-primary mx-auto group-hover:scale-110 transition-transform" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm font-medium text-primary">
                        {category.book_count ? `${category.book_count} books` : 'Browse books'}
                      </p>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories with Books Panels - Only for categories that have books */}
      {categoriesWithBooks.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Books by Category</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover our best sellers and popular titles in each category
              </p>
            </div>

            <div className="space-y-16">
              {categoriesWithBooks.map((categoryData, categoryIndex) => {
                const IconComponent = getCategoryIcon(categoryData.category.name);
                
                return (
                  <div key={categoryData.category.id} className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 mt-4" style={{ animationDelay: `${categoryIndex * 200}ms` }}>
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-primary/20">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <IconComponent className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{categoryData.category.name}</h3>
                          <p className="text-muted-foreground">
                            {categoryData.category.book_count ? `${categoryData.category.book_count} books available` : 'Explore our collection'}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="lg">
                        <Link to={`/books?category=${encodeURIComponent(categoryData.category.slug)}`}>
                          View All →
                        </Link>
                      </Button>
                    </div>

                    {/* Books Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {categoryData.loading ? (
                        // Loading skeletons for books
                        [...Array(4)].map((_, index) => (
                          <Card key={index} className="animate-pulse">
                            <CardContent className="p-4">
                              <div className="h-48 bg-gray-200 rounded mb-4"></div>
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded mb-2"></div>
                              <div className="h-6 bg-gray-200 rounded"></div>
                            </CardContent>
                          </Card>
                        ))
                      ) : categoryData.books.length > 0 ? (
                        categoryData.books.map((book, bookIndex) => (
                          <Card key={book.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${bookIndex * 100}ms` }}>
                            <CardContent className="p-0">
                              {/* Book Cover */}
                              <div className="relative overflow-hidden">
                                <Link to={`/book/${book.id}-${book.slug}`} state={{ book }}>
                                  <img
                                    src={book.images[0] || '/img/book-categori/book-placeholder.png'}
                                    alt={book.title}
                                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.currentTarget.src = '/img/book-categori/book-placeholder.png';
                                    }}
                                  />
                                </Link>
                                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                                  Best Seller
                                </Badge>
                              </div>

                              {/* Book Details */}
                              <div className="p-4 space-y-3">
                                <Link
                                  to={`/book/${book.id}-${book.slug}`}
                                  state={{ book }}
                                  className="font-semibold line-clamp-2 hover:text-primary transition-colors block"
                                >
                                  {book.title}
                                </Link>

                                <p className="text-sm text-muted-foreground">
                                  by {book.authors?.[0]?.name || 'Unknown Author'}
                                </p>

                                {/* Rating */}
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < Math.floor(book.rating || 4) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs text-muted-foreground">({book.rating || 4.0})</span>
                                </div>

                                {/* Price and Actions */}
                                <div className="flex items-center justify-between pt-2">
                                  <div className="text-lg font-bold text-primary">₹{book.price}</div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddToCart(book)}
                                    className="shrink-0"
                                  >
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        // No books found
                        <div className="col-span-full text-center py-8">
                          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No books available in this category yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default CategoryGrid;