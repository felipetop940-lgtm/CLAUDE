(function () {
  "use strict";
  var S = window.SITE || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TAU = Math.PI * 2;
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
  $$("[data-ig]").forEach(function (a) { if (ig) { a.href = "https://instagram.com/" + ig; a.target = "_blank"; a.rel = "noopener"; a.hidden = false; } });
  if (ig) $$('[data-fill="ig-label"]').forEach(function (e) { e.textContent = "@" + ig; });
  if (S.cidade) $$('[data-fill="cidade"]').forEach(function (e) { e.textContent = S.cidade; });
  var ano = $("#ano"); if (ano) ano.textContent = new Date().getFullYear();

  if (S.video) $$("[data-needs=video], #trabalho").forEach(function (e) { e.hidden = false; });

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

  /* ================= utilitários de canvas ================= */
  function runWhileVisible(el, draw) {
    var visible = true, raf = 0, last = 0;
    function loop(ts) {
      if (!visible) { raf = 0; return; }
      draw(ts / 1000, Math.min(.05, last ? (ts - last) / 1000 : .016));
      last = ts; raf = requestAnimationFrame(loop);
    }
    if (reduce) { draw(3, 0); return; }
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    }).observe(el);
  }
  function fit(cv, maxDpr) {
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 1.5);
    var r = cv.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    return { w: cv.width, h: cv.height, dpr: dpr };
  }
  function mk(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  /* ================= refletor de palco que segue o mouse ================= */
  var fx = $(".fx"), beam = $("#fxBeam"), pool = $("#fxPool");
  var ptr = { x: innerWidth * .7, y: innerHeight * .4, seen: 0 }, sp = { x: ptr.x, y: ptr.y };
  if (fine) window.addEventListener("pointermove", function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.seen = performance.now(); }, { passive: true });
  else fx.classList.add("idle");
  var heroEl = $("#topo");
  var heroHook = null; // o LED do hero lê sp pela referência
  function fxLoop(ts) {
    var t = ts / 1000;
    if (!fine || reduce) { ptr.x = innerWidth * (.5 + .32 * Math.sin(t * .22)); ptr.y = innerHeight * (.42 + .2 * Math.sin(t * .31)); }
    sp.x += (ptr.x - sp.x) * .09; sp.y += (ptr.y - sp.y) * .09;
    pool.style.transform = "translate(" + sp.x.toFixed(1) + "px," + sp.y.toFixed(1) + "px)";
    if (fine) {
      var ox = innerWidth / 2, oy = -30, dx = sp.x - ox, dy = sp.y - oy, len = Math.hypot(dx, dy);
      beam.style.height = len.toFixed(0) + "px";
      beam.style.transform = "translate(" + (ox - 220) + "px," + oy + "px) rotate(" + (-Math.atan2(dx, dy)).toFixed(4) + "rad)";
    }
    if (!reduce) requestAnimationFrame(fxLoop);
  }
  requestAnimationFrame(fxLoop);

  /* botões magnéticos */
  if (fine && !reduce) $$(".magnetic").forEach(function (btn) {
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      btn.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .16).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * .26).toFixed(1) + "px)";
    });
    btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
  });

  /* ================= prévia da foto nos serviços ================= */
  var peek = $("#peek");
  if (peek && fine && !reduce) {
    var pimg = $("img", peek), pt = { x: 0, y: 0 }, pp = { x: 0, y: 0 }, pon = false;
    $$(".cue[data-img]").forEach(function (cue) {
      cue.addEventListener("pointerenter", function (e) { pimg.src = cue.dataset.img; pt.x = pp.x = e.clientX + 36; pt.y = pp.y = e.clientY - 170; pon = true; peek.classList.add("on"); });
      cue.addEventListener("pointermove", function (e) { pt.x = clamp(e.clientX + 36, 10, innerWidth - 290); pt.y = clamp(e.clientY - 170, 90, innerHeight - 340); });
      cue.addEventListener("pointerleave", function () { pon = false; peek.classList.remove("on"); });
    });
    (function pl() { pp.x += (pt.x - pp.x) * .14; pp.y += (pt.y - pp.y) * .14; if (pon || peek.classList.contains("on")) peek.style.transform = "translate(" + pp.x.toFixed(1) + "px," + pp.y.toFixed(1) + "px)"; requestAnimationFrame(pl); })();
  }

  /* ================= hero: fundo é um painel de LED que reage ao cursor ================= */
  var hero = $("#heroLed");
  if (hero) {
    var hc = hero.getContext("2d"), hs_, cols, rows, cell, inten, lvl = [];
    var setup = function () {
      hs_ = fit(hero, 1.5);
      cell = (innerWidth < 760 ? 20 : 28) * hs_.dpr;
      cols = Math.ceil(hs_.w / cell); rows = Math.ceil(hs_.h / cell);
      inten = new Float32Array(cols * rows);
    };
    setup(); window.addEventListener("resize", setup);
    for (var q = 0; q <= 12; q++) lvl.push("rgba(" + (224 + q) + "," + (128 + q * 7) + "," + (46 + q * 12) + "," + (.07 + .85 * q / 12).toFixed(2) + ")");
    runWhileVisible(hero, function (t) {
      var rect = hero.getBoundingClientRect();
      var active = performance.now() - ptr.seen < 3000 && fine;
      var mx = (sp.x - rect.left) / rect.width * hs_.w, my = (sp.y - rect.top) / rect.height * hs_.h, gain = 1;
      if (!active) { mx = hs_.w * (.5 + .4 * Math.sin(t * .45)); my = hs_.h * (.5 + .3 * Math.sin(t * .33 + 1)); gain = .7; }
      var R = cell * 5.5, x, y, i, v;
      hc.clearRect(0, 0, hs_.w, hs_.h);
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        i = y * cols + x;
        var dx = x * cell + cell / 2 - mx, dy = y * cell + cell / 2 - my, dd = Math.sqrt(dx * dx + dy * dy);
        v = dd < R ? Math.pow(1 - dd / R, 1.5) * gain : 0;
        if (v > inten[i]) inten[i] = v; else inten[i] *= .94;
        var k = inten[i], l = Math.min(12, Math.round(k * 12));
        hc.fillStyle = lvl[l];
        hc.beginPath(); hc.arc(x * cell + cell / 2, y * cell + cell / 2, cell * (.06 + .16 * k), 0, TAU); hc.fill();
      }
    });
  }

  /* ================= PAINEL DE LED: vídeos passando em alta definição ================= */
  var demo = $("#ledDemo"), glow = $("#ledGlow");
  if (demo) (function () {
    var dc = demo.getContext("2d"), gc = glow.getContext("2d");
    var W = 340, H = 170, cw, ch, cell, maskCv, S1 = 2;
    var A, B, R, SN, a, b, r, sn;
    var box = document.createElement("div");
    box.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none";
    document.body.appendChild(box);

    /* cenas: um vídeo por cena + o texto do usuário */
    var scenes = (S.painel || []).map(function (c) {
      var v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = reduce ? "auto" : "metadata";
      v.setAttribute("playsinline", ""); v.setAttribute("muted", ""); v.src = c.src;
      var sc = { kind: "video", el: v, n: c.titulo, ok: true, d: 8 };
      v.addEventListener("error", function () { sc.ok = false; });
      v.addEventListener("loadedmetadata", function () { sc.d = clamp(v.duration || 8, 5, 9); });
      box.appendChild(v);
      return sc;
    });
    scenes.push({ kind: "texto", n: "Seu texto", ok: true, d: 6 });
    var chipBox = $("#scenes");
    scenes.forEach(function (sc, i) {
      var bt = document.createElement("button");
      bt.className = "chip"; bt.dataset.scene = String(i); bt.setAttribute("aria-pressed", "false"); bt.textContent = sc.n;
      chipBox.appendChild(bt);
    });

    /* texto do usuário (cores da marca) */
    var TL, tmp, tmpc, tlc;
    function buildText() {
      var inp = $("#ledText"), txt = (inp.value || "").toUpperCase().trim() || "SEU EVENTO";
      TL = mk(W, H); tlc = TL.getContext("2d"); tmp = mk(W, H); tmpc = tmp.getContext("2d");
      var size = Math.round(H * .6), w;
      do { tlc.font = "800 " + size + 'px "Big Shoulders","Inter Tight",Impact,sans-serif'; w = tlc.measureText(txt).width; size -= 2; } while (w > W * .9 && size > 8);
      tlc.textAlign = "center"; tlc.textBaseline = "middle";
      var cy = H / 2 + size * .05, off = Math.max(2, Math.round(H / 90));
      tlc.fillStyle = "#3a1a08"; tlc.fillText(txt, W / 2 + off, cy + off);
      var gr = tlc.createLinearGradient(0, H * .18, 0, H * .82);
      gr.addColorStop(0, "#ffe6c8"); gr.addColorStop(.4, "#f9b872"); gr.addColorStop(.7, "#e0802e"); gr.addColorStop(1, "#b95f1d");
      tlc.fillStyle = gr; tlc.fillText(txt, W / 2, cy);
    }
    function sTexto(g, t) {
      var grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, "#0b0705"); grd.addColorStop(.5, "#1b0f06"); grd.addColorStop(1, "#0b0705");
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      for (var s = 0; s < 70; s++) {
        var sx = hs(s * 2.9) * W, sy = hs(s * 4.1) * H, ph = Math.sin(t * 3 + s * 1.7), z = S1 * 2;
        if (ph > .3) { g.fillStyle = "#ffe1bd"; g.fillRect(Math.round(sx), Math.round(sy), z, z); if (ph > .8) { g.fillStyle = "#e0802e"; g.fillRect(Math.round(sx - z), Math.round(sy), z, z); g.fillRect(Math.round(sx + z), Math.round(sy), z, z); g.fillRect(Math.round(sx), Math.round(sy - z), z, z); g.fillRect(Math.round(sx), Math.round(sy + z), z, z); } }
      }
      g.drawImage(TL, 0, 0);
      var sweep = (t * W * .22) % (W * 1.5) - W * .25, bw = W * .05;
      tmpc.globalCompositeOperation = "source-over"; tmpc.clearRect(0, 0, W, H); tmpc.drawImage(TL, 0, 0);
      tmpc.globalCompositeOperation = "source-atop"; tmpc.fillStyle = "rgba(255,255,255,.9)";
      tmpc.beginPath(); tmpc.moveTo(sweep, 0); tmpc.lineTo(sweep + bw, 0); tmpc.lineTo(sweep + bw - H * .3, H); tmpc.lineTo(sweep - H * .3, H); tmpc.closePath(); tmpc.fill();
      g.drawImage(tmp, 0, 0);
    }
    function sVideo(g, sc) {
      var v = sc.el;
      if (v.readyState < 2 || !v.videoWidth) { g.fillStyle = "#050505"; g.fillRect(0, 0, W, H); return; }
      var k = Math.max(W / v.videoWidth, H / v.videoHeight), sw = W / k, sh = H / k;
      g.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, W, H);
    }
    function drawScene(g, sc, t) { if (sc.kind === "video") sVideo(g, sc); else sTexto(g, t); }

    /* tamanho, máscara de LED, pipeline */
    var STEP = 2;
    function layout() {
      var s = fit(demo, 2); cw = s.w; ch = s.h;
      var cols = innerWidth < 760 ? 380 : 700;
      cell = cw / cols; W = cols; H = Math.max(40, Math.round(ch / cell)); S1 = Math.max(1, Math.round(H / 90));
      A = mk(W, H); B = mk(W, H); R = mk(W, H); SN = mk(W, H);
      a = A.getContext("2d"); b = B.getContext("2d"); r = R.getContext("2d"); sn = SN.getContext("2d");
      a.imageSmoothingQuality = b.imageSmoothingQuality = "high";
      maskCv = mk(cw, ch); var m = maskCv.getContext("2d");
      m.fillStyle = "rgba(0,0,0,.78)"; m.fillRect(0, 0, cw, ch);
      m.globalCompositeOperation = "destination-out"; m.fillStyle = "#000";
      var pc = cell * STEP, rad = Math.max(.8, pc / 2 - Math.max(.3, pc * .09));
      m.beginPath();
      for (var y = 0; y < H / STEP; y++) for (var x = 0; x < W / STEP; x++) { var cx = (x + .5) * pc, cy = (y + .5) * pc; m.moveTo(cx + rad, cy); m.arc(cx, cy, rad, 0, TAU); }
      m.fill();
      fit(glow, 1); gc.imageSmoothingEnabled = true;
      buildText();
    }
    function blit(src) {
      dc.imageSmoothingEnabled = true; dc.imageSmoothingQuality = "medium";
      dc.drawImage(src, 0, 0, W, H, 0, 0, cw, H * cell);
      dc.drawImage(maskCv, 0, 0);
      gc.clearRect(0, 0, glow.width, glow.height); gc.drawImage(src, 0, 0, W, H, 0, 0, glow.width, glow.height);
    }

    var cur = 0, auto = true, sceneStart = 0, trans = null, nameEl = $("#sceneName"), lastT = 0;
    function activate(i) {
      scenes.forEach(function (sc, k) { if (sc.kind !== "video") return; if (k === i) { try { sc.el.currentTime = 0; } catch (e) {} if (!reduce) { var p = sc.el.play(); if (p && p.catch) p.catch(function () {}); } } else sc.el.pause(); });
    }
    function mark() { $$("#scenes .chip").forEach(function (c) { c.setAttribute("aria-pressed", String(auto ? c.dataset.scene === "auto" : c.dataset.scene === String(cur))); }); if (nameEl) nameEl.textContent = scenes[cur].n; }
    function go(next, now) {
      if (next === cur && !trans) { mark(); return; }
      sn.drawImage(trans ? B : A, 0, 0);
      trans = { t0: now }; cur = next; sceneStart = now; activate(cur); mark();
    }
    function nextOk(i) { for (var k = 1; k <= scenes.length; k++) { var j = (i + k) % scenes.length; if (scenes[j].ok) return j; } return i; }
    function draw(t) {
      lastT = t;
      if (!a) return;
      if (!sceneStart) { sceneStart = t; activate(cur); mark(); }
      if (auto && !trans && !reduce && t - sceneStart > scenes[cur].d) go(nextOk(cur), t);
      if (trans) {
        var p = (t - trans.t0) / .8;
        drawScene(b, scenes[cur], t);
        if (p >= 1) { trans = null; a.drawImage(B, 0, 0); blit(A); return; }
        r.drawImage(SN, 0, 0);
        var bs = 16;
        for (var y = 0; y < H; y += bs) for (var x = 0; x < W; x += bs) {
          var nz = (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;
          if (nz < p) r.drawImage(B, x, y, bs, bs, x, y, bs, bs);
        }
        blit(R);
      } else { drawScene(a, scenes[cur], t); blit(A); }
    }

    var boot = function () { layout(); runWhileVisible(demo, draw); };
    (document.fonts && document.fonts.load ? document.fonts.load('800 40px "Big Shoulders"') : Promise.resolve()).then(boot, boot);
    var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (a) { layout(); if (reduce) draw(lastT || 3); } }, 150); });
    if (reduce) scenes.forEach(function (sc) { if (sc.kind === "video") sc.el.addEventListener("loadeddata", function () { try { sc.el.currentTime = 1; } catch (e) {} setTimeout(function () { if (a) draw(lastT || 3); }, 120); }); });

    chipBox.addEventListener("click", function (e) {
      var c = e.target.closest(".chip"); if (!c) return;
      var now = lastT || 0;
      if (c.dataset.scene === "auto") { auto = true; sceneStart = now; mark(); }
      else { auto = false; go(Number(c.dataset.scene), now); }
      if (reduce) { trans = null; draw(lastT || 3); }
    });
    $("#ledText").addEventListener("input", function () { buildText(); auto = false; go(scenes.length - 1, lastT || 0); if (reduce) { trans = null; draw(lastT || 3); } });
  })();

  /* ================= vídeo (um só) com capa ================= */
  var vf = $("#vframe"), vid = $("#vid"), cover = $("#vcover"), vposter = $("#vposter"), vwrap = $("#vwrap");
  if (vf && vid) {
    if (S.capa && vposter) vposter.src = S.capa;
    if (S.video) { vid.src = S.video; vid.addEventListener("error", function () { vf.classList.add("empty"); }); }
    else vf.classList.add("empty");
    cover.addEventListener("click", function () {
      if (vf.classList.contains("empty")) return;
      vid.controls = true; vf.classList.add("playing");
      var p = vid.play(); if (p && p.catch) p.catch(function () { vf.classList.remove("playing"); vid.controls = false; });
    });
    vid.addEventListener("ended", function () { vf.classList.remove("playing"); vid.controls = false; });
  }
  function onScrollFx() {
    var vh = innerHeight;
    if (vwrap) { var r1 = vwrap.getBoundingClientRect(); vwrap.style.setProperty("--p", reduce ? 1 : clamp((vh * .95 - r1.top) / (vh * .55), 0, 1).toFixed(3)); }
    var run = $("#run");
    if (run) {
      var r2 = run.getBoundingClientRect(), rp = clamp((vh * .8 - r2.top) / (vh * .45), 0, 1);
      run.style.setProperty("--rp", rp.toFixed(3));
      $$("li", run).forEach(function (li, i) { li.classList.toggle("on", rp >= (i + .35) / 6); });
    }
  }
  onScrollFx(); window.addEventListener("scroll", onScrollFx, { passive: true }); window.addEventListener("resize", onScrollFx);

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
