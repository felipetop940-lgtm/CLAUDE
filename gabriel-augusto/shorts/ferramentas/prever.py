#!/usr/bin/env python3
"""Prévia rápida (sem voz e sem vídeo): renderiza alguns quadros do roteiro pra conferir o visual.

Uso: python3 prever.py ../roteiros/v04.json [n_quadros_por_cena=2]
Saída: /tmp/previa_<roteiro>.jpg (folha com os quadros) — os tempos são estimados pelo nº de palavras.
"""
import json, os, subprocess, sys, tempfile
from pathlib import Path
from gerar import HERE, RESPIRO, tempos_palavras

src = Path(sys.argv[1]).resolve(); n = int(sys.argv[2]) if len(sys.argv) > 2 else 2
rot = json.loads(src.read_text()); cenas = rot["cenas"]; t = .5
for i, c in enumerate(cenas):
    d = .36 * len(c["fala"].split()) + .3
    c["t0"] = round(t - (.35 if i else .5), 3); c["fala_t0"] = t
    c["palavras"] = [p for p in tempos_palavras(c["fala"], t, d) if p["w"]]
    t += d + RESPIRO + c.get("fim", 0)
for a, b in zip(cenas, cenas[1:]): a["dur"] = round(b["t0"] - a["t0"], 3)
rot["total"] = round(t, 2); cenas[-1]["dur"] = round(t - cenas[-1]["t0"], 3)
tempos = [round(c["t0"] + c["dur"] * (k + 1) / (n + 1), 2) for c in cenas for k in range(n)]
tmp = Path(tempfile.mkdtemp(prefix="previa_")); html = HERE / f"_previa_{src.stem}.html"
html.write_text((HERE / "motor.html").read_text().replace("__ROTEIRO__", json.dumps(rot, ensure_ascii=False)))
js = tmp / "p.js"
js.write_text(f"""const {{ chromium }} = require(process.env.PWPATH);
(async () => {{ const b = await chromium.launch(); const p = await b.newPage({{ viewport: {{ width: 1080, height: 1920 }} }});
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://{html}'); await p.evaluate(() => document.fonts.ready);
  for (const [i, t] of {json.dumps(tempos)}.entries()) {{ await p.evaluate(t => render(t), t);
    await p.screenshot({{ path: '{tmp}/q' + String(i).padStart(3, '0') + '.jpg', type: 'jpeg', quality: 85 }}); }}
  if (errs.length) {{ console.error(errs.join('\\n')); process.exit(1); }} await b.close(); }})();""")
root = subprocess.check_output(["npm", "root", "-g"], text=True).strip()
try:
    subprocess.run(["node", str(js)], env={**os.environ, "PWPATH": root + "/playwright"}, check=True)
finally:
    html.unlink(missing_ok=True)
out = Path(f"/tmp/previa_{src.stem}.jpg"); cols = min(6, len(tempos))
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{tmp}/q%03d.jpg", "-vf", f"scale=270:-1,tile={cols}x{-(-len(tempos) // cols)}", "-frames:v", "1", str(out)], check=True)
print(out)
