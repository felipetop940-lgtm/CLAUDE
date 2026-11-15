<?php
require __DIR__ . '/app/lib.php';
$t = (string)($_GET['t'] ?? '');
$c = strlen($t) === 32 ? q('SELECT * FROM clients WHERE share_token = ?', [$t])->fetch() : false;
if (!$c) { http_response_code(404); exit('Link inválido.'); }

$kws = array_values(array_filter(client_keywords((int)$c['id']), fn($k) => $k['active']));
$profile = client_profile((int)$c['id']);
$sel = null;
foreach ($kws as $k) if ((int)$k['id'] === (int)($_GET['k'] ?? 0)) $sel = $k;
if (!$sel && $kws) $sel = $kws[0];

page_header($c['name'], false); ?>
<div class="page-head"><div><p class="eyebrow">Relatório de posição no Google Maps</p><h1><?= h($c['name']) ?></h1>
<p class="muted"><?= h($c['address']) ?> · preparado pela Consultório de Sucesso</p></div></div>
<?php
if (!$kws) { echo '<p class="empty">Nenhuma palavra-chave cadastrada ainda.</p>'; }
else {
    render_client_kpis($kws, $profile);
    echo '<section class="card"><div class="card-head"><div><p class="eyebrow">Acompanhamento</p><h2>Palavras-chave</h2><p class="muted">Clique em uma para ver o mapa e a evolução.</p></div></div>';
    render_keyword_table($kws, (int)$sel['id'], true, fn(int $kid) => 'share.php?t=' . $t . '&k=' . $kid . '#kw');
    echo '</section>';
    render_keyword_detail($c, $sel, true, null);
    echo '<p class="hint center">Posição média: menor é melhor. Fora do top 20 conta como 21. O resultado do Google varia por aparelho e histórico de busca; o que vale é a evolução medida sempre com a mesma régua.</p>';
}
page_footer();
