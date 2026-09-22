/* ============ JEU 4 : QUI EST-CE ? (PANNEAUX) ============ */
/* Contrairement à Quiz et Distance, il n'y a pas d'étape "valider" séparée :
   toucher un panneau valide directement la réponse (voir _guess()). C'est
   pour ça que SignsGame n'utilise pas Game.onNext() : son bouton "Suivant"
   appelle directement this.advance(). */
class SignsGame extends Game {
  constructor(deps){
    super(deps); // met en place screenManager/statsStore/settings/onFinish/deck/... (voir Game.js)
    this.mode = 'signs';
    this.pool = SIGNS; // banque de panneaux (js/data/panneaux.js), piochée par Game.buildDeck()
    this.target = null;    // le panneau à deviner pour la manche en cours
    this.cluesShown = 0;   // combien d'indices sont actuellement affichés
    this.wrongTries = 0;   // nombre d'essais ratés sur cette manche
    this.done = false;     // true une fois la manche résolue (bonne réponse ou indices épuisés)

    // Les boutons "Indice suivant" et "Suivant" sont des éléments fixes de
    // l'écran (jamais recréés entre deux manches) : comme pour QuizGame et
    // DistanceGame, leurs écouteurs ne sont posés qu'une fois, ici.
    document.getElementById('clueBtn').addEventListener('click', () => this._revealClue());
    document.getElementById('signNextBtn').addEventListener('click', () => this.advance());
  }

  // `static` : construire la liste des indices ne dépend d'aucune instance
  // de SignsGame, seulement du panneau `sign` passé en argument — c'est une
  // fonction utilitaire, appelée `SignsGame.buildClues(...)`, pas
  // `this.buildClues(...)`.
  static buildClues(sign){
    return [
      { label:'Forme',   text:'C’est ' + sign.forme + '.' },
      { label:'Couleur', text:'Sa couleur dominante est le ' + sign.couleur + '.' },
      { label:'Famille', text:'C’est ' + sign.cat + '.' },
      { label:'Indice',  text: sign.hint }
    ];
  }

  // Affiche la manche en cours : un nouveau panneau mystère et une nouvelle
  // grille de propositions. Appelée par Game.start() puis par
  // Game.advance() à chaque manche suivante (polymorphisme, voir Game.js).
  renderRound(){
    this.renderDots('sProgress'); // hérité de Game.js
    document.getElementById('sCounter').textContent = 'Panneau ' + (this.current + 1) + ' / ' + this.deck.length;

    this.target = this.deck[this.current];
    this.cluesShown = 1; // le premier indice ("Forme") est visible dès le début de la manche
    this.wrongTries = 0;
    this.done = false;

    const grid = document.getElementById('signGrid');
    grid.innerHTML = ''; // on reconstruit toute la grille de propositions à chaque manche
    // On affiche TOUS les panneaux de la banque comme propositions (mélangés),
    // pas seulement quelques-uns : le joueur doit reconnaître le bon parmi
    // tous les autres, d'où Game.shuffle(SIGNS) plutôt que this.deck.
    Game.shuffle(SIGNS).forEach(sign => {
      const card = document.createElement('button');
      card.className = 'sign-card';
      // dataset.signId stocke l'identifiant du panneau directement sur
      // l'élément HTML (attribut data-sign-id), pour pouvoir retrouver plus
      // tard QUEL panneau correspond à quelle carte sans redemander au
      // <img> son texte alternatif (plus fiable : deux panneaux pourraient
      // un jour partager un nom proche, jamais le même id).
      card.dataset.signId = sign.id;
      const img = document.createElement('img');
      img.src = sign.img;   // chemin vers l'image officielle (panneaux/...)
      img.alt = sign.name;  // texte alternatif, utile pour l'accessibilité
      img.draggable = false; // évite qu'un glissé accidentel démarre un "drag" de l'image
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
    next.disabled = true; // pas encore de réponse : rien à faire avec "Suivant" pour l'instant
    next.classList.remove('ready');
    next.textContent = this.nextButtonLabel(); // hérité de Game.js
  }

  // Réaffiche la boîte d'indices, en ne montrant que les `cluesShown`
  // premiers (les autres restent cachés jusqu'à ce qu'on les débloque, via
  // _revealClue() ou une mauvaise réponse).
  _renderClues(){
    const box = document.getElementById('clueBox');
    const clues = SignsGame.buildClues(this.target);
    box.innerHTML = '';
    // .slice(0, this.cluesShown) : ne garde que les N premiers éléments du
    // tableau (ex. cluesShown=2 → les 2 premiers indices seulement).
    clues.slice(0, this.cluesShown).forEach((c, i) => {
      const line = document.createElement('div');
      // Le dernier indice ajouté reçoit la classe "reveal", qui déclenche
      // une petite animation d'apparition en CSS — seulement lui, pas ceux
      // déjà affichés avant.
      line.className = 'clue-line' + (i === this.cluesShown - 1 ? ' reveal' : '');
      const b = document.createElement('b');
      b.textContent = c.label;
      const span = document.createElement('span');
      span.textContent = c.text;
      line.appendChild(b);
      line.appendChild(span);
      box.appendChild(line);
    });
    // Désactive le bouton "Indice suivant" une fois tous les indices épuisés.
    document.getElementById('clueBtn').disabled = (this.cluesShown >= clues.length);
  }

  // Appelée au clic sur "Indice suivant" : dévoile un indice de plus,
  // volontairement demandé par le joueur (sans compter comme un essai raté).
  _revealClue(){
    if (this.done) return; // manche déjà résolue : plus d'indice à débloquer
    const total = SignsGame.buildClues(this.target).length;
    if (this.cluesShown < total){
      this.cluesShown++;
      this._renderClues();
    }
  }

  // Appelée à chaque clic sur une carte de la grille. `sign` est le panneau
  // représenté par la carte cliquée, `card` l'élément DOM lui-même.
  _guess(sign, card){
    if (this.done) return; // pas de nouvel essai possible une fois la manche résolue

    if (sign.id === this.target.id){
      // Bonne réponse.
      this.done = true;
      card.classList.add('good');
      // On grise ("dim") toutes les AUTRES cartes et on désactive les clics
      // partout, pour bien montrer laquelle était la bonne.
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
    card.style.pointerEvents = 'none'; // la carte fausse ne peut plus être re-cliquée
    this.wrongTries++;

    const total = SignsGame.buildClues(this.target).length;
    if (this.cluesShown < total){
      // Encore des indices en réserve : on en débloque un, pour aider sans
      // révéler directement la réponse.
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
      // On parcourt toutes les cartes une seule fois : on désactive les
      // clics sur chacune, et on met en évidence celle qui correspond au
      // bon panneau (comparaison par id, voir le commentaire sur
      // dataset.signId plus haut dans renderRound()).
      document.querySelectorAll('.sign-card').forEach(c => {
        c.style.pointerEvents = 'none';
        if (c.dataset.signId === this.target.id){
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

  // Petites mises à jour communes aux deux issues (bonne réponse / indices
  // épuisés) : cache le bouton d'indice, active le bouton "Suivant".
  _finishRound(){
    document.getElementById('clueBtn').style.display = 'none';
    const next = document.getElementById('signNextBtn');
    next.disabled = false;
    next.classList.add('ready'); // déclenche l'animation de pulsation en CSS, pour attirer l'œil
  }
}
