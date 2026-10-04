---
name: obsidian
description: Regras para ler e escrever no cofre do Obsidian do usuário (notas .md, propriedades, [[links]], tags, tarefas). Use sempre que ele falar de Obsidian, cofre/vault, "minhas notas", "segundo cérebro", "anota isso", "salva nas notas", "o que eu escrevi sobre…", nota do dia, ou pedir para guardar, achar, ligar ou organizar informação dele ou das empresas.
---

# Obsidian: regras do cofre

Cofre: `${user_config.vault_path}` · pasta de entrada: `${user_config.inbox_folder}`.

## Ferramentas (servidor MCP `obsidian` deste plugin)

| Quero | Ferramenta |
|---|---|
| Entender o cofre, a data de hoje e as regras do dono | `vault_info` (uma vez por sessão, antes de escrever) |
| Achar nota | `search_notes` (texto, pasta, tag, propriedades) |
| Ler | `read_note` (aceita só o nome, como num [[link]]) |
| Ver quem liga com quem | `get_links` |
| Listar / o que mudou | `list_notes` (`since` para "desde segunda") |
| Criar | `create_note` |
| Acrescentar | `append_to_note` (`heading` cai na seção certa) |
| Trocar um trecho | `edit_note` |
| Mudar propriedades | `set_properties` (null remove) |
| Nota do dia | `daily_note` (`create: false` só lê) |
| Mover/renomear sem quebrar links | `move_note` |
| Tags que já existem | `list_tags` |

Se as ferramentas não aparecerem (Node ausente ou servidor fora do ar): trabalhe direto nos arquivos de `${user_config.vault_path}` com Read/Write/Edit/Glob/Grep, mesmas regras, e avise que o servidor não subiu. Não existe ferramenta de apagar: para remover, peça que ele apague no Obsidian.

## Antes de escrever

1. `vault_info`. Se houver `Claude.md` na raiz do cofre, ele manda mais que esta skill.
2. Siga a estrutura que já existe (pastas, nomes, propriedades). Só proponha estrutura nova com cofre vazio ou se ele pedir (`/obsidian:configurar`).
3. Procure antes de criar: `search_notes` pelo nome da pessoa, cliente ou projeto. Existe → acrescente ou linke. Nunca duplique.

## Formato Obsidian

- **Propriedades** no topo (YAML): `tipo`, `status`, `data` (AAAA-MM-DD), `tags` (lista). Link em propriedade vai entre aspas: `cliente: "[[Dra. Ana]]"`. Use os tipos do cofre: `cliente`, `reuniao`, `ideia`, `processo`, `pessoa`, `revisao`, `captura`.
- **Tags**: minúsculas, sem espaço, hierarquia com `/` (`cliente/ativo`). Reaproveite as de `list_tags` antes de inventar.
- **Links**: `[[Nota]]`, `[[Nota|texto]]`, `[[Nota#Seção]]`, embed `![[Nota]]`. Linke pessoa, cliente e projeto na primeira menção — link para nota que ainda não existe é permitido e útil.
- **Tarefas**: `- [ ] ação — responsável — até DD/MM`. Se o cofre usa o plugin Tasks (há `📅` nas notas), use `📅 AAAA-MM-DD`.
- **Destaque**: callout `> [!tip]`, `> [!warning]`, `> [!summary]`, com moderação.
- **Nome de arquivo**: legível, sem `* " \ / < > : | ? # ^ [ ]`; data no começo quando for registro datado (`2026-10-04 - Reunião de resultado - Dra. Ana`).

## Escrita

- Ele dita por voz: frase cortada, correção no meio. Grave a intenção final, limpa, nas palavras dele; não guarde o rascunho com as correções.
- Não invente número, nome, data ou fala. Faltou dado → deixe `—` e diga na resposta o que faltou.
- Não sobrescreva: `append_to_note`, `edit_note`, `set_properties`. `overwrite` só com pedido explícito.
- Mexer em várias notas (mover, renomear em lote, fundir) → mostre o plano e espere o ok.

## Resposta

Curta: o que fez + caminho da nota + link `obsidian://` que a ferramenta devolve. Não cole a nota inteira de volta, a menos que ele peça.
