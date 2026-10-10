# Vídeo explicativo · Carlos JR Eventos (v4)

**Arquivo:** `carlos-jr-explicativo-v4.mp4` · vertical 1080×1920 · 30 fps · **59,9 s** · 27 MB

Tem duas partes:
1. **0:00–0:21, o Carlos falando** no formato do vídeo de referência: ele num card arredondado, motion graphics explicando a fala em cima e legenda palavra por palavra.
2. **0:21–1:00, a parte explicativa com música**, sem fala. É o motion com os vídeos reais de casamento e congresso (bastidores, entregas, casamentos, congressos, shows, 5 soluções), e termina no Instagram e no WhatsApp.

## Parte 1 · falas usadas

| Tempo | Take | Fala | Na tela |
|---|---|---|---|
| 0:00–0:04 | IMG_0916 | "Carlos JR Eventos. Tudo que você precisa para seu evento." | Vídeo cheio + título CARLOS JR / EVENTOS |
| 0:04–0:10,5 | IMG_0915 | "Sonorização profissional, iluminação, painel de LED, estrutura e palco." | Card + cards animados 01–05 e chips marcados |
| 0:10,5–0:14,9 | IMG_0915 | "Tudo para atender seu evento com maior qualidade e segurança." | Serviços convergem para SEU EVENTO ✓ · selos QUALIDADE e SEGURANÇA |
| 0:14,9–0:18,7 | IMG_0918 | "Conte com nossa equipe, Carlos JR. Tudo para seu evento." | Equipe + logo · 5 ícones de serviço |
| 0:18,7–0:21,2 | IMG_0918 | "Atendemos Goiânia e região." | Mapa com pino e anel **GOIÁS** / E REGIÃO (legenda também em "Goiás", a pedido) |

- O trecho do IMG_0912 ("a gente tá aqui pra te atender") saiu porque era uma pessoa do fundo falando.
- O IMG_0914 repete a fala do 0915 e não entrou.

## Parte 2 · explicativo com música (`video-parte2.html`, motion v2 adaptado)

| Tempo | Cena |
|---|---|
| 0:21–0:25 | Mosaico 2×2 de fotos (palco, LED estrela, treliça, XV anos) entrando uma a uma + **COMO A GENTE TRABALHA.** (substituiu a íris) |
| 0:25–0:31 | BASTIDORES: luz programada, equipe no comando, captação de áudio e vídeo |
| 0:31–0:37 | O QUE A GENTE ENTREGA: painel de LED, som & luz, estrutura & energia (gerador) |
| 0:37–0:44 | CASAMENTOS: painel de LED, luz cênica, som, o momento é deles |
| 0:44–0:50 | CONGRESSOS: projeção nítida, operação técnica (clipe dos monitores, para não repetir a sala técnica dos bastidores), do começo ao fim |
| 0:50–0:53 | SHOWS & FESTAS: 3 fotos |
| 0:53–0:56 | 5 SOLUÇÕES. UM SÓ CONTATO. |
| 0:56–1:00 | Palco, logo, @carlosguitarrajunior (Seguir → Seguindo), (62) 99350-9592 |

## Áudio
- Voz do Carlos tratada (redução de ruído, EQ, compressor, -16 LUFS) + efeitos discretos na parte 1.
- **Trilha original**, composta pra este vídeo (`trilha/`): pop instrumental leve a 100 BPM (piano elétrico, baixo, pad, guitarra limpa e bateria suave). Entra na transição para a parte 2 e termina num acorde final junto do CTA. Foi renderizada com o banco de sons GeneralUser GS, que é livre para uso comercial. Por isso não tem risco de direito autoral.
  - Refazer: `node gen.mjs` (gera `trilha.mid`) → `node render.mjs GeneralUser.sf2 trilha.mid trilha.wav` (npm: `midi-file`, `spessasynth_core`, `generaluser`).

## Cor
- Os vídeos do iPhone vêm em HDR (HLG). A conversão usa tone mapping (`zscale … tonemap=hable`) para não estourar a luz. Sem ajuste extra de contraste.

## Como refazer
1. Frames do Carlos (0916 2,55–6,48 · 0915 0,72–11,65 · 0918 1,78–8,97) com o tone mapping → `seq/`.
2. `node render2.js out 0 700` → frames da parte 1 (`video.html`, 22 s).
3. Parte 2: `video-parte2.html` (na pasta do motion, com `seq/` e `img/`) renderizado a partir do frame 90.
4. ffmpeg: `xfade=fade:duration=0.5:offset=21.3` entre as partes + mix (voz, efeitos, trilha com `adelay=21300`), x264 em 2 passadas a 3,4 Mbps.

## A confirmar com o Carlos
- "Luz programada", "equipe no comando", "operação técnica do começo ao fim" e "5 soluções num só contato" são textos do motion. Ele precisa confirmar que são verdade.

## Mudanças da v4
- Os selos QUALIDADE/SEGURANÇA não ficam mais por cima da cena "Nossa equipe".
- O clipe da sala técnica não se repete mais (Bastidores 03 e Congressos 02 usavam o mesmo).
- "Goiânia" virou "Goiás" no mapa e na legenda.
- A abertura da parte 2 com a íris laranja saiu. No lugar entrou um mosaico de fotos com o título "Como a gente trabalha."
