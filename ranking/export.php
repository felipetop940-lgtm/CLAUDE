<?php
// Exporta todo o histórico de uma palavra-chave em CSV (abre no Excel)
require __DIR__ . '/app/lib.php';
require_login();
$k = q('SELECT k.*, c.name FROM keywords k JOIN clients c ON c.id = k.client_id WHERE k.id = ?', [(int)($_GET['k'] ?? 0)])->fetch();
if (!$k) { http_response_code(404); exit('Palavra-chave não encontrada.'); }
$slug = fn(string $s) => trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s)), '-');
header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="ranking-' . $slug($k['name']) . '-' . $slug($k['keyword']) . '.csv"');
$out = fopen('php://output', 'w');
fwrite($out, "\xEF\xBB\xBF");
fputcsv($out, ['Cliente', 'Palavra-chave', 'Data', 'Posição média', '% top 3', '% top 20', 'Motor'], ';');
foreach (q('SELECT * FROM scans WHERE keyword_id = ? ORDER BY id', [$k['id']]) as $s) {
    fputcsv($out, [$k['name'], $k['keyword'], date('d/m/Y H:i', strtotime($s['created_at'])),
        number_format((float)$s['avg_rank'], 2, ',', ''), number_format((float)$s['top3_pct'], 1, ',', ''), number_format((float)$s['found_pct'], 1, ',', ''), $s['engine'] ?? ''], ';');
}
