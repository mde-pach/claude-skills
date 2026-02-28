import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface Bug {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  issue: string;
  screenshot: string;
  consoleErrors?: string[];
}

interface TestResult {
  page: string;
  success: boolean;
  screenshot: string;
  consoleErrors: string[];
  pageErrors: string[];
  warnings: string[];
}

// Pages to test
const PAGES_TO_TEST = [
  // Main pages
  { path: '/', name: 'Home / Dashboard' },
  { path: '/dashboard', name: 'Dashboard' },

  // Yum module
  { path: '/yum', name: 'Yum - Main' },
  { path: '/yum/restaurants/new', name: 'Yum - New Restaurant' },
  { path: '/yum/meals/new', name: 'Yum - New Meal' },
  { path: '/yum/tokens', name: 'Yum - Tokens' },

  // Events module
  { path: '/events', name: 'Events - List' },

  // Market module
  { path: '/market', name: 'Market - Listings' },
  { path: '/market/messages', name: 'Market - Messages' },

  // CoVoit module
  { path: '/covoit', name: 'CoVoit - Rides' },

  // CSE module
  { path: '/cse', name: 'CSE - Dashboard' },
  { path: '/cse/discounts', name: 'CSE - Discounts' },
  { path: '/cse/posts', name: 'CSE - Posts' },
  { path: '/cse/polls', name: 'CSE - Polls' },
  { path: '/cse/chat', name: 'CSE - Anonymous Chat' },

  // Settings & Profile
  { path: '/profile', name: 'User Profile' },
  { path: '/notifications', name: 'Notifications' },
  { path: '/settings', name: 'Settings - General' },
  { path: '/settings/users', name: 'Settings - Users' },
  { path: '/settings/modules', name: 'Settings - Modules' },
  { path: '/settings/tags', name: 'Settings - Tags' },
];

async function testWebApp(): Promise<number> {
  const bugsFound: Bug[] = [];
  const testResults: TestResult[] = [];
  const screenshotsDir = '/tmp/vipro-test-screenshots';

  // Create screenshots directory
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    console.log('🚀 Starting ViPro Non-Regression Tests...\n');

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'fr-FR',
    });
    page = await context.newPage();

    // ======================
    // STEP 1: LOGIN
    // ======================
    console.log('📝 Step 1: Authentication');
    console.log('  → Navigating to login page...');

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: `${screenshotsDir}/01_login_page.png`, fullPage: true });

    // Find and fill login form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    const emailCount = await emailInput.count();
    if (emailCount > 0) {
      await emailInput.fill('admin@acme.com');
      await passwordInput.fill('Admin123!');
      console.log('  → Credentials entered');

      await page.screenshot({ path: `${screenshotsDir}/02_before_login.png`, fullPage: true });
      await submitButton.click();

      // Wait for redirect
      await page.waitForURL('http://localhost:3000/**', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${screenshotsDir}/03_after_login.png`, fullPage: true });
      console.log('  ✓ Login successful\n');
    } else {
      bugsFound.push({
        severity: 'CRITICAL',
        location: 'Login Page',
        issue: 'Login form not found - cannot proceed with tests',
        screenshot: `${screenshotsDir}/01_login_page.png`
      });
      console.log('  ✗ CRITICAL: Login form not found\n');
      throw new Error('Cannot proceed without authentication');
    }

    // ======================
    // STEP 2: TEST ALL PAGES
    // ======================
    console.log('🔍 Step 2: Testing all pages for errors\n');

    for (const pageInfo of PAGES_TO_TEST) {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const warnings: string[] = [];

      // Set up listeners for this page
      const consoleListener = (msg: any) => {
        const msgType = msg.type();
        const msgText = msg.text();

        if (msgType === 'error') {
          consoleErrors.push(msgText);
        } else if (msgType === 'warning') {
          warnings.push(msgText);
        }
      };

      const pageErrorListener = (err: Error) => {
        pageErrors.push(err.toString());
      };

      page.on('console', consoleListener);
      page.on('pageerror', pageErrorListener);

      try {
        console.log(`  Testing: ${pageInfo.name}`);
        console.log(`    → Navigating to ${pageInfo.path}`);

        // Navigate to page
        await page.goto(`http://localhost:3000${pageInfo.path}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });

        // Wait a bit for React to fully render and any effects to run
        await page.waitForTimeout(1000);

        // Take screenshot
        const screenshotName = pageInfo.path.replace(/\//g, '_') || '_home';
        const screenshotPath = `${screenshotsDir}/page${screenshotName}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Check for React errors in the DOM
        const reactErrorElement = await page.locator('[data-nextjs-dialog-overlay]').count();
        if (reactErrorElement > 0) {
          const errorText = await page.locator('[data-nextjs-dialog-overlay]').first().textContent();
          pageErrors.push(`Next.js Error Dialog: ${errorText}`);
        }

        const success = consoleErrors.length === 0 && pageErrors.length === 0;

        testResults.push({
          page: pageInfo.name,
          success,
          screenshot: screenshotPath,
          consoleErrors,
          pageErrors,
          warnings,
        });

        // Categorize bugs
        if (pageErrors.length > 0) {
          pageErrors.forEach(err => {
            bugsFound.push({
              severity: 'CRITICAL',
              location: pageInfo.name,
              issue: `Page Error: ${err}`,
              screenshot: screenshotPath,
              consoleErrors,
            });
          });
          console.log(`    ✗ CRITICAL: ${pageErrors.length} page error(s)`);
        }

        if (consoleErrors.length > 0) {
          // Filter out known/expected errors
          const significantErrors = consoleErrors.filter(err => {
            // Filter out common development warnings
            return !err.includes('Download the React DevTools') &&
                   !err.includes('Warning: Extra attributes from the server');
          });

          if (significantErrors.length > 0) {
            bugsFound.push({
              severity: 'HIGH',
              location: pageInfo.name,
              issue: `${significantErrors.length} console error(s) detected`,
              screenshot: screenshotPath,
              consoleErrors: significantErrors,
            });
            console.log(`    ✗ HIGH: ${significantErrors.length} console error(s)`);
          }
        }

        if (warnings.length > 0) {
          const significantWarnings = warnings.filter(w => {
            // Filter out hydration warnings and other common Next.js warnings
            return !w.includes('Prop `') &&
                   !w.includes('did not match') &&
                   !w.includes('Text content does not match');
          });

          if (significantWarnings.length > 0) {
            bugsFound.push({
              severity: 'MEDIUM',
              location: pageInfo.name,
              issue: `${significantWarnings.length} console warning(s)`,
              screenshot: screenshotPath,
              consoleErrors: significantWarnings,
            });
            console.log(`    ⚠ MEDIUM: ${significantWarnings.length} warning(s)`);
          }
        }

        if (success) {
          console.log(`    ✓ Page loaded successfully`);
        }

      } catch (error) {
        const screenshotName = pageInfo.path.replace(/\//g, '_') || '_home';
        const screenshotPath = `${screenshotsDir}/error${screenshotName}.png`;

        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

        bugsFound.push({
          severity: 'CRITICAL',
          location: pageInfo.name,
          issue: `Navigation/Load Error: ${error instanceof Error ? error.message : String(error)}`,
          screenshot: screenshotPath,
          consoleErrors,
        });

        testResults.push({
          page: pageInfo.name,
          success: false,
          screenshot: screenshotPath,
          consoleErrors,
          pageErrors: [error instanceof Error ? error.message : String(error)],
          warnings,
        });

        console.log(`    ✗ CRITICAL: Failed to load page`);
      } finally {
        // Remove listeners
        page.off('console', consoleListener);
        page.off('pageerror', pageErrorListener);
      }

      console.log(''); // Empty line for readability
    }

  } catch (error) {
    bugsFound.push({
      severity: 'CRITICAL',
      location: 'Test Execution',
      issue: `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
      screenshot: 'N/A'
    });
    console.log(`\n✗ FATAL ERROR: ${error}\n`);
  } finally {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }

  // Print detailed report
  printDetailedReport(testResults, bugsFound, screenshotsDir);

  return bugsFound.length;
}

function printDetailedReport(results: TestResult[], bugs: Bug[], screenshotsDir: string): void {
  console.log('\n');
  console.log('='.repeat(80));
  console.log('                      VIPRO NON-REGRESSION TEST REPORT');
  console.log('='.repeat(80));
  console.log('');

  // Summary
  const totalPages = results.length;
  const successfulPages = results.filter(r => r.success).length;
  const failedPages = totalPages - successfulPages;
  const successRate = totalPages > 0 ? ((successfulPages / totalPages) * 100).toFixed(1) : '0.0';

  console.log('📊 SUMMARY');
  console.log('-'.repeat(80));
  console.log(`  Total pages tested: ${totalPages}`);
  console.log(`  Successful: ${successfulPages} (${successRate}%)`);
  console.log(`  Failed: ${failedPages}`);
  console.log(`  Total bugs found: ${bugs.length}`);
  console.log(`  Screenshots: ${screenshotsDir}`);
  console.log('');

  // Bug breakdown by severity
  if (bugs.length > 0) {
    const critical = bugs.filter(b => b.severity === 'CRITICAL');
    const high = bugs.filter(b => b.severity === 'HIGH');
    const medium = bugs.filter(b => b.severity === 'MEDIUM');
    const low = bugs.filter(b => b.severity === 'LOW');

    console.log('🐛 BUGS BY SEVERITY');
    console.log('-'.repeat(80));
    console.log(`  🔴 CRITICAL: ${critical.length}`);
    console.log(`  🟠 HIGH:     ${high.length}`);
    console.log(`  🟡 MEDIUM:   ${medium.length}`);
    console.log(`  🔵 LOW:      ${low.length}`);
    console.log('');

    // Detailed bug list
    if (critical.length > 0) {
      console.log('🔴 CRITICAL ISSUES (App-Breaking):');
      console.log('-'.repeat(80));
      critical.forEach((bug, i) => {
        console.log(`  ${i + 1}. [${bug.location}]`);
        console.log(`     Issue: ${bug.issue}`);
        console.log(`     Screenshot: ${bug.screenshot}`);
        if (bug.consoleErrors && bug.consoleErrors.length > 0) {
          console.log(`     Console Errors:`);
          bug.consoleErrors.forEach(err => console.log(`       - ${err}`));
        }
        console.log('');
      });
    }

    if (high.length > 0) {
      console.log('🟠 HIGH PRIORITY ISSUES (Major Functionality):');
      console.log('-'.repeat(80));
      high.forEach((bug, i) => {
        console.log(`  ${i + 1}. [${bug.location}]`);
        console.log(`     Issue: ${bug.issue}`);
        console.log(`     Screenshot: ${bug.screenshot}`);
        if (bug.consoleErrors && bug.consoleErrors.length > 0) {
          console.log(`     Console Errors (first 3):`);
          bug.consoleErrors.slice(0, 3).forEach(err => console.log(`       - ${err.substring(0, 100)}`));
          if (bug.consoleErrors.length > 3) {
            console.log(`       ... and ${bug.consoleErrors.length - 3} more`);
          }
        }
        console.log('');
      });
    }

    if (medium.length > 0) {
      console.log('🟡 MEDIUM PRIORITY ISSUES (Minor Issues):');
      console.log('-'.repeat(80));
      medium.forEach((bug, i) => {
        console.log(`  ${i + 1}. [${bug.location}] ${bug.issue}`);
      });
      console.log('');
    }

    if (low.length > 0) {
      console.log('🔵 LOW PRIORITY ISSUES (Cosmetic):');
      console.log('-'.repeat(80));
      low.forEach((bug, i) => {
        console.log(`  ${i + 1}. [${bug.location}] ${bug.issue}`);
      });
      console.log('');
    }
  } else {
    console.log('✅ NO BUGS DETECTED!');
    console.log('-'.repeat(80));
    console.log('  All pages loaded successfully without console errors or React issues.');
    console.log('');
  }

  // Page-by-page breakdown
  console.log('📄 PAGE-BY-PAGE RESULTS');
  console.log('-'.repeat(80));
  results.forEach(result => {
    const status = result.success ? '✓' : '✗';
    const icon = result.success ? '✅' : '❌';
    console.log(`  ${icon} ${status} ${result.page}`);
    if (!result.success) {
      if (result.pageErrors.length > 0) {
        console.log(`      Page Errors: ${result.pageErrors.length}`);
      }
      if (result.consoleErrors.length > 0) {
        console.log(`      Console Errors: ${result.consoleErrors.length}`);
      }
    }
  });
  console.log('');

  console.log('='.repeat(80));
  console.log(`Test completed at: ${new Date().toLocaleString('fr-FR')}`);
  console.log('='.repeat(80));
  console.log('');
}

// Run the test
testWebApp().then(bugCount => {
  process.exit(bugCount > 0 ? 1 : 0);
}).catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
