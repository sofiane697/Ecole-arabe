import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginEleve, changePassword } from './supabasePortail';

function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 8) errors.push('Minimum 8 caractères');
  if (!/\d/.test(pwd)) errors.push('Au moins 1 chiffre');
  if (!/[!@#$%^&*?_\-+=]/.test(pwd)) errors.push('Au moins 1 caractère spécial (!@#$%&*?_-+=)');
  return errors;
}

const EyeIcon = ({ open }) => open
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const IconCours = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconDevoir = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconResultat = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconMessage = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FEATURES = [
  { icon: <IconCours />,    label: 'Cours & leçons' },
  { icon: <IconDevoir />,   label: 'Devoirs & exercices' },
  { icon: <IconResultat />, label: 'Notes & résultats' },
  { icon: <IconMessage />,  label: 'Messages & suivi' },
];

function BrandPanel({ subtitle }) {
  return (
    <div
      className="portail-brand-panel"
      style={{
        width: '50%',
        height: '100vh',
        background: 'linear-gradient(160deg, #0f0f0f 0%, #0a0a0a 60%, #111008 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Halo décoratif */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(191,138,48,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo arabe */}
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }}>
        <span style={{
          display: 'block',
          fontFamily: "'Scheherazade New', serif",
          fontSize: 52, color: '#bf8a30', direction: 'rtl',
          lineHeight: 1.2, letterSpacing: 1,
          textShadow: '0 0 40px rgba(191,138,48,0.30)',
        }}>الصفاء</span>
        <span style={{
          display: 'block', fontSize: 13, color: '#6e6e73',
          letterSpacing: 4, textTransform: 'uppercase', marginTop: 6,
        }}>Institut As-Safaa</span>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(90deg, transparent, #bf8a30, transparent)',
          margin: '20px auto 0', borderRadius: 2,
        }} />
      </div>

      {/* Titre */}
      <h1 style={{
        fontFamily: "var(--p-font-display, 'Plus Jakarta Sans', 'Inter', sans-serif)",
        fontSize: 22, fontWeight: 700, color: '#f5f5f7',
        textAlign: 'center', margin: '0 0 14px', letterSpacing: 0.3,
      }}>{subtitle}</h1>

      {/* Description */}
      <p style={{
        fontSize: 14, color: '#a1a1a6', textAlign: 'center',
        lineHeight: 1.7, maxWidth: 320, margin: '0 0 48px',
      }}>
        Retrouvez vos cours, suivez votre progression et communiquez avec vos enseignants.
      </p>

      {/* Grille 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 320 }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 10, padding: '20px 16px', borderRadius: 14,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            textAlign: 'center',
          }}>
            {f.icon}
            <span style={{ fontSize: 12, color: '#a1a1a6', fontWeight: 500, lineHeight: 1.4 }}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortailLogin() {
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const [eleveData, setEleveData]         = useState(null);
  const [mustChange, setMustChange]       = useState(false);
  const [newPwd, setNewPwd]               = useState('');
  const [confirmPwd, setConfirmPwd]       = useState('');
  const [changeError, setChangeError]     = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [pwdErrors, setPwdErrors]         = useState([]);

  const [showPwd, setShowPwd]             = useState(false);
  const [showNewPwd, setShowNewPwd]       = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  useLayoutEffect(() => {
    document.body.style.background = '#000';
    document.body.style.overflow   = 'hidden';
    return () => {
      document.body.style.background = '';
      document.body.style.overflow   = '';
    };
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('eleve_user')) navigate('/portail');
  }, [navigate]);

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
      if (data.must_change_password) {
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
    if (validatePassword(newPwd).length > 0) { setChangeError('Le mot de passe ne respecte pas les critères.'); return; }
    if (newPwd !== confirmPwd) { setChangeError('Les mots de passe ne correspondent pas.'); return; }
    setChangeLoading(true);
    try {
      await changePassword(eleveData.id, password, newPwd);
      navigate('/portail');
    } catch (err) {
      setChangeError(err.message || 'Erreur lors du changement de mot de passe.');
    }
    setChangeLoading(false);
  };

  const S = {
    criteria: (ok, typed) => ({ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: typed ? (ok ? '#30d158' : '#ff453a') : '#6e6e73', marginBottom: 3 }),
  };

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={toggle} aria-label={show ? 'Masquer' : 'Afficher'}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6e6e73', padding: 4, display: 'flex', alignItems: 'center' }}>
      <EyeIcon open={show} />
    </button>
  );

  /* ── Écran changement de mot de passe (1ère connexion) ── */
  if (mustChange) {
    const allValid = pwdErrors.length === 0 && newPwd.length > 0 && newPwd === confirmPwd;
    return (
      <div className="admin-root" style={{ height: '100vh', display: 'flex', flexDirection: 'row', background: '#000', overflow: 'hidden' }}>
        <BrandPanel subtitle="Première connexion" />
        <div className="portail-form-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div className="portail-login-card">
            <div className="portail-login-brand">
              <span style={{ display: 'flex', flexDirection: 'column', fontFamily: "'Scheherazade New', serif", fontSize: 28, color: '#bf8a30', lineHeight: 1.4 }}>
                <span>Institut As-Safaa</span>
                <span style={{ textAlign: 'right' }}>الصفاء</span>
              </span>
              <span className="label">Première connexion</span>
            </div>
            <p style={{ fontSize: 13, color: '#a1a1a6', textAlign: 'center', marginBottom: 22, lineHeight: 1.6 }}>
              Créez votre mot de passe personnel.<br />Il remplacera le mot de passe provisoire.
            </p>
            <div className="portail-login-field">
              <label>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input style={{ paddingRight: 42 }} type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 caractères" autoComplete="new-password" />
                {eyeBtn(showNewPwd, () => setShowNewPwd(v => !v))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              {[
                { label: 'Minimum 8 caractères',      ok: newPwd.length >= 8 },
                { label: 'Au moins 1 chiffre',         ok: /\d/.test(newPwd) },
                { label: 'Au moins 1 caractère spécial', ok: /[!@#$%^&*?_\-+=]/.test(newPwd) },
              ].map((c, i) => (
                <div key={i} style={S.criteria(c.ok, newPwd.length > 0)}>
                  <span>{newPwd ? (c.ok ? '✓' : '✕') : '○'}</span>{c.label}
                </div>
              ))}
            </div>
            <div className="portail-login-field">
              <label>Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input style={{ paddingRight: 42 }} type={showConfirmPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Retapez votre mot de passe" autoComplete="new-password" />
                {eyeBtn(showConfirmPwd, () => setShowConfirmPwd(v => !v))}
              </div>
              {confirmPwd && newPwd !== confirmPwd && (
                <div style={{ fontSize: 11, color: '#ff453a', marginTop: 4 }}>Les mots de passe ne correspondent pas</div>
              )}
            </div>
            <button
              className="portail-login-btn"
              disabled={!allValid || changeLoading}
              onClick={handleChangePassword}
              style={!allValid || changeLoading ? { background: '#3a3a3c', color: '#6e6e73', cursor: 'not-allowed' } : {}}
            >
              {changeLoading ? 'Modification...' : 'Valider mon mot de passe'}
            </button>
            {changeError && <div className="portail-login-error">{changeError}</div>}
          </div>
        </div>
      </div>
    );
  }

  /* ── Écran de connexion ── */
  return (
    <div className="admin-root" style={{ height: '100vh', display: 'flex', flexDirection: 'row', background: '#000', overflow: 'hidden' }}>
      <BrandPanel subtitle="Portail Élève" />
      <div className="portail-form-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div className="portail-login-card">
          <div className="portail-login-brand">
            <span style={{ display: 'flex', flexDirection: 'column', fontFamily: "'Scheherazade New', serif", fontSize: 28, color: '#bf8a30', lineHeight: 1.4 }}>
              <span>Institut As-Safaa</span>
              <span style={{ textAlign: 'right' }}>الصفاء</span>
            </span>
            <span className="label">Portail Élève</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="portail-login-field">
              <label>Identifiant</label>
              <input
                style={{ fontFamily: "var(--p-font-mono, 'JetBrains Mono', monospace)", fontSize: 15, letterSpacing: 1 }}
                type="text"
                value={identifiant}
                onChange={e => setIdentifiant(e.target.value)}
                placeholder="Ex : KaM4827"
                autoComplete="username"
                required
              />
            </div>
            <div className="portail-login-field">
              <label>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ paddingRight: 42 }}
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                {eyeBtn(showPwd, () => setShowPwd(v => !v))}
              </div>
            </div>
            <button className="portail-login-btn" type="submit" disabled={loading}
              style={loading ? { background: '#3a3a3c', color: '#6e6e73', cursor: 'not-allowed' } : {}}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            {error && <div className="portail-login-error">{error}</div>}
          </form>
          <div style={{ color: '#6e6e73', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            Utilisez les identifiants fournis par l'administrateur.
          </div>
        </div>
      </div>
    </div>
  );
}
