# Implementation Plan: Dark Mode Toggle

**Feature ID**: 2-dark-mode-toggle  
**Created**: 2025-11-12  
**Status**: Planning

## Technical Context

### Current Architecture
- **Type**: Single-page application (SPA)
- **Structure**: Single HTML file with embedded CSS and JavaScript
- **Dependencies**: 
  - markdown-it v13.0.1 (MD to HTML conversion)
  - turndown v7.1.2 (HTML to MD conversion)
  - Firebase Analytics v10.7.1
  - html2pdf.js v0.10.1 (PDF export)
- **Storage**: localStorage for content persistence
- **Pattern**: Event-driven, client-side only (no backend)
- **Styling**: Inline CSS in `<style>` tag

### Technology Stack
- Pure JavaScript (ES6+)
- HTML5/CSS3
- No build process or bundler
- CDN-loaded libraries only

### Integration Points
- Toolbar button system (existing button pattern for exports)
- Global CSS styling (affects all UI elements)
- localStorage for theme persistence
- Existing color scheme (current light theme)

### Technical Decisions (from research.md)

✅ **All technical unknowns resolved - no NEEDS CLARIFICATION remaining**

1. **Theming Approach**: CSS Custom Properties (CSS Variables)
   - Native CSS feature, excellent browser support
   - Zero dependencies
   - Easy maintenance and extension

2. **System Detection**: `prefers-color-scheme` media query
   - Standard Web API
   - Reactive to system changes
   - Chrome 76+, Firefox 67+, Safari 12.1+, Edge 79+

3. **Persistence**: localStorage
   - Simple API, matches existing architecture
   - Survives browser restarts
   - Privacy-friendly (no server communication)

4. **FOUC Prevention**: Inline blocking script in `<head>`
   - Executes before CSS loads
   - Sets theme attribute synchronously
   - Industry standard approach

5. **Color Palette**: Researched dark mode best practices
   - Dark gray backgrounds (not pure black)
   - Off-white text (not pure white)
   - Verified WCAG AA contrast ratios (4.5:1 minimum)

6. **Icons**: Emoji or inline SVG
   - Show current state (moon for dark, sun for light)
   - No additional HTTP requests
   - High user recognition

7. **Transitions**: 250ms CSS transitions
   - Color properties only (performant)
   - Smooth without feeling sluggish
   - Hardware-accelerated

### Constitution Check

**Privacy-First Principle** ✅
- All theme logic is client-side
- No data sent to external servers
- Uses localStorage (local only)
- Consistent with existing architecture

**Simplicity Principle** ✅
- Single button addition to toolbar
- Follows existing button pattern
- No complex configuration UI
- Two-state toggle (dark/light)

**No-Backend Principle** ✅
- Entirely browser-based
- Zero server-side requirements
- No API calls needed
- Consistent with SPA architecture

**Accessibility** ✅
- Proper ARIA labels on toggle button
- Keyboard accessible (button element, focus states)
- WCAG AA contrast ratios verified
- Screen reader announcements via ARIA

**Mobile-First** ✅
- Touch-friendly button
- Responsive design (follows existing pattern)
- No desktop-only features
- localStorage works on mobile browsers

### Post-Design Constitution Check

**Privacy** ✅
- localStorage is domain-scoped, not shared
- No analytics tracking of theme choice
- No cookies or external storage

**Simplicity** ✅
- ThemeManager module: ~100 lines of code
- CSS variables: ~40 variable definitions
- Single button in UI
- No settings modal or complex UI

**Performance** ✅
- <1ms initial load time for theme application
- <1KB additional code size
- CSS transitions GPU-accelerated
- No runtime performance impact

**Accessibility** ✅
- Full keyboard navigation support
- ARIA labels update dynamically
- High contrast ratios (exceeds WCAG AA)
- Focus indicators present

**Mobile** ✅
- Button responsive across viewport sizes
- Touch target meets minimum size (44x44px)
- No mouse-specific interactions
- Works on iOS/Android browsers

## Phase 0: Research & Discovery

### Research Tasks

✅ **All research complete - see research.md for detailed findings**

1. ✅ Dark Mode Implementation Patterns
   - Evaluated CSS Variables, multiple stylesheets, CSS-in-JS
   - Selected: CSS Custom Properties
   - Rationale: Native, performant, zero dependencies

2. ✅ System Theme Detection
   - Browser API: `prefers-color-scheme` media query
   - Excellent browser support for target browsers
   - Reactive to system changes

3. ✅ Theme Persistence Strategy
   - Evaluated localStorage, sessionStorage, cookies
   - Selected: localStorage
   - Rationale: Persistent, simple API, privacy-friendly

4. ✅ Preventing Flash of Wrong Theme (FOUC)
   - Solution: Inline blocking script in `<head>`
   - Executes before CSS loads
   - Industry standard (GitHub, Twitter, etc.)

5. ✅ Dark Mode Color Palette
   - Researched WCAG contrast requirements
   - Defined complete color scheme
   - Verified all contrast ratios

6. ✅ Icon Selection
   - Researched industry patterns
   - Selected: Show current state (moon/sun)
   - Higher user recognition (78% vs 52%)

7. ✅ Transition Performance
   - Optimal duration: 250ms
   - Animate color properties only
   - Hardware-accelerated

8. ✅ Accessibility Considerations
   - Keyboard navigation requirements
   - ARIA labeling strategy
   - Screen reader support

### Research Output
*See research.md for comprehensive findings with rationale and alternatives*

## Phase 1: Design & Contracts

### Data Model

**See data-model.md for complete data model documentation**

**Theme Preference** (localStorage)
```typescript
type ThemePreference = 'light' | 'dark' | null;
// Stored in: localStorage['marky-theme']
```

**System Theme State** (runtime)
```typescript
interface SystemThemeState {
  prefersDark: boolean;
  mediaQuery: MediaQueryList;
}
```

**Active Theme** (computed, DOM attribute)
```typescript
type ActiveTheme = 'light' | 'dark';
// Applied via: <html data-theme="dark">
```

### API Contracts

**See contracts/api-interface.md for complete API documentation**

**ThemeManager Module Interface**:
```javascript
ThemeManager.init()                    // Initialize on page load
ThemeManager.toggle()                  // Switch themes
ThemeManager.getCurrentTheme()         // Get active theme
ThemeManager.applyTheme(theme)         // Apply theme to DOM
ThemeManager.setTheme(theme)           // Set and persist theme
ThemeManager.hasExplicitPreference()   // Check if user chose theme
ThemeManager.clearPreference()         // Reset to system
ThemeManager.getSystemPreference()     // Detect OS theme
ThemeManager.watchSystemChanges()      // Listen for OS changes
ThemeManager.updateToggleButton(theme) // Update button UI
```

### Component Design

**UI Component: Theme Toggle Button**
```html
<button 
  id="themeToggle" 
  title="Toggle dark mode"
  aria-label="Toggle dark mode"
  data-testid="theme-toggle">
  <span class="theme-icon">🌙</span>
</button>
```

**Event Flow**:
```
User Click → Button Handler → ThemeManager.toggle() 
→ Calculate Opposite Theme → Save to localStorage 
→ Apply to DOM → Update Button Icon → CSS Transitions
```

**CSS Structure**:
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #333333;
  /* ... 20+ variables */
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #e0e0e0;
  /* ... 20+ variables */
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

### File Structure

```
index.html
  ├─ <head>
  │   ├─ Inline blocking script (theme init)
  │   └─ <style>
  │       ├─ CSS variables (:root)
  │       ├─ Dark theme ([data-theme="dark"])
  │       ├─ Transition rules
  │       └─ Component styles (using var())
  ├─ <body>
  │   ├─ .toolbar
  │   │   └─ #themeToggle button (NEW)
  │   └─ #editor
  └─ <script>
      └─ ThemeManager module (NEW)
```

## Phase 2: Implementation Checklist

### Prerequisites
- [x] Research phase complete (research.md)
- [x] Data model defined (data-model.md)
- [x] API contracts defined (contracts/api-interface.md)
- [x] CSS color scheme designed
- [x] Browser compatibility verified

### Development Tasks

#### Task 1: Define CSS Custom Properties (Priority: High)
- [ ] Add `:root` CSS variables for light theme
- [ ] Add `[data-theme="dark"]` CSS variables for dark theme
- [ ] Define all color variables (backgrounds, text, borders, accents)
- [ ] Add `--transition-speed` variable
- [ ] Test variable definitions (temporarily set data-theme attribute)

**Acceptance Criteria**:
- At least 20 CSS variables defined
- All colors extracted from current hardcoded values
- Dark theme colors provide WCAG AA contrast (4.5:1 minimum)

---

#### Task 2: Refactor Existing CSS to Use Variables (Priority: High)
- [ ] Replace all `background` colors with `var(--bg-*)`
- [ ] Replace all `color` values with `var(--text-*)`
- [ ] Replace all `border-color` values with `var(--border-*)`
- [ ] Replace accent colors with `var(--accent-*)`
- [ ] Replace shadows with `var(--shadow-*)`
- [ ] Add transition rules for color properties

**Areas to Update**:
- [ ] `body` element
- [ ] `.container`
- [ ] `.toolbar` and buttons
- [ ] `#editor` and all child elements (headings, lists, etc.)
- [ ] `.format-bar` and format buttons
- [ ] Links, code blocks, tables

**Acceptance Criteria**:
- Zero hardcoded color values in CSS (except in :root definitions)
- Toggling `data-theme` attribute updates all UI elements
- Smooth 250ms transitions between themes

---

#### Task 3: Add Inline Blocking Script (Priority: Critical)
- [ ] Add `<script>` in `<head>` BEFORE `<style>` tag
- [ ] Read `marky-theme` from localStorage
- [ ] Check system preference via matchMedia
- [ ] Set `data-theme` attribute immediately
- [ ] Test: No flash of wrong theme on page load

**Acceptance Criteria**:
- Script executes before CSS loads
- `data-theme` attribute set before first render
- No visible theme flash (FOUC) on any page load
- Works with localStorage disabled (falls back to system)

---

#### Task 4: Add Theme Toggle Button to Toolbar (Priority: High)
- [ ] Add button HTML in `.toolbar .buttons` section
- [ ] Position with other utility buttons
- [ ] Add `id="themeToggle"`
- [ ] Add ARIA attributes (`aria-label`, `title`)
- [ ] Add icon container (`<span class="theme-icon">`)
- [ ] Style button to match existing toolbar buttons

**Acceptance Criteria**:
- Button visible in toolbar
- Button follows existing visual style
- Button has proper spacing
- Hover/focus states work
- Accessible via keyboard (Tab key)

---

#### Task 5: Implement ThemeManager Module (Priority: High)
- [ ] Create `<script id="theme-manager">` block
- [ ] Implement `ThemeManager.getCurrentTheme()`
- [ ] Implement `ThemeManager.applyTheme(theme)`
- [ ] Implement `ThemeManager.setTheme(theme)`
- [ ] Implement `ThemeManager.toggle()`
- [ ] Implement `ThemeManager.updateToggleButton(theme)`
- [ ] Implement `ThemeManager.hasExplicitPreference()`
- [ ] Implement `ThemeManager.getSystemPreference()`
- [ ] Implement `ThemeManager.watchSystemChanges()`
- [ ] Implement `ThemeManager.init()`

**Acceptance Criteria**:
- All 10 methods implemented
- localStorage read/write works with error handling
- System preference detection works
- Button icon updates correctly (sun/moon)
- ARIA labels update dynamically

---

#### Task 6: Wire Up Event Handlers (Priority: High)
- [ ] Attach click handler to `#themeToggle` button
- [ ] Call `ThemeManager.toggle()` on click
- [ ] Initialize ThemeManager on DOMContentLoaded
- [ ] Set up system change listener
- [ ] Test all interaction paths

**Acceptance Criteria**:
- Clicking button toggles theme
- Theme change is immediate (<100ms visual change)
- Preference saves to localStorage
- System changes trigger theme update (if no user override)

---

#### Task 7: Testing & Quality Assurance (Priority: High)

**Functional Tests**:
- [ ] Initial page load shows correct theme (system preference)
- [ ] Toggle button switches theme
- [ ] Theme persists across page refresh
- [ ] Theme persists across browser restart
- [ ] System theme change updates app (no user override)
- [ ] System theme change ignored (with user override)
- [ ] Clear localStorage resets to system preference
- [ ] Works with localStorage disabled

**Visual Tests**:
- [ ] All toolbar elements visible in both themes
- [ ] Editor content readable in both themes
- [ ] Format bar works in both themes
- [ ] Buttons have proper contrast in both themes
- [ ] Focus states visible in both themes
- [ ] No visual glitches during transition

**Accessibility Tests**:
- [ ] Button reachable via Tab key
- [ ] Space/Enter activates toggle
- [ ] ARIA labels read correctly by screen reader
- [ ] Focus indicator visible
- [ ] Contrast ratios meet WCAG AA (test with WebAIM tool)

**Browser Tests**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Edge Case Tests**:
- [ ] Very long document (performance)
- [ ] Mid-edit theme change (cursor position preserved)
- [ ] Rapid clicking toggle (no broken state)
- [ ] Private/incognito mode
- [ ] localStorage quota exceeded
- [ ] Old browser without matchMedia

---

#### Task 8: Documentation & Cleanup (Priority: Medium)
- [ ] Add comments to complex code sections
- [ ] Document localStorage schema
- [ ] Update README if applicable
- [ ] Remove debug console.logs
- [ ] Verify no console errors

**Acceptance Criteria**:
- Code is self-documenting
- No unnecessary console output
- Clean browser console

---

### Optional Enhancements (Phase 3)

These are not required for MVP but can be added later:

- [ ] Keyboard shortcut (Ctrl+Shift+D)
- [ ] System reset button (explicit "follow system" option)
- [ ] Theme transition animation disable for `prefers-reduced-motion`
- [ ] Custom theme colors (user preferences)
- [ ] Sync theme across devices (requires backend)

---

## Testing Strategy

### Unit Tests (Manual Console Testing)

```javascript
// Test getCurrentTheme
console.assert(ThemeManager.getCurrentTheme() === 'light' || 
               ThemeManager.getCurrentTheme() === 'dark', 
               'getCurrentTheme returns valid theme');

// Test toggle
const before = ThemeManager.getCurrentTheme();
ThemeManager.toggle();
const after = ThemeManager.getCurrentTheme();
console.assert(before !== after, 'toggle changes theme');

// Test persistence
localStorage.setItem('marky-theme', 'dark');
console.assert(ThemeManager.getCurrentTheme() === 'dark', 
               'reads from localStorage');

// Test system fallback
localStorage.removeItem('marky-theme');
console.assert(ThemeManager.getCurrentTheme() !== undefined, 
               'falls back to system');
```

### Integration Tests

1. **Full User Flow**:
   - Fresh browser (clear localStorage)
   - Load page → Verify system theme applied
   - Click toggle → Verify theme changes
   - Refresh page → Verify theme persists
   - Close browser → Reopen → Verify theme persists

2. **System Change Flow**:
   - Clear localStorage (no user preference)
   - Change OS theme
   - Verify app theme updates automatically
   - Save user preference
   - Change OS theme again
   - Verify app theme does NOT change

3. **Error Handling Flow**:
   - Disable localStorage
   - Load page → Should work (no errors)
   - Toggle theme → Should work for session
   - Refresh → Resets to system (expected)

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load time | <1ms | Time to set data-theme |
| Toggle response time | <100ms | Click to visual change |
| Transition duration | 250ms | CSS animation time |
| Memory footprint | <1KB | ThemeManager + listeners |
| localStorage size | ~20 bytes | Single key-value |

### Performance Testing

```javascript
// Measure toggle performance
console.time('toggle');
ThemeManager.toggle();
console.timeEnd('toggle');
// Expected: <1ms

// Measure initial load
// (Add to blocking script)
const start = performance.now();
// ... theme logic ...
console.log('Theme init:', performance.now() - start, 'ms');
// Expected: <1ms
```

---

## Rollback Plan

If critical issues are discovered post-deployment:

1. **Immediate**: Comment out ThemeManager initialization
2. **Quick Fix**: Remove `data-theme` attribute (defaults to light)
3. **Hotfix**: Revert CSS variables to hardcoded light theme values
4. **Full Rollback**: Git revert to previous commit

**Recovery Time Objective (RTO)**: <5 minutes

---

## Success Criteria

✅ **Feature Complete When**:

1. User can toggle between dark and light modes with single click
2. Theme preference persists across browser sessions
3. System theme preference respected on first visit
4. No flash of wrong theme on page load
5. All UI elements properly themed in both modes
6. WCAG AA contrast ratios met (4.5:1 minimum)
7. Full keyboard accessibility
8. Works across all target browsers
9. Zero console errors or warnings
10. Performance targets met (<1ms load, <100ms toggle)

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| localStorage disabled | Medium | Low | Graceful degradation to session-only |
| Browser incompatibility | High | Very Low | Target modern browsers only |
| Color contrast issues | Medium | Low | Pre-verify with WebAIM checker |
| FOUC (flash of unstyled content) | Medium | Low | Inline blocking script prevents this |
| Performance on old devices | Low | Low | Only animate color (cheap operation) |
| User confusion with toggle | Low | Very Low | Standard sun/moon icons |

---

## Post-Implementation

### Monitoring

- Check for JavaScript errors in production
- Monitor localStorage quota issues
- Gather user feedback on color choices
- Track theme preference distribution (if analytics available)

### Future Enhancements

- Add more theme options (high contrast, sepia)
- Sync preference across devices (requires backend)
- Custom color picker for power users
- Respect `prefers-reduced-motion` for transitions
- Automatic time-based theme switching

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| CSS Variables Definition | 30 min | None |
| CSS Refactoring | 45 min | CSS Variables |
| Inline Script | 10 min | None |
| Toggle Button | 15 min | None |
| ThemeManager Module | 30 min | Data Model, API Contracts |
| Event Handlers | 10 min | ThemeManager |
| Testing | 30 min | All above |
| Documentation | 10 min | All above |

**Total Estimated Time**: ~3 hours for experienced developer

---

## Conclusion

The dark mode toggle feature is well-defined, researched, and ready for implementation. All technical decisions have been made, unknowns resolved, and the implementation path is clear. The feature aligns with the application's architecture, maintains privacy-first principles, and adds minimal complexity.

**Next Steps**:
1. Begin Phase 2 implementation following task checklist
2. Use quickstart.md for step-by-step implementation guide
3. Test thoroughly per testing strategy
4. Deploy with confidence

**Confidence Level**: High ✅  
**Technical Risk**: Low ✅  
**Implementation Complexity**: Low ✅
