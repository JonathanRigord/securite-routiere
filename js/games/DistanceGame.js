/* ============ JEU 2 : DISTANCE D'ARRÊT (« Où va-t-elle s'arrêter ? ») ============ */
class DistanceGame extends Game {
  constructor(deps){
    super(deps);
    this.mode = 'distance';
    this.pool = DISTANCE_POOL;
    this.answered = false;
    this.guessM = 0;
    this.maxM = 100;
    this.dragging = false;

    this.guessValueEl = document.getElementById('guessValue');
    this.guessMarker = document.getElementById('guessMarker');
    this.truthMarker = document.getElementById('truthMarker');
    this.roadStrip = document.getElementById('roadStrip');

    /* La route et les boutons +/- sont des éléments persistants de l'écran :
       leurs écouteurs sont posés une seule fois ici, pas à chaque manche. */
    this._wireDrag();
    this._wireAdjustButtons();
    document.getElementById('distNextBtn').addEventListener('click', () => this.onNext());
  }

  renderRound(){
    this.renderDots('dProgress');
    this.answered = false;
    document.getElementById('dCounter').textContent = 'Situation ' + (this.current + 1) + ' / ' + this.deck.length;

    const item = this.deck[this.current];
    document.getElementById('distContext').textContent = item.ctx;
    document.getElementById('scaleMax').textContent = item.max + ' m';

    this.maxM = item.max;
    this.guessM = Math.round(item.max * 0.25);
    this.roadStrip.classList.remove('locked');
    this._updateGuessDisplay();

    this.truthMarker.style.display = 'none';
    document.getElementById('distVerdict').classList.remove('show');
    document.getElementById('distExplanation').classList.remove('show');
    document.getElementById('distStat').classList.remove('show');
    document.getElementById('distHint').style.visibility = 'visible';

    const btn = document.getElementById('distNextBtn');
    btn.textContent = 'Valider';
    btn.disabled = false;
  }

  _updateGuessDisplay(){
    this.guessValueEl.textContent = this.guessM + ' m';
    document.getElementById('guessGrip').textContent = this.guessM + ' m';
    this.guessMarker.style.left = Math.min(97, Math.max(1, (this.guessM / this.maxM) * 100)) + '%';
  }

  _setGuess(v, animate){
    if (this.answered) return;
    this.guessMarker.classList.toggle('animate', !!animate);
    this.guessM = Math.max(1, Math.min(this.maxM, Math.round(v)));
    this._updateGuessDisplay();
  }

  _wireDrag(){
    const guessFromEvent = (ev) => {
      const rect = this.roadStrip.getBoundingClientRect();
      const ratio = (ev.clientX - rect.left) / rect.width;
      this._setGuess(ratio * this.maxM, false);
    };
    this.roadStrip.addEventListener('pointerdown', ev => {
      if (this.answered) return;
      this.dragging = true;
      this.roadStrip.setPointerCapture(ev.pointerId);
      guessFromEvent(ev);
    });
    this.roadStrip.addEventListener('pointermove', ev => {
      if (!this.dragging || this.answered) return;
      guessFromEvent(ev);
    });
    ['pointerup', 'pointercancel'].forEach(e =>
      this.roadStrip.addEventListener(e, () => { this.dragging = false; })
    );
  }

  /* Ajustement au mètre près, avec répétition puis accélération sur appui maintenu. */
  _wireAdjustButtons(){
    const wire = (btn, delta) => {
      let repeat = null, accel = null;
      const start = () => {
        this._setGuess(this.guessM + delta, true);
        repeat = setInterval(() => this._setGuess(this.guessM + delta, false), 260);
        accel = setTimeout(() => {
          clearInterval(repeat);
          repeat = setInterval(() => this._setGuess(this.guessM + delta, false), 70);
        }, 1200);
      };
      const stop = () => { clearInterval(repeat); clearTimeout(accel); };
      btn.addEventListener('pointerdown', start);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => btn.addEventListener(e, stop));
    };
    wire(document.getElementById('minusBtn'), -1);
    wire(document.getElementById('plusBtn'), 1);
  }

  validate(){
    if (this.answered) return;
    this.answered = true;

    const item = this.deck[this.current];
    const guess = this.guessM;
    const truth = item.truth;

    this.truthMarker.style.left = Math.min(97, Math.max(1, (truth / item.max) * 100)) + '%';
    document.getElementById('truthGrip').textContent = DistanceGame.formatM(truth);
    this.truthMarker.style.display = 'block';
    this.roadStrip.classList.add('locked');

    const errorPct = Math.abs(guess - truth) / truth;
    const isClose = errorPct <= 0.20;
    if (isClose){ this.score++; this.answersLog[this.current] = true; }
    else {
      this.answersLog[this.current] = false;
      this.mistakes.push({
        q: item.ctx,
        right: 'Environ ' + DistanceGame.formatM(truth) + ' (votre estimation : ' + guess + ' m)',
        exp: item.exp
      });
    }

    const verdict = document.getElementById('distVerdict');
    if (isClose) verdict.textContent = 'Bien vu ! La bonne réponse est ' + DistanceGame.formatM(truth) + '.';
    else if (guess < truth) verdict.textContent = 'Sous-estimé : il faut en réalité ' + DistanceGame.formatM(truth) + '.';
    else verdict.textContent = 'Surestimé : la bonne réponse est ' + DistanceGame.formatM(truth) + '.';
    verdict.style.color = isClose ? 'var(--go)' : 'var(--signal)';
    verdict.classList.add('show');

    const expEl = document.getElementById('distExplanation');
    expEl.textContent = item.exp;
    expEl.classList.add('show');

    Game.fillStat(document.getElementById('distStat'), item.stat);

    document.getElementById('distHint').style.visibility = 'hidden';
    const btn = document.getElementById('distNextBtn');
    btn.textContent = this.nextButtonLabel();
  }

  static formatM(v){
    return (Math.round(v * 10) / 10).toString().replace('.', ',') + ' m';
  }
}
