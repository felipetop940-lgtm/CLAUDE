(function () {
  'use strict';
  var doc = document, root = doc.documentElement, SITE = window.SITE || {};
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var get = function (path) { return path.split('.').reduce(function (o, k) { return o ? o[k] : ''; }, SITE); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var icon = function (id) { return '<svg class="i" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  var uniq = function (a) { return a.filter(function (v, i) { return v && a.indexOf(v) === i; }); };
  var plural = function (n, s, p) { return n + ' ' + (n === 1 ? s : p); };
  root.classList.add('js');

  /* ---------- Produtos ---------- */
  var PRODUTOS = (window.PRODUTOS || []).filter(function (p) { return p && p.id; }).map(function (p, i) {
    p.fotos = (p.fotos && p.fotos.length) ? p.fotos : (p.foto ? [p.foto] : []);
    p.foto = p.fotos[0] || '';
    p.detalhes = p.detalhes || [];
    p._i = i;
    return p;
  });
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
  var isBiquini = function (p) { return /biqu/i.test(p.categoria || '') || p.tipo === 'biquini'; };
  function unitPrice(p, pecas) {
    if (!isBiquini(p) || pecas === 'conjunto' || !pecas) {
      if (has(p.preco)) return p.preco;
      if (isBiquini(p) && has(p.precoTop) && has(p.precoCalcinha)) return p.precoTop + p.precoCalcinha;
      return null;
    }
    return pecas === 'top' ? (has(p.precoTop) ? p.precoTop : null) : (has(p.precoCalcinha) ? p.precoCalcinha : null);
  }
  function refPrice(p) { var v = unitPrice(p, 'conjunto'); if (v == null && has(p.precoTop)) v = p.precoTop; if (v == null && has(p.precoCalcinha)) v = p.precoCalcinha; return v; }
  function priceHTML(p, cls) {
    cls = cls ? ' ' + cls : '';
    if (isBiquini(p) && (has(p.precoTop) || has(p.precoCalcinha)) && !has(p.preco)) {
      var parts = [];
      if (has(p.precoTop)) parts.push('<span title="Top">' + icon('top') + money(p.precoTop) + '</span>');
      if (has(p.precoCalcinha)) parts.push('<span title="Calcinha">' + icon('bottom') + money(p.precoCalcinha) + '</span>');
      return '<p class="price' + cls + '">' + parts.join('<i class="price__sep" aria-hidden="true"></i>') + '</p>';
    }
    if (has(p.preco)) return '<p class="price' + cls + '"><span>' + money(p.preco) + '</span></p>';
    return '<p class="price price--ask' + cls + '">Consulte o valor</p>';
  }
  var anyPrice = PRODUTOS.some(function (p) { return refPrice(p) != null; });
  if (!anyPrice) $$('[data-need-price]').forEach(function (o) { o.remove(); });
  var sizesOf = function (p) { return (p.tamanhos && p.tamanhos.length) ? p.tamanhos : (SITE.tamanhos || ['P', 'M', 'G']); };
  var CORES = SITE.coresHex || {};
  var corBg = function (c) { return CORES[c] || '#D9C3A5'; };

  /* ---------- Faixa de avisos e header ---------- */
  var msgs = $$('.topbar__msgs p'), mi = 0;
  if (msgs.length > 1) setInterval(function () {
    msgs[mi].classList.remove('is-on'); mi = (mi + 1) % msgs.length; msgs[mi].classList.add('is-on');
  }, 4500);
  var header = $('.header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 30); };
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
    if (dias.indexOf(n.dia) > -1 && n.h >= a && n.h < f) return { aberto: true, txt: 'Loja aberta agora · até as ' + f + 'h' };
    if (dias.indexOf(n.dia) > -1 && n.h < a) return { aberto: false, txt: 'Loja fechada · abre hoje às ' + a + 'h' };
    for (var k = 1; k <= 7; k++) {
      var d = (n.dia + k) % 7;
      if (dias.indexOf(d) > -1) return { aberto: false, txt: 'Loja fechada · abre ' + (k === 1 ? 'amanhã' : DIAS_LONGOS[d]) + ' às ' + a + 'h' };
    }
    return null;
  }
  var st = statusLoja();
  $$('[data-status]').forEach(function (el) {
    if (!st) { el.hidden = true; return; }
    el.classList.add(st.aberto ? 'is-open' : 'is-closed'); $('[data-status-txt]', el).textContent = st.txt;
  });
  var week = $('[data-week]');
  if (week && HOR.dias) {
    var hoje = agoraSP().dia;
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      var li = doc.createElement('li'), on = HOR.dias.indexOf(d) > -1;
      li.className = (on ? '' : 'is-off') + (d === hoje ? ' is-today' : '');
      li.innerHTML = '<b>' + DIAS[d] + '</b>' + (on ? HOR.abre + '–' + HOR.fecha + 'h' : 'Fechado');
      if (d === hoje) li.setAttribute('aria-current', 'date');
      week.appendChild(li);
    });
  }

  /* ---------- Diálogos ---------- */
  var openDialogs = function () { return $$('dialog[open]'); };
  function unlock() { if (!openDialogs().length) doc.body.classList.remove('lock'); }
  function openDialog(id) {
    var d = doc.getElementById(id); if (!d) return null;
    openDialogs().forEach(function (o) { if (o !== d) o.close(); });
    if (!d.open) d.showModal();
    doc.body.classList.add('lock');
    return d;
  }
  function closeAll() { openDialogs().forEach(function (o) { o.close(); }); unlock(); }
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
    openDialog(id);
    if (id === 'search') { var inp = $('[data-search-input]'); inp.value = ''; renderSearch(''); setTimeout(function () { inp.focus(); }, 30); }
    hideToast();
  });

  /* ---------- Cards ---------- */
  function cardHTML(p, i, big) {
    var fav = favs.indexOf(p.id) > -1, tags = '';
    if (p.esgotado) tags += '<span class="tag tag--out">Esgotado</span>';
    else if (p.novo) tags += '<span class="tag">Novo</span>';
    return '<article class="card' + (big ? ' card--big' : '') + (p.esgotado ? ' is-out' : '') + '" style="--n:' + (i % 12) + '" data-id="' + esc(p.id) + '">' +
      '<div class="card__media" data-pdp="' + esc(p.id) + '">' +
        '<img src="' + esc(p.foto) + '" alt="' + esc(p.nome) + '" width="739" height="985" loading="' + (i < 4 ? 'eager' : 'lazy') + '" decoding="async">' +
        (p.fotoModelo ? '<img class="card__alt" src="' + esc(p.fotoModelo) + '" alt="" loading="lazy" decoding="async">' : '') +
        (tags ? '<div class="tags">' + tags + '</div>' : '') +
        '<button class="fav" type="button" data-fav="' + esc(p.id) + '" aria-pressed="' + fav + '" aria-label="Favoritar ' + esc(p.nome) + '">' + icon('heart') + '</button>' +
        (p.esgotado ? '' : '<div class="card__quick"><div class="card__sizes" aria-label="Tamanhos">' + sizesOf(p).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>' +
          '<button class="card__add" type="button" data-pdp="' + esc(p.id) + '">Adicionar à sacola</button></div>') +
      '</div>' +
      '<div class="card__body"><h3 class="card__name"><button type="button" data-pdp="' + esc(p.id) + '">' + esc(p.nome) + '</button></h3>' +
        (p.codigo ? '<p class="card__code">Cód. ' + esc(p.codigo) + '</p>' : '') + priceHTML(p) + '</div>' +
    '</article>';
  }
  var temFotoModelo = PRODUTOS.some(function (p) { return p.fotoModelo; });

  /* ---------- Página principal ---------- */
  var destaques = PRODUTOS.filter(function (p) { return p.destaque && !p.esgotado; }).sort(function (a, b) { return a.destaque - b.destaque; });
  if (!destaques.length) destaques = PRODUTOS.filter(function (p) { return !p.esgotado; });
  destaques = destaques.slice(0, SITE.destaquesNaHome || 5);
  function renderHome() {
    var feat = $('[data-feat]');
    feat.innerHTML = destaques.map(function (p, i) { return cardHTML(p, i, i === 0 && destaques.length >= 3); }).join('');
    $$('[data-total-pecas]').forEach(function (el) { el.textContent = plural(PRODUTOS.length, 'peça', 'peças'); });
    var hp = destaques[1] || destaques[0];
    var heroProd = $('[data-hero-prod]');
    if (hp && heroProd) { heroProd.innerHTML = '<img src="' + esc(hp.foto) + '" alt="" width="739" height="985">'; heroProd.setAttribute('data-pdp', hp.id); }
    // Por modelo
    var modelos = uniq(PRODUTOS.map(function (p) { return p.modelo; }));
    $('[data-models]').innerHTML = modelos.map(function (m) {
      var l = PRODUTOS.filter(function (p) { return p.modelo === m; });
      var capa = l.filter(function (p) { return p.destaque; }).sort(function (a, b) { return a.destaque - b.destaque; })[0] || l[0];
      return '<a class="model" href="#catalogo?modelo=' + encodeURIComponent(m) + '"><figure class="arch"><img src="' + esc(capa.foto) + '" alt="" loading="lazy" decoding="async"></figure><strong>' + esc(m) + '</strong><small>' + plural(l.length, 'peça', 'peças') + '</small></a>';
    }).join('');
    // Por cor
    var cores = uniq(PRODUTOS.map(function (p) { return p.cor; }));
    $('[data-swatches]').innerHTML = cores.map(function (c) {
      var n = PRODUTOS.filter(function (p) { return p.cor === c; }).length;
      return '<a class="sw" href="#catalogo?cor=' + encodeURIComponent(c) + '"><span class="dot" style="background:' + corBg(c) + '"></span>' + esc(c) + ' <small>' + n + '</small></a>';
    }).join('');
    // Instagram
    var ig = $('[data-insta]');
    if (ig && SITE.instagram) {
      var fotos = destaques.map(function (p) { return [p.foto, p.nome]; }).concat([['assets/img/loja.webp', 'Loja Ella Beachwear']]).slice(0, 6);
      ig.innerHTML = fotos.map(function (f) {
        return '<a href="https://instagram.com/' + esc(SITE.instagram) + '" target="_blank" rel="noopener" aria-label="Ver no Instagram: ' + esc(f[1]) + '"><img src="' + esc(f[0]) + '" alt="" loading="lazy" decoding="async">' + icon('ig') + '</a>';
      }).join('');
    }
  }
  $('[data-find-form]').addEventListener('submit', function (e) {
    e.preventDefault(); var q = e.target.q.value.trim();
    location.hash = 'catalogo' + (q ? '?q=' + encodeURIComponent(q) : '');
  });

  /* ---------- Catálogo: filtros ---------- */
  var FAIXAS = SITE.faixasPreco || [];
  function faixaDe(v) {
    if (v == null) return null;
    for (var i = 0; i < FAIXAS.length; i++) if (v <= FAIXAS[i]) return i === 0 ? 'Até ' + money(FAIXAS[0]) : money(FAIXAS[i - 1]) + ' a ' + money(FAIXAS[i]);
    return 'Acima de ' + money(FAIXAS[FAIXAS.length - 1]);
  }
  var FACETS = [
    { key: 'categoria', label: 'Categoria', get: function (p) { return [p.categoria]; } },
    { key: 'modelo', label: 'Modelo do top', get: function (p) { return [p.modelo]; } },
    { key: 'calcinha', label: 'Calcinha', get: function (p) { return [p.calcinha]; } },
    { key: 'cor', label: 'Cor', get: function (p) { return [p.cor]; }, swatch: true },
    { key: 'estampa', label: 'Estampa', get: function (p) { return [p.estampa]; } },
    { key: 'detalhes', label: 'Detalhes', get: function (p) { return p.detalhes; } },
    { key: 'tamanho', label: 'Tamanho', get: function (p) { return sizesOf(p); }, sizes: true },
    { key: 'preco', label: 'Preço', get: function (p) { return [faixaDe(refPrice(p))]; }, ordered: true },
    { key: 'disponibilidade', label: 'Disponibilidade', get: function (p) { return [p.esgotado ? 'Esgotado' : 'Disponível']; } }
  ];
  var facetBy = {}; FACETS.forEach(function (f) { facetBy[f.key] = f; });
  var F = { q: '', sel: {}, sort: 'destaque', page: 1 };
  var openGroups = {};
  var POR_PAGINA = SITE.porPagina || 24;
  var valoresDe = function (f, p) { return f.get(p).filter(Boolean); };

  function matchQ(p) {
    if (!F.q) return true;
    var hay = norm([p.nome, p.codigo, p.categoria, p.modelo, p.calcinha, p.cor, p.estampa, p.detalhes.join(' '), p.descricao].join(' '));
    return norm(F.q).split(/\s+/).filter(Boolean).every(function (w) { return hay.indexOf(w) > -1; });
  }
  function matches(p, except) {
    if (!matchQ(p)) return false;
    return Object.keys(F.sel).every(function (k) {
      var s = F.sel[k]; if (k === except || !s || !s.length) return true;
      var v = valoresDe(facetBy[k], p);
      return s.some(function (x) { return v.indexOf(x) > -1; });
    });
  }
  function resultado() {
    var l = PRODUTOS.filter(function (p) { return matches(p); });
    var s = F.sort;
    l.sort(function (a, b) {
      if (!!a.esgotado !== !!b.esgotado) return a.esgotado ? 1 : -1;
      if (s === 'az') return a.nome.localeCompare(b.nome, 'pt-BR');
      if (s === 'novo') return (b.novo ? 1 : 0) - (a.novo ? 1 : 0) || a._i - b._i;
      if (s === 'menor' || s === 'maior') {
        var x = refPrice(a), y = refPrice(b);
        if (x == null && y == null) return a._i - b._i; if (x == null) return 1; if (y == null) return -1;
        return s === 'menor' ? x - y : y - x;
      }
      var da = a.destaque || 1e6, db = b.destaque || 1e6;
      return da - db || a._i - b._i;
    });
    return l;
  }
  function nSel() { return Object.keys(F.sel).reduce(function (n, k) { return n + (F.sel[k] || []).length; }, 0); }

  function renderFilters() {
    var html = FACETS.map(function (f, gi) {
      var todos = uniq([].concat.apply([], PRODUTOS.map(function (p) { return valoresDe(f, p); })));
      var sel = F.sel[f.key] || [];
      if (todos.length < 2 && !sel.length) return '';
      if (f.ordered) todos.sort(function (a, b) { return a.localeCompare(b, 'pt-BR', { numeric: true }); });
      if (f.sizes) { var ordem = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'U']; todos.sort(function (a, b) { return (ordem.indexOf(a) + 1 || 99) - (ordem.indexOf(b) + 1 || 99); }); }
      var base = PRODUTOS.filter(function (p) { return matches(p, f.key); });
      var aberto = openGroups[f.key] != null ? openGroups[f.key] : (gi < 5 || sel.length > 0);
      var opts;
      if (f.sizes) {
        opts = '<div class="fsizes">' + todos.map(function (v) {
          return '<button type="button" class="fsize" data-fk="' + f.key + '" data-fv="' + esc(v) + '" aria-pressed="' + (sel.indexOf(v) > -1) + '">' + esc(v) + '</button>';
        }).join('') + '</div>';
      } else {
        opts = '<div class="fopts">' + todos.map(function (v) {
          var n = base.filter(function (p) { return valoresDe(f, p).indexOf(v) > -1; }).length, on = sel.indexOf(v) > -1;
          var mark = f.swatch ? '<span class="dot" style="background:' + corBg(v) + '"></span>' : '<span class="fopt__box">' + icon('check') + '</span>';
          return '<button type="button" class="fopt" data-fk="' + f.key + '" data-fv="' + esc(v) + '" aria-pressed="' + on + '"' + (!n && !on ? ' disabled' : '') + '>' + mark + esc(v) + '<small>' + n + '</small></button>';
        }).join('') + '</div>';
      }
      return '<details class="fgroup" data-group="' + f.key + '"' + (aberto ? ' open' : '') + '><summary>' + f.label + (sel.length ? '<em>' + sel.length + '</em>' : '') + icon('chev') + '</summary>' + opts + '</details>';
    }).join('');
    $$('[data-filters]').forEach(function (box) { box.innerHTML = html; });
    $$('[data-clear]').forEach(function (b) { if (b.classList.contains('side__clear')) b.hidden = !nSel() && !F.q; });
  }
  doc.addEventListener('toggle', function (e) {
    var g = e.target; if (!g.matches || !g.matches('.fgroup')) return;
    openGroups[g.getAttribute('data-group')] = g.open;
  }, true);
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fk]'); if (!b) return;
    var k = b.getAttribute('data-fk'), v = b.getAttribute('data-fv');
    var s = F.sel[k] = F.sel[k] || [];
    var i = s.indexOf(v); if (i > -1) s.splice(i, 1); else s.push(v);
    F.page = 1; atualizarCatalogo(true);
  });
  $$('[data-clear]').forEach(function (b) {
    b.addEventListener('click', function () { F.sel = {}; F.q = ''; $('[data-q]').value = ''; F.page = 1; atualizarCatalogo(true); });
  });

  var grid = $('[data-grid]');
  function renderCatalog() {
    renderFilters();
    var l = resultado(), mostra = l.slice(0, F.page * POR_PAGINA);
    grid.innerHTML = mostra.map(function (p, i) { return cardHTML(p, i); }).join('');
    grid.classList.toggle('has-alt', temFotoModelo);
    grid.classList.toggle('view-modelo', view === 'modelo');
    var total = PRODUTOS.length, filtrado = l.length !== total;
    $('[data-count-res]').textContent = filtrado ? l.length + ' de ' + plural(total, 'peça', 'peças') : plural(total, 'peça', 'peças');
    $('[data-cat-sub]').textContent = plural(total, 'peça', 'peças') + ' · ' + uniq(PRODUTOS.map(function (p) { return p.categoria; })).join(' · ');
    $('[data-empty]').hidden = l.length > 0;
    var more = $('[data-more]');
    more.hidden = mostra.length >= l.length;
    $('[data-more-txt]').textContent = 'Mostrando ' + mostra.length + ' de ' + l.length;
    var n = nSel() + (F.q ? 1 : 0), nEl = $('[data-filter-n]');
    nEl.textContent = n; nEl.hidden = !n;
    var ap = $('[data-filter-apply]'); if (ap) ap.textContent = 'Ver ' + plural(l.length, 'peça', 'peças');
    // filtros ativos
    var act = $('[data-active]'), chips = [];
    if (F.q) chips.push('<button type="button" class="achip" data-unq>Busca: “' + esc(F.q) + '”' + icon('close') + '</button>');
    Object.keys(F.sel).forEach(function (k) { (F.sel[k] || []).forEach(function (v) {
      chips.push('<button type="button" class="achip" data-fk="' + k + '" data-fv="' + esc(v) + '">' + esc(v) + icon('close') + '</button>');
    }); });
    if (chips.length > 1) chips.push('<button type="button" class="achip achip--clear" data-clear-all>Limpar tudo</button>');
    act.innerHTML = chips.join(''); act.hidden = !chips.length;
    // migalhas
    var unico = nSel() === 1 && !F.q ? [].concat.apply([], Object.keys(F.sel).map(function (k) { return F.sel[k]; }))[0] : (F.q && !nSel() ? 'Busca: “' + F.q + '”' : '');
    $('[data-crumb]').textContent = unico || ''; $('[data-crumb]').hidden = !unico; $('[data-crumb-sep]').hidden = !unico;
    // WhatsApp quando não acha
    var procura = [F.q].concat([].concat.apply([], Object.keys(F.sel).map(function (k) { return F.sel[k]; }))).filter(Boolean).join(', ');
    $('[data-wa-busca]').href = waUrl('Olá, Ella! Vim pelo site e estou procurando um biquíni' + (procura ? ': ' + procura : '') + '. Vocês têm?');
    $('[data-sort]').value = F.sort;
  }
  $('[data-active]').addEventListener('click', function (e) {
    if (e.target.closest('[data-unq]')) { F.q = ''; $('[data-q]').value = ''; F.page = 1; atualizarCatalogo(true); }
    if (e.target.closest('[data-clear-all]')) { F.sel = {}; F.q = ''; $('[data-q]').value = ''; F.page = 1; atualizarCatalogo(true); }
  });
  $('[data-more-btn]').addEventListener('click', function () { F.page++; renderCatalog(); });
  $('[data-sort]').addEventListener('change', function (e) { F.sort = e.target.value; F.page = 1; atualizarCatalogo(true); });
  var qInput = $('[data-q]'), qTimer;
  qInput.addEventListener('input', function () {
    $('[data-q-clear]').hidden = !qInput.value;
    clearTimeout(qTimer); qTimer = setTimeout(function () { F.q = qInput.value.trim(); F.page = 1; atualizarCatalogo(true); }, 180);
  });
  $('[data-q-clear]').addEventListener('click', function () { qInput.value = ''; this.hidden = true; F.q = ''; atualizarCatalogo(true); qInput.focus(); });
  $('[data-cat-search]').addEventListener('submit', function (e) { e.preventDefault(); qInput.blur(); });
  var view = 'peca';
  if (temFotoModelo) {
    $('[data-view-toggle]').hidden = false;
    $$('[data-view-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        view = b.getAttribute('data-view-btn');
        $$('[data-view-btn]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        renderCatalog();
      });
    });
  }

  // estado do catálogo no endereço (dá para mandar o link de um filtro, ex.: #catalogo?cor=Preto)
  function hashCatalogo() {
    var ps = [];
    if (F.q) ps.push('q=' + encodeURIComponent(F.q));
    Object.keys(F.sel).forEach(function (k) { if ((F.sel[k] || []).length) ps.push(k + '=' + F.sel[k].map(encodeURIComponent).join('|')); });
    if (F.sort !== 'destaque') ps.push('ordem=' + F.sort);
    return '#catalogo' + (ps.length ? '?' + ps.join('&') : '');
  }
  function lerHash(qs) {
    F = { q: '', sel: {}, sort: 'destaque', page: 1 };
    (qs || '').split('&').forEach(function (par) {
      if (!par) return;
      var i = par.indexOf('='), k = par.slice(0, i), v = par.slice(i + 1);
      if (k === 'q') F.q = decodeURIComponent(v);
      else if (k === 'ordem') F.sort = v;
      else if (facetBy[k]) F.sel[k] = v.split('|').map(decodeURIComponent);
    });
    qInput.value = F.q; $('[data-q-clear]').hidden = !F.q;
  }
  function atualizarCatalogo(syncHash) {
    renderCatalog();
    if (syncHash && currentView === 'catalogo') { try { history.replaceState(null, '', hashCatalogo()); } catch (e) {} }
  }

  /* ---------- Rotas: início · catálogo · link da peça ---------- */
  var currentView = '';
  function showView(v) {
    if (v === currentView) return false;
    currentView = v;
    $$('[data-view]').forEach(function (el) { el.hidden = el.getAttribute('data-view') !== v; });
    $$('[data-nav="catalogo"]').forEach(function (a) { a.classList.toggle('is-on', v === 'catalogo'); });
    doc.body.setAttribute('data-page', v);
    return true;
  }
  function irPara(el) { var y = el.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 8; window.scrollTo({ top: Math.max(0, y), behavior: 'instant' }); }
  function route() {
    var h = location.hash.slice(1);
    if (h === 'catalogo' || h.indexOf('catalogo?') === 0) {
      lerHash(h.split('?')[1]);
      var mudou = showView('catalogo');
      renderCatalog();
      if (mudou) window.scrollTo({ top: 0, behavior: 'instant' });
      closeAll();
      return;
    }
    if (h.indexOf('produto/') === 0) {
      var id = decodeURIComponent(h.slice(8));
      if (!currentView) { showView('catalogo'); renderCatalog(); }
      if (byId[id]) openPdp(id);
      return;
    }
    var mudouH = showView('home');
    if (mudouH) {
      var alvo = h && h !== 'inicio' ? doc.getElementById(h) : null;
      if (alvo) requestAnimationFrame(function () { irPara(alvo); }); else window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (h === 'inicio' || !h) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.addEventListener('hashchange', route);
  // links para a mesma rota (ex.: clicar em "Catálogo" já estando nele) voltam ao topo
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    if (a.getAttribute('href') === location.hash && /^#(catalogo|inicio)/.test(location.hash)) { e.preventDefault(); route(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
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
  var pdpEl = $('#pdp');
  function selDesc(s) {
    if (!isBiquini(s.p)) return s.tam ? 'Tamanho ' + s.tam : '';
    var a = [s.pecas === 'top' ? 'Só o top' : s.pecas === 'calcinha' ? 'Só a calcinha' : 'Conjunto'];
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
    var p = pdp.p, out = !!p.esgotado;
    var pieces = $('[data-pdp-pieces]');
    pieces.hidden = out || !(isBiquini(p) && separado);
    if (!pieces.hidden) pieces.innerHTML = [['conjunto', 'Conjunto'], ['top', 'Só o top'], ['calcinha', 'Só a calcinha']].map(function (o) {
      return '<button type="button" role="radio" data-pecas="' + o[0] + '" aria-checked="' + (pdp.pecas === o[0]) + '">' + o[1] + '</button>';
    }).join('');
    var html = '';
    if (!out) {
      if (isBiquini(p)) {
        if (pdp.pecas !== 'calcinha') html += sizeBlock('Tamanho do top', 'top', 'top', p);
        if (pdp.pecas !== 'top') html += sizeBlock('Tamanho da calcinha', 'calcinha', 'bottom', p);
      } else html += sizeBlock('Tamanho', 'tam', '', p);
    }
    $('[data-pdp-sizes]').innerHTML = html;
    $('[data-pdp-buy]').hidden = out; $('[data-pdp-soldout]').hidden = !out;
    $('[data-qty-out]', pdpEl).textContent = pdp.qty;
    var d = selDesc(pdp);
    var msg = out ? 'Olá, Ella! Vi no site o ' + p.nome + (p.codigo ? ' (cód. ' + p.codigo + ')' : '') + ', que está esgotado. Me avisa quando voltar?'
      : 'Olá, Ella! Vim pelo site e quero comprar:\n\n' + p.nome + (p.codigo ? ' (cód. ' + p.codigo + ')' : '') + (d ? '\n' + d : '') + '\nQuantidade: ' + pdp.qty + '\n\nTem disponível?';
    $('[data-pdp-wa]').href = waUrl(msg);
    $('[data-pdp-wa-txt]').textContent = out ? 'Avise-me quando voltar' : 'Comprar agora pelo WhatsApp';
  }
  function setFoto(src) { var img = $('[data-pdp-img]'); img.src = src; $$('[data-thumb]').forEach(function (t) { t.setAttribute('aria-current', String(t.getAttribute('data-thumb') === src)); }); }
  function openPdp(id) {
    var p = byId[id]; if (!p) return;
    pdp = { p: p, pecas: 'conjunto', top: '', calcinha: '', tam: '', qty: 1 };
    var fotos = p.fotos.concat(p.fotoModelo ? [p.fotoModelo] : []);
    $('[data-pdp-img]').alt = p.nome; setFoto(fotos[0]);
    var th = $('[data-pdp-thumbs]');
    th.hidden = fotos.length < 2;
    th.innerHTML = fotos.length < 2 ? '' : fotos.map(function (f) { return '<button type="button" data-thumb="' + esc(f) + '" aria-label="Ver foto"><img src="' + esc(f) + '" alt=""></button>'; }).join('');
    if (fotos.length > 1) setFoto(fotos[0]);
    $('[data-pdp-cat]').textContent = [p.categoria, p.modelo].filter(Boolean).join(' · ');
    $('[data-pdp-name]').textContent = p.nome;
    var code = $('[data-pdp-code]'); code.textContent = p.codigo ? 'Cód. ' + p.codigo : ''; code.hidden = !p.codigo;
    $('[data-pdp-price]').innerHTML = priceHTML(p);
    $('[data-pdp-desc]').textContent = p.descricao || '';
    var specs = [['Top', p.modelo], ['Calcinha', p.calcinha], ['Cor', p.cor], ['Estampa', p.estampa], ['Detalhes', p.detalhes.join(', ')]].filter(function (s) { return s[1]; });
    $('[data-pdp-specs]').innerHTML = specs.map(function (s) { return '<dt>' + s[0] + '</dt><dd>' + esc(s[1]) + '</dd>'; }).join('');
    $('[data-pdp-specs]').hidden = !specs.length;
    $('[data-pdp-fav]').setAttribute('aria-pressed', String(favs.indexOf(id) > -1));
    $('[data-pdp-size-help]').href = waUrl('Olá, Ella! Vim pelo site e queria ajuda com o tamanho do ' + p.nome + '.');
    $('[data-pdp-err]').textContent = '';
    // você também vai gostar: mesmo modelo, depois mesma cor, depois destaques
    var rel = PRODUTOS.filter(function (x) { return x.id !== id && !x.esgotado; }).sort(function (a, b) {
      var sa = (a.modelo === p.modelo ? 2 : 0) + (a.cor === p.cor ? 1 : 0), sb = (b.modelo === p.modelo ? 2 : 0) + (b.cor === p.cor ? 1 : 0);
      return sb - sa || (a.destaque || 1e6) - (b.destaque || 1e6);
    }).slice(0, 4);
    $('[data-pdp-rel]').innerHTML = rel.map(function (x, i) { return cardHTML(x, i); }).join('');
    $('[data-pdp-rel-wrap]').hidden = !rel.length;
    renderPdp();
    var d = openDialog('pdp'); if (d) d.scrollTop = 0;
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-pdp]'); if (!t || e.target.closest('[data-fav]')) return;
    e.preventDefault(); openPdp(t.getAttribute('data-pdp'));
  });
  pdpEl.addEventListener('click', function (e) {
    var tb = e.target.closest('[data-thumb]'); if (tb) { setFoto(tb.getAttribute('data-thumb')); return; }
    var s = e.target.closest('[data-size]');
    if (s) { pdp[s.getAttribute('data-size')] = s.getAttribute('data-v'); $('[data-pdp-err]').textContent = ''; renderPdp(); return; }
    var pc = e.target.closest('[data-pecas]');
    if (pc) { pdp.pecas = pc.getAttribute('data-pecas'); renderPdp(); return; }
    var q = e.target.closest('[data-qty]');
    if (q) { pdp.qty = Math.max(1, Math.min(10, pdp.qty + (+q.getAttribute('data-qty')))); renderPdp(); return; }
    if (e.target.closest('[data-pdp-fav]')) { toggleFav(pdp.p.id); return; }
    if (e.target.closest('[data-pdp-share]')) { compartilhar(); return; }
    if (e.target.closest('[data-add]')) addToCart();
  });
  function compartilhar() {
    var url = location.href.split('#')[0] + '#produto/' + encodeURIComponent(pdp.p.id);
    var ok = function () { toast('Link da peça copiado', true); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(ok, function () { window.prompt('Copie o link da peça:', url); });
    else window.prompt('Copie o link da peça:', url);
  }
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
  var currentTab = 'bag';
  function renderCart() {
    $('[data-lines]').innerHTML = cart.map(function (l, i) {
      var p = byId[l.id], u = unitPrice(p, l.pecas);
      return '<li class="line"><img src="' + esc(p.foto) + '" alt="" data-pdp="' + esc(p.id) + '">' +
        '<div><p class="line__name">' + esc(p.nome) + '</p><p class="line__meta">' + esc(lineDesc(l)) + '</p>' +
        '<p class="line__price price">' + (u != null ? money(u * l.qty) : '<span class="price--ask">Valor no WhatsApp</span>') + '</p>' +
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
      return '<li class="line"><img src="' + esc(p.foto) + '" alt="" data-pdp="' + esc(id) + '"><div><p class="line__name">' + esc(p.nome) + '</p>' + priceHTML(p, 'line__price') +
        '<div class="line__row"><button class="line__add" type="button" data-pdp="' + esc(id) + '">' + (p.esgotado ? 'Ver peça' : 'Escolher tamanho') + '</button><button class="line__rm" type="button" data-fav="' + esc(id) + '">Remover</button></div></div></li>';
    }).join('');
    $('[data-fav-empty]').hidden = favs.length > 0;
  }
  function renderCounts() {
    var n = cart.reduce(function (s, l) { return s + l.qty; }, 0);
    $$('[data-count="bag"]').forEach(function (b) { b.textContent = n; if (b.classList.contains('badge')) b.hidden = !n; });
    $$('[data-count="fav"]').forEach(function (b) { b.textContent = favs.length; if (b.classList.contains('badge')) b.hidden = !favs.length; });
  }
  function setTab(t) {
    currentTab = t;
    $$('[data-tab-btn]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab-btn') === t)); });
    $$('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== t; });
    $('[data-bag-foot]').hidden = t !== 'bag' || !cart.length;
  }
  $$('[data-tab-btn]').forEach(function (b) { b.addEventListener('click', function () { setTab(b.getAttribute('data-tab-btn')); }); });
  var form = $('[data-checkout]');
  function syncAddr() { $('[data-addr]').hidden = form.entrega.value === 'retirada'; }
  form.addEventListener('change', syncAddr); syncAddr();
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  $('[data-finish]').addEventListener('click', function () {
    if (!cart.length) return;
    var ent = form.entrega.value, nome = form.nome.value.trim(), end = form.endereco.value.trim();
    var linhas = cart.map(function (l, i) {
      var p = byId[l.id], u = unitPrice(p, l.pecas);
      return (i + 1) + ') ' + p.nome + (p.codigo ? ' (cód. ' + p.codigo + ')' : '') + '\n   ' + [lineDesc(l), plural(l.qty, 'unidade', 'unidades')].filter(Boolean).join(' · ') + (u != null ? ' · ' + money(u * l.qty) : '');
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

  /* ---------- Busca rápida (lupa do topo) ---------- */
  var res = $('[data-search-res]'), sInput = $('[data-search-input]');
  function renderSearch(q) {
    var t = q.trim(), salvo = F.q; F.q = t;
    var l = PRODUTOS.filter(matchQ); F.q = salvo;
    var lista = (t ? l : destaques).slice(0, 6);
    res.innerHTML = (t ? '' : '<p>Destaques</p>') + (lista.length ? lista.map(function (p) {
      return '<button class="sres" type="button" data-pdp="' + esc(p.id) + '"><img src="' + esc(p.foto) + '" alt=""><span><strong>' + esc(p.nome) + '</strong><small>' + esc([p.codigo && 'Cód. ' + p.codigo, p.modelo, p.cor].filter(Boolean).join(' · ')) + '</small></span></button>';
    }).join('') : '<p>Nada encontrado para “' + esc(q) + '”. <a href="' + waUrl('Olá, Ella! Vim pelo site e estou procurando: ' + q) + '" target="_blank" rel="noopener"><u>Pergunte no WhatsApp</u></a></p>') +
    (t && l.length ? '<a class="link search__all" href="#catalogo?q=' + encodeURIComponent(t) + '">Ver ' + (l.length > 1 ? 'todos os ' + l.length + ' resultados' : 'no catálogo') + icon('arrow') + '</a>' : '');
  }
  sInput.addEventListener('input', function () { renderSearch(sInput.value); });
  sInput.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); $('#search').close(); unlock(); } });
  $('[data-search-form]').addEventListener('submit', function (e) {
    e.preventDefault(); var q = sInput.value.trim();
    closeAll(); location.hash = 'catalogo' + (q ? '?q=' + encodeURIComponent(q) : '');
  });
  res.addEventListener('click', function (e) { if (e.target.closest('.search__all')) closeAll(); });

  /* ---------- Aviso rápido ---------- */
  var toastEl = $('[data-toast]'), tt;
  function toast(txt, semBotao) { $('[data-toast-txt]').textContent = txt; $('[data-toast-btn]').hidden = !!semBotao; toastEl.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(hideToast, 4000); }
  function hideToast() { toastEl.classList.remove('is-on'); }

  /* ---------- Revelar ao rolar ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });

  renderHome(); renderCart(); renderFavs(); renderCounts(); setTab('bag');
  route();
})();
