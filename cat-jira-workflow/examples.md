---
name: examples
description: Real-world examples of the CAT Jira workflow
---

# CAT Jira Workflow Examples

## Example 1: Feature Branch with UI Changes

**Scenario**: Creating a branch and PR for a new feature

### Jira Ticket
- **ID**: CAT-7387
- **Type**: Story
- **Title**: "Implement user dashboard redesign"

### Step 1: Create Branch

**Command**: "Create branch for CAT-7387"

**Jira MCP fetches**:
- Type: Story → Branch type: `feature`
- Title: "Implement user dashboard redesign" → `user-dashboard-redesign`

**Git commands**:
```bash
git checkout main
git fetch origin
git pull origin main
git checkout -b feature/CAT-7387/user-dashboard-redesign
```

**Result**: ✓ Branch `feature/CAT-7387/user-dashboard-redesign` created and checked out

---

### Step 2: Create PR

**After making changes and committing**:

**Command**: "Create PR for CAT-7387"

**Git commands**:
```bash
git push -u origin feature/CAT-7387/user-dashboard-redesign
git log main..HEAD
```

**GitHub MCP creates PR**:
```
Title: [CAT-7387] Implement user dashboard redesign

Body:
## Overview
Redesigned the user dashboard with improved UX and modern UI components.

## Changes
### Components
- Updated Dashboard.tsx with new layout structure
- Created DashboardCard.tsx for card components
- Added responsive grid system

### Styling
- Updated Tailwind configuration for theme
- Added custom CSS variables for dark mode support

### Testing
- Added unit tests for Dashboard component
- Verified responsive breakpoints (mobile, tablet, desktop)
- Manual testing on Chrome, Firefox, Safari

## Related
- Jira: CAT-7387

## Checklist
- [x] All changes committed and pushed
- [x] PR created with GitHub MCP
- [x] Jira ticket updated with PR link
- [x] Unit tests pass
- [x] Manual testing completed
```

**GitHub MCP response**:
```
PR Number: 456
URL: https://github.com/souscritoo/cat-operations/pull/456
```

**Jira MCP adds comment**:
```
Body: *PR Created!*

[View Pull Request|https://github.com/souscritoo/cat-operations/pull/456]

*Summary of changes:*
- Redesigned dashboard with improved UX
- Updated components with modern styling
- Added responsive design support

*Testing notes:*
- All unit tests pass ✓
- Responsive design verified across devices ✓
- Browser compatibility checked ✓

----
_Comment added automatically by Cursor workflow_
```

**Result**: ✓ PR created, Jira ticket updated with PR link

---

## Example 2: Bug Fix Branch

**Scenario**: Quick bug fix for production issue

### Jira Ticket
- **ID**: CAT-7386
- **Type**: Bug
- **Title**: "Fix login timeout validation"

### Step 1: Create Branch

**Command**: "Create branch for CAT-7386"

**Jira MCP fetches**:
- Type: Bug → Branch type: `bugfix`
- Title: "Fix login timeout validation" → `login-timeout-validation`

**Git commands**:
```bash
git checkout main
git fetch origin
git pull origin main
git checkout -b bugfix/CAT-7386/login-timeout-validation
```

**Result**: ✓ Branch `bugfix/CAT-7386/login-timeout-validation` created

---

### Step 2: Create PR

**Command**: "Create PR for CAT-7386"

**GitHub MCP creates PR**:
```
Title: [CAT-7386] Fix login timeout validation

Body:
## Overview
Fixes issue where login form incorrectly validates timeout values, causing false validation errors.

## Changes
### Bug Fix
- Updated timeout validation regex in AuthService.ts
- Added bounds checking for timeout values (0-3600 seconds)
- Fixed off-by-one error in timeout calculation

### Testing
- Added unit test for timeout validation edge cases
- Verified fix with manual testing

## Related
- Jira: CAT-7386
```

**Jira MCP adds comment**:
```
Body: *PR Ready for Review*

[View Pull Request|https://github.com/souscritoo/cat-operations/pull/457]

*Changes:*
- Fixed timeout validation logic
- Added input bounds checking

*Testing:*
- Edge cases validated ✓
- Manual testing passed ✓
```

---

## Example 3: Refactoring Task

**Scenario**: Code refactoring task

### Jira Ticket
- **ID**: CAT-7385
- **Type**: Refactoring
- **Title**: "Refactor API client module"

### Step 1: Create Branch

**Command**: "Create branch for CAT-7385"

**Jira MCP fetches**:
- Type: Refactoring → Branch type: `refactor`
- Title: "Refactor API client module" → `api-client-refactor`

**Git commands**:
```bash
git checkout main
git fetch origin
git pull origin main
git checkout -b refactor/CAT-7385/api-client-refactor
```

---

### Step 2: Create PR

**Command**: "Create PR for CAT-7385"

**GitHub MCP creates PR**:
```
Title: [CAT-7385] Refactor API client module

Body:
## Overview
Simplified API client architecture by consolidating duplicate code and improving error handling.

## Changes
### Refactoring
- Extracted common request logic into BaseApiClient class
- Removed 400+ lines of duplicate code
- Improved error handling with centralized error mapper

### Testing
- All existing tests pass without modification
- Added new tests for error scenarios
- No breaking changes to public API

## Related
- Jira: CAT-7385

## Breaking Changes
None - this is a pure refactoring with backward-compatible changes.
```

---

## Example 4: Chore Task (Documentation)

**Scenario**: Update documentation

### Jira Ticket
- **ID**: CAT-7384
- **Type**: Task
- **Title**: "Update API documentation"

### Step 1: Create Branch

**Command**: "Create branch for CAT-7384"

**Jira MCP fetches**:
- Type: Task → Branch type: `feature` (default for tasks)
- Title: "Update API documentation" → `api-documentation-update`

**Git commands**:
```bash
git checkout main
git fetch origin
git pull origin main
git checkout -b feature/CAT-7384/api-documentation-update
```

---

## Quick Reference: Issue Type Mapping

| Jira Type | Branch Type | Example Branch |
|---|---|---|
| Story | `feature` | `feature/CAT-7387/user-dashboard` |
| Task | `feature` | `feature/CAT-7384/api-docs` |
| Epic | `feature` | `feature/CAT-7400/platform-upgrade` |
| Bug | `bugfix` | `bugfix/CAT-7386/login-timeout` |
| Hotfix | `hotfix` | `hotfix/CAT-7999/critical-security` |
| Refactoring | `refactor` | `refactor/CAT-7385/api-client` |

---

## Common Patterns

### PR Title Format
Always use: `[TICKET-ID] Descriptive Title`

✓ `[CAT-7387] Implement user dashboard redesign`
✓ `[CAT-7386] Fix login timeout validation`
✗ `WIP: Dashboard`
✗ `Update stuff`

### PR Description Structure
1. **Overview** - 1-2 sentence summary
2. **Changes** - Grouped by category (Components, Config, Testing, etc.)
3. **Related** - Link to Jira ticket
4. **Checklist** - Items verified before submission

### Jira Comment with PR Link
Format: `*Bold text* and [Link|URL]`

```
*PR Created!*

[View Pull Request|https://github.com/souscritoo/cat-operations/pull/456]

*Changes:*
- Item 1
- Item 2

*Testing:*
- Unit tests pass ✓
- Manual testing verified ✓
```

---

## Troubleshooting Examples

### Issue: Branch name has too many words

**Bad**: `feature/CAT-7387/implement-user-dashboard-redesign-with-new-components-and-styling`

**Good**: `feature/CAT-7387/user-dashboard-redesign`

**Fix**: Keep descriptive name to 3-4 words max

---

### Issue: PR description is too minimal

**Bad**:
```
Added dashboard improvements
```

**Good**:
```
## Overview
Redesigned dashboard with improved UX and performance optimizations.

## Changes
### Components
- Updated Dashboard.tsx layout
- Created new DashboardCard component

### Performance
- Optimized re-renders with React.memo
- Added virtualization for large lists

## Testing
- Unit tests pass
- Manual testing verified across devices
```

---

### Issue: Forgot to link Jira ticket in PR

**Solution**: Use Jira MCP to add comment with PR link after PR creation

**Command**: "Add PR link to CAT-7387"

**Jira MCP adds comment**:
```
[View Pull Request|https://github.com/souscritoo/cat-operations/pull/456]
```
