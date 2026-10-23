const { test, expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');
const { SmartWait } = require('../utils/SmartWait');

test.describe('Competitor Alternatives & Feature Comparisons', () => {

  test('Carfax alternative page displays comparison tables and pricing navigation link', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Carfax API Alternative');

    await test.step('1. Navigate to Carfax API alternative comparison', async () => {
      await page.goto('/alternatives/carfax-api', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/CARFAX API/i);
    });

    await test.step('2. Verify comparison tables and headers are populated', async () => {
      const tables = page.locator('table');
      const tableCount = await tables.count();
      expect(tableCount).toBeGreaterThanOrEqual(1);

      await expect(page.locator('body')).toContainText(/CARFAX/i, { timeout: 10000 });
      await expect(page.locator('body')).toContainText(/Car Databases/i, { timeout: 10000 });

      await logger.passProof('Carfax_Comparison_Tables_Verified', {
        tablesCount: tableCount,
        competitor: 'CARFAX',
        pageUrl: page.url()
      });
      await logger.attachScreenshot(page, 'carfax_comparison_page');
    });

    await test.step('3. Verify conversion CTA navigates to pricing', async () => {
      const pricingLink = page.locator('main a[href*="/pricing"], footer a[href*="/pricing"]').first();
      await expect(pricingLink).toBeVisible({ timeout: 10000 });
    });
  });

  test('Kelley Blue Book alternative page displays market value sample download CTA', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'KBB API Alternative');

    await test.step('1. Navigate to KBB API alternative comparison', async () => {
      await page.goto('/alternatives/kbb-kelley-blue-book-api', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/KBB API/i);
    });

    await test.step('2. Verify sample download CTA or pricing button', async () => {
      const sampleBtn = page.locator('main a[href*="/pricing"], main a:has-text("sample"), main a:has-text("Pricing")').first();
      await expect(sampleBtn).toBeVisible({ timeout: 10000 });

      await logger.passProof('KBB_Comparison_Verified', {
        ctaText: await sampleBtn.innerText(),
        targetUrl: await sampleBtn.getAttribute('href')
      });
      await logger.attachScreenshot(page, 'kbb_comparison_page');
    });
  });

  test('NHTSA vehicle recall alternative page displays feature comparison matrix', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'NHTSA Recalls Alternative');

    await test.step('1. Navigate to NHTSA alternative comparison', async () => {
      await page.goto('/alternatives/nhtsa-api', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/NHTSA/i);
    });

    await test.step('2. Verify recall comparison data structure is displayed', async () => {
      await expect(page.locator('body')).toContainText(/NHTSA Recall Data/i, { timeout: 10000 });
      await expect(page.locator('body')).toContainText(/Delivery/i, { timeout: 10000 });
      await expect(page.locator('body')).toContainText(/Formats/i, { timeout: 10000 });

      await logger.passProof('NHTSA_Comparison_Verified', {
        dataset: 'Vehicle Recalls',
        sourceComparison: 'NHTSA vs Car Databases'
      });
      await logger.attachScreenshot(page, 'nhtsa_comparison_page');
    });
  });

});
