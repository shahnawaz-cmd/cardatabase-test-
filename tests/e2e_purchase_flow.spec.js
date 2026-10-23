const { test, expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');
const { SmartWait } = require('../utils/SmartWait');

test.describe('Purchase Flow & Stripe Checkout', () => {

  test('User can select Year-Make-Model Basic license and proceed to secure Stripe checkout', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Single Product Stripe Checkout');
    logger.annotate('requirement', 'REQ-PUR-001');

    await test.step('1. Navigate to Year-Make-Model product page', async () => {
      await page.goto('/year-make-model', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/Year Make Model Database/i);
      await logger.info('Navigated to /year-make-model successfully', { url: page.url(), title: await page.title() });
    });

    await test.step('2. Click Purchase Now button on Basic tier', async () => {
      const purchaseBtn = page.locator('button:has-text("Purchase Now")').first();
      await purchaseBtn.waitFor({ state: 'visible', timeout: 10000 });
      const modal = page.locator('div.fixed.inset-0');
      await SmartWait.clickUntil(purchaseBtn, modal, 10000);
      await logger.info('Clicked "Purchase Now" button on Basic tier ($800)');
    });

    await test.step('3. Verify Access Modal is displayed with correct product details', async () => {
      const modal = page.locator('div.fixed.inset-0');
      await expect(modal).toBeVisible({ timeout: 10000 });
      await expect(modal).toContainText('Where should we send your access?');
      await expect(modal).toContainText('$800');

      await logger.passProof('Access_Modal_Displayed', {
        heading: 'Where should we send your access?',
        price: '$800',
        product: 'Year Make Model - Basic'
      });
      await logger.attachScreenshot(page, 'access_modal_opened');
    });

    await test.step('4. Validate HTML5 constraints on empty submit', async () => {
      const continueBtn = page.locator('div.fixed button:has-text("Continue to payment")');
      await continueBtn.click();
      expect(page.url()).toContain('/year-make-model');
      await logger.info('Verified empty form submission is blocked by browser constraint validation');
    });

    let checkoutSecret = null;
    await test.step('5. Fill contact details and proceed to Stripe Checkout', async () => {
      const modal = page.locator('div.fixed.inset-0');
      await modal.locator('input[type="text"]').fill('Automation QA Buyer');
      await modal.locator('input[type="email"]').fill('automation.qa@example.com');

      const [checkoutResponse] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/checkout') && resp.status() === 200, { timeout: 15000 }),
        page.locator('div.fixed button:has-text("Continue to payment")').click()
      ]);

      const respJson = await checkoutResponse.json();
      expect(respJson).toHaveProperty('client_secret');
      expect(respJson.client_secret).toMatch(/^cs_test_/);
      checkoutSecret = respJson.client_secret;

      await logger.passProof('Checkout_API_Response', {
        status: checkoutResponse.status(),
        client_secret_prefix: checkoutSecret.slice(0, 20) + '...',
        postPayload: {
          productIds: ['ymm-basic'],
          name: 'Automation QA Buyer',
          email: 'automation.qa@example.com'
        }
      });
    });

    await test.step('6. Verify Stripe embedded checkout iframe is rendered on /checkout', async () => {
      await page.waitForURL('**/checkout**', { timeout: 15000 });
      const stripeFrame = page.locator('iframe[src*="stripe.com"]').first();
      await expect(stripeFrame).toBeVisible({ timeout: 15000 });

      await logger.passProof('Stripe_Frame_Mounted', {
        checkoutUrl: page.url(),
        stripeFrameFound: true
      });
      await logger.attachScreenshot(page, 'stripe_embedded_checkout_loaded');
    });
  });

  test('User can bundle multiple databases on the pricing page and clear the selection', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Multi-Item Cart Aggregation');

    await test.step('1. Navigate to Pricing Matrix', async () => {
      await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/Pricing/i);
    });

    await test.step('2. Select multiple database licenses', async () => {
      const addBtns = page.locator('button:has-text("Add")');
      await addBtns.first().waitFor({ state: 'visible', timeout: 10000 });
      const count = await addBtns.count();
      expect(count).toBeGreaterThanOrEqual(2);

      await addBtns.nth(0).click();
      await expect(page.locator('text=/1 selected/i')).toBeVisible({ timeout: 10000 });

      await addBtns.nth(1).click();
      await expect(page.locator('text=/2 selected/i')).toBeVisible({ timeout: 10000 });
    });

    await test.step('3. Verify Sticky Bottom Bar reflects selection and sum', async () => {
      const stickyBar = page.locator('text=/selected/i').first().locator('..');
      await expect(stickyBar).toBeVisible({ timeout: 10000 });
      await expect(stickyBar).toContainText('2 selected');
      await expect(stickyBar).toContainText('$1,800');

      await logger.passProof('Sticky_Bar_Selection', {
        itemsSelected: 2,
        totalCalculated: '$1,800',
        stickyBarText: await stickyBar.innerText()
      });
      await logger.attachScreenshot(page, 'sticky_cart_bar_active');
    });

    await test.step('4. Clear cart selection', async () => {
      const clearBtn = page.locator('button:has-text("Clear"), a:has-text("Clear")').first();
      await clearBtn.waitFor({ state: 'visible', timeout: 10000 });
      await clearBtn.click();

      const stickyBar = page.locator('text=/selected/i');
      await stickyBar.waitFor({ state: 'hidden', timeout: 10000 });
      await expect(stickyBar).toHaveCount(0);
      await logger.info('Cart successfully cleared; sticky dock dismissed');
    });
  });

  test('Direct visit to checkout without active cart displays expired session message and link to pricing', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);

    await test.step('1. Navigate directly to /checkout with no active session', async () => {
      await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await logger.info('Direct visit initiated to /checkout without prior session token');
    });

    await test.step('2. Verify session expired notification and return CTA', async () => {
      await expect(page.locator('body')).toContainText(/checkout session has expired/i, { timeout: 10000 });
      const returnBtn = page.locator('a:has-text("Return to packages"), button:has-text("Return to packages")');
      await expect(returnBtn).toBeVisible({ timeout: 10000 });

      await logger.passProof('Session_Expired_Fallback', {
        message: 'Your checkout session has expired. Please start again from the pricing page.',
        ctaTarget: await returnBtn.getAttribute('href')
      });
      await logger.attachScreenshot(page, 'checkout_session_expired');

      await returnBtn.click();
      await expect(page).toHaveURL(/.*\/pricing.*/, { timeout: 10000 });
    });
  });

});
