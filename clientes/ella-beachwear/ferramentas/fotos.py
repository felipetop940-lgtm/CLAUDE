#!/usr/bin/env python3
"""Prepara fotos de produto para o catálogo da Ella.

- Print de story do Instagram: corta a barra de cima (hora, progresso, perfil) e a de baixo (mensagem)
- Foto normal: usa a imagem inteira
- Depois recorta em 3:4 (formato dos cards), reduz para 900 px de largura e salva em .webp

Uso (rodar dentro de clientes/ella-beachwear):
  python3 ferramentas/fotos.py fotos-novas/*.jpeg
  python3 ferramentas/fotos.py foto.jpg --nome biquini-cortininha-verde --foco 0.6

--nome  nome do arquivo de saída (só com 1 foto). Sem ele, usa o nome original.
--foco  altura do centro do recorte, de 0 (topo) a 1 (base). Padrão 0.5.
No fim, imprime um bloco pronto para colar em assets/js/produtos.js.
"""
import argparse
import re
import unicodedata
from pathlib import Path

from PIL import Image, ImageStat

SAIDA = Path(__file__).resolve().parent.parent / "assets/img/produtos"


def slug(txt: str) -> str:
    txt = unicodedata.normalize("NFD", txt).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", txt).strip("-") or "produto"


def escura(im: Image.Image, y: int) -> bool:
    linha = im.crop((0, y, im.width, y + 1))
    return sum(ImageStat.Stat(linha).mean[:3]) / 3 < 28


def corta_story(im: Image.Image) -> Image.Image:
    w, h = im.size
    if h / w < 1.9 or not escura(im, 2) or not escura(im, h - 3):
        return im  # não parece print de story
    topo = 0
    while topo < h * 0.2 and escura(im, topo):
        topo += 1
    base = h - 1
    while base > h * 0.7 and escura(im, base):
        base -= 1
    # a caixa "Enviar mensagem" fica na barra escura de baixo; o conteúdo termina um pouco antes
    topo += int(h * 0.064)  # barra de progresso + perfil por cima da foto
    base -= int(h * 0.012)  # cantos arredondados
    return im.crop((0, topo, w, base))


def recorta_34(im: Image.Image, foco: float) -> Image.Image:
    w, h = im.size
    if h / w > 4 / 3:
        nh = round(w * 4 / 3)
        y = round((h - nh) * min(1, max(0, foco)))
        return im.crop((0, y, w, y + nh))
    nw = round(h * 3 / 4)
    x = (w - nw) // 2
    return im.crop((x, 0, x + nw, h))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("fotos", nargs="+")
    ap.add_argument("--nome")
    ap.add_argument("--foco", type=float, default=0.5)
    a = ap.parse_args()
    SAIDA.mkdir(parents=True, exist_ok=True)
    blocos = []
    for f in a.fotos:
        im = Image.open(f).convert("RGB")
        im = recorta_34(corta_story(im), a.foco)
        if im.width > 900:
            im = im.resize((900, round(900 * im.height / im.width)), Image.LANCZOS)
        nome = slug(a.nome if a.nome and len(a.fotos) == 1 else Path(f).stem)
        destino = SAIDA / f"{nome}.webp"
        im.save(destino, "WEBP", quality=85, method=6)
        print(f"{f} -> {destino.relative_to(SAIDA.parent.parent.parent)} ({im.width}x{im.height})")
        blocos.append(f'''  {{
    id: "{nome}", codigo: "", nome: "[NOME DA PEÇA]",
    categoria: "Biquínis", modelo: "", calcinha: "", cor: "", estampa: "", detalhes: [],
    destaque: 0, novo: true, esgotado: false, tamanhos: [],
    preco: null, precoTop: null, precoCalcinha: null,
    descricao: "",
    fotos: ["assets/img/produtos/{nome}.webp"], fotoModelo: ""
  }},''')
    print("\n// Cole em assets/js/produtos.js e preencha:\n" + "\n".join(blocos))


if __name__ == "__main__":
    main()
