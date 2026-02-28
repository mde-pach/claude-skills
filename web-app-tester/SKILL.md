---
name: web-app-tester
description: Automated end-to-end testing for web applications using Playwright (TypeScript). Generates comprehensive test reports with screenshots, console logs, and bug tracking. Use when asked to test a web app, find bugs, verify functionality, check if features work, or perform QA testing. Supports authentication flows, multi-page navigation, form interactions, and visual regression testing.
---

# Web App Tester

## Overview

Automatically test web applications using Playwright TypeScript. Creates detailed bug reports with screenshots, severity classifications, and reproduction steps. Integrates seamlessly with TypeScript/JavaScript projects.

## Quick Start

**Basic usage:**
```
"Test my app at http://localhost:3000"
"Find bugs in the dashboard"
"Check if the login flow works"
```

**With authentication:**
```
"Test my app, login with user@example.com / password123"
"Check all pages after logging in as admin"
```

**Custom scenarios:**
```
"Test the checkout flow: add item, go to cart, checkout"
"Verify that search returns results for 'laptop'"
```

## Prerequisites

The skill automatically handles Playwright installation. Tests run in the skill's directory with its own dependencies.

## Testing Workflow

### 1. Understand Test Scope

Ask clarifying questions if needed:
- What URL should be tested?
- Does it require authentication? (credentials)
- What pages/features to test?
- Are there specific user flows to verify?
- What's the dev server command? (e.g., `bun run dev`, `npm run dev`)

### 2. Generate Test Script

Create a TypeScript Playwright test that:
- Navigates to the application
- Performs authentication if required
- Tests specified pages/features
- Captures screenshots at each step
- Records console errors and page errors
- Reports bugs with severity levels

### 3. Execute and Report

Run the test and provide:
- Summary of pages/features tested
- List of bugs found (CRITICAL, HIGH, MEDIUM, LOW)
- Screenshots path for visual inspection
- Recommendations for fixes

## Test Script Structure

Create `test.ts` in the skill's `scripts/` directory:

```typescript
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface Bug {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  issue: string;
  screenshot: string;
}

async function testWebApp(): Promise<number> {
  const bugsFound: Bug[] = [];
  const screenshotsDir = '/tmp/test-screenshots';

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();

    // Track console messages and errors
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', err => {
      pageErrors.push(err.toString());
    });

    // Test steps go here
    console.log('Starting tests...');

    // 1. Load page
    // 2. Authenticate if needed
    // 3. Test features
    // 4. Record bugs

  } catch (error) {
    bugsFound.push({
      severity: 'CRITICAL',
      location: 'Test Execution',
      issue: error instanceof Error ? error.message : String(error),
      screenshot: 'N/A'
    });
  } finally {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }

  printBugReport(bugsFound, screenshotsDir);
  return bugsFound.length;
}

function printBugReport(bugs: Bug[], screenshotsDir: string): void {
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total bugs found: ${bugs.length}`);
  console.log(`Screenshots saved to: ${screenshotsDir}`);

  if (bugs.length > 0) {
    const critical = bugs.filter(b => b.severity === 'CRITICAL');
    const high = bugs.filter(b => b.severity === 'HIGH');
    const medium = bugs.filter(b => b.severity === 'MEDIUM');
    const low = bugs.filter(b => b.severity === 'LOW');

    if (critical.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES:');
      critical.forEach((bug, i) => {
        console.log(`  ${i + 1}. [${bug.location}] ${bug.issue}`);
        console.log(`     Screenshot: ${bug.screenshot}`);
      });
    }

    if (high.length > 0) {
      console.log('\n🟠 HIGH PRIORITY ISSUES:');
      high.forEach((bug, i) => {
        console.log(`  ${i + 1}. [${bug.location}] ${bug.issue}`);
        console.log(`     Screenshot: ${bug.screenshot}`);
      });
    }

    if (medium.length > 0) {
      console.log('\n🟡 MEDIUM PRIORITY ISSUES:');
      medium.forEach((bug, i) => {
        console.log(`  ${i + 1}. [${bug.location}] ${bug.issue}`);
        console.log(`     Screenshot: ${bug.screenshot}`);
      });
    }

    if (low.length > 0) {
      console.log('\n🔵 LOW PRIORITY ISSUES:');
      low.forEach((bug, i) => {
        console.log(`  ${i + 1}. [${bug.location}] ${bug.issue}`);
        console.log(`     Screenshot: ${bug.screenshot}`);
      });
    }
  } else {
    console.log('\n✅ No bugs detected! App is working well.');
  }

  console.log('='.repeat(80));
}

// Run the test
testWebApp().then(exitCode => {
  process.exit(exitCode > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

## Common Test Patterns

### Authentication Flow
```typescript
// Find and fill login form
const emailInput = page.locator('input[type="email"]').first();
const passwordInput = page.locator('input[type="password"]').first();
const submitButton = page.locator('button[type="submit"]').first();

const emailCount = await emailInput.count();
if (emailCount > 0) {
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.screenshot({ path: `${screenshotsDir}/before_login.png`, fullPage: true });
  await submitButton.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${screenshotsDir}/after_login.png`, fullPage: true });
  console.log(`✓ Login submitted`);
} else {
  bugsFound.push({
    severity: 'HIGH',
    location: 'Login Page',
    issue: 'Email input not found',
    screenshot: `${screenshotsDir}/login_page.png`
  });
  console.log('✗ ERROR: Email input not found');
}
```

### Navigation Testing
```typescript
// Test navigation to a page
try {
  const navLink = page.locator('a[href*="/dashboard"]').first();
  const linkCount = await navLink.count();

  if (linkCount > 0) {
    await navLink.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotsDir}/dashboard.png`, fullPage: true });
    console.log(`✓ Dashboard loaded via link`);
  } else {
    // Try direct navigation
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${screenshotsDir}/dashboard.png`, fullPage: true });
    console.log(`✓ Dashboard loaded directly`);
  }
} catch (error) {
  bugsFound.push({
    severity: 'HIGH',
    location: 'Dashboard',
    issue: `Failed to load: ${error instanceof Error ? error.message : String(error)}`,
    screenshot: `${screenshotsDir}/dashboard.png`
  });
  console.log(`✗ ERROR in Dashboard: ${error}`);
}
```

### Form Interaction
```typescript
// Fill and submit a form
const formInput = page.locator('input[name="search"]');
const inputCount = await formInput.count();

if (inputCount > 0) {
  await formInput.fill('test query');
  await formInput.press('Enter');
  await page.waitForLoadState('networkidle');

  // Verify results
  const results = page.locator('.search-result');
  const resultsCount = await results.count();

  if (resultsCount === 0) {
    bugsFound.push({
      severity: 'MEDIUM',
      location: 'Search',
      issue: 'No results displayed',
      screenshot: `${screenshotsDir}/search_results.png`
    });
  }
  await page.screenshot({ path: `${screenshotsDir}/search_results.png`, fullPage: true });
}
```

### Console Error Detection
```typescript
// Check for console errors (at end of test)
const errorMessages = consoleMessages.filter(msg => msg.toLowerCase().includes('[error]'));

for (const err of errorMessages) {
  bugsFound.push({
    severity: 'MEDIUM',
    location: 'Browser Console',
    issue: err,
    screenshot: 'See browser console'
  });
  console.log(`  ✗ Console error: ${err}`);
}

// Check for page errors
for (const err of pageErrors) {
  bugsFound.push({
    severity: 'HIGH',
    location: 'JavaScript Runtime',
    issue: err,
    screenshot: 'N/A'
  });
  console.log(`  ✗ Page error: ${err}`);
}
```

## Severity Guidelines

- **CRITICAL**: App crashes, cannot proceed, authentication completely broken
- **HIGH**: Major features don't work, pages fail to load, JavaScript errors
- **MEDIUM**: Minor features broken, console warnings, poor UX
- **LOW**: Cosmetic issues, minor inconsistencies

## Execution

The skill handles execution automatically:

1. **Creates test file** in `/Users/maximedepachtere/.claude/skills/web-app-tester/scripts/test.ts`
2. **Ensures dependencies** are installed (package.json, playwright, typescript)
3. **Runs the test** with `npx tsx test.ts`
4. **Reports results** with colored output and screenshot paths

You can also manually run tests:
```bash
cd /Users/maximedepachtere/.claude/skills/web-app-tester/scripts
npx tsx test.ts
```

## Best Practices

- Always wait for `networkidle` after navigation
- Take screenshots before and after critical actions
- Use descriptive bug locations (page name, feature)
- Include reproduction steps in bug descriptions
- Group related tests (e.g., all auth tests together)
- Test in realistic viewport sizes (1920x1080 desktop, 375x667 mobile)
- Use `try-catch-finally` to ensure browser closes
- Use `await` for all Playwright actions
- Check element counts before interacting (`await locator.count()`)

## Advanced Patterns

### Mobile Testing
```typescript
const context = await browser.newContext({
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)...'
});
```

### Network Request Interception
```typescript
page.on('request', request => {
  console.log(`Request: ${request.method()} ${request.url()}`);
});

page.on('response', response => {
  if (response.status() >= 400) {
    bugsFound.push({
      severity: 'MEDIUM',
      location: 'Network',
      issue: `Failed request: ${response.url()} (${response.status()})`,
      screenshot: 'N/A'
    });
  }
});
```

### Performance Metrics
```typescript
const navigationTiming = await page.evaluate(() => {
  const perfData = window.performance.timing;
  return {
    loadTime: perfData.loadEventEnd - perfData.navigationStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart
  };
});

if (navigationTiming.loadTime > 5000) {
  bugsFound.push({
    severity: 'LOW',
    location: 'Performance',
    issue: `Slow page load: ${navigationTiming.loadTime}ms`,
    screenshot: 'N/A'
  });
}
```
