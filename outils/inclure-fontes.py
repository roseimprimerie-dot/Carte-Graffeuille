#!/usr/bin/env python3
"""Regénère assets/js/fontes.js : les fontes de la carte en base64.

Le SVG exporté doit rester lisible là où il est ouvert, sur un poste qui n'a
ni Author ni Montserrat installées. On y incorpore donc les fichiers de fonte
eux-mêmes. Les lire au vol depuis le disque est impossible quand l'éditeur est
ouvert par double-clic : le navigateur refuse fetch() sur file://. D'où ce
fichier, écrit une fois pour toutes.

    python3 outils/inclure-fontes.py
"""
import base64
import pathlib
import textwrap

RACINE = pathlib.Path(__file__).resolve().parent.parent

# Uniquement les faces que card.js emploie : Author 400/500/600/700, plus le
# 500 italique de la fonction au verso. Inter, fonte de l'interface, n'y est pas.
FACES = [
    ("Author", "normal", 400, "fonts/author/Author-Regular.woff2"),
    ("Author", "normal", 500, "fonts/author/Author-Medium.woff2"),
    ("Author", "italic", 500, "fonts/author/Author-MediumItalic.woff2"),
    ("Author", "normal", 600, "fonts/author/Author-Semibold.woff2"),
    ("Author", "normal", 700, "fonts/author/Author-Bold.woff2"),
]

blocs, total = [], 0
for famille, style, graisse, chemin in FACES:
    brut = (RACINE / "assets" / chemin).read_bytes()
    total += len(brut)
    b64 = base64.b64encode(brut).decode("ascii")
    blocs.append(
        "@font-face{font-family:'%s';font-style:%s;font-weight:%d;"
        "src:url(data:font/woff2;base64,%s) format('woff2');}" % (famille, style, graisse, b64)
    )

css = "".join(blocs)
entete = textwrap.dedent('''\
    /*!
     * fontes.js — fontes de la carte, incorporées pour l'export SVG.
     *
     * FICHIER GÉNÉRÉ. Ne pas modifier à la main :
     *     python3 outils/inclure-fontes.py
     *
     * %d faces, %.0f Ko de woff2, sous ITF Free Font License.
     */
    window.CARD_FONTS_CSS = ''' % (len(FACES), total / 1024))

sortie = RACINE / "assets" / "js" / "fontes.js"
sortie.write_text(entete + repr(css).replace("'", "'", 1) + ";\n", encoding="utf-8")
print("%s — %d faces, %.0f Ko de woff2, %.0f Ko de fichier"
      % (sortie.relative_to(RACINE), len(FACES), total / 1024,
         sortie.stat().st_size / 1024))
