#!/usr/bin/env node

/**
 * Test script to verify mock data is properly excluded from production builds
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing production build for mock data exclusion...\n');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Function to search for mock data imports in built files
function searchForMockDataImports(dir) {
  const results = [];
  
  function searchDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        searchDirectory(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for mock data imports or references
        const mockDataPatterns = [
          /from\s+['"].*mockData['"]/g,
          /import.*mockData/g,
          /mockData\./g,
          /getLatestReleases/g,
          /getCategoriesByParent/g,
          /export\s*{\s*books\s*,/g, // Exported books array from mock data
          /export\s*{\s*authors\s*,/g, // Exported authors array from mock data
          /const\s+books\s*=\s*\[/g, // Direct books array definition
          /const\s+authors\s*=\s*\[/g, // Direct authors array definition
        ];
        
        for (const pattern of mockDataPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            results.push({
              file: path.relative(distPath, filePath),
              matches: matches
            });
          }
        }
      }
    }
  }
  
  searchDirectory(dir);
  return results;
}

// Search for mock data references
const mockDataReferences = searchForMockDataImports(distPath);

if (mockDataReferences.length === 0) {
  console.log('✅ SUCCESS: No mock data references found in production build!');
  console.log('✅ Mock data has been properly excluded from production.');
} else {
  console.log('❌ FAILURE: Mock data references found in production build:');
  console.log('');
  
  mockDataReferences.forEach(({ file, matches }) => {
    console.log(`📁 File: ${file}`);
    matches.forEach(match => {
      console.log(`   🔍 Found: ${match}`);
    });
    console.log('');
  });
  
  console.log('❌ Mock data should not be present in production builds.');
  console.log('💡 Please ensure all mock data imports are properly guarded or removed.');
  process.exit(1);
}

// Check for environment variable usage
console.log('\n🔍 Checking environment variable configuration...');

const indexHtmlPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
  
  if (indexContent.includes('VITE_API_BASE_URL')) {
    console.log('✅ Environment variables are properly configured in build.');
  } else {
    console.log('⚠️  Warning: VITE_API_BASE_URL not found in index.html');
    console.log('   Make sure environment variables are properly set for production.');
  }
}

console.log('\n🎉 Production build validation complete!');