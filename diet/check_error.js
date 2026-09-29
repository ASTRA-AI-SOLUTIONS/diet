const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', exception => {
    errors.push(exception.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  console.log("ERRORS:", errors);
  await browser.close();
})();
