import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { authors } from '@/data/mockData';

const Authors = () => {
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
          />
        </div>
      </div>

      {/* Authors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {authors.map((author) => (
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
        ))}
      </div>

      {/* Alphabet Navigation */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
            <button
              key={letter}
              className="w-8 h-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
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