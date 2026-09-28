# Gabriel Augusto — site de vendas

Landing page para vender criação de sites. HTML, CSS e JavaScript puro, sem bibliotecas.

## Publicar
- `dist/index.html` → o site inteiro em **um único arquivo HTML** (abre com dois cliques).
- `gabriel-augusto-site.zip` → pacote para subir na hospedagem (Hostinger: extraia em `public_html`; Netlify/Vercel: arraste a pasta `dist/`).
- Depois de editar qualquer arquivo, rode `python3 build.py` para gerar `dist/` e o zip de novo.

## Onde editar
| O quê | Onde |
|---|---|
| **Link do WhatsApp**, mensagem padrão, e-mail, Instagram, preços | `assets/js/config.js` |
| Textos | `index.html` |
| Cores e fontes | topo de `assets/css/styles.css` (`:root`) |
| Fotos | `assets/img/gabriel-sobre.webp` (seção Sobre, 560×700) e `gabriel-avatar.webp` (avatar no topo e no fechamento, 160×160) |
| Domínio | `<link rel="canonical">` e `og:image` no `<head>` (use a URL completa depois de publicar) |

Enquanto o WhatsApp estiver vazio, os botões levam para a seção final. E-mail e Instagram só aparecem quando preenchidos.

## Interações
- Título do topo revelado palavra por palavra
- Mockup de navegador que "constrói" um site e termina numa mensagem de WhatsApp (pausa fora da tela)
- Luz azul que segue o cursor e leve inclinação 3D do mockup
- Botões magnéticos, brilho nos cards sob o cursor
- Linha do processo que se desenha com a rolagem
- Calculadora do plano Essencial (+ vídeo), com sugestão do Premium e mensagem de WhatsApp personalizada
- Métricas reais medidas no aparelho do visitante (tempo de carregamento e tipo de tela)
- Barra de progresso de leitura, barra fixa de ação no celular, FAQ animado
- Tudo respeita `prefers-reduced-motion`

## Rastreamento
Cliques no WhatsApp disparam `whatsapp_click` no `dataLayer` (GTM), `generate_lead` (GA4) e `Contact` (Meta Pixel), se instalados.
