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
        migrate($pdo);
    }
    return $pdo;
}

// Cria/atualiza as tabelas novas sozinho (não precisa mexer no phpMyAdmin)
function migrate(PDO $pdo): void {
    try { $v = (int)$pdo->query("SELECT v FROM meta WHERE k = 'schema'")->fetchColumn(); } catch (Throwable $e) { $v = 0; }
    if ($v >= 2) return;
    $t = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    $stmts = [
        "CREATE TABLE IF NOT EXISTS meta (k VARCHAR(40) PRIMARY KEY, v VARCHAR(190)) $t",
        "ALTER TABLE scans ADD COLUMN engine VARCHAR(20) NULL",
        "ALTER TABLE scans ADD COLUMN area LONGTEXT NULL",
        "CREATE TABLE IF NOT EXISTS places_cache (place_id VARCHAR(190) PRIMARY KEY, name VARCHAR(255) NOT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) $t",
        "CREATE TABLE IF NOT EXISTS notes (id INT AUTO_INCREMENT PRIMARY KEY, client_id INT NOT NULL, note_date DATE NOT NULL,
            body TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_client_date (client_id, note_date),
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE) $t",
        "CREATE TABLE IF NOT EXISTS tasks (client_id INT NOT NULL, task_key VARCHAR(40) NOT NULL,
            done_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (client_id, task_key),
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE) $t",
        "CREATE TABLE IF NOT EXISTS profile_stats (id INT AUTO_INCREMENT PRIMARY KEY, client_id INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, rating DECIMAL(2,1) NULL, reviews INT NULL,
            INDEX idx_client_date (client_id, created_at),
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE) $t",
    ];
    foreach ($stmts as $sql) { try { $pdo->exec($sql); } catch (Throwable $e) { /* coluna/tabela já existe */ } }
    $pdo->exec("REPLACE INTO meta (k, v) VALUES ('schema', '2')");
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
function flash(string $type, string $msg): void { start_session(); $_SESSION['flash'] = [$type, $msg]; }
function take_flash(): ?array { start_session(); $f = $_SESSION['flash'] ?? null; unset($_SESSION['flash']); return $f; }
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
function places_base(): string { return rtrim((string)(cfg('places_base') ?? 'https://places.googleapis.com/v1'), '/'); }

// Detalhes de um perfil pelo place_id (nome, nota, nº de avaliações)
function place_details(string $placeId, string $mask): array {
    $ch = curl_init(places_base() . '/places/' . rawurlencode($placeId) . '?languageCode=pt-BR&regionCode=BR');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['X-Goog-Api-Key: ' . cfg('google_api_key'), 'X-Goog-FieldMask: ' . $mask],
    ]);
    $raw = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
    $data = json_decode($raw ?: '', true);
    if ($code !== 200 || !is_array($data)) throw new RuntimeException($data['error']['message'] ?? ('HTTP ' . $code . ' ' . $err));
    return $data;
}

// Nomes dos concorrentes: usa o que já está guardado e só consulta o Google para os que faltam
function place_names(array $ids, int $maxLookups = 6): array {
    $ids = array_values(array_unique(array_filter($ids)));
    if (!$ids) return [];
    $in = implode(',', array_fill(0, count($ids), '?'));
    $names = q("SELECT place_id, name FROM places_cache WHERE place_id IN ($in)", $ids)->fetchAll(PDO::FETCH_KEY_PAIR);
    if (!cfg('google_api_key')) return $names;
    foreach ($ids as $id) {
        if (isset($names[$id]) || $maxLookups-- <= 0) continue;
        try {
            $name = place_details($id, 'displayName')['displayName']['text'] ?? '';
            if ($name !== '') { $names[$id] = $name; remember_place($id, $name); }
        } catch (Throwable $e) { /* segue sem o nome */ }
    }
    return $names;
}
function remember_place(string $id, string $name): void {
    q('REPLACE INTO places_cache (place_id, name) VALUES (?, ?)', [mb_substr($id, 0, 190), mb_substr($name, 0, 255)]);
}

// Nota e nº de avaliações do perfil do cliente, no máximo 1 leitura a cada 6 dias
function profile_snapshot(int $clientId, string $placeId): void {
    if (cfg('track_reviews') === false || !cfg('google_api_key')) return;
    $last = q('SELECT created_at FROM profile_stats WHERE client_id = ? ORDER BY id DESC LIMIT 1', [$clientId])->fetchColumn();
    if ($last && strtotime($last) > time() - 6 * 86400) return;
    try {
        $d = place_details($placeId, 'rating,userRatingCount');
        if (!isset($d['rating']) && !isset($d['userRatingCount'])) return;
        q('INSERT INTO profile_stats (client_id, rating, reviews) VALUES (?,?,?)', [$clientId, $d['rating'] ?? null, $d['userRatingCount'] ?? null]);
    } catch (Throwable $e) { /* não trava a varredura por causa disso */ }
}

// Executa várias buscas em paralelo. Retorna [indice => resposta decodificada | ['_error'=>msg]]
function places_multi(array $bodies, string $mask, int $conc = 8): array {
    $results = []; $queue = array_keys($bodies); $active = [];
    $mh = curl_multi_init();
    $make = function ($i) use ($bodies, $mask) {
        $ch = curl_init(places_base() . '/places:searchText');
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

// Transforma o resultado do motor em posições por ponto, KPIs, concorrentes do centro e ranking da área
function summarize_scan(array $pts, array $res, string $placeId): array {
    $found = 0; $top3 = 0; $sum = 0; $valid = 0; $agg = []; $names = [];
    foreach ($pts as $i => &$p) {
        if (!isset($res[$i]['list'])) { $p['rank'] = null; $p['err'] = 1; continue; }
        $valid++; $rank = null;
        foreach (array_slice($res[$i]['list'], 0, 20) as $n => $it) {
            $id = (string)($it['id'] ?? ''); if ($id === '') continue;
            if ($id === $placeId && $rank === null) $rank = $n + 1;
            if (!isset($agg[$id])) $agg[$id] = ['sum' => 0, 'n' => 0, 'top3' => 0];
            $agg[$id]['sum'] += $n + 1; $agg[$id]['n']++; if ($n < 3) $agg[$id]['top3']++;
            if (!empty($it['name'])) $names[$id] = $it['name'];
        }
        $p['rank'] = $rank;
        if ($rank) { $found++; if ($rank <= 3) $top3++; }
        $sum += $rank ?? 21; // fora do top 20 conta como 21
    }
    unset($p);

    $mid = intdiv(count($pts), 2); $comp = [];
    foreach (array_slice($res[$mid]['list'] ?? [], 0, 5) as $n => $it) {
        $comp[] = ['pos' => $n + 1, 'name' => $it['name'] ?? '?', 'me' => ($it['id'] ?? '') === $placeId];
    }

    // Ranking da área inteira: mesma régua do cliente (ausente no ponto = 21)
    $area = []; $v = max(1, $valid);
    if (!isset($agg[$placeId])) $agg[$placeId] = ['sum' => 0, 'n' => 0, 'top3' => 0];
    foreach ($agg as $id => $a) {
        $area[] = ['id' => (string)$id, 'name' => $names[$id] ?? null, 'me' => (string)$id === $placeId,
            'avg' => round(($a['sum'] + 21 * ($valid - $a['n'])) / $v, 2),
            'top3' => round($a['top3'] * 100 / $v, 1), 'found' => round($a['n'] * 100 / $v, 1)];
    }
    usort($area, fn($x, $y) => [$x['avg'], -$x['top3']] <=> [$y['avg'], -$y['top3']]);
    foreach ($area as $n => &$a) $a['pos'] = $n + 1;
    unset($a);
    $top = array_slice($area, 0, 6);
    if (!array_filter($top, fn($a) => $a['me'])) {
        foreach ($area as $a) if ($a['me']) { $top[] = $a; break; }
    }

    return [
        'points' => $pts, 'competitors' => $comp, 'area' => $valid ? $top : [], 'area_total' => count($area),
        'avg_rank' => round($sum / $v, 2),
        'top3_pct' => round($top3 * 100 / $v, 1),
        'found_pct' => round($found * 100 / $v, 1),
    ];
}

function run_scan(int $kid): array {
    @set_time_limit(300); // grade grande pode passar de 1 min
    $k = q('SELECT k.*, c.place_id, c.lat, c.lng, c.name AS client_name FROM keywords k JOIN clients c ON c.id = k.client_id WHERE k.id = ?', [$kid])->fetch();
    if (!$k) throw new RuntimeException('Palavra-chave não encontrada.');

    $pts = grid_points((float)$k['lat'], (float)$k['lng'], (int)$k['grid_size'], (float)$k['radius_km']);
    $engine = scan_engine();
    $res = $engine === 'dataforseo' ? scan_dataforseo($pts, $k['keyword']) : scan_places($pts, $k['keyword']);
    $errors = array_filter($res, fn($r) => isset($r['_error']));
    if (count($errors) > count($pts) / 4) {
        throw new RuntimeException(($engine === 'dataforseo' ? 'DataForSEO: ' : 'Google Places: ') . reset($errors)['_error']);
    }

    $s = summarize_scan($pts, $res, (string)$k['place_id']);

    // nomes do ranking da área (o que vier com nome fica guardado; o resto é consultado uma única vez)
    $missing = [];
    foreach ($s['area'] as $a) {
        if ($a['me']) continue;
        if ($a['name']) remember_place($a['id'], $a['name']); else $missing[] = $a['id'];
    }
    $names = $missing ? place_names($missing) : [];
    foreach ($s['area'] as &$a) {
        if ($a['me']) $a['name'] = $k['client_name'];
        elseif (!$a['name']) $a['name'] = $names[$a['id']] ?? null;
    }
    unset($a);

    q('INSERT INTO scans (keyword_id, avg_rank, top3_pct, found_pct, points, competitors, engine, area) VALUES (?,?,?,?,?,?,?,?)',
        [$kid, $s['avg_rank'], $s['top3_pct'], $s['found_pct'], json_encode($s['points']),
         json_encode($s['competitors'], JSON_UNESCAPED_UNICODE), $engine, json_encode($s['area'], JSON_UNESCAPED_UNICODE)]);
    profile_snapshot((int)$k['client_id'], (string)$k['place_id']);
    return ['avg_rank' => $s['avg_rank'], 'top3_pct' => $s['top3_pct'], 'found_pct' => $s['found_pct']];
}

require __DIR__ . '/insights.php';
require __DIR__ . '/view.php';
