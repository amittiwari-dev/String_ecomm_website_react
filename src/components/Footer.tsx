import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="text-2xl font-bold text-primary">STERLING</div>
            <p className="text-sm text-muted-foreground">
              Sterling Publishers Pvt. Ltd. - Your trusted partner in quality publishing since decades.
            </p>
            <div className="flex space-x-3">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <nav className="space-y-2">
              <Link to="/latest-releases" className="block text-sm text-muted-foreground hover:text-primary">
                Latest Releases
              </Link>
              <Link to="/books" className="block text-sm text-muted-foreground hover:text-primary">
                All Books
              </Link>
              <Link to="/authors" className="block text-sm text-muted-foreground hover:text-primary">
                Our Authors
              </Link>
              <Link to="/publish" className="block text-sm text-muted-foreground hover:text-primary">
                Publish with Us
              </Link>
            </nav>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold">Categories</h3>
            <nav className="space-y-2">
              <Link to="/books/category/shirdi-sai-baba" className="block text-sm text-muted-foreground hover:text-primary">
                Shirdi Sai Baba
              </Link>
              <Link to="/books/category/other-religious" className="block text-sm text-muted-foreground hover:text-primary">
                Religious Books
              </Link>
              <Link to="/books/category/coffee-table-paperbacks" className="block text-sm text-muted-foreground hover:text-primary">
                Coffee Table Books
              </Link>
              <Link to="/books/category/textbooks" className="block text-sm text-muted-foreground hover:text-primary">
                Text Books
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Us</h3>
            <div className="space-y-3">
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
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2024 Sterling Publishers Pvt. Ltd. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
              <Link to="/shipping" className="hover:text-primary">Shipping Info</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;