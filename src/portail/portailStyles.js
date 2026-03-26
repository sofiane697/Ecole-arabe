const PORTAIL_STYLES = `
  /* ─── Portail Élève — Variables ─── */
  .portail-root {
    --p-bg:         #000000;
    --p-bg-card:    #1c1c1e;
    --p-bg-hover:   #2c2c2e;
    --p-bg-input:   #1c1c1e;
    --p-border:     rgba(255,255,255,0.06);
    --p-gold:       #bf8a30;
    --p-gold-l:     #d4a245;
    --p-fg:         #f5f5f7;
    --p-fg-mid:     #a1a1a6;
    --p-fg-light:   #6e6e73;
    --p-sidebar-w:  260px;
    --p-green:      #30d158;
    --p-blue:       #0a84ff;
    --p-red:        #ff453a;
    --p-yellow:     #ffd60a;
    --p-radius:     16px;
    --p-radius-sm:  10px;
    --p-ease:       cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --p-ease-out:   cubic-bezier(0.22, 1, 0.36, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* ─── Mode clair ─── */
  .portail-root.portail-light {
    --p-bg:         #f5f5f7;
    --p-bg-card:    #ffffff;
    --p-bg-hover:   #f0f0f2;
    --p-bg-input:   #ffffff;
    --p-border:     rgba(0,0,0,0.08);
    --p-fg:         #1d1d1f;
    --p-fg-mid:     #6e6e73;
    --p-fg-light:   #86868b;
    --p-green:      #248a3d;
    --p-blue:       #0071e3;
    --p-red:        #d70015;
  }

  /* ─── Layout ─── */
  .portail-layout {
    display: block;
    min-height: 100vh;
    background: var(--p-bg);
    color: var(--p-fg);
  }

  /* ─── Sidebar ─── */
  .portail-sidebar {
    background: #0a0a0a;
    border-right: 1px solid var(--p-border);
    display: flex;
    flex-direction: column;
    padding: 24px 0;
    position: fixed;
    top: 0;
    left: 0;
    width: var(--p-sidebar-w);
    height: 100vh;
    z-index: 10;
    overflow-y: auto;
  }
  .portail-root.portail-light .portail-sidebar { background: #ffffff; }

  .portail-sidebar-brand {
    padding: 0 20px 24px;
    border-bottom: 1px solid var(--p-border);
    margin-bottom: 16px;
  }
  .portail-sidebar-brand .arabic {
    font-family: 'Scheherazade New', serif;
    font-size: 22px;
    color: var(--p-gold);
    display: block;
    direction: rtl;
  }
  .portail-sidebar-brand .label {
    font-size: 11px;
    font-weight: 600;
    color: var(--p-fg-mid);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-top: 4px;
  }

  /* ─── Nav links ─── */
  .portail-nav { padding: 0 12px; flex: 1; }
  .portail-nav-section {
    font-size: 10px;
    font-weight: 700;
    color: var(--p-fg-light);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    padding: 8px 12px 6px;
  }
  .portail-nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--p-radius-sm);
    color: var(--p-fg-mid);
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: background .2s, color .2s;
    margin-bottom: 2px;
  }
  .portail-nav-link:hover { background: var(--p-bg-hover); color: var(--p-fg); }
  .portail-nav-link.active { background: rgba(191,138,48,.1); color: var(--p-gold); font-weight: 600; }

  /* ─── Main ─── */
  .portail-main {
    margin-left: var(--p-sidebar-w);
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-width: 0;
  }

  /* ─── Topbar ─── */
  .portail-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    height: 60px;
    border-bottom: 1px solid var(--p-border);
    background: var(--p-bg);
    position: sticky;
    top: 0;
    z-index: 5;
    flex-shrink: 0;
  }
  .portail-topbar-title { font-size: 17px; font-weight: 700; color: var(--p-fg); white-space: nowrap; }
  .portail-topbar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .portail-topbar-date { font-size: 12px; color: var(--p-fg-light); white-space: nowrap; }

  .portail-theme-toggle {
    background: var(--p-bg-card);
    border: 1px solid var(--p-border);
    color: var(--p-fg-mid);
    border-radius: 50%;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 15px;
    transition: all .2s;
  }
  .portail-theme-toggle:hover { color: var(--p-gold); border-color: var(--p-gold); }

  /* ─── Content ─── */
  .portail-content {
    padding: 32px 40px;
    flex: 1;
    max-width: 1200px;
    width: 100%;
    box-sizing: border-box;
  }

  /* ─── Footer sidebar ─── */
  .portail-sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--p-border);
  }
  .portail-sidebar-user { margin-bottom: 12px; }
  .portail-sidebar-user strong { display: block; font-size: 13px; color: var(--p-fg); }
  .portail-sidebar-user span { font-size: 11px; color: var(--p-fg-light); }
  .portail-logout-btn {
    display: flex; align-items: center; gap: 8px;
    background: none; border: 1px solid var(--p-border);
    color: var(--p-fg-mid); padding: 8px 14px; border-radius: 980px;
    font-size: 12px; font-weight: 600; cursor: pointer; width: 100%;
    justify-content: center; transition: all .2s;
  }
  .portail-logout-btn:hover { color: var(--p-red); border-color: var(--p-red); }

  /* ─── Login page ─── */
  .portail-login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p-bg);
    font-family: 'Inter', -apple-system, sans-serif;
  }
  .portail-login-card {
    background: var(--p-bg-card);
    border: 1px solid var(--p-border);
    border-radius: var(--p-radius);
    padding: 40px;
    width: 100%;
    max-width: 400px;
  }
  .portail-login-brand {
    text-align: center;
    margin-bottom: 32px;
  }
  .portail-login-brand .arabic {
    font-family: 'Scheherazade New', serif;
    font-size: 28px;
    color: var(--p-gold);
    display: block;
    direction: rtl;
  }
  .portail-login-brand .label {
    font-size: 12px;
    font-weight: 600;
    color: var(--p-fg-mid);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-top: 6px;
  }
  .portail-login-field {
    margin-bottom: 16px;
  }
  .portail-login-field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--p-fg-mid);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .portail-login-field input {
    width: 100%;
    padding: 12px 16px;
    border-radius: var(--p-radius-sm);
    border: 1px solid var(--p-border);
    background: var(--p-bg-input);
    color: var(--p-fg);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    transition: border-color .2s;
  }
  .portail-login-field input:focus { border-color: var(--p-gold); }
  .portail-login-btn {
    width: 100%;
    padding: 13px;
    border-radius: 980px;
    border: none;
    background: var(--p-gold);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
    transition: opacity .2s;
  }
  .portail-login-btn:hover { opacity: .9; }
  .portail-login-btn:disabled { opacity: .5; cursor: not-allowed; }
  .portail-login-error {
    color: var(--p-red);
    font-size: 13px;
    text-align: center;
    margin-top: 12px;
  }
`;

export default PORTAIL_STYLES;
