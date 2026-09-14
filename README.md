# Cartes de visite GRAFFEUILLE
# Cartes de visite GRAFFEUILLE - éditeur en ligne

Deux pages, un seul dépôt :

| Page | À qui elle s'adresse |
| --- | --- |
| `index.html` | **La carte en ligne.** C'est elle qui s'ouvre quand on scanne le QR code au dos de la carte imprimée. Elle ne montre que les coordonnées, sur une page pensée pour un téléphone. |
| `editeur.html` | **L'atelier.** On y saisit les coordonnées, on voit la carte se composer, on exporte le fichier d'impression. Aucune page publique n'y renvoie. |

Tout tourne dans le navigateur : pas de serveur, pas de compte, pas de
dépendance externe. Le dossier se dépose tel quel sur GitHub Pages.

## Ce que voit la personne qui scanne

Le QR code ne contient plus la fiche elle-même mais **l'adresse de la page en
ligne**. La différence compte : corriger un numéro sur le site met à jour
toutes les cartes déjà distribuées, alors qu'un QR contenant une vCard fige les
coordonnées à l'encre.

La page affiche le logo, le nom, la fonction, puis quatre lignes que l'on
touche du pouce : appeler, écrire, ouvrir le site, ouvrir l'itinéraire. Le
bouton « Ajouter à mes contacts » télécharge la fiche `.vcf`. Rien d'autre —
aucun lien vers l'éditeur.

### Deux façons de désigner une personne

Le fragment de l'URL porte l'information :

- `…/#jerome-goumard` — **identifiant court.** La page lit
  `cartes/jerome-goumard.json`. L'URL fait 70 caractères, le QR tombe en
  version 5 : ses modules mesurent **0,54 mm** une fois imprimés, donc il se
  scanne sans effort. C'est la voie à privilégier ; elle demande de déposer la
  fiche dans `cartes/` (bouton « Fiche pour le site » de l'éditeur).
- `…/#c=<données>` — **coordonnées portées par l'URL.** Rien à déposer, mais
  l'adresse atteint ~380 caractères et le QR descend à ~0,26 mm par module,
  ce qui devient juste pour un tirage à 24 mm.

L'éditeur affiche en continu l'URL visée, la version du QR et la taille de
module obtenue, avec un verdict explicite : on voit tout de suite si le code
sera confortable à scanner ou trop dense.

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
**Inter**, un grotesque libre de métriques voisines, et **Archivo** pour les
titres de la page publique. Pour un tirage professionnel, l'imprimeur peut
substituer la fonte de marque dans le SVG exporté.

## L'éditeur

- **Édition en direct** — identité, fonction, coordonnées, établissement,
  accroche du recto, couleur d'accent, filigrane.
- **Annuaire local** — plusieurs cartes gardées dans le navigateur,
  exportables et réimportables en JSON.
- **Lien de partage** — l'état complet de l'éditeur tient dans le fragment
  d'URL, pour reprendre une carte sur un autre poste.
- **Exports** : impression PDF (deux pages vectorielles au format exact),
  SVG recto et verso, PNG 600 dpi, fiche `.vcf`, et la fiche `.json` à déposer
  dans `cartes/`.

### Avant d'imprimer

1. Renseigner **« Adresse du site publié »** avec le domaine réel. Sur GitHub
   Pages ce champ peut rester vide : l'éditeur déduit l'adresse de l'endroit
   d'où il est servi.
2. Donner un **identifiant court**, puis déposer la fiche `.json` produite dans
   `cartes/`.
3. Vérifier le verdict affiché sous l'URL (taille de module).
4. Cocher **« Fond perdu de 5 mm et traits de coupe »**, puis imprimer avec des
   marges nulles et sans « ajuster à la page » — le format est déjà imposé par
   la feuille de style.

### L'éditeur n'est pas protégé

`editeur.html` est simplement absent de la navigation : aucun lien public n'y
mène et il porte un `noindex`. Sur un hébergement statique il n'y a pas
d'authentification possible, donc **quiconque connaît l'adresse peut l'ouvrir**.
Il ne peut rien casser (il ne fait qu'écrire dans le navigateur de la personne),
mais si cela pose problème, il faut le servir depuis un dépôt privé ou un
hébergement qui sait demander un mot de passe.

## Organisation du code

```
index.html              carte publique (mobile)
editeur.html            atelier de composition
cartes/*.json           une fiche par personne, servie par l'identifiant court

assets/js/contact.js    modèle partagé : valeurs, vCard, encodage de l'URL
assets/js/icons.js      pictogrammes communs aux deux pages
assets/js/logo.js       tracés du logo, en millimètres dans le repère de la carte
assets/js/carte.js      page publique
assets/js/card.js       rendu SVG du recto et du verso
assets/js/qrcode.js     encodeur QR autonome (ISO/IEC 18004, mode octet)
assets/js/app.js        éditeur : formulaire, annuaire, exports
assets/css/carte.css    page publique (thèmes clair et sombre)
assets/css/app.css      éditeur et règles d'impression
assets/img/             logo et symbole en SVG, réutilisables hors de la carte
```

`card.js` est le seul endroit qui décrit la mise en page imprimée : l'aperçu,
le PDF, le SVG et le PNG sortent tous du même rendu. `contact.js` est le seul
endroit qui décrit les données, partagé par les deux pages.

L'encodeur QR est écrit à la main plutôt qu'importé d'un CDN, pour que les
pages restent utilisables hors ligne et sans dépendance à surveiller. Il a été
vérifié par relecture des codes produits (29 combinaisons de niveaux L/M/Q/H et
de versions 1 à 39, toutes relues correctement), puis sur des captures du rendu
réel de la carte, avec identifiant court et avec coordonnées en URL.

## Mise en ligne

Aucune compilation : `Settings → Pages → Deploy from a branch`, en pointant sur
la racine du dépôt. En local :

```sh
python3 -m http.server 8000
```

`http://localhost:8000/` ouvre la carte, `http://localhost:8000/editeur.html`
l'atelier.
