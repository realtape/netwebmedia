const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8083/docs/client-onboarding-guide-law-firms/index.html', { waitUntil: 'networkidle2', timeout: 30000 });
  const stats = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.innerText.slice(0, 100),
    sections: document.querySelectorAll('section[id]').length,
    shots: document.querySelectorAll('.shot img').length,
    modules: document.querySelectorAll('.module').length,
    newModules: document.querySelectorAll('.pill.new').length,
  }));
  console.log(JSON.stringify(stats, null, 2));
  await page.evaluate(() => document.getElementById('cms')?.scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'docs/client-onboarding-guide-law-firms/_verify-cms.png', fullPage: false });
  await browser.close();
})();
