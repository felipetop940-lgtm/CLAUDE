import fs from 'fs/promises';
import { BasicMIDI, SoundBankLoader, SpessaSynthProcessor, SpessaSynthSequencer, audioToWav } from 'spessasynth_core';
const [sfp, midp, outp] = process.argv.slice(2);
const sf = await fs.readFile(sfp), mid = await fs.readFile(midp);
const midi = BasicMIDI.fromArrayBuffer(mid.buffer.slice(mid.byteOffset, mid.byteOffset + mid.byteLength));
const bank = SoundBankLoader.fromArrayBuffer(sf.buffer.slice(sf.byteOffset, sf.byteOffset + sf.byteLength));
const SR = 48000;
const synth = new SpessaSynthProcessor(SR, { eventsEnabled: false });
synth.soundBankManager.addSoundBank(bank, 'main');
await synth.processorInitialized;
synth.setSystemParameter?.('autoAllocateVoices', true);
const seq = new SpessaSynthSequencer(synth);
seq.loadNewSongList([midi]); seq.play();
const N = Math.ceil(SR * (midi.duration + 3));
const L = new Float32Array(N), R = new Float32Array(N);
let f = 0;
while (f < N) { seq.processTick(); const b = Math.min(128, N - f); synth.process(L, R, f, b); f += b; }
await fs.writeFile(outp, new Uint8Array(audioToWav([L, R], SR)));
console.log('dur', midi.duration);
