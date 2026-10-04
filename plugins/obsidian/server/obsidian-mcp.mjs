#!/usr/bin/env node
// Servidor MCP do plugin "obsidian": lê e escreve direto nos arquivos .md do cofre.
// Não precisa do Obsidian aberto nem de dependências: fala JSON-RPC 2.0 por stdio,
// uma mensagem JSON por linha (transporte stdio do MCP). Logs vão só para o stderr.

import { existsSync, statSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const VERSAO = '0.2.0';
const PROTOCOLOS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const LIMITE_LEITURA = 150_000;

// ------------------------------------------------------------------ configuração

function opcao(...nomes) {
  for (const nome of nomes) {
    const valor = (process.env[nome] ?? '').trim();
    // Opção do plugin sem valor pode chegar vazia ou como "${user_config.x}" literal.
    if (valor && !valor.includes('${')) return valor;
  }
  return '';
}

const pastaLimpa = (p) => String(p ?? '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').trim();

function caminhoDoCofre() {
  let p = opcao('OBSIDIAN_VAULT', 'OBSIDIAN_VAULT_PATH');
  if (p) {
    if (p === '~' || p.startsWith('~/') || p.startsWith('~\\')) p = path.join(os.homedir(), p.slice(1));
    return path.resolve(p);
  }
  // Sem caminho configurado: usa a pasta aberta no Claude Code, se ela for um cofre (tem .obsidian).
  for (const pasta of [process.env.CLAUDE_PROJECT_DIR, process.cwd()]) {
    if (pasta && existsSync(path.join(pasta, '.obsidian'))) return path.resolve(pasta);
  }
  return '';
}

const COFRE = caminhoDoCofre();
const NOME_COFRE = COFRE ? path.basename(COFRE) : '';
const PASTA_ENTRADA = pastaLimpa(opcao('OBSIDIAN_INBOX_FOLDER')) || '00 Entrada';
const PASTA_DIARIO = pastaLimpa(opcao('OBSIDIAN_DAILY_FOLDER'));
const PASTA_DIARIO_PADRAO = '10 Diário';

class ErroDeUso extends Error {}
const falha = (mensagem) => {
  throw new ErroDeUso(mensagem);
};

function checarCofre() {
  if (!COFRE) {
    falha('Não achei o cofre do Obsidian. Abra o Claude Code dentro da pasta do cofre, ou em /plugin → obsidian → configurar preencha "Pasta do cofre" e reinicie a sessão.');
  }
  let st;
  try {
    st = statSync(COFRE);
  } catch {
    falha(`A pasta do cofre não existe: ${COFRE}. Corrija em /plugin → obsidian → configurar.`);
  }
  if (!st.isDirectory()) falha(`O caminho do cofre não é uma pasta: ${COFRE}`);
}

// ------------------------------------------------------------------ caminhos

// Caracteres que o Obsidian não aceita em nome de arquivo ou que quebram [[links]].
const CARACTERES_PROIBIDOS = /[*"\\<>:|?#^[\]]/;

const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const semExtensao = (rel) => rel.replace(/\.md$/i, '');
const comMd = (rel) => (/\.md$/i.test(rel) ? rel : `${rel}.md`);
const paraRel = (abs) => path.relative(COFRE, abs).split(path.sep).join('/');
const linkObsidian = (rel) =>
  `obsidian://open?vault=${encodeURIComponent(NOME_COFRE)}&file=${encodeURIComponent(semExtensao(rel))}`;

// Aceita "Pasta/Nota", "Nota.md", "[[Nota]]" ou um caminho absoluto dentro do cofre.
function relativo(entrada) {
  let rel = String(entrada ?? '').trim();
  if (rel.startsWith('[[') && rel.endsWith(']]')) rel = rel.slice(2, -2).split('|')[0].split('#')[0];
  rel = rel.replace(/\\/g, '/');
  if (COFRE && path.isAbsolute(rel)) {
    const abs = path.resolve(rel);
    if (abs === COFRE || abs.startsWith(COFRE + path.sep)) rel = paraRel(abs);
  }
  return rel.replace(/^(\.\/)+/, '').replace(/^\/+/, '').replace(/\/+$/, '').trim();
}

function absoluto(rel) {
  const abs = path.resolve(COFRE, rel);
  if (abs !== COFRE && !abs.startsWith(COFRE + path.sep)) falha(`Caminho fora do cofre: ${rel}`);
  if (rel.split('/').some((parte) => parte.startsWith('.'))) {
    falha(`Pastas e arquivos ocultos (como .obsidian) ficam de fora: ${rel}`);
  }
  return abs;
}

function validarNome(rel) {
  for (const parte of semExtensao(rel).split('/')) {
    if (!parte.trim()) falha(`Caminho com nome vazio: ${rel}`);
    const ruim = parte.match(CARACTERES_PROIBIDOS);
    if (ruim) {
      falha(`"${parte}" tem "${ruim[0]}", que o Obsidian não aceita em nome de arquivo (evite * " \\ / < > : | ? # ^ [ ]). Troque por "-" ou tire.`);
    }
    if (/[. ]$/.test(parte)) falha(`Nome não pode terminar com ponto ou espaço: "${parte}"`);
  }
}

async function arquivosMarkdown(pasta = '') {
  const base = pasta ? absoluto(pasta) : COFRE;
  if (pasta) {
    let st;
    try {
      st = await fs.stat(base);
    } catch {
      falha(`Pasta não encontrada no cofre: ${pasta}`);
    }
    if (!st.isDirectory()) falha(`Não é uma pasta: ${pasta}`);
  }
  const saida = [];
  const andar = async (dir) => {
    let itens = [];
    try {
      itens = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const item of itens) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      const abs = path.join(dir, item.name);
      if (item.isDirectory()) await andar(abs);
      else if (item.isFile() && /\.md$/i.test(item.name)) saida.push(abs);
    }
  };
  await andar(base);
  return saida;
}

const lerArquivo = async (abs) => (await fs.readFile(abs, 'utf8')).replace(/^\uFEFF/, '');

async function lerNotas(absolutos) {
  const notas = [];
  for (let i = 0; i < absolutos.length; i += 64) {
    const lote = await Promise.all(
      absolutos.slice(i, i + 64).map(async (abs) => {
        try {
          const [texto, st] = await Promise.all([lerArquivo(abs), fs.stat(abs)]);
          return { abs, rel: paraRel(abs), texto, st };
        } catch {
          return null;
        }
      }),
    );
    notas.push(...lote.filter(Boolean));
  }
  return notas;
}

// Acha a nota como o Obsidian acha um [[link]]: caminho exato ou só pelo nome.
async function localizar(ref) {
  const rel = comMd(relativo(ref));
  if (rel === '.md') falha('Informe qual nota.');
  const abs = absoluto(rel);
  if (existsSync(abs) && statSync(abs).isFile()) return { rel: paraRel(abs), abs };
  const alvo = rel.toLowerCase();
  const todos = (await arquivosMarkdown()).map(paraRel);
  const achados = todos.filter((r) => {
    const l = r.toLowerCase();
    return l === alvo || l.endsWith(`/${alvo}`);
  });
  if (achados.length === 1) return { rel: achados[0], abs: absoluto(achados[0]) };
  if (achados.length > 1) {
    falha(`Há ${achados.length} notas com esse nome; diga qual:\n${achados.map((r) => `- ${r}`).join('\n')}`);
  }
  const termo = normalizar(path.posix.basename(semExtensao(rel)));
  const parecidas = todos.filter((r) => normalizar(path.posix.basename(r)).includes(termo)).slice(0, 8);
  falha(
    `Nota não encontrada: ${ref}` +
      (parecidas.length ? `\nTalvez seja:\n${parecidas.map((r) => `- ${r}`).join('\n')}` : '\nUse search_notes para procurar.'),
  );
}

// ------------------------------------------------------------------ propriedades (YAML simples)

const RE_FRONTMATTER = /^---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

function frontmatter(texto) {
  const m = texto.match(RE_FRONTMATTER);
  if (!m) return { props: {}, interno: null, bruto: '', corpo: texto };
  return { props: lerYaml(m[1] ?? ''), interno: m[1] ?? '', bruto: m[0], corpo: texto.slice(m[0].length) };
}

function dividirLista(s) {
  const partes = [];
  let atual = '';
  let aspas = null;
  let nivel = 0;
  for (const c of s) {
    if (aspas) {
      if (c === aspas) aspas = null;
      atual += c;
      continue;
    }
    if (c === '"' || c === "'") aspas = c;
    else if (c === '[') nivel++;
    else if (c === ']') nivel--;
    else if (c === ',' && nivel === 0) {
      partes.push(atual);
      atual = '';
      continue;
    }
    atual += c;
  }
  partes.push(atual);
  return partes;
}

function valorYaml(bruto) {
  const v = bruto.trim();
  if (v === '' || v === '~' || v === 'null') return null;
  if (v.startsWith('[') && v.endsWith(']') && !v.startsWith('[[')) {
    const dentro = v.slice(1, -1).trim();
    return dentro ? dividirLista(dentro).map(valorYaml).filter((x) => x !== null) : [];
  }
  if (/^".*"$/.test(v)) {
    try {
      return JSON.parse(v);
    } catch {
      return v.slice(1, -1);
    }
  }
  if (/^'.*'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
  if (v === 'true' || v === 'false') return v === 'true';
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function lerYaml(bloco) {
  const props = {};
  const listasVazias = new Set();
  let lista = null;
  for (const linha of bloco.split(/\r?\n/)) {
    if (!linha.trim() || /^\s*#/.test(linha)) continue;
    const item = linha.match(/^\s*-(?:\s+(.*))?$/);
    if (item && lista) {
      const v = valorYaml(item[1] ?? '');
      if (v !== null) {
        props[lista].push(v);
        listasVazias.delete(lista);
      }
      continue;
    }
    const par = linha.match(/^([^\s:][^:]*?):(?:\s+(.*))?\s*$/);
    if (!par) {
      lista = null;
      continue;
    }
    const chave = par[1].trim();
    const resto = (par[2] ?? '').trim();
    if (resto === '') {
      props[chave] = [];
      listasVazias.add(chave);
      lista = chave;
      continue;
    }
    lista = null;
    props[chave] = valorYaml(resto);
  }
  for (const chave of listasVazias) props[chave] = null;
  return props;
}

function escalarYaml(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const s = String(v);
  if (s === '') return '""';
  const precisaAspas =
    /^[\s\-?:,[\]{}#&*!|>'"%@`]/.test(s) ||
    /\s$/.test(s) ||
    /:\s|\s#|\n/.test(s) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(s) ||
    /^-?\d+(\.\d+)?$/.test(s);
  return precisaAspas ? JSON.stringify(s) : s;
}

function linhasDaPropriedade(chave, valor) {
  if (Array.isArray(valor)) {
    return valor.length ? [`${chave}:`, ...valor.map((x) => `  - ${escalarYaml(x)}`)] : [`${chave}: []`];
  }
  if (valor && typeof valor === 'object') falha(`A propriedade "${chave}" não pode ser um objeto; use texto, número, sim/não ou lista.`);
  if (valor === '') return [`${chave}:`];
  return [`${chave}: ${escalarYaml(valor)}`];
}

// Troca só as chaves pedidas e deixa o resto do frontmatter exatamente como estava. null remove.
function aplicarPropriedades(texto, novas) {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const { interno, corpo } = frontmatter(texto);
  const linhas = interno ? interno.split(/\r?\n/) : [];
  for (const [chave, valor] of Object.entries(novas)) {
    if (!/^[^\s:#-][^:]*$/.test(chave)) falha(`Nome de propriedade inválido: ${chave}`);
    const i = linhas.findIndex((l) => l.match(/^([^\s:][^:]*?):(?:\s|$)/)?.[1].trim() === chave);
    const novasLinhas = valor === null ? [] : linhasDaPropriedade(chave, valor);
    if (i < 0) {
      linhas.push(...novasLinhas);
      continue;
    }
    let fim = i + 1;
    while (fim < linhas.length && /^(\s+\S|\s*-(\s|$))/.test(linhas[fim])) fim++;
    linhas.splice(i, fim - i, ...novasLinhas);
  }
  const cabecalho = linhas.length ? `---${eol}${linhas.join(eol)}${eol}---${eol}` : '';
  return cabecalho + corpo;
}

// ------------------------------------------------------------------ tags e links

function tagsDaNota(texto) {
  const { props, corpo } = frontmatter(texto);
  const tags = new Set();
  let lista = props.tags ?? props.tag ?? [];
  if (typeof lista === 'string') lista = lista.split(/[,\s]+/);
  if (!Array.isArray(lista)) lista = [];
  for (const t of lista) {
    const limpa = String(t ?? '').replace(/^#/, '').trim().toLowerCase();
    if (limpa) tags.add(limpa);
  }
  const semCodigo = corpo.replace(/(```|~~~)[\s\S]*?\1/g, '').replace(/`[^`\n]*`/g, '');
  for (const m of semCodigo.matchAll(/(?:^|[\s(])#([\p{L}\p{N}_\/-]*[\p{L}_\/-][\p{L}\p{N}_\/-]*)/gu)) {
    tags.add(m[1].toLowerCase());
  }
  return [...tags];
}

// Grupos: 1 = "!" de embed, 2 = alvo, 3 = "#seção" ou "#^bloco", 4 = "|apelido".
const RE_WIKILINK = /(!?)\[\[([^[\]|#^\n]*)((?:#[^[\]|\n]*)?)((?:\|[^[\]\n]*)?)\]\]/g;

function indiceDe(rels) {
  const porCaminho = new Map();
  const porNome = new Map();
  for (const rel of rels) {
    const sem = semExtensao(rel).toLowerCase();
    porCaminho.set(sem, rel);
    const nome = path.posix.basename(sem);
    if (!porNome.has(nome)) porNome.set(nome, []);
    porNome.get(nome).push(rel);
  }
  return { porCaminho, porNome };
}

function resolverLink(alvo, indice) {
  const a = semExtensao(String(alvo).trim().replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase());
  if (!a) return null;
  if (indice.porCaminho.has(a)) return indice.porCaminho.get(a);
  if (!a.includes('/')) {
    const lista = indice.porNome.get(a);
    return lista ? [...lista].sort((x, y) => x.split('/').length - y.split('/').length)[0] : null;
  }
  for (const [caminho, rel] of indice.porCaminho) if (caminho.endsWith(`/${a}`)) return rel;
  return null;
}

const ehAnexo = (alvo) => /\.[a-z][a-z0-9]{1,4}$/i.test(alvo.trim()) && !/\.md$/i.test(alvo.trim());

// ------------------------------------------------------------------ datas

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS_MINIMOS = ['do', '2ª', '3ª', '4ª', '5ª', '6ª', 'sá'];
const dois = (n) => String(n).padStart(2, '0');

function semanaIso(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const inicioDoAno = Date.UTC(t.getUTCFullYear(), 0, 1);
  return { semana: Math.ceil(((t - inicioDoAno) / 86_400_000 + 1) / 7), ano: t.getUTCFullYear() };
}

// Subconjunto dos tokens do moment.js, que é o que o Obsidian usa no formato da nota diária.
function formatarData(d, formato) {
  const RE = /\[([^\]]*)\]|YYYY|YY|Q|MMMM|MMM|MM|M|DDDD|DDD|DD|Do|D|dddd|ddd|dd|d|E|e|GGGG|gggg|WW|W|ww|w|HH|H|hh|h|mm|m|ss|s|A|a/g;
  return formato.replace(RE, (token, literal) => {
    if (literal !== undefined) return literal;
    const inicioDoAno = new Date(d.getFullYear(), 0, 1);
    const diaDoAno = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - inicioDoAno) / 86_400_000) + 1;
    const h12 = d.getHours() % 12 || 12;
    switch (token) {
      case 'YYYY': return String(d.getFullYear());
      case 'YY': return String(d.getFullYear()).slice(-2);
      case 'Q': return String(Math.floor(d.getMonth() / 3) + 1);
      case 'MMMM': return MESES[d.getMonth()];
      case 'MMM': return MESES_CURTOS[d.getMonth()];
      case 'MM': return dois(d.getMonth() + 1);
      case 'M': return String(d.getMonth() + 1);
      case 'DDDD': return String(diaDoAno).padStart(3, '0');
      case 'DDD': return String(diaDoAno);
      case 'DD': return dois(d.getDate());
      case 'Do': return `${d.getDate()}º`;
      case 'D': return String(d.getDate());
      case 'dddd': return DIAS[d.getDay()];
      case 'ddd': return DIAS_CURTOS[d.getDay()];
      case 'dd': return DIAS_MINIMOS[d.getDay()];
      case 'd': return String(d.getDay());
      case 'E': return String(d.getDay() || 7);
      case 'e': return String((d.getDay() + 6) % 7);
      case 'GGGG': case 'gggg': return String(semanaIso(d).ano);
      case 'WW': case 'ww': return dois(semanaIso(d).semana);
      case 'W': case 'w': return String(semanaIso(d).semana);
      case 'HH': return dois(d.getHours());
      case 'H': return String(d.getHours());
      case 'hh': return dois(h12);
      case 'h': return String(h12);
      case 'mm': return dois(d.getMinutes());
      case 'm': return String(d.getMinutes());
      case 'ss': return dois(d.getSeconds());
      case 's': return String(d.getSeconds());
      case 'A': return d.getHours() < 12 ? 'AM' : 'PM';
      case 'a': return d.getHours() < 12 ? 'am' : 'pm';
      default: return token;
    }
  });
}

const maiuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const dataHora = (ms) => formatarData(new Date(ms), 'YYYY-MM-DD HH:mm');

function interpretarData(entrada) {
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  if (!entrada) return hoje;
  const t = normalizar(String(entrada).trim());
  const deslocamentos = { hoje: 0, today: 0, ontem: -1, yesterday: -1, anteontem: -2, amanha: 1, tomorrow: 1 };
  if (t in deslocamentos) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + deslocamentos[t]);
    return d;
  }
  let ano;
  let mes;
  let dia;
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/))) {
    dia = Number(m[1]);
    mes = Number(m[2]);
    ano = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : hoje.getFullYear();
  } else {
    falha(`Data não entendida: "${entrada}". Use AAAA-MM-DD, DD/MM/AAAA, hoje, ontem ou amanhã.`);
  }
  const d = new Date(ano, mes - 1, dia, 12);
  if (d.getMonth() !== mes - 1 || d.getDate() !== dia) falha(`Data inválida: "${entrada}".`);
  return d;
}

// ------------------------------------------------------------------ edição de texto

const ehItemDeLista = (linha) => /^\s*([-*+]|\d+[.)])\s/.test(linha);

// Acrescenta no fim da nota ou no fim de uma seção (cria a seção se não existir).
function inserir(texto, novo, titulo) {
  const crlf = texto.includes('\r\n');
  const doc = texto.replace(/\r\n/g, '\n');
  const bloco = String(novo ?? '').replace(/\r\n/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '');
  if (!bloco) falha('O conteúdo está vazio.');
  const linhas = doc.split('\n');
  while (linhas.length && linhas[linhas.length - 1].trim() === '') linhas.pop();
  const novas = bloco.split('\n');

  let secao = -1;
  let nivel = 0;
  let fim = linhas.length;
  if (titulo) {
    const alvo = normalizar(titulo.replace(/^#+\s*/, '').trim());
    const inicioDoCorpo = (frontmatter(doc).bruto.match(/\n/g) ?? []).length;
    let emCodigo = false;
    for (let i = inicioDoCorpo; i < linhas.length; i++) {
      if (/^\s*(```|~~~)/.test(linhas[i])) emCodigo = !emCodigo;
      if (emCodigo) continue;
      const h = linhas[i].match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (!h) continue;
      if (secao < 0) {
        if (normalizar(h[2]) === alvo) {
          secao = i;
          nivel = h[1].length;
        }
      } else if (h[1].length <= nivel) {
        fim = i;
        break;
      }
    }
  }

  let resultado;
  if (titulo && secao < 0) {
    const marcador = titulo.trim().match(/^#{1,6}/)?.[0] ?? '##';
    const nome = titulo.replace(/^#+\s*/, '').trim();
    resultado = [...linhas, ...(linhas.length ? [''] : []), `${marcador} ${nome}`, ...novas];
  } else {
    let pos = fim;
    while (pos > (secao >= 0 ? secao + 1 : 0) && linhas[pos - 1].trim() === '') pos--;
    const anterior = pos > 0 ? linhas[pos - 1] : null;
    const colado =
      anterior === null || (secao >= 0 && pos === secao + 1) || (ehItemDeLista(anterior) && ehItemDeLista(novas[0]));
    const depois = linhas.slice(fim);
    resultado = [...linhas.slice(0, pos), ...(colado ? [] : ['']), ...novas, ...(depois.length ? ['', ...depois] : [])];
  }
  const saida = `${resultado.join('\n')}\n`;
  return crlf ? saida.replace(/\n/g, '\r\n') : saida;
}

async function gravar(abs, texto) {
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, texto.endsWith('\n') ? texto : `${texto}\n`, 'utf8');
}

// ------------------------------------------------------------------ nota diária

async function configDoDiario() {
  let cfg = null;
  try {
    cfg = JSON.parse(await fs.readFile(path.join(COFRE, '.obsidian', 'daily-notes.json'), 'utf8'));
  } catch {
    cfg = null;
  }
  return {
    pasta: PASTA_DIARIO || (cfg ? pastaLimpa(cfg.folder) : PASTA_DIARIO_PADRAO),
    formato: (cfg?.format ?? '').trim() || 'YYYY-MM-DD',
    modelo: cfg?.template ? pastaLimpa(cfg.template) : '',
    origem: PASTA_DIARIO ? 'opção do plugin' : cfg ? 'configuração de Notas diárias do Obsidian' : 'padrão do plugin',
  };
}

async function textoDoModelo(modelo, data, titulo) {
  try {
    const bruto = await lerArquivo(absoluto(comMd(modelo)));
    return bruto.replace(/\{\{\s*(date|time|title)(?::([^}]*?))?\s*\}\}/gi, (_, tipo, formato) => {
      const t = tipo.toLowerCase();
      if (t === 'title') return titulo;
      if (t === 'time') return formatarData(new Date(), formato || 'HH:mm');
      return formatarData(data, formato || 'YYYY-MM-DD');
    });
  } catch {
    return null;
  }
}

const diarioPadrao = (d) =>
  `---\ndata: ${formatarData(d, 'YYYY-MM-DD')}\ntags:\n  - diario\n---\n# ${maiuscula(formatarData(d, 'dddd, D [de] MMMM [de] YYYY'))}\n`;

// ------------------------------------------------------------------ parâmetros

function texto(args, nome, obrigatorio = false) {
  const v = args[nome];
  if (v === undefined || v === null || v === '') {
    if (obrigatorio) falha(`Falta o parâmetro "${nome}".`);
    return '';
  }
  if (typeof v !== 'string') falha(`O parâmetro "${nome}" precisa ser texto.`);
  return v;
}

function inteiro(v, padrao, min, max) {
  const n = Number(v ?? padrao);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : padrao;
}

function objeto(args, nome) {
  const v = args[nome];
  if (v === undefined || v === null) return null;
  if (typeof v !== 'object' || Array.isArray(v)) falha(`O parâmetro "${nome}" precisa ser um objeto { chave: valor }.`);
  return v;
}

// ------------------------------------------------------------------ ferramentas

function resumoDeProps(props) {
  const partes = [];
  for (const chave of ['tipo', 'status', 'data', 'cliente']) {
    const v = props[chave];
    if (v !== undefined && v !== null && v !== '') partes.push(`${chave}: ${Array.isArray(v) ? v.join(', ') : v}`);
  }
  return partes.join(' · ');
}

function bate(atual, esperado) {
  const limpar = (x) => normalizar(String(x)).replace(/\[\[|\]\]/g, '').trim();
  if (atual === undefined || atual === null || atual === '') return false;
  if (esperado === '*') return Array.isArray(atual) ? atual.length > 0 : true;
  if (typeof esperado === 'boolean') return atual === esperado;
  const lista = Array.isArray(atual) ? atual : [atual];
  const procurado = limpar(esperado);
  return lista.some((x) => limpar(x).includes(procurado));
}

function trecho(linha, termos) {
  const n = normalizar(linha);
  const pos = Math.max(0, ...termos.map((t) => n.indexOf(t)).filter((i) => i >= 0).slice(0, 1));
  const inicio = Math.max(0, pos - 70);
  const recorte = linha.slice(inicio, inicio + 180).trim();
  return `${inicio > 0 ? '…' : ''}${recorte}${inicio + 180 < linha.length ? '…' : ''}`;
}

async function vaultInfo() {
  const arquivos = await arquivosMarkdown();
  const notas = await Promise.all(arquivos.map(async (abs) => ({ rel: paraRel(abs), st: await fs.stat(abs) })));
  const contagem = new Map();
  for (const { rel } of notas) {
    const partes = rel.split('/').slice(0, -1);
    const chave1 = partes[0] ?? '(raiz)';
    contagem.set(chave1, (contagem.get(chave1) ?? 0) + 1);
    if (partes.length > 1) contagem.set(`${partes[0]}/${partes[1]}`, (contagem.get(`${partes[0]}/${partes[1]}`) ?? 0) + 1);
  }
  const pastas = [...contagem.keys()]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((p) => (p.includes('/') ? `    ${p.split('/')[1]} (${contagem.get(p)})` : `  ${p} (${contagem.get(p)})`));
  const diario = await configDoDiario();
  const hoje = new Date();
  const recentes = [...notas].sort((a, b) => b.st.mtimeMs - a.st.mtimeMs).slice(0, 10);

  let regras = '';
  for (const nome of ['CLAUDE.md', 'Claude.md', '_Claude.md']) {
    const abs = path.join(COFRE, nome);
    if (existsSync(abs)) {
      const conteudo = await lerArquivo(abs);
      regras = `\nRegras do dono do cofre (${nome}) — siga estas antes das regras gerais:\n${conteudo.slice(0, 8000)}`;
      break;
    }
  }

  return [
    `Cofre: ${NOME_COFRE} (${COFRE})`,
    `Hoje: ${formatarData(hoje, 'dddd, YYYY-MM-DD HH:mm')} · semana ISO ${semanaIso(hoje).semana}`,
    `Notas: ${notas.length} · Pasta de entrada: ${PASTA_ENTRADA}`,
    `Nota do dia: pasta "${diario.pasta || '(raiz)'}", formato ${diario.formato}${diario.modelo ? `, modelo ${diario.modelo}` : ''} (${diario.origem})`,
    '',
    notas.length ? `Pastas (notas):\n${pastas.join('\n')}` : 'O cofre está vazio.',
    '',
    recentes.length ? `Últimas modificadas:\n${recentes.map((n) => `  ${dataHora(n.st.mtimeMs)}  ${n.rel}`).join('\n')}` : '',
    regras || '\nSem CLAUDE.md na raiz do cofre (é onde o dono pode deixar regras próprias para o Claude).',
  ].join('\n');
}

async function listNotes(args) {
  const pasta = relativo(texto(args, 'folder'));
  const limite = inteiro(args.limit, 50, 1, 500);
  const ordem = ['modified', 'created', 'name'].includes(args.sort) ? args.sort : 'modified';
  const desde = texto(args, 'since') ? interpretarData(texto(args, 'since')) : null;
  if (desde) desde.setHours(0, 0, 0, 0);
  let notas = await Promise.all(
    (await arquivosMarkdown(pasta)).map(async (abs) => ({ rel: paraRel(abs), st: await fs.stat(abs) })),
  );
  if (desde) notas = notas.filter((n) => n.st.mtimeMs >= desde.getTime());
  const criada = (st) => st.birthtimeMs || st.ctimeMs;
  if (ordem === 'name') notas.sort((a, b) => a.rel.localeCompare(b.rel, 'pt-BR'));
  else if (ordem === 'created') notas.sort((a, b) => criada(b.st) - criada(a.st));
  else notas.sort((a, b) => b.st.mtimeMs - a.st.mtimeMs);
  const mostradas = notas.slice(0, limite);
  const onde = pasta ? `em "${pasta}"` : 'no cofre';
  if (!notas.length) return `Nenhuma nota ${onde}${desde ? ` modificada desde ${formatarData(desde, 'YYYY-MM-DD')}` : ''}.`;
  return [
    `${notas.length} notas ${onde}${desde ? ` modificadas desde ${formatarData(desde, 'YYYY-MM-DD')}` : ''}` +
      (notas.length > limite ? ` (mostrando ${limite})` : '') + ':',
    ...mostradas.map((n) => `${dataHora(n.st.mtimeMs)}  ${n.rel}`),
  ].join('\n');
}

async function readNote(args) {
  const { rel, abs } = await localizar(texto(args, 'note', true));
  const [conteudo, st] = await Promise.all([lerArquivo(abs), fs.stat(abs)]);
  const cortado = conteudo.length > LIMITE_LEITURA;
  return [
    `Nota: ${rel}`,
    `Modificada: ${dataHora(st.mtimeMs)}`,
    `Abrir no Obsidian: ${linkObsidian(rel)}`,
    '──────── conteúdo ────────',
    cortado ? `${conteudo.slice(0, LIMITE_LEITURA)}\n…(nota cortada em ${LIMITE_LEITURA} caracteres)` : conteudo,
  ].join('\n');
}

async function searchNotes(args) {
  const consulta = texto(args, 'query');
  const pasta = relativo(texto(args, 'folder'));
  const tag = texto(args, 'tag');
  const propriedades = objeto(args, 'properties');
  const limite = inteiro(args.limit, 15, 1, 100);
  const termos = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (!termos.length && !tag && !propriedades) falha('Informe query, tag ou properties.');

  const filtroTag = tag ? normalizar(tag.replace(/^#/, '')) : null;
  const notas = (await lerNotas(await arquivosMarkdown(pasta))).filter((n) => {
    if (filtroTag && !tagsDaNota(n.texto).some((t) => normalizar(t) === filtroTag || normalizar(t).startsWith(`${filtroTag}/`))) {
      return false;
    }
    if (propriedades) {
      const { props } = frontmatter(n.texto);
      const chaves = Object.keys(props);
      for (const [chave, esperado] of Object.entries(propriedades)) {
        const real = chaves.find((k) => k.toLowerCase() === chave.toLowerCase());
        if (!bate(real === undefined ? undefined : props[real], esperado)) return false;
      }
    }
    return true;
  });

  const avaliadas = notas.map((n) => {
    const titulo = normalizar(semExtensao(n.rel));
    const corpo = normalizar(n.texto);
    let pontos = 0;
    let todos = true;
    let algum = false;
    for (const t of termos) {
      const noTitulo = titulo.includes(t);
      const vezes = corpo.split(t).length - 1;
      if (noTitulo || vezes) algum = true;
      else todos = false;
      pontos += (noTitulo ? 20 : 0) + Math.min(vezes, 10);
    }
    return { n, pontos, todos, algum };
  });

  let lista = termos.length ? avaliadas.filter((a) => a.todos) : avaliadas;
  let parcial = false;
  if (termos.length > 1 && !lista.length) {
    lista = avaliadas.filter((a) => a.algum);
    parcial = true;
  }
  lista.sort((a, b) => b.pontos - a.pontos || b.n.st.mtimeMs - a.n.st.mtimeMs);
  if (!lista.length) return 'Nenhuma nota encontrada. Tente outras palavras, sinônimos ou só o sobrenome.';

  const blocos = lista.slice(0, limite).map(({ n }, i) => {
    const { props } = frontmatter(n.texto);
    const resumo = resumoDeProps(props);
    const linhas = n.texto.split(/\r?\n/);
    const trechos = [];
    if (termos.length) {
      for (let j = 0; j < linhas.length && trechos.length < 3; j++) {
        if (termos.some((t) => normalizar(linhas[j]).includes(t))) trechos.push(`   ${j + 1}: ${trecho(linhas[j], termos)}`);
      }
    }
    return [`${i + 1}. ${n.rel} · modificada ${dataHora(n.st.mtimeMs)}${resumo ? ` · ${resumo}` : ''}`, ...trechos].join('\n');
  });
  const cabecalho =
    `${lista.length} nota(s)` +
    (lista.length > limite ? ` (mostrando ${limite})` : '') +
    (parcial ? ' — nenhuma tinha todos os termos; mostrando as que têm parte deles' : '') +
    ':';
  return [cabecalho, '', ...blocos].join('\n');
}

async function createNote(args) {
  let rel = relativo(texto(args, 'path', true));
  if (!rel.includes('/')) rel = `${PASTA_ENTRADA}/${rel}`;
  rel = comMd(rel);
  validarNome(rel);
  const abs = absoluto(rel);
  const sobrescrever = args.overwrite === true;
  if (existsSync(abs) && !sobrescrever) {
    falha(`Já existe a nota ${rel}. Use append_to_note ou edit_note para mexer nela (ou overwrite: true, se ele pediu para substituir).`);
  }
  let conteudo = String(args.content ?? '').replace(/\r\n/g, '\n');
  const propriedades = objeto(args, 'properties');
  if (propriedades && Object.keys(propriedades).length) conteudo = aplicarPropriedades(conteudo, propriedades);
  await gravar(abs, conteudo);
  return `${sobrescrever ? 'Substituída' : 'Criada'}: ${paraRel(abs)}\nAbrir no Obsidian: ${linkObsidian(paraRel(abs))}`;
}

async function appendToNote(args) {
  const ref = texto(args, 'note', true);
  const conteudo = texto(args, 'content', true);
  const titulo = texto(args, 'heading');
  let nota;
  try {
    nota = await localizar(ref);
  } catch (erro) {
    if (!(erro instanceof ErroDeUso) || args.create_if_missing === false || /Há \d+ notas/.test(erro.message)) throw erro;
    let rel = relativo(ref);
    if (!rel.includes('/')) rel = `${PASTA_ENTRADA}/${rel}`;
    rel = comMd(rel);
    validarNome(rel);
    nota = { rel, abs: absoluto(rel), nova: true };
  }
  const atual = nota.nova ? '' : await lerArquivo(nota.abs);
  await gravar(nota.abs, inserir(atual, conteudo, titulo));
  return `${nota.nova ? 'Criada' : 'Atualizada'}: ${nota.rel}${titulo ? ` (seção "${titulo.replace(/^#+\s*/, '')}")` : ''}\nAbrir no Obsidian: ${linkObsidian(nota.rel)}`;
}

async function editNote(args) {
  const { rel, abs } = await localizar(texto(args, 'note', true));
  const doc = await lerArquivo(abs);
  const crlf = doc.includes('\r\n');
  const ajustar = (s) => (crlf ? String(s).replace(/\r?\n/g, '\r\n') : String(s).replace(/\r\n/g, '\n'));
  const antigo = ajustar(texto(args, 'old_text', true));
  const novo = ajustar(args.new_text ?? '');
  const vezes = doc.split(antigo).length - 1;
  if (!vezes) falha('Trecho não encontrado. Ele precisa ser idêntico ao da nota (espaços e quebras de linha inclusos): leia com read_note e copie.');
  if (vezes > 1 && args.replace_all !== true) {
    falha(`O trecho aparece ${vezes} vezes. Inclua mais texto ao redor para ficar único, ou use replace_all: true.`);
  }
  const resultado = args.replace_all === true ? doc.split(antigo).join(novo) : doc.replace(antigo, () => novo);
  await gravar(abs, resultado);
  return `Editada: ${rel} (${args.replace_all === true ? vezes : 1} troca${vezes > 1 && args.replace_all === true ? 's' : ''})`;
}

async function setProperties(args) {
  const { rel, abs } = await localizar(texto(args, 'note', true));
  const propriedades = objeto(args, 'properties');
  if (!propriedades || !Object.keys(propriedades).length) falha('Informe properties, ex.: { "status": "feito" }. Use null para remover uma propriedade.');
  const doc = await lerArquivo(abs);
  await gravar(abs, aplicarPropriedades(doc, propriedades));
  const { props } = frontmatter(await lerArquivo(abs));
  return `Propriedades de ${rel}:\n${Object.entries(props).map(([k, v]) => `  ${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v ?? ''}`).join('\n') || '  (nenhuma)'}`;
}

async function dailyNote(args) {
  const data = interpretarData(texto(args, 'date'));
  const cfg = await configDoDiario();
  const nome = formatarData(data, cfg.formato);
  const rel = comMd(cfg.pasta ? `${cfg.pasta}/${nome}` : nome);
  const abs = absoluto(rel);
  const existia = existsSync(abs);
  const conteudoNovo = texto(args, 'append');
  if (!existia && args.create === false) {
    return `Não existe nota do dia ${formatarData(data, 'YYYY-MM-DD')} (${rel}).`;
  }
  let atual = existia ? await lerArquivo(abs) : null;
  if (!existia) {
    atual = (cfg.modelo && (await textoDoModelo(cfg.modelo, data, path.posix.basename(nome)))) || diarioPadrao(data);
  }
  if (conteudoNovo) atual = inserir(atual, conteudoNovo, texto(args, 'heading'));
  if (!existia || conteudoNovo) await gravar(abs, atual);
  return [
    `Nota do dia ${formatarData(data, 'dddd, YYYY-MM-DD')}: ${rel}${existia ? '' : ' (criada agora)'}${conteudoNovo ? ' — conteúdo acrescentado' : ''}`,
    `Abrir no Obsidian: ${linkObsidian(rel)}`,
    '──────── conteúdo ────────',
    atual.length > LIMITE_LEITURA ? `${atual.slice(0, LIMITE_LEITURA)}\n…(cortada)` : atual,
  ].join('\n');
}

async function listTags(args) {
  const pasta = relativo(texto(args, 'folder'));
  const notas = await lerNotas(await arquivosMarkdown(pasta));
  const contagem = new Map();
  for (const n of notas) for (const t of tagsDaNota(n.texto)) contagem.set(t, (contagem.get(t) ?? 0) + 1);
  if (!contagem.size) return `Nenhuma tag ${pasta ? `em "${pasta}"` : 'no cofre'}.`;
  const ordenadas = [...contagem].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
  return [`${ordenadas.length} tags (#tag — notas):`, ...ordenadas.slice(0, 300).map(([t, n]) => `#${t} — ${n}`)].join('\n');
}

async function getLinks(args) {
  const alvo = await localizar(texto(args, 'note', true));
  const notas = await lerNotas(await arquivosMarkdown());
  const indice = indiceDe(notas.map((n) => n.rel));
  const propria = notas.find((n) => n.rel === alvo.rel) ?? { texto: await lerArquivo(alvo.abs) };

  const saem = new Set();
  const faltam = new Set();
  for (const m of propria.texto.matchAll(RE_WIKILINK)) {
    const destino = m[2].trim();
    if (!destino || ehAnexo(destino)) continue;
    const r = resolverLink(destino, indice);
    if (r) saem.add(r);
    else faltam.add(destino);
  }

  const entram = [];
  for (const n of notas) {
    if (n.rel === alvo.rel) continue;
    const linhas = n.texto.split(/\r?\n/);
    const ocorrencias = [];
    linhas.forEach((linha, i) => {
      for (const m of linha.matchAll(RE_WIKILINK)) {
        if (resolverLink(m[2], indice) === alvo.rel) {
          ocorrencias.push(`   ${i + 1}: ${linha.trim().slice(0, 180)}`);
          break;
        }
      }
    });
    if (ocorrencias.length) entram.push([`- ${n.rel}`, ...ocorrencias.slice(0, 2)].join('\n'));
  }

  return [
    `Ligações de ${alvo.rel}`,
    '',
    `Notas que apontam para ela (${entram.length}):`,
    entram.length ? entram.join('\n') : '  nenhuma',
    '',
    `Links que saem dela (${saem.size}):`,
    saem.size ? [...saem].map((r) => `- ${r}`).join('\n') : '  nenhum',
    ...(faltam.size ? ['', `Links para notas que ainda não existem (${faltam.size}):`, ...[...faltam].map((f) => `- [[${f}]]`)] : []),
  ].join('\n');
}

async function moveNote(args) {
  const origem = await localizar(texto(args, 'from', true));
  const bruto = texto(args, 'to', true);
  let destino = relativo(bruto);
  if (!destino) falha('Informe o destino.');
  const absPasta = path.resolve(COFRE, destino);
  const ehPasta = /[\\/]$/.test(bruto.trim()) || (existsSync(absPasta) && statSync(absPasta).isDirectory());
  if (ehPasta) destino = `${destino}/${path.posix.basename(origem.rel)}`;
  destino = comMd(destino);
  validarNome(destino);
  const absDestino = absoluto(destino);
  if (absDestino === origem.abs) falha('Origem e destino são o mesmo arquivo.');
  if (existsSync(absDestino) && absDestino.toLowerCase() !== origem.abs.toLowerCase()) falha(`Já existe uma nota em ${destino}.`);

  const atualizarLinks = args.update_links !== false;
  const todas = atualizarLinks ? await lerNotas(await arquivosMarkdown()) : [];
  const indiceAntes = indiceDe(todas.map((n) => n.rel));

  await fs.mkdir(path.dirname(absDestino), { recursive: true });
  await fs.rename(origem.abs, absDestino);
  const relNovo = paraRel(absDestino);

  let notasAlteradas = 0;
  let linksAlterados = 0;
  if (atualizarLinks) {
    const indiceDepois = indiceDe(todas.map((n) => (n.rel === origem.rel ? relNovo : n.rel)));
    const nomeNovo = path.posix.basename(semExtensao(relNovo));
    const nomeUnico = (indiceDepois.porNome.get(nomeNovo.toLowerCase()) ?? []).length === 1;
    for (const nota of todas) {
      let mudou = 0;
      const novoTexto = nota.texto.replace(RE_WIKILINK, (inteiro, embed, alvo, secao, apelido) => {
        if (resolverLink(alvo, indiceAntes) !== origem.rel) return inteiro;
        if (resolverLink(alvo, indiceDepois) === relNovo) return inteiro; // ainda funciona (mesmo nome, outra pasta)
        mudou++;
        const novoAlvo = nomeUnico && !alvo.includes('/') ? nomeNovo : semExtensao(relNovo);
        return `${embed}[[${novoAlvo}${secao}${apelido}]]`;
      });
      if (mudou) {
        await gravar(nota.rel === origem.rel ? absDestino : nota.abs, novoTexto);
        notasAlteradas++;
        linksAlterados += mudou;
      }
    }
  }
  return [
    `Movida: ${origem.rel} → ${relNovo}`,
    atualizarLinks ? `Links atualizados: ${linksAlterados} em ${notasAlteradas} nota(s).` : 'Links não foram atualizados (update_links: false).',
    `Abrir no Obsidian: ${linkObsidian(relNovo)}`,
  ].join('\n');
}

const SO_LEITURA = { readOnlyHint: true, openWorldHint: false };
const ESCRITA = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };

const ferramentas = [
  {
    name: 'vault_info',
    description:
      'Visão geral do cofre: caminho, data de hoje e semana ISO, pastas com quantidade de notas, onde fica a nota do dia, últimas notas modificadas e as regras do dono (CLAUDE.md na raiz, se existir). Chame antes da primeira escrita da sessão.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { title: 'Visão geral do cofre', ...SO_LEITURA },
    executar: vaultInfo,
  },
  {
    name: 'list_notes',
    description: 'Lista notas de uma pasta (ou do cofre todo), mais recentes primeiro. Use since para "o que mudou desde…".',
    inputSchema: {
      type: 'object',
      properties: {
        folder: { type: 'string', description: 'Pasta relativa ao cofre, ex.: "20 Consultório de Sucesso/Clientes". Vazio = cofre todo.' },
        since: { type: 'string', description: 'Só notas modificadas a partir desta data (AAAA-MM-DD, DD/MM, hoje, ontem).' },
        sort: { type: 'string', enum: ['modified', 'created', 'name'], description: 'Ordem. Padrão: modified.' },
        limit: { type: 'integer', description: 'Máximo de itens (padrão 50, até 500).' },
      },
    },
    annotations: { title: 'Listar notas', ...SO_LEITURA },
    executar: listNotes,
  },
  {
    name: 'read_note',
    description: 'Lê uma nota inteira. Aceita caminho ("Pasta/Nota") ou só o nome, como num [[link]].',
    inputSchema: {
      type: 'object',
      properties: { note: { type: 'string', description: 'Caminho ou nome da nota (com ou sem .md).' } },
      required: ['note'],
    },
    annotations: { title: 'Ler nota', ...SO_LEITURA },
    executar: readNote,
  },
  {
    name: 'search_notes',
    description:
      'Busca no cofre por texto (sem diferenciar acento e maiúscula; todas as palavras precisam aparecer), por tag (inclui subtags) e/ou por propriedades do frontmatter. Devolve as notas com os trechos que bateram.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Palavras a procurar no título e no texto.' },
        folder: { type: 'string', description: 'Limitar a uma pasta.' },
        tag: { type: 'string', description: 'Tag sem ou com #, ex.: "cliente".' },
        properties: {
          type: 'object',
          description:
            'Filtro por propriedades, ex.: {"tipo": "reuniao", "cliente": "Dra. Ana"}. Texto bate por "contém" (ignora [[ ]] e acento); "*" = propriedade preenchida.',
          additionalProperties: true,
        },
        limit: { type: 'integer', description: 'Máximo de notas (padrão 15).' },
      },
    },
    annotations: { title: 'Buscar notas', ...SO_LEITURA },
    executar: searchNotes,
  },
  {
    name: 'create_note',
    description:
      `Cria uma nota nova. Sem pasta no caminho, ela vai para a pasta de entrada (${PASTA_ENTRADA}). Recusa se já existir (use append_to_note/edit_note). Procure antes com search_notes para não duplicar.`,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Caminho relativo ao cofre, ex.: "20 Consultório de Sucesso/Clientes/Dra. Ana". .md é opcional.' },
        content: { type: 'string', description: 'Markdown do corpo da nota.' },
        properties: {
          type: 'object',
          description: 'Propriedades (frontmatter), ex.: {"tipo": "cliente", "tags": ["cliente"], "inicio": "2026-10-04"}.',
          additionalProperties: true,
        },
        overwrite: { type: 'boolean', description: 'Substituir se já existir. Só use se ele pediu explicitamente.' },
      },
      required: ['path', 'content'],
    },
    annotations: { title: 'Criar nota', ...ESCRITA },
    executar: createNote,
  },
  {
    name: 'append_to_note',
    description:
      'Acrescenta texto no fim de uma nota ou no fim de uma seção (heading). Se a seção não existir, cria no fim. Se a nota não existir, cria (sem pasta → pasta de entrada).',
    inputSchema: {
      type: 'object',
      properties: {
        note: { type: 'string', description: 'Caminho ou nome da nota.' },
        content: { type: 'string', description: 'Markdown a acrescentar.' },
        heading: { type: 'string', description: 'Título da seção, ex.: "Próximos passos" ou "## Tarefas".' },
        create_if_missing: { type: 'boolean', description: 'Criar a nota se não existir (padrão true).' },
      },
      required: ['note', 'content'],
    },
    annotations: { title: 'Acrescentar na nota', ...ESCRITA },
    executar: appendToNote,
  },
  {
    name: 'edit_note',
    description: 'Troca um trecho exato de uma nota por outro (como um localizar e substituir). O trecho precisa ser único, a menos que replace_all seja true.',
    inputSchema: {
      type: 'object',
      properties: {
        note: { type: 'string', description: 'Caminho ou nome da nota.' },
        old_text: { type: 'string', description: 'Trecho atual, idêntico ao da nota.' },
        new_text: { type: 'string', description: 'Texto novo (vazio apaga o trecho).' },
        replace_all: { type: 'boolean', description: 'Trocar todas as ocorrências.' },
      },
      required: ['note', 'old_text', 'new_text'],
    },
    annotations: { title: 'Editar trecho', ...ESCRITA },
    executar: editNote,
  },
  {
    name: 'set_properties',
    description: 'Define ou remove propriedades (frontmatter) de uma nota sem mexer no resto. null remove a propriedade.',
    inputSchema: {
      type: 'object',
      properties: {
        note: { type: 'string', description: 'Caminho ou nome da nota.' },
        properties: { type: 'object', description: 'Ex.: {"status": "feito", "ultima_reuniao": "2026-10-04", "rascunho": null}.', additionalProperties: true },
      },
      required: ['note', 'properties'],
    },
    annotations: { title: 'Mudar propriedades', ...ESCRITA, idempotentHint: true },
    executar: setProperties,
  },
  {
    name: 'daily_note',
    description:
      'Abre (e cria, se faltar) a nota do dia, seguindo a configuração de Notas diárias do Obsidian (pasta, formato e modelo). Com append, acrescenta conteúdo, opcionalmente dentro de uma seção.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'AAAA-MM-DD, DD/MM, hoje (padrão), ontem ou amanhã.' },
        append: { type: 'string', description: 'Markdown a acrescentar.' },
        heading: { type: 'string', description: 'Seção onde acrescentar, ex.: "Tarefas".' },
        create: { type: 'boolean', description: 'false = só ler; não cria se não existir.' },
      },
    },
    annotations: { title: 'Nota do dia', ...ESCRITA },
    executar: dailyNote,
  },
  {
    name: 'list_tags',
    description: 'Lista as tags usadas no cofre (frontmatter e #inline) com quantas notas usam cada uma. Use antes de inventar tag nova.',
    inputSchema: { type: 'object', properties: { folder: { type: 'string', description: 'Limitar a uma pasta.' } } },
    annotations: { title: 'Listar tags', ...SO_LEITURA },
    executar: listTags,
  },
  {
    name: 'get_links',
    description: 'Mostra as ligações de uma nota: quem aponta para ela (backlinks, com a linha), para onde ela aponta e links para notas que ainda não existem.',
    inputSchema: {
      type: 'object',
      properties: { note: { type: 'string', description: 'Caminho ou nome da nota.' } },
      required: ['note'],
    },
    annotations: { title: 'Ligações da nota', ...SO_LEITURA },
    executar: getLinks,
  },
  {
    name: 'move_note',
    description:
      'Move ou renomeia uma nota e atualiza os [[links]] que apontam para ela no cofre todo (como o Obsidian faz). Destino terminando em "/" ou pasta existente = mover mantendo o nome.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Nota atual (caminho ou nome).' },
        to: { type: 'string', description: 'Novo caminho, ex.: "99 Arquivo/" ou "Clientes/Dra. Ana Souza".' },
        update_links: { type: 'boolean', description: 'Atualizar links nas outras notas (padrão true).' },
      },
      required: ['from', 'to'],
    },
    annotations: { title: 'Mover ou renomear', ...ESCRITA },
    executar: moveNote,
  },
];

// ------------------------------------------------------------------ JSON-RPC por stdio

const porNome = new Map(ferramentas.map((f) => [f.name, f]));

const INSTRUCOES =
  'Acesso ao cofre do Obsidian do usuário (arquivos Markdown no computador dele). Chame vault_info antes da primeira escrita da sessão e siga o CLAUDE.md do cofre se houver. ' +
  'Procure (search_notes) antes de criar para não duplicar; prefira append_to_note, edit_note e set_properties a sobrescrever; ' +
  'ligue pessoas, clientes e projetos com [[links]]; propriedades vão no frontmatter YAML. Não existe ferramenta de apagar.';

async function atender(msg) {
  switch (msg.method) {
    case 'initialize': {
      const pedida = msg.params?.protocolVersion;
      return {
        protocolVersion: PROTOCOLOS.includes(pedida) ? pedida : PROTOCOLOS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'obsidian', title: 'Obsidian', version: VERSAO },
        instructions: INSTRUCOES,
      };
    }
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: ferramentas.map(({ executar, ...definicao }) => definicao) };
    case 'tools/call': {
      const ferramenta = porNome.get(msg.params?.name);
      if (!ferramenta) throw { code: -32602, message: `Ferramenta desconhecida: ${msg.params?.name}` };
      try {
        checarCofre();
        const resposta = await ferramenta.executar(msg.params.arguments ?? {});
        return { content: [{ type: 'text', text: resposta }] };
      } catch (erro) {
        if (!(erro instanceof ErroDeUso)) console.error(erro);
        const mensagem = erro instanceof ErroDeUso ? erro.message : `Erro inesperado: ${erro?.message ?? erro}`;
        return { content: [{ type: 'text', text: mensagem }], isError: true };
      }
    }
    default:
      throw { code: -32601, message: `Método não suportado: ${msg.method}` };
  }
}

const enviar = (obj) => process.stdout.write(`${JSON.stringify(obj)}\n`);

async function processar(linha) {
  if (!linha.trim()) return;
  let msg;
  try {
    msg = JSON.parse(linha);
  } catch {
    enviar({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } });
    return;
  }
  if (typeof msg?.method !== 'string') return; // resposta a algo que não pedimos: ignora
  const notificacao = msg.id === undefined || msg.id === null;
  try {
    const result = await atender(msg);
    if (!notificacao) enviar({ jsonrpc: '2.0', id: msg.id, result });
  } catch (erro) {
    if (!notificacao) enviar({ jsonrpc: '2.0', id: msg.id, error: { code: erro?.code ?? -32603, message: erro?.message ?? String(erro) } });
  }
}

// Ao fechar a entrada, termina o que já foi pedido antes de sair.
let emAndamento = 0;
let entradaFechada = false;
const talvezSair = () => {
  if (entradaFechada && emAndamento === 0) process.exit(0);
};
const entrada = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
entrada.on('line', (linha) => {
  emAndamento++;
  processar(linha).finally(() => {
    emAndamento--;
    talvezSair();
  });
});
entrada.on('close', () => {
  entradaFechada = true;
  talvezSair();
});
process.stdout.on('error', () => process.exit(0));
