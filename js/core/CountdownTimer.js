/* ============ MINUTEUR OBSERVABLE (pattern Observer) ============ */
/* start()/stop() + callbacks onTick/onExpire. Un seul minuteur générique,
   réutilisé par le minuteur de question (QuizGame) et par le système de
   veille (IdleWatcher), au lieu de deux setInterval dupliqués.

   "Observer" est un pattern où un objet (ici le minuteur) prévient d'autres
   objets quand quelque chose se passe, sans avoir besoin de les connaître à
   l'avance. Concrètement ici : au lieu que CountdownTimer sache quoi faire
   à chaque seconde ou à l'expiration (ce serait son rôle de connaître
   QuizGame ou IdleWatcher, ce qui le rendrait rigide), on lui *passe* des
   fonctions (`onTick`, `onExpire`) à appeler au bon moment. Ces fonctions
   sont les "observateurs" : CountdownTimer se contente de les notifier. */
class CountdownTimer {
  constructor(){
    // setInterval() renvoie un identifiant numérique qu'il faut garder de
    // côté pour pouvoir l'arrêter plus tard avec clearInterval(id).
    this._interval = null;
  }

  // Démarre un décompte de `seconds` secondes.
  // Le deuxième paramètre est un objet avec deux fonctions optionnelles :
  // `{ onTick, onExpire } = {}` fait deux choses à la fois :
  //   1. "déstructuration" : au lieu de recevoir un objet `options` puis
  //      écrire `options.onTick`, on extrait directement `onTick` et
  //      `onExpire` comme des variables séparées.
  //   2. `= {}` est une valeur par défaut : si on appelle start(5) sans
  //      rien fournir en 2e argument, ça évite une erreur en simulant un
  //      objet vide (donc onTick/onExpire valent simplement undefined).
  start(seconds, { onTick, onExpire } = {}){
    this.stop(); // par sécurité, on annule un éventuel décompte déjà en cours

    let timeLeft = seconds;
    // `if (onTick) onTick(timeLeft)` : on n'appelle la fonction que si elle
    // a été fournie (sinon `undefined(...)` ferait planter le script).
    if (onTick) onTick(timeLeft); // notifie tout de suite la valeur de départ

    // setInterval(fn, 1000) exécute `fn` toutes les 1000 ms (1 seconde).
    // La fonction fléchée ci-dessous est une "closure" (fermeture) : même
    // exécutée bien plus tard par le navigateur, elle continue d'avoir
    // accès aux variables `timeLeft`, `onTick`, `onExpire` de cet appel
    // précis à start() — chaque minuteur garde ses propres variables.
    this._interval = setInterval(() => {
      timeLeft--;
      if (onTick) onTick(timeLeft);
      if (timeLeft <= 0){
        this.stop();
        if (onExpire) onExpire();
      }
    }, 1000);
  }

  stop(){
    clearInterval(this._interval); // ne fait rien si this._interval est déjà null : sans risque
    this._interval = null;
  }
}
