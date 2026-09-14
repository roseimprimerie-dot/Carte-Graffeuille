# Cartes de visite dynamique - GRAFFEUILLE

Deux pages, un seul dépôt :

| Page | À qui elle s'adresse |
| --- | --- |
| `index.html` | **La carte en ligne.** C'est elle qui s'ouvre quand on scanne le QR code au dos de la carte imprimée. Elle ne montre que les coordonnées, sur une page pensée pour un téléphone. |
| `editeur.html` | **L'éditeur.** On y saisit les coordonnées, on voit la carte se composer, on exporte le fichier d'impression. Aucune page publique n'y renvoie. |

Pourquoi ? : tout tourne dans le navigateur : pas de serveur, pas de compte, pas de
dépendance externe.

## Ce que voit la personne qui scanne

Le QR code ne contient plus la fiche elle-même mais **l'adresse de la page en
ligne**. La différence compte : corriger un numéro sur le site met à jour
toutes les cartes déjà distribuées, alors qu'un QR contenant une vCard fige les
coordonnées à l'encre.

La page affiche le logo, le nom, la fonction, puis quatre lignes que l'on
touche du pouce : appeler, écrire, ouvrir le site, ouvrir l'itinéraire. Le
bouton « Ajouter à mes contacts » télécharge la fiche `.vcf`. 

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
