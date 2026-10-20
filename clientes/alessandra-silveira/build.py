#!/usr/bin/env python3
"""Gera os três sites da Alessandra a partir da mesma base (index.html + assets/).

- goiania  → Clínica NeuroVitta (Goiânia)
- trindade → Florah Saúde Mental (Trindade)
- ipasgo   → foco no convênio IPASGO, com as duas unidades

Para cada site:
- dist/<site>/index.html  → arquivo único: CSS, JS, fontes e imagens pequenas embutidos
- dist/<site>/assets/img  → fotos (não embutidas) e imagem de compartilhamento
- alessandra-silveira-<site>.zip → pacote pronto para subir na hospedagem
- preview-<site>.html → prévia com tudo embutido (abre sozinha, sem a pasta assets)

Uso: python3 build.py            (os três)
     python3 build.py goiania    (só um)
"""
import base64
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).parent
MIME = {".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}
INLINE_LIMIT = 60_000  # bytes: arquivos maiores ficam como arquivo externo

# ---------------------------------------------------------------- unidades
LOCAIS = {
    "neurovitta": {
        "nome": "Clínica NeuroVitta", "cidade": "Goiânia",
        "rua": "R. C-185, nº 125 · Nova Suíça", "linha2": "Goiânia · GO · 74275-060",
        "schema": {"streetAddress": "R. C-185, nº 125, Nova Suíça", "addressLocality": "Goiânia", "postalCode": "74275-060"},
        "busca": "Clínica NeuroVitta, R. C-185, 125 - Nova Suíça, Goiânia - GO, 74275-060",
    },
    "florah": {
        "nome": "Florah Saúde Mental", "cidade": "Trindade",
        "rua": "Av. Trindade, nº 530 · Ana Rosa", "linha2": "Trindade · GO · 75389-048",
        "schema": {"streetAddress": "Av. Trindade, nº 530, Ana Rosa", "addressLocality": "Trindade", "postalCode": "75389-048"},
        "busca": "Florah Saúde Mental, Av. Trindade, 530 - Ana Rosa, Trindade - GO, 75389-048",
    },
}

# ---------------------------------------------------------------- sites
SITES = {
    "goiania": {
        "locais": ["neurovitta"],
        "TITLE": "Neuropsicóloga em Goiânia · Alessandra Silveira",
        "DESC": "Avaliação neuropsicológica em Goiânia com Alessandra Silveira: TDAH, Autismo (TEA), ansiedade e dificuldades de aprendizagem, com laudo claro e orientação para pais e escola. Clínica NeuroVitta, Nova Suíça.",
        "OG_DESC": "Especialista em Avaliação Neuropsicológica em Goiânia. TDAH · Autismo · Ansiedade.",
        "HERO_EM": "em Goiânia", "HERO_CLASS": "",
        "HERO_NOTE": "Clínica NeuroVitta · Nova Suíça, Goiânia",
        "SOBRE_LOCAL": "na Clínica NeuroVitta, em Goiânia",
        "SOBRE_LEGENDA": "Clínica NeuroVitta · Goiânia",
        "FAQ_ONDE": "Na Clínica NeuroVitta, R. C-185, nº 125, Nova Suíça, Goiânia (GO).",
        "NAV_LOCAL": "Localização",
        "mensagens": {},
        "ipasgo": False,
    },
    "trindade": {
        "locais": ["florah"],
        "TITLE": "Neuropsicóloga em Trindade · Alessandra Silveira",
        "DESC": "Avaliação neuropsicológica em Trindade (GO) com Alessandra Silveira: TDAH, Autismo (TEA), ansiedade e dificuldades de aprendizagem, com laudo claro e orientação para pais e escola. Florah Saúde Mental, Ana Rosa.",
        "OG_DESC": "Especialista em Avaliação Neuropsicológica em Trindade. TDAH · Autismo · Ansiedade.",
        "HERO_EM": "em Trindade", "HERO_CLASS": "",
        "HERO_NOTE": "Florah Saúde Mental · Ana Rosa, Trindade",
        "SOBRE_LOCAL": "na Florah Saúde Mental, em Trindade (GO)",
        "SOBRE_LEGENDA": "Florah Saúde Mental · Trindade",
        "FAQ_ONDE": "Na Florah Saúde Mental, Av. Trindade, nº 530, Ana Rosa, Trindade (GO).",
        "NAV_LOCAL": "Localização",
        "mensagens": {},
        "ipasgo": False,
    },
    "ipasgo": {
        "locais": ["neurovitta", "florah"],
        "TITLE": "Neuropsicóloga pelo IPASGO em Goiânia e Trindade · Alessandra Silveira",
        "DESC": "Avaliação neuropsicológica pelo IPASGO em Goiânia e Trindade com Alessandra Silveira: TDAH, Autismo (TEA), ansiedade e dificuldades de aprendizagem. Clínica NeuroVitta (Goiânia) e Florah Saúde Mental (Trindade).",
        "OG_DESC": "Avaliação Neuropsicológica pelo IPASGO em Goiânia e Trindade. TDAH · Autismo · Ansiedade.",
        "HERO_EM": "em Goiânia <br class=\"br-d\">e Trindade", "HERO_CLASS": " hero__title--long",
        "HERO_NOTE": "Aceitamos convênio <strong>IPASGO</strong>",
        "SOBRE_LOCAL": "na Clínica NeuroVitta, em Goiânia, e na Florah Saúde Mental, em Trindade",
        "SOBRE_LEGENDA": "Goiânia e Trindade",
        "FAQ_ONDE": "Em Goiânia, na Clínica NeuroVitta (R. C-185, nº 125, Nova Suíça). Em Trindade, na Florah Saúde Mental (Av. Trindade, nº 530, Ana Rosa).",
        "NAV_LOCAL": "Unidades",
        "mensagens": {
            "padrao": "Olá, Alessandra! Vim pelo site e gostaria de agendar uma avaliação neuropsicológica pelo IPASGO.",
            "duvida": "Olá, Alessandra! Vim pelo site e queria entender como funciona a avaliação neuropsicológica pelo IPASGO.",
            "avaliacoes": "Olá, Alessandra! Vim pelo site e gostaria de informações sobre as avaliações pelo IPASGO.",
            "diagnostico": "Olá, Alessandra! Vim pelo site e gostaria de informações sobre diagnóstico neuropsicológico pelo IPASGO.",
            "acompanhamento": "Olá, Alessandra! Vim pelo site e gostaria de informações sobre acompanhamento psicológico pelo IPASGO.",
        },
        "ipasgo": True,
    },
}


def maps_links(loc):
    q = quote(loc["busca"])
    return (f"https://www.google.com/maps/search/?api=1&query={q}",
            f"https://maps.google.com/maps?q={q}&z=15&output=embed")


def locais_html(keys, ipasgo):
    cards = []
    for k in keys:
        loc = LOCAIS[k]
        link, embed = maps_links(loc)
        wa = f"unidade_{k}" if len(keys) > 1 else "padrao"
        cta = "Agendar nesta unidade" if len(keys) > 1 else "Agendar pelo WhatsApp"
        cards.append(f'''      <article class="loc reveal">
        <div class="loc__map"><iframe src="{embed}" title="Mapa: {loc['nome']}, {loc['cidade']}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
        <div class="loc__body">
          <span class="loc__city">{loc['cidade']}{' · IPASGO' if ipasgo else ''}</span>
          <h3>{loc['nome']}</h3>
          <p>{loc['rua']}<br>{loc['linha2']}</p>
          <div class="loc__btns">
            <a class="btn btn--wa" href="#localizacao" data-wa="{wa}"><svg class="i" aria-hidden="true"><use href="#i-wa"/></svg>{cta}</a>
            <a class="contact__link" href="{link}" target="_blank" rel="noopener">Como chegar <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a>
          </div>
        </div>
      </article>''')
    return f'    <div class="locs locs--{len(keys)}">\n' + "\n".join(cards) + "\n    </div>"


def footer_html(keys):
    return "".join(f'<p class="footer__loc"><strong>{LOCAIS[k]["nome"]}</strong>{LOCAIS[k]["rua"]}<br>{LOCAIS[k]["linha2"]}</p>' for k in keys)


def jsonld(site):
    locs = [LOCAIS[k] for k in site["locais"]]
    addr = [dict({"@type": "PostalAddress", "addressRegion": "GO", "addressCountry": "BR"}, **l["schema"]) for l in locs]
    data = {
        "@context": "https://schema.org",
        "@type": "Psychologist",
        "name": "Alessandra Silveira · Neuropsicóloga",
        "description": site["DESC"],
        "image": "assets/img/alessandra-hero.webp",
        "telephone": "+55 62 98137-5302",
        "areaServed": [l["cidade"] for l in locs],
        "address": addr[0] if len(addr) == 1 else addr,
    }
    if site["ipasgo"]:
        data["paymentAccepted"] = "IPASGO"
    return json.dumps(data, ensure_ascii=False, indent=2)


def variante_js(site):
    msgs = dict(site["mensagens"])
    for k in site["locais"]:
        if len(site["locais"]) > 1:
            l = LOCAIS[k]
            extra = " pelo IPASGO" if site["ipasgo"] else ""
            msgs[f"unidade_{k}"] = f"Olá, Alessandra! Vim pelo site e gostaria de agendar uma avaliação neuropsicológica{extra} em {l['cidade']} ({l['nome']})."
    return "Object.assign(window.SITE.mensagens, " + json.dumps(msgs, ensure_ascii=False) + ");"


def render_template(name, site):
    html = (ROOT / "index.html").read_text()
    if site["ipasgo"]:
        html = html.replace("<!--IPASGO-->", "").replace("<!--/IPASGO-->", "")
    else:
        html = re.sub(r"<!--IPASGO-->.*?<!--/IPASGO-->\n?", "", html, flags=re.S)
    values = {k: v for k, v in site.items() if k.isupper()}
    values.update(VARIANTE=name, JSONLD=jsonld(site), LOCAIS=locais_html(site["locais"], site["ipasgo"]),
                  FOOTER_LOCAIS=footer_html(site["locais"]), VARIANTE_JS=variante_js(site))
    html = re.sub(r"\{\{(\w+)\}\}", lambda m: values[m.group(1)], html)
    return html


def data_uri(path: Path) -> str:
    return f"data:{MIME[path.suffix]};base64," + base64.b64encode(path.read_bytes()).decode()


def build(name):
    site = SITES[name]
    dist = ROOT / "dist" / name
    shutil.rmtree(dist, ignore_errors=True)
    dist.mkdir(parents=True)

    def asset(ref: str, base: Path) -> str:
        """Embute o arquivo se for pequeno; senão copia para dist e mantém o caminho."""
        src = (base / ref).resolve()
        if src.stat().st_size <= INLINE_LIMIT:
            return data_uri(src)
        rel = src.relative_to(ROOT)
        (dist / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dist / rel)
        return str(rel)

    css_path = ROOT / "assets/css/styles.css"
    css = re.sub(r'url\("?(\.\./[^")]+)"?\)', lambda m: f'url("{asset(m.group(1), css_path.parent)}")', css_path.read_text())

    html = render_template(name, site)
    html = re.sub(r'\s*<link rel="preload" href="assets/fonts/[^>]+>', "", html)
    html = html.replace('<link rel="stylesheet" href="assets/css/styles.css">', f"<style>\n{css}\n</style>")
    html = re.sub(r'<script src="(assets/js/[^"]+)"(?: defer)?></script>',
                  lambda m: "<script>\n" + (ROOT / m.group(1)).read_text() + "\n</script>", html)
    html = re.sub(r'(src|href)="(assets/img/[^"]+)"',
                  lambda m: f'{m.group(1)}="{asset(m.group(2), ROOT)}"' if (ROOT / m.group(2)).exists() else m.group(0), html)
    (dist / "index.html").write_text(html)
    for extra in ["assets/img/favicon.svg", "assets/img/alessandra-hero.webp"]:
        (dist / extra).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / extra, dist / extra)

    zip_path = ROOT / f"alessandra-silveira-{name}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(dist.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(dist))

    # prévia: tudo embutido, abre sem a pasta assets
    prev = re.sub(r'(src|href|content)="(assets/img/[^"]+)"',
                  lambda m: f'{m.group(1)}="{data_uri(dist / m.group(2))}"' if (dist / m.group(2)).exists() else m.group(0), html)
    (ROOT / f"preview-{name}.html").write_text(prev)
    print(f"{name}: dist/{name}/index.html {(dist / 'index.html').stat().st_size / 1024:.0f} KB · {zip_path.name}")


def main():
    for name in (sys.argv[1:] or SITES):
        build(name)


if __name__ == "__main__":
    main()
