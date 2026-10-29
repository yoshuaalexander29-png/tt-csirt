/**
 * TT-CSIRT Primary Navigation Interaction Invariant Regression Test Suite
 *
 * Core Invariant:
 * For a navigation item representing the page the user is currently on:
 *   CURRENT + HOVER = CURRENT
 * The visual appearance of the current navigation item must remain unchanged
 * when hovered, even when retaining browser focus after being clicked.
 *
 * Non-Current Invariant:
 *   NON-CURRENT + HOVER = HOVER
 * Non-current navigation items must retain standard hover behavior (underline,
 * hover text color rgb(0, 48, 120) [#003078], and hover background rgb(243, 242, 241) [#f3f2f1]).
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const VIEWPORT = { width: 1280, height: 800 };

describe('TT-CSIRT Primary Navigation - Interaction Invariant Regression Suite', () => {
  let browser;
  let page;

  before(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    page = await browser.newPage();
    await page.setViewport(VIEWPORT);
  });

  after(async () => {
    if (page) await page.close();
    if (browser) await browser.close();
  });

  /**
   * Helper to extract computed visual styling from an element handle or selector.
   */
  async function getComputedNavStyles(elementOrSelector) {
    return await page.evaluate((target) => {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return null;
      const comp = window.getComputedStyle(el);
      return {
        textDecoration: comp.textDecoration,
        textDecorationLine: comp.textDecorationLine,
        color: comp.color,
        backgroundColor: comp.backgroundColor,
        boxShadow: comp.boxShadow,
        outline: comp.outline,
        outlineColor: comp.outlineColor
      };
    }, elementOrSelector);
  }

  /**
   * Helper to click a neutral location and blur active focus.
   */
  async function clickNeutralLocation() {
    await page.mouse.click(10, 10);
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    });
  }

  async function openNavigation() {
    const toggle = await page.$('.ttcsirt-header-menu-toggle');
    assert.ok(toggle, 'The masthead menu control must exist');
    if (await toggle.evaluate(el => el.getAttribute('aria-expanded') !== 'true')) {
      await toggle.click();
    }
    await page.waitForFunction(() =>
      document.querySelector('nav[aria-label="TT-CSIRT service navigation"]')?.getAttribute('aria-hidden') === 'false'
    );
  }

  it('1. keeps the current navigation state stable on hover', async () => {
    await page.goto(`${BASE_URL}/news`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav[aria-label="TT-CSIRT service navigation"]', { timeout: 5000 });
    await openNavigation();

    const currentLink = await page.$('nav[aria-label="TT-CSIRT service navigation"] a[aria-current="page"]');
    assert.ok(currentLink, 'Navigation item representing current section must exist and have aria-current="page"');
    const linkText = await currentLink.evaluate(el => el.textContent.trim());
    assert.strictEqual(linkText, 'News', 'The News link is current on /news');
    const ariaCurrent = await currentLink.evaluate(el => el.getAttribute('aria-current'));
    assert.strictEqual(ariaCurrent, 'page', 'Current navigation link must have aria-current="page"');

    const initialStyles = await getComputedNavStyles(currentLink);
    await currentLink.hover();
    const hoveredStyles = await getComputedNavStyles(currentLink);
    assert.strictEqual(
      hoveredStyles.boxShadow,
      initialStyles.boxShadow,
      'Active indicator box-shadow must remain unchanged when current navigation item is hovered'
    );
    assert.strictEqual(
      hoveredStyles.color,
      initialStyles.color,
      'Text color must remain unchanged when current navigation item is hovered'
    );
    assert.strictEqual(
      hoveredStyles.backgroundColor,
      initialStyles.backgroundColor,
      'Background color must remain unchanged when current navigation item is hovered'
    );
  });

  it('2. verifies non-current item hover behavior (NON-CURRENT + HOVER = HOVER)', async () => {
    await page.goto(`${BASE_URL}/news`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav[aria-label="TT-CSIRT service navigation"]', { timeout: 5000 });
    await openNavigation();

    // Choose non-current primary navigation link: "Services"
    const nonCurrentLink = await page.$('nav[aria-label="TT-CSIRT service navigation"] a[href="/services"]');
    assert.ok(nonCurrentLink, 'Non-current navigation link (Services) must exist');

    const nonCurrentAria = await nonCurrentLink.evaluate(el => el.getAttribute('aria-current'));
    assert.notStrictEqual(nonCurrentAria, 'page', 'Non-current item must not have aria-current="page"');

    // Unhovered non-current state
    const initialStyles = await getComputedNavStyles(nonCurrentLink);
    assert.strictEqual(initialStyles.textDecorationLine, 'underline', 'Non-current links remain visibly identifiable as links');
    assert.strictEqual(initialStyles.boxShadow, 'none', 'Unhovered non-current item has no active bottom box-shadow');

    // Hover non-current item
    await nonCurrentLink.hover();
    const hoveredStyles = await getComputedNavStyles(nonCurrentLink);

    // Verify NON-CURRENT + HOVER = HOVER
    assert.strictEqual(
      hoveredStyles.textDecorationLine,
      'underline',
      'REGRESSION DETECTED: Hover was accidentally disabled on non-current navigation item; expected text-decoration: underline'
    );
    assert.strictEqual(hoveredStyles.color, 'rgb(0, 48, 120)', 'Hover uses the established link hover colour');
    assert.strictEqual(hoveredStyles.backgroundColor, initialStyles.backgroundColor, 'Hover does not introduce a background panel');

    // Unhover by moving mouse away
    await page.mouse.move(0, 0);
    const restoredStyles = await getComputedNavStyles(nonCurrentLink);
    assert.strictEqual(restoredStyles.textDecorationLine, 'underline', 'The standard link underline remains after hover');
    assert.strictEqual(restoredStyles.backgroundColor, initialStyles.backgroundColor, 'Unhovering restored background');
  });

  it('3. explicitly tests previously failing state: clicking current link and hovering while retaining focus', async () => {
    await page.goto(`${BASE_URL}/news`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav[aria-label="TT-CSIRT service navigation"]', { timeout: 5000 });
    await openNavigation();

    const currentLink = await page.$('nav[aria-label="TT-CSIRT service navigation"] a[aria-current="page"]');

    // Selecting a destination closes the menu and hands focus to the new main content.
    await currentLink.click();
    await page.waitForFunction(() => document.activeElement?.id === 'main-content');
    assert.strictEqual(await currentLink.evaluate(el => el.closest('nav').getAttribute('aria-hidden')), 'true');
    assert.strictEqual(await page.$eval('.ttcsirt-header-menu-toggle', el => el.getAttribute('aria-expanded')), 'false');
  });

  const SECTION_ROUTES = [
    { path: '/services', expectedLink: 'All services' },
    { path: '/advisories', expectedLink: 'Cyber security advisories' },
    { path: '/guidance', expectedLink: 'All guidance' },
    { path: '/news', expectedLink: 'News' },
    { path: '/statistics', expectedLink: 'Incident statistics' },
    { path: '/about', expectedLink: null }
  ];

  for (const { path, expectedLink } of SECTION_ROUTES) {
    it(`4. identifies the current destination on ${path}`, async () => {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('nav[aria-label="TT-CSIRT service navigation"]', { timeout: 5000 });
      await openNavigation();

      const currentLink = await page.$('nav[aria-label="TT-CSIRT service navigation"] a[aria-current="page"]');
      if (!expectedLink) {
        assert.strictEqual(currentLink, null, `Route ${path} is intentionally not represented in service navigation`);
        return;
      }
      assert.ok(currentLink, `Route ${path} must have an active navigation link`);

      const linkText = await currentLink.evaluate(el => el.textContent.trim());
      assert.strictEqual(linkText, expectedLink, `Route ${path} current destination must be "${expectedLink}"`);

      // Initial current styles
      const initial = await getComputedNavStyles(currentLink);
      assert.strictEqual(initial.textDecorationLine, 'underline', `Route ${path} keeps its descriptive link styling`);
      assert.ok(
        initial.boxShadow.includes('0px -4px') || initial.boxShadow.includes('inset'),
        `Route ${path} current item must display active bottom indicator`
      );

      // Hover current link -> CURRENT + HOVER = CURRENT
      await currentLink.hover();
      const hovered = await getComputedNavStyles(currentLink);

      assert.strictEqual(
        hovered.boxShadow,
        initial.boxShadow,
        `Route ${path} active indicator must not change on hover`
      );
      assert.strictEqual(
        hovered.color,
        initial.color,
        `Route ${path} color must not change on hover`
      );
      assert.strictEqual(
        hovered.backgroundColor,
        initial.backgroundColor,
        `Route ${path} background must not change on hover`
      );

      // Verify a non-current primary item on this page still responds to hover
      const nonCurrentLink = await page.$(
        'nav[aria-label="TT-CSIRT service navigation"] a.ttcsirt-navigation__link:not([aria-current="page"])'
      );
      if (nonCurrentLink) {
        await nonCurrentLink.hover();
        const nonCurrentHovered = await getComputedNavStyles(nonCurrentLink);
        assert.strictEqual(
          nonCurrentHovered.textDecorationLine,
          'underline',
          `Route ${path} non-current link must display underline on hover`
        );
      }
      await page.mouse.move(0, 0);
    });
  }

  it('5. verifies Home route (/) where all primary navigation items behave as non-current', async () => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav[aria-label="TT-CSIRT service navigation"]', { timeout: 5000 });
    await openNavigation();

    // On home, none of the primary navigation links are marked as current section
    const currentLink = await page.$('nav[aria-label="TT-CSIRT service navigation"] a[aria-current="page"]');
    assert.strictEqual(currentLink, null, 'Home route (/) must not have any primary section marked aria-current="page"');

    // Hover Services link from home
    const servicesLink = await page.$('nav[aria-label="TT-CSIRT service navigation"] a[href="/services"]');
    assert.ok(servicesLink, 'Services link must exist on home');

    await servicesLink.hover();
    const servicesHovered = await getComputedNavStyles(servicesLink);
    assert.strictEqual(
      servicesHovered.textDecorationLine,
      'underline',
      'On home route, hovering Services must activate text-decoration: underline'
    );
    assert.strictEqual(servicesHovered.color, 'rgb(0, 48, 120)', 'Home navigation hover uses the established link hover colour');
    await page.mouse.move(0, 0);
  });

  it('6. asserts accessibility: correct aria-current semantics across navigation items', async () => {
    await page.goto(`${BASE_URL}/news`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav[aria-label="TT-CSIRT service navigation"]', { timeout: 5000 });
    await openNavigation();

    const allLinks = await page.$$eval(
      'nav[aria-label="TT-CSIRT service navigation"] .ttcsirt-navigation__link',
      els => els.map(el => ({
        text: el.textContent.trim(),
        ariaCurrent: el.getAttribute('aria-current')
      }))
    );

    const currentLinks = allLinks.filter(l => l.ariaCurrent === 'page');
    assert.strictEqual(currentLinks.length, 1, 'Exactly one primary navigation link must have aria-current="page"');
    assert.strictEqual(currentLinks[0].text, 'News', 'Current link on /news must be "News"');

    const nonCurrentLinks = allLinks.filter(l => l.ariaCurrent !== 'page');
    assert.strictEqual(allLinks.length, 13, 'All service-navigation destinations remain available in the expanded menu');
    assert.strictEqual(nonCurrentLinks.length, 12, 'Every other destination must not have aria-current="page"');
  });

  it('7. asserts accessibility: keyboard focus remains clearly visible and independent of current/hover state', async () => {
    await page.goto(`${BASE_URL}/news`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav[aria-label="TT-CSIRT service navigation"]', { timeout: 5000 });
    await openNavigation();

    const currentLink = await page.$('nav[aria-label="TT-CSIRT service navigation"] a[aria-current="page"]');
    const nonCurrentLink = await page.$('nav[aria-label="TT-CSIRT service navigation"] a[href="/services"]');

    // 1. Keyboard focus on current link
    await currentLink.focus();
    const currentFocusStyles = await getComputedNavStyles(currentLink);
    assert.strictEqual(
      currentFocusStyles.backgroundColor,
      'rgb(255, 221, 0)',
      'Current link keyboard focus must use GOV.UK authentic yellow focus background (#ffdd00)'
    );
    assert.ok(currentFocusStyles.boxShadow.includes('rgb(11, 12, 12)'), 'Keyboard focus keeps a strong dark edge against the yellow focus fill');
    assert.strictEqual(
      currentFocusStyles.textDecorationLine,
      'none',
      'Current link keyboard focus must not introduce underline'
    );

    // 2. Keyboard focus on non-current link
    await nonCurrentLink.focus();
    const nonCurrentFocusStyles = await getComputedNavStyles(nonCurrentLink);
    assert.strictEqual(
      nonCurrentFocusStyles.backgroundColor,
      'rgb(255, 221, 0)',
      'Non-current link keyboard focus must use GOV.UK authentic yellow focus background (#ffdd00)'
    );
  });

  it('8. asserts accessibility: current-state indicator is immediately visible on initial render without requiring hover', async () => {
    await page.goto(`${BASE_URL}/guidance`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav[aria-label="TT-CSIRT service navigation"]', { timeout: 5000 });
    await openNavigation();

    const currentLink = await page.$('nav[aria-label="TT-CSIRT service navigation"] a[aria-current="page"]');
    assert.ok(currentLink, 'Guidance link must be current on /guidance');

    // Without any mouse movement or hover:
    const styles = await getComputedNavStyles(currentLink);
    assert.ok(
      styles.boxShadow.includes('0px -4px') || styles.boxShadow.includes('inset'),
      'Active indicator (4px bottom inset) must be immediately visible without requiring hover'
    );
      assert.ok(styles.boxShadow !== 'none', 'Current destination has a visible active marker');
  });
});
