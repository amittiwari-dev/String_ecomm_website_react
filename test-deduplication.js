// Test script to verify deduplication implementation
const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function testApiBooks() {
  console.log('\n=== Testing API Books ===');
  try {
    const response = await fetch(`${API_BASE_URL}/new-books`);
    const data = await response.json();
    
    if (data.status === 200 && Array.isArray(data.records)) {
      console.log(`✅ API returned ${data.records.length} books`);
      
      // Check for duplicates
      const ids = data.records.map(book => book.id);
      const uniqueIds = new Set(ids);
      
      if (ids.length !== uniqueIds.size) {
        console.log(`⚠️  Found ${ids.length - uniqueIds.size} duplicate(s) in API response`);
      } else {
        console.log('✅ No duplicates in API response');
      }
      
      // Check for invalid IDs
      const invalidBooks = data.records.filter(book => !book.id || book.id === 0 || book.id === '0');
      if (invalidBooks.length > 0) {
        console.log(`⚠️  Found ${invalidBooks.length} book(s) with invalid IDs`);
      } else {
        console.log('✅ All books have valid IDs');
      }
      
      return true;
    }
  } catch (error) {
    console.log(`❌ API test failed: ${error.message}`);
    return false;
  }
}

async function testCategoryBooks() {
  console.log('\n=== Testing Category Books ===');
  const categories = [
    'books-on-shirdi-sai-baba',
    'other-religious-books',
    'coffee-table-books-and-paperbacks',
    'text-book'
  ];
  
  for (const category of categories) {
    try {
      const response = await fetch(`${API_BASE_URL}/book/${category}`);
      const data = await response.json();
      
      if (data.status === 200 && Array.isArray(data.records)) {
        console.log(`✅ Category "${category}": ${data.records.length} books`);
      } else {
        console.log(`⚠️  Category "${category}": Invalid response`);
      }
    } catch (error) {
      console.log(`❌ Category "${category}": ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('🧪 Starting Deduplication Tests...\n');
  
  const apiWorking = await testApiBooks();
  
  if (apiWorking) {
    await testCategoryBooks();
  }
  
  console.log('\n✅ Tests completed!');
  console.log('\nNext steps:');
  console.log('1. Open http://localhost:5174 in your browser');
  console.log('2. Check browser console for deduplication logs');
  console.log('3. Verify no duplicate books are displayed');
  console.log('4. Test with API disconnected to verify fallback works');
}

runTests();
