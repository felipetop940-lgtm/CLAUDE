---
name: semana
description: Revisão semanal no Obsidian — junta notas do dia, reuniões e o que mudou na semana, consolida tarefas abertas e propõe as 3 prioridades da próxima semana. Use quando ele pedir "revisão da semana", "fecha a semana", "como foi minha semana", "o que ficou pendente".
argument-hint: "[AAAA-MM-DD de qualquer dia da semana; padrão: semana atual]"
---

# Revisão semanal

Entrada: $ARGUMENTS

1. **Semana**: segunda a domingo da data dada. Sem data: semana atual; se hoje for segunda, a semana anterior. Use a data e a semana ISO de `vault_info`.
2. **Coleta**:
   - `daily_note` de cada dia com `create: false`;
   - `search_notes` com `properties: {"tipo": "reuniao"}` e leia as reuniões com `data` na semana;
   - `list_notes` com `since` = segunda, para o resto do que mudou (ideias, clientes, ConnextMED, internato).
3. **Nota** em `80 Revisões/AAAA-[W]ss - Revisão semanal` (ou a pasta onde já ficam as revisões), propriedades `tipo: revisao`, `semana: AAAA-Wss`, `inicio`, `fim`:
   - `## Placar` — o que foi entregue (fatos, com [[links]]);
   - `## Clientes` — 1 linha por cliente com reunião ou entrega na semana;
   - `## ConnextMED` e `## Internato` — só se houver registro;
   - `## O que travou`;
   - `## Tarefas abertas` — todas as `- [ ]` da semana, sem duplicata, cada uma com o link da nota de origem; as velhas (vindas de antes) marcadas;
   - `## Prioridades da próxima semana` — no máximo 3, escolhidas pelo que mais move receita e entrega (clientes, prospecção, ConnextMED), marcadas como proposta;
   - `## Leitura honesta` — 2 ou 3 frases diretas sobre foco e onde o tempo foi, com base no que está nas notas (ex.: "nenhum registro de prospecção na semana"). Sem sermão e sem inventar.
4. **Resposta**: as 3 prioridades, quantas tarefas abertas, a leitura honesta e o link. Pergunte se quer ajustar as prioridades.
