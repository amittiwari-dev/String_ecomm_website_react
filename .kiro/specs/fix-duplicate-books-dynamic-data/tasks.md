# Implementation Plan

- [x] 1. Create deduplication utility functions
  - Create new file `src/utils/deduplication.ts`
  - Implement `deduplicateBooks()` function that removes duplicate Book entities by ID
  - Implement `filterInvalidBooks()` function that removes books with invalid IDs (0, null, undefined)
  - Add console warnings for detected duplicates and invalid books
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 2.5_

- [x] 2. Clean up mock data file
  - Open `src/data/mockData.ts` and locate duplicate book entries at the end of the file
  - Remove the duplicate book entries (IDs 1-15 that are repeated)
  - Reduce the programmatically generated books section from 50 to 10 books
  - Verify final mock data contains approximately 26 unique books
  - Ensure all major categories are represented in the remaining books
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Update Index.tsx to use API-first approach with deduplication
  - Import deduplication utility functions at the top of the file
  - Update the `fetchBooks` function to prioritize API data over mock data
  - Add validation to filter invalid book IDs from API response
  - Add deduplication logic for API response data
  - Update fallback logic to deduplicate mock data before use
  - Add toast notification when falling back to mock data
  - Add console logging for data source and book count
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Update AllBooks.tsx to use API-first approach with deduplication
  - Import deduplication utility functions at the top of the file
  - Update the `fetchBooks` function to prioritize API data over mock data
  - Add validation to filter invalid book IDs from API response
  - Add deduplication logic for API response data
  - Update fallback logic to deduplicate mock data before use
  - Add toast notification when falling back to mock data
  - Add console logging for data source and book count
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5. Verify and test the implementation
  - Test with API available: verify books load from backend, no duplicates shown
  - Test with API unavailable: verify fallback to mock data works, toast notification appears
  - Verify console logs show correct data source and warnings for duplicates/invalid IDs
  - Check that all pages (Index, AllBooks) display unique books only
  - Verify category filtering still works correctly
  - _Requirements: 1.1, 1.4, 2.3, 3.5_
