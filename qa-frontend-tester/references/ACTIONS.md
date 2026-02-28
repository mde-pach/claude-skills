# Action System Documentation

The qa-frontend-tester skill includes a **generic action recording system** that allows you to capture and replay ANY sequence of UI interactions needed to reach a specific page state before taking screenshots.

## Overview

Actions are reusable JSON files stored in `.visual-testing/actions/` that define sequences of browser interactions. They work like test automation frameworks (Playwright/Cypress) and get committed to the repository for reuse across the team.

**Key benefits:**
- ✅ **Generic** - Works for any UI interaction (auth, modals, filters, forms, navigation)
- ✅ **Reusable** - Create once, use across multiple screenshots/pages
- ✅ **Committed** - Actions live in the repo alongside code
- ✅ **Token efficient** - No need to re-analyze the same flow repeatedly
- ✅ **Team-shared** - Everyone benefits from created actions

## When to Create Actions

Create an action whenever you need to interact with the UI before taking a screenshot:

**Common scenarios:**
1. **Authentication** - Login flows (login.action.json)
2. **Modal/Dialog opening** - Click buttons to open dialogs (open-create-tag-modal.action.json)
3. **Filter application** - Apply search/filter settings
4. **Form filling** - Pre-fill forms to specific states
5. **Navigation sequences** - Multi-step navigation flows
6. **Tab/accordion opening** - Expand collapsed content
7. **Dropdown interactions** - Open and select from dropdowns
8. **Any UI state** - Anything that requires clicking/typing before screenshot

## Action File Format

Actions are JSON files with this structure:

```json
{
  "type": "modal|auth|filter|form|navigation|interaction",
  "description": "Human-readable description of what this does",
  "actions": [
    {
      "type": "navigate|click|fill|wait|press|select",
      "...": "action-specific properties"
    }
  ]
}
```

### Action Types (File Level)

The `type` field categorizes the action's purpose:

- **`auth`** - Authentication flows
- **`modal`** - Opening modals/dialogs
- **`filter`** - Applying filters/search
- **`form`** - Filling forms
- **`navigation`** - Multi-page navigation
- **`interaction`** - Generic UI interactions

### Step Types (Action Level)

Each step in the `actions` array has a `type` that determines its behavior:

#### 1. Navigate

Navigate to a URL.

```json
{
  "type": "navigate",
  "url": "http://localhost:3000/login"
}
```

**With variable substitution:**
```json
{
  "type": "navigate",
  "url": "${targetUrl}"
}
```

The `${targetUrl}` variable is automatically provided by the screenshot script.

#### 2. Click

Click an element.

```json
{
  "type": "click",
  "selector": "button[type='submit']"
}
```

**Selector options:**
- CSS selectors: `button[type='submit']`, `#login-btn`, `.modal-trigger`
- Text selectors: `text=Nouveau tag`, `text=Sign In`
- Data attributes: `[data-testid="create-button"]`
- Combined: `button:has-text("Create")`

#### 3. Fill

Fill an input field.

```json
{
  "type": "fill",
  "selector": "input[type='email']",
  "value": "user@example.com"
}
```

**With variable substitution:**
```json
{
  "type": "fill",
  "selector": "input[type='email']",
  "value": "${credentials.email}"
}
```

Variables available:
- `${credentials.email}` - From config.json or seed file
- `${credentials.password}` - From config.json or seed file
- `${targetUrl}` - The URL being tested
- Any custom variables passed via context

#### 4. Wait

Wait for various conditions.

**Wait for network idle:**
```json
{
  "type": "wait",
  "condition": "networkidle"
}
```

**Wait for element to appear:**
```json
{
  "type": "wait",
  "selector": "input[type='email']",
  "timeout": 5000
}
```

**Wait for URL pattern:**
```json
{
  "type": "wait",
  "urlPattern": "**/dashboard"
}
```

**Wait for fixed duration:**
```json
{
  "type": "wait",
  "condition": "timeout",
  "timeout": 1500
}
```

**Wait for navigation:**
```json
{
  "type": "wait",
  "condition": "navigation"
}
```

#### 5. Press

Press a keyboard key.

```json
{
  "type": "press",
  "selector": "input[type='search']",
  "key": "Enter"
}
```

**Common keys:**
- `Enter`, `Escape`, `Tab`, `ArrowDown`, `ArrowUp`, `Space`, `Backspace`

#### 6. Select

Select an option from a dropdown.

```json
{
  "type": "select",
  "selector": "select[name='category']",
  "value": "engineering"
}
```

## Creating Actions: Step-by-Step

### Method 1: Manual Creation (Recommended)

When you need a new action (e.g., opening a modal), follow these steps:

#### Step 1: Analyze the Page

First, understand what UI elements are available. You can either:

**Option A: Use the ActionRecorder's analyzePage method**

The `action-recorder.js` includes a `analyzePage()` method that automatically detects:
- Forms and their input fields
- Buttons (with text content)
- Dialog triggers (buttons that might open modals)
- Filter controls (search inputs, selects)

To use it programmatically, you would need to create a separate analysis script. However, for most cases, **manual inspection is faster and more practical**.

**Option B: Manually inspect the page (faster for most cases)**

1. Open the page in your browser's DevTools
2. Find the button/element that triggers the interaction
3. Identify the best selector (priority order):
   - `data-testid` attribute (most reliable)
   - `name` attribute
   - `type` attribute (for inputs)
   - `aria-label` attribute
   - Text content (for buttons)
   - CSS class/ID (less reliable)

#### Step 2: Create the Action File

Create a new JSON file in `.visual-testing/actions/` with a descriptive name:

**Naming convention:**
- `login.action.json` - For auth
- `open-{feature}-modal.action.json` - For modals
- `apply-{context}-filters.action.json` - For filters
- `fill-{form-name}.action.json` - For forms

**Example: Creating open-create-event-modal.action.json**

```json
{
  "type": "modal",
  "description": "Open create event modal",
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
      "selector": "button:has-text('New Event')"
    },
    {
      "type": "wait",
      "condition": "timeout",
      "timeout": 1000
    }
  ]
}
```

#### Step 3: Test the Action

Run the screenshot script with your new action:

```bash
node ~/.claude/skills/qa-frontend-tester/scripts/screenshot.js http://localhost:3000/events --actions login,open-create-event-modal
```

**Debug tips:**
- Add `timeout` waits between steps if interactions are too fast
- Use `networkidle` waits after navigation
- Check selector specificity if clicks fail
- Verify element visibility with DevTools

#### Step 4: Commit the Action

Once tested, commit the action file to the repository:

```bash
git add .visual-testing/actions/open-create-event-modal.action.json
git commit -m "feat(visual-testing): add action to open create event modal"
```

### Method 2: Automated Detection (Auth Only)

The screenshot script **automatically detects** when authentication is needed and will:

1. Detect redirect to `/login` or HTTP 401/403
2. Check if `login.action.json` exists
3. If exists: Use it automatically
4. If missing: Show error with example action structure

**This only works for authentication.** For other interactions (modals, filters, etc.), you must create actions manually.

## Using Actions

### Automatic Usage (Auth Only)

Authentication actions are applied automatically when needed:

```bash
node ~/.claude/skills/qa-frontend-tester/scripts/screenshot.js http://localhost:3000/dashboard
# → Auto-detects auth needed
# → Uses login.action.json if it exists
# → Logs in and takes screenshot
```

### Explicit Usage

For non-auth actions, specify them explicitly:

**Single action:**
```bash
node screenshot.js http://localhost:3000/events --action open-create-event-modal
```

**Multiple actions (executed in order):**
```bash
node screenshot.js http://localhost:3000/events --actions login,open-create-event-modal
```

**Chaining workflow:**
1. Auth action runs (if needed)
2. Custom action runs
3. Screenshot is taken

## Action Examples

### Example 1: Authentication (login.action.json)

```json
{
  "type": "auth",
  "description": "Login to the application",
  "actions": [
    {
      "type": "navigate",
      "url": "http://localhost:3000/login"
    },
    {
      "type": "wait",
      "selector": "input[type='email']",
      "timeout": 5000
    },
    {
      "type": "fill",
      "selector": "input[type='email']",
      "value": "${credentials.email}"
    },
    {
      "type": "fill",
      "selector": "input[type='password']",
      "value": "${credentials.password}"
    },
    {
      "type": "click",
      "selector": "button[type='submit']"
    },
    {
      "type": "wait",
      "condition": "timeout",
      "timeout": 3000
    }
  ]
}
```

### Example 2: Open Modal (open-create-tag-modal.action.json)

```json
{
  "type": "modal",
  "description": "Open create tag modal",
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
      "type": "wait",
      "condition": "timeout",
      "timeout": 1000
    },
    {
      "type": "click",
      "selector": "text=Nouveau tag"
    },
    {
      "type": "wait",
      "condition": "timeout",
      "timeout": 1500
    }
  ]
}
```

### Example 3: Apply Filters

```json
{
  "type": "filter",
  "description": "Apply status and category filters",
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
      "type": "fill",
      "selector": "input[placeholder='Search']",
      "value": "restaurant"
    },
    {
      "type": "select",
      "selector": "select[name='category']",
      "value": "food"
    },
    {
      "type": "click",
      "selector": "button:has-text('Apply')"
    },
    {
      "type": "wait",
      "condition": "networkidle"
    }
  ]
}
```

### Example 4: Multi-Step Navigation

```json
{
  "type": "navigation",
  "description": "Navigate to specific event details",
  "actions": [
    {
      "type": "navigate",
      "url": "http://localhost:3000/events"
    },
    {
      "type": "wait",
      "condition": "networkidle"
    },
    {
      "type": "click",
      "selector": "a:has-text('Team Building')"
    },
    {
      "type": "wait",
      "condition": "networkidle"
    },
    {
      "type": "click",
      "selector": "button:has-text('View Details')"
    },
    {
      "type": "wait",
      "condition": "timeout",
      "timeout": 1000
    }
  ]
}
```

### Example 5: Form Pre-Fill

```json
{
  "type": "form",
  "description": "Pre-fill restaurant creation form",
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
      "selector": "button:has-text('New Restaurant')"
    },
    {
      "type": "wait",
      "condition": "timeout",
      "timeout": 1000
    },
    {
      "type": "fill",
      "selector": "input[name='name']",
      "value": "La Bella Italia"
    },
    {
      "type": "fill",
      "selector": "input[name='address']",
      "value": "123 Main St"
    },
    {
      "type": "select",
      "selector": "select[name='cuisine']",
      "value": "italian"
    }
  ]
}
```

## Credentials Management

Actions can use credentials from two sources:

### 1. Config File (Preferred)

Create `.visual-testing/config.json`:

```json
{
  "credentials": {
    "email": "admin@acme.com",
    "password": "Admin123!"
  }
}
```

**Add to .gitignore:**
```
.visual-testing/config.json
```

### 2. Seed File (Auto-Detection)

The system automatically extracts credentials from `prisma/seed.ts` or `prisma/seed.js`:

```typescript
// In prisma/seed.ts
const hashedPassword = await bcrypt.hash('Admin123!', 10);

await prisma.user.upsert({
  where: { email: 'admin@acme.com' },
  // ...
});
```

The system will detect:
- Email: `admin@acme.com`
- Password: `Admin123!`

## Variable Substitution

Actions support variable substitution using `${variable.path}` syntax:

**Available variables:**

| Variable | Source | Example |
|----------|--------|---------|
| `${credentials.email}` | config.json or seed file | `admin@acme.com` |
| `${credentials.password}` | config.json or seed file | `Admin123!` |
| `${targetUrl}` | Screenshot script argument | `http://localhost:3000/dashboard` |

**Usage in actions:**

```json
{
  "type": "fill",
  "selector": "input[name='email']",
  "value": "${credentials.email}"
}
```

**Custom variables** can be passed via context when calling the action programmatically.

## Best Practices

### Selector Stability

**Prefer stable selectors (most to least stable):**

1. ✅ `[data-testid="create-button"]` - Most stable, explicitly for testing
2. ✅ `input[name="email"]` - Stable, semantic attribute
3. ✅ `button[type="submit"]` - Stable, semantic attribute
4. ⚠️ `text=Create Event` - Fragile if text changes or is i18n
5. ❌ `.btn-primary` - Fragile, implementation detail
6. ❌ `div > button:nth-child(2)` - Very fragile, breaks with DOM changes

**Recommendation:** Add `data-testid` attributes to UI components that need testing/screenshotting.

### Wait Strategy

**Use appropriate waits:**

- **After navigation**: `"condition": "networkidle"` - Waits for network requests to finish
- **After clicks**: `"condition": "timeout", "timeout": 500-1000` - Gives UI time to animate
- **For dynamic content**: `"selector": "div.loaded"` - Waits for specific element
- **For URL changes**: `"urlPattern": "**/dashboard"` - Waits for navigation

**Avoid:**
- ❌ Fixed long waits (>3000ms) - Slows down tests unnecessarily
- ❌ No waits after clicks - Can miss animations or cause race conditions

### Action Granularity

**One action = One reusable interaction:**

- ✅ `login.action.json` - Complete login flow
- ✅ `open-create-event-modal.action.json` - Opens specific modal
- ✅ `apply-date-filter.action.json` - Applies date filtering

**Don't create:**
- ❌ `login-and-open-modal.action.json` - Too specific, not reusable
- ❌ `click-button.action.json` - Too generic, not useful

### Testing Actions

Always test new actions before committing:

```bash
# Test the action works
node screenshot.js <url> --action <action-name>

# Test with chained actions
node screenshot.js <url> --actions login,my-new-action

# Verify screenshot shows expected state
open .screenshots/<filename>.png
```

## Troubleshooting

### Action Not Found

**Error:** `Action "my-action" not found in .visual-testing/actions/`

**Fix:** Ensure the file exists and is named correctly:
- File must be in `.visual-testing/actions/`
- File must end with `.action.json`
- File name must match (case-sensitive)

### Selector Not Found

**Error:** `Selector "button.create" not found`

**Debug steps:**
1. Open the page in DevTools
2. Try the selector in browser console: `document.querySelector('button.create')`
3. Check if element is hidden or in iframe
4. Try alternative selectors (text, data-testid, name)

### Wait Timeout

**Error:** `Timeout waiting for selector`

**Fix:**
- Increase timeout: `"timeout": 10000`
- Use different wait condition
- Check if element appears later in flow
- Verify page loaded correctly

### Variable Not Substituted

**Error:** `Filled "${credentials.email}" literally`

**Debug:**
- Check config.json exists and is valid JSON
- Verify credentials key exists in config
- Check seed file format if using auto-detection
- Ensure action uses correct variable path

## Advanced: Programmatic Usage

You can use the ActionRecorder class directly in scripts:

```javascript
const { ActionRecorder } = require('.claude/skills/qa-frontend-tester/action-recorder.js');
const { chromium } = require('playwright');

const recorder = new ActionRecorder();
const browser = await chromium.launch();
const page = await browser.newPage();

// Replay an action
await recorder.replayAction(page, 'login', {
  credentials: { email: 'user@example.com', password: 'pass123' }
});

// Analyze a page
const analysis = await recorder.analyzePage(page);
console.log('Found forms:', analysis.forms.length);
console.log('Found buttons:', analysis.buttons.length);

// Detect required actions
const required = await recorder.detectRequiredActions(page, 'http://localhost:3000/dashboard');
```

## Summary

**Actions are:**
- ✅ Generic UI interaction sequences
- ✅ Stored as JSON files in `.visual-testing/actions/`
- ✅ Reusable across screenshots and team members
- ✅ Committed to repository
- ✅ Used via `--action` or `--actions` flags

**When to create actions:**
- Opening modals/dialogs
- Applying filters
- Pre-filling forms
- Multi-step navigation
- Any UI state before screenshot

**How to create actions:**
1. Manually inspect the page for selectors
2. Create JSON file with action steps
3. Test with screenshot script
4. Commit to repository

**Key insight:** Actions are just like test automation fixtures - write once, use everywhere!
