// Coloca em todo slide <section class="s"> o cabeçalho de perfil (estilo post do X)
// e o "ARRASTA PRO LADO" no rodapé (menos no último slide, <section class="s fim">).
const PERFIL = { nome: 'Gabriel Augusto', arroba: '@euaugusto_oliv' };
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('section.s').forEach(s => {
    s.insertAdjacentHTML('afterbegin', '<div class="perfil"><span class="av">G</span><span><b>' + PERFIL.nome + '</b><small>' + PERFIL.arroba + '</small></span></div>');
    if (!s.classList.contains('fim')) s.insertAdjacentHTML('beforeend', '<div class="arrasta">Arrasta pro lado <i>→</i></div>');
  });
  // a seta nunca fica sozinha na linha de baixo
  document.querySelectorAll('.nota, .capa .txt').forEach(n => n.innerHTML = n.innerHTML.replace(/\s+→/g, '\u00a0→'));
});
