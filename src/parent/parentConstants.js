// Constantes partagées du portail parent — évite de dupliquer entre pages.

// Système de notes lettres (aligné sur profils_eleves : A+=4, A=3, ECA=2, NA=1).
export const SCORE_LABEL = { 4: 'A+', 3: 'A', 2: 'ECA', 1: 'NA' };
export const SCORE_COLOR = { 4: '#30d158', 3: '#5ac8fa', 2: '#ff9f0a', 1: '#ff453a' };
export const SCORE_SUB = {
  4: 'Très bien maîtrisé',
  3: 'Maîtrisé',
  2: "En cours d'acquisition",
  1: 'Non acquis',
};
