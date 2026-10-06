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
  $$("[data-wa]").forEach(function (a) { a.href = wa(S.mensagem); a.target = "_blank"; a.rel = "noopener"; });
  if (num.length >= 12) {
    var d = num.slice(2);
    $$('[data-fill="wa-label"]').forEach(function (e) { e.textContent = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4); });
  }
  var ig = String(S.instagram || "").replace(/^@/, "");
  $$("[data-ig]").forEach(function (a) { if (ig) { a.href = "https://instagram.com/" + ig; a.target = "_blank"; a.rel = "noopener"; } else a.href = "#orcamento"; });
  if (ig) $$('[data-fill="ig-label"]').forEach(function (e) { e.textContent = "@" + ig; });
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
    for (var q = 0; q <= 12; q++) lvl.push("rgba(" + (216 + q * 2) + "," + (180 + q * 4) + "," + (106 + q * 8) + "," + (.07 + .85 * q / 12).toFixed(2) + ")");
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

  /* ================= PAINEL DE LED: animações em pixel art ================= */
  var demo = $("#ledDemo"), glow = $("#ledGlow");
  if (demo) (function () {
    var dc = demo.getContext("2d"), gc = glow.getContext("2d");
    var W = 224, H = 84, cw, ch, cell, maskCv;
    var A, B, R, a, b, r, u = 1, S1 = 1;
    var CONF = ["#ff3d81", "#ffd23f", "#2ee6ff", "#8c5bff", "#ff8a3d", "#ffffff", "#5dff9a"];
    var CONF_RGB = CONF.map(function (h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; });
    var HEART = [".#.#.", "#####", "#####", ".###.", "..#.."];
    var STAR = ["..#..", "..#..", "#####", "..#..", "..#.."];

    /* --- primitivas --- */
    function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    function disc(g, cx, cy, rad, c) {
      g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); rad = Math.round(rad);
      for (var dy = -rad; dy <= rad; dy++) { var dx = Math.floor(Math.sqrt(rad * rad - dy * dy + .5)); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); }
    }
    function line(g, x0, y0, x1, y1, c, th) {
      g.fillStyle = c; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); th = th || 1;
      var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, er = dx + dy, e2, n = 0;
      for (;;) { g.fillRect(x0, y0, th, th); if ((x0 === x1 && y0 === y1) || n++ > 400) break; e2 = 2 * er; if (e2 >= dy) { er += dy; x0 += sx; } if (e2 <= dx) { er += dx; y0 += sy; } }
    }
    function bands(g, y0, y1, cols_) { var n = cols_.length, h = (y1 - y0) / n; for (var i = 0; i < n; i++) rect(g, 0, y0 + i * h, W, h + 1, cols_[i]); }
    function spr(g, map, x, y, c, s) { g.fillStyle = c; for (var j = 0; j < map.length; j++) for (var i = 0; i < map[j].length; i++) if (map[j][i] === "#") g.fillRect(Math.round(x + i * s), Math.round(y + j * s), s, s); }
    function sparkle(g, x, y, c, s) { rect(g, x, y, s, s, c); }
    function lightBeam(g, ox, ang, rgb, alpha, wBot) {
      var len = H * 1.05;
      for (var y = 0; y < len; y += 1) {
        var f = y / len, cx = ox + ang * y * .85, hw = 1 + (wBot / 2) * f;
        g.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + (alpha * (1 - f * .75)).toFixed(3) + ")";
        g.fillRect(Math.round(cx - hw), y, Math.round(hw * 2), 1);
      }
    }
    function confetti(g, t, n, speed) {
      for (var i = 0; i < n; i++) {
        var x = (hs(i * 1.7) * W + Math.sin(t * 1.4 + i) * 4 + W) % W;
        var y = (t * (H * .1 + hs(i + 7) * H * .22) * speed + hs(i + 3) * H) % H;
        var big = hs(i + 11) > .72 ? Math.max(2, S1) : Math.max(1, S1 - 0 | 0);
        rect(g, x, y, big, big, CONF[Math.floor(hs(i * 2.3) * CONF.length)]);
      }
    }
    function crowd(g, t, baseY, size, col, seed, rim, phone) {
      var step = Math.round(size * 3), i = 0;
      for (var x = -step / 2 + hs(seed) * step; x < W + step; x += step, i++) {
        var by = baseY + Math.sin(t * 5 + i * 1.7 + seed) * Math.max(1, size * .3);
        rect(g, x - size * 1.7, by - size * .6, size * 3.4, H - by + size, col);
        disc(g, x, by - size * 1.9, size, col);
        if (rim) rect(g, x - size * .5, by - size * 2.9, Math.max(1, size * .8), 1, rim);
        var h1 = hs(i + seed * 3);
        if (h1 > .28) {
          var both = h1 > .64;
          for (var sd = both ? -1 : (i % 2 ? -1 : 1); sd <= 1; sd += 2) {
            var sx = x + sd * size * 1.5, hx = sx + Math.sin(t * 4 + i + sd) * size * 1.1, hy = by - size * 4.6 - Math.sin(t * 3 + i * 2) * size * .7;
            line(g, sx, by - size * .3, hx, hy, col, Math.max(1, Math.round(size * .55)));
            if (phone && hs(i * 5 + sd) > .55 && Math.sin(t * 2 + i) > -.2) rect(g, hx - 1, hy - 3 * S1, 2 * S1, 3 * S1, "#fff7c9");
            if (!both) break;
          }
        }
      }
    }

    /* --- cena 0: show --- */
    var BEAMS = [[255, 217, 138], [46, 230, 255], [255, 61, 129], [255, 255, 255], [255, 138, 61]];
    function sShow(g, t) {
      bands(g, 0, H * .78, ["#0a0620", "#100835", "#170c47", "#1f1056", "#2a1366", "#37166f"]);
      for (var i = 0; i < 5; i++) lightBeam(g, W * (.08 + .21 * i), Math.sin(t * .9 + i * 1.3) * .6, BEAMS[i], .2, H * .34);
      // bola de espelhos
      var bx = W / 2, by = H * .17, br = Math.round(H * .095);
      line(g, bx, 0, bx, by - br, "#8a8fa8", 1);
      disc(g, bx, by, br, "#6b6f8e");
      for (var yy = -br; yy <= br; yy++) for (var xx = -br; xx <= br; xx++) {
        if (xx * xx + yy * yy > br * br) continue;
        var k = (xx + yy * 2 + Math.floor(t * 7) + br * 3) % 4;
        if (k === 0) rect(g, bx + xx, by + yy, 1, 1, "#e8ecff"); else if (k === 2) rect(g, bx + xx, by + yy, 1, 1, "#9aa0c4");
      }
      for (var s = 0; s < 14; s++) {
        var an = t * .8 + s * 1.9, rr = br * (1.6 + hs(s) * 1.8);
        if (Math.sin(t * 6 + s * 2) > .3) sparkle(g, bx + Math.cos(an) * rr * 1.8, by + Math.sin(an) * rr * .9, "#fff", S1);
      }
      // palco
      rect(g, 0, H * .66, W, H, "#0b0716"); rect(g, 0, H * .66, W, 1, "#d8b46a");
      // plateia
      crowd(g, t, H * .8, Math.max(2, Math.round(H * .036)), "#1a1233", 3, "#ffd98a", false);
      crowd(g, t + 1.3, H * .97, Math.max(3, Math.round(H * .05)), "#06030d", 9, "#ff9ad0", true);
      confetti(g, t, 80, 1);
      // corações e estrelas subindo
      for (var h = 0; h < 5; h++) {
        var fy = H - ((t * (H * .13) + h * H * .27) % (H * 1.2)), fx = W * (.12 + .19 * h) + Math.sin(t * 2 + h) * 3;
        spr(g, h % 2 ? STAR : HEART, fx, fy, h % 2 ? "#ffd23f" : "#ff3d81", S1);
      }
    }

    /* --- cena 1: fogos --- */
    function sFogos(g, t) {
      bands(g, 0, H, ["#04030f", "#070620", "#0b0a30", "#110e40", "#1a1250", "#2a1560", "#3b1a6a"]);
      for (var s = 0; s < 46; s++) if (Math.sin(t * 3 + s * 2.4) > -.4) rect(g, hs(s * 3.3) * W, hs(s * 1.1) * H * .6, 1, 1, s % 5 === 0 ? "#fff" : "#9aa0d8");
      var per = .95, k1 = Math.floor(t / per), TAUp = TAU;
      for (var k = k1 - 2; k <= k1; k++) {
        var age = t - k * per; if (age < 0) continue;
        var cx = W * (.14 + .72 * hs(k * 3.1)), cy = H * (.14 + .26 * hs(k * 5.7));
        var ci = Math.floor(hs(k * 7.3) * 5), ci2 = Math.floor(hs(k * 1.9) * 5), rise = .4;
        if (age < rise) {
          var e = age / rise, y = H * .82 + (cy - H * .82) * (1 - (1 - e) * (1 - e));
          for (var j = 0; j < 7; j++) { g.globalAlpha = 1 - j / 7; rect(g, cx, y + j * S1 * 1.4, 1, S1, "#ffe9a8"); }
          g.globalAlpha = 1; continue;
        }
        var a2 = age - rise; if (a2 > 1.75) continue;
        var n = 28 + Math.floor(hs(k * 2.2) * 16), v = H * (.52 + .2 * hs(k * 9.9)), grav = H * .5;
        for (var ring = 0; ring < 2; ring++) {
          var rgb = CONF_RGB[ring ? ci2 : ci], sp_ = v * (ring ? .6 : 1);
          for (var jj = 0; jj < n; jj++) {
            var ang = jj / n * TAUp + ring * .12;
            for (var tr = 0; tr < 3; tr++) {
              var aa = a2 - tr * .05; if (aa < 0) continue;
              var rr = sp_ * (1 - Math.exp(-aa * 2.6));
              var px_ = cx + Math.cos(ang) * rr, py_ = cy + Math.sin(ang) * rr + grav * aa * aa * .5;
              g.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + (Math.max(0, 1 - a2 / 1.75) * (1 - tr * .33)).toFixed(2) + ")";
              g.fillRect(Math.round(px_), Math.round(py_), S1, S1);
            }
          }
        }
        if (a2 < .14) disc(g, cx, cy, Math.round((1 - a2 / .14) * S1 * 5), "#fff");
      }
      crowd(g, t, H * .9, Math.max(2, Math.round(H * .042)), "#05030c", 5, "#8c5bff", true);
      for (var h = 0; h < 4; h++) { var fy = H - ((t * (H * .12) + h * H * .33) % (H * 1.15)); spr(g, STAR, W * (.2 + .2 * h) + Math.sin(t * 2 + h) * 3, fy, "#ffd23f", S1); }
    }

    /* --- cena 2: pista de dança --- */
    var TILES = [[255, 46, 147], [46, 230, 255], [255, 210, 63], [123, 47, 255]];
    function dancer(g, x, y, t, shirt, hair) {
      var s = S1, ph = t * 6, bounce = Math.abs(Math.sin(ph)) * 2 * s, top = y - 17 * s - bounce;
      var hipY = top + 10 * s, shY = top + 5 * s, skin = "#f2c9a0";
      line(g, x - s, hipY, x - 2.4 * s + Math.sin(ph) * 2 * s, y, "#1b1e4a", s + 1);
      line(g, x + s, hipY, x + 2.4 * s - Math.sin(ph) * 2 * s, y, "#1b1e4a", s + 1);
      rect(g, x - 2 * s, shY - s, 4 * s + 1, 6 * s, shirt);
      var a1 = -Math.PI / 2 + Math.sin(ph) * .8 - .3, a2 = -Math.PI / 2 - Math.sin(ph + 1) * .8 + .3, L = 6 * s;
      line(g, x - 2 * s, shY, x - 2 * s + Math.cos(a1) * L - L * .35, shY + Math.sin(a1) * L, skin, s);
      line(g, x + 2 * s, shY, x + 2 * s + Math.cos(a2) * L + L * .35, shY + Math.sin(a2) * L, skin, s);
      disc(g, x, top + 1.8 * s, 2.3 * s, skin); rect(g, x - 2.3 * s, top - 1.2 * s, 4.6 * s, 1.8 * s, hair);
    }
    function sPista(g, t) {
      bands(g, 0, H * .6, ["#0a0414", "#12061f", "#1c0a2e", "#2a0d3c"]);
      var n = Math.floor(W / (S1 * 4)), base = H * .52;
      for (var i = 0; i < n; i++) {
        var hgt = (.22 + .78 * Math.abs(Math.sin(t * 3 + i * .7) * Math.sin(t * 1.7 + i * .31))) * H * .42;
        for (var yy = 0; yy < hgt; yy += 2) {
          var f = yy / (H * .42), c = f < .4 ? "#2ee6ff" : f < .75 ? "#ff3d81" : "#ffd23f";
          rect(g, i * S1 * 4 + 1, base - yy, S1 * 3, 1, c);
        }
      }
      var T = Math.max(5, Math.round(H / 11)), fy0 = Math.round(H * .6);
      for (var ty = 0; fy0 + ty * T < H; ty++) for (var tx = 0; tx * T < W; tx++) {
        var idx = (tx + ty + Math.floor(t * 3)) % 4, c2 = TILES[(tx * 3 + ty * 5 + Math.floor(t * 2)) % 4], lit = idx === 0 ? 1 : .32;
        rect(g, tx * T, fy0 + ty * T, T - 1, T - 1, "rgb(" + Math.round(c2[0] * lit) + "," + Math.round(c2[1] * lit) + "," + Math.round(c2[2] * lit) + ")");
      }
      var shirts = ["#ff3d81", "#2ee6ff", "#ffd23f", "#8c5bff", "#5dff9a", "#ff8a3d"], hairs = ["#2b1a10", "#f2d27a", "#101010", "#8a3a1a", "#2b1a10", "#101010"];
      for (var d = 0; d < 6; d++) dancer(g, W * (.12 + .76 * d / 5), H * (.78 + (d % 2) * .12), t + d * .37, shirts[d], hairs[d]);
      confetti(g, t, 40, .8);
    }

    /* --- cena 3: texto do usuário --- */
    var txtPts = [], txtLabel = "SEU EVENTO AQUI";
    function buildText() {
      var inp = $("#ledText"), txt = (inp.value || "").toUpperCase().trim() || "SEU EVENTO";
      txtLabel = txt;
      var tc = mk(W, H), x = tc.getContext("2d"), size = Math.round(H * .64), w;
      do { x.font = "800 " + size + 'px "Big Shoulders","Inter Tight",Impact,sans-serif'; w = x.measureText(txt).width; size -= 2; } while (w > W * .9 && size > 8);
      x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#fff"; x.fillText(txt, W / 2, H / 2 + size * .05);
      var dd = x.getImageData(0, 0, W, H).data; txtPts = [];
      for (var i = 0; i < W * H; i++) if (dd[i * 4 + 3] > 120) txtPts.push(i);
    }
    function sTexto(g, t) {
      bands(g, 0, H, ["#0a0705", "#120d06", "#1a1208", "#120d06", "#0a0705"]);
      for (var s = 0; s < 34; s++) {
        var sx = hs(s * 2.9) * W, sy = hs(s * 4.1) * H, ph = Math.sin(t * 3 + s * 1.7);
        if (ph > .35) { rect(g, sx, sy, S1, S1, "#fff3c4"); if (ph > .8) { rect(g, sx - S1, sy, S1, S1, "#d8b46a"); rect(g, sx + S1, sy, S1, S1, "#d8b46a"); rect(g, sx, sy - S1, S1, S1, "#d8b46a"); rect(g, sx, sy + S1, S1, S1, "#d8b46a"); } }
      }
      confetti(g, t, 46, .7);
      var n = txtPts.length, i, p, x, y, sweep = (t * 70) % (W + 120) - 60;
      g.fillStyle = "#3a2608";
      for (i = 0; i < n; i++) { p = txtPts[i]; g.fillRect(p % W + S1, Math.floor(p / W) + S1, 1, 1); }
      for (i = 0; i < n; i++) {
        p = txtPts[i]; x = p % W; y = Math.floor(p / W);
        var f = y / H, c = f < .4 ? "#ffefbf" : f < .62 ? "#f0d9a4" : f < .8 ? "#d8b46a" : "#b98f45";
        if (Math.abs(x + y * .6 - sweep) < 4) c = "#ffffff";
        g.fillStyle = c; g.fillRect(x, y, 1, 1);
      }
    }

    var SCENES = [{ n: "Show", f: sShow, d: 7.5 }, { n: "Fogos", f: sFogos, d: 7 }, { n: "Pista", f: sPista, d: 7 }, { n: "Seu texto", f: sTexto, d: 5.5 }];

    /* --- tamanho, máscara de LED, pipeline --- */
    function layout() {
      var s = fit(demo, 2); cw = s.w; ch = s.h;
      var targetCols = innerWidth < 760 ? 132 : 232;
      cell = cw / targetCols;
      W = targetCols; H = Math.max(40, Math.round(ch / cell));
      S1 = Math.max(1, Math.round(H / 62)); u = H / 72;
      A = mk(W, H); B = mk(W, H); R = mk(W, H);
      a = A.getContext("2d"); b = B.getContext("2d"); r = R.getContext("2d");
      maskCv = mk(cw, ch); var m = maskCv.getContext("2d");
      m.fillStyle = "rgba(0,0,0,.93)"; m.fillRect(0, 0, cw, ch);
      m.globalCompositeOperation = "destination-out"; m.fillStyle = "#000";
      var gap = Math.max(.5, cell * .14), rad = Math.max(.8, cell / 2 - gap);
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { m.beginPath(); m.arc((x + .5) * cell, (y + .5) * cell, rad, 0, TAU); m.fill(); }
      var gs = fit(glow, 1); gc.imageSmoothingEnabled = true;
      buildText();
    }
    function blit(src) {
      dc.imageSmoothingEnabled = false; dc.drawImage(src, 0, 0, W, H, 0, 0, cw, H * cell);
      dc.drawImage(maskCv, 0, 0);
      gc.clearRect(0, 0, glow.width, glow.height); gc.drawImage(src, 0, 0, W, H, 0, 0, glow.width, glow.height);
    }

    var cur = 0, auto = true, sceneStart = 0, trans = null, nameEl = $("#sceneName");
    function go(next, now) {
      if (next === cur && !trans) return;
      trans = { from: cur, to: next, t0: now }; cur = next; sceneStart = now;
      if (nameEl) nameEl.textContent = SCENES[next].n;
      $$("#scenes .chip").forEach(function (c) { c.setAttribute("aria-pressed", String(auto ? c.dataset.scene === "auto" : c.dataset.scene === String(cur))); });
    }
    var lastT = 0;
    function draw(t) {
      lastT = t;
      if (!a) return;
      if (!sceneStart) sceneStart = t;
      if (auto && !trans && !reduce && t - sceneStart > SCENES[cur].d) go((cur + 1) % SCENES.length, t);
      if (trans) {
        var p = (t - trans.t0) / .85;
        SCENES[trans.from].f(a, t); SCENES[trans.to].f(b, t);
        if (p >= 1) { trans = null; blit(B); return; }
        var da = a.getImageData(0, 0, W, H), db = b.getImageData(0, 0, W, H), o = da.data, nn = db.data;
        for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
          var i = (y * W + x) * 4, nz = (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;
          if (nz < p) { o[i] = nn[i]; o[i + 1] = nn[i + 1]; o[i + 2] = nn[i + 2]; o[i + 3] = 255; }
        }
        r.putImageData(da, 0, 0); blit(R);
      } else { SCENES[cur].f(a, t); blit(A); }
    }

    // inicializa quando a fonte do texto carregar
    var boot = function () { layout(); runWhileVisible(demo, draw); };
    (document.fonts && document.fonts.load ? document.fonts.load('800 40px "Big Shoulders"') : Promise.resolve()).then(boot, boot);
    var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (a) { layout(); if (reduce) draw(lastT || 3); } }, 150); });

    // controles
    $$("#scenes .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        var now = lastT || 0;
        if (c.dataset.scene === "auto") { auto = true; sceneStart = now; $$("#scenes .chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === c)); }); }
        else { auto = false; go(Number(c.dataset.scene), now); }
        if (reduce) { trans = null; draw(lastT || 3); }
      });
    });
    var inp = $("#ledText");
    inp.addEventListener("input", function () { buildText(); auto = false; go(3, lastT || 0); if (reduce) { trans = null; draw(lastT || 3); } });
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
    var st = { tipo: "Show", publico: 2, ambiente: "Interno", itens: { led: true, truss: true, palco: true, roof: false } };
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
      var nomes = { led: "Painel de LED", truss: "Estrutura (truss)", palco: "Palco", roof: "Cobertura" };
      var itens = Object.keys(st.itens).filter(function (k) { return st.itens[k]; }).map(function (k) { return nomes[k]; });
      var dt = f.data.value ? f.data.value.split("-").reverse().join("/") : "a combinar";
      var t = "Olá! Meu nome é " + f.nome.value.trim() + ".\nQuero orçamento para: " + st.tipo +
        "\nPúblico: " + PUB[st.publico - 1] + "\nAmbiente: " + st.ambiente +
        "\nPreciso de: " + (itens.join(", ") || "a definir") + "\nData: " + dt + "\nLocal: " + (f.local.value.trim() || "a combinar");
      window.open(wa(t), "_blank", "noopener");
    });
  })();
})();
