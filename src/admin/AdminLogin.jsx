import React, { useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from './supabaseAdmin';

const EyeIcon = ({ open }) => open
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const IconStudents = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconCourses = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const IconMessages = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconStats = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bf8a30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const FEATURES = [
  { icon: <IconStudents />, label: 'Élèves & enseignants' },
  { icon: <IconCourses />,  label: 'Cours & contenu' },
  { icon: <IconMessages />, label: 'Messages & inscriptions' },
  { icon: <IconStats />,    label: 'Tableau de bord' },
];

function BrandPanel() {
  return (
    <div
      className="admin-brand-panel"
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
      <div className="text-center mb-10 relative">
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
      <h1 className="font-a-display text-[22px] font-bold text-[#f5f5f7] text-center mb-3.5 tracking-tight" style={{ margin: '0 0 14px' }}>Portail Administration</h1>

      {/* Description */}
      <p className="text-sm text-[#a1a1a6] text-center leading-relaxed max-w-[320px]" style={{ margin: '0 0 48px' }}>
        Gérez les élèves, les enseignants, les inscriptions et le contenu pédagogique.
      </p>

      {/* Grille 2×2 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[320px]">
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 10, padding: '20px 16px', borderRadius: 14,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            textAlign: 'center',
          }}>
            {f.icon}
            <span className="text-xs text-[#a1a1a6] font-medium leading-snug">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminLogin() {
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const mediaId = 'admin-login-media';
    if (!document.getElementById(mediaId)) {
      const mediaStyle = document.createElement('style');
      mediaStyle.id = mediaId;
      mediaStyle.textContent = `
        @media (max-width: 767px) {
          .admin-brand-panel { display: none !important; }
          .admin-form-panel  { padding: 24px 20px !important; }
        }
      `;
      document.head.appendChild(mediaStyle);
    }
    document.documentElement.classList.remove('dark');
    document.body.style.background = '#000';
    document.body.style.overflow   = 'hidden';
    return () => {
      document.body.style.background = '';
      document.body.style.overflow   = '';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginAdmin(identifiant, password);
      navigate('/admin');
    } catch {
      setError('Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const S = {
    page:  'h-screen flex bg-black overflow-hidden',
    card:  { background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '40px 36px', width: '100%', maxWidth: 400, boxSizing: 'border-box' },
    brand: 'text-center mb-8',
    brandArabic: { display: 'flex', flexDirection: 'column', fontFamily: "'Scheherazade New', serif", fontSize: 28, color: '#bf8a30', lineHeight: 1.4 },
    brandLabel:  { display: 'block', fontSize: 12, color: '#6e6e73', marginTop: 6, letterSpacing: 1, textTransform: 'uppercase' },
    field: 'mb-[18px]',
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1a6', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.5px' },
    input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#2c2c2e', color: '#f5f5f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    btn: (disabled) => ({ width: '100%', padding: '13px', borderRadius: 980, border: 'none', background: disabled ? '#3a3a3c' : '#bf8a30', color: disabled ? '#6e6e73' : '#fff', fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', marginTop: 8, transition: 'background .2s' }),
    error: { marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,69,58,.1)', border: '1px solid rgba(255,69,58,.25)', color: '#ff453a', fontSize: 13, textAlign: 'center' },
    hint:  { color: '#6e6e73', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 },
  };

  return (
    <div className={`admin-root ${S.page}`}>
      <BrandPanel />
      <div
        className="admin-form-panel flex-1 flex items-center justify-center p-10"
      >
        <div style={S.card}>
          <div className={S.brand}>
            <span style={S.brandArabic}>
              <span>Institut As-Safaa</span>
              <span className="text-right">الصفاء</span>
            </span>
            <span style={S.brandLabel}>Administration</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={S.field}>
              <label style={S.label}>Identifiant</label>
              <input
                style={S.input}
                type="text"
                value={identifiant}
                onChange={e => { setIdentifiant(e.target.value); setError(''); }}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div className={S.field}>
              <label style={S.label}>Mot de passe</label>
              <div className="relative">
                <input
                  style={{ ...S.input, paddingRight: 42 }}
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#6e6e73] p-1 flex items-center">
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
