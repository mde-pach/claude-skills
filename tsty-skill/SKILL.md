---
name: tsty
description: "Autonomous E2E visual QA testing framework. Fixes GitHub issues end-to-end: fetch → create flow → run → analyze screenshots → fix code → re-run → compare visually. Use for: testing/verifying UI and web apps, fixing GitHub issues, checking layout/visual/styling bugs, running E2E tests, regression testing, debugging UI issues, analyzing screenshots and console logs. Works with any tech stack. Analyzes screenshots visually (not just exit codes), compares before/after, iterates autonomously until visually verified."
---

# Tsty - Visual QA Testing Skill

## Core Principles

**1. Visual verification over exit codes.** A passing test (exit 0) only means Playwright didn't crash. Always check screenshots to confirm features actually work. Screenshots are the source of truth.

**2. Test like a human user.** Use simple selectors: `text=Save`, `placeholder=Email`, `button:has-text(Submit)`. Try click first, then fill, then keyboard. Drag-and-drop and `evaluate` are last resorts. If a simple interaction doesn't work, it's likely an app bug.

**3. Fix bugs, don't work around them.** When a test reveals broken behavior (click does nothing, screenshot unchanged), investigate the component code. ~70% of failures are application bugs (missing handlers, broken logic), not test issues. Fix the app, then re-run.

**4. Micro-iteration.** Test one action at a time. Create action → test in 2-step flow (15s) → verify screenshot → fix if broken → next action. Never have more than 1 untested action.

**5. Autonomous iteration loop.** You are the tester AND the fixer. Don't report failures — fix them. Loop: CREATE → RUN → ANALYZE → FIX → RE-RUN. Exit when: exit code 0 AND screenshots show correct UI AND no console errors.

## Quick Start

```bash
tsty init                              # Create .tsty/ directory
tsty run my-flow --fail-fast           # Run a flow, stop on first failure
tsty list                              # List flows
tsty primitives                        # List all 48 Playwright primitives
tsty --help                            # Full CLI reference
```

**Basic workflow:**
1. `tsty init` → creates `.tsty/` with config and subdirectories
2. Create a flow JSON in `.tsty/flows/`
3. `tsty run flow-name --fail-fast --no-monitor`
4. Check screenshots: `ls .tsty/screenshots/run-*/*.png` → Read PNGs
5. If issues: fix code → re-run → verify screenshots improved

## The Iteration Loop

```
CREATE flow/action → RUN (tsty run X --fail-fast) → ANALYZE screenshots
  ↓                                                       ↓
  ←←←←←←←←←←←← FIX code/selectors ←←←←←←←←←←←←← Issues found?
                                                    ↓ No
                                                   DONE
```

**What to fix based on failure type:**
- Console errors → Fix **application code** (JS bugs in .tsx/.ts files)
- Selector timeouts → Fix **test selectors** (wrong selector in flow JSON)
- Visual bugs → Fix **application CSS/layout**
- Screenshot unchanged after action → Fix **app event handlers** (missing onClick, etc.)

**When to stop:** Exit code 0 + screenshots show expected UI + no console errors in report.

> Details: [iteration.md](references/iteration.md)

## GitHub Issue Fixing

When asked to fix a GitHub issue, follow the full autonomous workflow:

1. **Fetch**: `gh issue view <number> --repo owner/repo --json title,body,labels,number` → save to `.tsty/issues/<number>.json`. If the issue body contains image URLs (screenshots of the bug), download them with auth: `curl -sL -H "Authorization: token $(gh auth token)" "<url>" -o .tsty/issues/<number>-<index>.png` (GitHub-hosted images return 404 without authentication). Read them visually to understand the bug before creating the flow.
2. **Create flow**: `.tsty/flows/issue-{number}-{slug}.json` targeting the affected page. Use reusable actions (e.g., `"actions": ["login"]`) instead of inlining common sequences — see [Reusable Actions](#reusable-actions).
3. **Validate flow** (no `--issue` flag): `tsty run issue-N-slug --fail-fast --no-monitor` — verify the flow reaches the correct page and selectors work. If the flow hits a wrong URL or broken selectors, fix the flow first and re-run until screenshots show the actual buggy page.
4. **Set reference**: Once screenshots clearly show the bug, mark this run as the reference: `tsty run issue-N-slug --fail-fast --no-monitor --issue <number>`. The `--issue` flag links the flow to the issue and sets the reference run.
5. **Analyze**: Read ALL screenshots from `.tsty/screenshots/<runId>/` → identify root cause
6. **Fix code**: Edit application files based on visual + technical analysis
7. **Re-run & compare**: `tsty run issue-N-slug --fail-fast --no-monitor --issue <number>` → on subsequent runs, the CLI detects the reference already exists and tells you to compare before/after
8. **Tag**: Add the `maybe-fixed` label to the issue: `gh issue edit <number> --add-label maybe-fixed`. Do NOT close or comment on the issue. Summarize the fix and visual verification results to the user.

**CRITICAL: Steps 3-4 MUST happen BEFORE any code changes.** The reference run must capture the bug as it exists in the codebase. If you fix code first and then create the flow, there's no "before" screenshot to compare against.

**Flow naming**: `issue-{number}-{2-4 word slug}` (e.g., `issue-42-checkout-submit.json`)

> Complete workflow: [github-issues.md](references/github-issues.md)

## Reusable Actions

**ALWAYS use reusable actions for repeated sequences** (login, navigation patterns, common form interactions). Actions live in `.tsty/actions/` as `.action.json` files and are referenced by name in flow steps.

**Login action** — Create once, use in every authenticated flow:

`.tsty/actions/login.action.json`:
```json
{
  "type": "auth",
  "description": "Login using credentials from config",
  "primitives": [
    { "type": "fill", "selector": "input[name='email']", "value": "${credentials.email}" },
    { "type": "fill", "selector": "input[name='password']", "value": "${credentials.password}" },
    { "type": "click", "selector": "button[type='submit']" },
    { "type": "waitForTimeout", "timeout": 5000 }
  ]
}
```

**Using actions in flows:**
```json
{
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
      "url": "/target-page",
      "capture": { "screenshot": true }
    }
  ]
}
```

This replaces 15+ lines of duplicated login primitives with a single `"actions": ["login"]` reference. Credentials come from `.tsty/config.json`.

```bash
tsty list actions    # List all available actions
```

> See [examples.md](references/examples.md) for more action patterns.

## Selector Discovery with HTML Capture

When building a new flow and unsure about selectors, **capture the page HTML first** to inspect the actual DOM:

```json
{
  "steps": [
    {
      "name": "Discover page structure",
      "url": "/target-page",
      "capture": { "html": true, "screenshot": true },
      "primitives": [
        { "type": "waitForLoadState", "options": { "state": "networkidle" } }
      ]
    }
  ]
}
```

After running, read the captured HTML from the report to find correct selectors (element IDs, text content, ARIA labels, data attributes). Then update the flow with validated selectors.

This avoids trial-and-error with guessed selectors that waste runs.

## Flow Structure

```json
{
  "name": "Test Feature",
  "baseUrl": "http://localhost:3000",
  "failFast": true,
  "monitorConsole": false,
  "playwright": { "headless": true, "timeout": 30000 },
  "steps": [
    {
      "name": "Load page",
      "url": "/path",
      "capture": { "screenshot": true },
      "primitives": [
        { "type": "waitForLoadState", "options": { "state": "networkidle" } }
      ]
    },
    {
      "name": "Interact",
      "primitives": [
        { "type": "click", "selector": "text=Button" },
        { "type": "fill", "selector": "placeholder=Email", "value": "test@test.com" }
      ],
      "capture": { "screenshot": true }
    }
  ]
}
```

**Key fields:** `url` (navigate), `primitives` (inline actions), `actions` (reference action files), `expectedUrl` (URL assertion), `capture` (screenshots/HTML), `assertions` (element assertions).

> Full schema: [flow-structure.md](references/flow-structure.md)

## Essential CLI

```bash
# Running tests
tsty run <flow> --fail-fast              # Stop on first failure
tsty run <flow> --fail-fast --no-monitor # Skip console monitoring (for dev servers)
tsty run <flow> --device mobile          # Mobile viewport
tsty run <flow> --mark-reference         # Mark run as baseline for comparison
tsty run <flow> --issue <number>         # Auto-link flow to issue + set reference on first run

# Listing & info
tsty list                                # List flows
tsty list actions                        # List user-created actions
tsty primitives                          # All 48 Playwright primitives
tsty primitives <category>              # By category (mouse, input, etc.)
tsty --help                              # Full CLI reference

# Screenshots
ls .tsty/screenshots/run-<flow>-<ts>/    # List screenshots from a run

# Dashboard
tsty                                     # Start visual dashboard (localhost:4000)
```

## Pre-Flight Checks

Before running tests, verify the target server is healthy:

```bash
# 1. Check server is running
lsof -i :3000 || echo "Server not running!"

# 2. Check for build errors
curl -s http://localhost:3000 | grep -q "Runtime Error\|Failed to compile" && echo "SERVER HAS ERRORS" || echo "SERVER OK"

# 3. Quick health check flow
tsty run _health-check --fail-fast --no-monitor
# Then read the screenshot to verify it shows a working page, not an error
```

If server has build errors, fix them before running tests. A test can "pass" against an error page.

> Details: [preflight.md](references/preflight.md)

## Testing Dev Servers

Dev servers produce expected console noise (HMR, source map 404s, React DevTools). Use `--no-monitor` to prevent false failures:

```bash
# Dev environment (lenient)
tsty run my-flow --fail-fast --no-monitor

# Production/CI (strict)
tsty run my-flow --fail-fast
# (monitorConsole defaults to true in flow JSON)
```

**Rule of thumb**: If tests fail due to 404s or HMR messages → add `--no-monitor`.

## Screenshot Analysis

After every test run:

1. **List screenshots**: `ls -1 .tsty/screenshots/run-<id>/*.png`
2. **Read critical ones**: Use the Read tool on PNG files to see what the UI actually shows
3. **Compare before/after** (for fixes): Read screenshots from both runs, verify visual improvement
4. **Only commit when screenshots confirm the fix worked**

Strategic analysis — skip detailed analysis when: test passed, you've seen this page before, and no visual changes expected. Always analyze when: test failed, first time seeing a page, or before committing a fix.

> Full methodology: [analysis.md](references/analysis.md)

## Variable Interpolation

Use `${variable}` syntax in action values:

- **Built-in**: `${timestamp}`, `${datetime}`, `${baseUrl}`, `${credentials.email}`
- **Faker.js**: `${faker.person.fullName}`, `${faker.internet.email}`, `${faker.location.city}`

> Full reference: [variables.md](references/variables.md)

## Configuration

`.tsty/config.json`:
```json
{
  "baseUrl": "http://localhost:3000",
  "credentials": { "email": "test@example.com", "password": "pass" },
  "playwright": { "headless": true, "timeout": 30000 }
}
```

Always use `headless: true` for autonomous testing. Only set `false` for manual debugging.

> Full options: [config.md](references/config.md)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No configuration file" | Run `tsty init` |
| Port conflict | `tsty --port 3001` |
| Flow not found | Check `tsty list` or `ls .tsty/flows/` |
| Playwright not installed | `npx playwright install chromium` |
| Timeout errors | Check selectors, add `waitForLoadState` |

> More: [troubleshooting.md](references/troubleshooting.md)

## Reference Index

**When you need to...**

| Task | Reference |
|------|-----------|
| Understand the iteration workflow | [iteration.md](references/iteration.md) |
| Fix a GitHub issue end-to-end | [github-issues.md](references/github-issues.md) |
| Analyze screenshots & reports | [analysis.md](references/analysis.md) |
| Investigate & fix bugs found in tests | [bug-fixing.md](references/bug-fixing.md) |
| Write your first E2E test | [testing-guide.md](references/testing-guide.md) |
| Run pre-flight health checks | [preflight.md](references/preflight.md) |
| Decide: action vs primitives, what to fix | [decisions.md](references/decisions.md) |
| Check visual/UX quality patterns | [visual-quality.md](references/visual-quality.md) |
| Look up flow JSON schema | [flow-structure.md](references/flow-structure.md) |
| Find selector patterns | [selectors.md](references/selectors.md) |
| Write assertions | [assertions.md](references/assertions.md) |
| Use variables & Faker.js | [variables.md](references/variables.md) |
| See real-world examples | [examples.md](references/examples.md) |
| Configure .tsty/config.json | [config.md](references/config.md) |
| Debug common problems | [troubleshooting.md](references/troubleshooting.md) |

**CLI is self-documenting**: Run `tsty --help` for full command reference, `tsty primitives` for all 48 Playwright actions.
