/* ============ NAVIGATION ENTRE ÉCRANS (pattern State) ============ */
/* L'écran actif est traité comme un état explicite plutôt qu'implicite dans
   le DOM : go() est le seul endroit qui change quel écran porte la classe
   "active", ce qui évite d'avoir à relire le DOM ailleurs pour savoir "où on
   en est" (ex. inGame() dans l'ancien code). */
class ScreenManager {
  constructor(screens){
    this.screens = screens; // { nomEcran: élémentDOM }
    this._active = null;
  }

  go(name){
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    this.screens[name].classList.add('active');
    this._active = name;
  }

  activeName(){
    return this._active;
  }

  element(name){
    return this.screens[name];
  }
}
