// Uso: node render.js <saida-frames> [fps] [só-estes-tempos,separados,por,vírgula]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const out = process.argv[2], fps = +(process.argv[3] || 30), only = process.argv[4];
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/video.html');
  await p.evaluate(() => window.ready);
  const dur = await p.evaluate(() => window.DUR);
  const times = only ? only.split(',').map(Number) : Array.from({ length: Math.round(dur * fps) }, (_, i) => i / fps);
  for (let i = 0; i < times.length; i++) {
    await p.evaluate(t => window.seek(t), times[i]);
    const name = only ? `t_${times[i]}.jpg` : `${String(i).padStart(5, '0')}.jpg`;
    await p.screenshot({ path: `${out}/${name}`, type: 'jpeg', quality: 93 });
  }
  console.log('dur', dur, 'frames', times.length, 'errs', errs);
  await b.close();
})();
