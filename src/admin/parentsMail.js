// ─── Dispatch des emails post-création d'un élève ──────────────────────────
// Appelé à la fin de handleSubmit (Eleves.jsx) et handleActivateEleve (Inscriptions.jsx),
// après processParentBlocs. Centralise la logique de choix du mail :
//   - mail de bienvenue (welcome) → à l'email de contact de l'élève, avec les
//     identifiants élève + parents nouvellement créés
//   - mail de rattachement (attach) → à chaque parent existant rattaché, indépendant
//     de l'email de contact élève
//
// Tous les envois sont best-effort (.catch(() => {})) : une erreur d'envoi mail
// ne doit pas rollback la création du compte qui a déjà réussi.
import { sendWelcomeEmail, sendParentAttachEmail } from './supabaseAdmin';

/**
 * @param {object} opts
 * @param {string|null} opts.contactEmail        email de contact de l'élève (peut être vide)
 * @param {string} opts.elevePrenom              prénom formaté de l'élève
 * @param {string} opts.eleveNom                 nom formaté de l'élève
 * @param {string} opts.eleveIdentifiant         identifiant de connexion généré
 * @param {string} opts.eleveTempPassword        mot de passe provisoire
 * @param {string|null} opts.classeNom           libellé de classe ou null
 * @param {Array} opts.parentResults             résultats de processParentBlocs
 * @param {boolean} [opts.sendWelcome=true]      false pour élève inactif (pas de welcome)
 */
export function dispatchPostCreationEmails({
  contactEmail,
  elevePrenom,
  eleveNom,
  eleveIdentifiant,
  eleveTempPassword,
  classeNom,
  parentResults,
  sendWelcome = true,
}) {
  // Mail de bienvenue à l'email de contact de l'élève.
  if (sendWelcome && contactEmail && contactEmail.trim() !== '') {
    const createdParents = parentResults
      .filter(r => r.kind === 'created')
      .map(r => ({ label: r.label, identifiant: r.identifiant, password: r.password }));
    sendWelcomeEmail({
      email:        contactEmail.trim(),
      prenom:       elevePrenom,
      nom:          eleveNom,
      identifiant:  eleveIdentifiant,
      tempPassword: eleveTempPassword,
      classeNom,
      parents:      createdParents,
    }).catch(() => {});
  }

  // Mail de rattachement pour chaque parent existant rattaché au nouvel enfant.
  // Envoyé même si l'élève n'a pas d'email de contact (on a celui du parent).
  for (const r of parentResults) {
    if (r.kind === 'linked' && r.email) {
      sendParentAttachEmail({
        email:        r.email,
        foyerLabel:   r.label,
        identifiant:  r.identifiant,
        elevePrenom,
        eleveNom,
        classeNom,
      }).catch(() => {});
    }
  }
}
