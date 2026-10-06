/* =========================================================
   CATÁLOGO DA ELLA
   Cada bloco { … } é uma peça. Para incluir uma nova: copie um bloco,
   troque os campos e coloque a foto em assets/img/produtos/.
   (As fotos de story podem passar antes por: python3 ferramentas/fotos.py)

   Campos
   - id ............ identificador único, sem espaço (vira o link da peça: site.com/#produto/id)
   - codigo ........ código/referência da loja (aparece no card e entra na busca). "" = oculto
   - nome .......... nome que aparece no site
   - categoria ..... Biquínis, Maiôs, Saídas de praia, Acessórios…
   - modelo ........ modelo do top (Meia-taça, Triângulo, Tomara que caia, Cortininha…)
   - calcinha ...... modelo da calcinha (Cavada, Tanga, Asa delta, Fio, Hot pants…)
   - cor, estampa .. viram filtros automaticamente (estampa: Lisa, Poá, Texturizada…)
   - detalhes ...... lista de detalhes que também viram filtro (Pérolas, Bojo, Dourado…)
   - destaque ...... número = aparece na página principal, na ordem (1 primeiro). 0 = só no catálogo
   - novo .......... true = etiqueta "Novo"
   - esgotado ...... true = continua no catálogo, mas sem botão de compra
   - tamanhos ...... [] = usa os tamanhos padrão do config.js
   - preco / precoTop / precoCalcinha ... null = "Consulte o valor"
   - fotos ......... a 1ª é a capa; as outras viram a galeria da peça
   - fotoModelo .... foto vestida (opcional): troca no hover e ativa o botão "Peça | Modelo"

   Nomes e descrições abaixo foram escritos a partir das fotos. [CONFIRMAR COM A LOJA]
   ========================================================= */
window.PRODUTOS = [
  {
    id: "poa-meia-taca",
    codigo: "",
    nome: "Biquíni Poá Meia-Taça",
    categoria: "Biquínis",
    modelo: "Meia-taça",
    calcinha: "Cavada",
    cor: "Branco e preto",
    estampa: "Poá",
    detalhes: ["Bojo", "Amarração no pescoço"],
    destaque: 1,
    novo: true,
    esgotado: false,
    tamanhos: [],
    preco: null, precoTop: null, precoCalcinha: null,
    descricao: "Top meia-taça com bojo e amarração no pescoço, estampa poá preto e branco. Calcinha cavada.",
    fotos: ["assets/img/produtos/poa-meia-taca.webp"],
    fotoModelo: ""
  },
  {
    id: "tomara-que-caia-perolas-chocolate",
    codigo: "",
    nome: "Biquíni Tomara que Caia Pérolas Chocolate",
    categoria: "Biquínis",
    modelo: "Tomara que caia",
    calcinha: "Tanga",
    cor: "Chocolate",
    estampa: "Lisa",
    detalhes: ["Pérolas", "Amarração", "Brilho"],
    destaque: 2,
    novo: true,
    esgotado: false,
    tamanhos: [],
    preco: null, precoTop: null, precoCalcinha: null,
    descricao: "Top tomara que caia com amarração e pérolas aplicadas. Calcinha com pérolas nas laterais. Tecido com leve brilho.",
    fotos: ["assets/img/produtos/tomara-que-caia-perolas-chocolate.webp"],
    fotoModelo: ""
  },
  {
    id: "meia-taca-pedra-preto",
    codigo: "",
    nome: "Biquíni Meia-Taça Pedra Preto",
    categoria: "Biquínis",
    modelo: "Meia-taça",
    calcinha: "Cavada",
    cor: "Preto",
    estampa: "Lisa",
    detalhes: ["Bojo", "Pedra"],
    destaque: 3,
    novo: true,
    esgotado: false,
    tamanhos: [],
    preco: null, precoTop: null, precoCalcinha: null,
    descricao: "Top meia-taça com bojo, alças largas e pedra perolada no centro. Calcinha cavada.",
    fotos: ["assets/img/produtos/meia-taca-pedra-preto.webp"],
    fotoModelo: ""
  },
  {
    id: "triangulo-texturizado-off-white",
    codigo: "",
    nome: "Biquíni Triângulo Texturizado Off-White",
    categoria: "Biquínis",
    modelo: "Triângulo",
    calcinha: "Cavada",
    cor: "Off-white",
    estampa: "Texturizada",
    detalhes: ["Dourado", "Amarração"],
    destaque: 4,
    novo: true,
    esgotado: false,
    tamanhos: [],
    preco: null, precoTop: null, precoCalcinha: null,
    descricao: "Top triângulo de amarrar, com textura em relevo e detalhes dourados. Calcinha cavada na mesma textura.",
    fotos: ["assets/img/produtos/triangulo-texturizado-off-white.webp"],
    fotoModelo: ""
  },
  {
    id: "meia-taca-drapeado-off-white",
    codigo: "",
    nome: "Biquíni Meia-Taça Drapeado Off-White",
    categoria: "Biquínis",
    modelo: "Meia-taça",
    calcinha: "Cavada",
    cor: "Off-white",
    estampa: "Lisa",
    detalhes: ["Bojo", "Drapeado", "Dourado"],
    destaque: 5,
    novo: true,
    esgotado: false,
    tamanhos: [],
    preco: null, precoTop: null, precoCalcinha: null,
    descricao: "Top meia-taça com bojo, drapeado na frente e detalhe dourado no centro. Calcinha cavada.",
    fotos: ["assets/img/produtos/meia-taca-drapeado-off-white.webp"],
    fotoModelo: ""
  }
];
