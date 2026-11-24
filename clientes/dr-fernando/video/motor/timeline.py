# Linha do tempo do vídeo Dr. Fernando (saída 1080x1920 @30fps)
# crop = (x, y, lado) normalizado no quadro 2160x3840 já rotacionado (lado = fração da largura e da altura)
FPS = 30
W, H = 1080, 1920
MW, MH = 1188, 2112          # intermediário 1.1x para punch-in sem perder nitidez
BAR = 2.5                    # 96 BPM -> 4 tempos = 2.5 s

SHOTS = [
    # id, arquivo, ini_fonte, velocidade, dur_saida, crop, zoom(ini,fim), pan(dx,dy em fração)
    dict(id="s01", src="IMG_0740", t=8.00,  spd=.50, dur=1.25, crop=(0.00, 0.00, 1.00), z=(1.00, 1.07), ex=.85, rec=.6),
    dict(id="s00", src="IMG_0740", t=12.00, spd=.50, dur=1.25, crop=(0.00, 0.00, 1.00), z=(1.10, 1.02), ex=.80, rec=.8),
    dict(id="s02", foto="IMG_0745", dur=2.50, z=(1.00, 1.08), ex=.95, rec=.3),
    dict(id="s03", src="IMG_0739", t=2.60,  spd=.60, dur=1.25, crop=(0.04, 0.31, 0.66), z=(1.00, 1.06), ex=.92, rec=.4),
    dict(id="s04", src="IMG_0754", t=9.20,  spd=.60, dur=1.25, crop=(0.54, 0.16, 0.44), z=(1.00, 1.05), ex=.85, rec=.6),
    dict(id="s05", src="IMG_0740", t=2.20,  spd=.60, dur=2.50, crop=(0.46, 0.00, 0.54), z=(1.00, 1.06), ex=.92, rec=.4),
    dict(id="s06", src="IMG_0758", t=3.00,  spd=.80, dur=2.50, crop=(0.00, 0.00, 1.00), z=(1.00, 1.06), ex=.95, rec=.3),
    dict(id="s07", foto="IMG_0743", dur=1.25, z=(1.07, 1.00), ex=.95, rec=.3),
    dict(id="s08", src="IMG_0740", t=5.00,  spd=.60, dur=1.25, crop=(0.00, 0.00, 1.00), z=(1.00, 1.05), ex=.85, rec=.6),
    dict(id="s09", foto="IMG_0747", dur=2.50, z=(1.08, 1.00), ex=.95, rec=.3),
    dict(id="s10", src="IMG_0739", t=5.30,  spd=1.0, dur=2.50, crop=(0.00, 0.00, 1.00), z=(1.07, 1.00), ex=.95, rec=.3),
    dict(id="s11", foto="IMG_0742", dur=5.00, z=(1.00, 1.10)),
]

# Transições na ENTRADA de cada plano (índice do plano)
TRANS = {
    1: "whip_up", 2: "dip", 3: "zoom_in", 4: "whip_left", 5: "zoom_in",
    6: "whip_right", 7: "zoom_in", 8: "whip_up", 9: "whip_right", 10: "whip_left", 11: "fade_white",
}

# Legendas discretas (texto, ini, fim)
CAPS = [
    ("Tudo começa pela", 0.35, 2.30),
    ("indicação correta.", 2.75, 4.75),
    ("Depois, a técnica.", 5.15, 7.30),
    ("Precisão em cada etapa.", 10.20, 12.30),
    ("E uma finalização cuidadosa.", 15.20, 17.30),
]
NAME = ("Fernando Augusto", "Médico · CRM-GO 29.367", 7.65, 9.85)   # lower third
END = dict(t0=20.0, logo="logo/logo_dourada.png", cta="Agende sua avaliação")


def starts():
    t, out = 0.0, []
    for s in SHOTS:
        out.append(t)
        t += s["dur"]
    return out, t
