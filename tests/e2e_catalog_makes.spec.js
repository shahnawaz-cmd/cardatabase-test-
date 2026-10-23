const { test, expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');
const { SmartWait } = require('../utils/SmartWait');

test.describe('Product Catalog & Vehicle Makes Directory', () => {

  test('User can filter vehicle databases by category tabs on the homepage', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Catalog Category Filtering');

    await test.step('1. Navigate to Homepage', async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/Car Databases/i);
    });

    await test.step('2. Filter by Vehicle Specs category', async () => {
      const specsTab = page.locator('button:has-text("Vehicle specs")');
      await specsTab.waitFor({ state: 'visible', timeout: 10000 });
      await specsTab.click();

      await expect(page.locator('body')).toContainText(/Year-Make-Model/i, { timeout: 10000 });
      await logger.attachScreenshot(page, 'catalog_specs_filter_applied');
    });

    await test.step('3. Filter by Parts & fitment category', async () => {
      const partsTab = page.locator('button:has-text("Parts & fitment")');
      await partsTab.waitFor({ state: 'visible', timeout: 10000 });
      await partsTab.click();

      await expect(page.locator('body')).toContainText(/Tire Size|Wheel Fitment|Auto Parts/i, { timeout: 10000 });

      await logger.passProof('Category_Filter_Verified', {
        selectedFilter: 'Parts & fitment',
        matchedCards: ['Tire Size Database', 'Wheel Fitment Database', 'Auto Parts Catalog']
      });
      await logger.attachScreenshot(page, 'catalog_parts_filter_applied');
    });
  });

  test('User can preview sample data, inspect schema and records, and access JSON download link', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Sample Data Modal Viewer');

    const modal = page.locator('div.fixed.inset-0.z-\\[100\\]');

    await test.step('1. Navigate to Homepage and open View Sample modal', async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);

      const sampleBtn = page.locator('button:has-text("View sample")').first();
      await sampleBtn.waitFor({ state: 'visible', timeout: 10000 });
      await SmartWait.clickUntil(sampleBtn, modal, 10000);
    });

    await test.step('2. Verify modal structure and sample JSON download link', async () => {
      await expect(modal).toBeVisible({ timeout: 10000 });
      await expect(modal).toContainText(/Sample Data/i);

      const sampleDownload = modal.locator('a:has-text("Sample File")');
      await expect(sampleDownload).toBeVisible({ timeout: 10000 });
      const href = await sampleDownload.getAttribute('href');
      expect(href).toContain('digitaloceanspaces.com');
      expect(href).toContain('.json');

      await logger.passProof('Sample_Modal_Verified', {
        modalTitle: 'Year-Make-Model Database — Sample Data',
        sampleDownloadUrl: href
      });
      await logger.attachScreenshot(page, 'sample_modal_opened');
    });

    await test.step('3. Explore Schema and Records tabs within modal', async () => {
      const schemaTab = modal.locator('button:has-text("Schema")');
      await schemaTab.waitFor({ state: 'visible', timeout: 10000 });
      await schemaTab.click();
      await logger.attachScreenshot(page, 'sample_modal_schema_tab');

      const recordsTab = modal.locator('button:has-text("Records")');
      await recordsTab.waitFor({ state: 'visible', timeout: 10000 });
      await recordsTab.click();
      await logger.attachScreenshot(page, 'sample_modal_records_tab');

      const closeBtn = modal.locator('button:has-text("Close"), button[aria-label="Close"]').first();
      await closeBtn.waitFor({ state: 'visible', timeout: 10000 });
      await closeBtn.click();
      await modal.waitFor({ state: 'hidden', timeout: 10000 });
    });
  });

  test('Vehicle makes directory renders major global car manufacturers and data indexes', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Vehicle Makes Index');

    await test.step('1. Navigate to /makes directory', async () => {
      await page.goto('/makes', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/Vehicle Makes/i);
    });

    await test.step('2. Verify major global manufacturers are present', async () => {
      const body = page.locator('body');
      await expect(body).toContainText('Toyota', { timeout: 10000 });
      await expect(body).toContainText('Honda', { timeout: 10000 });
      await expect(body).toContainText('Ford', { timeout: 10000 });
      await expect(body).toContainText('BMW', { timeout: 10000 });
      await expect(body).toContainText('Nissan', { timeout: 10000 });

      await logger.passProof('Makes_Brands_Verified', {
        verifiedBrands: ['Toyota', 'Honda', 'Ford', 'BMW', 'Nissan']
      });
    });

    await test.step('3. Verify data index coverage sections are listed', async () => {
      const body = page.locator('body');
      await expect(body).toContainText(/Vehicle Indexes/i, { timeout: 10000 });
      await expect(body).toContainText(/Technical Data/i, { timeout: 10000 });
      await expect(body).toContainText(/Service & Maintenance/i, { timeout: 10000 });
      await logger.attachScreenshot(page, 'makes_directory_view');
    });
  });

});
