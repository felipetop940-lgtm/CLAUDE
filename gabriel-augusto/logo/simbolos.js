// Símbolos da marca Gabriel Augusto (sites profissionais). Cada função devolve um <svg> pronto.
// Paleta da marca: preto, branco, dourado (destaque), azul (detalhe).
window.MARCA = { ouro: '#D6B36C', ouroClaro: '#F1DDA8', ouroEsc: '#9C7A3A', azul: '#4F7BFF', preto: '#07080A', branco: '#F5F6F8' };
const M = window.MARCA;
const gradOuro = id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${M.ouroClaro}"/><stop offset=".55" stop-color="${M.ouro}"/><stop offset="1" stop-color="${M.ouroEsc}"/></linearGradient>`;

// 1) JANELA: a janela do navegador com o monograma GA dentro e o cursor clicando no A (site que leva ao clique)
window.simboloJanela = (o = {}) => {
  const tam = o.tam || 240, claro = o.claro, tinta = claro ? M.preto : M.branco, fundo = claro ? '#FFFFFF' : '#0B0D12', id = 'gj' + Math.random().toString(36).slice(2, 7);
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><defs>${gradOuro(id)}</defs>
    <rect x="12" y="12" width="216" height="216" rx="50" fill="${fundo}" stroke="${tinta}" stroke-width="8"/>
    <line x1="12" y1="66" x2="228" y2="66" stroke="${tinta}" stroke-width="8"/>
    <circle cx="50" cy="40" r="8" fill="${tinta}" opacity=".45"/><circle cx="76" cy="40" r="8" fill="${tinta}" opacity=".45"/><circle cx="102" cy="40" r="8" fill="url(#${id})"/>
    <text x="118" y="182" text-anchor="middle" font-family="MS" font-weight="800" font-size="104" letter-spacing="-5"><tspan fill="${tinta}">G</tspan><tspan fill="url(#${id})">A</tspan></text>
    <path d="M168 150 L168 204 L181 192 L190 213 L200 209 L191 188 L208 188 Z" fill="${tinta}" stroke="${fundo}" stroke-width="5" stroke-linejoin="round"/></svg>`;
};

// 2) PONTO: "ga." como um endereço de site; o ponto dourado é o .com.br que todo cliente Premium ganha
window.simboloPonto = (o = {}) => {
  const tam = o.tam || 240, claro = o.claro, tinta = claro ? M.preto : M.branco, id = 'gp' + Math.random().toString(36).slice(2, 7);
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><defs>${gradOuro(id)}</defs>
    <rect x="0" y="0" width="240" height="240" rx="58" fill="${claro ? '#FFFFFF' : '#0B0D12'}" ${claro ? `stroke="${M.preto}" stroke-opacity=".12" stroke-width="3"` : ''}/>
    <text x="104" y="160" text-anchor="middle" font-family="LS" font-weight="800" font-size="128" letter-spacing="-6" fill="${tinta}">ga</text>
    <circle cx="186" cy="146" r="17" fill="url(#${id})"/></svg>`;
};

// 3) SELO: monograma serifado G + A em itálico dourado dentro de anel duplo (clássico, pra clientes de médico/advocacia)
window.simboloSelo = (o = {}) => {
  const tam = o.tam || 240, claro = o.claro, tinta = claro ? M.preto : M.branco, id = 'gs' + Math.random().toString(36).slice(2, 7);
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><defs>${gradOuro(id)}</defs>
    <circle cx="120" cy="120" r="112" fill="${claro ? '#FFFFFF' : '#0B0D12'}" stroke="url(#${id})" stroke-width="4"/>
    <circle cx="120" cy="120" r="100" fill="none" stroke="url(#${id})" stroke-width="1.5" opacity=".7"/>
    <text x="92" y="160" text-anchor="middle" font-family="PF" font-weight="600" font-size="112" fill="${tinta}">G</text>
    <text x="160" y="160" text-anchor="middle" font-family="BD" font-style="italic" font-weight="500" font-size="104" fill="url(#${id})">A</text></svg>`;
};
