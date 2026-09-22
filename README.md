# Kiosque sécurité routière — ToutCan

Mini-jeux de sensibilisation routière pour borne tactile, 100 % hors-ligne.

## Démarrer

1. Ouvrir ce dossier dans PhpStorm (*File → Open*).
2. Ouvrir `index.html`, puis l'icône de navigateur en haut à droite de l'éditeur.

## Déployer sur la borne

```bash
node tools/build.js
```

Copier `dist/securite-routiere-kiosk.html` sur la tablette et l'ouvrir en plein écran.
Ce fichier unique contient tout : styles, scripts, polices et illustrations.

## Panneau animateur

Appui long (1,5 s) sur le coin bas-gauche de l'écran, ou touche **A** au clavier.

## Contexte détaillé

Voir `CLAUDE.md` : contraintes, architecture, règles UX, pédagogiques et graphiques.
