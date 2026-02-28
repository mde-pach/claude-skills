# Example Actions

These example actions demonstrate the capabilities of the action system. They are NOT intended to be copied directly into your project - instead, use them as templates to create your own project-specific actions.

## Available Examples

### Authentication
- **login-email-password.action.json** - Standard email/password login flow

### Modals & Dialogs
- **open-create-modal.action.json** - Opening creation modals/dialogs

### Filters & Search
- **apply-filters.action.json** - Applying filters to list views

### Forms
- **fill-form.action.json** - Pre-filling forms with test data

### Navigation
- **multi-step-navigation.action.json** - Multi-step navigation flows
- **dropdown-select.action.json** - Dropdown/select interactions

## How to Use

1. **Review examples** to understand action structure and capabilities
2. **Adapt to your project** by updating selectors and values
3. **Save in project** at `.tsty/actions/` in your project
4. **Test action** works with your UI
5. **Commit to repo** for team reuse

## Action Structure

```json
{
  "type": "modal|filter|form|authentication|navigation|interaction",
  "description": "What this action does",
  "primitives": [
    {
      "type": "navigate|click|fill|type|wait|...",
      "selector": "CSS selector or Playwright selector",
      "value": "Value to use (supports variables)"
    }
  ]
}
```

## Variables

Actions support these variables from config.json:
- `${baseUrl}` - Base URL from config
- `${targetUrl}` - URL passed at runtime
- `${credentials.email}` - Email from config
- `${credentials.password}` - Password from config

## Selectors

Use resilient selectors that won't break with UI changes:

**Prefer:**
- Text content: `button:has-text('Create')`
- Semantic attributes: `button[type='submit']`
- ARIA roles: `button[role='button']`

**Avoid:**
- CSS classes: `.btn-primary-123`
- Deep nesting: `div > div > div > button`
- Position-based: `:nth-child(3)`

## Testing Actions

Test your action works before committing:

```bash
node ~/.claude/skills/qa-frontend-tester/scripts/screenshot.js http://localhost:3000/page --actions your-action
```

If the screenshot shows the expected UI state, the action works!
