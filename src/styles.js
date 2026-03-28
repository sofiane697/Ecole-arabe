const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Scheherazade+New:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');

  /* ─── Reset ─── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ─── Variables ─── */
  :root {
    --bg:         #ffffff;
    --bg-alt:     #f5f5f7;
    --bg-card:    #ffffff;
    --fg:         #1d1d1f;
    --fg-title:   #1d1d1f;
    --fg-mid:     #6e6e73;
    --fg-light:   #86868b;
    --gold:       #bf8a30;
    --gold-light: #d4a245;
    --gold-soft:  rgba(191,138,48,0.08);
    --border:     rgba(0,0,0,0.06);
    --shadow-sm:  0 2px 12px rgba(0,0,0,0.04);
    --shadow-md:  0 8px 30px rgba(0,0,0,0.06);
    --shadow-lg:  0 20px 60px rgba(0,0,0,0.08);
    --shadow-xl:  0 30px 80px rgba(0,0,0,0.12);
    --radius-sm:  12px;
    --radius-md:  20px;
    --radius-lg:  28px;
    --radius-xl:  40px;
    --nav-h:      72px;
    --ease:       cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --ease-out:   cubic-bezier(0.22, 1, 0.36, 1);
    --transition-theme: background 0.5s var(--ease), color 0.5s var(--ease), border-color 0.5s var(--ease);
  }

  /* ─── Dark mode ─── */
  html.dark {
    --bg:         #000000;
    --bg-alt:     #0a0a0a;
    --bg-card:    #1c1c1e;
    --fg:         #f5f5f7;
    --fg-title:   #f5f5f7;
    --fg-mid:     #a1a1a6;
    --fg-light:   #6e6e73;
    --border:     rgba(255,255,255,0.08);
    --shadow-sm:  0 2px 12px rgba(0,0,0,0.2);
    --shadow-md:  0 8px 30px rgba(0,0,0,0.3);
    --shadow-lg:  0 20px 60px rgba(0,0,0,0.4);
    --shadow-xl:  0 30px 80px rgba(0,0,0,0.5);
    --gold-soft:  rgba(191,138,48,0.12);
  }

  /* ─── Transition globale au changement de thème ─── */
  html.theme-transition,
  html.theme-transition *,
  html.theme-transition *::before,
  html.theme-transition *::after {
    transition: background 0.5s var(--ease), color 0.5s var(--ease), border-color 0.5s var(--ease), box-shadow 0.5s var(--ease), backdrop-filter 0.5s var(--ease) !important;
  }

  /* ─── Base ─── */
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 400;
    background: var(--bg);
    color: var(--fg);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    letter-spacing: -0.01em;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
  html.dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }

  /* ─── Keyframes ─── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes growX {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.12; transform: scale(1); }
    50%      { opacity: 0.22; transform: scale(1.04); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%      { transform: translateY(-14px) rotate(1deg); }
    66%      { transform: translateY(-6px) rotate(-1deg); }
  }
  @keyframes floatB {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(12px) rotate(-2deg); }
  }
  @keyframes floatC {
    0%, 100% { transform: translateY(0px); }
    40%      { transform: translateY(-10px); }
    80%      { transform: translateY(6px); }
  }
  @keyframes orbPulse {
    0%, 100% { transform: scale(1); opacity: 0.2; }
    50%      { transform: scale(1.2); opacity: 0.38; }
  }
  @keyframes orbPulse2 {
    0%, 100% { transform: scale(1); opacity: 0.12; }
    50%      { transform: scale(1.25); opacity: 0.25; }
  }
  @keyframes spinSlow {
    from { transform: translate(-50%,-50%) rotate(0deg); }
    to   { transform: translate(-50%,-50%) rotate(360deg); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* ─── Scroll reveal ─── */
  .sr {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.9s var(--ease-out), transform 0.9s var(--ease-out);
  }
  .sr.in       { opacity: 1; transform: none; }
  .sr.d1       { transition-delay: 0.1s; }
  .sr.d2       { transition-delay: 0.2s; }
  .sr.d3       { transition-delay: 0.3s; }


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
    background: rgba(255,255,255,0.72);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 1px solid var(--border);
    transition: background 0.3s var(--ease);
  }
  html.dark .nav {
    background: rgba(0,0,0,0.72);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
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
    transition: opacity 0.2s;
  }
  .logo:hover { opacity: 0.7; }
  .logo-ar {
    font-family: 'Scheherazade New', serif;
    font-size: 1.5rem;
    color: var(--gold);
    line-height: 1.1;
  }
  .logo-fr {
    font-family: 'Inter', sans-serif;
    font-weight: 300;
    font-size: 0.6rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--fg-light);
  }

  /* Liens desktop */
  .nav-list {
    display: flex;
    align-items: center;
    gap: 2.5rem;
    list-style: none;
  }
  .nav-btn {
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    font-weight: 400;
    letter-spacing: 0.01em;
    color: var(--fg-mid);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.4rem 0;
    position: relative;
    transition: color 0.3s var(--ease);
  }
  .nav-btn::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 50%; right: 50%;
    height: 1.5px;
    background: var(--gold);
    border-radius: 1px;
    transition: left 0.3s var(--ease-out), right 0.3s var(--ease-out);
  }
  .nav-btn:hover          { color: var(--fg); }
  .nav-btn:hover::after   { left: 0; right: 0; }
  .nav-btn.active         { color: var(--fg); font-weight: 500; }
  .nav-btn.active::after  { left: 0; right: 0; }

  /* CTA nav */
  .nav-cta {
    font-family: 'Inter', sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    color: #fff;
    background: var(--gold);
    border: none;
    padding: 0.55rem 1.5rem;
    border-radius: 980px;
    cursor: pointer;
    transition: all 0.3s var(--ease);
  }
  .nav-cta:hover {
    background: var(--gold-light);
    transform: scale(1.04);
    box-shadow: 0 4px 16px rgba(191,138,48,0.3);
  }

  /* Toggle thème */
  .theme-toggle {
    background: var(--gold-soft);
    border: none;
    border-radius: 50%;
    width: 2.2rem; height: 2.2rem;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--gold);
    font-size: 0.9rem;
    transition: all 0.3s var(--ease);
    flex-shrink: 0;
  }
  .theme-toggle:hover {
    background: var(--gold);
    color: #fff;
    transform: scale(1.08);
  }

  /* Groupe droite nav */
  .nav-right {
    display: flex;
    align-items: center;
    gap: 0.8rem;
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
    transition: transform 0.35s var(--ease-out), opacity 0.35s var(--ease);
  }
  html.dark .hamburger span { background: var(--fg); }
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
    gap: 2rem;
  }
  .mobile-menu.is-open { display: flex; animation: fadeIn 0.3s var(--ease); }
  html.dark .mobile-menu { background: var(--bg); }

  .mobile-link {
    font-family: 'Inter', sans-serif;
    font-size: 1.6rem;
    font-weight: 300;
    letter-spacing: -0.02em;
    color: var(--fg);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.3s var(--ease), transform 0.3s var(--ease);
    padding: 0.3rem 0;
  }
  .mobile-link:hover      { color: var(--gold); transform: translateY(-2px); }
  .mobile-link.active     { color: var(--gold); }
  html.dark .mobile-link  { color: var(--fg); }
  .mobile-link.cta-mobile {
    margin-top: 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: #fff;
    background: var(--gold);
    padding: 0.9rem 2.8rem;
    border-radius: 980px;
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
    background: var(--bg);
  }
  .hero-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 60% 50% at 60% 50%, rgba(191,138,48,0.06) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 10% 70%, rgba(191,138,48,0.04) 0%, transparent 60%);
  }
  html.dark .hero-glow {
    background:
      radial-gradient(ellipse 60% 50% at 60% 50%, rgba(191,138,48,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 10% 70%, rgba(191,138,48,0.04) 0%, transparent 60%);
  }
  /* ── Wrapper déco hero ── */
  .hero-deco-wrap {
    position: absolute;
    right: 0; top: 0; bottom: 0;
    width: 52%;
    pointer-events: none;
    overflow: hidden;
  }

  /* ── Orbes lumineux ── */
  .hero-orb {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(191,138,48,0.35) 0%, rgba(191,138,48,0) 70%);
  }
  .hero-orb-1 {
    width: 420px; height: 420px;
    top: 10%; right: 5%;
    animation: orbPulse 5s ease-in-out infinite;
  }
  .hero-orb-2 {
    width: 280px; height: 280px;
    bottom: 15%; right: 25%;
    animation: orbPulse2 7s ease-in-out infinite 1s;
  }
  html.dark .hero-orb-1 { background: radial-gradient(circle, rgba(191,138,48,0.45) 0%, rgba(191,138,48,0) 70%); }
  html.dark .hero-orb-2 { background: radial-gradient(circle, rgba(191,138,48,0.30) 0%, rgba(191,138,48,0) 70%); }

  /* ── Motif géométrique ── */
  .hero-geo {
    position: absolute;
    right: -3rem; top: 50%;
    transform: translateY(-50%);
    width: 90%;
    opacity: 0.12;
    animation: pulse 8s ease-in-out infinite;
  }
  html.dark .hero-geo { opacity: 0.18; }

  /* ── Lettres calligraphiques flottantes ── */
  .hero-calli-1, .hero-calli-2, .hero-calli-3 {
    position: absolute;
    font-family: 'Scheherazade New', serif;
    color: #b8862e;
    pointer-events: none;
    line-height: 1;
  }
  .hero-calli-1 {
    font-size: 18rem;
    top: 5%; right: 8%;
    opacity: 0.08;
    animation: float 7s ease-in-out infinite;
  }
  .hero-calli-2 {
    font-size: 10rem;
    bottom: 12%; right: 38%;
    opacity: 0.10;
    animation: floatB 9s ease-in-out infinite 1.5s;
  }
  .hero-calli-3 {
    font-size: 8rem;
    top: 55%; right: 8%;
    opacity: 0.07;
    animation: floatC 6s ease-in-out infinite 0.8s;
  }
  html.dark .hero-calli-1 { opacity: 0.14; }
  html.dark .hero-calli-2 { opacity: 0.16; }
  html.dark .hero-calli-3 { opacity: 0.12; }

  .hero-inner {
    position: relative;
    z-index: 2;
    padding: 6rem 4rem;
    max-width: 720px;
  }
  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold);
    background: var(--gold-soft);
    padding: 0.45rem 1.1rem 0.45rem 0.9rem;
    border-radius: 980px;
    margin-bottom: 2rem;
    animation: scaleIn 0.8s 0.1s var(--ease-out) both;
  }
  .hero-eyebrow::before {
    content: '';
    display: block;
    width: 6px; height: 6px;
    background: var(--gold);
    border-radius: 50%;
    flex-shrink: 0;
  }
  .hero-title-ar {
    font-family: 'Scheherazade New', serif;
    font-size: clamp(3rem, 7vw, 6rem);
    font-weight: 700;
    color: var(--fg-title);
    direction: rtl;
    line-height: 1.1;
    margin-bottom: 0.4rem;
    animation: fadeUp 1s 0.15s var(--ease-out) both;
  }
  html.dark .hero-title-ar { color: var(--fg-title); }
  .hero-title-fr {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.5rem, 3.5vw, 2.8rem);
    font-weight: 300;
    font-style: italic;
    color: var(--fg-mid);
    margin-bottom: 2rem;
    animation: fadeUp 1s 0.3s var(--ease-out) both;
  }
  html.dark .hero-title-fr { color: var(--fg-mid); }
  .hero-desc {
    font-size: 1.05rem;
    line-height: 1.8;
    color: var(--fg-mid);
    max-width: 480px;
    margin-bottom: 3rem;
    animation: fadeUp 1s 0.45s var(--ease-out) both;
  }
  html.dark .hero-desc { color: var(--fg-mid); }
  .hero-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    animation: fadeUp 1s 0.6s var(--ease-out) both;
  }

  .scroll-hint {
    position: absolute;
    bottom: 2.5rem;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    animation: float 2.5s ease infinite;
  }
  .scroll-hint-line {
    width: 1px;
    height: 36px;
    background: linear-gradient(to bottom, var(--gold), transparent);
  }
  .scroll-hint-text {
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--fg-light);
  }


  /* ═══════════════════════════════
     BOUTONS GLOBAUX
  ═══════════════════════════════ */
  .btn-fill {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    background: var(--gold);
    color: #fff;
    border: none;
    padding: 0.9rem 2.4rem;
    border-radius: 980px;
    cursor: pointer;
    transition: all 0.35s var(--ease);
  }
  .btn-fill:hover {
    background: var(--gold-light);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(191,138,48,0.3);
  }
  html.dark .btn-fill:hover { box-shadow: 0 8px 25px rgba(191,138,48,0.25); }

  .btn-outline {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    background: none;
    color: var(--fg-mid);
    border: 1.5px solid var(--border);
    padding: 0.9rem 2.4rem;
    border-radius: 980px;
    cursor: pointer;
    transition: all 0.35s var(--ease);
  }
  .btn-outline:hover {
    border-color: var(--gold);
    color: var(--gold);
    background: var(--gold-soft);
    transform: translateY(-2px);
  }
  html.dark .btn-outline { border-color: rgba(255,255,255,0.15); color: var(--fg-mid); }


  /* ═══════════════════════════════
     SECTION — éléments communs
  ═══════════════════════════════ */
  .section { padding: 1.5rem 4rem; }
  .wrap    { max-width: 1200px; margin-inline: auto; }

  .s-eyebrow {
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 0.8rem;
  }
  .s-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2rem, 4vw, 3.2rem);
    font-weight: 400;
    color: var(--fg-title);
    line-height: 1.15;
    margin-bottom: 0.4rem;
    letter-spacing: -0.01em;
  }
  html.dark .s-title { color: var(--fg-title); }
  .s-title-ar {
    font-family: 'Scheherazade New', serif;
    font-size: clamp(1.1rem, 2vw, 1.5rem);
    direction: rtl;
    color: var(--gold);
    margin-bottom: 1.5rem;
    opacity: 0.7;
  }
  .s-body {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--fg-mid);
    max-width: 520px;
  }
  html.dark .s-body { color: var(--fg-mid); }


  /* ═══════════════════════════════
     PRÉSENTATION
  ═══════════════════════════════ */
  .pres {
    background: var(--bg-alt);
    position: relative;
    overflow: hidden;
  }
  html.dark .pres { background: var(--bg-alt); }
  .pres-deco {
    position: absolute;
    right: 3rem; top: 50%;
    transform: translateY(-50%);
    font-family: 'Scheherazade New', serif;
    font-size: 28rem;
    line-height: 1;
    color: var(--gold);
    opacity: 0.03;
    pointer-events: none;
    user-select: none;
    animation: pulse 8s ease infinite;
  }
  .pres-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6rem;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  .stats {
    display: flex;
    gap: 3rem;
    margin-top: 3rem;
    flex-wrap: wrap;
  }
  .stat-n {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .stat-l {
    display: block;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--fg-light);
    margin-top: 0.4rem;
  }
  html.dark .stat-l { color: var(--fg-light); }

  .values { display: flex; flex-direction: column; gap: 0.8rem; }
  .value {
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
    padding: 1.4rem 1.6rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    transition: all 0.35s var(--ease);
  }
  .value:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: rgba(191,138,48,0.15);
  }
  html.dark .value { background: var(--bg-card); }
  html.dark .value:hover { box-shadow: var(--shadow-md); }
  .value-ico {
    font-family: 'Scheherazade New', serif;
    font-size: 1.5rem;
    color: var(--gold);
    line-height: 1;
    min-width: 2.4rem;
    height: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gold-soft);
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  .value-name {
    font-family: 'Inter', sans-serif;
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--fg-title);
    margin-bottom: 0.25rem;
    letter-spacing: -0.01em;
  }
  html.dark .value-name { color: var(--fg-title); }
  .value-desc {
    font-size: 0.84rem;
    color: var(--fg-mid);
    line-height: 1.6;
  }
  html.dark .value-desc { color: var(--fg-mid); }


  /* ═══════════════════════════════
     ORNEMENT / SÉPARATEUR
  ═══════════════════════════════ */
  .orn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1rem 4rem;
    background: var(--bg);
  }
  html.dark .orn { background: var(--bg); }
  .orn-line  { flex: 1; max-width: 120px; height: 1px; background: var(--border); }
  .orn-glyph { font-family: 'Scheherazade New', serif; font-size: 1.4rem; color: var(--gold); opacity: 0.4; }


  /* ═══════════════════════════════
     TARIFS
  ═══════════════════════════════ */
  .tarifs { background: var(--bg); padding-top: 1.5rem; }
  html.dark .tarifs { background: var(--bg); }
  .tarifs-head { text-align: center; margin-bottom: 3.5rem; }
  .tarifs-head .s-title-ar { text-align: center; }
  .tarifs-head .s-body     { margin: 0.8rem auto 0; text-align: center; max-width: 480px; }

  .grid-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.2rem;
  }

  /* Carte */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: all 0.4s var(--ease);
  }
  .card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
    border-color: rgba(191,138,48,0.12);
  }
  html.dark .card { background: var(--bg-card); }
  html.dark .card:hover { box-shadow: var(--shadow-lg); }

  .card.feat {
    background: linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%);
    border-color: rgba(191,138,48,0.2);
    box-shadow: var(--shadow-md);
  }
  html.dark .card.feat {
    background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%);
  }
  .card.feat:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-10px) scale(1.01);
  }

  .card-badge {
    position: absolute;
    top: 1.2rem; right: 1.2rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--gold);
    color: #fff;
    padding: 0.3rem 0.9rem;
    border-radius: 980px;
  }
  .card-lvl {
    font-family: 'Inter', sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 0.7rem;
  }
  .feat .card-lvl { color: var(--gold-light); }

  .card-ar {
    font-family: 'Scheherazade New', serif;
    font-size: 1.5rem;
    direction: rtl;
    color: var(--fg-title);
    margin-bottom: 0.15rem;
  }
  .feat .card-ar { color: #d4b896; }
  html.dark .card-ar { color: var(--fg-title); }

  .card-fr {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: var(--fg);
    margin-bottom: 1.6rem;
    letter-spacing: -0.01em;
  }
  .feat .card-fr { color: #f5f5f7; }
  html.dark .card-fr { color: var(--fg); }

  .card-price  { display: flex; align-items: baseline; gap: 0.2rem; margin-bottom: 0.3rem; }
  .card-amount {
    font-family: 'Inter', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    line-height: 1;
    color: var(--gold);
    letter-spacing: -0.03em;
  }
  .feat .card-amount { color: var(--gold-light); }
  .card-unit {
    font-size: 0.82rem;
    font-weight: 400;
    color: var(--fg-light);
  }
  .feat .card-unit { color: rgba(245,245,247,0.4); }

  .card-freq { font-size: 0.78rem; color: var(--fg-light); margin-bottom: 1.5rem; }
  .feat .card-freq { color: rgba(245,245,247,0.35); }

  .card-sep { height: 1px; background: var(--border); margin-bottom: 1.5rem; }
  .feat .card-sep { background: rgba(255,255,255,0.08); }

  .card-feats {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
    margin-bottom: 1.8rem;
  }
  .card-feats li {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--fg-mid);
  }
  .feat .card-feats li { color: rgba(245,245,247,0.6); }
  .card-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--gold);
    margin-top: 6px;
    flex-shrink: 0;
  }
  .feat .card-dot { background: var(--gold-light); }

  .card-cta {
    font-family: 'Inter', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    display: block;
    width: 100%;
    padding: 0.85rem;
    text-align: center;
    background: var(--gold-soft);
    border: none;
    border-radius: var(--radius-sm);
    color: var(--gold);
    cursor: pointer;
    transition: all 0.3s var(--ease);
    margin-top: auto;
  }
  .card-cta:hover {
    background: var(--gold);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(191,138,48,0.25);
  }
  .feat .card-cta {
    background: var(--gold);
    color: #fff;
  }
  .feat .card-cta:hover {
    background: var(--gold-light);
    box-shadow: 0 4px 16px rgba(191,138,48,0.4);
  }

  /* Carte Coran — pleine largeur */
  .card-wide {
    grid-column: span 3;
    display: grid;
    grid-template-columns: 1.3fr 1fr auto;
    gap: 3rem;
    align-items: center;
    border-radius: var(--radius-lg);
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
     TÉMOIGNAGES
  ═══════════════════════════════ */
  .temoignages {
    background: var(--bg-alt);
    position: relative;
    overflow: hidden;
  }
  html.dark .temoignages { background: var(--bg-alt); }

  .temoig-deco {
    font-family: 'Scheherazade New', serif;
    font-size: 18rem;
    color: var(--gold);
    opacity: 0.03;
    position: absolute;
    top: 50%; left: -3rem;
    transform: translateY(-50%);
    pointer-events: none;
    user-select: none;
    line-height: 1;
  }

  .temoig-head {
    text-align: center;
    margin-bottom: 4rem;
  }
  .temoig-head .s-title-ar { text-align: center; }

  .temoig-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.4rem;
  }

  .temoig-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2.2rem 2rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    transition: all 0.4s var(--ease);
    position: relative;
    overflow: hidden;
  }
  .temoig-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--gold), var(--gold-light));
    border-radius: 3px 3px 0 0;
  }
  .temoig-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-lg);
  }
  html.dark .temoig-card { background: var(--bg-card); }
  html.dark .temoig-card:hover { box-shadow: var(--shadow-lg); }

  .temoig-stars {
    font-size: 0.95rem;
    color: var(--gold);
    letter-spacing: 0.06em;
  }

  .temoig-quote {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.08rem;
    font-style: italic;
    font-weight: 400;
    line-height: 1.85;
    color: var(--fg);
    flex: 1;
  }
  html.dark .temoig-quote { color: var(--fg-mid); }

  .temoig-footer {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .temoig-avatar {
    width: 2.6rem; height: 2.6rem;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }

  .temoig-name {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--fg);
    letter-spacing: -0.01em;
  }
  html.dark .temoig-name { color: var(--fg); }

  .temoig-role {
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--gold);
    margin-top: 0.15rem;
  }


  /* ═══════════════════════════════
     CONTACT
  ═══════════════════════════════ */
  .contact {
    background: #1d1d1f;
    color: #f5f5f7;
    position: relative;
    overflow: hidden;
  }
  .contact-deco {
    position: absolute;
    left: -2rem; bottom: -6rem;
    font-family: 'Scheherazade New', serif;
    font-size: 32rem;
    line-height: 1;
    color: rgba(255,255,255,0.015);
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
  .contact .s-title    { color: #f5f5f7; }
  .contact .s-title-ar { color: rgba(212,162,69,0.5); }
  .contact .s-body     { color: rgba(245,245,247,0.5); }

  .infos { display: flex; flex-direction: column; margin-top: 2.5rem; }
  .info-row {
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
    padding: 1.2rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: all 0.3s var(--ease);
  }
  .info-row:hover {
    padding-left: 0.5rem;
  }
  .info-icon {
    color: var(--gold);
    min-width: 2rem; height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(191,138,48,0.1);
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  .info-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold-light);
    margin-bottom: 0.3rem;
  }
  .info-val { font-size: 0.9rem; color: rgba(245,245,247,0.6); line-height: 1.65; }
  .info-val a { color: rgba(245,245,247,0.6); text-decoration: none; transition: color 0.3s var(--ease); }
  .info-val a:hover { color: var(--gold-light); }

  /* Formulaire */
  .form { display: flex; flex-direction: column; gap: 1.2rem; }
  .form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
  .field { display: flex; flex-direction: column; gap: 0.5rem; }
  .field label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--gold-light);
  }
  .field input,
  .field select,
  .field textarea {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #f5f5f7;
    padding: 0.9rem 1.1rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    font-weight: 400;
    outline: none;
    border-radius: var(--radius-sm);
    appearance: none;
    transition: all 0.3s var(--ease);
  }
  .field input::placeholder,
  .field textarea::placeholder { color: rgba(245,245,247,0.2); }
  .field select option { background: #1d1d1f; }
  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: var(--gold);
    background: rgba(191,138,48,0.06);
    box-shadow: 0 0 0 3px rgba(191,138,48,0.1);
  }
  .field textarea { resize: vertical; min-height: 120px; }

  .form-submit {
    align-self: flex-start;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    background: var(--gold);
    color: #fff;
    border: none;
    padding: 0.9rem 2.4rem;
    border-radius: 980px;
    cursor: pointer;
    transition: all 0.35s var(--ease);
  }
  .form-submit:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(191,138,48,0.35);
  }
  .form-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

  .form-msg {
    padding: 1rem 1.3rem;
    font-size: 0.85rem;
    border-radius: var(--radius-sm);
    animation: scaleIn 0.3s var(--ease);
  }
  .form-msg.ok  { background: rgba(191,138,48,0.1); color: var(--gold-light); }
  .form-msg.err { background: rgba(220,60,60,0.1); color: #ff6b6b; }


  /* ═══════════════════════════════
     FOOTER
  ═══════════════════════════════ */
  .footer {
    background: #000;
    padding: 2.5rem 4rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .footer-logo {
    font-family: 'Scheherazade New', serif;
    font-size: 1.3rem;
    color: var(--gold);
  }
  .footer-copy {
    font-size: 0.75rem;
    color: rgba(245,245,247,0.3);
    letter-spacing: 0.02em;
  }
  .footer-nav  { display: flex; gap: 2rem; list-style: none; }
  .footer-nav a {
    font-size: 0.75rem;
    color: rgba(245,245,247,0.3);
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: color 0.3s var(--ease);
  }
  .footer-nav a:hover { color: var(--gold); }


  /* ═══════════════════════════════
     MODAL PRÉ-INSCRIPTION
  ═══════════════════════════════ */
  @keyframes modalIn {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
  }
  .modal-box {
    position: relative;
    background: #1c1c1e;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: var(--radius-lg);
    padding: 3rem;
    width: 100%; max-width: 540px;
    animation: modalIn 0.35s var(--ease-out) both;
    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
  }
  .modal-deco {
    font-family: 'Scheherazade New', serif;
    font-size: 3.5rem; line-height: 1;
    color: rgba(191,138,48,0.08);
    position: absolute; top: 1.5rem; right: 2rem;
    pointer-events: none; user-select: none;
  }
  .modal-close {
    position: absolute; top: 1.2rem; right: 1.2rem;
    background: rgba(255,255,255,0.06);
    border: none;
    border-radius: 50%; width: 2.2rem; height: 2.2rem;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; color: rgba(245,245,247,0.5);
    transition: all 0.3s var(--ease);
  }
  .modal-close:hover {
    background: rgba(255,255,255,0.12);
    color: #f5f5f7;
  }
  .modal-eyebrow {
    font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--gold); margin: 0 0 0.6rem;
  }
  .modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.7rem; font-weight: 500; line-height: 1.2;
    color: #f5f5f7; margin: 0 0 0.5rem;
  }
  .modal-sep {
    width: 2.5rem; height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
    border-radius: 2px;
    margin: 1.2rem 0 1.8rem;
  }
  .modal-form { display: flex; flex-direction: column; gap: 1.3rem; }
  .modal-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
  .modal-field { display: flex; flex-direction: column; gap: 0.5rem; }
  .modal-field label {
    font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(245,245,247,0.4);
  }
  .modal-field input {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: var(--radius-sm);
    padding: 0.8rem 1rem;
    color: #f5f5f7; font-size: 0.9rem;
    outline: none;
    transition: all 0.3s var(--ease);
    font-family: 'Inter', sans-serif;
    -moz-appearance: textfield;
  }
  .modal-field input::-webkit-inner-spin-button,
  .modal-field input::-webkit-outer-spin-button { -webkit-appearance: none; }
  .modal-field input::placeholder { color: rgba(245,245,247,0.2); }
  .modal-field input:focus {
    border-color: var(--gold);
    background: rgba(191,138,48,0.06);
    box-shadow: 0 0 0 3px rgba(191,138,48,0.1);
  }
  .modal-submit {
    margin-top: 0.6rem;
    padding: 0.9rem 2rem;
    background: var(--gold);
    color: #fff;
    border: none;
    border-radius: 980px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    transition: all 0.35s var(--ease);
    width: 100%;
  }
  .modal-submit:hover { background: var(--gold-light); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(191,138,48,0.35); }
  .modal-submit:active { transform: translateY(0); }
  .modal-success {
    background: rgba(191,138,48,0.08);
    border-radius: var(--radius-sm);
    padding: 1.5rem;
    color: var(--gold-light);
    font-size: 0.92rem;
    line-height: 1.7;
    text-align: center;
  }
  @media (max-width: 480px) {
    .modal-box  { padding: 2.2rem 1.6rem; }
    .modal-row  { grid-template-columns: 1fr; }
  }


  /* ═══════════════════════════════
     CARROUSEL MOBILE
  ═══════════════════════════════ */
  .carousel { display: none; }

  .carousel-track {
    display: flex;
    align-items: stretch;
    transition: transform 0.5s var(--ease-out);
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
  .carousel-slide .card .card-feats { flex: 1; }
  .carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--gold);
    font-size: 1.4rem;
    width: 2.6rem; height: 2.6rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.3s var(--ease);
    z-index: 2;
    box-shadow: var(--shadow-sm);
  }
  .carousel-arrow:disabled { opacity: 0.2; cursor: default; }
  .carousel-arrow:not(:disabled):hover {
    background: var(--gold);
    color: #fff;
    border-color: var(--gold);
    box-shadow: 0 4px 16px rgba(191,138,48,0.25);
  }
  .carousel-arrow.prev { left: 0.3rem; }
  .carousel-arrow.next { right: 0.3rem; }
  .carousel-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.6rem;
  }
  .carousel-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--border);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.3s var(--ease);
  }
  .carousel-dot.active {
    background: var(--gold);
    transform: scale(1.3);
  }


  /* ═══════════════════════════════
     RESPONSIVE
  ═══════════════════════════════ */
  @media (max-width: 1024px) {
    .nav            { padding-inline: 2.5rem; }
    .section        { padding: 4rem 2.5rem; }
    .orn            { padding: 1rem 2.5rem; }
    .pres-grid      { grid-template-columns: 1fr; gap: 3.5rem; }
    .pres-deco      { display: none; }
    .grid-cards     { grid-template-columns: 1fr 1fr; }
    .card-wide      { grid-column: span 2; grid-template-columns: 1fr 1fr; }
    .card-wide-actions { align-items: flex-start; grid-column: span 2; }
    .contact-grid   { grid-template-columns: 1fr; gap: 3.5rem; }
    .footer         { padding: 2rem 2.5rem; }
    .temoig-grid    { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 768px) {
    .nav-list, .nav-cta  { display: none; }
    .hamburger           { display: flex; }
    .nav                 { padding-inline: 1.2rem; }

    .hero-inner          { padding: 3.5rem 1.5rem 3rem; text-align: center; max-width: 100%; }
    .hero-eyebrow        { justify-content: center; }
    .hero-title-ar       { font-size: clamp(2.4rem, 10vw, 3.8rem); }
    .hero-title-fr       { font-size: clamp(1.2rem, 4.5vw, 1.8rem); }
    .hero-desc           { font-size: 0.95rem; max-width: 100%; margin-inline: auto; }
    .hero-actions        { justify-content: center; flex-direction: column; align-items: center; }
    .hero-deco-wrap      { display: none; }

    .section             { padding: 3.5rem 1.4rem; }
    .orn                 { padding: 1rem 1.4rem; }
    .s-title             { font-size: clamp(1.7rem, 6vw, 2.6rem); }
    .s-title-ar          { font-size: clamp(1rem, 4vw, 1.4rem); }

    .stats               { flex-direction: column; gap: 1.8rem; align-items: center; text-align: center; }
    .stat-n              { font-size: 3rem; }

    .values              { gap: 0.8rem; }
    .value               { padding: 1.2rem; }

    .temoig-grid         { grid-template-columns: 1fr; }
    .temoig-deco         { display: none; }

    .carousel            { display: block; position: relative; width: 100%; overflow: hidden; }
    .grid-cards          { display: none; }
    .card                { padding: 2rem 1.5rem; }
    .card-wide           { grid-column: span 1; display: flex; flex-direction: column; gap: 1.5rem; }
    .card-wide-actions   { flex-direction: column; align-items: stretch; gap: 1rem; }
    .card-amount         { font-size: 3rem; }

    .form-row2           { grid-template-columns: 1fr; }
    .infos               { gap: 0; }

    .footer              { flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.8rem 1.4rem; }
    .footer-nav          { flex-wrap: wrap; gap: 1rem; }
  }

  @media (max-width: 480px) {
    .btn-fill, .btn-outline { width: 100%; text-align: center; justify-content: center; }
    .modal-title            { font-size: 1.4rem; }
    .hero-inner             { padding: 2.5rem 1.2rem 2.5rem; }
    .section                { padding: 3rem 1.2rem; }
    .card                   { padding: 1.8rem 1.4rem; }
  }
`;

export default STYLES;
