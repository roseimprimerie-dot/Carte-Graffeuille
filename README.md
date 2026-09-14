# Cartes de visite GRAFFEUILLE — éditeur en ligne

Application web qui reproduit à l'identique la carte de visite **GRAFFEUILLE /
Turgis Gaillard** et permet de la modifier pour n'importe quel collaborateur :
on saisit les coordonnées dans un formulaire, l'aperçu recto/verso se met à jour
en direct, le QR code est régénéré, puis on exporte un fichier prêt pour
l'imprimeur.

Tout tourne dans le navigateur : pas de serveur, pas de compte, pas de
dépendance externe. Le dossier peut être déposé tel quel sur GitHub Pages ou
ouvert directement depuis le disque.

## Fidélité au modèle d'origine

La géométrie et les tracés proviennent du fichier d'impression fourni
(`CDV-Graffeuille-JeromeGOUMARD.pdf`), décompilé puis converti en millimètres :

| Élément | Origine |
| --- | --- |
| Format coupé | 54 × 85 mm (portrait) |
| Fond perdu | 5 mm, traits de coupe aux quatre angles |
| Symbole, logotype, signature « Turgis Gaillard » | tracés vectoriels extraits du PDF, non redessinés |
| Filigrane du verso | le symbole agrandi et détouré, rogné au format |
| Position du bandeau, du QR, des lignes de contact | relevée au millimètre sur le fichier source |
| Rouge de marque | CMJN 0 / 95 / 95 / 0, soit `#E63329` à l'écran |

Les deux fontes du fichier d'origine (Author et Roobert) sont sous licence
commerciale et ne sont donc pas redistribuées ici : la mise en page utilise
**Inter**, un grotesque libre de métriques voisines. Pour un tirage
professionnel, l'imprimeur peut substituer la fonte de marque dans le SVG
exporté.

## Fonctionnalités

- **Édition en direct** — identité, fonction, coordonnées, établissement,
  accroche du recto, couleur d'accent, filigrane.
- **QR code vCard régénéré à chaque frappe** — il porte toujours les
  coordonnées réellement affichées, jamais une version périmée.
- **Annuaire local** — plusieurs cartes enregistrées dans le navigateur,
  exportables et réimportables en JSON pour être partagées avec un collègue.
- **Lien de partage** — l'intégralité de la carte est encodée dans le fragment
  de l'URL ; le lien s'ouvre déjà rempli, sans rien stocker côté serveur.
- **Exports** :
  - `Imprimer / PDF` — deux pages vectorielles au format exact, avec ou sans
    fond perdu selon l'option cochée ;
  - `SVG` — recto et verso séparés, vectoriels, ouvrables dans Illustrator ou
    Inkscape ;
  - `PNG 600 dpi` — 1276 × 2008 px, pour le web et les signatures de courriel ;
  - `.vcf` — la fiche contact seule.

### Imprimer au bon format

Cocher **« Fond perdu de 5 mm et traits de coupe »** avant d'exporter le
fichier destiné à l'imprimeur. Dans la boîte de dialogue d'impression, choisir
« Enregistrer au format PDF », des marges **nulles** et désactiver
« Ajuster à la page » : le format de page est déjà imposé par la feuille de
style (`54 × 85 mm`, ou `64 × 95 mm` avec le fond perdu).

## Organisation du code

```
index.html              formulaire et aperçu
assets/css/app.css      interface (thème clair et sombre) et règles d'impression
assets/js/qrcode.js     encodeur QR autonome (ISO/IEC 18004, mode octet)
assets/js/logo.js       tracés du logo, en millimètres dans le repère de la carte
assets/js/card.js       rendu SVG du recto et du verso, génération de la vCard
assets/js/app.js        formulaire, annuaire, partage, exports
assets/img/             logo et symbole en SVG, réutilisables hors de la carte
```

`card.js` est le seul endroit qui décrit la mise en page : l'aperçu, le PDF, le
SVG et le PNG sortent tous du même rendu, il n'y a donc pas de risque de
divergence entre l'écran et l'impression.

L'encodeur QR est écrit à la main plutôt qu'importé d'un CDN, pour que la carte
reste utilisable hors ligne et sans dépendance à surveiller. Il a été vérifié
par relecture des codes produits (29 combinaisons de niveaux L/M/Q/H et de
versions 1 à 39, toutes relues correctement), y compris sur une capture du
rendu réel de la carte.

## Mise en ligne

Aucune compilation : `Settings → Pages → Deploy from a branch`, en pointant sur
la racine du dépôt. En local, n'importe quel serveur statique suffit :

```sh
python3 -m http.server 8000
```

## Compatibilité

Navigateurs de bureau et mobiles récents. L'annuaire s'appuie sur le stockage
local du navigateur : il reste sur le poste, et l'export JSON sert à le
transmettre. Si le stockage est indisponible (navigation privée), l'éditeur et
les exports continuent de fonctionner, seule la sauvegarde est désactivée.
