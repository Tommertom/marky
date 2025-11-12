# Data Model: Dark Mode Toggle

**Feature ID**: 2-dark-mode-toggle  
**Created**: 2025-11-12  
**Status**: Planning

## Overview

The dark mode toggle feature requires minimal data persistence. All state is client-side and uses browser localStorage for persistence. No backend or database models are needed.

## Client-Side Data Models

### 1. Theme Preference (Persisted State)

**Storage Location**: `localStorage`  
**Key**: `marky-theme`  
**Type**: String or null

```typescript
type ThemePreference = 'light' | 'dark' | null;
```

**Values**:
- `'light'`: User has explicitly selected light mode
- `'dark'`: User has explicitly selected dark mode
- `null` or absent: User has not made a selection, follow system preference

**Lifecycle**:
- **Created**: When user first clicks theme toggle
- **Updated**: Each time user toggles theme
- **Deleted**: User clears browser data, or manually cleared
- **Read**: On every page load

**Validation**:
```javascript
function isValidTheme(value) {
  return value === null || value === 'light' || value === 'dark';
}

function getThemeFromStorage() {
  const stored = localStorage.getItem('marky-theme');
  return isValidTheme(stored) ? stored : null;
}
```

### 2. System Theme Preference (Runtime State)

**Storage Location**: Runtime memory (not persisted)  
**Source**: `window.matchMedia('(prefers-color-scheme: dark)')`

```typescript
interface SystemThemeState {
  prefersDark: boolean;        // Current system preference
  mediaQuery: MediaQueryList;  // For listening to changes
}
```

**Properties**:
- `prefersDark`: Boolean indicating if system prefers dark mode
- `mediaQuery`: MediaQueryList object for reactive updates

**Lifecycle**:
- **Created**: On initial page load
- **Updated**: When system theme changes (via MediaQueryList listener)
- **Destroyed**: When page unloads

**Access Pattern**:
```javascript
const systemTheme = {
  prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  mediaQuery: window.matchMedia('(prefers-color-scheme: dark)')
};
```

### 3. Active Theme (Computed State)

**Storage Location**: DOM attribute (`data-theme` on `<html>` element)  
**Type**: String

```typescript
type ActiveTheme = 'light' | 'dark';
```

**Derivation Logic**:
```javascript
function getActiveTheme() {
  const savedPreference = getThemeFromStorage(); // From localStorage
  
  if (savedPreference !== null) {
    return savedPreference; // User override takes precedence
  }
  
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return systemPrefersDark ? 'dark' : 'light';
}
```

**Application**:
```javascript
document.documentElement.setAttribute('data-theme', getActiveTheme());
```

**State Transitions**:
```
Initial Load:
  null (no storage) + system:light → data-theme="light"
  null (no storage) + system:dark → data-theme="dark"
  storage:light → data-theme="light"
  storage:dark → data-theme="dark"

User Toggle:
  data-theme="light" → storage="dark" → data-theme="dark"
  data-theme="dark" → storage="light" → data-theme="light"

System Change (only if no user override):
  storage=null + system changes → update data-theme
  storage≠null + system changes → no change (user override)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Page Load                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Read          │
                  │ localStorage  │
                  │ 'marky-theme' │
                  └───────┬───────┘
                          │
                ┌─────────┴─────────┐
                │                   │
           Has Value?              null
                │                   │
                ▼                   ▼
         ┌──────────┐      ┌────────────────┐
         │ Use      │      │ Check System   │
         │ Stored   │      │ Preference     │
         │ Value    │      │ matchMedia()   │
         └────┬─────┘      └────────┬───────┘
              │                     │
              └─────────┬───────────┘
                        │
                        ▼
                ┌───────────────┐
                │ Set           │
                │ data-theme    │
                │ on <html>     │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ CSS Variables │
                │ Apply Theme   │
                └───────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    User Toggles Theme                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Get Current   │
                  │ data-theme    │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Calculate     │
                  │ New Theme     │
                  │ (opposite)    │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Save to       │
                  │ localStorage  │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Update        │
                  │ data-theme    │
                  │ attribute     │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Update Button │
                  │ Icon & Label  │
                  └───────────────┘
```

## Storage Schema

### localStorage Structure

```javascript
// Single key-value pair
{
  "marky-theme": "dark"  // or "light" or null/absent
}
```

**Size**: ~20 bytes (negligible)

**Expiration**: Never (persists until user clears browser data)

**Domain**: Scoped to application domain

## CSS Custom Properties Schema

### Light Theme Variables

```css
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-toolbar: #2c3e50;
  --bg-editor: #ffffff;
  --bg-editor-focus: #fafafa;
  --bg-format-bar: #ffffff;
  --bg-code-block: #f4f4f4;
  
  /* Text */
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-heading: #2c3e50;
  --text-toolbar: #ffffff;
  
  /* Borders */
  --border-primary: #e0e0e0;
  --border-secondary: #d0d0d0;
  --border-heading: #eeeeee;
  
  /* Accents */
  --accent-blue: #3498db;
  --accent-blue-hover: #2980b9;
  
  /* Shadows */
  --shadow-light: rgba(0, 0, 0, 0.1);
  --shadow-medium: rgba(0, 0, 0, 0.15);
}
```

### Dark Theme Variables

```css
[data-theme="dark"] {
  /* Backgrounds */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-toolbar: #0f1419;
  --bg-editor: #1a1a1a;
  --bg-editor-focus: #222222;
  --bg-format-bar: #2d2d2d;
  --bg-code-block: #2a2a2a;
  
  /* Text */
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --text-heading: #f0f0f0;
  --text-toolbar: #e0e0e0;
  
  /* Borders */
  --border-primary: #404040;
  --border-secondary: #4a4a4a;
  --border-heading: #333333;
  
  /* Accents */
  --accent-blue: #66b3ff;
  --accent-blue-hover: #52a3ff;
  
  /* Shadows */
  --shadow-light: rgba(0, 0, 0, 0.3);
  --shadow-medium: rgba(0, 0, 0, 0.4);
}
```

## State Management

### Theme State Machine

```
States:
  - LIGHT_EXPLICIT: User chose light mode
  - DARK_EXPLICIT: User chose dark mode
  - SYSTEM_DEFAULT: Following system preference
    ↳ SYSTEM_LIGHT: System is light
    ↳ SYSTEM_DARK: System is dark

Events:
  - TOGGLE: User clicks toggle button
  - SYSTEM_CHANGE: OS theme changes
  - PAGE_LOAD: Initial load

Transitions:
  LIGHT_EXPLICIT + TOGGLE → DARK_EXPLICIT
  DARK_EXPLICIT + TOGGLE → LIGHT_EXPLICIT
  
  SYSTEM_DEFAULT + SYSTEM_CHANGE → SYSTEM_DEFAULT (with updated theme)
  
  LIGHT_EXPLICIT + SYSTEM_CHANGE → LIGHT_EXPLICIT (no change, user override)
  DARK_EXPLICIT + SYSTEM_CHANGE → DARK_EXPLICIT (no change, user override)
```

### Implementation Pseudocode

```javascript
class ThemeManager {
  constructor() {
    this.storageKey = 'marky-theme';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }
  
  // Get current theme state
  getCurrentTheme() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'light' || saved === 'dark') {
      return saved; // Explicit user choice
    }
    // Fall back to system
    return this.mediaQuery.matches ? 'dark' : 'light';
  }
  
  // Check if user has made explicit choice
  hasExplicitPreference() {
    const saved = localStorage.getItem(this.storageKey);
    return saved === 'light' || saved === 'dark';
  }
  
  // Toggle theme
  toggle() {
    const current = this.getCurrentTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    
    // Save explicit choice
    localStorage.setItem(this.storageKey, next);
    
    // Apply
    this.applyTheme(next);
    
    return next;
  }
  
  // Apply theme to DOM
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.updateToggleButton(theme);
  }
  
  // Listen for system changes
  watchSystemChanges() {
    this.mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if no explicit preference
      if (!this.hasExplicitPreference()) {
        const theme = e.matches ? 'dark' : 'light';
        this.applyTheme(theme);
      }
    });
  }
  
  // Initialize on page load
  init() {
    const theme = this.getCurrentTheme();
    this.applyTheme(theme);
    this.watchSystemChanges();
  }
}
```

## Validation Rules

### localStorage Value Validation

```javascript
function validateStoredTheme(value) {
  // Accept only specific strings
  const validValues = ['light', 'dark', null];
  
  if (!validValues.includes(value)) {
    console.warn(`Invalid theme value: ${value}, clearing`);
    localStorage.removeItem('marky-theme');
    return null;
  }
  
  return value;
}
```

### Theme Application Validation

```javascript
function validateThemeAttribute() {
  const attr = document.documentElement.getAttribute('data-theme');
  
  if (attr !== 'light' && attr !== 'dark') {
    console.error(`Invalid data-theme: ${attr}`);
    // Force to light as safe default
    document.documentElement.setAttribute('data-theme', 'light');
  }
}
```

## Error Handling

### localStorage Unavailable

```javascript
function isLocalStorageAvailable() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Graceful degradation
const storage = isLocalStorageAvailable() 
  ? localStorage 
  : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };
```

### matchMedia Unavailable (Legacy Browsers)

```javascript
function getSystemPreference() {
  if (!window.matchMedia) {
    return 'light'; // Default for old browsers
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}
```

## Performance Considerations

### Initial Load Optimization

**Critical Path**:
1. Inline script reads localStorage (~0.1ms)
2. Sets `data-theme` attribute (~0.1ms)
3. CSS applies (already parsed, instant)

**Total Blocking Time**: <1ms (negligible)

### Runtime Performance

**Theme Toggle**:
1. Update localStorage (~0.1ms)
2. Set DOM attribute (~0.1ms)
3. CSS transitions (~250ms, GPU-accelerated)

**Memory Footprint**: <1 KB (theme state + listeners)

## Security Considerations

### XSS Prevention

```javascript
// SAFE: Using setAttribute (not innerHTML)
document.documentElement.setAttribute('data-theme', userTheme);

// Values are validated before use
const sanitizedTheme = ['light', 'dark'].includes(userTheme) 
  ? userTheme 
  : 'light';
```

### localStorage Access

- Read-only access to `marky-theme` key
- No eval() or dynamic code execution
- No sensitive data stored
- Domain-scoped (can't access other sites)

## Summary

The dark mode toggle requires minimal data modeling:

1. **One localStorage entry**: Simple string value
2. **One DOM attribute**: `data-theme` on root element
3. **CSS Variables**: Defined in stylesheet, applied via attribute selector
4. **Runtime state**: Derived from localStorage + system preference

**Total data complexity**: Very low  
**Storage requirements**: ~20 bytes  
**Performance impact**: Negligible (<1ms)
