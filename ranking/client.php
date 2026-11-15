<?php
require __DIR__ . '/app/lib.php';
require_login();

$id = (int)($_GET['id'] ?? 0);
$c = q('SELECT * FROM clients WHERE id = ?', [$id])->fetch();
if (!$c) { http_response_code(404); exit('Cliente não encontrado.'); }

$err = ''; $ok = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    set_time_limit(180);
    try {
        switch ($_POST['action'] ?? '') {
            case 'add_kw':
                $kw = trim($_POST['keyword'] ?? '');
                $size = in_array((int)$_POST['grid_size'], [3, 5, 7, 9], true) ? (int)$_POST['grid_size'] : 7;
                $rad = max(0.5, min(20, (float)str_replace(',', '.', $_POST['radius_km'] ?? '3')));
                if ($kw !== '') {
                    q('INSERT INTO keywords (client_id, keyword, grid_size, radius_km) VALUES (?,?,?,?)', [$id, $kw, $size, $rad]);
                    $kid = (int)db()->lastInsertId();
                    run_scan($kid);
                    $ok = 'Palavra-chave adicionada e primeira varredura feita.';
                }
                break;
            case 'scan':
                run_scan((int)$_POST['kid']);
                $ok = 'Varredura concluída.';
                break;
            case 'del_kw':
                q('DELETE FROM keywords WHERE id = ? AND client_id = ?', [(int)$_POST['kid'], $id]);
                break;
            case 'del_client':
                q('DELETE FROM clients WHERE id = ?', [$id]);
                header('Location: index.php'); exit;
        }
    } catch (Throwable $e) { $err = $e->getMessage(); }
}

$share = rtrim((string)cfg('base_url'), '/') . '/share.php?t=' . $c['share_token'];
page_header($c['name']); ?>
<p><a href="index.php">← Clientes</a></p>
<h1><?= h($c['name']) ?></h1>
<p class="muted"><?= h($c['address']) ?></p>
<?php if ($err): ?><div class="alert"><?= h($err) ?></div><?php endif; ?>
<?php if ($ok): ?><div class="ok"><?= h($ok) ?></div><?php endif; ?>

<section class="card">
  <h2>Nova palavra-chave</h2>
  <p class="muted">Ao adicionar, a primeira varredura roda na hora (leva alguns segundos).</p>
  <form method="post" class="inline" onsubmit="this.querySelector('button').textContent='Varrendo…'">
    <?= csrf_field() ?><input type="hidden" name="action" value="add_kw">
    <input name="keyword" placeholder="ex: pediatra asa norte" style="flex:1;min-width:220px" required>
    <label>Grade <select name="grid_size"><option>5</option><option selected>7</option><option>9</option></select></label>
    <label>Raio (km) <input name="radius_km" value="3" size="3"></label>
    <button class="btn">Adicionar</button>
  </form>
</section>

<?php render_client($c, false); ?>

<section class="card">
  <h3>Link só de visualização (para o cliente)</h3>
  <div class="share"><?= h($share) ?></div>
  <form method="post" style="margin-top:16px" onsubmit="return confirm('Apagar o cliente e todo o histórico?')">
    <?= csrf_field() ?><input type="hidden" name="action" value="del_client"><button class="btn ghost">Apagar cliente</button>
  </form>
</section>
<script>
document.querySelectorAll('form').forEach(f=>f.addEventListener('submit',()=>{const b=f.querySelector('button');if(b&&f.querySelector('[value=scan]'))b.textContent='Varrendo…';}));
</script>
<?php page_footer();
