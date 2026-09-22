/* ============ CYCLE COMMUN D'UN JEU (pattern Template Method) ============ */
/* Toutes les parties suivent le même cycle, déjà décrit dans le CLAUDE.md :
   start() → renderRound() (implémenté par chaque sous-classe) → advance() →
   finish(). L'état d'une partie (deck, position, score, historique), avant
   dispersé en variables globales, vit ici en propriétés d'instance.

   Le jeu de mémoire (MemoryGame) ne suit pas ce schéma "question par
   question" — c'est un jeu de paires — et surcharge donc start() en entier :
   c'est un usage normal de Template Method, la classe de base pose le cas
   général, une sous-classe peut remplacer davantage quand sa forme diffère
   vraiment. */
class Game {
  constructor({ screenManager, statsStore, settings, onFinish }){
    this.screenManager = screenManager;
    this.statsStore = statsStore;
    this.settings = settings;
    this.onFinish = onFinish;

    this.mode = null;   // renseigné par chaque sous-classe
    this.pool = [];      // banque de questions/situations à piocher

    this.deck = [];
    this.current = 0;
    this.score = 0;
    this.answersLog = [];
    this.mistakes = [];
  }

  buildDeck(){
    return Game.shuffle(this.pool).slice(0, Math.min(this.settings.count, this.pool.length));
  }

  start(){
    this.deck = this.buildDeck();
    this.current = 0;
    this.score = 0;
    this.answersLog = [];
    this.mistakes = [];
    this.statsStore.record(this.mode);
    this.screenManager.go(this.mode);
    this.renderRound();
  }

  advance(){
    this.current++;
    if (this.current < this.deck.length) this.renderRound();
    else this.finish();
  }

  finish(){
    this.stopTimer();
    if (this.onFinish) this.onFinish(this);
  }

  /* Surchargé par les jeux qui ont un minuteur (QuizGame). No-op par défaut :
     appeler stopTimer() sur un jeu qui n'en a pas ne doit rien faire. */
  stopTimer(){}

  renderRound(){
    throw new Error('renderRound() doit être implémentée par ' + this.constructor.name);
  }

  /* Petits points de progression partagés par Quiz, Distance et Signs. */
  renderDots(wrapId){
    const wrap = document.getElementById(wrapId);
    wrap.innerHTML = '';
    this.deck.forEach((_, i) => {
      const d = document.createElement('div');
      let cls = 'dot';
      if (i < this.current) cls += this.answersLog[i] ? ' done' : ' wrong';
      if (i === this.current) cls += ' current';
      d.className = cls;
      wrap.appendChild(d);
    });
  }

  static shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
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
