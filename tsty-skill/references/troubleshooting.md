# Troubleshooting Guide

**Load this when encountering common issues with Tsty framework.**

---

## Table of Contents

1. [Initialization Issues](#initialization-issues)
2. [Directory and File Issues](#directory-and-file-issues)
3. [Dashboard Issues](#dashboard-issues)
4. [Playwright Issues](#playwright-issues)
5. [Flow Execution Issues](#flow-execution-issues)
6. [Browser Conflicts](#browser-conflicts)
7. [Performance Issues](#performance-issues)

---

## Initialization Issues

### "No configuration file found"

**Symptom:** Error when running `tsty run` or `tsty list`

**Solution:**
```bash
tsty init    # Initialize .tsty directory with config
```

**What it does:**
- Creates `.tsty/` directory
- Creates `config.json` with defaults
- Creates subdirectories: `actions/`, `flows/`, `reports/`, `screenshots/`

### Missing directories

**Symptom:** Errors about missing directories when saving flows/actions

**Solution:**
```bash
mkdir -p .tsty/{actions,flows,reports,screenshots}
```

**Or reinitialize:**
```bash
tsty init
```

---

## Directory and File Issues

### Flow not found

**Symptom:** `Error: Flow 'my-flow' not found`

**Check:**
```bash
# List all flows
tsty list flows

# Verify file exists
ls -la .tsty/flows/

# Check for typos
ls -la .tsty/flows/my-flow.json
```

**Common causes:**
- Typo in flow name
- Flow in subdirectory (e.g., `.tsty/flows/category/flow.json`)
- File extension wrong (must be `.json`)

**Solution:**
```bash
# Use exact filename without .json extension
tsty run my-flow  # For .tsty/flows/my-flow.json
tsty run category/my-flow  # For .tsty/flows/category/my-flow.json
```

### Action not found

**Symptom:** Flow runs but can't find referenced action

**Check:**
```bash
# List actions
tsty list actions

# Verify file exists
ls -la .tsty/actions/

# Check action file format
cat .tsty/actions/my-action.action.json
```

**Common causes:**
- Action file missing `.action.json` extension
- Action ID in flow doesn't match filename
- Action in subdirectory

**Solution:**
```bash
# Action files must end in .action.json
mv my-action.json my-action.action.json

# Update flow to reference correct action ID
```

---

## Dashboard Issues

### Dashboard port conflict

**Symptom:** `Error: Port 4000 already in use`

**Solution 1 - Use different port:**
```bash
tsty --port 3001
```

**Solution 2 - Kill existing process:**
```bash
# Find process using port 4000
lsof -ti:4000

# Kill process
lsof -ti:4000 | xargs kill -9

# Start dashboard
tsty
```

**Solution 3 - Find what's using the port:**
```bash
# See what's running on port 4000
lsof -i :4000

# If it's another tsty instance, safe to kill
# If it's something else, use different port
```

### Dashboard not loading

**Symptom:** Dashboard starts but browser shows blank page or connection refused

**Check:**
```bash
# Verify dashboard is running
curl http://localhost:4000

# Check console for errors
# Look for build errors in terminal
```

**Solutions:**
- Ensure dev server fully started (may take 10-15s)
- Clear browser cache
- Try different browser
- Check for JavaScript errors in browser console
- Restart dashboard: Ctrl+C, then `tsty`

---

## Playwright Issues

### Playwright not installed

**Symptom:** `Error: Playwright browsers not found`

**Solution:**
```bash
# Install Chromium (default)
npx playwright install chromium

# Or install all browsers
npx playwright install

# For specific browser
npx playwright install firefox
npx playwright install webkit
```

### Browser launch failed

**Symptom:** `Error: Failed to launch browser`

**Check:**
```bash
# Verify Playwright installation
npx playwright --version

# Test browser launch
npx playwright test --headed
```

**Common causes:**
- Missing system dependencies (Linux)
- Corrupted Playwright installation
- Insufficient permissions

**Solutions:**

**Linux - Install dependencies:**
```bash
npx playwright install-deps
```

**Reinstall Playwright:**
```bash
npm uninstall @playwright/test
npm install @playwright/test
npx playwright install chromium
```

---

## Flow Execution Issues

### Timeout waiting for selector

**Symptom:** `Error: Timeout 30000ms exceeded waiting for selector`

**Analysis:**
1. Read latest screenshot to see page state
2. Check if element visible
3. Verify selector syntax

**Solutions:**

**Element exists but selector wrong:**
```bash
# View screenshot to see actual page
open .tsty/screenshots/run-*/1-step-name.png

# Capture HTML to get exact selectors
# Update flow with correct selector
```

**Element slow to load:**
```json
{
  "primitives": [
    {
      "type": "waitForLoadState",
      "options": { "state": "networkidle" }
    },
    {
      "type": "click",
      "selector": "button",
      "timeout": 60000
    }
  ]
}
```

**Element doesn't exist:**
- Fix application code to render element
- Verify URL/navigation is correct

### Console errors detected

**Symptom:** `Flow stopped early: Console errors detected`

**Analysis:**
```bash
# Read latest report
cat .tsty/reports/flow-my-flow-*.json | jq '.steps[].console'
```

**Solution:**
1. Read console error message
2. Fix JavaScript bug in application code
3. Re-run test

**Example:**
```json
{
  "console": ["TypeError: Cannot read property 'map' of undefined at Dashboard.tsx:45"]
}
```

**Action:** Fix Dashboard.tsx line 45 (add null check)

### Assertions failed

**Symptom:** Step fails with "Assertion failed: Element not visible"

**Check:**
```bash
# Read report
cat .tsty/reports/flow-*.json | jq '.steps[].failedAssertions'

# View screenshot
open .tsty/screenshots/run-*/
```

**Solutions:**
- Update selector if element exists with different selector
- Add wait before assertion if element loads slowly
- Fix app code if element not rendering

---

## Browser Conflicts

### Tests interfere with browser tabs

**Q: Tests interfere with my browser tabs?**

**A:** They shouldn't! Playwright launches completely isolated browser instances.

**How Playwright works:**
- ✅ Launches its OWN browser (not your Chrome/Firefox/Safari)
- ✅ Separate user data directory (no shared cookies/sessions)
- ✅ Isolated from your normal browsing
- ✅ Connects to dev server (e.g., localhost:4000)
- ✅ Multiple tests can run without conflicts

**If you experience issues:**

```bash
# 1. Close all browser tabs
# 2. Check config - ensure headless mode enabled
cat .tsty/config.json | grep headless

# 3. Kill stale browser processes
pkill -f chromium
pkill -f firefox
pkill -f webkit

# 4. Restart tests
tsty run my-flow
```

### Headless vs. Non-Headless

**Headless: true (default)**
- Browser runs in background
- Faster execution
- No visible window
- Recommended for automation

**Headless: false**
- Browser window visible
- Useful for debugging
- Can see interactions in real-time
- Slower due to rendering

**Configuration:**
```json
{
  "playwright": {
    "headless": true
  }
}
```

### Dev server not running

**Symptom:** `Error: net::ERR_CONNECTION_REFUSED`

**Cause:** Tests try to connect to localhost but dev server not running

**Solution:**
```bash
# Start your dev server first
npm run dev
# or
bun run dev

# Then run tests
tsty run my-flow
```

**Note:** Tsty tests the app, it doesn't start the app. You must start your dev server separately.

---

## Performance Issues

### Tests running slowly

**Symptom:** Each test takes 60+ seconds

**Optimizations:**

**1. Enable fail-fast:**
```bash
tsty run my-flow --fail-fast
```

**2. Reduce timeouts:**
```json
{
  "playwright": {
    "timeout": 10000
  }
}
```

**3. Use headless mode (REQUIRED for autonomous testing):**
```json
{
  "playwright": {
    "headless": true  // CRITICAL: Always true for autonomous/agentic testing
  }
}
```

**Note:** Headless mode is ~20-30% faster and prevents browser windows during autonomous iteration.

**4. Disable unnecessary captures:**
```json
{
  "capture": {
    "screenshot": false,
    "html": false
  }
}
```

### Screenshot directory growing large

**Symptom:** `.tsty/screenshots/` using too much disk space

**Solution:**
```bash
# Remove old screenshots
find .tsty/screenshots -type d -mtime +7 -exec rm -rf {} +

# Or remove all screenshots
rm -rf .tsty/screenshots/run-*

# Or remove specific flow's screenshots
rm -rf .tsty/screenshots/run-my-flow-*
```

**Automate cleanup:**
```bash
# Add to .gitignore
echo ".tsty/screenshots/" >> .gitignore

# Clean before CI runs
rm -rf .tsty/screenshots/ && tsty run my-flow
```

---

## Common Error Messages

### "Cannot find module"

**Error:** `Cannot find module '@playwright/test'`

**Solution:**
```bash
npm install @playwright/test
npx playwright install chromium
```

### "Permission denied"

**Error:** `EACCES: permission denied, mkdir '.tsty'`

**Solution:**
```bash
# Fix permissions
chmod u+w .

# Or run with sudo (not recommended)
sudo tsty init
```

### "Invalid JSON"

**Error:** `Unexpected token in JSON at position X`

**Cause:** Syntax error in flow/action JSON file

**Solution:**
```bash
# Validate JSON
cat .tsty/flows/my-flow.json | jq .

# Common issues:
# - Missing comma
# - Trailing comma
# - Unescaped quotes
# - Missing closing bracket
```

---

## When to Seek Help

**If none of these solutions work:**
1. Check GitHub issues: https://github.com/mde-pach/tsty/issues
2. Create minimal reproduction
3. Include: OS, Node version, error message, flow JSON, config
4. Attach screenshots and reports
