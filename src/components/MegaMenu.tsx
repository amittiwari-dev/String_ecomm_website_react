import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MenuService, CategoryMenuItem } from '@/services/menuService';
import { MegaMenuSkeleton } from '@/components/ui/menu-skeleton';
import { queryKeys } from '@/lib/queryKeys';
import { QUERY_CONFIG, RETRY_CONFIG } from '@/lib/queryConfig';

interface MegaMenuProps {
  // Remove props as we'll fetch data directly with React Query
}

const MegaMenu = ({}: MegaMenuProps) => {
  // Use React Query to fetch menu data with optimized caching
  const { 
    data: categories, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<CategoryMenuItem[], Error>({
    queryKey: queryKeys.menu.menuData(),
    queryFn: MenuService.getMenuData,
    ...QUERY_CONFIG.MENU_DATA,
    ...RETRY_CONFIG.CRITICAL,
  });

  // Filter out inactive categories and sort by sort_order
  const activeCategories = (categories || [])
    .filter(category => category.is_active && category.book_count > 0)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Loading state with smooth transition
  if (isLoading) {
    return (
      <div className="w-full max-w-[800px] lg:w-[800px] animate-in fade-in-0 duration-300">
        <MegaMenuSkeleton />
      </div>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <div className="w-full max-w-[800px] lg:w-[800px] p-4 lg:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load menu categories. Please try again.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (activeCategories.length === 0) {
    return (
      <div className="w-full max-w-[800px] lg:w-[800px] p-4 lg:p-6">
        <div className="text-center text-muted-foreground">
          <p>No categories available at the moment.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 p-4 lg:p-6 w-full max-w-[800px] lg:w-[800px] animate-in fade-in-0 slide-in-from-top-2 duration-500">
      {/* All categories from API - completely dynamic */}
      {activeCategories.map((category, index) => (
        <div 
          key={category.id} 
          className="animate-in fade-in-0 slide-in-from-left-4 duration-700"
          style={{ animationDelay: `${(index + 1) * 100}ms` }}
        >
          <h3 className="font-semibold text-primary mb-3">
            <Link 
              to={`/books?category=${category.slug}`}
              className="hover:underline"
            >
              {category.name}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            {category.book_count} {category.book_count === 1 ? 'book' : 'books'} available
          </p>
          
          {/* Display subcategories if they exist */}
          {category.children && category.children.length > 0 && (
            <div className="space-y-1">
              {category.children
                .filter(child => child.is_active && child.book_count > 0)
                .sort((a, b) => a.sort_order - b.sort_order)
                .slice(0, 3) // Show only first 3 subcategories
                .map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    to={`/books?category=${category.slug}&subcategory=${subcategory.slug}`}
                    className="block text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {subcategory.name} ({subcategory.book_count})
                  </Link>
                ))}
              {category.children.filter(child => child.is_active && child.book_count > 0).length > 3 && (
                <Link
                  to={`/books?category=${category.slug}`}
                  className="block text-xs text-primary hover:underline"
                >
                  View all subcategories →
                </Link>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export { MegaMenu };
