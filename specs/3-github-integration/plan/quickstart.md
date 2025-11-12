# Implementation Quickstart: GitHub Integration

**Feature ID**: 3-github-integration  
**Created**: 2025-11-12  
**For**: Developers implementing this feature

## Prerequisites

Before starting implementation, ensure you have:

1. ✅ Read `spec.md` - Understand user requirements and workflows
2. ✅ Read `research.md` - Understand technology decisions and rationale
3. ✅ Read `data-model.md` - Understand data structures and state management
4. ✅ Read `contracts/api-interface.md` - Understand GitHub API operations
5. ✅ GitHub App registered (see Setup section below)
6. ✅ HTTPS hosting for OAuth redirects
7. ✅ Modern browser for testing (Chrome 76+, Firefox 67+, Safari 12.1+)

## Quick Reference

### Key Files to Modify

- `index.html` - Add action bar UI, import Octokit, add GitHub integration script
- *No new files needed* - All code inline following existing architecture

### Dependencies to Add

```html
<!-- Add to index.html in <head> or before closing </body> -->
<script type="module" id="github-integration">
  import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
  // GitHub integration code here
</script>
```

### Storage Keys

- `marky-github-auth` (localStorage) - OAuth token and user info
- `marky-github-session` (sessionStorage) - Current editing session

## GitHub App Setup

### 1. Register GitHub App

1. Go to GitHub Settings → Developer settings → GitHub Apps → New GitHub App
2. Fill in details:
   - **App name**: `Marky Markdown Editor` (or your choice)
   - **Homepage URL**: `https://your-app-domain.com`
   - **Callback URL**: `https://your-app-domain.com/` (or specific callback path)
   - **Webhook**: Uncheck "Active" (not needed)
   - **Permissions**:
     - Repository permissions → Contents: **Read and write**
     - Repository permissions → Pull requests: **Read and write**
     - Account permissions → Email addresses: **Read-only**
   - **Where can this GitHub App be installed**: Any account
3. Click "Create GitHub App"
4. Note down:
   - **Client ID** (e.g., `Iv1.abc123def456`)
   - **Client Secret** (not needed for public GitHub App flow)

### 2. Configure App for Public Installation

1. After creating app, go to "Install App" tab
2. Install on your personal account or organization
3. Select repositories or all repositories

### 3. Update Code with Client ID

```javascript
const GITHUB_CONFIG = {
  clientId: 'Iv1.YOUR_CLIENT_ID_HERE', // Replace with your Client ID
  redirectUri: window.location.origin + '/', // Or specific callback path
  scopes: 'repo user:email'
};
```

## Implementation Phases

### Phase 1: Bottom Action Bar UI (2-3 hours)

**Goal**: Create slide-up action bar that toggles when GitHub logo is clicked

**Tasks**:
1. Add HTML structure for action bar
2. Add CSS for slide-up animation
3. Add JavaScript to toggle visibility on GitHub logo click
4. Test animation on desktop and mobile

**Code Snippet**:
```html
<!-- Add before closing </div> of .container -->
<div id="githubActionBar" class="github-action-bar">
  <div class="action-bar-content">
    <div class="connection-status" id="connectionStatus">
      <span class="status-text">Not connected to GitHub</span>
    </div>
    <div class="action-buttons" id="actionButtons">
      <button id="connectGitHubBtn" class="action-btn primary">
        Connect to GitHub
      </button>
    </div>
    <button class="close-bar-btn" id="closeActionBar">&times;</button>
  </div>
</div>
```

**CSS**:
```css
.github-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-toolbar);
  color: var(--text-toolbar);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  box-shadow: 0 -2px 10px var(--shadow-medium);
  z-index: 1000;
  max-height: 40vh;
  overflow-y: auto;
}

.github-action-bar.visible {
  transform: translateY(0);
}

.action-bar-content {
  padding: 1rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  background: var(--accent-blue);
  color: white;
}

.action-btn:hover {
  background: var(--accent-blue-hover);
}

.action-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
```

**JavaScript**:
```javascript
// Toggle action bar on GitHub logo click
const githubBtn = document.getElementById('githubBtn');
const actionBar = document.getElementById('githubActionBar');
const closeActionBar = document.getElementById('closeActionBar');

githubBtn.addEventListener('click', (e) => {
  // Don't prevent default - let it open GitHub page in new tab
  // But also toggle action bar
  setTimeout(() => {
    actionBar.classList.toggle('visible');
  }, 0);
});

closeActionBar.addEventListener('click', () => {
  actionBar.classList.remove('visible');
});
```

**Test Checklist**:
- [ ] Clicking GitHub logo opens new tab AND toggles action bar
- [ ] Action bar slides up smoothly
- [ ] Close button hides action bar
- [ ] Action bar is responsive on mobile
- [ ] Action bar doesn't obstruct content when visible

### Phase 2: OAuth Authentication (3-4 hours)

**Goal**: Implement GitHub OAuth login flow and store token

**Tasks**:
1. Add Octokit.js import
2. Implement OAuth redirect on "Connect" button
3. Handle OAuth callback and exchange code for token
4. Store auth state in localStorage
5. Update UI to show connected state
6. Implement disconnect functionality

**Code Snippet**:
```javascript
import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

const GITHUB_CONFIG = {
  clientId: 'Iv1.YOUR_CLIENT_ID_HERE',
  redirectUri: window.location.origin + '/',
  scopes: 'repo user:email'
};

let octokit = null;

// Check if returning from OAuth
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    handleOAuthCallback(code);
  } else {
    loadAuthState();
  }
});

async function handleOAuthCallback(code) {
  try {
    // Exchange code for token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CONFIG.clientId,
        code: code
      })
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      // Initialize Octokit
      octokit = new Octokit({ auth: data.access_token });
      
      // Get user info
      const { data: user } = await octokit.users.getAuthenticated();
      
      // Store auth state
      const authState = {
        token: data.access_token,
        expiresAt: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
        username: user.login,
        userId: user.id,
        avatarUrl: user.avatar_url,
        scopes: data.scope.split(',')
      };
      
      localStorage.setItem('marky-github-auth', JSON.stringify(authState));
      
      // Update UI
      updateConnectionStatus(authState);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (error) {
    console.error('OAuth error:', error);
    showNotification('error', 'Failed to connect to GitHub');
  }
}

function loadAuthState() {
  const stored = localStorage.getItem('marky-github-auth');
  if (stored) {
    const authState = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() < authState.expiresAt) {
      octokit = new Octokit({ auth: authState.token });
      updateConnectionStatus(authState);
    } else {
      localStorage.removeItem('marky-github-auth');
    }
  }
}

function updateConnectionStatus(authState) {
  const statusText = document.querySelector('.status-text');
  const connectBtn = document.getElementById('connectGitHubBtn');
  const actionButtons = document.getElementById('actionButtons');
  
  if (authState) {
    statusText.textContent = `Connected as ${authState.username}`;
    connectBtn.style.display = 'none';
    
    // Add browse and disconnect buttons
    actionButtons.innerHTML = `
      <button id="browseRepoBtn" class="action-btn primary">Browse Repository</button>
      <button id="disconnectBtn" class="action-btn">Disconnect</button>
    `;
    
    document.getElementById('disconnectBtn').addEventListener('click', disconnect);
    document.getElementById('browseRepoBtn').addEventListener('click', showRepoBrowser);
  } else {
    statusText.textContent = 'Not connected to GitHub';
    connectBtn.style.display = 'inline-block';
  }
}

function connectGitHub() {
  const params = new URLSearchParams({
    client_id: GITHUB_CONFIG.clientId,
    redirect_uri: GITHUB_CONFIG.redirectUri,
    scope: GITHUB_CONFIG.scopes
  });
  
  window.location.href = `https://github.com/login/oauth/authorize?${params}`;
}

function disconnect() {
  localStorage.removeItem('marky-github-auth');
  sessionStorage.removeItem('marky-github-session');
  octokit = null;
  updateConnectionStatus(null);
  showNotification('info', 'Disconnected from GitHub');
}

document.getElementById('connectGitHubBtn').addEventListener('click', connectGitHub);
```

**Test Checklist**:
- [ ] "Connect to GitHub" redirects to GitHub OAuth page
- [ ] After authorization, returns to app with token
- [ ] Username displays in connection status
- [ ] Token persists across page refreshes
- [ ] "Disconnect" clears token and resets UI
- [ ] Expired tokens are cleared on load

### Phase 3: Repository & File Browser (4-5 hours)

**Goal**: Allow users to browse repositories and select markdown files

**Tasks**:
1. Create repository browser modal/interface
2. Implement repository search/input
3. Fetch and display branches
4. Fetch and display markdown files
5. Handle file selection

**Code Snippet**: (See full implementation in contracts/api-interface.md)

**Test Checklist**:
- [ ] Can enter repository name (owner/repo format)
- [ ] Branch list loads from API
- [ ] Markdown files filter correctly
- [ ] File selection loads content into editor
- [ ] Error handling for invalid repos

### Phase 4: File Loading & Editing (2-3 hours)

**Goal**: Load selected file content into editor

**Tasks**:
1. Fetch file content from GitHub API
2. Decode Base64 content
3. Convert markdown to HTML
4. Load into editor
5. Store file metadata in session

**Test Checklist**:
- [ ] File content loads correctly
- [ ] Markdown renders in editor
- [ ] File SHA stored for commits
- [ ] Large files show warning
- [ ] Error handling for missing files

### Phase 5: Save to GitHub (PR Creation) (4-5 hours)

**Goal**: Commit changes and create pull request

**Tasks**:
1. Add "Save to GitHub" button
2. Create new branch from base branch
3. Commit file changes to new branch
4. Create pull request
5. Store PR info in session
6. Display PR link and status

**Test Checklist**:
- [ ] First save creates branch and PR
- [ ] Subsequent saves add commits to same PR
- [ ] Commit messages are descriptive
- [ ] PR link opens in new tab
- [ ] Error handling for conflicts

### Phase 6: Publish (PR Merge) (2-3 hours)

**Goal**: Merge pull request from action bar

**Tasks**:
1. Add "Publish" button (disabled until PR exists)
2. Check PR mergeable status
3. Merge PR via API
4. Delete PR branch
5. Clear session state
6. Show success message

**Test Checklist**:
- [ ] Publish button disabled until PR created
- [ ] Merge conflicts detected and handled
- [ ] Successful merge shows confirmation
- [ ] Branch deleted after merge
- [ ] Session cleared after publish

### Phase 7: Discard PR (1-2 hours)

**Goal**: Close PR without merging

**Tasks**:
1. Add "Discard" button
2. Confirmation prompt
3. Close PR via API
4. Optionally delete branch
5. Clear session state

**Test Checklist**:
- [ ] Confirmation prompt shows
- [ ] PR closes without merging
- [ ] Session state cleared
- [ ] Can start new edit after discard

### Phase 8: Error Handling & Polish (3-4 hours)

**Goal**: Robust error handling and UX refinements

**Tasks**:
1. Implement error notification system in action bar
2. Handle all error scenarios (see contracts/api-interface.md)
3. Add loading indicators
4. Implement rate limit monitoring
5. Add retry logic for network errors
6. Mobile responsiveness testing

**Test Checklist**:
- [ ] All errors show user-friendly messages
- [ ] Loading indicators during API calls
- [ ] Rate limit warnings appear
- [ ] Network errors allow retry
- [ ] Mobile UI works correctly
- [ ] Token expiration triggers re-auth

## Common Pitfalls to Avoid

1. **❌ Don't expose client secret** - Use GitHub App, not OAuth App
2. **❌ Don't log tokens** - Never console.log tokens
3. **❌ Don't skip Base64 encoding** - GitHub API requires Base64 for file content
4. **❌ Don't forget file SHA** - Required for commits, or you'll get 409 errors
5. **❌ Don't assume mergeable** - Always check PR mergeable status before merge
6. **❌ Don't forget error handling** - Every API call can fail
7. **❌ Don't block UI** - Use async/await and loading indicators
8. **❌ Don't forget mobile** - Test on small screens

## Testing Strategy

### Manual Testing Workflow

1. **Authentication Flow**
   - Connect → Disconnect → Reconnect
   - Close browser and reopen (test persistence)
   - Wait for token expiration (or manually expire)

2. **File Editing Flow**
   - Select repo → Select file → Edit → Save → Publish
   - Select repo → Select file → Edit → Save → Discard
   - Edit multiple files in session

3. **Error Scenarios**
   - Try invalid repository name
   - Try repository without write access
   - Create merge conflict (edit file on GitHub while editing in Marky)
   - Disconnect internet mid-save
   - Close PR on GitHub while open in Marky

4. **Mobile Testing**
   - Test on iPhone Safari
   - Test on Android Chrome
   - Test on tablet
   - Test landscape/portrait

### Browser DevTools Testing

```javascript
// Test token expiration
const auth = JSON.parse(localStorage.getItem('marky-github-auth'));
auth.expiresAt = Date.now() - 1000; // Already expired
localStorage.setItem('marky-github-auth', JSON.stringify(auth));
location.reload();

// Test rate limit warning
// Manually call API 4900 times (don't actually do this!)
```

## Estimated Timeline

- **Phase 1** (Action Bar UI): 2-3 hours
- **Phase 2** (OAuth): 3-4 hours
- **Phase 3** (Repo Browser): 4-5 hours
- **Phase 4** (File Loading): 2-3 hours
- **Phase 5** (Save/PR): 4-5 hours
- **Phase 6** (Publish): 2-3 hours
- **Phase 7** (Discard): 1-2 hours
- **Phase 8** (Polish): 3-4 hours

**Total**: 21-29 hours (3-4 days full-time)

## Getting Help

If you encounter issues:

1. Check `contracts/api-interface.md` for correct API usage
2. Check `data-model.md` for correct data structures
3. Check GitHub API docs: https://docs.github.com/en/rest
4. Check Octokit.js docs: https://octokit.github.io/rest.js
5. Check browser console for error messages
6. Test API calls directly with curl or Postman

## Ready to Start?

✅ Complete prerequisites above
✅ Set up GitHub App
✅ Start with Phase 1 (Action Bar UI)
✅ Test each phase before moving to next
✅ Commit frequently

Good luck! 🚀
