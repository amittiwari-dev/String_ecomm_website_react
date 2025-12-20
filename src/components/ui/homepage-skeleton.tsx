import { Skeleton } from './skeleton';

// Hero Carousel Skeleton
export const HeroCarouselSkeleton = () => (
  <section className="relative h-96 bg-muted/20">
    <div className="absolute inset-0">
      <Skeleton className="w-full h-full" />
    </div>
    
    {/* Navigation dots */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-3 rounded-full" />
      ))}
    </div>
    
    {/* Navigation arrows */}
    <div className="absolute left-4 top-1/2 -translate-y-1/2">
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
    <div className="absolute right-4 top-1/2 -translate-y-1/2">
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  </section>
);

// Featured Books Section Skeleton
export const FeaturedBooksSkeleton = () => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-80 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>
      
      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Book Cover */}
            <div className="relative">
              <Skeleton className="w-full h-64" />
              {/* Wishlist button skeleton */}
              <div className="absolute top-2 right-2">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>

            {/* Book Details */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Author */}
              <Skeleton className="h-4 w-32" />

              {/* Rating */}
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} className="h-3 w-3 rounded-full" />
                ))}
                <Skeleton className="h-3 w-8 ml-2" />
              </div>

              {/* Price and Actions */}
              <div className="flex items-end justify-between pt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Category Grid Section Skeleton
export const CategoryGridSkeleton = () => (
  <section className="py-16 bg-muted/20">
    <div className="container mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-80 mx-auto" />
      </div>
      
      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              {/* Icon */}
              <div className="mb-4">
                <Skeleton className="h-16 w-16 mx-auto rounded-lg" />
              </div>
              
              {/* Category Name */}
              <Skeleton className="h-5 w-24 mx-auto mb-2" />
              
              {/* Book Count */}
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Promotional Banner Skeleton
export const PromotionalBannerSkeleton = () => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="relative rounded-lg overflow-hidden bg-muted/20 p-8 md:p-12">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-80 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
          <Skeleton className="h-12 w-40 mx-auto rounded-lg" />
        </div>
      </div>
    </div>
  </section>
);

// Complete Homepage Loading Skeleton
export const HomepageLoadingSkeleton = () => (
  <div className="min-h-screen bg-white">
    <HeroCarouselSkeleton />
    <FeaturedBooksSkeleton />
    <CategoryGridSkeleton />
    <PromotionalBannerSkeleton />
  </div>
);

// Progressive Section Loading Skeleton
export const ProgressiveSectionSkeleton = ({ sectionType }: { sectionType: string }) => {
  switch (sectionType) {
    case 'hero_carousel':
      return <HeroCarouselSkeleton />;
    case 'featured_books':
      return <FeaturedBooksSkeleton />;
    case 'category_grid':
      return <CategoryGridSkeleton />;
    case 'promotional_banner':
      return <PromotionalBannerSkeleton />;
    default:
      return (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Skeleton className="w-full h-32" />
          </div>
        </section>
      );
  }
};