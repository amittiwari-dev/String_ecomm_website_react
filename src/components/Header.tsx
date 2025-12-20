import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Heart, Menu, X, User, LogOut, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileNavigationSkeleton } from '@/components/ui/menu-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MegaMenu } from './MegaMenu';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTopLevelCategories } from '../hooks/useMenuData';
import { Badge } from '@/components/ui/badge';
import { CategoryMenuItem } from '../services/menuService';

interface NavigationItem {
  name: string;
  href: string;
  hasMenu?: boolean;
  categories?: CategoryMenuItem[];
}

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { state: cart } = useCart();
  const { state: auth, logout } = useAuth();
  const location = useLocation();
  
  // Get dynamic menu data with auto-refresh enabled
  const { 
    categories, 
    isLoading: isMenuLoading, 
    error: menuError, 
    refreshMenu, 
    clearError,
    isRefreshing 
  } = useTopLevelCategories();

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Header Menu Debug:', {
      categoriesCount: categories.length,
      isMenuLoading,
      menuError,
      hasCategories: categories.length > 0
    });
  }
  
  // Static navigation items - restored old menu structure
  const staticNavigation: NavigationItem[] = [
    { name: 'Latest Releases', href: '/latest-releases' },
    { 
      name: 'Our Books', 
      href: '/books', 
      hasMenu: true,
      categories: categories // Only this section is dynamic
    },
    { name: 'Our Authors', href: '/authors' },
    { name: 'Publish with Us!', href: '/publish' },
    { name: 'Contact Us', href: '/contact' },
  ];

  const navigationItems = staticNavigation;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/img/logo/logo.png" 
              alt="Sterling Publishers" 
              className="h-10"
            />
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* Always show navigation items */}
              {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    {item.hasMenu ? (
                      <>
                        <NavigationMenuTrigger className="h-10">
                          {item.name}
                          {item.categories && item.categories.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs transition-all duration-200 hover:scale-105">
                              {item.categories.reduce((total, cat) => total + cat.book_count, 0)}
                            </Badge>
                          )}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <MegaMenu />
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink asChild>
                        <Link
                          to={item.href}
                          className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                        >
                          {item.name}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search and Actions */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="hidden md:flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="search"
                    placeholder="Search books, authors..."
                    className="w-64"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Cart and Wishlist */}
            <Button variant="ghost" size="icon" asChild>
              <Link to="/wishlist">
                <Heart className="h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4" />
                {cart.items.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cart.items.length}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Authentication UI */}
            {auth.isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{auth.user?.name || auth.user?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                {location.pathname !== '/login' && (
                  <Button variant="ghost" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                )}
                {location.pathname !== '/register' && (
                  <Button asChild>
                    <Link to="/register">Sign Up</Link>
                  </Button>
                )}
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {/* Always show mobile navigation items */}
                  {navigationItems.map((item) => (
                      <div key={item.name}>
                        <Link
                          to={item.href}
                          className="text-lg font-medium hover:text-primary transition-colors flex items-center justify-between"
                        >
                          <span>{item.name}</span>
                          {item.categories && item.categories.length > 0 && (
                            <Badge variant="secondary" className="text-xs transition-all duration-200">
                              {item.categories.reduce((total, cat) => total + cat.book_count, 0)}
                            </Badge>
                          )}
                        </Link>
                        {/* Show categories in mobile menu */}
                        {item.categories && item.categories.length > 0 && (
                          <div className="ml-4 mt-2 space-y-2">
                            {item.categories.map((category) => (
                              <Link
                                key={category.id}
                                to={`/books?category=${category.slug}`}
                                className="block text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-between"
                              >
                                <span>{category.name}</span>
                                <Badge variant="outline" className="text-xs transition-all duration-200">
                                  {category.book_count}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  
                  
                  {/* Mobile Search */}
                  <div className="pt-4 border-t">
                    <Input
                      type="search"
                      placeholder="Search books, authors..."
                      className="w-full"
                    />
                  </div>

                  {/* Mobile Authentication UI */}
                  <div className="pt-4 border-t">
                    {auth.isAuthenticated ? (
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center gap-2 px-2 py-2 bg-muted rounded-md">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">{auth.user?.name || auth.user?.email}</span>
                        </div>
                        <Link
                          to="/profile"
                          className="text-base font-medium hover:text-primary transition-colors px-2"
                        >
                          My Profile
                        </Link>
                        <Link
                          to="/orders"
                          className="text-base font-medium hover:text-primary transition-colors px-2"
                        >
                          My Orders
                        </Link>
                        <Button
                          variant="destructive"
                          onClick={logout}
                          className="w-full justify-start"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        {location.pathname !== '/login' && (
                          <Button variant="outline" asChild className="w-full">
                            <Link to="/login">Login</Link>
                          </Button>
                        )}
                        {location.pathname !== '/register' && (
                          <Button asChild className="w-full">
                            <Link to="/register">Sign Up</Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;