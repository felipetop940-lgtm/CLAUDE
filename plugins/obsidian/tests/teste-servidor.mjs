// Teste do servidor MCP num cofre temporário: node plugins/obsidian/tests/teste-servidor.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVIDOR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server', 'obsidian-mcp.mjs');

function iniciar(env, cwd = process.cwd()) {
  const processo = spawn(process.execPath, [SERVIDOR], { cwd, env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'inherit'] });
  const pendentes = new Map();
  let resto = '';
  let proximoId = 1;
  processo.stdout.on('data', (pedaco) => {
    resto += pedaco;
    let fim;
    while ((fim = resto.indexOf('\n')) >= 0) {
      const msg = JSON.parse(resto.slice(0, fim));
      resto = resto.slice(fim + 1);
      pendentes.get(msg.id)?.(msg);
      pendentes.delete(msg.id);
    }
  });
  const pedir = (method, params) =>
    new Promise((resolve) => {
      const id = proximoId++;
      pendentes.set(id, resolve);
      processo.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });
  const chamar = async (name, args = {}) => {
    const r = await pedir('tools/call', { name, arguments: args });
    assert.ok(r.result, `sem result em ${name}: ${JSON.stringify(r)}`);
    return { texto: r.result.content[0].text, erro: r.result.isError === true };
  };
  return { pedir, chamar, fechar: () => processo.stdin.end() };
}

const cofre = await fs.mkdtemp(path.join(os.tmpdir(), 'cofre-teste-'));
const escrever = async (rel, texto) => {
  await fs.mkdir(path.dirname(path.join(cofre, rel)), { recursive: true });
  await fs.writeFile(path.join(cofre, rel), texto);
};
const ler = (rel) => fs.readFile(path.join(cofre, rel), 'utf8');

await escrever('Clientes/Dra Ana.md', '---\ntipo: cliente\nstatus: ativo\ntags:\n  - cliente\n---\n# Dra Ana\n\n## Contexto\nDermatologista em Goiânia. #lead/quente\n');
await escrever(
  'Reuniões/2026-09-01 - Reunião - Dra Ana.md',
  '---\ntipo: reuniao\ncliente: "[[Dra Ana]]"\ndata: 2026-09-01\n---\nCom [[Dra Ana#Contexto|a doutora]] e ![[Dra Ana]].\n\n```\n#naotag\n```\n\n## Próximos passos\n- [ ] Trocar criativo\n\n## Fim\nok\n',
);
await escrever('CLAUDE.md', '# Regras\nEscreva em português.\n');
await escrever('.obsidian/app.json', '{}');

const s = iniciar({ OBSIDIAN_VAULT: cofre, OBSIDIAN_INBOX_FOLDER: '${user_config.inbox_folder}', OBSIDIAN_DAILY_FOLDER: '' });
let r;

// Protocolo
r = await s.pedir('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'teste', version: '0' } });
assert.equal(r.result.protocolVersion, '2025-06-18');
assert.equal(r.result.serverInfo.name, 'obsidian');
r = await s.pedir('tools/list', {});
assert.equal(r.result.tools.length, 12);
assert.ok(r.result.tools.every((t) => t.inputSchema?.type === 'object' && !('executar' in t)));
r = await s.pedir('tools/call', { name: 'nao_existe', arguments: {} });
assert.equal(r.error.code, -32602);
r = await s.pedir('metodo/estranho', {});
assert.equal(r.error.code, -32601);

// Visão geral
r = await s.chamar('vault_info');
assert.ok(!r.erro, r.texto);
assert.match(r.texto, /Notas: 3/);
assert.match(r.texto, /Pasta de entrada: 00 Entrada/); // opção não preenchida cai no padrão
assert.match(r.texto, /Escreva em português/);
assert.match(r.texto, /pasta "10 Diário".*padrão do plugin/);

// Criar e ler
r = await s.chamar('create_note', { path: 'Ideia de oferta', content: 'Pacote de fotos para clínicas.', properties: { tipo: 'ideia', tags: ['oferta'], valor: 1500, cliente: '[[Dra Ana]]' } });
assert.ok(!r.erro, r.texto);
assert.match(r.texto, /00 Entrada\/Ideia de oferta\.md/);
const ideia = await ler('00 Entrada/Ideia de oferta.md');
assert.equal(ideia, '---\ntipo: ideia\ntags:\n  - oferta\nvalor: 1500\ncliente: "[[Dra Ana]]"\n---\nPacote de fotos para clínicas.\n');
r = await s.chamar('create_note', { path: 'Ideia de oferta', content: 'x' });
assert.ok(r.erro && /Já existe/.test(r.texto));
r = await s.chamar('create_note', { path: 'Pasta/Nome: ruim', content: 'x' });
assert.ok(r.erro && /não aceita/.test(r.texto));
r = await s.chamar('read_note', { note: '[[ideia de oferta]]' });
assert.ok(!r.erro && r.texto.includes('Pacote de fotos') && r.texto.includes('obsidian://open?vault='), r.texto);

// Segurança
r = await s.chamar('read_note', { note: '../fora' });
assert.ok(r.erro, 'deveria recusar caminho fora do cofre');
r = await s.chamar('create_note', { path: '.obsidian/hack', content: 'x' });
assert.ok(r.erro && /ocultos/.test(r.texto));

// Busca
r = await s.chamar('search_notes', { query: 'DERMATOLOGISTA goiania' });
assert.match(r.texto, /1 nota\(s\)/);
assert.match(r.texto, /Clientes\/Dra Ana\.md/);
r = await s.chamar('search_notes', { properties: { tipo: 'reuniao', cliente: 'dra ana' } });
assert.match(r.texto, /Reuniões\/2026-09-01/);
r = await s.chamar('search_notes', { tag: 'lead' });
assert.match(r.texto, /Dra Ana\.md/);
r = await s.chamar('search_notes', { query: 'dermatologista inexistente' });
assert.match(r.texto, /parte deles/);
r = await s.chamar('list_tags');
assert.ok(r.texto.includes('#cliente') && r.texto.includes('#lead/quente') && !r.texto.includes('naotag'), r.texto);

// Acrescentar em seção
r = await s.chamar('append_to_note', { note: '2026-09-01 - Reunião - Dra Ana', heading: 'Próximos passos', content: '- [ ] Enviar relatório' });
assert.ok(!r.erro, r.texto);
let reuniao = await ler('Reuniões/2026-09-01 - Reunião - Dra Ana.md');
assert.ok(reuniao.includes('- [ ] Trocar criativo\n- [ ] Enviar relatório\n\n## Fim'), reuniao);
r = await s.chamar('append_to_note', { note: '2026-09-01 - Reunião - Dra Ana', heading: 'Decisões', content: 'Manter verba.' });
reuniao = await ler('Reuniões/2026-09-01 - Reunião - Dra Ana.md');
assert.ok(reuniao.endsWith('## Fim\nok\n\n## Decisões\nManter verba.\n'), reuniao);

// Duas escritas ao mesmo tempo na mesma nota: nenhuma pode sumir
await Promise.all([
  s.chamar('append_to_note', { note: 'Ideia de oferta', heading: 'Notas', content: '- primeira' }),
  s.chamar('append_to_note', { note: 'Ideia de oferta', heading: 'Notas', content: '- segunda' }),
]);
assert.ok((await ler('00 Entrada/Ideia de oferta.md')).includes('## Notas\n- primeira\n- segunda\n'));

// Editar e propriedades
r = await s.chamar('edit_note', { note: 'Dra Ana', old_text: 'Dermatologista em Goiânia.', new_text: 'Dermatologista em Goiânia e Anápolis.' });
assert.ok(!r.erro, r.texto);
r = await s.chamar('edit_note', { note: 'Dra Ana', old_text: 'não está lá', new_text: 'x' });
assert.ok(r.erro);
r = await s.chamar('set_properties', { note: 'Dra Ana', properties: { status: 'pausado', ultima_reuniao: '2026-09-01', tags: ['cliente', 'dermato'], tipo: null } });
assert.ok(!r.erro, r.texto);
const ana = await ler('Clientes/Dra Ana.md');
assert.ok(ana.startsWith('---\nstatus: pausado\ntags:\n  - cliente\n  - dermato\nultima_reuniao: 2026-09-01\n---\n# Dra Ana'), ana);

// Nota do dia
r = await s.chamar('daily_note', { append: '- [ ] Ligar para a [[Dra Ana]]', heading: 'Tarefas' });
assert.ok(!r.erro, r.texto);
assert.match(r.texto, /criada agora/);
const hoje = new Date();
const nomeHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
const diario = await ler(`10 Diário/${nomeHoje}.md`);
assert.ok(diario.includes(`data: ${nomeHoje}`) && diario.includes('## Tarefas\n- [ ] Ligar para a [[Dra Ana]]\n'), diario);
r = await s.chamar('daily_note', { date: 'ontem', create: false });
assert.match(r.texto, /Não existe/);
r = await s.chamar('daily_note', { date: '31/02/2026' });
assert.ok(r.erro);

// Ligações e mover
r = await s.chamar('get_links', { note: 'Dra Ana' });
assert.match(r.texto, /apontam para ela \(3\)/); // reunião, ideia (propriedade) e nota do dia
r = await s.chamar('move_note', { from: 'Dra Ana', to: 'Clientes/Ativos/Dra. Ana Souza' });
assert.ok(!r.erro, r.texto);
assert.match(r.texto, /Links atualizados: 5 em 3 nota/);
reuniao = await ler('Reuniões/2026-09-01 - Reunião - Dra Ana.md');
assert.ok(reuniao.includes('cliente: "[[Dra. Ana Souza]]"') && reuniao.includes('[[Dra. Ana Souza#Contexto|a doutora]]') && reuniao.includes('![[Dra. Ana Souza]]'), reuniao);
r = await s.chamar('move_note', { from: 'Dra. Ana Souza', to: '99 Arquivo/' });
assert.match(r.texto, /Links atualizados: 0/); // nome igual: links continuam valendo
r = await s.chamar('list_notes', { since: 'hoje', sort: 'name' });
assert.match(r.texto, /99 Arquivo\/Dra\. Ana Souza\.md/);

s.fechar();

// Sem cofre configurado: erro claro, sem derrubar o servidor
const semCofre = iniciar({ OBSIDIAN_VAULT: '${user_config.vault_path}', OBSIDIAN_VAULT_PATH: '', CLAUDE_PROJECT_DIR: '' }, os.tmpdir());
await semCofre.pedir('initialize', { protocolVersion: '2099-01-01' });
r = await semCofre.chamar('vault_info');
assert.ok(r.erro && /Não achei o cofre/.test(r.texto), r.texto);
semCofre.fechar();

// Sem caminho configurado, mas o Claude Code foi aberto dentro do cofre (tem .obsidian): reconhece sozinho
const pelaPasta = iniciar({ OBSIDIAN_VAULT: '', OBSIDIAN_VAULT_PATH: '', CLAUDE_PROJECT_DIR: '' }, cofre);
r = await pelaPasta.chamar('vault_info');
assert.ok(!r.erro && r.texto.includes(cofre), r.texto);
pelaPasta.fechar();

// Configuração de Notas diárias do Obsidian com modelo e formato próprios
await escrever('.obsidian/daily-notes.json', JSON.stringify({ folder: 'Diário/', format: 'YYYY/MM-MMMM/DD [de] MMMM', template: 'Modelos/Dia' }));
await escrever('Modelos/Dia.md', '# {{title}}\nCriada em {{date:DD/MM/YYYY}}\n\n## Tarefas\n');
const comConfig = iniciar({ OBSIDIAN_VAULT: cofre });
r = await comConfig.chamar('daily_note', { date: '2026-10-04', append: '- [ ] Revisar campanha', heading: 'Tarefas' });
assert.ok(!r.erro, r.texto);
const dia = await ler('Diário/2026/10-outubro/04 de outubro.md');
assert.equal(dia, '# 04 de outubro\nCriada em 04/10/2026\n\n## Tarefas\n- [ ] Revisar campanha\n');
comConfig.fechar();

await fs.rm(cofre, { recursive: true, force: true });
console.log('ok: servidor do Obsidian passou em todos os testes');
