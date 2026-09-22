/* ============ JEU 3 : MÉMOIRE ÉQUIPEMENT MOTO (« L'équipement du motard ») ============ */
/* Jeu de paires, pas de "manche" séquentielle : start() est entièrement
   surchargée plutôt que de s'appuyer sur buildDeck()/renderRound(). */
class MemoryGame extends Game {
  constructor(deps){
    super(deps);
    this.mode = 'memory';
    this.pairs = [];
    this.flipped = [];
    this.found = 0;
    this.errors = 0;
    this.locked = false;

    document.getElementById('memNextBtn').addEventListener('click', () => this.finish());
  }

  start(){
    const pairCount = Math.min(this.settings.count, EQUIPMENT_POOL.length);
    this.pairs = Game.shuffle(EQUIPMENT_POOL).slice(0, pairCount);
    this.found = 0;
    this.errors = 0;
    this.flipped = [];
    this.locked = false;

    this.statsStore.record(this.mode);
    this.screenManager.go(this.mode);

    document.getElementById('memTotal').textContent = pairCount;
    document.getElementById('memFound').textContent = '0';
    document.getElementById('memErrors').textContent = '0';
    document.getElementById('memReveal').innerHTML =
      '<span class="placeholder">Touchez deux cartes pour les retourner.</span>';
    const hint = document.getElementById('memHint');
    hint.textContent = 'Trouvez toutes les paires';
    hint.style.visibility = 'visible';
    hint.style.color = '';
    const nextBtn = document.getElementById('memNextBtn');
    nextBtn.disabled = true;
    nextBtn.classList.remove('ready');

    const grid = document.getElementById('memGrid');
    grid.innerHTML = '';
    grid.style.setProperty('--mem-rows', Math.ceil((pairCount * 2) / 4));

    const cards = Game.shuffle(this.pairs.concat(this.pairs));
    cards.forEach(item => {
      const card = document.createElement('button');
      card.className = 'mem-card';

      const inner = document.createElement('div');
      inner.className = 'mem-inner';

      const back = document.createElement('div');
      back.className = 'mem-face mem-back';
      back.textContent = '?';

      const front = document.createElement('div');
      front.className = 'mem-face mem-front';
      const ic = document.createElement('span');
      ic.className = 'mi';
      ic.innerHTML = icon(item.icon);
      const lb = document.createElement('span');
      lb.className = 'ml';
      lb.textContent = item.name;
      front.appendChild(ic);
      front.appendChild(lb);

      inner.appendChild(back);
      inner.appendChild(front);
      card.appendChild(inner);
      card.addEventListener('click', () => this.flip(card, item));
      grid.appendChild(card);
    });
  }

  flip(card, item){
    if (this.locked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    this.flipped.push({ card, item });

    if (this.flipped.length < 2) return;

    this.locked = true;
    const [a, b] = this.flipped;

    if (a.item.name === b.item.name){
      setTimeout(() => {
        a.card.classList.add('matched');
        b.card.classList.add('matched');
        this.found++;
        document.getElementById('memFound').textContent = this.found;
        this._showFact(a.item);
        this.flipped = [];
        this.locked = false;
        if (this.found === this.pairs.length) this._complete();
      }, 420);
    } else {
      this.errors++;
      document.getElementById('memErrors').textContent = this.errors;
      setTimeout(() => {
        a.card.classList.remove('flipped');
        b.card.classList.remove('flipped');
        this.flipped = [];
        this.locked = false;
      }, 1100);
    }
  }

  _showFact(item){
    const box = document.getElementById('memReveal');
    box.innerHTML = '';
    const badge = document.createElement('span');
    badge.className = 'badge ' + item.status;
    badge.textContent = item.badge + ' — ' + item.name;
    const txt = document.createElement('span');
    txt.textContent = item.fact;
    box.appendChild(badge);
    box.appendChild(txt);
  }

  _complete(){
    const hint = document.getElementById('memHint');
    hint.textContent = 'Toutes les paires sont trouvées !';
    hint.style.visibility = 'visible';
    hint.style.color = 'var(--go)';
    const btn = document.getElementById('memNextBtn');
    btn.disabled = false;
    btn.classList.add('ready');
  }

  renderRound(){ /* jeu de paires : voir start()/flip(), pas de manche unique */ }
}
