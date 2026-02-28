# Tsty Examples Reference

Real-world test scenarios and complete flow examples.

---

## Table of Contents

1. [Overview](#overview)
2. [Visual Testing](#visual-testing)
3. [User Flows](#user-flows)
4. [Form Testing](#form-testing)
5. [Multi-Device Testing](#multi-device-testing)
6. [Dynamic Data Testing](#dynamic-data-testing)
7. [Dependency Workflows](#dependency-workflows)
8. [Regression Testing](#regression-testing)
9. [Quick Tests](#quick-tests)

---

## Overview

This document provides complete, copy-paste-ready examples for common testing scenarios. Each example includes:
- Complete flow JSON
- Expected behavior
- Run commands
- Analysis tips

---

## Visual Testing

### Example 1: Full Site Visual Audit

**Use case**: Capture screenshots of all pages for visual review

**Flow**: `.tsty/flows/site-audit.json`

```json
{
  "name": "Full Site Audit",
  "description": "Visual audit of all main pages",
  "baseUrl": "http://localhost:3000",
  "steps": [
    {
      "name": "Homepage",
      "url": "/",
      "capture": { "screenshot": true, "fullPage": true },
      "assertions": [
        { "type": "visible", "selector": "header" },
        { "type": "visible", "selector": "main" },
        { "type": "visible", "selector": "footer" }
      ]
    },
    {
      "name": "About Page",
      "url": "/about",
      "capture": { "screenshot": true, "fullPage": true },
      "assertions": [
        { "type": "visible", "selector": "h1:has-text('About')" }
      ]
    },
    {
      "name": "Services Page",
      "url": "/services",
      "capture": { "screenshot": true, "fullPage": true }
    },
    {
      "name": "Contact Page",
      "url": "/contact",
      "capture": { "screenshot": true, "fullPage": true },
      "assertions": [
        { "type": "visible", "selector": "form" }
      ]
    }
  ],
  "tags": ["audit", "visual", "all-pages"]
}
```

**Run**:
```bash
tsty run site-audit
```

**Expected output**:
- 4 screenshots in `.tsty/screenshots/run-site-audit-{timestamp}/`
- Full-page captures showing entire page (scrolled)
- Report with assertion results

**Analysis tips**:
- Review each screenshot for layout issues
- Check header/footer consistency across pages
- Verify responsive behavior
- Look for broken images or missing CSS

---

### Example 2: Accessibility Audit

**Use case**: Validate WCAG AA compliance

**Flow**: `.tsty/flows/accessibility-check.json`

```json
{
  "name": "Accessibility Check",
  "description": "Verify WCAG AA compliance",
  "baseUrl": "http://localhost:3000",
  "failFast": true,
  "steps": [
    {
      "name": "Homepage accessibility",
      "url": "/",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": "[aria-label]" },
        { "type": "visible", "selector": "main[role='main']" },
        { "type": "attribute", "selector": "img", "attribute": "alt", "expected": "*" }
      ]
    },
    {
      "name": "Form accessibility",
      "url": "/contact",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": "label[for]" },
        { "type": "attribute", "selector": "input", "attribute": "aria-label", "expected": "*" }
      ]
    }
  ],
  "tags": ["accessibility", "wcag", "a11y"]
}
```

**Run**:
```bash
tsty run accessibility-check
```

**Analysis tips**:
- Check screenshots for contrast ratios (4.5:1 text, 3:1 large text)
- Verify all form inputs have labels
- Check touch target sizes (min 44x44px)
- Ensure text is readable (min 16px body)

---

## User Flows

### Example 3: Complete Login Flow

**Use case**: Test login functionality end-to-end

**Action**: `.tsty/actions/auth/do-login.action.json`

```json
{
  "type": "auth",
  "description": "Perform login with credentials from config",
  "primitives": [
    { "type": "fill", "selector": "input[name='email']", "value": "${credentials.email}" },
    { "type": "fill", "selector": "input[name='password']", "value": "${credentials.password}" },
    { "type": "click", "selector": "button[type='submit']" },
    { "type": "waitForLoadState", "options": { "state": "networkidle" } }
  ],
  "tags": ["auth"],
  "category": "auth"
}
```

**Flow**: `.tsty/flows/auth/login-flow.json`

```json
{
  "name": "Login Flow",
  "description": "Test complete login journey",
  "baseUrl": "http://localhost:3000",
  "failFast": true,
  "monitorConsole": true,
  "steps": [
    {
      "name": "Load login page",
      "url": "/login",
      "expectedUrl": "/login",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": "form" },
        { "type": "visible", "selector": "input[name='email']" },
        { "type": "visible", "selector": "input[name='password']" }
      ]
    },
    {
      "name": "Perform login",
      "actions": ["do-login"],
      "expectedUrl": "/dashboard",
      "capture": { "screenshot": true }
    },
    {
      "name": "Verify dashboard",
      "assertions": [
        { "type": "visible", "selector": "h1:has-text('Dashboard')" },
        { "type": "visible", "selector": ".user-profile" }
      ],
      "capture": { "screenshot": true }
    }
  ],
  "tags": ["auth", "critical", "e2e"]
}
```

**Run**:
```bash
tsty run login-flow
```

**Expected behavior**:
- Step 1: Login form visible
- Step 2: Submits form, redirects to /dashboard
- Step 3: Dashboard loads with user profile
- Exit code 0 if successful

---

### Example 4: Shopping Cart Flow

**Use case**: Test add-to-cart through checkout

**Flow**: `.tsty/flows/commerce/shopping-flow.json`

```json
{
  "name": "Shopping Flow",
  "description": "Add items to cart and checkout",
  "baseUrl": "http://localhost:3000",
  "dependencies": ["login-flow"],
  "failFast": true,
  "steps": [
    {
      "name": "Browse products",
      "url": "/products",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "count", "selector": ".product-card", "expected": 12 }
      ]
    },
    {
      "name": "Add product to cart",
      "primitives": [
        { "type": "click", "selector": ".product-card:first-child button:has-text('Add to Cart')" },
        { "type": "waitForSelector", "selector": ".cart-badge:has-text('1')" }
      ],
      "capture": { "screenshot": true }
    },
    {
      "name": "View cart",
      "url": "/cart",
      "expectedUrl": "/cart",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "count", "selector": ".cart-item", "expected": 1 }
      ]
    },
    {
      "name": "Proceed to checkout",
      "primitives": [
        { "type": "click", "selector": "button:has-text('Checkout')" }
      ],
      "expectedUrl": "/checkout",
      "capture": { "screenshot": true }
    },
    {
      "name": "Complete checkout",
      "actions": ["fill-shipping-form", "submit-order"],
      "expectedUrl": "/order-confirmation",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": ".success-message" }
      ]
    }
  ],
  "tags": ["e2e", "commerce", "critical"]
}
```

**Run**:
```bash
tsty run shopping-flow
```

---

## Form Testing

### Example 5: Contact Form with Validation

**Use case**: Test form validation and submission

**Flow**: `.tsty/flows/forms/contact-form.json`

```json
{
  "name": "Contact Form Test",
  "description": "Test contact form validation and submission",
  "baseUrl": "http://localhost:3000",
  "failFast": true,
  "steps": [
    {
      "name": "Load form",
      "url": "/contact",
      "capture": { "screenshot": true }
    },
    {
      "name": "Test empty validation",
      "primitives": [
        { "type": "click", "selector": "button[type='submit']" }
      ],
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": ".error-message" }
      ]
    },
    {
      "name": "Fill valid data",
      "primitives": [
        { "type": "fill", "selector": "input[name='name']", "value": "${faker.person.fullName}" },
        { "type": "fill", "selector": "input[name='email']", "value": "${faker.internet.email}" },
        { "type": "fill", "selector": "textarea[name='message']", "value": "${faker.lorem.paragraph}" }
      ],
      "capture": { "screenshot": true }
    },
    {
      "name": "Submit form",
      "primitives": [
        { "type": "click", "selector": "button[type='submit']" },
        { "type": "waitForSelector", "selector": ".success-message" }
      ],
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "visible", "selector": ".success-message" },
        { "type": "text", "selector": ".success-message", "expected": "Thank you" }
      ]
    }
  ],
  "tags": ["forms", "validation"]
}
```

**Run**:
```bash
tsty run contact-form
```

---

## Multi-Device Testing

### Example 6: Responsive Layout Test

**Use case**: Test same flow on different devices

**Flow**: `.tsty/flows/responsive-test.json`

```json
{
  "name": "Responsive Layout Test",
  "description": "Verify responsive design on mobile and desktop",
  "baseUrl": "http://localhost:3000",
  "steps": [
    {
      "name": "Homepage",
      "url": "/",
      "capture": { "screenshot": true, "fullPage": true }
    },
    {
      "name": "Navigation menu",
      "primitives": [
        { "type": "click", "selector": "button[aria-label='Menu']" }
      ],
      "capture": { "screenshot": true }
    }
  ],
  "tags": ["responsive", "mobile"]
}
```

**Run on different devices**:
```bash
# Desktop (1920x1080)
tsty run responsive-test --device desktop

# Tablet (768x1024)
tsty run responsive-test --device tablet

# Mobile (375x667)
tsty run responsive-test --device mobile
```

**Analysis tips**:
- Compare screenshots across devices
- Check menu behavior (desktop nav vs mobile hamburger)
- Verify touch target sizes on mobile (min 44x44px)
- Check text readability on small screens

---

## Dynamic Data Testing

### Example 7: User Registration with Faker

**Use case**: Test registration with random realistic data

**Action**: `.tsty/actions/forms/fill-registration.action.json`

```json
{
  "type": "form",
  "description": "Fill registration form with dynamic data",
  "primitives": [
    { "type": "fill", "selector": "#firstName", "value": "${faker.person.firstName}" },
    { "type": "fill", "selector": "#lastName", "value": "${faker.person.lastName}" },
    { "type": "fill", "selector": "#email", "value": "${faker.internet.email}" },
    { "type": "fill", "selector": "#phone", "value": "${faker.phone.number}" },
    { "type": "fill", "selector": "#address", "value": "${faker.location.streetAddress}" },
    { "type": "fill", "selector": "#city", "value": "${faker.location.city}" },
    { "type": "fill", "selector": "#zipCode", "value": "${faker.location.zipCode}" },
    { "type": "fill", "selector": "#password", "value": "${faker.internet.password}" },
    { "type": "fill", "selector": "#confirmPassword", "value": "${faker.internet.password}" }
  ],
  "tags": ["forms"],
  "category": "forms"
}
```

**Flow**: `.tsty/flows/registration.json`

```json
{
  "name": "User Registration",
  "description": "Test registration with dynamic Faker data",
  "baseUrl": "http://localhost:3000",
  "failFast": true,
  "steps": [
    {
      "name": "Load registration page",
      "url": "/register",
      "capture": { "screenshot": true }
    },
    {
      "name": "Fill form",
      "actions": ["fill-registration"],
      "capture": { "screenshot": true }
    },
    {
      "name": "Submit",
      "primitives": [
        { "type": "click", "selector": "button:has-text('Register')" },
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

**Run**:
```bash
tsty run registration
```

**Benefits of Faker**:
- Different data every run (prevents cache issues)
- Realistic test data
- No hardcoded values
- 300+ variable types available

See [VARIABLES.md](VARIABLES.md) for full Faker API reference.

---

## Dependency Workflows

### Example 8: Multi-Flow Test Suite

**Use case**: Run setup flows before main test

**Setup Flow**: `.tsty/flows/auth/setup-account.json`

```json
{
  "name": "Setup Account",
  "description": "Create test account",
  "baseUrl": "http://localhost:3000",
  "steps": [
    {
      "name": "Register",
      "url": "/register",
      "actions": ["fill-registration", "submit-registration"]
    }
  ],
  "tags": ["setup"]
}
```

**Main Flow**: `.tsty/flows/features/profile-update.json`

```json
{
  "name": "Profile Update",
  "description": "Update user profile",
  "baseUrl": "http://localhost:3000",
  "dependencies": ["setup-account", "login-flow"],
  "steps": [
    {
      "name": "Navigate to profile",
      "url": "/profile",
      "capture": { "screenshot": true }
    },
    {
      "name": "Update profile",
      "actions": ["fill-profile-form", "save-profile"],
      "capture": { "screenshot": true }
    }
  ],
  "tags": ["profile"]
}
```

**Run**:
```bash
tsty run profile-update
```

**Execution order**:
1. `setup-account` (dependency)
2. `login-flow` (dependency)
3. `profile-update` (main flow)

**Benefits**:
- Automatic setup/teardown
- Reusable setup flows
- Topological sorting (handles complex dependency graphs)
- Prevents duplicate execution

---

## Regression Testing

### Example 9: Visual Regression Workflow

**Use case**: Compare screenshots before/after code changes

**Flow**: `.tsty/flows/regression/baseline.json`

```json
{
  "name": "Visual Baseline",
  "description": "Capture baseline screenshots for regression testing",
  "baseUrl": "http://localhost:3000",
  "steps": [
    {
      "name": "Homepage",
      "url": "/",
      "capture": { "screenshot": true, "fullPage": true }
    },
    {
      "name": "Dashboard",
      "url": "/dashboard",
      "capture": { "screenshot": true, "fullPage": true }
    },
    {
      "name": "Settings",
      "url": "/settings",
      "capture": { "screenshot": true, "fullPage": true }
    }
  ],
  "tags": ["regression", "baseline"]
}
```

**Workflow**:

1. **Create baseline**:
```bash
# Before code changes
tsty run baseline
# Screenshots saved to .tsty/screenshots/run-baseline-1234567890/
```

2. **Make code changes**:
```bash
# Update CSS, components, etc.
```

3. **Capture new screenshots**:
```bash
# After code changes
tsty run baseline
# Screenshots saved to .tsty/screenshots/run-baseline-9876543210/
```

4. **Compare in dashboard**:
```bash
tsty
# Open dashboard → Runs tab → Compare runs
# Side-by-side comparison of screenshots
```

**Analysis**:
- Visual diff shows changes
- Identify unintended layout shifts
- Verify intentional changes
- Catch regression bugs early

---

## Quick Tests

### Example 10: Single-Action Test

**Use case**: Test one action in isolation

**Flow**: `.tsty/flows/quick-tests/button-click.json`

```json
{
  "name": "Quick Button Test",
  "description": "Test single button click",
  "baseUrl": "http://localhost:4000",
  "failFast": true,
  "steps": [
    {
      "name": "Click button",
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

**Run**:
```bash
tsty run button-click --fail-fast
```

**Use for**:
- Debugging specific actions
- Validating selectors
- Quick smoke tests
- Incremental test building

---

### Example 11: Discovery Flow (Screenshot First)

**Use case**: Explore UI before creating tests

**Flow**: `.tsty/flows/discovery/explore-page.json`

```json
{
  "name": "Discover Page",
  "description": "Take screenshots to identify selectors",
  "baseUrl": "http://localhost:4000",
  "steps": [
    {
      "name": "Initial state",
      "url": "/actions",
      "capture": { "screenshot": true, "fullPage": true }
    },
    {
      "name": "After interaction",
      "primitives": [
        { "type": "click", "selector": "button:first-of-type" }
      ],
      "capture": { "screenshot": true }
    }
  ]
}
```

**Workflow**:
```bash
# 1. Run discovery flow
tsty run explore-page

# 2. View screenshots
ls .tsty/screenshots/run-explore-page-*/

# 3. Analyze screenshots to find real selectors
# Read screenshots using Read tool

# 4. Create actions with correct selectors
# Based on what you saw in screenshots

# 5. Build full test flow
# Now with validated selectors
```

**This is the RECOMMENDED approach** - see [E2E-TESTING-GUIDE.md](E2E-TESTING-GUIDE.md) for details.

---

## Running Examples

### Basic Usage

```bash
# Run any example
tsty run <flow-name>

# Run with fail-fast (recommended during iteration)
tsty run <flow-name> --fail-fast

# Run on different device
tsty run <flow-name> --device mobile

# Run without console monitoring
tsty run <flow-name> --no-monitor
```

### Analyzing Results

```bash
# View latest report
cat .tsty/reports/flow-<name>-*.json | tail -1

# List screenshots
ls -la .tsty/screenshots/run-<name>-*/

# View specific screenshot (use Read tool)
```

### Iteration Loop

```bash
# 1. Run test
tsty run my-test --fail-fast

# 2. If failed (exit code 1):
#    - Read report JSON
#    - View screenshots
#    - Check console logs
#    - Identify issues

# 3. Fix issues
#    - Update code
#    - Fix selectors
#    - Adjust waits

# 4. Re-run
tsty run my-test --fail-fast

# 5. Repeat until exit code 0
```

---

## Cross-References

- **Flow Structure**: See [FLOW-STRUCTURE.md](FLOW-STRUCTURE.md) for complete JSON schema
- **Actions**: See [ACTIONS.md](ACTIONS.md) for creating reusable actions
- **Variables**: See [VARIABLES.md](VARIABLES.md) for Faker.js integration
- **E2E Guide**: See [E2E-TESTING-GUIDE.md](E2E-TESTING-GUIDE.md) for discovery-first approach
- **CLI**: See [CLI-REFERENCE.md](CLI-REFERENCE.md) for all commands

---

**Last Updated**: 2026-02-06
