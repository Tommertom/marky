# Feature Specification: GitHub Integration

**Feature ID**: 3-github-integration  
**Created**: 2025-11-12  
**Status**: Draft

## Overview

Enable users to connect Marky Markdown Editor to their GitHub repositories, allowing them to browse, edit, and save markdown files directly to GitHub branches via pull requests. Users will authenticate with GitHub, select a repository and branch, choose a markdown file to edit in the WYSIWYG editor, save changes as commits to a pull request, and publish (merge) the pull request when ready. This transforms Marky from a local-only editor into a collaborative GitHub-integrated markdown editing tool.

## Business Value

- **Seamless GitHub Workflow**: Eliminates the need to clone repositories locally or use complex Git commands for simple markdown edits
- **Collaboration Enablement**: Makes it easy for non-technical contributors to edit documentation, README files, and markdown content in repositories
- **Pull Request Integration**: Leverages GitHub's review process directly from the editor, maintaining team workflow standards
- **Reduced Friction**: Lowers barriers to contribution for documentation and content updates
- **Browser-Based Editing**: Enables editing from any device without Git installation or repository clones
- **Version Control**: All changes are tracked through GitHub's native version control system

## User Scenarios & Testing

### Primary User Flow

1. **User wants to edit a markdown file in a GitHub repository**
   - User clicks "Connect to GitHub" button in toolbar
   - Application redirects to GitHub OAuth authentication page
   - User grants permissions to Marky application
   - User is redirected back to Marky with authentication token
   - Token is stored securely in browser

2. **User selects repository and file to edit**
   - User sees a "Browse GitHub" button or modal after authentication
   - User enters or selects repository (owner/repo format, e.g., "Tommertom/marky")
   - User selects or enters branch name (e.g., "main", "develop")
   - Application fetches list of markdown files in the repository
   - User selects a markdown file from the list
   - File content is loaded into the WYSIWYG editor

3. **User edits the markdown file**
   - File content displays in the editor with full formatting
   - User makes changes using the existing WYSIWYG editing features
   - Changes are tracked locally in the editor

4. **User saves changes (creates/updates PR)**
   - User clicks "Save to GitHub" button
   - If no PR exists for this edit session:
     - Application creates a new branch from the selected base branch
     - Branch name follows pattern: `marky-edit-[filename]-[timestamp]`
     - Application creates a new pull request from the new branch to the base branch
     - Commit is made with user's changes
     - Commit message: "Update [filename] via Marky" or user-provided message
   - If PR already exists from previous save in this session:
     - New commit is added to the existing PR branch
     - PR is updated with the new commit
   - User sees confirmation with PR number and link

5. **User publishes changes (merges PR)**
   - User clicks "Publish" button
   - Application merges the pull request to the base branch
   - PR is closed automatically
   - User sees success confirmation
   - Editor can be cleared or user can start a new edit session

### Alternative Scenarios

**Scenario A: User Edits Multiple Files in Session**
- User completes editing one file and creates PR
- User selects a different file from the same or different repository
- New file loads in editor
- Saving creates a separate PR for the new file
- Each file edit maintains its own PR lifecycle

**Scenario B: User Closes Browser Mid-Edit**
- User authenticates and loads a file
- User makes edits but closes browser before saving
- On returning, authentication token is still valid (not expired)
- User must re-select repository, branch, and file
- Previous unsaved edits are lost (user warned before connecting to GitHub)
- Local autosave may preserve content, but GitHub connection state is not maintained

**Scenario C: Authentication Expires During Session**
- User is authenticated and editing
- OAuth token expires or is revoked
- User attempts to save changes
- Application detects authentication failure
- User is prompted to re-authenticate
- After re-authentication, save operation retries automatically

**Scenario D: PR Has Merge Conflicts**
- User creates PR with edits
- Another user merges changes to the same file in base branch
- User attempts to publish PR
- GitHub reports merge conflicts
- Application informs user that manual conflict resolution is required on GitHub
- User is provided link to PR on GitHub to resolve conflicts
- Publishing is prevented until conflicts are resolved

**Scenario E: User Wants to Discard PR**
- User has created a PR but wants to abandon changes
- User clicks "Discard PR" or "Cancel" button
- Application prompts for confirmation
- Application closes PR on GitHub without merging
- User can start fresh edit session

## Functional Requirements

### Core Functionality

1. **GitHub Authentication**
   - "Connect to GitHub" button in toolbar (next to existing buttons)
   - OAuth 2.0 authentication flow using GitHub Apps or OAuth Apps
   - Requested scopes: `repo` (full repository access for private and public repos), `user:email` (user identification)
   - Redirect URI configured for application domain
   - Access token stored securely in browser sessionStorage or localStorage
   - Token encrypted or handled according to OAuth security best practices
   - "Disconnect" option to clear authentication and remove token
   - Visual indicator showing connection status (connected/disconnected)

2. **Repository and File Selection**
   - Modal or sidebar panel for repository browsing
   - Input field for repository (autocomplete from user's accessible repos preferred)
   - Repository format validation: `owner/repo-name`
   - Dropdown or input for branch selection
   - Branch list fetched from GitHub API (default to `main` or repository default branch)
   - File browser showing markdown files (`.md`, `.markdown` extensions)
   - File list fetched via GitHub API (tree endpoint)
   - Option to filter or search files by name
   - Selected file path displayed prominently (e.g., "Editing: owner/repo@branch/path/to/file.md")

3. **Load File into Editor**
   - Fetch file content from GitHub API (contents endpoint)
   - Decode Base64-encoded content from API response
   - Convert markdown to HTML for WYSIWYG display
   - Load HTML into existing editor
   - Preserve file metadata (SHA, path, branch) for subsequent commits
   - Display loading indicator while fetching
   - Error handling for file not found, access denied, or API failures

4. **Save Changes (Create/Update PR)**
   - "Save to GitHub" button in toolbar (distinct from local "Download MD" button)
   - Button disabled until authentication and file selection complete
   - Save workflow:
     - Check if PR already exists for current edit session (tracked by session state)
     - If first save:
       - Create new branch via GitHub API: `marky-edit-[filename-slug]-[timestamp]`
       - Commit file changes to new branch
       - Create pull request from new branch to base branch
       - Store PR number in session state
     - If subsequent save:
       - Commit new changes to existing PR branch
       - Update PR description with commit list if desired
   - Commit message:
     - Default: "Update [filename] via Marky"
     - Optional: User can provide custom commit message (input field or modal)
   - Pull request title: "Marky edit: [filename]"
   - Pull request description: "This PR was created using Marky Markdown Editor.\n\nFile: `[path]`\nBranch: `[base-branch]`"
   - Display success notification with PR number and link to PR on GitHub
   - Error handling for commit failures, API rate limits, permission issues

5. **Publish Changes (Merge PR)**
   - "Publish" button in toolbar (appears after PR is created)
   - Button state:
     - Disabled until PR is created
     - Disabled if PR has merge conflicts
     - Enabled when PR is mergeable
   - Merge workflow:
     - Check PR merge status via GitHub API
     - If mergeable, merge PR using GitHub API (merge method: merge commit, squash, or rebase based on repository settings)
     - Close PR automatically after merge
     - Delete PR branch (optional, configurable)
     - Display success confirmation
     - Clear PR session state
   - Handle merge conflicts:
     - Detect conflicts via API
     - Display error message: "This PR has merge conflicts. Please resolve them on GitHub: [link]"
     - Prevent merge until conflicts resolved
   - Error handling for merge failures, permission issues, branch protection rules

6. **Session State Management**
   - Track current edit session:
     - Repository (owner/repo)
     - Base branch
     - File path
     - PR number (if created)
     - PR branch name
     - File SHA (for commit tracking)
   - Session state stored in sessionStorage or in-memory (not persistent across browser restarts)
   - Clear session state when:
     - User disconnects from GitHub
     - User starts editing a different file
     - User successfully publishes PR
     - User explicitly cancels/discards PR

7. **Discard/Cancel PR**
   - "Discard PR" or "Cancel" button (visible when PR exists)
   - Confirmation prompt: "Are you sure? This will close the PR without merging."
   - Close PR via GitHub API without merging
   - Optionally delete PR branch
   - Clear session state
   - User can start new edit session

8. **Connection Status Display**
   - Visual indicator in toolbar showing GitHub connection status:
     - "Not connected" (default state, shows "Connect to GitHub" button)
     - "Connected as [username]" (shows user's GitHub username, shows "Disconnect" option)
   - Display current repository/branch/file when editing:
     - Toolbar badge or subtitle: "owner/repo@branch/path/to/file.md"
     - Clicking badge opens repository browser to change file

9. **Error Handling and User Feedback**
   - Authentication errors: "Failed to connect to GitHub. Please try again."
   - Permission errors: "You don't have permission to access this repository or file."
   - API rate limit errors: "GitHub API rate limit exceeded. Please try again in [time]."
   - Network errors: "Network error. Please check your connection and try again."
   - Merge conflict errors: "This PR has merge conflicts. Resolve them on GitHub: [link]"
   - All errors displayed as non-intrusive notifications with actionable messages

## Success Criteria

1. **Authentication Success Rate**: 95% of users successfully authenticate with GitHub on first attempt without errors
2. **File Load Performance**: Markdown files up to 1MB load and render in the editor within 3 seconds
3. **Save Reliability**: 98% of save operations successfully create or update PRs without errors
4. **Merge Success Rate**: 95% of merge operations succeed when PR is mergeable (no conflicts or protection rules blocking)
5. **User Clarity**: Users understand their GitHub connection status, which file they're editing, and PR status without confusion (validated through user feedback or testing)
6. **Workflow Completion**: Users can complete the full workflow (authenticate → select file → edit → save → publish) within 5 minutes for a simple edit

## Assumptions

- Users have GitHub accounts and access to repositories they want to edit
- Repositories contain markdown files (`.md` or `.markdown` extensions)
- Users have appropriate permissions (write access) to create branches and pull requests in target repositories
- GitHub OAuth application is registered and configured with correct redirect URIs
- GitHub API is available and accessible (no corporate firewalls blocking api.github.com)
- Users have modern browsers supporting Fetch API and sessionStorage/localStorage
- OAuth tokens are treated as sensitive and stored securely (not exposed in console logs or URLs)
- Users understand pull request concepts (or are willing to learn through workflow)
- Repository default branch is `main` or `master` (common convention)
- Marky application is served over HTTPS (required for OAuth redirect URIs)

## Edge Cases

1. **Very Large Markdown Files**
   - Files exceeding 1MB may cause performance issues in editor
   - GitHub API has file size limits (1MB for content API, 100MB for Git blob API)
   - Application should warn user if file exceeds recommended size (1MB) before loading
   - Consider lazy loading or pagination for very large files

2. **Binary or Non-Text Content in Markdown**
   - Markdown files may contain embedded images as Base64 data URIs
   - Large embedded images increase file size significantly
   - Application should handle Base64 decoding gracefully
   - Warn users if file size will exceed GitHub limits after editing

3. **Concurrent Edits by Multiple Users**
   - Two users editing the same file simultaneously via Marky or GitHub web UI
   - User A creates PR, User B creates separate PR for same file
   - Merge conflicts likely when publishing
   - Application detects conflicts during merge and guides user to resolve on GitHub
   - No real-time collaborative editing (out of scope)

4. **Token Expiration Mid-Workflow**
   - OAuth token expires while user is editing (before saving)
   - Save operation fails with authentication error
   - Application detects 401 Unauthorized response
   - Prompts user to re-authenticate
   - After re-authentication, retry save operation automatically
   - Preserve user's unsaved edits in editor during re-authentication

5. **Repository Branch Protection Rules**
   - Target branch has protection requiring reviews, status checks, or specific merge strategies
   - User attempts to merge PR directly
   - GitHub API returns error indicating protection rules
   - Application informs user: "This repository requires code review. Your PR is ready for review: [link]"
   - Publish button disabled or changes to "View PR" link

6. **Rate Limiting**
   - GitHub API rate limits: 5,000 requests/hour for authenticated users
   - Heavy usage (many saves, file browsing) may approach limits
   - Application monitors rate limit headers in API responses
   - Warns user if approaching limit: "Approaching GitHub API rate limit. [X] requests remaining."
   - Suggests waiting or reducing frequency of saves

7. **Forked Repositories and Permissions**
   - User wants to edit file in repository they don't have write access to
   - GitHub requires forking repository to create PR from fork
   - Application detects permission error (403 Forbidden)
   - Informs user: "You don't have write access. Fork this repository first on GitHub."
   - Optionally: implement automatic forking workflow (advanced, may be out of scope)

8. **Network Interruptions**
   - User loses internet connection while editing
   - Save or publish operation fails with network error
   - Application detects network error (fetch rejection, timeout)
   - Displays user-friendly message: "Network error. Check your connection and try again."
   - Unsaved edits remain in editor
   - Retry option provided when connection restored

9. **PR Already Merged or Closed Externally**
   - User creates PR via Marky
   - Another user merges or closes the PR on GitHub
   - User attempts to save more commits or publish from Marky
   - API returns error (PR closed or not found)
   - Application detects PR state and informs user: "This PR was already merged/closed. Start a new edit session."
   - Clear session state and allow user to create new PR

## Out of Scope

The following are explicitly NOT included in this feature:

- Real-time collaborative editing (multiple users editing same file simultaneously with live updates)
- Automatic conflict resolution or merge conflict editor within Marky
- Editing non-markdown files (code, images, JSON, etc.)
- Creating new files or uploading files to repository (only editing existing markdown files)
- Deleting or renaming files in repository
- Managing multiple PRs simultaneously in UI (one active PR per session)
- Syncing theme preference or editor settings to GitHub
- GitHub Issues, Discussions, or Wiki integration
- Commenting on PRs or reviewing other users' PRs
- Forking repositories automatically (user must fork manually if needed)
- GitHub Enterprise Server support (only GitHub.com)
- Fine-grained permission controls (admin vs. write vs. read separation)
- Branch creation for purposes other than PR workflow
- Direct commits to base branch (all edits go through PR workflow for safety)

## Dependencies

- **GitHub OAuth Application**: Application must be registered on GitHub with appropriate redirect URIs and requested scopes
- **GitHub API Access**: Reliable access to GitHub REST API v3 or GraphQL API
- **HTTPS Hosting**: Application must be served over HTTPS for OAuth redirect URIs
- **Modern Browser APIs**: Fetch API, Promises, sessionStorage/localStorage support
- **Existing Editor Functionality**: WYSIWYG editor must support loading and editing markdown content (already implemented)
- **Authentication Library (Optional)**: May use library like `octokit.js` for simplified GitHub API interactions
