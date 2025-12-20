// Test script to verify Footer API integration
const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function testFooterLinksAPI() {
  console.log('\n=== Testing Footer Links API ===');
  try {
    const response = await fetch(`${API_BASE_URL}/footer-links`);
    const data = await response.json();
    
    if (data.status === 200 && data.data) {
      console.log('✅ Footer Links API is working');
      console.log(`📊 Response structure:`, Object.keys(data.data));
      
      // Check each section
      const sections = ['quick_links', 'categories', 'contact'];
      sections.forEach(section => {
        if (data.data[section]) {
          console.log(`✅ ${section}: ${data.data[section].length} links`);
          
          // Check first link structure if exists
          if (data.data[section].length > 0) {
            const firstLink = data.data[section][0];
            const requiredFields = ['id', 'title', 'url', 'is_external', 'sort_order'];
            const hasAllFields = requiredFields.every(field => firstLink.hasOwnProperty(field));
            
            if (hasAllFields) {
              console.log(`  ✅ Link structure is correct`);
            } else {
              console.log(`  ⚠️  Missing fields in link structure`);
            }
          }
        } else {
          console.log(`⚠️  ${section}: section not found`);
        }
      });
      
      return true;
    } else {
      console.log(`❌ Invalid API response:`, data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Footer Links API test failed: ${error.message}`);
    return false;
  }
}

async function testMenuDataAPI() {
  console.log('\n=== Testing Menu Data API ===');
  try {
    const response = await fetch(`${API_BASE_URL}/menu-data`);
    const data = await response.json();
    
    if (data.status === 200 && Array.isArray(data.data)) {
      console.log(`✅ Menu Data API is working - ${data.data.length} categories`);
      return true;
    } else {
      console.log(`❌ Invalid Menu Data API response:`, data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Menu Data API test failed: ${error.message}`);
    return false;
  }
}

async function runFooterTests() {
  console.log('🧪 Starting Footer API Tests...\n');
  
  const footerWorking = await testFooterLinksAPI();
  const menuWorking = await testMenuDataAPI();
  
  console.log('\n📋 Test Summary:');
  console.log(`Footer Links API: ${footerWorking ? '✅ Working' : '❌ Failed'}`);
  console.log(`Menu Data API: ${menuWorking ? '✅ Working' : '❌ Failed'}`);
  
  if (footerWorking && menuWorking) {
    console.log('\n✅ All tests passed! Footer component should work correctly.');
    console.log('\nNext steps:');
    console.log('1. Start the React development server: npm run dev');
    console.log('2. Open http://localhost:5174 in your browser');
    console.log('3. Check that the footer loads dynamically from the API');
    console.log('4. Verify loading states and error handling work correctly');
  } else {
    console.log('\n❌ Some tests failed. Please check the backend API.');
  }
}

runFooterTests();