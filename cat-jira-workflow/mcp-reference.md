---
name: mcp-reference
description: Detailed MCP tool specifications and parameters
---

# MCP Tool Reference

## Jira MCP Tools

### getJiraIssue

**Purpose**: Fetch details from a Jira ticket

**Tool name**: `mcp_Atlassian-MCP-Server_getJiraIssue`

**Parameters**:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `cloudId` | string | Yes | Jira cloud instance ID: `389d08fd-1f5e-4728-ad08-318b482dc29f` |
| `issueIdOrKey` | string | Yes | Ticket ID or key (e.g., `CAT-7387`) |

**Response includes**:
- `key`: Ticket ID (e.g., `CAT-7387`)
- `fields.issuetype.name`: Issue type (Story, Task, Bug, etc.)
- `fields.summary`: Title/summary of the ticket
- `fields.description`: Detailed description
- `fields.status.name`: Current status
- `fields.assignee`: Assigned user details

**Example**:
```
Tool: mcp_Atlassian-MCP-Server_getJiraIssue
cloudId: 389d08fd-1f5e-4728-ad08-318b482dc29f
issueIdOrKey: CAT-7387
```

---

### addCommentToJiraIssue

**Purpose**: Add a comment to a Jira ticket

**Tool name**: `mcp_Atlassian-MCP-Server_addCommentToJiraIssue`

**Parameters**:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `cloudId` | string | Yes | Jira cloud instance ID: `389d08fd-1f5e-4728-ad08-318b482dc29f` |
| `issueIdOrKey` | string | Yes | Ticket ID or key (e.g., `CAT-7387`) |
| `body` | string | Yes | Comment text (supports Jira markdown) |

**Jira Markdown formatting**:
- Bold: `*text*`
- Italic: `_text_`
- Code: `{{code}}`
- Link: `[text|https://example.com]`
- Horizontal line: `----`

**Example**:
```
Tool: mcp_Atlassian-MCP-Server_addCommentToJiraIssue
cloudId: 389d08fd-1f5e-4728-ad08-318b482dc29f
issueIdOrKey: CAT-7387
body: PR created: [View PR|https://github.com/org/repo/pull/123]
```

---

## GitHub MCP Tools

### create_pull_request

**Purpose**: Create a new pull request on GitHub

**Tool name**: `mcp_github_create_pull_request`

**Parameters**:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `owner` | string | Yes | Repository owner (e.g., `souscritoo`) |
| `repo` | string | Yes | Repository name (e.g., `cat-operations`) |
| `title` | string | Yes | PR title (format: `[TICKET-ID] Title`) |
| `head` | string | Yes | Source branch name (your feature branch) |
| `base` | string | Yes | Target branch (usually `main`) |
| `body` | string | No | PR description (markdown) |

**Response includes**:
- `number`: PR number (e.g., `123`)
- `url`: Full GitHub URL
- `pull_request`: Full PR object with details

**Example**:
```
Tool: mcp_github_create_pull_request
owner: souscritoo
repo: cat-operations
title: [CAT-7387] Add Cursor commands
head: feature/CAT-7387/cursor-commands
base: main
body: ## Overview
This PR adds Cursor commands for automated workflows...
```

---

## CloudId Reference

**Jira Cloud Instance ID**: `389d08fd-1f5e-4728-ad08-318b482dc29f`

This ID is specific to the CAT team's Jira workspace at `souscritoo.atlassian.net`.

---

## Integration Workflow Example

### Complete Branch + PR workflow with MCPs

```
1. USER INPUT: "Create branch for CAT-7387"
   ↓
2. JIRA MCP (getJiraIssue):
   - Fetch ticket CAT-7387
   - Extract: type="Task", summary="Add Cursor commands"
   ↓
3. GENERATE BRANCH NAME:
   - Type: Task → "feature"
   - Name: "cursor-commands"
   - Result: "feature/CAT-7387/cursor-commands"
   ↓
4. GIT COMMANDS:
   - git checkout main
   - git pull origin main
   - git checkout -b feature/CAT-7387/cursor-commands
   ✓ Branch created
   ↓
5. [User makes changes, commits, pushes]
   ↓
6. USER INPUT: "Create PR"
   ↓
7. GIT COMMANDS:
   - git push -u origin feature/CAT-7387/cursor-commands
   - git log main..HEAD (get commits)
   ↓
8. GITHUB MCP (create_pull_request):
   - Create PR with title "[CAT-7387] Add Cursor commands"
   - Include description with all commits
   - Response: PR #123 created
   ↓
9. JIRA MCP (addCommentToJiraIssue):
   - Add comment with PR link
   - Format: "PR created: [View PR|https://github.com/souscritoo/cat-operations/pull/123]"
   ↓
10. ✓ Workflow complete: Branch, PR, and Jira ticket all linked
```

---

## Troubleshooting

### Jira MCP Issues

**Problem**: CloudId not found
- **Solution**: Verify cloudId is `389d08fd-1f5e-4728-ad08-318b482dc29f`

**Problem**: Ticket not found
- **Solution**: Verify ticket ID format (e.g., `CAT-7387`, not `7387`)

**Problem**: Permission denied adding comment
- **Solution**: Check if user account has permission to edit issues in Jira

### GitHub MCP Issues

**Problem**: PR creation fails
- **Solution**: Verify repository owner and name match your setup
- **Solution**: Ensure base branch (`main`) exists

**Problem**: Branch not found
- **Solution**: Verify branch name matches exactly (case-sensitive)
- **Solution**: Ensure branch is pushed to remote

---

## Configuration Checklist

Before using this skill, verify:

- [ ] Jira MCP is enabled in Cursor
- [ ] GitHub MCP is enabled in Cursor
- [ ] CloudId matches: `389d08fd-1f5e-4728-ad08-318b482dc29f`
- [ ] Repository owner/name are correct for your project
- [ ] User has access to both Jira and GitHub
