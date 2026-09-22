/* ============ JEU 1 : QCM (« Le bon réflexe ») ============ */
class QuizGame extends Game {
  constructor(deps){
    super(deps);
    this.mode = 'quiz';
    this.pool = QUESTION_POOL;
    this.selectedIndex = null;
    this.answered = false;
    this.timer = new CountdownTimer();

    document.getElementById('nextBtn').addEventListener('click', () => this.onNext());
  }

  renderRound(){
    this.renderDots('progress');
    this.selectedIndex = null;
    this.answered = false;
    document.getElementById('qCounter').textContent = 'Question ' + (this.current + 1) + ' / ' + this.deck.length;

    const item = this.deck[this.current];
    document.getElementById('questionText').textContent = item.q;

    const answersEl = document.getElementById('answers');
    answersEl.innerHTML = '';
    const order = Game.shuffle(item.a.map((text, i) => ({ text, i })));
    order.forEach(({ text, i }) => {
      const btn = document.createElement('button');
      btn.className = 'answer';
      btn.textContent = text;
      btn.dataset.index = i;
      btn.addEventListener('click', () => this.select(i, btn));
      answersEl.appendChild(btn);
    });

    document.getElementById('explanation').classList.remove('show');
    document.getElementById('statBox').classList.remove('show');
    document.getElementById('validateHint').style.visibility = 'visible';

    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = 'Valider';
    nextBtn.disabled = true;

    this.screenManager.element('quiz').scrollTop = 0;
    this.startCountdown();
  }

  select(i, btn){
    if (this.answered) return;
    document.querySelectorAll('#answers .answer').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedIndex = i;
    document.getElementById('nextBtn').disabled = false;
    document.getElementById('validateHint').style.visibility = 'hidden';
  }

  startCountdown(){
    const badge = document.getElementById('timerText');
    this.timer.stop();
    if (!this.settings.timer){ badge.classList.add('hidden'); return; }
    badge.classList.remove('hidden', 'low', 'done');
    this.timer.start(this.settings.timer, {
      onTick: (left) => {
        badge.textContent = left;
        badge.classList.toggle('low', left > 0 && left <= 8);
      },
      onExpire: () => this.validate(true)
    });
  }

  stopTimer(){
    this.timer.stop();
  }

  validate(timedOut){
    if (this.answered) return;
    this.answered = true;
    this.stopTimer();

    const item = this.deck[this.current];
    const btns = document.querySelectorAll('#answers .answer');
    btns.forEach(b => b.style.pointerEvents = 'none');

    const correctBtn = Array.from(btns).find(b => Number(b.dataset.index) === item.correct);
    const chosenBtn = Array.from(btns).find(b => Number(b.dataset.index) === this.selectedIndex);

    const isRight = this.selectedIndex === item.correct;
    if (isRight){
      correctBtn.classList.add('correct');
      this.score++;
      this.answersLog[this.current] = true;
    } else {
      if (chosenBtn) chosenBtn.classList.add('wrong');
      correctBtn.classList.add('correct');
      this.answersLog[this.current] = false;
      this.mistakes.push({ q:item.q, right:item.a[item.correct], exp:item.exp });
    }

    const badge = document.getElementById('timerText');
    badge.classList.remove('low');
    badge.classList.add('done');
    badge.textContent = '—';

    const expEl = document.getElementById('explanation');
    expEl.textContent = (timedOut ? 'Temps écoulé — ' : '') + item.exp;
    expEl.classList.add('show');

    Game.fillStat(document.getElementById('statBox'), item.stat);

    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = false;
    nextBtn.textContent = this.nextButtonLabel();
    document.getElementById('validateHint').style.visibility = 'hidden';
  }
}
