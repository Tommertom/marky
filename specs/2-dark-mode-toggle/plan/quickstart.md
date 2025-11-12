# Quickstart Guide: Dark Mode Toggle Implementation

**Feature ID**: 2-dark-mode-toggle  
**Created**: 2025-11-12  
**Estimated Time**: 2-3 hours

## Overview

This quickstart provides a step-by-step implementation guide for adding dark mode toggle functionality to the Marky Markdown Editor. Follow these steps in order for fastest implementation.

## Prerequisites

- ✅ Specification complete (`spec.md`)
- ✅ Research complete (`research.md`)
- ✅ Data model defined (`data-model.md`)
- ✅ API contracts defined (`contracts/api-interface.md`)

## Implementation Steps

### Step 1: Define CSS Custom Properties (30 min)

**Location**: `<style>` section in `index.html`

**Action**: Add CSS variables for theming at the top of your stylesheet

```css
/* Add at the very beginning of <style> section */

/* ========================================
   CSS Variables - Light Theme (Default)
   ======================================== */
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-toolbar: #2c3e50;
  --bg-editor: #ffffff;
  --bg-editor-focus: #fafafa;
  --bg-format-bar: #ffffff;
  --bg-code-block: #f4f4f4;
  
  /* Text Colors */
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
  
  /* Transitions */
  --transition-speed: 250ms;
}

/* ========================================
   CSS Variables - Dark Theme
   ======================================== */
[data-theme="dark"] {
  /* Backgrounds */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-toolbar: #0f1419;
  --bg-editor: #1a1a1a;
  --bg-editor-focus: #222222;
  --bg-format-bar: #2d2d2d;
  --bg-code-block: #2a2a2a;
  
  /* Text Colors */
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

/* ========================================
   Smooth Transitions
   ======================================== */
* {
  transition: background-color var(--transition-speed) ease,
              color var(--transition-speed) ease,
              border-color var(--transition-speed) ease;
}
```

**Test**: Add `data-theme="dark"` to `<html>` element temporarily to preview dark mode

---

### Step 2: Update Existing CSS to Use Variables (45 min)

**Location**: Throughout `<style>` section

**Action**: Replace all hardcoded colors with CSS variables

**Find and Replace Examples**:

```css
/* BEFORE */
body {
  background: #f5f5f5;
  color: #333;
}

/* AFTER */
body {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
```

```css
/* BEFORE */
.toolbar {
  background: #2c3e50;
  color: white;
}

/* AFTER */
.toolbar {
  background: var(--bg-toolbar);
  color: var(--text-toolbar);
}
```

```css
/* BEFORE */
#editor {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
}

/* AFTER */
#editor {
  background: var(--bg-editor);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
```

**Key Areas to Update**:
- `body` - background, text
- `.container` - background
- `.toolbar` - background, text
- `.buttons` - colors
- `button` - background, colors, hover states
- `#editor` - background, text, borders, focus state
- Headings (`h1`, `h2`, `h3`) - colors, borders
- Links (`a`) - color, hover
- Code blocks (`code`, `pre`) - background
- Tables (`table`, `th`, `td`) - backgrounds, borders
- `.format-bar` - background, borders, shadows

**Test**: Toggle `data-theme` attribute and verify all elements update correctly

---

### Step 3: Add Theme Toggle Button to Toolbar (15 min)

**Location**: `.toolbar .buttons` section in HTML

**Action**: Add theme toggle button

```html
<!-- Add this button in the toolbar, before or after existing buttons -->
<button 
  id="themeToggle" 
  title="Toggle dark mode"
  aria-label="Toggle dark mode"
  data-testid="theme-toggle">
  <span class="theme-icon">
    <!-- Icon will be populated by JavaScript -->
  </span>
</button>
```

**Optional: Add Icon Styling**:

```css
#themeToggle .theme-icon {
  font-size: 1.2rem;
  line-height: 1;
}

/* Or if using SVG icons: */
#themeToggle svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}
```

---

### Step 4: Add Inline Blocking Script (CRITICAL - 10 min)

**Location**: `<head>` section, **BEFORE** `<style>` tag

**Action**: Add theme initialization script

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Marky Markdown Editor</title>
  
  <!-- CRITICAL: Theme initialization BEFORE styles load -->
  <script>
    (function() {
      // Get saved preference
      const saved = localStorage.getItem('marky-theme');
      
      // Get system preference
      const systemPrefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Determine theme
      const theme = saved || (systemPrefersDark ? 'dark' : 'light');
      
      // Apply immediately
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
  
  <style>
    /* Your styles here */
  </style>
</head>
```

**Why This Matters**: Prevents flash of wrong theme on page load

---

### Step 5: Implement Theme Manager Module (30 min)

**Location**: New `<script>` section, after main app script

**Action**: Add complete theme management logic

```javascript
// Add this script block after your existing app-script
<script id="theme-manager">
  const ThemeManager = {
    storageKey: 'marky-theme',
    
    getCurrentTheme() {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      
      // Fall back to system
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      
      return 'light';
    },
    
    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      this.updateToggleButton(theme);
    },
    
    setTheme(theme) {
      try {
        localStorage.setItem(this.storageKey, theme);
      } catch (e) {
        console.warn('Could not save theme preference:', e);
      }
      this.applyTheme(theme);
    },
    
    toggle() {
      const current = this.getCurrentTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      return next;
    },
    
    updateToggleButton(theme) {
      const button = document.getElementById('themeToggle');
      if (!button) return;
      
      const iconContainer = button.querySelector('.theme-icon');
      
      if (theme === 'dark') {
        // Dark mode active - show moon icon
        iconContainer.innerHTML = '🌙';
        button.setAttribute('aria-label', 'Dark mode active. Click to switch to light mode');
        button.setAttribute('title', 'Switch to light mode');
      } else {
        // Light mode active - show sun icon
        iconContainer.innerHTML = '☀️';
        button.setAttribute('aria-label', 'Light mode active. Click to switch to dark mode');
        button.setAttribute('title', 'Switch to dark mode');
      }
    },
    
    hasExplicitPreference() {
      const saved = localStorage.getItem(this.storageKey);
      return saved === 'light' || saved === 'dark';
    },
    
    watchSystemChanges() {
      if (!window.matchMedia) return;
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if no explicit preference
        if (!this.hasExplicitPreference()) {
          const theme = e.matches ? 'dark' : 'light';
          this.applyTheme(theme);
        }
      });
    },
    
    init() {
      const theme = this.getCurrentTheme();
      this.applyTheme(theme);
      this.watchSystemChanges();
    }
  };
  
  // Initialize on DOM ready
  window.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    
    // Attach button handler
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        ThemeManager.toggle();
      });
    }
  });
</script>
```

---

### Step 6: Optional Keyboard Shortcut (5 min)

**Location**: Add to theme-manager script

**Action**: Add keyboard shortcut (Ctrl+Shift+D)

```javascript
// Add to DOMContentLoaded event listener
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    ThemeManager.toggle();
  }
});
```

---

### Step 7: Testing Checklist (20 min)

**Manual Tests**:

- [ ] Page loads with correct theme (matches system preference on first visit)
- [ ] Click toggle button - theme switches immediately
- [ ] Page refresh - theme persists
- [ ] Close browser completely - theme persists on reopening
- [ ] Change system theme (no saved preference) - app theme updates automatically
- [ ] Change system theme (with saved preference) - app theme does NOT change
- [ ] Clear localStorage - resets to system preference
- [ ] Toggle button shows correct icon (sun in light mode, moon in dark mode)
- [ ] Hover states work in both themes
- [ ] All UI elements visible in both themes
- [ ] No flash of wrong theme on page load
- [ ] Keyboard shortcut works (if implemented)

**Visual Tests**:

- [ ] Check all toolbar buttons
- [ ] Check editor background and text
- [ ] Check format bar
- [ ] Check headings (h1, h2, h3)
- [ ] Check links
- [ ] Check code blocks
- [ ] Check blockquotes
- [ ] Check lists
- [ ] Check tables (if present)
- [ ] Check borders and shadows

**Browser Tests**:

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Accessibility Tests**:

- [ ] Tab to theme toggle button
- [ ] Press Space/Enter to toggle
- [ ] Screen reader announces theme changes (test with NVDA/VoiceOver if possible)

---

## Troubleshooting

### Issue: Flash of wrong theme on page load

**Solution**: Ensure inline script in `<head>` is **BEFORE** `<style>` tag

### Issue: Theme doesn't persist

**Solution**: Check browser localStorage settings, ensure not in private/incognito mode

### Issue: Some elements don't change color

**Solution**: Search for hardcoded color values in CSS, replace with variables

### Issue: Transitions too slow/fast

**Solution**: Adjust `--transition-speed` variable (200-300ms recommended)

### Issue: Button icon doesn't update

**Solution**: Check `updateToggleButton()` function, ensure button ID matches

---

## Quick Reference

### Toggle Theme Programmatically

```javascript
// From browser console
ThemeManager.toggle();
```

### Force Specific Theme

```javascript
// Set to dark
ThemeManager.setTheme('dark');

// Set to light
ThemeManager.setTheme('light');
```

### Check Current Theme

```javascript
console.log(ThemeManager.getCurrentTheme());
```

### Reset to System Default

```javascript
localStorage.removeItem('marky-theme');
location.reload();
```

---

## File Modifications Summary

| File | Section | Action |
|------|---------|--------|
| `index.html` | `<head>` | Add inline theme script (before `<style>`) |
| `index.html` | `<style>` | Add CSS variables |
| `index.html` | `<style>` | Replace hardcoded colors with variables |
| `index.html` | `<style>` | Add transition rules |
| `index.html` | `.toolbar` | Add theme toggle button |
| `index.html` | `<script>` | Add ThemeManager module |
| `index.html` | `<script>` | Add initialization and event handlers |

**Total Files Modified**: 1 (index.html)

---

## Estimated Timeline

| Step | Time | Cumulative |
|------|------|-----------|
| 1. Define CSS variables | 30 min | 30 min |
| 2. Update existing CSS | 45 min | 1h 15min |
| 3. Add toggle button | 15 min | 1h 30min |
| 4. Add blocking script | 10 min | 1h 40min |
| 5. Implement ThemeManager | 30 min | 2h 10min |
| 6. Keyboard shortcut | 5 min | 2h 15min |
| 7. Testing | 20 min | 2h 35min |

**Total**: ~2.5 hours for experienced developer

---

## Next Steps After Implementation

1. ✅ Test thoroughly across browsers
2. ✅ Verify WCAG contrast ratios (use WebAIM Contrast Checker)
3. ✅ Test with screen readers
4. ✅ Get user feedback on color choices
5. 📝 Update documentation
6. 🚀 Deploy to production

---

## Advanced: Using SVG Icons Instead of Emoji

If you prefer SVG icons over emoji:

```html
<button id="themeToggle">
  <span class="theme-icon">
    <svg id="sunIcon" viewBox="0 0 24 24" width="20" height="20" style="display: none;">
      <circle cx="12" cy="12" r="5" fill="currentColor"/>
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
      <!-- Add more sun rays -->
    </svg>
    <svg id="moonIcon" viewBox="0 0 24 24" width="20" height="20" style="display: none;">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
    </svg>
  </span>
</button>
```

```javascript
updateToggleButton(theme) {
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  
  if (theme === 'dark') {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'inline';
  } else {
    sunIcon.style.display = 'inline';
    moonIcon.style.display = 'none';
  }
}
```

---

## Support

For issues during implementation:
- Check console for errors
- Verify localStorage is enabled
- Test in latest browser version
- Review CSS variable definitions
- Ensure inline script executes before styles
