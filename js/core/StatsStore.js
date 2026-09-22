/* ============ COMPTEURS ANIMATEUR (pattern Repository) ============ */
/* Encapsule le stockage local des compteurs de parties : aucune donnée
   personnelle, uniquement des totaux anonymes par jeu. Le localStorage peut
   être indisponible en file:// (règle du CLAUDE.md) : toujours entouré de
   try/catch, jamais de propagation d'erreur vers l'appelant.

   "Repository" est un pattern qui dit : toute la logique d'accès à une
   source de données (ici localStorage) est regroupée dans une seule classe,
   avec une API simple (record/snapshot/reset). Le reste du code n'a jamais
   besoin de savoir que ça vit dans localStorage plutôt qu'ailleurs — si on
   change un jour de mécanisme de stockage, seul ce fichier change. */
class StatsStore {
  // Le constructeur est appelé automatiquement par `new StatsStore(...)`.
  // Il reçoit la clé localStorage à utiliser et la stocke sur l'instance
  // (`this`) pour que les autres méthodes puissent s'en servir.
  constructor(key){
    this.key = key;
  }

  // Lit l'état actuel des compteurs. Une "snapshot" (instantané) est une
  // copie des données à un instant donné — ici, l'objet lu depuis
  // localStorage, ou un objet vide si rien n'est encore stocké.
  snapshot(){
    try {
      const raw = localStorage.getItem(this.key); // une chaîne JSON, ou null
      if (raw) return JSON.parse(raw); // transforme la chaîne en objet JS
    } catch (e) { /* stockage indisponible : on continue sans compteurs */ }
    return this._empty();
  }

  // Incrémente de 1 le compteur du mode donné ('quiz', 'distance', ...).
  // On relit toujours l'état avant de le modifier (snapshot), au cas où
  // plusieurs onglets/parties auraient écrit entre-temps.
  record(mode){
    const stats = this.snapshot();
    stats[mode] = (stats[mode] || 0) + 1; // (stats[mode] || 0) : 0 si la clé n'existait pas encore
    this._save(stats);
  }

  reset(){
    this._save(this._empty());
  }

  // Méthode préfixée par "_" : une convention (pas une vraie protection en
  // JavaScript) pour dire "usage interne à la classe, ne pas appeler depuis
  // l'extérieur". Construit la structure de données vide de départ.
  _empty(){
    return { quiz:0, distance:0, memory:0, signs:0, since:new Date().toISOString().slice(0, 10) };
  }

  // Sérialise l'objet en JSON (texte) pour pouvoir le stocker : localStorage
  // ne sait stocker que des chaînes de caractères, jamais des objets.
  _save(stats){
    try { localStorage.setItem(this.key, JSON.stringify(stats)); } catch (e) { /* idem */ }
  }
}
