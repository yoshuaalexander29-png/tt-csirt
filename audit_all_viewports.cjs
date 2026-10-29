const puppeteer = require('puppeteer');

const viewports = [
  { name: '320 (Mobile Portrait XS)', width: 320, height: 568 },
  { name: '375 (Mobile Portrait SM)', width: 375, height: 667 },
  { name: '414 (Mobile Portrait MD)', width: 414, height: 896 },
  { name: '640 (Mobile/Tablet Boundary)', width: 640, height: 900 },
  { name: '768 (Tablet Portrait)', width: 768, height: 1024 },
  { name: '1024 (Desktop Standard)', width: 1024, height: 768 },
  { name: '1280 (Desktop Wide)', width: 1280, height: 800 },
  { name: '667x375 (Mobile Landscape iPhone 8)', width: 667, height: 375 },
  { name: '844x390 (Mobile Landscape iPhone 12/13/14)', width: 844, height: 390 },
  { name: '896x414 (Mobile Landscape iPhone 11/XR)', width: 896, height: 414 }
];

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log("=== COMPREHENSIVE VIEWPORT AUDIT ===");

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
      
      const result = await page.evaluate((vpName) => {
        const getRect = (sel) => {
          const el = document.querySelector(sel);
          return el ? el.getBoundingClientRect().toJSON() : null;
        };

        const getStyle = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const cs = window.getComputedStyle(el);
          return {
            position: cs.position,
            top: cs.top,
            left: cs.left,
            right: cs.right,
            bottom: cs.bottom,
            transform: cs.transform,
            display: cs.display,
            flexDirection: cs.flexDirection,
            flexWrap: cs.flexWrap,
            width: cs.width,
            height: cs.height,
            marginTop: cs.marginTop,
            marginBottom: cs.marginBottom,
            paddingTop: cs.paddingTop,
            paddingBottom: cs.paddingBottom,
            borderTopWidth: cs.borderTopWidth,
            borderTopStyle: cs.borderTopStyle,
            borderTopColor: cs.borderTopColor,
            borderBottomWidth: cs.borderBottomWidth,
            borderBottomStyle: cs.borderBottomStyle,
            borderBottomColor: cs.borderBottomColor,
            fontSize: cs.fontSize,
            lineHeight: cs.lineHeight,
            fontWeight: cs.fontWeight
          };
        };

        const getAncestors = (sel) => {
          let el = document.querySelector(sel);
          const chain = [];
          while (el && el !== document.body && el !== document.documentElement) {
            const cs = window.getComputedStyle(el);
            chain.push({
              tag: el.tagName.toLowerCase(),
              className: el.className,
              offsetParent: el.offsetParent ? el.offsetParent.tagName.toLowerCase() + (el.offsetParent.className ? '.' + el.offsetParent.className.split(' ').join('.') : '') : null,
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

        const header = getRect('.govuk-header');
        const headerContainer = getRect('.govuk-header__container');
        const coat = getRect('.government-masthead__coat');
        const lockup = getRect('.government-lockup');
        const serviceNav = getRect('.govuk-service-navigation');
        const serviceNavWidthContainer = getRect('.govuk-service-navigation .govuk-width-container');
        const serviceNavContainer = getRect('.govuk-service-navigation__container');
        const serviceName = getRect('.govuk-service-navigation__service-name');
        const navWrapper = getRect('.govuk-service-navigation__wrapper');
        const menuToggle = getRect('.govuk-service-navigation__toggle');
        const search = getRect('.govuk-service-navigation__search');
        const searchInput = getRect('.app-site-search__input');

        return {
          viewport: vpName,
          elements: {
            header,
            headerContainer,
            coat,
            lockup,
            serviceNav,
            serviceNavWidthContainer,
            serviceNavContainer,
            serviceName,
            navWrapper,
            menuToggle,
            search,
            searchInput
          },
          styles: {
            header: getStyle('.govuk-header'),
            serviceNav: getStyle('.govuk-service-navigation'),
            serviceNavWidthContainer: getStyle('.govuk-service-navigation .govuk-width-container'),
            serviceNavContainer: getStyle('.govuk-service-navigation__container'),
            serviceName: getStyle('.govuk-service-navigation__service-name'),
            search: getStyle('.govuk-service-navigation__search'),
            searchInput: getStyle('.app-site-search__input'),
            coat: getStyle('.government-masthead__coat')
          },
          containingBlocks: {
            coat: getAncestors('.government-masthead__coat'),
            serviceName: getAncestors('.govuk-service-navigation__service-name'),
            search: getAncestors('.govuk-service-navigation__search')
          },
          alignmentDifferences: {
            headerContainerLeft_vs_serviceNavContainerLeft: (headerContainer ? headerContainer.left : 0) - (serviceNavContainer ? serviceNavContainer.left : 0),
            headerContainerRight_vs_serviceNavContainerRight: (headerContainer ? headerContainer.right : 0) - (serviceNavContainer ? serviceNavContainer.right : 0),
            serviceNameLeft_vs_serviceNavContainerLeft: (serviceName ? serviceName.left : 0) - (serviceNavContainer ? serviceNavContainer.left : 0),
            searchRight_vs_serviceNavContainerRight: (search ? search.right : 0) - (serviceNavContainer ? serviceNavContainer.right : 0)
          }
        };
      }, vp.name);

      console.log(`\n---------------- ${vp.name} ----------------`);
      console.log(`Header Rect: top=${result.elements.header.top}, bottom=${result.elements.header.bottom}, height=${result.elements.header.height}, left=${result.elements.header.left}, right=${result.elements.header.right}`);
      console.log(`Header Container Rect: left=${result.elements.headerContainer.left}, right=${result.elements.headerContainer.right}, width=${result.elements.headerContainer.width}`);
      console.log(`Coat Rect: top=${result.elements.coat.top}, left=${result.elements.coat.left}, width=${result.elements.coat.width}, height=${result.elements.coat.height}`);
      console.log(`Service Nav Rect: top=${result.elements.serviceNav.top}, bottom=${result.elements.serviceNav.bottom}, height=${result.elements.serviceNav.height}, left=${result.elements.serviceNav.left}, right=${result.elements.serviceNav.right}`);
      console.log(`Service Nav Container Rect: left=${result.elements.serviceNavContainer.left}, right=${result.elements.serviceNavContainer.right}, width=${result.elements.serviceNavContainer.width}`);
      console.log(`Service Name Rect: top=${result.elements.serviceName.top}, left=${result.elements.serviceName.left}, width=${result.elements.serviceName.width}, height=${result.elements.serviceName.height}`);
      console.log(`Search Rect: top=${result.elements.search.top}, bottom=${result.elements.search.bottom}, left=${result.elements.search.left}, right=${result.elements.search.right}, width=${result.elements.search.width}`);
      console.log(`Alignment Diff Header/Nav Container Left: ${result.alignmentDifferences.headerContainerLeft_vs_serviceNavContainerLeft}px`);
      console.log(`Alignment Diff Header/Nav Container Right: ${result.alignmentDifferences.headerContainerRight_vs_serviceNavContainerRight}px`);
      console.log(`Alignment Diff ServiceName vs Container Left: ${result.alignmentDifferences.serviceNameLeft_vs_serviceNavContainerLeft}px`);
      console.log(`Alignment Diff Search vs Container Right: ${result.alignmentDifferences.searchRight_vs_serviceNavContainerRight}px`);
    }

    await browser.close();
  } catch (err) {
    console.error("Audit error:", err);
    process.exit(1);
  }
})();
