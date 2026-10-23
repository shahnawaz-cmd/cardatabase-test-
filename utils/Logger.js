// @ts-check

/**
 * Structured Logger & Evidence Attacher for Playwright HTML Reporting
 */
class Logger {
  /**
   * @param {import('@playwright/test').TestInfo} testInfo
   */
  constructor(testInfo) {
    this.testInfo = testInfo;
  }

  /**
   * Log info message to STDOUT and attach to report
   * @param {string} message
   * @param {any} [data]
   */
  async info(message, data = null) {
    const timestamp = new Date().toISOString();
    const logLine = `[INFO ${timestamp}] ℹ️ ${message}`;
    console.log(logLine);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log success verification with attached proof
   * @param {string} stepName
   * @param {any} proofData
   */
  async passProof(stepName, proofData) {
    const timestamp = new Date().toISOString();
    console.log(`[PASS ${timestamp}] ✅ PROOF VERIFIED: ${stepName}`);
    if (typeof proofData === 'object' && proofData !== null) {
      console.log(JSON.stringify(proofData, null, 2));
    }

    // Attach to HTML report
    await this.testInfo.attach(`${stepName.replace(/[^a-zA-Z0-9_-]/g, '_')}_proof.json`, {
      body: JSON.stringify({
        timestamp,
        testTitle: this.testInfo.title,
        step: stepName,
        status: 'PASSED',
        evidence: proofData
      }, null, 2),
      contentType: 'application/json'
    });
  }

  /**
   * Capture and attach visual screenshot proof to report
   * @param {import('@playwright/test').Page} page
   * @param {string} label
   */
  async attachScreenshot(page, label) {
    try {
      const buffer = await page.screenshot({ fullPage: false });
      await this.testInfo.attach(`${label.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`, {
        body: buffer,
        contentType: 'image/png'
      });
      console.log(`[EVIDENCE] 📸 Screenshot attached: ${label}`);
    } catch (e) {
      console.warn(`[WARN] Could not capture screenshot: ${e.message}`);
    }
  }

  /**
   * Add traceability annotation to test
   * @param {string} type
   * @param {string} description
   */
  annotate(type, description) {
    this.testInfo.annotations.push({ type, description });
  }
}

module.exports = { Logger };
