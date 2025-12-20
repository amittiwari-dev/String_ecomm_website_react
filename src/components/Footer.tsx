import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { MenuService, type FooterLink, type FooterLinks } from '@/services/menuService';
import { FooterSkeleton } from '@/components/ui/footer-skeleton';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/queryKeys';
import { QUERY_CONFIG, RETRY_CONFIG } from '@/lib/queryConfig';

// Error component for footer
const FooterError = ({ onRetry }: { onRetry: () => void }) => (
  <footer className="bg-muted/30 border-t">
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center space-y-4 min-h-[200px]">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Failed to load footer content</h3>
          <p className="text-sm text-muted-foreground">
            Unable to load footer links. Please check your connection and try again.
          </p>
        </div>
        <Button 
          onClick={onRetry} 
          variant="outline" 
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </Button>
      </div>
    </div>
  </footer>
);

// Footer link component that handles internal/external links
const FooterLinkItem = ({ link }: { link: FooterLink }) => {
  if (link.is_external) {
    return (
      <a 
        href={link.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        {link.title}
      </a>
    );
  }

  return (
    <Link 
      to={link.url} 
      className="block text-sm text-muted-foreground hover:text-primary transition-colors"
    >
      {link.title}
    </Link>
  );
};

const Footer = () => {
  const { 
    data: footerLinks, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: queryKeys.menu.footerLinks(),
    queryFn: MenuService.getFooterLinks,
    ...QUERY_CONFIG.FOOTER_DATA,
    ...RETRY_CONFIG.CRITICAL,
  });

  // Show loading skeleton while fetching data
  if (isLoading) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <FooterSkeleton />
      </div>
    );
  }

  // Show error state with retry button
  if (error) {
    return <FooterError onRetry={() => refetch()} />;
  }

  // Sort links by sort_order within each section
  const sortedQuickLinks = footerLinks?.quick_links?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const sortedCategories = footerLinks?.categories?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const sortedContact = footerLinks?.contact?.sort((a, b) => a.sort_order - b.sort_order) || [];

  return (
    <footer className="bg-muted/30 border-t animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="text-2xl font-bold text-primary">STERLING</div>
            <p className="text-sm text-muted-foreground">
              Sterling Publishers Pvt. Ltd. - Your trusted partner in quality publishing since decades.
            </p>
            <div className="flex space-x-3">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <nav className="space-y-2">
              {sortedQuickLinks.length > 0 ? (
                sortedQuickLinks.map((link) => (
                  <FooterLinkItem key={link.id} link={link} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No quick links available</p>
              )}
            </nav>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold">Categories</h3>
            <nav className="space-y-2">
              {sortedCategories.length > 0 ? (
                sortedCategories.map((link) => (
                  <FooterLinkItem key={link.id} link={link} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No categories available</p>
              )}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Us</h3>
            <div className="space-y-3">
              {sortedContact.length > 0 ? (
                sortedContact.map((link) => (
                  <div key={link.id} className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {/* Icon based on link title or URL pattern */}
                    {link.title.toLowerCase().includes('address') || link.title.toLowerCase().includes('location') ? (
                      <MapPin className="h-4 w-4" />
                    ) : link.title.toLowerCase().includes('phone') || link.url.includes('tel:') ? (
                      <Phone className="h-4 w-4" />
                    ) : link.title.toLowerCase().includes('email') || link.url.includes('mailto:') ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4" /> // Placeholder for consistent spacing
                    )}
                    <FooterLinkItem link={link} />
                  </div>
                ))
              ) : (
                // Fallback contact info if no contact links are available
                <>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>New Delhi, India</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>+91 11 1234 5678</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>info@sterlingpublishers.com</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2024 Sterling Publishers Pvt. Ltd. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/shipping" className="hover:text-primary transition-colors">Shipping Info</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;