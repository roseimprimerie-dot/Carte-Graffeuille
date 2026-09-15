# Éditeur des cartes de visite GRAFFEUILLE

Ce dépôt ne contient plus que l'éditeur : `editeur.html`, ouvert dans un
navigateur, compose la carte 54 × 85 mm au format du fichier d'impression et
l'exporte. Tout tourne côté client — pas de serveur, pas de compte, pas de
dépendance externe.

## Ouvrir l'éditeur

Les fontes sont chargées par le CSS, donc le fichier doit être servi, pas
ouvert depuis le disque :

```sh
python3 -m http.server 8099
```

puis <http://localhost:8099/editeur.html>.

## Ce qu'il produit

| Bouton | Fichier |
| --- | --- |
| Imprimer / PDF | La carte au format exact, fond perdu et traits de coupe en option. |
| SVG | Vectoriel, fonte incorporée quand le navigateur l'autorise. |
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
| `assets/js/icons.js` | Pictogrammes de la carte, tracés extraits de la fonte du fichier d'impression. |
| `assets/js/logo.js` | Tracés du logotype, du symbole et de la signature. |
| `assets/css/fonts.css` | Author (ITF Free Font License), Montserrat et Inter (SIL OFL 1.1), servies par le site. |

## Licence des fontes

`assets/fonts/author/` est sous ITF Free Font License. Sa clause 02 interdit
de redistribuer la fonte et de la mettre à disposition de tiers via un éditeur
de gabarits. Un dépôt public expose les deux : à arbitrer avant toute mise en
ligne publique de l'éditeur.
