const test = require('node:test');
const assert = require('node:assert');
const puppeteer = require('puppeteer');

test('TT-CSIRT Advisories Page Search & Filter Invariants Suite', async (t) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  t.after(async () => {
    await browser.close();
  });

  await t.test('1. asserts search bar desktop layout, dimensions, and styling invariants', async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/advisories', { waitUntil: 'networkidle0' });

    const searchMetrics = await page.evaluate(() => {
      const input = document.querySelector('.advisories-search-input');
      const button = document.querySelector('.advisories-search-button');
      const form = document.querySelector('.advisories-search-form');

      if (!input || !button || !form) return null;

      const inputCs = window.getComputedStyle(input);
      const buttonCs = window.getComputedStyle(button);
      const inputRect = input.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      return {
        input: {
          height: inputCs.height,
          padding: inputCs.padding,
          border: inputCs.border,
          backgroundColor: inputCs.backgroundColor,
          fontSize: inputCs.fontSize,
          boxSizing: inputCs.boxSizing,
        },
        button: {
          height: buttonCs.height,
          backgroundColor: buttonCs.backgroundColor,
        },
        alignment: {
          inputTop: inputRect.top,
          buttonTop: buttonRect.top,
          diff: Math.abs(inputRect.top - buttonRect.top)
        }
      };
    });

    assert.ok(searchMetrics, 'Search form, input, and button must exist');
    assert.strictEqual(searchMetrics.input.height, '40px', 'Search input height must be exactly 40px');
    assert.strictEqual(searchMetrics.input.padding, '5px', 'Search input padding must be 5px (GOV.UK 5px modulo)');
    assert.strictEqual(searchMetrics.input.border, '2px solid rgb(11, 12, 12)', 'Search input border must be 2px solid #0b0c0c');
    assert.strictEqual(searchMetrics.input.backgroundColor, 'rgb(255, 255, 255)', 'Search input background must be white');
    assert.strictEqual(searchMetrics.input.fontSize, '19px', 'Search input font size must be 19px');
    assert.strictEqual(searchMetrics.button.height, '40px', 'Search button height must match input height (40px)');
    assert.ok(searchMetrics.alignment.diff < 2, 'Search input and button must be vertically aligned on desktop');

    await page.close();
  });

  await t.test('2. asserts authentic GOV.UK yellow focus ring on search input', async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/advisories', { waitUntil: 'networkidle0' });

    await page.focus('.advisories-search-input');
    const focusStyles = await page.evaluate(() => {
      const input = document.querySelector('.advisories-search-input');
      const cs = window.getComputedStyle(input);
      return {
        outline: cs.outline,
        boxShadow: cs.boxShadow,
      };
    });

    assert.ok(
      focusStyles.outline.includes('rgb(255, 221, 0)') || focusStyles.outline.includes('255, 221, 0'),
      'Input focus outline must be authentic GOV.UK yellow (#ffdd00)'
    );
    assert.ok(
      focusStyles.boxShadow.includes('rgb(11, 12, 12)'),
      'Input focus must have authentic black inset shadow'
    );

    await page.close();
  });

  await t.test('3. asserts filter dropdown controls styling and consistency', async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/advisories', { waitUntil: 'networkidle0' });

    const selects = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.advisories-filter-select')).map(el => {
        const cs = window.getComputedStyle(el);
        return {
          id: el.id,
          height: cs.height,
          padding: cs.padding,
          border: cs.border,
        };
      });
    });

    assert.ok(selects.length >= 2, 'At least Topic and Date filter dropdowns must exist');
    for (const select of selects) {
      assert.strictEqual(select.height, '40px', `Filter ${select.id} must have 40px height`);
      assert.strictEqual(select.padding, '5px', `Filter ${select.id} must have 5px padding`);
      assert.strictEqual(select.border, '2px solid rgb(11, 12, 12)', `Filter ${select.id} must have 2px solid border`);
    }

    await page.close();
  });

  await t.test('4. asserts mobile responsive reflow (<640px)', async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/advisories', { waitUntil: 'networkidle0' });

    const mobileLayout = await page.evaluate(() => {
      const input = document.querySelector('.advisories-search-input');
      const button = document.querySelector('.advisories-search-button');
      const inputRect = input.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      return {
        inputWidth: inputRect.width,
        buttonWidth: buttonRect.width,
        inputHeight: inputRect.height,
        buttonTop: buttonRect.top,
        inputBottom: inputRect.bottom,
        stacked: buttonRect.top >= inputRect.bottom,
      };
    });

    assert.strictEqual(mobileLayout.inputHeight, 40, 'Mobile input height remains 40px');
    assert.ok(mobileLayout.stacked, 'Search button must stack cleanly below search input on mobile');
    assert.ok(mobileLayout.buttonWidth > 200, 'Search button expands to accessible touch target on mobile');

    await page.close();
  });
});
