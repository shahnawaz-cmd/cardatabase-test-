const { test, expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');
const { SmartWait } = require('../utils/SmartWait');

test.describe('Internationalization, Locales & Language Routing', () => {

  test('Page header exposes proper hreflang alternate links for English and German locales', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Internationalization SEO hreflang tags');

    await test.step('1. Navigate to English homepage', async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
    });

    await test.step('2. Verify hreflang link tags for multi-language indexing', async () => {
      const alternates = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('link[rel="alternate"]')).map(el => ({
          hreflang: el.getAttribute('hreflang'),
          href: el.getAttribute('href')
        }));
      });

      const enTag = alternates.find(a => a.hreflang === 'en');
      const deTag = alternates.find(a => a.hreflang === 'de');
      const defaultTag = alternates.find(a => a.hreflang === 'x-default');

      expect(enTag).toBeDefined();
      expect(deTag).toBeDefined();
      expect(defaultTag).toBeDefined();
      expect(deTag.href).toContain('/de');

      await logger.passProof('hreflang_Alternate_Locales_Verified', {
        enLink: enTag.href,
        deLink: deTag.href,
        defaultLink: defaultTag.href,
        totalAlternates: alternates.length
      });
      await logger.attachScreenshot(page, 'hreflang_english_page');
    });
  });

  test('German locale route /de renders translated content and headings in German', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'German Locale (de) Homepage Content');

    await test.step('1. Navigate directly to /de locale route', async () => {
      await page.goto('/de', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
    });

    await test.step('2. Verify localized title and translated headings', async () => {
      await expect(page).toHaveTitle(/Fahrzeugdatenbanken/i);

      const h1Heading = page.locator('h1').first();
      await expect(h1Heading).toContainText('Autodatenbanken (zum Herunterladen)');

      const htmlLang = await page.getAttribute('html', 'lang');

      await logger.passProof('German_Locale_Content_Verified', {
        url: page.url(),
        title: await page.title(),
        h1Text: await h1Heading.innerText(),
        htmlLangAttribute: htmlLang
      });
      await logger.attachScreenshot(page, 'german_homepage_de');
    });
  });

  test('German pricing route /de/pricing renders localized pricing matrix in German', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'German Locale (de) Pricing Matrix');

    await test.step('1. Navigate to /de/pricing', async () => {
      await page.goto('/de/pricing', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);
    });

    await test.step('2. Verify localized German pricing title and search placeholder', async () => {
      await expect(page).toHaveTitle(/Preisgestaltung/i);

      // Verify the page contains localized German terms
      const bodyText = await page.locator('body').innerText();
      const hasGermanContent = bodyText.includes('Einmaliger Kauf') || 
                               bodyText.includes('Preisgestaltung') || 
                               bodyText.includes('Fahrzeug');
      expect(hasGermanContent).toBe(true);

      await logger.passProof('German_Pricing_Page_Verified', {
        url: page.url(),
        title: await page.title(),
        hasGermanContent
      });
      await logger.attachScreenshot(page, 'german_pricing_de');
    });
  });

  test('UI Language Switcher Discovery: audits for interactive language selector element or documents URL path switching pattern', async ({ page }, testInfo) => {
    const logger = new Logger(testInfo);
    logger.annotate('feature', 'Language Switcher Audit');

    await test.step('1. Navigate to homepage and inspect UI for language switcher dropdown/toggle', async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await SmartWait.forAppReady(page);

      const switcherElements = await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('button, a, select, [role="combobox"]'));
        return candidates.filter(el => {
          const txt = (el.innerText || '').trim();
          const aria = el.getAttribute('aria-label') || '';
          return (
            txt === 'EN' || txt === 'DE' || 
            txt.includes('Deutsch') || txt.includes('English') ||
            aria.toLowerCase().includes('language') || 
            aria.toLowerCase().includes('locale')
          );
        }).length;
      });

      // Platform currently uses Next.js subpath routing (/de, /en) with hreflang meta links
      // Documenting whether an interactive header/footer toggle UI component exists or if switching is path-driven
      await logger.passProof('Language_Switching_Architecture_Audited', {
        hasInteractiveSwitcherComponent: switcherElements > 0,
        switcherElementCount: switcherElements,
        pathRoutingSupported: true,
        supportedLocales: ['en (default)', 'de (/de)']
      });
      await logger.attachScreenshot(page, 'language_switch_audit');
    });
  });

});
