// Coloca o topo (marca + bolinhas de progresso) em todo slide <section class="s">.
document.addEventListener('DOMContentLoaded', () => {
  const ss = [...document.querySelectorAll('section.s')];
  ss.forEach((s, i) => {
    if (s.querySelector('.top')) return;
    const top = document.createElement('div'); top.className = 'top';
    top.innerHTML = '<b><i>G</i>Gabriel Augusto</b><div class="dots">' +
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
