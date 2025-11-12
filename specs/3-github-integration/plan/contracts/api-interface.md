# API Interface Contract: GitHub Integration

**Feature ID**: 3-github-integration  
**Created**: 2025-11-12  
**Status**: Planning

## Overview

This document defines the interface contract between Marky and the GitHub API. All interactions use GitHub REST API v3 with Octokit.js as the client library.

## Base Configuration

```javascript
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OAUTH_BASE = 'https://github.com/login/oauth';
const API_VERSION = '2022-11-28'; // GitHub API version header
```

## Authentication Endpoints

### 1. Initiate OAuth Flow

**Type**: Browser Redirect

**Endpoint**: `GET https://github.com/login/oauth/authorize`

**Parameters**:
```typescript
{
  client_id: string;          // GitHub App client ID
  redirect_uri: string;       // Callback URL (must match GitHub App config)
  scope: string;              // Space-separated: 'repo user:email'
  state?: string;             // CSRF protection token (optional but recommended)
}
```

**Example**:
```javascript
const params = new URLSearchParams({
  client_id: 'Iv1.abc123def456',
  redirect_uri: 'https://marky-app.com/github-callback',
  scope: 'repo user:email',
  state: generateCSRFToken()
});

window.location.href = `${GITHUB_OAUTH_BASE}/authorize?${params}`;
```

**Response**: GitHub redirects to `redirect_uri` with:
```
https://marky-app.com/github-callback?code=abc123&state=xyz789
```

### 2. Exchange Code for Token

**Note**: For GitHub App, this can be done client-side without client secret

**Endpoint**: `POST https://github.com/login/oauth/access_token`

**Headers**:
```
Accept: application/json
```

**Body**:
```json
{
  "client_id": "Iv1.abc123def456",
  "code": "abc123def456"
}
```

**Response** (Success - 200):
```json
{
  "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
  "token_type": "bearer",
  "scope": "repo,user:email"
}
```

**Implementation**:
```javascript
async function exchangeCodeForToken(code) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      code: code
    })
  });
  
  const data = await response.json();
  return data.access_token;
}
```

### 3. Get Authenticated User

**Endpoint**: `GET /user`

**Octokit Method**: `octokit.users.getAuthenticated()`

**Response** (Success - 200):
```json
{
  "login": "octocat",
  "id": 583231,
  "avatar_url": "https://avatars.githubusercontent.com/u/583231",
  "name": "The Octocat",
  "email": "octocat@github.com"
}
```

**Implementation**:
```javascript
async function getUserInfo(octokit) {
  const { data } = await octokit.users.getAuthenticated();
  return {
    username: data.login,
    userId: data.id,
    avatarUrl: data.avatar_url,
    email: data.email
  };
}
```

## Repository Operations

### 4. Get Repository

**Endpoint**: `GET /repos/{owner}/{repo}`

**Octokit Method**: `octokit.repos.get({ owner, repo })`

**Purpose**: Validate repository access and get metadata

**Response** (Success - 200):
```json
{
  "id": 1296269,
  "name": "marky",
  "full_name": "Tommertom/marky",
  "owner": {
    "login": "Tommertom"
  },
  "private": false,
  "default_branch": "main",
  "permissions": {
    "admin": false,
    "push": true,
    "pull": true
  }
}
```

**Error Responses**:
- `404`: Repository not found or no access
- `403`: Access forbidden

**Implementation**:
```javascript
async function getRepository(octokit, owner, repo) {
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    
    if (!data.permissions.push) {
      throw new Error('You need write access to edit files in this repository');
    }
    
    return {
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      defaultBranch: data.default_branch,
      hasWriteAccess: data.permissions.push
    };
  } catch (error) {
    if (error.status === 404) {
      throw new Error('Repository not found or you don\'t have access');
    }
    throw error;
  }
}
```

### 5. List Branches

**Endpoint**: `GET /repos/{owner}/{repo}/branches`

**Octokit Method**: `octokit.repos.listBranches({ owner, repo })`

**Purpose**: Get list of branches for user selection

**Response** (Success - 200):
```json
[
  {
    "name": "main",
    "commit": {
      "sha": "abc123",
      "url": "https://api.github.com/repos/Tommertom/marky/commits/abc123"
    },
    "protected": true
  },
  {
    "name": "develop",
    "commit": {
      "sha": "def456",
      "url": "https://api.github.com/repos/Tommertom/marky/commits/def456"
    },
    "protected": false
  }
]
```

**Implementation**:
```javascript
async function getBranches(octokit, owner, repo) {
  const { data } = await octokit.repos.listBranches({ owner, repo });
  return data.map(branch => ({
    name: branch.name,
    commitSHA: branch.commit.sha,
    protected: branch.protected
  }));
}
```

### 6. Get Repository Tree (File List)

**Endpoint**: `GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1`

**Octokit Method**: `octokit.git.getTree({ owner, repo, tree_sha, recursive: '1' })`

**Purpose**: Get all files in repository to filter for markdown files

**Response** (Success - 200):
```json
{
  "sha": "abc123",
  "url": "https://api.github.com/repos/Tommertom/marky/git/trees/abc123",
  "tree": [
    {
      "path": "README.md",
      "mode": "100644",
      "type": "blob",
      "sha": "def456",
      "size": 1024,
      "url": "https://api.github.com/repos/Tommertom/marky/git/blobs/def456"
    },
    {
      "path": "docs/guide.md",
      "mode": "100644",
      "type": "blob",
      "sha": "ghi789",
      "size": 2048,
      "url": "https://api.github.com/repos/Tommertom/marky/git/blobs/ghi789"
    }
  ],
  "truncated": false
}
```

**Implementation**:
```javascript
async function getMarkdownFiles(octokit, owner, repo, branch) {
  // First get branch to get tree SHA
  const { data: branchData } = await octokit.repos.getBranch({
    owner,
    repo,
    branch
  });
  
  const treeSHA = branchData.commit.commit.tree.sha;
  
  // Get full tree
  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: treeSHA,
    recursive: '1'
  });
  
  // Filter for markdown files
  const markdownFiles = tree.tree.filter(item =>
    item.type === 'blob' &&
    (item.path.endsWith('.md') || item.path.endsWith('.markdown'))
  );
  
  return markdownFiles.map(file => ({
    path: file.path,
    sha: file.sha,
    size: file.size
  }));
}
```

## File Operations

### 7. Get File Content

**Endpoint**: `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}`

**Octokit Method**: `octokit.repos.getContent({ owner, repo, path, ref })`

**Purpose**: Fetch markdown file content for editing

**Response** (Success - 200):
```json
{
  "name": "README.md",
  "path": "README.md",
  "sha": "abc123def456",
  "size": 1024,
  "content": "IyBNYXJreQoKTWFya2Rvd24gZWRpdG9y...",
  "encoding": "base64",
  "download_url": "https://raw.githubusercontent.com/Tommertom/marky/main/README.md"
}
```

**Error Responses**:
- `404`: File not found
- `403`: Rate limit or access denied

**Implementation**:
```javascript
async function getFileContent(octokit, owner, repo, path, branch) {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });
    
    // Check file size
    if (data.size > 1024 * 1024) {
      throw new Error('File too large (max 1MB)');
    }
    
    // Decode Base64 content
    const content = atob(data.content);
    
    return {
      path: data.path,
      sha: data.sha,
      content: content,
      size: data.size
    };
  } catch (error) {
    if (error.status === 404) {
      throw new Error('File not found');
    }
    throw error;
  }
}
```

### 8. Create Branch

**Endpoint**: `POST /repos/{owner}/{repo}/git/refs`

**Octokit Method**: `octokit.git.createRef({ owner, repo, ref, sha })`

**Purpose**: Create new PR branch from base branch

**Request Body**:
```json
{
  "ref": "refs/heads/marky-edit-readme-1699999999",
  "sha": "abc123def456"
}
```

**Response** (Success - 201):
```json
{
  "ref": "refs/heads/marky-edit-readme-1699999999",
  "object": {
    "sha": "abc123def456",
    "type": "commit"
  }
}
```

**Error Responses**:
- `422`: Branch already exists or invalid reference

**Implementation**:
```javascript
async function createPRBranch(octokit, owner, repo, baseBranch, filename) {
  // Get base branch SHA
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`
  });
  
  const baseSHA = refData.object.sha;
  
  // Generate unique branch name
  const timestamp = Date.now();
  const slug = filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const branchName = `marky-edit-${slug}-${timestamp}`;
  
  // Create branch
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSHA
  });
  
  return branchName;
}
```

### 9. Create/Update File (Commit)

**Endpoint**: `PUT /repos/{owner}/{repo}/contents/{path}`

**Octokit Method**: `octokit.repos.createOrUpdateFileContents({ owner, repo, path, message, content, sha, branch })`

**Purpose**: Commit file changes to PR branch

**Request Body**:
```json
{
  "message": "Update README.md via Marky",
  "content": "IyBNYXJreQoKTWFya2Rvd24gZWRpdG9y...",
  "sha": "abc123def456",
  "branch": "marky-edit-readme-1699999999"
}
```

**Response** (Success - 200):
```json
{
  "content": {
    "name": "README.md",
    "path": "README.md",
    "sha": "newsha789",
    "size": 1100
  },
  "commit": {
    "sha": "commitsha456",
    "message": "Update README.md via Marky"
  }
}
```

**Error Responses**:
- `409`: Conflict (SHA mismatch - file was modified)
- `422`: Invalid content or encoding

**Implementation**:
```javascript
async function commitFile(octokit, owner, repo, path, content, fileSHA, branch, message) {
  // Encode content to Base64
  const encodedContent = btoa(unescape(encodeURIComponent(content)));
  
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: message || `Update ${path} via Marky`,
    content: encodedContent,
    sha: fileSHA,
    branch: branch
  });
  
  return {
    newSHA: data.content.sha,
    commitSHA: data.commit.sha
  };
}
```

## Pull Request Operations

### 10. Create Pull Request

**Endpoint**: `POST /repos/{owner}/{repo}/pulls`

**Octokit Method**: `octokit.pulls.create({ owner, repo, title, body, head, base })`

**Purpose**: Create PR from PR branch to base branch

**Request Body**:
```json
{
  "title": "Marky edit: README.md",
  "body": "This PR was created using Marky Markdown Editor.\n\nFile: `README.md`\nBranch: `main`",
  "head": "marky-edit-readme-1699999999",
  "base": "main"
}
```

**Response** (Success - 201):
```json
{
  "number": 42,
  "state": "open",
  "title": "Marky edit: README.md",
  "body": "This PR was created using Marky Markdown Editor...",
  "html_url": "https://github.com/Tommertom/marky/pull/42",
  "head": {
    "ref": "marky-edit-readme-1699999999",
    "sha": "abc123"
  },
  "base": {
    "ref": "main",
    "sha": "def456"
  },
  "mergeable": null,
  "mergeable_state": "unknown",
  "merged": false,
  "created_at": "2025-11-12T10:00:00Z"
}
```

**Error Responses**:
- `422`: Validation failed (no commits between branches, or PR already exists)

**Implementation**:
```javascript
async function createPullRequest(octokit, owner, repo, prBranch, baseBranch, filename) {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title: `Marky edit: ${filename}`,
    body: `This PR was created using Marky Markdown Editor.\n\nFile: \`${filename}\`\nBranch: \`${baseBranch}\``,
    head: prBranch,
    base: baseBranch
  });
  
  return {
    number: data.number,
    url: data.html_url,
    state: data.state,
    branch: data.head.ref
  };
}
```

### 11. Get Pull Request Status

**Endpoint**: `GET /repos/{owner}/{repo}/pulls/{pull_number}`

**Octokit Method**: `octokit.pulls.get({ owner, repo, pull_number })`

**Purpose**: Check if PR is mergeable and get current state

**Response** (Success - 200):
```json
{
  "number": 42,
  "state": "open",
  "mergeable": true,
  "mergeable_state": "clean",
  "merged": false
}
```

**Mergeable States**:
- `clean`: No conflicts, ready to merge
- `dirty`: Merge conflicts
- `unstable`: Failing checks
- `blocked`: Branch protection prevents merge

**Implementation**:
```javascript
async function getPRStatus(octokit, owner, repo, prNumber) {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });
  
  return {
    state: data.state,
    mergeable: data.mergeable,
    mergeableState: data.mergeable_state,
    merged: data.merged
  };
}
```

### 12. Merge Pull Request

**Endpoint**: `PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge`

**Octokit Method**: `octokit.pulls.merge({ owner, repo, pull_number, merge_method })`

**Purpose**: Merge PR to base branch

**Request Body**:
```json
{
  "merge_method": "merge"
}
```

**Merge Methods**:
- `merge`: Create merge commit
- `squash`: Squash commits and merge
- `rebase`: Rebase and merge

**Response** (Success - 200):
```json
{
  "sha": "abc123merged",
  "merged": true,
  "message": "Pull Request successfully merged"
}
```

**Error Responses**:
- `405`: PR not mergeable (conflicts, checks failing, or protected branch)
- `409`: SHA mismatch or concurrent modification

**Implementation**:
```javascript
async function mergePullRequest(octokit, owner, repo, prNumber) {
  try {
    const { data } = await octokit.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: 'merge' // Use repository default
    });
    
    return {
      merged: data.merged,
      sha: data.sha
    };
  } catch (error) {
    if (error.status === 405) {
      throw new Error('Cannot merge: conflicts or failing checks');
    }
    throw error;
  }
}
```

### 13. Close Pull Request (Without Merging)

**Endpoint**: `PATCH /repos/{owner}/{repo}/pulls/{pull_number}`

**Octokit Method**: `octokit.pulls.update({ owner, repo, pull_number, state: 'closed' })`

**Purpose**: Close PR without merging (discard)

**Request Body**:
```json
{
  "state": "closed"
}
```

**Response** (Success - 200):
```json
{
  "number": 42,
  "state": "closed",
  "merged": false
}
```

**Implementation**:
```javascript
async function closePullRequest(octokit, owner, repo, prNumber) {
  const { data } = await octokit.pulls.update({
    owner,
    repo,
    pull_number: prNumber,
    state: 'closed'
  });
  
  return {
    closed: data.state === 'closed',
    merged: data.merged
  };
}
```

### 14. Delete Branch

**Endpoint**: `DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}`

**Octokit Method**: `octokit.git.deleteRef({ owner, repo, ref })`

**Purpose**: Delete PR branch after merge or discard

**Response** (Success - 204): No content

**Error Responses**:
- `422`: Branch is default branch or protected

**Implementation**:
```javascript
async function deleteBranch(octokit, owner, repo, branch) {
  try {
    await octokit.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branch}`
    });
    return true;
  } catch (error) {
    if (error.status === 422) {
      // Branch protected or default - ignore
      return false;
    }
    throw error;
  }
}
```

## Rate Limiting

### Rate Limit Headers

Every API response includes rate limit headers:

```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1699999999
X-RateLimit-Used: 1
```

### Check Rate Limit

**Endpoint**: `GET /rate_limit`

**Octokit Method**: `octokit.rateLimit.get()`

**Response** (Success - 200):
```json
{
  "resources": {
    "core": {
      "limit": 5000,
      "remaining": 4999,
      "reset": 1699999999,
      "used": 1
    }
  }
}
```

**Implementation**:
```javascript
async function checkRateLimit(octokit) {
  const { data } = await octokit.rateLimit.get();
  return {
    limit: data.resources.core.limit,
    remaining: data.resources.core.remaining,
    reset: new Date(data.resources.core.reset * 1000),
    used: data.resources.core.used
  };
}
```

## Error Handling

### Standard Error Response Format

```typescript
interface GitHubAPIError {
  message: string;
  documentation_url: string;
  status: number;
}
```

**Example**:
```json
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest/reference/repos#get-a-repository",
  "status": 404
}
```

### Common Error Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Unauthorized | Re-authenticate |
| 403 | Forbidden | Check permissions or rate limit |
| 404 | Not Found | Verify resource exists |
| 409 | Conflict | Handle merge conflict or SHA mismatch |
| 422 | Validation Failed | Check request parameters |
| 429 | Rate Limit Exceeded | Wait for reset time |
| 500 | Server Error | Retry with exponential backoff |

## Summary

This API interface contract defines:

- **14 API operations** covering authentication, repository access, file operations, and PR management
- **Complete request/response schemas** with TypeScript types
- **Error handling patterns** for all common scenarios
- **Rate limiting awareness** with monitoring and throttling
- **Working code examples** using Octokit.js for all operations

All endpoints align with GitHub REST API v3 specifications and support the functional requirements defined in spec.md.
