# Research Document: GitHub Integration Feature

**Feature ID**: 3-github-integration  
**Research Date**: 2025-11-12  
**Status**: Complete

## Executive Summary

After researching GitHub API integration patterns for browser-based applications, **OAuth 2.0 Device Flow with Octokit.js** is the recommended approach for authentication, combined with **GitHub REST API v3** for repository operations. The bottom action bar will use **CSS Grid/Flexbox with slide-up animation** for optimal UX.

## Research Task 1: GitHub OAuth Authentication Patterns

### Approach Comparison

#### 1. OAuth 2.0 Web Application Flow (Authorization Code) - **RECOMMENDED**

**Implementation**:
```javascript
// Redirect to GitHub OAuth
const CLIENT_ID = 'your_github_app_client_id';
const REDIRECT_URI = 'https://your-app.com/callback';
const SCOPE = 'repo user:email';

window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`;

// Handle callback (exchange code for token via backend proxy or GitHub App)
```

**Pros**:
- ✅ Standard OAuth 2.0 flow
- ✅ Widely documented and supported
- ✅ Works well for web applications
- ✅ Secure token exchange
- ✅ Long-lived access tokens

**Cons**:
- ⚠️ Requires backend proxy to hide client secret (or use GitHub App)
- ⚠️ Redirect-based flow (interrupts user experience)

**Browser Support**: All modern browsers

#### 2. OAuth 2.0 Device Flow

**Pros**:
- ✅ No client secret needed
- ✅ Good for limited-input devices

**Cons**:
- ❌ Poor UX (requires code entry)
- ❌ Not suitable for web apps
- ❌ Additional complexity

#### 3. Personal Access Tokens (PAT)

**Pros**:
- ✅ Simple implementation
- ✅ No OAuth flow needed

**Cons**:
- ❌ Poor UX (user must manually create token)
- ❌ Security risk (user may over-scope token)
- ❌ Not suitable for end-user applications

### Decision: OAuth 2.0 Web Application Flow via GitHub App

**Rationale**:
- Standard, secure authentication method
- Best UX for web applications
- GitHub Apps can be configured without client secret exposure
- Aligns with industry best practices (VS Code GitHub integration, GitHub Codespaces)

**Implementation Strategy**:
- Use GitHub App (not OAuth App) to avoid client secret in frontend
- Redirect to GitHub for authorization
- Exchange code for access token via GitHub API
- Store token securely in sessionStorage (scoped to session)

**Alternatives Considered**:
- Device Flow: Rejected due to poor UX
- PAT: Rejected due to security and UX concerns
- Backend proxy: Possible but adds complexity; GitHub App preferred

## Research Task 2: GitHub API Client Libraries

### Library Comparison

#### 1. Octokit.js (@octokit/rest) - **RECOMMENDED**

**Implementation**:
```javascript
import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

const octokit = new Octokit({
  auth: accessToken
});

// Fetch repository contents
const { data } = await octokit.repos.getContent({
  owner: 'Tommertom',
  repo: 'marky',
  path: 'README.md',
  ref: 'main'
});
```

**Pros**:
- ✅ Official GitHub SDK
- ✅ TypeScript support
- ✅ Complete API coverage
- ✅ Automatic pagination
- ✅ Rate limit handling
- ✅ Well-documented
- ✅ Active maintenance

**Cons**:
- ⚠️ ~50KB gzipped (acceptable for feature richness)

**CDN Options**: Skypack, jsDelivr, unpkg

#### 2. Raw Fetch API

**Pros**:
- ✅ Zero dependencies
- ✅ Full control

**Cons**:
- ❌ Manual error handling
- ❌ No pagination helpers
- ❌ No rate limit handling
- ❌ More code to maintain
- ❌ Higher error risk

#### 3. Axios + Manual GitHub API

**Pros**:
- ✅ Familiar API
- ✅ Good error handling

**Cons**:
- ❌ Additional dependency
- ❌ No GitHub-specific helpers
- ❌ Smaller than Octokit but still ~15KB

### Decision: Octokit.js via CDN

**Rationale**:
- Official SDK reduces implementation errors
- Handles edge cases (pagination, rate limits, API versioning)
- Excellent documentation and community support
- Aligns with GitHub's recommended practices
- Acceptable bundle size for feature completeness

**CDN Loading**:
```html
<script type="module">
  import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
  // Use Octokit
</script>
```

**Alternatives Considered**:
- Fetch API: Rejected due to maintenance burden
- Axios: Rejected as Octokit provides GitHub-specific features

## Research Task 3: Bottom Action Bar UI Pattern

### Design Pattern Comparison

#### 1. Slide-up Action Bar (Bottom Sheet) - **RECOMMENDED**

**Implementation**:
```css
.github-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-toolbar);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  z-index: 1000;
}

.github-action-bar.visible {
  transform: translateY(0);
}
```

**Pros**:
- ✅ Mobile-friendly (bottom sheet pattern)
- ✅ Doesn't obstruct content when hidden
- ✅ Smooth animation
- ✅ Familiar UX (Google apps, Material Design)
- ✅ Easy to dismiss

**Cons**:
- ⚠️ May overlap footer content (use padding or overlay approach)

#### 2. Fixed Toolbar Extension

**Pros**:
- ✅ Always visible
- ✅ Simple implementation

**Cons**:
- ❌ Takes permanent screen space
- ❌ Clutters UI when not in use
- ❌ Poor mobile experience

#### 3. Modal Dialog

**Pros**:
- ✅ Focused interaction
- ✅ Clear context

**Cons**:
- ❌ Blocks entire UI
- ❌ Disrupts workflow
- ❌ Multiple modals needed for steps

### Decision: Slide-up Action Bar (Bottom Sheet)

**Rationale**:
- Modern, mobile-first UX pattern
- Non-intrusive when not in use
- Keeps GitHub features accessible but separated
- Aligns with Material Design guidelines
- Similar to VS Code bottom panel

**Animation**: cubic-bezier(0.4, 0.0, 0.2, 1) - Material Design standard easing

**Alternatives Considered**:
- Fixed toolbar: Rejected due to clutter
- Modal: Rejected due to workflow disruption

## Research Task 4: Session State Management

### Storage Comparison

#### 1. sessionStorage - **RECOMMENDED**

**Implementation**:
```javascript
const sessionState = {
  repository: 'owner/repo',
  branch: 'main',
  filePath: 'README.md',
  fileSHA: 'abc123',
  prNumber: 42,
  prBranch: 'marky-edit-readme-1699999999'
};

sessionStorage.setItem('marky-github-session', JSON.stringify(sessionState));
```

**Pros**:
- ✅ Tab-scoped (each tab has independent session)
- ✅ Cleared on tab close (prevents stale sessions)
- ✅ Simple API
- ✅ No expiration management needed

**Cons**:
- ⚠️ Lost on page refresh (acceptable for this use case)

#### 2. localStorage

**Pros**:
- ✅ Persistent across sessions
- ✅ Simple API

**Cons**:
- ❌ Stale session data across days
- ❌ Security concern (long-lived tokens)
- ❌ Tab independence lost

#### 3. In-memory JavaScript Object

**Pros**:
- ✅ Fastest access
- ✅ No serialization

**Cons**:
- ❌ Lost on page refresh
- ❌ Cannot survive navigation
- ❌ Harder to debug

### Decision: sessionStorage for Session State, localStorage for OAuth Token

**Rationale**:
- sessionStorage for session state (repository, PR, file) - cleared on tab close
- localStorage for OAuth token - persistent across sessions but with expiration check
- Tab independence prevents confusion with multiple files/repos
- Automatic cleanup on browser close

**Token Storage Pattern**:
```javascript
const tokenData = {
  token: 'ghp_...',
  expiresAt: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
  username: 'octocat'
};
localStorage.setItem('marky-github-auth', JSON.stringify(tokenData));
```

**Alternatives Considered**:
- All in-memory: Rejected due to page refresh loss
- All localStorage: Rejected due to stale session concerns

## Research Task 5: GitHub API Operations

### Required API Endpoints

#### 1. Authentication
- **Endpoint**: `https://github.com/login/oauth/authorize`
- **Method**: Redirect
- **Scopes**: `repo`, `user:email`

#### 2. Get Repository Contents (File List)
- **Endpoint**: `GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1`
- **Purpose**: Fetch all files in repository
- **Octokit Method**: `octokit.git.getTree()`
- **Filter**: Client-side filter for `.md` and `.markdown` files

#### 3. Get File Content
- **Endpoint**: `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}`
- **Purpose**: Fetch markdown file content
- **Octokit Method**: `octokit.repos.getContent()`
- **Response**: Base64-encoded content + SHA

#### 4. Create Branch
- **Endpoint**: `POST /repos/{owner}/{repo}/git/refs`
- **Purpose**: Create PR branch from base branch
- **Octokit Method**: `octokit.git.createRef()`

#### 5. Create/Update File (Commit)
- **Endpoint**: `PUT /repos/{owner}/{repo}/contents/{path}`
- **Purpose**: Commit file changes
- **Octokit Method**: `octokit.repos.createOrUpdateFileContents()`
- **Requires**: File SHA, commit message, branch

#### 6. Create Pull Request
- **Endpoint**: `POST /repos/{owner}/{repo}/pulls`
- **Purpose**: Create PR from PR branch to base branch
- **Octokit Method**: `octokit.pulls.create()`

#### 7. Merge Pull Request
- **Endpoint**: `PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge`
- **Purpose**: Merge PR
- **Octokit Method**: `octokit.pulls.merge()`
- **Options**: merge_method (merge, squash, rebase)

#### 8. Close Pull Request (Discard)
- **Endpoint**: `PATCH /repos/{owner}/{repo}/pulls/{pull_number}`
- **Purpose**: Close PR without merging
- **Octokit Method**: `octokit.pulls.update({ state: 'closed' })`

#### 9. Delete Branch
- **Endpoint**: `DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}`
- **Purpose**: Cleanup PR branch after merge/close
- **Octokit Method**: `octokit.git.deleteRef()`

### Rate Limiting Strategy

**Limits**: 5,000 requests/hour for authenticated users

**Mitigation**:
- Cache repository file lists (invalidate on file selection change)
- Monitor `X-RateLimit-Remaining` header
- Warn user at 100 requests remaining
- Implement exponential backoff for 429 responses

**Octokit Support**:
```javascript
// Automatic rate limit handling
octokit.hook.error('request', async (error, options) => {
  if (error.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    // Implement backoff
  }
});
```

## Research Task 6: Security Best Practices

### OAuth Token Security

**Storage**:
- ✅ Use localStorage/sessionStorage (not cookies to avoid CSRF)
- ✅ Never log tokens to console
- ✅ Never include in URLs or analytics
- ✅ Clear on logout/disconnect

**Transmission**:
- ✅ HTTPS only (enforced by OAuth redirect URI requirements)
- ✅ Use Authorization header (not URL parameters)

**Scopes**:
- ✅ Request minimum necessary scopes (`repo`, `user:email`)
- ⚠️ `repo` scope is broad but required for private repos

**Token Expiration**:
- GitHub OAuth tokens don't expire by default
- Implement client-side expiration (8 hours recommended)
- Re-authenticate on 401 Unauthorized

### Content Security

**Markdown Sanitization**:
- Files loaded from GitHub are trusted (user's own repos)
- Already using DOMPurify for HTML sanitization (from PDF feature)
- Apply same sanitization to GitHub-loaded content

**XSS Prevention**:
- Base64 decode GitHub API responses securely
- Use textContent where possible
- Sanitize before innerHTML

## Research Task 7: Error Handling Patterns

### Error Categories

#### 1. Authentication Errors (401)
- **Cause**: Token expired, invalid, or revoked
- **Response**: Prompt re-authentication, preserve unsaved edits
- **UI**: "Your GitHub session has expired. Please reconnect."

#### 2. Permission Errors (403)
- **Cause**: No write access, branch protection, rate limit
- **Response**: Check specific error message, provide guidance
- **UI**: "You don't have permission to edit this repository."

#### 3. Not Found Errors (404)
- **Cause**: Repository, file, or PR doesn't exist
- **Response**: Clear invalid session state
- **UI**: "File or repository not found."

#### 4. Conflict Errors (409)
- **Cause**: Merge conflicts, file changed
- **Response**: Provide PR link for manual resolution
- **UI**: "This PR has merge conflicts. Resolve on GitHub: [link]"

#### 5. Network Errors
- **Cause**: Offline, timeout, DNS failure
- **Response**: Retry option, preserve state
- **UI**: "Network error. Check connection and retry."

### Error Handling Pattern

```javascript
async function safeGitHubAPICall(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.status === 401) {
      // Re-authenticate
      return handleAuthExpired();
    } else if (error.status === 403) {
      // Check if rate limit or permission
      if (error.message.includes('rate limit')) {
        return handleRateLimit(error);
      } else {
        return handlePermissionError(error);
      }
    } else if (error.status === 404) {
      return handleNotFound(error);
    } else if (error.status === 409) {
      return handleConflict(error);
    } else {
      return handleGenericError(error);
    }
  }
}
```

## Research Task 8: Mobile Responsiveness

### Bottom Action Bar on Mobile

**Layout Strategy**:
- Stack buttons vertically on screens < 768px
- Full-width file path display
- Touch-friendly button sizing (min 44x44px)
- Swipe-down gesture to dismiss (nice-to-have)

**CSS Grid Pattern**:
```css
.github-action-bar .controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  padding: 1rem;
}

@media (max-width: 768px) {
  .github-action-bar .controls {
    grid-template-columns: 1fr;
  }
}
```

**Viewport Considerations**:
- Action bar max-height: 40vh (prevent overwhelming small screens)
- Scrollable content if needed
- Backdrop overlay on mobile to focus attention

## Summary of Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Authentication** | OAuth 2.0 via GitHub App | Standard, secure, good UX |
| **API Client** | Octokit.js | Official SDK, handles edge cases |
| **UI Pattern** | Slide-up action bar | Mobile-friendly, non-intrusive |
| **Session Storage** | sessionStorage | Tab-scoped, auto-cleanup |
| **Token Storage** | localStorage with expiration | Persistent but secure |
| **Error Handling** | Categorized with retry logic | Robust, user-friendly |
| **Mobile Design** | CSS Grid with stacking | Responsive, touch-friendly |
| **Security** | Token in Authorization header | Industry standard |

## Next Steps

1. ✅ Create data model for session state and API entities
2. ✅ Define API contracts in `/contracts/` directory
3. ✅ Generate implementation quickstart guide
4. ⏭️ Proceed to Phase 2: Implementation
