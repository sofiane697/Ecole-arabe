import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import ADMIN_STYLES from '../admin/adminStyles';
import { logoutEnseignant, getEnseignantUser } from './supabaseEnseignant';

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconClasses = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
  '/enseignant':         'Tableau de bord',
  '/enseignant/classes': 'Mes classes',
};

export default function EnseignantApp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('enseignant_theme');
    return saved ? saved === 'dark' : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleLogout = () => {
    logoutEnseignant();
    navigate('/enseignant/login');
  };

  const user = getEnseignantUser();
  const displayName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Enseignant';

  // Trouver le titre de la page courante (gère /enseignant/classe/:id)
  let currentTitle = 'Portail Enseignant';
  if (location.pathname === '/enseignant') currentTitle = 'Tableau de bord';
  else if (location.pathname.startsWith('/enseignant/classe/')) currentTitle = 'Ma classe';
  else if (PAGE_TITLES[location.pathname]) currentTitle = PAGE_TITLES[location.pathname];

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  return (
    <div className="admin-root admin-layout">
      <div className={`admin-sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="admin-sidebar-brand">
          <span className="arabic">رقيب — RAQIB</span>
          <span className="label">Espace Enseignant</span>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">Navigation</div>

          <NavLink to="/enseignant" end
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}>
            <IconDashboard /> Tableau de bord
          </NavLink>

          <NavLink to="/enseignant/classes"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}>
            <IconClasses /> Mes classes
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <strong>{displayName}</strong>
            <span>{user?.identifiant?.toUpperCase() || ''}</span>
          </div>
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
