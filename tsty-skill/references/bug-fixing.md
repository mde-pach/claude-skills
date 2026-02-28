# Bug Fixing

When tests fail or features do not work, investigate and fix the bug. Reporting should be rare (around 10% of cases).

---

## 1. Default Assumption

```
Root cause distribution:
  70%  Application bugs (missing handlers, broken logic)
  25%  Wrong test selectors
   4%  Timing issues
   1%  Framework limitations

Default: It is an application bug until proven otherwise.
```

---

## 2. Bug Detection Checklist

Work through in order. Stop when you find the bug.

### Missing Event Handler (80% of issues)

**Symptom**: Click/fill succeeds but nothing happens. Screenshot unchanged.

**Check**: Read the component file. Look for the element (button, card, input). Verify an event handler exists.

```typescript
// Missing handler:
<div {...listeners} {...attributes}>Item</div>

// Fixed:
<div {...listeners} {...attributes} onClick={handleClick}>Item</div>
```

**Real example**: Test clicked "Focus" primitive card. Playwright reported success. Screenshot showed "No actions yet." Root cause: `PrimitiveActionPalette` card had `useDraggable` but no `onClick`. Fix: Added `onClick` with `addAction()` call.

### Wrong Selector (15% of issues)

**Symptom**: `TimeoutError: Waiting for selector "..." to be visible`

Try selectors in this order:
1. `text=Save`
2. `button:has-text('Save')`
3. `[aria-label='Save']`
4. `.save-button` (last resort)

Use exact text/placeholder from the HTML, not guesses.

### Wrong Field Name (3% of issues)

**Symptom**: Code reads `undefined`, context does not update.

Check type definitions before changing field names. See Section 4 below.

### Timing Issue (1.9% of issues)

**Symptom**: Works sometimes, fails other times (flaky).

Fixes: `waitForLoadState` with `networkidle`, `waitForSelector` for specific elements, short `waitForTimeout` for UI animations.

### Framework Limitation (0.1% of issues)

Only conclude this after trying everything above, reading the component code, verifying handlers exist, testing 3+ selector approaches, and trying both click and keyboard interaction.

Real framework limitations are rare: cross-origin iframes, native browser dialogs, file system dialogs, browser extensions.

---

## 3. Investigation Protocol

When a feature does not work as expected:

**Step 1 - Gather evidence.** Screenshot before and after. Console logs from report. Expected vs actual behavior.

**Step 2 - Try simple interaction first.**
```json
{ "type": "click", "selector": "text=Element" }
```
Not dragAndDrop or evaluate. Simple click first.

**Step 3 - Compare screenshots.** If before and after are identical, the handler did not fire. This is a false success.

**Step 4 - Read the code.** Find the component. Look for event handlers. Check if the handler calls the right function.

```bash
grep -r "Focus an element" src/
# Read the component, look for onClick, onChange, onSubmit
```

**Step 5 - Form hypotheses.** List at least three possible causes: missing handler, wrong event type, element not interactive, timing, field name confusion.

**Step 6 - Fix the bug.** Apply the fix. Re-run the test. Verify the screenshot shows the expected change.

---

## 4. Type Confusion Warning

Before "fixing" a field name, check the interface definition in `types.ts`.

```typescript
// You see this code:
const items = definition.primitives;

// You think: "Should be .actions"
// You change to definition.actions  --> WRONG

// Check types first:
interface ActionDefinition {
  primitives: Primitive[];  // "primitives" is correct
}
```

Common confusions:

| Code Uses | You Assume | Actual Field | Type |
|-----------|------------|--------------|------|
| `definition.primitives` | `.actions` | `primitives` | `ActionDefinition` |
| `flow.actions` | `.primitives` | `actions` | `Flow` (action IDs) |
| `step.primitives` | `.actions` | Both valid | `FlowStep` |

**Rule**: Read the type definition before changing any field name. Type confusion wastes time.

---

## 5. Bug Classification

### Type A: Missing Functionality
Click does nothing because no handler exists. Fix: add the missing handler.

### Type B: Broken Logic
Handler exists but has wrong logic. Fix: correct the logic.

### Type C: Selector Issue
Element exists but selector does not match. Fix: update the selector in the test.

### Type D: Timing Issue
Element loads after the test tries to interact. Fix: add appropriate wait primitive.

### Type E: Framework Limitation
Playwright truly cannot simulate the interaction. Fix: document the limitation, add an alternative interaction method to the app, use a workaround in the test. This is very rare.

---

## 6. When to Fix vs Escalate

### Fix Yourself

- Missing event handlers (onClick, onChange, onSubmit)
- Wrong selector in test
- Timing issues (add waits)
- Simple logic bugs
- Missing form attributes (name, placeholder)
- Broken assertions in test

### Escalate to User

- Architectural decisions (should this feature exist?)
- Complex refactoring needed
- Breaking changes required
- Security implications
- Third-party library bugs (truly confirmed after investigation)
- Database schema changes

Default: fix yourself. Escalate only when truly blocked or when a decision is needed.

---

## 7. Report Template

When you do need to escalate, use this format:

```
## Issue: [Feature Name] Not Working

**What I'm trying to do:** [User perspective, one sentence]

**Expected:** [What should happen]
**Actual:** [What happens instead]

**Evidence:**
- Screenshot before/after showing no change
- File contents (if relevant)
- Console errors (if any)

**Attempts:** [List approaches tried, minimum 3]

**Hypothesis:** [What you think the root cause is]

**Question:** Should I [option A] or [option B]?
```

Keep it concise. Evidence first, hypothesis second, actionable question last.

---

## 8. Common Mistakes

### Assuming limitations too quickly
Concluding "Playwright/@dnd-kit incompatibility" after two failed attempts, without reading the component code or trying a simple `text=` selector.

### Accepting false success
Test exits with code 0, but the screenshot shows nothing changed. Moving to the next test instead of investigating. Test passing does not mean the feature works.

### Working around instead of fixing
Using `evaluate()` to manipulate state directly when the UI interaction does not work. The correct response is to fix the UI so it works via normal interaction.

### Single hypothesis
"It must be a Playwright issue." Form multiple hypotheses: missing handler, wrong event type, element not interactive, timing, field name confusion. Test each one.

### Not reading the code
Trying two approaches, both fail, concluding it is a limitation. The component source code will usually reveal the root cause in under a minute.

---

## Key Example: The Primitive Click Bug

This real bug from a testing session illustrates the full workflow.

**Symptom**: Clicking "Focus" primitive card. Test passed. Screenshot showed "No actions yet" (unchanged).

**Wrong approach taken**: Tried click with complex selector. Tried dragAndDrop. Both "passed" but did not work. Concluded "Playwright/@dnd-kit incompatibility." Spent 60+ minutes on workarounds. Bug remained unfixed.

**Correct approach (5 minutes)**:

1. Detected false success: test passed but screenshot unchanged.
2. Read `PrimitiveActionPalette.tsx`.
3. Found: only `useDraggable` hook, no `onClick` handler.
4. Fixed: added `onClick` handler to primitive cards.

```typescript
// Before (bug):
function PrimitiveActionCard({ template }: Props) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `primitive-${template.type}`,
  });
  return <div ref={setNodeRef} {...listeners} {...attributes}>...</div>;
}

// After (fixed):
function PrimitiveActionCard({ template, onAdd }: Props) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `primitive-${template.type}`,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAdd(template.type)}
    >...</div>
  );
}
```

5. Re-ran test. Screenshot showed primitive added. Feature works.

**Lesson**: 99% of failures are application bugs or wrong selectors. Read the code before concluding anything else.
