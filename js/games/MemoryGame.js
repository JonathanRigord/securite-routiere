/* ============ JEU 3 : MÉMOIRE ÉQUIPEMENT MOTO (« L'équipement du motard ») ============ */
/* Jeu de paires, pas de "manche" séquentielle : start() est entièrement
   surchargée plutôt que de s'appuyer sur buildDeck()/renderRound(). */
class MemoryGame extends Game {
  constructor(deps){
    super(deps);
    this.mode = 'memory';
    this.pairs = [];    // les équipements tirés pour cette partie (avant duplication en paires)
    this.flipped = [];  // les 0, 1 ou 2 cartes actuellement retournées face visible
    this.found = 0;     // nombre de paires déjà trouvées
    this.errors = 0;    // nombre d'essais ratés
    this.locked = false; // true pendant l'animation de résolution d'une paire (empêche de cliquer)
    this._resolveTimeout = null; // setTimeout en attente dans flip() (résolution d'une paire)

    document.getElementById('memNextBtn').addEventListener('click', () => this.finish());
  }

  // MemoryGame redéfinit entièrement start() (au lieu de renderRound()) car
  // sa "partie" ne se découpe pas en manches successives comme les 3 autres
  // jeux : elle consiste à construire une grille de cartes une seule fois,
  // puis à réagir aux clics jusqu'à ce que toutes les paires soient
  // trouvées.
  start(){
    /* GameFactory ne crée qu'une seule instance de MemoryGame pour toute la
       session (voir GameFactory.js) : sans ça, un setTimeout en attente d'une
       manche précédente (Quitter puis Rejouer rapide) s'exécuterait pendant
       la nouvelle manche et corromprait flipped/locked/found en plein jeu. */
    clearTimeout(this._resolveTimeout);
    const pairCount = Math.min(this.settings.count, EQUIPMENT_POOL.length);
    this.pairs = Game.shuffle(EQUIPMENT_POOL).slice(0, pairCount); // méthode statique héritée de Game
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
    grid.innerHTML = ''; // on reconstruit toute la grille de cartes à chaque nouvelle partie
    grid.style.setProperty('--mem-rows', Math.ceil((pairCount * 2) / 4)); // variable CSS, lue par style.css pour dimensionner la grille

    // this.pairs.concat(this.pairs) : chaque équipement apparaît deux fois
    // (une paire à retrouver), puis on mélange l'ensemble pour répartir les
    // doublons au hasard dans la grille.
    const cards = Game.shuffle(this.pairs.concat(this.pairs));
    cards.forEach(item => {
      // Construction de la carte "morceau par morceau" avec
      // document.createElement plutôt qu'avec une grande chaîne HTML
      // (innerHTML = "...") : plus verbeux, mais plus sûr (pas de risque
      // d'injecter du texte non échappé) et plus facile à faire évoluer
      // pièce par pièce.
      const card = document.createElement('button');
      card.className = 'mem-card';

      const inner = document.createElement('div');
      inner.className = 'mem-inner'; // c'est cet élément que le CSS fait pivoter (retournement 3D de la carte)

      const back = document.createElement('div'); // face cachée ("dos" de la carte, avec un "?")
      back.className = 'mem-face mem-back';
      back.textContent = '?';

      const front = document.createElement('div'); // face visible (icône + nom de l'équipement)
      front.className = 'mem-face mem-front';
      const ic = document.createElement('span');
      ic.className = 'mi';
      ic.innerHTML = icon(item.icon); // fonction globale définie dans js/icons.js, renvoie du SVG en texte
      const lb = document.createElement('span');
      lb.className = 'ml';
      lb.textContent = item.name;
      front.appendChild(ic);
      front.appendChild(lb);

      inner.appendChild(back);
      inner.appendChild(front);
      card.appendChild(inner);
      // `() => this.flip(card, item)` capture à la fois `this` (l'instance
      // MemoryGame) ET les variables locales `card`/`item` de cette
      // itération de forEach — chaque carte "se souvient" de son propre
      // équipement grâce à ces closures.
      card.addEventListener('click', () => this.flip(card, item));
      grid.appendChild(card);
    });
  }

  // Appelée à chaque clic sur une carte.
  flip(card, item){
    if (this.locked) return; // deux cartes déjà retournées : on attend la résolution avant d'en accepter une 3e
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return; // carte déjà retournée ou déjà validée

    card.classList.add('flipped');
    this.flipped.push({ card, item }); // { card, item } : raccourci ES6 équivalent à { card: card, item: item }

    if (this.flipped.length < 2) return; // une seule carte retournée pour l'instant : on attend la seconde

    this.locked = true;
    // Déstructuration de tableau : `const [a, b] = this.flipped` extrait le
    // premier élément dans `a` et le second dans `b`, plus lisible que
    // `this.flipped[0]` / `this.flipped[1]`.
    const [a, b] = this.flipped;

    if (a.item.name === b.item.name){
      // Paire trouvée : on laisse les deux cartes visibles un court instant
      // (420 ms) avant de les marquer "matched", pour laisser au joueur le
      // temps de voir qu'elles correspondent.
      this._resolveTimeout = setTimeout(() => {
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
      // Pas une paire : on laisse les deux cartes visibles 1,1 s (le temps
      // de mémoriser leur position) avant de les remettre face cachée.
      this.errors++;
      document.getElementById('memErrors').textContent = this.errors;
      this._resolveTimeout = setTimeout(() => {
        a.card.classList.remove('flipped');
        b.card.classList.remove('flipped');
        this.flipped = [];
        this.locked = false;
      }, 1100);
    }
  }

  // Redéfinit stopTimer() (vide par défaut dans Game.js) pour annuler le
  // setTimeout en attente : appelée par finish() et par app.js quand on
  // quitte la partie en cours, exactement comme QuizGame.stopTimer()
  // arrête son minuteur de question.
  stopTimer(){
    clearTimeout(this._resolveTimeout);
  }

  // Affiche la petite fiche pédagogique (obligatoire/recommandé + info)
  // sous la grille, à chaque paire trouvée.
  _showFact(item){
    const box = document.getElementById('memReveal');
    box.innerHTML = '';
    const badge = document.createElement('span');
    badge.className = 'badge ' + item.status; // 'obl' (obligatoire) ou 'rec' (recommandé), voir equipements.js
    badge.textContent = item.badge + ' — ' + item.name;
    const txt = document.createElement('span');
    txt.textContent = item.fact;
    box.appendChild(badge);
    box.appendChild(txt);
  }

  // Appelée quand toutes les paires ont été trouvées : débloque le bouton
  // qui mène à l'écran de résultat.
  _complete(){
    const hint = document.getElementById('memHint');
    hint.textContent = 'Toutes les paires sont trouvées !';
    hint.style.visibility = 'visible';
    hint.style.color = 'var(--go)';
    const btn = document.getElementById('memNextBtn');
    btn.disabled = false;
    btn.classList.add('ready');
  }

  // Game.js exige que renderRound() existe (sinon elle lève une erreur —
  // voir Game.js), mais MemoryGame ne s'en sert jamais réellement puisque
  // start() ne l'appelle pas : on la garde vide, juste pour respecter le
  // "contrat" de la classe de base sans planter si jamais quelque chose
  // l'appelait par erreur.
  renderRound(){ /* jeu de paires : voir start()/flip(), pas de manche unique */ }
}
