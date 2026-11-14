"""Grade v3: protege altas luzes, médios mais densos, cor rica (marinho profundo, pele quente, brancos limpos),
claridade local e nitidez. Entrada/saída BGR uint8."""
import numpy as np, cv2


def _lut(fn):
    x = np.arange(256, dtype=np.float32) / 255.
    return np.clip(fn(x) * 255 + .5, 0, 255).astype(np.uint8)


def tone(x):
    # exposição leve + curva S com ombro suave (nunca chega no branco chapado)
    x = np.clip(x * 1.0, 0, None)
    s = x + .20 * x * (1 - x) * (x - .40) * 2.2          # contraste nos médios, pivô 0.40
    sh = .80 + .14 * (1 - np.exp(-(s - .80) / .14))       # ombro acima de 0.80 -> máx ~0.94
    s = np.where(s > .80, sh, s)
    return np.clip(.012 + s * .988, 0, 1)                 # preto levemente "aveludado"


TONE = _lut(tone)
# split-tone (BGR): sombras puxam p/ marinho, altas neutras-quentes bem de leve
_x = np.arange(256, dtype=np.float32) / 255.
SPLIT = np.stack([
    np.clip(_x + .030 * (1 - _x) ** 3 - .014 * _x ** 3, 0, 1),   # B
    np.clip(_x + .004 * (1 - _x) ** 3, 0, 1),                    # G
    np.clip(_x - .012 * (1 - _x) ** 3 + .010 * _x ** 3, 0, 1),   # R
], 1)
SPLIT = (SPLIT * 255 + .5).astype(np.uint8).reshape(1, 256, 3)


_EXL = {}


def expo_lut(ex):
    # exposição em luz linear (gama 2.2) com joelho suave nas altas
    if ex not in _EXL:
        x = np.arange(256, dtype=np.float32) / 255.
        lin = x ** 2.2 * ex
        _EXL[ex] = (np.clip(lin, 0, 1) ** (1 / 2.2) * 255 + .5).astype(np.uint8)
    return _EXL[ex]


def grade(img, grain=None, vig=None, ex=1.0, rec=0.0):
    if ex != 1.0: img = cv2.LUT(img, expo_lut(ex))
    img = cv2.LUT(img, TONE)
    f = img.astype(np.float32) * (1 / 255.)
    Y = f[..., 0] * .114 + f[..., 1] * .587 + f[..., 2] * .299
    # claridade (contraste local) só nos médios
    small = cv2.resize(Y, (Y.shape[1] // 4, Y.shape[0] // 4), interpolation=cv2.INTER_AREA)
    blur = cv2.resize(cv2.GaussianBlur(small, (0, 0), 7), (Y.shape[1], Y.shape[0]), interpolation=cv2.INTER_LINEAR)
    mid = 4 * Y * (1 - Y)
    dY = .38 * (Y - blur) * mid
    # recuperação de altas luzes por região (tipo "Realces -" do Lightroom): escurece áreas grandes e claras
    big = cv2.resize(cv2.GaussianBlur(small, (0, 0), 22), (Y.shape[1], Y.shape[0]), interpolation=cv2.INTER_LINEAR)
    hl = np.clip((big - .62) / .28, 0, 1); hl = hl * hl * (3 - 2 * hl)
    dY -= .085 * hl * (.6 + .4 * Y)
    if rec > 0:  # planos dominados por branco (luvas): baixa o nível das altas e realça o volume/sombreado delas
        half = cv2.resize(Y, (Y.shape[1] // 2, Y.shape[0] // 2), interpolation=cv2.INTER_AREA)
        hc = cv2.resize(cv2.GaussianBlur(half, (0, 0), 9), (Y.shape[1], Y.shape[0]), interpolation=cv2.INTER_LINEAR)
        hi = np.clip((hc - .50) / .38, 0, 1); hi = hi * hi * (3 - 2 * hi)
        dY += rec * (1.6 * np.clip(Y - hc, -.25, .04) - .16) * hi
    # nitidez fina na luminância
    dY += .40 * (Y - cv2.GaussianBlur(Y, (0, 0), 1.1))
    # vibrance: satura mais o que está pouco saturado, protege pele/amarelo do avental
    mx, mn = f.max(2), f.min(2)
    sat = (mx - mn) / (mx + 1e-4)
    amt = .30 * (1 - sat) ** 1.4
    f = Y[..., None] + (f - Y[..., None]) * (1 + amt[..., None])
    f += dY[..., None]
    if vig is not None: f *= vig
    f = np.clip(f, 0, 1)
    out = (f * 255 + .5).astype(np.uint8)
    out = cv2.LUT(out, SPLIT)
    if grain is not None:
        out = np.clip(out.astype(np.int16) + grain, 0, 255).astype(np.uint8)
    return out
