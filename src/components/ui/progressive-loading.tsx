import { Loader2 } from 'lucide-react';
import { Button } from './button';
import { Skeleton } from './skeleton';

interface ProgressiveLoadingProps {
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRetry: () => void;
  loadingComponent?: React.ReactNode;
  className?: string;
}

export const ProgressiveLoading = ({
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  onLoadMore,
  onRetry,
  loadingComponent,
  className = ''
}: ProgressiveLoadingProps) => {
  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoadingMore) {
    return (
      <div className={`text-center py-8 ${className}`}>
        {loadingComponent || (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-muted-foreground">Loading more...</span>
          </div>
        )}
      </div>
    );
  }

  if (hasMore) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Button onClick={onLoadMore} variant="outline">
          Load More
        </Button>
      </div>
    );
  }

  return (
    <div className={`text-center py-8 text-muted-foreground ${className}`}>
      <p>No more items to load</p>
    </div>
  );
};

// Loading more skeleton for different content types
export const LoadingMoreSkeleton = ({ type = 'cards', count = 3 }: { type?: 'cards' | 'list' | 'table'; count?: number }) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4">
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-4">
              <Skeleton className="h-16 w-16 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};