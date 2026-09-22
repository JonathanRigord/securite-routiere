/* ============ ÉTAT ET SERVICES PARTAGÉS ============ */
const SETTINGS = { count:6, timer:45 };

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

const statsStore = new StatsStore('toutcan_stats_v1');
const resultAutoReturn = new CountdownTimer();

const quitBackdrop = document.getElementById('quitBackdrop');
const idleBackdrop = document.getElementById('idleBackdrop');
const panelBackdrop = document.getElementById('panelBackdrop');

const GAME_SCREEN_NAMES = ['quiz', 'distance', 'memory', 'signs'];

let activeGame = null;

/* ============ NAVIGATION ============ */
function stopActiveGameTimer(){
  if (activeGame) activeGame.stopTimer();
}

function goToAttract(){
  stopActiveGameTimer();
  resultAutoReturn.stop();
  idleWatcher.clear();
  screenManager.go('attract');
}

function goToMenu(){
  stopActiveGameTimer();
  resultAutoReturn.stop();
  idleWatcher.clear();
  screenManager.go('menu');
}

document.getElementById('startBtn').addEventListener('click', goToMenu);
document.getElementById('menuBackBtn').addEventListener('click', goToAttract);
document.getElementById('gameQuizBtn').addEventListener('click', () => startGame('quiz'));
document.getElementById('gameDistBtn').addEventListener('click', () => startGame('distance'));
document.getElementById('gameMemBtn').addEventListener('click', () => startGame('memory'));
document.getElementById('gameSignBtn').addEventListener('click', () => startGame('signs'));
document.getElementById('homeBtn').addEventListener('click', goToAttract);
document.getElementById('replayBtn').addEventListener('click', () => startGame(activeGame.mode));
document.getElementById('otherGameBtn').addEventListener('click', goToMenu);

/* Quitter : pop-up de confirmation, jamais un simple double appui. */
function openQuitConfirm(){
  stopActiveGameTimer();
  quitBackdrop.classList.add('show');
}
function closeQuitConfirm(){
  quitBackdrop.classList.remove('show');
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
const idleWatcher = new IdleWatcher({
  delaySeconds: 150, // 2 min 30 sans contact avant l'avertissement
  graceSeconds: 15,
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
  document.addEventListener(evt, () => {
    if (idleWatcher.isWarning()) return;
    idleWatcher.arm();
  }, true);
});

/* ============ LANCEMENT D'UNE PARTIE ============ */
const gameFactory = new GameFactory({
  screenManager,
  statsStore,
  settings: SETTINGS,
  onFinish: (game) => showResult(game)
});

function startGame(which){
  activeGame = gameFactory.get(which);
  activeGame.start();
  idleWatcher.arm();
}

/* ============ ÉCRAN DE RÉSULTAT ============ */
function showResult(game){
  idleWatcher.clear();
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

  resultAutoReturn.start(90, { onExpire: () => goToAttract() });
}

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

function launchConfetti(){
  const colors = ['#FFC93C', '#2EC4B6', '#E63946', '#F5F1E6'];
  for (let i = 0; i < 40; i++){
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.width = c.style.height = (6 + Math.random() * 8) + 'px';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDuration = (2 + Math.random() * 2) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }
}

/* ============ ACCROCHES DE L'ÉCRAN D'ACCUEIL ============ */
const TEASERS = [
  "Un jeu à faire à plusieurs : mettez-vous d'accord avant de valider.",
  "À 130 km/h sous la pluie, savez-vous où s'arrête vraiment une voiture ?",
  "Casque, gants, blouson : lesquels sont réellement obligatoires à moto ?",
  "Six situations au volant. Sauriez-vous réagir comme il faut ?",
  "Trois jeux, deux minutes. De quoi se tester entre amis ou en famille."
];
let teaserIndex = 0;
const teaserEl = document.getElementById('attractTease');

setInterval(() => {
  if (screenManager.activeName() !== 'attract') return;
  teaserIndex = (teaserIndex + 1) % TEASERS.length;
  teaserEl.style.opacity = '0';
  setTimeout(() => {
    teaserEl.textContent = TEASERS[teaserIndex];
    teaserEl.style.opacity = '1';
  }, 400);
}, 5000);

/* ============ PANNEAU ANIMATEUR ============ */
function buildOptions(containerId, values, labels, key){
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';
  values.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'opt' + (SETTINGS[key] === v ? ' active' : '');
    b.textContent = labels[i];
    b.addEventListener('click', () => {
      SETTINGS[key] = v;
      buildOptions(containerId, values, labels, key);
    });
    wrap.appendChild(b);
  });
}

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
  renderStats();
});
document.getElementById('panelCloseBtn').addEventListener('click', () => panelBackdrop.classList.remove('show'));

/* Appui long (1,5 s) sur le coin bas-gauche */
const hotcorner = document.getElementById('hotcorner');
let holdTimer = null;
hotcorner.addEventListener('pointerdown', () => {
  holdTimer = setTimeout(openPanel, 1500);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(e => hotcorner.addEventListener(e, () => clearTimeout(holdTimer)));

/* Raccourcis clavier */
document.addEventListener('keydown', ev => {
  if (ev.key === 'a' || ev.key === 'A') openPanel();
  if (ev.key === 'Escape'){
    panelBackdrop.classList.remove('show');
    if (quitBackdrop.classList.contains('show')) closeQuitConfirm();
  }
});

KioskGuard.install();
