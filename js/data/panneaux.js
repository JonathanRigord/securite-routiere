/* ============ PANNEAUX DE SIGNALISATION (jeu « Qui est-ce ? ») ============ */
/* Images officielles (source : Wikimedia Commons, fichiers « France road sign <code>.svg »),
   stockées dans panneaux/. Chaque panneau porte des attributs qui servent à générer
   les indices progressifs. Code et signification vérifiés sur la page Wikimedia Commons
   de chaque fichier avant intégration (aucune signification inventée). */
const SIGNS = [
  { id:'sensinterdit', name:'Sens interdit', forme:'un disque', couleur:'rouge', cat:"un panneau d'interdiction",
    hint:"Il signale qu'on ne peut pas s'engager dans cette voie.",
    img:'panneaux/France_road_sign_B1.svg.webp' },

  { id:'pietons', name:'Traversée de piétons', forme:'un triangle', couleur:'rouge et blanc', cat:'un panneau de danger',
    hint:"Il annonce un endroit où des piétons peuvent traverser la route.",
    img:'panneaux/France_road_sign_A13b.svg.webp' },

  { id:'passageaniveau', name:'Passage à niveau avec barrières', forme:'un triangle', couleur:'rouge et blanc', cat:'un panneau de danger',
    hint:"Il annonce un croisement avec une voie ferrée équipée de barrières.",
    img:'panneaux/France_road_sign_A7.svg.webp' },

  { id:'glissante', name:'Chaussée glissante (chantier)', forme:'un triangle', couleur:'rouge et jaune', cat:'un panneau de danger temporaire',
    hint:"Installé près d'un chantier, il prévient d'une perte d'adhérence possible.",
    img:'panneaux/France_road_sign_AK4.svg.webp' },

  { id:'travaux', name:'Travaux', forme:'un triangle', couleur:'rouge et jaune', cat:'un panneau de danger temporaire',
    hint:"Il annonce un chantier et souvent une circulation modifiée.",
    img:'panneaux/France_road_sign_AK5.svg.webp' },

  { id:'prioritedroite', name:'Priorité à droite', forme:'un triangle', couleur:'rouge et blanc', cat:'un panneau de priorité',
    hint:"Il prévient qu'il faudra céder le passage aux véhicules venant de la droite.",
    img:'panneaux/France_road_sign_AB1.svg.webp' },

  { id:'giratoire', name:'Carrefour à sens giratoire', forme:'un triangle', couleur:'rouge et blanc', cat:'un panneau de priorité',
    hint:"Il annonce l'arrivée prochaine d'un rond-point.",
    img:'panneaux/France_road_sign_AB25.svg.webp' },

  { id:'limite50', name:'Limitation à 50', forme:'un disque', couleur:'rouge et blanc', cat:"un panneau d'interdiction",
    hint:"Il fixe une vitesse à ne pas dépasser.",
    img:'panneaux/France_road_sign_B14_(50).svg.webp' },

  { id:'arretinterdit', name:'Arrêt et stationnement interdits', forme:'un disque', couleur:'rouge et bleu', cat:"un panneau d'interdiction",
    hint:"La croix rouge interdit de s'arrêter, même quelques instants.",
    img:'panneaux/France_road_sign_B6d.svg.webp' },

  { id:'obligdroite', name:'Direction obligatoire à droite', forme:'un disque', couleur:'bleu', cat:"un panneau d'obligation",
    hint:"Il impose de tourner à droite à la prochaine intersection.",
    img:'panneaux/France_road_sign_B21c1.svg.webp' },

  { id:'finzone', name:'Fin de toutes les interdictions', forme:'un disque', couleur:'blanc et noir', cat:'un panneau de fin de prescription',
    hint:"La barre diagonale noire annule toutes les interdictions précédemment signalées.",
    img:'panneaux/France_road_sign_B31.svg.webp' },

  { id:'bustransit', name:'Traversée de transports en commun', forme:'un carré', couleur:'bleu et blanc', cat:"un panneau d'indication",
    hint:"Il signale un endroit où un bus ou un tramway traverse la route.",
    img:'panneaux/France_Road_Sign_C20b.png' }
];
