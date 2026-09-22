/* ============ JEU 4 : QUI EST-CE ? (PANNEAUX) ============ */
class SignsGame extends Game {
  constructor(deps){
    super(deps);
    this.mode = 'signs';
    this.pool = SIGNS;
    this.target = null;
    this.cluesShown = 0;
    this.wrongTries = 0;
    this.done = false;

    document.getElementById('clueBtn').addEventListener('click', () => this._revealClue());
    document.getElementById('signNextBtn').addEventListener('click', () => this.advance());
  }

  static buildClues(sign){
    return [
      { label:'Forme',   text:'C’est ' + sign.forme + '.' },
      { label:'Couleur', text:'Sa couleur dominante est le ' + sign.couleur + '.' },
      { label:'Famille', text:'C’est ' + sign.cat + '.' },
      { label:'Indice',  text: sign.hint }
    ];
  }

  renderRound(){
    this.renderDots('sProgress');
    document.getElementById('sCounter').textContent = 'Panneau ' + (this.current + 1) + ' / ' + this.deck.length;

    this.target = this.deck[this.current];
    this.cluesShown = 1;
    this.wrongTries = 0;
    this.done = false;

    const grid = document.getElementById('signGrid');
    grid.innerHTML = '';
    Game.shuffle(SIGNS).forEach(sign => {
      const card = document.createElement('button');
      card.className = 'sign-card';
      const img = document.createElement('img');
      img.src = sign.img;
      img.alt = sign.name;
      img.draggable = false;
      card.appendChild(img);
      card.addEventListener('click', () => this._guess(sign, card));
      grid.appendChild(card);
    });

    this._renderClues();

    const hint = document.getElementById('signHint');
    hint.textContent = 'Touchez le panneau qui correspond';
    hint.style.color = '';
    document.getElementById('clueBtn').style.display = 'inline-block';
    document.getElementById('clueBtn').disabled = false;
    const next = document.getElementById('signNextBtn');
    next.disabled = true;
    next.classList.remove('ready');
    next.textContent = (this.current === this.deck.length - 1) ? 'Voir le résultat' : 'Suivant';
  }

  _renderClues(){
    const box = document.getElementById('clueBox');
    const clues = SignsGame.buildClues(this.target);
    box.innerHTML = '';
    clues.slice(0, this.cluesShown).forEach((c, i) => {
      const line = document.createElement('div');
      line.className = 'clue-line' + (i === this.cluesShown - 1 ? ' reveal' : '');
      const b = document.createElement('b');
      b.textContent = c.label;
      const span = document.createElement('span');
      span.textContent = c.text;
      line.appendChild(b);
      line.appendChild(span);
      box.appendChild(line);
    });
    document.getElementById('clueBtn').disabled = (this.cluesShown >= clues.length);
  }

  _revealClue(){
    if (this.done) return;
    const total = SignsGame.buildClues(this.target).length;
    if (this.cluesShown < total){
      this.cluesShown++;
      this._renderClues();
    }
  }

  _guess(sign, card){
    if (this.done) return;

    if (sign.id === this.target.id){
      this.done = true;
      card.classList.add('good');
      document.querySelectorAll('.sign-card').forEach(c => {
        c.style.pointerEvents = 'none';
        if (c !== card) c.classList.add('dim');
      });
      this.score++;
      this.answersLog[this.current] = true;

      const hint = document.getElementById('signHint');
      hint.textContent = this.target.name + ' — trouvé avec ' + this.cluesShown
        + (this.cluesShown > 1 ? ' indices' : ' indice')
        + (this.wrongTries ? ', ' + this.wrongTries + (this.wrongTries > 1 ? ' erreurs' : ' erreur') : ', sans erreur') + '.';
      hint.style.color = 'var(--go)';
      this._finishRound();
      return;
    }

    /* Mauvaise réponse : la carte est écartée et un indice se dévoile. */
    card.classList.add('bad');
    card.style.pointerEvents = 'none';
    this.wrongTries++;

    const total = SignsGame.buildClues(this.target).length;
    if (this.cluesShown < total){
      this.cluesShown++;
      this._renderClues();
    } else {
      /* Plus d'indices disponibles : on révèle la réponse. */
      this.done = true;
      this.answersLog[this.current] = false;
      this.mistakes.push({
        q: 'Panneau à retrouver : ' + this.target.name,
        right: this.target.name,
        exp: this.target.hint
      });
      document.querySelectorAll('.sign-card').forEach(c => c.style.pointerEvents = 'none');
      document.querySelectorAll('.sign-card').forEach(c => {
        if (c.querySelector('img').alt === this.target.name){
          c.classList.remove('dim');
          c.classList.add('good');
        }
      });
      const hint = document.getElementById('signHint');
      hint.textContent = "C'était : " + this.target.name + '.';
      hint.style.color = 'var(--signal)';
      this._finishRound();
    }
  }

  _finishRound(){
    document.getElementById('clueBtn').style.display = 'none';
    const next = document.getElementById('signNextBtn');
    next.disabled = false;
    next.classList.add('ready');
  }
}
