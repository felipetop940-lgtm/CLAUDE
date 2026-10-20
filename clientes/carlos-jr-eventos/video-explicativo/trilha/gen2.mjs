// Trilha de 60 s: 9 compassos suaves sob a fala (0–21,3 s) + 16 compassos completos (21,3–60 s)
import pkg from 'midi-file'; const { writeMidi } = pkg;
import fs from 'fs';
const TPB = 480, B = TPB, USPB = 591667; // 101,4 BPM → compasso de 2,3667 s; o 10º compasso cai em 21,3 s
const ev = { 0: [], 1: [], 2: [], 3: [], 9: [] };
const note = (ch, beat, dur, n, v) => { ev[ch].push([Math.round(beat * B), 'on', n, v]); ev[ch].push([Math.round((beat + dur) * B) - 1, 'off', n, 0]); };
const CH = { G: [55, 59, 62, 66], D: [57, 62, 64, 66], Em: [55, 59, 62, 64], C: [55, 59, 60, 64], Bm: [54, 57, 59, 62] };
const ROOT = { G: 43, D: 38, Em: 40, C: 36, Bm: 35 }, FIFTH = { G: 50, D: 45, Em: 47, C: 43, Bm: 42 };
const prog = ['G','Em','C','D','G','Em','C','D','C',   // 0–8 sob a fala
  'G','Em','G','D','Em','C','G','D',                   // 9–16 A
  'Em','C','C','D','Bm','Em','C','G'];                 // 17–20 B · 21–23 · 24 final
const NB = prog.length;
const sec = b => b < 9 ? 'bed' : b < 17 ? 'A' : b < 21 ? 'B' : b < 24 ? 'A2' : 'end';
for (let bar = 0; bar < NB; bar++) {
  const c = prog[bar], s = sec(bar), t = bar * 4, last = s === 'end';
  CH[c].forEach(n => note(2, t, last ? 7 : 4, n + 12, s === 'bed' ? 44 : 40));
  if (last) CH[c].forEach(n => note(0, t, 7, n, 72));
  else if (s === 'bed') [[0, 1.9, 50], [2, 1.9, 44]].forEach(([o, d, v]) => CH[c].forEach(n => note(0, t + o, d, n, v)));
  else [[0, 1.4, 72], [1.5, 0.9, 58], [2.5, 1.4, 66]].forEach(([o, d, v]) => CH[c].forEach(n => note(0, t + o, d, n, v)));
  if (last) note(1, t, 6, ROOT[c], 88);
  else if (s === 'bed') { note(1, t, 1.9, ROOT[c], 62); note(1, t + 2, 1.9, ROOT[c], 54); }
  else [[0, .75, ROOT[c], 96], [1.5, .45, ROOT[c], 78], [2, .75, ROOT[c], 90], [3, .45, FIFTH[c], 80], [3.5, .45, ROOT[c] + 12, 70]].forEach(([o, d, n, v]) => note(1, t + o, d, n, v));
  if ((s === 'A' && bar >= 13) || s === 'B') {
    const ar = [...CH[c], CH[c][1] + 12, CH[c][2] + 12];
    for (let i = 0; i < 8; i++) note(3, t + i * .5, .45, ar[[0, 2, 4, 3, 5, 3, 2, 1][i]] + 12, i % 2 ? 44 : 56);
  }
  if (last) { note(9, t, 1, 49, 88); note(9, t, .5, 36, 96); continue; }
  for (let i = 0; i < 8; i++) {
    const vb = s === 'bed' ? 30 : 50;
    if (s === 'bed' && i % 2) continue;            // sob a fala: só semínimas, bem leve
    if (!(i === 7 && bar % 2 === 1)) note(9, t + i * .5, .25, 42, i % 2 ? vb - 14 : vb + 8);
  }
  if (s !== 'bed') {
    if (bar % 2 === 1) note(9, t + 3.5, .5, 46, 52);
    note(9, t, .25, 36, 100); note(9, t + 2, .25, 36, 96);
    if (bar % 2 === 1) note(9, t + 2.5, .25, 36, 80);
    [1, 3].forEach(o => { note(9, t + o, .25, 39, 78); note(9, t + o, .25, 38, 52); });
  } else if (bar % 2 === 0) note(9, t, .25, 36, 52);
  if ([9, 17, 21].includes(bar)) note(9, t, 1, 49, 84);
  if (bar === 8) for (let i = 0; i < 8; i++) note(9, t + 2 + i * .25, .2, 38, 34 + i * 7);
  if (bar === 16 || bar === 20) for (let i = 0; i < 8; i++) note(9, t + 2 + i * .25, .2, 38, 40 + i * 7);
}
const track = (ch, prg, vol, pan, rev) => {
  const list = ev[ch].sort((a, b) => a[0] - b[0] || (a[1] === 'off' ? -1 : 1)), out = [];
  if (ch !== 9) out.push({ deltaTime: 0, channel: ch, type: 'programChange', programNumber: prg });
  out.push({ deltaTime: 0, channel: ch, type: 'controller', controllerType: 7, value: vol });
  out.push({ deltaTime: 0, channel: ch, type: 'controller', controllerType: 10, value: pan });
  out.push({ deltaTime: 0, channel: ch, type: 'controller', controllerType: 91, value: rev });
  let last = 0;
  for (const [tk, k, n, v] of list) { out.push({ deltaTime: tk - last, channel: ch, type: k === 'on' ? 'noteOn' : 'noteOff', noteNumber: n, velocity: v }); last = tk; }
  out.push({ deltaTime: 0, type: 'endOfTrack' }); return out;
};
const tempo = [{ deltaTime: 0, type: 'setTempo', microsecondsPerBeat: USPB }, { deltaTime: 0, type: 'timeSignature', numerator: 4, denominator: 4, metronome: 24, thirtyseconds: 8 }, { deltaTime: 0, type: 'endOfTrack' }];
fs.writeFileSync('trilha60.mid', Buffer.from(writeMidi({ header: { format: 1, numTracks: 6, ticksPerBeat: TPB }, tracks: [tempo, track(0, 4, 92, 54, 60), track(1, 33, 104, 64, 20), track(2, 89, 70, 64, 90), track(3, 27, 62, 84, 70), track(9, 0, 96, 64, 40)] })));
console.log('compassos', NB, 'duração ~', (NB * 4 * USPB / 1e6).toFixed(1), 's');
