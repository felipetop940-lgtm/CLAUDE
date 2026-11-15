<?php
// Renomeie este arquivo para config.php e preencha os campos.
return [
    // Chave da Places API (New), criada no Google Cloud
    'google_api_key' => 'COLE_A_CHAVE_AQUI',

    // DataForSEO (app.dataforseo.com/api-access) — posições reais do Google Maps
    'dfs_login'    => 'LOGIN_DA_API',
    'dfs_password' => 'SENHA_DA_API',

    // Banco MySQL criado no hPanel (Bancos de dados > Gerenciamento)
    'db' => [
        'host' => 'localhost',
        'name' => 'u000000000_ranking',
        'user' => 'u000000000_ranking',
        'pass' => 'SENHA_DO_BANCO',
    ],

    // Senha única de acesso ao painel (você e a Duda)
    'admin_password' => 'TROQUE_POR_UMA_SENHA_FORTE',

    // Relatório semanal
    'report_to'   => 'seu-email@exemplo.com',
    'report_from' => 'ranking@consultoriodesucessoo.com',

    // Endereço do painel (usado nos links do e-mail)
    'base_url' => 'https://ranking.consultoriodesucessoo.com',

    'timezone' => 'America/Sao_Paulo',
];
