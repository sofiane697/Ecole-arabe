import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ADMIN_STYLES from './adminStyles';
import { loginAdmin } from './supabaseAdmin';

const EyeIcon = ({ open }) => open
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

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
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span className="arabic">رقيب — RAQIB</span>
          <span className="label">Administration</span>
        </div>

        <p className="admin-login-title">Connexion</p>

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
  );
}
