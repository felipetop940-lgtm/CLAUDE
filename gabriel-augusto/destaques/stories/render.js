// Gera as artes: PWPATH=$(npm root -g)/playwright node render.js
const { chromium } = require(process.env.PWPATH);
const fs = require('fs'), path = require('path');
(async () => {
  const out = path.join(__dirname, 'saida'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(__dirname, 'stories.html')); await p.evaluate(() => document.fonts.ready);
  for (const s of await p.$$('section.s')) {
    const n = await s.getAttribute('data-n'); await s.scrollIntoViewIfNeeded();
    await s.screenshot({ path: path.join(out, n + '.jpg'), type: 'jpeg', quality: 92 });
  }
  await b.close();
})();
