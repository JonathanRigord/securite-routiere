/* ============ JEU 2 : DISTANCE D'ARRÊT (« Où va-t-elle s'arrêter ? ») ============ */
class DistanceGame extends Game {
  constructor(deps){
    super(deps); // voir QuizGame.js pour le détail de pourquoi super() est indispensable ici
    this.mode = 'distance';
    this.pool = DISTANCE_POOL;
    this.answered = false;
    this.guessM = 0;      // l'estimation actuelle du joueur, en mètres
    this.maxM = 100;       // longueur totale de la route affichée, pour convertir mètres → position en %
    this.dragging = false; // true pendant qu'un doigt/curseur glisse sur la route

    // On garde une référence directe vers les éléments DOM utilisés très
    // souvent (au lieu de refaire `document.getElementById(...)` à chaque
    // fois) : un petit gain de clarté et de performance.
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

    const item = this.deck[this.current]; // ex. { ctx, max, truth, exp, stat }
    document.getElementById('distContext').textContent = item.ctx;
    document.getElementById('scaleMax').textContent = item.max + ' m';

    this.maxM = item.max;
    this.guessM = Math.round(item.max * 0.25); // position de départ du repère : 25 % de la route
    this.roadStrip.classList.remove('locked');
    this._updateGuessDisplay();

    this.truthMarker.style.display = 'none'; // la vraie distance n'est révélée qu'après validation
    document.getElementById('distVerdict').classList.remove('show');
    document.getElementById('distExplanation').classList.remove('show');
    document.getElementById('distStat').classList.remove('show');
    document.getElementById('distHint').style.visibility = 'visible';

    const btn = document.getElementById('distNextBtn');
    btn.textContent = 'Valider';
    btn.disabled = false;
  }

  // Met à jour le texte et la position (en %) du repère de l'utilisateur,
  // à partir de la valeur actuelle de this.guessM.
  _updateGuessDisplay(){
    this.guessValueEl.textContent = this.guessM + ' m';
    document.getElementById('guessGrip').textContent = this.guessM + ' m';
    // Conversion mètres → pourcentage de la largeur de la route, en
    // gardant toujours le repère visible même aux extrémités (jamais
    // en-dessous de 1 % ni au-dessus de 97 %, sinon il sortirait du cadre).
    this.guessMarker.style.left = Math.min(97, Math.max(1, (this.guessM / this.maxM) * 100)) + '%';
  }

  // Change l'estimation (en mètres), en la bornant toujours entre 1 et
  // maxM. `animate` déclenche une petite transition CSS fluide (utilisée
  // pour les boutons +/-, pas pour le glissement au doigt, plus réactif
  // sans animation).
  _setGuess(v, animate){
    if (this.answered) return;
    this.guessMarker.classList.toggle('animate', !!animate); // !!animate : force la valeur en booléen strict (true/false)
    this.guessM = Math.max(1, Math.min(this.maxM, Math.round(v)));
    this._updateGuessDisplay();
  }

  // Met en place le glissement du repère au doigt/souris directement sur
  // la route (indépendant des boutons +/-).
  _wireDrag(){
    // Fonction interne (pas une méthode de la classe) : elle n'est utile
    // qu'ici, donc pas besoin de la rendre accessible via `this.xxx`.
    const guessFromEvent = (ev) => {
      const rect = this.roadStrip.getBoundingClientRect(); // position/taille réelle de la route à l'écran
      const ratio = (ev.clientX - rect.left) / rect.width;  // 0 = tout à gauche, 1 = tout à droite
      this._setGuess(ratio * this.maxM, false);
    };
    this.roadStrip.addEventListener('pointerdown', ev => {
      if (this.answered) return;
      this.dragging = true;
      // setPointerCapture : garantit que les événements pointermove/up
      // suivants seront bien envoyés à roadStrip même si le doigt/curseur
      // sort de sa zone pendant le glissement.
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
    // `wire` est une fonction générique appelée deux fois plus bas (une
    // fois par bouton), pour éviter de dupliquer cette logique.
    const wire = (btn, delta) => {
      let repeat = null, accel = null; // identifiants setInterval/setTimeout, pour pouvoir les annuler
      const start = () => {
        this._setGuess(this.guessM + delta, true);
        // Répète le changement toutes les 260 ms tant que le bouton reste appuyé...
        repeat = setInterval(() => this._setGuess(this.guessM + delta, false), 260);
        // ...puis, après 1,2 s d'appui continu, accélère à toutes les 70 ms
        // (pratique pour ajuster une grande distance sans multiplier les taps).
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
    const truth = item.truth; // la vraie distance d'arrêt, calculée dans js/data/distances.js

    this.truthMarker.style.left = Math.min(97, Math.max(1, (truth / item.max) * 100)) + '%';
    document.getElementById('truthGrip').textContent = DistanceGame.formatM(truth);
    this.truthMarker.style.display = 'block';
    this.roadStrip.classList.add('locked'); // on bloque le glissement une fois la réponse révélée

    const errorPct = Math.abs(guess - truth) / truth; // écart relatif entre l'estimation et la vérité
    const isClose = errorPct <= 0.20; // tolérance de 20 % pour valider la manche
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

  // `static` : pas besoin d'une instance de DistanceGame pour formater un
  // nombre en mètres — c'est une simple fonction utilitaire rattachée à la
  // classe par commodité (on la trouve à côté du code qui l'utilise).
  // Convertit 37.5 en "37,5 m" (virgule française plutôt que point).
  static formatM(v){
    return (Math.round(v * 10) / 10).toString().replace('.', ',') + ' m';
  }
}
