import React from 'react';
import RouteWrapper from './RouteWrapper';
import ErrorBoundary from './ErrorBoundary';

interface PageWrapperProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  title?: string;
  preserveScrollPosition?: boolean;
}

/**
 * PageWrapper component - Combines RouteWrapper with ErrorBoundary for complete page protection
 * 
 * This component provides:
 * - Error boundary protection for graceful error handling
 * - Route state management and authentication checks
 * - Scroll position restoration
 * - Page title management
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  requiresAuth = false,
  title,
  preserveScrollPosition = true,
}) => {
  return (
    <ErrorBoundary>
      <RouteWrapper
        requiresAuth={requiresAuth}
        title={title}
        preserveScrollPosition={preserveScrollPosition}
      >
        {children}
      </RouteWrapper>
    </ErrorBoundary>
  );
};

export default PageWrapper;