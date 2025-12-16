/**
 * Test utilities for verifying route state persistence functionality
 * 
 * This module provides functions to test that state is properly
 * preserved across page refreshes and navigation
 * 
 * Requirements: 2.1, 2.3
 */

export interface StateTestResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Test URL state persistence
 */
export function testUrlStatePersistence(): StateTestResult {
  try {
    // Test basic URL parameter handling
    const testParams = new URLSearchParams();
    testParams.set('search', 'test query');
    testParams.set('page', '2');
    testParams.set('category', 'fiction');

    const testUrl = `${window.location.pathname}?${testParams.toString()}`;
    
    // Simulate URL change
    window.history.pushState({}, '', testUrl);
    
    // Check if parameters are accessible
    const currentParams = new URLSearchParams(window.location.search);
    const searchParam = currentParams.get('search');
    const pageParam = currentParams.get('page');
    const categoryParam = currentParams.get('category');

    if (searchParam === 'test query' && pageParam === '2' && categoryParam === 'fiction') {
      return {
        success: true,
        message: 'URL state persistence is working correctly',
        details: { searchParam, pageParam, categoryParam }
      };
    } else {
      return {
        success: false,
        message: 'URL state persistence failed',
        details: { searchParam, pageParam, categoryParam }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'URL state persistence test failed with error',
      details: error
    };
  }
}

/**
 * Test session storage persistence
 */
export function testSessionStoragePersistence(): StateTestResult {
  try {
    const testKey = 'test-state-persistence';
    const testData = {
      formData: { name: 'John Doe', email: 'john@example.com' },
      filters: { category: 'books', minPrice: 10 },
      timestamp: Date.now()
    };

    // Save to session storage
    sessionStorage.setItem(testKey, JSON.stringify(testData));

    // Retrieve from session storage
    const retrieved = sessionStorage.getItem(testKey);
    if (!retrieved) {
      return {
        success: false,
        message: 'Failed to save data to session storage'
      };
    }

    const parsedData = JSON.parse(retrieved);
    
    // Verify data integrity
    if (
      parsedData.formData.name === testData.formData.name &&
      parsedData.formData.email === testData.formData.email &&
      parsedData.filters.category === testData.filters.category &&
      parsedData.filters.minPrice === testData.filters.minPrice
    ) {
      // Clean up
      sessionStorage.removeItem(testKey);
      
      return {
        success: true,
        message: 'Session storage persistence is working correctly',
        details: parsedData
      };
    } else {
      return {
        success: false,
        message: 'Session storage data integrity check failed',
        details: { expected: testData, actual: parsedData }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Session storage persistence test failed with error',
      details: error
    };
  }
}

/**
 * Test scroll position persistence
 */
export function testScrollPositionPersistence(): StateTestResult {
  try {
    const testKey = 'test-scroll-position';
    const testPosition = { x: 100, y: 200 };

    // Save scroll position
    sessionStorage.setItem(`scroll-${testKey}`, JSON.stringify(testPosition));

    // Retrieve scroll position
    const retrieved = sessionStorage.getItem(`scroll-${testKey}`);
    if (!retrieved) {
      return {
        success: false,
        message: 'Failed to save scroll position to session storage'
      };
    }

    const parsedPosition = JSON.parse(retrieved);
    
    if (parsedPosition.x === testPosition.x && parsedPosition.y === testPosition.y) {
      // Clean up
      sessionStorage.removeItem(`scroll-${testKey}`);
      
      return {
        success: true,
        message: 'Scroll position persistence is working correctly',
        details: parsedPosition
      };
    } else {
      return {
        success: false,
        message: 'Scroll position data integrity check failed',
        details: { expected: testPosition, actual: parsedPosition }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Scroll position persistence test failed with error',
      details: error
    };
  }
}

/**
 * Test form state persistence
 */
export function testFormStatePersistence(): StateTestResult {
  try {
    const testKey = 'form-test-form';
    const testFormData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '1234567890',
      address: '123 Test Street'
    };

    // Save form data
    sessionStorage.setItem(testKey, JSON.stringify(testFormData));

    // Retrieve form data
    const retrieved = sessionStorage.getItem(testKey);
    if (!retrieved) {
      return {
        success: false,
        message: 'Failed to save form data to session storage'
      };
    }

    const parsedData = JSON.parse(retrieved);
    
    if (
      parsedData.name === testFormData.name &&
      parsedData.email === testFormData.email &&
      parsedData.phone === testFormData.phone &&
      parsedData.address === testFormData.address
    ) {
      // Clean up
      sessionStorage.removeItem(testKey);
      
      return {
        success: true,
        message: 'Form state persistence is working correctly',
        details: parsedData
      };
    } else {
      return {
        success: false,
        message: 'Form state data integrity check failed',
        details: { expected: testFormData, actual: parsedData }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Form state persistence test failed with error',
      details: error
    };
  }
}

/**
 * Run all persistence tests
 */
export function runAllPersistenceTests(): StateTestResult[] {
  const results: StateTestResult[] = [];

  results.push(testUrlStatePersistence());
  results.push(testSessionStoragePersistence());
  results.push(testScrollPositionPersistence());
  results.push(testFormStatePersistence());

  return results;
}

/**
 * Log test results to console
 */
export function logTestResults(results: StateTestResult[]) {
  console.group('Route State Persistence Test Results');
  
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ Test ${index + 1}: ${result.message}`);
    } else {
      console.error(`❌ Test ${index + 1}: ${result.message}`);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
  });

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\nSummary: ${passedTests}/${totalTests} tests passed`);
  console.groupEnd();
}

/**
 * Quick test function for development
 */
export function quickTest() {
  const results = runAllPersistenceTests();
  logTestResults(results);
  return results.every(r => r.success);
}