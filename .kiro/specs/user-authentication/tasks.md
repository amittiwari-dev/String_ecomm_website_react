# Implementation Plan

- [x] 1. Set up authentication utilities and types
  - Create TypeScript interfaces for User, AuthState, and API request/response types
  - Implement token storage utilities (getToken, setToken, removeToken)
  - Create getAuthHeader utility function for adding authorization headers
  - _Requirements: 1.2, 2.2, 3.1, 3.2_

- [x] 2. Implement AuthContext for global authentication state
  - Create AuthContext with state management using useReducer
  - Implement login method that calls API and stores token
  - Implement register method that calls API and auto-logs in user
  - Implement logout method that clears token and resets state
  - Implement checkAuth method to validate token on app load
  - Add loading states for async operations
  - _Requirements: 1.2, 1.4, 2.2, 2.4, 3.1, 3.2, 3.3_

- [x] 3. Extend API service with authentication endpoints
  - Add AuthService.register method for POST /api/auth/register
  - Add AuthService.login method for POST /api/auth/login
  - Add AuthService.logout method for POST /api/auth/logout
  - Add AuthService.getCurrentUser method for GET /api/auth/me
  - Implement proper error handling for each endpoint
  - Add TypeScript types for all request/response payloads
  - _Requirements: 1.2, 1.3, 2.2, 2.3_

- [x] 4. Create Register page with form validation
  - [x] 4.1 Build Register page component structure
    - Create Register.tsx page component
    - Set up react-hook-form with zod validation schema
    - Add form fields: name, email, password, confirmPassword
    - Implement form layout using shadcn/ui components
    - _Requirements: 1.1, 4.2, 4.3, 4.4_
  
  - [x] 4.2 Implement password strength indicator
    - Create password strength calculation function
    - Add visual indicator component (weak/medium/strong)
    - Update indicator in real-time as user types
    - _Requirements: 1.5_
  
  - [x] 4.3 Add form submission and error handling
    - Connect form to AuthContext register method
    - Display loading state during API call
    - Show API error messages in form
    - Handle validation errors from backend
    - Redirect to home page on success
    - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.4, 4.5_
  
  - [x] 4.4 Add navigation link to login page
    - Add "Already have an account? Log in" link at bottom
    - Style link to match design system
    - _Requirements: 6.2_

- [x] 5. Create Login page with form validation
  - [x] 5.1 Build Login page component structure
    - Create Login.tsx page component
    - Set up react-hook-form with zod validation schema
    - Add form fields: email, password
    - Implement form layout using shadcn/ui components
    - _Requirements: 2.1, 4.1, 4.4_
  
  - [x] 5.2 Add form submission and error handling
    - Connect form to AuthContext login method
    - Display loading state during API call
    - Show API error messages in form
    - Handle invalid credentials error
    - Preserve cart contents during login
    - Redirect to intended page or home on success
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 4.1, 4.4, 4.5_
  
  - [x] 5.3 Add navigation link to register page
    - Add "Don't have an account? Sign up" link at bottom
    - Style link to match design system
    - _Requirements: 6.1_

- [x] 6. Update Header component with authentication UI
  - Add useAuth hook to access authentication state
  - Implement conditional rendering based on isAuthenticated
  - Add user dropdown menu with name/email display when authenticated
  - Add logout option in dropdown menu
  - Show login and register buttons when not authenticated
  - Hide login/register links on respective pages
  - Update mobile menu with authentication UI
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Create ProtectedRoute component
  - Build ProtectedRoute wrapper component
  - Check authentication state from AuthContext
  - Show loading spinner while checking auth
  - Redirect to login if not authenticated
  - Preserve intended destination in location state
  - Render children if authenticated
  - _Requirements: 3.3, 6.5_

- [x] 8. Integrate authentication with app routing
  - Wrap App component with AuthProvider
  - Add /login route to App.jsx
  - Add /register route to App.jsx
  - Implement redirect logic for authenticated users on login/register pages
  - Call checkAuth on app initialization
  - Update any routes that should be protected (future use)
  - _Requirements: 2.4, 3.1, 3.2, 6.4, 6.5_

- [x] 9. Add session persistence and token validation
  - Implement token storage in localStorage on login/register
  - Load token from localStorage on app mount
  - Validate token with backend on app load
  - Clear invalid/expired tokens automatically
  - Handle 401 responses globally for token expiration
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 10. Ensure cart preservation across authentication
  - Test cart items persist when logging in
  - Verify cart state maintained after page refresh
  - Ensure logout doesn't clear cart (optional based on requirements)
  - _Requirements: 2.5_

- [ ]* 11. Add comprehensive form validation feedback
  - Implement inline error messages for all form fields
  - Add email format validation with clear error message
  - Add password length validation (min 8 characters)
  - Add password strength requirements validation
  - Add password confirmation matching validation
  - Implement real-time error clearing as user corrects input
  - Style error messages consistently with design system
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 12. Implement responsive design for auth pages
  - Test login page on mobile, tablet, and desktop
  - Test register page on mobile, tablet, and desktop
  - Ensure forms are centered and properly sized
  - Verify touch-friendly button sizes on mobile
  - Test header authentication UI on all screen sizes
  - _Requirements: All requirements (cross-cutting)_
