# Dr. Fernando Augusto de Oliveira — vídeo institucional (Reels)

Vídeo vertical 1080x1920, 30 fps, 25 s, sem falas, com legendas discretas. Saída: `drfernando-v2.mp4`.

## Regras do cliente
- **Não mostrar a pedra da bancada** (granito). Os planos com bancada foram recortados ou ficaram de fora.
- A paciente pode aparecer sem desfoque (ela autorizou a filmagem). Ela fica em quadro para mostrar o atendimento.
- Sem falas. As legendas são poucas e discretas, e o foco fica no vídeo.

## Material bruto
Fica na pasta do Drive "Gabriel" (8 vídeos .MOV 4K HDR HLG + 12 fotos .HEIC). O material não fica no repositório por causa do tamanho (~860 MB).

## Como refazer
```bash
python3 -I motor/heic2jpg.py <drive> <fotos>                    # HEIC -> JPG
python3 motor/extrair.py <drive> <seg>                          # recorta + HDR->SDR (1188x2112 @60fps)
python3 motor/audio.py trilha.wav                                # trilha original sintetizada + efeitos
python3 motor/render.py <seg> <fotos> <fontes> video_mudo.mp4    # edição, grade, motion graphics
ffmpeg -i video_mudo.mp4 -i trilha.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart drfernando.mp4
```
- `motor/timeline.py`: planos (arquivo, início, velocidade, recorte, zoom), transições, legendas, nome e cartela final.
- Fontes: Inter (sistema) e Cormorant Garamond (Google Fonts, OFL), baixada em `<fontes>/CormorantGaramond.ttf`.
- Dependências: ffmpeg com zscale, `opencv-python-headless`, `scipy`, `pillow`, `pillow-heif`.

## Pendências para a versão final
- CRM (e RQE, se a especialidade for citada). A Resolução CFM 2.336/2023 exige esses dados em publicidade médica.
