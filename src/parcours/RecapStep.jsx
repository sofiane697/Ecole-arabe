import { useState } from 'react';
import gsap from 'gsap';

const btnEnter = (e) => gsap.to(e.currentTarget, { y: -2, duration: 0.25, ease: 'power3.out' });
const btnLeave = (e) => gsap.to(e.currentTarget, { y: 0, duration: 0.25, ease: 'power3.out' });

/**
 * Écran récapitulatif (« compte rendu ») : résumé du pack choisi + formulaire.
 * Layout « checkout » : panneau Votre sélection à gauche, coordonnées à droite.
 * PROTOTYPE — l'envoi est factice (pas d'écriture Supabase pour l'instant).
 *
 * @param {Array}    path  Nœuds traversés (pôle → public → matière)
 * @param {Object}   tarif Tarif sélectionné
 * @param {Function} onSent Appelé quand le formulaire est « envoyé »
 */
export default function RecapStep({ path, tarif, onSent }) {
  const [coord, setCoord] = useState({ prenom: '', nom: '', telephone: '', email: '' });
  const change = (e) => setCoord((c) => ({ ...c, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    // ⚠️ PROTOTYPE : on ne fait que remonter le pack. Aucun envoi réseau.
    onSent({ choix: path.map((n) => n.label), tarif, coord });
  };

  const formuleNom = tarif.niveau || tarif.titre;
  const prix = tarif.prix != null ? `${tarif.prix} €` : tarif.prixNote;

  return (
    <div className="recap parcours-anim">
      {/* ─ Colonne résumé / pack ─ */}
      <aside className="recap-summary">
        <div className="recap-eyebrow">Votre sélection</div>

        <nav className="recap-path">
          {path.map((n, i) => (
            <span className="recap-crumb" key={n.id}>
              {i > 0 && <span className="recap-sep">›</span>}
              {n.label}
            </span>
          ))}
        </nav>

        <div className="recap-formule">
          <span className="recap-formule-nom">{formuleNom}</span>
          {tarif.ar && <span className="recap-formule-ar">{tarif.ar}</span>}
        </div>
        {tarif.rythme && <p className="recap-rythme">{tarif.rythme}</p>}

        {tarif.features?.length > 0 && (
          <ul className="recap-feats">
            {tarif.features.map((f, i) => (
              <li key={i}><span className="tarif-check" aria-hidden="true" />{f}</li>
            ))}
          </ul>
        )}

        <div className="recap-total">
          <span className="recap-total-label">Tarif</span>
          <span className="recap-total-val">{prix}</span>
        </div>
      </aside>

      {/* ─ Colonne formulaire ─ */}
      <form className="recap-form" onSubmit={submit}>
        <div className="recap-eyebrow">Vos coordonnées</div>

        <div className="recap-row2">
          <div className="recap-field">
            <label htmlFor="r-prenom">Prénom</label>
            <input id="r-prenom" name="prenom" type="text" required
              value={coord.prenom} onChange={change} placeholder="Votre prénom" />
          </div>
          <div className="recap-field">
            <label htmlFor="r-nom">Nom</label>
            <input id="r-nom" name="nom" type="text" required
              value={coord.nom} onChange={change} placeholder="Votre nom" />
          </div>
        </div>
        <div className="recap-field">
          <label htmlFor="r-tel">Téléphone</label>
          <input id="r-tel" name="telephone" type="tel" required
            value={coord.telephone} onChange={change} placeholder="+33 6 12 34 56 78" />
        </div>
        <div className="recap-field">
          <label htmlFor="r-email">Email</label>
          <input id="r-email" name="email" type="email" required
            value={coord.email} onChange={change} placeholder="votre@email.com" />
        </div>

        <button type="submit" className="recap-send"
          onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
          Envoyer ma demande
          <span className="recap-send-arrow" aria-hidden="true">→</span>
        </button>
        <p className="recap-reassure">Réponse sous 24h · sans engagement</p>
      </form>
    </div>
  );
}
