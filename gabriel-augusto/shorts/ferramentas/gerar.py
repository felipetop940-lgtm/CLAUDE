#!/usr/bin/env python3
"""Gera um vídeo curto vertical (1080x1920, 30 fps) com narração e legenda sincronizada.

Uso:
  python3 gerar.py ../roteiros/v02-instagram.json            # voz-guia sintética
  python3 gerar.py ../roteiros/v02-instagram.json voz.wav    # voz gravada (falas separadas por silêncio)
  python3 gerar.py ../roteiros/v02-instagram.json voz.wav ../roteiros/v02-instagram-cortes.json  # cortes manuais [[ini, fim], ...] em segundos

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
TTS_DIR = Path(os.environ.get("KOKORO_DIR", Path.home() / ".cache/kokoro"))
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"


def baixar_voz():
    """Container novo não tem o modelo da voz-guia: baixa uma vez (~200 MB) para TTS_DIR."""
    TTS_DIR.mkdir(parents=True, exist_ok=True)
    for local, remoto in (("kokoro-fp16.onnx", "kokoro-v1.0.fp16.onnx"), ("voices2.bin", "voices-v1.0.bin")):
        if not (TTS_DIR / local).exists():
            subprocess.run(["curl", "-sSfL", "-o", str(TTS_DIR / local), KOKORO_URL + remoto], check=True)
RESPIRO = 0.45  # silêncio entre falas


# ---------------------------------------------------------------- voz
def voz_guia(texto: str) -> np.ndarray:
    """Voz-guia (Kokoro, pm_alex) só para marcar o tempo; depois é trocada pela voz gravada."""
    from kokoro_onnx import Kokoro
    global _K, _V
    if "_K" not in globals():
        baixar_voz()
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


def ler_audio(arq: Path) -> np.ndarray:
    """Lê wav/mp3/mp4/ogg (áudio do WhatsApp etc.) em mono 44,1 kHz."""
    if arq.suffix.lower() != ".wav":
        tmp = Path(tempfile.mkdtemp()) / "a.wav"
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", str(arq), "-vn", "-ac", "1", "-ar", str(SR), str(tmp)], check=True)
        arq = tmp
    a, sr = sf.read(arq)
    if a.ndim > 1: a = a.mean(1)
    return resample_poly(a, SR, sr) if sr != SR else a


def limpar_gravacao(a: np.ndarray) -> np.ndarray:
    """Tratamento da voz gravada: redução de ruído (perfil dos silêncios), EQ e compressor."""
    import noisereduce as nr
    from scipy.signal import lfilter
    fr = int(.02 * SR); e = np.array([np.sqrt(np.mean(a[i:i + fr] ** 2)) for i in range(0, len(a) - fr, fr)])
    quietos = np.argsort(e)[: max(10, len(e) // 10)]  # 10% mais silenciosos = ruído de fundo
    ruido = np.concatenate([a[i * fr:(i + 1) * fr] for i in sorted(quietos)])
    a = nr.reduce_noise(y=a, sr=SR, y_noise=ruido, prop_decrease=.85, stationary=True)
    def sino(x, f, g, q):  # EQ em sino (RBJ)
        A = 10 ** (g / 40); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q)
        b = np.array([1 + al * A, -2 * np.cos(w), 1 - al * A]); c = np.array([1 + al / A, -2 * np.cos(w), 1 - al / A])
        return lfilter(b / c[0], c / c[0], x)
    a = hp(a, 80)
    a = sino(a, 300, -2, .8)     # tira o abafado
    a = sino(a, 3200, 2.5, .9)   # presença/clareza
    a = sino(a, 7000, -2, 2.)    # suaviza o chiado do "s"
    # compressor (-20 dB, 3:1, ataque 5 ms, release 80 ms)
    ca, cr = np.exp(-1 / (.005 * SR)), np.exp(-1 / (.08 * SR)); env = 0.; lv = np.abs(a); g = np.empty_like(a)
    for i, v in enumerate(lv):
        env = ca * env + (1 - ca) * v if v > env else cr * env + (1 - cr) * v; g[i] = env
    d = 20 * np.log10(g + 1e-9); gd = np.where(d > -20, (-20 + (d + 20) / 3) - d, 0)
    return a * 10 ** (gd / 20)


def falas_gravadas(wav: Path, n: int, cortes: list = None) -> list:
    """Separa uma gravação em n falas pelos maiores silêncios (ou pelos cortes manuais [[ini, fim], ...])."""
    a = limpar_gravacao(ler_audio(wav))
    if cortes:
        out = []
        def pedaco(x, y):
            seg = a[max(0, int((x - .06) * SR)): int((y + .15) * SR)].copy(); f = int(.02 * SR)
            seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f); return seg
        for c in cortes:  # [ini, fim] ou [[ini, fim], [ini, fim], ...] (fala montada de takes diferentes)
            ps = c if isinstance(c[0], list) else [c]
            out.append(np.concatenate([np.concatenate([pedaco(x, y), np.zeros(int(.22 * SR))]) for x, y in ps])[: -int(.22 * SR)])
        return out
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


def texto_legenda(rot: dict, c: dict) -> str:
    """Fala como aparece na legenda: o roteiro pode trocar número falado por algarismo ("exibir": {"cinco e sessenta": "R$ 5,60"})."""
    t = c["fala"]
    for a, b in (rot.get("exibir") or {}).items(): t = t.replace(a, b)
    return t


def exibir(texto: str) -> str:
    """Valores por extenso viram algarismos na legenda."""
    for a, b in [("duzentos e cinquenta reais", "R$ 250"), ("trezentos e vinte reais", "R$ 320"), ("trezentos e trinta e oito reais", "R$ 338"),
                 ("cento e sessenta e dois reais", "R$ 162"), ("trezentos reais", "R$ 300"), ("quinhentos reais", "R$ 500"), ("duzentos reais", "R$ 200"),
                 ("dois a sete dias", "2 a 7 dias"), ("dois a cinco dias", "2 a 5 dias"), ("cinco rodadas", "5 rodadas"), ("duas rodadas", "2 rodadas"),
                 ("quatro passos", "4 passos"), ("dois dias", "2 dias")]:
        texto = texto.replace(a, b)
    return texto


# ---------------------------------------------------------------- trilha
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)


def efeitos(rot: dict, total: float) -> np.ndarray:
    """Sound design de cinema (sem música de fundo): cada evento da tela tem um som próprio, sincronizado.
    Paleta sintetizada aqui (original, sem direitos): sub-impacto, swell invertido, sopro de ar, sinos de vidro,
    bolha de mensagem, toque de tecla em madeira, brilho em arpejo, tensão grave, acorde de resolução.
    Tudo passa por um reverb de sala no fim, pra soar elegante e com profundidade."""
    from scipy.signal import fftconvolve
    rng = np.random.default_rng(9); N = int((total + .5) * SR); mix = np.zeros(N)
    def put(sig, at, g=1.):
        i = int(at * SR)
        if i < 0: sig, i = sig[-i:], 0
        if i < N: j = min(N, i + len(sig)); mix[i:j] += sig[: j - i] * g
    def T(d): return np.arange(int(d * SR)) / SR
    def env(k, a=.005, d=6.): return np.minimum(1, k / a) * np.exp(-k * d)
    def sino(f, d=2.2, dec=2.8):           # sino de vidro: parcial inarmônico dá o brilho
        k = T(d); return (np.sin(2 * np.pi * f * k) + .35 * np.sin(2 * np.pi * f * 2.76 * k) * np.exp(-k * 4) + .12 * np.sin(2 * np.pi * f * 5.4 * k) * np.exp(-k * 9)) * env(k, .002, dec) * .5
    def ar(dur=.55, f0=500, f1=4000):      # sopro de ar (whoosh suave) com filtro que abre
        k = T(dur); n = rng.standard_normal(len(k)); sw = np.sin(np.pi * k / dur) ** 2
        lo = lp(n, f0); hi = lp(n, f1); x = (lo * (1 - k / dur) + hi * (k / dur)); return hp(x, 150) * sw * .55
    def sub(f=52, dur=1.6):                # impacto grave de cinema
        k = T(dur); fr = f + 70 * np.exp(-k * 14)
        return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-k * 2.6) + lp(rng.standard_normal(len(k)), 220) * np.exp(-k * 8) * .5) * .9
    def swell(dur=.9, f=880):              # sino invertido que "puxa" pro impacto
        x = sino(f, dur + .4, 3)[: int(dur * SR)][::-1]; return x * np.linspace(0, 1, len(x)) ** 2 * 1.2
    def bolha(f=620):                      # mensagem chegando
        k = T(.22); return np.sin(2 * np.pi * np.cumsum(f + 520 * (1 - np.exp(-k * 40))) / SR) * env(k, .003, 22) * .5
    def enviada():                         # mensagem saindo: sopro curtinho pra cima
        return ar(.28, 1200, 7000) * .8 + np.concatenate([np.zeros(int(.2 * SR)), bolha(980)]) [: int(.28 * SR)] * .6
    def tecla():                           # tecla macia (madeira), nada de estalo áspero
        k = T(.06); return lp(rng.standard_normal(len(k)), 2600) * env(k, .001, 90) * .45 + np.sin(2 * np.pi * 1900 * k) * env(k, .001, 120) * .12
    def brilho(base=1047):                 # arpejo de sinos (pentatônica maior) pra momento bom
        out = np.zeros(int(2.4 * SR))
        for i, r in enumerate((1, 1.125, 1.25, 1.5, 2)):
            x = sino(base * r, 2.0, 3.5) * .55; j = int(i * .07 * SR); out[j:j + len(x)] += x[: len(out) - j]
        return out
    def tensao(dur=1.3):                   # grave dissonante (segunda menor) pro "problema"
        k = T(dur); sw = np.sin(np.pi * k / dur) ** 1.5
        return (np.sin(2 * np.pi * 110 * k) + np.sin(2 * np.pi * 116.5 * k) + .4 * np.sin(2 * np.pi * 55 * k)) * sw * .3
    def resolve(dur=2.2):                  # acorde maior suave pra fechar
        k = T(dur); sw = np.minimum(1, k / .25) * np.exp(-k * 1.4)
        return sum(np.sin(2 * np.pi * f * k) * g for f, g in ((261.6, .5), (329.6, .35), (392, .35), (523.3, .25), (659.3, .12))) * sw * .5
    def queda(dur=1.2):
        k = T(dur); fr = 700 * (200 / 700) ** (k / dur); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * k / dur) * .3

    # paleta extra (28/10, pedido dele: sons mais variados, que combinem com o que acontece na tela)
    def riser(dur=1.2, f0=180, f1=1400):   # sobe e cresce até o golpe (gancho)
        k = T(dur); x = k / dur; fr = f0 * (f1 / f0) ** (x ** 1.6)
        ton = np.sin(2 * np.pi * np.cumsum(fr) / SR) * .35 + np.sin(2 * np.pi * np.cumsum(fr * 1.5) / SR) * .15
        n = rng.standard_normal(len(k)); ns = lp(n, 1500) * (1 - x) + lp(n, 9000) * x
        return hp(ton + ns * .6, 120) * x ** 2.2 * .8
    def hit(f=46):                         # golpe de cinema em camadas: sub + estalo abafado + anel metálico
        k = T(1.8); fr = f + 90 * np.exp(-k * 18)
        corpo = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-k * 2.2)
        estalo = lp(rng.standard_normal(len(k)), 3500) * np.exp(-k * 28) * .8
        anel = sum(np.sin(2 * np.pi * f2 * k) * np.exp(-k * d) for f2, d in ((311, 5), (523, 7), (1187, 11))) * .12
        return (corpo + estalo + anel) * .9
    def carimbo():                         # carimbo batendo no papel: baque seco + tapa de papel
        k = T(.5); baque = np.sin(2 * np.pi * np.cumsum(95 + 60 * np.exp(-k * 40)) / SR) * np.exp(-k * 14)
        tapa = hp(lp(rng.standard_normal(len(k)), 4200), 700) * np.exp(-k * 45) * .9
        return (baque + tapa) * .8
    def papel(dur=.4):                     # papel deslizando na mesa
        k = T(dur); n = hp(lp(rng.standard_normal(len(k)), 6500), 1400)
        return n * np.sin(np.pi * k / dur) ** 1.5 * (1 + .4 * np.sin(2 * np.pi * 23 * k)) * .4
    def marimba(f=784, dec=7.):            # baqueta de madeira: quente e curta
        k = T(.9); return (np.sin(2 * np.pi * f * k) + .25 * np.sin(2 * np.pi * f * 3.93 * k) * np.exp(-k * 30) + .5 * np.sin(2 * np.pi * f / 2 * k) * np.exp(-k * 9)) * env(k, .001, dec) * .45
    def pluck(f=392, dur=1.2):             # corda dedilhada (Karplus-Strong)
        n = int(SR / f); buf = rng.uniform(-1, 1, n); out = np.zeros(int(dur * SR))
        for i in range(len(out)): out[i] = buf[i % n]; buf[i % n] = .497 * (buf[i % n] + buf[(i + 1) % n])
        return lp(out, 5000) * .5
    def pop(f=900):                        # bolhinha de ícone aparecendo
        k = T(.14); return np.sin(2 * np.pi * np.cumsum(f * (1 + .6 * (1 - np.exp(-k * 60)))) / SR) * env(k, .002, 30) * .5
    def moeda():                           # dinheiro: dois toques metálicos
        out = np.zeros(int(.9 * SR))
        for j, f in enumerate((2093, 2637)):
            k = T(.8); x = (np.sin(2 * np.pi * f * k) + .4 * np.sin(2 * np.pi * f * 2.4 * k)) * env(k, .001, 7) * .35; i = int(j * .09 * SR); out[i:i + len(x)] += x[: len(out) - i]
        return out
    def clique():                          # clique de mouse
        k = T(.05); x = hp(rng.standard_normal(len(k)), 2500) * env(k, .0005, 260) * .6
        return np.concatenate([x, np.zeros(int(.045 * SR)), x * .6])
    def subida(f0=300, f1=900, dur=.8):    # tom que sobe junto com a barra enchendo
        k = T(dur); fr = f0 * (f1 / f0) ** (k / dur); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * k / dur) ** .8 * .22
    def contagem(dur=1., n=14):            # número contando: ticks que desaceleram
        out = np.zeros(int((dur + .1) * SR))
        for j in range(n):
            x = tecla() * (.5 + .5 * j / n); i = int(dur * (1 - (1 - j / n) ** 2) * SR); out[i:i + len(x)] += x[: len(out) - i]
        return out
    def brilho_varre(dur=1.1):             # barra de luz passando (revelação)
        k = T(dur); n = rng.standard_normal(len(k)); x = k / dur
        return hp(lp(n, 3000) * (1 - x) + lp(n, 12000) * x, 1800) * np.sin(np.pi * x) ** 2 * .35 + sum(sino(f, dur, 4)[: len(k)] * .12 for f in (1568, 2093, 2637))
    def reverso(dur=.5):                   # sopro ao contrário (puxa pra próxima cena)
        x = ar(dur, 600, 8000)[::-1]; return x * np.linspace(.3, 1, len(x))
    def grave_suave(): return sub(62, .9) * .7 + marimba(196, 9) * .5
    def sucesso(): x = marimba(1047, 6); y = marimba(1568, 5); out = np.zeros(int(1.1 * SR)); out[: len(x)] += x; out[int(.11 * SR): int(.11 * SR) + len(y)] += y; return out
    escala = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5]

    def norm(x): return "".join(ch for ch in __import__("unicodedata").normalize("NFD", x.lower()) if ch.isalnum() or ch in "/?=")
    def quando(c, ref):                    # mesmo "em" do motor: fração da cena ou palavra da fala (tempo absoluto)
        if isinstance(ref, (int, float)): return c["t0"] + ref * c["dur"]
        for p in c.get("palavras", []):
            if norm(p["w"]).startswith(norm(str(ref))): return p["a"]
        return c["t0"] + .5 * c["dur"]

    notas = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7]   # sobe a cada pedaço montado (sensação de progresso)
    for i, c in enumerate(rot["cenas"]):
        t0 = c["t0"]
        cin = rot.get("motor") == "motor-cinetico.html"
        if i == 0 and cin: put(hit(), max(0, t0 + .02), .75); put(brilho_varre(.9), t0 + .05, .35)   # gancho: golpe + brilho
        elif i == 0: put(swell(.9, 659), max(0, t0 + .05), .5); put(sub(), t0 + .35, .85)    # abertura: puxa e bate
        elif cin: [lambda: put(reverso(.55), t0 - .5, .5), lambda: put(ar(.6, 400, 5000), t0 - .3, .5),
                   lambda: (put(papel(.35), t0 - .25, .5), put(grave_suave(), t0 + .02, .35)), lambda: put(ar(.5, 1500, 9000), t0 - .25, .4)][i % 4]()
        else: put(ar(.6, 400, 5000), t0 - .3, .55)                                           # troca de cena: sopro
        if not cin: put(ar(.35, 2000, 9000), t0 + .05, .18)                                  # título entrando: ar fino
        if c.get("fx") == "tremer": put(sub(48, 1.4), t0 + .02, .6)
        bs = c.get("boneco") or []; bs = bs if isinstance(bs, list) else [bs]
        for bo in bs:
            if bo.get("entrada") == "andando":
                for j in range(5): put(tecla(), t0 + .1 + j * .16, .35)
            if bo.get("pose") == "comemorando": put(brilho(), t0 + .3, .3)
            if bo.get("pose") == "chocado" and i: put(tensao(), t0 + .1, .5)
        # beats: zoom = sopro curto; destaque = sino (sobe a cada beat); reação do boneco = brilho ou tensão
        for j, bt in enumerate(c.get("beats", [])):
            tb = quando(c, bt.get("em", .5))
            if bt.get("foco"): put(ar(.4, 900, 6000), tb - .12, .28)
            if bt.get("destaque"): put(sino(notas[min(j, len(notas) - 1)] * 1.5, 1.8, 3.2), tb + .38, .32)
            if bt.get("pose") == "chocado": put(tensao(1.1), tb, .45)
            if bt.get("pose") == "comemorando": put(brilho(1175), tb + .05, .28)
        # fundo trocando de cor (motor cinético): sopro + impacto grave
        for j, (em, cor) in enumerate(c.get("fundo_cor", [])):
            if j or em:
                tf = quando(c, em); v = (i + j) % 3
                if v == 0: put(ar(.4, 500, 7000), tf - .2, .4); put(sub(58, .8), tf + .02, .45)
                elif v == 1: put(reverso(.4), tf - .4, .4); put(sub(66, .6), tf + .01, .35)
                else: put(ar(.3, 1200, 9000), tf - .15, .3); put(marimba(392, 8), tf + .02, .3); put(sub(52, .7), tf + .02, .3)
        # texto cinético (modo dinâmico): cada palavra-chave tem seu golpe de som, baixinho
        for j, kw in enumerate(c.get("kw", [])):
            tk = quando(c, kw.get("em", 0)); f = kw.get("fx", "punch")
            if f == "punch": put(ar(.22, 2500, 9000), tk - .1, .32); put(sub(64, .6), tk, .32)
            elif f == "slide": put(ar(.32, 700, 8000), tk - .18, .5)
            elif f == "stretch": put(swell(.35, 988), tk - .3, .28); put(sub(58, .5), tk + .02, .25)
            elif f == "drop": put(sub(72, .7), tk + .12, .4)
            elif f == "glitch": put(hp(lp(rng.standard_normal(int(.22 * SR)), 6000), 900) * np.repeat(rng.random(23) > .45, int(.22 * SR) // 23 + 1)[: int(.22 * SR)] * .5, tk, .5)
        p = c.get("prop") or {}; pr = p.get("tipo")
        if pr == "relogio":
            te = quando(c, p.get("em", .3))
            for q in range(9): put(tecla(), te + q * .17, .5)
            put(sino(1318.5, 1.8, 3), te + 1.45, .4)
        elif pr == "cards":
            for it in p.get("itens", []): tc = quando(c, it.get("em", .2)); put(ar(.32, 900, 7000), tc - .12, .38); put(sino(1046.5 if it.get("cor") != "red" else 784, 1.4, 4), tc + .2, .22)
        elif pr == "apuracao":
            put(sub(55, .9), quando(c, p.get("pausa_em", .4)), .5); put(tensao(), quando(c, p.get("pausa_em", .4)) + .1, .35)
            if p.get("volta_em") is not None: put(brilho(1047), quando(c, p["volta_em"]), .3)
        elif pr == "cotacao":
            for j, q in enumerate(p.get("pontos", [])):
                tq = quando(c, q.get("em", 0))
                if j: put(swell(.5, 784 + j * 196), tq - .45, .3); put(sub(60, .8), tq + .05, .35); put(tensao(.9), tq + .1, .25)
        elif pr == "fluxo":
            te = quando(c, p.get("em", .2))
            for q in range(9): put(sino(2349 + (q % 3) * 260, .35, 14), te + q * .3, .18)
        elif pr == "queda_bolsa": put(queda(), quando(c, p.get("em", .2)), .6); put(sub(50, 1.2), quando(c, p.get("pausa_em", .6)), .55)
        elif pr == "itens_sobe":
            for j, it in enumerate(p.get("itens", [])): ti = quando(c, it[2] if len(it) > 2 else .2); put(ar(.25, 1500, 8000), ti - .08, .3); put(sino(notas[min(j, len(notas) - 1)], 1.2, 4), ti + .25, .3)
        elif pr == "chat_demo":
            for m in p.get("msgs", []):
                tm = quando(c, m.get("em", .2))
                if m.get("de") == "cli":
                    for q in range(3): put(tecla(), tm - .7 + q * .18, .25)
                    put(bolha(560), tm, .6)
                else: put(enviada(), tm - .05, .55)
                if m.get("tag"): put(sino(1568, 1.6, 4), tm + .38, .35)
            if p.get("digitar"):
                d = p["digitar"]; td = quando(c, d.get("em", .3))
                for q in range(len(d["txt"])): put(tecla(), td + q * .14, .5)
                if d.get("vira"): put(brilho(1047), quando(c, d["vira"].get("em", .7)), .4)
            if p.get("preenchido"): tp = quando(c, p["preenchido"].get("em", .5)); put(ar(.3, 1500, 8000), tp - .1, .4); put(sino(1318.5, 1.8, 3), tp + .6, .35)
        elif pr == "avaliacao":
            rv = p.get("rev") or {}; put(bolha(520), quando(c, rv.get("em", .02)), .5)
            if (rv.get("estrelas") or 1) <= 2: put(tensao(), quando(c, rv.get("em", .02)) + .3, .4)
            else: put(brilho(1175), quando(c, rv.get("em", .02)) + .3, .3)
            rs = p.get("resp")
            if rs:
                ps = rs.get("partes", [])
                put(enviada(), quando(c, rs.get("em", ps[0].get("em", .3) if ps else .3)) - .05, .5)
                for j, q in enumerate(ps[1:], 1): put(sino(notas[min(j, len(notas) - 1)], 1.6, 3.4), quando(c, q.get("em", .5)), .38)
                if rs.get("tag"): put(sino(1568, 1.6, 4) if not rs.get("ruim") else tensao(), quando(c, rs.get("tag_em", rs.get("em", .3))) + .6, .35)
        elif pr == "qr_adesivo":
            ta = quando(c, p.get("em", .4)); put(ar(.4, 900, 6000), ta - .1, .35); put(sub(55, .9), ta + .45, .45); put(tensao(), ta + .5, .4)
        elif pr == "tela_menu":
            for j, s in enumerate(p.get("telas", [])):
                ts = quando(c, s.get("em", 0)) if j else t0
                if j: put(ar(.35, 1200, 7000), ts - .05, .3)
                for q in s.get("itens", []):
                    if len(q) > 3 and q[3] is not None: put(tecla(), quando(c, q[3]), .4)
                if s.get("toque") is not None: put(tecla(), quando(c, s["toque_em"]) if s.get("toque_em") is not None else ts + .7, .5)
                if s.get("pin"):
                    pe = quando(c, s["pin_em"]) if s.get("pin_em") is not None else ts + .6
                    for q in range(6): put(tecla(), pe + q * 1.4 / 6, .45)
                    put(sino(1568, 1.6, 4), pe + 1.5, .32)
        elif pr == "barras":
            for j, q in enumerate(p.get("itens", [])): put(sino(notas[min(j, len(notas) - 1)], 1.6, 3.4), quando(c, q.get("em", .5)), .4)
        elif pr == "link_montagem":
            for j, q in enumerate(p.get("partes", [])): put(sino(notas[min(j, len(notas) - 1)], 1.6, 3.4), quando(c, q.get("em", .5)), .42)
        elif pr == "whatsapp":
            for j, m in enumerate(p.get("msgs", [])): put(bolha(560 if m[0] != "eu" else 760), t0 + .5 + j * 1.1, .55)
        elif pr == "busca":
            q = p.get("consulta", "")
            for j in range(len(q)): put(tecla(), t0 + .1 + 1.2 * j / max(1, len(q)), .4)
            put(sino(1318.5), t0 + 2.3, .35)
        elif pr == "passo": put(sub(60, .9), t0 + .15, .4); put(sino(1046.5), t0 + .25, .35)
        elif pr in ("site_celular", "site_desktop"): put(ar(.7, 300, 4000), t0 + .05, .45); put(sino(1568, 2, 3), t0 + .7, .3)
        elif pr == "preco":
            for j in range(8): put(tecla(), t0 + .2 + j * .12, .3)
            put(brilho(1175), t0 + 1.3, .4)
        elif pr == "enquete": put(bolha(600), t0 + .3, .5); put(bolha(760), t0 + .5, .5)
        elif pr == "manchete":   # post entra deslizando; a tensão sobe e o carimbo FALSO bate
            te = quando(c, p.get("em", .5)); put(papel(.5), t0 + .02, .55)
            put(riser(1.3, 160, 1100), te - 1.25, .42); put(carimbo(), te + .02, .9); put(hit(40), te + .02, .55); put(tensao(1.4), te + .15, .3)
        elif pr == "mensagem":   # digitando..., a mensagem chega, o link é sublinhado e o carimbo GOLPE bate
            tc = quando(c, p.get("chega_em", .08))
            for q in range(4): put(tecla(), tc - .75 + q * .17, .22)
            put(bolha(560), tc, .6); put(subida(500, 800, .5), quando(c, p.get("link_em", .45)), .4)
            te = quando(c, p.get("em", .7)); put(riser(1.0, 200, 1000), te - .95, .32); put(carimbo(), te + .02, .85); put(tensao(1.2), te + .12, .3)
        elif pr == "pictos":     # cada ícone com seu som (moeda, mensagem ou nota de madeira subindo)
            ruim = p.get("ruim")
            for j, it in enumerate(p.get("itens", [])):
                ti = quando(c, it.get("em", j * .3)); ic = it.get("icone", "")
                put(pop(700 + 90 * j), ti, .35)
                if ic in ("💰", "💵", "🪙"): put(moeda(), ti + .04, .4)
                elif ic in ("💬", "📱"): put(bolha(600), ti + .04, .5)
                else: put(marimba((escala[::-1] if ruim else escala)[min(j * 2, 7)] / (2 if ruim else 1), 7), ti + .03, .45)
            if p.get("selo"):
                ts = quando(c, p["selo"].get("em", 0))
                if ruim: put(carimbo(), ts + .05, .5); put(tensao(1.1), ts + .1, .28)
                else: put(pluck(523.3), ts + .05, .45); put(pluck(659.3), ts + .12, .35); put(pluck(784), ts + .19, .35)
        elif pr == "linha":      # a linha desenha; cada ponto novo sobe ou desce de nota conforme o valor
            put(subida(250, 500, 1.0), t0 + .1, .5); pts = p.get("pontos", [])
            for j, q in enumerate(pts[1:], 1):
                tq = quando(c, q.get("em", .5)); desce = q.get("v", 0) < pts[j - 1].get("v", 0)
                put(subida(900, 520, .7) if desce else subida(520, 900, .7), tq - .05, .6); put(marimba(659.3 if desce else 784, 6) if j == 1 else marimba(523.3 if desce else 1046.5, 6), tq + .55, .45)
        elif pr == "degraus":    # cada degrau sobe com seu tom (mais alto a cada nível); a seta atravessa e brilha
            for j, it in enumerate(p.get("itens", [])):
                ti = quando(c, it.get("em", j * .25)); put(subida(220 * (1.4 ** j), 440 * (1.4 ** j), .8), ti, .55); put(marimba(escala[j * 2], 7), ti + .7, .4)
            ts = quando(c, p.get("seta_em", .7)); put(ar(.9, 600, 9000), ts, .35); put(brilho(1175), ts + .85, .3)
        elif pr == "barras_vs":  # barra enche (tom subindo) + número contando; a principal fecha com sino
            for j, it in enumerate(p.get("itens", [])):
                ti = quando(c, it.get("em", j * .3)); dim = it.get("cor") == "dim"
                put(subida(300, 600 if dim else 1000, 1.0), ti, .45); put(contagem(1.0, 10 if dim else 16), ti, .45)
                put(grave_suave() if dim else sino(1568, 1.6, 3.4), ti + 1.0, .35)
        elif pr == "escolha":    # cliente olha um, olha o outro, clica no concorrente e fecha lá
            te = quando(c, p.get("em", .55)); put(papel(.4), t0 + .02, .4); put(clique(), t0 + 1.0, .35)
            put(ar(.45, 1500, 9000), te - .3, .35); put(grave_suave(), te + .1, .4); put(clique(), te + .2, .6); put(sucesso(), te + .3, .5)
        elif pr == "antes_depois":  # a barra de luz passa revelando o site novo; brilho quando termina
            te = quando(c, p.get("em", .4)); put(reverso(.6), te - .6, .35); put(brilho_varre(1.2), te, .6); put(brilho(1047), te + 1.1, .3)
            for q in range(3): put(ar(.5, 300, 2500), te + 1.8 + q * 1.6, .12)                # rolagem do site, bem baixinho
        elif pr == "cta" and rot.get("motor") == "motor-cinetico.html":
            put(reverso(.8), t0 - .35, .35); put(sub(55, 1.), t0 + .4, .35)
            for j, f in enumerate((392, 523.3, 659.3, 784)): put(pluck(f, 1.6), t0 + .5 + j * .09, .35)
            put(sino(1568, 2.2, 2.6), t0 + .9, .2)
        elif pr == "cta": put(swell(1.0, 784), t0 - .2, .35); put(resolve(), t0 + .45, .55); put(brilho(1568), t0 + .6, .22)
        elif pr == "conta_off": put(tensao(), t0 + .3, .6); put(sub(), t0 + 1.2, .7)
        elif pr == "grafico": put(queda(), t0 + .2, .6)
        elif pr == "comparar": put(ar(.5), t0 + .2, .5); put(sub(70, .8), t0 + 1.1, .4); put(sino(1760), t0 + 2.5, .4)
        elif pr == "plano":
            for j in range(8): put(tecla(), t0 + .3 + j * .1, .3)
            put(brilho(), t0 + 1.3, .35)
    # reverb de sala (cauda curta e escura) pra dar profundidade e elegância
    k = np.arange(int(1.6 * SR)) / SR; ir = lp(rng.standard_normal(len(k)), 5000) * np.exp(-k * 3.6); ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(mix, ir)[:N]; mix = mix * .78 + wet * .32
    mix /= np.max(np.abs(mix)) + 1e-9
    return np.tanh(mix * 1.2) / np.tanh(1.2)


def tratar_voz(v: np.ndarray) -> np.ndarray:
    v = hp(v, 80)
    act = np.abs(v) > .02
    v = v * (.16 / (np.sqrt(np.mean(v[act] ** 2)) + 1e-9))
    return np.clip(v, -.97, .97)


# ---------------------------------------------------------------- vídeo
def render_frames(rot: dict, frames: Path, html: Path, total: float, workers: int = os.cpu_count() or 4):
    """Renderiza os quadros em paralelo: cada processo abre um navegador e faz uma fatia intercalada."""
    html.write_text((HERE / rot.get("motor", "motor.html")).read_text().replace("__ROTEIRO__", json.dumps(rot, ensure_ascii=False)))
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
    cortes = json.loads(Path(sys.argv[3]).read_text()) if len(sys.argv) > 3 else None
    vozes = falas_gravadas(gravacao, len(cenas), cortes) if gravacao else [voz_guia(c["fala"]) for c in cenas]
    t = .5; cortes = []
    for c, v in zip(cenas, vozes):
        d = len(v) / SR
        c["t0"] = round(t - (.35 if cortes else .5), 3); cortes.append(c["t0"])
        c["fala_t0"] = t; c["palavras"] = tempos_palavras(texto_legenda(rot, c), t, d)
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
        envv = np.convolve(np.abs(voz), np.ones(int(.12 * SR)) / int(.12 * SR), mode="same")   # envelope da voz
        duck = 1 - .45 * np.clip(envv / (np.percentile(envv[envv > 1e-4], 60) + 1e-9), 0, 1)       # efeitos abaixam sob a fala
        mix = voz + fx * .4 * duck; mix /= max(1, np.abs(mix).max() / .95)
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
