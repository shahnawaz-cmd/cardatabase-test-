const { test, expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');
const { SmartWait } = require('../utils/SmartWait');

test.describe('Hybrid Purchase & Post-Checkout Dashboard Flow', () => {

  test('Checkout success page processes verified Stripe session and transitions to dashboard setup', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Post-Purchase Auto-Verification');

    let sessionApiCalled = false;
    await page.route('**/api/auth/session', async route => {
      sessionApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'usr_qa_hybrid_123',
            email: 'qa.buyer@cardatabases.com',
            name: 'QA Enterprise Buyer'
          }
        })
      });
    });

    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'usr_qa_hybrid_123',
            email: 'qa.buyer@cardatabases.com',
            name: 'QA Enterprise Buyer',
            customerId: 'cus_qa_buyer_123'
          }
        })
      });
    });

    await test.step('1. Navigate to /checkout/success with active session_id', async () => {
      await page.goto('/checkout/success?session_id=cs_test_mock_verified_8899', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
    });

    await test.step('2. Verify Transitional Setup Notice and API Call', async () => {
      const setupNotice = page.locator('text=/Success! Setting up your dashboard/i');
      await expect(setupNotice).toBeVisible({ timeout: 10000 });
      expect(sessionApiCalled).toBe(true);

      await logger.passProof('Transitional_Dashboard_Setup_Verified', {
        sessionId: 'cs_test_mock_verified_8899',
        sessionApiInvoked: true,
        transitionNoticeText: await setupNotice.innerText()
      });
      await logger.attachScreenshot(page, 'checkout_success_dashboard_setup');
    });
  });

  test('Customer completing purchase auto-lands directly into dashboard portal', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Seamless Auto-Landing into Dashboard');

    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'set-cookie': 'cardatabases_session=mock_authenticated_token_99; Path=/; HttpOnly; Secure'
        },
        body: JSON.stringify({
          success: true,
          user: {
            id: 'usr_qa_buyer_456',
            email: 'enterprise.buyer@cardatabases.com',
            name: 'Enterprise Fleet Buyer'
          }
        })
      });
    });

    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'usr_qa_buyer_456',
            email: 'enterprise.buyer@cardatabases.com',
            name: 'Enterprise Fleet Buyer',
            customerId: 'cus_fleet_456'
          }
        })
      });
    });

    await test.step('1. Simulate post-checkout success landing with session verification', async () => {
      await page.goto('/checkout/success?session_id=cs_test_autoland_9988', { waitUntil: 'domcontentloaded' });
    });

    await test.step('2. Verify browser auto-redirects from checkout success into /dashboard', async () => {
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      await SmartWait.forAppReady(page);

      expect(page.url()).toContain('/dashboard');

      // Verify dashboard header reflects authenticated navigation
      const dashboardHeader = page.locator('body');
      await expect(dashboardHeader).toContainText(/Dashboard/i, { timeout: 10000 });

      await logger.passProof('Dashboard_Auto_Landing_Verified', {
        initialRoute: '/checkout/success',
        landedUrl: page.url(),
        autoLandingCompleted: true
      });
      await logger.attachScreenshot(page, 'dashboard_auto_landing_screen');
    });
  });

  test('Checkout success page handles unpaid or unverified checkout sessions with clear error notice', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Negative Verification - Unpaid Session');

    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'This checkout is not paid'
        })
      });
    });

    await test.step('1. Visit checkout success with unconfirmed session ID', async () => {
      await page.goto('/checkout/success?session_id=cs_test_unpaid_order_77', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
    });

    await test.step('2. Verify error message and customer guidance', async () => {
      const errorNotice = page.locator('text=/Could not verify purchase. Please contact support/i');
      await expect(errorNotice).toBeVisible({ timeout: 10000 });

      await logger.passProof('Unpaid_Checkout_Session_Handled', {
        sessionId: 'cs_test_unpaid_order_77',
        errorDisplayed: 'Error: Could not verify purchase. Please contact support.',
        handledGracefully: true
      });
      await logger.attachScreenshot(page, 'checkout_success_unpaid_error');
    });
  });

  test('Direct visit to checkout success without session ID displays error message and support button', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Edge Case - Missing Session ID');

    await test.step('1. Navigate directly to /checkout/success without parameters', async () => {
      await page.goto('/checkout/success', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
    });

    await test.step('2. Verify missing session error notice and customer guidance', async () => {
      const noSessionNotice = page.locator('text=/No session ID found/i');
      await expect(noSessionNotice).toBeVisible({ timeout: 10000 });

      const supportBtn = page.locator('button:has-text("Contact Support")');
      await expect(supportBtn).toBeVisible({ timeout: 10000 });

      await logger.passProof('Missing_Session_Id_Handled', {
        url: page.url(),
        errorText: 'Error: No session ID found.',
        supportCtaPresent: true
      });
      await logger.attachScreenshot(page, 'checkout_success_missing_session_id');
    });
  });

});
