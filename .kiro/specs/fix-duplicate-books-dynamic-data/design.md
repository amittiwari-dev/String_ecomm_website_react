# Design Document

## Overview

This design addresses the duplicate book entries and static data dependency issues in the React application. The solution involves cleaning up the mock data file, implementing deduplication logic, and ensuring the application prioritizes dynamic API data over static mock data.

## Architecture

### Current State
- Mock data file contains duplicate book entries (IDs 1-15 repeated at the end)
- Pages use mock data even when API is available
- No deduplication logic exists
- Approximately 66+ book entries with duplicates

### Target State
- Clean mock data with ~20 unique representative books
- API-first data fetching with mock data as fallback only
- Deduplication utility function
- Clear logging for data source and issues

## Components and Interfaces

### 1. Mock Data File (`src/data/mockData.ts`)

**Changes:**
- Remove duplicate book entries (IDs 1-15 at the end)
- Reduce to 20 representative books covering all categories
- Keep the programmatically generated books section but limit to 10 additional books
- Maintain existing TypeScript interfaces

**Structure:**
```typescript
export const books: Book[] = [
  // 16 manually defined unique books (IDs 1-16)
  // 10 programmatically generated books (IDs 17-26)
  // Total: ~26 books maximum
];
```

### 2. Deduplication Utility (`src/utils/deduplication.ts`)

**New utility file** to handle duplicate removal:

```typescript
export function deduplicateBooks(books: Book[]): Book[] {
  const seen = new Set<string>();
  const unique: Book[] = [];
  
  for (const book of books) {
    if (!seen.has(book.id)) {
      seen.add(book.id);
      unique.push(book);
    } else {
      console.warn(`Duplicate book detected: ${book.title} (ID: ${book.id})`);
    }
  }
  
  return unique;
}

export function filterInvalidBooks(books: Book[]): Book[] {
  return books.filter(book => {
    const isValid = book.id && book.id !== '0' && book.id !== 0;
    if (!isValid) {
      console.warn(`Invalid book ID detected: ${book.title}`);
    }
    return isValid;
  });
}
```

### 3. Data Fetching Strategy

**Update pages to follow this pattern:**

1. **Try API first** - Always attempt to fetch from backend
2. **Validate API data** - Filter invalid IDs, deduplicate
3. **Fallback to mock** - Only if API fails
4. **Clean mock data** - Deduplicate mock data before use
5. **User notification** - Show toast when using fallback

**Implementation in Index.tsx and AllBooks.tsx:**

```typescript
const fetchBooks = async () => {
  try {
    // 1. Try API
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/new-books`);
      const data = await response.json();
      
      if (data.status === 200 && Array.isArray(data.records)) {
        // 2. Validate and clean API data
        const validBooks = filterInvalidBooks(data.records);
        const uniqueBooks = deduplicateBooks(validBooks);
        
        setBooks(uniqueBooks);
        console.log(`✅ Loaded ${uniqueBooks.length} books from API`);
        return;
      }
    }
    
    // 3. Fallback to mock
    throw new Error('API unavailable');
    
  } catch (error) {
    console.warn('Using mock data fallback:', error);
    
    // 4. Clean mock data
    const { books: mockBooks } = await import('@/data/mockData');
    const uniqueMockBooks = deduplicateBooks(mockBooks);
    
    setBooks(uniqueMockBooks);
    
    // 5. Notify user
    toast({
      title: "Using Offline Data",
      description: "Showing cached book catalog",
      variant: "default",
    });
  }
};
```

## Data Models

### Book Interface (No Changes)
The existing `Book` interface in `mockData.ts` remains unchanged:

```typescript
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  language: string;
  format: 'Hardcover' | 'Paperback' | 'eBook';
  price: number;
  currency: string;
  isbn10?: string;
  isbn13?: string;
  publication_date: string;
  pages?: number;
  stock_status: 'In Stock' | 'Out of Stock' | 'Preorder';
  images: string[];
  authors: Author[];
  series?: string;
  category_id: string;
  tags: string[];
  bestseller_rank?: number;
  is_latest_release: boolean;
  rating?: number;
}
```

## Error Handling

### API Failure Scenarios

1. **Network Error**: Catch and fallback to mock data
2. **Invalid Response**: Validate response structure, fallback if invalid
3. **Empty Response**: Log warning, fallback to mock data
4. **Timeout**: Set reasonable timeout (5s), fallback on timeout

### Data Validation

1. **Invalid IDs**: Filter out books with ID = 0, null, or undefined
2. **Duplicates**: Remove and log warning
3. **Missing Required Fields**: Log warning but keep book if ID and title exist

### User Notifications

- **API Success**: No notification (silent success)
- **Fallback Mode**: Toast notification "Using Offline Data"
- **No Data**: Error toast "Failed to load books"

## Testing Strategy

### Manual Testing Checklist

1. **API Available**:
   - Verify books load from API
   - Verify no duplicates displayed
   - Verify invalid IDs filtered out

2. **API Unavailable**:
   - Disconnect backend
   - Verify fallback to mock data
   - Verify toast notification appears
   - Verify no duplicates in mock data

3. **Mock Data**:
   - Verify only ~26 books in mock file
   - Verify no duplicate IDs
   - Verify all categories represented

4. **Page-Specific**:
   - Test Index.tsx (home page)
   - Test AllBooks.tsx (all books page)
   - Test category filtering
   - Test search functionality

### Console Logging

Add strategic console logs:
- `✅ Loaded X books from API`
- `⚠️ Duplicate book detected: [title]`
- `⚠️ Invalid book ID detected: [title]`
- `🔄 Using mock data fallback`

## Implementation Notes

### Files to Modify

1. **src/data/mockData.ts** - Remove duplicates, reduce to ~26 books
2. **src/utils/deduplication.ts** - New file with utility functions
3. **src/pages/Index.tsx** - Update data fetching logic
4. **src/pages/AllBooks.tsx** - Update data fetching logic
5. **src/pages/DetailsPage.tsx** - Ensure consistent data handling

### Backward Compatibility

- Existing Book interface unchanged
- Existing API endpoints unchanged
- Existing components work without modification
- Only data fetching logic updated

### Performance Considerations

- Deduplication is O(n) with Set-based lookup
- Minimal overhead for small datasets (<100 books)
- No impact on rendering performance
- Mock data reduced from 66+ to ~26 books (faster fallback)
