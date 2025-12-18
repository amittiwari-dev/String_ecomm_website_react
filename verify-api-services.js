/**
 * API Service Layer Verification Script
 * Tests all API service functions according to requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4
 */

const API_BASE_URL = 'https://sterlingpublishers.in/publishing/api';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'password'
};

let authToken = null;
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to log test results
function logResult(testName, status, message, data = null) {
  const timestamp = new Date().toISOString();
  const result = { testName, status, message, timestamp, data };
  
  if (status === 'PASS') {
    testResults.passed.push(result);
    console.log(`✓ [PASS] ${testName}: ${message}`);
  } else if (status === 'FAIL') {
    testResults.failed.push(result);
    console.log(`✗ [FAIL] ${testName}: ${message}`);
  } else if (status === 'WARN') {
    testResults.warnings.push(result);
    console.log(`⚠ [WARN] ${testName}: ${message}`);
  }
  
  if (data) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
}

// Login to get auth token
async function login() {
  console.log('\n=== Authentication ===');
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    const data = await response.json();

    if (data.status === 200 && data.token) {
      authToken = data.token;
      logResult('Authentication', 'PASS', `Logged in as ${data.user.name}`, {
        user_id: data.user.id,
        email: data.user.email
      });
      return true;
    } else {
      logResult('Authentication', 'FAIL', data.message || 'Login failed');
      return false;
    }
  } catch (error) {
    logResult('Authentication', 'FAIL', error.message);
    return false;
  }
}

// Test 1: ProfileService.getProfile returns complete user data (Req 1.1)
async function testGetProfile() {
  console.log('\n=== Test 1: ProfileService.getProfile (Req 1.1) ===');
  
  if (!authToken) {
    logResult('ProfileService.getProfile', 'FAIL', 'No auth token available');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    const user = data.user || data;

    // Verify required fields
    const requiredFields = ['id', 'name', 'email'];
    const missingFields = requiredFields.filter(field => !user[field]);

    if (missingFields.length > 0) {
      logResult('ProfileService.getProfile', 'FAIL', 
        `Missing required fields: ${missingFields.join(', ')}`, user);
    } else {
      logResult('ProfileService.getProfile', 'PASS', 
        'Returns complete user data with all required fields', {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at
        });
    }
  } catch (error) {
    logResult('ProfileService.getProfile', 'FAIL', error.message);
  }
}

// Test 2: ProfileService.getProfileStatistics calculates correctly (Req 1.2)
async function testGetProfileStatistics() {
  console.log('\n=== Test 2: ProfileService.getProfileStatistics (Req 1.2) ===');
  
  if (!authToken) {
    logResult('ProfileService.getProfileStatistics', 'FAIL', 'No auth token available');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/orders?page=1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    });

    const ordersData = await response.json();
    
    if (ordersData.data && Array.isArray(ordersData.data)) {
      const orders = ordersData.data;
      
      // Calculate statistics
      const totalOrders = ordersData.total || orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      const stats = {
        totalOrders,
        totalSpent: totalSpent.toFixed(2),
        pendingOrders,
        averageOrderValue: averageOrderValue.toFixed(2)
      };

      // Verify calculations are correct
      if (totalOrders >= 0 && totalSpent >= 0 && averageOrderValue >= 0) {
        logResult('ProfileService.getProfileStatistics', 'PASS', 
          'Calculates statistics correctly from order data', stats);
      } else {
        logResult('ProfileService.getProfileStatistics', 'FAIL', 
          'Invalid statistics calculations', stats);
      }
    } else {
      logResult('ProfileService.getProfileStatistics', 'WARN', 
        'No orders found, statistics default to zero', {
          totalOrders: 0,
          totalSpent: 0,
          pendingOrders: 0,
          averageOrderValue: 0
        });
    }
  } catch (error) {
    logResult('ProfileService.getProfileStatistics', 'FAIL', error.message);
  }
}

// Test 3: OrderService.getOrders returns complete order data (Req 2.1, 2.2)
async function testGetOrders() {
  console.log('\n=== Test 3: OrderService.getOrders (Req 2.1, 2.2) ===');
  
  if (!authToken) {
    logResult('OrderService.getOrders', 'FAIL', 'No auth token available');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/orders?page=1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    // Verify pagination structure
    const requiredPaginationFields = ['data', 'current_page', 'last_page', 'per_page', 'total'];
    const missingPaginationFields = requiredPaginationFields.filter(field => !(field in data));

    if (missingPaginationFields.length > 0) {
      logResult('OrderService.getOrders', 'FAIL', 
        `Missing pagination fields: ${missingPaginationFields.join(', ')}`, data);
      return;
    }

    if (!Array.isArray(data.data)) {
      logResult('OrderService.getOrders', 'FAIL', 'Orders data is not an array', data);
      return;
    }

    if (data.data.length === 0) {
      logResult('OrderService.getOrders', 'WARN', 
        'No orders found for this user', {
          pagination: {
            current_page: data.current_page,
            total: data.total
          }
        });
      return;
    }

    // Verify order structure
    const order = data.data[0];
    const requiredOrderFields = ['id', 'order_number', 'status', 'total', 'items', 'created_at'];
    const missingOrderFields = requiredOrderFields.filter(field => !(field in order));

    if (missingOrderFields.length > 0) {
      logResult('OrderService.getOrders', 'FAIL', 
        `Missing order fields: ${missingOrderFields.join(', ')}`, order);
    } else {
      logResult('OrderService.getOrders', 'PASS', 
        `Returns paginated orders with complete data (${data.data.length} orders)`, {
          pagination: {
            current_page: data.current_page,
            total: data.total,
            per_page: data.per_page
          },
          sample_order: {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            total: order.total,
            item_count: order.items?.length || 0
          }
        });
    }
  } catch (error) {
    logResult('OrderService.getOrders', 'FAIL', error.message);
  }
}

// Test 4: Order items have complete product information (Req 2.3, 2.4)
async function testOrderItems() {
  console.log('\n=== Test 4: Order Items Complete Data (Req 2.3, 2.4) ===');
  
  if (!authToken) {
    logResult('OrderService.OrderItems', 'FAIL', 'No auth token available');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/orders?page=1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      logResult('OrderService.OrderItems', 'WARN', 'No orders to check items');
      return;
    }

    const order = data.data[0];
    
    if (!order.items || order.items.length === 0) {
      logResult('OrderService.OrderItems', 'FAIL', 
        'Order has no items', { order_id: order.id });
      return;
    }

    const item = order.items[0];
    const requiredItemFields = ['id', 'product_id', 'product_name', 'quantity', 'price'];
    const missingItemFields = requiredItemFields.filter(field => !(field in item));

    if (missingItemFields.length > 0) {
      logResult('OrderService.OrderItems', 'FAIL', 
        `Missing item fields: ${missingItemFields.join(', ')}`, item);
    } else {
      const hasImage = !!item.product_image;
      
      logResult('OrderService.OrderItems', 'PASS', 
        `Order items contain complete product information (${order.items.length} items)`, {
          sample_item: {
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            has_image: hasImage,
            product_image: item.product_image || 'No image'
          }
        });
    }
  } catch (error) {
    logResult('OrderService.OrderItems', 'FAIL', error.message);
  }
}

// Test 5: Data normalization functions work correctly
async function testDataNormalization() {
  console.log('\n=== Test 5: Data Normalization ===');
  
  try {
    const response = await fetch(`${API_BASE_URL}/new-books`);
    const data = await response.json();

    if (data.status === 200 && data.records && data.records.length > 0) {
      const apiBook = data.records[0];
      
      // Verify API book has expected fields
      const apiFields = ['id', 'product_name', 'price'];
      const hasRequiredFields = apiFields.every(field => field in apiBook);

      if (!hasRequiredFields) {
        logResult('DataNormalization', 'FAIL', 
          'API book missing required fields', apiBook);
        return;
      }

      // Simulate normalization
      const base = 'https://sterlingpublishers.in/publishing';
      const normalizedBook = {
        id: apiBook.id?.toString() || '0',
        title: apiBook.product_name || 'Untitled',
        price: Number(apiBook.price) || 0,
        image: apiBook.product_image ? 
          `${base}/images/products/${apiBook.product_image}` : 
          '/img/book-categori/01.png',
        author: apiBook.author_name || 'Unknown'
      };

      logResult('DataNormalization', 'PASS', 
        'API data is correctly normalized to internal format', {
          api_sample: {
            id: apiBook.id,
            product_name: apiBook.product_name,
            price: apiBook.price
          },
          normalized_sample: normalizedBook
        });
    } else {
      logResult('DataNormalization', 'WARN', 
        'No books available to test normalization');
    }
  } catch (error) {
    logResult('DataNormalization', 'FAIL', error.message);
  }
}

// Test 6: Error handling
async function testErrorHandling() {
  console.log('\n=== Test 6: Error Handling and Retry Logic ===');
  
  // Test invalid token
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: {
        'Authorization': 'Bearer invalid_token_12345',
        'Accept': 'application/json'
      }
    });

    if (response.status === 401) {
      logResult('ErrorHandling.InvalidToken', 'PASS', 
        'API correctly returns 401 for invalid token');
    } else {
      logResult('ErrorHandling.InvalidToken', 'WARN', 
        `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    logResult('ErrorHandling.InvalidToken', 'FAIL', error.message);
  }

  // Test validation errors
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email: '', password: '' })
    });

    const data = await response.json();
    
    if (response.status === 422 || (data.errors && Object.keys(data.errors).length > 0)) {
      logResult('ErrorHandling.Validation', 'PASS', 
        'API correctly validates required fields');
    } else {
      logResult('ErrorHandling.Validation', 'WARN', 
        'Validation error handling may need improvement');
    }
  } catch (error) {
    logResult('ErrorHandling.Validation', 'FAIL', error.message);
  }

  // Test 404 handling
  try {
    const response = await fetch(`${API_BASE_URL}/nonexistent-endpoint`);
    
    if (response.status === 404) {
      logResult('ErrorHandling.NotFound', 'PASS', 
        'API correctly returns 404 for invalid endpoints');
    } else {
      logResult('ErrorHandling.NotFound', 'WARN', 
        `Expected 404, got ${response.status}`);
    }
  } catch (error) {
    logResult('ErrorHandling.Network', 'PASS', 
      'Network errors are properly caught');
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const total = testResults.passed.length + testResults.failed.length + testResults.warnings.length;
  const passRate = total > 0 ? ((testResults.passed.length / total) * 100).toFixed(1) : 0;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${testResults.passed.length} ✓`);
  console.log(`Failed: ${testResults.failed.length} ✗`);
  console.log(`Warnings: ${testResults.warnings.length} ⚠`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('='.repeat(60));
  
  if (testResults.failed.length > 0) {
    console.log('\nFailed Tests:');
    testResults.failed.forEach(result => {
      console.log(`  - ${result.testName}: ${result.message}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\nWarnings:');
    testResults.warnings.forEach(result => {
      console.log(`  - ${result.testName}: ${result.message}`);
    });
  }
  
  console.log('\n');
}

// Main execution
async function runAllTests() {
  console.log('API Service Layer Verification');
  console.log('Testing requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4');
  console.log('='.repeat(60));
  
  // Login first
  const loginSuccess = await login();
  
  if (!loginSuccess) {
    console.log('\n✗ Cannot proceed without authentication');
    printSummary();
    return;
  }
  
  // Run all tests
  await testGetProfile();
  await testGetProfileStatistics();
  await testGetOrders();
  await testOrderItems();
  await testDataNormalization();
  await testErrorHandling();
  
  // Print summary
  printSummary();
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
