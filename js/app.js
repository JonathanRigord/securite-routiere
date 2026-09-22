/* ============================================================
   POINT D'ENTRÉE DE L'APPLICATION ("composition root")
   ============================================================
   Ce fichier est le dernier chargé (voir l'ordre des <script> dans
   index.html) : à ce stade, toutes les classes (StatsStore, CountdownTimer,
   IdleWatcher, ScreenManager, KioskGuard, Game et ses 4 sous-classes,
   GameFactory) existent déjà. Le rôle de app.js n'est PAS de contenir de la
   logique de jeu — chaque classe s'occupe déjà de la sienne — mais
   d'assembler ces briques entre elles et de les relier aux boutons de la
   page. On appelle parfois ce genre de fichier un "composition root" :
   l'endroit unique où l'on décide QUI collabore avec QUI. */

/* ============ ÉTAT ET SERVICES PARTAGÉS ============ */

// Réglages modifiables depuis le panneau animateur (nombre de questions,
// durée du minuteur). C'est un objet ORDINAIRE, pas une classe : chaque jeu
// reçoit une RÉFÉRENCE vers ce même objet (voir gameFactory plus bas), donc
// une modification ici (ex. SETTINGS.timer = 60) est immédiatement visible
// par tous les jeux sans rien recopier.
const SETTINGS = { count:6, timer:45 };

// ScreenManager reçoit la liste de tous les écrans de l'application, sous
// forme d'un objet { nom: élémentDOM }. document.getElementById(...) va
// chercher chaque <section> par son id dans index.html.
const screenManager = new ScreenManager({
  attract: document.getElementById('attract'),
  menu: document.getElementById('menu'),
  quiz: document.getElementById('quiz'),
  distance: document.getElementById('distance'),
  memory: document.getElementById('memory'),
  signs: document.getElementById('signs'),
  result: document.getElementById('result')
});
screenManager.go('attract'); // synchronise l'état initial avec le HTML (section#attract.active)

const statsStore = new StatsStore('toutcan_stats_v1'); // 'toutcan_stats_v1' = la clé utilisée dans localStorage
const resultAutoReturn = new CountdownTimer(); // minuteur dédié au retour auto depuis l'écran de résultat (90 s)

// Références aux trois pop-ups plein écran de l'application, réutilisées
// dans plusieurs fonctions ci-dessous.
const quitBackdrop = document.getElementById('quitBackdrop');
const idleBackdrop = document.getElementById('idleBackdrop');
const panelBackdrop = document.getElementById('panelBackdrop');

// Les 4 écrans considérés comme "en pleine partie" (utilisé pour savoir si
// le minuteur d'inactivité doit surveiller ou non — pas de sens de
// surveiller l'inactivité sur l'écran d'accueil, par exemple).
const GAME_SCREEN_NAMES = ['quiz', 'distance', 'memory', 'signs'];

// Le jeu actuellement en cours (une instance de QuizGame, DistanceGame,
// MemoryGame ou SignsGame), ou `null` avant qu'une partie n'ait démarré.
// `let` plutôt que `const` : cette variable est réassignée à chaque
// `startGame(...)`.
let activeGame = null;

/* ============ NAVIGATION ============ */

// Arrête le minuteur du jeu actif, s'il y en a un. Sur les jeux sans
// minuteur (Distance, Signs), `stopTimer()` est un no-op hérité de Game.js
// (voir ce fichier) : cet appel ne fait alors simplement rien, sans risque.
function stopActiveGameTimer(){
  if (activeGame) activeGame.stopTimer();
}

/* Toute pop-up ouverte (confirmation de sortie, panneau animateur) doit être
   refermée quand on change d'écran de force (ex. retour auto après
   inactivité) : sinon elle reste affichée, plein écran, par-dessus l'écran
   suivant pour le prochain visiteur. */
function closeAllPopups(){
  quitBackdrop.classList.remove('show');
  panelBackdrop.classList.remove('show');
}

// Les fonctions goToAttract/goToMenu centralisent tout ce qu'il faut faire
// en quittant une partie ou un menu : arrêter tous les minuteurs en cours
// (celui du jeu, celui du retour auto, celui d'inactivité) et fermer toute
// pop-up avant de changer d'écran. Sans ce genre de fonction unique, il
// serait facile d'oublier une de ces étapes à un endroit du code.
function goToAttract(){
  stopActiveGameTimer();
  resultAutoReturn.stop();
  idleWatcher.clear();
  closeAllPopups();
  screenManager.go('attract');
}

function goToMenu(){
  stopActiveGameTimer();
  resultAutoReturn.stop();
  idleWatcher.clear();
  closeAllPopups();
  screenManager.go('menu');
}

// À partir d'ici : câblage des boutons. Le principe est toujours le même :
// addEventListener('click', maFonction) associe un clic sur un bouton HTML
// (retrouvé par son id) à une fonction JavaScript à exécuter.
document.getElementById('startBtn').addEventListener('click', goToMenu);
document.getElementById('menuBackBtn').addEventListener('click', goToAttract);
// Ici on utilise des fonctions fléchées `() => startGame('quiz')` plutôt que
// de passer startGame directement : ça permet de FIXER l'argument ('quiz',
// 'distance', ...) à l'avance, puisque addEventListener n'appelle la
// fonction qu'avec un objet "événement" en argument, jamais avec le nôtre.
document.getElementById('gameQuizBtn').addEventListener('click', () => startGame('quiz'));
document.getElementById('gameDistBtn').addEventListener('click', () => startGame('distance'));
document.getElementById('gameMemBtn').addEventListener('click', () => startGame('memory'));
document.getElementById('gameSignBtn').addEventListener('click', () => startGame('signs'));
document.getElementById('homeBtn').addEventListener('click', goToAttract);
document.getElementById('replayBtn').addEventListener('click', () => startGame(activeGame.mode));
document.getElementById('otherGameBtn').addEventListener('click', goToMenu);

/* Quitter : pop-up de confirmation, jamais un simple double appui. */
function openQuitConfirm(){
  stopActiveGameTimer(); // on met en pause le minuteur de question pendant que la pop-up est ouverte
  quitBackdrop.classList.add('show');
}
function closeQuitConfirm(){
  quitBackdrop.classList.remove('show');
  // `activeGame instanceof QuizGame` : vérifie que le jeu en cours EST
  // précisément un QuizGame (le seul des 4 jeux à avoir un minuteur de
  // question à relancer). Sans cette vérification, appeler
  // `activeGame.startCountdown()` sur un DistanceGame ferait planter le
  // script, car cette méthode n'existe que sur QuizGame.
  if (activeGame instanceof QuizGame && !activeGame.answered) activeGame.startCountdown();
}

document.getElementById('quitQuizBtn').addEventListener('click', openQuitConfirm);
document.getElementById('quitDistBtn').addEventListener('click', openQuitConfirm);
document.getElementById('quitMemBtn').addEventListener('click', openQuitConfirm);
document.getElementById('quitSignBtn').addEventListener('click', openQuitConfirm);
document.getElementById('stayBtn').addEventListener('click', closeQuitConfirm);
document.getElementById('leaveBtn').addEventListener('click', () => {
  quitBackdrop.classList.remove('show');
  goToAttract();
});

/* ============ VEILLE / INACTIVITÉ ============ */

// On construit ici l'unique instance d'IdleWatcher de l'application, en lui
// fournissant les fonctions à appeler à chaque étape (voir js/core/IdleWatcher.js
// pour le détail de son fonctionnement interne). C'est ici, et seulement
// ici, que l'IdleWatcher "générique" est branché aux vrais éléments HTML de
// CETTE application — il ne connaît lui-même ni idleBackdrop, ni
// screenManager, ni goToAttract.
const idleWatcher = new IdleWatcher({
  delaySeconds: 150, // 2 min 30 sans contact avant l'avertissement
  graceSeconds: 15,
  // Fonction fléchée qui vérifie, au moment où IdleWatcher en a besoin, si
  // l'écran actuellement affiché fait partie des écrans de jeu.
  isActive: () => GAME_SCREEN_NAMES.includes(screenManager.activeName()),
  onWarn: () => idleBackdrop.classList.add('show'),
  onDismissWarn: () => idleBackdrop.classList.remove('show'),
  onTick: (left) => { document.getElementById('idleCount').textContent = left; },
  onExpire: () => goToAttract()
});

document.getElementById('idleStayBtn').addEventListener('click', () => idleWatcher.arm());

/* Toute interaction relance le délai, sauf pendant que l'avertissement est
   déjà affiché : seul le bouton "Nous sommes toujours là" doit le dismisser. */
['pointerdown', 'keydown'].forEach(evt => {
  // Le `true` final (phase de capture) permet d'intercepter TOUS les clics
  // et touches de la page, même ceux qui seraient normalement arrêtés en
  // chemin par un autre gestionnaire d'événement — utile ici puisqu'on veut
  // détecter la moindre activité, où qu'elle ait lieu sur la page.
  document.addEventListener(evt, () => {
    if (idleWatcher.isWarning()) return;
    idleWatcher.arm();
  }, true);
});

/* ============ LANCEMENT D'UNE PARTIE ============ */

// gameFactory reçoit les dépendances communes à tous les jeux : les mêmes
// screenManager/statsStore/settings que ceux définis plus haut dans ce
// fichier, plus onFinish, la fonction appelée automatiquement par
// Game.finish() une fois une partie terminée (voir Game.js). C'est ce
// mécanisme qui relie "un jeu se termine" à "afficher l'écran de résultat"
// sans que Game.js ait besoin de connaître showResult().
const gameFactory = new GameFactory({
  screenManager,
  statsStore,
  settings: SETTINGS,
  onFinish: (game) => showResult(game)
});

// Fonction appelée par les 4 boutons de jeu du menu (voir plus haut).
function startGame(which){
  resultAutoReturn.stop(); // au cas où on relance depuis l'écran de résultat (bouton "Rejouer")
  activeGame = gameFactory.get(which); // récupère (ou crée) l'instance de jeu correspondante
  activeGame.start(); // délègue tout le reste à Game.start() / MemoryGame.start()
  idleWatcher.arm();
}

/* ============ ÉCRAN DE RÉSULTAT ============ */

// Reçoit le jeu qui vient de se terminer (voir Game.finish() → onFinish
// plus haut). `game` peut être n'importe laquelle des 4 sous-classes : on
// ne s'appuie ici que sur les propriétés communes (mode, score, mistakes,
// deck) ou spécifiques à Memory (found, errors, pairs), en les distinguant
// explicitement via `game.mode === 'memory'`.
function showResult(game){
  idleWatcher.clear(); // l'écran de résultat n'est pas "en jeu" : plus besoin de surveiller l'inactivité ici
  screenManager.go('result');
  screenManager.element('result').scrollTop = 0;

  const recap = document.getElementById('recap');
  recap.innerHTML = '';
  const takeaway = document.getElementById('takeaway');
  takeaway.innerHTML = '';

  if (game.mode === 'memory') buildMemoryResult(game, recap);
  else buildStandardResult(game, recap);

  const tLabel = document.createElement('strong');
  tLabel.textContent = 'Le réflexe à retenir aujourd’hui';
  const tText = document.createElement('span');
  tText.textContent = pickTakeaway(game);
  takeaway.appendChild(tLabel);
  takeaway.appendChild(tText);

  document.getElementById('otherGameBtn').textContent = 'Choisir un autre jeu';

  // Démarre le retour automatique à l'accueil après 90 s d'inactivité SUR
  // CET écran de résultat (indépendant du délai de 2 min 30 pendant une
  // partie, géré par idleWatcher). Voir startGame() : ce minuteur est
  // explicitement arrêté si on clique "Rejouer" avant son expiration.
  resultAutoReturn.start(90, { onExpire: () => goToAttract() });
}

// Construit le récapitulatif pour Quiz, Distance et Signs (les 3 jeux qui
// partagent la même forme de résultat : un score sur le nombre de manches).
function buildStandardResult(game, recap){
  document.getElementById('scoreText').textContent = game.score + ' / ' + game.deck.length;

  const ratio = game.score / game.deck.length;
  let msg;
  if (ratio === 1) msg = "Sans faute. Vos réflexes sont les bons.";
  else if (ratio >= 0.6) msg = "Bonne base, avec quelques réflexes à consolider.";
  else msg = "Plusieurs points à revoir — et c'est exactement pour ça que ce jeu existe.";
  document.getElementById('resultMsg').textContent = msg;

  if (game.mistakes.length){
    const h = document.createElement('h3');
    h.textContent = game.mistakes.length === 1 ? 'La question à revoir' : 'Les ' + game.mistakes.length + ' questions à revoir';
    recap.appendChild(h);
    game.mistakes.forEach(m => {
      const item = document.createElement('div');
      item.className = 'recap-item';
      const q = document.createElement('p');
      q.className = 'rq';
      q.textContent = m.q;
      const a = document.createElement('p');
      a.className = 'ra';
      a.textContent = 'Bonne réponse : ' + m.right + ' — ' + m.exp;
      item.appendChild(q);
      item.appendChild(a);
      recap.appendChild(item);
    });
  }

  if (ratio >= 0.8) launchConfetti();
}

// Construit le récapitulatif spécifique au jeu de mémoire (paires trouvées
// et essais ratés, plutôt qu'un score sur un nombre de questions).
function buildMemoryResult(game, recap){
  document.getElementById('scoreText').textContent = game.found + ' paires';

  let msg;
  if (game.errors <= 3) msg = "Excellente mémoire ! " + game.errors + " essai" + (game.errors > 1 ? 's' : '') + " raté" + (game.errors > 1 ? 's' : '') + " seulement.";
  else if (game.errors <= 8) msg = "Bien joué, en " + game.errors + " essais ratés.";
  else msg = "Toutes les paires trouvées, en " + game.errors + " essais ratés.";
  document.getElementById('resultMsg').textContent = msg;

  const h = document.createElement('h3');
  h.textContent = "Ce qui est vraiment obligatoire à moto";
  recap.appendChild(h);

  game.pairs.forEach(eq => {
    const item = document.createElement('div');
    item.className = 'recap-item';
    item.style.borderLeftColor = (eq.status === 'obl') ? 'var(--danger)' : 'var(--chrome)';
    const q = document.createElement('p');
    q.className = 'rq';
    q.textContent = eq.name + ' — ' + eq.badge;
    const a = document.createElement('p');
    a.className = 'ra';
    a.textContent = eq.fact;
    item.appendChild(q);
    item.appendChild(a);
    recap.appendChild(item);
  });

  if (game.errors <= 5) launchConfetti();
}

// Choisit le petit message pédagogique de fin de partie ("Le réflexe à
// retenir aujourd'hui"), différent selon le jeu joué.
function pickTakeaway(game){
  if (game.mode === 'signs'){
    return "La forme et la couleur d'un panneau disent déjà l'essentiel : triangle pour un danger, rond rouge pour une interdiction, rond bleu pour une obligation. C'est ce qui permet de réagir avant même de l'avoir lu.";
  }
  if (game.mode === 'memory'){
    return "Casque et gants sont les seuls équipements obligatoires — mais un jean et des baskets ne protègent rien du tout. En deux-roues, l'équipement complet n'est pas une option, c'est ce qui sépare une chute d'un accident grave.";
  }
  if (game.mode === 'distance'){
    return "Une voiture ne s'arrête jamais là où on le croit. Sur sol mouillé, comptez la moitié de distance en plus — et ralentissez avant, pas pendant.";
  }
  if (!game.mistakes.length){
    return "Vous connaissez les règles. Le vrai enjeu, c'est de les tenir aussi quand on est pressé, fatigué ou en retard.";
  }
  return "Si vous ne retenez qu'une chose : la plupart des accidents graves viennent d'un geste qui paraissait sans risque sur le moment.";
}

// Petite animation de confettis, jouée quand le score est suffisamment bon.
function launchConfetti(){
  const colors = ['#FFC93C', '#2EC4B6', '#E63946', '#F5F1E6'];
  for (let i = 0; i < 40; i++){
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; // position horizontale aléatoire
    c.style.width = c.style.height = (6 + Math.random() * 8) + 'px'; // taille aléatoire entre 6 et 14px
    c.style.background = colors[Math.floor(Math.random() * colors.length)]; // couleur aléatoire parmi la charte
    c.style.animationDuration = (2 + Math.random() * 2) + 's'; // vitesse de chute légèrement aléatoire, pour un effet naturel
    document.body.appendChild(c);
    // On retire chaque confetti du DOM après son animation (4,5 s), pour ne
    // pas accumuler des centaines d'éléments invisibles au fil des parties.
    setTimeout(() => c.remove(), 4500);
  }
}

/* ============ ACCROCHES DE L'ÉCRAN D'ACCUEIL ============ */

// Messages qui défilent sous le titre, pour donner envie de jouer.
const TEASERS = [
  "Un jeu à faire à plusieurs : mettez-vous d'accord avant de valider.",
  "À 130 km/h sous la pluie, savez-vous où s'arrête vraiment une voiture ?",
  "Casque, gants, blouson : lesquels sont réellement obligatoires à moto ?",
  "Six situations au volant. Sauriez-vous réagir comme il faut ?",
  "Trois jeux, deux minutes. De quoi se tester entre amis ou en famille."
];
let teaserIndex = 0;
const teaserEl = document.getElementById('attractTease');

// setInterval au niveau du fichier (pas dans une classe) : ce petit
// mécanisme ne concerne que l'écran d'accueil et ne justifie pas une classe
// à lui tout seul — parfois, une simple fonction suffit.
setInterval(() => {
  if (screenManager.activeName() !== 'attract') return; // inutile de changer le texte si l'accueil n'est pas affiché
  teaserIndex = (teaserIndex + 1) % TEASERS.length; // boucle : revient à 0 après le dernier message
  teaserEl.style.opacity = '0'; // fondu de sortie...
  setTimeout(() => {
    teaserEl.textContent = TEASERS[teaserIndex]; // ...changement de texte une fois invisible...
    teaserEl.style.opacity = '1'; // ...puis fondu d'entrée du nouveau message
  }, 400);
}, 5000);

/* ============ PANNEAU ANIMATEUR ============ */

// Construit les boutons d'un réglage (ex. "4 / 6 / 8 / 10" questions), en
// marquant celui qui correspond à la valeur actuellement choisie dans
// SETTINGS. Réutilisée pour les deux réglages du panneau (nombre de
// questions, durée du minuteur) grâce à ses paramètres génériques.
function buildOptions(containerId, values, labels, key){
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';
  values.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'opt' + (SETTINGS[key] === v ? ' active' : '');
    b.textContent = labels[i];
    b.addEventListener('click', () => {
      SETTINGS[key] = v; // modifie directement l'objet SETTINGS partagé par tous les jeux
      buildOptions(containerId, values, labels, key); // redessine les boutons pour mettre à jour lequel est "actif"
    });
    wrap.appendChild(b);
  });
}

// Affiche les compteurs de parties (bilan de la borne) dans le panneau.
function renderStats(){
  const s = statsStore.snapshot();
  const total = (s.quiz || 0) + (s.distance || 0) + (s.memory || 0) + (s.signs || 0);
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statQuiz').textContent = s.quiz || 0;
  document.getElementById('statDist').textContent = s.distance || 0;
  document.getElementById('statMem').textContent = s.memory || 0;
  document.getElementById('statSign').textContent = s.signs || 0;
  document.getElementById('statSince').textContent = s.since || '—';
}

function openPanel(){
  buildOptions('optCount', [4, 6, 8, 10], ['4', '6', '8', '10'], 'count');
  buildOptions('optTimer', [30, 45, 60, 0], ['30 s', '45 s', '60 s', 'Sans minuteur'], 'timer');
  renderStats();
  panelBackdrop.classList.add('show');
}

document.getElementById('resetStatsBtn').addEventListener('click', () => {
  statsStore.reset();
  renderStats(); // rafraîchit l'affichage tout de suite après la remise à zéro
});
document.getElementById('panelCloseBtn').addEventListener('click', () => panelBackdrop.classList.remove('show'));

/* Appui long (1,5 s) sur le coin bas-gauche */
const hotcorner = document.getElementById('hotcorner'); // petite zone invisible dans le coin, voir css/style.css
let holdTimer = null;
hotcorner.addEventListener('pointerdown', () => {
  holdTimer = setTimeout(openPanel, 1500); // n'ouvre le panneau que si le doigt reste 1,5 s
});
// Si le doigt est relâché ou quitte la zone avant 1,5 s, on annule
// l'ouverture programmée : un simple tap rapide n'ouvre jamais le panneau.
['pointerup', 'pointerleave', 'pointercancel'].forEach(e => hotcorner.addEventListener(e, () => clearTimeout(holdTimer)));

/* Raccourcis clavier */
document.addEventListener('keydown', ev => {
  if (ev.key === 'a' || ev.key === 'A') openPanel();
  if (ev.key === 'Escape'){
    panelBackdrop.classList.remove('show');
    if (quitBackdrop.classList.contains('show')) closeQuitConfirm();
  }
});

// Dernière ligne du fichier : active le durcissement mode kiosque (voir
// js/core/KioskGuard.js) une fois que tout le reste est en place.
KioskGuard.install();
