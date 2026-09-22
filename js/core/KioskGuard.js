/* ============ DURCISSEMENT MODE KIOSQUE ============ */
/* Neutralise les gestes qui feraient sortir de l'application sur une borne
   publique. Pas d'état à porter d'un appel à l'autre : ce n'est pas un
   design pattern à proprement parler, juste un regroupement du bloc
   "robustesse kiosque" qui traînait au milieu de l'ancien app.js. */
class KioskGuard {
  static install(){
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
    document.addEventListener('touchmove', e => {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive:false });

    /* En file:// (ouverture locale sur la borne), certains navigateurs
       refusent pushState : l'erreur ne doit jamais interrompre le script. */
    try {
      history.pushState(null, '', location.href);
      window.addEventListener('popstate', () => {
        try { history.pushState(null, '', location.href); } catch (e) {}
      });
    } catch (e) { /* protection non disponible dans ce contexte : sans conséquence */ }
  }
}
