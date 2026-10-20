// node dn.mjs entrada.f32 saida.f32 [atenuação dB]
import fs from 'fs';
import { DeepFilter } from '@lofcz/deepfilternet-web';
const [inp, out, att] = process.argv.slice(2);
const wasmPath = new URL('./node_modules/@lofcz/deepfilternet-web/dist/df_bg.wasm', import.meta.url);
const mod = await WebAssembly.compile(fs.readFileSync(wasmPath));
const df = await DeepFilter.create({ wasmUrl: mod, attenuationLimit: att ? +att : 100 });
const buf = fs.readFileSync(inp); const x = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const N = df.frameLength, pad = N * 8;
const src = new Float32Array(x.length + pad); src.set(x);
const y = new Float32Array(src.length);
for (let i = 0; i + N <= src.length; i += N) y.set(df.process(src.subarray(i, i + N)), i);
fs.writeFileSync(out, Buffer.from(y.buffer));
console.log('frame', N, 'samples', x.length);
