# Carrossel diário do Instagram (formato viral)

**Objetivo dele:** ganhar o máximo de seguidores de todas as áreas pra chegar no público que compra
(empresas, médicos, advogados, lojas). O conteúdo é **viral primeiro**, venda depois.
A rotina agendada dispara nesta conversa às 6h59 (Goiânia); ele não precisa rodar nada.
**Cada entrega da manhã é o post do DIA SEGUINTE** (ex.: entregue segunda, posta terça), pra sobrar um dia pra ele pedir ajuste.

## Passo a passo de cada dia

1. `git pull` na branch de trabalho.
2. **Pesquisa do dia (WebSearch):** assuntos em alta no Brasil (marcas, apps, internet, negócios, consumo),
   notícia que está bombando e palavras que as pessoas estão buscando. Se tiver história real que renda lição
   de negócio, ela passa na frente da pauta. Senão, próximo `pendente` da `PAUTA.md`. Pedido dele no chat vem antes de tudo.
3. **Checar os fatos** (mínimo 2 fontes na busca). Número, nome ou frase sem confirmação não entra. Se não fechar, troca o tema.
4. Criar `cNN-slug/carrossel.html` copiando `c01-botao-300-milhoes` (usa `../base.css` e `../base.js`).
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
- **Todo slide termina puxando o próximo** (última linha do bloco, normalmente a `.nota`): "mas o pior vem agora", "aí veio a solução mais simples do mundo",
  "o resultado foi absurdo". Uma ideia por slide.
- **Penúltimo:** a lição aplicada ao negócio de quem lê (site, WhatsApp, Instagram, atendimento). Venda só sutil.
- **Último: pedir pra seguir** (botão "Seguir @euaugusto_oliv" + promessa do perfil) + mandar pra alguém + salvar
  + pergunta pra comentar. Mandar por DM é o sinal que mais pesa pra alcançar quem não te segue.
- 7 a 9 slides.

## Visual (aprovado em 05/10, não mudar sem ele pedir)

Modelo: `c01-botao-300-milhoes`. Fundo preto, cabeçalho de perfil em todo slide (G + "Gabriel Augusto" + @,
**sem selo de verificado**, ele não é verificado), "ARRASTA PRO LADO" no rodapé (menos no último, `class="s fim"`).

- **Capa = "post do X" escuro** (`<section class="s capa">` + `<div class="txt">`): frase em serifada, centralizada,
  `<b>` nas palavras-chave, `<b class="g">` dourado no número/choque principal, `<small>` cinza com a provocação.
- **Do slide 2 em diante = letras do caderno, SEM a folha de caderno**, num **bloco só** (`<div class="bloco">`),
  compacto, alinhado à esquerda e centralizado na altura (referência: posts de texto do Matheus Tilli):
  - título `h2` em serifada elegante (`h2.m` menor), com `<span class="it">` itálico dourado;
  - 1 palavra-chave com marca-texto em letra de marcador: `<span class="hl gold mk">`, `hl red mk` (alerta) ou `hl mk` (azul);
  - texto corrido `p` em Inter, `<b>` em branco; números grandes `<span class="num">` / `<p class="grande">`; citação `p.citacao`;
  - 1 anotação à mão `p.nota` (azul, `.gold`, `.red`), de preferência fechando o slide com o gancho pro próximo;
  - lista de erros `ul.lista`; riscado `.x`; botão final `.seguir`.
- Máximo por slide: título + 2 ou 3 parágrafos curtos + 1 anotação. **Nada espalhado pela tela.**
- Luz sutil atrás do bloco variando: padrão (dourada), `luz-azul`, `luz-vermelha` (só no slide de problema/alerta).
- Cores: preto, branco, dourado, azul; vermelho só em alerta. Sem rosto dele, sem emoji nas artes.

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
- 05/10: NÃO gostou da folha de caderno nem de informação espalhada. Referência: posts de texto do Matheus Tilli
  (bloco compacto). Escolheu capa "post do X" ESCURO e, depois da capa, as letras do caderno. Ver "Visual".
