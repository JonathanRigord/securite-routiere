/* ============ VEILLE / INACTIVITÉ ============ */
/* Ne coupe jamais une délibération de groupe (règle du CLAUDE.md) : retour à
   l'accueil seulement après un long délai sans contact, précédé d'un
   avertissement chronométré pendant lequel on peut reprendre la main.
   S'appuie sur deux CountdownTimer (Observer) : un délai silencieux, puis un
   décompte visible.

   Cette classe est un bon exemple de "composition" : plutôt que d'hériter
   de CountdownTimer (`extends CountdownTimer`), IdleWatcher EN CONTIENT
   deux (`this._delayTimer`, `this._graceTimer`), comme des outils qu'elle
   utilise pour faire son travail. Règle générale utile à retenir : hériter
   quand une classe EST une version plus spécifique d'une autre (QuizGame
   EST un Game) ; composer quand une classe UTILISE une autre pour
   fonctionner (IdleWatcher UTILISE des minuteurs, mais n'EST pas un
   minuteur). */
class IdleWatcher {
  // Le constructeur reçoit un seul objet, qu'on déstructure directement
  // dans les paramètres (comme dans CountdownTimer.start()). Ça permet
  // d'appeler `new IdleWatcher({ delaySeconds: 150, graceSeconds: 15, ... })`
  // en nommant chaque valeur, plutôt que de devoir retenir un ordre précis
  // d'arguments positionnels (`new IdleWatcher(150, 15, fn1, fn2, ...)`,
  // bien plus facile à mélanger par erreur).
  constructor({ delaySeconds, graceSeconds, isActive, onWarn, onDismissWarn, onTick, onExpire }){
    this.delaySeconds = delaySeconds;
    this.graceSeconds = graceSeconds;
    this.isActive = isActive;       // fonction : renvoie true si on est en pleine partie
    this.onWarn = onWarn;           // fonction : afficher la pop-up d'avertissement
    this.onDismissWarn = onDismissWarn; // fonction : masquer la pop-up d'avertissement
    this.onTick = onTick;           // fonction : mettre à jour le décompte affiché
    this.onExpire = onExpire;       // fonction : que faire une fois le temps de grâce écoulé
    this._delayTimer = new CountdownTimer(); // le long silence avant l'avertissement
    this._graceTimer = new CountdownTimer(); // le compte à rebours visible de l'avertissement
    this._warning = false; // true pendant que la pop-up d'avertissement est affichée
  }

  /* (Re)démarre le délai silencieux. Appelé à chaque contact avec l'écran
     pendant une partie, et par le bouton "Nous sommes toujours là". */
  arm(){
    this._delayTimer.stop();
    this._dismissWarning();
    if (!this.isActive()) return; // on ne surveille l'inactivité que pendant une partie
    // On ne fournit pas de `onTick` ici : ce premier délai est silencieux,
    // rien n'est affiché à l'écran tant qu'il n'a pas expiré.
    this._delayTimer.start(this.delaySeconds, { onExpire: () => this._warn() });
  }

  clear(){
    this._delayTimer.stop();
    this._dismissWarning();
  }

  isWarning(){
    return this._warning;
  }

  // Appelée automatiquement quand le délai silencieux arrive à son terme :
  // affiche la pop-up et démarre le second minuteur, visible celui-ci.
  _warn(){
    if (!this.isActive()) return; // la partie a pu se terminer entre-temps
    this._warning = true;
    if (this.onWarn) this.onWarn();
    this._graceTimer.start(this.graceSeconds, {
      onTick: (left) => { if (this.onTick) this.onTick(left); },
      /* Ne pas repasser _warning à false ici : c'est _dismissWarning() (appelée
         en aval par onExpire, via clear()) qui doit le faire, sans quoi son
         garde `if (this._warning)` échoue et onDismissWarn n'est jamais
         appelé — la pop-up d'avertissement resterait affichée pour toujours. */
      onExpire: () => {
        if (this.onExpire) this.onExpire();
      }
    });
  }

  // Masque la pop-up d'avertissement SI elle était affichée. Le `if
  // (this._warning)` évite d'appeler onDismissWarn() inutilement quand il
  // n'y a rien à masquer (ex. clear() appelé alors qu'aucun avertissement
  // n'était en cours).
  _dismissWarning(){
    this._graceTimer.stop();
    if (this._warning){
      this._warning = false;
      if (this.onDismissWarn) this.onDismissWarn();
    }
  }
}
