/* Mockups de site pros vídeos e artes (pedido dele em 27/10: "dá um exemplo de site amador e coloca o meu lá muito mais desenvolvido").
   MOCK.amador(w, h) → site feito de qualquer jeito · MOCK.premium(w, h, t) → o site como ele entrega (escuro, serifada, foto, botão do WhatsApp, avaliação).
   Negócio fictício ("Ana Doces"), endereço genérico seunome.com.br. As páginas que usam precisam declarar as fontes PF (Playfair) e IT (Inter Tight). */
(() => {
  const barra = (url, escuro) => `<div style="height:38px;display:flex;align-items:center;gap:8px;padding:0 16px;background:${escuro ? '#16171C' : '#DADADA'}">
    ${['#FF5F57', '#FEBC2E', '#28C840'].map(c => `<i style="width:11px;height:11px;border-radius:50%;background:${c}"></i>`).join('')}
    <div style="margin-left:12px;flex:1;height:22px;border-radius:11px;background:${escuro ? '#0C0D10' : '#fff'};font:500 13px IT,sans-serif;color:${escuro ? '#8A8F99' : '#555'};display:flex;align-items:center;padding:0 12px">${escuro ? '🔒 ' : '⚠️ '}${url}</div></div>`;
  window.MOCK = {
    amador: (w = 900, h = 540) => `<div style="width:${w}px;height:${h}px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 40px 90px -30px rgba(0,0,0,.8)">${barra('anadoces.sitegratis.exemplo', false)}
      <div style="font-family:'Times New Roman',serif;color:#222;text-align:center;padding:16px 26px">
        <div style="background:#FFF200;color:#E4007C;font-weight:700;font-size:${w * .042}px;padding:8px 0;border:3px dashed #1a3cff">BEM VINDO AO SITE DA ANA DOCES!!!</div>
        <div style="display:flex;gap:16px;margin-top:16px;text-align:left">
          <div style="width:${w * .3}px;height:${h * .34}px;background:#C9C9C9;display:grid;place-items:center;font-size:15px;color:#666;border:1px solid #999">imagem_bolo2_final(1).jpg</div>
          <div style="flex:1;font-size:${w * .021}px;line-height:1.35">Fazemos bolos, doces, salgados, tortas, docinhos, bolo de pote, cento de salgado e muito mais!!! Encomendas com antecedência. Pagamento a combinar. <u style="color:#1a3cff">clique aqui</u> para ver mais fotos no facebook. Atendemos de seg a sab.</div></div>
        <div style="margin-top:14px;font-size:${w * .024}px;color:#1a3cff;text-decoration:underline">Contato: (62) 9XXXX-XXXX · anadoces2015@hotmail.com</div>
        <div style="margin-top:10px;font-size:13px;color:#999">Visitantes: 000127 · Melhor visualizado no Internet Explorer</div></div></div>`,
    premium: (w = 900, h = 540, t = 0) => { const s = w / 900;
      return `<div style="width:${w}px;height:${h}px;border-radius:18px;overflow:hidden;background:#0B0B0E;box-shadow:0 50px 110px -30px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.08);font-family:IT,sans-serif;color:#F5F6F8;position:relative">${barra('seunome.com.br', true)}
        <div style="position:absolute;inset:38px 0 0 0;background:radial-gradient(${520 * s}px ${380 * s}px at 82% 30%, rgba(214,179,108,.22), transparent 70%), radial-gradient(${400 * s}px ${300 * s}px at 10% 100%, rgba(255,46,67,.14), transparent 70%)"></div>
        <div style="position:relative;display:flex;justify-content:space-between;align-items:center;padding:${18 * s}px ${34 * s}px">
          <div style="font-family:PF;font-style:italic;font-size:${30 * s}px;color:#D6B36C">Ana Doces</div>
          <div style="display:flex;gap:${22 * s}px;font-size:${14 * s}px;color:#B9BCC4;align-items:center"><span>Cardápio</span><span>Festas</span><span>Onde fica</span>
            <span style="padding:${8 * s}px ${16 * s}px;border-radius:30px;background:#FF2E43;color:#fff;font-weight:700">Fazer pedido</span></div></div>
        <div style="position:relative;display:flex;padding:${18 * s}px ${34 * s}px 0;gap:${20 * s}px">
          <div style="flex:1.1">
            <div style="font-weight:800;font-size:${13 * s}px;letter-spacing:.22em;color:#D6B36C">CONFEITARIA · GOIÂNIA</div>
            <div style="margin-top:${12 * s}px;font-family:PF;font-weight:600;font-size:${50 * s}px;line-height:1.02">Bolos que viram<br><i style="color:#D6B36C">a festa.</i></div>
            <div style="margin-top:${14 * s}px;font-size:${15 * s}px;line-height:1.45;color:#B9BCC4">Encomenda em 1 minuto, entrega no dia e no horário que você escolher.</div>
            <div style="margin-top:${20 * s}px;display:flex;gap:${12 * s}px">
              <span style="padding:${13 * s}px ${22 * s}px;border-radius:40px;background:#25D366;color:#06301A;font-weight:800;font-size:${15 * s}px;box-shadow:0 0 ${18 + 10 * Math.sin(t * 5)}px rgba(37,211,102,.55)">💬 Pedir pelo WhatsApp</span>
              <span style="padding:${13 * s}px ${22 * s}px;border-radius:40px;border:1.5px solid rgba(255,255,255,.3);font-weight:700;font-size:${15 * s}px">Ver cardápio</span></div>
            <div style="margin-top:${22 * s}px;display:flex;gap:${22 * s}px">${[['+500', 'festas'], ['4,9 ★', 'no Google'], ['Goiânia', 'e região']].map(([a, b]) => `<div><div style="font-family:PF;font-weight:600;font-size:${24 * s}px">${a}</div><div style="font-size:${12 * s}px;color:#8A8F99">${b}</div></div>`).join('')}</div></div>
          <div style="flex:.9;position:relative;height:${330 * s}px">
            <div style="position:absolute;left:${20 * s}px;top:${6 * s}px;width:${300 * s}px;height:${300 * s}px;border-radius:50%;background:radial-gradient(circle at 38% 32%,#FFE7C7,#E9B97A 40%,#9A5A26 78%,#4A2410);box-shadow:0 30px 80px -20px rgba(214,179,108,.5);transform:translateY(${6 * Math.sin(t * 1.6)}px);display:grid;place-items:center;font-size:${140 * s}px">🎂</div>
            <div style="position:absolute;right:${0}px;top:${30 * s}px;padding:${10 * s}px ${14 * s}px;border-radius:${16 * s}px;background:rgba(255,255,255,.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.18);font-size:${13 * s}px;transform:translateY(${-5 * Math.sin(t * 1.3)}px)"><b>⭐ 4,9</b> · 120 avaliações</div>
            <div style="position:absolute;left:0;bottom:${8 * s}px;padding:${10 * s}px ${14 * s}px;border-radius:${16 * s}px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);font-size:${13 * s}px;transform:translateY(${5 * Math.sin(t * 1.1)}px)">📍 Entrega em Goiânia e região</div></div></div></div>`; },
  };
})();
