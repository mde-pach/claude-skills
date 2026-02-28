# Iteration Guide

Fast, reliable test development through micro-iteration, fail-fast execution, and HTML-first discovery.

---

## 1. Micro-Iteration (The Iron Rule)

**Never have more than 1 untested interaction.**

| Approach | Time to Working Test | Debug Time | Success Rate |
|----------|---------------------|------------|--------------|
| All-at-once (9 actions upfront) | 45-90 min | 30-60 min | 40% |
| Micro-iteration (1 at a time) | 10-15 min | 2-5 min | 95% |

### Incorrect: All-at-Once

```bash
# Create 5 actions without testing any
echo '{...}' > fill-name.action.json
echo '{...}' > fill-email.action.json
echo '{...}' > fill-password.action.json
echo '{...}' > click-submit.action.json
echo '{...}' > verify-success.action.json

# Create big flow referencing all 5
echo '{...}' > complete-login-flow.json

tsty run complete-login-flow --fail-fast
# Step 2 fails: "Selector not found: input[name='email']"
# Steps 3-5 also fail. Which selector is wrong? Did step 1 even work?
# Spend 30+ minutes debugging...
```

### Correct: One Action at a Time

```bash
# Test 1: Fill name (2 steps, 15s)
echo '{...}' > fill-name.action.json
tsty run test-fill-name --fail-fast
# Works! Continue...

# Test 2: Fill email (3 steps, 18s) - includes fill-name
echo '{...}' > fill-email.action.json
tsty run test-fill-email --fail-fast
# Fails: wrong selector. Fix: use input[placeholder='Email']
# Re-run: Works!

# Test 3: Fill password (4 steps, 20s) - builds on 1+2
# ...continue until full flow works

# Total time: ~10 minutes, each failure isolated and fixed immediately
```

---

## 2. The Micro-Iteration Pattern

### Step 1: Discovery (Navigate + Capture HTML)

```json
{
  "name": "discover-page",
  "baseUrl": "http://localhost:4000",
  "failFast": true,
  "monitorConsole": true,
  "steps": [{
    "name": "Load page",
    "url": "/actions",
    "expectedUrl": "/actions",
    "capture": { "screenshot": true, "html": true }
  }]
}
```

```bash
tsty run discover-page --fail-fast  # 15-20 seconds
```

Check results in this order:
1. **Exit code** (0 = success, 1 = fail)
2. **Console errors**: If `consoleErrors > 0`, STOP and fix code
3. **HTML from report**: Extract exact selectors
4. **Screenshot**: Visual verification only

### Step 2: Extract Selectors from HTML

Read `steps[0].html` from the report. Look for:
- `data-testid="..."` (best)
- `placeholder="..."` (inputs)
- `name="..."` (form fields)
- `aria-label="..."` (accessibility)
- Text content (buttons, links)

### Step 3: Create ONE Action

```json
{
  "type": "interaction",
  "description": "Click New Action button",
  "primitives": [
    { "type": "click", "selector": "button:has-text('New Action')" },
    { "type": "waitForLoadState", "options": { "state": "networkidle" } }
  ]
}
```

### Step 4: Test in 2-Step Flow

```json
{
  "name": "test-click-new-action",
  "baseUrl": "http://localhost:4000",
  "failFast": true,
  "monitorConsole": true,
  "steps": [
    { "name": "Navigate", "url": "/actions", "capture": { "screenshot": true } },
    { "name": "Test click", "actions": ["click-new-action"], "capture": { "screenshot": true } }
  ]
}
```

```bash
tsty run test-click-new-action --fail-fast  # 20-25 seconds
```

### Step 5: Analyze and Decide

- Exit 0 + screenshot correct: create next action
- `consoleErrors > 0`: STOP, fix code, re-run
- Selector failed: fix selector, re-run same test
- Unexpected result: analyze screenshot, investigate

### Step 6: Repeat

Once the action works, create the next one. Test in a flow that includes all previous working actions plus the new one.

---

## 3. Fail-Fast Mode

**Always use `--fail-fast` during development.**

### How It Works

#### On Navigation Steps (with monitorConsole)

```
1. Navigate to URL
2. Wait for load state
3. Check console for errors
4. consoleErrors > 0? --> STOP immediately, exit 1
5. No errors? --> Continue to next step
```

#### On Action Steps

```
1. Execute primitives/actions
2. Check step success
3. Step failed? --> STOP immediately, exit 1
4. Step passed? --> Continue
```

### Real-World Benefit: 83% Time Savings

**Without fail-fast** (page has JS error):
```
Step 1: Load page --> JS error (ignored)     5s
Step 2: Click button --> Fails (page broken) 15s
Step 3: Fill form --> Fails                  15s
...
Step 6: Verify --> Fails                     15s
Total: 80 seconds, 5 failures, 1 root cause
```

**With fail-fast**:
```
Step 1: Load page --> JS error detected --> STOP
Total: 15 seconds, 1 failure, 1 root cause
```

### Checking stopReason

When a flow stops early, the report contains:

```json
{
  "success": false,
  "stoppedEarly": true,
  "stopReason": "Console errors detected on navigation step",
  "steps": [{
    "stepIndex": 0,
    "success": false,
    "consoleErrors": 1,
    "console": [{
      "type": "error",
      "text": "Uncaught TypeError: Cannot read property 'length' of undefined"
    }]
  }]
}
```

Action: fix the TypeError in app code, re-run.

### When NOT to Use Fail-Fast

- Need to see ALL failures in one run
- Testing multiple independent features
- Building a complete coverage report

Default: `false` for backward compatibility. Always pass `--fail-fast` explicitly.

---

## 4. HTML-First Discovery

**Extract selectors from HTML, not screenshots.** Faster, exact, no guessing.

### Workflow

1. **Capture HTML** in a discovery flow (`capture: { html: true }`)
2. **Read HTML from report**: `steps[0].html`
3. **Extract selectors** from actual DOM attributes
4. **Create action** with validated selectors
5. **Test** in a 2-step micro-iteration flow

### Example

From captured HTML:
```html
<button data-action="create" class="btn-primary">New Action</button>
<input name="actionName" placeholder="Enter action name" />
<textarea name="description" placeholder="Description" />
```

Extracted selectors (exact, no guessing):
- Button: `[data-action="create"]` or `button:has-text('New Action')`
- Name input: `input[name="actionName"]`
- Description: `textarea[name="description"]`

### Screenshot-Based vs HTML-First

| Method | Time | Accuracy |
|--------|------|----------|
| Screenshot (guess selectors, iterate) | 15-20 min | Low (multiple retries) |
| HTML-first (exact selectors) | 3-4 min | High (works first try) |

Use screenshots only for visual layout verification, not selector discovery.

---

## 5. Speed Optimizations

### Minimize Screenshots

Navigate directly to the target page instead of stepping through intermediate pages:

```json
// Instead of 3 steps with 3 screenshots:
{ "steps": [
  { "url": "/", "capture": { "screenshot": true } },
  { "url": "/issues", "capture": { "screenshot": true } },
  { "url": "/issues/1", "capture": { "screenshot": true } }
]}

// Use 1 step:
{ "steps": [
  { "url": "/issues/1", "capture": { "screenshot": true } }
]}
```

Savings: 40% faster execution, fewer tokens if screenshots are analyzed.

### Skip Unnecessary Waits

```json
// Instead of:
{ "type": "waitForLoadState", "options": { "state": "networkidle" } },
{ "type": "waitForTimeout", "timeout": 2000 }

// Use:
{ "type": "waitForLoadState", "options": { "state": "domcontentloaded" } }
```

Savings: 2-3 seconds per step.

### Batch Assertions

When verifying multiple elements on one page, use one step with multiple assertions instead of separate flows:

```json
{
  "name": "Check all features",
  "url": "/page",
  "assertions": [
    { "type": "visible", "selector": "text=Feature 1" },
    { "type": "visible", "selector": "text=Feature 2" },
    { "type": "visible", "selector": "text=Feature 3" }
  ]
}
```

---

## 6. Quick-Check Patterns

### After Each Action Creation

1. Create action file
2. Test in 2-step flow (navigate + action): `tsty run test-action --fail-fast`
3. Check exit code
4. If exit 1: read report, check `steps[].consoleErrors`
5. View screenshot: did the action produce the expected result?

**Decision:**
- Exit 0 + screenshot correct --> create next action
- `consoleErrors > 0` --> STOP, fix code, re-run
- Selector failed --> fix selector, re-run
- Unexpected visual result --> investigate component code

### After Each Flow Run

1. Check exit code (0 = pass, 1 = fail)
2. If fail: read report, check `stoppedEarly` and `stopReason`
3. View screenshots in `.tsty/screenshots/run-*/`
4. Check console logs in `steps[].console`

**Decision:**
- Exit 0 --> success, move on
- JS error --> fix code, re-run
- Selector error --> fix selector in action, re-run
- Navigation failed --> update `expectedUrl` or fix routing
- Assertion failed --> update assertion or fix app

---

## 7. Decision Trees

### STOP and Fix Immediately

These are blocking issues. Do not create more actions or flows until resolved.

```
Console errors detected (consoleErrors > 0)
  --> Always fix code first, then re-run

Page blank/crashed (screenshot shows empty page)
  --> Check console logs, fix JS error

JavaScript runtime error (TypeError, ReferenceError)
  --> Fix immediately in app code, re-run

Navigation failed + page crashed
  --> Fix code causing crash
```

### Continue (Fix Flow, Not App Code)

These are flow/selector issues, not application bugs.

```
Selector not found
  --> Check screenshot, update selector to match actual DOM

Assertion failed
  --> Check if expectation is wrong, update assertion

Timeout (but page loaded)
  --> Increase timeout or add explicit wait

Network error (non-blocking, like ads/analytics)
  --> Ignore if not affecting functionality
```

### Priority Order

1. **Console errors** (blocking) - fix code
2. **Page crashes** (blocking) - fix code
3. **Navigation failures** (blocking) - fix flow or code
4. **Action failures** (blocking) - fix selectors or code
5. **Assertion failures** (validation) - fix assertions or app
6. **Visual issues** (polish) - fix CSS/layout
