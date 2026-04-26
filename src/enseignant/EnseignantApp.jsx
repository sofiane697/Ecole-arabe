import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logoutEnseignant, getEnseignantUser, fetchUnreadCountEnseignant, updatePresence, verifyEnseignantSession, countDeclarationsEnseignant } from './supabaseEnseignant';
import { AnimatePresence, motion, pageVariants } from '../animations';

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
  {
    key: 'en_ligne',
    label: 'En ligne',
    desc: 'Disponible pour les élèves',
    color: '#30d158',
    pulse: true,
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    ),
  },
  {
    key: 'reunion',
    label: 'En réunion',
    desc: 'Occupé momentanément',
    color: '#ff9f0a',
    pulse: false,
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    key: 'non_joignable',
    label: 'Pas joignable',
    desc: 'Ne pas déranger',
    color: '#ff453a',
    pulse: false,
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    ),
  },
  {
    key: 'deconnecte',
    label: 'Déconnecté(e)',
    desc: 'Absent du portail',
    color: '#636366',
    pulse: false,
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
      </svg>
    ),
  },
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

      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:9,
          padding:'9px 12px', borderRadius:10, cursor:'pointer',
          border:`1px solid ${current.color}40`,
          background:`${current.color}10`,
          fontFamily:'inherit', transition:'border-color .2s, background .2s',
        }}
      >
        <span
          className={`presence-dot${current.pulse ? ' pulse' : ''}`}
          style={{ '--pulse-color': current.color + '88', background: current.color }}
        />
        <span style={{ flex:1, textAlign:'left', fontSize:12, fontWeight:700, color:current.color, letterSpacing:'0.01em' }}>
          {current.label}
        </span>
        <svg
          width="10" height="10" viewBox="0 0 10 10"
          style={{ color:'var(--a-fg-light)', flexShrink:0, transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="2,3 5,7 8,3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="presence-dropdown"
          style={{
            position:'absolute', left:0, right:0,
            bottom:'calc(100% + 6px)',
            background:'var(--a-bg-card)',
            border:'1px solid var(--a-border)',
            borderRadius:12, overflow:'hidden', zIndex:200,
            boxShadow:'0 -8px 32px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.04)',
          }}
        >
          {/* En-tête */}
          <div style={{
            padding:'9px 14px 8px',
            fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
            color:'var(--a-fg-light)', borderBottom:'1px solid var(--a-border)',
          }}>
            Statut de présence
          </div>

          {/* Options */}
          {PRESENCE_STATUTS.map(s => {
            const isActive = presence === s.key;
            return (
              <button
                key={s.key}
                className="presence-option"
                onClick={() => { onChange(s.key); setOpen(false); }}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:11,
                  padding:'10px 14px', border:'none',
                  borderLeft: isActive ? `3px solid ${s.color}` : '3px solid transparent',
                  background: isActive ? `${s.color}10` : 'transparent',
                  cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                }}
              >
                {/* Icône statut */}
                <span style={{ color: isActive ? s.color : 'var(--a-fg-light)', flexShrink:0, display:'flex' }}>
                  {s.icon}
                </span>

                {/* Label + desc */}
                <span style={{ flex:1, minWidth:0 }}>
                  <span style={{ display:'block', fontSize:12, fontWeight: isActive ? 700 : 500, color: isActive ? s.color : 'var(--a-fg)' }}>
                    {s.label}
                  </span>
                  <span style={{ display:'block', fontSize:10, color:'var(--a-fg-light)', marginTop:1 }}>
                    {s.desc}
                  </span>
                </span>

                {/* Check actif */}
                {isActive && (
                  <svg width="13" height="13" viewBox="0 0 13 13" style={{ color:s.color, flexShrink:0 }}>
                    <polyline points="2,7 5,10 11,3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            );
          })}
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
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [declCount,     setDeclCount]     = useState(0);
  const [presence, setPresence]           = useState('en_ligne');

  useEffect(() => {
    const root = document.querySelector('.admin-root');
    if (root) {
      if (darkMode) root.classList.remove('admin-light');
      else root.classList.add('admin-light');
    }
    document.body.style.background = darkMode ? '#07112a' : '#f1f0ec';
    localStorage.setItem('enseignant_theme', darkMode ? 'dark' : 'light');
    return () => { document.body.style.background = ''; };
  }, [darkMode]);

  useEffect(() => {
    const user = (() => { try { return JSON.parse(sessionStorage.getItem('enseignant_user')); } catch { return null; } })();
    if (!user?.id) { navigate('/enseignant/login'); return; }
    verifyEnseignantSession(user.id).then(valid => {
      if (!valid) { sessionStorage.clear(); navigate('/enseignant/login'); }
    }).catch(() => { sessionStorage.clear(); navigate('/enseignant/login'); });
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

  // Badge messages non-lus — poll toutes les 30s
  useEffect(() => {
    const u = getEnseignantUser();
    if (!u?.id) return;
    const refresh = () => fetchUnreadCountEnseignant(u.id).then(setUnreadCount).catch(() => {});
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  // Badge déclarations parents — poll toutes les 60s + rafraîchissement immédiat après prise en compte
  useEffect(() => {
    const u = getEnseignantUser();
    if (!u?.id) return;
    const refresh = () => countDeclarationsEnseignant(u.id).then(setDeclCount).catch(() => {});
    refresh();
    const t = setInterval(refresh, 60000);
    window.addEventListener('declaration-acknowledged', refresh);
    return () => { clearInterval(t); window.removeEventListener('declaration-acknowledged', refresh); };
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
          <span className="admin-brand-logo">الصفاء</span>
          <span className="admin-brand-name">Institut As-Safaa</span>
          <span className="admin-brand-badge">Espace Enseignant</span>
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
            {declCount > 0 && (
              <span className="admin-nav-badge">{declCount}</span>
            )}
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
            onClick={() => { setSidebarOpen(false); setUnreadCount(0); }}>
            <IconMessages /> Messages
            {unreadCount > 0 && (
              <span className="admin-nav-badge">{unreadCount}</span>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
