import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import PORTAIL_STYLES from './portailStyles';
import { logoutEleve, getEleveUser } from './supabasePortail';

const IconCourses = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
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
  '/portail': 'Mes cours',
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
  const userIdentifiant = user?.email ? user.email.replace('@eleve.alnour.fr', '').toUpperCase() : '';

  // Titre dynamique
  const currentTitle = PAGE_TITLES[location.pathname] || 'Mon cours';

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
          <span className="arabic">مدرسة النور</span>
          <span className="label">Portail Élève</span>
        </div>

        <nav className="portail-nav">
          <div className="portail-nav-section">Navigation</div>

          <NavLink
            to="/portail" end
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <IconCourses /> Mes cours
          </NavLink>

          <div className="portail-nav-section" style={{ marginTop: '1.5rem' }}>Site</div>
          <a href="/" className="portail-nav-link" target="_blank" rel="noreferrer" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Voir le site
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
