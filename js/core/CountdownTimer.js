/* ============ MINUTEUR OBSERVABLE (pattern Observer) ============ */
/* start()/stop() + callbacks onTick/onExpire. Un seul minuteur générique,
   réutilisé par le minuteur de question (QuizGame) et par le système de
   veille (IdleWatcher), au lieu de deux setInterval dupliqués. */
class CountdownTimer {
  constructor(){
    this._interval = null;
  }

  start(seconds, { onTick, onExpire } = {}){
    this.stop();
    let timeLeft = seconds;
    if (onTick) onTick(timeLeft);
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
    clearInterval(this._interval);
    this._interval = null;
  }
}
