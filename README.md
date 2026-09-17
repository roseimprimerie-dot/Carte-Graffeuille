# Éditeur des cartes de visite GRAFFEUILLE

Ce dépôt ne contient plus que l'éditeur : `editeur.html`, ouvert dans un
navigateur, compose la carte 54 × 85 mm au format du fichier d'impression et
l'exporte. Tout tourne côté client - pas de serveur, pas de compte, pas de
dépendance externe.

## Installer les fontes

`assets/fonts/author/` **ne fait pas partie du dépôt** : Author est sous ITF
Free Font License, dont la clause 02 interdit d'en redistribuer les fichiers et
de les mettre à disposition de tiers. Ce dépôt étant public, elle n'y entre pas.

Sur un poste qui compose les cartes, déposer les cinq fichiers dans
`assets/fonts/author/` :

```
Author-Regular.woff2   Author-Medium.woff2   Author-MediumItalic.woff2
Author-Semibold.woff2  Author-Bold.woff2
```

puis reconstruire les fontes incorporées à l'export, et réestampiller :

```sh
python3 outils/inclure-fontes.py
python3 outils/empreinte.py
```

Sans elles l'éditeur fonctionne, mais compose dans une fonte de substitution et
le dit en clair : la mise en page est relevée sur les largeurs réelles d'Author,
donc les coupures de lignes et la largeur du bandeau rouge deviennent fausses.
Un tel fichier ne part pas à l'impression.

## Ouvrir l'éditeur

Double-cliquer sur `editeur.html`. Pas de serveur, pas de `localhost`, pas de
connexion : tout se charge depuis le dossier, y compris les fontes, et rien ne
sort du disque. Vérifié réseau coupé. **https://roseimprimerie-dot.github.io/Carte-Graffeuille/editeur.html**

## Après chaque modification d'un fichier de assets/

```sh
python3 outils/empreinte.py
```

Cette commande suffixe chaque feuille de style et chaque script de
`editeur.html` par l'empreinte de son contenu. Sans elle, un navigateur peut
resservir un ancien `assets/js/contact.js` après une mise en ligne : la page
est à jour, son code ne l'est pas, et une valeur corrigée réapparaît sans que
rien ne le signale. Lancer la commande avant de pousser, et c'est réglé.

## Ce qu'il produit

| Bouton | Fichier |
| --- | --- |
| Imprimer / PDF | La carte au format exact, fond perdu et traits de coupe en option. |
| SVG | Vectoriel, les cinq faces d'Author incorporées en base64 : le fichier se compose pareil sur un poste qui ne les a pas. |
| PNG 600 dpi | Rastérisation pour une relecture rapide. |
| Fiche contact `.vcf` | vCard 3.0, téléphone normalisé en E.164. |
| Fiche de la personne `.json` | Les coordonnées, à déposer sur l'hébergement qui sert la page visée par le QR. |
| Exporter / importer l'annuaire | L'ensemble des cartes enregistrées dans le navigateur. |

## Le QR code

Le QR du verso porte l'adresse de la page en ligne de la personne :

```
https://graffeuille.github.io/CDV/equipe/prenom-nom/
```

Elle est bâtie sur une racine fixe, `Contact.SITE` dans
`assets/js/contact.js`, et non sur l'adresse d'où l'éditeur a été ouvert : un
QR imprimé depuis un poste local porte donc la même adresse que depuis le
site publié. Le champ « Adresse du site publié » ne sert qu'à viser un autre
hébergement.

**Ces pages vivent dans un autre dépôt.** Le QR les désigne, à l'hébergement
de les servir. Sans identifiant de personne, le QR bascule en mode autonome et
porte les coordonnées dans l'URL elle-même, sans page à héberger.

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `editeur.html` | Le formulaire, l'aperçu et les boutons. |
| `assets/js/app.js` | Liaison formulaire ↔ aperçu, annuaire, exports. |
| `assets/js/card.js` | **Le seul fichier qui décrit la mise en page imprimée**, relevée au millimètre sur les fichiers fournis. |
| `assets/js/contact.js` | Modèle de données, vCard, adresse visée par le QR. |
| `assets/js/qrcode.js` | Encodeur QR (ISO/IEC 18004), sans bibliothèque tierce. |
| `assets/js/fontes.js` | **Généré, hors dépôt** : les fontes de la carte en base64, incorporées au SVG exporté. Produit par `python3 outils/inclure-fontes.py`. |
| `assets/js/icons.js` | Pictogrammes de la carte, tracés extraits de la fonte du fichier d'impression. |
| `assets/js/logo.js` | Tracés du logotype, du symbole et de la signature. |
| `assets/css/fonts.css` | Author (ITF Free Font License) pour la carte, Inter (SIL OFL 1.1) pour l'interface. |

## Licence des fontes

Author est sous ITF Free Font License, Inter sous SIL Open Font License 1.1.
Seule Inter est versionnée ici : sa licence autorise la redistribution. Author
reste hors du dépôt, et `.gitignore` l'y maintient — ses fichiers comme le
`fontes.js` qui en dérive.
