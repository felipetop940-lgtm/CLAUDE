/* =========================================================
   Dados editáveis da loja. Troque aqui e o site inteiro atualiza.
   Campos vazios ("") ficam ocultos. Os produtos ficam em produtos.js.
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

  // Funcionamento: dias abertos (0 = domingo … 6 = sábado). Quarta (3) fechada.
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

  // Cor das bolinhas do filtro "Por cor" (nome igual ao campo "cor" do produto). Cor sem código aqui aparece em bege.
  coresHex: {
    "Preto": "#1F1D1C", "Chocolate": "#4B3026", "Marrom": "#7A5236", "Off-white": "#F1EBDD", "Branco": "#FFFFFF",
    "Branco e preto": "linear-gradient(135deg, #FFFFFF 50%, #1F1D1C 50%)", "Bege": "#D9C3A5", "Nude": "#D8B49A",
    "Azul": "#6E9CB1", "Azul-marinho": "#25344A", "Verde": "#6F7A4E", "Verde-oliva": "#6B6B3E", "Vermelho": "#A23B32",
    "Rosa": "#E3A7A6", "Terracota": "#B8623F", "Amarelo": "#E2C25B", "Laranja": "#D9813F", "Lilás": "#B7A3C9",
    "Estampado": "linear-gradient(135deg, #6E9CB1, #E3A7A6 50%, #E2C25B)"
  },

  // Faixas do filtro de preço (só aparece quando houver preço cadastrado)
  faixasPreco: [150, 250, 350],

  // Quantas peças aparecem em destaque na página principal (as de "destaque" menor primeiro)
  destaquesNaHome: 5,
  // Peças por "página" no catálogo (depois aparece o botão "Ver mais")
  porPagina: 24
};
