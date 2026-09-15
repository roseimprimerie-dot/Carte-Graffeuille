# Cartes de visite dynamique - GRAFFEUILLE

Toutes les cartes, un seul dépôt :

| Page | À qui elle s'adresse |
| --- | --- |
| `<personne>/` | **La carte en ligne**, une adresse par employé. C'est elle qui s'ouvre quand on scanne le QR code au dos de la carte imprimée. Elle ne montre que les coordonnées, sur une page pensée pour un téléphone. |
| `index.html` | Entrée de secours : affiche la personne désignée par le fragment d'URL. |
| `editeur.html` | **L'éditeur.** On y saisit les coordonnées, on voit la carte se composer, on exporte le fichier d'impression. Aucune page publique n'y renvoie. |

Pourquoi ? : tout tourne dans le navigateur : pas de serveur, pas de compte, pas de
dépendance externe.

## Les adresses en ligne

Le site est publié à la racine du dépôt, depuis la branche `main` :

<https://graffeuille.github.io/CDV/>

### Une adresse par employé

C'est celle-ci que le QR code de sa carte imprimée fait ouvrir.

| Personne | Adresse |
| --- | --- |
| Alain GRAFFEUILLE | <https://graffeuille.github.io/CDV/alain-graffeuille> |
| Jérôme GOUMARD | <https://graffeuille.github.io/CDV/jerome-goumard> |
| Marie-Noëlle GRAFFEUILLE | <https://graffeuille.github.io/CDV/marie-noelle-graffeuille> |
| Sarah FOSSARD | <https://graffeuille.github.io/CDV/sarah-fossard> |
| Michaël MANCIA | <https://graffeuille.github.io/CDV/michael-mancia> |
| Mickaël MOREL | <https://graffeuille.github.io/CDV/mickael-morel> |
| Fabrice PELLIZOTTI | <https://graffeuille.github.io/CDV/fabrice-pellizotti> |
| Jean-Michel GAISNON | <https://graffeuille.github.io/CDV/jean-michel-gaisnon> |
| Loïc BERNARD | <https://graffeuille.github.io/CDV/loic-bernard> |

### Les autres adresses

| Adresse | Ce qu'elle ouvre |
| --- | --- |
| <https://graffeuille.github.io/CDV/editeur.html> | L'éditeur. Aucune page publique n'y renvoie : il n'est ni listé, ni protégé. |
| <https://graffeuille.github.io/CDV/> | Entrée de secours. Sans fragment, elle affiche la carte de Jérôme Goumard. |
| <https://graffeuille.github.io/CDV/#loic-bernard> | Ancienne forme par identifiant, toujours acceptée pour ne pas invalider un QR déjà imprimé. |
| <https://graffeuille.github.io/CDV/sarah-fossard/carte.json> | La fiche brute d'une personne, telle que la page la lit. |

Si vous branchez un jour un vrai domaine sur ce site, seule la racine change :
les chemins restent identiques. Il faudra alors renseigner ce domaine dans le
champ « Adresse du site publié » de l'éditeur **avant** de réimprimer, puisque
c'est lui que le QR encode.

## Un dossier par personne

Chaque employé a son propre dossier, sa propre adresse et ses propres fichiers :

```
_modele/                   ← gabarit, dupliqué par l'éditeur
  index.html               ← identique partout, jamais à modifier
  carte.json               ← les coordonnées
  portrait.svg             ← les fichiers propres à la personne
jerome-goumard/
  index.html
  carte.json
```

L'adresse du dossier ouvre la carte de la personne. Rien d'autre à
déclarer : il n'y a pas de liste centrale à tenir à jour, le dossier *est* la
déclaration.

### L'équipe déjà en place

| Dossier | Personne | Fonction | Service |
| --- | --- | --- | --- |
| `alain-graffeuille` | Alain GRAFFEUILLE | Directeur | |
| `jerome-goumard` | Jérôme GOUMARD | Directeur | |
| `marie-noelle-graffeuille` | Marie-Noëlle GRAFFEUILLE | Chef de projets et développement | |
| `sarah-fossard` | Sarah FOSSARD | Commerciale | Grands Comptes |
| `michael-mancia` | Michaël MANCIA | Responsable commercial | Boîtes de vitesses / Ponts |
| `mickael-morel` | Mickaël MOREL | Responsable commercial | Moteurs |
| `fabrice-pellizotti` | Fabrice PELLIZOTTI | Commercial | Boîtes de vitesses / Ponts |
| `jean-michel-gaisnon` | Jean-Michel GAISNON | Responsable Atelier | Production Moteurs |
| `loic-bernard` | Loïc BERNARD | Responsable Atelier | Production Moteurs |

Toutes les coordonnées sont reprises des fichiers d'impression fournis. Le
site est `www.graffeuille.fr` pour l'ensemble de l'équipe.

### Ajouter un employé

1. Dans l'éditeur, remplir le formulaire et donner un identifiant.
2. **Créer la carte en ligne (.zip)** : l'archive contient déjà
   `prenom-nom/index.html` et `prenom-nom/carte.json`. La décompresser à la
   racine du site suffit.
3. Déposer éventuellement une photo dans le dossier et écrire son nom de
   fichier dans le champ « Photo du dossier ».
4. Imprimer la carte : son QR pointe déjà vers la nouvelle adresse.

Le bouton **Fiche seule (.json)** sert à mettre à jour un dossier existant
sans toucher à son `index.html`.

`index.html` ne contient que trois lignes utiles — il désigne `carte.json` et
charge le code commun. Il est donc identique dans tous les dossiers, et une
refonte de la mise en page n'oblige jamais à repasser dessus.

## Le verso suit une grille

Les neuf fichiers d'impression obéissent au même gabarit, relevé sur leurs
flux de contenu :

- **3,88 mm (11 pt) entre deux lignes** du bloc identité, quel que soit leur
  rôle ; **5,88 mm** entre la dernière ligne du nom et la fonction.
- **Un bandeau rouge par ligne de nom**, ajusté à la largeur de cette ligne.
  Un nom trop long pour le format se coupe et prend un second bandeau.
- **La fonction est en italique 10 pt** ; le service, sous elle, est **droit,
  en 9 pt et d'une graisse plus légère**. Ce sont deux champs distincts dans
  l'éditeur, pas deux lignes d'un même texte.
- **Le bloc de contact ne descend que s'il le faut** : il reste à 53,66 mm
  tant que l'identité ne vient pas à sa rencontre. Une adresse trop longue ne
  déborde pas, les trois lignes se resserrent ensemble.

Le code vérifie ces règles sur les neuf cartes : les lignes de base calculées
sont identiques à celles des fichiers d'origine.

## Les fontes et les pictogrammes

**Les pictogrammes sont les contours exacts** de la fonte d'icônes embarquée
dans les fichiers fournis — un téléphone mobile, un avion en papier, une
épingle — extraits et exprimés dans le repère de la fonte, ce qui les pose sur
la ligne de base comme le fait le PDF. Seul le globe, absent des cartes, est
redessiné : il ne sert qu'à la ligne « site internet », facultative.

**Les fontes sont celles de la maquette**, servies par le site :
**Author** au verso, **Montserrat SemiBold** au recto. Author est sous ITF
Free Font License, qui autorise explicitement l'auto-hébergement ; ses
fichiers sont servis tels que livrés, sans sous-ensemble ni conversion, que
la licence interdit.

Avec les vraies Author, les largeurs du verso reproduisent celles du fichier
d'impression à 0,1 % près.

### La licence Author mérite attention

Sa clause 02 interdit de mettre la fonte à disposition de tiers via un site
ou un éditeur de gabarits, et de la distribuer via des serveurs publics. Un
dépôt public où l'on peut télécharger les `.woff2`, et un éditeur ouvert à
tous, s'en approchent. L'usage sur son propre site est en revanche
explicitement permis.

## Ce que voit la personne qui scanne

Le QR code ne contient pas la fiche mais **l'adresse de la page en ligne**. La
différence compte : corriger un numéro sur le site met à jour toutes les cartes
déjà distribuées, alors qu'un QR contenant une vCard fige les coordonnées à
l'encre.

La page affiche le logo, le portrait s'il y en a un, le nom, la fonction, puis
quatre lignes que l'on touche du pouce : appeler, écrire, ouvrir le site,
ouvrir l'itinéraire. Le bouton « Ajouter à mes contacts » télécharge la fiche
`.vcf`.

### Trois formes d'adresse

| Adresse | Usage |
| --- | --- |
| `…/CDV/prenom-nom` | **La bonne.** 77 caractères : le QR tombe en version 5, ses modules mesurent **0,54 mm** imprimés, il se scanne sans effort. |
| `…/#prenom-nom` | Ancienne forme, toujours acceptée pour ne pas invalider un QR déjà imprimé. |
| `…/#c=<données>` | Les coordonnées voyagent dans l'URL : rien à déposer sur le site, mais l'adresse atteint ~380 caractères et le QR descend à ~0,26 mm par module, ce qui devient juste pour un tirage à 24 mm. |

L'éditeur affiche en continu l'URL visée, la version du QR et la taille de
module obtenue, avec un verdict explicite : on voit tout de suite si le code
sera confortable à scanner.

### Après une modification de `carte.json`

La page relit le fichier à chaque ouverture, donc en local un simple
rafraîchissement suffit. Sur GitHub Pages, le réseau de diffusion peut servir
l'ancienne version quelques minutes après le `git push` — c'est le délai de
publication, pas un cache du navigateur.

## L'éditeur

- **Édition en direct** - identité, fonction, coordonnées, établissement, accroche du recto, couleur d'accent, filigrane.
- **Annuaire local** - Les cartes créées sont conservées dans le navigateur. Tu peux fermer l'onglet et revenir plus tard, elles sont toujours là.
Attention : elles sont attachées à ce navigateur et à cet ordinateur.
Vider l'historique, changer de machine ou naviguer en privé donne un
annuaire vide.
- **Exports** : Le bouton d'export télécharge un fichier `.json` contenant tout
l'annuaire. Le bouton d'import le recharge. C'est la sauvegarde du
projet : garde ce fichier quelque part de sûr, et sers-t'en pour
transférer les cartes vers un autre poste ou vers un collègue.
- **Lien de partage** : Ce bouton copie une adresse qui contient l'état complet de l'éditeur :
coordonnées, thème, couleurs, mise en page. Ouvre ce lien sur
n'importe quel autre ordinateur et l'éditeur se rouvre exactement
comme tu l'avais laissé.

 ## Où sont stockées les cartes
 
 Le site n'a ni serveur, ni base de données, ni compte utilisateur.
 Tout vit dans le navigateur de la personne qui utilise l'éditeur.

### Avant d'imprimer

1. Renseigner **« Adresse du site publié »** avec le domaine réel. Sur GitHub
   Pages ce champ peut rester vide : l'éditeur déduit l'adresse de l'endroit
   d'où il est servi.
2. Donner un **identifiant**, dupliquer `_modele/` sous ce nom, et y
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
<personne>/             un dossier par employé : carte.json, photo, index.html
_modele/                gabarit à dupliquer
index.html              entrée de secours, pilotée par le fragment d'URL
editeur.html            éditeur des cartes

assets/js/contact.js    modèle partagé : valeurs, vCard, encodage de l'URL
assets/js/icons.js      pictogrammes, extraits de la fonte d'icônes d'origine
assets/js/logo.js       tracés du logo, en millimètres dans le repère de la carte
assets/js/carte.js      page publique (elle construit tout le gabarit)
assets/js/card.js       rendu SVG du recto et du verso
assets/js/qrcode.js     encodeur QR autonome (ISO/IEC 18004, mode octet)
assets/js/app.js        éditeur : formulaire, annuaire, exports
assets/css/fonts.css    fontes hébergées par le site
assets/fonts/           Roboto Condensed, Inter, Archivo (SIL OFL 1.1)
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

C'est fait : `Settings → Pages`, « Deploy from a branch », branche `main`,
dossier racine. Il n'y a rien à compiler. Le fichier `.nojekyll` à la racine
demande à GitHub de servir les fichiers tels quels — sans lui, tout dossier
commençant par un tiret bas, dont `_modele`, serait écarté du site.

En local :

```sh
python3 -m http.server 8000
```

`http://localhost:8000/jerome-goumard/` ouvre sa carte,
`http://localhost:8000/editeur.html` l’éditeur.
