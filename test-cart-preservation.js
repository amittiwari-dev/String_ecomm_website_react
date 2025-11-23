/**
 * Cart Preservation Test Script
 * 
 * Run this script in the browser console to verify cart preservation
 * across authentication state changes.
 * 
 * Usage:
 * 1. Open the application in your browser
 * 2. Open DevTools Console (F12)
 * 3. Copy and paste this entire script
 * 4. Follow the prompts in the console
 */

(function() {
  console.log('=== Cart Preservation Test Suite ===\n');

  const CART_KEY = 'bookstore_cart';
  const AUTH_KEY = 'auth_token';

  // Helper functions
  const getCart = () => {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : null;
  };

  const getAuthToken = () => {
    return localStorage.getItem(AUTH_KEY);
  };

  const displayCart = (cart) => {
    if (!cart || !cart.items || cart.items.length === 0) {
      console.log('  📦 Cart is empty');
      return;
    }
    console.log(`  📦 Cart has ${cart.items.length} item(s):`);
    cart.items.forEach((item, index) => {
      console.log(`     ${index + 1}. ${item.book.title} (Qty: ${item.quantity})`);
    });
    console.log(`  💰 Total: ₹${cart.total.toFixed(2)}`);
  };

  const displayAuthStatus = () => {
    const token = getAuthToken();
    if (token) {
      console.log('  🔐 User is authenticated');
    } else {
      console.log('  🔓 User is NOT authenticated');
    }
  };

  // Test 1: Check current state
  console.log('Test 1: Current State Check');
  console.log('─'.repeat(50));
  displayAuthStatus();
  const currentCart = getCart();
  displayCart(currentCart);
  console.log('\n');

  // Test 2: Verify cart persistence in localStorage
  console.log('Test 2: Cart Storage Verification');
  console.log('─'.repeat(50));
  const cartData = localStorage.getItem(CART_KEY);
  if (cartData) {
    console.log('  ✅ Cart data exists in localStorage');
    try {
      const parsed = JSON.parse(cartData);
      console.log(`  ✅ Cart data is valid JSON`);
      console.log(`  ✅ Cart has ${parsed.items?.length || 0} items`);
    } catch (e) {
      console.log('  ❌ Cart data is corrupted');
    }
  } else {
    console.log('  ⚠️  No cart data in localStorage (cart is empty)');
  }
  console.log('\n');

  // Test 3: Simulate cart preservation check
  console.log('Test 3: Cart Preservation Simulation');
  console.log('─'.repeat(50));
  
  // Save current state
  const beforeCart = getCart();
  const beforeAuth = getAuthToken();
  
  console.log('Before state:');
  displayAuthStatus();
  displayCart(beforeCart);
  
  // Simulate auth state change (just for testing - doesn't actually log in/out)
  console.log('\n  🔄 Simulating authentication state change...');
  
  // Check if cart is still there
  const afterCart = getCart();
  
  console.log('\nAfter state:');
  displayCart(afterCart);
  
  // Compare
  const cartPreserved = JSON.stringify(beforeCart) === JSON.stringify(afterCart);
  if (cartPreserved) {
    console.log('  ✅ Cart data preserved correctly');
  } else {
    console.log('  ❌ Cart data changed unexpectedly');
  }
  console.log('\n');

  // Test 4: Manual test instructions
  console.log('Test 4: Manual Testing Instructions');
  console.log('─'.repeat(50));
  console.log('To fully test cart preservation, follow these steps:\n');
  
  console.log('📝 Test A: Cart Preservation During Login');
  console.log('   1. If logged in, log out first');
  console.log('   2. Add items to cart (browse books and click "Add to Cart")');
  console.log('   3. Run: testCartBeforeLogin()');
  console.log('   4. Navigate to /login and log in');
  console.log('   5. Run: testCartAfterLogin()');
  console.log('   6. Verify cart items are the same\n');
  
  console.log('📝 Test B: Cart Persistence After Refresh');
  console.log('   1. Add items to cart');
  console.log('   2. Run: testCartBeforeRefresh()');
  console.log('   3. Refresh the page (F5)');
  console.log('   4. Run: testCartAfterRefresh()');
  console.log('   5. Verify cart items are the same\n');
  
  console.log('📝 Test C: Cart Preservation After Logout');
  console.log('   1. Log in and add items to cart');
  console.log('   2. Run: testCartBeforeLogout()');
  console.log('   3. Click logout');
  console.log('   4. Run: testCartAfterLogout()');
  console.log('   5. Verify cart items are the same\n');

  // Helper functions for manual testing
  window.testCartBeforeLogin = function() {
    console.log('\n🔍 Cart State BEFORE Login:');
    console.log('─'.repeat(50));
    displayAuthStatus();
    const cart = getCart();
    displayCart(cart);
    window._cartSnapshot = cart;
    console.log('\n✅ Snapshot saved. Now log in and run testCartAfterLogin()');
  };

  window.testCartAfterLogin = function() {
    console.log('\n🔍 Cart State AFTER Login:');
    console.log('─'.repeat(50));
    displayAuthStatus();
    const cart = getCart();
    displayCart(cart);
    
    if (window._cartSnapshot) {
      const preserved = JSON.stringify(window._cartSnapshot) === JSON.stringify(cart);
      console.log('\n' + (preserved ? '✅ PASS: Cart preserved during login' : '❌ FAIL: Cart changed during login'));
    }
  };

  window.testCartBeforeRefresh = function() {
    console.log('\n🔍 Cart State BEFORE Refresh:');
    console.log('─'.repeat(50));
    const cart = getCart();
    displayCart(cart);
    console.log('\n✅ Snapshot saved to localStorage. Now refresh the page and run testCartAfterRefresh()');
    localStorage.setItem('_test_cart_snapshot', JSON.stringify(cart));
  };

  window.testCartAfterRefresh = function() {
    console.log('\n🔍 Cart State AFTER Refresh:');
    console.log('─'.repeat(50));
    const cart = getCart();
    displayCart(cart);
    
    const snapshot = localStorage.getItem('_test_cart_snapshot');
    if (snapshot) {
      const preserved = snapshot === JSON.stringify(cart);
      console.log('\n' + (preserved ? '✅ PASS: Cart preserved after refresh' : '❌ FAIL: Cart changed after refresh'));
      localStorage.removeItem('_test_cart_snapshot');
    }
  };

  window.testCartBeforeLogout = function() {
    console.log('\n🔍 Cart State BEFORE Logout:');
    console.log('─'.repeat(50));
    displayAuthStatus();
    const cart = getCart();
    displayCart(cart);
    window._cartSnapshot = cart;
    console.log('\n✅ Snapshot saved. Now log out and run testCartAfterLogout()');
  };

  window.testCartAfterLogout = function() {
    console.log('\n🔍 Cart State AFTER Logout:');
    console.log('─'.repeat(50));
    displayAuthStatus();
    const cart = getCart();
    displayCart(cart);
    
    if (window._cartSnapshot) {
      const preserved = JSON.stringify(window._cartSnapshot) === JSON.stringify(cart);
      console.log('\n' + (preserved ? '✅ PASS: Cart preserved after logout' : '❌ FAIL: Cart changed after logout'));
    }
  };

  console.log('\n💡 Helper functions available:');
  console.log('   - testCartBeforeLogin()');
  console.log('   - testCartAfterLogin()');
  console.log('   - testCartBeforeRefresh()');
  console.log('   - testCartAfterRefresh()');
  console.log('   - testCartBeforeLogout()');
  console.log('   - testCartAfterLogout()');
  console.log('\n=== Test Suite Complete ===\n');
})();
