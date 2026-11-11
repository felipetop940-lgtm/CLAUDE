"""Trilha original sintetizada (96 BPM, compasso = 2,5 s) + efeitos sincronizados às transições."""
import sys, os, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from timeline import TRANS, NAME, END, starts

SR = 48000
ST, TOTAL = starts()
N = int((TOTAL + .2) * SR)
BEAT = .625
rng = np.random.RandomState(3)
L = np.zeros((2, N), np.float32)


def put(sig, t, g=1., pan=0.):
    sig = np.atleast_2d(sig)
    if sig.shape[0] == 1: sig = np.vstack([sig, sig])
    i = int(t * SR)
    if i < 0: sig = sig[:, -i:]; i = 0
    n = min(sig.shape[1], N - i)
    if n <= 0: return
    gl, gr = g * np.sqrt((1 - pan) / 2) * 1.414, g * np.sqrt((1 + pan) / 2) * 1.414
    L[0, i:i + n] += sig[0, :n] * gl; L[1, i:i + n] += sig[1, :n] * gr


def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], "band", fs=SR, output="sos"), x)
def tt(d): return np.arange(int(d * SR)) / SR


def adsr(n, a, r, total):
    e = np.ones(n, np.float32); ia, ir = int(a * SR), int(r * SR)
    e[:ia] = np.linspace(0, 1, ia) ** 2
    ir = min(ir, n); e[n - ir:] *= np.linspace(1, 0, ir) ** 2
    return e


def pad_note(m, d):
    t = tt(d); out = np.zeros((2, len(t)))
    for ch, det in enumerate((-5, 5)):
        f = mtof(m) * 2 ** (det / 1200)
        s = sum(np.sin(2 * np.pi * f * k * t + rng.rand() * 6) / k ** 1.3 for k in range(1, 9))
        s *= 1 + .15 * np.sin(2 * np.pi * .3 * t + ch)
        out[ch] = lp(s, 1400)
    return out * adsr(len(t), .9, 1.4, d)


def pluck(m, d=1.2):
    t = tt(d); f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t) + .08 * np.sin(6 * np.pi * f * t)
    e = np.exp(-t / .28) * np.minimum(1, t / .004); e[-200:] *= np.linspace(1, 0, 200)
    return lp(s * e, 3800)


def kick():
    t = tt(.45); f = 48 + 70 * np.exp(-t / .045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / .16) * np.minimum(1, t / .002)


def hat():
    t = tt(.06); return hp(rng.randn(len(t)), 7500) * np.exp(-t / .014) * np.minimum(1, t / .0015)


def whoosh(d=.55, bright=1., peak=.6):
    t = tt(d); n = rng.randn(len(t))
    e = np.where(t < d * peak, (t / (d * peak)) ** 2.2, ((d - t) / (d * (1 - peak))) ** 1.6)
    dark, br = bp(n, 250, 1400), bp(n, 1200, 6500 * bright)
    mix = dark * (1 - e) + br * e
    out = mix * e
    return np.vstack([out, np.roll(out, 90)]) * 1.0


def shimmer(d=1.6):
    t = tt(d); s = np.zeros(len(t))
    for _ in range(9):
        f = rng.uniform(2200, 5200); s += np.sin(2 * np.pi * f * t + rng.rand() * 6) * rng.uniform(.3, 1)
    e = np.minimum(1, t / .05) * np.exp(-t / .5)
    return s * e / 6


def boom():
    t = tt(1.8); f = 34 + 40 * np.exp(-t / .12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .55)
    s += lp(rng.randn(len(t)), 900) * np.exp(-t / .12) * .25
    return s * np.minimum(1, t / .004)


def riser(d=2.2):
    t = tt(d); n = rng.randn(len(t))
    e = (t / d) ** 2.6
    a, b = bp(n, 400, 2000), bp(n, 2500, 9000)
    x = (a * (1 - t / d) + b * (t / d)) * e
    return x


def tick(f=2600):
    t = tt(.25); return np.sin(2 * np.pi * f * t) * np.exp(-t / .045) + .4 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t / .03)


# ---------------------------------------------------------------- música
CH = {"Bm9": [47, 62, 66, 69, 73], "G7M": [43, 59, 62, 66, 69], "Dadd9": [38, 57, 62, 64, 66], "Asus": [45, 57, 62, 64, 69]}
PROG = ["Bm9", "G7M", "Dadd9", "Asus"]
mus = np.zeros((2, N))


def mput(sig, t, g=1., pan=0.):
    global L
    keep = L; L = mus; put(sig, t, g, pan); L = keep


bars = int(END["t0"] / 2.5)  # 8 compassos até a cartela
for b in range(bars):
    ch = CH[PROG[b % 4]]; t0 = b * 2.5
    for m in ch: mput(pad_note(m, 2.5 + 1.2), t0, .05 if m > 50 else .07)
    if b >= 1:  # arpejo em colcheias
        pat = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[4], ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 12]
        for k, m in enumerate(pat):
            mput(pluck(m), t0 + k * BEAT / 2, .10 if b > 1 else .06, pan=(-.35 if k % 2 else .35))
    if b >= 1:
        for k in range(4):
            if k in (0, 2) or (b >= 5 and k == 3): mput(kick(), t0 + k * BEAT, .55)
            if b >= 2:
                mput(hat(), t0 + k * BEAT + BEAT / 2, .10, pan=.3)
                if b >= 4: mput(hat(), t0 + k * BEAT + BEAT / 4 * 3, .05, pan=-.3)
# cartela final: resolução em D maj9, sem bateria
for m in [38, 50, 57, 62, 64, 66, 69, 73]:
    mput(pad_note(m, TOTAL - END["t0"] + .4), END["t0"], .06)
for k, m in enumerate([74, 78, 81, 85, 81]):
    mput(pluck(m, 2.0), END["t0"] + .15 + k * BEAT * .75, .09, pan=(-.3 if k % 2 else .3))


# eco + reverb na música
def reverb(x, d=2.4, wet=.28):
    t = tt(d); ir = np.vstack([rng.randn(len(t)), rng.randn(len(t))]) * np.exp(-t / (d / 6.5))
    ir[:, :int(.012 * SR)] = 0; ir = lp(ir, 6000) * .02
    y = np.vstack([fftconvolve(x[c], ir[c])[:x.shape[1]] for c in range(2)])
    return x + wet * y


mus = reverb(mus)

# ---------------------------------------------------------------- efeitos sincronizados
for j, kind in TRANS.items():
    tb = ST[j]
    if kind.startswith("whip"):
        put(whoosh(.42, 1.0, .7), tb - .30, .55, pan=(-.4 if "left" in kind else .4 if "right" in kind else 0))
    elif kind == "zoom_in":
        put(whoosh(.5, .8, .75), tb - .37, .5)
    elif kind in ("flash", "leak"):
        put(whoosh(.7, .7, .55), tb - .38, .35); put(shimmer(1.2), tb - .05, .18)
    elif kind == "fade_white":
        put(riser(2.0), tb - 2.0, .35); put(boom(), tb, .75); put(shimmer(2.2), tb, .2)
put(shimmer(1.5), 0.0, .22); put(whoosh(.9, .6, .4), 0.0, .3)              # abertura
put(tick(2400), NAME[2] + .02, .16); put(tick(3200), NAME[2] + .17, .10)       # nome
put(tick(2800), END["t0"] + 1.52, .12)                                         # CTA

sfx = reverb(L.astype(np.float64), 1.4, .18) * .8
mix = mus * 1.0 + sfx * .9
# fade final + master
fo = int(.8 * SR); mix[:, -fo - int(.2 * SR):-int(.2 * SR)] *= np.linspace(1, 0, fo) ** 1.5; mix[:, -int(.2 * SR):] = 0
mix = hp(mix, 30)
rms = np.sqrt(np.mean(mix ** 2)); mix *= (10 ** (-15 / 20)) / rms
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= (10 ** (-1 / 20)) / np.max(np.abs(mix))
wavfile.write(sys.argv[1], SR, (mix.T * 32767).astype(np.int16))
print("ok", sys.argv[1], f"{N / SR:.2f}s")
