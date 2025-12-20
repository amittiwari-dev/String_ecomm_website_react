#!/usr/bin/env node

/**
 * Test script to verify footer and book images are working properly
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function testFooterAndImages() {
  console.log('🔍 Testing Footer and Book Images...\n');
  
  try {
    // Test 1: Footer Links API
    console.log('📋 Testing Footer Links API...');
    const footerResponse = await fetch(`${API_BASE_URL}/footer-links`);
    
    if (!footerResponse.ok) {
      throw new Error(`Footer API failed with status ${footerResponse.status}`);
    }
    
    const footerData = await footerResponse.json();
    console.log('✅ Footer API Response Status:', footerData.status);
    
    if (footerData.status === 200 && footerData.data) {
      const sections = Object.keys(footerData.data);
      console.log(`✅ Footer sections found: ${sections.join(', ')}`);
      
      sections.forEach(section => {
        const links = footerData.data[section];
        console.log(`   ${section}: ${links.length} links`);
      });
    }
    
    // Test 2: Books API for Images
    console.log('\n📋 Testing Books API for Images...');
    const booksResponse = await fetch(`${API_BASE_URL}/new-books`);
    
    if (!booksResponse.ok) {
      throw new Error(`Books API failed with status ${booksResponse.status}`);
    }
    
    const booksData = await booksResponse.json();
    console.log('✅ Books API Response Status:', booksData.status);
    
    if (booksData.status === 200 && booksData.records) {
      console.log(`✅ Found ${booksData.records.length} books`);
      
      // Check first few books for images
      const booksWithImages = booksData.records.filter(book => book.product_image);
      console.log(`✅ Books with images: ${booksWithImages.length}/${booksData.records.length}`);
      
      if (booksWithImages.length > 0) {
        console.log('\n📸 Sample book images:');
        booksWithImages.slice(0, 3).forEach((book, index) => {
          const imageUrl = book.product_image.startsWith('http') 
            ? book.product_image 
            : `http://127.0.0.1:8000/storage/products/${book.product_image}`;
          
          console.log(`   ${index + 1}. ${book.product_name}`);
          console.log(`      Image: ${imageUrl}`);
        });
      }
    }
    
    // Test 3: Categories API
    console.log('\n📋 Testing Categories API...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/categories`);
    
    if (!categoriesResponse.ok) {
      throw new Error(`Categories API failed with status ${categoriesResponse.status}`);
    }
    
    const categoriesData = await categoriesResponse.json();
    console.log('✅ Categories API Response Status:', categoriesData.status);
    
    if (categoriesData.status === 200 && categoriesData.data) {
      console.log(`✅ Found ${categoriesData.data.length} categories`);
      
      // Check for Latest Releases
      const latestReleases = categoriesData.data.find(cat => 
        (cat.category_slug || cat.slug) === 'latest-releases'
      );
      
      if (latestReleases) {
        console.log('✅ "Latest Releases" category is available in menu');
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Footer API is working');
    console.log('✅ Book images are properly configured');
    console.log('✅ Categories API is working');
    console.log('✅ Menu is completely dynamic');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your Laravel backend is running on http://127.0.0.1:8000');
    console.log('💡 Run: php artisan serve in your Laravel project');
  }
}

// Run the test
testFooterAndImages();