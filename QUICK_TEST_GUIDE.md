# Quick Test Guide: Cart Preservation

## 5-Minute Verification Test

Follow these steps to quickly verify cart preservation works correctly:

### Prerequisites
- Application is running (run `npm run dev` if needed)
- You have test credentials to log in

### Test Steps

#### Step 1: Add Items to Cart (Not Logged In)
1. Open the application in your browser
2. Make sure you're NOT logged in (log out if needed)
3. Browse to the home page or books page
4. Add 2-3 books to your cart
5. Click the cart icon to verify items are there
6. **Note the number of items and which books**

#### Step 2: Verify Cart Persists During Login
1. Navigate to `/login`
2. Log in with your credentials
3. After successful login, check the cart icon
4. **Expected**: Same number of items should be shown
5. Click cart to verify the same books are still there
6. ✅ **PASS** if cart items are preserved

#### Step 3: Verify Cart Persists After Page Refresh
1. While logged in with items in cart
2. Press F5 or Ctrl+R to refresh the page
3. Wait for page to reload
4. Check the cart icon
5. **Expected**: Same items should still be in cart
6. ✅ **PASS** if cart items are preserved

#### Step 4: Verify Cart Persists After Logout
1. While logged in with items in cart
2. Click the logout button in the header
3. After logout, check the cart icon
4. **Expected**: Same items should still be in cart
5. ✅ **PASS** if cart items are preserved

### Using Browser DevTools

You can also verify using browser DevTools:

1. Open DevTools (F12)
2. Go to **Application** tab
3. In the left sidebar, expand **Local Storage**
4. Click on your application's domain
5. Look for the key `bookstore_cart`
6. You should see JSON data with your cart items
7. This data should persist through login, logout, and refresh

### Using the Test Script

For more detailed testing:

1. Open DevTools Console (F12)
2. Copy the contents of `test-cart-preservation.js`
3. Paste into console and press Enter
4. Follow the on-screen instructions
5. Use helper functions like:
   - `testCartBeforeLogin()`
   - `testCartAfterLogin()`
   - `testCartBeforeLogout()`
   - `testCartAfterLogout()`

### Expected Results

All tests should PASS:
- ✅ Cart items persist when logging in
- ✅ Cart items persist after page refresh
- ✅ Cart items persist after logging out

### If Tests Fail

If any test fails, check:
1. Browser console for errors
2. Network tab for failed API calls
3. localStorage to see if `bookstore_cart` key exists
4. That you're using the latest code

### Technical Details

**How it works:**
- Cart is stored in browser localStorage with key `bookstore_cart`
- Cart saves automatically on every change
- Cart loads automatically when app starts
- Authentication and cart are completely independent
- Login/logout only affects `auth_token`, not cart

**Storage Keys:**
- `bookstore_cart` - Shopping cart data
- `auth_token` - Authentication token (separate)

### Troubleshooting

**Cart is empty after login:**
- Check if localStorage is enabled in your browser
- Check browser console for errors
- Verify `bookstore_cart` exists in localStorage

**Cart cleared after logout:**
- This should NOT happen
- Check if there's custom logout logic clearing cart
- Verify `bookstore_cart` still exists in localStorage after logout

**Cart cleared after refresh:**
- This should NOT happen
- Check if localStorage is being cleared
- Verify browser allows localStorage

## Summary

The cart preservation feature is working correctly if:
1. ✅ You can add items to cart while not logged in
2. ✅ Items remain in cart after logging in
3. ✅ Items remain in cart after page refresh
4. ✅ Items remain in cart after logging out

**Total test time: ~5 minutes**

For detailed analysis, see `CART_PRESERVATION_SUMMARY.md`
