# Pre-Flight Checks

## Why Pre-Flight Checks Matter

A test can exit 0 (pass) while the screenshot shows a Next.js error page.
Real example: `tsty run issue-1-comparison-layout --fail-fast` passed, but the screenshot showed "ENOENT: no such file or directory". The server was running but had build errors.
Result: 60+ minutes wasted chasing wrong issues. Always verify the app is healthy first.

## Quick Health Check (~6 seconds)

Run these three commands before any test session:

```bash
# 1. Port listening? (1s)
lsof -i :4000 | grep LISTEN || echo "NOT RUNNING"

# 2. HTTP 200? (2s)
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000

# 3. Build errors? (3s)
curl -s http://localhost:4000 | grep -q "Runtime Error\|Failed to compile\|ENOENT" && echo "BUILD ERRORS" || echo "OK"
```

If server is not running:
```bash
tsty > /tmp/tsty-dashboard.log 2>&1 &
sleep 5
```

If build errors found: read the curl output, fix the error, then re-check.

## Full Health Check Flow

Use when quick check passes but you want visual confirmation (first time in session, after major changes, after server restart).

### 1. Create the health check flow

```json
// .tsty/flows/_health-check.json
{
  "name": "Health Check",
  "baseUrl": "http://localhost:4000",
  "failFast": true,
  "monitorConsole": false,
  "playwright": { "headless": true, "timeout": 10000 },
  "steps": [{
    "name": "Homepage loads",
    "url": "/",
    "capture": { "screenshot": true },
    "primitives": [
      { "type": "waitForLoadState", "options": { "state": "networkidle" } }
    ]
  }]
}
```

### 2. Run and verify screenshot

```bash
tsty run _health-check --fail-fast --no-monitor
```

Then read the latest screenshot:
```bash
ls -1t .tsty/screenshots/run-_health-check-*/1-*.png | head -1
```

Use the Read tool on that screenshot. If it shows the working app, proceed. If it shows an error page, stop and fix.

## Error Page Detection

When reading screenshots, watch for these markers:

| Pattern | Indicator |
|---------|-----------|
| Red banner with "Runtime Error" or "Failed to compile" | Next.js error overlay |
| Call stack traces, file paths in error | Build/runtime crash |
| "404", "Page not found", "could not be found" | Missing route |
| "ENOENT", "Module not found", "Cannot find module" | Build error |
| Completely white/blank page, no content | App failed to render |

Any of these means a server/build issue, not a test failure. Fix the app first.

## When to Skip

You can skip pre-flight checks when:
- **Already verified this session** - quick check passed earlier, no code changes since
- **Just ran a test successfully** - if the last test screenshot showed a working app
- **Static site** - no server needed, testing local files

Default: always run at least the quick health check.
