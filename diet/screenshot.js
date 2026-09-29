import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to a nice desktop size
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  
  // Wait for React rendering
  await new Promise(r => setTimeout(r, 1000));
  
  // Login
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if(inputs.length > 0) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      if (inputs[0]) {
        nativeInputValueSetter.call(inputs[0], "test@test.com");
        inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (inputs[1]) {
        nativeInputValueSetter.call(inputs[1], "123456");
        inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      }
      const btn = document.querySelector('form button');
      if(btn) btn.click();
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Setup if needed
  await page.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Launch Dashboard'));
    if(submitBtn) submitBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Take screenshot
  await page.screenshot({ path: '/Users/ikshitjoshi/.gemini/antigravity/brain/401dd640-b276-4aeb-b138-ee10dc2b3189/dashboard.png' });
  
  await browser.close();
  console.log("Screenshot saved!");
})();
