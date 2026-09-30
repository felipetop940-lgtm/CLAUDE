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
  var map = $('[data-map]'); if (map && SITE.endereco) map.href = SITE.endereco.mapa;
  if (SITE.instagram) $$('[data-ig]').forEach(function (a) {
    a.href = 'https://instagram.com/' + SITE.instagram;
    var h = $('[data-ig-handle]', a); if (h) h.textContent = '@' + SITE.instagram;
  });

  /* ---------- WhatsApp: cada botão leva a mensagem do seu assunto ---------- */
  var MSG = SITE.mensagens || {};
  $$('[data-wa]').forEach(function (el) {
    if (!SITE.whatsapp) return; // sem número: o botão continua levando à seção de contato
    el.href = 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(MSG[el.getAttribute('data-wa')] || MSG.padrao || '');
    el.target = '_blank'; el.rel = 'noopener';
  });

  /* ---------- Depoimentos reais (só aparecem se existirem) ---------- */
  var dep = $('#depoimentos');
  if (dep && (SITE.depoimentos || []).length) {
    SITE.depoimentos.forEach(function (d) {
      var q = doc.createElement('blockquote'), p = doc.createElement('p'), f = doc.createElement('footer'), b = doc.createElement('strong');
      q.className = 'testi reveal'; p.textContent = '“' + d.texto + '”'; b.textContent = d.nome;
      f.appendChild(b); if (d.detalhe) f.appendChild(doc.createTextNode(' · ' + d.detalhe));
      q.appendChild(p); q.appendChild(f); dep.appendChild(q);
    });
    dep.hidden = false;
  }

  /* ---------- Título do topo: palavras entram uma a uma ---------- */
  var n = 0;
  function split(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var frag = doc.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(' ')); return; }
          var w = doc.createElement('span'), i = doc.createElement('span');
          w.className = 'w'; i.textContent = part; i.style.setProperty('--d', n++); w.appendChild(i); frag.appendChild(w);
        });
        node.replaceChild(frag, c);
      } else if (c.nodeType === 1) split(c);
    });
  }
  $$('[data-split]').forEach(function (h) { h.setAttribute('aria-label', h.textContent); split(h); });

  /* ---------- Frase que acende palavra por palavra ---------- */
  var scrubWords = [];
  $$('[data-scrub]').forEach(function (el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var s = doc.createElement('span'); s.className = 'sw'; s.textContent = part; frag.appendChild(s); scrubWords.push(s);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
    el._scrub = scrubWords.slice();
  });

  /* ---------- Contadores ---------- */
  function count(el) {
    var to = +el.getAttribute('data-count'), from = to - 12, t0 = null;
    if (reduce) return;
    (function step(t) {
      t0 = t0 || t; var k = clamp((t - t0) / 1400, 0, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  /* ---------- Entradas ao rolar ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, i = $$('.reveal', el.parentNode).indexOf(el);
      el.style.transitionDelay = clamp(i, 0, 5) * 90 + 'ms';
      el.classList.add('is-in');
      $$('[data-count]', el).forEach(count);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: .12 }) : null;
  $$('.reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('is-in'); });

  // libera o título depois da abertura
  requestAnimationFrame(function () { root.classList.add('is-ready'); });

  /* ---------- Rolagem: progresso, header, frase, linhas ---------- */
  var header = $('.header'), wa = $('.wa-float'), timeline = $('[data-fill]'), steps = $('[data-steps]');
  var parallax = $$('[data-parallax]'), links = $$('.nav a[href^="#"]:not(.btn)');
  var sections = links.map(function (a) { return $(a.getAttribute('href')); });
  function progressOf(el, start, end) { // 0→1 enquanto el atravessa a tela
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh * start - r.top) / (r.height + vh * (start - end)), 0, 1);
  }
  function onScroll() {
    var sy = window.scrollY, vh = window.innerHeight, max = root.scrollHeight - vh;
    header.style.setProperty('--p', max > 0 ? sy / max : 0);
    header.classList.toggle('is-scrolled', sy > 24);
    if (wa) wa.classList.toggle('is-on', sy > vh * .6);

    $$('[data-scrub]').forEach(function (el) {
      var p = progressOf(el, .9, .45), on = Math.round(p * el._scrub.length);
      el._scrub.forEach(function (w, i) { w.classList.toggle('on', reduce || i < on); });
    });
    if (timeline) {
      var tp = progressOf(timeline, .75, .5); timeline.style.setProperty('--fill', tp);
      var items = $$('li', timeline); items.forEach(function (li, i) { li.classList.toggle('on', tp >= i / (items.length - 1) - .02); });
    }
    if (steps) {
      var sp = progressOf(steps, .8, .55); steps.style.setProperty('--fill', sp);
      var st = $$('.step', steps); st.forEach(function (s, i) { s.classList.toggle('on', sp >= i / (st.length - 1) - .02); });
    }
    if (!reduce) parallax.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect(), k = +img.getAttribute('data-parallax');
      img.style.transform = 'translateY(' + ((r.top + r.height / 2 - vh / 2) * -k - r.height * .09) + 'px)';
    });
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

  /* ---------- Interações de mouse (só em computador) ---------- */
  if (!finePointer || reduce) return;

  // topo: foto, anel e selos acompanham o mouse em profundidades diferentes; a luz de fundo segue o cursor
  var hero = $('.hero'), glow = $('.hero__glow'), layers = $$('[data-depth]');
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

  // certificado: inclinação 3D com reflexo
  $$('[data-tilt]').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, yy = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', (x - .5) * 16 + 'deg'); el.style.setProperty('--rx', (.5 - yy) * 12 + 'deg');
      el.style.setProperty('--sx', x * 100 + '%'); el.style.setProperty('--sy', yy * 100 + '%');
    });
    el.addEventListener('mouseleave', function () { el.style.removeProperty('--ry'); el.style.removeProperty('--rx'); });
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
