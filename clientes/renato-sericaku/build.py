#!/usr/bin/env python3
"""Gera a versão de publicação em dist/.

- dist/index.html  → arquivo único: CSS, JS, fontes e imagens SVG embutidos
- dist/assets/img: favicon e imagem de compartilhamento (og-image)
- renato-sericaku-site.zip → pacote pronto para subir na hospedagem

Imagens grandes (fotos .webp/.jpg/.png) não são embutidas: vão para dist/assets/img.
Uso: python3 build.py
"""
import base64
import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
MIME = {".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}
INLINE_LIMIT = 60_000  # bytes: arquivos maiores ficam como arquivo externo


def data_uri(path: Path) -> str:
    return f"data:{MIME[path.suffix]};base64," + base64.b64encode(path.read_bytes()).decode()


def asset(ref: str, base: Path) -> str:
    """Embute o arquivo se for pequeno; senão copia para dist e mantém o caminho."""
    src = (base / ref).resolve()
    if src.stat().st_size <= INLINE_LIMIT:
        return data_uri(src)
    rel = src.relative_to(ROOT)
    (DIST / rel).parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, DIST / rel)
    return str(rel)


def build_css() -> str:
    css_path = ROOT / "assets/css/styles.css"
    css = css_path.read_text()
    css = re.sub(r'url\("?(\.\./[^")]+)"?\)', lambda m: f'url("{asset(m.group(1), css_path.parent)}")', css)
    return css


def build_page(name: str, css: str) -> None:
    html = (ROOT / name).read_text()
    # CSS embutido; preloads de fonte ficam desnecessários
    html = re.sub(r'\s*<link rel="preload" href="assets/fonts/[^>]+>', "", html)
    html = re.sub(r'<link rel="stylesheet" href="assets/css/styles.css">', f"<style>\n{css}\n</style>", html)
    # JS embutido
    def inline_js(m):
        return "<script>\n" + (ROOT / m.group(1)).read_text() + "\n</script>"
    html = re.sub(r'<script src="(assets/js/[^"]+)"(?: defer)?></script>', inline_js, html)
    # main.js deixa de ser defer: move para o fim do body já garante o DOM pronto
    # Vídeos: embutidos no próprio HTML (tocam sem arquivo externo). O conteúdo vai no fim da
    # página, para não atrasar a exibição; o JS cria o vídeo a partir dele no clique do play.
    embeds = []
    def embed_video(m):
        src = ROOT / m.group(1)
        vid = "vid-" + src.stem
        embeds.append(f'<script type="application/octet-stream" id="{vid}" data-mime="video/mp4">'
                      + base64.b64encode(src.read_bytes()).decode() + "</script>")
        return f'<video data-embed="{vid}"'
    html = re.sub(r'<video src="(assets/video/[^"]+)"', embed_video, html)
    html = re.sub(r'poster="(assets/video/[^"]+)"', lambda m: f'poster="{data_uri(ROOT / m.group(1))}"', html)
    if embeds:
        html = html.replace("</body>", "\n".join(embeds) + "\n</body>")
    # Imagens locais (src e preload)
    html = re.sub(r'<link rel="preload" as="image" href="assets/img/[^"]+\.svg">\s*', "", html)
    html = re.sub(r'(src|href|poster)="(assets/(?:img|video)/[^"]+)"',
                  lambda m: f'{m.group(1)}="{asset(m.group(2), ROOT)}"' if (ROOT / m.group(2)).exists() else m.group(0),
                  html)
    (DIST / name).write_text(html)


def main() -> None:
    shutil.rmtree(DIST, ignore_errors=True)
    DIST.mkdir()
    css = build_css()
    for page in ["index.html"]:
        build_page(page, css)
    (DIST / "assets/img").mkdir(parents=True, exist_ok=True)
    for extra in ["assets/img/favicon.svg", "assets/img/og-image.jpg"]:
        if (ROOT / extra).exists():
            shutil.copy2(ROOT / extra, DIST / extra)

    zip_path = ROOT / "renato-sericaku-site.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(DIST.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(DIST))
    size = (DIST / "index.html").stat().st_size / 1024
    print(f"dist/index.html: {size:.0f} KB · pacote: {zip_path.name}")


if __name__ == "__main__":
    main()
