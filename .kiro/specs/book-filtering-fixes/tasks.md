# Implementation Plan

- [-] 1. Fix Latest Releases Backend Filtering
  - Update the getProducts method in ApiController to properly handle latest releases filtering
  - Ensure is_latest_release field is properly queried and not mixed with other books
  - Add proper database indexes for performance
  - _Requirements: 1.1, 1.4_

- [ ] 2. Create Authors API Endpoints
  - [ ] 2.1 Create AuthorsController with getAuthors method
    - Implement endpoint to return all authors with book counts
    - Add search functionality for authors by name
    - Include pagination support for large author lists
    - _Requirements: 2.1, 2.2_

  - [ ] 2.2 Add getAuthorBooks method to AuthorsController
    - Create endpoint to get books by specific author ID
    - Support filtering and sorting for author's books
    - Include proper error handling for invalid author IDs
    - _Requirements: 2.4_

  - [ ] 2.3 Add authors routes to API
    - Register new authors endpoints in api.php routes file
    - Ensure proper middleware and validation
    - _Requirements: 2.1_

- [ ] 3. Fix Category Display and Filtering
  - [ ] 3.1 Update MenuController getCategories method
    - Modify to return accurate book counts for each category
    - Include subcategories with their individual book counts
    - Filter out categories and subcategories with zero books
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.2 Enhance Products API category filtering
    - Fix category filtering logic to prevent duplicate books
    - Improve subcategory filtering accuracy
    - Ensure proper joins between products, categories, and subcategories
    - _Requirements: 3.5, 4.3_

- [ ] 4. Implement Frontend Authors Page
  - [ ] 4.1 Create AuthorsService for API calls
    - Add methods to fetch authors list and author books
    - Implement search functionality for authors
    - Handle API errors and loading states
    - _Requirements: 2.1, 2.2_

  - [ ] 4.2 Update Authors.tsx component
    - Replace empty state with actual authors data
    - Implement author search and filtering
    - Add proper loading and error states
    - Create author cards with book counts
    - _Requirements: 2.2, 2.3_

  - [ ] 4.3 Create AuthorBooks page component
    - New page to display books by specific author
    - Include filtering and sorting for author's books
    - Add breadcrumb navigation back to authors list
    - _Requirements: 2.4_

- [ ] 5. Fix Latest Releases Frontend Filtering
  - [ ] 5.1 Update AllBooks.tsx latest releases logic
    - Fix the isLatestReleasesPage filtering to use correct API parameters
    - Ensure latest-releases category parameter is sent correctly
    - Remove client-side filtering that conflicts with backend filtering
    - _Requirements: 1.1, 1.2_

  - [ ] 5.2 Update ProgressiveBookGrid latest releases handling
    - Fix the loadMoreBooks function to handle latest releases properly
    - Remove conflicting client-side filtering logic
    - Ensure proper API endpoint usage for latest releases
    - _Requirements: 1.1, 1.2_

- [ ] 6. Enhance Book Deduplication System
  - [ ] 6.1 Improve backend deduplication
    - Add DISTINCT clause to product queries where needed
    - Ensure unique product IDs in all API responses
    - Fix any database issues causing duplicate entries
    - _Requirements: 4.1, 4.2_

  - [ ] 6.2 Update frontend deduplication utilities
    - Enhance deduplicateBooks function in utils/deduplication.ts
    - Ensure deduplication works with new filtering logic
    - Add validation for book ID uniqueness
    - _Requirements: 4.2, 4.3_

- [ ] 7. Fix Category Display in AllBooks
  - [ ] 7.1 Update category loading in AllBooks.tsx
    - Fix fetchCategories function to show all categories with books
    - Ensure proper error handling for category loading
    - Update category display logic to show accurate book counts
    - _Requirements: 3.1, 3.2_

  - [ ] 7.2 Fix category filtering parameters
    - Ensure category and subcategory filters are sent correctly to API
    - Fix URL parameter handling for category navigation
    - Update category selection logic to clear conflicting filters
    - _Requirements: 3.5, 5.2_

- [ ] 8. Add Database Indexes and Optimizations
  - Create database indexes for filtering performance on is_latest_release, category_id, and author_id fields
  - Optimize category book count queries
  - Add caching for frequently accessed data
  - _Requirements: 1.4, 3.3_

- [ ] 9. Add Comprehensive Testing
  - [ ] 9.1 Write backend API tests
    - Test latest releases filtering accuracy
    - Test authors endpoints functionality
    - Test category filtering with accurate counts
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ] 9.2 Write frontend component tests
    - Test AllBooks filtering behavior
    - Test Authors page functionality
    - Test deduplication system
    - _Requirements: 1.2, 2.2, 4.2_

  - [ ] 9.3 Add end-to-end tests
    - Test complete user journeys through filtering
    - Test authors browsing and book discovery
    - Test category navigation workflows
    - _Requirements: 1.1, 2.4, 3.5_