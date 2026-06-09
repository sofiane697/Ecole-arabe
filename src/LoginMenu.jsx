import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

// Les 4 portails (réutilisé aussi par le menu mobile dans App.jsx)
export const PORTAILS = [
  { label: 'Élève',          ar: 'طالب',       href: '/portail/login' },
  { label: 'Enseignant',     ar: 'مُعلّم',      href: '/enseignant/login' },
  { label: 'Parent',         ar: 'وليّ الأمر',  href: '/parent/login' },
  { label: 'Administration', ar: 'إدارة',       href: '/admin/login' },
];

/**
 * Bouton « Me connecter » avec menu déroulant animé (GSAP) vers les 4 portails.
 * Se ferme au clic extérieur et avec la touche Échap.
 */
export default function LoginMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const chevronRef = useRef(null);

  // Fermeture : clic en dehors + touche Échap
  useEffect(() => {
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Animation d'ouverture / fermeture en GSAP
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.to(chevronRef.current, { rotation: open ? 180 : 0, duration: 0.3, ease: 'power3.out' });

    if (open) {
      gsap.set(panel, { display: 'block' });
      gsap.fromTo(panel, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power3.out' });
      gsap.fromTo(
        panel.querySelectorAll('.login-link'),
        { opacity: 0, y: -6 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power3.out', delay: 0.04 }
      );
    } else {
      gsap.to(panel, {
        opacity: 0, y: -8, duration: 0.18, ease: 'power2.in',
        onComplete: () => gsap.set(panel, { display: 'none' }),
      });
    }
  }, [open]);

  return (
    <div className="login-menu" ref={wrapRef}>
      <button
        type="button"
        className="login-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        Me connecter
        <svg
          ref={chevronRef}
          className="login-chevron"
          width="11" height="11" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div className="login-panel" ref={panelRef}>
        <div className="login-panel-title">Accéder à mon portail</div>
        {PORTAILS.map((p) => (
          <a key={p.href} href={p.href} className="login-link" onClick={() => setOpen(false)}>
            <span>{p.label}</span>
            <span className="login-link-ar">{p.ar}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
