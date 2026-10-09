// Modelo post do X escuro: coloca o perfil no topo de cada <section class="s"> e o rodapé (nº, pontinhos, ARRASTA).
const PERFIL = { nome: 'Gabriel Augusto', arroba: '@euaugusto_oliv', foto: '../../assets/img/gabriel-avatar.webp' };
// selo azul de verificado (desenho próprio, estilo do X)
const SELO = '<svg viewBox="0 0 24 24"><path fill="#1D9BF0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.26 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/><path fill="#fff" d="M10.54 16.2 6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36z"/></svg>';
document.addEventListener('DOMContentLoaded', () => {
  const ss = [...document.querySelectorAll('section.s')], n = ss.length, pad = x => String(x).padStart(2, '0');
  ss.forEach((s, i) => {
    s.insertAdjacentHTML('afterbegin', `<div class="perfil"><img class="av" src="${PERFIL.foto}"><span><b>${PERFIL.nome}${SELO}</b><small>${PERFIL.arroba}</small></span></div>`);
    const pts = ss.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('');
    s.insertAdjacentHTML('beforeend', `<div class="rodape"><span>${pad(i + 1)}/${pad(n)}</span><span class="pts">${pts}</span><span class="vai">${i < n - 1 ? 'ARRASTA <em>→</em>' : ''}</span></div>`);
  });
});
