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
    # fotos da lista: o JS monta P + nome + ".webp"; troca por um mapa embutido
    imgs = sorted((ROOT / "assets/presentes").glob("*.webp"))
    mapa = ",".join(f'"{p.stem}":"{data_uri(p)}"' for p in imgs)
    html = html.replace('const P = "assets/presentes/";',
                        f'const IMG = {{{mapa}}};\nconst P = "";')
    html = html.replace('${P + g.img}.webp', '${IMG[g.img]}')
    assert "assets/" not in html, "sobrou caminho de arquivo sem embutir"
    DIST.mkdir(exist_ok=True)
    out = DIST / "index.html"
    out.write_text(html)
    with zipfile.ZipFile(ROOT / "stefanny-e-luan-site.zip", "w", zipfile.ZIP_DEFLATED) as z:
        z.write(out, "index.html")
    print(f"{out} ({out.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
