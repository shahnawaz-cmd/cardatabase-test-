const { test, expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');
const { SmartWait } = require('../utils/SmartWait');

test.describe('Catalog Search & Query Filtering', () => {

  test('Typing a keyword in the catalog search bar filters database cards instantly in real time', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Catalog Instant Search');

    await test.step('1. Navigate to Pricing Matrix', async () => {
      await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/Pricing/i);
    });

    await test.step('2. Type "Motorcycle" into search filter box', async () => {
      const searchInput = page.locator('input[placeholder*="Search databases" i]');
      await searchInput.waitFor({ state: 'visible', timeout: 10000 });
      await searchInput.fill('Motorcycle');

      // Smart wait for card count to filter
      const cards = page.locator('li:has(h4)');
      await expect(cards).toHaveCount(1, { timeout: 10000 });
      await expect(cards.first()).toContainText('Motorcycle Data');

      await logger.passProof('Search_Filter_Single_Match', {
        searchQuery: 'Motorcycle',
        matchedCardsCount: 1,
        matchedTitle: 'Motorcycle Data'
      });
      await logger.attachScreenshot(page, 'search_motorcycle_filtered');
    });
  });

  test('Typing a non-existent search query displays zero matching results with an empty state notice', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Search Empty State');

    await test.step('1. Navigate to Pricing Matrix', async () => {
      await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
    });

    await test.step('2. Enter random non-existent database string', async () => {
      const searchInput = page.locator('input[placeholder*="Search databases" i]');
      await searchInput.waitFor({ state: 'visible', timeout: 10000 });
      await searchInput.click();
      await searchInput.fill('xyznonexistentquery999');

      const emptyNotice = page.locator('text=No databases match your search.');
      await expect(emptyNotice).toBeVisible({ timeout: 10000 });

      const cards = page.locator('li:has(h4)');
      await expect(cards).toHaveCount(0);

      await logger.passProof('Search_Empty_State_Verified', {
        searchQuery: 'xyznonexistentquery999',
        activeCardsCount: 0,
        emptyStateMessage: await emptyNotice.innerText()
      });
      await logger.attachScreenshot(page, 'search_empty_state');
    });
  });

  test('Clearing the search input field immediately restores all available vehicle databases in the catalog', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Search Input Reset');

    await test.step('1. Navigate and get initial catalog count', async () => {
      await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);

      const cards = page.locator('li:has(h4)');
      await expect(cards).not.toHaveCount(0, { timeout: 10000 });
      const initialCount = await cards.count();

      const searchInput = page.locator('input[placeholder*="Search databases" i]');
      await searchInput.waitFor({ state: 'visible', timeout: 10000 });
      await searchInput.click();
      await searchInput.fill('Motorcycle');

      await expect(cards).toHaveCount(1, { timeout: 10000 });
      await expect(cards.first()).toContainText('Motorcycle Data');

      // Clear the search input
      await searchInput.fill('');
      await expect(cards).toHaveCount(initialCount, { timeout: 10000 });

      await logger.passProof('Search_Reset_Restores_Catalog', {
        initialAndRestoredCount: initialCount,
        queryTested: 'Motorcycle'
      });
      await logger.attachScreenshot(page, 'search_cleared_catalog_restored');
    });
  });

  test('Combining a category filter with a search keyword performs full-text matching on database cards', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Compound Filter: Category + Search');

    await test.step('1. Navigate to Pricing Matrix', async () => {
      await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
    });

    await test.step('2. Filter by "Vehicle specs" category tab', async () => {
      const specsTab = page.locator('button:has-text("Vehicle specs")');
      await specsTab.waitFor({ state: 'visible', timeout: 10000 });
      const cards = page.locator('li:has(h4)');
      await SmartWait.clickUntil(specsTab, cards.first(), 10000);
      const categoryCount = await cards.count();
      expect(categoryCount).toBeGreaterThan(0);
    });

    await test.step('3. Apply search query "Basic" within Vehicle specs', async () => {
      const searchInput = page.locator('input[placeholder*="Search databases" i]');
      await searchInput.fill('Basic');

      const cards = page.locator('li:has(h4)');
      await expect(cards.first()).toContainText('Year Make Model - Basic', { timeout: 10000 });
      const matchedCount = await cards.count();
      expect(matchedCount).toBeGreaterThanOrEqual(1);

      await logger.passProof('Compound_Category_Search_Filter', {
        categoryTab: 'Vehicle specs',
        searchQuery: 'Basic',
        fullTextMatchedCount: matchedCount,
        firstMatch: 'Year Make Model - Basic'
      });
      await logger.attachScreenshot(page, 'compound_filter_result');
    });
  });

});
