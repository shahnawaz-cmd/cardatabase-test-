const { test, expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');
const { SmartWait } = require('../utils/SmartWait');

test.describe('Customer Authentication & Enterprise Onboarding', () => {

  test('Attempting login with an unregistered email displays descriptive account not found error', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Authentication - Error Validation');

    await test.step('1. Navigate to Login Page', async () => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
      await expect(page).toHaveTitle(/Login/i);
    });

    await test.step('2. Select Login tab using tab switcher', async () => {
      const loginTab = page.locator('button.flex-1:has-text("Login")');
      await loginTab.waitFor({ state: 'visible', timeout: 10000 });
      await loginTab.click();
      await page.locator('form input[type="email"]').waitFor({ state: 'visible', timeout: 10000 });
    });

    await test.step('3. Submit unregistered email and verify API error', async () => {
      const emailInput = page.locator('form input[type="email"]');
      const testEmail = 'nonexistent.user.test99@example.com';
      await emailInput.fill(testEmail);

      const [resp] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/auth/login-request'), { timeout: 15000 }),
        page.locator('form button[type="submit"], button.w-full:has-text("Log in"), button.w-full:has-text("Login")').click()
      ]);

      expect(resp.status()).toBe(404);
      const json = await resp.json();
      expect(json.code).toBe('USER_NOT_FOUND');

      await logger.passProof('Auth_Login_Request_404', {
        endpoint: '/api/auth/login-request',
        submittedEmail: testEmail,
        httpStatus: resp.status(),
        responseJson: json
      });
    });

    await test.step('4. Verify error message on UI', async () => {
      const errorLocator = page.locator('body');
      await expect(errorLocator).toContainText(/No account found with this email/i, { timeout: 10000 });
      await logger.attachScreenshot(page, 'login_user_not_found_error');
    });
  });

  test('New enterprise customer can complete 3-step signup wizard and receive magic activation link', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Enterprise Onboarding Wizard');

    const uniqueEmail = `qa.buyer.${Date.now()}@example.com`;

    await test.step('1. Step 1: Fill Name and Email on Sign Up tab', async () => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);

      const textInput = page.locator('form input[type="text"]').first();
      const emailInput = page.locator('form input[type="email"]').first();

      await textInput.waitFor({ state: 'visible', timeout: 10000 });
      await textInput.fill('Automation Lead QA');
      await emailInput.fill(uniqueEmail);

      const [checkEmailResp] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/auth/check-email'), { timeout: 15000 }),
        page.locator('form button:has-text("Sign Up")').click()
      ]);
      expect(checkEmailResp.status()).toBe(200);

      await logger.passProof('Step1_Email_Availability_Checked', {
        email: uniqueEmail,
        checkEmailStatus: checkEmailResp.status()
      });
      await logger.attachScreenshot(page, 'wizard_step1_completed');
    });

    await test.step('2. Step 2: Fill Phone Number & Contact Details', async () => {
      const phoneInput = page.locator('form input[type="tel"], form input[placeholder*="phone" i], form input[type="text"]').first();
      await phoneInput.waitFor({ state: 'visible', timeout: 10000 });
      await phoneInput.fill('2025550143');

      await logger.info('Filled Step 2 contact details (Phone: +1 2025550143)');
      await logger.attachScreenshot(page, 'wizard_step2_phone');

      const continueBtn = page.locator('form button:has-text("Continue")');
      await continueBtn.click();
    });

    await test.step('3. Step 3: Select Required Vehicle Databases and Complete Sign Up', async () => {
      await expect(page.locator('body')).toContainText(/Databases Required/i, { timeout: 10000 });
      await logger.attachScreenshot(page, 'wizard_step3_databases');

      const selectAllBtn = page.locator('button:has-text("Select All")').first();
      if (await selectAllBtn.isVisible()) {
        await selectAllBtn.click();
      }

      const [signupResp] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/auth/signup'), { timeout: 15000 }),
        page.locator('form button:has-text("Complete Sign Up"), form button:has-text("Continue")').last().click()
      ]);

      expect(signupResp.status()).toBe(200);
      const json = await signupResp.json();
      expect(json.success).toBe(true);

      await logger.passProof('Step3_Signup_API_Success', {
        endpoint: '/api/auth/signup',
        email: uniqueEmail,
        responseJson: json
      });
    });

    await test.step('4. Verify activation notice on final screen', async () => {
      await expect(page.locator('body')).toContainText(/Check your email for your magic login link/i, { timeout: 10000 });
      await logger.attachScreenshot(page, 'wizard_completed_magic_link_notice');
    });
  });

  test('Visiting gated dashboard without active session redirects securely to login page', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('security', 'Gated Dashboard Access');

    await test.step('1. Navigate directly to /dashboard without session cookie', async () => {
      const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);

      await page.waitForURL('**/login**', { timeout: 10000 });
      expect(page.url()).toContain('/login');

      await logger.passProof('Dashboard_Auth_Gating', {
        attemptedUrl: '/dashboard',
        redirectedUrl: page.url(),
        httpStatus: response ? response.status() : 200,
        loginPageReached: true
      });
      await logger.attachScreenshot(page, 'dashboard_redirect_to_login');
    });
  });

});
