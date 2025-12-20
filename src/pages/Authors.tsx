import { Link } from 'react-router-dom';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUrlStringState } from '@/hooks/useUrlState';
import { useMemo, useState, useEffect } from 'react';
import { AuthorsPageSkeleton } from '@/components/ui/author-skeleton';
import { useToast } from '@/hooks/use-toast';

interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string;
  socials?: {
    website?: string;
  };
}

const Authors = () => {
  const [searchTerm, setSearchTerm] = useUrlStringState('search', '');
  const [selectedLetter, setSelectedLetter] = useUrlStringState('letter', '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const { toast } = useToast();

  const fetchAuthors = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // For now, show empty state since we don't have an authors API endpoint
      // In a real implementation, this would fetch from an API
      setAuthors([]);
      
      toast({
        title: "Authors Page",
        description: "Author profiles will be available soon",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to fetch authors:', error);
      setError('Failed to load authors');
      toast({
        title: "Error",
        description: "Failed to load authors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  // Filter authors based on search term and selected letter
  const filteredAuthors = useMemo(() => {
    let filtered = authors;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(author =>
        author.name.toLowerCase().includes(searchLower) ||
        author.bio.toLowerCase().includes(searchLower)
      );
    }

    // Filter by selected letter
    if (selectedLetter) {
      filtered = filtered.filter(author =>
        author.name.charAt(0).toUpperCase() === selectedLetter
      );
    }

    return filtered;
  }, [searchTerm, selectedLetter, authors]);

  const handleLetterClick = (letter: string) => {
    if (selectedLetter === letter) {
      setSelectedLetter(''); // Deselect if already selected
    } else {
      setSelectedLetter(letter);
    }
  };

  if (loading) {
    return <AuthorsPageSkeleton />;
  }

  if (error || authors.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Authors Section
            </h3>
            <p className="text-gray-600 mb-4">
              Author profiles and detailed information will be available soon. 
              We're working on bringing you comprehensive author biographies and their works.
            </p>
            <Button
              onClick={fetchAuthors}
              className="inline-flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              Check Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Our Authors</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Meet the talented writers and scholars behind our exceptional publications
        </p>
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search authors..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Active filters display */}
        {(searchTerm || selectedLetter) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </div>
            )}
            {selectedLetter && (
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                Letter: {selectedLetter}
                <button
                  onClick={() => setSelectedLetter('')}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Authors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAuthors.length > 0 ? (
          filteredAuthors.map((author) => (
            <Card key={author.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Link to={`/author/${author.slug}`}>
                  {/* Author Photo */}
                  <div className="mb-4">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/10">
                      {author.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {author.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {author.bio}
                  </p>
                  
                  {author.socials?.website && (
                    <div className="text-xs text-primary hover:underline">
                      Visit Website →
                    </div>
                  )}
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-lg text-muted-foreground mb-2">No authors found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms or selected letter filter
            </p>
          </div>
        )}
      </div>

      {/* Alphabet Navigation */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={`w-8 h-8 rounded-full transition-colors text-sm font-medium ${
                selectedLetter === letter
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Authors;