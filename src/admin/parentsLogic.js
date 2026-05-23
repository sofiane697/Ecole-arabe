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
  return hasParent && (b.email.trim() !== '' || b.telephone.trim() !== '');
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
 * Détermine le mode UI initial d'un ParentBloc :
 *   - 'create' si le bloc a déjà des données de saisie (au moins un parent coché
 *     OU un nom/prénom renseigné OU un email/téléphone saisi)
 *   - 'search' sinon (défaut pour un nouveau bloc)
 *
 * Note : le cas `useExisting + matchedParent` n'est PAS un mode UI — il prend
 * le pas via la bannière verte "Rattaché".
 */
export function initialBlocMode(bloc) {
  if (!bloc) return 'search';
  const hasData = Boolean(
    bloc.has_pere || bloc.has_mere ||
    bloc.pere_nom || bloc.pere_prenom ||
    bloc.mere_nom || bloc.mere_prenom ||
    bloc.email || bloc.telephone
  );
  return hasData ? 'create' : 'search';
}

/**
 * Pour un index de bloc donné, retourne la liste des `matchedParent.id` des
 * AUTRES blocs du wizard. Utilisé pour exclure les parents déjà rattachés de
 * la recherche (évite les doublons en mode séparés : Parent I et Parent II
 * ne peuvent pas pointer sur le même compte).
 */
export function excludedParentIdsFor(blocs, currentIndex) {
  if (!Array.isArray(blocs)) return [];
  return blocs
    .filter((_, i) => i !== currentIndex)
    .map(b => b?.matchedParent?.id)
    .filter(Boolean);
}

/**
 * Ultime check duplicate au submit : pour chaque bloc utilisable qui va créer
 * un NOUVEAU parent (ni `useExisting` ni `matchedParent` déjà posés), relance
 * `checkDuplicateParentForBloc` avec les contacts saisis. Renvoie :
 *   - `refreshedBlocs` : la liste des blocs avec `matchedParent` éventuellement posé
 *   - `needsReview`    : true si un match a été trouvé → l'admin doit arbitrer
 *
 * Appelé avant `processParentBlocs` dans Eleves.jsx et Inscriptions.jsx pour
 * éviter les doublons silencieux quand l'admin clique "Créer" avant que
 * l'onBlur des champs contact n'ait eu le temps de déclencher la recherche.
 */
export async function checkDuplicatesOnSubmit(blocs) {
  const refreshedBlocs = [...blocs];
  let needsReview = false;
  for (let i = 0; i < refreshedBlocs.length; i++) {
    const b = refreshedBlocs[i];
    if (!isBlocUtilisable(b)) continue;
    if (b.useExisting && b.matchedParent) continue; // admin a déjà choisi
    if (b.matchedParent) { needsReview = true; continue; }
    if (!b.email?.trim() && !b.telephone?.trim()) continue;
    const refreshed = await checkDuplicateParentForBloc(b, b.email, b.telephone);
    if (refreshed.matchedParent) {
      refreshedBlocs[i] = refreshed;
      needsReview = true;
    }
  }
  return { refreshedBlocs, needsReview };
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
        const pIdentifiant = generateIdentifiant(principalPrenom, principalNom).toLowerCase();
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
