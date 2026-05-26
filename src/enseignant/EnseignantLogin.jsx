/**
 * Portail Enseignant — page de connexion.
 * Layout, styles et composants partagés viennent de `src/shared/loginShared.jsx`.
 * Ici on garde uniquement ce qui est spécifique aux enseignants :
 *   - icônes de features (classes, devoirs, notes, messages)
 *   - logique d'authentification (loginEnseignant, changeEnseignantPassword)
 *   - gestion de la vue "Première connexion"
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginEnseignant, changeEnseignantPassword } from './supabaseEnseignant';
import { useLoginCinematic } from '../animations';
import {
  S, EyeIcon, BrandPanel, PasswordCriteriaList,
  validatePassword, useLoginBody,
} from '../shared/loginShared';

/* ─── Icônes des features (panneau gauche) ───────────────────────────────── */

const IconClasse = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconDevoir = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconNote = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconMessage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FEATURES = [
  { icon: <IconClasse />,  label: 'Gestion des classes' },
  { icon: <IconDevoir />,  label: 'Devoirs & exercices' },
  { icon: <IconNote />,    label: 'Notes & évaluations' },
  { icon: <IconMessage />, label: 'Messages & suivi' },
];

/* ─── Composant principal ────────────────────────────────────────────────── */

export default function EnseignantLogin() {
  const navigate = useNavigate();

  // ─ État du formulaire de connexion ─
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPwd, setShowPwd]         = useState(false);

  // ─ État du formulaire "première connexion" ─
  const [ensData, setEnsData]               = useState(null);
  const [mustChange, setMustChange]         = useState(false);
  const [newPwd, setNewPwd]                 = useState('');
  const [confirmPwd, setConfirmPwd]         = useState('');
  const [changeError, setChangeError]       = useState('');
  const [changeLoading, setChangeLoading]   = useState(false);
  const [pwdErrors, setPwdErrors]           = useState([]);
  const [showNewPwd, setShowNewPwd]         = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // ─ Hooks partagés ─
  const { haloRef, brandRef, cardRef } = useLoginCinematic();
  useLoginBody();

  // ─ Redirection si déjà connecté ─
  useEffect(() => {
    if (sessionStorage.getItem('enseignant_user')) navigate('/enseignant');
  }, [navigate]);

  // ─ Validation live du nouveau mot de passe ─
  useEffect(() => {
    setPwdErrors(newPwd ? validatePassword(newPwd) : []);
  }, [newPwd]);

  /* ─── Handlers ─────────────────────────────────────────────────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await loginEnseignant(identifiant.trim().toLowerCase(), password);
      if (data.must_change_password) { setEnsData(data); setMustChange(true); return; }
      navigate('/enseignant');
    } catch (err) {
      setError(err.message || 'Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setChangeError('');
    if (validatePassword(newPwd).length > 0) {
      setChangeError('Le mot de passe ne respecte pas les critères.'); return;
    }
    if (newPwd !== confirmPwd) {
      setChangeError('Les mots de passe ne correspondent pas.'); return;
    }
    setChangeLoading(true);
    try {
      await changeEnseignantPassword(ensData.id, password, newPwd);
      navigate('/enseignant');
    } catch (err) {
      setChangeError(err.message || 'Erreur lors du changement de mot de passe.');
    }
    setChangeLoading(false);
  };

  /* ─── Vue "Première connexion" ─────────────────────────────────────────── */

  if (mustChange) {
    const allValid = pwdErrors.length === 0 && newPwd.length > 0 && newPwd === confirmPwd;
    return (
      <div style={S.page}>
        <div ref={haloRef} style={S.haloMain} />
        <div style={S.haloBottom} /><div style={S.haloLeft} />

        <BrandPanel
          brandRef={brandRef}
          panelClass="ens-brand-panel"
          title="Première connexion"
          description="Créez votre mot de passe personnel pour sécuriser votre compte."
          showFeatures={false}
        />

        <div className="ens-form-panel" style={S.formPanel}>
          <div ref={cardRef} style={S.card}>
            <div style={S.cardBrand}>
              <span style={S.cardArabic}>الصفاء</span>
              <span style={S.cardName}>Institut As-Safaa</span>
              <span style={S.cardBadge}>Première connexion</span>
            </div>

            <p style={S.info}>Créez votre mot de passe personnel.<br />Il remplacera le mot de passe provisoire.</p>

            <div style={S.field}>
              <label style={S.label}>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input style={S.inputPr} type={showNewPwd ? 'text' : 'password'} value={newPwd}
                       onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 caractères" autoComplete="new-password" />
                <button type="button" onClick={() => setShowNewPwd(v => !v)}
                        aria-label={showNewPwd ? 'Masquer' : 'Afficher'} style={S.eyeBtn}>
                  <EyeIcon open={showNewPwd} />
                </button>
              </div>
            </div>

            <PasswordCriteriaList pwd={newPwd} />

            <div style={S.field}>
              <label style={S.label}>Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input style={S.inputPr} type={showConfirmPwd ? 'text' : 'password'} value={confirmPwd}
                       onChange={e => setConfirmPwd(e.target.value)} placeholder="Retapez votre mot de passe" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirmPwd(v => !v)}
                        aria-label={showConfirmPwd ? 'Masquer' : 'Afficher'} style={S.eyeBtn}>
                  <EyeIcon open={showConfirmPwd} />
                </button>
              </div>
              {confirmPwd && newPwd !== confirmPwd && <div style={S.mismatch}>Les mots de passe ne correspondent pas</div>}
            </div>

            <button style={S.btn(!allValid || changeLoading)} disabled={!allValid || changeLoading} onClick={handleChangePassword}>
              {changeLoading ? 'Modification...' : 'Valider mon mot de passe'}
            </button>
            {changeError && <div style={S.error}>{changeError}</div>}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Vue connexion standard ───────────────────────────────────────────── */

  return (
    <div style={S.page}>
      <div ref={haloRef} style={S.haloMain} />
      <div style={S.haloBottom} /><div style={S.haloLeft} />

      <BrandPanel
        brandRef={brandRef}
        panelClass="ens-brand-panel"
        title="Portail Enseignant"
        description="Suivez vos classes, gérez les devoirs, notez vos élèves et communiquez avec eux."
        features={FEATURES}
        showFeatures={true}
      />

      <div className="ens-form-panel" style={S.formPanel}>
        <div ref={cardRef} style={S.card}>
          <div style={S.cardBrand}>
            <span style={S.cardArabic}>الصفاء</span>
            <span style={S.cardName}>Institut As-Safaa</span>
            <span style={S.cardBadge}>Portail Enseignant</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={S.field}>
              <label style={S.label}>Identifiant</label>
              <input style={{ ...S.input, ...S.inputMono }} type="text" value={identifiant}
                     onChange={e => { setIdentifiant(e.target.value); setError(''); }}
                     placeholder="Ex : SoD1234" autoComplete="username" required />
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
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            {error && <div style={S.error}>{error}</div>}
          </form>

          <div style={S.hint}>Utilisez les identifiants fournis par l'administrateur.</div>
        </div>
      </div>
    </div>
  );
}
