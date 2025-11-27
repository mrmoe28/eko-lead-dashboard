# Playwright Testing Setup

## Overview
This directory contains Playwright end-to-end tests for the Eko Lead Dashboard.

## Test Files

### `scraping-progress.spec.ts`
Tests the scraping functionality and progress bars:
- ✅ Start Scraping button functionality
- ✅ Location input validation
- ✅ Progress bars appearance when scraping starts
- ✅ Individual source progress tracking
- ✅ Session status display
- ✅ Console output functionality
- ✅ Settings dropdown with source toggles

## Running Tests

### Prerequisites
1. Ensure the dev server is running: `npm run dev`
2. Playwright browsers are installed: `npx playwright install chromium`

### Test Commands

```bash
# Run all tests headless
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run with browser visible
npm run test:headed

# Run in debug mode
npm run test:debug

# Run specific test file
npx playwright test tests/scraping-progress.spec.ts
```

## Test Scenarios

### 1. Basic UI Elements
- Verifies Start Scraping button is visible
- Validates location input accepts text
- Checks button states (enabled/disabled)

### 2. Scraping Progress Monitoring
- Clicks Start Scraping button
- Waits for progress bars to appear
- Verifies source names are displayed
- Checks progress bar gradients and animations
- Validates percentage displays

### 3. Session Management
- Verifies session card appears after starting
- Checks session information (ID, location, status)
- Validates pending/running state indicators

### 4. Console Output
- Confirms console section is visible
- Validates message formatting
- Checks for live connection indicator

### 5. Settings Configuration
- Opens settings dropdown
- Verifies all scraping sources are listed
- Tests source toggle functionality

## Expected Behavior

### When Scraping Starts
If the job watcher is running:
- Progress bars appear immediately
- Sources show "Processing..." status
- Gradients animate as scraping proceeds
- Complete sources show green checkmarks

If the job watcher is NOT running:
- Session goes to "pending" state
- Warning message appears about job watcher
- Progress bars won't appear until watcher picks up the job

## Troubleshooting

### Tests fail with "Target closed"
- Ensure dev server is running on port 3000
- Check no other process is using port 3000

### Progress bars don't appear
- The scraping job watcher may not be installed
- Run: `./Install-Auto-Watcher.command` (Mac) or `npm run scrape Georgia` manually
- The test will detect pending state and pass accordingly

### Timeout errors
- Increase timeout in playwright.config.ts
- Check network connectivity
- Verify database connection

## Configuration

See `playwright.config.ts` for:
- Test timeout settings
- Reporter configuration
- Browser configurations
- Dev server setup

## Continuous Integration

These tests can be integrated into CI/CD pipelines:
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test
```

## Adding New Tests

1. Create new spec file in `tests/` directory
2. Import test framework: `import { test, expect } from '@playwright/test';`
3. Use descriptive test names
4. Add assertions for expected behavior
5. Document test purpose in comments
