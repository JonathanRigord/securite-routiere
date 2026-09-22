/* ============ JEU 1 : QCM (« Le bon réflexe ») ============ */
/* `extends Game` : QuizGame HÉRITE de tout ce que Game.js sait déjà faire
   (start, advance, finish, renderDots, ...) et n'a besoin d'écrire QUE ce
   qui lui est propre : comment afficher une question (renderRound), gérer
   la sélection d'une réponse, faire tourner son minuteur, et vérifier la
   réponse (validate). C'est le principe même de l'héritage : éviter de
   réécrire la logique commune à chaque jeu. */
class QuizGame extends Game {
  constructor(deps){
    // `super(deps)` DOIT être appelé avant d'utiliser `this` : c'est lui
    // qui exécute le constructeur de Game (la classe parente) et met en
    // place screenManager/statsStore/settings/onFinish/deck/... sur cette
    // instance. Ensuite seulement, on peut ajouter ce qui est spécifique
    // au quiz.
    super(deps);
    this.mode = 'quiz';       // lu par Game.start()/finish() pour savoir quel écran/compteur utiliser
    this.pool = QUESTION_POOL; // banque de questions (js/data/questions.js), piochée par Game.buildDeck()
    this.selectedIndex = null; // quelle réponse le joueur a sélectionnée avant de valider
    this.answered = false;     // true une fois la manche validée (empêche de revalider)
    this.timer = new CountdownTimer(); // minuteur propre à CE jeu (composition, comme IdleWatcher)

    // Le bouton "Valider"/"Suivant" est un élément FIXE de l'écran (il
    // n'est jamais recréé entre deux manches, contrairement aux boutons de
    // réponse). Son écouteur n'a donc besoin d'être posé qu'une seule fois,
    // ici dans le constructeur — pas à chaque renderRound().
    // `() => this.onNext()` (fonction fléchée) est important : elle capture
    // le `this` de cette instance de QuizGame. Un `addEventListener('click',
    // this.onNext)` sans la flèche aurait perdu ce `this` au moment de
    // l'exécution du clic (piège classique en JavaScript).
    document.getElementById('nextBtn').addEventListener('click', () => this.onNext());
  }

  // Affiche la manche en cours (this.current) à l'écran. Appelée par
  // Game.start() au lancement, puis par Game.advance() à chaque manche
  // suivante — QuizGame n'a jamais besoin d'appeler renderRound() lui-même.
  renderRound(){
    this.renderDots('progress'); // hérité de Game.js
    this.selectedIndex = null;
    this.answered = false;
    document.getElementById('qCounter').textContent = 'Question ' + (this.current + 1) + ' / ' + this.deck.length;

    const item = this.deck[this.current]; // la question à afficher, ex. { q, a, correct, exp, stat }
    document.getElementById('questionText').textContent = item.q;

    const answersEl = document.getElementById('answers');
    answersEl.innerHTML = ''; // on repart d'un conteneur vide à chaque manche
    // On mélange les réponses (pour que la bonne ne soit pas toujours au
    // même endroit), tout en gardant la trace de leur index d'origine `i`
    // (celui qui correspond à `item.correct`), grâce à `.map()` qui
    // transforme chaque texte en petit objet { text, i }.
    const order = Game.shuffle(item.a.map((text, i) => ({ text, i })));
    order.forEach(({ text, i }) => {
      const btn = document.createElement('button');
      btn.className = 'answer';
      btn.textContent = text;
      btn.dataset.index = i; // mémorise l'index d'origine directement sur l'élément HTML (attribut data-index)
      btn.addEventListener('click', () => this.select(i, btn));
      answersEl.appendChild(btn);
    });

    document.getElementById('explanation').classList.remove('show');
    document.getElementById('statBox').classList.remove('show');
    document.getElementById('validateHint').style.visibility = 'visible';

    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = 'Valider';
    nextBtn.disabled = true; // pas de réponse sélectionnée pour l'instant : rien à valider

    this.screenManager.element('quiz').scrollTop = 0;
    this.startCountdown();
  }

  // Appelée à chaque clic sur une réponse (deux temps : sélectionner, puis
  // valider avec le bouton — règle du CLAUDE.md).
  select(i, btn){
    if (this.answered) return; // on ne peut plus changer d'avis après validation
    document.querySelectorAll('#answers .answer').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedIndex = i;
    document.getElementById('nextBtn').disabled = false;
    document.getElementById('validateHint').style.visibility = 'hidden';
  }

  // Démarre (ou redémarre) le minuteur de la question, en s'appuyant sur
  // CountdownTimer (voir js/core/CountdownTimer.js) plutôt que de gérer un
  // setInterval directement ici.
  startCountdown(){
    const badge = document.getElementById('timerText');
    this.timer.stop(); // annule un éventuel décompte précédent avant d'en démarrer un nouveau
    if (!this.settings.timer){ badge.classList.add('hidden'); return; } // "Sans minuteur" choisi dans le panneau animateur
    badge.classList.remove('hidden', 'low', 'done');
    this.timer.start(this.settings.timer, {
      onTick: (left) => {
        badge.textContent = left;
        badge.classList.toggle('low', left > 0 && left <= 8); // rouge clignotant dans les 8 dernières secondes
      },
      onExpire: () => this.validate(true) // true = "temps écoulé", affiché dans l'explication
    });
  }

  // Redéfinit (override) le stopTimer() vide de Game.js : ICI, il y a
  // vraiment un minuteur à arrêter (ex. quand on quitte la partie en
  // cours). C'est grâce à ce genre de redéfinition que Game.finish() peut
  // appeler `this.stopTimer()` sans savoir si le jeu concerné a un
  // minuteur ou non — encore du polymorphisme.
  stopTimer(){
    this.timer.stop();
  }

  // Vérifie la réponse sélectionnée, met à jour le score et l'affichage.
  // `timedOut` est true quand validate() est appelé par l'expiration du
  // minuteur plutôt que par un clic sur "Valider".
  validate(timedOut){
    if (this.answered) return; // ne jamais valider deux fois la même manche
    this.answered = true;
    this.stopTimer();

    const item = this.deck[this.current];
    const btns = document.querySelectorAll('#answers .answer');
    btns.forEach(b => b.style.pointerEvents = 'none'); // désactive les clics une fois la manche jouée

    // Retrouve les boutons DOM correspondant à la bonne réponse et à celle
    // choisie, en comparant leur attribut data-index (converti en nombre
    // avec Number(), car les attributs HTML sont toujours des chaînes).
    const correctBtn = Array.from(btns).find(b => Number(b.dataset.index) === item.correct);
    const chosenBtn = Array.from(btns).find(b => Number(b.dataset.index) === this.selectedIndex);

    const isRight = this.selectedIndex === item.correct;
    if (isRight){
      correctBtn.classList.add('correct');
      this.score++;
      this.answersLog[this.current] = true;
    } else {
      if (chosenBtn) chosenBtn.classList.add('wrong'); // pas de bouton "choisi" si le temps est écoulé sans sélection
      correctBtn.classList.add('correct'); // la bonne réponse reste toujours mise en évidence
      this.answersLog[this.current] = false;
      this.mistakes.push({ q:item.q, right:item.a[item.correct], exp:item.exp }); // pour le récap de fin de partie
    }

    const badge = document.getElementById('timerText');
    badge.classList.remove('low');
    badge.classList.add('done');
    badge.textContent = '—';

    const expEl = document.getElementById('explanation');
    expEl.textContent = (timedOut ? 'Temps écoulé — ' : '') + item.exp;
    expEl.classList.add('show');

    Game.fillStat(document.getElementById('statBox'), item.stat); // méthode statique héritée, appelée via le nom de la classe

    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = false;
    nextBtn.textContent = this.nextButtonLabel(); // hérité de Game.js
    document.getElementById('validateHint').style.visibility = 'hidden';
  }
}
