import { Link } from 'react-router-dom';
import { categories, getCategoriesByParent } from '@/data/mockData';

const MegaMenu = () => {
  const mainCategories = getCategoriesByParent(null).filter(cat => cat.id !== '1'); // Exclude Latest Releases

  const renderSubCategories = (parentId: string, level: number = 0) => {
    const subCategories = getCategoriesByParent(parentId);
    
    if (subCategories.length === 0) return null;

    return (
      <ul className={`space-y-1 ${level > 0 ? 'ml-4 mt-2' : ''}`}>
        {subCategories.map((category) => (
          <li key={category.id}>
            <Link
              to={`/books/category/${category.slug}`}
              className="text-sm hover:text-primary transition-colors block py-1"
            >
              {category.name}
            </Link>
            {renderSubCategories(category.id, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="grid grid-cols-4 gap-8 p-6 w-[800px]">
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

      {/* Other main categories */}
      {mainCategories.map((category) => (
        <div key={category.id}>
          <h3 className="font-semibold text-primary mb-3">
            <Link 
              to={`/books/category/${category.slug}`}
              className="hover:underline"
            >
              {category.name}
            </Link>
          </h3>
          {renderSubCategories(category.id)}
        </div>
      ))}
    </div>
  );
};

export { MegaMenu };
