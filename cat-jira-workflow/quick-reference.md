---
name: quick-reference
description: One-page quick reference for CAT Jira workflow
---

# CAT Jira Workflow - Quick Reference Card

## At a Glance

| Task | Command | Result |
|---|---|---|
| Create branch | "Create branch for CAT-7387" | Branch created: `feature/CAT-7387/name` |
| Create PR | "Create PR for CAT-7387" | PR created + Jira updated |
| View branch format | Reference below | `<type>/<ticket-id>/<name>` |

---

## Branch Types

| Jira Type | Branch Type | Example |
|---|---|---|
| Story, Task, Epic | `feature` | `feature/CAT-7387/cursor` |
| Bug | `bugfix` | `bugfix/CAT-7386/timeout` |
| Hotfix | `hotfix` | `hotfix/CAT-7999/security` |
| Refactoring | `refactor` | `refactor/CAT-7385/api` |

---

## 2-Minute Workflow

### Creating a Branch

```bash
# Step 1: Ask the skill
"Create branch for CAT-7387"

# Skill does:
# 1. Jira MCP fetches ticket details
# 2. Determines branch type from issue type
# 3. Generates name from ticket title
# 4. Runs: git checkout main
# 5. Runs: git pull origin main
# 6. Runs: git checkout -b feature/CAT-7387/name
# Result: Branch created ✓
```

### Creating a PR

```bash
# Step 1: Commit and prepare
git add .
git commit -m "Your changes"

# Step 2: Ask the skill
"Create PR for CAT-7387"

# Skill does:
# 1. Pushes branch to remote
# 2. GitHub MCP creates PR
# 3. Jira MCP adds comment with PR link
# Result: PR created + Jira updated ✓
```

---

## PR Title Format

```
[TICKET-ID] Descriptive Title
[CAT-7387] Add cursor commands
```

---

## Issue Type → Branch Type Mapping

Quick lookup table:

```
Jira "Story"         → branch "feature"
Jira "Task"          → branch "feature"
Jira "Epic"          → branch "feature"
Jira "Bug"           → branch "bugfix"
Jira "Hotfix"        → branch "hotfix"
Jira "Refactoring"   → branch "refactor"
```

---

## CloudId Reference

```
CAT Team Workspace: 389d08fd-1f5e-4728-ad08-318b482dc29f
```

---

## MCP Tools Used

| Tool | Purpose |
|---|---|
| `mcp_Atlassian-MCP-Server_getJiraIssue` | Fetch ticket details (type, title) |
| `mcp_Atlassian-MCP-Server_addCommentToJiraIssue` | Add PR link to ticket |
| `mcp_github_create_pull_request` | Create PR on GitHub |

---

## Common Commands

```bash
# View what will be committed
git status

# View commits to be in PR
git log main..HEAD

# Push branch
git push -u origin <branch-name>

# Switch to main
git checkout main

# Pull latest main
git pull origin main
```

---

## Checklist Before Creating PR

- [ ] All changes committed
- [ ] Branch pushed to remote
- [ ] Tests pass locally
- [ ] No conflicts with main
- [ ] Ready for review

---

## After PR Created

- [ ] Verify PR link in Jira comment
- [ ] Review appears on GitHub
- [ ] Share with team for review
- [ ] Address review comments
- [ ] Merge when approved

---

## Troubleshooting Quick Fixes

| Issue | Fix |
|---|---|
| Branch name too long | Keep 3-4 words max |
| Forgot to push | `git push -u origin <branch-name>` |
| PR not linking to Jira | Skill handles automatically |
| Merge conflicts | Rebase on main before PR |
| Branch already exists | Use different ticket ID |

---

## Files Reference

| File | Contains |
|---|---|
| `SKILL.md` | Complete workflow instructions |
| `mcp-reference.md` | MCP tool details and parameters |
| `examples.md` | 4 real-world workflow examples |
| `quick-reference.md` | This file (1-page lookup) |
| `README.md` | Setup guide and overview |

---

## Key Points to Remember

✓ **Ticket ID required**: Always provide CAT ticket number  
✓ **Jira MCP automatic**: Skill automatically fetches type and title  
✓ **Branch format fixed**: `<type>/<ticket-id>/<description>`  
✓ **PR links Jira**: Skill automatically updates Jira with PR link  
✓ **Main always updated**: Skill ensures you're on latest main before branching  

---

## Getting Help

- Full details: See `SKILL.md`
- MCP parameters: See `mcp-reference.md`
- Real examples: See `examples.md`
- Setup: See `README.md`

---

**Print this page for your desk!** 📌
