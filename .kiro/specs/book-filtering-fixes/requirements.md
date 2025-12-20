# Book Filtering and Display Fixes - Requirements Document

## Introduction

This specification addresses critical issues with book filtering, latest releases display, authors page functionality, and category visibility in the Sterling Publishers e-commerce application. The current system has filtering problems where the same books appear across different sections, authors page is non-functional, and not all categories are visible in the "Our Books" section.

## Glossary

- **Book_System**: The frontend React application that displays books and handles filtering
- **API_Backend**: The Laravel backend that provides book data and filtering endpoints
- **Latest_Releases_Filter**: A filtering mechanism that shows only books marked as latest releases
- **Category_Filter**: A filtering system that displays books by category and subcategory
- **Authors_System**: The component responsible for displaying author information and their books
- **Deduplication_System**: The mechanism that prevents duplicate books from appearing in results

## Requirements

### Requirement 1: Latest Releases Filtering

**User Story:** As a user browsing latest releases, I want to see only the newest books without duplicates, so that I can discover fresh content.

#### Acceptance Criteria

1. WHEN a user visits the latest releases page, THE Book_System SHALL display only books where is_latest_release is true
2. WHEN filtering by latest releases, THE Book_System SHALL prevent duplicate books from appearing in the results
3. WHEN no latest releases are available, THE Book_System SHALL display an appropriate empty state message
4. THE API_Backend SHALL properly filter products using the is_latest_release field in the database
5. THE Book_System SHALL handle the latest-releases category parameter correctly in API requests

### Requirement 2: Authors Page Functionality

**User Story:** As a user interested in authors, I want to browse author profiles and their books, so that I can explore works by specific writers.

#### Acceptance Criteria

1. THE API_Backend SHALL provide an authors endpoint that returns all authors with their book counts
2. WHEN a user visits the authors page, THE Authors_System SHALL display a list of available authors
3. WHEN a user searches for authors, THE Authors_System SHALL filter results by author name
4. WHEN a user clicks on an author, THE Book_System SHALL display books by that specific author
5. THE Authors_System SHALL display author information including name and number of published books

### Requirement 3: Complete Category Display

**User Story:** As a user browsing books, I want to see all available categories in the "Our Books" section, so that I can explore the complete catalog.

#### Acceptance Criteria

1. THE Category_Filter SHALL display all categories that contain at least one active book
2. WHEN loading categories, THE Book_System SHALL include subcategories with their book counts
3. THE API_Backend SHALL return accurate book counts for each category and subcategory
4. WHEN a category has no books, THE Category_Filter SHALL not display that category
5. THE Book_System SHALL handle category filtering without showing duplicate books across categories

### Requirement 4: Book Deduplication

**User Story:** As a user browsing books, I want to see each book only once in search results, so that I don't encounter confusing duplicates.

#### Acceptance Criteria

1. THE Deduplication_System SHALL remove duplicate books based on unique product IDs
2. WHEN books are fetched from the API, THE Book_System SHALL apply deduplication before displaying results
3. THE Book_System SHALL maintain book uniqueness across different filter combinations
4. WHEN sorting or filtering books, THE Deduplication_System SHALL preserve the uniqueness of results
5. THE API_Backend SHALL ensure each product has a unique identifier for proper deduplication

### Requirement 5: Enhanced API Filtering

**User Story:** As a user applying multiple filters, I want accurate results that respect all my filter criteria, so that I can find exactly what I'm looking for.

#### Acceptance Criteria

1. THE API_Backend SHALL support combined filtering by category, subcategory, price range, and search terms
2. WHEN multiple filters are applied, THE API_Backend SHALL return books that match all criteria
3. THE API_Backend SHALL handle the latest-releases filter as a special category type
4. WHEN sorting is applied with filters, THE API_Backend SHALL maintain filter accuracy while applying sort order
5. THE Book_System SHALL send correct filter parameters to the API based on user selections