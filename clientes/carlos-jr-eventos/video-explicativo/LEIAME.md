# Vídeo explicativo · Carlos JR Eventos (v2)

**Arquivo:** `carlos-jr-explicativo-v2.mp4` · vertical 1080×1920 · 30 fps · 26,8 s · 16 MB
**Formato:** o do vídeo de referência (`explicativoclaude.mp4`): o Carlos falando num card arredondado embaixo, painel escuro em cima com motion graphics que explicam o que ele diz, e legenda palavra por palavra no peito.

## Falas usadas (gravações do Drive, pasta Gabriel)

| Tempo | Take | Fala | Na tela |
|---|---|---|---|
| 0:00–0:04 | IMG_0916 | "Carlos JR Eventos. Tudo que você precisa para seu evento." | Vídeo cheio + título **CARLOS JR / EVENTOS** |
| 0:04–0:10,5 | IMG_0915 | "Sonorização profissional, iluminação, painel de LED, estrutura e palco." | O vídeo vira card. Cards animados 01–05 (equalizador, feixes de luz, painel de LED acendendo, treliça sendo desenhada, palco) + chips que vão sendo marcados |
| 0:10,5–0:14,9 | IMG_0915 | "Tudo para atender seu evento com maior qualidade e segurança." | Os 5 serviços convergem para **SEU EVENTO ✓**. Depois, selos **QUALIDADE** e **SEGURANÇA** (escudo com check) |
| 0:14,9–0:17,1 | IMG_0912 | "A gente tá aqui pra te atender da melhor forma possível." | Ícone de atendimento com ondas + **PRA TE ATENDER** |
| 0:17,1–0:21 | IMG_0918 | "Conte com nossa equipe, Carlos JR. Tudo para seu evento." | Equipe (3 ícones) + logo, depois os 5 ícones de serviço |
| 0:21–0:23,4 | IMG_0918 | "Atendemos Goiânia e região." | Painel cresce: mapa em perspectiva com pino, **GOIÂNIA / E REGIÃO** e anel de alcance |
| 0:23,4–0:26,8 | — | (sem fala) | Final: logo, **MONTE O SEU EVENTO**, WhatsApp (62) 99350-9592, Instagram @carlosguitarrajunior com clique em Seguir |

- O IMG_0914 é outra tentativa da mesma fala do 0915. Ficou o 0915, que está mais limpo.
- Do IMG_0912 (78 s, com várias tentativas) só entrou o trecho "A gente tá aqui pra te atender…".

## Cor (v2)
- Os vídeos do iPhone vêm em **HDR (HLG, BT.2020)**. Converter direto pra SDR estoura a luz e lava a imagem. Agora tem tone mapping: `zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`.
- Sem ajuste extra de contraste ou saturação: a imagem fica como o Carlos gravou.
- Na v1, o flash branco das transições ficava aceso a 35% por cima do vídeo (`immediateRender`). Corrigido.

## Áudio
- Voz do próprio vídeo com redução de ruído, EQ, compressor e volume padronizado (-16 LUFS).
- Efeitos sonoros discretos nas transições, sem música. A ideia é colocar um áudio em alta do Instagram baixinho na hora de postar.

## Como refazer
1. Frames do Carlos em `seq/` (com o tone mapping acima) (ver o comando ffmpeg no histórico: cortes 0916 2,55–6,48 · 0915 0,72–11,65 · 0912 34,06–36,30 · 0918 1,78–8,12).
2. `node render2.js out 0 900` (Playwright + Chromium) gera os frames do `video.html`.
3. `ffmpeg -framerate 30 -i out/%05d.jpg -i mix.wav -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -shortest saida.mp4`.
4. Legenda: tempos em `CAP` no `video.html`. A transcrição foi feita com o whisper-base (`transcrever.mjs`).

## A confirmar com o Carlos
- Ouvir o trecho de 0:15 ("A gente tá aqui pra te atender da melhor forma possível"). O áudio desse take tem conversa de bastidor em volta, então vale confirmar a frase exata.
- "Maior qualidade e segurança" e "Goiânia e região" são falas dele. Nenhum número ou depoimento foi inventado.
