const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Scheherazade+New:wght@400;500;600;700&family=Jost:wght@300;400;500&display=swap');

  /* ─── Reset ─── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ─── Variables ─── */
  :root {
    --cream:      #f9f5ee;
    --parchment:  #f0e8d8;
    --sand:       #d4b896;
    --gold:       #b8862e;
    --gold-light: #d4a94a;
    --charcoal:   #2a2520;
    --dark:       #3d3428;
    --mid:        #6b5d4f;
    --light:      #9c8c7c;
    --border:     rgba(184,134,46,0.18);
    --nav-h:      72px;
  }

  /* ─── Variables sémantiques (swappables) ─── */
  :root {
    --bg:        #f9f5ee;
    --bg-alt:    #f0e8d8;
    --bg-card:   #ffffff;
    --fg:        #2a2520;
    --fg-title:  #3d3428;
    --fg-mid:    #6b5d4f;
    --fg-light:  #9c8c7c;
    --transition-theme: background 0.35s ease, color 0.35s ease, border-color 0.35s ease;
  }
  html.dark {
    --bg:        #13100d;
    --bg-alt:    #1a1610;
    --bg-card:   #1e1a14;
    --fg:        #ede5d8;
    --fg-title:  #d4b896;
    --fg-mid:    #a08870;
    --fg-light:  #6b5d4f;
  }

  /* ─── Transition globale au changement de thème ─── */
  html.theme-transition,
  html.theme-transition *,
  html.theme-transition *::before,
  html.theme-transition *::after {
    transition: background 0.35s ease, color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease !important;
  }

  /* ─── Base ─── */
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    background: var(--bg);
    color: var(--fg);
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }

  /* ─── Dark mode overrides ─── */
  html.dark .nav         { background: var(--bg-alt); box-shadow: 0 2px 24px rgba(0,0,0,0.3); }
  html.dark .mobile-menu { background: var(--bg-alt); }
  html.dark .mobile-link { color: var(--fg); }
  html.dark .hamburger span { background: var(--fg); }
  html.dark .pres        { background: var(--bg-alt); }
  html.dark .orn         { background: var(--bg); }
  html.dark .tarifs      { background: var(--bg); }
  html.dark .hero-title-ar { color: var(--fg-title); }
  html.dark .hero-title-fr { color: var(--fg-mid); }
  html.dark .hero-desc     { color: var(--fg-mid); }
  html.dark .s-title       { color: var(--fg-title); }
  html.dark .s-body        { color: var(--fg-mid); }
  html.dark .nav-btn        { color: var(--fg-mid); }
  html.dark .logo-fr       { color: var(--fg-light); }
  html.dark .stat-l        { color: var(--fg-light); }
  html.dark .value         { background: rgba(255,255,255,0.03); }
  html.dark .value-name    { color: var(--fg-title); }
  html.dark .value-desc    { color: var(--fg-mid); }
  html.dark .card          { background: var(--bg-card); }
  html.dark .card:hover    { box-shadow: 0 22px 55px rgba(0,0,0,0.35); }
  html.dark .card-ar       { color: var(--fg-title); }
  html.dark .card-fr       { color: var(--fg); }
  html.dark .card-feats li { color: var(--fg-mid); }
  html.dark .btn-fill:hover { background: var(--fg-title); }
  html.dark .btn-outline    { border-color: rgba(184,134,46,0.4); color: var(--fg-mid); }

  /* ─── Keyframes ─── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(56px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes growX {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.06; transform: translateY(-50%) scale(1);    }
    50%       { opacity: 0.16; transform: translateY(-50%) scale(1.04); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateX(-50%) translateY(0);   }
    50%       { transform: translateX(-50%) translateY(12px); }
  }

  /* ─── Scroll reveal ─── */
  .sr {
    opacity: 0;
    transform: translateY(44px) scale(0.98);
    transition: opacity 0.85s cubic-bezier(0.22,1,0.36,1), transform 0.85s cubic-bezier(0.22,1,0.36,1);
  }
  .sr.in       { opacity: 1; transform: none; }
  .sr.d1       { transition-delay: 0.12s; }
  .sr.d2       { transition-delay: 0.24s; }
  .sr.d3       { transition-delay: 0.36s; }


  /* ═══════════════════════════════
     NAV
  ═══════════════════════════════ */
  .nav {
    position: fixed;
    inset-block-start: 0; inset-inline: 0;
    z-index: 100;
    height: var(--nav-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 4rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 2px 24px rgba(42,37,32,0.06);
  }

  /* Logo */
  .logo {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }
  .logo-ar {
    font-family: 'Scheherazade New', serif;
    font-size: 1.5rem;
    color: var(--gold);
    line-height: 1.1;
  }
  .logo-fr {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 0.67rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--light);
  }

  /* Liens desktop */
  .nav-list {
    display: flex;
    align-items: center;
    gap: 2.5rem;
    list-style: none;
  }
  .nav-btn {
    font-family: 'Jost', sans-serif;
    font-size: 0.74rem;
    font-weight: 300;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--mid);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    position: relative;
    transition: color 0.25s;
  }
  .nav-btn::after {
    content: '';
    position: absolute;
    inset-block-end: -5px;
    inset-inline-start: 0;
    width: 0;
    height: 1px;
    background: var(--gold);
    transition: width 0.3s ease;
  }
  .nav-btn:hover        { color: var(--gold); }
  .nav-btn:hover::after { width: 100%; }
  .nav-btn.active       { color: var(--gold); font-weight: 500; }
  .nav-btn.active::after { width: 100%; }

  /* CTA nav */
  .nav-cta {
    font-family: 'Jost', sans-serif;
    font-size: 0.72rem;
    font-weight: 300;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gold);
    background: none;
    border: 1px solid var(--gold);
    padding: 0.5rem 1.5rem;
    cursor: pointer;
    transition: background 0.25s, color 0.25s;
  }
  .nav-cta:hover { background: var(--gold); color: var(--cream); }

  /* Toggle thème */
  .theme-toggle {
    background: none;
    border: 1px solid rgba(184,134,46,0.3);
    border-radius: 50%;
    width: 2.1rem; height: 2.1rem;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--fg-mid);
    font-size: 0.95rem;
    transition: border-color 0.25s, color 0.25s, background 0.25s;
    flex-shrink: 0;
  }
  .theme-toggle:hover {
    border-color: var(--gold);
    color: var(--gold);
    background: rgba(184,134,46,0.07);
  }

  /* Groupe droite nav */
  .nav-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* Hamburger */
  .hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }
  .hamburger span {
    display: block;
    width: 22px;
    height: 1.5px;
    background: var(--fg);
    transform-origin: center;
    transition: transform 0.3s, opacity 0.3s;
  }
  .hamburger.is-open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .hamburger.is-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .hamburger.is-open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }


  /* ═══════════════════════════════
     MENU MOBILE
  ═══════════════════════════════ */
  .mobile-menu {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 99;
    background: var(--bg);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2.5rem;
  }
  .mobile-menu.is-open { display: flex; animation: fadeIn 0.25s ease; }

  .mobile-link {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 400;
    letter-spacing: 0.05em;
    color: var(--fg);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.25s, transform 0.25s;
  }
  .mobile-link:hover      { color: var(--gold); transform: translateX(8px); }
  .mobile-link.active     { color: var(--gold); }
  .mobile-link.cta-mobile {
    margin-top: 0.5rem;
    font-family: 'Jost', sans-serif;
    font-size: 0.78rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 300;
    color: var(--cream);
    background: var(--gold);
    padding: 0.9rem 2.5rem;
  }


  /* ═══════════════════════════════
     HERO
  ═══════════════════════════════ */
  .hero {
    min-height: 100vh;
    padding-top: var(--nav-h);
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
  }
  .hero-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 78% 68% at 66% 50%, rgba(212,184,150,0.38) 0%, transparent 70%),
      radial-gradient(ellipse 38% 55% at 7%  74%, rgba(184,134,46,0.14)  0%, transparent 60%);
  }
  .hero-geo {
    position: absolute;
    right: -2rem;
    top: 50%;
    transform: translateY(-50%);
    width: 48vw;
    max-width: 620px;
    opacity: 0.06;
    pointer-events: none;
    animation: pulse 4.5s ease infinite;
  }
  .hero-inner {
    position: relative;
    z-index: 2;
    padding: 5rem 4rem;
    max-width: 680px;
  }
  .hero-eyebrow {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.69rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 1.8rem;
    animation: fadeIn 1.1s 0.1s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hero-eyebrow::before {
    content: '';
    display: block;
    width: 30px;
    height: 1px;
    background: var(--gold);
    flex-shrink: 0;
    animation: growX 0.9s 0.6s cubic-bezier(0.22,1,0.36,1) both;
    transform-origin: left;
  }
  .hero-title-ar {
    font-family: 'Scheherazade New', serif;
    font-size: clamp(2.8rem, 6.5vw, 5.5rem);
    color: var(--fg-title);
    direction: rtl;
    line-height: 1.15;
    margin-bottom: 0.3rem;
    animation: fadeUp 1.1s 0.25s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hero-title-fr {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.6rem, 3.8vw, 3rem);
    font-weight: 300;
    font-style: italic;
    color: var(--mid);
    margin-bottom: 1.8rem;
    animation: fadeUp 1.1s 0.42s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hero-desc {
    font-size: 0.94rem;
    line-height: 1.95;
    color: var(--mid);
    max-width: 460px;
    margin-bottom: 2.8rem;
    animation: fadeUp 1.1s 0.58s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hero-actions {
    display: flex;
    gap: 1.2rem;
    flex-wrap: wrap;
    animation: fadeUp 1.1s 0.74s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hero-badges {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin-top: 1.6rem;
    animation: fadeUp 0.9s 0.8s ease both;
  }
  .hero-badge {
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    color: var(--mid);
    background: rgba(184,134,46,0.08);
    border: 1px solid var(--border);
    padding: 0.35rem 0.85rem;
    border-radius: 2px;
  }
  .scroll-hint {
    position: absolute;
    bottom: 2.5rem;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    animation: bounce 2.2s ease infinite;
  }
  .scroll-hint-line {
    width: 1px;
    height: 38px;
    background: linear-gradient(to bottom, var(--gold), transparent);
  }
  .scroll-hint-text {
    font-size: 0.58rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--light);
  }


  /* ═══════════════════════════════
     BOUTONS GLOBAUX
  ═══════════════════════════════ */
  .btn-fill {
    font-family: 'Jost', sans-serif;
    font-size: 0.74rem;
    font-weight: 300;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: var(--gold);
    color: var(--cream);
    border: none;
    padding: 0.95rem 2.2rem;
    cursor: pointer;
    transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
  }
  .btn-fill:hover {
    background: var(--dark);
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(42,37,32,0.18);
  }
  .btn-outline {
    font-family: 'Jost', sans-serif;
    font-size: 0.74rem;
    font-weight: 300;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: none;
    color: var(--mid);
    border: 1px solid var(--sand);
    padding: 0.95rem 2.2rem;
    cursor: pointer;
    transition: border-color 0.25s, color 0.25s, transform 0.2s;
  }
  .btn-outline:hover {
    border-color: var(--gold);
    color: var(--gold);
    transform: translateY(-3px);
  }


  /* ═══════════════════════════════
     SECTION — éléments communs
  ═══════════════════════════════ */
  .section { padding: 7rem 4rem; }
  .wrap    { max-width: 1160px; margin-inline: auto; }

  .s-eyebrow {
    font-size: 0.67rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 0.8rem;
  }
  .s-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.9rem, 3.5vw, 2.8rem);
    font-weight: 400;
    color: var(--fg-title);
    line-height: 1.2;
    margin-bottom: 0.35rem;
  }
  .s-title-ar {
    font-family: 'Scheherazade New', serif;
    font-size: clamp(1.1rem, 2vw, 1.55rem);
    direction: rtl;
    color: var(--gold);
    margin-bottom: 1.4rem;
  }
  .s-body {
    font-size: 0.92rem;
    line-height: 1.9;
    color: var(--mid);
    max-width: 500px;
  }


  /* ═══════════════════════════════
     PRÉSENTATION
  ═══════════════════════════════ */
  .pres { background: var(--bg-alt); position: relative; overflow: hidden; }
  .pres-deco {
    position: absolute;
    right: 2rem; top: 50%;
    transform: translateY(-50%);
    font-family: 'Scheherazade New', serif;
    font-size: 28rem;
    line-height: 1;
    color: rgba(184,134,46,0.04);
    pointer-events: none;
    user-select: none;
    animation: pulse 6s ease infinite;
  }
  .pres-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  .stats {
    display: flex;
    gap: 2.5rem;
    margin-top: 2.5rem;
    flex-wrap: wrap;
  }
  .stat-n {
    display: block;
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.8rem;
    font-weight: 500;
    color: var(--gold);
    line-height: 1;
  }
  .stat-l {
    display: block;
    font-size: 0.67rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--light);
    margin-top: 0.2rem;
  }
  .values { display: flex; flex-direction: column; gap: 1.1rem; }
  .value {
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
    padding: 1.3rem 1.5rem;
    background: rgba(255,255,255,0.55);
    border: 1px solid var(--border);
    border-left: 2px solid var(--gold);
    transition: transform 0.25s, box-shadow 0.25s;
  }
  .value:hover {
    transform: translateX(6px);
    box-shadow: 0 4px 22px rgba(184,134,46,0.1);
  }
  .value-ico {
    font-family: 'Scheherazade New', serif;
    font-size: 1.6rem;
    color: var(--gold);
    line-height: 1;
    min-width: 2rem;
    text-align: center;
  }
  .value-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem;
    font-weight: 500;
    color: var(--fg-title);
    margin-bottom: 0.2rem;
  }
  .value-desc { font-size: 0.82rem; color: var(--mid); line-height: 1.6; }


  /* ═══════════════════════════════
     ORNEMENT / SÉPARATEUR
  ═══════════════════════════════ */
  .orn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1.8rem 4rem;
    background: var(--bg);
  }
  .orn-line  { flex: 1; max-width: 140px; height: 1px; background: var(--border); }
  .orn-glyph { font-family: 'Scheherazade New', serif; font-size: 1.55rem; color: var(--gold); opacity: 0.65; }


  /* ═══════════════════════════════
     TARIFS
  ═══════════════════════════════ */
  .tarifs { background: var(--bg); padding-top: 3rem; }
  .tarifs-head { text-align: center; margin-bottom: 4rem; }
  .tarifs-head .s-title-ar { text-align: center; }
  .tarifs-head .s-body     { margin: 0.8rem auto 0; text-align: center; }

  .grid-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.4rem;
  }

  /* Carte */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    padding: 2.2rem;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .card:hover {
    transform: translateY(-8px);
    box-shadow: 0 22px 55px rgba(42,37,32,0.09);
  }
  .card.feat    { background: var(--dark); border-color: var(--dark); }

  .card-badge {
    position: absolute;
    top: -1px; right: 1.8rem;
    font-size: 0.58rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    background: var(--gold);
    color: var(--cream);
    padding: 0.3rem 1rem;
  }
  .card-lvl {
    font-size: 0.62rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 0.5rem;
  }
  .feat .card-lvl { color: var(--gold-light); }

  .card-ar {
    font-family: 'Scheherazade New', serif;
    font-size: 1.45rem;
    direction: rtl;
    color: var(--fg-title);
    margin-bottom: 0.15rem;
  }
  .feat .card-ar { color: var(--sand); }

  .card-fr {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem;
    font-weight: 400;
    color: var(--fg);
    margin-bottom: 1.6rem;
  }
  .feat .card-fr { color: var(--cream); }

  .card-price  { display: flex; align-items: baseline; gap: 0.25rem; margin-bottom: 0.25rem; }
  .card-amount {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.8rem;
    font-weight: 500;
    line-height: 1;
    color: var(--gold);
  }
  .feat .card-amount { color: var(--gold-light); }
  .card-unit   { font-size: 0.74rem; color: var(--light); }
  .feat .card-unit { color: rgba(249,245,238,0.45); }

  .card-freq { font-size: 0.72rem; color: var(--light); margin-bottom: 1.5rem; }
  .feat .card-freq { color: rgba(249,245,238,0.4); }

  .card-sep { height: 1px; background: var(--border); margin-bottom: 1.5rem; }
  .feat .card-sep { background: rgba(212,184,150,0.15); }

  .card-feats {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    flex: 1;
    margin-bottom: 1.8rem;
  }
  .card-feats li {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--mid);
  }
  .feat .card-feats li { color: rgba(249,245,238,0.68); }
  .card-dot {
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--gold);
    margin-top: 6px;
    flex-shrink: 0;
  }
  .feat .card-dot { background: var(--gold-light); }

  .card-cta {
    font-family: 'Jost', sans-serif;
    font-size: 0.72rem;
    font-weight: 300;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    display: block;
    width: 100%;
    padding: 0.85rem;
    text-align: center;
    background: none;
    border: 1px solid var(--gold);
    color: var(--gold);
    cursor: pointer;
    transition: background 0.25s, color 0.25s, transform 0.2s;
    margin-top: auto;
  }
  .card-cta:hover { background: var(--gold); color: var(--cream); transform: translateY(-2px); }
  .feat .card-cta {
    border-color: rgba(212,184,150,0.4);
    color: var(--cream);
    background: rgba(184,134,46,0.22);
  }
  .feat .card-cta:hover { background: var(--gold-light); color: var(--dark); }

  /* Carte Coran — pleine largeur */
  .card-wide {
    grid-column: span 3;
    display: grid;
    grid-template-columns: 1.3fr 1fr auto;
    gap: 3rem;
    align-items: center;
  }
  .card-wide-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1rem;
    min-width: 175px;
  }
  .card-wide-actions .card-cta { width: 100%; }


  /* ═══════════════════════════════
     CONTACT
  ═══════════════════════════════ */
  .contact {
    background: var(--dark);
    color: var(--cream);
    position: relative;
    overflow: hidden;
  }
  .contact-deco {
    position: absolute;
    left: -2rem; bottom: -6rem;
    font-family: 'Scheherazade New', serif;
    font-size: 32rem;
    line-height: 1;
    color: rgba(255,255,255,0.022);
    pointer-events: none;
    user-select: none;
  }
  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 6rem;
    align-items: start;
    position: relative;
    z-index: 1;
  }
  .contact .s-eyebrow  { color: var(--gold-light); }
  .contact .s-title    { color: var(--cream); }
  .contact .s-title-ar { color: rgba(212,184,150,0.55); }
  .contact .s-body     { color: rgba(249,245,238,0.5); }

  .infos { display: flex; flex-direction: column; margin-top: 2.5rem; }
  .info-row {
    display: flex;
    gap: 1.1rem;
    align-items: flex-start;
    padding: 1.15rem 0;
    border-bottom: 1px solid rgba(212,134,46,0.1);
  }
  .info-icon  { font-size: 1rem; color: var(--gold); min-width: 1.5rem; text-align: center; margin-top: 3px; }
  .info-label {
    font-size: 0.63rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold-light);
    margin-bottom: 0.25rem;
  }
  .info-val { font-size: 0.88rem; color: rgba(249,245,238,0.6); line-height: 1.65; }
  .info-val a { color: rgba(249,245,238,0.6); text-decoration: none; transition: color 0.25s; }
  .info-val a:hover { color: var(--gold-light); }

  /* Formulaire */
  .form { display: flex; flex-direction: column; gap: 1.1rem; }
  .form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
  .field { display: flex; flex-direction: column; gap: 0.4rem; }
  .field label {
    font-size: 0.63rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--gold-light);
  }
  .field input,
  .field select,
  .field textarea {
    background: rgba(255,255,255,0.055);
    border: 1px solid rgba(212,134,46,0.18);
    color: var(--cream);
    padding: 0.85rem 1rem;
    font-family: 'Jost', sans-serif;
    font-size: 0.85rem;
    font-weight: 300;
    outline: none;
    border-radius: 0;
    appearance: none;
    transition: border-color 0.25s, background 0.25s;
  }
  .field input::placeholder,
  .field textarea::placeholder { color: rgba(249,245,238,0.2); }
  .field select option { background: var(--dark); }
  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: var(--gold);
    background: rgba(255,255,255,0.09);
  }
  .field textarea { resize: vertical; min-height: 108px; }

  .form-submit {
    align-self: flex-start;
    font-family: 'Jost', sans-serif;
    font-size: 0.74rem;
    font-weight: 300;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    background: var(--gold);
    color: var(--cream);
    border: none;
    padding: 1rem 2.4rem;
    cursor: pointer;
    transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
  }
  .form-submit:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 6px 22px rgba(184,134,46,0.32);
  }
  .form-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

  .form-msg {
    padding: 0.9rem 1.2rem;
    font-size: 0.82rem;
    border: 1px solid;
    animation: fadeIn 0.3s ease;
  }
  .form-msg.ok    { background: rgba(184,134,46,0.1);  border-color: rgba(184,134,46,0.28); color: var(--gold-light); }
  .form-msg.err   { background: rgba(180,60,60,0.09); border-color: rgba(180,60,60,0.26);  color: #df7070; }


  /* ═══════════════════════════════
     FOOTER
  ═══════════════════════════════ */
  .footer {
    background: #1e1a16;
    padding: 2rem 4rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .footer-logo { font-family: 'Scheherazade New', serif; font-size: 1.3rem; color: var(--gold); }
  .footer-copy { font-size: 0.7rem; color: rgba(156,140,124,0.5); letter-spacing: 0.06em; }
  .footer-nav  { display: flex; gap: 1.8rem; list-style: none; }
  .footer-nav a {
    font-size: 0.7rem;
    color: rgba(156,140,124,0.5);
    text-decoration: none;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transition: color 0.25s;
  }
  .footer-nav a:hover { color: var(--gold); }


  /* ═══════════════════════════════
     MODAL PRÉ-INSCRIPTION
  ═══════════════════════════════ */
  @keyframes modalIn {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  .modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(14,11,8,0.82);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
  }
  .modal-box {
    position: relative;
    background: #1e1a14;
    border: 1px solid rgba(184,134,46,0.22);
    border-top: 3px solid var(--gold);
    border-radius: 2px;
    padding: 2.8rem 3rem 3rem;
    width: 100%; max-width: 540px;
    animation: modalIn 0.28s cubic-bezier(0.22,1,0.36,1) both;
    box-shadow: 0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(184,134,46,0.06);
  }
  .modal-deco {
    font-family: 'Scheherazade New', serif;
    font-size: 3.5rem; line-height: 1;
    color: rgba(184,134,46,0.12);
    position: absolute; top: 1.4rem; right: 2rem;
    pointer-events: none; user-select: none;
  }
  .modal-close {
    position: absolute; top: 1.1rem; right: 1.3rem;
    background: none; border: 1px solid rgba(184,134,46,0.2);
    border-radius: 50%; width: 2rem; height: 2rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; color: var(--light);
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }
  .modal-close:hover {
    border-color: var(--gold); color: var(--gold);
    background: rgba(184,134,46,0.08);
  }
  .modal-eyebrow {
    font-size: 0.65rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--gold); margin: 0 0 0.55rem;
  }
  .modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.7rem; font-weight: 600; line-height: 1.2;
    color: #f0e8d8; margin: 0 0 0.5rem;
  }
  .modal-sep {
    width: 2.5rem; height: 1px;
    background: linear-gradient(90deg, var(--gold), transparent);
    margin: 1.2rem 0 1.8rem;
  }
  .modal-form { display: flex; flex-direction: column; gap: 1.3rem; }
  .modal-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
  .modal-field { display: flex; flex-direction: column; gap: 0.5rem; }
  .modal-field label {
    font-size: 0.67rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: #6b5d4f; font-weight: 400;
  }
  .modal-field input {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(184,134,46,0.22);
    border-radius: 2px;
    padding: 0.75rem 1rem;
    color: #f0e8d8; font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    font-family: inherit;
    -moz-appearance: textfield;
  }
  .modal-field input::-webkit-inner-spin-button,
  .modal-field input::-webkit-outer-spin-button { -webkit-appearance: none; }
  .modal-field input::placeholder { color: rgba(156,140,124,0.4); }
  .modal-field input:focus {
    border-color: var(--gold);
    background: rgba(184,134,46,0.06);
  }
  .modal-submit {
    margin-top: 0.6rem;
    padding: 1rem 2rem;
    background: var(--gold); color: #12100c;
    border: none; border-radius: 2px; cursor: pointer;
    font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase;
    font-weight: 700; font-family: inherit;
    transition: background 0.2s, transform 0.15s;
    width: 100%;
  }
  .modal-submit:hover { background: var(--gold-light); transform: translateY(-1px); }
  .modal-submit:active { transform: translateY(0); }
  .modal-success {
    background: rgba(184,134,46,0.08);
    border: 1px solid rgba(184,134,46,0.3);
    border-radius: 2px; padding: 1.4rem 1.6rem;
    color: #d4a94a; font-size: 0.9rem; line-height: 1.75;
    text-align: center;
  }
  @media (max-width: 480px) {
    .modal-box  { padding: 2.2rem 1.6rem 2.2rem; }
    .modal-row  { grid-template-columns: 1fr; }
  }

  /* ═══════════════════════════════
     CARROUSEL MOBILE
  ═══════════════════════════════ */
  .carousel { display: none; }

  .carousel-track {
    display: flex;
    align-items: stretch;
    transition: transform 0.42s cubic-bezier(0.22,1,0.36,1);
    will-change: transform;
  }
  .carousel-slide {
    min-width: 100%;
    padding: 0 1rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .carousel-slide .card {
    width: 100%;
    margin: 0 auto;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .carousel-slide .card .card-feats {
    flex: 1;
  }
  .carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: 1px solid rgba(184,134,46,0.35);
    color: var(--gold);
    font-size: 1.6rem;
    width: 2.4rem; height: 2.4rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, border-color 0.2s;
    z-index: 2;
  }
  .carousel-arrow:disabled { opacity: 0.2; cursor: default; }
  .carousel-arrow:not(:disabled):hover { background: rgba(184,134,46,0.12); border-color: var(--gold); }
  .carousel-arrow.prev { left: 0.2rem; }
  .carousel-arrow.next { right: 0.2rem; }
  .carousel-dots {
    display: flex;
    justify-content: center;
    gap: 0.55rem;
    margin-top: 1.4rem;
  }
  .carousel-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: rgba(184,134,46,0.25);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.25s, transform 0.25s;
  }
  .carousel-dot.active {
    background: var(--gold);
    transform: scale(1.4);
  }

  /* ═══════════════════════════════
     RESPONSIVE
  ═══════════════════════════════ */
  @media (max-width: 1024px) {
    .nav            { padding-inline: 2.5rem; }
    .section        { padding: 5rem 2.5rem; }
    .orn            { padding: 1.8rem 2.5rem; }
    .pres-grid      { grid-template-columns: 1fr; gap: 3rem; }
    .pres-deco      { display: none; }
    .grid-cards     { grid-template-columns: 1fr 1fr; }
    .card-wide      { grid-column: span 2; grid-template-columns: 1fr 1fr; }
    .card-wide-actions { align-items: flex-start; grid-column: span 2; }
    .contact-grid   { grid-template-columns: 1fr; gap: 3.5rem; }
    .footer         { padding: 2rem 2.5rem; }
  }

  @media (max-width: 768px) {
    /* Nav */
    .nav-list, .nav-cta  { display: none; }
    .hamburger           { display: flex; }
    .nav                 { padding-inline: 1.2rem; }

    /* Hero */
    .hero-inner          { padding: 3.5rem 1.5rem 3rem; text-align: center; max-width: 100%; }
    .hero-eyebrow        { justify-content: center; }
    .hero-title-ar       { font-size: clamp(2.2rem, 10vw, 3.5rem); }
    .hero-title-fr       { font-size: clamp(1.2rem, 4.5vw, 1.8rem); }
    .hero-desc           { font-size: 0.9rem; max-width: 100%; margin-inline: auto; }
    .hero-actions        { justify-content: center; flex-direction: column; align-items: center; }
    .hero-geo            { display: none; }
    /* Sections */
    .section             { padding: 3.5rem 1.4rem; }
    .orn                 { padding: 1.5rem 1.4rem; }
    .s-title             { font-size: clamp(1.6rem, 6vw, 2.4rem); }
    .s-title-ar          { font-size: clamp(1rem, 4vw, 1.4rem); }

    /* Stats */
    .stats               { flex-direction: column; gap: 1.5rem; align-items: center; text-align: center; }
    .stat-n              { font-size: 2.8rem; }

    /* Values */
    .values              { gap: 1.2rem; }
    .value               { padding: 1rem; }

    /* Carrousel / grille tarifs */
    .carousel            { display: block; position: relative; width: 100%; overflow: hidden; }
    .grid-cards          { display: none; }
    .card                { padding: 2rem 1.5rem; }
    .card-wide           { grid-column: span 1; display: flex; flex-direction: column; gap: 1.5rem; }
    .card-wide-actions   { flex-direction: column; align-items: stretch; gap: 1rem; }
    .card-amount         { font-size: 3rem; }

    /* Contact */
    .form-row2           { grid-template-columns: 1fr; }
    .infos               { gap: 1.2rem; }

    /* Footer */
    .footer              { flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.8rem 1.4rem; }
    .footer-nav          { flex-wrap: wrap; gap: 0.8rem; }
  }

  @media (max-width: 480px) {
    .btn-fill, .btn-outline { width: 100%; text-align: center; justify-content: center; }
    .modal-title            { font-size: 1.4rem; }
    .hero-inner             { padding: 2.5rem 1.2rem 2.5rem; }
    .section                { padding: 3rem 1.2rem; }
    .card                   { padding: 1.6rem 1.2rem; }
  }
`;

export default STYLES;
