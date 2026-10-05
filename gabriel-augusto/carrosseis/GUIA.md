# Carrossel diário do Instagram (sites)

Todo dia de manhã sai um carrossel pronto pra postar: imagens 1080x1350 (4:5) + legenda.
A rotina agendada dispara nesta conversa; ele não precisa rodar nada.

## Passo a passo de cada dia

1. `git pull` na branch de trabalho.
2. Tema: o que ele pediu no chat (prioridade) ou o próximo `pendente` da `PAUTA.md`.
3. Criar `cNN-slug/carrossel.html` copiando a estrutura do `c01-link-na-bio` (usa `../base.css` e `../base.js`).
4. Gerar: `PWPATH=$(npm root -g)/playwright node render.js cNN-slug` → `saida/cNN-slug/01.jpg…` + `saida/cNN-slug.zip`.
   Se aparecer **AVISOS**, algo vazou do slide: corrigir e gerar de novo.
5. Abrir **todas** as imagens e revisar: texto encostando, acento colado, elemento cortado, slide vazio ou poluído.
6. Escrever `cNN-slug/legenda.md` (modelo do c01) e marcar o tema como `feito DD/MM` na pauta.
7. Commit + push.
8. Enviar pra ele: as imagens na ordem + a legenda pronta no texto da mensagem, pra copiar e colar.

## Estrutura (6 a 8 slides)

1. **Capa:** gancho polêmico ou curioso, título enorme, 1 frase de apoio, "Arrasta". Tudo dentro do recorte 3:4 da grade.
2. a 5. **Desenvolvimento:** uma ideia por slide. Título curto + um bloco visual (tabela, comparação, lista, celular com site real).
6. **Prova ou preço:** site real no celular, ou planos (Essencial R$ 300 / Premium Page R$ 500), ou "a partir de R$ 300".
7. **CTA:** pergunta pra gerar comentário (caixa `.ask`) + "Toque no link da bio" + algo pra salvar/compartilhar.

## Regras fixas

- Tema escuro com variação sutil entre slides (`bg-aura`, `bg-ink`, `bg-blue`, `bg-grid`, `bg-gold`, `bg-beam`). Nunca fundo claro.
- Cores: preto, branco, dourado, azul; **detalhes em vermelho** (etiqueta, sublinhado `.u`, ponto do rodapé). Vermelho no título só para o "problema".
- Sem rosto dele, sem emoji nas artes (na legenda pode, com moderação), sem poluição: no máximo 1 bloco visual por slide.
- Títulos (`.H`): quebrar linhas com `<br>` só no nível de cima do título; no máximo 3 linhas. O `base.js` dá respiro sozinho nas linhas com acento.
- **Não inventar** dados, números, depoimentos ou clientes. Preços e prazos só os reais:
  Essencial R$ 300 (2 rodadas, 2 a 7 dias, vídeo opcional +R$ 38) · Premium Page R$ 500 (domínio .com.br + vídeo inclusos, até 5 rodadas, 2 a 5 dias).
- O conteúdo empurra para o **Premium Page** quando o assunto permitir.
- Prints de site liberados: `../destaques/stories/img/ga-topo.jpg`, `ga-premium.jpg` (site dele) e `fernando-topo.jpg` (Dr. Fernando).
  Dr. Renato **só** quando ele liberar (ficou fora do pacote de publicação).
- Legenda: gancho na 1ª linha, 3 a 5 parágrafos curtos, pergunta pra comentar, CTA pro link da bio, 5 hashtags.

## Ajustes que ele pediu (aplicar em todos os próximos)

- (vazio por enquanto: anotar aqui cada crítica dele sobre os carrosséis)
