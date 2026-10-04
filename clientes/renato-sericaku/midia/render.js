// Gera as artes de portfólio: PWPATH=$(npm root -g)/playwright node render.js
const { chromium } = require(process.env.PWPATH); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(__dirname, 'artes.html')); await p.evaluate(() => document.fonts.ready);
  for (const s of await p.$$('section.a')) { const n = await s.getAttribute('data-n'); await s.scrollIntoViewIfNeeded();
    await s.screenshot({ path: path.join(__dirname, 'portfolio-renato-' + n + '.jpg'), type: 'jpeg', quality: 92 }); }
  await b.close(); })();
