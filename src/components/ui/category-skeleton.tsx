import { Skeleton } from './skeleton';

export const CategoryCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="text-center">
      {/* Icon */}
      <div className="mb-4">
        <Skeleton className="h-12 w-12 mx-auto rounded-lg" />
      </div>
      
      {/* Category Name */}
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      
      {/* Book Count */}
      <Skeleton className="h-4 w-20 mx-auto" />
    </div>
  </div>
);

export const CategoryGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <section className="py-16 bg-muted/20">
    <div className="container mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-80 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>
      
      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <CategoryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </section>
);