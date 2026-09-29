# Vídeos curtos (TikTok / Reels / Shorts)

Modelo reutilizável: cada vídeo novo é só um roteiro em `roteiros/*.json`.

```bash
cd ferramentas
python3 gerar.py ../roteiros/v01-clientes.json   # → saida/v01-clientes.mp4
```

## Estilo
Fundo preto, bonecos brancos em silhueta com brilho (originais, desenhados em SVG), títulos em caixa alta
(Anton) com destaques em pincel (Permanent Marker), trilha original com efeitos nos cortes. 1080×1920, 30 fps.

## Roteiro
- `texto`: linhas. `~palavra~` vermelho · `*palavra*` dourado · `_palavra_` azul · `#palavra#` faixa branca. Vale para várias palavras: `*site profissional*`.
- `boneco`: um objeto ou uma lista (comparações). `pose`: triste, pensando, apontando, comemorando, celular, chocado. `emocao`: chuva, interrogacao, exclamacao, suor, brilho. `rotulo` + `corRotulo` escrevem acima do boneco.
- `prop`: zero, curtidas, busca, checklist, notificacoes, cta.
- `fx`: tremer, zoom, flash · `acento`: red, gold, blue (cor da luz de fundo) · `dur` em segundos.

A trilha é original (sem direitos autorais). Para usar um som em alta, adicione-o no próprio app ao postar.
