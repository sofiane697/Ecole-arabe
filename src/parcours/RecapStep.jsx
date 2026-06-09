import { useState } from 'react';
import gsap from 'gsap';

const btnEnter = (e) => gsap.to(e.currentTarget, { y: -2, duration: 0.25, ease: 'power3.out' });
const btnLeave = (e) => gsap.to(e.currentTarget, { y: 0, duration: 0.25, ease: 'power3.out' });

/**
 * Écran récapitulatif : résumé des choix + formulaire de coordonnées.
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

  return (
    <div className="recap parcours-anim">
      <div className="recap-list">
        {path.map((node) => (
          <div className="recap-row" key={node.id}>
            <span className="recap-key">{node.label}</span>
            {node.ar && <span className="recap-val">{node.ar}</span>}
          </div>
        ))}
        <div className="recap-row">
          <span className="recap-key">Formule</span>
          <span className="recap-val">{tarif.niveau || tarif.titre}</span>
        </div>
        <div className="recap-row recap-total">
          <span className="recap-key">Tarif</span>
          <span className="recap-val">{tarif.prix != null ? `${tarif.prix} €` : tarif.prixNote}</span>
        </div>
      </div>

      <form className="recap-form" onSubmit={submit}>
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
        <div className="recap-row2">
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
        </div>
        <button type="submit" className="recap-send"
          onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
          Envoyer ma demande
        </button>
      </form>
    </div>
  );
}
