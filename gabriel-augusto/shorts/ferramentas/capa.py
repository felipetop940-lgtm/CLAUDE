#!/usr/bin/env python3
"""Gera a capa (1080x1920 JPG) de um short a partir da 1ª cena do roteiro, no mesmo estilo do vídeo.

Uso: python3 capa.py ../roteiros/v02-instagram.json [t=2.4]
Saída: ../saida/<roteiro>-capa.jpg
O título fica dentro da área central 3:4 (o que aparece na grade do perfil).
"""
import json, os, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent


def main():
    src = Path(sys.argv[1]).resolve(); t = float(sys.argv[2]) if len(sys.argv) > 2 else 2.4
    rot = json.loads(src.read_text()); c = dict(rot["cenas"][0])
    capa = rot.get("capa", {})
    c.update({"t0": 0, "dur": 99, "palavras": [], "texto": capa.get("texto", c["texto"]), "tamanho": capa.get("tamanho", 150)})
    rot.update({"cenas": [c], "total": 99})
    extra = f"""<style>#subs,.progress{{display:none!important}} #trans{{opacity:0!important}}
    .kick{{position:absolute;left:0;right:0;text-align:center;font-family:Anton;text-transform:uppercase;letter-spacing:.06em}}</style>
    <div class="kick" style="top:{capa.get('selo_y', 1560)}px;z-index:50"><span style="display:inline-block;padding:18px 44px;border-radius:60px;
      background:linear-gradient(135deg,#E8CC8E,#D6B36C 45%,#B8924A);color:#07080A;font-size:50px;box-shadow:0 0 80px rgba(214,179,108,.5)">{capa.get('selo', 'Assista até o final')}</span></div>"""
    html = HERE / f"_render_{src.stem}_capa.html"
    html.write_text((HERE / "motor.html").read_text().replace("__ROTEIRO__", json.dumps(rot, ensure_ascii=False)).replace("</body>", extra + "</body>"))
    out = HERE.parent / "saida" / f"{src.stem}-capa.jpg"
    js = html.with_suffix(".js")
    js.write_text(f"""const {{ chromium }} = require(process.env.PWPATH);
(async () => {{ const b = await chromium.launch(); const p = await b.newPage({{ viewport: {{ width: 1080, height: 1920 }} }});
  await p.goto('file://{html}'); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(t => render(t), {t}); await p.screenshot({{ path: '{out}', type: 'jpeg', quality: 92 }}); await b.close(); }})();""")
    root = subprocess.check_output(["npm", "root", "-g"], text=True).strip()
    try: subprocess.run(["node", str(js)], env={**os.environ, "PWPATH": root + "/playwright"}, check=True)
    finally:
        for f in HERE.glob(f"_render_{src.stem}_capa.*"): f.unlink()
    print("ok:", out)


if __name__ == "__main__":
    main()
