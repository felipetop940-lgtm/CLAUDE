(function () {
  'use strict';
  var doc = document, root = doc.documentElement, SITE = window.SITE || {};
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var get = function (path) { return path.split('.').reduce(function (o, k) { return o ? o[k] : ''; }, SITE); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var icon = function (id) { return '<svg class="i" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  root.classList.add('js');

  var PRODUTOS = (SITE.produtos || []).filter(function (p) { return p && p.id; });
  var byId = {}; PRODUTOS.forEach(function (p) { byId[p.id] = p; });
  var HOR = SITE.horario || {};

  /* ---------- Armazenamento (sacola e favoritos ficam no aparelho) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('ella:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('ella:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var cart = store.get('sacola', []).filter(function (l) { return byId[l.id]; });
  var favs = store.get('favoritos', []).filter(function (id) { return byId[id]; });

  /* ---------- Dados do config.js ---------- */
  $$('[data-f]').forEach(function (el) { el.textContent = get(el.getAttribute('data-f')) || ''; });
  $$('[data-need]').forEach(function (el) { if (!get(el.getAttribute('data-need'))) el.hidden = true; });
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  $$('[data-map]').forEach(function (a) { if (SITE.endereco) a.href = SITE.endereco.mapa; });
  if (SITE.instagram) $$('[data-ig]').forEach(function (a) {
    a.href = 'https://instagram.com/' + SITE.instagram;
    var h = $('[data-ig-handle]', a); if (h) h.textContent = '@' + SITE.instagram;
  });
  var fone = String(SITE.whatsapp || '').replace(/^55/, '');
  if (fone.length >= 10) $$('[data-phone]').forEach(function (a) {
    a.textContent = '(' + fone.slice(0, 2) + ') ' + fone.slice(2, -4) + '-' + fone.slice(-4);
  });

  /* ---------- WhatsApp ---------- */
  function waUrl(msg) { return 'https://wa.me/' + (SITE.whatsapp || '') + '?text=' + encodeURIComponent(msg || ''); }
  var MSG = SITE.mensagens || {};
  $$('[data-wa]').forEach(function (el) {
    if (!SITE.whatsapp) return;
    el.href = waUrl(MSG[el.getAttribute('data-wa')] || MSG.padrao);
    el.target = '_blank'; el.rel = 'noopener';
  });

  /* ---------- Preços ---------- */
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var money = function (v) { return brl.format(v); };
  var has = function (v) { return typeof v === 'number' && !isNaN(v); };
  var isBiquini = function (p) { return p.tipo === 'biquini'; };
  function unitPrice(p, pecas) {
    if (!isBiquini(p) || pecas === 'conjunto' || !pecas) {
      if (has(p.preco)) return p.preco;
      if (isBiquini(p) && has(p.precoTop) && has(p.precoCalcinha)) return p.precoTop + p.precoCalcinha;
      return null;
    }
    return pecas === 'top' ? (has(p.precoTop) ? p.precoTop : null) : (has(p.precoCalcinha) ? p.precoCalcinha : null);
  }
  function priceHTML(p) {
    if (isBiquini(p) && (has(p.precoTop) || has(p.precoCalcinha))) {
      var parts = [];
      if (has(p.precoTop)) parts.push('<span title="Top">' + icon('top') + money(p.precoTop) + '</span>');
      if (has(p.precoCalcinha)) parts.push('<span title="Calcinha">' + icon('bottom') + money(p.precoCalcinha) + '</span>');
      return '<p class="price">' + parts.join('<i class="price__sep" aria-hidden="true"></i>') + '</p>';
    }
    if (has(p.preco)) return '<p class="price"><span>' + money(p.preco) + '</span></p>';
    return '<p class="price price--ask">Consulte o valor</p>';
  }
  var anyPrice = PRODUTOS.some(function (p) { return unitPrice(p, 'conjunto') != null || has(p.precoTop) || has(p.precoCalcinha); });
  var sizesOf = function (p) { return (p.tamanhos && p.tamanhos.length) ? p.tamanhos : (SITE.tamanhos || ['P', 'M', 'G']); };

  /* ---------- Faixa de avisos ---------- */
  var msgs = $$('.topbar__msgs p'), mi = 0;
  if (msgs.length > 1) setInterval(function () {
    msgs[mi].classList.remove('is-on'); mi = (mi + 1) % msgs.length; msgs[mi].classList.add('is-on');
  }, 4200);

  /* ---------- Header ao rolar ---------- */
  var header = $('.header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Horário: aberto agora? ---------- */
  var DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var DIAS_LONGOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function agoraSP() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; parts.forEach(function (x) { o[x.type] = x.value; });
      return { dia: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), h: (+o.hour % 24) + (+o.minute) / 60 };
    } catch (e) { var d = new Date(); return { dia: d.getDay(), h: d.getHours() + d.getMinutes() / 60 }; }
  }
  function statusLoja() {
    var dias = HOR.dias || [], a = HOR.abre, f = HOR.fecha, n = agoraSP();
    if (!dias.length || a == null) return null;
    if (dias.indexOf(n.dia) > -1 && n.h >= a && n.h < f) return { aberto: true, txt: 'Aberto agora · até as ' + f + 'h' };
    if (dias.indexOf(n.dia) > -1 && n.h < a) return { aberto: false, txt: 'Fechado · abre hoje às ' + a + 'h' };
    for (var k = 1; k <= 7; k++) {
      var d = (n.dia + k) % 7;
      if (dias.indexOf(d) > -1) return { aberto: false, txt: 'Fechado · abre ' + (k === 1 ? 'amanhã' : DIAS_LONGOS[d]) + ' às ' + a + 'h' };
    }
    return null;
  }
  var st = statusLoja(), stEl = $('[data-status]');
  if (st && stEl) { stEl.classList.add(st.aberto ? 'is-open' : 'is-closed'); $('[data-status-txt]', stEl).textContent = st.txt; }
  else if (stEl) stEl.hidden = true;
  var week = $('[data-week]');
  if (week && HOR.dias) {
    var hoje = agoraSP().dia;
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      var li = doc.createElement('li'), on = HOR.dias.indexOf(d) > -1;
      if (!on) li.className = 'is-off';
      if (d === hoje) li.className += ' is-today';
      li.innerHTML = '<b>' + DIAS[d] + '</b>' + (on ? HOR.abre + '–' + HOR.fecha + 'h' : 'Fechado');
      if (d === hoje) li.setAttribute('aria-current', 'date');
      week.appendChild(li);
    });
  }

  /* ---------- Diálogos ---------- */
  var openDialogs = function () { return $$('dialog[open]'); };
  function unlock() { if (!openDialogs().length) doc.body.classList.remove('lock'); }
  function openDialog(id) {
    var d = doc.getElementById(id); if (!d) return;
    openDialogs().forEach(function (o) { if (o !== d) o.close(); });
    if (!d.open) { d.showModal(); }
    doc.body.classList.add('lock');
    return d;
  }
  $$('dialog').forEach(function (d) {
    d.addEventListener('close', unlock);
    d.addEventListener('click', function (e) {
      if (e.target === d) { d.close(); unlock(); return; }
      var c = e.target.closest('[data-close]');
      if (c && d.contains(c)) { d.close(); unlock(); }
    });
  });
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]'); if (!b) return;
    e.preventDefault();
    var id = b.getAttribute('data-open');
    if (id === 'bag') setTab(b.getAttribute('data-tab') || 'bag');
    if (id === 'filter') renderFilters();
    openDialog(id);
    if (id === 'search') { var inp = $('[data-search-input]'); inp.value = ''; renderSearch(''); setTimeout(function () { inp.focus(); }, 30); }
    hideToast();
  });

  /* ---------- Vitrine ---------- */
  var grid = $('[data-grid]');
  var F = { cat: '', modelo: [], cor: [], ordem: 'destaque' };
  var view = 'item';
  var temFoto2 = PRODUTOS.some(function (p) { return p.foto2; });
  var cats = uniq(PRODUTOS.map(function (p) { return p.categoria; }));
  function uniq(a) { return a.filter(function (v, i) { return v && a.indexOf(v) === i; }); }
  function filtrados() {
    var l = PRODUTOS.filter(function (p) {
      return (!F.cat || p.categoria === F.cat) &&
        (!F.modelo.length || F.modelo.indexOf(p.modelo) > -1) &&
        (!F.cor.length || F.cor.indexOf(p.cor) > -1);
    });
    if (F.ordem !== 'destaque') {
      var pr = function (p) { var v = unitPrice(p, 'conjunto'); if (v == null) v = (p.precoTop || 0) + (p.precoCalcinha || 0) || null; return v; };
      l = l.slice().sort(function (a, b) {
        var x = pr(a), y = pr(b);
        if (x == null) return 1; if (y == null) return -1;
        return F.ordem === 'menor' ? x - y : y - x;
      });
    }
    return l;
  }
  function nFiltros() { return (F.cat ? 1 : 0) + F.modelo.length + F.cor.length + (F.ordem !== 'destaque' ? 1 : 0); }
  function cardHTML(p, i) {
    var fav = favs.indexOf(p.id) > -1;
    return '<article class="card" style="--n:' + i + '" data-id="' + esc(p.id) + '">' +
      '<div class="card__media" data-pdp="' + esc(p.id) + '">' +
        '<img src="' + esc(p.foto) + '" alt="' + esc(p.nome) + '" width="739" height="985" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async">' +
        (p.foto2 ? '<img class="card__alt" src="' + esc(p.foto2) + '" alt="" loading="lazy" decoding="async">' : '') +
        (p.tag ? '<span class="tag">' + esc(p.tag) + '</span>' : '') +
        '<button class="fav" type="button" data-fav="' + esc(p.id) + '" aria-pressed="' + fav + '" aria-label="Favoritar ' + esc(p.nome) + '">' + icon('heart') + '</button>' +
        '<div class="card__quick"><div class="card__sizes" aria-label="Tamanhos">' + sizesOf(p).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>' +
        '<button class="card__add" type="button" data-pdp="' + esc(p.id) + '">Adicionar à sacola</button></div>' +
      '</div>' +
      '<div class="card__body"><h3 class="card__name"><button type="button" data-pdp="' + esc(p.id) + '">' + esc(p.nome) + '</button></h3>' + priceHTML(p) + '</div>' +
    '</article>';
  }
  function editHTML(i) {
    return '<article class="card card--edit" style="--n:' + i + '"><div class="edit">' +
      '<img src="assets/img/loja.webp" alt="" loading="lazy" decoding="async">' +
      '<span class="edit__k">Visite a loja</span>' +
      '<h3>Não achou o seu <em>tamanho?</em></h3>' +
      '<p>Fale com a gente no WhatsApp ou venha provar na Av. Aurora Forti Neves.</p>' +
      '<div class="edit__ctas"><a class="btn btn--light" href="' + (SITE.whatsapp ? waUrl(MSG.tamanho || MSG.padrao) : '#') + '" target="_blank" rel="noopener">' + icon('wa') + 'WhatsApp</a>' +
      '<a class="btn btn--line-light" href="' + esc(SITE.endereco ? SITE.endereco.mapa : '#') + '" target="_blank" rel="noopener">Como chegar</a></div>' +
    '</div></article>';
  }
  function renderGrid() {
    var l = filtrados();
    grid.innerHTML = l.map(cardHTML).join('') + (l.length ? editHTML(l.length) : '');
    grid.classList.toggle('has-alt', temFoto2);
    grid.classList.toggle('view-modelo', view === 'modelo');
    $('[data-empty]').hidden = l.length > 0;
    $('[data-shop-count]').textContent = l.length + (l.length === 1 ? ' peça' : ' peças');
    var t = F.cat || 'Novidades';
    $('[data-shop-title]').textContent = t; $('[data-crumb]').textContent = t;
    var n = nFiltros(), nEl = $('[data-filter-n]');
    nEl.textContent = n; nEl.hidden = !n;
    var ap = $('[data-filter-apply]'); if (ap) ap.textContent = 'Ver ' + l.length + (l.length === 1 ? ' peça' : ' peças');
    $$('[data-cat]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-cat') || '') === F.cat)); });
  }
  // categorias na barra (só quando houver mais de uma)
  var catsBox = $('[data-cats]');
  if (cats.length > 1) {
    catsBox.innerHTML = '<button class="chip" type="button" data-cat="">Todos</button>' + cats.map(function (c) { return '<button class="chip" type="button" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
    catsBox.hidden = false;
  }
  doc.addEventListener('click', function (e) {
    var c = e.target.closest('[data-cat]'); if (!c) return;
    F.cat = c.getAttribute('data-cat') || ''; renderGrid(); renderFilters();
  });
  $$('[data-cat-link]').forEach(function (a) {
    a.addEventListener('click', function () { var c = a.getAttribute('data-cat-link'); F.cat = cats.indexOf(c) > -1 && cats.length > 1 ? c : ''; renderGrid(); });
  });
  if (temFoto2) {
    $('[data-view]').hidden = false;
    $$('[data-view-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        view = b.getAttribute('data-view-btn');
        $$('[data-view-btn]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        renderGrid();
      });
    });
  }

  /* ---------- Filtros ---------- */
  var fBox = $('[data-filters]');
  function grupo(titulo, chave, valores, multi) {
    if (valores.length < 2) return '';
    return '<div class="fgroup"><h3>' + titulo + '</h3><div class="chips">' + valores.map(function (v) {
      var on = multi ? F[chave].indexOf(v[0]) > -1 : F[chave] === v[0];
      return '<button class="chip" type="button" data-fk="' + chave + '" data-fv="' + esc(v[0]) + '" aria-pressed="' + on + '">' + esc(v[1]) + '</button>';
    }).join('') + '</div></div>';
  }
  var pares = function (a) { return a.map(function (v) { return [v, v]; }); };
  function renderFilters() {
    fBox.innerHTML =
      (cats.length > 1 ? grupo('Categoria', 'cat', [['', 'Todas']].concat(pares(cats)), false) : '') +
      grupo('Modelo', 'modelo', pares(uniq(PRODUTOS.map(function (p) { return p.modelo; }))), true) +
      grupo('Cor', 'cor', pares(uniq(PRODUTOS.map(function (p) { return p.cor; }))), true) +
      (anyPrice ? grupo('Ordenar', 'ordem', [['destaque', 'Destaques'], ['menor', 'Menor preço'], ['maior', 'Maior preço']], false) : '');
  }
  fBox.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fk]'); if (!b) return;
    var k = b.getAttribute('data-fk'), v = b.getAttribute('data-fv');
    if (Array.isArray(F[k])) { var i = F[k].indexOf(v); if (i > -1) F[k].splice(i, 1); else F[k].push(v); }
    else F[k] = v;
    renderFilters(); renderGrid();
  });
  $$('[data-clear]').forEach(function (b) {
    b.addEventListener('click', function () { F = { cat: '', modelo: [], cor: [], ordem: 'destaque' }; renderFilters(); renderGrid(); });
  });

  /* ---------- Favoritos ---------- */
  function toggleFav(id, btn) {
    var i = favs.indexOf(id);
    if (i > -1) favs.splice(i, 1); else favs.push(id);
    store.set('favoritos', favs);
    $$('[data-fav="' + id + '"]').forEach(function (b) { b.setAttribute('aria-pressed', String(i < 0)); });
    if (btn) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
    if (pdp.p && pdp.p.id === id) $('[data-pdp-fav]').setAttribute('aria-pressed', String(i < 0));
    renderCounts(); renderFavs();
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]'); if (!b) return;
    e.stopPropagation(); toggleFav(b.getAttribute('data-fav'), b);
  }, true);

  /* ---------- Produto (janela) ---------- */
  var pdp = { p: null, pecas: 'conjunto', top: '', calcinha: '', tam: '', qty: 1 };
  var separado = SITE.pecasSeparadas !== false;
  function selDesc(s) {
    if (!isBiquini(s.p)) return s.tam ? 'Tamanho ' + s.tam : '';
    var a = [];
    a.push(s.pecas === 'top' ? 'Só o top' : s.pecas === 'calcinha' ? 'Só a calcinha' : 'Conjunto');
    if (s.pecas !== 'calcinha' && s.top) a.push('Top ' + s.top);
    if (s.pecas !== 'top' && s.calcinha) a.push('Calcinha ' + s.calcinha);
    return a.join(' · ');
  }
  function sizeBlock(label, key, ic, p) {
    var sel = pdp[key];
    return '<div class="sizes"><p class="sizes__label">' + (ic ? icon(ic) : '') + label + (sel ? ': <em>' + esc(sel) + '</em>' : '') + '</p>' +
      '<div class="sizes__opts" role="radiogroup" aria-label="' + label + '">' + sizesOf(p).map(function (s) {
        return '<button type="button" role="radio" data-size="' + key + '" data-v="' + esc(s) + '" aria-checked="' + (sel === s) + '">' + esc(s) + '</button>';
      }).join('') + '</div></div>';
  }
  function renderPdp() {
    var p = pdp.p;
    var piecesBox = $('[data-pdp-pieces]');
    if (isBiquini(p) && separado) {
      piecesBox.hidden = false;
      piecesBox.innerHTML = [['conjunto', 'Conjunto'], ['top', 'Só o top'], ['calcinha', 'Só a calcinha']].map(function (o) {
        return '<button type="button" role="radio" data-pecas="' + o[0] + '" aria-checked="' + (pdp.pecas === o[0]) + '">' + o[1] + '</button>';
      }).join('');
    } else piecesBox.hidden = true;
    var html = '';
    if (isBiquini(p)) {
      if (pdp.pecas !== 'calcinha') html += sizeBlock('Tamanho do top', 'top', 'top', p);
      if (pdp.pecas !== 'top') html += sizeBlock('Tamanho da calcinha', 'calcinha', 'bottom', p);
    } else html += sizeBlock('Tamanho', 'tam', '', p);
    $('[data-pdp-sizes]').innerHTML = html;
    $('[data-qty-out]', $('#pdp')).textContent = pdp.qty;
    var d = selDesc(pdp);
    var msg = 'Olá, Ella! Vim pelo site e quero comprar:\n\n' + p.nome + (d ? '\n' + d : '') + '\nQuantidade: ' + pdp.qty + '\n\nTem disponível?';
    $('[data-pdp-wa]').href = waUrl(msg);
  }
  function openPdp(id) {
    var p = byId[id]; if (!p) return;
    pdp = { p: p, pecas: 'conjunto', top: '', calcinha: '', tam: '', qty: 1 };
    var img = $('[data-pdp-img]'); img.src = p.foto; img.alt = p.nome;
    $('[data-pdp-cat]').textContent = [p.categoria, p.modelo].filter(Boolean).join(' · ');
    $('[data-pdp-name]').textContent = p.nome;
    $('[data-pdp-price]').innerHTML = priceHTML(p);
    $('[data-pdp-desc]').textContent = p.descricao || '';
    $('[data-pdp-color]').textContent = p.cor || '';
    $('.pdp__color').hidden = !p.cor;
    $('[data-pdp-fav]').setAttribute('aria-pressed', String(favs.indexOf(id) > -1));
    $('[data-pdp-size-help]').href = waUrl('Olá, Ella! Vim pelo site e queria ajuda com o tamanho do ' + p.nome + '.');
    $('[data-pdp-err]').textContent = '';
    renderPdp();
    var d = openDialog('pdp'); d.scrollTop = 0;
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-pdp]'); if (!t || e.target.closest('[data-fav]')) return;
    openPdp(t.getAttribute('data-pdp'));
  });
  var pdpEl = $('#pdp');
  pdpEl.addEventListener('click', function (e) {
    var s = e.target.closest('[data-size]');
    if (s) { pdp[s.getAttribute('data-size')] = s.getAttribute('data-v'); $('[data-pdp-err]').textContent = ''; renderPdp(); return; }
    var pc = e.target.closest('[data-pecas]');
    if (pc) { pdp.pecas = pc.getAttribute('data-pecas'); renderPdp(); return; }
    var q = e.target.closest('[data-qty]');
    if (q) { pdp.qty = Math.max(1, Math.min(10, pdp.qty + (+q.getAttribute('data-qty')))); renderPdp(); return; }
    if (e.target.closest('[data-pdp-fav]')) { toggleFav(pdp.p.id); return; }
    if (e.target.closest('[data-add]')) addToCart();
  });
  function faltando() {
    var p = pdp.p;
    if (!isBiquini(p)) return pdp.tam ? '' : 'Escolha o tamanho.';
    if (pdp.pecas !== 'calcinha' && !pdp.top) return 'Escolha o tamanho do top.';
    if (pdp.pecas !== 'top' && !pdp.calcinha) return 'Escolha o tamanho da calcinha.';
    return '';
  }
  function addToCart() {
    var f = faltando(); if (f) { $('[data-pdp-err]').textContent = f; return; }
    var s = pdp, top = s.pecas === 'calcinha' ? '' : s.top, cal = s.pecas === 'top' ? '' : s.calcinha;
    var key = [s.p.id, s.pecas, top, cal, s.tam].join('|');
    var ex = cart.filter(function (l) { return l.key === key; })[0];
    if (ex) ex.qty = Math.min(10, ex.qty + s.qty);
    else cart.push({ key: key, id: s.p.id, pecas: isBiquini(s.p) ? s.pecas : '', top: top, calcinha: cal, tam: s.tam, qty: s.qty });
    saveCart();
    pdpEl.close(); unlock();
    toast(s.p.nome.replace(/^Biquíni /, '') + ' na sacola');
  }

  /* ---------- Sacola ---------- */
  function saveCart() { store.set('sacola', cart); renderCounts(); renderCart(); }
  function lineDesc(l) { return selDesc({ p: byId[l.id], pecas: l.pecas, top: l.top, calcinha: l.calcinha, tam: l.tam }); }
  function renderCart() {
    var box = $('[data-lines]');
    box.innerHTML = cart.map(function (l, i) {
      var p = byId[l.id], u = unitPrice(p, l.pecas);
      return '<li class="line"><img src="' + esc(p.foto) + '" alt="" data-pdp="' + esc(p.id) + '">' +
        '<div><p class="line__name">' + esc(p.nome) + '</p><p class="line__meta">' + esc(lineDesc(l)) + '</p>' +
        '<p class="line__price">' + (u != null ? money(u * l.qty) : '<span class="price--ask">Valor no WhatsApp</span>') + '</p>' +
        '<div class="line__row"><div class="qty" aria-label="Quantidade"><button type="button" data-lq="-1" data-i="' + i + '" aria-label="Diminuir">' + icon('minus') + '</button><output>' + l.qty + '</output><button type="button" data-lq="1" data-i="' + i + '" aria-label="Aumentar">' + icon('plus') + '</button></div>' +
        '<button class="line__rm" type="button" data-rm="' + i + '">Remover</button></div></div></li>';
    }).join('');
    var vazio = !cart.length;
    $('[data-bag-empty]').hidden = !vazio;
    $('[data-checkout]').hidden = vazio;
    $('[data-bag-foot]').hidden = vazio || currentTab !== 'bag';
    var tudo = cart.every(function (l) { return unitPrice(byId[l.id], l.pecas) != null; });
    var tot = cart.reduce(function (s, l) { return s + (unitPrice(byId[l.id], l.pecas) || 0) * l.qty; }, 0);
    $('[data-total]').textContent = tudo ? money(tot) : 'A confirmar';
  }
  $('[data-lines]').addEventListener('click', function (e) {
    var q = e.target.closest('[data-lq]'), r = e.target.closest('[data-rm]');
    if (q) { var l = cart[+q.getAttribute('data-i')]; l.qty = Math.max(1, Math.min(10, l.qty + (+q.getAttribute('data-lq')))); saveCart(); }
    if (r) { cart.splice(+r.getAttribute('data-rm'), 1); saveCart(); }
  });
  function renderFavs() {
    $('[data-favs]').innerHTML = favs.map(function (id) {
      var p = byId[id];
      return '<li class="line"><img src="' + esc(p.foto) + '" alt="" data-pdp="' + esc(id) + '"><div><p class="line__name">' + esc(p.nome) + '</p>' + priceHTML(p).replace('class="price', 'class="line__price price') +
        '<div class="line__row"><button class="line__add" type="button" data-pdp="' + esc(id) + '">Escolher tamanho</button><button class="line__rm" type="button" data-fav="' + esc(id) + '">Remover</button></div></div></li>';
    }).join('');
    $('[data-fav-empty]').hidden = favs.length > 0;
  }
  function renderCounts() {
    var n = cart.reduce(function (s, l) { return s + l.qty; }, 0);
    $$('[data-count="bag"]').forEach(function (b) { b.textContent = n; if (b.classList.contains('badge')) b.hidden = !n; });
    $$('[data-count="fav"]').forEach(function (b) { b.textContent = favs.length; if (b.classList.contains('badge')) b.hidden = !favs.length; });
  }
  var currentTab = 'bag';
  function setTab(t) {
    currentTab = t;
    $$('[data-tab-btn]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab-btn') === t)); });
    $$('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== t; });
    $('[data-bag-foot]').hidden = t !== 'bag' || !cart.length;
  }
  $$('[data-tab-btn]').forEach(function (b) { b.addEventListener('click', function () { setTab(b.getAttribute('data-tab-btn')); }); });

  // entrega: endereço só aparece quando faz sentido
  var form = $('[data-checkout]');
  function syncAddr() { $('[data-addr]').hidden = form.entrega.value === 'retirada'; }
  form.addEventListener('change', syncAddr); syncAddr();
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  $('[data-finish]').addEventListener('click', function () {
    if (!cart.length) return;
    var ent = form.entrega.value, nome = form.nome.value.trim(), end = form.endereco.value.trim();
    var linhas = cart.map(function (l, i) {
      var p = byId[l.id], u = unitPrice(p, l.pecas);
      return (i + 1) + ') ' + p.nome + '\n   ' + [lineDesc(l), l.qty + (l.qty > 1 ? ' unidades' : ' unidade')].filter(Boolean).join(' · ') + (u != null ? ' · ' + money(u * l.qty) : '');
    });
    var tudo = cart.every(function (l) { return unitPrice(byId[l.id], l.pecas) != null; });
    var tot = cart.reduce(function (s, l) { return s + (unitPrice(byId[l.id], l.pecas) || 0) * l.qty; }, 0);
    var ents = { olimpia: 'Entrega grátis em Olímpia', retirada: 'Retirar na loja', outra: 'Envio para outra cidade (combinar frete)' };
    var msg = 'Olá, Ella! Vim pelo site e quero fazer este pedido:\n\n' + linhas.join('\n') +
      (tudo ? '\n\nSubtotal: ' + money(tot) : '') +
      '\n\nRecebimento: ' + ents[ent] +
      (ent !== 'retirada' && end ? '\nEndereço: ' + end : '') +
      (nome ? '\nNome: ' + nome : '') +
      '\n\nPode confirmar a disponibilidade?';
    window.open(waUrl(msg), '_blank', 'noopener');
  });

  /* ---------- Busca ---------- */
  var res = $('[data-search-res]');
  function renderSearch(q) {
    var t = norm(q).trim();
    var l = !t ? PRODUTOS : PRODUTOS.filter(function (p) { return norm([p.nome, p.cor, p.modelo, p.categoria].join(' ')).indexOf(t) > -1; });
    res.innerHTML = (t ? '' : '<p>Sugestões</p>') + (l.length ? l.map(function (p) {
      return '<button class="sres" type="button" data-pdp="' + esc(p.id) + '"><img src="' + esc(p.foto) + '" alt=""><span><strong>' + esc(p.nome) + '</strong><small>' + esc([p.modelo, p.cor].filter(Boolean).join(' · ')) + '</small></span></button>';
    }).join('') : '<p>Nada encontrado para “' + esc(q) + '”. <a href="' + waUrl('Olá, Ella! Vim pelo site e estou procurando: ' + q) + '" target="_blank" rel="noopener"><u>Pergunte no WhatsApp</u></a></p>');
  }
  $('[data-search-input]').addEventListener('input', function (e) { renderSearch(e.target.value); });
  $('[data-search-input]').addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); $('#search').close(); unlock(); } });

  /* ---------- Instagram ---------- */
  var ig = $('[data-insta]');
  if (ig && SITE.instagram) {
    var fotos = PRODUTOS.map(function (p) { return [p.foto, p.nome]; }).concat([['assets/img/loja.webp', 'Loja Ella Beachwear']]).slice(0, 6);
    ig.innerHTML = fotos.map(function (f) {
      return '<a href="https://instagram.com/' + esc(SITE.instagram) + '" target="_blank" rel="noopener" aria-label="Ver no Instagram: ' + esc(f[1]) + '"><img src="' + esc(f[0]) + '" alt="" loading="lazy" decoding="async">' + icon('ig') + '</a>';
    }).join('');
  }

  /* ---------- Aviso rápido ---------- */
  var toastEl = $('[data-toast]'), tt;
  function toast(txt) { $('[data-toast-txt]').textContent = txt; toastEl.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(hideToast, 4000); }
  function hideToast() { toastEl.classList.remove('is-on'); }

  /* ---------- Revelar ao rolar ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });

  renderGrid(); renderFilters(); renderCart(); renderFavs(); renderCounts(); setTab('bag');
})();
