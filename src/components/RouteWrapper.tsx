import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface RouteWrapperProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  redirectTo?: string;
  title?: string;
  loadingComponent?: React.ComponentType;
  preserveScrollPosition?: boolean;
}

/**
 * RouteWrapper component - Provides consistent page loading, authentication checks, and title management
 * 
 * This component handles:
 * - Authentication checks and redirects for protected routes
 * - Page title management
 * - Loading states during authentication checks
 * - Preserves intended destination for post-login redirect
 * - Scroll position restoration on page refresh
 * - State restoration from URL parameters
 * 
 * Requirements: 2.1, 2.2, 2.3
 */
const RouteWrapper: React.FC<RouteWrapperProps> = ({
  children,
  requiresAuth = false,
  redirectTo = '/login',
  title,
  loadingComponent: LoadingComponent,
  preserveScrollPosition = true,
}) => {
  const { state: authState } = useAuth();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isFirstRender = useRef(true);

  // Set page title when component mounts or title changes
  useEffect(() => {
    if (title) {
      document.title = `${title} - Bookstore`;
    }
  }, [title]);

  // Wait for auth initialization to complete
  useEffect(() => {
    // If auth is not loading, mark as initialized
    if (!authState.isLoading) {
      setIsInitialized(true);
    }
  }, [authState.isLoading]);

  // Handle scroll position restoration
  useEffect(() => {
    if (!preserveScrollPosition) return;

    const handleBeforeUnload = () => {
      // Save current scroll position before page unload
      const scrollPosition = {
        x: window.scrollX,
        y: window.scrollY
      };
      sessionStorage.setItem(
        `scroll-${location.pathname}${location.search}`,
        JSON.stringify(scrollPosition)
      );
    };

    // Save scroll position on route changes
    const saveScrollPosition = () => {
      if (!isFirstRender.current) {
        const scrollPosition = {
          x: window.scrollX,
          y: window.scrollY
        };
        sessionStorage.setItem(
          `scroll-${location.pathname}${location.search}`,
          JSON.stringify(scrollPosition)
        );
      }
    };

    // Restore scroll position after component mounts and auth is initialized
    const restoreScrollPosition = () => {
      if (isInitialized && isFirstRender.current) {
        const savedPosition = sessionStorage.getItem(
          `scroll-${location.pathname}${location.search}`
        );
        
        if (savedPosition) {
          try {
            const position = JSON.parse(savedPosition);
            // Use setTimeout to ensure DOM is fully rendered
            setTimeout(() => {
              window.scrollTo(position.x, position.y);
            }, 100);
          } catch (error) {
            console.warn('Failed to restore scroll position:', error);
          }
        }
        isFirstRender.current = false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Save scroll position when leaving this route
    saveScrollPosition();
    
    // Restore scroll position when entering this route
    restoreScrollPosition();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveScrollPosition();
    };
  }, [location.pathname, location.search, isInitialized, preserveScrollPosition]);

  // Handle browser back/forward navigation state restoration
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Browser back/forward navigation occurred
      // The URL state hooks will automatically handle state restoration
      // We just need to ensure scroll position is restored
      if (preserveScrollPosition && event.state?.scrollPosition) {
        setTimeout(() => {
          window.scrollTo(event.state.scrollPosition.x, event.state.scrollPosition.y);
        }, 100);
      }
    };

    // Save current state to history when navigating
    const saveCurrentState = () => {
      const currentState = {
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        },
        timestamp: Date.now(),
        pathname: location.pathname,
        search: location.search
      };

      // Replace current history state with enhanced state
      if (window.history.state !== currentState) {
        window.history.replaceState(currentState, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Save state when component mounts and when location changes
    saveCurrentState();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      saveCurrentState(); // Save state when component unmounts
    };
  }, [location.pathname, location.search, preserveScrollPosition]);

  // Show loading state while authentication is being checked
  if (!isInitialized || authState.isLoading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle authentication requirements
  if (requiresAuth && !authState.isAuthenticated) {
    // In development mode, show a warning but allow access for testing
    if (import.meta.env.DEV) {
      console.warn('⚠️ DEV MODE: Accessing protected route without authentication');
    } else {
      // Preserve the intended destination for post-login redirect
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default RouteWrapper;