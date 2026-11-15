<?php
declare(strict_types=1);

$CFG = require __DIR__ . '/config.php';
date_default_timezone_set($CFG['timezone'] ?? 'America/Sao_Paulo');

function cfg(string $k) { global $CFG; return $CFG[$k] ?? null; }

/* ---------- Banco ---------- */
function db(): PDO {
    static $pdo = null;
    if (!$pdo) {
        $d = cfg('db');
        $pdo = new PDO(
            "mysql:host={$d['host']};dbname={$d['name']};charset=utf8mb4",
            $d['user'], $d['pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
        $pdo->exec("SET time_zone = '" . (new DateTime())->format('P') . "'");
    }
    return $pdo;
}
function q(string $sql, array $p = []): PDOStatement { $s = db()->prepare($sql); $s->execute($p); return $s; }
function h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/* ---------- Sessão / login ---------- */
function start_session(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS'])]);
        session_start();
    }
}
function require_login(): void {
    start_session();
    if (empty($_SESSION['ok'])) { header('Location: login.php'); exit; }
}
function csrf(): string {
    start_session();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
    return $_SESSION['csrf'];
}
function csrf_field(): string { return '<input type="hidden" name="csrf" value="' . csrf() . '">'; }
function check_csrf(): void {
    start_session();
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        http_response_code(400); exit('Sessão expirada. Volte e tente de novo.');
    }
}

/* ---------- Google Places API (New) ---------- */
// Executa várias buscas em paralelo. Retorna [indice => resposta decodificada | ['_error'=>msg]]
function places_multi(array $bodies, string $mask, int $conc = 8): array {
    $results = []; $queue = array_keys($bodies); $active = [];
    $mh = curl_multi_init();
    $make = function ($i) use ($bodies, $mask) {
        $ch = curl_init('https://places.googleapis.com/v1/places:searchText');
        curl_setopt_array($ch, [
            CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-Goog-Api-Key: ' . cfg('google_api_key'),
                'X-Goog-FieldMask: ' . $mask,
            ],
            CURLOPT_POSTFIELDS => json_encode($bodies[$i]),
        ]);
        return $ch;
    };
    while ($queue || $active) {
        while ($queue && count($active) < $conc) {
            $i = array_shift($queue); $ch = $make($i);
            curl_multi_add_handle($mh, $ch); $active[spl_object_id($ch)] = [$i, $ch];
        }
        do { $st = curl_multi_exec($mh, $running); } while ($st === CURLM_CALL_MULTI_PERFORM);
        if ($running) curl_multi_select($mh, 1.0);
        while ($info = curl_multi_info_read($mh)) {
            $ch = $info['handle']; $id = spl_object_id($ch); [$i] = $active[$id];
            $raw = curl_multi_getcontent($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $data = json_decode($raw ?: '', true);
            $results[$i] = ($code === 200 && is_array($data))
                ? $data
                : ['_error' => $data['error']['message'] ?? ('HTTP ' . $code . ' ' . curl_error($ch))];
            curl_multi_remove_handle($mh, $ch); curl_close($ch); unset($active[$id]);
        }
    }
    curl_multi_close($mh);
    return $results;
}
function places_search(array $body, string $mask): array { return places_multi([$body], $mask)[0]; }

// Busca o perfil do cliente pelo nome/endereço (usado só no cadastro)
function find_business(string $text): array {
    $r = places_search(['textQuery' => $text, 'languageCode' => 'pt-BR', 'regionCode' => 'BR', 'pageSize' => 8],
        'places.id,places.displayName,places.formattedAddress,places.location');
    if (isset($r['_error'])) throw new RuntimeException('Google: ' . $r['_error']);
    return array_map(fn($p) => [
        'place_id' => $p['id'],
        'name' => $p['displayName']['text'] ?? '',
        'address' => $p['formattedAddress'] ?? '',
        'lat' => $p['location']['latitude'] ?? 0,
        'lng' => $p['location']['longitude'] ?? 0,
    ], $r['places'] ?? []);
}

/* ---------- Grade e varredura ---------- */
function grid_points(float $lat, float $lng, int $size, float $radiusKm): array {
    $pts = []; $half = intdiv($size, 2); $step = $half ? $radiusKm / $half : 0;
    for ($r = $half; $r >= -$half; $r--) {
        for ($c = -$half; $c <= $half; $c++) {
            $pts[] = [
                'lat' => round($lat + ($r * $step) / 111.32, 7),
                'lng' => round($lng + ($c * $step) / (111.32 * cos(deg2rad($lat))), 7),
            ];
        }
    }
    return $pts;
}

/* ---------- DataForSEO (chamadas em paralelo) ---------- */
function dfs_multi(array $bodies, int $conc = 10): array {
    $results = []; $queue = array_keys($bodies); $active = [];
    $auth = base64_encode(cfg('dfs_login') . ':' . cfg('dfs_password'));
    $mh = curl_multi_init();
    while ($queue || $active) {
        while ($queue && count($active) < $conc) {
            $i = array_shift($queue);
            $ch = curl_init('https://api.dataforseo.com/v3/serp/google/maps/live/advanced');
            curl_setopt_array($ch, [
                CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 90,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Basic ' . $auth],
                CURLOPT_POSTFIELDS => json_encode([$bodies[$i]]),
            ]);
            curl_multi_add_handle($mh, $ch); $active[spl_object_id($ch)] = [$i, $ch];
        }
        do { $st = curl_multi_exec($mh, $running); } while ($st === CURLM_CALL_MULTI_PERFORM);
        if ($running) curl_multi_select($mh, 1.0);
        while ($info = curl_multi_info_read($mh)) {
            $ch = $info['handle']; $id = spl_object_id($ch); [$i] = $active[$id];
            $data = json_decode(curl_multi_getcontent($ch) ?: '', true);
            $task = $data['tasks'][0] ?? null;
            if (($data['status_code'] ?? 0) !== 20000 || !$task || ($task['status_code'] ?? 0) !== 20000) {
                $results[$i] = ['_error' => $task['status_message'] ?? $data['status_message'] ?? ('HTTP ' . curl_getinfo($ch, CURLINFO_HTTP_CODE) . ' ' . curl_error($ch))];
            } else {
                // só resultados orgânicos (anúncios ficam de fora), na ordem do Maps
                $items = array_values(array_filter($task['result'][0]['items'] ?? [], fn($it) => ($it['type'] ?? '') === 'maps_search'));
                usort($items, fn($a, $b) => ($a['rank_group'] ?? 999) <=> ($b['rank_group'] ?? 999));
                $results[$i] = ['items' => $items];
            }
            curl_multi_remove_handle($mh, $ch); curl_close($ch); unset($active[$id]);
        }
    }
    curl_multi_close($mh);
    return $results;
}

/* ---------- Motores de varredura ----------
   Cada motor devolve, por ponto da grade:
   [indice => ['list' => [['id' => place_id, 'name' => nome|null], ...]] | ['_error' => msg]] */
function scan_engine(): string {
    return strtolower((string)(cfg('engine') ?? 'places')) === 'dataforseo' ? 'dataforseo' : 'places';
}

// Google Places API (New) Text Search. Pontos da grade pedem só places.id (SKU "IDs Only", gratuito).
// O ponto central pede também o nome (SKU Pro, 1 chamada por varredura) para a lista de concorrentes.
function scan_places(array $pts, string $keyword): array {
    if (!cfg('google_api_key')) throw new RuntimeException('Preencha google_api_key no config.php.');
    $radius = max(100.0, min(50000.0, (float)(cfg('places_bias_radius') ?? 2000)));
    $bodies = [];
    foreach ($pts as $i => $p) {
        $bodies[$i] = [
            'textQuery' => $keyword, 'languageCode' => 'pt-BR', 'regionCode' => 'BR', 'pageSize' => 20,
            'locationBias' => ['circle' => [
                'center' => ['latitude' => $p['lat'], 'longitude' => $p['lng']],
                'radius' => $radius,
            ]],
        ];
    }
    $mid = intdiv(count($pts), 2);
    $fetch = function (array $idx) use ($bodies, $mid): array {
        $out = [];
        $ids = array_intersect_key($bodies, array_flip(array_diff($idx, [$mid])));
        if ($ids) $out = places_multi($ids, 'places.id');
        if (in_array($mid, $idx, true)) $out[$mid] = places_multi([$mid => $bodies[$mid]], 'places.id,places.displayName')[$mid];
        return $out;
    };
    $res = $fetch(array_keys($bodies));
    // uma segunda tentativa só nos pontos que falharam (limite de requisições, instabilidade)
    $failed = array_keys(array_filter($res, fn($r) => isset($r['_error'])));
    if ($failed && count($failed) < count($pts)) { sleep(2); $res = $fetch($failed) + $res; }

    $out = [];
    foreach ($res as $i => $r) {
        $out[$i] = isset($r['_error']) ? $r : ['list' => array_map(
            fn($pl) => ['id' => $pl['id'] ?? '', 'name' => $pl['displayName']['text'] ?? null],
            $r['places'] ?? []
        )];
    }
    return $out;
}

// DataForSEO: resultado do Google Maps por coordenada (pago)
function scan_dataforseo(array $pts, string $keyword): array {
    if (!cfg('dfs_login') || !cfg('dfs_password')) throw new RuntimeException('Preencha dfs_login e dfs_password no config.php.');
    $zoom = (int)(cfg('maps_zoom') ?? 15);
    $bodies = [];
    foreach ($pts as $i => $p) {
        $bodies[$i] = [
            'keyword' => $keyword, 'language_code' => 'pt', 'device' => 'mobile', 'depth' => 20,
            'location_coordinate' => sprintf('%.7f,%.7f,%dz', $p['lat'], $p['lng'], $zoom),
        ];
    }
    $out = [];
    foreach (dfs_multi($bodies) as $i => $r) {
        $out[$i] = isset($r['_error']) ? $r : ['list' => array_map(
            fn($it) => ['id' => $it['place_id'] ?? '', 'name' => $it['title'] ?? null],
            $r['items']
        )];
    }
    return $out;
}

// Transforma o resultado do motor em posições por ponto, KPIs e concorrentes do centro
function summarize_scan(array $pts, array $res, string $placeId): array {
    $found = 0; $top3 = 0; $sum = 0; $valid = 0;
    foreach ($pts as $i => &$p) {
        if (!isset($res[$i]['list'])) { $p['rank'] = null; $p['err'] = 1; continue; }
        $valid++; $rank = null;
        foreach (array_slice($res[$i]['list'], 0, 20) as $n => $it) {
            if ($it['id'] === $placeId) { $rank = $n + 1; break; }
        }
        $p['rank'] = $rank;
        if ($rank) { $found++; if ($rank <= 3) $top3++; }
        $sum += $rank ?? 21; // fora do top 20 conta como 21
    }
    unset($p);

    $mid = intdiv(count($pts), 2); $comp = [];
    foreach (array_slice($res[$mid]['list'] ?? [], 0, 5) as $n => $it) {
        $comp[] = ['pos' => $n + 1, 'name' => $it['name'] ?? '?', 'me' => $it['id'] === $placeId];
    }
    return [
        'points' => $pts, 'competitors' => $comp,
        'avg_rank' => round($sum / max(1, $valid), 2),
        'top3_pct' => round($top3 * 100 / max(1, $valid), 1),
        'found_pct' => round($found * 100 / max(1, $valid), 1),
    ];
}

function run_scan(int $kid): array {
    @set_time_limit(300); // grade grande pode passar de 1 min
    $k = q('SELECT k.*, c.place_id, c.lat, c.lng FROM keywords k JOIN clients c ON c.id = k.client_id WHERE k.id = ?', [$kid])->fetch();
    if (!$k) throw new RuntimeException('Palavra-chave não encontrada.');

    $pts = grid_points((float)$k['lat'], (float)$k['lng'], (int)$k['grid_size'], (float)$k['radius_km']);
    $engine = scan_engine();
    $res = $engine === 'dataforseo' ? scan_dataforseo($pts, $k['keyword']) : scan_places($pts, $k['keyword']);
    $errors = array_filter($res, fn($r) => isset($r['_error']));
    if (count($errors) > count($pts) / 4) {
        throw new RuntimeException(($engine === 'dataforseo' ? 'DataForSEO: ' : 'Google Places: ') . reset($errors)['_error']);
    }

    $s = summarize_scan($pts, $res, (string)$k['place_id']);
    q('INSERT INTO scans (keyword_id, avg_rank, top3_pct, found_pct, points, competitors) VALUES (?,?,?,?,?,?)',
        [$kid, $s['avg_rank'], $s['top3_pct'], $s['found_pct'], json_encode($s['points']), json_encode($s['competitors'], JSON_UNESCAPED_UNICODE)]);
    return ['avg_rank' => $s['avg_rank'], 'top3_pct' => $s['top3_pct'], 'found_pct' => $s['found_pct']];
}

/* ---------- Layout ---------- */
function page_header(string $title, bool $nav = true): void { ?>
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= h($title) ?> · Ranking Local</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<link rel="stylesheet" href="assets/style.css">
<script src="assets/map.js?v=3"></script>
<?php if ($mk = trim((string)cfg('maps_js_key'))): ?>
<script>RL.useGoogle();</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=<?= h(rawurlencode($mk)) ?>&amp;v=weekly&amp;loading=async&amp;language=pt-BR&amp;region=BR&amp;callback=rlGmapsReady" onerror="RL.googleFailed()"></script>
<?php endif; ?>
</head><body>
<header class="top"><a href="index.php" class="brand">Ranking Local <span>· Consultório de Sucesso</span></a>
<?php if ($nav): ?><nav><a href="index.php">Clientes</a><a href="logout.php">Sair</a></nav><?php endif; ?></header>
<main>
<?php }
function page_footer(): void { echo '</main></body></html>'; }

function rank_class(?int $r): string {
    if ($r === null) return 'r-none';
    if ($r <= 3) return 'r-top';
    if ($r <= 10) return 'r-mid';
    return 'r-low';
}

/* Visão do cliente (usada no painel e no link de compartilhamento) */
function render_client(array $c, bool $readonly): void {
    $kws = q('SELECT * FROM keywords WHERE client_id = ? ORDER BY id', [$c['id']])->fetchAll();
    if (!$kws) { echo '<p class="muted">Nenhuma palavra-chave cadastrada ainda.</p>'; return; }
    foreach ($kws as $k) {
        $scans = q('SELECT * FROM scans WHERE keyword_id = ? ORDER BY created_at DESC LIMIT 26', [$k['id']])->fetchAll();
        $last = $scans[0] ?? null; $prev = $scans[1] ?? null;
        echo '<section class="card"><div class="card-head"><div><h2>' . h($k['keyword']) . '</h2>';
        echo '<p class="muted">Grade ' . (int)$k['grid_size'] . '×' . (int)$k['grid_size'] . ' · raio ' . h(rtrim(rtrim($k['radius_km'], '0'), '.')) . ' km';
        if ($last) echo ' · última varredura ' . h(date('d/m/Y H:i', strtotime($last['created_at'])));
        echo '</p></div>';
        if (!$readonly) {
            echo '<div class="actions"><form method="post">' . csrf_field() . '<input type="hidden" name="action" value="scan"><input type="hidden" name="kid" value="' . $k['id'] . '"><button class="btn">Varrer agora</button></form>';
            echo '<form method="post" onsubmit="return confirm(\'Apagar esta palavra-chave e todo o histórico dela?\')">' . csrf_field() . '<input type="hidden" name="action" value="del_kw"><input type="hidden" name="kid" value="' . $k['id'] . '"><button class="btn ghost">Apagar</button></form></div>';
        }
        echo '</div>';
        if (!$last) { echo '<p class="muted">Ainda sem varredura. ' . ($readonly ? '' : 'Clique em “Varrer agora”.') . '</p></section>'; continue; }

        $delta = function ($cur, $old, $lowerIsBetter) {
            if ($old === null) return '';
            $d = (float)$cur - (float)$old; if (abs($d) < 0.01) return '<small class="eq">=</small>';
            $good = $lowerIsBetter ? $d < 0 : $d > 0;
            return '<small class="' . ($good ? 'up' : 'down') . '">' . ($d > 0 ? '+' : '') . rtrim(rtrim(number_format($d, 1, ',', ''), '0'), ',') . '</small>';
        };
        echo '<div class="kpis">';
        echo '<div><b>' . number_format((float)$last['avg_rank'], 1, ',', '') . '</b>' . $delta($last['avg_rank'], $prev['avg_rank'] ?? null, true) . '<span>posição média</span></div>';
        echo '<div><b>' . number_format((float)$last['top3_pct'], 0) . '%</b>' . $delta($last['top3_pct'], $prev['top3_pct'] ?? null, false) . '<span>da área no top 3</span></div>';
        echo '<div><b>' . number_format((float)$last['found_pct'], 0) . '%</b>' . $delta($last['found_pct'], $prev['found_pct'] ?? null, false) . '<span>da área no top 20</span></div>';
        echo '</div>';

        $mapId = 'map' . $k['id']; $chartId = 'ch' . $k['id'];
        echo '<div class="grid2"><div><div id="' . $mapId . '" class="map"></div>';
        echo '<p class="legend"><i class="r-top"></i>1–3 <i class="r-mid"></i>4–10 <i class="r-low"></i>11–20 <i class="r-none"></i>fora do top 20</p></div><div>';
        $comp = json_decode($last['competitors'] ?? '[]', true) ?: [];
        if ($comp) {
            echo '<h3>Quem aparece no centro</h3><ol class="comp">';
            foreach ($comp as $cp) echo '<li' . ($cp['me'] ? ' class="me"' : '') . '>' . h($cp['name']) . '</li>';
            echo '</ol>';
        }
        if (count($scans) > 1) echo '<h3>Evolução da posição média</h3><canvas id="' . $chartId . '" height="160"></canvas>';
        echo '</div></div>';

        echo '<details><summary>Histórico (' . count($scans) . ')</summary><table><tr><th>Data</th><th>Posição média</th><th>Top 3</th><th>Top 20</th></tr>';
        foreach ($scans as $s) echo '<tr><td>' . h(date('d/m/Y', strtotime($s['created_at']))) . '</td><td>' . number_format((float)$s['avg_rank'], 1, ',', '') . '</td><td>' . (int)$s['top3_pct'] . '%</td><td>' . (int)$s['found_pct'] . '%</td></tr>';
        echo '</table></details></section>';

        $hist = array_reverse(array_map(fn($s) => ['d' => date('d/m', strtotime($s['created_at'])), 'v' => (float)$s['avg_rank']], $scans));
        $flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE;
        echo '<script>RL.add(' . json_encode([
            'map' => $mapId, 'chart' => $chartId,
            'pts' => json_decode($last['points'] ?? '[]', true) ?: [],
            'home' => [(float)$c['lat'], (float)$c['lng']],
            'hist' => $hist,
        ], $flags) . ');</script>';
    }
}
