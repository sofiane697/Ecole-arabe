import { useState, useEffect, useCallback } from 'react';
import { CONTACT_INFO } from './data';
import { useScrollReveal } from './hooks';
import ParcoursApp from './parcours/ParcoursApp';
import LoginMenu, { PORTAILS } from './LoginMenu';

// ─── Rate-limiting côté client (formulaire contact) ──────────────────────────
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON;

function checkRateLimit(key) {
  const now = Date.now();
  const storageKey = `rl_${key}`;
  let record;
  try { record = JSON.parse(localStorage.getItem(storageKey)) || { attempts: 0, firstAttempt: now, blockedUntil: 0 }; }
  catch { record = { attempts: 0, firstAttempt: now, blockedUntil: 0 }; }

  if (record.blockedUntil > now) {
    const remaining = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, message: `Trop de tentatives. Réessayez dans ${remaining} minute(s).` };
  }
  if (now - record.firstAttempt > 3600000) record = { attempts: 0, firstAttempt: now, blockedUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) record.blockedUntil = now + 3600000;
  else if (record.attempts >= 3) record.blockedUntil = now + 600000;
  try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch {}
  return { allowed: true };
}

// Liens de navigation
const NAV_LINKS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'apropos', label: 'À propos' },
  { id: 'contact', label: 'Contact' },
];

/* ══════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════ */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ prenom: '', nom: '', telephone: '', email: '', cours: '', message: '' });
  const [formStatus, setFormStatus] = useState(null);
  const [contactRlMsg, setContactRlMsg] = useState(null);
  const [homeKey, setHomeKey] = useState(0); // remonte le parcours quand on clique « Accueil »
  const [atHome, setAtHome] = useState(true); // true = accueil (3 stickers) → Contact + footer visibles


  /* — Le site public reste toujours en thème clair (pas de mode sombre) — */
  /* — On réserve l'espace de la scrollbar tant que le site public est monté :
       évite que la navbar fixe se décale de quelques pixels quand la barre de
       défilement apparaît/disparaît entre deux écrans du parcours. Scopé au
       site public (retiré au démontage) → aucun impact sur les portails. — */
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('site-scroll-stable');
    return () => document.documentElement.classList.remove('site-scroll-stable');
  }, []);

  // [atHome] : réobserve les .sr quand Contact / À propos réapparaissent
  // après un retour à l'accueil depuis un parcours.
  useScrollReveal([atHome]);

  /* — Bloquer le scroll quand le menu mobile est ouvert — */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  /* — Navigation — */
  const goHome = useCallback(() => {
    setMenuOpen(false);
    setHomeKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToId = useCallback((id) => {
    setMenuOpen(false);
    if (!atHome) setHomeKey((k) => k + 1); // dans le parcours → revenir à l'accueil d'abord
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
    }, atHome ? 60 : 220);
  }, [atHome]);

  const onNav = (id) => (id === 'accueil' ? goHome() : scrollToId(id));

  /* — Formulaire contact — */
  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rl = checkRateLimit('contact');
    if (!rl.allowed) { setContactRlMsg(rl.message); return; }
    setContactRlMsg(null);

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    if (!emailOk) { setFormStatus('invalid-email'); return; }
    if (formData.message.trim().length < 10) { setFormStatus('invalid-msg'); return; }

    setFormStatus('loading');
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, Prefer: 'return=minimal' },
        body: JSON.stringify({
          prenom: formData.prenom.trim().slice(0, 100),
          nom: formData.nom.trim().slice(0, 100),
          telephone: formData.telephone.trim().slice(0, 30),
          email: formData.email.trim().slice(0, 200),
          cours: formData.cours,
          message: formData.message.trim().slice(0, 2000),
        }),
      });
      if (!res.ok) throw new Error(res.status);
      setFormStatus('ok');
      setFormData({ prenom: '', nom: '', telephone: '', email: '', cours: '', message: '' });
      setTimeout(() => setFormStatus(null), 5000);
    } catch { setFormStatus('err'); }
  };

  /* ════════════ RENDU ════════════ */
  return (
    <div className="site-root">
      {/* NAVIGATION */}
      <nav className="nav">
        <button className="logo" onClick={goHome}>
          <img src="/aa.png" alt="Educamoov" className="logo-img" />
          <div className="logo-text">
            <span className="logo-fr">Educamoov</span>
          </div>
        </button>

        <ul className="nav-list">
          {NAV_LINKS.map(({ id, label }) => (
            <li key={id}>
              <button className="nav-btn" onClick={() => onNav(id)}>{label}</button>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          <LoginMenu />
          <button className={`hamburger ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen((o) => !o)} aria-label="Ouvrir le menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* MENU MOBILE */}
      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}>
        {NAV_LINKS.map(({ id, label }) => (
          <button key={id} className="mobile-link" onClick={() => onNav(id)}>{label}</button>
        ))}
        <div className="mobile-login-title">Me connecter</div>
        {PORTAILS.map((p) => (
          <a key={p.href} href={p.href} className="mobile-link mobile-login-link no-underline">{p.label}</a>
        ))}
      </div>

      {/* PARCOURS PAR STICKERS (remplace hero / présentation / tarifs / témoignages) */}
      <ParcoursApp key={homeKey} onAtHomeChange={setAtHome} />

      {/* CONTACT + FOOTER : visibles uniquement sur l'accueil (parcours = plein écran) */}
      {atHome && (
      <>
      {/* À PROPOS */}
      <section className="section apropos" id="apropos">
        <div className="apropos-deco">ن</div>
        <div className="wrap apropos-grid">
          <div className="apropos-intro sr">
            <p className="s-eyebrow">À propos</p>
            <h2 className="s-title">Qui sommes-nous&nbsp;?</h2>
            <p className="s-title-ar">من نحن</p>
            <p className="s-body">
              Educamoov est un institut dédié à la transmission de la langue arabe et
              des sciences religieuses, au soutien scolaire et à l'entraide. Notre vocation :
              accompagner chacun — enfant comme adulte — dans un cadre bienveillant,
              structuré et exigeant.
            </p>
            <p className="s-body">
              Des enseignants qualifiés, des parcours progressifs et une attention portée
              à chaque élève, pour apprendre dans la durée et avec sens.
            </p>
          </div>

          <ul className="apropos-piliers">
            <li className="pilier sr d1">
              <span className="pilier-ar">العِلم</span>
              <h3 className="pilier-titre">Transmission</h3>
              <p className="pilier-desc">Arabe, Coran et éducation islamique, enseignés avec rigueur et pédagogie.</p>
            </li>
            <li className="pilier sr d2">
              <span className="pilier-ar">النجاح</span>
              <h3 className="pilier-titre">Réussite</h3>
              <p className="pilier-desc">Un soutien scolaire académique pour consolider les acquis et progresser.</p>
            </li>
            <li className="pilier sr d3">
              <span className="pilier-ar">التضامن</span>
              <h3 className="pilier-titre">Solidarité</h3>
              <p className="pilier-desc">Un engagement social de proximité : entraide, garde d'enfants, aide aux aînés.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* CONTACT (conservé) */}
      <section className="section contact" id="contact">
        <div className="contact-deco">ع</div>
        <div className="wrap contact-grid">
          <div className="sr">
            <p className="s-eyebrow">Nous écrire</p>
            <h2 className="s-title">Prendre contact</h2>
            <p className="s-title-ar">تواصل معنا</p>
            <p className="s-body">
              Vous souhaitez inscrire votre enfant, connaître votre niveau ou obtenir des informations ? Nous répondons sous 24h.
            </p>
            <div className="infos">
              {CONTACT_INFO.map(({ label, jsx }, i) => (
                <div key={i} className="info-row">
                  <div className="info-icon">
                    {i === 0 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 0 1 14 0c0 5-7 12.5-7 12.5z" /><circle cx="12" cy="8.5" r="2.5" />
                      </svg>
                    )}
                    {i === 1 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2a11.4 11.4 0 0 0 3.6 1.1c.6.1 1 .6 1 1.2V20a2 2 0 0 1-2.2 2C8.4 21 3 15.6 3 8.8A2 2 0 0 1 5 6.6h2.7c.6 0 1.1.4 1.2 1 .1 1.2.4 2.4 1.1 3.5.1.3 0 .7-.2 1L6.6 10.8z" />
                      </svg>
                    )}
                    {i === 2 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                      </svg>
                    )}
                    {i === 3 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
                      </svg>
                    )}
                    {i === 4 && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="5" r="2" /><path d="M11 7v5" /><path d="M9 12H7a2 2 0 0 0-2 2v1h12v-1a2 2 0 0 0-2-2h-2" />
                        <path d="M5 15v4" /><path d="M19 15v4" /><path d="M7 15h10" /><circle cx="17" cy="5" r="1.5" /><path d="M17 6.5V9" />
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

          <form className="form sr d2" onSubmit={handleSubmit} noValidate>
            <div className="form-row2">
              <div className="field">
                <label htmlFor="prenom">Prénom</label>
                <input id="prenom" type="text" placeholder="Votre prénom" value={formData.prenom} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="nom">Nom</label>
                <input id="nom" type="text" placeholder="Votre nom" value={formData.nom} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row2">
              <div className="field">
                <label htmlFor="telephone">Téléphone</label>
                <input id="telephone" type="tel" placeholder="+33 6 12 34 56 78" value={formData.telephone} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="cours">Sujet</label>
              <select id="cours" value={formData.cours} onChange={handleChange}>
                <option value="">— Sélectionner un sujet —</option>
                <option value="enseignement-religieux">Enseignement religieux</option>
                <option value="soutien-scolaire">Soutien scolaire académique</option>
                <option value="social">Social</option>
                <option value="renseignement">Simple renseignement</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea id="message" placeholder="Parlez-nous de votre besoin, de vos objectifs…" value={formData.message} onChange={handleChange} />
            </div>
            <button type="submit" className="form-submit" disabled={formStatus === 'loading'}>
              {formStatus === 'loading' ? 'Envoi en cours…' : 'Envoyer le message'}
            </button>

            {contactRlMsg && <div className="form-msg err">✕ &nbsp; {contactRlMsg}</div>}
            {formStatus === 'ok' && <div className="form-msg ok">✓ &nbsp; Message envoyé — nous vous répondrons sous 24h.</div>}
            {formStatus === 'err' && <div className="form-msg err">✕ &nbsp; Erreur lors de l'envoi. Réessayez ou contactez-nous par email.</div>}
            {formStatus === 'invalid-email' && <div className="form-msg err">✕ &nbsp; Adresse email invalide.</div>}
            {formStatus === 'invalid-msg' && <div className="form-msg err">✕ &nbsp; Le message doit contenir au moins 10 caractères.</div>}
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">Educamoov</div>
        <span className="footer-copy">© 2026 Educamoov — Tous droits réservés</span>
        <ul className="footer-nav">
          <li><a href="#">Mentions légales</a></li>
          <li><a href="#">Confidentialité</a></li>
        </ul>
      </footer>
      </>
      )}

    </div>
  );
}
