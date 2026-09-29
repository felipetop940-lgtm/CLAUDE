/* Gabriel Augusto — interações. JavaScript puro, sem bibliotecas. */
(function () {
  'use strict';

  var SITE = window.SITE || {};
  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var isEmpty = function (v) { return v == null || String(v).trim() === ''; };
  var get = function (path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, SITE); };

  /* ---------- WhatsApp ---------- */
  function waBase() {
    var v = String(SITE.whatsapp || '').trim();
    if (!v) return '';
    if (/^\d+$/.test(v)) return 'https://wa.me/' + v;
    return v;
  }
  function waUrl(message) {
    var base = waBase();
    if (!base) return '#contato';
    var text = message || SITE.whatsappDefaultMessage || '';
    // Só acrescenta a mensagem em links wa.me/api.whatsapp sem texto próprio
    if (text && /wa\.me|whatsapp\.com/.test(base) && !/[?&]text=/.test(base)) {
      base += (base.indexOf('?') > -1 ? '&' : '?') + 'text=' + encodeURIComponent(text);
    }
    return base;
  }
  function setWa(el, message) {
    el.href = waUrl(message);
    if (waBase()) { el.target = '_blank'; el.rel = 'noopener'; }
  }
  // Botões de plano usam as mensagens de config.js (data-wa-plan="premium" etc.)
  var MSG = SITE.messages || {};
  $$('[data-wa]').forEach(function (el) {
    var plan = el.getAttribute('data-wa-plan');
    setWa(el, (plan && MSG[plan]) || el.getAttribute('data-wa'));
    el.addEventListener('click', function () { track(el); });
  });

  // Evento de conversão: funciona com GTM/GA4/Meta Pixel se estiverem instalados
  function track(el) {
    var area = el.closest('section, header, footer, .sticky-cta, .wa-float');
    var where = area ? (area.id || area.className.split(' ')[0]) : 'pagina';
    try {
      (window.dataLayer = window.dataLayer || []).push({ event: 'whatsapp_click', cta_location: where });
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { method: 'whatsapp', cta_location: where });
      if (typeof window.fbq === 'function') window.fbq('track', 'Contact', { content_name: where });
    } catch (e) { /* nunca bloqueia o clique */ }
  }

  /* ---------- Campos opcionais (e-mail, Instagram) ---------- */
  $$('[data-field]').forEach(function (el) { var v = get(el.getAttribute('data-field')); if (!isEmpty(v)) el.textContent = v; });
  $$('[data-row]').forEach(function (el) { el.hidden = isEmpty(get(el.getAttribute('data-row'))); });
  $$('[data-link]').forEach(function (el) {
    var key = el.getAttribute('data-link'), v = get(key);
    if (isEmpty(v)) return;
    el.href = key === 'email' ? 'mailto:' + v : v;
  });
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header, progresso de leitura e CTAs fixos ---------- */
  var header = $('.header');
  var bar = $('.progress span');
  var waFloat = $('.wa-float');
  var sticky = $('.sticky-cta');
  var hero = $('.hero');
  var finalSec = $('#contato');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 20);
    if (bar) bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

    // CTAs fixos aparecem depois do hero e somem na seção final (que já tem o botão principal)
    var pastHero = y > hero.offsetHeight * 0.75;
    var atFinal = finalSec.getBoundingClientRect().top < window.innerHeight * 0.85;
    var show = pastHero && !atFinal;
    if (waFloat) waFloat.classList.toggle('is-on', show);
    if (sticky) sticky.classList.toggle('is-on', show);

    updateSteps();
    updateParallax();
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  var burger = $('.burger');
  var menu = $('#menu');
  function setMenu(open) {
    doc.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });

  /* ---------- Título do hero palavra por palavra ---------- */
  var title = $('[data-split]');
  if (title && !reduce) {
    var i = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
            var w = doc.createElement('span'); w.className = 'word';
            var inner = doc.createElement('span'); inner.textContent = part; inner.style.setProperty('--w', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) { split(child); }
      });
    })(title);
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    title.classList.add('split-ready');
    requestAnimationFrame(function () { requestAnimationFrame(function () { title.classList.add('is-in'); }); });
  }

  /* ---------- Revelação ao rolar ---------- */
  var reveals = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    reveals.forEach(function (el) {
      var sib = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); });
      el.style.setProperty('--d', Math.min(sib.indexOf(el), 6) * 80 + 'ms');
      io.observe(el);
    });
  }

  /* ---------- Luz que segue o cursor (hero e cards) ---------- */
  if (finePointer && !reduce) {
    var heroBg = $('.hero__bg');
    var mock = $('.mock');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      heroBg.style.setProperty('--hx', (x * 100).toFixed(1) + '%');
      heroBg.style.setProperty('--hy', (y * 100).toFixed(1) + '%');
      if (mock) {
        mock.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        mock.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
      }
    });
    hero.addEventListener('pointerleave', function () {
      if (mock) { mock.style.setProperty('--rx', '0deg'); mock.style.setProperty('--ry', '0deg'); }
    });

    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    /* Botões magnéticos: puxam levemente em direção ao cursor */
    $$('.magnetic').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px,' + (dy * 0.28).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------- Mockup: um site sendo construído até virar contato ---------- */
  var mockEl = $('[data-mock]');
  var visual = $('.hero__visual');
  if (mockEl) {
    var urlEl = $('[data-url]', mockEl);
    var fullUrl = urlEl.textContent;
    var timers = [];
    var running = false;
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var stages = ['s1', 's2', 's3', 's4', 's5'];

    function finalState() { mockEl.classList.add('s1', 's2', 's3'); visual.classList.add('is-toast'); }
    function cycle() {
      timers.forEach(clearTimeout); timers = [];
      stages.forEach(function (s) { mockEl.classList.remove(s); });
      visual.classList.remove('is-toast');
      urlEl.textContent = '';
      for (var k = 1; k <= fullUrl.length; k++) {
        (function (n) { later(function () { urlEl.textContent = fullUrl.slice(0, n); }, 300 + n * 70); })(k);
      }
      later(function () { mockEl.classList.add('s1'); }, 1500);
      later(function () { mockEl.classList.add('s2'); }, 2400);
      later(function () { mockEl.classList.add('s3'); }, 3200);
      later(function () { mockEl.classList.add('s4'); }, 4000);
      later(function () { mockEl.classList.add('s5'); }, 5200);
      later(function () { mockEl.classList.remove('s5', 's4'); visual.classList.add('is-toast'); }, 5500);
      later(function () { if (running) cycle(); }, 10500);
    }
    if (reduce || !('IntersectionObserver' in window)) {
      finalState();
    } else {
      new IntersectionObserver(function (en) {
        var visible = en[0].isIntersecting;
        if (visible && !running) { running = true; cycle(); }
        else if (!visible && running) { running = false; timers.forEach(clearTimeout); timers = []; finalState(); urlEl.textContent = fullUrl; }
      }, { threshold: 0.25 }).observe(mockEl);
    }
  }

  /* ---------- Linha do processo que se desenha com a rolagem ---------- */
  var steps = $('[data-steps]');
  var stepItems = steps ? $$('.step', steps) : [];
  function updateSteps() {
    if (!steps) return;
    var r = steps.getBoundingClientRect();
    var mid = window.innerHeight * 0.6;
    var fill = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    steps.style.setProperty('--fill', fill.toFixed(3));
    stepItems.forEach(function (s) { s.classList.toggle('is-on', s.getBoundingClientRect().top + 28 < mid); });
  }

  /* ---------- Leve parallax na foto do "Sobre" ---------- */
  var photo = $('.about__photo img');
  function updateParallax() {
    if (!photo || reduce) return;
    var r = photo.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
    photo.style.setProperty('--py', (p * -30).toFixed(1) + 'px');
  }

  /* ---------- Plano Essencial: adicional de vídeo ---------- */
  var prices = SITE.prices || { essential: 250, video: 38, premium: 320 };
  var addon = $('[data-addon-video]');
  var priceEl = $('[data-price-essential]');
  var hint = $('[data-hint]');
  var essentialCta = $('[data-plan-cta="essential"]');

  function animateNumber(el, to) {
    var from = parseInt(el.textContent, 10) || 0;
    if (reduce || from === to) { el.textContent = to; return; }
    var t0 = performance.now(), dur = 600;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function syncEssential() {
    var withVideo = addon && addon.checked;
    var total = prices.essential + (withVideo ? prices.video : 0);
    animateNumber(priceEl, total);
    if (hint) hint.hidden = !withVideo;
    if (essentialCta) {
      var msg = (withVideo ? MSG.essentialVideo : MSG.essential) || '';
      setWa(essentialCta, msg.replace('{total}', total));
    }
  }
  if (addon) { addon.addEventListener('change', syncEssential); syncEssential(); }

  /* ---------- Métricas reais deste site, medidas no aparelho do visitante ---------- */
  function fillLive() {
    var loadEl = $('[data-live="load"]');
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var ms = nav ? (nav.domContentLoadedEventEnd || nav.responseEnd) : (performance.now());
    if (loadEl) loadEl.textContent = (ms / 1000).toFixed(2).replace('.', ',') + ' s';

    var devEl = $('[data-live="device"]');
    var noteEl = $('[data-live="device-note"]');
    var w = window.innerWidth;
    var device = w < 768 ? 'Celular' : w < 1024 ? 'Tablet' : 'Computador';
    if (devEl) devEl.textContent = device;
    if (noteEl) noteEl.textContent = 'layout adaptado para ' + w + ' px de largura';
  }
  if (doc.readyState === 'complete') fillLive(); else window.addEventListener('load', fillLive);
  window.addEventListener('resize', function () { var d = $('[data-live="device"]'); if (d && d.textContent !== '—') fillLive(); });

  /* ---------- Dúvidas: abre/fecha com animação e uma de cada vez ---------- */
  $$('.acc__item').forEach(function (item) {
    var summary = $('summary', item), body = $('.acc__body', item);
    summary.addEventListener('click', function (e) {
      if (reduce) return;
      e.preventDefault();
      if (item.open) {
        var close = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
        close.onfinish = function () { item.open = false; close.cancel(); };
      } else {
        $$('.acc__item[open]').forEach(function (o) { if (o !== item) o.open = false; });
        item.open = true;
        var h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.22,.8,.2,1)' });
      }
    });
  });

  /* ---------- Vídeo: capa + botão de play, CTA no final ---------- */
  $$('[data-player]').forEach(function (box) {
    var video = $('video', box), end = $('.player__end', box);
    function play() {
      box.classList.add('is-playing'); end.hidden = true;
      video.controls = true;
      var pr = video.play();
      if (pr && pr.catch) pr.catch(function () { box.classList.remove('is-playing'); video.controls = false; });
      try { (window.dataLayer = window.dataLayer || []).push({ event: 'video_play', video: 'apresentacao' }); } catch (e) {}
    }
    $('.player__play', box).addEventListener('click', play);
    $('.player__replay', box).addEventListener('click', function () { video.currentTime = 0; play(); });
    video.addEventListener('ended', function () { video.controls = false; end.hidden = false; });
  });

  onScroll();
})();
