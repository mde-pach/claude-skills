# Decisions Reference

Quick decision trees for test iteration, fixing, and action creation.

---

## 1. Is This Test Actually Successful?

Passing steps does not mean the test succeeded. Verify outcome quality after every run.

```
Exit code?
├─ 1 (failed) → Go to "After Running a Test"
└─ 0 (passed) → Verify outcome quality:
   ├─ Screenshot shows expected UI changes?
   │  └─ NO (looks identical) → INVESTIGATE
   ├─ Created files have expected content?
   │  └─ NO (empty arrays, missing fields) → INVESTIGATE
   ├─ Counts/badges/metrics updated?
   │  └─ NO (unchanged) → INVESTIGATE
   └─ Would a real user be satisfied?
      ├─ YES → TRUE SUCCESS
      └─ NO → FALSE SUCCESS → INVESTIGATE

INVESTIGATE:
1. Try 3+ alternative selectors/interactions
2. Read component code for missing handlers
3. If all fail → Report to user with evidence
```

---

## 2. After Running a Test

Immediate decision tree after `tsty run` completes.

```
Exit code 0?
├─ YES → View screenshots
│  ├─ Critical bugs (broken layout, missing elements) → Fix, re-run
│  ├─ Minor UX issues (spacing, colors) → Note, move on
│  └─ No issues → DONE or create next test
│
└─ NO (exit 1) → Check report:
   ├─ consoleErrors > 0?
   │  └─ YES → Read console log → Fix app code → Re-run same test
   │
   ├─ stoppedEarly + stopReason?
   │  ├─ "Console errors detected" → Fix app code
   │  ├─ "Navigation failed" → Fix expectedUrl or app redirect
   │  └─ "Step failed" → Check step error below
   │
   └─ Step error message?
      ├─ "Timeout" → Check screenshot:
      │  ├─ Element visible → Increase timeout or add wait
      │  └─ Element missing → Fix selector or app rendering
      ├─ "Element not found" → Check screenshot:
      │  ├─ Element visible → Update selector
      │  └─ Element missing → Fix app code
      └─ Other → Read full error, apply fix
```

Key rules:
- Console errors = STOP, fix app code immediately
- Selector errors = fix selector, re-run same test
- Exit 0 + screenshots OK = DONE, move to next test

---

## 3. When to Stop Iterating

Stop when ALL conditions are met:

1. Exit code 0
2. No console errors (`consoleErrors: 0` in all steps)
3. Screenshots show correct UI (no layout bugs)
4. All assertions passed

Keep iterating when ANY of these are true:
- Exit code 1
- Console errors present
- Obvious bugs in screenshots (broken layout, missing elements)
- Assertions failing

Edge cases:
- Minor UX issues (spacing, color contrast) → Note as "UX improvements", do not iterate further
- Blank page / stuck loading / 404 → Fix app code (routing, data fetching), re-run

---

## 4. What to Fix: Test vs Application Code

| Symptom | Evidence | Fix What |
|---------|----------|----------|
| Console error | `TypeError`, `ReferenceError` in logs | APP CODE |
| Selector timeout | Element visible in screenshot | TEST CODE (selector) |
| Selector timeout | Element NOT in screenshot | APP CODE (rendering) |
| Layout broken | Overlapping, misaligned elements | APP CODE (CSS) |
| Assertion fails | Element exists, different selector | TEST CODE (assertion) |
| Assertion fails | Element does not exist | APP CODE (rendering) |
| Navigation fails | expectedUrl differs from actual | TEST CODE (expectedUrl) |
| Navigation fails | Redirect broken | APP CODE (routing) |

Summary:
- Fix APP CODE when: console errors, visual bugs, functionality bugs, missing elements
- Fix TEST CODE when: selector mismatch, wrong timeout, wrong assertion, wrong expectedUrl

---

## 5. Priority Order for Fixes

When multiple issues detected, fix in this order:

**P1 - Console Errors (critical):** JavaScript errors break all future steps. Fix immediately.
```
consoleErrors: 1, console: ["TypeError: Cannot read property 'map' of undefined"]
→ Add null check in source file, re-run
```

**P2 - Selector Errors (high):** Current step cannot proceed.
```
Timeout waiting for selector: button:has-text('Create')
Screenshot shows button text "Create New"
→ Update selector to button:has-text('Create New')
```

**P3 - Failed Assertions (medium):** Expected state not reached. Verify whether assertion or rendering is wrong.

**P4 - Visual Issues (low):** Layout bugs affect UX but do not block tests. Fix CSS/layout.

**P5 - UX Improvements (non-blocking):** Polish items. Note for later, do not iterate.

---

## 6. When to Create Actions vs Use Primitives

```
Is it a single primitive (click, fill)?
├─ YES → Use primitive inline in flow step
└─ NO → Will it be reused in 2+ flows?
   ├─ NO → Use primitives inline in flow step
   └─ YES → Does it have 4+ primitives or represent a complete user task?
      ├─ NO → Consider primitives inline, convert later if reused
      └─ YES → CREATE ACTION
```

| Criteria | Create Action | Use Primitives Inline |
|----------|--------------|----------------------|
| Reuse | 2+ flows | Single flow only |
| Complexity | 4+ primitives | 1-3 primitives |
| Represents | Complete user task | One-off interaction |
| Examples | login, checkout, create-post | click link, fill one field |

Rule of thumb: start with primitives in flow. Convert to action when you use it twice.

---

## 7. Action Naming Conventions

Name actions from the user's perspective, describing the task not the mechanics.

**Good names:** login, logout, signup, add-to-cart, checkout, create-post, submit-contact-form, open-settings-modal

**Bad names:** click-button, fill-form, type-text, submit-button-click, email-input-fill, do-login-stuff

Naming by category:
- Auth: login, logout, signup, reset-password
- E-commerce: add-to-cart, checkout, apply-coupon
- Content: create-post, edit-post, publish-post
- Forms: submit-contact-form, update-profile, fill-shipping-info

---

## 8. When to Report to User

```
Feature not working after investigation?
├─ Tried fewer than 3 approaches → Try more first
└─ Tried 3+ approaches → Did any work?
   ├─ YES → Use working approach, continue
   └─ NO → REPORT to user with:
      - Expected behavior
      - Actual behavior (screenshot)
      - All attempts made (list selectors/interactions)
      - Console errors (if any)
      - Hypothesis about cause
      - Question: "Should I fix or work around?"
```

Do not report prematurely. Exhaust alternatives first. Do not silently skip broken features.
