# GitHub Issues: Autonomous Fixing Workflow

When a user mentions a GitHub issue, don't just track it -- autonomously create a test, run it, analyze, fix, and verify.

## 1. Autonomous Workflow Overview

The full 8-step process:

1. **Fetch** issue from GitHub
2. **Store** locally in `.tsty/issues/`
3. **Pre-flight** -- analyze issue type (bug, feature, UI, interaction)
4. **Create flow** at `.tsty/flows/issue-{number}-{slug}.json` -- use reusable actions (e.g., `"actions": ["login"]`) instead of inlining common sequences
5. **Validate flow** (no `--issue` flag) -- run to verify selectors and navigation work correctly. Fix any flow issues (wrong URL, broken selectors) and re-run until screenshots show the actual buggy page.
6. **Set reference** with `--issue` flag -- once the bug is visually confirmed in screenshots, run with `--issue` to link the flow and set the reference run
7. **Analyze & Fix** -- read ALL screenshots, identify root cause, apply code changes
8. **Re-run & Compare** -- run again with `--issue` flag, read screenshots from BOTH runs, verify improvement
9. **Tag** -- add the `maybe-fixed` label: `gh issue edit <number> --add-label maybe-fixed`. Do NOT close or comment on the issue. Summarize the fix and visual verification results to the user

## 2. Phase 1: Fetch & Understand

```bash
gh issue view <number> --repo <owner/repo> --json title,body,labels,number
```

Save output to `.tsty/issues/<number>.json`.

### Download issue screenshots

If the issue body contains image URLs (common in bug reports), download and read them:

1. **Extract image URLs** from the issue body (look for `![...](...)`  markdown images or `<img src="...">` HTML tags)
2. **Download** each image with authentication (GitHub-hosted images return 404 without it):
   ```bash
   curl -sL -H "Authorization: token $(gh auth token)" "<image-url>" -o .tsty/issues/<number>-1.png
   curl -sL -H "Authorization: token $(gh auth token)" "<image-url>" -o .tsty/issues/<number>-2.png
   ```
3. **Read the images** visually using the Read tool to understand exactly what the bug looks like

These screenshots are often the most precise description of the bug — they show exactly what's wrong and where on the page. Use them to:
- Identify the affected page/component
- Understand the visual symptom (layout issue, wrong data, missing element, etc.)
- Write more accurate flow selectors targeting the right area

### Classify the issue

Read the saved file and classify the issue:
- **Bug report** -- create test that reproduces the bug
- **Feature request** -- create test for expected behavior
- **UI issue** -- create visual test with screenshots
- **Interaction issue** -- create user flow test

## 3. Phase 2: Create Flow

**Naming convention:** `issue-{number}-{slug}.json`
**Location:** `.tsty/flows/issue-{number}-{slug}.json`

**Use reusable actions** for common sequences like login. Create actions in `.tsty/actions/` (e.g., `login.action.json`) and reference them with `"actions": ["login"]` in steps.

Template:

```json
{
  "name": "Issue #{number}: {title}",
  "description": "Test to reproduce issue #{number} - {description}",
  "baseUrl": "http://localhost:3000",
  "failFast": true,
  "monitorConsole": false,
  "steps": [
    {
      "name": "Login",
      "url": "/login",
      "actions": ["login"],
      "primitives": [
        { "type": "waitForLoadState", "options": { "state": "networkidle" } }
      ]
    },
    {
      "name": "Navigate to affected page",
      "url": "/path",
      "capture": { "screenshot": true },
      "primitives": [
        { "type": "waitForLoadState", "options": { "state": "networkidle" } }
      ]
    },
    {
      "name": "Reproduce the issue",
      "primitives": [
        { "type": "fill", "selector": "input[name='field']", "value": "test" },
        { "type": "click", "selector": "button:has-text('Submit')" },
        { "type": "waitForTimeout", "timeout": 1000 }
      ],
      "capture": { "screenshot": true }
    }
  ]
}
```

Always set `failFast: true` and `monitorConsole: false` for issue flows.

**Selector discovery tip**: If unsure about selectors, add `"capture": { "html": true, "screenshot": true }` on the navigation step first, run the flow, then read the captured HTML to find correct selectors before adding interaction steps.

## 4. Phase 3: Validate Flow (no --issue flag)

**First, validate that the flow reaches the correct page and selectors work.** Do NOT use `--issue` yet:

```bash
tsty run issue-{number}-{slug} --fail-fast --no-monitor
```

Check screenshots to verify:
- The flow navigated to the correct page (not a 404 or error page)
- Selectors matched the expected elements
- The buggy behavior is visible in screenshots

If the flow has issues (wrong URL, broken selectors), fix the flow JSON and re-run until it reliably reaches the buggy page.

## 5. Phase 4: Set Reference Run (with --issue flag)

**Once the bug is visually confirmed** in screenshots, set the reference:

```bash
tsty run issue-{number}-{slug} --fail-fast --no-monitor --issue {number}
```

This automatically:
1. **Links** the flow to the issue (`linkedFlowId` + `status: linked`)
2. **Sets the reference run** (`referenceRunId` + `status: testing`)

The CLI output will confirm:

```
🔗 Auto-linked issue #42 to flow: issue-42-checkout-submit
📌 Auto-set reference run for issue #42: issue-42-checkout-submit-1771094164532
   Status: testing
   Next: fix the code, then re-run to compare before/after
```

**CRITICAL**: This step MUST happen BEFORE any code changes. The reference run captures the bug as-is. If you already fixed the code, there's no "before" to compare against.

> **Manual alternative**: You can also use `--mark-reference` to mark any previous run as the reference, or use `tsty issue link` and `tsty issue set-reference` separately.

## 6. Phase 5: Analyze & Fix

### Read screenshots (mandatory, do not skip)

```bash
ls -1 .tsty/screenshots/<runId>/*.png
```

Then read EVERY screenshot:
```
Read .tsty/screenshots/<runId>/1-step-name.png
Read .tsty/screenshots/<runId>/2-step-name.png
```

### Technical analysis

1. Read report: `.tsty/reports/flow-issue-{number}-*.json`
2. Check console errors in report
3. Identify failure type:
   - Selector timeout -- element missing or wrong selector
   - Assertion failed -- expected behavior not happening
   - Console error -- JavaScript bug
   - Visual issue -- CSS/layout problem

### Fix the code

Based on visual + technical analysis, identify the affected files and apply fixes using the Edit tool.

Iterate if needed: fix, re-run, analyze, fix again (up to 3 attempts).

## 7. Phase 6: Verify Fix

### Re-run

```bash
tsty run issue-{number}-{slug} --fail-fast --no-monitor --issue {number}
```

On subsequent runs, the `--issue` flag detects the reference already exists and tells you to compare:

### Compare before/after screenshots

```bash
# List BEFORE screenshots
ls -1 .tsty/screenshots/<referenceRunId>/*.png

# List AFTER screenshots
ls -1 .tsty/screenshots/<newRunId>/*.png
```

Read screenshots from BOTH runs and compare:

```
# BEFORE
Read .tsty/screenshots/<referenceRunId>/1-step-name.png

# AFTER
Read .tsty/screenshots/<newRunId>/1-step-name.png
```

### Visual verification checklist

- What was wrong in BEFORE?
- What changed in AFTER?
- Is the issue fixed visually?
- Would a user see the improvement?

**If passes AND screenshots show improvement:** Issue fixed. Ready for commit/PR.

**If passes BUT screenshots show no change:** Fix didn't work visually. Re-analyze and fix the actual issue.

**If still fails:** Analyze failure, apply additional fixes, re-run.

## 8. Issue Status Progression

| Status | Meaning | Fields Set |
|---|---|---|
| `pending` | Fetched from GitHub, not linked yet | `number`, `title`, `body` |
| `linked` | Linked to test flow, no reference run | + `linkedFlowId` |
| `testing` | Reference run captured, actively testing | + `referenceRunId` |

## 9. Decision Tree

**User says "fix issue #X":**
Full workflow -- fetch, create flow, validate flow (no `--issue`), set reference (`--issue X`), analyze, fix, re-run (`--issue X`), compare.

**User says "test issue #X":**
Partial workflow -- fetch, create flow, validate, run with `--issue X`, analyze. Stop before fixing.

**User says "fetch issue #X":**
Fetch only, then ask: "Should I also create a test flow and attempt to fix it?"

## 10. Troubleshooting

### No comparison data on issue page

Check:
- Is `linkedFlowId` set in `.tsty/issues/{number}.json`?
- Is `referenceRunId` set?
- Does the flow exist at `.tsty/flows/{linkedFlowId}.json`?
- Does the reference run report exist in `.tsty/reports/`?
- Is there at least one additional run after the reference run?

### Screenshots not found

Check:
- Directory exists: `.tsty/screenshots/{runId}/`
- Files exist: `ls .tsty/screenshots/{runId}/*.png`
- RunId format is correct: `run-{flowId}-{timestamp}`

### Test creation fails

- Issue description unclear -- ask user for clarification
- Can't identify affected page/component -- ask user

### Fix doesn't work after 3 attempts

- Provide detailed analysis of findings
- Ask user for guidance on where to look

### Test passes but shouldn't

- Screenshots might show the issue exists but test assertions are wrong
- Re-analyze issue description and adjust the flow assertions
- A passing test does NOT mean the issue is fixed -- always check screenshots
