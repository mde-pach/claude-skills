#!/usr/bin/env node

/**
 * User Flow Testing Script
 * Executes complete user flows with assertions, screenshots, and HTML capture
 *
 * Usage: node run-flow.js <flow-file> [options]
 * Example: node run-flow.js .qa-testing/flows/checkout-flow.json --device mobile
 */

const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');
const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = projectRequire('playwright');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseArgs(args) {
  const config = {
    flowFile: null,
    device: 'desktop',
    headless: true,
    slowMo: 0
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      if (arg === '--device' && i + 1 < args.length) {
        config.device = args[i + 1];
        i++;
      } else if (arg === '--headed') {
        config.headless = false;
      } else if (arg === '--slow-mo' && i + 1 < args.length) {
        config.slowMo = parseInt(args[i + 1], 10);
        i++;
      }
    } else {
      config.flowFile = arg;
    }
    i++;
  }

  return config;
}

async function executeAction(page, action, variables) {
  // Replace variables in action
  const resolveValue = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/\$\{([^}]+)\}/g, (_, key) => {
      const keys = key.split('.');
      let result = variables;
      for (const k of keys) {
        result = result?.[k];
      }
      return result ?? value;
    });
  };

  switch (action.type) {
    case 'navigate':
      await page.goto(resolveValue(action.url), { waitUntil: 'domcontentloaded' });
      break;

    case 'click':
      await page.click(resolveValue(action.selector));
      break;

    case 'fill':
      await page.fill(resolveValue(action.selector), resolveValue(action.value));
      break;

    case 'type':
      await page.type(resolveValue(action.selector), resolveValue(action.value), {
        delay: action.delay || 50
      });
      break;

    case 'select':
      await page.selectOption(resolveValue(action.selector), resolveValue(action.value));
      break;

    case 'check':
      await page.check(resolveValue(action.selector));
      break;

    case 'uncheck':
      await page.uncheck(resolveValue(action.selector));
      break;

    case 'press':
      await page.press(resolveValue(action.selector), action.key);
      break;

    case 'hover':
      await page.hover(resolveValue(action.selector));
      break;

    case 'scroll':
      if (action.selector) {
        await page.locator(resolveValue(action.selector)).scrollIntoViewIfNeeded();
      } else {
        await page.evaluate((y) => window.scrollTo(0, y), action.y || 0);
      }
      break;

    case 'wait':
      if (action.condition === 'networkidle') {
        await page.waitForLoadState('networkidle', { timeout: action.timeout || 30000 });
      } else if (action.condition === 'timeout') {
        await page.waitForTimeout(action.timeout || 1000);
      } else if (action.condition === 'selector') {
        await page.waitForSelector(resolveValue(action.selector), { timeout: action.timeout || 30000 });
      }
      break;

    default:
      log(`⚠️  Unknown action type: ${action.type}`, 'yellow');
  }
}

async function loadActions(actionsDir, actionNames, variables) {
  const actions = [];

  for (const name of actionNames) {
    const actionFile = path.join(actionsDir, `${name}.action.json`);
    if (!fs.existsSync(actionFile)) {
      throw new Error(`Action file not found: ${actionFile}`);
    }

    const actionDef = JSON.parse(fs.readFileSync(actionFile, 'utf8'));
    actions.push(...actionDef.actions);
  }

  return actions;
}

async function checkAssertion(page, assertion) {
  try {
    switch (assertion.type) {
      case 'visible':
        await page.waitForSelector(assertion.selector, { state: 'visible', timeout: 5000 });
        return { passed: true };

      case 'hidden':
        await page.waitForSelector(assertion.selector, { state: 'hidden', timeout: 5000 });
        return { passed: true };

      case 'count':
        const count = await page.locator(assertion.selector).count();
        const passed = count === assertion.expected;
        return { passed, actual: count, expected: assertion.expected };

      case 'text':
        const element = await page.locator(assertion.selector).first();
        const text = await element.textContent();
        const textPassed = assertion.expected ? text.includes(assertion.expected) : !!text;
        return { passed: textPassed, actual: text, expected: assertion.expected };

      case 'url':
        const url = page.url();
        const urlPassed = url.includes(assertion.expected);
        return { passed: urlPassed, actual: url, expected: assertion.expected };

      case 'attribute':
        const elem = await page.locator(assertion.selector).first();
        const attrValue = await elem.getAttribute(assertion.attribute);
        const attrPassed = attrValue === assertion.expected;
        return { passed: attrPassed, actual: attrValue, expected: assertion.expected };

      default:
        return { passed: false, error: `Unknown assertion type: ${assertion.type}` };
    }
  } catch (error) {
    return { passed: false, error: error.message };
  }
}

async function runFlow(flowFile, options) {
  // Load flow definition
  if (!fs.existsSync(flowFile)) {
    log(`❌ Flow file not found: ${flowFile}`, 'red');
    process.exit(1);
  }

  const flow = JSON.parse(fs.readFileSync(flowFile, 'utf8'));
  const projectRoot = process.cwd();
  const qaDir = path.join(projectRoot, '.qa-testing');

  // Load config
  const configFile = path.join(qaDir, 'config.json');
  let config = {};
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  }

  // Get viewport config
  const viewportConfig = config.viewports?.[options.device] || { width: 1920, height: 1080 };

  // Setup directories with flow-specific folders
  const flowNameSlug = flow.name.toLowerCase().replace(/\s+/g, '-');
  const screenshotsDir = path.join(qaDir, 'screenshots', options.device, flowNameSlug);
  const htmlDir = path.join(qaDir, 'html', flowNameSlug);
  const reportsDir = path.join(qaDir, 'reports');
  [screenshotsDir, htmlDir, reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  log(`\n🚀 ${flow.name}`, 'blue');
  log(`   ${flow.steps.length} steps | ${options.device} (${viewportConfig.width}x${viewportConfig.height})`, 'gray');
  log('');

  const browser = await chromium.launch({
    headless: options.headless,
    slowMo: options.slowMo
  });

  const context = await browser.newContext({
    viewport: viewportConfig,
    baseURL: flow.baseUrl || config.baseUrl
  });

  const page = await context.newPage();

  // Variables for action resolution
  const variables = {
    baseUrl: flow.baseUrl || config.baseUrl,
    credentials: config.credentials,
    ...config
  };

  const results = {
    flow: flow.name,
    timestamp: new Date().toISOString(),
    device: options.device,
    steps: [],
    passed: 0,
    failed: 0,
    totalSteps: flow.steps.length
  };

  let stepNumber = 1;
  for (const step of flow.steps) {
    const stepPrefix = `[${stepNumber}/${flow.steps.length}]`;
    log(`${stepPrefix} ${step.name}`, 'blue');

    const stepResult = {
      name: step.name,
      url: step.url,
      passed: true,
      assertions: [],
      screenshots: [],
      html: null,
      errors: []
    };

    try {
      // Execute pre-step actions (e.g., login, setup)
      if (step.actions && step.actions.length > 0) {
        const actions = await loadActions(path.join(qaDir, 'actions'), step.actions, variables);
        variables.targetUrl = step.url;
        for (const action of actions) {
          await executeAction(page, action, variables);
        }
      } else {
        // Navigate directly if no actions
        await page.goto(step.url, { waitUntil: 'networkidle' });
      }

      // Capture screenshot
      if (step.capture?.screenshot) {
        const stepNameSlug = step.name.toLowerCase().replace(/\s+/g, '-');
        const screenshotName = `${stepNameSlug}.png`;
        const screenshotPath = path.join(screenshotsDir, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        stepResult.screenshots.push(screenshotName);
        log(`   📸 ${screenshotName}`, 'gray');
      }

      // Capture HTML
      if (step.capture?.html) {
        const stepNameSlug = step.name.toLowerCase().replace(/\s+/g, '-');
        const htmlName = `${stepNameSlug}.html`;
        const htmlPath = path.join(htmlDir, htmlName);
        const html = await page.content();
        fs.writeFileSync(htmlPath, html);
        stepResult.html = htmlName;
        log(`   📄 ${htmlName}`, 'gray');
      }

      // Run assertions
      if (step.assertions && step.assertions.length > 0) {
        for (const assertion of step.assertions) {
          const result = await checkAssertion(page, assertion);
          stepResult.assertions.push({
            type: assertion.type,
            selector: assertion.selector,
            ...result
          });

          if (result.passed) {
            log(`   ✓ ${assertion.type}: ${assertion.selector}`, 'green');
          } else {
            log(`   ✗ ${assertion.type}: ${assertion.selector}`, 'red');
            if (result.error) {
              log(`     ${result.error}`, 'red');
            } else if (result.expected !== undefined) {
              log(`     Expected: ${result.expected}, Got: ${result.actual}`, 'red');
            }
            stepResult.passed = false;
          }
        }
      }

      if (stepResult.passed) {
        log(`   ✓ Passed`, 'green');
        results.passed++;
      } else {
        log(`   ✗ Failed`, 'red');
        results.failed++;
      }

    } catch (error) {
      log(`   ✗ Error: ${error.message}`, 'red');
      stepResult.passed = false;
      stepResult.errors.push(error.message);
      results.failed++;
    }

    results.steps.push(stepResult);
    log('');
    stepNumber++;
  }

  await browser.close();

  // Save report
  const reportName = `flow-${flow.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  const reportPath = path.join(reportsDir, reportName);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Summary
  log('─────────────────────────────────', 'gray');
  const status = results.failed === 0 ? '✓' : '✗';
  const statusColor = results.failed === 0 ? 'green' : 'red';
  log(`${status} ${results.passed}/${results.totalSteps} passed`, statusColor);
  if (results.failed > 0) {
    log(`  Screenshots: .qa-testing/screenshots/${options.device}/${flowNameSlug}/`, 'gray');
  }
  log('─────────────────────────────────', 'gray');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node run-flow.js <flow-file> [options]');
  console.error('');
  console.error('Options:');
  console.error('  --device <name>     Viewport preset (mobile, desktop, or custom)');
  console.error('  --headed            Run in headed mode (visible browser)');
  console.error('  --slow-mo <ms>      Slow down actions by N milliseconds');
  console.error('');
  console.error('Examples:');
  console.error('  node run-flow.js .qa-testing/flows/checkout-flow.json');
  console.error('  node run-flow.js .qa-testing/flows/auth-flow.json --device mobile');
  console.error('  node run-flow.js .qa-testing/flows/signup-flow.json --headed --slow-mo 500');
  process.exit(1);
}

const config = parseArgs(args);
runFlow(config.flowFile, config);
