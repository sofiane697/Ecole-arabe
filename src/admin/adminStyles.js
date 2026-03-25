const ADMIN_STYLES = `
  /* ─── Admin — Variables ─── */
  .admin-root {
    --a-bg:        #0f0d0a;
    --a-bg-card:   #1a1610;
    --a-bg-hover:  #221e17;
    --a-border:    rgba(184,134,46,0.15);
    --a-gold:      #b8862e;
    --a-gold-l:    #d4a94a;
    --a-fg:        #ede5d8;
    --a-fg-mid:    #a08870;
    --a-fg-light:  #6b5d4f;
    --a-sidebar-w: 240px;
    --a-green:     #4caf7d;
    --a-blue:      #5b9bd5;
    --a-red:       #e05c5c;
    --a-yellow:    #d4a94a;
    font-family: 'Jost', sans-serif;
  }

  /* ─── Login Page ─── */
  .admin-login-page {
    min-height: 100vh;
    background: var(--a-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  .admin-login-card {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: 12px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .admin-login-logo {
    text-align: center;
    margin-bottom: 2rem;
  }
  .admin-login-logo .arabic {
    font-family: 'Scheherazade New', serif;
    font-size: 2.2rem;
    color: var(--a-gold);
    display: block;
    line-height: 1;
  }
  .admin-login-logo .label {
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--a-fg-mid);
    margin-top: 0.4rem;
    display: block;
  }
  .admin-login-title {
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--a-fg);
    text-align: center;
    margin-bottom: 1.75rem;
  }
  .admin-field {
    margin-bottom: 1rem;
  }
  .admin-field label {
    display: block;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--a-fg-mid);
    margin-bottom: 0.4rem;
  }
  .admin-field input {
    width: 100%;
    padding: 0.65rem 0.9rem;
    background: var(--a-bg);
    border: 1px solid var(--a-border);
    border-radius: 6px;
    color: var(--a-fg);
    font-size: 0.95rem;
    font-family: 'Jost', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }
  .admin-field input:focus {
    border-color: var(--a-gold);
  }
  .admin-login-error {
    color: var(--a-red);
    font-size: 0.85rem;
    text-align: center;
    margin-bottom: 1rem;
    min-height: 1.2em;
  }
  .admin-login-btn {
    width: 100%;
    padding: 0.75rem;
    background: var(--a-gold);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 500;
    font-family: 'Jost', sans-serif;
    cursor: pointer;
    transition: background 0.2s;
    letter-spacing: 0.04em;
  }
  .admin-login-btn:hover { background: var(--a-gold-l); }

  /* ─── Layout Admin ─── */
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: var(--a-bg);
    color: var(--a-fg);
  }

  /* ─── Sidebar ─── */
  .admin-sidebar {
    width: var(--a-sidebar-w);
    background: var(--a-bg-card);
    border-right: 1px solid var(--a-border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
  }
  .admin-sidebar-brand {
    padding: 1.5rem 1.25rem 1.25rem;
    border-bottom: 1px solid var(--a-border);
  }
  .admin-sidebar-brand .arabic {
    font-family: 'Scheherazade New', serif;
    font-size: 1.6rem;
    color: var(--a-gold);
    display: block;
    line-height: 1;
  }
  .admin-sidebar-brand .label {
    font-size: 0.68rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--a-fg-light);
    margin-top: 0.3rem;
    display: block;
  }
  .admin-nav {
    flex: 1;
    padding: 1rem 0;
  }
  .admin-nav-section {
    padding: 0.5rem 1.25rem 0.25rem;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--a-fg-light);
    margin-top: 0.5rem;
  }
  .admin-nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1.25rem;
    color: var(--a-fg-mid);
    text-decoration: none;
    font-size: 0.9rem;
    transition: background 0.15s, color 0.15s;
    border-left: 2px solid transparent;
    cursor: pointer;
  }
  .admin-nav-link:hover {
    background: var(--a-bg-hover);
    color: var(--a-fg);
  }
  .admin-nav-link.active {
    color: var(--a-gold);
    background: var(--a-bg-hover);
    border-left-color: var(--a-gold);
  }
  .admin-nav-link svg { flex-shrink: 0; }
  .admin-nav-badge {
    margin-left: auto;
    background: var(--a-red);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    min-width: 1.3em;
    text-align: center;
  }
  .admin-sidebar-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--a-border);
  }
  .admin-sidebar-user {
    font-size: 0.78rem;
    color: var(--a-fg-mid);
    margin-bottom: 0.6rem;
  }
  .admin-sidebar-user strong { color: var(--a-fg); display: block; }
  .admin-logout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: var(--a-fg-light);
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'Jost', sans-serif;
    padding: 0;
    transition: color 0.2s;
  }
  .admin-logout-btn:hover { color: var(--a-red); }

  /* ─── Contenu principal ─── */
  .admin-main {
    margin-left: var(--a-sidebar-w);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .admin-topbar {
    padding: 1.25rem 2rem;
    border-bottom: 1px solid var(--a-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--a-bg-card);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .admin-topbar-title {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--a-fg);
  }
  .admin-topbar-date {
    font-size: 0.8rem;
    color: var(--a-fg-light);
  }
  .admin-content {
    padding: 2rem;
    flex: 1;
  }

  /* ─── Cartes stats ─── */
  .admin-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .admin-stat-card {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .admin-stat-label {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--a-fg-mid);
  }
  .admin-stat-value {
    font-size: 2rem;
    font-weight: 600;
    color: var(--a-fg);
    line-height: 1;
  }
  .admin-stat-sub {
    font-size: 0.78rem;
    color: var(--a-fg-light);
  }
  .admin-stat-card.gold  { border-color: rgba(184,134,46,0.4); }
  .admin-stat-card.green { border-color: rgba(76,175,125,0.4); }
  .admin-stat-card.blue  { border-color: rgba(91,155,213,0.4); }
  .admin-stat-card.red   { border-color: rgba(224,92,92,0.4); }
  .admin-stat-card.gold  .admin-stat-value { color: var(--a-gold); }
  .admin-stat-card.green .admin-stat-value { color: var(--a-green); }
  .admin-stat-card.blue  .admin-stat-value { color: var(--a-blue); }
  .admin-stat-card.red   .admin-stat-value { color: var(--a-red); }

  /* ─── Section dashboard ─── */
  .admin-section-title {
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--a-fg-mid);
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--a-border);
  }
  .admin-dash-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  @media (max-width: 900px) { .admin-dash-grid { grid-template-columns: 1fr; } }
  .admin-panel {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: 10px;
    padding: 1.25rem;
  }

  /* ─── Tableaux ─── */
  .admin-table-wrap {
    overflow-x: auto;
    border-radius: 10px;
    border: 1px solid var(--a-border);
    background: var(--a-bg-card);
  }
  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  .admin-table thead th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--a-fg-mid);
    border-bottom: 1px solid var(--a-border);
    white-space: nowrap;
    font-weight: 400;
  }
  .admin-table tbody td {
    padding: 0.75rem 1rem;
    color: var(--a-fg);
    border-bottom: 1px solid var(--a-border);
    vertical-align: middle;
  }
  .admin-table tbody tr:last-child td { border-bottom: none; }
  .admin-table tbody tr {
    transition: background 0.12s;
    cursor: pointer;
  }
  .admin-table tbody tr:hover { background: var(--a-bg-hover); }
  .admin-table .muted { color: var(--a-fg-mid); font-size: 0.82rem; }

  /* ─── Badges statut ─── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .badge-nouveau   { background: rgba(212,169,74,0.15);  color: var(--a-yellow); border: 1px solid rgba(212,169,74,0.3); }
  .badge-contacte  { background: rgba(91,155,213,0.15);  color: var(--a-blue);   border: 1px solid rgba(91,155,213,0.3); }
  .badge-inscrit   { background: rgba(76,175,125,0.15);  color: var(--a-green);  border: 1px solid rgba(76,175,125,0.3); }
  .badge-nonlu     { background: rgba(224,92,92,0.15);   color: var(--a-red);    border: 1px solid rgba(224,92,92,0.3); }
  .badge-lu        { background: rgba(76,175,125,0.15);  color: var(--a-green);  border: 1px solid rgba(76,175,125,0.3); }

  /* ─── Filtres ─── */
  .admin-filters {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .admin-filter-select {
    padding: 0.45rem 0.8rem;
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: 6px;
    color: var(--a-fg);
    font-size: 0.85rem;
    font-family: 'Jost', sans-serif;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .admin-filter-select:focus { border-color: var(--a-gold); }
  .admin-filter-count {
    margin-left: auto;
    font-size: 0.8rem;
    color: var(--a-fg-light);
  }

  /* ─── Bouton statut ─── */
  .admin-status-btn {
    font-family: 'Jost', sans-serif;
    font-size: 0.72rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--a-border);
    background: var(--a-bg-hover);
    color: var(--a-fg-mid);
    cursor: pointer;
    transition: all 0.15s;
  }
  .admin-status-btn:hover { border-color: var(--a-gold); color: var(--a-gold); }

  /* ─── Panneau message ─── */
  .admin-msg-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 1.5rem;
    align-items: start;
  }
  @media (max-width: 1100px) { .admin-msg-layout { grid-template-columns: 1fr; } }
  .admin-msg-panel {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: 10px;
    padding: 1.5rem;
    position: sticky;
    top: 5rem;
  }
  .admin-msg-panel-empty {
    text-align: center;
    color: var(--a-fg-light);
    padding: 3rem 1rem;
    font-size: 0.9rem;
  }
  .admin-msg-meta { font-size: 0.8rem; color: var(--a-fg-mid); margin-bottom: 1rem; }
  .admin-msg-meta strong { color: var(--a-fg); }
  .admin-msg-body {
    background: var(--a-bg);
    border-radius: 8px;
    padding: 1rem;
    font-size: 0.9rem;
    line-height: 1.65;
    color: var(--a-fg);
    margin-bottom: 1.25rem;
    border: 1px solid var(--a-border);
  }
  .admin-reply-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    background: var(--a-gold);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-family: 'Jost', sans-serif;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s;
  }
  .admin-reply-btn:hover { background: var(--a-gold-l); }
  .admin-msg-row-unread td { font-weight: 500; }
  .admin-msg-row-unread td:first-child { position: relative; }

  /* ─── Page titre ─── */
  .admin-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  .admin-page-title {
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--a-fg);
  }
  .admin-page-subtitle {
    font-size: 0.82rem;
    color: var(--a-fg-mid);
    margin-top: 0.2rem;
  }
`;

export default ADMIN_STYLES;
