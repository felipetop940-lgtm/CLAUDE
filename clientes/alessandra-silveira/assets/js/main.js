(function () {
  'use strict';
  var doc = document, root = doc.documentElement, SITE = window.SITE || {};
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var get = function (path) { return path.split('.').reduce(function (o, k) { return o ? o[k] : ''; }, SITE); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  /* ---------- Dados do config.js ---------- */
  $$('[data-f]').forEach(function (el) { el.textContent = get(el.getAttribute('data-f')) || ''; });
  $$('[data-need]').forEach(function (el) { if (!get(el.getAttribute('data-need'))) el.hidden = true; });
  var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
  var end = SITE.endereco || {};
  $$('[data-map]').forEach(function (a) { if (end.mapa) a.href = end.mapa; });
  var frame = $('[data-embed]'); if (frame && end.embed) frame.src = end.embed;
  if (SITE.instagram) $$('[data-ig]').forEach(function (a) {
    a.href = 'https://instagram.com/' + SITE.instagram; a.target = '_blank'; a.rel = 'noopener';
    var h = $('[data-ig-handle]', a); if (h) h.textContent = '@' + SITE.instagram;
  });

  /* ---------- WhatsApp: cada botão leva a mensagem do seu assunto ---------- */
  var MSG = SITE.mensagens || {};
  $$('[data-wa]').forEach(function (el) {
    if (!SITE.whatsapp) return; // sem número: o botão continua levando à seção de contato
    el.href = 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(MSG[el.getAttribute('data-wa')] || MSG.padrao || '');
    el.target = '_blank'; el.rel = 'noopener';
  });

  /* ---------- Título do topo: palavras sobem uma a uma ---------- */
  function words(node, make) {
    Array.prototype.slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var frag = doc.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          frag.appendChild(/^\s+$/.test(part) ? doc.createTextNode(' ') : make(part));
        });
        node.replaceChild(frag, c);
      } else if (c.nodeType === 1) words(c, make);
    });
  }
  var n = 0;
  $$('[data-split]').forEach(function (h) {
    h.setAttribute('aria-label', h.textContent);
    words(h, function (part) {
      var w = doc.createElement('span'), i = doc.createElement('span');
      w.className = 'w'; w.setAttribute('aria-hidden', 'true'); i.textContent = part; i.style.setProperty('--d', n++); w.appendChild(i); return w;
    });
  });

  /* ---------- Frase que acende palavra por palavra ---------- */
  $$('[data-scrub]').forEach(function (el) {
    var list = [];
    words(el, function (part) { var s = doc.createElement('span'); s.className = 'sw'; s.textContent = part; list.push(s); return s; });
    el._scrub = list;
  });

  /* ---------- Entradas ao rolar ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      if (!el.closest('.hero')) el.style.transitionDelay = clamp($$('.reveal', el.parentNode).indexOf(el), 0, 5) * 90 + 'ms';
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 }) : null;
  $$('.reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('is-in'); });
  requestAnimationFrame(function () { root.classList.add('is-ready'); });

  /* ---------- Rolagem: progresso, header, frase, iceberg, menu ativo ---------- */
  var header = $('.header'), hero = $('.hero'), berg = $('[data-berg]');
  var bergItems = berg ? $$('.berg__list li', berg) : [];
  var links = $$('.nav a[href^="#"]:not(.btn)');
  var sections = links.map(function (a) { return $(a.getAttribute('href')); });
  function progressOf(el, start, end) { // 0→1 enquanto el atravessa a tela
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh * start - r.top) / (r.height + vh * (start - end)), 0, 1);
  }
  function onScroll() {
    var sy = window.scrollY, vh = window.innerHeight, max = root.scrollHeight - vh;
    header.style.setProperty('--p', max > 0 ? sy / max : 0);
    header.classList.toggle('is-scrolled', sy > 24);
    root.classList.toggle('past-hero', sy > hero.offsetHeight * .55);
    $$('[data-scrub]').forEach(function (el) {
      var on = Math.round(progressOf(el, .9, .45) * el._scrub.length);
      el._scrub.forEach(function (w, i) { w.classList.toggle('on', reduce || i < on); });
    });
    if (berg) { // as áreas "emergem" uma a uma conforme o iceberg sobe na tela
      var bp = progressOf(berg, .95, .55);
      bergItems.forEach(function (li, i) { li.classList.toggle('on', reduce || bp > i / bergItems.length * .85 + .05); });
    }
    var cur = -1; sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * .4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
  }
  var ticking = false;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { onScroll(); ticking = false; }); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Menu mobile ---------- */
  var burger = $('#burger'), nav = $('#nav');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Serviços: abas com pílula deslizante ---------- */
  var tabs = $$('.tabs__btn'), pill = $('.tabs__pill');
  $$('.panel__list').forEach(function (ul) { $$('li', ul).forEach(function (li, i) { li.style.setProperty('--k', i); }); });
  function movePill() {
    var t = $('.tabs__btn[aria-selected="true"]'); if (!t) return;
    pill.style.width = t.offsetWidth + 'px'; pill.style.transform = 'translateX(' + t.offsetLeft + 'px)';
  }
  function select(t) {
    tabs.forEach(function (b) {
      var on = b === t, p = $('#' + b.getAttribute('aria-controls'));
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      p.hidden = !on; p.classList.toggle('is-on', on);
    });
    movePill();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return;
      var nx = tabs[(i + k + tabs.length) % tabs.length]; select(nx); nx.focus();
    });
  });
  movePill(); window.addEventListener('resize', movePill);
  if (doc.fonts) doc.fonts.ready.then(movePill);

  /* ---------- Dúvidas: abre com animação, uma por vez ---------- */
  $$('.acc__item').forEach(function (d) {
    var body = $('.acc__body', d);
    $('summary', d).addEventListener('click', function (e) {
      if (reduce || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = function () { d.open = false; };
      } else {
        $$('.acc__item[open]').forEach(function (o) { if (o !== d) o.open = false; });
        d.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* ---------- Rede neural no fundo do topo ---------- */
  var cv = $('.hero__net'), ctx = cv && cv.getContext && cv.getContext('2d');
  if (ctx) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, nodes = [], mouse = { x: -999, y: -999 }, running = false, raf;
    var size = function () {
      W = cv.offsetWidth; H = cv.offsetHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(clamp(W * H / 16000, 22, 70)); nodes = [];
      for (var i = 0; i < count; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: Math.random() * 1.6 + 1 });
    };
    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      var LINK = 150;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        if (!reduce) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1;
          var mx = mouse.x - a.x, my = mouse.y - a.y, md = mx * mx + my * my;
          if (md < 32000) { a.x += mx * .004; a.y += my * .004; }
        }
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) { ctx.strokeStyle = 'rgba(92,115,86,' + (1 - d / LINK) * .28 + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        var near = (mouse.x - a.x) * (mouse.x - a.x) + (mouse.y - a.y) * (mouse.y - a.y) < 20000;
        ctx.fillStyle = near ? 'rgba(176,141,87,.85)' : 'rgba(92,115,86,.45)';
        ctx.beginPath(); ctx.arc(a.x, a.y, near ? a.r + 1 : a.r, 0, 6.283); ctx.fill();
      }
      if (running && !reduce) raf = requestAnimationFrame(draw);
    };
    size(); draw();
    window.addEventListener('resize', function () { size(); if (!running) draw(); });
    if ('IntersectionObserver' in window && !reduce) new IntersectionObserver(function (en) {
      running = en[0].isIntersecting; cancelAnimationFrame(raf); if (running) draw();
    }).observe(hero);
    hero.addEventListener('mousemove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -999; });
  }

  /* ---------- Interações de mouse (só em computador) ---------- */
  if (!finePointer || reduce) return;

  // topo: foto, órbita e selos acompanham o mouse em profundidades diferentes; a luz segue o cursor
  var glow = $('.hero__glow'), layers = $$('[data-depth]');
  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, yy = (e.clientY - r.top) / r.height - .5;
    layers.forEach(function (l) { var d = +l.getAttribute('data-depth'); l.style.transform = 'translate(' + x * d + 'px,' + yy * d + 'px)'; });
    glow.style.setProperty('--gx', (x + .5) * 100 + '%'); glow.style.setProperty('--gy', (yy + .5) * 100 + '%');
  });
  hero.addEventListener('mouseleave', function () { layers.forEach(function (l) { l.style.transform = ''; }); });

  // contato: luz segue o cursor
  var contact = $('.contact'), cglow = $('.contact__glow');
  contact.addEventListener('mousemove', function (e) {
    var r = contact.getBoundingClientRect();
    cglow.style.setProperty('--gx', (e.clientX - r.left) / r.width * 100 + '%'); cglow.style.setProperty('--gy', (e.clientY - r.top) / r.height * 100 + '%');
  });

  // cards: brilho que acompanha o cursor
  $$('.card').forEach(function (c) {
    c.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

  // botões magnéticos
  $$('.magnetic').forEach(function (b) {
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * .22 + 'px,' + (e.clientY - r.top - r.height / 2) * .3 + 'px)';
    });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });
})();
