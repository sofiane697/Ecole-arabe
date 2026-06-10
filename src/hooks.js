import { useEffect } from 'react';

/* ── Scroll Reveal ─────────────────────────────────────
   Observe tous les éléments .sr et ajoute .in quand
   ils entrent dans le viewport.
   `deps` permet de relancer l'observation quand des
   éléments .sr sont (re)montés — ex. retour à l'accueil
   après un parcours, où Contact / À propos réapparaissent.
──────────────────────────────────────────────────────── */
export function useScrollReveal(deps = []) {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.sr').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, deps);
}
