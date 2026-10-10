# Projetos do Gabriel Augusto (@euaugusto_oliv)

Quem pede: Gabriel Augusto de Oliveira, Goiânia/GO. Vende sites para profissionais.
Contato: WhatsApp 5562982595333 · Instagram @august0_oliv · augustooliv940@gmail.com.
Planos: Essencial R$ 300 (2 revisões, 2 a 7 dias, edição de vídeo opcional +R$ 38) · Premium Page R$ 500 (domínio seunome.com.br + vídeo na página inclusos, até 5 revisões, 2 a 5 dias). O site é feito pra convencer a comprar o Premium.
Responder em português brasileiro informal, direto. Branch de trabalho: `claude/professional-premium-website-q2yp97`.

## Vídeos curtos diários (`gabriel-augusto/shorts/`)

**Modelo aprovado: `roteiros/v02-instagram.json` (cópia em `roteiros/MODELO.json`). Não mudar o estilo sem ele pedir.**

Fluxo: ele manda tema + roteiro/falas → eu monto `roteiros/vNN-tema.json` no formato do modelo → renderizo → envio o mp4 + `roteiros/vNN-tema-texto.md` (texto numerado pra ele narrar + legenda do post). Quando ele mandar o áudio (wav/mp4 do WhatsApp): `cd ferramentas && python3 gerar.py ../roteiros/vNN.json voz.mp4 [cortes.json]`. O gerador já trata a voz (redução de ruído, EQ, compressor). Se ele não pausar 3 s entre as partes ou repetir takes, transcrever com whisper-base (npm `sts-whisper-base` + `@huggingface/transformers --ignore-scripts`) e montar `roteiros/vNN-cortes.json` com [ini, fim] de cada parte (usar o último take).

Regras fixas:
- Nunca mostrar o rosto dele. Bonecos stickman originais (poses do motor), nada do Canva.
- Fundo `"auras"`: preto com iluminação azul e dourada. Cores: preto, branco, dourado, azul (vermelho só para alerta).
- Legenda karaokê clara na tela + título com marcas (`*dourado*`, `_azul_`, `~vermelho~`, `#caixa#`).
- Títulos só com balanço lento e suave. Nada tremendo rápido (poluição visual). Usar `"fx": "zoom"` ou `"flash"`; `"tremer"` hoje é só um zoom suave.
- Transições entre cenas; só efeitos sonoros, sem música de fundo.
- **Motion graphics sempre ligado** (pedido dele em 10/10, referência: Reel do @ofernandorank com motion graphics em fluxo contínuo): câmera nunca para (push-in + deriva), anéis girando com pontos em órbita, pulso atrás da cena, ícones de vidro flutuando nas bordas (`"mg": ["chat","sino","check","coracao","estrela","lupa","cursor","pin"]` por cena, ou `false` pra desligar), títulos entram com desfoque, cards balançando, anel de progresso no `passo`, notificações saindo do celular. Prévia rápida sem voz: `python3 prever.py ../roteiros/vNN.json` → /tmp/previa_vNN.jpg.
- **Nada parado** (pedido dele em 10/10): título mais baixo (top 390, 120px), boneco principal sempre gesticulando/balançando (`"parado": true` desliga), e **primeiro plano**: boneco reator no canto trocando de reação a cada ~1,4 s com balão (`"reacao": {"lado":"esq|dir","poses":[...]}` ou `false`) + estrelinhas/impactos pipocando.
- Voz: a dele gravada (Kokoro é só voz guia enquanto ele não manda).
- **Direção definida por ele em 10/10: conteúdo ÚTIL DE VERDADE, que ajude a pessoa e a faça parar de rolar, sempre ligado ao trabalho dele** (WhatsApp Business, Instagram/bio, Google/Perfil da Empresa, site, fotos, atendimento, golpes online, design/logo). Dica que dá pra aplicar na hora: "configura isso hoje", "3 erros", "como fazer X em 1 minuto". Gancho com promessa clara + uma surpresa ("a última quase ninguém usa"). O trabalho dele entra natural, como prova ("eu coloco isso em todo site que eu faço"), nunca como anúncio.
- Reprovados em 10/10 (não repetir): curiosidade fora do nicho ("você é mais alto de manhã", "grupo da família"), humor sem utilidade ("5 tipos de cliente"), gancho genérico de anúncio ("tem gente pior que você vendendo mais", "melancia"), arte que fala de algo visual sem mostrar (logo sem logo).
- O que é fixo é só o visual (bonecos, fundo "auras", legenda karaokê, títulos com marcas, transições). Estrutura e props variam. Final: "salva pra depois" + "segue pra mais". Preço/link da bio só em vídeo de venda (quando ele pedir ou 1x por semana).
- Não inventar dados, depoimentos ou números.
- Capa: `python3 capa.py ../roteiros/vNN.json` → `saida/vNN-capa.jpg` (1ª cena + chave "capa" no roteiro: texto, tamanho, selo com a pergunta do gancho, selo_y). Tudo dentro do recorte 3:4 da grade.
- Renderização: ~7 min, 4 processos em paralelo. Manter o mp4 abaixo de 30 MB. Não apagar /tmp/short_* durante render.

## Artes estáticas (stories/destaques)

`gabriel-augusto/destaques/stories/stories.html` + `render.js` → `saida/*.jpg` (1080x1920). Ele prefere artes estilo Canva a vídeos nos destaques. **Tema sempre escuro, com variações sutis entre artes** (bg-aura, bg-ink, bg-blue, bg-grid, bg-gold, bg-beam, marca d'água discreta). Nada de fundo claro/creme; não variar totalmente e usar **detalhes em vermelho** (etiquetas, sublinhados, pontos) junto com preto/dourado/azul/branco.

## Carrossel diário do feed (`gabriel-augusto/carrosseis/`)

Uma rotina agendada dispara todo dia às 11h50 (Goiânia) e eu entrego até as 13h o **pacote diário**: 1 vídeo curto (modelo dos shorts, 18h), 1 carrossel do Instagram (modelo post do X escuro, `x.css`, 19h) e 1 arte do TikTok (modelo viral, 13h30), com legendas. Objetivo: seguidores de todas as áreas. Seguir `carrosseis/GUIA.md` (seção PACOTE DIÁRIO, modelos, ajustes que ele pediu) e `carrosseis/PAUTA.md`. Modelos atuais: `x00-teste` (Instagram) e `v00-teste-modelo` (TikTok).

## Sites para clientes

Clientes ficam em `clientes/<nome>/` (ex.: `clientes/renato-sericaku/`). Material de portfólio de cada um: `midia/` (capturas + artes feed/story via `artes.html`) e vídeo `shorts/roteiros/portfolio-<nome>.json` (props `site_desktop` + `site_celular` com `continua`, `y`, `escala`).

**Fontes (pedido dele em 05/10):** usar nos próximos sites a biblioteca de `gabriel-augusto/carrosseis/fontes/` (todas OFL). As combinações estão no fim de `carrosseis/base.css` e na nota **Fontes** do Obsidian (`obsidian-vault/50 Ideias e conteúdo/Fontes.md`). Escolher a que combina com o cliente, copiar os `.woff2` para `assets/fonts/` do site; texto corrido sempre em fonte firme (Inter, Montserrat, Open Sans ou Roboto Condensed), fonte fina só em título grande.

Base de referência: `gabriel-augusto/` (site dele) e a raiz (site ICL Saúde): HTML/CSS/JS estático, `config.js` com os dados, `build.py` gera `dist/index.html` único + zip. Estética premium, minimalista, conversiva, fotos leves, botões de WhatsApp com mensagem automática. Usar só dados reais do cliente; o que faltar vira marcador para ele preencher.
