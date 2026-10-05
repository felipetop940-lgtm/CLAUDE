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
- Voz: a dele gravada (Kokoro é só voz guia enquanto ele não manda).
- Toda vez: gancho polêmico no início, pergunta pra gerar comentário (prop `enquete`), prova (`site_celular` com site real), preço (`preco`, a partir de R$ 300) e CTA final pro perfil/link da bio (`cta`).
- Não inventar dados, depoimentos ou números.
- Capa: `python3 capa.py ../roteiros/vNN.json` → `saida/vNN-capa.jpg` (1ª cena + chave "capa" no roteiro: texto, tamanho, selo com a pergunta do gancho, selo_y). Tudo dentro do recorte 3:4 da grade.
- Renderização: ~7 min, 4 processos em paralelo. Manter o mp4 abaixo de 30 MB. Não apagar /tmp/short_* durante render.

## Artes estáticas (stories/destaques)

`gabriel-augusto/destaques/stories/stories.html` + `render.js` → `saida/*.jpg` (1080x1920). Ele prefere artes estilo Canva a vídeos nos destaques. **Tema sempre escuro, com variações sutis entre artes** (bg-aura, bg-ink, bg-blue, bg-grid, bg-gold, bg-beam, marca d'água discreta). Nada de fundo claro/creme; não variar totalmente e usar **detalhes em vermelho** (etiquetas, sublinhados, pontos) junto com preto/dourado/azul/branco.

## Carrossel diário do feed (`gabriel-augusto/carrosseis/`)

Uma rotina agendada dispara todo dia às 6h59 (Goiânia) e eu entrego um carrossel viral pronto (1080x1350 + legenda + horário de postagem). Objetivo: seguidores de todas as áreas. Seguir `carrosseis/GUIA.md` (pesquisa do dia, fórmula viral, visual aprovado: capa post do X escuro + bloco de texto com letras do caderno, ajustes que ele pediu) e `carrosseis/PAUTA.md`. Modelo atual: `c01-botao-300-milhoes`.

## Sites para clientes

Clientes ficam em `clientes/<nome>/` (ex.: `clientes/renato-sericaku/`). Material de portfólio de cada um: `midia/` (capturas + artes feed/story via `artes.html`) e vídeo `shorts/roteiros/portfolio-<nome>.json` (props `site_desktop` + `site_celular` com `continua`, `y`, `escala`).

Base de referência: `gabriel-augusto/` (site dele) e a raiz (site ICL Saúde): HTML/CSS/JS estático, `config.js` com os dados, `build.py` gera `dist/index.html` único + zip. Estética premium, minimalista, conversiva, fotos leves, botões de WhatsApp com mensagem automática. Usar só dados reais do cliente; o que faltar vira marcador para ele preencher.
