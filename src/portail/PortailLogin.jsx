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
      className="portail-brand-panel w-1/2 h-screen flex flex-col items-center justify-center px-12 py-[60px] box-border relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0f0f0f 0%, #0a0a0a 60%, #111008 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Halo décoratif */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(191,138,48,0.10) 0%, transparent 70%)',
      }} />

      {/* Logo arabe */}
      <div className="text-center mb-10 relative">
        <span className="block leading-[1.2] tracking-[1px]" style={{
          fontFamily: "'Scheherazade New', serif",
          fontSize: 52, color: '#bf8a30', direction: 'rtl',
          textShadow: '0 0 40px rgba(191,138,48,0.30)',
        }}>الصفاء</span>
        <span className="block text-[13px] text-[#6e6e73] tracking-[4px] uppercase mt-1.5">Institut As-Safaa</span>
        <div className="w-12 h-0.5 rounded-sm mx-auto mt-5" style={{
          background: 'linear-gradient(90deg, transparent, #bf8a30, transparent)',
        }} />
      </div>

      {/* Titre */}
      <h1 className="text-[22px] font-bold text-[#f5f5f7] text-center mb-3.5 tracking-[0.3px]" style={{
        fontFamily: "var(--p-font-display, 'Plus Jakarta Sans', 'Inter', sans-serif)",
        margin: '0 0 14px',
      }}>{subtitle}</h1>

      {/* Description */}
      <p className="text-sm text-[#a1a1a6] text-center leading-[1.7] max-w-[320px]" style={{ margin: '0 0 48px' }}>
        Retrouvez vos cours, suivez votre progression et communiquez avec vos enseignants.
      </p>

      {/* Grille 2×2 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[320px]">
        {FEATURES.map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5 py-5 px-4 rounded-[14px] text-center" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {f.icon}
            <span className="text-xs text-[#a1a1a6] font-medium leading-[1.4]">{f.label}</span>
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
    const mediaId = 'portail-login-media';
    if (!document.getElementById(mediaId)) {
      const mediaStyle = document.createElement('style');
      mediaStyle.id = mediaId;
      mediaStyle.textContent = `
        @media (max-width: 767px) {
          .portail-brand-panel { display: none !important; }
          .portail-form-panel  { padding: 24px 20px !important; }
        }
      `;
      document.head.appendChild(mediaStyle);
    }
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
    card:  'rounded-[18px] w-full max-w-[400px] box-border',
    cardStyle: { background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', padding: '40px 36px' },
    brand: 'text-center mb-8',
    brandArabic: 'flex flex-col leading-[1.4]',
    brandArabicStyle: { fontFamily: "'Scheherazade New', serif", fontSize: 28, color: '#bf8a30' },
    brandLabel: 'block text-xs text-[#6e6e73] mt-1.5 tracking-[1px] uppercase',
    field: 'mb-[18px]',
    label: 'block text-xs font-semibold text-[#a1a1a6] mb-[7px] uppercase tracking-[0.5px]',
    input: 'w-full rounded-[10px] text-[#f5f5f7] text-sm outline-none box-border',
    inputStyle: { padding: '11px 14px', border: '1px solid rgba(255,255,255,0.1)', background: '#2c2c2e' },
    btn: (disabled) => ({ width: '100%', padding: '13px', borderRadius: 980, border: 'none', background: disabled ? '#3a3a3c' : '#bf8a30', color: disabled ? '#6e6e73' : '#fff', fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', marginTop: 8, transition: 'background .2s' }),
    error: 'mt-3.5 rounded-[10px] text-[#ff453a] text-[13px] text-center',
    errorStyle: { padding: '10px 14px', background: 'rgba(255,69,58,.1)', border: '1px solid rgba(255,69,58,.25)' },
    hint: 'text-[#6e6e73] text-xs text-center mt-5 leading-[1.6] pt-4',
    hintStyle: { borderTop: '1px solid rgba(255,255,255,0.06)' },
    criteria: (ok, typed) => ({ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: typed ? (ok ? '#30d158' : '#ff453a') : '#6e6e73', marginBottom: 3 }),
  };

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={toggle} aria-label={show ? 'Masquer' : 'Afficher'}
      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#6e6e73] p-1 flex items-center">
      <EyeIcon open={show} />
    </button>
  );

  /* ── Écran changement de mot de passe (1ère connexion) ── */
  if (mustChange) {
    const allValid = pwdErrors.length === 0 && newPwd.length > 0 && newPwd === confirmPwd;
    return (
      <div className="admin-root h-screen flex bg-black overflow-hidden">
        <BrandPanel subtitle="Première connexion" />
        <div className="portail-form-panel flex-1 flex items-center justify-center p-10">
          <div className={S.card} style={S.cardStyle}>
            <div className={S.brand}>
              <span className={S.brandArabic} style={S.brandArabicStyle}>
                <span>Institut As-Safaa</span>
                <span className="text-right">الصفاء</span>
              </span>
              <span className={S.brandLabel}>Première connexion</span>
            </div>
            <p className="text-[13px] text-[#a1a1a6] text-center mb-[22px] leading-[1.6]">
              Créez votre mot de passe personnel.<br />Il remplacera le mot de passe provisoire.
            </p>
            <div className={S.field}>
              <label className={S.label}>Nouveau mot de passe</label>
              <div className="relative">
                <input className={S.input} style={{ ...S.inputStyle, paddingRight: 42 }} type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 caractères" autoComplete="new-password" />
                {eyeBtn(showNewPwd, () => setShowNewPwd(v => !v))}
              </div>
            </div>
            <div className="mb-4">
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
            <div className={S.field}>
              <label className={S.label}>Confirmer le mot de passe</label>
              <div className="relative">
                <input className={S.input} style={{ ...S.inputStyle, paddingRight: 42 }} type={showConfirmPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Retapez votre mot de passe" autoComplete="new-password" />
                {eyeBtn(showConfirmPwd, () => setShowConfirmPwd(v => !v))}
              </div>
              {confirmPwd && newPwd !== confirmPwd && (
                <div className="text-[11px] text-[#ff453a] mt-1">Les mots de passe ne correspondent pas</div>
              )}
            </div>
            <button style={S.btn(!allValid || changeLoading)} disabled={!allValid || changeLoading} onClick={handleChangePassword}>
              {changeLoading ? 'Modification...' : 'Valider mon mot de passe'}
            </button>
            {changeError && <div className={S.error} style={S.errorStyle}>{changeError}</div>}
          </div>
        </div>
      </div>
    );
  }

  /* ── Écran de connexion ── */
  return (
    <div className="admin-root h-screen flex bg-black overflow-hidden">
      <BrandPanel subtitle="Portail Élève" />
      <div className="portail-form-panel flex-1 flex items-center justify-center p-10">
        <div className={S.card} style={S.cardStyle}>
          <div className={S.brand}>
            <span className={S.brandArabic} style={S.brandArabicStyle}>
              <span>Institut As-Safaa</span>
              <span className="text-right">الصفاء</span>
            </span>
            <span className={S.brandLabel}>Portail Élève</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={S.field}>
              <label className={S.label}>Identifiant</label>
              <input
                className={`${S.input} text-[15px] tracking-[1px]`}
                style={{ ...S.inputStyle, fontFamily: "var(--p-font-mono, 'JetBrains Mono', monospace)" }}
                type="text"
                value={identifiant}
                onChange={e => setIdentifiant(e.target.value)}
                placeholder="Ex : KaM4827"
                autoComplete="username"
                required
              />
            </div>
            <div className={S.field}>
              <label className={S.label}>Mot de passe</label>
              <div className="relative">
                <input
                  className={S.input}
                  style={{ ...S.inputStyle, paddingRight: 42 }}
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
            <button style={S.btn(loading)} type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            {error && <div className={S.error} style={S.errorStyle}>{error}</div>}
          </form>
          <div className={S.hint} style={S.hintStyle}>Utilisez les identifiants fournis par l'administrateur.</div>
        </div>
      </div>
    </div>
  );
}
