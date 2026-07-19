// Garde d'accès du jeu éducatif (prototype) — réutilise exactement la même
// authentification que le portail admin (`login_admin_custom` + session
// vérifiée côté serveur), pour éviter que le jeu soit ouvert à tout visiteur
// tant qu'il n'est pas prêt à être public. Aucun nouveau mot de passe : c'est
// le même identifiant/mot de passe que `/admin/login`.
import { useEffect, useState } from 'react';
import { loginAdmin, verifyAdminSession } from '../admin/supabaseAdmin';
import './jeu.css';

export default function JeuGate({ children }) {
  const [status, setStatus] = useState('checking'); // checking | denied | granted
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = (() => {
      try { return JSON.parse(sessionStorage.getItem('admin_session')); } catch { return null; }
    })();
    if (!session?.id) { setStatus('denied'); return; }
    verifyAdminSession(session.id)
      .then((valid) => setStatus(valid ? 'granted' : 'denied'))
      .catch(() => setStatus('denied'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginAdmin(identifiant, password);
      setStatus('granted');
    } catch {
      setError('Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'checking') return null;
  if (status === 'granted') return children;

  return (
    <div className="jeu-app">
      <div className="jeu-screen jeu-intro">
        <h1 className="jeu-title">Accès protégé</h1>
        <p className="jeu-desc">
          Le jeu est encore en test. Entre l'identifiant et le mot de passe
          administrateur pour y accéder.
        </p>
        <form onSubmit={handleSubmit} className="jeu-gate-form">
          <input
            type="text"
            className="jeu-gate-input"
            placeholder="Identifiant"
            value={identifiant}
            onChange={(e) => { setIdentifiant(e.target.value); setError(''); }}
            autoComplete="username"
            required
          />
          <input
            type="password"
            className="jeu-gate-input"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            autoComplete="current-password"
            required
          />
          {error && <p className="jeu-gate-error">{error}</p>}
          <button type="submit" className="jeu-btn" disabled={loading}>
            {loading ? 'Vérification…' : 'Entrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
