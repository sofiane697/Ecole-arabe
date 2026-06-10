import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  logoutEnseignant,
  getEnseignantUser,
  fetchUnreadCountEnseignant,
  updatePresence,
  fetchMyPresence,
  verifyEnseignantSession,
  countDeclarationsEnseignant,
} from './supabaseEnseignant';
import { usePageTransition } from '../animations';
import { preloadRoute } from '../routeLoaders';
import { Rosette } from '../shared/Ornaments';

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const NAV_ITEMS = [
  { to: '/enseignant/classes',      label: 'Mes classes',                                  preload: 'ens-classes' },
  { to: '/enseignant/absences',     label: 'Retards & absences',  badge: 'decl',           preload: 'ens-absences' },
  { to: '/enseignant/devoirs',      label: 'Devoirs',                                      preload: 'ens-devoirs' },
  { to: '/enseignant/notes',        label: 'Notes & appréciations',                        preload: 'ens-notes' },
  { to: '/enseignant/observations', label: 'Observations',                                 preload: 'ens-observations' },
  { to: '/enseignant/messages',     label: 'Messages',            badge: 'msg',            preload: 'ens-messages' },
];

export default function EnseignantApp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const outletRef = usePageTransition(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [declCount,   setDeclCount]   = useState(0);
  const [statut,      setStatut]      = useState('en_ligne');
  const [statutMenuOpen, setStatutMenuOpen] = useState(false);
  const statutMenuRef = useRef(null);

  const STATUTS = [
    { key: 'en_ligne',      label: 'En ligne',     color: '#22A06B' },
    { key: 'reunion',       label: 'En réunion',   color: '#C97800' },
    { key: 'non_joignable', label: 'Indisponible', color: '#C0392B' },
  ];
  const currentStatut = STATUTS.find(s => s.key === statut) || STATUTS[0];

  /* ── Fond de page Coupole ── */
  useEffect(() => {
    document.body.style.background = '#F2EEDF';
    document.body.style.margin = '0';
    return () => { document.body.style.background = ''; };
  }, []);

  /* ── Vérification de session ── */
  useEffect(() => {
    const user = (() => {
      try { return JSON.parse(sessionStorage.getItem('enseignant_user')); }
      catch { return null; }
    })();
    if (!user?.id) { navigate('/enseignant/login'); return; }
    verifyEnseignantSession(user.id)
      .then(valid => { if (!valid) { sessionStorage.clear(); navigate('/enseignant/login'); } })
      .catch(() => { sessionStorage.clear(); navigate('/enseignant/login'); });
  }, [navigate]);

  /* ── Présence (sync + cleanup) ── */
  useEffect(() => {
    const u = getEnseignantUser();
    if (!u?.id) return;
    let cancelled = false;
    fetchMyPresence(u.id).then(status => {
      if (cancelled) return;
      if (!status || status === 'deconnecte') {
        updatePresence(u.id, 'en_ligne');
        setStatut('en_ligne');
      } else {
        setStatut(status);
      }
    }).catch(() => {
      if (!cancelled) { updatePresence(u.id, 'en_ligne'); setStatut('en_ligne'); }
    });
    const handleUnload = () => updatePresence(u.id, 'deconnecte', { keepalive: true });
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  /* ── Click outside pour fermer dropdown statut ── */
  useEffect(() => {
    if (!statutMenuOpen) return;
    const onClick = (e) => {
      if (statutMenuRef.current && !statutMenuRef.current.contains(e.target)) {
        setStatutMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [statutMenuOpen]);

  const handleStatutChange = (newStatut) => {
    const u = getEnseignantUser();
    if (!u?.id) return;
    setStatut(newStatut);
    setStatutMenuOpen(false);
    updatePresence(u.id, newStatut).catch(() => {});
  };

  /* ── Badges messages (poll 30s) ── */
  useEffect(() => {
    const u = getEnseignantUser();
    if (!u?.id) return;
    const refresh = () => fetchUnreadCountEnseignant(u.id).then(setUnreadCount).catch(() => {});
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  /* ── Badges déclarations parents (poll 60s) ── */
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
  const displayName = user
    ? `${user.prenom || ''} ${user.nom || ''}`.trim()
    : 'Enseignant';
  const initials = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : 'E';

  const getBadge = (badge) => {
    if (badge === 'msg'  && unreadCount > 0) return unreadCount;
    if (badge === 'decl' && declCount   > 0) return declCount;
    return null;
  };

  return (
    <div className="ens-root">
      {/* Overlay mobile */}
      <div
        className={`ens-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside
        className={`ens-sidebar${sidebarOpen ? ' open' : ''}`}
        style={{ width: 240, background: '#FBFAF1', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}
      >

        {/* Logo en arche */}
        <div className="ens-logo" style={{ borderRadius: '120px 120px 14px 14px', background: '#1E2317' }}>
          <span className="ens-logo-rosette">
            <Rosette size={140} opacity={0.08} />
          </span>
          <span className="ens-logo-name">Educamoov</span>
          <span className="ens-logo-role">Enseignant</span>
        </div>

        {/* Navigation */}
        <nav className="ens-nav">
          <span className="ens-nav-section">Navigation</span>

          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `ens-nav-link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              onMouseEnter={() => preloadRoute(item.preload)}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="ens-nav-bullet" />}
                  <span>{item.label}</span>
                  {item.badge && getBadge(item.badge) && (
                    <span className="ens-nav-badge">{getBadge(item.badge)}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer utilisateur */}
        <div className="ens-sidebar-footer" ref={statutMenuRef}>
          {statutMenuOpen && (
            <div className="ens-status-menu">
              {STATUTS.map(s => (
                <button
                  key={s.key}
                  className={`ens-status-option${statut === s.key ? ' active' : ''}`}
                  onClick={() => handleStatutChange(s.key)}
                >
                  <span className="ens-status-option-dot" style={{ background: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="ens-user-avatar">
            {initials}
            <span className="ens-user-status-dot" style={{ background: currentStatut.color }} />
          </div>
          <div className="ens-user-info" onClick={() => setStatutMenuOpen(o => !o)}>
            <span className="ens-user-name">{displayName}</span>
            <span className="ens-user-status" style={{ color: currentStatut.color }}>
              {currentStatut.label}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: statutMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </div>
          <button className="ens-logout-btn" onClick={handleLogout} aria-label="Se déconnecter">
            <IconLogout />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ens-main">
        {/* Topbar mobile */}
        <div className="ens-topbar">
          <button className="ens-hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--c-gold)' }}>
            Educamoov
          </span>
        </div>

        <div ref={outletRef}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
