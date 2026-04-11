import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import STYLES from './styles';
import { NAV, COURSES, VALUES, CONTACT_INFO, CORAN_FEATURES, TESTIMONIALS } from './data';
import { useScrollReveal, useActiveSection, useCounter } from './hooks';
import CinematicIntro from './CinematicIntro';

// ─── Palettes de couleurs ─────────────────────────────────────────────────────
const THEMES = [
  {
    id: 1,
    cls:         'theme-1',
    name:        'Couleurs de base',
    accent:      '#bf8a30',
    accentLight: '#d4a245',
    accentSoft:  'rgba(191,138,48,0.09)',
    bg:          '#ffffff',
    bgAlt:       '#f5f5f7',
    bgCard:      '#ffffff',
    fg:          '#1d1d1f',
    fgMid:       '#6e6e73',
    fgLight:     '#86868b',
    border:      'rgba(0,0,0,0.06)',
  },
  {
    id: 2,
    cls:         'theme-2',
    name:        'Couleurs n°2',
    // #FFC4A5 · #FFAA95 · #E38F97 · #B27D8B · #696571
    accent:      '#E38F97',                      // rose → boutons, accents, liens actifs
    accentLight: '#FFAA95',                      // saumon → survol
    accentSoft:  'rgba(227,143,151,0.22)',
    bg:          '#ffffff',                      // blanc → fond principal
    bgAlt:       '#FFC4A5',                      // pêche → sections alternées
    bgCard:      '#ffffff',                      // blanc → fond des cartes
    fg:          '#696571',                      // gris-violet → texte principal
    fgMid:       '#B27D8B',                      // mauve → texte secondaire
    fgLight:     '#B27D8B',                      // mauve → labels, détails
    border:      'rgba(105,101,113,0.18)',
  },
  {
    id: 3,
    cls:         'theme-3',
    name:        'Couleurs n°3',
    // #CE8F8A · #FBF0E9 · #805050 · #D4C2A1 · #AD9C92
    accent:      '#CE8F8A',                      // rose terracotta → boutons, accents
    accentLight: '#D4C2A1',                      // beige chaud → survol doux
    accentSoft:  'rgba(206,143,138,0.12)',
    bg:          '#ffffff',                      // blanc → fond principal
    bgAlt:       '#FBF0E9',                      // crème → sections alternées
    bgCard:      '#ffffff',                      // blanc → fond des cartes
    fg:          '#805050',                      // bordeaux → texte principal
    fgMid:       '#AD9C92',                      // taupe → texte secondaire
    fgLight:     '#D4C2A1',                      // beige → labels discrets
    border:      'rgba(173,156,146,0.20)',
  },
  {
    id: 4,
    cls:         'theme-4',
    name:        'Couleur n°4',
    // 🔵 #1E3A5F · 🩵 #4DA8DA · 🤍 #FFFFFF · 🌙 #F2E9E4 · ✨ #E0C097
    accent:      '#1E3A5F',                      // bleu profond → boutons, accents principaux
    accentLight: '#4DA8DA',                      // bleu clair → survol, interactif
    accentSoft:  'rgba(77,168,218,0.10)',         // bleu clair léger → fonds subtils
    bg:          '#EEF4F9',                      // blanc-bleu doux → fond principal
    bgAlt:       '#FFFFFF',                      // blanc → sections alternées (aération)
    bgCard:      '#FFFFFF',                      // blanc → fond des cartes
    fg:          '#1E3A5F',                      // bleu profond → texte principal
    fgMid:       'rgba(30,58,95,0.65)',           // bleu profond doux → texte secondaire
    fgLight:     '#E0C097',                      // doré doux → labels, détails élégants
    border:      'rgba(30,58,95,0.09)',           // bleu profond discret → bordures
  },
  {
    id: 5,
    cls:         'theme-5',
    name:        'Style Apple',
    // Couleurs officielles Apple — apple.com
    accent:      '#0071e3',                      // Bleu Apple → boutons, liens, CTA
    accentLight: '#0077ed',                      // Bleu Apple survol
    accentSoft:  'rgba(0,113,227,0.08)',          // Bleu Apple très léger → fonds subtils
    bg:          '#ffffff',                      // Blanc → fond principal
    bgAlt:       '#f5f5f7',                      // Gris clair Apple → sections alternées
    bgCard:      '#ffffff',                      // Blanc → fond des cartes
    fg:          '#1d1d1f',                      // Noir Apple → texte principal
    fgMid:       '#6e6e73',                      // Gris moyen Apple → texte secondaire
    fgLight:     '#86868b',                      // Gris clair Apple → labels discrets
    border:      'rgba(0,0,0,0.06)',             // Bordure Apple subtile
  },
  {
    id: 6,
    cls:         'theme-6',
    name:        'Couleur n°6',
    // Inspiré du logo — orangé #E8825A · pêche #F5B08A · mauve #9B6B7A · brun-mauve #7A4F5A
    // Neutralisés et désaturés pour une palette sobre et universelle
    accent:      '#B8805E',                      // Terracotta neutre → boutons, accents
    accentLight: '#CC9A74',                      // Sable chaud → survol
    accentSoft:  'rgba(184,128,94,0.09)',         // Terracotta très léger → fonds subtils
    bg:          '#FAF5F0',                      // Blanc chaud → fond principal
    bgAlt:       '#F0E8E0',                      // Crème → sections alternées
    bgCard:      '#FFFFFF',                      // Blanc pur → cartes
    fg:          '#2E2420',                      // Brun très foncé → texte principal
    fgMid:       '#7A5E56',                      // Brun-mauve moyen → texte secondaire
    fgLight:     '#A08888',                      // Mauve grisé → labels discrets
    border:      'rgba(122,94,86,0.10)',          // Brun neutre discret → bordures
  },
  // ➕ Ajouter ici les prochaines palettes (id: 7, id: 8, ...)
];

const ALL_THEME_CLASSES = THEMES.map(t => t.cls);

function applyTheme(theme) {
  const root = document.documentElement;
  // Retirer toutes les classes de thème puis appliquer la bonne
  root.classList.remove(...ALL_THEME_CLASSES);
  if (theme.cls) root.classList.add(theme.cls);
  // Variables CSS
  root.style.setProperty('--gold',       theme.accent);
  root.style.setProperty('--gold-light', theme.accentLight);
  root.style.setProperty('--gold-soft',  theme.accentSoft);
  root.style.setProperty('--bg',         theme.bg);
  root.style.setProperty('--bg-alt',     theme.bgAlt);
  root.style.setProperty('--bg-card',    theme.bgCard);
  root.style.setProperty('--fg',         theme.fg);
  root.style.setProperty('--fg-mid',     theme.fgMid);
  root.style.setProperty('--fg-light',   theme.fgLight);
  root.style.setProperty('--border',     theme.border);
  localStorage.setItem('site_palette', String(theme.id));
}

// ─── Sélecteur de palette flottant ───────────────────────────────────────────
function ThemeSwitcher({ themeId, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const S = {
    wrap: {
      position: 'fixed', bottom: 24, right: 24, zIndex: 9000,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
    },
    panel: {
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '14px 16px',
      boxShadow: '0 8px 40px rgba(0,0,0,.18)',
      display: open ? 'flex' : 'none',
      flexDirection: 'column', gap: 8, minWidth: 210,
      animation: 'fadeSlideUp .2s ease',
    },
    panelTitle: {
      fontSize: 11, fontWeight: 700, color: 'var(--fg-light)',
      textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4,
    },
    row: (active) => ({
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
      background: active ? 'var(--gold-soft)' : 'transparent',
      border: `1px solid ${active ? 'var(--gold)' : 'transparent'}`,
      transition: 'all .15s',
    }),
    swatch: (color, active) => ({
      width: 28, height: 28, borderRadius: '50%', background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: active ? `0 0 0 3px ${color}44` : 'none',
      transition: 'box-shadow .2s',
    }),
    check: { fontSize: 14, color: '#fff', fontWeight: 700, lineHeight: 1 },
    label: (active) => ({
      fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? 'var(--fg)' : 'var(--fg-mid)', lineHeight: 1.3,
    }),
    trigger: {
      width: 44, height: 44, borderRadius: '50%', border: 'none',
      background: 'var(--gold)', color: '#fff', fontSize: 20,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,.25)', transition: 'transform .2s',
    },
  };

  return (
    <div ref={ref} style={S.wrap}>
      {/* Panel palettes */}
      <div style={S.panel}>
        <div style={S.panelTitle}>Palette de couleurs</div>
        {THEMES.map(t => {
          const active = t.id === themeId;
          return (
            <div key={t.id} style={S.row(active)} onClick={() => { onChange(t); setOpen(false); }}>
              <div style={S.swatch(t.accent, active)}>
                {active && <span style={S.check}>✓</span>}
              </div>
              <div>
                <div style={S.label(active)}>{t.name}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton déclencheur */}
      <button
        style={S.trigger}
        onClick={() => setOpen(o => !o)}
        title="Changer la palette de couleurs"
      >
        🎨
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PETITS COMPOSANTS RÉUTILISABLES
══════════════════════════════════════════════════════ */

/** Compteur animé (chiffres statistiques) */
function Counter({ target, prefix = '', suffix = '' }) {
  const { ref, value } = useCounter(target);
  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}

/** SVG motif géométrique islamique */
// Sélection esthétique — lettres espacées, sans chevauchement
const HERO_LETTERS = [
  { l:'ل', size:'18rem', top:'6%',  left:'52%', dur:'8.5s', delay:'0s',   anim:'1' },
  { l:'ا', size:'13rem', top:'3%',  left:'5%',  dur:'6.0s', delay:'2.1s', anim:'3' },
  { l:'م', size:'9rem',  top:'40%', left:'68%', dur:'5.5s', delay:'1.5s', anim:'2' },
  { l:'ن', size:'11rem', top:'63%', left:'48%', dur:'6.8s', delay:'3.2s', anim:'4' },
  { l:'ع', size:'7rem',  top:'25%', left:'38%', dur:'4.8s', delay:'0.8s', anim:'1' },
  { l:'ح', size:'14rem', top:'32%', left:'4%',  dur:'7.2s', delay:'1.9s', anim:'3' },
  { l:'ق', size:'6rem',  top:'82%', left:'72%', dur:'4.2s', delay:'4.0s', anim:'2' },
  { l:'ي', size:'8rem',  top:'12%', left:'78%', dur:'5.8s', delay:'2.7s', anim:'4' },
  { l:'ص', size:'5rem',  top:'46%', left:'30%', dur:'4.5s', delay:'0.4s', anim:'2' },
  { l:'ب', size:'10rem', top:'76%', left:'24%', dur:'6.3s', delay:'3.5s', anim:'3' },
];

function HeroDeco() {
  return (
    <div className="hero-deco-wrap">
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      {HERO_LETTERS.map(({ l, size, top, left, dur, delay, anim }, i) => (
        <div
          key={i}
          className="hero-letter"
          data-anim={anim}
          style={{ fontSize: size, top, left, '--dur': dur, '--delay': delay }}
        >
          {l}
        </div>
      ))}
    </div>
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
const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON;

function calcAge(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const born  = new Date(dateStr);
  let age = today.getFullYear() - born.getFullYear();
  const m = today.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
  return age >= 0 ? age : null;
}

function PreInscriptionModal({ cours, onClose }) {
  const [data, setData]     = useState({ nom: '', prenom: '', date_naissance: '', telephone: '', email: '', annees: '' });
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'err'

  const handleChange = (e) =>
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const age = calcAge(data.date_naissance);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':         SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({
          nom:             data.nom.trim().slice(0, 100),
          prenom:          data.prenom.trim().slice(0, 100),
          date_naissance:  data.date_naissance,
          age:             age,
          telephone:       data.telephone.trim().slice(0, 30),
          email:           data.email.trim().slice(0, 200),
          annees_pratique: parseInt(data.annees),
          cours:           cours,
        }),
      });
      if (!res.ok) throw new Error(res.status);
      setStatus('ok');
    } catch (err) {
      setStatus('err');
    }
  };

  const agePreview = calcAge(data.date_naissance);

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
                <label htmlFor="mi-dob">
                  Date de naissance
                  {agePreview !== null && <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--gold)', fontSize: '0.82em' }}>({agePreview} ans)</span>}
                </label>
                <input id="mi-dob" name="date_naissance" type="date" required
                  max={new Date().toISOString().split('T')[0]}
                  value={data.date_naissance} onChange={handleChange} />
              </div>
              <div className="modal-field">
                <label htmlFor="mi-annees">Années de pratique de l'arabe</label>
                <input id="mi-annees" name="annees" type="number" min="0" max="50" required placeholder="0"
                  value={data.annees} onChange={handleChange} />
              </div>
            </div>
            <div className="modal-row">
              <div className="modal-field">
                <label htmlFor="mi-tel">Téléphone</label>
                <input id="mi-tel" name="telephone" type="tel" required placeholder="+33 6 12 34 56 78"
                  value={data.telephone} onChange={handleChange} />
              </div>
              <div className="modal-field">
                <label htmlFor="mi-email">Email</label>
                <input id="mi-email" name="email" type="email" required placeholder="votre@email.com"
                  value={data.email} onChange={handleChange} />
              </div>
            </div>
            {status === 'err' && (
              <div className="modal-error">✕ &nbsp; Une erreur est survenue. Réessayez.</div>
            )}
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
  /* — Intro cinématique — */
  const [introPlayed, setIntroPlayed] = useState(false);

  /* — État global — */
  const [menuOpen, setMenuOpen]     = useState(false);
  const [formData, setFormData]     = useState({ prenom: '', nom: '', telephone: '', email: '', cours: '', message: '' });
  const [formStatus, setFormStatus] = useState(null); // null | 'loading' | 'ok' | 'err'
  const [cooldown, setCooldown]     = useState(0); // secondes restantes avant prochain envoi
  const cooldownRef                 = useRef(null);
  const [modalCours, setModalCours] = useState(null); // null | string (nom du cours)
  const [darkMode, setDarkMode]     = useState(() => localStorage.getItem('theme') === 'dark');
  const [themeId, setThemeId]       = useState(() => parseInt(localStorage.getItem('site_palette') || '1'));

  /* — Appliquer la palette au montage et à chaque changement — */
  useEffect(() => {
    const t = THEMES.find(t => t.id === themeId) || THEMES[0];
    applyTheme(t);
  }, [themeId]);

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
  useLayoutEffect(() => {
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

  /* — Nettoyer le timer cooldown au démontage — */
  useEffect(() => () => clearInterval(cooldownRef.current), []);

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
    if (cooldown > 0) return;

    // Validation
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    if (!emailOk) { setFormStatus('invalid-email'); return; }
    if (formData.message.trim().length < 10) { setFormStatus('invalid-msg'); return; }

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
        body: JSON.stringify({
          prenom:    formData.prenom.trim().slice(0, 100),
          nom:       formData.nom.trim().slice(0, 100),
          telephone: formData.telephone.trim().slice(0, 30),
          email:     formData.email.trim().slice(0, 200),
          cours:     formData.cours,
          message:   formData.message.trim().slice(0, 2000),
        }),
      });
      if (!res.ok) throw new Error(res.status);
      setFormStatus('ok');
      setFormData({ prenom: '', nom: '', telephone: '', email: '', cours: '', message: '' });
      setTimeout(() => setFormStatus(null), 5000);
      // Cooldown 30s
      setCooldown(30);
      cooldownRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setFormStatus('err');
    }
  };

  /* ════════════════════════════════════════════════
     RENDU
  ════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Intro cinématique ── */}
      {!introPlayed && <CinematicIntro onComplete={() => setIntroPlayed(true)} />}

      {/* ─────────────────────────────
          NAVIGATION
      ───────────────────────────── */}
      <nav className="nav">

        {/* Logo */}
        <button className="logo" onClick={() => goTo('accueil')}>
          <img src="/aa.png" alt="Institut As-Safaa" className="logo-img" />
          <div className="logo-text">
            <span className="logo-ar">الصفاء</span>
            <span className="logo-fr">Institut As-Safaa</span>
          </div>
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
        <HeroDeco />

        <div className="hero-inner">
          <div className="hero-eyebrow">Bienvenue à l'Institut As-Safaa</div>
          <div className="hero-title-row">
            <span className="hero-title-fr-name">Institut As-Safaa</span>
            <h1 className="hero-title-ar">الصفاء</h1>
          </div>
          <p  className="hero-title-fr">Transmettre le savoir, éclairer les cœurs</p>
          <p  className="hero-desc">
            Une institution d'excellence dédiée à l'enseignement de la lecture du Coran,
            aux sciences islamiques et à la langue arabe — pour enfants et adultes.
          </p>
          <div className="hero-actions">
            <button className="btn-fill"    onClick={() => goTo('tarifs')}>Découvrir les cours</button>
            <a href="/portail/login" className="btn-outline" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>Mon portail</a>
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
              cultures et les générations, l'Institut As-Safaa propose un enseignement
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

            <div className="form-row2">
              <div className="field">
                <label htmlFor="telephone">Téléphone</label>
                <input
                  id="telephone" type="tel" placeholder="+33 6 12 34 56 78"
                  value={formData.telephone} onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email" type="email" placeholder="votre@email.com"
                  value={formData.email} onChange={handleChange} required
                />
              </div>
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
              disabled={formStatus === 'loading' || cooldown > 0}
            >
              {formStatus === 'loading'
                ? 'Envoi en cours…'
                : cooldown > 0
                  ? `Patienter ${cooldown}s avant un nouvel envoi`
                  : 'Envoyer le message'}
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
            {formStatus === 'invalid-email' && (
              <div className="form-msg err">
                ✕ &nbsp; Adresse email invalide.
              </div>
            )}
            {formStatus === 'invalid-msg' && (
              <div className="form-msg err">
                ✕ &nbsp; Le message doit contenir au moins 10 caractères.
              </div>
            )}

          </form>

        </div>
      </section>


      {/* ─────────────────────────────
          FOOTER
      ───────────────────────────── */}
      <footer className="footer">
        <div className="footer-logo">الصفاء — Institut As-Safaa</div>
        <span className="footer-copy">© 2025 Institut As-Safaa — Tous droits réservés</span>
        <ul className="footer-nav">
          <li><a href="#">Mentions légales</a></li>
          <li><a href="#">Confidentialité</a></li>
        </ul>
      </footer>

      {modalCours && (
        <PreInscriptionModal cours={modalCours} onClose={() => setModalCours(null)} />
      )}

      {/* ─── Sélecteur de palette ─── */}
      <ThemeSwitcher
        themeId={themeId}
        onChange={(t) => { applyTheme(t); setThemeId(t.id); }}
      />

    </>
  );
}
