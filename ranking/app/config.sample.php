<?php
// Renomeie este arquivo para config.php e preencha os campos.
return [
    // Motor da varredura: 'places' (Google Places API, grátis) ou 'dataforseo' (pago)
    'engine' => 'places',

    // Chave da Places API (New), criada no Google Cloud. Fica só no servidor (restringir por IP).
    'google_api_key' => 'COLE_A_CHAVE_AQUI',

    // Raio (em metros) da preferência de localização em cada ponto da grade (motor 'places')
    'places_bias_radius' => 2000,

    // Chave de NAVEGADOR da Maps JavaScript API (restrita por referenciador HTTP ao domínio do painel).
    // Deixe vazio para usar o mapa de reserva (Leaflet).
    'maps_js_key' => '',

    // Lê nota e nº de avaliações do perfil do cliente (1 consulta por cliente a cada 6 dias).
    // Coloque false para desligar.
    'track_reviews' => true,

    // DataForSEO (app.dataforseo.com/api-access) — só é usado com 'engine' => 'dataforseo'
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
