// Logo animado → mp4 com som. Uso: PWPATH=$(npm root -g)/playwright node render.js [larg alt nome]
// Padrão: 1080x1920 (story/reels) e 1080x1080 (feed). O som é sintetizado em som.py.
const { chromium } = require(process.env.PWPATH);
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const FPS = 30, html = path.join(__dirname, 'animado.html'), out = path.join(__dirname, 'saida');
const formatos = process.argv[2] ? [[+process.argv[2], +process.argv[3], process.argv[4]]] : [[1080, 1920, 'logo-animado-story'], [1080, 1080, 'logo-animado-feed']];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  execSync(`python3 "${path.join(__dirname, 'som.py')}" "${out}/logo-som.wav"`);
  const b = await chromium.launch();
  for (const [w, h, nome] of formatos) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('file://' + html); await p.evaluate(() => document.fonts.ready);
    const dur = await p.evaluate(() => window.DUR), F = Math.round(dur * FPS), tmp = fs.mkdtempSync('/tmp/logo_');
    for (let f = 0; f < F; f++) { await p.evaluate(t => render(t), f / FPS); await p.screenshot({ path: `${tmp}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 94 }); }
    if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
    execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${tmp}/f%04d.jpg -i "${out}/logo-som.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "${out}/${nome}.mp4"`);
    fs.copyFileSync(`${tmp}/f${String(F - 1).padStart(4, '0')}.jpg`, `${out}/${nome}.jpg`);
    fs.rmSync(tmp, { recursive: true, force: true }); await p.close(); console.log(`ok: saida/${nome}.mp4`);
  }
  await b.close();
})();
