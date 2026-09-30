// Transcreve a gravação com tempo por palavra (Whisper base, local) para montar roteiros/vNN-cortes.json.
// Uso: node transcrever.mjs voz.mp4 [saida.json]   → imprime as falas com [ini, fim] e salva as palavras em JSON
import { execFileSync } from 'child_process';
import fs from 'fs';

const R = execFileSync('npm', ['root', '-g']).toString().trim();
const { pipeline, env } = await import(`${R}/@huggingface/transformers/dist/transformers.node.mjs`);
env.localModelPath = `${R}/sts-whisper-base/models/`; env.allowRemoteModels = false;

const [arq, saida] = process.argv.slice(2);
if (!arq) { console.error('uso: node transcrever.mjs voz.mp4 [saida.json]'); process.exit(1); }
const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', arq, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
const pcm = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);

const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', { dtype: 'q8' });
const r = await asr(pcm, { language: 'portuguese', task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5 });
const palavras = r.chunks.map(c => ({ t: c.text.trim(), ini: c.timestamp[0], fim: c.timestamp[1] }));

// Frases: quebra em pausa > 0,6 s ou pontuação final, para achar os takes
let frase = [];
const fecha = () => { if (frase.length) console.log(`[${frase[0].ini.toFixed(2)}, ${frase.at(-1).fim.toFixed(2)}]  ${frase.map(p => p.t).join(' ')}`); frase = []; };
palavras.forEach((p, i) => { frase.push(p); const prox = palavras[i + 1]; if (!prox || prox.ini - p.fim > 0.6 || /[.?!]$/.test(p.t)) fecha(); });
if (saida) fs.writeFileSync(saida, JSON.stringify(palavras, null, 1));
