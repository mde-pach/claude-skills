# Assertion Quick Reference

**Common assertion patterns for verifying outcomes after interactions.**

---

## 🎯 Core Principle

**Every interaction should have an outcome assertion**

```
Click button → Assert something appears
Fill form → Assert data saved
Add item → Assert count increased
Navigate → Assert URL/content changed
```

**Without assertions**: Test passes even if feature broken
**With assertions**: Test fails when feature broken

---

## Common Patterns

### Pattern 1: After Button Click → Something Appears

**Scenario**: Clicked button, expect modal/message/element to appear

```json
{
  "name": "Click Save button",
  "primitives": [
    { "type": "click", "selector": "button:has-text('Save')" }
  ],
  "assertions": [
    {
      "type": "visible",
      "selector": "text=Saved successfully"
    }
  ]
}
```

**Other examples**:
- Click "New Action" → Assert modal visible
- Click "Delete" → Assert confirmation dialog
- Click "Submit" → Assert success message

### Pattern 2: After Form Submit → Data Saved

**Scenario**: Filled form, expect data to be saved/visible

```json
{
  "name": "Submit form",
  "primitives": [
    { "type": "fill", "selector": "input[name='email']", "value": "test@example.com" },
    { "type": "fill", "selector": "input[name='password']", "value": "pass123" },
    { "type": "click", "selector": "button[type='submit']" }
  ],
  "assertions": [
    {
      "type": "text",
      "selector": ".user-email",
      "expected": "test@example.com"
    },
    {
      "type": "visible",
      "selector": "text=Logged in"
    }
  ]
}
```

**Other examples**:
- Fill name → Assert name displayed in UI
- Create action → Assert action count increased
- Update setting → Assert "Saved" indicator

### Pattern 3: After Item Added → Count Increased

**Scenario**: Added item to list, expect count to update

```json
{
  "name": "Add primitive to sequence",
  "primitives": [
    { "type": "click", "selector": "text=Focus" }
  ],
  "assertions": [
    {
      "type": "text",
      "selector": ".primitive-count",
      "expected": "1 primitive"
    },
    {
      "type": "visible",
      "selector": "text=#1 Focus"
    }
  ]
}
```

**Other examples**:
- Add item → Assert "3 items" (from "2 items")
- Upload file → Assert file list count
- Add tag → Assert tag appears in list

### Pattern 4: After Navigation → URL Changed

**Scenario**: Clicked link/button, expect navigation

```json
{
  "name": "Navigate to actions page",
  "primitives": [
    { "type": "click", "selector": "a[href='/actions']" }
  ],
  "expectedUrl": "/actions",
  "assertions": [
    {
      "type": "visible",
      "selector": "h1:has-text('Actions')"
    }
  ]
}
```

**Other examples**:
- Click "Dashboard" → Assert URL is /dashboard
- Submit form → Assert redirect to /success
- Click "Back" → Assert previous page URL

### Pattern 5: After State Change → UI Updated

**Scenario**: Toggled switch/checkbox, expect UI change

```json
{
  "name": "Enable dark mode",
  "primitives": [
    { "type": "click", "selector": "button[aria-label='Dark mode']" }
  ],
  "assertions": [
    {
      "type": "attribute",
      "selector": "html",
      "attribute": "class",
      "expected": "dark"
    }
  ]
}
```

**Other examples**:
- Toggle sidebar → Assert collapsed/expanded class
- Select dropdown → Assert selected value
- Check checkbox → Assert checked state

---

## Assertion Types

### visible

**Use when**: Element should appear after interaction

```json
{
  "type": "visible",
  "selector": "text=Success"
}
```

### hidden

**Use when**: Element should disappear after interaction

```json
{
  "type": "hidden",
  "selector": ".loading-spinner"
}
```

### text

**Use when**: Text content should match expected value

```json
{
  "type": "text",
  "selector": ".status",
  "expected": "Completed"
}
```

### count

**Use when**: Number of elements should match expected count

```json
{
  "type": "count",
  "selector": ".list-item",
  "expected": 3
}
```

### value

**Use when**: Input value should match expected value

```json
{
  "type": "value",
  "selector": "input[name='email']",
  "expected": "test@example.com"
}
```

### attribute

**Use when**: Element attribute should match expected value

```json
{
  "type": "attribute",
  "selector": "button",
  "attribute": "disabled",
  "expected": "true"
}
```

### url

**Use when**: Current URL should match expected pattern

```json
{
  "type": "url",
  "expected": "/dashboard"
}
```

---

## Multiple Assertions

**Verify multiple outcomes in one step:**

```json
{
  "name": "Save action",
  "primitives": [
    { "type": "click", "selector": "button:has-text('Save')" }
  ],
  "assertions": [
    {
      "type": "visible",
      "selector": "text=Saved"
    },
    {
      "type": "text",
      "selector": ".action-count",
      "expected": "3 actions"
    },
    {
      "type": "hidden",
      "selector": ".unsaved-indicator"
    }
  ]
}
```

---

## When to Use Assertions

**✅ ALWAYS assert when:**
- Clicking a button (should do something)
- Submitting a form (should save/redirect)
- Adding/removing items (count should change)
- Toggling states (UI should update)
- Navigating (URL/content should change)

**❌ DON'T need assertions when:**
- Pure navigation (use `expectedUrl` instead)
- Waiting for load state (state change is the outcome)
- Filling fields (value presence is implicit)

---

## Real-World Example

From the action creation test:

```json
{
  "name": "test-action-creation-complete",
  "steps": [
    {
      "name": "Fill name",
      "primitives": [
        { "type": "fill", "selector": "input[placeholder='Action name...']", "value": "Login" }
      ]
      // No assertion needed - filling is the outcome
    },
    {
      "name": "Add primitive",
      "primitives": [
        { "type": "click", "selector": "text=Focus" }
      ],
      "assertions": [
        {
          "type": "visible",
          "selector": "text=#1 Focus"
        }
      ]
      // ✅ CRITICAL: Verify primitive was actually added!
    },
    {
      "name": "Save",
      "primitives": [
        { "type": "click", "selector": "button:has-text('Save')" }
      ],
      "assertions": [
        {
          "type": "visible",
          "selector": "text=Saved"
        },
        {
          "type": "text",
          "selector": ".primitive-count",
          "expected": "1 primitive"
        }
      ]
      // ✅ Verify both saved AND data persisted
    }
  ]
}
```

---

## Common Mistakes

**❌ Not asserting outcomes:**
```json
{
  "name": "Click Save",
  "primitives": [
    { "type": "click", "selector": "button:has-text('Save')" }
  ]
  // Missing: No verification that save worked!
}
```

**✅ Asserting outcomes:**
```json
{
  "name": "Click Save",
  "primitives": [
    { "type": "click", "selector": "button:has-text('Save')" }
  ],
  "assertions": [
    { "type": "visible", "selector": "text=Saved" }
  ]
}
```

---

**❌ Wrong assertion type:**
```json
{
  "type": "visible",
  "selector": ".count",
  "expected": "3"  // Wrong: visible doesn't check text
}
```

**✅ Correct assertion type:**
```json
{
  "type": "text",
  "selector": ".count",
  "expected": "3 items"
}
```

---

## Quick Decision Tree

```
Did I click something?
├─ Yes → Assert something appeared/changed
└─ No → Did I fill something?
   ├─ Yes → Assert data visible/saved
   └─ No → Did I navigate?
      ├─ Yes → Assert URL/content
      └─ No → Did I toggle something?
         ├─ Yes → Assert state changed
         └─ No → Probably don't need assertion
```

---

## Remember

**Test passed + No assertion = False confidence**

**Test passed + Assertion passed = Feature works**

Always verify the OUTCOME, not just that Playwright didn't crash.
