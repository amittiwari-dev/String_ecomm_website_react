#!/usr/bin/env node

/**
 * Test script to verify category structure and books
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function testCategoryStructure() {
  console.log('🔍 Testing Category Structure and Books...\n');
  
  try {
    // Test 1: Get all categories
    console.log('📋 Testing Categories API...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/categories`);
    
    if (!categoriesResponse.ok) {
      throw new Error(`Categories API failed with status ${categoriesResponse.status}`);
    }
    
    const categoriesData = await categoriesResponse.json();
    console.log('✅ Categories API Status:', categoriesData.status);
    
    // Filter main categories (no parent_id) and exclude 'Latest Releases'
    const mainCategories = categoriesData.data.filter(cat => 
      !cat.parent_id && cat.name !== 'Latest Releases'
    ).sort((a, b) => a.sort_order - b.sort_order);
    
    console.log(`✅ Found ${mainCategories.length} main categories`);
    
    // Show all categories
    console.log('\n📚 All Categories:');
    mainCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.book_count || 0} books) - slug: ${cat.slug}`);
    });
    
    // Categories with books
    const categoriesWithBooks = mainCategories.filter(cat => cat.book_count > 0);
    console.log(`\n✅ Categories with books: ${categoriesWithBooks.length}/${mainCategories.length}`);
    
    if (categoriesWithBooks.length > 0) {
      console.log('\n📖 Categories that will show book panels:');
      categoriesWithBooks.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name} (${cat.book_count} books)`);
      });
      
      // Test books for first category with books
      if (categoriesWithBooks.length > 0) {
        const firstCategory = categoriesWithBooks[0];
        console.log(`\n🔍 Testing books for "${firstCategory.name}"...`);
        
        try {
          const booksResponse = await fetch(`${API_BASE_URL}/products?category=${firstCategory.slug}&per_page=4`);
          
          if (booksResponse.ok) {
            const booksData = await booksResponse.json();
            console.log(`✅ Found ${booksData.data.length} books in ${firstCategory.name}`);
            
            if (booksData.data.length > 0) {
              console.log('   Sample books:');
              booksData.data.slice(0, 2).forEach((book, index) => {
                console.log(`      ${index + 1}. ${book.product_name} - ₹${book.price}`);
              });
            }
          } else {
            console.log(`   ⚠️  API returned ${booksResponse.status} for ${firstCategory.name}`);
          }
        } catch (error) {
          console.log(`   ❌ Error fetching books for ${firstCategory.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎯 Component Structure Summary:');
    console.log('   Section 1: All Categories Grid (old style with icons)');
    console.log(`      - Will show ${mainCategories.length} category cards`);
    console.log('   Section 2: Featured Books Panels');
    console.log(`      - Will show ${categoriesWithBooks.length} category panels with books`);
    
    console.log('\n🎉 Category structure test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your Laravel backend is running on http://127.0.0.1:8000');
  }
}

// Run the test
testCategoryStructure();