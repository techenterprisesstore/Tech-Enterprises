// Test script to verify checkout functionality
// This can be run in the browser console

console.log('Testing checkout functionality...');

// Test 1: Check if user is authenticated
const user = JSON.parse(localStorage.getItem('user') || 'null');
console.log('User authenticated:', !!user);

// Test 2: Check cart items
const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
console.log('Cart items:', cartItems.length);

// Test 3: Try to navigate to checkout
if (user && cartItems.length > 0) {
  console.log('✅ Should be able to access checkout');
  window.location.href = '/checkout';
} else {
  console.log('❌ Cannot access checkout - missing user or cart items');
  if (!user) console.log('Missing: User authentication');
  if (cartItems.length === 0) console.log('Missing: Cart items');
}
