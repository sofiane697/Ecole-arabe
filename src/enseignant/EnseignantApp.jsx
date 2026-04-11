import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import ADMIN_STYLES from '../admin/adminStyles';
import { logoutEnseignant, getEnseignantUser, fetchUnreadCountEnseignant, updatePresence } from './supabaseEnseignant';

const IconClasses = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconMessages = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconDevoirs = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="14" x2="8" y2="14"/>
    <line x1="12" y1="14" x2="12" y2="14"/>
  </svg>
);
const IconNotes = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconObs = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <line x1="9" y1="9" x2="15" y2="9"/>
    <line x1="9" y1="13" x2="13" y2="13"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconAbsences = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="12" x2="15" y2="14"/>
  </svg>
);

const PRESENCE_STATUTS = [
  { key:'en_ligne',      label:'En ligne',       color:'#30d158' },
  { key:'reunion',       label:'En réunion',     color:'#ff9f0a' },
  { key:'non_joignable', label:'Pas joignable',  color:'#ff453a' },
  { key:'deconnecte',    label:'Déconnecté(e)', color:'#636366' },
];

function PresencePicker({ presence, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = PRESENCE_STATUTS.find(s => s.key === presence) || PRESENCE_STATUTS[0];

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position:'relative', marginBottom:10 }}>
      {/* Bouton statut actuel */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
          borderRadius:8, border:`1px solid ${current.color}44`,
          background:`${current.color}12`, cursor:'pointer', textAlign:'left',
        }}
      >
        <span style={{ width:9, height:9, borderRadius:'50%', background:current.color, flexShrink:0 }} />
        <span style={{ flex:1, fontSize:12, fontWeight:700, color:current.color }}>{current.label}</span>
        <span style={{ fontSize:9, color:'var(--a-fg-light)' }}>▼</span>
      </button>

      {/* Liste déroulante */}
      {open && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 4px)', left:0, right:0,
          background:'var(--a-bg-card)', border:'1px solid var(--a-border)',
          borderRadius:8, overflow:'hidden', zIndex:200,
          boxShadow:'0 4px 16px rgba(0,0,0,.25)',
        }}>
          {PRESENCE_STATUTS.map(s => (
            <button
              key={s.key}
              onClick={() => { onChange(s.key); setOpen(false); }}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:8,
                padding:'8px 12px', border:'none', cursor:'pointer', textAlign:'left',
                background: presence === s.key ? `${s.color}18` : 'transparent',
                transition:'background .12s',
              }}
            >
              <span style={{ width:9, height:9, borderRadius:'50%', background:s.color, flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight: presence === s.key ? 700 : 500, color:s.color }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PAGE_TITLES = {
  '/enseignant/classes':      'Mes classes',
  '/enseignant/absences':     'Retard / Absence',
  '/enseignant/devoirs':      'Devoirs',
  '/enseignant/notes':        'Notes',
  '/enseignant/observations': 'Observations',
  '/enseignant/messages':     'Messages',
};

export default function EnseignantApp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('enseignant_theme');
    return saved ? saved === 'dark' : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [presence, setPresence]       = useState('en_ligne');

  useLayoutEffect(() => {
    const id = 'admin-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = ADMIN_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const root = document.querySelector('.admin-root');
    if (root) {
      if (darkMode) root.classList.remove('admin-light');
      else root.classList.add('admin-light');
    }
    document.body.style.background = darkMode ? '#000000' : '#f5f5f7';
    localStorage.setItem('enseignant_theme', darkMode ? 'dark' : 'light');
    return () => { document.body.style.background = ''; };
  }, [darkMode]);

  useEffect(() => {
    if (!sessionStorage.getItem('enseignant_user')) navigate('/enseignant/login');
  }, [navigate]);

  // Présence — En ligne à la connexion, Déconnecté(e) à la fermeture
  useEffect(() => {
    const u = getEnseignantUser();
    if (!u?.id) return;
    updatePresence(u.id, 'en_ligne');
    const handleUnload = () => updatePresence(u.id, 'deconnecte');
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const handleSetPresence = (statut) => {
    const u = getEnseignantUser();
    if (!u?.id) return;
    setPresence(statut);
    updatePresence(u.id, statut);
  };

  // Badge non-lus — poll toutes les 30s
  useEffect(() => {
    const u = getEnseignantUser();
    if (!u?.id) return;
    const refresh = () => fetchUnreadCountEnseignant(u.id).then(setUnreadCount).catch(() => {});
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    const u = getEnseignantUser();
    if (u?.id) await updatePresence(u.id, 'deconnecte');
    logoutEnseignant();
    navigate('/enseignant/login');
  };

  const user = getEnseignantUser();
  const displayName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Enseignant';

  // Trouver le titre de la page courante (gère /enseignant/classe/:id)
  let currentTitle = 'Portail Enseignant';
  if (location.pathname.startsWith('/enseignant/eleve/')) currentTitle = 'Fiche élève';
  else if (location.pathname.startsWith('/enseignant/classe/')) currentTitle = 'Ma classe';
  else if (PAGE_TITLES[location.pathname]) currentTitle = PAGE_TITLES[location.pathname];

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  return (
    <div className="admin-root admin-layout">
      <div className={`admin-sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="admin-sidebar-brand">
          <span className="arabic" style={{display:'flex', flexDirection:'column', lineHeight:1.4, width:'100%'}}>
            <span>Institut As-Safaa</span>
            <span style={{textAlign:'right'}}>الصفاء</span>
          </span>
          <span className="label">Espace Enseignant</span>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">Navigation</div>

          <NavLink to="/enseignant/classes"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}>
            <IconClasses /> Mes classes
          </NavLink>

          <NavLink to="/enseignant/absences"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}>
            <IconAbsences /> Retard / Absence
          </NavLink>

          <NavLink to="/enseignant/devoirs"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}>
            <IconDevoirs /> Devoirs
          </NavLink>

          <NavLink to="/enseignant/notes"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}>
            <IconNotes /> Notes
          </NavLink>

          <NavLink to="/enseignant/observations"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}>
            <IconObs /> Observations
          </NavLink>

          <NavLink to="/enseignant/messages"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => { setSidebarOpen(false); setUnreadCount(0); }}
            style={{ position:'relative' }}>
            <IconMessages /> Messages
            {unreadCount > 0 && (
              <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'var(--a-red)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>
                {unreadCount}
              </span>
            )}
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <strong>{displayName}</strong>
            <span>{user?.identifiant?.toUpperCase() || ''}</span>
          </div>

          {/* Sélecteur de présence */}
          <PresencePicker presence={presence} onChange={handleSetPresence} />

          <button className="admin-logout-btn" onClick={handleLogout}>
            <IconLogout /> Se déconnecter
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
            <span className="admin-topbar-title">{currentTitle}</span>
          </div>
          <div className="admin-topbar-right">
            <button className="admin-theme-toggle" onClick={() => setDarkMode(d => !d)} aria-label="Changer le thème">
              {darkMode ? '☀' : '☾'}
            </button>
            <span className="admin-topbar-date">{today}</span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
