import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { getCategoriesByParent } from '@/data/mockData';
import { BookOpen, Users, GraduationCap, Heart } from 'lucide-react';
import { CategoryGridSkeleton } from '@/components/ui/category-skeleton';

const CategoryGrid = () => {
  const [loading, setLoading] = useState(true);
  const mainCategories = getCategoriesByParent(null).filter(cat => cat.id !== '1');

  // Simulate loading for demonstration
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const categoryIcons = {
    '2': Heart, // Shirdi Sai Baba
    '3': Heart, // Other Religious
    '4': BookOpen, // Coffee Table Books
    '5': GraduationCap, // Text Books
  };

  const categoryBooks = {
    '2': '150+ Books',
    '3': '80+ Books', 
    '4': '300+ Books',
    '5': '120+ Books',
  };

  if (loading) {
    return <CategoryGridSkeleton count={4} />;
  }

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our comprehensive collection organized by your areas of interest
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainCategories.map((category) => {
            const IconComponent = categoryIcons[category.id as keyof typeof categoryIcons] || BookOpen;
            
            return (
              <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <a href={`#${category.slug}`} onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(category.slug)?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    <div className="mb-4">
                      <IconComponent className="h-12 w-12 text-primary mx-auto group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm font-medium text-primary">
                      {categoryBooks[category.id as keyof typeof categoryBooks]}
                    </p>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;