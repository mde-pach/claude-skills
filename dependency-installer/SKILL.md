---
name: dependency-installer
description: Install and manage project dependencies with automatic latest version checking and conflict detection. Use when installing packages, adding dependencies, updating libraries, or managing project dependencies in JavaScript/TypeScript (npm/pnpm/yarn/bun) or Python (pip/poetry/uv) projects. Triggers include "install", "add package", "update dependencies", "check for updates", or when working with package.json, requirements.txt, or pyproject.toml files.
---

# Dependency Installer

Intelligently install and manage project dependencies with automatic version checking, conflict detection, and breaking change warnings.

## Core Workflow

When installing dependencies:

1. **Detect project type and package manager**
   - JavaScript: Check for bun.lockb → pnpm-lock.yaml → yarn.lock → package-lock.json
   - Python: Check for uv.lock → poetry.lock → pyproject.toml → requirements.txt

2. **Check latest versions before installing**
   - Run version check script for the detected language
   - Review outdated packages and breaking changes
   - Warn about major version bumps that may introduce breaking changes

3. **Install with appropriate package manager**
   - Use detected package manager for installation
   - Apply version constraints when necessary

## JavaScript/TypeScript Projects

### Package Manager Detection

Priority order: bun → pnpm → yarn → npm (based on lockfile presence)

### Installing New Packages

**For production dependencies:**
```bash
# 1. Check current state
python3 scripts/check_js_versions.py

# 2. Install with detected package manager
bun add <package>      # if bun.lockb exists
pnpm add <package>     # if pnpm-lock.yaml exists
yarn add <package>     # if yarn.lock exists
npm install <package>  # default
```

**For dev dependencies:**
```bash
bun add -d <package>
pnpm add -D <package>
yarn add -D <package>
npm install -D <package>
```

### Checking for Updates

Always run version check before updates:
```bash
python3 scripts/check_js_versions.py
```

Output format:
```
📦 Package Manager: bun

Dependencies:
  ✅ react: ^18.2.0 → 18.2.0 (up to date)
  📌 lodash: ^4.17.20 → 4.17.21 (patch update)
  ⚠️  typescript: ^4.9.0 → 5.3.3 (major version change)

⚠️  Breaking Changes Detected:
  - typescript: ^4.9.0 → 5.3.3 (major version change)
```

Status indicators:
- ✅ Up to date
- 📌 Minor/patch update available
- ⚠️  Major version change (potential breaking changes)

### Handling Breaking Changes

When major version changes detected:

1. Review changelog for the package
2. Check if update is necessary or can be deferred
3. Test thoroughly after updating
4. Consider updating one major package at a time

Example:
```bash
# If typescript shows breaking change, research first:
bun add typescript@latest  # Proceed with caution
# Then test the build
bun run build
```

## Python Projects

### Package Manager Detection

Priority order: uv → poetry → pip (based on lockfile/config presence)

### Installing New Packages

**For uv projects:**
```bash
# 1. Check current versions
python3 scripts/check_python_versions.py

# 2. Install
uv add <package>
```

**For poetry projects:**
```bash
# 1. Check current versions
python3 scripts/check_python_versions.py

# 2. Install
poetry add <package>
```

**For pip projects:**
```bash
# 1. Check current versions
python3 scripts/check_python_versions.py

# 2. Install and update requirements.txt
pip install <package>
pip freeze | grep <package> >> requirements.txt
```

### Checking for Updates

```bash
python3 scripts/check_python_versions.py
```

Output format:
```
🐍 Package Manager: uv

Dependencies:
  ✅ requests: 2.31.0 → 2.31.0 (up to date)
  📌 pydantic: 2.5.0 → 2.5.3 (patch update)
  ⚠️  django: 4.2.0 → 5.0.1 (major version change)

⚠️  Breaking Changes Detected:
  - django: 4.2.0 → 5.0.1 (major version change)
```

### Dev Dependencies

**uv:**
```bash
uv add --dev <package>
```

**poetry:**
```bash
poetry add --group dev <package>
```

**pip:**
```bash
pip install <package>
# Add to requirements-dev.txt or similar
```

## Conflict Resolution

When conflicts arise:

1. **Peer dependency conflicts** (JavaScript)
   - Check package documentation for peer dependency requirements
   - Use `--legacy-peer-deps` flag if necessary (npm)
   - Consider using exact versions to resolve conflicts

2. **Version range conflicts** (Python)
   - Review pyproject.toml or requirements.txt for conflicting version constraints
   - Use dependency resolution tools: `poetry lock`, `uv lock`
   - Consider using compatible release specifiers: `~=` instead of `==`

3. **Breaking changes**
   - Always check changelogs for major version bumps
   - Test critical functionality after updates
   - Consider staged rollouts for large updates

## Best Practices

1. **Always check versions first** - Run version check scripts before installing
2. **Review breaking changes** - Don't blindly update packages with major version changes
3. **Use lockfiles** - Commit lockfiles to ensure consistent installs across environments
4. **Prefer specific package managers** - In bun projects, use bun; in uv projects, use uv
5. **Group related updates** - Update related packages together (e.g., React + React-DOM)
6. **Test after updates** - Run tests after dependency updates, especially major versions

## Quick Reference

### Version Check Scripts

Both scripts support `--json` flag for programmatic output.

**JavaScript:**
```bash
python3 scripts/check_js_versions.py [package.json] [--json]
```

**Python:**
```bash
python3 scripts/check_python_versions.py [--json]
```

### Common Scenarios

**Scenario: User asks "install react"**
1. Run `python3 scripts/check_js_versions.py`
2. Show latest React version
3. Run `bun add react` (or detected package manager)

**Scenario: User asks "update all dependencies"**
1. Run version check script
2. Show all outdated packages
3. Warn about breaking changes
4. Ask user to confirm major updates
5. Update packages incrementally

**Scenario: User asks "add axios"**
1. Check if package.json exists (JavaScript) or requirements.txt/pyproject.toml (Python)
2. Run appropriate version check
3. Install with detected package manager
