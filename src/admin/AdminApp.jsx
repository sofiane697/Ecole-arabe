import React, { useEffect, useState } from 'react';
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

const PAGE_TITLES = {
  '/admin':              'Tableau de bord',
  '/admin/inscriptions': 'Pré-inscriptions',
  '/admin/messages':     'Messages',
};

export default function AdminApp() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Injecter les styles
  useEffect(() => {
    const id = 'admin-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = ADMIN_STYLES;
      document.head.appendChild(style);
    }
    document.body.style.background = '#0f0d0a';
    return () => { document.body.style.background = ''; };
  }, []);

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

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="arabic">مدرسة النور</span>
          <span className="label">Espace Admin</span>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">Navigation</div>

          <NavLink
            to="/admin"
            end
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
          >
            <IconDashboard /> Tableau de bord
          </NavLink>

          <NavLink
            to="/admin/inscriptions"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
          >
            <IconUsers /> Pré-inscriptions
            {newInscriptions > 0 && (
              <span className="admin-nav-badge">{newInscriptions}</span>
            )}
          </NavLink>

          <NavLink
            to="/admin/messages"
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
          >
            <IconMail /> Messages
            {unreadMessages > 0 && (
              <span className="admin-nav-badge">{unreadMessages}</span>
            )}
          </NavLink>

          <div className="admin-nav-section" style={{ marginTop: '1.5rem' }}>Site</div>
          <a href="/" className="admin-nav-link" target="_blank" rel="noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Voir le site
          </a>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <strong>Administrateur</strong>
            admin@alnour.fr
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <IconLogout /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <main className="admin-main">
        <header className="admin-topbar">
          <span className="admin-topbar-title">{currentTitle}</span>
          <span className="admin-topbar-date">{today}</span>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
