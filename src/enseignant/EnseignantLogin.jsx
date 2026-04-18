import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginEnseignant, changeEnseignantPassword } from './supabaseEnseignant';

const EyeIcon = ({ open }) => open
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

/* ── Icônes SVG pour le panneau de marque ── */
const IconClasse = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconDevoir = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconNote = () => (
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
  { icon: <IconClasse />,  label: 'Gestion des classes' },
  { icon: <IconDevoir />,  label: 'Devoirs & exercices' },
  { icon: <IconNote />,    label: 'Notes & évaluations' },
  { icon: <IconMessage />, label: 'Messages & suivi' },
];

/* ── Panneau gauche partagé entre les deux vues ── */
function BrandPanel({ subtitle }) {
  return (
    <div
      className="ens-brand-panel w-1/2 h-screen flex flex-col items-center justify-center px-12 py-[60px] box-border relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0f0f0f 0%, #0a0a0a 60%, #111008 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Halo décoratif */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(191,138,48,0.10) 0%, transparent 70%)' }} />

      {/* Logo arabe */}
      <div className="text-center mb-10 relative">
        <span className="block font-arabic text-[52px] leading-[1.2] tracking-[1px] text-a-gold"
          style={{ direction: 'rtl', textShadow: '0 0 40px rgba(191,138,48,0.30)' }}>
          الصفاء
        </span>
        <span className="block text-[13px] tracking-[4px] uppercase mt-1.5 text-a-fg-light">
          Institut As-Safaa
        </span>
        {/* Séparateur */}
        <div className="w-12 h-[2px] rounded-sm mx-auto mt-5"
          style={{ background: 'linear-gradient(90deg, transparent, #bf8a30, transparent)' }} />
      </div>

      {/* Titre portail */}
      <h1 className="font-a-display text-[22px] font-bold text-center tracking-[0.3px] text-a-fg m-0 mb-3.5">
        {subtitle}
      </h1>

      {/* Description */}
      <p className="text-sm text-center leading-[1.7] max-w-[320px] text-a-fg-mid m-0 mb-12">
        Suivez vos classes, gérez les devoirs, les notes et communiquez avec vos élèves.
      </p>

      {/* Grille de fonctionnalités */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[320px]">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2.5 py-5 px-4 rounded-[14px] text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {f.icon}
            <span className="text-xs font-medium leading-[1.4] text-a-fg-mid">
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 8) errors.push('Minimum 8 caractères');
  if (!/\d/.test(pwd)) errors.push('Au moins 1 chiffre');
  if (!/[!@#$%^&*?_\-+=]/.test(pwd)) errors.push('Au moins 1 caractère spécial (!@#$%&*?_-+=)');
  return errors;
}

export default function EnseignantLogin() {
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const [ensData, setEnsData]         = useState(null);
  const [mustChange, setMustChange]   = useState(false);
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [pwdErrors, setPwdErrors]     = useState([]);
  const [showPwd, setShowPwd]         = useState(false);
  const [showNewPwd, setShowNewPwd]   = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  useLayoutEffect(() => {
    /* Styles responsive pour le panneau de marque */
    const mediaId = 'ens-login-media';
    if (!document.getElementById(mediaId)) {
      const mediaStyle = document.createElement('style');
      mediaStyle.id = mediaId;
      mediaStyle.textContent = `
        @media (max-width: 767px) {
          .ens-brand-panel { display: none !important; }
          .ens-form-panel  { padding: 24px 20px !important; }
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
    if (sessionStorage.getItem('enseignant_user')) navigate('/enseignant');
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
      const data = await loginEnseignant(identifiant.trim().toLowerCase(), password);
      if (data.must_change_password) {
        setEnsData(data);
        setMustChange(true);
        return;
      }
      navigate('/enseignant');
    } catch(err) {
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
      await changeEnseignantPassword(ensData.id, password, newPwd);
      navigate('/enseignant');
    } catch(err) {
      setChangeError(err.message || 'Erreur lors du changement de mot de passe.');
    }
    setChangeLoading(false);
  };

  // Classes Tailwind pour styles statiques
  const CL = {
    page:       'h-screen flex flex-row overflow-hidden',
    card:       'rounded-[18px] py-10 px-9 w-full max-w-[400px] box-border overflow-hidden',
    brand:      'text-center mb-8',
    brandArabic:'block font-arabic text-[28px] leading-[1.3]',
    brandLabel: 'block text-xs mt-1.5 tracking-[1px] uppercase',
    field:      'mb-[18px]',
    label:      'block text-xs font-semibold mb-[7px] uppercase tracking-[.5px]',
    input:      'w-full py-[11px] px-3.5 rounded-[10px] text-sm outline-none box-border',
    error:      'mt-3.5 py-2.5 px-3.5 rounded-[10px] text-[13px] text-center',
    hint:       'text-xs text-center mt-5 leading-[1.6] pt-4',
  };

  // Styles dynamiques ou avec couleurs brutes non-Tailwind
  const S = {
    page:       { background:'#000' },
    card:       { background:'#1c1c1e', border:'1px solid rgba(255,255,255,0.08)' },
    brandArabic:{ color:'#bf8a30', direction:'rtl' },
    brandLabel: { color:'#6e6e73' },
    label:      { color:'#a1a1a6' },
    input:      { border:'1px solid rgba(255,255,255,0.1)', background:'#2c2c2e', color:'#f5f5f7' },
    btn: (disabled) => ({ width:'100%', padding:'13px', borderRadius:980, border:'none', background: disabled ? '#3a3a3c' : '#bf8a30', color: disabled ? '#6e6e73' : '#fff', fontSize:14, fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer', marginTop:8, transition:'background .2s' }),
    error:      { background:'rgba(255,69,58,.1)', border:'1px solid rgba(255,69,58,.25)', color:'#ff453a' },
    hint:       { color:'#6e6e73', borderTop:'1px solid rgba(255,255,255,0.06)' },
    criteria: (ok, typed) => ({ display:'flex', alignItems:'center', gap:6, fontSize:12, color: typed ? (ok ? '#30d158' : '#ff453a') : '#6e6e73', marginBottom:3 }),
  };

  /* ── Vue changement de mot de passe ── */
  if (mustChange) {
    const allValid = pwdErrors.length === 0 && newPwd.length > 0 && newPwd === confirmPwd;
    return (
      <div className={`admin-root ens-login-root ${CL.page}`} style={S.page}>
        <BrandPanel subtitle="Première connexion" />
        <div
          className="ens-form-panel flex-1 flex items-center justify-center p-10"
        >
          <div className={CL.card} style={S.card}>
            <div className={CL.brand}>
              <span className={`${CL.brandArabic} flex flex-col leading-[1.4]`} style={S.brandArabic}>
                <span>Institut As-Safaa</span>
                <span>الصفاء</span>
              </span>
              <span className={CL.brandLabel} style={S.brandLabel}>Première connexion</span>
            </div>
            <p className="text-[13px] text-center mb-[22px] leading-[1.6] text-a-fg-mid">
              Créez votre mot de passe personnel.<br />Il remplacera le mot de passe provisoire.
            </p>
            <div className={`admin-field ${CL.field}`}>
              <label className={CL.label} style={S.label}>Nouveau mot de passe</label>
              <div className="relative">
                <input className={`${CL.input} pr-[42px]`} style={S.input} type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 caractères" autoComplete="new-password" />
                <button type="button" onClick={() => setShowNewPwd(v => !v)} aria-label={showNewPwd ? 'Masquer' : 'Afficher'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 flex items-center text-a-fg-light">
                  <EyeIcon open={showNewPwd} />
                </button>
              </div>
            </div>
            <div className="mb-4">
              {[
                { label:'Minimum 8 caractères', ok: newPwd.length >= 8 },
                { label:'Au moins 1 chiffre', ok: /\d/.test(newPwd) },
                { label:'Au moins 1 caractère spécial', ok: /[!@#$%^&*?_\-+=]/.test(newPwd) },
              ].map((c, i) => (
                <div key={i} style={S.criteria(c.ok, newPwd.length > 0)}>
                  <span>{newPwd ? (c.ok ? '✓' : '✕') : '○'}</span>{c.label}
                </div>
              ))}
            </div>
            <div className={`admin-field ${CL.field}`}>
              <label className={CL.label} style={S.label}>Confirmer le mot de passe</label>
              <div className="relative">
                <input className={`${CL.input} pr-[42px]`} style={S.input} type={showConfirmPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Retapez votre mot de passe" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirmPwd(v => !v)} aria-label={showConfirmPwd ? 'Masquer' : 'Afficher'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 flex items-center text-a-fg-light">
                  <EyeIcon open={showConfirmPwd} />
                </button>
              </div>
              {confirmPwd && newPwd !== confirmPwd && (
                <div className="text-[11px] mt-1 text-a-red">Les mots de passe ne correspondent pas</div>
              )}
            </div>
            <button style={S.btn(!allValid || changeLoading)} disabled={!allValid || changeLoading} onClick={handleChangePassword}>
              {changeLoading ? 'Modification...' : 'Valider mon mot de passe'}
            </button>
            {changeError && <div className={CL.error} style={S.error}>{changeError}</div>}
          </div>
        </div>
      </div>
    );
  }

  /* ── Vue connexion normale ── */
  return (
    <div className={`admin-root ens-login-root ${CL.page}`} style={S.page}>
      <BrandPanel subtitle="Portail Enseignant" />
      <div
        className="ens-form-panel flex-1 flex items-center justify-center p-10"
      >
        <div className={CL.card} style={S.card}>
          <div className={CL.brand}>
            <span className={`${CL.brandArabic} flex flex-col leading-[1.4] w-full`} style={S.brandArabic}>
              <span>Institut As-Safaa</span>
              <span className="text-right">الصفاء</span>
            </span>
            <span className={CL.brandLabel} style={S.brandLabel}>Portail Enseignant</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={`admin-field ${CL.field}`}>
              <label className={CL.label} style={S.label}>Identifiant</label>
              <input className={`${CL.input} font-a-mono text-[15px] tracking-[1px]`} style={S.input} type="text" value={identifiant} onChange={e => setIdentifiant(e.target.value)} placeholder="Ex : SoD1234" autoComplete="username" required />
            </div>
            <div className={`admin-field ${CL.field}`}>
              <label className={CL.label} style={S.label}>Mot de passe</label>
              <div className="relative">
                <input className={`${CL.input} pr-[42px]`} style={S.input} type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 flex items-center text-a-fg-light">
                  <EyeIcon open={showPwd} />
                </button>
              </div>
            </div>
            <button style={S.btn(loading)} type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            {error && <div className={CL.error} style={S.error}>{error}</div>}
          </form>
          <div className={CL.hint} style={S.hint}>
            Utilisez les identifiants fournis par l'administrateur.
          </div>
        </div>
      </div>
    </div>
  );
}
