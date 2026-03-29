import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import PORTAIL_STYLES from './portailStyles';
import { logoutEleve, getEleveUser } from './supabasePortail';

const IconCourses = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconDevoirs = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconResultats = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconObservations = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const PAGE_TITLES = {
  '/portail':                  'Mes modules',
  '/portail/devoirs':          'Mes devoirs',
  '/portail/resultats':        'Mes résultats',
  '/portail/observations':     'Mes observations',
};

export default function PortailApp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('portail_theme');
    return saved ? saved === 'dark' : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useLayoutEffect(() => {
    const id = 'portail-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = PORTAIL_STYLES;
      document.head.appendChild(style);
    }
    document.body.style.background = darkMode ? '#000' : '#f5f5f7';
    return () => { document.body.style.background = ''; };
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('portail_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Garde auth
  useEffect(() => {
    if (!sessionStorage.getItem('eleve_user')) {
      navigate('/portail/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    logoutEleve();
    navigate('/portail/login');
  };

  const user = getEleveUser();
  const fmtPrenom = (s) => s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : s;
  const fmtNom    = (s) => s ? s.trim().toUpperCase() : s;
  const userName = `${fmtPrenom(user?.prenom || '')} ${fmtNom(user?.nom || '')}`.trim() || 'Élève';
  const userIdentifiant = user?.identifiant ? user.identifiant.toUpperCase() : '';

  // Titre dynamique
  const currentTitle = PAGE_TITLES[location.pathname] ||
    (location.pathname.includes('/thematique/') ? 'Mon cours' :
     location.pathname.startsWith('/portail/module/') ? 'Mes Thématiques' :
     'Mon cours');

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className={`portail-root portail-layout${darkMode ? '' : ' portail-light'}`}>
      {/* Overlay mobile */}
      <div
        className={`portail-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`portail-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="portail-sidebar-brand">
          <span className="arabic">رقيب — RAQIB</span>
          <span className="label">Portail Élève</span>
        </div>

        <nav className="portail-nav">
          <div className="portail-nav-section">Navigation</div>

          <NavLink
            to="/portail" end
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconCourses /> Mes modules
          </NavLink>

          <NavLink
            to="/portail/devoirs"
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconDevoirs /> Mes devoirs
          </NavLink>

          <NavLink
            to="/portail/resultats"
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconResultats /> Mes résultats
          </NavLink>

          <NavLink
            to="/portail/observations"
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconObservations /> Mes observations
          </NavLink>

          <div className="portail-nav-section" style={{ marginTop: '1.5rem' }}>Ressources</div>
          <a href="https://www.mon-kitabi.fr/kitabis/" className="portail-nav-link" target="_blank" rel="noreferrer" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Voir mon livre interactif
          </a>
          <a href="https://fr.muqri.com/" className="portail-nav-link" target="_blank" rel="noreferrer" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12l2 2 4-4"/>
            </svg>
            Al - Muqri
          </a>
        </nav>

        <div className="portail-sidebar-footer">
          <div className="portail-sidebar-user">
            <strong>{userName}</strong>
            <span>ID : {userIdentifiant}</span>
          </div>
          <button className="portail-logout-btn" onClick={handleLogout}>
            <IconLogout /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="portail-main">
        <header className="portail-topbar">
          <div className="portail-topbar-left">
            <button className="portail-hamburger" onClick={() => setSidebarOpen(o => !o)}>
              ☰
            </button>
            <span className="portail-topbar-title">{currentTitle}</span>
          </div>
          <div className="portail-topbar-right">
            <button className="portail-theme-toggle" onClick={() => setDarkMode(d => !d)}>
              {darkMode ? '☀' : '☾'}
            </button>
            <span className="portail-topbar-date">{today}</span>
          </div>
        </header>
        <div className="portail-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
