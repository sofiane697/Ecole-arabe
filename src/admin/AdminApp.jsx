import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import ADMIN_STYLES from './adminStyles';
import { logoutAdmin, fetchInscriptions, fetchMessages } from './supabaseAdmin';

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconStudent = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const PAGE_TITLES = {
  '/admin':              'Tableau de bord',
  '/admin/inscriptions': 'Pré-inscriptions',
  '/admin/messages':     'Messages',
  '/admin/cours':        'Gestion des cours',
  '/admin/classes':      'Gestion des classes',
  '/admin/eleves':        'Gestion des élèves',
  '/admin/enseignants':   'Gestion des enseignants',
};

export default function AdminApp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('admin_theme');
    return saved ? saved === 'dark' : true; // dark par défaut
  });

  // Injecter les styles (toujours mettre à jour pour que les changements soient visibles sans rechargement complet)
  useLayoutEffect(() => {
    const id = 'admin-styles';
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = ADMIN_STYLES;
  }, []);

  // Appliquer le thème
  useEffect(() => {
    const root = document.querySelector('.admin-root');
    if (root) {
      if (darkMode) {
        root.classList.remove('admin-light');
      } else {
        root.classList.add('admin-light');
      }
    }
    document.body.style.background = darkMode ? '#000000' : '#f5f5f7';
    localStorage.setItem('admin_theme', darkMode ? 'dark' : 'light');
    return () => { document.body.style.background = ''; };
  }, [darkMode]);

  // Garde : rediriger vers login si non connecté
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages,  setUnreadMessages]  = useState(0);
  const [newInscriptions, setNewInscriptions] = useState(0);

  useEffect(() => {
    fetchMessages().then(msgs => setUnreadMessages(msgs.filter(m => !m.lu).length)).catch(() => {});
    fetchInscriptions().then(insc => setNewInscriptions(insc.filter(i => i.statut === 'nouveau').length)).catch(() => {});
  }, [location.pathname]); // recharger à chaque changement de page
  const currentTitle    = PAGE_TITLES[location.pathname] || 'Admin';

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="admin-root admin-layout">

      {/* ── Overlay mobile ── */}
      <div
        className={`admin-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="admin-sidebar-brand">
          <span className="arabic" style={{display:'flex', flexDirection:'column', lineHeight:1.4, width:'100%'}}>
            <span>Institut As-Safaa</span>
            <span style={{textAlign:'right'}}>الصفاء</span>
          </span>
          <span className="label">Espace Admin</span>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">Navigation</div>

          <NavLink
            to="/admin" end
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconDashboard /> Tableau de bord
          </NavLink>

          <NavLink
            to="/admin/inscriptions"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconUsers /> Pré-inscriptions
            {newInscriptions > 0 && (
              <span className="admin-nav-badge">{newInscriptions}</span>
            )}
          </NavLink>

          <NavLink
            to="/admin/messages"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconMail /> Messages
            {unreadMessages > 0 && (
              <span className="admin-nav-badge">{unreadMessages}</span>
            )}
          </NavLink>

          <div className="admin-nav-section" style={{ marginTop: '1.5rem' }}>Portail</div>

          <NavLink
            to="/admin/cours"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconBook /> Gestion des cours
          </NavLink>

          <NavLink
            to="/admin/classes"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Gestion des classes
          </NavLink>

          <NavLink
            to="/admin/eleves"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconStudent /> Gestion des élèves
          </NavLink>

          <NavLink
            to="/admin/enseignants"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
              <line x1="12" y1="11" x2="12" y2="16"/>
              <line x1="9.5" y1="13.5" x2="14.5" y2="13.5"/>
            </svg>
            Gestion des enseignants
          </NavLink>

          <div className="admin-nav-section" style={{ marginTop: '1.5rem' }}>Site</div>
          <a href="/" className="admin-nav-link" target="_blank" rel="noreferrer" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Voir le site
          </a>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            {(() => {
              let s; try { s = JSON.parse(sessionStorage.getItem('admin_session') || '{}'); } catch { s = {}; }
              return (<><strong>{s.display_name || 'Administrateur'}</strong><span>{s.identifiant || ''}</span></>);
            })()}
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <IconLogout /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-hamburger" onClick={() => setSidebarOpen(o => !o)}>
              ☰
            </button>
            <span className="admin-topbar-title">{currentTitle}</span>
          </div>
          <div className="admin-topbar-right">
            <button
              className="admin-theme-toggle"
              onClick={() => setDarkMode(d => !d)}
              aria-label="Changer le thème"
            >
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
