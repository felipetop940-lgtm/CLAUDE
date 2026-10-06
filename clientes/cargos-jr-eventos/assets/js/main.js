(function () {
  "use strict";
  var S = window.SITE || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- WhatsApp / Instagram ---------- */
  var num = String(S.whatsapp || "").replace(/\D/g, "");
  function wa(text) {
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(text || S.mensagem || "");
  }
  $$("[data-wa]").forEach(function (a) {
    a.href = wa(S.mensagem);
    a.target = "_blank";
    a.rel = "noopener";
  });
  if (num.length >= 12) {
    var d = num.slice(2);
    var lbl = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
    $$('[data-fill="wa-label"]').forEach(function (e) { e.textContent = lbl; });
  }
  var ig = String(S.instagram || "").replace(/^@/, "");
  $$("[data-ig]").forEach(function (a) {
    if (ig) { a.href = "https://instagram.com/" + ig; a.target = "_blank"; a.rel = "noopener"; }
    else { a.href = "#contato"; }
  });
  if (ig) $$('[data-fill="ig-label"]').forEach(function (e) { e.textContent = "@" + ig; });
  if (S.cidade) $$('[data-fill="cidade"]').forEach(function (e) { e.textContent = S.cidade; });
  var ano = $("#ano"); if (ano) ano.textContent = new Date().getFullYear();

  var form = $("#form");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    if (!f.nome.value.trim()) { f.nome.focus(); return; }
    var dt = f.data.value ? f.data.value.split("-").reverse().join("/") : "a combinar";
    var t = "Olá! Meu nome é " + f.nome.value.trim() + ".\n" +
      "Quero orçamento para: " + f.tipo.value + "\n" +
      "Data: " + dt + "\n" +
      "Local: " + (f.local.value.trim() || "a combinar") +
      (f.msg.value.trim() ? "\n" + f.msg.value.trim() : "");
    window.open(wa(t), "_blank", "noopener");
  });

  /* ---------- menu e nav ---------- */
  var nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 24); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  burger.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  $$("a", menu).forEach(function (a) {
    a.addEventListener("click", function () { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); });
  });

  /* ---------- revelar ao rolar ---------- */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* ---------- faixa: duplica para loop contínuo ---------- */
  var tk = $("#ticker");
  if (tk) tk.innerHTML += tk.innerHTML;

  /* ---------- brilho que segue o mouse nos cards ---------- */
  $$(".card").forEach(function (c) {
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- cores ---------- */
  var PAL = [[229, 51, 47], [255, 178, 31], [214, 176, 107], [47, 107, 255], [229, 51, 47]];
  function grad(t) {
    t = ((t % 1) + 1) % 1;
    var p = t * (PAL.length - 1), i = Math.floor(p), f = p - i, a = PAL[i], b = PAL[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  /* ---------- helper: roda só enquanto está na tela ---------- */
  function runWhileVisible(el, draw) {
    var visible = true, raf = 0, last = 0;
    function loop(ts) {
      if (!visible) { raf = 0; return; }
      draw(ts / 1000, Math.min(.05, last ? (ts - last) / 1000 : .016));
      last = ts; raf = requestAnimationFrame(loop);
    }
    if (reduce) { draw(2.2, 0); return; }
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    }).observe(el);
  }
  function fit(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var r = cv.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    return { w: cv.width, h: cv.height, dpr: dpr };
  }

  /* ---------- LED do hero: ondas de luz numa matriz de pontos ---------- */
  var hero = $("#heroLed");
  if (hero) {
    var hc = hero.getContext("2d"), hs;
    var size = function () { hs = fit(hero); }; size();
    window.addEventListener("resize", size);
    runWhileVisible(hero, function (t) {
      var cell = (window.innerWidth < 760 ? 16 : 22) * hs.dpr, r = cell * .2;
      var cols = Math.ceil(hs.w / cell), rows = Math.ceil(hs.h / cell);
      hc.clearRect(0, 0, hs.w, hs.h);
      var sweep = ((t * .09) % 1.4 - .2) * cols;
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var v = .5 + .5 * Math.sin(x * .22 + t * 1.05) * Math.sin(y * .27 - t * .8);
          var s = Math.exp(-Math.pow((x - sweep) / 5, 2));
          var a = .05 + .5 * v * v * v + .55 * s;
          var c = grad(x / cols * .8 + t * .02 + y / rows * .1);
          hc.fillStyle = "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + Math.min(a, .95).toFixed(3) + ")";
          hc.beginPath(); hc.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, 6.2832); hc.fill();
        }
      }
    });
  }

  /* ---------- painel de LED interativo ---------- */
  var demo = $("#ledDemo");
  if (demo) {
    var dc = demo.getContext("2d"), ds, cols, rows, mask, off = document.createElement("canvas"), oc = off.getContext("2d");
    var mode = "show", text = "SEU EVENTO EM GRANDE ESCALA   •   SHOWS   •   FESTAS   •   CORPORATIVO   •   ";
    var textW = 0;
    function build() {
      ds = fit(demo);
      var cell = Math.max(6, Math.round((window.innerWidth < 760 ? 7 : 9) * ds.dpr));
      cols = Math.floor(ds.w / cell); rows = Math.floor(ds.h / cell);
      demo._cell = cell;
      off.height = rows;
      oc.font = "800 " + Math.round(rows * .5) + 'px "Inter Tight", Arial, sans-serif';
      textW = Math.ceil(oc.measureText(text).width);
      off.width = textW;
      oc.font = "800 " + Math.round(rows * .5) + 'px "Inter Tight", Arial, sans-serif';
      oc.textBaseline = "middle"; oc.fillStyle = "#fff";
      oc.clearRect(0, 0, off.width, off.height);
      oc.fillText(text, 0, rows / 2 + rows * .03);
      mask = oc.getImageData(0, 0, textW, rows).data;
    }
    var start = function () { build(); };
    (document.fonts && document.fonts.load ? document.fonts.load('800 20px "Inter Tight"') : Promise.resolve()).then(start, start);
    window.addEventListener("resize", function () { if (mask) build(); });

    var glow = { show: "rgba(214,176,107,.35)", red: "rgba(229,51,47,.45)", blue: "rgba(47,107,255,.45)", gold: "rgba(255,178,31,.4)" };
    var frame = $("#ledFrame");
    $$(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.dataset.mode;
        $$(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        frame.style.setProperty("--glow", glow[mode]);
      });
    });
    frame.style.setProperty("--glow", glow.show);

    var solid = { red: [229, 51, 47], blue: [47, 107, 255], gold: [255, 190, 60] };
    runWhileVisible(demo, function (t) {
      if (!mask) return;
      var cell = demo._cell, sz = cell * .74, pad = (cell - sz) / 2, shift = reduce ? 6 : Math.floor(t * 26);
      dc.fillStyle = "#020203"; dc.fillRect(0, 0, ds.w, ds.h);
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var sx = (x + shift) % textW;
          var on = mask[(y * textW + sx) * 4 + 3] > 120;
          var c = mode === "show" ? grad(x / cols * .9 + t * .05) : solid[mode];
          var bright = .75 + .25 * (1 - y / rows);
          if (on) {
            dc.fillStyle = "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ",.16)";
            dc.fillRect(x * cell - cell * .3, y * cell - cell * .3, cell * 1.6, cell * 1.6);
            dc.fillStyle = "rgba(" + ((c[0] * bright + 40) | 0) + "," + ((c[1] * bright + 40) | 0) + "," + ((c[2] * bright + 40) | 0) + ",1)";
          } else {
            dc.fillStyle = "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ",.07)";
          }
          dc.fillRect(x * cell + pad, y * cell + pad, sz, sz);
        }
      }
    });
  }

  /* ---------- vídeo ---------- */
  var vf = $("#vframe"), vid = $("#vid"), cover = $("#vcover");
  if (vf && vid) {
    var src = $("source", vid);
    function empty() { vf.classList.add("empty"); }
    if (src) src.addEventListener("error", empty);
    cover.addEventListener("click", function () {
      if (vf.classList.contains("empty")) return;
      vid.controls = true;
      vf.classList.add("playing");
      var p = vid.play(); if (p && p.catch) p.catch(function () { vf.classList.remove("playing"); vid.controls = false; });
    });
    vid.addEventListener("ended", function () { vf.classList.remove("playing"); vid.controls = false; });
  }
})();
