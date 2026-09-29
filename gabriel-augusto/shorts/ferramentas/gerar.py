#!/usr/bin/env python3
"""Gera um vídeo curto vertical (1080x1920, 30 fps) com narração e legenda sincronizada.

Uso:
  python3 gerar.py ../roteiros/v02-instagram.json            # voz-guia sintética
  python3 gerar.py ../roteiros/v02-instagram.json voz.wav    # voz gravada (falas separadas por silêncio)

Cada cena do roteiro tem "fala": a cena dura o tempo da fala (+ respiro), e a legenda acende palavra por palavra.
Saída: ../saida/<roteiro>.mp4
"""
import json, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
FPS, SR = 30, 44100
TTS_DIR = Path(os.environ.get("KOKORO_DIR", "/tmp/claude-0/-home-user-CLAUDE/fd70068f-eb26-52d1-93fb-30c6fb85ccd2/scratchpad/tts"))
RESPIRO = 0.45  # silêncio entre falas


# ---------------------------------------------------------------- voz
def voz_guia(texto: str) -> np.ndarray:
    """Voz-guia (Kokoro, pm_alex) só para marcar o tempo; depois é trocada pela voz gravada."""
    from kokoro_onnx import Kokoro
    global _K, _V
    if "_K" not in globals():
        _K = Kokoro(str(TTS_DIR / "kokoro-fp16.onnx"), str(TTS_DIR / "voices2.bin")); _V = np.load(TTS_DIR / "voices2.bin")["pm_alex"]
    partes = [p for p in re.split(r"(?<=[.?!])\s+", texto) if p]
    out = []
    for p in partes:
        a = np.zeros(0)
        for sp in (1.05, 1.055, 1.045, 1.06, 1.04, 1.07, 1.03, 1.0):  # o modelo às vezes devolve vazio; tenta de novo
            a, sr = _K.create(p, voice=_V, speed=sp, lang="pt-br")
            if len(a) and np.abs(a).max() > .05: break
        i = np.where(np.abs(a) > .01)[0]; a = a[max(0, i[0] - 500): i[-1] + 1500]
        out += [resample_poly(a, 147, 80), np.zeros(int(SR * .18))]
    return np.concatenate(out[:-1])


def falas_gravadas(wav: Path, n: int) -> list:
    """Separa uma gravação em n falas pelos maiores silêncios."""
    a, sr = sf.read(wav)
    if a.ndim > 1: a = a.mean(1)
    if sr != SR: a = resample_poly(a, SR, sr)
    fr = int(.01 * SR); e = np.array([np.sqrt(np.mean(a[i:i + fr] ** 2)) for i in range(0, len(a) - fr, fr)])
    db = 20 * np.log10(e + 1e-9); voiced = db > np.percentile(db, 10) + 14
    segs, s, last, sil = [], None, 0, 0
    for i, v in enumerate(voiced):
        if v:
            s = i if s is None else s; last = i; sil = 0
        elif s is not None:
            sil += 1
            if sil >= 25: segs.append([s, last + 1]); s = None
    if s is not None: segs.append([s, last + 1])
    while len(segs) > n:  # junta pelos menores silêncios
        gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]; j = int(np.argmin(gaps))
        segs[j] = [segs[j][0], segs[j + 1][1]]; del segs[j + 1]
    return [a[max(0, x * fr - 800): y * fr + 2000] for x, y in segs]


def tempos_palavras(texto: str, t0: float, dur: float) -> list:
    """Tempo de cada palavra proporcional ao tamanho (com peso extra na pontuação)."""
    texto = exibir(texto); ws = texto.split(); pes = [len(re.sub(r"\W", "", w)) + 2 + (3 if re.search(r"[.,?!:]$", w) else 0) for w in ws]
    tot = sum(pes); acc = t0; out = []
    for w, p in zip(ws, pes):
        d = dur * p / tot; out.append({"w": w, "a": round(acc, 3), "b": round(acc + d, 3)}); acc += d
    return out


def exibir(texto: str) -> str:
    """Valores por extenso viram algarismos na legenda."""
    for a, b in [("duzentos e cinquenta reais", "R$ 250"), ("trezentos e vinte reais", "R$ 320"), ("dois a sete dias", "2 a 7 dias")]:
        texto = texto.replace(a, b)
    return texto


# ---------------------------------------------------------------- trilha
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)


def trilha(total: float, cortes: list, bpm=100) -> np.ndarray:
    rng = np.random.default_rng(5); beat = 60 / bpm; N = int((total + .5) * SR); mix = np.zeros(N)
    def put(sig, at, g=1.):
        i = int(at * SR)
        if 0 <= i < N: j = min(N, i + len(sig)); mix[i:j] += sig[: j - i] * g
    def kick():
        k = np.arange(int(.4 * SR)) / SR; f = 42 + 100 * np.exp(-k * 26)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 8)
    def snap():
        k = np.arange(int(.15 * SR)) / SR; return hp(rng.standard_normal(len(k)), 1500) * np.exp(-k * 35) * .5
    def hat():
        k = np.arange(int(.05 * SR)) / SR; return hp(rng.standard_normal(len(k)), 8000) * np.exp(-k * 80) * .3
    def pad(fs, dur):
        k = np.arange(int(dur * SR)) / SR; s = sum(np.sin(2 * np.pi * f * k) + .3 * np.sin(2 * np.pi * f * 1.003 * k) for f in fs)
        env = np.minimum(1, k / .6) * np.minimum(1, (dur - k) / .6); return lp(s * env, 1400)
    prog = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 196, 246.9]]
    bars = int(total / (4 * beat)) + 2
    for b in range(bars):
        t0 = b * 4 * beat
        put(pad(prog[b % 4], 4 * beat + .6), t0, .05)
        put(lp(np.tanh(2 * np.sin(2 * np.pi * prog[b % 4][0] / 4 * np.arange(int(3.8 * beat * SR)) / SR)), 300) * .9, t0, .16)
        for q in range(4):
            put(kick(), t0 + q * beat, .55 if q % 2 == 0 else .35)
            if q in (1, 3): put(snap(), t0 + q * beat, .45)
        for e in range(8): put(hat(), t0 + e * beat / 2, .5 if e % 2 else .3)
    def whoosh():
        L = int(.5 * SR); k = np.arange(L) / SR; n = rng.standard_normal(L); sw = k / .5
        return hp(lp(n, 1500) * (1 - sw) + lp(n, 7000) * sw, 300) * np.sin(np.pi * sw) ** 2 * .5
    def hit():
        k = np.arange(int(.5 * SR)) / SR; return (np.sin(2 * np.pi * 55 * k) * np.exp(-k * 6) + hp(rng.standard_normal(len(k)), 3000) * np.exp(-k * 30) * .3)
    for i, c in enumerate(cortes):
        if i: put(whoosh(), c - .25, .5)
        put(hit(), c, .45)
    mix /= np.max(np.abs(mix)) + 1e-9
    fo = int(.8 * SR); mix[-fo:] *= np.linspace(1, 0, fo)
    return mix


def tratar_voz(v: np.ndarray) -> np.ndarray:
    v = hp(v, 80)
    act = np.abs(v) > .02
    v = v * (.16 / (np.sqrt(np.mean(v[act] ** 2)) + 1e-9))
    return np.clip(v, -.97, .97)


# ---------------------------------------------------------------- vídeo
def render_frames(rot: dict, frames: Path, html: Path, total: float):
    html.write_text((HERE / "motor.html").read_text().replace("__ROTEIRO__", json.dumps(rot, ensure_ascii=False)))
    js = html.with_suffix(".js")
    js.write_text(f"""
const {{ chromium }} = require(process.env.PWPATH);
(async () => {{
  const b = await chromium.launch(); const p = await b.newPage({{ viewport: {{ width: 1080, height: 1920 }} }});
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://{html}'); await p.evaluate(() => document.fonts.ready);
  const N = Math.ceil({total} * {FPS});
  for (let i = 0; i < N; i++) {{ await p.evaluate(t => render(t), i / {FPS});
    await p.screenshot({{ path: '{frames}/f' + String(i).padStart(5, '0') + '.jpg', type: 'jpeg', quality: 92 }}); }}
  if (errs.length) {{ console.error(errs.join('\\n')); process.exit(1); }}
  await b.close();
}})();""")
    root = subprocess.check_output(["npm", "root", "-g"], text=True).strip()
    subprocess.run(["node", str(js)], check=True, env={**os.environ, "PWPATH": root + "/playwright"})


def main():
    src = Path(sys.argv[1]).resolve(); gravacao = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else None
    rot = json.loads(src.read_text()); cenas = rot["cenas"]
    vozes = falas_gravadas(gravacao, len(cenas)) if gravacao else [voz_guia(c["fala"]) for c in cenas]
    t = .5; cortes = []
    for c, v in zip(cenas, vozes):
        d = len(v) / SR
        c["t0"] = round(t - (.35 if cortes else .5), 3); cortes.append(c["t0"])
        c["fala_t0"] = t; c["palavras"] = tempos_palavras(c["fala"], t, d)
        c["palavras"] = [p for p in c["palavras"] if p["w"]]
        t += d + RESPIRO + c.get("fim", 0)
    for a, b in zip(cenas, cenas[1:]): a["dur"] = round(b["t0"] - a["t0"], 3)
    total = round(t, 2); cenas[-1]["dur"] = round(total - cenas[-1]["t0"], 3); rot["total"] = total

    out = HERE.parent / "saida" / (src.stem + ".mp4"); out.parent.mkdir(exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="short_"))
    try:
        frames = tmp / "f"; frames.mkdir()
        render_frames(rot, frames, HERE / f"_render_{src.stem}.html", total)
        N = int((total + .5) * SR); voz = np.zeros(N)
        for c, v in zip(cenas, vozes):
            i = int(c["fala_t0"] * SR); voz[i:i + len(v)] += v[: N - i]
        voz = tratar_voz(voz)
        mus = trilha(total, cortes, rot.get("bpm", 100))[:N]; mus = np.pad(mus, (0, N - len(mus)))
        env = np.convolve(np.abs(voz), np.ones(int(.25 * SR)) / int(.25 * SR), "same")
        duck = np.convolve(np.where(env > .008, .5, 1.), np.ones(int(.3 * SR)) / int(.3 * SR), "same")
        mix = voz + mus * .13 * duck; mix /= max(1, np.abs(mix).max() / .95)
        wav = tmp / "a.wav"; sf.write(wav, np.stack([mix, mix], 1), SR)
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(frames / "f%05d.jpg"), "-i", str(wav),
                        "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "5M", "-bufsize", "10M",  # limite: granulado animado infla o arquivo
                         "-pix_fmt", "yuv420p", "-profile:v", "high",
                        "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)], check=True)
        print(f"ok: {out} ({total:.1f}s)")
    finally:
        for f in HERE.glob(f"_render_{src.stem}.*"): f.unlink()
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
