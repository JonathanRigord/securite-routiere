/* ============ CRÉATION DES JEUX (pattern Factory Method) ============ */
/* Remplace les chaînes de ternaires "(which === 'quiz') ? X : (which ===
   'distance') ? Y : ..." qui étaient répétées à plusieurs endroits de
   l'ancien app.js. get() mémorise l'instance créée : chaque écran de jeu
   n'existe qu'une fois dans le DOM, donc chaque classe de jeu n'a besoin
   d'exister qu'une fois (ses écouteurs sur les boutons/la route ne doivent
   être posés qu'une seule fois, pas à chaque partie). */
class GameFactory {
  constructor(deps){
    this.deps = deps;
    this._instances = {};
  }

  get(mode){
    if (!this._instances[mode]) this._instances[mode] = this._create(mode);
    return this._instances[mode];
  }

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
