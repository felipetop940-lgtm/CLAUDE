// Gera um carrossel: PWPATH=$(npm root -g)/playwright node render.js c01-link-na-bio
// → saida/c01-link-na-bio/01.jpg, 02.jpg... + saida/c01-link-na-bio.zip
// Avisa quando algum conteúdo vaza do slide ou encosta no rodapé.
const { chromium } = require(process.env.PWPATH);
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const id = (process.argv[2] || '').replace(/\/$/, '');
if (!id || !fs.existsSync(path.join(__dirname, id, 'carrossel.html'))) { console.error('uso: node render.js <pasta-do-carrossel>'); process.exit(1); }
(async () => {
  const out = path.join(__dirname, 'saida', id);
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + path.join(__dirname, id, 'carrossel.html')); await p.evaluate(() => document.fonts.ready);
  const avisos = await p.evaluate(() => [...document.querySelectorAll('section.s')].flatMap((s, i) => {
    const r = s.getBoundingClientRect(), lim = r.bottom - 140, a = [];
    for (const el of s.querySelectorAll('*')) {
      const st = getComputedStyle(el); if (el.closest('.perfil,.arrasta') || st.position === 'absolute' && el.parentElement === s) continue;
      const e = el.getBoundingClientRect(); if (!e.width || !e.height) continue;
      if (e.right > r.right - 40 || e.left < r.left + 40 || e.bottom > lim) { a.push(`slide ${i + 1}: <${el.tagName.toLowerCase()} class="${el.className}"> passa do limite`); break; }
    }
    return a;
  }));
  const slides = await p.$$('section.s'); let k = 0;
  for (const s of slides) {
    const nome = await s.getAttribute('data-nome') || String(++k).padStart(2, '0'); // variante sai com o próprio nome
    await s.scrollIntoViewIfNeeded();
    await s.screenshot({ path: path.join(out, nome + '.jpg'), type: 'jpeg', quality: 92 });
  }
  await b.close();
  execSync(`cd "${path.join(__dirname, 'saida')}" && rm -f "${id}.zip" && zip -qr "${id}.zip" "${id}"`);
  console.log(`${k} slides em saida/${id}/ + saida/${id}.zip`);
  if (avisos.length) { console.log('AVISOS:\n' + avisos.join('\n')); process.exitCode = 2; }
})();
