/* ============ COMPTEURS ANIMATEUR (pattern Repository) ============ */
/* Encapsule le stockage local des compteurs de parties : aucune donnée
   personnelle, uniquement des totaux anonymes par jeu. Le localStorage peut
   être indisponible en file:// (règle du CLAUDE.md) : toujours entouré de
   try/catch, jamais de propagation d'erreur vers l'appelant. */
class StatsStore {
  constructor(key){
    this.key = key;
  }

  snapshot(){
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* stockage indisponible : on continue sans compteurs */ }
    return this._empty();
  }

  record(mode){
    const stats = this.snapshot();
    stats[mode] = (stats[mode] || 0) + 1;
    this._save(stats);
  }

  reset(){
    this._save(this._empty());
  }

  _empty(){
    return { quiz:0, distance:0, memory:0, signs:0, since:new Date().toISOString().slice(0, 10) };
  }

  _save(stats){
    try { localStorage.setItem(this.key, JSON.stringify(stats)); } catch (e) { /* idem */ }
  }
}
