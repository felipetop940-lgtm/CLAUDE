#!/usr/bin/env python3
"""Gera dist/index.html: arquivo único com todas as fotos embutidas (abre direto no navegador
ou sobe em qualquer hospedagem) + stefanny-e-luan-site.zip.

Uso: python3 build.py
"""
import base64
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"


def data_uri(path: Path) -> str:
    return "data:image/webp;base64," + base64.b64encode(path.read_bytes()).decode()


def main() -> None:
    html = (ROOT / "index.html").read_text()
    # biblioteca do QR Code embutida
    js = (ROOT / "assets/js/qrcode.js").read_text()
    html = html.replace('<script src="assets/js/qrcode.js"></script>', "<script>\n" + js + "\n</script>")
    # fotos referenciadas direto no HTML (src="assets/....webp")
    html = re.sub(r'assets/fotos/[\w-]+\.webp', lambda m: data_uri(ROOT / m.group(0)), html)
    # fotos da lista e das cotas: o JS monta o caminho; troca por um mapa embutido
    imgs = [("p/", p) for p in sorted((ROOT / "assets/presentes").glob("*.webp"))]
    imgs += [("c/", p) for p in sorted((ROOT / "assets/cotas").glob("*.webp"))]
    mapa = ",".join(f'"{k}{p.stem}":"{data_uri(p)}"' for k, p in imgs)
    for a, b in [('const P = "assets/presentes/", C = "assets/cotas/";', f"const IMG = {{{mapa}}};"),
                 ('const src = g => (g.cat === "fun" ? C : P) + g.img + ".webp";',
                  'const src = g => IMG[(g.cat === "fun" ? "c/" : "p/") + g.img];')]:
        assert a in html, a
        html = html.replace(a, b)
    assert "assets/" not in html, "sobrou caminho de arquivo sem embutir"
    DIST.mkdir(exist_ok=True)
    out = DIST / "index.html"
    out.write_text(html)
    with zipfile.ZipFile(ROOT / "stefanny-e-luan-site.zip", "w", zipfile.ZIP_DEFLATED) as z:
        z.write(out, "index.html")
    print(f"{out} ({out.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
