<?php
require __DIR__ . '/app/lib.php';
start_session();
$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (hash_equals((string)cfg('admin_password'), (string)($_POST['senha'] ?? ''))) {
        session_regenerate_id(true);
        $_SESSION['ok'] = 1;
        header('Location: index.php'); exit;
    }
    sleep(1);
    $err = 'Senha incorreta.';
}
page_header('Entrar', false); ?>
<div class="card login">
  <h1>Ranking Local</h1>
  <p class="muted">Acesso da equipe</p>
  <?php if ($err): ?><div class="alert"><?= h($err) ?></div><?php endif; ?>
  <form method="post">
    <input type="password" name="senha" placeholder="Senha" autofocus required>
    <button class="btn" style="width:100%">Entrar</button>
  </form>
</div>
<?php page_footer();
