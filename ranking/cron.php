<?php
// Varredura semanal + e-mail. Rodar pelo Cron Job do hPanel: php /caminho/ranking/cron.php
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
require __DIR__ . '/app/lib.php';
set_time_limit(0);

$kws = q('SELECT k.id, k.keyword, c.id AS cid, c.name FROM keywords k JOIN clients c ON c.id = k.client_id
          WHERE k.active = 1 ORDER BY c.name, k.keyword')->fetchAll();

$rows = [];
foreach ($kws as $k) {
    $prev = q('SELECT avg_rank FROM scans WHERE keyword_id = ? ORDER BY created_at DESC LIMIT 1', [$k['id']])->fetchColumn();
    try {
        $now = run_scan((int)$k['id']);
        $rows[] = $k + ['now' => $now['avg_rank'], 'top3' => $now['top3_pct'], 'prev' => $prev === false ? null : (float)$prev, 'err' => null];
    } catch (Throwable $e) {
        $rows[] = $k + ['now' => null, 'top3' => null, 'prev' => null, 'err' => $e->getMessage()];
    }
    sleep(1);
}

// Monta o e-mail
$base = rtrim((string)cfg('base_url'), '/');
$alerts = array_filter($rows, fn($r) => $r['prev'] !== null && $r['now'] !== null && $r['now'] - $r['prev'] >= 1);
$html = '<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:640px">';
$html .= '<h2 style="margin:0 0 4px">Ranking Local · semana de ' . date('d/m/Y') . '</h2>';
$html .= '<p style="color:#64748b;margin:0 0 16px">' . count($rows) . ' palavras-chave varridas. ' . count($alerts) . ' caíram 1 posição média ou mais.</p>';
$html .= '<table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="background:#f1f5f9">'
       . '<th align="left" style="padding:8px">Cliente</th><th align="left">Palavra-chave</th><th>Posição média</th><th>Variação</th><th>Top 3</th></tr>';
foreach ($rows as $r) {
    if ($r['err']) { $var = '<span style="color:#b91c1c">erro</span>'; $pos = '-'; $t3 = '-'; }
    else {
        $pos = number_format($r['now'], 1, ',', '');
        $t3 = (int)$r['top3'] . '%';
        if ($r['prev'] === null) $var = 'nova';
        else { $d = $r['now'] - $r['prev'];
            $var = abs($d) < 0.05 ? '=' : '<b style="color:' . ($d < 0 ? '#15803d' : '#b91c1c') . '">' . ($d < 0 ? '▲ subiu ' : '▼ caiu ') . number_format(abs($d), 1, ',', '') . '</b>'; }
    }
    $html .= '<tr style="border-bottom:1px solid #eef2f6"><td style="padding:8px"><a href="' . $base . '/client.php?id=' . $r['cid'] . '">' . h($r['name']) . '</a></td><td>' . h($r['keyword'])
           . '</td><td align="center">' . $pos . '</td><td align="center">' . $var . '</td><td align="center">' . $t3 . '</td></tr>';
}
$html .= '</table><p style="color:#94a3b8;font-size:12px;margin-top:16px">Posição média: menor é melhor. Fora do top 20 conta como 21.</p></div>';

$headers = "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nFrom: Ranking Local <" . cfg('report_from') . ">\r\n";
$subject = '=?UTF-8?B?' . base64_encode('Ranking Local · ' . date('d/m') . ' · ' . count($alerts) . ' alerta(s)') . '?=';
$sent = mail((string)cfg('report_to'), $subject, $html, $headers);
echo date('c') . ' varridas=' . count($rows) . ' email=' . ($sent ? 'ok' : 'falhou') . PHP_EOL;
