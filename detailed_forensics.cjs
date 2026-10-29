const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 768 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    
    const details = await page.evaluate(() => {
      const getAncestors = (sel) => {
        let el = document.querySelector(sel);
        const chain = [];
        while (el && el !== document.body && el !== document.documentElement) {
          const cs = window.getComputedStyle(el);
          chain.push({
            tag: el.tagName.toLowerCase(),
            className: el.className,
            offsetParent: el.offsetParent ? el.offsetParent.tagName.toLowerCase() + (el.offsetParent.className ? '.' + el.offsetParent.className.split(' ').join('.') : '') : 'null',
            position: cs.position,
            top: cs.top,
            left: cs.left,
            transform: cs.transform,
            display: cs.display,
            overflow: cs.overflow
          });
          el = el.parentElement;
        }
        return chain;
      };

      const getElementDetails = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect().toJSON();
        return {
          rect,
          computed: {
            position: cs.position,
            top: cs.top,
            left: cs.left,
            right: cs.right,
            bottom: cs.bottom,
            transform: cs.transform,
            display: cs.display,
            flexDirection: cs.flexDirection,
            flexWrap: cs.flexWrap,
            flexGrow: cs.flexGrow,
            width: cs.width,
            maxWidth: cs.maxWidth,
            height: cs.height,
            marginTop: cs.marginTop,
            marginBottom: cs.marginBottom,
            paddingTop: cs.paddingTop,
            paddingBottom: cs.paddingBottom,
            paddingLeft: cs.paddingLeft,
            paddingRight: cs.paddingRight,
            borderTopWidth: cs.borderTopWidth,
            borderTopStyle: cs.borderTopStyle,
            borderTopColor: cs.borderTopColor,
            borderBottomWidth: cs.borderBottomWidth,
            borderBottomStyle: cs.borderBottomStyle,
            borderBottomColor: cs.borderBottomColor,
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight
          }
        };
      };

      return {
        containingBlocks: {
          coat: getAncestors('.government-masthead__coat'),
          serviceName: getAncestors('.govuk-service-navigation__service-name'),
          search: getAncestors('.govuk-service-navigation__search')
        },
        elements: {
          header: getElementDetails('.govuk-header'),
          headerContainer: getElementDetails('.govuk-header__container'),
          coat: getElementDetails('.government-masthead__coat'),
          serviceNav: getElementDetails('.govuk-service-navigation'),
          serviceNavWidthContainer: getElementDetails('.govuk-service-navigation .govuk-width-container'),
          serviceNavContainer: getElementDetails('.govuk-service-navigation__container'),
          serviceName: getElementDetails('.govuk-service-navigation__service-name'),
          navWrapper: getElementDetails('.govuk-service-navigation__wrapper'),
          activeItem: getElementDetails('.govuk-service-navigation__item--active'),
          search: getElementDetails('.govuk-service-navigation__search'),
          searchInput: getElementDetails('.app-site-search__input')
        }
      };
    });

    console.log(JSON.stringify(details, null, 2));
    await browser.close();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
