import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ADMIN_STYLES from './adminStyles';
import { loginAdmin } from './supabaseAdmin';

export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
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
    // Forcer le fond sombre sur <html>
    document.documentElement.classList.remove('dark');
    document.body.style.background = '#0f0d0a';
    return () => { document.body.style.background = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginAdmin(email, password);
      navigate('/admin');
    } catch (err) {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-root admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span className="arabic">مدرسة النور</span>
          <span className="label">Administration</span>
        </div>

        <p className="admin-login-title">Connexion</p>

        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@alnour.fr"
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
