#!/bin/bash
# Prepara cada sessão na nuvem para os vídeos curtos: bibliotecas do gerador,
# ffmpeg, voz-guia (Kokoro) e transcrição (Whisper). Pode rodar várias vezes.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

# Python: gerar.py e capa.py
pip3 install -q --root-user-action=ignore numpy soundfile scipy imageio-ffmpeg noisereduce kokoro-onnx pillow

# ffmpeg no PATH (binário do imageio-ffmpeg)
ln -sf "$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')" /usr/local/bin/ffmpeg

# Voz-guia Kokoro (pm_alex) em ~/.cache/kokoro
K="$HOME/.cache/kokoro"
U=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
mkdir -p "$K"
baixar() { [ -s "$K/$2" ] || { curl -sSfL -o "$K/$2.tmp" "$U/$1" && mv "$K/$2.tmp" "$K/$2"; }; }
baixar kokoro-v1.0.fp16.onnx kokoro-fp16.onnx
baixar voices-v1.0.bin voices2.bin

# Node: Playwright (render dos quadros) + Whisper base (transcrever.mjs)
R="$(npm root -g)"
[ -d "$R/playwright" ] || npm i -g --no-audit --no-fund playwright@1.56.1
if [ ! -d "$R/sts-whisper-base" ] || [ ! -d "$R/@huggingface/transformers" ]; then
  npm i -g --ignore-scripts --no-audit --no-fund sts-whisper-base @huggingface/transformers
fi
