"""Motor de edição: planos -> transições -> grade -> motion graphics -> mp4.
uso: python3 render.py SEG_DIR FOTOS_DIR FONTS_DIR saida.mp4 [--quadros 0,30,60] [--ate N]
"""
import sys, os, math, subprocess, argparse
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from timeline import SHOTS, TRANS, CAPS, NAME, END, FPS, W, H, MW, MH, starts

ap = argparse.ArgumentParser()
ap.add_argument("seg"); ap.add_argument("fotos"); ap.add_argument("fonts"); ap.add_argument("out")
ap.add_argument("--quadros", default=""); ap.add_argument("--ate", type=int, default=0)
A = ap.parse_args()

INTER = "/usr/share/fonts/opentype/inter/"
CORM = os.path.join(A.fonts, "CormorantGaramond.ttf")
GOLD = (214, 182, 122)
GOLD_L = (232, 208, 160)
NAVY = (14, 24, 48)

ST, TOTAL = starts()
NF = int(round(TOTAL * FPS))
D = 5  # meia-janela de transição em quadros


def ease(x): x = min(max(x, 0.), 1.); return x * x * (3 - 2 * x)
def ein(x): x = min(max(x, 0.), 1.); return x * x * x
def eout(x): x = min(max(x, 0.), 1.); return 1 - (1 - x) ** 3


# ---------------------------------------------------------------- leitura dos planos
class Shot:
    def __init__(self, s):
        self.s = s
        if "foto" in s:
            im = cv2.imread(os.path.join(A.fotos, s["foto"] + ".jpg"))
            h, w = im.shape[:2]
            cw = int(h * 9 / 16)
            x0 = (w - cw) // 2
            im = im[:, x0:x0 + cw]
            self.still = cv2.resize(im, (MW, MH), interpolation=cv2.INTER_AREA)
            return
        self.cap = cv2.VideoCapture(os.path.join(A.seg, s["id"] + ".mp4"))
        self.n = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.pre = min(.45, s["t"])
        self.pos, self.last = -1, None

    def raw(self, tau):
        if "foto" in self.s:
            return self.still
        idx = int(round((self.pre + tau * self.s["spd"]) * 60))
        idx = max(0, min(self.n - 1, idx))
        if idx < self.pos:  # volta (raro): reabre
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, idx); self.pos = idx - 1
        while self.pos < idx:
            ok, fr = self.cap.read()
            if not ok: break
            self.pos += 1; self.last = fr
        return self.last

    def zoom(self, tau):
        z0, z1 = self.s["z"]
        return z0 + (z1 - z0) * min(max(tau / self.s["dur"], 0), 1)


SH = [Shot(s) for s in SHOTS]


def place(img, z, dx=0., dy=0.):
    s = (W / MW) * z
    M = np.float32([[s, 0, W / 2 - s * MW / 2 + dx], [0, s, H / 2 - s * MH / 2 + dy]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def shot_frame(i, tau, z_mul=1., dx=0., dy=0., radial=0.):
    sh = SH[i]; img = sh.raw(tau); z = sh.zoom(tau) * z_mul
    if radial <= 0.002:
        return place(img, z, dx, dy)
    acc = np.zeros((H, W, 3), np.float32)
    k = 5
    for j in range(k):
        acc += place(img, z * (1 + radial * j / (k - 1)), dx, dy)
    return (acc / k).astype(np.uint8)


def mblur(img, k, vertical=False):
    k = int(k)
    if k < 3: return img
    return cv2.blur(img, (1, k) if vertical else (k, 1))


# ---------------------------------------------------------------- luz (light leak)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def leak(t, inten, seed=0):
    """Vazamento de luz dourado/branco que atravessa o quadro."""
    if inten <= 0.01: return None
    rng = np.random.RandomState(seed)
    out = np.zeros((H // 4, W // 4, 3), np.float32)
    gy, gx = yy[::4, ::4] / 4, xx[::4, ::4] / 4
    for c, col in enumerate([(255, 196, 128), (255, 236, 205), (170, 200, 255)]):
        cx = (W / 4) * (rng.uniform(-.2, 1.2) + .35 * t * (1 if c % 2 else -1))
        cy = (H / 4) * rng.uniform(.1, .9)
        r = (W / 4) * rng.uniform(.35, .7)
        g = np.exp(-(((gx - cx) ** 2) + ((gy - cy) ** 2) * .35) / (r * r))
        out += g[..., None] * np.array(col[::-1], np.float32) / 255. * (.9 if c < 2 else .45)
    out = cv2.resize(out, (W, H), interpolation=cv2.INTER_LINEAR)
    return np.clip(out * inten, 0, 1.4)


def screen(img, light):
    if light is None: return img
    f = img.astype(np.float32) / 255.
    f = 1 - (1 - f) * (1 - np.clip(light, 0, 1))
    return (np.clip(f, 0, 1) * 255).astype(np.uint8)


# ---------------------------------------------------------------- grade
def curve(pts):
    x = np.arange(256) / 255.
    px, py = zip(*pts)
    return np.clip(np.interp(x, px, py) * 255, 0, 255).astype(np.uint8)


# BGR. Contraste suave, sombras puxando p/ marinho, altas levemente quentes e limpas
LUT = np.dstack([
    curve([(0, .035), (.25, .235), (.5, .5), (.75, .76), (.92, .91), (1, .975)]),   # B
    curve([(0, .02), (.25, .215), (.5, .49), (.75, .765), (.92, .925), (1, .985)]),  # G
    curve([(0, .015), (.25, .205), (.5, .49), (.75, .77), (.92, .93), (1, .99)]),    # R
]).reshape(1, 256, 3)
r2 = ((xx - W / 2) / (W * .75)) ** 2 + ((yy - H / 2) / (H * .72)) ** 2
VIG = (1 - .22 * np.clip(r2, 0, 1) ** 1.6).astype(np.float32)[..., None]
GR = [np.random.RandomState(k).normal(0, 3.2, (H // 2, W // 2, 1)).astype(np.float32) for k in range(6)]
GR = [cv2.resize(g, (W, H), interpolation=cv2.INTER_NEAREST)[..., None] for g in GR]


def grade(img, f):
    img = cv2.LUT(img, LUT)
    gray = cv2.cvtColor(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
    img = cv2.addWeighted(img, 1.10, gray, -0.10, 0)
    out = img.astype(np.float32) * VIG + GR[f % 6]
    return np.clip(out, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- tipografia
_cache = {}


def font(path, size, wght=None):
    key = (path, size, wght)
    if key not in _cache:
        ft = ImageFont.truetype(path, size)
        if wght is not None:
            try: ft.set_variation_by_axes([wght])
            except Exception: pass
        _cache[key] = ft
    return _cache[key]


def text_img(txt, ft, track=0, fill=(255, 255, 255), shadow=.55, upper=False):
    key = ("t", txt, id(ft), track, fill, shadow)
    if key in _cache: return _cache[key]
    if upper: txt = txt.upper()
    widths = [ft.getlength(ch) for ch in txt]
    tw = int(sum(widths) + track * (len(txt) - 1)) + 2
    asc, desc = ft.getmetrics()
    pad = 40
    im = Image.new("RGBA", (tw + 2 * pad, asc + desc + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x = pad
    for ch, w_ in zip(txt, widths):
        d.text((x, pad), ch, font=ft, fill=fill + (255,)); x += w_ + track
    if shadow > 0:
        a = im.split()[3].filter(ImageFilter.GaussianBlur(14))
        sh = Image.new("RGBA", im.size, NAVY + (0,)); sh.putalpha(a.point(lambda v: int(v * shadow)))
        im = Image.alpha_composite(sh, im)
    arr = np.asarray(im).astype(np.float32) / 255.
    _cache[key] = arr
    return arr


class Layer:
    def __init__(self):
        self.rgb = np.zeros((H, W, 3), np.float32); self.a = np.zeros((H, W, 1), np.float32); self.used = False

    def paste(self, arr, cx, cy, op=1., mask_x=None, anchor="c"):
        if op <= 0.003: return
        h, w = arr.shape[:2]
        x0 = int(round(cx - (w / 2 if anchor == "c" else 40))); y0 = int(round(cy - h / 2))
        xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
        if xa >= xb or ya >= yb: return
        src = arr[ya - y0:yb - y0, xa - x0:xb - x0]
        al = src[..., 3:4] * op
        if mask_x is not None:  # revelação da esquerda p/ direita até mask_x (coord absoluta)
            cols = np.arange(xa, xb, dtype=np.float32)
            al = al * np.clip((mask_x - cols) / 30., 0, 1)[None, :, None]
        rgb = src[..., :3][..., ::-1]  # RGB->BGR
        R = self.rgb[ya:yb, xa:xb]; Al = self.a[ya:yb, xa:xb]
        self.rgb[ya:yb, xa:xb] = R * (1 - al) + rgb * al
        self.a[ya:yb, xa:xb] = Al + al * (1 - Al)
        self.used = True

    def rect(self, x0, y0, x1, y1, col, op):
        if op <= 0.003 or x1 <= x0 or y1 <= y0: return
        x0, y0, x1, y1 = [int(round(v)) for v in (x0, y0, x1, y1)]
        c = np.array(col[::-1], np.float32) / 255.
        self.rgb[y0:y1, x0:x1] = self.rgb[y0:y1, x0:x1] * (1 - op) + c * op
        self.a[y0:y1, x0:x1] = self.a[y0:y1, x0:x1] + op * (1 - self.a[y0:y1, x0:x1])
        self.used = True

    def comp(self, img):
        if not self.used: return img
        f = img.astype(np.float32) / 255.
        f = f * (1 - self.a) + self.rgb * self.a
        return (np.clip(f, 0, 1) * 255).astype(np.uint8)


def fade_io(t, t0, t1, fi=.35, fo=.3):
    if t < t0 or t > t1: return 0., 0.
    a = eout((t - t0) / fi); b = ease((t1 - t) / fo)
    return min(a, b), a


def graphics(t, L):
    # cantoneiras de visor nos 2,5 s iniciais
    op = min(ease((t - .15) / .4), ease((2.45 - t) / .3)) * .55
    if op > 0:
        m, ln, th = 66, 58, 3
        for (cx, cy, sx, sy) in [(m, m + 40, 1, 1), (W - m, m + 40, -1, 1), (m, H - m - 260, 1, -1), (W - m, H - m - 260, -1, -1)]:
            L.rect(min(cx, cx + sx * ln), min(cy, cy + sy * th), max(cx, cx + sx * ln), max(cy, cy + sy * th), (255, 255, 255), op)
            L.rect(min(cx, cx + sx * th), min(cy, cy + sy * ln), max(cx, cx + sx * th), max(cy, cy + sy * ln), (255, 255, 255), op)

    # legendas discretas
    ft = font(INTER + "Inter-Regular.otf", 46)
    for txt, t0, t1 in CAPS:
        op, a = fade_io(t, t0, t1)
        if op <= 0: continue
        arr = text_img(txt, ft, track=2, shadow=.85)
        y = 1300 + (1 - a) * 22 - max(0, (t - (t1 - .3)) / .3) * 10
        L.paste(arr, W / 2, y, op)
        lw = 130 * eout((t - t0 - .12) / .55)
        L.rect(W / 2 - lw / 2, y + 44, W / 2 + lw / 2, y + 46, GOLD, op * .95)

    # lower third com o nome
    n1, n2, t0, t1 = NAME
    if t0 <= t <= t1:
        op = ease((t1 - t) / .35)
        x = 92; ytop = 1150
        hl = 150 * eout((t - t0) / .35)
        L.rect(x, ytop, x + 3, ytop + hl, GOLD, op)
        rev = x + 20 + 900 * eout((t - t0 - .15) / .7)
        a1 = text_img(n1, font(CORM, 96, 500), track=1, shadow=.65)
        a2 = text_img(n2, font(INTER + "Inter-Medium.otf", 27), track=7, fill=GOLD_L, shadow=.7, upper=True)
        L.paste(a1, x + 26, ytop + 52, op, mask_x=rev, anchor="l")
        L.paste(a2, x + 30, ytop + 124, op, mask_x=rev - 60, anchor="l")

    # cartela final
    e = END; t0 = e["t0"]
    if t >= t0:
        op_all = 1.
        cy = 760
        lw = 180 * eout((t - t0 - .45) / .6)
        L.rect(W / 2 - lw / 2, cy - 120, W / 2 + lw / 2, cy - 118, GOLD, op_all)
        a = eout((t - t0 - .6) / .7)
        L.paste(text_img(e["linha1"], font(CORM, 132, 500), track=1, shadow=.55), W / 2, cy - 30 + (1 - a) * 26, a * op_all)
        a = eout((t - t0 - .9) / .7)
        L.paste(text_img(e["linha2"], font(INTER + "Inter-Medium.otf", 30), track=10, fill=GOLD_L, shadow=.6, upper=True),
                W / 2, cy + 62 + (1 - a) * 18, a * op_all)
        a = eout((t - t0 - 1.5) / .6)
        if a > 0:
            cta = text_img(e["cta"], font(INTER + "Inter-Regular.otf", 40), track=2, shadow=.0)
            bw, bh = cta.shape[1] - 80 + 110, 96
            by = cy + 200 + (1 - a) * 16
            o = a * op_all
            L.rect(W / 2 - bw / 2, by - bh / 2, W / 2 + bw / 2, by + bh / 2, NAVY, .55 * o)
            for (x0, y0, x1, y1) in [(-bw / 2, -bh / 2, bw / 2, -bh / 2 + 2), (-bw / 2, bh / 2 - 2, bw / 2, bh / 2),
                                     (-bw / 2, -bh / 2, -bw / 2 + 2, bh / 2), (bw / 2 - 2, -bh / 2, bw / 2, bh / 2)]:
                L.rect(W / 2 + x0, by + y0, W / 2 + x1, by + y1, GOLD, .9 * o)
            L.paste(cta, W / 2, by + 2, o)
            # brilho que corre no botão
            sx = (t - t0 - 2.4) / .9
            if 0 < sx < 1:
                px = W / 2 - bw / 2 + sx * bw
                for k in range(-18, 19, 3):
                    L.rect(px + k, by - bh / 2 + 2, px + k + 3, by + bh / 2 - 2, (255, 255, 255), .18 * (1 - abs(k) / 18) * o)


# ---------------------------------------------------------------- composição
def base_frame(f):
    t = f / FPS
    i = max(k for k in range(len(SH)) if ST[k] <= t + 1e-6)
    # transição de entrada do plano i?
    for j in (i, i + 1):
        if 1 <= j < len(SH):
            b = int(round(ST[j] * FPS)); d = 9 if TRANS.get(j) == "fade_white" else D
            if b - d <= f < b + d:
                p = (f - (b - d)) / (2 * d)
                ta, tb = t - ST[j - 1], t - ST[j]
                return transition(TRANS.get(j, "cut"), j - 1, ta, j, tb, p, j)
    return shot_frame(i, t - ST[i])


def transition(kind, ia, ta, ib, tb, p, seed):
    if kind.startswith("whip"):
        dirx, diry = {"whip_left": (-1, 0), "whip_right": (1, 0), "whip_up": (0, -1)}[kind]
        span = (W if dirx else H) * .20
        if p < .5:
            e = ein(p * 2); img = shot_frame(ia, ta, 1 + .04 * e, dirx * e * span, diry * e * span)
        else:
            e = 1 - eout((p - .5) * 2); img = shot_frame(ib, tb, 1 + .04 * e, -dirx * e * span, -diry * e * span)
        return mblur(img, 2 + (230 if diry else 160) * e, vertical=bool(diry))
    if kind == "zoom_in":
        if p < .5:
            e = ein(p * 2); return shot_frame(ia, ta, 1 + .45 * e, radial=.10 * e)
        e = 1 - eout((p - .5) * 2); return shot_frame(ib, tb, 1 + .30 * e, radial=.10 * e)
    a = shot_frame(ia, ta); b = shot_frame(ib, tb)
    m = ease(p)
    img = cv2.addWeighted(a, 1 - m, b, m, 0)
    if kind == "flash":
        pk = (1 - abs(2 * p - 1)) ** 2
        img = screen(img, np.full((1, 1, 3), .85 * pk, np.float32))
    elif kind == "leak":
        img = screen(img, leak(p, (1 - abs(2 * p - 1)) ** 1.5 * .75, seed))
    elif kind == "fade_white":
        pk = (1 - abs(2 * p - 1)) ** 2
        img = screen(img, leak(p, .7 * pk, seed))
    return img


def endcard_dim(img, t):
    if t < END["t0"]: return img
    a = ease((t - END["t0"] - .1) / .8)
    f = img.astype(np.float32)
    grad = np.clip(1 - (yy / H - .30) / .45, 0, 1)[..., None] * .62 + .22
    nav = np.array(NAVY[::-1], np.float32)
    f = f * (1 - grad * a) + nav * grad * a
    return np.clip(f, 0, 255).astype(np.uint8)


def frame(f):
    t = f / FPS
    img = base_frame(f)
    img = grade(img, f)
    img = endcard_dim(img, t)
    # abertura: do preto com vazamento de luz
    if t < .7:
        img = screen(img, leak(t * 1.4, 1.0 * (1 - ease(t / .7)), 7))
        img = (img.astype(np.float32) * ease(t / .35)).astype(np.uint8)
    L = Layer(); graphics(t, L); img = L.comp(img)
    if t > TOTAL - .6:
        img = (img.astype(np.float32) * ease((TOTAL - t) / .6)).astype(np.uint8)
    return img


if A.quadros:
    for q in [int(v) for v in A.quadros.split(",")]:
        global_reset = [Shot(s) for s in SHOTS]; SH[:] = global_reset
        cv2.imwrite(f"{A.out}_{q:04d}.jpg", frame(q), [cv2.IMWRITE_JPEG_QUALITY, 92])
    sys.exit()

n = A.ate or NF
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                        "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "9M", "-bufsize", "18M", "-pix_fmt", "yuv420p",
                        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", A.out], stdin=subprocess.PIPE)
for f in range(n):
    enc.stdin.write(frame(f).tobytes())
    if f % 60 == 0: print(f"{f}/{n}", flush=True)
enc.stdin.close(); enc.wait()
print("pronto", A.out, f"{TOTAL:.2f}s")
