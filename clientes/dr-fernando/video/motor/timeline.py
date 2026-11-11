# Linha do tempo do vídeo Dr. Fernando (saída 1080x1920 @30fps)
# crop = (x, y, lado) normalizado no quadro 2160x3840 já rotacionado (lado = fração da largura e da altura)
FPS = 30
W, H = 1080, 1920
MW, MH = 1188, 2112          # intermediário 1.1x para punch-in sem perder nitidez
BAR = 2.5                    # 96 BPM -> 4 tempos = 2.5 s

SHOTS = [
    # id, arquivo, ini_fonte, velocidade, dur_saida, crop, zoom(ini,fim), pan(dx,dy em fração)
    dict(id="s01", src="IMG_0740", t=8.00,  spd=.50, dur=1.25, crop=(0.00, 0.00, 1.00), z=(1.00, 1.07)),
    dict(id="s00", src="IMG_0740", t=12.00, spd=.50, dur=1.25, crop=(0.00, 0.00, 1.00), z=(1.10, 1.02)),
    dict(id="s02", src="IMG_0757", t=0.20,  spd=.80, dur=2.50, crop=(0.00, 0.00, 1.00), z=(1.00, 1.07)),
    dict(id="s03", src="IMG_0739", t=2.60,  spd=.60, dur=1.25, crop=(0.04, 0.31, 0.66), z=(1.00, 1.06)),
    dict(id="s04", src="IMG_0754", t=9.20,  spd=.60, dur=1.25, crop=(0.54, 0.16, 0.44), z=(1.00, 1.05)),
    dict(id="s05", src="IMG_0756", t=0.00,  spd=.80, dur=2.50, crop=(0.00, 0.00, 1.00), z=(1.08, 1.00)),
    dict(id="s06", src="IMG_0757", t=13.0,  spd=1.0, dur=2.50, crop=(0.00, 0.00, 1.00), z=(1.00, 1.06)),
    dict(id="s07", src="IMG_0757", t=3.00,  spd=.80, dur=1.25, crop=(0.00, 0.00, 1.00), z=(1.05, 1.00)),
    dict(id="s08", src="IMG_0758", t=3.00,  spd=.80, dur=1.25, crop=(0.00, 0.00, 1.00), z=(1.00, 1.05)),
    dict(id="s09", src="IMG_0757", t=20.0,  spd=.80, dur=2.50, crop=(0.00, 0.00, 1.00), z=(1.00, 1.07)),
    dict(id="s10", src="IMG_0739", t=5.30,  spd=1.0, dur=2.50, crop=(0.00, 0.00, 1.00), z=(1.07, 1.00)),
    dict(id="s11", foto="IMG_0742", dur=5.00, z=(1.00, 1.10)),
]

# Transições na ENTRADA de cada plano (índice do plano)
TRANS = {
    1: "whip_up", 2: "flash", 3: "zoom_in", 4: "whip_left", 5: "leak",
    6: "whip_right", 7: "zoom_in", 8: "whip_up", 9: "leak", 10: "whip_left", 11: "fade_white",
}

# Legendas discretas (texto, ini, fim)
CAPS = [
    ("Cada detalhe importa.", 0.35, 2.30),
    ("Do preparo", 2.75, 4.75),
    ("à técnica.", 5.15, 7.30),
    ("Técnica em cada etapa.", 10.20, 12.30),
    ("Cuidado do início ao fim.", 15.20, 17.30),
]
NAME = ("Dr. Fernando", "Augusto de Oliveira", 7.65, 9.85)   # lower third
END = dict(t0=20.0, linha1="Dr. Fernando", linha2="Augusto de Oliveira", cta="Agende sua avaliação")


def starts():
    t, out = 0.0, []
    for s in SHOTS:
        out.append(t)
        t += s["dur"]
    return out, t
