import { useState, useEffect, useCallback, useRef } from 'react';
import STYLES from './styles';
import { NAV, COURSES, VALUES, CONTACT_INFO, CORAN_FEATURES, TESTIMONIALS } from './data';
import { useScrollReveal, useActiveSection, useCounter } from './hooks';

/* ══════════════════════════════════════════════════════
   PETITS COMPOSANTS RÉUTILISABLES
══════════════════════════════════════════════════════ */

/** Compteur animé (chiffres statistiques) */
function Counter({ target, prefix = '', suffix = '' }) {
  const { ref, value } = useCounter(target);
  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}

/** SVG motif géométrique islamique */
function GeoPattern() {
  return (
    <svg className="hero-geo" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <polygon points="40,2 78,22 78,58 40,78 2,58 2,22"    fill="none" stroke="#b8862e" strokeWidth="0.8" />
          <polygon points="40,14 66,28 66,52 40,66 14,52 14,28" fill="none" stroke="#b8862e" strokeWidth="0.4" />
          <circle  cx="40" cy="40" r="4"                         fill="none" stroke="#b8862e" strokeWidth="0.6" />
          <line x1="40" y1="2"  x2="40" y2="14" stroke="#b8862e" strokeWidth="0.4" />
          <line x1="40" y1="66" x2="40" y2="78" stroke="#b8862e" strokeWidth="0.4" />
          <line x1="2"  y1="40" x2="14" y2="40" stroke="#b8862e" strokeWidth="0.4" />
          <line x1="66" y1="40" x2="78" y2="40" stroke="#b8862e" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#geo)" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   CARROUSEL MOBILE (section tarifs)
══════════════════════════════════════════════════════ */
function CarouselCards({ onInscribe }) {
  const total = COURSES.length + 1; // +1 pour la carte Coran
  const [idx, setIdx]   = useState(0);
  const touchX          = useRef(null);

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(total - 1, i + 1));

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchX.current === null) return;
    const diff = touchX.current - e.changedTouches[0].clientX;
    if (diff > 40)  next();
    if (diff < -40) prev();
    touchX.current = null;
  };

  return (
    <div className="carousel">
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${idx * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {COURSES.map((c, i) => (
          <div key={i} className="carousel-slide">
            <div className={`card ${c.featured ? 'feat' : ''}`}>
              {c.featured && <div className="card-badge">Recommandé</div>}
              <p className="card-lvl">{c.level}</p>
              <div className="card-ar">{c.ar}</div>
              <div className="card-fr">{c.fr}</div>
              <div className="card-price">
                <span className="card-amount">{c.price}</span>
                <span className="card-unit">€ / mois</span>
              </div>
              <div className="card-freq">{c.freq}</div>
              <div className="card-sep" />
              <ul className="card-feats">
                {c.features.map((f, j) => (
                  <li key={j}><span className="card-dot" />{f}</li>
                ))}
              </ul>
              <button className="card-cta" onClick={() => onInscribe(c.fr)}>
                S'inscrire
              </button>
            </div>
          </div>
        ))}

        {/* Carte Coran */}
        <div className="carousel-slide">
          <div className="card">
            <p className="card-lvl">Spécialisation</p>
            <div className="card-ar">تحفيظ القرآن الكريم</div>
            <div className="card-fr">Lecture & Mémorisation Coranique</div>
            <p style={{ fontSize: '0.83rem', color: 'var(--mid)', lineHeight: 1.75, marginTop: '0.5rem' }}>
              Apprentissage du Tajwid, mémorisation des sourates et lecture du
              Coran avec beauté et exactitude. Pour enfants et adultes.
            </p>
            <div className="card-sep" />
            <ul className="card-feats">
              {CORAN_FEATURES.map((f, i) => (
                <li key={i}><span className="card-dot" />{f}</li>
              ))}
            </ul>
            <div className="card-price" style={{ marginTop: '1rem' }}>
              <span className="card-amount">60</span>
              <span className="card-unit">€ / mois</span>
            </div>
            <div className="card-freq">2 séances / semaine · 1h</div>
            <button className="card-cta" onClick={() => onInscribe('Lecture & Mémorisation Coranique')}>
              S'inscrire
            </button>
          </div>
        </div>
      </div>

      {/* Flèches */}
      <button className="carousel-arrow prev" onClick={prev} disabled={idx === 0}>‹</button>
      <button className="carousel-arrow next" onClick={next} disabled={idx === total - 1}>›</button>

      {/* Dots */}
      <div className="carousel-dots">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === idx ? 'active' : ''}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL PRÉ-INSCRIPTION
══════════════════════════════════════════════════════ */
const SUPABASE_URL  = 'https://nsdnzqdbpdncrksgxtar.supabase.co';
const SUPABASE_ANON = 'sb_publishable_gy6LoTbs3JCS4v77W2Oomg_weoSRhWL';

function PreInscriptionModal({ cours, onClose }) {
  const [data, setData]     = useState({ nom: '', prenom: '', age: '', annees: '' });
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'err'

  const handleChange = (e) =>
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':         SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({
          nom:             data.nom,
          prenom:          data.prenom,
          age:             parseInt(data.age),
          annees_pratique: parseInt(data.annees),
          cours:           cours,
        }),
      });
      if (!res.ok) throw new Error(res.status);
      setStatus('ok');
    } catch (err) {
      console.error(err);
      setStatus('err');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-deco">ن</div>
        <p className="modal-eyebrow">Pré-inscription</p>
        <h3 className="modal-title">{cours}</h3>
        <div className="modal-sep" />

        {status === 'ok' ? (
          <div className="modal-success">
            ✓ &nbsp; Votre demande a bien été enregistrée.<br />Nous vous contacterons sous 24h.
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-row">
              <div className="modal-field">
                <label htmlFor="mi-nom">Nom</label>
                <input id="mi-nom" name="nom" type="text" required placeholder="Dupont"
                  value={data.nom} onChange={handleChange} />
              </div>
              <div className="modal-field">
                <label htmlFor="mi-prenom">Prénom</label>
                <input id="mi-prenom" name="prenom" type="text" required placeholder="Marie"
                  value={data.prenom} onChange={handleChange} />
              </div>
            </div>
            <div className="modal-row">
              <div className="modal-field">
                <label htmlFor="mi-age">Âge</label>
                <input id="mi-age" name="age" type="number" min="5" max="99" required placeholder="25"
                  value={data.age} onChange={handleChange} />
              </div>
              <div className="modal-field">
                <label htmlFor="mi-annees">Années de pratique de l'arabe</label>
                <input id="mi-annees" name="annees" type="number" min="0" max="50" required placeholder="0"
                  value={data.annees} onChange={handleChange} />
              </div>
            </div>
            <button type="submit" className="modal-submit">Envoyer ma demande</button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════ */
export default function App() {
  /* — État global — */
  const [menuOpen, setMenuOpen]     = useState(false);
  const [formData, setFormData]     = useState({ prenom: '', nom: '', email: '', cours: '', message: '' });
  const [formStatus, setFormStatus] = useState(null); // null | 'loading' | 'ok' | 'err'
  const [modalCours, setModalCours] = useState(null); // null | string (nom du cours)
  const [darkMode, setDarkMode]     = useState(() => localStorage.getItem('theme') === 'dark');

  /* — Toggle dark mode — */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('theme-transition');
    if (darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    const timer = setTimeout(() => html.classList.remove('theme-transition'), 400);
    return () => clearTimeout(timer);
  }, [darkMode]);

  /* — Hooks — */
  const active = useActiveSection();
  useScrollReveal();

  /* — CSS global injecté une seule fois — */
  useEffect(() => {
    const tag = document.createElement('style');
    tag.innerHTML = STYLES;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  /* — Bloquer le scroll quand le menu mobile est ouvert — */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  /* — Scroll fluide vers une section (avec offset du header) — */
  const goTo = useCallback((id) => {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 60);
  }, []);

  /* — Formulaire — */
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('loading');

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':         SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(res.status);
      setFormStatus('ok');
      setFormData({ prenom: '', nom: '', email: '', cours: '', message: '' });
      setTimeout(() => setFormStatus(null), 5000);
    } catch (err) {
      console.error(err);
      setFormStatus('err');
    }
  };

  /* ════════════════════════════════════════════════
     RENDU
  ════════════════════════════════════════════════ */
  return (
    <>

      {/* ─────────────────────────────
          NAVIGATION
      ───────────────────────────── */}
      <nav className="nav">

        {/* Logo */}
        <button className="logo" onClick={() => goTo('accueil')}>
          <span className="logo-ar">مدرسة النور</span>
          <span className="logo-fr">École Al-Nour</span>
        </button>

        {/* Liens desktop */}
        <ul className="nav-list">
          {NAV.map(({ id, label }) => (
            <li key={id}>
              <button
                className={`nav-btn ${active === id ? 'active' : ''}`}
                onClick={() => goTo(id)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Nav droite : CTA + toggle thème + hamburger */}
        <div className="nav-right">
          <button className="nav-cta" onClick={() => goTo('contact')}>
            S'inscrire
          </button>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Changer le thème"
          >
            {darkMode ? '☀' : '☾'}
          </button>
          <button
            className={`hamburger ${menuOpen ? 'is-open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Ouvrir le menu"
          >
            <span /><span /><span />
          </button>
        </div>

      </nav>


      {/* ─────────────────────────────
          MENU MOBILE
      ───────────────────────────── */}
      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}>
        {NAV.map(({ id, label }) => (
          <button
            key={id}
            className={`mobile-link ${active === id ? 'active' : ''}`}
            onClick={() => goTo(id)}
          >
            {label}
          </button>
        ))}
        <button
          className="mobile-link cta-mobile"
          onClick={() => goTo('contact')}
        >
          S'inscrire
        </button>
      </div>


      {/* ─────────────────────────────
          HÉROS
      ───────────────────────────── */}
      <section className="hero" id="accueil">
        <div className="hero-glow" />
        <GeoPattern />

        <div className="hero-inner">
          <div className="hero-eyebrow">Bienvenue à l'école Al-Nour</div>
          <h1 className="hero-title-ar">مدرسة النور</h1>
          <p  className="hero-title-fr">L'art de la langue arabe</p>
          <p  className="hero-desc">
            Une institution d'excellence dédiée à l'enseignement de la langue arabe —
            alphabet, grammaire, lecture coranique et culture — pour enfants et adultes,
            tous niveaux confondus.
          </p>
          <div className="hero-actions">
            <button className="btn-fill"    onClick={() => goTo('tarifs')}>Découvrir les cours</button>
            <button className="btn-outline" onClick={() => goTo('presentation')}>En savoir plus</button>
          </div>
        </div>

        <div className="scroll-hint">
          <div className="scroll-hint-line" />
          <span className="scroll-hint-text">Défiler</span>
        </div>
      </section>


      {/* ─────────────────────────────
          PRÉSENTATION
      ───────────────────────────── */}
      <section className="section pres" id="presentation">
        <div className="pres-deco">ن</div>

        <div className="wrap pres-grid">

          {/* Colonne texte + stats */}
          <div className="sr">
            <p className="s-eyebrow">Notre école</p>
            <h2 className="s-title">Une pédagogie<br />bienveillante & exigeante</h2>
            <p className="s-title-ar">التعليم نور يضيء العقول</p>
            <p className="s-body">
              Fondée avec la conviction que la langue arabe est un pont entre les
              cultures et les générations, l'École Al-Nour propose un enseignement
              structuré, progressif et adapté à chaque apprenant.
            </p>
            <p className="s-body" style={{ marginTop: '1rem' }}>
              Nos enseignants qualifiés accompagnent chaque élève avec patience et
              rigueur, du premier tracé de l'alphabet jusqu'à la maîtrise de la
              lecture et de l'expression écrite.
            </p>
            <div className="stats">
              <div>
                <span className="stat-n"><Counter target={200} prefix="+" /></span>
                <span className="stat-l">Élèves formés</span>
              </div>
              <div>
                <span className="stat-n"><Counter target={8} /></span>
                <span className="stat-l">Ans d'expérience</span>
              </div>
              <div>
                <span className="stat-n"><Counter target={4} /></span>
                <span className="stat-l">Enseignants</span>
              </div>
            </div>
          </div>

          {/* Colonne valeurs */}
          <div className="values sr d2">
            {VALUES.map((v, i) => (
              <div key={i} className="value">
                <div className="value-ico">{v.icon}</div>
                <div>
                  <div className="value-name">{v.name}</div>
                  <div className="value-desc">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ─────────────────────────────
          SÉPARATEUR ORNEMENTAL
      ───────────────────────────── */}
      <div className="orn">
        <div className="orn-line" />
        <div className="orn-glyph">❧</div>
        <div className="orn-line" />
      </div>


      {/* ─────────────────────────────
          TARIFS
      ───────────────────────────── */}
      <section className="section tarifs" id="tarifs">

        {/* En-tête centré */}
        <div className="tarifs-head sr">
          <p className="s-eyebrow">Nos formations</p>
          <h2 className="s-title">Cours & Tarifs</h2>
          <p className="s-title-ar">اختر مسارك التعليمي</p>
          <p className="s-body">
            Choisissez la formule adaptée à votre niveau et à votre rythme.
            Accessibles dès 5 ans.
          </p>
        </div>

        {/* Carrousel mobile */}
        <CarouselCards onInscribe={setModalCours} />

        <div className="wrap grid-cards">

          {/* 3 cartes niveaux */}
          {COURSES.map((c, i) => (
            <div
              key={i}
              className={`card sr ${c.featured ? 'feat' : ''} ${i > 0 ? `d${i}` : ''}`}
            >
              {c.featured && <div className="card-badge">Recommandé</div>}
              <p className="card-lvl">{c.level}</p>
              <div className="card-ar">{c.ar}</div>
              <div className="card-fr">{c.fr}</div>
              <div className="card-price">
                <span className="card-amount">{c.price}</span>
                <span className="card-unit">€ / mois</span>
              </div>
              <div className="card-freq">{c.freq}</div>
              <div className="card-sep" />
              <ul className="card-feats">
                {c.features.map((f, j) => (
                  <li key={j}><span className="card-dot" />{f}</li>
                ))}
              </ul>
              <button className="card-cta" onClick={() => setModalCours(c.fr)}>
                S'inscrire
              </button>
            </div>
          ))}

          {/* Carte spécialisation Coran — pleine largeur */}
          <div className="card card-wide sr">
            <div>
              <p className="card-lvl">Spécialisation</p>
              <div className="card-ar">تحفيظ القرآن الكريم</div>
              <div className="card-fr">Lecture & Mémorisation Coranique</div>
              <p style={{ fontSize: '0.83rem', color: 'var(--mid)', lineHeight: 1.75, marginTop: '0.5rem' }}>
                Apprentissage du Tajwid (règles de récitation), mémorisation des sourates
                et lecture du Coran avec beauté et exactitude. Cours pour enfants et adultes,
                en individuel ou en groupe.
              </p>
            </div>
            <ul className="card-feats">
              {CORAN_FEATURES.map((f, i) => (
                <li key={i}><span className="card-dot" />{f}</li>
              ))}
            </ul>
            <div className="card-wide-actions">
              <div>
                <div className="card-price">
                  <span className="card-amount">60</span>
                  <span className="card-unit">€ / mois</span>
                </div>
                <div className="card-freq">2 séances / semaine · 1h</div>
              </div>
              <button className="card-cta" onClick={() => setModalCours('Lecture & Mémorisation Coranique')}>
                S'inscrire
              </button>
            </div>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────
          TÉMOIGNAGES
      ───────────────────────────── */}
      <section className="section temoignages" id="temoignages">
        <div className="temoig-deco">ق</div>

        <div className="temoig-head sr">
          <p className="s-eyebrow">Ils nous font confiance</p>
          <h2 className="s-title">Témoignages</h2>
          <p className="s-title-ar">آراء طلابنا</p>
        </div>

        <div className="wrap temoig-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className={`temoig-card sr ${i > 0 ? `d${i}` : ''}`}>
              <div className="temoig-stars">
                {'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}
              </div>
              <p className="temoig-quote">« {t.quote} »</p>
              <div className="temoig-footer">
                <div className="temoig-avatar">{t.initials}</div>
                <div>
                  <div className="temoig-name">{t.name}</div>
                  <div className="temoig-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="orn">
        <div className="orn-line" />
        <div className="orn-glyph">❧</div>
        <div className="orn-line" />
      </div>

      {/* ─────────────────────────────
          CONTACT
      ───────────────────────────── */}
      <section className="section contact" id="contact">
        <div className="contact-deco">ع</div>

        <div className="wrap contact-grid">

          {/* Infos */}
          <div className="sr">
            <p className="s-eyebrow">Nous écrire</p>
            <h2 className="s-title">Prendre contact</h2>
            <p className="s-title-ar">تواصل معنا</p>
            <p className="s-body">
              Vous souhaitez inscrire votre enfant, connaître votre niveau ou
              obtenir des informations ? Nous répondons sous 24h.
            </p>
            <div className="infos">
              {CONTACT_INFO.map(({ label, jsx }, i) => (
                <div key={i} className="info-row">
                  <div className="info-icon">
                    {i === 0 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 0 1 14 0c0 5-7 12.5-7 12.5z"/>
                        <circle cx="12" cy="8.5" r="2.5"/>
                      </svg>
                    )}
                    {i === 1 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2a11.4 11.4 0 0 0 3.6 1.1c.6.1 1 .6 1 1.2V20a2 2 0 0 1-2.2 2C8.4 21 3 15.6 3 8.8A2 2 0 0 1 5 6.6h2.7c.6 0 1.1.4 1.2 1 .1 1.2.4 2.4 1.1 3.5.1.3 0 .7-.2 1L6.6 10.8z"/>
                      </svg>
                    )}
                    {i === 2 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="m2 7 10 7 10-7"/>
                      </svg>
                    )}
                    {i === 3 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"/>
                        <path d="M12 7v5l3.5 2"/>
                      </svg>
                    )}
                    {i === 4 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="5" r="2"/>
                        <path d="M11 7v5"/>
                        <path d="M9 12H7a2 2 0 0 0-2 2v1h12v-1a2 2 0 0 0-2-2h-2"/>
                        <path d="M5 15v4"/>
                        <path d="M19 15v4"/>
                        <path d="M7 15h10"/>
                        <circle cx="17" cy="5" r="1.5"/>
                        <path d="M17 6.5V9"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="info-label">{label}</div>
                    <div className="info-val">{jsx}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulaire */}
          <form className="form sr d2" onSubmit={handleSubmit} noValidate>

            <div className="form-row2">
              <div className="field">
                <label htmlFor="prenom">Prénom</label>
                <input
                  id="prenom" type="text" placeholder="Votre prénom"
                  value={formData.prenom} onChange={handleChange} required
                />
              </div>
              <div className="field">
                <label htmlFor="nom">Nom</label>
                <input
                  id="nom" type="text" placeholder="Votre nom"
                  value={formData.nom} onChange={handleChange} required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email" type="email" placeholder="votre@email.com"
                value={formData.email} onChange={handleChange} required
              />
            </div>

            <div className="field">
              <label htmlFor="cours">Cours souhaité</label>
              <select id="cours" value={formData.cours} onChange={handleChange}>
                <option value="">— Sélectionner un cours —</option>
                <option value="debutant">Débutant – Alphabet (35 € / mois)</option>
                <option value="intermediaire">Intermédiaire – Lecture (55 € / mois)</option>
                <option value="avance">Avancé – Expression (75 € / mois)</option>
                <option value="coran">Lecture Coranique (60 € / mois)</option>
                <option value="renseignement">Simple renseignement</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                placeholder="Parlez-nous de votre niveau, de vos objectifs…"
                value={formData.message} onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="form-submit"
              disabled={formStatus === 'loading'}
            >
              {formStatus === 'loading' ? 'Envoi en cours…' : 'Envoyer le message'}
            </button>

            {formStatus === 'ok'  && (
              <div className="form-msg ok">
                ✓ &nbsp; Message envoyé — nous vous répondrons sous 24h.
              </div>
            )}
            {formStatus === 'err' && (
              <div className="form-msg err">
                ✕ &nbsp; Erreur lors de l'envoi. Réessayez ou contactez-nous par email.
              </div>
            )}

          </form>

        </div>
      </section>


      {/* ─────────────────────────────
          FOOTER
      ───────────────────────────── */}
      <footer className="footer">
        <div className="footer-logo">مدرسة النور</div>
        <span className="footer-copy">© 2025 École Al-Nour — Tous droits réservés</span>
        <ul className="footer-nav">
          <li><a href="#">Mentions légales</a></li>
          <li><a href="#">Confidentialité</a></li>
        </ul>
      </footer>

      {modalCours && (
        <PreInscriptionModal cours={modalCours} onClose={() => setModalCours(null)} />
      )}

    </>
  );
}
