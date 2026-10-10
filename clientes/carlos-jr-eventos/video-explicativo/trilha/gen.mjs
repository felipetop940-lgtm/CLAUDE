import pkg from 'midi-file'; const { writeMidi } = pkg;
import fs from 'fs';
const TPB = 480, B = TPB; // ticks por tempo
const ev = { 0: [], 1: [], 2: [], 3: [], 9: [] };
const note = (ch, beat, dur, n, v) => { ev[ch].push([Math.round(beat * B), 'on', n, v]); ev[ch].push([Math.round((beat + dur) * B) - 1, 'off', n, 0]); };
const CH = { G: [55, 59, 62, 66], D: [57, 62, 64, 66], Em: [55, 59, 62, 64], C: [55, 59, 60, 64], Bm: [54, 57, 59, 62] };
const ROOT = { G: 43, D: 38, Em: 40, C: 36, Bm: 35 };
const FIFTH = { G: 50, D: 45, Em: 47, C: 43, Bm: 42 };
// 16 compassos: intro 2 · A 8 · B 4 · final 2
const prog = ['G','Em','G','D','Em','C','G','D','Em','C','C','D','Bm','Em','C','G'];
const sec = b => b < 2 ? 'intro' : b < 10 ? 'A' : b < 14 ? 'B' : 'out';
for (let bar = 0; bar < 16; bar++) {
  const c = prog[bar], s = sec(bar), t = bar * 4, last = bar === 15;
  // pad (cordas quentes), sempre
  CH[c].forEach(n => note(2, t, last ? 6 : 4, n + 12, s === 'intro' ? 46 : 40));
  // piano elétrico
  if (last) CH[c].forEach(n => note(0, t, 6, n, 74));
  else if (s === 'intro') CH[c].forEach(n => note(0, t, 3.8, n, 60));
  else [[0, 1.4, 72], [1.5, 0.9, 58], [2.5, 1.4, 66]].forEach(([o, d, v]) => CH[c].forEach(n => note(0, t + o, d, n, v)));
  // baixo
  if (last) note(1, t, 5, ROOT[c], 90);
  else if (s !== 'intro') [[0, .75, ROOT[c], 96], [1.5, .45, ROOT[c], 78], [2, .75, ROOT[c], 90], [3, .45, FIFTH[c], 80], [3.5, .45, ROOT[c] + 12, 70]].forEach(([o, d, n, v]) => note(1, t + o, d, n, v));
  // guitarra limpa em arpejo (2ª metade do A e no B)
  if ((s === 'A' && bar >= 6) || s === 'B') {
    const ar = [...CH[c], CH[c][1] + 12, CH[c][2] + 12];
    for (let i = 0; i < 8; i++) note(3, t + i * .5, .45, ar[[0, 2, 4, 3, 5, 3, 2, 1][i]] + 12, i % 2 ? 44 : 56);
  }
  // bateria (canal 10)
  if (last) { note(9, t, 1, 49, 90); note(9, t, .5, 36, 100); continue; }
  for (let i = 0; i < 8; i++) {
    const vb = s === 'intro' ? 38 : 50;
    if (!(i === 7 && bar % 2 === 1)) note(9, t + i * .5, .25, 42, i % 2 ? vb - 14 : vb + 8);
  }
  if (bar % 2 === 1 && s !== 'intro') note(9, t + 3.5, .5, 46, 52);
  if (s !== 'intro') {
    note(9, t, .25, 36, 100); note(9, t + 2, .25, 36, 96);
    if (bar % 2 === 1) note(9, t + 2.5, .25, 36, 80);
    [1, 3].forEach(o => { note(9, t + o, .25, 39, 78); note(9, t + o, .25, 38, 52); });
  }
  if ([2, 10, 14].includes(bar)) note(9, t, 1, 49, 82);
  if (bar === 1 || bar === 9) for (let i = 0; i < 8; i++) note(9, t + 2 + i * .25, .2, 38, 40 + i * 7);
}
const track = (ch, prog, vol, pan, rev) => {
  const list = ev[ch].sort((a, b) => a[0] - b[0] || (a[1] === 'off' ? -1 : 1));
  const out = [];
  if (ch !== 9) out.push({ deltaTime: 0, channel: ch, type: 'programChange', programNumber: prog });
  out.push({ deltaTime: 0, channel: ch, type: 'controller', controllerType: 7, value: vol });
  out.push({ deltaTime: 0, channel: ch, type: 'controller', controllerType: 10, value: pan });
  out.push({ deltaTime: 0, channel: ch, type: 'controller', controllerType: 91, value: rev });
  let last = 0;
  for (const [tk, k, n, v] of list) { out.push({ deltaTime: tk - last, channel: ch, type: k === 'on' ? 'noteOn' : 'noteOff', noteNumber: n, velocity: v }); last = tk; }
  out.push({ deltaTime: 0, type: 'endOfTrack' });
  return out;
};
const tempo = [{ deltaTime: 0, type: 'setTempo', microsecondsPerBeat: 600000 }, { deltaTime: 0, type: 'timeSignature', numerator: 4, denominator: 4, metronome: 24, thirtyseconds: 8 }, { deltaTime: 0, type: 'endOfTrack' }];
const data = { header: { format: 1, numTracks: 6, ticksPerBeat: TPB }, tracks: [tempo, track(0, 4, 92, 54, 60), track(1, 33, 104, 64, 20), track(2, 89, 70, 64, 90), track(3, 27, 62, 84, 70), track(9, 0, 96, 64, 40)] };
fs.writeFileSync('trilha.mid', Buffer.from(writeMidi(data)));
console.log('ok');
