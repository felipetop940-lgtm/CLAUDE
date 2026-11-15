<?php
require __DIR__ . '/app/lib.php';
require_login();

$id = (int)($_GET['id'] ?? 0);
$c = q('SELECT * FROM clients WHERE id = ?', [$id])->fetch();
if (!$c) { http_response_code(404); exit('Cliente não encontrado.'); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    set_time_limit(600);
    $back = 'client.php?id=' . $id; $kSel = (int)($_GET['k'] ?? 0); $hash = '';
    // palavra-chave precisa ser deste cliente
    $ownKw = function (int $kid) use ($id): int {
        if (!q('SELECT 1 FROM keywords WHERE id = ? AND client_id = ?', [$kid, $id])->fetchColumn()) throw new RuntimeException('Palavra-chave não encontrada.');
        return $kid;
    };
    try {
        switch ($_POST['action'] ?? '') {
            case 'add_kw':
                $kw = trim($_POST['keyword'] ?? '');
                $size = in_array((int)$_POST['grid_size'], [3, 5, 7, 9], true) ? (int)$_POST['grid_size'] : 7;
                $rad = max(0.5, min(20, (float)str_replace(',', '.', $_POST['radius_km'] ?? '3')));
                if ($kw === '') break;
                q('INSERT INTO keywords (client_id, keyword, grid_size, radius_km) VALUES (?,?,?,?)', [$id, $kw, $size, $rad]);
                $kSel = (int)db()->lastInsertId(); $hash = '#kw';
                try { run_scan($kSel); flash('ok', 'Palavra-chave salva e primeira varredura feita.'); }
                catch (Throwable $e) { flash('err', 'Palavra-chave salva, mas a varredura falhou: ' . $e->getMessage()); }
                break;
            case 'scan':
                $kSel = $ownKw((int)$_POST['kid']); $hash = '#kw';
                run_scan($kSel); flash('ok', 'Varredura concluída.');
                break;
            case 'scan_all':
                $n = 0; $fail = [];
                foreach (q('SELECT id, keyword FROM keywords WHERE client_id = ? AND active = 1 ORDER BY id', [$id])->fetchAll() as $k) {
                    try { run_scan((int)$k['id']); $n++; } catch (Throwable $e) { $fail[] = $k['keyword'] . ': ' . $e->getMessage(); }
                }
                $fail ? flash('err', $n . ' varrida(s). Falhou: ' . implode(' · ', $fail)) : flash('ok', $n . ' palavra(s)-chave varrida(s).');
                break;
            case 'toggle_kw':
                q('UPDATE keywords SET active = 1 - active WHERE id = ?', [$ownKw((int)$_POST['kid'])]);
                break;
            case 'del_kw':
                q('DELETE FROM keywords WHERE id = ? AND client_id = ?', [(int)$_POST['kid'], $id]);
                if ($kSel === (int)$_POST['kid']) $kSel = 0;
                break;
            case 'toggle_task':
                $key = (string)($_POST['task'] ?? ''); $valid = array_merge(...array_values(array_map('array_keys', checklist_items())));
                if (in_array($key, $valid, true)) {
                    $del = q('DELETE FROM tasks WHERE client_id = ? AND task_key = ?', [$id, $key])->rowCount();
                    if (!$del) q('INSERT INTO tasks (client_id, task_key) VALUES (?,?)', [$id, $key]);
                }
                $hash = '#checklist';
                break;
            case 'add_note':
                $body = trim($_POST['body'] ?? ''); $d = (string)($_POST['note_date'] ?? '');
                if ($body !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) q('INSERT INTO notes (client_id, note_date, body) VALUES (?,?,?)', [$id, $d, mb_substr($body, 0, 500)]);
                $hash = '#notas';
                break;
            case 'del_note':
                q('DELETE FROM notes WHERE id = ? AND client_id = ?', [(int)$_POST['nid'], $id]);
                $hash = '#notas';
                break;
            case 'del_client':
                q('DELETE FROM clients WHERE id = ?', [$id]);
                flash('ok', 'Cliente apagado.');
                header('Location: index.php'); exit;
        }
    } catch (Throwable $e) { flash('err', $e->getMessage()); }
    header('Location: ' . $back . ($kSel ? '&k=' . $kSel : '') . $hash); exit;
}

$kws = client_keywords($id);
$profile = client_profile($id);
$sel = null;
foreach ($kws as $k) if ((int)$k['id'] === (int)($_GET['k'] ?? 0)) $sel = $k;
if (!$sel && $kws) $sel = $kws[0];
$share = rtrim((string)cfg('base_url'), '/') . '/share.php?t=' . $c['share_token'];
$flash = take_flash();

page_header($c['name']); ?>
<p class="crumb"><a href="index.php">← Clientes</a></p>
<div class="page-head">
  <div><p class="eyebrow">Cliente</p><h1><?= h($c['name']) ?></h1><p class="muted"><?= h($c['address']) ?></p></div>
  <div class="actions">
    <a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/place/?q=place_id:<?= h(rawurlencode($c['place_id'])) ?>">Abrir no Google Maps</a>
    <?php if ($kws): ?><form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="scan_all"><button class="btn" data-busy="Varrendo tudo…">Varrer todas</button></form><?php endif; ?>
  </div>
</div>
<?php if ($flash): ?><div class="<?= $flash[0] === 'ok' ? 'ok' : 'alert' ?>"><?= h($flash[1]) ?></div><?php endif; ?>

<?php render_client_kpis($kws, $profile); ?>

<section class="card">
  <div class="card-head"><div><p class="eyebrow">Acompanhamento</p><h2>Palavras-chave</h2>
  <p class="muted">Ficam salvas e entram na varredura de toda segunda. Clique em uma para ver o mapa e a evolução.</p></div></div>
  <?php if ($kws) render_keyword_table($kws, (int)($sel['id'] ?? 0), false, fn(int $kid) => 'client.php?id=' . $id . '&k=' . $kid . '#kw');
        else echo '<p class="empty">Nenhuma palavra-chave ainda. Cadastre a primeira abaixo.</p>'; ?>
  <form method="post" class="inline add-kw">
    <?= csrf_field() ?><input type="hidden" name="action" value="add_kw">
    <input name="keyword" class="grow" placeholder="Nova palavra-chave (ex: pediatra)" required>
    <label>Grade <select name="grid_size"><option value="3">3×3</option><option value="5">5×5</option><option value="7" selected>7×7</option><option value="9">9×9</option></select></label>
    <label>Raio (km) <input name="radius_km" value="3" size="3" inputmode="decimal"></label>
    <button class="btn" data-busy="Varrendo…">Adicionar e varrer</button>
  </form>
  <p class="hint">Raio = distância do endereço até a borda da grade. Palavra sozinha (“pediatra”) mostra melhor o efeito da distância do que com a cidade junto.</p>
</section>

<?php if ($sel) render_keyword_detail($c, $sel, false, $profile['last']); ?>
<?php render_checklist($id); render_notes($id); ?>

<section class="card">
  <p class="eyebrow">Para o cliente</p><h2>Link só de visualização</h2>
  <p class="muted">Mostra mapa, evolução e concorrentes. Não mostra orientações, checklist nem anotações.</p>
  <div class="share"><span id="shareUrl"><?= h($share) ?></span><button type="button" class="btn ghost" onclick="navigator.clipboard.writeText(document.getElementById('shareUrl').textContent).then(()=>{this.textContent='Copiado'})">Copiar</button></div>
  <form method="post" class="danger-zone" onsubmit="return confirm('Apagar o cliente e todo o histórico? Não tem como desfazer.')">
    <?= csrf_field() ?><input type="hidden" name="action" value="del_client"><button class="link danger">Apagar cliente</button>
  </form>
</section>
<?php page_footer();
