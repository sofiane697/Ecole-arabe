import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

// ─── Courbes & durées partagées ─────────────────────────────────────────────
export const EASE = 'power2.out';
export const EASE_IN = 'power2.in';
export const DUR = { xs: 0.18, sm: 0.25, md: 0.35, lg: 0.5 };

// ─── usePageTransition ──────────────────────────────────────────────────────
// Hook utilisé dans les *App.jsx (AdminApp, EnseignantApp, PortailApp, ParentApp)
// pour animer l'Outlet à chaque changement de location.pathname.
//
// Durée courte (200ms) pour minimiser l'impact sur l'INP (Interaction to Next
// Paint) — sinon l'animation rallonge artificiellement le délai perçu entre
// clic et update visuelle.
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
        { opacity: 0, y: 8 },
        {
          opacity: 1, y: 0, duration: 0.2, ease: EASE,
          // CRUCIAL : sans clearProps, GSAP laisse un `transform: translate(0,0)`
          // résiduel sur ce wrapper. Un transform sur un parent redéfinit le
          // référentiel des descendants `position: fixed` → les modales/overlays
          // (ConfirmModal, tiroir d'inscription…) se positionnent par rapport à
          // ce wrapper (souvent très haut) au lieu du viewport, d'où la modale
          // décalée tout en bas qu'il fallait scroller pour atteindre.
          clearProps: 'transform',
        }
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

// ─── useLoginCinematic ───────────────────────────────────────────────────────
// Anime l'entrée cinématique des pages de login : halo → panneau → carte.
// Usage :
//   const { haloRef, brandRef, cardRef } = useLoginCinematic();
//   <div ref={haloRef} />   ← halo décoratif principal
//   <div ref={brandRef} />  ← panneau gauche branding
//   <div ref={cardRef} />   ← carte glass formulaire
export function useLoginCinematic() {
  const haloRef  = useRef(null);
  const brandRef = useRef(null);
  const cardRef  = useRef(null);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = [haloRef.current, brandRef.current, cardRef.current].filter(Boolean);
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.from(targets, { opacity: 0, duration: 0.3 });
        return;
      }
      gsap.fromTo(haloRef.current,
        { scale: 0.3, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out' }
      );
      gsap.fromTo(brandRef.current,
        { x: -30, opacity: 0, scale: 0.97 },
        { x: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'expo.out', delay: 0.1 }
      );
      gsap.fromTo(cardRef.current,
        { y: 22, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1.0, ease: 'expo.out', delay: 0.35 }
      );
    });
    return () => ctx.revert();
  }, []);

  return { haloRef, brandRef, cardRef };
}
