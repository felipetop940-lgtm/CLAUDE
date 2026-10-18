(function () {
  'use strict';
  var doc = document, root = doc.documentElement, SITE = window.SITE || {};
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var get = function (path) { return path.split('.').reduce(function (o, k) { return o ? o[k] : ''; }, SITE); };
  root.classList.add('js');

  /* ---------- Dados do config.js ---------- */
  $$('[data-f]').forEach(function (el) { el.textContent = get(el.getAttribute('data-f')) || ''; });
  $$('[data-need]').forEach(function (el) { if (!get(el.getAttribute('data-need'))) el.hidden = true; });
  var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
  var end = SITE.endereco || {};
  $$('[data-map]').forEach(function (a) { a.href = end.mapa; });
  var frame = $('[data-embed]'); if (frame && end.embed) frame.src = end.embed;
  if (SITE.instagram) $$('[data-ig]').forEach(function (a) {
    a.href = 'https://instagram.com/' + SITE.instagram; a.target = '_blank'; a.rel = 'noopener';
    var h = $('[data-ig-handle]', a); if (h) h.textContent = '@' + SITE.instagram;
  });

  /* ---------- WhatsApp: cada botão leva a mensagem do seu assunto ---------- */
  var MSG = SITE.mensagens || {};
  $$('[data-wa]').forEach(function (el) {
    if (!SITE.whatsapp) return; // sem número: o botão continua levando à seção de contato
    var msg = encodeURIComponent(MSG[el.getAttribute('data-wa')] || MSG.padrao || '');
    el.href = 'https://wa.me/' + SITE.whatsapp + '?text=' + msg;
    el.target = '_blank'; el.rel = 'noopener';
  });

  /* ---------- Entradas ao rolar ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, i = $$('.reveal', el.parentNode).indexOf(el);
      el.style.transitionDelay = Math.min(i, 4) * 90 + 'ms';
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .1 }) : null;
  $$('.reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('is-in'); });
  requestAnimationFrame(function () { root.classList.add('is-ready'); });

  /* ---------- Header, menu ativo e barra do celular ---------- */
  var header = $('.header'), links = $$('.nav a');
  var sections = links.map(function (a) { return $(a.getAttribute('href')); });
  var hero = $('.hero');
  function onScroll() {
    var sy = window.scrollY;
    header.classList.toggle('is-scrolled', sy > 10);
    root.classList.toggle('past-hero', sy > hero.offsetHeight * .6);
    var cur = 0;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * .4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
