import { Loader2 } from 'lucide-react';
import { Skeleton } from './skeleton';

// Global app loading spinner
export const AppLoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Page transition loading
export const PageTransitionLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-primary/20"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Loading page...</h3>
        <p className="text-sm text-muted-foreground">Please wait while we prepare your content</p>
      </div>
    </div>
  </div>
);

// Component loading wrapper with fade transition
export const ComponentLoader = ({ 
  isLoading, 
  children, 
  fallback,
  className = ''
}: { 
  isLoading: boolean; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) => {
  if (isLoading) {
    return (
      <div className={`animate-in fade-in-0 duration-300 ${className}`}>
        {fallback || (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`animate-in fade-in-0 duration-500 ${className}`}>
      {children}
    </div>
  );
};

// Staggered loading animation for lists
export const StaggeredLoader = ({ 
  count = 3, 
  itemHeight = 'h-16',
  className = ''
}: { 
  count?: number; 
  itemHeight?: string;
  className?: string;
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i}
        className={`animate-in fade-in-0 slide-in-from-left-4 duration-500 ${itemHeight} bg-muted/20 rounded-lg`}
        style={{ animationDelay: `${i * 100}ms` }}
      >
        <Skeleton className="w-full h-full" />
      </div>
    ))}
  </div>
);

// Pulse loading animation
export const PulseLoader = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} rounded-full bg-primary animate-pulse`} />
    </div>
  );
};

// Loading dots animation
export const LoadingDots = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  };

  return (
    <div className="flex items-center space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} bg-primary rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
};

// Skeleton text with realistic proportions
export const SkeletonText = ({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number; 
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
      />
    ))}
  </div>
);

// Loading state for forms
export const FormLoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
);