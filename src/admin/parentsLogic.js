// ─── Logique partagée de création / rattachement des parents lors de la
// création d'un élève. Utilisé à la fois par Inscriptions.jsx (conversion
// inscription → élève) et Eleves.jsx (création directe d'élève).
import {
  adminCreateParent, adminFindParentByContact, adminLinkParentEleve,
} from './supabaseAdmin';
import {
  generateIdentifiant, generateTempPassword, normalizeTelephone, formatFoyer,
} from './adminUtils';

/** Structure vide d'un bloc parent (réutilisée en cas A et cas B). */
export function emptyBloc() {
  return {
    has_pere: false, pere_nom: '', pere_prenom: '',
    has_mere: false, mere_nom: '', mere_prenom: '',
    email: '', telephone: '',
    lien: 'parents',
    matchedParent: null,    // résultat de admin_find_parent_by_contact
    useExisting: false,     // true si l'admin a choisi "Rattacher au compte existant"
  };
}

/** Un bloc est utilisable si :
 *    - rattachement à un compte existant (useExisting + matchedParent) → toujours OK
 *    - sinon (création d'un nouveau compte) : au moins un parent coché avec nom/prénom
 *      remplis, ET email + téléphone renseignés.
 *  Les champs du bloc restent vides quand l'admin clique "Rattacher" (le parent
 *  existe déjà côté DB), donc exiger ces champs désactive à tort le bouton submit. */
export function isBlocUtilisable(b) {
  if (!b) return false;
  if (b.useExisting && b.matchedParent) return true;
  const hasParent = (b.has_pere && b.pere_nom && b.pere_prenom) || (b.has_mere && b.mere_nom && b.mere_prenom);
  return hasParent && b.email.trim() !== '' && b.telephone.trim() !== '';
}

/**
 * Cherche un parent existant par email ou téléphone. Met à jour le bloc avec
 * `matchedParent` si un match est trouvé. Appelé depuis onBlur des champs contact.
 */
export async function checkDuplicateParentForBloc(bloc, emailArg, telArg) {
  const email = (emailArg ?? '').trim();
  const tel   = normalizeTelephone(telArg ?? '');
  if (!email && !tel) return { ...bloc, matchedParent: null };
  try {
    const matches = await adminFindParentByContact(email, tel);
    return { ...bloc, matchedParent: (matches && matches[0]) || null };
  } catch {
    return { ...bloc, matchedParent: null };
  }
}

/**
 * Crée / rattache les parents pour un élève donné.
 *
 * Pour chaque bloc utilisable :
 *   • si `useExisting + matchedParent` → appel `admin_link_parent_eleve` (pas de nouveau compte).
 *   • sinon → génère identifiant/mdp + `admin_create_parent`.
 *
 * Continue même si un bloc échoue (l'élève est déjà en DB, on ne peut pas rollback
 * proprement) et renvoie un reporting par bloc : { kind: 'created'|'linked'|'failed', ... }.
 */
export async function processParentBlocs(eleveId, blocsValides) {
  const results = [];
  for (const b of blocsValides) {
    const label = formatFoyer({
      pere_nom:    b.has_pere ? b.pere_nom    : null,
      pere_prenom: b.has_pere ? b.pere_prenom : null,
      mere_nom:    b.has_mere ? b.mere_nom    : null,
      mere_prenom: b.has_mere ? b.mere_prenom : null,
    });

    try {
      if (b.useExisting && b.matchedParent) {
        await adminLinkParentEleve(b.matchedParent.id, eleveId, b.lien || 'parents');
        results.push({
          kind: 'linked',
          label: label || formatFoyer(b.matchedParent),
          identifiant: b.matchedParent.identifiant,
          email: b.matchedParent.email,  // requis pour le mail de rattachement
        });
      } else {
        const principalPrenom = b.has_pere ? b.pere_prenom : b.mere_prenom;
        const principalNom    = b.has_pere ? b.pere_nom    : b.mere_nom;
        const pIdentifiant = generateIdentifiant(principalPrenom, principalNom);
        const pPassword    = generateTempPassword();
        await adminCreateParent({
          identifiant: pIdentifiant,
          password:    pPassword,
          pere_nom:    b.has_pere ? b.pere_nom    : null,
          pere_prenom: b.has_pere ? b.pere_prenom : null,
          mere_nom:    b.has_mere ? b.mere_nom    : null,
          mere_prenom: b.has_mere ? b.mere_prenom : null,
          email:       b.email.trim(),
          telephone:   normalizeTelephone(b.telephone),
          eleve_id:    eleveId,
          lien:        b.lien || 'parents',
        });
        results.push({ kind: 'created', label, identifiant: pIdentifiant, password: pPassword });
      }
    } catch (err) {
      results.push({ kind: 'failed', label, error: err.message || 'Erreur inconnue' });
    }
  }
  return results;
}
