# Plugin Obsidian para o Claude Code

Liga o Claude ao seu cofre do Obsidian. Ele lê e escreve direto nos arquivos `.md` do seu computador (não precisa do Obsidian aberto, nada vai para servidor de terceiros).

## Instalar

Requisito: Node.js 18+ (`node -v` no terminal; se não tiver, instale em nodejs.org).

No Claude Code:

```
/plugin marketplace add felipetop940-lgtm/claude
/plugin install obsidian@felipe-plugins
```

Ele pede a **pasta do cofre** (no Obsidian: clique com o direito no nome do cofre → Mostrar no Finder/Explorer). Reinicie a sessão e rode `/obsidian:configurar`.

Pelo terminal dá para instalar já configurado:
`claude plugin install obsidian@felipe-plugins --config vault_path="/caminho/do/cofre"`.

Enquanto o plugin estiver só na branch de trabalho, adicione o marketplace com a branch: `/plugin marketplace add felipetop940-lgtm/claude#claude/sleepy-cannon-anakfv`.

## Comandos

| Comando | O que faz |
|---|---|
| `/obsidian:configurar` | Confere o cofre, cria o `Claude.md` com as regras e a estrutura de pastas (só em cofre vazio) |
| `/obsidian:capturar <texto>` | Anota ideia, tarefa ou insight — frase curta vai para a nota do dia, ideia com corpo vira nota na Entrada com links |
| `/obsidian:diario [texto \| abrir \| fechar]` | Registra no dia, abre o dia puxando pendências de ontem ou fecha o dia |
| `/obsidian:reuniao <cliente> <anotações>` | Reunião de resultado: nota com números, decisões, próximos passos, pendências da anterior, sinais de risco/upsell e mensagem de follow-up para o WhatsApp |
| `/obsidian:perguntar <pergunta>` | Responde com base nas suas notas, citando cada uma |
| `/obsidian:semana [data]` | Revisão semanal: placar, tarefas abertas, 3 prioridades e uma leitura honesta de foco |
| `/obsidian:organizar [pasta]` | Propõe destino, nome, tags e links para a Entrada e só executa depois do seu ok |

Não precisa decorar: "anota aí que…", "registra a reunião com a Dra. X", "o que eu decidi com o cliente Y?" já acionam o plugin.

## Opções (`/plugin` → obsidian → configurar)

- **Pasta do cofre** (obrigatória)
- **Pasta de entrada** — padrão `00 Entrada`
- **Pasta das notas diárias** — vazio segue a configuração de Notas diárias do Obsidian (pasta, formato e modelo); sem configuração lá, usa `10 Diário`

## Regras próprias do cofre

Crie `Claude.md` na raiz do cofre (o `/obsidian:configurar` cria um modelo). O Claude lê esse arquivo antes de escrever e ele vale mais que as regras do plugin: pastas, tipos de nota, pessoas, estilo.

## Como funciona

- `server/obsidian-mcp.mjs`: servidor MCP sem dependências com 12 ferramentas — `vault_info`, `list_notes`, `read_note`, `search_notes`, `create_note`, `append_to_note`, `edit_note`, `set_properties`, `daily_note`, `list_tags`, `get_links`, `move_note` (atualiza os `[[links]]` como o Obsidian). Não existe ferramenta de apagar, e pastas ocultas (`.obsidian`) ficam de fora.
- `skills/`: os comandos acima e a skill `obsidian` com as regras de escrita (propriedades, tags, links, tarefas).
- Teste: `node tests/teste-servidor.mjs` · validação: `claude plugin validate .`
