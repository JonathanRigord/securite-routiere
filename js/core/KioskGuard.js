/* ============ DURCISSEMENT MODE KIOSQUE ============ */
/* Neutralise les gestes qui feraient sortir de l'application sur une borne
   publique. Pas d'état à porter d'un appel à l'autre : ce n'est pas un
   design pattern à proprement parler, juste un regroupement du bloc
   "robustesse kiosque" qui traînait au milieu de l'ancien app.js. */
class KioskGuard {
  // `static` veut dire que install() appartient à la CLASSE elle-même, pas
  // à une instance particulière. Pas besoin d'écrire `new KioskGuard()` :
  // on appelle directement `KioskGuard.install()`. C'est adapté ici car
  // cette classe n'a aucune donnée à retenir (`this`) entre ses appels —
  // c'est juste un regroupement de code sous un nom clair, comme une boîte
  // à outils plutôt qu'un objet avec un état.
  static install(){
    // preventDefault() empêche le comportement par défaut du navigateur
    // pour cet événement (ici : ouvrir le menu clic-droit, faire un
    // pincer-zoomer, etc.) sans empêcher le reste de la page de réagir.
    document.addEventListener('contextmenu', e => e.preventDefault());   // clic droit
    document.addEventListener('gesturestart', e => e.preventDefault());  // pincer-zoomer (Safari)
    document.addEventListener('dblclick', e => e.preventDefault());      // double-clic
    document.addEventListener('touchmove', e => {
      if (e.touches.length > 1) e.preventDefault(); // zoom à deux doigts au toucher
    }, { passive:false }); // { passive:false } est nécessaire pour que preventDefault() fonctionne sur "touchmove"

    /* En file:// (ouverture locale sur la borne), certains navigateurs
       refusent pushState : l'erreur ne doit jamais interrompre le script. */
    try {
      // Empêche le bouton "précédent" du navigateur (ou un geste retour) de
      // sortir de l'application : on remplace l'entrée d'historique par
      // elle-même à chaque tentative de retour en arrière.
      history.pushState(null, '', location.href);
      window.addEventListener('popstate', () => {
        try { history.pushState(null, '', location.href); } catch (e) {}
      });
    } catch (e) { /* protection non disponible dans ce contexte : sans conséquence */ }
  }
}
