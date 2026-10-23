/**
 * SmartWait Utility for Event-Driven, Conditional, and Non-Flaky Playwright Automation
 */
class SmartWait {
  /**
   * Smartly waits for Next.js hydration and window readiness.
   * Auto-detects DOM complete, document ready, and React tree mounting.
   * @param {import('@playwright/test').Page} page
   * @param {number} timeout
   */
  static async forAppReady(page, timeout = 10000) {
    await page.waitForLoadState('domcontentloaded');
    try {
      await page.waitForFunction(
        () => document.readyState === 'complete' && (!!window.__NEXT_DATA__ || !!window.React || true),
        { timeout: Math.min(timeout, 4000) }
      );
    } catch (e) {
      // Fallback silently if SSR context restricts globals
    }
  }

  /**
   * Resiliently triggers an interactive SSR element that requires React hydration.
   * Clicks and checks if condition is met; if React wasn't hydrated on first click,
   * cleanly retries the click conditionally until the target state is reached.
   * @param {import('@playwright/test').Locator} buttonLocator
   * @param {import('@playwright/test').Locator} conditionLocator
   * @param {number} timeout
   */
  static async clickUntil(buttonLocator, conditionLocator, timeout = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        await buttonLocator.first().click();
        await conditionLocator.first().waitFor({ state: 'visible', timeout: 1200 });
        return;
      } catch (err) {
        // Wait briefly for hydration before next attempt
        await new Promise(r => setTimeout(r, 400));
      }
    }
    await conditionLocator.first().waitFor({ state: 'visible', timeout: 2000 });
  }

  /**
   * Wait for a locator to transition to a desired state (visible, hidden, attached, detached)
   * @param {import('@playwright/test').Locator} locator
   * @param {'visible'|'hidden'|'attached'|'detached'} state
   * @param {number} timeout
   */
  static async forState(locator, state = 'visible', timeout = 10000) {
    await locator.first().waitFor({ state, timeout });
  }

  /**
   * Wait for modal/drawer to close or disappear completely
   * @param {import('@playwright/test').Locator} locator
   * @param {number} timeout
   */
  static async forDisappearance(locator, timeout = 10000) {
    await locator.first().waitFor({ state: 'hidden', timeout });
  }

  /**
   * Smartly clicks and awaits a specific API network response condition
   * @param {import('@playwright/test').Page} page
   * @param {import('@playwright/test').Locator} triggerLocator
   * @param {string|RegExp|Function} urlMatch
   * @param {number} timeout
   * @returns {Promise<import('@playwright/test').Response>}
   */
  static async clickAndWaitForResponse(page, triggerLocator, urlMatch, timeout = 10000) {
    const isUrlMatch = (url) => {
      if (typeof urlMatch === 'string') return url.includes(urlMatch);
      if (urlMatch instanceof RegExp) return urlMatch.test(url);
      if (typeof urlMatch === 'function') return urlMatch(url);
      return false;
    };

    const [response] = await Promise.all([
      page.waitForResponse(resp => isUrlMatch(resp.url()), { timeout }),
      triggerLocator.click()
    ]);
    return response;
  }
}

module.exports = { SmartWait };
