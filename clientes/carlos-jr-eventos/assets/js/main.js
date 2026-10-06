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

  /* ---------- aura que segue o mouse + grade no hero + botões magnéticos ---------- */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var aura = $("#aura"), heroBg = $(".hero-bg"), heroEl = $("#topo");
  if (aura) {
    if (fine && !reduce) {
      var tx = innerWidth * .7, ty = innerHeight * .35, ax = tx, ay = ty, moved = false;
      window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; moved = true; }, { passive: true });
      (function loop() {
        ax += (tx - ax) * .08; ay += (ty - ay) * .08;
        aura.style.transform = "translate(" + ax.toFixed(1) + "px," + ay.toFixed(1) + "px)";
        if (heroBg) {
          var r = heroEl.getBoundingClientRect();
          heroBg.style.setProperty("--gx", (ax - r.left).toFixed(1) + "px");
          heroBg.style.setProperty("--gy", (ay - r.top).toFixed(1) + "px");
        }
        requestAnimationFrame(loop);
      })();
      $$(".spot").forEach(function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          el.style.setProperty("--mx", (e.clientX - r.left) + "px");
          el.style.setProperty("--my", (e.clientY - r.top) + "px");
        });
      });
      $$(".magnetic").forEach(function (btn) {
        btn.addEventListener("pointermove", function (e) {
          var r = btn.getBoundingClientRect();
          btn.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .16).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * .26).toFixed(1) + "px)";
        });
        btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
      });
    } else {
      aura.classList.add("idle");
      if (heroBg) { heroBg.style.setProperty("--gx", "70%"); heroBg.style.setProperty("--gy", "40%"); }
    }
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

  /* ---------- painel de LED interativo ---------- */
  var demo = $("#ledDemo");
  if (demo) {
    var dc = demo.getContext("2d"), ds, cols, rows, mask, off = document.createElement("canvas"), oc = off.getContext("2d");
    var mode = "gold", text = "SEU EVENTO EM GRANDE ESCALA   •   CARLOS JR EVENTOS   •   ";
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

    var glow = { gold: "rgba(214,176,107,.32)", white: "rgba(243,240,233,.22)", blue: "rgba(79,123,255,.4)" };
    var frame = $("#ledFrame");
    $$(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.dataset.mode;
        $$(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        frame.style.setProperty("--glow", glow[mode]);
      });
    });
    frame.style.setProperty("--glow", glow.gold);

    var solid = { gold: [214, 176, 107], white: [243, 240, 233], blue: [79, 123, 255] };
    runWhileVisible(demo, function (t) {
      if (!mask) return;
      var cell = demo._cell, sz = cell * .74, pad = (cell - sz) / 2, shift = reduce ? 6 : Math.floor(t * 26);
      dc.fillStyle = "#020203"; dc.fillRect(0, 0, ds.w, ds.h);
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var sx = (x + shift) % textW;
          var on = mask[(y * textW + sx) * 4 + 3] > 120;
          var c = solid[mode];
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
