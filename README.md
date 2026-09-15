# Éditeur des cartes de visite GRAFFEUILLE

Ce dépôt ne contient plus que l'éditeur : `editeur.html`, ouvert dans un
navigateur, compose la carte 54 × 85 mm au format du fichier d'impression et
l'exporte. Tout tourne côté client — pas de serveur, pas de compte, pas de
dépendance externe.

## Ouvrir l'éditeur

Double-cliquer sur `editeur.html`. Pas de serveur, pas de `localhost`, pas de
connexion : tout se charge depuis le dossier, y compris les fontes, et rien ne
sort du disque. Vérifié réseau coupé.

## Ce qu'il produit

| Bouton | Fichier |
| --- | --- |
| Imprimer / PDF | La carte au format exact, fond perdu et traits de coupe en option. |
| SVG | Vectoriel, Author et Montserrat incorporées en base64 : le fichier se compose pareil sur un poste qui ne les a pas. |
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

**Ces pages ne vivent plus dans ce dépôt.** Le QR les désigne, à l'hébergement
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
| `assets/js/fontes.js` | **Fichier généré** : les fontes de la carte en base64, incorporées au SVG exporté. Régénéré par `python3 outils/inclure-fontes.py`. |
| `assets/js/icons.js` | Pictogrammes de la carte, tracés extraits de la fonte du fichier d'impression. |
| `assets/js/logo.js` | Tracés du logotype, du symbole et de la signature. |
| `assets/css/fonts.css` | Author (ITF Free Font License), Montserrat, Inter et Archivo (SIL OFL 1.1), servies par le site. |

## Reprise dans le dépôt qui sert les pages

Les pages visées par le QR vivent ailleurs. Ce dépôt-ci est l'atelier : une
fois l'éditeur au point, il se recopie là-bas.

```sh
cp editeur.html   <depot-des-pages>/
cp -r assets/     <depot-des-pages>/assets/
cp -r outils/     <depot-des-pages>/outils/
```

`cp -r` fusionne : les fichiers propres aux pages publiques — `carte.js`,
`carte.css`, les SVG de logo — restent en place, ils n'existent pas ici.
`fonts.css` est volontairement un sur-ensemble : il déclare aussi Archivo,
dont seules les pages publiques se servent, pour que l'écrasement ne leur
retire rien.

**Trois fichiers sont partagés avec la page publique** et l'écraser la touche :

| Fichier | Ce que la page publique y prend |
| --- | --- |
| `contact.js` | `normalise`, `fullName`, `slugify`, `vcard`, `emails`, `e164`, `cityLine`, `addressQuery`, `websiteUrl`, `readFragment`, `DEFAULTS` |
| `icons.js` | `Icons.inline` |
| `logo.js` | `LOGO.mark`, `LOGO.wordmark`, `LOGO.tagline` |

Tant qu'on n'enlève ni ne renomme rien de cette liste, la copie est sans
risque. `app.js`, `card.js` et `qrcode.js` n'appartiennent qu'à l'éditeur.

## Licence des fontes

`assets/fonts/author/` est sous ITF Free Font License. Sa clause 02 interdit
de redistribuer la fonte et de la mettre à disposition de tiers via un éditeur
de gabarits. Un dépôt public expose les deux : à arbitrer avant toute mise en
ligne publique de l'éditeur.
