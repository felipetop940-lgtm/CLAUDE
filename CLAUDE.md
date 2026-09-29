# Projetos do Gabriel Augusto (@euaugusto_oliv)

Quem pede: Gabriel Augusto de Oliveira, Goiânia/GO. Vende sites para profissionais.
Contato: WhatsApp 5562982595333 · Instagram @august0_oliv · augustooliv940@gmail.com.
Planos: Essencial R$ 250 (2 revisões) · Premium Page R$ 320 (R$ 70 a mais, com edição de vídeo, 5 revisões) · vídeo avulso no Essencial +R$ 38 · domínio próprio .com.br +R$ 40 (opcional nos dois) · entrega em 2 a 7 dias.
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
- Toda vez: gancho polêmico no início, pergunta pra gerar comentário (prop `enquete`), prova (`site_celular` com site real), preço (`preco`, a partir de R$ 250) e CTA final pro perfil/link da bio (`cta`).
- Não inventar dados, depoimentos ou números.
- Renderização: ~7 min, 4 processos em paralelo. Manter o mp4 abaixo de 30 MB. Não apagar /tmp/short_* durante render.

## Sites para clientes

Base de referência: `gabriel-augusto/` (site dele) e a raiz (site ICL Saúde): HTML/CSS/JS estático, `config.js` com os dados, `build.py` gera `dist/index.html` único + zip. Estética premium, minimalista, conversiva, fotos leves, botões de WhatsApp com mensagem automática. Usar só dados reais do cliente; o que faltar vira marcador para ele preencher.
