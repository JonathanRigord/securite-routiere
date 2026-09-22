/* ============ SCÉNARIOS DE DISTANCE D'ARRÊT ============ */
/* Formule officielle du code de la route : distance d'arrêt = (V/10)² sur sol sec, x1,5 sur sol mouillé.
   Distance de réaction = (V/10) x 3, pour 1 seconde de temps de réaction. */
const DISTANCE_POOL = [
  { speed:50, wet:false, truth:25, max:80,
    ctx:"En ville, une voiture roule à 50 km/h sur route sèche. Un enfant surgit. Où s'immobilise-t-elle ?",
    exp:"À 50 km/h sur sol sec, il faut environ 25 mètres pour s'arrêter : 15 mètres parcourus pendant la seconde de réaction, puis 10 mètres de freinage.",
    stat:"Formule du code de la route : distance d'arrêt = (vitesse ÷ 10)². À 50 km/h : 5 × 5 = 25 mètres." },

  { speed:50, wet:true, truth:37.5, max:100,
    ctx:"Même scène, mais il pleut : la voiture roule à 50 km/h sur chaussée mouillée. Où s'arrête-t-elle ?",
    exp:"Sur sol mouillé, la distance d'arrêt augmente d'environ 50 % : il faut près de 37,5 mètres au lieu de 25, soit plus d'un bus de rallonge.",
    stat:"Sur chaussée mouillée, la distance d'arrêt est multipliée par 1,5 par rapport au sol sec." },

  { speed:90, wet:false, truth:81, max:200,
    ctx:"Sur une route de campagne, une voiture roule à 90 km/h sur sol sec. Un obstacle apparaît. Où s'immobilise-t-elle ?",
    exp:"À 90 km/h sur sol sec, il faut environ 81 mètres : 27 mètres pendant la seconde de réaction, puis 54 mètres de freinage. Presque la longueur d'un terrain de football.",
    stat:"En doublant la vitesse, la distance de freinage est multipliée par quatre, pas par deux." },

  { speed:90, wet:true, truth:121.5, max:250,
    ctx:"Même route, sous la pluie : la voiture roule à 90 km/h sur chaussée mouillée. Où s'arrête-t-elle ?",
    exp:"Sous la pluie à 90 km/h, il faut environ 121 mètres pour s'immobiliser, contre 81 sur sol sec — soit 40 mètres de plus.",
    stat:"Formule sol mouillé : (vitesse ÷ 10)² × 1,5. À 90 km/h : 81 × 1,5 ≈ 121 mètres." },

  { speed:130, wet:false, truth:169, max:340,
    ctx:"Sur autoroute, une voiture roule à 130 km/h sur sol sec. Bouchon soudain devant. Où s'immobilise-t-elle ?",
    exp:"À 130 km/h sur sol sec, il faut environ 169 mètres pour s'arrêter : 39 mètres pendant la seconde de réaction, puis 130 mètres de freinage.",
    stat:"169 mètres, c'est environ la longueur de deux terrains de football mis bout à bout." },

  { speed:130, wet:true, truth:253.5, max:480,
    ctx:"Même autoroute sous la pluie : une voiture roule toujours à 130 km/h au lieu des 110 autorisés. Où s'arrête-t-elle ?",
    exp:"À 130 km/h sur chaussée mouillée, il faut environ 253 mètres — près d'un quart de kilomètre. C'est pourquoi la vitesse est abaissée à 110 km/h par temps de pluie.",
    stat:"En respectant les 110 km/h sous la pluie, la distance d'arrêt tombe à environ 181 mètres, soit 72 mètres gagnés." },

  { speed:30, wet:false, truth:9, max:40,
    ctx:"Dans une zone limitée à 30 km/h près d'une école, sur sol sec. Où la voiture s'immobilise-t-elle ?",
    exp:"À 30 km/h sur sol sec, il ne faut que 9 mètres pour s'arrêter. C'est toute la raison d'être des zones 30 aux abords des écoles.",
    stat:"Passer de 50 à 30 km/h fait chuter la distance d'arrêt de 25 à 9 mètres, soit près de trois fois moins." },

  { speed:110, wet:false, truth:121, max:250,
    ctx:"Sur une voie rapide à 110 km/h, sur sol sec. Un véhicule est arrêté devant. Où s'immobilise la voiture ?",
    exp:"À 110 km/h sur sol sec, il faut environ 121 mètres pour s'arrêter : 33 mètres pendant la réaction, puis 88 mètres de freinage.",
    stat:"Entre 110 et 130 km/h, la distance d'arrêt passe de 121 à 169 mètres, soit 48 mètres de plus." },

  { speed:30, wet:true, truth:13.5, max:55,
    ctx:"Zone 30 devant une école, mais il pleut. Un enfant traverse sans regarder. Où la voiture s'immobilise-t-elle ?",
    exp:"À 30 km/h sur sol mouillé, il faut environ 13,5 mètres — la moitié en plus que sur sol sec. Même à basse vitesse, la pluie change tout.",
    stat:"À 30 km/h, un piéton percuté a de fortes chances de survivre ; à 50 km/h, le risque de décès augmente considérablement (Sécurité routière)." },

  { speed:70, wet:false, truth:49, max:130,
    ctx:"Sur une départementale limitée à 70 km/h, sur sol sec. Un tracteur débouche d'un chemin. Où s'arrête la voiture ?",
    exp:"À 70 km/h sur sol sec, il faut environ 49 mètres : 21 mètres pendant la seconde de réaction, puis 28 mètres de freinage.",
    stat:"Passer de 70 à 90 km/h fait grimper la distance d'arrêt de 49 à 81 mètres, soit 32 mètres de plus." },

  { speed:80, wet:false, truth:64, max:160,
    ctx:"Sur une route limitée à 80 km/h, sur sol sec. Un obstacle apparaît dans un virage. Où la voiture s'immobilise-t-elle ?",
    exp:"À 80 km/h sur sol sec, il faut environ 64 mètres pour s'arrêter : 24 mètres de réaction, puis 40 mètres de freinage.",
    stat:"L'abaissement de 90 à 80 km/h sur certaines routes réduit la distance d'arrêt de 81 à 64 mètres, soit 17 mètres gagnés." },

  { speed:110, wet:true, truth:181.5, max:380,
    ctx:"Sur autoroute sous la pluie, une voiture respecte la limite abaissée de 110 km/h. Où s'immobilise-t-elle ?",
    exp:"Même en respectant les 110 km/h sous la pluie, il faut encore environ 181 mètres pour s'arrêter. La prudence impose de ralentir davantage.",
    stat:"Respecter les 110 km/h au lieu de 130 sous la pluie fait gagner environ 72 mètres de distance d'arrêt." }
];
