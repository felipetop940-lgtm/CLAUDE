<?php
require __DIR__ . '/app/lib.php';
start_session();
$_SESSION = [];
session_destroy();
header('Location: login.php');
