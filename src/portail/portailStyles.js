const PORTAIL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800;900&display=swap');

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

  /* ─── Mode clair — Palette Pastel Moderne ─── */
  .portail-root.portail-light {
    --p-bg:         #f8f9fa;
    --p-bg-card:    #ffffff;
    --p-bg-hover:   #f0f0f0;
    --p-bg-input:   #ffffff;
    --p-border:     rgba(0,0,0,0.07);
    --p-gold:       #5BA87A;
    --p-gold-l:     #A8D8B0;
    --p-fg:         #2d3436;
    --p-fg-mid:     #636e72;
    --p-fg-light:   #b2bec3;
    --p-green:      #5BA87A;
    --p-blue:       #5BA8C4;
    --p-red:        #E87070;
    --p-yellow:     #F0C050;
  }
  .portail-root.portail-light .portail-sidebar {
    background: #ffffff;
    border-right: 1px solid rgba(0,0,0,0.07);
  }
  .portail-root.portail-light .portail-sidebar-brand .arabic { color: #5BA87A; }
  .portail-root.portail-light .portail-nav-link.active {
    background: rgba(91,168,122,0.18);
    color: #1E6B45;
  }
  .portail-root.portail-light .portail-nav-link:hover {
    background: rgba(0,0,0,0.04);
    color: #2d3436;
  }
  .portail-root.portail-light .portail-topbar {
    background: #ffffff;
    border-bottom: 1px solid rgba(0,0,0,0.07);
  }
  .portail-root.portail-light.portail-layout {
    background: linear-gradient(160deg, #ffffff 0%, #e4e8ed 100%);
  }
  .portail-root.portail-light .portail-login-page { background: linear-gradient(160deg, #ffffff 0%, #e4e8ed 100%); }
  .portail-root.portail-light .portail-login-card {
    background: #ffffff;
    border-color: rgba(0,0,0,0.07);
  }
  .portail-root.portail-light .portail-login-btn { background: #5BA87A; color: #ffffff; }
  .portail-root.portail-light .portail-login-field input:focus { border-color: #5BA87A; }

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
    position: relative;
    z-index: 1;
  }

  /* ─── Topbar ─── */
  .portail-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    height: 80px;
    border-bottom: 1px solid var(--p-border);
    background: var(--p-bg);
    position: sticky;
    top: 0;
    z-index: 5;
    flex-shrink: 0;
  }
  .portail-topbar-title { font-size: 18px; font-weight: 600; color: var(--p-fg); white-space: nowrap; }
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
    padding: 40px 40px;
    flex: 1;
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
    align-items: stretch;
    justify-content: flex-start;
    background: var(--p-bg);
    font-family: 'Inter', -apple-system, sans-serif;
  }

  /* ─── Split layout (deux colonnes) ─── */
  .portail-login-split {
    display: flex;
    width: 100%;
    min-height: 100vh;
  }

  /* ─── Panneau gauche — marque ─── */
  .portail-login-panel-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 60px 64px;
    background: #0a0a0a;
    border-right: 1px solid var(--p-border);
    position: relative;
    overflow: hidden;
    min-width: 0;
  }
  .portail-login-panel-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 20% 50%, rgba(191,138,48,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .portail-panel-logo {
    margin-bottom: 32px;
    position: relative;
    z-index: 1;
  }
  .portail-panel-logo .arabic {
    font-family: 'Scheherazade New', serif;
    font-size: 52px;
    color: var(--p-gold);
    display: block;
    direction: rtl;
    line-height: 1.1;
  }
  .portail-panel-logo .label {
    font-size: 11px;
    font-weight: 700;
    color: var(--p-fg-light);
    text-transform: uppercase;
    letter-spacing: 2.5px;
    margin-top: 8px;
    display: block;
  }

  .portail-panel-heading {
    font-size: 28px;
    font-weight: 700;
    color: var(--p-fg);
    margin: 0 0 12px;
    line-height: 1.25;
    position: relative;
    z-index: 1;
  }
  .portail-panel-heading span { color: var(--p-gold); }

  .portail-panel-desc {
    font-size: 14px;
    color: var(--p-fg-mid);
    line-height: 1.7;
    margin: 0 0 48px;
    max-width: 380px;
    position: relative;
    z-index: 1;
  }

  .portail-panel-features {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 1;
  }
  .portail-panel-feature {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .portail-panel-feature-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(191,138,48,0.10);
    border: 1px solid rgba(191,138,48,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--p-gold);
  }
  .portail-panel-feature-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .portail-panel-feature-text strong { font-size: 13px; font-weight: 600; color: var(--p-fg); }
  .portail-panel-feature-text span   { font-size: 12px; color: var(--p-fg-light); }

  .portail-panel-deco {
    position: absolute;
    font-family: 'Scheherazade New', serif;
    font-size: 240px;
    font-weight: 700;
    color: rgba(191,138,48,0.035);
    right: -20px;
    bottom: -30px;
    user-select: none;
    pointer-events: none;
    line-height: 1;
    z-index: 0;
  }

  /* ─── Panneau droit — formulaire ─── */
  .portail-login-panel-right {
    width: 480px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 48px;
    background: var(--p-bg);
    box-sizing: border-box;
  }
  .portail-login-panel-right > .portail-login-card {
    width: 100%;
    max-width: 380px;
  }

  .portail-login-card {
    background: var(--p-bg-card);
    border: 1px solid var(--p-border);
    border-radius: var(--p-radius);
    padding: 40px;
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
    overflow: hidden;
  }
  .portail-login-brand {
    text-align: center;
    margin-bottom: 8px;
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
  .portail-login-subtitle {
    font-size: 12px;
    color: var(--p-fg-light);
    text-align: center;
    margin: 0 0 28px;
    line-height: 1.5;
  }
  .portail-login-field { margin-bottom: 16px; }
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

  /* ─── Responsive — login split (≤ 768px) ─── */
  @media (max-width: 768px) {
    .portail-login-panel-left { display: none; }
    .portail-login-panel-right {
      width: 100%;
      min-height: 100vh;
      padding: 40px 24px;
    }
  }

  /* ─── Topbar left group ─── */
  .portail-topbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  /* ─── Hamburger (masqué sur desktop) ─── */
  .portail-hamburger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 8px;
    background: none;
    border: 1px solid var(--p-border);
    color: var(--p-fg-mid);
    cursor: pointer;
    font-size: 18px;
    transition: all .2s;
  }
  .portail-hamburger:hover { color: var(--p-fg); border-color: var(--p-fg-mid); }

  /* ─── Overlay sidebar mobile ─── */
  .portail-sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 199;
    backdrop-filter: blur(2px);
  }
  .portail-sidebar-overlay.open { display: block; }

  /* ─── Module layout (CSS class, remplace inline style) ─── */
  .portail-module-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 0;
    min-height: calc(100vh - 100px);
    border: 1px solid var(--p-border);
    border-radius: var(--p-radius);
    overflow: hidden;
    background: var(--p-bg-card);
  }
  .portail-module-stepper {
    border-right: 1px solid var(--p-border);
    padding: 20px 0;
    overflow-y: auto;
  }
  .portail-module-main {
    padding: 28px;
    overflow-y: auto;
  }

  /* ─── Responsive — tablette & mobile (≤ 1024px) ─── */
  @media (max-width: 1024px) {
    .portail-hamburger { display: flex; }

    .portail-sidebar {
      transform: translateX(-260px);
      transition: transform 0.28s var(--p-ease-out);
      z-index: 200;
    }
    .portail-sidebar.open { transform: translateX(0); }

    .portail-main { margin-left: 0; }

    .portail-content { padding: 24px 28px; }

    .portail-module-layout {
      grid-template-columns: 1fr;
      min-height: auto;
    }
    .portail-module-stepper {
      border-right: none;
      border-bottom: 1px solid var(--p-border);
      padding: 0;
      overflow-x: auto;
      overflow-y: hidden;
      display: flex;
      flex-direction: row;
      -webkit-overflow-scrolling: touch;
    }
    .portail-stepper-title { display: none; }
    .portail-module-main { padding: 20px; }
  }

  /* ─── Responsive — mobile (≤ 600px) ─── */
  @media (max-width: 600px) {
    .portail-content { padding: 16px; }

    .portail-topbar { padding: 0 12px; height: 64px; }
    .portail-topbar-date { display: none; }
    .portail-topbar-title { font-size: 15px; }

    .portail-topbar-fun-title { font-size: 22px !important; gap: 4px !important; }
    .portail-topbar-fun-stars { display: none !important; }

    .portail-login-panel-right { padding: 32px 16px; }
    .portail-login-card {
      padding: 28px 20px;
      border-radius: var(--p-radius-sm);
    }
    .portail-login-brand .arabic { font-size: 22px; }

    .portail-module-main { padding: 14px; }
  }

  /* ─── Grille modules dashboard ─── */
  .portail-modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }
  @media (max-width: 1024px) {
    .portail-modules-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
  }
  @media (max-width: 600px) {
    .portail-modules-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  /* ─── Cartes modules ─── */
  .portail-module-card {
    border-radius: var(--p-radius);
    border: 1px solid var(--p-border);
    overflow: hidden;
    cursor: pointer;
    transition: transform .2s var(--p-ease-out), box-shadow .2s;
  }
  .portail-module-card:hover {
    transform: translateY(-4px);
  }
  .portail-module-card-img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    display: block;
  }
  .portail-module-card-img-placeholder {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 52px;
  }
  .portail-module-card-body {
    padding: 20px;
  }
  .portail-module-card-title {
    font-size: 17px;
    font-weight: 700;
    color: #1d1d1f;
    margin: 0 0 6px;
  }
  .portail-module-card-desc {
    font-size: 13px;
    color: #555;
    margin: 0 0 16px;
    line-height: 1.5;
  }
  .portail-module-card-progress {
    height: 6px;
    border-radius: 3px;
    background: rgba(0,0,0,0.10);
    overflow: hidden;
    margin-bottom: 4px;
  }
  .portail-module-card-progress-fill {
    height: 100%;
    border-radius: 3px;
    background: rgba(0,0,0,0.25);
    transition: width .6s var(--p-ease-out);
  }
  .portail-module-card-progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #777;
    margin-bottom: 14px;
  }
  .portail-module-card-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 22px;
    border-radius: 980px;
    border: none;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity .2s, transform .15s;
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }
  .portail-module-card-btn:hover { opacity: .88; }
  @media (max-width: 600px) {
    .portail-module-card-img,
    .portail-module-card-img-placeholder {
      height: 200px;
    }
    .portail-module-card-title { font-size: 18px; }
    .portail-module-card-body  { padding: 18px; }
  }

  /* ─── Rendu texte riche portail ─── */
  .portail-rich-text h1 { font-size:1.5em; font-weight:700; margin:.5em 0; color:var(--p-fg); }
  .portail-rich-text h2 { font-size:1.25em; font-weight:700; margin:.5em 0; color:var(--p-fg); }
  .portail-rich-text h3 { font-size:1.1em; font-weight:600; margin:.5em 0; color:var(--p-fg); }
  .portail-rich-text ul { list-style:disc; padding-left:1.5em; margin:.3em 0; }
  .portail-rich-text ol { list-style:decimal; padding-left:1.5em; margin:.3em 0; }
  .portail-rich-text p  { margin:.25em 0; }
  .portail-rich-text a   { color:var(--p-blue); }
  .portail-rich-text { overflow:auto; }
  .portail-rich-text img { max-width:100%; height:auto; border-radius:6px; margin:8px 0; }
  .portail-rich-text [dir="rtl"] { text-align:right; }

  /* ─── Lettres arabes de fond ─── */
  @keyframes bgFloat1 {
    0%,100% { transform:translate(0,0) rotate(-4deg); opacity:0.13; }
    50%      { transform:translate(10px,-18px) rotate(4deg); opacity:0.22; }
  }
  @keyframes bgFloat2 {
    0%,100% { transform:translate(0,0) rotate(6deg); opacity:0.11; }
    50%      { transform:translate(-12px,14px) rotate(-5deg); opacity:0.19; }
  }
  @keyframes bgFloat3 {
    0%,100% { transform:translate(0,0) rotate(-6deg); opacity:0.14; }
    50%      { transform:translate(14px,10px) rotate(7deg); opacity:0.23; }
  }
  @keyframes bgFloat4 {
    0%,100% { transform:translate(0,0) rotate(9deg); opacity:0.10; }
    50%      { transform:translate(-9px,-16px) rotate(-7deg); opacity:0.18; }
  }
  .portail-bg-letters {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .portail-bg-letter {
    position: absolute;
    font-family: 'Scheherazade New', serif;
    font-weight: 700;
    user-select: none;
    will-change: transform, opacity;
  }
  .portail-bg-letter[data-anim="1"] { animation: bgFloat1 var(--dur) ease-in-out var(--delay) infinite; }
  .portail-bg-letter[data-anim="2"] { animation: bgFloat2 var(--dur) ease-in-out var(--delay) infinite; }
  .portail-bg-letter[data-anim="3"] { animation: bgFloat3 var(--dur) ease-in-out var(--delay) infinite; }
  .portail-bg-letter[data-anim="4"] { animation: bgFloat4 var(--dur) ease-in-out var(--delay) infinite; }
  .portail-root:not(.portail-light) .portail-bg-letter { opacity: 0 !important; }
  .portail-root:not(.portail-light) .portail-module-bg-letter { opacity: 0 !important; }
`;

export default PORTAIL_STYLES;
