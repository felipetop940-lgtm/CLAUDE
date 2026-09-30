/* =========================================================================
   CONFIGURAÇÃO — edite aqui. Textos ficam no index.html; cores no topo do CSS.
   ========================================================================= */
window.SITE = {
  /* Link do WhatsApp. Aceita "https://wa.me/5562999999999" ou só os números "5562999999999".
     Enquanto estiver vazio, os botões levam para a seção de contato. */
  whatsapp: "5562982595333",

  /* Mensagem que já chega escrita no seu WhatsApp (cada botão pode ter a sua no HTML) */
  whatsappDefaultMessage: "Olá, Gabriel! Vi seu site e quero um site profissional. Pode me passar mais informações?",

  instagramUrl: "https://www.instagram.com/august0_oliv/", // ex.: "https://www.instagram.com/seuperfil/"  (vazio = oculto)
  instagramHandle: "@august0_oliv", // ex.: "@seuperfil"
  email: "augustooliv940@gmail.com", // ex.: "contato@seudominio.com.br"             (vazio = oculto)

  /* Mensagens automáticas de cada plano (chegam prontas no seu WhatsApp).
     *texto* fica em negrito no WhatsApp. {total} é trocado pelo valor. */
  messages: {
    premium:
      "Olá, Gabriel! Quero contratar o plano *{plano}* (*R$ {total}*).\n\n" +
      "O que está incluso:\n" +
      "• Site profissional personalizado\n" +
      "• Adaptado para celular e computador\n" +
      "• Botão direto para o meu WhatsApp\n" +
      "• Domínio próprio com o meu nome (.com.br)\n" +
      "• Vídeo na página com edição inclusa\n" +
      "• Até 5 rodadas de ajuste\n" +
      "• Entrega em 2 a 5 dias\n\n" +
      "Como fazemos para começar?",
    essential:
      "Olá, Gabriel! Quero contratar o plano *{plano}* (*R$ {total}*).\n\n" +
      "O que está incluso:\n" +
      "• Site profissional personalizado\n" +
      "• Adaptado para celular e computador\n" +
      "• Botão direto para o meu WhatsApp\n" +
      "{extras}" +
      "• 2 rodadas de ajuste\n" +
      "• Entrega em 2 a 7 dias\n\n" +
      "Como fazemos para começar?"
  },

  prices: {
    essential: 300,      // Site Essencial — 2 rodadas de ajuste, entrega em 2 a 7 dias
    video: 38,           // Edição de vídeo avulsa (opcional só no Essencial)
    premium: 500         // Premium Page — domínio .com.br + vídeo inclusos, até 5 rodadas, 2 a 5 dias
  }
};
