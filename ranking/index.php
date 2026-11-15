<?php
require __DIR__ . '/app/lib.php';
require_login();

$err = ''; $cands = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    try {
        if (($_POST['action'] ?? '') === 'find') {
            $cands = find_business(trim($_POST['busca'] ?? ''));
            if (!$cands) $err = 'Nenhum perfil encontrado. Tente nome + cidade, ou o endereço.';
        } elseif (($_POST['action'] ?? '') === 'add') {
            $dup = q('SELECT id FROM clients WHERE place_id = ?', [$_POST['place_id']])->fetchColumn();
            if ($dup) { flash('ok', 'Este perfil já estava salvo.'); header('Location: client.php?id=' . $dup); exit; }
            q('INSERT INTO clients (name, address, place_id, lat, lng, share_token, kind) VALUES (?,?,?,?,?,?,?)', [
                trim($_POST['name']), trim($_POST['address']), $_POST['place_id'],
                (float)$_POST['lat'], (float)$_POST['lng'], bin2hex(random_bytes(16)),
                ($_POST['kind'] ?? '') === 'prospecto' ? 'prospecto' : 'cliente',
            ]);
            flash('ok', 'Cliente salvo. Agora cadastre as palavras-chave dele.');
            header('Location: client.php?id=' . db()->lastInsertId()); exit;
        }
    } catch (Throwable $e) { $err = $e->getMessage(); }
}

$clients = q('SELECT * FROM clients ORDER BY name')->fetchAll();
$series = [];
foreach (q('SELECT k.client_id, DATE(s.created_at) AS d, AVG(s.avg_rank) AS v FROM scans s JOIN keywords k ON k.id = s.keyword_id
            WHERE k.active = 1 GROUP BY k.client_id, DATE(s.created_at) ORDER BY d')->fetchAll() as $r) {
    $series[$r['client_id']][] = (float)$r['v'];
}
$nKw = 0; $allAvg = []; $moves = [];
foreach ($clients as &$c) {
    $c['kws'] = client_keywords((int)$c['id']);
    $c['sum'] = client_summary($c['kws']);
    $c['n_kw'] = count(array_filter($c['kws'], fn($k) => $k['active']));
    if (($c['kind'] ?? 'cliente') !== 'cliente') continue;
    $nKw += $c['n_kw'];
    if ($c['sum']['avg'] !== null) $allAvg[] = $c['sum']['avg'];
    foreach ($c['kws'] as $k) {
        if (!$k['active'] || !$k['last'] || !$k['prev']) continue;
        $d = (float)$k['last']['avg_rank'] - (float)$k['prev']['avg_rank'];
        if (abs($d) >= 1) $moves[] = ['c' => $c, 'k' => $k, 'd' => $d];
    }
}
unset($c);
usort($moves, fn($a, $b) => abs($b['d']) <=> abs($a['d']));
$next = new DateTime('monday 09:00'); if ($next <= new DateTime()) $next->modify('+1 week');

page_header('Clientes'); ?>
<div class="page-head">
  <div><p class="eyebrow">Painel</p><h1>Clientes</h1>
  <p class="muted">Posição no Google Maps por palavra-chave. Varredura automática toda segunda, 9h.</p></div>
  <a class="btn" href="#novo">+ Adicionar cliente</a>
</div>
<?php if ($err): ?><div class="alert"><?= h($err) ?></div><?php endif; ?>

<div class="kpis">
  <div class="kpi"><span>Clientes</span><b><?= count(array_filter($clients, fn($c) => ($c['kind'] ?? 'cliente') === 'cliente')) ?></b><em>perfis na varredura semanal</em></div>
  <div class="kpi"><span>Palavras-chave</span><b><?= $nKw ?></b><em>ativas na varredura semanal</em></div>
  <div class="kpi"><span>Posição média geral</span><b><?= $allAvg ? fmt(array_sum($allAvg) / count($allAvg)) : '–' ?></b><em>média dos clientes</em></div>
  <div class="kpi"><span>Próxima varredura</span><b><?= $next->format('d/m') ?></b><em>segunda, 9h</em></div>
</div>

<?php if ($moves): ?>
<section class="card">
  <p class="eyebrow">Desde a última varredura</p><h2>O que mexeu</h2>
  <ul class="moves">
  <?php foreach (array_slice($moves, 0, 8) as $m): ?>
    <li><a href="client.php?id=<?= (int)$m['c']['id'] ?>&amp;k=<?= (int)$m['k']['id'] ?>#kw">
      <span class="dot <?= $m['d'] < 0 ? 'up' : 'down' ?>"></span>
      <b><?= h($m['c']['name']) ?></b><span class="muted">“<?= h($m['k']['keyword']) ?>”</span>
      <span class="mv"><?= fmt($m['k']['prev']['avg_rank']) ?> → <?= fmt($m['k']['last']['avg_rank']) ?> <?= delta_badge($m['k']['last']['avg_rank'], $m['k']['prev']['avg_rank'], true) ?></span>
    </a></li>
  <?php endforeach; ?>
  </ul>
</section>
<?php endif; ?>

<?php if (!$clients): ?><p class="empty">Nenhum cliente salvo ainda. Adicione o primeiro abaixo.</p><?php endif; ?>
<?php foreach (['cliente' => 'Clientes ativos', 'prospecto' => 'Prospectos'] as $kind => $title):
  $group = array_filter($clients, fn($c) => ($c['kind'] ?? 'cliente') === $kind); if (!$group) continue; ?>
<h3 class="sec"><?= $title ?> (<?= count($group) ?>)<?= $kind === 'prospecto' ? ' · diagnóstico avulso, fora da varredura semanal' : '' ?></h3>
<div class="clients">
<?php foreach ($group as $c): $s = $c['sum']; ?>
  <a class="client-card" href="client.php?id=<?= (int)$c['id'] ?>">
    <div class="cc-top"><div><h2><?= h($c['name']) ?></h2><p class="muted"><?= h($c['address']) ?></p></div><?= avg_tag($s['avg']) ?></div>
    <div class="cc-mid"><?= sparkline($series[$c['id']] ?? [], 150, 40) ?>
      <div class="cc-stats">
        <div><b><?= $s['avg'] !== null ? fmt($s['avg']) : '–' ?></b><?= delta_badge($s['avg_cmp'], $s['avg_prev'], true) ?><span>posição média</span></div>
        <div><b><?= $s['avg'] !== null ? visibility($s['avg']) . '%' : '–' ?></b><span>visibilidade</span></div>
      </div></div>
    <div class="cc-foot"><span><?= (int)$c['n_kw'] ?> palavra(s)-chave</span><span><?= $s['last_at'] ? 'varrido em ' . fdate($s['last_at'], 'd/m') : 'sem varredura' ?></span></div>
  </a>
<?php endforeach; ?>
</div>
<?php endforeach; ?>

<section class="card" id="novo">
  <p class="eyebrow">Novo</p><h2>Adicionar cliente</h2>
  <p class="muted">Digite o nome como aparece no Google + cidade (ex: “Dra. Nanda Ramos pediatra Brasília”). O cliente fica salvo no painel com todo o histórico.</p>
  <form method="post" class="inline" action="#novo">
    <?= csrf_field() ?><input type="hidden" name="action" value="find">
    <input name="busca" class="grow" required value="<?= h($_POST['busca'] ?? '') ?>" placeholder="Nome do perfil + cidade">
    <button class="btn">Buscar perfil</button>
  </form>
  <?php foreach ($cands as $c): ?>
    <form method="post" class="cand">
      <?= csrf_field() ?><input type="hidden" name="action" value="add">
      <?php foreach (['place_id','name','address','lat','lng'] as $f): ?><input type="hidden" name="<?= $f ?>" value="<?= h($c[$f]) ?>"><?php endforeach; ?>
      <div><b><?= h($c['name']) ?></b><br><span class="muted"><?= h($c['address']) ?></span></div>
      <div class="actions"><button class="btn" name="kind" value="cliente">Salvar como cliente</button><button class="btn ghost" name="kind" value="prospecto">Salvar como prospecto</button></div>
    </form>
  <?php endforeach; ?>
</section>
<?php $u = api_usage_month(); $cap = (int)(cfg('monthly_cap') ?? 800); ?>
<p class="hint center">Consultas pagas do Google neste mês: busca com dados <?= (int)($u['busca'] ?? 0) ?> · detalhes de perfil <?= (int)($u['detalhes'] ?? 0) ?> · fotos <?= (int)($u['fotos'] ?? 0) ?>. O sistema para sozinho em <?= $cap ?> de cada tipo.</p>
<?php page_footer();
