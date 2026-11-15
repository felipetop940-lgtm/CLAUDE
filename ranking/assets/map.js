/* Ranking Local — mapa da grade com linha do tempo (Google Maps JS, com Leaflet de reserva) e gráficos */
(function () {
  var COLORS = { top: '#16a34a', mid: '#f59e0b', low: '#ea580c', none: '#b91c1c', err: '#94a3b8' };
  var items = [], mode = 'leaflet', ready = false;

  function kind(p) { var r = p.rank; return p.err ? 'err' : r == null ? 'none' : r <= 3 ? 'top' : r <= 10 ? 'mid' : 'low'; }
  function label(p) { return p.err ? '–' : p.rank == null ? '20+' : String(p.rank); }
  function title(p) { return p.err ? 'Ponto sem leitura' : p.rank == null ? 'Fora do top 20' : 'Posição ' + p.rank; }

  /* ---- Leaflet ---- */
  function leafletApi(el, it) {
    var m = L.map(el, { scrollWheelZoom: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap © CARTO' }).addTo(m);
    var layer = L.layerGroup().addTo(m), fitted = false;
    L.marker(it.home, { icon: L.divIcon({ className: 'home', html: '★', iconSize: [18, 18], iconAnchor: [-3, 21] }), zIndexOffset: 1000 }).addTo(m);
    return { setPoints: function (pts) {
      layer.clearLayers();
      pts.forEach(function (p) {
        L.marker([p.lat, p.lng], { title: title(p), icon: L.divIcon({ className: 'pin r-' + kind(p), html: label(p), iconSize: [30, 30] }) }).addTo(layer);
      });
      if (!fitted && pts.length) { m.fitBounds(pts.map(function (p) { return [p.lat, p.lng]; }), { padding: [18, 18] }); fitted = true; }
    } };
  }

  /* ---- Google Maps ---- */
  function googleApi(el, it) {
    var g = google.maps;
    var fine = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
    var map = new g.Map(el, {
      center: { lat: it.home[0], lng: it.home[1] }, zoom: 13,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: true, clickableIcons: false,
      // computador: zoom direto na rolagem; celular: dois dedos, para não prender a rolagem da página
      gestureHandling: fine ? 'greedy' : 'cooperative'
    });
    var star = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"><path d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7-6.3-3.5-6.3 3.5 1.3-7L1.8 9.2l7.1-.9z" fill="#0b1220" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    new g.Marker({
      map: map, position: { lat: it.home[0], lng: it.home[1] }, title: 'Endereço do cliente', zIndex: 9999,
      icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(star), scaledSize: new g.Size(24, 24), anchor: new g.Point(-1, 25) }
    });
    var markers = [], fitted = false;
    return { setPoints: function (pts) {
      markers.forEach(function (mk) { mk.setMap(null); }); markers = [];
      var bounds = new g.LatLngBounds();
      pts.forEach(function (p) {
        var pos = { lat: p.lat, lng: p.lng }, t = label(p);
        markers.push(new g.Marker({
          map: map, position: pos, title: title(p),
          icon: { path: g.SymbolPath.CIRCLE, scale: 15, fillColor: COLORS[kind(p)], fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
          label: { text: t, color: '#ffffff', fontWeight: '700', fontSize: t.length > 2 ? '11px' : '13px' }
        }));
        bounds.extend(pos);
      });
      if (!fitted && pts.length) { map.fitBounds(bounds, 34); fitted = true; }
    } };
  }

  /* ---- linha do tempo ---- */
  function show(it, i) {
    var n = it.scans.length; if (!n) return;
    it.idx = Math.max(0, Math.min(n - 1, i));
    var s = it.scans[it.idx];
    if (it.api) it.api.setPoints(s.pts);
    var c = it.ctrlEl; if (!c) return;
    var range = c.querySelector('input'), lab = c.querySelector('.tl-label'), btns = c.querySelectorAll('button');
    if (range) range.value = it.idx;
    if (btns[0]) btns[0].disabled = it.idx === 0;
    if (btns[1]) btns[1].disabled = it.idx === n - 1;
    if (lab) lab.textContent = s.d + (it.idx === n - 1 ? ' (mais recente)' : '') + ' · média ' + s.avg + ' · top 3 ' + s.top3 + '% · top 20 ' + s.found + '%';
  }
  function wire(it) {
    var c = it.ctrlEl = document.getElementById(it.ctrl); if (!c) return;
    var range = c.querySelector('input');
    if (range) range.addEventListener('input', function () { show(it, parseInt(range.value, 10)); });
    c.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { show(it, it.idx + parseInt(b.getAttribute('data-d'), 10)); });
    });
  }

  function draw(it) {
    if (it.drawn) return;
    it.drawn = true;
    var el = document.getElementById(it.map);
    try {
      if (el && it.scans.length) it.api = mode === 'google' ? googleApi(el, it) : (window.L ? leafletApi(el, it) : null);
    } catch (e) { it.api = null; if (window.console) console.error(e); }
    show(it, it.idx == null ? it.scans.length - 1 : it.idx);
  }

  function fallback() {
    mode = 'leaflet'; ready = true;
    items.forEach(function (it) {
      var el = document.getElementById(it.map);
      if (el && it.drawn) { // tira o que o Google tiver desenhado (aviso de erro) e recria o contêiner
        var fresh = el.cloneNode(false); fresh.removeAttribute('style'); el.parentNode.replaceChild(fresh, el);
      }
      it.drawn = false; it.api = null; draw(it);
    });
  }

  window.RL = {
    useGoogle: function () { mode = 'google'; ready = false; },
    googleFailed: fallback,
    add: function (it) { it.scans = it.scans || []; items.push(it); wire(it); if (ready) draw(it); else show(it, it.scans.length - 1); },
    chart: function (id, labels, values, o) {
      var el = document.getElementById(id); o = o || {};
      if (!el || !window.Chart || values.length < 2) return;
      var y = { reverse: !!o.reverse, grid: { color: '#eef2ef' }, ticks: { color: '#6b7a72', callback: function (v) { return v + (o.suffix || ''); } } };
      if (o.reverse) y.min = 1; else y.min = 0;
      if (o.max != null) y.max = o.max;
      new Chart(el, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: o.label || '', data: values, borderColor: '#12804a', backgroundColor: 'rgba(18,128,74,.09)', pointBackgroundColor: '#12804a', pointRadius: 3, borderWidth: 2.5, fill: o.reverse ? 'end' : 'origin', tension: .3 }] },
        options: { plugins: { legend: { display: false } }, scales: { y: y, x: { grid: { display: false }, ticks: { color: '#6b7a72' } } } }
      });
    }
  };
  ready = true; // sem chave do Google: Leaflet desenha na hora

  window.rlGmapsReady = function () {
    var g = google.maps, libs = g.importLibrary ? Promise.all([g.importLibrary('maps'), g.importLibrary('marker')]) : Promise.resolve();
    libs.then(function () { ready = true; items.forEach(draw); }, fallback);
  };
  window.gm_authFailure = fallback; // chave inválida ou domínio não autorizado

  // botões de varredura: mostram que está rodando e evitam clique duplo
  document.addEventListener('submit', function (e) {
    var b = e.target.querySelector('button[data-busy]');
    if (b) { b.textContent = b.getAttribute('data-busy'); setTimeout(function () { b.disabled = true; }, 0); }
  });
})();
