import { Skeleton } from './skeleton';

export const PageHeaderSkeleton = () => (
  <div className="text-center mb-8">
    <Skeleton className="h-10 w-80 mx-auto mb-4" />
    <Skeleton className="h-6 w-96 mx-auto" />
  </div>
);

export const SearchBarSkeleton = () => (
  <div className="relative max-w-md mx-auto">
    <Skeleton className="h-10 w-full" />
  </div>
);

export const FiltersSkeleton = () => (
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
);

export const PaginationSkeleton = () => (
  <div className="mt-8 flex items-center justify-center gap-2">
    <Skeleton className="h-10 w-20" />
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-10 w-10" />
      ))}
    </div>
    <Skeleton className="h-10 w-20" />
  </div>
);

export const BreadcrumbSkeleton = () => (
  <div className="flex items-center space-x-2 mb-6">
    <Skeleton className="h-4 w-12" />
    <Skeleton className="h-4 w-4" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-4" />
    <Skeleton className="h-4 w-24" />
  </div>
);

export const StatisticsCardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {Array.from({ length: count }).map((i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    {/* Table Header */}
    <div className="border-b p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
    
    {/* Table Rows */}
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
    <Skeleton className="h-8 w-48 mb-6" />
    
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    
    <div className="flex gap-3 pt-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
);

export const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    ))}
  </div>
);