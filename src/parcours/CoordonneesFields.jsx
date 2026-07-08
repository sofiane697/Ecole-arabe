/** État initial du formulaire de coordonnées. */
export const emptyCoordForm = {
  elevePrenom: '', eleveNom: '', eleveDateNaissance: '',
  parentPrenom: '', parentNom: '', telephone: '', email: '',
};

/**
 * Découpe le formulaire en { eleve, contact } pour l'envoi.
 *   - Adulte : contact = l'inscrit lui-même.
 *   - Enfant : eleve = l'enfant, contact = le parent.
 */
export function splitIdentity(form, estEnfant) {
  return {
    eleve: {
      prenom: form.elevePrenom.trim(),
      nom: form.eleveNom.trim(),
      dateNaissance: estEnfant ? form.eleveDateNaissance : '',
    },
    contact: {
      prenom: (estEnfant ? form.parentPrenom : form.elevePrenom).trim(),
      nom: (estEnfant ? form.parentNom : form.eleveNom).trim(),
      telephone: form.telephone.trim(),
      email: form.email.trim(),
    },
  };
}

/**
 * Champs de coordonnées du formulaire de préinscription, adaptés au public.
 * Composant contrôlé : le parent (RecapStep / DevisStep) détient l'état `form`.
 *
 * Forme unifiée de `form` :
 *   { elevePrenom, eleveNom, eleveDateNaissance, parentPrenom, parentNom, telephone, email }
 *   - Adulte : elevePrenom/eleveNom = l'inscrit ; champs parent/date ignorés.
 *   - Enfant : elevePrenom/eleveNom + eleveDateNaissance = l'enfant ;
 *              parentPrenom/parentNom + telephone/email = le parent.
 *
 * @param {boolean}  estEnfant Parcours enfant → demande infos enfant + parent.
 * @param {Object}   form      État du formulaire.
 * @param {Function} onChange  Handler d'input (e => …).
 * @param {string}   idPrefix  Préfixe d'id pour éviter les collisions entre écrans.
 */
export default function CoordonneesFields({ estEnfant, form, onChange, idPrefix = 'p' }) {
  const id = (n) => `${idPrefix}-${n}`;

  if (!estEnfant) {
    return (
      <>
        <div className="recap-row2">
          <div className="recap-field">
            <label htmlFor={id('prenom')}>Prénom</label>
            <input id={id('prenom')} name="elevePrenom" type="text" required
              value={form.elevePrenom} onChange={onChange} placeholder="Votre prénom" />
          </div>
          <div className="recap-field">
            <label htmlFor={id('nom')}>Nom</label>
            <input id={id('nom')} name="eleveNom" type="text" required
              value={form.eleveNom} onChange={onChange} placeholder="Votre nom" />
          </div>
        </div>
        <div className="recap-field">
          <label htmlFor={id('tel')}>Téléphone</label>
          <input id={id('tel')} name="telephone" type="tel" required
            value={form.telephone} onChange={onChange} placeholder="+33 6 12 34 56 78" />
        </div>
        <div className="recap-field">
          <label htmlFor={id('email')}>Email</label>
          <input id={id('email')} name="email" type="email" required
            value={form.email} onChange={onChange} placeholder="votre@email.com" />
        </div>
      </>
    );
  }

  return (
    <div className="recap-coord-split">
      <div className="recap-coord-col">
        <p className="recap-group-label">L’enfant</p>
        <div className="recap-row2">
          <div className="recap-field">
            <label htmlFor={id('e-prenom')}>Prénom</label>
            <input id={id('e-prenom')} name="elevePrenom" type="text" required
              value={form.elevePrenom} onChange={onChange} placeholder="Prénom" />
          </div>
          <div className="recap-field">
            <label htmlFor={id('e-nom')}>Nom</label>
            <input id={id('e-nom')} name="eleveNom" type="text" required
              value={form.eleveNom} onChange={onChange} placeholder="Nom" />
          </div>
        </div>
        <div className="recap-field">
          <label htmlFor={id('e-naiss')}>Date de naissance</label>
          <input id={id('e-naiss')} name="eleveDateNaissance" type="date" required
            max={new Date().toISOString().split('T')[0]}
            value={form.eleveDateNaissance} onChange={onChange} />
        </div>
      </div>

      <div className="recap-coord-col">
        <p className="recap-group-label">Le parent (responsable)</p>
        <div className="recap-row2">
          <div className="recap-field">
            <label htmlFor={id('p-prenom')}>Prénom</label>
            <input id={id('p-prenom')} name="parentPrenom" type="text" required
              value={form.parentPrenom} onChange={onChange} placeholder="Prénom" />
          </div>
          <div className="recap-field">
            <label htmlFor={id('p-nom')}>Nom</label>
            <input id={id('p-nom')} name="parentNom" type="text" required
              value={form.parentNom} onChange={onChange} placeholder="Nom" />
          </div>
        </div>
        <div className="recap-field">
          <label htmlFor={id('tel')}>Téléphone</label>
          <input id={id('tel')} name="telephone" type="tel" required
            value={form.telephone} onChange={onChange} placeholder="+33 6 12 34 56 78" />
        </div>
        <div className="recap-field">
          <label htmlFor={id('email')}>Email</label>
          <input id={id('email')} name="email" type="email" required
            value={form.email} onChange={onChange} placeholder="votre@email.com" />
        </div>
      </div>
    </div>
  );
}
