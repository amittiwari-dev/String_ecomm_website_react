import { Skeleton } from './skeleton';

export const NavigationMenuSkeleton = () => (
  <>
    <Skeleton className="h-10 w-24" />
    <Skeleton className="h-10 w-20" />
    <Skeleton className="h-10 w-24" />
    <Skeleton className="h-10 w-28" />
    <Skeleton className="h-10 w-20" />
  </>
);

export const MobileNavigationSkeleton = () => (
  <div className="flex flex-col space-y-4 mt-8">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-6 w-24" />
    <Skeleton className="h-6 w-28" />
    <Skeleton className="h-6 w-36" />
    <Skeleton className="h-6 w-24" />
  </div>
);

export const MegaMenuSkeleton = () => (
  <div className="absolute top-full left-0 w-full bg-white border-t shadow-lg z-50">
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Categories */}
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-18" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const CategoryPreviewSkeleton = () => (
  <div className="bg-white rounded-lg shadow-lg p-4 w-80">
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex space-x-3">
          <Skeleton className="h-12 w-8" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);