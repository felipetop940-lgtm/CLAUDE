#!/usr/bin/env python3
"""Cria um link de pagamento do Mercado Pago (Checkout Pro) para cada presente da lista.

Lê a lista direto do index.html (GIFTS), cria uma "preferência" por presente na conta da
Stefanny e salva:
  assets/mp-links.json        → usado pelo build.py para ligar o botão "Pagar com cartão"
  links-mercadopago.csv       → planilha com nome, valor e link de cada presente

Os links não expiram. Cartão em até 12x; juros do parcelamento por conta do convidado
(padrão do Mercado Pago). Boleto e Pix do Mercado Pago ficam de fora: o Pix do site vai
direto para a chave da noiva, sem taxa.

Uso:
  python3 gerar-links-mercadopago.py --listar          # só confere a lista, sem token
  MP_ACCESS_TOKEN=APP_USR-... python3 gerar-links-mercadopago.py
  SITE_URL=https://...  (opcional) volta para o site depois do pagamento
  --refazer             cria de novo os que já têm link
"""
import csv
import json
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent
LINKS = ROOT / "assets/mp-links.json"
CSV = ROOT / "links-mercadopago.csv"
API = "https://api.mercadopago.com/checkout/preferences"
GIFT = re.compile(r'\{ cat:"(\w+)", nome:"((?:[^"\\]|\\.)*)"(?:, desc:"((?:[^"\\]|\\.)*)")?, preco:([\d.]+)')


def key(nome: str, desc: str) -> str:
    """Mesma chave do giftKey() do site."""
    s = unicodedata.normalize("NFD", f"{nome} {desc}")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def presentes():
    html = (ROOT / "index.html").read_text()
    bloco = html[html.index("const GIFTS = ["):html.index("const CATS = [")]
    out = []
    for cat, nome, desc, preco in GIFT.findall(bloco):
        out.append({"cat": cat, "nome": nome, "desc": desc or "", "preco": float(preco), "key": key(nome, desc or "")})
    return out


def criar(token: str, g: dict, site: str) -> str:
    titulo = ("Presente de casamento: " + g["nome"])[:250]
    corpo = {
        "items": [{"id": g["key"][:250], "title": titulo, "description": g["desc"][:250] or titulo,
                   "quantity": 1, "currency_id": "BRL", "unit_price": round(g["preco"], 2)}],
        "payment_methods": {"installments": 12,
                            "excluded_payment_types": [{"id": "ticket"}, {"id": "bank_transfer"}, {"id": "atm"}]},
        "statement_descriptor": "CASAMENTO S E L",
        "external_reference": g["key"][:250],
    }
    if site:
        corpo["back_urls"] = {"success": site, "pending": site, "failure": site}
        corpo["auto_return"] = "approved"
    req = urllib.request.Request(API, data=json.dumps(corpo).encode(), method="POST", headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["init_point"]


def main():
    lista = presentes()
    chaves = [g["key"] for g in lista]
    assert len(chaves) == len(set(chaves)), "dois presentes com a mesma chave"
    if "--listar" in sys.argv:
        for g in lista:
            print(f'{g["preco"]:>10.2f}  {g["key"]}')
        print(f"{len(lista)} presentes")
        return
    token = os.environ.get("MP_ACCESS_TOKEN", "").strip()
    if not token:
        sys.exit("Falta o MP_ACCESS_TOKEN (Access Token de produção do Mercado Pago).")
    site = os.environ.get("SITE_URL", "").strip()
    links = json.loads(LINKS.read_text()) if LINKS.exists() else {}
    refazer = "--refazer" in sys.argv
    erros = 0
    for g in lista:
        if g["key"] in links and not refazer:
            continue
        try:
            links[g["key"]] = criar(token, g, site)
            print("ok   ", g["nome"])
        except urllib.error.HTTPError as e:
            erros += 1
            print("ERRO ", g["nome"], e.code, e.read().decode()[:200])
    links = {k: v for k, v in links.items() if k in chaves}  # tira presentes que saíram da lista
    LINKS.write_text(json.dumps(links, ensure_ascii=False, indent=1))
    with CSV.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["presente", "detalhe", "valor", "link"])
        for g in lista:
            w.writerow([g["nome"], g["desc"], f'{g["preco"]:.2f}'.replace(".", ","), links.get(g["key"], "")])
    print(f"{len(links)}/{len(lista)} presentes com link · {erros} erro(s) · rode python3 build.py")


if __name__ == "__main__":
    main()
