/* =========================================================
   Dados editáveis da loja. Troque aqui e o site inteiro atualiza.
   Campos vazios ("") ou null ficam ocultos.
   ========================================================= */
window.SITE = {
  nome: "Ella Beachwear",
  slogan: "Made for you",

  // WhatsApp com DDI + DDD, só números (é para onde vão os pedidos da sacola)
  whatsapp: "5517996488309",
  instagram: "ellabeachwearr", // sem @

  endereco: {
    rua: "Av. Aurora Forti Neves, 632 · Loja 3",
    cidade: "Olímpia · SP",
    mapa: "https://www.google.com/maps/search/?api=1&query=Av.+Aurora+Forti+Neves%2C+632+Ol%C3%ADmpia+SP"
  },

  // Funcionamento: dias da semana abertos (0 = domingo … 6 = sábado). Quarta (3) fechada.
  horario: {
    dias: [0, 1, 2, 4, 5, 6],
    abre: 9,
    fecha: 22,
    texto: "Quinta a terça, das 9h às 22h",
    folga: "Fechado às quartas"
  },

  entrega: "Entrega grátis em Olímpia",

  // Opcionais (vazio = oculto no site)
  pagamento: "", // Ex.: "Pix, cartão de crédito e débito"  [FORMAS DE PAGAMENTO]
  trocas: "",    // Ex.: "Trocas em até 7 dias com etiqueta"  [POLÍTICA DE TROCA]
  cnpj: "",      // [CNPJ]

  mensagens: {
    padrao: "Olá, Ella! Vim pelo site e quero ver os biquínis disponíveis.",
    tamanho: "Olá, Ella! Vim pelo site e queria ajuda para escolher meu tamanho.",
    loja: "Olá, Ella! Vim pelo site e queria saber como chegar na loja."
  },

  // Tamanhos padrão das peças [CONFIRMAR COM A LOJA]. Cada produto pode ter os seus em "tamanhos".
  tamanhos: ["P", "M", "G"],

  // Biquíni vendido também por peça (só o top / só a calcinha), como na Vix. false = só conjunto. [CONFIRMAR]
  pecasSeparadas: true,

  /* ---------------------------------------------------------
     PRODUTOS
     - nome e descrição abaixo foram escritos a partir das fotos: trocar pelo nome oficial da peça.
     - preços: deixe null para mostrar "Consulte o valor". Para biquíni dá para usar
       precoTop + precoCalcinha (vendidos separados, como na Vix) ou só "preco" (conjunto).
     - foto2: foto com modelo (opcional). Se algum produto tiver, aparece o botão
       "Peça | Modelo" na vitrine e a foto troca ao passar o mouse.
     - tag: etiqueta no canto da foto ("Novidade", "Últimas peças"…). "" = sem etiqueta.
     --------------------------------------------------------- */
  produtos: [
    {
      id: "meia-taca-pedra-preto",
      nome: "Biquíni Meia-Taça Pedra Preto",
      categoria: "Biquínis",
      modelo: "Meia-taça",
      cor: "Preto",
      tipo: "biquini",
      tag: "Novidade",
      preco: null, precoTop: null, precoCalcinha: null,
      descricao: "Top meia-taça com bojo, alças largas e pedra perolada no centro. Calcinha cavada.",
      foto: "assets/img/produtos/meia-taca-pedra-preto.webp",
      foto2: ""
    },
    {
      id: "tomara-que-caia-perolas-chocolate",
      nome: "Biquíni Tomara que Caia Pérolas Chocolate",
      categoria: "Biquínis",
      modelo: "Tomara que caia",
      cor: "Chocolate",
      tipo: "biquini",
      tag: "Novidade",
      preco: null, precoTop: null, precoCalcinha: null,
      descricao: "Top tomara que caia com amarração e pérolas aplicadas. Calcinha com pérolas nas laterais. Tecido com leve brilho.",
      foto: "assets/img/produtos/tomara-que-caia-perolas-chocolate.webp",
      foto2: ""
    },
    {
      id: "poa-meia-taca",
      nome: "Biquíni Poá Meia-Taça",
      categoria: "Biquínis",
      modelo: "Meia-taça",
      cor: "Poá",
      tipo: "biquini",
      tag: "Novidade",
      preco: null, precoTop: null, precoCalcinha: null,
      descricao: "Top meia-taça com bojo e amarração no pescoço, estampa poá preto e branco. Calcinha cavada.",
      foto: "assets/img/produtos/poa-meia-taca.webp",
      foto2: ""
    },
    {
      id: "triangulo-texturizado-off-white",
      nome: "Biquíni Triângulo Texturizado Off-White",
      categoria: "Biquínis",
      modelo: "Triângulo",
      cor: "Off-white",
      tipo: "biquini",
      tag: "Novidade",
      preco: null, precoTop: null, precoCalcinha: null,
      descricao: "Top triângulo de amarrar, com textura em relevo e detalhes dourados. Calcinha cavada na mesma textura.",
      foto: "assets/img/produtos/triangulo-texturizado-off-white.webp",
      foto2: ""
    },
    {
      id: "meia-taca-drapeado-off-white",
      nome: "Biquíni Meia-Taça Drapeado Off-White",
      categoria: "Biquínis",
      modelo: "Meia-taça",
      cor: "Off-white",
      tipo: "biquini",
      tag: "Novidade",
      preco: null, precoTop: null, precoCalcinha: null,
      descricao: "Top meia-taça com bojo, drapeado na frente e detalhe dourado no centro. Calcinha cavada.",
      foto: "assets/img/produtos/meia-taca-drapeado-off-white.webp",
      foto2: ""
    }
  ]
};
