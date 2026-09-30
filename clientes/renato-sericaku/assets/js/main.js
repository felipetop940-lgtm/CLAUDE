(function () {
  'use strict';
  var doc = document, SITE = window.SITE || {};
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var get = function (path) { return path.split('.').reduce(function (o, k) { return o ? o[k] : ''; }, SITE); };
  doc.documentElement.classList.add('js');

  /* ---------- Dados do config.js ---------- */
  $$('[data-f]').forEach(function (el) { el.textContent = get(el.getAttribute('data-f')) || ''; });
  $$('[data-need]').forEach(function (el) { if (!get(el.getAttribute('data-need'))) el.hidden = true; });
  var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
  var map = $('[data-map]'); if (map && SITE.endereco) map.href = SITE.endereco.mapa;
  if (SITE.instagram) $$('[data-ig]').forEach(function (a) {
    a.href = 'https://instagram.com/' + SITE.instagram;
    var h = $('[data-ig-handle]', a); if (h) h.textContent = '@' + SITE.instagram;
  });

  /* ---------- WhatsApp: cada botão leva a mensagem do seu assunto ---------- */
  var MSG = SITE.mensagens || {};
  $$('[data-wa]').forEach(function (el) {
    if (!SITE.whatsapp) return; // sem número: o botão continua levando à seção de contato
    var msg = MSG[el.getAttribute('data-wa')] || MSG.padrao || '';
    el.href = 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(msg);
    el.target = '_blank'; el.rel = 'noopener';
  });

  /* ---------- Depoimentos reais (só aparecem se existirem) ---------- */
  var dep = $('#depoimentos');
  if (dep && (SITE.depoimentos || []).length) {
    dep.innerHTML = SITE.depoimentos.map(function (d) {
      var e = doc.createElement('div'); e.textContent = d.texto; var t = e.innerHTML;
      e.textContent = d.nome; var n = e.innerHTML; e.textContent = d.detalhe || ''; var x = e.innerHTML;
      return '<blockquote class="testi reveal"><p>“' + t + '”</p><footer><strong>' + n + '</strong>' + (x ? ' · ' + x : '') + '</footer></blockquote>';
    }).join('');
    dep.hidden = false;
  }

  /* ---------- Header e botão flutuante ---------- */
  var header = $('.header'), wa = $('.wa-float');
  function onScroll() {
    var s = window.scrollY > 24;
    header.classList.toggle('is-scrolled', s);
    if (wa) wa.classList.toggle('is-on', window.scrollY > window.innerHeight * .6);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Menu mobile ---------- */
  var burger = $('#burger'), nav = $('#nav');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Revelar ao rolar ---------- */
  var items = $$('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, sib = $$('.reveal', el.parentNode).indexOf(el);
      el.style.transitionDelay = Math.min(Math.max(sib, 0), 5) * 70 + 'ms';
      el.classList.add('is-in'); io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  items.forEach(function (el) { io.observe(el); });

  /* ---------- Dúvidas: uma aberta por vez ---------- */
  $$('.acc__item').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) $$('.acc__item').forEach(function (o) { if (o !== d) o.open = false; }); });
  });
})();
