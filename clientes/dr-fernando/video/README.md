# Dr. Fernando Augusto de Oliveira — vídeo institucional (Reels)

Vídeo vertical 1080x1920, 30 fps, 25 s, sem falas, com legendas discretas. Saída: `drfernando-v10.mp4` (v10: base v8 sem o trecho dele manipulando o chip antes de inserir; mantém ele inserindo).

## Regras do cliente
- **Não mostrar a pedra da bancada** (granito). Os planos com bancada foram recortados ou ficaram de fora.
- A paciente pode aparecer sem desfoque (ela autorizou a filmagem). Ela fica em quadro para mostrar o atendimento.
- Sem falas. As legendas são poucas e discretas, e o foco fica no vídeo.
- Não mostrar a instrumentadora colocando o implante na mão dele, nem ele segurando o implante (IMG_0757 de 0 a 5 s), nem o close de perfil com o implante na mão (IMG_0756), nem ele manipulando o chip com as mãos antes de inserir (IMG_0757 ~5-8 s). Ele inserindo pode aparecer (IMG_0757 13 s, 16 s e 20 s).
- Legendas seguem a ordem pedida pelo médico: indicação correta (a mais importante) → técnica → finalização.

## Material bruto
Fica na pasta do Drive "Gabriel" (8 vídeos .MOV 4K HDR HLG + 12 fotos .HEIC). O material não fica no repositório por causa do tamanho (~860 MB).

## Como refazer
```bash
python3 -I motor/heic2jpg.py <drive> <fotos>                    # HEIC -> JPG
python3 motor/extrair.py <drive> <seg>                          # recorta + HDR->SDR (1188x2112 @60fps)
python3 motor/audio.py trilha.wav                                # trilha original sintetizada + efeitos
python3 motor/render.py <seg> <fotos> <fontes> video_mudo.mp4    # edição, grade (motor/grade.py), motion graphics
# mais rápido: motor/render_par.sh video_mudo.mp4  (4 partes em paralelo, ~3 min)
ffmpeg -i video_mudo.mp4 -i trilha.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart drfernando.mp4
```
- `motor/timeline.py`: planos (arquivo, início, velocidade, recorte, zoom), transições, legendas, nome e cartela final.
- Fontes: Inter (sistema) e Cormorant Garamond (Google Fonts, OFL), baixada em `<fontes>/CormorantGaramond.ttf`.
- Dependências: ffmpeg com zscale, `opencv-python-headless`, `scipy`, `pillow`, `pillow-heif`.

## Pendências para a versão final
- CRM-GO 29.367 aplicado (lower third e cartela). RQE só se a especialidade for citada.
