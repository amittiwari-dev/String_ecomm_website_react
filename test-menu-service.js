// Simple test script to verify menu service functionality
// This can be run with: node test-menu-service.js

const API_BASE_URL = 'http://localhost:8000/api';

// Test function to check if API endpoints are accessible
async function testMenuService() {
  console.log('Testing Menu Service API endpoints...\n');

  const endpoints = [
    { name: 'Categories', url: `${API_BASE_URL}/categories` },
    { name: 'Menu Data', url: `${API_BASE_URL}/menu-data` },
    { name: 'Footer Links', url: `${API_BASE_URL}/footer-links` }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: Success (Status: ${data.status})`);
        
        if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(`   - Returned ${data.data.length} items`);
          } else if (typeof data.data === 'object') {
            const keys = Object.keys(data.data);
            console.log(`   - Returned object with keys: ${keys.join(', ')}`);
          }
        }
      } else {
        console.log(`❌ ${endpoint.name}: Failed (Status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
    }
    console.log('');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testMenuService().catch(console.error);
}

module.exports = { testMenuService };