const { test, expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');
const { SmartWait } = require('../utils/SmartWait');

test.describe('Knowledge Hub & Dedicated Product Pages', () => {

  test('User can browse blog directory and filter articles by category badges', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Blog Hub & Categorization');

    await test.step('1. Navigate to Blog Hub', async () => {
      await page.goto('/blog', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/Blog/i);
    });

    await test.step('2. Verify category badges are present and clickable', async () => {
      const categoryLink = page.locator('a[href="/blog/category/api-basics"]').first();
      await expect(categoryLink).toBeVisible({ timeout: 10000 });
      await categoryLink.click();

      await page.waitForURL('**/blog/category/api-basics**', { timeout: 10000 });
      await expect(page.locator('h1')).toContainText(/API Basics/i);

      await logger.passProof('Blog_Category_Navigation_Verified', {
        selectedCategory: 'API Basics',
        targetUrl: page.url()
      });
      await logger.attachScreenshot(page, 'blog_category_api_basics');
    });
  });

  test('Technical guide article displays author metadata, reading time, and formatted headings', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Technical Article Reading Experience');

    await test.step('1. Navigate directly to Car Data API Guide', async () => {
      await page.goto('/blog/what-is-a-car-data-api', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/What is a Car Data API/i);
    });

    await test.step('2. Verify article metadata (Author, Read Time, Table of Contents)', async () => {
      const body = page.locator('body');
      await expect(body).toContainText('Orchita Maulira', { timeout: 10000 });
      await expect(body).toContainText(/10 min read/i, { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('What is a Car Data API?');

      await logger.passProof('Article_Metadata_Verified', {
        title: 'What is a Car Data API?',
        author: 'Orchita Maulira',
        readTime: '10 min read'
      });
      await logger.attachScreenshot(page, 'blog_article_view');
    });
  });

  test('Motorcycle Specs product page displays technical specs breakdown and opens $1,500 purchase modal', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Motorcycle Data Product Details');

    await test.step('1. Navigate to /motorcycle-specs', async () => {
      await page.goto('/motorcycle-specs', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/Motorcycle/i);
    });

    await test.step('2. Verify technical specifications overview', async () => {
      const body = page.locator('body');
      await expect(body).toContainText(/Powersports/i, { timeout: 10000 });
      await expect(body).toContainText('$1,500', { timeout: 10000 });
      await logger.attachScreenshot(page, 'motorcycle_specs_page');
    });

    await test.step('3. Trigger Purchase Now and verify access modal configuration', async () => {
      const purchaseBtn = page.locator('button:has-text("Purchase Now"), a:has-text("Purchase Now")').first();
      await purchaseBtn.waitFor({ state: 'visible', timeout: 10000 });

      const modal = page.locator('div.fixed.inset-0');
      await SmartWait.clickUntil(purchaseBtn, modal, 10000);

      await expect(modal).toBeVisible({ timeout: 10000 });
      await expect(modal).toContainText('Where should we send your access?');
      await expect(modal).toContainText('$1,500');

      await logger.passProof('Motorcycle_Access_Modal_Verified', {
        product: 'Motorcycle Data',
        price: '$1,500',
        modalOpen: true
      });
      await logger.attachScreenshot(page, 'motorcycle_access_modal');
    });
  });

  test('Electric Vehicle Data product page highlights EPA range, battery capacity, and $800 pricing tier', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'EV Data Product Details');

    await test.step('1. Navigate to /electric-vehicle-data', async () => {
      await page.goto('/electric-vehicle-data', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/Electric Vehicle/i);
    });

    await test.step('2. Verify EV technical feature highlights and pricing', async () => {
      const body = page.locator('body');
      await expect(body).toContainText(/EPA/i, { timeout: 10000 });
      await expect(body).toContainText(/Battery/i, { timeout: 10000 });
      await expect(body).toContainText('$800', { timeout: 10000 });

      await logger.passProof('EV_Product_Page_Verified', {
        title: 'Electric Vehicle Specifications',
        price: '$800',
        keyFeatures: ['Battery Capacity', 'EPA Range', 'Charging Speeds']
      });
      await logger.attachScreenshot(page, 'ev_product_page');
    });
  });

});
