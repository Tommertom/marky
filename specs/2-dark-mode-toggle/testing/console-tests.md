# Dark Mode Toggle - Console Test Commands

Copy and paste these commands into the browser DevTools console to test the implementation.

## Setup Tests

```javascript
// Test 1: Verify ThemeManager exists
console.log('ThemeManager available:', typeof ThemeManager === 'object');

// Test 2: Verify all methods exist
const methods = ['init', 'toggle', 'getCurrentTheme', 'applyTheme', 'setTheme', 
                 'hasExplicitPreference', 'clearPreference', 'getSystemPreference', 
                 'watchSystemChanges', 'updateToggleButton'];
console.log('All methods present:', methods.every(m => typeof ThemeManager[m] === 'function'));

// Test 3: Verify toggle button exists
console.log('Toggle button exists:', document.getElementById('themeToggle') !== null);

// Test 4: Verify data-theme attribute is set
console.log('Theme attribute set:', document.documentElement.getAttribute('data-theme'));
```

## Functional Tests

```javascript
// Test 5: Get current theme
console.log('Current theme:', ThemeManager.getCurrentTheme());

// Test 6: Toggle theme
console.log('Before toggle:', ThemeManager.getCurrentTheme());
ThemeManager.toggle();
console.log('After toggle:', ThemeManager.getCurrentTheme());

// Test 7: Toggle again (should go back)
ThemeManager.toggle();
console.log('After second toggle:', ThemeManager.getCurrentTheme());

// Test 8: Set theme explicitly to dark
ThemeManager.setTheme('dark');
console.log('Explicitly set to dark:', ThemeManager.getCurrentTheme());

// Test 9: Set theme explicitly to light
ThemeManager.setTheme('light');
console.log('Explicitly set to light:', ThemeManager.getCurrentTheme());

// Test 10: Check localStorage
console.log('localStorage value:', localStorage.getItem('marky-theme'));

// Test 11: Check if user has explicit preference
console.log('Has explicit preference:', ThemeManager.hasExplicitPreference());

// Test 12: Clear preference
ThemeManager.clearPreference();
console.log('After clearing preference:', ThemeManager.getCurrentTheme());
console.log('Has explicit preference now:', ThemeManager.hasExplicitPreference());

// Test 13: Get system preference
console.log('System preference:', ThemeManager.getSystemPreference());
```

## Visual Tests

```javascript
// Test 14: Verify CSS variables are defined
const root = getComputedStyle(document.documentElement);
console.log('--bg-primary:', root.getPropertyValue('--bg-primary'));
console.log('--text-primary:', root.getPropertyValue('--text-primary'));
console.log('--accent-blue:', root.getPropertyValue('--accent-blue'));

// Test 15: Toggle and check variables change
ThemeManager.toggle();
setTimeout(() => {
  const newRoot = getComputedStyle(document.documentElement);
  console.log('After toggle --bg-primary:', newRoot.getPropertyValue('--bg-primary'));
  console.log('After toggle --text-primary:', newRoot.getPropertyValue('--text-primary'));
}, 300); // Wait for transition to complete

// Test 16: Verify button icon updates
const button = document.getElementById('themeToggle');
const icon = button.querySelector('.theme-icon');
console.log('Current icon:', icon.textContent);
ThemeManager.toggle();
console.log('Icon after toggle:', icon.textContent);

// Test 17: Verify ARIA labels update
console.log('Button title:', button.getAttribute('title'));
console.log('Button aria-label:', button.getAttribute('aria-label'));
```

## Performance Tests

```javascript
// Test 18: Measure toggle performance
console.time('toggle-performance');
ThemeManager.toggle();
console.timeEnd('toggle-performance');

// Test 19: Measure multiple rapid toggles
console.time('10-rapid-toggles');
for (let i = 0; i < 10; i++) {
  ThemeManager.toggle();
}
console.timeEnd('10-rapid-toggles');

// Test 20: Test with very long content
const editor = document.getElementById('editor');
const originalContent = editor.value;
editor.value = 'Lorem ipsum dolor sit amet. '.repeat(1000);
console.time('toggle-with-long-content');
ThemeManager.toggle();
console.timeEnd('toggle-with-long-content');
editor.value = originalContent;
```

## Error Handling Tests

```javascript
// Test 21: Try to set invalid theme
ThemeManager.setTheme('invalid');
console.log('After invalid theme:', ThemeManager.getCurrentTheme());

// Test 22: Simulate localStorage unavailable
const originalSetItem = localStorage.setItem;
localStorage.setItem = function() { throw new Error('localStorage unavailable'); };
ThemeManager.setTheme('dark');
console.log('Theme set with broken localStorage:', document.documentElement.getAttribute('data-theme'));
localStorage.setItem = originalSetItem;

// Test 23: Verify no console errors
console.log('Check console above - should see no errors in red');
```

## Integration Tests

```javascript
// Test 24: Full user flow simulation
console.log('=== FULL USER FLOW TEST ===');

// Step 1: Clear all preferences
localStorage.removeItem('marky-theme');
console.log('1. Cleared localStorage');

// Step 2: Reload theme from system
const systemTheme = ThemeManager.getSystemPreference();
console.log('2. System theme:', systemTheme);

// Step 3: User toggles theme
ThemeManager.toggle();
const afterToggle = ThemeManager.getCurrentTheme();
console.log('3. After toggle:', afterToggle);

// Step 4: Verify persistence
const stored = localStorage.getItem('marky-theme');
console.log('4. Stored in localStorage:', stored);
console.log('5. Has explicit preference:', ThemeManager.hasExplicitPreference());

// Step 5: Simulate page reload
ThemeManager.init();
console.log('6. After simulated reload:', ThemeManager.getCurrentTheme());

console.log('=== TEST COMPLETE ===');
```

## Accessibility Tests

```javascript
// Test 25: Verify focus works
const toggleBtn = document.getElementById('themeToggle');
toggleBtn.focus();
console.log('Focus on toggle button:', document.activeElement === toggleBtn);

// Test 26: Simulate keyboard activation (Space key)
const spaceEvent = new KeyboardEvent('keydown', { key: ' ', code: 'Space' });
toggleBtn.dispatchEvent(spaceEvent);
toggleBtn.click(); // Manually trigger since event simulation may not work

// Test 27: Check all buttons have proper attributes
const allButtons = document.querySelectorAll('button');
allButtons.forEach((btn, i) => {
  console.log(`Button ${i}: title="${btn.getAttribute('title')}", aria-label="${btn.getAttribute('aria-label')}"`);
});
```

## Cleanup

```javascript
// Reset to light theme for next test session
ThemeManager.setTheme('light');
console.log('Reset to light theme for next test session');
```

## Expected Results Summary

✅ All methods should be defined and callable  
✅ Theme should toggle between 'light' and 'dark'  
✅ localStorage should store 'marky-theme' key  
✅ Toggle performance should be <10ms  
✅ Button icon should update (🌙 ↔ ☀️)  
✅ CSS variables should change when theme changes  
✅ Invalid theme values should be ignored  
✅ No console errors should appear  

Run all tests and verify results match expectations!
