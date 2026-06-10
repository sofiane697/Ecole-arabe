import { useState } from 'react';
import gsap from 'gsap';

const btnEnter = (e) => gsap.to(e.currentTarget, { y: -2, duration: 0.25, ease: 'power3.out' });
const btnLeave = (e) => gsap.to(e.currentTarget, { y: 0, duration: 0.25, ease: 'power3.out' });

/**
 * Écran « Devis personnalisé » : pas de tarif fixe.
 * Le visiteur décrit son besoin (sujet + message) + ses coordonnées.
 * Layout « checkout » réutilisé : résumé du parcours à gauche, formulaire à droite.
 * PROTOTYPE — l'envoi est factice (pas d'écriture Supabase pour l'instant).
 *
 * @param {Array}    path   Nœuds traversés (pôle → … → Devis personnalisé)
 * @param {Function} onSent Appelé quand le formulaire est « envoyé »
 */
export default function DevisStep({ path, onSent }) {
  const [form, setForm] = useState({
    prenom: '', nom: '', telephone: '', email: '', sujet: '', besoin: '',
  });
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const { prenom, nom, telephone, email, ...reste } = form;
    // ⚠️ PROTOTYPE : on ne fait que remonter la demande. Aucun envoi réseau.
    onSent({
      choix: path.map((n) => n.label),
      devis: reste, // { sujet, besoin }
      coord: { prenom, nom, telephone, email },
    });
  };

  return (
    <div className="recap parcours-anim">
      {/* ─ Colonne résumé / parcours ─ */}
      <aside className="recap-summary">
        <div className="recap-eyebrow">Votre demande</div>

        <nav className="recap-path">
          {path.map((n, i) => (
            <span className="recap-crumb" key={n.id}>
              {i > 0 && <span className="recap-sep">›</span>}
              {n.label}
            </span>
          ))}
        </nav>

        <div className="recap-formule">
          <span className="recap-formule-nom">Devis personnalisé</span>
        </div>
        <p className="recap-rythme">
          Chaque accompagnement est unique : décrivez votre besoin, nous vous
          proposons une formule et un tarif adaptés.
        </p>

        <div className="recap-total">
          <span className="recap-total-label">Tarif</span>
          <span className="recap-total-val">Sur mesure</span>
        </div>
      </aside>

      {/* ─ Colonne formulaire ─ */}
      <form className="recap-form" onSubmit={submit}>
        <div className="recap-eyebrow">Vos coordonnées</div>

        <div className="recap-row2">
          <div className="recap-field">
            <label htmlFor="d-prenom">Prénom</label>
            <input id="d-prenom" name="prenom" type="text" required
              value={form.prenom} onChange={change} placeholder="Votre prénom" />
          </div>
          <div className="recap-field">
            <label htmlFor="d-nom">Nom</label>
            <input id="d-nom" name="nom" type="text" required
              value={form.nom} onChange={change} placeholder="Votre nom" />
          </div>
        </div>
        <div className="recap-field">
          <label htmlFor="d-tel">Téléphone</label>
          <input id="d-tel" name="telephone" type="tel" required
            value={form.telephone} onChange={change} placeholder="+33 6 12 34 56 78" />
        </div>
        <div className="recap-field">
          <label htmlFor="d-email">Email</label>
          <input id="d-email" name="email" type="email" required
            value={form.email} onChange={change} placeholder="votre@email.com" />
        </div>
        <div className="recap-field">
          <label htmlFor="d-sujet">Sujet</label>
          <input id="d-sujet" name="sujet" type="text" required
            value={form.sujet} onChange={change} placeholder="Ex. : Coran pour mon enfant de 8 ans" />
        </div>
        <div className="recap-field">
          <label htmlFor="d-besoin">Votre besoin</label>
          <textarea id="d-besoin" name="besoin" rows={4} required
            value={form.besoin} onChange={change}
            placeholder="Décrivez le niveau, les objectifs, le rythme souhaité…" />
        </div>

        <button type="submit" className="recap-send"
          onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
          Envoyer ma demande de devis
          <span className="recap-send-arrow" aria-hidden="true">→</span>
        </button>
        <p className="recap-reassure">Réponse sous 24h · sans engagement</p>
      </form>
    </div>
  );
}
