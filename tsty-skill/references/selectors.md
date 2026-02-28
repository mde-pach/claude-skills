# Common Selector Patterns

**Load this when creating actions to use proven selector patterns.**

This guide provides battle-tested selector patterns that work reliably across different frameworks and codebases.

---

## Table of Contents

1. [User-Perspective Selectors (Preferred)](#user-perspective-selectors-preferred)
2. [Selector Priority Guide](#selector-priority-guide)
3. [Common Patterns by Element Type](#common-patterns-by-element-type)
4. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
5. [Debugging Selectors](#debugging-selectors)

---

## User-Perspective Selectors (Preferred)

**Use selectors that match how users see the page, not implementation details.**

### Playwright's User-Facing Locators

```typescript
// By text content (BEST for buttons/links)
button:has-text("Submit")
a:has-text("Login")
h1:has-text("Dashboard")

// By placeholder (BEST for inputs)
input[placeholder="Email"]
input[placeholder="Search..."]
textarea[placeholder="Enter message"]

// By label (BEST for form fields)
input[name="email"]
input[aria-label="Search"]
input[id="username"]

// By test ID (BEST for dynamic content)
[data-testid="submit-button"]
[data-action="create"]
[data-cy="login-form"]

// By role + text (WCAG-friendly)
button[role="button"]:has-text("Save")
link[role="link"]:has-text("Settings")
```

### Why User-Perspective Selectors?

**Benefits:**
- ✅ Resilient to code refactoring
- ✅ Match how users interact
- ✅ Self-documenting tests
- ✅ Work across frameworks

**Example:**
```typescript
// ❌ Implementation-dependent (breaks on refactor)
".css-xh3k2l > div:nth-child(2) > button"

// ✅ User-perspective (survives refactor)
"button:has-text('Create New')"
```

---

## Selector Priority Guide

**Use this priority order when creating selectors:**

### Priority 1: Test IDs (Most Reliable)

```typescript
[data-testid="login-button"]
[data-cy="submit-form"]
[data-test="user-menu"]
```

**When to use:** Production code has test IDs
**Pros:** Explicit, stable, designed for testing
**Cons:** Requires adding to codebase

### Priority 2: User-Facing Text (Most Readable)

```typescript
button:has-text("Submit")
a:has-text("Learn More")
h2:has-text("Welcome")
```

**When to use:** Element has unique, stable text
**Pros:** Self-documenting, matches user perspective
**Cons:** Breaks if text changes (i18n issues)

### Priority 3: Semantic Attributes (Most Accessible)

```typescript
input[name="email"]
input[placeholder="Enter email"]
input[aria-label="Search"]
button[type="submit"]
```

**When to use:** Form inputs, semantic HTML
**Pros:** Accessible, stable, meaningful
**Cons:** May not be unique

### Priority 4: ID Selectors (Unique but Fragile)

```typescript
#submit-button
#login-form
#user-dropdown
```

**When to use:** Unique IDs that won't change
**Pros:** Fast, unique
**Cons:** IDs may be auto-generated or change

### Priority 5: Class Selectors (Last Resort)

```typescript
.submit-btn
.login-form
.user-menu
```

**When to use:** Semantic class names (not generated)
**Pros:** Common pattern
**Cons:** Classes often generated or styled-only

---

## Common Patterns by Element Type

### Buttons

**Priority order:**

```typescript
// 1. Test ID (best)
[data-testid="submit-button"]

// 2. Text content (good)
button:has-text("Submit")
button:has-text("Create New")

// 3. Type attribute (okay)
button[type="submit"]
button[type="button"]

// 4. Action attribute (okay)
[data-action="submit"]
[data-action="cancel"]

// 5. Class (last resort)
.btn-primary
.submit-button
```

**Example:**
```json
{
  "type": "click",
  "selector": "button:has-text('Create New Action')"
}
```

### Input Fields

**Priority order:**

```typescript
// 1. Name attribute (best for forms)
input[name="email"]
input[name="password"]

// 2. Placeholder (good)
input[placeholder="Enter email"]
input[placeholder="Search..."]

// 3. Label association (accessible)
input[aria-label="Email address"]
label:has-text("Email") >> input

// 4. Test ID
[data-testid="email-input"]

// 5. ID attribute
#email
#password
```

**Example:**
```json
{
  "type": "fill",
  "selector": "input[name='email']",
  "value": "test@example.com"
}
```

### Links

**Priority order:**

```typescript
// 1. Text content (best)
a:has-text("Learn More")
a:has-text("Settings")

// 2. href attribute (specific pages)
a[href="/login"]
a[href="/dashboard"]

// 3. Test ID
[data-testid="nav-link"]

// 4. Class
.nav-link
.menu-item
```

**Example:**
```json
{
  "type": "click",
  "selector": "a:has-text('Dashboard')"
}
```

### Dropdowns / Select Elements

**Priority order:**

```typescript
// 1. Name attribute
select[name="country"]
select[name="role"]

// 2. Test ID
[data-testid="role-select"]

// 3. Label association
label:has-text("Country") >> select

// 4. ID
#country-select
```

**Example:**
```json
{
  "type": "selectOption",
  "selector": "select[name='role']",
  "options": { "value": "admin" }
}
```

### Checkboxes / Radio Buttons

**Priority order:**

```typescript
// 1. Name attribute + type
input[type="checkbox"][name="terms"]
input[type="radio"][name="gender"]

// 2. Label association
label:has-text("I accept") >> input

// 3. Test ID
[data-testid="terms-checkbox"]

// 4. Value attribute
input[type="checkbox"][value="newsletter"]
```

**Example:**
```json
{
  "type": "check",
  "selector": "input[type='checkbox'][name='terms']"
}
```

### Headings

**Priority order:**

```typescript
// 1. Text content (best)
h1:has-text("Dashboard")
h2:has-text("Welcome Back")

// 2. Test ID
[data-testid="page-title"]

// 3. Generic tag (if unique)
h1
h2
```

**Example:**
```json
{
  "type": "visible",
  "selector": "h1:has-text('Dashboard')"
}
```

### Containers / Sections

**Priority order:**

```typescript
// 1. Test ID (best)
[data-testid="user-profile"]
[data-section="header"]

// 2. Semantic HTML
nav
header
footer
aside
main

// 3. ARIA landmarks
[role="navigation"]
[role="main"]
[role="complementary"]

// 4. Semantic class
.user-profile
.sidebar
```

**Example:**
```json
{
  "type": "visible",
  "selector": "[data-testid='user-profile']"
}
```

---

## Anti-Patterns to Avoid

### ❌ Generated Class Names

```typescript
// BAD - CSS-in-JS generated classes
".css-xh3k2l"
".sc-bdVaJa"
".emotion-cache-abc123"

// GOOD - Use test IDs or text instead
"[data-testid='submit-button']"
"button:has-text('Submit')"
```

**Why:** Generated classes change on every build.

### ❌ Overly Complex Selectors

```typescript
// BAD - Brittle hierarchy
"div > div > div:nth-child(3) > button:nth-child(2)"

// GOOD - Direct, meaningful selector
"button:has-text('Submit')"
```

**Why:** DOM structure changes frequently.

### ❌ nth-child Without Context

```typescript
// BAD - Position-dependent
"button:nth-child(2)"
"div:nth-child(5) > span"

// GOOD - Content-dependent
"button:has-text('Cancel')"
"[data-testid='user-name']"
```

**Why:** Order changes when new elements added.

### ❌ Generic Tags Without Qualification

```typescript
// BAD - Too generic
"div"
"span"
"button"

// GOOD - Qualified with unique attribute
"div[data-testid='modal']"
"span:has-text('Error:')"
"button[type='submit']:has-text('Login')"
```

**Why:** Not unique, matches many elements.

### ❌ Style-Based Selectors

```typescript
// BAD - Styling classes
".text-red-500"
".flex.items-center"
".bg-blue-600"

// GOOD - Semantic selectors
"[data-testid='error-message']"
".error-message"
"button:has-text('Retry')"
```

**Why:** Styles change during design iterations.

---

## Debugging Selectors

### When Selector Fails

**1. Check if element exists in screenshot:**
```bash
# View screenshot
open .tsty/screenshots/run-*/1-step-name.png

# If element visible → selector wrong
# If element NOT visible → app code issue
```

**2. Extract HTML to see actual DOM:**
```json
{
  "capture": { "html": true }
}
```

**3. Check report for exact error:**
```bash
cat .tsty/reports/flow-*.json | jq '.steps[0].error'
```

### Common Issues

**Issue: "Timeout waiting for selector"**
```
Possible causes:
1. Selector syntax wrong
2. Element hasn't loaded yet
3. Element doesn't exist on page
4. Element hidden by CSS
```

**Solution:**
```typescript
// Add wait before interaction
{
  "primitives": [
    { "type": "waitForLoadState", "options": { "state": "networkidle" } },
    { "type": "click", "selector": "button:has-text('Submit')" }
  ]
}
```

**Issue: "Element not visible"**
```
Possible causes:
1. Element hidden (display: none, opacity: 0)
2. Element covered by overlay
3. Element outside viewport
```

**Solution:**
```typescript
// Force visibility check off, or fix CSS
{
  "type": "click",
  "selector": "button",
  "force": true  // Bypass visibility check
}
```

---

## Quick Reference Table

| Element Type | Best Selector | Example |
|-------------|---------------|---------|
| Button | `:has-text()` or `[data-testid]` | `button:has-text("Save")` |
| Input | `[name]` or `[placeholder]` | `input[name="email"]` |
| Link | `:has-text()` | `a:has-text("Settings")` |
| Select | `[name]` | `select[name="country"]` |
| Checkbox | `[type][name]` | `input[type="checkbox"][name="terms"]` |
| Heading | `:has-text()` | `h1:has-text("Dashboard")` |
| Container | `[data-testid]` or semantic | `[data-testid="modal"]` or `nav` |

---

## Best Practices Summary

1. **Prefer user-facing selectors** (text, placeholders, labels)
2. **Use test IDs when available** (data-testid, data-cy)
3. **Avoid generated classes** (CSS-in-JS, Tailwind utility classes)
4. **Avoid deep hierarchies** (nth-child, complex nesting)
5. **Extract HTML first** (don't guess selectors from screenshots)
6. **Test selectors in DevTools** (verify uniqueness)
7. **Document complex selectors** (add comments explaining why)
