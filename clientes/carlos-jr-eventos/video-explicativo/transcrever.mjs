import { pipeline, env } from '@huggingface/transformers';
import fs from 'fs';
env.localModelPath = new URL('./node_modules/sts-whisper-base/models/', import.meta.url).pathname;
env.allowRemoteModels = false;
const wav = fs.readFileSync(process.argv[2]);
const data = new Int16Array(wav.buffer, wav.byteOffset + 44, (wav.length - 44) / 2);
const all = Float32Array.from(data, v => v / 32768);
const segs = JSON.parse(process.argv[3]);
const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', { dtype: 'q8' });
const out = [];
for (const [a, b] of segs) {
  const f = all.slice(Math.round(a * 16000), Math.round(b * 16000));
  const r = await asr(f, { language: 'portuguese', task: 'transcribe', return_timestamps: 'word' });
  const w = r.chunks.map(c => [+(c.timestamp[0] + a).toFixed(2), +((c.timestamp[1] ?? c.timestamp[0]) + a).toFixed(2), c.text.trim()]);
  console.log(`[${a}-${b}]`, w.map(x => `${x[2]}@${x[0]}`).join(' '));
  out.push(...w);
}
fs.writeFileSync(process.argv[4], JSON.stringify(out));
