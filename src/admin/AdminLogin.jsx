import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ADMIN_STYLES from './adminStyles';
import { loginAdmin } from './supabaseAdmin';

const EyeIcon = ({ open }) => open
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

/* ── Icônes SVG pour le panneau de marque ── */
const IconStudents = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconCourses = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const IconMessages = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconStats = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

export default function AdminLogin() {
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('admin_theme');
    return saved ? saved === 'dark' : true;
  });
  const navigate = useNavigate();

  // Injecter les styles admin
  useEffect(() => {
    const id = 'admin-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = ADMIN_STYLES;
      document.head.appendChild(style);
    }
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    document.body.style.background = darkMode ? '#000000' : '#f5f5f7';
    localStorage.setItem('admin_theme', darkMode ? 'dark' : 'light');
    return () => { document.body.style.background = ''; };
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginAdmin(identifiant, password);
      navigate('/admin');
    } catch (err) {
      setError('Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`admin-root admin-login-page ${!darkMode ? 'admin-light' : ''}`}>
      <button
        className="admin-theme-toggle"
        onClick={() => setDarkMode(d => !d)}
        aria-label="Changer le thème"
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}
      >
        {darkMode ? '☀' : '☾'}
      </button>

      {/* ── Layout deux colonnes ── */}
      <div className="admin-login-split">

        {/* Colonne gauche : panneau de marque */}
        <div className="admin-login-brand">
          <div className="admin-login-brand-inner">
            <span className="admin-login-brand-logo">الصفاء</span>
            <span className="admin-login-brand-name">Institut As-Safaa</span>

            <div className="admin-login-brand-divider" />

            <p className="admin-login-brand-title">Portail Administration</p>
            <p className="admin-login-brand-desc">
              Gérez les élèves, les enseignants, les inscriptions et le contenu pédagogique.
            </p>

            <div className="admin-login-brand-features">
              <div className="admin-login-brand-feature">
                <span className="admin-login-brand-feature-icon"><IconStudents /></span>
                <span className="admin-login-brand-feature-label">Gestion des élèves & enseignants</span>
              </div>
              <div className="admin-login-brand-feature">
                <span className="admin-login-brand-feature-icon"><IconCourses /></span>
                <span className="admin-login-brand-feature-label">Cours & contenu pédagogique</span>
              </div>
              <div className="admin-login-brand-feature">
                <span className="admin-login-brand-feature-icon"><IconMessages /></span>
                <span className="admin-login-brand-feature-label">Messages & inscriptions</span>
              </div>
              <div className="admin-login-brand-feature">
                <span className="admin-login-brand-feature-icon"><IconStats /></span>
                <span className="admin-login-brand-feature-label">Tableau de bord & statistiques</span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : formulaire */}
        <div className="admin-login-form-col">
          <div className="admin-login-card">
            <div className="admin-login-logo">
              <span className="arabic" style={{display:'flex', flexDirection:'column', lineHeight:1.4, width:'100%'}}>
                <span>Institut As-Safaa</span>
                <span style={{textAlign:'right'}}>الصفاء</span>
              </span>
              <span className="label">Administration</span>
            </div>

            <p className="admin-login-title">Connexion</p>
            <p className="admin-login-subtitle">Accès réservé aux administrateurs</p>

            <form onSubmit={handleSubmit}>
              <div className="admin-field">
                <label>Identifiant</label>
                <input
                  type="text"
                  value={identifiant}
                  onChange={e => { setIdentifiant(e.target.value); setError(''); }}
                  placeholder="admin"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="admin-field">
                <label>Mot de passe</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    style={{ paddingRight: 42 }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Masquer' : 'Afficher'}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6e6e73', padding:4, display:'flex', alignItems:'center' }}>
                    <EyeIcon open={showPwd} />
                  </button>
                </div>
              </div>
              <p className="admin-login-error">{error}</p>
              <button className="admin-login-btn" type="submit" disabled={loading}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
