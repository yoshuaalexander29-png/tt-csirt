const puppeteer = require('puppeteer');
const fs = require('fs');
const { exec } = require('child_process');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting dev server...");
  const devServer = exec('npm run dev');
  await wait(5000); // wait for dev server

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { width: 375, height: 812, label: '375x812', orientation: 'Portrait' },
    { width: 812, height: 375, label: '812x375', orientation: 'Landscape' },
    { width: 414, height: 896, label: '414x896', orientation: 'Portrait' },
    { width: 896, height: 414, label: '896x414', orientation: 'Landscape' },
    { width: 768, height: 1024, label: '768x1024', orientation: 'Tablet' },
    { width: 1024, height: 768, label: '1024x768', orientation: 'Landscape/tablet' },
    { width: 1280, height: 800, label: '1280x800', orientation: 'Desktop' }
  ];

  const results = {};

  for (const vp of viewports) {
    console.log(`Testing viewport ${vp.width}x${vp.height}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await wait(500);

    const metrics = await page.evaluate(() => {
      // Find the grid container
      const gridRow = document.querySelector('#incident-statistics .govuk-grid-row');
      // Find the last stat block
      const columns = Array.from(gridRow.querySelectorAll('.govuk-grid-column-one-third'));
      const lastColumn = columns[columns.length - 1];
      const lastStatP = lastColumn.querySelector('p');
      
      const heading = document.querySelector('#incident-statistics h3.govuk-heading-m');
      
      const gridRect = gridRow.getBoundingClientRect();
      const lastColRect = lastColumn.getBoundingClientRect();
      const lastPRect = lastStatP.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      
      const gridStyle = window.getComputedStyle(gridRow);
      const lastColStyle = window.getComputedStyle(lastColumn);
      const lastPStyle = window.getComputedStyle(lastStatP);
      const headingStyle = window.getComputedStyle(heading);

      return {
        lastStatElement: {
          tag: lastStatP.tagName,
          className: lastStatP.className,
          bottom: lastPRect.bottom,
          height: lastPRect.height,
          marginTop: lastPStyle.marginTop,
          marginBottom: lastPStyle.marginBottom,
          paddingTop: lastPStyle.paddingTop,
          paddingBottom: lastPStyle.paddingBottom
        },
        lastColumnElement: {
          bottom: lastColRect.bottom,
          height: lastColRect.height,
          marginBottom: lastColStyle.marginBottom
        },
        container: {
          tag: gridRow.tagName,
          className: gridRow.className,
          bottom: gridRect.bottom,
          height: gridRect.height,
          marginTop: gridStyle.marginTop,
          marginBottom: gridStyle.marginBottom,
          paddingTop: gridStyle.paddingTop,
          paddingBottom: gridStyle.paddingBottom,
          display: gridStyle.display,
          flexDirection: gridStyle.flexDirection,
          gridTemplate: gridStyle.gridTemplate,
          gap: gridStyle.gap
        },
        heading: {
          tag: heading.tagName,
          className: heading.className,
          top: headingRect.top,
          bottom: headingRect.bottom,
          marginTop: headingStyle.marginTop,
          marginBottom: headingStyle.marginBottom,
          paddingTop: headingStyle.paddingTop,
          paddingBottom: headingStyle.paddingBottom,
          fontSize: headingStyle.fontSize,
          lineHeight: headingStyle.lineHeight
        },
        effectiveGap: headingRect.top - lastPRect.bottom
      };
    });

    results[vp.label] = { orientation: vp.orientation, metrics };
    
    await page.screenshot({ path: `stats_gap_${vp.width}x${vp.height}.png` });
    await page.close();
  }

  await browser.close();
  devServer.kill();

  fs.writeFileSync('audit_stats_spacing.json', JSON.stringify(results, null, 2));
  console.log("Done.");
}

run().catch(console.error);
