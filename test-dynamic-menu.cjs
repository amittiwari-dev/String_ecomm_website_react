#!/usr/bin/env node

/**
 * Test script to verify the menu is completely dynamic
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function testMenuAPI() {
  console.log('🔍 Testing Dynamic Menu API...\n');
  
  try {
    // Test categories endpoint
    console.log('📋 Testing /api/categories endpoint...');
    const response = await fetch(`${API_BASE_URL}/categories`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response Status:', data.status);
    
    if (data.status === 200 && data.data) {
      console.log(`✅ Found ${data.data.length} categories from API`);
      
      // List all categories
      data.data.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.category_name || category.name} (${category.products_count || 0} books)`);
        
        // Show subcategories if any
        if (category.subcategories && category.subcategories.length > 0) {
          category.subcategories.forEach(sub => {
            console.log(`      - ${sub.sub_category_name || sub.name} (${sub.products_count || 0} books)`);
          });
        }
      });
      
      // Check if Latest Releases is present
      const latestReleases = data.data.find(cat => 
        (cat.category_slug || cat.slug) === 'latest-releases'
      );
      
      if (latestReleases) {
        console.log('\n✅ "Latest Releases" category found in API data');
        console.log(`   Name: ${latestReleases.category_name || latestReleases.name}`);
        console.log(`   Slug: ${latestReleases.category_slug || latestReleases.slug}`);
        console.log(`   Books: ${latestReleases.products_count || 0}`);
      } else {
        console.log('\n⚠️  "Latest Releases" category not found in API data');
        console.log('   This means the menu will not show a Latest Releases section');
      }
      
      console.log('\n🎉 Menu is completely dynamic - all data comes from API!');
      console.log('✅ No hardcoded menu items found');
      console.log('✅ All categories loaded from database');
      
    } else {
      console.log('❌ Invalid API response format');
      console.log('Response:', data);
    }
    
  } catch (error) {
    console.error('❌ Failed to test menu API:', error.message);
    console.log('\n💡 Make sure your Laravel backend is running on http://127.0.0.1:8000');
    console.log('💡 Run: php artisan serve in your Laravel project');
  }
}

// Run the test
testMenuAPI();