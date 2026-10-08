(function () {
  "use strict";
  var S = window.SITE || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  function hs(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }

  /* ================= dados do cliente ================= */
  var num = String(S.whatsapp || "").replace(/\D/g, "");
  function wa(text) { return "https://wa.me/" + num + "?text=" + encodeURIComponent(text || S.mensagem || ""); }
  $$("[data-wa]").forEach(function (a) { a.href = wa(a.dataset.msg || S.mensagem); a.target = "_blank"; a.rel = "noopener"; });
  if (num.length >= 12) {
    var d = num.slice(2);
    $$('[data-fill="wa-label"]').forEach(function (e) { e.textContent = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4); });
  }
  var ig = String(S.instagram || "").replace(/^@/, "");
  if (ig) {
    $$("[data-ig]").forEach(function (a) { a.href = "https://instagram.com/" + ig; a.target = "_blank"; a.rel = "noopener"; a.hidden = false; });
    $$('[data-fill="ig-label"]').forEach(function (e) { e.textContent = "@" + ig; });
  }
  if (S.cidade) $$('[data-fill="cidade"]').forEach(function (e) { e.textContent = S.cidade; });
  var ano = $("#ano"); if (ano) ano.textContent = new Date().getFullYear();

  /* ================= menu e nav ================= */
  var nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 24); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  burger.addEventListener("click", function () { burger.setAttribute("aria-expanded", menu.classList.toggle("open")); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }); });

  /* ================= revelar ao rolar ================= */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* ================= luz amarela que segue o mouse ================= */
  var pool = $("#fxPool");
  var ptr = { x: innerWidth * .7, y: innerHeight * .35 }, sp = { x: ptr.x, y: ptr.y };
  if (fine) window.addEventListener("pointermove", function (e) { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });
  (function loop(ts) {
    var t = ts / 1000;
    if (!fine || reduce) { ptr.x = innerWidth * (.5 + .32 * Math.sin(t * .22)); ptr.y = innerHeight * (.4 + .2 * Math.sin(t * .31)); }
    sp.x += (ptr.x - sp.x) * .08; sp.y += (ptr.y - sp.y) * .08;
    pool.style.transform = "translate(" + sp.x.toFixed(1) + "px," + sp.y.toFixed(1) + "px)";
    if (!reduce) requestAnimationFrame(loop);
  })(0);

  if (fine && !reduce) $$(".magnetic").forEach(function (btn) {
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      btn.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .16).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * .26).toFixed(1) + "px)";
    });
    btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
  });

  /* ================= vídeos com capa ================= */
  var frames = $$(".vframe[data-src]");
  frames.forEach(function (vf) {
    var vid = $("video", vf), cover = $(".vcover", vf);
    vid.addEventListener("error", function () { vf.classList.add("empty"); });
    cover.addEventListener("click", function () {
      if (!vid.src) vid.src = vf.dataset.src;
      if (vf.classList.contains("empty")) return;
      frames.forEach(function (o) { if (o !== vf) { var ov = $("video", o); ov.pause(); o.classList.remove("playing"); ov.controls = false; } });
      vid.controls = true; vf.classList.add("playing");
      var p = vid.play(); if (p && p.catch) p.catch(function () { vf.classList.remove("playing"); vid.controls = false; });
    });
    vid.addEventListener("ended", function () { vf.classList.remove("playing"); vid.controls = false; });
  });

  /* ================= monte seu palco ================= */
  var plan = $("#plan");
  if (plan) (function () {
    var st = { tipo: "Show", publico: 2, ambiente: "Interno", itens: { led: true, truss: true, palco: true, roof: false, sound: true, luz: true } };
    var NS = "http://www.w3.org/2000/svg", COUNT = [16, 44, 90], SCALE = [.85, 1.15, 1.5], PUB = ["Até 200 pessoas", "200 a 1.000 pessoas", "Mais de 1.000 pessoas"];
    var el = function (tag, at) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; };
    var lights = $("#lights", plan), crowdG = $("#crowd", plan), heads = [];
    for (var i = 0; i < 5; i++) {
      var lx = 150 + i * 85;
      lights.appendChild(el("polygon", { points: lx + ",108 " + (lx - 46) + ",286 " + (lx + 46) + ",286", fill: "url(#bm)" }));
      lights.appendChild(el("circle", { cx: lx, cy: 108, r: 5, fill: "#f0d9a4" }));
    }
    var order = []; for (var j = 0; j < 90; j++) order.push({ j: j, k: hs(j * 1.91) });
    order.sort(function (p, q) { return p.k - q.k; });
    var rank = {}; order.forEach(function (o, idx) { rank[o.j] = idx; });
    for (var row = 0; row < 3; row++) for (var c = 0; c < 30; c++) {
      var jj = row * 30 + c, cx = 36 + c * 19.2 + (row % 2) * 8 + (hs(jj) - .5) * 5, cy = 334 + row * 15;
      var h = el("circle", { cx: cx.toFixed(1), cy: cy, r: 4.4, fill: "#f2efe8", opacity: 0 }); h.dataset.rank = rank[jj]; crowdG.appendChild(h); heads.push(h);
    }
    function render() {
      var s = SCALE[st.publico - 1], bottom = st.itens.palco ? 286 : 316;
      var led = $("#g-led", plan);
      led.style.transform = "translate(320px," + bottom + "px) scale(" + s + ")";
      led.classList.toggle("off", !st.itens.led);
      $("#g-stage", plan).classList.toggle("off", !st.itens.palco);
      $("#g-truss", plan).classList.toggle("off", !st.itens.truss);
      $("#g-lights", plan).classList.toggle("off", !(st.itens.truss && st.itens.luz));
      $("#g-sound", plan).classList.toggle("off", !st.itens.sound);
      $("#sound-in", plan).style.transform = "translateY(" + (st.itens.palco ? 0 : 30) + "px)";
      $("#g-roof", plan).classList.toggle("off", !st.itens.roof);
      var n = COUNT[st.publico - 1];
      heads.forEach(function (h) { h.setAttribute("opacity", Number(h.dataset.rank) < n ? ".3" : "0"); });
      $("#hudPub").textContent = PUB[st.publico - 1]; $("#hudAmb").textContent = st.ambiente;
    }
    $$(".opts").forEach(function (g) {
      var key = g.dataset.group, multi = g.classList.contains("multi");
      $$(".opt", g).forEach(function (b) {
        b.addEventListener("click", function () {
          if (multi) { st.itens[b.dataset.v] = !st.itens[b.dataset.v]; b.classList.toggle("on", st.itens[b.dataset.v]); }
          else {
            $$(".opt", g).forEach(function (x) { x.classList.toggle("on", x === b); });
            st[key] = key === "publico" ? Number(b.dataset.v) : b.dataset.v;
            if (key === "ambiente" && b.dataset.v === "Externo" && !st.itens.roof) { st.itens.roof = true; $('[data-v="roof"]').classList.add("on"); }
          }
          render();
        });
      });
    });
    render();
    var form = $("#form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      if (!f.nome.value.trim()) { f.nome.focus(); return; }
      var nomes = { led: "Painel de LED", truss: "Estrutura (truss)", palco: "Palco", roof: "Cobertura", sound: "Som", luz: "Iluminação" };
      var itens = Object.keys(st.itens).filter(function (k) { return st.itens[k]; }).map(function (k) { return nomes[k]; });
      var dt = f.data.value ? f.data.value.split("-").reverse().join("/") : "a combinar";
      var t = "Olá! Meu nome é " + f.nome.value.trim() + ".\nQuero orçamento para: " + st.tipo +
        "\nPúblico: " + PUB[st.publico - 1] + "\nAmbiente: " + st.ambiente +
        "\nPreciso de: " + (itens.join(", ") || "a definir") + "\nData: " + dt + "\nLocal: " + (f.local.value.trim() || "a combinar");
      window.open(wa(t), "_blank", "noopener");
    });
  })();
})();
