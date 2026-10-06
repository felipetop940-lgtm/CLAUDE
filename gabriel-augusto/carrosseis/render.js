// Gera um carrossel: PWPATH=$(npm root -g)/playwright node render.js c01-link-na-bio  (+ --tiktok pra versão 9:16)
// → saida/c01-link-na-bio/01.jpg, 02.jpg... + saida/c01-link-na-bio.zip
// Avisa quando algum conteúdo vaza do slide ou encosta no rodapé.
const { chromium } = require(process.env.PWPATH);
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const id = (process.argv[2] || '').replace(/\/$/, '');
const TT = process.argv.includes('--tiktok'); // versão 9:16 pro TikTok
if (!id || !fs.existsSync(path.join(__dirname, id, 'carrossel.html'))) { console.error('uso: node render.js <pasta-do-carrossel>'); process.exit(1); }
(async () => {
  const out = path.join(__dirname, 'saida', id + (TT ? '-tiktok' : ''));
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: TT ? 1920 : 1350 } });
  await p.goto('file://' + path.join(__dirname, id, 'carrossel.html')); if (TT) await p.evaluate(() => document.documentElement.classList.add('tt'));
  await p.evaluate(() => document.fonts.ready);
  const SEL = TT ? 'section.s:not(.so-ig)' : 'section.s:not(.so-tt)';
  const avisos = await p.evaluate(([SEL, TT]) => [...document.querySelectorAll(SEL)].flatMap((s, i) => {
    const r = s.getBoundingClientRect(), lim = r.bottom - (TT ? 520 : 140), dir = TT ? 150 : 40, a = [];
    for (const el of s.querySelectorAll('*')) {
      const st = getComputedStyle(el); if (el.closest('.perfil,.arrasta') || st.position === 'absolute' && el.parentElement === s) continue;
      const e = el.getBoundingClientRect(); if (!e.width || !e.height) continue;
      if (e.right > r.right - dir || e.left < r.left + 40 || e.bottom > lim) { a.push(`slide ${i + 1}: <${el.tagName.toLowerCase()} class="${el.className}"> passa do limite`); break; }
    }
    return a;
  }), [SEL, TT]);
  const slides = await p.$$(SEL); let k = 0;
  for (const s of slides) {
    const nome = await s.getAttribute('data-nome') || String(++k).padStart(2, '0'); // variante sai com o próprio nome
    await s.scrollIntoViewIfNeeded();
    await s.screenshot({ path: path.join(out, nome + '.jpg'), type: 'jpeg', quality: 92 });
  }
  await b.close();
  const nm = path.basename(out);
  execSync(`cd "${path.join(__dirname, 'saida')}" && rm -f "${nm}.zip" && zip -qr "${nm}.zip" "${nm}"`);
  console.log(`${k} slides em saida/${nm}/ + saida/${nm}.zip`);
  if (avisos.length) { console.log('AVISOS:\n' + avisos.join('\n')); process.exitCode = 2; }
})();
