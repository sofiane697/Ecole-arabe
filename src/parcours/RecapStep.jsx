import { useState } from 'react';
import gsap from 'gsap';
import CoordonneesFields, { emptyCoordForm, splitIdentity } from './CoordonneesFields';
import { submitPreinscription, derivePathMeta } from './supabasePreinscription';

const btnEnter = (e) => gsap.to(e.currentTarget, { y: -2, duration: 0.25, ease: 'power3.out' });
const btnLeave = (e) => gsap.to(e.currentTarget, { y: 0, duration: 0.25, ease: 'power3.out' });

/**
 * Écran récapitulatif (« compte rendu ») : résumé du pack choisi + formulaire.
 * Layout « checkout » : panneau Votre sélection à gauche, coordonnées à droite.
 * L'envoi écrit réellement en base via la RPC `submit_preinscription`.
 *
 * @param {Array}    path  Nœuds traversés (pôle → public → matière)
 * @param {Object}   tarif Tarif sélectionné
 * @param {Function} onSent Appelé après envoi réussi
 */
export default function RecapStep({ path, tarif, onSent }) {
  const [form, setForm]       = useState(emptyCoordForm);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const { est_enfant: estEnfant } = derivePathMeta(path);
  const formuleNom = tarif.niveau || tarif.titre;
  const prix = tarif.prix != null ? `${tarif.prix} €` : tarif.prixNote;

  const submit = async (e) => {
    e.preventDefault();
    setSending(true); setError('');
    try {
      const { eleve, contact } = splitIdentity(form, estEnfant);
      await submitPreinscription({
        type: 'tarif',
        path,
        formule: {
          nom: formuleNom,
          prix: typeof tarif.prix === 'number' ? tarif.prix : null,
          rythme: tarif.rythme || null,
        },
        eleve, contact, estEnfant,
      });
      onSent({ choix: path.map((n) => n.label), coord: { prenom: contact.prenom } });
    } catch (err) {
      setError(err.message || "L’envoi a échoué, réessayez.");
    } finally {
      setSending(false);
    }
  };

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
        <div className="recap-eyebrow">
          {estEnfant ? 'Coordonnées' : 'Vos coordonnées'}
        </div>

        <CoordonneesFields estEnfant={estEnfant} form={form} onChange={change} idPrefix="r" />

        {error && <p className="recap-error">{error}</p>}

        <button type="submit" className="recap-send" disabled={sending}
          onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
          {sending ? 'Envoi…' : 'Envoyer ma demande'}
          {!sending && <span className="recap-send-arrow" aria-hidden="true">→</span>}
        </button>
        <p className="recap-reassure">Réponse sous 24h · sans engagement</p>
      </form>
    </div>
  );
}
