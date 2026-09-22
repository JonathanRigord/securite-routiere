/* ============ VEILLE / INACTIVITÉ ============ */
/* Ne coupe jamais une délibération de groupe (règle du CLAUDE.md) : retour à
   l'accueil seulement après un long délai sans contact, précédé d'un
   avertissement chronométré pendant lequel on peut reprendre la main.
   S'appuie sur deux CountdownTimer (Observer) : un délai silencieux, puis un
   décompte visible. */
class IdleWatcher {
  constructor({ delaySeconds, graceSeconds, isActive, onWarn, onDismissWarn, onTick, onExpire }){
    this.delaySeconds = delaySeconds;
    this.graceSeconds = graceSeconds;
    this.isActive = isActive;
    this.onWarn = onWarn;
    this.onDismissWarn = onDismissWarn;
    this.onTick = onTick;
    this.onExpire = onExpire;
    this._delayTimer = new CountdownTimer();
    this._graceTimer = new CountdownTimer();
    this._warning = false;
  }

  /* (Re)démarre le délai silencieux. Appelé à chaque contact avec l'écran
     pendant une partie, et par le bouton "Nous sommes toujours là". */
  arm(){
    this._delayTimer.stop();
    this._dismissWarning();
    if (!this.isActive()) return;
    this._delayTimer.start(this.delaySeconds, { onExpire: () => this._warn() });
  }

  clear(){
    this._delayTimer.stop();
    this._dismissWarning();
  }

  isWarning(){
    return this._warning;
  }

  _warn(){
    if (!this.isActive()) return;
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

  _dismissWarning(){
    this._graceTimer.stop();
    if (this._warning){
      this._warning = false;
      if (this.onDismissWarn) this.onDismissWarn();
    }
  }
}
