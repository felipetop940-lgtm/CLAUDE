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
      "Olá, Gabriel! Quero contratar o plano *Premium Page* (R$ 320).\n\n" +
      "O que está incluso:\n" +
      "• Site profissional personalizado\n" +
      "• Adaptado para celular e computador\n" +
      "• Botão direto para o meu WhatsApp\n" +
      "• Edição de vídeo para a página\n" +
      "• 5 rodadas de ajuste\n" +
      "• Entrega em 2 a 7 dias\n\n" +
      "Como fazemos para começar?",
    essential:
      "Olá, Gabriel! Quero contratar o plano *Essencial* (R$ 250).\n\n" +
      "O que está incluso:\n" +
      "• Site profissional personalizado\n" +
      "• Adaptado para celular e computador\n" +
      "• Botão direto para o meu WhatsApp\n" +
      "• 2 rodadas de ajuste\n" +
      "• Entrega em 2 a 7 dias\n\n" +
      "Como fazemos para começar?",
    essentialVideo:
      "Olá, Gabriel! Quero contratar o plano *Essencial com edição de vídeo* (R$ 250 + R$ 38 = *R$ {total}*).\n\n" +
      "O que está incluso:\n" +
      "• Site profissional personalizado\n" +
      "• Adaptado para celular e computador\n" +
      "• Botão direto para o meu WhatsApp\n" +
      "• Edição de vídeo para a página\n" +
      "• 2 rodadas de ajuste\n" +
      "• Entrega em 2 a 7 dias\n\n" +
      "Como fazemos para começar?"
  },

  prices: {
    essential: 250,      // Site Essencial — 2 rodadas de ajuste
    video: 38,           // Edição de vídeo avulsa
    premium: 320         // Premium Page — vídeo incluso + 5 rodadas
  }
};
