#!/usr/bin/env python3
"""Estampille les feuilles de style et les scripts de editeur.html.

Sans cela, un navigateur peut resservir un ancien assets/js/contact.js après
une mise en ligne : la page est à jour, son code ne l'est pas, et le défaut
corrigé réapparaît sans que rien ne le signale. Chaque fichier reçoit donc en
suffixe les huit premiers caractères de l'empreinte de son contenu, qui change
dès que le fichier change.

    python3 outils/empreinte.py
"""
import hashlib
import pathlib
import re

RACINE = pathlib.Path(__file__).resolve().parent.parent
PAGE = RACINE / "editeur.html"

texte = PAGE.read_text(encoding="utf-8")
motif = re.compile(r'(?P<attr>(?:src|href)=")(?P<chemin>assets/[^"?]+)(?:\?v=[^"]*)?(?P<fin>")')

vus = []

def estampille(m):
    chemin = m.group("chemin")
    fichier = RACINE / chemin
    if not fichier.exists():
        raise SystemExit("fichier absent : " + chemin)
    h = hashlib.sha256(fichier.read_bytes()).hexdigest()[:8]
    vus.append((chemin, h))
    return m.group("attr") + chemin + "?v=" + h + m.group("fin")

neuf = motif.sub(estampille, texte)
if neuf != texte:
    PAGE.write_text(neuf, encoding="utf-8")

for chemin, h in vus:
    print("  %-34s %s" % (chemin, h))
print("%d fichiers estampillés%s" % (len(vus), "" if neuf != texte else " (inchangé)"))
