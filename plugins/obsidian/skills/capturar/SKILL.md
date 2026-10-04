---
name: capturar
description: Captura rápida no Obsidian — ideia, tarefa, insight, contato, ideia de conteúdo ou anotação solta. Use quando ele disser "anota aí", "salva isso", "guarda essa ideia", "lembra que…", "joga no Obsidian".
argument-hint: <o que anotar>
---

# Capturar

Entrada: $ARGUMENTS (se vier vazio, pergunte o que anotar e pare).

1. Limpe o texto ditado (voz → texto legível), sem mudar o sentido nem acrescentar nada.
2. Classifique:
   - **Tarefa ou frase curta** (até ~2 linhas) → `daily_note` com `append`, seção `Capturas`. Tarefa vira `- [ ] …`; o resto vira `- HH:MM — …` (hora de `vault_info`/agora).
   - **Ideia, insight, conteúdo, contato ou algo com mais corpo** → nota própria (passo 3).
3. Nota própria:
   - Ache 1 a 3 notas relacionadas com `search_notes` (cliente, pessoa, projeto, tema citados) para linkar.
   - `create_note` em `${user_config.inbox_folder}/<Título curto e claro>` com propriedades `tipo` (ideia | captura | pessoa | conteudo), `criado` (AAAA-MM-DD), `tags` (reaproveite as existentes) e `origem: claude`.
   - Corpo: o texto limpo; se for ideia de negócio/conteúdo, acrescente `## Próximo passo` com uma ação concreta **só se ele disse qual é**; no fim, `## Relacionadas` com os [[links]].
4. Responda em uma linha: onde salvou + link. Se citou cliente/pessoa sem nota, diga que o link ficou pendente.
