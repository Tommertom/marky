# Implementation Plan: GitHub Integration

**Feature ID**: 3-github-integration  
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
- **Storage**: localStorage for content persistence, theme preference
- **Pattern**: Event-driven, client-side only (no backend)
- **Styling**: Inline CSS in `<style>` tag with CSS custom properties
- **Hosting**: Firebase Hosting (HTTPS enabled)

### Technology Stack
- Pure JavaScript (ES6+ with modules)
- HTML5/CSS3
- No build process or bundler
- CDN-loaded libraries only

### Integration Points
- Toolbar button system (existing GitHub logo button)
- Bottom of page (new action bar)
- localStorage/sessionStorage for state management
- Existing editor content management

### Technical Decisions (from research.md)

✅ **All technical unknowns resolved - no NEEDS CLARIFICATION remaining**

1. **Authentication Method**: OAuth 2.0 Web Application Flow via GitHub App
   - Standard, secure authentication
   - No client secret exposure (GitHub App pattern)
   - Best UX for web applications

2. **API Client Library**: Octokit.js (@octokit/rest)
   - Official GitHub SDK
   - Complete API coverage with error handling
   - CDN available via Skypack

3. **UI Pattern**: Slide-up Bottom Action Bar
   - Mobile-friendly bottom sheet pattern
   - Non-intrusive when hidden
   - Material Design standard easing

4. **Session Management**: sessionStorage for session, localStorage for token
   - Tab-scoped sessions (sessionStorage)
   - Persistent auth (localStorage with expiration)
   - Auto-cleanup on browser close

5. **State Storage**: JSON serialization in Web Storage API
   - Simple, browser-native
   - Matches existing architecture

6. **Error Handling**: Categorized errors with retry logic
   - 401: Re-authenticate
   - 403: Check permissions/rate limit
   - 404: Clear invalid state
   - 409: Show conflict resolution
   - Network: Retry with preserved state

7. **Mobile Design**: CSS Grid with responsive stacking
   - Vertical button stacking on mobile
   - Touch-friendly sizing (44x44px minimum)
   - Swipe gestures (nice-to-have)

### Constitution Check

**Privacy-First Principle** ✅
- OAuth token stored locally (no server transmission)
- Session data in browser only
- No tracking or analytics of GitHub activity
- User controls authentication state

**Simplicity Principle** ✅
- Single action bar for all GitHub features
- Clear linear workflow (connect → browse → edit → save → publish)
- No complex configuration UI
- Minimal UI changes to existing app

**No-Backend Principle** ⚠️ **PARTIAL**
- OAuth code exchange requires client-side handling
- GitHub App pattern allows public client ID
- All API calls direct to GitHub (no proxy server)
- **Trade-off accepted**: Using GitHub App (not OAuth App) to avoid backend

**Accessibility** ✅
- Keyboard navigation for all action bar controls
- ARIA labels on all buttons
- Clear focus indicators
- Screen reader friendly notifications

**Mobile-First** ✅
- Bottom sheet pattern (mobile standard)
- Touch-friendly buttons (min 44x44px)
- Responsive grid layout
- Swipe-down dismiss (optional enhancement)

### Post-Design Constitution Check

**Privacy** ✅
- OAuth token never logged or transmitted except to GitHub API
- Session data cleared on disconnect
- No cross-tab session sharing (security benefit)

**Simplicity** ✅
- Single action bar (estimated ~400 lines of code)
- 8 API operations mapped to 5 user actions
- No settings panel or configuration UI
- Inline notifications (no modals except repo browser)

**No-Backend** ✅ **ACHIEVED**
- GitHub App allows client-side OAuth without secret
- Direct API calls to GitHub (no proxy needed)
- Fully browser-based implementation

**Performance** ✅
- Octokit.js ~50KB gzipped (acceptable for feature richness)
- Lazy loading (only loads when action bar opened)
- Rate limit monitoring prevents excessive API calls
- Session caching reduces repeated API calls

**Accessibility** ✅
- All buttons keyboard accessible
- ARIA live regions for notifications
- Focus management in action bar
- High contrast maintained in both themes

**Mobile** ✅
- Bottom sheet slides smoothly on mobile
- Responsive button layout (stacks vertically)
- Touch target sizes meet WCAG standards
- Action bar max-height prevents viewport overflow

## Phase 0: Research & Discovery

### Research Tasks

✅ **All research complete - see research.md for detailed findings**

1. ✅ OAuth Authentication Patterns
   - Evaluated OAuth 2.0 flows, Device Flow, PAT
   - Selected: OAuth 2.0 Web Application Flow via GitHub App
   - Rationale: Standard, secure, good UX

2. ✅ GitHub API Client Libraries
   - Evaluated Octokit.js, raw Fetch, Axios
   - Selected: Octokit.js via CDN
   - Rationale: Official SDK, handles edge cases, well-documented

3. ✅ Bottom Action Bar UI Pattern
   - Evaluated slide-up, fixed toolbar, modal
   - Selected: Slide-up action bar (bottom sheet)
   - Rationale: Mobile-friendly, non-intrusive, modern UX

4. ✅ Session State Management
   - Evaluated sessionStorage, localStorage, in-memory
   - Selected: sessionStorage for session, localStorage for token
   - Rationale: Tab-scoped, auto-cleanup, persistent auth

5. ✅ GitHub API Operations
   - Mapped 14 API endpoints to feature requirements
   - Defined request/response schemas
   - Documented error handling patterns

6. ✅ Security Best Practices
   - OAuth token security (storage, transmission)
   - Content sanitization (markdown from GitHub)
   - XSS prevention (Base64 decoding, innerHTML)

7. ✅ Error Handling Patterns
   - Categorized errors (auth, permission, not found, conflict, network)
   - Defined user-friendly messages
   - Retry strategies for transient failures

8. ✅ Mobile Responsiveness
   - CSS Grid layout strategy
   - Touch-friendly button sizing
   - Viewport height constraints

### Research Output
*See research.md for comprehensive findings with rationale and alternatives*

## Phase 1: Design & Contracts

### Data Model

**See data-model.md for complete data model documentation**

**GitHub Authentication State** (localStorage)
```typescript
interface GitHubAuthState {
  token: string;
  expiresAt: number;
  username: string;
  userId: number;
  avatarUrl?: string;
  scopes: string[];
}
```

**GitHub Session State** (sessionStorage)
```typescript
interface GitHubSession {
  repository: {
    owner: string;
    name: string;
    fullName: string;
    defaultBranch: string;
  } | null;
  baseBranch: string | null;
  file: {
    path: string;
    sha: string;
    content: string;
    encoding: 'base64' | 'utf-8';
  } | null;
  pullRequest: {
    number: number;
    branch: string;
    url: string;
    state: 'open' | 'closed' | 'merged';
    mergeable: boolean | null;
    createdAt: number;
  } | null;
  lastSaved: number | null;
  isDirty: boolean;
}
```

**Action Bar UI State** (in-memory)
```typescript
interface ActionBarState {
  isVisible: boolean;
  isLoading: boolean;
  currentView: 'connect' | 'browse' | 'editing' | 'error';
  notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    action?: { label: string; url: string; };
    timeout?: number;
  } | null;
}
```

### API Contracts

**See contracts/api-interface.md for complete API documentation**

**Key API Operations**:
1. OAuth Authorization → `GET /login/oauth/authorize`
2. Token Exchange → `POST /login/oauth/access_token`
3. Get User → `GET /user`
4. Get Repository → `GET /repos/{owner}/{repo}`
5. List Branches → `GET /repos/{owner}/{repo}/branches`
6. Get File Tree → `GET /repos/{owner}/{repo}/git/trees/{sha}`
7. Get File Content → `GET /repos/{owner}/{repo}/contents/{path}`
8. Create Branch → `POST /repos/{owner}/{repo}/git/refs`
9. Commit File → `PUT /repos/{owner}/{repo}/contents/{path}`
10. Create PR → `POST /repos/{owner}/{repo}/pulls`
11. Get PR Status → `GET /repos/{owner}/{repo}/pulls/{number}`
12. Merge PR → `PUT /repos/{owner}/{repo}/pulls/{number}/merge`
13. Close PR → `PATCH /repos/{owner}/{repo}/pulls/{number}`
14. Delete Branch → `DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}`

### Component Design

**UI Component: Bottom Action Bar**
```html
<div id="githubActionBar" class="github-action-bar">
  <div class="action-bar-content">
    <div class="connection-status">
      <span class="status-text">Not connected</span>
    </div>
    <div class="file-info" style="display: none;">
      <span class="file-path"></span>
    </div>
    <div class="action-buttons">
      <!-- Dynamic buttons based on state -->
    </div>
    <div class="notification-area"></div>
    <button class="close-bar-btn">&times;</button>
  </div>
</div>
```

**Event Flow (Save)**:
```
User Click "Save to GitHub"
  ↓
Check if PR exists in session
  ↓ NO
Create branch → Commit → Create PR → Store PR in session
  ↓ YES
Commit to existing PR branch
  ↓
Update UI with PR link
  ↓
Enable "Publish" button
```

**CSS Structure**:
```css
.github-action-bar {
  position: fixed;
  bottom: 0;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.github-action-bar.visible {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
}
```

### File Structure

```
index.html
  ├─ <head>
  │   ├─ Existing theme init script
  │   └─ <style>
  │       ├─ Existing CSS variables
  │       └─ GitHub action bar styles (NEW)
  ├─ <body>
  │   ├─ .toolbar
  │   │   └─ #githubBtn (existing)
  │   ├─ #formatBar (existing)
  │   ├─ #editor (existing)
  │   └─ #githubActionBar (NEW)
  └─ <script>
      ├─ Existing app scripts
      └─ <script type="module" id="github-integration"> (NEW)
          └─ Import Octokit.js
          └─ GitHub integration logic
```

## Phase 2: Implementation Checklist

### Prerequisites
- [x] Research phase complete (research.md)
- [x] Data model defined (data-model.md)
- [x] API contracts defined (contracts/api-interface.md)
- [x] GitHub App registered (see quickstart.md)
- [x] HTTPS hosting verified (Firebase Hosting)
- [x] Browser compatibility verified

### Development Tasks

#### Task 1: Bottom Action Bar UI (Priority: High)
- [ ] Add HTML structure for action bar
- [ ] Add CSS for slide-up animation
- [ ] Add JavaScript to toggle on GitHub logo click
- [ ] Test animation smoothness
- [ ] Test responsive design on mobile
- [ ] Verify doesn't obstruct editor content

**Estimated Time**: 2-3 hours

#### Task 2: Octokit.js Integration (Priority: High)
- [ ] Add Octokit.js CDN import (Skypack)
- [ ] Create Octokit instance on authentication
- [ ] Test API connectivity
- [ ] Implement rate limit monitoring

**Estimated Time**: 1 hour

#### Task 3: OAuth Authentication (Priority: High)
- [ ] Implement OAuth redirect on "Connect" button
- [ ] Handle OAuth callback (code exchange)
- [ ] Store auth state in localStorage
- [ ] Fetch and display user info
- [ ] Update UI to show connected state
- [ ] Implement disconnect functionality
- [ ] Handle token expiration

**Estimated Time**: 3-4 hours

#### Task 4: Repository Browser (Priority: High)
- [ ] Create repository input/selection UI
- [ ] Validate repository name format
- [ ] Fetch repository metadata
- [ ] Check write permissions
- [ ] Fetch and display branches
- [ ] Select default branch

**Estimated Time**: 3-4 hours

#### Task 5: File Browser (Priority: High)
- [ ] Fetch repository file tree
- [ ] Filter for markdown files
- [ ] Display file list in action bar
- [ ] Implement file search/filter
- [ ] Handle file selection

**Estimated Time**: 2-3 hours

#### Task 6: File Loading (Priority: High)
- [ ] Fetch file content via API
- [ ] Decode Base64 content
- [ ] Convert markdown to HTML
- [ ] Load into existing editor
- [ ] Store file metadata (SHA, path) in session
- [ ] Display file path in action bar
- [ ] Handle large files (warn if > 500KB)

**Estimated Time**: 2-3 hours

#### Task 7: Save to GitHub (Create/Update PR) (Priority: High)
- [ ] Add "Save to GitHub" button
- [ ] Implement first save workflow:
  - [ ] Create branch from base
  - [ ] Commit file changes
  - [ ] Create pull request
  - [ ] Store PR info in session
- [ ] Implement subsequent save workflow:
  - [ ] Commit to existing PR branch
- [ ] Display success notification with PR link
- [ ] Enable "Publish" button after PR created
- [ ] Handle commit errors

**Estimated Time**: 4-5 hours

#### Task 8: Publish (Merge PR) (Priority: High)
- [ ] Add "Publish" button (disabled initially)
- [ ] Check PR mergeable status
- [ ] Handle merge conflicts (show link to GitHub)
- [ ] Merge PR via API
- [ ] Delete PR branch
- [ ] Clear session state
- [ ] Display success message

**Estimated Time**: 2-3 hours

#### Task 9: Discard PR (Priority: Medium)
- [ ] Add "Discard" button (visible when PR exists)
- [ ] Show confirmation prompt
- [ ] Close PR via API
- [ ] Delete PR branch (optional)
- [ ] Clear session state
- [ ] Update UI

**Estimated Time**: 1-2 hours

#### Task 10: Error Handling (Priority: High)
- [ ] Implement notification system in action bar
- [ ] Handle authentication errors (401)
- [ ] Handle permission errors (403)
- [ ] Handle not found errors (404)
- [ ] Handle conflict errors (409)
- [ ] Handle rate limit errors (429)
- [ ] Handle network errors
- [ ] Add retry logic for transient failures
- [ ] Preserve user edits during errors

**Estimated Time**: 3-4 hours

#### Task 11: Session State Management (Priority: High)
- [ ] Load session state on page load
- [ ] Save session state on changes
- [ ] Clear session on disconnect
- [ ] Clear session on publish/discard
- [ ] Handle session across page refreshes
- [ ] Handle invalid/stale session data

**Estimated Time**: 2 hours

#### Task 12: Mobile Responsiveness (Priority: Medium)
- [ ] Test action bar on mobile devices
- [ ] Verify touch target sizes (44x44px min)
- [ ] Test vertical button stacking
- [ ] Test file path display on small screens
- [ ] Test action bar max-height on mobile
- [ ] Test landscape/portrait orientations

**Estimated Time**: 2-3 hours

#### Task 13: Loading Indicators (Priority: Medium)
- [ ] Add loading spinner/indicator
- [ ] Show during API calls
- [ ] Disable buttons during operations
- [ ] Provide visual feedback

**Estimated Time**: 1-2 hours

#### Task 14: Documentation & Comments (Priority: Low)
- [ ] Add inline code comments
- [ ] Document GitHub App setup in README
- [ ] Document OAuth configuration
- [ ] Add troubleshooting guide

**Estimated Time**: 1-2 hours

### Testing Tasks

#### Unit Testing (Manual)
- [ ] Test OAuth flow (connect, disconnect, reconnect)
- [ ] Test repository selection (valid/invalid repos)
- [ ] Test file loading (small, large, missing files)
- [ ] Test save workflow (first save, subsequent saves)
- [ ] Test publish workflow (clean merge, conflicts)
- [ ] Test discard workflow
- [ ] Test all error scenarios

#### Integration Testing
- [ ] Test full workflow (end-to-end)
- [ ] Test with multiple repositories
- [ ] Test with different file types
- [ ] Test with private repositories
- [ ] Test with organization repositories
- [ ] Test across browser restarts
- [ ] Test token expiration

#### Browser Compatibility
- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on Edge (latest)
- [ ] Test on mobile Safari (iOS)
- [ ] Test on mobile Chrome (Android)

#### Performance Testing
- [ ] Test with large files (approaching 1MB)
- [ ] Test with repositories with many files
- [ ] Monitor API rate limit usage
- [ ] Verify animation smoothness

### Deployment Tasks

#### Pre-Deployment
- [ ] GitHub App configured correctly
- [ ] Redirect URI matches production URL
- [ ] Client ID updated in code
- [ ] HTTPS hosting verified
- [ ] Content Security Policy allows GitHub API

#### Post-Deployment
- [ ] Test OAuth flow on production
- [ ] Verify API calls work from production domain
- [ ] Test on multiple devices
- [ ] Monitor for errors in production

## Phase 3: Deployment & Launch

### Deployment Steps

1. **Update GitHub App Configuration**
   - Set production URL as Homepage URL
   - Set production URL as Callback URL
   - Verify repository permissions

2. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```

3. **Verify Deployment**
   - Test OAuth redirect works
   - Test API calls succeed
   - Test full workflow

4. **Monitor Initial Usage**
   - Watch for OAuth errors
   - Watch for API rate limiting
   - Gather user feedback

### Rollback Plan

If critical issues arise:
1. Revert to previous Firebase Hosting deployment
2. Disable GitHub integration UI (hide action bar)
3. Fix issues in development
4. Re-deploy when stable

## Timeline Estimate

- **Phase 0 (Research)**: Complete ✅
- **Phase 1 (Design)**: Complete ✅
- **Phase 2 (Implementation)**: 21-29 hours (3-4 days full-time)
- **Phase 3 (Deployment)**: 2-3 hours

**Total Development Time**: 23-32 hours (4-5 days full-time)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OAuth configuration errors | Medium | High | Detailed setup guide in quickstart.md |
| API rate limiting | Low | Medium | Implement rate limit monitoring |
| Merge conflicts | High | Low | Clear user guidance to resolve on GitHub |
| Token expiration during session | Medium | Medium | Auto re-auth with state preservation |
| Mobile UX issues | Low | Medium | Thorough mobile testing |
| Large file performance | Medium | Low | File size warnings and limits |

## Success Metrics

- **Authentication Success Rate**: Target 95%+
- **File Load Time**: Target <3s for files <1MB
- **Save Success Rate**: Target 98%+
- **Merge Success Rate**: Target 95%+ (when mergeable)
- **User Satisfaction**: Positive feedback on UX

## Next Steps

1. ✅ Complete Phase 0 (Research)
2. ✅ Complete Phase 1 (Design & Contracts)
3. ⏭️ Begin Phase 2 (Implementation)
   - Start with Task 1 (Bottom Action Bar UI)
   - Follow quickstart.md for guidance
4. Deploy to staging environment for testing
5. Deploy to production

---

**Plan Status**: Ready for Implementation  
**Last Updated**: 2025-11-12  
**Next Review**: After Task 3 (OAuth) completion
