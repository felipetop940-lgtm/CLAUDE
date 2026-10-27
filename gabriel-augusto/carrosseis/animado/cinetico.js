/* KIT CINÉTICO pras artes animadas (pedido dele em 27/10: "usa esse novo modelo de vídeo também nas artes com animação").
   Mesma linguagem do motor-cinetico.html dos vídeos: fundo alternando preto/vermelho (troca com círculo abrindo), texto gigante
   em Anton entrando em pedaços com animações diferentes (zoom, mask, up, pop, left, drop, letras), destaque em vermelho no preto
   (ou preto no vermelho) com linha embaixo, gráficos em card de vidro. Diferença do vídeo: aqui não tem voz, então as linhas
   do título FICAM na tela (empilhadas) pra dar tempo de ler, e o último quadro vira a capa do slide.
   Uso no anim.html: <script src="../animado/cinetico.js"></script> e depois K.fundo(), K.topo(), K.kin(), K.corpo(), K.vidro()... */
(() => {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), ease = x => 1 - Math.pow(1 - clamp(x), 3);
  const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const back = x => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, k) => a + (b - a) * k, fmt = (v, d = 2) => v.toFixed(d).replace('.', ',');
  const FUNDO = { black: 'radial-gradient(ellipse at 50% 45%, #17171B 0%, #060607 62%, #000 100%)', red: 'radial-gradient(ellipse at 50% 45%, #F0273A 0%, #C3101F 48%, #6E0611 100%)' };
  const GRAO = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 200; const g = cv.getContext('2d'), d = g.createImageData(200, 200); let s = 7;
    for (let i = 0; i < d.data.length; i += 4) { s = (s * 16807) % 2147483647; const v = s / 2147483647 * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return cv.toDataURL(); })();
  const MEDE = document.createElement('canvas').getContext('2d');
  const K = window.K = { clamp, ease, eio, back, lerp, fmt, verm: false, W: 1080, H: 1350, OU: '#D6B36C' };
  K.acc = () => K.verm ? '#0B0B0D' : '#FF2E43';               // cor de destaque (vermelho no preto, preto no vermelho)
  K.viva = () => K.verm ? '#FFFFFF' : '#FF2E43';              // cor de linha/gráfico
  K.surge = (k, dy = 40) => `opacity:${clamp(k * 1.4)};transform:translateY(${(1 - k) * dy}px);filter:blur(${(1 - clamp(k)) * 10}px)`;

  // fundo: trocas = [[segundo, 'black'|'red'], ...]; a troca abre num círculo a partir de (540, cy)
  K.fundo = (t, trocas = [[0, 'black']], cy = 860) => {
    let j = 0; trocas.forEach((x, k) => { if (t >= x[0]) j = k; });
    const cor = trocas[j][1], ant = j ? trocas[j - 1][1] : cor, p = j ? ease((t - trocas[j][0]) / .5) : 1, r = p * 1700;
    K.verm = (p > .5 ? cor : ant) === 'red';
    const anel = p > 0 && p < 1 ? `<div style="position:absolute;left:${540 - r}px;top:${cy - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;box-shadow:0 0 0 6px rgba(255,255,255,${.5 * (1 - p)}),0 0 80px 20px rgba(255,255,255,${.25 * (1 - p)})"></div>` : '';
    const linhas = [0, 1].map(k => { const y = ((t * 40 + k * 800) % 1600) - 120; return `<div style="position:absolute;left:0;right:0;top:${y}px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent)"></div>`; }).join('');
    return `<div style="position:absolute;inset:0;background:${FUNDO[ant]}"></div><div style="position:absolute;inset:0;background:${FUNDO[cor]};clip-path:circle(${r}px at 540px ${cy}px)"></div>${anel}${linhas}
      <div style="position:absolute;inset:0;opacity:.06;background-image:url(${GRAO})"></div>`;
  };
  // topo: barra segmentada (slide atual enchendo) + @ dourado, igual à barra de progresso dos vídeos
  K.topo = (n, total, t, dur) => `<div style="position:absolute;left:60px;right:60px;top:40px;display:flex;gap:10px">${Array.from({ length: total }, (_, i) =>
      `<div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden"><div style="height:100%;width:${i < n - 1 ? 100 : i === n - 1 ? 100 * clamp(t / dur) : 0}%;background:${K.verm ? '#fff' : 'linear-gradient(90deg,#4F7BFF,#D6B36C)'}"></div></div>`).join('')}</div>
    <div style="position:absolute;left:0;right:0;top:66px;text-align:center;font-weight:700;font-size:26px;color:${K.verm ? '#FFE3A3' : K.OU}">@euaugusto_oliv</div>`;
  // título cinético: linhas = ['TEXTO', '*DESTAQUE*', ...]; cada linha entra com uma animação diferente e fica
  const ENTRA = ['zoom', 'mask', 'up', 'pop', 'left', 'drop', 'letras'];
  K.kin = (t, t0, linhas, o = {}) => {
    const y = o.y ?? 860, max = o.max ?? 210, passo = o.passo ?? .32, larg = o.larg ?? 940, ini = o.ini ?? 0;
    const L = linhas.map(l => ({ txt: l.replace(/\*/g, '').toUpperCase(), enf: /^\*.*\*$/.test(l) }));
    MEDE.font = `${max}px Anton`; const fs = Math.min(max, ...L.map(l => max * larg / MEDE.measureText(l.txt).width)), lh = fs * 1.04, topo = y - lh * L.length / 2;
    MEDE.font = `${fs}px Anton`;
    return L.map((l, i) => {
      const d = t - t0 - i * passo; if (d < 0) return '';
      const tipo = l.enf && i ? ['pop', 'zoom', 'drop'][i % 3] : ENTRA[(i + ini) % ENTRA.length], q = ease(d / .24), qb = back(d / .32), e = x => ease(clamp(x));
      let tr = '', blur = 0, clip = '', html = l.txt;
      if (tipo === 'pop') { tr = `scale(${lerp(.55, 1, clamp(qb, 0, 1.2))})`; blur = 10 * (1 - q); }
      else if (tipo === 'up') { tr = `translateY(${90 * (1 - q)}px)`; blur = 12 * (1 - q); }
      else if (tipo === 'drop') { tr = `translateY(${-110 * (1 - clamp(qb))}px)`; blur = 10 * (1 - q); }
      else if (tipo === 'zoom') { tr = `scale(${lerp(2.2, 1, q)})`; blur = 18 * (1 - q); }
      else if (tipo === 'left') { tr = `translateX(${-160 * (1 - q)}px) skewX(${12 * (1 - q)}deg)`; blur = 10 * (1 - q); }
      else if (tipo === 'mask') clip = `clip-path:inset(-30% ${100 - 100 * e(d / .3)}% -30% 0);`;
      else if (tipo === 'letras') { let j = 0; html = l.txt.split('').map(ch => `<span style="display:inline-block;opacity:${e((d - j * .025) / .14)};transform:translateY(${(1 - e((d - (j++) * .025) / .16)) * 50}px)">${ch === ' ' ? '&nbsp;' : ch}</span>`).join(''); }
      const cor = l.enf ? K.acc() : '#fff', w = MEDE.measureText(l.txt).width, yy = topo + i * lh;
      const sombra = l.enf ? (K.verm ? 'text-shadow:0 8px 30px rgba(0,0,0,.3);' : 'text-shadow:0 0 40px rgba(255,46,67,.55);') : 'text-shadow:0 10px 40px rgba(0,0,0,.45);';
      const ln = l.enf ? `<div style="position:absolute;left:${540 - w / 2}px;top:${yy + lh - fs * .06}px;width:${w * e((d - .15) / .35)}px;height:${Math.max(6, fs * .05)}px;border-radius:5px;background:${K.acc()}"></div>` : '';
      return `<div style="position:absolute;left:0;right:0;top:${yy}px;height:${lh}px;text-align:center;font-family:Anton;font-size:${fs}px;line-height:${lh}px;color:${cor};white-space:nowrap;${sombra}${clip}transform:${tr || 'none'};filter:${blur > .3 ? `blur(${blur}px)` : 'none'}">${html}</div>${ln}`;
    }).join('');
  };
  // etiqueta pequena (PASSO 1, PRESENTE...) e texto de apoio
  K.kick = (t, t0, txt, y) => `<div style="position:absolute;left:0;right:0;top:${y}px;text-align:center;${K.surge(ease((t - t0) / .4))}"><span style="display:inline-block;padding:8px 22px;border-radius:30px;background:${K.verm ? '#fff' : '#FF2E43'};color:${K.verm ? '#C3101F' : '#fff'};font-family:Anton;font-size:34px;letter-spacing:.06em">${txt}</span></div>`;
  K.corpo = (t, t0, html, y, o = {}) => `<div style="position:absolute;left:90px;right:90px;top:${y}px;text-align:center;font-weight:500;font-size:${o.fs || 36}px;line-height:1.32;color:rgba(255,255,255,.88);${K.surge(ease((t - t0) / .5))}">${html.replace(/<b>/g, `<b style="color:#fff;font-weight:800;${K.verm ? '' : 'border-bottom:3px solid #FF2E43'}">`)}</div>`;
  K.rodape = (t, t0, txt = 'ARRASTA') => `<div style="position:absolute;left:0;right:0;bottom:44px;text-align:center;opacity:${ease((t - t0) / .4)}"><span style="font-weight:800;font-size:26px;letter-spacing:.22em;color:rgba(255,255,255,.7)">${txt} <span style="display:inline-block;color:${K.verm ? '#fff' : '#FF2E43'};transform:translateX(${Math.sin(t * 4) * 8}px)">→</span></span></div>`;
  // card de vidro (mesmo do gráfico do v22): escuro no preto, vinho translúcido no vermelho
  K.vidro = () => `border-radius:40px;background:${K.verm ? 'linear-gradient(165deg, rgba(70,0,10,.55), rgba(40,0,6,.38))' : 'radial-gradient(520px 260px at 88% 0%, rgba(255,46,67,.18), transparent 70%), linear-gradient(165deg, rgba(255,255,255,.09), rgba(255,255,255,.02))'};
    border:1.5px solid rgba(255,255,255,${K.verm ? .26 : .14});box-shadow:0 50px 110px -40px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.16);`;
  // gráfico de linha em card de vidro (igual ao do v22): pontos [{rot, v, t}] aparecem no tempo t
  K.linha = (t, o) => {
    const P = o.pontos, Wc = o.w || 940, Hc = o.h || 470, VERM = K.verm, AC = K.viva(), FR = 'rgba(255,255,255,';
    let i = 0; P.forEach((q, j) => { if (t >= q.t) i = j; }); const kk = i ? eio((t - P[i].t) / .8) : 1;
    const gx0 = 40, gx1 = Wc - 110, gy0 = 190, gy1 = Hc - 74, vmin = o.min, vmax = o.max;
    const X = j => gx0 + 30 + j * (gx1 - gx0 - 60) / Math.max(1, P.length - 1), Y = v => gy1 - (v - vmin) / (vmax - vmin) * (gy1 - gy0);
    const bz = (j, u) => { const ax = X(j), ay = Y(P[j].v), bx = X(j + 1), by = Y(P[j + 1].v), m = (bx - ax) / 2, w = 1 - u;
      return [w * w * w * ax + 3 * w * w * u * (ax + m) + 3 * w * u * u * (bx - m) + u * u * u * bx, w * w * w * ay + 3 * w * w * u * ay + 3 * w * u * u * by + u * u * u * by]; };
    const pts = [[X(0), Y(P[0].v)]]; for (let j = 0; j < i; j++) { const f = j === i - 1 ? kk : 1; for (let k = 1; k <= 40; k++) { if (k / 40 > f + 1e-6) break; pts.push(bz(j, k / 40)); } if (j === i - 1 && f < 1) pts.push(bz(j, f)); }
    const v = i ? lerp(P[i - 1].v, P[i].v, kk) : P[0].v, pt = pts[pts.length - 1], sobe = (v - P[0].v) / P[0].v * 100, puls = (t * 1.2) % 1;
    const d = pts.map((q, j) => `${j ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
    const ticks = [0, 1, 2, 3].map(g => { const vv = vmax - g * (vmax - vmin) / 3, yy = Y(vv); return `<line x1="${gx0}" x2="${gx1}" y1="${yy}" y2="${yy}" stroke="${FR}.08)" stroke-width="2"/><text x="${gx1 + 22}" y="${yy + 9}" font-family="IT" font-weight="700" font-size="24" fill="${FR}.45)">${fmt(vv)}</text>`; }).join('');
    const marcas = P.map((q, j) => j > i || (j === i && i > 0) ? '' : `<circle cx="${X(j)}" cy="${Y(q.v)}" r="11" fill="${VERM ? '#8E0B17' : '#0B0C10'}" stroke="${FR}.95)" stroke-width="4"/><text x="${X(j)}" y="${Y(q.v) - 26}" text-anchor="middle" font-family="IT" font-weight="800" font-size="27" fill="${FR}.85)">${fmt(q.v)}</text>`).join('');
    const rots = P.map((q, j) => `<text x="${X(j)}" y="${Hc - 30}" text-anchor="middle" font-family="IT" font-weight="800" font-size="23" letter-spacing="3" fill="${j === i ? '#fff' : FR + '.45)'}">${q.rot}</text>`).join('');
    const inn = ease(t / .6), id = 'g' + Math.round(Math.random() * 1e6);
    return `<div style="position:absolute;left:${o.x ?? 70}px;top:${o.y ?? 150}px;width:${Wc}px;height:${Hc}px;${K.vidro()}overflow:hidden;opacity:${inn};transform:translateY(${(1 - inn) * 30}px)">
      <div style="position:absolute;left:40px;top:30px;font-weight:800;font-size:25px;letter-spacing:.16em;color:${FR}.65)">${o.rotulo || ''}</div>
      <div style="position:absolute;left:38px;top:64px;font-family:Anton;font-size:96px;line-height:1;color:#fff">${o.prefixo ?? 'R$ '}${fmt(v)}</div>
      ${Math.abs(sobe) > .5 ? `<div style="position:absolute;right:36px;top:84px;padding:12px 24px;border-radius:40px;background:${AC};color:${VERM ? '#C3101F' : '#fff'};font-family:Anton;font-size:44px">${sobe > 0 ? '▲' : '▼'} ${fmt(Math.abs(sobe), 1)}%</div>` : ''}
      <svg width="${Wc}" height="${Hc}" style="position:absolute;inset:0;overflow:visible"><defs><linearGradient id="a${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${AC}" stop-opacity=".38"/><stop offset="1" stop-color="${AC}" stop-opacity="0"/></linearGradient>
        <linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${FR}.55)"/><stop offset=".55" stop-color="${AC}"/><stop offset="1" stop-color="${AC}"/></linearGradient></defs>
        ${ticks}<path d="${d} L${pt[0]} ${gy1} L${X(0)} ${gy1} Z" fill="url(#a${id})"/><line x1="${pt[0]}" x2="${pt[0]}" y1="${pt[1] + 18}" y2="${gy1}" stroke="${FR}.35)" stroke-width="2" stroke-dasharray="5 8"/>
        <path d="${d}" fill="none" stroke="url(#l${id})" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 14px ${AC})"/>${marcas}
        <circle cx="${pt[0]}" cy="${pt[1]}" r="${30 + 26 * puls}" fill="${AC}" opacity="${.35 * (1 - puls)}"/><circle cx="${pt[0]}" cy="${pt[1]}" r="15" fill="#fff" stroke="${AC}" stroke-width="6"/>${rots}</svg></div>`;
  };
})();
