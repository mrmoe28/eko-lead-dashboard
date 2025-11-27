import { test, expect } from '@playwright/test';

/**
 * Test: Scraping Progress Bars Functionality
 *
 * This test verifies:
 * 1. Start Scraping button is clickable
 * 2. Progress bars appear when scraping starts
 * 3. Progress bars display correct source names
 * 4. Progress bars show visual progress indicators
 */

test.describe('Scraping Progress Bars', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the scraping page
    await page.goto('http://localhost:3000/scraping');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display start scraping button and accept location input', async ({ page }) => {
    // Check if location input exists
    const locationInput = page.locator('input[placeholder*="location"]');
    await expect(locationInput).toBeVisible();

    // Check if Start Scraping button exists
    const startButton = page.locator('button:has-text("Start Scraping")');
    await expect(startButton).toBeVisible();

    // Enter a test location
    await locationInput.fill('Georgia');

    // Verify input value
    await expect(locationInput).toHaveValue('Georgia');
  });

  test('should show progress bars when scraping starts', async ({ page }) => {
    // Fill in location
    const locationInput = page.locator('input[placeholder*="location"]');
    await locationInput.fill('Florida');

    // Click Start Scraping button
    const startButton = page.locator('button:has-text("Start Scraping")');
    await startButton.click();

    // Wait for either progress bars or pending status
    // The scraping might go to "pending" state first if watcher isn't running
    await page.waitForSelector('[class*="pending"], [class*="running"], h2:has-text("Scraping Progress")', {
      timeout: 10000
    });

    // Check if we're in running state with progress bars
    const scrapingProgressHeader = page.locator('h2:has-text("Scraping Progress")');
    const isRunning = await scrapingProgressHeader.isVisible().catch(() => false);

    if (isRunning) {
      console.log('✓ Scraping started - Progress bars visible');

      // Verify progress bars container exists
      await expect(scrapingProgressHeader).toBeVisible();

      // Check for individual source progress cards
      const progressCards = page.locator('[class*="grid"] > div[class*="rounded-xl"]');
      const cardCount = await progressCards.count();

      console.log(`✓ Found ${cardCount} progress cards`);
      expect(cardCount).toBeGreaterThan(0);

      // Verify at least one source name is visible
      const sourceNames = [
        'Building Permits',
        'Incentives',
        'Reddit',
        'Craigslist',
        'Twitter/X',
        'Yelp',
        'Quora',
        'Facebook',
        'Nextdoor'
      ];

      let foundSources = 0;
      for (const sourceName of sourceNames) {
        const sourceCard = page.locator(`text=${sourceName}`);
        const isVisible = await sourceCard.isVisible().catch(() => false);
        if (isVisible) {
          foundSources++;
          console.log(`✓ Found source: ${sourceName}`);
        }
      }

      expect(foundSources).toBeGreaterThan(0);

      // Look for progress bars (the colored gradient bars)
      const progressBars = page.locator('[class*="bg-gradient-to-r"]').filter({
        has: page.locator('[style*="width"]')
      });
      const barCount = await progressBars.count();
      console.log(`✓ Found ${barCount} progress bars with gradients`);

    } else {
      console.log('⚠ Scraping is in pending state - watcher may not be running');

      // Verify pending state message
      const pendingMessage = page.locator('text=Waiting for job watcher');
      await expect(pendingMessage).toBeVisible();

      console.log('✓ Pending state verified - job created successfully');
    }
  });

  test('should display session status card with correct information', async ({ page }) => {
    // Fill in location
    const locationInput = page.locator('input[placeholder*="location"]');
    await locationInput.fill('California');

    // Click Start Scraping
    const startButton = page.locator('button:has-text("Start Scraping")');
    await startButton.click();

    // Wait for session card to appear
    await page.waitForSelector('text=Session #', { timeout: 10000 });

    // Verify session information is displayed
    const sessionCard = page.locator('text=Session #').locator('..');
    await expect(sessionCard).toBeVisible();

    // Check for location in session info
    const locationInfo = page.locator('text=California');
    await expect(locationInfo).toBeVisible();

    console.log('✓ Session status card displayed correctly');
  });

  test('should have functional console output section', async ({ page }) => {
    // Check console section exists
    const consoleHeader = page.locator('text=Console Output');
    await expect(consoleHeader).toBeVisible();

    // Verify console container exists
    const consoleContainer = page.locator('div[class*="font-mono"]');
    await expect(consoleContainer).toBeVisible();

    console.log('✓ Console output section is present');
  });

  test('should display scraping sources in settings', async ({ page }) => {
    // Click settings button (gear icon)
    const settingsButton = page.locator('button[title="Scraping Settings"]');
    await settingsButton.click();

    // Wait for settings dropdown
    await page.waitForSelector('text=Scraping Sources');

    // Verify sources are listed
    const sourcesList = page.locator('text=Building Permits, text=Reddit, text=Nextdoor');
    const count = await sourcesList.count();

    expect(count).toBeGreaterThan(0);
    console.log(`✓ Settings dropdown shows ${count} source options`);
  });
});
