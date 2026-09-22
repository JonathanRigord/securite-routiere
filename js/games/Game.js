/* ============ CYCLE COMMUN D'UN JEU (pattern Template Method) ============ */
/* Toutes les parties suivent le même cycle, déjà décrit dans le CLAUDE.md :
   start() → renderRound() (implémenté par chaque sous-classe) → advance() →
   finish(). L'état d'une partie (deck, position, score, historique), avant
   dispersé en variables globales, vit ici en propriétés d'instance.

   "Template Method" est un pattern où une classe de base écrit le
   SQUELETTE d'un algorithme (ici : start() prépare la partie puis appelle
   renderRound() ; advance() passe à la manche suivante ou termine), mais
   laisse certaines étapes à définir par chaque sous-classe. Ici,
   renderRound() est volontairement vide de logique (elle lève une erreur
   si on oublie de la redéfinir) : c'est à QuizGame, DistanceGame et
   SignsGame de dire concrètement "à quoi ressemble une manche".

   Le jeu de mémoire (MemoryGame) ne suit pas ce schéma "question par
   question" — c'est un jeu de paires — et surcharge donc start() en entier :
   c'est un usage normal de Template Method, la classe de base pose le cas
   général, une sous-classe peut remplacer davantage quand sa forme diffère
   vraiment. */
class Game {
  // Toutes les sous-classes (QuizGame, DistanceGame, ...) appelleront
  // `super(deps)` dans leur propre constructeur, ce qui exécute CE
  // constructeur-ci avec les mêmes arguments. `deps` (dépendances) contient
  // les objets partagés dont un jeu a besoin pour fonctionner, sans avoir à
  // aller les chercher lui-même dans des variables globales : c'est de
  // l'injection de dépendances, ça rend chaque classe plus facile à
  // comprendre isolément (tout ce dont elle a besoin est listé ici) et à
  // tester (on peut lui fournir de fausses dépendances).
  constructor({ screenManager, statsStore, settings, onFinish }){
    this.screenManager = screenManager;
    this.statsStore = statsStore;
    this.settings = settings;
    this.onFinish = onFinish; // fonction appelée par finish(), voir plus bas

    this.mode = null;   // renseigné par chaque sous-classe (ex. 'quiz')
    this.pool = [];      // banque de questions/situations à piocher

    this.deck = [];       // les questions tirées pour CETTE partie (sous-ensemble de pool)
    this.current = 0;     // index de la manche en cours dans deck
    this.score = 0;
    this.answersLog = []; // vrai/faux par manche, pour les petits points de progression
    this.mistakes = [];   // détail des erreurs, pour le récap de fin de partie
  }

  // Pioche `settings.count` éléments au hasard dans `pool`. Utilisée par
  // start() ci-dessous ; MemoryGame ne s'en sert pas car il tire des PAIRES
  // et non une liste de questions (voir MemoryGame.start()).
  buildDeck(){
    return Game.shuffle(this.pool).slice(0, Math.min(this.settings.count, this.pool.length));
  }

  // Démarre une nouvelle partie : réinitialise tout l'état, puis affiche la
  // première manche. C'est la méthode appelée depuis app.js quand on
  // clique sur un bouton de jeu.
  start(){
    this.deck = this.buildDeck();
    this.current = 0;
    this.score = 0;
    this.answersLog = [];
    this.mistakes = [];
    this.statsStore.record(this.mode); // +1 au compteur animateur pour ce mode
    this.screenManager.go(this.mode);  // affiche l'écran correspondant
    this.renderRound(); // délégué à la sous-classe (polymorphisme, voir plus bas)
  }

  // Passe à la manche suivante, ou termine la partie si on est arrivé au
  // bout du deck. `this.renderRound()` ne sait PAS, dans ce fichier,
  // laquelle des 3 versions (Quiz/Distance/Signs) va s'exécuter : c'est du
  // "polymorphisme" — au moment de l'exécution, JavaScript regarde la
  // classe RÉELLE de l'instance (`this`) pour choisir la bonne méthode.
  advance(){
    this.current++;
    if (this.current < this.deck.length) this.renderRound();
    else this.finish();
  }

  /* Bouton d'action à deux temps (sélectionner puis valider), partagé par
     Quiz et Distance : un premier appui valide la manche, le suivant avance.
     Signs n'a pas cette étape de validation séparée et n'utilise pas ce hook. */
  onNext(){
    if (!this.answered) this.validate();
    else this.advance();
  }

  // Fin de partie : arrête un éventuel minuteur, puis prévient
  // l'extérieur (app.js) via le callback onFinish reçu au constructeur.
  // C'est ce callback qui affiche l'écran de résultat.
  finish(){
    this.stopTimer();
    if (this.onFinish) this.onFinish(this); // se transmet lui-même : l'écran de résultat lit son score, ses erreurs, etc.
  }

  /* Surchargé par les jeux qui ont un minuteur (QuizGame). No-op par défaut :
     appeler stopTimer() sur un jeu qui n'en a pas ne doit rien faire. */
  stopTimer(){}

  // Cette méthode n'est jamais censée s'exécuter telle quelle : chaque
  // sous-classe DOIT la redéfinir (c'est ce qu'on appelle une "méthode
  // abstraite"). Si une sous-classe oublie de le faire, l'erreur explicite
  // ci-dessous est bien plus facile à diagnostiquer qu'un bug silencieux.
  renderRound(){
    throw new Error('renderRound() doit être implémentée par ' + this.constructor.name);
  }

  /* Libellé du bouton d'action, partagé par Quiz, Distance et Signs (dernière
     manche → "Voir le résultat", sinon → "Suivant"). */
  nextButtonLabel(){
    return (this.current === this.deck.length - 1) ? 'Voir le résultat' : 'Suivant';
  }

  /* Petits points de progression partagés par Quiz, Distance et Signs. */
  renderDots(wrapId){
    const wrap = document.getElementById(wrapId);
    wrap.innerHTML = ''; // on reconstruit les points à zéro à chaque manche
    this.deck.forEach((_, i) => {
      // Le premier paramètre de forEach (ici ignoré, nommé "_") est la
      // valeur de l'élément ; seul l'index `i` nous intéresse pour savoir
      // où on en est dans la partie.
      const d = document.createElement('div');
      let cls = 'dot';
      if (i < this.current) cls += this.answersLog[i] ? ' done' : ' wrong';
      if (i === this.current) cls += ' current';
      d.className = cls;
      wrap.appendChild(d);
    });
  }

  // `static` : cette méthode appartient à la classe Game elle-même, pas à
  // une instance de jeu. On l'appelle donc `Game.shuffle(...)`, pas
  // `this.shuffle(...)` — c'est une simple fonction utilitaire, partagée
  // par toutes les sous-classes, qui n'a besoin d'aucune donnée de
  // l'instance (`this`) pour fonctionner.
  static shuffle(arr){
    const a = arr.slice(); // copie du tableau : on ne modifie jamais l'original (ex. QUESTION_POOL)
    // Algorithme de Fisher-Yates : parcourt le tableau de la fin vers le
    // début, et échange chaque élément avec un autre choisi au hasard
    // parmi les positions restantes. C'est la méthode standard pour
    // mélanger un tableau de façon uniforme (chaque ordre a la même
    // probabilité).
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]; // échange a[i] et a[j] en une ligne (déstructuration de tableau)
    }
    return a;
  }

  /* Bloc "Ce que disent les chiffres", partagé par Quiz et Distance. */
  static fillStat(el, text){
    el.innerHTML = '';
    const label = document.createElement('strong');
    label.textContent = 'Ce que disent les chiffres';
    const span = document.createElement('span');
    span.textContent = text;
    el.appendChild(label);
    el.appendChild(span);
    el.classList.add('show');
  }
}
