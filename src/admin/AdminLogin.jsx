/**
 * Portail Administration — page de connexion.
 * Layout, styles et composants partagés viennent de `src/shared/loginShared.jsx`.
 * Ici on garde uniquement ce qui est spécifique à l'admin :
 *   - icônes de features (élèves, cours, messages, dashboard)
 *   - logique d'authentification (loginAdmin)
 *
 * Particularités vs les 3 autres portails :
 *   - Pas de vue "Première connexion" (l'admin ne change pas son MDP depuis ici)
 *   - `useLoginBody({ removeDark: true })` pour retirer la classe `dark` du
 *     <html> qui peut être héritée du layout admin.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from './supabaseAdmin';
import { useLoginCinematic } from '../animations';
import { S, EyeIcon, BrandPanel, useLoginBody } from '../shared/loginShared';

/* ─── Icônes des features (panneau gauche) ───────────────────────────────── */

const IconStudents = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCourses = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IconMessages = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconStats = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const FEATURES = [
  { icon: <IconStudents />, label: 'Élèves & enseignants' },
  { icon: <IconCourses />,  label: 'Cours & contenu' },
  { icon: <IconMessages />, label: 'Messages & inscriptions' },
  { icon: <IconStats />,    label: 'Tableau de bord' },
];

/* ─── Composant principal ────────────────────────────────────────────────── */

export default function AdminLogin() {
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPwd, setShowPwd]         = useState(false);

  // ─ Hooks partagés ─
  const { haloRef, brandRef, cardRef } = useLoginCinematic();
  useLoginBody({ removeDark: true });

  /* ─── Handler ──────────────────────────────────────────────────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await loginAdmin(identifiant, password);
      navigate('/admin');
    } catch {
      setError('Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Rendu ────────────────────────────────────────────────────────────── */

  return (
    <div style={S.page}>
      <div ref={haloRef} style={S.haloMain} />
      <div style={S.haloBottom} /><div style={S.haloLeft} />

      <BrandPanel
        brandRef={brandRef}
        panelClass="admin-brand-panel"
        title="Portail Administration"
        description="Gérez les élèves, les enseignants, les inscriptions et le contenu pédagogique."
        features={FEATURES}
        showFeatures={true}
      />

      <div className="admin-form-panel" style={S.formPanel}>
        <div ref={cardRef} style={S.card}>
          <div style={S.cardBrand}>
            <span style={S.cardArabic}>الصفاء</span>
            <span style={S.cardName}>Institut As-Safaa</span>
            <span style={S.cardBadge}>Administration</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={S.field}>
              <label style={S.label}>Identifiant</label>
              <input style={S.input} type="text" value={identifiant}
                     onChange={e => { setIdentifiant(e.target.value); setError(''); }}
                     placeholder="admin" autoComplete="username" required />
            </div>

            <div style={S.field}>
              <label style={S.label}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input style={S.inputPr} type={showPwd ? 'text' : 'password'} value={password}
                       onChange={e => { setPassword(e.target.value); setError(''); }}
                       placeholder="••••••••" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                        aria-label={showPwd ? 'Masquer' : 'Afficher'} style={S.eyeBtn}>
                  <EyeIcon open={showPwd} />
                </button>
              </div>
            </div>

            <button style={S.btn(loading)} type="submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            {error && <div style={S.error}>{error}</div>}
          </form>

          <div style={S.hint}>Accès réservé aux administrateurs.</div>
        </div>
      </div>
    </div>
  );
}
