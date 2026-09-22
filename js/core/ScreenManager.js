/* ============ NAVIGATION ENTRE ÉCRANS (pattern State) ============ */
/* L'écran actif est traité comme un état explicite plutôt qu'implicite dans
   le DOM : go() est le seul endroit qui change quel écran porte la classe
   "active", ce qui évite d'avoir à relire le DOM ailleurs pour savoir "où on
   en est" (ex. inGame() dans l'ancien code).

   "State" est un pattern qui dit : au lieu de laisser l'état d'une appli
   (ici "quel écran est affiché") se déduire un peu partout en inspectant le
   DOM ou des booléens épars, on le centralise dans un seul objet qui sait
   *l'état actuel* et *comment en changer*. Toute la logique de navigation
   passe par cet objet, jamais directement par du classList.add/remove
   dispersé dans le reste du code. */
class ScreenManager {
  // `screens` est un objet simple qui associe un nom à un élément du DOM,
  // ex. { attract: <section id="attract">, menu: <section id="menu">, ... }.
  // Ce n'est pas un tableau car on veut pouvoir aller chercher un écran par
  // son nom (`this.screens['menu']`) plutôt que par sa position.
  constructor(screens){
    this.screens = screens;
    this._active = null; // nom de l'écran actuellement affiché (ou null au tout début)
  }

  // Change l'écran affiché : retire la classe CSS "active" de tous les
  // écrans, puis l'ajoute uniquement à celui demandé.
  go(name){
    // Object.values(this.screens) transforme l'objet { attract: el, ... }
    // en simple tableau [el, el, ...], pour pouvoir utiliser .forEach().
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    this.screens[name].classList.add('active');
    this._active = name;
  }

  activeName(){
    return this._active;
  }

  // Donne accès à l'élément DOM d'un écran par son nom, pour les rares cas
  // où on a besoin de le manipuler directement (ex. remettre le défilement
  // en haut avec `.scrollTop = 0`).
  element(name){
    return this.screens[name];
  }
}
