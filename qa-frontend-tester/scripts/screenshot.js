#!/usr/bin/env node

/**
 * Screenshot capture script using Playwright
 * Usage: node screenshot.js <url> [viewport-width] [viewport-height] [options]
 * Example: node screenshot.js http://localhost:3000/dashboard 1920 1080
 *
 * Auto-generates filename based on URL pathname and stores in viewport-specific directory:
 * - / → .qa-testing/screenshots/desktop/root.png
 * - /login → .qa-testing/screenshots/mobile/login.png
 * - /dashboard → .qa-testing/screenshots/desktop/dashboard.png
 *
 * Action support (generic, user-defined):
 * --action <name>              Run single action before screenshot
 * --actions <name1,name2,...>  Run multiple actions in sequence
 *
 * Examples:
 * node screenshot.js http://localhost:3000/dashboard --action auth
 * node screenshot.js http://localhost:3000/market --actions auth,open-modal
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Resolve playwright from project's node_modules (current working directory)
const { createRequire } = require('module');
const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = projectRequire('playwright');

// Import action recorder from skill directory
let ActionRecorder = null;
try {
  // Try to load from skill directory (when script is in project root)
  const skillPath = path.join(__dirname, '.claude/skills/qa-frontend-tester/action-recorder.js');
  if (fs.existsSync(skillPath)) {
    ({ ActionRecorder } = require(skillPath));
  } else {
    // Try to load from parent directory (when script is in skill scripts/)
    const localPath = path.join(__dirname, '../action-recorder.js');
    if (fs.existsSync(localPath)) {
      ({ ActionRecorder } = require(localPath));
    }
  }
} catch (e) {
  console.warn('⚠️  ActionRecorder not available. Action support disabled.');
}

function parseArgs(args) {
  const config = {
    url: null,
    width: 1920,
    height: 1080,
    actions: [],
    captureHtml: false
  };

  // Extract positional arguments
  const positional = [];
  let i = 0;

  while (i < args.length && !args[i].startsWith('--')) {
    positional.push(args[i]);
    i++;
  }

  config.url = positional[0];
  if (positional[1]) config.width = parseInt(positional[1], 10);
  if (positional[2]) config.height = parseInt(positional[2], 10);

  // Parse flags
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--action' && i + 1 < args.length) {
      config.actions.push(args[i + 1]);
      i++;
    } else if (arg === '--actions' && i + 1 < args.length) {
      // Parse comma-separated actions
      config.actions = args[i + 1].split(',').map(a => a.trim());
      i++;
    } else if (arg === '--html' || arg === '--capture-html') {
      config.captureHtml = true;
    }

    i++;
  }

  return config;
}


async function takeScreenshot() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node screenshot.js <url> [viewport-width] [viewport-height] [options]');
    console.error('');
    console.error('Examples:');
    console.error('  node screenshot.js http://localhost:3000');
    console.error('  node screenshot.js http://localhost:3000/dashboard');
    console.error('  node screenshot.js http://localhost:3000/dashboard --action auth');
    console.error('  node screenshot.js http://localhost:3000/market --actions auth,open-modal');
    process.exit(1);
  }

  // Parse arguments
  const config = parseArgs(args);
  const { url, width, height, actions } = config;

  // Load config to determine viewport name
  const configPath = path.join(process.cwd(), '.qa-testing', 'config.json');
  let viewportName = 'desktop'; // default

  if (fs.existsSync(configPath)) {
    try {
      const qaConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (qaConfig.viewports) {
        // Find matching viewport by dimensions
        for (const [name, viewport] of Object.entries(qaConfig.viewports)) {
          if (viewport.width === width && viewport.height === height) {
            viewportName = name;
            break;
          }
        }
      }
    } catch (e) {
      // Config invalid, use default
    }
  }

  // Create .qa-testing/screenshots/{viewport-name}/ directory if it doesn't exist
  const screenshotsDir = path.join(process.cwd(), '.qa-testing', 'screenshots', viewportName);
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  let browser;
  let finalFilename = null;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Collect console errors and warnings
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    // Collect network errors (404s, failed images, etc.)
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok() && response.status() !== 304) {
        networkErrors.push(`[${response.status()}] ${response.url()}`);
      }
    });

    // Auto-detect and run required actions
    let matchedPath = null;
    let response = null;
    let actionsToRun = [...actions]; // Start with explicitly specified actions

    // If ActionRecorder is available and no actions explicitly specified, try auto-detection
    if (ActionRecorder && actionsToRun.length === 0) {
      const recorder = new ActionRecorder();

      // Try to navigate and detect what's needed
      console.log(`Scanning for required actions...`);
      const requiredActions = await recorder.detectRequiredActions(page, url);

      if (requiredActions.length > 0) {
        console.log(`🔍 Detected ${requiredActions.length} required action(s)`);

        for (const required of requiredActions) {
          if (required.type === 'auth') {
            // Check if login action exists
            if (recorder.actionExists('login')) {
              console.log('✅ Found existing login action, will use it');
              actionsToRun.push('login');
            } else {
              console.log('⚠️  Authentication required but no login.action.json found');
              console.log('');
              console.log('To enable automatic login for protected pages:');
              console.log('  1. Create .qa-testing/actions/login.action.json manually, or');
              console.log('  2. Run: node screenshot.js <url> --action login --record');
              console.log('');
              console.log('Example login action:');
              console.log(JSON.stringify({
                type: "auth",
                description: "Login to the application",
                actions: [
                  { type: "navigate", url: required.loginUrl || `${new URL(url).origin}/login` },
                  { type: "fill", selector: "input[name='email']", value: "${credentials.email}" },
                  { type: "fill", selector: "input[name='password']", value: "${credentials.password}" },
                  { type: "click", selector: "button[type='submit']" },
                  { type: "wait", condition: "networkidle" }
                ]
              }, null, 2));
              console.log('');
              throw new Error('Authentication required. Please create login action first.');
            }
          }
        }
      }
    }

    // Run actions if any (explicit or auto-detected)
    if (actionsToRun.length > 0 && ActionRecorder) {
      console.log(`Running ${actionsToRun.length} action(s): ${actionsToRun.join(', ')}...`);

      const recorder = new ActionRecorder();

      // Load credentials for actions that might need them
      const credentials = recorder.loadCredentials();

      // Load config to get baseUrl
      const configPath = path.join(process.cwd(), '.qa-testing', 'config.json');
      let baseUrl = new URL(url).origin;
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.baseUrl) {
            baseUrl = config.baseUrl;
          }
        } catch (e) {
          // Config invalid, use origin from URL
        }
      }

      // Execute each action in sequence
      for (const actionName of actionsToRun) {
        if (!recorder.actionExists(actionName)) {
          throw new Error(`Action "${actionName}" not found in .qa-testing/actions/`);
        }

        console.log(`▶️  Running action: ${actionName}`);
        await recorder.replayAction(page, actionName, {
          credentials,
          baseUrl,
          targetUrl: url
        });
      }

      console.log('✅ All actions completed');

      // After actions, check if we need to navigate to target URL
      // Skip navigation if we're already on the target URL (e.g., for modals)
      const currentUrl = page.url();
      const currentPath = new URL(currentUrl).pathname;
      const targetPath = new URL(url).pathname;

      if (currentPath !== targetPath) {
        console.log(`Navigating to target URL: ${url}...`);
        response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } else {
        console.log(`Already on target URL: ${url}, skipping navigation to preserve page state`);
        // Don't navigate - just wait a bit for any animations
        await page.waitForTimeout(500);
        response = null; // No response since we didn't navigate
      }

    } else if (actionsToRun.length > 0 && !ActionRecorder) {
      throw new Error('Actions specified but ActionRecorder not available');

    } else {
      // No actions - just navigate directly
      console.log(`Navigating to ${url}...`);
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    }

    // Try to get the matched path from custom header
    if (response) {
      matchedPath = response.headers()['x-matched-path'];
    }

    // Wait for fonts and images to load
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500); // Small delay for any animations

    // Get the actual pathname from the page (after any redirects/navigation)
    const actualUrl = page.url();
    const urlObj = new URL(actualUrl);
    const pathname = urlObj.pathname;

    // Use matched path from header if available, otherwise fall back to pathname
    const routePath = matchedPath || pathname;

    // Generate filename from route path
    finalFilename = generateFilename(routePath);
    const outputPath = path.join(screenshotsDir, finalFilename);

    // Take screenshot
    const resolvedPath = path.resolve(outputPath);
    await page.screenshot({
      path: resolvedPath,
      fullPage: true
    });

    console.log(`\n✅ Screenshot saved to ${resolvedPath}`);
    console.log(`   URL Path: ${pathname}`);
    if (matchedPath && matchedPath !== pathname) {
      console.log(`   Matched Route: ${matchedPath}`);
    }
    console.log(`   Filename: ${finalFilename}`);

    // Capture HTML if requested
    let htmlPath = null;
    if (config.captureHtml) {
      const htmlDir = path.join(process.cwd(), '.qa-testing', 'html');
      if (!fs.existsSync(htmlDir)) {
        fs.mkdirSync(htmlDir, { recursive: true });
      }

      const htmlFilename = finalFilename.replace('.png', '.html');
      htmlPath = path.join(htmlDir, htmlFilename);
      const pageHtml = await page.content();
      fs.writeFileSync(htmlPath, pageHtml);

      console.log(`   HTML: ${htmlPath}`);
    }

    // Report any issues found
    if (networkErrors.length > 0) {
      console.log('\n⚠️  Network Errors Detected:');
      networkErrors.slice(0, 5).forEach(err => console.log(`   ${err}`));
      if (networkErrors.length > 5) {
        console.log(`   ... and ${networkErrors.length - 5} more`);
      }
    }

    if (consoleMessages.length > 0) {
      console.log('\n⚠️  Console Messages:');
      consoleMessages.slice(0, 5).forEach(msg => console.log(`   ${msg}`));
      if (consoleMessages.length > 5) {
        console.log(`   ... and ${consoleMessages.length - 5} more`);
      }
    }

    // Copy file path to clipboard
    try {
      copyPathToClipboard(resolvedPath);
      console.log('\n📋 File path copied to clipboard!');
    } catch (error) {
      // Non-critical if clipboard fails
    }

    console.log('\n📸 Next Steps:');
    console.log('   1. Attach the screenshot to Claude Code chat (Cmd+Shift+A)');
    console.log('   2. Paste the file path, or drag-and-drop the image');
    console.log('   3. Claude will analyze it for visual/UX issues\n');

    // Return metadata
    const viewport = page.viewportSize();
    console.log(JSON.stringify({
      success: true,
      path: resolvedPath,
      filename: finalFilename,
      url: actualUrl,
      pathname: pathname,
      viewport: viewport,
      networkErrors: networkErrors.length,
      consoleMessages: consoleMessages.length,
      htmlPath: htmlPath,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('Error taking screenshot:', error.message);

    // Helpful message if it's likely an auth issue
    if (error.message.includes('Action') && error.message.includes('not found')) {
      console.error('\nTip: Create the action file or specify the correct action name.');
      console.error('     Available actions: .qa-testing/actions/*.action.json');
    }

    console.log(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateFilename(pathname) {
  // Remove leading/trailing slashes
  pathname = pathname.replace(/^\/|\/$/g, '');

  // Root path
  if (pathname === '') {
    return 'root.png';
  }

  // Replace slashes with dashes, handle special characters
  let filename = pathname
    .split('/')
    .map(segment => {
      // Replace non-alphanumeric characters (except dash/underscore) with dash
      return segment.replace(/[^a-zA-Z0-9_-]/g, '-');
    })
    .filter(segment => segment.length > 0)
    .join('-');

  // Remove consecutive dashes
  filename = filename.replace(/-+/g, '-');

  // Remove leading/trailing dashes
  filename = filename.replace(/^-|-$/g, '');

  return filename + '.png';
}

function copyPathToClipboard(filePath) {
  const platform = process.platform;

  try {
    if (platform === 'darwin') {
      // macOS: Use printf to avoid echo issues
      execSync(`printf '%s' "${filePath}" | pbcopy`, {
        stdio: 'pipe'
      });
    } else if (platform === 'linux') {
      // Linux: Use xclip for text
      execSync(`printf '%s' "${filePath}" | xclip -selection clipboard`, {
        stdio: 'pipe'
      });
    } else if (platform === 'win32') {
      // Windows: Use clip
      const tempFile = path.join(require('os').tmpdir(), 'clipboard.txt');
      fs.writeFileSync(tempFile, filePath);
      execSync(`type "${tempFile}" | clip`, {
        stdio: 'pipe',
        shell: 'cmd.exe'
      });
      fs.unlinkSync(tempFile);
    }
  } catch (error) {
    throw error;
  }
}

takeScreenshot();
