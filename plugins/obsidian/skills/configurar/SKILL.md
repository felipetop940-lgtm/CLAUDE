---
name: configurar
description: Primeira configuração do cofre do Obsidian para o Claude — confere o caminho, cria o Claude.md com as regras do cofre e, se o cofre estiver vazio, monta a estrutura de pastas.
disable-model-invocation: true
---

# Configurar o cofre

1. `vault_info`. Se der erro de cofre não configurado: explique que ele deve abrir `/plugin`, escolher **obsidian** → configurar, colar o caminho da pasta do cofre e reiniciar a sessão. Pare aí.
2. **Cofre com notas**: não crie pastas. Mostre a estrutura encontrada e proponha um `Claude.md` adaptado a ela (pastas reais, tipos e tags que já existem — use `list_tags`). Crie só com o ok.
3. **Cofre vazio** (ou ele pediu estrutura nova): crie o `Claude.md` abaixo e uma nota-índice por área para as pastas existirem e virarem alvo de link:
   - `20 Consultório de Sucesso/Consultório de Sucesso.md`
   - `30 ConnextMED/ConnextMED.md`
   - `40 Internato/Internato.md`
   - `50 Ideias e conteúdo/Ideias e conteúdo.md`
   (`00 Entrada`, `10 Diário`, `80 Revisões` e `99 Arquivo` nascem sozinhas no uso.)
4. Oriente em 3 linhas: no Obsidian, Configurações → Plugins principais → **Notas diárias**: pasta `10 Diário`, formato `YYYY-MM-DD` — assim o botão de nota do dia do app abre a mesma nota que o Claude usa.
5. Responda com o que foi criado e os comandos do plugin: `/obsidian:capturar`, `/obsidian:diario`, `/obsidian:reuniao`, `/obsidian:perguntar`, `/obsidian:semana`, `/obsidian:organizar`.

## Claude.md (raiz do cofre)

```markdown
# Regras do cofre para o Claude

## Quem sou
Felipe — CEO da Consultório de Sucesso (agência de marketing para médicos e clínicas) e fundador do ConnextMED (congresso médico nacional; sócio: [[Lucas]]). Estudante de medicina no internato. Falo por voz: limpe o texto, mantenha minhas palavras.

## Pastas
- `00 Entrada/` — capturas rápidas; organizar toda semana
- `10 Diário/` — uma nota por dia (`AAAA-MM-DD`)
- `20 Consultório de Sucesso/Clientes/` — uma nota por cliente (`tipo: cliente`)
- `20 Consultório de Sucesso/Reuniões/` — reuniões de resultado (`tipo: reuniao`)
- `20 Consultório de Sucesso/Processos/` — como a agência faz cada entrega
- `30 ConnextMED/`
- `40 Internato/`
- `50 Ideias e conteúdo/` — ideias de post, campanha e oferta
- `80 Revisões/` — revisões semanais
- `99 Arquivo/` — o que saiu de uso (nada é apagado)

## Pessoas (sempre com link)
[[Duda]] — projetos e social media · [[Vitória]] — direção criativa, design e vídeo · [[Lucas]] — operacional do ConnextMED

## Propriedades
- `tipo`: cliente | reuniao | ideia | processo | pessoa | revisao | captura
- `status`: ativo | pausado | encerrado (clientes) · aberto | feito (ideias e projetos)
- datas sempre `AAAA-MM-DD`

## Estilo
Português informal e direto. Nada de número, depoimento ou dado inventado: faltou, deixa `—`.
```
