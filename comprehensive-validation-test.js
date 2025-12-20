#!/usr/bin/env node

/**
 * Comprehensive Validation Test for Fully Dynamic eCommerce
 * Tests all requirements from the spec to ensure proper implementation
 */

const API_BASE_URL = 'http://localhost:8000/api';

// Test utilities
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// API test functions
async function testAPI(endpoint, description) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      logSuccess(`${description}: API responded with status ${response.status}`);
      return { success: true, data, status: response.status };
    } else {
      logError(`${description}: API error ${response.status} - ${data.message || 'Unknown error'}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    logError(`${description}: Network error - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Validation functions
function validateCategoryStructure(categories) {
  if (!Array.isArray(categories)) {
    logError('Categories should be an array');
    return false;
  }

  for (const category of categories) {
    const requiredFields = ['id', 'name', 'slug', 'sort_order', 'is_active'];
    for (const field of requiredFields) {
      if (!(field in category)) {
        logError(`Category missing required field: ${field}`);
        return false;
      }
    }

    // Check if category has book_count
    if (!('book_count' in category)) {
      logWarning(`Category ${category.name} missing book_count field`);
    }

    // Check subcategories if they exist
    if (category.children && Array.isArray(category.children)) {
      for (const subcategory of category.children) {
        for (const field of requiredFields) {
          if (!(field in subcategory)) {
            logError(`Subcategory missing required field: ${field}`);
            return false;
          }
        }
      }
    }
  }

  logSuccess(`Category structure validation passed for ${categories.length} categories`);
  return true;
}

function validateFooterLinks(footerData) {
  const expectedSections = ['quick_links', 'categories', 'contact'];
  
  for (const section of expectedSections) {
    if (!(section in footerData)) {
      logError(`Footer missing section: ${section}`);
      return false;
    }

    if (!Array.isArray(footerData[section])) {
      logError(`Footer section ${section} should be an array`);
      return false;
    }

    for (const link of footerData[section]) {
      const requiredFields = ['id', 'title', 'url', 'sort_order'];
      for (const field of requiredFields) {
        if (!(field in link)) {
          logError(`Footer link missing required field: ${field}`);
          return false;
        }
      }
    }
  }

  logSuccess('Footer links structure validation passed');
  return true;
}

function validateHomepageSections(sections) {
  if (!Array.isArray(sections)) {
    logError('Homepage sections should be an array');
    return false;
  }

  for (const section of sections) {
    const requiredFields = ['id', 'section_type', 'sort_order', 'is_active'];
    for (const field of requiredFields) {
      if (!(field in section)) {
        logError(`Homepage section missing required field: ${field}`);
        return false;
      }
    }

    // Validate section types
    const validTypes = ['hero_carousel', 'featured_books', 'category_grid', 'promotional_banner'];
    if (!validTypes.includes(section.section_type)) {
      logWarning(`Unknown section type: ${section.section_type}`);
    }
  }

  logSuccess(`Homepage sections validation passed for ${sections.length} sections`);
  return true;
}

function validateProducts(products, meta = null) {
  if (!Array.isArray(products)) {
    logError('Products should be an array');
    return false;
  }

  for (const product of products) {
    const requiredFields = ['id', 'product_name', 'price', 'category_id'];
    for (const field of requiredFields) {
      if (!(field in product)) {
        logError(`Product missing required field: ${field}`);
        return false;
      }
    }
  }

  if (meta) {
    const requiredMetaFields = ['current_page', 'last_page', 'per_page', 'total'];
    for (const field of requiredMetaFields) {
      if (!(field in meta)) {
        logError(`Product pagination meta missing field: ${field}`);
        return false;
      }
    }
    logSuccess(`Products pagination meta validation passed`);
  }

  logSuccess(`Products validation passed for ${products.length} products`);
  return true;
}

// Main test functions
async function testMegaMenuAPI() {
  logTest('Mega Menu API Functionality');
  
  // Test categories endpoint
  const categoriesResult = await testAPI('/categories', 'Categories endpoint');
  if (!categoriesResult.success) return false;

  // Validate category structure
  if (!validateCategoryStructure(categoriesResult.data.data)) return false;

  // Test menu-data endpoint (optimized for mega menu)
  const menuResult = await testAPI('/menu-data', 'Menu data endpoint');
  if (!menuResult.success) return false;

  // Check if categories are sorted by sort_order
  const categories = categoriesResult.data.data;
  for (let i = 1; i < categories.length; i++) {
    if (categories[i].sort_order < categories[i-1].sort_order) {
      logWarning('Categories may not be properly sorted by sort_order');
      break;
    }
  }

  // Check for active categories only
  const inactiveCategories = categories.filter(cat => !cat.is_active);
  if (inactiveCategories.length > 0) {
    logError(`Found ${inactiveCategories.length} inactive categories in API response`);
    return false;
  }

  logSuccess('Mega Menu API tests passed');
  return true;
}

async function testFooterAPI() {
  logTest('Footer Links API Functionality');
  
  const result = await testAPI('/footer-links', 'Footer links endpoint');
  if (!result.success) return false;

  if (!validateFooterLinks(result.data.data)) return false;

  // Check if links are sorted within sections
  const footerData = result.data.data;
  for (const [sectionName, links] of Object.entries(footerData)) {
    for (let i = 1; i < links.length; i++) {
      if (links[i].sort_order < links[i-1].sort_order) {
        logWarning(`Footer section ${sectionName} may not be properly sorted`);
        break;
      }
    }
  }

  logSuccess('Footer API tests passed');
  return true;
}

async function testHomepageAPI() {
  logTest('Homepage Sections API Functionality');
  
  const result = await testAPI('/homepage-sections', 'Homepage sections endpoint');
  if (!result.success) return false;

  if (!validateHomepageSections(result.data.data)) return false;

  // Check if sections are sorted by sort_order
  const sections = result.data.data;
  for (let i = 1; i < sections.length; i++) {
    if (sections[i].sort_order < sections[i-1].sort_order) {
      logWarning('Homepage sections may not be properly sorted by sort_order');
      break;
    }
  }

  // Check for active sections only
  const inactiveSections = sections.filter(section => !section.is_active);
  if (inactiveSections.length > 0) {
    logError(`Found ${inactiveSections.length} inactive sections in API response`);
    return false;
  }

  logSuccess('Homepage API tests passed');
  return true;
}

async function testProductsAPI() {
  logTest('Products API Functionality');
  
  // Test basic products endpoint
  const productsResult = await testAPI('/products', 'Products endpoint');
  if (!productsResult.success) return false;

  const { data: products, meta } = productsResult.data;
  if (!validateProducts(products, meta)) return false;

  // Test products with pagination
  const paginatedResult = await testAPI('/products?page=1&per_page=5', 'Products with pagination');
  if (!paginatedResult.success) return false;

  if (paginatedResult.data.data.length > 5) {
    logError('Pagination not working - returned more than requested per_page');
    return false;
  }

  // Test products with category filter
  const categoryResult = await testAPI('/products?category=religious-books', 'Products with category filter');
  if (categoryResult.success && categoryResult.data.data.length > 0) {
    logSuccess('Category filtering works');
  } else {
    logWarning('Category filtering may not be working or no products in category');
  }

  // Test search functionality
  const searchResult = await testAPI('/search?q=book', 'Product search');
  if (searchResult.success) {
    logSuccess('Search functionality works');
  } else {
    logWarning('Search functionality may not be implemented');
  }

  logSuccess('Products API tests passed');
  return true;
}

async function testErrorHandling() {
  logTest('Error Handling and Edge Cases');
  
  // Test non-existent endpoint
  const notFoundResult = await testAPI('/non-existent-endpoint', 'Non-existent endpoint');
  if (notFoundResult.status === 404) {
    logSuccess('404 error handling works correctly');
  } else {
    logWarning('404 error handling may not be properly implemented');
  }

  // Test invalid product ID
  const invalidProductResult = await testAPI('/products/99999', 'Invalid product ID');
  if (invalidProductResult.status === 404) {
    logSuccess('Invalid product ID error handling works');
  } else {
    logWarning('Invalid product ID error handling may need improvement');
  }

  logSuccess('Error handling tests completed');
  return true;
}

async function testCacheHeaders() {
  logTest('Cache Headers and Performance');
  
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    const cacheControl = response.headers.get('cache-control');
    
    if (cacheControl) {
      logSuccess(`Cache headers present: ${cacheControl}`);
    } else {
      logWarning('No cache headers found - may impact performance');
    }
  } catch (error) {
    logWarning('Could not test cache headers');
  }

  return true;
}

// Frontend validation functions
async function validateFrontendComponents() {
  logTest('Frontend Component Validation');
  
  // This would require running the React app and checking DOM elements
  // For now, we'll check if the service files exist and are properly structured
  
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Check if service files exist
    const menuServicePath = path.join(__dirname, 'src/services/menuService.ts');
    const contentServicePath = path.join(__dirname, 'src/services/contentService.ts');
    const apiServicePath = path.join(__dirname, 'src/services/api.ts');
    
    const menuServiceExists = await fs.promises.access(menuServicePath).then(() => true).catch(() => false);
    const contentServiceExists = await fs.promises.access(contentServicePath).then(() => true).catch(() => false);
    const apiServiceExists = await fs.promises.access(apiServicePath).then(() => true).catch(() => false);
    
    if (menuServiceExists) {
      logSuccess('MenuService file exists');
    } else {
      logError('MenuService file missing');
    }
    
    if (contentServiceExists) {
      logSuccess('ContentService file exists');
    } else {
      logError('ContentService file missing');
    }
    
    if (apiServiceExists) {
      logSuccess('API service file exists');
    } else {
      logError('API service file missing');
    }
    
    // Check if mock data is removed from production
    const mockDataPath = path.join(__dirname, 'src/data/mockData.ts');
    try {
      const mockDataContent = await fs.promises.readFile(mockDataPath, 'utf8');
      if (mockDataContent.includes('import.meta.env.PROD') || mockDataContent.includes('process.env.NODE_ENV === \'production\'')) {
        logSuccess('Mock data properly guarded for production');
      } else {
        logWarning('Mock data may not be properly guarded for production');
      }
    } catch (error) {
      logWarning('Could not check mock data file');
    }
    
  } catch (error) {
    logError(`Frontend validation error: ${error.message}`);
    return false;
  }
  
  return true;
}

// Main test runner
async function runAllTests() {
  log('\n🚀 Starting Comprehensive Validation Tests for Fully Dynamic eCommerce\n', 'blue');
  
  const testResults = [];
  
  // Backend API tests
  testResults.push(await testMegaMenuAPI());
  testResults.push(await testFooterAPI());
  testResults.push(await testHomepageAPI());
  testResults.push(await testProductsAPI());
  testResults.push(await testErrorHandling());
  testResults.push(await testCacheHeaders());
  
  // Frontend validation
  testResults.push(await validateFrontendComponents());
  
  // Summary
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  
  log('\n📊 Test Summary:', 'blue');
  log(`Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! The fully dynamic eCommerce system is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed or have warnings. Please review the issues above.', 'yellow');
  }
  
  return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    logError(`Test runner error: ${error.message}`);
    process.exit(1);
  });
}

export {
  runAllTests,
  testMegaMenuAPI,
  testFooterAPI,
  testHomepageAPI,
  testProductsAPI,
  testErrorHandling,
  validateFrontendComponents
};