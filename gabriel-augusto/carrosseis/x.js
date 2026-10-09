// Modelo post do X escuro: coloca o perfil no topo de cada <section class="s"> e o rodapé (nº, pontinhos, ARRASTA).
const PERFIL = { nome: 'Gabriel Augusto', arroba: '@euaugusto_oliv', inicial: 'G' };
document.addEventListener('DOMContentLoaded', () => {
  const ss = [...document.querySelectorAll('section.s')], n = ss.length, pad = x => String(x).padStart(2, '0');
  ss.forEach((s, i) => {
    s.insertAdjacentHTML('afterbegin', `<div class="perfil"><span class="av">${PERFIL.inicial}</span><span><b>${PERFIL.nome}</b><small>${PERFIL.arroba}</small></span></div>`);
    const pts = ss.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('');
    s.insertAdjacentHTML('beforeend', `<div class="rodape"><span>${pad(i + 1)}/${pad(n)}</span><span class="pts">${pts}</span><span class="vai">${i < n - 1 ? 'ARRASTA <em>→</em>' : ''}</span></div>`);
  });
});
