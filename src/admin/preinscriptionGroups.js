// Classe les préinscriptions par "format". L'adulte n'a pas de format
// (cours présentiel) → section dédiée. Logique pure, testée à part du rendu.

// Ordre d'affichage fixe des sections. "autres" = filet de sécurité.
export const FORMAT_SECTIONS = [
  { key: 'autonomie',       label: 'Autonomie' },
  { key: 'visioconference', label: 'Visioconférence' },
  { key: 'particulier',     label: 'Cours particulier' },
  { key: 'adulte',          label: 'Adulte — présentiel' },
  { key: 'autres',          label: 'Autres' },
];

// Formats enfant valides, dérivés de FORMAT_SECTIONS (source unique de vérité) :
// toutes les sections sauf 'adulte' (présentiel) et 'autres' (filet de sécurité).
const KNOWN_FORMATS = new Set(
  FORMAT_SECTIONS.map((s) => s.key).filter((k) => k !== 'adulte' && k !== 'autres')
);

/** Clé de section d'une préinscription. */
export function sectionOf(p) {
  if (!p.est_enfant) return 'adulte';
  return KNOWN_FORMATS.has(p.format) ? p.format : 'autres';
}

/**
 * Regroupe une liste par format, dans l'ordre fixe, sections vides exclues.
 * @returns {Array<{key:string,label:string,items:Array}>}
 */
export function groupByFormat(list) {
  const buckets = new Map();
  for (const p of list) {
    const key = sectionOf(p);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(p);
  }
  return FORMAT_SECTIONS
    .filter((s) => buckets.has(s.key))
    .map((s) => ({ key: s.key, label: s.label, items: buckets.get(s.key) }));
}
