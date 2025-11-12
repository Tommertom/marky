# Data Model: GitHub Integration

**Feature ID**: 3-github-integration  
**Created**: 2025-11-12  
**Status**: Planning

## Overview

This document defines the data structures for GitHub integration, including session state, authentication, and GitHub API entities.

## Storage Models

### 1. GitHub Authentication State (localStorage)

**Key**: `marky-github-auth`

**Structure**:
```typescript
interface GitHubAuthState {
  token: string;              // OAuth access token (ghp_... or gho_...)
  expiresAt: number;          // Timestamp (ms) when token should be re-validated
  username: string;           // GitHub username
  userId: number;             // GitHub user ID
  avatarUrl?: string;         // User avatar URL (optional)
  scopes: string[];           // Granted scopes ['repo', 'user:email']
}
```

**Example**:
```json
{
  "token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
  "expiresAt": 1699999999999,
  "username": "octocat",
  "userId": 583231,
  "avatarUrl": "https://avatars.githubusercontent.com/u/583231",
  "scopes": ["repo", "user:email"]
}
```

**Lifecycle**:
- Created: On successful OAuth callback
- Updated: On re-authentication
- Deleted: On disconnect or token expiration
- Validation: Check `expiresAt` on each API call

### 2. GitHub Session State (sessionStorage)

**Key**: `marky-github-session`

**Structure**:
```typescript
interface GitHubSession {
  repository: {
    owner: string;            // Repository owner (user or org)
    name: string;             // Repository name
    fullName: string;         // "owner/name"
    defaultBranch: string;    // Usually 'main' or 'master'
  } | null;
  
  baseBranch: string | null;  // Branch to create PR against (e.g., 'main')
  
  file: {
    path: string;             // File path in repo (e.g., 'docs/README.md')
    sha: string;              // Current file SHA (for commits)
    content: string;          // Current file content (markdown)
    encoding: 'base64' | 'utf-8';
  } | null;
  
  pullRequest: {
    number: number;           // PR number
    branch: string;           // PR branch name (e.g., 'marky-edit-readme-123')
    url: string;              // PR URL on GitHub
    state: 'open' | 'closed' | 'merged';
    mergeable: boolean | null;
    createdAt: number;        // Timestamp (ms)
  } | null;
  
  lastSaved: number | null;   // Timestamp of last save (ms)
  isDirty: boolean;           // Has unsaved changes
}
```

**Example**:
```json
{
  "repository": {
    "owner": "Tommertom",
    "name": "marky",
    "fullName": "Tommertom/marky",
    "defaultBranch": "main"
  },
  "baseBranch": "main",
  "file": {
    "path": "README.md",
    "sha": "abc123def456",
    "content": "# Marky\n\nMarkdown editor...",
    "encoding": "utf-8"
  },
  "pullRequest": {
    "number": 42,
    "branch": "marky-edit-readme-1699999999",
    "url": "https://github.com/Tommertom/marky/pull/42",
    "state": "open",
    "mergeable": true,
    "createdAt": 1699999999000
  },
  "lastSaved": 1699999999500,
  "isDirty": false
}
```

**Lifecycle**:
- Created: When user selects a file
- Updated: On save, PR creation, file changes
- Deleted: On disconnect, publish, or discard
- Cleared: On new file selection

### 3. Action Bar UI State (in-memory)

**Structure**:
```typescript
interface ActionBarState {
  isVisible: boolean;         // Action bar visible/hidden
  isLoading: boolean;         // Loading indicator active
  currentView: 'connect' | 'browse' | 'editing' | 'error';
  notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    action?: {
      label: string;
      url: string;            // External link or internal action
    };
    timeout?: number;         // Auto-dismiss after N ms
  } | null;
}
```

**Example**:
```json
{
  "isVisible": true,
  "isLoading": false,
  "currentView": "editing",
  "notification": {
    "type": "success",
    "message": "Pull request #42 created successfully!",
    "action": {
      "label": "View on GitHub",
      "url": "https://github.com/Tommertom/marky/pull/42"
    },
    "timeout": 5000
  }
}
```

## GitHub API Entity Models

### 4. Repository Entity

**Source**: GitHub API `/repos/{owner}/{repo}`

**Structure**:
```typescript
interface Repository {
  id: number;
  name: string;
  full_name: string;          // "owner/repo"
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  private: boolean;
  default_branch: string;
  permissions: {
    admin: boolean;
    push: boolean;             // Required for creating PRs
    pull: boolean;
  };
}
```

**Usage**: Validate user has push permissions before allowing edits

### 5. Branch Entity

**Source**: GitHub API `/repos/{owner}/{repo}/branches/{branch}`

**Structure**:
```typescript
interface Branch {
  name: string;
  commit: {
    sha: string;              // Latest commit SHA
    url: string;
  };
  protected: boolean;         // Branch protection enabled
}
```

**Usage**: Get latest commit SHA for creating new branches

### 6. File Content Entity

**Source**: GitHub API `/repos/{owner}/{repo}/contents/{path}`

**Structure**:
```typescript
interface FileContent {
  name: string;
  path: string;
  sha: string;                // File SHA (required for updates)
  size: number;               // File size in bytes
  content: string;            // Base64-encoded content
  encoding: 'base64';
  download_url: string;
}
```

**Transformation**:
```javascript
// Decode Base64 content
const decodedContent = atob(fileContent.content);
// Convert markdown to HTML for editor
const html = markdownToHtml(decodedContent);
```

### 7. Tree Entity (File List)

**Source**: GitHub API `/repos/{owner}/{repo}/git/trees/{sha}?recursive=1`

**Structure**:
```typescript
interface TreeItem {
  path: string;               // File path
  mode: string;               // '100644' for files
  type: 'blob' | 'tree';      // blob = file, tree = directory
  sha: string;
  size: number;
  url: string;
}

interface Tree {
  sha: string;
  url: string;
  tree: TreeItem[];
  truncated: boolean;         // True if > 100,000 entries
}
```

**Filtering** (client-side):
```javascript
const markdownFiles = tree.tree.filter(item => 
  item.type === 'blob' && 
  (item.path.endsWith('.md') || item.path.endsWith('.markdown'))
);
```

### 8. Pull Request Entity

**Source**: GitHub API `/repos/{owner}/{repo}/pulls/{number}`

**Structure**:
```typescript
interface PullRequest {
  number: number;
  state: 'open' | 'closed';
  title: string;
  body: string;
  html_url: string;
  head: {
    ref: string;              // PR branch name
    sha: string;
  };
  base: {
    ref: string;              // Base branch name
    sha: string;
  };
  mergeable: boolean | null;  // null = not yet calculated
  mergeable_state: 'clean' | 'dirty' | 'unstable' | 'blocked';
  merged: boolean;
  created_at: string;         // ISO 8601 timestamp
  updated_at: string;
}
```

**Mergeable States**:
- `clean`: Ready to merge
- `dirty`: Merge conflicts
- `unstable`: Failing status checks
- `blocked`: Branch protection rules prevent merge

## State Transitions

### Authentication Flow

```
Initial State: No auth data
  ↓ User clicks "Connect to GitHub"
  → Redirect to GitHub OAuth
  ↓ User authorizes
  → GitHub redirects back with code
  ↓ Exchange code for token
  → Store GitHubAuthState in localStorage
Authenticated State
  ↓ User clicks "Disconnect" OR token expires
  → Delete GitHubAuthState
Initial State
```

### File Editing Flow

```
No Session
  ↓ User selects repository & file
  → Create GitHubSession with repository, file
Editing State (isDirty: false)
  ↓ User edits content
  → Update isDirty: true
Editing State (isDirty: true)
  ↓ User clicks "Save to GitHub"
  → Create PR branch & commit (if first save)
  → Create PullRequest entry in session
  → Update isDirty: false, lastSaved: timestamp
Editing with PR State
  ↓ User clicks "Publish"
  → Merge PR via API
  → Clear GitHubSession
No Session
```

### Error Recovery Flow

```
Any State
  ↓ API returns 401 Unauthorized
  → Delete GitHubAuthState
  → Prompt re-authentication
  ↓ User re-authenticates
  → Restore previous session if still valid
  → Retry failed operation
Recovered State
```

## Validation Rules

### Repository Name Validation

```javascript
function validateRepositoryName(fullName) {
  const pattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  return pattern.test(fullName);
}
```

**Valid**: `Tommertom/marky`, `microsoft/vscode`, `user_name/repo.name`
**Invalid**: `incomplete`, `/no-owner`, `owner/`, `owner//repo`

### Branch Name Validation

```javascript
function validateBranchName(branch) {
  // GitHub branch name rules
  const invalid = /[\s~^:?*\[\\]|\.\.|\.$|^\.|\/@{|\/$/;
  return branch.length > 0 && !invalid.test(branch);
}
```

### File Path Validation

```javascript
function validateFilePath(path) {
  // Must be markdown file
  return path.endsWith('.md') || path.endsWith('.markdown');
}
```

### Token Expiration Check

```javascript
function isTokenValid(authState) {
  return authState && 
         authState.token && 
         Date.now() < authState.expiresAt;
}
```

## Size Limits

### File Size Limits

- **GitHub API Limit**: 1MB for `/contents` endpoint
- **Warning Threshold**: 500KB (warn user before loading)
- **Marky Editor Limit**: 1MB (performance consideration)

**Size Check**:
```javascript
function canLoadFile(fileSize) {
  const MAX_SIZE = 1024 * 1024; // 1MB
  const WARN_SIZE = 512 * 1024; // 512KB
  
  if (fileSize > MAX_SIZE) {
    return { canLoad: false, shouldWarn: false };
  } else if (fileSize > WARN_SIZE) {
    return { canLoad: true, shouldWarn: true };
  } else {
    return { canLoad: true, shouldWarn: false };
  }
}
```

### API Rate Limits

- **Authenticated**: 5,000 requests/hour
- **Warning Threshold**: 100 requests remaining
- **Error Threshold**: 0 requests remaining (handle 429 response)

**Rate Limit Tracking**:
```javascript
interface RateLimitState {
  limit: number;              // 5000
  remaining: number;          // Requests left
  reset: number;              // Timestamp when limit resets
  used: number;               // Requests used
}
```

## Error States

### Authentication Errors

```typescript
type AuthError = 
  | { code: 'NO_TOKEN', message: 'Not authenticated' }
  | { code: 'EXPIRED', message: 'Token expired' }
  | { code: 'REVOKED', message: 'Access revoked' }
  | { code: 'INVALID_SCOPE', message: 'Insufficient permissions' };
```

### API Errors

```typescript
type APIError = 
  | { code: 'NOT_FOUND', status: 404, message: string }
  | { code: 'FORBIDDEN', status: 403, message: string }
  | { code: 'CONFLICT', status: 409, message: string }
  | { code: 'RATE_LIMIT', status: 429, retryAfter: number }
  | { code: 'NETWORK', message: string };
```

### Validation Errors

```typescript
type ValidationError = 
  | { field: 'repository', message: 'Invalid repository format' }
  | { field: 'branch', message: 'Invalid branch name' }
  | { field: 'file', message: 'Not a markdown file' }
  | { field: 'fileSize', message: 'File too large (max 1MB)' };
```

## Summary

This data model provides:

- **Clear structure** for authentication and session state
- **Separation of concerns** (localStorage for auth, sessionStorage for session)
- **Type safety** with TypeScript-style interfaces
- **Validation rules** for all user inputs
- **Error handling** with specific error types
- **Size limits** to prevent performance issues
- **State transitions** documenting flow between states

All entities align with GitHub API v3 specifications and support the functional requirements defined in spec.md.
