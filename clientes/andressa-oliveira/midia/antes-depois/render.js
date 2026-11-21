// Gera as artes de antes/depois (1080x1350, feed do Instagram e site).
// Uso: node render.js   → saida/*.jpg e ../../assets/img/resultados/*.webp
// Fotos em fotos/<par>-antes.jpg e fotos/<par>-depois.jpg (rostos já desfocados).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const R = p => path.join(__dirname, p);
const b64 = (p, mime) => `data:${mime};base64,` + fs.readFileSync(R(p)).toString('base64');

const PARES = [
  { id: 'a', tema: 'escuro' },
  { id: 'b', tema: 'claro' },
  { id: 'c', tema: 'escuro' },
];
const assinatura = 'Nutrologia'; // troque pelo @ do Instagram quando tiver, ex.: '@draandressaoliveira'

const fonts = `
@font-face{font-family:Jost;src:url(${b64('../../assets/fonts/jost-latin-wght-normal.woff2','font/woff2')});font-weight:100 900}
@font-face{font-family:Corm;src:url(${b64('../../assets/fonts/eb-garamond-latin-400-normal.woff2','font/woff2')});font-weight:500}
@font-face{font-family:Corm;src:url(${b64('../../assets/fonts/eb-garamond-latin-400-italic.woff2','font/woff2')});font-weight:500;font-style:italic}`;
const mono = b64('../../assets/img/logo/mono.png', 'image/png');
const words = b64('../../assets/img/logo/words.png', 'image/png');
const avatar = b64('../../assets/img/andressa-avatar.webp', 'image/webp');
const GOLD = 'linear-gradient(115deg,#7B6043 0%,#B69971 26%,#E9D098 48%,#C9AA78 62%,#8A6A42 100%)';

function html({ id, tema }) {
  const dark = tema === 'escuro';
  const c = dark
    ? { bg: 'radial-gradient(90% 70% at 50% 30%,#3D281C 0%,#2A1B13 60%,#1C120C 100%)', ink: '#F3EADF', sub: 'rgba(243,234,223,.55)', line: 'rgba(233,208,152,.22)', frame: 'rgba(233,208,152,.16)', label: '#E9D098', note: 'rgba(243,234,223,.38)' }
    : { bg: 'radial-gradient(90% 70% at 50% 30%,#FBF7F1 0%,#F1E8DC 65%,#E6DACA 100%)', ink: '#2A1B13', sub: 'rgba(42,27,19,.55)', line: 'rgba(148,114,63,.3)', frame: 'rgba(148,114,63,.22)', label: '#94723F', note: 'rgba(42,27,19,.42)' };
  const logoBg = dark ? GOLD : 'linear-gradient(115deg,#6B5038,#94723F 45%,#B69971 55%,#6B5038)';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:${c.bg};font-family:Jost;color:${c.ink};position:relative}
.frame{position:absolute;inset:26px;border:1px solid ${c.frame};border-radius:30px}
.head{position:absolute;top:74px;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:22px}
.av{width:92px;height:92px;border-radius:50%;padding:3px;background:${GOLD}}
.av img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;border:3px solid ${dark ? '#2A1B13' : '#F6F0E7'}}
.name{font:400 42px/1 Corm;letter-spacing:.01em}
.sub{margin-top:10px;font:500 15px/1 Jost;letter-spacing:.38em;text-transform:uppercase;color:${c.label}}
.labels{position:absolute;top:226px;left:60px;right:60px;display:flex;justify-content:space-between}
.labels span{width:468px;text-align:center;font:italic 400 54px/1 Corm;color:${c.ink}}
.photos{position:absolute;top:306px;left:60px;right:60px;display:flex;gap:24px}
.ph{width:468px;height:720px;border-radius:22px;overflow:hidden;position:relative;box-shadow:0 30px 60px -30px rgba(0,0,0,${dark ? '.8' : '.45'})}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph::after{content:"";position:absolute;inset:0;border-radius:22px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.mid{position:absolute;left:50%;top:${306 + 360}px;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:${dark ? '#2A1B13' : '#F6F0E7'};display:grid;place-items:center;box-shadow:0 0 0 1px ${c.line},0 10px 24px -8px rgba(0,0,0,.5)}
.mid svg{width:26px;height:26px;fill:none;stroke:${c.label};stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.foot{position:absolute;left:0;right:0;top:1080px;display:flex;flex-direction:column;align-items:center}
.mask{background:${logoBg};-webkit-mask:var(--m) center/contain no-repeat}
.mono{width:132px;aspect-ratio:424/284;--m:url(${mono})}
.words{width:420px;aspect-ratio:1264/163;margin-top:22px;--m:url(${words})}
.note{position:absolute;bottom:52px;left:0;right:0;text-align:center;font:400 14px/1 Jost;letter-spacing:.06em;color:${c.note}}
.rule{position:absolute;top:1046px;left:50%;width:240px;margin-left:-120px;height:1px;background:linear-gradient(90deg,transparent,${c.line},transparent)}
</style></head><body>
<div class="frame"></div>
<div class="head"><div class="av"><img src="${avatar}"></div><div><div class="name">Dra. Andressa Oliveira</div><div class="sub">${assinatura}</div></div></div>
<div class="labels"><span>antes</span><span>depois</span></div>
<div class="photos"><div class="ph"><img src="${b64(`fotos/${id}-antes.jpg`, 'image/jpeg')}"></div><div class="ph"><img src="${b64(`fotos/${id}-depois.jpg`, 'image/jpeg')}"></div></div>
<div class="mid"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
<div class="rule"></div>
<div class="foot"><div class="mask mono"></div><div class="mask words"></div></div>
<div class="note">Resultados variam de pessoa para pessoa.</div>
</body></html>`;
}

(async () => {
  fs.mkdirSync(R('saida'), { recursive: true });
  const site = R('../../assets/img/resultados');
  fs.mkdirSync(site, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const par of PARES) {
    await p.setContent(html(par), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const out = R(`saida/antes-depois-${par.id}.jpg`);
    await p.screenshot({ path: out, type: 'jpeg', quality: 92 });
    console.log(out);
  }
  await b.close();
})();
