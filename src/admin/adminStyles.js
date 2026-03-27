const ADMIN_STYLES = `
  /* ─── Admin — Variables ─── */
  .admin-root {
    --a-bg:         #000000;
    --a-bg-card:    #1c1c1e;
    --a-bg-hover:   #2c2c2e;
    --a-bg-input:   #1c1c1e;
    --a-border:     rgba(255,255,255,0.06);
    --a-gold:       #bf8a30;
    --a-gold-l:     #d4a245;
    --a-fg:         #f5f5f7;
    --a-fg-mid:     #a1a1a6;
    --a-fg-light:   #6e6e73;
    --a-sidebar-w:  260px;
    --a-green:      #30d158;
    --a-blue:       #0a84ff;
    --a-red:        #ff453a;
    --a-yellow:     #ffd60a;
    --a-radius:     16px;
    --a-radius-sm:  10px;
    --a-ease:       cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --a-ease-out:   cubic-bezier(0.22, 1, 0.36, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background 0.4s ease, color 0.4s ease;
  }

  /* ─── Mode clair ─── */
  .admin-root.admin-light {
    --a-bg:         #f5f5f7;
    --a-bg-card:    #ffffff;
    --a-bg-hover:   #f0f0f2;
    --a-bg-input:   #ffffff;
    --a-border:     rgba(0,0,0,0.08);
    --a-fg:         #1d1d1f;
    --a-fg-mid:     #6e6e73;
    --a-fg-light:   #86868b;
    --a-green:      #248a3d;
    --a-blue:       #0071e3;
    --a-red:        #d70015;
    --a-yellow:     #b25000;
  }
  .admin-root.admin-light *,
  .admin-root.admin-light *::before,
  .admin-root.admin-light *::after {
    transition: background 0.4s ease, color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
  }
  .admin-root.admin-light .admin-sidebar {
    background: #ffffff;
    border-right-color: rgba(0,0,0,0.08);
  }
  .admin-root.admin-light .admin-topbar {
    background: rgba(255,255,255,0.72);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
  }
  .admin-root.admin-light .admin-login-page {
    background: var(--a-bg);
  }
  .admin-root.admin-light .admin-login-page::before {
    background: radial-gradient(ellipse 50% 50% at 50% 40%, rgba(191,138,48,0.04) 0%, transparent 70%);
  }
  .admin-root.admin-light .admin-login-card {
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  }
  .admin-root.admin-light .admin-stat-card {
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .admin-root.admin-light .admin-stat-card:hover {
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  }
  .admin-root.admin-light .admin-table-wrap {
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .admin-root.admin-light .admin-msg-panel {
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .admin-root.admin-light .admin-msg-body {
    background: #f5f5f7;
  }
  .admin-root.admin-light .badge-nouveau  { background: rgba(178,80,0,0.08);  color: var(--a-yellow); }
  .admin-root.admin-light .badge-contacte { background: rgba(0,113,227,0.08); color: var(--a-blue); }
  .admin-root.admin-light .badge-inscrit  { background: rgba(36,138,61,0.08); color: var(--a-green); }
  .admin-root.admin-light .badge-nonlu    { background: rgba(215,0,21,0.08);  color: var(--a-red); }
  .admin-root.admin-light .badge-lu       { background: rgba(36,138,61,0.08); color: var(--a-green); }

  /* ─── Toggle thème admin ─── */
  .admin-theme-toggle {
    background: rgba(191,138,48,0.1);
    border: none;
    border-radius: 50%;
    width: 2.2rem; height: 2.2rem;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--a-gold);
    font-size: 0.95rem;
    transition: all 0.3s var(--a-ease);
    flex-shrink: 0;
  }
  .admin-theme-toggle:hover {
    background: var(--a-gold);
    color: #fff;
    transform: scale(1.08);
  }
  .admin-topbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* ─── Login Page ─── */
  .admin-login-page {
    min-height: 100vh;
    background: var(--a-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  .admin-login-page::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 50% 50% at 50% 40%, rgba(191,138,48,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .admin-login-card {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 30px 80px rgba(0,0,0,0.5);
    position: relative;
    z-index: 1;
  }
  .admin-login-logo {
    text-align: center;
    margin-bottom: 2.5rem;
  }
  .admin-login-logo .arabic {
    font-family: 'Scheherazade New', serif;
    font-size: 2.5rem;
    color: var(--a-gold);
    display: block;
    line-height: 1;
  }
  .admin-login-logo .label {
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--a-fg-light);
    margin-top: 0.5rem;
    display: block;
  }
  .admin-login-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--a-fg);
    text-align: center;
    margin-bottom: 2rem;
    letter-spacing: -0.01em;
  }
  .admin-field {
    margin-bottom: 1.1rem;
  }
  .admin-field label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--a-fg-mid);
    margin-bottom: 0.5rem;
  }
  .admin-field input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--a-bg);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius-sm);
    color: var(--a-fg);
    font-size: 0.95rem;
    font-family: inherit;
    outline: none;
    transition: all 0.3s var(--a-ease);
  }
  .admin-field input:focus {
    border-color: var(--a-gold);
    box-shadow: 0 0 0 3px rgba(191,138,48,0.12);
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
    padding: 0.8rem;
    background: var(--a-gold);
    color: #fff;
    border: none;
    border-radius: 980px;
    font-size: 0.92rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.35s var(--a-ease);
    letter-spacing: 0.01em;
  }
  .admin-login-btn:hover {
    background: var(--a-gold-l);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(191,138,48,0.3);
  }

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
    padding: 1.8rem 1.5rem 1.5rem;
    border-bottom: 1px solid var(--a-border);
  }
  .admin-sidebar-brand .arabic {
    font-family: 'Scheherazade New', serif;
    font-size: 1.7rem;
    color: var(--a-gold);
    display: block;
    line-height: 1;
  }
  .admin-sidebar-brand .label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--a-fg-light);
    margin-top: 0.4rem;
    display: block;
  }
  .admin-nav {
    flex: 1;
    padding: 1rem 0;
  }
  .admin-nav-section {
    padding: 0.6rem 1.5rem 0.3rem;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--a-fg-light);
    margin-top: 0.5rem;
  }
  .admin-nav-link {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.65rem 1.5rem;
    margin: 0.15rem 0.5rem;
    color: var(--a-fg-mid);
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 400;
    border-radius: var(--a-radius-sm);
    transition: all 0.2s var(--a-ease);
    cursor: pointer;
    border: none;
    background: none;
  }
  .admin-nav-link:hover {
    background: var(--a-bg-hover);
    color: var(--a-fg);
  }
  .admin-nav-link.active {
    color: var(--a-gold);
    background: rgba(191,138,48,0.1);
    font-weight: 500;
  }
  .admin-nav-link svg { flex-shrink: 0; }
  .admin-nav-badge {
    margin-left: auto;
    background: var(--a-red);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 980px;
    min-width: 1.4em;
    text-align: center;
  }
  .admin-sidebar-footer {
    padding: 1.2rem 1.5rem;
    border-top: 1px solid var(--a-border);
  }
  .admin-sidebar-user {
    font-size: 0.78rem;
    color: var(--a-fg-mid);
    margin-bottom: 0.7rem;
  }
  .admin-sidebar-user strong { color: var(--a-fg); display: block; font-weight: 500; }
  .admin-logout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: var(--a-fg-light);
    cursor: pointer;
    background: none;
    border: none;
    font-family: inherit;
    padding: 0.4rem 0;
    transition: color 0.3s var(--a-ease);
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
    padding: 1.2rem 2.5rem;
    border-bottom: 1px solid var(--a-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(28,28,30,0.72);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .admin-topbar-title {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--a-fg);
    letter-spacing: -0.01em;
  }
  .admin-topbar-date {
    font-size: 0.8rem;
    color: var(--a-fg-light);
  }
  .admin-content {
    padding: 2.5rem;
    flex: 1;
  }

  /* ─── Cartes stats ─── */
  .admin-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  .admin-stat-card {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius);
    padding: 1.5rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: all 0.3s var(--a-ease);
  }
  .admin-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
  }
  .admin-stat-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--a-fg-mid);
  }
  .admin-stat-value {
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--a-fg);
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .admin-stat-sub {
    font-size: 0.78rem;
    color: var(--a-fg-light);
  }
  .admin-stat-card.gold  { border-color: rgba(191,138,48,0.25); }
  .admin-stat-card.green { border-color: rgba(48,209,88,0.25); }
  .admin-stat-card.blue  { border-color: rgba(10,132,255,0.25); }
  .admin-stat-card.red   { border-color: rgba(255,69,58,0.25); }
  .admin-stat-card.gold  .admin-stat-value { color: var(--a-gold); }
  .admin-stat-card.green .admin-stat-value { color: var(--a-green); }
  .admin-stat-card.blue  .admin-stat-value { color: var(--a-blue); }
  .admin-stat-card.red   .admin-stat-value { color: var(--a-red); }

  /* ─── Section dashboard ─── */
  .admin-section-title {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--a-fg-mid);
    margin-bottom: 0.8rem;
    padding-bottom: 0.6rem;
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
    border-radius: var(--a-radius);
    padding: 1.25rem;
  }

  /* ─── Tableaux ─── */
  .admin-table-wrap {
    overflow-x: auto;
    border-radius: var(--a-radius);
    border: 1px solid var(--a-border);
    background: var(--a-bg-card);
  }
  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  .admin-table thead th {
    padding: 0.85rem 1rem;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--a-fg-mid);
    border-bottom: 1px solid var(--a-border);
    white-space: nowrap;
  }
  .admin-table tbody td {
    padding: 0.85rem 1rem;
    color: var(--a-fg);
    border-bottom: 1px solid var(--a-border);
    vertical-align: middle;
  }
  .admin-table tbody tr:last-child td { border-bottom: none; }
  .admin-table tbody tr {
    transition: background 0.15s var(--a-ease);
    cursor: pointer;
  }
  .admin-table tbody tr:hover { background: var(--a-bg-hover); }
  .admin-table .muted { color: var(--a-fg-mid); font-size: 0.82rem; }

  /* ─── Badges statut ─── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.7rem;
    border-radius: 980px;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .badge-nouveau  { background: rgba(255,214,10,0.1);  color: var(--a-yellow); }
  .badge-contacte { background: rgba(10,132,255,0.1);  color: var(--a-blue); }
  .badge-inscrit  { background: rgba(48,209,88,0.1);   color: var(--a-green); }
  .badge-nonlu    { background: rgba(255,69,58,0.1);   color: var(--a-red); }
  .badge-lu       { background: rgba(48,209,88,0.1);   color: var(--a-green); }

  /* ─── Filtres ─── */
  .admin-filters {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .admin-filter-select {
    padding: 0.5rem 0.9rem;
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius-sm);
    color: var(--a-fg);
    font-size: 0.85rem;
    font-family: inherit;
    outline: none;
    cursor: pointer;
    transition: all 0.3s var(--a-ease);
    appearance: none;
  }
  .admin-filter-select:focus { border-color: var(--a-gold); box-shadow: 0 0 0 3px rgba(191,138,48,0.1); }
  .admin-filter-count {
    margin-left: auto;
    font-size: 0.8rem;
    color: var(--a-fg-light);
  }

  /* ─── Bouton statut ─── */
  .admin-status-btn {
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.3rem 0.65rem;
    border-radius: var(--a-radius-sm);
    border: 1px solid var(--a-border);
    background: var(--a-bg-hover);
    color: var(--a-fg-mid);
    cursor: pointer;
    transition: all 0.2s var(--a-ease);
  }
  .admin-status-btn:hover {
    border-color: var(--a-gold);
    color: var(--a-gold);
    background: rgba(191,138,48,0.08);
  }

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
    border-radius: var(--a-radius);
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
  .admin-msg-meta {
    font-size: 0.8rem;
    color: var(--a-fg-mid);
    margin-bottom: 1rem;
    line-height: 1.7;
  }
  .admin-msg-meta strong { color: var(--a-fg); font-weight: 500; }
  .admin-msg-body {
    background: var(--a-bg);
    border-radius: var(--a-radius-sm);
    padding: 1.1rem;
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--a-fg);
    margin-bottom: 1.25rem;
    border: 1px solid var(--a-border);
  }
  .admin-reply-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.2rem;
    background: var(--a-gold);
    color: #fff;
    border: none;
    border-radius: 980px;
    font-size: 0.82rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.35s var(--a-ease);
  }
  .admin-reply-btn:hover {
    background: var(--a-gold-l);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(191,138,48,0.3);
  }
  .admin-msg-row-unread td { font-weight: 500; }
  .admin-msg-row-unread td:first-child { position: relative; }

  /* ═══════════════════════════════
     INSCRIPTIONS — REFONTE
  ═══════════════════════════════ */

  /* Stats mini */
  .insc-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.8rem;
    margin-bottom: 1.2rem;
  }
  .insc-stat {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius-sm);
    padding: 1rem 1.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    cursor: pointer;
    transition: all 0.25s var(--a-ease);
    font-family: inherit;
  }
  .insc-stat:hover {
    border-color: rgba(191,138,48,0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
  .insc-stat.active {
    border-color: var(--a-gold);
    background: rgba(191,138,48,0.06);
  }
  .insc-stat-count {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .insc-stat-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--a-fg-mid);
    letter-spacing: 0.04em;
  }
  @media (max-width: 600px) {
    .insc-stats { grid-template-columns: repeat(2, 1fr); }
  }

  /* Filtre cours */
  .insc-filters {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.2rem;
  }
  .insc-filter-count {
    margin-left: auto;
    font-size: 0.8rem;
    color: var(--a-fg-light);
  }

  /* Layout */
  .insc-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 1.2rem;
    align-items: start;
    min-height: 55vh;
  }
  @media (max-width: 1100px) {
    .insc-layout { grid-template-columns: 1fr; }
  }

  /* Liste */
  .insc-list {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius);
    overflow: hidden;
  }
  .insc-empty {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--a-fg-light);
  }
  .insc-empty svg { opacity: 0.15; margin-bottom: 1rem; }
  .insc-empty p { font-size: 0.88rem; }

  /* Item inscription */
  .insc-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    cursor: pointer;
    transition: all 0.2s var(--a-ease);
    border-bottom: 1px solid var(--a-border);
  }
  .insc-item:last-child { border-bottom: none; }
  .insc-item:hover { background: var(--a-bg-hover); }
  .insc-item.selected {
    background: rgba(191,138,48,0.06);
    border-left: 3px solid var(--a-gold);
    padding-left: calc(1.25rem - 3px);
  }

  .insc-item-avatar {
    width: 2.6rem; height: 2.6rem;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--a-gold), var(--a-gold-l));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .insc-item-content {
    flex: 1;
    min-width: 0;
  }
  .insc-item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.1rem;
  }
  .insc-item-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--a-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .insc-item-time {
    font-size: 0.7rem;
    color: var(--a-fg-light);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .insc-item-course {
    font-size: 0.72rem;
    color: var(--a-gold);
    font-weight: 500;
    margin-bottom: 0.2rem;
  }
  .insc-item-bottom {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .insc-item-info {
    font-size: 0.75rem;
    color: var(--a-fg-mid);
  }
  .insc-item-sep {
    color: var(--a-fg-light);
    font-size: 0.65rem;
  }

  /* Panneau détail */
  .insc-detail {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius);
    position: sticky;
    top: 5rem;
    overflow: hidden;
  }
  .insc-detail-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    text-align: center;
  }
  .insc-detail-empty-icon {
    width: 5rem; height: 5rem;
    border-radius: 50%;
    background: var(--a-bg-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.2rem;
  }
  .insc-detail-empty-icon svg { opacity: 0.2; }
  .insc-detail-empty-title {
    font-size: 1rem;
    font-weight: 500;
    color: var(--a-fg-mid);
    margin-bottom: 0.3rem;
  }
  .insc-detail-empty-sub {
    font-size: 0.82rem;
    color: var(--a-fg-light);
  }

  .insc-detail-content {
    padding: 1.8rem;
    animation: adminFadeIn 0.3s var(--a-ease-out);
  }

  .insc-detail-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .insc-detail-avatar {
    width: 3.2rem; height: 3.2rem;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--a-gold), var(--a-gold-l));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .insc-detail-sender { flex: 1; min-width: 0; }
  .insc-detail-name {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--a-fg);
    letter-spacing: -0.01em;
  }
  .insc-detail-sub {
    display: block;
    font-size: 0.78rem;
    color: var(--a-fg-mid);
    margin-top: 0.1rem;
  }

  .insc-detail-sep {
    height: 1px;
    background: var(--a-border);
    margin: 1.3rem 0;
  }

  /* Grille d'infos */
  .insc-detail-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .insc-detail-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .insc-detail-field-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--a-fg-light);
  }
  .insc-detail-field-value {
    font-size: 0.92rem;
    color: var(--a-fg);
    font-weight: 400;
  }
  .insc-detail-field-date {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .insc-detail-field-date svg { color: var(--a-fg-light); flex-shrink: 0; }

  /* Titre section */
  .insc-detail-section-title {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--a-fg-mid);
    margin-bottom: 1rem;
  }

  /* Barre de progression */
  .insc-progress {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 1.5rem;
  }
  .insc-progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }
  .insc-progress-dot {
    width: 1.6rem; height: 1.6rem;
    border-radius: 50%;
    border: 2px solid var(--a-border);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s var(--a-ease);
  }
  .insc-progress-label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .insc-progress-line {
    flex: 1;
    height: 2px;
    min-width: 2rem;
    border-radius: 2px;
    margin-bottom: 1.4rem;
    transition: background 0.3s var(--a-ease);
  }

  /* Actions détail */
  .insc-detail-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }


  /* ═══════════════════════════════
     MESSAGES — REFONTE
  ═══════════════════════════════ */

  /* Filtres onglets */
  .msg-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .msg-filter-tabs {
    display: flex;
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius-sm);
    overflow: hidden;
  }
  .msg-filter-tab {
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--a-fg-mid);
    background: none;
    border: none;
    padding: 0.55rem 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.25s var(--a-ease);
    position: relative;
  }
  .msg-filter-tab + .msg-filter-tab {
    border-left: 1px solid var(--a-border);
  }
  .msg-filter-tab:hover { color: var(--a-fg); }
  .msg-filter-tab.active {
    background: rgba(191,138,48,0.1);
    color: var(--a-gold);
  }
  .msg-filter-tab-count {
    font-size: 0.65rem;
    font-weight: 600;
    background: var(--a-bg-hover);
    padding: 0.1rem 0.4rem;
    border-radius: 980px;
    min-width: 1.2em;
    text-align: center;
  }
  .msg-filter-tab.active .msg-filter-tab-count {
    background: rgba(191,138,48,0.15);
    color: var(--a-gold);
  }

  /* Layout messages */
  .msg-layout {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 1.2rem;
    align-items: start;
    min-height: 60vh;
  }
  @media (max-width: 1100px) {
    .msg-layout { grid-template-columns: 1fr; }
  }

  /* Liste des messages */
  .msg-list {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius);
    overflow: hidden;
  }
  .msg-empty {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--a-fg-light);
  }
  .msg-empty svg { opacity: 0.15; margin-bottom: 1rem; }
  .msg-empty p { font-size: 0.88rem; }

  /* Item message */
  .msg-item {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.25rem;
    cursor: pointer;
    transition: all 0.2s var(--a-ease);
    border-bottom: 1px solid var(--a-border);
    position: relative;
  }
  .msg-item:last-child { border-bottom: none; }
  .msg-item:hover { background: var(--a-bg-hover); }
  .msg-item.selected {
    background: rgba(191,138,48,0.06);
    border-left: 3px solid var(--a-gold);
    padding-left: calc(1.25rem - 3px);
  }
  .msg-item.unread .msg-item-name { font-weight: 600; }
  .msg-item.unread .msg-item-preview { color: var(--a-fg); }

  .msg-item-avatar {
    width: 2.6rem; height: 2.6rem;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--a-gold), var(--a-gold-l));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    flex-shrink: 0;
    position: relative;
  }
  .msg-item-dot {
    position: absolute;
    top: -1px; right: -1px;
    width: 9px; height: 9px;
    background: var(--a-red);
    border-radius: 50%;
    border: 2px solid var(--a-bg-card);
  }

  .msg-item-content {
    flex: 1;
    min-width: 0;
  }
  .msg-item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.15rem;
  }
  .msg-item-name {
    font-size: 0.88rem;
    font-weight: 500;
    color: var(--a-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .msg-item-time {
    font-size: 0.7rem;
    color: var(--a-fg-light);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .msg-item-course {
    font-size: 0.72rem;
    color: var(--a-gold);
    font-weight: 500;
    margin-bottom: 0.3rem;
  }
  .msg-item-preview {
    font-size: 0.8rem;
    color: var(--a-fg-mid);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Panneau de lecture */
  .msg-reader {
    background: var(--a-bg-card);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius);
    position: sticky;
    top: 5rem;
    overflow: hidden;
  }
  .msg-reader-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    text-align: center;
  }
  .msg-reader-empty-icon {
    width: 5rem; height: 5rem;
    border-radius: 50%;
    background: var(--a-bg-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.2rem;
  }
  .msg-reader-empty-icon svg { opacity: 0.2; }
  .msg-reader-empty-title {
    font-size: 1rem;
    font-weight: 500;
    color: var(--a-fg-mid);
    margin-bottom: 0.3rem;
  }
  .msg-reader-empty-sub {
    font-size: 0.82rem;
    color: var(--a-fg-light);
  }

  .msg-reader-content {
    padding: 1.8rem;
    animation: adminFadeIn 0.3s var(--a-ease-out);
  }
  @keyframes adminFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .msg-reader-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .msg-reader-avatar {
    width: 3rem; height: 3rem;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--a-gold), var(--a-gold-l));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .msg-reader-sender {
    flex: 1;
    min-width: 0;
  }
  .msg-reader-name {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    color: var(--a-fg);
    letter-spacing: -0.01em;
  }
  .msg-reader-email {
    display: block;
    font-size: 0.78rem;
    color: var(--a-fg-mid);
    margin-top: 0.1rem;
  }

  .msg-reader-sep {
    height: 1px;
    background: var(--a-border);
    margin: 1.2rem 0;
  }

  .msg-reader-metas {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.2rem;
    flex-wrap: wrap;
  }
  .msg-reader-meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: var(--a-fg-mid);
  }
  .msg-reader-meta svg { color: var(--a-fg-light); flex-shrink: 0; }

  .msg-reader-body {
    background: var(--a-bg);
    border: 1px solid var(--a-border);
    border-radius: var(--a-radius-sm);
    padding: 1.3rem 1.4rem;
    font-size: 0.92rem;
    line-height: 1.8;
    color: var(--a-fg);
    margin-bottom: 1.5rem;
    white-space: pre-wrap;
  }

  .msg-reader-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .msg-action-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.4rem;
    background: var(--a-gold);
    color: #fff;
    border: none;
    border-radius: 980px;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.35s var(--a-ease);
  }
  .msg-action-primary:hover {
    background: var(--a-gold-l);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(191,138,48,0.3);
  }
  .msg-action-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.2rem;
    background: var(--a-bg-hover);
    color: var(--a-fg-mid);
    border: 1px solid var(--a-border);
    border-radius: 980px;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s var(--a-ease);
  }
  .msg-action-secondary:hover {
    border-color: var(--a-gold);
    color: var(--a-gold);
    background: rgba(191,138,48,0.06);
  }

  /* ─── Page titre ─── */
  .admin-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.75rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .admin-page-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--a-fg);
    letter-spacing: -0.01em;
  }
  .admin-page-subtitle {
    font-size: 0.82rem;
    color: var(--a-fg-mid);
    margin-top: 0.25rem;
  }

  /* ─── Topbar left group ─── */
  .admin-topbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  /* ─── Hamburger (masqué sur desktop) ─── */
  .admin-hamburger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    flex-shrink: 0;
    border-radius: 8px;
    background: none;
    border: 1px solid var(--a-border);
    color: var(--a-fg-mid);
    cursor: pointer;
    font-size: 1.1rem;
    transition: all .2s;
  }
  .admin-hamburger:hover { color: var(--a-fg); border-color: var(--a-fg-mid); }

  /* ─── Overlay sidebar mobile ─── */
  .admin-sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 99;
    backdrop-filter: blur(2px);
  }
  .admin-sidebar-overlay.open { display: block; }

  /* ─── Responsive — tablette & mobile (≤ 1024px) ─── */
  @media (max-width: 1024px) {
    .admin-hamburger { display: flex; }

    .admin-sidebar {
      transform: translateX(-260px);
      transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .admin-sidebar.open { transform: translateX(0); }

    .admin-main { margin-left: 0; }

    .admin-topbar { padding: 1rem 1.25rem; }
    .admin-content { padding: 1.5rem; }

    .admin-topbar-date { display: none; }

    .admin-msg-layout { grid-template-columns: 1fr; }
    .insc-layout { grid-template-columns: 1fr; }
  }

  /* ─── Responsive — mobile (≤ 600px) ─── */
  @media (max-width: 600px) {
    .admin-topbar { padding: 0.8rem 1rem; }
    .admin-content { padding: 1rem; }

    .admin-topbar-title { font-size: 1rem; }

    .admin-stat-value { font-size: 1.8rem; }
    .admin-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
    .admin-stat-card { padding: 1rem 1.1rem; }

    .admin-login-card { padding: 2rem 1.5rem; margin: 0 0.75rem; }

    .admin-page-title { font-size: 1.1rem; }

    .admin-filters { gap: 0.5rem; }

    .admin-dash-grid { gap: 1rem; }

    /* ─── Dashboard tables → mode carte sur mobile ─── */
    .dash-table-wrap .admin-table thead { display: none; }

    .dash-table-wrap .admin-table tbody tr {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--a-border);
      cursor: pointer;
      gap: 0.5rem;
    }
    .dash-table-wrap .admin-table tbody tr:last-child { border-bottom: none; }
    .dash-table-wrap .admin-table tbody tr:hover { background: var(--a-bg-hover); }

    .dash-table-wrap .admin-table tbody td {
      display: block;
      padding: 0;
      border: none;
    }

    /* Colonne Cours (2e) et Date (4e) masquées */
    .dash-table-wrap .admin-table td:nth-child(2),
    .dash-table-wrap .admin-table td:nth-child(4) { display: none; }

    /* Colonne Nom (1e) prend tout l'espace */
    .dash-table-wrap .admin-table td:nth-child(1) { flex: 1; min-width: 0; }

    /* Colonne Badge (3e) à droite */
    .dash-table-wrap .admin-table td:nth-child(3) { margin-left: auto; flex-shrink: 0; }
  }
`;

export default ADMIN_STYLES;
