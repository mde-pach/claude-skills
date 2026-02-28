---
name: qa-frontend-tester
description: "QA frontend testing toolkit for web applications. Includes visual regression testing, user flow validation, accessibility checking, and HTML analysis. Use when asked to: (1) test visual layout or UI appearance, (2) run user flow tests or E2E tests, (3) check accessibility (WCAG AA), (4) capture screenshots or HTML, (5) verify UI implementation, (6) find layout bugs or visual issues, (7) test complete user journeys, (8) perform regression testing, or (9) validate frontend functionality. Works with any tech stack and automatically triggers after implementing new features."
---

# QA Frontend Tester

Comprehensive frontend testing toolkit combining visual analysis, user flow validation, and accessibility testing.

## Prerequisites

**IMPORTANT: Initialize the project before running any commands.**

Check if `.qa-testing/` directory exists in the project root:
```bash
ls .qa-testing
```

If the directory does not exist, run initialization:
```bash
node ~/.claude/skills/qa-frontend-tester/scripts/init-project.js
```

This creates the required structure:
- `.qa-testing/actions/` - UI interaction sequences
- `.qa-testing/flows/` - User flow definitions
- `.qa-testing/screenshots/`, `html/`, `reports/` - Generated files
- `.qa-testing/config.json` - Credentials and settings
- Example action and flow files

**All commands in this skill require this directory structure to exist.**

---

## Core Capabilities

1. **Visual Testing** - Screenshot capture + AI analysis for layout bugs and UX issues
2. **User Flow Testing** - Complete journey validation with assertions and reports
3. **HTML Analysis** - Capture page HTML for structure comparison
4. **Action System** - Reusable UI interaction sequences (auth, modals, filters)
5. **Accessibility** - WCAG AA compliance checking

---

## Quick Start

### Add Route Header (Recommended)

Add to `src/middleware.ts`:
```typescript
response.headers.set('x-matched-path', request.nextUrl.pathname)
```

This enables accurate screenshot naming based on routes.

---

## 1. Visual Testing

### Take Screenshot

```bash
# Basic
node ~/.claude/skills/qa-frontend-tester/scripts/screenshot.js http://localhost:3000/dashboard

# With HTML capture
node ~/.claude/skills/qa-frontend-tester/scripts/screenshot.js http://localhost:3000/dashboard --html

# With actions (login, modal, filters)
node ~/.claude/skills/qa-frontend-tester/scripts/screenshot.js http://localhost:3000/market --actions login,open-modal
```

### Analyze Screenshot

**User pastes screenshot → AI analyzes**

**Two-tier output format:**

```
🔴 Critical Issues (2) - Layout bugs, must fix

1. Footer text stacked vertically
Current: Text broken across lines
Expected: Single horizontal line

2. Low contrast (WCAG AA violation)
Current: Gray #A0A0A0 on white
Expected: Darker gray for readability

---

💡 UX Improvements (1) - Working but could be better

3. Technical ID exposed
Current: Shows "cm1i5cc7d0000g4z21k414e15"
Improvement: Show organization name "Acme Corporation"
```

**Key principles:**
- Separate critical bugs from improvements
- Current vs Expected format (design, not code)
- 1-2 lines per issue max
- Be honest - if it's good, say so

### Visual Analysis Checklist

**Level 1: Structure (Most Critical)**
- Container boundaries - Content overflow, shrunken containers
- Layer/z-index - Incorrect overlapping
- Distorted components - Stretched, squished shapes

**Level 2: Layout**
- Text wrapping - Unintentional stacking
- Alignment - Misaligned elements
- Grid layouts - Broken columns

**Level 3: Typography & Accessibility**
- Text size (min 16px body, 14px critical)
- Color contrast (WCAG AA)
- Touch targets (min 44x44px)

**Level 4: UX Polish**
- Visual hierarchy - Clear primary actions
- Content quality - User-friendly labels, not IDs
- Consistency - Design patterns, spacing

See `references/VISUAL-ANALYSIS-GUIDE.md` for detailed methodology.

---

## 2. User Flow Testing

### Create Flow Definition

Example: `.qa-testing/flows/checkout-flow.json`

```json
{
  "name": "Checkout Flow",
  "description": "Product to order confirmation",
  "baseUrl": "http://localhost:3000",
  "steps": [
    {
      "name": "View products",
      "url": "/products",
      "actions": ["login"],
      "capture": { "screenshot": true, "html": true },
      "assertions": [
        { "type": "visible", "selector": "h1:has-text('Products')" }
      ]
    },
    {
      "name": "Add to cart",
      "url": "/products",
      "actions": ["add-to-cart"],
      "assertions": [
        { "type": "visible", "selector": "text=Added to cart" }
      ]
    },
    {
      "name": "Checkout",
      "url": "/checkout",
      "capture": { "screenshot": true },
      "assertions": [
        { "type": "count", "selector": ".cart-item", "expected": 1 }
      ]
    }
  ]
}
```

### Run Flow

```bash
# Desktop
node ~/.claude/skills/qa-frontend-tester/scripts/run-flow.js .qa-testing/flows/checkout-flow.json

# Mobile
node ~/.claude/skills/qa-frontend-tester/scripts/run-flow.js .qa-testing/flows/checkout-flow.json --device mobile

# Debug mode
node ~/.claude/skills/qa-frontend-tester/scripts/run-flow.js .qa-testing/flows/signup-flow.json --headed --slow-mo 500
```

**Output:**
- Screenshots for each step (if enabled)
- HTML captures (if enabled)
- JSON report with pass/fail results
- Exit code 0 (pass) or 1 (fail) for CI/CD

**Assertion types:**
- `visible` - Element is visible
- `hidden` - Element is hidden
- `count` - Element count matches expected
- `text` - Element contains text
- `url` - URL includes expected path
- `attribute` - Element attribute matches value

---

## 3. Action System

### What Are Actions?

Reusable UI interaction sequences stored as JSON files. Think of them as building blocks for testing.

**Use cases:**
- Authentication flows
- Opening modals/dialogs
- Applying filters
- Filling forms
- Multi-step navigation

### Create Action

Location: `.qa-testing/actions/open-create-modal.action.json`

```json
{
  "type": "modal",
  "description": "Open create item modal",
  "actions": [
    {
      "type": "navigate",
      "url": "${targetUrl}"
    },
    {
      "type": "wait",
      "condition": "networkidle"
    },
    {
      "type": "click",
      "selector": "button:has-text('Create')"
    },
    {
      "type": "wait",
      "condition": "timeout",
      "timeout": 1500
    }
  ]
}
```

**Variables:**
- `${baseUrl}` - From config.json
- `${targetUrl}` - Passed at runtime
- `${credentials.email}` - From config.json
- `${credentials.password}` - From config.json

**Action types:**
`navigate`, `click`, `fill`, `type`, `select`, `check`, `uncheck`, `press`, `hover`, `scroll`, `wait`

See `references/ACTIONS.md` for complete action documentation.

### Use Actions

```bash
# Single action
node screenshot.js http://localhost:3000/dashboard --action login

# Multiple actions (runs in sequence)
node screenshot.js http://localhost:3000/market --actions login,open-modal,fill-form
```

**Authentication:** Login action is auto-detected for protected pages. Create `.qa-testing/actions/login.action.json` once, reuse everywhere.

---

## 4. Workflow Examples

### Visual Regression Test

```bash
# 1. Capture baseline
node screenshot.js http://localhost:3000/dashboard
cp .qa-testing/screenshots/dashboard.png .qa-testing/baselines/

# 2. Make changes to code

# 3. Capture new screenshot
node screenshot.js http://localhost:3000/dashboard

# 4. User pastes both screenshots → AI compares visually
```

### Multi-Page Visual Audit

```bash
# Capture all pages
node screenshot.js http://localhost:3000/
node screenshot.js http://localhost:3000/dashboard
node screenshot.js http://localhost:3000/settings

# User pastes screenshots → AI reports all issues across pages
```

### Complete Feature Test

```bash
# 1. Run user flow (automated assertions)
node run-flow.js .qa-testing/flows/signup-flow.json

# 2. Review generated screenshots visually
# 3. User pastes any suspicious screenshots → AI analyzes
```

### Accessibility Audit

```bash
# Capture screenshot
node screenshot.js http://localhost:3000/dashboard

# User pastes → AI focuses on:
# - Color contrast (WCAG AA)
# - Touch target sizes
# - Text sizing
# - Visual hierarchy
```

---

## 5. Fixing Issues

After visual analysis, AI can fix code directly:

**User:** "Fix all" or "Fix 1,3"

**AI:**
1. Locates relevant files (based on route/component)
2. Applies fixes silently
3. Takes new screenshot automatically
4. Asks user to paste for verification
5. Confirms fixes visually

**Important:** Fixes are code changes, not shown in reports. Reports describe visual outcomes only.

---

## Configuration

`.qa-testing/config.json`:

```json
{
  "credentials": {
    "email": "admin@acme.com",
    "password": "Admin123!"
  },
  "baseUrl": "http://localhost:3000",
  "viewport": { "width": 1920, "height": 1080 },
  "devices": {
    "mobile": { "width": 375, "height": 667 },
    "tablet": { "width": 768, "height": 1024 },
    "desktop": { "width": 1920, "height": 1080 }
  }
}
```

---

## Troubleshooting

**Error: .qa-testing directory not found:**
Project not initialized. Run `node ~/.claude/skills/qa-frontend-tester/scripts/init-project.js` first (see Prerequisites section).

**Error: config.json not found:**
Project not initialized. Run `node ~/.claude/skills/qa-frontend-tester/scripts/init-project.js` first.

**Playwright not installed:**
```bash
npm install -D playwright
bunx playwright install chromium
```

**Action not found:**
Check `.qa-testing/actions/` for the action file. Create it if missing (see examples).

**Screenshot naming incorrect:**
Ensure `x-matched-path` header is set in middleware.

**Dev server not running:**
Start your development server before running tests.

**Action outdated:**
Delete action file to regenerate with updated UI.

---

## Tips

**Visual analysis:**
- Only analyze what's visible in screenshot
- Don't speculate about error/loading/empty states unless shown
- Start with Level 1 (structural issues) - most critical
- Be concise - 1-2 lines per issue

**User flows:**
- Start simple (3-5 steps), expand as needed
- Use assertions to catch regressions
- Capture screenshots/HTML strategically (not every step)
- Reuse actions across flows

**Actions:**
- Keep actions small and focused
- Use stable selectors (text content > CSS classes)
- Test actions work before committing
- Commit actions to repo for team reuse

---

## Reference Documentation

**In this skill:**
- `references/ACTIONS.md` - Complete action system guide
- `references/VISUAL-ANALYSIS-GUIDE.md` - Detailed visual analysis methodology
- `references/ux-production-analysis.md` - UX improvement patterns
- `references/accessibility-standards.md` - WCAG AA standards
- `references/framework-fixes.md` - Framework-specific fix patterns

**Read when needed** - Not required for basic usage.

---

## When to Use This Skill

**Automatically trigger after:**
- Implementing new UI features
- Updating existing pages
- Making layout changes

**User requests:**
- "Test the dashboard visually"
- "Check accessibility on /settings"
- "Run the checkout flow"
- "Find layout issues"
- "Verify the UI works"
- "Capture screenshot and HTML"

**Proactive suggestions:**
- User: "I've added the new modal"
- Assistant: "Would you like me to test it visually?"
