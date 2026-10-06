#!/usr/bin/env python3
"""Gera a versão de publicação em dist/.

- dist/index.html → CSS, JS e fontes embutidos (arquivo único)
- dist/assets/video e dist/assets/img → copiados (vídeo grande não é embutido)
- cargos-jr-eventos-site.zip → pacote pronto para subir na hospedagem
Uso: python3 build.py
"""
import base64
import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
MIME = {".woff2": "font/woff2", ".svg": "image/svg+xml"}


def data_uri(p: Path) -> str:
    return f"data:{MIME[p.suffix]};base64," + base64.b64encode(p.read_bytes()).decode()


def build_css() -> str:
    css_path = ROOT / "assets/css/styles.css"
    css = css_path.read_text()
    return re.sub(r'url\("(\.\./fonts/[^"]+)"\)',
                  lambda m: f'url("{data_uri((css_path.parent / m.group(1)).resolve())}")', css)


def main() -> None:
    shutil.rmtree(DIST, ignore_errors=True)
    DIST.mkdir()
    html = (ROOT / "index.html").read_text()
    html = re.sub(r'\s*<link rel="preload" href="assets/fonts/[^>]+>', "", html)
    html = html.replace('<link rel="stylesheet" href="assets/css/styles.css">', f"<style>\n{build_css()}\n</style>")
    html = re.sub(r'<script src="(assets/js/[^"]+)"></script>',
                  lambda m: "<script>\n" + (ROOT / m.group(1)).read_text() + "\n</script>", html)
    (DIST / "index.html").write_text(html)
    for d in ["img", "video"]:
        src = ROOT / "assets" / d
        if src.exists():
            shutil.copytree(src, DIST / "assets" / d)
    zip_path = ROOT / "cargos-jr-eventos-site.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(DIST.rglob("*")):
            if f.is_file() and f.name != ".gitkeep":
                z.write(f, f.relative_to(DIST))
    print(f"dist/index.html: {(DIST / 'index.html').stat().st_size / 1024:.0f} KB · {zip_path.name}")


if __name__ == "__main__":
    main()
