/* =========================================================
   Dados editáveis do site (comuns aos três sites).
   Endereços, títulos e mensagens de cada site ficam em build.py (SITES).
   Campos vazios ("") ficam ocultos.
   ========================================================= */
window.SITE = {
  nome: "Alessandra Silveira",

  // WhatsApp com DDI + DDD, só números
  whatsapp: "5562981375302",
  telefone: "(62) 98137-5302",

  instagram: "", // Ex.: "psi.alessandrasilveira" (sem @)  [INSTAGRAM]

  // Registro profissional (obrigatório na divulgação em psicologia)
  registro: "", // Ex.: "CRP 09/00000"  [CRP]

  horario: "", // Ex.: "Segunda a sexta, das 8h às 18h"  [HORÁRIO]

  // Mensagens automáticas do WhatsApp
  mensagens: {
    padrao: "Olá, Alessandra! Vim pelo site e gostaria de agendar uma avaliação neuropsicológica.",
    duvida: "Olá, Alessandra! Vim pelo site e queria entender melhor como funciona a avaliação neuropsicológica.",
    avaliacoes: "Olá, Alessandra! Vim pelo site e gostaria de informações sobre as avaliações.",
    diagnostico: "Olá, Alessandra! Vim pelo site e gostaria de informações sobre diagnóstico neuropsicológico.",
    acompanhamento: "Olá, Alessandra! Vim pelo site e gostaria de informações sobre acompanhamento psicológico.",
    criancas: "Olá, Alessandra! Vim pelo site e gostaria de informações sobre atendimento para criança.",
    adolescentes: "Olá, Alessandra! Vim pelo site e gostaria de informações sobre atendimento para adolescente.",
    adultos: "Olá, Alessandra! Vim pelo site e gostaria de informações sobre atendimento para adulto."
  }
};
