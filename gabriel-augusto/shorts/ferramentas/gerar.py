#!/usr/bin/env python3
"""Gera um vídeo curto vertical (1080x1920, 30 fps) a partir de um roteiro JSON.

Uso:  python3 gerar.py ../roteiros/v01-clientes.json
Saída: ../saida/<nome-do-roteiro>.mp4

Etapas: quadros (Playwright + motor.html) → trilha original (batida + efeitos nos cortes) → MP4 (H.264/AAC).
Requisitos: node + playwright, python3 com numpy, scipy, soundfile, imageio-ffmpeg.
"""
import json, subprocess, sys, tempfile, shutil
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
FPS, SR = 30, 44100


def render_frames(roteiro: dict, frames_dir: Path, html_path: Path):
    html = (HERE / "motor.html").read_text().replace("__ROTEIRO__", json.dumps(roteiro, ensure_ascii=False))
    html_path.write_text(html)
    total = sum(c["dur"] for c in roteiro["cenas"])
    js = f"""
const {{ chromium }} = require(process.env.PWPATH);
(async () => {{
  const b = await chromium.launch(); const p = await b.newPage({{ viewport: {{ width: 1080, height: 1920 }} }});
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://{html_path}'); await p.evaluate(() => document.fonts.ready);
  const N = Math.ceil({total} * {FPS});
  for (let i = 0; i < N; i++) {{ await p.evaluate(t => render(t), i / {FPS});
    await p.screenshot({{ path: '{frames_dir}/f' + String(i).padStart(5, '0') + '.jpg', type: 'jpeg', quality: 92 }}); }}
  if (errs.length) {{ console.error(errs.join('\\n')); process.exit(1); }}
  await b.close();
}})();"""
    jsf = html_path.with_suffix(".js"); jsf.write_text(js)
    root = subprocess.check_output(["npm", "root", "-g"], text=True).strip()
    subprocess.run(["node", str(jsf)], check=True, env={**__import__("os").environ, "PWPATH": root + "/playwright"})
    return total


def lp(x, fc):
    return sosfilt(butter(2, fc, "low", fs=SR, output="sos"), x)


def hp(x, fc):
    return sosfilt(butter(2, fc, "high", fs=SR, output="sos"), x)


def trilha(roteiro: dict, total: float) -> np.ndarray:
    """Batida original (estilo trap/pop minimalista) + whoosh nos cortes + 'pop' nas palavras."""
    rng = np.random.default_rng(3)
    bpm = roteiro.get("bpm", 120); beat = 60 / bpm; N = int((total + .6) * SR)
    t = np.arange(N) / SR
    mix = np.zeros(N)

    def put(sig, at, gain=1.0):
        i = int(at * SR)
        if i >= N: return
        j = min(N, i + len(sig)); mix[i:j] += sig[: j - i] * gain

    def kick():
        L = int(.35 * SR); k = np.arange(L) / SR
        f = 45 + 110 * np.exp(-k * 28)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 9)

    def clap():
        L = int(.22 * SR); k = np.arange(L) / SR
        n = hp(rng.standard_normal(L), 900) * np.exp(-k * 22)
        return n * .6

    def hat(open_=False):
        L = int((.12 if open_ else .04) * SR); k = np.arange(L) / SR
        return hp(rng.standard_normal(L), 7000) * np.exp(-k * (25 if open_ else 90)) * .35

    def bass(freq, dur):
        L = int(dur * SR); k = np.arange(L) / SR
        s = np.tanh(2.2 * np.sin(2 * np.pi * freq * k)) * np.minimum(1, k * 60) * np.exp(-k * 1.2)
        return lp(s, 600)

    def pluck(freq, dur=.45):
        L = int(dur * SR); k = np.arange(L) / SR
        s = (np.sign(np.sin(2 * np.pi * freq * k)) * .35 + np.sin(2 * np.pi * freq * k)) * np.exp(-k * 7)
        return lp(s, 2800)

    notes = {"A": 55.0, "F": 43.65, "C": 65.41, "G": 49.0}
    prog = ["A", "F", "C", "G"]
    bars = int(total / (beat * 4)) + 2
    for b in range(bars):
        t0 = b * beat * 4
        root = notes[prog[b % 4]]
        drop = t0 >= beat * 4  # primeiro compasso mais leve (gancho)
        for q in range(4):
            tb = t0 + q * beat
            if drop or q == 0: put(kick(), tb, .95)
            if drop and q in (1, 3): put(clap(), tb, .7)
        if drop: put(kick(), t0 + 2.5 * beat, .6)
        for e in range(8):
            put(hat(open_=(e == 7)), t0 + e * beat / 2, .9 if e % 2 else .55)
            if drop and b % 2 and e in (3, 6): put(hat(), t0 + e * beat / 2 + beat / 4, .4)
        put(bass(root, beat * 1.8), t0, .55); put(bass(root, beat * 1.8), t0 + 2 * beat, .45)
        arp = [root * 4, root * 5, root * 6, root * 8]
        for e in range(8):
            put(pluck(arp[e % 4] * (1.5 if e == 6 else 1)), t0 + e * beat / 2, .16)

    # efeitos nos cortes de cena
    def whoosh():
        L = int(.45 * SR); k = np.arange(L) / SR
        n = rng.standard_normal(L); env = np.sin(np.pi * k / .45) ** 2
        sweep = k / .45  # abre o filtro ao longo do efeito (mistura de um som abafado e um brilhante)
        return hp(lp(n, 1500) * (1 - sweep) + lp(n, 7000) * sweep, 300) * env * .5
    def pop():
        L = int(.08 * SR); k = np.arange(L) / SR
        return np.sin(2 * np.pi * (900 - 4000 * k) * k) * np.exp(-k * 60) * .35
    acc = 0
    for i, c in enumerate(roteiro["cenas"]):
        if i: put(whoosh(), acc - .22, .55)
        nwords = sum(len(l.split()) for l in c.get("texto", []))
        for j in range(min(nwords, 8)): put(pop(), acc + .05 + j * c.get("ritmo", .07), .45)
        acc += c["dur"]
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * .9
    fade = np.ones(N); fo = int(.6 * SR); fade[-fo:] = np.linspace(1, 0, fo); mix *= fade
    return np.stack([mix, mix], 1)


def main():
    src = Path(sys.argv[1]).resolve()
    roteiro = json.loads(src.read_text())
    out = HERE.parent / "saida" / (src.stem + ".mp4"); out.parent.mkdir(exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="short_"))
    try:
        frames = tmp / "frames"; frames.mkdir()
        # o HTML temporário fica ao lado do motor para achar as fontes pelo caminho relativo
        html = HERE / f"_render_{src.stem}.html"
        total = render_frames(roteiro, frames, html)
        audio = tmp / "audio.wav"; sf.write(audio, trilha(roteiro, total), SR)
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(frames / "f%05d.jpg"), "-i", str(audio),
                        "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-profile:v", "high",
                        "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)], check=True)
        print(f"ok: {out} ({total:.1f}s)")
    finally:
        for f in HERE.glob(f"_render_{src.stem}.*"): f.unlink()
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
