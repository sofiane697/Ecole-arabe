// Re-export pour compat descendante (anciens imports via ./adminUtils)
export { calcAge } from '../shared/dateUtils';

// ─── Génération identifiant : 1ère lettre prénom + 2ème lettre nom + 1ère lettre nom + 4 chiffres
export function generateIdentifiant(prenom, nom) {
  const p = prenom.trim().replace(/\s/g, '');
  const n = nom.trim().replace(/\s/g, '');
  const part1 = (p[0] || 'X').toUpperCase();
  const part2 = (n[1] || n[0] || 'X').toLowerCase();
  const part3 = (n[0] || 'X').toUpperCase();
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const digits = String(1000 + (arr[0] % 9000));
  return `${part1}${part2}${part3}${digits}`;
}

// ─── Génération mot de passe provisoire (8 chars, 1 majuscule, 1 chiffre, 1 spécial)
export function generateTempPassword() {
  const chars    = 'abcdefghijkmnpqrstuvwxyz';
  const upper    = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits   = '23456789';
  const specials = '!@#$%&*?';
  const rnd = (max) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % max;
  };
  let pwd = '';
  pwd += upper[rnd(upper.length)];
  pwd += chars[rnd(chars.length)];
  pwd += digits[rnd(digits.length)];
  pwd += specials[rnd(specials.length)];
  for (let i = 0; i < 4; i++) pwd += chars[rnd(chars.length)];
  // Mélange cryptographiquement sûr (Fisher-Yates)
  const arr = pwd.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

// ─── Normalisation téléphone : retire espaces/tirets/points/parenthèses, +33→0
// Miroir de la fonction SQL normalize_phone — sert à la recherche de doublon
// côté client avant l'appel RPC (affichage immédiat).
export function normalizeTelephone(tel) {
  if (!tel) return '';
  let t = String(tel).replace(/[\s.\-()]/g, '');
  if (t.startsWith('+33')) t = '0' + t.slice(3);
  return t;
}

// ─── Validation stricte format email — mirror de la regex du formulaire public
const EMAIL_RE = /^[^\s@<>'"]+@[^\s@<>'"]+\.[^\s@<>'"]+$/;

// ─── Génération de href mailto: sécurisé — renvoie '#' si email invalide
// Empêche les schemes dangereux (javascript:, data:, vbscript:) qui passeraient
// en XSS si React interpolait brutalement le champ utilisateur.
export function safeMailtoHref(email) {
  const trimmed = (email || '').trim();
  if (!trimmed || !EMAIL_RE.test(trimmed)) return null;
  return `mailto:${trimmed}`;
}

// ─── Génération de href tel: sécurisé — autorise uniquement chiffres/+/-/espace
// Même protection que mailto : un tel contenant `javascript:...` serait XSS.
export function safeTelHref(tel) {
  const trimmed = (tel || '').trim();
  if (!trimmed) return null;
  // Garder uniquement les caractères valides de tel: (RFC 3966 simplifié)
  const cleaned = trimmed.replace(/[^0-9+]/g, '');
  if (cleaned.length < 4) return null;
  return `tel:${cleaned}`;
}

// ─── Helper d'initiales parent (utilisé dans Parents.jsx + EleveParentsSection.jsx)
export function getParentInitials(parent) {
  const a = ((parent?.pere_prenom || parent?.mere_prenom || '')[0]) || '';
  const b = ((parent?.pere_nom || parent?.mere_nom || '')[0]) || '';
  return (a + b).toUpperCase() || 'P';
}

// ─── Normalisation d'affichage des noms/prénoms de parents
// - Prénom : 1ère lettre majuscule, reste minuscule (Jean, Marie, Jean-Paul)
// - Nom    : tout en majuscules (DUPONT)
// Appliqué côté AFFICHAGE uniquement — la donnée brute en DB n'est pas touchée.
const formatPrenomDisplay = (s) => {
  const v = (s || '').trim();
  if (!v) return v;
  // Gère les prénoms composés : Jean-Paul, Marie-Ange
  return v.split(/([\s\-])/).map(part => {
    if (part === '' || part === ' ' || part === '-') return part;
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join('');
};
const formatNomDisplay = (s) => (s || '').trim().toUpperCase();

// ─── Formatage du libellé d'un foyer à partir des 4 champs père/mère
// Applique automatiquement :
//   - Prénom en casse titre  (Jean, Marie)
//   - Nom en MAJUSCULES      (DUPONT)
// Retourne par ordre de priorité :
//   "M. et Mme DUPONT"                 — couple, même nom
//   "M. Jean DUPONT et Mme Marie DURAND" — couple, noms différents
//   "M. Jean DUPONT"                   — père seul
//   "Mme Marie DURAND"                 — mère seule
//   ""                                 — rien saisi
export function formatFoyer({ pere_nom, pere_prenom, mere_nom, mere_prenom } = {}) {
  const hasPere = Boolean(pere_nom || pere_prenom);
  const hasMere = Boolean(mere_nom || mere_prenom);
  const pNom  = formatNomDisplay(pere_nom);
  const pPren = formatPrenomDisplay(pere_prenom);
  const mNom  = formatNomDisplay(mere_nom);
  const mPren = formatPrenomDisplay(mere_prenom);
  const pere  = [pPren, pNom].filter(Boolean).join(' ').trim();
  const mere  = [mPren, mNom].filter(Boolean).join(' ').trim();

  if (hasPere && hasMere) {
    if (pNom && mNom && pNom === mNom) {
      return `M. et Mme ${pNom}`;
    }
    return `M. ${pere} et Mme ${mere}`.replace(/\s+/g, ' ').trim();
  }
  if (hasPere) return `M. ${pere}`.trim();
  if (hasMere) return `Mme ${mere}`.trim();
  return '';
}
