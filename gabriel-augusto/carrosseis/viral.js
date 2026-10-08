// Modelo viral: coloca @ no topo, "ARRASTA →" no rodapé e desenha os bonecos stickman BRANCOS
// (mesmas poses do motor dos vídeos). Uso: <div class="boneco" data-pose="chocado" data-emo="interrogacao" data-h="520"></div>
// Poses: parado, pensando, acenando, comemorando, triste, chocado, celular, confiante, apontando, ideia, cintura, dancando
// Emoções: interrogacao (!? + tremidinha), exclamacao (! !), tremendo (só as linhas), nenhuma
const ARROBA = '@euaugusto_oliv';
const POSES = {
  parado: { h: 0, t: 0, a: [13, 0], b: [13, 0], p: [5, 0], q: [5, 0] },
  pensando: { h: 8, t: 2, a: [6, 0], b: [60, 150], p: [5, 0], q: [5, 0] },
  acenando: { h: -4, t: -2, a: [6, 0], b: [140, 25], p: [5, 0], q: [5, 0] },
  dancando: { h: -8, t: -5, a: [95, -40], b: [150, 12], p: [10, 0], q: [36, 55] },
  comemorando: { h: -10, t: 0, a: [150, 10], b: [150, 10], p: [15, 0], q: [15, 0] },
  triste: { h: 34, t: 6, a: [3, -4], b: [3, -4], p: [4, -5], q: [4, -5] },
  chocado: { h: -6, t: 0, a: [100, 105], b: [100, 105], p: [13, 0], q: [13, 0] },
  celular: { h: 26, t: 4, a: [10, -138], b: [10, -138], p: [5, 0], q: [5, 0] },
  confiante: { h: -6, t: 0, a: [26, -122], b: [26, -116], p: [11, 0], q: [11, 0] },
  apontando: { h: -6, t: -3, a: [8, 0], b: [90, -4], p: [9, 0], q: [9, 0] },
  ideia: { h: -10, t: -2, a: [12, 0], b: [158, 16], p: [5, 0], q: [5, 0] },
  cintura: { h: -6, t: 0, a: [40, -68], b: [40, -68], p: [13, 0], q: [13, 0] },
  empurrando: { h: 10, t: 18, a: [-80, -5], b: [80, 5], p: [-8, -6], q: [34, 30] },
};
function limb(x, y, a1, a2, l1, l2) {
  const r1 = a1 * Math.PI / 180, r2 = (a1 + a2) * Math.PI / 180;
  const x1 = x + Math.sin(r1) * l1, y1 = y + Math.cos(r1) * l1, x2 = x1 + Math.sin(r2) * l2, y2 = y1 + Math.cos(r2) * l2;
  return { d: `M${x} ${y} L${x1} ${y1} L${x2} ${y2}`, x2, y2 };
}
function boneco(pose, emo) {
  const P = POSES[pose] || POSES.parado, cx = 300, base = 700, L = 108, W = 44, HR = 58, gap = 10, col = '#F5F6F8';
  const hipY = base - 2 * L, tr = P.t * Math.PI / 180;
  const nx = cx + Math.sin(tr) * 1.42 * L, ny = hipY - Math.cos(tr) * 1.42 * L, hr = (P.t + P.h) * Math.PI / 180;
  const hx = nx + Math.sin(hr) * (HR + gap + W * .2), hy = ny - Math.cos(hr) * (HR + gap + W * .2), sh = ny + W * .35;
  const A = limb(nx - W * .25, sh, -P.a[0], -P.a[1], .9 * L, .82 * L), B = limb(nx + W * .25, sh, P.b[0], P.b[1], .9 * L, .82 * L);
  const Lp = limb(cx - W * .28, hipY, -P.p[0], -P.p[1], L, L), Lq = limb(cx + W * .28, hipY, P.q[0], P.q[1], L, L);
  let extra = '';
  if (pose === 'celular') { const px = (A.x2 + B.x2) / 2, py = (A.y2 + B.y2) / 2 - 14;
    extra = `<rect x="${px - 36}" y="${py - 62}" width="72" height="124" rx="14" fill="#0B0D11" stroke="#E8C474" stroke-width="7"/><rect x="${px - 26}" y="${py - 50}" width="52" height="92" rx="6" fill="#E8C474" opacity=".45"/>`; }
  const linhas = (x, y, dir) => [0, 1, 2].map(i => `<line x1="${x}" y1="${y + i * 22}" x2="${x + dir * (64 - i * 14)}" y2="${y + i * 22}" stroke="#F5F6F8" stroke-width="7" stroke-linecap="round" opacity=".85"/>`).join('');
  let e = '';
  if (emo === 'interrogacao' || emo === 'tremendo') e += linhas(hx - HR - 40, hy - 26, -1) + linhas(hx + HR + 40, hy - 26, 1);
  if (emo === 'interrogacao') e += `<text x="${hx - 46}" y="${hy - HR - 34}" font-family="Anton" font-size="120" fill="#FF3B3B" transform="rotate(-8 ${hx} ${hy - HR})">!?</text>`;
  if (emo === 'exclamacao') e += `<text x="${hx + 92}" y="${hy - 20}" font-family="Anton" font-size="150" fill="#FF3B3B">!</text><text x="${hx - 150}" y="${hy - 40}" font-family="Anton" font-size="110" fill="#FF3B3B" transform="rotate(-14 ${hx - 130} ${hy - 80})">!</text>`;
  return `<svg viewBox="0 0 600 740" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${cx}" cy="${base + 8}" rx="120" ry="14" fill="rgba(0,0,0,.55)"/>
    <g stroke="${col}" stroke-linecap="round" stroke-linejoin="round" fill="none" style="filter:drop-shadow(0 10px 18px rgba(0,0,0,.7))">
      <path d="${Lp.d}" stroke-width="${W}"/><path d="${Lq.d}" stroke-width="${W}"/>
      <path d="M${cx} ${hipY - W * .1} L${nx} ${ny + W * .45}" stroke-width="${W * 1.25}"/>
      <path d="${A.d}" stroke-width="${W * .92}"/><path d="${B.d}" stroke-width="${W * .92}"/>
      <circle cx="${hx}" cy="${hy}" r="${HR}" fill="${col}" stroke="none"/>
    </g>${extra}${e}</svg>`;
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.boneco').forEach(b => {
    b.innerHTML = boneco(b.dataset.pose, b.dataset.emo);
    const h = +(b.dataset.h || 460); b.querySelector('svg').style.height = h + 'px'; b.querySelector('svg').style.width = (h * 600 / 740) + 'px';
  });
  document.querySelectorAll('section.s').forEach(s => {
    s.insertAdjacentHTML('afterbegin', `<div class="arroba">${ARROBA}</div>`);
    if (!s.classList.contains('fim')) s.insertAdjacentHTML('beforeend', '<div class="arrasta">Arrasta <i>→</i></div>');
  });
});
