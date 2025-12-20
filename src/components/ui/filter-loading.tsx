import { Loader2 } from 'lucide-react';
import { Skeleton } from './skeleton';

// Inline loading indicator for search/filter operations
export const FilterLoadingIndicator = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex items-center justify-center gap-2 py-4">
    <Loader2 className="h-5 w-5 animate-spin text-primary" />
    <span className="text-sm text-muted-foreground">{message}</span>
  </div>
);

// Overlay loading indicator for filter changes
export const FilterOverlay = ({ message = 'Applying filters...' }: { message?: string }) => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm font-medium text-muted-foreground">{message}</span>
    </div>
  </div>
);

// Skeleton for product grid during filtering
export const FilteringBookGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
    {/* Semi-transparent overlay */}
    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-lg" />
    
    {/* Skeleton cards */}
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden opacity-50">
        <Skeleton className="w-full h-64" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="h-3 w-3 rounded-full" />
            ))}
          </div>
          <div className="flex items-end justify-between pt-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    ))}
    
    {/* Loading indicator in center */}
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Updating results...</span>
      </div>
    </div>
  </div>
);

// Smooth transition wrapper for loading states
export const SmoothLoadingTransition = ({ 
  isLoading, 
  children,
  loadingSkeleton,
  className = ''
}: { 
  isLoading: boolean; 
  children: React.ReactNode;
  loadingSkeleton?: React.ReactNode;
  className?: string;
}) => (
  <div className={`relative transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'} ${className}`}>
    {children}
    {isLoading && loadingSkeleton && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
        {loadingSkeleton}
      </div>
    )}
  </div>
);

// Search loading indicator (for search bar)
export const SearchLoadingSpinner = () => (
  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
);

// Category filter loading
export const CategoryFilterSkeleton = () => (
  <div className="flex items-center gap-2">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-10 w-48" />
  </div>
);

// Results count loading
export const ResultsCountSkeleton = () => (
  <div className="text-center">
    <Skeleton className="h-4 w-32 mx-auto" />
  </div>
);