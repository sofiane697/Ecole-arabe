import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ADMIN_STYLES from '../admin/adminStyles';
import { loginEnseignant, changeEnseignantPassword } from './supabaseEnseignant';

const EyeIcon = ({ open }) => open
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

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
    const id = 'admin-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = ADMIN_STYLES;
      document.head.appendChild(style);
    }
    document.body.style.background = '#000';
    return () => { document.body.style.background = ''; };
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
        setLoading(false);
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

  const S = {
    page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000', padding:20 },
    card: { background:'#1c1c1e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'40px 36px', width:'100%', maxWidth:400 },
    brand: { textAlign:'center', marginBottom:32 },
    brandArabic: { display:'block', fontFamily:"'Scheherazade New', serif", fontSize:28, color:'#bf8a30', direction:'rtl', lineHeight:1.3 },
    brandLabel: { display:'block', fontSize:12, color:'#6e6e73', marginTop:6, letterSpacing:1, textTransform:'uppercase' },
    field: { marginBottom:18 },
    label: { display:'block', fontSize:12, fontWeight:600, color:'#a1a1a6', marginBottom:7, textTransform:'uppercase', letterSpacing:'.5px' },
    input: { width:'100%', padding:'11px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'#2c2c2e', color:'#f5f5f7', fontSize:14, outline:'none', boxSizing:'border-box' },
    btn: (disabled) => ({ width:'100%', padding:'13px', borderRadius:980, border:'none', background: disabled ? '#3a3a3c' : '#bf8a30', color: disabled ? '#6e6e73' : '#fff', fontSize:14, fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer', marginTop:8, transition:'background .2s' }),
    error: { marginTop:14, padding:'10px 14px', borderRadius:10, background:'rgba(255,69,58,.1)', border:'1px solid rgba(255,69,58,.25)', color:'#ff453a', fontSize:13, textAlign:'center' },
    hint: { color:'#6e6e73', fontSize:12, textAlign:'center', marginTop:16, lineHeight:1.5 },
    criteria: (ok, typed) => ({ display:'flex', alignItems:'center', gap:6, fontSize:12, color: typed ? (ok ? '#30d158' : '#ff453a') : '#6e6e73', marginBottom:3 }),
  };

  if (mustChange) {
    const allValid = pwdErrors.length === 0 && newPwd.length > 0 && newPwd === confirmPwd;
    return (
      <div className="admin-root" style={S.page}>
        <div style={S.card}>
          <div style={S.brand}>
            <span style={S.brandArabic}>رقيب — RAQIB</span>
            <span style={S.brandLabel}>Première connexion</span>
          </div>
          <p style={{ fontSize:13, color:'#a1a1a6', textAlign:'center', marginBottom:22, lineHeight:1.6 }}>
            Créez votre mot de passe personnel.<br />Il remplacera le mot de passe provisoire.
          </p>
          <div style={S.field}>
            <label style={S.label}>Nouveau mot de passe</label>
            <div style={{ position:'relative' }}>
              <input style={{ ...S.input, paddingRight:42 }} type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 caractères" autoComplete="new-password" />
              <button type="button" onClick={() => setShowNewPwd(v => !v)} aria-label={showNewPwd ? 'Masquer' : 'Afficher'}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6e6e73', padding:4, display:'flex', alignItems:'center' }}>
                <EyeIcon open={showNewPwd} />
              </button>
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
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
          <div style={S.field}>
            <label style={S.label}>Confirmer le mot de passe</label>
            <div style={{ position:'relative' }}>
              <input style={{ ...S.input, paddingRight:42 }} type={showConfirmPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Retapez votre mot de passe" autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirmPwd(v => !v)} aria-label={showConfirmPwd ? 'Masquer' : 'Afficher'}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6e6e73', padding:4, display:'flex', alignItems:'center' }}>
                <EyeIcon open={showConfirmPwd} />
              </button>
            </div>
            {confirmPwd && newPwd !== confirmPwd && (
              <div style={{ fontSize:11, color:'#ff453a', marginTop:4 }}>Les mots de passe ne correspondent pas</div>
            )}
          </div>
          <button style={S.btn(!allValid || changeLoading)} disabled={!allValid || changeLoading} onClick={handleChangePassword}>
            {changeLoading ? 'Modification...' : 'Valider mon mot de passe'}
          </button>
          {changeError && <div style={S.error}>{changeError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root" style={S.page}>
      <div style={S.card}>
        <div style={S.brand}>
          <span style={S.brandArabic}>رقيب — RAQIB</span>
          <span style={S.brandLabel}>Portail Enseignant</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Identifiant</label>
            <input style={{ ...S.input, fontFamily:'monospace', fontSize:15, letterSpacing:1 }} type="text" value={identifiant} onChange={e => setIdentifiant(e.target.value)} placeholder="Ex : SoD1234" autoComplete="username" required />
          </div>
          <div style={S.field}>
            <label style={S.label}>Mot de passe</label>
            <div style={{ position:'relative' }}>
              <input style={{ ...S.input, paddingRight:42 }} type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Masquer' : 'Afficher'}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6e6e73', padding:4, display:'flex', alignItems:'center' }}>
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </div>
          <button style={S.btn(loading)} type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          {error && <div style={S.error}>{error}</div>}
        </form>
        <div style={S.hint}>Utilisez les identifiants fournis par l'administrateur.</div>
      </div>
    </div>
  );
}
