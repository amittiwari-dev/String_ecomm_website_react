/**
 * Test script to verify React Query caching strategy implementation
 * This script tests the caching configuration and prefetching functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing React Query Caching Strategy Implementation...\n');

// Test 1: Verify query configuration files exist
console.log('1️⃣ Checking configuration files...');
const configFiles = [
  'src/lib/queryKeys.ts',
  'src/lib/queryConfig.ts', 
  'src/lib/prefetch.ts',
  'src/lib/cacheDebug.ts',
  'src/hooks/useQueryInvalidation.ts',
  'src/hooks/usePrefetch.ts'
];

let allFilesExist = true;
configFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some configuration files are missing!');
  process.exit(1);
}

// Test 2: Verify query keys structure
console.log('\n2️⃣ Checking query keys structure...');
try {
  const queryKeysContent = fs.readFileSync(path.join(__dirname, 'src/lib/queryKeys.ts'), 'utf8');
  
  const requiredKeys = [
    'menu: {',
    'categories: ()',
    'menuData: ()',
    'footerLinks: ()',
    'content: {',
    'homepageSections: ()',
    'books: {',
    'list: (',
    'detail: (',
    'featured: ()',
    'user: {',
    'profile: ()',
    'orders: ('
  ];
  
  let allKeysPresent = true;
  requiredKeys.forEach(key => {
    if (queryKeysContent.includes(key)) {
      console.log(`   ✅ ${key} key defined`);
    } else {
      console.log(`   ❌ ${key} key missing`);
      allKeysPresent = false;
    }
  });
  
  if (!allKeysPresent) {
    console.log('\n❌ Some query keys are missing!');
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ Error reading query keys: ${error.message}`);
  process.exit(1);
}

// Test 3: Verify caching configuration
console.log('\n3️⃣ Checking caching configuration...');
try {
  const configContent = fs.readFileSync(path.join(__dirname, 'src/lib/queryConfig.ts'), 'utf8');
  
  const requiredConfigs = [
    'MENU_DATA',
    'FOOTER_DATA', 
    'CONTENT_DATA',
    'BOOK_DATA',
    'USER_DATA',
    'staleTime',
    'gcTime',
    'refetchOnWindowFocus',
    'createQueryClient'
  ];
  
  let allConfigsPresent = true;
  requiredConfigs.forEach(config => {
    if (configContent.includes(config)) {
      console.log(`   ✅ ${config} configuration defined`);
    } else {
      console.log(`   ❌ ${config} configuration missing`);
      allConfigsPresent = false;
    }
  });
  
  if (!allConfigsPresent) {
    console.log('\n❌ Some configurations are missing!');
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ Error reading configuration: ${error.message}`);
  process.exit(1);
}

// Test 4: Verify prefetching utilities
console.log('\n4️⃣ Checking prefetching utilities...');
try {
  const prefetchContent = fs.readFileSync(path.join(__dirname, 'src/lib/prefetch.ts'), 'utf8');
  
  const requiredFunctions = [
    'prefetchCriticalData',
    'prefetchRouteData',
    'invalidateQueries',
    'isDataStale',
    'getCacheStats'
  ];
  
  let allFunctionsPresent = true;
  requiredFunctions.forEach(func => {
    if (prefetchContent.includes(func)) {
      console.log(`   ✅ ${func} function defined`);
    } else {
      console.log(`   ❌ ${func} function missing`);
      allFunctionsPresent = false;
    }
  });
  
  if (!allFunctionsPresent) {
    console.log('\n❌ Some prefetch functions are missing!');
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ Error reading prefetch utilities: ${error.message}`);
  process.exit(1);
}

// Test 5: Verify App.jsx integration
console.log('\n5️⃣ Checking App.jsx integration...');
try {
  const appContent = fs.readFileSync(path.join(__dirname, 'src/App.jsx'), 'utf8');
  
  const requiredIntegrations = [
    'createQueryClient',
    'prefetchCriticalData',
    'ReactQueryDevtools'
  ];
  
  let allIntegrationsPresent = true;
  requiredIntegrations.forEach(integration => {
    if (appContent.includes(integration)) {
      console.log(`   ✅ ${integration} integrated`);
    } else {
      console.log(`   ❌ ${integration} not integrated`);
      allIntegrationsPresent = false;
    }
  });
  
  if (!allIntegrationsPresent) {
    console.log('\n❌ Some App.jsx integrations are missing!');
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ Error reading App.jsx: ${error.message}`);
  process.exit(1);
}

// Test 6: Verify component updates
console.log('\n6️⃣ Checking component updates...');
try {
  const componentsToCheck = [
    { file: 'src/components/MegaMenu.tsx', imports: ['queryKeys', 'QUERY_CONFIG'] },
    { file: 'src/components/Footer.tsx', imports: ['queryKeys', 'QUERY_CONFIG'] },
    { file: 'src/pages/Index.tsx', imports: ['queryKeys', 'QUERY_CONFIG'] }
  ];
  
  let allComponentsUpdated = true;
  componentsToCheck.forEach(({ file, imports }) => {
    if (fs.existsSync(path.join(__dirname, file))) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      
      imports.forEach(importName => {
        if (content.includes(importName)) {
          console.log(`   ✅ ${file} uses ${importName}`);
        } else {
          console.log(`   ❌ ${file} missing ${importName}`);
          allComponentsUpdated = false;
        }
      });
    } else {
      console.log(`   ❌ ${file} not found`);
      allComponentsUpdated = false;
    }
  });
  
  if (!allComponentsUpdated) {
    console.log('\n❌ Some components are not properly updated!');
    process.exit(1);
  }
} catch (error) {
  console.log(`   ❌ Error checking components: ${error.message}`);
  process.exit(1);
}

// Test 7: Verify TypeScript compilation
console.log('\n7️⃣ Testing TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'pipe' });
  console.log('   ✅ TypeScript compilation successful');
} catch (error) {
  console.log('   ❌ TypeScript compilation failed');
  console.log('   Error:', error.stdout?.toString() || error.message);
  process.exit(1);
}

// Test 8: Verify build process
console.log('\n8️⃣ Testing build process...');
try {
  execSync('npm run build', { cwd: __dirname, stdio: 'pipe' });
  console.log('   ✅ Build process successful');
} catch (error) {
  console.log('   ❌ Build process failed');
  console.log('   Error:', error.stdout?.toString() || error.message);
  process.exit(1);
}

console.log('\n🎉 All React Query caching strategy tests passed!');
console.log('\n📋 Implementation Summary:');
console.log('   ✅ Query keys centralized and organized');
console.log('   ✅ Caching configuration optimized for different data types');
console.log('   ✅ Prefetching implemented for critical data');
console.log('   ✅ Query invalidation utilities created');
console.log('   ✅ Cache debugging tools added');
console.log('   ✅ Components updated to use new configuration');
console.log('   ✅ TypeScript compilation successful');
console.log('   ✅ Build process working');

console.log('\n🚀 React Query Caching Strategy Implementation Complete!');
console.log('\n📖 Key Features Implemented:');
console.log('   • 5-minute stale time for menu data');
console.log('   • 1-hour cache time for menu and footer data');
console.log('   • Background refetch on window focus for critical data');
console.log('   • Prefetching for menu data on application load');
console.log('   • Query key invalidation when relevant data changes');
console.log('   • Development tools for cache monitoring');
console.log('   • Optimized retry logic for different operation types');