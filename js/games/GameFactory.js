/* ============ CRÉATION DES JEUX (pattern Factory Method) ============ */
/* Remplace les chaînes de ternaires "(which === 'quiz') ? X : (which ===
   'distance') ? Y : ..." qui étaient répétées à plusieurs endroits de
   l'ancien app.js. get() mémorise l'instance créée : chaque écran de jeu
   n'existe qu'une fois dans le DOM, donc chaque classe de jeu n'a besoin
   d'exister qu'une fois (ses écouteurs sur les boutons/la route ne doivent
   être posés qu'une seule fois, pas à chaque partie).

   "Factory Method" est un pattern qui centralise en un seul endroit la
   logique "quel type d'objet créer selon quel critère". Sans lui, chaque
   endroit du code qui a besoin d'un jeu devrait connaître la liste des 4
   classes et savoir laquelle correspond à quel mode — ici, seul
   GameFactory le sait, le reste du code se contente de demander
   `gameFactory.get('quiz')` sans se soucier des détails. */
class GameFactory {
  // `deps` regroupe les dépendances communes à tous les jeux
  // (screenManager, statsStore, settings, onFinish) — voir Game.js. On les
  // garde ici pour les redonner à chaque `new XxxGame(this.deps)`.
  constructor(deps){
    this.deps = deps;
    this._instances = {}; // cache : { quiz: <instance QuizGame>, signs: <instance SignsGame>, ... }
  }

  // Renvoie l'instance du jeu demandé, en la créant la première fois
  // seulement. `!this._instances[mode]` est vrai tant qu'aucune instance
  // n'a encore été mise en cache pour ce mode (clé absente de l'objet).
  // Ce mécanisme "créer au premier appel, puis toujours réutiliser" est
  // parfois appelé "lazy singleton" (singleton = une seule instance ;
  // "lazy"/paresseux = créée seulement quand on en a vraiment besoin).
  get(mode){
    if (!this._instances[mode]) this._instances[mode] = this._create(mode);
    return this._instances[mode];
  }

  // La vraie fabrication : un `switch` classique qui associe chaque nom de
  // mode à sa classe. C'est le SEUL endroit du projet qui a besoin de
  // connaître cette correspondance.
  _create(mode){
    switch (mode){
      case 'quiz': return new QuizGame(this.deps);
      case 'distance': return new DistanceGame(this.deps);
      case 'memory': return new MemoryGame(this.deps);
      case 'signs': return new SignsGame(this.deps);
      default: throw new Error('Mode de jeu inconnu : ' + mode);
    }
  }
}
