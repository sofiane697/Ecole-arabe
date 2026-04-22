// ─── Helpers de formatage des noms/prénoms d'élèves et enseignants ──────────
// Capitalise le prénom (1ère lettre maj, reste minuscule) avec un trim défensif.
export const fmtPrenom = (s) => {
  const v = (s || '').trim();
  return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v;
};

// Nom en majuscules, avec un trim défensif.
export const fmtNom = (s) => (s || '').trim().toUpperCase();
