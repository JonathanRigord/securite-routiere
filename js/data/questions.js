/* ============ BANQUE DE QUESTIONS (QCM) ============ */
const QUESTION_POOL = [
  { q:"Karim roule collé derrière un camion sur l'autoroute.",
    a:["Rester collé, c'est plus rapide","Reculer : 2 secondes d'écart minimum","Doubler tout de suite","Klaxonner"], correct:1,
    exp:"Il faut garder au moins 2 secondes avec le véhicule devant soi (davantage par mauvais temps) : c'est le temps nécessaire pour réagir et freiner sans le percuter.",
    stat:"Repère simple : à 130 km/h, deux secondes représentent environ 72 mètres." },

  { q:"Léa ne met pas sa ceinture à l'arrière : le trajet ne dure que 5 minutes.",
    a:["Normal sur un trajet court","La ceinture est obligatoire à toutes les places","Seul le conducteur l'attache","Obligatoire sur autoroute seulement"], correct:1,
    exp:"La ceinture est obligatoire à toutes les places, y compris à l'arrière. Sans elle, le risque de blessure grave ou mortelle est bien plus élevé, même à faible vitesse.",
    stat:"En 2024 en France, 22 % des personnes tuées en voiture ne portaient pas leur ceinture (ONISR)." },

  { q:"Un enfant s'apprête à traverser. Que fait Mehdi au volant ?",
    a:["Il accélère pour passer avant","Il ralentit, prêt à s'arrêter","Il klaxonne","Il continue : l'enfant attendra"], correct:1,
    exp:"Un piéton, surtout un enfant, peut s'engager sans prévenir. Ralentir permet d'anticiper et de s'arrêter à temps — c'est aussi une obligation du code de la route.",
    stat:"Plus de la moitié des personnes tuées sans être responsables sont des piétons, cyclistes ou deux-roues (ONISR)." },

  { q:"Au feu rouge, Sofiane consulte son téléphone tenu en main.",
    a:["Autorisé : la voiture est à l'arrêt","Interdit dès que le moteur tourne","Seuls les appels sont interdits","Interdit en cas d'accident seulement"], correct:1,
    exp:"Tenir son téléphone en main est interdit dès que le moteur tourne, feu rouge compris. L'attention reste captée plusieurs secondes après avoir reposé l'appareil.",
    stat:"Un accident corporel sur dix en France est associé à l'usage du téléphone au volant." },

  { q:"Yasmine a bu. Elle se sent « un peu grise » mais veut rentrer.",
    a:["Rouler doucement suffit","Boire un café d'abord","Ne pas conduire, rentrer autrement","Ouvrir la fenêtre"], correct:2,
    exp:"Ni le café, ni l'air frais, ni la lenteur ne font baisser l'alcoolémie : seul le temps élimine l'alcool. Le seul réflexe fiable est de ne pas prendre le volant.",
    stat:"L'alcool est en cause dans 21 % des accidents mortels en France métropolitaine (ONISR)." },

  { q:"Thomas a sommeil sur l'autoroute. Il accélère pour arriver plus vite.",
    a:["Aucun risque s'il ouvre la fenêtre","Vitesse et fatigue : première cause d'accident mortel","Il risque juste une amende","Rouler vite le réveillera"], correct:1,
    exp:"La somnolence et la vitesse excessive sont les deux premières causes d'accidents mortels sur autoroute. Le bon geste : s'arrêter et faire une pause toutes les deux heures.",
    stat:"La vitesse excessive ou inadaptée est présente dans 29 % des accidents mortels (ONISR)." },

  { q:"Nadia téléphone avec un kit mains libres. Est-elle en sécurité ?",
    a:["Oui, ses mains sont libres","Non, la conversation capte son attention","Oui, c'est pour ça que c'est légal","Non, sauf sur autoroute"], correct:1,
    exp:"Le danger principal n'est pas la main occupée mais l'attention captée par la conversation. Le kit mains libres reste autorisé, mais il ne supprime pas le risque.",
    stat:"Les dispositifs mains libres ne sont pas une alternative plus sûre (ONISR)." },

  { q:"Il pleut. Camille roule à 130 km/h sur l'autoroute.",
    a:["La pluie ne change rien","La limite passe à 110 km/h","Il faut descendre à 90 km/h","Seuls les camions ralentissent"], correct:1,
    exp:"Par temps de pluie, la vitesse maximale sur autoroute passe de 130 à 110 km/h. La distance d'arrêt augmente d'environ 50 % sur chaussée mouillée.",
    stat:"À 130 km/h sur sol mouillé, la distance d'arrêt atteint environ 253 mètres." },

  { q:"Julien double un cycliste en ville en le frôlant.",
    a:["Peu importe s'il roule doucement","1 mètre minimum en agglomération","3 mètres partout","Aucun écart imposé"], correct:1,
    exp:"Il faut laisser au moins 1 mètre en agglomération et 1,50 mètre hors agglomération — environ la largeur d'une portière ouverte.",
    stat:"Les cyclistes sont surreprésentés parmi les victimes non responsables d'accidents (ONISR)." },

  { q:"Alex part en scooter sans casque : il n'a que 500 mètres à faire.",
    a:["Aucun risque, c'est trop court","La tête reste la zone la plus exposée","Juste une amende","Le casque sert sur route rapide"], correct:1,
    exp:"Le casque protège la zone la plus vulnérable du corps, et la majorité des accidents de deux-roues se produisent près du domicile.",
    stat:"En outre-mer, plus d'un quart des usagers de deux-roues tués ne portaient pas de casque (ONISR)." },

  { q:"Inès a fumé du cannabis il y a quelques heures. Elle se sent bien.",
    a:["Elle peut conduire si elle se sent bien","Les effets durent plusieurs heures","Risqué seulement avec de l'alcool","Indétectable au contrôle"], correct:1,
    exp:"Les stupéfiants altèrent la vigilance et le temps de réaction bien après la sensation d'être « redescendu », et le dépistage reste positif longtemps après.",
    stat:"Les stupéfiants sont en cause dans 11 % des accidents mortels (ONISR)." },

  { q:"Un enfant monte à l'arrière sans siège auto, juste pour aller à l'école.",
    a:["Un enfant peut s'asseoir librement","Siège adapté obligatoire jusqu'à 10 ans ou 1,35 m","La ceinture suffit dès 5 ans","Obligatoire sur longs trajets"], correct:1,
    exp:"Un siège ou rehausseur adapté est obligatoire jusqu'à 10 ans ou 1,35 m. La ceinture adulte seule passe au niveau du cou d'un enfant et peut le blesser gravement.",
    stat:"Les trajets courts sont ceux où les conducteurs relâchent le plus leur vigilance." },

  { q:"Malik veut doubler sans voir la fin de la ligne droite.",
    a:["Doubler vite, ça passera","Renoncer tant qu'il ne voit pas tout","Doubler en klaxonnant","Doubler par la droite"], correct:1,
    exp:"Un dépassement demande une visibilité complète sur toute sa durée. Les collisions frontales comptent parmi les plus meurtrières.",
    stat:"Les routes hors agglomération concentrent la majorité de la mortalité routière." },

  { q:"Une ambulance arrive derrière Fatou, sirène allumée.",
    a:["Accélérer pour ne pas gêner","Se ranger dès que c'est possible","Freiner brusquement","Rester au milieu de la voie"], correct:1,
    exp:"Il faut faciliter le passage du véhicule prioritaire en se rangeant dès que c'est possible sans danger — sans freinage brutal ni manœuvre précipitée.",
    stat:"Un secours retardé aggrave directement les conséquences d'un accident." },

  { q:"Hugo règle son GPS posé sur ses genoux tout en roulant.",
    a:["Rien à signaler, il roule lentement","Tout écran tenu en main est interdit","Seul le téléphone est concerné","Autorisé si c'est bref"], correct:1,
    exp:"Tout écran tenu en main est une distraction. Le GPS doit être fixé sur un support et réglé avant de démarrer, pas pendant la conduite.",
    stat:"Un défaut d'attention est relevé dans 24 % des accidents corporels (ONISR, 2024)." },

  { q:"Salim, en permis probatoire, a bu deux verres au repas.",
    a:["La limite est la même pour tous","0,2 g/l pour les jeunes conducteurs","Pas de limite sous 3 verres","La limite ne vaut qu'en ville"], correct:1,
    exp:"Le taux maximal est de 0,5 g/l de sang, mais il est abaissé à 0,2 g/l en permis probatoire — soit en pratique aucun verre.",
    stat:"L'alcool reste le deuxième facteur d'accidents mortels, derrière la vitesse." },

  { q:"Un pneu est très usé. La conductrice repousse le changement.",
    a:["Aucun impact tant qu'il reste de la gomme","Le freinage s'allonge, surtout sous la pluie","Seul le confort change","Un effet à grande vitesse seulement"], correct:1,
    exp:"Les pneus sont le seul point de contact avec la route. Usés, ils allongent fortement la distance de freinage et augmentent le risque d'aquaplanage.",
    stat:"L'adhérence figure parmi les facteurs aggravants des accidents graves." },

  { q:"Avant de tourner à droite, elle ne regarde que son rétroviseur.",
    a:["Le rétroviseur suffit","Un cycliste peut être dans l'angle mort","Elle oublie juste les piétons derrière","Elle oublie les feux"], correct:1,
    exp:"L'angle mort masque totalement un deux-roues ou un cycliste. Un contrôle visuel par-dessus l'épaule est indispensable avant de tourner.",
    stat:"Les deux-roues motorisés pèsent très lourd dans la mortalité au regard de leur part du trafic." },

  { q:"Deux voitures arrivent en même temps à un croisement sans panneau.",
    a:["Le plus rapide passe","Celui qui vient de la droite","Le plus gros véhicule","Celui qui klaxonne"], correct:1,
    exp:"En l'absence de signalisation, la priorité à droite s'applique. En cas de doute, ralentir et établir un contact visuel reste la meilleure protection.",
    stat:"Les refus de priorité sont une cause récurrente d'accidents en agglomération." },

  { q:"Panne sur la bande d'arrêt d'urgence de l'autoroute. Et ensuite ?",
    a:["Rester dans la voiture","Gilet, sortir, se mettre derrière la glissière","Réparer soi-même","Laisser les passagers à bord"], correct:1,
    exp:"Rester dans un véhicule immobilisé sur la bande d'arrêt d'urgence est très dangereux. Le bon geste : gilet, évacuation par la droite, puis attendre derrière la glissière.",
    stat:"La bande d'arrêt d'urgence est l'une des zones les plus accidentogènes de l'autoroute." }
];
