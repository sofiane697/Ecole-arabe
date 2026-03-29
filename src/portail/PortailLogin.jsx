import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PORTAIL_STYLES from './portailStyles';
import { loginEleve, changePassword } from './supabasePortail';

// ─── Validation mot de passe ─────────────────────────────────────────────────
function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 8) errors.push('Minimum 8 caractères');
  if (!/\d/.test(pwd)) errors.push('Au moins 1 chiffre');
  if (!/[!@#$%^&*?_\-+=]/.test(pwd)) errors.push('Au moins 1 caractère spécial (!@#$%&*?_-+=)');
  return errors;
}

export default function PortailLogin() {
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Données élève après login (pour le changement de mot de passe)
  const [eleveData, setEleveData] = useState(null);

  // Changement de mot de passe
  const [mustChange, setMustChange] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [pwdErrors, setPwdErrors] = useState([]);

  useEffect(() => {
    const id = 'portail-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = PORTAIL_STYLES;
      document.head.appendChild(style);
    }
    document.body.style.background = '#000';
    return () => { document.body.style.background = ''; };
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('eleve_user')) {
      navigate('/portail');
    }
  }, [navigate]);

  // Valider le nouveau mot de passe en temps réel
  useEffect(() => {
    if (newPwd) setPwdErrors(validatePassword(newPwd));
    else setPwdErrors([]);
  }, [newPwd]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginEleve(identifiant.trim().toLowerCase(), password);

      // Vérifier si c'est la première connexion (mot de passe provisoire)
      if (data.must_change_password) {
        // Première connexion : forcer le changement
        setEleveData(data);
        setMustChange(true);
        setLoading(false);
        return;
      }

      navigate('/portail');
    } catch (err) {
      setError(err.message || 'Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setChangeError('');
    const errors = validatePassword(newPwd);
    if (errors.length > 0) { setChangeError('Le mot de passe ne respecte pas les critères.'); return; }
    if (newPwd !== confirmPwd) { setChangeError('Les mots de passe ne correspondent pas.'); return; }

    setChangeLoading(true);
    try {
      // Changer le mot de passe via la fonction SQL (auth custom)
      await changePassword(eleveData.id, password, newPwd);
      navigate('/portail');
    } catch(err) {
      setChangeError(err.message || 'Erreur lors du changement de mot de passe.');
    }
    setChangeLoading(false);
  };

  // ─── Écran changement de mot de passe ──────────────────────────────
  if (mustChange) {
    const allValid = pwdErrors.length === 0 && newPwd.length > 0 && newPwd === confirmPwd;
    return (
      <div className="portail-root portail-login-page">
        <div className="portail-login-card">
          <div className="portail-login-brand">
            <span className="arabic">جذور — GUZUR</span>
            <span className="label">Première connexion</span>
          </div>

          <p style={{ fontSize:13, color:'var(--p-fg-mid)', textAlign:'center', marginBottom:20, lineHeight:1.5 }}>
            Veuillez créer votre mot de passe personnel. Il remplacera le mot de passe provisoire.
          </p>

          <div className="portail-login-field">
            <label>Nouveau mot de passe</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 caractères" autoComplete="new-password" />
          </div>

          {/* Critères en temps réel */}
          <div style={{ marginBottom:16, padding:'0 2px' }}>
            {[
              { label: 'Minimum 8 caractères', ok: newPwd.length >= 8 },
              { label: 'Au moins 1 chiffre', ok: /\d/.test(newPwd) },
              { label: 'Au moins 1 caractère spécial', ok: /[!@#$%^&*?_\-+=]/.test(newPwd) },
            ].map((c, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: newPwd ? (c.ok ? 'var(--p-green)' : 'var(--p-red)') : 'var(--p-fg-light)', marginBottom:3 }}>
                <span>{newPwd ? (c.ok ? '✓' : '✕') : '○'}</span>
                {c.label}
              </div>
            ))}
          </div>

          <div className="portail-login-field">
            <label>Confirmer le mot de passe</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Retapez votre mot de passe" autoComplete="new-password" />
            {confirmPwd && newPwd !== confirmPwd && (
              <div style={{ fontSize:11, color:'var(--p-red)', marginTop:4 }}>Les mots de passe ne correspondent pas</div>
            )}
          </div>

          <button className="portail-login-btn" disabled={changeLoading || !allValid} onClick={handleChangePassword}>
            {changeLoading ? 'Modification...' : 'Valider mon mot de passe'}
          </button>

          {changeError && <div className="portail-login-error">{changeError}</div>}
        </div>
      </div>
    );
  }

  // ─── Écran de connexion ────────────────────────────────────────────
  return (
    <div className="portail-root portail-login-page">
      <div className="portail-login-card">
        <div className="portail-login-brand">
          <span className="arabic">جذور — GUZUR</span>
          <span className="label">Portail Élève</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="portail-login-field">
            <label>Identifiant</label>
            <input
              type="text"
              value={identifiant}
              onChange={e => setIdentifiant(e.target.value)}
              placeholder="Ex : KaM4827"
              autoComplete="username"
              required
              style={{ fontFamily:'monospace', fontSize:16, letterSpacing:1 }}
            />
          </div>

          <div className="portail-login-field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="portail-login-btn" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          {error && <div className="portail-login-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
