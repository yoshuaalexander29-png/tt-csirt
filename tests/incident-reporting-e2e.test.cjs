const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

async function clickGcdsButton(page, id) {
  await page.$eval(`#${id}`, (host) => {
    const button = host.shadowRoot?.querySelector('[part="button"]');
    if (!button) throw new Error(`GCDS button #${host.id} was not rendered`);
    button.click();
  });
}

describe('TT-CSIRT Incident Reporting E2E Wizard & Accessibility Suite', () => {
  let browser;
  let page;

  before(async () => {
    try {
      await fetch(`${BASE_URL}/api/incident-report/test-clear`, { method: 'POST' });
    } catch (_) {}
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  after(async () => {
    if (browser) await browser.close();
  });

  it('renders the full-width reporting start page and reflows its content', async () => {
    await page.goto(`${BASE_URL}/report-an-incident`, { waitUntil: 'networkidle0' });

    assert.ok(
      await page.evaluate(() => document.body.innerText.includes('Reporting to TT-CSIRT does not make a police report')),
      'The page must distinguish TT-CSIRT reporting from police reporting'
    );
    assert.strictEqual(
      await page.$$eval('a[href="https://www.ttps.gov.tt/report/"]', (links) => links.length),
      1,
      'The form must link to the official TTPS incident-reporting service'
    );

    // Verify page title
    const title = await page.title();
    assert.ok(
      title.includes('Report a cyber security incident') || title.includes('Report an incident'),
      `Page title must reflect incident reporting, got: ${title}`
    );

    const h1Count = await page.$$eval('h1', (elements) => elements.length);
    assert.strictEqual(h1Count, 1, 'Page must contain exactly one h1');

    // Start with the service overview, then enter the reporting questions
    const startButton = await page.$('gcds-button#start-incident-report-button');
    assert.ok(startButton, 'Service start page must use the GCDS primary button');
    assert.match(await startButton.evaluate((el) => el.textContent), /Start now/);
    assert.ok(await page.$('#incident-reporting-start-page'));
    assert.ok(await page.$('#what-to-prepare-heading'));
    assert.ok(await page.$('#what-happens-after-report-heading'));
    assert.strictEqual(await page.$$eval('#incident-route-options li', (items) => items.length), 7);
    assert.strictEqual(await page.$eval('#incident-reporting-start-page ol', (list) => list.children.length), 4);
    assert.strictEqual(await page.$$eval('.incident-reporting-service a[href^="tel:"]', (links) => links.length), 2);
    assert.ok(await page.$('.incident-reporting-service .govuk-inset-text'),
      'The page should explain that users can report without every detail');
    assert.ok(await page.$('.incident-reporting-service .govuk-warning-text'),
      'The page should explain how to report safely from a trusted device or network');
    assert.ok(await page.$('.incident-reporting-service details.govuk-details summary'),
      'Technical evidence guidance should use progressive disclosure');
    assert.strictEqual(await page.$eval('.incident-reporting-support p', (el) => el.textContent.trim()),
      'For urgent help with an active incident, call TT-CSIRT:');

    for (const width of [1440, 1280, 1024, 768, 430, 390, 375, 360, 320]) {
      await page.setViewport({ width, height: 900 });
      const geometry = await page.evaluate(() => {
        const rect = (element) => {
          const box = element.getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width };
        };
        const routeList = document.querySelector('#incident-route-options');
        const steps = document.querySelector('#incident-reporting-start-page ol');
        const startColumn = document.querySelector('#incident-reporting-start-page > .govuk-grid-column-two-thirds');
        const reportingRoutes = [
          document.querySelector('#ttcsirt-reporting-heading').parentElement,
          document.querySelector('#ttps-reporting-heading').parentElement,
        ];
        return {
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          main: rect(document.querySelector('#main-content')),
          service: rect(document.querySelector('.incident-reporting-service')),
          entry: rect(document.querySelector('#incident-reporting-start-page')),
          startColumn: rect(startColumn),
          startColumnContentWidth: startColumn.getBoundingClientRect().width - 30,
          routeDisplay: getComputedStyle(routeList).display,
          routeListStyle: getComputedStyle(routeList).listStyleType,
          stepColumns: getComputedStyle(steps).gridTemplateColumns.split(' ').length,
          routeScrollWidth: routeList.scrollWidth,
          reportingRoutes: reportingRoutes.map(rect),
          hasContentsLayout: document.querySelector('main.app-main-wrapper--with-sidebar, .app-page-wrapper--with-sidebar, .app-page-nav') !== null,
        };
      });

      assert.ok(geometry.documentWidth <= geometry.viewport + 1,
        `No horizontal overflow at ${width}px: ${JSON.stringify(geometry)}`);
      assert.ok(Math.abs(geometry.main.left - geometry.service.left) <= 1,
        `Service content must align with the main container at ${width}px: ${JSON.stringify(geometry)}`);
      assert.ok(Math.abs(geometry.main.width - geometry.service.width) <= 1,
        `Service content must use the available main width at ${width}px: ${JSON.stringify(geometry)}`);
      if (width >= 640) {
        assert.ok(Math.abs(geometry.startColumnContentWidth - geometry.service.width * 2 / 3) <= 12,
          `The start page should use a two-thirds GOV.UK content column at ${width}px: ${JSON.stringify(geometry)}`);
      } else {
        assert.ok(Math.abs(geometry.startColumnContentWidth - geometry.service.width) <= 1,
          `The start page should use the full content width on mobile at ${width}px: ${JSON.stringify(geometry)}`);
      }
      assert.strictEqual(geometry.hasContentsLayout, false,
        `The reporting route must not inherit the contents/sidebar layout at ${width}px`);
      assert.strictEqual(geometry.routeDisplay, 'block',
        `Incident examples should remain a visible list at ${width}px: ${JSON.stringify(geometry)}`);
      assert.strictEqual(geometry.routeListStyle, 'disc',
        `Incident examples should retain GOV.UK bullet-list semantics at ${width}px: ${JSON.stringify(geometry)}`);
      assert.ok(geometry.routeScrollWidth <= geometry.startColumnContentWidth + 1,
        `Incident examples must not overflow the content column at ${width}px: ${JSON.stringify(geometry)}`);
      assert.strictEqual(geometry.reportingRoutes.length, 2);

      if (width >= 961) {
        assert.strictEqual(geometry.stepColumns, 4);
        assert.ok(geometry.reportingRoutes[1].left > geometry.reportingRoutes[0].left,
          `The TTPS route should sit beside the TT-CSIRT route at ${width}px: ${JSON.stringify(geometry)}`);
      } else if (width >= 640) {
        assert.strictEqual(geometry.stepColumns, 2);
        assert.ok(geometry.reportingRoutes[1].left > geometry.reportingRoutes[0].left,
          `The TTPS route should sit beside the TT-CSIRT route at ${width}px: ${JSON.stringify(geometry)}`);
      } else {
        assert.strictEqual(geometry.stepColumns, 1);
        assert.ok(geometry.reportingRoutes[1].top >= geometry.reportingRoutes[0].bottom - 1,
          `The TTPS route should stack below the TT-CSIRT route at ${width}px: ${JSON.stringify(geometry)}`);
      }
    }

    await page.setViewport({ width: 1280, height: 800 });
    await startButton.click();
    await page.waitForSelector('#continue-button-step-1');

    const caption = await page.$eval('#step-caption', (el) => el.textContent.trim());
    assert.strictEqual(caption, 'Step 1 of 10');
    const questionGeometry = await page.evaluate(() => ({
      serviceWidth: document.querySelector('.incident-reporting-service').getBoundingClientRect().width,
      mainWidth: document.querySelector('#main-content').getBoundingClientRect().width,
    }));
    assert.ok(Math.abs(questionGeometry.serviceWidth - questionGeometry.mainWidth) <= 1,
      `Question flow must continue to use the full main width: ${JSON.stringify(questionGeometry)}`);
  });

  it('identifies an incomplete answer and focuses the error summary', async () => {
    await clickGcdsButton(page, 'continue-button-step-1');
    await new Promise((r) => setTimeout(r, 150));

    // Verify Error Summary presence
    const errorSummary = await page.$('#incident-error-summary');
    assert.ok(errorSummary, 'govuk-error-summary must be present on validation failure');

    const errorCount = await page.$$eval('.govuk-error-summary__list li', (items) => items.length);
    assert.strictEqual(errorCount, 1, 'Only the current question should be reported');

    // Test anchor link jump
    await page.evaluate(() => {
      const link = document.querySelector('.govuk-error-summary__list a');
      if (link) link.click();
    });
    await new Promise((r) => setTimeout(r, 150));

    // Active element should be an input or select
    const activeId = await page.evaluate(() => document.activeElement?.id);
    assert.strictEqual(activeId, 'incident-type', `Focus should move to the invalid field, got: ${activeId}`);
  });

  it('allows an unknown incident description without requiring free text', async () => {
    const unknownPage = await browser.newPage();
    await unknownPage.setViewport({ width: 1280, height: 800 });
    await unknownPage.goto(`${BASE_URL}/report-an-incident`, { waitUntil: 'networkidle0' });
    await unknownPage.click('#start-incident-report-button');
    await unknownPage.select('#incident-type', 'Ransomware');
    await unknownPage.click('#continue-button-step-1');
    await unknownPage.waitForSelector('#incident-timing-unknown');
    await unknownPage.click('#incident-timing-unknown');
    await unknownPage.click('#continue-button-step-2');
    await unknownPage.waitForSelector('#incident-details-unknown');
    await unknownPage.click('#incident-details-unknown');

    const detailsVisible = await unknownPage.$eval('#incident-details', (field) =>
      field.getClientRects().length > 0
    );
    assert.equal(detailsVisible, false, 'Unknown selection hides the free-text description');
    await unknownPage.click('#continue-button-step-3');
    await unknownPage.waitForSelector('#continue-button-step-4');
    await unknownPage.close();
  });

  it('preserves answers across question pages, requires an evidence answer and submits from review', async () => {
    await page.select('#incident-type', 'Ransomware');
    const assertQuestionSemantics = async () => {
      const issues = await page.evaluate(() => {
        const isVisible = (element) => {
          const style = getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
        };
        const controls = [...document.querySelectorAll('form input:not([type="hidden"]), form select, form textarea')].filter(isVisible);
        const missingLabels = controls.filter((control) => !control.labels?.length || ![...control.labels].some(isVisible)).map((control) => control.id);
        const missingLegends = [...document.querySelectorAll('form fieldset')]
          .filter(isVisible)
          .filter((fieldset) => !fieldset.querySelector('legend') || !isVisible(fieldset.querySelector('legend')))
          .map((fieldset) => fieldset.id || 'fieldset without id');
        return { h1Count: document.querySelectorAll('main h1').length, missingLabels, missingLegends };
      });
      assert.strictEqual(issues.h1Count, 1, `Each question page must have one h1: ${JSON.stringify(issues)}`);
      assert.deepStrictEqual(issues.missingLabels, [], `Visible controls must have visible labels: ${JSON.stringify(issues)}`);
      assert.deepStrictEqual(issues.missingLegends, [], `Visible radio groups must have visible legends: ${JSON.stringify(issues)}`);
    };
    const completeStep = async (step, fill) => {
      if (fill) await fill();
      await assertQuestionSemantics();
      await clickGcdsButton(page, `continue-button-step-${step}`);
      await page.waitForSelector(step === 10 ? '#submit-report-button' : `#continue-button-step-${step + 1}`);
    };
    await completeStep(1);
    await page.click('#incident-timing-unknown');
    await completeStep(2);
    await page.click('#continue-button-step-3');
    await page.waitForSelector('#incident-details-error');
    assert.match(await page.$eval('#incident-details-error', (el) => el.textContent), /Enter a description/);
    await page.type('#incident-details', 'x'.repeat(5001));
    await page.click('#continue-button-step-3');
    await page.waitForSelector('#incident-error-summary');
    assert.match(await page.$eval('#incident-details-error', (el) => el.textContent), /5,000 characters or fewer/);
    await page.focus('#incident-details');
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.type('#incident-details', 'DDoS');
    await completeStep(3);
    await page.click('#affected-systems-unknown');
    await completeStep(4);
    await page.click('#impact-unknown');
    await completeStep(5);

    await clickGcdsButton(page, 'continue-button-step-6');
    await page.waitForSelector('#incident-error-summary');
    assert.strictEqual(await page.$eval('#evidence-available-error', (el) => el.textContent.trim()).then((v) => v.replace(/^Error:\s*/, '')),
      'Select whether you have technical evidence or logs available');
    await page.click('#evidence-available-yes');
    await page.type('#evidence-notes', 'Firewall logs have been preserved.');
    await completeStep(6);

    await clickGcdsButton(page, 'continue-button-step-7');
    await page.waitForSelector('#reporter-type-error');
    assert.match(await page.$eval('#reporter-type-error', (el) => el.textContent), /Select whether/);
    await page.click('#reporter-type-org');
    await page.type('#organisation', 'Trinidad Port Authority Operations');
    await page.select('#sector', 'Transport & Logistics');
    await page.click('#reporter-type-ind');
    assert.strictEqual(await page.$('#organisation'), null, 'Organisation-only fields should be hidden for individuals');
    await page.click('#reporter-type-org');
    assert.strictEqual(await page.$eval('#organisation', (el) => el.value), 'Trinidad Port Authority Operations');
    assert.strictEqual(await page.$eval('#sector', (el) => el.value), 'Transport & Logistics');
    await completeStep(7);
    await completeStep(8, async () => page.type('#reporter-name', 'Michael Chang'));
    await completeStep(9, async () => page.type('#email', 'm.chang@example.gov.tt'));
    assert.strictEqual(await page.$eval('label[for="phone"]', (el) => el.textContent.trim()), 'Your telephone number');
    assert.notStrictEqual(await page.$eval('label[for="phone"]', (el) => getComputedStyle(el).display), 'none');
    assert.strictEqual(await page.$eval('#continue-button-step-10', (el) => el.textContent.trim()), 'Review your answers');
    await completeStep(10, async () => page.type('#phone', '+1 (868) 625-9988'));
    await page.waitForSelector('#submit-report-button');

    const reviewHeading = await page.$eval('#incident-reporting-heading', (el) => el.textContent.trim());
    assert.match(reviewHeading, /Check your answers before submitting/);
    assert.match(await page.$eval('#main-content', (el) => el.textContent), /Your report has not been sent/);
    assert.strictEqual(await page.$eval('#review-value-incident-timing', (el) => el.textContent.trim()), "I don't know yet");
    assert.strictEqual(await page.$eval('#review-value-affected-systems', (el) => el.textContent.trim()), "I don't know");
    assert.strictEqual(await page.$eval('#review-value-impact', (el) => el.textContent.trim()), "I don't know the impact yet");
    await page.evaluate(() => {
      const link = document.querySelector('a[href="#incident-details"]');
      link.click();
    });
    await page.waitForSelector('#incident-details');
    assert.strictEqual(await page.$eval('#incident-details', (el) => el.value), 'DDoS');
    for (let step = 3; step <= 10; step += 1) {
      await clickGcdsButton(page, `continue-button-step-${step}`);
      await page.waitForSelector(step === 10 ? '#submit-report-button' : `#continue-button-step-${step + 1}`);
    }

    await clickGcdsButton(page, 'submit-report-button');

    // Wait for confirmation screen
    await page.waitForSelector('#incident-confirmation-panel', { timeout: 8000 });

    const confirmationTitle = await page.$eval('#confirmation-heading', (el) => el.textContent.trim());
    assert.strictEqual(confirmationTitle, 'Incident reported');

    const referenceNumber = await page.$eval('#confirmation-reference-number', (el) => el.textContent.trim());
    assert.match(
      referenceNumber,
      /^TT-?CSIRT(?:-IR)?-\d{4}-[A-Z0-9]{5,6}$/,
      'Reference number must match TT-CSIRT reference format'
    );

    // Verify What happens next section
    const nextSteps = await page.$('#what-happens-next-heading');
    assert.ok(nextSteps, 'What happens next heading must be present');
  });

  it('supports browser Back and Forward without losing entered answers', async () => {
    const historyPage = await browser.newPage();
    await historyPage.setViewport({ width: 1280, height: 800 });
    await historyPage.goto(`${BASE_URL}/report-an-incident`, { waitUntil: 'networkidle0' });
    await historyPage.click('#start-incident-report-button');
    await historyPage.select('#incident-type', 'Ransomware');
    await historyPage.click('#continue-button-step-1');
    await historyPage.waitForSelector('#incident-timing');
    await historyPage.type('#incident-timing', 'Today at about 10am');
    await historyPage.click('#continue-button-step-2');
    await historyPage.waitForSelector('#incident-details');
    await historyPage.type('#incident-details', 'Suspicious activity was observed.');
    await historyPage.goBack();
    await historyPage.waitForFunction(() => document.querySelector('#incident-timing')?.value === 'Today at about 10am');
    await historyPage.goForward();
    await historyPage.waitForFunction(() => document.querySelector('#incident-details')?.value === 'Suspicious activity was observed.');
    await historyPage.click('.govuk-breadcrumbs a[href="/services"]');
    await historyPage.waitForFunction(() => window.location.pathname === '/services');
    await historyPage.goBack();
    await historyPage.waitForSelector('#incident-details');
    assert.strictEqual(await historyPage.$eval('#incident-details', (el) => el.value), 'Suspicious activity was observed.');
    await historyPage.close();
  });

  it('keeps the confirmation, start and question views usable at 375px', async () => {
    await page.setViewport({ width: 375, height: 667 });
    const confirmationScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const confirmationClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert.ok(confirmationScrollWidth <= confirmationClientWidth + 1,
      `No horizontal overflow on mobile confirmation: ${confirmationScrollWidth} > ${confirmationClientWidth}`);

    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 375, height: 667 });
    await mobilePage.goto(`${BASE_URL}/report-an-incident`, { waitUntil: 'networkidle0' });

    // Check no horizontal document scroll
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
    assert.ok(scrollWidth <= clientWidth + 1, `No horizontal overflow on mobile: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
    await mobilePage.click('#start-incident-report-button');
    await mobilePage.waitForSelector('#continue-button-step-1');
    const questionScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(questionScrollWidth <= clientWidth + 1,
      `No horizontal overflow on mobile question page: ${questionScrollWidth} > ${clientWidth}`);
    await mobilePage.close();
  });
});
