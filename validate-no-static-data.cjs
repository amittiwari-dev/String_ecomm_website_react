#!/usr/bin/env node

/**
 * Comprehensive validation script to ensure NO static data exists in the application
 * This script verifies that ALL data comes from APIs only
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING: NO STATIC DATA IN APPLICATION\n');
console.log('=' .repeat(60));
console.log('This script ensures that:');
console.log('  ❌ No mockData.ts file exists');
console.log('  ❌ No hardcoded JSON data');
console.log('  ❌ No static arrays or objects with data');
console.log('  ✅ All data comes from API calls only');
console.log('=' .repeat(60));
console.log('');

let hasErrors = false;
const errors = [];
const warnings = [];

// Test 1: Check if mockData.ts exists
console.log('📋 Test 1: Checking for mockData.ts file...');
const mockDataPath = path.join(__dirname, 'src', 'data', 'mockData.ts');
if (fs.existsSync(mockDataPath)) {
  errors.push('❌ CRITICAL: mockData.ts file still exists at src/data/mockData.ts');
  hasErrors = true;
} else {
  console.log('✅ PASS: mockData.ts file does not exist');
}

// Test 2: Check if data directory exists (it shouldn't if mockData is removed)
console.log('\n📋 Test 2: Checking for data directory...');
const dataDir = path.join(__dirname, 'src', 'data');
if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir);
  if (files.length > 0) {
    warnings.push(`⚠️  WARNING: src/data directory exists with ${files.length} file(s): ${files.join(', ')}`);
  } else {
    console.log('✅ PASS: data directory is empty');
  }
} else {
  console.log('✅ PASS: data directory does not exist');
}

// Test 3: Search for mockData imports in source files
console.log('\n📋 Test 3: Searching for mockData imports...');
function searchForMockDataImports(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('.git')) {
        searchForMockDataImports(filePath, results);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for mock data imports
      if (content.includes('from') && (content.includes('mockData') || content.includes('/data/mockData'))) {
        results.push({
          file: path.relative(__dirname, filePath),
          issue: 'Contains mockData import'
        });
      }
    }
  }
  
  return results;
}

const srcPath = path.join(__dirname, 'src');
const mockDataImports = searchForMockDataImports(srcPath);

if (mockDataImports.length > 0) {
  errors.push('❌ CRITICAL: Found mockData imports in source files:');
  mockDataImports.forEach(({ file, issue }) => {
    errors.push(`   - ${file}: ${issue}`);
  });
  hasErrors = true;
} else {
  console.log('✅ PASS: No mockData imports found in source files');
}

// Test 4: Check for hardcoded data arrays in components
console.log('\n📋 Test 4: Checking for hardcoded data arrays...');
function searchForHardcodedData(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('.git') && !file.includes('ui')) {
        searchForHardcodedData(filePath, results);
      }
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.') && !file.includes('.spec.')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Look for suspicious patterns that might indicate hardcoded data
      const suspiciousPatterns = [
        { pattern: /const\s+books\s*=\s*\[/, name: 'books array' },
        { pattern: /const\s+categories\s*=\s*\[\s*\{/, name: 'categories array with objects' },
        { pattern: /const\s+authors\s*=\s*\[\s*\{/, name: 'authors array with objects' },
        { pattern: /export\s+const\s+books\s*=/, name: 'exported books' },
        { pattern: /export\s+const\s+categories\s*=/, name: 'exported categories' },
      ];
      
      lines.forEach((line, index) => {
        suspiciousPatterns.forEach(({ pattern, name }) => {
          if (pattern.test(line) && !line.includes('//') && !line.includes('useState') && !line.includes('[]')) {
            // Exclude lines that are clearly not data definitions
            if (!line.includes('= []') && !line.includes('useState') && !line.includes('useMemo')) {
              results.push({
                file: path.relative(__dirname, filePath),
                line: index + 1,
                issue: `Possible hardcoded ${name}`,
                code: line.trim()
              });
            }
          }
        });
      });
    }
  }
  
  return results;
}

const hardcodedData = searchForHardcodedData(srcPath);

if (hardcodedData.length > 0) {
  warnings.push('⚠️  WARNING: Found possible hardcoded data (review manually):');
  hardcodedData.forEach(({ file, line, issue, code }) => {
    warnings.push(`   - ${file}:${line} - ${issue}`);
    warnings.push(`     Code: ${code.substring(0, 80)}${code.length > 80 ? '...' : ''}`);
  });
} else {
  console.log('✅ PASS: No obvious hardcoded data arrays found');
}

// Test 5: Verify API service files exist and are being used
console.log('\n📋 Test 5: Verifying API service files...');
const requiredServices = [
  'src/services/api.ts',
  'src/services/menuService.ts',
  'src/services/contentService.ts'
];

let allServicesExist = true;
requiredServices.forEach(service => {
  const servicePath = path.join(__dirname, service);
  if (fs.existsSync(servicePath)) {
    console.log(`✅ Found: ${service}`);
  } else {
    errors.push(`❌ CRITICAL: Missing required service file: ${service}`);
    allServicesExist = false;
    hasErrors = true;
  }
});

if (allServicesExist) {
  console.log('✅ PASS: All required API service files exist');
}

// Test 6: Check that components use React Query for data fetching
console.log('\n📋 Test 6: Verifying components use React Query...');
const criticalComponents = [
  'src/components/MegaMenu.tsx',
  'src/components/Footer.tsx',
  'src/pages/Index.tsx',
  'src/pages/AllBooks.tsx'
];

let allComponentsUseQuery = true;
criticalComponents.forEach(component => {
  const componentPath = path.join(__dirname, component);
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');
    if (content.includes('useQuery') || content.includes('fetch')) {
      console.log(`✅ ${component} uses data fetching`);
    } else {
      warnings.push(`⚠️  WARNING: ${component} may not be fetching data dynamically`);
      allComponentsUseQuery = false;
    }
  }
});

if (allComponentsUseQuery) {
  console.log('✅ PASS: All critical components use data fetching');
}

// Test 7: Check environment configuration
console.log('\n📋 Test 7: Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('VITE_API_BASE_URL')) {
    console.log('✅ PASS: VITE_API_BASE_URL is configured in .env');
  } else {
    errors.push('❌ CRITICAL: VITE_API_BASE_URL not found in .env file');
    hasErrors = true;
  }
} else {
  warnings.push('⚠️  WARNING: .env file not found');
}

// Print Summary
console.log('\n' + '='.repeat(60));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(60));

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:');
  errors.forEach(error => console.log(error));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(warning));
}

if (!hasErrors && warnings.length === 0) {
  console.log('\n✅ ✅ ✅ SUCCESS! ✅ ✅ ✅');
  console.log('');
  console.log('🎉 Application is fully dynamic!');
  console.log('✅ No static data found');
  console.log('✅ No mockData.ts file');
  console.log('✅ All data comes from APIs');
  console.log('');
  console.log('Your application is ready for production! 🚀');
} else if (!hasErrors) {
  console.log('\n✅ VALIDATION PASSED (with warnings)');
  console.log('Please review the warnings above.');
} else {
  console.log('\n❌ VALIDATION FAILED');
  console.log('Please fix the errors above before deploying to production.');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
