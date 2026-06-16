import { useState } from 'react';
import gsap from 'gsap';
import CoordonneesFields, { emptyCoordForm, splitIdentity } from './CoordonneesFields';
import { submitPreinscription, derivePathMeta } from './supabasePreinscription';

const btnEnter = (e) => gsap.to(e.currentTarget, { y: -2, duration: 0.25, ease: 'power3.out' });
const btnLeave = (e) => gsap.to(e.currentTarget, { y: 0, duration: 0.25, ease: 'power3.out' });

/**
 * Écran « Devis personnalisé » : pas de tarif fixe.
 * Le visiteur décrit son besoin (sujet + message) + ses coordonnées.
 * Layout « checkout » réutilisé. L'envoi écrit en base via `submit_preinscription`.
 *
 * @param {Array}    path   Nœuds traversés (pôle → … → Devis / Accompagnement)
 * @param {Function} onSent Appelé après envoi réussi
 */
export default function DevisStep({ path, onSent }) {
  const [form, setForm]       = useState({ ...emptyCoordForm, sujet: '', besoin: '' });
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const { est_enfant: estEnfant } = derivePathMeta(path);
  // Intitulé = dernier nœud du parcours (« Devis personnalisé » / « Accompagnement spécifique »)
  const titre = path[path.length - 1]?.label || 'Devis personnalisé';

  const submit = async (e) => {
    e.preventDefault();
    setSending(true); setError('');
    try {
      const { eleve, contact } = splitIdentity(form, estEnfant);
      await submitPreinscription({
        type: 'devis',
        path,
        devis: { sujet: form.sujet.trim(), besoin: form.besoin.trim() },
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
          <span className="recap-formule-nom">{titre}</span>
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
        <div className="recap-eyebrow">
          {estEnfant ? 'Coordonnées' : 'Vos coordonnées'}
        </div>

        <CoordonneesFields estEnfant={estEnfant} form={form} onChange={change} idPrefix="d" />

        <p className="recap-group-label">Votre besoin</p>
        <div className="recap-field">
          <label htmlFor="d-sujet">Sujet</label>
          <input id="d-sujet" name="sujet" type="text" required
            value={form.sujet} onChange={change} placeholder="Ex. : Coran pour mon enfant de 8 ans" />
        </div>
        <div className="recap-field">
          <label htmlFor="d-besoin">Décrivez votre besoin</label>
          <textarea id="d-besoin" name="besoin" rows={4} required
            value={form.besoin} onChange={change}
            placeholder="Niveau, objectifs, rythme souhaité…" />
        </div>

        {error && <p className="recap-error">{error}</p>}

        <button type="submit" className="recap-send" disabled={sending}
          onMouseEnter={btnEnter} onMouseLeave={btnLeave}>
          {sending ? 'Envoi…' : 'Envoyer ma demande de devis'}
          {!sending && <span className="recap-send-arrow" aria-hidden="true">→</span>}
        </button>
      </form>
    </div>
  );
}
