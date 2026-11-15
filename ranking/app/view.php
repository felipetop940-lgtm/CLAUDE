<?php
declare(strict_types=1);

/* ---------- Layout ---------- */
function page_header(string $title, bool $nav = true): void { ?>
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title><?= h($title) ?> · Ranking Local</title>
<link rel="icon" href="assets/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<link rel="stylesheet" href="assets/style.css?v=7">
<script src="assets/map.js?v=7"></script>
<?php if ($mk = trim((string)cfg('maps_js_key'))): ?>
<script>RL.useGoogle();</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=<?= h(rawurlencode($mk)) ?>&amp;v=weekly&amp;loading=async&amp;language=pt-BR&amp;region=BR&amp;callback=rlGmapsReady" onerror="RL.googleFailed()"></script>
<?php endif; ?>
</head><body>
<header class="top"><div class="top-in">
  <a href="<?= $nav ? 'index.php' : '#' ?>" class="brand"><img src="assets/logo.png" alt="Consultório de Sucesso" width="40" height="40">
    <span><b>Ranking Local</b><small>Consultório de Sucesso</small></span></a>
  <?php if ($nav): ?><nav><a href="index.php">Clientes</a><a href="logout.php">Sair</a></nav><?php endif; ?>
</div></header>
<main>
<?php }
function page_footer(): void {
    echo '</main><footer class="foot">Ranking Local · plataforma própria da Consultório de Sucesso</footer></body></html>';
}

/* ---------- Formatação ---------- */
function fmt($v, int $d = 1): string { return number_format((float)$v, $d, ',', '.'); }
function fdate(?string $dt, string $f = 'd/m/Y'): string { return $dt ? date($f, strtotime($dt)) : '–'; }
function rank_class(?int $r): string {
    if ($r === null) return 'r-none';
    if ($r <= 3) return 'r-top';
    if ($r <= 10) return 'r-mid';
    return 'r-low';
}
function avg_tag($avg): string {
    if ($avg === null) return '<span class="muted">sem varredura</span>';
    $a = (float)$avg;
    return '<span class="tag ' . rank_class($a >= 20.5 ? null : (int)round($a)) . '">' . fmt($a) . '</span>';
}
// Variação entre duas leituras. $lowerIsBetter: posição (menor é melhor) x percentuais (maior é melhor)
function delta_badge($cur, $old, bool $lowerIsBetter, string $suffix = ''): string {
    if ($cur === null || $old === null) return '';
    $d = (float)$cur - (float)$old;
    if (abs($d) < 0.05) return '<small class="delta eq">=</small>';
    $good = $lowerIsBetter ? $d < 0 : $d > 0;
    $txt = rtrim(rtrim(number_format(abs($d), 1, ',', '.'), '0'), ',');
    return '<small class="delta ' . ($good ? 'up' : 'down') . '">' . ($good ? '▲' : '▼') . ' ' . $txt . $suffix . '</small>';
}
// Visibilidade: 100% = 1º em todos os pontos; 0% = fora do top 20 em todos. Sai direto da posição média.
function visibility($avg): ?int { return $avg === null ? null : (int)round(max(0, min(100, (21 - (float)$avg) / 20 * 100))); }
function vis_class(?int $v): string { return $v === null ? '' : ($v >= 70 ? 'v-hi' : ($v >= 40 ? 'v-mid' : 'v-lo')); }
function pos_badge(?int $pos): string {
    if (!$pos) return '<span class="pos p-none">–</span>';
    return '<span class="pos ' . ($pos <= 3 ? 'p-top' : ($pos <= 10 ? 'p-mid' : 'p-low')) . '">Pos. ' . $pos . '</span>';
}
function stars($rating, $reviews): string {
    if ($rating === null) return $reviews !== null ? '<span class="rev">' . (int)$reviews . ' avaliações</span>' : '';
    $r = (float)$rating;
    return '<span class="stars" style="--r:' . round($r / 5 * 100) . '%" aria-hidden="true">★★★★★</span><span class="rev">' . number_format($r, 1, ',', '')
         . ($reviews !== null ? ' · ' . number_format((int)$reviews, 0, ',', '.') . ' avaliações' : '') . '</span>';
}
function place_photo(?array $info, string $name): string {
    $src = $info['photo'] ?? '';
    if ($src) return '<img class="ph" src="' . h($src) . '" alt="" loading="lazy" width="64" height="64">';
    return '<span class="ph ph-none">' . h(mb_strtoupper(mb_substr(trim(preg_replace('/^(dra?\.?|cl[ií]nica)\s+/iu', '', $name)) ?: $name, 0, 1))) . '</span>';
}
function maps_link(string $placeId, ?array $info): string {
    return !empty($info['maps_url']) ? $info['maps_url'] : 'https://www.google.com/maps/place/?q=place_id:' . rawurlencode($placeId);
}
// Dificuldade da área: estimativa nossa, pela média de avaliações dos 5 primeiros concorrentes
function area_difficulty(array $area, array $infos): ?array {
    $rv = [];
    foreach ($area as $a) { if (!empty($a['me'])) continue; $r = $infos[$a['id']]['reviews'] ?? null; if ($r !== null) $rv[] = (int)$r; if (count($rv) >= 5) break; }
    if (count($rv) < 3) return null;
    $m = array_sum($rv) / count($rv);
    return $m < 40 ? ['BAIXA', 'v-hi', 25, $m] : ($m < 150 ? ['MÉDIA', 'v-mid', 60, $m] : ['ALTA', 'v-lo', 92, $m]);
}

// Mini gráfico em SVG. Valores de posição: menor é melhor, então o eixo é invertido.
function sparkline(array $vals, int $w = 120, int $h = 34): string {
    $vals = array_values(array_map('floatval', $vals));
    if (count($vals) < 2) return '<span class="spark-empty">–</span>';
    $min = min($vals); $max = max($vals); $span = max(0.5, $max - $min); $n = count($vals); $pad = 3;
    $pts = [];
    foreach ($vals as $i => $v) {
        $x = $pad + $i * ($w - 2 * $pad) / ($n - 1);
        $y = $pad + ($v - $min) / $span * ($h - 2 * $pad); // posição menor fica em cima
        $pts[] = round($x, 1) . ',' . round($y, 1);
    }
    $d = end($vals) - $vals[0];
    $color = abs($d) < 0.05 ? '#94a3b8' : ($d < 0 ? '#12804a' : '#c62828');
    [$lx, $ly] = explode(',', end($pts));
    return '<svg class="spark" width="' . $w . '" height="' . $h . '" viewBox="0 0 ' . $w . ' ' . $h . '" role="img" aria-label="evolução">'
         . '<polyline fill="none" stroke="' . $color . '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' . implode(' ', $pts) . '"/>'
         . '<circle cx="' . $lx . '" cy="' . $ly . '" r="3" fill="' . $color . '"/></svg>';
}

/* ---------- Dados ---------- */
// Palavras-chave do cliente com a última e a penúltima varredura e a série para o mini gráfico
function client_keywords(int $clientId): array {
    $kws = q('SELECT * FROM keywords WHERE client_id = ? ORDER BY active DESC, id', [$clientId])->fetchAll();
    foreach ($kws as &$k) {
        $rows = q('SELECT avg_rank, top3_pct, found_pct, created_at FROM scans WHERE keyword_id = ? ORDER BY id DESC LIMIT 26', [$k['id']])->fetchAll();
        $k['last'] = $rows[0] ?? null; $k['prev'] = $rows[1] ?? null; $k['n_scans'] = count($rows);
        $k['first'] = $rows ? end($rows) : null;
        $k['series'] = array_reverse(array_column($rows, 'avg_rank'));
        $k['pos'] = null;
        if ($rows) {
            $area = json_decode((string)q('SELECT area FROM scans WHERE keyword_id = ? ORDER BY id DESC LIMIT 1', [$k['id']])->fetchColumn(), true) ?: [];
            foreach ($area as $a) if (!empty($a['me'])) $k['pos'] = (int)($a['pos'] ?? 0) ?: null;
        }
    }
    unset($k);
    return $kws;
}
// Resumo do cliente a partir das palavras ativas que já têm varredura
function client_summary(array $kws): array {
    $cur = []; $prev = []; $top3 = []; $top3prev = []; $lastAt = null;
    foreach ($kws as $k) {
        if (!$k['last'] || !$k['active']) continue;
        $cur[] = (float)$k['last']['avg_rank']; $top3[] = (float)$k['last']['top3_pct'];
        if ($lastAt === null || $k['last']['created_at'] > $lastAt) $lastAt = $k['last']['created_at'];
        if ($k['prev']) { $prev[] = [(float)$k['last']['avg_rank'], (float)$k['prev']['avg_rank']]; $top3prev[] = [(float)$k['last']['top3_pct'], (float)$k['prev']['top3_pct']]; }
    }
    $mean = fn(array $a) => $a ? array_sum($a) / count($a) : null;
    return [
        'avg' => $mean($cur), 'top3' => $mean($top3), 'last_at' => $lastAt,
        // variação só entre palavras que têm as duas leituras, para não comparar conjuntos diferentes
        'avg_prev' => $prev ? $mean(array_column($prev, 1)) : null, 'avg_cmp' => $prev ? $mean(array_column($prev, 0)) : null,
        'top3_prev' => $top3prev ? $mean(array_column($top3prev, 1)) : null, 'top3_cmp' => $top3prev ? $mean(array_column($top3prev, 0)) : null,
    ];
}
function client_profile(int $clientId): array {
    $rows = q('SELECT rating, reviews, created_at FROM profile_stats WHERE client_id = ? ORDER BY id DESC LIMIT 60', [$clientId])->fetchAll();
    return ['last' => $rows[0] ?? null, 'first' => $rows ? end($rows) : null, 'n' => count($rows)];
}

/* ---------- Página do cliente ---------- */
function render_client_kpis(array $kws, array $profile): void {
    $s = client_summary($kws); $p = $profile['last'];
    $active = count(array_filter($kws, fn($k) => $k['active']));
    echo '<div class="kpis">';
    $vis = visibility($s['avg']);
    echo '<div class="kpi"><span>Visibilidade</span><b>' . ($vis !== null ? $vis . '%' : '–') . '</b>' . ($vis !== null ? '<div class="vbar ' . vis_class($vis) . '"><i style="width:' . $vis . '%"></i></div>' : '') . '<em>presença no mapa, 100% = 1º em tudo</em></div>';
    echo '<div class="kpi"><span>Posição média</span><b>' . ($s['avg'] !== null ? fmt($s['avg']) : '–') . '</b>' . delta_badge($s['avg_cmp'], $s['avg_prev'], true) . '<em>todas as palavras ativas</em></div>';
    echo '<div class="kpi"><span>Área no top 3</span><b>' . ($s['top3'] !== null ? round($s['top3']) . '%' : '–') . '</b>' . delta_badge($s['top3_cmp'], $s['top3_prev'], false, ' p.p.') . '<em>presença entre os 3 primeiros</em></div>';
    echo '<div class="kpi"><span>Nota no Google</span><b>' . ($p && $p['rating'] !== null ? fmt($p['rating']) : '–') . '</b><em>' . ($p ? 'lida em ' . fdate($p['created_at']) : 'lida na próxima varredura') . '</em></div>';
    $growth = '';
    if ($p && $profile['n'] > 1 && $p['reviews'] !== null && $profile['first']['reviews'] !== null) {
        $g = (int)$p['reviews'] - (int)$profile['first']['reviews'];
        $growth = ($g >= 0 ? '+' : '') . $g . ' desde ' . fdate($profile['first']['created_at']);
    }
    echo '<div class="kpi"><span>Avaliações</span><b>' . ($p && $p['reviews'] !== null ? number_format((int)$p['reviews'], 0, ',', '.') : '–') . '</b><em>' . ($growth ?: 'crescimento aparece após 2 leituras') . '</em></div>';
    echo '<div class="kpi"><span>Palavras-chave</span><b>' . $active . '</b><em>' . ($s['last_at'] ? 'última varredura ' . fdate($s['last_at'], 'd/m H:i') : 'sem varredura ainda') . '</em></div>';
    echo '</div>';
}

// Tabela de palavras-chave. $url(k_id) monta o link de cada linha.
function render_keyword_table(array $kws, int $selId, bool $readonly, callable $url): void {
    echo '<div class="table-wrap"><table class="kw"><thead><tr><th>Palavra-chave</th><th>Grade</th><th>Ranking</th><th class="num">Posição média</th><th class="num">Top 3</th><th class="num">Top 20</th><th>Evolução</th><th>Última</th>' . ($readonly ? '' : '<th></th>') . '</tr></thead><tbody>';
    foreach ($kws as $k) {
        $l = $k['last']; $p = $k['prev'];
        echo '<tr class="' . ((int)$k['id'] === $selId ? 'sel' : '') . ($k['active'] ? '' : ' off') . '">';
        echo '<td><a class="kw-name" href="' . h($url((int)$k['id'])) . '">' . h($k['keyword']) . '</a>' . ($k['active'] ? '' : ' <span class="chip">pausada</span>') . '</td>';
        echo '<td class="muted">' . (int)$k['grid_size'] . '×' . (int)$k['grid_size'] . ' · ' . h(rtrim(rtrim((string)$k['radius_km'], '0'), '.')) . ' km</td>';
        if ($l) {
            echo '<td>' . pos_badge($k['pos']) . '</td><td class="num">' . avg_tag($l['avg_rank']) . ' ' . delta_badge($l['avg_rank'], $p['avg_rank'] ?? null, true) . '</td>';
            echo '<td class="num">' . round((float)$l['top3_pct']) . '%</td><td class="num">' . round((float)$l['found_pct']) . '%</td>';
            echo '<td>' . sparkline($k['series']) . '</td><td class="muted">' . fdate($l['created_at'], 'd/m/y') . '</td>';
        } else {
            echo '<td class="num muted" colspan="6">ainda sem varredura</td>';
        }
        if (!$readonly) {
            $f = fn(string $action, string $label, string $cls = 'link', string $confirm = '') =>
                '<form method="post"' . ($confirm ? ' onsubmit="return confirm(\'' . $confirm . '\')"' : '') . '>' . csrf_field()
                . '<input type="hidden" name="action" value="' . $action . '"><input type="hidden" name="kid" value="' . (int)$k['id'] . '">'
                . '<button class="' . $cls . '"' . ($action === 'scan' ? ' data-busy="Varrendo…"' : '') . '>' . $label . '</button></form>';
            echo '<td class="row-actions">' . $f('scan', 'Varrer') . $f('toggle_kw', $k['active'] ? 'Pausar' : 'Ativar')
               . $f('del_kw', 'Apagar', 'link danger', 'Apagar esta palavra-chave e todo o histórico dela?') . '</td>';
        }
        echo '</tr>';
    }
    echo '</tbody></table></div>';
}

// Detalhe de uma palavra-chave: coluna de concorrentes + mapa com linha do tempo, evolução, orientações e histórico
function render_keyword_detail(array $c, array $k, bool $readonly, ?array $profile, array $kws = [], ?callable $url = null): void {
    $scans = q('SELECT * FROM scans WHERE keyword_id = ? ORDER BY id DESC LIMIT 60', [$k['id']])->fetchAll();
    $total = (int)q('SELECT COUNT(*) FROM scans WHERE keyword_id = ?', [$k['id']])->fetchColumn();
    $last = $scans[0] ?? null; $prev = $scans[1] ?? null; $first = $scans ? end($scans) : null;
    $id = (int)$k['id'];
    $size = (int)$k['grid_size']; $step = $size > 1 ? (float)$k['radius_km'] / intdiv($size, 2) : 0;

    echo '<section class="card" id="kw"><div class="card-head"><div><p class="eyebrow">Mapa de posições</p><h2>' . h($k['keyword']) . '</h2>';
    echo '<p class="muted">Grade ' . $size . '×' . $size . ' · ' . ($size * $size) . ' pontos a cada ' . fmt($step) . ' km · raio ' . h(rtrim(rtrim((string)$k['radius_km'], '0'), '.')) . ' km</p></div>';
    if (!$readonly && $last) echo '<div class="actions"><a class="btn ghost" href="export.php?k=' . $id . '">Exportar CSV</a><form method="post">' . csrf_field() . '<input type="hidden" name="action" value="scan"><input type="hidden" name="kid" value="' . $id . '"><button class="btn" data-busy="Varrendo…">Varrer agora</button></form></div>';
    echo '</div>';
    if (!$last) { echo '<p class="empty">Ainda sem varredura. ' . ($readonly ? '' : 'Clique em “Varrer” na tabela acima.') . '</p></section>'; return; }

    $area = json_decode($last['area'] ?? '[]', true) ?: [];
    $infos = places_info(array_merge(array_column($area, 'id'), [$c['place_id']]));
    $me = null; foreach ($area as $a) if (!empty($a['me'])) $me = $a;
    $vis = visibility($last['avg_rank']); $mapId = 'map' . $id; $tlId = 'tl' . $id; $n = count($scans);
    $diff = area_difficulty($area, $infos);

    echo '<div class="posmap"><aside class="pm-side">';
    // palavras-chave como atalhos
    if ($url && count($kws) > 1) {
        echo '<p class="pm-label">Palavras-chave (' . count($kws) . ')</p><div class="chips">';
        foreach ($kws as $kk) echo '<a class="kchip' . ((int)$kk['id'] === $id ? ' on' : '') . '" href="' . h($url((int)$kk['id'])) . '">' . h($kk['keyword']) . '</a>';
        echo '</div>';
    }
    // cartão do cliente
    $mi = $infos[$c['place_id']] ?? null;
    echo '<div class="pcard me"><div class="pc-top">' . pos_badge($me['pos'] ?? null) . '</div><div class="pc-body">' . place_photo($mi, $c['name']) . '<div class="pc-txt"><b>' . h($c['name']) . '</b>';
    echo '<div class="meter"><span>Visibilidade</span><div class="vbar ' . vis_class($vis) . '"><i style="width:' . $vis . '%"></i></div><em class="' . vis_class($vis) . '">' . $vis . '%</em></div>';
    if ($diff) echo '<div class="meter" title="Estimativa nossa: média de ' . round($diff[3]) . ' avaliações entre os primeiros concorrentes"><span>Dificuldade da área</span><div class="vbar ' . $diff[1] . '"><i style="width:' . $diff[2] . '%"></i></div><em class="' . $diff[1] . '">' . $diff[0] . '</em></div>';
    echo '<a class="glink" target="_blank" rel="noopener" href="' . h(maps_link($c['place_id'], $mi)) . '">Abrir no Google ↗</a></div></div></div>';

    // concorrentes, na ordem do ranking da área, com o cliente marcado na posição dele
    $hasRanks = !empty($last['ranks']);
    if ($area) {
        echo '<p class="pm-label">Ranking da área (' . count($area) . ')' . ($hasRanks ? '<small>clique para ver o mapa de cada um</small>' : '') . '</p><div class="plist">';
        foreach ($area as $a) {
            $isMe = !empty($a['me']); $in = $infos[$a['id']] ?? null; $nm = $a['name'] ?? ($in['name'] ?? 'Perfil sem nome'); $v = visibility($a['avg']);
            echo '<div class="pcard' . ($isMe ? ' me' : '') . '" data-pid="' . h($a['id']) . '"><div class="pc-top">' . pos_badge((int)($a['pos'] ?? 0))
               . '<span class="pc-vis ' . vis_class($v) . '" title="Visibilidade na grade">' . $v . '%</span></div>';
            echo '<div class="pc-body">' . place_photo($in, $nm) . '<div class="pc-txt"><b>' . h($nm) . '</b>';
            if (!$isMe && !empty($in['address'])) echo '<span class="addr">' . h($in['address']) . '</span>';
            if (!empty($in['category'])) echo '<span class="cat">' . h($in['category']) . '</span>';
            $st = stars($in['rating'] ?? null, $in['reviews'] ?? null); if ($st) echo '<div class="rating">' . $st . '</div>';
            echo '<div class="pc-links">';
            if ($hasRanks && !$isMe) echo '<button type="button" class="link" data-focus="' . h($a['id']) . '" data-name="' . h($nm) . '">Ver no mapa</button>';
            echo '<a class="glink" target="_blank" rel="noopener" href="' . h(maps_link($a['id'], $in)) . '">Abrir no Google ↗</a></div></div></div></div>';
        }
        echo '</div><p class="hint">Ranking pela posição média na grade inteira, com a mesma régua para todos (ausente no ponto = 21).</p>';
    } else {
        echo '<p class="hint">O ranking de concorrentes aparece a partir da próxima varredura.</p>';
    }
    echo '</aside><div class="pm-main">';
    echo '<div class="focusbar" id="fb' . $id . '" hidden><span></span><button type="button" class="btn ghost">← Voltar para ' . h($c['name']) . '</button></div>';
    echo '<div id="' . $mapId . '" class="map"></div>';
    echo '<div class="timeline" id="' . $tlId . '"><button type="button" data-d="-1" aria-label="Varredura anterior">‹</button>'
       . '<input type="range" min="0" max="' . max(0, $n - 1) . '" value="' . max(0, $n - 1) . '"' . ($n < 2 ? ' disabled' : '') . ' aria-label="Linha do tempo das varreduras">'
       . '<button type="button" data-d="1" aria-label="Próxima varredura">›</button><span class="tl-label"></span></div>';
    echo '<p class="legend"><i class="r-top"></i>1–3 <i class="r-mid"></i>4–10 <i class="r-low"></i>11–20 <i class="r-none"></i>fora do top 20 <i class="r-err"></i>sem leitura <span>★ endereço do cliente</span></p>';

    echo '<div class="kpis">';
    $since = ($first && $first !== $last) ? fn($cur, $old, $low, $suf = '') => '<em>desde ' . fdate($first['created_at'], 'd/m/y') . ': ' . (delta_badge($cur, $old, $low, $suf) ?: '=') . '</em>' : fn() => '<em>primeira varredura</em>';
    echo '<div class="kpi"><span>Posição média</span><b>' . fmt($last['avg_rank']) . '</b>' . delta_badge($last['avg_rank'], $prev['avg_rank'] ?? null, true) . $since($last['avg_rank'], $first['avg_rank'], true) . '</div>';
    echo '<div class="kpi"><span>Área no top 3</span><b>' . round((float)$last['top3_pct']) . '%</b>' . delta_badge($last['top3_pct'], $prev['top3_pct'] ?? null, false, ' p.p.') . $since($last['top3_pct'], $first['top3_pct'], false, ' p.p.') . '</div>';
    echo '<div class="kpi"><span>Área no top 20</span><b>' . round((float)$last['found_pct']) . '%</b>' . delta_badge($last['found_pct'], $prev['found_pct'] ?? null, false, ' p.p.') . $since($last['found_pct'], $first['found_pct'], false, ' p.p.') . '</div>';
    $stt = grid_stats(json_decode($last['points'] ?? '[]', true) ?: []);
    echo '<div class="kpi"><span>No endereço</span><b>' . ($stt['center_err'] ? '–' : ($stt['center'] === null ? '20+' : $stt['center'] . 'º')) . '</b><em>posição no ponto central</em></div>';
    echo '</div></div></div>';

    // evolução
    $asc = array_reverse($scans);
    if ($n > 1) {
        echo '<div class="grid2 charts"><div><h3>Posição média ao longo do tempo</h3><canvas id="ca' . $id . '" height="150"></canvas></div>';
        echo '<div><h3>Visibilidade ao longo do tempo</h3><canvas id="cb' . $id . '" height="150"></canvas></div></div>';
    }

    // orientações (só para a equipe)
    if (!$readonly) {
        $tips = keyword_insights($k, $scans, $profile);
        if ($tips) {
            $lbl = ['alta' => 'Prioridade alta', 'media' => 'Prioridade média', 'baixa' => 'Atenção', 'ok' => 'Positivo'];
            echo '<h3 class="sec">O que fazer agora</h3><div class="tips">';
            foreach ($tips as $t) {
                echo '<article class="tip p-' . $t['pri'] . '"><span class="badge">' . $lbl[$t['pri']] . '</span><h4>' . h($t['title']) . '</h4><p>' . h($t['why']) . '</p><ul>';
                foreach ($t['do'] as $d) echo '<li>' . h($d) . '</li>';
                echo '</ul></article>';
            }
            echo '</div>';
        }
    }

    // histórico
    echo '<details><summary>Histórico de varreduras (' . $total . ')</summary><div class="table-wrap"><table><thead><tr><th>Data</th><th class="num">Posição média</th><th class="num">Visibilidade</th><th class="num">Top 3</th><th class="num">Top 20</th></tr></thead><tbody>';
    foreach ($scans as $i => $s) {
        $older = $scans[$i + 1] ?? null;
        echo '<tr><td>' . fdate($s['created_at'], 'd/m/Y H:i') . '</td><td class="num">' . fmt($s['avg_rank']) . ' ' . delta_badge($s['avg_rank'], $older['avg_rank'] ?? null, true) . '</td><td class="num">' . visibility($s['avg_rank']) . '%</td><td class="num">' . round((float)$s['top3_pct']) . '%</td><td class="num">' . round((float)$s['found_pct']) . '%</td></tr>';
    }
    echo '</tbody></table></div>' . ($total > $n && !$readonly ? '<p class="hint">Mostrando as ' . $n . ' mais recentes. O CSV traz todas.</p>' : '') . '</details></section>';

    // dados para o mapa (da mais antiga para a mais nova) e para os gráficos
    $flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE;
    $items = array_map(fn($s) => [
        'd' => fdate($s['created_at'], 'd/m/Y'),
        'pts' => json_decode($s['points'] ?? '[]', true) ?: [],
        'avg' => fmt($s['avg_rank']), 'top3' => (string)round((float)$s['top3_pct']), 'found' => (string)round((float)$s['found_pct']),
    ], $asc);
    echo '<script>RL.add(' . json_encode([
        'map' => $mapId, 'ctrl' => $tlId, 'focusbar' => 'fb' . $id, 'scans' => $items, 'home' => [(float)$c['lat'], (float)$c['lng']],
        'step' => $step, 'ranks' => json_decode($last['ranks'] ?? 'null', true), 'me' => $c['place_id'],
    ], $flags) . ');';
    if ($n > 1) {
        $labels = json_encode(array_map(fn($s) => fdate($s['created_at'], 'd/m'), $asc));
        echo 'RL.chart("ca' . $id . '",' . $labels . ',' . json_encode(array_map(fn($s) => (float)$s['avg_rank'], $asc)) . ',{reverse:true,label:"posição média"});';
        echo 'RL.chart("cb' . $id . '",' . $labels . ',' . json_encode(array_map(fn($s) => visibility($s['avg_rank']), $asc)) . ',{suffix:"%",max:100,label:"visibilidade"});';
    }
    echo '</script>';
}

// Checklist do perfil, salvo por cliente
function render_checklist(int $clientId): void {
    $done = q('SELECT task_key, done_at FROM tasks WHERE client_id = ?', [$clientId])->fetchAll(PDO::FETCH_KEY_PAIR);
    $groups = checklist_items(); $total = array_sum(array_map('count', $groups)); $n = 0;
    foreach ($groups as $items) foreach ($items as $key => $_) if (isset($done[$key])) $n++;
    $pct = $total ? round($n * 100 / $total) : 0;
    echo '<section class="card" id="checklist"><div class="card-head"><div><p class="eyebrow">Perfil no Google</p><h2>Checklist de otimização</h2><p class="muted">O básico que precisa estar feito em todo cliente. Marque conforme for entregando.</p></div>';
    echo '<div class="progress"><b>' . $n . ' de ' . $total . '</b><div class="bar"><i style="width:' . $pct . '%"></i></div></div></div><div class="check-grid">';
    foreach ($groups as $title => $items) {
        echo '<div><h3>' . h($title) . '</h3>';
        foreach ($items as $key => $label) {
            $ok = isset($done[$key]);
            echo '<form method="post" class="check' . ($ok ? ' done' : '') . '">' . csrf_field() . '<input type="hidden" name="action" value="toggle_task"><input type="hidden" name="task" value="' . h($key) . '">'
               . '<button title="' . ($ok ? 'Desmarcar' : 'Marcar como feito') . '"><i>' . ($ok ? '✓' : '') . '</i><span>' . h($label) . ($ok ? '<small>feito em ' . fdate($done[$key]) . '</small>' : '') . '</span></button></form>';
        }
        echo '</div>';
    }
    echo '</div></section>';
}

// Anotações: o que foi feito no perfil e quando (para cruzar com a evolução)
function render_notes(int $clientId): void {
    $notes = q('SELECT * FROM notes WHERE client_id = ? ORDER BY note_date DESC, id DESC LIMIT 100', [$clientId])->fetchAll();
    echo '<section class="card" id="notas"><p class="eyebrow">Diário do cliente</p><h2>Anotações</h2><p class="muted">Registre o que foi feito no perfil e quando. É isso que explica as subidas e quedas na reunião de resultado.</p>';
    echo '<form method="post" class="inline note-form">' . csrf_field() . '<input type="hidden" name="action" value="add_note"><input type="date" name="note_date" value="' . date('Y-m-d') . '" required>'
       . '<input name="body" placeholder="ex: troquei a categoria principal para Pediatra e subi 12 fotos" maxlength="500" required><button class="btn">Salvar</button></form>';
    if ($notes) {
        echo '<ul class="notes">';
        foreach ($notes as $nt) {
            echo '<li><time>' . fdate($nt['note_date']) . '</time><span>' . h($nt['body']) . '</span><form method="post" onsubmit="return confirm(\'Apagar esta anotação?\')">' . csrf_field()
               . '<input type="hidden" name="action" value="del_note"><input type="hidden" name="nid" value="' . (int)$nt['id'] . '"><button class="link danger" aria-label="Apagar anotação">×</button></form></li>';
        }
        echo '</ul>';
    }
    echo '</section>';
}
