import { Link } from 'react-router-dom';
import { getCategoriesByParent, getBooksByCategory } from '@/data/mockData';
import { CategoryMenuItem } from '@/services/menuService';
import { MegaMenuSkeleton } from '@/components/ui/menu-skeleton';

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

  // Removed preview functionality since we only show categories now

  // Removed book preview and subcategory functions since we only show main categories now

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

        {/* Fixed categories - only show category names */}
        {fixedCategories.map((category) => {
          // Get book count for this category
          const categoryBooks = getBooksByCategory(category.id);
          const bookCount = categoryBooks.length;
          
          return (
            <div key={category.id}>
              <h3 className="font-semibold text-primary mb-3">
                <Link 
                  to={`/books?category=${encodeURIComponent(category.name)}`}
                  className="hover:underline"
                >
                  {category.name}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground">
                {bookCount} {bookCount === 1 ? 'book' : 'books'} available
              </p>
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

        {/* Fixed categories - only show category names */}
        {fixedCategories.map((category) => {
          // Get book count for this category
          const categoryBooks = getBooksByCategory(category.id);
          const bookCount = categoryBooks.length;
          
          return (
            <div key={category.id}>
              <h3 className="font-semibold text-primary mb-3">
                <Link 
                  to={`/books?category=${encodeURIComponent(category.name)}`}
                  className="hover:underline"
                >
                  {category.name}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground">
                {bookCount} {bookCount === 1 ? 'book' : 'books'} available
              </p>
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

      {/* Other main categories - only show category names */}
      {activeCategories.map((category) => {
        // Get book count for this category
        const categoryBooks = getBooksByCategory(category.id);
        const bookCount = categoryBooks.length;
        
        return (
          <div key={category.id}>
            <h3 className="font-semibold text-primary mb-3">
              <Link 
                to={`/books?category=${encodeURIComponent(category.name)}`}
                className="hover:underline"
              >
                {category.name}
              </Link>
            </h3>
            <p className="text-xs text-muted-foreground">
              {bookCount} {bookCount === 1 ? 'book' : 'books'} available
            </p>
          </div>
        );
      })}
    </div>
  );
};

export { MegaMenu };
