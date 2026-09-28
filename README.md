# ICL Saúde: site institucional

Landing page de conversão da ICL Saúde (Dr. Ítalo Cardoso de Lima, CRM-GO 35190).
É um site estático em HTML, CSS e JavaScript puro, sem framework e sem dependências.

```
index.html              → estrutura e textos (SEO: todo o texto fica no HTML)
assets/css/styles.css   → estilos; no topo ficam os tokens de cor, fonte e espaçamento
assets/js/config.js     → WhatsApp, e-mail, endereço, redes e links (edite aqui)
assets/js/main.js       → menu, animações, comparador antes/depois e rastreamento
assets/img/             → imagens (hoje são placeholders .svg)
assets/fonts/           → Inter + Instrument Serif auto-hospedadas (licença OFL)
```

## Versão de publicação (pronta pra subir)

- `dist/index.html` é o site inteiro num único arquivo HTML, com CSS, JS, fontes e imagens embutidos. Abre com dois cliques, sem servidor.
- `icl-saude-site.zip` traz o pacote completo: `index.html`, política de privacidade, `robots.txt`, `sitemap.xml`, favicon e imagem de compartilhamento.

**Pra publicar:** extraia o zip na raiz do domínio (`public_html` na Hostinger) ou arraste a pasta `dist/` na Netlify ou na Vercel.

**Depois de editar qualquer arquivo:** rode `python3 build.py` pra gerar `dist/` e o zip de novo.

Itens sem dado no `config.js` (e-mail, endereço, horário, Instagram) ficam ocultos automaticamente. O visitante nunca vê placeholder.

## Testar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Onde editar cada coisa

| O quê | Onde |
|---|---|
| WhatsApp, mensagem padrão, e-mail, endereço, horário, Instagram, mapa | `assets/js/config.js` |
| Textos, títulos, serviços, etapas | `index.html` (cada seção é marcada com um comentário `=====`) |
| Cores e fontes | `:root` no topo de `assets/css/styles.css` |
| Mensagem de WhatsApp por botão | atributo `data-wa="..."` no próprio botão |

No `config.js`, campo preenchido aparece no site e campo vazio (`""`) fica oculto.

## Imagens pra trocar

Exporte em **WebP** (qualidade 75–80), troque o `src` no `index.html` e mantenha `width`/`height`.
No retrato do hero, atualize também o `<link rel="preload" as="image">` no `<head>`.

| Arquivo atual | Trocar por | Tamanho |
|---|---|---|
| `hero-portrait.svg` (arte provisória) | Dr. Ítalo de terno, fundo escuro, e ajustar o `alt` | 800×1000 |
| `about-photo.svg` (arte provisória) | Dr. Ítalo de jaleco, e ajustar o `alt` | 800×1000 |
| `social-1..3.svg` | prints de posts do Instagram | 600×600 |
| `og-image.jpg` | já gerada; pode trocar por uma com a foto | 1200×630 |
| Logo | trocar o bloco `.brand` no header e no footer por `<img src="assets/img/logo.svg">` | SVG |

## Placeholders pendentes

- [ ] Fotos (tabela acima) e logo oficial em SVG
- [ ] E-mail, endereço, horário (`config.js`)
- [ ] Instagram: `instagramHandle` e `instagramUrl` (`config.js`)
- [ ] Mapa: `mapsEmbedUrl` e `mapsLink` (`config.js`)
- [ ] Depoimentos reais e antes/depois autorizado: os blocos prontos estão no `<template id="modelo-resultados">` (seção Resultados)
- [ ] Rodapé: RQE (se houver) e CNPJ (há um comentário marcando o lugar)
- [ ] Validar com o cliente as 5 etapas de "Como funciona"
- [ ] Atualizar nota e número de avaliações do Doctoralia (hoje 5,0 e 61, set/2026)

## Rastreamento de conversão

Todo clique em botão de WhatsApp dispara:
- `dataLayer.push({ event: 'whatsapp_click', cta_location: '<seção>' })`, para o GTM
- `gtag('event', 'generate_lead', …)`, se o GA4 estiver instalado direto
- `fbq('track', 'Contact', …)`, se o Meta Pixel estiver instalado

Basta colar o snippet do GTM ou do Pixel no `<head>`. O `cta_location` mostra de qual seção veio o clique (hero, resultados, servicos, contato, botao_flutuante…).

## Pontos de atenção (publicidade médica)

- O site atual usa "especialista". Só pode aparecer com RQE, e por isso esta versão não usa o termo.
- Antes/depois e depoimentos só com autorização do paciente e sem promessa de resultado (Res. CFM 2.336/2023).
- Reposição hormonal sempre associada à indicação clínica, nunca a estética ou performance (Res. CFM 2.333/2023).
- Confirmar como divulgar o valor da avaliação e a pós-graduação lato sensu segundo a Res. 2.336/2023.

## Publicação

É só subir os arquivos em qualquer hospedagem estática (Hostinger, Netlify, Vercel, Cloudflare Pages) ou na raiz do domínio atual.
As calculadoras apontam para as páginas que já existem em `iclsaude.com.br`. Se o WordPress for desligado, elas precisam ser migradas ou os links removidos (`config.js → tools`).
