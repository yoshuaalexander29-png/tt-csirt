const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  async function runAudit(viewportName, width, height) {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto('http://localhost:5080', { waitUntil: 'networkidle0' });
    
    const client = await page.target().createCDPSession();
    await client.send('DOM.enable');
    await client.send('CSS.enable');

    const env = await page.evaluate(() => {
      return {
        url: window.location.href,
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        userAgent: navigator.userAgent
      };
    });

    const data = await page.evaluate(() => {
      const els = {
        'Main content H1': document.querySelector('#main-page-heading'),
        'Main introductory paragraph': document.querySelector('#main-page-heading + p'),
        'Role H2': document.querySelector('#role-mandate-heading'),
        'Role paragraph': document.querySelector('#role-mandate-heading + p'),
        'About TT-CSIRT H2': document.querySelector('#about-heading'),
        'About introductory paragraph': document.querySelector('#about-heading + p'),
        'Working with partners H3': document.querySelector('#about-heading ~ h3:nth-of-type(1)'),
        'Working with partners paragraph': document.querySelector('#about-heading ~ h3:nth-of-type(1) + p'),
        'Partner agencies H3': document.querySelector('#about-heading ~ h3:nth-of-type(2)'),
        'Partner agencies UL': document.querySelector('#about-heading ~ h3:nth-of-type(2) + ul'),
        'Key facts H3': document.querySelector('#about-heading ~ h3:nth-of-type(3)'),
        'Key facts DL': document.querySelector('#about-heading ~ h3:nth-of-type(3) + dl'),
        'Overview section': document.querySelector('#overview-and-mandate'),
        'Emergency Support section': document.querySelector('#emergency-support'),
        'Stats section': document.querySelector('#incident-statistics'),
        'Services section': document.querySelector('#services'),
        'About TT-CSIRT section': document.querySelector('#about-tt-csirt')
      };

      const dump = {};
      const rects = {};
      
      for (const [name, el] of Object.entries(els)) {
        if (!el) continue;
        const comp = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        rects[name] = rect;
        
        dump[name] = {
          tagName: el.tagName,
          className: el.className,
          textContent: el.textContent.trim().substring(0, 50).replace(/\n/g, ' '),
          outerHTML: el.outerHTML.substring(0, 150) + '...',
          computed: {
            fontFamily: comp.fontFamily,
            fontSize: comp.fontSize,
            fontWeight: comp.fontWeight,
            lineHeight: comp.lineHeight,
            marginTop: comp.marginTop,
            marginRight: comp.marginRight,
            marginBottom: comp.marginBottom,
            marginLeft: comp.marginLeft,
            paddingTop: comp.paddingTop,
            paddingRight: comp.paddingRight,
            paddingBottom: comp.paddingBottom,
            paddingLeft: comp.paddingLeft,
          },
          rect: {
            x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom
          }
        };
      }
      
      return { dump, rects };
    });

    // We'll also get fonts
    const docNode = await client.send('DOM.getDocument');
    const h1NodeId = await client.send('DOM.querySelector', { nodeId: docNode.root.nodeId, selector: '#main-page-heading' });
    const h1Fonts = h1NodeId.nodeId ? await client.send('CSS.getPlatformFontsForNode', { nodeId: h1NodeId.nodeId }) : null;

    const pNodeId = await client.send('DOM.querySelector', { nodeId: docNode.root.nodeId, selector: '#main-page-heading + p' });
    const pFonts = pNodeId.nodeId ? await client.send('CSS.getPlatformFontsForNode', { nodeId: pNodeId.nodeId }) : null;

    const fonts = await page.evaluate(() => {
      const docFonts = [...document.fonts].map(f => `${f.family} | ${f.weight} | ${f.style} | ${f.status}`);
      const check400 = document.fonts.check('400 1em "GDS Transport"');
      const check700 = document.fonts.check('700 1em "GDS Transport"');
      return { docFonts, check400, check700 };
    });
    
    const hackAudit = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="govuk-!-margin-"], [class*="govuk-!-padding-"]');
      return Array.from(elements).map(el => {
        const hacks = Array.from(el.classList).filter(c => c.includes('govuk-!-margin-') || c.includes('govuk-!-padding-'));
        return {
          tagName: el.tagName,
          id: el.id,
          classes: hacks.join(', ')
        };
      });
    });

    await page.close();
    return { env, ...data, h1Fonts, pFonts, fonts, hackAudit };
  }

  const desktop = await runAudit('DESKTOP', 1024, 768);
  const mobile = await runAudit('MOBILE', 375, 667);

  console.log(JSON.stringify({ desktop, mobile }, null, 2));

  await browser.close();
  process.exit(0);
})();
