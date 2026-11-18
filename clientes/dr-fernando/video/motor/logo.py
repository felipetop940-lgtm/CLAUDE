"""Gera a logo dourada em alta (RGBA): forma nítida da versão clara + cor do dourado da versão marinho."""
import cv2, numpy as np, sys
src, out = sys.argv[1], sys.argv[2]
im = cv2.imread(src); split = 799; S = 4
top, bot = im[:split], im[split + 2:]
gt = cv2.cvtColor(top, cv2.COLOR_BGR2GRAY).astype(np.float32)
x0, y0, x1, y1 = 360, 297, 772, 590
a = np.clip((235 - gt[y0:y1, x0:x1]) / (235 - 40), 0, 1)
A = cv2.resize(a, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
A = cv2.GaussianBlur(A, (0, 0), S * .35)
A = np.clip((A - .5) / .22 + .5, 0, 1); A = A * A * (3 - 2 * A)          # borda nítida (tipo vetor)
# cor: dourado da versão de baixo, alinhado pelo bbox e estendido p/ fora da forma
bg = np.array([67, 45, 27], np.float32)
bx0, by0, bx1, by1 = 359, 233, 769, 525
tb = (366, 303, 765, 583)
crop = bot[by0:by1 + 1, bx0:bx1 + 1].astype(np.float32)
crop = cv2.resize(crop, (tb[2] - tb[0] + 1, tb[3] - tb[1] + 1), interpolation=cv2.INTER_AREA)
m = (np.abs(crop - bg).sum(2) > 120).astype(np.uint8)
col = np.zeros((y1 - y0, x1 - x0, 3), np.float32); mm = np.zeros((y1 - y0, x1 - x0), np.uint8)
oy, ox = tb[1] - y0, tb[0] - x0
col[oy:oy + crop.shape[0], ox:ox + crop.shape[1]] = crop; mm[oy:oy + crop.shape[0], ox:ox + crop.shape[1]] = m
c8 = np.clip(col, 0, 255).astype(np.uint8)
c8 = cv2.inpaint(c8, (1 - mm).astype(np.uint8), 6, cv2.INPAINT_TELEA)
C = cv2.resize(cv2.GaussianBlur(c8.astype(np.float32), (0, 0), 2.5), None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
# tom único de ouro: mantém só o brilho do metal da arte original, matiz e saturação fixos
V = cv2.cvtColor(np.clip(C, 0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.
V = np.clip((V - V[A > .5].min()) / (np.percentile(V[A > .5], 99.5) - V[A > .5].min() + 1e-4), 0, 1)
dark, light = np.array([52, 128, 176], np.float32), np.array([150, 222, 246], np.float32)   # BGR: ouro escuro -> champagne
C = dark + (light - dark) * V[..., None] ** .9
rgba = np.dstack([C, A * 255]).astype(np.uint8)
cv2.imwrite(out, rgba)
# partes: monograma e textos (para animar separado)
ys = np.where(a.max(1) > .3)[0]
gaps = np.where(np.diff(ys) > 8)[0]
cuts = [ys[0]] + [v for g in gaps for v in (ys[g], ys[g + 1])] + [ys[-1]]
print('blocos (y no recorte):', [(cuts[i], cuts[i + 1]) for i in range(0, len(cuts), 2)], 'tamanho', rgba.shape)
