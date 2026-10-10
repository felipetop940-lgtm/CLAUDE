// node render2.js <saida> <de> <até>  (índices de frame, 30 fps)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [out, a, b] = [process.argv[2], +process.argv[3], +process.argv[4]];
  fs.mkdirSync(out, { recursive: true });
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/video.html');
  await p.evaluate(() => window.ready);
  const n = Math.round(await p.evaluate(() => window.DUR) * 30);
  for (let i = a; i < Math.min(b, n); i++) {
    await p.evaluate(t => window.seek(t), i / 30);
    await p.screenshot({ path: `${out}/${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
  }
  console.log('ok', a, b, n, errs);
  await br.close();
})();
