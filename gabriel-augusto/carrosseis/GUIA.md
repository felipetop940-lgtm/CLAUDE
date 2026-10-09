# Carrossel diário do Instagram (formato viral)

**Objetivo dele:** ganhar o máximo de seguidores de todas as áreas pra chegar no público que compra
(empresas, médicos, advogados, lojas). O conteúdo é **viral primeiro**, venda depois.
A rotina agendada dispara nesta conversa às 12h20 (Goiânia) e **as artes têm que estar com ele até as 13h**, todo dia
a partir de 06/10. É o post do **mesmo dia** (postar às 19h). Ele não precisa rodar nada.
Antes de montar, ler `RETENCAO.md` (ideias de retenção pesquisadas) e aplicar pelo menos uma por carrossel.

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

## INSTAGRAM: MODELO POST DO X ESCURO (decidido em 09/10) · teste: `x00-teste`

A partir de 09/10 as artes do **Instagram** (cNN, 4:5) usam `../x.css` + `../x.js`. O **TikTok** continua no modelo viral
(`viral.css`, 9:16). Então o principal sai em dois HTML: `cNN-tema/carrossel.html` (X, Instagram) e
`cNN-tema-tt/carrossel.html` (viral, `render.js ... --tiktok`).
- Todo slide é um post do X: o x.js coloca a foto do perfil (`img/perfil.jpg`, recorte quadrado de `assets/img/gabriel-sobre.webp`) + Gabriel Augusto + selo azul
  de verificado (pedido dele) + @ e o rodapé (01/08, pontinhos, ARRASTA →). Título 98px (capa 112px).
- `<section class="s capa">` / `<section class="s">` / `<section class="s fim">` com `<h2>` (título curto, até ~12 palavras)
  e `<p>` (apoio cinza, 1 frase). Destaque em **vermelho vivo** (`#FF1F2E`): `<b class="r">` (texto) ou `<b class="mk">`
  (bloco vermelho, 1 por carrossel, na capa ou no fim). `.x` = riscado. `.midia` = imagem/print com borda. `.seguir` = botão branco.
- Fundo preto puro (#000), Inter forte. Nada de caderno, papel amassado ou boneco nesse modelo.

## MODELO VIRAL (decidido em 06/10, vale pra Instagram e TikTok) · em teste: `v00-teste-modelo`

Ele mostrou que os posts dele que passaram de **150 mil e 229 mil views** no TikTok tinham: título curtíssimo e
GIGANTE na capa, frases curtas e simples nos slides, boneco stickman, papel amassado. O modelo "post do X" teve 2 a 177 views.
**A partir de agora todo carrossel (cNN e tNN) usa o modelo viral**: `../viral.css` + `../viral.js` (sem base.css).
- Fundo preto de papel amassado (`img/papel-escuro.jpg`), boneco stickman **branco** (`<div class="boneco" data-pose=".." data-emo="..">`).
- Capa `<section class="s capa">`: título Anton em 3 linhas no máximo, palavra-chave em vermelho e maior (`span.r.xl`),
  boneco reagindo e uma frasezinha cinza (`p.mini`). Até ~7 palavras no título.
- Slides: número vermelho (`p.n`), título de 2 linhas (`h2.t` com `span.r`), boneco, 1 frase curta (`p.sub`, até ~12 palavras).
- Último slide `class="s fim"`: pergunta pra comentar + botão vermelho (`.seguir`).
- Formato preferido: lista/top N ("5 erros que...", "3 sinais de...") ou história curta com virada. Linguagem simples.
- Render: `render.js <pasta>` (4:5) e `render.js <pasta> --tiktok` (9:16). Sem avisos de vazamento.

## Visual antigo (05/10, "post do X" + bloco de texto). Não usar mais nos posts novos.

Modelo: `c01-botao-300-milhoes`. Fundo preto, cabeçalho de perfil em todo slide (G + "Gabriel Augusto" + @,
**sem selo de verificado**, ele não é verificado), "ARRASTA PRO LADO" no rodapé (menos no último, `class="s fim"`).

- **Capa = "post do X" escuro** (`<section class="s capa">` + `<div class="txt">`): frase em serifada, centralizada,
  `<b>` nas palavras-chave, `<b class="g">` dourado no número/choque principal, `<small>` cinza com a provocação.
- **Do slide 2 em diante = letras do caderno, SEM a folha de caderno**, num **bloco só** (`<div class="bloco">`),
  compacto, alinhado à esquerda e centralizado na altura (referência: posts de texto do Matheus Tilli):
  - título `h2` em serifada elegante (`h2.m` menor), com `<span class="it">` itálico dourado;
  - 1 palavra-chave com marca-texto, escrita na serifada dos títulos em itálico: `<span class="hl gold mk">`, `hl red mk`
    (alerta) ou `hl mk` (azul). **Nunca fonte de marcador/pincel nem maiúscula grossa** (ele recusou as duas);
  - texto corrido `p` em Inter, `<b>` em branco; números grandes `<span class="num">` / `<p class="grande">`; citação `p.citacao`;
  - fechar o slide com a frase-gancho `p.nota` (Inter negrito dourado + "→", fácil de ler; `.red` pra alerta).
    **Nada de anotação azul em letra à mão** (ele achou difícil de ler);
  - **botões aprovados, usar sempre que couber:** tela simulada `.form` (E-mail + `.ui ghost` Entrar + `.ui gold`),
    antes → depois `.antes-depois` (`.ui red x` riscado → `.ui gold`, rótulos `.rot` à mão), botão final `.seguir`;
  - lista de erros `ul.lista`; riscado `.x`.
- Máximo por slide: título + 2 ou 3 parágrafos curtos (ou 1 tela/botão) + a frase-gancho. **Nada espalhado pela tela.**
- **Leitura no celular:** os tamanhos do `base.css` já são os mínimos (texto 46px, frase-gancho 47px, títulos 104px com
  traço engrossado). Não diminuir; se não couber, cortar texto ou dividir em dois slides.
- Luz sutil atrás do bloco variando: padrão (dourada), `luz-azul`, `luz-vermelha` (só no slide de problema/alerta).
- Cores: preto, branco, dourado, azul; vermelho só em alerta. Sem rosto dele, sem emoji nas artes.

## Fontes (combinações que ele mandou em 05/10)

- **Uma combinação por carrossel**, com a classe no `<body>` do `carrossel.html`. Alternar entre os dias e não repetir a
  do dia anterior. Anotar na `legenda.md` qual foi usada. A capa "post do X" não muda.
- Classes: sem classe = padrão aprovado (Instrument Serif + Inter) · `f-playfair` (Playfair + Montserrat) ·
  `f-playfair-cond` (Playfair + Roboto Condensed) · `f-spartan` (League Spartan + Open Sans) · `f-poppins` (Poppins + Inter) ·
  `f-peace` (Peace Sans + Montserrat) · `f-bebas` (Bebas Neue, no lugar da Extenda) · `f-gloock` (Gloock, no lugar da Chloe) ·
  `f-luxo` (Cormorant Garamond em caixa alta) · `f-bodoni` (Bodoni Moda).
- Combine o tema com a fonte: luxo/premium → `f-luxo`, `f-bodoni`, `f-playfair`; choque/números → `f-bebas`, `f-peace`,
  `f-spartan`; leve/moderno → `f-poppins`, `f-gloock`.
- Fonte fina só em título grande. Nunca fonte de pincel. Depois de trocar a fonte, conferir se nada estourou (render.js avisa).
- Catálogo com amostras: nota **Fontes** no Obsidian dele (`obsidian-vault`, pasta `50 Ideias e conteúdo`).

## Legenda

- 1ª linha = o gancho com a palavra-chave principal (o Instagram busca pelo texto da legenda).
- Parágrafos curtos contando a história, a lição, pergunta pra comentar, "salva e manda pra alguém",
  **"Segue @euaugusto_oliv: todo dia uma história real de negócios que quase ninguém conta."**, fonte, 5 hashtags.
- Primeiro comentário: teaser do post de amanhã ("amanhã: ... segue pra não perder").

## TikTok (mesmo carrossel, todo dia junto com a legenda do Instagram)

**Versão própria pro TikTok, todo dia** (desde 06/10: 175 views no 1º post com a versão 4:5):
- Gerar também `PWPATH=$(npm root -g)/playwright node render.js cNN-slug --tiktok` → `saida/cNN-slug-tiktok/` (1080x1920).
  O texto fica dentro da área segura (topo 230px, base 520px, direita 150px) e o render avisa se vazar.
- **Capa do TikTok é outra**: `<section class="s capa so-tt">` com no máximo 10 palavras, letra enorme (compete com vídeo
  no feed e tem que ser lida em 1 segundo). A capa "post do X" do Instagram ganha `so-ig`.
- Se um slide estiver cheio demais pro TikTok, marcar o parágrafo extra com `so-ig` (some só no TikTok).
- Enviar as duas pastas: Instagram (4:5) e TikTok (9:16).

**Extra do TikTok (2º post do dia, desde 06/10):** ele pediu 2 posts por dia no TikTok (conta nova cresce com volume).
- Pasta `tNN-slug/` (modelo: `t01-blockbuster-netflix`), **5 a 6 slides**, só TikTok: `render.js tNN-slug --tiktok`.
- Capa `s capa so-tt` com até 10 palavras, história curta e direta, último slide com seguir + pergunta pra comentar.
- Tema diferente do principal do dia e combinação de fontes diferente também.
- Horários: **extra às 13h30** (assim que chega) e **principal às 19h**. Mandar título (3 opções) + descrição do extra.

Ele posta o mesmo carrossel no TikTok (modo foto), que pede **título** e **descrição longa**:
- **Título:** 3 opções curtas (até ~90 caracteres), a 1ª pensando em busca (palavra-chave), uma com humor/sátira quando couber.
- **Descrição:** a história contada em parágrafos curtos (mais longa que a do Instagram), com as palavras-chave do tema,
  os números do carrossel, a lição, pergunta pra comentar, "manda pra alguém", **"Segue o perfil"** (sem @, porque o @ do
  TikTok pode ser outro), teaser do próximo post, fonte e 5 hashtags.
- Música: no TikTok, colocar pela biblioteca do app. Conta comercial só tem a Biblioteca de Músicas Comerciais.

## Horário de postagem

**19h, todo dia** (dentro do pico de 18h às 21h no Brasil). Mesmo horário todo dia cria hábito no público.
Depois de 2 a 3 semanas, pedir pra ele o print de **Insights > Público > Horários mais ativos** e ajustar.

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
- 05/10: manter os botões (Seguir, antes/depois Cadastrar → Continuar, tela de login). Trocar os textos azuis à mão
  por algo mais fácil de ler (virou a frase-gancho em Inter negrito dourado).
- 05/10: tirar a fonte de marcador do marca-texto ("TODO DIA"): não combinava e era difícil de ler. Agora é Inter forte.
- 05/10: aumentar fonte/grossura pra ler no celular (feito no base.css). A Inter maiúscula no marca-texto também não agradou:
  agora o marca-texto usa a serifada dos títulos em itálico.
- 05/10: mandou prints de fontes do Instagram pra usar nas próximas como eu preferir (e nos sites). Viraram as combinações acima.
- 04/10 (noite): vai postar o c01 na segunda 05/10. Segunda é só pesquisa de retenção (sem mandar nada). A partir de 06/10, artes prontas todo dia às 13h.
- 05/10: mandar todo dia também o título e a descrição do TikTok (ele posta o mesmo carrossel lá). Posts programados pras 19h.
- 06/10: TikTok com poucas views. Agora vai uma versão 9:16 própria, com capa curta e letra enorme. Pedir os números do TikTok (tempo médio, % que viu tudo, origem) pra ajustar.
- 06/10: 2 posts por dia no TikTok. Extra (tNN, 5 a 6 slides) às 13h30 + principal às 19h.
- 06/10: mudou pro MODELO VIRAL (os posts antigos dele nesse estilo tiveram 150 mil e 229 mil views). Fundo preto amassado, boneco branco, título gigante. Teste: v00-teste-modelo.
- 09/10: os assuntos (Kodak, pixels, preço com 9, 50 ms) não interessaram: TikTok segue abaixo de 200 views. Trocar
  "história de empresa" por assunto do dia a dia com identificação (o "você" na capa, situação que todo mundo vive,
  opinião polêmica, humor). Perguntado a ele: sobre o que eram os 2 posts de 150 mil e 229 mil views (usar como molde).
- 09/10: Instagram = publicação de carrossel no feed (com música), não Reels.
- 09/10: Instagram passa pro modelo post do X escuro (referência: print do CarrosseIA, mas fundo escuro) e vermelho mais vivo (#FF1F2E, também no viral.css). TikTok segue no viral.
- 09/10: título maior (98/112px), selo de verificado depois do nome e foto do perfil no avatar.
