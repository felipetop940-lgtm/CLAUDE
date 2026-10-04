---
name: organizar
description: Organiza a pasta de entrada do Obsidian (ou outra pasta) — propõe destino, nome, tags, links e fusões, e só executa depois do ok.
argument-hint: "[pasta; padrão: a pasta de entrada]"
disable-model-invocation: true
---

# Organizar a entrada

Pasta: $ARGUMENTS (vazio = `${user_config.inbox_folder}`).

1. `vault_info` (estrutura e regras), `list_tags` e `list_notes` da pasta. Pegue no máximo 15 notas por rodada, das mais antigas para as mais novas.
2. Para cada nota (`read_note`), decida:
   - **destino**: uma pasta que já existe; só sugira pasta nova se nenhuma servir;
   - **nome**, se o atual for ruim ("Sem título", data solta);
   - **tipo** e **tags** (reaproveite as existentes);
   - **links** para clientes, pessoas e projetos citados (`search_notes`);
   - **duplicata**: nota parecida já existe → propor fundir.
3. Mostre o plano numa tabela (`# | nota | destino | nome novo | tags | links | obs.`) e **pare esperando o ok**. Ele pode aprovar tudo ou ajustar linhas.
4. Com o ok: `set_properties`, `append_to_note` (`Relacionadas`), `move_note` (atualiza os links). Fusão: acrescente o conteúdo na nota que fica e mova a outra para `99 Arquivo/` — nunca apague.
5. Responda com o placar: quantas movidas, renomeadas, fundidas e quantas sobraram na entrada.
