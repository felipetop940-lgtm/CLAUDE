// Copia o plugin para dentro de um cofre que é repositório Git, para ele funcionar nas sessões
// do Claude Code na nuvem: lá plugins não carregam, mas o .mcp.json e o .claude/skills/ do repositório sim.
// Uso: node plugins/obsidian/scripts/instalar-no-cofre.mjs /caminho/do/cofre
// Rode de novo sempre que mudar o servidor ou as skills, e faça commit no cofre.
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cofre = process.argv[2] && path.resolve(process.argv[2]);
if (!cofre || !existsSync(path.join(cofre, '.obsidian'))) {
  console.error('Informe a pasta de um cofre do Obsidian (precisa ter .obsidian).');
  process.exit(1);
}

const lerJson = async (arquivo) => {
  try {
    return JSON.parse(await fs.readFile(arquivo, 'utf8'));
  } catch {
    return {};
  }
};
const gravarJson = (arquivo, dados) => fs.writeFile(arquivo, `${JSON.stringify(dados, null, 2)}\n`);

// Servidor
await fs.mkdir(path.join(cofre, '.claude', 'obsidian'), { recursive: true });
await fs.copyFile(path.join(PLUGIN, 'server', 'obsidian-mcp.mjs'), path.join(cofre, '.claude', 'obsidian', 'obsidian-mcp.mjs'));

// Skills: fora do plugin os comandos ficam sem o prefixo "obsidian:"
const skills = await fs.readdir(path.join(PLUGIN, 'skills'));
for (const nome of skills) {
  const texto = await fs.readFile(path.join(PLUGIN, 'skills', nome, 'SKILL.md'), 'utf8');
  await fs.mkdir(path.join(cofre, '.claude', 'skills', nome), { recursive: true });
  await fs.writeFile(path.join(cofre, '.claude', 'skills', nome, 'SKILL.md'), texto.replace(/\/obsidian:/g, '/'));
}

// .mcp.json do projeto
const mcp = await lerJson(path.join(cofre, '.mcp.json'));
mcp.mcpServers = { ...(mcp.mcpServers ?? {}), obsidian: { command: 'node', args: ['.claude/obsidian/obsidian-mcp.mjs'] } };
await gravarJson(path.join(cofre, '.mcp.json'), mcp);

// Liga o servidor do .mcp.json sem pedir aprovação e libera as ferramentas dele
const caminhoSettings = path.join(cofre, '.claude', 'settings.json');
const settings = await lerJson(caminhoSettings);
settings.enabledMcpjsonServers = [...new Set([...(settings.enabledMcpjsonServers ?? []), 'obsidian'])];
settings.permissions = settings.permissions ?? {};
settings.permissions.allow = [...new Set([...(settings.permissions.allow ?? []), 'mcp__obsidian'])];
await gravarJson(caminhoSettings, settings);

console.log(`Plugin copiado para ${cofre}: servidor, ${skills.length} skills, .mcp.json e .claude/settings.json.`);
