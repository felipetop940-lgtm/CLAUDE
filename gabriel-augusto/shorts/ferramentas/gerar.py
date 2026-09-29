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


def efeitos(rot: dict, total: float) -> np.ndarray:
    """Efeitos sonoros sincronizados com o que aparece na tela (sem música de fundo).
    Todos sintetizados aqui: whoosh, estalos, notificação, falha digital, vidro, digitação, brilho, passos."""
    rng = np.random.default_rng(9); N = int((total + .5) * SR); mix = np.zeros(N)
    def put(sig, at, g=1.):
        i = int(at * SR)
        if 0 <= i < N: j = min(N, i + len(sig)); mix[i:j] += sig[: j - i] * g
    def env(L, a=.005, d=6.):
        k = np.arange(L) / SR; return np.minimum(1, k / a) * np.exp(-k * d)
    def whoosh(dur=.6, hi=7000):
        L = int(dur * SR); k = np.arange(L) / SR; n = rng.standard_normal(L); sw = k / dur
        return hp(lp(n, 900) * (1 - sw) + lp(n, hi) * sw, 200) * np.sin(np.pi * sw) ** 1.5 * .7
    def thump():
        L = int(.5 * SR); k = np.arange(L) / SR; f = 40 + 90 * np.exp(-k * 20)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 7)
    def pop(f=900):
        L = int(.07 * SR); k = np.arange(L) / SR; return np.sin(2 * np.pi * (f + 900 * np.exp(-k * 60)) * k) * env(L, .002, 55)
    def ding(f=1320):
        L = int(.9 * SR); k = np.arange(L) / SR
        return (np.sin(2 * np.pi * f * k) + .5 * np.sin(2 * np.pi * f * 2.01 * k) + .25 * np.sin(2 * np.pi * f * 3 * k)) * env(L, .003, 5) * .5
    def chime():
        out = np.zeros(int(1.3 * SR))
        for i, f in enumerate((1568, 1976, 2349, 3136)):
            d = ding(f); j = int(i * .06 * SR); out[j:j + len(d)] += d * .6
        return out
    def glitch(dur=.35):
        L = int(dur * SR); k = np.arange(L) / SR
        sq = np.sign(np.sin(2 * np.pi * (180 + 900 * (np.floor(k * 40) % 3)) * k)) * .4
        return (sq + hp(rng.standard_normal(L), 2000) * .5) * (np.floor(k * 25) % 2) * .6
    def crack():
        L = int(.6 * SR); k = np.arange(L) / SR; out = hp(rng.standard_normal(L), 2500) * np.exp(-k * 14) * .8
        for i in range(8):
            j = int(rng.uniform(0, .25) * SR); m = int(.01 * SR); out[j:j + m] += rng.standard_normal(m) * 1.2
        return out
    def boom():
        L = int(1.2 * SR); k = np.arange(L) / SR
        return (np.sin(2 * np.pi * 45 * k) * np.exp(-k * 3.5) + lp(rng.standard_normal(L), 300) * np.exp(-k * 5) * .6)
    def key():
        L = int(.035 * SR); return hp(rng.standard_normal(L), 3000) * env(L, .001, 120) * .6
    def buzz():
        L = int(.22 * SR); k = np.arange(L) / SR; return np.sign(np.sin(2 * np.pi * 150 * k)) * env(L, .003, 10) * .35
    def step():
        L = int(.12 * SR); k = np.arange(L) / SR; return lp(rng.standard_normal(L), 600) * env(L, .002, 35)
    def queda(dur=1.6):
        L = int(dur * SR); k = np.arange(L) / SR; f = 620 * (180 / 620) ** (k / dur)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, k / .05) * np.minimum(1, (dur - k) / .2) * .35
    def riser(dur=.9):
        L = int(dur * SR); k = np.arange(L) / SR; sw = k / dur
        return (hp(lp(rng.standard_normal(L), 1500 + 6000 * 0) * (1 - sw) + lp(rng.standard_normal(L), 9000) * sw, 400) * sw ** 2 * .6)

    tipos = ["varredura", "iris", "barras"]
    for i, c in enumerate(rot["cenas"]):
        t0 = c["t0"]
        if i:  # transição entre cenas
            tp = c.get("transicao") or tipos[(i - 1) % 3]
            if tp == "varredura": put(whoosh(.64), t0 - .32, .9)
            elif tp == "iris": put(whoosh(.5, 5000), t0 - .3, .7); put(thump(), t0, .7); put(ding(988), t0 - .02, .25)
            else:
                for j in range(7): put(whoosh(.18, 9000), t0 - .3 + j * .045, .35)
        nw = sum(len(l.split()) for l in c.get("texto", []))
        for j in range(min(nw, 6)): put(pop(700 + 80 * j), t0 + .05 + j * .08, .22)
        if c.get("fx") == "tremer": put(boom(), t0 + .02, .7)
        bs = c.get("boneco") or []; bs = bs if isinstance(bs, list) else [bs]
        for b in bs:
            if b.get("entrada") == "andando":
                for j in range(6): put(step(), t0 + .08 + j * .14, .35)
            if b.get("pose") == "comemorando": put(chime(), t0 + .3, .35)
        pr = (c.get("prop") or {}).get("tipo")
        if pr == "conta_off":
            put(ding(1175), t0 + .45, .45); put(glitch(), t0 + .9, .6); put(boom(), t0 + 1.22, .6); put(crack(), t0 + 1.35, .6)
        elif pr == "alugado": put(thump(), t0 + 1.0, .6)
        elif pr == "grafico": put(queda(), t0 + .2, .6)
        elif pr == "busca":
            q = (c.get("prop") or {}).get("consulta", "")
            for j in range(len(q)): put(key(), t0 + .1 + 1.2 * j / max(1, len(q)), .5)
            put(buzz(), t0 + 1.5, .5); put(buzz(), t0 + 1.9, .5); put(chime(), t0 + 2.3, .45)
        elif pr == "enquete": put(pop(500), t0 + .3, .6); put(pop(620), t0 + .5, .6); put(pop(900), t0 + .9, .4)
        elif pr == "cta": put(riser(), t0 - .9, .5); put(chime(), t0 + .6, .5)
        elif pr == "site_celular": put(whoosh(.7, 5000), t0 + .05, .5); put(chime(), t0 + .6, .3)
        elif pr == "preco":
            for j in range(12): put(key(), t0 + .2 + j * .1, .35)
            put(ding(1760), t0 + 1.4, .5); put(pop(800), t0 + 1.2, .4); put(pop(950), t0 + 1.45, .4)
    mix /= np.max(np.abs(mix)) + 1e-9
    return mix


def tratar_voz(v: np.ndarray) -> np.ndarray:
    v = hp(v, 80)
    act = np.abs(v) > .02
    v = v * (.16 / (np.sqrt(np.mean(v[act] ** 2)) + 1e-9))
    return np.clip(v, -.97, .97)


# ---------------------------------------------------------------- vídeo
def render_frames(rot: dict, frames: Path, html: Path, total: float, workers: int = os.cpu_count() or 4):
    """Renderiza os quadros em paralelo: cada processo abre um navegador e faz uma fatia intercalada."""
    html.write_text((HERE / "motor.html").read_text().replace("__ROTEIRO__", json.dumps(rot, ensure_ascii=False)))
    js = html.with_suffix(".js")
    js.write_text(f"""
const {{ chromium }} = require(process.env.PWPATH);
const W = +process.argv[2], K = +process.argv[3];
(async () => {{
  const b = await chromium.launch(); const p = await b.newPage({{ viewport: {{ width: 1080, height: 1920 }} }});
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://{html}'); await p.evaluate(() => document.fonts.ready);
  const N = Math.ceil({total} * {FPS});
  for (let i = W; i < N; i += K) {{ await p.evaluate(t => render(t), i / {FPS});
    await p.screenshot({{ path: '{frames}/f' + String(i).padStart(5, '0') + '.jpg', type: 'jpeg', quality: 90 }}); }}
  if (errs.length) {{ console.error(errs.join('\\n')); process.exit(1); }}
  await b.close();
}})();""")
    root = subprocess.check_output(["npm", "root", "-g"], text=True).strip()
    env = {**os.environ, "PWPATH": root + "/playwright"}
    procs = [subprocess.Popen(["node", str(js), str(w), str(workers)], env=env) for w in range(workers)]
    if any(p.wait() for p in procs): raise RuntimeError("falha ao renderizar quadros")


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
        fx = efeitos(rot, total)[:N]; fx = np.pad(fx, (0, N - len(fx)))  # só efeitos, sem música de fundo
        mix = voz + fx * .32; mix /= max(1, np.abs(mix).max() / .95)
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
