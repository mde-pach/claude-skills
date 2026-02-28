# Analysis Guide

Consolidated reference for analyzing test results: reports, screenshots, console logs, assertions, and verification.

---

## 1. Analysis Overview

### When to Analyze

| Situation | Action |
|-----------|--------|
| Test failed | Analyze all screenshots and report |
| First time seeing this page | Full analysis (understand layout) |
| Visual changes expected | Analyze to verify changes worked |
| Before committing a fix | Compare before/after screenshots |
| Test passed + seen before + no changes | Skip analysis (list files only) |

### Analysis Levels

- **Skip** - Test passed, seen before, no visual changes. Just list filenames.
- **Quick glance** - Test passed, minor change verification. Read only the critical screenshot, one-sentence observation.
- **Full analysis** - Test failed, first time viewing, before/after comparison. Read all screenshots with detailed observations.

### Priority Order

Always analyze in this order:
1. Console errors (blocking)
2. Selector issues (blocking)
3. Assertion failures (blocking)
4. Visual/layout bugs (polish)
5. UX improvements (note for later)

---

## 2. Report Analysis

**Read:** `.tsty/reports/flow-{id}-{timestamp}.json`

### Key Report Fields

```json
{
  "success": false,
  "error": "Step 2 failed: Timeout 30000ms exceeded",
  "stoppedEarly": true,
  "stopReason": "Navigation failed - expected URL not reached",
  "duration": 90000,
  "runId": "run-my-test-1738843200000",
  "screenshotDir": ".tsty/screenshots/run-my-test-1738843200000",
  "steps": [{
    "stepIndex": 0,
    "stepName": "Load homepage",
    "success": true,
    "duration": 2500,
    "screenshot": "1-load-homepage.png",
    "console": [{ "type": "error", "text": "...", "timestamp": "..." }],
    "consoleErrors": 1,
    "navigationFailed": false,
    "assertions": [{ "type": "visible", "selector": "h1", "passed": true }]
  }]
}
```

### What to Check

1. `success` - false = flow failed
2. `error` - root cause message
3. `stoppedEarly` / `stopReason` - fail-fast stopped the flow
4. `steps[].success` and `steps[].error` - which step failed and why
5. `steps[].console` and `steps[].consoleErrors` - JavaScript errors
6. `steps[].navigationFailed` - URL didn't match expectedUrl
7. `steps[].assertions` - failed validations
8. `duration` - >5s per step warrants investigation

### Common Errors Table

| Error | Cause | Fix |
|-------|-------|-----|
| `Timeout exceeded` | Selector not found | Check selector, increase timeout |
| `Element not found` | Selector doesn't match DOM | Verify selector against screenshot/HTML |
| `Cannot read property X of null` | JS error in app code | Fix null access in app code |
| `net::ERR_*` | Network/API issues | Fix backend or mock |
| `Navigation failed` | URL doesn't match expectedUrl | Verify expectedUrl |
| `Console errors detected` | JS errors preventing load | Check steps[].console |
| Flow stopped early | Fail-fast triggered | Check stopReason |

---

## 3. Screenshot Analysis

**Location:** `.tsty/screenshots/run-{id}-{timestamp}/`

Screenshots are numbered: `1-step-name.png`, `2-step-name.png`, etc.

### Core Principle

Analyze what IS visible, not what SHOULD be visible. Don't speculate about states not shown, different viewports, or implementation details.

### Two-Tier Reporting Format

```
Critical Issues (N) - Layout bugs, must fix

1. [Issue name]
   Current: [What's wrong]
   Expected: [What it should be]

---

UX Improvements (N) - Working but could be better

2. [Issue name]
   Current: [Current state]
   Improvement: [How to improve]
```

### Progressive Analysis Levels

**Level 1: Structural Integrity (check first)**
- Content overflowing beyond container backgrounds
- Background boxes smaller than their content
- Z-index/overlap problems (content behind backgrounds)
- Distorted or stretched components, broken borders

**Level 2: Layout and Alignment**
- Misaligned elements, uneven columns/rows
- Inconsistent spacing between similar elements
- Broken flex/grid layouts
- Poor visual grouping of related items

**Level 3: Visual Polish**
- Text too small (<16px body, <14px labels)
- Poor contrast (<4.5:1 for text per WCAG AA)
- No clear visual hierarchy
- Unintentional text truncation

**Level 4: UX and Usability**
- Touch targets <44x44px
- Technical IDs shown instead of friendly names
- Missing loading/error states
- Unclear interactive elements

### Scanning Method

1. **Outer to Inner** - Viewport, sections, components, details
2. **Top to Bottom** - Header, content, sidebars, footer, floating elements
3. **Question-Based** - "Is this complete? Aligned? Readable? Clear?"

### Screenshot Checklist

- [ ] All content contained within visible backgrounds/borders?
- [ ] No elements incorrectly overlapping?
- [ ] Similar elements aligned consistently?
- [ ] Consistent gaps between similar elements?
- [ ] Body text >= 16px, labels >= 14px?
- [ ] Text contrast >= 4.5:1?
- [ ] Clear primary action visible?
- [ ] User-friendly labels (not technical IDs)?

---

## 4. Console Log Analysis

**Source:** `steps[].console` in report (structured: type, text, timestamp)

### Log Types

| Type | Severity | Action |
|------|----------|--------|
| `error` | Must fix | Fix app code |
| `warning` | Should fix | Improve code quality |
| `info` | Ignore | Informational only |
| `log` | Ignore | Debug output |

### JavaScript Error Patterns

| Error Pattern | Meaning | Fix |
|---------------|---------|-----|
| `Uncaught TypeError` | Null/undefined access | Add null checks |
| `Uncaught ReferenceError` | Missing variable/function | Define or import |
| `Uncaught SyntaxError` | Code syntax error | Fix syntax |
| `Failed to load resource` | Missing file/API | Check path/endpoint |

### Network Error Patterns

| Error Pattern | Meaning | Fix |
|---------------|---------|-----|
| `net::ERR_CONNECTION_REFUSED` | Server not running | Start server |
| `404 Not Found` | Missing resource | Check URL, add resource |
| `500 Internal Server Error` | Backend error | Fix backend code |

### React/Framework Warnings

| Warning Pattern | Fix |
|-----------------|-----|
| `Each child should have a unique "key" prop` | Add unique key to list items |
| `Cannot update component while rendering` | Move state update to useEffect |
| `validateDOMNesting` | Fix HTML nesting |
| `Missing dependency in useEffect` | Add to deps or use useCallback |

---

## 5. Assertion Analysis

**Source:** `steps[].assertions` in report

### Assertion Types

| Type | Pass Condition |
|------|----------------|
| `visible` | Element exists and is visible |
| `text` | Text matches (exact or substring) |
| `count` | Element count matches expected |
| `attribute` | Attribute exists with expected value |

### Common Failures

| Error | Cause | Fix |
|-------|-------|-----|
| `Element not found` | Wrong selector or missing element | Check screenshot, verify selector |
| `Expected text "X" but got "Y"` | Content mismatch | Update expected text or fix app |
| `Expected 5 elements but found 3` | Count mismatch | Fix app rendering |
| `Attribute not found` | Missing attribute | Add attribute or update assertion |

### Fix Process

1. Check screenshot - is element actually visible?
2. Verify selector against actual DOM
3. Add explicit wait if element loads asynchronously
4. Check console logs for JS errors hiding the element

---

## 6. Verification Checklist

### Ground Truth Rule

```
Exit code 0 = Playwright didn't crash
Screenshot unchanged = Feature is broken

Exit code 0 does NOT mean the feature works.
Screenshots are ground truth.
```

### Outcome Verification (do first)

- [ ] **UI changed as expected** - Compare before/after screenshots
- [ ] **Visual feedback appeared** - Success messages, badges, counts updated
- [ ] **No unexpected states** - No error messages, no stuck loading, no empty states
- [ ] **Created files have content** - Not empty or incomplete
- [ ] **User interaction had visible effect** - Something changed on screen

### False Success Detection

If test passed but screenshot shows no change from before:
- This is a bug in the application (99% of cases)
- Not a test issue, not a timing issue
- Read the component code, find the missing handler, fix it

Example:
```
Test mechanics: ALL PASSED
Created artifact: EXISTS

But:
  File content: EMPTY (expected data missing)
  Screenshot: UNCHANGED from before
  UI state: NO VISIBLE DIFFERENCE

Conclusion: Test ran but FEATURE FAILED. Investigate app code.
```

### Before/After Comparison

When verifying a fix:
1. Read screenshots from the run BEFORE the fix
2. Read screenshots from the run AFTER the fix
3. Document specific visual differences
4. Only commit if changes are visually confirmed

If screenshots look the same after your fix:
- Don't commit - the fix didn't work
- Check: wrong component? Code didn't apply? Need rebuild? Logic error?
- Fix and re-run until screenshots show the change

### Before Moving to Next Test

- [ ] Current flow exits with code 0
- [ ] All screenshots look correct
- [ ] No console errors in any step
- [ ] Visual issues documented (even if not fixed yet)

---

## 7. Analysis Examples

### Console Error: TypeError

**Report:** `consoleErrors: 1`, console shows `TypeError: Cannot read property 'map' of undefined at Dashboard.tsx:45`

**Analysis:**
```
CRITICAL: JavaScript error detected
Error: TypeError at Dashboard.tsx:45 - mapping over undefined array
Fix: Add null check (data?.map()) or loading state
Action: Fix application code, not test. Re-run to verify consoleErrors = 0.
```

### Selector Mismatch

**Report:** `Timeout 30000ms exceeded waiting for selector: button:has-text('Create')`
**Screenshot shows:** Button with text "Create New Action"

**Analysis:**
```
Selector mismatch
Expected: button:has-text('Create')
Actual: Button shows "Create New Action"
Fix: Update selector to "button:has-text('Create New Action')"
Action: Fix test selector.
```

### Visual Bug: Layout Overlap

**Screenshot shows:** Text overlapping with image in hero section

**Analysis:**
```
Layout bug (Critical)
Issue: Hero text overlaps image on mobile viewport
Impact: Text unreadable
Fix: Add gap or margin in Hero component CSS
Action: Fix application layout, re-run to verify screenshot.
```

### Success with UX Note

**Report:** `success: true`, all `consoleErrors: 0`
**Screenshots:** Functional but spacing inconsistent

**Analysis:**
```
Test passed successfully
Console errors: 0, Assertions: all passed, Screenshots: functional

UX Note (non-blocking):
- Card spacing inconsistent (12px vs 16px), standardize to 16px

Status: COMPLETE. Note UX improvement for later, move to next test.
```

### False Success Detected

**Report:** `success: true`
**Screenshot:** Identical to before clicking "Add" button

**Analysis:**
```
FALSE SUCCESS: Test passed but feature didn't work
Exit code 0 but screenshot shows no change after "Add" click
Likely cause: Missing onClick handler on the button component
Action: Read component code, find missing handler, fix app, re-run.
```

### Multiple Issues (Prioritize)

**Report:** Step 1 has `consoleErrors: 1` (TypeError), Step 2 has selector timeout
**Screenshot:** Button shows "Continue" not "Next"

**Analysis:**
```
Priority 1: Fix console error first (TypeError: null reference)
Priority 2: Fix selector after console error resolved ("Next" vs "Continue")

Order: Fix P1, re-run, then check if P2 still exists.
```

---

## 8. Quick Error Reference Table

| See This | Check | Then |
|----------|-------|------|
| `success: false` | `error` field | Read root cause message |
| `stoppedEarly: true` | `stopReason` | Understand why flow stopped |
| Step failed | `steps[].error` | Read step-specific error |
| High duration (>5s) | `steps[].duration` | Investigate performance |
| `consoleErrors > 0` | `steps[].console` | Read and fix JS errors |
| `navigationFailed` | expectedUrl vs actual | Fix navigation or URL |
| `passed: false` | `steps[].assertions` | Check which assertions failed |
| Empty screenshot | Flow crashed | Check report errors before step |
| Screenshot unchanged | App bug | Read component code, find missing handler |

### Analysis Workflow

```
1. Read report -> Find failed step
2. Check step error -> Understand what failed
3. View screenshot -> See visual state at failure
4. Check console logs -> See JavaScript errors
5. Check assertions -> See what validation failed
6. Prioritize: Console errors > Selectors > Assertions > Visual > UX
7. Fix highest priority, re-run, repeat
```
