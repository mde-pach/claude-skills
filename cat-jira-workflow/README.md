# CAT Jira Workflow Skill - Setup Guide

## ✓ Skill Created Successfully

Your **cat-jira-workflow** skill is now installed at:
```
.cursor/skills/cat-jira-workflow/
```

---

## What This Skill Does

Automates workflows for CAT team Jira tickets with two main commands:

### 1. **Create Branch**
- Fetch ticket details from Jira using MCP
- Automatically determine branch type (feature, bugfix, etc.)
- Generate branch name based on ticket title
- Create and checkout branch from main

Example: `Create branch for CAT-7387` → Creates `feature/CAT-7387/cursor-commands`

### 2. **Create PR**
- Push changes to remote
- Create PR on GitHub with comprehensive description
- Automatically add PR link to Jira ticket
- Update Jira with summary and testing notes

---

## How to Use

### Creating a Branch

```
User: "Create branch for CAT-7387"

Skill will:
1. Fetch CAT-7387 details from Jira MCP
2. Extract issue type → determine branch type
3. Extract title → generate descriptive name
4. Update main branch from origin
5. Create and checkout new branch
```

**Result**: New branch ready for development

### Creating a PR

```
User: "Create PR for CAT-7387"

(After committing changes)

Skill will:
1. Push branch to remote
2. GitHub MCP: Create PR with full description
3. Jira MCP: Add comment with PR link and summary
4. Return PR URL for verification
```

**Result**: PR created, Jira ticket linked

---

## Branch Naming Convention

```
<type>/<ticket-id>/<descriptive-name>
```

Examples:
- `feature/CAT-7387/cursor-commands`
- `bugfix/CAT-7386/login-timeout`
- `refactor/CAT-7385/api-client`
- `hotfix/CAT-7999/security-patch`

**Type Mapping:**
| Jira Issue Type | Branch Type |
|---|---|
| Story, Task, Epic | feature |
| Bug | bugfix |
| Hotfix | hotfix |
| Refactoring | refactor |

---

## Files Included

### SKILL.md (Main)
- Quick start guide
- Complete workflow steps
- Validation checklists
- MCP tool parameters
- Jira CloudId reference

### mcp-reference.md (Detailed Reference)
- Full MCP tool specifications
- Parameter details
- Response formats
- Integration workflow example
- Troubleshooting guide

### examples.md (Real-world Examples)
- 4 complete workflow examples (Feature, Bug, Refactor, Task)
- Issue type mapping
- Common patterns and best practices
- Troubleshooting examples

---

## Key Features

✅ **MANDATORY MCP Usage**: Skill requires Jira MCP for ticket details  
✅ **Automatic Branch Naming**: Type determined from Jira issue type  
✅ **PR Automation**: GitHub MCP creates PR with full description  
✅ **Jira Integration**: Automatically updates ticket with PR link  
✅ **Validation**: Built-in checklist for each workflow  
✅ **Examples**: Real-world examples for all issue types  

---

## Important Configuration

### Jira CloudId
```
389d08fd-1f5e-4728-ad08-318b482dc29f
```
This is the CAT team's Jira workspace ID. It's embedded in the skill.

### Repository
- Owner: `souscritoo`
- Repo: `cat-operations`
- Base branch: `main`

---

## Prerequisites

Before using this skill, ensure:

- [ ] Jira MCP is enabled in Cursor
- [ ] GitHub MCP is enabled in Cursor
- [ ] You have access to CAT Jira workspace
- [ ] You have push access to cat-operations repository
- [ ] Git is installed and authenticated

---

## Common Workflows

### Complete Feature Development

```
1. "Create branch for CAT-7387"
   → Skill creates feature/CAT-7387/cursor-commands

2. [Make your changes and commit]

3. "Create PR for CAT-7387"
   → Skill creates PR and updates Jira

4. [Wait for review and merge]

Done! Branch, PR, and Jira all linked.
```

### Quick Bug Fix

```
1. "Create branch for CAT-7386"
   → Skill creates bugfix/CAT-7386/login-timeout

2. [Fix the bug, test, commit]

3. "Create PR for CAT-7386"
   → Skill creates PR with fix details

Done! Bug fix tracked in Jira and GitHub.
```

---

## Getting Help

Each file in the skill contains specific information:

- **"How do I create a branch?"** → See SKILL.md, Workflow 1
- **"What are the MCP parameters?"** → See mcp-reference.md
- **"Show me an example"** → See examples.md
- **"Troubleshooting?"** → See mcp-reference.md or examples.md

---

## Next Steps

1. **Enable MCPs**: Ensure Jira and GitHub MCPs are configured in Cursor
2. **Test**: Try creating a branch for a test CAT ticket
3. **Integrate**: Use the skill in your daily workflow

---

**Skill Location**: `.cursor/skills/cat-jira-workflow/`  
**Scope**: Project-wide (available in this repository)  
**Status**: Ready to use ✓
