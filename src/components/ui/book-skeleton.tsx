import { Skeleton } from './skeleton';

export const BookCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    {/* Book Cover */}
    <div className="relative">
      <Skeleton className="w-full h-64" />
      {/* Wishlist button skeleton */}
      <div className="absolute top-2 right-2">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      {/* Badge skeleton */}
      <div className="absolute bottom-2 left-2">
        <Skeleton className="h-6 w-20 rounded-full" />
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
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-3 rounded-full" />
        ))}
        <Skeleton className="h-3 w-8 ml-2" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      {/* Additional info */}
      <div className="space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-28" />
      </div>

      {/* Price and Actions */}
      <div className="flex items-end justify-between pt-2">
        <div className="space-y-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  </div>
);

export const BookGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <BookCardSkeleton key={i} />
    ))}
  </div>
);

export const BookListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4">
          {/* Book cover */}
          <Skeleton className="w-20 h-28 flex-shrink-0" />
          
          {/* Book details */}
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            
            <Skeleton className="h-4 w-32" />
            
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-3 w-3 rounded-full" />
              ))}
              <Skeleton className="h-3 w-8 ml-2" />
            </div>
            
            <div className="flex flex-wrap gap-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          
          {/* Price and action */}
          <div className="flex flex-col items-end justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const AllBooksPageSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    {/* Header */}
    <div className="text-center mb-8">
      <Skeleton className="h-10 w-80 mx-auto mb-4" />
      <Skeleton className="h-6 w-96 mx-auto" />
    </div>

    {/* Search and Filters */}
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="max-w-md mx-auto">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 justify-center items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Results Count */}
      <div className="text-center">
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>

    {/* Books Grid */}
    <BookGridSkeleton count={12} />
  </div>
);