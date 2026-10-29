const { test } = require("node:test");
const assert = require("node:assert/strict");
const puppeteer = require("puppeteer");

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:5174";
const VIEWPORTS = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];

test("masthead geometry, responsive reflow and panels remain aligned", async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();

    for (const width of VIEWPORTS) {
      await page.setViewport({ width, height: 900 });
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".government-masthead__digital-government-logo");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.querySelectorAll(
        ".government-masthead__coat, .government-masthead__digital-government-logo, .government-masthead__service-logo"
      )].every((image) => image.complete && image.naturalWidth > 0));

      const layout = await page.evaluate(() => {
        const rect = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const { x, y, width, height, right, bottom } = element.getBoundingClientRect();
          return { x, y, width, height, right, bottom };
        };
        const visibleLeft = (selector, insetFraction) => {
          const element = document.querySelector(selector);
          const bounds = element.getBoundingClientRect();
          return bounds.left + bounds.width * insetFraction;
        };
        const overlaps = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
        const coat = rect(".government-masthead__coat");
        const government = rect(".government-masthead__title-top");
        const ministry = rect(".government-masthead__title-mid");
        const govtt = rect(".government-masthead__digital-government-logo");
        const service = rect(".government-masthead__service-logo");
        const menu = rect(".ttcsirt-header-menu-toggle");
        const search = rect(".ttcsirt-header-search-toggle");
        const utility = rect(".ttcsirt-header-utility-group");
        return {
          viewportWidth: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          menuInitiallyClosed: document.querySelector(".ttcsirt-navigation").inert &&
            document.querySelector(".ttcsirt-navigation").getAttribute("aria-hidden") === "true",
          authenticityInitiallyClosed: document.querySelector(".government-masthead__authenticity-panel").inert &&
            document.querySelector(".government-masthead__authenticity-panel").getAttribute("aria-hidden") === "true",
          header: rect(".govuk-generic-header__container"),
          content: rect(".app-page-wrapper > .govuk-width-container"),
          government,
          ministry,
          coat,
          govtt,
          service,
          menu,
          search,
          utility,
          mobileControlsCenter: (menu.x + search.right) / 2,
          contentCenter: (rect(".govuk-generic-header__container").x +
            rect(".govuk-generic-header__container").right) / 2,
          collisions: [
            overlaps(coat, government), overlaps(coat, ministry), overlaps(coat, govtt),
            overlaps(government, govtt), overlaps(ministry, govtt),
            overlaps(service, menu), overlaps(service, search), overlaps(menu, search),
          ],
          coatArtworkLeft: visibleLeft(".government-masthead__coat", 16 / 1264),
          serviceArtworkLeft: visibleLeft(".government-masthead__service-logo", 5 / 989),
          assetsLoaded: [...document.querySelectorAll(
            ".government-masthead__coat, .government-masthead__digital-government-logo, .government-masthead__service-logo"
          )].every((image) => image.complete && image.naturalWidth > 0),
        };
      });

      assert.equal(layout.documentWidth, width, `${width}px: no horizontal overflow`);
      assert.equal(layout.menuInitiallyClosed, true, `${width}px: closed navigation is inert and hidden from assistive technology`);
      assert.equal(layout.authenticityInitiallyClosed, true, `${width}px: closed authenticity panel is inert and hidden from assistive technology`);
      assert.ok(layout.header && layout.content, `${width}px: shared containers exist`);
      assert.ok(Math.abs(layout.header.x - layout.content.x) < 1, `${width}px: shared left edge`);
      assert.ok(Math.abs(layout.header.width - layout.content.width) < 1, `${width}px: shared width`);
      assert.ok(layout.government.bottom < layout.ministry.y, `${width}px: government and ministry are distinct`);
      assert.ok(Math.abs(layout.coatArtworkLeft - layout.serviceArtworkLeft) <= 2,
        `${width}px: visible Coat and TT-CSIRT artwork left edges align`);
      assert.ok(layout.collisions.every((collision) => !collision),
        `${width}px: identity and navigation elements do not overlap`);
      assert.ok(layout.menu.height >= 44 && layout.search.height >= 44,
        `${width}px: navigation controls retain usable target height`);
      assert.ok(layout.service.height <= layout.coat.height,
        `${width}px: service identity mark does not exceed the Coat of Arms`);
      if (width <= 700) {
        assert.ok(Math.abs(layout.mobileControlsCenter - layout.contentCenter) <= 1,
          `${width}px: Menu/Search group is centered beneath the service identity`);
        assert.ok(layout.menu.y > layout.service.bottom,
          `${width}px: Menu/Search follow the service identity`);
      }
      assert.ok(layout.assetsLoaded, `${width}px: identity assets load`);

      const beforeHover = await page.evaluate(() => {
        const menu = document.querySelector(".ttcsirt-header-menu-toggle").getBoundingClientRect();
        const search = document.querySelector(".ttcsirt-header-search-toggle").getBoundingClientRect();
        const identityLink = document.querySelector(".govuk-generic-header__homepage-link");
        return {
          menu: menu.toJSON(),
          search: search.toJSON(),
          identityHref: identityLink.href,
          identityLabel: identityLink.getAttribute("aria-label"),
          governmentBand: document.querySelector(".government-masthead__government-band").getBoundingClientRect().toJSON(),
          serviceBand: document.querySelector(".government-masthead__service-band").getBoundingClientRect().toJSON(),
          identity: identityLink.getBoundingClientRect().toJSON(),
        };
      });
      assert.equal(new URL(beforeHover.identityHref).hostname, "homelandsecurity.gov.tt",
        `${width}px: Coat of Arms identity links to the Ministry homepage`);
      assert.match(beforeHover.identityLabel, /Ministry of Homeland Security homepage/,
        `${width}px: Ministry homepage link has a clear accessible name`);
      await page.hover(".govuk-generic-header__homepage-link");
      const identityHover = await page.evaluate(() => ({
        governmentBand: document.querySelector(".government-masthead__government-band").getBoundingClientRect().toJSON(),
        serviceBand: document.querySelector(".government-masthead__service-band").getBoundingClientRect().toJSON(),
        identity: document.querySelector(".govuk-generic-header__homepage-link").getBoundingClientRect().toJSON(),
        marginBottom: getComputedStyle(document.querySelector(".govuk-generic-header__homepage-link")).marginBottom,
      }));
      assert.deepEqual(identityHover.governmentBand, beforeHover.governmentBand,
        `${width}px: government band remains pixel-stable on identity hover`);
      assert.deepEqual(identityHover.serviceBand, beforeHover.serviceBand,
        `${width}px: service band remains pixel-stable on identity hover`);
      assert.deepEqual(identityHover.identity, beforeHover.identity,
        `${width}px: identity link remains pixel-stable on hover`);
      assert.equal(identityHover.marginBottom, "0px", `${width}px: GOV.UK hover compensation is neutralised`);
      await page.hover(".ttcsirt-header-menu-toggle");
      const menuHover = await page.evaluate(() => ({
        background: getComputedStyle(document.querySelector(".ttcsirt-header-menu-toggle")).backgroundColor,
        underline: getComputedStyle(document.querySelector(".ttcsirt-header-menu-toggle__text")).textDecorationLine,
        rect: document.querySelector(".ttcsirt-header-menu-toggle").getBoundingClientRect().toJSON(),
      }));
      assert.equal(menuHover.background, "rgba(0, 0, 0, 0)", `${width}px: Menu hover has no fill`);
      assert.equal(menuHover.underline, "underline", `${width}px: Menu hover is underlined`);
      assert.equal(menuHover.rect.width, beforeHover.menu.width, `${width}px: Menu hover does not shift layout`);
      assert.equal(menuHover.rect.height, beforeHover.menu.height, `${width}px: Menu hover does not resize control`);

      await page.hover(".ttcsirt-header-search-toggle");
      const searchHover = await page.evaluate(() => ({
        background: getComputedStyle(document.querySelector(".ttcsirt-header-search-toggle")).backgroundColor,
        underline: getComputedStyle(document.querySelector(".ttcsirt-header-search-toggle"), "::after").opacity,
        rect: document.querySelector(".ttcsirt-header-search-toggle").getBoundingClientRect().toJSON(),
      }));
      assert.equal(searchHover.background, "rgba(0, 0, 0, 0)", `${width}px: Search hover has no fill`);
      assert.equal(searchHover.underline, "1", `${width}px: Search hover has its matching underline`);
      assert.equal(searchHover.rect.width, beforeHover.search.width, `${width}px: Search hover does not shift layout`);
      assert.equal(searchHover.rect.height, beforeHover.search.height, `${width}px: Search hover does not resize control`);

      await page.click(".ttcsirt-header-menu-toggle");
      const menuPanel = await page.evaluate(() => ({
        expanded: document.querySelector(".ttcsirt-header-menu-toggle").getAttribute("aria-expanded"),
        ariaHidden: document.querySelector(".ttcsirt-navigation").getAttribute("aria-hidden"),
        inert: document.querySelector(".ttcsirt-navigation").inert,
        background: getComputedStyle(document.querySelector(".ttcsirt-navigation")).backgroundColor,
        controlBackground: getComputedStyle(document.querySelector(".ttcsirt-header-menu-toggle")).backgroundColor,
        controlUnderline: getComputedStyle(document.querySelector(".ttcsirt-header-menu-toggle__text")).textDecorationLine,
        transition: getComputedStyle(document.querySelector(".ttcsirt-navigation")).transitionDuration,
        innerTransition: getComputedStyle(document.querySelector(".ttcsirt-navigation__inner")).transitionDuration,
        pointerFocusVisible: document.querySelector(".ttcsirt-header-menu-toggle").matches(":focus-visible"),
        pointerBackground: getComputedStyle(document.querySelector(".ttcsirt-header-menu-toggle")).backgroundColor,
        pointerOutline: getComputedStyle(document.querySelector(".ttcsirt-header-menu-toggle")).outlineStyle,
        inner: document.querySelector(".ttcsirt-navigation__inner").getBoundingClientRect().toJSON(),
        header: document.querySelector(".govuk-generic-header__container").getBoundingClientRect().toJSON(),
      }));
      assert.equal(menuPanel.expanded, "true", `${width}px: Menu opens`);
      assert.equal(menuPanel.ariaHidden, "false", `${width}px: open navigation is exposed immediately`);
      assert.equal(menuPanel.inert, false, `${width}px: open navigation is interactive immediately`);
      assert.equal(menuPanel.background, "rgb(255, 255, 255)", `${width}px: white Menu surface`);
      assert.equal(menuPanel.controlBackground, "rgba(0, 0, 0, 0)", `${width}px: expanded Menu has no fill`);
      assert.equal(menuPanel.controlUnderline, "underline", `${width}px: expanded Menu remains indicated`);
      assert.ok(menuPanel.transition.split(",").every((duration) => parseFloat(duration) === 0),
        `${width}px: Menu opens without a transition`);
      assert.ok(menuPanel.innerTransition.split(",").every((duration) => parseFloat(duration) === 0),
        `${width}px: Menu content opens without a transition`);
      assert.equal(menuPanel.pointerFocusVisible, false, `${width}px: pointer activation does not imply keyboard focus`);
      assert.equal(menuPanel.pointerBackground, "rgba(0, 0, 0, 0)", `${width}px: pointer activation adds no awkward fill`);
      assert.equal(menuPanel.pointerOutline, "none", `${width}px: pointer activation adds no focus outline`);
      assert.ok(Math.abs(menuPanel.inner.x - menuPanel.header.x) < 1, `${width}px: Menu aligns to site grid`);
      assert.ok(Math.abs(menuPanel.inner.width - menuPanel.header.width) < 1, `${width}px: Menu matches site grid`);
      await page.keyboard.press("Escape");
      assert.equal(await page.evaluate(() => document.activeElement.classList.contains("ttcsirt-header-menu-toggle")), true,
        `${width}px: Menu Escape returns focus`);

      await page.click(".ttcsirt-header-search-toggle");
      await page.waitForFunction(() =>
        document.activeElement === document.querySelector(".ttcsirt-header-search-input")
      );
      const searchPanel = await page.evaluate(() => ({
        expanded: document.querySelector(".ttcsirt-header-search-toggle").getAttribute("aria-expanded"),
        background: getComputedStyle(document.querySelector(".ttcsirt-header-search-panel")).backgroundColor,
        focus: getComputedStyle(document.querySelector(".ttcsirt-header-search-input")).outlineColor,
        inner: document.querySelector(".ttcsirt-header-search-panel .govuk-width-container").getBoundingClientRect().toJSON(),
        header: document.querySelector(".govuk-generic-header__container").getBoundingClientRect().toJSON(),
      }));
      assert.equal(searchPanel.expanded, "true", `${width}px: Search opens`);
      assert.equal(searchPanel.background, "rgb(255, 255, 255)", `${width}px: white Search surface`);
      assert.equal(searchPanel.focus, "rgb(255, 221, 0)", `${width}px: search input focus`);
      assert.ok(Math.abs(searchPanel.inner.x - searchPanel.header.x) < 1, `${width}px: Search aligns to site grid`);
      assert.ok(Math.abs(searchPanel.inner.width - searchPanel.header.width) < 1, `${width}px: Search matches site grid`);
      await page.keyboard.press("Escape");
      assert.equal(await page.evaluate(() => document.activeElement.classList.contains("ttcsirt-header-search-toggle")), true,
        `${width}px: Search Escape returns focus`);

      await page.click(".government-masthead__authenticity-toggle");
      const authenticityPanel = await page.evaluate(() => {
        const panel = document.querySelector(".government-masthead__authenticity-panel");
        const toggle = document.querySelector(".government-masthead__authenticity-toggle");
        const content = document.querySelector(".government-masthead__authenticity-content");
        return {
          expanded: toggle.getAttribute("aria-expanded"),
          ariaHidden: panel.getAttribute("aria-hidden"),
          inert: panel.inert,
          transition: getComputedStyle(panel).transitionDuration,
          chevronTransition: getComputedStyle(document.querySelector(".government-masthead__authenticity-chevron")).transitionDuration,
          shackleTransition: getComputedStyle(document.querySelector(".government-masthead__lock-shackle")).transitionDuration,
          shackleTransform: getComputedStyle(document.querySelector(".government-masthead__lock-shackle")).transform,
          dividerWidth: getComputedStyle(content).borderTopWidth,
          bandRuleWidth: getComputedStyle(document.querySelector(".government-masthead__government-band")).borderBottomWidth,
        };
      });
      assert.equal(authenticityPanel.expanded, "true", `${width}px: authenticity disclosure opens immediately`);
      assert.equal(authenticityPanel.ariaHidden, "false", `${width}px: open authenticity panel is exposed`);
      assert.equal(authenticityPanel.inert, false, `${width}px: open authenticity panel is interactive`);
      assert.equal(parseFloat(authenticityPanel.transition), 0, `${width}px: authenticity panel has no transition`);
      assert.equal(parseFloat(authenticityPanel.chevronTransition), 0, `${width}px: authenticity chevron has no transition`);
      assert.equal(parseFloat(authenticityPanel.shackleTransition), 0, `${width}px: padlock has no transition`);
      assert.equal(authenticityPanel.shackleTransform, "none", `${width}px: padlock stays in its static position`);
      assert.equal(parseFloat(authenticityPanel.dividerWidth), 0, `${width}px: no duplicate inner rule`);
      assert.equal(parseFloat(authenticityPanel.bandRuleWidth), 1, `${width}px: full-width band divider remains`);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => document.querySelector(".government-masthead__authenticity-panel").inert);
      assert.equal(await page.evaluate(() => document.activeElement.classList.contains("government-masthead__authenticity-toggle")), true,
        `${width}px: authenticity Escape closes and returns focus`);
    }

    const footerStyle = await page.evaluate(() => ({
      background: getComputedStyle(document.querySelector(".ttcsirt-footer")).backgroundColor,
      color: getComputedStyle(document.querySelector(".ttcsirt-footer")).color,
      link: getComputedStyle(document.querySelector(".ttcsirt-footer a")).color,
      coatFilter: getComputedStyle(document.querySelector(".ttcsirt-footer__coat")).filter,
    }));
    assert.equal(footerStyle.background, "rgb(255, 255, 255)", "Footer follows the light masthead surface");
    assert.equal(footerStyle.color, "rgb(11, 12, 12)", "Footer text follows the institutional text colour");
    assert.equal(footerStyle.link, "rgb(29, 112, 184)", "Footer links use the site link colour");
    assert.equal(
      footerStyle.coatFilter,
      "grayscale(1) contrast(1.6) brightness(0.35)",
      "Footer Coat of Arms retains dark monochrome tonal detail"
    );

    await page.setViewport({ width: 375, height: 900 });
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    const menuBoundsBeforeFocus = await page.$eval(".ttcsirt-header-menu-toggle", (element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    });
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("govuk-skip-link")), true,
      "Keyboard sequence begins at the skip link");
    for (const selector of [
      ".govuk-generic-header__homepage-link",
      ".government-masthead__authenticity-toggle",
      ".government-masthead__digital-government-link",
      ".government-masthead__service-link",
      ".ttcsirt-header-menu-toggle",
    ]) {
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate((target) => document.activeElement.matches(target), selector), true,
        `Keyboard focus reaches ${selector}`);
    }

    const menuFocus = await page.$eval(".ttcsirt-header-menu-toggle", (element) => ({
      background: getComputedStyle(element).backgroundColor,
      boxShadow: getComputedStyle(element).boxShadow,
      bounds: (() => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      })(),
    }));
    assert.equal(menuFocus.background, "rgb(255, 221, 0)", "Keyboard focus keeps the required compact GDS yellow state");
    assert.ok(menuFocus.boxShadow.includes("rgb(11, 12, 12)"), "Keyboard focus retains a high-contrast edge");
    assert.deepEqual(menuFocus.bounds, menuBoundsBeforeFocus, "Keyboard focus does not shift layout");

    await page.keyboard.press("Enter");
    assert.equal(await page.$eval(".ttcsirt-header-menu-toggle", (element) => element.getAttribute("aria-expanded")), "true",
      "Keyboard activation exposes the menu immediately");
    const keyboardOpenedPanel = await page.$eval(".ttcsirt-navigation", (element) => ({
      height: element.getBoundingClientRect().height,
      transitionDuration: getComputedStyle(element).transitionDuration,
    }));
    assert.ok(keyboardOpenedPanel.height > 0, "Keyboard activation makes navigation links visible immediately");
    assert.ok(keyboardOpenedPanel.transitionDuration.split(",").every((duration) => parseFloat(duration) === 0),
      "Keyboard activation does not clip links during the visual reveal");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("ttcsirt-header-search-toggle")), true,
      "Search follows Menu in the keyboard sequence");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.matches(".ttcsirt-navigation a")), true,
      "Navigation links follow Search when the menu is open");
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).backgroundColor), "rgb(255, 221, 0)",
      "The first focused navigation link has a visible GDS focus state");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("ttcsirt-header-menu-toggle")), true,
      "Escape from navigation returns focus to Menu");
    await page.waitForFunction(() => document.querySelector(".ttcsirt-navigation").inert);
    assert.equal(await page.$eval(".ttcsirt-navigation", (element) => element.getAttribute("aria-hidden")), "true",
      "Closed navigation is removed from keyboard and assistive technology");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const navigationLinkCount = await page.$$eval(".ttcsirt-navigation a", (links) => links.length);
    for (let index = 0; index < navigationLinkCount; index += 1) {
      await page.keyboard.press("Tab");
    }
    assert.equal(await page.evaluate(() => document.activeElement.closest(".ttcsirt-navigation") === null), true,
      "Keyboard navigation proceeds beyond the menu links without a trap");
    await page.keyboard.press("Escape");

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    const reducedMotionDuration = await page.$eval(".ttcsirt-navigation", (element) =>
      getComputedStyle(element).transitionDuration.split(",").every((duration) => parseFloat(duration) === 0)
    );
    assert.equal(reducedMotionDuration, true, "Reduced motion removes the menu reveal transition");
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval(".ttcsirt-header-menu-toggle", (element) => element.getAttribute("aria-expanded")), "true",
      "Reduced motion preserves immediate Menu activation");
  } finally {
    await browser.close();
  }
});
