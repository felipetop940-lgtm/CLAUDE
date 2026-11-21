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
  $$('[data-need]').forEach(function (el) { if (!el.getAttribute('data-need').split('|').some(get)) el.hidden = true; });
  var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
  var end = SITE.endereco || {};
  $$('[data-map]').forEach(function (a) { if (end.mapa) a.href = end.mapa; });
  var frame = $('.map__frame'); if (frame && end.mapaEmbed) { frame.src = end.mapaEmbed; frame.hidden = false; }
  if (SITE.instagram) $$('[data-ig]').forEach(function (a) {
    a.href = 'https://instagram.com/' + SITE.instagram;
    var h = $('[data-ig-handle]', a); if (h) h.textContent = '@' + SITE.instagram;
  });
  var reg = [SITE.crm, SITE.rqe].filter(Boolean).join(' · ');
  var crm = $('.js-crm'); if (crm) crm.textContent = reg;
  $$('.js-reg').forEach(function (el) { el.textContent = 'Médica · Nutrologia' + (reg ? ' · ' + reg : ''); });
  var rf = $('.js-reg-foot'); if (rf && reg) rf.textContent = 'Responsável técnica: Dra. Andressa Oliveira · ' + reg;
  var num = $('.js-wa-num'); if (num && SITE.whatsapp) {
    var d = String(SITE.whatsapp).replace(/\D/g, '').replace(/^55/, '');
    num.textContent = d.length >= 10 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, -4) + '-' + d.slice(-4) : SITE.whatsapp;
  }
  // Números reais, se existirem, substituem os pilares do topo
  var pil = $('[data-pillars]');
  if (pil && (SITE.numeros || []).length) {
    pil.innerHTML = '';
    SITE.numeros.slice(0, 3).forEach(function (n) {
      var li = doc.createElement('li'), s = doc.createElement('strong'), sp = doc.createElement('span');
      s.textContent = n.valor; sp.textContent = n.rotulo; li.appendChild(s); li.appendChild(sp); pil.appendChild(li);
    });
  }

  /* ---------- WhatsApp: cada botão leva a mensagem do seu assunto ---------- */
  var MSG = SITE.mensagens || {};
  $$('[data-wa]').forEach(function (el) {
    var msg = encodeURIComponent(MSG[el.getAttribute('data-wa')] || MSG.padrao || '');
    if (SITE.whatsappLink) {
      var l = SITE.whatsappLink;
      el.href = /wa\.me\/\d+\/?$/.test(l) ? l.replace(/\/$/, '') + '?text=' + msg : l;
    } else if (SITE.whatsapp) {
      el.href = 'https://wa.me/' + String(SITE.whatsapp).replace(/\D/g, '') + '?text=' + msg;
    } else return; // sem número: o botão leva à seção de contato
    el.target = '_blank'; el.rel = 'noopener';
  });

  /* ---------- Título do topo: palavras sobem uma a uma ---------- */
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

  /* ---------- Frases que acendem palavra por palavra ---------- */
  $$('[data-scrub]').forEach(function (el) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var s = doc.createElement('span'); s.className = 'sw'; s.textContent = part; frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
    el._scrub = words;
  });

  /* ---------- Abertura → entrada do topo ---------- */
  var started = false;
  function start() {
    if (started) return; started = true;
    root.classList.add('is-loaded');
    setTimeout(function () { root.classList.add('is-ready'); }, reduce ? 0 : 380);
  }
  if (reduce) start();
  else {
    var t0 = Date.now();
    var go = function () { setTimeout(start, Math.max(0, 1500 - (Date.now() - t0))); };
    if (doc.readyState === 'complete') go(); else window.addEventListener('load', go);
    setTimeout(start, 2800); // nunca prende a pessoa na abertura
  }

  /* ---------- Entradas ao rolar ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, i = $$('.reveal', el.parentNode).indexOf(el);
      el.style.transitionDelay = clamp(i, 0, 5) * 90 + 'ms';
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 }) : null;
  $$('.reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('is-in'); });

  /* ---------- Rolagem: progresso, header, frases, etapas, parallax ---------- */
  var header = $('.header'), bar = $('.progress'), wa = $('.wa-float'), waBar = $('.wa-bar'), steps = $('[data-steps]');
  var parallax = $$('[data-parallax]'), scrubs = $$('[data-scrub]'), hero = $('.hero');
  var links = $$('.nav a[href^="#"]:not(.btn)'), sections = links.map(function (a) { return $(a.getAttribute('href')); });
  function progressOf(el, start, end) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh * start - r.top) / (r.height + vh * (start - end)), 0, 1);
  }
  function onScroll() {
    var sy = window.scrollY, vh = window.innerHeight, max = root.scrollHeight - vh;
    if (bar) bar.style.setProperty('--p', max > 0 ? sy / max : 0);
    header.classList.toggle('is-scrolled', sy > 24);
    var past = sy > vh * .5;
    if (wa) wa.classList.toggle('is-on', past);
    if (waBar) waBar.classList.toggle('is-on', past && (max - sy) > 120);

    scrubs.forEach(function (el) {
      var p = progressOf(el, .92, .5), on = Math.round(p * el._scrub.length * 1.15);
      el._scrub.forEach(function (w, i) { w.classList.toggle('on', reduce || i < on); });
    });
    if (steps) {
      var sp = progressOf(steps, .78, .5); steps.style.setProperty('--fill', reduce ? 1 : sp);
      var st = $$('.step', steps); st.forEach(function (s, i) { s.classList.toggle('on', reduce || sp >= i / (st.length - 1) - .02); });
    }
    if (!reduce) parallax.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect(), k = +img.getAttribute('data-parallax');
      if (r.bottom < 0 || r.top > vh) return;
      img.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -k - r.height * .08) + 'px,0)';
    });
    var cur = -1; sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * .4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
    heroVisible = hero.getBoundingClientRect().bottom > 0;
  }
  var ticking = false, heroVisible = true;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { onScroll(); ticking = false; }); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Menu mobile ---------- */
  var burger = $('#burger'), nav = $('#nav');
  function closeNav() { root.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menu'); }
  burger.addEventListener('click', function () {
    var open = !root.classList.contains('nav-open');
    root.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });

  /* ---------- Dúvidas: abre e fecha com suavidade ---------- */
  $$('.qa').forEach(function (d) {
    var sum = $('summary', d), body = $('.qa__a', d), anim = null;
    sum.addEventListener('click', function (e) {
      if (reduce || !body.animate) return;
      e.preventDefault();
      if (anim) anim.cancel();
      if (!d.open) {
        $$('.qa[open]').forEach(function (o) { if (o !== d) $('summary', o).click(); });
        d.open = true;
        var h = body.scrollHeight;
        anim = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 550, easing: 'cubic-bezier(.22,.8,.2,1)' });
      } else {
        var h2 = body.scrollHeight;
        anim = body.animate([{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)' });
        anim.onfinish = function () { d.open = false; };
      }
    });
  });

  /* ---------- Carrossel: setas, bolinhas, arrastar com o dedo ou o mouse ---------- */
  var car = $('[data-carousel]'), track = car && $('[data-arts]', car), dots = car ? $$('[data-dots] button', car) : [];
  var prev = car && $('[data-prev]', car), next = car && $('[data-next]', car), dragged = false;
  function items() { return $$('.art', track); }
  function current() {
    var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
    items().forEach(function (it, i) { var c = it.offsetLeft + it.offsetWidth / 2, dd = Math.abs(c - mid); if (dd < bd) { bd = dd; best = i; } });
    return best;
  }
  function goTo(i) {
    var its = items(); i = clamp(i, 0, its.length - 1);
    var it = its[i];
    track.scrollTo({ left: it.offsetLeft - (track.clientWidth - it.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  function sync() {
    var c = current(), max = track.scrollWidth - track.clientWidth;
    dots.forEach(function (d, i) { d.classList.toggle('on', i === c); });
    if (prev) prev.disabled = track.scrollLeft < 8;
    if (next) next.disabled = track.scrollLeft > max - 8;
  }
  if (track) {
    track.addEventListener('scroll', function () { requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', sync);
    prev.addEventListener('click', function () { goTo(current() - 1); });
    next.addEventListener('click', function () { goTo(current() + 1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });
    // arrastar com o mouse (no toque o navegador já rola sozinho)
    var down = false, sx = 0, sl = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || track.scrollWidth <= track.clientWidth) return;
      down = true; dragged = false; sx = e.clientX; sl = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { dragged = true; track.classList.add('is-drag'); }
      if (dragged) track.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (dragged) { track.classList.remove('is-drag'); goTo(current()); setTimeout(function () { dragged = false; }, 50); }
    });
    sync();
  }

  /* ---------- Resultados: ampliar ---------- */
  var lb = $('.lightbox'), lbImg = lb && $('img', lb), lastFocus = null, zooms = $$('[data-zoom]'), lbIdx = 0;
  function showLb(i) { lbIdx = (i + zooms.length) % zooms.length; var b = zooms[lbIdx]; lbImg.src = b.getAttribute('data-zoom'); lbImg.alt = $('img', b).alt; }
  function closeLb() { lb.hidden = true; root.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  zooms.forEach(function (b, i) {
    b.addEventListener('click', function (e) {
      if (dragged) { e.preventDefault(); return; }
      lastFocus = b; showLb(i); lb.hidden = false; root.style.overflow = 'hidden'; $('.lightbox__close', lb).focus();
    });
  });
  if (lb) {
    $$('[data-lb]', lb).forEach(function (bt) { bt.addEventListener('click', function (e) { e.stopPropagation(); showLb(lbIdx + +bt.getAttribute('data-lb')); }); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lightbox__close')) closeLb(); });
    doc.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') showLb(lbIdx + 1);
      if (e.key === 'ArrowLeft') showLb(lbIdx - 1);
    });
    var tx = null;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 40) showLb(lbIdx + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- Interações finas (só com mouse) ---------- */
  if (finePointer && !reduce) {
    // Botões magnéticos
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * .18 + 'px,' + (e.clientY - r.top - r.height / 2) * .28 + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
    // Inclinação 3D suave nas fotos
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, yy = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(1200px) rotateY(' + x * 5 + 'deg) rotateX(' + -yy * 5 + 'deg)';
      });
      el.addEventListener('mouseleave', function () { el.style.transition = 'transform .9s cubic-bezier(.22,.8,.2,1)'; el.style.transform = ''; setTimeout(function () { el.style.transition = ''; }, 900); });
    });
    // Luz dourada que segue o cursor nos cards
    $$('.card').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    // Foto do topo acompanha levemente o cursor
    var hp = $('.hero__photo img');
    hero.addEventListener('mousemove', function (e) {
      if (!root.classList.contains('is-ready')) return;
      var x = e.clientX / window.innerWidth - .5, yy = e.clientY / window.innerHeight - .5;
      hp.style.transform = 'scale(1.04) translate(' + x * -10 + 'px,' + yy * -8 + 'px)';
    });
  }

  /* ---------- Partículas douradas no topo ---------- */
  var cv = $('.hero__dust');
  if (cv && cv.getContext && !reduce) {
    var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, parts = [];
    var resize = function () {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(clamp(W * H / 26000, 18, 55));
      parts = []; for (var i = 0; i < count; i++) parts.push(seed(true));
    };
    var seed = function (any) {
      return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: Math.random() * 1.5 + .4, vy: Math.random() * .22 + .06, vx: (Math.random() - .5) * .12, a: Math.random() * .5 + .15, t: Math.random() * 6.28, s: Math.random() * .015 + .005 };
    };
    var tick = function () {
      if (heroVisible) {
        ctx.clearRect(0, 0, W, H);
        parts.forEach(function (p, i) {
          p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * .08; p.t += p.s;
          if (p.y < -10) parts[i] = seed(false);
          var al = p.a * (.55 + .45 * Math.sin(p.t * 2));
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, 'rgba(240,214,160,' + al + ')'); g.addColorStop(1, 'rgba(240,214,160,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
        });
      }
      requestAnimationFrame(tick);
    };
    resize(); window.addEventListener('resize', resize); requestAnimationFrame(tick);
  }
})();
