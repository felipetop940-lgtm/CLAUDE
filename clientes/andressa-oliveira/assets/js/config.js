/* =========================================================
   Dados editáveis do site. Troque aqui e o site inteiro atualiza.
   Campos vazios ("") ficam ocultos no site.
   ========================================================= */
window.SITE = {
  nome: "Dra. Andressa Oliveira",

  // Registro profissional. O CRM é obrigatório na divulgação médica (CFM).
  // O RQE só existe se ela tiver título de especialista registrado no CRM.
  crm: "CRM-GO 27293",
  rqe: "", // Ex.: "RQE 0000"       [RQE, SE TIVER]

  // WhatsApp com DDI + DDD, só números. Ex.: "5562999999999"
  whatsapp: "", // [WHATSAPP DA DRA. ANDRESSA]
  // Ou cole aqui o link pronto (wa.me, link de agenda…). Se preenchido, tem prioridade.
  whatsappLink: "https://wa.me/message/VNIH6DPHFMXOF1", // link da bio do Instagram

  instagram: "draandressanutro",
  telefone: "",  // Ex.: "(62) 3000-0000"
  email: "",

  endereco: {
    local: "",  // Ex.: "Edifício Tal, sala 101"  [ENDEREÇO DO CONSULTÓRIO]
    rua: "",    // Ex.: "Av. Tal, nº 100, Setor Bueno"
    cidade: "Goiânia · GO",
    cep: "",
    // Link do Google Maps (botão "Ver no mapa") e mapa embutido (Compartilhar > Incorporar mapa > só o link do src)
    mapa: "",
    mapaEmbed: ""
  },

  horario: "", // Ex.: "Segunda a sexta, 8h às 18h · sábado com agendamento"

  // Números reais (opcional). Vazio = mostra os pilares do atendimento no lugar.
  // Ex.: [{ valor: "+500", rotulo: "Pacientes" }, { valor: "5+", rotulo: "Anos de experiência" }]
  numeros: [],

  // Mensagens automáticas do WhatsApp (cada botão manda a sua)
  mensagens: {
    padrao: "Olá, Dra. Andressa! Vim pelo site e gostaria de agendar uma consulta.",
    resultado: "Olá, Dra. Andressa! Vi os resultados no site e quero começar o meu tratamento.",
    emagrecimento: "Olá, Dra. Andressa! Vim pelo site e gostaria de saber mais sobre o emagrecimento médico.",
    injetaveis: "Olá, Dra. Andressa! Vim pelo site e gostaria de saber mais sobre as terapias injetáveis.",
    performance: "Olá, Dra. Andressa! Vim pelo site e gostaria de saber mais sobre performance e energia.",
    metabolica: "Olá, Dra. Andressa! Vim pelo site e gostaria de saber mais sobre saúde metabólica.",
    longevidade: "Olá, Dra. Andressa! Vim pelo site e gostaria de saber mais sobre longevidade.",
    equipe: "Olá, Dra. Andressa! Vim pelo site e gostaria de saber mais sobre o acompanhamento com equipe multidisciplinar.",
    duvida: "Olá, Dra. Andressa! Vim pelo site e tenho uma dúvida antes de agendar."
  }
};
