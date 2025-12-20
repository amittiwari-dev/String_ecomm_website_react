// Book interface for type safety
interface Book {
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
  authors: Array<{
    id: string;
    name: string;
    slug: string;
    bio: string;
  }>;
  category_id: string;
  tags: string[];
  is_latest_release: boolean;
  rating?: number;
}

/**
 * Removes duplicate Book entities from an array based on their unique ID.
 * Retains the first occurrence of each unique book and logs warnings for duplicates.
 * 
 * @param books - Array of Book entities to deduplicate
 * @returns Array of unique Book entities
 */
export function deduplicateBooks(books: Book[]): Book[] {
  const seen = new Set<string>();
  const unique: Book[] = [];
  
  for (const book of books) {
    if (!seen.has(book.id)) {
      seen.add(book.id);
      unique.push(book);
    } else {
      console.warn(`⚠️ Duplicate book detected: "${book.title}" (ID: ${book.id})`);
    }
  }
  
  if (unique.length < books.length) {
    console.warn(`⚠️ Removed ${books.length - unique.length} duplicate book(s) from ${books.length} total entries`);
  }
  
  return unique;
}

/**
 * Filters out Book entities with invalid IDs (0, null, undefined, or empty string).
 * Logs warnings for each invalid book detected.
 * 
 * @param books - Array of Book entities to validate
 * @returns Array of Book entities with valid IDs
 */
export function filterInvalidBooks(books: Book[]): Book[] {
  const validBooks = books.filter(book => {
    const isValid = book.id && book.id !== '0';
    
    if (!isValid) {
      console.warn(`⚠️ Invalid book ID detected: "${book.title || 'Unknown Title'}" (ID: ${book.id})`);
    }
    
    return isValid;
  });
  
  if (validBooks.length < books.length) {
    console.warn(`⚠️ Filtered out ${books.length - validBooks.length} book(s) with invalid IDs`);
  }
  
  return validBooks;
}
