/**
 * Code partagé par les 4 pages de login : AdminLogin, EnseignantLogin,
 * ParentLogin et PortailLogin (élève).
 *
 * Le style "Liquid Glass Nuit Doré" — fond sombre + halos or, carte verre
 * translucide, animations GSAP cinématiques — est centralisé ici pour que
 * les 4 portails restent strictement cohérents visuellement.
 *
 * Conventions :
 *  - La page de login occupe 100vh sans sidebar ni topbar.
 *  - Le panneau gauche reçoit le ref d'animation `brandRef`.
 *  - La carte formulaire reçoit le ref d'animation `cardRef`.
 *  - Le halo principal reçoit le ref d'animation `haloRef`.
 *  - Le responsive (mobile <768px) est géré globalement dans
 *    `src/styles/admin-overrides.css` — aucune injection JS de <style> ici.
 */

import React, { useLayoutEffect } from 'react';

/* ════════════════════════════════════════════════════════════════════════════
   STYLES — Objet S partagé
   Toutes les tailles utilisent clamp(min, vw, max). Le max est atteint vers
   1900px de viewport, en dessous tout scale progressivement.
════════════════════════════════════════════════════════════════════════════ */

export const S = {
  page: {
    height: '100vh', display: 'flex', overflow: 'hidden', position: 'relative',
    background: 'linear-gradient(160deg, #0d0d16 0%, #0a0a12 55%, #100e07 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // ─── Halos décoratifs du fond ─────────────────────────────────────────────
  haloMain: {
    position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
    width: 'clamp(420px, 35.2vw, 682px)', height: 'clamp(420px, 35.2vw, 682px)',
    top: 'clamp(-154px, -7.7vw, -99px)', left: '50%', transform: 'translateX(-50%)',
    background: 'radial-gradient(circle, rgba(191,138,48,0.09) 0%, transparent 60%)',
  },
  haloBottom: {
    position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
    width: 'clamp(242px, 22vw, 418px)', height: 'clamp(242px, 22vw, 418px)',
    bottom: -100, right: '5%',
    background: 'radial-gradient(circle, rgba(191,138,48,0.06) 0%, transparent 60%)',
  },
  haloLeft: {
    position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
    width: 'clamp(176px, 14.3vw, 286px)', height: 'clamp(176px, 14.3vw, 286px)',
    top: '40%', left: -50,
    background: 'radial-gradient(circle, rgba(191,138,48,0.05) 0%, transparent 60%)',
  },

  // ─── Panneau gauche : branding + features ─────────────────────────────────
  brandPanel: {
    width: '50%', flexShrink: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(31px, 3.63vw, 70px) clamp(22px, 3.19vw, 62px)',
    boxSizing: 'border-box', position: 'relative',
    borderRight: '1px solid rgba(255,255,255,0.055)',
  },
  brandArabic: {
    fontFamily: "'Scheherazade New', serif", display: 'block',
    fontSize: 'clamp(48px, 4.4vw, 84px)', color: '#bf8a30', direction: 'rtl', lineHeight: 1.15,
    textAlign: 'center', marginBottom: 'clamp(5.5px, 0.55vw, 11px)',
    textShadow: '0 0 50px rgba(191,138,48,0.35), 0 0 100px rgba(191,138,48,0.15)',
  },
  brandName: {
    display: 'block', fontSize: 'clamp(11.5px, 0.81vw, 15.4px)', color: '#5e5e66',
    letterSpacing: 'clamp(3.3px, 0.26vw, 5px)',
    textTransform: 'uppercase', textAlign: 'center', marginBottom: 'clamp(15px, 1.62vw, 31px)',
  },
  brandDivider: {
    width: 'clamp(44px, 3.74vw, 70px)', height: 1.5, borderRadius: 2,
    margin: '0 auto clamp(22px, 2.1vw, 40px)',
    background: 'linear-gradient(90deg, transparent, #bf8a30, transparent)',
  },
  brandTitle: {
    fontSize: 'clamp(21px, 1.74vw, 33px)', fontWeight: 700, color: '#f0f0f5',
    textAlign: 'center', letterSpacing: -0.4, margin: '0 0 clamp(6.5px, 0.69vw, 13px)',
  },
  brandDesc: {
    fontSize: 'clamp(12.5px, 0.87vw, 16.5px)', color: '#7e7e86', textAlign: 'center',
    lineHeight: 1.75, maxWidth: 'clamp(253px, 19.7vw, 374px)',
    margin: '0 0 clamp(22px, 2.5vw, 48px)',
  },
  features: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 'clamp(9px, 0.81vw, 15px)', width: '100%',
    maxWidth: 'clamp(264px, 20.9vw, 396px)',
  },
  feat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 'clamp(5.5px, 0.58vw, 11px)',
    padding: 'clamp(12px, 1.28vw, 24px) clamp(9px, 0.92vw, 18px)',
    borderRadius: 'clamp(11px, 0.92vw, 18px)', textAlign: 'center',
    background: 'rgba(255,255,255,0.030)', border: '1px solid rgba(255,255,255,0.065)',
  },
  featIcon: {
    width: 'clamp(31px, 2.55vw, 48px)', height: 'clamp(31px, 2.55vw, 48px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 'clamp(9px, 0.69vw, 13px)',
    background: 'rgba(191,138,48,0.10)', border: '1px solid rgba(191,138,48,0.18)',
  },
  featLabel: { fontSize: 'clamp(11px, 0.75vw, 14px)', color: '#8e8e96', fontWeight: 500, lineHeight: 1.3 },

  // ─── Panneau droit : carte glass + formulaire ─────────────────────────────
  formPanel: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(22px, 2.78vw, 53px) clamp(18px, 2.55vw, 48px)',
  },
  card: {
    width: '100%', maxWidth: 'clamp(330px, 25.5vw, 484px)', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.052)',
    backdropFilter: 'blur(28px) saturate(1.6) brightness(1.05)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.6) brightness(1.05)',
    border: '1px solid rgba(255,255,255,0.09)', borderTop: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 'clamp(18px, 1.39vw, 26px)',
    padding: 'clamp(24px, 2.55vw, 48px) clamp(22px, 2.31vw, 44px)',
    boxShadow: '0 10px 50px rgba(0,0,0,0.45), 0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.09)',
  },
  cardBrand: { textAlign: 'center', marginBottom: 'clamp(15px, 1.62vw, 31px)' },
  cardArabic: {
    fontFamily: "'Scheherazade New', serif", display: 'block',
    fontSize: 'clamp(26px, 2.2vw, 42px)', color: '#bf8a30', direction: 'rtl',
    lineHeight: 1.3, marginBottom: 4,
    textShadow: '0 0 24px rgba(191,138,48,0.35)',
  },
  cardName: {
    display: 'block', fontSize: 'clamp(10.5px, 0.69vw, 13px)', color: '#5e5e66',
    letterSpacing: 'clamp(2.2px, 0.2vw, 3.85px)', textTransform: 'uppercase',
  },
  cardBadge: {
    display: 'inline-block', marginTop: 'clamp(7px, 0.69vw, 13px)',
    fontSize: 'clamp(10px, 0.64vw, 12px)', fontWeight: 700,
    letterSpacing: 1.5, textTransform: 'uppercase',
    padding: 'clamp(3.3px, 0.29vw, 5.5px) clamp(10px, 0.81vw, 15px)',
    borderRadius: 20, background: 'rgba(191,138,48,0.12)',
    border: '1px solid rgba(191,138,48,0.22)', color: '#c99a38',
  },

  // ─── Champs et boutons ────────────────────────────────────────────────────
  field: { marginBottom: 'clamp(10px, 0.92vw, 18px)' },
  label: {
    display: 'block', fontSize: 'clamp(10.5px, 0.69vw, 13px)', fontWeight: 600,
    color: '#8e8e96', textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 'clamp(4.5px, 0.4vw, 8px)',
  },
  input: {
    width: '100%',
    padding: 'clamp(10px, 0.81vw, 15px) clamp(12px, 1.04vw, 20px)',
    borderRadius: 'clamp(9px, 0.69vw, 13px)',
    border: '1px solid rgba(255,255,255,0.085)', background: 'rgba(255,255,255,0.055)',
    color: '#f0f0f5', fontSize: 'clamp(13.5px, 0.87vw, 16.5px)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
  },
  inputMono: { fontFamily: "'JetBrains Mono', 'SF Mono', monospace", letterSpacing: 1 },
  inputPr: {
    width: '100%',
    padding: 'clamp(10px, 0.81vw, 15px) clamp(37px, 2.78vw, 53px) clamp(10px, 0.81vw, 15px) clamp(12px, 1.04vw, 20px)',
    borderRadius: 'clamp(9px, 0.69vw, 13px)',
    border: '1px solid rgba(255,255,255,0.085)', background: 'rgba(255,255,255,0.055)',
    color: '#f0f0f5', fontSize: 'clamp(13.5px, 0.87vw, 16.5px)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
  },
  eyeBtn: {
    position: 'absolute', right: 'clamp(10px, 0.81vw, 15px)', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#4e4e56',
    padding: 4, display: 'flex', alignItems: 'center',
  },
  btn: (disabled) => ({
    width: '100%', padding: 'clamp(11px, 0.87vw, 16.5px)',
    borderRadius: 980, border: 'none', marginTop: 'clamp(5.5px, 0.46vw, 9px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 'clamp(13.5px, 0.87vw, 16.5px)', fontWeight: 700,
    fontFamily: 'inherit', color: '#fff', letterSpacing: 0.2, transition: 'opacity .2s',
    background: disabled ? '#3a3a3c' : 'linear-gradient(135deg, #bf8a30 0%, #d4a843 60%, #c49030 100%)',
    boxShadow: disabled ? 'none' : '0 4px 18px rgba(191,138,48,0.32), inset 0 1px 0 rgba(255,255,255,0.25)',
  }),

  // ─── Feedback (erreurs, hints, critères mot de passe) ─────────────────────
  error:    { marginTop: 'clamp(9px, 0.81vw, 15px)', color: '#ff453a', fontSize: 'clamp(12.5px, 0.78vw, 15px)', textAlign: 'center' },
  hint:     { textAlign: 'center', fontSize: 'clamp(11.5px, 0.73vw, 14px)', color: '#4a4a52', marginTop: 'clamp(12px, 1.15vw, 22px)', paddingTop: 'clamp(12px, 1.04vw, 20px)', borderTop: '1px solid rgba(255,255,255,0.055)', lineHeight: 1.5 },
  criteria: (ok, typed) => ({ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: typed ? (ok ? '#30d158' : '#ff453a') : '#6e6e73', marginBottom: 3 }),
  mismatch: { fontSize: 11, color: '#ff453a', marginTop: 4 },
  info:     { fontSize: 13, color: '#a1a1a6', textAlign: 'center', marginBottom: 22, lineHeight: 1.6 },
};

/* ════════════════════════════════════════════════════════════════════════════
   COMPOSANTS PARTAGÉS
════════════════════════════════════════════════════════════════════════════ */

// ─── Icône œil (afficher/masquer mot de passe) ──────────────────────────────
export const EyeIcon = ({ open }) => open
  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

// ─── Panneau gauche (logo arabe + titre + description + features) ──────────
// `panelClass` permet de cibler le portail (`portail-brand-panel`, etc.)
// pour les overrides CSS (responsive, focus, autofill).
export function BrandPanel({ brandRef, panelClass, title, description, features, showFeatures }) {
  return (
    <div className={panelClass} ref={brandRef} style={S.brandPanel}>
      <span style={S.brandName}>Educamoov</span>
      <div style={S.brandDivider} />
      <h1 style={S.brandTitle}>{title}</h1>
      <p style={S.brandDesc}>{description}</p>
      {showFeatures && features && (
        <div style={S.features}>
          {features.map((f, i) => (
            <div key={i} style={S.feat}>
              <div style={S.featIcon}>{f.icon}</div>
              <span style={S.featLabel}>{f.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Liste des 3 critères de validation du mot de passe (avec ✓/✕/○) ────────
export function PasswordCriteriaList({ pwd }) {
  const items = [
    { label: 'Minimum 8 caractères',         ok: pwd.length >= 8 },
    { label: 'Au moins 1 chiffre',           ok: /\d/.test(pwd) },
    { label: 'Au moins 1 caractère spécial', ok: /[!@#$%^&*?_\-+=]/.test(pwd) },
  ];
  const typed = pwd.length > 0;
  return (
    <div style={{ marginBottom: 14 }}>
      {items.map((c, i) => (
        <div key={i} style={S.criteria(c.ok, typed)}>
          <span>{typed ? (c.ok ? '✓' : '✕') : '○'}</span>{c.label}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   UTILITAIRES
════════════════════════════════════════════════════════════════════════════ */

// Validation des règles de mot de passe (min 8, 1 chiffre, 1 spécial)
export function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 8) errors.push('Minimum 8 caractères');
  if (!/\d/.test(pwd)) errors.push('Au moins 1 chiffre');
  if (!/[!@#$%^&*?_\-+=]/.test(pwd)) errors.push('Au moins 1 caractère spécial (!@#$%&*?_-+=)');
  return errors;
}

// Verrouille le scroll du body pendant l'affichage du login.
// Option `removeDark` : retire la classe `dark` du <html> (utile pour admin
// qui partage le thème dark/light avec le reste de l'app admin).
export function useLoginBody({ removeDark = false } = {}) {
  useLayoutEffect(() => {
    if (removeDark) document.documentElement.classList.remove('dark');
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [removeDark]);
}
