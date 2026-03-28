import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ADMIN_STYLES from './adminStyles';
import { loginAdmin } from './supabaseAdmin';

export default function AdminLogin() {
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]   = useState(false);
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
          <span className="arabic">مدرسة النور</span>
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
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
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
