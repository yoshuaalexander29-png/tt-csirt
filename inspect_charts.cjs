const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://ttcsirt.gov.tt/statistics/', { waitUntil: 'networkidle2' });
  
  const content = await page.evaluate(() => {
    // Check for common chart container classes or elements
    const svgElements = document.querySelectorAll('svg').length;
    const canvasElements = document.querySelectorAll('canvas').length;
    const highcharts = document.querySelectorAll('.highcharts-container').length;
    const wpDataChart = document.querySelectorAll('.wpDataChart').length;
    const chartIds = Array.from(document.querySelectorAll('[id*="chart"]')).map(el => el.id);
    
    return { svgElements, canvasElements, highcharts, wpDataChart, chartIds };
  });
  
  console.log(content);
  await browser.close();
})();
