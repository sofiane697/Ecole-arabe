import { useState, useEffect, useRef } from 'react';
import { NAV } from './data';

/* ── Scroll Reveal ─────────────────────────────────────
   Observe tous les éléments .sr et ajoute .in quand
   ils entrent dans le viewport.
──────────────────────────────────────────────────────── */
export function useScrollReveal() {
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
  }, []);
}

/* ── Section active ────────────────────────────────────
   Retourne l'id de la section actuellement visible,
   en tenant compte du header fixe (--nav-h = 72px).
──────────────────────────────────────────────────────── */
export function useActiveSection() {
  const [active, setActive] = useState('accueil');

  useEffect(() => {
    const update = () => {
      const threshold = window.innerHeight * 0.45;
      let current = NAV[0].id;
      for (const { id } of NAV) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) {
          current = id;
        }
      }
      setActive(current);
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  return active;
}

/* ── Compteur animé ────────────────────────────────────
   Incrémente de 0 → target quand l'élément devient
   visible dans le viewport (déclenché une seule fois).
──────────────────────────────────────────────────────── */
export function useCounter(target, duration = 1600) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTs = null;
    const tick = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      setValue(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return { ref, value };
}
