import { Skeleton } from './skeleton';

export const OrderCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  </div>
);

export const OrderHistoryPageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 py-16">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Statistics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>

        {/* Orders skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <Skeleton className="h-10 w-20" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-10" />
            ))}
          </div>
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  </div>
);

export const OrderStatisticsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm p-4">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
);