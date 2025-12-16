import { Link } from 'react-router-dom';
import { useState } from 'react';
import { getCategoriesByParent, getBooksByCategory } from '@/data/mockData';
import { CategoryMenuItem } from '@/services/menuService';
import { Badge } from '@/components/ui/badge';

import { MegaMenuSkeleton, CategoryPreviewSkeleton } from '@/components/ui/menu-skeleton';
import { useCategoryPreview } from '@/hooks/useMenuData';
import { Card, CardContent } from '@/components/ui/card';

interface MegaMenuProps {
  categories?: CategoryMenuItem[];
  isLoading?: boolean;
  error?: string | null;
}

const MegaMenu = ({ categories: dynamicCategories, isLoading = false, error = null }: MegaMenuProps) => {
  // Use dynamic categories if provided, otherwise fall back to static data
  const staticCategories = getCategoriesByParent(null).filter(cat => cat.id !== '1');
  const fallbackCategories: CategoryMenuItem[] = staticCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    bookCount: 0, // Will be 0 for fallback data
    isActive: false,
    parent_id: cat.parent_id,
    sort_order: cat.sort_order
  }));
  
  const mainCategories = dynamicCategories || fallbackCategories;

  // Filter out empty categories (categories with no books)
  const activeCategories = mainCategories.filter(category => 
    category.bookCount > 0 || (category.children && category.children.some(child => child.bookCount > 0))
  );

  // Preview functionality
  const { previewData, loadingPreviews, loadPreview, clearPreview } = useCategoryPreview();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const handleCategoryHover = async (categoryId: string) => {
    setHoveredCategory(categoryId);
    if (!previewData[categoryId] && !loadingPreviews.has(categoryId)) {
      await loadPreview(categoryId, 4);
    }
  };

  const handleCategoryLeave = (categoryId: string) => {
    setHoveredCategory(null);
    // Clear preview after a delay to allow for smooth transitions
    setTimeout(() => {
      if (hoveredCategory !== categoryId) {
        clearPreview(categoryId);
      }
    }, 1000);
  };

  const renderBookPreview = (categoryId: string) => {
    const books = previewData[categoryId];
    const isLoading = loadingPreviews.has(categoryId);

    if (isLoading) {
      return (
        <div className="absolute top-0 left-full ml-2 z-50 shadow-lg hidden lg:block">
          <CategoryPreviewSkeleton />
        </div>
      );
    }

    if (!books || books.length === 0) return null;

    return (
      <Card className="absolute top-0 left-full ml-2 w-64 z-50 shadow-lg hidden lg:block">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-3 text-primary">Popular Books</h4>
          <div className="space-y-3">
            {books.map((book: any) => (
              <Link 
                key={book.id} 
                to={`/book/${book.id}`} 
                state={{ book }}
                className="flex space-x-3 group hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <img
                  src={book.image}
                  alt={book.title}
                  className="h-12 w-8 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/img/book-categori/book-placeholder.png';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                    {book.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {book.authors}
                  </p>
                  <p className="text-xs font-medium text-primary">
                    {book.currency} {book.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <Link
            to={`/books?category=${activeCategories.find(cat => cat.id === categoryId)?.slug}`}
            className="text-xs text-primary hover:underline mt-3 block"
          >
            View all books →
          </Link>
        </CardContent>
      </Card>
    );
  };

  const renderSubCategories = (children?: CategoryMenuItem[], level: number = 0) => {
    if (!children || children.length === 0) return null;

    // Filter out empty subcategories
    const activeChildren = children.filter(category => category.bookCount > 0);
    if (activeChildren.length === 0) return null;

    return (
      <ul className={`space-y-1 ${level > 0 ? 'ml-4 mt-2' : ''}`}>
        {activeChildren.map((category) => (
          <li 
            key={category.id}
            className="relative"
            onMouseEnter={() => handleCategoryHover(category.id)}
            onMouseLeave={() => handleCategoryLeave(category.id)}
          >
            <Link
              to={`/books?category=${category.slug}`}
              className="text-sm hover:text-primary transition-colors block py-1 flex items-center justify-between"
            >
              <span>{category.name}</span>
              {category.bookCount > 0 && (
                <Badge variant="outline" className="text-xs ml-2 transition-all duration-200">
                  {category.bookCount}
                </Badge>
              )}
            </Link>
            {hoveredCategory === category.id && renderBookPreview(category.id)}
            {renderSubCategories(category.children, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-[800px] lg:w-[800px]">
        <MegaMenuSkeleton />
      </div>
    );
  }

  // Error state - use fixed categories as fallback
  if (error) {
    const fixedCategories: CategoryMenuItem[] = [
      {
        id: '2',
        name: 'Books on Shirdi Sai Baba',
        slug: 'shirdi-sai-baba',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 2
      },
      {
        id: '3',
        name: 'Other Religious Books',
        slug: 'other-religious',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 3
      },
      {
        id: '4',
        name: 'Coffee Table Books and Paperbacks',
        slug: 'coffee-table-paperbacks',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 4
      },
      {
        id: '5',
        name: 'Text Books',
        slug: 'textbooks',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 5
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 p-4 lg:p-6 w-full max-w-[800px] lg:w-[800px]">
        {/* Latest Releases - Special column */}
        <div>
          <h3 className="font-semibold text-primary mb-3">
            <Link to="/latest-releases" className="hover:underline">
              Latest Releases
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            Discover our newest publications
          </p>
          <Link 
            to="/latest-releases"
            className="text-sm text-primary hover:underline"
          >
            View All Latest →
          </Link>
        </div>

        {/* Fixed categories with books */}
        {fixedCategories.map((category) => {
          // Get books for this category from mock data
          const categoryBooks = getBooksByCategory(category.id).slice(0, 4);
          
          return (
            <div key={category.id}>
              <h3 className="font-semibold text-primary mb-3">
                <Link 
                  to={`/books?category=${category.slug}`}
                  className="hover:underline"
                >
                  {category.name}
                </Link>
              </h3>
              {categoryBooks.length > 0 && (
                <div className="space-y-2">
                  {categoryBooks.map((book) => (
                    <Link
                      key={book.id}
                      to={`/book/${book.slug}`}
                      state={{ book }}
                      className="block text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                    >
                      {book.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Empty state - use fixed categories as fallback
  if (activeCategories.length === 0) {
    const fixedCategories: CategoryMenuItem[] = [
      {
        id: '2',
        name: 'Books on Shirdi Sai Baba',
        slug: 'shirdi-sai-baba',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 2
      },
      {
        id: '3',
        name: 'Other Religious Books',
        slug: 'other-religious',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 3
      },
      {
        id: '4',
        name: 'Coffee Table Books and Paperbacks',
        slug: 'coffee-table-paperbacks',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 4
      },
      {
        id: '5',
        name: 'Text Books',
        slug: 'textbooks',
        bookCount: 0,
        isActive: true,
        parent_id: null,
        sort_order: 5
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 p-4 lg:p-6 w-full max-w-[800px] lg:w-[800px]">
        {/* Latest Releases - Special column */}
        <div>
          <h3 className="font-semibold text-primary mb-3">
            <Link to="/latest-releases" className="hover:underline">
              Latest Releases
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            Discover our newest publications
          </p>
          <Link 
            to="/latest-releases"
            className="text-sm text-primary hover:underline"
          >
            View All Latest →
          </Link>
        </div>

        {/* Fixed categories with books */}
        {fixedCategories.map((category) => {
          // Get books for this category from mock data
          const categoryBooks = getBooksByCategory(category.id).slice(0, 4);
          
          return (
            <div key={category.id}>
              <h3 className="font-semibold text-primary mb-3">
                <Link 
                  to={`/books?category=${category.slug}`}
                  className="hover:underline"
                >
                  {category.name}
                </Link>
              </h3>
              {categoryBooks.length > 0 && (
                <div className="space-y-2">
                  {categoryBooks.map((book) => (
                    <Link
                      key={book.id}
                      to={`/book/${book.slug}`}
                      state={{ book }}
                      className="block text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                    >
                      {book.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 p-4 lg:p-6 w-full max-w-[800px] lg:w-[800px]">
      {/* Latest Releases - Special column */}
      <div>
        <h3 className="font-semibold text-primary mb-3">
          <Link to="/latest-releases" className="hover:underline">
            Latest Releases
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          Discover our newest publications
        </p>
        <Link 
          to="/latest-releases"
          className="text-sm text-primary hover:underline"
        >
          View All Latest →
        </Link>
      </div>

      {/* Other main categories */}
      {activeCategories.map((category) => (
        <div 
          key={category.id}
          className="relative"
          onMouseEnter={() => handleCategoryHover(category.id)}
          onMouseLeave={() => handleCategoryLeave(category.id)}
        >
          <h3 className="font-semibold text-primary mb-3 flex items-center justify-between">
            <Link 
              to={`/books?category=${category.slug}`}
              className="hover:underline"
            >
              {category.name}
            </Link>
            {category.bookCount > 0 && (
              <Badge variant="secondary" className="text-xs transition-all duration-200">
                {category.bookCount}
              </Badge>
            )}
          </h3>
          {renderSubCategories(category.children)}
          {hoveredCategory === category.id && renderBookPreview(category.id)}
        </div>
      ))}
    </div>
  );
};

export { MegaMenu };
