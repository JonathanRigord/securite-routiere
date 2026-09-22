# Kiosque sécurité routière — ToutCan

App de mini-jeux de sensibilisation à la sécurité routière pour le stand ToutCan
(auto-école, réseau ECF Prisme) à la Foire de Marseille. Elle tourne en mode kiosque
sur une tablette tactile 32" en paysage, jouée par des petits groupes de passants.

## Contraintes non négociables

- **100 % hors-ligne.** Aucune ressource réseau : pas de CDN, pas de Google Fonts,
  pas d'API. Polices dans `fonts/`, illustrations en SVG dans `js/icons.js`.
- **Fonctionne en `file://`.** Scripts classiques chargés dans l'ordre par `index.html`,
  **jamais de modules ES** (`import`/`export`), qui sont bloqués en `file://`.
  Tout appel à une API navigateur susceptible d'échouer en `file://`
  (`history`, `localStorage`…) doit être entouré d'un `try/catch`.
- **Aucune collecte de données personnelles.** Seuls des compteurs de parties
  anonymes sont stockés localement (panneau animateur).
- **Pas de framework, pas de dépendance.** HTML, CSS et JavaScript natifs.

## Architecture

```
index.html            Écrans (accueil, menu, 4 jeux, résultat, pop-ups)
css/fonts.css         @font-face locales
css/style.css         Styles
js/data/*.js          Contenu pédagogique (questions, distances, équipements, panneaux)
js/icons.js           Illustrations SVG + fonction icon(name)
js/app.js             Navigation, logique des jeux, minuteurs, panneau animateur
tools/build.js        Réassemble tout en un fichier unique : dist/
```

Les constantes déclarées dans un script sont visibles des suivants (portée globale
partagée entre scripts classiques) : l'ordre de chargement dans `index.html` compte.

Cycle d'une partie : `startGame(mode)` → rendu du tour (`renderQuestion`,
`renderDistance`, `startMemory`, `renderSigns`) → `advance()` → `showResult()`.
Modes : `quiz`, `distance`, `memory`, `signs`.

## Commandes

- Développer : ouvrir `index.html` via le serveur intégré de PhpStorm.
- Déployer : `node tools/build.js` → `dist/securite-routiere-kiosk.html`,
  fichier unique à copier sur la tablette.

## Règles UX (issues de tests et de retours)

- **Unités en `vmin`** pour les tailles de texte et d'éléments, jamais en `vw`
  (le ratio exact de la dalle n'est pas connu).
- **Aucun défilement sur les écrans de jeu.** Tout doit tenir à l'écran.
  Centrage vertical en `justify-content: safe center` (pas `center` seul, qui
  rogne le haut du contenu quand il déborde).
- **Cibles tactiles ≥ 64 px**, `touch-action: manipulation`.
- **Deux temps pour répondre** : sélectionner, puis valider avec le bouton à droite.
- **Quitter passe par une pop-up de confirmation**, jamais par un double appui.
- **Ne jamais couper une délibération de groupe.** Retour auto à l'accueil seulement
  après 2 min 30 sans aucun contact, avec avertissement de 15 s.
- **Lecture accessible** : questions courtes (≈ 60 caractères), minuteur par défaut
  45 s. Les explications, lues après validation, ne sont pas chronométrées.
- **Chaque jeu affiche sa règle** en haut de son écran (`.rule-bar`).
- **Couleur jamais seule** : bon/mauvais signalé aussi par ✓ / ✗.

## Règles pédagogiques

- Questions à la 3e personne (un personnage fictif), pour contourner le réflexe
  « moi je suis prudent, ce sont les autres le problème ».
- Chaque réponse est suivie d'une explication, puis d'une statistique officielle
  (ONISR, Sécurité routière). **Aucun chiffre inventé** : toute nouvelle statistique
  doit être sourcée.
- Distances d'arrêt : formule officielle (V/10)² sur sol sec, × 1,5 sur sol mouillé.
- Équipement moto : seuls le casque homologué et les gants certifiés CE sont
  obligatoires ; le gilet haute visibilité doit être à bord. Tout le reste est
  « recommandé ». Ne pas écrire le contraire.

## Charte graphique

- Palette : asphalte `#12172B`, `#1B2140`, jaune `#FFC93C`, turquoise `#2EC4B6`,
  rouge `#E63946`, crème `#F5F1E6`, gris `#9AA1B0`.
- Polices : Fredoka (titres, chiffres, boutons), Work Sans (texte).
- **Illustrations en aplat coloré**, toutes dans le même style : grille 64×64,
  palette fermée (chaque teinte + une seule nuance d'ombre), ombre toujours à
  droite, aucun contour, coins arrondis.
- **Exception : les panneaux de signalisation** reproduisent les panneaux officiels
  (source : Wikimedia Commons, fichiers « France road sign <code>.svg »), jamais
  stylisés, pour apprendre à reconnaître les vrais.

## À faire

- Remplacer les panneaux simplifiés de `js/data/panneaux.js` par les SVG officiels.
- Tester sur la vraie tablette : lisibilité à 1 m, cibles au doigt, mode kiosque.
- Vérifier le compteur animateur (`localStorage`) sur la tablette réelle.
