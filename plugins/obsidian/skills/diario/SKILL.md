---
name: diario
description: Nota do dia no Obsidian — registrar o que aconteceu, abrir o dia com as pendências de ontem ou fechar o dia. Use quando ele falar "registra no diário", "hoje eu…", "o que tenho pra hoje", "abre meu dia", "fecha o dia".
argument-hint: "[o que registrar | abrir | fechar]"
---

# Diário

Entrada: $ARGUMENTS

## Sem argumento ou "abrir"
1. `daily_note` de hoje (cria se faltar) e `daily_note` de `ontem` com `create: false`.
2. Tarefas `- [ ]` de ontem que não estão na nota de hoje → acrescente em `Tarefas` com `(de ontem)` no fim. Compare o texto antes para não duplicar.
3. Responda: tarefas de hoje (no máximo 7, as mais importantes primeiro) + quantas vieram de ontem. Se houver mais de 10 abertas, diga isso e sugira cortar.

## "fechar" ou "resumo"
1. Leia a nota de hoje.
2. Acrescente `## Fechamento`: o que foi feito (`- [x]` e registros), o que ficou e um aprendizado **só se aparecer nas notas**.
3. Tarefas abertas → `daily_note` de `amanhã`, seção `Tarefas`, sem duplicar.
4. Responda em 3 linhas.

## Com texto (registro)
Separe o ditado em itens e grave na nota de hoje:
- tarefa → seção `Tarefas`: `- [ ] …` (com responsável e prazo se ele disse; linke [[pessoas]] e [[clientes]] que existirem);
- coisa feita → seção `Registro`: `- HH:MM — …`;
- ideia com corpo → use a skill `capturar`.
Responda em uma linha.
