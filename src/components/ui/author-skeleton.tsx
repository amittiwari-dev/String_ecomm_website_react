import { Skeleton } from './skeleton';

export const AuthorCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="text-center">
      {/* Author Photo */}
      <div className="mb-4">
        <Skeleton className="w-24 h-24 mx-auto rounded-full" />
      </div>
      
      {/* Author Name */}
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      
      {/* Bio */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
      
      {/* Website link */}
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
  </div>
);

export const AuthorGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <AuthorCardSkeleton key={i} />
    ))}
  </div>
);

export const AuthorsPageSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    {/* Header */}
    <div className="mb-8">
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-6 w-96 mb-6" />
      
      {/* Search */}
      <div className="max-w-md">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>

    {/* Authors Grid */}
    <AuthorGridSkeleton count={12} />

    {/* Alphabet Navigation */}
    <div className="mt-12 pt-8 border-t">
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: 26 }).map((_, i) => (
          <Skeleton key={i} className="w-8 h-8 rounded-full" />
        ))}
      </div>
    </div>
  </div>
);