#!/usr/bin/env node

/**
 * Final Verification Test for Task 5
 * Tests all aspects of the deduplication implementation
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'cyan');
  console.log('='.repeat(60));
}

async function test1_ApiAvailable() {
  header('TEST 1: API Available - Books Load from Backend');
  
  try {
    const response = await fetch(`${API_BASE_URL}/new-books`);
    const data = await response.json();
    
    if (data.status === 200 && Array.isArray(data.records)) {
      log(`✅ PASS: API returned ${data.records.length} books`, 'green');
      
      // Check for duplicates
      const ids = data.records.map(book => book.id);
      const uniqueIds = new Set(ids);
      
      if (ids.length === uniqueIds.size) {
        log('✅ PASS: No duplicate IDs in API response', 'green');
      } else {
        log(`❌ FAIL: Found ${ids.length - uniqueIds.size} duplicate(s)`, 'red');
        return false;
      }
      
      // Check for invalid IDs
      const invalidBooks = data.records.filter(book => !book.id || book.id === 0 || book.id === '0');
      if (invalidBooks.length === 0) {
        log('✅ PASS: All books have valid IDs', 'green');
      } else {
        log(`❌ FAIL: Found ${invalidBooks.length} book(s) with invalid IDs`, 'red');
        return false;
      }
      
      return true;
    } else {
      log('❌ FAIL: Invalid API response', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    return false;
  }
}

async function test2_CategoryBooks() {
  header('TEST 2: Category Books Load Correctly');
  
  const categories = [
    { slug: 'books-on-shirdi-sai-baba', name: 'Books on Shirdi Sai Baba' },
    { slug: 'other-religious-books', name: 'Other Religious Books' },
    { slug: 'coffee-table-books-and-paperbacks', name: 'Coffee Table Books' },
    { slug: 'text-book', name: 'Text Books' }
  ];
  
  let allPassed = true;
  
  for (const category of categories) {
    try {
      const response = await fetch(`${API_BASE_URL}/book/${category.slug}`);
      const data = await response.json();
      
      if (data.status === 200 && Array.isArray(data.records)) {
        log(`✅ PASS: ${category.name}: ${data.records.length} books`, 'green');
      } else {
        log(`❌ FAIL: ${category.name}: Invalid response`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`❌ FAIL: ${category.name}: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function test3_DeduplicationUtility() {
  header('TEST 3: Deduplication Utility Functions');
  
  log('Checking deduplication.ts file...', 'blue');
  
  const { readFileSync } = await import('fs');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = join(__dirname, 'src', 'utils', 'deduplication.ts');
    const content = readFileSync(filePath, 'utf8');
    
    // Check for required functions
    if (content.includes('export function deduplicateBooks')) {
      log('✅ PASS: deduplicateBooks() function exists', 'green');
    } else {
      log('❌ FAIL: deduplicateBooks() function not found', 'red');
      return false;
    }
    
    if (content.includes('export function filterInvalidBooks')) {
      log('✅ PASS: filterInvalidBooks() function exists', 'green');
    } else {
      log('❌ FAIL: filterInvalidBooks() function not found', 'red');
      return false;
    }
    
    // Check for warning logs
    if (content.includes('console.warn') && content.includes('Duplicate book detected')) {
      log('✅ PASS: Duplicate warning logs implemented', 'green');
    } else {
      log('❌ FAIL: Duplicate warning logs not found', 'red');
      return false;
    }
    
    if (content.includes('console.warn') && content.includes('Invalid book ID detected')) {
      log('✅ PASS: Invalid ID warning logs implemented', 'green');
    } else {
      log('❌ FAIL: Invalid ID warning logs not found', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    return false;
  }
}

async function test4_PagesImplementation() {
  header('TEST 4: Pages Use Deduplication');
  
  const fs = require('fs');
  const path = require('path');
  
  const pages = ['Index.tsx', 'AllBooks.tsx'];
  let allPassed = true;
  
  for (const page of pages) {
    try {
      const filePath = path.join(__dirname, 'src', 'pages', page);
      const content = fs.readFileSync(filePath, 'utf8');
      
      log(`\nChecking ${page}...`, 'blue');
      
      // Check for imports
      if (content.includes('import { deduplicateBooks, filterInvalidBooks }')) {
        log(`✅ PASS: ${page} imports deduplication utilities`, 'green');
      } else {
        log(`❌ FAIL: ${page} missing deduplication imports`, 'red');
        allPassed = false;
      }
      
      // Check for API-first approach
      if (content.includes('filterInvalidBooks') && content.includes('deduplicateBooks')) {
        log(`✅ PASS: ${page} uses deduplication functions`, 'green');
      } else {
        log(`❌ FAIL: ${page} doesn't use deduplication functions`, 'red');
        allPassed = false;
      }
      
      // Check for fallback logic
      if (content.includes('Using Offline Data') || content.includes('Using mock data fallback')) {
        log(`✅ PASS: ${page} has fallback logic with notification`, 'green');
      } else {
        log(`❌ FAIL: ${page} missing fallback notification`, 'red');
        allPassed = false;
      }
      
      // Check for console logging
      if (content.includes('console.log') && content.includes('Loaded') && content.includes('books')) {
        log(`✅ PASS: ${page} has console logging`, 'green');
      } else {
        log(`❌ FAIL: ${page} missing console logging`, 'red');
        allPassed = false;
      }
      
    } catch (error) {
      log(`❌ FAIL: ${page}: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function test5_MockDataCleanup() {
  header('TEST 5: Mock Data Cleanup');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const filePath = path.join(__dirname, 'src', 'data', 'mockData.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract book IDs
    const bookSection = content.match(/export const books: Book\[\] = \[([\s\S]*?)\];/);
    if (!bookSection) {
      log('❌ FAIL: Could not find books array', 'red');
      return false;
    }
    
    const idMatches = bookSection[1].match(/id:\s*['"](\d+)['"]/g);
    if (!idMatches) {
      log('❌ FAIL: Could not extract book IDs', 'red');
      return false;
    }
    
    const ids = idMatches.map(match => match.match(/['"](\d+)['"]/)[1]);
    const uniqueIds = new Set(ids);
    
    log(`Total books in mock data: ${ids.length}`, 'blue');
    log(`Unique books: ${uniqueIds.size}`, 'blue');
    
    if (ids.length === uniqueIds.size) {
      log('✅ PASS: No duplicate books in mock data', 'green');
    } else {
      log(`❌ FAIL: Found ${ids.length - uniqueIds.size} duplicate(s) in mock data`, 'red');
      return false;
    }
    
    if (ids.length <= 26) {
      log(`✅ PASS: Mock data has ${ids.length} books (within target of ~26)`, 'green');
    } else {
      log(`⚠️  WARNING: Mock data has ${ids.length} books (target was ~26)`, 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 FINAL VERIFICATION TEST SUITE', 'cyan');
  log('Task 5: Verify and test the implementation\n', 'cyan');
  
  const results = {
    test1: await test1_ApiAvailable(),
    test2: await test2_CategoryBooks(),
    test3: await test3_DeduplicationUtility(),
    test4: await test4_PagesImplementation(),
    test5: await test5_MockDataCleanup(),
  };
  
  header('FINAL RESULTS');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  
  console.log('\nTest Results:');
  console.log(`  Test 1 (API Available): ${results.test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Test 2 (Category Books): ${results.test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Test 3 (Deduplication Utility): ${results.test3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Test 4 (Pages Implementation): ${results.test4 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Test 5 (Mock Data Cleanup): ${results.test5 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log(`\n${'='.repeat(60)}`);
  if (passed === total) {
    log(`\n🎉 ALL TESTS PASSED! (${passed}/${total})`, 'green');
    log('\n✅ Task 5 is COMPLETE and verified!', 'green');
    log('\nThe implementation is ready for production.', 'green');
  } else {
    log(`\n⚠️  SOME TESTS FAILED (${passed}/${total} passed)`, 'yellow');
    log('\nPlease review the failed tests above.', 'yellow');
  }
  console.log(`${'='.repeat(60)}\n`);
  
  log('Manual Verification Steps:', 'cyan');
  log('1. Open http://localhost:5174 in your browser', 'blue');
  log('2. Open browser console (F12)', 'blue');
  log('3. Look for: "✅ Loaded X unique books from API"', 'blue');
  log('4. Verify no duplicate books are displayed', 'blue');
  log('5. Stop backend and refresh to test fallback', 'blue');
  log('6. Look for toast: "Using Offline Data"', 'blue');
  
  return passed === total;
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
