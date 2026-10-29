const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  const responses = [];
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/')) {
      const ct = res.headers()['content-type'] || '';
      let body = '';
      try {
        body = await res.text();
      } catch (e) {}
      responses.push({
        method: res.request().method(),
        url,
        status: res.status(),
        contentType: ct,
        bodyPreview: body.slice(0, 150)
      });
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  console.log('1. Dev Login as Approver...');
  await page.goto('http://localhost:3000/publishing/dev-login', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const radio = document.querySelector('input[value="approver-1"]');
    if (radio) radio.click();
  });
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));

  console.log('2. Edit advisory TT-CSIRT-ADV-2026-101...');
  await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr');
    for (const r of rows) {
      if (r.innerText.includes('TT-CSIRT-ADV-2026-101')) {
        const btn = r.querySelector('button');
        btn?.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('3. Step 7: Review & Publish...');
  await page.evaluate(() => {
    const step7 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('7. Review & Publish'));
    step7?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('4. Check validation button...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Check validation'));
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('5. Submit for review button...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Submit for review'));
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('6. Save draft button...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save draft'));
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('7. Secure preview button...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Secure preview'));
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- ALL API RESPONSES ---');
  for (const r of responses) {
    console.log(JSON.stringify(r, null, 2));
  }

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('Contains Unexpected token:', pageText.includes('Unexpected token'));
  if (pageText.includes('Unexpected token')) {
    const errorText = await page.evaluate(() => {
      const el = document.querySelector('.govuk-error-summary') || document.querySelector('[role="alert"]') || document.querySelector('.bg-\\[\\#fff7d6\\]');
      return el ? el.innerText : 'Unknown element';
    });
    console.log('Error banner text:', errorText);
  }

  await browser.close();
})();
