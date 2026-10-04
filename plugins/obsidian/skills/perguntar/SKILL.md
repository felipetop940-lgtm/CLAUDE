---
name: perguntar
description: Responde perguntas usando o que está nas notas do Obsidian, citando as notas. Use quando ele perguntar "o que eu anotei sobre…", "o que ficou decidido com…", "quando foi…", "procura nas minhas notas", "o que eu sei sobre…".
argument-hint: <pergunta sobre suas notas>
---

# Perguntar às notas

Pergunta: $ARGUMENTS

1. Busque com 2 ou 3 variações (`search_notes`): palavra-chave principal, sinônimo, nome sem título ("Ana" em vez de "Dra. Ana"). Se fizer sentido, filtre por `properties` (`tipo: reuniao`, `cliente: …`) ou `tag`.
2. Leia as 3 a 6 notas mais relevantes (`read_note`). Siga links (`get_links`) só se a resposta depender deles.
3. Responda:
   - primeira linha: a resposta direta;
   - depois, os pontos que sustentam, cada um citando a nota como [[Nome da nota]] e a data quando houver;
   - separe "está nas notas" de "minha leitura" quando você inferir algo;
   - não achou → diga que não está nas notas e onde procurou. Não complete com conhecimento geral sem avisar.
4. Não escreva nada no cofre. Se a resposta for uma síntese que vale guardar, ofereça em uma linha salvar como nota.
