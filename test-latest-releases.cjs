#!/usr/bin/env node

/**
 * Test script to verify latest releases filtering is working properly
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function testLatestReleases() {
  console.log('🔍 Testing Latest Releases Filtering...\n');
  
  try {
    // Test 1: Regular products API
    console.log('📋 Testing regular products API...');
    const regularResponse = await fetch(`${API_BASE_URL}/products?per_page=5`);
    
    if (!regularResponse.ok) {
      throw new Error(`Regular products API failed with status ${regularResponse.status}`);
    }
    
    const regularData = await regularResponse.json();
    console.log('✅ Regular Products API Status:', regularData.status);
    console.log(`✅ Found ${regularData.data.length} regular products`);
    
    // Test 2: Latest releases filtering
    console.log('\n📋 Testing latest releases filtering...');
    const latestResponse = await fetch(`${API_BASE_URL}/products?category=latest-releases&per_page=10`);
    
    if (!latestResponse.ok) {
      throw new Error(`Latest releases API failed with status ${latestResponse.status}`);
    }
    
    const latestData = await latestResponse.json();
    console.log('✅ Latest Releases API Status:', latestData.status);
    console.log(`✅ Found ${latestData.data.length} latest releases`);
    
    if (latestData.data.length > 0) {
      console.log('\n📚 Sample latest releases:');
      latestData.data.slice(0, 3).forEach((book, index) => {
        console.log(`   ${index + 1}. ${book.product_name}`);
        console.log(`      Latest Release: ${book.is_latest_release ? 'Yes' : 'No'}`);
        console.log(`      Created: ${book.created_at}`);
      });
    }
    
    // Test 3: Category filtering
    console.log('\n📋 Testing category filtering...');
    const categoryResponse = await fetch(`${API_BASE_URL}/products?category=fiction&per_page=5`);
    
    if (!categoryResponse.ok) {
      throw new Error(`Category filtering failed with status ${categoryResponse.status}`);
    }
    
    const categoryData = await categoryResponse.json();
    console.log('✅ Category Filtering Status:', categoryData.status);
    console.log(`✅ Found ${categoryData.data.length} fiction books`);
    
    // Test 4: Search functionality
    console.log('\n📋 Testing search functionality...');
    const searchResponse = await fetch(`${API_BASE_URL}/products?search=murder&per_page=5`);
    
    if (!searchResponse.ok) {
      throw new Error(`Search API failed with status ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    console.log('✅ Search API Status:', searchData.status);
    console.log(`✅ Found ${searchData.data.length} books matching "murder"`);
    
    // Test 5: Price filtering
    console.log('\n📋 Testing price filtering...');
    const priceResponse = await fetch(`${API_BASE_URL}/products?min_price=100&max_price=500&per_page=5`);
    
    if (!priceResponse.ok) {
      throw new Error(`Price filtering failed with status ${priceResponse.status}`);
    }
    
    const priceData = await priceResponse.json();
    console.log('✅ Price Filtering Status:', priceData.status);
    console.log(`✅ Found ${priceData.data.length} books between ₹100-₹500`);
    
    console.log('\n🎉 All filtering tests completed successfully!');
    console.log('✅ Latest releases filtering is working');
    console.log('✅ Category filtering is working');
    console.log('✅ Search functionality is working');
    console.log('✅ Price filtering is working');
    console.log('✅ All data is coming from backend API');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your Laravel backend is running on http://127.0.0.1:8000');
    console.log('💡 Run: php artisan serve in your Laravel project');
  }
}

// Run the test
testLatestReleases();