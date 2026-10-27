"""Som do logo animado (tudo sintetizado): swell, pops dos pontinhos, sopro das letras, clique, sino de vidro e brilho final."""
import sys, numpy as np
from scipy.io import wavfile
SR, DUR = 48000, 5.0
a = np.zeros(int(SR * DUR))
t_ = lambda d: np.arange(int(SR * d)) / SR
def poe(t0, s, g=1.):
    i = int(t0 * SR); n = min(len(s), len(a) - i); a[i:i + n] += s[:n] * g
def sino(f, d=1.6, g=.25):
    t = t_(d); return g * np.exp(-t * 3.2) * (np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 7))
def ruido(d, lo, hi):
    n = np.random.default_rng(7).standard_normal(int(SR * d)); F = np.fft.rfft(n); fr = np.fft.rfftfreq(len(n), 1 / SR)
    F[(fr < lo) | (fr > hi)] = 0; return np.fft.irfft(F, len(n)) / 3
# swell de abertura (ar subindo) + sub-impacto quando a moldura fecha
t = t_(1.1); poe(0, ruido(1.1, 300, 5000) * (t / 1.1) ** 2 * .5)
t = t_(.9); poe(1.0, .5 * np.sin(2 * np.pi * (55 - 15 * t) * t) * np.exp(-t * 4))
for i, f in enumerate([1568, 1760, 2349]): t = t_(.12); poe(1.0 + i * .12, .18 * np.sin(2 * np.pi * f * t) * np.exp(-t * 40))   # pops dos pontinhos
for t0 in (1.25, 1.42): t = t_(.45); poe(t0, ruido(.45, 600, 7000) * np.sin(np.pi * t / .45) ** 2 * .22)   # sopro das letras
t = t_(.06); poe(2.25, ruido(.06, 1500, 9000) * np.exp(-t * 90) * 1.2)                                       # clique
for f, g in ((1318.5, .26), (1975.5, .14)): poe(2.3, sino(f, 2.2, g))                                     # sino de vidro no clique
for i, f in enumerate([2637, 3136, 3951, 4699]): poe(3.55 + i * .07, sino(f, .9, .05))                    # brilho da varredura
for k, f in enumerate((261.6, 329.6, 392.0, 523.3)):                                                       # acorde de resolução no nome
    t = t_(2.2); poe(2.6, .07 * np.sin(2 * np.pi * f * t) * np.minimum(1, t / .3) * np.exp(-t * 1.1))
# reverb simples de sala
out = a.copy()
for d, g in ((.031, .35), (.047, .3), (.071, .25), (.113, .2), (.173, .14), (.251, .1)):
    k = int(d * SR); out[k:] += a[:-k] * g
fim = int(4.4 * SR); out[fim:] *= np.linspace(1, 0, len(out) - fim)
out = out / (np.abs(out).max() + 1e-9) * .8
wavfile.write(sys.argv[1], SR, (np.stack([out, out], 1) * 32767).astype(np.int16))
