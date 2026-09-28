/* ICL Saúde — interações do site. Sem dependências. */
(function () {
  'use strict';

  var SITE = window.SITE || {};
  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var isPlaceholder = function (v) { return typeof v === 'string' && /^\[.*\]$/.test(v.trim()); };
  var isEmpty = function (v) { return v == null || String(v).trim() === ''; };
  var get = function (path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, SITE);
  };

  /* ---------- WhatsApp: todos os [data-wa] apontam para o mesmo número ---------- */
  function waUrl(message) {
    var text = message || SITE.whatsappDefaultMessage || '';
    return 'https://wa.me/' + SITE.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  var waReady = !isEmpty(SITE.whatsapp) && !isPlaceholder(SITE.whatsapp);
  doc.querySelectorAll('[data-wa]').forEach(function (el) {
    if (!waReady) return; // mantém âncora #contato como fallback
    el.href = waUrl(el.getAttribute('data-wa'));
    el.target = '_blank';
    el.rel = 'noopener';
    el.addEventListener('click', function () { trackLead(el); });
  });

  /* ---------- Rastreamento de conversão (clique no WhatsApp) ----------
     Funciona automaticamente se GTM/GA4 ou Meta Pixel estiverem instalados.
     Evento no dataLayer: "whatsapp_click", com a seção de origem em "cta_location". */
  function trackLead(el) {
    var area = el.closest('section, header, footer');
    var location = el.classList.contains('wa-float') ? 'botao_flutuante'
      : area ? (area.id || area.className.split(' ')[0] || area.tagName.toLowerCase()) : 'pagina';
    try {
      (window.dataLayer = window.dataLayer || []).push({ event: 'whatsapp_click', cta_location: location });
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { method: 'whatsapp', cta_location: location });
      if (typeof window.fbq === 'function') window.fbq('track', 'Contact', { content_name: location });
    } catch (e) { /* rastreamento nunca pode quebrar o clique */ }
  }

  /* ---------- Campos de texto e linhas de contato ---------- */
  doc.querySelectorAll('[data-field]').forEach(function (el) {
    var v = get(el.getAttribute('data-field'));
    if (v === undefined) return;
    el.textContent = v;
    el.classList.toggle('is-placeholder-inline', isPlaceholder(v));
  });

  doc.querySelectorAll('[data-row]').forEach(function (row) {
    var v = get(row.getAttribute('data-row'));
    if (v !== undefined && isEmpty(v)) row.hidden = true;
  });

  /* ---------- Links configuráveis ---------- */
  doc.querySelectorAll('[data-link]').forEach(function (el) {
    var key = el.getAttribute('data-link');
    var href;
    if (key === 'tel') href = isPlaceholder(SITE.phone) ? null : 'tel:+55' + String(SITE.phone).replace(/\D/g, '');
    else if (key === 'mailto') href = isPlaceholder(SITE.email) ? null : 'mailto:' + SITE.email;
    else href = get(key);

    if (!isEmpty(href) && !isPlaceholder(href)) {
      el.href = href;
    } else {
      // Link ainda não configurado: desativa sem quebrar o layout
      el.removeAttribute('href');
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('is-disabled');
    }
  });

  /* ---------- Mapa (carregado sob demanda) ---------- */
  var map = doc.querySelector('[data-map]');
  if (map && !isEmpty(SITE.mapsEmbedUrl)) {
    map.hidden = false;
    map.innerHTML = '<iframe title="Localização da ICL Saúde no mapa" src="' + SITE.mapsEmbedUrl +
      '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  }

  /* ---------- Ano no rodapé ---------- */
  doc.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header: estado ao rolar ---------- */
  var header = doc.querySelector('.header');
  var waFloat = doc.querySelector('.wa-float');
  var onScroll = function () {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    // Botão flutuante aparece depois do hero, para não duplicar o CTA principal
    if (waFloat) waFloat.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.7);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  var toggle = doc.querySelector('.menu-toggle');
  var menu = doc.getElementById('menu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    doc.body.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && doc.body.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
  });
  var desktop = window.matchMedia('(min-width: 1024px)');
  var onDesktop = function (e) { if (e.matches) setMenu(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', onDesktop); else desktop.addListener(onDesktop);

  /* ---------- Reveal ao rolar ---------- */
  var reveals = doc.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    // Atraso escalonado entre irmãos para um reveal mais natural
    reveals.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); });
      el.style.setProperty('--delay', Math.min(siblings.indexOf(el), 5) * 70 + 'ms');
      io.observe(el);
    });
  }

  /* ---------- Comparador antes/depois ---------- */
  doc.querySelectorAll('[data-compare]').forEach(function (cmp) {
    var range = cmp.querySelector('.compare__range');
    var set = function () { cmp.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', set);
    set();
  });
})();
