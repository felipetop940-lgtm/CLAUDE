---
name: reuniao
description: Registra uma reunião no Obsidian — principalmente reunião de resultado com cliente da agência Consultório de Sucesso — a partir de anotações, áudio transcrito ou ditado. Liga ao cliente, confere as pendências da reunião anterior, gera próximos passos e a mensagem de follow-up. Use quando ele disser "registra a reunião com…", "anota a reunião", "tive reunião com o cliente…".
argument-hint: <cliente> <anotações ou transcrição>
---

# Reunião de resultado

Entrada: $ARGUMENTS. Se não der para saber o cliente, pergunte e pare.

1. **Cliente**: `search_notes` com o nome (e `properties: {"tipo": "cliente"}`). Não existe → crie na pasta onde ficam as outras notas `tipo: cliente` (ou `20 Consultório de Sucesso/Clientes/`) com o modelo do fim desta skill, preenchendo só o que ele falou.
2. **Reunião anterior**: `search_notes` com `properties: {"tipo": "reuniao", "cliente": "<nome>"}`; leia a mais recente e pegue os `Próximos passos`. Marque `[x]` só o que ele disse que foi feito; o resto vai como "conferir".
3. **Nota nova** em `<pasta das reuniões>/AAAA-MM-DD - Reunião de resultado - <Cliente>` (pasta das reuniões existentes ou `20 Consultório de Sucesso/Reuniões/`):

```markdown
---
tipo: reuniao
categoria: resultado
cliente: "[[<Cliente>]]"
data: AAAA-MM-DD
periodo: <mês/ano analisado, se dito>
participantes:
  - "[[<pessoa>]]"
tags:
  - reuniao
---
# Reunião de resultado — <Cliente> — DD/MM/AAAA

> [!summary] Em 3 linhas
> <o que aconteceu, o resultado e a decisão principal>

## Números do período
| Métrica | Anterior | Atual | Variação |
|---|---|---|---|
<só as métricas que ele citou: investimento, leads/conversas, custo por lead, agendamentos, seguidores, alcance… Sem números → "Sem números nesta reunião.">

## O que funcionou
## O que não funcionou
## Feedback do cliente
## Decisões
## Próximos passos
- [ ] <ação> — [[<responsável>]] — até DD/MM

## Pendências da reunião anterior
## Sinais
- Renovação / risco de cancelamento: <baixo | médio | alto — por quê, só com evidência da conversa>
- Oportunidade de upsell: <serviço + motivo, só se apareceu na conversa; senão "nenhuma">

> [!note]- Mensagem de follow-up (WhatsApp)
> <mensagem curta no tom do Felipe: agradece, resume resultado em 1 frase, lista os próximos passos com prazo, fecha com a próxima data se houver>
```

   Seções sem conteúdo: escreva `—`. Nada de número, promessa ou fala inventada. Responsáveis da equipe: [[Duda]] (projetos e social media), [[Vitória]] (criativo, design e vídeo); tráfego, captação e reunião são do Felipe.
4. **Ligar**: no cliente, `append_to_note` seção `Histórico de reuniões` com `- [[<nome da nota da reunião>]] — <resumo de 1 linha>` e `set_properties` `ultima_reuniao: AAAA-MM-DD`. Na nota do dia, seção `Reuniões`, o link.
5. **Resposta**: resumo em 3 linhas, próximos passos, a mensagem de follow-up pronta para copiar e o que faltou (ex.: "faltaram os números de agendamento").

## Modelo da nota do cliente

```markdown
---
tipo: cliente
status: ativo
especialidade:
cidade:
servicos: []
inicio:
mensalidade:
ultima_reuniao:
tags:
  - cliente
---
# <Cliente>

## Contexto
## Serviços contratados
## Histórico de reuniões
## Pendências
```
