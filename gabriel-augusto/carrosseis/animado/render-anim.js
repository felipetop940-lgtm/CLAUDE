// Carrossel ANIMADO (motion graphics): cada slide vira um vídeo curto 1080x1350 (ou 1440) que termina parado no quadro final.
// Uso: PWPATH=$(npm root -g)/playwright node animado/render-anim.js c23-dolar-preco
// A pasta tem anim.html com window.SLIDES = [{dur, render(t) → html}] e window.ALTURA (1350 padrão).
// Saída: saida/<pasta>/01.mp4, 02.mp4... + 01.jpg (capa de cada slide) + saida/<pasta>.zip
const { chromium } = require(process.env.PWPATH);
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), id = (process.argv[2] || '').replace(/\/$/, ''), FPS = 30;
const so = process.argv[3] ? process.argv[3].split(',').map(Number) : null;   // renderizar só alguns slides (1,3)
const html = path.join(ROOT, id, 'anim.html');
if (!id || !fs.existsSync(html)) { console.error('uso: node animado/render-anim.js <pasta>'); process.exit(1); }
const ff = execSync('python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"').toString().trim();
(async () => {
  const out = path.join(ROOT, 'saida', id); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1440 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + html); await p.evaluate(() => document.fonts.ready);
  const H = await p.evaluate(() => window.ALTURA || 1350); await p.setViewportSize({ width: 1080, height: H });
  const N = await p.evaluate(() => window.SLIDES.length);
  for (let s = 0; s < N; s++) {
    if (so && !so.includes(s + 1)) continue;
    const dur = await p.evaluate(i => window.SLIDES[i].dur, s), nome = String(s + 1).padStart(2, '0');
    const tmp = fs.mkdtempSync('/tmp/anim_'); const F = Math.round(dur * FPS);
    for (let f = 0; f < F; f++) { await p.evaluate(([i, t]) => window.mostrar(i, t), [s, f / FPS]); await p.screenshot({ path: `${tmp}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
    execSync(`"${ff}" -y -loglevel error -framerate ${FPS} -i ${tmp}/f%04d.jpg -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart "${out}/${nome}.mp4"`);
    fs.copyFileSync(`${tmp}/f${String(F - 1).padStart(4, '0')}.jpg`, `${out}/${nome}.jpg`);
    fs.rmSync(tmp, { recursive: true, force: true }); console.log(`slide ${nome}: ${dur}s`);
  }
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  execSync(`cd "${path.join(ROOT, 'saida')}" && rm -f "${id}.zip" && zip -qr "${id}.zip" "${id}"`);
  console.log(`ok: saida/${id}/ + saida/${id}.zip`);
})();
