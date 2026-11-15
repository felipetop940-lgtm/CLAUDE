/* Ranking Local — mapa da grade (Google Maps JS, com Leaflet de reserva) e gráfico de evolução */
(function () {
  var COLORS = { top: '#16a34a', mid: '#f59e0b', low: '#ea580c', none: '#b91c1c', err: '#94a3b8' };
  var items = [], mode = 'leaflet', ready = false;

  function kind(p) { var r = p.rank; return p.err ? 'err' : r == null ? 'none' : r <= 3 ? 'top' : r <= 10 ? 'mid' : 'low'; }
  function label(p) { return p.err ? '–' : p.rank == null ? '20+' : String(p.rank); }
  function title(p) { return p.err ? 'Ponto sem leitura' : p.rank == null ? 'Fora do top 20' : 'Posição ' + p.rank; }

  function chart(it) {
    var el = document.getElementById(it.chart);
    if (!el || !window.Chart || !it.hist || it.hist.length < 2) return;
    new Chart(el, {
      type: 'line',
      data: { labels: it.hist.map(function (x) { return x.d; }),
        datasets: [{ data: it.hist.map(function (x) { return x.v; }), borderColor: '#0f766e', backgroundColor: 'rgba(15,118,110,.08)', fill: true, tension: .3 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { reverse: true, min: 1, title: { display: true, text: 'posição (menor = melhor)' } } } }
    });
  }

  function drawLeaflet(it) {
    var el = document.getElementById(it.map);
    if (!el || !window.L || !it.pts.length) return;
    var m = L.map(el, { scrollWheelZoom: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap © CARTO' }).addTo(m);
    var b = [];
    it.pts.forEach(function (p) {
      L.marker([p.lat, p.lng], { title: title(p), icon: L.divIcon({ className: 'pin r-' + kind(p), html: label(p), iconSize: [30, 30] }) }).addTo(m);
      b.push([p.lat, p.lng]);
    });
    L.marker(it.home, { icon: L.divIcon({ className: 'home', html: '★', iconSize: [18, 18], iconAnchor: [-3, 21] }), zIndexOffset: 1000 }).addTo(m);
    m.fitBounds(b, { padding: [18, 18] });
  }

  function drawGoogle(it) {
    var el = document.getElementById(it.map);
    if (!el || !it.pts.length) return;
    var g = google.maps;
    var fine = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
    var map = new g.Map(el, {
      center: { lat: it.home[0], lng: it.home[1] }, zoom: 13,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: true, clickableIcons: false,
      // computador: zoom direto na rolagem; celular: dois dedos, para não prender a rolagem da página
      gestureHandling: fine ? 'greedy' : 'cooperative'
    });
    var bounds = new g.LatLngBounds();
    it.pts.forEach(function (p) {
      var pos = { lat: p.lat, lng: p.lng }, t = label(p);
      new g.Marker({
        map: map, position: pos, title: title(p),
        icon: { path: g.SymbolPath.CIRCLE, scale: 15, fillColor: COLORS[kind(p)], fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
        label: { text: t, color: '#ffffff', fontWeight: '700', fontSize: t.length > 2 ? '11px' : '13px' }
      });
      bounds.extend(pos);
    });
    var star = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"><path d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7-6.3-3.5-6.3 3.5 1.3-7L1.8 9.2l7.1-.9z" fill="#0b1220" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    new g.Marker({
      map: map, position: { lat: it.home[0], lng: it.home[1] }, title: 'Endereço do cliente', zIndex: 9999,
      icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(star), scaledSize: new g.Size(24, 24), anchor: new g.Point(-1, 25) }
    });
    map.fitBounds(bounds, 34);
  }

  function draw(it) {
    if (it.drawn) return;
    it.drawn = true;
    try { mode === 'google' ? drawGoogle(it) : drawLeaflet(it); } catch (e) { if (window.console) console.error(e); }
  }

  function fallback() {
    mode = 'leaflet'; ready = true;
    items.forEach(function (it) {
      var el = document.getElementById(it.map);
      if (el && it.drawn) { // tira o que o Google tiver desenhado (aviso de erro) e recria o contêiner
        var fresh = el.cloneNode(false); fresh.removeAttribute('style'); el.parentNode.replaceChild(fresh, el);
      }
      it.drawn = false; draw(it);
    });
  }

  window.RL = {
    useGoogle: function () { mode = 'google'; ready = false; },
    googleFailed: fallback,
    add: function (it) { items.push(it); chart(it); if (ready) draw(it); }
  };
  ready = true; // sem chave do Google: Leaflet desenha na hora

  window.rlGmapsReady = function () {
    var g = google.maps, libs = g.importLibrary ? Promise.all([g.importLibrary('maps'), g.importLibrary('marker')]) : Promise.resolve();
    libs.then(function () { ready = true; items.forEach(draw); }, fallback);
  };
  window.gm_authFailure = fallback; // chave inválida ou domínio não autorizado
})();
