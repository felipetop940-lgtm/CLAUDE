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
            q('INSERT INTO clients (name, address, place_id, lat, lng, share_token) VALUES (?,?,?,?,?,?)', [
                trim($_POST['name']), trim($_POST['address']), $_POST['place_id'],
                (float)$_POST['lat'], (float)$_POST['lng'], bin2hex(random_bytes(16)),
            ]);
            header('Location: client.php?id=' . db()->lastInsertId()); exit;
        }
    } catch (Throwable $e) { $err = $e->getMessage(); }
}

$clients = q('SELECT c.*,
    (SELECT COUNT(*) FROM keywords k WHERE k.client_id = c.id) AS n_kw,
    (SELECT AVG(s.avg_rank) FROM scans s JOIN keywords k ON k.id = s.keyword_id
       WHERE k.client_id = c.id AND s.id IN (SELECT MAX(id) FROM scans GROUP BY keyword_id)) AS media
    FROM clients c ORDER BY c.name')->fetchAll();

page_header('Clientes'); ?>
<h1>Clientes</h1>
<p class="muted">Posição no Google Maps por palavra-chave, com varredura automática toda segunda.</p>
<?php if ($err): ?><div class="alert"><?= h($err) ?></div><?php endif; ?>

<section class="card">
  <h2>Adicionar cliente</h2>
  <p class="muted">Digite o nome como aparece no Google + cidade (ex: “Dra. Nanda Ramos pediatra Brasília”).</p>
  <form method="post" class="inline">
    <?= csrf_field() ?><input type="hidden" name="action" value="find">
    <input name="busca" style="flex:1;min-width:260px" required value="<?= h($_POST['busca'] ?? '') ?>">
    <button class="btn">Buscar perfil</button>
  </form>
  <?php foreach ($cands as $c): ?>
    <form method="post" class="inline" style="margin-top:12px;justify-content:space-between;border-top:1px solid #eef2f6;padding-top:12px">
      <?= csrf_field() ?><input type="hidden" name="action" value="add">
      <?php foreach (['place_id','name','address','lat','lng'] as $f): ?><input type="hidden" name="<?= $f ?>" value="<?= h($c[$f]) ?>"><?php endforeach; ?>
      <div><b><?= h($c['name']) ?></b><br><span class="muted"><?= h($c['address']) ?></span></div>
      <button class="btn">É este</button>
    </form>
  <?php endforeach; ?>
</section>

<section class="card list">
  <?php if (!$clients): ?><p class="muted">Nenhum cliente ainda.</p><?php endif; ?>
  <?php foreach ($clients as $c): $m = $c['media'] !== null ? (float)$c['media'] : null; ?>
    <a class="row" href="client.php?id=<?= $c['id'] ?>">
      <div><b><?= h($c['name']) ?></b><br><span class="muted"><?= (int)$c['n_kw'] ?> palavra(s)-chave</span></div>
      <div><?php if ($m !== null): ?>posição média
        <span class="tag <?= rank_class($m >= 20.5 ? null : (int)round($m)) ?>"><?= number_format($m, 1, ',', '') ?></span>
      <?php else: ?><span class="muted">sem varredura</span><?php endif; ?></div>
    </a>
  <?php endforeach; ?>
</section>
<?php page_footer();
