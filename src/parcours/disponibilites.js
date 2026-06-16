// ─── Disponibilités proposées (parcours adulte) ─────────────────────────────
// L'inscrit adulte choisit ses créneaux, ou « Aucune préférence ».
//   - En semaine : un jour (Lundi→Vendredi) PUIS un/des créneaux pour ce jour.
//     Stocké comme libellé combiné « Lundi · Matin (9h–11h) ».
//   - Week-end : le jour est déjà dans le libellé (« Samedi (9h–12h) »).

export const DISPO_AUCUNE = 'Aucune préférence';

export const DISPO_JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export const DISPO_CRENEAUX_SEMAINE = [
  'Matin (9h–11h)',
  'Après-midi (14h–16h)',
  'Soirée (18h–20h)',
];

// Côté enfant : en semaine, uniquement la soirée (même horaire que l'adulte).
export const DISPO_CRENEAUX_SEMAINE_ENFANT = ['Soirée (18h–20h)'];

// Week-end : chaque jour a ses propres créneaux.
export const DISPO_WEEKEND_JOURS = [
  { jour: 'Samedi', creneaux: ['9h–12h', '14h–17h'] },
  { jour: 'Dimanche', creneaux: ['9h–12h', '14h–17h'] },
];

/** Libellé combiné d'un créneau en semaine : « Lundi · Matin (9h–11h) ». */
export function weekLabel(jour, creneau) {
  return `${jour} · ${creneau}`;
}

/** Libellé combiné d'un créneau le week-end : « Samedi (9h–12h) ». */
export function weekendLabel(jour, creneau) {
  return `${jour} (${creneau})`;
}

/**
 * Retire de la sélection tous les créneaux rattachés à un jour donné.
 * Préfixe `${jour} ` (jour + espace) → couvre les deux formats :
 *   semaine « Lundi · … » et week-end « Samedi (… ».
 * Pas de collision : les jours sont distincts et « Mardi » ne matche pas « Mar ».
 */
export function removeJour(current, jour) {
  return current.filter((v) => !v.startsWith(`${jour} `));
}

/**
 * Bascule une disponibilité dans la sélection.
 * « Aucune préférence » est exclusive :
 *   - la choisir vide tout le reste,
 *   - choisir un créneau retire « Aucune préférence ».
 *
 * @param {string[]} current Sélection actuelle
 * @param {string}   value   Créneau (ou DISPO_AUCUNE) à basculer
 * @returns {string[]} nouvelle sélection
 */
export function toggleDispo(current, value) {
  if (value === DISPO_AUCUNE) {
    return current.includes(DISPO_AUCUNE) ? [] : [DISPO_AUCUNE];
  }
  const base = current.filter((v) => v !== DISPO_AUCUNE);
  return base.includes(value)
    ? base.filter((v) => v !== value)
    : [...base, value];
}
