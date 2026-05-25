import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// ─── Courbes & durées partagées ─────────────────────────────────────────────
export const EASE = 'power2.out';
export const EASE_IN = 'power2.in';
export const DUR = { xs: 0.18, sm: 0.25, md: 0.35, lg: 0.5 };

// ─── usePageTransition ──────────────────────────────────────────────────────
// Hook utilisé dans les *App.jsx (AdminApp, EnseignantApp, PortailApp, ParentApp)
// pour animer l'Outlet à chaque changement de location.pathname.
//
// Usage :
//   const outletRef = usePageTransition(location.pathname);
//   <div ref={outletRef}><Outlet /></div>
export function usePageTransition(pathKey) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: DUR.md, ease: EASE }
      );
    }, ref);
    return () => ctx.revert();
  }, [pathKey]);
  return ref;
}

// ─── useReveal ──────────────────────────────────────────────────────────────
// Hook générique pour animer un élément au mount (fade + translation Y).
//
// Usage :
//   const ref = useReveal();                       // valeurs par défaut
//   const ref = useReveal({ y: 24, duration: 0.5, delay: 0.2 });
//   <div ref={ref}>...</div>
export function useReveal(opts = {}) {
  const ref = useRef(null);
  const { y = 18, opacity = 0, duration = DUR.md, delay = 0, ease = EASE } = opts;
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { y, opacity, duration, delay, ease });
    }, ref);
    return () => ctx.revert();
  }, []);
  return ref;
}

// ─── useStagger ─────────────────────────────────────────────────────────────
// Hook pour animer les enfants directs d'un conteneur en cascade au mount.
//
// Usage :
//   const ref = useStagger({ stagger: 0.07, y: 18 });
//   <div ref={ref}>
//     <div>item 1</div>
//     <div>item 2</div>
//   </div>
//
// Option `selector` pour cibler une sous-classe au lieu des enfants directs :
//   const ref = useStagger({ selector: '.value' });
export function useStagger(opts = {}) {
  const ref = useRef(null);
  const {
    y = 18,
    opacity = 0,
    duration = DUR.md,
    delay = 0.05,
    stagger = 0.07,
    ease = EASE,
    selector = null,
  } = opts;
  useEffect(() => {
    if (!ref.current) return;
    const targets = selector
      ? ref.current.querySelectorAll(selector)
      : ref.current.children;
    if (!targets || targets.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from(targets, { y, opacity, duration, delay, stagger, ease });
    }, ref);
    return () => ctx.revert();
  }, []);
  return ref;
}

// ─── useModalAppear ─────────────────────────────────────────────────────────
// Hook pour animer l'entrée d'une modale (overlay fade + carte scale-up).
// L'animation d'exit est volontairement supprimée (le composant se démonte
// instantanément à la fermeture — comportement standard React).
//
// Usage :
//   const { overlayRef, cardRef } = useModalAppear();
//   <div ref={overlayRef} className="overlay">
//     <div ref={cardRef} className="modal-card">...</div>
//   </div>
export function useModalAppear() {
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  useEffect(() => {
    if (!overlayRef.current || !cardRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(overlayRef.current, { opacity: 0, duration: 0.18, ease: EASE })
        .from(
          cardRef.current,
          { opacity: 0, scale: 0.92, y: 12, duration: 0.25, ease: EASE },
          '-=0.08'
        );
    });
    return () => ctx.revert();
  }, []);
  return { overlayRef, cardRef };
}

// ─── usePanelAppear ─────────────────────────────────────────────────────────
// Variante plus discrète pour un panneau latéral (juste fade + petit slide-up).
export function usePanelAppear() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { opacity: 0, y: 8, duration: 0.3, ease: EASE });
    }, ref);
    return () => ctx.revert();
  }, []);
  return ref;
}

// ─── Composants pratiques ───────────────────────────────────────────────────
// Wrappers prêts à l'emploi pour les cas simples sans avoir à gérer les refs.

export function PageTransition({ pathKey, children, className, style }) {
  const ref = usePageTransition(pathKey);
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

export function Reveal({ children, y, opacity, duration, delay, className, style, as: Tag = 'div' }) {
  const ref = useReveal({ y, opacity, duration, delay });
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}

export function Stagger({ children, y, stagger, delay, selector, className, style, as: Tag = 'div' }) {
  const ref = useStagger({ y, stagger, delay, selector });
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
