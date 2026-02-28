#!/usr/bin/env node

/**
 * Action Recorder - Generic interaction recording system
 *
 * Records ANY sequence of actions to reach a specific page state:
 * - Authentication flows
 * - Modal/dialog opening
 * - Filter application
 * - Form filling
 * - Navigation sequences
 * - Any UI interaction
 *
 * Works like a testing framework (Playwright/Cypress) - records and replays interactions
 */

const fs = require('fs');
const path = require('path');

class ActionRecorder {
  constructor(fixturesDir = '.qa-testing') {
    this.fixturesDir = fixturesDir;
    this.actionsDir = path.join(fixturesDir, 'actions');
    this.pagesDir = path.join(fixturesDir, 'pages');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.fixturesDir, this.actionsDir, this.pagesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Check if an action sequence exists
   */
  actionExists(actionName) {
    const actionPath = path.join(this.actionsDir, `${actionName}.action.json`);
    return fs.existsSync(actionPath);
  }

  /**
   * Load an action sequence
   */
  loadAction(actionName) {
    const actionPath = path.join(this.actionsDir, `${actionName}.action.json`);
    if (!fs.existsSync(actionPath)) {
      return null;
    }
    const content = fs.readFileSync(actionPath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Save an action sequence
   */
  saveAction(action, actionName) {
    const actionPath = path.join(this.actionsDir, `${actionName}.action.json`);
    fs.writeFileSync(actionPath, JSON.stringify(action, null, 2), 'utf8');
    console.log(`💾 Action saved: ${actionPath}`);
    return actionPath;
  }

  /**
   * Check if a page state exists
   */
  pageStateExists(pageName) {
    const pagePath = path.join(this.pagesDir, `${pageName}.page.json`);
    return fs.existsSync(pagePath);
  }

  /**
   * Load a page state
   */
  loadPageState(pageName) {
    const pagePath = path.join(this.pagesDir, `${pageName}.page.json`);
    if (!fs.existsSync(pagePath)) {
      return null;
    }
    const content = fs.readFileSync(pagePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Save a page state
   */
  savePageState(pageState, pageName) {
    const pagePath = path.join(this.pagesDir, `${pageName}.page.json`);
    fs.writeFileSync(pagePath, JSON.stringify(pageState, null, 2), 'utf8');
    console.log(`💾 Page state saved: ${pagePath}`);
    return pagePath;
  }

  /**
   * Detect what's needed to reach a target URL
   * Returns array of required actions
   */
  async detectRequiredActions(page, targetUrl) {
    const requiredActions = [];

    try {
      // Try to navigate directly
      const response = await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      const currentUrl = page.url();

      // Check if we were redirected
      if (!currentUrl.includes(targetUrl)) {
        // Redirected - likely needs auth
        if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
          console.log('🔍 Detected: Authentication required');
          requiredActions.push({
            type: 'auth',
            reason: 'Redirected to login',
            loginUrl: currentUrl
          });
        }
      }

      // Check for 401/403
      if (response && (response.status() === 401 || response.status() === 403)) {
        console.log('🔍 Detected: Authentication required (HTTP status)');
        requiredActions.push({
          type: 'auth',
          reason: `HTTP ${response.status()}`,
          loginUrl: new URL('/login', targetUrl).href
        });
      }

      return requiredActions;

    } catch (error) {
      console.log(`⚠️  Could not access ${targetUrl}: ${error.message}`);
      return requiredActions;
    }
  }

  /**
   * Analyze a page to understand available interactions
   * Returns information about forms, buttons, dialogs, filters, etc.
   */
  async analyzePage(page) {
    console.log('🔍 Analyzing page for available interactions...');

    const analysis = {
      forms: [],
      buttons: [],
      dialogs: [],
      filters: [],
      navigation: [],
      interactions: []
    };

    try {
      // Find all forms
      const forms = await page.locator('form').all();
      for (const form of forms) {
        const inputs = await form.locator('input, textarea, select').all();
        const formData = {
          selector: await this.getBestSelector(form),
          inputs: []
        };

        for (const input of inputs) {
          const inputType = await input.getAttribute('type');
          const inputName = await input.getAttribute('name');
          const inputPlaceholder = await input.getAttribute('placeholder');

          formData.inputs.push({
            type: inputType || 'text',
            name: inputName,
            placeholder: inputPlaceholder,
            selector: await this.getBestSelector(input)
          });
        }

        const submitButton = await form.locator('button[type="submit"]').first();
        if (submitButton) {
          formData.submitButton = await this.getBestSelector(submitButton);
        }

        analysis.forms.push(formData);
      }

      // Find clickable buttons
      const buttons = await page.locator('button:not([type="submit"])').all();
      for (const button of buttons) {
        const text = await button.innerText().catch(() => '');
        const dataTestId = await button.getAttribute('data-testid');

        analysis.buttons.push({
          text: text.trim(),
          selector: await this.getBestSelector(button),
          dataTestId: dataTestId
        });
      }

      // Find dialog triggers (buttons that might open dialogs)
      const dialogTriggers = await page.locator('[data-dialog-trigger], button:has-text("Create"), button:has-text("New"), button:has-text("Add")').all();
      for (const trigger of dialogTriggers) {
        const text = await trigger.innerText().catch(() => '');
        analysis.dialogs.push({
          triggerText: text.trim(),
          triggerSelector: await this.getBestSelector(trigger)
        });
      }

      // Find filter controls
      const filterInputs = await page.locator('[role="search"], input[placeholder*="Search" i], input[placeholder*="Filter" i]').all();
      for (const filter of filterInputs) {
        const placeholder = await filter.getAttribute('placeholder');
        analysis.filters.push({
          type: 'search',
          placeholder: placeholder,
          selector: await this.getBestSelector(filter)
        });
      }

      const selectFilters = await page.locator('select, [role="combobox"]').all();
      for (const select of selectFilters) {
        const name = await select.getAttribute('name');
        analysis.filters.push({
          type: 'select',
          name: name,
          selector: await this.getBestSelector(select)
        });
      }

      console.log(`✅ Found: ${analysis.forms.length} forms, ${analysis.buttons.length} buttons, ${analysis.dialogs.length} dialog triggers, ${analysis.filters.length} filters`);

      return analysis;

    } catch (error) {
      console.error('❌ Page analysis failed:', error.message);
      return analysis;
    }
  }

  /**
   * Get the best selector for an element (priority: data-testid > name > type > class)
   */
  async getBestSelector(element) {
    try {
      // Priority 1: data-testid
      const testId = await element.getAttribute('data-testid');
      if (testId) {
        return { primary: `[data-testid="${testId}"]`, confidence: 100, method: 'testid' };
      }

      // Priority 2: name attribute
      const name = await element.getAttribute('name');
      if (name) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        return { primary: `${tagName}[name="${name}"]`, confidence: 95, method: 'name' };
      }

      // Priority 3: type attribute (for inputs)
      const type = await element.getAttribute('type');
      if (type) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        return { primary: `${tagName}[type="${type}"]`, confidence: 85, method: 'type' };
      }

      // Priority 4: aria-label
      const ariaLabel = await element.getAttribute('aria-label');
      if (ariaLabel) {
        return { primary: `[aria-label="${ariaLabel}"]`, confidence: 90, method: 'aria-label' };
      }

      // Priority 5: role
      const role = await element.getAttribute('role');
      if (role) {
        return { primary: `[role="${role}"]`, confidence: 80, method: 'role' };
      }

      // Priority 6: Text content (for buttons)
      const text = await element.innerText().catch(() => null);
      if (text && text.trim()) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        return { primary: `${tagName}:has-text("${text.trim()}")`, confidence: 75, method: 'text' };
      }

      // Fallback: nth-child selector (fragile)
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      return { primary: tagName, confidence: 50, method: 'tag' };

    } catch (error) {
      return { primary: 'unknown', confidence: 0, method: 'error' };
    }
  }

  /**
   * Record an action sequence (auth, modal open, filter apply, etc.)
   */
  async recordActionSequence(page, actionType, instructions) {
    console.log(`🎬 Recording action: ${actionType}`);

    const actions = [];

    try {
      // Parse instructions and execute actions
      for (const instruction of instructions) {
        const action = await this.executeAndRecordAction(page, instruction);
        if (action) {
          actions.push(action);
        }
      }

      const actionSequence = {
        type: actionType,
        description: `Recorded on ${new Date().toISOString()}`,
        actions: actions,
        metadata: {
          recordedAt: new Date().toISOString(),
          url: page.url()
        }
      };

      return actionSequence;

    } catch (error) {
      console.error('❌ Recording failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute and record a single action
   */
  async executeAndRecordAction(page, instruction) {
    const { type, selector, value, text, waitFor } = instruction;

    switch (type) {
      case 'navigate':
        await page.goto(instruction.url, { waitUntil: 'networkidle' });
        return { type: 'navigate', url: instruction.url };

      case 'click':
        await page.click(selector);
        if (waitFor) await page.waitForTimeout(waitFor);
        return { type: 'click', selector: selector };

      case 'fill':
        await page.fill(selector, value);
        return { type: 'fill', selector: selector, value: value };

      case 'select':
        await page.selectOption(selector, value);
        return { type: 'select', selector: selector, value: value };

      case 'wait':
        if (instruction.condition === 'networkidle') {
          await page.waitForLoadState('networkidle');
        } else if (instruction.selector) {
          await page.waitForSelector(instruction.selector);
        } else {
          await page.waitForTimeout(instruction.timeout || 1000);
        }
        return { type: 'wait', condition: instruction.condition || 'timeout', timeout: instruction.timeout };

      default:
        console.warn(`Unknown action type: ${type}`);
        return null;
    }
  }

  /**
   * Replay an action sequence
   */
  async replayAction(page, actionName, context = {}) {
    const action = this.loadAction(actionName);
    if (!action) {
      throw new Error(`Action not found: ${actionName}`);
    }

    console.log(`▶️  Replaying action: ${actionName}`);

    for (const step of action.actions) {
      try {
        await this.executeStep(page, step, context);
      } catch (error) {
        console.error(`❌ Action step failed: ${step.type}`, error.message);
        throw error;
      }
    }

    console.log(`✅ Action completed: ${actionName}`);
    return true;
  }

  /**
   * Execute a single action step
   */
  async executeStep(page, step, context = {}) {
    switch (step.type) {
      case 'navigate':
        // Replace context variables (e.g., ${targetUrl})
        let url = step.url;
        if (typeof url === 'string') {
          url = url.replace(/\$\{([^}]+)\}/g, (match, path) => {
            return path.split('.').reduce((obj, key) => obj?.[key], context) || match;
          });
        }
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        break;

      case 'click':
        await page.click(step.selector);
        break;

      case 'fill':
        // Replace context variables (e.g., ${credentials.email})
        let value = step.value;
        if (typeof value === 'string') {
          value = value.replace(/\$\{([^}]+)\}/g, (match, path) => {
            return path.split('.').reduce((obj, key) => obj?.[key], context) || match;
          });
        }
        await page.fill(step.selector, value);
        break;

      case 'press':
        await page.press(step.selector, step.key);
        break;

      case 'select':
        await page.selectOption(step.selector, step.value);
        break;

      case 'wait':
        if (step.condition === 'networkidle') {
          await page.waitForLoadState('networkidle');
        } else if (step.condition === 'navigation') {
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
        } else if (step.urlPattern) {
          // Wait for URL to match pattern
          await page.waitForURL(step.urlPattern, { timeout: 30000 });
        } else if (step.selector) {
          await page.waitForSelector(step.selector);
        } else {
          await page.waitForTimeout(step.timeout || 1000);
        }
        break;

      default:
        console.warn(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Load credentials from config or seed file
   */
  loadCredentials() {
    // Try config file first
    const configPath = path.join(this.fixturesDir, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.credentials) {
          console.log('✅ Credentials loaded from config.json');
          return config.credentials;
        }
      } catch (e) {
        // Config invalid
      }
    }

    // Try seed file
    const seedPaths = ['prisma/seed.ts', 'prisma/seed.js'];
    for (const seedPath of seedPaths) {
      if (fs.existsSync(seedPath)) {
        try {
          const seedContent = fs.readFileSync(seedPath, 'utf8');

          // Look for bcrypt.hash('password', ...) pattern first (more reliable)
          const bcryptMatch = seedContent.match(/bcrypt\.hash\(\s*['"]([^'"]+)['"]/);

          // Look for email in user creation context
          const emailMatch = seedContent.match(/(?:where|email):\s*\{\s*email:\s*['"]([^'"]+)['"]\s*\}|email:\s*['"]([^'"@]+@[^'"]+)['"]/);

          const password = bcryptMatch ? bcryptMatch[1] : null;
          const email = emailMatch ? (emailMatch[1] || emailMatch[2]) : null;

          if (email && password) {
            console.log(`✅ Credentials detected from ${seedPath}`);
            return { email, password };
          }
        } catch (e) {
          // Could not parse
        }
      }
    }

    return null;
  }
}

module.exports = { ActionRecorder };
