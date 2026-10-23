# CarDatabases E2E & Functional Automation Framework

Automated end-to-end regression and functional testing suite for [dev.cardatabases.com](https://dev.cardatabases.com).

## 🚀 Key Features

- **100% Human-Readable Business Test Specifications** across 11 test suites (48 test cases).
- **Smart Waits (`SmartWait`)**: Event-driven and DOM-state synchronization without arbitrary sleeps (`waitForTimeout`).
- **Hybrid Purchase-to-Dashboard Flow**: Complete verification from Stripe checkout to auto-authenticated customer dashboard.
- **Multi-Breakpoint Mobile Testing**: Responsive testing across 320px, 390px, 768px, and 1440px viewports with touch target audits.
- **Internationalization (i18n)**: English (`/`) and German (`/de`, `/de/pricing`) localized route tests with `hreflang` validation.
- **Proof-Oriented Reporting**: Structured STDOUT evidence logging (`[PASS]`, `[INFO]`, `[EVIDENCE]`), screenshot captures, and JSON payload attachments.
- **Automated CI/CD**: GitHub Actions workflow that executes tests with 0 retries and automatically deploys the full interactive Playwright report with all assets to **GitHub Pages**.

---

## 🛠️ Local Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Install Chromium Browser:**
   ```bash
   npx playwright install chromium
   ```

3. **Run All Tests (CI Mode, 0 Retries):**
   ```bash
   npm test -- --retries=0
   ```

4. **View Interactive HTML Report:**
   ```bash
   npm run report
   ```

---

## 🌐 GitHub Pages Deployment

The included GitHub Actions workflow ([`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)) handles:
1. Automated execution on every `push` and `pull_request` to `main`.
2. Browser caching for sub-2-minute execution.
3. Test artifact preservation (`playwright-report` and `test-results` with traces and screenshots).
4. **GitHub Pages Deployment**: Deploys the complete interactive Playwright report (`playwright-report/`) to your GitHub Pages URL automatically, even if tests fail (using `if: always()`).

### Enabling GitHub Pages in Your Repository:
1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The workflow will automatically publish your report on every run.
