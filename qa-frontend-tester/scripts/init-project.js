#!/usr/bin/env node

/**
 * Initialize QA Frontend Testing in a project
 * Creates directory structure, config files, and documentation
 *
 * Usage: node init-project.js [project-path]
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  credentials: {
    email: "admin@acme.com",
    password: "Admin123!"
  },
  baseUrl: "http://localhost:3000",
  viewports: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 375, height: 667 }
  }
};

const README_CONTENT = `# QA Frontend Testing

Automated frontend testing setup for visual regression, user flows, and accessibility testing.

## Directory Structure

- \`actions/\` - Reusable UI interaction sequences (login, modals, filters)
- \`flows/\` - Complete user flow test definitions
- \`screenshots/\` - Captured screenshots organized by viewport (git-ignored)
  - \`desktop/\` - Desktop viewport screenshots (1920x1080)
  - \`mobile/\` - Mobile viewport screenshots (375x667)
- \`baselines/\` - Baseline screenshots for regression testing
- \`html/\` - Captured page HTML for comparison (git-ignored)
- \`reports/\` - Test reports and analysis results (git-ignored)

## Quick Start

### 1. Take a Screenshot
\`\`\`bash
# Desktop (default)
node ~/.claude/skills/qa-frontend-tester/scripts/screenshot.js http://localhost:3000/dashboard

# Mobile
node ~/.claude/skills/qa-frontend-tester/scripts/screenshot.js http://localhost:3000/dashboard 375 667
\`\`\`

### 2. Create an Action
Copy \`actions/login.action.example.json\` to \`actions/login.action.json\` and customize selectors for your app.

### 3. Run a User Flow Test
\`\`\`bash
node ~/.claude/skills/qa-frontend-tester/scripts/run-flow.js flows/your-flow.json --device desktop
\`\`\`

## Configuration

Edit \`config.json\` to set:
- \`credentials\` - Default test user credentials
- \`baseUrl\` - Base URL for your application
- \`viewports\` - Viewport presets (desktop, mobile, or add custom ones)

**Note:** Screenshots are automatically organized by viewport name in \`screenshots/{viewport-name}/\`

## Examples

Example files (\`.example.json\`) are provided as templates:
- \`actions/login.action.example.json\` - Authentication flow example
- \`flows/user-flow.example.json\` - User journey example

**These are NOT functional as-is** - copy them (without \`.example\`) and customize for your application.
`;

const LOGIN_ACTION_EXAMPLE = {
  _comment: "THIS IS AN EXAMPLE ONLY - Update selectors to match your application before using",
  _usage: "Copy to login.action.json (without .example) and customize for your app",
  type: "authentication",
  description: "Example login flow - CUSTOMIZE SELECTORS FOR YOUR APP",
  actions: [
    {
      type: "navigate",
      url: "${baseUrl}/login"
    },
    {
      type: "wait",
      condition: "networkidle"
    },
    {
      type: "fill",
      selector: "input[type='email'], input[name='email']",
      value: "${credentials.email}"
    },
    {
      type: "fill",
      selector: "input[type='password'], input[name='password']",
      value: "${credentials.password}"
    },
    {
      type: "click",
      selector: "button[type='submit']"
    },
    {
      type: "wait",
      condition: "networkidle"
    }
  ]
};


const CHECKOUT_FLOW_EXAMPLE = {
  _comment: "THIS IS AN EXAMPLE ONLY - Update URLs, selectors, and actions to match your application",
  _usage: "Copy to your-flow.json (without .example) and customize for your app",
  name: "Example User Flow",
  description: "EXAMPLE: Multi-step user journey - CUSTOMIZE FOR YOUR APP",
  baseUrl: "http://localhost:3000",
  steps: [
    {
      name: "Login and view dashboard",
      url: "/dashboard",
      actions: ["login"],
      capture: {
        screenshot: true,
        html: true
      },
      assertions: [
        {
          type: "visible",
          selector: "h1:has-text('Dashboard')"
        }
      ]
    },
    {
      name: "Navigate to feature page",
      url: "/feature",
      capture: {
        screenshot: true
      },
      assertions: [
        {
          type: "visible",
          selector: "h1"
        }
      ]
    },
    {
      name: "Submit form",
      url: "/feature",
      actions: ["fill-form"],
      capture: {
        screenshot: true
      },
      assertions: [
        {
          type: "visible",
          selector: "text=Success"
        }
      ]
    }
  ]
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

function writeFileIfNotExists(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

function initProject(projectPath) {
  const qaPath = path.join(projectPath, '.qa-testing');

  console.log('🚀 Initializing QA Frontend Testing...\n');

  // Create directory structure
  const dirs = [
    qaPath,
    path.join(qaPath, 'actions'),
    path.join(qaPath, 'flows'),
    path.join(qaPath, 'screenshots'),
    path.join(qaPath, 'screenshots', 'desktop'),
    path.join(qaPath, 'screenshots', 'mobile'),
    path.join(qaPath, 'baselines'),
    path.join(qaPath, 'html'),
    path.join(qaPath, 'reports')
  ];

  let created = 0;
  dirs.forEach(dir => {
    if (ensureDir(dir)) {
      console.log(`✓ Created ${path.relative(projectPath, dir)}/`);
      created++;
    }
  });

  // Create config file
  const configPath = path.join(qaPath, 'config.json');
  if (writeFileIfNotExists(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2))) {
    console.log(`✓ Created ${path.relative(projectPath, configPath)}`);
    created++;
  }

  // Create README
  const readmePath = path.join(qaPath, 'README.md');
  if (writeFileIfNotExists(readmePath, README_CONTENT)) {
    console.log(`✓ Created ${path.relative(projectPath, readmePath)}`);
    created++;
  }

  // Create example action
  const actionPath = path.join(qaPath, 'actions', 'login.action.example.json');
  if (writeFileIfNotExists(actionPath, JSON.stringify(LOGIN_ACTION_EXAMPLE, null, 2))) {
    console.log(`✓ Created ${path.relative(projectPath, actionPath)}`);
    created++;
  }

  // Create example flow
  const flowPath = path.join(qaPath, 'flows', 'user-flow.example.json');
  if (writeFileIfNotExists(flowPath, JSON.stringify(CHECKOUT_FLOW_EXAMPLE, null, 2))) {
    console.log(`✓ Created ${path.relative(projectPath, flowPath)}`);
    created++;
  }

  // Create .gitignore
  const gitignorePath = path.join(qaPath, '.gitignore');
  const gitignoreContent = `# Ignore generated files
screenshots/
html/
reports/

# Keep example files
!actions/*.example.json
!flows/*.example.json

# Keep baselines (for regression testing)
!baselines/
`;
  if (writeFileIfNotExists(gitignorePath, gitignoreContent)) {
    console.log(`✓ Created ${path.relative(projectPath, gitignorePath)}`);
    created++;
  }

  console.log(`\n✨ Setup complete! ${created} files/directories created.\n`);
  console.log('📖 Next steps:');
  console.log(`   1. Review config: ${path.relative(projectPath, configPath)}`);
  console.log(`   2. Read guide: ${path.relative(projectPath, readmePath)}`);
  console.log('   3. Take your first screenshot:');
  console.log('      node ~/.claude/skills/qa-frontend-tester/scripts/screenshot.js http://localhost:3000\n');
}

// Main
const projectPath = process.argv[2] || process.cwd();

if (!fs.existsSync(projectPath)) {
  console.error(`❌ Project path does not exist: ${projectPath}`);
  process.exit(1);
}

initProject(projectPath);
