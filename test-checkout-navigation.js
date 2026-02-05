// Test the checkout navigation directly in browser console
// Copy and paste this into the browser console when on the cart page

console.log('Testing checkout navigation...');

// Test 1: Check if we're on the cart page
if (window.location.pathname === '/cart') {
  console.log('✅ On cart page');
  
  // Test 2: Check if there are items in cart
  const checkoutButton = document.querySelector('button[type="button"]');
  if (checkoutButton) {
    console.log('✅ Checkout button found');
    console.log('Button disabled:', checkoutButton.disabled);
    console.log('Button text:', checkoutButton.textContent);
    
    // Test 3: Try clicking the button
    console.log('🖱️ Simulating button click...');
    checkoutButton.click();
  } else {
    console.log('❌ Checkout button not found');
  }
} else {
  console.log('❌ Not on cart page, current path:', window.location.pathname);
}
