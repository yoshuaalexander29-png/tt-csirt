const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

let serverProcess;

async function run() {
  serverProcess = spawn('node', ['server.js'], { stdio: 'pipe' });
  serverProcess.stdout.on('data', d => console.log('SERVER:', d.toString().trim()));
  serverProcess.stderr.on('data', d => console.error('SERVER ERR:', d.toString().trim()));
  
  await new Promise(r => setTimeout(r, 2000));
  
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('http://localhost:3000/');
    await new Promise(r => setTimeout(r, 2000));
    
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
    serverProcess.kill();
  }
}
run();
