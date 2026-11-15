<?php
require __DIR__ . '/app/lib.php';
$t = (string)($_GET['t'] ?? '');
$c = strlen($t) === 32 ? q('SELECT * FROM clients WHERE share_token = ?', [$t])->fetch() : false;
if (!$c) { http_response_code(404); exit('Link inválido.'); }
page_header($c['name'], false); ?>
<h1><?= h($c['name']) ?></h1>
<p class="muted">Posição no Google Maps por região · relatório preparado pela Consultório de Sucesso</p>
<?php render_client($c, true); page_footer();
