<?php
declare(strict_types=1);

/* ---------- Leitura da grade ---------- */
// Resume a última varredura por região: centro, miolo, borda e os quatro lados.
function grid_stats(array $pts): array {
    $n = count($pts); $size = max(1, (int)round(sqrt($n))); $half = intdiv($size, 2);
    $g = ['norte' => [], 'sul' => [], 'leste' => [], 'oeste' => [], 'miolo' => [], 'borda' => []];
    $center = null; $centerErr = false; $errs = 0;
    foreach ($pts as $i => $p) {
        $r = intdiv($i, $size); $c = $i % $size; // linha 0 = norte
        $isCenter = ($r === $half && $c === $half);
        if (!empty($p['err'])) { $errs++; if ($isCenter) $centerErr = true; continue; }
        $v = $p['rank'] ?? 21;
        if ($isCenter) { $center = $p['rank'] ?? null; continue; }
        if ($r < $half) $g['norte'][] = $v;
        if ($r > $half) $g['sul'][] = $v;
        if ($c > $half) $g['leste'][] = $v;
        if ($c < $half) $g['oeste'][] = $v;
        $ring = max(abs($r - $half), abs($c - $half));
        $g[$ring === $half ? 'borda' : 'miolo'][] = $v;
    }
    $avg = fn(array $a) => $a ? array_sum($a) / count($a) : null;
    return [
        'size' => $size, 'center' => $center, 'center_err' => $centerErr, 'errs' => $errs,
        'miolo' => $avg($g['miolo']), 'borda' => $avg($g['borda']),
        'lados' => array_filter(array_map($avg, array_intersect_key($g, array_flip(['norte', 'sul', 'leste', 'oeste']))), fn($x) => $x !== null),
    ];
}

/* ---------- Orientações por palavra-chave ----------
   Regras fixas em cima do que a varredura mostra. Cada item:
   ['pri' => 'alta'|'media'|'baixa'|'ok', 'title', 'why', 'do' => [ações]] */
function keyword_insights(array $k, array $scans, ?array $profile): array {
    $out = [];
    $last = $scans[0] ?? null;
    if (!$last) return $out;
    $prev = $scans[1] ?? null;
    $pts = json_decode($last['points'] ?? '[]', true) ?: [];
    $st = grid_stats($pts);
    $avg = (float)$last['avg_rank']; $top3 = (float)$last['top3_pct']; $found = (float)$last['found_pct'];
    $center = $st['center'];
    $n1 = fn($v) => number_format((float)$v, 1, ',', '.');
    $area = json_decode($last['area'] ?? '[]', true) ?: [];
    $step = $st['size'] > 1 ? (float)$k['radius_km'] / intdiv($st['size'], 2) : 0;

    // 1. Queda ou subida relevante
    if ($prev) {
        $d = $avg - (float)$prev['avg_rank'];
        if ($d >= 1.5) {
            $out[] = ['pri' => 'alta', 'title' => 'Caiu ' . $n1($d) . ' posições desde a última varredura',
                'why' => 'A posição média foi de ' . $n1($prev['avg_rank']) . ' para ' . $n1($avg) . '. Uma semana ruim sozinha pode ser oscilação do Google; duas seguidas já é tendência.',
                'do' => [
                    'Conferir se o perfil continua verificado, sem aviso de suspensão ou edição pendente.',
                    'Ver se alguém mudou categoria, nome, endereço ou horário nos últimos dias.',
                    'Olhar o ranking da área ao lado do mapa: entrou concorrente novo ou alguém disparou em avaliações?',
                    'Registrar em Anotações o que foi mexido no perfil e confirmar na próxima varredura antes de mudar a estratégia.',
                ]];
        } elseif ($d <= -1.5) {
            $out[] = ['pri' => 'ok', 'title' => 'Subiu ' . $n1(-$d) . ' posições desde a última varredura',
                'why' => 'A posição média foi de ' . $n1($prev['avg_rank']) . ' para ' . $n1($avg) . '.',
                'do' => ['Anotar em Anotações o que foi feito nas últimas semanas, para repetir nos outros clientes.', 'Levar o mapa de antes e depois para a reunião de resultado.']];
        }
    }

    // 2. Situação principal (uma só)
    if ($st['center_err']) {
        $out[] = ['pri' => 'media', 'title' => 'O ponto central não foi lido',
            'why' => 'A consulta do endereço do cliente falhou nesta varredura, então a leitura do centro não é confiável.',
            'do' => ['Rodar “Varrer agora” de novo.']];
    } elseif ($found <= 5 && $center === null) {
        $out[] = ['pri' => 'alta', 'title' => 'O Google não associa o perfil a esta busca',
            'why' => 'O perfil não aparece no top 20 nem na porta do consultório. Isso é problema de relevância, não de distância.',
            'do' => [
                'Conferir a categoria principal: tem que ser a especialidade exata desta busca (é o fator que mais pesa).',
                'Cadastrar o serviço com este termo em “Serviços” e citar na descrição do perfil.',
                'Ter no site uma página sobre este serviço, com a cidade no título, e apontar o link do perfil para ela.',
                'Pedir avaliações em que o paciente cite o serviço com as próprias palavras.',
                'Se a categoria e os serviços já estão certos, testar uma variação do termo mais próxima de como o paciente busca.',
            ]];
    } elseif ($top3 >= 70) {
        $out[] = ['pri' => 'ok', 'title' => 'Dominando a área: ' . round($top3) . '% dos pontos no top 3',
            'why' => 'Nesta palavra o perfil já ganha na maior parte da grade.',
            'do' => [
                'Manter o ritmo: avaliações novas toda semana, respostas a todas e postagem semanal.',
                'Aumentar o raio desta palavra para medir até onde o perfil chega.',
                'Cadastrar a próxima palavra-chave (outro serviço ou sintoma que o paciente busca).',
            ]];
    } elseif ($center !== null && $center <= 3 && $st['borda'] !== null && $st['borda'] >= 15) {
        $out[] = ['pri' => 'media', 'title' => 'Forte na porta, some com a distância',
            'why' => 'No endereço o perfil está em ' . $center . 'º, mas na borda da grade a média é ' . $n1($st['borda']) . '. O Google está tratando o perfil como opção só do bairro.',
            'do' => [
                'Aumentar autoridade: mais avaliações (volume e frequência) do que os concorrentes do ranking ao lado do mapa.',
                'Pedir que pacientes de outros bairros citem o bairro na avaliação.',
                'Criar no site conteúdo por bairro ou região atendida e citar as regiões na descrição do perfil.',
                'Padronizar nome, endereço e telefone em site, Instagram, Doctoralia e diretórios.',
                $step >= 1.5 ? 'Considerar reduzir o raio: pontos a cada ' . $n1($step) . ' km podem estar além da área real de atendimento.' : 'Conseguir links de sites locais (clínicas parceiras, associações, matérias).',
            ]];
    } elseif ($center !== null && $center <= 3) {
        $out[] = ['pri' => 'media', 'title' => 'Top 3 no centro, espaço para crescer no entorno',
            'why' => 'No endereço o perfil está em ' . $center . 'º, mas só ' . round($top3) . '% da grade está no top 3.',
            'do' => [
                'Avaliações: definir meta semanal e pedir em toda consulta (link curto ou QR code na recepção).',
                'Responder todas as avaliações citando o serviço prestado.',
                'Postagem semanal no perfil com foto real e o serviço desta palavra.',
            ]];
    } elseif ($center !== null && $center <= 10) {
        $out[] = ['pri' => 'alta', 'title' => 'Na briga, mas fora do top 3 (' . $center . 'º no centro)',
            'why' => 'O Google já entende que o perfil é relevante para esta busca. O que separa do top 3 costuma ser autoridade: avaliações, atividade e completude do perfil.',
            'do' => [
                'Comparar nº de avaliações e nota com os três primeiros do ranking da área e montar meta para encostar.',
                'Completar 100% do perfil: serviços, atributos, horários, link de agendamento e descrição.',
                'Subir fotos novas toda semana (fachada, recepção, sala, equipe).',
                'Responder todas as avaliações, inclusive as antigas.',
            ]];
    } else {
        $pos = $center === null ? 'fora do top 20' : 'em ' . $center . 'º';
        $out[] = ['pri' => 'alta', 'title' => 'Fraco até no próprio endereço (' . $pos . ')',
            'why' => 'Se o perfil não ganha na porta, o problema vem antes da distância: relevância para o termo e autoridade.',
            'do' => [
                'Revisar a categoria principal e as secundárias.',
                'Cadastrar o serviço com este termo e reforçar na descrição.',
                'Acelerar avaliações: é o que mais move quem está entre 11º e 20º.',
                'Conferir se o pino do mapa está exatamente no endereço certo.',
            ]];
    }

    // 3. Lado mais fraco
    if (count($st['lados']) === 4 && $found > 5) {
        $l = $st['lados']; asort($l);
        $best = array_key_first($l); $worst = array_key_last($l);
        if ($l[$worst] - $l[$best] >= 4) {
            $out[] = ['pri' => 'baixa', 'title' => 'Mais fraco para o lado ' . $worst,
                'why' => 'Média ' . $n1($l[$worst]) . ' para o ' . $worst . ' contra ' . $n1($l[$best]) . ' para o ' . $best . '. Normalmente há um concorrente forte daquele lado ou poucos pacientes vindos de lá.',
                'do' => ['Identificar os bairros do lado ' . $worst . ' e trabalhar esses nomes em postagens, respostas de avaliações e no site.', 'Pedir avaliação a pacientes que moram naquela região.']];
        }
    }

    // 4. Quem lidera a área
    $leader = null; $me = null;
    foreach ($area as $a) { if (!empty($a['me'])) $me = $a; elseif ($leader === null) $leader = $a; }
    if ($leader && $me && ($me['pos'] ?? 1) > 1 && !empty($leader['name'])) {
        $out[] = ['pri' => 'baixa', 'title' => 'Quem lidera a área: ' . $leader['name'],
            'why' => 'Média ' . $n1($leader['avg']) . ' na grade contra ' . $n1($me['avg']) . ' do cliente, e top 3 em ' . round((float)$leader['top3']) . '% dos pontos.',
            'do' => ['Clicar em “Ver no mapa” no perfil dele para ver onde ele ganha, e abrir no Google para comparar: categoria, nº de avaliações, fotos, serviços e frequência de postagens.', 'Copiar o que ele faz melhor antes de inventar algo novo.']];
    }

    // 5. Avaliações do perfil
    if ($profile && $profile['reviews'] !== null) {
        $rv = (int)$profile['reviews']; $rt = $profile['rating'] !== null ? (float)$profile['rating'] : null;
        if ($rv < 30) {
            $out[] = ['pri' => 'alta', 'title' => 'Poucas avaliações: ' . $rv,
                'why' => 'Com menos de 30 avaliações o perfil perde para quase qualquer concorrente estabelecido.',
                'do' => ['Criar o link curto de avaliação e mandar por WhatsApp após a consulta.', 'Colocar QR code na recepção.', 'Meta inicial: 2 a 3 avaliações novas por semana, de forma constante (pico artificial chama atenção do Google).']];
        }
        if ($rt !== null && $rt < 4.5) {
            $out[] = ['pri' => 'media', 'title' => 'Nota ' . number_format($rt, 1, ',', '') . ' abaixo de 4,5',
                'why' => 'Nota baixa derruba o clique mesmo quando o perfil aparece bem.',
                'do' => ['Responder as avaliações negativas com calma e solução.', 'Aumentar o volume de avaliações de pacientes satisfeitos para diluir.']];
        }
    }

    // 6. Avisos sobre a medição
    if (preg_match('/\s(em|no|na)\s+\S+/iu', (string)$k['keyword'])) {
        $out[] = ['pri' => 'baixa', 'title' => 'Palavra com a cidade junto varia pouco pela grade',
            'why' => 'Quando o termo já traz a cidade, o Google dá menos peso ao ponto de onde a pessoa busca, e o mapa fica quase todo igual.',
            'do' => ['Acompanhar também a palavra sozinha (sem cidade) para enxergar o efeito da distância.']];
    }
    if ($st['errs'] > 0 && !$st['center_err']) {
        $out[] = ['pri' => 'baixa', 'title' => $st['errs'] . ' ponto(s) sem leitura nesta varredura',
            'why' => 'Pontos cinza ficaram fora da conta. Se repetir, a média deixa de ser comparável.',
            'do' => ['Rodar “Varrer agora” de novo.']];
    }
    if (count($scans) < 3) {
        $out[] = ['pri' => 'baixa', 'title' => 'Histórico ainda curto',
            'why' => 'Com menos de 3 varreduras não dá para separar tendência de oscilação.',
            'do' => ['Esperar as próximas varreduras semanais antes de tirar conclusão.']];
    }
    return $out;
}

/* ---------- Checklist do perfil (salvo por cliente) ---------- */
function checklist_items(): array {
    return [
        'Base do perfil' => [
            'categoria' => 'Categoria principal é a especialidade exata',
            'secundarias' => 'Categorias secundárias cobrindo os outros serviços',
            'nome' => 'Nome igual ao da fachada/registro, sem palavra-chave enfiada',
            'endereco' => 'Endereço e pino do mapa exatamente no local',
            'horario' => 'Horários corretos, incluindo feriados',
            'contato' => 'Telefone/WhatsApp e link de agendamento funcionando',
        ],
        'Conteúdo' => [
            'descricao' => 'Descrição citando serviços e regiões atendidas',
            'servicos' => 'Todos os serviços cadastrados, cada um com descrição',
            'fotos' => 'Pelo menos 10 fotos reais (fachada, recepção, sala, equipe)',
            'posts' => 'Rotina de postagem semanal no perfil',
            'perguntas' => 'Perguntas e respostas frequentes preenchidas',
        ],
        'Avaliações' => [
            'link_avaliacao' => 'Link curto e QR code de avaliação em uso',
            'rotina_avaliacao' => 'Rotina de pedir avaliação após a consulta',
            'respostas' => 'Todas as avaliações respondidas',
        ],
        'Fora do perfil' => [
            'nap' => 'Nome, endereço e telefone idênticos no site, Instagram e diretórios',
            'site' => 'Site com página do serviço + cidade, ligada ao perfil',
        ],
    ];
}
