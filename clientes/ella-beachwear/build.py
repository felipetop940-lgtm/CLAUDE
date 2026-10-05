#!/usr/bin/env python3
"""Gera a versão de publicação em dist/ e a prévia autocontida.

- dist/index.html  → CSS, JS, fontes e imagens pequenas embutidos
- dist/assets/img  → fotos (produtos e loja), favicon e imagem de compartilhamento
- ella-beachwear-site.zip → pacote pronto para subir na hospedagem
- preview-ella.html → arquivo único com TUDO embutido (para mandar no WhatsApp e abrir no celular)

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
IMG_REF = re.compile(r'assets/img/[\w./-]+\.(?:webp|jpe?g|png|svg)')


def data_uri(path: Path) -> str:
    return f"data:{MIME[path.suffix]};base64," + base64.b64encode(path.read_bytes()).decode()


def make_asset(limit: int):
    def asset(ref: str, base: Path = ROOT) -> str:
        """Embute o arquivo se for pequeno; senão copia para dist e mantém o caminho."""
        src = (base / ref).resolve()
        if src.stat().st_size <= limit:
            return data_uri(src)
        rel = src.relative_to(ROOT)
        (DIST / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, DIST / rel)
        return str(rel)
    return asset


def build(out: Path, limit: int) -> None:
    asset = make_asset(limit)
    css_path = ROOT / "assets/css/styles.css"
    css = re.sub(r'url\("?(\.\./[^")]+)"?\)', lambda m: f'url("{asset(m.group(1), css_path.parent)}")', css_path.read_text())

    html = (ROOT / "index.html").read_text()
    html = re.sub(r'\s*<link rel="preload" href="assets/fonts/[^>]+>', "", html)
    html = html.replace('<link rel="stylesheet" href="assets/css/styles.css">', f"<style>\n{css}\n</style>")
    # JS embutido (as fotos citadas no config.js/main.js também passam pelo asset())
    def inline_js(m):
        js = (ROOT / m.group(1)).read_text()
        js = IMG_REF.sub(lambda r: asset(r.group(0)) if (ROOT / r.group(0)).exists() else r.group(0), js)
        return "<script>\n" + js + "\n</script>"
    html = re.sub(r'<script src="(assets/js/[^"]+)"(?: defer)?></script>', inline_js, html)
    # Imagens do HTML (og-image e caminhos dentro do JSON-LD ficam como arquivo)
    html = re.sub(r'(src|href)="(assets/img/[^"]+)"',
                  lambda m: f'{m.group(1)}="{asset(m.group(2))}"' if (ROOT / m.group(2)).exists() else m.group(0), html)
    out.write_text(html)


def main() -> None:
    shutil.rmtree(DIST, ignore_errors=True)
    DIST.mkdir()
    build(DIST / "index.html", INLINE_LIMIT)
    for extra in ["assets/img/favicon.svg", "assets/img/og-image.jpg", "assets/img/loja.webp", "assets/img/logo.svg"]:
        if (ROOT / extra).exists():
            (DIST / extra).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / extra, DIST / extra)

    zip_path = ROOT / "ella-beachwear-site.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(DIST.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(DIST))

    # Prévia: tudo embutido num arquivo só (não copia nada para dist)
    build(ROOT / "preview-ella.html", 10**9)

    kb = lambda p: p.stat().st_size / 1024
    print(f"dist/index.html: {kb(DIST / 'index.html'):.0f} KB · {zip_path.name}: {kb(zip_path):.0f} KB · "
          f"preview-ella.html: {kb(ROOT / 'preview-ella.html'):.0f} KB")


if __name__ == "__main__":
    main()
