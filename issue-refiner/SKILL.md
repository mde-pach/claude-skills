---
name: issue-refiner
description: "Read, rewrite, classify, and consolidate GitHub issues into formal, actionable ones. Use when asked to: (1) clean up GitHub issues, (2) refine or rewrite issues, (3) consolidate duplicate issues, (4) triage or classify issues, (5) organize a messy issue backlog, (6) formalize informal bug reports or feature requests. Trigger phrases: 'refine issues', 'clean up issues', 'triage issues', 'rewrite issues', 'organize backlog', 'consolidate issues', 'classify issues'."
---

# Issue Refiner

Batch-process open GitHub issues: group related ones, rewrite them into clean formal issues, and consolidate duplicates — all with user approval before any changes.

## Prerequisites

- `gh` CLI authenticated with the target repository
- Repository must be the current working directory (or user specifies `owner/repo`)

## The `refined` Label

All issues created or rewritten by this skill MUST be tagged with a `refined` label (color: `#0E8A16`, description: "Refined by issue-refiner").

Before processing, ensure the label exists:
```bash
gh label create refined --description "Refined by issue-refiner" --color 0E8A16 --force
```

This allows filtering:
- Show only refined issues: `gh issue list --label refined`
- Exclude refined issues: `gh issue list | grep -v refined` or filter in GitHub UI

When fetching issues in Step 1, **exclude already-refined issues** to avoid reprocessing:
```bash
gh issue list --state open --limit 100 --json number,title,body,labels,assignees,milestone | jq '[.[] | select(.labels | map(.name) | index("refined") | not)]'
```

## Workflow

### Step 1: Fetch all open issues

```bash
gh issue list --state open --limit 100 --json number,title,body,labels,assignees,milestone
```

If the repo has 100+ open issues, paginate or ask the user to narrow scope with labels/milestones.

### Step 2: Analyze and group

Read every issue's title and body. Identify groups by:

- **Duplicates**: Issues describing the same problem (e.g., #73 "Affichage d'une balise html" and #74 "Balise html")
- **Related**: Issues about the same feature area that should be consolidated (e.g., multiple "Settings" bugs → one "Settings module bugs" issue)
- **Standalone**: Unique issues that just need rewriting

For each issue, assign exactly one type label:

| Label | Use when |
|-------|----------|
| `bug` | Something is broken or behaves incorrectly |
| `enhancement` | New feature or improvement to existing behavior |
| `tech-debt` | Code quality, refactoring, cleanup needed |
| `refactor` | Structural code changes without behavior change |
| `docs` | Documentation additions or fixes |
| `ux` | Usability, design, or accessibility improvement |
| `performance` | Speed, memory, or efficiency improvement |

### Step 3: Rewrite each issue/group

For each resulting issue (grouped or standalone), produce:

- **Title**: Short, specific, imperative. Pattern: `[area]: verb + what`. E.g., `settings: fix module toggle not saving changes`
- **Body**: Concise description preserving all original information. Structure:
  - One-line summary of the problem or request
  - Context or steps to reproduce (if bug)
  - Expected behavior (if applicable)
  - `---` separator
  - `Consolidates: #X, #Y, #Z` (if grouping multiple issues)
  - Original screenshots/images carried over

Preserve the language of the original issues (if French, keep French). Do NOT translate.

### Step 4: Present summary for approval

Display a table to the user:

```
## Proposed changes

### New issues to create
| # | Title | Type | Consolidates |
|---|-------|------|-------------|
| 1 | settings: fix module toggle not saving | bug | #60 |
| 2 | settings: fix color picker UX | bug | #61 |
| ...

### Issues to close (replaced by new ones above)
#57, #58, #59, #60, #61 → replaced by new issues #1-#5

### Standalone rewrites (update in place)
| # | Old title | New title | Type |
|---|-----------|-----------|------|
| #55 | Module CSE - Réductions | cse: fix date display when no end date | bug |
```

Ask: "Proceed with these changes? You can ask me to adjust any item before I apply."

### Step 5: Apply changes (only after explicit approval)

For each **consolidated group**:
1. Create the new issue with both the type label and `refined`:
   ```bash
   gh issue create --title "..." --body "..." --label "type" --label "refined"
   ```
2. Close each old issue with a comment referencing the new one:
   ```bash
   gh issue comment OLD_NUMBER --body "Consolidated into #NEW_NUMBER"
   gh issue close OLD_NUMBER --reason "not planned"
   ```

For each **standalone rewrite** (single issue, just needs cleanup):
1. Update the existing issue in place:
   ```bash
   gh issue edit NUMBER --title "new title" --body "new body" --add-label "refined"
   ```
2. Add/update type labels as needed:
   ```bash
   gh issue edit NUMBER --add-label "bug"
   ```

### Step 6: Summary

After all changes are applied, output a final summary:
- Number of new issues created
- Number of old issues closed
- Number of issues rewritten in place
- Link to the repo's issues page

## Important Rules

- NEVER create or close issues without explicit user approval
- Preserve ALL information from original issues (screenshots, links, context)
- Keep the original language — do not translate
- If unsure whether issues are related, keep them separate
- Prefer updating in place over close+create when only one issue is involved
- Use `--reason "not planned"` when closing (not "completed" — the work isn't done)
