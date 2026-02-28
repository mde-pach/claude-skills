---
name: cat-jira-workflow
description: Automate CAT team Jira workflows including branch creation and pull requests. Integrates with Jira MCP for ticket details and GitHub MCP for PR management. Use when creating branches for CAT tickets (CAT- prefix), creating pull requests, or working with Jira issues. Trigger phrases include "create branch", "create PR", "CAT ticket", or when given a Jira ticket ID.
---

# CAT Jira Workflow

## Quick Start

This skill automates two workflows for CAT team tickets:

1. **Create Branch**: Fetch Jira details → Generate branch name → Create and checkout branch
2. **Create PR**: Run project tests → Run project linter → Build project → Push changes → Create PR with GitHub MCP → Update Jira ticket with link

### Key Principle: Stack-Agnostic

This workflow is **agnostic of the underlying technology stack**. It automatically detects and uses:
- Whatever **test framework** the project uses (pytest, unittest, etc.)
- Whatever **linter/code quality tool** the project uses (flake8, ruff, pylint, biome, etc.)
- Whatever **build system** the project uses (docker-compose, docker, make, etc.)

### Required MCP Tools

- **Jira MCP**: Fetch ticket details, add comments to issues
- **GitHub MCP**: Create pull requests

---

## Workflow 1: Create Branch

### Overview

Create a new branch from main based on a Jira ticket using MCP-fetched details.

### Steps

**Step 1: Fetch Jira Ticket Details**
- Use `mcp_Atlassian-MCP-Server_getJiraIssue` tool
- Extract ticket ID from user input (e.g., `CAT-7387`)
- Use cloudId: `389d08fd-1f5e-4728-ad08-318b482dc29f`
- Extract: issue type and title/summary

**Step 2: Determine Branch Type**

Map Jira issue type to branch type:

| Jira Issue Type | Branch Type |
|---|---|
| Story, Task, Epic | `feature` |
| Bug | `bugfix` |
| Hotfix | `hotfix` |
| Refactoring | `refactor` |
| Any other | `feature` |

**Step 3: Generate Descriptive Name**

From Jira title:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters
- Keep 3-4 words max
- Example: "AI Driven pull request creation" → `cursor-commands`

**Step 4: Update Main Branch**

```bash
git checkout main
git fetch origin
git pull origin main
```

**Step 5: Create New Branch**

```bash
git checkout -b <type>/<ticket-id>/<description>
```

Format: `<branch-type>/<ticket-id>/<descriptive-name>`

Example: `feature/CAT-7387/jira-workflow-automation`

### Validation Checklist

- ✅ Jira MCP used to fetch ticket details
- ✅ Main branch is up to date
- ✅ New branch created with format: `<type>/<ticket-id>/<description>`
- ✅ New branch is checked out

---

## Workflow 2: Create PR

### Overview

Create a well-structured pull request and update Jira ticket with link.

### Prerequisites

- Branch is created and checked out
- All changes are committed locally
- All tests pass (using project's test framework)
- Linter/code quality checks pass (using project's tools)
- Project builds successfully (using project's build system)
- Ready to push to remote

### Steps

**Step 1: Run Project Tests**

Run the project's test suite. The command varies by framework.


**Ensure all tests pass**. If any tests fail:
1. Review the failure output
2. Fix the issue in your code
3. Re-run tests to verify fix
4. Commit the changes: `git commit -m "Fix: [description]"`
5. Then proceed to quality checks

**Step 2: Run Project Linter/Code Quality**

Run the project's linter or code quality tool. The command varies by framework.

**Verify no errors**. If errors exist:
1. Review the linter output
2. Fix the issues in your code
3. Re-run linter to verify
4. Commit the changes
5. Then proceed to build

**Step 3: Build Project**

Run the project's build system:

Run the project's build system. The command varies by framework and stack.

**Ensure build succeeds**. If build fails:
1. Review build logs
2. Fix the underlying issue
3. Re-run build to verify
4. Commit the changes

**Step 4: Prepare Branch**

```bash
git push -u origin <branch-name>
git log main..HEAD  # Get commits for PR description
```

**Step 5: Write PR Description**

Structure your description with:

1. **Overview**: 1-2 sentence summary of changes
2. **Changes by Category**: Group changes (e.g., Components, Configuration, Testing)
3. **Related Jira Ticket**: Link to the original ticket
4. **Breaking Changes**: List any if applicable
5. **Testing**: How to test these changes

Use the PR template below as reference.

**Step 6: Create PR Using GitHub MCP**

- Use `mcp_github_create_pull_request` tool
- Title format: `[TICKET-ID] Descriptive Title`
- Include comprehensive description (see template)
- GitHub MCP response includes: PR number, URL, and details

**Step 7: Update Jira Using Jira MCP**

- Extract ticket ID from branch name (e.g., `CAT-7387`)
- Use `mcp_Atlassian-MCP-Server_addCommentToJiraIssue` tool
- Use cloudId: `389d08fd-1f5e-4728-ad08-318b482dc29f`
- Add comment with:
  - PR link (from GitHub MCP response)
  - Summary of changes
  - Testing notes

Use Jira markdown formatting: `*bold*`, `_italic_`, `----`

### PR Description Template

```markdown
## Overview
[1-2 sentence summary]

## Changes
### Components
- [Change 1]
- [Change 2]

### Configuration
- [Change 1]

### Testing
- [Testing approach]

## Related
- Jira: [TICKET-ID link or reference]

## Checklist
- [x] All tests pass
- [x] Linter checks pass
- [x] Project builds successfully
- [x] All changes committed and pushed
- [x] PR created with GitHub MCP
- [x] Jira ticket updated with PR link
```

### Validation Checklist

- ✅ All project tests pass
- ✅ Linter/code quality checks pass
- ✅ Project builds successfully
- ✅ All changes are committed and pushed
- ✅ GitHub MCP used to create PR (MANDATORY)
- ✅ Jira MCP used to update ticket (MANDATORY)
- ✅ PR title includes ticket ID
- ✅ Jira ticket has comment with PR link
- ✅ All changes are included in PR

---

## Quality Checks - Discovery Strategy

### Detecting Project Tools

The workflow auto-detects tools based on project configuration:

**Python Projects:**
- Test framework: `pytest` in requirements.txt → use `pytest`, else try `python -m unittest`
- Linter: Look for `.flake8`, `.pylintrc`, `pyproject.toml` → use appropriate tool
- Build: `Dockerfile` → use `docker-compose build` or `docker build`

**Node/JavaScript Projects:**
- Test framework: `npm test` or `yarn test` from package.json
- Linter: `eslint`, `biome`, or `prettier` in devDependencies
- Build: `npm run build` or `yarn build`

**Multi-language Projects:**
- Check Makefile for `test`, `lint`, `build` targets
- Check tox.ini for test environments
- Check project README or documentation

### Test Execution

**On Success:**
- All tests pass ✅
- Proceed to linter checks

**On Failure:**
- Review test output for root cause
- Fix the issue
- Run tests again
- Commit fix: `git commit -m "Fix: [test failure description]"`

### Linter Execution

**On Success:**
- No style or quality issues ✅
- Proceed to build checks

**On Failure:**
- Review linter output
- Fix style/quality issues
- Run linter again
- Commit fixes: `git commit -m "Style: [linter fixes]"`

### Build Execution

**On Success:**
- Project builds cleanly ✅
- Ready to push and create PR

**On Failure:**
- Review build logs
- Fix compilation/dependency issues
- Run build again
- Commit fixes: `git commit -m "Fix: [build issue]"`

---

## Exit Strategy

If any quality check fails:
1. **Review** error messages carefully to understand the issue
2. **Fix** the underlying problem in your code or configuration
3. **Commit** the fix: `git commit -m "Fix: [specific issue]"`
4. **Re-run** the failed check to verify fix
5. **Iterate** until all checks pass
6. **Proceed** with PR creation only after all checks pass

---

## MCP Integration Details

### Jira MCP Configuration

**Get Ticket Details**:
```
mcp_Atlassian-MCP-Server_getJiraIssue
- cloudId: 389d08fd-1f5e-4728-ad08-318b482dc29f
- issueIdOrKey: <ticket-id> (e.g., CAT-7387)
```

Response includes: `issueType`, `summary`, `description`, `status`

**Add Comment to Ticket**:
```
mcp_Atlassian-MCP-Server_addCommentToJiraIssue
- cloudId: 389d08fd-1f5e-4728-ad08-318b482dc29f
- issueIdOrKey: <ticket-id>
- body: <your comment in Jira markdown>
```

### GitHub MCP Configuration

**Create Pull Request**:
```
mcp_github_create_pull_request
- owner: <repo-owner>
- repo: <repo-name>
- title: [TICKET-ID] Your title
- head: <your-branch-name>
- base: main
- body: <PR description>
```

Response includes: `number`, `url`, `pull_request`

---

## Example Workflow

**Scenario**: Create branch and PR for CAT-7387

### Create Branch

1. User provides: `CAT-7387`
2. Fetch ticket → Title: "Upgrade Python to 3.9"
3. Issue type: Task → Branch type: `feature`
4. Generate name: `upgrade-python`
5. Update main: `git pull origin main`
6. Create branch: `git checkout -b feature/CAT-7387/upgrade-python`

### Create PR

1. User makes changes and commits locally
2. Run tests: `pytest` (all pass ✅)
3. Run linter: `flake8 .` (no issues ✅)
4. Build: `docker-compose build web` (success ✅)
5. Push: `git push -u origin feature/CAT-7387/upgrade-python`
6. Get commits: `git log main..HEAD`
7. GitHub MCP: Create PR titled `[CAT-7387] Upgrade Python to 3.9`
8. Jira MCP: Add comment with PR link and summary
9. Result: PR created with verified quality checks, Jira updated with link

---

## Quick Reference

### Branch Naming
```
<type>/<ticket-id>/<description>
feature/CAT-7387/upgrade-python
bugfix/CAT-7386/fix-login-issue
```

### PR Title
```
[TICKET-ID] Descriptive Title
[CAT-7387] Upgrade Python to 3.9
```

### Jira CloudId
```
389d08fd-1f5e-4728-ad08-318b482dc29f
```

### Common Commands (Python Example)

Create branch:
```bash
git checkout -b feature/CAT-XXXX/description
```

Run tests:
```bash
pytest                  # pytest
python -m unittest     # unittest
```

Run linter:
```bash
flake8 .              # PEP 8
pylint .             # code analyzer
ruff check .         # fast linter
```

Build project:
```bash
docker-compose build         # Docker Compose
docker build ./web -t app   # Docker
python setup.py build       # Python
```

Push and set upstream:
```bash
git push -u origin feature/CAT-XXXX/description
```

View commits for PR:
```bash
git log main..HEAD
```
