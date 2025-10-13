import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import BookCard from '@/components/BookCard';
import { getLatestReleases, getCategoriesByParent, getBooksByCategory } from '@/data/mockData';

const Index = () => {
  const latestReleases = getLatestReleases();
  const mainCategories = getCategoriesByParent(null).filter(cat => cat.id !== '1');

  return (
    <div>
      {/* Hero Carousel */}
      <HeroCarousel />
      
      {/* New & Noteworthy Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">New & Noteworthy</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our latest releases and most popular titles
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestReleases.slice(0, 4).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Category Grid */}
      <CategoryGrid />
      
      {/* Books by Category Sections */}
      {mainCategories.map((category) => {
        const categoryBooks = getBooksByCategory(category.id).slice(0, 10);
        
        if (categoryBooks.length === 0) return null;
        
        return (
          <section key={category.id} id={category.slug} className="py-16 scroll-mt-20">
            <div className="container mx-auto px-4">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-left mb-2">{category.name}</h2>
                <div className="w-16 h-1 bg-primary"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {categoryBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Index;
