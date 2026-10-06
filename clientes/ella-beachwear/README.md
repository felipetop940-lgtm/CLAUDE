# Site da Ella Beachwear (Olímpia-SP)

Loja de biquínis com chão de areia. Site estático: página principal + catálogo com filtros, sacola que fecha o pedido no WhatsApp.

| Arquivo | O que é |
|---|---|
| `assets/js/produtos.js` | **Catálogo**: uma peça por bloco (nome, modelo, cor, destaque, preço, fotos) |
| `assets/js/config.js` | Dados da loja: WhatsApp, endereço, horário, tamanhos, cores dos filtros |
| `ferramentas/fotos.py` | Recorta print de story/foto em 3:4 e gera o bloco para colar no catálogo |
| `build.py` | Gera `dist/` + `ella-beachwear-site.zip` (hospedagem) e `preview-ella.html` (prévia num arquivo só) |

## Novas peças

1. `python3 ferramentas/fotos.py pasta/*.jpeg` → fotos em `assets/img/produtos/` + blocos prontos no terminal
2. Cole os blocos em `produtos.js` e preencha nome, modelo, calcinha, cor, estampa e detalhes (viram filtros sozinhos)
3. `destaque: 1, 2, 3…` coloca a peça na página principal, nessa ordem (a 1 fica grande). `0` = só no catálogo
4. `python3 build.py`

## Links úteis

- Catálogo filtrado: `site.com.br/#catalogo?cor=Preto` · `#catalogo?modelo=Meia-taça` · `#catalogo?q=pérolas`
- Peça direto: `site.com.br/#produto/<id>` (botão "Copiar link desta peça" na janela do produto)

Fontes: Bodoni Moda (títulos) + Montserrat (textos), da biblioteca de fontes do Obsidian. Paleta: bege areia + azul da logo.
