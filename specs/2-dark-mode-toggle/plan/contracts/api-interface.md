# API Interface: Dark Mode Toggle

**Feature ID**: 2-dark-mode-toggle  
**Created**: 2025-11-12  
**Type**: Client-Side JavaScript Module Interface

## Overview

Since this is a client-side only feature with no backend API, this document defines the internal JavaScript module interface for the theme management system. These functions will be implemented as part of the inline `<script>` in `index.html`.

## Module: ThemeManager

### Interface Definition

```javascript
/**
 * Theme Manager Module
 * Handles dark/light theme switching and persistence
 */
const ThemeManager = {
  
  /**
   * Initialize theme system on page load
   * - Reads saved preference from localStorage
   * - Detects system preference if no saved value
   * - Applies theme before page renders (if called early)
   * - Sets up event listeners
   * 
   * @returns {string} The applied theme ('light' or 'dark')
   */
  init: function() {},
  
  /**
   * Toggle between light and dark themes
   * - Switches to opposite theme
   * - Saves preference to localStorage
   * - Updates DOM attribute
   * - Updates button UI
   * 
   * @returns {string} The new active theme ('light' or 'dark')
   */
  toggle: function() {},
  
  /**
   * Get currently active theme
   * - Checks localStorage first
   * - Falls back to system preference
   * - Returns 'light' as final fallback
   * 
   * @returns {string} Current theme ('light' or 'dark')
   */
  getCurrentTheme: function() {},
  
  /**
   * Apply a specific theme
   * - Sets data-theme attribute on <html>
   * - Updates toggle button icon and label
   * - Does NOT save to localStorage (use setTheme for that)
   * 
   * @param {string} theme - Theme to apply ('light' or 'dark')
   * @throws {Error} If theme is not 'light' or 'dark'
   */
  applyTheme: function(theme) {},
  
  /**
   * Set and persist theme preference
   * - Saves to localStorage
   * - Applies theme to DOM
   * 
   * @param {string} theme - Theme to set ('light' or 'dark')
   * @throws {Error} If theme is not 'light' or 'dark'
   */
  setTheme: function(theme) {},
  
  /**
   * Check if user has explicitly set a theme preference
   * 
   * @returns {boolean} True if user has saved preference
   */
  hasExplicitPreference: function() {},
  
  /**
   * Clear saved theme preference
   * - Removes from localStorage
   * - Reverts to system preference
   */
  clearPreference: function() {},
  
  /**
   * Detect system theme preference
   * 
   * @returns {string} System preference ('light' or 'dark')
   */
  getSystemPreference: function() {},
  
  /**
   * Set up listener for system theme changes
   * - Only auto-applies if no explicit user preference
   */
  watchSystemChanges: function() {},
  
  /**
   * Update toggle button UI to match current theme
   * - Changes icon (sun/moon)
   * - Updates aria-label
   * - Updates title attribute
   * 
   * @param {string} theme - Current theme ('light' or 'dark')
   */
  updateToggleButton: function(theme) {}
};
```

## Function Specifications

### ThemeManager.init()

**Purpose**: Initialize theme system on page load

**Execution Context**: 
- Early: Inline blocking script in `<head>` (prevents FOUC)
- Late: After DOM ready (sets up interactivity)

**Algorithm**:
```javascript
init() {
  // 1. Get theme (localStorage or system)
  const theme = this.getCurrentTheme();
  
  // 2. Apply to DOM
  this.applyTheme(theme);
  
  // 3. Set up system change listener
  this.watchSystemChanges();
  
  // 4. Set up button click handler (if DOM ready)
  if (document.getElementById('themeToggle')) {
    this.attachButtonHandler();
  }
  
  return theme;
}
```

**Returns**: `string` - Applied theme ('light' | 'dark')

**Side Effects**:
- Sets `data-theme` attribute on `<html>`
- Adds event listeners
- Updates button UI (if DOM ready)

---

### ThemeManager.toggle()

**Purpose**: Switch to opposite theme

**User Interaction**: Called when user clicks theme toggle button

**Algorithm**:
```javascript
toggle() {
  // 1. Get current theme
  const current = this.getCurrentTheme();
  
  // 2. Calculate opposite
  const next = current === 'dark' ? 'light' : 'dark';
  
  // 3. Save preference
  this.setTheme(next);
  
  return next;
}
```

**Returns**: `string` - New theme ('light' | 'dark')

**Side Effects**:
- Writes to localStorage
- Updates `data-theme` attribute
- Updates button UI
- Triggers CSS transitions

---

### ThemeManager.getCurrentTheme()

**Purpose**: Determine which theme should be active

**Algorithm**:
```javascript
getCurrentTheme() {
  // 1. Check localStorage
  const saved = localStorage.getItem('marky-theme');
  
  // 2. Validate
  if (saved === 'light' || saved === 'dark') {
    return saved; // User explicit choice
  }
  
  // 3. Fall back to system
  return this.getSystemPreference();
}
```

**Returns**: `string` - Theme ('light' | 'dark')

**Side Effects**: None (pure function)

---

### ThemeManager.applyTheme(theme)

**Purpose**: Apply theme to DOM without saving

**Parameters**:
- `theme` (string): 'light' or 'dark'

**Algorithm**:
```javascript
applyTheme(theme) {
  // 1. Validate input
  if (theme !== 'light' && theme !== 'dark') {
    throw new Error(`Invalid theme: ${theme}`);
  }
  
  // 2. Set DOM attribute
  document.documentElement.setAttribute('data-theme', theme);
  
  // 3. Update button UI
  this.updateToggleButton(theme);
}
```

**Returns**: `void`

**Throws**: `Error` if theme is invalid

**Side Effects**:
- Modifies `<html>` element attribute
- Updates button icon and labels
- Triggers CSS re-render

---

### ThemeManager.setTheme(theme)

**Purpose**: Set and persist theme preference

**Parameters**:
- `theme` (string): 'light' or 'dark'

**Algorithm**:
```javascript
setTheme(theme) {
  // 1. Validate
  if (theme !== 'light' && theme !== 'dark') {
    throw new Error(`Invalid theme: ${theme}`);
  }
  
  // 2. Save to localStorage
  try {
    localStorage.setItem('marky-theme', theme);
  } catch (e) {
    console.warn('Could not save theme preference:', e);
    // Continue anyway (session-only theme)
  }
  
  // 3. Apply
  this.applyTheme(theme);
}
```

**Returns**: `void`

**Throws**: `Error` if theme is invalid

**Side Effects**:
- Writes to localStorage
- Calls `applyTheme()`

---

### ThemeManager.hasExplicitPreference()

**Purpose**: Check if user has manually set a theme

**Algorithm**:
```javascript
hasExplicitPreference() {
  const saved = localStorage.getItem('marky-theme');
  return saved === 'light' || saved === 'dark';
}
```

**Returns**: `boolean`

**Side Effects**: None (pure function)

---

### ThemeManager.clearPreference()

**Purpose**: Reset to system default

**Algorithm**:
```javascript
clearPreference() {
  // 1. Remove from storage
  localStorage.removeItem('marky-theme');
  
  // 2. Apply system theme
  const systemTheme = this.getSystemPreference();
  this.applyTheme(systemTheme);
}
```

**Returns**: `void`

**Side Effects**:
- Removes localStorage entry
- Applies system theme

**Note**: Not exposed in UI for v1, but available for console/future use

---

### ThemeManager.getSystemPreference()

**Purpose**: Detect OS/browser theme preference

**Algorithm**:
```javascript
getSystemPreference() {
  // 1. Check if API available
  if (!window.matchMedia) {
    return 'light'; // Fallback for old browsers
  }
  
  // 2. Query system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  return prefersDark ? 'dark' : 'light';
}
```

**Returns**: `string` - System theme ('light' | 'dark')

**Side Effects**: None (pure function)

**Browser Support**: Chrome 76+, Firefox 67+, Safari 12.1+, Edge 79+

---

### ThemeManager.watchSystemChanges()

**Purpose**: Listen for OS theme changes and auto-apply if no user override

**Algorithm**:
```javascript
watchSystemChanges() {
  // 1. Check if API available
  if (!window.matchMedia) {
    return; // Not supported
  }
  
  // 2. Get media query
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // 3. Add listener
  mediaQuery.addEventListener('change', (e) => {
    // Only auto-switch if no explicit preference
    if (!this.hasExplicitPreference()) {
      const theme = e.matches ? 'dark' : 'light';
      this.applyTheme(theme);
    }
  });
}
```

**Returns**: `void`

**Side Effects**:
- Adds event listener to MediaQueryList
- May trigger theme changes in future

---

### ThemeManager.updateToggleButton(theme)

**Purpose**: Update button icon and labels to match theme

**Parameters**:
- `theme` (string): Current theme ('light' | 'dark')

**Algorithm**:
```javascript
updateToggleButton(theme) {
  const button = document.getElementById('themeToggle');
  if (!button) return; // Button not in DOM yet
  
  const iconContainer = button.querySelector('.theme-icon');
  
  if (theme === 'dark') {
    // Show moon icon (current state is dark)
    iconContainer.innerHTML = '🌙'; // Or SVG moon icon
    button.setAttribute('aria-label', 'Dark mode active. Click to switch to light mode');
    button.setAttribute('title', 'Switch to light mode');
  } else {
    // Show sun icon (current state is light)
    iconContainer.innerHTML = '☀️'; // Or SVG sun icon
    button.setAttribute('aria-label', 'Light mode active. Click to switch to dark mode');
    button.setAttribute('title', 'Switch to dark mode');
  }
}
```

**Returns**: `void`

**Side Effects**:
- Updates button innerHTML
- Updates ARIA attributes
- Updates title attribute

---

## Event Handlers

### Button Click Handler

```javascript
/**
 * Handle theme toggle button click
 * Attached to: #themeToggle button
 */
function handleThemeToggle(event) {
  event.preventDefault();
  const newTheme = ThemeManager.toggle();
  
  // Optional: Analytics or logging
  console.log(`Theme switched to: ${newTheme}`);
}

// Attach handler
document.getElementById('themeToggle')?.addEventListener('click', handleThemeToggle);
```

### Keyboard Handler

```javascript
/**
 * Optional: Keyboard shortcut (e.g., Ctrl+Shift+D)
 */
function handleKeyboardShortcut(event) {
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
    event.preventDefault();
    ThemeManager.toggle();
  }
}

document.addEventListener('keydown', handleKeyboardShortcut);
```

## Error Handling

### localStorage Errors

```javascript
/**
 * Safely access localStorage with error handling
 */
function safeLocalStorage() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return localStorage;
  } catch (e) {
    console.warn('localStorage not available:', e);
    // Return mock storage (session-only)
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };
  }
}
```

### Invalid Theme Values

```javascript
/**
 * Sanitize theme value
 */
function sanitizeTheme(value) {
  if (value === 'light' || value === 'dark') {
    return value;
  }
  console.warn(`Invalid theme value: ${value}, defaulting to light`);
  return 'light';
}
```

## Usage Examples

### Example 1: Initial Page Load (Blocking Script)

```html
<head>
  <script>
    // Execute BEFORE CSS loads to prevent FOUC
    (function() {
      const saved = localStorage.getItem('marky-theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (systemDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
  
  <link rel="stylesheet" href="...">
</head>
```

### Example 2: Full Initialization (After DOM Ready)

```html
<body>
  <!-- Content -->
  
  <script>
    // Full theme manager initialization
    document.addEventListener('DOMContentLoaded', () => {
      ThemeManager.init();
      
      // Attach button handler
      const toggleBtn = document.getElementById('themeToggle');
      toggleBtn.addEventListener('click', () => {
        ThemeManager.toggle();
      });
    });
  </script>
</body>
```

### Example 3: Manual Theme Setting (Console/Testing)

```javascript
// Set to dark mode
ThemeManager.setTheme('dark');

// Set to light mode
ThemeManager.setTheme('light');

// Clear preference (revert to system)
ThemeManager.clearPreference();

// Check current theme
console.log(ThemeManager.getCurrentTheme());

// Check if user has made choice
console.log(ThemeManager.hasExplicitPreference());
```

## Performance Considerations

### Function Call Frequency

| Function | Frequency | Performance Impact |
|----------|-----------|-------------------|
| `init()` | Once per page load | Low (<1ms) |
| `getCurrentTheme()` | Multiple (per interaction) | Very Low (<0.1ms) |
| `toggle()` | User clicks only | Low (~1ms) |
| `applyTheme()` | Toggle + system changes | Medium (~250ms for CSS transition) |
| `watchSystemChanges()` | Once per page load | Very Low |
| `updateToggleButton()` | Every theme change | Very Low (<0.5ms) |

### Optimization Notes

- `getCurrentTheme()` reads localStorage on each call (consider caching if called frequently)
- CSS transitions are GPU-accelerated (minimal CPU impact)
- MediaQueryList listener is passive (no continuous polling)

## Testing Interface

### Test Utilities

```javascript
/**
 * Testing utilities (not exposed in production)
 */
const ThemeManagerTestUtils = {
  
  /**
   * Reset to clean state
   */
  reset() {
    localStorage.removeItem('marky-theme');
    document.documentElement.removeAttribute('data-theme');
  },
  
  /**
   * Mock system preference
   */
  mockSystemPreference(prefersDark) {
    // Would need to stub matchMedia for testing
  },
  
  /**
   * Get current DOM state
   */
  getDOMState() {
    return {
      dataTheme: document.documentElement.getAttribute('data-theme'),
      stored: localStorage.getItem('marky-theme'),
      buttonIcon: document.getElementById('themeToggle')?.innerHTML
    };
  }
};
```

## Summary

The ThemeManager module provides a simple, focused API for dark mode functionality:

- **10 public methods** for theme management
- **Zero dependencies** (vanilla JavaScript)
- **localStorage-based** persistence
- **System preference** integration
- **Graceful degradation** for unsupported browsers

**Complexity**: Low  
**Maintainability**: High  
**Performance**: Excellent (<1ms for most operations)
