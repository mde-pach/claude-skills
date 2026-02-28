# Flow Structure Reference

Complete guide to Tsty flow file structure, fields, and patterns.

---

## Table of Contents

1. [Overview](#overview)
2. [Complete JSON Schema](#complete-json-schema)
3. [Field Reference](#field-reference)
4. [Flow Step Fields](#flow-step-fields)
5. [URL Field Behavior](#url-field-behavior)
6. [Examples](#examples)
7. [Best Practices](#best-practices)

---

## Overview

Flows are test sequences stored as JSON files in `.tsty/flows/[category]/*.json`. Each flow defines:
- Base configuration (URL, browser settings)
- Ordered sequence of steps
- Capture settings (screenshots, console logs)
- Assertions and validations
- Dependencies and organization metadata

---

## Complete JSON Schema

```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "baseUrl": "string (required)",
  "failFast": "boolean (optional, default: false)",
  "monitorConsole": "boolean (optional, default: true)",
  "steps": [
    {
      "name": "string (required)",
      "url": "string (optional - navigate to URL)",
      "expectedUrl": "string (optional - verify navigation)",
      "actions": ["string[]"] (optional - reference action files)",
      "primitives": [
        {
          "type": "string (required - Playwright action)",
          "selector": "string (optional - CSS selector)",
          "value": "string (optional - input value)",
          "options": "object (optional - action options)"
        }
      ],
      "capture": {
        "screenshot": "boolean (optional, default: false)",
        "fullPage": "boolean (optional, default: false)",
        "html": "boolean (optional, default: false)",
        "console": "boolean (optional, default: false)"
      },
      "assertions": [
        {
          "type": "visible | text | count | attribute",
          "selector": "string (required)",
          "expected": "any (required - expected value)"
        }
      ],
      "timeout": "number (optional, default: 30000ms)"
    }
  ],
  "tags": ["string[]"] (optional - organization tags)",
  "dependencies": ["string[]"] (optional - flow dependencies)",
  "category": "string (optional - broad categorization)",
  "metadata": {
    "key": "value (optional - custom metadata)"
  }
}
```

---

## Field Reference

### Flow-Level Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | ✅ Yes | - | Flow name (displayed in UI) |
| `description` | string | No | "" | Human-readable description |
| `baseUrl` | string | ✅ Yes | - | Base URL for all relative URLs |
| `failFast` | boolean | No | false | Stop on first failed step |
| `monitorConsole` | boolean | No | true | Monitor console errors |
| `steps` | array | ✅ Yes | - | Ordered sequence of test steps |
| `tags` | string[] | No | [] | Organization tags |
| `dependencies` | string[] | No | [] | Flow IDs to run before this flow |
| `category` | string | No | "" | Broad categorization (e.g., "auth", "checkout") |
| `metadata` | object | No | {} | Custom metadata |

### Performance & Behavior

| Setting | Impact | Recommendation |
|---------|--------|----------------|
| `failFast: true` | Stop at first failure | ✅ Use during iteration (saves 60-78% time) |
| `failFast: false` | Run all steps | Use for complete test coverage reports |
| `monitorConsole: true` | Stop on console errors | ✅ Use during iteration (catch JS bugs early) |
| `monitorConsole: false` | Ignore console errors | Use if many false-positive warnings |

---

## Flow Step Fields

### FlowStep Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ Yes | Step name (shown in reports) |
| `url` | string | No | Navigate to URL (optional - omit to stay on current page) |
| `expectedUrl` | string | No | Expected URL after navigation (for validation) |
| `actions` | string[] | No | References to action files (e.g., ["login", "fill-form"]) |
| `primitives` | Primitive[] | No | Inline Playwright actions (alternative to actions) |
| `capture` | object | No | What to capture (screenshot, HTML, console) |
| `assertions` | array | No | Validations to perform |
| `timeout` | number | No | Step timeout in milliseconds (default: 30000) |

### Capture Options

```json
{
  "capture": {
    "screenshot": true,    // Capture screenshot (saved to .tsty/screenshots/)
    "fullPage": true,      // Full-page screenshot (scrolls page)
    "html": true,          // Save page HTML
    "console": true        // Capture console logs (always captured, this is legacy)
  }
}
```

**Note**: Console logs are ALWAYS captured regardless of `capture.console` setting. Use `monitorConsole` to control error detection behavior.

### Assertion Types

```json
{
  "assertions": [
    // Element is visible
    { "type": "visible", "selector": "h1", "expected": true },

    // Element contains text
    { "type": "text", "selector": "h1", "expected": "Dashboard" },

    // Element count
    { "type": "count", "selector": "li.item", "expected": 5 },

    // Element attribute value
    { "type": "attribute", "selector": "input", "attribute": "value", "expected": "test@example.com" }
  ]
}
```

---

## URL Field Behavior

**CRITICAL: The `url` field is optional in flow steps.**

### When to Include `url`

✅ **Include `url` when**:
- Navigating to a new page
- Starting a new workflow section
- Testing different pages in sequence
- Resetting page state intentionally

### When to Omit `url`

✅ **Omit `url` when**:
- Staying on current page
- Interacting with modals/forms
- Multi-step interactions on same page
- Testing page state changes

### Common Pitfall: Unintended Page Resets

❌ **WRONG**: Navigating on every step resets state
```json
{
  "steps": [
    {
      "name": "Open modal",
      "url": "/actions",  // Navigate to /actions
      "actions": ["click-new"]
    },
    {
      "name": "Fill form",
      "url": "/actions",  // ⚠️ RELOADS PAGE → modal closes!
      "actions": ["fill-name"]
    }
  ]
}
```

✅ **CORRECT**: Navigate once, then interact
```json
{
  "steps": [
    {
      "name": "Load page",
      "url": "/actions"  // Navigate once
    },
    {
      "name": "Open modal",
      // No url = stay on /actions
      "actions": ["click-new"]
    },
    {
      "name": "Fill form",
      // No url = stay on /actions (modal still open)
      "actions": ["fill-name"]
    }
  ]
}
```

---

## Examples

### Example 1: Simple Multi-Page Audit

```json
{
  "name": "Site Audit",
  "description": "Visual audit of main pages",
  "baseUrl": "http://localhost:3000",
  "steps": [
    {
      "name": "Homepage",
      "url": "/",
      "capture": { "screenshot": true, "fullPage": true },
      "assertions": [
        { "type": "visible", "selector": "h1" }
      ]
    },
    {
      "name": "About Page",
      "url": "/about",
      "capture": { "screenshot": true, "fullPage": true }
    },
    {
      "name": "Contact Page",
      "url": "/contact",
      "capture": { "screenshot": true, "fullPage": true }
    }
  ],
  "tags": ["audit", "visual"]
}
```

**Pattern**: Each step navigates to different page with full-page screenshots.

---

### Example 2: Single-Page Interaction Flow

```json
{
  "name": "Login Flow",
  "description": "Test login functionality",
  "baseUrl": "http://localhost:3000",
  "failFast": true,
  "monitorConsole": true,
  "steps": [
    {
      "name": "Load login page",
      "url": "/login",
      "expectedUrl": "/login",
      "capture": { "screenshot": true }
    },
    {
      "name": "Fill credentials",
      "primitives": [
        { "type": "fill", "selector": "input[name='email']", "value": "${credentials.email}" },
        { "type": "fill", "selector": "input[name='password']", "value": "${credentials.password}" }
      ]
    },
    {
      "name": "Submit form",
      "expectedUrl": "/dashboard",
      "primitives": [
        { "type": "click", "selector": "button[type='submit']" },
        { "type": "waitForLoadState", "options": { "state": "networkidle" } }
      ],
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": "h1:has-text('Dashboard')" }
      ]
    }
  ],
  "tags": ["auth", "critical"]
}
```

**Pattern**: Navigate once, then interact without reloading page. Use `expectedUrl` to verify navigation succeeded.

---

### Example 3: Flow with Dependencies

```json
{
  "name": "Checkout Flow",
  "description": "Complete checkout process",
  "baseUrl": "http://localhost:3000",
  "dependencies": ["login-flow"],
  "failFast": true,
  "steps": [
    {
      "name": "View cart",
      "url": "/cart",
      "expectedUrl": "/cart",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "count", "selector": ".cart-item", "expected": 2 }
      ]
    },
    {
      "name": "Proceed to checkout",
      "actions": ["click-checkout"],
      "expectedUrl": "/checkout"
    },
    {
      "name": "Fill shipping",
      "actions": ["fill-shipping-form"]
    },
    {
      "name": "Submit order",
      "actions": ["submit-order"],
      "expectedUrl": "/order-confirmation",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": ".success-message" }
      ]
    }
  ],
  "tags": ["e2e", "checkout", "critical"],
  "category": "commerce"
}
```

**Pattern**: Runs `login-flow` first (dependency), then executes checkout. Uses reusable actions.

---

### Example 4: Inline Primitives (Quick Test)

```json
{
  "name": "Quick Button Test",
  "description": "Test button click without creating action files",
  "baseUrl": "http://localhost:4000",
  "failFast": true,
  "steps": [
    {
      "name": "Load page and click",
      "url": "/actions",
      "primitives": [
        { "type": "click", "selector": "button:has-text('New Action')" },
        { "type": "waitForSelector", "selector": ".modal" }
      ],
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": ".modal" }
      ]
    }
  ]
}
```

**Pattern**: Inline primitives for quick testing without creating separate action files.

---

### Example 5: Multi-Step Modal Interaction

```json
{
  "name": "Action Creation",
  "description": "Create new action via modal",
  "baseUrl": "http://localhost:4000",
  "failFast": true,
  "monitorConsole": true,
  "steps": [
    {
      "name": "Navigate to actions",
      "url": "/actions",
      "expectedUrl": "/actions",
      "capture": { "screenshot": true }
    },
    {
      "name": "Open modal",
      "actions": ["click-new-action"],
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": ".modal" }
      ]
    },
    {
      "name": "Fill form",
      "actions": ["fill-action-name", "fill-action-description"],
      "capture": { "screenshot": true }
    },
    {
      "name": "Add primitive",
      "actions": ["add-click-primitive"],
      "capture": { "screenshot": true }
    },
    {
      "name": "Save action",
      "actions": ["click-save"],
      "expectedUrl": "/actions",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": ".success-notification" }
      ]
    }
  ],
  "tags": ["e2e", "modal"]
}
```

**Pattern**: Navigate once, then stay on page through modal workflow. Each step stays on same URL.

---

### Example 6: With Dynamic Variables

```json
{
  "name": "User Registration",
  "description": "Test registration with dynamic data",
  "baseUrl": "http://localhost:3000",
  "failFast": true,
  "steps": [
    {
      "name": "Load registration page",
      "url": "/register",
      "capture": { "screenshot": true }
    },
    {
      "name": "Fill registration form",
      "primitives": [
        { "type": "fill", "selector": "#name", "value": "${faker.person.fullName}" },
        { "type": "fill", "selector": "#email", "value": "${faker.internet.email}" },
        { "type": "fill", "selector": "#phone", "value": "${faker.phone.number}" },
        { "type": "fill", "selector": "#password", "value": "${faker.internet.password}" }
      ]
    },
    {
      "name": "Submit",
      "primitives": [
        { "type": "click", "selector": "button[type='submit']" },
        { "type": "waitForLoadState", "options": { "state": "networkidle" } }
      ],
      "expectedUrl": "/welcome",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": ".welcome-message" }
      ]
    }
  ],
  "tags": ["registration", "dynamic"]
}
```

**Pattern**: Uses Faker.js variables for realistic test data. See `references/VARIABLES.md` for full variable list.

---

## Best Practices

### 1. Fail-Fast During Iteration

✅ **DO**: Use fail-fast during development
```json
{
  "failFast": true,
  "monitorConsole": true
}
```

**Benefits**:
- 60-78% time savings (stops at first failure)
- Clear error location (root cause, not cascading failures)
- Faster iteration cycles

### 2. Omit URL When Not Navigating

✅ **DO**: Only include `url` when navigating
```json
{
  "steps": [
    { "name": "Load", "url": "/page" },  // Navigate
    { "name": "Click" },                 // Stay on page
    { "name": "Fill" }                   // Stay on page
  ]
}
```

❌ **DON'T**: Include URL on every step
```json
{
  "steps": [
    { "name": "Load", "url": "/page" },
    { "name": "Click", "url": "/page" },  // ⚠️ Reloads page!
    { "name": "Fill", "url": "/page" }    // ⚠️ Reloads page!
  ]
}
```

### 3. Use User-Perspective Selectors

✅ **DO**: Use visible text and semantic selectors
```json
{ "selector": "button:has-text('Submit')" }
{ "selector": "input[name='email']" }
{ "selector": "h1:has-text('Dashboard')" }
```

❌ **DON'T**: Use fragile class selectors
```json
{ "selector": "button.bg-blue-500.hover\\:bg-blue-600" }
{ "selector": "div > div > div > button:nth-child(2)" }
```

### 4. Validate Navigation with expectedUrl

✅ **DO**: Add `expectedUrl` for navigation steps
```json
{
  "name": "Submit form",
  "expectedUrl": "/dashboard",
  "primitives": [
    { "type": "click", "selector": "button[type='submit']" }
  ]
}
```

**Benefits**:
- Catch failed navigation early
- Verify redirects work correctly
- Fail-fast stops if URL doesn't match

### 5. Capture Screenshots Strategically

✅ **DO**: Capture at key points
```json
{
  "steps": [
    { "name": "Before action", "capture": { "screenshot": true } },
    { "name": "Perform actions" },
    { "name": "After action", "capture": { "screenshot": true } }
  ]
}
```

❌ **DON'T**: Capture every single step (unnecessary overhead)
```json
{
  "steps": [
    { "name": "Step 1", "capture": { "screenshot": true } },
    { "name": "Step 2", "capture": { "screenshot": true } },
    { "name": "Step 3", "capture": { "screenshot": true } }
  ]
}
```

**When to capture**:
- Before and after major actions
- After navigation
- When assertions are performed
- Key states you want to verify visually

### 6. Group Related Steps

✅ **DO**: Use clear step names to show workflow phases
```json
{
  "steps": [
    { "name": "Setup: Load page" },
    { "name": "Setup: Login" },
    { "name": "Action: Open modal" },
    { "name": "Action: Fill form" },
    { "name": "Verify: Check success message" }
  ]
}
```

**Benefits**:
- Easier to understand test flow
- Clear report sections
- Better debugging

---

## Cross-References

- **Actions**: See [ACTIONS.md](ACTIONS.md) for creating reusable action files
- **Variables**: See [VARIABLES.md](VARIABLES.md) for dynamic data with Faker.js
- **Examples**: See [EXAMPLES.md](EXAMPLES.md) for more real-world scenarios
- **CLI**: See [CLI-REFERENCE.md](CLI-REFERENCE.md) for running flows
- **Fail-Fast**: See [FAIL-FAST-GUIDE.md](FAIL-FAST-GUIDE.md) for detailed fail-fast documentation

---

**Last Updated**: 2026-02-06
