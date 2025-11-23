import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute component - Wrapper for routes requiring authentication
 * 
 * This component checks the authentication state and:
 * - Shows a loading spinner while checking authentication
 * - Redirects to login if user is not authenticated
 * - Preserves the intended destination for post-login redirect
 * - Renders children if user is authenticated
 * 
 * Requirements: 3.3, 6.5
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { state } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving intended destination
  if (!state.isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
