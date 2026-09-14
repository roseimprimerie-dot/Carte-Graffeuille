# Cartes de visite GRAFFEUILLE

Deux pages, un seul dépôt :

| Page | À qui elle s'adresse |
| --- | --- |
| `equipe/<personne>/` | **La carte en ligne**, une adresse par employé. C'est elle qui s'ouvre quand on scanne le QR code au dos de la carte imprimée. Elle ne montre que les coordonnées, sur une page pensée pour un téléphone. |
| `index.html` | Point d'entrée de secours : affiche la personne désignée par le fragment d'URL. |
| `editeur.html` | **L'atelier.** On y saisit les coordonnées, on voit la carte se composer, on exporte le fichier d'impression. Aucune page publique n'y renvoie. |

Tout tourne dans le navigateur : pas de serveur, pas de compte, pas de
dépendance externe. Le dossier se dépose tel quel sur GitHub Pages.

## Un dossier par personne

Chaque employé a son propre dossier, sa propre adresse et ses propres fichiers :

```
equipe/
  _modele/                 ← à dupliquer pour ajouter quelqu'un
    index.html             ← identique partout, jamais à modifier
    carte.json             ← les coordonnées
    portrait.svg           ← les fichiers propres à la personne
  jerome-goumard/
    index.html
    carte.json
```

`https://votre-site/equipe/jerome-goumard/` ouvre sa carte. Rien d'autre à
déclarer : il n'y a pas de liste centrale à tenir à jour, le dossier *est* la
déclaration.

### Ajouter un employé

1. Dupliquer `equipe/_modele/`, le renommer `prenom-nom`.
2. Dans l'éditeur, remplir le formulaire, mettre `prenom-nom` dans
   « Identifiant de la personne », puis **Fiche pour le site** : le fichier
   `carte.json` téléchargé remplace celui du dossier.
3. Déposer éventuellement une photo dans le dossier et écrire son nom de
   fichier dans le champ « Photo du dossier ».
4. Imprimer la carte : son QR pointe déjà vers la nouvelle adresse.

`index.html` ne contient que trois lignes utiles — il désigne `carte.json` et
charge le code commun. Il est donc identique dans tous les dossiers, et une
refonte de la mise en page n'oblige jamais à repasser dessus.

## Ce que voit la personne qui scanne

Le QR code ne contient pas la fiche mais **l'adresse de la page en ligne**. La
différence compte : corriger un numéro sur le site met à jour toutes les cartes
déjà distribuées, alors qu'un QR contenant une vCard fige les coordonnées à
l'encre.

La page affiche le logo, le portrait s'il y en a un, le nom dans le bandeau
rouge repris du verso imprimé, puis quatre lignes que l'on touche du pouce :
appeler, écrire, ouvrir le site, ouvrir l'itinéraire. Le bouton « Ajouter à mes
contacts » télécharge la fiche `.vcf`. Rien d'autre — aucun lien vers
l'éditeur.

### Trois formes d'adresse

| Adresse | Usage |
| --- | --- |
| `…/equipe/prenom-nom/` | **La bonne.** 77 caractères : le QR tombe en version 5, ses modules mesurent **0,54 mm** imprimés, il se scanne sans effort. |
| `…/#prenom-nom` | Ancienne forme, toujours acceptée pour ne pas invalider un QR déjà imprimé. |
| `…/#c=<données>` | Les coordonnées voyagent dans l'URL : rien à déposer sur le site, mais l'adresse atteint ~380 caractères et le QR descend à ~0,26 mm par module, ce qui devient juste pour un tirage à 24 mm. |

L'éditeur affiche en continu l'URL visée, la version du QR et la taille de
module obtenue, avec un verdict explicite : on voit tout de suite si le code
sera confortable à scanner.

### Après une modification de `carte.json`

La page relit le fichier à chaque ouverture (`cache: no-cache`), donc en local
un simple rafraîchissement suffit. Sur GitHub Pages, le réseau de diffusion
peut servir l'ancienne version quelques minutes après le `git push` — c'est le
délai de publication, pas un cache du navigateur.

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
2. Donner un **identifiant**, dupliquer `equipe/_modele/` sous ce nom, et y
   déposer la fiche `carte.json` produite.
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
equipe/<personne>/      un dossier par employé : carte.json, photo, index.html
equipe/_modele/         gabarit à dupliquer
index.html              entrée de secours, pilotée par le fragment d'URL
editeur.html            atelier de composition

assets/js/contact.js    modèle partagé : valeurs, vCard, encodage de l'URL
assets/js/icons.js      pictogrammes communs aux deux pages
assets/js/logo.js       tracés du logo, en millimètres dans le repère de la carte
assets/js/carte.js      page publique (elle construit tout le gabarit)
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

`http://localhost:8000/equipe/jerome-goumard/` ouvre sa carte,
`http://localhost:8000/editeur.html` l'atelier.
