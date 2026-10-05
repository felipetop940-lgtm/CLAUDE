# Carrossel diário do Instagram (formato viral)

**Objetivo dele:** ganhar o máximo de seguidores de todas as áreas pra chegar no público que compra
(empresas, médicos, advogados, lojas). O conteúdo é **viral primeiro**, venda depois.
A rotina agendada dispara nesta conversa às 6h59 (Goiânia); ele não precisa rodar nada.

## Passo a passo de cada dia

1. `git pull` na branch de trabalho.
2. **Pesquisa do dia (WebSearch):** assuntos em alta no Brasil (marcas, apps, internet, negócios, consumo),
   notícia que está bombando e palavras que as pessoas estão buscando. Se tiver história real que renda lição
   de negócio, ela passa na frente da pauta. Senão, próximo `pendente` da `PAUTA.md`. Pedido dele no chat vem antes de tudo.
3. **Checar os fatos** (mínimo 2 fontes na busca). Número, nome ou frase sem confirmação não entra. Se não fechar, troca o tema.
4. Criar `cNN-slug/carrossel.html` copiando `c01-botao-300-milhoes` (tema `caderno`, usa `../base.css` e `../base.js`).
5. Gerar: `PWPATH=$(npm root -g)/playwright node render.js cNN-slug`. Se aparecer **AVISOS**, corrigir.
6. Abrir **todas** as imagens e revisar: texto vazando, quebra feia de linha, slide poluído, slide vazio demais.
7. `cNN-slug/legenda.md` (modelo do c01) com legenda, primeiro comentário, horário e fontes. Marcar a pauta como `feito DD/MM`.
8. Commit + push.
9. Enviar pra ele: imagens na ordem (SendUserFile) + na mensagem: **horário de postagem**, **legenda pronta**, primeiro comentário.

## Fórmula viral (obrigatória)

- **Capa = só curiosidade.** Uma informação chocante/curiosa + lacuna que só fecha arrastando. Nada de logo grande,
  nada de explicar. Ganchos que funcionam: número absurdo ("US$ 300 milhões"), segredo/proibido ("o pessoal do marketing
  vai me odiar por mostrar isso..."), contraste ("100 mil pessoas com 0 seguidores"), "e pode estar acontecendo com você".
  Sensacionalista no enquadramento, **verdadeiro no conteúdo**.
- **Slide 2 também é capa:** o Instagram reexibe o carrossel começando no 2º slide pra quem não arrastou. Ele precisa prender sozinho.
- **Todo slide termina puxando o próximo** (`.next`): "mas o pior vem agora", "aí veio a solução mais simples do mundo",
  "o resultado foi absurdo". Uma ideia por slide.
- **Penúltimo:** a lição aplicada ao negócio de quem lê (site, WhatsApp, Instagram, atendimento). Venda só sutil.
- **Último: pedir pra seguir** (botão "Seguir @euaugusto_oliv" + promessa do perfil) + mandar pra alguém + salvar
  + pergunta pra comentar. Mandar por DM é o sinal que mais pesa pra alcançar quem não te segue.
- 7 a 9 slides.

## Formatos aprovados (até ele escolher um fixo, alternar por dia)

1. **Caderno** (`<body class="caderno">`): folha escrita à mão, marca-texto, fontes misturadas. Detalhes abaixo.
2. **Post do X** (`<section class="s tw">` escuro ou `s tw claro` branco): cabeçalho com G + nome + @ (sem selo
   de verificado, ele não é verificado) e texto centralizado em serifada (`.txt`), negrito `<b>` nas palavras-chave,
   `<b class="g">` dourado no número principal, `<small>` cinza pra anotação. Dá pra fazer o carrossel inteiro nesse
   formato ou só a capa.
Sempre gerar as capas alternativas com `data-nome` (`capa-clara`, `capa-tweet`, `capa-tweet-clara`) pra ele escolher.

## Visual (tema caderno)

- Folha de caderno escura (espiral, pauta, margem vermelha). Variante clara: `<section class="s claro">`.
- **Mistura de fontes:** títulos em serifada elegante (`.H`, ênfase em itálico `.it` dourado) · palavra-chave em
  letra de marcador com marca-texto (`<span class="hl gold mk">`, `hl red`, `hl` azul) · anotações à mão em caligrafia
  (`.nota`, `.nota gold`, `.nota red`) · texto corrido em Inter (`.lead`) · rótulo pequeno azul (`.kick`).
- Chamativo sem encher: no máximo **1 marca-texto + 1 anotação + 1 bloco** por slide. Muito respiro.
- Cores: preto, branco, dourado, azul; vermelho só no "problema". Topo automático: @ no oval + contador 01/08.
- Sem rosto dele, sem emoji nas artes.

## Legenda

- 1ª linha = o gancho com a palavra-chave principal (o Instagram busca pelo texto da legenda).
- Parágrafos curtos contando a história, a lição, pergunta pra comentar, "salva e manda pra alguém",
  **"Segue @euaugusto_oliv: todo dia uma história real de negócios que quase ninguém conta."**, fonte, 5 hashtags.
- Primeiro comentário: teaser do post de amanhã ("amanhã: ... segue pra não perder").

## Horário de postagem (Brasil, até ter dados do perfil)

| Dia | Postar | Janela boa |
|---|---|---|
| Segunda | 12h | 11h às 14h |
| Terça | 12h | 10h às 13h |
| Quarta | 12h | 10h às 14h |
| Quinta | 12h | 11h às 14h ou 19h |
| Sexta | 12h | 11h às 13h |
| Sábado e domingo | 19h | 18h às 21h |

Depois de 2 a 3 semanas, pedir pra ele o print de **Insights > Público > Horários mais ativos** e ajustar esta tabela.

## Regras que continuam valendo

- **Não inventar** dados, números, depoimentos ou clientes. Toda história tem fonte na `legenda.md`.
- Preços reais quando aparecerem: Essencial R$ 300 · Premium Page R$ 500 (domínio .com.br + vídeo, até 5 rodadas, 2 a 5 dias).
- Dr. Renato só quando ele liberar.

## Ajustes que ele pediu (aplicar em todos os próximos)

- 05/10: nada de tema "chato"/óbvio (ex.: "link na bio não é site"). Conteúdo viral, pra todas as áreas.
- 05/10: capa 100% curiosidade, começar com informação muito chamativa; todo slide termina fazendo querer ver o próximo.
- 05/10: sempre legenda + horário de postagem + pedido pra seguir.
- 05/10: referências: capa só texto (serifada) e caderno escrito à mão com marca-texto (@maestroprompts). Fontes variadas,
  chamativo e aesthetic sem encher a tela. Pode variar levemente as cores.
- 05/10: 3ª referência: post estilo X/Twitter (@erikammello): fundo branco, serifada, negrito nas palavras-chave.
