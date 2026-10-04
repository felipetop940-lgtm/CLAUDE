/* =========================================================
   Dados editáveis do site. Troque aqui e o site inteiro atualiza.
   Campos vazios ("") ficam ocultos.
   ========================================================= */
window.SITE = {
  nome: "Dr. Renato Nishigaki",

  // WhatsApp com DDI + DDD, só números. Ex.: "5562999999999"
  whatsapp: "", // [WHATSAPP DO DR. RENATO]
  // Ou cole aqui o link pronto do WhatsApp (wa.me, api.whatsapp, link de agenda…). Se preenchido, tem prioridade.
  whatsappLink: "", // [LINK DO WHATSAPP]

  instagram: "", // Ex.: "drrenatosericaku" (sem @)  [INSTAGRAM]
  email: "",     // [E-MAIL]
  telefone: "",  // Ex.: "(62) 3000-0000"  [TELEFONE]

  endereco: {
    local: "Med Center Especialidades Médicas",
    rua: "R. Vinte e Dois, 250",
    cidade: "Goiânia · GO",
    cep: "74920-782",
    mapa: "https://www.google.com/maps/search/?api=1&query=Med+Center+Especialidades+M%C3%A9dicas+R.+Vinte+e+Dois+250+Goi%C3%A2nia+GO+74920-782"
  },

  horario: "", // Ex.: "Segunda a sexta, 8h às 18h"  [HORÁRIO DE ATENDIMENTO]

  // Registros profissionais (obrigatórios na divulgação em saúde)
  registros: "CRO-GO [NÚMERO] · CRM-GO [NÚMERO]",

  // Mensagens automáticas do WhatsApp
  mensagens: {
    padrao: "Olá, Dr. Renato! Vim pelo site e gostaria de agendar uma avaliação.",
    siso: "Olá, Dr. Renato! Vim pelo site e gostaria de uma avaliação para extração de siso.",
    inclusos: "Olá, Dr. Renato! Vim pelo site e gostaria de uma avaliação sobre dente incluso.",
    complexa: "Olá, Dr. Renato! Vim pelo site e gostaria de uma avaliação para uma extração.",
    implante: "Olá, Dr. Renato! Vim pelo site e gostaria de saber sobre implantes dentários.",
    enxerto: "Olá, Dr. Renato! Vim pelo site e gostaria de saber sobre enxerto e reconstrução óssea.",
    face: "Olá, Dr. Renato! Vim pelo site e gostaria de saber sobre cirurgia bucomaxilofacial."
  },

  // Depoimentos reais de pacientes (com autorização). Vazio = seção oculta.
  // Ex.: { texto: "…", nome: "Maria S.", detalhe: "Extração de sisos" }
  depoimentos: []
};
