const puppeteer = require('puppeteer');
const fs = require('fs');
const { exec } = require('child_process');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting dev server...");
  const devServer = exec('npm run dev');
  
  await wait(5000); // Wait for dev server to start

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { width: 1440, height: 900 }
  ];

  const modifiers = ['l'];
  const results = {};

  for (const modifier of modifiers) {
    results[modifier] = {};
    for (const vp of viewports) {
      console.log(`Testing modifier --${modifier} at ${vp.width}px`);
      const page = await browser.newPage();
      await page.setViewport(vp);
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      
      // Update all HRs to have the correct modifier
      await page.evaluate((mod) => {
        const hrs = document.querySelectorAll('hr.govuk-section-break');
        hrs.forEach(hr => {
          hr.className = `govuk-section-break govuk-section-break--visible govuk-section-break--${mod}`;
        });
      }, modifier);

      // Wait a bit for layout to settle
      await wait(500);

      await page.screenshot({ path: `screenshot_${modifier}_${vp.width}.png`, fullPage: true });

      // Measure spacing
      const metrics = await page.evaluate(() => {
        const hrs = Array.from(document.querySelectorAll('hr.govuk-section-break'));
        
        return hrs.map((hr, idx) => {
          const prev = hr.previousElementSibling;
          const next = hr.nextElementSibling;
          
          if (!prev || !next) return null;
          
          // Get the actual last rendered block in the previous section
          const prevBlocks = Array.from(prev.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.display !== 'inline';
          });
          const prevLastBlock = prevBlocks.length > 0 ? prevBlocks[prevBlocks.length - 1] : prev;
          
          // Get the actual first rendered block in the next section
          const nextBlocks = Array.from(next.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.display !== 'inline';
          });
          const nextFirstBlock = nextBlocks.length > 0 ? nextBlocks[0] : next;

          const prevStyle = window.getComputedStyle(prev);
          const hrStyle = window.getComputedStyle(hr);
          const nextStyle = window.getComputedStyle(next);

          const prevLastStyle = window.getComputedStyle(prevLastBlock);
          const nextFirstStyle = window.getComputedStyle(nextFirstBlock);

          const prevRect = prev.getBoundingClientRect();
          const prevLastRect = prevLastBlock.getBoundingClientRect();
          const hrRect = hr.getBoundingClientRect();
          const nextRect = next.getBoundingClientRect();
          const nextFirstRect = nextFirstBlock.getBoundingClientRect();

          return {
            index: idx,
            prevId: prev.id,
            nextId: next.id,
            prevBottomMargin: prevStyle.marginBottom,
            prevLastBottomMargin: prevLastStyle.marginBottom,
            hrTopMargin: hrStyle.marginTop,
            hrHeight: hrRect.height,
            hrBottomMargin: hrStyle.marginBottom,
            nextTopMargin: nextStyle.marginTop,
            nextFirstTopMargin: nextFirstStyle.marginTop,
            effectiveSeparation: nextRect.top - prevRect.bottom,
            distancePrevLastToHr: hrRect.top - prevLastRect.bottom,
            distanceHrToNextFirst: nextFirstRect.top - hrRect.bottom
          };
        });
      });

      results[modifier][vp.width] = metrics;
      await page.close();
    }
  }

  await browser.close();
  devServer.kill();

  fs.writeFileSync('audit_section_break_results.json', JSON.stringify(results, null, 2));
  console.log("Done.");
}

run().catch(console.error);
