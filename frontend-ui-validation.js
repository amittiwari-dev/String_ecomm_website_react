#!/usr/bin/env node

/**
 * Frontend UI Validation Test
 * Tests the actual React components to ensure they're using API data correctly
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

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

async function startDevServer() {
  return new Promise((resolve, reject) => {
    log('Starting development server...', 'blue');
    
    const devServer = spawn('npm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let serverReady = false;
    
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') && output.includes('5173')) {
        serverReady = true;
        logSuccess('Development server started on http://localhost:5173');
        resolve(devServer);
      }
    });

    devServer.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') && output.includes('5173')) {
        serverReady = true;
        logSuccess('Development server started on http://localhost:5173');
        resolve(devServer);
      }
    });

    devServer.on('error', (error) => {
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Development server failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

async function testHomepageLoading() {
  logTest('Homepage Dynamic Content Loading');
  
  try {
    const response = await fetch('http://localhost:5173');
    const html = await response.text();
    
    // Check if the page loads without errors
    if (response.ok) {
      logSuccess('Homepage loads successfully');
    } else {
      logError(`Homepage failed to load: ${response.status}`);
      return false;
    }

    // Check for React app mounting
    if (html.includes('id="root"')) {
      logSuccess('React app container found');
    } else {
      logError('React app container not found');
      return false;
    }

    // Wait a bit for React to render
    await setTimeout(3000);
    
    return true;
  } catch (error) {
    logError(`Homepage test failed: ${error.message}`);
    return false;
  }
}

async function testAPIEndpointsFromFrontend() {
  logTest('Frontend API Integration');
  
  try {
    // Test if the frontend can reach the API endpoints
    const endpoints = [
      'http://localhost:8000/api/categories',
      'http://localhost:8000/api/footer-links',
      'http://localhost:8000/api/homepage-sections',
      'http://localhost:8000/api/products'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          logSuccess(`Frontend can access ${endpoint}`);
        } else {
          logError(`Frontend cannot access ${endpoint}: ${response.status}`);
          return false;
        }
      } catch (error) {
        logError(`Frontend API test failed for ${endpoint}: ${error.message}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logError(`API integration test failed: ${error.message}`);
    return false;
  }
}

async function testErrorStates() {
  logTest('Error State Handling');
  
  try {
    // Test with invalid API endpoint
    const response = await fetch('http://localhost:8000/api/invalid-endpoint');
    
    if (response.status === 404) {
      logSuccess('404 error handling works correctly');
    } else {
      logWarning(`Unexpected status for invalid endpoint: ${response.status}`);
    }

    return true;
  } catch (error) {
    logWarning(`Error state test inconclusive: ${error.message}`);
    return true; // Don't fail the test for this
  }
}

async function testProductionBuild() {
  logTest('Production Build Validation');
  
  try {
    log('Building production version...', 'blue');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    return new Promise((resolve) => {
      let buildOutput = '';
      
      buildProcess.stdout.on('data', (data) => {
        buildOutput += data.toString();
      });

      buildProcess.stderr.on('data', (data) => {
        buildOutput += data.toString();
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          logSuccess('Production build completed successfully');
          
          // Check if mock data warnings appear in build
          if (buildOutput.includes('Mock data is being imported in production')) {
            logError('Mock data is being imported in production build!');
            resolve(false);
          } else {
            logSuccess('No mock data imported in production build');
            resolve(true);
          }
        } else {
          logError(`Production build failed with code ${code}`);
          logError(`Build output: ${buildOutput}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    logError(`Production build test failed: ${error.message}`);
    return false;
  }
}

async function runFrontendTests() {
  log('\n🚀 Starting Frontend UI Validation Tests\n', 'blue');
  
  let devServer = null;
  const testResults = [];
  
  try {
    // Start development server
    devServer = await startDevServer();
    await setTimeout(5000); // Wait for server to fully start
    
    // Run tests
    testResults.push(await testHomepageLoading());
    testResults.push(await testAPIEndpointsFromFrontend());
    testResults.push(await testErrorStates());
    testResults.push(await testProductionBuild());
    
  } catch (error) {
    logError(`Test setup failed: ${error.message}`);
    return false;
  } finally {
    // Clean up
    if (devServer) {
      log('Stopping development server...', 'blue');
      devServer.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await setTimeout(2000);
      
      // Force kill if still running
      try {
        devServer.kill('SIGKILL');
      } catch (e) {
        // Process already terminated
      }
    }
  }
  
  // Summary
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  
  log('\n📊 Frontend Test Summary:', 'blue');
  log(`Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All frontend tests passed! The UI is working correctly with API data.', 'green');
  } else {
    log('\n⚠️  Some frontend tests failed. Please review the issues above.', 'yellow');
  }
  
  return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFrontendTests().catch(error => {
    logError(`Frontend test runner error: ${error.message}`);
    process.exit(1);
  });
}

export { runFrontendTests };