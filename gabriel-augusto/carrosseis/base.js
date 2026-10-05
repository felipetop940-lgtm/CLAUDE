// Coloca o topo (marca + @ + bolinhas de progresso) em todo slide <section class="s">.
const PERFIL = '@euaugusto_oliv'; // @ do Instagram que aparece no topo de todo slide
document.addEventListener('DOMContentLoaded', () => {
  // slides com data-nome são variantes (ex.: capa alternativa): não entram na contagem
  const ss = [...document.querySelectorAll('section.s:not([data-nome])')];
  const caderno = document.body.classList.contains('caderno');
  document.querySelectorAll('section.s').forEach(s => {
    const i = Math.max(0, ss.indexOf(s)), n = x => String(x).padStart(2, '0');
    if (s.classList.contains('tw')) { // formato post do X: cabeçalho de perfil (sem selo de verificado)
      if (!s.querySelector('.tw-head')) s.insertAdjacentHTML('afterbegin', '<div class="tw-head"><span class="av">G</span><span><b>Gabriel Augusto</b><small>' + PERFIL + '</small></span></div>');
      return;
    }
    if (caderno) { const e = document.createElement('div'); e.className = 'espiral'; s.prepend(e); }
    if (s.querySelector('.top')) return;
    const top = document.createElement('div'); top.className = 'top';
    top.innerHTML = caderno
      ? '<span class="oval">' + PERFIL + '</span><span class="cnt">' + n(i + 1) + '/' + n(ss.length) + '</span>'
      : '<b><i>G</i><span>Gabriel Augusto<small>' + PERFIL + '</small></span></b><div class="dots">' +
        ss.map((_, j) => '<span' + (j === i ? ' class="on"' : '') + '></span>').join('') + '</div>';
    s.prepend(top);
  });
  // Títulos: cada linha (separada por <br> no nível de cima) vira um bloco; linha com acento
  // em cima da letra (Ã, É, Ô...) ganha respiro pra não encostar na linha de cima.
  document.querySelectorAll('.H').forEach(h => {
    const linhas = [[]]; [...h.childNodes].forEach(n => n.nodeName === 'BR' ? linhas.push([]) : linhas.at(-1).push(n));
    h.textContent = '';
    linhas.forEach(ns => { const l = document.createElement('span'); l.className = 'ln'; ns.forEach(n => l.append(n));
      if (/[ãáâàéêíóôõúÃÁÂÀÉÊÍÓÔÕÚ]/.test(l.textContent)) l.classList.add('ac'); h.append(l); });
  });
});
