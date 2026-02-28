# Testing Guide

## 1. Core Philosophy: HTML-First, Validate, Build

**NEVER guess selectors.** Always extract HTML first for exact selectors.

```
WRONG: Assumption-Based Testing
1. Guess selectors: [data-tab='actions']
2. Create 9-step flow
3. Run -> all fail
4. Debug for 20 minutes
5. Realize UI is completely different

RIGHT: HTML-First Testing
1. Navigate + capture HTML (15s)
2. Extract exact selectors from HTML (30s)
3. Create 1 action with real selectors
4. Test in isolation (15s) -> Works first try
5. Add next action
6. Repeat -> Full E2E passes in 5-10 min
```

---

## 2. HTML-First Discovery Workflow

### Step 1: Capture HTML + Check Console

```json
{
  "name": "discover-html",
  "baseUrl": "http://localhost:4000",
  "failFast": true,
  "monitorConsole": true,
  "steps": [{
    "name": "Load and capture",
    "url": "/actions",
    "expectedUrl": "/actions",
    "capture": { "html": true, "screenshot": true }
  }]
}
```

### Step 2: Check Console FIRST

```bash
cat .tsty/reports/flow-discover-html-*.json | jq '.steps[0].consoleErrors'
```

**If consoleErrors > 0:** STOP. Read the error, fix the JavaScript bug, re-run, verify errors = 0.

**If consoleErrors = 0:** Continue to selector extraction.

### Step 3: Extract Selectors from HTML

```bash
# Extract HTML from report
cat .tsty/reports/flow-discover-html-*.json | jq -r '.steps[0].html' > page.html

# Find selectors (in priority order)
grep -o 'placeholder="[^"]*"' page.html
grep -o 'aria-label="[^"]*"' page.html
grep -o 'name="[^"]*"' page.html
grep -o 'data-testid="[^"]*"' page.html
grep -oP '(?<=<button[^>]*>)[^<]+' page.html
```

### Step 4: Create Action with Validated Selectors

```json
{
  "type": "interaction",
  "description": "Click create button",
  "primitives": [
    { "type": "click", "selector": "[data-action='create']" }
  ]
}
```

### Step 5: Test in Isolation (2-step flow)

Run a minimal flow: navigate + action + screenshot. Check screenshot shows expected result. If not, fix and re-run.

---

## 3. Selector Quality

### Good vs Bad

```json
// GOOD (from HTML):
{ "selector": "input[placeholder='Enter action name']" }
{ "selector": "text=New Action" }
{ "selector": "input[name='actionName']" }

// BAD (guessed):
{ "selector": ".btn-primary" }
{ "selector": "div > div > button:nth-child(2)" }
{ "selector": "text=Create" }  // HTML says "New Action"
{ "selector": "div:has-text('New'):has-text('Action')" }
```

**Real example from testing session:**
```html
<!-- HTML captured -->
<input placeholder="Action name (e.g., Login, Search, Add to cart)" />

CORRECT (exact from HTML):
"selector": "input[placeholder='Action name (e.g., Login, Search, Add to cart)']"

WRONG (guessed):
"selector": "input[type='text']"  // Too generic, multiple matches
"selector": "input[name='name']"  // Field doesn't have name attribute
```

**Rule**: If you didn't see it in the HTML, don't use it.

### Priority Order

| Priority | Selector Type | Example | Why |
|----------|--------------|---------|-----|
| 1 | Visible text | `text=New Action` | Users identify by text |
| 2 | ARIA attributes | `[aria-label='Close dialog']` | Semantic, stable |
| 3 | Placeholder | `input[placeholder*='email' i]` | User-visible hint |
| 4 | Name attribute | `input[name='email']` | Semantic HTML |
| 5 | data-testid | `[data-testid='submit-btn']` | Explicit test hooks |
| 6 | Simple CSS | `button.primary` | Relatively stable |
| AVOID | Complex CSS | `div.container > div:nth-child(3) > input` | Fragile |

---

## 4. Human-Like Interaction

**Core principle:** Test the way a real user would interact.

### Interaction Hierarchy (try in order)

**1. Simple Click** (99% of cases)
```json
{ "type": "click", "selector": "text=Submit" }
{ "type": "click", "selector": "text=Focus" }
{ "type": "click", "selector": "button:has-text('Save')" }
```

**2. Fill/Type** (for inputs)
```json
{ "type": "fill", "selector": "input[placeholder='Email']", "value": "test@example.com" }
```

**3. Keyboard Navigation** (if user would use keyboard)
```json
{ "type": "press", "key": "Enter" }
{ "type": "press", "key": "Tab" }
```

**4. Drag and Drop** (only if clicking doesn't work AND feature requires drag)
```json
{ "type": "dragAndDrop", "source": "text=Item", "target": "text=Drop Zone" }
```

**5. JavaScript Evaluate** (LAST RESORT - usually means there's a bug)
```json
{ "type": "evaluate", "pageFunction": "..." }
```

### The Primitive Click Bug (Key Example)

This real failure from a testing session illustrates why simple interactions matter:

```
Task: Test action creation - add primitive to sequence
Approach: Used complex selector div:has-text('Focus'):has-text('Focus an element')
Then tried: dragAndDrop
Both "worked" but primitive wasn't added

Wrong conclusion: "Playwright/@dnd-kit incompatibility"
Time wasted: 60+ minutes trying workarounds

RIGHT approach (takes 2 minutes):
1. Try: { "type": "click", "selector": "text=Focus" }
2. Test passed but no effect -> FALSE SUCCESS detected
3. Read PrimitiveActionPalette.tsx
4. Find: Missing onClick handler (only useDraggable)
5. Fix: Add onClick to card component
6. Re-test: Now works
```

**The Lesson:** ALWAYS try the simplest interaction first. Read code before assuming framework limitations.

---

## 5. Selector Simplicity Hierarchy

### Level 1: Text-Based (BEST)
```json
"text=Submit"
"text=Add to Cart"
"button:has-text('Save')"
```
Humans identify elements by visible text, not CSS classes.

### Level 2: Semantic Attributes
```json
"placeholder=Email"
"[aria-label='Close dialog']"
"[role='button']"
"[name='username']"
```
User-visible or meaningful attributes.

### Level 3: Simple CSS (when text isn't unique)
```json
"button.primary"
"input[type='email']"
"#submit-button"
```
Relatively stable selectors.

### Level 4: Complex Selectors (AVOID)
```json
"div.container > div.form-group:nth-child(3) > input.form-control"
"div:has-text('Focus'):has-text('Focus an element')"
```
Breaks easily, not how users think.

---

## 6. Building Flows

### URL Behavior

**URL in a step = navigate to that page. No URL = stay on current page.**

```json
{
  "steps": [
    {
      "name": "Navigate to form",
      "url": "http://localhost:4000/form",
      "actions": ["fill-name"]
    },
    {
      "name": "Fill remaining fields",
      "actions": ["fill-email", "fill-description"]
    },
    {
      "name": "Submit",
      "actions": ["click-save"]
    }
  ]
}
```

Only the first step has a `url`. Subsequent steps omit it to stay on the current page.

### Common Mistake: URL in Every Step

```json
// WRONG: Resets to homepage before each step, previous data lost
{
  "steps": [
    { "url": "http://localhost:4000", "actions": ["fill-name"] },
    { "url": "http://localhost:4000", "actions": ["fill-email"] },
    { "url": "http://localhost:4000", "actions": ["submit"] }
  ]
}

// RIGHT: Stays on page, data persists
{
  "steps": [
    { "url": "http://localhost:4000/form", "actions": ["fill-name"] },
    { "actions": ["fill-email"] },
    { "actions": ["submit"] }
  ]
}
```

### Build Incrementally

1. Create action 1 -> test in 2-step flow -> success
2. Create action 2 -> test in 3-step flow -> success
3. Continue adding one action at a time
4. Full E2E runs after all actions validated individually

---

## 7. Common Pitfalls

### Pitfall 1: Guessing Selectors
```json
{ "selector": "[data-tab='actions']" }  // Guessed, doesn't exist
```
**Fix:** Capture HTML first, extract real selectors.

### Pitfall 2: URL in Every Step
Resets page state between steps, losing form data and navigation context.
**Fix:** Only use `url` when intentionally navigating to a new page.

### Pitfall 3: Ignoring Console Errors
```
Step 2: Click button -> JS error in console
Step 3-9: All fail because page crashed
...spend 90 seconds running failing steps
```
**Fix:** STOP on first console error. Fix the JS bug. Re-run from start.

### Pitfall 4: Creating All Actions Upfront
```
Create 9 actions without testing -> Create 9-step flow -> 8 steps fail -> Debug 20 min
```
**Fix:** Create and test one action at a time.

### Pitfall 5: Accepting False Success
```
Test passed but screenshot shows no change -> Move to next test
```
**Fix:** Always verify screenshots show the expected UI change. Test passed does NOT mean feature works.

### Pitfall 6: Over-Engineering Selectors
```json
{ "type": "evaluate", "pageFunction": "document.querySelector('button').click()" }
```
**Fix:** Use `{ "type": "click", "selector": "text=Submit" }` instead. If simple click doesn't work, read the component code - the bug is likely there.

---

## 8. Best Practices Checklist

### Before Creating Tests
- [ ] Create discovery flow (navigate + capture HTML + screenshot)
- [ ] Run discovery, check console errors first
- [ ] Extract exact selectors from captured HTML
- [ ] Document actual selectors (not guessed ones)

### When Creating Actions
- [ ] Start with 1 primitive action
- [ ] Test in isolation (2-step flow: navigate + action)
- [ ] Check screenshot shows expected result
- [ ] Check console logs for errors
- [ ] If errors: STOP, fix, re-run
- [ ] If success: add next action
- [ ] Never create 5+ actions without testing

### When Building Flows
- [ ] Only include `url` in first step (or when navigating to new page)
- [ ] Omit `url` to stay on current page
- [ ] Use validated actions only
- [ ] Start with 2-3 steps, grow incrementally
- [ ] Enable `failFast: true` during development

### When Tests Fail
- [ ] Check exit code
- [ ] View ALL screenshots (not just last one)
- [ ] Read console logs in report JSON
- [ ] If JS error: STOP, fix app code, re-run
- [ ] If selector wrong: check HTML, update selector, re-run
- [ ] If test passes but screenshot wrong: investigate - it's a FALSE SUCCESS
- [ ] Read component code before blaming the framework
