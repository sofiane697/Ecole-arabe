import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logoutParent, getParentUser } from './supabaseParent';
import { ParentProvider, useParentCtx } from './ParentContext';
import { usePageTransition } from '../animations';
import EleveAvatar from '../shared/EleveAvatar';
import { fmtPrenom, fmtNom } from '../shared/nameUtils';
import { formatFoyer } from '../admin/adminUtils';

// Titre affiché dans la topbar selon la route — deux langues pour le rendu
// éditorial (français en gros + calligraphie arabe dessous, cohérent avec
// l'identité Institut As-Safaa).
const PAGE_TITLES = {
  '/parent':               { fr: 'Accueil',             ar: 'الرئيسية' },
  '/parent/notes':         { fr: 'Notes',               ar: 'العلامات' },
  '/parent/observations':  { fr: 'Appréciations',       ar: 'الملاحظات' },
  '/parent/devoirs':       { fr: 'Devoirs',             ar: 'الواجبات' },
  '/parent/absences':      { fr: 'Retards & absences',  ar: 'الحضور والغياب' },
};
const DEFAULT_TITLE = { fr: 'Accueil', ar: 'الرئيسية' };

// ─── Sélecteur d'enfant (vignettes côte à côte dans la topbar) ───────────────
function EnfantSelector() {
  const { enfants, selectedEleveId, setSelectedEleveId } = useParentCtx();

  if (!enfants || enfants.length === 0) return null;

  return (
    <div className="portail-enfant-tabs" role="group" aria-label="Choisir un enfant">
      {enfants.map(e => {
        const active = e.eleve_id === selectedEleveId;
        return (
          <button
            key={e.eleve_id}
            type="button"
            className={`portail-enfant-tab${active ? ' active' : ''}`}
            onClick={() => !active && setSelectedEleveId(e.eleve_id)}
            aria-pressed={active}
            aria-label={`${fmtPrenom(e.prenom)} ${fmtNom(e.nom)}${e.classe_nom ? ' — ' + e.classe_nom : ''}`}
          >
            <span className="portail-enfant-tab-avatar">
              <EleveAvatar
                eleve={{
                  prenom: e.prenom, nom: e.nom,
                  photo_url: e.photo_url,
                  photo_scale: e.photo_scale,
                  photo_pos_x: e.photo_pos_x,
                  photo_pos_y: e.photo_pos_y,
                }}
                size={30}
              />
            </span>
            <span className="portail-enfant-tab-body">
              <span className="portail-enfant-tab-prenom">{fmtPrenom(e.prenom)}</span>
              <span className="portail-enfant-tab-nom">{fmtNom(e.nom)}</span>
              {e.classe_nom && (
                <span className="portail-enfant-tab-classe">{e.classe_nom}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Layout principal (miroir de PortailApp, même classes CSS `.portail-*`) ──
function ParentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const outletRef = usePageTransition(location.pathname);
  const { parent, enfants, loading } = useParentCtx();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('parent_theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    document.body.style.background = darkMode
      ? '#000'
      : 'linear-gradient(160deg, #ffffff 0%, #e4e8ed 100%)';
    return () => { document.body.style.background = ''; };
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('parent_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!parent?.session_token) navigate('/parent/login');
  }, [parent, navigate]);

  const handleLogout = async () => {
    await logoutParent();
    navigate('/parent/login');
  };

  const foyerLabel = formatFoyer(parent || {}) || 'Parent';
  const identifiant = parent?.identifiant ? parent.identifiant.toUpperCase() : '';
  const currentTitle = PAGE_TITLES[location.pathname] || DEFAULT_TITLE;
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Avatar du foyer : initiales des prénoms (père et/ou mère)
  const avatarInitials = [parent?.pere_prenom?.[0], parent?.mere_prenom?.[0]]
    .filter(Boolean).join('').toUpperCase() || 'P';

  return (
    <div className={`portail-root portail-layout${darkMode ? '' : ' portail-light'}`}>
      {/* Sidebar */}
      <aside className="portail-sidebar">
        <div className="portail-sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-eleve.png" alt="" style={{ height: 44, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <span className="arabic" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
              <span>Institut As-Safaa</span>
              <span style={{ textAlign: 'right' }}>الصفاء</span>
            </span>
          </div>
          <span className="label">Portail Parent</span>
        </div>

        <nav className="portail-nav">
          <div className="portail-nav-section">Navigation</div>

          <NavLink to="/parent" end className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}>
            <span className="text-lg">🏠</span> Accueil
          </NavLink>
          <NavLink to="/parent/notes" className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}>
            <span className="text-lg">📊</span> Notes
          </NavLink>
          <NavLink to="/parent/observations" className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}>
            <span className="text-lg">👁️</span> Appréciations
          </NavLink>
          <NavLink to="/parent/devoirs" className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}>
            <span className="text-lg">📝</span> Devoirs
          </NavLink>
          <NavLink to="/parent/absences" className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}>
            <span className="text-lg">⏰</span> Retards & absences
          </NavLink>
        </nav>

        <div className="portail-sidebar-footer">
          <div className="portail-sidebar-profile">
            <div className="avatar-circle portail-sidebar-avatar" aria-label={foyerLabel}>
              {avatarInitials}
            </div>
            <div className="portail-sidebar-user">
              <strong>{foyerLabel}</strong>
              <span>ID : {identifiant}</span>
            </div>
          </div>
          <button className="portail-logout-btn" onClick={handleLogout}>
            <span className="text-sm">🚪</span> Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="portail-main">
        <header className="portail-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }}>
            <h1 className="portail-topbar-title" key={location.pathname}>
              <span className="portail-topbar-title-accent" aria-hidden="true" />
              <span className="portail-topbar-title-stack">
                <span className="portail-topbar-title-fr">{currentTitle.fr}</span>
                <span className="portail-topbar-title-ar" aria-hidden="true" dir="rtl">
                  {currentTitle.ar}
                </span>
              </span>
            </h1>
            <EnfantSelector />
          </div>
          <div className="portail-topbar-right">
            <button
              type="button"
              className="portail-theme-toggle"
              onClick={() => setDarkMode(d => !d)}
              aria-label={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {darkMode ? '☀' : '☾'}
            </button>
            <span className="portail-topbar-date">{today}</span>
          </div>
        </header>

        <div className="portail-content">
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--p-fg-mid)' }}>
              Chargement…
            </div>
          )}
          {!loading && (!enfants || enfants.length === 0) && (
            <div style={{
              padding: 28, borderRadius: 'var(--p-radius)',
              background: 'var(--p-bg-card)', border: '1px solid var(--p-border)',
              textAlign: 'center', color: 'var(--p-fg-mid)',
              boxShadow: 'var(--p-shadow-sm)',
            }}>
              Aucun enfant n'est rattaché à votre compte pour le moment.
              <br />Contactez l'administration de l'école.
            </div>
          )}
          {!loading && enfants && enfants.length > 0 && (
            <div ref={outletRef}>
              <Outlet />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ParentApp() {
  const navigate = useNavigate();
  useEffect(() => {
    const user = getParentUser();
    if (!user?.session_token) navigate('/parent/login');
  }, [navigate]);

  return (
    <ParentProvider>
      <ParentLayout />
    </ParentProvider>
  );
}
