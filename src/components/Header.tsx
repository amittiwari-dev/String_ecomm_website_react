import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Heart, Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MegaMenu } from './MegaMenu';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { state: cart } = useCart();
  const { state: auth, logout } = useAuth();
  const location = useLocation();
  
  // When integrating with Laravel API, you might want to fetch cart count on component mount
  // useEffect(() => {
  //   const fetchCartCount = async () => {
  //     try {
  //       const response = await fetch('/api/cart/count');
  //       const data = await response.json();
  //       // Update cart count state
  //     } catch (error) {
  //       console.error('Error fetching cart count:', error);
  //     }
  //   };
  //   fetchCartCount();
  // }, []);
  
  const navigation = [
    { name: 'Latest Releases', href: '/latest-releases' },
    { name: 'Our Books', href: '/books', hasMenu: true },
    { name: 'Our Authors', href: '/authors' },
    { name: 'Publish with Us!', href: '/publish' },
    { name: 'Contact Us', href: '/contact' },
  ];

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
              {navigation.map((item) => (
                <NavigationMenuItem key={item.name}>
                  {item.hasMenu ? (
                    <>
                      <NavigationMenuTrigger className="h-10">
                        {item.name}
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
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">
                      Orders
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
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
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
                          Profile
                        </Link>
                        <Link
                          to="/orders"
                          className="text-base font-medium hover:text-primary transition-colors px-2"
                        >
                          Orders
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